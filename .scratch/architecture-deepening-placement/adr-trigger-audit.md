# ADR Trigger Audit — Architecture Deepening Placement

Status: completed
Date: 2026-05-03
Parent issue: `.scratch/architecture-deepening-placement/issues/06-adr-trigger-audit.md`
Source placement PRD: `.scratch/architecture-deepening-placement/PRD.md`

## Executive decision

No immediate ADRs should be created from the downstream architecture-deepening lanes yet.

The downstream PRD lanes are now drafted, but they remain `Status: needs-triage`. That makes them durable planning surfaces, not accepted decisions. The accepted authority ADRs already cover the hard boundaries that matter right now:

- `pi-sim/docs/adr/004-planning-surface-and-public-contract-authority.md` owns producer-side public telemetry authority and the `.scratch` planning surface decision.
- `pi-monitor/docs/adr/003-public-lane-consumer-authority.md` owns display-only public-lane consumer authority.
- `pi-chart` chart-write and validation ADRs must wait for the parallel rebase to name stable ownership, files, Interfaces, and verification commands.

## Audit rule

Promote a lane decision to ADR only when all of these are true:

1. the downstream PRD/issue has been triaged and accepted;
2. the decision is durable, hard to reverse, and trade-off driven;
3. the owning subproject is clear;
4. regression or structural verification evidence exists;
5. the ADR would prevent future agents from crossing a dangerous Seam or duplicating authority.

Do not create ADRs for ordinary issue slices, internal refactor intent, speculative Interface names, or parked post-rebase work.

## Lane-by-lane trigger table

| Lane | Current status | Existing authority | ADR trigger status | Owning path if later needed | Driver needed before ADR | Rejected alternative to record if promoted | Required verification before ADR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `pi-sim` public telemetry publication Module | Drafted; `Status: needs-triage` | `pi-sim` ADR 004 plus `pi-sim/vitals/README.md` and `.lanes.json` | **No ADR now.** Existing authority is enough while this remains inventory/regression/internal Module planning. | Future candidate: `pi-sim/docs/adr/005-public-telemetry-publication-module.md` | A triaged issue accepts a durable internal Module Interface or changes how maintainers reason about publication semantics. | Rejected: duplicate ADR 004 authority or freeze a speculative Module before tests prove the seam. | `npm test --prefix pi-sim`; README/manifest consistency; public contract fixture checks; no hidden simulator internals exposed to sibling consumers. |
| `pi-sim` runner event/reveal subordinate work | Drafted as subordinate issue inside publication lane | Same as above; public assessment reveal behavior is documented by `pi-sim/vitals/README.md` | **No ADR now.** Keep subordinate to publication Module until reveal/replay semantics become an external invariant. | Same future `pi-sim` ADR only if needed | A triaged issue accepts durable external reveal/replay semantics beyond existing public contract docs. | Rejected: separate top-level ADR/PRD for runner details that are implementation Locality. | `npm test --prefix pi-sim`; assessment reveal/replay tests; public fixture safety checks. |
| `pi-monitor` public-lane ingest depth | Drafted; `Status: needs-triage` | `pi-monitor` ADR 003 | **No ADR now.** ADR 003 already captures public-lane source preference, display-only scope, and non-chart authority. | Future candidate: `pi-monitor/docs/adr/004-public-lane-ingest-module-depth.md` | A triaged issue changes crate Interfaces or accepts a durable ingest Seam that future monitor replacements must know. | Rejected: duplicate ADR 003 or treat transport Adapter cleanup as a new decision. | `cargo fmt --all -- --check`; `cargo clippy --workspace --all-targets -- -D warnings`; `cargo test --workspace`; `cargo build --workspace`; public-consumer boundary check. |
| Observable charting adapter readiness / draft staging contract | Drafted; `Status: needs-triage`; contract/readiness-only | `pi-chart/CONTEXT.md` plus existing charting ADRs 006, 010, 011, 017 as read-only vocabulary; `pi-sim` public telemetry docs as producer authority | **No ADR now.** Keep chart-write policy as PRD/memo seed until post-rebase chart-write ownership is known. | Future likely candidate: `pi-chart/docs/adr/NNN-draft-flowsheet-observation-and-clinician-validation-seam.md`, only after rebase ownership is named | Post-rebase `pi-chart` maintainers accept draft observation semantics, clinician/user validation gates, provenance, idempotency, replay offsets, and patient/encounter mapping. | Rejected: create `pi-rn/ingest/`, allow hidden `pi-sim` inputs, or promote unowned chart-write policy into ADR before rebase closeout. | Public-lane-only fixture checks; negative boundary checks for hidden sim/monitor display/private agent inputs; chart-write policy review against stable post-rebase `pi-chart` APIs. |
| `pi-chart` post-rebase validation Module audit | Parked; `Status: needs-triage`; `Parking state: parked` | `pi-chart` ADRs 018, 019, 020 as historical/current rebase evidence | **No ADR now.** Validation Module work is explicitly blocked on rebase closeout. | Future candidate path must be named by post-rebase `pi-chart` owner | Rebase closeout names stable validation owners, files, Interfaces, commands, and relation to `pi-ledger` kernel checks. | Rejected: slice implementation or write ADRs from current `pi-chart` code shape while rebase is active. | Post-rebase published checks; validation ownership audit; no hidden `pi-sim` or prototype-only evidence as chart truth. |

## Immediate ADR recommendations

None.

This is intentional. The current durable decision is placement, not implementation. The downstream lanes are ready for triage and future execution, but they should not create ADRs until their issue slices prove a durable Interface, Seam, Adapter, or invariant.

## Deferred ADR queue

These are conditional candidates, not work items to create now:

1. `pi-sim/docs/adr/005-public-telemetry-publication-module.md`
   - Create only if the `pi-sim` publication lane accepts a durable internal Module Interface or changes public publication reasoning.
2. `pi-monitor/docs/adr/004-public-lane-ingest-module-depth.md`
   - Create only if the ingest lane changes crate Interfaces or accepts a durable ingest Seam relevant to monitor replacements.
3. `pi-chart/docs/adr/NNN-draft-flowsheet-observation-and-clinician-validation-seam.md`
   - Create only after the `pi-chart` rebase names stable chart-write ownership and existing ADRs cannot represent draft flowsheet staging without ambiguity.
4. A post-rebase `pi-chart` validation ADR, path/name TBD by rebase owner.
   - Create only if the validation audit accepts a durable validation Module Interface after stable owners/files/commands exist.

## Non-ADR follow-ups

- Triage the four downstream PRDs and their issue slices before implementation.
- Keep adapter readiness contract-only until chart-write policy and post-rebase ownership are accepted.
- Keep `pi-rn/ingest/` uncreated.
- Keep `pi-sim/vitals/README.md` plus `.lanes.json` as producer-side public telemetry authority.
- Keep `pi-monitor` display-only authority intact.

## Boundary checks

This audit creates no ADR files and does not edit source files. It preserves:

- hidden `pi-sim` internals as forbidden inputs;
- monitor display internals as non-chart authority;
- `pi-agent` as assistant/reviewer, not chart-truth executor;
- clinician/user validation as the final chart truth gate;
- `pi-chart` rebase dependency for chart-write and validation decisions.
