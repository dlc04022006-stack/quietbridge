# Alexa+ drawbacks and user-needs report

Research date: 23 October 2026  
Evidence base: 90 public sources catalogued in `research/alexa-plus/source-inventory.csv`

## Executive summary

People do not mainly want a voice assistant that can talk more. They want one they can **trust to hear correctly, act on the right thing, protect private information, explain what happened, and recover quickly when it is wrong**.

Alexa+'s strongest value is natural, hands-free household assistance: controlling devices, combining multiple instructions, cooking, calendars, reminders, music, and helping people who find screens or rigid command syntax difficult. Its weaknesses become most damaging in exactly the same environment. A home is shared, noisy, full of similarly named devices, and contains personal information and actions with real consequences.

The dominant unmet need is therefore **dependable, private, recoverable assistance in a shared home**. The assistant should identify who and what a request concerns, keep public speech brief, move sensitive details to a private channel, confirm consequential actions, show what it actually did, and make correction or deletion effortless.

## How to read the findings

- **Directly requested** means users, survey respondents, or Amazon explicitly asked for or required the capability.
- **Observed need** means reviews or posts repeatedly exposed the same failure.
- **Inferred opportunity** means the feature follows from several sources, but users did not necessarily describe the solution in those exact words.
- Survey and academic evidence is stronger for prevalence than social posts.
- Reviews and forum posts provide valuable failure examples but are self-selected anecdotes.
- Amazon usage numbers are first-party claims.

## Priority overview

| Priority | Drawback | What people want | Evidence strength |
|---|---|---|---|
| Critical | Wrong, unintended, or falsely reported actions | Verified execution, correct target, explicit confirmation, undo | Strong across reviews, forums, and official requirements |
| Critical | Privacy in an always-listening shared space | Private delivery, plain-language disclosure, deletion, household-aware controls | Strong survey, academic, and forum support |
| Critical | Unreliable routines and device control | Predictable routines, state verification, diagnostics, graceful recovery | Repeated professional and community evidence |
| High | Slow responses for simple commands | Fast path for routine commands and progress feedback for longer work | Repeated professional and community evidence |
| High | Hallucinated or stale information | Sources, confidence, freshness, and refusal when uncertain | Survey, academic, and review support |
| High | Weak correction and recovery | Preserve context, correct one detail, cancel or undo conversationally | Official requirements plus observed failures |
| High | Wrong person or public disclosure | Household identity, sensitivity classification, private handoff | Strong inferred opportunity with direct privacy support |
| High | Verbose or patronizing responses | Brief-by-default voice output and user-controlled style | Direct user feedback and official design guidance |
| High | Feature regressions after upgrade | Consent, compatibility report, rollback, preserved routines | Repeated community reports |
| Medium | Cluttered and confusing Alexa app | Searchable device/routine model, clearer navigation and explanations | App-store and review evidence |
| Medium | Weak discovery of useful capabilities | Contextual examples and outcome-based discovery | Usage surveys and app feedback |
| Medium | Cross-device inconsistency | Consistent state, modality-aware output, seamless continuation | Official requirements and user reports |
| Medium | Accessibility breakdowns | Voice-complete flows, repair for mishearing, accessible privacy | Peer-reviewed and survey support |
| Medium | International and multilingual gaps | Local language, code-switching, cultural and service localization | Regional evidence |
| Medium | Ads and commercialization in personal spaces | Ad-free core flows and clear separation of sponsored content | Professional and social feedback |

---

# Part I — Detailed drawbacks

## 1. Incorrect or unintended actions

### What goes wrong

- Alexa may interpret an exclamation or conversational remark as an instruction.
- A command can affect the wrong thermostat, speaker, television, room, group, or routine.
- It may claim an action succeeded even when the real device state is unchanged.
- Ambiguous device names and open-plan homes make target selection harder.
- Consequential actions can feel too autonomous when the user did not clearly authorize them.

### Why it matters

A wrong conversational answer is irritating. A wrong household action can change heating, lighting, security, media, purchasing, or other real-world state. False success messages are especially harmful because the user may stop checking.

### Evidence

- Users reported wrong thermostat, television, light, group, and routine behavior in [Reddit](https://www.reddit.com/r/amazonecho/comments/1qsvl54/i_just_turned_off_alexa_plus/), [Amazon Forum US](https://www.amazonforum.com/s/question/0D5at00000hF3oHCAS/alexa-plus-issue-with-commands-and-routines), and [Amazon Forum Brazil](https://br.amazonforum.com/s/question/0D5at00000ue1evCAA/alexa-plus).
- Professional testing found wrong destinations and other agentic failures in [Consumer Reports](https://www.consumerreports.org/electronics/digital-assistants/amazon-alexa-plus-ai-assistant-review-a1667486499/).
- Amazon's requirements mandate explicit confirmation before commitments and high-consequence actions. [Functional requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/functional-requirements)

### What people want

- Ask when the target or intention is ambiguous.
- Repeat the critical details briefly before consequential actions.
- Verify the resulting device/service state instead of trusting only the API response.
- Clearly distinguish “requested,” “in progress,” “completed,” and “failed.”
- Provide an immediate “undo that” command.
- Show which person, room, device, service, and account will be affected.

### Opportunity

Create a verified-action layer that produces a human-readable action receipt and detects a mismatch between requested state and observed state.

## 2. Unreliable routines, groups, and smart-home control

### What goes wrong

- Existing routines may become undiscoverable, execute slowly, or stop working.
- Speaker groups or rooms appear disconnected even when individual devices respond.
- Alexa may delete, recreate, or reinterpret routines unexpectedly.
- Multi-device operations partially succeed without clearly explaining which device failed.

### Evidence

- Routine and group failures appear throughout [Amazon's forum](https://www.amazonforum.com/s/question/0D5at00000kkZekCAE/alexa-plus-early-access-issues?language=en_US), [Reddit device management discussion](https://www.reddit.com/r/amazonecho/comments/1o93dgo/alexa_is_currently_broken_device_management/), and [Apple App Store reviews](https://apps.apple.com/us/app/amazon-alexa/id944011620?platform=ipad&see-all=reviews).
- Reviews consistently praise natural smart-home control when it works, which makes regressions especially visible. [The Verge](https://www.theverge.com/tech/1007565/amazon-alexa-plus-review-one-year-echo-show-dot-max)

### What people want

- Stable compatibility with existing devices, routines, names, rooms, and groups.
- A pre-upgrade compatibility check and post-upgrade validation.
- Partial-failure reporting such as “three lights changed; the kitchen light is offline.”
- A diagnostic explanation understandable without technical knowledge.
- One-step repair or rollback.
- A test mode that simulates a routine without activating devices.

### Opportunity

A household routine health check could identify ambiguous names, unavailable devices, unsafe actions, and regressions before they surprise the user.

## 3. Latency and inconsistent speed

### What goes wrong

- Simple commands sometimes take longer than classic Alexa.
- Users experience silence and do not know whether Alexa heard them.
- Chained requests and integrations can add unpredictable delay.
- Slow responses encourage people to repeat a command, risking duplicated actions.

### Evidence

Latency recurs in [TechRadar](https://www.techradar.com/ai-platforms-assistants/alexa-is-now-available-for-free-to-everyone-in-the-us-on-prime-but-early-users-say-you-should-tread-carefully), [MoneySavingExpert](https://forums.moneysavingexpert.com/discussion/6682527/alexa-plus-anyone-using-it), [CincoDias](https://cincodias.elpais.com/smartlife/lifestyle/2026-06-03/tras-probar-alexa-estamos-ante-un-chatgpt-por-voz-sorprendentemente-efectivo.html), and multiple Reddit discussions.

### What people want

- A low-latency fast path for lights, timers, volume, playback, and familiar routines.
- An immediate acknowledgement when a longer operation begins.
- Honest progress messages rather than silence.
- Duplicate-request protection.
- Predictable timeout and retry behavior.

### Opportunity

Use intent classification to route ordinary commands through a deterministic fast path while reserving model reasoning for requests that need it.

## 4. Mishearing, interruption, and conversational breakdown

### What goes wrong

- Alexa stops listening before a person finishes.
- It interrupts, responds to background speech, or misses corrections.
- Noisy, multilingual, child, older-adult, and visually impaired contexts expose more breakdowns.
- Users must restart a flow instead of correcting one detail.

### Evidence

- Interruption and listening failures appear in [Amazon Forum Early Access reports](https://www.amazonforum.com/s/question/0D5at00000kkZekCAE/alexa-plus-early-access-issues?language=en_US).
- A peer-reviewed accessibility study found speech errors and setup/accuracy problems for visually impaired and sighted participants. [SAGE study](https://journals.sagepub.com/doi/10.1177/10711813261485984)
- Research on an LLM-powered Alexa skill found improved intent recognition but continuing conversational breakdowns. [IJHCS study](https://www.sciencedirect.com/science/article/pii/S1071581924001897)

### What people want

- A visible or audible listening-state indicator.
- “I heard…” confirmation only when confidence is low or consequences are high.
- Natural barge-in and interruption.
- Correction of a single parameter without losing the rest of the request.
- Better handling of accents, code-switching, speech differences, and background noise.
- A graceful fallback to touch or text without restarting.

## 5. Weak memory and loss of conversational context

### What goes wrong

- Alexa remembers something initially but later loses it.
- The user must repeat their name, preference, date, or other previously supplied detail.
- Context may not follow between devices.
- It is unclear what is remembered, for how long, and who can access it.

### Evidence

- Memory inconsistency appears in [Consumer Reports](https://www.consumerreports.org/electronics/digital-assistants/amazon-alexa-plus-ai-assistant-review-a1667486499/) and public user accounts.
- Amazon requires context preservation, parameter-level correction, device transfer, and a clear reset. [Functional requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/functional-requirements)

### What people want

- Reliable short-term context during a task.
- Explicit, inspectable long-term memory rather than invisible storage.
- “What do you remember about me?” and “forget that” controls.
- Household-member separation.
- Clear expiry dates for temporary information.
- Cross-device continuation without leaking private context to another person.

## 6. Hallucinated, incorrect, or stale information

### What goes wrong

- Alexa may confidently invent facts or return wrong hours, prices, dates, or destinations.
- It does not always distinguish a verified service result from a generated answer.
- Time-sensitive facts can be presented without a freshness indicator.

### Evidence

- Factual mistakes were observed by [Tom's Guide](https://www.tomsguide.com/ai/i-put-alexa-to-the-test-with-my-chaotic-family-heres-5-things-i-liked-and-2-that-could-use-work), [Consumer Reports](https://www.consumerreports.org/electronics/digital-assistants/amazon-alexa-plus-ai-assistant-review-a1667486499/), and Amazon forum users.
- Among older adults, 46% reported little or no trust in AI information and 92% wanted AI-generated information labelled. [University of Michigan poll](https://ihpi.umich.edu/national-poll-healthy-aging/national-findings/how-older-adults-use-and-think-about-ai)
- Amazon requires factual information to be attributed to a named source. [Policy requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/policy-requirements)

### What people want

- Named sources and “last updated” information.
- Confidence or uncertainty expressed plainly.
- Clear separation between retrieved facts, inferred suggestions, and generated content.
- Refusal or a clarifying question when the evidence is insufficient.
- Confirmation against the live service before a booking, trip, purchase, or device action.

## 7. Shared-space privacy and accidental disclosure

### What goes wrong

- Voice output is audible to family, visitors, children, roommates, or coworkers.
- Calendar items, purchases, health information, finances, messages, or personal preferences can be exposed publicly.
- A shared device may not reliably know which household member is asking.
- Personal context may move across devices without an understandable privacy boundary.

### Evidence

- In a 2026 US survey, Alexa received a 65.39% concern score; 47% of respondents felt they lacked meaningful control of connected-device data. [Reviews.org](https://www.reviews.org/smart-home/smart-home-privacy/)
- NIST research found voice assistants were perceived as the most problematic smart-home device category for privacy/security. [NIST](https://www.nist.gov/publications/survey-smart-home-users-security-and-privacy-perceptions-and-actions-device-category)
- In the YouGov/Zendesk study, 67% would share personal data only with strong privacy protections. [Zendesk](https://www.zendesk.com/newsroom/press-releases/global-survey-reveals-growing-consumer-trust-in-personal-ai-assistants/)

### What people want

- Sensitivity-aware responses.
- Neutral spoken acknowledgement instead of reading private details aloud.
- Private handoff to an authenticated phone, personal screen, or headphones.
- Household roles and individual profiles.
- Plain-language data receipts: what was used, why, where it went, and how long it remains.
- One-step deletion and revocation.
- Guest and child modes with conservative defaults.

### Opportunity

This is the strongest uncovered hackathon opportunity: a consumer-facing Shared-Space Privacy Handoff.

## 8. Insufficient control over data collection and permissions

### What goes wrong

- Users do not know which data is collected or linked to their identity.
- Privacy controls are distributed across settings and expressed in technical language.
- Permission prompts do not always explain the practical consequence.
- People may consent once but cannot easily inspect or revoke access later.

### Evidence

- 83% in the Reviews.org survey supported plain-language disclosure; 78% would disconnect a device that collected more data than expected; 74% would switch brands for better privacy practices. [Reviews.org](https://www.reviews.org/smart-home/smart-home-privacy/)
- The Alexa iOS listing discloses many categories of identity-linked data, including audio, location, purchases, contacts, content, sensitive information, and usage data. [Apple App Store](https://apps.apple.com/us/app/amazon-alexa/id944011620)
- Quantitative research shows a gap between smart-speaker privacy settings and user mental models. [Privacy-settings study](https://www.sciencedirect.com/science/article/pii/S0167404824006084)

### What people want

- Permission explanations tied to the current action.
- Purpose, recipient, retention, and deletion stated in everyday language.
- Time-limited and one-time access options.
- A searchable history of data access.
- Revocation without navigating several menus.
- Privacy defaults that become stricter when identity is uncertain.

## 9. Verbose, overly enthusiastic, or patronizing behavior

### What goes wrong

- Simple requests receive unnecessarily long answers.
- The voice or style can feel “sassy,” condescending, or emotionally mismatched.
- Extra explanation slows repeated household tasks.
- Clarification prompts sometimes repeat information the user already gave.

### Evidence

- Personality and verbosity complaints appear in [MoneySavingExpert](https://forums.moneysavingexpert.com/discussion/6682527/alexa-plus-anyone-using-it), [Moneycontrol](https://www.moneycontrol.com/technology/amazon-is-automatically-upgrading-some-users-to-alexa-plus-and-not-everyone-is-happy-article-13772715.html), and Reddit.
- Amazon introduced response styles including Brief following customer demand for shorter answers. [Alexa+ response styles](https://www.publicnow.com/view/669C391210FD160CBAD84A9A24715EADE3CC37CA)
- Official guidance recommends voice responses under 30 seconds and offering more detail on request. [Functional requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/functional-requirements)

### What people want

- Brief-by-default responses for routine tasks.
- User-selected tone, pace, and level of explanation.
- A “tell me more” expansion rather than front-loading detail.
- No jokes, opinions, or emotional language unless requested.
- Different response styles for children, guests, accessibility, and quiet hours.

## 10. Advertising on a personal household surface

### What goes wrong

- Echo Show advertising makes a personal assistant feel like a commercial display.
- Ads can interrupt household information or reduce trust in recommendations.
- Users may be unable to tell whether a suggestion is personalized help or sponsored promotion.

### Evidence

Advertising is a repeated criticism in [Consumer Reports](https://www.consumerreports.org/electronics/digital-assistants/amazon-alexa-plus-ai-assistant-review-a1667486499/), [The Verge](https://www.theverge.com/tech/1007565/amazon-alexa-plus-review-one-year-echo-show-dot-max), and social reaction coverage.

### What people want

- Ad-free core assistant and privacy flows.
- Clear sponsored labels.
- No advertisement during urgent, sensitive, accessibility, or child interactions.
- A paid option that genuinely removes promotional material.
- Recommendations separated from execution results.

## 11. Confusing mobile-app experience

### What goes wrong

- Devices, skills, routines, groups, and settings are difficult to locate.
- The app can feel slow or cluttered.
- Users cannot easily see why two devices behave differently.
- Troubleshooting often sends users through repetitive reset steps.

### Evidence

- The app is described as clunky or buggy in professional reviews.
- Current Apple reviews mention missing skill navigation, failed speaker groups, camera announcement configuration, and device differences. [App Store reviews](https://apps.apple.com/us/app/amazon-alexa/id944011620?platform=ipad&see-all=reviews)

### What people want

- One searchable model of people, rooms, devices, services, skills, and routines.
- Plain-language explanations of capability differences.
- Clear device health and last-successful-action status.
- Guided repair based on evidence rather than generic reset instructions.
- Safer list operations with undo instead of immediate deletion.

## 12. Poor capability discovery

### What goes wrong

- Users do not know what Alexa can do or what a feature is called.
- Third-party actions and shopping remain minority uses despite a large installed base.
- Skills can be difficult to find unless the user already knows the invocation or name.

### Evidence

- YouGov found that weather, music, answers, and timers dominate use while smart-home, shopping, and third-party actions trail. [YouGov](https://yougov.com/en-us/articles/52780-americans-use-digital-assistants-mainly-for-weather-music-and-timers)
- App-store users report difficulty locating skills.

### What people want

- Outcome-based discovery: “help me prepare for school” rather than skill names.
- Contextual suggestions only when relevant.
- A safe preview demonstrating what a capability will do and what data it needs.
- Examples adapted to the person's existing devices and services.
- No unsolicited promotion disguised as discovery.

## 13. Upgrade consent and feature regressions

### What goes wrong

- Some users felt pushed or automatically moved to Alexa+.
- Familiar voices, routines, music behavior, weather detail, or skills changed.
- Reverting can be difficult or incomplete.
- Users cannot see what will change before upgrading.

### Evidence

- Upgrade consent and regression complaints appear in [Moneycontrol](https://www.moneycontrol.com/technology/amazon-is-automatically-upgrading-some-users-to-alexa-plus-and-not-everyone-is-happy-article-13772715.html), [TechRadar](https://www.techradar.com/ai-platforms-assistants/amazon-is-pushing-alexa-upgrades-on-prime-members-and-users-arent-happy-about-it), and multiple Reddit discussions.

### What people want

- Explicit opt-in with a clear comparison.
- A compatibility test for existing devices, routines, skills, voices, and services.
- A reversible trial period.
- Migration report listing changed or unsupported features.
- Preservation of existing settings unless the user chooses otherwise.

## 14. Cross-device and cross-modal inconsistency

### What goes wrong

- A feature available on one Echo, browser, phone, or account may not work on another.
- Spoken and visual results can disagree or update at different times.
- A private task started on one device may continue on an inappropriate shared device.
- Screenless devices sometimes receive instructions referring to a display.

### Evidence

- App-store reviewers question why devices receive different capabilities.
- Amazon requires appropriate modality adaptation, consistent visual/spoken state, and voice-complete critical flows. [Functional requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/functional-requirements)

### What people want

- A consistent capability map across devices.
- Seamless continuation with explicit privacy boundaries.
- Voice-first completion on screenless hardware.
- Enhanced visuals on displays without making the screen mandatory.
- Synchronized spoken and displayed details.

## 15. Accessibility gaps

### What goes wrong

- Voice assistance improves autonomy but speech errors and setup problems remain.
- Privacy settings and recovery may require the mobile app or visual navigation.
- Long, dense responses are harder to follow and correct.
- Error messages may not offer a single clear next step.

### Evidence

- The 79-person accessibility study found autonomy benefits alongside recognition, setup, accuracy, and privacy concerns. [SAGE study](https://journals.sagepub.com/doi/10.1177/10711813261485984)
- In a two-week older-adult trial, participants reported autonomy and competence benefits, while broader social effects were mixed. [Older-adult trial](https://www.tandfonline.com/doi/full/10.1080/10410236.2026.2694693)

### What people want

- Every critical flow fully usable by voice.
- Short chunks with repeat, slower, spell, and explain controls.
- One-step correction after mishearing.
- Accessible consent and privacy controls.
- Optional trusted-contact assistance without removing user agency.
- No unsupported medical or safety promises.

## 16. Child and family safety

### What goes wrong

- Children may receive generated answers without clear sourcing.
- Shared profiles may expose adult calendar, shopping, or other private data.
- The assistant may not adjust complexity, tone, or action permissions by age.

### Evidence

- Pew reports that 37% of children age 12 or younger use a voice assistant, increasing with age. [Pew](https://www.pewresearch.org/chart/11-of-parents-say-their-child-uses-a-smartwatch-similar-share-with-an-older-kid-say-this-about-chatbots/)
- In Amazon/Kantar's India study, 54% of parents reported lacking instant answers and 44% admitted making up answers. [Amazon/Kantar](https://press.aboutamazon.com/in/2024/8/54-surveyed-parents-often-feel-that-they-dont-have-instant-answers-for-kids-questions-amazon-alexa-study)

### What people want

- Age-appropriate answers with named sources.
- Parent-controlled capability and purchasing boundaries.
- Separation of adult and child data.
- A learning mode that encourages curiosity without pretending certainty.
- Clear parent review and deletion controls.

## 17. Multilingual, regional, and cultural gaps

### What goes wrong

- A translated interface does not guarantee local services or actions work.
- Code-switching, regional accents, local entity names, and cultural expectations vary.
- Some transaction features arrive later than conversational features.
- Pricing and value differ significantly across markets.

### Evidence

- India supports English, Hindi, Hinglish, and code-switching, but regional reporting notes that many transactions were initially unavailable. [GadgetsNow](https://gadgetsnow.indiatimes.com/tech-news/alexa-comes-to-india-with-hinglish-and-ai-actions-but-its-real-test-is-whether-it-can-be-trusted-to-do-things/amp_articleshow/134284069.cms)
- Portuguese testing praised natural multi-action requests but found playback errors. [Canaltech](https://canaltech.com.br/casa-conectada/testamos-a-alexa-plus-em-portugues-veja-o-que-muda-na-pratica/)
- Japanese reporting reflected praise for conversation alongside latency, ads, and upgrade criticism. [Internet Watch](https://internet.watch.impress.co.jp/docs/yajiuma/2078016.html)

### What people want

- Natural code-switching without repeating the request.
- Local services, addresses, media, units, calendars, and cultural context.
- Regional privacy expectations and household patterns reflected in defaults.
- Transparent feature availability by country and device.
- Regional pricing that matches actual available capability.

## 18. Music, media, and service-selection errors

### What goes wrong

- Alexa plays the wrong station, artist, service, speaker, or group.
- Follow-up music requests may lose the original context.
- Multi-room playback can drop devices or misreport connectivity.

### Evidence

- Music selection and speaker-group complaints recur in [Reddit](https://www.reddit.com/r/alexa/comments/1x2kbzt/tried_alexa_and_downgraded_couldnt_do_the_most/) and [Apple App Store reviews](https://apps.apple.com/us/app/amazon-alexa/id944011620?platform=ipad&see-all=reviews).

### What people want

- Remembered preferred service and household-member preferences.
- Brief disambiguation for similar artists, stations, rooms, or devices.
- A clear statement of what will play, where, and from which service.
- Reliable multi-room group status and recovery.

## 19. Transaction, booking, and commerce trust

### What goes wrong

- The conversational part can work while the booking or purchase fails.
- Handoffs to an app may be confusing or lose context.
- Wrong dates, destinations, quantities, or prices have real cost.
- Users worry about autonomous purchases and data sharing.

### Evidence

- A public restaurant-booking test described a natural interaction followed by a failed booking and confusing handoff. [LinkedIn account](https://www.linkedin.com/posts/catherineiger_i-tried-alexa-this-week-to-make-a-restaurant-activity-7425562290227154945-lvG5)
- Omnisend research reported both openness to AI-assisted purchases and abandonment caused by frustrating AI interactions. [Survey summary](https://www.techradar.com/pro/consumers-are-warming-up-to-ai-assistants-survey-finds-1-3-of-us-would-allow-ai-to-make-purchases)
- Amazon requires price breakdowns, explicit confirmation, duplicate prevention, receipts, and modification/cancellation. [Functional requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/functional-requirements)

### What people want

- Reviewable summaries before commitment.
- Explicit “yes” for the exact price, date, destination, and item.
- Written receipts and status.
- Duplicate detection.
- Modify or cancel one detail without restarting.
- A private channel for payment and personal details.

## 20. Weak failure explanation and support

### What goes wrong

- Alexa may simply fail, deny a routine exists, or offer a generic response.
- Support may recommend factory resets without diagnosing the actual problem.
- Account-specific or device-specific problems are hard for developers to reproduce.
- Users cannot provide a compact trace of what happened.

### Evidence

- An app-store review described lengthy support interactions ending with the issue relabelled as feedback.
- A developer report described routing failures that could not be reproduced on the developer's own account or device. [SkillDevs LinkedIn](https://www.linkedin.com/posts/skilldevs-io_sharing-a-recent-alexa-skill-customer-review-activity-7496937009027022848-DysO)
- Community issue tracking records invocation, checkout, audio, session, and tooling problems. [SkillUsers](https://skillusers.io/blog/monthly-progress-updates)

### What people want

- A plain-language reason for failure.
- One recommended next action rather than a long troubleshooting list.
- A shareable, privacy-safe diagnostic receipt.
- Clear ownership: Alexa, device, network, skill, or external service.
- Status pages and known-issue notices.

## 21. Developer-tool access and testing limitations

### What goes wrong

- Hackathon participants do not receive the gated Category SDK, MCP Toolkit, CLI, or official simulator.
- Developers must create their own simulator/client for a self-hosted MCP service.
- Production failures may depend on identity, device, account, language, or third-party state.

### Evidence

- The hackathon FAQ explicitly confirms the gated tools are unavailable to participants. [Hackathon FAQ](https://amazonappdev2026.devpost.com/details/faqs)
- Official testing expects vague, corrective, edge, multimodal, accessibility, and failure cases. [CX testing guide](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-addon-test-addon-cx)

### What builders want

- An accessible simulator with real MCP initialization, tool discovery, and tool calls.
- Replayable traces and fixtures.
- Voice-style adversarial utterances.
- Multi-user, multi-device, latency, partial-failure, and permission test cases.
- Clear certification pre-checks.

### Important hackathon constraint

A pure developer-testing product is a risky Alexa+ submission because Amazon requires add-ons to be designed for end consumers and excludes B2B-only/internal workflows. A testing capability is safer as an internal development component or open-source mini-challenge artifact supporting a consumer-facing product. [Policy requirements](https://www.developer.amazon.com/docs/alexaplus/add-ons/policy-requirements)

## 22. Price, subscription, and value uncertainty

### What goes wrong

- Users compare the subscription price with features already available in classic Alexa or other AI services.
- Regional launches may offer fewer integrated actions while charging a substantial standalone price.
- Ads can make a paid assistant feel less valuable.

### Evidence

- Amazon lists Alexa+ as included for eligible Prime members in the US and has published market-specific offers elsewhere. [US announcement](https://www.aboutamazon.com/news/devices/alexa-plus-available-free-prime-members-us)
- Indian launch reporting highlighted the planned standalone price and incomplete transaction availability. [Amazon India](https://www.aboutamazon.in/news/devices-and-alexa/alexa-plus-launch-india)

### What people want

- A clear list of available capabilities for their country, account, and devices.
- No payment before compatibility is known.
- A reversible trial.
- Meaningful paid value: reliability, privacy, and fewer ads—not merely more conversation.

---

# Part II — Consolidated list of what people want

## A. Reliability and control

1. Correct device, room, person, account, and service selection.
2. Verified real-world state after an action.
3. Explicit confirmation for purchases, deletion, cancellation, security, and other consequential actions.
4. Immediate undo and rollback.
5. Partial-success reporting.
6. Duplicate-action prevention.
7. Stable existing routines, groups, skills, and settings.
8. A safe routine simulation/test mode.
9. Clear service availability and health.
10. Predictable timeout, retry, and offline behavior.

## B. Conversation quality

11. Faster execution for simple commands.
12. Immediate acknowledgement for slow tasks.
13. Brief-by-default responses.
14. Optional detail on request.
15. Natural interruption and barge-in.
16. Correction of one detail without restarting.
17. Context preserved across turns.
18. Clear context expiry and “start over.”
19. User-controlled tone, pace, and personality.
20. Better support for accents, code-switching, children, older adults, and speech differences.

## C. Truth and transparency

21. Named sources for factual claims.
22. Freshness timestamps for changing information.
23. Plain-language uncertainty.
24. Separation of retrieved fact, model inference, recommendation, and advertisement.
25. No claim of success without verification.
26. A visible/actionable history of what Alexa heard, understood, called, and changed.

## D. Privacy and household identity

27. Correct household-member recognition.
28. Conservative behavior when identity is uncertain.
29. Sensitivity classification before speaking information aloud.
30. Private handoff to an authenticated personal device.
31. Guest mode, child mode, and quiet/private modes.
32. Plain-language permission explanations.
33. One-time and time-limited access.
34. Data-use receipts with purpose, recipient, and retention.
35. “What do you remember?” inspection.
36. One-step delete, forget, and revoke commands.
37. Separate profiles and memories for household members.

## E. App, device, and modality experience

38. Searchable organization of people, rooms, devices, groups, skills, and routines.
39. Consistent features across compatible devices.
40. Clear explanations when a device cannot support a feature.
41. Voice-complete flows for screenless devices.
42. Consistent visual and spoken details.
43. Seamless continuation across devices with explicit privacy boundaries.
44. Safer deletion with undo.
45. Evidence-based diagnostics instead of repetitive reset advice.

## F. Accessibility and inclusion

46. Fully voice-accessible critical flows.
47. Repeat, slower, spell, simplify, and explain commands.
48. Short information chunks.
49. Accessible privacy, consent, correction, and deletion.
50. Multilingual and natural code-switching.
51. Local services, addresses, media, units, and cultural context.
52. Age-appropriate answers and controls.

## G. Commerce and external services

53. Exact review of price, date, destination, quantity, and payment method.
54. Written receipts.
55. Clear transaction status.
56. Modify or cancel without restarting.
57. Private handling of payment and account details.
58. No sponsored recommendation disguised as an objective answer.

## H. Upgrades and subscriptions

59. Explicit opt-in.
60. Pre-upgrade compatibility testing.
61. A detailed migration report.
62. A reversible trial or rollback.
63. Preservation of voices, routines, skills, and preferences.
64. Market-specific feature and price transparency.
65. An ad-free personal experience, especially for paying users.

---

# Part III — Highest-value product opportunities

## 1. Shared-Space Privacy Handoff — strongest opportunity

### Problem

Alexa operates aloud in a shared home, but many useful requests involve information that should not be spoken publicly.

### Product

An Alexa+ add-on that detects sensitivity, speaks a neutral acknowledgement, privately hands details to an authenticated personal screen, and creates a plain-language data receipt. The user can correct, cancel, forget, or delete the request conversationally.

### Why people would want it

- It makes voice assistance useful for calendars, purchases, family planning, accounts, messages, and other personal tasks.
- It directly answers survey demand for control and disclosure.
- It reduces accidental household disclosure without forcing users back into the phone for every request.

### Required features

- sensitivity classifier;
- household role and confidence indicator;
- neutral voice response;
- private QR/push/companion handoff simulation;
- purpose/recipient/retention receipt;
- correction, cancellation, and deletion;
- voice-only safe fallback;
- no storage by default for sensitive content.

## 2. Verified Household Action Receipt

### Problem

Users cannot always tell whether the correct device changed or whether Alexa merely reported success.

### Product

A layer that converts household requests into an explicit plan, asks only necessary clarification, executes, verifies observable state, and presents a compact receipt with undo.

### Caution

Confirmation and smart-home audit projects already exist. Differentiation would need state verification and recovery rather than another generic approval screen.

## 3. Routine Health Check and Safe Migration

### Problem

Upgrades and device changes can break routines, names, groups, or service behavior.

### Product

A consumer tool that scans the household configuration, identifies ambiguity and unavailable dependencies, simulates routines, and produces repair steps before migration.

### Caution

Keep it consumer-facing. A developer-only testing tool does not fit Alexa+'s business-eligibility policy.

## 4. Accessible Conversational Repair

### Problem

Mishearing and failures disproportionately harm people relying on voice as their primary interface.

### Product

A repair layer with concise read-back, one-detail correction, voice-complete privacy controls, slower/repeat modes, and a single recommended recovery action.

### Caution

Avoid medical claims and do not turn it into another medication assistant.

## 5. Sourced Family Answer Mode

### Problem

Parents need quick answers, but generated information may be inaccurate or inappropriate for a child.

### Product

A family-learning service that provides age-appropriate, sourced answers, expresses uncertainty, supports English/Hindi/Hinglish, and gives parents review controls.

### Caution

It must provide a distinct domain service and cannot be a simple wrapper around another LLM.

---

# Final recommendation

The most defensible project is **Shared-Space Privacy Handoff** because it satisfies five conditions simultaneously:

1. It addresses a statistically supported user concern.
2. It solves a problem unique to ambient voice devices rather than copying a phone chatbot.
3. It is clearly consumer-facing and compatible with Alexa+ policy.
4. It is differentiated from the most visible current hackathon submissions.
5. It creates a strong three-minute demonstration: unsafe public disclosure versus safe private handoff, followed by a transparent receipt and conversational deletion.

The product promise should be:

> **Ask naturally in a shared room. Alexa keeps sensitive details private, shows exactly what happened, and lets you undo it instantly.**

## Supporting research files

- `alexa-plus-feedback-research.md` — research synthesis and source interpretation.
- `research/alexa-plus/source-inventory.csv` — 90-source structured inventory.
- `research/alexa-plus/query-log.md` — search coverage and limitations.
- `research/alexa-plus/README.md` — corpus overview.
