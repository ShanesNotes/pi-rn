# A4. MAR (Medication Administration Record) — synthesis

Synthesized from Claude's A4 first pass, GPT's A4 first pass, and the A3 synthesis dependency surface. Claude's framing is the base: **the MAR is the fulfillment ledger of the medication system**, not a medication table.

## 1. Clinical purpose

The MAR is the **fulfillment ledger of the medication system**: the time-ordered evidence that medication intents either did or did not happen, who performed or accounted for them, why exceptions occurred, and what patient response followed. Its clinical purpose is dose-level auditable reconciliation between three layers that often diverge: what was **ordered**, what was **administered / held / refused / omitted**, and how the patient **responded**. Legacy MAR tabs collapse these layers into a grid of medication rows and due-time cells. The substrate question is whether that collapse is load-bearing. It is not. What must survive is the closed-loop grammar: medication `intent.order` creates expected dose or infusion obligations; `action` events fulfill or account for those obligations; response evidence from vitals, labs, exam findings, patient reports, or assessments proves whether the medication worked, harmed, or still requires follow-up. In the ICU septic-pneumonia context, this is how the chart answers: was the antibiotic order safe against active allergies, was the norepinephrine rate actually changed as ordered, was the MAP response documented inside the required window, and which medication-related loops remain open at handoff?

## 2. Agent-native transposition

The MAR is not a medication tab. In pi-chart it is a **medication intent-fulfillment ledger** that lets three primitive families speak to one another through evidence-bearing links:

1. **Medication intent** — `intent.subtype = order` with `data.order_kind = "medication"`, carrying drug, dose, route, schedule/pattern, indication, hold parameters, monitoring requirements, and stop conditions.
2. **Disposition action** — `action.subtype ∈ {administration, hold, refusal, omission, titration, verification}` or a conservative variant where `verification` remains a payload/attestation until accepted as a subtype.
3. **Response evidence** — A3 `vitals://` windows, A1 lab observations, A7/A8 nursing observations, patient-reported symptoms, or `assessment.response | adverse_effect | ineffective` citing that evidence.

The legacy MAR grid is a `timeline()` projection of these primitives filtered to medication-family orders and actions. Color-coded cells, due-time badges, late-dose flags, “green check” icons, and row grouping by drug class are rendered affordances.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Ordered medication row | `intent.order` with `data.order_kind: medication` | `currentState(axis:"intents")`, `openLoops()` |
| Scheduled-dose due cell | derived dose occurrence from order schedule; optional `meddose://` key pending §16 Q1 | `openLoops()`, rendered grid |
| Dose administered | `action.administration` fulfilling the order or dose occurrence | `timeline()`, `evidenceChain()` |
| Held dose | `action.hold` or `action.administration` with `data.disposition: held`, reason + supporting evidence required | `timeline()`, `openLoops()` |
| Patient refusal | `action.refusal`, reason/source required, optional communication/note | `timeline()`, `narrative()` |
| Omitted/missed dose | `action.omission` with reason, or derived OL-MAR-01 if no action exists | `openLoops()`, `timeline()` |
| PRN administration | `action.administration` fulfilling PRN order + indication evidence | `evidenceChain()`, `openLoops()` |
| Infusion / titration | interval-shaped `action.titration` or `action.administration` rate epoch, pending §16 Q4 | `timeline()`, `currentState(axis:"medications")` proposed |
| Five-rights / barcode verification checkbox | structured `data.verification` attestation inside the administration action, not a separate event (subtype elevation only if §16 Q5 resolves that way) | `evidenceChain()` |
| Rescue dose / emergency override | `action.administration` with `data.override_reason` + `links.supports` citing the override justification; not a separate event | `evidenceChain()`, `openLoops()` (if constraint-conflict loop was open) |
| Pharmacy verification | `action.verification` by `author.role: pharmd`; `links.resolves` the verification-requirement loop on the medication order, **NOT** `links.fulfills` on the order (verification satisfies a prerequisite, not the dose obligation) — see §10 lifecycle and §16 Q5 | `openLoops()` (closes OL-MAR-04) |
| Post-dose reassessment | `assessment.response`, `assessment.adverse_effect`, or observation/event cited from A1/A3/A7/A8 | `evidenceChain()`, `trend()`, `openLoops()` |
| Allergy / contraindication alert banner | write-time validation against `readActiveConstraints()`; the alert itself is never stored — if the write proceeds anyway, the justification lives in `data.override_reason` on the action, and the open loop lives in `openLoops(kind: mar_constraint_violation)` | validator / openLoop |

> The medication order says what should happen; the MAR action says what actually happened; response evidence says whether it worked or harmed the patient.

Load-bearing claims:

**(a) MAR is fulfillment first, documentation second.** A documentation view says “record what you did.” A fulfillment ledger says “every medication obligation must resolve.” This makes the order or dose occurrence the conceptual primary key, not the nurse’s row in a legacy grid.

**(b) Non-given states are actions, not absence.** Held, refused, omitted, deferred, and failed doses are not blank cells. They are clinical actions or accounting actions with reasons, evidence, and different downstream implications. The substrate must distinguish “no one accounted for this dose” from “the dose was intentionally held for SBP 86 with provider notified.”

**(c) Response evidence is not MAR free text.** “Pain improved 8→3,” “MAP still <65,” “oversedated after opioid,” and “rash after antibiotic” belong to observations/assessments that cite the administration and supporting evidence. The administration action can declare or inherit a response obligation, but the effect is proven elsewhere.

**(d) Infusions are interval-shaped actions.** A norepinephrine drip at 0.08 mcg/kg/min from 09:15–09:45 is not a point event. It is a medication exposure interval. A rate change closes/supersedes the prior interval and begins the next. This is A4’s strongest pressure on ADR 005: interval semantics must extend to at least some action subtypes.

**(e) MAR writes are constraint-gated.** Before writing a medication action, the agent/human workflow must read active constraints, relevant problems/indications, prior administrations, and required labs/vitals. The action should not duplicate all context, but safety-critical exceptions must cite the evidence they relied on.

**(f) Verification and administration close different loops.** Pharmacy verification satisfies a *prerequisite* on the order — it does not satisfy the dose obligation itself. An `action.verification` therefore closes OL-MAR-04 (missing verification) via `links.resolves` pointing at the order, NOT via `links.fulfills`. Only dispositions (`administration`, `hold`, `refusal`, `omission`) may carry `links.fulfills` to an order or dose occurrence. Conflating these would tell the fulfillment engine "this order is fulfilled" the moment pharmacy signs off, before the drug reaches the patient — a correctness failure that masks OL-MAR-01 (missing disposition) loops.

## 3. Regulatory / professional floor

1. **[regulatory] CMS 42 CFR 482.23(c)(6)** — drugs and biologicals must be prepared/administered according to law, orders, accepted standards, and hospital policy; administration errors/adverse reactions require reporting procedures. Anchors the non-optional medication action ledger.
2. **[regulatory] CMS 42 CFR 482.24(c)(1), 482.24(c)(4)(vi)** — medical-record entries must be complete, dated, timed, authenticated; the record includes medication records and information needed to monitor condition and response. Anchors `effective_at` / `recorded_at`, author, and response evidence.
3. **[regulatory] CMS 42 CFR 482.25(a)–(b)** — pharmaceutical services must meet patient needs, minimize medication errors, and control/distribute medications safely. Anchors pharmacy verification/review and high-risk medication audit.
4. **[regulatory/professional] The Joint Commission MM.04, MM.05, MM.06 and NPSG.03.06.01** — clear medication orders, safe preparation/administration, and accurate medication reconciliation. A4 handles administration; A4b handles reconciliation.
5. **[professional/interoperability] HL7 FHIR R5 MedicationRequest / MedicationAdministration + ISMP hospital medication-safety guidance** — separates order/request from actual administration and highlights barcode verification, high-alert meds, independent checks, IV infusion risks, and override/wrong-route hazards.

`[phase-b-regulatory]` — state scope-of-practice boundaries, controlled-substance waste/witness law, chemotherapy/biologic double-check policy, blood-product administration, hospital “late med” windows, formulary/P&T restrictions, and class-specific response windows belong to policy/profile work rather than Phase A primitive design.

## 4. Clinical function

MAR is consumed at four moments.

- **Pre-administration.** The bedside clinician asks: is there an active order, is this the right patient/drug/dose/route/time, are allergies or constraints blocking the action, are hold parameters met, are labs/vitals current enough, is pharmacy verification required/complete, and is this dose due or clinically indicated now?
- **At administration.** The performer verifies identity and medication, performs/scans/administers, writes the disposition action, and documents any override, witness, partial dose, refusal, or failure.
- **During titration / infusion.** The clinician asks: what rate is actually running, when did it change, under what protocol/target, and what physiologic response followed?
- **Post-administration / handoff.** The team asks: what was given, what was not given and why, what response evidence is pending, what adverse effects occurred, and what next-dose/titration decisions remain open?

Per-consumer specifics:

- **Bedside RN** — densest author and reader; writes administrations, holds, refusals, omissions, many titrations, verification, and response checks.
- **RT** — may administer inhaled/nebulized therapies and protocol-driven respiratory medications.
- **Provider / APP / intensivist / anesthesia** — authors orders, emergency/procedural boluses, discontinuations, dose changes, and response interpretation.
- **Pharmacist** — verifies orders, reviews high-risk therapy, renal/weight-based dose adjustment, interaction/contraindication risks, and missed/held patterns.
- **Patient / surrogate** — may be the source of a refusal or self-administration context but does not author MAR actions directly.
- **pi-agent** — should not invent administration actions; it can surface loops, propose actions where authorized, and author response assessments when its evidence chain is explicit.

Handoff trigger: *“Since last handoff, which medications materially changed therapy, which due doses were not performed, which infusions are running now, and which administrations still require response assessment?”* This is answered by medication-family `timeline()`, `currentState(axis:"medications")` if adopted, and `openLoops(kind:"mar_*")`.

## 5. Who documents

Primary: **bedside RN** for most medication dispositions: administration, hold, refusal, omission, bedside verification, and many titrations.

Secondary:

- **Provider / APP / intensivist / anesthesia** — originating or modifying `intent.order`; emergency/procedural medication actions.
- **Pharmacist** — verification/review events or attestations; renal/weight-based review; high-risk medication checks.
- **RT** — respiratory medication administrations.
- **Smart pump / BCMA / automated dispensing systems** — device data may support or, if §16 Q2 resolves that way, author canonical intervals/disposition events. Until resolved, keep device facts as `source.ref`, artifact refs, or supporting evidence rather than new `source.kind` values.
- **Importer** — historical MAR data through `synthea_import` / `mimic_iv_import` / `manual_scenario` with original timestamps preserved per provenance rules.
- **pi-agent** — may author response assessments or administrative workflow actions only when explicitly delegated in the sandbox; not drug administration.

Owner of record: **ordering provider** for the medication intent, **bedside clinician** for the disposition action, **pharmacist** for medication verification/review, and **attending/team** for the overall medication plan. Split ownership is load-bearing: an order, pharmacy verification, administration, and response assessment are separate claims with separate authors.

Source-kind discipline: use the existing closed taxonomy where possible (`clinician_chart_action`, `nurse_charted`, `protocol_standing_order`, `manual_scenario`, `synthea_import`, `mimic_iv_import`). New device-specific `source.kind` values such as `smart_pump` or `automated_dispensing_system` should remain open until §16 Q2 / ADR 006 amendment resolves them.

## 6. When / how often

Frequency class: **event-driven** for dispositions and rate changes; **periodic** for scheduled doses; **continuous / interval-shaped** for infusions; **per-encounter** for medication reconciliation, owned by A4b.

- **Regulatory floor:** every medication administration or exception must be documented/accountable according to orders, law, standards, and policy. The floor is “every medication obligation resolves,” not “every N hours.”
- **Practice norm:** scheduled doses resolve by the ordered frequency/window; PRNs resolve only when indication exists; titratable infusions change per target/protocol; high-risk meds require verification/attestation; response monitoring windows are drug/class/order-specific.
- **Event-driven triggers:** new order, dose due, PRN indication present, hold parameter met, patient refusal, failed access/scan/supply, rate change, response window expiry, adverse effect, medication error, override.
- **Interval-shaped triggers:** start/stop of infusion, stable-rate epoch, titration epoch, continuous exposure while stop condition remains unmet.

A re-read of unchanged medication state produces no event. A rendered due cell is derived from order schedule until a disposition action, omission, or open loop accounts for it.

## 7. Candidate data elements

Aim: included fields are limited to what supports safety checks, fulfillment, response evidence, audit, or agent reasoning. Rows tagged `[open-schema]` are retained as candidate payload fields but final schema depends on §16.

### Medication intent (`intent.subtype = order`, `data.order_kind = "medication"`)

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| 1 | `data.medication` | [regulatory][clinical] | ✓ | `{name, rxnorm_code?, formulary_id?, display?}` | Five-rights check, allergy matching, reconciliation, and interop fail | provider order, Synthea, MIMIC, manual-scenario | high |
| 2 | `data.dose` | [regulatory][clinical] | ✓ | `{amount, unit, concentration?, weight_based?}` | Cannot audit under/overdose, high-alert dosing, total dose | provider order | high |
| 3 | `data.route` | [regulatory][clinical] | ✓ | enum/UCUM-compatible text | Wrong-route prevention and route-specific monitoring fail | provider order | high |
| 4 | `data.order_pattern` | [clinical][agent] | ✓ | `scheduled | prn | one_time | titration | continuous_infusion | sliding_scale | taper` | OpenLoops cannot distinguish missed dose vs non-indicated PRN vs titration protocol | provider order | high |
| 5 | `data.schedule` (pattern-specific) | [clinical] | ✓ | pattern-specific object: `{frequency, start, stop?}` for scheduled; `{indication, min_interval, max_per_day, max_per_episode?}` for PRN; `{target_metric, titration_rule, min_rate, max_rate, start_rate?}` for titration; `{rate?, stop_condition}` for continuous_infusion; `{bg_ranges: {...}}` for sliding_scale; `{taper_steps}` for taper; `{effective_at}` for one_time | Due windows and OL-MAR-01 cannot be computed; OL-MAR-05 (infusion inconsistency) cannot detect stop-condition mismatch; PRN over-use audit impossible; titration protocol reconstruction fails | provider order | high |
| 6 | `data.indication` + `links.addresses` | [clinical][agent] | ✓ | text + problem refs | Cannot evaluate appropriateness or response against the target problem | provider order, manual-scenario | med |
| 7 | `data.hold_parameters` | [clinical] | ✓ | threshold rules | Cannot distinguish valid hold from missed/unsafe non-administration | provider/pharmacy/default profile | med |
| 8 | `data.monitoring_requirements` | [clinical][agent] | ✓ | `{metric, target?, window_after_dose, evidence_kind}[]` | OL-MAR-02 cannot fire; response expectations hidden in policy magic | order/protocol/default profile | high |
| 9 | `data.stop_condition` / `duration` | [clinical] | ✓ where applicable | datetime/duration/condition | Continuous therapy may run beyond intended endpoint or stop too early | provider order | med |

### Disposition action (`action.subtype ∈ {administration, hold, refusal, omission, titration}`)

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| 10 | `links.fulfills` | [regulatory][clinical] | ✓ | event id(s) or occurrence key pending §16 Q1 | No order-action audit chain; fulfillment engine fails | substrate | high |
| 11 | `data.dose_given` | [regulatory][clinical] | ✓ for admin/titration | `{amount, unit, route, rate?}` | Cannot audit actual exposure or partial dose | nurse, provider, pump | high |
| 12 | `effective_at` / `effective_period` | [regulatory][clinical] | ✓ | ISO time or interval | Right-time audit and response-window start fail; infusion exposure unreconstructable | envelope/device | high |
| 13 | `data.scheduled_due_at` / `data.dose_occurrence_key` | [clinical][open-schema] | ✓ pending §16 Q1 | ISO or `meddose://...` | Cannot know which q6h occurrence was fulfilled/late/missed | derived schedule + action | high |
| 14 | `data.disposition_reason` | [regulatory][clinical] | ✓ for hold/refusal/omission/failure | structured reason + detail | Holds/refusals/omissions indistinguishable; safety audit fails | nurse/provider/patient statement | high |
| 15 | `data.verification` | [regulatory][clinical] | ✓ | five-rights attestation object | Identity/drug/dose/route/time safety cannot be audited | bedside scan/human | high |
| 16 | `data.attestations[]` | [regulatory][open-schema] | ✓ where material | witness/cosign/double-check | High-alert/controlled-substance audit weak or impossible | nurse/pharmacist/provider | med |
| 17 | `data.override_reason` | [clinical][regulatory] | ✓ when override | structured override + evidence refs | Contraindication/emergency exceptions lack accountability | clinician | high |
| 18 | `data.administration_episode_id` | [agent][open-schema] | optional pending §16 Q4 | string | Hard to group many titration epochs for one drip/order/protocol | derived/manual | med |

### Response assessment / adverse effect

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| 19 | `assessment.subtype ∈ {response, adverse_effect, ineffective}` | [clinical][agent] | ✓ | event subtype | Medication effect becomes MAR comment instead of evidence-backed claim | nurse, provider, agent | high |
| 20 | `links.supports` evidence refs | [clinical][agent] | ✓ | vitals window/lab/exam/patient report | Response loop cannot be verified; evidenceChain breaks | A1/A3/A7/A8 | high |
| 21 | closure link to administration | [open-schema] | ✓ pending §16 Q3 | `links.resolves` or widened `links.fulfills` | OL-MAR-02 closure ambiguous | substrate | med |
| 22 | `data.response_category` + `severity` | [clinical][regulatory] | ✓ for adverse effect | enum + severity | ADE surveillance and escalation weak | nurse/provider/pharmacy | med |

**Considered and excluded as separate fields:** per-action medication identity restated from order; per-action indication restated from order; per-dose UI color/late flag; per-dose cost/billing codes; NDC as a clinical field (dispensing/barcode artifact, not administration claim unless material); generic free-text comment; per-row patient banner.

## 8. Excluded cruft — with rationale

| Field | Why it exists in current EHRs | Why pi-chart excludes |
|---|---|---|
| “Given” checkbox alone | Paper-MAR row header carried context | An `action.administration` with dose/time/link is the claim; boolean adds nothing |
| Color-coded cell state | Fast visual triage | Rendered from disposition/openLoop state |
| Per-dose duplicated drug name | Paper safety habit | Inherits from order via link; duplication risks contradiction |
| “Late” flag as stored field | Workflow convenience | Derived from due window and `effective_at`; OL-MAR-01 handles missed/late |
| Per-row patient banner | Paper/export defensive matching | Patient scope is envelope/directory invariant |
| Generic per-dose comments | Form catch-all | Meaningful content becomes reason, evidence, communication, or assessment; chatter excluded |
| “Patient tolerated med” default phrase | Defensive documentation | Only store actual response evidence/adverse effect |
| Billing/admin charge fields | Revenue cycle | Out of substrate scope |
| Drawer/bin/location details | Inventory workflow | External operational artifact unless clinically material |
| Read/unread/acknowledged UI badge | Inbox/grid workflow | Derived/rendered from verification/review/action state |

## 9. Canonical / derived / rendered

- **Canonical**
  - Medication `intent.order` events and supersession/discontinuation lifecycle.
  - `action.administration`, `action.hold`, `action.refusal`, `action.omission`, `action.titration` disposition claims.
  - `action.verification` if accepted, otherwise verification/attestation payloads on actions.
  - Response observations/assessments, including `assessment.response`, `assessment.adverse_effect`, and `assessment.ineffective`.
  - Communications/notes for refusals, notifications, adverse events, or medication errors when clinically material.
  - Artifact refs for barcode scan logs, pump records, waste logs, or external controlled-substance records when material.

- **Derived**
  - Due-dose skeleton / schedule grid from active medication orders.
  - Current running medication/infusion state from latest open interval actions.
  - Late/missed/overdue dose state from schedule + action ledger.
  - Missing response evidence loops from order monitoring requirements + action time + A1/A3/A7/A8 evidence.
  - Medication exposure summaries, total dose, titration history, “currently running pressors.”
  - Contraindication warnings from active constraints and attempted medication order/action.

- **Rendered**
  - MAR grid, checkmarks, red/yellow/green cells, overdue badges, row grouping by drug class, barcode-scan icons, pharmacy-verified stamps, high-alert banners, collapsible PRN rows.

## 10. Provenance and lifecycle

### Provenance

- **Sources of truth:** clinician-authored orders; nurse/RT/provider-authored medication disposition actions; pharmacy verification/review; device support from BCMA/ADS/pump; imported historical med administrations; patient statements for refusals.
- **`source.kind` discipline:** prefer existing taxonomy values. Use `author.role` for RN/pharmacist/provider distinction. Device-specific origins should use `source.ref` or artifact refs unless §16 Q2 resolves with new source kinds.

### Lifecycle

- **Created by:** medication order event; disposition action; response evidence/assessment.
- **Updated by:** never in place. Corrections/supersessions create new events.
- **Fulfilled by:** disposition action fulfilling medication order or dose occurrence; response assessment/evidence closing monitoring obligation depending on §16 Q3.
- **Cancelled/discontinued by:** new order/intention superseding or discontinuing prior order; existing actions remain.
- **Superseded/corrected by:** `links.supersedes` / `links.corrects` for erroneous action, wrong timestamp/dose, order change, or rate epoch closure.
- **Stale when:** order-specific. Scheduled dose window passes without disposition; response window passes without evidence; infusion rate/stop condition is inconsistent with current state; pharmacy verification remains absent outside emergency exception.
- **Closes the loop when:** each loop closes independently — OL-MAR-01 (missing disposition) closes when an `action.administration | hold | refusal | omission` carries `links.fulfills` to the order or dose occurrence; OL-MAR-02 (missing response evidence) closes via `links.resolves` from an `assessment.response`/`adverse_effect`/`ineffective` or via evidence-window overlap (pending §16 Q3); OL-MAR-03 (unsafe override review) closes when the override is reviewed; OL-MAR-04 (missing verification) closes when an `action.verification` `resolves` the order; OL-MAR-05 (infusion inconsistency) closes when the open interval and the stop condition reconcile (new interval supersession, order discontinuation, or pump state alignment).

### Contradictions and reconciliation

- **Admin documented without active order:** preserve, error/warn depending emergency override; require review.
- **Order active but dose missing:** derived OL-MAR-01 until disposition written.
- **Hold reason not supported by evidence:** preserve hold; V-MAR rule warns/errors; require review.
- **Medication given against active allergy/constraint:** preserve if override documented; otherwise block/write-error; produce OL-MAR-03 for review.
- **Pump telemetry conflicts with nurse-charted rate:** preserve both; source-specific evidenceChain; require reconciliation if dosing decisions depend on it.
- **Pharmacy verification absent but emergency dose given:** preserve with override; OL-MAR-04 for post-event review.
- **Home medication not continued:** A4b owns discrepancy; A4 only reflects inpatient order/action state.

## 11. Missingness / staleness

- **What missing data matters clinically?**
  - Scheduled dose window elapsed without disposition → OL-MAR-01.
  - Administration lacks verification/identity/five-rights evidence → V-MAR-01.
  - High-alert medication lacks required witness/double-check → V-MAR-02.
  - Active allergy/contraindication without override → V-MAR-03.
  - Hold/refusal/omission lacks reason → V-MAR-05.
  - Monitoring requirement lacks response evidence → OL-MAR-02.
  - Non-emergency scheduled order lacks pharmacy verification → OL-MAR-04.
  - Infusion stop condition met but interval remains open → OL-MAR-05 proposed.

- **What missing data is merely unknown?**
  - Next PRN dose window when no indication exists.
  - Historical imported indication if order/action otherwise safe to represent.
  - Witness on non-high-alert med where no policy requires it.
  - External drawer/bin metadata when administration itself is clear.

- **When does MAR become stale?**
  - Each medication order has its own fulfillment clock. Scheduled doses stale by due window; PRNs by indication; titration by protocol target and current rate; response windows by medication/class/order requirements.

- **Should staleness create an `openLoop`?** Yes, when staleness is an unmet declared obligation, not merely old data.
  - **OL-MAR-01 — missing disposition:** due dose lacks admin/hold/refusal/omission.
  - **OL-MAR-02 — missing response evidence:** administration with monitoring requirement lacks evidence by due time.
  - **OL-MAR-03 — unsafe override review:** administered despite active constraint; needs review.
  - **OL-MAR-04 — missing verification:** pharmacy/high-risk verification absent outside emergency.
  - **OL-MAR-05 — infusion inconsistency:** open infusion interval conflicts with stop condition, discontinued order, or pump/nurse state.

## 12. Agent read-before-write context

Before an agent authors a medication-related response assessment, loop closure, recommendation, or permitted action, it reads:

- `currentState({ scope, axis: "constraints", asOf })` / `readActiveConstraints()` — allergies, code status, contraindications, patient-specific limits.
- `currentState({ scope, axis: "problems", asOf })` — indication/target problem context.
- `currentState({ scope, axis: "intents", asOf })` filtered to medication orders — active orders, schedule, hold parameters, monitoring requirements, stop conditions.
- Medication-family `timeline({ types:["action","intent","assessment","communication"], from, to })` — prior doses, holds, refusals, titrations, notifications, response assessments.
- `evidenceChain({ eventId: <order_or_admin_id> })` before modifying, superseding, or closing loops.
- A3 `trend()` for vitals metrics required by monitoring requirements, e.g. MAP after vasopressor, RR/SpO₂/sedation after opioid.
- A1 lab observations/trends for drug-specific labs, e.g. glucose after insulin, creatinine before nephrotoxic dosing, potassium after replacement.
- `openLoops({ kind: "mar_*", asOf })` — ensure the write closes or addresses the correct loop.
- A4b med-rec state at care transitions — avoid treating inpatient MAR as the home medication truth.

Agent write rules:

- Do not author `action.administration` unless explicitly delegated a sandbox workflow step.
- Prefer `assessment.response` / `adverse_effect` / `ineffective` for reasoning over post-dose evidence.
- Every agent-authored response assessment must use structured evidence refs and cite the administration/order it is responding to.

## 13. Related artifacts

- **A0a — patient/encounter/baseline:** weight, renal baseline, identity verification, encounter context.
- **A0b — constraints:** allergies, code status, advance directives, patient preferences; medication writes must read constraints.
- **A0c — active problems:** medication indication and `links.addresses` target.
- **A1 — labs:** glucose, electrolytes, renal/hepatic function, drug levels, lactate, cultures; supports dosing and response.
- **A2 — results review:** critical lab review may trigger medication order/action; med actions may require result review before dose.
- **A3 — vitals:** response windows and titration targets; A3-Q1 is decisive for response-window evidence addressability.
- **A4b — medication reconciliation:** home/current/discharge medication state and unresolved discrepancies; downstream of A4 semantics.
- **A5 — I&O + LDAs:** line access, infusion routes, urine output response to diuretics/pressors/fluids.
- **A6/A7 — provider/nursing notes:** narrative explanation of med decisions, refusals, adverse events, handoff.
- **A8 — ICU nursing assessment:** sedation, pain, neuro/respiratory/perfusion findings after meds.
- **A9a — individual order primitive:** will finalize order subtype/discriminator shape; A4 uses a working `data.order_kind` discriminator.
- **A9b — orderset invocation:** sepsis/pressor/insulin protocols create linked medication and monitoring child intents.

## 14. Proposed pi-chart slot shape

### Event type + subtype

Preferred path: existing event types, new or sharpened subtypes only where they earn their cost.

- `intent.subtype = order`, `data.order_kind = "medication"` — medication order/intention. **Schema impact:** new payload shape; discriminator finalization deferred to A9a.
- `action.subtype = administration` — given medication dose/bolus/infusion exposure. **Schema impact:** existing action subtype with richer payload.
- `action.subtype = hold | refusal | omission` — explicit non-given dispositions. **Schema impact:** new action subtypes, or payload-level `data.disposition` if owner prefers fewer subtypes. Synthesis lean: separate subtypes for validator clarity.
- `action.subtype = titration` — interval or rate-change medication action. **Schema impact:** new subtype + ADR 005 action-interval amendment; open §16 Q4.
- `action.subtype = verification` — pharmacy/high-alert/independent-check action. **Schema impact:** provisional new subtype; may collapse into `data.attestations[]` pending §16 Q5.
- `assessment.subtype = response | adverse_effect | ineffective` — medication response claims. **Schema impact:** new/conventional assessment subtypes; closure link open §16 Q3.

### Payload shapes

Medication order:

```jsonc
{
  "id": "evt_20260418T0700_order_norepi",
  "type": "intent",
  "subtype": "order",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T07:00:00-05:00",
  "recorded_at": "2026-04-18T07:00:10-05:00",
  "author": { "id": "md_icu_01", "role": "provider" },
  "source": { "kind": "clinician_chart_action", "ref": "order_entry" },
  "certainty": "planned",
  "status": "active",
  "data": {
    "order_kind": "medication",
    "medication": { "name": "norepinephrine", "rxnorm_code": "" },
    "dose": { "amount": null, "unit": "mcg/kg/min" },
    "route": "IV",
    "order_pattern": "titration",
    "schedule": {
      "target_metric": "map",
      "target": ">=65 mmHg",
      "min_rate": { "amount": 0.01, "unit": "mcg/kg/min" },
      "max_rate": { "amount": 0.30, "unit": "mcg/kg/min" },
      "titration_rule": "increase per protocol to maintain MAP >= 65"
    },
    "monitoring_requirements": [
      { "metric": "map", "target": ">=65", "window_after_dose": "PT10M", "evidence_kind": "vitals_window" }
    ],
    "indication": { "text": "shock with MAP below target", "addresses": ["evt_problem_shock"] }
  },
  "links": { "addresses": ["evt_problem_shock"], "supports": [] }
}
```

Administration (single `links.fulfills`, with `data.dose_occurrence` carrying the specific due-dose addressability per §16 Q1):

```jsonc
{
  "id": "evt_20260418T0810_admin_01",
  "type": "action",
  "subtype": "administration",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T08:10:00-05:00",
  "recorded_at": "2026-04-18T08:10:25-05:00",
  "author": { "id": "rn_shane", "role": "rn" },
  "source": { "kind": "nurse_charted", "ref": "bcma_scan_bedside" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "dose_given": { "amount": 2, "unit": "g", "route": "IV" },
    "scheduled_due_at": "2026-04-18T08:00:00-05:00",
    "dose_occurrence": "meddose://enc_001/evt_order_antibiotic/2026-04-18T08:00:00-05:00",
    "verification": {
      "patient_id_confirmed": true,
      "drug_confirmed": true,
      "dose_confirmed": true,
      "route_confirmed": true,
      "time_confirmed": true
    }
  },
  "links": {
    "fulfills": ["evt_order_antibiotic"],
    "addresses": ["evt_sepsis_orderset_child"],
    "supports": []
  }
}
```

Hold:

```jsonc
{
  "id": "evt_20260418T0900_hold_01",
  "type": "action",
  "subtype": "hold",
  "effective_at": "2026-04-18T09:00:00-05:00",
  "recorded_at": "2026-04-18T09:00:30-05:00",
  "author": { "id": "rn_shane", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "scheduled_due_at": "2026-04-18T09:00:00-05:00",
    "disposition_reason": {
      "reason_code": "parameter_not_met",
      "reason_detail": "Held metoprolol per order hold parameter: SBP < 100"
    }
  },
  "links": {
    "fulfills": ["evt_order_metoprolol"],
    "supports": [
      { "kind": "vitals_window", "ref": "vitals://enc_001?name=bp_systolic&from=2026-04-18T08:50:00-05:00&to=2026-04-18T09:00:00-05:00", "role": "primary" }
    ]
  }
}
```

Titration interval (ADR 005 — open interval, closed via supersession by the next rate change):

```jsonc
{
  "id": "evt_20260418T0915_norepi_rate_01",
  "type": "action",
  "subtype": "titration",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_period": {
    "start": "2026-04-18T09:15:00-05:00"
  },
  "recorded_at": "2026-04-18T09:15:20-05:00",
  "author": { "id": "rn_shane", "role": "rn" },
  "source": { "kind": "nurse_charted", "ref": "smart_pump_channel_A" },
  "certainty": "performed",
  "status": "active",
  "data": {
    "medication": { "name": "norepinephrine" },
    "rate": { "amount": 0.08, "unit": "mcg/kg/min" },
    "administration_episode_id": "norepi_enc001_001"
  },
  "links": { "fulfills": ["evt_20260418T0700_order_norepi"] }
}
```

*Note: the interval closes when the next rate-change event writes `links.supersedes: ["evt_20260418T0915_norepi_rate_01"]` per ADR 005's interval-closure-via-supersession discipline. An explicit `effective_period.end` is only written if the drip stops without a successor interval (e.g., infusion complete; patient weaned off; order discontinued). V-MAR-08 enforces that intervals for the same order form a non-overlapping supersession chain.*

Response assessment:

```jsonc
{
  "id": "evt_20260418T0955_resp_01",
  "type": "assessment",
  "subtype": "response",
  "effective_at": "2026-04-18T09:55:00-05:00",
  "recorded_at": "2026-04-18T09:55:10-05:00",
  "author": { "id": "pi-agent", "role": "rn_agent", "run_id": "run_..." },
  "source": { "kind": "agent_inference", "ref": "mar_response_loop" },
  "certainty": "inferred",
  "status": "final",
  "data": {
    "summary": "MAP improved to target range after norepinephrine titration.",
    "response_category": "therapeutic_response",
    "severity": "n/a"
  },
  "links": {
    "supports": [
      { "kind": "vitals_window", "ref": "vitals://enc_001?name=map&from=2026-04-18T09:15:00-05:00&to=2026-04-18T09:55:00-05:00", "role": "primary" }
    ],
    "resolves": ["evt_20260418T0915_norepi_rate_01"]
  }
}
```

### Link conventions

- `fulfills` — disposition actions fulfill medication order(s) or dose occurrence(s). Multi-target cardinality is §16 Q1.
- `supports` — actions cite safety/hold/override evidence; assessments cite response evidence.
- `addresses` — medication orders address active problems or care-plan intents.
- `supersedes` / `corrects` — order revisions, erroneous actions, rate interval closure/correction.
- `contradicts` — pump telemetry vs nurse-charted rate, allergy override vs active constraint, or conflicting disposition records.
- `resolves` — preferred synthesis path for response assessment closing medication-response loop unless owner amends `fulfills` to allow assessment→action (§16 Q3).

### Storage placement

- `events.ndjson` — orders, actions, assessments, communications.
- `notes/*.md` — narrative refusal/adverse-event/notification context when needed.
- `artifacts/` — barcode logs, pump extracts, external waste/controlled-substance records when material.
- No separate MAR file; the MAR grid is a derived view.

### Frequency class

Event-driven + periodic + interval-shaped.

### View consumers

`timeline`, `currentState(axis:"intents")`, proposed `currentState(axis:"medications")` (**flagged — cross-artifact pattern with A3-Q3's proposed `axis:"context"`**; if adopted, both share the discipline of axis-level dispatch for a derivable-from-existing-events state-set; a single ADR should resolve the pattern for both rather than deciding A3 and A4 independently), `trend`, `evidenceChain`, `openLoops`, `narrative`.

### Schema confidence

- **High:** medication order payload, action administration payload, hold/refusal/omission as explicit dispositions, response assessments using existing evidence refs.
- **Medium:** separate `action.hold/refusal/omission` subtypes vs one `action.administration.data.disposition` field; `currentState(axis:"medications")`.
- **Low/Open:** dose occurrence URI/key, action interval allow-list for titration, device-authored canonical medication actions, `assessment.response` closure link semantics, verification subtype vs payload.

### Schema impact

- `new payload shape` — medication order, administration, verification/attestation, response assessment.
- `new subtype` — hold/refusal/omission/titration/verification if owner accepts subtype split.
- `new view axis` — `currentState(axis:"medications")` proposed but not required for A4 acceptance.
- `ADR amendment` — action intervals and/or response closure semantics.

## 15. Validator and fixture implications

### Validator rules

- **V-MAR-01 — Administration completeness.** `action.administration` must have `links.fulfills`, `data.dose_given`, route, effective time/period, source, author, and verification fields. Severity: error.
- **V-MAR-02 — High-alert attestation.** High-alert medications require `data.attestations[]` or `data.verification.witness` per policy profile. Severity: error when profile declares requirement; warn otherwise.
- **V-MAR-03 — Active constraint gate.** Medication order/action conflicting with active allergy/contraindication must carry structured override and supporting evidence, or write should fail. Severity: error.
- **V-MAR-04 — Hold evidence consistency.** Hold with `reason_code: parameter_not_met` must cite evidence satisfying the order hold parameter. Severity: error/warn depending evidence availability.
- **V-MAR-05 — Non-given reason required.** Hold/refusal/omission/failure must carry structured reason. Severity: error.
- **V-MAR-06 — Response obligation.** Administration with monitoring requirements must have response evidence or produce OL-MAR-02 after due window. Validator error only in replay/finalization mode; live chart surfaces openLoop.
- **V-MAR-07 — Fulfillment cardinality.** Per §16 Q1 synthesis lean, `links.fulfills` on a disposition action (`administration | hold | refusal | omission | titration`) must have cardinality exactly 1 and must resolve to a medication `intent.order` event. Sibling orders, orderset children, care-plan parents, and protocol contexts are cited via `links.addresses` (intent-family) or `links.supports` (evidence-family), not via `links.fulfills`. Severity: error. *Rationale: prevents duplicate-order masking where two sibling medication orders silently both appear fulfilled by a single nurse administration.*
- **V-MAR-08 — Titration interval integrity.** Open intervals must not overlap for same medication/order/channel unless explicitly allowed; rate changes close/supersede prior interval. Severity: error.
- **V-MAR-09 — Verification-before-nonemergency-dose and verification-loop isolation.** (a) Non-emergency scheduled med requiring pharmacy verification cannot be administered without a resolving `action.verification` or documented `data.override_reason` on the administration. (b) `action.verification` must NOT carry `links.fulfills` pointing at a medication `intent.order` — verification closes OL-MAR-04 via `links.resolves`, not OL-MAR-01 via `links.fulfills`. Only dispositions (`administration | hold | refusal | omission`) may fulfill an order or dose occurrence. Severity: warning/error by profile for (a); error for (b).
- **V-MAR-10 — Agent authoring restriction.** Agent-authored `action.administration` is invalid unless sandbox delegation metadata is present. Severity: error.

### Minimal fixture

1. **Routine scheduled antibiotic** — order + administration + due occurrence; validates basic fulfillment.
2. **Constraint-gated antibiotic** — cephalosporin in patient with penicillin anaphylaxis; validates V-MAR-03 override/readActiveConstraints gate.
3. **Held beta-blocker** — hold reason supported by low SBP vitals window; validates V-MAR-04.
4. **Patient refusal** — refusal reason citing patient statement and optional communication note; validates non-given action semantics.
5. **PRN opioid** — administration supported by pain observation; response assessment citing pain/RR/SpO₂ window; validates OL-MAR-02 closure.
6. **Norepinephrine titration** — three interval rate epochs with MAP response windows; decisive A3-Q1/A4-Q4 cross-artifact test.
7. **Smart-pump discrepancy** — pump telemetry conflicts with nurse-charted rate; validates Q2 unresolved behavior.
8. **Controlled-substance partial dose/waste** — administered dose + waste + witness; validates attestation payload.

## 16. Open schema questions

1. **Q1 — Dose occurrence identity and fulfillment cardinality.** A scheduled q6h order is one intent but creates many due obligations. Does `action.administration.links.fulfills` point only to the parent order, to a virtual `meddose://` occurrence key, to materialized child intents, or to multiple related intents? Leading synthesis: deterministic virtual occurrence key + permissive but constrained multi-target fulfillment for same medication-intent lineage. → `OPEN-SCHEMA-QUESTIONS.md#a4-dose-occurrence-and-cardinality`

2. **Q2 — Device-authored dispositions and pump telemetry.** Are Pyxis/Omnicell/BCMA/smart-pump data canonical actions, supporting evidence, or separate device artifacts? Leading synthesis: ADS/BCMA are supporting evidence or `source.ref`; smart pump may author canonical titration intervals if owner adds device source-kind discipline. → `OPEN-SCHEMA-QUESTIONS.md#a4-device-authored-dispositions`

3. **Q3 — Medication response obligation and closure link.** Does response monitoring live on orders, actions, generated monitoring intents, or policy logic; and does `assessment.response` close the loop through `links.resolves`, widened `links.fulfills`, or evidence overlap? Leading synthesis: order-level defaults + generated concrete monitoring intent for high-risk administrations; use `resolves` unless owner intentionally amends ADR 003. → `OPEN-SCHEMA-QUESTIONS.md#a4-response-obligation-closure`

4. **Q4 — Titration / infusion interval and episode model.** Does ADR 005 extend to action intervals (`action.titration`, possibly `action.continuous_infusion`), and is an optional `administration_episode_id` enough for grouping? Leading synthesis: extend ADR 005 allow-list to action intervals; optional episode id; no new event type. → `OPEN-SCHEMA-QUESTIONS.md#a4-titration-interval-episode`

5. **Q5 — Partial dose, waste, verification, and attestation boundary.** Does controlled-substance waste / independent double-check / pharmacy verification live as payload fields, separate action subtypes, or external artifacts? Leading synthesis: administered dose is canonical; compact `waste` + `attestations[]` payload in Phase A; promote to separate action subtype only if fixtures prove independent claim identity is necessary. → `OPEN-SCHEMA-QUESTIONS.md#a4-attestation-waste-boundary`

**Inline A9a dependency — order discriminator.** Claude's A4 surfaced `intent.order.data.order_kind` vs split order subtypes. Synthesis keeps `data.order_kind: medication` as a working assumption and defers the durable decision to A9a. If A9a picks split subtypes, A4 migrates mechanically to `intent.subtype = medication_order` with unchanged payload.

## 17. Sources

- CMS Conditions of Participation: 42 CFR §482.23(c), §482.24(c), §482.25(a)–(b).
- The Joint Commission medication-management and medication-reconciliation standards: MM.04, MM.05, MM.06, NPSG.03.06.01.
- HL7 FHIR R5: MedicationRequest, MedicationAdministration, MedicationStatement.
- Institute for Safe Medication Practices: high-alert medication and hospital medication-safety guidance.
- ASHP medication administration / pharmacy practice guidance.
- pi-chart internal: DESIGN.md source-kind registry and primitive grammar; CLAIM-TYPES.md intent/action/assessment families; ADR 003 fulfillment via intermediate action; ADR 005 interval events; ADR 009 contradiction/resolution links; ADR 010 EvidenceRef roles.
- A3 synthesis: vitals-window evidence addressability and monitoring-plan semantics, especially A3-Q1.
