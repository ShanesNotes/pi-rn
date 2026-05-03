# Review, attestation, authorship, lifecycle, and accountability substrate pack

Status: ready-for-human
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize v0.5 substrate guidance for clinical accountability: authorship, source kind, transform provenance, review actions, attestation, accepted/verified/rejected/co-signed states, suggested agent output, correction, supersession, lifecycle status, and accountable actors. The output should preserve review/accountability semantics without creating premature schema, legal-signature, compliance, or direct agent-write scope.

## Acceptance criteria

- [x] Covers human-authored, agent-authored, agent-on-behalf-of-human, generated, suggested, accepted, verified, rejected, co-signed, superseded, corrected, entered-in-error, and contested concepts.
- [x] Separates event lifecycle, source/provenance, transform activity, canonical review actions, derived review/accountability state, and rendered review UI.
- [x] Uses Phase A/ADR/memo source evidence, brownfield reviewState/attestationState/validate tests, and patient corpus examples or marks corpus as `not-covered` where appropriate.
- [x] Preserves direct agent accepted-writes as out of scope.
- [x] Flags any schema-change, role-registry, legal-signature, raw access audit, or compliance machinery as deferred unless explicitly justified for v0.5 substrate only.
- [x] Provides mismatch-register input rows for unclear or conflicting review/accountability semantics.
- [x] Does not edit ADRs, schemas, validation code, patients, or runtime policy.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`

## Closeout

Artifact created: `.scratch/pi-chart-phase-a-context-digging-corpus-mining/review-attestation-authorship-lifecycle-accountability-substrate-pack.md`

Validation summary:

- Reused `.scratch/pi-chart-phase-a-context-digging-corpus-mining/mining-template.md` required row fields.
- Used approved source-map, brownfield-crosswalk, and corpus-atlas evidence; each artifact marks weak/missing evidence as mismatch-register input.
- Preserved canonical/derived/rendered and hot/warm/cold classifications.
- Boundary held: docs-only under `.scratch/pi-chart-phase-a-context-digging-corpus-mining`; no source, patient, ADR, design asset, lockfile, `pi-ledger`, or `pi-sim` edits.
