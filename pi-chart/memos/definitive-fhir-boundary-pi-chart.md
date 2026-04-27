# Definitive Minimum Viable FHIR Boundary for pi-chart Workstream A

**Status:** Adopted design artifact for Workstream A planning; adapter implementation deferred until the memory-proof fixture/export tests exist.  
**Scope:** pi-chart clinical-memory proof surface only.  
**Target FHIR version:** HL7 FHIR R4 / 4.0.1 for the first adapter contract.  
**Core rule:** FHIR is a read/export boundary. It is never pi-chart's internal ontology, storage model, view model, or write API.

---

## 0. Decision summary

The Workstream A minimum viable FHIR boundary is:

1. **Composition** — the six-section memory-proof document skeleton.
2. **Observation** — vitals, exam findings, structured assessments, and lab results.
3. **ServiceRequest** — orders, requested interventions, pending loops, and intent anchors.
4. **DocumentReference** — notes, narrative charting, handoff artifacts, external artifacts.
5. **Provenance** — author/source/transform/evidence/revision lineage for every projected clinical resource.

**Bundle** and **Patient** are infrastructure, not counted as semantic boundary resources. The export should be a **Bundle.type = document** with `Composition` as entry 0. A minimal synthetic `Patient` stub should be included only as the subject anchor required for a validator-friendly FHIR document. Actor references such as clinician, agent, device, lab, and organization may be logical `Reference.identifier` values by default; resolvable Practitioner/Device/Organization resources are optional implementation conveniences, not part of the Workstream A resource boundary.

**AuditEvent is not part of the clinical projection boundary.** It is a companion operational/export log resource. Emit it outside the canonical clinical document Bundle for export/import/access/fingerprint events. Do not let AuditEvent carry clinical lineage; that is Provenance's job.

**Recommendation split:**

- **Adopt now:** the five-resource semantic boundary above, the document Bundle shape, the field/link mapping, and the Provenance/AuditEvent split.
- **Research more:** only profile details that do not change the resource set: canonical pi-chart CodeSystems, exact `contradicts` extension shape, and formal fingerprint canonicalization.
- **Defer until adapter implementation:** write-back/import semantics, a public FHIR API, pharmacy-specific resources, Task/CarePlan workflows, Encounter/ADT, DiagnosticReport panels, billing/auth/claims/scheduling, and broad CRUD.

---

## 1. Synthesis resolution: what this artifact preserves and changes

The two council reports agreed on the architectural constraint: pi-chart is an append-oriented, provenance-rich clinical memory substrate, while FHIR is an external projection boundary. They disagreed on the final boundary composition. This artifact resolves those disagreements as follows.

| Disagreement | Council position A | Council position B | Definitive resolution |
| --- | --- | --- | --- |
| **Composition** | Include it: Workstream A projection is a FHIR document with six sections. | Exclude it: DocumentReference is thinner and avoids building a FHIR-native document model. | **Include Composition.** It is an export skeleton only. The six-section memory proof is exactly the kind of frozen, coherent, attestable artifact Composition is for. This does not make Composition the internal model. |
| **ServiceRequest** | Defer it to avoid expanding into ordering. | Include it because orders/interventions are one of the six ADR-016 surfaces. | **Include ServiceRequest.** Workstream A cannot credibly cover orders/interventions/open loops using narrative alone. ServiceRequest is the minimum generic request resource and avoids MedicationRequest/Task/CarePlan scope creep. |
| **AuditEvent** | Count it inside the five-resource set for export/import/fingerprint visibility. | Reject it from the clinical projection because it is operational logging, not clinical truth. | **Do not count it inside the clinical boundary.** Emit AuditEvent as an optional companion operational log for export/import/access. This preserves the Provenance/AuditEvent split and keeps the clinical Bundle deterministic. |
| **Patient** | Defer; a simulator persona should not create PHI-shaped overhead. | Include as non-negotiable subject anchor. | **Infrastructure only.** Include a minimal synthetic Patient in the document Bundle when needed for validation, but do not treat Patient as a semantic resource in the Workstream A boundary. |
| **Bundle type** | Use `document`: frozen, attested projection with Composition first. | Use `collection` or `history`: snapshot or event sequence. | **Use `document` for the primary proof.** `history` is deferred to a future resource-version/history export. `collection` is acceptable only for internal smoke tests, not the definitive Workstream A artifact. |
| **Adopt vs research** | Research more before landing. | Adopt now as read-only boundary. | **Adopt now at the boundary-decision level; research profile details; defer adapter implementation.** The resource set should stop moving so Workstream A can design deterministic projection tests. |

---

## 2. Architectural guardrails

1. **FHIR is downstream of pi-chart.** The export adapter reads canonical pi-chart events, notes, artifacts, vitals rows, views, and projection output. It never writes pi-chart memory through FHIR resource semantics.
2. **The chart remains canonical.** Current state is a query over the append-oriented claim stream. FHIR receives a deterministic projection, not authority over the chart.
3. **The projection is self-contained.** The Workstream A export is a document Bundle with all resources needed for review, plus logical identifiers for any external actor/system references that are not material to the proof.
4. **No hidden simulator physiology crosses the boundary.** Only public chart events, monitor outputs, explicit assessment results, labs, notes, orders, handoffs, artifacts, and adapter outputs are eligible.
5. **No broad EHR API is implied.** This is not scheduling, billing, ADT, claims, user auth, patient administration, or hospital CRUD.
6. **FHIR profiles/extensions are boundary metadata only.** Pi-chart-native concepts that have no clean FHIR element must remain pi-chart-native and may be carried only as explicit pi-chart extensions for transparency.

---

## 3. Recommended resource boundary

### 3.1 Counted semantic resources

| Resource | Boundary role | Why it is necessary now | What it must not become |
| --- | --- | --- | --- |
| **Composition** | Root of the Workstream A memory-proof document. | ADR 016 requires one coherent projection answering: what happened, why it mattered, evidence, uncertainty, open loops, and next-shift handoff. Composition sections give those surfaces a stable FHIR envelope. | Not an internal pi-chart composition model; not a replacement for views or event envelopes. |
| **Observation** | Primary discrete clinical assertion resource. | Covers vitals, monitor-derived rows, bedside exam findings, structured assessments, lab values, and result observations. | Not a dumping ground for narrative notes, orders, tasks, or hidden physiology. |
| **ServiceRequest** | Generic request/intent/open-loop anchor. | Covers orders/interventions enough for Workstream A without entering pharmacy, procedure, or workflow engines. Enables `Observation.basedOn` and `ServiceRequest.reasonReference/supportingInfo`. | Not a complete CPOE model; not MedicationRequest; not Task; not a scheduling/order-management API. |
| **DocumentReference** | Narrative and artifact carrier. | Covers notes, communication notes, handoff summaries, agent syntheses, imported documents, artifact pointers, and narrative uncertainty summaries. | Not a substitute for Composition when the export itself needs sections and attestation. Not a place to hide structured data that should be Observation or ServiceRequest. |
| **Provenance** | Clinical lineage and trust resource. | Carries pi-chart author/source/transform/evidence/revision metadata: human vs agent authorship, source channel, transform tool/version/run, input refs, supports, supersedes/corrects, and partial contradiction wrappers. | Not an operational audit trail. Not a read log. Not a replacement for pi-chart's native event graph. |

### 3.2 Infrastructure resources

| Resource | Use | Counted? | Rule |
| --- | --- | --- | --- |
| **Bundle** | Export package. Primary Workstream A proof uses `Bundle.type = document`. | No | Bundle is the transport/container. It is required but not a semantic clinical boundary choice. |
| **Patient** | Subject anchor for Composition and clinical resources. | No | Use a minimal synthetic `Patient` stub when needed for a valid document Bundle. Keep demographics sparse or absent unless the fixture explicitly requires them. |
| **Practitioner / Device / Organization** | Optional actor/source stubs. | No | Default to `Reference.identifier`/`display` for actors. Include stubs only when a validator or reviewer requires resolvable references. |
| **AuditEvent** | Companion operational/export log. | No, for clinical boundary | Emit separately for Bundle export/import/access/fingerprint events. Exclude from canonical clinical fingerprint input. |

---

## 4. Explicitly rejected or deferred resources

| Candidate | Verdict | Reason | Promotion trigger |
| --- | --- | --- | --- |
| **Patient** | Infrastructure only | A synthetic persona anchor is useful, but Patient does not add clinical-memory semantics. Counting it would waste one of the 3–5 boundary slots and introduce PHI-shaped surface area. | External receiver requires resolvable patient demographics; fixture needs demographic facts. |
| **Encounter** | Deferred | Composition.event.period, resource effective times, and pi-chart `encounter_id` preserve the Workstream A shift/window. Encounter would imply ADT/status/location machinery not present in the proof. | Multi-encounter handoff, ADT integration, location/status history. |
| **DiagnosticReport** | Deferred | Workstream A labs can be discrete `Observation` resources with identifiers, performer, source provenance, and `basedOn` links. DiagnosticReport adds report grouping the fixture does not yet need. | Lab panel/report fixture where grouping/report status materially changes interpretation or receiver acceptance. |
| **MedicationRequest** | Deferred | ServiceRequest is enough for generic orders/interventions. MedicationRequest requires pharmacy semantics, dosage vocabularies, and med-specific safety logic beyond Workstream A. | Closed-loop medication ordering proof or MAR/pharmacy integration. |
| **MedicationAdministration** | Deferred, first expansion candidate | Correct resource for actual medication administrations, but it expands Workstream A into MAR/pharmacy. Non-med interventions can be ServiceRequest + Observation/DocumentReference. | Fixture includes medication administration where dose/route/time/performer is central to the proof. |
| **CarePlan** | Deferred | Handoff/care-plan summary is a projection surface, not yet a longitudinal multidisciplinary plan model. Composition + DocumentReference + ServiceRequest covers the proof. | Multi-shift longitudinal care-plan continuity, goals, planned activity references. |
| **Communication** | Deferred | pi-chart communication notes are persistent chart artifacts for the proof. DocumentReference is better for durable narrative. Communication would require sender/recipient workflow semantics. | Fixture needs message delivery state, in-response-to, recipient tracking, or consult/SBAR transmission. |
| **Task** | Deferred | Task is a workflow engine state machine. Workstream A only needs open-loop visibility, which can be represented by ServiceRequest status and Composition sections. | Open-loop execution tracking becomes the actual proof target. |
| **AuditEvent** | Deferred from clinical Bundle; adopted as companion log | AuditEvent records usage/access/export, not clinical generation. Including it inside the clinical document Bundle would make deterministic fingerprints brittle and blur trust semantics. | Implement export/import/read logging; emit as separate operational resource or separate audit Bundle. |
| **Bundle/history** | Deferred for primary proof | History Bundles are query results over resource versions, not the frozen attested memory-proof document. | Future adapter offers version-history export in addition to the Workstream A document proof. |

---

## 5. pi-chart → FHIR mapping table

### 5.1 Event/resource mapping

| pi-chart event or artifact | FHIR projection | Boundary rule |
| --- | --- | --- |
| `subject` | Minimal `Patient` infrastructure stub or logical subject reference | Do not add demographics unless fixture requires them. |
| `encounter` / `encounter_id` | `Composition.event.period`; `meta.tag` or identifier carrying pi-chart encounter id | Do not mint Encounter until ADT/multi-encounter semantics exist. |
| `constraint_set` | Usually native-only; optionally `DocumentReference` for exported constraint narrative | Do not create Condition/CarePlan unless a fixture requires structured constraints. |
| `observation.vital_sign` | `Observation` with category `vital-signs` | Use `code`, `value[x]`, `effective[x]`, `issued`, `performer`/`device`, and Provenance. |
| `observation.exam_finding` | `Observation` with category `exam` or local assessment category | Use coded value when available; otherwise `valueString`. |
| `observation.lab_result` | `Observation` with category `laboratory` | Preserve external lab identifiers; use `performer` and Provenance source entity for lab/interface. |
| `assessment` structured assertion | `Observation` | Default for assessment/problem/trend claims that should participate in evidence links. Use `certainty` extension for inferred/reported. |
| `assessment` narrative synthesis | `DocumentReference` | Use for paragraphs, handoff summaries, or human-readable rationale that would be awkward as `Observation.valueString`. |
| `intent` order/intervention/open loop | `ServiceRequest` | Use for ABG order, oxygen escalation request, reassessment request, pending follow-up, or care-plan intent. |
| `action` that produces a measurable result | `Observation` with `basedOn -> ServiceRequest` where applicable | Example: lab result, reassessment finding, oxygen device setting observation. |
| `action` that only narrates performance | `DocumentReference` plus Provenance; optionally update/derive a ServiceRequest status | This is lossy until Procedure, Task, MedicationAdministration, or Communication is added. |
| `communication` note | `DocumentReference` | Preserve as durable chart artifact; Communication resource deferred. |
| `artifact_ref` | `DocumentReference` | Use `content.attachment.url`/`data`, `type`, `category`, `date`, and Provenance. |
| Deterministic memory proof projection | `Composition` in a `Bundle.type=document` | Composition sections define the six review surfaces. |

### 5.2 Field and time mapping

| pi-chart primitive | FHIR target | Notes |
| --- | --- | --- |
| `id` | `Resource.id`; `identifier`; `meta.tag` with pi-chart event id | Use stable deterministic IDs derived from pi-chart IDs. |
| `type` / `subtype` | Resource choice + `code`/`category` + pi-chart `meta.tag` | Do not create a FHIR resource per pi-chart type. The adapter chooses the FHIR resource by semantics. |
| `subject` | `Resource.subject -> Patient/<synthetic-id>` | Include minimal Patient in document Bundle when needed. |
| `encounter_id` | `Composition.event`/`meta.tag`; optional logical reference | Encounter resource deferred. |
| `effective_at` | `Observation.effectiveDateTime`; `ServiceRequest.authoredOn` for order-time intents; `ServiceRequest.occurrenceDateTime` only when the event means requested performance time; `DocumentReference.context.period.start` for content coverage; `Provenance.occurredDateTime` | Keep clinical/world time distinct from chart commit time. |
| `effective_period` | `Observation.effectivePeriod`; `ServiceRequest.occurrencePeriod`; `DocumentReference.context.period`; `Composition.event.period`; `Provenance.occurredPeriod` | Open intervals remain native unless a close/supersession exists. |
| `recorded_at` | `Observation.issued`; `DocumentReference.date`; `Composition.date`; `Provenance.recorded`; resource `meta.lastUpdated` only as implementation metadata | `Provenance.recorded` is the canonical cross-resource commit-time carrier. Do not confuse with `effective_at`. |
| chart-clock / `asOf` | `Composition.event.period`; pi-chart extension on Composition; fingerprint canonicalization input | FHIR has no native chart-clock; preserve explicitly. |
| `status = draft` | `Composition.status=preliminary`; `Observation.status=registered/preliminary`; `DocumentReference.docStatus=preliminary`; `ServiceRequest.status=draft` | Use resource-native lifecycle where possible. |
| `status = active` | `Observation.status=preliminary/final`; `ServiceRequest.status=active`; `DocumentReference.status=current` | For active inferred claims, prefer preliminary plus certainty extension. |
| `status = final` | `Observation.status=final`; `DocumentReference.docStatus=final`; `Composition.status=final`; `ServiceRequest.status=completed/active` depending event | ServiceRequest finality is status-specific, not document finality. |
| `status = superseded` | `DocumentReference.status=superseded`; `ServiceRequest.replaces` on new request; for Observations use Provenance revision + pi status extension; `entered-in-error` only if the old claim is clinically invalid | FHIR has no clean generic `superseded` status for Observation. |
| `status = entered_in_error` | Resource-native `entered-in-error` where available | Use only for invalid/error claims, not all replacements. |
| `certainty = observed` | Resource status usually final; Provenance human/device source | Observed does not imply human-authored. Device/lab observations can be observed. |
| `certainty = reported` | Preliminary/final depending review; Provenance agent type informant where appropriate; pi certainty extension | Do not overstate as directly observed. |
| `certainty = inferred` | `Observation.status=preliminary` or `DocumentReference.docStatus=preliminary`; pi certainty extension; Provenance Device/software author | No human attester unless actually reviewed. |
| `certainty = planned/performed` | `ServiceRequest.intent/status`; or Observation/DocumentReference for performed evidence | Do not force all actions into ServiceRequest. |

### 5.3 Author, source, and transform mapping

| pi-chart primitive | FHIR target | Notes |
| --- | --- | --- |
| `author.id` | `Provenance.agent.who.identifier` or `.reference`; also `Observation.performer`, `DocumentReference.author`, `ServiceRequest.requester`, `Composition.author` where appropriate | Use Practitioner for human, Device/software for agent/system, Organization for lab/source. Logical identifiers are acceptable. |
| `author.role` | `Provenance.agent.type` for standard participation + `Provenance.agent.role` with pi-chart CodeSystem `author-role` | FHIR participant type alone cannot preserve nurse/physician/agent/system distinctions. |
| `author.run_id` | pi-chart extension on Provenance, e.g. `pi:run-id`; optional `meta.tag` for simple filtering | No native FHIR home. Must not be required by external systems to understand clinical content. |
| `source.kind` | `Provenance.activity` coding from pi-chart `source-kind`; also `Provenance.entity.role=source` for source system/entity | This is the main boundary signal for `nurse_charted`, `agent_inference`, `lab_interface_hl7`, etc. |
| `source.ref` | `Provenance.entity.what.identifier`; lab/device IDs on Observation identifiers when appropriate | Preserve external IDs for round-trip/audit. |
| `transform.activity` | `Provenance.activity` secondary coding or pi transform extension | Keep distinct from `source.kind` if both are needed. |
| `transform.tool` | `Provenance.agent.who` as Device/software or `pi:transform-tool` extension | Prefer Device/software reference when stable. |
| `transform.version` | Device/software version or `pi:transform-version` extension | Required for agent-generated/inferred resources. |
| `transform.run_id` | `pi:run-id` extension on Provenance | Same extension namespace as author run id, but semantics should specify author-run vs transform-run if they differ. |
| `transform.input_refs[]` resource refs | `Provenance.entity.what -> Reference`; `entity.role=source` or `derivation` | Clean mapping for Observation/DocumentReference inputs. |
| `transform.input_refs[]` vitals windows | `Provenance.entity.what.identifier` with pi vitals-window URI + `pi:input-kind=vitals_window` | FHIR cannot natively model an interval over a stream as a resource. |

### 5.4 Link mapping

| pi-chart link | FHIR projection | Boundary notes |
| --- | --- | --- |
| `links.supports` | For Observation claims, `Observation.derivedFrom` when target is Observation/DocumentReference/media-like evidence; for ServiceRequest, `supportingInfo`; for all resources, `Provenance.entity` with `role=source`/`derivation` and `pi:evidence-role` | Provenance is the canonical cross-resource evidence graph. Use resource-native links only when semantically valid. |
| `links.fulfills` | `Observation.basedOn -> ServiceRequest` when an observation/result fulfills an order/request. For performed-but-untyped actions, update/derive ServiceRequest status and preserve fulfillment in Provenance. | MedicationAdministration/Task/Procedure deferred; fulfillment of those action types is lossy in Workstream A. |
| `links.addresses` | `ServiceRequest.reasonReference -> Observation` or `DocumentReference` for the problem/assessment; `ServiceRequest.reasonCode`; `Composition.section.focus`; Provenance reason/extension | Condition is deferred, so problem-targeting uses exported assessment resources. |
| `links.supersedes` | `ServiceRequest.replaces` for requests; `DocumentReference.relatesTo.code=replaces` for documents; Observation uses Provenance `entity.role=revision` + pi revision-kind extension, and old Observation is `entered-in-error` only when invalid | Both old and new resources should be present when the proof needs to show the correction path. |
| `links.corrects` | Same as supersedes plus `pi:revision-kind=corrects` | FHIR generally collapses corrects/supersedes without a pi extension. |
| `links.contradicts` | Primarily pi-chart-native. FHIR wrapper: Provenance `activity=pi:contradict`, `entity.role=source` pointing to contradicted claim, `pi:contradicts-basis` extension, plus narrative DocumentReference/Composition text for profile-blind readers | Do not rely on naive FHIR clients to understand contradiction. Never project conflicting claims as additive without narrative context. |
| `links.resolves` | `ServiceRequest.status=completed/revoked` when resolving an open request; Provenance `activity=pi:resolve`; Composition open-loop section updated | Task is deferred; ServiceRequest is the minimum open-loop carrier. |

---

## 6. Provenance vs AuditEvent split

### 6.1 What becomes FHIR Provenance

FHIR Provenance carries **clinical content lineage**: how a resource came to be, what generated or revised it, who/what authored it, and which entities were used.

For every projected `Observation`, `ServiceRequest`, `DocumentReference`, and the `Composition` itself, emit at least one Provenance record or a shared Provenance record for a coherent pi-chart commit/run. It should carry:

- `target`: the generated/revised FHIR resource(s).
- `recorded`: pi-chart `recorded_at` or projection commit time for the Composition.
- `occurred[x]`: the clinical/transform interval when meaningful.
- `agent`: human clinician, patient/informant, agent software, device, system, lab, or organization.
- `activity`: pi-chart `source.kind`, and transform activity when relevant.
- `entity`: supporting events, observations, notes, artifacts, vitals-window identifiers, old revisions, and external source IDs.
- pi-chart extensions: `run-id`, `source-kind` where not otherwise represented, `transform-tool`, `transform-version`, `certainty`, `evidence-role`, `revision-kind`, `contradicts-basis`, and stable pi-chart event id.

**Examples that are Provenance, not AuditEvent:**

- Agent inference generated from a 30-minute vitals window.
- Nurse-authored bedside finding.
- Lab result imported from an HL7 interface.
- Correction/supersession of a previous clinical claim.
- Human review/attestation of an agent-authored draft.
- Bundle-level signature/fingerprint assertion, if represented as clinical/export provenance.

### 6.2 What becomes FHIR AuditEvent

FHIR AuditEvent carries **operational usage/access/security logging**. It is not clinical lineage.

Emit AuditEvent as a companion resource or separate audit Bundle for:

- Workstream A document Bundle export.
- Import of a FHIR projection back into any review system.
- Read/access of the exported Bundle by a reviewer or external app.
- Failed authorization, integrity, or signature checks.
- Export filter version and denial of hidden simulator physiology, if audit logging is implemented.
- The computed export fingerprint, stored as `AuditEvent.entity.detail`, pointing at the exported Bundle.

**AuditEvent must be excluded from the canonical clinical Bundle fingerprint input** because it is intentionally time-varying. The clinical document should hash the stable clinical/provenance content, not the fact that someone exported or read it at a wall-clock time.

### 6.3 What stays pi-chart-native only

| Concept | Why native-only | Boundary treatment |
| --- | --- | --- |
| Append-only file/log mechanics | FHIR resources are state-shaped and do not express pi-chart storage mechanics. | Export resolved resources plus provenance/revision graph. |
| Full event envelope | The envelope is pi-chart's ontology. | Preserve selected fields in resource elements, Provenance, identifiers, and extensions. |
| `links.contradicts` logical semantics | FHIR has no general contradiction edge with rationale. | Wrap in Provenance + narrative; keep authoritative resolution native. |
| EvidenceRef role taxonomy | FHIR Provenance entity roles are not identical. | Use `pi:evidence-role` extension. |
| vitals-window interval URI | Not a FHIR resource. | Opaque Identifier in Provenance entity + `pi:input-kind`. |
| `run_id` decision-cycle grouping | No native FHIR element. | Provenance extension and optional meta tag. |
| `_derived/` caches | Disposable views, not authoritative. | Never export as source truth. |
| Hidden simulator state | Explicitly forbidden by ADR 016 boundary rule. | Export filter denies it; optional AuditEvent records filter version. |

---

## 7. Structural Bundle sketch for Workstream A

This is a structural sketch, not full JSON.

```text
Bundle/type=document
  id: deterministic or export-specific id
  identifier: stable projection identifier
  timestamp: export wall-clock time (excluded from canonical clinical fingerprint)

  entry[0]: Composition/comp-workstream-a-memory-proof
    status: final or preliminary
    type: progress-note / clinical-note / pi memory-proof code
    subject: Patient/patient_001
    date: projection generation time
    author: Device/pi-chart-exporter and/or Device/pi-agent + Practitioner if attested
    attester: Practitioner/nurse-or-reviewer only if actually reviewed
    event.period: shift/chart-clock window
    section[0] What happened
      entries: SpO2/RR/HR Observations; bedside finding; action/result Observations
    section[1] Why it mattered
      entries: structured assessment Observation(s); narrative DocumentReference if needed
    section[2] Evidence / provenance
      entries: supporting Observations, DocumentReferences, and key Provenance resources
    section[3] Uncertainty
      entries: inferred preliminary assessments, contradiction wrappers, narrative rationale
    section[4] Open loops
      entries: active ServiceRequests and handoff DocumentReference
    section[5] Next-shift handoff
      entries: handoff DocumentReference; high-priority active ServiceRequests

  entry[1]: Patient/patient_001
    identifier: pi-chart patient id only; no unnecessary demographics

  entry[2]: Observation/obs-spo2-0312
    category: vital-signs
    code: SpO2
    value: 89%
    effectiveDateTime: clinical time
    issued: recorded_at

  entry[3]: Observation/obs-rr-0312
    category: vital-signs
    code: respiratory rate
    value: 24/min
    effectiveDateTime: clinical time
    issued: recorded_at

  entry[4]: Observation/obs-accessory-muscle-use-0314
    category: exam
    value: observed increased work of breathing
    effectiveDateTime: assessment time
    issued: recorded_at

  entry[5]: Observation/obs-respiratory-deterioration-assessment
    category: assessment/local
    status: preliminary if agent-inferred and unreviewed; final if human-authored/reviewed
    derivedFrom: obs-spo2-0312, obs-rr-0312, obs-accessory-muscle-use-0314 where valid

  entry[6]: ServiceRequest/sr-abg-or-o2-escalation
    status: active
    intent: order
    authoredOn: ordered_at/effective_at
    reasonReference: obs-respiratory-deterioration-assessment
    supportingInfo: vitals/assessment observations

  entry[7]: Observation/obs-abg-result
    category: laboratory
    effectiveDateTime: specimen/result clinical time
    issued: lab recorded time
    basedOn: sr-abg-or-o2-escalation
    performer: Organization/reference-lab or logical identifier

  entry[8]: DocumentReference/doc-focused-nursing-note
    status: current
    docStatus: final/preliminary
    date: recorded_at
    content.attachment: focused note text or artifact pointer

  entry[9]: DocumentReference/doc-next-shift-handoff
    status: current
    docStatus: final/preliminary
    date: projection/handoff recorded_at
    content.attachment: handoff summary

  entry[10..n]: Provenance/*
    one per logical pi-chart commit/resource group or one per resource where clarity requires it
    carries author/source/transform/evidence/revision metadata
```

**Companion, not inside canonical clinical Bundle:**

```text
AuditEvent/ae-export-workstream-a
  action: create/export
  recorded: wall-clock export time
  outcome: success/failure
  agent: pi-chart exporter + destination/reviewer app
  entity.what: Bundle/comp-workstream-a-memory-proof
  entity.detail: sha256 canonical clinical fingerprint, export filter version, adapter version
```

---

## 8. Adapter test cases

### 8.1 Superseded/corrected event

**Setup:** pi-chart contains an old event and a later event with `links.supersedes` or `links.corrects`. Example: HR 180 artifact corrected to HR 80.

**Expected export:**

- Old and new claims are both visible when the proof needs the correction path.
- New Observation has final clinical value.
- Old Observation is `entered-in-error` only if clinically invalid; otherwise carries pi superseded status extension and is omitted from active Composition sections unless included in Evidence/Uncertainty.
- Provenance for the new claim has `entity.role=revision` pointing to old claim and `pi:revision-kind=corrects|supersedes`.
- DocumentReference corrections use `relatesTo.code=replaces` where target is an older DocumentReference.
- ServiceRequest replacements use `replaces`.

**Pass:** active projection chooses the corrected current claim, but reviewer can reconstruct the correction path from Provenance and section evidence.

### 8.2 Agent-authored inference with human review absent

**Setup:** pi-agent infers respiratory deterioration from vitals trend and note context. `author.role=agent`, `certainty=inferred`, `transform.activity=infer`, no human review event.

**Expected export:**

- Structured inference exports as Observation with `status=preliminary` and `pi:certainty=inferred`; narrative inference exports as DocumentReference with `docStatus=preliminary`.
- Provenance agent is Device/software, not Practitioner.
- Provenance includes tool, version, run id, input refs, source.kind, and vitals-window identifier.
- Composition may list it in Why/Uncertainty, but must not include a human attester unless review actually occurred.

**Pass:** external reviewer can tell the inference is agent-authored and unreviewed without reading pi-chart internals.

### 8.3 Human-authored bedside finding

**Setup:** nurse or physician records increased work of breathing, lung sounds, mental status, or other physical exam finding after explicit assessment.

**Expected export:**

- Observation category exam/local assessment.
- `effectiveDateTime` is assessment time; `issued` is chart commit time.
- `performer` or Provenance agent identifies the human clinician.
- `source.kind` preserves nurse_charted / physician_charted / agent_bedside_observation as applicable.
- `certainty=observed` maps to final unless the event is explicitly draft.

**Pass:** authorship and source channel round-trip exactly, and no hidden simulator state is implied.

### 8.4 External lab result

**Setup:** lab result arrives from `lab_interface_hl7` or similar external source with placer/filler/original lab identifiers.

**Expected export:**

- Observation category laboratory.
- `identifier` preserves external lab identifiers.
- `performer` identifies lab organization or logical reference.
- `basedOn` links to ServiceRequest when the result fulfills an order.
- Provenance has system/device/lab as source and agent; `source.kind=lab_interface_hl7` preserved.
- DiagnosticReport is not required for Workstream A.

**Pass:** lab identity, external IDs, source.kind, and order/result link survive re-export.

### 8.5 Projection export fingerprint

**Setup:** export the same Workstream A chart state twice at different wall-clock times.

**Canonicalization rule:**

- Input includes: Composition minus volatile date if replaced by stable chart-clock period, minimal Patient if included, Observations, ServiceRequests, DocumentReferences, Provenance, stable identifiers, stable `meta.profile`/pi tags, and deterministic `fullUrl` values derived from pi-chart ids.
- Input excludes: Bundle.id, Bundle.timestamp, Bundle.signature, Bundle/meta.lastUpdated, resource meta.versionId/meta.lastUpdated, export-only AuditEvents, non-canonical random ids, and volatile wall-clock fields not tied to chart state.
- Fingerprint algorithm: JSON canonicalization plus SHA-256. JCS/RFC 8785 is the preferred starting point.
- Store fingerprint in companion AuditEvent and optionally in bundle-level Provenance/signature metadata, but never include the fingerprint value itself in the fingerprint input.

**Pass:** identical chart state yields identical fingerprint; any clinical/provenance-relevant edit changes it; export wall-clock drift does not.

---

## 9. Implementation-ready profile decisions

These are adopted as design constraints but may be implemented as generated profiles/extensions later.

### 9.1 Canonical pi-chart CodeSystems

Generate, do not hand-maintain, these CodeSystems from the pi-chart schema/ADR vocabularies:

- `pi:CodeSystem/source-kind`
- `pi:CodeSystem/author-role`
- `pi:CodeSystem/transform-activity`
- `pi:CodeSystem/evidence-role`
- `pi:CodeSystem/revision-kind`
- `pi:CodeSystem/link-kind` if needed for debug tags

### 9.2 Minimal extension set

| Extension | Applied to | Purpose |
| --- | --- | --- |
| `pi:event-id` | all projected resources | Stable pi-chart source id. |
| `pi:run-id` | Provenance, optional meta tag | Agent/transform decision-cycle id. |
| `pi:source-kind` | Provenance or resource meta tag | Preserve source channel when `Provenance.activity` is unavailable or stripped. |
| `pi:transform-tool` | Provenance | Tool/software name. |
| `pi:transform-version` | Provenance | Tool/software version. |
| `pi:certainty` | Observation, DocumentReference, Composition, Provenance | Preserve observed/reported/inferred/planned/performed. |
| `pi:evidence-role` | Provenance.entity | Preserve primary/context/counterevidence/trigger/confirmatory. |
| `pi:revision-kind` | Provenance | Distinguish supersedes vs corrects. |
| `pi:contradicts-basis` | Provenance | Human-readable rationale for contradiction. |
| `pi:input-kind` | Provenance.entity | Mark vitals-window or other non-resource evidence. |
| `pi:chart-clock` | Composition | Preserve sim-time/wall-time projection basis. |
| `pi:canonical-fingerprint` | AuditEvent.entity.detail or Provenance/signature metadata | Integrity proof value, not included in hash input. |

---

## 10. Acceptance criteria for Workstream A

The boundary decision is satisfied when a deterministic export over the broad EHR fixture can demonstrate all of the following:

1. All six ADR-016 surfaces are present in a single coherent fixture story.
2. Every projected clinical item has effective time or period, recorded time, author, source, status, and provenance.
3. The exported FHIR document Bundle has Composition as entry 0 and sections for what happened, why it mattered, evidence/provenance, uncertainty, open loops, and next-shift handoff.
4. A bedside finding entered once in pi-chart is reused in Observation, note/handoff DocumentReference, open-loop ServiceRequest context, and Composition sections without duplicate manual prose.
5. An agent-authored inference remains visibly agent-authored and unreviewed unless a real human review/attestation event exists.
6. A superseded/corrected event preserves both active-state resolution and the revision path.
7. An external lab result preserves source.kind, lab identifiers, lab/source actor, and any order/result link.
8. Two exports of the same chart state yield the same canonical fingerprint; a clinical edit changes it.
9. Hidden simulator physiology is absent from all exported FHIR resources.
10. No broad EHR CRUD/API, scheduling, billing, auth, claims, ADT, or pharmacy workflow is introduced by the adapter.

---

## 11. Final recommendation

**Adopt now:**

- FHIR R4 / 4.0.1 as the initial target.
- Document Bundle with Composition entry 0 as the Workstream A external proof artifact.
- Five semantic resources: Composition, Observation, ServiceRequest, DocumentReference, Provenance.
- Minimal Patient and Bundle as infrastructure only.
- Provenance as clinical lineage for every projected resource.
- AuditEvent as separate operational/export log, not as clinical projection content.
- Deterministic fingerprint canonicalization as a pi-chart-native invariant that the FHIR export must respect.

**Research more, but do not reopen the resource set:**

- Exact pi-chart CodeSystem canonical URLs and versioning.
- Exact `links.contradicts` extension and rendering policy.
- Exact JCS/canonicalization redaction list and fixture IDs.
- Validator behavior for document Bundle references with logical actor references.

**Defer until adapter implementation or later fixtures:**

- DiagnosticReport, MedicationRequest, MedicationAdministration, CarePlan, Communication, Task, Encounter, and resource history Bundles.
- Bidirectional FHIR import/write-back.
- Public FHIR server/API surface.
- Scheduling, billing, authentication, claims, ADT, and broad CRUD.

This gives Workstream A enough FHIR to be externally credible while keeping pi-chart's clinical-memory primitives intact.
