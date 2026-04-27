# ADR 015 Phase 1 — merged schema, types, and parser normalization

## RALPLAN-DR Summary

### Principles

- Keep Phase 1 additive and normalization-focused; do not pull validator or
  view semantics forward.
- Land schema, types, parser, and compile-fix consumers in one coherent commit.
- Preserve v0.2 wire compatibility while normalizing readers to the v0.3 shape.
- Let existing tests move with the normalization surface instead of deferring
  broken expectations to later phases.

### Decision Drivers

1. Current repo code still encodes the old `EvidenceRef` union in schema,
   types, parser, validator helpers, and `evidenceChain` tests.
2. Later ADR 015 phases depend on one canonical `EvidenceRef` substrate and a
   documented `transform` / `resolves` / `contradicts` envelope surface.
3. The user explicitly wants one merged Phase 1 commit with no validator-rule
   or view-behavior changes.

### Viable Options

1. Merge schema + types + parser now, with the minimum compile/test updates.
   Pros: matches ADR 015 dependency order, keeps one coherent substrate commit.
   Cons: touches a wider set of files than the three headline targets because
   current readers/tests plus validator/write compatibility paths embed the old
   normalized shape.
2. Implement canonical-ref compatibility through one shared
   normalization/expansion path in `src/evidence.ts`.
   Pros: one source of truth for `ref` mapping and vitals-window expansion
   across parser, validator, write path, and views.
   Cons: requires broader immediate touchpoints in Phase 1.
3. Implement canonical parser output but let consumers decode fields locally.
   Pros: smaller local edits in the parser.
   Cons: high drift risk; write, validate, and view code would each make their
   own decisions about `vitals_window`, `external`, and legacy aliases.

### Invalidation rationale for rejected option

- The split option is rejected because the schema and parser are coupled by the
  canonical `EvidenceRef` shape. Shipping them separately creates avoidable
  drift and fails the “one coherent Phase 1 commit” requirement.
- The mixed consumer-local decoding option is rejected because this repo already
  has old-shape logic in `src/write.ts`, `src/validate.ts`, and
  `src/views/evidenceChain.ts`; duplicating the new canonical decoding across
  those sites would make Phase 1 behavior ambiguous and fragile.

## Requirements Summary

- Update `schemas/event.schema.json` to add `$defs.EvidenceRef`, replace the
  inline structured `links.supports` object with a `$ref`, add
  `links.resolves`, `links.contradicts`, and `transform`, and narrow the
  `links.addresses` description only.
- Update `src/types.ts` to introduce the canonical `EvidenceRef` interface,
  `EvidenceRole`, `ContradictsLink`, `TransformActivity`, `TransformBlock`,
  additive `Links` fields, `transform?` on the event envelope base, and
  additive `OpenLoopKind = "contested_claim"`.
- Update `src/evidence.ts` so `parseEvidenceRef` normalizes v0.2 structured
  refs and bare strings into the new object shape while preserving
  `kind: "vitals"` as an accepted input alias.
- Preserve already-canonical object refs on parse: `role`, `basis`,
  `selection`, `derived_from`, and `kind: "external"` must round-trip without
  being stripped.
- Keep validator rules and view semantics unchanged, but patch compile-time
  consumers and compatibility paths that currently assume `.id` / `.metric` /
  `.encounterId` on normalized refs.
- Phase 1 policy for `kind: "external"`: accept it structurally in schema,
  types, parser, write path, and validator compatibility parsing; do not treat
  it as patient-local resolvable evidence in views or invariant-5 satisfaction
  yet. `evidenceChain` may continue unresolved-ref behavior and omit a node.

## Implementation Plan

1. Schema surface
   - Add `$defs.EvidenceRef` to `schemas/event.schema.json` with unified `ref`,
     enum `kind`, optional `role`, `basis`, `selection`, `derived_from`, and
     deprecated `vitals` alias.
   - Point `links.supports.items.oneOf[1]` at the new `$defs.EvidenceRef`.
   - Add `links.resolves`, `links.contradicts`, and `transform` per ADRs
     009/011; keep `links.addresses` enforcement descriptive only.
2. Type surface
   - Replace the old `EvidenceRef` union in `src/types.ts` with a single
     interface and add the new enums/interfaces requested by the user.
   - Extend `Links`, `EventEnvelopeBase`, and `OpenLoopKind` additively.
   - Freeze the existing view contract: keep `EvidenceNode` and
     `evidenceChain` output semantics unchanged in Phase 1, including current
     vitals-node output (`kind: "vitals"`, `metric`, `points`). Phase 1 should
     not introduce role-threading or contested view behavior.
3. Parser normalization
   - Refactor `src/evidence.ts` so bare ids become `{kind, ref}`,
     old structured event/note/artifact refs become `{kind, ref}`,
     old structured vitals refs become `{kind:"vitals_window", ref:<uri>, selection:{...}}`,
     and `vitals://` URIs parse directly to the same canonical vitals-window shape.
   - Canonical object inputs must round-trip through `parseEvidenceRef`
     unchanged except for deprecated alias normalization (`kind:"vitals"` ->
     `kind:"vitals_window"` when the object uses the legacy expanded vitals
     shape).
   - Export one shared helper for canonical vitals-window expansion so
     `evidenceChain`, validator, and write logic all derive
     `metric/from/to/encounterId` from one place rather than re-decoding
     independently.
4. Compile/test compatibility updates
   - Update `src/write.ts` and `src/validate.ts` as explicit Phase 1
     compatibility files. They must accept both legacy structured
     `kind:"vitals"` objects and canonical `kind:"vitals_window"` refs through
     shared parsing/expansion, but must not add ADR 009/010/011 rule
     enforcement in this phase.
   - Add a new type-only `OpenLoopKind` export in `src/types.ts` with
     `"contested_claim"` included, but do not rewire any Phase 1 consumers to
     use it yet.
   - Update `src/views/evidenceChain.ts` to consume normalized refs via `ref`
     and `selection` while keeping the emitted `EvidenceNode` behavior stable.
   - Update repo tests that assert normalized `EvidenceRef` values
     (`src/evidence.test.ts`, `src/views/evidenceChain.test.ts`,
     `src/validate.test.ts`, `src/schema.test.ts`, and `src/write.test.ts`) so
     they check the new canonical object surface where appropriate and keep
     Phase 1 compatibility expectations explicit. This uses existing test files;
     no new dedicated test suite is required.
5. Verification
   - Run targeted proof points in existing test files:
     schema acceptance in `src/schema.test.ts`,
     parser normalization in `src/evidence.test.ts`,
     write-path compatibility in `src/write.test.ts`,
     validator compatibility in `src/validate.test.ts`,
     and stable view output in `src/views/evidenceChain.test.ts`.
   - Run `npm test`.
   - Run `npm run check`.
   - Run `npm run typecheck`.
   - Run a final grep boundary check on the diff to confirm no new
     `V-EVIDENCE|V-TRANSFORM|V-CONTRA|V-RESOLVES` strings land and no
     unintended `role` / `contradicts` view-surface changes appear.
   - Inspect the final diff to confirm no new `V-EVIDENCE`, `V-TRANSFORM`,
     `V-CONTRA`, or `V-RESOLVES` rule logic lands and no Phase 5 role-threading
     or contested-view behavior is pulled forward.

## Acceptance Criteria

- `schemas/event.schema.json` exposes `$defs.EvidenceRef`, `links.resolves`,
  `links.contradicts`, and `transform`, and `links.supports` references the new
  `$defs.EvidenceRef`.
- `src/types.ts` exports the requested Phase 1 additive types and envelope
  fields, including `OpenLoopKind = "contested_claim"`.
- `parseEvidenceRef` returns canonical object refs using `ref` rather than `id`
  and normalizes old vitals objects into `kind: "vitals_window"` plus
  `selection`.
- Canonical object refs already using the new shape preserve `role`, `basis`,
  `selection`, `derived_from`, and `kind: "external"` through parsing.
- Existing consumers, write-side checks, and validator compatibility logic
  compile without Phase 2/3/4 validator-rule additions and without Phase 5
  role-threading/view-surface changes.
- `kind: "external"` is accepted structurally in schema/types/parser and in
  write/validate compatibility paths, but it does not satisfy patient-local
  evidence resolution or render a node in `evidenceChain` in Phase 1.
- Existing test files directly prove the new surface: `src/schema.test.ts`
  covers `$defs.EvidenceRef`, `transform`, `resolves`, and `contradicts`;
  `src/write.test.ts` proves append/write compatibility; `src/evidence.test.ts`
  proves parser normalization and canonical pass-through; `src/validate.test.ts`
  proves legacy and canonical structured-vitals compatibility; and
  `src/views/evidenceChain.test.ts` proves identical view output for legacy
  vitals refs and canonical `vitals_window` refs.
- `npm test`, `npm run check`, and `npm run typecheck` all pass.

## Risks And Mitigations

- Risk: hidden `.id` access outside `evidenceChain` breaks the build.
  Mitigation: grep all `parseEvidenceRef` and `EvidenceRef` consumers before
  editing, including `src/write.ts` and `src/validate.ts`, then rerun
  `npm run typecheck`.
- Risk: schema changes imply stricter validation earlier than intended.
  Mitigation: keep target-typing and role-count enforcement in validator phases
  only; use descriptions and permissive optional fields in Phase 1.
- Risk: vitals normalization breaks trend resolution.
  Mitigation: keep one canonical vitals URI round-trip path and update
  `evidenceChain` to derive trend args from `selection` or the canonical URI.
- Risk: write/validator compatibility code drifts from parser normalization.
  Mitigation: centralize vitals-window expansion in `src/evidence.ts` and route
  all Phase 1 compatibility sites through that helper.
- Risk: `external` refs force accidental new behavior in supports rendering.
  Mitigation: make Phase 1 policy explicit: accept them structurally, preserve
  them in parsing, and let unresolved-ref behavior omit them from
  `evidenceChain` until later phases define richer semantics.

## ADR

### Decision

Implement Phase 1 as one merged substrate commit touching schema, types,
parser, and immediate compile/test consumers.

### Drivers

- ADR 015 dependency order
- current repo coupling between schema/types/parser/tests
- user requirement for one merged commit and full green verification

### Alternatives considered

- Split schema from types/parser

### Why chosen

- It preserves one coherent runtime/documentation substrate and avoids an
  intermediate broken shape.

### Consequences

- Phase 1 will likely touch more files than the user’s headline list because
  current tests and local consumers encode the old normalized ref shape.
- Later validator and view phases can build on one canonical `EvidenceRef`
  interface instead of carrying v0.2/v0.3 branching logic.

### Follow-ups

- Phase 2/3/4 add validator rules on top of this substrate.
- Phase 5 adds role-threading and contested-view behavior.

## Copy-paste ready fresh-session prompt

```text
Execute merged Phase 1 of ADR 015: schema $defs.EvidenceRef + envelope additions and types + parser normalization in one commit.

Schema (schemas/event.schema.json): introduce $defs.EvidenceRef per ADR 010 §Schema rule (keep kind: "vitals" in enum as deprecated alongside vitals_window); replace links.supports.items.oneOf[1] inline object with {"$ref":"#/$defs/EvidenceRef"}; add links.resolves (string array) and links.contradicts ({ref, basis} array) per ADR 009 §Schema rule; add properties.transform per ADR 011 §Schema rule reusing $defs.EvidenceRef in input_refs; rewrite links.addresses.description to narrowed-semantics text only (enforcement stays in validator for phase 5).

Types (src/types.ts): refactor EvidenceRef union to single object interface {ref, kind, role?, basis?, selection?, derived_from?} with kind enum including vitals_window and external (plus back-compat vitals); add EvidenceRole enum (primary | context | counterevidence | trigger | confirmatory); add ContradictsLink interface; add TransformActivity enum and TransformBlock interface; extend Links with resolves?: string[], contradicts?: ContradictsLink[]; add optional transform?: TransformBlock to EventEnvelopeBase; extend OpenLoopKind union with "contested_claim" (type-only for now).

Parser (src/evidence.ts): parseEvidenceRef normalizes v0.2 shapes — {kind:"vitals", metric, from, to, encounterId} -> {kind:"vitals_window", ref:<vitals:// URI>, selection:{metric, from, to, encounterId}}; {kind:<event|note|artifact>, id} -> {kind, ref:<id>}; bare-string inputs unchanged on input but normalized to canonical object refs on output. Export one shared helper for canonical vitals-window expansion so validator/write/view consumers do not each re-derive metric/from/to/encounterId separately.

Compatibility updates required in this same commit: patch compile/test consumers and compatibility paths that currently read normalized EvidenceRef via .id / .metric / .encounterId, especially src/views/evidenceChain.ts, src/write.ts, src/validate.ts, src/evidence.test.ts, src/views/evidenceChain.test.ts, src/validate.test.ts, src/schema.test.ts, and src/write.test.ts. These updates are compatibility rewrites only: accept both legacy structured kind:"vitals" objects and canonical kind:"vitals_window" refs through shared parsing, but do not add new ADR 009/010/011 validator rules in this phase.

Canonical-ref contract: already-canonical object refs must round-trip through parseEvidenceRef without dropping role, basis, selection, derived_from, or kind:"external". Phase 1 policy for external refs is additive acceptance only: schema/types/parser/write/validator compatibility paths accept them structurally, but evidenceChain may continue unresolved-ref behavior and omit a rendered node until later phases define richer semantics.

No validator rule changes in this phase. Rules land in later ADR 015 phases.
No view-behavior changes in this phase. src/views/evidenceChain.ts is the direct EvidenceRef consumer today; keep its behavior stable while making it compile against the new normalized shape. EvidenceNode output should stay as it is today, including vitals nodes shaped as {kind:"vitals", metric, points}.

Verification gates: targeted updates in existing tests (`src/schema.test.ts`, `src/write.test.ts`, `src/evidence.test.ts`, `src/validate.test.ts`, `src/views/evidenceChain.test.ts`) plus npm test green; npm run check green; npm run typecheck green; existing test suite still passes. Run a final grep/diff boundary check to confirm no new V-EVIDENCE/V-TRANSFORM/V-CONTRA/V-RESOLVES rule logic lands, no unintended role/contradicts view-surface changes appear, and this commit stays substrate-only.

Commit message pattern: Phase 1 — schema + types + parser for ADRs 009/010/011 (ADR 015).
```
