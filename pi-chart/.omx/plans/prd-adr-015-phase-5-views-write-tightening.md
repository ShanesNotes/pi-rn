# PRD — ADR 015 Phase 5 view updates + write-path tightening

## Goal

Land the ADR 015 read-surface follow-through for ADRs 009/010/011 and close
the known write/validate `links.addresses` asymmetry, preferably as three
coherent sub-phases:

- 5a — evidenceChain role threading + contradicts fork
- 5b — currentState contested panels + openLoops contested_claim
- 5c — timeline pairing + narrative hooks + derived formatter annotation +
  write-path tightening

## Scope

In scope:
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
- `src/derived.ts`
- `src/derived.test.ts`
- `src/write.ts`
- `src/write.test.ts`

Out of scope:
- schema changes
- parser changes
- migration changes
- new validator rules
- changes to `src/validate.ts`
- changes to `src/evidence.ts`
- changes to `schemas/event.schema.json`
- changes to `src/types.ts`

## User Story

As the ADR 015 maintainer, I want the contradiction/evidence/transform
substrate from earlier phases to surface coherently in the read layer and in
the write boundary, so downstream users can see contested claims, paired
contradictions, evidence roles, transform provenance tags, and exact addresses
typing without a lingering validator/write mismatch.

## Requirements

1. Recommend and plan either one phase-wide commit or a 5a/5b/5c split; the
   default recommendation is 5a/5b/5c.
2. 5a must thread `EvidenceRef.role` into emitted evidence nodes.
3. 5a must add a dedicated contradicts branch off emitted event evidence nodes.
4. 5a must leave supports traversal semantics intact.
5. 5a branch depth is independent per branch; cycle protection spans branches.
6. 5a keeps emitted vitals nodes shaped as `{kind:"vitals", metric, points}`.
7. 5a keeps external refs as structurally valid but non-rendered.
8. 5a event nodes may gain `contradicts?: EvidenceNode[]`; contradiction
   `basis` is intentionally not surfaced in Phase 5.
9. 5b currentState adds exact runtime widening keys:
   - axis-specific `constraints` / `problems` / `intents` returns gain
     `contested: ContestedRuntimeEntry[]`
   - `axis:"all"` gains `observations: EventEnvelope[]` and
     `contested: { constraints, problems, intents, observations }`
10. 5b `ContestedRuntimeEntry` is exactly:
    `{ events:[olderId,newerId], basis, axis }` where
    `axis in {"constraints","problems","intents","observations"}`.
11. 5b contested pairs clear when either side is superseded or corrected.
12. 5b openLoops emits `kind:"contested_claim"` runtime metadata for unresolved
    aged contradictions.
13. 5b contested openLoops items are exactly:
    `{ kind:"contested_claim", intent:<laterContradictorEvent>, state:"pending", fulfillments:[], addressesProblems:[], events:[olderId,newerId], basis, age_seconds, threshold_seconds, severity }`.
14. Existing intent renderers in `currentState` and `src/derived.ts` must
    explicitly filter `kind:"contested_claim"` entries out of ordinary intent
    lists.
15. 5b contested_claim defaults: `threshold_seconds = 3600`,
    `severity = "medium"`.
16. 5b contested age is measured from the later contradicter’s `recorded_at`.
17. 5b resolver-clearance follows the Phase 4 substrate: a later resolver event
    supersedes one side and resolves the contradictor.
18. 5b keeps ADR 008 profile tuning as a TODO pass-through only.
19. 5c timeline adds exact read-time pairing keys:
    - later entry: `contradicts_prev_id?: string`
    - earlier entry: `contradicted_by_next_id?: string`
20. 5c timeline omits pair keys when the counterpart is hidden by the caller’s
    filters/window/includeSuperseded settings.
21. 5c narrative keeps note types/schema frozen and sources tags from joined
    backing communication events via `data.note_ref`.
22. 5c transform tag mapping is exactly:
    - `extract|transcribe -> [extracted]`
    - `infer|summarize -> [inferred]`
    - `import|normalize -> no tag`
23. 5c role tag mapping is exactly:
    - `primary -> (primary)`
    - `counterevidence -> (counterevidence)`
    - all other roles -> no tag
24. 5c `_derived/current.md` contested annotation is in scope and must append
    ` (contested with \`<otherId>\`)` to existing rendered bullet lines only.
25. `src/derived.ts` `buildOpenIntents()` must exclude `kind:"contested_claim"`
    entries from the ordinary open-intents list.
26. 5c `src/write.ts` tightening must reject `addresses:[<intent-id>]`.
27. The `src/write.ts` tightening message must exactly match the validator:
    `links.addresses: target '{target}' must be an assessment/problem (invariant 10: fulfillment typing)`.
28. No new `V-*` validator rule codes land in Phase 5.
29. `src/types.ts`, `src/evidence.ts`, `src/validate.ts`, and
    `schemas/event.schema.json` remain unchanged.
30. Verification follows a phase-scoped matrix for 5a, 5b, and 5c/final.
31. One explicit contradiction lifecycle fixture proves:
    contradiction emitted -> validator still passes -> currentState contested ->
    openLoops contested_claim -> later resolver clears it ->
    `_derived/current.md` no longer annotates the cleared pair.

## Acceptance Criteria

1. The final plan explains why 5a/5b/5c is recommended or why one commit was
   chosen instead.
2. Evidence-chain output gains role-threading and a contradicts branch without
   changing the vitals emitted node vocabulary.
3. External evidence refs still do not render nodes.
4. currentState uses the exact runtime widening keys above and never silently
   selects a winner.
5. openLoops uses the exact contested runtime item contract above.
6. Existing intent renderers explicitly filter contested-claim entries out of
   ordinary intent sections.
7. Timeline uses only `contradicts_prev_id` / `contradicted_by_next_id` and is
   filter-aware.
8. Narrative transform/role tags follow the exact mapping above.
9. `_derived/current.md` appends ` (contested with \`<otherId>\`)` only to
   existing rendered bullet lines.
10. `src/write.ts` and `src/write.test.ts` close the addresses asymmetry with
    the exact validator-matching message.
11. Verification covers both targeted behavior and phase-boundary proof that no
    schema/parser/validator/type files changed.
12. `npm test`, `npm run typecheck`, and `npm run check` pass.
