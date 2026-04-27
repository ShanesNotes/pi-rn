#!/usr/bin/env tsx
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { ADVISORY_BANNER_COPY, INTENTS } from "./agent-canvas-constants.js";
import { buildAgentCanvasContext, vitalSourceRef } from "./agent-canvas-context.js";
import type { AgentCanvasClinicalData } from "./agent-canvas-context.js";
import { buildContextBundle, deriveMarState, mockAgentRespond } from "./agent-canvas-connector.js";
import { chartViews } from "./agent-canvas-view-catalog.js";

type WorklistStatus = "due" | "staged" | "draft" | "blocked" | "done";
type WorklistSection = "Due / Overdue" | "Staged Charting" | "Generated Drafts" | "Blocked MAR Items" | "Charted / Done";
type StoryboardView = "overview" | "handoff" | "vitals" | "mar" | "notes" | "labs" | "radiology" | "agent";

type WorklistItem = {
  section: WorklistSection;
  title: string;
  detail: string;
  meta: string;
  status: WorklistStatus;
  artifactId?: string;
};

type Artifact = {
  id: string;
  title: string;
  kind: string;
  badges: string[];
  markdown: string;
  context: string[];
  tags: string;
  blocked?: boolean;
  chartable?: boolean;
  freshness?: "current" | "stale";
  sourceRefs?: string[];
  provenance?: {
    review: {
      state: "suggested" | "verified";
      attestation: { kind: "none" };
      requiredRole?: "verify";
    };
  };
};

type CanvasClinicalData = AgentCanvasClinicalData;

const output = path.resolve(import.meta.dirname, "..", "docs", "prototypes", "pi-chart-agent-canvas.html");
const contextOutput = path.resolve(import.meta.dirname, "..", "tests", "fixtures", "agent-canvas-context.json");
const demoAgentCanvasParams = {
  chartRoot: path.resolve(import.meta.dirname, ".."),
  patientId: "patient_002",
  encounterId: "enc_p002_001",
  asOf: "2026-04-19T09:36:00-05:00",
  trendFrom: "2026-04-19T09:00:00-05:00",
} as const;

const patient = {
  id: "Patient 002",
  mrn: "MRN 0002",
  dob: "DOB 1957-02-11",
  ageSex: "69 y / F",
  scenario: "CAP day 1",
  baseline: "prior independent · SpO₂ ~96% RA baseline",
  encounter: "enc_p002_001",
  location: "Step-down · 7-North · 712A",
  oxygen: "O₂ simple mask 6L",
  asOf: "2026-04-19 09:36 CT",
};

const vitals = [
  { label: "SpO₂ · 6L mask", value: "89", unit: "%", delta: "96 → 94 → 91 → 89 · trigger", signal: true, points: "0,5 42,9 84,14 126,20 168,25" },
  { label: "Heart rate", value: "112", unit: "bpm", delta: "98 → 102 → 108 → 112", signal: true, points: "0,24 42,21 84,17 126,11 168,7" },
  { label: "Resp rate", value: "30", unit: "/min", delta: "24 → 26 → 28 → 30 · WoB ↑", signal: true, points: "0,24 42,20 84,16 126,11 168,7" },
  { label: "BP", value: "128", unit: "/74", delta: "stable · MAP 92", signal: false, points: "0,14 42,13 84,15 126,12 168,13" },
];

const timelineRows = [
  { time: "09:30", event: "VITALS", text: "SpO₂ 89 · RR 30 · HR 112", sub: "trendline crossed trigger threshold", source: "watcher", signal: true },
  { time: "09:25", event: "LAB", text: "ABG resulted · lactate 2.8", sub: "supports respiratory watch; not standalone explanation", source: "supports", signal: false },
  { time: "09:20", event: "NOTE", text: "Bedside WoB documented · accessory muscle use", sub: "nursing focused respiratory assessment", source: "rn note", signal: false },
  { time: "09:15", event: "ASSESS", text: "Respiratory trajectory worsening", sub: "SpO₂ fell to high 80s on 3L NC before mask escalation", source: "pi-agent", signal: false },
  { time: "09:12", event: "ORDER", text: "ABG with lactate ordered", sub: "clarify ventilation/perfusion after worsening", source: "md order", signal: false },
  { time: "09:10", event: "ACTION", text: "Increase oxygen from 3L nasal cannula to 6L simple mask", sub: "bedside action already performed", source: "rn proc", signal: false },
  { time: "09:05", event: "COMM", text: "nursing note → care team", sub: "focused update sent", source: "rn note", signal: false },
  { time: "09:00", event: "LOOP", text: "Reassessment + handoff + loop update generated", sub: "drafts only; chart requires clinician action", source: "drafts", signal: false },
];

const artifacts: Artifact[] = [
  {
    id: "resp-reassessment",
    title: "RESP REASSESSMENT",
    kind: "Editable artifact · draft",
    badges: ["Executable charting task", "High priority", "Due 09:50 (in 14m)"],
    tags: "respiratory · assessment · watcher",
    chartable: true,
    freshness: "current",
    sourceRefs: ["vitals://enc_p002_001/spo2#vital_647c98955de3bdeb", "vitals://enc_p002_001/respiratory_rate#vital_44c37c3ce5537f71"],
    provenance: { review: { state: "suggested", attestation: { kind: "none" }, requiredRole: "verify" } },
    markdown: [
      "## Respiratory reassessment",
      "- SpO₂ 89% on 6L simple mask",
      "- RR 30/min with accessory muscle use",
      "- Patient reports increased work of breathing",
      "- Lung sounds: coarse crackles bilaterally",
      "- Plan: continue close monitoring; escalate if SpO₂ < 90% or accessory muscle use persists.",
      "- Next reassessment by 09:50.",
    ].join("\n"),
    context: ["Linked loop: Reassess O₂ response & WoB due 09:50", "Evidence: SpO₂ 89% trend · ABG lactate 2.8 · bedside WoB 09:20", "Owners: Primary RN · Support: RT, MD", "Visibility: Care team"],
  },
  {
    id: "handoff-draft",
    title: "NEXT-SHIFT HANDOFF",
    kind: "Handoff report · editable draft",
    badges: ["Generated draft", "Source-linked", "Chart before shift end"],
    tags: "handoff · nursing · watcher",
    chartable: true,
    freshness: "current",
    sourceRefs: ["patient_002/timeline/2026-04-19/notes/0930_handoff.md", "vitals://enc_p002_001/spo2#vital_647c98955de3bdeb"],
    provenance: { review: { state: "suggested", attestation: { kind: "none" }, requiredRole: "verify" } },
    markdown: [
      "## Handoff report",
      "Patient 002 admitted CAP day 1, now respiratory watcher.",
      "- Current: SpO₂ 89% on 6L simple mask, RR 30, HR 112.",
      "- Open loop: reassess oxygen response and work of breathing by 09:50.",
      "- Escalate to covering MD/RT if SpO₂ remains <90% or accessory muscle use persists.",
      "- Lactate 2.8 at 09:25; ABG/lactate reviewed in context of respiratory trajectory.",
    ].join("\n"),
    context: ["Sources: 09:30 handoff draft · 09:25 lab · 09:20 nursing note", "Not chart truth until RN reviews and Charts", "Pi-agent may organize; clinician owns final clinical write"],
  },
  {
    id: "due-vitals",
    title: "DUE VITALS + RESPIRATORY CHECK",
    kind: "Flowsheet task · executable",
    badges: ["Due work", "Bedside confirmation", "Escalation criteria"],
    tags: "vitals · flowsheet · respiratory reassessment",
    chartable: true,
    freshness: "current",
    sourceRefs: ["vitals://enc_p002_001/spo2#vital_647c98955de3bdeb", "vitals://enc_p002_001/heart_rate#vital_27cbe94dfb48d42d", "vitals://enc_p002_001/respiratory_rate#vital_44c37c3ce5537f71"],
    provenance: { review: { state: "suggested", attestation: { kind: "none" }, requiredRole: "verify" } },
    markdown: [
      "## Due vitals charting shell",
      "- Timestamp: 2026-04-19 09:50 CT",
      "- SpO₂: ____ %",
      "- HR: ____ bpm",
      "- RR: ____ /min",
      "- BP: ____ /____",
      "- O₂ device/support: simple mask ____ L/min",
      "- Work of breathing: ____",
      "- Escalation acknowledgement: call covering MD/RT if SpO₂ < 90% or accessory muscle use persists.",
    ].join("\n"),
    context: ["Values require RN review/attestation before Chart", "Open loop due 09:50", "Current trigger: SpO₂ 89% on 6L simple mask"],
  },
  {
    id: "zosyn-blocked",
    title: "ZOSYN DUE AT 12:00",
    kind: "MAR task · scan required",
    badges: ["Blocked MAR item", "Scan + attestation required", "Agent cannot Chart med admin"],
    tags: "MAR · medication safety · blocked",
    blocked: true,
    markdown: [
      "## Medication administration safety boundary",
      "Zosyn is due at 12:00, but medication administration cannot be charted from this agent workspace.",
      "",
      "Required before administration charting:",
      "- bedside medication scan",
      "- patient scan / two-patient-ID workflow",
      "- clinician attestation in MAR",
      "",
      "Pi-agent may remind, summarize context, or prepare handoff text. It must not chart medication administration.",
    ].join("\n"),
    context: ["Safety gate: MAR scan/attestation", "No final clinical write available from agent pane", "Open real MAR workflow at bedside"],
  },
  {
    id: "sbar-draft",
    title: "SBAR — COVERING MD",
    kind: "Communication draft · editable",
    badges: ["Generated draft", "Action summary", "Needs RN review"],
    tags: "SBAR · communication · escalation",
    chartable: true,
    freshness: "current",
    sourceRefs: [],
    provenance: { review: { state: "suggested", attestation: { kind: "none" }, requiredRole: "verify" } },
    markdown: "## SBAR draft\nS: Persistent hypoxemia and increased work of breathing.\nB: CAP day 1, escalated from 3L NC to 6L simple mask.\nA: SpO₂ 89%, RR 30, HR 112; lactate 2.8.\nR: Reassess by 09:50; consider RT/MD escalation if not improving.",
    context: ["Sources: vitals trend, ABG/lactate, nursing WoB note", "Draft only until RN reviews and Charts communication note"],
  },
];

let worklist: WorklistItem[] = [
  { section: "Due / Overdue", title: "Reassess oxygen response & WoB", detail: "Due 09:50 · high priority · Escalate if SpO₂ < 90% or accessory muscle use persists", meta: "in 14m", status: "due", artifactId: "resp-reassessment" },
  { section: "Due / Overdue", title: "q1h vitals + respiratory check", detail: "Flowsheet values + O₂ device + work of breathing · bedside confirmation required", meta: "due 10:00", status: "due", artifactId: "due-vitals" },
  { section: "Staged Charting", title: "Resp reassessment draft", detail: "RN assessment · respiratory · staged by rn_shane at 09:32", meta: "staged", status: "staged", artifactId: "resp-reassessment" },
  { section: "Generated Drafts", title: "Next-shift handoff draft", detail: "RN · Next shift · generated 09:30", meta: "draft", status: "draft", artifactId: "handoff-draft" },
  { section: "Generated Drafts", title: "SBAR — covering MD draft", detail: "Action item summary · generated 09:28", meta: "draft", status: "draft", artifactId: "sbar-draft" },
  { section: "Blocked MAR Items", title: "Zosyn due at 12:00", detail: "Piperacillin/Tazobactam 4.5 g IV q8h · scan medication + attestation required before MAR documentation", meta: "blocked", status: "blocked", artifactId: "zosyn-blocked" },
  { section: "Charted / Done", title: "ABG/lactate reviewed", detail: "ABG resulted · lactate 2.8 mmol/L", meta: "done 09:25", status: "done" },
  { section: "Charted / Done", title: "Bedside WoB documented", detail: "Accessory muscle use present", meta: "done 09:20", status: "done" },
];

let agentCanvasContext: Awaited<ReturnType<typeof buildAgentCanvasContext>> | null = null;

let clinicalData: CanvasClinicalData = {
  latestVitals: {
    spo2: { value: 89, unit: "%", sample_key: "vital_647c98955de3bdeb", context: { o2_device: "simple_mask", o2_flow_lpm: 6 } },
    heart_rate: { value: 112, unit: "beats/min", sample_key: "vital_27cbe94dfb48d42d" },
    respiratory_rate: { value: 30, unit: "breaths/min", sample_key: "vital_44c37c3ce5537f71" },
  },
  trends: {
    spo2: [{ value: 92 }, { value: 88 }, { value: 89, sample_key: "vital_647c98955de3bdeb" }],
    heart_rate: [{ value: 96 }, { value: 108 }, { value: 112, sample_key: "vital_27cbe94dfb48d42d" }],
    respiratory_rate: [{ value: 22 }, { value: 28 }, { value: 30, sample_key: "vital_44c37c3ce5537f71" }],
  },
  openLoop: {
    title: "Reassess oxygen response & WoB",
    detail: "Due 09:50 · high priority · Escalate if SpO₂ < 90% or accessory muscle use persists",
    meta: "in 14m",
    dueDeltaMinutes: 14,
  },
  handoffExcerpt: "Patient 002 is a CAP day 1 respiratory watcher with worsening oxygenation.",
  evidenceRefs: ["vitals://enc_p002_001/spo2#vital_647c98955de3bdeb"],
};

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeJsonForHtml(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e").replaceAll("&", "\\u0026");
}

function trendDelta(metric: keyof CanvasClinicalData["trends"]): string {
  return (clinicalData.trends[metric] ?? []).map((point) => String(point.value)).join(" → ");
}

function applyClinicalData(data: CanvasClinicalData): void {
  clinicalData = data;
  vitals[0].value = String(data.latestVitals.spo2?.value ?? vitals[0].value);
  vitals[0].delta = `${trendDelta("spo2")} · trigger`;
  vitals[1].value = String(data.latestVitals.heart_rate?.value ?? vitals[1].value);
  vitals[1].delta = trendDelta("heart_rate");
  vitals[2].value = String(data.latestVitals.respiratory_rate?.value ?? vitals[2].value);
  vitals[2].delta = `${trendDelta("respiratory_rate")} · WoB ↑`;
  const oxygen = data.latestVitals.spo2?.context?.o2_flow_lpm ? `${data.latestVitals.spo2.context.o2_flow_lpm}L mask` : "6L mask";
  vitals[0].label = `SpO₂ · ${oxygen}`;
  worklist = worklist.map((item) => item.artifactId === "resp-reassessment"
    ? { ...item, title: data.openLoop.title, detail: data.openLoop.detail, meta: data.openLoop.meta }
    : item);
  const spo2Ref = vitalSourceRef(demoAgentCanvasParams.encounterId, "spo2", data.latestVitals.spo2);
  const rrRef = vitalSourceRef(demoAgentCanvasParams.encounterId, "respiratory_rate", data.latestVitals.respiratory_rate);
  const respArtifact = artifacts.find((artifact) => artifact.id === "resp-reassessment");
  if (respArtifact) {
    respArtifact.sourceRefs = [spo2Ref, rrRef];
    respArtifact.context = [
      `Linked loop: ${data.openLoop.title} due 09:50`,
      `Evidence: ${spo2Ref} · ${rrRef}`,
      "Owners: Primary RN · Support: RT, MD",
      "Visibility: Care team",
    ];
  }
  const handoffArtifact = artifacts.find((artifact) => artifact.id === "handoff-draft");
  if (handoffArtifact) {
    handoffArtifact.context = [
      "Sources: handoff note · latest vitals sample keys · memoryProof evidence",
      data.handoffExcerpt,
      "Not chart truth until RN reviews and Charts",
    ];
  }
}

function renderVitals(): string {
  const cards = vitals.map((vital) => `<div class="vital${vital.signal ? " signal" : ""}">
  <div class="vital-name">${escapeHtml(vital.label)}</div>
  <div class="vital-now">${escapeHtml(vital.value)}<small>${escapeHtml(vital.unit)}</small></div>
  <div class="vital-delta">${escapeHtml(vital.delta)}</div>
  <svg width="100%" height="30" viewBox="0 0 168 30" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="currentColor" stroke-width="1.4" points="${vital.points}"/></svg>
</div>`).join("\n");
  return `<section class="vitals-row">
${cards}
<div class="vital trajectory">
  <div class="vital-name">Trajectory summary</div>
  <div class="trajectory-title">oxygenation worsening over 30m</div>
  <div class="trajectory-pills"><span>ABG<br/>09:25</span><span>Lactate<br/>2.8</span><span>WoB<br/>↑</span></div>
</div>
</section>`;
}

function renderTimeline(): string {
  const rows = timelineRows.map((row) => `<div class="timeline-row${row.signal ? " signal" : ""}">
  <div class="timeline-time">${escapeHtml(row.time)}</div>
  <div><span class="timeline-tag">${escapeHtml(row.event)}</span></div>
  <div class="timeline-main">${escapeHtml(row.text)}<span>${escapeHtml(row.sub)}</span></div>
  <div class="timeline-source">${escapeHtml(row.source)}</div>
</div>`).join("\n");
  return `<section class="timeline panel">
  <div class="panel-head"><h2>Problem-oriented timeline · ${escapeHtml(patient.encounter)}</h2><div class="timeline-tabs"><span>07:00</span><b>09:30</b><span>next 09:50</span></div></div>
  <div class="timeline-cols"><span>Time</span><span>Event</span><span></span><span>Source</span></div>
  ${rows}
</section>`;
}

function storyboardViews(): Record<StoryboardView, string> {
  return {
    overview: renderTimeline(),
    handoff: `<section class="panel story-panel"><div class="panel-head"><h2>Handoff report · source-linked draft workspace</h2><button data-artifact="handoff-draft">Open editable handoff pane</button></div><div class="story-grid"><article><h3>Day-shift handoff</h3><p>Patient 002 is a CAP day 1 respiratory watcher with worsening oxygenation despite escalation to 6L simple mask.</p><ul><li>Current: SpO₂ 89% on 6L simple mask, RR 30, HR 112.</li><li>Open loop due 09:50: reassess oxygen response and work of breathing.</li><li>Escalate if SpO₂ &lt; 90% or accessory muscle use persists.</li></ul></article><aside><b>Source context rail</b><p>09:30 handoff · 09:25 lactate 2.8 · 09:20 bedside WoB note · current vitals trend.</p><p class="truth-note">Generated draft. Not chart truth until RN clicks Chart / FINAL CLINICAL WRITE.</p></aside></div></section>`,
    vitals: `<section class="panel story-panel"><div class="panel-head"><h2>Vitals / flowsheet · previous-shift trend</h2><button data-artifact="due-vitals">Chart due vitals</button></div><div class="flowsheet"><div class="flow-head"><span>Time</span><span>SpO₂</span><span>HR</span><span>RR</span><span>BP</span><span>O₂ support</span><span>WoB</span></div><div><span>07:00</span><b>96%</b><span>98</span><span>24</span><span>126/76</span><span>Room air baseline</span><span>none</span></div><div><span>09:00</span><b>92%</b><span>102</span><span>26</span><span>128/74</span><span>3L NC</span><span>dyspnea report</span></div><div><span>09:15</span><b class="signal-text">88%</b><span>108</span><span>28</span><span>130/76</span><span>3L NC → 6L mask</span><span>accessory use</span></div><div><span>09:30</span><b class="signal-text">89%</b><span>112</span><span class="signal-text">30</span><span>128/74</span><span>6L simple mask</span><span>persistent</span></div></div><p class="truth-note">Due marker: q1h vitals + respiratory reassessment. Bedside confirmation required before Chart.</p></section>`,
    mar: `<section class="panel story-panel"><div class="panel-head"><h2>Meds / MAR · medication safety gate</h2><button data-artifact="zosyn-blocked">Review Zosyn safety gate</button></div><div class="mar-grid"><div class="mar-row"><b>Zosyn due at 12:00</b><span class="status blocked">SCAN REQUIRED</span><p>Piperacillin/Tazobactam 4.5 g IV q8h. Medication administration cannot be auto-charted by agent.</p></div><div class="mar-row"><b>Acetaminophen PRN</b><span>available</span><p>Review pain/temperature context before administration.</p></div><div class="mar-row done"><b>Azithromycin</b><span>Charted 06:00</span><p>Prior administration visible as chart truth.</p></div></div><p class="truth-note">MAR administration requires bedside medication scan, patient scan / two-ID workflow, and RN attestation.</p></section>`,
    notes: `<section class="panel story-panel"><div class="panel-head"><h2>Notes · provider assessment and generated synthesis separated</h2><button data-artifact="sbar-draft">Open SBAR draft</button></div><div class="note-lanes"><article><span class="lane-label">Charted provider note</span><h3>Provider assessment / plan</h3><p>Community-acquired pneumonia with escalating oxygen requirement. Continue close respiratory monitoring; ABG/lactate ordered after worsening work of breathing.</p></article><article><span class="lane-label">Charted nursing note</span><h3>Bedside WoB note</h3><p>Accessory muscle use, short phrases, high Fowler's positioning. Oxygen increased to simple mask per bedside assessment.</p></article><article><span class="lane-label draft-label">Pi-agent generated summary · draft</span><h3>Respiratory trajectory synthesis</h3><p>Summarizes source notes and vitals trend. Not chart truth unless clinician stages and Charts as final clinical write.</p></article></div></section>`,
    labs: `<section class="panel story-panel"><div class="panel-head"><h2>Labs / dx · ABG/lactate context</h2></div><div class="lab-grid"><div><span class="lane-label">09:25 ABG/lactate</span><h3>Lactate 2.8 mmol/L</h3><p>Supports close monitoring in CAP/respiratory watcher context; not a standalone explanation for work of breathing.</p></div><div><span class="lane-label">Respiratory relevance</span><h3>Connects to open loop</h3><p>Use with SpO₂ trend, RR 30, and accessory muscle use to decide whether to escalate at 09:50 reassessment.</p></div></div></section>`,
    radiology: `<section class="panel story-panel"><div class="panel-head"><h2>Radiology / imaging · CXR report</h2></div><article class="report"><span class="lane-label">CXR · 2026-04-19 08:40 · final report</span><h3>Impression</h3><p>Right lower-lobe airspace opacity compatible with pneumonia. No large pleural effusion. Imaging supports CAP problem context and should be read alongside current oxygenation trajectory.</p><p class="truth-note">Charted imaging report; Pi-agent summaries must cite this source if used in handoff or SBAR drafts.</p></article></section>`,
    agent: `<section class="panel story-panel"><div class="panel-head"><h2>Pi-agent shift organization · advisory/process</h2><button data-artifact="handoff-draft">Create/update handoff draft</button></div><div class="agent-response"><p><b>RN prompt:</b> Organize my shift and tell me what I should pay attention to.</p><ol><li><b>Watch now:</b> Reassess O₂ response and work of breathing by 09:50; escalate if SpO₂ &lt; 90% or accessory muscle use persists.</li><li><b>Due tasks:</b> q1h vitals + respiratory reassessment; document O₂ device/support and WoB.</li><li><b>Medication safety gates:</b> Zosyn due 12:00 requires med scan + patient scan + RN attestation; I cannot Chart med administration.</li><li><b>Results:</b> Lactate 2.8 and CXR support CAP/respiratory context.</li><li><b>Documentation:</b> Handoff and SBAR drafts are available, but become chart truth only after clinician Chart action.</li></ol><p class="truth-note">Co-pilot advice only. Chart truth changes only through clinician final clinical write.</p></div></section>`,
  };
}

function sectionCount(section: WorklistSection): number {
  return worklist.filter((item) => item.section === section).length;
}

function renderWorklistSection(section: WorklistSection, index: number): string {
  const items = worklist.filter((item) => item.section === section).map((item) => `<button class="worklist-item ${item.status}" type="button"${item.artifactId ? ` data-artifact="${escapeHtml(item.artifactId)}"` : ""}>
  <span class="marker"></span>
  <span><span class="worklist-title">${escapeHtml(item.title)}</span><span class="worklist-detail">${escapeHtml(item.detail)}</span></span>
  <span class="worklist-meta">${escapeHtml(item.meta)}</span>
</button>`).join("\n");
  const role = section === "Due / Overdue" ? ` data-role="due-overdue"` : "";
  return `<section class="worklist-section"${role}><div class="worklist-section-head"><span>${index}</span><b>${escapeHtml(section)}</b><em>${sectionCount(section)}</em></div>${items}</section>`;
}

function renderAgentSuggestions(): string {
  return `<section class="worklist-section agent-suggestions" data-role="agent-suggestions" data-advisory="true" hidden><div class="worklist-section-head"><span>π</span><b>Agent Suggestions</b><em>advisory</em></div><div class="agent-suggestion-card"><span class="draft-label">Requires clinician Accept</span><b id="agent-suggestion-title">Suggested draft</b><p id="agent-suggestion-body"></p><button type="button">Accept to worklist</button></div></section>`;
}

function renderWorklist(): string {
  const sections: WorklistSection[] = ["Due / Overdue", "Staged Charting", "Generated Drafts", "Blocked MAR Items", "Charted / Done"];
  return `<aside class="clinical-worklist"><div class="worklist-top"><b>Clinical worklist</b><span>8 active ⚙</span></div>${sections.map((section, index) => renderWorklistSection(section, index + 1)).join("\n")}${renderAgentSuggestions()}<div class="worklist-foot"><span>Filters:</span><button>All</button><button>Hide done</button><button>Manage</button></div></aside>`;
}

function renderArtifactPane(): string {
  return `<section class="artifact-pane" aria-label="Editable charting pane" hidden>
  <div class="artifact-titlebar" id="artifact-titlebar" data-freshness="current"><b id="artifact-title">Editable artifact</b><span id="artifact-freshness">current</span><button id="minimize-artifact" aria-label="Minimize artifact pane">−</button><button aria-label="Expand artifact pane">□</button><button id="close-artifact" aria-label="Close artifact pane">×</button></div>
  <div class="artifact-badges" id="artifact-badges"></div>
  <div class="markdown-mode"><b>Markdown</b><span>Preview</span></div>
  <div class="markdown-toolbar" aria-label="Markdown toolbar"><button>B</button><button><i>I</i></button><button>☰</button><button>↔</button><button>🔗</button><button>◫</button><button>H</button><button>&lt;/&gt;</button><button>▦</button><select aria-label="Format"><option>Normal</option></select></div>
  <div class="artifact-grid"><textarea aria-label="Resp reassessment markdown editor" id="artifact-editor" spellcheck="true"></textarea><aside class="artifact-context"><b>Artifact context</b><ul id="artifact-context"></ul></aside></div>
  <div class="artifact-actions"><div class="artifact-tags" id="artifact-tags">Tags</div><button id="discard-draft">Discard draft</button><button class="stage" id="stage-draft">Stage draft</button><button class="chart" id="chart-artifact">Chart <small>FINAL CLINICAL WRITE</small></button></div>
  <div class="resize-corner" aria-hidden="true">⌟</div>
</section>`;
}

function renderNav(): string {
  const items: { view?: StoryboardView; label: string; count: string; alert?: boolean; group?: string }[] = [
    { group: "Chart", view: "overview", label: "⌂  Overview", count: "1" },
    { view: "agent", label: "◎  Agent Canvas", count: "4 ●" },
    { label: "⊕  Problems", count: "2" },
    { label: "⊕  Constraints", count: "2" },
    { label: "⊕  Encounters", count: "1" },
    { group: "Streams", view: "vitals", label: "⌁  Vitals / flowsheet", count: "31" },
    { view: "labs", label: "⌬  Labs / dx", count: "3 new" },
    { view: "radiology", label: "◫  Radiology / imaging", count: "CXR" },
    { view: "mar", label: "⌘  Meds / MAR", count: "2" },
    { label: "✥  Orders / intents", count: "3" },
    { label: "○  Open loops", count: "3", alert: true },
    { group: "Narrative", view: "notes", label: "◧  Notes", count: "3" },
    { label: "☑  Communications", count: "1 SBAR" },
    { label: "▣  Assessment", count: "2" },
    { view: "handoff", label: "☑  Care plan / handoff", count: "1" },
    { group: "Evidence", label: "⊕  Evidence chain", count: "graph" },
    { label: "◈  Audit / authors", count: "5" },
  ];
  let html = "";
  let currentGroup = "";
  for (const item of items) {
    if (item.group && item.group !== currentGroup) {
      html += `<div class="group">${escapeHtml(item.group)}</div>`;
      currentGroup = item.group;
    }
    const attrs = item.view ? `href="#${item.view}" data-view="${item.view}"` : `href="#"`;
    html += `<a ${attrs} class="${item.alert ? "alert" : ""}${item.view === "overview" ? " active" : ""}"><span>${escapeHtml(item.label)}</span><span class="ct">${escapeHtml(item.count)}</span></a>`;
  }
  return `<nav class="left-nav" aria-label="Chart navigation">${html}<div class="nav-foot"><div>Agent layer is global.</div><div>Chart is process, not chat truth.</div></div></nav>`;
}

function styles(): string {
  return `:root{--app-boundary:#f4f2ee;--panel-surface:#fbfaf7;--black-rule:#1a1a1a;--soft-rule:rgba(26,26,26,.18);--clinical-red:#c7352d;--clinical-red-soft:rgba(199,53,45,.09);--clinical-orange:#bd6f14;--muted-text:#66615b;--selected-nav-bg:#ebe8e2;--ink:#111;--ink-2:#3f3c38;--ink-3:#85807a;--dock-h:46px;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:"Inter Tight",Inter,system-ui,-apple-system,"Segoe UI",sans-serif}*{box-sizing:border-box}html,body{margin:0}body{color:var(--ink);background:radial-gradient(ellipse at 20% 0%,#efece6 0%,var(--app-boundary) 52%) fixed,var(--app-boundary);font:13px/1.35 var(--sans);letter-spacing:-.005em;-webkit-font-smoothing:antialiased;padding-bottom:76px}button,textarea,select{font:inherit;color:inherit}.stage{width:100%;max-width:1480px;margin:0 auto;padding:16px 20px 10px}.tag,.mono{font-family:var(--mono);letter-spacing:.14em;text-transform:uppercase}.tag{font-size:10px;color:var(--ink-3)}.docband{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid var(--black-rule);padding-bottom:12px;margin-bottom:10px}.docband h1{margin:4px 0 5px;font-size:27px;line-height:1;font-weight:550;letter-spacing:-.03em}.docband .pi{font-family:var(--mono);font-weight:700}.docband .sub{font-size:12px;color:var(--ink-2);max-width:720px}.docband .right{text-align:right;font:11px var(--mono);color:var(--ink-2)}.docband .right .row{display:flex;gap:22px;justify-content:flex-end;margin-bottom:4px}.stamp{display:inline-block;border:1px solid var(--black-rule);padding:6px 23px;margin-left:8px;font:11px var(--mono);letter-spacing:.16em;text-transform:uppercase}.stamp.warn{border-color:var(--clinical-orange);color:var(--clinical-orange);background:#fff9ed}.patient-banner{display:grid;grid-template-columns:1.45fr .85fr 1.05fr .72fr .8fr;border:1px solid var(--black-rule);background:var(--panel-surface);margin-bottom:10px}.banner-cell{min-height:104px;padding:14px 16px;border-right:1px solid var(--soft-rule)}.banner-cell:last-child{border-right:0}.patient-line{display:flex;align-items:center;gap:14px;margin:6px 0 8px}.patient-name{font-size:20px;font-weight:560}.code-pill{border:1px solid var(--black-rule);padding:5px 13px;font:11px var(--mono);letter-spacing:.12em;text-transform:uppercase;background:#fff}.watcher{display:inline-flex;align-items:center;gap:9px;border:1px solid var(--clinical-red);color:var(--clinical-red);background:#fff;padding:5px 10px;font:700 11px var(--mono);letter-spacing:.16em;text-transform:uppercase}.watcher:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--clinical-red);box-shadow:0 0 0 3px var(--clinical-red-soft)}.small-meta{font:11px/1.55 var(--mono);color:var(--ink-2)}.layout{display:grid;grid-template-columns:204px minmax(0,1fr) 292px;gap:10px;align-items:start}.left-nav,.panel,.clinical-worklist,.artifact-pane{border:1px solid var(--black-rule);background:var(--panel-surface)}.left-nav{min-height:652px;padding:10px 0}.left-nav .group{font:9.5px var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--ink-3);padding:0 14px 6px;margin-top:14px}.left-nav .group:first-child{margin-top:0}.left-nav a{display:flex;justify-content:space-between;align-items:center;text-decoration:none;color:var(--ink);padding:7px 14px;border-left:2px solid transparent;font-size:13px}.left-nav a.active{background:var(--selected-nav-bg);border-left-color:var(--black-rule);font-weight:600}.left-nav .ct{font:10px var(--mono);color:var(--ink-3)}.left-nav a.alert,.left-nav a.alert .ct{color:var(--clinical-red)}.nav-foot{margin-top:22px;padding:12px 14px;border-top:1px solid var(--soft-rule);font:10px/1.65 var(--mono);color:var(--ink-3)}.workspace{position:relative;min-height:652px}.vitals-row{display:grid;grid-template-columns:repeat(4,1fr) 1.15fr;border:1px solid var(--black-rule);background:var(--panel-surface);margin-bottom:10px}.vital{min-height:134px;padding:12px 14px 10px;border-right:1px solid var(--soft-rule);position:relative}.vital:last-child{border-right:0}.vital-name{font:9.5px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)}.vital-now{font:500 28px/1 var(--mono);letter-spacing:-.04em;margin-top:6px}.vital-now small{font-size:11px;color:var(--ink-2);margin-left:4px;letter-spacing:0}.vital-delta{font:10.5px var(--mono);margin-top:5px;color:var(--ink-2)}.vital.signal,.vital.signal .vital-delta,.vital.signal .vital-now,.signal-text{color:var(--clinical-red)}.vital svg{position:absolute;left:14px;right:14px;bottom:10px;width:calc(100% - 28px)}.trajectory-title{font-size:18px;font-weight:650;line-height:1.1;margin-top:8px}.trajectory-pills{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:16px}.trajectory-pills span{border:1px solid var(--soft-rule);background:#fff;padding:5px 4px;text-align:center;font:10px/1.25 var(--mono)}.panel-head{display:flex;justify-content:space-between;align-items:baseline;border-bottom:1px solid var(--soft-rule);padding:10px 14px;gap:10px}.panel-head h2{margin:0;font:600 12px var(--mono);letter-spacing:.12em;text-transform:uppercase}.panel-head button{border:1px solid var(--black-rule);background:#fff;padding:6px 10px;font:10.5px var(--mono);letter-spacing:.08em;text-transform:uppercase}.timeline{min-height:640px;overflow:hidden}.timeline-tabs{display:flex;gap:10px;align-items:center}.timeline-tabs span,.timeline-tabs b{border:1px solid var(--soft-rule);padding:4px 10px;font:11px var(--mono);font-weight:400;background:#fff}.timeline-tabs b{border-color:var(--black-rule);font-weight:600}.timeline-cols,.timeline-row{display:grid;grid-template-columns:54px 70px minmax(0,1fr) 78px;gap:10px;align-items:center}.timeline-cols{padding:8px 14px 5px;border-bottom:1px solid var(--black-rule);font:10px var(--mono);text-transform:uppercase;color:var(--ink-2)}.timeline-row{min-height:38px;padding:5px 14px;border-bottom:1px solid var(--soft-rule)}.timeline-time,.timeline-source{font:10.5px var(--mono);color:var(--muted-text)}.timeline-source{text-align:right}.timeline-tag{display:inline-block;border:1px solid var(--soft-rule);background:#fff;padding:3px 7px;font:10px var(--mono);letter-spacing:.08em}.timeline-row.signal .timeline-tag{border-color:var(--clinical-red);color:var(--clinical-red);background:var(--clinical-red-soft)}.timeline-row.signal .timeline-main{color:var(--clinical-red);font-weight:650}.timeline-main span{display:block;margin-top:2px;font:10.5px var(--mono);color:var(--ink-2)}.clinical-worklist{min-height:742px;display:flex;flex-direction:column}.worklist-top{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid var(--soft-rule);font:11px var(--mono);letter-spacing:.14em;text-transform:uppercase}.worklist-top span{letter-spacing:0;color:var(--ink-2)}.worklist-section{border-bottom:1px solid var(--black-rule)}.worklist-section-head{display:grid;grid-template-columns:18px 1fr auto;gap:8px;padding:8px 12px;border-bottom:1px solid var(--soft-rule);font:700 11px var(--mono);letter-spacing:.12em;text-transform:uppercase}.worklist-section-head:first-letter,.worklist-section:nth-of-type(2) .worklist-section-head{color:var(--clinical-red)}.worklist-section-head em{font-style:normal;color:var(--ink-2)}.worklist-item{width:100%;display:grid;grid-template-columns:14px 1fr auto;gap:9px;padding:9px 12px;border:0;border-top:1px solid var(--soft-rule);align-items:start;text-align:left;background:transparent;cursor:pointer}.worklist-item:first-of-type{border-top:0}.worklist-item:hover{background:#fff}.marker{width:10px;height:10px;border:1px solid var(--ink);border-radius:50%;margin-top:3px}.worklist-item.due .marker,.worklist-item.blocked .marker{background:var(--clinical-red);border-color:var(--clinical-red)}.worklist-item.staged .marker{background:var(--clinical-orange);border-color:var(--clinical-orange)}.worklist-title{display:block;font-size:12.5px;font-weight:650;letter-spacing:-.005em}.worklist-detail{display:block;font:10.5px/1.45 var(--mono);color:var(--ink-2);margin-top:2px}.worklist-meta{font:10px var(--mono);color:var(--clinical-red);white-space:nowrap;text-align:right}.worklist-item.done{color:var(--ink-2)}.worklist-item.done .marker{background:#fff}.worklist-item.done .worklist-meta{color:var(--ink-3)}.worklist-foot{margin-top:auto;display:flex;gap:8px;align-items:center;border-top:1px solid var(--soft-rule);padding:12px;font:10.5px var(--mono)}.worklist-foot button{border:0;background:transparent}.worklist-foot button:last-child{margin-left:auto;border:1px solid var(--black-rule);padding:7px 16px;background:#fff}.agent-suggestions{background:#fffdf8}.agent-suggestion-card{padding:10px 12px;border-top:1px solid var(--soft-rule);font:10.5px/1.45 var(--mono)}.agent-suggestion-card b{display:block;font:650 12px var(--sans);letter-spacing:0;margin:4px 0}.agent-suggestion-card p{margin:4px 0 8px;color:var(--ink-2)}.agent-suggestion-card button{border:1px solid var(--black-rule);background:#fff;padding:6px 9px;font:10px var(--mono);letter-spacing:.08em;text-transform:uppercase}.artifact-pane{position:absolute;top:10px;right:10px;width:min(650px,84%);height:380px;min-width:520px;min-height:260px;max-width:calc(100% - 20px);max-height:580px;resize:horizontal;overflow:auto;box-shadow:0 8px 24px rgba(0,0,0,.12);background:var(--panel-surface);z-index:30}.artifact-pane[hidden]{display:none}.artifact-titlebar{display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--soft-rule);padding:8px 10px;font:11px var(--mono);letter-spacing:.12em;text-transform:uppercase}.artifact-titlebar b{margin-right:auto}.artifact-titlebar button{border:0;background:transparent;font:18px/1 var(--mono);cursor:pointer}.artifact-badges{display:flex;gap:8px;flex-wrap:wrap;padding:10px 14px 0}.artifact-badges span{border:1px solid var(--soft-rule);padding:5px 9px;font:10px var(--mono);letter-spacing:.1em;text-transform:uppercase;background:#fff}.artifact-badges span:first-child{border-color:var(--clinical-red);color:var(--clinical-red);background:var(--clinical-red-soft);font-weight:700}.artifact-badges span:last-child{border-color:var(--clinical-orange);color:var(--clinical-orange);background:#fff9ed}.markdown-mode{display:flex;gap:16px;margin:10px 14px 0;border-bottom:1px solid var(--soft-rule);font:10.5px var(--mono);letter-spacing:.12em;text-transform:uppercase}.markdown-mode b{border-bottom:1px solid var(--black-rule);padding-bottom:5px}.markdown-mode span{color:var(--ink-3)}.markdown-toolbar{display:flex;gap:2px;align-items:center;padding:8px 14px;border-bottom:1px solid var(--soft-rule)}.markdown-toolbar button,.markdown-toolbar select{border:0;background:transparent;min-width:24px;height:22px;font:12px var(--mono)}.artifact-grid{display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:12px;padding:10px 14px}.artifact-grid textarea{width:100%;min-height:126px;border:0;resize:none;background:transparent;font:13px/1.45 var(--mono);outline:0}.artifact-context{border-left:1px solid var(--soft-rule);padding-left:12px;font:10px/1.45 var(--mono);color:var(--ink-2)}.artifact-context b{text-transform:uppercase;letter-spacing:.12em;color:var(--ink)}.artifact-context ul{padding-left:14px;margin:7px 0 0}.artifact-actions{display:grid;grid-template-columns:1fr 110px 112px 150px;gap:10px;align-items:center;border-top:1px solid var(--soft-rule);padding:10px 14px}.artifact-tags{font:10px var(--mono);color:var(--ink-2)}.artifact-actions button{border:1px solid var(--black-rule);background:#fff;padding:8px 10px;font:11px var(--mono);letter-spacing:.08em}.artifact-actions .stage{width:auto;margin:0;border-color:var(--clinical-orange);color:var(--clinical-orange);background:#fff9ed}.artifact-actions .chart{background:var(--black-rule);color:var(--panel-surface);font-weight:700;line-height:1.05}.artifact-actions .chart small{display:block;font-size:8px;letter-spacing:.12em;margin-top:2px}.artifact-actions .chart:disabled{background:#fff;color:var(--clinical-red);border-color:var(--clinical-red);cursor:not-allowed}.resize-corner{position:absolute;right:5px;bottom:3px;font:18px var(--mono);color:var(--ink-3)}.story-panel{min-height:640px;padding-bottom:18px}.story-panel h3{margin:6px 0 8px;font-size:22px;letter-spacing:-.02em}.story-panel p,.story-panel li{font-size:13px}.story-grid,.lab-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(220px,.8fr);gap:16px;padding:16px}.story-grid article,.story-grid aside,.lab-grid>div,.note-lanes article,.mar-row,.report,.agent-response{border:1px solid var(--soft-rule);background:#fff;padding:14px}.truth-note{font:11px/1.45 var(--mono);color:var(--clinical-red);border-top:1px solid var(--soft-rule);padding-top:8px}.flowsheet{margin:16px;border:1px solid var(--black-rule)}.flowsheet>div{display:grid;grid-template-columns:70px 70px 60px 60px 90px minmax(140px,1fr) minmax(130px,1fr);gap:8px;padding:9px 12px;border-top:1px solid var(--soft-rule);font:12px var(--mono)}.flowsheet .flow-head{border-top:0;background:#fff;text-transform:uppercase;font-size:10px;color:var(--ink-2)}.mar-grid,.note-lanes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:16px}.status.blocked,.draft-label{color:var(--clinical-red);font:700 10px var(--mono);letter-spacing:.12em;text-transform:uppercase}.mar-row span:not(.status),.lane-label{display:inline-block;font:10px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:6px}.agent-response{margin:16px}.agent-response ol{padding-left:20px}.agent-dock{position:fixed;left:20px;right:20px;bottom:14px;max-width:1440px;margin:0 auto;min-height:var(--dock-h);border:1px solid var(--black-rule);background:var(--panel-surface);z-index:20;font:11px var(--mono);letter-spacing:.08em}.agent-line{height:var(--dock-h);display:grid;grid-template-columns:auto max-content minmax(0,1fr) max-content max-content;gap:18px;align-items:center;padding:0 14px}.agent-dock b{text-transform:uppercase}.agent-dock .play{font-size:22px}.agent-dock .message{letter-spacing:0;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.agent-dock button{border:1px solid var(--black-rule);background:#fff;padding:8px 20px;font:11px var(--mono);letter-spacing:.12em;text-transform:uppercase}.agent-chat{display:grid;grid-template-columns:max-content max-content minmax(0,1fr) max-content;gap:10px;align-items:center;border-top:1px solid var(--soft-rule);padding:8px 14px}.agent-chat[hidden],.agent-response-strip[hidden],.agent-suggestions[hidden]{display:none}.agent-chat label{white-space:nowrap;text-transform:uppercase;color:var(--ink-2)}.agent-chat input{min-width:0;border:1px solid var(--soft-rule);background:#fff;padding:7px 10px;font:12px var(--mono)}.agent-intents{display:flex;gap:7px;border:0;margin:0;padding:0}.agent-intents label{display:flex;gap:3px;align-items:center;font:9.5px var(--mono);letter-spacing:.08em}.agent-intents input{accent-color:var(--clinical-orange)}.agent-response-strip{border-top:1px solid var(--soft-rule);padding:8px 14px;display:grid;grid-template-columns:148px minmax(0,1fr);gap:12px;background:#fffdf8}.agent-response-strip b{font:10px var(--mono);letter-spacing:.14em;color:var(--clinical-orange)}.agent-response-strip span{letter-spacing:0;color:var(--ink-2)}@media(max-width:1300px){.stage{padding:12px}.layout{grid-template-columns:190px minmax(0,1fr) 278px;gap:8px}.patient-banner{grid-template-columns:1.35fr .82fr 1fr .75fr}.banner-cell:nth-child(5){display:none}.artifact-pane{width:min(650px,84%);height:320px}.docband .sub{max-width:560px}.docband .right .row{gap:12px}.stamp{padding-left:14px;padding-right:14px}.mar-grid,.note-lanes{grid-template-columns:1fr}.artifact-actions{grid-template-columns:1fr 95px 100px 132px}}`;
}

function renderIntentRadios(): string {
  return `<fieldset class="agent-intents" aria-label="Agent intent">${INTENTS.map((intent) => `<label><input type="radio" name="agent-intent" value="${escapeHtml(intent)}" data-role="intent-radio"${intent === "documentation" ? " checked" : ""}/> ${escapeHtml(intent)}</label>`).join("")}</fieldset>`;
}

function clientScript(): string {
  return `const data=JSON.parse(document.getElementById("app-data").textContent);let currentArtifact=null;const artifactFreshness=Object.fromEntries(data.artifacts.map(a=>[a.id,a.freshness||"current"]));const pane=document.querySelector(".artifact-pane");const workspace=document.getElementById("workspace-content");const title=document.getElementById("view-title");function q(s){return document.querySelector(s)}function qa(s){return Array.from(document.querySelectorAll(s))}function esc(s){return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}function viewDensity(view){return data.viewDensities[view]||"narrative"}function setDockOpen(open){const dock=q("#agent-dock");const chat=q("#agent-chat");const response=q("#agent-response");const btn=q("#agent-open");dock.classList.toggle("open",open);chat.hidden=!open;if(!open)response.hidden=true;btn.textContent=open?"Hide":"Open";btn.setAttribute("aria-expanded",String(open))}function applyDockForView(view){setDockOpen(viewDensity(view)!=="grid")}function setView(view){workspace.innerHTML=data.views[view]||data.views.overview;qa("[data-view]").forEach(a=>a.classList.toggle("active",a.dataset.view===view));title.textContent="/ "+(view==="mar"?"meds / MAR":view==="agent"?"agent canvas":view);document.title="pi-chart / "+view;wireButtons();applyDockForView(view)}function openArtifact(id){const a=data.artifacts.find(x=>x.id===id);if(!a)return;currentArtifact=a;pane.hidden=false;const freshness=artifactFreshness[a.id]||a.freshness||"current";q("#artifact-titlebar").dataset.freshness=freshness;q("#artifact-freshness").textContent=freshness;q("#artifact-title").textContent=a.kind+" · "+a.title;q("#artifact-badges").innerHTML=a.badges.map(b=>"<span>"+esc(b)+"</span>").join("")+(data.sourceRefCounts[a.id]===0?"<span>Warning: Unverified Synthesis</span>":"");q("#artifact-editor").value=a.markdown;q("#artifact-context").innerHTML=a.context.map(c=>"<li>"+c+"</li>").join("");q("#artifact-tags").textContent="Tags  "+a.tags;const chart=q("#chart-artifact");chart.disabled=Boolean(a.blocked);chart.innerHTML=a.blocked?"Scan required <small>MAR GATE</small>":"Chart <small>FINAL CLINICAL WRITE</small>"}function closeArtifact(){pane.hidden=true}function wireButtons(){qa("[data-artifact]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();openArtifact(b.dataset.artifact)}))}qa("[data-view]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();setView(a.dataset.view)}));q("#close-artifact").addEventListener("click",closeArtifact);q("#minimize-artifact").addEventListener("click",closeArtifact);q("#stage-draft").addEventListener("click",()=>{if(currentArtifact){q("#artifact-tags").textContent="Status  staged · "+currentArtifact.tags}});q("#discard-draft").addEventListener("click",()=>{if(currentArtifact){q("#artifact-tags").textContent="Status  discarded draft · "+currentArtifact.tags}});q("#chart-artifact").addEventListener("click",()=>{if(!currentArtifact)return;if(currentArtifact.blocked){q("#artifact-tags").textContent="Blocked  scan/attestation required · "+currentArtifact.tags;return}closeArtifact();qa("[data-artifact='"+currentArtifact.id+"'] .worklist-meta").forEach(el=>el.textContent="charted")});q("#agent-open").addEventListener("click",()=>{const willOpen=q("#agent-chat").hidden;setDockOpen(willOpen);if(willOpen)setView("agent")});function renderAgentSuggestion(){const draft=data.mockDraftResponse.suggestedDrafts[0];const lane=q('[data-role="agent-suggestions"]');lane.hidden=false;q("#agent-suggestion-title").textContent=draft.kind+" suggestion";q("#agent-suggestion-body").textContent=draft.body}q("#agent-chat").addEventListener("submit",e=>{e.preventDefault();setDockOpen(true);const intent=(q('input[name="agent-intent"]:checked')||{}).value||"documentation";const response=q("#agent-response");response.hidden=false;if(intent==="documentation"){renderAgentSuggestion();response.querySelector("span").textContent="Draft suggestion parked in the advisory lane. Accept is required before it can become clinical work."}else{q('[data-role="agent-suggestions"]').hidden=true;response.querySelector("span").textContent=data.blockedAdminResponse.banner}setView("agent")});window.addEventListener("pi-chart:vitals-shift",()=>{data.artifacts.forEach(a=>{const refs=a.sourceRefs||[];if(refs.some(ref=>String(ref).startsWith("vitals://"))){artifactFreshness[a.id]="stale"}});if(currentArtifact&&artifactFreshness[currentArtifact.id]==="stale"){q("#artifact-titlebar").dataset.freshness="stale";q("#artifact-freshness").textContent="stale"}});wireButtons();`;
}

function renderAgentCanvasContextFixture() {
  const context = agentCanvasContext;
  if (!context) throw new Error("agent canvas context not loaded");
  return {
    generatedAt: context.generatedAt,
    patientId: context.patientId,
    encounterId: context.encounterId,
    asOf: context.asOf,
    sourceViewRefs: context.sourceViewRefs,
    views: context.views,
    latestVitals: context.clinical.latestVitals,
    trends: context.clinical.trends,
    openLoop: context.clinical.openLoop,
    evidenceRefs: context.clinical.evidenceRefs,
    artifacts: artifacts.map((artifact) => ({
      id: artifact.id,
      sourceRefs: artifact.sourceRefs ?? [],
      freshness: artifact.freshness ?? "current",
      provenance: artifact.provenance,
    })),
  };
}

function renderHtml(): string {
  const views = storyboardViews();
  const viewDensities = Object.fromEntries(chartViews.map((view) => [view.id, view.density]));
  const contextBundle = buildContextBundle("overview", {
    mar: { activeBlocks: [{ kind: "clinical-note", reason: "Medication administration requires bedside scan and clinician attestation before MAR documentation." }] },
    recentArtifacts: artifacts.map((artifact) => ({
      kind: artifact.id === "resp-reassessment" ? "open-loop-disposition" : "clinical-note",
      id: artifact.id,
      sourceRefs: artifact.sourceRefs ?? [],
    })),
    requiresReview: ["clinical-note", "open-loop-disposition"],
  });
  const marState = deriveMarState(contextBundle);
  const sourceRefCounts = Object.fromEntries(contextBundle.recentArtifacts.map((artifact) => [artifact.id, artifact.sourceRefs.length]));
  const mockDraftResponse = mockAgentRespond({ view: "overview", intent: "documentation", marState, prompt: "Organize my shift and tell me what I should pay attention to.", contextBundle });
  const blockedAdminResponse = mockAgentRespond({ view: "overview", intent: "administration", marState, prompt: "draft the dose", contextBundle });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=1480" />
<title>pi-chart / overview</title>
<style>${styles()}</style>
</head>
<body>
<div class="stage">
  <header class="docband"><div><div class="tag">PI-CHART · V0.4.5 · CLINICAL COCKPIT · GLOBAL AGENT LAYER</div><h1><span class="pi">π-chart</span> <span style="color:var(--ink-3)" id="view-title">/ overview</span></h1><div class="sub">Problem-oriented overview surface. Chart is the final clinical write; agent artifacts remain draft workspaces.</div></div><div class="right"><div class="row"><span>chart clock <b>09:36</b></span><span>tz <b>America/Chicago</b></span><span>now <b>09:36 · 19 Apr 2026</b></span></div><div class="row"><span>session <b>rn_shane / rn</b></span><span>scope <b>patient_002 / enc_p002_001</b></span></div><span class="stamp">COCKPIT · V0.4.5</span><span class="stamp warn">4 AGENT DRAFTS</span></div></header>
  <section class="patient-banner"><div class="banner-cell"><div class="tag">Patient</div><div class="patient-line"><span class="patient-name">${escapeHtml(patient.id)}</span><span class="code-pill">FULL CODE</span></div><div class="small-meta">${escapeHtml(patient.mrn)} · ${escapeHtml(patient.dob)} · ${escapeHtml(patient.ageSex)}<br/>${escapeHtml(patient.scenario)} · ${escapeHtml(patient.baseline)}</div></div><div class="banner-cell"><div class="tag">Acuity / watcher</div><div class="watcher">WATCHER · RESP ↑</div><div class="small-meta" style="margin-top:8px">A3 · trend signal · auto-flag</div></div><div class="banner-cell"><div class="tag">Constraints</div><div class="small-meta">• Full code<br/>• Avoid excess sedation if possible</div></div><div class="banner-cell"><div class="tag">As of</div><div class="small-meta">${escapeHtml(patient.asOf)}<br/>append-only · cycle #4<br/>last write 09:30:12 · pi-agent</div></div><div class="banner-cell"><div class="tag">Encounter</div><div class="small-meta">${escapeHtml(patient.encounter)}<br/>${escapeHtml(patient.location)}<br/>day 1 · ${escapeHtml(patient.oxygen)}</div></div></section>
  <main class="layout">${renderNav()}<section class="workspace" aria-label="Overview workspace">${renderVitals()}<div id="workspace-content">${views.overview}</div>${renderArtifactPane()}</section>${renderWorklist()}</main>
</div>
<section class="agent-dock open" id="agent-dock" aria-label="Pi-agent dock"><div class="agent-line"><span class="play">▶</span><b>π-agent · co-pilot</b><span class="message">oof — SpO₂ under 90 again. 09:50 reassess is the one I would not snooze.</span><span data-role="advisory-banner">${escapeHtml(ADVISORY_BANNER_COPY)}</span><button id="agent-open" aria-expanded="true">Hide</button></div><form class="agent-chat" id="agent-chat"><label for="agent-prompt">Ask</label>${renderIntentRadios()}<input id="agent-prompt" value="Organize my shift and tell me what I should pay attention to."/><button type="submit">Ask Pi-agent</button></form><div class="agent-response-strip" id="agent-response" hidden><b>Pi-agent / advisory</b><span>Co-pilot advice only. I would start with the 09:50 respiratory reassessment, then reconcile the handoff draft. Chart truth changes only through clinician final clinical write.</span></div></section>
<script type="application/json" id="app-data">${escapeJsonForHtml({ artifacts, views, viewDensities, intents: INTENTS, sourceRefCounts, mockDraftResponse, blockedAdminResponse })}</script>
<script>${clientScript()}</script>
</body>
</html>
`;
}

agentCanvasContext = await buildAgentCanvasContext(demoAgentCanvasParams);
applyClinicalData(agentCanvasContext.clinical);
await mkdir(path.dirname(output), { recursive: true });
await mkdir(path.dirname(contextOutput), { recursive: true });
const html = renderHtml();
await writeFile(output, html, "utf8");
await writeFile(contextOutput, `${JSON.stringify(renderAgentCanvasContextFixture(), null, 2)}\n`, "utf8");
console.log(`wrote ${output}`);
console.log(`wrote ${contextOutput}`);
