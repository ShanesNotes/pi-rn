# Skill Interoperability: Matt Pocock Skills + OMX Runtime

This repo uses two complementary skill packages.

## Ownership model

| Work shape | Primary surface | Durable state |
| --- | --- | --- |
| Long-running execution, persistence, mode state, parallel teams | OMX skills (`$ralph`, `$team`, `$ultrawork`, `$ultraqa`, `$autopilot`) | `.omx/` while running; summarize durable outcomes to `.scratch/` |
| Requirements-to-work breakdown | Matt Pocock skills (`$to-prd`, `$to-issues`) | `.scratch/<feature>/` |
| Issue state machine and readiness | Matt Pocock `$triage` | `Status:` in `.scratch/<feature>/issues/*.md` |
| Test-first implementation discipline | Matt Pocock `$tdd` | Tests plus `.scratch` issue/PRD context |
| Debugging discipline | Matt Pocock `$diagnose` for loop shape; OMX `debugger` subagent for delegated root-cause lanes | Evidence in `.scratch`; runtime traces in `.omx` if an OMX mode is active |
| Architecture/domain-language cleanup | Matt Pocock `$improve-codebase-architecture`, `$grill-with-docs` | `CONTEXT.md`, `docs/adr/`, `.scratch` |
| OMX-specific review/cleanup | OMX `$code-review`, `$security-review`, `$ai-slop-cleaner` | Verification evidence in final report; durable follow-ups in `.scratch` |

## Invocation rules

- Use explicit `$name` when you want a specific workflow.
- Use OMX runtime names for orchestration: `$ralph`, `$ralplan`, `$team`, `$ultrawork`, `$ultraqa`, `$autopilot`, `$cancel`.
- Use Matt names for engineering workflow: `$to-prd`, `$to-issues`, `$triage`, `$diagnose`, `$tdd`, `$grill-with-docs`, `$improve-codebase-architecture`, `$zoom-out`.
- If a task uses both, let OMX own the runtime loop and let Matt docs/skills own project artifacts in `.scratch`.

Example:

```text
$ralph implement the issues in .scratch/chart-ingest/issues using Matt $tdd discipline
```

Expected behavior:

1. OMX owns persistence, verification, state, and subagent orchestration.
2. Matt-style issue/PRD/test context stays under `.scratch`.
3. Final durable handoff summarizes `.omx` runtime outcomes back to `.scratch` when needed.

## Known naming overlaps

### `tdd`

OMX advertises `tdd` as a shortcut/alias to testing support, while Matt Pocock provides a full `$tdd` skill. In this repo, prefer Matt `$tdd` for test-first development. Use OMX `test-engineer` as a subagent role when you need parallel test strategy or verification.

### `caveman`

`caveman` has one real content directory at `~/.agents/skills/caveman`. Tool-specific discovery paths may symlink to it. Do not create copied `caveman` skill directories.

## Discovery hygiene

- Keep shared Matt skill content in `~/.agents/skills/`.
- Keep OMX runtime skills in `~/.codex/skills/`.
- Do not create a project `.agents` symlink; Codex/OMX may scan it as an extra discovery plane.
- Project aliases `skills/*` and `.pi/skills/*` may point directly to `~/.agents/skills/*` for tools that expect project-local skill paths.
