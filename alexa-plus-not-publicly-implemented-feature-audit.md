# Alexa+ customer features not publicly implemented end-to-end

Audit date: 23 October 2026  
Source list: `alexa-plus-drawbacks-and-user-needs-report.md`  
Scope: publicly documented Alexa/Alexa+ features, Amazon developer documentation, public hackathon submissions, academic prototypes, and comparable smart-home platforms

## Important interpretation

It is impossible to prove that an idea has never been implemented privately, internally, in an unindexed project, or in an unpublished prototype. The defensible finding is:

> **No public end-to-end Alexa/Alexa+ implementation was found for the features below as of 23 October 2026.**

Many component technologies already exist. Each retained feature is defined narrowly enough that the existing component is not the same product.

## Existing features deliberately excluded

These ideas should not be claimed as new because public implementations already exist:

- Voice ID and Visual ID.
- Personalized calendars, messages, music, reminders, and supported skills.
- Reminders delivered to a personal phone.
- Send to Phone for links and follow-up content.
- Review Alexa History.
- Deleting recordings, transcripts, and typed requests.
- Basic privacy and skill-permission settings.
- Routine creation, manual execution, activity history, and developer testing.
- Smart-device state reporting.
- Basic transaction confirmations and receipts.
- Brief response modes and personality controls.
- Individual automation traces and simulated triggers in Home Assistant.
- Home Assistant backups and third-party configuration versioning.
- Privacy-first visitor/caregiver handoffs such as CareRelay.
- Generic action approval, audit logs, budget limits, and emergency stops.
- Generic agent developer tracing and root-cause tools.

Public references confirming these existing pieces include [Alexa Voice ID](https://digprjsurvey.amazon.com/csad/help/node/GYCXKY2AB2QWZT2X?theme=light), [Alexa history and deletion](https://digprjsurvey.amazon.com/csad/help/node/201602230), [Send to Phone](https://developer.amazon.com/en-US/alexa/alexa-haus/s2p), [Alexa routine testing](https://developer.amazon.com/en-US/docs/alexa/custom-skills/test-custom-task-with-alexa-routines.html), [Alexa state-reporting guidance](https://developer.amazon.com/en-US/blogs/alexa/device-makers/2024/07/state-quality-alexa-july-2024), [Home Assistant automation testing](https://www.home-assistant.io/docs/automation/testing), and [CareRelay](https://devpost.com/software/carerelay-privacy-first-household-handoffs).

---

# Verified-not-found feature list

## Group A — Sensitive-output protection

### Feature 1: Pre-speech sensitivity inspection

Before text becomes speech, inspect the **proposed response** for sensitive calendar, purchase, health, financial, relationship, location, credential, and account information.

**Existing partial work:** Voice-command sensitivity research analyzes what the user says; platform safety filters analyze prohibited content; Voice ID identifies some speakers.

**Missing capability:** A general Alexa+ output classifier operating immediately before TTS and returning a disclosure policy for individual fields.

**Audit result:** No public Alexa/Alexa+ implementation found.  
**Confidence:** High.

### Feature 2: Audience-aware disclosure decision

Combine response sensitivity with speaker identity confidence, device type, room classification, guest/child mode, and possible bystander presence before deciding what Alexa may say or display.

**Existing partial work:** Voice/Visual ID, presence detection, household profiles, and personalized results exist independently.

**Missing capability:** A single disclosure decision that treats “recognized speaker” and “safe audience” as different questions.

**Audit result:** No general public Alexa implementation found.  
**Confidence:** High.

### Feature 3: Field-level private handoff

Speak a neutral public answer while sending only the sensitive fields—not the entire interaction—to an authenticated personal device.

**Existing partial work:** Send to Phone sends links or follow-up content; personal reminders can reach a phone; CareRelay sends domain-specific household handoffs.

**Missing capability:** Automatic, sensitivity-triggered redaction and field-level private delivery for arbitrary add-on responses.

**Audit result:** No public end-to-end Alexa implementation found.  
**Confidence:** High.

### Feature 4: Explainable privacy withholding

Tell the user, without revealing the secret, why information was not spoken and how to retrieve it privately.

Example: “I sent the appointment details privately because other people may be nearby.”

**Existing partial work:** Permission prompts and privacy documentation explain data practices generally.

**Missing capability:** A per-response explanation generated from the actual disclosure decision.

**Audit result:** No public Alexa implementation found.  
**Confidence:** Medium-high.

## Group B — Per-request data transparency and deletion proof

### Feature 5: Field-level request data receipt

After each meaningful request, show every personal field accessed, its source, and whether it was supplied, retrieved, remembered, or inferred.

**Existing partial work:** Interaction history shows utterances and responses; permissions show categories; transaction receipts show commercial outcomes.

**Missing capability:** A field-level data receipt connected to one Alexa+ request and its tool calls.

**Audit result:** No public Alexa/Alexa+ implementation found.  
**Confidence:** High.

### Feature 6: Cross-party data lineage

Show the exact path of each field across Alexa, the add-on, model provider, vendor API, and storage system.

**Existing partial work:** Privacy policies list broad data categories and processors; developer logs may record individual calls.

**Missing capability:** A consumer-readable lineage graph generated from the actual request rather than a generic policy.

**Audit result:** No public Alexa consumer implementation found.  
**Confidence:** High.

### Feature 7: Purpose and retention attached to each field

For every disclosed field, state why it was required, the legal/service purpose, the recipient, and its retention deadline.

**Existing partial work:** Policies describe purposes and retention broadly. Some enterprise voice APIs expose organization-level retention controls.

**Missing capability:** Request-specific, field-level purpose and retention data in the Alexa consumer experience.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

### Feature 8: Deletion propagation and proof

Send deletion to Alexa, the add-on, and every downstream processor; track each acknowledgement; clearly identify legally retained or technically undeletable data.

**Existing partial work:** Alexa can delete some recordings/transcripts. Amazon explicitly says other interaction records, third-party data, device-local information, de-identified copies, and model effects may remain. [Alexa FAQ](https://digprjsurvey.amazon.com/csad/help/node/201602230)

**Missing capability:** End-to-end deletion orchestration with a verifiable completion receipt across third parties.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

## Group C — Routine safety before upgrades and changes

### Feature 9: Account-wide routine dependency graph

Map every routine to triggers, conditions, devices, rooms, groups, skills, accounts, permissions, and external services.

**Existing partial work:** Alexa displays individual routines; Home Assistant has automation traces; developer tools validate individual definitions.

**Missing capability:** A consumer-visible dependency graph covering the complete Alexa household configuration.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

### Feature 10: Pre-upgrade compatibility scan

Before an Alexa+, app, device, skill, or service migration, predict which routines, voices, groups, permissions, and actions will break or change.

**Existing partial work:** Schema validation and certification exist for developers; platforms publish compatibility and upgrade information.

**Missing capability:** A personalized preflight against the user's real household configuration.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

### Feature 11: Whole-routine non-destructive dry run

Evaluate a routine through the real trigger/condition/action logic while replacing physical and external mutations with recorded simulations.

**Existing partial work:** Alexa allows manual testing; Home Assistant can simulate a trigger and inspect the trace; other workflow systems implement domain-specific dry runs.

**Missing capability:** An Alexa household dry run that uses the same execution route, predicts every device/service change, and guarantees that no real action occurs.

**Audit result:** No public Alexa implementation found.  
**Confidence:** Medium-high because private developer tooling may exist.

### Feature 12: Versioned household snapshot with selective rollback

Snapshot routines, names, groups, permissions, and dependencies before a change, then restore only the broken objects without reverting the whole household.

**Existing partial work:** Home Assistant has backups and community version-control add-ons; some editors have undo/redo.

**Missing capability:** Native Alexa household configuration versioning with object-level rollback tied to migration results.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

## Group D — Consumer-readable failure diagnosis

### Feature 13: One causal trace from speech to physical outcome

Join wake/listening state, transcript, intent, tool selection, identity, target resolution, permission, vendor response, network/device acknowledgement, and observed final state.

**Existing partial work:** Alexa History shows what Alexa heard; routine activity shows triggers; vendors and developers maintain separate logs; developer observability products trace agents.

**Missing capability:** A single consumer trace spanning the full Alexa-to-device/service chain.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

### Feature 14: Automatic failure-owner attribution

State whether the likely cause belongs to speech recognition, Alexa, the add-on, authorization, vendor cloud, home network, or physical device.

**Existing partial work:** Help pages give manually selected troubleshooting steps and individual error codes.

**Missing capability:** Automated root-cause ownership derived from the joined trace.

**Audit result:** No public Alexa consumer implementation found.  
**Confidence:** Medium-high.

### Feature 15: Privacy-safe diagnostic bundle

Generate a shareable support package containing the minimum evidence needed to reproduce the failure while redacting utterance content, credentials, household identities, addresses, and unrelated device data.

**Existing partial work:** Developers export traces and logs; users can screenshot or describe problems manually.

**Missing capability:** Automatic consumer-controlled redaction plus a support-ready cross-layer bundle.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

## Group E — Verified real-world execution and recovery

### Feature 16: Declared post-condition before execution

Every mutating tool declares the real-world condition that must be observable for success.

Example: not “API returned 200,” but “all four kitchen lights report power off within five seconds.”

**Existing partial work:** Alexa device integrations report state; tools define input/output schemas; transaction systems define expected records.

**Missing capability:** A standard Alexa+ post-condition contract required for every consequential action.

**Audit result:** No general public implementation found.  
**Confidence:** High.

### Feature 17: Automatic authoritative-state recheck

After execution, query the authoritative device or service state and compare it with the declared post-condition before telling the user it succeeded.

**Existing partial work:** Device manufacturers are encouraged to send state-change reports promptly.

**Missing capability:** Platform-level enforcement that prevents Alexa+ from claiming success until the post-condition is verified.

**Audit result:** No general public Alexa implementation found.  
**Confidence:** Medium-high because individual integrations may do this privately.

### Feature 18: Itemized partial success and targeted retry

For multi-device or multi-service actions, state exactly which items succeeded, failed, or remain unknown and retry only the failed subset.

**Existing partial work:** Individual tools can return structured errors; some apps show per-device state.

**Missing capability:** Consistent Alexa+ behavior across arbitrary tools and vendors.

**Audit result:** No platform-wide public implementation found.  
**Confidence:** Medium-high.

### Feature 19: Cross-vendor compensating undo

When an action partially completes, calculate and execute the appropriate compensating actions across vendors without duplicating or reversing unrelated work.

**Existing partial work:** Individual services support cancellation, refunds, emergency stops, or idempotency.

**Missing capability:** A vendor-independent undo contract and coordinator for heterogeneous Alexa+ actions.

**Audit result:** No public general implementation found.  
**Confidence:** High.

## Group F — Privacy-safe context movement

### Feature 20: Field-level context passport

Attach transfer rules to every remembered field: owner, sensitivity, allowed devices, audience, purpose, expiry, and re-authentication requirement.

**Existing partial work:** Alexa maintains conversational context and can personalize by identity; privacy settings apply at broader levels.

**Missing capability:** A machine-enforced field-level passport that travels with context between devices and add-ons.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

### Feature 21: Identity-confidence and destination-privacy gate

Before continuing on another device, combine identity confidence with whether the destination is personal, shared, locked, recently authenticated, or surrounded by other people.

**Existing partial work:** Voice/Visual ID, personal-result settings, and competing shared-display protections exist.

**Missing capability:** A general Alexa+ gate applied to cross-device context continuation rather than to isolated personal-result features.

**Audit result:** No public general Alexa implementation found.  
**Confidence:** Medium-high.

### Feature 22: Dynamic privacy downgrade when the audience changes

If identity confidence falls or another person enters during a conversation, automatically stop exposing sensitive context, redact the screen, and require re-authentication.

**Existing partial work:** Presence detection, Voice ID, Visual ID, and occupancy routines exist.

**Missing capability:** Continuous audience-change enforcement attached to conversation sensitivity.

**Audit result:** No public Alexa implementation found.  
**Confidence:** High.

---

# Shortlist for building

## Best original standalone product: Routine Flight Check

Combine Features 9–12:

- household dependency graph;
- personalized upgrade compatibility scan;
- genuine non-destructive dry run;
- versioned snapshot and selective rollback.

This is the least crowded cluster and produces the clearest demonstration.

## Best privacy product: Private Response Firewall

Combine Features 1–4 with a lightweight version of Features 5–8:

- inspect proposed output;
- determine audience safety;
- speak only a neutral acknowledgement;
- privately deliver sensitive fields;
- provide a request-level data receipt and deletion status.

The novelty is not “send information to a phone.” The novelty is automatic sensitivity-aware output filtering and accountable data movement.

## Best technically ambitious product: Verified Action Contract

Combine Features 13–19:

- unified execution trace;
- root-cause attribution;
- declared post-condition;
- authoritative-state verification;
- itemized partial success;
- targeted retry;
- compensating undo.

This may have the highest technical impact but also the highest integration risk.

# Safe novelty wording

Use this in the submission:

> We found existing products for identity, handoff, history, routine testing, state reporting, confirmations, and tracing. We did not find a public Alexa/Alexa+ implementation that combines our selected features into this complete consumer workflow as of 23 October 2026.

Do not say:

> Nobody has ever implemented this idea.

The narrower statement is supported by the public implementation audit and is much safer during judging.
