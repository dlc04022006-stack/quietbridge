# AWS Bedrock integration: setup and verification

> Cost notice: Bedrock inference is usage-priced. QuietBridge keeps this integration disabled in
> the free-only project configuration. Do not enable it unless the user later approves paid AWS
> usage.

## What the integration does

The deterministic sensitivity map handles every known field locally. For an
unknown field, the optional Bedrock adapter sends only this metadata:

```json
{
  "path": "carePlanReference",
  "source": "QuietBridge simulated calendar",
  "recordType": "appointment"
}
```

It does **not** send the value (`"Follow-up plan A"`), the user's request, a
profile ID, a room name, or any appointment details. The privacy receipt records
whether Bedrock was used, the model ID, the assisted field paths, and the fixed
fact `valuesSent: false`.

Bedrock is advisory. A suggestion is accepted only when it is at least 0.8
confidence and is one of `PERSONAL`, `FINANCIAL`, `HEALTH`, or `AUTH_SECRET`.
Errors, malformed responses, low confidence, and attempted `PUBLIC`
classification all retain the local `PERSONAL` fail-closed result.

## AWS prerequisites

AWS CLI v2.38.5 is installed. Browser-based temporary authentication was verified,
and a live request reached the Bedrock service in `ap-south-1`. The AWS console now
states that the separate Model access page has been retired for serverless models;
models are made available on first invocation subject to account authorization. Use
an IAM identity with least privilege or an attached deployment role for continued
development; do not create or paste long-lived access keys.

The caller needs this minimum permission for the selected model:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/amazon.nova-micro-v1:0"
    }
  ]
}
```

Authorization and cross-region inference requirements can vary by AWS account.
Opening the playground is free, but choosing Run invokes the model and can incur charges.

## Local configuration

After authenticating the machine, set these values in the shell that starts the
server (or in a private, ignored local environment file):

```text
QB_BEDROCK_ENABLED=true
AWS_REGION=ap-south-1
QB_BEDROCK_MODEL_ID=amazon.nova-micro-v1:0
```

Then run:

```bash
npm run verify
npm run dev
```

In the integration workspace, start the shared-room flow and inspect the privacy receipt.
For the invented `carePlanReference` field, a successful live call should show:

- `used: true`
- `provider: AWS_BEDROCK`
- `modelId: amazon.nova-micro-v1:0`
- `assistedPaths: ["carePlanReference"]`
- `valuesSent: false`

If AWS authentication, permissions, model access, or the service call fails,
`used` remains false, `failedPaths` contains `carePlanReference`, and the field
continues to be treated as personal data. The app must remain privacy-safe in
that failure mode.

That failure mode has now been checked against a real AWS rejection: the decision
remained `PRIVATE`, assistance remained unused, `carePlanReference` appeared in
`failedPaths`, and `valuesSent` remained `false`.

## Automated evidence already passing

- The Bedrock request contains `carePlanReference` metadata.
- The request does not contain `Follow-up plan A` or the cardiology value.
- Nova Micro's JSON response is validated against a strict local schema. Native
  Bedrock structured outputs are intentionally not requested because Nova Micro
  does not support that feature.
- A high-confidence sensitive classification may strengthen the local category.
- A model attempt to classify an unknown field as public is rejected.
- The complete MCP flow still passes with Bedrock disabled.
