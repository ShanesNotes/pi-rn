# pi-chart source authority map

Status: canonical context-hygiene map created by ADR 018.

Purpose: prevent coding-agent context poison by classifying which repository surfaces are architectural authority, accepted decisions, active plans, prototype evidence, historical proposals, deprecated guidance, or runtime/transient artifacts.

## Rule of interpretation

When artifacts conflict, use this order:

1. Direct user/system/developer instructions for the active session.
2. `AGENTS.md` instructions in scope.
3. Accepted ADRs in `decisions/`.
4. Canonical architecture docs listed below.
5. Active planning docs listed below.
6. Prototype/directional evidence.
7. Historical/proposal-only artifacts.
8. Runtime/transient artifacts.

When a lower-authority artifact has useful details, promote the specific decision into an ADR or active PRD/test-spec before implementation.

## Canonical architecture

These files define the current architecture unless superseded by a later accepted ADR:

| Surface | Authority | Notes |
|---|---|---|
| `README.md` | Canonical primer | Holds the core thesis: chart is canonical, current state is a query, derived summaries are disposable. |
| `DESIGN.md` | Canonical substrate spec | Defines primitives, view contracts, invariants, and deferred scope. |
| `ARCHITECTURE.md` | Canonical code map | Maps current implementation modules and data flow over the design. |
| `ROADMAP.md` | Canonical schedule/seam map | Tracks shipped work, current focus, seams, deferrals, and speculative later work. |
| `CLAIM-TYPES.md` | Canonical claim vocabulary reference | Use with schemas and validator; update via ADR-backed changes. |
| `pi-chart.yaml` | Current system registry | Runtime data/config authority for registered patients, not architecture policy. |

## Accepted decisions

| Surface | Authority | Notes |
|---|---|---|
| `decisions/001-mimic-to-synthea.md` through `decisions/017-actor-attestation-review-taxonomy.md` | Accepted historical decisions | Valid unless superseded by later ADR. |
| `decisions/018-architecture-rebase-clinical-truth-substrate.md` | Current architecture rebase decision | Establishes clinical truth substrate over prototype cockpit, hybrid immediate path, clean-slate spike gate, and context-hygiene requirement. |
| Future `decisions/019-*` | Pending | Should decide clean-slate vs hybrid after spike evidence. |

## Active planning

These files may guide execution when their lane is approved. They are not architecture authority unless converted into ADRs or canonical docs.

| Surface | Status | Notes |
|---|---|---|
| `docs/plans/kanban-prd-board.md` | Canonical planning index | First stop for active PRD/test-spec lanes and backlog status. |
| `docs/plans/prd-architecture-rebase-clinical-truth-substrate.md` | Active PRD | Owns ADR/source-authority/quarantine/spike planning lane. |
| `docs/plans/test-spec-architecture-rebase-clinical-truth-substrate.md` | Active test spec | Structural verification for this lane. |
| Other `docs/plans/prd-*.md` / `docs/plans/test-spec-*.md` | Active only when board/HITL says so | Do not infer approval from file existence alone. |
| `.omx/plans/plan-architecture-rebase-clinical-truth-substrate.md` | Execution-history seed | Useful source for this lane; promoted durable outputs live in `decisions/` and `docs/`. |

## Prototype/directional evidence

These artifacts can inform product intuition, vocabulary, and visual direction, but they must not define core architecture without promotion into ADR/PRD.

| Surface | Status | Notes |
|---|---|---|
| `docs/design/` | Prototype/design evidence | Includes screenshots, handoffs, draft contracts, and UI concepts. Treat as directional unless explicitly referenced by active PRD/ADR. |
| `docs/prototypes/` | Generated/static prototype output | Useful for visual/product review. Not source of chart truth or architecture. |
| `scripts/agent-canvas.ts` output | Prototype generator evidence | The generated cockpit is hardcoded/product-exploratory. It is not core architecture. |
| `tests/fixtures/agent-canvas-context.json` | Prototype fixture evidence | Valid for tests, not a canonical context API by itself. |
| `patients/patient_002/` | Golden fixture and product-story evidence | Useful broad EHR skeleton proof. Do not overfit architecture to this single respiratory scenario. |

## Historical/proposal-only

These artifacts may contain useful research, rejected ideas, or partial plans. They are not implementation authority unless promoted.

| Surface | Status | Notes |
|---|---|---|
| `memos/` | Historical/proposal-only by default | Promote specific durable decisions into ADRs or `docs/plans` before implementation. |
| `clinical-reference/` | Domain research/reference | Helps shape fixtures and claims; not automatically accepted schema or architecture. |
| `wiki/` | Project wiki/reference | Useful navigation/history; not higher authority than ADRs/docs. |
| `.omx/plans/` except explicitly referenced active plan | Execution history | Treat as historical unless promoted into `docs/plans` or named by current task. |
| `.omx/context/` | Session context snapshots | Useful evidence for the specific lane; not durable architecture by default. |
| `.omx/interviews/`, `.omx/specs/`, `.omx/reports/` | Workflow artifacts | Historical unless a current plan names them as source inputs. |

## Deprecated / do-not-use-for-implementation

These cues should not drive new implementation unless superseded by a new accepted plan:

| Cue | Reason |
|---|---|
| Treating Agent Canvas or generated HTML as product architecture | ADR 018 demotes UI prototypes to directional evidence. |
| Treating filesystem/NDJSON/Markdown as sacred production storage | ADR 018 says it is current backend/fixture/export, not permanent database commitment. |
| Reading hidden `pi-sim` internals from pi-chart or pi-agent | Violates ADR 016 and ADR 018 boundary rules. |
| Assuming every memo is accepted policy | Memos are proposal/historical by default. |
| Assuming broad EHR skeleton means full EHR product | ADR 016 says breadth is for observable clinical-memory proof, not full EHR scope. |
| Starting clean-slate rewrite before spike and ADR 019 | ADR 018 requires evidence before rewrite. |

## Runtime/transient artifacts

These should not be used as architecture inputs unless the current task explicitly asks for runtime recovery or trace inspection:

| Surface | Status | Notes |
|---|---|---|
| `.omx/state/` | Runtime state | Session/mode state, not durable product policy. |
| `.omx/logs/` | Runtime logs | Debugging evidence only. |
| `.omx/tmp/` | Scratch | Not authority. |
| `patients/*/_derived/` | Generated disposable projections | Never chart truth; rebuildable cache. |
| `node_modules/` | Dependency installation | Not source authority. |

## Quarantine banner policy

Before deleting or moving stale docs, prefer a small reversible banner pass. Use this banner for prototype/historical files selected by an approved PRD/test-spec:

> **Status:** Historical/prototype artifact. Not current architectural authority. For current direction, see ADR 018, `ARCHITECTURE.md`, and `docs/architecture/source-authority.md`.

Do not bulk-banner every file at once. First pass should target only files that future agents are likely to mistake for current architecture, such as outdated connector plans, generated cockpit handoff docs, or superseded memos.

## Promotion policy

To promote an idea from lower-authority material:

1. Identify the source artifact and exact claim.
2. Decide whether it is an ADR-level decision, PRD/test-spec work item, or reference note.
3. Create or update the durable target file.
4. Link back to the source artifact.
5. Mark any conflicting old artifact as historical/proposal-only or banner it.

## Current next gate

The next architecture gate is ADR 019 after a clean-slate service/event-store spike compares against current patient_002 projections. Until then, execute hybrid/docs/source-authority work only unless a new approved plan says otherwise.
