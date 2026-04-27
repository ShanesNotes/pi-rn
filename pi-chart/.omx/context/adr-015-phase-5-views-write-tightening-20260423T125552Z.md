# Context Snapshot — ADR 015 Phase 5 view updates + write-path tightening

## Task statement

Plan ADR 015 Phase 5, the largest brownfield phase after validator work:
view-layer updates for ADRs 009/010/011 plus `src/write.ts` tightening for
`links.addresses`.

User-proposed seams:
- 5a — `src/views/evidenceChain.ts` + `src/views/evidenceChain.test.ts`
- 5b — `src/views/currentState.ts`, `src/views/openLoops.ts` + tests
- 5c — `src/views/timeline.ts`, `src/views/narrative.ts`, `src/write.ts` + tests

## Desired outcome

- Consensus plan with clean sub-phase boundaries if splitting is materially
  safer/clearer than one large commit.
- Explicit handling of the known validator/write asymmetry closure in this
  phase.
- Concrete verification story for the end-to-end contradiction substrate across
  evidenceChain, currentState, openLoops, timeline/narrative, and write-path
  tightening.

## Known facts / evidence

- Phase 4 already landed the validator substrate for `links.contradicts`,
  `links.resolves`, and narrowed `links.addresses` validation.
- `src/views/evidenceChain.ts` currently walks only `links.supports`; it emits
  `EvidenceNode` values typed in `src/types.ts` as:
  `event {event,supports,supersedes}` / `vitals` / `note` / `artifact`.
- `src/views/currentState.ts` currently returns only active items by axis; no
  contested surface exists.
- `src/views/openLoops.ts` currently emits intent-only `OpenLoop` objects; the
  Phase 1 type-only addition `OpenLoopKind = "contested_claim"` exists in
  `src/types.ts`, but `OpenLoop` itself has no `kind` discriminator field.
- `src/views/timeline.ts` currently returns plain chronological entries with no
  contradiction-pair metadata.
- `src/views/narrative.ts` currently reads only markdown notes and returns
  `NarrativeEntry[]`; it does not currently participate in `_derived/current.md`
  generation.
- `_derived/current.md` is actually formatted in `src/derived.ts`, which means
  the user’s 5c file list and the current code path for current.md annotation
  are in tension.
- `src/write.ts` still allows `links.addresses` targets that are either
  `assessment/problem` or `intent`; Phase 4 validator now rejects intent.
- The target view/test files already exist:
  `src/views/evidenceChain*.ts`, `currentState*.ts`, `openLoops*.ts`,
  `timeline*.ts`, `narrative*.ts`, `src/write*.ts`.

## Constraints

- No schema, parser, migration, or new-validator-rule changes.
- User prompt says “no type changes”, even though the requested new view output
  surfaces logically widen `EvidenceNode`, `CurrentState`, `OpenLoop`, and
  `TimelineEntry` contracts.
- EvidenceNode output vocabulary for vitals must remain
  `{kind:"vitals", metric, points}`.
- `kind:"external"` evidence refs remain structurally valid but do not render
  an `EvidenceNode`.
- New prose tags stay short; ADR 008 profile phrasing is deferred.
- `src/write.ts` tightening message must mirror the existing validator message
  exactly.

## Unknowns / open questions

- Whether the “no type changes” constraint is intended literally, or whether
  local structural widening / test-local casts are acceptable for newly added
  fields.
- Whether current.md contested annotation should force `src/derived.ts` into
  scope, or whether Phase 5 should instead limit narrative work to note-level
  hooks only and defer current.md formatting.
- Whether one phase-wide end-to-end contradiction fixture should live in one
  test file or be split across the affected view suites.
- Whether the recommended split should be three commits (5a/5b/5c) or one
  commit with three verification checkpoints.

## Likely touchpoints

- `src/views/evidenceChain.ts`
- `src/views/evidenceChain.test.ts`
- `src/views/currentState.ts`
- `src/views/currentState.test.ts`
- `src/views/openLoops.ts`
- `src/views/openLoops.test.ts`
- `src/views/timeline.ts`
- `src/views/timeline.test.ts`
- `src/views/narrative.ts`
- `src/views/narrative.test.ts`
- `src/write.ts`
- `src/write.test.ts`
- Possibly `src/derived.ts` / `src/derived.test.ts` if current.md contested
  annotation must be implemented in the actual formatter path.
