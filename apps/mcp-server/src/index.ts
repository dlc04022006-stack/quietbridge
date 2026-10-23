import { createQuietBridgeHttpServer } from "./http.js";
import { BedrockMetadataClassifier } from "../../../packages/aws-bedrock/src/metadata-classifier.js";
import { VerifiedPermissionsAudienceAuthorizer } from "../../../packages/aws-verified-permissions/src/audience-authorizer.js";
import { QuietBridgeService } from "./service.js";
import { EncryptedFileHandoffStore } from "../../../packages/privacy-core/src/index.js";
import { DemoProfileAuthenticator, HmacBearerProfileAuthenticator } from "./auth.js";

const runtimeMode = process.env.QB_RUNTIME_MODE ?? "showcase";
if (runtimeMode !== "showcase" && runtimeMode !== "production") {
  throw new Error("QB_RUNTIME_MODE must be showcase or production");
}
const productionMode = runtimeMode === "production";

const requestedPort = Number.parseInt(process.env.PORT ?? "3100", 10);
const port = Number.isFinite(requestedPort) ? requestedPort : 3100;
const bedrockEnabled = process.env.QB_BEDROCK_ENABLED === "true";
const classificationAssistant = bedrockEnabled
  ? new BedrockMetadataClassifier({
      region: process.env.AWS_REGION ?? "ap-south-1",
      modelId: process.env.QB_BEDROCK_MODEL_ID ?? "amazon.nova-micro-v1:0"
    })
  : undefined;
const verifiedPermissionsEnabled = process.env.QB_AVP_ENABLED === "true";
const policyStoreId = process.env.QB_AVP_POLICY_STORE_ID;
if (verifiedPermissionsEnabled && !policyStoreId) {
  throw new Error("QB_AVP_POLICY_STORE_ID is required when QB_AVP_ENABLED=true");
}
const audienceAuthorizer =
  verifiedPermissionsEnabled && policyStoreId
    ? new VerifiedPermissionsAudienceAuthorizer({
        region: process.env.AWS_REGION ?? "ap-south-1",
        policyStoreId
      })
    : undefined;
const encryptedHandoffPath = process.env.QB_ENCRYPTED_HANDOFF_PATH;
const encryptedHandoffKey = process.env.QB_ENCRYPTION_KEY_BASE64;
if ((encryptedHandoffPath && !encryptedHandoffKey) || (!encryptedHandoffPath && encryptedHandoffKey)) {
  throw new Error(
    "QB_ENCRYPTED_HANDOFF_PATH and QB_ENCRYPTION_KEY_BASE64 must be configured together"
  );
}
const handoffTtlMs = Number.parseInt(process.env.QB_HANDOFF_TTL_MS ?? "120000", 10);
const handoffStore =
  encryptedHandoffPath && encryptedHandoffKey
    ? new EncryptedFileHandoffStore({
        filePath: encryptedHandoffPath,
        key: Buffer.from(encryptedHandoffKey, "base64"),
        ttlMs: handoffTtlMs
      })
    : undefined;
const authKeyBase64 = process.env.QB_AUTH_HMAC_KEY_BASE64;
if (productionMode && !authKeyBase64) {
  throw new Error("QB_AUTH_HMAC_KEY_BASE64 is required in production mode");
}
if (productionMode && !handoffStore) {
  throw new Error("Encrypted handoff persistence is required in production mode");
}
const trustedHosts = process.env.QB_TRUSTED_HOSTS?.split(",").map((value) => value.trim()).filter(Boolean);
const allowedOrigins = process.env.QB_ALLOWED_ORIGINS?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);
if (productionMode && (!trustedHosts?.length || !allowedOrigins?.length)) {
  throw new Error("QB_TRUSTED_HOSTS and QB_ALLOWED_ORIGINS are required in production mode");
}
const profileAuthenticator = productionMode
  ? new HmacBearerProfileAuthenticator(Buffer.from(authKeyBase64 ?? "", "base64"))
  : new DemoProfileAuthenticator();
const service = new QuietBridgeService({
  handoffTtlMs,
  ...(handoffStore ? { handoffStore } : {}),
  ...(classificationAssistant ? { classificationAssistant } : {}),
  ...(audienceAuthorizer ? { audienceAuthorizer } : {})
});
const app = createQuietBridgeHttpServer(service, {
  profileAuthenticator,
  requireMcpAuthentication: productionMode,
  ...(process.env.QB_STATIC_ROOT || productionMode
    ? { staticRoot: process.env.QB_STATIC_ROOT ?? "apps/simulator/dist" }
    : {}),
  ...(trustedHosts ? { trustedHosts } : {}),
  ...(allowedOrigins ? { allowedOrigins } : {})
});

const bindHost = process.env.QB_BIND_HOST ?? "127.0.0.1";

app.server.listen(port, bindHost, () => {
  console.log(`QuietBridge MCP server listening on ${bindHost}:${port}`);
  console.log(`Runtime mode: ${runtimeMode}`);
  console.log(`Bedrock metadata classification: ${bedrockEnabled ? "enabled" : "disabled"}`);
  console.log(
    `Verified Permissions audience authorization: ${verifiedPermissionsEnabled ? "enabled" : "disabled"}`
  );
  console.log(`Encrypted local handoff persistence: ${handoffStore ? "enabled" : "disabled"}`);
});

async function shutdown(): Promise<void> {
  await app.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
