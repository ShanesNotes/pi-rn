# PRD — ADR 015 Phase 2 ADR 010 validator rules

## Goal

Land the Phase 2 ADR 010 validator rules in one bounded validator-only change:

- `V-EVIDENCE-01` warning for bare-string supports on agent-authored inferred
  assessments
- `V-EVIDENCE-02` error for multiple `role:"primary"` supports on one event
- `V-EVIDENCE-03` error for cyclic or too-deep `derived_from` chains

## Scope

In scope:

- `src/validate.ts`
- `src/validate.test.ts`

Out of scope:

- schema changes
- type changes
- parser changes
- view changes
- migration or fixture-format changes
- ADR 009 / ADR 011 validator rules
- changes to existing `V-SRC`, `V-TIME`, `V-STATUS`, `V-INTERVAL`, or
  `V-FULFILL` behavior

## User Story

As the ADR 015 maintainer, I want the ADR 010 evidence-discipline rules to land
as additive validator behavior on top of the Phase 1 substrate, so evidence
role/lineage semantics are enforced before later contradicts/resolves/transform
phases.

## Requirements

1. `V-EVIDENCE-01` warns only when:
   - `source.kind` is in the agent family (`agent_*`) using the existing
     canonical source registry
   - `certainty === "inferred"`
   - `type === "assessment"`
   - a `links.supports[]` entry is a bare string
2. `V-EVIDENCE-01` message is exact:
   `V-EVIDENCE-01: agent-inferred assessment must use object-form EvidenceRef; got bare string at supports[{i}]: {value}.`
3. `V-EVIDENCE-02` errors when more than one object-form support has
   `role === "primary"` and ignores bare strings.
4. `V-EVIDENCE-02` message is exact:
   `V-EVIDENCE-02: multiple role:primary entries in supports (found {n}); split into separate assessments.`
5. `V-EVIDENCE-03` walks normalized `derived_from` chains using identity
   `kind + ref`, rejects cycles, and rejects depth greater than `8`.
6. `V-EVIDENCE-03` depth counting is explicit: outer support ref is depth `0`,
   first `derived_from[*]` is depth `1`, depth `8` passes, depth `9` errors.
7. `V-EVIDENCE-03` messages are exact:
   - `V-EVIDENCE-03: derived_from cycle detected at {kind}:{ref}.`
   - `V-EVIDENCE-03: derived_from depth exceeds max 8 at depth {depth} for {kind}:{ref}.`
8. Existing support-target resolution stays intact, including the current
   structural acceptance / local-resolution bypass for `kind:"external"`.
9. `checkSupportsTargets` remains unchanged; new evidence-rule logic is added
   via one local helper from `checkReferentialIntegrity`.
10. Phase 2 uses a validator-local max depth of `8`. This intentionally does
    not reuse a shared evidence-chain constant because no shared exported
    constant exists in the repo today and widening scope would violate the
    user-approved phase boundary.

## Acceptance Criteria

- Only `src/validate.ts` and `src/validate.test.ts` change.
- `src/validate.ts` adds only `V-EVIDENCE-01`, `V-EVIDENCE-02`, and
  `V-EVIDENCE-03`.
- `V-EVIDENCE-01` warnings are limited to the exact predicate above.
- `V-EVIDENCE-02` ignores bare strings and errors only when object-form
  `primary` refs exceed one.
- `V-EVIDENCE-03` rejects cycles and depth `> 8` using normalized `kind + ref`
  identity and explicit depth semantics.
- Existing non-evidence validator families remain behaviorally unchanged.
- `npm test`, `npm run check`, and `npm run typecheck` all pass.
- Final boundary proof shows no schema/type/parser/view/migration file edits and
  no new ADR 009 / ADR 011 rule codes.
