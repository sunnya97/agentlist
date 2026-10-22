# Contributing to Agentlist

Every agent has one file in `data/agents/`. A contribution can update a single file. You can edit it in GitHub's web editor and open a pull request, or work locally. Maintainers review pull requests before they are merged.

## Add an agent

1. Fork and clone the repository. Use Node.js 22 or later; there are no dependencies to install.
2. Run `npm run add:agent -- example-agent "Example Agent" https://example.com`.
3. Fill in the summary, company, relevant claims, plans, platforms, and sources in `data/agents/example-agent.json`.
4. Save an official PNG, SVG, or WebP mark in `src/logos/`. Record its original URL and the official page in the `logo` object. Logos belong to their owners.
5. Run `npm run verify` and open a pull request.

The generator will not overwrite an existing agent. You can also copy `templates/agent.json`. Keep the ID stable, lowercase and hyphenated; the filename must match it. Put newer research dates in `data/catalog.json`'s `checkedAt` when necessary.

## What belongs here

Personal agents maintain context about a person over time and use tools to act. Hosted products, local apps, and self-hosted runtimes are welcome. Coding tools use the `adjacent` category and are hidden by default. A new product version normally updates the existing record; aliases preserve searchability. Add a separate record only for a distinct product.

## Evidence and fields

Each source has an ID, title, direct URL, and the date it was checked. Claims reference those source IDs. Use official product pages, documentation, repositories, app listings, or announcements for product facts. Write a brief paraphrase, not a copied article. Available claim fields are listed in `src/catalog.js`.

```json
{
  "field": "computerUse",
  "value": "Controls a cloud browser; cannot operate your local desktop.",
  "shortValue": "Cloud browser",
  "status": "documented",
  "sourceIds": ["example-docs"]
}
```

Omit a claim if the answer is not established. The build fills missing fields with an unknown value. Use `limited` when a source establishes a preview, restricted feature, or partial answer. Unknown does not mean unavailable. Public APIs, MCP connectors, browser automation, password vaults, and saved browser sessions are different capabilities.

## Plans

Use one entry per plan or add-on. Include currency, monthly versus annual billing, included model usage, credits or message limits, trial conditions, additional costs, and eligibility. Do not convert annual pricing into a monthly subscription price. If the source does not publish a limit or price, say so in that plan's detail. Keep the compact `pricing` and `bundledPlan` claims consistent with the detailed plans.

```json
{
  "name": "Plus",
  "price": "US$20/month",
  "billing": "Billed monthly",
  "includes": ["500 credits each month", "Models included"],
  "limits": ["Unused credits do not roll over"],
  "sourceIds": ["example-pricing"]
}
```

## Apps and hardware

`platforms` lists real native clients and web access. A Telegram integration or CLI running on Android does not establish an Android app. Statuses distinguish available, beta, preview, announced, and limited access. Use `watchos` for Apple Watch.

`hardware` describes a dedicated device or a native integration with the vendor's own hardware, not ordinary Mac or phone requirements. Use `available`, `optional`, `announced`, `none`, or `unknown`. A known `none` needs a source just like a positive claim. Explain whether the device is required, optional, shipping, or still announced. Unclear historical availability can retain a sourced detail with `unknown` status.

## Discussions and sentiment

Add original discussion URLs with dates and short summaries of the actual thread. Use `kind: "announcement"` for company or creator posts, and `community` for independent discussion. `sentiment` (`positive`, `mixed`, `critical`, `neutral`) describes that thread, not every user of the product. Avoid treating marketing testimonials or referral posts as independent feedback.

Aggregate `sentiment` records are separately attributed snapshots. They include the provider, collection window, source channels, rated user-week counts and raw positive share. Do not infer an aggregate score from a few selected links. Current snapshots come from Feedback Bench; the profile explains their units and links to its method and data. When refreshing, update the entire sample, including the window and counts. Do not mix snapshots from different dates.

## News and relationships

Edit `data/catalog.json` for dated news and sourced relationships. Fork ancestry requires explicit evidence. Shared model providers, compatibility, and similar names do not prove a fork. Updates are curated; a pull request does not publish automatically.

## Preview and checks

```sh
npm run verify
npm run dev
```

Open http://127.0.0.1:4173. CI runs the same build, data validation and domain checks on each pull request. Generated `dist/` files are not committed. Browser-test visual changes on desktop and mobile.
