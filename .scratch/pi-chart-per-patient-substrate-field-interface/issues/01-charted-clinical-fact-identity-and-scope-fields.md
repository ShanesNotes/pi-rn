# Charted-clinical-fact identity & scope fields

Status: completed
Type: AFK (spec artifact — field-definition doc, not a source edit)
Reconciliation posture: `adopt` (identity & scope fields already exist and map cleanly; one defect to close)
PRD user stories covered: 1, 3, 25, 26

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`

## Companion / authoritative inputs

- Current field model: `pi-chart/src/types.ts` (`EventEnvelopeBase`, `ClinicalEvent`, `NoteFrontmatter`, `VitalSample`, `PatientScope`)
- Kernel Claim target: `pi-ledger/docs/ledger-core-public-interface.md` (frozen K0–K12 public interface)
- Defect site: `pi-chart/src/views/currentState.ts:230-235` (`eventMatchesEncounter`)
- Scaling runtime (ACCEPTED NORTH STAR, ADR-promoted): `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`

## What to build (spec, not implementation)

Define the **identity & scope** sub-slice of the canonical charted-clinical-fact field set: `id`, `subject.patientId`, `encounterId`. State each field's canonical-memory role, clinician-facing label, current pi-chart representation, and its kernel-Claim target mapping. Close the `encounterId` wildcard-leak defect. Show the connector signature.

This is a SPEC artifact. It does **not** authorize source edits, fixture migration, the adapter, or the Rust↔TS integration mechanism (PRD Implementation Decisions; Out of Scope).

### Field spec

| Field (contract) | Canonical-memory role | Clinician-facing label | Current pi-chart representation | Kernel-Claim target | Posture |
| --- | --- | --- | --- | --- | --- |
| `id` | Stable fact identity; link target; sort tiebreaker | (not surfaced; underlies Source trail drill-down) | `EventEnvelopeBase.id` / `NoteFrontmatter.id` (string, caller-set, filled by `appendEvent` if absent) — `VitalSample` has **no `id`** today | `id` (**direct** map; caller-set `id` is permitted, not K3-owned) | `adopt` (vitals gap noted) |
| `subject.patientId` | Per-patient anchor; the single subject of every fact | **Patient banner** | `EventEnvelope.subject: string` / `NoteFrontmatter.subject` / `VitalSample.subject` (all the **same field**, flat string); `PatientScope.patientId` is a read-path directory scope, **not a second source** | `subject.patientId` (**direct** map; kernel raises `PatientMismatch` if `!=` target ledger patient) | `adopt` |
| `encounterId` | Per-encounter partition | **Current visit** | `encounter_id?: string` optional on `EventEnvelopeBase`; **required** on `ClinicalEvent` / `NoteFrontmatter` / `VitalSample`; matched by a **wildcard** in `eventMatchesEncounter` | **`object.encounterId: string`** — a predicate `RequiredField` inside the typed object, **not** kernel subject | `adopt` field / `revise` the match behavior |

### The single-anchor rule (`subject`)

`subject` is the **one** patient anchor. `EventEnvelope.subject`, `NoteFrontmatter.subject`, and `VitalSample.subject` are specified as the same contract field `subject.patientId`. `PatientScope.patientId` (the directory the reader scopes to) is a **read-path concern** that must equal `subject.patientId` for every fact it returns — it is a routing key, never a competing source of the anchor. A reader that returns a fact whose `subject` differs from the scoped patient is a leak (mirror of the kernel's `PatientMismatch`).

### Kernel-mapping note (load-bearing — patient is subject, encounter is object)

The kernel Claim splits these two scopes:

- `subject.patientId` → kernel **`subject.patientId`** (the ledger is sharded per patient; this is what selects the ledger).
- `encounterId` → kernel **`object.encounterId: string`** (encounter is **object content** the predicate enforces via `RequiredFields` / `validate_object` → `MissingObjectField`/`InvalidObjectField`), **not** kernel subject.

Rationale: in the frozen interface a Claim has exactly one `subject` (the patient); encounter is a property *of* the asserted content, so it belongs in `object`. The adapter (out of scope here) performs this placement; the field spec only declares the targets. The kernel is **not widened** — the chart bends to the frozen target (PRD §4).

### Defect to close — `encounterId` wildcard leak

Today `eventMatchesEncounter(ev, encounterId)` returns `true` when `ev.encounter_id` is **not a string** (i.e. absent). Because `encounter_id` is **optional on the base envelope**, any structural/cross-encounter fact with no `encounter_id` silently matches **every** encounter filter and leaks into encounter-scoped views (`currentState`, etc.).

```ts
// pi-chart/src/views/currentState.ts:230
function eventMatchesEncounter(ev, encounterId) {
  return !encounterId || typeof ev.encounter_id !== "string" || ev.encounter_id === encounterId;
  //                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ wildcard leak
}
```

**Spec decision (the defect's contract-level fix, to be implemented later, not here):** a fact's encounter scope must be **explicit**, never inferred from absence.

- A patient-scoped, single-encounter fact MUST carry `encounterId`.
- A genuinely cross-encounter / structural fact MUST **declare** cross-encounter status explicitly (a named field value, e.g. `encounterScope: "cross-encounter"`), rather than omitting `encounterId` and relying on the wildcard.
- An encounter-scoped reader MUST return a fact only when its `encounterId` equals the requested encounter OR it is explicitly declared cross-encounter; **absence is not a match.**

The spec names the contract; the source change to `eventMatchesEncounter` and the schema's optional-on-base posture are deferred to implementation (Out of Scope: editing `pi-chart/src/`).

### Connector signature (never hardcode a patient)

Every connector that reads this substrate stays `(patientId, encounterId, asOf)`-parameterized:

```ts
// illustrative signature — NOT an authorized source edit
function connect(patientId: string, encounterId: string, asOf: string): /* projection */;
```

- Demo target: `patient_002` / `enc_p002_001`.
- Regression target: `patient_001`.
- No connector hardcodes a patient id; `patientId` selects the per-patient anchor/shard, `encounterId` selects the per-encounter partition, `asOf` selects the bitemporal view (see Issue 05).

### At scale (multi-provider, multi-agent, high-volume)

This runs in a hugely data-rich, multi-provider setting with many concurrent authoring agents.

- `subject.patientId` is the **shard/route key**: it selects which per-patient ledger a fact belongs to, so high claim volume routes deterministically and the kernel's per-patient `PatientMismatch` guard holds at the boundary.
- `encounterId` is the **per-encounter partition** within a patient: crisp encounter scoping (no wildcard) is what lets many concurrent agents author into one patient without cross-encounter bleed, and lets readers narrow a busy patient's history to one visit.
- `id` stays caller-set and globally stable so links/corrections resolve under concurrent authorship; **append-only, correction-by-new-fact** (Issue 09) is what makes concurrent multi-agent writes safe — identity is never reused or mutated.
- Where this depends on a shared clinical-truth service hosting per-patient ledgers at scale, that runtime is the **accepted north star, ADR-promoted** clinical-truth service (private/local gRPC/UDS first transport; append-only WAL/log first storage) — see `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md` (accepted north star). Many clinicians/agents may enter from many workflows, but the service provides one patient-scoped append order; this issue does not implement the storage engine.

## Acceptance criteria

- [x] Doc names all three fields (`id`, `subject.patientId`, `encounterId`) with canonical-memory role, clinician label, current pi-chart source, and kernel target.
- [x] Kernel mapping stated: `id`→`id`, `subject.patientId`→`subject.patientId`, `encounterId`→`object.encounterId` (encounter is object, patient is subject) — with the rationale.
- [x] `subject` declared the single anchor; `PatientScope.patientId` named a read-path concern, not a second source.
- [x] Wildcard-leak defect named at `active.ts:195-200` with a contract-level fix: explicit per-encounter scope, explicit cross-encounter declaration, absence-is-not-a-match.
- [x] Connector signature shown as `(patientId, encounterId, asOf)`; demo `patient_002`/`enc_p002_001` and regression `patient_001` named; no hardcoded patient.
- [x] Scaling note: `subject.patientId` as shard/route key, `encounterId` as per-encounter partition, citing the accepted clinical-truth service north star (ADR-promoted).
- [x] States no source edit, no adapter, no Rust↔TS mechanism, no kernel widening.

Deliverable: `field-specs/01-identity-and-scope.md`

## Blocked by

- (none — independently grabbable; `adopt` posture)

## Open questions for the architect

- **Cross-encounter declaration field name/shape.** The PRD requires cross-encounter facts to declare status explicitly but does not name the field. Proposed `encounterScope: "single" | "cross-encounter"` (or an `encounterId: "*"` sentinel) — surfaced as an open question, not decided here.
- **`VitalSample` has no `id` today.** The common grammar requires a stable `id` on every fact (so a vital can be linked/corrected/evidenced — PRD Further Notes). Whether `sample_key` is promoted to `id` or a new `id` is minted is an open question for the vitals-lift slice; this issue only flags it.

## Reconciliation register

| Item | Posture | Note |
| --- | --- | --- |
| `id`, `subject.patientId` fields | `adopt` | Already explicit; direct kernel map |
| `encounterId` as a field | `adopt` | Maps to `object.encounterId` |
| `eventMatchesEncounter` wildcard behavior | `revise` | Absence-is-a-match is a defect; contract fix specified, source edit deferred |
| Cross-encounter declaration field | `open-question` | Field name/shape not decided by PRD |
| `VitalSample.id` | `open-question` | Vitals lack identity today; promotion deferred to vitals-lift slice |
