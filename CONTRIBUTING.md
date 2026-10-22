# Contributing to Agentlist

Every agent has one file in `data/agents/`. A contribution can update a single file. You can edit it in GitHub's web editor and open a pull request, or work locally. Maintainers review pull requests before they are merged.

## Add an agent

1. Fork and clone the repository. Use Node.js 22 or later; there are no dependencies to install.
2. Run `npm run add:agent -- example-agent "Example Agent" https://example.com`.
3. Fill in the summary, company context, launch dates, relevant claims, plans, platforms, and sources in `data/agents/example-agent.json`.
4. Save an official PNG, SVG, or WebP mark in `src/logos/`. Record its original URL and the official page in the `logo` object. Logos belong to their owners.
5. Run `npm run verify` and open a pull request.

The generator will not overwrite an existing agent. You can also copy `templates/agent.json`. Keep the ID stable, lowercase and hyphenated; the filename must match it. Put newer research dates in `data/catalog.json`'s `checkedAt` when necessary.

## What belongs here

Personal agents maintain context about a person over time and use tools to act. Hosted products, local apps, and self-hosted runtimes are welcome. Coding tools use the `adjacent` category and are hidden by default. A new product version normally updates the existing record; aliases preserve searchability. Add a separate record only for a distinct product.

## Evidence and fields

Each source has an ID, title, direct URL, and the date it was checked. Claims reference those source IDs. Use official product pages, documentation, repositories, app listings, or announcements for product facts. Write a brief paraphrase, not a copied article. Available claim fields are listed in `src/catalog.js`.

When sources disagree about a product fact, resolve to the product's own official page rather than third-party coverage, directories, or press writeups, which go stale as products reprice and rename. Record the official figure and leave the stale one out. The exception is a fact the vendor has reason to shade — funding, security certifications, independent feedback — where a primary filing or the certifying body is the better source.

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

## Company and launch history

`organization` names the team that makes the product. Optional `company` records its type and company stage, separately from product availability. Types are `public`, `lab` (major AI lab), `startup`, `established`, `independent`, and `research`. These are editorial groupings, not rankings. Open-source software can still be built by a funded startup. Use `parent` for an owning company, and record acquisitions in `stage` with the date.

Funding describes a dated, disclosed round at the company level. Keep the round amount separate from total raised and valuation; do not substitute one for another. Label committed capital or pre-acquisition funding in `note`. Leave stage or funding absent when not established. Company and funding entries each need their own `sourceIds`.

```json
"company": {
  "type": "startup",
  "stage": "Series A",
  "sourceIds": ["example-funding"],
  "funding": {
    "amount": "US$20M",
    "round": "Series A",
    "date": "2026-06-03",
    "sourceIds": ["example-funding"]
  }
},
"launches": [
  {
    "date": "2026-02",
    "kind": "beta",
    "label": "Original public beta",
    "sourceIds": ["example-launch"]
  }
]
```

Launch kinds are `announcement`, `preview`, `beta`, `launch`, `release` (open-source release), and `update` (later major version or rename). Record product events, not company incorporation, website registration, repository creation, or a source's checked date. Dates accept year, month, or day precision (`2026`, `2026-02`, `2026-02-03`); never invent a day. The earliest non-update event supplies the directory launch date and newest-launch sort. Later milestones remain in the profile timeline. State the original product name or release surface in `label` when it matters. Omit dates that cannot be established.

The build derives company and launch comparison claims from these objects; do not duplicate them in `claims`.

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

`compute` splits computer control into three independent questions, because one prose field could not answer them separately:

- `onYourComputer` — can it act on the machine you own? `full`, `partial`, or `none`, with optional `platforms`.
- `agentComputer` — does it have a machine of its own? `cloud`, `local`, or `none`, with optional `remote` (`takeover`, `view`, `none`) for whether you can watch or drive it.
- `whileYouAreOff` — does the work continue when your machine is off? `yes`, `no`, or `partial`.

```json
"compute": {
  "onYourComputer": {
    "state": "full",
    "platforms": ["macos"],
    "detail": "Controls the Mac desktop through a local companion.",
    "sourceIds": ["example-docs"]
  }
}
```

Each facet needs a `detail` and its own `sourceIds`. **Omit a facet you cannot source.** An absent facet means unknown and must never be read as "no" — a cloud computer says nothing about whether the agent can touch your desktop, and desktop control says nothing about whether it has a machine of its own. Use `status: "limited"` when a source only partly answers the question.

`access` records whether a person can actually get the product, separately from the agent category and from the prose `availability` claim. States are `available`, `waitlist`, `reservation`, `announced`, and `unverified`. Optional `restrictions` name the catches that survive an open signup: `plan`, `region`, `age`, `rollout`, and `invite`. Use `expected` for a stated ship or release date on something not yet available — unlike `launches`, it may be in the future, and a future date is never a launch event. The build derives the availability short text from this object, so the prose claim keeps the detail.

```json
"access": {
  "state": "reservation",
  "restrictions": ["region"],
  "expected": "2027-03",
  "detail": "Reservations only; a refundable deposit holds a unit.",
  "sourceIds": ["example-pricing"]
}
```

A listed product is not a shipping product. Announced hardware, a paid reservation, and an open download are three different answers, and `available` means a person can get it today without an invitation or a waiting list.

`messaging` lists the messaging services an agent can be reached through, as structured entries rather than prose. These are channels, not native apps: a Telegram, Slack, or iMessage integration never belongs in `platforms`. Service keys are listed in `src/channels.js`; statuses match the platform statuses. Each entry needs a `detail` and its own `sourceIds`, and the build derives the `messaging` comparison claim from the list, so do not write one by hand.

```json
"messaging": [
  {
    "service": "imessage",
    "status": "available",
    "detail": "Reachable in Messages on iPhone, alongside the web app.",
    "sourceIds": ["example-docs"]
  }
]
```

Use the service's own key even when a source names it differently: `wechat` covers Weixin, and `imessage` covers "Messages". Record `sms` and `rcs` separately from `imessage` when a source distinguishes them. A list is not an exhaustive claim — when a source ends with "and others," the named services belong in `messaging` and the open-ended wording stays in the `channels` claim.

`hardware` describes a dedicated device or a native integration with the vendor's own hardware, not ordinary Mac or phone requirements. Use `available`, `optional`, `announced`, `none`, or `unknown`. A known `none` needs a source just like a positive claim. Explain whether the device is required, optional, shipping, or still announced. Unclear historical availability can retain a sourced detail with `unknown` status.

## Discussions and sentiment

Add original discussion URLs with dates and short summaries of the actual thread. Use `kind: "announcement"` for company or creator posts, and `community` for independent discussion. `sentiment` (`positive`, `mixed`, `critical`, `neutral`) describes that thread, not every user of the product. Avoid treating marketing testimonials or referral posts as independent feedback.

Aggregate `sentiment` records are separately attributed snapshots. They include the provider, collection window, source channels, rated user-week counts and raw positive share. Do not infer an aggregate score from a few selected links. Current snapshots come from Feedback Bench; the profile explains their units and links to its method and data. When refreshing, update the entire sample, including the window and counts. Do not mix snapshots from different dates.

## News and relationships

Edit `data/catalog.json` for dated news and sourced relationships. Relationships accept only `built-on`, `fork`, and `renamed`. Keep inspiration and competing alternatives out of the ancestry graph. Fork ancestry requires explicit evidence. Shared model providers, compatibility, and similar names do not prove a fork. Updates are curated; a pull request does not publish automatically.

## Preview and checks

```sh
npm run verify
npm run dev
```

Open http://127.0.0.1:4173. CI runs the same build, data validation and domain checks on each pull request. Generated `dist/` files are not committed. Browser-test visual changes on desktop and mobile.
