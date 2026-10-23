# Alexa+ unresolved white-space report

Assessment date: 23 October 2026  
Starting point: the 22 drawbacks in `alexa-plus-drawbacks-and-user-needs-report.md`

## Strict conclusion

**None of the 22 drawbacks is completely untouched.** Amazon, academic researchers, other smart-home platforms, or hackathon builders have worked on at least one part of every problem.

The useful filter is therefore: **which problems still lack a complete, user-facing solution?** Seven narrow gaps survive that test. These are not broad categories such as “privacy” or “reliability”; they are the missing links between features that already exist.

## What was excluded

The following drawbacks were removed from the untouched/unsolved shortlist because meaningful solutions or active work already exist:

- General latency and fast responses.
- Brief response modes and personality controls.
- Basic voice and visual identity.
- Review and deletion of Alexa interaction history.
- Sending ordinary links or information to a phone.
- Routine creation, manual testing, and activity history.
- Transaction confirmation, receipts, modification, and cancellation.
- Accessibility settings and research prototypes.
- Child profiles and family controls.
- Multilingual and regional localization.
- Source attribution requirements.
- Skill discovery, onboarding, and app redesign.
- General smart-home approval and audit trails.
- Caregiver, medication, household coordination, and visitor handoff products.

Amazon already provides Voice ID, personalized results, reminders delivered to a phone, interaction history, privacy settings, and some deletion controls. [Alexa Voice ID](https://digprjsurvey.amazon.com/csad/help/node/GYCXKY2AB2QWZT2X?theme=light) [Alexa FAQ](https://digprjsurvey.amazon.com/csad/help/node/201602230)

Alexa skills have had a Send to Phone pattern for ordinary links and follow-up content. [Send to Phone](https://developer.amazon.com/en-US/alexa/alexa-haus/s2p)

The current hackathon already includes projects addressing identity/permissions, action confirmation, audit trails, caregiver coordination, transaction governance, and privacy-first household/visitor handoffs. One recent example is [CareRelay](https://devpost.com/software/carerelay-privacy-first-household-handoffs).

---

# The seven remaining unsolved gaps

## 1. Automatic sensitive-output firewall for shared rooms

### Existing work

- Voice ID can personalize results when Alexa recognizes a speaker.
- Personal reminders can be delivered to a phone.
- Send to Phone can transfer links or detailed content.
- Privacy settings can limit or delete some interaction history.
- CareRelay implements a privacy-first handoff for visitor and caregiver arrivals.

### What is still missing

There is no evidence of a general Alexa+ layer that, before speaking, automatically:

1. examines the **answer**, not only the user's command;
2. detects sensitive calendar, purchase, financial, health, relationship, location, or account information;
3. considers who is recognized and whether other people may be present;
4. suppresses the private portion of the spoken response;
5. securely delivers that portion to the recognized person's device; and
6. explains why the response was withheld.

Current pieces are manually invoked, domain-specific, or based on identity alone. Identity is not the same as output sensitivity: Alexa can correctly recognize a person and still disclose their information to everyone in the room.

### Exact opportunity

Build a **Sensitive Output Firewall**, not a generic privacy assistant:

- input: proposed spoken response plus sensitivity metadata;
- decision: public, redacted, confirmation-required, or private-only;
- public response: short neutral acknowledgement;
- private response: authenticated personal card/notification;
- fallback: reveal nothing when identity confidence is insufficient.

### Novelty status

**Underworked and not solved end-to-end.** Do not claim that private handoff itself is new; claim that automatic sensitivity-aware **output routing** is the gap.

## 2. Per-request data-use receipt across Alexa and third-party add-ons

### Existing work

- Alexa lets users review recordings, transcripts, typed requests, and responses.
- Users can manage permissions and request deletion of some Alexa information.
- Individual add-ons may provide transaction or action receipts.

### What is still missing

There is no single consumer receipt for each request showing:

- what information Alexa used;
- which profile or household member it was associated with;
- which add-on or external service received each field;
- why each field was necessary;
- what was inferred versus explicitly supplied;
- where the information is stored;
- retention duration;
- whether it was used for personalization/model improvement; and
- which deletion command applies to Amazon versus the third party.

Amazon's own FAQ explains that deleting voice recordings does not necessarily delete other records, third-party developer data, device-local data, de-identified copies, or learned model effects. It also notes that deletion may take time and is not always supported reliably by voice. [Alexa FAQ](https://digprjsurvey.amazon.com/csad/help/node/201602230)

### Exact opportunity

Create a standardized **Request Data Receipt** returned by every MCP tool call:

- fields accessed;
- source and destination;
- purpose;
- retention policy;
- inference label;
- deletion endpoint/status;
- one-time or continuing permission;
- child/guest/household scope.

### Novelty status

**Not solved across service boundaries.** General privacy dashboards exist, but request-level data lineage and deletion proof do not appear to be unified for Alexa+ add-ons.

## 3. Automated routine preflight, upgrade compatibility, and rollback

### Existing work

- Users can create, run, edit, share, and delete routines.
- A routine's Activity screen can show whether it triggered.
- Users can manually test a routine.
- Troubleshooting documentation exists.

### What is still missing

No complete consumer system was found that automatically:

1. inventories every routine and dependency before an Alexa+/app/device upgrade;
2. checks renamed, missing, duplicated, incompatible, or offline devices;
3. detects conflicting triggers and ambiguous room/group names;
4. simulates the routine without changing real devices;
5. predicts which routines will behave differently;
6. creates a restorable snapshot; and
7. rolls back only the broken changes.

The current Activity screen is retrospective: it helps after a trigger. It is not a full preflight or migration safety system. Recent users still report routines disappearing from the app or becoming unavailable after updates. [Recent Reddit report](https://www.reddit.com/r/alexa/comments/1x98cor/anyone_elses_routines_gone/)

### Exact opportunity

Build a **Routine Flight Check**:

- dependency graph;
- dry-run simulator;
- ambiguity/conflict detector;
- before/after compatibility report;
- versioned backup;
- selective rollback;
- voice explanation for each risk.

### Novelty status

**Little evidence of an Alexa consumer solution.** Routine testing exists, but automated whole-house preflight and rollback remain open.

## 4. Cross-layer failure attribution and privacy-safe diagnostic receipt

### Existing work

- Interaction history shows what Alexa heard.
- Routine activity can show whether a routine triggered.
- Device and third-party support pages provide manual troubleshooting.
- Alexa can sometimes answer “why did you do that?”

### What is still missing

When “turn off the kitchen lights” fails, the user still lacks one explanation covering the complete chain:

1. wake-word/listening state;
2. speech transcript and confidence;
3. selected intent/tool;
4. selected room/device/account;
5. Alexa service result;
6. skill/add-on result;
7. vendor cloud response;
8. local network/device acknowledgement; and
9. observed final state.

Troubleshooting is fragmented across Alexa, the device manufacturer, Wi-Fi, the skill, and external services. Existing guidance often asks the user to inspect separate apps, power-cycle equipment, relink accounts, or reset devices.

### Exact opportunity

Create a **Why It Failed receipt** that reveals no secrets but states:

- “Alexa heard the correct command.”
- “The kitchen group resolved to four devices.”
- “Three acknowledged the change.”
- “The ceiling light's vendor cloud timed out.”
- “Retry only that device?”

It should generate a shareable support bundle with sensitive values redacted.

### Novelty status

**Not solved across the full execution chain.** Each layer has logs or help pages; consumers do not get a unified causal trace.

## 5. Verified outcome with compensating undo across third-party services

### Existing work

- Alexa can receive device state information.
- High-consequence flows are required to ask for confirmation.
- Existing hackathon projects implement confirmation, audit, budgets, and emergency stops.
- Some integrations report success or failure.

### What is still missing

Confirmation proves that the user intended an action. It does not prove the external world reached the intended state. A tool can return success while the light remains on, a reservation contains the wrong detail, or only some devices respond.

A general Alexa+ solution has not been found that:

- defines the expected post-condition before execution;
- re-reads the authoritative state after execution;
- detects partial or false success;
- waits for eventual consistency when appropriate;
- presents the mismatch; and
- applies the correct compensating action or undo across unrelated vendors.

### Exact opportunity

Build a **Verified Action Contract**:

- requested state;
- expected observable state;
- verification method and deadline;
- idempotency key;
- partial-success semantics;
- compensation/undo tool;
- final user receipt.

### Novelty status

**Standards and isolated implementations exist; a universal consumer layer remains unsolved.** Different vendors expose different state and rollback abilities, making this technically difficult and valuable.

## 6. Identity-confidence-gated context transfer between devices

### Existing work

- Voice ID and Visual ID personalize Alexa experiences.
- Alexa+ documentation expects context to continue across devices.
- Some personal reminders can be delivered to a phone.
- Competing platforms offer guest modes and device-specific personal-result controls.

### What is still missing

Cross-device continuation and household privacy are treated as separate features. A general policy layer is still missing that asks:

- Is the same person continuing?
- Is the destination device private or shared?
- Who else is present?
- Which parts of the previous context may transfer?
- Should the screen display personal information?
- What happens when identity confidence changes mid-conversation?

Voice identification can fail. Amazon's own developer guidance recommends reprompting when a speaker is unrecognized because personalization can abruptly become generic. [Personalization testing](https://developer.amazon.com/en-US/docs/alexa/custom-skills/test-troubleshoot-personalization.html)

### Exact opportunity

Create a **Context Passport** containing:

- user identity confidence;
- source and destination device privacy level;
- context fields allowed to move;
- expiry;
- audience/household scope;
- required re-authentication;
- redacted public summary.

### Novelty status

**Partially addressed, not solved as a general Alexa+ policy.** The innovation is not cross-device continuation alone; it is privacy-gated transfer under uncertain household identity.

## 7. Fully accessible, independent privacy management

### Existing work

- Alexa has privacy settings, voice commands, interaction history, and accessibility features.
- Academic prototypes have tested multimodal privacy assistants.
- Amazon requires voice-only completion for critical add-on flows.

### What is still missing

Privacy management still often depends on navigating an app, understanding abstract data categories, and knowing which setting controls which data. It is not consistently possible for an older adult, visually impaired person, or person with a learning disability to independently:

- discover what is collected;
- understand practical consequences;
- compare choices;
- grant narrowly scoped access;
- inspect third-party sharing;
- delete all relevant copies; and
- verify deletion completion using their preferred accessible modality.

A 2026 research prototype found that a multimodal privacy assistant improved awareness and usability over the standard Alexa app, while also reporting that many participants had never accessed privacy settings despite daily smart-speaker use. [Privacy autonomy research](https://orca.cardiff.ac.uk/id/eprint/186720/)

### Exact opportunity

Build an **Accessible Privacy Guide** with:

- voice, large-text, symbol, and signed-video explanations;
- concrete examples rather than legal categories;
- one choice per turn;
- repeat/slower/simplify controls;
- read-back before changes;
- deletion progress and completion confirmation;
- trusted-helper mode that preserves the primary user's authority.

### Novelty status

**Researched but not solved in the shipping Alexa experience.** Treat it as an implementation gap, not an untouched academic idea.

---

# Ranking for hackathon originality

| Rank | Narrow gap | Novelty | Demo strength | Implementation risk |
|---:|---|---|---|---|
| 1 | Automated routine preflight and rollback | Very high | Very high | Medium |
| 2 | Cross-layer failure diagnostic receipt | Very high | Very high | Medium-high |
| 3 | Per-request data-use receipt | High | High | Medium |
| 4 | Sensitive-output firewall | High when narrowly defined | Very high | Medium |
| 5 | Identity-gated context passport | High | High | High |
| 6 | Verified action contract and undo | Medium-high | Very high | Very high |
| 7 | Accessible privacy management | Medium-high | High | Medium |

## Best choice if originality is the main goal

Build **Routine Flight Check**.

It is less crowded than generic privacy, memory, caregiver, transaction, and confirmation projects. The demo is immediately understandable:

1. Import a household with several routines.
2. Simulate an Alexa+ or device migration.
3. Detect a missing device, ambiguous name, conflicting trigger, and unsupported action.
4. Show the safe dry-run and predicted impact.
5. Repair one issue and create a rollback snapshot.
6. Rerun the check and display a clean result.

## Best choice if user impact is the main goal

Build the **Sensitive Output Firewall plus Request Data Receipt** as one focused consumer experience.

Do not describe it as merely “private handoff,” because that area has already been worked on. The distinctive claim is:

> Before Alexa speaks, the system classifies the proposed output, withholds sensitive fields in shared spaces, privately delivers them to the recognized user, and provides a per-request record of what data moved where.

## Claim discipline

The submission should never say “nobody has worked on this.” The accurate statement is:

> Existing products solve individual pieces, but we found no complete Alexa+ consumer experience combining these steps end to end as of 23 October 2026.

That claim is narrower, defensible, and less likely to be disproved by a judge.
