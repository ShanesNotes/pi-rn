# scenarios/

Canonical clinical arcs the engine can replay. Each is a self-contained scenario file matching the schema in `vitals/README.md`, plus a `checkpoints` array used by `scripts/validate.ts` to assert the engine's trajectory stays within physiologically expected ranges.

## Seeded

| File | What it is | Run |
|---|---|---|
| `hemorrhagic_shock.json` | Class-II → Class-III hemorrhage with two crystalloid boluses | `npm run monitor:shock` |
| `sepsis_norepi.json`     | Septic shock with norepinephrine started at t≈8 min     | `npm run monitor:sepsis` |

## Authoring a new scenario

1. Copy one of the seeds.
2. Adjust `patient.baseline` to the patient profile.
3. Compose `conditions` + `interventions` along the wall-clock you want.
4. Add `checkpoints` at clinically meaningful inflection points. Ranges should be wide enough to absorb engine noise but narrow enough to fail if the physics regresses (rule of thumb: ±15% of expected target).
5. Run `npm run validate -- vitals/scenarios/<your>.json` and tighten ranges as the engine matures.

## Checkpoint format

```json
{ "t": 400, "expect": { "hr": [95, 130], "bp_sys": [85, 115] } }
```

`t` is sim seconds from scenario start. `expect[v] = [low, high]` — the value at that checkpoint must fall inside the closed interval. Omit any vital you don't want to assert.

## Conventions

- Times in seconds, vitals in clinical units (bpm, mmHg, /min, %, °C).
- Severity in `[0, ~1]` — 0.5 is moderate, 0.8 is decompensated.
- Use lower `noise_sd` (≈0.5×) for validation scenarios so checkpoints aren't flaky; raise it for monitor playback to feel realistic.
