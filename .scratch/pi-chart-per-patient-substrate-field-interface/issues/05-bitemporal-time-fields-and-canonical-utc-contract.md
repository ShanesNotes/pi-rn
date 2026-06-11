# Bitemporal time fields + canonical-UTC contract

Status: completed
Type: AFK (spec artifact — field-definition doc, not a source edit)
Reconciliation posture: `adopt` (bitemporal backbone is the model's strongest part — keep it; impose only canonical-UTC + store-owned marking)
PRD user stories covered: 1, 10, 11, 12

## Parent

`.scratch/pi-chart-per-patient-substrate-field-interface/PRD.md`

Deliverable: `field-specs/05-bitemporal-time.md`

## Companion / authoritative inputs

- Current field model: `pi-chart/src/types.ts` (`effective_at` XOR `effective_period`, `recorded_at`, `VitalSample.sampled_at`)
- Bitemporal helper: `pi-chart/src/time.ts:117` (`eventCoversAsOf`) + supersession
- Kernel Claim target: `pi-ledger/docs/ledger-core-public-interface.md` (`time::CanonicalTimestamp`, `time::ValidTimeExpression`; store-assigned Known time/sequence/batch id/hashes)
- Clinician vocabulary: `.scratch/pi-chart-per-patient-substrate-field-interface/clinician-facing-terminology-map.md` (Occurred / Charted / Last charted / Effective / As of)
- Scaling runtime (ACCEPTED NORTH STAR, ADR-promoted): `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md`

## What to build (spec, not implementation)

Define the **bitemporal time** sub-slice: `time.valid` (instant XOR interval), `time.recorded_at`, the four clinician time labels (Occurred / Charted / Effective / As-of), the canonical-UTC contract value, and the store-owned never-emit set. This is the model's strongest existing part — the spec **keeps** it and imposes only canonicalization + the store-owned marking (PRD Further Notes: "Bitemporal backbone is the model's strongest part — keep it").

This is a SPEC artifact: no source edits, no adapter, no Rust↔TS mechanism, no normalization implementation (the adapter owns normalization).

### Field spec

| Field (contract) | Canonical-memory role | Clinician-facing label(s) | Current pi-chart representation | Kernel-Claim target | Posture |
| --- | --- | --- | --- | --- | --- |
| `time.valid` (instant) | Clinical/valid time — when the fact is true in the world | **Occurred**; **Effective**; **As of** (visibility anchor) | `EventEnvelope.effective_at: string` (instant); `VitalSample.sampled_at` | `time.valid` **instant** (`time::ValidTimeExpression`) | `adopt` |
| `time.valid` (interval) | Clinical/valid time over a span | **Effective** (period); **As of** | `EventEnvelope.effective_period.{start, end?}` (interval; XOR with `effective_at`) | `time.valid` **interval** (`end >= start`; instant XOR interval) | `adopt` |
| `time.recorded_at` | Transaction time — when the fact entered the chart | **Charted**; **Last charted** | `EventEnvelopeBase.recorded_at` / `NoteFrontmatter.recorded_at` / `VitalSample.recorded_at?` | `time.recorded_at` (**direct** map; caller-set is permitted) | `adopt` |

### The instant-XOR-interval contract

`time.valid` is **exactly one of** an instant or an interval — never both, never neither. This already holds in `types.ts` via the discriminated union `{ effective_at } | { effective_period }`. The spec affirms it and maps it to the kernel's instant-XOR-interval `ValidTimeExpression`. For intervals, `end >= start` (kernel rule); an open-ended interval (`end` absent) is permitted and means "still effective" (consistent with `eventCoversAsOf` returning visible when `end === null`).

### The four time labels (all projections over the two fields)

| Clinician label | Derived from | Meaning |
| --- | --- | --- |
| **Occurred** | `time.valid` (instant, or interval start) | When the clinical event happened in the world |
| **Effective** | `time.valid` (instant or interval) | When an order/policy/finding is/was in force |
| **Charted / Last charted** | `time.recorded_at` | When it was documented into the chart |
| **As of** | the read's `asOf` vs `time.valid`/supersession (`eventCoversAsOf`) | View freshness — what is live as of t |

"As of" is **not a stored field** — it is the read parameter (`asOf`) intersected with `time.valid` and supersession via `eventCoversAsOf` (a fact is visible when `start <= asOf` and (`end` absent OR `end >= asOf`)). The spec keeps this "live as of t" machinery unchanged; it is the bitemporal backbone the PRD preserves. Bitemporal terminology (`valid`/`recorded`) stays out of normal UI copy per the terminology map; clinicians see Occurred/Charted/Effective/As of, with detail in the Source trail.

### Hard requirement — canonical UTC `YYYY-MM-DDTHH:MM:SSZ`

Every chart timestamp's **contract value** is canonical UTC:

- Exactly **20 characters**, format `YYYY-MM-DDTHH:MM:SSZ`, trailing literal `Z`, a valid calendar date/time.
- **No** UTC offsets (`-05:00`), **no** fractional seconds (`.123`), **no** zone names (`America/Chicago`).

The kernel's `time.rs` **rejects** non-canonical timestamps — it does **not** normalize them. Current chart strings violate this: e.g. `pi-chart/src/read.test.ts` carries `'2026-04-18T08:05:00-05:00'` (offset), and `SystemRegistry.default_timezone` / `ChartMeta.timezone` exist precisely because chart times are zoned today. Therefore:

- The **field contract value** is canonical UTC.
- **Normalization is the adapter's job** (out of scope here) — the adapter converts zoned/fractional chart strings to canonical UTC before kernel entry. The field spec only declares canonical UTC as the contract value; it does not implement the converter.
- A fact whose timestamps cannot be re-emitted as canonical UTC is **not** kernel-admissible (mirror of `CanonicalTimestamp` rejection).

### Store-owned, must-not-emit (K3-assigned)

The kernel's Append-ledger step (`AppendLedger::append_admissible` / `append_revision_admissible`) assigns these — the caller **must not** emit any field mapping to them (kernel rejects caller-supplied store metadata; the public interface states "callers do not set accepted metadata on Claims"):

| Store-owned field | Owner | Chart must… |
| --- | --- | --- |
| `accepted_at` (Known time) | `StoreClock` inside Append ledger | …never surface a field mapping to it |
| `seq` (sequence) | Append ledger | …never emit |
| `batch_id` | Append ledger | …never emit |
| Record hash / Entry hash / prev-link / head | Append ledger (`record_hash`, `EntryHash`) | …never emit as authored time metadata (the correction-target Record hash is a *separate* concern — see Issue 09) |

**Caller-set is fine:** the chart's own `id` and `recorded_at` are caller-supplied and permitted. The line is: *valid/recorded time the chart asserts* = caller-set; *accepted time/sequence/batch/chain the store assigns* = K3-owned, never-emit.

### At scale (multi-provider, multi-agent, high-volume)

- The **bitemporal split is what makes concurrent multi-agent authorship coherent**: many agents/providers can record (`recorded_at`) corrections and observations about the same valid-time window without racing, because each fact carries its own valid time and the store assigns total order (`seq`) on accept. "Live as of t" is then a deterministic projection regardless of authoring concurrency.
- Store-owned ordering (`seq`/`accepted_at`/head) **must** stay store-assigned precisely so that high-volume concurrent appends get one authoritative total order — a caller-supplied sequence would race. This is why the never-emit rule is load-bearing at scale, not just a tidiness rule.
- Canonical UTC removes per-provider/per-site timezone ambiguity across a multi-provider corpus — one wall-clock language for all facts, so cross-provider ordering and `asOf` reads are unambiguous.
- The store that assigns `seq`/`accepted_at`/head at volume is the **accepted north star, ADR-promoted** shared clinical-truth service (private/local gRPC/UDS first transport; append-only WAL/log first storage) — `.scratch/pi-chart-pi-ledger-adapter-strategy/clinical-truth-service-decision-proposal.md` (accepted north star). Many entry points may submit concurrently, but one patient-scoped service path assigns the authoritative order.

## Acceptance criteria

- [ ] Doc defines `time.valid` (instant XOR interval) and `time.recorded_at` with role, clinician label, current pi-chart source, and kernel target.
- [ ] Maps the four labels Occurred / Charted (Last charted) / Effective / As-of to the two fields + `asOf`/supersession; affirms `eventCoversAsOf` "live as of t".
- [ ] States the canonical-UTC `YYYY-MM-DDTHH:MM:SSZ` contract value (20 chars, trailing `Z`, valid calendar).
- [ ] States non-canonical times (offset/fractional/zone) are **rejected, not normalized** by the kernel, and that normalization is the adapter's job (out of scope).
- [ ] Lists the store-owned never-emit set (`accepted_at`/`seq`/`batch_id` + Record/Entry hash/prev-link/head) and states the chart must not emit them; affirms caller-set `id`/`recorded_at` are fine.
- [ ] Interval rule `end >= start`; open-ended interval permitted (still-effective).
- [ ] Scaling note: bitemporal split enables concurrent authorship; store-assigned patient-scoped total order required at volume; citing the accepted ADR-promoted service north star.
- [ ] States no source edit, no adapter implementation, no Rust↔TS mechanism, no kernel widening.

## Blocked by

- (none — independently grabbable; `adopt` posture)

## Open questions for the architect

- **Zoned-source representation in the fixture/export format.** Canonical UTC is the *contract* value, but the retained export format (Issue 13) currently stores zoned strings + `default_timezone`/`timezone` meta. Whether the export keeps the original zoned string (lossless round-trip, adapter normalizes on the way to the kernel) or stores canonical UTC at rest is an open question — surfaced, not decided. PRD posture: export may be "lossier or differently keyed" but must round-trip; the cleanest read is *keep the zoned source string in export, declare canonical UTC as the kernel-facing contract value.*
- **`accepted_at` echo on read.** Once the store assigns `accepted_at`/`seq`, a read path may legitimately *display* them (As-of / Charted detail). The never-emit rule is about authoring, not reading. The spec should confirm display-on-read is permitted while authoring them is forbidden — flagged for the architect.

## Reconciliation register

| Item | Posture | Note |
| --- | --- | --- |
| `time.valid` instant XOR interval | `adopt` | Already a discriminated union; direct kernel map |
| `time.recorded_at` | `adopt` | Direct kernel map; caller-set permitted |
| Occurred/Charted/Effective/As-of labels | `adopt` | Projections; no new truth |
| Canonical-UTC contract value | `adopt` | Kernel rejects non-canonical; adapter normalizes (deferred) |
| `accepted_at`/`seq`/`batch_id`/hashes never-emit | `adopt` | K3 store-owned |
| Export zoned-string vs canonical-at-rest | `open-question` | Round-trip vs normalize-at-rest not decided |
