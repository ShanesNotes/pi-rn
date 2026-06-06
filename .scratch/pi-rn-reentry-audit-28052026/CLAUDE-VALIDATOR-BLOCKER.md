# Claude validator blocker (historical)

Date: 2026-05-31

## Requirement

`grill-with-docs --auto` requires a Claude Code CLI validator with xhigh effort. The preferred path is a persistent Claude CLI session in tmux; the direct one-shot Claude CLI path is the fallback.

## Attempts from this Codex native surface

- `tmux -V` works (`tmux 3.4`).
- Existing/default tmux socket is inaccessible: `error connecting to /tmp/tmux-1000/default (Operation not permitted)`.
- New isolated tmux sockets also fail before a server can be created:
  - `/tmp/pi-rn-codex-tmux`
  - `/tmp/pi-rn-codex-tmux-tty`
  - `/home/ark/pi-rn/.tmux-grilldocs.sock`
- Verbose tmux log shows client fails at socket connect with `Operation not permitted`.
- Claude auth is present: `claude auth status` reports logged in through `claude.ai`, first-party provider, Max subscription.
- Direct OAuth-backed Claude calls fail:
  - prior attempts: `FailedToOpenSocket`, then `ConnectionRefused`
  - bounded debug probe: timed out after 20 seconds with no output
  - later completed probe: `API Error: Unable to connect to API (ConnectionRefused)`
- `claude --bare` returns immediately but says `Not logged in`, because bare mode intentionally ignores OAuth/keychain auth and requires `ANTHROPIC_API_KEY` or an apiKeyHelper. No `ANTHROPIC_API_KEY` is available in this environment.

## Interpretation

The blocker is environmental/tooling, not a repo decision problem:

- The current Codex native-hook surface cannot create or connect to tmux Unix sockets.
- The current Claude CLI OAuth path cannot connect to the Claude API/socket from this surface.
- The bare Claude path is not authenticated.

## Impact

No `grill-with-docs --auto` decisions could be accepted honestly from this surface because the required Claude validator contract could not be satisfied. This originally blocked:

- G002: field-spec decision resolution.
- G003: truth-service decision resolution.

That blocker is now historical. The user explicitly pivoted to human `grill-with-docs`; D001-D012 in `GRILL-WITH-DOCS-HUMAN-DECISIONS.md` supersede the failed auto-validator path, and the durable ultragoal ledger checkpoints G002/G003 complete against that human-grill evidence.
