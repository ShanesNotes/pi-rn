# G011 — Documentation, ADR, and handoff updates

## Status

Complete.

## Updated docs

- Added `pi-ledger/docs/adr/010-vital-sign-service-core-slice.md`.
- Added `pi-chart/docs/adr/022-vital-sign-clinical-truth-adapter-slice.md`.
- Updated `pi-ledger/CONTEXT.md` with the current service-core slice.
- Updated `pi-ledger/README.md` with clinical-truth service-core layout and commands.
- Updated `pi-chart/CONTEXT.md` with the current clinical-truth adapter slice.
- Updated `pi-chart/README.md` with adapter slice usage/verification.
- Updated `CONTEXT-MAP.md` verification entrypoints for the cross-project harness.
- Added `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/HANDOFF.md`.

## Out-of-scope decisions preserved

- No production gRPC/UDS runtime implemented yet.
- No production auth/session/access-plane policy implemented yet.
- No production registry/ontology governance beyond first `vital.sign` fixture.
- No direct browser/EHR/workflow-to-ledger service access.
- No TypeScript canonicalization/hash authority.

## Verification

- `git diff --check` passed.
- Required doc artifacts exist.

## Evidence files

- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g011-diff-check.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g011-doc-artifacts.txt`
