import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { ADVISORY_BANNER_COPY, INTENTS } from "./agent-canvas-constants.js";

const html = readFileSync(
  path.resolve(import.meta.dirname, "..", "docs", "prototypes", "pi-chart-agent-canvas.html"),
  "utf8",
);
const contextFixture = JSON.parse(readFileSync(
  path.resolve(import.meta.dirname, "..", "tests", "fixtures", "agent-canvas-context.json"),
  "utf8",
));

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
  assert.match(html, /top:10px;right:10px/);
  assert.match(html, /resize:horizontal/);
  assert.match(html, /z-index:30/);
  assert.match(html, /<textarea aria-label="Resp reassessment markdown editor"/);
  assert.match(html, /Discard draft/);
  assert.match(html, /Stage draft/);
  assert.match(html, /Chart <small>FINAL CLINICAL WRITE<\/small>/);
  assert.match(html, /id="artifact-titlebar" data-freshness="current"/);
});

test("prototype copy uses Chart product language only", () => {
  const bannedWord = new RegExp("\\b[Cc]om" + "mit(?:ted)?\\b");
  assert.doesNotMatch(html, bannedWord);
});

test("agent dock is a chart-side advisory shell with a mock prompt", () => {
  assert.match(html, /aria-label="Pi-agent dock"/);
  assert.match(html, /id="agent-prompt"/);
  assert.equal((html.match(/data-role="intent-radio"/g) ?? []).length, INTENTS.length);
  assert.match(html, /Organize my shift and tell me what I should pay attention to\./);
  assert.ok(html.includes(`data-role="advisory-banner">${ADVISORY_BANNER_COPY}</span>`));
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /z-index:20/);
  assert.match(html, /Pi-agent \/ advisory/);
  assert.match(html, /Co-pilot advice only\./);
  assert.match(html, /Chart truth changes only through clinician final clinical write\./);
  assert.match(html, /data-role="agent-suggestions" data-advisory="true"/);
  assert.match(html, /Warning: Unverified Synthesis/);
});

test("generated context fixture is grounded in patient_002 view primitives", () => {
  assert.equal(contextFixture.patientId, "patient_002");
  assert.equal(contextFixture.encounterId, "enc_p002_001");
  assert.ok(contextFixture.sourceViewRefs.includes("currentState(axis=vitals,asOf)"));
  assert.ok(contextFixture.sourceViewRefs.includes("openLoops(asOf)"));
  assert.equal(contextFixture.latestVitals.spo2.value, 89);
  assert.equal(contextFixture.latestVitals.spo2.sample_key, "vital_647c98955de3bdeb");
  assert.ok(contextFixture.openLoop.detail.includes("Escalate if SpO₂ < 90%"));
  assert.ok(contextFixture.artifacts.some((artifact) => artifact.id === "resp-reassessment" && artifact.sourceRefs.some((ref) => ref.includes("vital_647c98955de3bdeb"))));
});

test("clinician journey storyboard exposes chart navigation states", () => {
  for (const required of [
    "Handoff report",
    "previous-shift trend",
    "Medication administration cannot be auto-charted",
    "Provider assessment / plan",
    "Lactate 2.8 mmol/L",
    "CXR report",
    "Pi-agent shift organization",
  ]) {
    assert.ok(html.includes(required), `missing storyboard content: ${required}`);
  }
});
