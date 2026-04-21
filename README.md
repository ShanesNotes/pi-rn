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
