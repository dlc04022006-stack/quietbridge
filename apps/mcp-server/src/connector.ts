import type { ConnectorDeletionStatus } from "../../../packages/contracts/src/index.js";
import type { DownstreamConnector } from "../../../packages/privacy-core/src/index.js";

export interface ResolvedProtectedRecord {
  source: string;
  simulatedSource: boolean;
  recordType: string;
  record: Record<string, string>;
}

/** Product adapter boundary for calendars, health providers, commerce, or other data sources. */
export interface ProtectedRecordConnector extends DownstreamConnector {
  resolve(profileId: string): Promise<ResolvedProtectedRecord>;
}

export class SimulatedCalendarConnector implements ProtectedRecordConnector {
  constructor(public deletionMode: ConnectorDeletionStatus = "CONFIRMED") {}

  async resolve(_profileId: string): Promise<ResolvedProtectedRecord> {
    return {
      source: "QuietBridge simulated calendar adapter",
      simulatedSource: true,
      recordType: "appointment",
      record: {
        status: "found",
        appointmentType: "cardiology consultation",
        provider: "Dr. Mehta",
        startsAt: "Friday at 3:00 PM",
        location: "City Heart Hospital",
        carePlanReference: "Follow-up plan A",
        confirmationCode: "QB_SECRET_CONFIRMATION_4K2",
        accessToken: "QB_SECRET_ACCESS_9P1"
      }
    };
  }

  async deleteRequest(): Promise<ConnectorDeletionStatus> {
    return this.deletionMode;
  }
}
