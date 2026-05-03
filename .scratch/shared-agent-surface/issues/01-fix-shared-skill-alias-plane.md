# Fix shared skill alias plane

Status: ready-for-agent

## Problem
Project-local skill symlinks pointed at `pi-rn/.agents/skills/*`, but `pi-rn/.agents` did not exist. Claude Code's `caveman` link also pointed at `~/.agents/skills/caveman`, which was missing after deduplication.

## Resolution
Use `~/.agents/skills/` as the single real shared skill content plane. Point Claude, Codex, Pi, and project aliases at it.

## Verification
Run symlink resolution checks for:

- `skills/*/SKILL.md`
- `.pi/skills/*/SKILL.md`
- `~/.claude/skills/{matt-skills,caveman}/SKILL.md`
- `~/.codex/skills/caveman/SKILL.md`
