# Legacy EHR leverage audit

Status: rescue review artifact

Purpose: identify the mature clinical-documentation rails pi-chart should reuse or adapt rather than rebuilding worse versions from scratch.

| EHR rail / pattern | Current or legacy evidence | Clinical value | Reuse potential | Adaptation needed | Risk if ignored | Decision |
|---|---|---|---|---|---|---|
| EHR-001 Patient / encounter / visit identity | `pi-chart/CONTEXT.md`; ADR016; Phase A hot-current-state rows | Anchors all memory to the right patient and episode of care. | high | Preserve explicit patient and encounter scope while mapping to ledger subject/scope. | Cross-patient leakage, stale encounter context, unsafe packet compilation. | reuse |
| EHR-002 Flowsheets / vitals | ADR016 six surfaces; `clinical-reference/broad-ehr-skeleton.md`; Phase A trajectory pack | Captures time-series bedside state and trajectory. | high | Treat monitor/public telemetry as observable input that becomes chart truth only through a charting seam. | Agent misses deterioration or sees unvalidated/oracle data. | adapt |
| EHR-003 Nursing assessment | ADR016; Phase A bedside/current-state packs | Adds bedside findings that raw vitals do not explain. | high | Model structured findings and source/provenance; avoid forcing all assessment into prose. | Context packet lacks why the numbers matter. | adapt |
| EHR-004 Notes / narrative charting | ADR016; Phase A notes/narrative/handoff pack; `memoryProof` projection | Human-readable memory, rationale, uncertainty, and continuity. | high | Keep notes addressable and evidence-linked; use projections to reduce duplicate prose. | Summaries become unsupported or nurses re-document the same fact repeatedly. | adapt |
| EHR-005 Orders / MAR / interventions | ADR016; orders/MAR/open-loop substrate pack | Shows intended work, performed work, medication administration, and follow-up state. | high | Separate intent, action, fulfillment, review, retiming, and source authority. | Open obligations are invisible; agent confuses planned vs performed care. | adapt |
| EHR-006 Labs / diagnostics | ADR016; trajectory/evidence/labs pack | Asynchronous evidence changes assessment and closes/opens loops. | high | Preserve result time, review state, evidence links, and contradiction/support relationships. | Agent over-trusts unreviewed or stale results. | adapt |
| EHR-007 Care plan / handoff | ADR016; handoff packs; shift-brain strategy | Maintains continuity across clinicians and shifts. | moderate-high | Treat handoff as projection/communication over canonical memory, not storage truth. | Handoff becomes a detached summary that drifts from chart evidence. | adapt |
| EHR-008 Authorship / signatures / cosign / audit | ADR017; review-attestation pack | Makes accountability, review, and professional responsibility visible. | high | Represent review/attestation as append-only governance events or projections, not mutable fields. | Agent-generated content becomes clinically ambiguous or unaccountable. | adapt |
| EHR-009 Task / worklist / open-loop tracking | Phase A open-loop rows; shift-brain strategy | Helps clinicians see pending work, due windows, blocked items, and follow-up. | moderate | Keep as derived workflow projection over chart facts/actions; do not make autonomous completion authority. | Task list becomes either absent or unsafe automation. | adapt |
| EHR-010 Import / export / API / standards | Source-authority map; v0.5 foundation decision register; FHIR/openEHR memos | Enables interoperability and external validation. | moderate | Use standards as boundary adapters and reference constraints, not internal model capture. | Either lock into standards too early or ignore mature interoperability rails. | adapt |
| EHR-011 Corrections / late entries / supersession | ADR017; pi-ledger context; current append-only guardrails | Preserves clinical record history without erasing prior state. | high | Map chart-level correction semantics onto ledger revision/correction identity after adapter design. | Unsafe mutation, ambiguous historical memory, broken replay. | adapt |
| EHR-012 Problem/history/allergy/constraint surfaces | Phase A hot/cold packs; ADR016 broad surface | Provides safety-floor context agents must not omit. | high | Define hot safety floor and cold-history citation behavior before ContextPacket freeze. | Context packets omit critical contraindications or historical constraints. | adapt |

## Summary

Legacy EHRs already provide disciplined rails for patient scope, encounter time, clinical chronology, orders, MAR, labs, notes, review, and audit. pi-chart should not clone a full EHR product surface, but it should reuse these rails where they encode real clinical memory obligations.
