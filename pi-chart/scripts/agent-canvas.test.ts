import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const html = readFileSync(
  path.resolve(import.meta.dirname, "..", "docs", "prototypes", "pi-chart-agent-canvas.html"),
  "utf8",
);

test("overview cockpit renders required patient and clinical content", () => {
  for (const required of [
    "π-chart",
    "overview",
    "Patient 002",
    "FULL CODE",
    "CAP day 1",
    "SpO₂ 89% on 6L simple mask",
    "HR 112",
    "RR 30",
    "lactate 2.8",
    "Due 09:50",
    "Escalate if SpO₂ &lt; 90%",
    "Zosyn due at 12:00",
    "scan medication + attestation required",
  ]) {
    assert.ok(html.includes(required), `missing ${required}`);
  }
});

test("clinical worklist keeps prioritized required sections", () => {
  const sections = [
    "Due / Overdue",
    "Staged Charting",
    "Generated Drafts",
    "Blocked MAR Items",
    "Charted / Done",
  ];

  let lastIndex = -1;
  for (const section of sections) {
    const index = html.indexOf(section);
    assert.ok(index > lastIndex, `${section} should appear after prior worklist section`);
    lastIndex = index;
  }
});

test("artifact pane is editable, resizable, and uses Chart language", () => {
  assert.match(html, /class="artifact-pane"/);
  assert.match(html, /resize:both/);
  assert.match(html, /<textarea aria-label="Resp reassessment markdown editor"/);
  assert.match(html, /Discard draft/);
  assert.match(html, /Stage draft/);
  assert.match(html, /Chart <small>FINAL CLINICAL WRITE<\/small>/);
});

test("prototype copy uses Chart product language only", () => {
  const bannedWord = new RegExp("\\b[Cc]om" + "mit(?:ted)?\\b");
  assert.doesNotMatch(html, bannedWord);
});
