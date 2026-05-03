# Document Matt Pocock + OMX interoperability

Status: ready-for-agent

## Parent

`.scratch/shared-agent-surface/PRD.md`

## What to build

Document how Matt Pocock engineering skills and OMX runtime/orchestration skills interoperate so agents do not confuse durable `.scratch` project artifacts with `.omx` runtime artifacts or confuse Matt `$tdd` with OMX testing shortcuts.

## Resolution
Document package ownership and invocation precedence:

- OMX owns runtime orchestration and stateful loops.
- Matt skills own issue/PRD/triage/TDD/domain-doc project workflows.
- `.scratch` is the durable shared work plane.
- `.omx` is runtime/session state unless an outcome is mirrored back to `.scratch`.

## Acceptance criteria

- [ ] `docs/agents/skill-interoperability.md` explains the ownership matrix.
- [ ] `docs/agents/skill-interoperability.md` explains invocation rules.
- [ ] `docs/agents/skill-interoperability.md` documents the `tdd` overlap.
- [ ] `docs/agents/skill-interoperability.md` documents the `caveman` one-real-directory rule.
- [ ] `docs/agents/skill-interoperability.md` documents discovery hygiene.

## Blocked by

None - can start immediately.
