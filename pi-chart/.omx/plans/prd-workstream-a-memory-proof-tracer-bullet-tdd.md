# PRD — Workstream A memory-proof tracer-bullet TDD plan

## Status

- Workflow: `$ralplan` consensus plan
- Source-map decision: `.omx/plans/doc-sprawl-source-map.md` identified **Workstream A memory-proof execution** as the likely first tracer-bullet candidate; the current user review advanced that candidate into `$ralplan`.
- Scope: tracer-bullet TDD hardening and acceptance-gap closure for the existing memory-proof implementation.
- Execution posture: plan only; do not implement in `$ralplan`.

## Requirements summary

Workstream A is the most foundational next lane because it proves the core claim from ADR 016: pi-chart can behave as an agent-native clinical-memory substrate across a broad-but-shallow EHR skeleton without coupling to hidden simulator state.

Current repo inspection shows Workstream A is no longer greenfield. The repo already has:

- `src/views/memoryProof.ts` composing `timeline`, `currentState`, `openLoops`, and `narrative` into six projection sections (`src/views/memoryProof.ts:40-101`).
- `src/views/memoryProof.test.ts` covering six sections, patient_002 six-surface fixture, as-of replay, vitals-window clamping, bedside-observation reuse, and determinism (`src/views/memoryProof.test.ts:17-81`).
- `src/derived.ts` generating `_derived/memory-proof.md` through `rebuildDerived` (`src/derived.ts:76-87`).
- `src/derived.test.ts` checking memory-proof derived determinism and headings (`src/derived.test.ts:63-76`).
- `patients/patient_002/**` as the broad-skeleton fixture used by tests.

Therefore, the next tracer bullet should **not duplicate initial implementation**. It should turn the existing implementation into an acceptance-hardened, TDD-proven execution slice by closing the remaining gaps between:

- existing PRD/test artifacts,
- `memos/Workstream A PRD test.md`,
- `memos/deep-research-alignment-revised-2026-04-25.md`,
- accepted ADR 016,
- and the source-map rule that proposed ADR 017 remains non-canonical.

### Patient fixture reconciliation

The Workstream A memo and revised deep-research alignment describe a `patient_001`-based blueprint. Current repo reality has realized the broad six-surface proof on `patient_002`, with `patient_001` still documented as a narrower seed fixture. This plan accepts `patient_002` as the realized Workstream A fixture unless acceptance hardening proves a concrete coverage gap. Do not back-port to `patient_001` merely for memo fidelity; add a report row documenting the substitution and its rationale.

## RALPLAN-DR summary

### Principles

1. **Hardening over reimplementation:** preserve working `memoryProof` behavior; add only acceptance-gap tests and minimal code needed to pass them.
2. **TDD before polish:** each tracer slice begins with a failing or characterization test before implementation edits.
3. **ADR 016 authority, ADR 017 caution:** prove broad-EHR clinical memory now; do not implement proposed actor/attestation taxonomy as policy.
4. **Chart-only opacity:** memoryProof must read chart surfaces and view APIs, never hidden pi-sim/internal state.
5. **Future-unblocking evidence:** the output must clarify what is proven enough to unblock Phase A bridge, v0.3 reconciliation, and later adapter/boundary planning.

### Decision drivers

1. **Existing implementation is present:** current code already covers much of the original PRD, so the plan must target gaps.
2. **Simulator-opacity and acceptance reporting are the highest leverage gaps:** they directly protect the pi-agent/pi-sim boundary and convert proof into a reusable decision artifact.
3. **Avoid speculative expansion:** fingerprint, adapter, attestation, FHIR, and UI work remain deferred unless a test proves they are needed for Workstream A acceptance.

### Viable options

| Option | Approach | Pros | Cons | Verdict |
|---|---|---|---|---|
| A. Acceptance-hardening tracer bullet | Add/strengthen tests for hidden simulator opacity, memo acceptance coverage, and acceptance report; minimal implementation only if tests fail | Best fit to current repo; small; TDD; unblocks future planning with evidence | Less dramatic than new feature work | **Chosen** |
| B. Full Workstream A reimplementation | Rebuild fixture/projection from memo sequence, likely on `patient_001` | Aligns literally with older memo | Duplicates existing `patient_002` implementation; higher churn; risks regressions | Rejected |
| C. Spec/ADR capture only | Write a memory-proof ADR/spec from current state | Fast and low risk | Insufficient TDD evidence; may canonize gaps | Rejected until hardening tests pass |
| D. Jump to adapter/FHIR boundary | Use memoryProof as-is and start external adapter planning | Moves toward integration | Premature before simulator-opacity and acceptance report are locked | Rejected for this lane |

### Recommendation

Choose **Option A: Acceptance-hardening tracer bullet**.

## Brownfield evidence

- `memoryProof` resolves one `asOf`, then bounds `timeline`, `currentState`, `openLoops`, and `narrative` reads (`src/views/memoryProof.ts:43-63`).
- Projection returns six sections: `what_happened`, `why_it_mattered`, `evidence`, `uncertainty`, `open_loops`, `next_shift_handoff` (`src/views/memoryProof.ts:83-101`).
- Evidence refs are bounded to visible events and clamped vitals windows (`src/views/memoryProof.ts:135-162`, `src/views/memoryProof.ts:192-212`).
- Current tests already assert six-section shape and JSON serializability (`src/views/memoryProof.test.ts:17-30`).
- Current tests already assert patient_002 covers six surfaces (`src/views/memoryProof.test.ts:32-45`).
- Current tests already assert replay/asOf exclusion (`src/views/memoryProof.test.ts:47-58`).
- Current tests already assert canonical bedside observation reuse (`src/views/memoryProof.test.ts:69-75`).
- Workstream A memo still contains additional acceptance ideas: stable fingerprint/export behavior (`memos/Workstream A PRD test.md:488-498`) and hidden simulator opacity (`memos/Workstream A PRD test.md:535-548`).
- Deep-research alignment treats Workstream A as immediate product proof (`memos/deep-research-alignment-revised-2026-04-25.md:64-72`) and defers FHIR adapter skeleton until after Workstream A (`memos/deep-research-alignment-revised-2026-04-25.md:328-335`).
- ADR 016 explicitly frames the broad-EHR skeleton as clinical-memory proof surface and rejects full production EHR/product scope (`decisions/016-broad-ehr-skeleton-clinical-memory.md`).
- ADR 017 is proposed, not accepted, so actor/attestation/review taxonomy must not be implemented as canonical policy in this tracer bullet.

## In scope

1. Add or strengthen TDD tests that close acceptance gaps around hidden simulator opacity, no duplicate canonical bedside observation, deterministic generated memory-proof output, and coverage of memo acceptance criteria.
2. Make the smallest implementation edits required by those tests, if any.
3. Produce a short Workstream A acceptance report that states what is proven, what remains deferred, and what future workstreams this unblocks.
4. Keep `patient_002` as the current broad fixture unless tests prove it is inadequate; do not port back to `patient_001` just to match older memo examples.
5. Preserve existing public API shape unless a test proves a small additive field is needed.

## Out of scope

- FHIR, Medplum, HealthChain, SMART, CDS Hooks, or external adapter implementation.
- UI or React Native surfaces.
- Actor/attestation/review workflow from proposed ADR 017.
- Read-path audit logging, retention/redaction, legal export semantics.
- Full CPOE/MAR/medication reconciliation.
- New top-level event types.
- Hidden pi-sim coupling.
- Rewriting Phase A docs.

## Tracer-bullet slices

### TB-0 — Baseline acceptance gap audit

Purpose: lock current behavior and document what is already satisfied before changing code.

Owned files for later execution:

- `.omx/plans/workstream-a-memory-proof-acceptance-report.md` or similar planning/report artifact.

Test-first proof:

- Run existing `src/views/memoryProof.test.ts`, `src/derived.test.ts`, `npm test`, `npm run typecheck`, `npm run check`.
- Record current pass/fail and the acceptance matrix.

Acceptance:

- Report maps each memo/test-spec acceptance item to `pass`, `gap`, or `deferred`, including a patient_001-blueprint → patient_002-realized-fixture reconciliation row.
- Report explicitly states ADR 017 remains proposed and non-canonical.

### TB-1 — Hidden simulator opacity test

Purpose: prove memoryProof output cannot see simulator internals.

Owned files for later execution:

- `src/views/memoryProof.test.ts`
- temporary test fixture copy under OS temp directory only, not committed patient data, unless a stable repo fixture is clearly cleaner.

TDD sequence:

1. Add a failing test equivalent to memo acceptance `noHiddenSimulatorStateLeaksIntoProjection` (`memos/Workstream A PRD test.md:535-548`).
2. Copy `patient_002` to a temp chart root.
3. Add `_sim_state.json` with forbidden keys such as `hidden_lung_fluid_ml`, `ground_truth_pneumonia_burden`, and `scheduled_event_queue`.
4. Assert `memoryProof(normal)` and `memoryProof(with_sim_state)` are byte-identical and contain none of the forbidden keys.
5. Implement only if the test fails.

Acceptance:

- Test passes without introducing any code path that reads `_sim_state.json`.

### TB-2 — Acceptance coverage tightening

Existing generic coverage to cite before adding new fixture-specific tests:

- `src/views/openLoops.test.ts:155-163` proves terminal action fulfillment closes loops.
- `src/views/openLoops.test.ts:165-179` proves superseded fulfillments do not close loops.
- `src/views/openLoops.test.ts:198-203` proves future intents are hidden by `asOf`.
- `npm run check` proves the fixture validates without new top-level primitives.


Purpose: make current tests traceable to the Workstream A memo without changing projection semantics.

Owned files for later execution:

- `src/views/memoryProof.test.ts`
- possibly `src/derived.test.ts`

TDD sequence:

1. Add/rename tests so memo acceptance concepts are directly represented:
   - six surfaces,
   - single bedside observation reuse without canonical duplication,
   - stable deterministic projection/render,
   - open loops close only through action fulfillment or remain pending correctly,
   - no future facts at earlier `asOf`,
   - validation accepts fixture without new primitive.
2. Prefer assertions over test-name churn if existing coverage is already strong.
3. Add a duplicate-payload guard for the canonical WOB observation if current reuse test does not catch duplicate canonical observations.

Acceptance:

- Each Workstream A memo acceptance row is either covered by a test or explicitly deferred in the acceptance report with rationale.

### TB-3 — Optional deterministic export/fingerprint decision

Purpose: decide whether stable fingerprint/export is necessary now or deferred.

Owned files for later execution if implemented:

- `src/views/memoryProof.test.ts`
- optionally `src/views/memoryProof.ts` or a tiny helper only if required
- no adapter files

TDD sequence:

1. Start with a test that compares deterministic canonical JSON of `memoryProof` output across repeated calls and across rebuild when practical.
2. If current deterministic output is sufficient, document fingerprint as deferred.
3. If future adapter planning needs a fingerprint now, add the smallest helper and test it; do not introduce adapter semantics.

Acceptance:

- Either a stable deterministic export proof exists, or fingerprint is explicitly deferred in the acceptance report with a decision record explaining why byte-identical deterministic JSON/Markdown is sufficient for Workstream A and why fingerprint belongs to later adapter/export planning.

### TB-4 — Acceptance report and handoff gate

Purpose: convert hardening evidence into a human-reviewable next gate.

Owned files for later execution:

- `.omx/plans/workstream-a-memory-proof-acceptance-report.md`
- optionally `ROADMAP.md` only if the user explicitly approves status updates after tests pass.

Acceptance:

- Report lists tests run and pass/fail.
- Report states proven surfaces and remaining deferred work, including an implement-or-defer fingerprint decision with rationale.
- Report recommends the next workstream: Phase A bridge, v0.3 reconciliation, or adapter/boundary planning.
- No product-code scope expansion is hidden in the report.

## Testable acceptance criteria

1. Source-map authority is preserved: Workstream A is advanced by current HITL/user selection, not by treating the source map alone as final priority.
2. Patient fixture reconciliation is explicit: `patient_001` remains the memo blueprint, while `patient_002` is the realized broad fixture unless tests show a gap.
3. Existing memoryProof tests continue to pass.
4. Hidden simulator opacity is covered by a concrete test.
5. No hidden simulator keys can affect or appear in memoryProof output.
6. The bedside WOB observation remains a single canonical fact reused across assessment/review, evidence, open loop/care plan, and handoff.
7. The Workstream A memo acceptance matrix is represented in tests or explicitly deferred in the acceptance report.
8. ADR 017 actor/attestation assumptions remain non-canonical unless a later HITL decision accepts them.
9. No new top-level event type, FHIR adapter, UI, read-audit, or full EHR product scope is introduced.
10. `npm test`, `npm run typecheck`, and `npm run check` pass.

## Verification steps

- Run targeted tests first:

```bash
node --test --import tsx src/views/memoryProof.test.ts src/derived.test.ts
```

- Run full quality gates:

```bash
npm test
npm run typecheck
npm run check
```

- Run boundary checks:

```bash
git status --short
grep -R --exclude="*.test.ts" "hidden_lung_fluid_ml\|ground_truth_pneumonia_burden\|scheduled_event_queue" src patients || true
# Expected runtime-code result: no matches outside tests. Planning/report artifacts may mention forbidden keys only as examples.
```

Expected boundary behavior: forbidden hidden-state strings may appear only in tests and planning/report text, never in projection output fixtures or runtime code that reads simulator state. Any grep hit must be classified as `test/planning-ok` or `runtime-fail`.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Plan duplicates already-complete Workstream A implementation | Treat current implementation as baseline; target acceptance gaps only. |
| Tests become brittle prose checks | Assert structured event IDs, section keys, and JSON output rather than rendered prose where possible. |
| Fingerprint work expands into adapter/export scope | Start with deterministic JSON proof; defer fingerprint unless needed. |
| Proposed ADR 017 leaks into implementation | Mark ADR 017 non-canonical in report and avoid actor/attestation workflow changes. |
| Fixture copy in tests is slow or fragile | Use temp dirs and narrow copy filters; keep assertions focused. |
| `npm run check` rewrites derived files unexpectedly | Treat `_derived/*` as generated; inspect git status and only keep intentional generated changes. |

## ADR — choose acceptance-hardening tracer bullet

### Decision

Execute Workstream A as an acceptance-hardening tracer bullet over the existing memoryProof implementation, not as a greenfield build.

### Drivers

- Current repo already implements and tests the core memoryProof projection.
- Workstream A’s highest remaining value is proving acceptance gaps and simulator opacity.
- Future Phase A/v0.3/adapter work needs trustworthy evidence more than duplicate code.

### Alternatives considered

- **Full reimplementation from memo:** rejected because patient_002 and memoryProof already exist and pass broad tests.
- **Spec/ADR only:** rejected because it would canonize the proof without closing acceptance gaps.
- **Adapter/FHIR next:** rejected because alignment memo explicitly defers adapter skeleton until after Workstream A proof.

### Why chosen

Acceptance-hardening is the thinnest TDD slice that converts existing implementation into reliable foundation evidence.

### Consequences

- Later execution may be mostly tests and report, with little production-code change.
- The team gains confidence to move into Phase A bridge or v0.3 reconciliation.
- Fingerprint/export and ADR capture stay evidence-driven instead of speculative.

### Follow-ups

- After hardening passes, choose the next lane from the acceptance report.
- If Workstream A exposes Phase A fixture gaps, plan Phase A completion-to-implementation bridge.
- If Workstream A exposes substrate/projection policy gaps, plan v0.3 reconciliation.
- If Workstream A is stable, plan adapter/boundary work.

## Available-agent-types roster

- `explore` — inspect current coverage and file relationships.
- `planner` — maintain acceptance matrix and report.
- `test-engineer` — design failing/characterization tests.
- `executor` — implement minimal code/test changes.
- `architect` — verify boundary, API shape, and ADR authority.
- `critic` — review testability and scope discipline.
- `verifier` — run commands and check evidence.
- `writer` — polish acceptance report.

## Follow-up staffing guidance

### `$ralph` sequential path

Recommended for this work because the slice is narrow and evidence-heavy.

Suggested launch:

```bash
$ralph .omx/plans/prd-workstream-a-memory-proof-tracer-bullet-tdd.md
```

Staffing:

- Ralph leader: owns TDD loop and final evidence.
- `test-engineer`: hidden simulator opacity and acceptance-matrix tests.
- `executor`: minimal code changes only if tests fail.
- `verifier`: full quality gates and git boundary.
- `architect`: final approval that scope did not expand.

### `$team` parallel path

Use only if execution widens unexpectedly.

Suggested lanes:

1. Test lane: hidden simulator opacity + coverage gaps.
2. Implementation lane: minimal fixes from failing tests.
3. Report lane: acceptance matrix and next-gate recommendation.
4. Verification lane: typecheck/test/check and boundary audit.

Suggested launch:

```bash
$team .omx/plans/prd-workstream-a-memory-proof-tracer-bullet-tdd.md
```

## Team verification path

Team must prove before shutdown:

- Targeted memoryProof/derived tests pass.
- Full `npm test`, `npm run typecheck`, and `npm run check` pass.
- No forbidden hidden simulator state affects output.
- ADR 017 remains non-canonical in implementation/report.
- Acceptance report names the next recommended workstream.

## Consensus changelog

- Initial `$ralplan` draft created from source-map decision, existing memoryProof PRD/test spec, Workstream A memo, deep-research alignment, ADR 016, proposed ADR 017, and current repo implementation evidence.
- Architect ITERATE fixes applied: source-map authority wording corrected; patient_001 blueprint vs patient_002 realized-fixture reconciliation added; hidden-state grep made executable with false-positive classification; open-loop/validation existing coverage cited; fingerprint deferral requires an acceptance-report decision record.
