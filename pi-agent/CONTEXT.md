# pi-agent Context

`pi-agent` is the clinician-agent workspace inside the `pi-rn` umbrella. It is intended to become a bounded/containerized agent environment that sees only its mounted context and explicitly exposed clinical interfaces.

## Domain role

- Represents the agent-facing workspace, not the hidden simulator.
- Keeps Pi customization in `.pi/` and project instructions in `pi-agent/AGENTS.md`.
- Uses `chart/` as a barebones clinical charting surface while the broader chart/EHR substrate lives in sibling `pi-chart/`.

## Hard boundaries

- Do **not** couple `pi-agent` directly to `pi-sim` source code.
- Do **not** import, inspect, or depend on hidden simulator internals such as `pi-sim/scripts/`, `pi-sim/pulse/`, provider state, scenario secrets, latent findings, or validation internals when acting as the clinical agent.
- Consume only explicit public/clinical surfaces exposed by the harness, such as documented telemetry contracts, chart APIs, or files intentionally mounted into the agent environment.
- Keep future Docker/container assumptions explicit: if the agent would not see a file in the bounded runtime, do not design agent behavior around that file.

## Public surfaces it may depend on

- Chart/EHR surfaces explicitly exposed from `pi-chart/`.
- Public telemetry contracts documented by producers, especially `pi-sim/vitals/README.md`, when those surfaces are intentionally exposed to the agent.
- Root issue workflow docs under `docs/agents/` for local markdown issues and triage state.

## ADR guidance

`pi-agent` currently has no ADR directory. Create `pi-agent/docs/adr/` only when there is a durable agent-specific decision to record, especially around container boundaries, exposed interfaces, prompt/runtime policy, or agent clinical workflow.

## Vocabulary

- **Bounded agent runtime**: the eventual containerized agent environment with restricted mounted context.
- **Explicit exposed interface**: a documented surface intentionally made visible to the agent.
- **Hidden simulator internals**: any non-public `pi-sim` implementation detail or latent truth not exposed through an approved clinical/public surface.
