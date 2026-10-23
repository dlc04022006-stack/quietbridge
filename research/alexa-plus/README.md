# Alexa+ public-web research corpus

Updated: 23 October 2026

This folder contains a curated, deduplicated public-web research corpus for selecting and designing an Alexa+ hackathon project.

## Contents

- `source-inventory.csv` — 90 classified sources with geography, evidence tier, sentiment, themes, URL, and a short note.
- `query-log.md` — query families, inclusion rules, achieved coverage, and unavoidable gaps.
- `../../alexa-plus-feedback-research.md` — the evidence synthesis and current build recommendation.

## Corpus composition

| Category | Sources |
|---|---:|
| Professional/regional reviews | 19 |
| Quantitative surveys | 13 |
| Public forums | 15 |
| Existing competitors | 14 |
| Official Amazon announcements | 7 |
| Official developer documentation | 9 |
| Academic research | 5 |
| Hackathon rules/FAQ | 2 |
| Public social posts | 2 |
| Alexa+ policy | 1 |
| App store | 1 |
| Developer community log | 1 |
| News | 1 |
| **Total** | **90** |

## Strongest cross-source findings

1. **Natural household interaction is the product's clearest strength.** Users and reviewers value conversational smart-home control, chained requests, cooking help, calendars, and accessibility.
2. **Reliability matters more than novelty.** Latency, wrong-device actions, broken routines, invented facts, memory failures, and confusing recovery recur across professional tests and public posts.
3. **Shared-space privacy is structurally unresolved.** Voice is ambient: answers are spoken where family, guests, children, or coworkers can hear. Survey evidence also shows strong demand for plain-language disclosure and control.
4. **Brevity is a product requirement.** Users criticize chatty responses, and Amazon's own guidance recommends keeping voice responses short and offering more detail only when requested.
5. **The submission must be consumer-facing.** Official Alexa+ policy excludes add-ons exclusively for B2B/internal use and simple relays to another LLM.
6. **The obvious concepts are crowded.** Existing projects already cover memory/calendars, action confirmation, caregiver/medication support, broad helper collections, identity/permissions, commerce, and household safety.

## Recommended build direction

Build a **Shared-Space Privacy Handoff** for end consumers:

- classify requested/output data by sensitivity;
- speak a neutral acknowledgement instead of sensitive details;
- deliver details to a personal screen or simulated private channel;
- show a plain-language receipt of data used, recipient, purpose, and retention;
- support correction, cancellation, and deletion conversationally;
- preserve a fully voice-completable fallback for devices without screens.

This direction is supported by representative privacy research, observed shared-home failures, official functional requirements, and an identifiable gap in the current submission field.

## What “scrape everything” can honestly mean

No system can copy the entire internet. A defensible version is a reproducible, broad public-web collection with explicit boundaries. Private/deleted/login-only content, full platform firehoses, paywalled text, pages blocked by robots or anti-automation systems, and internal Amazon data are outside this corpus. Those exclusions are recorded in `query-log.md` rather than silently treated as searched.

The next collection pass should use platform APIs or licensed exports where available, record retrieval timestamps and content hashes, and append only new or materially changed sources. Do not republish full copyrighted reviews or personal data; store URLs, metadata, short coded observations, and lawful excerpts only.
