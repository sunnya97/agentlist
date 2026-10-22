# Agentlist visual system

## Product and priorities
Agentlist is a research directory for persistent personal agents.
The primary task is to find agents and compare up to four side by side.
News and family relationships provide supporting context.
The interface uses the compact, information-first product character of the FeedbackBench reference.

## Canvas and color
Use a cool-neutral canvas, white surfaces, quiet dividers, and ink text.
The CSS source of truth is `src/styles.css`; machine-readable tokens are in `.impeccable/design.json`.
`--bg: #fafbfc`; `--paper: #fff`; `--ink: #20242d`; `--muted: #667080`.
`--line: #e6e9ee`; `--soft: #f3f5f9`; `--accent: #4555c7`; `--lime: #eef0ff`.
`--green` is an existing alias for the same indigo accent, `#4555c7`.
Ink identifies primary actions and the active top-level navigation underline.
Indigo identifies active directory tabs, selected controls, saved stars, links, and keyboard focus.
Selected directory rows use `#f3f5ff` on desktop and `#f1f3ff` on mobile.
Muted category tags use restrained local green, runtime violet, or watchlist amber.

## Typography and hierarchy
Use Geist with `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` fallbacks.
Base text is 14px with a 1.5 line height; regular, medium, and semibold weights establish hierarchy.
Desktop page titles are 30px/1.25 at weight 650 with `-.035em` tracking.
Default section titles are 20px/600; smaller headings are 15px/600.
Directory identity is 13px/600, claims are 12px/1.55, and metadata is 11px.
Full comparison claims remain 12px with a 1.75 line height.
Use the monospace stack only for utility notation such as keyboard shortcuts.

## Shared structure
The content and header share a centered 1440px maximum width.
Horizontal gutters are 40px normally, 28px through 1200px, and 48px from 1440px.
Desktop navigation is 68px high with a small brand mark and a secondary suggestion action.
Buttons and search controls are generally 36px high with 7px corner radii.
Primary buttons use white text on ink; secondary buttons use white surfaces and light borders.
Use borders and spacing to separate content; reserve shadows for dialogs and floating feedback.
Official agent logos sit in consistent 34px identity slots, preserving each logo's proportions.

## Directory and detail
Place a short introduction above one filter row, followed by the view tabs and agent data.
Views organize overview, capabilities, models and plans, ownership and control, and what happens if the product goes away.
Computer control is compared as three separate rows - whether it reaches your machine, whether it has one of its own that you can watch or drive, and whether work continues while your machine is off - beside the prose narrative.
Desktop rows align selection, identity, concise feature summaries, and following controls.
The overview combines desktop and mobile into Native apps, using platform icons with hover labels and click-to-open availability details.
A separate Messaging column lists the services an agent can be reached through, using the same icon and popover treatment in a lighter weight. Messaging and native apps stay in distinct columns so an integration is never read as an app.
Announced platforms use muted dashed outlines; beta and limited access have small status dots.
A small availability chip follows the agent name when a product is not simply available: amber for waitlist, reservation and announced, grey for unverified access and for open products carrying a plan, region, age, rollout or invite catch. Shipping products with no catch carry no chip, so the marker only appears when it says something.
Keep summaries compact; open the agent identity to inspect its profile.
Each agent has a full page at `#agent/<id>`, with a breadcrumb, company and launch facts, and linkable Overview, Plans, Discussion, and Sources tabs. Browser back and forward follow normal page navigation.
Profiles and comparisons retain full claim text and numbered source links.
A Company & launch view and company-type filter distinguish public companies, major labs, startups, established companies, independent projects, and research groups. Launch dates display the event kind; funding displays a round and announcement date. The newest-launch sort uses the earliest dated debut, not a later version update.
Profiles also provide a complete source list with checked dates and official product links.
The comparison matrix aligns feature rows across up to four agents and groups related fields.
Show differences, agent replacement, CSV export, and comparison-link actions remain available.
The fixed selection tray keeps chosen agents and the next comparison action visible.

## Mobile layout
At 680px and below, navigation wraps into a second row and page gutters become 18px.
At the reviewed 390px width, the 25px directory title and compact comparison action share a row.
Search takes a full row; type, sort, and following controls share the next row.
Directory rows become two-column labeled details beneath a full-width agent identity.
Selection and following controls stay at the upper right of each agent block.
Profiles use one column; comparison matrices and the family graph scroll within their containers.
Below 380px, the directory introduction can wrap to preserve room for its action.

## Accessibility and review scope
Keyboard focus uses a 2px indigo outline with 3px offset; reduced-motion preferences disable transitions.
Independent visual review covered 1200px desktop directory, 390px mobile directory, and desktop comparison captures; no material visual blockers were found.
The comparison capture preceded a minor text-contrast correction. Interaction checks, 10 passing tests, and mobile `scrollWidth === clientWidth === 390` were reported by the implementing agent, not repeated during the independent review.
