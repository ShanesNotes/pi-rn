# ICU fixture conventions — patient_002 v4

This package uses pi-chart event envelopes as the source of truth, but v4 separates
**initial backend chart state** from **latent runtime releases** and **live RN/pi-agent
charting**.

## Runtime layers

1. `timeline/` = visible backend chart at live-demo startup, as of `2026-04-19T06:45:00-05:00`.
2. `simulation/latent_release/` = provider, lab, imaging, RT, pharmacy, consult, and care-coordination events that may be released during the demo.
3. `simulation/live_expected/` = hidden reference RN/pi-agent charting events used for scoring/replay, not preloaded into the chart.
4. `simulation/hidden_truth/` = hidden physiology and complete scenario truth; never exposed to the nurse or agent.

## Event-source rules

- `fulfills` is reserved for `action -> intent` links only.
- `supports` is used for evidence, results, context, and documentation references.
- `addresses` points an action/plan toward a problem, trend, or active clinical issue.
- Point events use `effective_at`; interval events use `effective_period.start/end`.
- Unlike v3, open-ended intervals are allowed in the initial backend **only** when they
  are active at demo start and must be closed by live charting.

## Live-demo note rules

- Notes in the initial backend may cite only events visible by demo start.
- Latent provider/ancillary notes may cite reference live RN event IDs only as a reference transcript. A runtime loader should remap these to actual live event IDs before making the note visible.
- RN-owned future notes are stored under `simulation/live_expected/reference_payload/` and are not part of the startup chart.

## Artifact rules

- `artifacts/index.json` contains only artifacts safe to preload at startup.
- Future/current-admission artifacts live under `simulation/latent_release/artifacts/` until their release event occurs.
- Completed retrospective MAR and flowsheet snapshots live under `simulation/reference_completed_chart/`.

## Validation rule

Run:

```bash
node scripts/validate-chart.mjs
```

Expected: pass with zero failures. Warnings may be used for future implementation reminders.
