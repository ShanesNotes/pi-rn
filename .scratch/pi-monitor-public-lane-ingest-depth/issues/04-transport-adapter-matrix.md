# Define transport Adapter matrix for monitor ingest

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`

## What to build

Create a clear Adapter matrix for every monitor input mode: `current.json`, public source directory, JSONL tail, replay fixtures, fixture directories, and private localhost TCP. CLI and native app selectors should remain Adapter selection surfaces, not schema authorities.

## Acceptance criteria

- [ ] Matrix names each Adapter, durability posture, authority posture, supported commands/options, expected display output, and verification path.
- [ ] `current.json` is marked backward-compatible read-latest mode.
- [ ] `--source-dir <vitals-dir>` is marked preferred complete public-lane mode.
- [ ] `tail-jsonl` is marked append-friendly display tailing, not chart replay authority.
- [ ] `live-tcp` is marked private localhost/non-durable display transport, not public ABI and not chart truth.
- [ ] CLI/app reject ambiguous multi-source combinations consistently.

## Blocked by

Maintainer triage of `.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`.

## Closeout commands

```bash
cd pi-monitor
cargo test -p monitor-cli
cargo test -p monitor-app
cargo test --workspace
```
