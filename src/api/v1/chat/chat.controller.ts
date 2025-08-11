import type { Context } from "hono";
import { ok, fail } from "@/utils/response";
import { processChat } from "./chat.service";
import { ChatRequestSchema } from "./models/chat.schema";
import { toChatResponse } from "./chat.mapper";
import logger from "@/utils/logger";

/**
 * @swagger
 * /api/v1/chat:
 *   post:
 *     summary: AI assistant chat endpoint
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *               asset_data:
 *                 type: object
 *                 properties:
 *                   web_assets:
 *                     type: array
 *                     items:
 *                       type: object
 *                   host_assets:
 *                     type: array
 *                     items:
 *                       type: object
 *     responses:
 *       200:
 *         description: Chat response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [assistant]
 *                     content:
 *                       type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
export async function chat(c: Context) {
  try {
    // Parse and validate request body (middleware handles snake_case to camelCase conversion)
    const body = await c.req.json();
    logger.debug({ body }, "Chat request body received");

    const validatedRequest = ChatRequestSchema.parse(body);
    logger.debug({ validatedRequest }, "Chat request validated");

    // Process chat request
    const response = await processChat(validatedRequest);

    // Convert to DTO format and return
    return ok(c, toChatResponse(response));
  } catch (error) {
    logger.error({ error }, "Chat controller error");
    return fail(c, "Failed to process chat request", 500);
  }
}
