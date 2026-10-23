export type ProfileMode = "ALICE" | "UNKNOWN";
export type DeviceMode = "SHARED" | "PRIVATE";
export type PhoneProfile = "alice" | "bob";

export interface DisclosureResult {
  requestId: string;
  decision: "PUBLIC" | "REDACTED" | "PRIVATE" | "BLOCKED";
  reasons: string[];
  spokenText: string;
  visualText: string;
  explanation: string;
  privateDeliveryAvailable: boolean;
  excludedPaths: string[];
  receiptId: string;
}

export interface HandoffResult {
  token: string;
  expiresAt: string;
}

export interface DebugEvent {
  id: number;
  method: string;
  detail: string;
  status: "ok" | "error";
}
