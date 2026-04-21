# pi-agent chart-tools extension — interface spec

**Status**: spec only. No extension code lives in `pi-agent/.pi/extensions/` yet. This document captures the contract a future `chart` extension must honor so that the underlying `pi-chart/` API surface stays the integration point of design rather than the integration point of expediency.

**Why deferred**: per the user's Phase E guidance — pi-chart is still the subsystem being shaped. Writing extension code now would freeze tool surfaces, error formats, and idempotency behavior before pi-chart has been used in anger. This spec keeps the design while pi-chart and pi-sim are both in context, and defers the actual implementation until after pi-chart promotion has been exercised.

---

## Scope

A single Pi extension that exposes pi-chart operations to the agent LLM as tools. The extension is a thin shim over `pi-chart/src/index.ts`. It **does not**:

- expose raw filesystem access (no read/write outside pi-chart's API)
- mutate prior events (immutability is enforced by `pi-chart`; the extension doesn't add a back door)
- modify schemas or scripts under `pi-chart/`
- read from `pi-sim` (that's a separate ingest path — see `pi-monitor-ingest-spec.md`)

## Tool inventory

Naming convention: `chart_<verb>_<noun>` (snake_case, matches Pi extension idioms; mirrors the underlying TS API in 1:1 correspondence).

### Read tools (idempotent, side-effect-free)

| Tool | Calls | Returns |
|------|-------|---------|
| `chart_read_patient_context` | `readPatientContext(chartRoot)` | `{ "patient.md"?, "constraints.md"?, encounter? }` |
| `chart_read_active_constraints` | `readActiveConstraints(chartRoot)` | `{ structured: ConstraintsBlock \| null, body: string }` |
| `chart_read_recent_events` | `readRecentEvents({ chartRoot, withinMinutes?, types?, asOf? })` | `EventEnvelope[]` |
| `chart_read_recent_notes` | `readRecentNotes({ chartRoot, limit? })` | `Array<{ path, frontmatter, body }>` |
| `chart_read_latest_vitals` | `readLatestVitals(chartRoot)` | `Record<string, VitalSample>` |

### Write tools (state-changing)

| Tool | Calls | Returns | Failure modes |
|------|-------|---------|---------------|
| `chart_append_event` | `appendEvent(event, { chartRoot })` | `{ id }` | Throws if missing envelope or clinical-required fields. |
| `chart_write_note` | `writeNote(...)` | `{ path }` | Throws if target path exists (append-only). |
| `chart_write_communication_note` | `writeCommunicationNote(...)` | `{ notePath, eventId }` | Same as above; produces both artifacts atomically. |
| `chart_write_artifact_ref` | `writeArtifactRef(...)` | `{ id }` | None expected besides FS errors. |

### Maintenance tools

| Tool | Calls | Returns |
|------|-------|---------|
| `chart_rebuild_derived` | `rebuildDerived(chartRoot)` | `{ ok: true }` |
| `chart_validate` | `validateChart(chartRoot)` | `ValidationReport` (`{ ok, errors, warnings }`) |

## Per-tool contracts

### Inputs

- All tools accept `chartRoot` implicitly — the extension binds it from a configured environment value (e.g. `PI_CHART_ROOT`) at registration time. The LLM never names a path. This prevents the agent from probing arbitrary filesystem locations.
- All other inputs are passed as a single JSON object; the extension validates them against a tool-input JSON Schema derived (where possible) from the same `pi-chart/schemas/` files. Mismatched input → tool returns a structured error, not a thrown exception.

### Outputs

- Read tools return JSON-serializable objects exactly as the underlying TS API returns them.
- Write tools return the minimal pointer (`id` and/or `path`) the agent needs to follow up. They do **not** return the full event back to the agent — keeps token use predictable.
- `chart_validate` returns the full `ValidationReport`. Tool callers that only want the boolean can read `ok`.

### Idempotency

- **Read tools**: pure; safe to call repeatedly.
- **`chart_append_event`**: not idempotent. The agent must not retry on a successful return. If the call rejects (e.g. provenance check failed), no event is written.
- **`chart_write_note` / `chart_write_communication_note`**: not idempotent; second call to the same `(effective_at, slug)` pair raises `already exists`. The agent must use a distinct slug or supersede the prior note.
- **`chart_rebuild_derived`**: idempotent (deterministic against unchanged content).
- **`chart_validate`**: idempotent.

### Validation expectations

- Write tools do **not** call `validateChart` after each append — that's a per-decision-cycle responsibility. The extension exposes `chart_validate` so the agent can call it explicitly at cycle boundaries.
- A validation tool that returns `ok: false` should not be silently dismissed by the agent; the extension does **not** itself enforce the agent must validate. That's a system-prompt concern (`SYSTEM.md` or `AGENTS.md`).

## Permission model

- Read tools: auto-approved (no permission prompt).
- Write tools: require user/permission gate. Default: prompt on first call, allow per-session.
- `chart_validate`: auto-approved.
- `chart_rebuild_derived`: auto-approved (overwrites only `_derived/`).

These map to Pi's permission categories — the extension declares each tool's required scope at registration so the harness can route them correctly.

## Error surface

Tool errors are returned as `{ error: { code, message, details? } }` not thrown. Codes:

| Code | Trigger |
|------|---------|
| `MISSING_PROVENANCE` | `appendEvent` rejected required-fields check. `details.missing` lists the fields. |
| `CLINICAL_REQUIRED` | clinical event missing `encounter_id`/`certainty`/`data`/`links`. |
| `NOTE_OVERWRITE` | `writeNote` target already exists. `details.path` echoes target. |
| `INVALID_INPUT` | tool input failed input-schema validation (independent of underlying API). |
| `IO_ERROR` | underlying filesystem failure (ENOSPC, EACCES, etc.). |
| `INTERNAL` | anything else; includes original `message`. |

The tool **never** lets a raw stack trace cross the agent boundary.

## Stability assumptions

The extension is a stable thin shim if and only if these pi-chart APIs hold:

- public types in `pi-chart/src/types.ts` are stable
- `appendEvent` continues to throw on missing provenance (not return error objects)
- `validateChart` returns `{ ok, errors, warnings }`
- `vitals://` URI grammar in `links.supports[]` does not change
- `chart.yaml.subject` continues to be the subject-match anchor

If any of these change, the extension's tool contracts change accordingly — bump the extension version.

## Open questions to resolve before implementing

1. **`chart_validate` return shape size**: full report can be hundreds of lines on an unhealthy chart. Should the tool offer a `summary: true` option that returns just `{ ok, error_count, warning_count, sample_errors[:5] }`? Probably yes; defer until first real use.
2. **Auto-rebuild after append?** Some agents expect derived views to reflect their writes within the same decision cycle. Either (a) `chart_append_event` triggers `rebuildDerived` automatically, or (b) the agent calls `chart_rebuild_derived` explicitly. Default: (b), with a doc note that `_derived/` is stale until rebuild. Revisit if (a) becomes a friction point.
3. **`chart_read_recent_events` token budget**: large windows can blow up context. Cap at e.g. 50 events with a documented truncation flag, or trust the agent's `withinMinutes`?
4. **Error code stability**: codes above are draft. Lock when extension lands.
5. **Write tool permission scope**: per-call vs per-session vs always-allow. Default per-session feels right but should be Pi-platform-confirmed.
6. **`chartRoot` discovery**: env var (`PI_CHART_ROOT`), settings file (`.pi/settings.json`), or hardcoded relative? Default: env var with fallback to `process.cwd()/pi-chart`.

## Out of scope (do not put in this extension)

- chart→sim communication of any kind (the sim is hidden from the agent)
- editing structural files (`patient.md`, `constraints.md`, `chart.yaml`) — those are physician/admin authored
- multi-patient routing (single chart per session in v0)
- direct access to `_derived/*.md` paths — agents read derived through the same `chart_read_*` tools so the abstraction holds
- importing any pi-sim module

---

## When to revisit this spec

After at least one full simulated shift run end-to-end against the promoted `pi-chart/`. Real friction points (or absence thereof) will determine whether the inventory above is right-sized or needs splitting/merging.
