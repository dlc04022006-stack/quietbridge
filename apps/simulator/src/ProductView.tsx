import type {
  DebugEvent,
  DeviceMode,
  DisclosureResult,
  HandoffResult,
  PhoneProfile,
  ProfileMode
} from "./ui-model.js";

interface ControlsProps {
  profile: ProfileMode;
  device: DeviceMode;
  busy: boolean;
  onProfileChange: (value: ProfileMode) => void;
  onDeviceChange: (value: DeviceMode) => void;
  onAsk: () => void;
}

export function ProductHeaderAndControls(props: ControlsProps) {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">PRIVACY DELIVERY LAYER · ALEXA+ INTEGRATION WORKSPACE</p>
          <h1>QuietBridge</h1>
          <p className="subtitle">Useful aloud. Sensitive in private.</p>
        </div>
        <span className="simulation-badge">PRODUCT INTEGRATION LAB</span>
      </header>

      <section className="control-strip" aria-label="Integration test controls">
        <label>
          Test identity signal
          <select
            value={props.profile}
            onChange={(event) => props.onProfileChange(event.target.value as ProfileMode)}
          >
            <option value="ALICE">Alice · recognized adult</option>
            <option value="UNKNOWN">Unknown speaker</option>
          </select>
        </label>
        <label>
          Device context
          <select
            value={props.device}
            onChange={(event) => props.onDeviceChange(event.target.value as DeviceMode)}
          >
            <option value="SHARED">Living Room · shared</option>
            <option value="PRIVATE">Alice's Bedroom · private</option>
          </select>
        </label>
        <button type="button" className="primary" disabled={props.busy} onClick={props.onAsk}>
          {props.busy ? "Working…" : "Run protected request"}
        </button>
      </section>
    </>
  );
}

interface PublicChannelProps {
  disclosure: DisclosureResult | null;
  requestId: string | null;
  busy: boolean;
  needsDeleteConfirmation: boolean;
  deletion: Record<string, unknown> | null;
  onLoadReceipt: () => void;
  onRequestDeletion: (confirmed: boolean) => void;
}

export function PublicChannel(props: PublicChannelProps) {
  return (
    <article className="panel echo-panel">
      <div className="panel-heading">
        <div>
          <p className="kicker">SHARED OUTPUT ADAPTER</p>
          <h2>Alexa voice channel</h2>
        </div>
        <span className={`decision ${props.disclosure?.decision.toLowerCase() ?? "idle"}`}>
          {props.disclosure?.decision ?? "READY"}
        </span>
      </div>
      <div className="utterance user-utterance">
        <span>Alice</span>“When is my cardiology appointment?”
      </div>
      <div className="echo-device" aria-hidden="true">
        <div className="echo-ring" />
      </div>
      <div className="utterance alexa-utterance" aria-live="polite">
        <span>Voice response</span>
        {props.disclosure?.spokenText ?? "Choose a context and run the protected request."}
      </div>
      {props.disclosure && (
        <div className="explanation">
          <strong>Policy explanation:</strong> {props.disclosure.explanation}
        </div>
      )}
      <div className="button-row">
        <button
          type="button"
          disabled={!props.requestId || props.busy}
          onClick={props.onLoadReceipt}
        >
          View privacy receipt
        </button>
        <button
          type="button"
          className="danger"
          disabled={!props.requestId || props.busy}
          onClick={() => props.onRequestDeletion(false)}
        >
          Delete request
        </button>
      </div>
      {props.needsDeleteConfirmation && (
        <div className="confirmation" role="alert">
          <p>Delete QuietBridge’s copy and revoke every private handoff?</p>
          <button
            type="button"
            className="danger"
            disabled={props.busy}
            onClick={() => props.onRequestDeletion(true)}
          >
            Yes, delete it
          </button>
        </div>
      )}
      {props.deletion && (
        <pre className="result-block">{JSON.stringify(props.deletion, null, 2)}</pre>
      )}
    </article>
  );
}

interface PrivateChannelProps {
  handoff: HandoffResult | null;
  privateDetails: Record<string, string> | null;
  privateError: string | null;
  phoneProfile: PhoneProfile;
  busy: boolean;
  onPhoneProfileChange: (profile: PhoneProfile) => void;
  onUnlock: () => void;
}

export function PrivateChannel(props: PrivateChannelProps) {
  return (
    <article className="panel phone-panel">
      <div className="panel-heading">
        <div>
          <p className="kicker">PRIVATE OUTPUT ADAPTER</p>
          <h2>Verified companion channel</h2>
        </div>
        <span className="simulation-badge small">TEST HARNESS</span>
      </div>
      <div className="phone-frame">
        <div className="phone-notch" />
        <p className="phone-brand">QuietBridge private view</p>
        {!props.handoff && !props.privateDetails && (
          <div className="phone-empty">No private handoff is available for this decision.</div>
        )}
        {props.handoff && !props.privateDetails && (
          <>
            <div className="lock-icon" aria-hidden="true">
              ●
            </div>
            <h3>Private result ready</h3>
            <p>Expires {new Date(props.handoff.expiresAt).toLocaleTimeString()}</p>
            <label>
              Test authenticated profile
              <select
                value={props.phoneProfile}
                onChange={(event) =>
                  props.onPhoneProfileChange(event.target.value as PhoneProfile)
                }
              >
                <option value="alice">Alice</option>
                <option value="bob">Bob · wrong profile test</option>
              </select>
            </label>
            <button
              type="button"
              className="primary full"
              disabled={props.busy}
              onClick={props.onUnlock}
            >
              Verify and open
            </button>
          </>
        )}
        {props.privateError && (
          <div className="alert error" role="alert">
            {props.privateError}
          </div>
        )}
        {props.privateDetails && (
          <div className="private-card">
            <p className="verified">VERIFIED FOR ALICE</p>
            <h3>{props.privateDetails.appointmentType}</h3>
            <dl>
              <dt>Provider</dt>
              <dd>{props.privateDetails.provider}</dd>
              <dt>Time</dt>
              <dd>{props.privateDetails.startsAt}</dd>
              <dt>Location</dt>
              <dd>{props.privateDetails.location}</dd>
            </dl>
            <p className="safe-note">Authentication secrets were excluded by policy.</p>
          </div>
        )}
      </div>
    </article>
  );
}

export function EvidencePanels(props: {
  receipt: Record<string, unknown> | null;
  events: DebugEvent[];
}) {
  return (
    <section className="lower-grid">
      <article className="panel">
        <div className="panel-heading">
          <div>
            <p className="kicker">ACCOUNTABILITY</p>
            <h2>Privacy receipt</h2>
          </div>
        </div>
        {props.receipt ? (
          <pre className="result-block">{JSON.stringify(props.receipt, null, 2)}</pre>
        ) : (
          <p className="muted">Run a request, then load its content-free receipt.</p>
        )}
      </article>
      <article className="panel debug-panel">
        <div className="panel-heading">
          <div>
            <p className="kicker">INTEGRATION EVIDENCE</p>
            <h2>MCP traffic</h2>
          </div>
          <span className="live-dot">LIVE</span>
        </div>
        <ol className="event-list" aria-live="polite">
          {props.events.length === 0 && <li className="muted">No MCP calls yet.</li>}
          {props.events.map((event) => (
            <li key={event.id} className={event.status}>
              <code>{event.method}</code>
              <span>{event.detail}</span>
            </li>
          ))}
        </ol>
        <p className="safe-note">Protected payloads and handoff tokens are intentionally redacted.</p>
      </article>
    </section>
  );
}
