import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatRequest, ChatResponse, Message } from "./models/chat.schema";
import {instructions as instructionTpl} from "./chat.service.prompt";
import Mustache from "mustache";
import logger from "@/utils/logger";
import * as assetService from "@/api/v1/assets/assets.service";
import * as summaryStore from "@/api/v1/assets/asset-summary.store";

/**
 * Process a chat request with optional asset/summary context via LLM.
 * @param request Chat request containing messages and optional asset/summary IDs.
 * @returns Promise resolving to chat response with assistant message.
 */
export async function processChat(request: ChatRequest): Promise<ChatResponse> {
  // Initialize LLM instance inside function for better testability
  const llm = new ChatOpenAI({
    model: "gpt-5-mini",
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Debug logging
    logger.debug({ request }, "Chat service received request");

    // Fetch asset data if assetId is provided
    let assetData = null;
    if (request.assetId && request.assetType) {
      logger.debug({ assetId: request.assetId, assetType: request.assetType }, "Attempting to fetch asset data");
      try {
        if (request.assetType === "web") {
          assetData = await assetService.getWebAssetById(request.assetId);
        } else if (request.assetType === "host") {
          assetData = await assetService.getHostAssetById(request.assetId);
        }
        logger.debug({ assetData: assetData ? 'Found' : 'Not found', assetId: request.assetId }, "Fetched asset data");
      } catch (error) {
        logger.error({ error, assetId: request.assetId }, "Failed to fetch asset data");
      }
    } else {
      logger.debug("No assetId or assetType provided, skipping asset fetch");
    }

    // Fetch summary data if summaryId is provided
    let summaryData = null;
    if (request.summaryId) {
      logger.debug({ summaryId: request.summaryId }, "Attempting to fetch summary data");
      try {
        // Try both web and host summary stores since summaryId should be unique
        summaryData = await summaryStore.getWebAssetSummaryById(request.summaryId);
        if (!summaryData) {
          summaryData = await summaryStore.getHostAssetSummaryById(request.summaryId);
        }
        logger.debug({ summaryData: summaryData ? 'Found' : 'Not found', summaryId: request.summaryId }, "Fetched summary data");
      } catch (error) {
        logger.error({ error, summaryId: request.summaryId }, "Failed to fetch summary data");
      }
    } else {
      logger.debug("No summaryId provided, skipping summary fetch");
    }

    // Build system message with asset context
    const systemMessage = buildSystemMessage(assetData, summaryData);
    logger.debug({ systemMessage }, "Generated system message");
    logger.debug({ hasAssetData: !!assetData, hasSummaryData: !!summaryData }, "Context data availability");

    // Transform input messages to LangChain format (filtering out system messages)
    const inputMessages = transformInputMessages(request.messages);

    // Combine system message with transformed input messages
    const messages = [new SystemMessage(systemMessage), ...inputMessages];

    // Send to OpenAI via LangChain
    const response = await llm.invoke(messages);

    // Extract usage information if available
    const usage = response.response_metadata?.tokenUsage ? {
      prompt_tokens: response.response_metadata.tokenUsage.promptTokens,
      completion_tokens: response.response_metadata.tokenUsage.completionTokens,
      total_tokens: response.response_metadata.tokenUsage.totalTokens,
    } : undefined;

    return {
      message: {
        role: "assistant",
        content: response.content as string,
      }
    };
  } catch (error) {
    // Log the actual error for debugging
    logger.error({ error }, "Chat service error");

    // Return generic user-friendly message
    return {
      message: {
        role: "assistant",
        content: "I'm currently experiencing technical difficulties. Please try again in a few moments.",
      },
    };
  }
}

/**
 * Build system prompt with asset context
 */
function buildSystemMessage(assetData?: any, summaryData?: any): string {
    if (!assetData && !summaryData) {
      return "You are a cybersecurity AI assistant. Help users analyze and understand their security assets.";
    }

    // Convert asset data to string format for template
    const templateData: any = {};

    if (assetData) {
      templateData.assetData = JSON.stringify(assetData, null, 2);
    }

    if (summaryData) {
      templateData.summaryData = JSON.stringify(summaryData, null, 2);
    }

    logger.debug({ templateDataKeys: Object.keys(templateData) }, "Template data keys");

    const instructions = Mustache.render(instructionTpl, templateData);
    return instructions;
  }

/**
 * Transform input messages to LangChain format
 * Filters out system messages and converts only user/assistant messages
 */
function transformInputMessages(messages: Message[]) {
    const langChainMessages = [];

    // Convert only user and assistant messages, filtering out system messages
    for (const message of messages) {
      if (message.role === "user") {
        langChainMessages.push(new HumanMessage(message.content));
      } else if (message.role === "assistant") {
        langChainMessages.push(new AIMessage(message.content));
      }
      // System messages are filtered out (not processed)
    }

  return langChainMessages;
}
