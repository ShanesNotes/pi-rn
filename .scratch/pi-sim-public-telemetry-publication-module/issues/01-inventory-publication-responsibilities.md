# Inventory public telemetry publication responsibilities

Status: ready-for-agent
Type: AFK

## Parent

`.scratch/pi-sim-public-telemetry-publication-module/PRD.md`

## What to build

Create a concise responsibility inventory for the current public telemetry publication path before proposing any internal Module seam.

## Acceptance criteria

- [ ] Inventory covers `pi-sim/scripts/runtime/provider.ts`, `runner.ts`, `publisher.ts`, `pi-sim/vitals/README.md`, `pi-sim/vitals/.lanes.json`, `pi-sim/scripts/runtime/test.ts`, and `pi-sim/scripts/public-contract-reader-test.ts`.
- [ ] Inventory distinguishes hidden patient runtime Implementation from public telemetry publication output.
- [ ] Inventory names `pi-sim/vitals/README.md` and `.lanes.json` as producer-side public Interface authority.
- [ ] Inventory records canonical simulation clock ownership in `pi-sim` and forbids sibling consumers from rewriting public simulation time.
- [ ] Inventory flags hidden inputs that must never become public consumer dependencies: provider internals, scenario secrets, validation evidence, latent findings, future schedules, scoring keys, and Pulse internals.

## Blocked by

None - can start after maintainer triage of the PRD.

## Comments

- 2026-05-03: Seeded as planning work only. Do not edit runtime source in this issue unless the PRD is re-triaged for implementation.
