# PRD — Agent Canvas Ralph fixes before Pass 5

## Goal
Harden the Agent Canvas reusable read-side context and mock connector so Pass 5 can spike a `.pi` extension without inheriting demo-patient coupling or unsafe MAR-state assumptions.

## Scope
- Remove demo-specific due-time/detail assumptions from `buildAgentCanvasContext`.
- Prevent cross-encounter latest vital/open-loop leakage for opened chart contexts.
- Isolate reusable view catalog from patient_002 demo fixtures.
- Make connector MAR blocking derive from the context bundle and tolerate inconsistent caller state safely.
- Make artifact freshness persist per artifact in the generated prototype session.
- Add regression tests for the above.

## Non-goals
- No production `.pi` extension implementation.
- No UI redesign.
- No new dependencies.
- No changes to unrelated validation/planning workstream files.

## Acceptance criteria
- Agent Canvas context works for patient_002 and patient_001 without patient_002 due/detail leakage.
- Latest vitals and selected loops are scoped to the requested encounter when an encounter is supplied.
- Pass 5 import allowlist can use neutral view catalog/context/connector/types without importing demo patient fixtures.
- Blocked MAR administration returns only advisory response even when request marState is inconsistent.
- Vitals-backed artifacts reopened after a vitals-shift event remain stale.
- Verification commands pass: targeted Agent Canvas tests, prototype smoke, typecheck, full test suite, check, pi-sim grep guard.
