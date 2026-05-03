# Create pi-monitor public-lane ingest depth PRD

Status: needs-triage
Type: AFK

## Parent

`.scratch/architecture-deepening-placement/PRD.md`

## What to build

Create `.scratch/pi-monitor-public-lane-ingest-depth/PRD.md` and initial issue slices for deepening the `pi-monitor` public-lane ingest Module behind existing display-only authority.

The PRD should treat `pi-monitor/docs/adr/003-public-lane-consumer-authority.md` as a constraint, not as a work queue. It should improve Implementation Locality behind the accepted public-lane consumer decision without reopening chart truth ownership.

## Acceptance criteria

- [ ] `.scratch/pi-monitor-public-lane-ingest-depth/PRD.md` exists and states that `pi-monitor` remains a display-only consumer of `pi-sim` public lanes.
- [ ] The PRD inventories ingest responsibilities across `pulse-public-frame`, `monitor-ingest`, `monitor-core`, and CLI/app call sites without changing source files.
- [ ] Initial issues cover source-dir fixture tests, boundary scans, durable public-lane ingest, transport Adapters (`current.json`, source-dir, JSONL tail, private TCP), stable monitor-core display Interface, and verification.
- [ ] The PRD explicitly rejects monitor writes to chart truth or hidden `pi-sim` internals.
- [ ] The PRD names future verification commands: `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`, and `cargo build --workspace` after monitor edits.

## Blocked by

- Maintainer triage of `.scratch/architecture-deepening-placement/PRD.md`.

## Comments

- 2026-05-03: Seeded from `.omx/plans/ralplan-architecture-deepening-artifact-placement.md`. ADR trigger: create `pi-monitor/docs/adr/004-public-lane-ingest-module-depth.md` only if crate Interfaces change or a new durable ingest Seam becomes externally meaningful to future monitor replacements.
