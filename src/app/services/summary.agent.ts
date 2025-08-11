import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import type { WebAsset, HostAsset } from "@/api/v1/assets/models/asset.schema";
import {
  WebAssetSummarySchema,
  HostAssetSummarySchema,
  type WebAssetSummary,
  type HostAssetSummary,
  type DataCoverage
} from "@/api/v1/assets/models/asset-summary.schema";
import { saveWebAssetSummary, saveHostAssetSummary } from "@/api/v1/assets/asset-summary.store";
import { instructions, host_evidence, host_conditions, web_evidence, web_conditions } from "./summary.agent.prompt";
import Mustache from "mustache";
import logger from "@/utils/logger";

// LLM-specific schemas (no .loose() for structured output compatibility)
const DataCoverageSchemaLLM = z.object({
  fields_present_pct: z.number().min(0).max(100),
  missing_fields: z.array(z.string()),
});

const LLMAssetSummarySchema = z.object({
  id: z.string(),
  summary: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidence: z.record(z.any()), // Use record for flexible key-value pairs
  evidence_extras: z.array(z.string()),
  findings: z.array(z.string()),
  recommendations: z.array(z.string()),
  assumptions: z.array(z.string()),
  data_coverage: DataCoverageSchemaLLM,
});

export interface SummaryJobPayload {
  asset: WebAsset | HostAsset;
  assetType: 'web' | 'host';
}

// Define state annotation for the graph
const GraphStateAnnotation = Annotation.Root({
  asset: Annotation<WebAsset | HostAsset>,
  assetType: Annotation<'web' | 'host'>,
  summary: Annotation<WebAssetSummary | HostAssetSummary | undefined>,
  validationFeedback: Annotation<string | undefined>,
  attemptCount: Annotation<number>,
  isValid: Annotation<boolean>,
});

type GraphState = typeof GraphStateAnnotation.State;

const llm = new ChatOpenAI({
  model: "gpt-5-mini",
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0,
  maxRetries: 0, // Graph handles retries
  timeout: 30000,
});

// Create and compile workflow once at module load using fluent chaining
const summaryWorkflow = new StateGraph(GraphStateAnnotation)
  .addNode("generate", summaryNode)
  .addNode("validate", validationNode)
  .addEdge("__start__", "generate")
  .addEdge("generate", "validate")
  .addConditionalEdges("validate", shouldRetry)
  .compile();



function getTemplateData(assetType: string): { assetEvidence: string; conditions: string } {
  return assetType === "web"
    ? { assetEvidence: web_evidence, conditions: web_conditions }
    : { assetEvidence: host_evidence, conditions: host_conditions };
}


async function summaryNode(state: GraphState): Promise<Partial<GraphState>> {
  const assetId = state.asset.id;
  const attemptNum = state.attemptCount + 1;
  const startTime = Date.now();

  logger.info({ assetId, attempt: attemptNum }, "Generating summary");

  try {
    const templateData = getTemplateData(state.assetType);

    const basePrompt = Mustache.render(instructions, templateData);

    const messages = [
      new SystemMessage(basePrompt),
      new HumanMessage(`ASSET_JSON:\n${JSON.stringify(state.asset, null, 2)}`),
    ];

    // Add validation feedback as separate message if retrying
    if (state.validationFeedback) {
      messages.push(new HumanMessage(`VALIDATION FEEDBACK: ${state.validationFeedback}\n\nPlease address these issues and regenerate the summary.`));
    }

    // For now, use regular LLM without structured output to test validation flow
    const result = await llm.invoke(messages);
    const content = result.content as string;

    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in LLM response");
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    const duration = Date.now() - startTime;
    logger.info({ assetId, attempt: attemptNum, duration }, "Summary generated");

    // Return LLM result with asset ID - store handles any additional transformation
    return {
      summary: { ...parsedResult, id: assetId },
      attemptCount: attemptNum
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error({ assetId, attempt: attemptNum, duration, error: error.message }, "Summary generation failed");

    // Return error as validation feedback for retry
    return {
      attemptCount: attemptNum,
      validationFeedback: `Generation error: ${error.message}. Please try again with simpler output.`
    };
  }
}

async function validationNode(state: GraphState): Promise<Partial<GraphState>> {
  const assetId = state.asset.id;
  logger.info({ assetId }, "Validating summary");

  if (!state.summary) {
    return { isValid: false, validationFeedback: "No summary to validate" };
  }

  try {
    const validationPrompt = `
    # MISSION
    Validate a candidate asset summary (web or host) against the raw asset data. Return ONLY a pass/fail with a list of problems.
    Respond ONLY with JSON schema in OUTPUT_JSON.

    # OUTPUT_JSON
    {
      "status": "pass|fail",
      "problems": [
        "the found problem text"
      ]
    }

    # INPUTS
    - ASSET_JSON
    - SUMMARY_JSON
    - NOW_UTC_ISO
    - EVIDENCE_SPEC
    - CONDITIONS

    # EVIDENCE KEYS
    - If EVIDENCE_SPEC provided: any evidence key not in spec → UNKNOWN_EVIDENCE_KEY; any spec key missing → MISSING_EVIDENCE_KEY.

    - DERIVED FIELDS
      - If evidence contains days_to_expiry and a sibling not_after, compute expected=floor((not_after - NOW_UTC_ISO)/days). If |reported-expected|>2 → DERIVED_MISMATCH.

    - QUALITY
      - summary must be 2–4 sentences; else QUALITY_ISSUE.
      - findings ≤5; recommendations ≤4; each item concise; else QUALITY_ISSUE.

    # DECISION
    - If no problems were recorded → {"status":"pass","problems":[]}
    - If one or more problems were recorded → {"status":"fail","problems":[...]}

    # CONSTRAINTS
    - Deterministic; use only
      - ASSET_JSON
      - SUMMARY_JSON
      - NOW_UTC_ISO
      - EVIDENCE_SPEC
      - CONDITIONS
    - Return ONLY the JSON object defined in OUTPUT_JSON. No extra prose. No comments.
    `;

    // Get template data for evidence spec and conditions
    const templateData = getTemplateData(state.assetType);
    const nowUtcIso = new Date().toISOString();

    const messages = [
      new SystemMessage(validationPrompt),
      new HumanMessage(`ASSET_JSON:\n${JSON.stringify(state.asset, null, 2)}`),
      new HumanMessage(`SUMMARY_JSON:\n${JSON.stringify(state.summary, null, 2)}`),
      new HumanMessage(`NOW_UTC_ISO:\n${nowUtcIso}`),
      new HumanMessage(`EVIDENCE_SPEC:\n${templateData.assetEvidence}`),
      new HumanMessage(`CONDITIONS:\n${templateData.conditions}`),
    ];

    const response = await llm.invoke(messages);
    const validationResult = response.content as string;

    logger.info({ assetId, validationResult }, "Raw validation response");

    // Parse the JSON response to determine validity
    let isValid = false;
    let validationFeedback: string | undefined;

    try {
      const parsedResult = JSON.parse(validationResult);
      isValid = parsedResult.status === "pass";
      validationFeedback = isValid ? undefined : `Validation failed: ${parsedResult.problems.join("; ")}`;
    } catch (parseError) {
      // Fallback to string matching if JSON parsing fails
      isValid = validationResult.trim().toLowerCase().includes('"status":"pass"');
      validationFeedback = isValid ? undefined : validationResult;
    }

    logger.info({ assetId, isValid, validationFeedback }, "Validation completed");
    return { isValid, validationFeedback };

  } catch (error: any) {
    logger.error({ assetId, error: error.message }, "Validation failed");
    return { isValid: false, validationFeedback: `Validation error: ${error.message}` };
  }
}

function shouldRetry(state: GraphState): "generate" | "__end__" {
  // End if validation passed OR we've reached max attempts
  if (state.isValid || state.attemptCount >= 2) return "__end__";
  return "generate";
}

export async function generateSummary(payload: SummaryJobPayload): Promise<void> {
  const { asset, assetType } = payload;
  const assetId = asset.id;

  logger.info({ assetId, assetType }, "Starting summary generation");

  const finalState = await summaryWorkflow.invoke({
    asset,
    assetType,
    attemptCount: 0,
    isValid: false,
  });

  // Check if we have a summary to save
  if (!finalState.summary) {
    throw new Error(`Summary generation failed after ${finalState.attemptCount} attempts - no summary generated`);
  }

  // Log validation issues but proceed with saving the summary
  if (!finalState.isValid) {
    logger.error({
      assetId,
      assetType,
      attempts: finalState.attemptCount,
      validationFeedback: finalState.validationFeedback
    }, "Summary validation failed after max attempts - proceeding with generated summary");
  }

  // Persist summary
  if (assetType === "web") {
    await saveWebAssetSummary(finalState.summary as WebAssetSummary);
  } else {
    await saveHostAssetSummary(finalState.summary as HostAssetSummary);
  }

  const status = finalState.isValid ? "completed successfully" : "completed with validation issues";
  logger.info({
    assetId,
    assetType,
    attempts: finalState.attemptCount,
    validationPassed: finalState.isValid
  }, `Summary generation ${status}`);
}
