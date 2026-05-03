# Document Matt Pocock + OMX interoperability

Status: ready-for-agent

## Problem
The repo uses Matt Pocock engineering skills and OMX runtime/orchestration skills together. Without a routing rule, agents may confuse durable `.scratch` project artifacts with `.omx` runtime artifacts, or confuse Matt `$tdd` with OMX testing shortcuts.

## Resolution
Document package ownership and invocation precedence:

- OMX owns runtime orchestration and stateful loops.
- Matt skills own issue/PRD/triage/TDD/domain-doc project workflows.
- `.scratch` is the durable shared work plane.
- `.omx` is runtime/session state unless an outcome is mirrored back to `.scratch`.

## Verification
Read `docs/agents/skill-interoperability.md` and confirm it covers:

- ownership matrix
- invocation rules
- `tdd` overlap
- `caveman` one-real-directory rule
- discovery hygiene
