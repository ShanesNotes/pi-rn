# Final implementation readiness gate

Date: 2026-05-31
Ultragoal story: `G008-final-implementation-readiness-gate`

## Scope

This ultragoal produced planning/docs artifacts for the private `pi-ledger` clinical-truth service and `pi-chart` backend client seam. No source/runtime implementation was intentionally added.

## Artifacts produced

- `.scratch/pi-rn-next-ultragoal-zoom-out/SCOPE-MAP.md`
- `.scratch/pi-rn-next-ultragoal-zoom-out/ULTRAGOAL-BRIEF.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/CURRENT-STATE.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/CONTRACT-GAP-REGISTER.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/SERVICE-CONTRACT-PRD.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/SERVICE-CONTRACT-TEST-SPEC.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/CONFORMANCE-GOLDEN-VECTORS.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/WAL-STORAGE-REBUILD-PLAN.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/PI-CHART-ADAPTER-TEST-PLAN.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/BOUNDARY-SECURITY-ACCESS-PLAN.md`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/AI-SLOP-CLEANUP-REPORT.md`

## Verification

Passed after final review corrections:

- `.omx/ultragoal/goals.json` parses as JSON and `.omx/ultragoal/ledger.jsonl` parses as JSONL.
- `git diff --check` passed.
- `cd pi-chart && npm run typecheck` passed.
- `cd pi-chart && npm test` passed, 389/389.
- `cd pi-ledger && cargo test` passed, 128/128.

## AI slop cleaner

Report: `.scratch/pi-rn-clinical-truth-service-seam-planning/AI-SLOP-CLEANUP-REPORT.md`

Result: passed/no-op for executable cleanup. The active new artifacts are planning docs. The only active fallback-like phrase is checkpoint fallback to earlier checkpoint/full WAL replay, classified as grounded fail-safe behavior because it preserves evidence and fails closed if validation cannot rebuild trusted history. Archived prior ultragoal ledger fallback language is historical audit evidence, not active design text.

## Independent review evidence

Initial independent review found non-clean items:

- `code-reviewer` COMMENT: snapshot/rebuild lacked explicit patient/admin scope; base append revision-payload error was nondeterministic; scope map mentioned failed auto-validator path.
- `architect` WATCH: vectors were specified-not-generated while adapter exit criteria allowed stubs; first-slice identity/idempotency needed a harder gate.

Fixes applied:

- Snapshot/rebuild operations now require `PatientLedgerRef` and admin/maintenance context and reject cross-patient scope.
- Added deterministic `REVISION_NOT_ALLOWED_FOR_APPEND` to PRD vocabulary, test spec, and golden vectors.
- Reframed D001-D012 as current authority in the scope map without stale active-blocker language.
- Adapter exit criteria now require Rust-generated vectors before runtime seam implementation; stubs are scaffolding only.
- First vertical slice must choose one narrow fact family with explicit Claim identity, idempotency behavior, registry fixture, and retry/conflict semantics.

Fresh independent review:

- `code-reviewer` lane: **APPROVE**. Remaining issues: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 0. Prior findings resolved.
- `architect` lane: **CLEAR**. No architecture blocker remains; minor idempotency vectorization timing debt is acceptably gated by the first-vertical-slice requirement.

## Final synthesis

Recommendation: **APPROVE for planning completion**.

This ultragoal makes the next source-code ultragoal safer, but it does not authorize full production service implementation. The next implementation ultragoal should start with a narrow vertical slice that first generates Rust-owned vectors and selects one fact family with explicit Claim identity, idempotency, registry fixture, and retry/conflict semantics.

## Remaining gates for future source work

- Produce Rust-generated conformance/golden vectors for the chosen first vertical slice.
- Decide the first narrow fact family.
- Define production `PredicateRegistry` ownership/loading/versioning for that slice.
- Implement deterministic idempotency behavior in executable contract tests.
- Keep `pi-chart` as backend-mediated client only; no direct browser/EHR/`pi-agent` accepted-write path.
- Preserve hidden `pi-sim` boundaries and clinician-surface projection boundaries.
