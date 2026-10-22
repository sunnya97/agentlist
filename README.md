# Agentlist

An open directory of persistent personal AI agents. Compare capabilities, native apps, hardware, models and pricing; follow product news and public discussion.

The catalog includes 35 personal agents and two optional coding tools. Each profile has an official logo, linked sources, detailed feature comparisons, and separate Plans, Discussion and Sources tabs. Native apps and messaging services are tracked separately, so a Slack or iMessage integration is never counted as an app. Profiles include pricing tiers where published, distinguish announced hardware from available devices, and say whether a product is actually available or still a waitlist or reservation.

## Contribute

**One JSON file per agent:** `data/agents/<id>.json`.

Edit a record and open a pull request, or suggest an agent through GitHub Issues. [The contribution guide](CONTRIBUTING.md) covers sources, pricing, hardware, discussions, and validation.

```sh
npm run add:agent -- example-agent "Example Agent" https://example.com
npm run verify
```

## Run

Node.js 22 or later. No dependencies, account, API keys, or database required.

```sh
npm run verify
npm run dev
```

Open http://127.0.0.1:4173. Set `AGENTLIST_PORT` to change the port. `dist/` works on any static host. `dist/agentlist.html` is a standalone bundle containing the interface, logos, and dataset. Hash routes allow direct links to profiles and comparisons.

## Structure

- `data/agents/`: editable profiles, sources, plans, platforms, messaging, hardware and discussions.
- `data/catalog.json`: news, relationships, research date, and repository URL.
- `src/`: interface and official logo assets.
- `src/catalog.js`: feature definitions and editorial default ordering.
- `src/platforms.js`, `src/channels.js`: native platform and messaging-service marks.
- `src/access.js`: availability states, from shipping to waitlist and reservation.
- `scripts/build.mjs`: builds the static site, dataset, RSS and standalone bundle.
- `scripts/validate.mjs`: validates sources, platforms, messaging, plans, hardware, discussions and sentiment samples.
- `scripts/domain.test.mjs`: comparison, filtering, catalog integrity and regression checks.
- `.github/`: contribution forms and pull-request validation.

`Featured first` is a curated introduction; alphabetical and agent-type sorts are also available. Set `repository` in `data/catalog.json` to the public GitHub URL to enable contribution links. Set `siteUrl` to a deployed origin for RSS links.

## Research and discussion

This is a snapshot checked October 21, 2026. Product capabilities and plan details link to official sources. They are descriptions, not independent performance tests. The build fills unresearched fields without treating them as unsupported.

Discussion summaries link to original dated threads and distinguish community posts from announcements. Nine profiles include attributed [Feedback Bench](https://feedbackbench.com/) snapshots for August 31–October 18, 2026. Their displayed percentage is the raw positive share of rated user-weeks, not Feedback Bench's composite score. Coverage varies by agent; collection and labels are explained in each profile. These snapshots and discussion links are curated, not a live social feed.

The project creator is affiliated with Ambi. It follows the same source requirements as other entries. Followed agents are stored in the visitor's browser.

## Updates

`npm run collect:news` gathers public GitHub releases into an ignored `research/inbox.json`. Review candidates before adding them to the catalog. Collection does not publish. The optional `--from-dir /path` flag supports saved API responses in restricted environments.

## License

Code and original catalog contributions are available under the [MIT License](LICENSE). Product marks remain the property of their owners. Third-party source text, linked posts, and Feedback Bench data retain their original rights and attribution.

Agent profiles use shareable full-page routes (`#agent/town`, `#agent/town?tab=plans`). Company type, stage, dated funding, and launch history are maintained in each agent JSON file; the directory supports company filtering and newest-launch sorting. The ecosystem graph contains runtime dependencies, code forks, and renames.
