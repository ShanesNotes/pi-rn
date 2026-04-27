# Draft Consensus Plan — S5 Read-Side Context Bundle Implementation

## Requirements Summary

Implement the approved first S5 product lane from `.omx/specs/deep-interview-s5-implementation-approval.md` without widening scope. The approval spec authorizes tests, `src/views/bundle.ts`, and `src/views/index.ts` export wiring only, with existing projections as the derivation source and no fingerprint/hash/profile/schema/validator/dependency/fixture/pi-agent/pi-sim expansion (`.omx/specs/deep-interview-s5-implementation-approval.md:38-79`).

The bundle must expose a read-only API, preferably `contextBundle`, that returns:

- bundle header: `patient_id`, `asOf`, `source_view_refs`
- `current_state`
- `open_loops`
- `narrative_handoff`
- `evidence_context`
- `recent_timeline`

The S5 PRD describes this as a bounded context package for a serialized reader, not a pi-agent API contract (`docs/plans/prd-s5-read-side-context-bundle.md:23-27`), and names the existing projection inventory to reuse (`docs/plans/prd-s5-read-side-context-bundle.md:29-51`).

## Brownfield Evidence

- `src/views/bundle.ts` and `src/views/bundle.test.ts` are absent; the approval spec identifies `src/views/bundle.test.ts` as likely because the PRD named it as future candidate (`.omx/specs/deep-interview-s5-implementation-approval.md:116-117`).
- `src/views/index.ts` currently exports `timeline`, `currentState`, `activeProblems`, `trend`, `evidenceChain`, `openLoops`, `narrative`, `memoryProof`, and active-context helpers, but no bundle API (`src/views/index.ts:4-22`).
- `currentState` resolves a single `asOf`, loads active context, and composes all axes when `axis: "all"` (`src/views/currentState.ts:43-115`).
- `openLoops` returns ordinary open intents plus contested claims from existing active-context semantics (`src/views/openLoops.ts:45-105`).
- `narrative` reads note/communication entries and supports `to`, `encounterId`, `authorId`, and subtype filters (`src/views/narrative.ts:20-64`).
- `timeline` already provides chronological clinical entries with `from`, `to`, `types`, `encounterId`, and supersession filtering (`src/views/timeline.ts:29-82`).
- `memoryProof` already composes `timeline`, `currentState`, `openLoops`, and `narrative` and emits `patient_id`, `asOf`, `sections`, and `source_view_refs` (`src/views/memoryProof.ts:40-101`; `src/types.ts:511-523`).
- There is unrelated dirty state in prototype/design/dependency files. Execution must preserve it and avoid broad formatting or dependency edits.

## RALPLAN-DR Summary

### Principles

1. **Read-only composition only** — S5 must call existing projections rather than parse chart files directly, except through those projections.
2. **Tests before implementation** — first implementation action is a focused failing bundle contract test.
3. **Explicit source explainability** — every bundle section must be covered by `source_view_refs` entries that name the projection calls used.
4. **Boundary hardening by absence** — tests must assert forbidden fields/surfaces remain absent instead of relying on reviewer memory.
5. **Minimal public surface** — add one focused bundle API and barrel export, no root/API/schema/dependency expansion.

### Decision Drivers

1. **Scope safety:** approved ownership is restricted to `src/views/bundle.test.ts`, `src/views/bundle.ts`, and `src/views/index.ts` (`.omx/specs/deep-interview-s5-implementation-approval.md:70-79`).
2. **Consumer usefulness:** output must contain all six selected sections (`.omx/specs/deep-interview-s5-implementation-approval.md:44-50`, `:92-98`).
3. **Brownfield leverage:** `memoryProof` already composes the same projections and should be reused where it prevents duplicate evidence/handoff logic (`docs/plans/prd-s5-read-side-context-bundle.md:72-78`; `src/views/memoryProof.ts:48-101`).

### Viable Options

#### Option A — Thin bundle wrapper around existing projections (recommended)

Implement `contextBundle(params)` in `src/views/bundle.ts` that resolves `asOf`, then calls existing projections: `currentState(axis="all")`, `openLoops`, `narrative(to=asOf)`, `timeline(to=asOf)`, and `memoryProof` for evidence/handoff-derived context. Return a stable object with the six required sections and `source_view_refs` that name those calls.

Pros:
- Maximizes reuse of already-tested projection semantics.
- Keeps S5 small and explainable.
- Avoids duplicating `memoryProof` evidence/handoff collection logic.
- Fits approved files and no dependency/schema changes.

Cons:
- Shape may initially mirror existing projection details rather than a polished downstream product contract.
- Calling `memoryProof` plus individual projections can duplicate some work; acceptable for first minimal implementation.

#### Option B — Alias/export `memoryProof` as the S5 bundle

Expose `contextBundle = memoryProof` or return `memoryProof(params)` nearly unchanged.

Pros:
- Least code.
- Strongest reuse; `memoryProof` already returns `patient_id`, `asOf`, sections, and refs.

Cons:
- Does not clearly satisfy required S5 section names (`current_state`, `open_loops`, `narrative_handoff`, `evidence_context`, `recent_timeline`).
- Harder to write boundary tests for selected S5 sections without conflating S5 with `memoryProof` semantics.
- Risks making S5 just a rename rather than the approved context bundle lane.

#### Option C — New independent bundle collector over raw events

Implement custom event loading and section summarizers in `bundle.ts`.

Pros:
- Full control over S5 section shape.
- Potentially avoids duplicate projection calls.

Cons:
- Violates or weakens “reuse existing projections before adding new read logic.”
- Expands risk and duplicates active/supersession/filtering semantics.
- More likely to touch types/helpers/fixtures outside approved ownership.

### Recommendation

Choose **Option A**. It is the narrowest option that clearly satisfies all six required S5 sections while preserving read-only composition and using existing projections.

## Proposed API Contract

This first S5 lane may expose existing projection shapes inside the bundle. That is an intentional minimal-lane tradeoff, not a permanent normalized DTO contract; any DTO normalization, section limits, or consumer-specific reshaping requires a later approved plan.

Add `src/views/bundle.ts` with:

```ts
export interface ContextBundleParams {
  scope: PatientScope;
  asOf?: string;
  encounterId?: string;
}

export interface ContextBundle {
  patient_id: string;
  asOf: string;
  source_view_refs: string[];
  current_state: CurrentState;
  open_loops: Awaited<ReturnType<typeof openLoops>>;
  narrative_handoff: NarrativeEntry[];
  evidence_context: {
    evidence: MemoryProof["sections"]["evidence"];
    uncertainty: MemoryProof["sections"]["uncertainty"];
    proof_refs?: MemoryProof["source_view_refs"];
  };
  recent_timeline: TimelineEntry[];
}

export async function contextBundle(params: ContextBundleParams): Promise<ContextBundle>;
```

Implementation notes:
- Prefer local exported types in `bundle.ts` over editing `src/types.ts`; this keeps ownership to approved files.
- Resolve `asOf` once with `resolveAsOfMs(params.scope, params.asOf)` and pass the same ISO value to all projections.
- Use the same start-of-UTC-day recent window pattern as `memoryProof` (`src/views/memoryProof.ts:43-47`, `:104-108`) for `recent_timeline`.
- If `encounterId` is present, pass it to projections that already support it (`timeline`, `narrative`, `memoryProof`). Do not add `encounterId` to `currentState` or `openLoops` unless already supported.
- `source_view_refs` should be deterministic strings such as:
  - `currentState(axis=all,asOf)`
  - `openLoops(asOf)`
  - `narrative(to=asOf)` or `narrative(to=asOf,encounterId)`
  - `timeline(from=startOfDay,to=asOf)` or `timeline(from=startOfDay,to=asOf,encounterId)`
  - `memoryProof(asOf)` or `memoryProof(asOf,encounterId)`
- Do not include fields named or containing `fingerprint`, `hash`, `identity`, `profile`, `pi_agent`, `pi-agent`, `pi_sim`, `pi-sim`, or hidden simulator categories.

## Acceptance Criteria

1. `src/views/bundle.test.ts` is created and initially fails because `contextBundle`/`src/views/bundle.ts` does not exist.
2. `contextBundle({ scope, asOf })` returns top-level `patient_id`, `asOf`, and non-empty `source_view_refs`.
3. Bundle output includes `current_state`, `open_loops`, `narrative_handoff`, `evidence_context`, and `recent_timeline`.
4. Focused tests prove section derivation from existing projections by comparing bundle sections to direct `currentState`, `openLoops`, `narrative`, `timeline`, and/or `memoryProof` calls for the same fixture and `asOf`.
5. Boundary tests prove forbidden S5-added fields are absent by scanning top-level bundle keys, `source_view_refs`, and S5-owned wrapper keys for fingerprint/hash/identity/profile/pi-agent/pi-sim terms; reused projection payloads are not recursively failed unless S5 adds the key.
6. `src/views/index.ts` exports `contextBundle` and its public types.
7. No edits are made to `src/index.ts`, `schemas/`, `patients/`, `scripts/`, `profiles/`, `package.json`, `package-lock.json`, `src/hash.ts`, `src/identity.ts`, or validator/schema files.
8. Verification passes: focused bundle test, full `npm test`, and `npm run typecheck`.

## Implementation Steps

### Step 0 — Preflight and dirty-state guard

- Capture current dirty state before source edits without writing new repo files:
- Ignore any stale `.omx/tmp/*preflight*` files; implementation preflight must use fresh `mktemp` paths only and must not depend on repo-local preflight artifacts.
  ```bash
  preflight=$(mktemp)
  git diff --name-only -- src schemas patients scripts profiles package.json package-lock.json | sort | tee "$preflight"
  git status --short
  # Keep $preflight only in the shell session for final comparison; do not commit or create repo-local preflight artifacts.
  ```
- Note existing unrelated dirty files (`docs/prototypes/...`, `scripts/agent-canvas.ts`, package manifests, design inbox images) and do not touch/reformat/revert them.

### Step 1 — Add the focused failing contract test first

Create `src/views/bundle.test.ts`.

Test shape:
- Use `makeEmptyPatient`, `appendRawEvent`, `appendRawVital`, and `writeRawNote` from `src/test-helpers/fixture.ts` (`src/test-helpers/fixture.ts:16-87`) to build a minimal temporary chart.
- Add enough events/notes to exercise:
  - current-state problem or observation
  - pending/overdue intent for open loops
  - note/handoff narrative
  - evidence link or assessment support for evidence context
  - chronological event for recent timeline
- Import direct projections and assert bundle sections match the direct projection outputs for the same `scope` and `asOf`.
- Add a boundary scanner over S5-added top-level fields, `source_view_refs`, and S5-owned `evidence_context` wrapper keys. Do not recursively fail on arbitrary existing chart event payload keys from reused projections unless the S5 implementation itself adds those keys.
- Add export-surface test importing `contextBundle` from `./index.js` within `src/views/bundle.test.ts`, so the test targets `src/views/index.ts` only. Do not import from or test the root `src/index.ts` API in this lane.

Expected first run:
```bash
node --test --import tsx src/views/bundle.test.ts
# should fail because ./bundle.js or contextBundle is missing
```

### Step 2 — Implement `src/views/bundle.ts` as a composition layer

- Import `resolveAsOfMs`, `currentState`, `openLoops`, `narrative`, `timeline`, and `memoryProof` from existing view modules.
- Define local `ContextBundleParams`, `EvidenceContext`, and `ContextBundle` types.
- Resolve one `asOf` ISO string.
- Compute `from` as UTC start-of-day for `asOf`, matching `memoryProof`.
- Call projections with shared `asOf`:
  ```ts
  const [current_state, open_loops, narrative_handoff, recent_timeline, proof] = await Promise.all([...]);
  ```
- Return `evidence_context` from `proof.sections.evidence` and `proof.sections.uncertainty`, plus optional `proof.source_view_refs` if useful for traceability.
- Build deterministic `source_view_refs` at the top-level. Include `memoryProof` because evidence context is derived through it.

### Step 3 — Wire view export only

Update only `src/views/index.ts`:

```ts
export { contextBundle } from "./bundle.js";
export type { ContextBundle, ContextBundleParams, EvidenceContext } from "./bundle.js";
```

Do not edit `src/index.ts` and do not add root-API export tests in this lane. `src/index.ts` has explicit named exports; root API exposure for `contextBundle` is deferred unless a later approval widens ownership.

### Step 4 — Run focused and full verification

Run, in order:

```bash
node --test --import tsx src/views/bundle.test.ts
npm run typecheck
npm test
```

Then compare protected diff surface:

```bash
current=$(mktemp)
git diff --name-only -- src schemas patients scripts profiles package.json package-lock.json | sort > "$current"
cat "$current"
# Expected product diff is exactly src/views/bundle.test.ts, src/views/bundle.ts, src/views/index.ts; specifically no src/index.ts diff.
# Existing package/script dirty state may appear from pre-existing unrelated work; do not add new entries.
rm -f "$current"
```

If unrelated package/script diffs were present before Step 0, compare against the shell-session `$preflight` file and explain that they pre-existed. Do not persist a repo-local preflight artifact.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `memoryProof` section names do not map exactly to S5 names | Keep S5 top-level section names explicit and map `memoryProof.sections.evidence`/`uncertainty` into `evidence_context`. |
| Duplicate projection work from `memoryProof` plus direct projections | Accept for first minimal lane; do not optimize until profiling or product need exists. |
| Boundary creep into schema/validator/profile/hash work | Boundary tests over S5-added keys/source refs plus protected diff check. |
| Fixture mutation temptation | Build all test data in temp fixtures with existing helpers; do not edit `patients/`. |
| As-of mismatch between sections | Resolve `asOf` once and pass same ISO to every projection. |
| Dirty repo noise hides unauthorized changes | Preflight diff baseline before edits and final diff comparison. |

## Verification Plan

- Focused contract: `node --test --import tsx src/views/bundle.test.ts`
- Type safety: `npm run typecheck`
- Regression: `npm test`
- Boundary diff: `git diff --name-only -- src schemas patients scripts profiles package.json package-lock.json | sort`, compared to shell-session mktemp preflight baseline with only authorized S5 source files added.
- Manual review: inspect `src/views/bundle.ts` imports; they must come from existing projections and types only, with no `fs`, `path`, schema, validator, package, pi-agent, or pi-sim imports.

## ADR

### Decision

Implement S5 as a thin `contextBundle` composition layer in `src/views/bundle.ts`, backed by focused tests in `src/views/bundle.test.ts` and exported through `src/views/index.ts`.

### Drivers

- S5 implementation approval is narrow and explicitly names the candidate product files.
- Existing projections already encode active/supersession/as-of/evidence/handoff semantics.
- The required consumer needs one explainable bundle, not new identity/hash/profile infrastructure.

### Alternatives considered

- **Alias `memoryProof` directly:** rejected because S5 requires explicit top-level sections for current state, open loops, narrative handoff, evidence context, and recent timeline.
- **Build a custom raw-event collector:** rejected because it duplicates projection semantics and violates the reuse-first S5 boundary.
- **Add schema/type/global API support:** rejected because schema/profile/validator/dependency expansion is explicitly out of scope.

### Why chosen

Option A satisfies all required sections with the least new code and strongest boundary preservation.

### Consequences

- Initial S5 bundle may duplicate some projection computation.
- The public bundle shape is intentionally minimal and can be refined only through a later approved lane.
- Evidence context is initially constrained to existing `memoryProof` evidence/uncertainty rather than a bespoke evidence graph.

### Follow-ups

- If downstream readers need limits/section selectors, plan a later S5 successor lane with tests.
- If performance becomes a problem, plan shared projection-context reuse separately.
- After implementation, produce an acceptance report only if a later plan authorizes docs closure work.

## Available-Agent-Types Roster

Available relevant roles from the installed catalog:
- `explore` — fast repo lookup / source mapping.
- `executor` — implementation and refactoring.
- `test-engineer` — focused test design and coverage gaps.
- `verifier` — completion evidence and validation adequacy.
- `code-reviewer` — broad code review.
- `critic` — plan/design challenge.
- `architect` — architectural soundness and boundary review.
- `build-fixer` — typecheck/build/test failures.
- `git-master` — commit hygiene if a commit is requested later.

## Follow-up Staffing Guidance

### `$ralph` sequential path (recommended for this small lane)

Recommended command:

```text
$ralph .omx/plans/s5-context-bundle-implementation-plan.md
```

Lane guidance:
1. `executor` (medium reasoning): own `src/views/bundle.test.ts`, `src/views/bundle.ts`, `src/views/index.ts`; write failing test first, then implementation.
2. `test-engineer` (medium reasoning, optional if Ralph delegates): review bundle test quality and boundary assertions.
3. `verifier` (high reasoning): run focused test, typecheck, full tests, and protected diff comparison.

### `$team` path (only if parallel verification is preferred)

Launch hints:

```text
$team .omx/plans/s5-context-bundle-implementation-plan.md --agents 3
# or, from shell if using OMX CLI:
omx team --agents 3 --task ".omx/plans/s5-context-bundle-implementation-plan.md"
```

Suggested team allocation:
- Agent 1 `executor` (medium): test-first + implementation in `src/views/bundle.test.ts` and `src/views/bundle.ts`.
- Agent 2 `test-engineer` (medium): independently review/extend tests without touching implementation unless coordinated.
- Agent 3 `verifier` / `build-fixer` (high): run focused/full verification, fix only build/type failures inside approved files, report protected diff.

Team verification path:
- Team must prove first failing test existed or at least document the initial focused failure output.
- Team must pass focused bundle test, `npm run typecheck`, and `npm test`.
- Team must show diff limited to approved files relative to shell-session mktemp preflight baseline.
- Ralph (or leader) should do final review after team shutdown: inspect source imports for no raw filesystem/schema/validator/pi-agent/pi-sim coupling and confirm forbidden-key test coverage.

## Changelog / Review Integration

- Draft created from S5 implementation approval spec and brownfield view inventory.

## Consensus Review Record

- Architect iteration 1: `ITERATE`; required removal of repo-local preflight artifact instructions, replacement of “identity header” with “bundle header,” first-lane DTO caveat, and narrower forbidden-key test scope.
- Critic iteration 1: `ITERATE`; required removal of `src/index.ts` escape clause and root API test/export scope.
- Architect re-review: `APPROVE`; optional wording improvements applied for shell-session `mktemp` preflight and S5-owned wrapper keys.
- Critic iteration 2: `ITERATE`; stale `.omx/tmp/s5-read-side-preflight.txt` repo-local artifact found. Artifact was removed, and plan now requires fresh `mktemp` only.
- Critic final re-review: `APPROVE`.

## Final Approval Status

RALPLAN consensus reached. This plan is approved for a future execution handoff, but this planning lane does not implement product code.
