# A4 entries for OPEN-SCHEMA-QUESTIONS.md — synthesis

Synthesized from Claude's A4 open-schema set and GPT's first-pass A4 addendum. Drop under a `## A4. MAR (Medication Administration Record)` heading in the durable file.

---

## A4. MAR (Medication Administration Record)

### A4-Q1 `a4-dose-occurrence-and-cardinality` — Dose occurrence identity and fulfillment cardinality

- **Question:** How should a medication action identify the specific scheduled/expected dose occurrence it accounts for, and can one action fulfill more than one medication-related intent?
- **Context:** A q6h antibiotic order is one `intent.order`, but it creates many due obligations. `links.fulfills: [order_id]` alone cannot tell whether the 0800, 1400, or 2000 dose was administered, late, duplicated, held, refused, or omitted. Claude's A4 separately surfaced the question of whether one `action.administration` can fulfill multiple orders; GPT's A4 surfaced scheduled-dose occurrence identity. These are coupled: once dose occurrences become addressable, the substrate can distinguish parent-order fulfillment, due-dose fulfillment, protocol-child fulfillment, and care-plan support without duplicating administration actions. This mirrors A3-Q1's stream-window identity problem: the substrate needs addressability without materializing every derived row.
- **Options:**
  1. **Virtual occurrence key + parent order link.** `openLoops()` derives deterministic keys such as `meddose://<order_id>?due_at=<iso>`. The action carries `data.dose_occurrence_key` and `links.fulfills: [order_id]`. Clean schedule accounting; no child events.
  2. **Materialized child intents.** Each due dose becomes a child `intent.medication_dose` or `intent.order` instance. Explicit and linkable; high event volume and supersession churn when schedules change.
  3. **Action-only scheduled_due_at.** Administration records `data.scheduled_due_at`; matching stays heuristic. Simpler but weaker for evidence chains, correction, and duplicate resolution.
  4. **Permissive multi-intent fulfillment.** `links.fulfills` may include parent order, PRN order, protocol child, and/or orderset child. Powerful but risks one action appearing to complete unrelated plans.
  5. **Strict 1:1 fulfillment.** Every disposition action fulfills exactly one order/dose occurrence; related protocol/care-plan state uses `supports` / `addresses`. Clean but can force awkward duplicate or omission events.
- **Researcher's lean:** **Option 1 + Option 5 (strict dose-occurrence fulfillment; sibling intents via `addresses`).** An `action.administration` carries `data.dose_occurrence` = `meddose://<encounter>/<order_id>/<due_at>` and `links.fulfills: [<order_id>]` — fulfilling **exactly one** dose occurrence on **exactly one** order. Parent care-plans, orderset children, and protocol contexts that the administration supports are cited via `links.addresses` (intent-family) or `links.supports` (evidence-family), never via `links.fulfills`. This prevents the duplicate-order masking failure mode where two sibling medication orders (e.g., a cross-covered handoff that results in two heparin orders for the same patient) silently both appear fulfilled by a single nurse administration. If two sibling medication orders look like they could both be satisfied by one dose, that is a reconciliation/supersession problem for A4b, not a cardinality permission for A4. **V-MAR-07 is an error, not a warn:** `links.fulfills` on a disposition action must have cardinality exactly 1 and must target a medication `intent.order`. Option 4 (permissive multi-intent fulfillment) is rejected. Option 2 (materialized child intents) is rejected on event-volume grounds. Revisit via a Phase B episode object (Option 3's spirit) only if orderset / titration-protocol fixtures prove Option 5 forces awkward workarounds.

### A4-Q2 `a4-device-authored-dispositions` — Device-authored dispositions and pump telemetry

- **Question:** When automated dispensing systems, barcode medication administration, or smart pumps produce medication data, do they emit canonical `action.administration` / `action.titration` events, serve as `source.ref` / artifact evidence on clinician-authored events, or require separate device-action subtypes?
- **Context:** Device data is truthful and time-stamped, but not all device events are clinical administration. Pulling a dose from Pyxis is not the same as administering it. A barcode scan corroborates the bedside action but does not by itself prove the patient received the drug. A smart pump controlling a continuous infusion may, however, be the most truthful source for rate intervals. This question also touches ADR 006 source-kind discipline: `smart_pump` and `automated_dispensing_system` are not currently canonical source kinds unless the owner amends the registry.
- **Options:**
  1. **Device-authored placeholders; clinician events supersede.** ADS/BCMA/pump writes provisional actions; nurse/provider action supersedes or completes them. Strong audit trail; noisy and requires many lifecycle rules.
  2. **Device telemetry as evidence only.** Device facts live in `source.ref`, artifact refs, or supporting evidence; clinician-authored action is the only canonical administration. Clean clinical record; loses independent device-authored action timing.
  3. **Separate `action.dispensation` subtype for ADS.** Pyxis/Omnicell emits dispensation; administration fulfills/relates to it. Expressive but high schema cost for a supply-chain step.
  4. **Smart-pump-specific canonical intervals.** Pump emits `action.titration` / infusion intervals; nurse verification is an attestation action/payload. Strong for continuous infusions; requires source-kind and reconciliation rules.
  5. **External operational artifact only.** Device logs remain outside the chart unless specifically attached as `artifact_ref`. Minimal substrate; weak for simulation and audit.
- **Researcher's lean:** **Option 2 for ADS/BCMA, Option 4 for smart pumps once device provenance is formalized.** Dispensing and barcode scan are supporting evidence for nurse/provider action; the pump may be the infusion for continuous-rate truth. Do not add `action.dispensation` in Phase A unless controlled-substance or supply-chain fixtures prove clinical necessity.

### A4-Q3 `a4-response-obligation-closure` — Medication response obligations and loop closure

- **Question:** Where should medication-specific post-administration reassessment requirements live, and how should a response assessment close the monitoring loop?
- **Context:** Many medications create required follow-up: pain reassessment after opioid, RR/sedation/SpO₂ after sedative, BP after antihypertensive, glucose after insulin, MAP after pressor titration, urine output after diuretic, adverse-reaction monitoring after antibiotic. Claude's A4 framed this as whether `assessment.response` carries `links.fulfills` to the administration action. GPT's A4 framed it as where response obligations originate: order, action, generated monitoring intent, or policy logic. The closure rule affects OL-MAR-02 and may require an ADR 003 amendment if `fulfills` widens beyond action→intent.
- **Options:**
  1. **Order-level response requirements.** Medication order carries `data.monitoring_requirements`; every administration derives follow-up from it. Good for scheduled and protocolized therapy; less explicit for one-off exceptions.
  2. **Action-level response obligation.** Each administration carries `data.response_obligation`. Explicit and local; repetitive.
  3. **Generated monitoring intent.** Administration creates a child `intent.monitoring_plan` or follow-up intent addressing the administration/order. Clear open-loop target; more events.
  4. **Derived local-policy logic only.** View layer knows opioid→pain reassessment, insulin→glucose, etc. Minimal chart burden; opaque to agents and hard to audit/version.
  5. **Closure via widened `links.fulfills`.** `assessment.response.links.fulfills: [<action.administration_id>]`. Direct closure but changes fulfillment semantics.
  6. **Closure via `links.resolves` or evidence-overlap.** Response assessment cites evidence in `supports` and either `resolves` the administration/loop or OL-MAR-02 closes by evidence-window overlap. Preserves action→intent meaning of `fulfills`.
- **Researcher's lean:** **Hybrid origin + conservative closure.** Use order-level response requirements for persistent rules; generate concrete monitoring intents for high-risk or event-specific loops; use action-level obligations for ad hoc/emergency doses. For closure, prefer `links.resolves` if ADR 009 is available, or evidence-overlap as fallback. Widening `fulfills` is elegant but should wait for owner approval because it touches ADR 003.

### A4-Q4 `a4-titration-interval-episode` — Titration / infusion interval and episode model

- **Question:** Should titratable and continuous infusions be represented as interval-shaped action events, point-event rate changes with derived intervals, or a distinct episode/grouping primitive?
- **Context:** A norepinephrine drip at 0.08 mcg/kg/min from 09:15 to 09:45 is not a momentary event; it is an exposure interval. Similar shapes appear for insulin drips, propofol, continuous paralytics, PCA basal rates, heparin, fluids, and antibiotics. Claude's A4 correctly identified this as the first strong pressure to extend ADR 005 to action-type intervals. GPT's A4 additionally raised grouping: many rate epochs may need to be understood as one administration episode without creating a new event type.
- **Options:**
  1. **Extend ADR 005 to `action.titration` / interval administrations.** Each stable rate epoch is an interval action; rate change closes/supersedes prior interval. Natural and compact.
  2. **Point events with derived intervals.** Each rate change is a point action; views reconstruct intervals. Avoids ADR 005 change but pushes duration logic into views.
  3. **Optional `administration_episode_id`.** Keep interval actions but group them by one drip/order/protocol run. Minimal grouping surface.
  4. **Pump telemetry as `observation.device_reading` + sparse human action intervals.** Good when dense pump data exists; must reconcile with canonical human actions.
  5. **New `infusion` event type or episode primitive.** Strong grouping; high schema cost and violates primitive discipline unless later proven necessary.
- **Researcher's lean:** **Option 1 + Option 3.** Extend ADR 005 with a narrow action-interval allow-list (`action.titration`, possibly `action.continuous_infusion`) and allow optional `administration_episode_id` for grouping. Add Option 4 when smart-pump integration lands. Reject a new event type in Phase A.

### A4-Q5 `a4-attestation-waste-boundary` — Partial dose, waste, verification, and attestation boundary

- **Question:** How should pi-chart represent partial administrations, controlled-substance waste, pharmacy verification, high-alert independent double checks, and witnesses/cosigns without turning MAR into a full inventory/compliance module?
- **Context:** Real MAR workflows often include partial vial use, waste with witness, two-RN independent checks, pharmacist verification, or cosignature for high-risk therapy. The clinical chart must preserve what reached the patient and why high-risk administration was safe. Operational inventory and legal waste ledgers may exist outside the chart. If all attestation is stuffed into free text, safety evidence disappears. If every witness becomes a new event type, A4 drifts toward EHR-module sprawl.
- **Options:**
  1. **Single action payload.** `action.administration.data` carries administered dose, prepared dose, optional waste, verification, and `attestations[]`. Compact and Phase-A-friendly.
  2. **Separate action subtypes.** `action.waste`, `action.attestation`, `action.verification` are independently linkable claims. Strong audit trail; more schema and grouping pressure.
  3. **Clinical chart + external artifact.** Administration carries dose given and an `artifact_ref` to external waste/log when material. Avoids inventory modeling but weaker native reasoning.
  4. **Only administered dose canonical.** Waste/checks stay outside pi-chart. Too weak for high-alert/controlled-substance fixtures.
  5. **Policy-profile driven.** Core schema allows payload/attestation; profile decides when witness/pharmacy verification is required. Flexible, but validator depends on profile layer.
- **Researcher's lean:** **Option 1 + Option 5 for Phase A, with Option 3 for external controlled-substance logs.** Keep administered dose canonical and allow compact `waste` + `attestations[]`; treat pharmacy/high-alert/waste requirements as policy-profile validators. Promote to separate action subtypes only if A4/A9 fixtures prove the witness/verification itself must be independently queried as a first-class claim.

### Inline dependency `a4-order-discriminator` — defer to A9a

- **Question:** Should medication orders be `intent.subtype = order` with `data.order_kind = "medication"`, or should A9a split order subtypes such as `medication_order`, `therapy_order`, `diet_order`, `consult_order`, and `procedure_order`?
- **Context:** Claude's A4 correctly surfaced this. The choice cascades into validator namespaces and schema entropy. A4 needs a working shape but A9a is the artifact with the broader order-family view.
- **Researcher's lean:** **Defer to A9a; do not block A4.** Working assumption for A4 is `intent.subtype = order` + `data.order_kind = medication`. If A9a chooses split subtypes, migration is a mechanical rename and payload preservation.
