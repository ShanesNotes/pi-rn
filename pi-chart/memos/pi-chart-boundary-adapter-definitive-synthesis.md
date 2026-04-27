# pi-chart Boundary Adapter API — Definitive Synthesis

**Status:** project decision artifact  
**Scope:** first external adapter/export API for pi-chart  
**Decision date:** 2026-04-25  
**Sources synthesized:** `boundaryadapterergo.md`, `Pi-Chart Adapter API Ergonomics Research.md`, plus the uploaded pi-chart README, ARCHITECTURE, ADR 016, and event schema.

---

## 0. Decision

pi-chart's first external adapter API should feel like a **stateless, typed, read-only projection boundary**:

```ts
exportMemoryProof(scope, views, options, encounterRef?) -> FhirExportResult
```

It returns a transient FHIR R4-ish `Bundle`, preferably `Bundle.type = "document"`, anchored by a `Composition` whose sections mirror the broad-EHR memory-proof projection. FHIR remains only a boundary serialization. pi-chart does not adopt an internal FHIR resource model, a FHIR server, a runtime agent framework, or production access-control machinery.

The API must preserve pi-chart's internal append-oriented claim stream by reading only from view primitives and by never mutating chart state. The exported Bundle must carry mandatory `Provenance` resources that preserve `source.kind`, `author`, `transform.activity/tool/version/input_refs`, and evidence/links. `AuditEvent` is supported only as an optional in-bundle export-operation record; it is not a logging subsystem.

**Adopt the ergonomic middle:** HealthChain-style low-friction function call; Medplum-style explicit Provenance. Reject the surrounding platform surfaces from both.

---

## 1. Resolved synthesis positions

### 1.1 Public API contract vs first implementation slice

The public contract should be the full memory-proof export, not a special-purpose `exportNotes()` function. However, the first implementation slice should validate the hardest provenance path first: notes / narrative / handoff, because summarized narrative tends to draw from many `input_refs` and therefore stresses the causal graph.

**Definitive rollout:**

1. Create the full `src/adapters/fhir/` TypeScript skeleton and public `exportMemoryProof` signature.
2. Ship mandatory Provenance mapping first.
3. Land a notes/handoff vertical slice first if needed for implementation velocity.
4. Expand to all six ADR 016 surfaces before claiming the boundary milestone.

This reconciles the two council reports: one argued for a six-surface `exportMemoryProof` contract, while the other argued for a narrow first mapping surface to avoid architecture astronautics.

### 1.2 TypeScript, not Python

Use the TypeScript module layout from the repo-aligned report. The Python module names in the second report are ergonomically useful but do not match pi-chart's current codebase. pi-chart's public surface is `src/index.ts`, with view/write/read modules already organized under `src/`, so the adapter should live under `src/adapters/fhir/`.

### 1.3 Provenance mandatory; AuditEvent opt-in

Provenance is not optional. Every emitted clinical resource must be covered by at least one `Provenance.target`. Emit one Provenance per activity when possible, not one Provenance per resource by default.

AuditEvent should exist as an opt-in option:

```ts
emitAuditEvent?: boolean
```

When true, emit one in-bundle `AuditEvent` describing the export operation itself. Do not create audit-log folders, streaming logs, access telemetry, or read-path observability infrastructure in the first adapter.

### 1.4 No internal FHIR model

FHIR types must not leak into core pi-chart. Use local, narrow FHIR R4-ish type stubs inside `src/adapters/fhir/types.ts`; enforce that no file outside `src/adapters/fhir/` imports them.

---

## 2. API ergonomics table

| Feature | Medplum pattern | HealthChain pattern | pi-chart definitive analogue | Decision |
|---|---|---|---|---|
| Agent/runtime invocation | TypeScript bots, custom operations, subscriptions, scheduled execution. | Python services/decorators over model or FHIR gateway workflows. | No runtime. pi-agent remains the agent. pi-chart exposes synchronous library functions only. | **Reject runtime abstraction.** |
| FHIR read surface | Full FHIR REST/search/GraphQL, searchsets, `_revinclude`. | `FHIRGateway.search`, aggregation decorators, live EHR gateway feel. | No FHIR query language. Adapter calls pi-chart view primitives and serializes projection output. | **Adopt projection ergonomics; reject search server.** |
| FHIR write surface | Create/update/patch/upsert FHIR resources. | Gateway creates FHIR resources with metadata. | No boundary writes initially. pi-chart writes remain `appendEvent` and corrections via new events. | **Reject mutating FHIR boundary.** |
| Bundle shape | Batch/transaction/document possible; Medplum can execute batches. | Returns FHIR bundles from gateway/pipeline operations. | Return a transient `Bundle`, default `document`, with `Composition` first and `urn:uuid:` internal references. | **Adopt document Bundle.** |
| Provenance | Explicit `Provenance` resources following W3C-style Activity/Agent/Entity mapping. | Lightweight `add_provenance` / tag-like ergonomics. | Mandatory explicit Provenance, exposed through a low-friction function option surface. Use `meta.tag` only as grep/query aid, never as replacement. | **Adopt Medplum depth + HealthChain ease.** |
| AuditEvent | Platform/server emits operational audit events. | Mostly deferred to host/application logging. | Optional single export AuditEvent in Bundle. No persistent audit subsystem. | **Adopt narrowly.** |
| Access/review patterns | AccessPolicy, ProjectMembership, Task workflows. | Host OAuth/config; CDS Hooks cards possible. | PatientScope remains local scope. Export artifact is reviewable by downstream tools. | **Defer access; reject workflow engine.** |
| Human-in-the-loop | FHIR Task queues, app surfaces. | CDS Hooks cards inside clinical workflow. | Downstream responsibility; pi-chart exports artifacts with provenance/evidence. | **Defer.** |
| Testing ergonomics | Mock client and fixture-driven bot tests. | Sandbox client / request-response examples. | Pure fixture tests over NDJSON/view primitives; golden Bundle snapshots; import graph guard. | **Adopt pure fixture tests.** |

---

## 3. Minimal adapter API proposal

### 3.1 Module layout

```text
src/adapters/fhir/
  index.ts
  types.ts
  export.ts
  composition.ts
  provenance.ts
  audit.ts
  identifiers.ts
  mapping.ts
  validate.ts
  __tests__/
    round-trip.test.ts
    provenance-coverage.test.ts
    fail-fast.test.ts
    snapshot.test.ts
    import-graph.test.ts

docs/adapters/fhir/
  DESIGN.md
  MAPPING.md
```

### 3.2 Public TypeScript signatures

```ts
import type { PatientScope, Event, Author, Source, Transform, Links } from "../../types";

export interface ViewPrimitives {
  timeline:      (q?: { from?: string; to?: string; subject?: string }) => ReadonlyArray<Event>;
  currentState:  (q?: { axis?: string; subject?: string }) => Record<string, Event>;
  evidenceChain: (q: { eventId: string }) => ReadonlyArray<Event>;
  openLoops:     (q?: { subject?: string }) => ReadonlyArray<{ openedBy: Event; awaiting: string }>;
  narrative:     (q?: { encounterRef?: string }) => string;
}

export interface FhirExportOptions {
  kind: "document" | "collection";
  emitAuditEvent?: boolean;
  now?: () => string;
  destination?: "identifier" | "extension";
  agentDevice?: { id: string; version: string };
}

export interface FhirExportResult {
  bundle: import("./types").FhirBundle;
  suggestedPath: string;
  warnings: ReadonlyArray<string>;
}

export function exportMemoryProof(
  scope: PatientScope,
  views: ViewPrimitives,
  options: FhirExportOptions,
  encounterRef?: string,
): FhirExportResult;

export function exportEventsAsBundle(
  scope: PatientScope,
  events: ReadonlyArray<Event>,
  options: FhirExportOptions,
): FhirExportResult;

export function mapEventToResource(ev: Event): {
  resource: import("./types").FhirResource;
  provenanceTargets: ReadonlyArray<string>;
};

export function buildProvenance(args: {
  targets: ReadonlyArray<string>;
  author: Author;
  source: Source;
  transform?: Transform;
  links?: Links;
  recorded: string;
  agentDevice: { id: string; version: string };
}): import("./types").FhirProvenance;

export function buildExportAuditEvent(args: {
  subject: string;
  inputEventIds: ReadonlyArray<string>;
  outputBundleId: string;
  agentDevice: { id: string; version: string };
  recorded: string;
}): import("./types").FhirAuditEvent;

export function validateBundle(b: import("./types").FhirBundle): {
  ok: boolean;
  fhirErrors: ReadonlyArray<string>;
  invariantErrors: ReadonlyArray<string>;
};

export class FhirExportError extends Error {
  constructor(public readonly code:
    | "missing_view"
    | "unmapped_event"
    | "invariant_violation"
    | "schema_violation",
    msg: string,
  ) { super(msg); }
}
```

### 3.3 Export shape

Default export shape:

```text
Bundle(type=document)
├─ entry[0]: Composition(memory-proof document)
├─ Patient reference or contained/minimal Patient as needed by receiver
├─ Observation resources for vitals, assessments, labs
├─ DocumentReference resources for notes/narrative/handoff artifacts
├─ ServiceRequest / MedicationRequest resources for orders/interventions
├─ CarePlan resources or Composition sections for care plan/handoff
├─ Provenance resources, mandatory
└─ AuditEvent resource, optional
```

The `Composition` sections mirror the memory-proof projection:

1. What happened.
2. Why it mattered.
3. Evidence / provenance.
4. Uncertainty.
5. Open loops.
6. Next-shift handoff.

### 3.4 Provenance mapping

| pi-chart field | FHIR-ish export target | Rule |
|---|---|---|
| `event.id` | `Resource.identifier[]` with `system = "https://pi-chart.local/event-id"` | Mandatory round-trip key. |
| `author.id` / `author.role` | `Provenance.agent[].who` + participant type | Human authors become Practitioner-like references; agent authors become Device/software references. |
| `author.run_id` | `Provenance.agent[].who.identifier` or local extension | Preserve for agent decision-cycle traceability. |
| `source.kind` / `source.ref` | `Provenance.entity[]` and/or local coding/tag | Preserve verbatim; do not compress into generic “AI-generated” tags. |
| `transform.activity` | `Provenance.activity` | Map `import`, `normalize`, `extract`, `summarize`, `infer`, `transcribe` to local CodeSystem or standard code where exact. |
| `transform.tool` / `version` | `Device`-like agent metadata | Identifies tool/model/software version. |
| `transform.input_refs` | `Provenance.entity[]` with role `source` or `derivation` | Every input reference must remain inspectable. |
| `links.supports` / `corrects` / `supersedes` / `addresses` / `fulfills` / `resolves` / `contradicts` | `Provenance.entity[]`, resource relationships, and local relationship coding | Preserve the verb even when FHIR lacks a perfect native analogue. |
| `certainty` | Native resource element when available; otherwise extension | Prefer “small-p provenance” in resource-native fields where possible. |

---

## 4. Do-not-copy list

### 4.1 Product surfaces that would turn pi-chart into an EHR platform

Do not build:

- FHIR server, search API, history table, conditional create/update, `_revinclude` implementation.
- GraphQL over FHIR resources.
- FHIR Subscription/WebSocket server.
- UI charting surfaces: flowsheet UI, note editor, medication reconciliation screen, task dashboard.
- Project / ProjectMembership / tenant compartments.
- Full SMART-on-FHIR app launcher or OAuth client machinery.

### 4.2 Runtime agent abstractions duplicating pi-agent

Do not build:

- Medplum-style Bot runtime, `$execute`, cron, secrets, deployment surface.
- HealthChain-style persistent FastAPI service, model pipeline registry, note-service runtime, or NLP pipeline host.
- New webhook/event bus/scheduler inside pi-chart.
- CDS Hooks listener in the substrate.

The adapter is a passive library. The host application or pi-agent calls it.

### 4.3 Premature access-control machinery

Do not build:

- AccessPolicy parser.
- RBAC/ABAC engine.
- JWT validation.
- OAuth2 / SMART token resolution.
- Multi-user session model.
- Webhook verification / rate limiting / IP allowlists.

Current security stance: adapter assumes the caller is already authorized by the local host context. Revisit only if pi-chart serves more than one patient over a network boundary.

---

## 5. Example developer workflow

```ts
import {
  timeline,
  currentState,
  evidenceChain,
  openLoops,
  narrative,
} from "../src/views";
import {
  exportMemoryProof,
  validateBundle,
} from "../src/adapters/fhir";

const scope = { chartRoot: process.cwd(), patientId: "patient_001" };
const encounterRef = "enc_001";

const views = {
  timeline:      (q: any) => timeline(scope, q),
  currentState:  (q: any) => currentState(scope, q),
  evidenceChain: (q: any) => evidenceChain(scope, q),
  openLoops:     (q: any) => openLoops(scope, q),
  narrative:     (q: any) => narrative(scope, q),
};

const result = exportMemoryProof(scope, views, {
  kind: "document",
  emitAuditEvent: false,
  destination: "identifier",
  agentDevice: { id: "pi-agent", version: "0.3.0" },
  now: () => "2026-04-25T00:00:00.000Z",
}, encounterRef);

const validation = validateBundle(result.bundle);
if (!validation.ok) {
  throw new Error([
    ...validation.fhirErrors,
    ...validation.invariantErrors,
  ].join("\n"));
}

const provenance = result.bundle.entry
  .map(e => e.resource)
  .filter(r => r.resourceType === "Provenance");

console.log({
  suggestedPath: result.suggestedPath,
  resources: result.bundle.entry.length,
  provenanceRecords: provenance.length,
  warnings: result.warnings,
});
```

Workflow steps:

1. Load `PatientScope` for a single patient.
2. Bind view primitives.
3. Call `exportMemoryProof`.
4. Validate FHIR-ish shape and pi-chart invariants.
5. Inspect Provenance coverage.
6. Write/transmit the returned Bundle only after validation.

---

## 6. Tests

| Test | Purpose |
|---|---|
| `round-trip.test.ts` | Every mapped clinical event produces a resource identifier containing the pi-chart event id. |
| `provenance-coverage.test.ts` | Every emitted clinical resource is covered by at least one `Provenance.target`. |
| `fail-fast.test.ts` | Missing/empty required view primitive output throws `FhirExportError` rather than producing empty trust-washing output. |
| `snapshot.test.ts` | Fixed clock + fixed fixture produces byte-stable Bundle JSON. |
| `import-graph.test.ts` | No file outside `src/adapters/fhir/` imports `src/adapters/fhir/types.ts`. |
| `no-sim-state-leak.test.ts` | Hidden simulator state files do not alter or appear in exports. |
| `provenance-link-verb.test.ts` | `supports`, `corrects`, `supersedes`, `addresses`, `fulfills`, `resolves`, and `contradicts` survive export as inspectable relationship semantics. |

---

## 7. Documentation snippet

```md
## FHIR boundary adapter discipline

pi-chart's internal model is the append-oriented clinical event envelope.
FHIR exists only at the export/import boundary.

Rules:

1. No FHIR types may be imported outside `src/adapters/fhir/`.
2. Mapping happens at export/import time, never at chart write time.
3. `appendEvent` never accepts FHIR resources.
4. Exported clinical resources must include a pi-chart event identifier.
5. Exported clinical resources must be covered by Provenance.
6. `AuditEvent` is optional and describes only the export operation.
7. No AccessPolicy, Project, Subscription, `$execute`, CDS Hooks server, or FHIR search API is part of pi-chart.
```

---

## 8. Implementation recommendation

### Implement immediately after Workstream A

1. `src/adapters/fhir/` TypeScript skeleton.
2. `exportMemoryProof` public API.
3. `buildProvenance` and Provenance coverage tests.
4. Notes/handoff vertical slice first if needed, then all six ADR 016 surfaces.
5. `validateBundle` invariants.
6. `docs/adapters/fhir/DESIGN.md` and `docs/adapters/fhir/MAPPING.md`.

### Keep docs/examples-only for now

1. Medplum sandbox round-trip example.
2. CDS Hooks wrapping example.
3. AuditEvent mapping explanation beyond the single optional export record.
4. Import mapping sketch.
5. Glossary of rejected platform surfaces.

### Defer

1. FHIR import adapter until a second pi-agent flow requires real EHR ingestion.
2. AccessPolicy/RBAC/Auth until pi-chart is served over a network to multiple patients/users.
3. Runtime bots / `$execute` / subscriptions indefinitely unless a non-pi-agent consumer appears.
4. CDS Hooks adapter until a clinical UI explicitly wants `openLoops` as cards.
5. Bulk Data export until a regulator/data partner asks for it.
6. AI Transparency IG conformance until external systems need automatic recognition of pi-agent-authored content.

---

## 9. Acceptance criteria

The first boundary adapter milestone is complete only when:

1. `exportMemoryProof` returns a deterministic Bundle from a fixed fixture and clock.
2. The Bundle is read-only/transient and never becomes internal chart state.
3. Every clinical resource has a pi-chart event identifier.
4. Every clinical resource has Provenance coverage.
5. `source.kind`, `author`, `transform`, and evidence links survive export.
6. Hidden simulator state does not influence or appear in the export.
7. No FHIR type leaks into non-adapter modules.
8. No server/auth/runtime/workflow platform surface is introduced.
9. The broad-EHR fixture can answer: what happened, why it mattered, what evidence supports it, what remains uncertain, what is still open, and what the next shift should watch.

---

## 10. Final recommendation

Build **one narrow, trustworthy boundary** rather than a small EHR platform.

The first pi-chart external adapter should make an integrator think:

> “This is easy to call, impossible to confuse with internal state, and serious about provenance.”

That means:

- one function,
- one transient Bundle,
- mandatory Provenance,
- optional single AuditEvent,
- deterministic validation,
- no internal FHIR,
- no FHIR server,
- no agent runtime,
- no production auth layer.

This gives pi-chart external credibility while preserving its core thesis: the chart is canonical, current state is a query, and derived/exported summaries are disposable.
