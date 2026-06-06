# Ultragoal brief: re-entry audit, decision resolution, and safe implementation path

## Confirmed handoff point

- Branch: `reentry-substrate-field-spec`
- Head: `89bd625 Add re-entry audit, substrate-field PRD+issues, truth-service proposal`
- Prior cleanup: `196c819 Resolve substrate drift: ContextPacket rename + stale-doc fixes`
- Pick-up artifact: `.scratch/pi-rn-reentry-audit-28052026/HANDOFF.md`

## Objective

Create and execute a durable long-running plan that audits the project state from the confirmed handoff, resolves the remaining field/truth-service decisions with `grill-with-docs --auto`, refreshes stale handoff/spec artifacts, and only then prepares the safest implementation path for rebasing `pi-chart` toward the `pi-ledger` clinical-truth kernel.

## Constraints

- Do not implement across the `pi-chart` to `pi-ledger` seam until the field-spec and truth-service decisions are settled.
- Use `grill-with-docs --auto` for the nine field-spec decisions and four truth-service sub-decisions; patch docs/ADRs as decisions stabilize.
- Keep clinician-facing language accessible first; software mechanics support the clinical reasoning.
- Preserve the project boundary: do not couple `pi-agent` directly to `pi-sim`; do not couple `pi-ledger` to `pi-chart` brownfield source or hidden `pi-sim`.
- Keep connectors `(patientId, encounterId, asOf)`-parameterized; demo target `patient_002/enc_p002_001`, regression target `patient_001`.
- Treat latency as first-class; do not propose spawn-per-call or latency-dismissive transports for the truth source.
- Kernel is not widened; the chart bends to the frozen `pi-ledger` Claim target.
- Leave untracked design/presentation assets alone unless a dedicated goal decides commit vs ignore.

## Required story sequence

1. Reconcile current handoff/spec state.
   - Verify branch, commit set, dirty state, and test baseline.
   - Refresh stale reconciliation language where issue files already changed.
   - Produce a concise current-state audit artifact under `.scratch/pi-rn-reentry-audit-28052026/`.

2. Run `grill-with-docs --auto` for field-spec decisions.
   - Resolve issues 02, 03, 04, 06, 07, 08, 09, 10, and 15 one repo-grounded question at a time.
   - Use a Claude validator challenge when available as required by the skill.
   - Patch `.scratch/pi-chart-per-patient-substrate-field-interface/` issue docs, `RECONCILIATION.md`, and relevant context docs inline.
   - Escalate only decisions that cannot be grounded or that reverse ADR-level product direction.

3. Run `grill-with-docs --auto` for truth-service decisions.
   - Resolve transport, storage engine, concurrency model, and ADR promotion.
   - Promote accepted architecture into `pi-ledger` ADR 009 and `pi-chart` ADR 021 only if the auto-grill reaches stable acceptance.
   - Preserve proposed status if validator/human escalation blocks acceptance.

4. Convert settled decisions into an implementation-ready plan.
   - Identify which of the 15 issues are codeable after decisions land.
   - Sequence pi-chart-internal field work before any seam work.
   - Define tests before edits: fixture round-trip, projection derivation, canonical UTC, evidence edge, lifecycle/review facts, and adapter-boundary guards.
   - Do not start seam implementation unless the ADRs and field contract make it safe.

5. Execute only the safe local implementation slice, if one exists after decisions.
   - Prefer pi-chart-internal field/spec/test cleanup over cross-process truth-service work.
   - Keep diffs narrow and reversible.
   - Verify with targeted tests, typecheck, and relevant Rust tests.

6. Final quality gate.
   - Run post-edit verification.
   - Run ai-slop-cleaner on changed files, or record no-op if no implementation edits occurred.
   - Rerun verification.
   - Run independent code review and architect review before marking the aggregate goal complete.

## Stop condition

Stop when the durable plan has either:

- settled and documented the decisions, produced an implementation-ready plan, safely completed any locally codeable slice, and passed final verification/review; or
- recorded a durable blocker with the exact unresolved decision, validator evidence, and next human question.
