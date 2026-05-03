# Shared Agent Work Surface

This repo is used by multiple coding agents: Codex through OMX, Claude Code, Pi, and direct shell tooling. Use these surfaces consistently so work stays visible across agents.

## Durable cross-agent work

Use root `.scratch/` for durable project work that should be readable by any agent:

- PRDs: `.scratch/<feature-slug>/PRD.md`
- Issues: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- Triage status: `Status:` line using `docs/agents/triage-labels.md`
- Handoffs or summaries that are meant to survive a specific runtime

This is the shared working plane for Matt Pocock skills and for human review.

## OMX runtime work

Use `.omx/` for OMX-specific runtime artifacts:

- workflow state
- runtime context snapshots
- Ralph/plan/test-spec artifacts
- logs, caches, and session-local coordination

When an OMX artifact becomes project-relevant across tools, mirror or summarize it under `.scratch/<feature-slug>/`.

## Skill installation plane

Shared cross-agent skills live in one real content directory:

```text
~/.agents/skills/          # canonical shared skill content
~/.claude/skills/*         # symlinks into ~/.agents/skills
~/.codex/skills/caveman    # symlink into ~/.agents/skills/caveman
pi-rn/skills/*             # project aliases into ~/.agents/skills
pi-rn/.pi/skills/*         # Pi aliases into ~/.agents/skills
```

Project-local alias directories are machine-specific and ignored by git. Avoid a project `.agents` symlink because Codex/OMX may also scan it as a second skill discovery plane. Do not commit skill symlink layouts unless this repo intentionally switches to vendored project-local skill copies.

## Workflow interoperability

Use `docs/agents/skill-interoperability.md` for routing between Matt Pocock engineering skills and OMX runtime/orchestration skills.
