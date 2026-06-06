# G009 — pi-chart backend-mediated adapter slice

## Status

Complete.

## Implemented

- Added `pi-chart/src/clinical-truth-adapter.ts`.
- Added a minimal backend/client seam:
  - `ClinicalTruthBackendClient`
  - `ClinicalTruthAppendRequest`
  - `ClinicalTruthAppendResponse`
  - `ClinicalTruthAcceptedEntryView`
- Added append helpers:
  - `buildAppendVitalSampleRequest(...)`
  - `buildAppendVitalEventRequest(...)`
  - `appendVitalSampleToClinicalTruth(...)`
  - `appendVitalEventToClinicalTruth(...)`
- Added accepted-entry projection:
  - `projectAcceptedVitalSign(...)` derives clinician-facing vital fields from the accepted backend `claim_json` and accepted metadata, not from the original caller sample/view.
- Added fake contract backend:
  - `createFakeClinicalTruthBackendClient(...)` records backend-mediated requests and returns queued/fake accepted entries without hash/canonicalization authority.
- Exported the adapter and contract surface from `pi-chart/src/index.ts`.
- Added `pi-chart/src/clinical-truth-adapter.test.ts` covering:
  - backend seam request shape
  - projection from accepted fields
  - rejection of draft/suggested events before backend append
  - no hidden `pi-sim`, no direct service access, no TypeScript hash/canonicalization coupling

## Boundary notes

- The adapter only builds requests and calls an injected backend client; it does not import or instantiate Rust service-core.
- Draft/suggested/inferred EventEnvelope facts are rejected before append; clinician review/suggestion state remains outside this service append path.
- Hashes and accepted metadata are consumed only from backend responses.

## Verification

- `cd pi-chart && npm run typecheck` passed.
- `cd pi-chart && node --test --import tsx src/clinical-truth-contract.test.ts src/clinical-truth-adapter.test.ts` passed: 7/7 tests.
- `git diff --check` passed.

## Evidence files

- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g009-pi-chart-typecheck.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g009-adapter-tests.txt`
- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/g009-diff-check.txt`
