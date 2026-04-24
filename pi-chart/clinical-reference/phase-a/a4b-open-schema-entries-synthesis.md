# A4b entries for OPEN-SCHEMA-QUESTIONS.md — synthesis

*Council note:* The council split was useful here. Claude pressed for precise list-snapshot and transition-batch mechanics. GPT pressed for source-kind restraint, patient-facing discharge communication, and not letting reconciliation become a hidden medication-state module. The synthesis keeps the competition productive and patient-safety oriented.

Drop under a `## A4b. Medication reconciliation & home medication list` heading in the durable file.

---

## A4b. Medication reconciliation & home medication list

### A4b-Q1 `a4b-homemed-addressability` — Home-medication-list item addressability

- **Question:** `observation.home_medication_list.data.items[]` carries multiple medication items per snapshot, but reconciliation decisions must point to individual items stably. How should item-level addressability work without turning every home-med item into a standalone event?
- **Context:** This mirrors A3-Q1 (`vitals://` / sample-window addressability) and A4-Q1 (`meddose://` dose-occurrence addressability). Phase A keeps finding the same substrate pattern: a dense or list-shaped substrate needs stable sub-claim references without materializing every sub-claim as an event. For A4b, the problem is sharper because list snapshots are superseded: a patient remembers another medication, pharmacy callback corrects a dose, or outside records contradict the first interview. Reconciliation decisions must survive reordering and still cite the right item.
- **Options:**
  1. **Positional reference** — `{list_event_id, item_index}`. Simple, but brittle if items reorder or a superseding snapshot changes list organization.
  2. **Stable item keys** — each item carries `item_key`, and references use `{list_event_id, item_key}`. Works in v0.2 with minimal schema change; needs a validator for uniqueness and author/ingest discipline.
  3. **Deterministic URI** — `homemed://<list_event_id>#<hash(normalized_medication,dose,route,frequency)>`. Aligns with A3/A4 addressability patterns; requires medication-name normalization and dose/frequency canonicalization.
  4. **Per-item events** — each home medication becomes `observation.home_medication_item`. Clean reference semantics; inflates event count and weakens the list-as-snapshot claim.
- **Researcher's lean:** **Option 2 in v0.2** with `V-RECON-07` requiring `item_key` uniqueness within a list. **Option 3 is the long-term target** when A3/A4/A4b addressability can be resolved in one ADR. Reject Option 4 unless fixtures prove list-level supersession causes unacceptable churn.

### A4b-Q2 `a4b-list-shaped-observation` — Home/discharge medication list as observation with `items[]`

- **Question:** Is `observation.subtype = home_medication_list` with `data.items[]` an acceptable observation shape, or does a medication list need a new primitive/event type?
- **Context:** Observations in pi-chart are often scalar or compact structured claims, while home-med and discharge-med lists are list-shaped snapshots. This is a precedent. It will likely affect `observation.discharge_medication_list`, A5 I&O line-item logs, and possibly A8 structured assessment lists. The schema-entropy budget strongly resists a seventh event type, but the list-shaped payload should not sneak in without being named.
- **Options:**
  1. **Keep list-shaped observation.** `observation.home_medication_list` and `observation.discharge_medication_list` carry `data.items[]`; list snapshot is the supersession unit.
  2. **New event type** — `type: medication_list` or generic `type: list`. Gives type-level distinction, but violates schema-entropy discipline for little gain.
  3. **Per-item observation events** — each item is an event grouped by a list id. Better per-item supersession, worse event volume and weaker batch completeness anchoring.
  4. **Hybrid** — list observation plus optional per-item events for corrections. Most expressive; most mechanism.
- **Researcher's lean:** **Option 1.** The list snapshot is the clinical object being verified and superseded. Item-level addressability is solved by Q1 rather than eventizing every item. Document this as a deliberate precedent so future list-shaped observations do not proliferate ad hoc.

### A4b-Q3 `a4b-medication-current-state-axes` — Cross-artifact `currentState` axis pattern

- **Question:** Should `currentState` gain medication-related axes such as `axis:"home_medications"` and `axis:"medications"`, and should this be resolved together with A3’s proposed `axis:"context"`?
- **Context:** A4b’s most common read is “what is the current home medication state?” A4’s most common read is “what active medication intents exist?” A3’s active context question has the same shape: a common, derivable state set that agents need before writing. Resolving each artifact independently risks axis drift; resolving them together yields a substrate-level pattern.
- **Options:**
  1. **Add all common axes in one ADR** — e.g., `context`, `medications`, `home_medications`. Clean and consistent with existing `currentState` dispatch.
  2. **Fold into `axis:"all"` only.** Avoids new axis values but makes specific reads awkward and bloats “all.”
  3. **Dedicated helpers** — `activeContext()`, `activeMedications()`, `activeHomeMeds()`. More named APIs; effectively expands the view primitive set.
  4. **Do nothing.** Consumers walk events manually; boilerplate and drift proliferate.
- **Researcher's lean:** **Option 1.** Resolve A3/A4/A4b axes in one ADR. Rule of thumb: if the query is “what is currently true on this axis?” it belongs in `currentState`; if it requires cross-axis reasoning, keep it as `openLoops`, `trend`, `evidenceChain`, or a domain-specific view.

### A4b-Q4 `a4b-external-retrieval-source-kinds` — Outside-records / pharmacy / HIE provenance

- **Question:** Home medication items are sourced from patient report, caregiver report, pill bottles, outpatient pharmacy, outside records, prior chart, or HIE-style retrieval. Should outpatient pharmacy and outside-record retrieval become canonical `source.kind` values?
- **Context:** ADR 006’s registry currently handles `patient_statement`, clinician/nurse charting, imports, and existing interface/device origins, but not active external medication-history retrieval as a first-class source. A4 had the analogous smart-pump/ADS problem. A4b can carry item-level `source_subtype` for v0.2, but the provenance of the retrieval event itself may eventually need a canonical source kind.
- **Options:**
  1. **Add specific source kinds** — `outpatient_pharmacy_retrieval`, `outside_records_retrieval`, `hie_retrieval`. Precise; increases registry size.
  2. **Add one broad source kind** — `external_retrieval` with subtype discriminator. Smaller registry; less searchable by kind.
  3. **Keep existing taxonomy in v0.2** — use `source.kind: clinician_chart_action | nurse_charted | patient_statement | synthea_import | mimic_iv_import`, and carry detail in `source.ref`, `data.items[].source_subtype`, `artifact_ref`, and `communication` evidence.
  4. **Defer entirely to Phase B interop.** Lowest schema churn; weakest provenance modeling.
- **Researcher's lean:** **Option 3 for v0.2**, with Option 1 or 2 considered in a single ADR 006 amendment that also resolves A4 device-source questions. Phase A should document the need, not casually invent source kinds inside A4b.

### A4b-Q5 `a4b-reconciliation-lifecycle-and-discharge-closure` — Supersession scope, discrepancy closure, and discharge communication

- **Question:** How should reconciliation decisions close and supersede across transitions? A home medication may be continued at admission, continued at transfer, and resumed at discharge. Those are separate transition decisions. But new information inside the same transition may correct an earlier decision. Discharge adds a second closure requirement: the medication plan must be communicated to the patient/caregiver, not merely computed.
- **Context:** This question merges two council concerns. Claude’s draft correctly separated transition batches and same-transition supersession. GPT’s draft correctly insisted that patient-facing discharge instructions are canonical communication, not just rendered handout UI. The substrate needs a lifecycle rule that preserves per-transition auditability while allowing corrections and ensuring discharge communication is represented.
- **Options:**
  1. **Strict within-transition supersession.** Admission decisions supersede only admission decisions; transfer and discharge decisions are independent. Discharge closure requires both `observation.discharge_medication_list` and `communication.discharge_med_instructions`.
  2. **Permissive cross-transition supersession.** Later transition decisions can supersede earlier ones. Easier graph but weakens per-transition audit trail.
  3. **Implicit transition separation only.** Use `data.transition` and leave supersession to author judgment. Flexible; validator weaker.
  4. **Batch event/episode primitive.** Introduce a reconciliation episode object that owns all per-item decisions and communications. Expressive; schema-entropy cost.
- **Researcher's lean:** **Option 1.** Strict within-transition supersession preserves auditability. Cross-transition batches are independent claims. Discharge reconciliation is incomplete until the discharge medication list exists and the patient/caregiver communication event supports it. No new link kind is needed: tasks close through `action.reconciliation_resolved.links.fulfills`; discharge communication supports the discharge list/complete assessment; open-loop closure is view-layer logic.
