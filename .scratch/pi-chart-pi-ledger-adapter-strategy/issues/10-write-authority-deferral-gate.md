# Write-authority deferral gate

Status: needs-triage
Type: AFK

## Parent

`.scratch/pi-chart-pi-ledger-adapter-strategy/PRD.md`

## User stories covered

10, 16, 19, 22, 24, 27

## What to build

Document and test the adapter-era rule that direct agent-accepted writes remain deferred. This slice should make it hard for future agents to smuggle accepted clinical write authority into a read/projection adapter issue.

## Acceptance criteria

- [ ] Adds a deferral note under `.scratch/pi-chart-pi-ledger-adapter-strategy/` explaining that direct agent accepted-writes require later proposal/review policy and are not part of the read/projection adapter path.
- [ ] Names allowed adapter behavior for this phase: read, translate, project, validate, and produce deterministic errors.
- [ ] Names forbidden behavior for this phase: accepted append authority from `pi-agent`, hidden simulator evidence, patient migration, runtime orchestrator write path, and external EHR write-back.
- [ ] Adds a lightweight structural check or documented grep command future agents can run to confirm no write-authority implementation was added by this lane.
- [ ] Does not block future human-designed write policy; it only prevents implicit adoption in this workstream.
- [ ] Does not edit product source unless a later triage explicitly upgrades this from docs-only to executable guard.

## Blocked by

- `.scratch/pi-chart-pi-ledger-adapter-strategy/issues/01-adapter-readiness-gate.md`

## Closeout commands

```bash
git status --short -- .scratch/pi-chart-pi-ledger-adapter-strategy pi-chart pi-ledger pi-agent pi-sim
```
