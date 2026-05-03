# Clarify durable public-lane ingest seams

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`

## What to build

Document and test the public source-directory ingest seam inside `monitor-ingest`: latest-frame, manifest, run status, append JSONL lanes, optional encounter/assessment lanes, and waveform availability/current windows.

The seam must align to producer authority in `pi-sim/vitals/README.md` and `.lanes.json` while keeping `pi-monitor` display-only.

## Acceptance criteria

- [ ] Lane read semantics are explicit for required `current.json`, optional latest-state lanes, append JSONL lanes, optional current lanes that clear when unavailable, and compatibility `timeline.json`.
- [ ] Missing optional lanes create display-safe warnings or absent context, not hidden fallback reads.
- [ ] `timeline.jsonl` and `events.jsonl` are handled as append-friendly display inputs with run-reset semantics from `.lanes.json`.
- [ ] Encounter and assessment lanes remain public display context; they do not create chart truth or hidden patient state.
- [ ] Waveform lanes respect public availability/source/fidelity/synthetic labels and never silently synthesize clinical waveforms.

## Blocked by

Maintainer triage of `.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`.

## Closeout commands

```bash
cd pi-monitor
cargo test -p monitor-ingest
cargo test -p pulse-public-frame
cargo clippy --workspace --all-targets -- -D warnings
```

## Comments

- 2026-05-03: Seeded by team planning pass from `.scratch/architecture-deepening-placement/`.
