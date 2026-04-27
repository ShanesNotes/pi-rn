# PRD: integrity-first foundation hardening before seeded-chart expansion

## Plan Summary

**Scope**
- 3 lanes: immediate canonical-integrity hard gate, bounded contract freeze, explicit deferrals.
- Estimated complexity: HIGH.
- Primary touchpoints: `src/write.ts`, `src/validate.ts`, `src/types.ts`, `src/views/openLoops.ts`, `src/views/evidenceChain.ts`, `src/views/trend.ts`, `README.md`, `DESIGN.md`, `CLAIM-TYPES.md`, `ARCHITECTURE.md`, `schemas/event.schema.json`, `schemas/note.schema.json`, `schemas/vitals.schema.json`, `decisions/`.

**Key deliverables**
1. A hard gate for sanctioned canonical patient-content writes and Track B seeded-chart authoring through sanctioned writers before more chart content is added.
2. A contract freeze only for semantics required to move current validator-only integrity rules earlier.
3. A defer list that keeps Track A research moving while still naming the bigger unresolved model questions.

## Grounding Evidence

- `appendEvent()` / `writeArtifactRef()` persist schema-valid but graph-invalid records because link resolution, support sufficiency, target typing, and supersession monotonicity still live in `src/validate.ts`, not the write boundary.
- `writeNote()` is a sanctioned public writer, but every note is `type: communication` and validator requires a matching communication event; `writeNote()` can therefore persist validator-invalid state by design.
- `writeNote()` also persists `references[]` without referential checks; validator rejects unknown refs later.
- `openLoops()` filters superseded/corrected intents but not superseded/corrected fulfillments, so stale fulfillments can still close or fail an intent.
- `evidenceChain()` resolves artifact refs against `patientRoot + data.path` with only `fs.access`, allowing absolute-path or traversal escape unless path semantics are tightened.
- Structured vitals refs support `encounterId` in schema/types/validator, but `evidenceChain()` calls `trend()` without preserving encounter scoping.
- `nextEventId()` is explicitly single-writer only. The repo must not imply stronger concurrency guarantees than it actually enforces.
- Invariant 5 and related evidence semantics drift across `README.md`, `DESIGN.md`, `CLAIM-TYPES.md`, and `src/validate.ts`.
- `ARCHITECTURE.md` currently overstates write-time enforcement, claiming link resolution and circular-supersession prevention in `write.ts` that do not exist yet.
- `ROADMAP.md` says the current focus is research-heavy Track A plus Track B seeded charts. Track A should keep surfacing primitive gaps; not all Phase A work should be blocked by broad ADRs.

## RALPLAN-DR Short Mode Summary

### Principles
1. Integrity before seeded-chart growth. Do not add more sanctioned canonical patient content while sanctioned writers can persist invalid or scope-unsafe state.
2. Narrow the gate to proven runtime defects. Block sanctioned canonical authoring and Track B seeded-chart writes, not tests/docs/code that harden those writers and not Track A research.
3. Freeze only contracts needed to hoist current validator rules earlier.
4. Keep one authoritative meaning per invariant across docs, schema, validator, and write path.
5. Defer broader ontology/policy work unless current code or Phase A evidence proves it is immediately forced.

### Top decision drivers
1. **Canonical write safety:** sanctioned public writers can still persist orphan notes, dangling note references, unsafe artifact refs, and graph-invalid links.
2. **Core view correctness:** `openLoops()` and `evidenceChain()` have concrete semantic bugs that will mislead seeded-chart usage.
3. **Planning discipline:** the roadmap supports continued Track A research; the gate must not expand into a broad pre-Phase-A redesign.

### Viable options

#### Option A — narrow integrity gate, mini contract freeze, keep Track A moving
- Fix sanctioned write leaks and core view bugs first.
- Resolve only the contract questions needed to enforce those bugs earlier.
- Keep Track A research and open-schema discovery running.
- **Chosen because:** it protects canonical state now without freezing broader design questions prematurely.

#### Option B — doc/ADR reconciliation first, then runtime fixes
- Clarify docs before moving code.
- **Invalidation rationale:** public writers remain able to persist invalid canonical state while the repo waits on prose convergence.

#### Option C — broad foundation redesign before more Phase A work
- Solve interval/status/grouping/import-author/privacy as one package.
- **Invalidation rationale:** too broad for the actual proven failures; conflicts with the repo’s research-first Track A cadence.

## Practical PRD

## 1. Immediate hard gate

This gate blocks:
- new sanctioned canonical patient-content writes through sanctioned writers (`appendEvent`, `writeNote`, `writeCommunicationNote`, `writeArtifactRef`)
- Track B seeded-chart authoring / synthetic patient expansion through those sanctioned writers

This gate does **not** block:
- tests, docs, schema work, and code changes needed to harden those sanctioned writers and views
- Track A research artifacts in `clinical-reference/`
- schema-question surfacing and owner review loops already described by Phase A docs
- broader Track A research that does not mint new sanctioned canonical patient content

### 1.1 Close sanctioned write-path integrity leaks
- Touchpoints: `src/write.ts`, `src/validate.ts`, `src/write.test.ts`, `src/validate.test.ts`.
- Required outcomes:
  - reject unresolved `links.*` targets before persistence where the rule is already settled
  - reject note `references[]` pointing at unknown ids before note persistence
  - sanctioned public communication-note authoring must go through `writeCommunicationNote()`
  - `writeNote()` is removed or formally deprecated from the supported public authoring contract (`src/index.ts`, `README.md`, `ARCHITECTURE.md`) unless it can uphold the paired communication-event invariant; execution should assume the default outcome is deprecation/removal from the sanctioned surface rather than keeping it public-but-unsanctioned
  - move settled target-typing checks (`links.fulfills`, `links.addresses`) earlier where the contract is already unambiguous
  - do **not** hoist invariant 5 into write-time rejection until its severity and allowed support forms are frozen
- Acceptance intent: no sanctioned write call can create orphan notes, dangling note references, or already-settled graph-invalid links.

### 1.2 Fix stale fulfillment handling in `openLoops()`
- Touchpoints: `src/views/openLoops.ts`, `src/views/openLoops.test.ts`, possibly `src/views/active.ts`.
- Required outcomes:
  - superseded/corrected fulfillments are excluded from state computation
  - stale final fulfillments cannot silently close intents
  - stale failure fulfillments cannot incorrectly force `failed`

### 1.3 Fix artifact boundary safety end to end
- Touchpoints: `src/write.ts`, `src/views/evidenceChain.ts`, `src/views/evidenceChain.test.ts`, `src/validate.ts`, `src/validate.test.ts`, docs.
- Required outcomes:
  - define one stored-path rule for `artifact_ref.data.path`
  - reject absolute paths and normalized escapes
  - validate path confinement at write time
  - ensure read-side artifact resolution cannot escape the patient artifact tree
  - tighten validator coverage so a bad artifact ref cannot sit green in canonical storage

### 1.4 Preserve encounter scoping for structured vitals evidence
- Touchpoints: `src/types.ts`, `src/views/evidenceChain.ts`, `src/views/trend.ts`, `src/views/evidenceChain.test.ts`, `src/views/trend.test.ts`.
- Required outcomes:
  - `encounterId` survives the evidence-chain → trend call path
  - encounter-scoped typing stays explicit at the shared type boundary, not only in call-site locals
  - multi-encounter charts cannot pull vitals from the wrong encounter
  - add a regression with two encounters sharing the same metric/window and prove `evidenceChain()` returns only points for the referenced `encounterId`

### 1.5 Make the single-writer ID contract explicit and test-backed
- Touchpoints: `src/write.ts`, `README.md`, `DESIGN.md`, tests.
- Required outcomes:
  - no false implication of multi-writer safety
  - collision/guardrail behavior is documented and regression-tested
  - if no locking is added, the contract stays explicitly single-writer

## 2. Mini contract freeze

Settle only the semantics needed for the hard gate and current-doc credibility.

### 2.1 Resolve invariant 5 and support-kind semantics
- Touchpoints: `README.md`, `DESIGN.md`, `CLAIM-TYPES.md`, `ARCHITECTURE.md`, `src/validate.ts`, `schemas/event.schema.json`.
- Decisions needed now:
  - Is invariant 5 an error or warning?
  - What exactly qualifies as acceptable support for an assessment?
  - Are bare-id support kinds intentionally narrower than general `supports[]` references?
- This must be frozen before any write-time hoist of support sufficiency.

### 2.2 Document structured evidence references and validator-only rules
- Touchpoints: `CLAIM-TYPES.md`, `README.md`, `ARCHITECTURE.md`, schema descriptions.
- Items to align now:
  - structured `EvidenceRef` form in docs
  - note↔communication binding
  - `links.fulfills` / `links.addresses` target typing
  - `vitals.quality`
  - architecture doc claims about what `write.ts` actually enforces

### 2.3 Define artifact evidence modeling clearly enough to enforce
- Needed now because path confinement depends on what `artifact_ref.data.path` means.
- Decision scope:
  - patient-root-relative vs artifacts-root-relative
  - whether file existence is required at write time
  - whether validator must also check path confinement

## 3. Deferred but tracked decisions

These remain open unless the hard gate or Track A evidence proves otherwise.

### Likely deferred ADRs
- Interval semantics as a repo-wide abstraction.
- Broader status richness beyond the local bridge needed by current views.
- Orderset/grouping primitive.
- Import author/provenance authorship model.

### Named conceptual/policy deferrals
- HIPAA amendment vs append-only history model.
- Privacy/redaction layers.
- Co-sign / scope-of-practice model.
- Per-event `schema_version`.
- Timestamp granularity / fractional seconds.
- Aggregation-aware views beyond the specific encounter-evidence fix.

## Acceptance Criteria

1. Sanctioned write APIs can no longer persist orphan communication notes.
2. Sanctioned public communication-note authoring is explicitly routed through `writeCommunicationNote()`, and `writeNote()` is removed or formally deprecated from the supported public authoring contract unless it can uphold the paired communication-event invariant.
3. Sanctioned write APIs reject unknown note `references[]` and already-settled invalid `links.*` targets before persistence.
4. Artifact refs are patient-boundary safe at write, validate, and read time.
5. `openLoops()` ignores superseded/corrected fulfillments for loop-state computation.
6. `evidenceChain()` preserves encounter scoping for structured vitals evidence, including a regression where two encounters share the same metric/window and only the referenced `encounterId` contributes points.
7. The single-writer limitation around generated IDs is explicit, honest, and regression-tested.
8. Docs and schema descriptions align on:
   - invariant 5 severity and support-kind rules
   - structured `EvidenceRef`
   - note↔communication binding
   - target typing for `links.fulfills` / `links.addresses`
   - `vitals.quality`
   - actual write-path enforcement claims in `ARCHITECTURE.md`
9. `clinical-reference/` and Track A research remain unblocked while Track B seeded-chart authoring remains gated until items 1–8 are complete.

## Verification Steps

1. Add regression tests before behavior edits for:
   - sanctioned public note authoring routing through `writeCommunicationNote()` and non-sanctioned/internal `writeNote()` boundaries
   - dangling note `references[]`
   - settled `links.*` write rejection
   - stale fulfillment filtering
   - artifact path escape rejection
   - encounter-scoped vitals evidence with two encounters sharing the same metric/window and proof that `evidenceChain()` returns only points for the referenced `encounterId`
   - single-writer contract / collision guardrails
2. Run `npm test`.
3. Run `npm run check`.
4. Run `npm run typecheck`.
5. Perform targeted doc-contract review across `README.md`, `DESIGN.md`, `CLAIM-TYPES.md`, `ARCHITECTURE.md`, and relevant schema descriptions.

## Recommended Sequencing

1. Freeze the narrow gate: no new Track B seeded-chart authoring or other sanctioned canonical patient-content writes through sanctioned writers until the hard-gate defects are closed.
2. Resolve invariant 5 severity/support-kind semantics first, because that choice governs how far write-time enforcement can move.
3. Land sanctioned write-path fixes next:
   - note/communication and note-reference leaks
   - settled `links.*` write rejection
4. Land artifact boundary safety across write, validate, and read.
5. Land the two view correctness fixes:
   - stale fulfillments in `openLoops()`
   - encounter-preserving structured vitals evidence
6. Tighten ID-contract docs/tests.
7. Reconcile docs/schema/architecture claims after behavior is stable.
8. Let Track A continue surfacing bigger schema questions; elevate deferred ADRs only when evidence shows they are now forced.

## ADR

### Decision
Adopt a narrow integrity gate before additional seeded-chart authoring. Fix the concrete sanctioned-write and core-view defects first, freeze only the contracts those fixes depend on, route sanctioned public communication-note authoring through `writeCommunicationNote()`, remove or formally deprecate `writeNote()` from the supported public authoring surface unless it can satisfy the paired-event invariant, and keep Track A research moving.

### Drivers
- Proven canonical write leaks exist today.
- Core view bugs can misrepresent chart state.
- The roadmap supports continued research while build-track chart authoring hardens.

### Alternatives considered
- Doc/ADR-first reconciliation before runtime fixes.
- Broad foundation redesign before more Phase A work.

### Why chosen
It addresses the highest-risk defects without turning the hardening pass into a broad redesign or stalling research that should still shape later decisions.

### Consequences
- Track B slows until the gate is green.
- Some validator-only rules move earlier, but only after their semantics are frozen.
- Broader lifecycle/grouping/import-author work remains intentionally deferred unless new evidence forces it.

### Follow-ups
- Reassess whether deferred ADRs need to be pulled forward after A1/A2 calibration and `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md` review.
- If multi-writer safety becomes a requirement, design a real locking/journal mechanism instead of stretching the current ID allocator.
