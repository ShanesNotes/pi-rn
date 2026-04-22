# pi-rn

Monorepo-style parent workspace for the clinical agent system.

## Layout

```text
pi-agent/   containerized Pi agent workspace
pi-chart/   chart/EHR backend surface
pi-sim/     hidden patient simulation backend
```

## Intent

- `pi-agent/` is the only workspace the agent should see at runtime
- `pi-chart/` is the charting/EHR surface or backend
- `pi-sim/` is the hidden simulator and should stay outside the agent container context

Start simple: build boundaries first, then grow each subsystem deliberately.

## Disclaimer

pi-rn is research and experimental software. It is **not a medical
device**, **not FDA-approved**, **not intended for clinical decision
support**, and **not validated for patient care**. No warranty of
medical accuracy is expressed or implied. Do not use in any clinical
setting where patient outcomes depend on the output of this code.

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](./LICENSE)
for the full text. In short: permissive use/modification/redistribution
with an explicit patent grant and no warranty.
