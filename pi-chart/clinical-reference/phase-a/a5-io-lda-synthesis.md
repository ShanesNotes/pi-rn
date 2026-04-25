# A5. Intake & Output + Lines/Tubes/Drains (LDAs) — synthesis

*Council synthesis note:* This version reconciles the two A5 draft lineages. It keeps the stronger A3/ADR-005 inheritance for LDA in-service state (`observation.context_segment` rather than a new `observation.lda_presence` subtype), keeps direction-specific I&O observations (`observation.intake_event` and `observation.output_event` rather than a single generic `io_measurement`), and folds LDA placement/removal fulfillment back into existing ADR-003 action grammar (`action.procedure_performed`, `action.measurement`, `action.intervention`) instead of creating three new `action.lda_*` subtypes as the default path. The rejected shapes remain documented as open-schema options where they affect owner decisions.

## 1. Clinical purpose

Intake & Output plus Lines/Tubes/Drains preserves the coupled bedside record that answers: **what entered the patient, what left the patient, through which route or device, over what window, and whether that pattern changes perfusion, renal function, respiratory status, bleeding concern, infection risk, nutrition tolerance, or handoff priorities**. Its purpose is not an I&O grid or an LDA tab. It is a measurement-and-context surface: urine output is only meaningful if the collection method and active Foley/external-catheter/void context are known; drain and chest-tube output are only meaningful if the device identity, site, setting, and in-service interval are known; IV intake often originates from A4 medication/fluid actions; and running balance is a derived physiologic context that becomes canonical only when an assessment claims it matters.

## 2. Agent-native transposition

A5 is not an I&O tab plus an LDA tab. In pi-chart it becomes **the fluid/device context layer that turns volume measurements into interpretable evidence**.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Foley / central line / arterial line / chest tube / NG tube active row | `observation.context_segment` with `segment_type: *_in_service`, `data.lda_key`, device/site payload | `timeline()`, proposed `currentState(axis:"lda")`, `openLoops()` |
| Line/tube/drain placement order | `intent.order`; fulfilled by `action.procedure_performed` with `data.procedure_family: "lda_placement"` | `openLoops()`, `evidenceChain()` |
| Device removal/discontinuation | `action.procedure_performed` with `data.procedure_family: "lda_removal"`; closes segment by supersession | `timeline()`, `openLoops()` |
| Patency/site/dressing/securement check | `observation.lda_assessment`; if order/cadence fulfillment must be explicit, paired with `action.measurement` or `action.intervention` | `timeline()`, `openLoops()` |
| PO intake, tube feed, flush not owned by A4, blood product volume edge | `observation.intake_event`, point or interval-shaped | `timeline()`, `ioBalance()` |
| Foley UOP, drain/chest-tube/NG suction/emesis/stool/void output | `observation.output_event`, point or interval-shaped, optionally tied to active LDA segment | `trend()`, `timeline()`, `evidenceChain()` |
| IV antibiotic volume / carrier / maintenance fluid / medication infusion | A4 `action.administration` with I&O-countable volume metadata; A5 consumes, does not duplicate medication truth | `ioBalance()`, `evidenceChain()` |
| Gastric residual volume | `observation.exam_finding` with `data.name: gastric_residual_volume`; not an output event unless actually discarded | `evidenceChain()`, `openLoops()` |
| 8h / 12h / 24h net balance | Derived by `ioBalance(from, to)` from intake, output, and A4 volume-bearing actions | derived view, rendered grid |
| “Net +3 L with worsening oxygenation” | `assessment.fluid_balance` citing an `io://` window and A3 vitals evidence | `evidenceChain()`, `narrative()` |
| Line-associated infection / Foley occlusion / chest tube problem | `assessment.lda_complication` citing segment + site/output evidence | `openLoops()`, `evidenceChain()` |
| Shift I&O total cell, dwell-time banner, color-coded output threshold | derived or rendered, never canonical by itself | rendered only |

> A5 stores volume events and device-context intervals. Grids, totals, dwell-time badges, and “strict I&O” displays are projections.

Load-bearing claims:

**(a) LDA in-service periods are `observation.context_segment` events, not a new event type and not a separate LDA-storage primitive.** This reuses the A3 oxygen-context pattern and ADR 005 interval discipline. New `segment_type` values include `line_in_service`, `foley_in_service`, `drain_in_service`, `airway_in_service`, `tube_in_service`, `chest_tube_in_service`, and potentially `dialysis_access_in_service`. Placement opens a segment; removal closes it through supersession. Per-device identity, site, size/gauge, depth/mark, setting, indication, and local key live in `data.payload`.

**(b) Placement/removal fulfillment uses existing action grammar unless the owner deliberately accepts ergonomic `action.lda_*` aliases.** ADR 003 already says procedure orders are fulfilled by `action.procedure_performed`, and line placement is one of its motivating examples. The synthesis therefore represents placement and removal as `action.procedure_performed` with `data.procedure_family ∈ {lda_placement, lda_removal}`. Routine checks are observations (`observation.lda_assessment`); if an ordered/cadenced check must close a monitoring plan, an `action.measurement` or `action.intervention` fulfills the intent and the assessment supports that action. This lowers action-subtype entropy without losing lifecycle specificity.

**(c) I&O should split into `observation.intake_event` and `observation.output_event`, not a single generic `io_measurement`, as the recommended schema proposal.** A combined `io_measurement` subtype is adapter-friendly, but it makes every validator branch on `direction` and hides different clinical semantics: output often requires source-device consistency; intake often carries route/substance and medication-boundary checks. The split costs one extra subtype but buys stronger payload validation and clearer agent reads.

**(d) Medication-derived volume is A4’s canonical truth.** IV antibiotics, diluents, flushes attached to medication administration, maintenance fluids, titrated infusions, and medication carriers are read from A4 volume-bearing `action.administration` / infusion epochs. A5’s derived balance consumes those actions. A5 should not create shadow intake rows unless a legacy import lacks reconstructible A4 events or unless the owner accepts the blood-product exception in §16 Q4.

**(e) Running fluid balance is derived by default and canonical only when interpreted.** `ioBalance(from, to)` computes net I−O from canonical intake events, output events, and A4 volume-bearing actions. The claim stream must not store every shift total as truth. `assessment.fluid_balance` is written only when a clinician or agent reviews the window and uses it to change interpretation, plan, or handoff.

**(f) A5 does not need a stream file.** A3 needed `vitals.jsonl` because monitor streams produce dense sample volume. A5 is q15min to q1h or per-event in most ICU use; interval events are enough. The important question is ADR 005 allow-list membership for measured-over-window intake/output, not stream storage.

**(g) A5 evidence is mostly windowed or session-scoped.** Fluid-balance assessments cite bounded I&O windows (`io://...`) and supporting A3/A1 evidence. LDA-complication assessments cite in-service segments (`lda://...` or event id fallback), site assessments, output trends, and any diagnostic artifacts.

## 3. Regulatory / professional floor

1. **[regulatory] CMS 42 CFR § 482.24(c)(1), § 482.24(c)(4)** — medical-record entries must be complete, dated, timed, authenticated, and include information needed to justify care, describe progress, and monitor response. Anchors time/author/provenance for I&O and LDA events.
2. **[regulatory] CMS 42 CFR § 482.23(b)(3)–(4)** — RN supervision/evaluation of nursing care and current nursing care plan. Anchors `intent.monitoring_plan` for strict I&O and device-care cadence.
3. **[regulatory/professional] CDC/HICPAC CAUTI guideline** — urinary catheters only for appropriate indications and only as long as needed. Anchors Foley indication, daily/periodic necessity review, and removal loops.
4. **[regulatory/professional] CDC/HICPAC intravascular catheter infection-prevention guidance** — insertion/maintenance practices, site care, training, and local performance monitoring. Anchors central-line/PIV site assessment and dressing/patency loops.
5. **[regulatory/professional] The Joint Commission 2026 National Performance Goals / infection-prevention continuity** — current TJC materials replaced Hospital/Critical Access Hospital NPSGs with NPGs effective 2026; A5 should anchor to the infection-prevention and handoff functions rather than hard-code a deprecated NPSG label as the only authority.

`[phase-b-regulatory]` — exact local policy thresholds (PIV 72 vs 96 h, central-line dressing intervals, Foley indication review cadence, chest-tube escalation volume, drain stripping/milking policy, tube-feed residual policy), state/procedure-specific consent rules, blood-product administration requirements, device recall/lot tracking, and billing/charge capture are profile/policy work, not Phase A primitive design.

## 4. Clinical function

A5 is consumed whenever fluid status, device safety, or source-specific output changes a decision.

- **Resuscitation / perfusion reasoning.** Is urine output improving after fluids or pressors? Is the patient net positive after shock resuscitation? Does NG suction or high drain output explain electrolyte/base problems? Does low output create an AKI/perfusion loop?
- **Respiratory / fluid-overload reasoning.** Does worsening SpO₂/RR occur in the context of +3 L balance? Should fluids be held, diuresis started, or ventilator/oxygen strategy changed?
- **Bleeding / drain / chest-tube surveillance.** Is chest-tube output falling appropriately or suddenly rising? Is output sanguineous, bilious, feculent, purulent, or unexpected for the device?
- **Device safety and bundle review.** Is the Foley still indicated? Is the CVC verified and assessed? Is a dressing overdue? Is a tube in the documented position and on the ordered setting?
- **Medication and nutrition decisions.** Does renal dosing need adjustment based on UOP? Is enteral access present? Is intake restricted by NPO status? Is fluid contribution from medications material?
- **Handoff.** What went in, what came out, what is the net direction, which LDAs are active, what complications are suspected, and what monitoring loops remain open?

Per-consumer specifics: bedside RN authors most I&O and routine LDA observations; providers/APPs/proceduralists author many complex placements/removals and interpret balance/device complications; RT/anesthesia contribute airway/tube context; pharmacists read UOP and fluid contribution for renal dosing and high-risk medication decisions; pi-agent reads A5 to surface loops and may author `assessment.fluid_balance` or draft `assessment.lda_complication`, but should not invent canonical placement/removal or volume events without observed/source evidence.

## 5. Who documents

Primary: **bedside RN** for PO/enteral/non-medication intake, output events, Foley/drain/chest-tube/NG output, routine device site/patency/dressing assessments, nursing-performed placements/removals, and strict-I&O monitoring fulfillment.

Secondary: **provider/APP/intensivist/proceduralist** for CVC/arterial-line/chest-tube/complex drain placement and removal; **RT/anesthesia** for airway and respiratory-device-adjacent tubes; **pharmacist/A4 medication ledger** for medication-fluid volume truth; **patient/surrogate** as a source for reported PO intake, emesis, stool, or voids; **importer/manual scenario/device interface** for fixture or historical rows; **pi-agent** for inferred assessments and loop surfacing only.

Owner of record: performer for placement/removal actions; documenting RN/clinician for observed I&O and LDA assessments; ordering provider/team for strict-I&O and device-care intents; attending/team for interpreted balance and complication assessments.

## 6. When / how often

Frequency class: **event-driven + periodic + interval-shaped + derived**.

- **Regulatory minimum:** no universal numeric cadence. Regulations and accreditation require complete/timed/authenticated documentation, care-plan currency, and infection-prevention processes; they do not define one global I&O interval for every patient.
- **Clinical practice norm:** ICU strict I&O often hourly in shock/AKI/diuresis and at least per shift in lower-acuity contexts; drain/chest-tube/NG output commonly follows device/order cadence; LDA checks are per shift/PRN and policy-specific; daily or periodic line/Foley necessity review is common bundle practice. `[verify-with-nurse]` Exact seed-fixture defaults should be operator-confirmed.
- **Divergence:** cadence belongs in `intent.monitoring_plan` or device-care order/profile, not the global schema. Live-mode gaps are open loops; completed-fixture/replay-mode gaps may be validator errors.

A re-read of unchanged LDA state should not create an event. A rendered shift-total cell is derived.

## 7. Candidate data elements

| Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| `direction` via subtype | [clinical] | ✓ | `intake_event` / `output_event` | cannot separate volume entering vs leaving or apply subtype-specific validators | human / import / A4 | high |
| `volume_ml` | [clinical] | ✓ | number, mL, nullable with explicit unmeasured basis | cannot compute balance, UOP rate, drain trend, blood loss | human / device / A4 / import | high |
| `effective_at` / `effective_period` | [clinical][open-schema] | ✓ | point or interval | cannot compute mL/hr, balance window, segment overlap, or cadence fulfillment | human / device / derived | high |
| `intake_route` | [clinical] | ✓ | PO, enteral, IV, flush, blood_product, other | cannot distinguish fluid route or A4 ownership boundary | human / A4 / import | high |
| `substance_or_category` | [clinical] | ✓ | water, enteral_feed, crystalloid, blood_product, urine, stool, emesis, drain, NG_suction | cannot group outputs or decide clinical interpretation | human / A4 / import | high |
| `source_lda_ref` / `collection_method` | [clinical][open-schema] | ✓ | event id or `lda://`; enum/text | cannot validate Foley/drain/chest-tube output against active device state | human / device / import | high |
| `lda_key` | [clinical][open-schema] | ✓ | local stable string | cannot join segment, assessment, setting, output, and removal before URI grammar exists | human / import | high |
| `segment_type` | [clinical] | ✓ | `*_in_service` enum | cannot project active LDAs or apply device-specific rules | human / import | high |
| `device_class` / `device_type` | [clinical] | ✓ | vascular_line, urinary_catheter, airway, enteral_tube, drain, chest_tube; subtype text | Foley vs external catheter or JP vs chest tube changes safety and interpretation | human / import | high |
| `site_or_body_location` | [clinical] | ✓ | coded/text | cannot distinguish right IJ CVC from left forearm PIV or match assessments | human / import | high |
| `device_setting` | [clinical] | ✓ | suction cmH2O, water seal, feed rate, tube depth, cuff pressure | output/nutrition/respiratory interpretation may be wrong | human / device | medium |
| `indication` | [clinical][regulatory] | ✓ | enum/text | cannot audit Foley/CVC need or close indication-expired loops | human / clinician_chart_action | high |
| `lda_assessment_findings` | [clinical] | ✓ | structured object | cannot detect infection, infiltration, occlusion, dislodgement, dressing failure | human | high |
| `material_or_appearance` | [clinical] | ✓ | clear, cloudy, bloody, serous, bilious, feculent, coffee-ground, stool character | drain/NG/chest-tube safety checks lose meaning | human | medium |
| `quality_or_basis` | [clinical] | ✓ | measured, estimated, derived, questionable, patient_reported | cannot separate urimeter output from estimate or imported aggregate | human / device / derived | high |
| `source_action_ref` | [clinical][agent] | ✓ | event id | medication-fluid volume can drift from A4 or cannot be audited | A4 / human / derived | high |
| `required_cadence_or_threshold` | [clinical] | ✓ via `intent.monitoring_plan` | cadence/threshold object | no basis for stale-I&O, UOP target, or device-care open loops | clinician_chart_action / protocol_standing_order | medium |
| `verification_ref` | [clinical] | ✓ for selected devices | event/artifact ref | cannot prove CVC/ETT/NG position verification where required | A2 / artifact_ref / human | medium |
| `balance_total_cell` | [cruft] | ✗ | number | n/a — derived unless interpreted | derived | high exclusion |
| `flowsheet_row_display_name` | [cruft] | ✗ | text | n/a — rendered mapping | EHR legacy | high exclusion |
| `device_lot_serial_per_measurement` | [cruft] | ✗ | text | n/a for Phase A memory; may matter for recall in Phase B | human / device | high exclusion |

## 8. Excluded cruft — with rationale

- **Field:** flowsheet cell color / threshold icon. **Why it exists:** rapid visual triage and local policy display. **Why pi-chart excludes it:** severity and staleness are derived/rendered from values, thresholds, and active monitoring plans.
- **Field:** per-row patient name/MRN/room. **Why it exists:** paper-form inheritance and export safety. **Why pi-chart excludes it:** subject/encounter envelope carries identity.
- **Field:** row sort order, section header, “Intake”/“Output” grid band. **Why it exists:** human navigation. **Why pi-chart excludes it:** views group canonical events at render time.
- **Field:** automatic shift/24h total as canonical row. **Why it exists:** EHR reporting convenience. **Why pi-chart excludes it:** totals are derived unless clinically interpreted as an assessment.
- **Field:** device brand/lot/supply charge code on every measurement. **Why it exists:** inventory, billing, recall. **Why pi-chart excludes it:** not needed for Phase A clinical memory; can re-enter in Phase B device-recall scope.
- **Field:** “bag emptied by initials” separate from author. **Why it exists:** paper-era dual-sign habit. **Why pi-chart excludes it:** envelope author/provenance records accountable authorship.
- **Field:** routine “WNL” LDA assessment. **Why it exists:** checklist completion. **Why pi-chart excludes it:** include assessed dimensions or omit; undifferentiated WNL is weak evidence.
- **Field:** copy-forward “same as prior shift.” **Why it exists:** speed and defensive documentation. **Why pi-chart excludes it:** hides missed removals and stale device state; active state is derived from intervals.
- **Field:** free-text comment repeated on every row. **Why it exists:** local nuance and habit. **Why pi-chart excludes it:** material findings are structured, cited, or placed in note/narrative.
- **Field:** routine LDA photo field on every check. **Why it exists:** defensive documentation. **Why pi-chart excludes it:** material photos become `artifact_ref(subtype: clinical_photo)` only when clinically meaningful.

## 9. Canonical / derived / rendered

- **Canonical** (claim stream):
  - `observation.intake_event` and `observation.output_event`, point or interval-shaped.
  - `observation.context_segment` with LDA `segment_type` values and device payload.
  - `observation.lda_assessment` for site/patency/dressing/securement/position checks.
  - `action.procedure_performed` for LDA placement/removal when an act/order must be represented.
  - `action.measurement` or `action.intervention` only when a monitoring/care intent needs explicit action fulfillment.
  - A4 volume-bearing `action.administration` / infusion epochs consumed by A5 balance.
  - `intent.monitoring_plan` for strict I&O and LDA/device-care cadence.
  - `assessment.fluid_balance` and `assessment.lda_complication` when interpreted.
  - `observation.exam_finding` for related non-output findings such as gastric residual.
  - `artifact_ref` for material images or device/procedure artifacts.
- **Derived** (computed by views):
  - `ioBalance(from, to)` net balance; shift/24h subtotal; intake by route; output by source.
  - UOP mL/hr and mL/kg/hr trend; drain/chest-tube trend; output-rate threshold crossings.
  - Active LDA list from non-superseded in-service context segments.
  - Dwell time, indication-expired loops, dressing/check overdue loops.
  - Flow-grid projections joining A4 medication/fluid actions to A5 events.
- **Rendered** (UI-only):
  - I&O grid cells, row grouping, device icons, colored thresholds, trend arrows, “strict I&O” banner, shift-total boxes, and dwell-time badges.

## 10. Provenance and lifecycle

### Provenance

Source(s) of truth: clinician-authored bedside charting, procedure actions, medication/fluid actions, imported fixture/historical rows, and selected device/interface evidence when available. Use existing `source.kind` values: `nurse_charted`, `clinician_chart_action`, `protocol_standing_order`, `patient_statement`, `poc_device`, `monitor_extension` where truly a monitor extension, `manual_scenario`, `synthea_import`, `mimic_iv_import`, `agent_inference`, `agent_action`, and `agent_synthesis`. A5 does **not** propose new source kinds for automated urimeters, smart pumps, or drain devices; device-specific provenance lives in `source.ref`, `data.method`, `artifact_ref`, or a later ADR 006 amendment if fixtures prove the need.

### Lifecycle

- **Created by:** I&O events are created by observed/charted volume, patient report, import, or A4 volume-bearing action; LDA segments are created by placement action or documented bedside state; LDA assessments are created by observed checks.
- **Updated by:** new I&O events, new assessment events, device setting changes as new context segments or `observation.device_reading`, and superseding interval closure events.
- **Fulfilled by:** only `action` events fulfill intents. `action.procedure_performed` fulfills placement/removal orders; `action.measurement` may fulfill ordered/cadenced measurement. Observations do not carry `links.fulfills`.
- **Cancelled / discontinued by:** monitoring plans close through intent lifecycle supersession; LDA in-service segments close by a superseding segment with `effective_period.end`, supported by a removal/discontinuation action when present.
- **Superseded / corrected by:** corrections to volume, timing, method, device identity, site, or segment closure use `links.supersedes` / `links.corrects`; no in-place mutation.
- **Stale when:** active plan cadence is missed; device-care interval expires; output appears outside active LDA interval; balance assessment cites a window whose underlying events have since been superseded; device setting has changed without corresponding segment/reading update.
- **Closes the loop when:** a required event/assessment appears in the required window, a removal action or renewed indication resolves an LDA-indication loop, or a balance assessment plus addressing intent/action resolves a balance concern.

### Contradictions and reconciliation

- **Foley active but urine output says voided.** Preserve both. This may reflect Foley occlusion, removal not yet closed, or documentation error; require assessment/correction rather than suppression.
- **Output after device removal.** Preserve and flag. Likely wrong interval or wrong source LDA.
- **Pump/MAR volume conflicts with manual IV intake.** Preserve both; medication truth remains A4; A5 may surface `contradicts` until resolved.
- **Ordered NPO vs documented PO intake.** Preserve both; escalate via assessment/communication, not silent deletion.
- **Chest tube ordered to suction but segment/device setting says water seal.** Preserve and flag as care-delivery discrepancy.
- **Gastric residual measured and returned.** Do not count as output. If discarded, author an output event with explicit disposition.

## 11. Missingness / staleness

- **What missing data matters clinically?**
  - Hourly UOP missing in shock, AKI, post-fluid challenge, or active diuresis.
  - Output event lacks volume or explicit unmeasured/estimated basis.
  - Output from urine/drain/chest-tube/NG category lacks active LDA ref or explicit non-device collection method.
  - Active Foley/CVC/chest tube/ETT lacks required indication/check/verification within declared cadence.
  - LDA removal time is missing after a documented removal action.
  - A4 medication-fluid volume is missing when balance is used for a treatment decision.
  - Net positive/negative threshold crossing lacks `assessment.fluid_balance` during active resuscitation/respiratory failure.
- **What missing data is merely unknown?**
  - Exact PO intake for a stable ambulatory patient when self-report/estimate is acceptable.
  - Void volume without collection hat; document as unmeasured rather than fabricate a number.
  - Insensible losses; not measured in normal I&O accounting and handled in interpretation.
  - Brand/lot/checklist microsteps unless clinically material.
- **When does A5 become stale?** Per-device and per-plan. No global number. Shock/resuscitation: UOP is commonly stale after roughly 60–90 minutes without an event `[verify-with-nurse]`. Stable floor: cadence comes from the active plan/profile. LDA checks become stale by device/policy cadence and immediately when the device is manipulated, transported, obstructed, dislodged, or produces unexpected output.
- **Should staleness create an `openLoop`?** Yes when there is an active monitoring/device-care obligation or active problem making absence unsafe. Otherwise old I&O is historical, not stale.

Proposed loop names:

- **OL-IO-01** — UOP-rate target miss during declared perfusion/renal monitoring.
- **OL-IO-02** — declared I&O cadence miss.
- **OL-IO-03** — balance threshold crossing without reviewed assessment.
- **OL-LDA-01** — active LDA without cadence-required assessment.
- **OL-LDA-02** — active LDA with expired or undocumented indication.
- **OL-LDA-03** — required placement verification missing.
- **OL-LDA-04** — abrupt drain/chest-tube/NG output change without assessment.

Live mode surfaces loops; strict replay/completed-fixture mode may validate them as errors.

## 12. Agent read-before-write context

Before authoring an I&O event, LDA assessment, LDA segment, fluid-balance assessment, or LDA-complication assessment, an agent reads:

- `currentState({ axis:"problems", asOf })` — shock, sepsis, AKI, bleeding, hypoxemia, heart failure, nutrition intolerance, post-op status.
- `readActiveConstraints()` / `currentState({ axis:"constraints", asOf })` — NPO, device refusals, blood-product constraints, latex/adhesive allergy, code-status implications for invasive devices.
- `currentState({ axis:"intents", asOf })` — strict I&O plans, monitoring plans, line/tube/drain orders, medication/fluid orders, NPO/tube-feed orders.
- Proposed `currentState({ axis:"lda", asOf })`; fallback is `timeline(types:["observation"], subtypes:["context_segment","lda_assessment"], includeSuperseded:false)` filtered to LDA segment types.
- `ioBalance({ from, to })`; fallback is `timeline(types:["observation","action"], from, to)` filtered to `intake_event`, `output_event`, and A4 volume-bearing administrations.
- `trend({ metric:"urine_output_rate", from, to })` using A0a weight for mL/kg/hr.
- A3 vitals windows (`MAP`, `SpO₂`, `RR`, `HR`) and A1 labs (`Cr`, `BUN`, electrolytes, lactate, Hgb/Hct`) before interpreting balance/output.
- A4 medication actions for fluids, diuretics, vasopressors, nephrotoxins, and blood products.
- `openLoops({ kind:"io_*"|"lda_*", asOf })` to avoid duplicating loops or mis-closing a different obligation.
- `evidenceChain({ eventId })` before superseding/correcting a balance or complication assessment.

Agent-authored assessments must cite structured `EvidenceRef` objects with roles. Windowed balance citations use `io://` if adopted; otherwise they cite an enumerated event set plus `data.window`.

## 13. Related artifacts

- **A0a** — weight for UOP mL/kg/hr; baseline renal/cardiopulmonary context; encounter/location/device-care profile context.
- **A0b** — allergies/constraints (latex, adhesives, blood refusal), code status, device-specific refusals.
- **A0c** — active shock, sepsis, AKI, hypoxemia, bleeding, heart failure, post-op, nutrition problems drive cadence and interpretation.
- **A1** — creatinine/BUN/lactate/electrolytes/Hgb/Hct and drain-fluid labs interpret I&O and output abnormalities.
- **A2** — CXR/US/diagnostic artifacts for line/tube placement verification and chest-tube complications.
- **A3** — vitals support perfusion/oxygenation interpretation; A3 consumes A5 UOP and balance trends.
- **A4** — medication/fluid administrations are consumed by A5 balance; diuretics/pressors/nephrotoxins depend on A5 response evidence.
- **A4b** — home diuretics/antihypertensives and route/access issues affect fluid/nutrition medication decisions indirectly.
- **A6** — provider notes document fluid plans, line plans, daily necessity, and interpretation of balance.
- **A7** — nursing notes/handoff synthesize shift I&O and device state.
- **A8** — head-to-toe assessment supplies edema, abdominal, skin, GU/GI, wound, and device-site findings.
- **A9a** — individual orders for placement/removal, strict I&O, tube feeds, NPO, suction, drain care, and monitoring cadence.
- **A9b** — sepsis/ICU bundles create child intents for fluids, Foley/strict I&O, CVC, cultures, pressors, and line review.

## 14. Proposed pi-chart slot shape

### Event type + subtype

Existing event types, mostly new subtypes/payloads:

- `observation.subtype = intake_event` — new subtype; point or interval; ADR 005 allow-list extension proposed for interval variant.
- `observation.subtype = output_event` — new subtype; point or interval; ADR 005 allow-list extension proposed for interval variant.
- `observation.subtype = context_segment` — existing subtype; new LDA `segment_type` values and payload conventions; already interval-allow-listed.
- `observation.subtype = lda_assessment` — new subtype for site/patency/dressing/securement/position checks.
- `action.subtype = procedure_performed` — existing ADR-003 subtype; used with `data.procedure_family: lda_placement | lda_removal`.
- `action.subtype = measurement` — existing ADR-003 subtype; optional for explicit fulfillment of ordered/cadenced measurement.
- `action.subtype = intervention` — existing conventional subtype; optional for flush, dressing change, re-securement, unclogging, etc., when the care act matters separately from observed findings.
- `intent.subtype = monitoring_plan` — existing A3 pattern; reused for I&O cadence and device-care cadence.
- `assessment.subtype = fluid_balance` — new subtype; derived-by-default, stored only when reviewed/acted on.
- `assessment.subtype = lda_complication` — new subtype for device-related complications or suspicion/reconciliation.

No new event type. No new storage primitive. No new link kinds. No new `source.kind` values.

### Payload examples

LDA placement action plus in-service segment:

```jsonc
// action.procedure_performed — placement act, fulfills an order if present
{
  "id": "evt_20260418T0855_cvc_place",
  "type": "action",
  "subtype": "procedure_performed",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T08:55:00-05:00",
  "recorded_at": "2026-04-18T09:05:00-05:00",
  "author": { "id": "app_lee", "role": "app" },
  "source": { "kind": "clinician_chart_action" },
  "certainty": "performed",
  "status": "final",
  "data": {
    "procedure_family": "lda_placement",
    "lda_key": "cvc_ri_001",
    "device_class": "vascular_line",
    "device_type": "triple_lumen_cvc",
    "site_or_body_location": "right_internal_jugular",
    "indication": "vasopressor_access",
    "verification": {
      "required": true,
      "modality": "cxr",
      "result_ref": "evt_20260418T0920_cxr_result"
    }
  },
  "links": {
    "fulfills": ["evt_order_cvc_001"],
    "addresses": ["evt_problem_shock"]
  }
}
```

```jsonc
// observation.context_segment — active in-service state
{
  "id": "evt_20260418T0855_cvc_segment_open",
  "type": "observation",
  "subtype": "context_segment",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_period": { "start": "2026-04-18T08:55:00-05:00" },
  "recorded_at": "2026-04-18T09:06:00-05:00",
  "author": { "id": "app_lee", "role": "app" },
  "source": { "kind": "clinician_chart_action" },
  "certainty": "observed",
  "status": "active",
  "data": {
    "segment_type": "line_in_service",
    "lda_key": "cvc_ri_001",
    "device_class": "vascular_line",
    "device_type": "triple_lumen_cvc",
    "site_or_body_location": "right_internal_jugular",
    "payload": {
      "lumens": 3,
      "status_detail": "in_service",
      "indication": "vasopressor_access"
    }
  },
  "links": {
    "supports": [
      { "kind": "event", "ref": "evt_20260418T0855_cvc_place", "role": "primary" }
    ]
  }
}
```

Output event, interval:

```jsonc
{
  "id": "evt_20260418T1000_uop_foley",
  "type": "observation",
  "subtype": "output_event",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_period": {
    "start": "2026-04-18T09:00:00-05:00",
    "end": "2026-04-18T10:00:00-05:00"
  },
  "recorded_at": "2026-04-18T10:02:00-05:00",
  "author": { "id": "rn_shane", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "certainty": "observed",
  "status": "final",
  "data": {
    "category": "urine",
    "volume_ml": 30,
    "collection_method": "foley_urimeter",
    "source_lda_ref": "lda://enc_001/foley_001",
    "quality_or_basis": "measured"
  },
  "links": {
    "supports": [
      { "kind": "event", "ref": "evt_20260418T0900_foley_segment_open", "role": "context" }
    ]
  }
}
```

Intake event, interval tube feed:

```jsonc
{
  "id": "evt_20260418T1400_tube_feed",
  "type": "observation",
  "subtype": "intake_event",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_period": {
    "start": "2026-04-18T10:00:00-05:00",
    "end": "2026-04-18T14:00:00-05:00"
  },
  "recorded_at": "2026-04-18T14:05:00-05:00",
  "author": { "id": "rn_shane", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "certainty": "observed",
  "status": "final",
  "data": {
    "route": "enteral",
    "substance": "tube_feed",
    "volume_ml": 200,
    "rate_ml_hr": 50,
    "access_lda_ref": "lda://enc_001/ng_001",
    "quality_or_basis": "pump_total_charted"
  }
}
```

Fluid-balance assessment:

```jsonc
{
  "id": "evt_20260418T1900_balance_assessment",
  "type": "assessment",
  "subtype": "fluid_balance",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T19:00:00-05:00",
  "recorded_at": "2026-04-18T19:04:00-05:00",
  "author": { "id": "rn_agent", "role": "rn_agent" },
  "source": { "kind": "agent_inference" },
  "transform": { "activity": "infer", "tool": "pi-agent-fluid-balance" },
  "certainty": "inferred",
  "status": "final",
  "data": {
    "window": {
      "from": "2026-04-18T11:00:00-05:00",
      "to": "2026-04-18T19:00:00-05:00"
    },
    "derived_balance_ml": 3020,
    "summary": "Net positive approximately 3 L over 8 h with worsening oxygenation; concern for fluid-overload contribution.",
    "clinical_significance": "respiratory_status_worsening",
    "recommended_followup": "review maintenance fluids and consider diuresis if hemodynamically tolerated"
  },
  "links": {
    "supports": [
      {
        "kind": "external",
        "ref": "io://enc_001?metric=net_balance_ml&from=2026-04-18T11:00:00-05:00&to=2026-04-18T19:00:00-05:00",
        "role": "primary",
        "selection": { "aggregation": "sum" }
      },
      {
        "kind": "vitals_window",
        "ref": "vitals://enc_001?name=spo2&from=2026-04-18T15:00:00-05:00&to=2026-04-18T19:00:00-05:00",
        "role": "confirmatory"
      }
    ],
    "addresses": ["evt_problem_hypoxemia"]
  }
}
```

### Link conventions

- `supports` — output events cite active LDA context as `context`; intake events cite A4 actions when derived from medication/fluid truth; assessments cite I&O windows, LDA segments, vitals/labs/artifacts.
- `fulfills` — only action → intent. Placement/removal/measurement actions fulfill orders/plans. Observations do not fulfill.
- `addresses` — device/fluid intents/actions/assessments address active problems such as shock, AKI, bleeding, hypoxemia, nutrition intolerance.
- `supersedes` — interval closure, amended segment payload, corrected volume/time/device identity.
- `corrects` — entered-in-error volume, wrong source LDA, wrong time/window.
- `contradicts` — peer-claim tension: Foley vs void, pump vs nurse volume, ordered suction vs actual setting.
- `resolves` — loop closure or contradiction resolution: removal resolves expired-indication loop; follow-up assessment resolves output anomaly.

### Evidence addressability

- **Event id** — baseline support for discrete events and segments.
- **`lda://` URI** — proposed durable session identity, e.g. `lda://enc_001/foley_001`, backed by `data.lda_key` and segment events.
- **`io://` URI** — proposed windowed evidence, e.g. `io://enc_001?metric=net_balance_ml&from=...&to=...`.
- **Fallback without URI ADR:** cite segment event ids and enumerated I&O event ids plus `data.window`.

### Storage placement

- `events.ndjson` — all canonical A5 events; no new file.
- `notes/*.md` — narrative line plans, fluid plans, handoff explanations via A6/A7.
- `artifacts/` — clinically material photos, imaging/procedure/device artifacts via `artifact_ref`.
- No A5 stream file; output cadence is not A3 telemetry scale.

### Frequency class

Event-driven, periodic, interval-shaped, derived.

### View consumers

`timeline()` for flowsheet projection; `ioBalance(from,to)` for net balance; `trend()` for UOP and drain trajectories; `currentState(axis:"lda")` proposed for active devices; `evidenceChain()` for balance/complication reasoning; `openLoops()` for cadence, indication, verification, and threshold gaps; `narrative()` for handoff/round summaries.

### Schema confidence

- **High:** context-segment reuse, point intake/output payloads, A4 volume-consumption boundary, `intent.monitoring_plan` reuse, derived-balance discipline, source-kind restraint.
- **Medium:** interval intake/output allow-list; `observation.lda_assessment` payload shape; exact device-setting representation (`context_segment.payload` vs `observation.device_reading`).
- **Low–Medium:** `io://` / `lda://` URI grammar and `currentState(axis:"lda")` axis dispatch; should be resolved with A3/A4b axis questions.

### Schema impact

- `new subtype` — `observation.intake_event`, `observation.output_event`, `observation.lda_assessment`, `assessment.fluid_balance`, `assessment.lda_complication`.
- `new payload shape` — LDA `segment_type` values on existing `observation.context_segment`.
- `ADR amendment` — ADR 005 interval allow-list for intake/output event subtypes.
- `new addressability URI` — proposed `io://`, `lda://`.
- `new view axis` — proposed `currentState(axis:"lda")`; `ioBalance()` may avoid `axis:"fluid_balance"`.
- `none` — no new event type, storage primitive, link kind, or source kind.

## 15. Validator and fixture implications

### Validator rules

- **V-LDA-01 — Placement opens segment.** `action.procedure_performed.data.procedure_family = "lda_placement"` should be followed by a matching `observation.context_segment` with `segment_type: *_in_service`, same `lda_key`, `effective_period.start == placement.effective_at`, and `links.supports` citing the placement. Severity: error in completed fixture; warn/live open loop before expected documentation window closes.
- **V-LDA-02 — Removal closes segment.** `procedure_family = "lda_removal"` must close exactly one matching in-service segment via a superseding segment with `effective_period.end == removal.effective_at`. Severity: error in completed fixture.
- **V-LDA-03 — Device verification.** CVC/ETT/post-pyloric NG/chest-tube placements requiring verification must carry evidence refs or create an open loop until verification appears. Severity: openLoop live; error strict replay if unresolved.
- **V-LDA-04 — Segment overlap.** Active LDA segments with the same `lda_key` must not overlap unless explicitly representing a correction/duplicate-source contradiction. Severity: error.
- **V-LDA-05 — LDA assessment target.** `observation.lda_assessment` must cite an active LDA segment or explicit reason no active segment exists. Severity: warn live; error completed fixture.
- **V-IO-01 — Output-device consistency.** Device-dependent `output_event` categories must cite active `source_lda_ref` or explicit non-device method. Output outside cited interval is warn/live, error/completed fixture.
- **V-IO-02 — Intake A4 boundary.** Medication-carrier/flush/IV medication volume must cite A4 action or be flagged as legacy aggregate/import. A5 must not duplicate drug/dose/order truth. Severity: warning; error if conflicting with A4.
- **V-IO-03 — Interval allow-list.** If ADR 005 is extended, interval intake/output must use `effective_period`; ad-hoc `data.window` should be rejected except import compatibility. Severity depends on ADR resolution.
- **V-IO-04 — Balance-assessment evidence.** `assessment.fluid_balance` must cite bounded I&O evidence (`io://` or enumerated events) and `data.window`; unsupported balance interpretation violates invariant 5. Severity: error.
- **V-IO-05 — No canonical running-balance rows.** Events whose sole purpose is “shift total” or “24h total” are invalid unless marked as legacy aggregate import with provenance and not used as authoritative over reconstructible atomic events. Severity: warn/error by fixture mode.
- **V-MONPLAN-IO — Cadence fulfillability.** I&O monitoring plans must be fulfillable by relevant intake/output events, paired measurement actions, or explicit holds. Live mode creates open loops; strict replay errors when unresolved.
- **V-SRC-A5 — Source-kind restraint.** Automated device details do not introduce new `source.kind` values without ADR 006 amendment; use allowed kinds plus `source.ref`/payload. Severity: follows ADR 006 warning/error phase.

### Minimal fixture

Seven scenarios cover normal, edge, and replay behavior:

1. **Stable ICU shift — normal I&O.** Active Foley segment, hourly UOP around 60 mL/hr, enteral feed 50 mL/hr, one PO ice-chip intake, derived balance mildly positive.
2. **Septic shock resuscitation phase.** LR boluses and norepinephrine from A4, CVC placement with verification loop, UOP 15 → 25 → 45 mL/hr, `assessment.fluid_balance` at 2 h citing `io://` and MAP/UOP evidence.
3. **Positive-balance respiratory decompensation.** Net +3 L over 8 h with worsening SpO₂/RR; `assessment.fluid_balance` addresses hypoxemia and supports furosemide/fluid-hold plan.
4. **Foley removal / CAUTI bundle.** Foley active 47 h, indication review, removal closes segment, later spontaneous void output uses non-device collection method.
5. **Chest-tube output trend.** Q2h output 120 → 60 → 30 mL, then sudden 250 mL sanguineous output creates OL-LDA-04 and `assessment.lda_complication` citing CXR/provider review.
6. **Conflicting-source output.** Foley output 20 mL and voided 150 mL in same hour; preserved as contradiction, `assessment.lda_complication` considers occlusion, intervention documents flush/check.
7. **Replay-mode cadence miss.** Q1h UOP monitoring plan active, one window missing output; live mode emits OL-IO-02, strict replay validator errors.

## 16. Open schema questions

1. **Q1 — Artifact unity.** Are I&O and LDA one Phase A artifact or two? Lean: keep unified because output interpretation depends on active LDA state, and the validator/view work is shared. See `OPEN-SCHEMA-QUESTIONS.md#a5-artifact-unity`.
2. **Q2 — I&O event grammar and interval allow-list.** Should canonical I&O use split `observation.intake_event` / `observation.output_event` or a single `observation.io_measurement`, and should the chosen subtype(s) be ADR-005 interval-allow-listed? Lean: split intake/output and allow-list both for `effective_period`. See `OPEN-SCHEMA-QUESTIONS.md#a5-io-event-grammar-and-interval-allow-list`.
3. **Q3 — Running fluid balance storage.** Should balance be derived-only, stored as `assessment.fluid_balance` when reviewed/acted on, or stored every shift? Lean: derived by default, stored only as assessment when clinically interpreted, unified with A3 derived-score ADR. See `OPEN-SCHEMA-QUESTIONS.md#a5-balance-storage`.
4. **Q4 — Medication-derived intake and blood-product boundary.** How should A4 volume-bearing medication/fluid actions participate in A5 balance, and are blood products a legitimate A5-authored exception? Lean: non-blood medication/IV fluids stay A4-owned and consumed by A5; blood products remain open as the strongest exception candidate. See `OPEN-SCHEMA-QUESTIONS.md#a5-med-derived-intake`.
5. **Q5 — `io://` / `lda://` URIs and current-state axes.** Should windowed I&O and durable LDA sessions gain URI addressability, and should `currentState(axis:"lda")` / `axis:"fluid_balance"` exist? Lean: adopt `io://` and `lda://`; resolve axes in one cross-artifact ADR with A3/A4/A4b; prefer `ioBalance()` over `axis:"fluid_balance"` because balance is windowed, not latest-state. See `OPEN-SCHEMA-QUESTIONS.md#a5-io-lda-addressability-and-axes`.

Not elevated as a separate schema question: **new A5 device source kinds**. Current synthesis follows ADR 006 and does not add them. Device-interface provenance can ride on existing `source.kind` + `source.ref` until fixture/import data proves otherwise.

## 17. Sources

- pi-chart Phase A Charter — primitive discipline, schema entropy budget, canonical/derived/rendered boundaries, and field-tagging rules.
- pi-chart Phase A Template — mandatory 17-section output shape and §16 open-schema/durable-home discipline.
- pi-chart Phase A Execution Plan — A5 placement in Batch 2 and paired I&O/LDA scope.
- PHASE-A-FIXTURE-SCAFFOLD.md — `patient_001` remains a narrow respiratory-decompensation seed; A5 breadth should be added only with explicit provisional assumptions.
- A3 Vital Signs synthesis — `context_segment` precedent, monitoring-plan pattern, vitals-window evidence, replay-vs-live severity, and derived-score discipline.
- A4 MAR synthesis — medication fulfillment ledger, infusion/action interval discipline, narrow `links.fulfills`, A4 ownership of medication volume truth.
- A4b Medication Reconciliation synthesis — list-shaped observation pressure, URI/addressability precedent, currentState-axis growth, and source-kind restraint.
- OPEN-SCHEMA-QUESTIONS.md — prior implemented/accepted/open/deferred triage; do not treat every earlier “lean” as final.
- pi-chart repo substrate: README, ROADMAP, DESIGN, CLAIM-TYPES, ADR 003, ADR 005, ADR 006, ADR 009, ADR 010, ADR 011, ADR 016, schemas, types, validator, and view surfaces.
- CMS eCFR 42 CFR § 482.24 — Medical record services; § 482.23 — Nursing services.
- CDC/HICPAC — Guideline for Prevention of Catheter-Associated Urinary Tract Infections; Guidelines for the Prevention of Intravascular Catheter-Related Infections.
- The Joint Commission — National Performance Goals effective January 2026 for Hospital/Critical Access Hospital programs; legacy NPSG labels should be verified before implementation references.
- SCCM Surviving Sepsis Campaign 2021 — fluid resuscitation/perfusion context; UOP target usage is a professional practice/profile detail.
- HL7 FHIR R5 — Observation and DeviceUsage as informative interoperability witnesses, not pi-chart authority.
