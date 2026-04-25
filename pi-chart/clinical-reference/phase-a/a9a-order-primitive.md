# A9a. Individual order primitive

*Council synthesis note.* This version merges the prior A9a output with the competing A9a artifact produced from the same prompt. The council keeps the shared thesis — **an order is an accountable `intent.order`, not a CPOE module** — and folds in the stronger value-add from the competing artifact: explicit verbal/telephone/secure-text metadata, PRN trigger inheritance from A8, blood-product prepare/transfuse pressure, restraint renewal discipline, and a sharper durable open-schema grouping. The synthesis normalizes terminology to `data.authoring_channel` rather than legacy `data.order_mode`, keeps `intent.order` + `data.order_kind` as the default shape, and leaves discontinuation/cancellation, occurrence identity, blood-product structure, and monitoring-order boundaries as open-schema rather than silently adopting new machinery.

## 1. Clinical purpose

An individual order is the accountable, patient-specific instruction/request/authorization for something clinical to happen, be withheld, be monitored, or be stopped. Its clinical work is to create an obligation that downstream clinicians, devices, departments, and agents can execute, verify, audit, or close. It is not the CPOE row, order composer, MAR row, task-list cell, result, note sentence, or CDS alert. In pi-chart, the order must preserve who ordered what, for whom, when, why, under what conditions, and how fulfillment or nonfulfillment will be recognized.

## 2. Agent-native transposition

An individual order is not an order tab. In pi-chart it is **the atomic intent that binds clinical rationale to downstream action**.

| Legacy artifact | pi-chart primitive | Supporting views |
|---|---|---|
| Active medication order | `intent.order` with `data.order_kind: medication` | `currentState(axis:"intents")`, `openLoops()`, `timeline()` |
| One-time medication order | `intent.order`; fulfilled by A4 disposition action | `timeline()`, `evidenceChain()` |
| PRN medication order | `intent.order` with conditional trigger and monitoring requirements | `openLoops()`, `evidenceChain()` |
| Continuous infusion / titration order | `intent.order` with rate/titration payload; A4 owns rate epochs | `currentState(axis:"intents")`, `trend()`, `openLoops()` |
| Lab draw order | `intent.order` with expected `action.specimen_collection`; A1 owns result | `openLoops()`, `evidenceChain()` |
| Imaging order | `intent.order` with expected `action.imaging_acquired`; A2 owns review/result | `openLoops()`, `evidenceChain()` |
| Consult / referral order | `intent.order` or existing `intent.referral`; consult note is A6 | `openLoops(kind:"consult_pending")`, `narrative()` |
| Nursing communication / care order | `intent.order` when task-like; `intent.monitoring_plan` when cadence/monitoring-like | `openLoops()`, `timeline()` |
| Diet / NPO / activity / mobility order | `intent.order` with safety and effective-period payload | `currentState(axis:"intents")`, `openLoops()` |
| RT / oxygen / ventilator-related order | `intent.order`; A3/A8 evidence tracks physiologic response | `trend()`, `timeline()`, `openLoops()` |
| Procedure / LDA placement order | `intent.order`; fulfilled by `action.procedure_performed`; A5 owns device context | `evidenceChain()`, `openLoops()` |
| Blood product prepare order | `intent.order`, `data.order_kind: blood_product_prepare`; type/screen/crossmatch/availability obligation | `openLoops(kind:"missing_prerequisite")`, `evidenceChain()` |
| Blood product transfuse order | `intent.order`, `data.order_kind: blood_product_transfuse`, supporting/precondition relation to prepare order | `openLoops()`, `timeline()` |
| Verbal / telephone / secure-text order | same `intent.order`; `data.authoring_channel`, `data.read_back`, `data.authentication` create safety/authentication loops | `openLoops(kind:"order_auth_pending")`, `timeline()` |
| Protocol/standing-order child | ordinary `intent.order` citing protocol/order-set context | A9b parent-child view later |
| Restraint order | `intent.order`, `data.order_kind: restraint`, regulation/policy-bounded `effective_period` | `openLoops(kind:"restraint_order_renewal_due")` |
| Discontinued / modified / cancelled order | append-only supersession/correction/cancellation convention; no mutation | `currentState(axis:"intents")`, `timeline()` |
| Expired order | derived from effective window; no explicit expiration event required | `currentState(axis:"intents")` |

> The order says what should happen; the action says what happened; the result says what was observed; the review/assessment says what it meant.

Load-bearing claims:

1. **Orders are intents.** They request/authorize care; they do not prove performance.
2. **Fulfillment is action-mediated.** Lab results, imaging reports, MAR actions, procedure notes, and nursing findings support the action/review chain; they do not directly mutate the order.
3. **Current active orders are derived.** No canonical active-order list, task board, or order tab exists.
4. **Order families are payload variants, not separate EHR modules.** `data.order_kind` earns validation without multiplying event types.
5. **A9a defines the atomic child order.** A9b later defines order-set/protocol invocation and parent/child generation.

## 3. Regulatory / professional floor

- **CMS 42 CFR § 482.24(c)(1)–(3)** — medical-record entries must be complete, dated, timed, authenticated; all orders including verbal orders must be dated/timed/authenticated; standing orders/order sets/protocols require approved governance and prompt authentication.
- **CMS 42 CFR § 482.23(c)(1)–(6)** — nursing/drug administration depends on authorized practitioner orders, accepted standards, policies, and controlled verbal-order discipline.
- **CMS 42 CFR § 482.13(e)** — restraint/seclusion orders are time-limited and renewal-governed; restraint orders are a high-value test case for policy/regulatory cadence.
- **CMS 42 CFR § 482.25** — pharmacy services must minimize medication errors, manage drug distribution/control, auto-stop policies, adverse reaction reporting, and drug-information availability.
- **Joint Commission / CMS secure-text-order guidance and Record of Care / Medication Management standards** — CPOE remains preferred; verbal/texted orders require authorized receipt, dating, timing, authentication, and minimization for medication orders.
- **ONC/ASTP SAFER CPOE with Decision Support + Leapfrog CPOE Evaluation Tool** — order safety depends on structured orders, decision support, prerequisite checks, serious-medication-error detection, monitoring, and alert-fatigue control.

`[phase-b-regulatory]` — state scope-of-practice rules, exact verbal-order countersign windows, blood-product consent/witness policy, restraint-order renewal intervals, local pharmacy verification rules, controlled-substance ordering, and institutional standing-order governance are profile/policy work.

## 4. Clinical function

A9a is consumed at the moment of **writing**, **executing**, **monitoring**, **changing**, and **handing off** care.

- **Pre-write / order entry:** Is the patient/encounter correct? Is the requester authorized? Is there an active problem/indication or exception? Are allergies, code status, diet, renal function, pregnancy/weight/age/baseline, and active constraints compatible?
- **Execution:** Which service or performer is expected to act? What action will close the obligation? What due time, frequency, or condition makes silence unsafe?
- **Monitoring:** Which response evidence is required after fulfillment? What labs/vitals/assessments determine whether the order should be held, titrated, repeated, or discontinued?
- **Change/discontinuation:** What prior order is superseded? Does the old obligation remain open, terminate, or require a final disposition?
- **Handoff:** Which orders are active, unfulfilled, unsafe, unauthenticated, overdue, contradicted, missing response evidence, or pending review?

## 5. Who documents

Primary: **provider / APP / authorized ordering practitioner** for most orders.

Secondary: **RN** for protocol/standing-order workflows and nursing-scope orders where permitted; **pharmacist** for verification/recommendation but usually not the ordering authority; **RT** for protocol respiratory orders where local policy permits; **importer/manual scenario** for fixture/historical orders; **agent** only when a delegated sandbox policy allows draft/proposed orders.

Owner of record: **ordering practitioner/team** for the order intent; **performer** for downstream action; **reviewer** for result/response interpretation; **institutional policy profile** for verbal/standing/protocol order authority.

## 6. When / how often

Frequency class: **event-driven + scheduled + conditional + interval-shaped**.

- **Regulatory minimum:** orders must be dated, timed, authenticated, and documented promptly; standing orders/order sets/protocols require governance and authentication.
- **Clinical practice norm:** orders are written on admission/transfer, change in condition, rounds, procedure/diagnostic decisions, medication changes, protocol triggers, discontinuations, discharge transitions, and response-to-results loops.
- **Regulatory ≠ practice:** regulation rarely defines exact due windows; local policy/profile defines verbal-order authentication windows, medication late windows, restraint renewal, transfusion checks, and monitoring cadence.

## 7. Candidate data elements

| Field | Tag | Include? | Type/unit | What fails if absent? | Sourceability | Confidence |
|---|---|---:|---|---|---|---|
| `id` / event id | [regulatory] | ✓ | string | cannot authenticate, supersede, fulfill, audit, or cite the order | pi-agent / human / importer | high |
| `subject` + `encounter_id` | [regulatory] | ✓ | refs | wrong-patient/wrong-encounter ordering cannot be prevented | all | high |
| `author` / `requester` / role | [regulatory] | ✓ | actor ref | cannot verify ordering authority or authentication | human / importer | high |
| `source.kind` + `data.authoring_channel` | [regulatory] | ✓ | closed enum + channel enum | cannot distinguish source provenance from CPOE/verbal/telephone/secure-text/protocol channel | human / importer | high |
| `effective_at` / ordered-at | [regulatory] | ✓ | datetime | due windows, authentication timing, and order chronology fail | all | high |
| `recorded_at` / authentication state | [regulatory] | ✓ | datetime/object | verbal/text orders cannot be audited or closed | human / importer | high |
| `data.status_detail` | [clinical] | ✓ | enum | active/pending/on-hold/cancelled/completed state cannot be derived | all | high |
| `data.order_kind` | [clinical] | ✓ | enum | validators cannot branch by medication/lab/imaging/procedure/nursing/etc. | all | high |
| `data.orderable` | [clinical] | ✓ | code/text | downstream performer cannot know what is requested | all | high |
| `data.timing` / `effective_period` | [clinical] | ✓ | object | due/overdue/open-loop detection fails | all | high |
| `data.priority` | [clinical] | ✓ | enum | STAT vs routine escalation cannot be derived | human / importer | high |
| `data.indication` + `links.addresses` | [clinical] | ✓ | text/ref | cannot prove why care exists or detect orphan orders | human / pi-agent | high |
| `data.indication_exception` | [clinical] | ✓ when no problem target | enum/text | prophylaxis/screening/protocol orders become false-positive orphan orders | human / pi-agent | medium |
| `links.supports` | [clinical] | ✓ | EvidenceRef[] | cannot audit evidence/prerequisites/constraint reads | all | high |
| `data.performer` / service | [clinical] | ✓ | actor/service | cannot route obligation or detect missing service response | human / derived | medium |
| `data.expected_fulfillment` | [agent] | ✓ | object | `openLoops()` cannot know what action should close the order | pi-agent / manual-scenario | medium |
| `data.conditions` / PRN trigger / hold parameters | [clinical] | ✓ | object[] | conditional orders become unreadable free text; unsafe actions pass | human / pi-agent | medium |
| medication dose/rate/route | [clinical] | conditional ✓ | object | medication/fluid order cannot be executed safely | human / importer | high |
| specimen/body site/modality | [clinical] | conditional ✓ | object | lab/imaging/procedure order may be wrong or unperformable | human / importer | medium |
| `data.order_set_parent_ref` / `protocol_ref` | [agent] | conditional ✓ | ref | child order cannot be traced to A9b invocation/protocol source | pi-agent / human | medium |
| rendered order sentence | [cruft] | ✗ | text | n/a — display can be generated from structured payload | derived | high |
| preference-list/favorite/tab/group/color | [cruft] | ✗ | UI | n/a — clinician navigation aids, not clinical memory | — | high |
| CDS alert banner text | [cruft] | ✗ | UI/text | n/a — validation/openLoop/override event is canonical, not the banner | derived | high |

## 8. Excluded cruft — with rationale

- **Field:** Order tab / section / accordion location. **Why it exists:** legacy CPOE navigation. **Why pi-chart excludes:** derived UI grouping, not chart truth.
- **Field:** Row color / badge / icon. **Why it exists:** visual scanning. **Why pi-chart excludes:** rendered from status/openLoop/safety state.
- **Field:** Favorite/preference-list marker. **Why it exists:** provider workflow acceleration. **Why pi-chart excludes:** user configuration, not patient claim.
- **Field:** Smart order sentence as primary truth. **Why it exists:** human-readable CPOE display. **Why pi-chart excludes:** rendered from structured order payload; free text cannot drive validators.
- **Field:** Hidden EHR order composer defaults. **Why it exists:** convenience/order-entry UX. **Why pi-chart excludes:** only accepted structured values become chart claims.
- **Field:** Charge/billing department routing. **Why it exists:** revenue cycle. **Why pi-chart excludes:** not clinical memory unless it changes care.
- **Field:** CDS alert presentation wording. **Why it exists:** UI interrupt. **Why pi-chart excludes:** safety check result/override is canonical; banner is not.
- **Field:** “Released/signed/printed” UI workflow flags. **Why it exists:** EHR workflow state. **Why pi-chart excludes:** only clinically meaningful status/authentication/fulfillment persists.
- **Field:** Redundant patient identifiers copied into each order payload. **Why it exists:** paper-form inheritance/safety display. **Why pi-chart excludes:** subject/encounter envelope already scopes the event.
- **Field:** Vendor-specific order composer template id. **Why it exists:** proprietary configuration. **Why pi-chart excludes:** A9b may store protocol/order-set lineage, not vendor UI internals.

## 9. Canonical / derived / rendered

- **Canonical**
  - `intent.order` events with `data.order_kind`, orderable, timing, priority, indication, requester/source/authentication, expected fulfillment, and family payload.
  - Append-only supersession/correction/cancellation events or terminal status details.
  - Downstream `action.*` fulfillment/disposition events.
  - Supporting observations, assessments, communications, and artifact refs.
  - Override/authentication/read-back claims when clinically or regulatorily material.

- **Derived**
  - Active orders from `currentState(axis:"intents")`.
  - Due/overdue/pending order obligations from order timing + downstream actions.
  - Medication due occurrences and current infusion state from A4.
  - Constraint/prophylaxis/indication warnings from A0b/A0c + A9a payload.
  - Order-set child rollups once A9b exists.

- **Rendered**
  - Order tab, rows, columns, colors, section grouping, badges, alert banners, preference lists, default order sentences, “release” buttons, and composer forms.

## 10. Provenance and lifecycle

### Provenance

- **Sources of truth:** clinician-authored order, protocol/standing-order invocation, verbal/telephone/secure-text communication that is captured into an authenticated order, importer/manual scenario, or delegated agent proposal.
- **`source.kind` proposals:** no new source kind by default. Use existing `clinician_chart_action`, `nurse_charted`, `protocol_standing_order`, importer/manual-scenario kinds, and `source.ref`/`data.authoring_channel`/artifact refs for channel details. New source kinds require ADR 006 amendment.

### Lifecycle — answer each

- **Created by:** writing/signing an `intent.order` event.
- **Updated by:** never in place; append a correcting/superseding order event.
- **Fulfilled by:** downstream `action.*` events appropriate to order kind: `administration`, `hold`, `refusal`, `omission`, `titration`, `specimen_collection`, `imaging_acquired`, `procedure_performed`, `measurement`, `intervention`, `notification`, or future accepted subtypes.
- **Cancelled / discontinued by:** terminal status/superseding order; explicit discontinuation order only when the discontinuation itself is the clinical instruction.
- **Superseded / corrected by:** `links.supersedes` for legitimate lifecycle replacement; `links.corrects` for error correction.
- **Stale when:** due window passes without fulfillment/disposition; prerequisite/authentication remains missing; conditional trigger occurs without action; active order conflicts with new constraint/problem/evidence; stop date expires.
- **Closes the loop when:** expected action/disposition occurs, terminal cancellation/supersession is written, required result/review/response evidence appears, or the openLoop is explicitly resolved.

### Contradictions and reconciliation

| Conflict | What pi-chart should do |
|---|---|
| Order conflicts with active constraint/allergy/code/blood/diet restriction | warn/block by profile; if overridden, require structured override + support evidence |
| Order lacks active problem but claims therapeutic purpose | require review unless `data.indication_exception` = prophylaxis/screening/protocol/admin |
| Two active orders duplicate or contradict each other | preserve both; emit duplicate/contradiction openLoop until resolved |
| Result/action exists without matching order | preserve action/result; warn if policy expects an order or override pathway |
| Verbal/text order remains unauthenticated | preserve provisional order; emit authentication openLoop |
| Order sentence and structured payload disagree | structured payload wins; require correction of rendered sentence/source artifact if stored |

## 11. Missingness / staleness

- **What missing data matters clinically?** subject/encounter, authorized requester, orderable, timing, active constraint read, indication/problem, prerequisite evidence, expected fulfillment path, authentication/read-back for verbal/text orders, monitoring/response requirements for high-risk orders.
- **What missing data is merely unknown?** display grouping, preference-list source, vendor order composer id, nonclinical print layout, billing class, local shortcut name.
- **When does this artifact become stale?** when its active period ends, it is superseded/cancelled, due windows pass without disposition, prerequisites become outdated, new constraints contradict it, or response evidence is overdue.
- **Should staleness create an `openLoop`?** yes. Orders are obligation-generating events; unsafe silence is the main agent-native value of A9a.

Candidate openLoops:

- **OL-ORDER-01:** active order missing expected fulfillment/disposition after due window.
- **OL-ORDER-02:** verbal/telephone/secure-text order pending read-back/authentication.
- **OL-ORDER-03:** order conflicts with active constraint and no override/resolution exists.
- **OL-ORDER-04:** order lacks indication/problem or accepted exception.
- **OL-ORDER-05:** prerequisite missing or stale: renal function, weight, pregnancy, consent, type/screen, specimen source, imaging prep, isolation context.
- **OL-ORDER-06:** high-risk order missing post-fulfillment monitoring/response evidence.
- **OL-ORDER-07:** duplicate/contradictory active sibling orders.
- **OL-ORDER-08:** protocol/standing-order child lacks traceable protocol/source context.
- **OL-ORDER-09:** PRN administration lacks trigger-satisfaction evidence.
- **OL-ORDER-10:** restraint renewal / face-to-face / reassessment obligation due by policy profile.
- **OL-ORDER-11:** blood-product prerequisite missing or expired (type/screen/crossmatch/compatibility).

## 12. Agent read-before-write context

Before writing or proposing any order, the agent reads:

- `currentState(axis:"subject")` and encounter context from A0a.
- `readActiveConstraints()` / `currentState(axis:"constraints")` for allergies, code status, blood-product restrictions, diet/swallowing restrictions, activity restrictions, communication consent, and other hard constraints.
- `activeProblems()` / `currentState(axis:"problems")` for therapeutic `links.addresses` targets.
- `currentState(axis:"intents")` for active orders, care plans, monitoring plans, referrals, and duplicate/supersession checks.
- A1 labs relevant to renal function, electrolytes, CBC, INR/coagulation, lactate, cultures, drug levels, pregnancy/type-screen where relevant.
- A3 vitals/context: MAP/BP, HR, RR, SpO₂, temperature, oxygen/vent/device context.
- A4 medication ledger for recent administrations, holds, refusals, titrations, and response obligations.
- A5 I&O/LDA state for access, Foley/UOP, drains, enteral access, fluid balance, line placement/removal context.
- A8 exam findings for respiratory effort, neuro status, skin/wounds, pain, swallowing/aspiration risk, restraint risk.
- Recent A6/A7 communications/notes only as narrative context, not as sole structured truth.
- `openLoops()` to avoid duplicating unresolved orders, contradictions, or missing prerequisites.

Agent restrictions:

- The agent may surface recommended orders, draft proposed orders, or write sandbox orders only under delegated policy.
- The agent must not write final clinician orders without an authorized requester/attestation workflow.
- The agent must not use simulator-hidden truth as order rationale.
- The agent must not satisfy an order by writing a note sentence.

## 13. Related artifacts

- **A0a** — subject/encounter identity, baseline age/weight/renal/baseline context.
- **A0b** — active constraints gate order safety.
- **A0c** — active problems are the only default `links.addresses` targets.
- **A1** — lab results are ordered by A9a but owned as observations by A1.
- **A2** — imaging/test/procedure result review closes interpretation loops, not order existence.
- **A3** — vitals/monitoring context drives order prerequisites, triggers, and response evidence.
- **A4** — medication MAR fulfills medication-family orders with actions/dispositions.
- **A4b** — reconciliation assessments may support medication order creation; A9a owns the order shape.
- **A5** — LDA/IO/procedure orders are fulfilled by actions; A5 owns device/volume truth.
- **A6/A7** — notes cite/synthesize orders but do not store executable order truth.
- **A8** — exam findings support nursing/RT/med/procedure order rationale and response evidence.
- **A9b** — order-set/protocol invocation creates/cites groups of A9a child orders.

## 14. Proposed pi-chart slot shape

### Event type + subtype

- **Existing:** `type: intent`, `subtype: order`.
- **No new event type.**
- **New payload shape:** polymorphic `data.order_kind` registry with shared core fields and family-specific nested payloads.

### Payload shape

#### Generic lab order

```jsonc
{
  "id": "evt_20260418T0910_order_lactate",
  "type": "intent",
  "subtype": "order",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T09:10:00-05:00",
  "recorded_at": "2026-04-18T09:11:00-05:00",
  "author": { "id": "md_icu_01", "role": "provider" },
  "source": { "kind": "clinician_chart_action" },
  "certainty": "planned",
  "status": "active",
  "data": {
    "status_detail": "active",
    "order_kind": "lab",
    "orderable": { "display": "Lactate, plasma", "code_system": "local", "code": "LAB_LACTATE" },
    "priority": "stat",
    "timing": { "pattern": "once", "due_by": "2026-04-18T09:40:00-05:00" },
    "indication": { "text": "Concern for septic shock", "indication_exception": null },
    "performer": { "service": "lab" },
    "expected_fulfillment": {
      "action_subtype": "specimen_collection",
      "result_owner": "A1",
      "review_owner": "A2"
    },
    "prerequisites": []
  },
  "links": {
    "addresses": ["evt_problem_septic_shock"],
    "supports": [
      { "ref": "vitals://patient_001/enc_001?metric=MAP&from=2026-04-18T08:30:00-05:00&to=2026-04-18T09:10:00-05:00", "kind": "vitals_window", "role": "primary" }
    ]
  }
}
```

#### Norepinephrine infusion/titration order

```jsonc
{
  "id": "evt_20260418T1015_order_norepi",
  "type": "intent",
  "subtype": "order",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T10:15:00-05:00",
  "recorded_at": "2026-04-18T10:16:00-05:00",
  "author": { "id": "md_icu_01", "role": "provider" },
  "source": { "kind": "clinician_chart_action" },
  "certainty": "planned",
  "status": "active",
  "data": {
    "status_detail": "active",
    "order_kind": "medication_infusion",
    "orderable": { "display": "Norepinephrine infusion", "rxnorm_code": "7512" },
    "priority": "stat",
    "medication": {
      "route": "IV",
      "start_rate": { "value": 0.04, "unit": "mcg/kg/min" },
      "titration": {
        "target": { "metric": "MAP", "operator": ">=", "value": 65, "unit": "mmHg" },
        "range": { "min": 0.02, "max": 0.30, "unit": "mcg/kg/min" },
        "step": { "value": 0.02, "unit": "mcg/kg/min", "interval_min": 5 }
      }
    },
    "timing": { "pattern": "continuous", "start": "2026-04-18T10:15:00-05:00" },
    "monitoring_requirements": [
      { "metric": "MAP", "cadence": "q5min_until_stable_then_q15min", "response_window_min": 15 }
    ],
    "expected_fulfillment": { "action_subtype": "titration", "response_evidence": ["A3.vitals_window"] }
  },
  "links": { "addresses": ["evt_problem_septic_shock"], "supports": ["evt_assessment_hypotension"] }
}
```

#### Verbal/secure-text order capture

```jsonc
{
  "id": "evt_20260418T1040_order_abg_verbal",
  "type": "intent",
  "subtype": "order",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_at": "2026-04-18T10:40:00-05:00",
  "recorded_at": "2026-04-18T10:42:00-05:00",
  "author": { "id": "rn_07", "role": "rn" },
  "source": { "kind": "nurse_charted", "ref": "telephone_readback" },
  "certainty": "reported",
  "status": "active",
  "data": {
    "status_detail": "active",
    "order_kind": "lab",
    "orderable": { "display": "Arterial blood gas" },
    "priority": "stat",
    "authoring_channel": "telephone",
    "requester": { "id": "md_icu_01", "role": "provider" },
    "read_back": { "performed": true, "performed_by": "rn_07", "at": "2026-04-18T10:41:00-05:00" },
    "authentication": { "status": "pending", "due_by": "2026-04-18T22:40:00-05:00" },
    "timing": { "pattern": "once", "due_by": "2026-04-18T11:00:00-05:00" },
    "expected_fulfillment": { "action_subtype": "specimen_collection", "result_owner": "A1" }
  },
  "links": { "supports": ["evt_phone_note_1040"] }
}
```

#### PRN medication order

```jsonc
{
  "id": "evt_20260418T1120_order_acetaminophen_prn",
  "type": "intent",
  "subtype": "order",
  "subject": "patient_001",
  "encounter_id": "enc_001",
  "effective_period": { "start": "2026-04-18T11:20:00-05:00" },
  "recorded_at": "2026-04-18T11:21:00-05:00",
  "author": { "id": "md_icu_01", "role": "provider" },
  "source": { "kind": "clinician_chart_action" },
  "certainty": "planned",
  "status": "active",
  "data": {
    "status_detail": "active",
    "order_kind": "medication",
    "orderable": { "display": "Acetaminophen 650 mg PO/NG" },
    "medication": { "dose": { "value": 650, "unit": "mg" }, "route": "PO_or_NG" },
    "prn": true,
    "trigger_ref": "assessment://fever_or_pain",
    "trigger_text": "PRN fever > 38.0 C or mild pain",
    "timing": { "pattern": "q6h_prn", "max_daily_dose_mg": 3000 },
    "expected_fulfillment": { "action_subtype": "administration", "requires_trigger_satisfied_by": true }
  },
  "links": { "supports": ["evt_assessment_fever"] }
}
```

#### Blood product prepare + transfuse order pair

```jsonc
[
  {
    "id": "evt_order_prbc_prepare",
    "type": "intent",
    "subtype": "order",
    "subject": "patient_001",
    "encounter_id": "enc_001",
    "effective_at": "2026-04-18T12:00:00-05:00",
    "recorded_at": "2026-04-18T12:01:00-05:00",
    "author": { "id": "md_icu_01", "role": "provider" },
    "source": { "kind": "clinician_chart_action" },
    "data": {
      "status_detail": "active",
      "order_kind": "blood_product_prepare",
      "orderable": { "display": "Prepare 1 unit pRBC; type and screen/crossmatch" },
      "timing": { "pattern": "once", "due_by": "2026-04-18T13:00:00-05:00" },
      "expected_fulfillment": { "action_subtype": "specimen_collection", "result_owner": "A1", "review_owner": "A2" }
    }
  },
  {
    "id": "evt_order_prbc_transfuse",
    "type": "intent",
    "subtype": "order",
    "subject": "patient_001",
    "encounter_id": "enc_001",
    "effective_at": "2026-04-18T12:05:00-05:00",
    "recorded_at": "2026-04-18T12:06:00-05:00",
    "author": { "id": "md_icu_01", "role": "provider" },
    "source": { "kind": "clinician_chart_action" },
    "data": {
      "status_detail": "active",
      "order_kind": "blood_product_transfuse",
      "orderable": { "display": "Transfuse 1 unit pRBC" },
      "prerequisites": [{ "ref": "evt_order_prbc_prepare", "kind": "order", "status_required": "fulfilled_or_available" }],
      "expected_fulfillment": { "action_subtype": "transfusion" }
    },
    "links": { "supports": ["evt_order_prbc_prepare"] }
  }
]
```

### Link conventions

- `links.supports` — evidence/prerequisites: vitals windows, labs, exam findings, assessments, constraints read, communications, protocol/source artifacts.
- `links.addresses` — active problem targets only. Prophylaxis/screening/admin/protocol exceptions require `data.indication_exception` or equivalent nested indication exception.
- `links.fulfills` — downstream actions fulfill orders; orders do not fulfill anything.
- `links.supersedes` — order replacement, cancellation, discontinuation, or meaningful change.
- `links.corrects` — entered-in-error or factual correction.
- `links.resolves` — actions/assessments can resolve order-related openLoops such as authentication pending or prerequisite missing.

### Evidence addressability

- **Event id** for individual orders.
- **Virtual occurrence key** only if accepted for family-specific due occurrences; default A9a does not require it.
- **Parent/child references** for A9b order-set invocation later; A9a child orders remain ordinary event ids.
- **Artifact id / note id** only as supporting evidence, never as order truth.

### Storage placement

`events.ndjson` — orders are atomic structured events. No separate orders file or active-order list.

### Frequency class

Event-driven, scheduled, conditional, one-shot, periodic, and interval-shaped depending on payload.

### View consumers

`timeline`, `currentState`, `evidenceChain`, `openLoops`, `trend` indirectly via response evidence, `narrative` indirectly through A6/A7 notes.

### Schema confidence

- **High:** `intent.order` as atomic order; action-mediated fulfillment; active orders derived; no CPOE UI storage.
- **Medium:** `data.order_kind` registry and shared conditional/expected-fulfillment payload.
- **Low/Open:** generalized occurrence identity, discontinuation-as-order vs supersession-only, cross-family conditional schema, order-set parent reference before A9b.

### Schema impact

`new payload shape` only. No new event type, storage primitive, source kind, link kind, or default view axis.

## 15. Validator and fixture implications

### Validator rules

- **V-ORDER-01 — Minimum executable order.** `intent.order` requires `subject`, `encounter_id`, `author/requester`, `source.kind`, `effective_at`, `recorded_at`, `data.status_detail`, `data.order_kind`, `data.orderable`, and `data.timing` or explicit immediate/one-time semantics. Severity: error.
- **V-ORDER-02 — Authorized requester.** Non-draft orders require an authorized requester/ordering practitioner or an explicit delegated/protocol profile. Severity: error.
- **V-ORDER-03 — Constraint gate.** Medication, blood, diet, contrast, restraint, isolation-affecting, and procedure orders must read active constraints; conflicts block or require structured override and support evidence. Severity: profile error/warn.
- **V-ORDER-04 — Indication discipline.** Therapeutic orders require `links.addresses` to an active problem or `data.indication.indication_exception`. Severity: warning live, error in replay/finalization.
- **V-ORDER-05 — Fulfillment topology.** `links.fulfills` must not appear on observations, assessments, communications, notes, or orders. Only downstream actions fulfill orders. Severity: error.
- **V-ORDER-06 — Expected fulfillment.** Result-producing orders require `data.expected_fulfillment.action_subtype`; otherwise `openLoops()` cannot derive missing collection/acquisition/performance. Severity: warning live, error replay.
- **V-ORDER-07 — Verbal/text authentication.** `data.authoring_channel ∈ {verbal, telephone, secure_text}` requires requester, read-back/receipt metadata as applicable, and authentication status/due_by or an OL-ORDER-02. Severity: error/replay; openLoop live.
- **V-ORDER-08 — Append-only lifecycle.** No in-place mutation of order payload/status. Change/cancel/discontinue must write a superseding/correcting event. Severity: error.
- **V-ORDER-09 — Family payload completeness.** Medication/fluid orders require dose/rate/route/schedule; labs require specimen/orderable/timing where applicable; imaging requires modality/body site/contrast where applicable; procedures/LDA require site/device/procedure family where applicable. Severity: profile error.
- **V-ORDER-10 — No active-order storage.** Generated active-order lists are disposable; committing a mutable active-orders file fails fixture validation. Severity: error.
- **V-ORDER-11 — PRN trigger evidence.** PRN admin requires trigger-satisfaction evidence or creates `OL-ORDER-09`. Severity: live openLoop; replay warning/error by profile.
- **V-ORDER-12 — Restraint cadence.** Restraint orders must respect profile/regulatory time window and renewal rules. Severity: live openLoop/block; replay error.
- **V-ORDER-13 — Blood prerequisite.** Transfuse order requires valid prepare/type-screen/crossmatch prerequisite or creates missing/stale prerequisite loop. Severity: live openLoop; replay error by profile.

### Minimal fixture

1. **STAT lactate/CBC/BMP/ABG order** — fulfilled by specimen collection, resulting A1 lab observations, and A2 review.
2. **CXR order** — fulfilled by imaging acquisition, diagnostic artifact/result, and result review.
3. **Ceftriaxone or broad-spectrum antibiotic order** — active constraint check and A4 administration fulfillment.
4. **Norepinephrine infusion/titration order** — A4 titration epochs and A3 MAP response windows.
5. **Oxygen escalation / RT order** — fulfilled by RT/nursing intervention and A3/A8 response evidence.
6. **Foley or central-line placement/removal order** — fulfilled by `action.procedure_performed`; A5 context segment opens/closes.
7. **NPO/diet or VTE prophylaxis order** — demonstrates prophylaxis/indication exception and constraint checks.
8. **Verbal/telephone/secure-text order** — pending authentication openLoop, later resolved.
9. **Discontinue/hold order** — supersedes prior active order and proves append-only lifecycle.
10. **Blood-product prepare/transfuse pair** — only if clinically justified in fixture; proves prerequisite handling without a transfusion module.
11. **Protocol-derived child order placeholder** — ordinary `intent.order` with protocol reference, leaving parent invocation to A9b.

## 16. Open schema questions

Durable home: `clinical-reference/phase-a/a9a-open-schema-entries.md`.

Primary A9a open-schema questions:

1. **a9a-canonical-subtype** — confirm `intent.order` + `data.order_kind` vs split subtypes; lean single subtype.
2. **a9a-order-kind-registry** — closed enum vs profile-registered enum.
3. **a9a-verbal-order-metadata** — payload-level `data.authoring_channel` + read-back/authentication; no new event/link/source by default.
4. **a9a-order-lifecycle-discontinue-cancel** — supersession/status_detail vs explicit `action.cancel` for pre-fulfillment voids.
5. **a9a-occurrence-identity** — parent-order-only fulfillment vs generalized virtual occurrence keys beyond A4 `meddose://`.

Additional durable entries retained because they affect A4/A8/A9b boundaries:

- **a9a-prn-trigger-shape** — `data.trigger_ref`/`data.trigger_text`; admin action carries `data.trigger_satisfied_by`.
- **a9a-conditional-hold-titration-payload** — shared conditional schema for PRN, hold, titration, prerequisites, and monitoring requirements.
- **a9a-result-fulfillment-pathway** — strict ADR 003 action-mediated closure.
- **a9a-blood-product-order-shape** — prepare/transfuse split vs single phased order.
- **a9a-restraint-order-shape** — regulation-bounded order with renewal via supersession/profile.
- **a9a-monitoring-order-vs-monitoring-plan** — task-like monitoring order vs cadence/coverage plan.
- **a9a-indication-exception-shape** — prophylaxis/screening/protocol/admin exception without weakening `links.addresses`.
- **a9a-protocol-standing-order-boundary** — A9a child slot vs A9b invocation.
- **a9a-isolation-and-code-status-boundaries** — isolation/code/POLST remain A0a/A0b constraints, not ordinary A9a orders.
- **a9a-source-kind-channel-boundary** — authoring channel as payload/source-ref metadata vs source-kind expansion.

## 17. Sources

- pi-chart Phase A Charter v3.1 — function-first research, primitive discipline, schema entropy, canonical/derived/rendered boundary, decision test, output budget.
- pi-chart Phase A Template v3.1 — mandatory 17-section artifact shape and durable open-schema question shape.
- pi-chart Phase A Execution Plan v3.2 — Batch 3 A9 split; A9a individual order primitive; A9b orderset invocation model.
- pi-chart live repo: README, DESIGN, CLAIM-TYPES, ROADMAP, ADR 003 fulfillment by intermediate action, ADR 005 interval primitive, ADR 006 source-kind taxonomy, ADR 009 link semantics, ADR 010 EvidenceRef roles, ADR 011 transform/activity provenance, ADR 016 broad EHR skeleton.
- Prior Phase A synthesis artifacts: A0a, A0b, A0c, A3, A4, A4b, A5, A6, A7, A8.
- CMS eCFR 42 CFR § 482.24 — Medical record services: dated/timed/authenticated entries, orders, standing orders/order sets/protocols, record contents.
- CMS eCFR 42 CFR § 482.23 — Nursing services: orders, drugs/biologicals, verbal orders, patient self-administration.
- CMS eCFR 42 CFR § 482.25 — Pharmaceutical services: medication-error minimization, drug control, auto-stop, adverse reaction reporting, drug-information availability.
- The Joint Commission Online, June 5, 2024 — secure text orders and CPOE-preferred order-entry guidance.
- ONC/ASTP SAFER Guide: Computerized Provider Order Entry with Decision Support.
- Leapfrog Group CPOE Evaluation Tool and 2025 guidance.
- HL7 FHIR Request pattern, ServiceRequest, MedicationRequest, DeviceRequest, Task/Workflow pattern as interoperability witnesses only.
- Johns Hopkins Armstrong Institute VTE prevention strategies and related smart-order-set implementation literature.
- AHRQ VTE prevention protocol implementation guide and public order-set/CDS implementation examples.
