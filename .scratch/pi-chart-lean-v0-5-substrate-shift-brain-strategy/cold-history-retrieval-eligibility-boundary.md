# Cold-history retrieval eligibility boundary

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/13-cold-history-retrieval-eligibility-boundary.md`
Depends on:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/canonical-memory-derived-projection-contract.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/shift-start-chart-digging-packet.md`
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/human-agent-workflow-boundary.md`

## Purpose

Define how cold history can support shift-start chart digging and bounded in-chart-agent reasoning without becoming hot current-care truth by retrieval alone. Cold history includes source-linked longitudinal/background material such as H&P, prior encounters, old consults, discharge summaries, and narrative context.

This artifact defines eligibility and citation behavior only. It does not choose vector search, semantic search, OpenBrain, backend, storage, service, runtime, access-plane, adapter, or external EHR architecture.

## Cold-history posture

Cold history is useful because clinicians need background: why the patient is here, what baseline matters, what prior problems/procedures shape risk, and which older narratives explain current concerns. It is not useful if it floods the hot packet or appears as unreviewed current truth.

| Context tier | Role | Boundary |
| --- | --- | --- |
| Hot current-care truth | Deterministic current facts needed for immediate safety and bedside decisions | Must be current, source-linked, and not dependent on semantic retrieval output alone |
| Warm supporting evidence | Recent or currently relevant evidence used during deeper chart digging | Can cite cold material when linked to a current question, review action, order, problem, trend, or clinician judgment |
| Cold history | Longitudinal/background narrative and prior encounter material | Source-linked and citation-ready; not current-care truth unless explicitly promoted or tied to current relevance |

Hot/warm/cold describes access behavior and clinical priority, not where or how data is stored or retrieved.

## Cold-history categories

Cold-history material relevant to shift-start chart digging includes:

| Category | Shift-start use | Citation need |
| --- | --- | --- |
| H&P and admission narrative | Explains why the patient is here and what baseline/background context matters | Note title/type, author, encounter, date/time, section or addressable text ref |
| Prior encounters/admissions | Gives longitudinal context, recurrent issues, prior acuity, or trajectory | Encounter/date, facility/source when available, discharge or summary refs |
| Old consult notes | Explains specialist history, recommendations, constraints, or unresolved background | Specialty, author, date/time, note/section, whether recommendation is old or current |
| Discharge summaries | Summarizes prior hospitalization course, diagnoses, procedures, medications, and follow-up | Encounter/date, summary author/source, discharge context |
| Longitudinal problem/background narrative | Captures baseline disease burden, chronic conditions, prior complications, and course | Source note/ref, date, active/resolved/uncertain status when known |
| Baseline functional, cognitive, respiratory, mobility, diet, or social history | Helps nurses interpret current deviation and care needs | Source, date, reporter/authorship, caveat if outdated or report-only |
| Prior procedures, devices, lines, wounds, implants, and access history | Helps anticipate risk, compatibility, and source of current concerns | Procedure/device/source refs, dates, current relevance caveat |
| Allergies, intolerances, precautions, or durable constraints from prior history | Can matter for current safety if still active or explicitly carried forward | Current charted active source required before treating as hot constraint |
| Family/social/caregiver context | Helps communication, discharge planning, and bedside support | Source/reporter and date; avoid making unsupported assumptions |
| External/imported/report-only history | May orient care but may not be chart truth yet | Mark as external, report-only, source-needed, stale, conflicting, or unverified where applicable |

Cold-history categories may be eligible for future retrieval or query expansion, but eligibility does not make the retrieved content authoritative.

## Citation expectations

Cold-history summaries and references should be citation-ready. A safe citation should preserve as many of these as available:

1. patient/encounter/as-of scope;
2. source type, such as H&P, consult, discharge summary, prior encounter note, external record, or report-only handoff statement;
3. author, specialty, role, organization, or provenance when known;
4. source date/time and relevant clinical/effective time;
5. section, excerpt, addressable note span, artifact ref, or stable source pointer;
6. lifecycle/review state, such as final, amended, corrected, entered-in-error, superseded, reviewed, unreviewed, report-only, source-needed, stale, or conflicting;
7. source age and why older context is still being shown;
8. uncertainty, counterevidence, or current-source conflict when known;
9. whether the content is background, warm support, or explicitly promoted current-care truth.

The summary can be concise, but the source trail must remain reachable. A confident paragraph without a source path is not acceptable cold-history support.

## Promotion and current-relevance rules

Cold context can become warmer or hotter only through explicit relevance, source linkage, or human/sanctioned chart action.

| Transition | Allowed when | Still required |
| --- | --- | --- |
| Cold → warm supporting evidence | A current chart-digging question, current plan, active problem, trend, medication/order issue, bedside concern, or handoff/watch item makes the old context relevant | Source link, date/age caveat, and explanation of why it matters now |
| Cold → hot current-care truth | A current canonical fact/action/order/problem/review/attestation explicitly promotes or links the historical fact as current | Current source of truth, actor/review/provenance, timing, and lifecycle state |
| Cold stays cold | Material is useful orientation but not tied to a current decision | Keep it background and citation-ready; do not place it in the hot packet as truth |
| Cold is withheld/quiet | Material is stale, duplicative, sensitive, irrelevant, unsupported, or likely to distract from current care | Do not erase it; keep available through source-linked chart history if authorized |

Examples:

- An old discharge summary saying a patient had CKD is cold background until the current problem list, labs, provider plan, or clinician review makes renal disease relevant to current care.
- An H&P admission reason is cold by default, warm for shift-start orientation, and hot only where current orders/problems/plan/review make it part of active care.
- A prior allergy mention is not a hot safety constraint unless current charted allergy/constraint source supports it or a clinician promotes/reviews it through sanctioned workflow.
- A prior consult recommendation remains historical unless a current plan, order, or review explicitly carries it forward.

## Clinician-facing summaries

Plain-language cold-history summaries should help the nurse orient quickly while keeping caveats visible.

A safe summary should:

- answer the clinical question in one to three concise sentences;
- state whether the material is background, warm support, or current promoted truth;
- cite the source note/ref and source date;
- say why the old context matters now when presented outside deep history;
- preserve uncertainty, source age, and conflicts;
- avoid implementation language such as embedding, vector, retrieval backend, storage node, API, or OpenBrain;
- avoid implying that a generated summary is accepted chart truth.

Example phrasings:

- "Background: H&P from 2026-05-02 says the patient was admitted for septic shock from suspected pneumonia; latest ICU note and current orders should be checked for today's active plan."
- "Warm support: old cardiology consult documents reduced EF; current pressor/diuresis decisions still need current note, vitals, I&O, labs, and orders."
- "Source-needed: report mentions baseline home oxygen, but no linked chart source appears in this packet yet."
- "Historical: prior discharge summary lists difficult access; relevant to line planning only if current team confirms or chart links it."

## In-chart-agent reasoning boundary

The bounded in-chart assistant may reason over cold history to support orientation, citation, and question answering. Its output remains derived/provisional unless a human or sanctioned chart workflow promotes a fact.

The assistant may:

- retrieve or surface eligible cold-history candidates when allowed by future implementation;
- summarize H&P, prior encounters, old consults, discharge summaries, and background narrative with citations;
- explain why a historical item may be relevant to a current chart-digging question;
- compare cold history with current notes, orders, labs, vitals, MAR, I&O, tasks, and handoff/watch items;
- flag stale, conflicting, source-needed, report-only, or unreviewed context;
- suggest where a clinician might look next;
- mark its output as background, warm support, derived, suggested, or source-needed.

The assistant may not:

- turn retrieval output into canonical chart memory;
- promote an extracted historical fact to current-care truth without human/sanctioned chart action;
- use cold history as the sole basis for immediate safety decisions;
- hide source, age, provenance, uncertainty, or review state;
- resolve conflicts between old and current sources;
- write, review, attest, complete, defer, block, or carry forward clinical work;
- use hidden simulator/oracle state;
- choose backend, storage, vector, semantic search, OpenBrain, retrieval service, runtime, access-plane, adapter, or external EHR architecture;
- expand `pi-ledger` kernel scope.

## Retrieval eligibility without architecture selection

`Retrieval-eligible` means material is allowed to be found, cited, summarized, or considered by a future source-linked chart-digging surface. It does not mean this project has selected a retrieval engine.

Eligibility criteria:

1. patient/encounter identity and authorization/scope can be respected by a future implementation;
2. source pointer or addressable artifact/note ref exists or can be marked source-needed/report-only;
3. source date/time and provenance are available enough for review;
4. lifecycle/review state can be shown or caveated;
5. summary output can keep citation and uncertainty visible;
6. retrieval output can remain derived/provisional until promoted;
7. current hot packet behavior remains deterministic without relying on semantic retrieval.

Non-selection statement: this artifact does not choose embeddings, vector databases, semantic search, lexical search, graph retrieval, OpenBrain, model memory, cache design, storage schema, service boundary, runtime, access-plane, adapter, authorization system, or external EHR integration.

## Examples

| Situation | Safe output | Unsafe output |
| --- | --- | --- |
| Nurse skims H&P during report | "Background admission story from H&P, source-linked; check current ICU note for active plan." | "Patient is currently septic because retrieved H&P says septic shock." |
| Old consult mentions EF reduction | "Warm support if current plan discusses hemodynamics/diuresis; cite old cardiology note and current note separately." | "EF is active current problem from old consult alone." |
| Prior discharge summary lists home oxygen | "Background; source date visible. Treat as current only if current chart or clinician review confirms." | "Patient is on home oxygen" without current source/caveat. |
| Report mentions family concern not in chart | "Report-only/source-needed family concern; keep visible as context until linked or charted." | "Family concern accepted as chart fact." |
| Future retrieval returns three old notes | "Candidate historical sources with dates, authors, and why surfaced; clinician reviews relevance." | "Semantic result merged into canonical summary." |

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Cold-history candidates show source type, author/provenance, encounter/date/time, and addressable source ref.
2. H&P, prior encounters, old consults, discharge summaries, baseline/social context, and external/report-only material can be represented with source state.
3. Clinician-facing summaries distinguish background, warm support, and promoted hot current-care truth.
4. Cold context can support a current question without becoming current truth by retrieval alone.
5. Extracted historical facts require explicit promotion/review before entering canonical current-care memory.
6. Assistant outputs remain derived/provisional and citation-backed.
7. Hot current-care packet examples remain deterministic and do not depend on retrieval architecture.
8. Backend/vector/OpenBrain/storage/retrieval-service/runtime/access-plane/adapter choices remain absent from the product contract.

## Boundary closeout

- [x] Cold-history categories relevant to shift-start chart digging defined.
- [x] Source-linked citation expectations defined.
- [x] Cold, warm, and hot behavior plus promotion/current-relevance boundaries defined.
- [x] Clinician-facing plain-language summaries with source links supported.
- [x] Bounded in-chart-agent reasoning over cold history allowed without making retrieval output canonical truth.
- [x] Retrieval eligibility defined without choosing retrieval architecture.
- [x] No backend/vector/OpenBrain/storage/runtime/access-plane/adapter decision.
- [x] No hidden `pi-sim` coupling or `pi-ledger` kernel expansion.
