# Test Spec — Clinician Chart Navigation Story Stress Test

## Scope
Validate a downstream implementation of the nurse start-of-shift chart navigation storyboard for pi-chart.

## Test Strategy
Use layered validation:
1. Static content/unit tests for required story states and safety language.
2. Screenshot capture for layout readability and visual style.
3. Optional Playwright interaction tests if downstream execution adds clickable state transitions.
4. Manual clinician walkthrough against acceptance criteria.

## Static Test Cases

### T1 — Overview default anchors
Assert generated prototype includes:
- `π-chart / overview`
- `Patient 002`
- `FULL CODE`
- `WATCHER`
- `CAP day 1`
- `SpO₂ 89% on 6L simple mask`
- `HR 112`
- `RR 30`
- `lactate 2.8`
- `Due 09:50`

### T2 — Left navigation supports full chart journey
Assert visible nav/path labels include equivalents for:
- Overview
- Handoff / Care plan
- Vitals / flowsheet
- Meds / MAR
- Notes / provider notes
- Labs / dx
- Radiology / imaging or a clear nested imaging path
- Evidence/source chain
- Agent Canvas or Pi-agent process lane

### T3 — Clinical worklist section order
Assert right rail section order:
1. Due / Overdue
2. Staged Charting
3. Generated Drafts
4. Blocked MAR Items
5. Charted / Done

### T4 — Handoff workspace
Assert handoff state/workspace includes:
- handoff report/form label
- source/context rail
- Discard draft
- Stage draft
- Chart
- FINAL CLINICAL WRITE

### T5 — Previous-shift vitals review
Assert vitals review includes:
- previous shift or time-window label
- SpO₂ trend
- HR trend
- RR trend
- BP trend
- O₂ device/support changes
- due vitals indicator

### T6 — MAR safety boundary
Assert MAR review includes:
- Zosyn due at 12:00
- blocked pending scan/attestation
- medication administration cannot be auto-charted by agent, or equivalent
- no Chart finalization action for medication administration without scan/attestation

### T7 — Provider notes distinction
Assert notes state includes:
- provider assessment/plan
- nursing note or prior note context
- generated summary/draft label if present
- source/provenance indication for generated summary

### T8 — Due vitals charting
Assert due vitals charting workspace includes fields or labels for:
- timestamp
- SpO₂
- HR
- RR
- BP
- O₂ device/support
- work of breathing
- Chart / FINAL CLINICAL WRITE
- escalation criteria if SpO₂ < 90% or accessory muscle use persists

### T9 — Labs and radiology
Assert labs/radiology states include:
- ABG
- lactate 2.8
- radiology/imaging report or CXR
- timestamp/status
- link/relevance to CAP or respiratory problem

### T10 — Pi-agent shift organization boundary
Assert Pi-agent shift organization output includes:
- immediate watch items
- due tasks
- medication safety gates
- labs/radiology follow-ups
- documentation suggestions
- language indicating advice/process, not chart truth

### T11 — Forbidden product-language regression
Assert generated prototype user-visible copy does not contain:
- legacy VCS-style finalization terms, checked with a dynamically constructed regex so this spec does not normalize that copy

Use a dynamically constructed regex in tests if test names must discuss the banned terms.

## Screenshot Validation
Capture:
- Overview default: `1440x1080`
- Overview default: `1280x1080`
- Active shift recon/storyboard state: `1440x1080`
- Active shift recon/storyboard state: `1280x1080`

Command pattern:
```bash
node scripts/screenshot-prototype.mjs docs/prototypes/pi-chart-agent-canvas.html /tmp/pi-chart-shift-recon-1440x1080.png --width 1440 --height 1080
node scripts/screenshot-prototype.mjs docs/prototypes/pi-chart-agent-canvas.html /tmp/pi-chart-shift-recon-1280x1080.png --width 1280 --height 1080
```

Visual checks:
- Warm cream/off-white boundary space.
- Sharp black text.
- Thin precise black rules.
- Compact clinical instrument typography.
- Restrained red/orange clinical accents.
- No pastel cards.
- No SaaS dashboard styling.
- No oversized radius.
- No consumer chat-app look.
- Header/patient metadata not cramped.
- Right rail remains legible.
- Floating pane does not obscure critical patient status at target viewports.

## Optional Interaction Tests
If downstream implementation adds JS state transitions:
1. Click `Care plan / handoff`; expect handoff workspace visible.
2. Click `Vitals / flowsheet`; expect previous-shift trend visible.
3. Click `Meds / MAR`; expect Zosyn blocked state visible.
4. Click `Notes`; expect provider notes visible.
5. Open due vitals; enter sample values; expect Chart final write affordance.
6. Click `Labs / dx`; expect ABG/lactate visible.
7. Open imaging; expect radiology report visible.
8. Expand Pi-agent dock; submit shift-organization prompt; expect advisory shift plan.
9. Return to Overview; expect updated worklist state.

## Required Verification Commands
```bash
npm run typecheck
npm test
npm run check
```

If package scripts change, use nearest repo-supported equivalents.

## Acceptance Gate
Pass only when:
- All static tests pass.
- Required screenshots are captured and manually reviewed.
- MAR blocked/scan/attestation boundary is visible.
- Pi-agent output is advisory and not chart truth.
- No forbidden product language appears in generated prototype user-visible copy.
