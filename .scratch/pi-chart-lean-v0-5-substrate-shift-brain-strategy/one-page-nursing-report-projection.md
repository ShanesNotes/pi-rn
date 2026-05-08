# One-page nursing report projection

Status: ready-for-human
Parent PRD: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Source issue: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/03-one-page-nursing-report-projection.md`
Depends on: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/canonical-memory-derived-projection-contract.md`
Ralph context: `.omx/context/pi-chart-lean-v0-5-ralph-issues-03-04-06-20260504T151627Z.md`

## Purpose

Define the one-page ICU nursing report projection as a glanceable shift-start scaffold over canonical chart memory. The goal is to preserve the usefulness of the bedside report sheet without turning paper, handwriting, generated UI, or prototype visuals into chart truth.

The report projection helps the incoming nurse answer:

- Who is this patient and why are they here?
- What must I not miss before I enter the room?
- What did the offgoing nurse emphasize?
- What chart sources support or conflict with the report?
- What needs review, verification, or carry-forward?

## Authority stance

- The one-page report projection is a derived projection.
- The report sheet/image is workflow and product evidence only.
- Handwritten or verbal report content is not canonical chart truth unless captured through sanctioned chart facts/actions/notes/refs.
- Every populated projection field should link back to canonical memory when possible or be marked as source-needed/report-only.
- The bounded in-chart assistant can explain, cite, and prompt review; it cannot declare report content accepted, complete tasks, or overwrite chart truth.
- This artifact does not prescribe UI layout, component names, storage shape, public API shape, backend, vector, OpenBrain, runtime, or access-plane architecture.

## Projection category map

| Report category | What the nurse uses it for | Canonical memory source or source-needed posture | Projection behavior |
| --- | --- | --- | --- |
| Patient/encounter frame | Confirm correct patient, room, encounter, assignment, as-of frame | Identity/encounter facts; patient scope | Always visible hot scoping context |
| Code status | Prevent unsafe escalation or omission | Charted constraint/order/communication with source/time | Hot deterministic constraint; show source and review age |
| Isolation/precautions | Protect patient/staff and guide room entry | Charted precautions, isolation orders, infection-control notes | Hot safety context; mark stale/uncertain if source missing |
| Allergies | Prevent medication or exposure harm | Charted allergy/intolerance facts with verification status | Hot safety context; show verification/source when available |
| Consults/coverage | Know who is involved and who to call | Consult orders, provider/team communications, notes | Warm workflow context; show active/pending/closed where known |
| Admission date/context | Orient to illness timeline | Encounter/admission facts, H&P, admission note | Warm/cold orientation; cite source note |
| Principal problem | Understand why the patient is here now | Assessment/problem facts, H&P, ICU note | Hot when active/safety-relevant; otherwise warm orientation |
| Relevant history | Interpret current care against baseline | H&P, prior notes, history facts | Cold/background; source-linked, not current truth unless promoted |
| Neuro/pain/sedation | Understand responsiveness, safety, restraints, sedation goals | Nursing assessments, medication actions, pain/sedation observations, notes | Hot/warm depending on current safety impact |
| Pulmonary/oxygen/device | Understand respiratory status and current support | Vitals/oxygen/device observations, respiratory notes, orders | Hot if current support/instability; cite latest source/time |
| Cardiovascular/blood-pressure goals | Know hemodynamic targets and instability | Provider orders, ICU note plan, vitals, drips/MAR actions | Hot for active goals/drips; prompt review for mismatch |
| GI/GU/I&O | Understand feeding, elimination, Foley/drains, fluid balance | I&O observations, device/LDA facts, notes, orders | Warm by default; hot when current safety burden exists |
| Drips/infusions | Verify current medication support and rates | Medication orders, MAR/admin actions, infusion documentation | Hot; show latest charted rate/source/time and report mismatch prompts |
| Medication context | See important meds, holds, refusals, due meds, medication risks | Orders, MAR actions, med-rec facts, notes | Hot for critical meds; warm for rationale/history |
| Lines/tubes/drains/access | Plan care, safety, infection risk, medication access | LDA/device facts, procedures, nursing assessment | Hot when current safety burden exists; open grammar caveats preserved |
| Wounds/skin | Preserve pressure-injury/wound risk and care needs | Nursing assessments, wound notes, wound care orders | Warm/hot depending on active care needs |
| Mobility/fall risk | Plan safe patient interaction | Nursing assessments, precautions, therapy notes | Hot safety context when active risk exists |
| Abnormal/latest results | Catch labs/results that change care | Lab/diagnostic observations, review actions, evidence links | Hot for critical/unreviewed; warm for trend context |
| To-do/work items | Avoid missing pending work | Intents, actions, workflow items, task-list/open-loop projections | Derived shift-brain items; human owns completion |
| Family/social/context | Understand communication and support context | Notes, communications, social-history facts | Warm/cold context; source-linked and sensitive to privacy/policy |
| Safety checks | Avoid missed routine or high-risk safety obligations | Constraints, assessment cadence, policy/order-derived workflow items | Derived reminders; nonpunitive and source-linked |

## Field state model

Each projected field should carry one of these source states:

| State | Meaning | Display/assistant posture |
| --- | --- | --- |
| `source-linked` | Field is projected from canonical chart memory with a cited source | Safe to summarize with source/time |
| `source-needed` | Field appears important but no canonical source is linked yet | Prompt review; do not present as accepted truth |
| `report-only` | Heard or seen in report but not chart-linked | Preserve as workflow note/attention cue only |
| `conflicting` | Report/projection/chart sources disagree | Prompt clinician review with competing sources |
| `stale` | Source exists but may predate relevant changes | Show age and ask whether review is needed |
| `not-applicable` | Field has no known relevance for this patient | Quiet omission or explicit none depending on safety context |

## Bounded assistant behavior

The assistant may:

- summarize each section in plain clinical language;
- cite chart facts/actions/notes/refs behind a field;
- explain why a section matters at shift start;
- flag source-needed, stale, or conflicting fields;
- suggest which chart source to open next;
- keep language supportive and nonpunitive.

The assistant may not:

- convert report-only content into canonical truth;
- accept or write chart facts directly;
- complete tasks;
- decide that a mismatch is resolved;
- prescribe a UI layout or backend representation.

## Non-authority boundary for visuals

The Corewell-style report sheet and any future prototype/report visuals may inform:

- clinical attention categories;
- grouping pressure;
- field labels that nurses recognize;
- report-time workflow sequence;
- chart-digging prompts.

They must not define:

- canonical chart schema;
- storage layout;
- API shape;
- screen layout;
- component names;
- source-of-truth status;
- generated `_derived` truth.

## Verification prompts for later slices

A future implementation or prototype should prove:

1. Each populated report field is source-linked, source-needed, report-only, conflicting, stale, or not-applicable.
2. Source-linked fields drill back to chart facts/actions/notes/refs.
3. Report-only fields are visibly non-authoritative.
4. Conflicting fields prompt review rather than declaring truth.
5. The projection remains useful without copying the exact paper layout.
6. The assistant explains and cites, but does not write, accept, or complete.

## Boundary closeout

- [x] Report categories grounded in ICU nurse handoff story and image reference.
- [x] Canonical memory source or source-needed posture identified for each category.
- [x] Handwritten/report-sheet material treated as workflow evidence unless promoted through sanctioned chart facts/actions/notes/refs.
- [x] Bounded assistant role described.
- [x] No visual layout, component, storage, API, backend, vector, OpenBrain, runtime, or access-plane decision; no backend/vector/OpenBrain/storage/runtime/access-plane choice.
- [x] Report sheets, prototype visuals, generated UI, and disposable derived output are non-authority.
