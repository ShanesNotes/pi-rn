# A5 open-schema entries — Intake & Output + Lines/Tubes/Drains

These entries are staged for later merge into `clinical-reference/phase-a/OPEN-SCHEMA-QUESTIONS.md`. They use the durable-home shape required by the Phase A template.

## A5. Intake & Output + Lines/Tubes/Drains

### a5-lda-identity-and-addressability

- **Question:** Should active LDAs be referenced by canonical event ids, stable `data.lda_key` values, deterministic `lda://` URIs, or some combination?
- **Context:** A5 needs to tie together placement, active in-service interval, site/patency assessment, output measurements, setting changes, and removal. Event ids alone are precise but awkward when an open interval is later superseded to close it; a local `lda_key` is easy but has no global URI grammar; a `lda://` URI would align with `vitals://`, proposed `meddose://`, and `homemed://` addressability patterns. The stress case is a Foley whose presence gates canonical urine output and whose interval is closed by supersession at removal.
- **Options:**
  1. Event id only — cite the current authoritative `observation.lda_presence` event. Simple, no new URI grammar, but supersession makes long-lived references brittle.
  2. `lda_key` only — each `lda_presence` event carries a stable key such as `foley_001`; child events reference the key. Easy for fixtures, but weak validator semantics across encounters/imports.
  3. Deterministic `lda://` URI — e.g. `lda://enc_001/foley_001`, with `lda_key` as the payload source. Strong addressability and consistent with other window/key URI patterns, but adds a new URI family.
- **Researcher's lean:** Option 3 with `data.lda_key` retained as the human-readable local key. The URI is the evidence/addressability surface; the key is the payload anchor. No new event type is required.

### a5-io-measurement-intervals-and-addressability

- **Question:** Should `observation.io_measurement` be allow-listed for `effective_period`, and should I&O windows be cited with deterministic `io://` URIs?
- **Context:** Many I&O values are not point measurements; they are totals over a period: urine from 09:00–10:00, JP drain output over a shift, tube-feed volume over four hours, or net intake over 24 hours. ADR 005 intentionally moves interval truth into the envelope instead of `data.start/end` conventions, but current allow-lists were created before A5. Assessments also need to cite I&O windows without materializing every derived total as a stored event.
- **Options:**
  1. Point-only observations with `data.period_start/end`. Avoids ADR 005 amendment but recreates the data-convention problem ADR 005 was designed to prevent.
  2. Allow `effective_period` on `observation.io_measurement`; cite individual events by id and derived windows by query parameters. Correct interval semantics but still lacks a durable window-ref grammar.
  3. Allow `effective_period` and add `io://` URI grammar for windows and derived metrics, e.g. `io://enc_001?category=urine&from=...&to=...` or `io://enc_001?metric=net_balance_ml&from=...&to=...`.
- **Researcher's lean:** Option 3. Use `effective_period` for charted interval volumes and `io://` for evidence windows/derived metrics. Keep `observation.io_measurement` as an existing `observation` subtype; no new storage primitive.

### a5-derived-fluid-balance-canonical-assessment

- **Question:** When does a derived running balance become canonical chart truth rather than a disposable projection?
- **Context:** A5 explicitly treats 24-hour net balance as derived, not stored by default. However, clinicians often write assessments such as “net positive 3 L with worsening oxygenation” or “poor urine output despite fluids,” and those statements are clinically canonical because they drive decisions. Legacy EHRs also sometimes store shift/24h totals as rows, especially on import.
- **Options:**
  1. Never store balance totals; only compute them in views. Clean but prevents evidence-chain traversal for clinically meaningful balance interpretations.
  2. Store every shift/24h total as `observation.io_measurement` or `observation.fluid_balance`. Easy to render but duplicates derived state and risks drift.
  3. Store derived balance only when imported as legacy aggregate with explicit provenance, or when a clinician/agent writes an `assessment.fluid_balance` that cites the `io://` window and explains clinical significance.
- **Researcher's lean:** Option 3. Derived balance remains a view by default. It becomes canonical as an assessment when it changes interpretation, handoff, or plan. Imported aggregate totals are allowed only with source metadata and should not override reconstructible balance from atomic events without review.

### a5-medication-fluid-volume-ownership

- **Question:** How should A4 medication/fluid administration volumes count toward A5 balance without duplicating medication truth?
- **Context:** IV antibiotics, carrier fluids, flushes, blood products, diluent, tube feeds, and continuous infusions may originate in A4 MAR actions or fluid orders. A5 needs the volume for I&O balance, but A4 owns drug/dose/route/order fulfillment. If A5 writes a separate “vancomycin 250 mL intake” row without referencing A4, the chart now has duplicate and potentially conflicting medication truth.
- **Options:**
  1. A4 actions carry optional I&O-countable volume metadata; A5-derived balance consumes those actions directly. Minimal duplication but requires A4 payload support.
  2. A5 writes `observation.io_measurement` rows for every medication/fluid volume, each citing the A4 action. Strong I&O ledger but higher event volume and duplicate volume-edit surface.
  3. Hybrid: consume A4 volume metadata when present; write A5 I&O rows only for non-medication volumes or imported legacy aggregate rows where the underlying A4 action is unavailable.
- **Researcher's lean:** Option 3. Medication truth remains A4. A5 owns fluid accounting and may cite A4 actions, but it should not duplicate drug/dose semantics. Validator should warn when an A5 volume duplicates A4 without a `source_action_ref` or `links.supports` reference.

### a5-active-device-axis-and-device-source-kinds

- **Question:** Should `currentState` gain `axis:"lda_devices"`, and do automated urimeters, pumps, chest-drain systems, or feeding pumps require new `source.kind` values?
- **Context:** A3/A4/A4b already surfaced a cross-artifact currentState-axis pattern (`context`, `medications`, `home_medications`). A5 adds a strong “what devices are active right now?” read. At the same time, device-output sources may be nurse-charted, imported, or eventually interfaced. ADR 006 warns against inventing new source kinds without owner review.
- **Options:**
  1. No new axis or source kinds. Agents reconstruct active devices via `timeline()` and use existing `nurse_charted` / import kinds. Minimal schema, but boilerplate and inconsistent with the emerging currentState-axis pattern.
  2. Add `currentState(axis:"lda_devices")` only; keep existing source kinds and represent device/interface details in `source.ref`, `data.method`, or `artifact_ref`. Gives agents a stable read without source-kind sprawl.
  3. Add both `currentState(axis:"lda_devices")` and new device/interface source kinds such as `urimeter_interface`, `smart_pump_interface`, or `drain_device_interface`. Most expressive but risks premature source-kind entropy.
- **Researcher's lean:** Option 2 for Phase A. Add or defer the axis as part of the broader currentState-axis ADR. Do not amend ADR 006 for A5 device source kinds until real fixture/import data proves that `nurse_charted`, `poc_device`, `monitor_extension`, `source.ref`, and `artifact_ref` cannot carry the provenance distinction.
