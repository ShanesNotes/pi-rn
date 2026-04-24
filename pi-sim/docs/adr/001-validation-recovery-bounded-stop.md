# ADR 001 — Validation Recovery Bounded Stop

Date: 2026-04-22
Status: accepted (bounded stop for validation-recovery lane per
`.omx/plans/pi-sim-next-work-seam-freeze-consensus-draft.md` §Phase 2).
Decision maker: user (seam-freeze consensus).

## Context

The validation-recovery lane (Phases 0–2 of the consensus draft) aimed to
restore `npm run validate` to green on the current Pulse 4.3.1 runtime, or
declare a bounded stop if green status could not be reached without a larger
redesign.

Phases 0 and 1 produced the following classifications (see
`.omx/evidence/validation-recovery-20260422-phase0.md` and
`.omx/evidence/validation-recovery-20260422-phase1.md`):

- **Hemorrhagic (Phase 1B):** runtime/tooling drift — shim's hemorrhage action
  payload included a `Type: Internal` field not present in canonical Pulse 4.3.1
  scenarios, which silently nullified VenaCava severity.
- **Sepsis (Phase 1A):** runtime/tooling drift — bake scenario in
  `pulse/shim/bake_states.py` lacked an `AdvanceTime` block, so Pulse's Conditions
  mechanism did not stabilize into the septic steady state before serialization.

## Decision

Land the two minimal runtime fixes identified in Phase 1 and **stop** this
recovery lane short of a green `npm run validate`. Validate remains red, but for
reasons that are now outside the runtime/tooling scope of this lane.

### Fixes landed (Phase 2 code changes)

1. `pulse/shim/app.py:_action_to_driver` — removed `Type` field from both
   `hemorrhage` and `hemorrhage_stop` payloads. Matches canonical Pulse 4.3.1
   hemorrhage scenarios under
   `/source/data/human/adult/scenarios/patient/Hemorrhage*.json`.
2. `pulse/shim/bake_states.py` — added `AdvanceTime` of 2 minutes (canonical
   `Sepsis.json` pattern) before `SerializeState` so the engine stabilizes the
   sepsis condition before persistence.

### Evidence the fixes are correct in isolation

- Canonical Pulse `HemorrhageClass2NoFluid.json` and `HemorrhageSeverity1.json`
  omit the `Type` field.
- End-to-end shim test after fix: `/init` → `/action hemorrhage severity=0.15
  VenaCava` → four `/advance` calls totaling 300s produce realistic hypovolemic
  shock progression (HR 72→126, MAP 95→42, BP 114→47). Matches clinical textbook
  hemorrhage response.
- Canonical Pulse `Sepsis.json` uses the same `AdvanceTime` + `SerializeState`
  pattern now in `bake_states.py`.

## Residual reasons validate remains red

These are **not** runtime/tooling defects and are out of scope for this lane:

### 1. Hemorrhagic scenario severity values over-spec'd

`vitals/scenarios/hemorrhagic_shock.json` uses `severity: 0.50` on VenaCava at
t=60, escalating to `severity: 0.75` at t=240. With the shim now delivering the
action faithfully, severity 0.5 on VenaCava produces ~24 mL/s (1440 mL/min)
hemorrhage. At that rate, the Pulse engine reaches `IrreversibleState` with a
FATAL "negative volume" error before t=240, so the scenario's later checkpoints
are unreachable.

For reference, Pulse's own `HemorrhageClass2NoFluid.json` uses 50 mL/min on
VenaCava — roughly 1/30th the rate the current scenario implies.

A scenario retune (either reduce severity values, switch compartment to
`RightLeg`, or convert to explicit `rate_ml_min` values matching Pulse's
published class-2/3/4 rates) is required before the regression validate can be
green again.

### 2. Sepsis condition takes longer than 2 min to manifest

Even Pulse's canonical `Sepsis.json` (severity 0.5, 2 min AdvanceTime) produces
near-baseline vitals at the end of the run (HR 72.0, MAP 95.3, temp 37.07).
Pulse's Sepsis condition progresses over a longer simulated timeline than the
bake's 2 min stabilization window.

Meanwhile, `vitals/scenarios/sepsis_norepi.json` checkpoints expect the patient
to present as fully septic at t=30 (HR 95-130, MAP 55-75, temp 37.8-39.2).
No realistic bake-stabilization duration within Pulse's current model will make
the loaded state meet those bands at t=30.

Either the bake must run significantly longer (hours of sim time, cost unclear),
or the scenario timeline must shift checkpoints to later sim times (e.g., first
checkpoint at t=1800s = 30 min of scenario run), or the expected bands at early
checkpoints must be loosened toward baseline.

## Consequences

- The shim and bake scripts now correctly implement the canonical Pulse payload
  shapes. Future runtime drift is easier to detect because the payload matches
  the Pulse reference surface.
- `npm run validate` remains red on both scenarios, with the remaining failures
  localized to scenario tuning rather than runtime defects.
- The handoff gate for Monitor-UI Phase 4 (per consensus draft §Phase 3) is
  satisfied by this bounded-stop artifact, as allowed by the draft's Phase 2
  exit gate.

## Follow-ups (deferred, not part of this lane)

1. **Hemorrhagic scenario retune.** Either reduce severity, switch to RightLeg
   compartment, or convert to explicit FlowRate values. Cross-check against
   Pulse's class-2/3/4 demo scenarios. Update checkpoint bands if the new
   physiology trajectory shifts expected ranges.
2. **Sepsis scenario + bake retune.** Decide between extending bake duration,
   shifting scenario checkpoints later, or loosening early-checkpoint expected
   bands. May require a dedicated small research pass on Pulse Sepsis model
   progression timescales.
3. **Validation-curve library fill-in.** Currently conditional in the consensus
   draft §Phase 4. With the scenario-tuning work above pending, the curves will
   need to match whatever retuned scenario trajectory is agreed. Keep deferred
   until scenarios are retuned.

## Handoff

With this ADR accepted, the Phase 3 hard handoff gate for Monitor-UI Phase 4 is
satisfied:

1. Runtime preflight satisfied — Phase 0 evidence artifact landed.
2. Sepsis reproducibility — bake path fixed; remaining failure is scenario/model
   timescale, documented above as bounded environmental constraint.
3. Hemorrhagic failure classified with fresh current-format evidence — landed in
   `validation-recovery-20260422-phase1.md`.
4. Monitor-UI control docs carry truthful baseline refresh — Phase 0 banners
   landed.
5. Phase 2 ended with an explicit ADR/bounded-stop artifact (this file).

Monitor-UI Phase 4 is unblocked.
