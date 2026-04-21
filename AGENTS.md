# pi-rn

Parent workspace for a bounded clinical-agent harness.

## Subprojects

- `pi-agent/` — Pi-based agent workspace
- `pi-chart/` — chart/EHR subsystem
- `pi-sim/` — hidden patient simulation subsystem

## Boundary intent

The long-term goal is to run `pi-agent/` in a container so it only sees its own mounted context plus explicitly exposed interfaces.

Do not couple `pi-agent/` directly to `pi-sim/` source code.
