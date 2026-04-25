import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseBoard, renderHtml } from "./dashboard.js";

const FIXTURE = [
  "# Board",
  "",
  "## Done / accepted evidence",
  "",
  "| Card | Outcome | Evidence | Follow-up |",
  "|---|---|---|---|",
  "| DOC-001 Document-sprawl source map | Accepted evidence | x | y |",
  "",
  "## Ready for PRD execution",
  "",
  "| Card | PRD | Test spec | Source inputs | Why now | Dependencies | HITL gate |",
  "|---|---|---|---|---|---|---|",
  "| PHA-001 Phase A completion bridge | prd | spec | src | now | DOC-001 | gate |",
  "",
  "## Ready for tracer execution after HITL selection",
  "",
  "| Card | Purpose | Owned files | First test / validation | Boundary | Verification |",
  "|---|---|---|---|---|---|",
  "| PHA-TB-0 Inventory and source-map refresh | purpose | files | test | boundary | verify |",
  "",
  "## Backlog converted to thin PRD/test-spec surfaces",
  "",
  "| Card | PRD | Test spec | Status | Next action | HITL gate |",
  "|---|---|---|---|---|---|",
  "| V03-001 v0.3 foundation reconciliation | prd | spec | Thin decision/backlog PRD. | next | gate |",
  "| ADR17-001 actor attestation decision | prd | spec | Status: proposed / non-canonical; requires HITL/ADR approval before implementation policy. | next | gate |",
  "",
  "## Ignored section",
  "",
  "| Card | Status |",
  "|---|---|",
  "| NOPE-001 Should not render | Hidden |",
  "",
].join("\n");

function sectionBlock(html: string, columnName: string): string {
  const headerIdx = html.indexOf(`<header>${columnName} (`);
  assert.ok(headerIdx >= 0, `column ${columnName} header not found`);
  const sectionStart = html.lastIndexOf('<section class="column">', headerIdx);
  const sectionEnd = html.indexOf("</section>", headerIdx) + "</section>".length;
  return html.slice(sectionStart, sectionEnd);
}

test("parses synthetic board fixture into four columns", () => {
  const columns = parseBoard(FIXTURE);

  assert.equal(columns.Backlog.length, 2);
  assert.equal(columns.Ready.length, 2);
  assert.equal(columns["In Progress"].length, 0);
  assert.equal(columns.Done.length, 1);

  assert.deepEqual(columns.Backlog.map((c) => c.id), ["V03-001", "ADR17-001"]);
  assert.deepEqual(columns.Ready.map((c) => c.id), ["PHA-001", "PHA-TB-0"]);
  assert.deepEqual(columns.Done.map((c) => c.id), ["DOC-001"]);
});

test("In Progress column renders with count 0 and no cards", () => {
  const html = renderHtml(parseBoard(FIXTURE));
  const block = sectionBlock(html, "In Progress");
  assert.match(block, /<header>In Progress \(0\)<\/header>/);
  assert.equal(block.includes('<li class="card">'), false);
});

test("extracts ID, title, and Status/Outcome pill text", () => {
  const columns = parseBoard(FIXTURE);

  assert.deepEqual(columns.Backlog[0], {
    id: "V03-001",
    title: "v0.3 foundation reconciliation",
    pill: "Thin decision/backlog PRD.",
  });
  assert.deepEqual(columns.Done[0], {
    id: "DOC-001",
    title: "Document-sprawl source map",
    pill: "Accepted evidence",
  });
});

test("Ready cards render without status pills or section-name fallback", () => {
  const html = renderHtml(parseBoard(FIXTURE));
  const block = sectionBlock(html, "Ready");
  const cards = block.match(/<li class="card">[\s\S]*?<\/li>/g) ?? [];

  assert.equal(cards.length, 2);
  for (const card of cards) {
    assert.equal(card.includes('<span class="pill">'), false);
    assert.equal(card.includes("Ready for PRD execution"), false);
    assert.equal(card.includes("Ready for tracer execution after HITL selection"), false);
    assert.match(card, /<span class="id">PHA-/);
    assert.match(card, /<span class="title">[^<]+<\/span>/);
  }
});

test("escapes HTML special characters in card text", () => {
  const fixture = [
    "## Backlog converted to thin PRD/test-spec surfaces",
    "",
    "| Card | Status |",
    "|---|---|",
    "| XSS-001 evil & notes | Waiting & blocked |",
    "",
  ].join("\n");

  const html = renderHtml(parseBoard(fixture));

  assert.match(html, /Waiting &amp; blocked/);
  assert.match(html, /evil &amp; notes/);
});

test("escapes angle brackets in card text", () => {
  const fixture = [
    "## Backlog converted to thin PRD/test-spec surfaces",
    "",
    "| Card | Status |",
    "|---|---|",
    "| XSS-002 raw-tag-card | tag-with-angles |",
    "",
  ].join("\n");

  const columns = parseBoard(fixture);
  columns.Backlog[0].title = "<script>alert(1)</script>";
  const html = renderHtml(columns);

  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.equal(html.includes("<script>alert(1)</script>"), false);
});

test("truncates long status pills to 30 characters plus ellipsis", () => {
  const fixture = [
    "## Backlog converted to thin PRD/test-spec surfaces",
    "",
    "| Card | Status |",
    "|---|---|",
    "| LNG-001 Long pill card | 123456789012345678901234567890abcdef |",
    "",
  ].join("\n");

  const columns = parseBoard(fixture);

  assert.equal(columns.Backlog[0].pill, "123456789012345678901234567890…");
  assert.equal(columns.Backlog[0].pill?.length, 31);
});

test("throws with section name on partial-table snapshot", () => {
  const fixture = [
    "## Backlog converted to thin PRD/test-spec surfaces",
    "",
    "| Card | Status |",
    "",
  ].join("\n");

  assert.throws(
    () => parseBoard(fixture),
    /Backlog converted to thin PRD\/test-spec surfaces/,
  );
});

test("smoke parses the real board if present", () => {
  const boardPath = path.resolve(
    import.meta.dirname,
    "..",
    "docs",
    "plans",
    "kanban-prd-board.md",
  );
  if (!existsSync(boardPath)) return;

  const columns = parseBoard(readFileSync(boardPath, "utf8"));

  assert.ok(columns.Backlog.length >= 1);
  assert.ok(columns.Ready.length >= 1);
  assert.equal(columns["In Progress"].length, 0);
  assert.ok(columns.Done.length >= 1);
});
