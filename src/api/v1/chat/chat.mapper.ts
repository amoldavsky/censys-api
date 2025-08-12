import type { ChatResponse } from "./models/chat.schema";
import type { ChatResponseDTO } from "./models/chat.dto";

/**
 * Convert internal ChatResponse to DTO format - just return the message.
 * @param response Internal chat response.
 */
export function toChatResponse(response: ChatResponse): ChatResponseDTO {
  return {
    role: response.message.role,
    content: response.message.content,
  };
}
