# Current state — clinical-truth service seam planning ultragoal

Date: 2026-05-31
Ultragoal story: `G001-baseline-and-current-state-capture`

## Active objective

Create an implementation-ready planning substrate for the private `pi-ledger` clinical-truth service and the `pi-chart` backend client seam, without implementing production accepted clinical writes in this run.

## Prior ultragoal preservation

The previous completed ultragoal artifacts were preserved before recreating `.omx/ultragoal`:

- Archive: `.scratch/pi-rn-next-ultragoal-zoom-out/previous-ultragoal-archive-20260531T185255/`
- Archived files: `brief.md`, `goals.json`, `ledger.jsonl`

The previous run's durable review artifacts remain under:

- `.scratch/pi-rn-reentry-audit-28052026/`

## New ultragoal artifacts

- Scope map: `.scratch/pi-rn-next-ultragoal-zoom-out/SCOPE-MAP.md`
- New brief: `.scratch/pi-rn-next-ultragoal-zoom-out/ULTRAGOAL-BRIEF.md`
- Runtime plan: `.omx/ultragoal/goals.json`
- Runtime ledger: `.omx/ultragoal/ledger.jsonl`

The generated plan was manually refined from 11 parser-produced items to 8 executable stories. Objective, success criteria, and constraints remain in `.omx/ultragoal/brief.md` and `ULTRAGOAL-BRIEF.md`; they are not separate executable stories.

## Dirty/untracked state at start

The workspace already contains uncommitted artifacts from the prior completed ultragoal, including modified `.scratch/pi-chart-per-patient-substrate-field-interface/**` docs, untracked prior review artifacts under `.scratch/pi-rn-reentry-audit-28052026/`, accepted ADRs `pi-ledger/docs/adr/009-clinical-truth-service.md` and `pi-chart/docs/adr/021-clinical-truth-service-client-boundary.md`, plus untracked design/showcase assets.

This ultragoal adds new planning artifacts under:

- `.scratch/pi-rn-next-ultragoal-zoom-out/`
- `.scratch/pi-rn-clinical-truth-service-seam-planning/`
- `.omx/ultragoal/`

## Baseline verification posture

No source/runtime files have been intentionally changed in this new ultragoal so far. The prior completed ultragoal final gate recorded:

- `pi-chart npm run typecheck` passed;
- `pi-chart npm test` passed, 389/389;
- `pi-ledger cargo test` passed, 128/128;
- `git diff --check` passed;
- final independent code-reviewer APPROVE and architect CLEAR.

For this G001 capture, fresh lightweight validation is limited to JSON/JSONL parse and whitespace diff checks for the newly created ultragoal/planning artifacts. Full app/Rust tests are reserved for source/runtime changes or final gate verification.

## Planning constraints carried forward

- Do not build the full production clinical-truth service in this run.
- Do not connect browsers, EHR plugins, or `pi-agent` directly to `pi-ledger` accepted writes.
- Do not introduce a TypeScript canonicalization/admission clone.
- Do not ingest hidden `pi-sim` internals.
- Do not treat Shift Brain, Report View, Handoff View, or other clinician surfaces as truth stores.
- Preserve backend-mediated access to the private/internal clinical-truth service.
