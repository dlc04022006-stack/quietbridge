# Alexa+ public-web collection log

Collection date: 23 October 2026 (Asia/Calcutta)

## Goal

Build a broad, reproducible public-web evidence corpus for an Alexa+ hackathon decision. The collection separates representative research, professional testing, first-party claims, public anecdotes, developer constraints, and competing submissions.

## Discovery queries

The following query families were run with spelling and regional variants:

- `"Alexa+" review OR feedback OR problems OR complaints`
- `"Alexa Plus" review OR feedback OR problems OR complaints`
- `"Alexa+" privacy latency ads memory reliability`
- `"Alexa+" user experience 2026`
- `site:reddit.com/r/alexa "Alexa+" after:2025-01-01`
- `site:reddit.com/r/amazonecho "Alexa+" after:2025-01-01`
- `site:amazonforum.com "Alexa Plus" issue OR feedback`
- `site:br.amazonforum.com "Alexa Plus"`
- `site:forums.moneysavingexpert.com "Alexa Plus"`
- `"voice assistant" survey 2025 2026 privacy trust`
- `"Alexa" older adults study 2025 2026`
- `LLM-powered voice assistant interaction breakdown study`
- `site:developer.amazon.com/docs/alexaplus add-ons policy functional testing`
- `site:skillusers.io Alexa 2026 issue`
- `site:devpost.com/software Alexa+ Amazon 2026`
- `site:github.com Alexa+ MCP hackathon`
- `site:linkedin.com/posts "Alexa+" experience OR review`
- `site:youtube.com "Alexa+ review" 2026`
- `site:x.com "Alexa+" review OR problem`
- `site:tiktok.com "Alexa Plus" review`
- `Alexa+ Brazil Portuguese review`
- `Alexa+ Japan review complaints`
- `Alexa+ India Hinglish review trust`
- `Alexa+ UK review complaints`
- `Amazon Alexa app App Store reviews Alexa+ 2026`
- `Amazon Alexa Google Play reviews Alexa+ 2026`

## Inclusion rules

- Public page reachable without bypassing authentication or technical protection.
- Direct relevance to Alexa+, Alexa household use, voice-assistant trust, developer implementation, or the current hackathon.
- Surveys retain sample and geography when the source exposes them.
- Reviews and posts retain source type so anecdotes are not presented as prevalence estimates.
- Syndicated articles and articles merely repeating the same Reddit post are deduplicated where identified.
- Search snippets are discovery aids; material claims are tied to the underlying page when possible.

## Coverage achieved

- Official Amazon announcements and usage claims.
- Official Alexa+ policy, functional, MCP, rendering, and testing documents.
- Hackathon rules and FAQ.
- Quantitative surveys and peer-reviewed research.
- Independent long-form and regional reviews.
- Reddit, Amazon Forum, MoneySavingExpert, LinkedIn, and Apple App Store feedback.
- Publicly discoverable developer issue histories.
- Devpost and GitHub competitor discovery.

## Known gaps

- Private or deleted posts, closed groups, Discord/Slack servers, and login-only feeds.
- Content excluded by robots.txt or platform anti-automation controls; TikTok was one blocked example.
- Full X and YouTube firehoses; public search indexes returned limited useful results and do not expose complete platform corpora.
- Paywalled full text where only metadata or a lawful preview is public.
- Amazon internal telemetry, unpublished research, support tickets, and non-public developer preview discussions.
- Complete app-store review export; the public Apple page exposes a rating summary and a rotating subset, not all 5.9 million ratings/reviews.
- Reliable prevalence estimates for complaint themes. Public posts are self-selected and algorithmically surfaced.

## Interpretation rule

The inventory is a source map, not a vote count. Strong decisions should triangulate at least one quantitative/academic source, one observed user behavior or professional test, and one official platform constraint. A recurring anecdotal theme is a hypothesis; it becomes a design priority only when supported by stronger evidence or when the harm of failure is high.
