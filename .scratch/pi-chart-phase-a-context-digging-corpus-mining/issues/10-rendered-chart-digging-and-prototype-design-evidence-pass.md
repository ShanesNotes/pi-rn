# Rendered chart-digging and prototype/design evidence pass

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Mine rendered/product evidence for chart-digging affordances without letting UI prototypes become substrate authority. This includes design/prototype artifacts, generated cockpit evidence, dashboard/planning surfaces, and current rendered/derived outputs that suggest how clinicians navigate chart context.

## Acceptance criteria

- [x] Identifies prototype/design/rendered evidence that may help v0.5 chart-digging language or examples.
- [x] Clearly marks every rendered/product artifact as rendered or prototype evidence, not canonical substrate authority.
- [x] Separates clinical navigation questions from UI screen layout or styling decisions.
- [x] Captures useful clinician-digging affordances such as timeline navigation, current-state panels, open-loop review, evidence expansion, narrative/handoff reading, and uncertainty surfacing.
- [x] Notes when a prototype idea should be deferred to later UI/design work rather than substrate mining.
- [x] Does not modify raw design zip, screenshots, generated HTML, UI source, prototypes, or design assets.
- [x] Produces mismatch-register input rows only for affordances that materially affect v0.5 substrate or context-digging guidance.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`

## Closeout

Artifact created: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/rendered-chart-digging-prototype-design-evidence-pass.md`

Validation summary:

- Reused `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md` required row fields.
- Used approved source-map, brownfield-crosswalk, and corpus-atlas evidence; each artifact marks weak/missing evidence as mismatch-register input.
- Preserved canonical/derived/rendered and hot/warm/cold classifications.
- Boundary held: docs-only under `.scratch/pi-chart-phase-a-context-digging-corpus-mining`; no source, patient, ADR, design asset, lockfile, `pi-ledger`, or `pi-sim` edits.
- Verification captured: artifact row structural check passed for 6 rows; `git diff --check` passed; issue 10 remained `ready-for-human`; issues 11-14 remained `needs-triage`; `pi-chart` typecheck and test suite passed after `npm ci` restored locked local dependencies.
- Subagent skip reason: narrow docs-only lane with concrete issue/artifact scope and no independent implementation slice; serial evidence mining was safer.
