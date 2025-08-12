import { z } from "zod";

// Message schema for chat conversation
export const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

// Chat request schema
export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, "At least one message is required"),
  assetId: z.string().optional(),
  assetType: z.enum(["web", "host"]).optional(),
  summaryId: z.string().optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// Chat response schema
export const ChatResponseSchema = z.object({
  message: MessageSchema
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
