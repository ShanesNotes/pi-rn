# ADR 007 — End-to-end implementation for ADRs 002–006

- **Status:** accepted (implementation authorized 2026-04-21)
- **Date:** 2026-04-21
- **Deciders:** Shane (operator)
- **Touches:** `schemas/event.schema.json`, `src/types.ts`, `src/time.ts`, `src/read.ts`, `src/write.ts`, `src/views/*`, `src/validate.ts`, CLAIM-TYPES, DESIGN §1.1, ROADMAP, README examples, seed `patient_001`, repo-owned tests/examples, A1/A2 fixture drafts
- **Depends on:** ADRs 002, 003, 004, 005, 006 (all accepted 2026-04-21)

## Context

ADRs 002–006 are accepted policy. This ADR turns them into one
coherent execution contract: schema changes, temporal-shape support
across the read/write substrate, validator rules, fixture/seed
updates, and phase ordering.

The policy ADRs deliberately separated decision from implementation
so the decisions could be reviewed without interpretation drift from
code. With the decisions stable, the surface of implementation work
is:

- **15 validator rules** (V-STATUS-01..03, V-FULFILL-01..03,
  V-TIME-01..03, V-INTERVAL-01..04, V-SRC-01..03).
- **Schema + type changes** for interval-shaped events
  (`effective_period`, root `oneOf`, temporal XOR typing).
- **Shared temporal helpers** so read/write/views stop treating
  `effective_at` as the only valid event start.
- **One canonical `source.kind` registry** loaded into
  `validate.ts` from DESIGN §1.1, amended to include the repo's
  sanctioned runtime agent kinds.
- **One per-subtype interval/status table** sourced from CLAIM-TYPES
  and mirrored inline in the validator with source comments.
- **One corpus sweep** covering `patient_001`, repo-owned tests and
  examples, README snippets, and A1/A2 fixture drafts.

Per the pass-2 confirmation, the fulfillment-chain retrofit count in
`patient_001` is zero — the seed has no lab/imaging/procedure result
chain. The remaining seed work is provenance normalization plus the
ADR 005 interval audit for any multi-hour state that should become an
interval event.

## Decision

**Phased rollout, sequenced by dependency rather than ADR number.**
Each phase is reviewable and leaves the repo consistent: schema,
types, read/write helpers, views, validator, and corpus literals move
together enough that newly-valid event shapes are also consumable.

### Phase ordering (dependency-driven, not numeric)

| Phase | Surface | Rationale for position |
|-------|---------|------------------------|
| 0     | Docs gate (ADR 006 amendment + ADR 007 rewrite) | Lock the canonical taxonomy, execution boundary, and direct-fixture-normalization policy before code lands. |
| 1     | Substrate groundwork | Add schema permissiveness plus temporal XOR types/helpers in schema, types, time/read/write/view code so interval events become representable and consumable together. |
| 2     | ADR 006 (V-SRC-01..03) | `source.kind` validation is cheap once the canonical table is settled. Lands with writer/source cleanup so sanctioned runtime paths do not warn on themselves. |
| 3     | ADR 004 (V-TIME-01..03) | Time-ordering rules build on the new temporal helpers and validate the event log before payload-sensitive phases tighten. |
| 4     | ADR 002 (V-STATUS-01..03) | Per-subtype `status_detail` enum validation and openLoops failure semantics become coherent only after time semantics are stable. |
| 5     | ADR 005 (V-INTERVAL-01..04) | Enforce interval allow-lists and closure rules after interval shapes already flow through the substrate. |
| 6     | ADR 003 (V-FULFILL-01..03) | Acquisition-action requirements compose stable source/time/status/interval surfaces. This lands last because it cross-cuts the others, not because exceptions key off `source.kind`. |
| 7     | Corpus sweep | Normalize `patient_001`, repo-owned tests/examples, README snippets, rebuilt derived outputs, and A1/A2 draft tables against the new validator. |

### Rule-code conventions

All new rules follow `V-<AREA>-<NN>`:

- `V-SRC-*` — source.kind taxonomy (ADR 006)
- `V-TIME-*` — temporal ordering (ADR 004)
- `V-STATUS-*` — envelope/detail status coherence (ADR 002)
- `V-INTERVAL-*` — effective_period shape + closure (ADR 005)
- `V-FULFILL-*` — fulfillment chain typing (ADR 003)

Existing invariant checks in `validate.ts` that the new rules subsume
(notably invariant 10's current fulfills-target check) are renamed in
place to the new code. Error messages name the rule code and the
invariant number it enforces when applicable.

### Severity policy

Default new rules to `err` (hard fail) except where the ADR
specifies `warn`:

- V-SRC-01 is **warn in v0.2, promotes to err** after Phase A
  Batch 2 fixtures pass under the warn-only rule (ADR 006 pass 2).
- V-SRC-02 (agent_reasoning deprecation notice) is **warn
  indefinitely** — retained for one full minor version cycle.
- V-TIME-02 for point-shape intents missing `data.due_by` is
  **err** (ADR 004 pass 1 V-TIME-02 text); V-TIME-03 (payload
  time-stamp ordering) is **warn** per ADR 004 original text.
- V-INTERVAL-04 (stop-event rejection) is **err** (ADR 005 pass 1).

All other new rules are `err`.

### Schema change (phase 1)

`schemas/event.schema.json` gets five edits:

1. `required` array drops `effective_at`.
2. Root gains `oneOf`:
   ```jsonc
   "oneOf": [
     { "required": ["effective_at"],     "not": { "required": ["effective_period"] } },
     { "required": ["effective_period"], "not": { "required": ["effective_at"] } }
   ]
   ```
3. `properties.effective_period` added:
   ```jsonc
   "effective_period": {
     "type": "object",
     "required": ["start"],
     "properties": {
       "start": { "type": "string", "format": "date-time" },
       "end":   { "type": "string", "format": "date-time" }
     },
     "additionalProperties": false
   }
   ```
4. `properties.data.properties.status_detail` added as a
   free-form string at the schema layer; per-subtype enum lives in
   `validate.ts` (V-STATUS-01 reads the allow-list).
5. `properties.source.properties.kind.description` is rewritten to
   point at DESIGN §1.1 and drop the stale in-schema value list.
   `kind` stays `type: string` (no enum) — validator-warn semantics
   per ADR 006.

The schema change is only phase 1. The matching TypeScript projection,
time helpers, read paths, write paths, and views must land in the same
phase so interval-shaped events are not schema-valid but runtime-broken.

### Registry loading

`src/validate.ts` gains inline, module-level constants for:

- the canonical `source.kind` list (commented with DESIGN §1.1),
- the `effective_period` allow-list (commented with CLAIM-TYPES),
- the `status_detail` subtype tables / transition graphs (commented
  with CLAIM-TYPES / ADR 002),
- any import-provenance required-field list used by V-SRC-03.

These stay inline until a third real consumer beyond docs + validator
emerges. The code remains table-driven without introducing a separate
registry file prematurely.

### Fixture + seed work (phase 7)

- **`patient_001`** — direct-edit repo fixture literals to canonical
  values. Do not synthesize `links.corrects` events for fixture
  maintenance. Normalize all non-canonical agent/runtime kinds, not
  only `agent_reasoning`. Audit the respiratory-case O2/device context
  for ADR 005 interval conversion.
- **Repo-owned tests/examples** — direct-edit literals to canonical
  `source.kind` values. Keep `agent_reasoning` only in tests that
  intentionally assert the V-SRC-02 deprecation warning.
- **A1/A2 fixture drafts** — these are research markdown, not
  loaded by the validator. Audit the fixture tables under §15 of
  each draft for `source.kind: agent_inference` on
  `action.result_review` events; migrate text to `agent_review`.
  No code runs.
- **Any future Phase A Batch 1+ fixture** — authored against the new
  validator from the start; no separate audit needed.

## Tradeoffs

| Axis                                   | (a) Validator-only roll-in    | (b) End-to-end phased rollout (chosen) | (c) All-in-one patch |
|----------------------------------------|-------------------------------|----------------------------------------|----------------------|
| Interval-event safety                  | poor — schema outruns runtime | strong — substrate changes land first  | medium               |
| Reviewability                          | deceptively small but leaky   | one coherent surface at a time         | one giant diff       |
| Risk of self-generated warnings        | high                          | low — writer/source cleanup lands with V-SRC | medium        |
| Rollback cost                          | low per file, high by drift   | revert one phase at a time             | revert everything    |
| Reader burden                          | must remember deferred gaps   | each phase is internally coherent      | must re-hold all ADRs|

(b) maps cleanly onto the accepted-ADR review cadence: the operator
reads one phase at a time against one ADR at a time. This is the
same review discipline that drove the pass-1 / pass-2 sweep and is
working well.

## Consequences

- **Multiple reviewable commits** over the course of implementation,
  each gated by verification. The exact count matters less than keeping
  schema/runtime/validator changes coherent at each boundary.
- **`validate.ts` grows materially.** Inline tables are acceptable in
  this pass; refactoring the validator into smaller modules is a
  separate concern.
- **Types, read/write helpers, views, and tests all change.**
  ADR 005 and ADR 006 are not validator-only patches.
- **Docs do change** in this implementation: ADR 006 amendment,
  ADR 007 acceptance, ROADMAP wording, and README/source-kind examples.

## Not decided here

- **Whether the source.kind and effective_period allow-lists should
  migrate to a separate config file** when a third consumer beyond
  validator + docs emerges (e.g., an importer that needs the list).
  Revisit if/when that consumer exists; until then, inline constants
  are the right call.
- **Whether agent-origin kinds should later collapse again** once the
  runtime stabilizes. For now they are explicit because the repo
  already uses them and they carry distinct semantics.
- **Whether V-TIME-03's payload-time-stamp ordering should be
  promoted from warn to err in a later minor.** Defer until we have
  real imports exercising `data.resulted_at` / `data.verified_at`.
- **Whether the 128-test baseline grows meaningfully in phase 7**
  (fixture audit). Lean: no new tests beyond validator unit tests;
  seed audit is a one-shot operation, not a regression surface.
- **Whether the implementation introduces a `v0.2.1` or stays under
  `v0.2`.** Non-breaking schema + additive validator = v0.2
  continues. Revisit if a hard-break appears mid-implementation.

## Verification gates (per phase)

Each phase commit must satisfy:

1. `npm test` green.
2. `npm run check` green.
3. `npm run typecheck` green.
4. If a phase introduces interval-aware behavior, the affected
   read/view tests land in the same phase as the code change.
5. Commit message names the ADR surface and any new rule codes landed.

Phase 7 additionally requires:

6. A `patient_001` audit report (one-line summary: normalized kinds,
   interval conversion if any, or "no interval retrofit needed").
7. An A1/A2 fixture-draft diff showing `agent_review` migrations.
