import { describe, it, expect } from "bun:test";
import { mock } from "bun:test";
mock.module("@langchain/openai", () => ({
  ChatOpenAI: class {
    async invoke() {
      return { content: "Mocked response", response_metadata: { tokenUsage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 } } };
    }
  }
}));

import { processChat } from "@/api/v1/chat/chat.service";
import type { ChatRequest } from "@/api/v1/chat/models/chat.schema";

describe("Chat Service", () => {

  describe("processChat", () => {
    it("should process basic chat request without asset data", async () => {
      const request: ChatRequest = {
        messages: [
          { role: "user", content: "Hello, what can you help me with?" }
        ]
      };

      const response = await processChat(request);

      expect(response.message).toBeDefined();
      expect(response.message.role).toBe("assistant");
      expect(response.message.content).toBeDefined();
      expect(typeof response.message.content).toBe("string");
      expect(response.message.content.length).toBeGreaterThan(0);
    });

    it("should process chat request with web assets", async () => {
      const request: ChatRequest = {
        messages: [
          { role: "user", content: "Can you analyze my web assets?" }
        ],
        assetId: "example.com",
        assetType: "web"
      };

      const response = await processChat(request);

      expect(response.message).toBeDefined();
      expect(response.message.role).toBe("assistant");
      expect(response.message.content).toBeDefined();
    });

    it("should process chat request with host assets", async () => {
      const request: ChatRequest = {
        messages: [
          { role: "user", content: "What can you tell me about my host assets?" }
        ],
        assetId: "192.168.1.1",
        assetType: "host"
      };

      const response = await processChat(request);

      expect(response.message).toBeDefined();
      expect(response.message.role).toBe("assistant");
      expect(response.message.content).toBeDefined();
    });

    it("should handle conversation history", async () => {
      const request: ChatRequest = {
        messages: [
          { role: "user", content: "What are cybersecurity assets?" },
          { role: "assistant", content: "Cybersecurity assets are digital resources..." },
          { role: "user", content: "Can you be more specific about web assets?" }
        ]
      };

      const response = await processChat(request);

      expect(response.message).toBeDefined();
      expect(response.message.role).toBe("assistant");
      expect(response.message.content).toBeDefined();
    });

    it("should include usage information when available", async () => {
      const request: ChatRequest = {
        messages: [
          { role: "user", content: "Hello" }
        ]
      };

      const response = await processChat(request);

      expect(response.message).toBeDefined();
      // Usage might be undefined if not provided by the model
      if (response.usage) {
        expect(typeof response.usage.prompt_tokens).toBe("number");
        expect(typeof response.usage.completion_tokens).toBe("number");
        expect(typeof response.usage.total_tokens).toBe("number");
      }
    });

    it("should handle API key errors gracefully", async () => {
      // This test assumes no valid API key is set
      const originalKey = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = "invalid-key";

      const request: ChatRequest = {
        messages: [
          { role: "user", content: "Hello" }
        ]
      };

      const response = await processChat(request);

      expect(response.message).toBeDefined();
      expect(response.message.role).toBe("assistant");
      expect(typeof response.message.content).toBe("string");
expect(response.message.content.length).toBeGreaterThan(0);

      // Restore original key
      process.env.OPENAI_API_KEY = originalKey;
    });
  });
});
