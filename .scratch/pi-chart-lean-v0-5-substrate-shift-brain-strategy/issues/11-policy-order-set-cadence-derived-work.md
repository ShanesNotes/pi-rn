# Policy/order-set/cadence-derived work

Status: ready-for-human
Type: AFK
User stories covered: 25-27

## Parent

`.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/PRD.md`

## What to build

Define how policy, protocol, order-set, and cadence-derived work appears as source-linked per-patient workflow items without implementing the policy or order-set content library. Sources may include unit policy, order set, patient acuity, nurse-authored plan, provider/protocol order, insulin protocol, pressure-injury risk, CIWA/COWS, and other protocolized scoring.

Start by inspecting the Phase A order-set research and related corpus-mining artifacts. If that research is insufficient to identify an order-set template or representation pattern, produce a bounded deep-research query brief for maintainer approval or a later research slice rather than inventing a template.

## Acceptance criteria

- [x] Mines existing Phase A order-set research or notes before proposing new order-set representation language.
- [x] Defines policy/order-set/cadence work as source-linked workflow inputs, not hardcoded substrate primitives.
- [x] Defines source, policy/order-set/protocol name and version when known, patient applicability, generated obligation, override/defer reason, and human completion/action.
- [x] Preserves that actual order-set and policy library content is downstream scope.
- [x] If no adequate order-set template exists in Phase A evidence, records a bounded deep-research query brief instead of selecting a template ad hoc.
- [x] Avoids implementing full protocol/CDS engine, full CPOE, or content packages.

## Blocked by

- `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/issues/06-workflow-item-source-and-authority-grammar.md`


## Implementation notes

- Added `.scratch/pi-chart-lean-v0-5-substrate-shift-brain-strategy/policy-order-set-cadence-derived-work.md`.
- Mined Phase A evidence before drafting: `hitl-workflow-prioritization-decisions.md`, `source-artifact-mining-map.md` row `SRC-A9B-001`, `orders-mar-medrec-io-lda-open-loop-substrate-pack.md` row `ORDERSET-007`, and `lean-dense-v0-5-substrate-recommendation.md` order/defer rows.
- Defined policy/order-set/cadence work as source-linked workflow inputs, not hardcoded substrate primitives.
- Defined source category, source name/version, applicability basis, generated obligation, authority, due/relevance window, completion criteria, override/defer/block/carry-forward reason, evidence/caveat, and human/agent boundary.
- Preserved actual order-set/protocol/policy content libraries as downstream scope.
- Recorded a bounded research brief because Phase A supports a representation pattern but not an adequate concrete default hospital/adult ICU order-set template.
- Excluded full protocol/CDS engine, full CPOE, content packages, backend/storage/adapter work, hidden simulator coupling, and `pi-ledger` kernel expansion.

## Closeout evidence

- `python3` structural check — PASS: artifact status, issue status/checklist, Phase A evidence review, source-linked representation contract, policy/order-set/cadence sections, bounded research brief, and scope exclusions verified.
- `git diff --check` — PASS.
- Ralph architect verification — APPROVED: no blockers; verified Phase A mining, source-linked representation, downstream content boundary, bounded research brief, and consistency with issues 06, 08, 09, and 10.
- AI slop cleanup pass — PASS: scoped to changed issue 11 docs; fallback-like scan found only intentional "Agent cannot complete silently" negative-boundary language; no cleanup edits required.
- Post-deslop `python3` structural check — PASS.
- Post-deslop `git diff --check` — PASS.
