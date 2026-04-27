# Deep-research alignment — revised decision artifact

**Status:** revised operational plan after optimized research outputs  
**Date:** 2026-04-25  
**Repo target path:** `/deep-research-alignment` or `memos/deep-research-alignment.md`  
**Supersedes:** `deep-research-alignment-24042026.md` as the active alignment artifact  
**Purpose:** preserve the useful four-workstream alignment, replace completed research prompts with pointers to the decision artifacts already produced, and keep the next implementation lane narrow.

---

## Bottom line

The alignment report remains directionally strong. Its best move is still the collapse into four workstreams and the decision to make **Workstream A — memory-proof projection over a six-surface broad EHR skeleton — the next lane**. That choice matches the verification standard behind ADR 016: one coherent fixture, every item time/provenance-bound, deterministic projection answering what happened / why it mattered / evidence / uncertainty / open loops / handoff, and at least one bedside observation reused through projections rather than re-entered.

The main revision is that several optimized research prompts have now been run. They should no longer appear as “go research this” tasks. They should be treated as **source decision artifacts** that feed the plan:

- `Workstream A PRD test(1).md` resolves the missing Workstream A PRD/test-spec prompt.
- `definitive-fhir-boundary-pi-chart.md` resolves the minimum viable FHIR boundary question.
- `pi-chart-openEHR-cycle-decision-synthesis.md` resolves the openEHR contribution/audit pattern-borrow question.
- `pi-chart-boundary-adapter-definitive-synthesis(1).md` resolves the Medplum/HealthChain adapter-ergonomics question.
- `Pasted markdown(3).md` supplies the revised “decision-shaped prompt” discipline and the `## Bottom line` framing for this artifact.

The active implementation direction is therefore:

> **Build Workstream A now. Use the completed standards/adapter reports as constraints and future implementation references, not as reasons to widen the current build.**

In practical terms: extend `patient_001`, add `memoryProofProjection()`, prove chart-once/project-many, and only then implement the FHIR adapter boundary. Do not turn pi-chart into FHIR, openEHR, Medplum, HealthChain, a full EHR, or a compliance platform.

---

## 1. Source artifact register

| Artifact | Status in this revision | How this revised alignment uses it |
|---|---:|---|
| `deep-research-alignment-24042026.md` | Superseded baseline | Keeps the four-workstream structure and Workstream A next-lane decision. |
| `Pasted markdown(3).md` | Accepted review / framing note | Promotes `## Bottom line`, decision-shaped prompts, schema-entropy discipline, negative-space findings, and Workstream A PRD/test-spec as the missing highest-value prompt. |
| `Workstream A PRD test(1).md` | **Adopt as Workstream A implementation blueprint** | Defines fixture extension around existing `patient_001`, canonical reuse target, event sequence, `memoryProofProjection()` API, deterministic ordering, fingerprints, tests, schema-impact table, do-not-build list, and PR sequence. |
| `definitive-fhir-boundary-pi-chart.md` | **Adopt as C1 boundary decision** | Freezes Workstream A FHIR boundary: `Composition`, `Observation`, `ServiceRequest`, `DocumentReference`, `Provenance`; `Bundle`/`Patient` are infrastructure; `AuditEvent` is a companion operational/export log, not clinical lineage. |
| `pi-chart-openEHR-cycle-decision-synthesis.md` | **Adopt as C2 / governance decision** | Borrow openEHR `CONTRIBUTION` / `AUDIT_DETAILS` at the Git commit boundary. Use structured commit trailers. Do not add a canonical `cycle` event, top-level `cycles/`, or event-schema change. Defer generated `_derived/cycles/` until a real consumer appears. |
| `pi-chart-boundary-adapter-definitive-synthesis(1).md` | **Adopt as C3 adapter API decision, sequenced after A** | First adapter is a stateless, typed, read-only projection boundary: `exportMemoryProof(scope, views, options, encounterRef?) -> FhirExportResult`; mandatory Provenance; optional single AuditEvent; no FHIR server, runtime agent framework, or production auth layer. |

---

## 2. Revised disposition summary

| Area | Prior disposition | Revised disposition | Decision |
|---|---:|---:|---|
| Workstream A: broad EHR fixture + memory-proof projection | `plan-candidate` | **implementation-blueprint adopted** | Build from `Workstream A PRD test(1).md`. |
| M1 / M4 / D1 / D2: six-surface fixture, deterministic projection, chart-once/project-many, evidence/open-loops | planned / partial-shipping | **next implementation lane** | Extend `patient_001`; add `src/views/memoryProof.ts`; add deterministic tests. |
| M3 / S1: FHIR boundary | research-prompt | **boundary decision adopted; implementation deferred** | Use five semantic resources: `Composition`, `Observation`, `ServiceRequest`, `DocumentReference`, `Provenance`. Implement adapter only after Workstream A fixture/projection tests exist. |
| S2: openEHR contribution semantics | research-prompt | **Git commit convention adopted** | One Git commit per agent decision cycle with parseable trailers. No cycle event. No `event.schema.json` change. |
| O1/O5: Medplum + HealthChain ergonomics | research-prompt | **adapter API decision adopted; build after A** | Use low-friction function call + mandatory Provenance; reject platform/runtime/access-control surfaces. |
| M2 / governance C1: actor, attestation, review taxonomy | ADR-candidate | **still pending; next governance prompt after A** | Run/design only against Workstream A fixture evidence. |
| C2: read-path observability | ADR-candidate later | **defer** | Do not log all reads now. Preserve pure view semantics. Revisit with concrete clinical/review need. |
| C3: retention/redaction/logical-delete/export policy | ADR-candidate later | **defer** | Keep separate from hash-chain and FHIR boundary. Needed before compliance posture, not before Workstream A. |
| S4: AI Transparency on FHIR | low research | **watch only** | Vocabulary scan after adapter or attestation taxonomy; no compliance claim. |
| Positioning docs | deferred | **still deferred** | Update README/DESIGN/ROADMAP language after the Workstream A proof exists. |
| Broad OSS scans / EHR platform comparisons | low/skip/defer | **do not run unless a specific decision needs them** | OpenMRS, GNU Health, OpenEMR, HAPI FHIR, OpenHIM, and agent-platform scans are not active lanes. |

---

## 3. Updated workstreams

### Workstream A — Immediate product proof

**Status:** next build lane; PRD/test-spec now available.

**Source artifact:** `Workstream A PRD test(1).md`

**Decision answered:** Build the proof around existing `patient_001`, not a new sepsis/pulmonary-edema scenario. Extend the current respiratory-decompensation seed into a broad-but-shallow six-surface fixture and add one deterministic composite projection that proves:

> **chart once → project many** across vitals, bedside assessment, note, orders/interventions, labs/diagnostics, open loops, review, care plan, and handoff.

**Implementation target:**

```text
src/views/memoryProof.ts
src/views/memoryProof.test.ts
src/views/fingerprint.ts        # optional helper
patients/patient_001/timeline/2026-04-18/events.ndjson
patients/patient_001/timeline/2026-04-18/vitals.jsonl
patients/patient_001/timeline/2026-04-18/notes/0852_sbar-update.md
patients/patient_001/timeline/2026-04-18/notes/1115_handoff.md
specs/memory-proof-projection.md
# or decisions/017-memory-proof-projection.md after implementation proves shape
```

**Canonical reuse target:**

```text
evt_20260418T0848_01
observation:exam_finding
source.kind: nurse_charted
author.role: rn
effective_at: 2026-04-18T08:48:00-05:00
recorded_at: 2026-04-18T08:49:00-05:00
data.name: focused_respiratory_assessment
```

This one bedside observation should be reused through the provider SBAR note, problem assessment, order/open-loop rationale, result review, care-plan update, and handoff projection. The note and handoff may summarize it in prose, but the canonical fact remains one event. Tests should fail if the same structured bedside assessment is re-entered as a second canonical observation.

**Projection API shape:**

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

export async function memoryProofProjection(
  params: MemoryProofParams
): Promise<MemoryProofProjection>;
```

`memoryProofProjection()` is a composite derived view, not a new memory model. It composes existing pure view primitives: `timeline`, `currentState`, `trend`, `evidenceChain`, `openLoops`, and `narrative`. Derived exports go only to `_derived/` and remain disposable.

**Core acceptance tests:**

| Test | What it proves |
|---|---|
| `memoryProofFixture_coversAllSixSurfaces` | Fixture spans vitals, nursing assessment, notes, orders/interventions, labs/diagnostics, care plan/handoff. |
| `singleBedsideObservation_isReusedWithoutCanonicalDuplication` | One focused respiratory assessment is reused across surfaces without becoming a second canonical fact. |
| `memoryProofProjection_hasStableFingerprint` | Deterministic output and SHA-256 fingerprint across identical inputs. |
| `openLoops_closeOnlyThroughActionFulfillment` | Orders/monitoring loops close via explicit action→intent fulfillment, not by lab/diagnostic observations directly. |
| `evidenceChain_includesVitalsObservationLabDiagnosticAndNote` | Evidence reaches primary observations, vitals windows, lab/diagnostic results, acquisition actions, and notes. |
| `noHiddenSimulatorStateLeaksIntoProjection` | Hidden pi-sim state cannot influence or appear in projection. |
| `asOfProjection_doesNotSeeFutureFacts` | Projection respects chart-clock/as-of boundaries. |
| `validateChart_acceptsFixtureWithoutNewPrimitive` | Existing primitives are sufficient; no new top-level event type required. |

**Schema impact:** one new derived view only. No new top-level event primitive. No FHIR export in Workstream A. No actor-attestation schema change until the governance ADR has fixture evidence.

---

### Workstream B — Governance ADR queue

**Status:** sequenced behind Workstream A, except lightweight commit-trailer lint can be added now if convenient.

1. **Structured decision-cycle commit convention** — adopt now at Git layer.
   - Source: `pi-chart-openEHR-cycle-decision-synthesis.md`.
   - Add parseable commit trailers such as `Cycle-Id`, `Change-Type`, `Author-Id`, `Author-Role`, `Run-Id`, `Started-At`, `Event-Ids`, `Note-Ids`, `Artifact-Ids`, `Schema`, and `Validation`.
   - Do not add a canonical cycle event.
   - Do not add top-level `cycles/`.
   - Do not change `event.schema.json`.
   - Defer `_derived/cycles/` until replay/export/audit tooling has a concrete consumer.

2. **Actor / attestation / review taxonomy** — next real governance ADR candidate.
   - Still unresolved.
   - Should be run against Workstream A fixture examples: nurse-charted observation, agent inference, agent synthesis, human review absent, accepted/rejected synthesis, co-signed note/result review.
   - Must distinguish event `status`, `source.kind`, `author.role`, `transform.activity`, and review/attestation state without duplicating them.

3. **Deterministic projection / replay export contract** — lift from Workstream A after implementation.
   - Do not author abstractly before `memoryProofProjection()` survives tests.
   - Candidate ADR 017 can capture projection shape, fingerprint behavior, and `_derived/` export rules.

4. **Read-path observability** — later.
   - Do not break pure view primitives by making every read a chart mutation.
   - Likely shape: no raw read audit now; clinically meaningful reviews become explicit chart events; raw access logging stays sidecar/future.

5. **Retention / redaction / logical delete / export policy** — later.
   - Separate clinical correction, entered-in-error, supersession, privacy redaction, export omission, and local filesystem deletion.
   - Do not conflate this with hash chain or FHIR Provenance.

6. **Hash chain + `invalidated_at`** — later.
   - Author only if Workstream A, adapter export, or governance needs force it.

---

### Workstream C — Focused standards and adapter decisions

**Status:** core C1–C3 research prompts are now resolved as decision artifacts. Implementation remains gated behind Workstream A.

#### C1. FHIR minimum viable boundary — adopted

**Source artifact:** `definitive-fhir-boundary-pi-chart.md`

**Decision:** FHIR is a read/export boundary only. The Workstream A semantic resource boundary is:

1. `Composition` — six-section memory-proof document skeleton.
2. `Observation` — vitals, exam findings, structured assessments, and lab results.
3. `ServiceRequest` — orders, requested interventions, pending loops, and intent anchors.
4. `DocumentReference` — notes, narrative charting, handoff artifacts, external artifacts.
5. `Provenance` — author/source/transform/evidence/revision lineage for every projected clinical resource.

`Bundle` and `Patient` are infrastructure, not counted semantic boundary resources. The primary proof export is `Bundle.type = document` with `Composition` as entry 0. `AuditEvent` is not clinical lineage; it is a companion operational/export log and should be excluded from canonical clinical fingerprint input.

**Deferred resources:** `Encounter`, `DiagnosticReport`, `MedicationRequest`, `MedicationAdministration`, `CarePlan`, `Communication`, `Task`, `Bundle/history`, public FHIR API, write-back/import semantics, ADT, scheduling, billing, auth, claims, pharmacy workflow, broad CRUD.

#### C2. openEHR contribution/audit pattern borrow — adopted at Git layer

**Source artifact:** `pi-chart-openEHR-cycle-decision-synthesis.md`

**Decision:** openEHR `CONTRIBUTION` is the pattern; Git commit is the pi-chart implementation. `AUDIT_DETAILS` becomes structured commit metadata. `COMPOSITION` / archetype ontology is rejected for internal pi-chart use.

**Adopt now:** structured commit-message trailers for one commit per agent decision cycle.

**Reject now:** canonical `cycle` event, authoritative `cycles/` directory, event-schema changes, openEHR archetypes/compositions as internal ontology.

**Defer:** generated `_derived/cycles/YYYY-MM-DD/<cycle_id>.yaml` until a concrete replay/export/audit/debugging consumer exists.

#### C3. Medplum + HealthChain adapter ergonomics — adopted as future adapter API

**Source artifact:** `pi-chart-boundary-adapter-definitive-synthesis(1).md`

**Decision:** The first external adapter should feel like a stateless, typed, read-only projection function:

```ts
exportMemoryProof(scope, views, options, encounterRef?) -> FhirExportResult
```

**Adopt:**

- HealthChain-style low-friction function call.
- Medplum-style explicit Provenance.
- TypeScript module under `src/adapters/fhir/`.
- Mandatory Provenance coverage for every clinical resource.
- Optional single export-operation `AuditEvent`.
- Deterministic snapshot tests and no-sim-state-leak tests.
- Import graph guard so FHIR types do not leak outside `src/adapters/fhir/`.

**Reject/defer:**

- FHIR server/search/GraphQL/subscriptions.
- FHIR write boundary.
- Medplum bot runtime or HealthChain service/runtime duplication.
- CDS Hooks server.
- AccessPolicy/RBAC/OAuth/JWT/auth machinery.
- Production multi-user platform surfaces.

**Synthesis correction:** where the adapter ergonomics artifact uses a broader placeholder export shape, the definitive FHIR boundary wins for Workstream A. Use `ServiceRequest` for orders/interventions and use `Composition` / `DocumentReference` for care-plan and handoff projection. Defer `MedicationRequest`, `MedicationAdministration`, and `CarePlan` until a later fixture proves they are necessary.

---

### Workstream D — Positioning docs

**Status:** still deferred.

Do not polish README/DESIGN/ROADMAP positioning until Workstream A produces the proof. The language should follow the demo, not substitute for it.

Preferred direction remains:

```text
agent-native clinical record substrate
```

Avoid overclaiming:

```text
AI-native EHR
replace your EHR
full audit/compliance platform
production clinical memory-context layer
```

Once Workstream A lands, update docs around the concrete claim:

> A single canonical bedside observation can be entered once and reused through note, review, open-loop, care-plan, handoff, and boundary export projections without creating a second memory model.

---

## 4. Implementation sequence

### PR 1 — Workstream A fixture extension

Add the fixture events, vitals rows, and notes from `Workstream A PRD test(1).md`.

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

### PR 2 — `memoryProofProjection()` composite view

Add:

```text
src/views/memoryProof.ts
src/views/memoryProof.test.ts
src/views/fingerprint.ts   # optional helper
```

Export from `src/index.ts`. Keep it pure, deterministic, and disposable.

### PR 3 — Optional derived render

After projection tests pass:

```text
patients/patient_001/_derived/memory-proof.json
patients/patient_001/_derived/memory-proof.md
```

Generated only. Safe to delete and rebuild.

### PR 4 — Spec / ADR capture

After implementation proves the shape:

```text
specs/memory-proof-projection.md
# or decisions/017-memory-proof-projection.md
```

### PR 5 — Lightweight cycle commit convention

This can happen alongside Workstream A if it does not distract:

```text
scripts/lint-cycle-commit.ts       # or equivalent
scripts/list-cycles-from-git.ts    # optional parser
```

Acceptance: chart-mutating commits carry parseable `Cycle-Id`, `Change-Type`, author/run fields, content ids, schema, and validation status. No chart schema changes.

### PR 6 — FHIR adapter skeleton, after Workstream A

Only after the fixture/projection tests exist:

```text
src/adapters/fhir/
  index.ts
  types.ts
  export.ts
  composition.ts
  provenance.ts
  audit.ts
  identifiers.ts
  mapping.ts
  validate.ts
  __tests__/
    snapshot.test.ts
    provenance-coverage.test.ts
    fail-fast.test.ts
    import-graph.test.ts
    no-sim-state-leak.test.ts
    provenance-link-verb.test.ts

docs/adapters/fhir/
  DESIGN.md
  MAPPING.md
```

Acceptance: deterministic `Bundle.type=document`, `Composition` first, every clinical resource has pi-chart id + Provenance, hidden simulator state absent, no FHIR types imported outside adapter.

---

## 5. Do not build yet

Do not build these in the current lane:

- UI panels, React Native screens, handoff visual design, or styling.
- FHIR import/write-back, public FHIR server, FHIR search, GraphQL, SMART, CDS Hooks server, subscriptions, Bulk Data.
- Full MAR, medication reconciliation, barcode administration, pharmacy verification, drug dictionary, medication safety engine.
- Full CPOE.
- Scheduling, billing, claims, ADT, user management, RBAC, authentication, authorization, tenancy.
- Compliance audit logs, raw read-path telemetry, legal retention/redaction machinery.
- openEHR archetypes/compositions as internal ontology.
- Medplum/HealthChain runtime surfaces.
- Vector memory, embeddings, semantic search as a second chart memory.
- Canonical cycle event or authoritative cycle manifest.
- Any code path that reads pi-sim hidden physiology or internal simulator state.

---

## 6. Remaining research/design prompts

The completed C1–C3 reports should not be rerun unless a later implementation failure changes the question. The remaining prompts should be run only when their outputs can feed an ADR, test, or implementation diff.

### B1. Actor / attestation / review taxonomy

**When:** after Workstream A fixture exists, or earlier only if fixture implementation blocks on review/attestation state.

**Decision to unblock:** minimal event/projection-level taxonomy for machine generation, human authorship, human review, rejection, co-signature, supersession, and accountability.

**Required output:** state taxonomy; event-level vs projection-level placement; interactions with `status`, `source.kind`, `author.role`, `transform.activity`, `links.supersedes` / `links.corrects`; schema-impact table; Workstream A tests; ADR recommendation.

### B2. Read-path observability

**When:** only when a real consumer asks “who/what consumed which facts?”

**Decision to unblock:** whether read observability can exist without corrupting pure views or deterministic tests.

**Expected answer:** likely no raw read audit now; model clinically meaningful reviews as explicit chart events; defer raw access audit to sidecar/future.

### B3. Retention / redaction / logical delete / export policy

**When:** before external/compliance posture or before any real export policy.

**Decision to unblock:** minimal vocabulary for correction, invalidation, redaction, export omission, and local deletion in an append-only chart.

### C4. AI Transparency on FHIR vocabulary watch

**When:** after adapter + attestation taxonomy, not before.

**Decision to unblock:** whether any vocabulary or metadata fields are worth mirroring for agent-authored content.

**Constraint:** no compliance claim; no IG adoption decision.

### Optional ecosystem triage

**When:** only if competitive landscape remains strategically important.

**Decision to unblock:** whether any open-source/self-hosted healthcare agent platform treats provenance-native clinical record primitives as core rather than sidecar middleware/logging.

**Hard stop:** if no project has a provenance-native clinical record primitive, stop and report that.

---

## 7. Standard output format for future research

Every future research prompt should return a diff-shaped artifact, not a general essay:

```text
1. Decision answered
   - one sentence.

2. Recommendation
   - adopt / reject / defer / needs operator decision.

3. Evidence
   - primary source bullets only.
   - distinguish direct evidence from inference.

4. Pi-chart mapping
   - existing primitive/view/link/field.
   - proposed change, if any.
   - schema entropy level:
     0 no change
     1 new subtype
     2 new data payload
     3 new link convention
     4 new derived view
     5 new event type
     6 new storage primitive

5. Tests or acceptance criteria
   - concrete test names or fixture checks.

6. Negative-space findings
   - what not to copy.
   - what to defer.
   - what would be premature.

7. Open questions for operator
   - only questions that block implementation.
```

This keeps external research aligned with pi-chart’s discipline: clinical function first, minimum data second, provenance and lifecycle third, mapping into existing primitive grammar fourth, and schema changes only when fixture evidence forces them.

---

## 8. Revised next move

Enter implementation mode around:

> **Memory-proof projection over the six-surface broad EHR skeleton.**

Use `Workstream A PRD test(1).md` as the source build artifact. Treat the FHIR, openEHR, and adapter reports as adopted constraints for the next boundary phase, not as Workstream A implementation scope.

The strongest current proof is not “pi-chart can export FHIR.” It is:

> **pi-chart can preserve one clinical fact as canonical memory and deterministically project it through multiple clinical review surfaces without duplication, hidden simulator leakage, or a second memory model.**

Everything else — FHIR boundary, commit-cycle audit, adapter ergonomics, governance taxonomy, and positioning — should sequence behind that proof.

---

## Revision log

- **2026-04-24:** Original operational alignment collapsed Turn-0 seven-turn workflow into Workstreams A–D and named Workstream A as next lane.
- **2026-04-25:** Revised after optimized research artifacts were run. Workstream A PRD/test-spec adopted as implementation blueprint. FHIR boundary, openEHR cycle metadata, and adapter ergonomics moved from research prompts to decision artifacts. Workstream C is now a completed decision packet with implementation gated behind Workstream A. Positioning remains deferred.
