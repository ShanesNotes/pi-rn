# PRD — patient_002 v4 chart/sim split

## Problem
`patient_002_chart_v4.zip` is a rich ICU synthetic chart package with chart-visible, latent, live-expected, and hidden-truth layers. It is valuable for `pi-chart`, but it is not drop-in compatible with current schemas and contains simulator/evaluator-only material that must not leak into chart-visible context.

## Goals
1. Promote the chart-visible portion into `pi-chart/patients/patient_002` as the canonical richer patient_002 fixture.
2. Normalize events, notes, vitals, constraints, metadata, and derived outputs to current pi-chart schemas/validator expectations.
3. Preserve demo start boundary: startup chart contains only initial backend material as of `2026-04-19T06:45:00-05:00`.
4. Keep hidden physiology/vitals-driver truth in pi-sim or a clearly excluded non-visible fixture path.
5. Add regression evidence that ordinary pi-chart read/view paths do not traverse hidden/evaluation layers.
6. Document the split and residual risks.

## Non-goals
- Do not broaden schemas just to accept the draft vocabulary.
- Do not expose pi-sim hidden truth to pi-agent/chart loaders.
- Do not build a full live simulator runtime in pi-chart.

## Acceptance criteria
- `npm run validate` passes for pi-chart.
- `npm run test` and `npm run typecheck` pass after changes.
- patient_002 has valid `chart.yaml` subject identity.
- All imported visible events use canonical event `status`, `certainty`, and source kinds or documented registry-compatible mappings.
- Notes satisfy current note schema/frontmatter/id/link requirements.
- Vitals satisfy current vitals schema and validator warnings relevant to row identity/timestamps.
- Constraints and encounter intervals are current-shape valid.
- Hidden truth and future expected/reference content are excluded from ordinary visible read/view APIs by regression tests or by not co-locating them under loader paths.
- pi-sim hidden physiology/vitals-driver material has an explicit fixture/handoff location.

## Delivery shape
Small, reversible import/normalization commit-ready diff with plan artifacts, docs/handoff as needed, and fresh verification evidence.
