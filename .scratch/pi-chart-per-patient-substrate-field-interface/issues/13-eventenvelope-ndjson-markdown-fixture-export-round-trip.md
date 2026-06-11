# EventEnvelope/NDJSON/Markdown as fixture + export round-trip

Status: completed
Type: AFK (spec artifact — field-definition / crosswalk doc, not a source edit)
Reconciliation posture: `adopt` (ADR 018 point 4 already names the brownfield layout the fixture/export/archive format; this slice writes the crosswalk and the round-trip assertion)
PRD user stories covered: 1, 4, 26

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`

## Companion / authoritative inputs

- ADR: `pi-chart/docs/adr/018-architecture-rebase-clinical-truth-substrate.md` (point 4 — filesystem/NDJSON/Markdown remains fixture + export/archive format; UI/prototype is evidence not authority; points 5–7 — generated UI/design assets/prototype are not substrate authority)
- Current field model: `pi-chart/src/types.ts` (`EventEnvelope`, `VitalSample`, `NoteFrontmatter`)
- On-disk layout: `pi-chart/patients/<patientId>/timeline/<YYYY-MM-DD>/{events.ndjson, vitals.jsonl, notes/<HHMM>_<slug>.md, encounter_<NNN>.md}`
- Kernel Claim target: `pi-ledger/docs/ledger-core-public-interface.md` (the contract fields these export keys must round-trip with)
- Scaling runtime (ACCEPTED NORTH STAR, ADR-promoted): `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`

## What to build (spec, not implementation)

State, per ADR 018 point 4, that the brownfield `EventEnvelope` / `VitalSample` / `NoteFrontmatter` NDJSON+Markdown layout is the **fixture and export/archive format** — not the field-contract authority and not the adapter's source of truth. Provide a **field → export-key crosswalk** for the three shapes, and assert that every contract field round-trips to/from this layout for the `patient_001` regression and `patient_002` demo fixtures.

This is a SPEC artifact: no source edits, no fixture migration, no rewrite of the brownfield substrate (Out of Scope). The crosswalk documents how the *existing* layout maps to the contract; it does not change the layout.

### On-disk export layout (current brownfield, retained)

```
pi-chart/patients/<patientId>/
  timeline/<YYYY-MM-DD>/
    events.ndjson           # one EventEnvelope JSON per line
    vitals.jsonl            # one VitalSample JSON per line
    notes/<HHMM>_<slug>.md  # YAML frontmatter (NoteFrontmatter) + Markdown body
    encounter_<NNN>.md      # encounter-scoped narrative
```

Three shapes, one canonical contract (PRD §1: "one canonical primitive, three reconciled shapes"). The crosswalk below is how each export shape exposes the **common canonical field grammar**.

### Crosswalk A — EventEnvelope (`events.ndjson`)

Verified keys present on a real line (`patient_001/timeline/2026-04-18/events.ndjson`): `id, type, subtype, subject, encounter_id, effective_at, recorded_at, author, source, certainty, status, data, links`.

| Contract field | Export key (events.ndjson) | Kernel target | Notes |
| --- | --- | --- | --- |
| `id` | `id` | `id` | Direct (Issue 01) |
| `subject.patientId` | `subject` | `subject.patientId` | Single anchor (Issue 01) |
| `encounterId` | `encounter_id` | `object.encounterId` | Encounter is object, not subject (Issue 01) |
| `factShape` | derived from `type` | one of `context/observation/interpretation/act` | 6→4 collapse (Issue 02) |
| `predicateId` | derived from `(type, subtype)` | registered predicate id | `subtype` survives as sub-axis (Issue 03) |
| `object` | `data` (magic-key bag) | typed `object` | Loose `data` retained in export; typed object is the contract (Issue 04) |
| `time.valid` | `effective_at` XOR `effective_period` | `time.valid` instant/interval | Canonical UTC is the contract value (Issue 05) |
| `time.recorded_at` | `recorded_at` | `time.recorded_at` | Issue 05 |
| `actor` | `author{id,role,run_id?}` | `actor` | `run_id` consumed for "Suggested by Pi" (Issue 06) |
| `source` | `source{kind,ref?}` | (provenance; not a kernel field) | Controlled vocab (Issue 06) |
| `evidence` | `links.supports[]` (`EvidenceRef` or bare) | (provenance/evidence) | One evidence edge (Issue 07) |
| `transform` | `transform{activity,tool,...}` | (provenance) | Issue 07 |
| `status` | `status` | (lifecycle; informs `revises`) | Full vocab incl. `resolved` (Issue 09) |
| `revises` | `links.corrects[]`/`links.supersedes[]` | `revises.target.{id,hash}` | **Export lacks target Record hash today** — see round-trip gap (Issue 09) |
| `certainty` | `certainty` | (chart-internal; informs predicate/object) | Reconnected to uncertainty surface (Issue 10) |
| `integrity` | **absent in export today** | `integrity` | New top-level field; export has no key (Issue 08) |

### Crosswalk B — VitalSample (`vitals.jsonl`)

Verified keys (`patient_001/.../vitals.jsonl`): `sampled_at, recorded_at, sample_key, subject, encounter_id, source, name, value, unit, quality`.

| Contract field | Export key (vitals.jsonl) | Notes |
| --- | --- | --- |
| `id` | **absent** (`sample_key` is the only near-id) | Vitals have no `id` today — round-trip gap (Issue 01 open question) |
| `subject.patientId` | `subject` | Same anchor |
| `encounterId` | `encounter_id` | Per-encounter |
| `time.valid` (instant) | `sampled_at` | → `time.valid.instant` (Issue 05) |
| `time.recorded_at` | `recorded_at?` | Optional today |
| `object` (e.g. `vital.sign`) | `name`, `value`, `unit` | → typed `object` `{code,value,unit}` (Issue 04) |
| `source` | `source{kind,ref?}` | Controlled vocab |
| `status` / `certainty` / `revises` / `evidence` | **absent** | Vitals are second-class today (no lifecycle/supersession/certainty) — the common grammar lifts them; round-trip gap noted |
| `quality` | `quality` | Chart-internal sample quality; typed as optional `vital.sign.quality:String` by Issue 04 |

### Crosswalk C — NoteFrontmatter (`notes/<HHMM>_<slug>.md`)

Frontmatter keys (`types.ts` `NoteFrontmatter`): `id, type:"communication", subtype, subject, encounter_id, effective_at, recorded_at, author, source, references, status`; body is Markdown.

| Contract field | Export key (frontmatter) | Notes |
| --- | --- | --- |
| `id` | `id` | Direct |
| `subject.patientId` | `subject` | Single anchor |
| `encounterId` | `encounter_id` | Per-encounter |
| `factShape` | derived from `type:"communication"` + content | `communication` assigned a shape (`act`/`context`/`observation`) — Issue 02 |
| `time.valid` / `time.recorded_at` | `effective_at` / `recorded_at` | Canonical UTC contract (Issue 05) |
| `actor` | `author` | Issue 06 |
| `source` | `source` | Issue 06 |
| `evidence` | `references: string[]` | **Flat, role-less** — must converge on `EvidenceRef` (Issue 07); round-trip gap |
| `object` (note body/summary) | Markdown body + `data.summary`-equivalent | Body is content; typed object per predicate (Issue 04) |
| `status` | `status` | Full vocab (Issue 09) |

### Round-trip assertion

The export format may be **lossier or differently keyed** than the contract (PRD §5), but every contract field must be round-trippable **to and from** it for fixtures and regression:

- **`patient_001` (regression target):** every contract field present in the patient_001 fixture round-trips export → contract → export with no loss of the fields the export carries. This is the modularity regression — it must keep working under the connector signature `(patientId, encounterId, asOf)` with no hardcoded patient.
- **`patient_002` / `enc_p002_001` (demo target):** the same round-trip holds for the demo fixture.
- **Named round-trip gaps** (contract fields with no export key today — to be resolved by their owning slice, not invented here): `integrity` (no key — Issue 08), correction-target Record hash on `revises` (Issue 09), `VitalSample.id` and vital lifecycle/certainty (Issue 01 open question), `NoteFrontmatter.references` → `EvidenceRef` convergence (Issue 07). The crosswalk **marks** these as gaps rather than fabricating export keys.

### Boundary (ADR 018 points 5–7)

Generated UI, raw design assets, screenshots, public API shape, and prototype layout are **not** substrate authority and are **not** part of this export format. The fixture/export format is the NDJSON+Markdown timeline only. Report visuals are **evidence, not substrate** (consistent with the accepted stance and Issue 02's `artifact_ref` resolution).

### At scale (multi-provider, multi-agent, high-volume)

- The brownfield NDJSON+Markdown layout is the **fixture/export/archive** format — explicitly **not** the runtime store at scale. At volume, the per-patient append-only ledger is hosted by the **accepted north star, ADR-promoted** shared clinical-truth service (private/local gRPC/UDS first transport; append-only WAL/log first storage) (`.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`, accepted north star; ADR-promoted); this export is what seeds fixtures, archives history, and gives deterministic regression evidence — the mirror of `pi-sim`'s versioned-fixtures-as-consumer-regression pattern named in the accepted service north-star doc.
- The per-day / per-patient directory partition (`patients/<patientId>/timeline/<YYYY-MM-DD>/`) keeps the export shardable by patient and day even at high volume, so fixtures stay grabbable per-patient without loading a whole corpus — consistent with `subject.patientId` as shard key (Issue 01).
- Round-trippability is the conformance guarantee that lets the format be archive/seed without becoming a second source of truth — every field must survive export ↔ contract so the export never silently diverges from the kernel-facing contract under multi-provider volume.
- This issue **does not** implement the runtime store or select the backend framework (Out of Scope); it cites the service only as the accepted at-scale home and keeps the export as fixture/archive per ADR 018.

## Acceptance criteria

- [ ] Doc states (per ADR 018 point 4) the NDJSON+Markdown layout is fixture/export/archive, not the field-contract authority and not the adapter source of truth.
- [ ] Gives a field → export-key crosswalk for **all three** shapes: EventEnvelope (`events.ndjson`), VitalSample (`vitals.jsonl`), NoteFrontmatter (`notes/*.md`).
- [ ] Crosswalk includes kernel target where relevant and names every round-trip gap (`integrity`, `revises` Record hash, `VitalSample.id`/lifecycle, `references`→`EvidenceRef`) rather than fabricating keys.
- [ ] Asserts round-trippability export ↔ contract for `patient_001` regression and `patient_002`/`enc_p002_001` demo.
- [ ] Connectors stay `(patientId, encounterId, asOf)`-parameterized; no hardcoded patient.
- [ ] States ADR 018 points 5–7 boundary: generated UI / design assets / prototype / report visuals are not substrate authority (report visuals are evidence).
- [ ] Scaling note: export is fixture/archive, not the at-scale store; cites the accepted clinical-truth service north star with ADR-promoted; per-patient/per-day partition keeps fixtures shardable.
- [ ] States no source edit, no fixture migration, no brownfield rewrite, no kernel widening.

## Blocked by

- (none for grabbing — but the crosswalk references field decisions owned by Issue 01 (identity/scope), Issue 05 (time/canonical-UTC), and the revise-postured slices 02/03/04/06/07/08/09/10 for the gap rows. It can be authored independently; gap rows cite their owning slice rather than resolving them.)

## Open questions for the architect

- **Lossy-export policy.** PRD §5 permits the export to be "lossier or differently keyed." Which contract fields are allowed to be *absent* from export (vs required-in-export) is not enumerated by the PRD. Proposed: provenance/integrity fields the kernel assigns or the adapter computes (e.g. `integrity` hash) may be absent and recomputed; *asserted* fields (identity, scope, time, object, actor, source) must be present. Surfaced, not decided.
- **Zoned-time representation in export.** Shared open question with Issue 05: keep the original zoned `effective_at` string in export (lossless, adapter normalizes) vs store canonical UTC at rest. Affects whether the round-trip is byte-exact or contract-field-exact.
- **Vitals identity at rest.** Round-trip of a vital as a first-class fact needs an `id`; export has only `sample_key`. Whether to backfill `id` into `vitals.jsonl` on export is an open question tied to Issue 01's `VitalSample.id` question.

## Reconciliation register

| Item | Posture | Note |
| --- | --- | --- |
| NDJSON+Markdown as fixture/export/archive | `adopt` | ADR 018 point 4 |
| Field → export-key crosswalk (3 shapes) | `adopt` | Documents existing layout; no rewrite |
| Round-trip assertion (patient_001 / patient_002) | `adopt` | Regression + demo |
| `integrity` / `revises` hash / vitals `id` / `references` gaps | `open-question` / `defer` | Owned by Issues 08/09/01/07; marked as gaps, not invented here |
| Lossy-export field policy | `open-question` | PRD permits lossier export; required-in-export set not enumerated |
| Generated UI / design assets / report visuals as authority | `reject` | ADR 018 points 5–7; report visuals are evidence |
