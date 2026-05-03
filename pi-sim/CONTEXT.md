# pi-sim Context

`pi-sim` is the hidden patient simulation runtime for the `pi-rn` workspace. It produces coherent synthetic patient encounters, scenario time, physiology/provider output, latent findings, alarms/events, validation evidence, and documented public telemetry for sibling consumers.

## Domain role

- Owns hidden patient-state generation and provider routing.
- Owns scenario time, physiology backends, action timelines, validation, and public telemetry publication.
- Publishes explicit public surfaces consumed by `pi-monitor`, `pi-chart`, and possibly `pi-agent`.
- Keeps Pulse as the current provider/backend implementation, not the architecture center.

## Hard boundaries

- Hidden internals stay hidden from `pi-agent` and from sibling consumers.
- Public telemetry contracts are the only supported sibling integration surface unless a new explicit adapter contract is documented.
- Do not leak latent findings, scenario secrets, scoring keys, future truth, provider internals, Docker/Pulse state, or validation-only evidence into public fixtures or agent-visible surfaces.
- Encounter and assessment files are reveal-only public runtime evidence; findings become public only through documented request/reveal paths.

## Public contract authority

- `pi-sim/vitals/README.md` documents public telemetry files and schemas.
- `pi-sim/vitals/.lanes.json` documents public lane metadata and reset/write semantics.
- `pi-sim/vitals/fixtures/public-contract/**` provides consumer regression examples, not a second ABI authority.

## Core language

- **Hidden patient runtime**: simulator-owned source of patient truth and latent state.
- **Provider**: backend that supplies physiology or scripted patient data.
- **Public telemetry boundary**: documented JSON/JSONL files under `vitals/` exposed to consumers.
- **Reveal-only assessment**: clinical findings become public only after allowed assessment request/reveal flow.
- **Scripted provider**: deterministic development/reference path, not high-fidelity physiology truth.
- **Pulse provider**: current legacy physiology backend/shim path.

## ADR authority

Read `pi-sim/docs/adr/` before changing runtime topology, provider architecture, validation/recovery behavior, planning/public-contract authority, or any public telemetry semantics.

## Consumer relationship

- `pi-monitor` is display-only and reads public telemetry.
- `pi-chart` owns chart/EHR truth and may ingest public telemetry through explicit adapters.
- `pi-agent` must only see explicitly exposed clinical/public surfaces and must not depend on hidden internals.
