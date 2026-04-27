# Clinician Chart Navigation Story Context

Task statement: Create a clinician user story and stress-test plan for navigating the entire pi-chart UI during shift-start clinical work.

Desired outcome: A plan another agent can execute to iterate the pi-chart UI/UX layout around a nurse coming on shift: open handoff, review vitals, MAR, provider notes, chart due vitals, review labs/radiology, then ask Pi-agent chat to organize the shift and attention priorities.

Known facts/evidence:
- Current prototype generator: `scripts/agent-canvas.ts`.
- Current generated UI: `docs/prototypes/pi-chart-agent-canvas.html`.
- Latest UI iteration defaults to Overview with patient banner, left nav, vitals strip, timeline, right clinical worklist, floating editable artifact pane, and bottom Pi-agent dock.
- Existing screenshot tooling: `scripts/screenshot-prototype.mjs`.
- Existing node tests include `scripts/agent-canvas.test.ts` for content/language checks.
- Product constraints: Chart/Charted/final clinical write language; no Commit/Committed; pi-agent is co-pilot; chat is process, not chart truth; right rail is clinical worklist; floating panes are editable draft/charting workspaces.

Constraints:
- Planning only; no implementation in this workflow.
- Story should be written from clinician/nurse perspective and stress-test layout/workflow, not merely list UI components.
- Synthetic fixture data only.
- Medication administration must not be auto-charted; MAR med charting requires scan/attestation.
- Preserve dense original-prototype clinical instrument aesthetic.

Unknowns/open questions:
- Exact future IA depth for notes/labs/radiology/MAR pages is not implemented yet.
- Whether execution agent should build full page state transitions or static storyboard states first.

Likely codebase touchpoints for downstream execution:
- `scripts/agent-canvas.ts`
- `docs/prototypes/pi-chart-agent-canvas.html`
- `scripts/agent-canvas.test.ts`
- `scripts/screenshot-prototype.mjs`
- `docs/design/pi-chart-overview-v.0.4.5/*`
