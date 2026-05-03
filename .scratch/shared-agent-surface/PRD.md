# PRD: Shared Agent Work Surface

Status: ready-for-agent

## Goal
Make project work visible across Claude Code, Codex/OMX, Pi, and human review without duplicating skill content or hiding durable decisions in one runtime's state directory.

## Decisions

- Use root `.scratch/` as the durable cross-agent work plane for PRDs, issues, triage state, and handoffs.
- Use `.omx/` for OMX runtime/session artifacts.
- Mirror or summarize project-relevant OMX outcomes into `.scratch/<feature>/` when they should be visible outside OMX.
- Keep shared skill content in `~/.agents/skills/`.
- Use symlinks from Claude/Codex/Pi/project-local surfaces into that canonical skill directory.
- Avoid `pi-rn/.agents` as an active project discovery plane; it can make Codex/OMX list duplicate Matt skills.
- Ignore project-local skill alias directories in git.

## Acceptance criteria

- Claude Code skill links resolve through `~/.claude/skills/*`.
- Codex/Pi project skill links resolve through `pi-rn/skills/*` and `pi-rn/.pi/skills/*`.
- `caveman` has one real content directory and tool-specific aliases.
- Root docs explain `.scratch` versus `.omx` responsibilities.
