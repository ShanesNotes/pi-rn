# Rendered/prototype/report visual authority boundary

Status: needs-triage
Type: AFK
User stories covered: 6, 77-78, 98

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the authority boundary for rendered/prototype/report visuals. The Corewell report image, generated UI, design assets, screenshots, prototype layouts, tab names, component names, and public API shapes may be product/workflow evidence for clinical questions and attention categories, but they must not define canonical chart memory, storage, API, or substrate authority.

This slice should let future agents borrow the right clinical lessons from visual artifacts without copying UI shape into the chart substrate.

## Acceptance criteria

- [ ] States that report visuals and prototype artifacts are workflow/product evidence only.
- [ ] Defines what can be safely borrowed: clinical questions, attention categories, navigation affordances, and workflow pressure.
- [ ] Defines what must not be borrowed: storage shape, API shape, UI layout, component names, generated artifacts, and disposable `_derived` truth.
- [ ] Links report visual categories back to canonical chart facts/actions/notes/refs when possible.
- [ ] Preserves that assignment-level nurse brain is later aggregation/orchestration, not the first per-patient substrate slice.
- [ ] Includes a boundary check against raw design/generated UI authority.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/03-one-page-nursing-report-projection.md`
