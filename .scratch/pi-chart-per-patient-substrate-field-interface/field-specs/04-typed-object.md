# Field spec 04 — typed `object` per predicate

Status: completed
Issue: `issues/04-typed-object-per-predicate-replacing-magic-key-data.md`
Posture: `revise`

## Field

`object: Object` — typed per `predicateId`; replaces schema-less `data: Record<string, unknown>`.

Kernel target: `Claim.object` via `validate_object` → `MissingObjectField` / `InvalidObjectField`.

Loose `data` retained in fixture/export only (ADR 018); contract is typed object (Issue 13 round-trip).

`encounterId: String` is an **object** RequiredField on every clinical predicate (not kernel subject).

## Per-predicate RequiredFields

Full table: see `issues/04-typed-object-per-predicate-replacing-magic-key-data.md` lines 41–65.

Key examples:
- `vital.sign`: `code`, `value`, `unit`, `encounterId`
- `assessment.problem`: `name`, `encounterId` (+ optional uncertainty fields)
- `order.request` / `order.verbal`: `name`, `encounterId`
- `review.*` / `attestation.*`: `action`, `encounterId` — separate act facts (Issue 10)

## Magic-key disposition

Every `data.*` key is accounted-for or explicitly deferred — see issue disposition table (lines 71–100). Hidden-sim keys (`hidden_lung_fluid_ml`, `runtime_note`) **rejected** as substrate.

## Scaling

Per-fact `validate_object` scales with concurrent writers. Object growth via optional fields + append-only correction.

North star: clinical-truth service (ADR-promoted).