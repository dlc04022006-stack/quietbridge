import type { ConnectorDeletionStatus, DeletionResult } from "../../contracts/src/index.js";
import type { HandoffStore } from "./handoff.js";

export interface LocalRequestStore {
  deleteRequest(requestId: string): boolean;
}

export interface DownstreamConnector {
  deleteRequest(requestId: string): Promise<ConnectorDeletionStatus>;
}

export class DeletionCoordinator {
  private readonly tombstones = new Map<string, DeletionResult>();

  constructor(
    private readonly localStore: LocalRequestStore,
    private readonly handoffs: HandoffStore,
    private readonly connector: DownstreamConnector
  ) {}

  async deleteRequest(requestId: string, confirmed: boolean): Promise<DeletionResult> {
    if (!confirmed) {
      return {
        requestId,
        state: "CONFIRM_REQUIRED",
        local: "NOT_DELETED",
        handoffsRevoked: 0,
        connector: "NOT_ATTEMPTED",
        message: "Please explicitly confirm deletion before I continue."
      };
    }

    const previous = this.tombstones.get(requestId);
    const handoffsRevoked = previous?.handoffsRevoked ?? this.handoffs.revokeRequest(requestId);
    const local = previous?.local ?? (this.localStore.deleteRequest(requestId) ? "DELETED" : "NOT_FOUND");

    if (previous?.connector === "CONFIRMED" || previous?.connector === "UNSUPPORTED") {
      return previous;
    }

    const connector = await this.connector.deleteRequest(requestId);
    const state =
      connector === "CONFIRMED"
        ? "DOWNSTREAM_CONFIRMED"
        : connector === "UNSUPPORTED"
          ? "DOWNSTREAM_UNSUPPORTED"
          : "DOWNSTREAM_FAILED_RETRYABLE";
    const message =
      connector === "CONFIRMED"
        ? "QuietBridge deleted its copy and the connector confirmed deletion."
        : connector === "UNSUPPORTED"
          ? "QuietBridge deleted its copy, but the connector does not support deletion."
          : "QuietBridge deleted its copy, but connector deletion failed and can be retried.";

    const result: DeletionResult = {
      requestId,
      state,
      local,
      handoffsRevoked,
      connector,
      message
    };
    this.tombstones.set(requestId, result);
    return result;
  }
}
