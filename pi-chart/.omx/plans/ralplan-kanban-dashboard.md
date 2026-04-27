# RALPLAN — Kanban Dashboard (`docs/plans/dashboard.html`)

Plan owner: planner agent (initial). Stage: pre-architect / pre-critic.
Spec source: `pi-chart/.omx/specs/deep-interview-kanban-dashboard.md` (clarity 0.873, ambiguity 0.127, status PASSED).
Mode: **SHORT** consensus (no `--deliberate` flag and no high-risk signal — this is a build-tooling lane that touches one new script + one new test + one `package.json` script entry).

## 1. Summary

Build a single static `dashboard.html` from `docs/plans/kanban-prd-board.md` via a new `pi-chart/scripts/dashboard.ts`, runnable as `npm run dashboard`. The script hand-rolls a tiny GFM pipe-table parser (no new runtime deps), maps four named board sections onto four kanban columns (`Backlog`, `Ready`, `In Progress`, `Done`), and emits a self-contained HTML file with inline CSS, HTML-escaped card content, and per-column counts. The output is treated as a build artifact: gitignored except a tracked README that documents how to regenerate it. A node test (`scripts/dashboard.test.ts`) drives the parser/renderer over an in-memory fixture and asserts column membership, counts, and escaping. The implementation must read the board as a single buffered snapshot and fail loudly on partial-table input rather than emit corrupt HTML, so codex's concurrent edits to the same file cannot produce a silently broken dashboard.

## 2. RALPLAN-DR summary

### Principles
1. **No new runtime deps.** The board is well-structured GFM (level-2 headings + pipe tables, no nested tables, no inline HTML). A ~100–150-line hand-rolled parser is cheaper than a dep.
2. **Static and self-contained.** Inline CSS only. No fetches, no external fonts, no client-side JS. Must work via `file://` double-click.
3. **Tolerate empty columns and missing sections.** `In Progress` has no source section yet; the build must still succeed and render an empty column with count `0`.
4. **Snapshot-and-fail-loud.** Read source once into a buffer; if a section's table is malformed (e.g. codex mid-write), exit non-zero with a clear error rather than emit a half-rendered page.
5. **Build artifact, not source.** Generated HTML is gitignored alongside a tracked README, matching the existing `_derived/` convention.

### Decision drivers
1. **Concurrent codex writes to the source.** `docs/plans/kanban-prd-board.md` is being edited by another lane in parallel; we read but never write it, and we must detect partial-table snapshots.
2. **Non-technical viewer.** The dashboard exists for a 3-second glance; visual minimalism (4 columns, ID + title + small pill, count in header) outweighs feature richness.
3. **Minimal blast radius.** Lane is build-tooling only — `scripts/`, `package.json` (one new npm script), and one tracked README. `src/`, `schemas/`, `patients/` must be untouched.

### Viable options for the markdown-parsing approach

| Option | Pros | Cons |
|---|---|---|
| **A. Hand-rolled section + pipe-table parser (recommended)** | Zero new deps; parser is ~100–150 lines and fits the existing `scripts/` pattern (no abstractions); fully under our control for failure-mode behavior (partial-table detection, header alias for `Status`/`Outcome`). | We own the edge cases. Mitigated by: targeted node tests against the live board + a synthetic fixture. |
| **B. Add a tiny pipe-table parser as a devDependency** (e.g. `marked`, `mdast-util-gfm-table`, or a lightweight pipe-table package) | Off-the-shelf; battle-tested on weird whitespace; smaller code-to-own surface; spec line 34 explicitly permits this path ("a tiny markdown table parser is acceptable"). | We still post-process the AST to extract section→table→rows, so net code saved is modest; adds a supply-chain review surface (transitive deps, audit cadence); a generic parser's failure mode on partial-table input is harder to tailor than our own throw-with-section-name behavior. |
| **C. Shell-out (e.g. `pandoc` to JSON AST, then process)** | No JS deps; pandoc is robust. | Adds a *system* dep that not every contributor or CI step will have; runs counter to "viewable via `file://`, regen via `npm run`"; introduces a binary in the trust path. |

**Chosen primary: A (hand-rolled).** Spec line 34 offers a deliberate choice: "a tiny markdown table parser is acceptable, or hand-roll one inline." Both A and B are sanctioned. We pick A on judgment, not on prohibition:
- **Single-file mental model.** One ~150-line script with no imports beyond `node:fs` / `node:path` matches the `scripts/` style (e.g. `migrate-v01-to-v02.ts`, `rebuild-derived.ts`) — no shared utility module, no parser config to learn.
- **Full control over partial-table fail-loud.** Risk E requires throwing with the section name and line number on a mid-write snapshot; a generic parser will either silently emit an incomplete table or throw a generic location-only error.
- **Minimal supply-chain review surface.** Even a devDep brings transitive packages and an audit obligation for a one-off generator over a format we control.

C is invalidated separately: it introduces a system binary requirement (`pandoc`), defeating the "self-contained `npm run`" goal.

Both A and B are viable; we choose A. C is documented but invalidated. Meets the "≥ 2 viable options" RALPLAN-DR rule.

## 3. Implementation plan

Each step lists owned files, what changes, the first verification, and the explicit boundary.

### Step 1 — Test scaffolding (RED)

- **Owned files:** `pi-chart/scripts/dashboard.test.ts` (new).
- **What changes:** Create a node test file using the existing `node --test` + `tsx` pattern (see `scripts/migrate-v02-to-v03.test.ts`). Tests:
  - `parses a synthetic board fixture into 4 columns` — feed an inline markdown string covering all 4 source sections plus a "junk" section that must be ignored; assert exact column membership and counts.
  - `tolerates an empty In Progress column` — fixture with no `In Progress`-mapped source section; assert column renders count `0` and no card markup.
  - `extracts ID, title, and status pill correctly` — assert `PHA-001` → id, the rest of column 1 → title, `Status` column → pill for Backlog tables, `Outcome` column for Done.
  - `Ready-section cards render without a status pill` — fixture rows from a Ready-style table whose columns are `PRD | Test spec | Source inputs | Why now | Dependencies | HITL gate` (no `Status`, no `Outcome`). Assert the rendered `<li class="card">` for each Ready row contains zero `<span class="pill">` elements (resolution (a)) and that the section-name string ("Ready for PRD execution") does not appear inside any card. Also assert the cards still render id + title.
  - `escapes HTML special chars in card titles` — fixture with `<script>` and `&` in a title; assert `&lt;script&gt;` and `&amp;` in output and no raw `<script>`.
  - `truncates status pill to ~30 chars` — pass a 60-char status; assert ≤30 chars and ellipsis suffix.
  - `errors on partial table snapshot` — fixture with a header row but no separator/body row in a known section; assert the renderer (or a parse function) throws with a message naming the section.
- **First verification:** `npm test` runs the suite; new test fails because `scripts/dashboard.ts` doesn't exist yet.
- **Boundary:** No implementation in this step. No real-board reads (fixtures only). No file writes from tests.

### Step 2 — Markdown extractor + renderer (GREEN)

- **Owned files:** `pi-chart/scripts/dashboard.ts` (new).
- **What changes:** Implement the script. Internal shape (single file, no exported package):
  - `readBoard(path: string): string` — `await fs.readFile(path, "utf8")`, single read. No fs.watch.
  - `parseSections(md: string): Map<string, TableRow[]>` — split on `^## ` headings, trim each block, find the first pipe table inside, parse to `{ headers: string[], rows: string[][] }`. Throw `Error("section '<name>' has malformed table at line N")` on partial/no separator.
  - `extractCards(table, sectionName): Card[]` — first column → `[id, ...titleParts]` split on first whitespace; status pill prefers a `Status` header, falls back to an `Outcome` header; if **neither** is present (the case for `Ready for PRD execution` and `Ready for tracer execution after HITL selection`, whose tables have no status-shaped column), the card emits **no pill at all** (`pill: undefined`). The renderer omits the `<span class="pill">` element entirely for these cards rather than echo the section name. Pill, when present, is truncated to 30 chars (with ellipsis if cut). Resolution chosen: **(a) suppress pill on Ready cards**, because (i) it best matches the user's "minimalistic" preference, (ii) it avoids leaking a column-label-ish string ("Ready for PRD execution") into card chrome, and (iii) it keeps the renderer dumb — no per-section special casing of pill content.
  - `mapToColumns(sectionMap): Record<ColumnName, Card[]>` — apply the spec's status-mapping table. Missing source sections produce empty arrays, not errors. Unknown sections logged to stderr and ignored.
  - `renderHtml(columns): string` — string template, inline `<style>`, four `<section class="column">` blocks each with a `<header>` showing `Name (count)` and a `<ul>` of `<li class="card">` entries. Every card text passed through a 4-replace HTML-escape (`& < > "`).
  - `main()` — resolve paths via `path.resolve(import.meta.dirname, "..")`, write `docs/plans/dashboard.html`, log byte count and per-column counts to stdout. Exit 1 on any caught error.
- **First verification:** `npm test` passes (all tests added in Step 1 go green).
- **Boundary:** No CSS framework, no theme switching, no client-side JS, no DOM library. Inline `<style>` only. Do not parse anything other than level-2 headings + their first pipe table. No special-casing of card IDs beyond "first whitespace-delimited token".

### Step 3 — Wire the npm script and end-to-end run

- **Owned files:** `pi-chart/package.json` (one-line addition).
- **What changes:** Add `"dashboard": "tsx scripts/dashboard.ts"` to `scripts`. Confirm no entry is added to `dependencies` or `devDependencies`.
- **First verification:**
  ```
  npm run dashboard
  test -f docs/plans/dashboard.html
  grep -c '<section class="column"' docs/plans/dashboard.html   # expect 4
  grep -c '<li class="card"' docs/plans/dashboard.html           # expect ≥ count of cards in the live board
  grep -L 'http://\|https://\|//cdn' docs/plans/dashboard.html   # expect the file path (no external URLs found)
  ```
- **Boundary:** Do not also add `pretest`/`prebuild` hooks; do not wire the dashboard into `npm run check`. Manual regen only, per spec line 32.

### Step 4 — Treat the output as a build artifact

- **Owned files:** `pi-chart/.gitignore`, `pi-chart/docs/plans/README.md` (new — only if the dir doesn't already have one) **or** a short append to an existing `pi-chart/docs/plans/README.md` if present, plus optionally `pi-chart/docs/plans/.gitkeep` is **not** needed because `kanban-prd-board.md` already lives there.
- **Before `git add` of any file in this step, see Risk D HITL gate (mandatory).**
- **What changes:**
  - Append two lines to `pi-chart/.gitignore`:
    ```
    # Generated kanban dashboard (build artifact; regen via `npm run dashboard`)
    docs/plans/dashboard.html
    ```
  - Add a tiny note to `docs/plans/README.md` (or create one if missing) documenting: "`dashboard.html` is a generated, gitignored build artifact — regen via `npm run dashboard`. Source of truth is `kanban-prd-board.md`." This mirrors the `_derived/README.md` convention referenced in the existing `.gitignore`.
- **First verification:**
  ```
  git status -s docs/plans/dashboard.html   # expect empty (ignored)
  git check-ignore -v docs/plans/dashboard.html   # expect a hit in pi-chart/.gitignore
  ```
- **Boundary:** Do not gitignore other files; do not move `kanban-prd-board.md`; do not add CI rules.

### Step 5 — Live-board smoke test + final verification

- **Owned files:** none modified; this step is verification only. (Optionally `scripts/dashboard.test.ts` gains one final test that runs against the real `docs/plans/kanban-prd-board.md`, but this is OK to skip if the file is mid-edit at test time — gate it behind `if (existsSync(realBoardPath))` so it's tolerant.)
- **What changes:** Run the script against the actual board and eyeball the output once.
- **First verification:**
  ```
  npm run dashboard
  npm test
  npm run typecheck
  ```
  Open `docs/plans/dashboard.html` in a browser via `file://` and confirm: 4 columns visible; counts in headers match cards rendered; `In Progress` shows `(0)` and is empty; the two `Done` cards (`DOC-001`, `WSA-001`) and the five `Ready for tracer execution …` PHA-TB-* cards (`PHA-TB-0` through `PHA-TB-4`) are visibly present.
- **Boundary:** No screenshot tooling, no headless-browser harness, no Playwright. Manual eyeball is sufficient given the "glance-only" success criterion.

## 4. Testable acceptance criteria

Copied from the spec, each paired with a concrete verification command. Run from `pi-chart/`.

| # | Criterion (spec) | Verification |
|---|---|---|
| 1 | `npm run dashboard` produces `docs/plans/dashboard.html` with no runtime errors. | `npm run dashboard && test -f docs/plans/dashboard.html && echo OK` |
| 2 | Opens via `file://` with no external network requests. | `grep -E 'https?://\|//[^/]+\.[a-z]+' docs/plans/dashboard.html ; [ $? -eq 1 ] && echo OK` (grep exits 1 when no matches) |
| 3 | Four columns headed `Backlog`, `Ready`, `In Progress`, `Done`, with counts in parentheses. | `grep -E '>(Backlog\|Ready\|In Progress\|Done) \([0-9]+\)<' docs/plans/dashboard.html \| wc -l` → `4` |
| 4 | Every card from the four source sections appears in the right column. | Covered by `scripts/dashboard.test.ts` `parses a synthetic board fixture into 4 columns` and `extracts ID, title, and status pill correctly`; spot-check live by `grep -c 'PHA-TB-' docs/plans/dashboard.html` → `5`, `grep -c 'DOC-001\|WSA-001' docs/plans/dashboard.html` → `2`. |
| 5 | Each card renders id + 1-line title + small status pill. | DOM-shape assertion in test: each `<li class="card">` contains a `<span class="id">`, a `<span class="title">`, and a `<span class="pill">`. Live: `grep -c '<span class="pill">' docs/plans/dashboard.html` ≥ total card count. |
| 6 | Counts in column headers equal cards rendered in that column. | Test asserts equality programmatically; live: `node --import tsx -e "..."` one-liner OR a small `count-check` block inside `dashboard.test.ts`. |
| 7 | Re-running after edits reflects the edits (no stale cache). | Test: write fixture v1 → render → write fixture v2 (changed title) → render → assert v1 string absent, v2 string present. |
| 8 | A node test verifies columns + counts + canonical cards per section. | `npm test` (suite includes `scripts/dashboard.test.ts`). |
| 9 | No new runtime deps in `package.json` `dependencies`. | `git diff -- package.json \| grep -E '^\+\s+"' \| grep -v '^\+\s+"dashboard"' ; [ $? -eq 1 ] && echo OK` |
| 10 | No files outside `scripts/`, `docs/plans/dashboard.html`, `package.json` are modified. | `git diff --name-only` → must be a subset of `{scripts/dashboard.ts, scripts/dashboard.test.ts, package.json, .gitignore, docs/plans/README.md}`. **Note:** `.gitignore` and `docs/plans/README.md` are within the spirit of the spec's "lane = build-tooling/docs only" but are *not* in the spec's literal allowlist (spec line 60). Flagged for architect/critic review — see Risk D below. |

## 5. Risks and mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---:|---|
| A | **Markdown table format drift** as codex evolves the board (e.g. extra column, renamed `Status`/`Outcome`, new sections). | Medium | Medium | Parser keys off header *names* (`Status` first, `Outcome` second, fall back to section name) rather than column index. Unknown sections are logged-and-ignored, not errors. Future schema changes localized to `extractCards`. |
| B | **HTML escaping** of card titles that may contain `<`, `>`, `&` (markdown filenames in backticks, code-ish IDs, hyphens are safe but future titles may not be). | Medium | High (XSS-shaped output, even for `file://`) | Single `escapeHtml(s)` helper applied at every text-to-HTML boundary; explicit test with `<script>alert(1)</script>` in a title; never use raw template interpolation of card text. |
| C | **Status-pill column ambiguity:** `Done` table uses `Outcome`; `Backlog` table uses `Status`; `Ready for PRD execution` and `Ready for tracer execution` tables have neither — their columns are `PRD | Test spec | Source inputs | Why now | Dependencies | HITL gate`. The earlier draft fell back to the section name, which would have echoed "Ready for PRD execution" as a pill on every Ready card — leaking a column-label-ish string into card chrome. | High | Low | Resolution (a): if neither `Status` nor `Outcome` is present, emit **no pill at all** for those cards. Renderer omits the `<span class="pill">` element entirely. Tested explicitly (see Step 1 `Ready-section cards render without a status pill`). Pill, when present, is still truncated to 30 chars. |
| D | **Spec literal vs. spirit on touched files.** Spec line 60: "No files outside `pi-chart/scripts/`, `pi-chart/docs/plans/dashboard.html`, and `pi-chart/package.json` are modified." Step 4 also touches `.gitignore` and possibly `docs/plans/README.md`. | High (literal) | Low | **HITL gate (mandatory).** Executor MUST surface the `.gitignore` + `docs/plans/README.md` touches as a yes/no question to the user **before committing** Step 4 — phrased as: *"Spec line 60 allowlists only `scripts/`, `docs/plans/dashboard.html`, and `package.json`. Should I (i) extend the lane to also touch `.gitignore` + `docs/plans/README.md` for build-artifact hygiene, or (ii) keep within the literal allowlist by tracking `dashboard.html` and accepting merge churn on every regen?"* **Default fallback if no answer arrives:** option (ii) — track `dashboard.html`, skip both `.gitignore` and `README.md` edits. Recommendation to the user: (i), matching the existing `_derived/` convention; but the executor must not silently expand scope. |
| E | **Concurrent codex write produces a partial-table snapshot.** | Medium (during active planning) | Medium | **Fail-loud covers malformed mid-writes only.** `parseSections` throws on missing separator row or odd column count; `main()` catches and exits non-zero with a message naming the section and line. **Residual risk: stale-but-valid snapshots.** If codex has e.g. added a header row but not yet committed the new card row, the markdown is structurally valid and the table is incomplete-but-parseable — the dashboard will render successfully but reflect a board state that is one card behind reality. Fail-loud cannot detect this. **Accepted mitigation:** the user re-runs `npm run dashboard` after codex commits to refresh; the dashboard does not pretend to be a real-time view (spec non-goals exclude live-watch / auto-refresh). |
| F | **Live-board test flakiness** if real `kanban-prd-board.md` is mid-edit during `npm test`. | Low | Low | Live-board assertion is gated by `existsSync` and uses tolerant assertions (`>=` rather than exact counts). Synthetic-fixture tests carry the strict assertions. |
| G | **Ready-pill spec deviation.** Spec §"Card-content extraction" line 78 says: *"if absent, fall back to the section name"*. Plan resolution (a) instead suppresses the pill entirely for Ready-section cards (no `Status`/`Outcome` column). This is a deliberate spec override on minimalism grounds. | High (literal spec deviation) | Low | **HITL gate (mandatory).** Executor MUST surface the override to the user **before merging Step 2** — phrased as: *"Spec line 78 says Ready cards should fall back to the section name as their pill text; the plan instead suppresses the pill entirely on minimalism grounds (avoids leaking 'Ready for PRD execution' as a pill on every Ready card). Confirm: (i) suppress pill for Ready cards (plan default, recommended), or (ii) follow spec literal and use section name?"* **Default fallback if no answer arrives:** option (i) — suppress pill, matching the user's repeated minimalism preference across rounds 3 and 4 of the deep interview. |

## 6. ADR shell — Hand-rolled GFM section + pipe-table parser

**Decision.** Implement the kanban dashboard as a single TypeScript script (`scripts/dashboard.ts`) that hand-rolls a section-and-pipe-table parser tuned to the conventions of `docs/plans/kanban-prd-board.md`, renders inline-CSS HTML to `docs/plans/dashboard.html`, and is wired as `npm run dashboard`. The output is gitignored.

**Drivers.**
1. Spec forbids new runtime dependencies (`pi-chart/package.json` line: `dependencies = {ajv, ajv-formats, js-yaml}` only).
2. Source markdown is well-structured GFM (level-2 headings + pipe tables, no nested tables, no inline HTML) — a small hand-rolled parser is realistic and matches the existing `scripts/` style (no abstractions, no shared utility module).
3. Concurrent codex writes to the source require a fail-loud snapshot read; we want full control of failure modes.
4. Output must work via `file://` with zero external requests.

**Alternatives considered.**
- **B. Add a small markdown / table parser as a devDependency** (e.g. `marked`, `mdast-util-from-markdown`, a tiny pipe-table package). **Viable, not invalidated.** Spec line 34 explicitly permits this path. Not chosen because (i) the spec's pipe-table format is narrow enough that a hand-rolled parser is ~150 lines, (ii) we want fully-tailored partial-table fail-loud behavior with section-named errors, and (iii) we prefer a smaller supply-chain review surface for a single-purpose generator. If A's parser grows beyond ~200 lines or accumulates ≥2 codex format-drift bugs in a quarter, swap to a devDep parser per the Follow-ups section.
- **C. Shell-out to `pandoc -t json`** and post-process the AST. Invalidated: introduces a system binary requirement, defeating the "self-contained `npm run`" goal; not every contributor has `pandoc` installed; adds opaque trust path.

**Why chosen.**
- A (hand-roll) honors the dependency constraint exactly, keeps the implementation in one ~150-line file consistent with the rest of `scripts/`, and lets us tailor parse-error behavior to the specific concurrent-write risk. The board's structural simplicity (no nested tables, no inline HTML) means we are not reinventing a real markdown parser — we are recognizing two narrow patterns (level-2 heading, pipe table) and ignoring everything else.

**Consequences.**
- Positive: zero dep delta; single-file mental model; precise control over partial-table failure mode; trivial to delete or replace later.
- Negative: we own edge cases (column-count mismatch, separator detection, leading/trailing pipes, inline-code in cells). Mitigated by node tests and section-name-keyed extraction.
- Neutral: future board format changes (new sections, renamed columns) will require small targeted edits in `mapToColumns` / `extractCards`, not a parser overhaul.

**Follow-ups.**
1. If the board grows a real `In Progress` source section, update the column-mapping table (one-line change in `mapToColumns`).
2. If a future viewer needs filters, links, or change-deltas, revisit option B (add a parser dep then) — but only with explicit user request; current spec's non-goals exclude all of these.
3. Architect/critic should ratify Risk D (`.gitignore` + README touches outside the spec's literal allowlist).
4. **Exit ramp from hand-roll.** If the parser exceeds ~200 lines or accumulates >2 codex-format-drift bugs in a quarter, swap to a devDep table parser — spec line 34 permits it.

## 7. Recommended commit shape

**Single commit**, declarative imperative, no Conventional-Commit prefix — matches the recent log (`Make backlog planning artifacts durable`, `Stage deep-research operating-system planning trio`, `Guard memoryProof against hidden state and prove loop closure`).

Suggested message:

```
Render kanban PRD board as a static dashboard

Add scripts/dashboard.ts and scripts/dashboard.test.ts: a hand-rolled
pipe-table parser maps the four named sections of
docs/plans/kanban-prd-board.md onto Backlog / Ready / In Progress /
Done columns and writes a self-contained docs/plans/dashboard.html
(inline CSS, no external requests). Treat the HTML as a build
artifact: gitignored, regen via `npm run dashboard`. Fail loud on
partial-table snapshots so a mid-write source produces a clear error
instead of corrupt output.
```

A multi-commit alternative (test-first) is acceptable if the executor prefers strict TDD optics:
1. `Add failing dashboard renderer tests` — only `scripts/dashboard.test.ts` (RED).
2. `Render kanban PRD board as a static dashboard` — `scripts/dashboard.ts` + `package.json` script + `.gitignore` + `docs/plans/README.md` (GREEN).

Recommendation: **single commit**. The test file is small and the GREEN state is the only state worth shipping; splitting adds rebase friction with the concurrently-edited board file.

---

End of plan. Ready for architect review (`oh-my-claudecode:architect`) and critic review (`oh-my-claudecode:critic`) before `/ccg` execution.
