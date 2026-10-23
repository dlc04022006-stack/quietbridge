import { createHash } from "node:crypto";
import {
  IsAuthorizedCommand,
  VerifiedPermissionsClient,
  type IsAuthorizedCommandOutput
} from "@aws-sdk/client-verifiedpermissions";
import type {
  AudienceAuthorizationInput,
  AudienceAuthorizationResult,
  AudienceAuthorizer
} from "../../privacy-core/src/external-authorization.js";

interface VerifiedPermissionsSender {
  send(command: IsAuthorizedCommand): Promise<IsAuthorizedCommandOutput>;
}

export class VerifiedPermissionsAudienceAuthorizer implements AudienceAuthorizer {
  private readonly client: VerifiedPermissionsSender;
  private readonly policyStoreId: string;

  constructor(options: {
    region: string;
    policyStoreId: string;
    client?: VerifiedPermissionsSender;
  }) {
    this.policyStoreId = options.policyStoreId;
    this.client = options.client ?? new VerifiedPermissionsClient({ region: options.region });
  }

  async authorize(input: AudienceAuthorizationInput): Promise<AudienceAuthorizationResult> {
    const principalHash = createHash("sha256").update(input.profileId, "utf8").digest("hex");
    const command = new IsAuthorizedCommand({
      policyStoreId: this.policyStoreId,
      principal: { entityType: "QuietBridge::Profile", entityId: principalHash },
      action: { actionType: "QuietBridge::Action", actionId: "processProtectedResult" },
      resource: { entityType: "QuietBridge::DataRequest", entityId: "protected-result" },
      context: {
        contextMap: {
          profileType: { string: input.profileType },
          identityConfidencePermille: { long: Math.round(input.identityConfidence * 1_000) },
          deviceContext: { string: input.deviceContext },
          ownerMatch: { boolean: input.ownerMatch },
          categories: { set: input.categories.map((category) => ({ string: category })) },
          unknownFieldPresent: { boolean: input.unknownFieldPresent }
        }
      }
    });
    const response = await this.client.send(command);
    if ((response.errors?.length ?? 0) > 0) {
      throw new Error("VERIFIED_PERMISSIONS_EVALUATION_ERROR");
    }
    if (response.decision !== "ALLOW" && response.decision !== "DENY") {
      throw new Error("VERIFIED_PERMISSIONS_INVALID_DECISION");
    }
    return { decision: response.decision, provider: "AWS_VERIFIED_PERMISSIONS" };
  }
}
