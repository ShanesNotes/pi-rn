# patient_002 v4 — live pi-rn simulation package

This v4 package intentionally separates the chart into three runtime layers.

## 1. Initial backend chart

Loaded at demo startup. This is the visible EHR state **as of 2026-04-19T06:45:00-05:00**:

- `patient.md`
- `constraints.md`
- `timeline/` historical records
- `timeline/2026-04-19/` ED course, ICU consult, ED→ICU SBAR, and vitals through arrival
- active `artifacts/index.json` entries only
- `_derived/initial_current_state_2026-04-19T06-45.md`

The initial backend should not contain future RN charting, future MAR administrations,
future nursing assessments, future I&O, future nursing notes, or future handoffs.

## 2. Latent release layer

`simulation/latent_release/` contains documentation that should appear during the demo
as if other hospital systems and staff are charting in real time:

- provider orders and procedure notes
- lab results
- imaging workflow and reports
- pharmacy, ID, nutrition, SLP, PT/OT, case-management documentation
- respiratory-therapy documentation

Use `simulation/latent_release/release_schedule.ndjson` as the default release timeline.
The release engine may delay or suppress notes if prerequisite live nursing facts were
not actually charted.

## 3. Live nurse/agent expected layer

`simulation/live_expected/` contains reference events for RN-owned charting surfaces.
These are **hidden scoring/evaluation targets**, not preloaded chart data:

- MAR administrations and infusion titrations
- nursing assessments and reassessments
- I&O and Foley/device documentation
- glucose checks and protocol actions
- nursing notes, family updates, and handoffs

Use `simulation/live_expected/nursing_task_queue.ndjson` to drive prompts, scoring, or
simulation opportunities. During a live demo, the nurse and pi-agent should generate the
actual events instead of loading these reference events.

## Hidden material

`simulation/hidden_truth/` contains the completed scenario truth and reference physiology
feed. It is for simulator/evaluator use only.
