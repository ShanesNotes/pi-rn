# PRD — Memory-proof projection over the six-surface broad EHR skeleton

## Status

Ralplan consensus draft. Source of truth for the next execution lane after
`memos/deep-research-alignment-24042026.md` §10–§11.

## RALPLAN-DR summary

### Principles

1. **Proof before polish.** Do not align positioning language or broaden
   standards scope until the repo can demonstrate the clinical-memory proof.
2. **Chart once, project many.** One entered clinical observation must reuse the
   same claim stream across review, note, open-loop, and handoff surfaces.
3. **Composition before primitive growth.** Prefer a deterministic projection
   composed from existing views before adding new envelope fields or standards
   adapters.
4. **Observable-only realism.** Fixture data may simulate ICU work, but pi-chart
   consumes only chart/monitor/assessment-like observations, never hidden
   pi-sim internals.
5. **Testable clinical usefulness.** Acceptance is a clinician-readable memory
   proof answering what changed, why it mattered, evidence, uncertainty, open
   loops, and next-shift watch items.

### Decision drivers

1. **ADR 016 proof gap:** The broad skeleton is accepted, but
   `clinical-reference/broad-ehr-skeleton.md` says `patient_001` does not yet
   satisfy it.
2. **Projection leverage:** A formal projection turns existing primitives
   (`timeline`, `currentState`, `trend`, `evidenceChain`, `openLoops`,
   `narrative`) into the report's flagship “chart once, project many” proof.
3. **Scope control:** FHIR, attestation, read-path audit, and positioning work
   become sharper after the proof fixture exposes real gaps.

### Viable options

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| A. Extend `patient_001` and add a memory-proof projection | Reuses existing respiratory-decompensation seed; fastest path to proof; fewer registry/test changes | Existing fixture may become overloaded; harder to preserve narrow teaching-case readability | **Favored if execution wants smallest diff** |
| B. Create `patient_002` as a clean broad-skeleton fixture | Keeps `patient_001` stable; gives coherent end-to-end story with exact test data | More fixture setup and registry updates; broader validation surface | **Favored product path** |
| C. Docs-only positioning pass first | Low effort and safe | Does not close proof gap; risks polished claims without demonstration | Rejected |
| D. FHIR boundary scoping first | Addresses report’s external credibility concern | External standards decisions remain speculative without proof projection shape | Rejected for next lane |

**Chosen planning stance:** Plan execution around Option B, while allowing
implementation to choose Option A only if tests prove a smaller diff preserves
clarity. The PRD assumes a new successor fixture (`patient_002`) because the
proof should be coherent, not retrofitted awkwardly.

## Requirements summary

Build a deterministic **memory-proof projection** over a coherent broad EHR
skeleton fixture. The projection is a repo-native API/export that composes the
existing chart claim stream into six sections:

1. What happened.
2. Why it mattered.
3. Evidence/provenance.
4. Uncertainty.
5. Open loops.
6. Next-shift handoff.

The fixture must span ADR 016’s six surfaces:

1. Flowsheets/vitals.
2. Nursing assessment.
3. Notes/narrative charting.
4. Orders/meds/interventions.
5. Labs/diagnostics.
6. Care plan/handoff.

The fixture must prove a single bedside observation can be entered once and
reused through review/projection, note context, open-loop/task state, and
handoff without duplicate manual charting.

## In scope

- Add or extend a synthetic patient fixture with a coherent ICU deterioration
  story.
- Add a deterministic projection API, likely `memoryProof(...)`, exported from
  `src/index.ts`.
- Add a derived render target, likely `_derived/memory-proof.md`, if useful for
  operator review.
- Add tests that validate determinism, section content, evidence references,
  open-loop inclusion, uncertainty/contradiction handling when present, and
  chart-once-project-many reuse.
- Update lightweight docs/roadmap rows only where needed to point to the new
  API/proof surface.

## Out of scope

- FHIR adapter implementation.
- Attestation/review taxonomy implementation.
- Read-path audit logging.
- Retention/redaction/legal export semantics.
- UI work.
- Hidden pi-sim coupling.
- Broad production EHR scope such as scheduling, billing, auth, or general CPOE.

## Functional requirements

### FR1 — Coherent six-surface fixture

The fixture must include one clinical trajectory where a respiratory concern
crosses all six surfaces:

- Vitals trend worsens over time.
- Bedside assessment adds non-monitor context.
- An assessment interprets the trend with evidence links.
- One or more intents/actions represent order/intervention work and pending
  loops.
- Lab/diagnostic data supports, refines, or leaves uncertainty around the
  assessment.
- Narrative note and handoff/care-plan content reuse the same underlying
  observations and links.

### FR2 — Formal memory-proof projection

Expose a pure read API that returns JSON-serializable output. Candidate shape:

```ts
export interface MemoryProof {
  patient_id: string;
  asOf: string;
  sections: {
    what_happened: MemoryProofItem[];
    why_it_mattered: MemoryProofItem[];
    evidence: MemoryProofEvidence[];
    uncertainty: MemoryProofItem[];
    open_loops: MemoryProofOpenLoop[];
    next_shift_handoff: MemoryProofItem[];
  };
  source_view_refs: string[];
}
```

Implementation should compose existing views before adding a new independent
model. If the API needs a different name or shape, execution may adjust it
while preserving acceptance criteria.

Replay boundary requirement: `memoryProof` must resolve one canonical `asOf`
once, then pass that same boundary into every composed read. Existing view
semantics differ today:

- `currentState` and `openLoops` accept `asOf`.
- `timeline` can be bounded via `to`.
- `narrative` must be bounded via `to: asOf`.
- `evidenceChain` does not currently accept `asOf`; execution must either add
  replay-safe `asOf` support to `evidenceChain` or avoid using all-time
  evidence expansion inside replay-sensitive projection output.

No future event, note, evidence node, handoff item, diagnostic result, or open
loop may appear in a projection for an earlier `asOf`.

### FR3 — Derived operator artifact

If implemented, `_derived/memory-proof.md` must be deterministic, generated, and
explicitly non-authoritative like existing `_derived/*` files.

### FR4 — Chart-once-project-many reuse

At least one bedside observation must appear by reference in:

- the clinical interpretation/review section,
- a narrative or note-backed section,
- an open loop or care-plan/handoff item,
- an evidence/provenance trail.

The same event id must be reused; no duplicate event should be authored merely
to satisfy a projection.

The proof must be graph-level, not text-level. The reused event id must be
reachable through structured links/references:

- as support for an assessment or review item,
- as a note/reference or communication support,
- as support for an intent/open-loop/care-plan/handoff item,
- and as a provenance/evidence item in the memory-proof projection.

### FR5 — Determinism and replay

Running rebuild/projection twice against unchanged chart data must produce
byte-identical JSON/Markdown output. `asOf` must be supported and tested.
Replay tests must assert the absence of future content across section items,
evidence/provenance nodes, narrative/note references, and open-loop/handoff
content.

## Acceptance criteria

1. A fixture covers all six ADR 016 surfaces in one coherent story.
2. `memoryProof({ scope, asOf? })` or equivalent returns JSON-serializable
   output with the six required sections.
3. Projection output includes event ids / evidence refs sufficient to trace why
   each clinically meaningful summary appears.
4. One bedside observation is reused across at least four projection contexts
   without duplicate charting.
5. `_derived/memory-proof.md`, if present, is deterministic and generated.
6. `npm test`, `npm run typecheck`, and `npm run check` pass.
7. No external standards claims or adapters are introduced.
8. Hidden simulator state is not referenced by fixture or projection code.

## Implementation steps

1. **Design output contract.**
   - Inspect `src/types.ts`, `src/views/*`, and `src/derived.ts`.
   - Add `MemoryProof*` types only if needed.
   - Decide whether projection lives in `src/views/memoryProof.ts` or another
     small module; prefer `src/views/` if it is a read projection.
   - Define the replay contract before implementation: one resolved `asOf` for
     all composed reads. Decide whether to extend `evidenceChain` with `asOf` or
     keep projection evidence shallow and bounded from the already-loaded
     as-of-safe event context.

2. **Build/extend fixture.**
   - Prefer `patient_002` broad-skeleton fixture unless execution finds lower
     risk in extending `patient_001`.
   - Include vitals, exam findings, assessment, intent/action, lab/diagnostic,
     note, and handoff/care-plan data.
   - Keep source/provenance/timestamps explicit.

3. **Implement projection composition.**
   - Compose from `timeline`, `currentState`, `trend`, `evidenceChain`,
     `openLoops`, and `narrative` where practical.
   - Preserve `asOf`.
   - Keep output plain JSON and deterministic.

4. **Add derived renderer.**
   - Extend `rebuildDerived` to emit `memory-proof.md` if the projection is
     stable enough for operator review.
   - Keep generated header and no-authority semantics.

5. **Add tests.**
   - Unit tests for projection section shape and determinism.
   - Fixture test covering six surfaces and event-id reuse.
   - Derived rebuild test for `memory-proof.md` determinism.
   - Validator/check tests against fixture.

6. **Update docs minimally.**
   - Update `ARCHITECTURE.md` and `README.md` only to name the new projection.
   - Update `ROADMAP.md` status when proof lands.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Fixture becomes taxonomy theater | Require every surface to affect review value, evidence, uncertainty, or open loops. |
| New projection duplicates existing view logic | Compose existing views; keep memory-proof module as orchestration/formatting. |
| Patient fixture grows too large | Keep one coherent story and explicit test assertions; do not model full EHR breadth. |
| Projection drifts into note-generation product | Anchor output to evidence refs and deterministic sections, not prose novelty. |
| `asOf` determinism breaks | Test fixed `asOf`, default chart-clock behavior, and repeated rebuild byte equality. |
| Future evidence leaks through all-time evidence traversal | Resolve one `asOf`, bound every composed view, and either make `evidenceChain` replay-safe or avoid all-time expansion in `memoryProof`. |

## ADR section

### Decision

Plan Workstream A as the next execution lane: implement a deterministic
memory-proof projection over a coherent six-surface broad EHR fixture.

### Drivers

- ADR 016 demands a clinical-memory proof surface.
- The deep-research alignment memo identifies Workstream A as the gating next
  lane.
- Existing view primitives are strong enough to compose before adding standards
  or governance layers.

### Alternatives considered

- Positioning docs first — rejected because proof should precede polish.
- FHIR boundary scoping first — rejected because the projection shape should
  determine what needs boundary export.
- Governance ADRs first — deferred until the fixture exposes concrete review /
  attestation gaps.

### Why chosen

This lane converts accepted strategy into executable, verifiable product proof
while minimizing speculative scope.

### Consequences

- Later positioning, FHIR, attestation, and read-path audit work can reference a
  concrete projection and fixture.
- Execution may discover primitive gaps; those become ADR candidates, not
  ad-hoc implementation sprawl.

### Follow-ups

- Workstream B: actor/attestation/review ADR.
- Workstream C: FHIR/openEHR/adapter ergonomics research.
- Workstream D: positioning docs alignment after proof lands.

## Available-agent-types roster

- `explore`: repo mapping and fixture/code touchpoint discovery.
- `executor`: implementation.
- `test-engineer`: projection and fixture test design.
- `architect`: API boundary and projection composition review.
- `critic` / `code-reviewer`: final plan/code review.
- `verifier`: evidence collection and completion proof.
- `writer`: docs/roadmap update after code lands.

## Follow-up staffing guidance

### Ralph path

Use `$ralph` for a single-owner sequential build:

- `explore` first: confirm exact projection touchpoints.
- `executor`: implement fixture + projection + derived render.
- `test-engineer`: add tests in parallel only if Ralph delegates.
- `verifier`: run `npm test`, `npm run typecheck`, `npm run check` and inspect
  generated proof output.

Best when minimizing merge risk and keeping API shape cohesive.

### Team path

Use `$team` only if splitting work is worth coordination:

- Lane 1 executor: fixture patient data and validation.
- Lane 2 executor: projection API and types.
- Lane 3 test-engineer: tests and determinism checks.
- Lane 4 writer: docs only after code stabilizes.

Team verification path:

1. All lanes produce artifacts.
2. Team runs full test/typecheck/check.
3. Ralph or verifier performs final single-owner review of projection output
   against acceptance criteria.

Launch hint:

```text
$team .omx/plans/prd-memory-proof-six-surface-broad-ehr.md
```

or sequential:

```text
$ralph .omx/plans/prd-memory-proof-six-surface-broad-ehr.md
```
