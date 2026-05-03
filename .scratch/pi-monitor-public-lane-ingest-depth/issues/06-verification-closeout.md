# Close out public-lane ingest depth verification

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-monitor-public-lane-ingest-depth/PRD.md`

## What to build

Collect final verification evidence after implementation slices for the public-lane ingest depth lane land. This issue should be the release/readiness checkpoint before maintainers consider ADR promotion or downstream monitor replacement guidance.

## Acceptance criteria

- [ ] Full monitor formatting check passes.
- [ ] Full monitor lint passes with warnings denied.
- [ ] Full monitor test suite passes.
- [ ] Full monitor build passes.
- [ ] Public consumer boundary check passes with no forbidden imports or write tokens.
- [ ] Evidence names any intentionally deferred gaps, especially private TCP durability, chart-write policy, or producer fixture gaps.
- [ ] No source changes promote `pi-monitor` from display-only consumer to chart/EHR truth authority.

## Blocked by

Implementation and test slices accepted for this PRD.

## Closeout commands

```bash
cd pi-monitor
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --workspace
python3 ../.scratch/pi-sim-public-telemetry-contract-lock/checks/verify-pi-monitor-public-consumer.py
```
