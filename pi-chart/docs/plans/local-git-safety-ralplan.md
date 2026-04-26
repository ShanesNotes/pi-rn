# RALPLAN - Local Git Safety

Status: approved for local guardrail implementation.

## Problem

Ignored or untracked agent/prototype files can be removed by cleanup commands,
fresh worktrees, or other agents without Git preserving them as deletions. The
intended behavior is different: important local work should be tracked in Git
for durability, while public GitHub pushes should remain deliberate.

## RALPLAN-DR Summary

### Principles

1. Durability first: important local work should be recoverable from Git.
2. Public push prudence: public pushes should require an explicit review step.
3. Separate concerns: `.gitignore` controls untracked noise, not publish policy.
4. Minimal mechanism: prefer local Git configuration and a small hook over a new
   dependency or hosting workflow.

### Decision Drivers

1. `.omx/` is ignored in the root `.gitignore`, so files there are disposable
   unless force-added or copied into a tracked path.
2. A later cleanup commit removed a force-added `.omx` plan artifact as
   off-scope, proving that ignored runtime paths are a poor durable handoff
   location.
3. The only configured remote is the public GitHub `origin`, so accidental
   default pushes need a local guard.

### Options

| Option | Approach | Pros | Cons | Verdict |
|---|---|---|---|---|
| A | Keep local artifacts untracked or ignored. | Keeps public diffs small. | Files remain vulnerable to cleanup. | Rejected. |
| B | Track important local artifacts and block public pushes by default. | Durable locally; public push stays explicit. | Requires local hook/config. | Chosen. |
| C | Track everything including all runtime state. | Maximum recoverability. | Noisy, risky, and hard to review. | Rejected. |

## Decision

Track important restored work in local commits, and install a tracked
`pi-chart/.githooks/pre-push` hook that blocks pushes to GitHub unless
`ALLOW_PUBLIC_PUSH=1` is set for that command.

## Consequences

- Local work can be committed normally and recovered with Git.
- `git push` to the public GitHub remote fails by default in this working copy.
- Public pushes remain possible, but require an explicit command and review.
- Runtime-heavy paths such as `.omx/logs` and `.omx/state` should not be used as
  the only durable handoff location; promote durable plans to tracked docs or
  force-add intentionally.

## Verification

- `git config --local core.hooksPath pi-chart/.githooks`
- `git config --local push.default nothing`
- Run the hook manually against the GitHub remote and confirm it blocks without
  `ALLOW_PUBLIC_PUSH=1`.
