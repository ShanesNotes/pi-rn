# Phase A status matrix

Canonical exact-once Phase A file coverage table for `PHA-001`. Future structural checks should count paths in this table, not incidental board prose.

| Path | Status | Role | Next action |
|---|---|---|---|
| `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` | decision register | Canonical open-schema register; PHA-TB-1 merge target | Merge `accepted` / `accepted-direction` A8/A9a anchors here via PHA-TB-1; `proposed` / `deferred` / `HITL-needed` remain in delta files until promoted. |
| `clinical-reference/phase-a/PHASE-A-CHARTER.md` | phase control | Authoritative Phase A process/scope control | Preserve as source authority; do not rewrite during implementation. |
| `clinical-reference/phase-a/PHASE-A-EXECUTION.md` | phase control | Authoritative Phase A process/scope control | Preserve as source authority; do not rewrite during implementation. |
| `clinical-reference/phase-a/PHASE-A-TEMPLATE.md` | phase control | Authoritative Phase A process/scope control | Preserve as source authority; do not rewrite during implementation. |
| `clinical-reference/phase-a/a0a-patient-demographics-encounter.md` | calibration/foundation input | Candidate input for lower-risk A0-A2 calibration implementation card | Use PHA-TB-2 after open-schema triage. |
| `clinical-reference/phase-a/a0b-active-constraints-synthesis.md` | calibration/foundation input | Candidate input for lower-risk A0-A2 calibration implementation card | Use PHA-TB-2 after open-schema triage. |
| `clinical-reference/phase-a/a0c-problem-list-synthesis.md` | calibration/foundation input | Candidate input for lower-risk A0-A2 calibration implementation card | Use PHA-TB-2 after open-schema triage. |
| `clinical-reference/phase-a/a1-lab-results.md` | calibration/foundation input | Candidate input for lower-risk A0-A2 calibration implementation card | Use PHA-TB-2 after open-schema triage. |
| `clinical-reference/phase-a/a2-results-review.md` | calibration/foundation input | Candidate input for lower-risk A0-A2 calibration implementation card | Use PHA-TB-2 after open-schema triage. |
| `clinical-reference/phase-a/a3-open-schema-entries-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a3-vital-signs-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a4-mar-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a4-open-schema-entries-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a4b-medication-reconciliation-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a4b-open-schema-entries-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a5-io-lda-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a5-open-schema-entries.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a6-open-schema-entries-council-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a6-provider-notes-council-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a7-nursing-notes-council-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a7-open-schema-entries-council-synthesis.md` | phase source input | Phase A research/source artifact | Keep as source input; promote to implementation card only after HITL selection. |
| `clinical-reference/phase-a/a8-icu-nursing-assessment-synthesis.md` | current heavy-surface input | Current A8/A9a source requiring bridge triage | Use PHA-TB-1 to classify candidate deltas, then PHA-TB-3 for one focused reassessment-order loop. |
| `clinical-reference/phase-a/a8-open-schema-entries-synthesis.md` | current heavy-surface delta ledger | Candidate A8 open-schema entries not silently canonical | Use PHA-TB-1 before any schema/view implementation. |
| `clinical-reference/phase-a/a9a-open-schema-entries.md` | current heavy-surface delta ledger | Candidate A9a open-schema entries not silently canonical | Use PHA-TB-1 before any schema/view implementation. |
| `clinical-reference/phase-a/a9a-order-primitive.md` | current heavy-surface input | Current A8/A9a source requiring bridge triage | Use PHA-TB-1 to classify candidate deltas, then PHA-TB-3 for one focused reassessment-order loop. |
| `clinical-reference/phase-a/a9a-research-synthesis.md` | current heavy-surface input | Current A8/A9a source requiring bridge triage | Use PHA-TB-1 to classify candidate deltas, then PHA-TB-3 for one focused reassessment-order loop. |
| `clinical-reference/phase-a/a9b-orderset-invocation-synthesis.md` | current heavy-surface input / Phase-B ADR signal | Current A9b council synthesis for order-set / standing-protocol / template invocation; not silently implementation-ready | Carry accepted-direction council corrections into `OPEN-SCHEMA-QUESTIONS.md` via PHA-TB-1; defer product implementation to later A9b/Phase-B lane. |

## Guardrails

- This matrix is a planning surface, not source policy.
- Do not edit Phase A source docs during implementation unless a selected card explicitly owns that doc edit.
- A8/A9a/A9b are current inputs, not future/missing work.
- A8/A9a open-schema entry files and A9b surviving open-schema anchors are candidate delta ledgers until PHA-TB-1/HITL promotes a decision.
