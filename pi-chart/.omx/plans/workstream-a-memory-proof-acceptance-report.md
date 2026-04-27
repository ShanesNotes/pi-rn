# Workstream A Memory-Proof Acceptance Report

## 1. Source inputs

- `.omx/plans/prd-workstream-a-memory-proof-tracer-bullet-tdd.md`
- `.omx/plans/test-spec-workstream-a-memory-proof-tracer-bullet-tdd.md`
- `.omx/plans/doc-sprawl-source-map.md`
- `memos/Workstream A PRD test.md`
- `memos/deep-research-alignment-revised-2026-04-25.md`
- `decisions/016-broad-ehr-skeleton-clinical-memory.md`
- `src/views/memoryProof.ts`
- `src/views/memoryProof.test.ts`
- `src/derived.test.ts`
- `src/views/openLoops.test.ts`
- `patients/patient_002/**`

## 2. Current implementation evidence

The existing implementation is a brownfield Workstream A realization, not a greenfield target:

- `memoryProof` composes bounded reads over `timeline`, `currentState`, `openLoops`, and `narrative`.
- It emits the six proof sections: what happened, why it mattered, evidence, uncertainty, open loops, and next-shift handoff.
- `patient_002` is the realized broad fixture with observation, order, action, lab/diagnostic, care-plan, handoff, narrative-note, and vitals evidence surfaces.
- Evidence refs are bounded to visible events, and vitals evidence windows are clamped to the consumer event time.
- Existing derived-output tests already cover deterministic `memory-proof.md` rendering.

## 3. Acceptance matrix

| Acceptance item | Status | Evidence / rationale |
|---|---:|---|
| six-surface fixture | Pass | `src/views/memoryProof.test.ts` asserts `patient_002` includes nursing assessment, order, action, lab/diagnostic, care plan, handoff, narrative note, and vitals evidence. |
| single observation reuse | Pass | `src/views/memoryProof.test.ts` now asserts exactly one canonical WOB observation, `evt_p002_0905_wob`, and verifies it is reused through review, evidence/provenance, open loop/care plan, handoff, and narrative note paths. |
| deterministic projection | Pass | `src/views/memoryProof.test.ts` compares byte-identical JSON across repeated `memoryProof` calls; `src/derived.test.ts` preserves generated Markdown determinism. |
| open loop closure semantics | Pass | `src/views/memoryProof.test.ts` verifies the fulfilled ABG order is closed while the next-shift care plan remains open; existing `src/views/openLoops.test.ts` covers fulfillment, superseded fulfillment, and `asOf` hiding generically. |
| evidence chain/provenance reach | Pass | `src/views/memoryProof.test.ts` asserts WOB provenance reaches evidence and downstream care-plan/handoff sections. |
| hidden simulator opacity | Pass | `src/views/memoryProof.test.ts` copies `patient_002` to an OS temp chart root, adds `_sim_state.json`, and asserts byte-identical output plus no forbidden hidden-state key leakage. |
| asOf no-future-facts behavior | Pass | `src/views/memoryProof.test.ts` asserts early replay excludes the later ABG result, handoff note, and care plan while later replay includes them. |
| validation without new primitive | Pass | No top-level event type or schema primitive was added; `npm run check` is the quality gate for fixture validation and derived rebuild. |
| fingerprint/export | Deferred | Byte-identical deterministic JSON and deterministic generated Markdown are sufficient for this tracer bullet. A separate fingerprint helper belongs with later adapter/export boundary work, where consumer semantics and digest scope can be decided. |
| proposed ADR 017 non-canonical | Pass | No actor/attestation/review policy was implemented; ADR 017 remains proposed and non-canonical for this Workstream A tracer bullet. |

## 4. Tests added/changed

- Strengthened `memoryProof reuses one bedside observation across projection contexts` with a duplicate canonical WOB guard and narrative-note-path assertion.
- Added `memoryProof ignores hidden simulator state files` to prove chart-only opacity against private simulator keys.
- Added `memoryProof represents open-loop closure with patient_002` to prove ABG closure and next-shift care-plan pending state in the realized fixture.
- Acceptance report decisions are verified in Ralph evidence rather than a tracked test because `.omx/` is intentionally ignored local workflow state.
- Hardened `src/validate.test.ts` fixture copying to exclude `.omx`, `.git`, `node_modules`, and `_derived` so dynamic workflow locks cannot contaminate copied chart fixtures.

## 5. Deferred work and rationale

- **Fingerprint/export:** deferred. Workstream A needs deterministic proof output, not an external artifact contract. Current byte-identical JSON and deterministic Markdown satisfy the immediate memory-proof acceptance claim. A digest/fingerprint should be designed with later adapter/export work so it covers the right payload, timestamp rules, and downstream verification semantics.
- **FHIR/Medplum/HealthChain/SMART/CDS Hooks adapters:** deferred. The source-map and PRD place these after Workstream A proof hardening.
- **Actor/attestation/review workflow from proposed ADR 017:** deferred. This would turn a proposed taxonomy into product policy without HITL acceptance.
- **Read-path audit, retention/redaction, legal export, and UI rendering:** deferred. They are important future workstreams but not needed to prove clinical-memory substrate behavior.

## 6. Patient_001 blueprint vs patient_002 realized-fixture reconciliation

The Workstream A memo originally described `patient_001` as a blueprint. Current repo reality realizes the broad six-surface proof on `patient_002`. This report accepts `patient_002` as the execution fixture because it exercises the relevant memory-proof path and already has linked observation, assessment, order, action, lab, care plan, handoff, note, and vitals evidence. No back-port to `patient_001` is required for this tracer bullet unless future tests identify a concrete coverage gap.

## 7. ADR 016 / proposed ADR 017 authority note

ADR 016 is the accepted authority for the broad-EHR skeleton clinical-memory proof. Proposed ADR 017 remains non-canonical. This implementation lane intentionally does not add actor attestation, review gates, cosign/reject semantics, or any policy machinery from proposed ADR 017.

## 8. Recommended next workstream

Recommended next workstream: **Phase A completion-to-implementation bridge**. Workstream A now provides a hardened proof seam; the next best unblocking move is to convert the near-complete Phase A docs into implementation-ready tracer bullets that attach to this proven memory-proof/evidence-loop substrate. v0.3 reconciliation should run as a secondary planning lane if Phase A exposes roadmap/status conflicts.

## 9. Verification evidence

Fresh Ralph verification on 2026-04-25:

- `node --test --import tsx src/views/memoryProof.test.ts src/derived.test.ts` — PASS, 14 tests passed.
- `node --test --import tsx src/validate.test.ts` — PASS, 81 tests passed.
- `npm test` — PASS, 251 tests passed after removing the tracked-test dependency on ignored `.omx` report state.
- `npm run typecheck` — PASS, `tsc --noEmit` exited 0.
- `npm run check` — PASS, derived rebuild completed and validator reported 0 errors / 0 warnings across 2 patients.
- Boundary grep for hidden simulator keys outside tests — PASS, no `src` or `patients` runtime/fixture matches outside `*.test.ts`.
