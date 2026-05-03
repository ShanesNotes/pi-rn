# V0.5 clinical truth guardrails

Status: active workstream standard for `.scratch/pi-ledger-claim-ledger-kernel/`.

## Purpose

These are V0.5 substrate development standards for the clean-canvas claim-ledger kernel. They are not broad "invariants" mined from prototype code. They are domain-level rules that protect chart truth and must be re-justified when applied to an implementation slice.

## Phase 1 allowed guardrails

A Phase 1 slice may preserve these guardrails without deep prototype mining:

- **Append-only clinical truth** — old records are not mutated to change the clinical past.
- **Correction by new claim** — corrections point to prior `(id, hash)` targets and do not erase the target claim.
- **Provenance on every claim** — every claim carries who/what made or accepted it and when.
- **Patient isolation** — no cross-patient reads, writes, links, or fixture leakage.
- **Explicit valid time and known time** — clinical time and accepted/known time are distinct.
- **Disposable derived views** — current state and summaries are recalculable views, not chart truth.
- **No hidden simulator/oracle truth** — hidden `pi-sim` internals are never chart evidence; observable monitor vitals may become chart truth only through an **Observable charting seam**.

## Not guardrails

These are prototype details or implementation choices, not Phase 1 guardrails:

- Current `EventEnvelope` shape.
- Current filesystem, NDJSON, or Markdown layout.
- Current `patients/` directory structure.
- `patient_001` or `patient_002` fixture assumptions.
- Generated Agent Canvas / cockpit UI assumptions.
- Current test helper structure.
- Package-internal ADR status, issue status, or implementation checklist labels.
- FHIR resource shape, FHIR server/search assumptions, or FHIR IDs as internal chart identity.
- Hardcoded Orders, MAR, Labs, Nursing Assessment, Handoff, or ContextPacket modules inside the Phase 1 kernel.
- Mutable `reviewStatus`, `attestedBy`, special contradiction/resolution fields, transform graphs, or review/attestation subsystems in the Phase 1 kernel.
- `agentAppendClaim`, orchestrator-authored accepted clinical claims, raw chart filesystem mutation, or runtime transcript/session as patient memory.

## Slice checklist

Each implementation issue should answer:

1. Which guardrail does this slice protect?
2. Which source justifies it (`CONTEXT.md`, accepted ADR, or workstream PRD/test-spec)?
3. What prototype detail is intentionally not imported?
4. What test proves the guardrail without depending on old prototype structure?

## Coding readiness gate

A kernel issue is not `ready-for-agent` until it includes a filled **Guardrail application** section:

```md
## Guardrail application

- Protects: <clinical truth guardrail protected by this slice>
- Source: <CONTEXT.md, ADR 019, workstream PRD/test-spec row, or accepted ADR>
- Not imported: <prototype detail intentionally excluded>
- Test proof: <failing test name or behavior that proves the guardrail>
```

Do not mark an issue ready based only on package-research detail or existing prototype behavior.
