#!/usr/bin/env tsx
// Render the kanban PRD board as a static, self-contained dashboard.html.
// Source of truth: docs/plans/kanban-prd-board.md. Output: docs/plans/dashboard.html.
// Single-snapshot read; fail loud on partial-table input.

import { promises as fs } from "node:fs";
import path from "node:path";

export type Card = { id: string; title: string; pill?: string };
export type ColumnName = "Backlog" | "Ready" | "In Progress" | "Done";

type Table = { headers: string[]; rows: string[][] };
type Columns = Record<ColumnName, Card[]>;

const COLUMN_ORDER: ColumnName[] = ["Backlog", "Ready", "In Progress", "Done"];

const SECTION_COLUMNS: Record<string, ColumnName> = {
  "Backlog converted to thin PRD/test-spec surfaces": "Backlog",
  "Ready for PRD execution": "Ready",
  "Ready for tracer execution after HITL selection": "Ready",
  "Done / accepted evidence": "Done",
};

const SOURCE_BOARD = path.resolve(
  import.meta.dirname,
  "..",
  "docs",
  "plans",
  "kanban-prd-board.md",
);
const OUTPUT_HTML = path.resolve(
  import.meta.dirname,
  "..",
  "docs",
  "plans",
  "dashboard.html",
);

const STYLES = `body {
  margin: 0;
  background-color: #f8fafc;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #1e293b;
  line-height: 1.5;
}
.board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  padding: 1.5rem;
  align-items: start;
}
.column {
  background-color: #f1f5f9;
  border-radius: 6px;
  padding: 0.75rem;
  min-height: 85vh;
  display: flex;
  flex-direction: column;
}
header {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
}
.card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 0.65rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.card:hover {
  border-color: #cbd5e1;
  background-color: #fafafa;
}
.id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
  margin-right: 0.4rem;
}
.title {
  font-size: 0.9rem;
  font-weight: 500;
  color: #334155;
}
.pill {
  display: table;
  margin-top: 0.5rem;
  padding: 0.15rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  background-color: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  text-transform: lowercase;
}`;

function emptyColumns(): Columns {
  return { Backlog: [], Ready: [], "In Progress": [], Done: [] };
}

function splitPipeRow(line: string): string[] {
  let text = line.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|")) text = text.slice(0, -1);
  return text.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(line: string): boolean {
  const cells = splitPipeRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseTable(lines: string[], start: number, section: string): Table {
  const headerLine = lines[start];
  const separatorLine = lines[start + 1];
  if (!separatorLine || !isSeparatorRow(separatorLine)) {
    throw new Error(
      `section "${section}" has malformed table at line ${start + 1}: missing separator row`,
    );
  }

  const headers = splitPipeRow(headerLine);
  const rows: string[][] = [];
  let index = start + 2;

  while (index < lines.length) {
    const line = lines[index];
    if (/^##\s+/.test(line) || !line.trim().startsWith("|")) break;

    const cells = splitPipeRow(line);
    if (cells.length !== headers.length) {
      throw new Error(
        `section "${section}" has malformed table at line ${index + 1}: expected ${headers.length} cells, got ${cells.length}`,
      );
    }
    rows.push(cells);
    index += 1;
  }

  return { headers, rows };
}

function parseSections(markdown: string): Map<string, Table> {
  const lines = markdown.split(/\r?\n/);
  const tables = new Map<string, Table>();
  let section: string | undefined;
  let sectionStart = 0;

  for (let index = 0; index <= lines.length; index += 1) {
    const heading = index < lines.length ? /^##\s+(.+?)\s*$/.exec(lines[index]) : null;
    if (!heading && index < lines.length) continue;

    if (section) {
      for (let lineIndex = sectionStart; lineIndex < index; lineIndex += 1) {
        const line = lines[lineIndex];
        if (!line.trim().startsWith("|")) continue;
        tables.set(section, parseTable(lines, lineIndex, section));
        break;
      }
    }

    if (heading) {
      section = heading[1].trim();
      sectionStart = index + 1;
    }
  }

  return tables;
}

function truncatePill(value: string): string {
  return value.length > 30 ? `${value.slice(0, 30)}…` : value;
}

function extractCards(table: Table): Card[] {
  const statusIndex = table.headers.indexOf("Status");
  const outcomeIndex = table.headers.indexOf("Outcome");
  const pillIndex = statusIndex >= 0 ? statusIndex : outcomeIndex;

  return table.rows.map((row) => {
    const first = row[0] ?? "";
    const match = /^(\S+)(?:\s+(.+))?$/.exec(first);
    const id = match?.[1] ?? first;
    const title = match?.[2] ?? "";
    const rawPill = pillIndex >= 0 ? row[pillIndex] : undefined;
    const pill = rawPill ? truncatePill(rawPill) : undefined;
    return pill ? { id, title, pill } : { id, title };
  });
}

export function parseBoard(markdown: string): Columns {
  const sections = parseSections(markdown);
  const columns = emptyColumns();
  for (const [section, table] of sections) {
    const column = SECTION_COLUMNS[section];
    if (!column) continue;
    columns[column].push(...extractCards(table));
  }
  return columns;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderCard(card: Card): string {
  const pill = card.pill
    ? ` <span class="pill">${escapeHtml(card.pill)}</span>`
    : "";
  return `<li class="card"><span class="id">${escapeHtml(card.id)}</span> <span class="title">${escapeHtml(card.title)}</span>${pill}</li>`;
}

function renderColumn(name: ColumnName, cards: Card[]): string {
  const items = cards.map(renderCard).join("\n");
  return `<section class="column">
<header>${escapeHtml(name)} (${cards.length})</header>
<ul>
${items}
</ul>
</section>`;
}

export function renderHtml(columns: Columns): string {
  const renderedColumns = COLUMN_ORDER.map((name) => renderColumn(name, columns[name])).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>pi-chart Kanban Dashboard</title>
<style>
${STYLES}
</style>
</head>
<body>
<main class="board">
${renderedColumns}
</main>
</body>
</html>
`;
}

export async function buildDashboard(
  sourcePath = SOURCE_BOARD,
  outputPath = OUTPUT_HTML,
): Promise<Columns> {
  const markdown = await fs.readFile(sourcePath, "utf8");
  const columns = parseBoard(markdown);
  const html = renderHtml(columns);
  await fs.writeFile(outputPath, html);
  console.log(`wrote ${Buffer.byteLength(html, "utf8")} bytes to ${outputPath}`);
  for (const name of COLUMN_ORDER) {
    console.log(`${name}: ${columns[name].length}`);
  }
  return columns;
}

async function main(): Promise<void> {
  await buildDashboard();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
