# Rendered/prototype/report visual authority boundary

Status: ready-for-human
Type: AFK
User stories covered: 6, 77-78, 98

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define the authority boundary for rendered/prototype/report visuals. The Corewell report image, generated UI, design assets, screenshots, prototype layouts, tab names, component names, and public API shapes may be product/workflow evidence for clinical questions and attention categories, but they must not define canonical chart memory, storage, API, or substrate authority.

This slice should let future agents borrow the right clinical lessons from visual artifacts without copying UI shape into the chart substrate.

## Acceptance criteria

- [x] States that report visuals and prototype artifacts are workflow/product evidence only.
- [x] Defines what can be safely borrowed: clinical questions, attention categories, navigation affordances, and workflow pressure.
- [x] Defines what must not be borrowed: storage shape, API shape, UI layout, component names, generated artifacts, and disposable `_derived` truth.
- [x] Links report visual categories back to canonical chart facts/actions/notes/refs when possible.
- [x] Preserves that assignment-level nurse brain is later aggregation/orchestration, not the first per-patient substrate slice.
- [x] Includes a boundary check against raw design/generated UI authority.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/03-one-page-nursing-report-projection.md`

## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/rendered-prototype-report-visual-authority-boundary.md`.
- Defined report visuals, rendered prototypes, screenshots, design assets, generated UI, tab/component names, public API shapes, and disposable `_derived` output as workflow/product evidence only.
- Defined safe borrowing: clinical questions, attention categories, navigation affordances, workflow pressure, source-state prompts, mismatch/review prompts, and usability constraints.
- Defined unsafe borrowing: storage shape, API shape, UI layout, component names, generated artifacts, public API shapes, design-system assets, disposable `_derived` truth, and canonical chart schema.
- Mapped report visual categories back to canonical chart facts/actions/notes/refs or explicit source-needed/report-only/stale/conflicting caveats.
- Preserved assignment-level nurse brain as later aggregation/orchestration over per-patient workflow items, not first substrate authority.
- Added raw design/generated UI authority boundary checks for future agents.
- Excluded UI implementation, backend/storage/adapter/vector/OpenBrain/runtime/access-plane work, hidden `pi-sim` coupling, and `pi-ledger` kernel expansion.

## Closeout evidence

- `python3` structural check — PASS: artifact status, issue status/checklist, workflow/product evidence stance, safe borrowing, unsafe borrowing, report category source-linking, assignment-level deferral, boundary checks, assistant limits, and scope exclusions verified.
- `git diff --check` — PASS.
- Ralph architect verification — APPROVED: no blockers; architect cited evidence lines for authority stance, safe/unsafe borrowing, source-linking, assignment-level deferral, boundary checks, and scope exclusions.
- AI slop cleanup pass — PASS: scoped to changed issue 14 docs; boundary scan found only intentional non-authority and scope-exclusion language; duplicate scan found no repeated prose; no cleanup edits required.
- Post-deslop `python3` structural check — PASS.
- Post-deslop `git diff --check` — PASS.
