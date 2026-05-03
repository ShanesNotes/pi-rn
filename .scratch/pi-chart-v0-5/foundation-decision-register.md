# V0.5 foundation decision register

Status: draft re-distillation surface; not implementation authority by itself.

## Purpose

This register re-distills broad prior pi-chart decisions for the V0.5 clean-canvas rebase. It exists because the project moved the fresh claim-ledger substrate to sibling `pi-ledger/`, and older accepted/proposal decisions may need to be kept, narrowed, deferred, or reopened with a clearer understanding of their product and deployment consequences.

Do not use this register to import old prototype code. Use it to decide which high-level decisions become:

- **Foundation guardrail** — must shape the clean-canvas substrate now.
- **Boundary constraint** — must not be violated now, but not implemented now.
- **Future PRD seed** — useful later; needs its own PRD/issues before implementation.
- **Evidence only** — preserved context, not current direction.
- **Reopen / needs ADR** — prior decision may have changed or needs fresh human review.

## Decision table

| ID | Topic | Current source evidence | Current classification | V0.5 redistillation question | Recommended stance | Status |
| --- | --- | --- | --- | --- | --- | --- |
| FDR-001 | FHIR boundary | `ARCHITECTURE.md`, `ROADMAP.md`, `DESIGN.md`, `memos/*fhir*`, adapter-boundary plans | Boundary constraint now / future PRD seed later | Should FHIR shape the internal claim ledger, or stay an adapter/export/import boundary? | **Accepted redistillation:** FHIR stays outside the clean-canvas kernel. The kernel must not know FHIR exists; it preserves stable claim IDs, hashes, provenance, source refs, and time semantics so future adapters can map to/from FHIR without changing chart truth. | resolved 2026-05-03 |
| FDR-002 | Broad EHR skeleton and clinical memory | ADR 016, `clinical-reference/broad-ehr-skeleton.md`, `ROADMAP.md`, `pkg-019` context-engineering package | Foundation direction now / future PRD seed later | How much EHR breadth should influence the clean kernel before salvage mining? | **Accepted redistillation:** kernel must be broad-EHR-capable but context-curation-agnostic. Support breadth through generic claim shapes, predicates, time, provenance, and stable refs; do not hardcode Orders/MAR/Labs/Nursing/Handoff modules in Phase 1. Phase 2 ContextPacket curation decides task-specific packaging over kernel truth. | resolved 2026-05-03 |
| FDR-003 | Evidence/provenance/review governance | ADR 009-011, ADR 017, ADR 019 | Foundation guardrail now / future PRD seed later | Which evidence/review ideas are kernel-level vs later access/runtime/review-plane scope? | **Accepted redistillation:** Phase 1 preserves provenance and stable reference hooks only. Evidence, contradiction, transform, review, attestation, and agent-review semantics are future predicate/profile/projection work, not kernel subsystems. | resolved 2026-05-03 |
| FDR-004 | Hidden simulator, monitor, and charting boundary | ADR 016, ADR 018, `CONTEXT-MAP.md`, `pi-chart/CONTEXT.md`, user clinical workflow clarification | Foundation guardrail now / adapter PRD seed later | What simulator data can ever become chart truth? | **Accepted redistillation:** hidden simulator/oracle state can never be chart truth, but observable monitor vitals may become chart truth after an **Observable charting seam** that mimics bedside monitor-to-EHR flowsheet workflow. The anti-poison boundary exists to prevent pi-agent foresight, not to reject streamed vitals as chartable evidence. | resolved 2026-05-03 |
| FDR-005 | External EHR/import/export posture and curated patient cases | ADR 006, ADR 011, adapter memos/plans, user clarification on patient_001-005 | Foundation guardrail now / future PRD seed later | Which import/export assumptions should affect claim identity and provenance now? | **Accepted redistillation:** keep the kernel import/export-neutral and provenance-rich. Do not center historical source labels or old importer layouts. Treat `patient_001`-`patient_005` as AI-curated simulated test cases for later testing/salvage, not Phase 1 kernel inputs. | resolved 2026-05-03 |
| FDR-006 | Agent/runtime/orchestrator write posture | ADR 017, archived research packages `pkg-022`/`pkg-023`/`pkg-024` | Boundary constraint now / future PRD seed later | Can agents/orchestrators author accepted clinical truth directly? | **Accepted redistillation:** future agents/orchestrators may produce proposals, reasoning artifacts, and review packets, but they do not directly create accepted chart truth in the V0.5 kernel. Preserve actor/provenance hooks for later attribution. | resolved 2026-05-03 |

## Process

For each row:

1. Read only the cited sources needed for that row.
2. Decide whether the prior decision survives unchanged, narrows, defers, or needs a new ADR.
3. Update this register with the redistilled stance.
4. Promote only accepted guardrails into `clinical-truth-guardrails.md`, `future-runtime-constraints.md`, a new ADR, or future `.scratch` PRD/issues.

## Resolved decisions

### FDR-001 — FHIR boundary

FHIR is a boundary adapter concern, not an internal kernel model. This is the lower-risk V0.5 choice because it keeps clinical-memory semantics, provenance, claim identity, and future non-FHIR integrations from being forced into FHIR resource shapes. FHIR compliance, export, import, server/search, SMART/CDS Hooks, and adapter mapping require later PRD/issues.

### FDR-002 — Broad EHR skeleton and context curation

The clean-canvas kernel must remain broad-EHR-capable without becoming an EHR module framework. It should preserve generic clinical truth primitives that later Orders, MAR, Labs, Nursing Assessment, Handoff, and context-curation PRDs can use. Phase 2 ContextPacket/context curation packages task-specific context from kernel truth; Phase 1 does not hardcode context packets, handoff bundles, or EHR-specific modules.

### FDR-003 — Evidence/provenance/review governance

The clean-canvas kernel exposes hooks, not policies. Phase 1 must keep actor/provenance/time and stable `(id, hash)` references, but it must not introduce mutable `reviewStatus`, `attestedBy`, special hardcoded contradiction/resolution fields, transform graphs, or review/attestation subsystems. Later PRDs can express those semantics through predicates, profiles, and projections over the kernel.

### FDR-004 — Hidden simulator, monitor, and charting boundary

The boundary is hidden-state versus observable-and-charted data, named the **Observable charting seam** when observable signals become chart truth. `pi-sim` may model hidden physiology internally, and `pi-monitor`/public telemetry may emit live vitals like a bedside monitor. Those observable vitals can become chart truth only through an **Observable charting seam** that mimics hospital workflows such as monitor values populating an EHR flowsheet for clinician validation. The purpose is to prevent pi-agent foresight into simulated future/oracle state, not to deny that validated monitor vitals can be charted.

### FDR-005 — External EHR/import/export posture and curated patient cases

The clean-canvas kernel should be import/export-neutral and provenance-rich. It should not encode old source-specific nomenclature, old importer layouts, or external EHR strategy. `patient_001` through `patient_005` are AI-curated simulated test cases that may be valuable after K0-K6 for testing and clinical scenario salvage; they are not Phase 1 kernel inputs and should not shape initial claim identity, hashing, or storage decisions.

### FDR-006 — Agent/runtime/orchestrator write posture

The clean-canvas kernel must not expose `agentAppendClaim`, orchestrator-authored domain clinical claims, raw chart filesystem mutation, or session/transcript-as-patient-memory behavior. Future agent/runtime/orchestrator work can create proposals, reasoning artifacts, review packets, and audit records through later access/review PRDs. Phase 1 preserves actor/provenance hooks so those later outputs can be attributed if accepted through explicit review.
