# Fix shared skill alias plane

Status: ready-for-agent

## Parent

`.scratch/shared-agent-surface/PRD.md`

## What to build

Resolve the shared skill alias plane so project-local and tool-specific skill links point at one real shared skill content directory instead of a missing or duplicated project `.agents` surface.

Context:

- Project-local skill symlinks pointed at `pi-rn/.agents/skills/*`, but `pi-rn/.agents` did not exist.
- Claude Code's `caveman` link also pointed at `~/.agents/skills/caveman`, which was missing after deduplication.

## Resolution
Use `~/.agents/skills/` as the single real shared skill content plane. Point Claude, Codex, Pi, and project aliases at it.

## Acceptance criteria

- [ ] `~/.agents/skills/` is the single real shared skill content plane.
- [ ] Claude, Codex, Pi, and project aliases point at that shared content plane.
- [ ] No project `.agents` skill discovery plane is required.
- [ ] Symlink resolution checks pass for:

  - `skills/*/SKILL.md`
  - `.pi/skills/*/SKILL.md`
  - `~/.claude/skills/{matt-skills,caveman}/SKILL.md`
  - `~/.codex/skills/caveman/SKILL.md`

## Blocked by

None - can start immediately.
