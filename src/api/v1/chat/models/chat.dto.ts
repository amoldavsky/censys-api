import { z } from "zod";

// Chat Request DTO
export const ChatRequestDTO = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).min(1, "At least one message is required"),
  assetData: z.object({
    webAssets: z.array(z.object({}).loose()).optional(),
    hostAssets: z.array(z.object({}).loose()).optional(),
  }).loose().optional(),
});
export type ChatRequestDTO = z.infer<typeof ChatRequestDTO>;

// Chat Response DTO - just the message
export const ChatResponseDTO = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export type ChatResponseDTO = z.infer<typeof ChatResponseDTO>;
