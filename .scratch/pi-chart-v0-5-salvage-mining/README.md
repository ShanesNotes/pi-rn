# pi-chart V0.5 salvage-mining workstream

Status: locked future workstream; no active mining PRD, no implementation authority.

## Purpose

This marker records that prior pi-chart work may contain valuable clinical/product evidence, especially `patient_001`-`patient_005` AI-curated simulated patient charts and non-technical clinical documents. It also prevents context poison during the clean-canvas claim-ledger kernel work.

Do not deep-mine old prototype code, patient directories, generated UI, memos, or archived research packages during Phase 1 kernel implementation unless a current kernel issue names a narrow lookup needed for a clinical truth guardrail or test scenario.

## Timing

This workstream opens only after `.scratch/pi-ledger-claim-ledger-kernel/` completes K0-K6 closeout or a later accepted ADR/PRD explicitly reopens it.

## Expected future outputs

Future salvage mining should produce adopt/defer/reject tables and then PRDs/issues. It should not produce direct code changes.

Likely future mining lanes:

- `patient_001`-`patient_005` AI-curated simulated patient charts for realistic fixture/test scenarios;
- non-technical clinical-reference documents for vocabulary and acceptance scenarios;
- prototype views for product requirements, not architecture;
- current tests for possible clinical truth guardrails, not implementation structure;
- archived research packages for later phase PRDs after the kernel proof.

## Boundary

Prior work is evidence only. Salvaged concepts must be promoted into `.scratch` PRDs/issues, accepted `docs/adr/`, or canonical pi-chart docs before coding.
