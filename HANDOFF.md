# Agentlist handoff

You are continuing **Agentlist**, an open directory and comparison site for
persistent personal AI agents — systems that keep context about one person and
act on their behalf. Live at **https://agentlist.wiki**.

Read this file, then `README.md`, `DESIGN.md` and `CONTRIBUTING.md`, then look
at the built site before changing anything.

---

## 1. Getting running on a new machine

```sh
git clone https://github.com/sunnya97/agentlist.git
cd agentlist
npm run verify      # build + validate + test. Must be green before you start.
npm run dev         # serves dist/ at http://127.0.0.1:4173
```

- **Node 22+.** There are **no dependencies at all** — `dependencies` and
  `devDependencies` are both empty and there is no lockfile. Do not add a
  package without asking; dependency-freedom is a deliberate property.
- `npm run dev` serves `dist/` but does **not** build or watch. Rebuild after
  every source change or you will debug stale output. `AGENTLIST_PORT` overrides
  the port.
- The repository root is the directory containing `package.json`. On the
  previous machine a wrapper folder sat above it (`Projects/agentlist/site`),
  which is local-only — a fresh clone has no such nesting.

### Scripts

| | |
|---|---|
| `npm run verify` | build + validate + test. **The gate. Run it before every commit.** |
| `npm run build` | `data/` → `dist/` |
| `npm run check` | schema and evidence validation |
| `npm test` | 39 domain tests |
| `npm run dev` | static server over `dist/` |
| `npm run add:agent` | scaffold a new agent record |
| `npm run collect:news` | pull vendor changelogs into `research/` |
| `npm run collect:feedback` | pull per-area sentiment from Feedback Bench |

**Trap that cost a day:** do not pipe `verify` through a grep that only matches
success lines. A failing build then prints nothing and reads as silence. On
2026-10-26 I did exactly that and pushed a red build; both workflows failed for
several minutes. Check the exit code, or grep for failure.

---

## 2. What the thing is

52 agent records, 33 comparison fields in 6 groups, one JSON file per agent in
`data/agents/`, plus `data/catalog.json` (shared news, relationships, research
queue, methodology) and `data/datasources.json` (which personal-data platforms
are reachable by third parties).

`scripts/build.mjs` reads those and emits into `dist/`:

- per-route static HTML (`/`, `/compare`, `/news`, `/about`, `/agent/<id>/`)
- `data.json` — the whole dataset, and what the client fetches
- `agentlist.html` — a standalone single-file bundle that works over `file://`
- `feed.xml`, `sitemap.xml`, `robots.txt`
- the Markdown edition (see §6)

Routing is **path-based** when served over HTTP and falls back to hashes inside
the standalone bundle.

### The claim schema

Every comparison fact is a claim:

```json
{"field":"pricing","value":"…prose…","shortValue":"$49/mo",
 "status":"documented|limited|unknown","sourceIds":["bond-pricing"]}
```

- `documented` — supported by an official page.
- `limited` — only partly or conditionally established.
- `unknown` — **not established by reviewed sources. This does not mean "no".**

### The rule everything else serves

> **Unknown is not unavailable.** Absence of evidence is recorded as absence of
> evidence and must never render as a "no".

This is the entire reason the project exists, and it is the thing most likely to
be destroyed by a well-meaning refactor — a chart that renders a missing facet
as an empty cell, a format conversion that drops null fields, a summary that
says "does not support X". Several tests exist only to defend it
(`unknown never becomes an unsupported feature`, `the control cell keeps "no"
distinct from "nobody has said"`). If one of those fails, you have broken the
premise, not the test.

### Structured facets

Prose fields are progressively being replaced by small controlled vocabularies,
each carrying its own `detail` + `sourceIds`, where an **omitted facet reads as
unknown**:

| module | what it answers |
|---|---|
| `src/access.js` | available / waitlist / reservation / announced / unverified, plus restrictions |
| `src/compute.js` | `onYourComputer`, `agentComputer` (+ optional `remote`), `whileYouAreOff` |
| `src/continuity.js` | what survives if the vendor stops |
| `src/cost.js` | free / freemium / paid / bundled / device, with floor, currency, period |
| `src/channels.js` | messaging services as structured channels |
| `src/platforms.js` | native apps with per-platform status |
| `src/datasources.js` | third-party reach into personal data |

---

## 3. Deployment

- GitHub Pages from `main`, built by `.github/workflows/deploy.yml`.
- Custom domain **agentlist.wiki**, DNS at **Namecheap**, HTTPS enforced,
  Let's Encrypt.
- `.github/workflows/validate.yml` runs the same gate on every push.
- Check a deploy with `gh run list --limit 2`.

If the certificate ever reads `null`/`none`: it happens when the Pages custom
domain is set *before* DNS resolves. Clear the custom domain, confirm the CNAME
resolves, then set it again.

---

## 4. The vote service — built, committed, NOT deployed

`vote/` holds a Cloudflare Worker + D1 upvote service, added on request for a
Product Hunt-style ranking. **It is inert**: until `data/catalog.json` carries a
`voteApi` URL the site renders exactly as it does now, with no voting UI and no
dead buttons. The client UI was never built.

Design, which the owner approved:

- Identity is a **GitHub account**. The entire anti-abuse story is one unique
  constraint on `(agent_id, github_id)` — one account, one vote per agent,
  forever. No rate limits, no IP heuristics, no weighting. Product Hunt sustains
  a paid-upvote market because a vote there is cheap to manufacture; an account
  with history is not.
- The Worker **never stores a GitHub token**. It reads the account id once at
  sign-in, drops the token, and the browser keeps a signed cookie holding only
  that id. Sign-in requests **zero scopes**.
- Votes are meant to stay **visibly separate from the sourced record**. A count
  beside a cited claim reads as "this agent is better" rather than "people like
  this", and keeping those distinct is the catalogue's whole value. This was my
  call, flagged to the owner, not yet overruled.

**Blocked on the owner**, because it lives in their account settings and issues a
secret: create a GitHub OAuth app at https://github.com/settings/developers with
callback `https://agentlist-votes.<subdomain>.workers.dev/auth/callback`. Then
the five commands in `vote/README.md` (D1 create, schema, two
`wrangler secret put`, deploy) and set `voteApi`. The owner's Cloudflare account
was already authenticated via `npx wrangler` on the old machine; a new machine
will need `npx wrangler login`.

---

## 5. What the owner wants, and what not to re-litigate

**Preserve these.** Several were corrections of mine:

- Compact, polished, information-dense. **The official logos are liked** — when
  the owner says a page looks bad, the problem has so far always been
  information architecture or spacing, never the logos. Do not propose removing
  them.
- No methodological slogans in customer-facing copy. The owner explicitly
  disliked "Every claim has a source. Every unknown stays visible" and "No
  popularity scores. No pay-to-rank listings." Keep evidence reachable through
  links and source lists instead of mottos.
- No user-count or popularity proxies as a quality measure ("that's not a good
  measure tbh"). Upvotes are a deliberate exception and are community signal,
  not a score.
- Profiles are full pages, not modals.
- Company type stays separate from product capability; funding is dated company
  information, not a quality signal.
- The ecosystem graph carries only verified `built-on`, `fork` and `renamed`
  edges. "Inspired by" and "alternative to" are not ancestry.
- "Native apps", never "Apps".
- **Announced and preview platforms do not count** as something an agent runs
  on. `beta` and `limited` have shipped and do count. See `isShipped` in
  `src/platforms.js`.
- When sources disagree, resolve to the **vendor's own page** over third-party
  writeups — with the caveat that a vendor page is not automatically right about
  facts it has reason to shade (funding, certifications, independent feedback),
  where a filing or the certifying body wins.
- The reference points are L2BEAT, models.dev, OpenRouter's model pages, and
  feedbackbench.com.

**Working style:** use subagents generously — the owner asked for this
explicitly and twice. Large self-contained jobs (data backfills across 52
records, a whole new output format) should be delegated, with you designing the
vocabulary and doing the rendering. Keep commit messages substantive prose that
explains *why*. End them with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

### Disclosure

The owner is affiliated with **Ambi**, which is in the catalogue. Apply exactly
the same evidence standard to it. Example from 2026-10-26: the owner said Ambi
supports Apple Watch; ambi.ai did not mention it anywhere, so the claim was
sourced to the App Store listing instead of taken on trust. Do the same again.

---

## 6. The Markdown edition

`scripts/markdown.mjs` generates an LLM-readable twin of the whole site, all
from the dataset — `/llms.txt`, `/llms-full.txt`, `/index.md`, `/method.md`, and
`/agents/<id>.md` per record. Every page's HTML head links its twin and all 56
files are in the sitemap and robots.txt.

**Never hand-edit these; they are generated.** The convention follows L2BEAT and
Feedback Bench. Three tests keep it tied to the data and, critically, keep
`limited` marks and named `unknown` fields intact through the conversion.

---

## 7. Outstanding work, roughly prioritized

1. **The directory and comparison pages have not been restyled** to the design
   tokens introduced during the agent-page redesign (`src/styles.css` `:root`).
   They currently look transitional against the new agent pages. This is the
   most visible unfinished thing.
2. **Sixteen columns are still prose**, measured as one distinct value per
   answered cell — the same fault already fixed for price and computer use. Worst
   offenders by volume: `uniqueFeatures` (50/50), `scheduling` (48/47),
   `memory` (48/46), `channels` (47/47), `security` (45/45), `browserUse`
   (41/39), `portability` (40/39), `models` (39/38), `byom` (37/34),
   `voice` (34/34), `approvals` (32/32), `api` (26/25), `passwordManager`
   (22/22). The proven recipe: design a small vocabulary, delegate the
   classification across records to a subagent with a strict "omit what the
   sources do not settle" instruction, then do the rendering yourself. Re-measure
   with the ratio script pattern in §9.
3. **Finish the vote feature** once the OAuth app exists (§4) — Worker deploy
   plus the client UI, which does not exist yet.
4. **40 of 52 agents have no `newsSource`**, so the per-agent news feed is thin.
   `npm run collect:news` helps.
5. **"Similar agents" has no real similarity rule** — it is currently weak and
   should either be grounded in the structured facets or removed.
6. **16 unused sources** across 15 records: a source is cited by nothing.
   `validate.mjs` catches dangling references but not unused evidence. Worth a
   pass and a cheap validator rule. Full list in §8.
7. **Contradictions inside records**, surfaced by a subagent and not yet
   resolved — a maintainer should decide these:
   - **OpenHuman** claims to drive your desktop applications *and* to run
     headless on a Linux server. A headless install cannot drive desktop apps.
   - **OpenClaw** names cloud desktops in `computerUse` that its `hosting` claim
     never mentions.
   - **Pickle** says in `browserUse` that you can watch or take over, and in its
     `agentComputer` facet that whether you can watch is not specified.
   - **Khoj** reads as contradictory (container "not the user's machine", but
     self-hosted on your machine) though the facets resolve it correctly.
8. **`agentComputer.remote` is answered for almost nothing** — several agents
   have a documented cloud computer and no source says whether its screen can be
   watched or driven. The owner named this question specifically; it is the
   obvious next research pass.
9. `data/catalog.json` `researchQueue`: Copilot Autopilot (private preview),
   OpenClaw rename history, verified Git fork ancestry, permissions and memory
   export tests.

---

## 8. Known data gaps

- **No `newsSource`** (40): Agent Zero, Ambi, Bond, Catch, Claude Code, Claude
  Duet, Codex, Cue, Eney, Gemini Tasks, Grok Bot, Hark Pro, Hermes Agent,
  Instinct, IronClaw, Khoj, Kimi Claw, Letta, Lucas, MaxClaw, Moltis, Muse,
  nanobot, NanoClaw, Noah, OpenAI Dots, OpenClaw, OpenFang, OpenHuman, Pally,
  Persona, PicoClaw, QwenPaw, Skye, Thine, Tomo, Underdog, Vora Aegis, Wabi,
  ZeroClaw.
- **No `cost` object** (3): Cue and Instinct publish no pricing at all; Noah's
  terms say only that some features "may require payment", which fixes no model.
- **No `compute` facets** (2): Instinct and IronClaw. Both records' own prose
  says the execution architecture is unverified, so there is no state to pick.
  **Leave them empty** rather than inferring.
- **Deliberately absent facets used as test fixtures:** Bond, Claude Duet
  (`onYourComputer`) and Hermes (`agentComputer`) are the canonical
  "nobody has said" examples. Tests assert they stay unknown — do not helpfully
  fill them in.
- **Unused sources:** codex (`codex-glossary`, `codex-remote`), lindy
  (`lindy-memory`, `lindy-routines`), martin (`martin-calendar`,
  `martin-privacy`), ironclaw, letta, nanobot, openfang, pally, qwenpaw,
  simular, skye, tomo, town (one each).
- **Muse on Meta glasses is recorded as `announced`.** The owner believes it has
  shipped; Meta's Connect announcement says "coming to Meta's AI glasses in the
  coming months", the launch page says "coming soon", and the AI glasses release
  notes do not list it. Both sources are on the record and it says plainly that
  Meta still calls it coming soon. **Change it only against a source saying it
  shipped.**
- `data/agents/skye.json` has an odd top-level key order. Cosmetic, pre-existing.

---

## 9. Traps, learned the hard way

- **Renaming a column breaks CSS.** Selectors match `td[data-label="…"]`. This
  broke twice. Grep the label string across `src/` before renaming anything.
- **The standalone bundle concatenates modules into one scope.** A `const short`
  at module level in two files silently broke `dist/agentlist.html` for many
  commits — nothing else notices, because the bundle is never exercised by the
  page tests. `build.mjs` now parse-guards it and a test asserts it, but keep
  module-level names unique.
- **Verify markup without a browser** by importing the render functions in a
  small Node harness and asserting on the HTML string. This is how the bundle bug
  was finally found, and it works when no browser tooling is connected.
- **CSS ordering bites**: `.ctl-*` colour rules did nothing because they sat
  above the base `.platform-icon` rule. Raise specificity rather than reordering.
- **Never index an icon array positionally** against a view list — the
  view-switcher did and silently mismatched once a seventh view appeared. Key by
  name.
- **Source dates must not exceed `catalog.json`'s `checkedAt`.** Validation
  rejects future-dated sources, so bump `checkedAt` when adding newer sources.
  Currently `2026-10-26`.
- To re-measure the prose-versus-vocabulary ratio, compare distinct
  `shortValue || value` against answered cells per column, excluding `unknown`;
  anything at or above 0.9 is prose wearing a table's clothes.

---

## 10. State at handoff

- Branch `main`, clean tree, nothing unpushed, both workflows green.
- `npm run verify`: 52 profiles, validation passing, **39/39 tests**.
- Last commits: vote service → price and computer-use vocabularies → red-build
  fix and availability pills → unshipped platforms no longer counted.
- Nothing is in flight. No subagents running. No uncommitted experiments.
