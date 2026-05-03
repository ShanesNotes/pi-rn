# Review, attestation, authorship, lifecycle, and accountability substrate pack

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-phase-a-context-digging-corpus-mining/PRD.md`

## What to build

Synthesize v0.5 substrate guidance for clinical accountability: authorship, source kind, transform provenance, review actions, attestation, accepted/verified/rejected/co-signed states, suggested agent output, correction, supersession, lifecycle status, and accountable actors. The output should preserve review/accountability semantics without creating premature schema, legal-signature, compliance, or direct agent-write scope.

## Acceptance criteria

- [ ] Covers human-authored, agent-authored, agent-on-behalf-of-human, generated, suggested, accepted, verified, rejected, co-signed, superseded, corrected, entered-in-error, and contested concepts.
- [ ] Separates event lifecycle, source/provenance, transform activity, canonical review actions, derived review/accountability state, and rendered review UI.
- [ ] Uses Phase A/ADR/memo source evidence, brownfield reviewState/attestationState/validate tests, and patient corpus examples or marks corpus as `not-covered` where appropriate.
- [ ] Preserves direct agent accepted-writes as out of scope.
- [ ] Flags any schema-change, role-registry, legal-signature, raw access audit, or compliance machinery as deferred unless explicitly justified for v0.5 substrate only.
- [ ] Provides mismatch-register input rows for unclear or conflicting review/accountability semantics.
- [ ] Does not edit ADRs, schemas, validation code, patients, or runtime policy.

## Blocked by

- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/02-phase-a-source-artifact-mining-map.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/03-brownfield-implementation-crosswalk.md`
- `.scratch/pi-chart-phase-a-context-digging-corpus-mining/issues/04-patient-001-005-corpus-atlas.md`
