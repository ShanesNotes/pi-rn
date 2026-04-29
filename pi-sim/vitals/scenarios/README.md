# scenarios/

Canonical clinical arcs the engine can replay. Each is a self-contained scenario file matching the schema in `vitals/README.md`, plus a `checkpoints` array used by `scripts/validate.ts` to assert the engine's trajectory stays within physiologically expected ranges.

## Seeded

| File | What it is | Run |
|---|---|---|
| `pulse_stable_observation.json` | Low-acuity stable observation Pulse provider smoke; scalar vitals only, no shock/sepsis/pressors/code story | `npm run sim:run:pulse:stable` |
| `hemorrhagic_shock.json` | Class-II → Class-III hemorrhage with two crystalloid boluses | `npm run monitor:shock` |
| `sepsis_norepi.json`     | Septic shock with norepinephrine started at t≈8 min     | `npm run monitor:sepsis` |
| `scripted_m1_demo.json` | Scripted scalar demo with public encounter context and one scheduled reveal-only respiratory assessment request | `npm run sim:run:demo` |
| `patient_002_septic_shock_recovery.scripted.json` | Scripted hidden physiology/vitals-driver fixture derived from `patient_002_chart_v4.zip`; pi-sim-owned, not chart-visible truth | `npm run sim:run -- --scenario vitals/scenarios/patient_002_septic_shock_recovery.scripted.json --duration 120 --dt 30 --no-pacing` |

`pulse_stable_observation.json` is the M2/M3 provider-runtime smoke target. It proves scalar Pulse telemetry plus public event/waveform availability files; it does not prove live Pulse waveform samples. The acute scenarios remain compatibility/reference assets for the legacy Pulse monitor and validation lanes; do not use them as the primary provider-boundary proof.

## Authoring a new scenario

1. Copy one of the seeds.
2. Adjust `patient.baseline` to the patient profile.
3. Compose `conditions` + `interventions` along the wall-clock you want.
4. Add `checkpoints` at clinically meaningful inflection points. Ranges should be wide enough to absorb engine noise but narrow enough to fail if the physics regresses (rule of thumb: ±15% of expected target).
5. For scripted provider-runtime assessment fixtures, add public `encounter` metadata plus `timeline` entries with `assessment_request` actions. Keep latent assessment fixture data in provider-owned internals, not in public `vitals/scenarios/*.json`; public findings must be absent until the request runs.
6. Run `npm run validate -- vitals/scenarios/<your>.json` for Pulse scenarios or `npm run sim:run -- --scenario vitals/scenarios/<your>.json --no-pacing` for scripted runtime scenarios.

## Checkpoint format

```json
{ "t": 400, "expect": { "hr": [95, 130], "bp_sys": [85, 115] } }
```

`t` is sim seconds from scenario start. `expect[v] = [low, high]` — the value at that checkpoint must fall inside the closed interval. Omit any vital you don't want to assert.

## Conventions

- Times in seconds, vitals in clinical units (bpm, mmHg, /min, %, °C).
- Severity in `[0, ~1]` — 0.5 is moderate, 0.8 is decompensated.
- Use lower `noise_sd` (≈0.5×) for validation scenarios so checkpoints aren't flaky; raise it for monitor playback to feel realistic.
- Do not add production synthetic waveforms to scenarios. Fixture/demo waveform windows belong in explicitly labeled test/demo providers and must not masquerade as clinical truth.
- Do not put scoring rubrics, expected RN charting ids, reference completed-chart ids, or future findings in public encounter fields. Assessment fixtures may hold latent findings, but public output is reveal-only and allowlisted.
