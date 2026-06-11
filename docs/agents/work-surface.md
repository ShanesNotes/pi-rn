# Shared Agent Work Surface

This repo is used by multiple coding agents: Codex through OMX, Claude Code, Pi, and direct shell tooling. Use these surfaces consistently so work stays visible across agents and does not turn into doc sprawl.

## Promotion ladder

Use the smallest durable surface that matches the kind of knowledge:

1. **Conversation / runtime context** — temporary exploration and alignment.
2. **`.scratch/<feature>/PRD.md`** — active product/engineering intent produced by `$to-prd` or an equivalent synthesis.
3. **`.scratch/<feature>/issues/<NN>-<slug>.md`** — independently grabbable tracer-bullet slices produced by `$to-issues`.
4. **`<subproject>/docs/adr/NNN-<slug>.md`** — accepted decision/invariant when the choice is hard to reverse, surprising without context, and trade-off driven.
5. **Canonical docs** such as `CONTEXT.md`, `DESIGN.md`, `ARCHITECTURE.md`, or `ROADMAP.md` — current domain language and architecture summaries after ADR/PRD decisions stabilize.

Do not create new root planning scratchpads such as `PLANNING.md` for active work. Put active planning in `.scratch/<feature>/`, then promote only durable decisions into ADRs and canonical docs.

## Durable cross-agent work

### Archived research packages

Use **archived research package** for preserved V0.5 package-bundle inputs. Avoid bare "package" in active planning unless it means an npm/package-manager artifact or is namespaced as a citation label such as `pkg-018:<path>`. Archived research packages are evidence: mine them into `.scratch` PRDs/issues or accepted `docs/adr/` decisions before implementation.


Use root `.scratch/` for durable project work that should be readable by any agent:

- PRDs: `.scratch/<feature-slug>/PRD.md`
- Issues: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- Triage status: `Status:` line using `docs/agents/triage-labels.md`
- Handoffs or summaries that are meant to survive a specific runtime

OMX ultragoal lanes may persist as `HANDOFF.md`, `RUN-STATE.md`, and story docs (for example `G00x-*.md`) instead of `PRD.md`. Durable handoffs should still live under `.scratch/<feature>/`.

This is the shared working plane for Matt Pocock skills and for human review.

## OMX runtime work

Use `.omx/` for OMX-specific runtime artifacts:

- workflow state
- runtime context snapshots
- Ralph/plan/test-spec artifacts
- logs, caches, and session-local coordination

When an OMX artifact becomes project-relevant across tools, mirror or summarize it under `.scratch/<feature-slug>/`. Do not require future agents to mine `.omx/` before ordinary implementation.

## Existing plan docs

Existing `docs/plans/`, `docs/planning/`, `memos/`, and historical `.omx/plans/` files are evidence unless a current `.scratch` PRD or accepted ADR names them as active inputs.

Default policy:

- Keep them in place for provenance.
- Banner misleading or stale files before moving them.
- Archive only after a front door or PRD records where the useful content went.
- Do not grow these directories as active scratchpads when Matt `$to-prd` / `$to-issues` fits the work.

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
