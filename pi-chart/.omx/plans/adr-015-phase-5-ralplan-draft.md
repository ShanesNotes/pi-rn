# ADR 015 Phase 5 — view layer updates + write-path tightening

## RALPLAN-DR Summary

### Principles

- Split the largest brownfield phase along real substrate seams so each commit
  leaves a coherent, testable read surface behind.
- Keep validator behavior authoritative and unchanged in this phase; Phase 5
  only consumes the Phase 4 contradiction/resolution substrate.
- Preserve the no-type-change boundary literally: do not edit `src/types.ts`;
  keep widened runtime shapes backward-compatible with existing consumers.
- Any widened runtime object that flows through an existing public view must
  remain compatible with the old required fields, and ordinary intent renderers
  must explicitly exclude contested-claim entries from intent sections.
- Keep the existing vitals output contract stable in evidence-chain output:
  emitted nodes stay `{ kind: "vitals", metric, points }`.
- Close the known `write.ts` / `validate.ts` `links.addresses` footgun in the
  same phase that updates contested read surfaces.

### Decision Drivers

1. The requested Phase 5 surface spans seven independently tested modules plus
   `write.ts`; one monolithic commit would make review and regression isolation
   materially harder than the earlier validator phases.
2. Repo inspection found four design tensions that must be closed before
   execution:
   - `_derived/current.md` is actually formatted in `src/derived.ts`
   - `openLoops()` / `currentState()` already feed `derived.ts`, so any new
     contested-loop shape must stay backward-compatible under the no-type-change
     rule
   - `narrative.ts` currently reads notes only, so transform/role tags need an
     explicit source path
   - currentState has no typed `observations` axis today, so any observations
     panel behavior must be added as runtime widening inside the `axis:"all"`
     shape rather than via `src/types.ts`
3. Phase 4 already established the authoritative contradiction/resolution rules,
   so Phase 5 should layer read/write behavior on top of those rules rather
   than re-encoding validator logic.

### Viable Options

1. **Chosen: split into 5a / 5b / 5c, keep `src/types.ts` frozen, and make the
   widened runtime shapes compatibility-preserving.**
   Pros:
   - each sub-phase leaves a coherent substrate boundary behind
   - evidence-chain node widening lands before contested-state consumers depend
     on it
   - contested-loop data can flow through existing `openLoops()` /
     `currentState()` consumers without breaking `derived.ts`
   - fixes the `_derived/current.md` touchpoint mismatch up front
   - preserves the user’s no-type-change boundary
   Cons:
   - runtime/type contract drift is explicit for this phase
   - contested-loop objects must carry compatibility fields in addition to the
     new ADR-driven metadata
   - intent renderers need one explicit filter rule for contested-claim entries

2. **One large Phase 5 commit across all touched files.**
   Pros:
   - one landing point for all ADR 009/010/011 read-surface changes
   - no intermediate branch coordination across sub-phases
   Cons:
   - highest regression blast radius in the largest phase so far
   - harder to isolate failures across evidence traversal, contested-state
     projection, derived formatting, narrative join logic, timeline rendering,
     and write-path tightening

3. **Keep the exact original file list and defer current.md annotation or keep
   `openLoops()` intent-only by silently dropping `contested_claim`.**
   Pros:
   - smallest headline scope
   - no derived formatter touchpoint correction needed
   Cons:
   - fails part of the requested behavior
   - leaves plan drift between prompt and real code path
   - preserves the write/view mismatch longer than necessary

### Why option 3 is rejected

- Repo inspection shows `_derived/current.md` is formatted in `src/derived.ts`,
  not in `src/views/narrative.ts`, and the user explicitly asked for both
  contested-read behavior and write-path closure in this phase. Silently
  dropping either behavior would make the plan operationally incomplete.

## Chosen Approach

Recommend **three sub-phases** rather than one large commit.

### Shared exact runtime contracts

These are runtime-only widenings; `src/types.ts` stays frozen.

- **Contested entry shape**
  - `type ContestedRuntimeEntry = { events:[olderId,newerId], basis:string, axis:"constraints"|"problems"|"intents"|"observations" }`
- **currentState exact runtime widening**
  - axis-specific returns for `constraints`, `problems`, and `intents` gain:
    - `contested: ContestedRuntimeEntry[]`
  - `axis:"vitals"` stays unchanged
  - `axis:"all"` gains:
    - `observations: EventEnvelope[]`
    - `contested: { constraints: ContestedRuntimeEntry[]; problems: ContestedRuntimeEntry[]; intents: ContestedRuntimeEntry[]; observations: ContestedRuntimeEntry[] }`
- **openLoops exact contested runtime item**
  - ordinary intent loops stay unchanged
  - contested items are emitted as:
    - `{ kind:"contested_claim", intent:<laterContradictorEvent>, state:"pending", fulfillments:[], addressesProblems:[], events:[olderId,newerId], basis, age_seconds, threshold_seconds, severity }`
  - `dueDeltaMinutes` is intentionally omitted on contested items
- **timeline exact pairing keys**
  - later entry: `contradicts_prev_id?: string`
  - earlier entry: `contradicted_by_next_id?: string`
- **narrative exact tag mapping**
  - `transform.activity in {"extract","transcribe"}` -> `[extracted]`
  - `transform.activity in {"infer","summarize"}` -> `[inferred]`
  - `import` / `normalize` -> no narrative transform tag in Phase 5
  - evidence roles render only for:
    - `primary` -> `(primary)`
    - `counterevidence` -> `(counterevidence)`
  - other roles stay silent in Phase 5
- **evidenceChain contradiction branch shape**
  - event nodes gain optional `contradicts?: EvidenceNode[]`
  - child nodes may gain optional `role?: EvidenceRole`
  - contradiction `basis` is intentionally omitted from emitted evidence nodes
    in Phase 5 to keep the widened node contract minimal

### 5a — evidenceChain role threading + contradicts fork

Files:
- `src/views/evidenceChain.ts`
- `src/views/evidenceChain.test.ts`

Plan:
- Thread `role?: EvidenceRole` from each source `EvidenceRef` into emitted child
  nodes via file-local widened node shapes.
- Add `contradicts?: EvidenceNode[]` on emitted event nodes. When a resolved
  event carries `links.contradicts`, resolve each contradicted event through the
  same patient-local context and attach those child nodes under the dedicated
  branch.
- Keep `supports` semantics unchanged.
- Apply the depth cap per branch independently.
- Keep one visited-set spanning both branches so `derived_from` loops still
  terminate even when the graph forks.
- Keep `kind:"external"` as no-node output and preserve the existing vitals
  emitted node vocabulary.

### 5b — currentState contested panels + openLoops contested_claim

Files:
- `src/views/currentState.ts`
- `src/views/currentState.test.ts`
- `src/views/openLoops.ts`
- `src/views/openLoops.test.ts`

Plan:
- Add a shared contested-pair collector built on existing active-context facts:
  a pair exists when event A contradicts B, both sides are still visible/live as
  of the query time, and neither side has been superseded or corrected.
- Project contested pairs into currentState using the exact runtime keys above.
- Add `observations` to the `axis:"all"` runtime shape only; do not add a new
  typed `Axis` member.
- Keep `openLoops()` backward-compatible under the no-type-change rule by
  emitting contested claims using the exact runtime item contract above.
- Measure contested age from the later contradicter event’s `recorded_at`.
- Clear the contested loop when a later resolver event both supersedes one side
  and points `links.resolves` at the contradictor.
- Preserve existing intent-loop behavior and ordering, with `high`
  `contested_claim` entries sorting above overdue intents and non-high ones
  after overdue intents.
- Consumer rule: existing intent renderers (`currentState(axis:"intents")`,
  `currentState(axis:"all")`, and `src/derived.ts` intent sections) must filter
  `kind:"contested_claim"` entries out of ordinary intent lists and use
  contested sibling data / dedicated rendering instead.
- Keep the ADR 008 profile hook as a documented pass-through TODO; default
  values win in Phase 5.

### 5c — timeline pairing + narrative hooks + write tightening + derived formatter annotation

Files:
- `src/views/timeline.ts`
- `src/views/timeline.test.ts`
- `src/views/narrative.ts`
- `src/views/narrative.test.ts`
- `src/write.ts`
- `src/write.test.ts`
- `src/derived.ts`
- `src/derived.test.ts`

Plan:
- Timeline: add the exact runtime pairing keys above. If the counterpart is
  hidden by filters, windowing, or superseded filtering, omit the relevant key.
- Narrative: keep `NarrativeEntry` types frozen and enrich runtime output by
  joining note ids to their backing communication events (via `data.note_ref`)
  when present. Apply the exact transform/role tag mapping above. Notes with no
  backing communication event or no supported tag source stay untagged.
- Derived formatter: annotate bullets already rendered in `buildCurrent()`.
  Rule: if a rendered event/intent id appears in contested data, append
  ` (contested with \`<otherId>\`)` to that existing bullet line. No new section
  is added in Phase 5. If both members of a contested pair are rendered, both
  lines get annotated with the opposite id.
- `src/derived.ts` `buildOpenIntents()` must treat `kind:"contested_claim"` as
  excluded from the ordinary open-intents list.
- `src/write.ts`: tighten `links.addresses[*]` to accept only
  `type:"assessment" && subtype:"problem"`, mirroring the validator wording
  exactly:
  `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`.
- Add a specific regression proving the old-shape `addresses:[<intent-id>]`
  write now fails at write time with the exact validator-matching message.

## Requirements Summary

- Phase 5 may land as one phase or as 5a/5b/5c, but the recommended path is
  5a/5b/5c.
- No schema changes.
- No parser changes.
- No migration changes.
- No new validator rule changes.
- `src/types.ts` remains unchanged.
- `src/evidence.ts` remains unchanged.
- `src/validate.ts` remains unchanged.
- `EvidenceNode` emitted vitals output stays `{kind:"vitals", ...}`.
- `external` evidence refs remain structurally valid but do not produce an
  emitted evidence node.
- currentState, openLoops, timeline, narrative, and derived must use the exact
  runtime widening keys/contracts documented above.
- current.md contested annotation is in-scope and must be implemented through
  `src/derived.ts`.
- `src/write.ts` tightening message must match validator wording exactly.
- New prose tags stay short and profile-agnostic.
- OpenLoops profile tuning remains a no-op hook until ADR 008.

## Implementation Plan

1. **Land 5a first as the substrate reader change.**
   - Add local widened event-node helpers in `src/views/evidenceChain.ts`.
   - Preserve existing `supports` behavior and branch-specific depth counting.
   - Add contradicts-branch tests, role-threading tests, external-no-node test,
     and cycle-termination proof.

2. **Land 5b with the exact runtime contracts above.**
   - Introduce a contested-pair collector shared by currentState/openLoops.
   - Add currentState contested sibling data using the named keys above.
   - Add openLoops contested runtime items using the named keys above.
   - Enforce the explicit filter rule for ordinary intent renderers.
   - Add one shared contradiction lifecycle fixture proving:
     pair emits -> validator still passes -> currentState contested populates ->
     openLoops contested_claim appears after threshold -> later resolver clears
     it.

3. **Land 5c with presentation/readability surfaces plus write-path closure.**
   - Add timeline contradiction-pair metadata with the exact pairing keys.
   - Add narrative transform/role tags using the exact mapping above.
   - Annotate `_derived/current.md` bullets using the exact placement rule.
   - Exclude contested claims from `buildOpenIntents()`.
   - Tighten `src/write.ts` addresses typing in exact validator wording.

4. **Verification matrix**
   - **5a gates**
     - `node --test --import tsx src/views/evidenceChain.test.ts`
     - `npm run typecheck`
     - `npm run check`
     - `git diff --name-only -- src/views/evidenceChain.ts src/views/evidenceChain.test.ts`
     - grep proof: no edits to `src/types.ts`, `src/evidence.ts`, `src/validate.ts`, `schemas/event.schema.json`
   - **5b gates**
     - `node --test --import tsx src/views/currentState.test.ts src/views/openLoops.test.ts`
     - `npm run typecheck`
     - `npm run check`
     - `git diff --name-only -- src/views/currentState.ts src/views/currentState.test.ts src/views/openLoops.ts src/views/openLoops.test.ts`
     - contradiction lifecycle proof through validator -> currentState -> openLoops -> resolver-clear (but not yet timeline/narrative/derived/write)
   - **5c / final gates**
     - `node --test --import tsx src/views/timeline.test.ts src/views/narrative.test.ts src/derived.test.ts src/write.test.ts`
     - `npm test`
     - `npm run typecheck`
     - `npm run check`
     - `git diff --name-only`
     - `git diff -U0 | rg "V-"` must show no new validator rule codes
     - grep proof that `src/types.ts`, `src/evidence.ts`, `src/validate.ts`, and `schemas/event.schema.json` remain unchanged
     - full end-to-end contradiction fixture including `_derived/current.md` clearance proof

## Acceptance Criteria

- Consensus plan explains why 5a/5b/5c is recommended over one large commit.
- 5a adds role-threaded evidence nodes and a contradicts branch without
  changing the emitted vitals node vocabulary or rendering external refs.
- 5b currentState uses the exact contested runtime keys defined above and never
  silently selects a winner.
- 5b `openLoops()` uses the exact contested runtime item contract defined above.
- Existing intent renderers explicitly filter `kind:"contested_claim"` entries
  out of ordinary intent sections.
- Resolved/superseded contradiction pairs clear from currentState and
  openLoops.
- 5c timeline uses only `contradicts_prev_id` / `contradicted_by_next_id` and
  omits those keys when the pairmate is filtered out.
- 5c narrative transform/role tags follow the exact mapping above.
- 5c evidenceChain contradiction nodes do not expose `basis` in this phase.
- 5c `_derived/current.md` appends ` (contested with \`<otherId>\`)` to the
  existing rendered bullet lines only.
- `src/write.ts` rejects `addresses:[<intent-id>]` with the exact
  validator-matching message.
- `src/types.ts`, `src/evidence.ts`, `src/validate.ts`, and
  `schemas/event.schema.json` remain unchanged.
- No new `V-*` validator codes land in this phase.
- `npm test`, `npm run typecheck`, and `npm run check` all pass.

## Risks And Mitigations

- **Risk: runtime/type contract drift remains awkward under the no-types rule.**
  Mitigation: use exact named runtime keys, keep all widened objects backward-
  compatible with old required fields, and explicitly filter contested-claim
  entries out of intent renderers.
- **Risk: current.md annotation drifts from its real source.**
  Mitigation: make `src/derived.ts` explicit Phase 5 scope and source the text
  from currentState contested data using the exact bullet-append rule.
- **Risk: narrative role tags have no reliable source on note-only data.**
  Mitigation: source them only from joined backing communication events; no
  join, no tag.
- **Risk: contested-loop clearance drifts from the validator substrate.**
  Mitigation: use the same contradiction/resolution facts already enforced by
  Phase 4 and prove the resolver-clearance lifecycle in one end-to-end test.

## ADR

### Decision

Recommend splitting ADR 015 Phase 5 into 5a / 5b / 5c, while keeping
`src/types.ts` frozen and making new runtime view outputs backward-compatible
for existing consumers.

### Drivers

- Largest phase by file count so far
- real code-path mismatch for current.md formatting
- literal no-type-change constraint despite widened runtime view outputs

### Alternatives considered

- one large phase-wide commit
- keep the original file list and silently defer current.md annotation

### Why chosen

- It preserves substrate coherence while reducing review and verification blast
  radius, closes the write-path footgun, and resolves the real formatter path
  before execution.

### Consequences

- Phase 5 becomes easier to implement and verify in bounded commits.
- `src/derived.ts` / `src/derived.test.ts` are explicitly in-scope because they
  own `_derived/current.md` formatting.
- Runtime view outputs widen without formal type-surface changes, so backward
  compatibility of required existing fields is a hard implementation rule and
  ordinary intent renderers must explicitly exclude contested-claim entries.

### Follow-ups

- Phase 6 handles migration/corpus sweep after these read/write surfaces land.
- A later cleanup phase may reconcile runtime-widened view outputs with formal
  public types if the no-types constraint is lifted.
