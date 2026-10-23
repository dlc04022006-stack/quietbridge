import type { Client } from "@modelcontextprotocol/client";
import { useRef, useState } from "react";
import {
  EvidencePanels,
  PrivateChannel,
  ProductHeaderAndControls,
  PublicChannel
} from "./ProductView.js";
import type {
  DebugEvent,
  DeviceMode,
  DisclosureResult,
  HandoffResult,
  PhoneProfile,
  ProfileMode
} from "./ui-model.js";

function structured<T>(result: { structuredContent?: unknown }): T {
  if (!result.structuredContent || typeof result.structuredContent !== "object") {
    throw new Error("The MCP tool did not return structured content.");
  }
  return result.structuredContent as T;
}

function friendlyError(error: unknown): string {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

export function App() {
  const clientRef = useRef<Client | null>(null);
  const eventCounter = useRef(0);
  const [profile, setProfile] = useState<ProfileMode>("ALICE");
  const [device, setDevice] = useState<DeviceMode>("SHARED");
  const [phoneProfile, setPhoneProfile] = useState<PhoneProfile>("alice");
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [disclosure, setDisclosure] = useState<DisclosureResult | null>(null);
  const [handoff, setHandoff] = useState<HandoffResult | null>(null);
  const [privateDetails, setPrivateDetails] = useState<Record<string, string> | null>(null);
  const [privateError, setPrivateError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [deletion, setDeletion] = useState<Record<string, unknown> | null>(null);
  const [needsDeleteConfirmation, setNeedsDeleteConfirmation] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [appError, setAppError] = useState<string | null>(null);

  function addEvent(method: string, detail: string, status: DebugEvent["status"] = "ok") {
    eventCounter.current += 1;
    setEvents((current) => [
      ...current,
      { id: eventCounter.current, method, detail, status }
    ]);
  }

  async function getClient(): Promise<Client> {
    if (clientRef.current) return clientRef.current;
    const { Client, StreamableHTTPClientTransport } = await import("@modelcontextprotocol/client");
    const client = new Client(
      { name: "quietbridge-integration-workspace", version: "0.1.0" },
      { versionNegotiation: { mode: "auto" } }
    );
    const endpoint = new URL("/mcp", window.location.origin);
    await client.connect(new StreamableHTTPClientTransport(endpoint));
    addEvent("initialize", `Connected using ${client.getProtocolEra() ?? "negotiated"} MCP mode`);
    const listed = await client.listTools();
    addEvent("tools/list", `${listed.tools.length} real tools discovered`);
    clientRef.current = client;
    return client;
  }

  function resetRequestOutput(): void {
    setAppError(null);
    setPrivateDetails(null);
    setPrivateError(null);
    setReceipt(null);
    setDeletion(null);
    setNeedsDeleteConfirmation(false);
    setHandoff(null);
  }

  async function createHandoffIfRequired(
    client: Client,
    result: DisclosureResult
  ): Promise<void> {
    if (result.decision !== "PRIVATE") return;
    const created = await client.callTool({
      name: "create_private_handoff",
      arguments: { requestId: result.requestId, profileId: "alice" }
    });
    setHandoff(structured<HandoffResult>(created));
    addEvent("tools/call", "create_private_handoff → one-time token created (redacted)");
  }

  async function askAppointment() {
    setBusy(true);
    resetRequestOutput();
    try {
      const client = await getClient();
      const resolved = await client.callTool({
        name: "resolve_private_request",
        arguments: { profileId: "alice" }
      });
      const resolvedData = structured<{ requestId: string }>(resolved);
      setRequestId(resolvedData.requestId);
      addEvent("tools/call", "resolve_private_request → protected record ID returned");

      const evaluated = await client.callTool({
        name: "evaluate_disclosure",
        arguments: {
          requestId: resolvedData.requestId,
          audience: {
            profileId: "alice",
            profileType: profile === "ALICE" ? "ADULT" : "UNKNOWN",
            identityConfidence: profile === "ALICE" ? 0.99 : 0.2,
            deviceContext: device,
            roomName: device === "SHARED" ? "Living Room" : "Alice's Bedroom"
          }
        }
      });
      const evaluatedData = structured<DisclosureResult>(evaluated);
      setDisclosure(evaluatedData);
      addEvent("tools/call", `evaluate_disclosure → ${evaluatedData.decision}`);
      await createHandoffIfRequired(client, evaluatedData);
    } catch (error) {
      setAppError(friendlyError(error));
      addEvent("error", "Request failed safely; no protected payload displayed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function unlockPrivateView() {
    if (!handoff) return;
    setBusy(true);
    setPrivateError(null);
    try {
      const response = await fetch("/private/consume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: handoff.token, profileId: phoneProfile })
      });
      const result = (await response.json()) as { fields?: Record<string, string>; error?: string };
      if (!response.ok || !result.fields) throw new Error(result.error ?? "Private unlock failed.");
      setPrivateDetails(result.fields);
      addEvent("private/consume", `One-time handoff consumed by ${phoneProfile}`);
    } catch (error) {
      setPrivateError(friendlyError(error));
      addEvent("private/consume", `Private unlock denied for ${phoneProfile}`, "error");
    } finally {
      setBusy(false);
    }
  }

  async function loadReceipt() {
    if (!requestId) return;
    setBusy(true);
    try {
      const client = await getClient();
      const result = await client.callTool({
        name: "get_privacy_receipt",
        arguments: { requestId, profileId: "alice" }
      });
      setReceipt(structured<Record<string, unknown>>(result));
      addEvent("tools/call", "get_privacy_receipt → redacted metadata returned");
    } catch (error) {
      setAppError(friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  async function requestDeletion(confirmed: boolean) {
    if (!requestId) return;
    setBusy(true);
    try {
      const client = await getClient();
      const result = await client.callTool({
        name: "delete_private_request",
        arguments: { requestId, profileId: "alice", confirmed }
      });
      const data = structured<Record<string, unknown>>(result);
      setDeletion(data);
      setNeedsDeleteConfirmation(data.state === "CONFIRM_REQUIRED");
      addEvent("tools/call", `delete_private_request → ${String(data.state)}`);
      if (confirmed) setPrivateDetails(null);
    } catch (error) {
      setAppError(friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <ProductHeaderAndControls
        profile={profile}
        device={device}
        busy={busy}
        onProfileChange={setProfile}
        onDeviceChange={setDevice}
        onAsk={askAppointment}
      />
      {appError && (
        <div className="alert error" role="alert">
          {appError}
        </div>
      )}
      <section className="workspace">
        <PublicChannel
          disclosure={disclosure}
          requestId={requestId}
          busy={busy}
          needsDeleteConfirmation={needsDeleteConfirmation}
          deletion={deletion}
          onLoadReceipt={loadReceipt}
          onRequestDeletion={requestDeletion}
        />
        <PrivateChannel
          handoff={handoff}
          privateDetails={privateDetails}
          privateError={privateError}
          phoneProfile={phoneProfile}
          busy={busy}
          onPhoneProfileChange={setPhoneProfile}
          onUnlock={unlockPrivateView}
        />
      </section>
      <EvidencePanels receipt={receipt} events={events} />
    </main>
  );
}
