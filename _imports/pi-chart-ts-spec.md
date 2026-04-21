# pi-chart TypeScript port specification

This document specifies the TypeScript port of `_imports/pi-chart-claude/pi-chart/`. Phase D builds the spec verbatim into `_imports/pi-chart-ts/`. Phase E1 then promotes it to `pi-chart/`.

The Python scaffold has already been hardened to v0.1 (validator green, all 7 council priorities applied) and is the **reference implementation**. The TS port reproduces its behavior with TS-idiomatic ergonomics: async/Promise APIs, immutable inputs, structured return types, no subprocess for derived rebuild.

## Reference points

- Hardened design ref: `_imports/pi-chart-claude/pi-chart/`
- Optimization manifest: `_imports/pi-chart-v0.1-spec.md`
- Original review: `_imports/pi-chart-scaffold-optimizations.md`
- Toolchain to mirror: `pi-sim/` (tsx, ESM, Node 22+, js-yaml, atomic writes via tmp+rename)

---

## C1. Toolchain

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Module system | ESM (`"type": "module"`) | Matches pi-sim and pi-agent. |
| Node target | Node 22+ via `@types/node ^22` | Matches pi-sim. |
| TS execution | `tsx ^4.19` (no build step) | Matches pi-sim. CLI scripts run `tsx scripts/<name>.ts`. |
| Imports | `.js` extensions | ESM convention; matches pi-sim. |
| Test runner | `node:test` (built-in) | Zero new deps; preserves pi-sim's "no test framework" minimalism. |
| Lint/format | none in v0 | Matches pi-sim; revisit if collaboration grows. |
| `tsconfig.json` | omit in v0 | tsx handles. Add later if pre-publish d.ts generation is needed. |

## C2. Dependencies

```json
{
  "dependencies": {
    "ajv": "^8.17.0",
    "ajv-formats": "^3.0.1",
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0"
  }
}
```

Rationale:

- **ajv + ajv-formats**: industry-standard JSON-Schema validator with built-in `date-time` format support (covers the optimization report's "FormatChecker" recommendation). Strict mode + format-validation enabled.
- **js-yaml**: same library and major version pi-sim uses.
- **tsx**: matches pi-sim's runner.
- **node:test**: built-in; no `vitest`/`jest` dep needed for the v0 acceptance suite.

## C3. Module layout

```
_imports/pi-chart-ts/
├── package.json
├── README.md                  (mirror Python README; TS examples inline)
├── CLAIM-TYPES.md             (mirror Python; same content)
├── chart.yaml                 (carry from hardened Python)
├── patient.md                 (carry)
├── constraints.md             (carry; structured frontmatter intact)
├── .gitignore                 (mirror Python; _derived/*.md ignored)
├── src/
│   ├── index.ts               # public API re-exports
│   ├── types.ts               # TS types mirroring schemas
│   ├── fs-util.ts             # atomic write, frontmatter parser, ndjson reader
│   ├── schema.ts              # ajv compile + cached validators
│   ├── time.ts                # Clock interface; latestEffectiveAt
│   ├── evidence.ts            # vitals:// URI parse/format
│   ├── read.ts                # query API
│   ├── write.ts               # write API with contracts
│   ├── derived.ts             # rebuildDerived (INLINE; no subprocess)
│   ├── validate.ts            # validateChart returning structured Report
│   ├── *.test.ts              # node:test suites colocated with source
├── schemas/
│   ├── event.schema.json      (carry verbatim)
│   ├── note.schema.json       (carry verbatim)
│   ├── constraints.schema.json (carry verbatim)
│   └── vitals.schema.json     (carry verbatim)
├── scripts/
│   ├── validate.ts            # thin CLI over src/validate.ts
│   └── rebuild-derived.ts     # thin CLI over src/derived.ts
├── timeline/
│   └── 2026-04-18/
│       ├── encounter_001.md   (carry)
│       ├── events.ndjson      (carry; includes vitals:// URI)
│       ├── vitals.jsonl       (carry; full provenance shape)
│       └── notes/
│           └── 0845_nursing-note.md (carry)
├── artifacts/README.md        (carry)
└── _derived/README.md         (carry; *.md ignored by .gitignore)
```

## C4. Type definitions (`src/types.ts`)

Hand-written to mirror schemas. Schemas remain runtime source-of-truth; types are an ergonomic projection.

```ts
export type ClinicalType =
  | "observation" | "assessment" | "intent"
  | "action" | "communication" | "artifact_ref";

export type StructuralType = "subject" | "encounter" | "constraint_set";

export type EventType = ClinicalType | StructuralType;

export type Certainty = "observed" | "reported" | "inferred" | "planned" | "performed";

export type Status = "draft" | "active" | "final" | "superseded" | "entered_in_error";

export interface Author {
  id: string;
  role: string;
  run_id?: string;
}

export interface Source {
  kind: string;
  ref?: string;
}

export interface Links {
  supports?: string[];      // event ids OR vitals:// URIs
  supersedes?: string[];
  corrects?: string[];
}

/** Base envelope for all events (clinical + structural). */
export interface EventEnvelope {
  id: string;
  type: EventType;
  subtype?: string;
  subject: string;
  encounter_id?: string;
  effective_at: string;     // ISO 8601 date-time
  recorded_at: string;
  author: Author;
  source: Source;
  certainty?: Certainty;
  status: Status;
  data?: Record<string, unknown>;
  links?: Links;
}

/** Clinical events require encounter_id, certainty, data, links. */
export interface ClinicalEvent extends EventEnvelope {
  type: ClinicalType;
  encounter_id: string;
  certainty: Certainty;
  data: Record<string, unknown>;
  links: Links;
}

/** Input to appendEvent — id and recorded_at filled in if absent. */
export type EventInput = Omit<EventEnvelope, "id" | "recorded_at"> & {
  id?: string;
  recorded_at?: string;
};

export interface NoteFrontmatter {
  id: string;
  type: "communication";
  subtype?: string;
  subject: string;
  encounter_id: string;
  effective_at: string;
  recorded_at: string;
  author: Author;
  source: Source;
  references: string[];
  status: Status;
}

export type NoteFrontmatterInput =
  Omit<NoteFrontmatter, "id" | "recorded_at" | "references"> & {
    id?: string;
    recorded_at?: string;
    references?: string[];
  };

export interface VitalSample {
  sampled_at: string;
  subject: string;
  encounter_id: string;
  source: Source;
  name: string;
  value: number | string | boolean;
  unit?: string;
  context?: Record<string, unknown>;
  quality?: "valid" | "questionable" | "invalid";
  artifact?: string;
}

export type CodeStatus =
  | "full_code" | "dnr" | "dni" | "dnr_dni" | "comfort_only" | "unspecified";

export interface AllergyEntry {
  substance: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe" | "anaphylaxis" | "unknown";
  source?: string;
  status: "active" | "inactive" | "entered_in_error";
}

export interface ConstraintsBlock {
  allergies?: AllergyEntry[];
  code_status?: CodeStatus;
  preferences?: string[];
  access_constraints?: string[];
  advance_directive?: string;
}

export interface ChartMeta {
  chart_id?: string;
  chart_version?: string;
  schema_version?: string;
  subject: string;
  mode?: "simulation" | "production";
  clock?: "sim_time" | "wall_time";
  sim_start?: string;
  created_at?: string;
  timezone?: string;
}

export interface ReportEntry {
  where: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  errors: ReportEntry[];
  warnings: ReportEntry[];
}
```

## C5. `fs-util.ts`

```ts
import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import yaml from "js-yaml";

/** Atomic write: <target>.tmp.<rand> then rename. Mirrors pi-sim. */
export async function atomicWriteFile(target: string, data: string | Buffer): Promise<void> {
  const tmp = `${target}.tmp.${randomBytes(6).toString("hex")}`;
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, target);
}

/** Append a single line to events.ndjson; POSIX append is atomic per write. */
export async function appendNdjsonLine(path: string, obj: unknown): Promise<void> {
  await fs.appendFile(path, JSON.stringify(obj) + "\n");
}

/** Split markdown into (frontmatter, body). Returns [null, text] if absent. */
export function parseFrontmatter(text: string): [Record<string, unknown> | null, string] {
  if (!text.startsWith("---")) return [null, text];
  const end = text.indexOf("\n---", 3);
  if (end === -1) return [null, text];
  const fmText = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n+/, "");
  const data = yaml.load(fmText) as Record<string, unknown> | null;
  return [data && typeof data === "object" ? data : null, body];
}

/** Stream a .ndjson / .jsonl file as `[lineno, parsed]` tuples. */
export async function* iterNdjson(filePath: string): AsyncGenerator<[number, any]> {
  const text = await fs.readFile(filePath, "utf8");
  let lineno = 0;
  for (const raw of text.split("\n")) {
    lineno++;
    const line = raw.trim();
    if (!line) continue;
    yield [lineno, JSON.parse(line)];
  }
}
```

## C6. `schema.ts`

```ts
import Ajv, { ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { promises as fs } from "node:fs";
import path from "node:path";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);          // enforces date-time, etc.

const cache = new Map<string, ValidateFunction>();

export async function loadValidator(chartRoot: string, name: string): Promise<ValidateFunction> {
  const key = path.join(chartRoot, name);
  if (cache.has(key)) return cache.get(key)!;
  const text = await fs.readFile(path.join(chartRoot, "schemas", name), "utf8");
  const schema = JSON.parse(text);
  const fn = ajv.compile(schema);
  cache.set(key, fn);
  return fn;
}

/** ajv error → ReportEntry. */
export function ajvErrorsTo(where: string, errs: any[] | null | undefined) {
  return (errs ?? []).map((e: any) => ({
    where,
    message: `${e.instancePath || "(root)"}: ${e.message}`,
  }));
}
```

## C7. `time.ts`

```ts
import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { iterNdjson } from "./fs-util.js";

export interface Clock {
  now(): Promise<Date>;
}

export class WallClock implements Clock {
  async now(): Promise<Date> { return new Date(); }
}

export class SimClock implements Clock {
  constructor(private chartRoot: string) {}
  async now(): Promise<Date> {
    return (await latestEffectiveAt(this.chartRoot)) ?? new Date();
  }
}

export async function chartClock(chartRoot: string): Promise<Clock> {
  const meta = await loadChartMeta(chartRoot);
  return meta.clock === "wall_time" ? new WallClock() : new SimClock(chartRoot);
}

export async function loadChartMeta(chartRoot: string) {
  const p = path.join(chartRoot, "chart.yaml");
  const data = yaml.load(await fs.readFile(p, "utf8")) as any;
  return data ?? {};
}

/** Max effective_at across events plus max sampled_at across vitals. */
export async function latestEffectiveAt(chartRoot: string): Promise<Date | null> {
  let best: Date | null = null;
  const evGlob = await glob(chartRoot, "timeline/*/events.ndjson");
  for (const p of evGlob) {
    for await (const [, ev] of iterNdjson(p)) {
      const t = parseIso(ev.effective_at);
      if (t && (!best || t > best)) best = t;
    }
  }
  const vGlob = await glob(chartRoot, "timeline/*/vitals.jsonl");
  for (const p of vGlob) {
    for await (const [, v] of iterNdjson(p)) {
      const t = parseIso(v.sampled_at);
      if (t && (!best || t > best)) best = t;
    }
  }
  return best;
}

export function parseIso(s: unknown): Date | null {
  if (typeof s !== "string") return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Tiny glob: `timeline/*/events.ndjson` style. */
async function glob(root: string, pattern: string): Promise<string[]> {
  // Implement using fs.readdir; full glob library is unnecessary for our two
  // shapes (`timeline/*/events.ndjson`, `timeline/*/vitals.jsonl`,
  // `timeline/*/notes/*.md`, `timeline/*/encounter_*.md`).
  const [base, mid, leaf] = pattern.split("/");
  const baseDir = path.join(root, base);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(baseDir);
  } catch { return []; }
  const out: string[] = [];
  for (const day of entries) {
    const dayDir = path.join(baseDir, day);
    const stat = await fs.stat(dayDir);
    if (!stat.isDirectory()) continue;
    if (leaf === "events.ndjson" || leaf === "vitals.jsonl") {
      const p = path.join(dayDir, leaf);
      try { await fs.access(p); out.push(p); } catch { /* skip */ }
    } else if (leaf.includes("*")) {
      // e.g. `notes/*.md` or `encounter_*.md`
      // not used by latestEffectiveAt; expand if needed by callers.
    }
  }
  return out;
}
```

The simple glob is sufficient for `latestEffectiveAt`. `read.ts` and `validate.ts` use a slightly extended version that also globs `timeline/*/notes/*.md` and `timeline/*/encounter_*.md`. **Phase D**: factor the glob helper into `fs-util.ts` and reuse.

## C8. `evidence.ts`

```ts
export type EvidenceRef =
  | { kind: "event"; id: string }
  | { kind: "vitals_interval"; encounterId: string; name: string; from: Date; to: Date; unit?: string };

const VITALS_PREFIX = "vitals://";

export function parseEvidenceRef(s: string): EvidenceRef | null {
  if (!s.startsWith(VITALS_PREFIX)) return { kind: "event", id: s };
  // vitals://<encounter_id>?name=...&from=...&to=...[&unit=...]
  const url = new URL(s);
  const encounterId = url.host || url.pathname.replace(/^\//, "");
  const name = url.searchParams.get("name");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const unit = url.searchParams.get("unit") ?? undefined;
  if (!encounterId || !name || !from || !to) return null;
  const fromDt = new Date(from), toDt = new Date(to);
  if (isNaN(fromDt.getTime()) || isNaN(toDt.getTime())) return null;
  return { kind: "vitals_interval", encounterId, name, from: fromDt, to: toDt, unit };
}

export function formatVitalsUri(opts: {
  encounterId: string; name: string; from: Date | string; to: Date | string; unit?: string;
}): string {
  const from = opts.from instanceof Date ? opts.from.toISOString() : opts.from;
  const to = opts.to instanceof Date ? opts.to.toISOString() : opts.to;
  const url = new URL(`vitals://${opts.encounterId}`);
  url.searchParams.set("name", opts.name);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  if (opts.unit) url.searchParams.set("unit", opts.unit);
  return url.toString();
}
```

## C9. Public API surface (`src/index.ts`)

```ts
export {
  readPatientContext,
  readActiveConstraints,
  readRecentEvents,
  readRecentNotes,
  readLatestVitals,
  latestEffectiveAt,
} from "./read.js";

export {
  appendEvent,
  writeNote,
  writeCommunicationNote,
  writeArtifactRef,
  nextEventId,
  nextNoteId,
} from "./write.js";

export { rebuildDerived } from "./derived.js";
export { validateChart } from "./validate.js";

export type * from "./types.js";
export { parseEvidenceRef, formatVitalsUri } from "./evidence.js";
export type { EvidenceRef } from "./evidence.js";
export { WallClock, SimClock, chartClock, loadChartMeta } from "./time.js";
export type { Clock } from "./time.js";
```

### Function signatures

```ts
// read.ts
readPatientContext(chartRoot: string): Promise<{
  "patient.md"?:    { frontmatter: any; body: string };
  "constraints.md"?: { frontmatter: any; body: string };
  encounter?:       { path: string; frontmatter: any; body: string };
}>;

readActiveConstraints(chartRoot: string): Promise<{
  structured: ConstraintsBlock | null;
  body: string;
}>;

readRecentEvents(opts: {
  chartRoot: string;
  withinMinutes?: number;       // default 120
  types?: EventType[];
  asOf?: Date;                  // default: latestEffectiveAt() ?? now()
}): Promise<EventEnvelope[]>;

readRecentNotes(opts: { chartRoot: string; limit?: number }): Promise<Array<{
  path: string; frontmatter: NoteFrontmatter; body: string;
}>>;

readLatestVitals(chartRoot: string): Promise<Record<string, VitalSample>>;

latestEffectiveAt(chartRoot: string): Promise<Date | null>;

// write.ts
appendEvent(event: EventInput, opts: { chartRoot: string }): Promise<string>;
//   Throws if missing envelope or clinical-required fields.
//   Returns event id.

writeNote(opts: {
  frontmatter: NoteFrontmatterInput;
  body: string;
  chartRoot: string;
  slug?: string;
}): Promise<string>;
//   Throws if target path exists.
//   Returns absolute path.

writeCommunicationNote(opts: {
  frontmatter: NoteFrontmatterInput;
  body: string;
  communicationData?: Record<string, unknown>;
  chartRoot: string;
  slug?: string;
}): Promise<{ notePath: string; eventId: string }>;
//   Atomically writes note + appends matching communication event.

writeArtifactRef(opts: {
  artifactPath: string;
  kind: string;
  description: string;
  encounterId: string;
  subject: string;
  effectiveAt?: string;
  chartRoot: string;
  author?: Author;
}): Promise<string>;

nextEventId(opts: { chartRoot: string; effectiveAt?: string }): Promise<string>;
//   File-probes the day's events.ndjson for max suffix, returns next.

nextNoteId(opts: { effectiveAt?: string; slug?: string }): string;
//   Pure; no file probe (notes file paths conflict on the slug, not the suffix).

// derived.ts
rebuildDerived(chartRoot: string): Promise<void>;

// validate.ts
validateChart(chartRoot: string): Promise<ValidationReport>;
```

## C10. Write boundary contracts (`src/write.ts`)

```ts
const REQUIRED_BASE = ["type", "subject", "effective_at", "author", "source", "status"] as const;
const CLINICAL_TYPES = new Set<EventType>([
  "observation", "assessment", "intent", "action", "communication", "artifact_ref",
]);
const REQUIRED_CLINICAL = ["encounter_id", "certainty", "data", "links"] as const;

function checkProvenance(ev: EventInput): void {
  const missing = REQUIRED_BASE.filter(k => (ev as any)[k] === undefined);
  if (missing.length) {
    throw new Error(`event missing required envelope fields: ${missing.join(", ")}`);
  }
  if (CLINICAL_TYPES.has(ev.type)) {
    const cMissing = REQUIRED_CLINICAL.filter(k => (ev as any)[k] === undefined);
    if (cMissing.length) {
      throw new Error(
        `clinical event (${ev.type}) missing required fields: ${cMissing.join(", ")}`
      );
    }
  }
}
```

`appendEvent`:

1. Call `checkProvenance(event)` — throws on contract violation.
2. Clone input (immutable inputs; the Python's dict-mutation foot-gun is gone).
3. Fill in `recorded_at` if missing (ISO 8601 with offset).
4. Fill in `id` via `nextEventId` if missing.
5. Compute day dir from `effective_at`.
6. `appendNdjsonLine(eventsPath, event)`.
7. Return `event.id`.

`writeNote`:

1. Clone frontmatter; default `recorded_at`, `id`, `references = []`.
2. Compute `notes/<HHMM>_<slug>.md` path.
3. `await fs.access(path).catch(() => null)` → if exists, throw `Error` with code `EEXIST`-flavored message.
4. Render `---\n<yaml>\n---\n\n<body>\n` and `atomicWriteFile(path, …)`.
5. Return path.

`writeCommunicationNote`:

1. `notePath = await writeNote(...)`.
2. Re-read the written frontmatter (so we have the filled-in id/recorded_at).
3. Construct `communication` event mirroring envelope; `data.note_ref = fm.id`.
4. `eventId = await appendEvent(commEvent, …)`.
5. Return `{ notePath, eventId }`.

`nextEventId`:

- Compute `ymd_hm` (`YYYYMMDDTHHMM`) from `effective_at` or now.
- Open the corresponding `timeline/<day>/events.ndjson` (or note non-existence).
- Scan ids matching `evt_<ymd_hm>_NN`; track max NN.
- Return `evt_<ymd_hm>_<NN+1>` zero-padded to 2 digits.

This is the "file-probe" strategy that supersedes the Python's in-process counter.

## C11. `derived.ts` — inline rebuild

Reimplements `scripts/rebuild_derived.py` in TS without subprocess. Same four views with the same content rules:

- `current.md` uses `latestEffectiveAt` for the "as of" line (deterministic).
- `latest-vitals.md` orders by `VITALS_ORDER = ["temperature","heart_rate","bp_systolic","bp_diastolic","respiratory_rate","spo2","pain"]` then alphabetical tail.
- `active-constraints.md` strips the body's leading `# Constraints` heading.
- `open-intents.md` enumerates active intents with rationale/due_by/criteria/contingencies.

`atomicWriteFile` for each of the four output files.

## C12. `validate.ts` architecture

Returns `ValidationReport`. Structurally mirrors `scripts/validate.py`:

1. Load schemas (cached via `schema.ts`).
2. Load `chart.yaml` to get `expected_subject`.
3. Validate structural markdown frontmatter (`patient.md`, `constraints.md`, encounter headers) against `event.schema.json`.
4. If `constraints.md` carries a `constraints:` block, validate it against `constraints.schema.json`.
5. Walk `timeline/<day>/`:
   - `events.ndjson`: event schema + duplicate id check + subject match + day-prefix warning + collect `event_types[id]` + collect `communication_note_refs`.
   - `vitals.jsonl`: vitals schema + subject match + day-prefix warning.
   - `notes/*.md`: note schema + duplicate id check + subject match + collect note ids.
6. Referential integrity pass: walk events again, validate `links.supports[]` (event ids OR `vitals://` URIs via `parseEvidenceRef` + window check), `supersedes[]`, `corrects[]`, `data.note_ref`. Enforce assessment-evidence rule.
7. Walk notes, validate `references[]` resolve to known ids.
8. Bidirectional pairing: every note id must appear in `communication_note_refs`.
9. `_derived/` "generated by" warning.

Each error/warning is a `ReportEntry`. Final return: `{ ok: errors.length === 0, errors, warnings }`.

## C13. CLI scripts

`scripts/validate.ts`:

```ts
#!/usr/bin/env tsx
import { validateChart } from "../src/index.js";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const report = await validateChart(root);
for (const w of report.warnings) console.log(`WARN   ${w.where}: ${w.message}`);
for (const e of report.errors)   console.log(`ERROR  ${e.where}: ${e.message}`);
console.log();
console.log(`${report.errors.length} error(s), ${report.warnings.length} warning(s)`);
process.exit(report.ok ? 0 : 1);
```

`scripts/rebuild-derived.ts`:

```ts
#!/usr/bin/env tsx
import { rebuildDerived } from "../src/index.js";
import path from "node:path";
await rebuildDerived(path.resolve(process.argv[2] ?? "."));
```

## C14. `package.json` scripts

```json
{
  "type": "module",
  "scripts": {
    "validate": "tsx scripts/validate.ts .",
    "rebuild":  "tsx scripts/rebuild-derived.ts .",
    "check":    "npm run rebuild && npm run validate",
    "test":     "node --test --import tsx 'src/*.test.ts'"
  }
}
```

## C15. Test suite

Colocated `src/*.test.ts` files using `node:test`. Each suite covers the contracts surfaced in this spec.

### `src/evidence.test.ts`

- round-trip `formatVitalsUri` ↔ `parseEvidenceRef` for typical URIs
- malformed URI returns null
- non-vitals string returns `{ kind: "event", id }`

### `src/schema.test.ts`

- known-good event/note/vitals/constraints fixtures validate
- removing each required field surfaces a schema error
- clinical event missing `encounter_id` rejected
- structural event without `data`/`links` accepted

### `src/write.test.ts`

- `appendEvent` rejects missing `type`/`subject`/etc.
- `appendEvent` for clinical event rejects missing `encounter_id`/`certainty`/`data`/`links`
- `appendEvent` fills in `id` and `recorded_at`
- `appendEvent` does not mutate caller's input
- `writeNote` throws when target path exists
- `writeCommunicationNote` produces both note file and matching comm event with correct `note_ref`
- `nextEventId` increments suffix when prior ids exist in the day file

### `src/read.test.ts`

- `readActiveConstraints` returns both structured + body
- `readRecentEvents` defaults `asOf` to chart's latest event time, not wall clock
- `readLatestVitals` picks newest by parsed timestamp (not string compare)

### `src/validate.test.ts`

For each rule: copy fixture chart to a `tmp` dir, mutate, validate, assert exact error.

- bidirectional note ↔ communication: drop comm event → orphan-note error
- vitals URI window with no samples → "matches no samples"
- vitals URI malformed → parser error
- subject mismatch in event → subject-match error
- subject mismatch in vitals row → subject-match error
- day-directory prefix warning fires
- assessment with empty supports → assessment-evidence error
- conditional schema: clinical event missing `encounter_id` → schema error
- note `references[]` resolution failure → unknown-id error

### `src/derived.test.ts`

- `current.md` "as of" uses latest event time, not wall clock (rebuild twice → byte-identical)
- `latest-vitals.md` orders heart_rate before bp_systolic before spo2
- `active-constraints.md` does not double the `# Constraints` heading

### `src/time.test.ts`

- `latestEffectiveAt` returns max across events + vitals
- `SimClock.now()` matches `latestEffectiveAt`
- `chartClock` selects WallClock vs SimClock by chart.yaml.clock

### Acceptance gate

`npm run check && npm test` must exit 0 on the carried-over hardened sample chart.

## C16. Validator parity check (Phase D5)

Run both:

```bash
cd _imports/pi-chart-claude/pi-chart && make check
cd _imports/pi-chart-ts && npm run check
```

Both must produce 0 errors, 0 warnings on identical sample data. Then for each negative fixture used in the TS test suite, both validators should produce the same error category (exact wording may differ).

## C17. Open Phase-D decisions (low-risk; choose during implementation)

- **glob factoring**: write a small recursive glob in `fs-util.ts`, or inline per-file as in C7 sketch? **Default**: shared helper in `fs-util.ts`.
- **Number-vs-Date for `as_of`**: API takes `Date`. Inputs from CLI/JSON should use `new Date(string)`. **Default**: keep `Date`.
- **YAML output**: `js-yaml` `dump` defaults are reasonable; preserve `sortKeys: false` to match Python's `sort_keys=False` and keep frontmatter ordering stable.
- **`encounter_id` in vitals** — already required by schema (B3). Ingest must supply it.
- **`atomicWriteFile` `chmod`**: leave default umask. Mirrors pi-sim.

## C18. What's not in v0

(matches `pi-chart-v0.1-spec.md` Section 10)

- patient.md baseline structured frontmatter
- intent lifecycle expansion
- artifacts manifest
- multi-encounter timeline subdir layout
- SQLite/vector indexes
- FHIR adapter
- Cross-process ID-counter locking
- Pre-publish TS build (tsx-only)

End of spec.
