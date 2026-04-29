# Plan — patient_005 post-op frailty / delirium / fall-risk row

## Scope

Create the fifth generated CORP-019 corpus row as `patient_005`, bounded to chart-visible evidence only and operator-review-pending status.

## Scenario

Older POD0/POD1 hip-fracture repair patient with baseline frailty, hearing/glasses orientation needs, pain/sedation tension, fluctuating attention, orthostatic dizziness, unsafe transfer attempt, PT-confirmed two-person assist need, nursing safety interventions, and night-shift fall/delirium handoff.

## Source mix

- Fully hand-authored synthetic row.
- No Synthea seed/version/parameters used.
- Baseline functional/cognitive context and acute post-op augmentation are explicitly chart-visible in `patient.md`, `constraints.md`, events, notes, labs, vitals, and the scenario blueprint.

## Required memory-proof fact

- Fact id: `evt-005-0018`
- Label: functional-safety delirium/fall-risk finding
- Required reuse surfaces:
  - review/assessment: `evt-005-0019`
  - evidence/provenance: supported by later events and notes
  - open loop: `evt-005-0020`
  - handoff: `evt-005-0024`
  - narrative note: PT and handoff notes reference the same fact
  - corpus packet row: CORP-019 matrix identifies the proof fact

## Verification checklist

- `npm run rebuild -- --patient patient_005`
- `npm run validate`
- `npm run typecheck`
- `npm test`
- `find decisions -maxdepth 1 -name '019-*' -print`
- `git status --short -- . ../pi-sim`

## Boundary

Do not edit `../pi-sim`, `decisions/019-*`, package files, schema/importer/runtime files, or existing patient directories.
