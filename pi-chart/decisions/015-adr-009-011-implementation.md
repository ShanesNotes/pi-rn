# ADR 015 — End-to-end implementation for ADRs 009, 010, 011

- **Status:** accepted (implementation authorized 2026-04-22)
- **Date:** 2026-04-22
- **Deciders:** Shane (operator)
- **Touches:** `schemas/event.schema.json`, `src/types.ts`, `src/evidence.ts`, `src/validate.ts`, `src/views/evidenceChain.ts`, `src/views/currentState.ts`, `src/views/openLoops.ts`, `src/views/timeline.ts`, `src/views/narrative.ts`, `src/views/active.ts`, `scripts/migrate-v02-to-v03.ts` (new), CLAIM-TYPES, DESIGN §1 / §4 / §5.7 / §8, ROADMAP, `patient_001` audit, repo-owned tests/examples
- **Depends on:** ADRs 009 (contradicts + resolves), 010 (typed EvidenceRef + roles), 011 (transform block) — all accepted 2026-04-22. Adjacent: ADR 007 (implementation contract precedent).
- **Numbering note:** ADRs 012–014 remain reserved by memo §10 for their decision-only topics (identity/hash, invalidated_at, attestation/suppression/incident). This implementation contract takes 015 so the decision-queue numbering stays aligned with the memo.

## Context

ADRs 009, 010, 011 are accepted policy. This ADR turns them into one coherent execution contract: schema changes, envelope-level type additions, validator rules, view-layer threading, migration script, fixture/seed updates, and phase ordering. It follows the ADR 007 pattern — decision separated from implementation so each ADR's policy could be reviewed without interpretation drift from code.

The three policy ADRs touch overlapping surfaces:

- **`$defs.EvidenceRef`** (ADR 010) is consumed by ADR 011 (`transform.input_refs`) and, indirectly, by ADR 009 (`contradicts[*].ref` reuses the `ref` field shape but not the full object). Substrate additions in a coherent order: schema `$defs` first, then types, then parsers, then validator, then views.
- **Link surface additions** (`links.resolves`, `links.contradicts`, `links.supports` shape tightening) all flow through `src/types.ts`, `schemas/event.schema.json`, and the `validate.ts` link walker. Splitting by ADR number would require the walker to be rewritten three times.
- **Validator rules** — 10 new rules land (V-EVIDENCE-01/02/03, V-TRANSFORM-01/02, V-CONTRA-01/02/03/04, V-RESOLVES-01). Severity mix: 1 warn-promotable (V-EVIDENCE-01), 1 permanent-warn (V-CONTRA-04), 8 err.
- **View-layer changes** — `evidenceChain` gains both role threading (ADR 010) and a `contradicts` fork (ADR 009) at the same traversal; `currentState` and `openLoops` gain contested state from ADR 009 which can reuse role annotations from ADR 010 for phrasing.
- **Migration script** — first appearance of `scripts/migrate-v02-to-v03.ts`. ADRs 012 and 013, when their implementation contracts land, will extend this script rather than create new ones. Idempotency is a hard requirement from day one.

The scope of this contract is **ADRs 009, 010, 011 only**. ADRs 012 (identity/hash) and 013 (invalidated_at) are NOT authored yet; their implementation piggybacks on this contract's migration-script groundwork later. ADR 008 (profiles keystone) depends on the validator and schema changes from 009–013 being in place (memo §10) — it is unblocked on 012/013 authoring, not on this contract.

## Decision

**Phased rollout, sequenced by dependency rather than ADR number.** Each phase is reviewable and leaves the repo consistent: schema, types, parsers, validator, and views move together enough that newly-valid event shapes are also consumable by every view. Same discipline as ADR 007.

### Phase ordering (dependency-driven, not numeric)

| Phase | Surface | Rationale for position |
|-------|---------|------------------------|
| 0 | Docs gate (DESIGN / CLAIM-TYPES / link table updates, ROADMAP acceptance rows) | Lock the canonical link table, EvidenceRef spec, and transform-block row before code lands. |
| 1 | Schema `$defs.EvidenceRef` + envelope additions | Factor the reusable EvidenceRef definition once; add `links.resolves`, `links.contradicts`, `properties.transform` as additive-optional. All three ADRs' schema surface goes in one diff. |
| 2 | Types + parsers | `TypedEvidenceRef` object shape (unified `ref`), `ContradictsLink`, `TransformBlock`, `TransformActivity`, `OpenLoopKind` extension. `parseEvidenceRef` normalizes both old (`kind: vitals`, per-kind `id`/`metric`) and new (`kind: vitals_window`, unified `ref`, `selection`) shapes. |
| 3 | ADR 010 validator rules | V-EVIDENCE-01 (warn), V-EVIDENCE-02 (err), V-EVIDENCE-03 (err). Lands after parser can surface the normalized shape for rule checks; before ADR 011 V-TRANSFORM-02 (which reuses the same ref resolver). |
| 4 | ADR 011 validator rules | V-TRANSFORM-01 (err, cross-references DESIGN §1.1 import-family source.kind list), V-TRANSFORM-02 (err, reuses `supports` resolver). |
| 5 | ADR 009 validator rules + `addresses` tightening | V-CONTRA-01/02/03 (err), V-CONTRA-04 (warn), V-RESOLVES-01 (err). Tighten existing `addresses` target check (`src/validate.ts:916`) to problem-subtype-assessment only. Lands last in the validator tier because it cross-cuts types (ContradictsLink shape), evidence (refs resolved via the same resolver), and supersession (resolution-pattern invariant). |
| 6 | View updates | `evidenceChain` role threading + contradicts fork (both in one pass); `currentState` contested panels; `openLoops` `contested_claim` kind; `timeline` paired rendering; `narrative` role/transform/contested annotation hooks (prose templates deferred to ADR 008). |
| 7 | Migration script + corpus sweep | `scripts/migrate-v02-to-v03.ts`: `kind: vitals` → `vitals_window`; `id` → `ref` on structured refs; fold per-kind vitals fields into `selection`; rewrite `addresses` → `resolves` where target is an open-loop-kind event. `patient_001` audit and repo-owned test/example literals normalized against the new validator. |

### Rule-code conventions

All new rules follow `V-<AREA>-<NN>` per ADR 007 precedent:

- `V-EVIDENCE-*` — EvidenceRef shape, role, derived_from (ADR 010)
- `V-TRANSFORM-*` — transform block activity/source coherence and input-ref resolution (ADR 011)
- `V-CONTRA-*` — contradicts link direction, scope, cross-use (ADR 009)
- `V-RESOLVES-*` — resolves target typing (ADR 009)

Existing `addresses`-target-typing check in `src/validate.ts:916` is tightened in place rather than renamed to a new rule code. Error messages name the rule code and the invariant number where applicable.

### Severity policy

Default new rules to `err` (hard fail) except where the ADR specifies `warn`:

- V-EVIDENCE-01 is **warn in v0.3, promotes to err** after Phase A Batch 2 fixtures pass under the warn-only rule (ADR 010 §Validator changes; follows V-SRC-01 precedent from ADR 006).
- V-CONTRA-04 is **warn indefinitely in v0.3 and v0.4** — promotes to err only if the retrospective-supersession-without-resolves pattern stays under an empirical threshold in Batch 2+ fixtures.

All other new rules are `err`.

### Schema change (phases 1)

`schemas/event.schema.json` gets the following edits, all additive or back-compat-safe:

1. **`$defs.EvidenceRef` introduced** per ADR 010 §Schema rule. The existing `links.supports.items.oneOf[1]` inline object is replaced with `{ "$ref": "#/$defs/EvidenceRef" }`.
2. **`links.resolves`** added as `{ type: array, items: string }` per ADR 009.
3. **`links.contradicts`** added as `{ type: array, items: {required: [ref, basis], additionalProperties: false} }` per ADR 009.
4. **`properties.transform`** added per ADR 011, reusing `$defs.EvidenceRef` in `input_refs`.
5. **`links.addresses.description`** rewritten to point at the narrowed semantics (problem-subtype-assessment only; the per-target type enforcement stays in the validator for one release to avoid breaking any v0.2 seed fragments that have not yet been migrated).
6. **Back-compat retained:** `$defs.EvidenceRef.properties.kind.enum` keeps `vitals` alongside `vitals_window` for one release; deprecation noted in a schema-level `description`.

The schema change is phase 1. The matching TypeScript projection, parser, validator, and views must land before the schema becomes the sole source of truth. Phase-gated verification prevents runtime-schema skew.

### Registry loading

`src/validate.ts` already carries inline constants for `source.kind` (from ADR 006). Phase 4 adds:

- the **import-family `source.kind` list** extracted from the existing canonical registry (DESIGN §1.1 / the inline `CANONICAL_SOURCE_KINDS` constant) into a narrower `IMPORT_SOURCE_KINDS` constant consumed by V-TRANSFORM-01. Values: `synthea_import`, `mimic_iv_import` — plus any additional import-family values committed to DESIGN §1.1 at ADR-011-implementation time. Commented with DESIGN §1.1 source.
- the **role enum** for V-EVIDENCE-02's primary-count check (trivially inline).
- the **transform activity enum** for cross-check by V-TRANSFORM-01 (inline).

All stay inline until a third real consumer beyond docs + validator emerges, per ADR 007's registry-loading policy.

### View updates (phase 6)

Substrate-first rendering: the code walks the new link and ref shapes, but prose templates (role-aware sentences, contested-claim phrasing, transform provenance tags) remain minimal in this contract. Profile-driven phrasing lands with ADR 008.

- **`src/views/evidenceChain.ts`** — `EvidenceNode` gains `role?: EvidenceRole` populated from the source ref. Traversal forks at `contradicts` edges; visited-set cycle detection spans branches; depth cap (8) applies per branch.
- **`src/views/currentState.ts`** — every axis panel gains a `contested` array per ADR 009 §View updates. Supersession logic tracks "one side superseded → silence contest."
- **`src/views/openLoops.ts`** — new `contested_claim` kind with default `threshold_seconds: 3600` and `severity: medium`. Profile tuning hook present but no-op until ADR 008.
- **`src/views/timeline.ts`** — paired-entry render at `contradicts` edges; symmetric-link decoration computed at read time (no storage).
- **`src/views/narrative.ts`** — optional prefix annotation when `transform` is present; role-tag hook when a ref carries role; contested annotation in `_derived/current.md`. Prose template strings deliberately short; profile-driven phrasing is a later concern.
- **`src/views/active.ts`** — supersession/contested intersection helpers; no public API change.

### Migration + corpus sweep (phase 7)

New file: `scripts/migrate-v02-to-v03.ts`. Idempotent. Per-patient. Safe to re-run.

Deterministic rewrites:

| Surface | Rewrite rule | Source ADR |
|---|---|---|
| Structured vitals refs in `links.supports` / elsewhere | `{kind: "vitals", metric, from, to, encounterId}` → `{kind: "vitals_window", ref: <vitals:// URI>, selection: {metric, from, to, encounterId}}` | ADR 010 |
| Structured event/note/artifact refs | `{kind, id}` → `{kind, ref}` | ADR 010 |
| Bare-string supports | unchanged | ADR 010 |
| `links.addresses[*]` targets | rewrite to `links.resolves[*]` where target is an open-loop-kind event (pending/overdue intent, unacknowledged communication, active alert); leave as `addresses` where target is a `type:assessment` `subtype:problem` event | ADR 009 |
| `links.contradicts` | no backfill — contradictions are author intent, not derivable | ADR 009 |
| `transform` | no backfill — historical processing path is not reconstructible | ADR 011 |
| `pi-chart.yaml` | `schema_version: 0.2.x` → `0.3.0-partial` (ADRs 012/013 land the rest of the 0.3.0 bump) | cross-cutting |
| `patients/<id>/chart.yaml` | same version fields | cross-cutting |

Re-running the migration is a byte-identical no-op after the first run. Failure path: the script writes to a staging directory, validates against the new schema + validator, then atomically renames. The v0.3.0 version bump lands only if the validation pass is clean.

### Fixture + seed work (phase 7)

- **`patient_001`** — direct-edit repo fixture literals to canonical values. Apply the migration rewrites in-place. Audit agent-authored inferred assessments (if any) for V-EVIDENCE-01 warn surface; normalize to object-form supports where warning fires. Do not synthesize new `contradicts` events; the respiratory-decompensation narrative is correct as authored.
- **Repo-owned tests/examples** — direct-edit literals. Any test that constructs `EvidenceRef` objects uses the new shape; any test that uses `links.addresses` at an open-loop target rewrites to `links.resolves`. Tests that intentionally assert the v0.2 shape (to verify back-compat) are explicitly marked and kept.
- **A1 / A2 fixture drafts** — research markdown, not validated. No runtime change; update tables in §15 of each draft to show the new link and ref shapes as an authoring guide for Phase A Batch 2.
- **Any future Phase A Batch 1+ fixture** — authored against the new validator from the start; no separate audit needed.

## Tradeoffs

| Axis                                   | (a) Validator-only roll-in    | (b) End-to-end phased rollout (chosen) | (c) Per-ADR separate implementation contracts |
|----------------------------------------|-------------------------------|----------------------------------------|-----------------------------------------------|
| Substrate-runtime coherence            | poor — schema outruns parser  | strong — schema / types / parser / validator / views move together | medium — three smaller but overlapping contracts |
| Reviewability                          | one coherent surface per ADR  | one coherent surface per dependency-phase | three partially-overlapping surfaces          |
| Migration-script coherence             | fragile — three touches       | one migration emission                  | three scripts or three-passes of one script   |
| Self-generated warnings                | high — v0.2 shapes trigger V-EVIDENCE-01 | low — phase 4 ships the parser before rule fires | medium                                        |
| Rollback cost                          | low per file, high by drift   | revert one phase at a time              | revert one ADR at a time, re-apply others     |
| Reader burden                          | must remember deferred gaps   | each phase is internally coherent       | must re-hold three ADRs across three contracts |
| Fresh-session context                  | heavy — requires all ADRs     | heavy — same                            | lighter per contract, but more context switches |

(b) maps cleanly onto the ADR-007-proven review cadence: the operator reads one phase at a time across three ADRs at once, verifies the composite shape is coherent, advances. Per-ADR contracts (c) would reshape the validator three times over three reviews.

## Consequences

- **Multiple reviewable commits** across phases, each gated by verification. Exact count matters less than keeping schema / runtime / validator / views coherent at each boundary.
- **`validate.ts` grows materially** — 10 new rules on top of the existing 15 from ADR 007. Inline tables remain acceptable; a separate-module refactor is a later concern.
- **Types, parser, write helpers, views, and tests all change.** This is not a validator-only contract.
- **Docs change** in this implementation: CLAIM-TYPES link table, DESIGN §1 envelope + link table, §4 view primitive notes, §5.7 import-provenance paragraph, §8 invariant additions, ROADMAP acceptance rows.
- **Schema version advances to `0.3.0-partial`** on migration. Full `0.3.0` lands when ADRs 012 and 013 implement (hash chain + invalidated_at).
- **No runtime dependencies added.** Matches memo §13's no-new-runtime-dep posture.
- **Seed `patient_001` migrates in-place** via the deterministic rewrites; no synthesized correction events needed (ADR 007 precedent).

## Not decided here

- **Whether `scripts/migrate-v02-to-v03.ts` splits into per-ADR modules** (e.g., `migrate-010-evidence.ts`, `migrate-009-links.ts`). Lean: no — idempotency is easier to guarantee in one ordered pass. Revisit if ADRs 012/013 make the file unwieldy.
- **Whether the `0.3.0-partial` version tag is exposed to consumers** or stays internal. Current: exposed in `pi-chart.yaml` and `chart.yaml`; rationale is that chart readers in pi-agent or pi-sim may want to gate features. Revisit if a consumer surfaces a concrete requirement.
- **Whether V-EVIDENCE-01's warn-to-err promotion** fires on the same Phase A Batch 2 gate as V-SRC-01's promotion, or on a separate gate. Lean: same gate — one ceremony, two promotions.
- **Whether `openLoops` `contested_claim` threshold is per-profile from day one** or stays at the default until ADR 008 lands. Current decision: default-only in this contract; profile tuning hook present but unexercised. Profiles light up the hook.
- **Whether `evidenceChain` depth cap** applies across `contradicts` branches (one budget) or per-branch (two budgets). Current decision: per-branch per ADR 009 §View updates. Revisit if agent traces regularly hit the cap.
- **Whether v0.2 events with `source.kind: agent_reasoning`** get a fresh warn under V-EVIDENCE-01 if they author inferred assessments with bare-string supports. Current decision: yes — the existing V-SRC-02 deprecation warning and the new V-EVIDENCE-01 warn are independent surfaces; both fire. Operator reviews both at the Batch 2 gate.

## Verification gates (per phase)

Each phase commit must satisfy:

1. `npm test` green.
2. `npm run check` green.
3. `npm run typecheck` green.
4. If a phase introduces new envelope shape (phases 1–2), the affected read/write/view tests land in the same phase as the code change.
5. Commit message names the phase, the ADR surface, and any new rule codes landed (e.g., `Phase 3 — ADR 010 validator (V-EVIDENCE-01..03)`).

Phase 6 additionally requires:

6. `evidenceChain`, `currentState`, `openLoops` test suites cover the new surface (role threading, contested panels, `contested_claim` kind).

Phase 7 additionally requires:

7. A `patient_001` audit report (one-line summary: normalized kinds, `addresses`→`resolves` count, V-EVIDENCE-01 warns seen).
8. A migration-script round-trip test: run once, run again, assert byte-identical output.
9. Schema version in `pi-chart.yaml` and `patients/patient_001/chart.yaml` advances to `0.3.0-partial`.

Final acceptance gate (all phases): `npm run validate` green across all patients; migration script idempotent; 10 new rules visible in validator output when triggered; view test suites green.
