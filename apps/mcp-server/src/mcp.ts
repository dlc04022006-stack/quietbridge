import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { AudienceContextSchema } from "../../../packages/contracts/src/index.js";
import type { QuietBridgeService } from "./service.js";

function success(payload: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    structuredContent: payload
  };
}

function failure(message: string) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }]
  };
}

function safeToolError(error: unknown): ReturnType<typeof failure> {
  const code = error instanceof Error ? error.message : "UNKNOWN";
  const allowedMessages: Record<string, string> = {
    REQUEST_NOT_AVAILABLE: "That request is unavailable or has expired.",
    EVALUATION_REQUIRED: "Evaluate the privacy decision before continuing.",
    HANDOFF_NOT_ALLOWED: "A private handoff is not allowed for this profile.",
    HANDOFF_NOT_AVAILABLE: "A private handoff is not available for this decision.",
    RECEIPT_NOT_AVAILABLE: "That privacy receipt is unavailable.",
    DELETE_NOT_ALLOWED: "Deletion is not allowed for this profile."
  };
  return failure(allowedMessages[code] ?? "QuietBridge could not complete that request safely.");
}

export function createQuietBridgeMcpHandler(service: QuietBridgeService) {
  return createMcpHandler(
    () => {
      const server = new McpServer(
        { name: "quietbridge", version: "0.1.0" },
        { capabilities: { tools: {} } }
      );

      server.registerTool(
        "resolve_private_request",
        {
          title: "Resolve private request",
          description:
            "Retrieve an invented appointment into protected server storage. Returns only an opaque request ID, never the appointment fields.",
          inputSchema: z.object({ profileId: z.string().min(1).max(100) })
        },
        async ({ profileId }) => success(await service.resolvePrivateRequest(profileId))
      );

      server.registerTool(
        "evaluate_disclosure",
        {
          title: "Evaluate disclosure",
          description:
            "Classify protected fields and apply QuietBridge's deterministic audience policy before generating public-safe output.",
          inputSchema: z.object({
            requestId: z.string().uuid(),
            audience: AudienceContextSchema
          })
        },
        async ({ requestId, audience }) => {
          try {
            return success(await service.evaluateDisclosure(requestId, audience));
          } catch (error) {
            return safeToolError(error);
          }
        }
      );

      server.registerTool(
        "create_private_handoff",
        {
          title: "Create private handoff",
          description:
            "Create a short-lived, one-time, profile-bound token after the server policy permits private delivery.",
          inputSchema: z.object({
            requestId: z.string().uuid(),
            profileId: z.string().min(1).max(100)
          })
        },
        async ({ requestId, profileId }) => {
          try {
            return success(service.createPrivateHandoff(requestId, profileId));
          } catch (error) {
            return safeToolError(error);
          }
        }
      );

      server.registerTool(
        "get_privacy_receipt",
        {
          title: "Get privacy receipt",
          description:
            "Return a redacted receipt describing categories, destinations, retention, and policy reasons without raw sensitive values.",
          inputSchema: z.object({
            requestId: z.string().uuid(),
            profileId: z.string().min(1).max(100)
          })
        },
        async ({ requestId, profileId }) => {
          try {
            return success(service.getPrivacyReceipt(requestId, profileId) as unknown as Record<string, unknown>);
          } catch (error) {
            return safeToolError(error);
          }
        }
      );

      server.registerTool(
        "delete_private_request",
        {
          title: "Delete private request",
          description:
            "Revoke handoffs, delete QuietBridge's copy, and report the simulated connector status separately. Explicit confirmation is required.",
          inputSchema: z.object({
            requestId: z.string().uuid(),
            profileId: z.string().min(1).max(100),
            confirmed: z.boolean()
          })
        },
        async ({ requestId, profileId, confirmed }) => {
          try {
            return success(
              (await service.deletePrivateRequest(requestId, profileId, confirmed)) as unknown as Record<
                string,
                unknown
              >
            );
          } catch (error) {
            return safeToolError(error);
          }
        }
      );

      return server;
    },
    {
      legacy: "stateless",
      responseMode: "auto",
      maxRequestBodySize: 64 * 1024,
      onerror: (error) => {
        // Do not log request bodies, tokens, or protected field values.
        console.error("QuietBridge MCP protocol error:", error.name);
      }
    }
  );
}
