# Workstream A PRD / test-spec

**Project:** `pi-chart`
**Target artifact:** `pi-chart/specs/memory-proof-projection.md` or `pi-chart/decisions/017-memory-proof-projection.md`
**Recommended code surface:** `src/views/memoryProof.ts` + `src/views/memoryProof.test.ts`
**Fixture target:** extend current `patients/patient_001` rather than replacing it.

## 0. Decision answered

Build the next proof around the existing `patient_001` respiratory-decompensation seed, extending it into a six-surface clinical-memory fixture and adding one deterministic composite projection that proves:

> **chart once → project many** across vitals, bedside assessment, note, orders/interventions, labs/diagnostics, open loops, review, and handoff.

This matches the repo’s stated core thesis that the chart is canonical, current state is a query, derived summaries are disposable, and the clinical claim/event envelope is the ontology. The repo also already exposes the six pure view primitives that this projection should compose rather than replace. ([GitHub][1])

I would **not** switch to the Claude/Gemini sepsis or pulmonary-edema scenario as the primary fixture. Their outputs contain a few useful test ideas, especially deterministic fingerprints, simulator-opacity tests, and single-observation reuse, but they also drift into non-repo primitives like `ServiceRequest`, `DiagnosticReport`, `CarePlan`, and incorrect `source.kind` values. One pasted report explicitly says it could not fetch the repo and guessed values like `device`, `nurse_entry`, `provider_entry`, `lab`, and `system`, which do not match the current canonical source-kind vocabulary.  The current repo fixture is already a pneumonia / respiratory-decompensation story with vitals, patient report, agent bedside observation, trend assessment, escalation plan, and SBAR note; the missing work is to broaden it into the ADR 016 skeleton. ([GitHub][2])

---

# 1. Fixture story

## Clinical story

**Patient:** `patient_001`
**Existing setting:** inpatient pneumonia admission, left lower-lobe consolidation, on 2L nasal cannula, penicillin anaphylaxis documented. ([GitHub][3])
**Fixture window:** `2026-04-18T08:00:00-05:00` → `2026-04-18T11:30:00-05:00`
**Clinical thread:** worsening hypoxemia in community-acquired pneumonia, detected through monitor trend plus bedside respiratory assessment, leading to provider notification, oxygen escalation, ABG/CXR orders, result review, care-plan update, and shift handoff.

This is intentionally broad-but-shallow. It does not need full MAR, full CPOE, billing, scheduling, access control, or production EHR realism. ADR 016 says the skeleton is only valuable where it supplies observable clinical context for memory, documentation relief, and review projections; full production EHR scope was explicitly rejected. ([GitHub][4])

## Reuse target

The single canonical bedside observation should be:

```text
evt_20260418T0848_01
type: observation
subtype: exam_finding
source.kind: nurse_charted
author.role: rn
effective_at: 2026-04-18T08:48:00-05:00
recorded_at: 2026-04-18T08:49:00-05:00

data.name: focused_respiratory_assessment
data.value:
  - increased work of breathing compared with 08:20
  - mild accessory muscle use now present
  - coarse crackles at left lower base
  - productive cough
  - alert and oriented, anxious but answering appropriately
  - still on 2L nasal cannula at time of exam
```

This observation is the **one fact node** the proof should track. It should be reused through:

1. provider SBAR note,
2. problem assessment,
3. order/open-loop rationale,
4. result review,
5. care-plan update,
6. handoff projection.

The note and handoff may mention it in prose, but the canonical fact must remain the one observation event. The proof should fail if another event re-enters the same bedside assessment as a second canonical observation.

---

# 2. Exact clinical sequence

The current seed already gives the first seven clinical beats. Keep those, then append the extension.

|  # | Time        | Surface                | Canonical item                                                                     | Purpose                                                                              |
| -: | ----------- | ---------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
|  0 | 06:00–06:30 | baseline / encounter   | existing `patient.md`, `constraints.md`, `encounter_001.md`                        | Establish pneumonia admission, penicillin anaphylaxis, O2 requirement. ([GitHub][3]) |
|  1 | 08:00–08:40 | flowsheets / vitals    | existing `vitals.jsonl` rows                                                       | SpO2 94→89, HR 88→108, RR 18→24 on 2L NC. ([GitHub][5])                              |
|  2 | 08:15       | patient report         | existing `evt_20260418T0815_01`                                                    | Patient reports increased work of breathing. ([GitHub][2])                           |
|  3 | 08:20       | bedside observation    | existing `evt_20260418T0820_01`                                                    | Agent-observed mild increased WOB, no accessory muscle use. ([GitHub][2])            |
|  4 | 08:30       | assessment             | existing `evt_20260418T0830_01`                                                    | Agent-inferred worsening respiratory trend with vitals evidence. ([GitHub][2])       |
|  5 | 08:30       | care plan              | existing `evt_20260418T0830_02`                                                    | Active escalation plan with due-by and triggers. ([GitHub][2])                       |
|  6 | 08:45       | action / note          | existing `evt_20260418T0845_01`, `evt_20260418T0845_02`, `note_20260418T0845_sbar` | Provider notification and SBAR. ([GitHub][2])                                        |
|  7 | 08:48       | nursing assessment     | **new `evt_20260418T0848_01`**                                                     | Reuse target: focused respiratory exam entered once.                                 |
|  8 | 08:50       | problem assessment     | **new `evt_20260418T0850_01`**                                                     | Active problem: acute hypoxemic respiratory deterioration.                           |
|  9 | 08:52       | note / communication   | **new `evt_20260418T0852_01` + `note_20260418T0852_sbar_update`**                  | SBAR update cites the reuse target and problem.                                      |
| 10 | 08:56       | orders                 | **new oxygen, ABG, CXR, review/reassess intents**                                  | Creates open loops through `intent` events.                                          |
| 11 | 09:00       | intervention           | **new O2 escalation action**                                                       | Fulfills oxygen order.                                                               |
| 12 | 09:05       | lab acquisition        | **new ABG specimen/action**                                                        | Fulfills ABG order; result will support this action.                                 |
| 13 | 09:10       | lab result             | **new PaO2 lab_result**                                                            | Confirms hypoxemia; supports acquisition action.                                     |
| 14 | 09:20       | diagnostic acquisition | **new imaging_acquired action**                                                    | Fulfills CXR order.                                                                  |
| 15 | 09:34       | diagnostic result      | **new CXR diagnostic_result**                                                      | Confirms worsening LLL consolidation, no pneumothorax.                               |
| 16 | 09:40       | review                 | **new result_review action**                                                       | Closes review/reassess loop and supports updated interpretation.                     |
| 17 | 09:45       | updated assessment     | **new trend/impression assessment**                                                | Summarizes post-results interpretation and remaining uncertainty.                    |
| 18 | 10:00       | care plan              | **new active care_plan intent**                                                    | Defines next watch items and contingency triggers.                                   |
| 19 | 10:30–11:00 | vitals                 | **new vitals rows**                                                                | Shows response to O2 escalation.                                                     |
| 20 | 11:15       | handoff                | **new `communication:handoff` + note**                                             | Projects target observation, evidence, open loops, and next-shift watch items.       |

---

# 3. Required chart events, notes, and artifacts

## 3.1 Vitals rows

Append rows to `patients/patient_001/timeline/2026-04-18/vitals.jsonl`.

| Sampled at                  | Source              | Rows                                       |
| --------------------------- | ------------------- | ------------------------------------------ |
| `2026-04-18T08:50:00-05:00` | `monitor_extension` | HR 112, RR 26, SpO2 88 on 2L NC, BP 126/74 |
| `2026-04-18T09:05:00-05:00` | `monitor_extension` | HR 110, RR 25, SpO2 91 on 4L NC, BP 124/72 |
| `2026-04-18T09:30:00-05:00` | `monitor_extension` | HR 104, RR 22, SpO2 92 on 4L NC, BP 122/70 |
| `2026-04-18T11:00:00-05:00` | `monitor_extension` | HR 98, RR 20, SpO2 93 on 4L NC, BP 120/72  |

Rationale: vitals are not claim events; `trend()` reads both `vitals.jsonl` and event-recorded observations, and current-state vitals return the latest valid sample per metric. ([GitHub][6])

## 3.2 Event table

Use existing clinical types only. The schema already defines the closed top-level types: `observation`, `assessment`, `intent`, `action`, `communication`, `artifact_ref`, plus structural chart types. ([GitHub][7])

| ID                     | Type / subtype                  | Source.kind                                   | Author role        | Effective                       | Recorded | Links                                                                                                                                                   |
| ---------------------- | ------------------------------- | --------------------------------------------- | ------------------ | ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `evt_20260418T0848_01` | `observation:exam_finding`      | `nurse_charted`                               | `rn`               | 08:48                           | 08:49    | `supports: []`                                                                                                                                          |
| `evt_20260418T0850_01` | `assessment:problem`            | `nurse_charted` or `agent_inference`          | `rn` or `rn_agent` | 08:50                           | 08:50:30 | `supports: [evt_20260418T0848_01, evt_20260418T0815_01, vitals_window 08:00–08:50]`                                                                     |
| `evt_20260418T0852_01` | `communication:sbar`            | `nurse_charted`                               | `rn`               | 08:52                           | 08:53    | `supports: [evt_20260418T0848_01, evt_20260418T0850_01, evt_20260418T0830_01]`                                                                          |
| `evt_20260418T0856_01` | `intent:order`                  | `clinician_chart_action`                      | `md`               | 08:56                           | 08:56    | `supports: [evt_20260418T0848_01, evt_20260418T0850_01]`; `addresses: [evt_20260418T0850_01]`                                                           |
| `evt_20260418T0856_02` | `intent:order`                  | `clinician_chart_action`                      | `md`               | 08:56                           | 08:56    | `supports: [evt_20260418T0848_01, evt_20260418T0850_01]`; `addresses: [evt_20260418T0850_01]`                                                           |
| `evt_20260418T0856_03` | `intent:order`                  | `clinician_chart_action`                      | `md`               | 08:56                           | 08:56    | `supports: [evt_20260418T0848_01, evt_20260418T0850_01]`; `addresses: [evt_20260418T0850_01]`                                                           |
| `evt_20260418T0856_04` | `intent:monitoring_plan`        | `clinician_chart_action`                      | `md`               | 08:56                           | 08:56    | `supports: [evt_20260418T0848_01, evt_20260418T0850_01]`; `addresses: [evt_20260418T0850_01]`                                                           |
| `evt_20260418T0900_01` | `action:intervention`           | `nurse_charted`                               | `rn`               | 09:00                           | 09:00:15 | `supports: [evt_20260418T0848_01]`; `fulfills: [evt_20260418T0856_01]`; `addresses: [evt_20260418T0850_01]`                                             |
| `evt_20260418T0905_01` | `action:specimen_collection`    | `nurse_charted`                               | `rn`               | 09:05                           | 09:05:20 | `supports: [evt_20260418T0850_01]`; `fulfills: [evt_20260418T0856_02]`                                                                                  |
| `evt_20260418T0910_01` | `observation:lab_result`        | `poc_device`                                  | `device` or `rn`   | 09:05                           | 09:10    | `supports: [evt_20260418T0905_01]`                                                                                                                      |
| `evt_20260418T0920_01` | `action:imaging_acquired`       | `clinician_chart_action` or `pacs_interface`  | `rad_tech`         | 09:20                           | 09:20    | `supports: [evt_20260418T0850_01]`; `fulfills: [evt_20260418T0856_03]`                                                                                  |
| `evt_20260418T0934_01` | `observation:diagnostic_result` | `pacs_interface`                              | `radiologist`      | 09:20                           | 09:34    | `supports: [evt_20260418T0920_01]`                                                                                                                      |
| `evt_20260418T0940_01` | `action:result_review`          | `clinician_chart_action`                      | `md`               | 09:40                           | 09:40    | `supports: [evt_20260418T0910_01, evt_20260418T0934_01, evt_20260418T0848_01]`; `fulfills: [evt_20260418T0856_04]`; `addresses: [evt_20260418T0850_01]` |
| `evt_20260418T0945_01` | `assessment:trend`              | `agent_inference` or `clinician_chart_action` | `rn_agent` or `md` | 09:45                           | 09:45    | `supports: [evt_20260418T0848_01, vitals_window 08:40–09:40, evt_20260418T0910_01, evt_20260418T0934_01, evt_20260418T0940_01]`                         |
| `evt_20260418T1000_01` | `intent:care_plan`              | `clinician_chart_action`                      | `md`               | `effective_period.start: 10:00` | 10:00    | `supports: [evt_20260418T0945_01, evt_20260418T0848_01]`; `addresses: [evt_20260418T0850_01]`                                                           |
| `evt_20260418T1115_01` | `communication:handoff`         | `nurse_charted`                               | `rn`               | 11:15                           | 11:15    | `supports: [evt_20260418T0848_01, evt_20260418T0850_01, evt_20260418T0945_01, evt_20260418T1000_01, vitals_window 08:40–11:00]`                         |

Important correction from the Claude/Gemini reports: **do not use `fulfills` from lab/diagnostic observations directly to orders.** Current `CLAIM-TYPES.md` says `fulfills` is action → intent only, and acquisition actions fulfill data-producing orders; the resulting observation supports the acquisition action. ([GitHub][8]) The current validator also checks acquisition actions and result observations: acquisition actions such as `specimen_collection` / `imaging_acquired` must fulfill an order or monitoring plan unless ad hoc, and `lab_result` / `diagnostic_result` observations must support an acquisition action unless marked ad hoc. ([GitHub][9])

## 3.3 Minimal data payloads

Only the payload fields needed for projection and tests should be present.

### `evt_20260418T0850_01` — problem assessment

```jsonc
{
  "type": "assessment",
  "subtype": "problem",
  "certainty": "inferred",
  "status": "active",
  "data": {
    "status_detail": "active",
    "name": "acute_hypoxemic_respiratory_deterioration",
    "summary": "Worsening hypoxemia and work of breathing in pneumonia despite 2L NC.",
    "severity": "moderate",
    "uncertainty": [
      "worsening pneumonia vs atelectasis",
      "mucus plugging possible",
      "PE less likely but not excluded"
    ]
  }
}
```

### `evt_20260418T0856_01` — oxygen escalation order

```jsonc
{
  "type": "intent",
  "subtype": "order",
  "certainty": "planned",
  "status": "active",
  "data": {
    "status_detail": "active",
    "order": "Increase oxygen to 4L nasal cannula",
    "indication": "SpO2 88-89% with increased work of breathing",
    "priority": "now",
    "target": "SpO2 >= 92%"
  }
}
```

### `evt_20260418T0856_02` — ABG order

```jsonc
{
  "type": "intent",
  "subtype": "order",
  "certainty": "planned",
  "status": "active",
  "data": {
    "status_detail": "active",
    "order": "Obtain arterial blood gas",
    "indication": "Evaluate hypoxemia and ventilation",
    "priority": "stat",
    "due_by": "2026-04-18T09:15:00-05:00"
  }
}
```

### `evt_20260418T0910_01` — PaO2 result

```jsonc
{
  "type": "observation",
  "subtype": "lab_result",
  "certainty": "observed",
  "status": "final",
  "data": {
    "status_detail": "final",
    "name": "pa_o2",
    "value": 58,
    "unit": "mmHg",
    "flag": "low",
    "specimen_id": "spec_20260418T0905_abg",
    "specimen_collected_at": "2026-04-18T09:05:00-05:00",
    "resulted_at": "2026-04-18T09:10:00-05:00",
    "verified_at": "2026-04-18T09:10:00-05:00"
  }
}
```

The lab-result research you uploaded is directly useful here: keep lab results as `observation:lab_result`, use one result event per clinically meaningful analyte, keep units/flags/reference context close to the event, and avoid operational LIS cruft unless it affects clinical reasoning. 

### `evt_20260418T0934_01` — CXR result

```jsonc
{
  "type": "observation",
  "subtype": "diagnostic_result",
  "certainty": "observed",
  "status": "final",
  "data": {
    "status_detail": "final",
    "name": "portable_chest_xray",
    "value": "Increased left lower-lobe airspace opacity compatible with worsening pneumonia or atelectasis. No pneumothorax. No pulmonary edema.",
    "resulted_at": "2026-04-18T09:34:00-05:00",
    "verified_at": "2026-04-18T09:34:00-05:00"
  }
}
```

### `evt_20260418T1000_01` — care plan

```jsonc
{
  "type": "intent",
  "subtype": "care_plan",
  "certainty": "planned",
  "status": "active",
  "effective_period": {
    "start": "2026-04-18T10:00:00-05:00"
  },
  "data": {
    "status_detail": "active",
    "goal": "Maintain SpO2 >= 92% and detect worsening respiratory failure early.",
    "responsible": "bedside_rn",
    "success_criteria": [
      "SpO2 >= 92% on 4L NC",
      "RR <= 24",
      "no increasing accessory muscle use"
    ],
    "watch_items": [
      "SpO2 < 90% sustained on 4L",
      "RR > 28",
      "new confusion or inability to speak full sentences",
      "CXR/ABG already reviewed; repeat provider call if trend worsens"
    ],
    "handoff_priority": "high"
  }
}
```

`intent:care_plan` is interval-allowed in the current design, so this can be an open interval rather than an ad hoc new primitive. ([GitHub][8])

## 3.4 Required notes

### `note_20260418T0852_sbar_update`

Use `writeCommunicationNote()` so the note and communication event stay paired. The repo currently requires paired communication-note authoring for this invariant. ([GitHub][1])

Frontmatter references:

```yaml
references:
  - evt_20260418T0848_01
  - evt_20260418T0850_01
  - evt_20260418T0830_01
```

Body should be clinically readable but citation-forward:

```md
# SBAR update — respiratory deterioration

Situation: respiratory status worsened after prior SBAR. Primary bedside finding: see `evt_20260418T0848_01`.

Assessment: active problem `evt_20260418T0850_01`; trend assessment `evt_20260418T0830_01`.

Recommendation: provider orders requested for O2 escalation, ABG, and portable CXR.
```

### `note_20260418T1115_handoff`

Frontmatter references:

```yaml
references:
  - evt_20260418T0848_01
  - evt_20260418T0850_01
  - evt_20260418T0945_01
  - evt_20260418T1000_01
```

Body:

```md
# Handoff — respiratory watch

Primary bedside finding: see `evt_20260418T0848_01`.
Active problem: see `evt_20260418T0850_01`.
Post-result interpretation: see `evt_20260418T0945_01`.
Current plan/watch items: see `evt_20260418T1000_01`.

Next shift: monitor sustained SpO2, RR, accessory muscle use, and mental status. Escalate per care-plan triggers.
```

This is intentionally pointer-heavy. The clinical note is allowed to summarize, but the test should assert that the bedside finding is not re-entered as a second canonical observation.

---

# 4. Projection API sketch

## Recommended function

```ts
export interface MemoryProofParams {
  scope: PatientScope;
  encounterId?: string;
  from?: string;
  asOf: string;
  rootEventIds?: string[];
  includeRaw?: boolean;
  fingerprint?: boolean;
}

export interface MemoryProofProjection {
  schema_version: "memory-proof-projection.v0";
  subject: string;
  encounter_id?: string;
  from: string;
  as_of: string;

  sections: {
    what_happened: ProjectionTimelineItem[];
    why_it_mattered: ProjectionAssessmentItem[];
    evidence_provenance: ProjectionEvidenceItem[];
    uncertainty: ProjectionUncertaintyItem[];
    open_loops: ProjectionOpenLoopItem[];
    next_shift_handoff: ProjectionHandoffItem[];
  };

  reuse_proof: {
    canonical_observation_id: string;
    appears_in: Array<{
      surface:
        | "nursing_assessment"
        | "note"
        | "review"
        | "open_loop"
        | "care_plan"
        | "handoff";
      ref: string;
      via: "supports" | "references" | "addresses_problem" | "evidence_chain";
    }>;
    duplicate_payload_candidates: string[];
  };

  source_views: {
    timeline: { count: number };
    current_state: { axes: string[] };
    narrative: { count: number };
    open_loops: { count: number };
    evidence_roots: string[];
    trend_windows: Array<{ metric: string; from: string; to: string }>;
  };

  fingerprint?: {
    algorithm: "sha256";
    canonicalization: "json-stable";
    value: string;
  };
}

export async function memoryProofProjection(
  params: MemoryProofParams
): Promise<MemoryProofProjection>;
```

## Composition rule

`memoryProofProjection()` is not a second memory model. It should only compose existing view primitives:

```ts
const events = await timeline({ scope, from, to: asOf, encounterId });
const state = await currentState({ scope, axis: "all", asOf });
const loops = await openLoops({ scope, asOf });
const notes = await narrative({ scope, from, to: asOf, encounterId });
const spo2 = await trend({ scope, metric: "spo2", from, to: asOf, encounterId });
const rr = await trend({ scope, metric: "respiratory_rate", from, to: asOf, encounterId });
const hr = await trend({ scope, metric: "heart_rate", from, to: asOf, encounterId });
const evidence = await Promise.all(rootEventIds.map(id => evidenceChain({ scope, eventId: id, depth: -1 })));
```

This follows the current architecture: views are pure, JSON-serializable, axis-aware, and agent/UI-facing; `_derived/` is disposable; writes remain in `src/write.ts`. ([GitHub][10])

## Deterministic ordering

Within the projection:

1. **Timeline:** sort by `effective_start`, then `recorded_at`, then `id`.
2. **Notes:** sort by `recorded_at`, then `id`, matching `narrative()`.
3. **Open loops:** preserve `openLoops()` ordering, then add deterministic tie-breakers by `intent.id`.
4. **Evidence:** sort root evidence by root event effective time, then root ID. Within each root, preserve explicit `links.supports[]` order unless object refs have identical role; then tie-break by `kind`, `ref`.
5. **Handoff:** order by clinical priority bucket, then linked event time, then event ID.
6. **No wall-clock `generated_at`** unless the caller explicitly provides it. Fingerprints should not change just because a projection was recomputed later.

The current `openLoops()` implementation already sorts ordinary loops by event start and ID and uses explicit `links.fulfills` rather than brittle subtype/time matching. ([GitHub][11])

## Fingerprint / export behavior

Add a helper:

```ts
export function fingerprintMemoryProofProjection(
  projection: Omit<MemoryProofProjection, "fingerprint">
): string;
```

Behavior:

1. Strip `fingerprint` field before hashing.
2. Canonicalize JSON with stable object-key ordering.
3. Hash with SHA-256.
4. Return lowercase hex.
5. If exported, write only to `_derived/memory-proof.json` or `_derived/memory-proof.md`.
6. Never write the projection back as canonical chart memory.

The uploaded Claude/Gemini reports were useful here: both independently emphasized stable fingerprints, rehydration from canonical memory, and simulator-opacity checks. Those are good test ideas, but they should be implemented against the repo’s actual view primitives, not a guessed `ProjectedEHRState` model. 

---

# 5. Acceptance tests

## 5.1 `memoryProofFixture_coversAllSixSurfaces`

**Arrange:** load extended `patient_001` through `asOf = 2026-04-18T11:30:00-05:00`.

**Pass criteria:**

* Flowsheets/vitals: projection includes SpO2, HR, RR trend windows.
* Nursing assessment: includes `evt_20260418T0848_01`.
* Notes/narrative: includes SBAR update and handoff note.
* Orders/interventions: includes O2, ABG, CXR, and review/reassess intents plus fulfillments.
* Labs/diagnostics: includes PaO2 lab result and CXR diagnostic result.
* Care plan/handoff: includes `evt_20260418T1000_01` and handoff section.

**Fail:** any section is empty or only represented by prose without canonical refs.

## 5.2 `singleBedsideObservation_isReusedWithoutCanonicalDuplication`

**Arrange:** run `memoryProofProjection()` and scan all canonical events in the fixture.

**Pass criteria:**

* Exactly one event has `data.name === "focused_respiratory_assessment"`.
* That event ID is `evt_20260418T0848_01`.
* Projection `reuse_proof.appears_in` contains at least:

  * `nursing_assessment`,
  * `note`,
  * `review`,
  * `open_loop`,
  * `care_plan`,
  * `handoff`.
* No other event repeats the same structured payload.

**Fail:** another observation, assessment, note event, or handoff event re-enters the bedside exam as a second canonical fact.

## 5.3 `memoryProofProjection_hasStableFingerprint`

**Arrange:** call `memoryProofProjection()` twice with identical params, in separate module-import cycles if practical.

**Pass criteria:**

* The two canonical JSON outputs are byte-identical after removing the fingerprint field.
* The SHA-256 fingerprint is identical.
* A committed golden fingerprint is stable unless the PR explicitly updates fixture/projection semantics.

**Fail:** output order differs between runs, or hash changes without fixture/spec change.

## 5.4 `openLoops_closeOnlyThroughActionFulfillment`

**Arrange:** inspect loops at four `asOf` times.

| `asOf` | Expected                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------- |
| 08:57  | O2, ABG, CXR, review/reassess loops are pending.                                                          |
| 09:01  | O2 loop closed by `evt_20260418T0900_01`; ABG/CXR/review still pending.                                   |
| 09:21  | ABG acquisition and CXR acquisition loops closed; review/reassess loop still pending until result review. |
| 09:41  | review/reassess loop closed by `evt_20260418T0940_01`; care plan remains active.                          |

**Pass:** `openLoops()` reflects only action→intent fulfillments.

**Fail:** a lab result or diagnostic result directly closes an order without an acquisition/review action. This is the key correction to the Claude/Gemini-style “DiagnosticReport fulfills ServiceRequest” mapping.

## 5.5 `evidenceChain_includesVitalsObservationLabDiagnosticAndNote`

**Arrange:** call `evidenceChain({ eventId: "evt_20260418T0945_01", depth: -1 })`.

**Pass criteria:**

Evidence tree includes:

* vitals window for SpO2 / RR / HR,
* reuse target `evt_20260418T0848_01`,
* ABG specimen action,
* PaO2 lab result,
* CXR acquisition action,
* CXR diagnostic result,
* SBAR or handoff note refs where cited.

**Fail:** evidence chain stops at an assessment or note and does not reach primary observations/results.

The current evidence model already supports event, note, artifact, and vitals-window evidence nodes, and the schema supports structured `EvidenceRef` entries with `role`, `basis`, `selection`, and `derived_from`. ([GitHub][7])

## 5.6 `noHiddenSimulatorStateLeaksIntoProjection`

**Arrange:** create two copies of the same fixture:

* A: normal `patient_001`.
* B: same chart plus `patients/patient_001/_sim_state.json` containing keys like `hidden_lung_fluid_ml`, `ground_truth_pneumonia_burden`, `scheduled_event_queue`.

**Pass criteria:**

* `memoryProofProjection(A)` and `memoryProofProjection(B)` are byte-identical.
* `JSON.stringify(projection)` contains none of the forbidden keys.
* Projection code reads only chart memory surfaces: events, vitals, notes, structural markdown, artifacts.

**Fail:** hidden simulator state changes output or appears in projection. ADR 016 explicitly requires that pi-chart and pi-agent only receive public observations, never simulator internals. ([GitHub][4])

## 5.7 `asOfProjection_doesNotSeeFutureFacts`

**Arrange:** run projection at `asOf = 2026-04-18T09:00:00-05:00`.

**Pass criteria:**

* Includes the 08:48 bedside observation and 08:56 orders.
* Does not include 09:10 PaO2, 09:34 CXR, 09:40 result review, 10:00 care plan, or 11:15 handoff.
* Open loops show ABG/CXR/review pending.

**Fail:** any future result, review, or handoff appears.

## 5.8 `validateChart_acceptsFixtureWithoutNewPrimitive`

**Arrange:** run `npm run check` or `validateChart({ chartRoot, patientId: "patient_001" })`.

**Pass criteria:**

* No schema errors.
* No cross-patient link errors.
* Assessments have observation/vitals/artifact evidence.
* Acquisition actions fulfill order/monitoring-plan intents.
* Lab/diagnostic result observations support acquisition actions.
* Communication notes have matching communication events.

**Fail:** any new top-level event type is introduced, or validation requires relaxing existing invariants.

---

# 6. Schema-impact table

| Area                    | Existing primitive                                                             |                                         Proposed change | Schema impact                             | Recommendation                                                                              |
| ----------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------: | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Vitals trend            | `vitals.jsonl`, `trend()`                                                      |                       Add four rows after O2 escalation | None                                      | Implement now                                                                               |
| Nursing assessment      | `observation:exam_finding`                                                     |                    Add one canonical reuse-target event | None                                      | Implement now                                                                               |
| Active clinical problem | `assessment:problem`                                                           | Add `acute_hypoxemic_respiratory_deterioration` payload | No schema change; payload convention only | Implement now                                                                               |
| Orders                  | `intent:order`                                                                 |                                            O2, ABG, CXR | None                                      | Implement now                                                                               |
| Monitoring/review loop  | `intent:monitoring_plan`                                                       |                             Result-review/reassess loop | None                                      | Implement now                                                                               |
| Interventions           | `action:intervention`, `action:specimen_collection`, `action:imaging_acquired` |                              Fulfill orders via actions | None                                      | Implement now                                                                               |
| Lab result              | `observation:lab_result`                                                       |                    PaO2 result supports specimen action | None                                      | Implement now                                                                               |
| Diagnostic result       | `observation:diagnostic_result`                                                |                      CXR result supports imaging action | None                                      | Implement now                                                                               |
| Result review           | `action:result_review`                                                         |                              Close review/reassess loop | None                                      | Implement now                                                                               |
| Care plan               | `intent:care_plan`                                                             |                          Open interval with watch items | None                                      | Implement now                                                                               |
| Handoff                 | `communication:handoff` + note                                                 |                               Pointer-rich handoff note | None; subtype already conventional        | Implement now                                                                               |
| Memory proof projection | Existing six views                                                             |            Add `memoryProofProjection()` composite view | New derived view only, not primitive      | Implement now                                                                               |
| `links.highlights`      | None                                                                           |           Some reports proposed a handoff priority link | New link convention                       | **Reject/defer**; use `supports`, `addresses`, `openLoops`, and projection priority instead |
| Full MAR                | `action:administration` exists                                                 |                 Full medication administration workflow | Payload/spec expansion                    | Defer                                                                                       |
| FHIR export             | Boundary adapter deferred                                                      |                       FHIR Bundle/Provenance/AuditEvent | New adapter, not internal model           | Defer to Workstream C                                                                       |
| Actor attestation       | `author`, `source.kind`, `status` exist                                        |                human review / reject / co-sign taxonomy | ADR needed                                | Defer behind Workstream A                                                                   |

The key design point: Workstream A should introduce **one new composite view**, not a new record primitive. The repo already says top-level clinical types are closed and `subtype` should be used before inventing a seventh type. ([GitHub][8])

---

# 7. Do not build yet

Do **not** build these in Workstream A:

* UI panels, React Native screens, handoff visual design, or component styling.
* FHIR export/import, Provenance, AuditEvent, SMART, or Medplum adapters.
* Compliance audit logs, read-path audit, legal retention, redaction, hash chain, or deletion policy.
* Full MAR, medication reconciliation, barcode administration, pharmacy verification, or drug dictionary.
* Full CPOE.
* Production EHR features: scheduling, billing, claims, user management, RBAC, authentication, inboxes.
* Vector memory, embeddings, semantic search.
* Agent attestation / co-sign / reject workflow.
* New top-level event types.
* Any code path that reads pi-sim internals or hidden state.

This follows ADR 016’s explicit boundary: broad EHR skeleton as clinical-memory proof, not full EHR product. ([GitHub][4])

---

# 8. Implementation plan

## PR 1 — fixture extension

Files:

```text
patients/patient_001/timeline/2026-04-18/events.ndjson
patients/patient_001/timeline/2026-04-18/vitals.jsonl
patients/patient_001/timeline/2026-04-18/notes/0852_sbar-update.md
patients/patient_001/timeline/2026-04-18/notes/1115_handoff.md
```

Acceptance:

```bash
npm run validate -- --patient patient_001
npm test
```

## PR 2 — projection view

Files:

```text
src/views/memoryProof.ts
src/views/memoryProof.test.ts
src/views/fingerprint.ts   # optional helper
```

Export from `src/index.ts`.

## PR 3 — derived render

Optional, after tests pass:

```text
src/derived.ts
patients/patient_001/_derived/memory-proof.json
patients/patient_001/_derived/memory-proof.md
```

Generated only. Disposable.

## PR 4 — spec/ADR capture

After the projection shape survives implementation:

```text
specs/memory-proof-projection.md
# or
decisions/017-memory-proof-projection.md
```

The alignment matrix already identified Workstream A as the next lane and sequenced deterministic projection/replay export as a later ADR artifact once the fixture proves shape. 

---

# 9. Open questions for operator review

1. **Source of the 08:48 bedside observation:** should it be `nurse_charted` by a human RN, or `agent_bedside_observation` after an explicit simulated assessment action? For Workstream A, I recommend `nurse_charted` because it keeps human bedside observation as the documentation-burden proof.

2. **Handoff note authorship:** should the canonical handoff be `nurse_charted`, or should the handoff exist only as a disposable projection? I recommend canonical `communication:handoff` for the fixture plus disposable projection, because that stresses note references and narrative view.

3. **How strict should duplicate-fact detection be?** I recommend structural detection first: no second event with the same `data.name === "focused_respiratory_assessment"` and materially identical payload. Do not forbid prose summaries in notes.

4. **Do we want CXR as only `observation:diagnostic_result`, or also an `artifact_ref`?** I recommend no artifact file for Workstream A unless you want to test artifact evidence. The current proof does not require a real image/PDF.

5. **Should `evt_20260418T0845_01` be retroactively superseded or fulfilled?** I recommend no. Do not edit existing seed semantics. Append continuation events only.

6. **Should `memoryProofProjection()` live under `src/views/`?** I recommend yes. It is a composite view, not a primitive or adapter.

7. **Should the care plan remain an open loop at handoff?** I recommend yes. That makes the projection clinically useful: the handoff should include an active watch plan rather than ending with all loops closed.

---

# 10. Most important design correction

The external reports were directionally useful but not repo-precise. The strongest corrected plan is:

> Extend `patient_001` with one nurse-charted respiratory assessment, use existing `intent`/`action`/`observation`/`communication` primitives to create and close orders/results/review loops, then add a deterministic `memoryProofProjection()` composite view that proves the same bedside observation is reused through note, review, open-loop, care-plan, and handoff outputs without becoming a second canonical fact.

That is the smallest Workstream A that proves ADR 016 without turning pi-chart into an EHR clone.

[1]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/README.md "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/patients/patient_001/timeline/2026-04-18/events.ndjson "raw.githubusercontent.com"
[3]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/patients/patient_001/patient.md "raw.githubusercontent.com"
[4]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/decisions/016-broad-ehr-skeleton-clinical-memory.md "raw.githubusercontent.com"
[5]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/patients/patient_001/timeline/2026-04-18/vitals.jsonl "raw.githubusercontent.com"
[6]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/src/views/currentState.ts "raw.githubusercontent.com"
[7]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/schemas/event.schema.json "raw.githubusercontent.com"
[8]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/CLAIM-TYPES.md "raw.githubusercontent.com"
[9]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/src/validate.ts "raw.githubusercontent.com"
[10]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/ARCHITECTURE.md "raw.githubusercontent.com"
[11]: https://raw.githubusercontent.com/ShanesNotes/pi-rn/main/pi-chart/src/views/openLoops.ts "raw.githubusercontent.com"

