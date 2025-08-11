import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import type { ChatRequest, ChatResponse, Message } from "./models/chat.schema";
import {instructions as instructionTpl} from "./chat.service.prompt";
import Mustache from "mustache";
import logger from "@/utils/logger";

// Initialize LLM instance once
const llm = new ChatOpenAI({
  model: "gpt-5-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Process a chat request with asset context
 * Messages are stateless - full conversation history is sent each time
 */
export async function processChat(request: ChatRequest): Promise<ChatResponse> {
  try {
    // Debug logging
    logger.debug({ request }, "Chat service received request");
    logger.debug({ assetData: request.assetData }, "Asset data for chat context");

    // Build system message with asset context using template literals
    const systemMessage = buildSystemMessage(request.assetData);
    // console.log("System message:", systemMessage);

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
 * Build system message with asset context
 */
function buildSystemMessage(assetData: string, summaryData?: string): string {
    if (!assetData) {
      return "You are a cybersecurity AI assistant. Help users analyze and understand their security assets.";
    }
    const instructions = Mustache.render(instructionTpl, { assetData, summaryData });
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
