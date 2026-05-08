# One-page nursing report projection

Status: ready-for-human
Type: AFK
User stories covered: 82-84, 98

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define a derived one-page nursing report projection inspired by the ICU handoff sheet reference. The projection should organize high-attention shift-start context such as code status, isolation/precautions, consults, allergies, admission context, principal problem, relevant history, nursing assessment, drips/infusions, medications, blood-pressure goals, lines/tubes/drains, wounds, mobility/fall risk, abnormal labs, to-do items, family/social context, and safety checks.

The report projection must remain a glanceable workflow scaffold over canonical chart facts/actions/notes/refs, not a permanent medical record, UI mandate, or substrate authority by itself.

## Acceptance criteria

- [x] Defines report projection categories grounded in the ICU nurse handoff story and image reference.
- [x] For each category, identifies the canonical memory sources it should project from or link back to.
- [x] States that handwritten/report-sheet material is workflow evidence unless promoted into sanctioned chart facts/actions/notes/refs.
- [x] Describes how the in-chart agent can use the report projection to explain context and prompt source review.
- [x] Avoids prescribing visual layout, component names, storage shape, or public API shape.
- [x] Includes non-authority language for report sheets, prototype visuals, generated UI, and disposable derived output.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/02-canonical-memory-vs-derived-projection-contract.md`


## Completion evidence

- Artifact: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/one-page-nursing-report-projection.md`
- Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-03-04-06-20260504T151627Z.md`
- Verification: structural docs checks run in Ralph iteration 1.
