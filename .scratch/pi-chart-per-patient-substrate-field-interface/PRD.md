# PRD: pi-chart per-patient charted-clinical-fact substrate field interface

Status: needs-triage
Sliced: 2026-05-29 → `issues/01–15` (+ `issues/RECONCILIATION.md`); per-issue triage statuses apply (6 ready-for-agent, 9 ready-for-human).
Source handoff: `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`
Primary companion inputs:
- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md` (canonical-vs-derived framing, shift-brain strategy, deferrals)
- `pi-chart/docs/adr/018-architecture-rebase-clinical-truth-substrate.md` (filesystem/NDJSON/Markdown remains fixture + export/archive format; UI/prototype is evidence not authority)
- `pi-ledger/docs/ledger-core-public-interface.md` (frozen K0–K12 kernel public interface; Claim target)
- `pi-chart/src/types.ts` (current EventEnvelope / VitalSample / NoteFrontmatter field model)
- `pi-ledger/crates/ledger-core/src/canonical.rs` (canonicalization id `jcs-rfc8785-pi-chart-v1`; the pi-chart-side prototype `src/claim-ledger/canonical.ts` was deleted per ADR 020 — the kernel is the canonicalization authority)

## Problem Statement

The lean v0.5 strategy PRD named a hard prerequisite and then stopped at it: **chart substrate fields must be defined before any `pi-chart`→`pi-ledger` adapter work, so adapter mapping is explicit rather than speculative** (strategy PRD user story 79; suggested downstream lane 12). That field definition does not yet exist. The chart→ledger adapter is gated behind an unmade Rust↔TS integration-mechanism decision, but the adapter is also gated behind a more basic gap: pi-chart's per-patient charted-clinical-fact substrate is only *partially* explicit, and the implicit parts are exactly the parts an adapter must translate.

A grounded read of the current model (`src/types.ts` plus two side-channel substrates) shows a **strong skeleton and under-specified flesh**:

- **Strong, view-consumed, and consistent:** a bitemporal backbone (`effective_at`/`effective_period` as clinical/valid time versus `recorded_at` as transaction time, with `eventCoversAsOf` + supersession giving "live as of t"), plus `id`, `type`, `encounter_id`, `status` lifecycle, and the `links` evidence graph (`supersedes`/`corrects`/`supports`/`fulfills`/`addresses`/`contradicts`). These carry the entire active/evidence/open-loop machinery across all six view primitives and memoryProof.
- **Under-specified and only partially wired:** `subtype` is the single most load-bearing field yet has **no enum** — currentState's whole axis taxonomy (`'problem'`, `'constraint'`, `'context_segment'`, `'monitoring_plan'`) is magic strings; a wrong/missing subtype silently drops a fact from its axis. `data: Record<string, unknown>` is where the actual clinical fact lives, mined by ~20 ad-hoc magic keys with no required-key contract per `(type, subtype)`. `certainty` is modeled and required on `ClinicalEvent` but consumed by **zero** views (epistemic signal is read from `data.differential`/`data.uncertainty` instead). `transform.input_refs` lineage is never walked. `author.run_id` is unconsumed. `links.resolves` is a dead edge. `source.kind` is a free string with no controlled vocabulary.
- **Three divergent fact shapes, not one:** `VitalSample` rows (`vitals.jsonl`) have **no claim lifecycle** — no `status`, no supersession, no `certainty`, latest-valid-wins only, so a vital cannot be contested, corrected, or carry evidence (a second-class fact). `NoteFrontmatter` uses `references: string[]` (flat, role-less) instead of the canonical `links.supports`/`EvidenceRef` model (a parallel, weaker evidence edge). `encounter_id` is required on `ClinicalEvent` but optional on base and treated as a **wildcard** in `eventMatchesEncounter`, so structural/cross-encounter facts leak into encounter-scoped views.

Separately, the kernel side imposes hard requirements the chart does not yet meet. A pi-ledger `Claim` requires `id`, `shape` (exactly one of `context|observation|interpretation|act`), `predicate` (a registered id whose declared shape matches), `subject.patientId`, `object` (a JSON object whose typed `RequiredFields` the predicate enforces), `time.valid` (instant XOR interval), `time.recorded_at`, `actor`, and `integrity` — with canonical-UTC `YYYY-MM-DDTHH:MM:SSZ` timestamps that are **rejected, not normalized**, if they carry offsets/fractional seconds/zone names, and store-owned `time.accepted_at`/`seq`/`batch_id` that the caller **must not** emit. Corrections require `revises.target.{id,hash}` where `hash` is a `sha256:<64hex>` Record hash that must recompute against the stored target — pi-chart's `links.corrects` carries **no target hash** today.

The net problem: **the substrate is one canonical primitive in principle but three divergent shapes with implicit category, payload, certainty, and lineage in practice — and that implicitness is precisely what blocks both the clinician surfaces (Shift Brain, Report View, Handoff View, Chart Review Packet, Current Snapshot) from deriving labels deterministically and the future adapter from being a translation rather than a redesign.** This PRD makes the per-patient charted-clinical-fact field set explicit so that (1) every clinician-facing label is a projection over named fields, never new truth, and (2) each field has a stated, clean mapping to the kernel Claim target — without implementing across the seam.

## Solution

Define — as an interface specification, not an implementation — the explicit field set for a **per-patient charted clinical fact**: the single canonical substrate primitive that is a patient-scoped, time-bound, source-attributed assertion or action, with a stated kernel-Claim mapping per field. The deliverable is a field contract plus tracer-bullet issues; it does not authorize source edits, does not pick the Rust↔TS integration mechanism, does not widen the kernel, and does not couple to hidden `pi-sim` internals.

The solution has six parts.

### 1. One canonical primitive, three reconciled shapes

Affirm **chart-once / project-many**: every clinician surface is a rebuildable, non-authoritative projection over the charted-clinical-fact substrate. The PRD makes explicit that the substrate today is three shapes — `EventEnvelope` claims, `VitalSample` rows, `NoteFrontmatter`+body — and specifies the **common canonical field grammar** all three must expose so projections derive every label without storing new truth, and so each maps to the same kernel Claim target. The brownfield EventEnvelope/NDJSON/Markdown layout is retained **per ADR 018 point 4 as the fixture and export/archive format** — not as the authoritative field contract and not as the adapter's source of truth.

### 2. The explicit charted-clinical-fact field set

Each field below is named with: its canonical-memory role, the clinician-facing label(s) it powers (intended vocab), its current pi-chart representation, and its kernel-Claim target mapping. The spec must close every "under-specified" gap the current-model analysis flagged.

**A. Identity & scope.**
- `id` — stable fact identity; link target; sort tiebreaker. Maps **directly** to kernel `id`. Already explicit.
- `subject.patientId` — per-patient anchor; powers the Patient banner. Maps **directly** to kernel `subject.patientId` (kernel `PatientMismatch` if `!=` target ledger patient). Spec must make `subject` the single anchor and treat current `EventEnvelope.subject` / `VitalSample.subject` as the same field; the directory-scoping `PatientScope.patientId` is a read-path concern, not a second source.
- `encounterId` — encounter partition; powers "Current visit". **Gap to close:** the field must be crisply per-encounter; the current optional-on-base + wildcard-match behavior is a defect. Maps to kernel **`object.encounterId:string`** (a predicate `RequiredField`), **not** kernel subject — per the mapping note, encounter is object content, while patient is subject. Structural/cross-encounter facts must declare their cross-encounter status explicitly rather than relying on a wildcard.
- Connectors that read this substrate stay **`(patientId, encounterId, asOf)`-parameterized** and never hardcode a patient (demo target `patient_002`/`enc_p002_001`; regression target `patient_001`).

**B. Category — `shape` + `predicate` made first-class (closes the biggest gap).**
- `factShape` — an **explicit kernel-aligned shape** per fact, resolving the current 6-ClinicalType + 3-StructuralType set into the kernel's four shapes: `observation→observation`; `assessment→interpretation`; `intent`/`action→act`; `subject`/`encounter`/`constraint_set→context`. `communication` and `artifact_ref` have **no kernel shape** and must be resolved by the spec — consistent with the accepted "report visuals as evidence not substrate" stance, the default is to treat `artifact_ref` (and report-visual content) as **evidence/source refs**, not as substrate facts; `communication` (verbal/telephone orders, readback, co-sign) must be assigned a shape (`act` for orderable communications; `context`/`observation` otherwise) — this many-to-four collapse is the chief semantic decision and the spec states it once, here.
- `predicateId` — a **deterministic projection of `(type, subtype)`** onto a registered kernel predicate id (e.g. `observation + vital → vital.sign`), replacing the untyped magic-string `subtype` as the load-bearing category axis. The spec defines the projection table and notes a **production `PredicateRegistry` must be authored** (kernel `phase1_registry` is fixtures-only); the predicate's declared shape must equal `factShape` (else kernel `ShapeMismatch`). `subtype` survives as a chart-internal sub-axis but is no longer the silent gate — the named `predicateId` is.

**C. Payload — typed `object` per predicate (closes the second-biggest gap).**
- `object` — the clinical content, replacing the schema-less `data: Record<string, unknown>` magic-key mining with **typed required fields per predicate**. The spec enumerates the per-predicate `RequiredFields` (name/JSON-type) that today live as `data.*` keys (e.g. `data.name/value/unit` → `vital.sign` requires `code:String`, `value:Number`, `unit:String`; `data.summary/impression/goal/action`, `data.segment_type`, `data.due_by`, `data.required_cadence`, etc. each get a predicate + typed object). Maps to kernel `object` (kernel `validate_object` enforces `MissingObjectField`/`InvalidObjectField`). The chart's loose `data` is retained inside the fixture/export format but the **field contract** is the typed object.

**D. Bitemporal time (the strongest existing part — keep, plus canonicalize).**
- `time.valid` — clinical/valid time: `effective_at` (instant) XOR `effective_period.{start,end}` (interval). Powers **Occurred** / **Effective** / **As of** labels and all `eventCoversAsOf` visibility. Maps to kernel `time.valid` (instant XOR interval, `end>=start`). `VitalSample.sampled_at → time.valid.instant`.
- `time.recorded_at` — transaction time; the wall/sim time the fact entered the chart. Powers **Charted / Last charted**. Maps **directly** to kernel `time.recorded_at`.
- **Hard requirement the spec states:** every chart timestamp must be re-emittable as **canonical UTC `YYYY-MM-DDTHH:MM:SSZ`** (20 chars, trailing `Z`, valid calendar). Current chart strings carry offsets/fractional seconds/zone names and **will be rejected, not normalized**, by kernel `time.rs`. The adapter owns normalization; the field spec must declare canonical UTC as the contract value.
- **Store-owned, must-not-emit:** the spec marks `accepted_at` / `seq` / `batch_id` (and Record/Entry hashes, prev-link, head) as **K3 store-assigned** — pi-chart must not surface any field mapping to them (kernel `K3OwnedTimeMetadata` rejects caller-supplied values). The chart's own `id`/`recorded_at` being caller-set is fine.

**E. Source, authorship & provenance.**
- `actor` (from `author{id,role,run_id?}`) — who/what asserted the fact. Powers authorship + the **Source / authority split** (see G). Maps to kernel `actor` (kernel checks presence only; fixtures use `{kind,id}`). **Gap to close:** `author.run_id` (agent-run attribution) is currently unconsumed — the spec makes agent-run lineage an explicit, named field so "Suggested by Pi" provenance is derivable.
- `source` (`{kind, ref?}`) — origin system/modality. Powers the **Source** trust label (MAR, ICU note, lab result, flowsheet, order, report, bedside verification). **Gap to close:** `source.kind` is a free string — the spec defines a **controlled provenance vocabulary** aligned to the intended care-item source labels (Ordered, Protocol, Unit policy, Nursing plan, Patient/family request, Suggested by Pi, Device/import, Chart-derived). Source explains origin, **not** authority ("Ordered" ≠ "Required").
- `evidence` (from `links.supports` + `EvidenceRef{ref,kind,role,...}`) — typed evidence pointers powering **Why am I seeing this? / Source trail** (evidence chain). The spec keeps the `EvidenceRef` model as the **one** evidence edge and resolves the gaps: `NoteFrontmatter.references: string[]` must converge on `EvidenceRef` (no parallel weak edge); `transform.input_refs` and `EvidenceRef.derived_from`/`selection` and the partially-unconsumed roles/kinds (`external`/`trigger`/`confirmatory`/`context`, `vitals` vs `vitals_window`) must each be marked **consumed** or **explicitly deferred** — no silent dead fields.
- `transform` (`{activity, tool, version?, run_id?, input_refs?}`) — derivation lineage powering `[extracted]`/`[inferred]` tags and the Source trail. Provenance, not a kernel field; carried as fixture/export + evidence.
- `integrity` — **new top-level field** the chart does not have today; powers append-only tamper-evidence. Maps to kernel `integrity` (kernel checks presence; the whole Claim must canonicalize). The spec notes the chart's `jcs-rfc8785-pi-chart-v1` canonicalization id and rule **must be agreed with** the kernel's `canonical_json`/`record_hash` for cross-side hashes to match; this agreement is named as a prerequisite, not implemented here.

**F. Lifecycle, certainty & review-state.**
- `status` (lifecycle) — append-only correction/supersession state powering the **Lifecycle status label** (Active / Updated / Corrected / Replaced / Entered in error / Canceled / Discontinued / Resolved). **Gaps to close:** the current enum lacks `'resolved'` (problem closure is wrongly conflated with `superseded`/`final`), `'draft'` has no view treatment, and "Replaced" must be preferred over "Superseded" in clinician copy. The spec states the full lifecycle vocabulary and that lineage stays visible in the Source trail, never mutating the original.
- `revises` (from `links.corrects`/`links.supersedes`) — correction lineage. Maps to kernel `revises{mode:"corrects", target:{id, hash}}`. **Hard new requirement:** kernel revision needs **both** the target `id` **and** a `sha256:<64hex>` Record hash that recomputes against the stored target; pi-chart `links.corrects` carries only id arrays today. The spec declares that any correction fact must persist the target's kernel Record hash — without which corrections are not Revision-admissible. The dead `links.resolves` edge is either given a consumer or dropped.
- `certainty` — epistemic modality (`observed`/`reported`/`inferred`/`planned`/`performed`). **Gap to close:** modeled but consumed by zero views; the actual uncertainty signal is read from `data.differential`/`data.uncertainty`. The spec **reconnects** the typed `certainty` field to the uncertainty surface so graded clinical certainty (Concern / Uncertain / Working diagnosis / Resolved) is a projection over a named field, and states that Pi may surface source-linked Concern/Uncertain but never upgrade to a diagnosis. `certainty` is chart-internal (no direct kernel field); it informs `predicateId`/`object` choice.
- **Review/attestation as separate facts** — Reviewed / Verified / Signed / Co-signed are their own charted-clinical-fact instances (their own `id`, `actor`, `time`, `evidence` linking the reviewed fact), **never a mutation** of the target. The clinician-facing **review-state label** (Needs review / Source mismatch / May be outdated / Report only / Source needed) is a projection over these review facts plus freshness — review prompts, not truth decisions. This satisfies the "Done vs Charted" and "Reviewed vs Verified vs Signed" distinctions.

**G. Authority, attention, timing & access-tier — projection-facing fields.**
The spec names the fields that let projections derive the strategy PRD's workflow labels **without new truth**: care-item **authority posture** (Required / Time-sensitive / Routine / Suggested / Info / Watch-Handoff — distinct from `source`); **attention/clinical-risk** cue (Needs attention / Review priority / Safety flag / Watch); nonpunitive **timing/workflow state** (Due now / Due soon / Delayed / Deferred / Waiting on / Blocked / Not appropriate now / Carry forward); and **hot/warm/cold access behavior** (Current-acute / Recent course / Baseline-history) as a relevance/priority tier — explicitly **not** a storage, retrieval, vector, OpenBrain, or disease-course decision. Where these are projections of existing fields (e.g. authority derived from `predicateId`+`source`, risk tier from `certainty`+attention cue+`time`), the spec says so; where a fact must carry an explicit field (e.g. an authority posture that is not inferable from source), the spec names it. **Human-agent boundary:** Pi outputs are `Suggested` (provisional) facts; promotion to a clinician-owned care item is a **separate human action** (Add to Shift Brain), suggestions are disable-able, and there is no autonomous accepted-write or completion authority.

### 3. The clinician-surface derivation guarantee

The spec states, per surface, that **every label is a projection over the fields above**: Current Snapshot (Source, review state, As-of), Shift Brain (authority + risk tier + timing), Report View (projected/linked back to canonical facts/actions/notes/refs — never a competing record), Handoff View (carry-forward, human-owned final), Chart Review Packet (the clinician-facing view over a `ContextPacket`). No surface stores truth; mismatches surface as **review prompts**, never autonomous truth decisions.

### 4. The kernel-mappability guarantee

The spec enumerates the **seven things pi-chart must make explicit to be mappable** (so the adapter is translation, not redesign): (1) an explicit `predicateId` deterministic from `(type, subtype)` + a production registry; (2) an explicit `factShape` per fact resolving the 6→4 collapse and `communication`/`artifact_ref`; (3) typed `object` fields per predicate; (4) canonical-UTC timestamps; (5) a Record hash on every correction target; (6) a top-level `integrity` block; (7) an agreed canonicalization id between chart and kernel. **None of this is implemented across the seam** — it remains an interface spec until the Rust↔TS integration-mechanism decision is made. The kernel is **not widened**: the mapping bends the chart to the frozen Claim target, never the reverse.

### 5. EventEnvelope retained as fixture/export per ADR 018

The brownfield `EventEnvelope` / `VitalSample` / `NoteFrontmatter` NDJSON+Markdown layout stays as the **fixture and export/archive format** (ADR 018 point 4). The field contract here is the authoritative shape; the export format may be lossier or differently keyed, but every contract field must be round-trippable to/from it for fixtures and regression (`patient_001`).

### 6. Reconciliation register on every downstream issue

Each tracer issue carries a Phase-A-style posture (`adopt` / `revise` / `open-question` / `defer` / `reject`) and an explicit triage `Status:` per `triage-labels.md`. Useful brownfield/kernel evidence stays evidence until promoted by a triaged issue or accepted ADR.

## User Stories

1. As a future adapter author, I want every charted-clinical-fact field named with its kernel-Claim target mapping, so that the adapter is a translation and not a redesign.
2. As a maintainer, I want this PRD to start `needs-triage`, so that no agent treats the field spec as implementation-ready before issue slicing.
3. As a maintainer, I want one canonical charted-clinical-fact primitive defined, so that vitals, notes, and envelope facts stop being three divergent fact shapes with overlapping field models.
4. As a maintainer, I want the EventEnvelope/NDJSON/Markdown layout kept as fixture and export/archive format per ADR 018, so that the field contract can be explicit without rewriting brownfield storage.
5. As a clinician, I want every Current Snapshot / Shift Brain / Report View / Handoff View / Chart Review Packet label to be a projection over named fields, so that no surface becomes competing chart truth.
6. As a clinician, I want `factShape` made explicit per fact, so that the 6-ClinicalType/3-StructuralType set maps deterministically into the kernel's four shapes and nothing leaks into the wrong axis.
7. As a clinician, I want `communication` and `artifact_ref` resolved explicitly (report visuals as evidence, communications assigned a shape), so that the chief 6→4 semantic decision is made once and not silently per view.
8. As a clinician, I want `predicateId` to replace untyped `subtype` as the category axis, so that a wrong/missing subtype can no longer silently drop a fact from its clinical axis.
9. As a clinician, I want the clinical payload typed as `object` per predicate, so that the real clinical fact is not carried in a schema-less `data` bag mined by magic keys.
10. As a clinician, I want Occurred / Charted / Effective / As-of to be distinct named bitemporal fields, so that interpretation and safety-relevant time distinctions are visible.
11. As a future adapter author, I want every timestamp specified as canonical UTC `YYYY-MM-DDTHH:MM:SSZ`, so that the kernel does not reject offset/fractional/zone-bearing chart times.
12. As a future adapter author, I want `accepted_at`/`seq`/`batch_id` marked store-owned and never-emit, so that the chart does not supply K3-owned metadata the kernel rejects.
13. As a clinician, I want `source` to carry a controlled provenance vocabulary distinct from authority posture, so that "Ordered" is never read as "Required".
14. As a clinician, I want agent-run lineage (`run_id`) made an explicit consumed field, so that "Suggested by Pi" provenance is derivable rather than dead substrate.
15. As a clinician, I want one evidence edge (`EvidenceRef`) powering the Source trail, so that notes' flat `references: string[]` stops being a parallel weaker edge.
16. As a clinician, I want every declared evidence role/kind and `transform.input_refs`/`derived_from` either consumed or explicitly deferred, so that there are no silent dead provenance fields.
17. As a clinician, I want `integrity` added as a top-level field with an agreed canonicalization id, so that append-only tamper-evidence maps to the kernel and cross-side hashes can agree.
18. As a clinician, I want the lifecycle vocabulary completed (incl. `Resolved`, `draft` treatment, "Replaced" over "Superseded"), so that problem closure is not conflated with a wrong claim.
19. As a future adapter author, I want correction facts to persist the target's kernel Record hash (id + `sha256:<64hex>`), so that corrections are Revision-admissible.
20. As a clinician, I want `certainty` reconnected to the uncertainty surface, so that graded certainty (Concern / Uncertain / Working diagnosis / Resolved) is a projection over a named field and Pi never upgrades to a diagnosis.
21. As a clinician, I want Reviewed / Verified / Signed / Co-signed modeled as separate review facts, so that review state is a projection and never a mutation of the target fact.
22. As a nurse, I want authority posture, attention/risk cue, and nonpunitive timing state named as projection-facing fields, so that the Shift Brain can derive supportive labels without storing new truth.
23. As a nurse, I want hot/warm/cold defined as an access/priority tier field, so that relevance is explicit without choosing storage, retrieval, vector, or disease-course architecture.
24. As a clinical-safety reviewer, I want Pi outputs modeled as `Suggested` facts promoted only by a human action, so that there is no autonomous accepted-write or completion authority.
25. As a nurse, I want `encounterId` crisply per-encounter (no wildcard leak), so that encounter-scoped views do not silently include cross-encounter facts.
26. As an integrator, I want connectors over this substrate to stay `(patientId, encounterId, asOf)`-parameterized and never hardcode a patient, so that `patient_002` demo and `patient_001` regression both work.
27. As a maintainer, I want a production `PredicateRegistry` named as a prerequisite (kernel `phase1_registry` is fixtures-only), so that the predicate-policy gate is satisfiable.
28. As a reviewer, I want the Rust↔TS integration-mechanism decision kept out of scope, so that field definition does not become a premature seam commitment.
29. As a reviewer, I want the kernel left unwidened, so that mapping bends the chart to the frozen Claim target and never the reverse.
30. As an issue author, I want the field spec sliced into independently grabbable tracer-bullet issues, so that AFK agents can work disjoint field slices without reopening the whole substrate.

## Implementation Decisions

- This PRD is **SPEC work** (interface/field definition) and issue-slicing input. It does **not** authorize source implementation edits, adapter implementation, or the Rust↔TS integration-mechanism decision.
- The single canonical primitive is the **charted clinical fact**: a patient-scoped, time-bound, source-attributed assertion or action that can be projected, corrected, reviewed, and pulled into task context. `claim` and `charted clinical fact` are never surfaced as normal clinician UI copy.
- All clinician surfaces (Shift Brain, Report View, Handoff View, Chart Review Packet, Current Snapshot) are **rebuildable, non-authoritative projections** over the fact substrate. They must never become competing chart truth or autonomous completion authority.
- The substrate is today three shapes (`EventEnvelope`, `VitalSample`, `NoteFrontmatter`); the PRD specifies the **common canonical field grammar** they must all expose. The NDJSON/Markdown layout is retained **as fixture + export/archive format per ADR 018 point 4**, not as the field-contract authority.
- The explicit field set is: **identity & scope** (`id`, `subject.patientId`, `encounterId`); **category** (`factShape`, `predicateId`); **payload** (`object`, typed per predicate); **bitemporal time** (`time.valid` instant XOR interval, `time.recorded_at`, canonical UTC); **source/authorship/provenance** (`actor` incl. consumed `run_id`, `source` with controlled vocab, `evidence`/`EvidenceRef`, `transform`, `integrity`); **lifecycle/certainty/review** (`status` full vocabulary, `revises` with id+Record-hash, `certainty` reconnected, review/attestation as separate facts); and **projection-facing** (authority posture, attention/risk cue, timing state, hot/warm/cold access tier, human-agent suggestion state).
- The 6→4 shape collapse is decided here once: `observation→observation`, `assessment→interpretation`, `intent`/`action→act`, `subject`/`encounter`/`constraint_set→context`; `artifact_ref` and report-visual content default to **evidence/source refs, not substrate facts**; `communication` is assigned a shape (`act` for orderable communications, `context`/`observation` otherwise).
- `predicateId` is a **deterministic projection of `(type, subtype)`** onto a registered predicate id; a **production `PredicateRegistry` must be authored** (kernel `phase1_registry` is fixtures-only); the predicate's declared shape must equal `factShape`.
- `encounterId` maps to kernel **`object.encounterId:string`** (predicate `RequiredField`), not kernel subject; `subject.patientId` maps to kernel subject. Cross-encounter/structural facts must declare cross-encounter status explicitly; the current optional-on-base wildcard-match behavior is a **defect to close**, not a contract.
- Every timestamp's contract value is **canonical UTC `YYYY-MM-DDTHH:MM:SSZ`**; offsets/fractional seconds/zone names are rejected by the kernel, not normalized — the adapter (out of scope here) owns normalization.
- Correction facts must persist the target's kernel **Record hash** (`sha256:<64hex>`) alongside the target id; `links.resolves` is given a consumer or dropped; the chart's `jcs-rfc8785-pi-chart-v1` canonicalization rule must be **agreed with** the kernel's `canonical_json`/`record_hash` (agreement named as prerequisite, not implemented).
- `certainty` is reconnected to the uncertainty surface; `author.run_id` and the partially-unconsumed evidence roles/kinds and `transform.input_refs`/`EvidenceRef.derived_from`/`selection` are each marked **consumed** or **explicitly deferred** — no silent dead fields.
- Review/attestation (Reviewed/Verified/Signed/Co-signed) are **separate facts**, never mutations. Done (view-level) and Charted (sanctioned source) are never collapsed.
- Pi outputs are `Suggested` provisional facts; promotion to a clinician-owned care item is a separate human action (Add to Shift Brain); suggestions are disable-able; no autonomous accepted-write or completion authority.
- Connectors over this substrate stay `(patientId, encounterId, asOf)`-parameterized and **never hardcode a patient** (demo `patient_002`/`enc_p002_001`; regression `patient_001`).
- The kernel is **not widened**; mapping bends the chart to the frozen Claim target. The Rust↔TS integration mechanism, backend/vector/OpenBrain/storage/runtime/access-plane selection, and hidden `pi-sim` coupling are all out of scope.
- Observable monitor vitals become chart truth only through the **Observable charting seam**, not by import or visibility.

## Testing Decisions

- PRD verification is structural: the published PRD must carry `Status: needs-triage`, cite the strategy PRD + ADR 018 + the ledger public interface, define the charted-clinical-fact field set with per-field kernel mapping, and keep all listed deferrals/boundaries.
- **Field-completeness tests** (for future implementation) should verify every named field has: canonical-memory role, clinician-facing label mapping, current pi-chart representation, and a stated kernel-Claim target (or an explicit "chart-internal, no kernel field" note).
- **Gap-closure tests** should verify each flagged under-specification is resolved: `predicateId` replaces silent `subtype` gating; `object` is typed per predicate; `certainty` is consumed by the uncertainty surface; `run_id`, evidence roles/kinds, and `transform.input_refs` are consumed-or-deferred (no dead fields); `links.resolves` resolved; `status` carries `Resolved` and a `draft` treatment.
- **Kernel-mappability tests** should verify, against the frozen public interface, that a specified fact projects to a valid Claim: required fields present with correct JSON types; `factShape` ∈ the four kernel shapes; `predicateId` registered with matching declared shape; `object` satisfies the predicate's typed `RequiredFields`; `time.valid`+`time.recorded_at` canonical UTC; no K3-owned time metadata; correction facts carry `revises.target.{id,hash}` with a recomputing Record hash; `integrity` present and canonicalizable.
- **Projection-derivation tests** should verify each clinician surface label is rebuildable from named fields and that no surface stores truth; mismatches surface as review prompts, never autonomous truth decisions.
- **Bitemporal tests** should verify Occurred/Charted/Effective/As-of distinctions and `eventCoversAsOf`/supersession "live as of t" behavior over the named time fields.
- **Scope tests** should verify per-patient and crisp per-encounter partitioning (no wildcard leak) and that connectors honor `(patientId, encounterId, asOf)` without hardcoding a patient (`patient_002` demo, `patient_001` regression).
- **Boundary tests** should verify no kernel widening, no Rust↔TS mechanism choice, no backend/vector/OpenBrain/runtime/access-plane selection, no hidden `pi-sim` coupling, and no autonomous agent accepted-write or completion authority.
- **Fixture round-trip tests** should verify every contract field round-trips to/from the retained EventEnvelope/NDJSON/Markdown export format (ADR 018).
- Tests verify clinician-visible external behavior and domain/mapping invariants, not private storage layout, helper names, or backend choice.

## Out of Scope

- Implementing the `pi-chart`→`pi-ledger` adapter, or choosing the **Rust↔TS integration mechanism** that gates it.
- Editing `pi-chart/src/` source, migrating fixtures, or rewriting the brownfield EventEnvelope/VitalSample/NoteFrontmatter substrate.
- Widening or modifying the `pi-ledger` kernel or its frozen public interface; authoring the production `PredicateRegistry` (named as prerequisite, not built here).
- Selecting or implementing backend, vector, OpenBrain, storage, runtime, service, graph/index, semantic search, or access-plane architecture.
- Choosing hot/warm/cold *retrieval* technology; defining cold-history retrieval beyond source-linked citation/eligibility.
- Coupling to hidden `pi-sim` internals, hidden physiology, oracle truth, evaluator labels, or runtime transcripts as chart truth.
- Authorizing direct agent accepted-writes or autonomous task completion.
- Building full CPOE, pharmacy verification, barcode MAR, drug dictionary, full med-rec, legal/compliance/raw-audit, role registry, protocol/CDS engine, or external EHR integration.
- Implementing order-set/unit-policy/protocol content libraries.
- Implementing cross-patient assignment-level nurse brain before per-patient fields are explicit.
- Treating generated UI, raw design assets, screenshots, public API shape, or prototype layout as substrate authority (ADR 018 points 5–7).
- Reopening accepted ADRs (incl. ADR 018) without a separate explicit ADR conflict/decision process.

## Further Notes

### Why this PRD is the named gate

The strategy PRD's downstream lane 12 and user story 79 require chart substrate fields to be explicit *before* any adapter PRD/issues. Two grounded reads make that gate concrete: the **current-model analysis** shows a strong bitemporal+lifecycle+evidence skeleton but implicit category (`subtype`), payload (`data`), certainty, and lineage, plus three divergent fact shapes; the **kernel Claim target** shows hard, frozen requirements (four shapes, registered predicates, typed objects, canonical-UTC time, store-owned metadata, correction Record hashes, integrity, agreed canonicalization). This PRD's field contract is the bridge: it closes the chart-side gaps *and* states the per-field kernel mapping, so the future adapter is translation, not redesign — and so it can be deferred safely behind the unmade Rust↔TS decision without blocking field clarity.

### Bitemporal backbone is the model's strongest part — keep it

`effective_at`/`effective_period` (clinical/valid time) versus `recorded_at` (transaction time), with `eventCoversAsOf` + supersession, already give a clean "live as of t" and map almost directly to kernel `time.valid` / `time.recorded_at`. The only change the spec imposes is **canonicalization to UTC `YYYY-MM-DDTHH:MM:SSZ`**, because the kernel rejects rather than normalizes non-canonical timestamps.

### Vitals and notes are second-class facts today — the spec lifts them

`VitalSample` has no lifecycle/status/supersession/certainty (latest-valid-wins only) and `NoteFrontmatter` uses a flat `references: string[]`. The common field grammar requires both to expose the same identity/scope/time/source/lifecycle/evidence fields as envelope facts, so a vital can be contested/corrected/evidenced and a note's evidence rides the one `EvidenceRef` edge. The brownfield row/markdown formats remain as **export/fixture** representations per ADR 018.

### Suggested downstream issue lanes (overview)

Tracer-bullet vertical slices, each independently grabbable, with a one-line spec + acceptance check below. Each carries a reconciliation posture and a `Status:` per `triage-labels.md`. Connectors over the substrate stay `(patientId, encounterId, asOf)`-parameterized.

### Stop condition

This PRD is ready for `$to-issues` when a triage reviewer agrees it: names the single canonical charted-clinical-fact primitive; defines the full field set (identity/scope, category, payload, bitemporal time, source/authorship/provenance, lifecycle/certainty/review, projection-facing); states a per-field kernel-Claim mapping that bends the chart to the frozen target without widening the kernel; closes every flagged under-specification; keeps EventEnvelope as fixture/export per ADR 018; and keeps the Rust↔TS mechanism, backend/retrieval, simulator, and kernel-expansion decisions out of scope.

---

## Proposed tracer-bullet issues

Each issue is a thin vertical slice over the field contract — independently grabbable, with a one-line spec and an acceptance check. All are SPEC artifacts (field-definition docs), not source edits. Connectors referenced in any slice stay `(patientId, encounterId, asOf)`-parameterized and never hardcode a patient.

**Issue 01 — Charted-clinical-fact identity & scope fields** (posture: `adopt`; Status: `ready-for-agent`)
Spec: define `id`, `subject.patientId`, `encounterId` with kernel mappings (id→`id`, patient→`subject.patientId`, encounter→`object.encounterId`) and close the `encounterId` wildcard-leak defect.
Acceptance: doc names all three fields, their current pi-chart source, their kernel target, and states crisp per-encounter scoping with no wildcard match; connector signature shown as `(patientId, encounterId, asOf)`.

**Issue 02 — `factShape` and the 6→4 collapse decision** (posture: `revise`; Status: `ready-for-human`)
Spec: define `factShape` per fact and fix the mapping of all 6 ClinicalTypes + 3 StructuralTypes to the four kernel shapes, including the `communication`/`artifact_ref` resolution (report visuals as evidence; communications assigned a shape).
Acceptance: doc gives an exhaustive type→shape table covering all 9 source types with no unmapped case and an explicit `communication`/`artifact_ref` decision.

**Issue 03 — `predicateId` projection + production registry requirement** (posture: `revise`; Status: `ready-for-human`)
Spec: define `predicateId` as a deterministic projection of `(type, subtype)` onto registered predicate ids and name the production `PredicateRegistry` as a prerequisite (kernel `phase1_registry` is fixtures-only).
Acceptance: doc gives the `(type, subtype)→predicateId` table (incl. `observation+vital→vital.sign`), each predicate's declared shape equals the mapped `factShape`, and states the registry-authoring prerequisite.

**Issue 04 — Typed `object` per predicate (replace magic-key `data`)** (posture: `revise`; Status: `ready-for-human`)
Spec: enumerate the per-predicate `RequiredFields` (name/JSON-type) replacing the ~20 ad-hoc `data.*` magic keys.
Acceptance: doc lists, per predicate, the typed object fields and their JSON types; every current `data.*` consumer key is accounted for or explicitly deferred.

**Issue 05 — Bitemporal time fields + canonical-UTC contract** (posture: `adopt`; Status: `ready-for-agent`)
Spec: define `time.valid` (instant XOR interval), `time.recorded_at`, the Occurred/Charted/Effective/As-of labels, and the canonical-UTC `YYYY-MM-DDTHH:MM:SSZ` contract value; mark `accepted_at`/`seq`/`batch_id` as store-owned never-emit.
Acceptance: doc states the canonical-UTC format, that offset/fractional/zone times are rejected (not normalized), and lists the K3-owned fields the chart must not emit.

**Issue 06 — Source, authorship & provenance vocabulary** (posture: `revise`; Status: `ready-for-human`)
Spec: define `actor` (incl. consuming `run_id`), `source` with a controlled provenance vocabulary, and the source-vs-authority split (Ordered ≠ Required).
Acceptance: doc gives the controlled `source.kind` vocabulary mapped to clinician Source labels, names `run_id` as consumed for "Suggested by Pi" provenance, and states source ≠ authority.

**Issue 07 — Unified evidence edge (`EvidenceRef`) + dead-field closure** (posture: `revise`; Status: `ready-for-human`)
Spec: converge `NoteFrontmatter.references` onto `EvidenceRef`; mark every declared role/kind and `transform.input_refs`/`derived_from`/`selection` and `links.resolves` as consumed or explicitly deferred.
Acceptance: doc shows one evidence edge across envelope/vital/note facts and a table marking each previously-unconsumed evidence/link field consumed-or-deferred (no silent dead fields).

**Issue 08 — `integrity` field + agreed canonicalization id** (posture: `open-question`; Status: `ready-for-human`)
Spec: define the top-level `integrity` field and name the requirement that `jcs-rfc8785-pi-chart-v1` agree with the kernel `canonical_json`/`record_hash` rule.
Acceptance: doc specifies `integrity` presence + canonicalizability mapping to the kernel and flags canonicalization-id agreement as an open prerequisite (not implemented).

**Issue 09 — Lifecycle vocabulary + correction Record-hash requirement** (posture: `revise`; Status: `ready-for-human`)
Spec: complete the `status` lifecycle vocabulary (add `Resolved`, define `draft`, prefer "Replaced"), and require correction facts to persist `revises.target.{id, sha256:<64hex>}`.
Acceptance: doc lists the full lifecycle labels with clinician copy, separates problem-resolution from wrong-claim correction, and states correction facts must carry the target's recomputing kernel Record hash.

**Issue 10 — `certainty` reconnection + review/attestation as separate facts** (posture: `revise`; Status: `ready-for-human`)
Spec: reconnect `certainty` to the uncertainty surface (Concern/Uncertain/Working diagnosis/Resolved; Pi never upgrades to diagnosis) and model Reviewed/Verified/Signed/Co-signed as separate facts (never mutations).
Acceptance: doc shows `certainty` driving the uncertainty projection and review state as a projection over separate review facts; Done vs Charted not collapsed.

**Issue 11 — Projection-facing fields: authority, attention/risk, timing, access tier** (posture: `adopt`; Status: `ready-for-agent`)
Spec: name authority posture, attention/clinical-risk cue, nonpunitive timing state, and hot/warm/cold access tier — stating which are derived from other fields and which must be explicit.
Acceptance: doc maps each projection label to its source field(s); hot/warm/cold is explicitly an access/priority tier, not storage/retrieval/vector/disease-course.

**Issue 12 — Human-agent suggestion state on the substrate** (posture: `adopt`; Status: `ready-for-agent`)
Spec: define the `Suggested` provisional fact state, human-only promotion (Add to Shift Brain), disable-ability, and the no-autonomous-write/completion boundary.
Acceptance: doc shows suggestion state as a fact-level field, promotion as a separate human action, and states no autonomous accepted-write or completion authority.

**Issue 13 — EventEnvelope/NDJSON/Markdown as fixture + export round-trip contract** (posture: `adopt`; Status: `ready-for-agent`)
Spec: state (per ADR 018 point 4) that the brownfield layout is the fixture/export/archive format and require every contract field to round-trip to/from it.
Acceptance: doc gives a field→export-key crosswalk for envelope/vital/note shapes and asserts round-trippability for `patient_001` regression and `patient_002` demo.

**Issue 14 — Clinician-surface derivation guarantee** (posture: `adopt`; Status: `ready-for-agent`)
Spec: state, per surface (Current Snapshot, Shift Brain, Report View, Handoff View, Chart Review Packet), that every label is a projection over named fields and that mismatches surface as review prompts.
Acceptance: doc maps each surface's labels to substrate fields and asserts no surface stores truth and no surface makes autonomous truth decisions.

**Issue 15 — Kernel-mappability closeout + boundary register** (posture: `open-question`; Status: `ready-for-human`)
Spec: enumerate the seven things the chart must make explicit to be mappable, assert the kernel is not widened, and record the deferred Rust↔TS integration-mechanism decision and other boundaries.
Acceptance: doc lists the seven mappability prerequisites against the frozen public interface, states "no kernel widening," and records the Rust↔TS mechanism and backend/sim/retrieval decisions as out-of-scope/deferred.
