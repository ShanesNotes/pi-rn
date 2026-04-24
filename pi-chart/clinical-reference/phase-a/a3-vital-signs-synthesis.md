# A3. Vital sign flowsheet

## 1. Clinical purpose

A vital sign flowsheet is the patient's time-series physiologic signal — the minimum repeated measurements that let clinicians detect deterioration, confirm response to interventions, choose monitoring intensity, and answer at handoff whether the patient is **stable, improving, or getting worse**. Its clinical purpose is **trend recognition**, not abnormality detection in isolation: a SpO₂ of 89% on stable nasal cannula 2 L, after a prior 94% reading and with rising respiratory rate, is evidence for deterioration even though no single value crosses a hard threshold. Vitals are the densest physiologic evidence stream the chart carries, and they are also the primary evidence substrate for nearly every clinical assessment that cites physiologic state — invariant 5 (assessments require supporting observation / vitals-window / artifact evidence) is operationalized almost entirely through this artifact. A flowsheet's visual density — column-per-interval, color-by-severity, trend arrows — is rendering; the underlying stream is what must survive into the substrate.

## 2. Agent-native transposition

A vital sign flowsheet is not a tab. In pi-chart it is **the densest physiologic evidence stream the chart carries**, decomposed into three distinct authoring cadences over a small set of primitives. The legacy-EHR flowsheet's grid is a `timeline()` projection of that stream; the header bands, badges, and trend arrows are rendering.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Continuous monitor row | `vitals.jsonl` sample (not an `observation` event) | `currentState(axis:"vitals")`, `trend()` |
| Q1h manual nursing vital set | `observation.vital_sign` events in `events.ndjson`, one per metric per entry | `timeline()`, `currentState()`, `trend()` |
| Manual recheck refuting a monitor value | a second sample / event with `source.kind: nurse_charted`; later assessment cites both via ADR 010 roles (`primary` / `counterevidence`) | `trend()`, `evidenceChain()` |
| O₂-device / flow header band | `observation.context_segment` with `effective_period` per ADR 005; per-sample `context` retained as read-convenience only | `currentState()`, `timeline()` |
| Ventilator-settings row | `observation.device_reading` with `effective_period` per ADR 005; supersession at each rate/setting change | `currentState()`, `timeline()` |
| Trend interpretation ("worsening respiratory status") | `assessment.subtype = trend` or `assessment.subtype = risk_score` citing `vitals_window` evidence per ADR 010 | `evidenceChain()`, `narrative()` |
| Required-cadence statement ("q15min SpO₂ after escalation") | `intent.subtype = monitoring_plan` with `effective_period`, `data.required_cadence`, `data.alert_policy` | `currentState(axis:"intents")`, `openLoops()` |
| Trend arrow cell (↓ ↑) | derived from `trend()` at query time — not stored | rendered only |
| Native waveform strip (ECG, art line, pleth) | `artifact_ref(subtype: waveform)` referencing native file; not in `vitals.jsonl` | `evidenceChain()` |
| Alarm banner flashing | derivation over latest sample + active monitoring_plan thresholds; canonical event shape pending §16 Q5 | `openLoops(kind: vital_alert)` |

> Vital signs are not a flowsheet tab. In pi-chart they are a physiologic evidence stream: valid samples establish trajectory, trend assessments cite windows of that stream, monitoring plans define when silence becomes unsafe, and open loops fire when required measurements or escalations do not happen.

The core transposition is "sample stream → derived current/trend state → supported clinical assessment/action." A SpO₂ of 89% is not just a row. In context — on stable 2 L nasal cannula, after a prior 94%, with rising respiratory rate — it becomes evidence for a deterioration assessment, a reason to escalate monitoring or oxygen, and a time-bound audit point for whether the agent or clinician responded.

Load-bearing claims:

**(a) Three `source.kind` values must remain distinct.** `monitor_extension` (continuous stream), `nurse_charted` (manual entry, often verifying or refuting the monitor), and `poc_device` (iStat, handheld SpO₂, standalone cuff, core-temp probe) are not collapsible. Downstream reasoning about reliability, re-measurement logic, and artifact adjudication depends on the distinction — an RN's manual BP after a questionable cuff cycle is not the same epistemic event as the monitor's next automatic cycle, even when both carry the same number.

**(b) Stream samples are not events.** Samples in `vitals.jsonl` are addressable by `(encounter_id, metric, window)` via `vitals://` URIs, not by individual event_ids. Scale (order-of-10⁴ SpO₂ samples per shift on continuous telemetry) makes per-sample event ids untenable — they would bloat `events.ndjson`, make evidence chains unreadable, and force tens of thousands of validator referential-integrity checks per shift. Per-sample provenance (`source`, `quality`, `artifact`) still lives on each row. Whether stream samples gain *deterministic* sample-keys (for correction-target addressability without full event-ization) is §16 Q1.

**(c) Per-sample `context` is transient; `context_segment` is canonical for stable settings.** Seed `patient_001` stores `context: {o2_device, o2_flow_lpm}` inline on every SpO₂ sample. Post-ADR-005, the durable representation is a single `observation.context_segment` with `effective_period` spanning the device epoch, superseded on device change. Per-sample `context` remains read-convenience but is not the source of truth — the active segment as of `asOf` answers "what was the O₂ device during this window."

**(d) The alarm and artifact layers are mostly derived, with narrow exceptions.** Alarm state is computable per frame from latest sample + active monitoring_plan thresholds; persistent emission of alert events would defeat the "vitals are not events" discipline. Whether *any* alert events are canonical (and whether the same logic applies to invalid-monitor-readings as `device_artifact` events, and whether `action.alarm_pause` survives as a canonical silence-window event) is §16 Q5. Until resolved, alarm state is exposed via `openLoops(kind: vital_alert)` derived state; `action.alarm_pause` is carried as a **provisional** proposal motivated by NPSG.06.01.01 audit requirements but not finalized.

**(e) Assessments cite vitals windows, not individual samples.** Per invariant 5 + ADR 010, `{kind: "vitals_window", ref: "vitals://…", role: "primary", selection: {aggregation: "mean"}}` is the canonical citation shape. An agent that cites single samples under-specifies its reasoning — the value of a vital is always its trajectory, and the trajectory is a window.

## 3. Regulatory / professional floor

1. **[regulatory] CMS 42 CFR 482.24(c)(1) and 42 CFR 482.24(c)(4)(vi)** — hospital medical record entries must be dated, timed, authenticated; the record must include vital signs and other information necessary to monitor the patient's condition. Anchors `recorded_at` separation from `sampled_at` (§7 row 2; §16 Q1).
2. **[regulatory] CMS 42 CFR 482.23(b)(3)–(4)** — RN supervises and evaluates nursing care; nursing staff must keep a care plan current with patient goals and care needs. Anchors `intent.monitoring_plan` as the substrate's representation of the cadence-and-threshold plan.
3. **[regulatory] The Joint Commission PC.02.01.01 EP 1** + **RC.02.01.01** — reassessment based on needs/diagnoses/response; medical-record content. ICU cadence is condition-driven; no numeric minimum.
4. **[regulatory] TJC NPSG.06.01.01 (Alarm Safety)** — organization-defined management of clinically relevant alarms, documented response, alarm-fatigue mitigation. Motivates the provisional `action.alarm_pause` shape (§14) and the OL-VITAL-03 derived loop semantics; final alarm-event architecture is §16 Q5.
5. **[professional] HL7 FHIR R5 Vital Signs Profile + LOINC Vital Signs Panel 85353-1** — interoperable representation; per-metric LOINC codes (HR 8867-4, SpO₂ 2708-6, MAP 8478-0, RR 9279-1, temp 8310-5, etc.). `data.name` aligns to a canonical enum carrying LOINC mappings for Phase B adapter work without per-event duplication.

`[phase-b-regulatory]` — exact hospital-specific response windows, escalation thresholds, observation-frequency tables, and whether a local early-warning score (NEWS2 / MEWS / qSOFA) is mandated belong out of Phase A. pi-chart preserves the observations and the monitoring plan; local policy renders thresholds and alerts. AACN cardiac-monitoring practice guidance (2017) is informative but not regulatory-floor.

## 4. Clinical function

Vitals are consumed at admission/triage, routine rounds, medication administration checks, shift handoff, rapid-response triggers, and post-intervention reassessment. Four cadences drive distinct decisions:

- **Continuous surveillance (seconds).** Monitor samples HR, SpO₂, RR (impedance or capnography-derived), art-line pressure, etCO₂, rhythm at device-native rates. Threshold crossings drive bedside RN acknowledgment, escalation on persistence, and (per §16 Q5 resolution) potentially an alert event.
- **Periodic manual (hourly to q4h).** MICU default is manual q1h `[verify-with-nurse — scaffold; project owner to finalize seed monitoring-plan default]`; step-down typically q4h. Manual entry verifies the monitor (cuff BP vs art-line MAP; manual RR count vs impedance-derived RR, notoriously unreliable in awake patients).
- **Event-driven (minutes).** Post-medication (drug-specific windows: hydralazine q15min × 4, post-opioid RR + sedation); pre- and immediately post-procedure; post-vent-change ABG + vitals q30min; during code (q2min per ACLS); post-unit-transfer (within 15 min).
- **Handoff aggregation (per shift).** Shift change reads the 12 h trend, not the current sample. Answered by `trend(metric, from: T-12h, to: T)`.

Per-consumer specifics. **Bedside RN**: continuous glance, manual entry at cadence, post-intervention rechecks; densest author. **Intensivist / APP**: reads `trend()` on rounds; defines resuscitation thresholds (sepsis MAP ≥ 65, mPaw targets); authors `intent.monitoring_plan`. **RT**: SpO₂, etCO₂, RR before vent changes; authors device-reading intervals on setting changes. **Pharmacist**: HR + BP before pressors; QTc + rhythm before QT-prolonging drugs; RR + sedation before opioid/benzodiazepine stacking. **pi-agent**: reads `trend()` + `currentState(axis:"vitals")` + `readActiveConstraints()` before authoring any assessment that cites physiologic state. Agent does **not** author `observation.vital_sign` directly except as `agent_bedside_observation` (rare in Phase A scope).

Handoff trigger: *"Since the last handoff, what changed physiologically, what was done, and is there any required monitoring or escalation still open?"* — answered by `openLoops(kind: vital_*)` + `trend(metric)`.

## 5. Who documents

Primary: **continuous bedside monitor** at device-native rates, writing via `source.kind: monitor_extension` through the pi-sim → pi-chart ingest translator. The translator contract is ROADMAP Seam 1 (still open at v0.2).

Secondary: **bedside RN** authoring manual vitals with `source.kind: nurse_charted` — often the same metric as the monitor, entered because the monitor value was implausible (motion, cuff slip, probe off) or because organizational policy requires manual q1h regardless of continuous monitoring.

Other authors:
- **POC devices** (standalone cuff, handheld pulse-ox, iStat, core-temp probe) with `source.kind: poc_device` — typical in transport, MRI suite, pre-admission.
- **Ventilator / RT** — `observation.device_reading` events with `effective_period` for stable settings (ADR 005 allow-list).
- **Importer** — historical vitals via `synthea_import` / `mimic_iv_import`; rebased timestamps, preserved original times per invariant 9.
- **Patient / surrogate** — self-reported baseline only (home BP log, home SpO₂ on chronic O₂); folded into A0a baseline, never a continuous stream.
- **pi-agent** — does **not** author `observation.vital_sign` directly. Agent authors assessments citing vitals via `vitals://`, not new vitals. Exception: `agent_bedside_observation` for an agent physically performing a measurement; rare.

Owner of record: **bedside RN** for the manual stream and reconciliation records; **biomedical / monitor tech** for device-attributed samples (clinical interpretation responsibility still sits with the bedside RN and treating clinician); **attending of record** for the `intent.monitoring_plan` under which the stream is generated.

Split ownership is load-bearing. A monitor artifact (leaded-off ECG tachycardia spike, `quality: questionable`) is a `source: monitor_extension` row; the RN's subsequent manual HR count is a `source: nurse_charted` row. Two events remain visible; neither overwrites the other; the later assessment annotates each with ADR 010 roles.

## 6. When / how often

Frequency class: **continuous (stream) + periodic (manual cadence) + event-driven (post-intervention, per-protocol) + interval-shaped (ADR 005 context segments, device settings, monitoring plans).**

- **Regulatory floor** — CMS §482.23(c)(2) and TJC PC.02.01.01 define "reassess" without a numeric cadence; floor is policy-declared, not regulation-declared.
- **Practice norm (MICU)** — continuous HR/SpO₂/RR/rhythm; NIBP q15min cycle or art-line continuous; manual full set q1h `[verify-with-nurse]`; temperature q1h for septic patients, q4h otherwise; post-pressor-titration MAP q5–15min until stable.
- **Event-driven** — post-medication (drug-specific windows); post-vent-change (q30min ABG + vitals); pre- / post-procedure; code (q2min); post-unit-transfer (within 15 min).

Divergence: regulation establishes record completeness/accountability; the interval belongs in `intent.monitoring_plan`, not as a global schema rule. The substrate's job is not to enforce a cadence — it is to make the **declared** cadence auditable. Cadence is declared in `intent.monitoring_plan` events whose `effective_period` + `data.required_cadence` + `data.alert_policy` specify the team plan; missing or stale vitals against that plan produce `openLoop` entries (OL-VITAL-02).

A re-read that confirms unchanged state produces no new event. A new `observation.vital_sign` event fires on (i) scheduled cadence, (ii) event-driven recheck, (iii) clinical-deterioration recheck, or (iv) monitor-value refutation. Stream rows in `vitals.jsonl` are produced by the ingest translator at stream-native rates, independent of event cadence.

## 7. Candidate data elements

Aim: 16 included rows across three event shapes plus a derived-only entry.

### Streamed sample (`vitals.jsonl` row; schema `schemas/vitals.schema.json`)

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---:|---|---|---|---|
| 1 | `sampled_at` | [clinical][regulatory] | ✓ | ISO datetime | `trend()` time-axis broken; `vitals://` window resolution fails; alarm-age calculation fails | pi-sim sim-clock, device RTC, wall clock | high |
| 2 | `recorded_at` | [regulatory] | ✓ — **schema gap; add via §16 Q1** | ISO datetime | Cannot audit delayed entry vs physiologic truth-time; CMS §482.24(c)(1) authentication-timing requirement unmet; back-charting indistinguishable from real-time entry | ingest translator wall-clock; device | high |
| 3 | `subject` + `encounter_id` | [regulatory][clinical] | ✓ | string + string | Invariant 6 (patient isolation) cannot be enforced; `vitals://<encounter>/…` scoping fails | substrate envelope; ingest translator sets them | high |
| 4 | `name` | [clinical][agent] | ✓ | enum drawn from canonical metric registry. Core physiologic stream: `heart_rate, spo2, bp_systolic, bp_diastolic, map, respiratory_rate, temp_c, etco2_mmHg, cardiac_output_lpm, stroke_volume_ml, lactate_mmol_l, ph, pao2_mmHg, paco2_mmHg, hgb_g_dl, …` (subject to §16 Q2 for ABG/lactate). **Cross-artifact consumed metrics** — `level_of_consciousness` (authored in A8 neuro assessment; A3 consumes for scoring), `urine_ml_hr` (authored in A5 I&O; A3 consumes for shock/perfusion trending). A3 does not author the cross-artifact metrics; it reads them via `trend()` when a cited window needs them. | `trend()` and `currentState(axis:"vitals")` cannot key samples; `vitals://` URI resolution fails; LOC / UOP absent from the registry breaks track-and-trigger scoring that cites them cross-artifact | pi-sim, MIMIC `d_items`, Synthea, device, nurse_charted; LOC from A8, UOP from A5 | high |
| 5 | `value` | [clinical] | ✓ | number ∣ string ∣ boolean (latter for rhythm labels, ACVPU codes, categorical reads) | Core measurement absent; every downstream view empty | pi-sim, device, human | high |
| 6 | `unit` | [clinical][regulatory] | ✓ | UCUM string | Unit conflation → critical errors (temp C vs F, SpO₂ % vs fraction); FHIR alignment broken | pi-sim declared per metric, device interface, human | high |
| 7 | `source` (`{kind, ref}`) | [regulatory][agent] | ✓ | `kind ∈ {monitor_extension, nurse_charted, poc_device, patient_statement, synthea_import, mimic_iv_import}`; `ref` carries device id when monitor/POC | Cannot reconcile monitor vs manual vs POC (§5); ADR 006 taxonomy violated; cannot audit bad-device pattern | substrate-mandated | high |
| 8 | `quality` (`{state, flags?}`) | [clinical][agent] | ✓ — **shape change to `{state, flags}`; see §16 Q5** | `{state: valid \| questionable \| invalid, flags?: string[]}` | `currentState` drops invalid; trend and evidence decisions about questionable cannot be made; alarm-suppression of artifacts impossible; cannot explain *why* a sample was excluded | device-reported (leaded-off, probe-off, motion), nurse-reviewed | high |
| 9 | `context` (object) | [clinical] | ✓ | `{o2_device?, o2_flow_lpm?, fio2_fraction?, position?, activity?, measurement_site?}` — read-convenience; canonical for stable settings is `observation.context_segment` (#13) | Cannot interpret SpO₂ without O₂ device; BP without position; temp without site (oral / rectal / core) | pi-sim carries o2_device; nurse_charted primary for others | high |

### Single-point `observation.vital_sign` event (`events.ndjson`)

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---:|---|---|---|---|
| 10 | `data.name` (same enum as stream) | [clinical] | ✓ | enum | `trend()` joins across stream + event fail; assessments citing this event cannot correlate with the stream | human, agent_bedside_observation (rare) | high |
| 11 | `data.value` + `data.unit` + `data.context` | [clinical] | ✓ | — | See rows 5, 6, 9 | — | high |
| 12 | `data.measurement_method` (+ `data.measurement_site` when relevant) | [clinical][agent] | ✓ | enum `{auscultation, palpation, oscillometric, invasive_line, impedance, pulse_ox, capnography, thermometer_oral, thermometer_rectal, thermometer_core, tympanic, temporal_artery, manual_count_60s, …}` | Cannot audit measurement plausibility (manual RR vs impedance RR); cannot compare methods on reconciliation; cannot detect method-specific artifact (oral temp after cold drink); cannot reconcile monitor cuff vs manual cuff vs art-line | human, device-declared | med |

### Context-segment event (ADR 005 interval; `events.ndjson`)

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---:|---|---|---|---|
| 13 | `observation.context_segment.data.segment_type` | [clinical] | ✓ | enum `{o2_delivery, position, activity, isolation_context, npo_status, restraint_interval, coverage_window}` | Cannot represent "NC 2L 08:00–09:30"; per-sample `context` becomes de-facto authoritative, which it must not be | nurse_charted primary; RT for vent; derived on auto-detected device change | high |
| 14 | `observation.context_segment.data.payload` (type-specific) | [clinical] | ✓ | object; shape per `segment_type` (e.g., `{o2_device, o2_flow_lpm, fio2_fraction}`) | Segment content not queryable; ADR 005 `effective_period` becomes a calendar without content | nurse_charted, RT, auto-extraction | high |

### Derived (not a stored field)

| # | Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---|---:|---|---|---|---|
| 15 | `early_warning_score` (NEWS2 / MEWS / qSOFA) | [clinical] | derived live; **stored only when reviewed** as `assessment.subtype = risk_score` carrying algorithm + version + window — see §16 Q4 | number + algorithm version + parameter snapshot | Storing every computed score creates stale derived truth that diverges from underlying samples; never storing reviewed scores weakens audit for escalations | derived from samples + scoring rule | high |

**Considered and excluded as separate fields:** per-event `loinc_code` (derivable from `name` via canonical map; no per-event storage), per-sample `reference_range` (vitals are context-dependent; patient-specific thresholds live on `intent.monitoring_plan`, not per-sample — contrast A1 where reference range is per-analyte regulatory-required), per-sample `priority_flag` (alarm state is derived, see §16 Q5), individual metric-name rows treated as schema fields (heart_rate / spo2 / map / etc. are *values* of the canonical `name` enum; promoting them to per-row schema entries conflates registry with schema).

## 8. Excluded cruft — with rationale

| Field | Why it exists in current EHRs | Why pi-chart excludes |
|---|---|---|
| **Per-row patient banner (MRN, DOB, bed, room)** | Flat-file export; defensive re-matching; paper-form inheritance | Invariant 6 carries patient scope via directory; per-row repetition is noise and a transcription-error vector |
| **Pain score as "fifth vital sign" peer in the vitals row** | "Fifth vital sign" EHR convention from JCAHO 2001 | Pain is patient-reported reassessment tied to A4 (post-medication response), A7 (nursing note narrative), A8 (head-to-toe assessment); not core physiologic monitor stream |
| **Copy-forward "WDL" / "WNL" checkbox** | Speed and defensive documentation | Hides actual values, destroys trend utility, creates known liability pattern (falsified normals masking deterioration) |
| **Device serial / monitor firmware embedded per row** | Biomedical QA, recall tracking | Belongs in `source.ref` when material; not a clinical field |
| **Flowsheet column color / red-yellow-green band** | UI triage and rapid scanning | Rendered from threshold + value + alarm-state at query time; not canonical |
| **Unit-specific row grouping ("Adult Vitals," "ICU Quick View")** | EHR navigation | View composition concern; rendered |
| **Free-text "comments" per row** | Catch-all when form lacks structure | Pressure-valve for cruft. If clinically meaningful, becomes an `observation.exam_finding` / `assessment.trend`; if workflow chatter, belongs nowhere in the chart |
| **Generic "patient tolerated vitals"** | Habit / defensive documentation | Only include actual patient response if clinically meaningful; default chatter is noise |
| **Device alarm count as a vitals field** | Monitor-management workflows | Alarm activity is operational telemetry; if a specific alarm is clinically acted upon, the action and its evidence are canonical (§16 Q5), not a count |
| **Witness / "reviewed by" signature per shift, per metric** | Paper-era dual-sign and shift-sign-off workflows | Witness attestation lives on `action` events; shift review is `action.result_review` over a vitals window (parallel to A2), not a per-sample attestation |

## 9. Canonical / derived / rendered

- **Canonical** (claim stream):
  - `vitals.jsonl` rows — streamed samples (continuous monitor + POC at stream rate), with quality state/flags.
  - `observation.vital_sign` events in `events.ndjson` — one-off manual entries, event-driven rechecks, agent bedside observations.
  - `observation.context_segment` events — ADR 005 intervals for O₂ device, position, activity, isolation.
  - `observation.device_reading` events — ADR 005 intervals for vent settings, drip rates.
  - `intent.monitoring_plan` events — declared cadence, thresholds, alert policy; allow-listed for intervals per ADR 005.
  - `assessment.subtype = trend` events — interpretations citing vitals windows.
  - `assessment.subtype = risk_score` events — clinically reviewed early-warning-score states (NEWS2 / MEWS / qSOFA), with algorithm + version + parameter snapshot.
  - `action.alarm_pause` events — silence windows, NPSG.06.01.01 audit requirement. **Provisional — pending §16 Q5 alarm-event architecture.**
  - `artifact_ref(subtype: waveform)` — native ECG / art-line / pleth captures when archived.

- **Derived** (view primitives):
  - "Current vitals" → `currentState(axis:"vitals")` (`src/views/currentState.ts:collectLatestVitals`, which already drops `quality.state = invalid`).
  - "Trend" → `trend(metric, from, to, source?, encounterId?)` (`src/views/trend.ts`, which already unions `vitals.jsonl` and `observation.name === metric`).
  - "Active context" → derivable from `observation.context_segment` covering `asOf`; whether this gets a dedicated `currentState(axis:"context")` is folded into §16 Q3.
  - "Alarm inbox" / staleness loops → `openLoops(kind: vital_alert | vital_cadence_miss)` driven by monitoring_plan + latest sample age + threshold-vs-value computation.
  - "Live early-warning score" → computed from samples + scoring rule at query time; not stored unless clinically reviewed.
  - "Flowsheet grid" → `timeline(types: ["observation"], subtypes: ["vital_sign"])` plus stream samples — an arrangement of canonical data, not a distinct primitive.

- **Rendered** (UI-only):
  - Trend arrows, color-coded severity cells, alarm-banner flashing, waveform sweep animation, NEWS2 chart bands, sparkline displays, bed-header labels, font sizing for distance-readability, unit/role-specific tabs. UI concerns; none belong in the substrate.

## 10. Provenance and lifecycle

### Provenance
- **Sources of truth**: device-originated (continuous monitor, POC) + clinician-authored (manual) + importer (historical) + derived (alert state, EWS scores) + agent (bedside observation; rare). Intentionally multi-source.
- **`source.kind` proposals**: `monitor_extension`, `nurse_charted`, `poc_device`, `agent_bedside_observation`, `manual_scenario`, `synthea_import`, `mimic_iv_import` — all already canonical in DESIGN §1.1 / ADR 006. No new kinds proposed.

### Lifecycle
- **Created by**: device sample emission (stream) ∣ RN / RT / agent authoring (event) ∣ importer ingesting historical chartevents (MIMIC) or Synthea Observation resources.
- **Updated by**: n/a — vitals are append-only. Subsequent samples extend the stream; they do not update prior samples. A manual correction is a new event, not an update.
- **Fulfilled by**: per ADR 003, observations do not carry `fulfills`. Scheduled-vital fulfillment runs through an intermediate `action.measurement` event with the observation as `supports` — for one-shot ordered measurements. Continuous-stream cadences may satisfy `intent.monitoring_plan` directly without per-window action events; the substrate-level pattern is §16 Q1.
- **Cancelled / discontinued by**: `intent.monitoring_plan` supersession or explicit `data.status_detail = cancelled` per ADR 002. Samples already written remain.
- **Superseded / corrected by**: single-point `observation.vital_sign` events supersede / correct per standard envelope rules. Stream rows in `vitals.jsonl` have no event_id and **cannot** be `supersedes` targets today. The leading proposed solution is deterministic `sample_key` plus `observation.subtype = vital_correction` events targeting the key (§16 Q1).
- **Stale when**: latest valid sample age > `intent.monitoring_plan.data.required_cadence × staleness_multiplier` `[verify-with-nurse — scaffold: default 1.5×; project owner to finalize]`, or when clinical condition changes and the prior cadence is no longer safe.
- **Closes the loop when**: a valid sample arrives inside the required window AND abnormal values have either resolved to safe band or been addressed by an `assessment` / `action` / `communication` event citing the alarm window.

### Contradictions and reconciliation
- **Cuff BP vs arterial-line BP**: preserve both; warn if both valid but materially divergent; prefer source-specific trend rather than silent overwrite.
- **Pulse-ox HR vs ECG HR** (e.g., AF undercount): preserve both; warn on divergence; source context determines reliability.
- **SpO₂ low vs ABG PaO₂ acceptable** (or vice versa): preserve both; require clinical review if discrepancy affects oxygenation assessment. Cross-cutting with §16 Q2.
- **Manual RR vs impedance-derived RR**: preserve both; warn if a deterioration assessment depends on suspect automated RR.
- **Temperature route differences**: preserve both if clinically meaningful; route/site lives in `context`.
- **Invalid monitor artifact**: retain in `vitals.jsonl` with `quality.state: invalid` for traceable ingest; exclude from trend / currentState. Whether a parallel `observation.device_artifact` event is also written when the artifact materially affected workflow is §16 Q5.

## 11. Missingness / staleness

- **What missing data matters clinically?**
  - No HR / SpO₂ / RR in a patient on continuous telemetry for > cadence × 1.5 (OL-VITAL-01) — probe / lead disconnect or unreported deterioration.
  - No manual q1h vital set when `intent.monitoring_plan` declares it (OL-VITAL-02).
  - No post-pressor-titration MAP within the plan's configured window.
  - No temperature in a septic-shock patient > 4 h.
  - No UOP in shock resuscitation > 1 h (UOP authored in A5; A3 consumes the trend; the loop may fire from either artifact depending on which primitive is addressing the perfusion problem).
  - No oxygen context with a SpO₂ sample (V-VITAL-03 footnote; §16 Q3).
  - No level of consciousness in a patient at risk of sepsis, hypoxia, stroke, or sedation deterioration.
- **What missing data is merely unknown?**
  - Gaps between shifts on a stable step-down patient whose plan allows q4h — expected, not a loop.
  - Vitals during transport — handled by device handoff; flagged only if transport exceeds policy duration.
  - Measurement method/site for imported historical samples if value/source are otherwise usable; continuous monitor device id for manual scenario fixtures.
- **When does this artifact become stale?**
  - Per-metric, per-monitoring-plan. No single global staleness number.
  - Unstable MICU: SpO₂ stale at > 2-min continuous gap `[verify-with-nurse]`.
  - Stable: defers to plan cadence.
- **Should staleness create an `openLoop`?** Yes — three kinds (hybrid model per §16 Q1 resolution of staleness mechanic):
  - **OL-VITAL-01** (stream gap) — continuous-monitor gap exceeds plan-declared tolerance; sample-derived, no fulfillment action required.
  - **OL-VITAL-02** (missed cadence) — declared manual or scheduled recheck did not produce a sample / event within the plan window; for one-shot ordered measurements, may also fire as missing `action.measurement` fulfilling the intent.
  - **OL-VITAL-03** (sustained unresolved alarm state) — derived alarm state persisting past policy threshold without a corrective `assessment` / `action` / `communication` (NPSG.06.01.01 motivation). Each loop cites the declaring `intent.monitoring_plan` as the addressing target.

Concrete example: `intent.monitoring_plan` requires q15min SpO₂/RR after oxygen escalation. Latest valid SpO₂ is 35 minutes old. `openLoops()` returns `OL-VITAL-02` overdue until a new valid sample arrives or the plan is discontinued.

## 12. Agent read-before-write context

Before authoring an `assessment` that cites vitals, or an `intent` that depends on vital state, the agent reads:

- `currentState({ scope, axis: "vitals", asOf })` — latest valid per metric.
- `trend({ scope, metric, from: T-<clinically-relevant-window>, to: T })` per cited metric — directionality and rate-of-change. For respiratory deterioration assessment, typical window is 1–2 h on SpO₂ + RR + HR + (if available) etCO₂.
- Active `observation.context_segment` events as of `asOf` — interpretive context (O₂ device, position, vent settings) without which a raw value is ambiguous.
- `currentState({ scope, axis: "constraints" })` / `readActiveConstraints()` — confirm no constraint conflicts with the escalation plan the assessment is about to support (oxygen targets, code status, advance directives).
- `currentState({ scope, axis: "problems" })` — active respiratory / cardiovascular / sepsis / neuro problems determine cadence and threshold relevance; these are the targets a new intent will `addresses`.
- `currentState({ scope, axis: "intents" })` filtered to `subtype: monitoring_plan` — the cadence and thresholds under which the sample window was produced.
- `timeline({ types: ["action", "intent", "assessment", "communication"], from: T-4h })` — recent meds, fluids, oxygen changes, notifications, prior deterioration assessments.
- `openLoops({ scope, asOf })` filtered to `kind: vital_*` — confirm the assessment is not silently re-citing a window with a standing staleness or alarm loop the assessment should instead address.
- `evidenceChain({ scope, eventId })` — before modifying or escalating from a prior trend assessment.

Evidence citation uses `vitals://<encounter>?name=<metric>&from=<iso>&to=<iso>` URIs per ADR 010, preferably in structured `EvidenceRef` form with `role` and `selection` populated. Bare URI strings remain valid on the wire but do not satisfy V-EVIDENCE-01's object-form requirement for agent-inferred assessments.

## 13. Related artifacts

- **A0a (demographics, encounter & baseline)** — `baseline_respiratory_support`, `baseline_spo2`, `baseline_weight_kg` establish the reference frame; ARDSNet PBW depends on A0a height.
- **A0b (active constraints)** — code status gates escalation plans written against A3 deterioration; allergies gate pharmacologic response options; oxygen targets gate SpO₂ interpretation.
- **A0c (problem list)** — active problems cite A3 trend windows via `links.supports`; A3 is the most common evidence source for problem supersession (staging transitions).
- **A1 (labs)** — shared metrics (arterial pH, PaO₂, PaCO₂, lactate, Hgb) appear in both; A1 canonical vs A3 frame-derived reconciliation is §16 Q2.
- **A2 (results review)** — `action.result_review` may batch-acknowledge a vitals window at shift change.
- **A4 (MAR) — to be produced** — every administration is followed by a vitals-based response window; MAR's fulfillment lifecycle reads `trend()`. Vitals-before/after meds is the densest read pattern.
- **A4b (medication reconciliation) — to be produced** — home beta-blockers / antihypertensives / sedatives explain or constrain vital interpretation (a HR of 55 means something different on chronic carvedilol).
- **A5 (I&O + LDAs) — to be produced** — **canonical author of `urine_ml_hr`**; A3 consumes the UOP trend via `trend()` when shock/perfusion reasoning needs it, but does not author it. Art-line / central-line placement periods (LDA) gate which invasive-pressure metrics are available.
- **A6 (provider notes) — to be produced** — plan and interpretation of vital trajectory, cited as `links.supports` to `narrative()`-visible communications.
- **A7 (nursing notes) — to be produced** — narrative escalation and handoff around abnormal vitals.
- **A8 (ICU nursing assessment) — to be produced** — **canonical author of `level_of_consciousness`** (ACVPU / GCS) as part of the neuro assessment; A3 consumes LOC for track-and-trigger scoring (NEWS2) but does not author it as a dense vital stream. Work of breathing, mental status, perfusion, and head-to-toe context cite vitals windows as their densest evidence source; A3's citation pattern is shared.
- **A9a (order primitive) — to be produced** — `intent.monitoring_plan` is an order-family subtype; A9a's shape must accommodate A3's cadence + threshold + alert-policy payload.
- **A9b (orderset invocation) — to be produced** — sepsis / respiratory-failure / rapid-response bundles create monitoring_plan child intents.

## 14. Proposed pi-chart slot shape

### Event type + subtype

**Existing — preferred path (no new event type):**
- Stream sample: `vitals.jsonl` row (schema `schemas/vitals.schema.json`; `recorded_at` and structured `quality` are additive changes per §16 Q1, Q5).
- Single-point manual: `observation.vital_sign` (CLAIM-TYPES §1).
- Stable setting: `observation.context_segment` (ADR 005 allow-listed).
- Device setting: `observation.device_reading` (ADR 005 allow-listed).
- Declared cadence: `intent.monitoring_plan` (CLAIM-TYPES §3; ADR 005 allow-listed).
- Trend interpretation: `assessment.trend` (CLAIM-TYPES §2).
- Reviewed score: `assessment.risk_score` (CLAIM-TYPES §2).
- Scheduled-measurement fulfillment: `action.measurement` (per ADR 003 acquisition-action discipline).

**Provisional subtype — `action.alarm_pause`** — interval-shaped, closing via supersession. **Schema impact: new subtype (provisional).** NPSG.06.01.01's specific audit requirement for alarm-silence windows motivates it, and no existing subtype carries this semantic. However, because the broader alarm-event architecture remains unresolved (§16 Q5), this proposal is marked **provisional** — a pause only makes sense relative to some alarm-layer representation, and that representation's shape (canonical events, derived-only state, or hybrid) is still open. Confirmation of `action.alarm_pause` depends on Q5 resolution; per-sample silence flags were already ruled cruft in §8 and remain excluded regardless.

**Pending §16 resolutions (no proposal until resolved):**
- `observation.alert` — Q5 may resolve to derived-only (no canonical event), state-transition events, or a sustained-only event.
- `observation.device_artifact` — Q5 may resolve to inline `quality` only, or a parallel artifact event.
- `observation.vital_correction` — Q1 may resolve to deterministic `sample_key` plus a correction event class, or to summarize-window promotion.

### Payload shapes

Stream sample (`vitals.jsonl`; `recorded_at` + structured `quality` are additive proposals):

```jsonc
{
  "sampled_at":  "2026-04-18T08:40:00-05:00",
  "recorded_at": "2026-04-18T08:40:03-05:00",     // additive per §16 Q1
  "subject":     "patient_001",
  "encounter_id": "enc_001",
  "source": {
    "kind": "monitor_extension",
    "ref":  "pi-sim-monitor",
    "device_id": "sim_monitor_001"                 // optional, in source.ref by convention
  },
  "name":  "spo2",
  "value": 89,
  "unit":  "%",
  "context": { "o2_device": "nasal_cannula", "o2_flow_lpm": 2, "activity": "resting" },
  "quality": { "state": "valid", "flags": [] }    // shape change per §16 Q5
}
```

Single-point manual event (`events.ndjson`):

```jsonc
{
  "id": "evt_20260418T0840_01",
  "type": "observation",
  "subtype": "vital_sign",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T08:40:00-05:00",
  "recorded_at":  "2026-04-18T08:40:10-05:00",
  "author": { "id": "rn_shane", "role": "rn" },
  "source": { "kind": "nurse_charted", "ref": "bedside_manual" },
  "certainty": "observed",
  "status": "final",
  "data": {
    "name":  "respiratory_rate",                   // canonical metric name; method lives below
    "value": 28,
    "unit":  "/min",
    "context": { "activity": "resting" },
    "measurement_method": "manual_count_60s"
  },
  "links": { "supports": [], "supersedes": [] }
}
```

Context segment event (`events.ndjson`, ADR 005 interval; open until O₂ device change):

```jsonc
{
  "id": "evt_20260418T0800_ctx_o2",
  "type": "observation",
  "subtype": "context_segment",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_period": { "start": "2026-04-18T08:00:00-05:00" },
  "recorded_at": "2026-04-18T08:00:15-05:00",
  "author": { "id": "rn_shane", "role": "rn" },
  "source": { "kind": "nurse_charted" },
  "certainty": "observed",
  "status": "active",
  "data": {
    "segment_type": "o2_delivery",
    "payload": { "o2_device": "nasal_cannula", "o2_flow_lpm": 2, "fio2_fraction": 0.28 }
  },
  "links": { "supports": [], "supersedes": [] }
}
```

Trend assessment citing vitals windows (per ADR 010):

```jsonc
{
  "type": "assessment",
  "subtype": "trend",
  "data": {
    "summary": "Worsening respiratory status: SpO2 94→89 on stable 2 L NC with RR 18→24 over 40 minutes",
    "severity": "moderate"
  },
  "links": {
    "supports": [
      { "kind": "vitals_window", "ref": "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00", "role": "primary" },
      { "kind": "vitals_window", "ref": "vitals://enc_001?name=respiratory_rate&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00", "role": "primary" },
      { "kind": "vitals_window", "ref": "vitals://enc_001?name=heart_rate&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00", "role": "context" }
    ]
  }
}
```

### Link conventions
- `links.supports` — trend / risk_score assessments cite `vitals_window` evidence; actions / notifications cite the vitals window that triggered them; single-point events may cite a prior sample (artifact re-measurement) or the event that triggered the recheck (a medication `action`).
- `links.supersedes` — single-point events when a manual recheck refutes an earlier manual entry (same author, same metric, narrow window).
- `links.corrects` — narrow case: entered-in-error manual value.
- `links.fulfills` — per ADR 003, observations do not carry `fulfills`. Scheduled-vital fulfillment runs through `action.measurement`; the observation `supports` that action. Whether continuous streams need explicit fulfillment is §16 Q1.
- `links.addresses` — n/a at the observation layer (observations support assessments which address problems); applies to `intent.monitoring_plan` addressing active problems.
- `links.contradicts` (ADR 009) — monitor-vs-manual structural disagreement when neither author retracts.
- `links.resolves` (ADR 009) — on a sample, `assessment`, or `action` that closes a derived alert loop or an unresolved trend assessment.

### Evidence addressability
- **`vitals://` URI** — canonical for windows over streamed or manually-entered samples.
- **Structured `EvidenceRef{kind: vitals_window, ref: "vitals://…", role?, basis?, selection?: {aggregation?, method?}}`** — object-form canonical per ADR 010; required for agent-inferred assessments per V-EVIDENCE-01.
- **Event id** — for single-point `observation.vital_sign`, `context_segment`, `device_reading`, `monitoring_plan`, `alarm_pause`, `assessment.trend` / `risk_score` events.
- **Sample key** — *proposed*, pending §16 Q1.

### Storage placement
- `vitals.jsonl` — streamed samples (scale; existing schema; ROADMAP Seam 1 ingest pipe).
- `events.ndjson` — all event-layer shapes above.
- `notes/*.md` — narrative explanation, handoff, SBAR, provider interpretation.
- `artifacts/` — native waveform captures via `artifact_ref`.

### Frequency class
`continuous` (stream) + `periodic` (manual cadence) + `event-driven` (recheck, context change, alarm_pause) + `interval-shaped` (context_segment, device_reading, monitoring_plan, alarm_pause).

### View consumers
`trend` (primary — this is the view's core use case) — `currentState(axis:"vitals")` — `evidenceChain` (assessments citing vitals windows) — `openLoops` (staleness, derived alert state, cadence misses) — `timeline` (flowsheet-grid rendering) — `narrative` (shift summaries cite windows).

### Schema confidence
- **High** — streamed sample shape, single-point `observation.vital_sign`, `context_segment` shape (ADR 005), `intent.monitoring_plan` and `assessment.trend` / `risk_score` (existing CLAIM-TYPES coverage).
- **Medium** — additive `recorded_at` + structured `quality` on stream rows (well-motivated; low design risk).
- **Low–Medium** — `action.alarm_pause` new subtype (NPSG.06.01.01 motivates; **marked provisional** pending §16 Q5).
- **Low** — anything in §14 "pending §16 resolutions."

### Schema impact
- **`new subtype` (provisional)** — `action.alarm_pause`, pending §16 Q5.
- **`new payload shape`** — `vitals.jsonl` additive `recorded_at` + structured `quality.{state, flags}`; `observation.context_segment.data.payload` per-`segment_type` shape.
- **`none`** — single-point `observation.vital_sign`, `intent.monitoring_plan`, `assessment.trend` / `risk_score` (existing CLAIM-TYPES already cover).

## 15. Validator and fixture implications

### Validator rules

- **V-VITAL-01** — Every `vitals.jsonl` row carries `sampled_at`, `recorded_at`, `encounter_id`, `name`, `value`, `unit`, `source.kind`, and `quality.state`; `sampled_at ≤ recorded_at` except for approved imported / rebased data (invariant 9). **Severity: error.** *Note: `recorded_at` and structured `quality` shape are additive schema changes pending §16 Q1, Q5.*
- **V-VITAL-02** — `vitals.jsonl.name` and `observation.vital_sign.data.name` must be drawn from a canonical metric registry (new file `schemas/vital-metrics.json`) to guarantee `trend()` joins across stream and event sources; values outside physiologic plausibility require `quality.state ∈ {questionable, invalid}` unless explicitly retained as a simulation edge case. **Severity: warn in v0.3; error in v0.4.**
- **V-VITAL-03** — `spo2` samples (stream or event) must carry oxygen-delivery context — either inline (`context.o2_device` / `room_air: true`) or resolvable from an active `observation.context_segment{segment_type: o2_delivery}` covering `sampled_at`. Missing oxygen context warns generally; errors when an active acute-respiratory problem is present in `currentState(axis:"problems")`. **Severity: warn → error conditional on §16 Q3.**
- **V-VITAL-04** — `assessment.subtype = trend` or `risk_score` events whose `links.supports` cite a `vitals://` window must resolve to at least one sample with `quality.state ∈ {valid, questionable}`; `invalid`-only windows fail evidence sufficiency (extension of invariant 5). **Severity: error.**
- **V-VITAL-05** — An `intent.monitoring_plan` with `data.required_cadence` must be fulfillable: at least one valid sample (stream or event) in each cadence window, OR an explicit `action.alarm_pause` / `monitoring_plan.status_detail: on_hold` within the window, OR (for one-shot ordered measurements) an `action.measurement` fulfilling the intent. **Surfaced as OL-VITAL-02 at the view layer during live operation — NOT a write-time or replay-time validator error by default.** A live chart must not become "invalid" simply because the wall clock advanced past a cadence boundary; cadence misses are a clinical finding, not a substrate integrity failure. Promoting to a validator error is permitted only in explicit `--replay-mode` audits where time is fixed and every declared cadence window can be deterministically evaluated. **Severity: openLoop in live mode; warn in replay-mode; error only under `--strict-replay` flag.**
- **V-VITAL-06** — `observation.vital_sign.data.context.o2_device` and stream-sample `context.o2_device` must be consistent with the active `observation.context_segment{segment_type: o2_delivery}` as of the sample's `sampled_at`. **Severity: warn** during the migration period in which per-sample context remains convention-authoritative.

### Minimal fixture

Six rows covering normal + edge cases:

1. **Stable ward snapshot** — HR / RR / BP / SpO₂ / temp / LOC with `context.o2_device: "room_air"` and `intent.monitoring_plan` cadence q4h. Demonstrates the canonical happy path.
2. **Pneumonia deterioration trend** — SpO₂ 94 → 89 on stable 2 L NC, RR 18 → 24, HR 88 → 108 over 40 minutes (matches seed `patient_001`); `assessment.trend` citing three `vitals_window` evidence refs per ADR 010.
3. **Stale monitoring plan** — `intent.monitoring_plan` requires q15min SpO₂/RR after escalation; latest sample is 35 minutes old; `openLoops()` returns OL-VITAL-02 overdue.
4. **Invalid artifact** — pulse-ox motion artifact with `quality.state: invalid`, `quality.flags: ["motion"]`; excluded from `currentState(axis:"vitals")` and trend; whether it also generates an `observation.device_artifact` event is §16 Q5.
5. **Conflicting-source case** — cuff BP 180/100 vs art-line MAP 72 in same minute; both preserved with `source.kind` distinct; later assessment annotates ADR 010 roles (`primary` on art-line, `counterevidence` on cuff) and may carry `links.contradicts` per ADR 009.
6. **Manual RN event supporting escalation** — `observation.vital_sign` with `source.kind: nurse_charted` carrying `data.measurement_method: "manual_count_60s"`; `assessment.trend` cites both stream window and this event; `action.notification` to provider with the trend assessment as `supports`.

## 16. Open schema questions

1. **Q1 — Stream-sample identity, correction, and fulfillment.** `vitals.jsonl` rows have no event id. Three coupled sub-problems lack a clean substrate expression: (a) addressing a single bad sample for correction, (b) refuting a monitor window with a manual recheck, (c) fulfilling an `intent.monitoring_plan` cadence with a stream window rather than an event-layer action. Leading proposal: deterministic `sample_key = hash(subject, encounter_id, name, sampled_at, source.kind, source.ref?)` plus an `observation.subtype = vital_correction` event class targeting the key. Alternatives include promoting the disputed window to an `observation.vital_sign` event with `data.summarizes_window`, or introducing a `links.refutes_window` / `links.fulfills_window` carrying a `vitals://` URI plus `basis`. → `OPEN-SCHEMA-QUESTIONS.md#a3-stream-sample-identity`

2. **Q2 — Shared metrics across A1 (labs) and A3 (vitals).** Arterial pH, PaO₂, PaCO₂, and lactate appear both as lab observations (A1, drawn ABG / VBG) and as vital-frame fields (A3, from Pulse). Options: (a) A1 canonical and A3 suppresses these fields from `vitals.jsonl` entirely except under an explicitly-labeled simulation/training profile (leading lean — protects the pi-sim boundary against leakage of simulator physiology into clinical evidence); (b) both first-class with `source.kind` distinguishing; (c) A3 derived-only with `links.supports` back to A1; (d) profile-routed at the ingest translator. → `OPEN-SCHEMA-QUESTIONS.md#a3-shared-metrics`

3. **Q3 — Oxygen-delivery context: requirement, source-of-truth, and `currentState` axis.** SpO₂ interpretation depends on room-air vs supplemental O₂, flow, FiO₂, device, and patient-specific target range. Three coupled sub-questions: (a) is inline `context.o2_device` mandatory on every SpO₂ sample, or derivable at query time from active `context_segment` events? (b) when sampled context and active `context_segment` (or active oxygen `intent`) disagree, which is canonical? (c) does the active context-segment set get a dedicated `currentState(axis: "context")` view, or fold into `axis: "all"`, or live as a separate `activeContext()` helper? Leading lean: Option (3) for inline-allowed-but-validated against active state, plus a new `axis: "context"` matching the existing dispatch pattern. → `OPEN-SCHEMA-QUESTIONS.md#a3-oxygen-context`

4. **Q4 — Early-warning score storage (NEWS2 / MEWS / qSOFA).** Scores are computable at query time from samples + scoring rule. Storing every computed score creates stale derived truth; never storing reviewed scores weakens audit for escalations driven by score thresholds. Options: (a) derived-only via view layer; never store score claims; (b) store only when a clinician/agent asserts or acts on a score as `assessment.subtype = risk_score` carrying algorithm + version + parameter snapshot; (c) store every computed score as event stream. Leading lean: Option (b). Affects the `assessment.risk_score` payload contract and OL-VITAL-* loop semantics for "missed score escalation." → `OPEN-SCHEMA-QUESTIONS.md#a3-early-warning-score`

5. **Q5 — Alarm and artifact event class.** Three coupled sub-problems share the same architectural shape: (a) is alarm state purely derived (computed per query from latest sample + active monitoring_plan thresholds) or do canonical `observation.alert` events fire on state transitions, on sustained crossing past policy window, or both? (b) when a monitor reading is `quality.state: invalid` and the artifact materially affected workflow (false alarm, false escalation), is the inline `quality.flags` enough or does a parallel `observation.subtype = device_artifact` event also fire? (c) does `action.alarm_pause` survive as a canonical new subtype, and what does it close or supersede? All three share the substrate-scale-vs-auditability trade-off; answers are coupled. Resolution shapes ADR 009 `resolves` usage, OL-VITAL-03 derivation, and finalizes the provisional `action.alarm_pause` status carried in §14. → `OPEN-SCHEMA-QUESTIONS.md#a3-alarm-and-artifact-events`

## 17. Sources

- CMS, **42 CFR § 482.24 — Condition of participation: Medical record services**, especially §482.24(c)(1) and §482.24(c)(4)(vi).
- CMS, **42 CFR § 482.23 — Condition of participation: Nursing services**, especially §482.23(b)(3)–(4) and §482.23(c)(2).
- The Joint Commission — **PC.02.01.01 (reassessment), RC.02.01.01 (record content), NPSG.06.01.01 (alarm safety)**, current edition.
- AACN, **Practice Alert: Ensuring Accurate Cardiac Monitoring** (2017; reviewed 2023).
- HL7 **FHIR R5 Observation resource, Vital Signs Profile**; **LOINC Vital Signs Panel 85353-1**.
- Royal College of Physicians, **National Early Warning Score (NEWS) 2: Standardising the assessment of acute-illness severity in the NHS** (2017) — referenced for §16 Q4 framing only; not a US regulatory anchor.
- Drew B.J. et al., "Insights into the Problem of Alarm Fatigue with Physiologic Monitor Devices," *PLoS One* 9:e110274 (2014) — alarm-event-emission discipline context.
- Ruppel H. et al., "Testing physiologic monitor alarm customization software to reduce alarm rates," *BMJ Quality & Safety* 27:956–963 (2018) — alarm-threshold individualization as monitoring-plan feature.
- Kitware **Pulse Physiology Engine** documentation, v4.3.1 — vital-sign emission surface used by pi-sim (`~/pi-rn/pi-sim/pulse/`, `vitals/README.md`).
- pi-chart internal: **DESIGN.md** §1.1 (source.kind registry), §4.3 (axis-specific currentState), §4.4 (trend view), §4.5 (`vitals://` URI + EvidenceRef); **CLAIM-TYPES.md** §1; **ADR 003** (fulfillment via intermediate action), **ADR 005** (interval primitive), **ADR 009** (contradicts/resolves), **ADR 010** (EvidenceRef roles); `schemas/vitals.schema.json`; `src/views/trend.ts`, `src/views/currentState.ts`.
