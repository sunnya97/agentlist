# Agentlist handoff

You are continuing Agentlist, an open directory and comparison site for persistent personal AI agents. Read this file, `README.md`, `DESIGN.md`, and `CONTRIBUTING.md`, then inspect the current app before proposing changes.

## Immediate task

The user paused development and requested that everything be committed and pushed, with a handoff for a new agent. The next substantive request is: **“Come up with a list of things that can improve this even more.”** Produce a concrete, prioritized list grounded in the existing product. Do not implement the suggestions until asked. No improvement list was delivered before the pause.

The user then supplied this additional research lead:

- https://x.com/bondwithchloe/status/2113089316473938197
- Investigate Chloe and whether it belongs in the directory. The post could not be fetched during handoff preparation; its contents and product claims have not been verified. No Chloe entry has been added. Preserve this lead even if X remains inaccessible.

## Location and running the app

- Repository: https://github.com/sunnya97/agentlist
- Branch: `main`
- Local repo: `/Users/sunnya97/Projects/agentlist/site` (the parent `agentlist` folder is not the Git repository).
- Preview: http://127.0.0.1:4173 — responded successfully when this handoff was prepared. Check before starting another server.
- Node.js 22+, dependency-free static JavaScript/CSS. No database, credentials, or package installation needed.
- Run `npm run verify` to build, validate data, and run domain tests. Run `npm run dev` to serve the built `dist/` directory. Rebuild after source changes; the server does not build or watch files.
- `AGENTLIST_PORT` overrides the default port.
- `dist/agentlist.html` is a standalone bundle. `dist/data.json` and `dist/feed.xml` are also generated.
- No production website/domain has been deployed in this work. Set `siteUrl` in `data/catalog.json` when a public origin exists.

## Product intent and user preferences

The user wants an informative, useful personal-agent comparison site inspired by L2BEAT, models.dev, and https://feedbackbench.com/. The central subject is persistent personal agents: hosted assistants, local apps, and self-hosted runtimes. Claude Code and Codex are adjacent coding tools, hidden by default.

The user cares about practical differences: computer use, built-in password management, real native apps and operating systems, API access, open source, included models versus bring-your-own-model, subscription bundles, detailed plans and limits, local operation, ambient listening, dedicated hardware, availability, company context, launch dates, and public discussion.

Preserve these decisions:

- Keep the design compact, polished, and information-focused. Use the actual official logos.
- Avoid prominent disclaimers, methodological slogans, and jargon such as “documented” in customer-facing descriptions. The user explicitly disliked “Every claim has a source. Every unknown stays visible” and “No popularity scores. No pay-to-rank listings.” Keep evidence accessible through links and source tabs.
- Agent profiles are full pages, not modals.
- Combine desktop and phone apps in the directory’s “Native apps” column, with platform icons and availability details.
- Keep company type separate from product capabilities; comparing Meta to a Series A startup needs context. Funding is dated company information, not a quality score.
- The ecosystem graph is for verified `built-on`, `fork`, and `renamed` relationships. “Inspired by” and “alternative to” do not belong in ancestry.
- Keep the dataset easy to contribute to through a public GitHub repo and one JSON file per agent.
- The user’s company is Ambi. Apply the same research standards to it as to other entries.

## What already works

- 35 profiles: 33 personal agents and two optional coding tools, with official local logo assets and provenance.
- Directory views: Overview, Capabilities, Models & plans, Apps & hardware, Company & launch, Ownership & control.
- Search, agent-type and company-type filters, followed-only filter, optional coding tools. Sorts include Featured first, alphabetical, type, and newest launches.
- Comparison for up to four agents, grouped feature rows, differences-only mode, agent replacement, CSV export, shareable links, and a fixed selection tray.
- Native platform icons with details distinguishing available, beta, announced, and limited access. Messaging integrations are not mislabeled as native apps.
- Full profile routes such as `#agent/town` and `#agent/town?tab=plans`. Linkable Overview, Plans, Discussion, and Sources tabs, browser navigation, page titles, keyboard support, and unknown-profile handling.
- Profiles include company/stage/funding context, launch history, detailed plans and limitations, hardware status, public discussions, source lists, follow controls, and GitHub edit links.
- News filtering by agent/type/search/followed agents and RSS.
- Ecosystem graph currently has three sourced built-on links: OpenClaw → Kimi Claw, OpenClaw → MaxClaw, and Antigravity → Gemini Tasks. No verified fork edges yet.
- Followed agents persist in localStorage; there are no accounts or cross-device sync.
- GitHub issue templates, agent generator, contribution guide, and PR validation workflow.

The latest application commit before this handoff is `4d3210fdbfc0a6ff096325ff298bd9fe269cd47c` (“Add full agent pages, company context, and launch history”). It was pushed to `main`; all 18 domain tests and build/data validation passed. Its GitHub Actions run also passed: https://github.com/sunnya97/agentlist/actions/runs/39732817037. This handoff does not change application code.

## Files and data rules

- `src/app.js`: rendering, routes, and interactions.
- `src/domain.js`: filtering, sorting, comparison logic, and derived company/launch claims.
- `src/catalog.js`: comparison field definitions, directory views, company categories, and editorial featured ordering.
- `src/platforms.js`: platform icons and presentation.
- `src/styles.css`: visual system; `DESIGN.md` explains the current design.
- `data/agents/<id>.json`: canonical editable agent records.
- `data/catalog.json`: news, relationships, research date, and repository/site URLs.
- `scripts/build.mjs`, `scripts/validate.mjs`, `scripts/domain.test.mjs`: build and checks.
- `scripts/add-agent.mjs` and `templates/agent.json`: contribution scaffolding.
- `scripts/collect-news.mjs`: GitHub release collection into a review inbox; it does not publish automatically.

Read `CONTRIBUTING.md` for schemas and evidence requirements. Preserve stable IDs (for example `gemini-spark` now displays Gemini Tasks, and Wabi 2.0 updates the existing `wabi` record). Distinguish unknown from unavailable, model/API access from MCP integrations, browser control from desktop control, and credential vaults from stored browser sessions.

Company funding must distinguish round amount, total raised, and valuation. Launch events can use year, month, or day precision; never invent a day. Newest-launch sorting uses the earliest non-update debut, not a later version launch. The build derives company and launch claims; do not duplicate them manually in `claims`.

Do not commit generated `dist/`, local screenshots, `.openai/`, `.impeccable/`, or ignored `research/` scratch files. Canonical researched data and official logo assets are already tracked. Local scratch files are not required to build the project.

## Research state and useful gaps

The catalog is a curated snapshot checked October 21, 2026, not a live feed or independently tested benchmark. Verify current facts against primary sources when updating them.

At handoff, the 33 personal-agent entries have company context for 28, funding records for 12, launch dates for 16, eight individual discussion threads, and nine attributed Feedback Bench sentiment snapshots. There are 17 news entries across the catalog. Coverage can be expanded; a populated feature claim does not mean the feature was independently tested.

Feedback Bench snapshots cover August 31–October 18, 2026. The percentage shown is the raw positive share of rated user-weeks, not Feedback Bench’s composite score. Preserve attribution, collection windows, units, and sample counts when refreshing.

Candidate improvements to assess, not an approved implementation plan:

1. Practical capability filters and use-case presets: operating systems, budget, local/cloud, computer use, BYOM, and existing subscriptions.
2. Clear profile summaries covering who an agent suits, starting cost, setup effort, and how to get access.
3. Standardized real-task comparisons with plan/version/date, completion, human interventions, time, and cost.
4. Integration coverage that distinguishes reading from writing and native connections from browser automation or MCP.
5. More precise persistence/autonomy comparisons: triggers, proactive work, device-on requirements, approvals, task duration, and memory behavior.
6. Total-cost comparisons including subscriptions, model usage, hosting, credits, and hardware.
7. Topic-level community feedback and trends, with original discussion links and sample context.
8. Per-agent change history and useful follow alerts for launches, platform support, pricing, and availability.
9. Richer verified product/runtime/company relationships and lifecycle history.
10. Easier inline corrections or contribution forms that produce reviewable changes.
11. Public hosting, crawlable path URLs, social previews, and useful comparison landing pages.

Prioritize a short, opinionated list rather than treating every candidate as necessary. Explain the user benefit and avoid proposing existing features as new. Development is paused until the user asks to resume implementation.
