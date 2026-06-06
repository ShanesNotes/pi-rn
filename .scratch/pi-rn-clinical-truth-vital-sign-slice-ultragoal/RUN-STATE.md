# Run state — clinical-truth vital-sign vertical slice ultragoal

Date: 2026-05-31
Active ultragoal: `.omx/ultragoal/goals.json`
Ledger: `.omx/ultragoal/ledger.jsonl`

## First fact family decision

The first implementation slice is `vital.sign` observation.

Why this slice is unblocked:

- `pi-ledger` already has `vital.sign` fixture predicate behavior and happy-path kernel tests.
- `pi-chart` already has `VitalSample`, vitals trend, evidence, and patient-scope tests.
- The previous readiness gate explicitly required one narrow fact family with Claim identity, idempotency, registry fixture, and retry/conflict semantics before runtime seam work.

## Prior ultragoal archive

The prior completed clinical-truth planning ultragoal was archived before overwriting `.omx/ultragoal`:

- See `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/latest-previous-archive.txt`.
- Archived files include prior `brief.md`, `goals.json`, and `ledger.jsonl`.

## Current plan shape

The active plan has 12 stories:

1. Baseline/archive/AFK preflight.
2. Versioned Rust registry support.
3. Rust-owned conformance vectors.
4. Transport-agnostic service-core scaffold.
5. Append/idempotency semantics.
6. Point-read/snapshot/admin boundaries.
7. Per-patient WAL/log storage prototype.
8. Pi-chart adapter contract tests before runtime adapter.
9. Pi-chart backend-mediated adapter slice.
10. Cross-project conformance/boundary verification.
11. Docs/ADR/handoff updates.
12. Final mandatory quality gate.

## Dirty-state baseline

This repo started with pre-existing dirty/untracked work, especially prior `.scratch/` planning artifacts, ADR docs, design assets, and `showcase/`. Do not revert unrelated dirty files. New work for this ultragoal should remain attributable to:

- `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/`
- `.omx/ultragoal/`
- future source/story-specific paths under `pi-ledger/` and `pi-chart/`.

## Verification baseline

Fresh G001 baseline passed:

- `.omx/ultragoal/goals.json` and `.omx/ultragoal/ledger.jsonl` parse.
- `git diff --check` passed.
- `cd pi-ledger && cargo test` passed: 128/128 total across unit/integration/doc tests.
- `cd pi-chart && npm run typecheck` passed.
- `cd pi-chart && npm test` passed: 389/389.

Evidence files live under `.scratch/pi-rn-clinical-truth-vital-sign-slice-ultragoal/evidence/`.

## AFK unblocker policy

If a later story hits a material blocker:

- Write a blocker artifact under this directory.
- Checkpoint the current OMX story as failed/review-blocked with evidence.
- Prefer narrowing the next story or adding explicit tests over asking the human, unless human clinical/authority input is genuinely required.

## Boundary reminders

- `pi-ledger` must not import `pi-chart`, hidden `pi-sim`, patient directories, or UI artifacts.
- `pi-chart` must not compute canonical ledger hashes or use private `ledger-core` internals as runtime authority.
- The browser/UI/EHR/`pi-agent` path must not call the private clinical-truth service directly.
- `pi-sim` hidden internals remain out of scope; only public telemetry/fixtures may become chart input through explicit adapters.
