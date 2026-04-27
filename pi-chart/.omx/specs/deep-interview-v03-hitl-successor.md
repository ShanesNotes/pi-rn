# Deep Interview Spec — V03 HITL Successor

## Metadata

- Profile: quick
- Rounds: 2
- Final ambiguity: 0.12
- Threshold: 0.30
- Context type: brownfield
- Context snapshot: `.omx/context/v03-hitl-successor-20260426T154824Z.md`
- Source acceptance report: `docs/plans/v03-foundation-reconciliation-acceptance-report.md`
- Preceding commit: `e42f773 Land V03-001 acceptance report and S1-S6 HITL framing`

## Clarity breakdown

| Dimension | Score | Notes |
|---|---:|---|
| Intent | 0.95 | Operator wants the next recorded V03 successor direction after reconciliation. |
| Outcome | 0.95 | S5 selected. |
| Scope | 0.90 | First S5 lane is narrow read-only. |
| Constraints | 0.95 | No identity/hash-chain/profile/fingerprint expansion in first S5 PRD. |
| Success criteria | 0.85 | Success is a planning PRD/test-spec for read-side bundle export with explicit deferrals. |
| Context | 0.95 | Brownfield evidence comes from V03 acceptance report and expected-absent surfaces. |

## Intent

Record the HITL successor selection for V03-001 without accidentally authorizing broader v0.3 memo proposals.

## Desired Outcome

Open or record the next successor as **S5: read-side context-bundle lane**, constrained to **narrow read-only** planning.

## In-Scope

- S5 successor framing.
- A future PRD/test-spec for read-side context-bundle export.
- Planning around `src/views/bundle.ts` as the likely future surface.
- Existing IDs and existing projections only.
- Explicit consumer/context-bundle acceptance criteria in the future PRD.

## Out-of-Scope / Non-goals

- No profile registry.
- No `profiles/`.
- No `schemas/profile.schema.json`.
- No identity/hash-chain work.
- No `src/hash.ts` or `src/identity.ts`.
- No deterministic bundle fingerprint in the first S5 PRD.
- No product code in this deep-interview mode.

## Decision Boundaries

OMX may:
- Treat S5 as the selected HITL successor.
- Frame S5 as narrow read-only.
- Recommend a follow-up planning lane for S5 PRD/test-spec.

OMX may not:
- Implement S5 directly from this interview.
- Expand S5 into S3 identity/hash or S4 profiles.
- Add fingerprint scope without a later HITL decision.

## Constraints

- Preserve V03-001 reconciliation boundaries.
- Use `docs/plans/v03-foundation-reconciliation-acceptance-report.md` as the decision source.
- Keep absent V03 surfaces absent until a successor implementation lane is separately authorized.

## Testable acceptance criteria for the next planning lane

A future S5 PRD/test-spec should pass if:

1. It states S5 is HITL-selected and narrow read-only.
2. It names `src/views/bundle.ts` as a candidate future surface but does not implement it during planning.
3. It explicitly defers profile registry, identity/hash-chain, and deterministic fingerprint work.
4. It defines the bundle consumer, input projections, output shape, and verification commands before product code.
5. It preserves pi-chart/pi-agent/pi-sim boundary separation.

## Assumptions exposed + resolutions

- Assumption: S5 could accidentally require S3/S4 prerequisites. Resolution: operator chose narrow read-only, using existing IDs/projections and deferring S3/S4.
- Assumption: fingerprint is part of S5 by default. Resolution: not in first S5 PRD.

## Pressure-pass findings

Round 2 revisited S5 selection and forced a scope boundary. The operator selected `s5-read-only`, reducing ambiguity from 0.22 to 0.12.

## Brownfield evidence vs inference

Evidence:
- V03 acceptance report exists and frames S1-S6.
- V03 absent surfaces remained absent during V03-001 execution.

Inference:
- `src/views/bundle.ts` is the likely future S5 implementation surface because V03 PRD/acceptance report name it as absent and S5-specific.

## Handoff recommendation

Use `$ralplan` or a docs-only solo planning pass to create the S5 PRD/test-spec. Do not use `$ralph`, `$team`, or implementation execution until the S5 planning artifacts exist and are approved.
