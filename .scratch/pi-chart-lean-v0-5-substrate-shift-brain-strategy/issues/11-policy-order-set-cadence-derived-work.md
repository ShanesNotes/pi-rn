# Policy/order-set/cadence-derived work

Status: needs-triage
Type: AFK
User stories covered: 25-27

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define how policy, protocol, order-set, and cadence-derived work appears as source-linked per-patient workflow items without implementing the policy or order-set content library. Sources may include unit policy, order set, patient acuity, nurse-authored plan, provider/protocol order, insulin protocol, pressure-injury risk, CIWA/COWS, and other protocolized scoring.

Start by inspecting the Phase A order-set research and related corpus-mining artifacts. If that research is insufficient to identify an order-set template or representation pattern, produce a bounded deep-research query brief for maintainer approval or a later research slice rather than inventing a template.

## Acceptance criteria

- [ ] Mines existing Phase A order-set research or notes before proposing new order-set representation language.
- [ ] Defines policy/order-set/cadence work as source-linked workflow inputs, not hardcoded substrate primitives.
- [ ] Defines source, policy/order-set/protocol name and version when known, patient applicability, generated obligation, override/defer reason, and human completion/action.
- [ ] Preserves that actual order-set and policy library content is downstream scope.
- [ ] If no adequate order-set template exists in Phase A evidence, records a bounded deep-research query brief instead of selecting a template ad hoc.
- [ ] Avoids implementing full protocol/CDS engine, full CPOE, or content packages.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`
