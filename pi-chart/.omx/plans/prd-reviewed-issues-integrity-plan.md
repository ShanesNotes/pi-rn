# PRD: reviewed issues integrity-first remediation plan

## Plan Summary

**Scope**
- 7 ordered workstreams across ~12 files.
- Estimated complexity: MEDIUM-HIGH.
- Primary touchpoints: `src/write.ts`, `src/read.ts`, `src/time.ts`, `src/validate.ts`, their tests, `README.md`, `artifacts/README.md`, `package.json`, and new `tsconfig.json`.

**Grounding evidence**
- Canonical-store importance and write-boundary claims: `README.md:10-14`, `README.md:58-117`.
- Read bug: `src/read.ts:74-90`.
- Write integrity gaps: `src/write.ts:60-79`, `src/write.ts:143-226`, `schemas/event.schema.json:7-145`, `schemas/note.schema.json:7-62`.
- Time drift: `chart.yaml:4-9`, `src/time.ts:41-79`, `src/write.ts:81-140`.
- Validator coverage gap: `src/validate.ts:200-245`, `src/validate.ts:279-334`, `src/validate.ts:479-485`.
- Tooling/doc drift: `package.json:7-22`, `artifacts/README.md:3-5`, `src/index.ts:13-20`.

## RALPLAN-DR short mode summary

### Principles
1. Protect canonical chart integrity before fixing downstream readers. The chart is the durable source of truth (`README.md:10-14`).
2. Validate finalized write candidates before persistence, not raw partial inputs, so current autofill behavior stays intact (`src/write.ts:150-156`, `src/write.ts:172-175`).
3. Prefer narrow, filesystem-realistic guarantees over overstated “atomic” claims because current primitives provide single-file atomic rename plus NDJSON append, not true multi-file transactions (`src/fs-util.ts:13-21`, `src/write.ts:204-226`).
4. Keep contracts singular and testable: one write-time timezone rule, one duplicate-id rule, one explicit verification path.
5. Reuse existing schemas/validator logic before inventing parallel rules (`schemas/event.schema.json:7-145`, `schemas/note.schema.json:7-62`, `src/validate.ts:44-141`).

### Top decision drivers
1. **Durable integrity risk**: write APIs can persist schema-invalid, wrong-subject, duplicate-id, or orphan-note state before validation catches it (`src/write.ts:143-226`, `src/validate.ts:213-226`, `src/validate.ts:313-333`, `src/validate.ts:479-485`).
2. **Contract correctness**: docs promise `writeCommunicationNote` atomic behavior and `readRecentEvents` recency semantics that current code does not honor (`README.md:97-101`, `src/read.ts:74-90`).
3. **Determinism**: host-local vs UTC vs chart timezone drift changes timestamps, IDs, and day-directory placement (`chart.yaml:6-9`, `src/time.ts:73-79`, `src/write.ts:81-140`).

### Viable options

#### Option A — integrity-first staged hardening (chosen)
Order: write preflight invariants -> read bounds -> communication-note consistency -> time contract -> typecheck -> validator coverage -> docs.
- **Pros**: fixes durable corruption risks first; aligns with canonical-store model; lets later docs/tests describe stable contracts.
- **Cons**: broader first step; requires explicit test seam for induced write failure.

#### Option B — query/validator-first, then writes
Order: read bug -> validator warnings -> time -> writes.
- **Pros**: easier early wins; smaller first diff.
- **Cons**: leaves sanctioned write path able to persist invalid canonical state; misprioritizes misread risk over corruption risk.

#### Option C — time-contract-first normalization, then writes/reads
Order: timezone/timestamp rewrite -> write/read fixes -> validator/tooling/docs.
- **Pros**: single temporal contract early.
- **Cons**: broad blast radius; changes IDs/day paths before acute integrity issues are contained.

### Invalidation rationale
Option B is invalidated because priority is explicitly highest-risk correctness/integrity first, and `src/write.ts:143-226` can durably persist bad state while `src/read.ts:74-90` only misreads. Option C is invalidated because time normalization touches IDs and path placement before the current write boundary is made safe.

## Requirements summary

1. `appendEvent`, `writeNote`, `writeCommunicationNote`, and `writeArtifactRef` must reject finalized candidates that violate schema, chart subject, or global explicit-ID uniqueness before any filesystem write (`src/write.ts:143-256`, `src/validate.ts:479-485`).
2. `writeCommunicationNote` must stop claiming impossible cross-file atomicity and instead guarantee: under the existing single-writer assumption (`src/write.ts:10-14`), a rejected call leaves no newly-created note file and no newly-appended communication event.
3. `readRecentEvents` must return only records within an inclusive interval `cutoff <= effective_at <= asOf` and never leak future events (`src/read.ts:74-90`).
4. Write-generated timestamps, IDs, and day directories must follow one documented zone rule: use `chart.yaml.timezone` when the library generates the timestamp; preserve caller-supplied timestamps verbatim; fall back to UTC if the chart timezone is absent (`chart.yaml:6-9`, `src/time.ts:73-79`, `src/write.ts:81-140`).
5. Validator parity must extend existing path-date warnings to notes and encounters (`src/validate.ts:200-245`, `src/validate.ts:279-334`).
6. Project-level typecheck must become reproducible via local config/script. Adding `typescript` as a dev dependency is allowed because `package.json:7-22` currently lacks a compiler.
7. Docs must match the TS public surface and the narrowed write/time guarantees (`README.md:97-117`, `artifacts/README.md:3-5`, `src/index.ts:13-20`).

## Testable acceptance criteria

1. **Write preflight rejection**
   - New tests in `src/write.test.ts` prove schema-invalid finalized events/notes are rejected before persistence.
   - Wrong-subject writes are rejected using `chart.yaml.subject`.
   - Explicit-ID collisions against any existing canonical ID (events, notes, structural markdown) are rejected before persistence.
   - Verification proof: failed calls leave no new note file and no new NDJSON line.

2. **Communication-note consistency**
   - A deterministic failure injected after note creation but before event persistence proves `writeCommunicationNote` rolls back only artifacts created by the current call.
   - Cleanup failures surface an error that preserves the original failure plus rollback failure details.
   - Public API remains unchanged; any test seam is internal to `src/write.ts` and not re-exported from `src/index.ts`.

3. **Read window correctness**
   - `src/read.test.ts` adds a future event and proves it is excluded when `asOf` is earlier.
   - Tests prove interval semantics are inclusive at both bounds.

4. **Time contract**
   - Tests in `src/time.test.ts` and/or `src/write.test.ts` prove generated `recorded_at`, generated IDs, and day-directory placement use `chart.yaml.timezone`.
   - A missing-timezone fixture proves UTC fallback.
   - Existing caller-supplied timestamps remain unchanged.

5. **Validator parity**
   - `src/validate.test.ts` proves note `effective_at` and encounter frontmatter `effective_at` mismatches against `timeline/YYYY-MM-DD` paths emit warnings aligned with current event/vitals behavior (`src/validate.ts:228-273`).

6. **Tooling/docs**
   - `npm run typecheck` exists and exits 0 on a clean checkout after implementation.
   - `README.md` and `artifacts/README.md` describe the actual TS API names and narrowed consistency/time guarantees.

## Implementation steps in strict priority order

### 1) Harden write-path invariant enforcement before persistence
**Files:** `src/write.ts`, `src/write.test.ts`, `src/validate.test.ts`, possibly `src/schema.ts` for validator reuse.
- Replace presence-only preflight in `checkProvenance` (`src/write.ts:60-79`) with a staged flow:
  1. Build finalized candidate object with current deterministic defaults (`src/write.ts:150-156`, `src/write.ts:172-175`).
  2. Validate finalized candidate against `event.schema.json` or `note.schema.json`.
  3. Verify `subject === chart.yaml.subject` using `loadChartMeta` (`src/time.ts:32-45`).
  4. Reject explicit-ID collisions against the global canonical ID namespace model already enforced in `src/validate.ts:479-485`.
- Keep `writeArtifactRef` on the same invariant path because it funnels into `appendEvent` (`src/write.ts:229-257`).
- Add regression tests first, then implement.

### 2) Fix `readRecentEvents` upper-bound semantics
**Files:** `src/read.ts`, `src/read.test.ts`, `README.md` if wording needs exact interval semantics.
- Add missing tests for future-event exclusion and inclusive upper bound.
- Update `src/read.ts:82-88` so parsed timestamps later than `asOf` are excluded, not just timestamps older than `cutoff`.
- Decide and document behavior for unparsable `effective_at`; preferred executor target is to exclude invalid timestamps rather than silently include them.

### 3) Fix `writeCommunicationNote` consistency under single-writer semantics
**Files:** `src/write.ts`, `src/write.test.ts`, `README.md`.
- Narrow the contract in `README.md:97-101` from generic “atomic” to the explicit rollback-safe single-writer guarantee.
- Introduce an internal-only test seam in `src/write.ts` for deterministic failure injection between note persistence and event persistence; do not export it from `src/index.ts:13-20`.
- Ensure rollback only deletes artifacts created by the current call and never edits preexisting files.
- Preserve public API shape `{ notePath, eventId }` on success.

### 4) Resolve time-contract drift with one shared write-time helper
**Files:** `src/time.ts`, `src/write.ts`, `src/time.test.ts`, `src/write.test.ts`, `README.md`, possibly `chart.yaml` docs.
- Centralize write-time generation in `src/time.ts` instead of maintaining separate helpers in `src/time.ts:73-79` and `src/write.ts:81-97`.
- Canonical rule: generated timestamps/IDs/day directories use `chart.yaml.timezone`; supplied timestamps are preserved; missing timezone falls back to UTC.
- Keep `clock` semantics scoped to default read behavior (`src/time.ts:41-45`, `README.md:113-117`), not write-zone choice.
- Update docs to note that default `asOf` may be driven by latest event or vitals timestamp because `latestEffectiveAt` scans both (`src/time.ts:47-63`).

### 5) Add reproducible project-level typecheck
**Files:** `package.json`, new `tsconfig.json`, lockfile if `typescript` is added.
- Add a minimal repo-local typecheck command.
- If local compiler support is absent, add `typescript` as dev infrastructure. This is allowed because typecheck is currently impossible to reproduce from repo state (`package.json:7-22`).
- Keep scope to config/tooling only; no architecture redesign.

### 6) Extend validator path-date coverage to notes and encounters
**Files:** `src/validate.ts`, `src/validate.test.ts`.
- Mirror current warning-style checks for events and vitals (`src/validate.ts:228-273`) in:
  - encounter headers under `timeline/<day>/encounter_*.md` (`src/validate.ts:200-204`),
  - notes under `timeline/<day>/notes/*.md` (`src/validate.ts:288-333`).
- Keep severity as warning unless implementation evidence shows the repo already treats path-date mismatches as fatal.

### 7) Repair doc drift last, after behavior is stable
**Files:** `README.md`, `artifacts/README.md`.
- Align `writeCommunicationNote` wording with the narrowed guarantee.
- Align artifact docs with `writeArtifactRef` naming from `src/index.ts:13-20`.
- Ensure time semantics section reflects actual `latestEffectiveAt` and timezone behavior.

## Risks and mitigations

- **Risk: validator logic duplicated between write path and validator.**
  - **Mitigation:** reuse existing schema loaders/normalization patterns where possible (`src/validate.ts:64-76`, `src/validate.ts:493-504`).
- **Risk: rollback logic hides partial-failure details.**
  - **Mitigation:** require combined error reporting when cleanup fails.
- **Risk: timezone normalization changes generated IDs/day placement around midnight.**
  - **Mitigation:** land explicit timezone tests before helper swap; stage time work after write/read integrity fixes.
- **Risk: typecheck step expands scope via compiler churn.**
  - **Mitigation:** use minimal `tsconfig.json`; limit step to reproducible checking, not broad type refactors.
- **Risk: new duplicate-ID scan is too expensive.**
  - **Mitigation:** scope to explicit IDs first; generated IDs can continue using current incrementing helpers unless collision evidence appears.

## Verification steps

### Baseline evidence gathered now
- `npm test` -> pass (45/45) on April 19, 2026.
- `npm run check` -> pass with `0 error(s), 0 warning(s)` on April 19, 2026.

### Required post-implementation verification
1. `npm test`
2. `npm run check`
3. `npm run typecheck`
4. Focused scenario proofs:
   - rejected invalid event/note writes create no new canonical artifact,
   - injected `writeCommunicationNote` second-step failure leaves no orphan note/event,
   - future event is excluded from `readRecentEvents` when `asOf` is earlier,
   - generated write timestamps/IDs/day paths follow chart timezone and UTC fallback rules,
   - note and encounter path-date mismatches produce warnings.

## ADR

### Decision
Adopt Option A: integrity-first staged hardening. First make the sanctioned write surface reject invalid state before persistence, then fix read-window correctness, then fix the two-file communication-note consistency contract, then repair time/tooling/validator/docs in descending integrity risk.

### Drivers
- Canonical durable-memory model (`README.md:10-14`).
- Current write API can persist invalid state before validation catches it (`src/write.ts:143-226`, `src/validate.ts:213-226`, `src/validate.ts:313-333`, `src/validate.ts:479-485`).
- Current time and doc contracts drift from implementation (`README.md:97-117`, `chart.yaml:6-9`, `src/time.ts:73-79`, `src/write.ts:81-97`).

### Alternatives considered
- Option B: read/validator first.
- Option C: time normalization first.

### Why chosen
Only Option A addresses the highest-risk integrity failures before broader contract cleanup. It also creates a stable base for later documentation and typecheck work.

### Consequences
- Early implementation work will be concentrated in `src/write.ts` and tests.
- Docs should stop promising impossible multi-file atomicity.
- Time normalization becomes an explicit contract change, not incidental cleanup.
- Adding `typescript` as dev infrastructure may be necessary.

### Follow-ups
- After implementation, consider whether generated-ID collision checks should expand from explicit IDs to all generated IDs if concurrency or cross-day anomalies appear.
- If stronger-than-single-writer guarantees become necessary later, design a real journal/transaction mechanism rather than extending ad hoc rollback.

## Available-agent-types roster and execution staffing guidance

### Relevant agent types
- `ralph` / single-owner execution loop: best fit for this plan.
- `team` / coordinated parallel lanes: optional if faster turnaround is needed.
- Supporting roles: `executor`, `architect`, `critic`, `test-engineer`, `verifier`, `build-fixer`, `writer`, `explore`.

### Ralph follow-up staffing guidance
Use one owner with periodic specialist check-ins.
- **Primary lane:** `executor`, reasoning **high**.
- **Midpoint review:** `architect` or `critic`, reasoning **high**, after steps 2 and 4.
- **Verification closeout:** `verifier`, reasoning **high** after code/tests pass.
- Best when one person owns `src/write.ts`/`src/time.ts` cross-file consistency end to end.

### Team follow-up staffing guidance
Use only if parallelism is worth coordination overhead.
- **Lane A — Write integrity + rollback:** `executor`, reasoning **high**. Owns `src/write.ts`, `src/write.test.ts`, related README contract edits.
- **Lane B — Read/time/validator parity:** `executor`, reasoning **medium-high**. Owns `src/read.ts`, `src/read.test.ts`, `src/time.ts`, `src/time.test.ts`, `src/validate.ts`, `src/validate.test.ts`.
- **Lane C — Tooling/docs finish:** `build-fixer` then `writer`, reasoning **medium**. Owns `package.json`, `tsconfig.json`, `artifacts/README.md`, doc finalization after A/B settle.
- **Shared closeout:** `verifier`, reasoning **high**. Runs final command suite and scenario proofs.

### Explicit launch hints
- **Ralph path:** hand this PRD plus the companion test spec to `$ralph` for sequential execution.
- **Team path:** hand this PRD plus the companion test spec to `$team`, assign disjoint ownership as above, and keep Lane C behind A/B contract decisions.

### Team verification path
1. Lane A and Lane B each land their regression tests before behavior edits.
2. Lane C waits until time/consistency wording is stable.
3. Shared verifier runs `npm test`, `npm run check`, `npm run typecheck`.
4. Shared verifier also inspects concrete artifacts in a temp chart to prove no orphan note/event and no future-event leak.
5. If any command or scenario proof fails, return to the owning lane; do not merge with only validator-level confidence.
