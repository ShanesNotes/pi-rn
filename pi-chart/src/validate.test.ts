import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import { validateChart } from "./validate.js";
import { makeEmptyPatient, appendRawEvent, appendRawVital, writeRawNote } from "./test-helpers/fixture.js";
import { formatVitalSampleKey } from "./vitals.js";
import { patientRoot } from "./types.js";
import type { PatientScope } from "./types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

async function copyFixture(): Promise<PatientScope> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-val-"));
  await fs.cp(REPO_ROOT, dir, {
    recursive: true,
    filter: (src) => {
      const parts = path.relative(REPO_ROOT, src).split(path.sep);
      return !parts.some((part) => ["node_modules", "_derived", ".git", ".omx"].includes(part));
    },
  });
  return { chartRoot: dir, patientId: "patient_001" };
}

function patientTimelineEvents(scope: PatientScope): string {
  return path.join(patientRoot(scope), "timeline/2026-04-18/events.ndjson");
}

async function readPatientTimelineEvents(scope: PatientScope): Promise<any[]> {
  return (await fs.readFile(patientTimelineEvents(scope), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

async function writePatientTimelineEvents(scope: PatientScope, events: any[]): Promise<void> {
  await fs.writeFile(
    patientTimelineEvents(scope),
    events.map((event) => JSON.stringify(event)).join("\n") + "\n",
  );
}

async function appendTimelineEvents(scope: PatientScope, ...events: any[]): Promise<void> {
  await fs.appendFile(
    patientTimelineEvents(scope),
    events.map((event) => JSON.stringify(event)).join("\n") + "\n",
  );
}

async function mutateSeedAssessment(
  scope: PatientScope,
  mutate: (assessment: any, events: any[]) => void,
): Promise<void> {
  const events = await readPatientTimelineEvents(scope);
  mutate(events[2], events);
  await writePatientTimelineEvents(scope, events);
}

async function mutateTimelineEvent(
  scope: PatientScope,
  eventId: string,
  mutate: (event: any, events: any[]) => void,
): Promise<void> {
  const events = await readPatientTimelineEvents(scope);
  const event = events.find((candidate) => candidate.id === eventId);
  assert(event, `missing event ${eventId}`);
  mutate(event, events);
  await writePatientTimelineEvents(scope, events);
}

function canonicalVitalsWindowSupport() {
  return {
    kind: "vitals_window",
    ref: "vitals://enc_001?name=heart_rate&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00",
    selection: {
      metric: "heart_rate",
      from: "2026-04-18T08:00:00-05:00",
      to: "2026-04-18T08:40:00-05:00",
      encounterId: "enc_001",
    },
  };
}

function buildDerivedFromExternalChain(maxDepth: number, prefix: string): Record<string, unknown>[] {
  let head: Record<string, unknown> | null = null;
  for (let depth = maxDepth; depth >= 1; depth -= 1) {
    head = {
      kind: "external",
      ref: `${prefix}-${depth}`,
      ...(head ? { derived_from: [head] } : {}),
    };
  }
  return head ? [head] : [];
}

function encounterlessLegacyVitalsWindowRef() {
  return {
    kind: "vitals_window",
    ref: "vitals://window?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:45:00-05:00",
    selection: {
      metric: "spo2",
      from: "2026-04-18T08:00:00-05:00",
      to: "2026-04-18T08:45:00-05:00",
    },
  };
}

function phase3Transform(
  activity: "import" | "normalize" | "extract" | "summarize" | "infer" | "transcribe",
  input_refs: unknown[],
) {
  return {
    activity,
    tool: "phase3-test",
    input_refs,
  };
}

function noteFrontmatter(
  noteId: string,
  role: string,
  sourceKind = "nurse_charted",
): Record<string, unknown> {
  return {
    id: noteId,
    type: "communication",
    subtype: "sbar",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:05-05:00",
    author: { id: `${role}_author`, role },
    source: { kind: sourceKind, ref: "validator-test" },
    references: [],
    status: "final",
  };
}

function communicationEvent(
  eventId: string,
  noteRef: unknown,
  role: string,
  sourceKind = "nurse_charted",
): Record<string, unknown> {
  return {
    id: eventId,
    type: "communication",
    subtype: "sbar",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:10-05:00",
    author: { id: `${role}_author`, role },
    source: { kind: sourceKind, ref: "validator-test" },
    certainty: "performed",
    status: "final",
    data:
      noteRef === undefined
        ? { status_detail: "sent" }
        : { note_ref: noteRef, status_detail: "sent" },
    links: { supports: [], supersedes: [] },
  };
}

async function appendPairedValidationNote(
  scope: PatientScope,
  suffix: string,
  role: string,
  sourceKind = "nurse_charted",
): Promise<string> {
  const noteId = `note_20260418T09${suffix}_vnotes`;
  await writeRawNote(
    scope,
    "2026-04-18",
    `${suffix}_vnotes.md`,
    noteFrontmatter(noteId, role, sourceKind),
    "V-NOTES validator fixture.",
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    communicationEvent(`evt_20260418T09${suffix}_vnotes`, noteId, role, sourceKind),
  );
  return noteId;
}

// HANDOFF: V03-S4 profile foundation. ADR17-17b/17c will append profile ids to the registry later.

test("V-PROFILE-01: event without profile field validates clean (profile is optional)", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, phase4Event({ id: "v03s4_profile_absent" }));
  const r = await validateChart(scope);
  assert.ok(!r.errors.some((e) => e.message.includes("V-PROFILE-01")));
  assert.ok(!r.warnings.some((w) => w.message.includes("V-PROFILE-01")));
});

test("V-PROFILE-01: event with empty-string profile is rejected", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, phase4Event({ id: "v03s4_profile_empty", profile: "" }));
  const r = await validateChart(scope);
  assert.ok(r.errors.some((e) => e.message.includes("V-PROFILE-01")),
    "empty profile must be rejected");
});

test("V-PROFILE-01: event with unregistered profile emits a warning, not an error", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, phase4Event({
    id: "v03s4_profile_unregistered",
    profile: "example.unregistered_profile.v1",
  }));
  const r = await validateChart(scope);
  assert.ok(!r.errors.some((e) => e.message.includes("V-PROFILE-01")),
    "unregistered profile must NOT error");
  assert.ok(r.warnings.some((w) => w.message.includes("V-PROFILE-01") && w.message.includes("not in")),
    "unregistered profile must warn");
});

function phase4Event(overrides: Record<string, any> = {}) {
  const base = {
    id: "evt_phase4_base",
    type: "observation",
    subtype: "patient_report",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "phase4", role: "rn_agent" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { name: "phase4", value: "ok" },
    links: { supports: [], supersedes: [] },
  };

  return {
    ...base,
    ...overrides,
    author: overrides.author ?? base.author,
    source: overrides.source ?? base.source,
    data: overrides.data ?? base.data,
    links: { ...base.links, ...(overrides.links ?? {}) },
  };
}

test("baseline fixture validates green", async () => {
  const scope = await copyFixture();
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("subject mismatch surfaces error", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  ev.subject = "wrong_patient";
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /does not match chart\.yaml subject/.test(e.message)));
});

test("clinical event missing encounter_id rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  delete ev.encounter_id;
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /encounter_id/.test(e.message)));
});

test("V-SRC-01 warns on unknown source.kind", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  ev.source.kind = "monitor_extention";
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.warnings.some((w) => /V-SRC-01/.test(w.message) && /monitor_extention/.test(w.message)));
});

test("V-SRC-02 warns on deprecated agent_reasoning", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const deprecated = {
    id: "evt_deprecated_source",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "pi-agent", role: "rn_agent" },
    source: { kind: "agent_reasoning", ref: "run_test" },
    certainty: "inferred",
    status: "final",
    data: { summary: "test trend" },
    links: {
      supports: ["evt_20260418T0815_01"],
      supersedes: [],
    },
  };
  await fs.appendFile(evPath, JSON.stringify(deprecated) + "\n");
  const r = await validateChart(scope);
  assert(r.warnings.some((w) => /V-SRC-02/.test(w.message) && /agent_reasoning/.test(w.message)));
});

test("V-SRC-03 rejects import events missing structured provenance", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const imported = {
    id: "evt_import_bad",
    type: "observation",
    subtype: "lab_result",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:10:00-05:00",
    author: { id: "importer", role: "system" },
    source: { kind: "synthea_import", ref: "row_1" },
    certainty: "observed",
    status: "final",
    data: { name: "lactate", value: 3.2, unit: "mmol/L", status_detail: "final" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(imported) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-SRC-03/.test(e.message) && /generator_version/.test(e.message)));
});

test("vitals URI window with no samples rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = [
    "evt_20260418T0815_01",
    "evt_20260418T0820_01",
    "vitals://enc_001?name=spo2&from=2030-01-01T00:00:00-05:00&to=2030-01-02T00:00:00-05:00",
  ];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /matches no samples/.test(e.message)));
});

test("vitals URI malformed rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = ["evt_20260418T0815_01", "vitals://enc_001?missing=fields"];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /malformed vitals URI/.test(e.message)));
});

test("V-TIME-02 rejects future-dated point intent missing due_by", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const pointIntent = {
    id: "evt_future_intent_bad",
    type: "intent",
    subtype: "monitoring_plan",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T11:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "planned",
    status: "active",
    data: { goal: "future cadence" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(pointIntent) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-TIME-02/.test(e.message) && /requires data\.due_by/.test(e.message)));
});

test("future-dated interval intent is permitted without due_by", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const intervalIntent = {
    id: "evt_future_interval_intent",
    type: "intent",
    subtype: "monitoring_plan",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: {
      start: "2026-04-18T11:00:00-05:00",
    },
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "planned",
    status: "active",
    data: { goal: "future cadence" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(intervalIntent) + "\n");
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => /evt_future_interval_intent/.test(e.where)));
});

test("Phase A constraint assertions allow open effective_period and status_detail", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(
    scope,
    {
      id: "evt_constraint_support_01",
      type: "observation",
      subtype: "patient_report",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T09:00:00-05:00",
      recorded_at: "2026-04-18T09:00:00-05:00",
      author: { id: "phase_a", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "reported",
      status: "final",
      data: { name: "allergy_history", value: "penicillin anaphylaxis" },
      links: { supports: [] },
    },
    {
      id: "evt_constraint_phase_a_01",
      type: "assessment",
      subtype: "constraint",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_period: { start: "2026-04-18T09:01:00-05:00" },
      recorded_at: "2026-04-18T09:01:00-05:00",
      author: { id: "phase_a", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "reported",
      status: "active",
      data: {
        constraint_domain: "allergy_intolerance",
        status_detail: "active",
        target: { kind: "medication_class", display: "penicillins" },
        rule: "avoid",
      },
      links: { supports: ["evt_constraint_support_01"] },
    },
    {
      id: "evt_constraint_review_phase_a_01",
      type: "action",
      subtype: "constraint_review",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T09:02:00-05:00",
      recorded_at: "2026-04-18T09:02:00-05:00",
      author: { id: "phase_a", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "performed",
      status: "final",
      data: { status_detail: "reviewed", domains: ["allergy_intolerance"] },
      links: { supports: ["evt_constraint_support_01"] },
    },
  );

  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("assessment with no evidence rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[2]);
  ev.links.supports = [];
  lines[2] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /assessment.*links\.supports/.test(e.message)));
});

test("V-EVIDENCE-01 warns only for bare-string supports on agent-inferred assessments", async () => {
  const scope = await copyFixture();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.links.supports = [
      { kind: "event", ref: "evt_20260418T0815_01", role: "primary" },
      "evt_20260418T0820_01",
      { kind: "external", ref: "synthea://enc_001?resource=Observation/obs_71", role: "context" },
      "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00",
      canonicalVitalsWindowSupport(),
    ];
  });
  const r = await validateChart(scope);
  const warnings = r.warnings
    .filter((w) => w.message.startsWith("V-EVIDENCE-01:"))
    .map((w) => w.message);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
  assert.deepEqual(warnings, [
    "V-EVIDENCE-01: agent-inferred assessment must use object-form EvidenceRef; got bare string at supports[1]: evt_20260418T0820_01.",
    "V-EVIDENCE-01: agent-inferred assessment must use object-form EvidenceRef; got bare string at supports[3]: vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00.",
  ]);
});

test("V-EVIDENCE-01 stays silent outside the agent-inferred assessment predicate", async () => {
  const scope = await copyFixture();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "manual_scenario";
    assessment.links.supports = [
      "evt_20260418T0815_01",
      "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00",
    ];
  });
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
  assert(!r.warnings.some((w) => w.message.startsWith("V-EVIDENCE-01:")), JSON.stringify(r.warnings, null, 2));
});

test("V-EVIDENCE-02 rejects multiple object-form primary supports", async () => {
  const scope = await copyFixture();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "manual_scenario";
    assessment.links.supports = [
      { kind: "event", ref: "evt_20260418T0815_01", role: "primary" },
      { kind: "event", ref: "evt_20260418T0820_01", role: "primary" },
      { kind: "external", ref: "synthea://enc_001?resource=Observation/obs_71", role: "context" },
    ];
  });
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-EVIDENCE-02: multiple role:primary entries in supports (found 2); split into separate assessments."), JSON.stringify(r.errors, null, 2));
});

test("V-EVIDENCE-02 ignores bare strings and non-primary object supports", async () => {
  const scope = await copyFixture();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "manual_scenario";
    assessment.links.supports = [
      "evt_20260418T0815_01",
      { kind: "event", ref: "evt_20260418T0820_01", role: "primary" },
      { kind: "external", ref: "synthea://enc_001?resource=Observation/obs_71", role: "context" },
      "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00",
    ];
  });
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
  assert(!r.errors.some((e) => e.message.startsWith("V-EVIDENCE-02:")), JSON.stringify(r.errors, null, 2));
});

// v0.2 back-compat
test("v0.2 back-compat: V-EVIDENCE-03 detects normalized derived_from cycles at depth 2", async () => {
  const scope = await copyFixture();
  const vitalsRef = "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00";
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "manual_scenario";
    assessment.links.supports = [
      {
        kind: "event",
        ref: "evt_20260418T0815_01",
        role: "primary",
        derived_from: [
          {
            kind: "vitals",
            ref: vitalsRef,
            derived_from: [
              {
                kind: "vitals_window",
                ref: vitalsRef,
                selection: {
                  metric: "spo2",
                  from: "2026-04-18T08:00:00-05:00",
                  to: "2026-04-18T08:40:00-05:00",
                  encounterId: "enc_001",
                },
              },
            ],
          },
        ],
      },
    ];
  });
  const r = await validateChart(scope);
  assert.deepEqual(
    r.errors.filter((e) => e.message.startsWith("V-EVIDENCE-03")).map((e) => e.message),
    [`V-EVIDENCE-03: derived_from cycle detected at vitals_window:${vitalsRef}.`],
  );
});

test("V-EVIDENCE-03 allows derived_from depth 8", async () => {
  const scope = await copyFixture();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "manual_scenario";
    assessment.links.supports = [
      {
        kind: "event",
        ref: "evt_20260418T0815_01",
        role: "primary",
        derived_from: buildDerivedFromExternalChain(8, "urn:test:depth-ok"),
      },
    ];
  });
  const r = await validateChart(scope);
  const evidence03 = r.errors.filter((e) => e.message.startsWith("V-EVIDENCE-03"));
  assert.equal(evidence03.length, 0, JSON.stringify(evidence03, null, 2));
});

test("V-EVIDENCE-03 rejects derived_from depth 9", async () => {
  const scope = await copyFixture();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "manual_scenario";
    assessment.links.supports = [
      {
        kind: "event",
        ref: "evt_20260418T0815_01",
        role: "primary",
        derived_from: buildDerivedFromExternalChain(9, "urn:test:depth-bad"),
      },
    ];
  });
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-EVIDENCE-03: derived_from depth exceeds max 8 at depth 9 for external:urn:test:depth-bad-9."), JSON.stringify(r.errors, null, 2));
});

test("V-EVIDENCE-03 stays silent for empty derived_from arrays", async () => {
  const scope = await copyFixture();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "manual_scenario";
    assessment.links.supports = [
      {
        kind: "event",
        ref: "evt_20260418T0815_01",
        role: "primary",
        derived_from: [],
      },
    ];
  });
  const r = await validateChart(scope);
  const evidence03 = r.errors.filter((e) => e.message.startsWith("V-EVIDENCE-03"));
  assert.equal(evidence03.length, 0, JSON.stringify(evidence03, null, 2));
});

test("V-TRANSFORM-01 rejects import activity with non-import source kind", async () => {
  const scope = await copyFixture();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "clinician_chart_action";
    assessment.transform = phase3Transform("import", [{ kind: "event", ref: "evt_20260418T0815_01" }]);
  });
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-TRANSFORM-01: transform.activity=import requires import-family source.kind; got source.kind=clinician_chart_action."), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-01 rejects normalize activity with non-import source kind", async () => {
  const scope = await copyFixture();
  await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
    event.source.kind = "agent_inference";
    event.transform = phase3Transform("normalize", [{ kind: "event", ref: "evt_20260418T0820_01" }]);
  });
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-TRANSFORM-01: transform.activity=normalize requires import-family source.kind; got source.kind=agent_inference."), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-01 stays silent for import activity with synthea_import source kind", async () => {
  const scope = await copyFixture();
  await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
    event.source.kind = "synthea_import";
    event.source.generator_version = "1.0.0";
    event.source.seed = "phase3";
    event.source.original_time = "2026-04-18T08:15:00-05:00";
    event.source.rebase_delta_ms = 0;
    event.transform = phase3Transform("import", [{ kind: "event", ref: "evt_20260418T0820_01" }]);
  });
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-TRANSFORM-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-01 stays silent for non-import transform activities", async () => {
  for (const activity of ["infer", "summarize", "extract", "transcribe"] as const) {
    const scope = await copyFixture();
    await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
      event.source.kind = "clinician_chart_action";
      event.transform = phase3Transform(activity, [{ kind: "event", ref: "evt_20260418T0820_01" }]);
    });
    const r = await validateChart(scope);
    assert(!r.errors.some((e) => e.message.startsWith("V-TRANSFORM-01:")), `${activity}\n${JSON.stringify(r.errors, null, 2)}`);
  }
});

test("V-TRANSFORM rules stay silent when no transform block is present", async () => {
  const scope = await copyFixture();
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-TRANSFORM-01:") || e.message.startsWith("V-TRANSFORM-02:")), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-02 rejects unresolved event input refs", async () => {
  const scope = await copyFixture();
  await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
    event.transform = phase3Transform("infer", [{ kind: "event", ref: "evt_nonexistent" }]);
  });
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-TRANSFORM-02: transform.input_refs[0] does not resolve: event:evt_nonexistent"), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-02 rejects unrecognized external schemes", async () => {
  const scope = await copyFixture();
  await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
    event.transform = phase3Transform("infer", [{ kind: "external", ref: "ftp://unknown" }]);
  });
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-TRANSFORM-02: transform.input_refs[0] has unrecognized external scheme: ftp://unknown"), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-02 stays silent for existing event input refs", async () => {
  const scope = await copyFixture();
  await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
    event.transform = phase3Transform("infer", [{ kind: "event", ref: "evt_20260418T0820_01" }]);
  });
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-TRANSFORM-02:")), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-02 stays silent for approved external schemes", async () => {
  const scope = await copyFixture();
  await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
    event.transform = phase3Transform("infer", [{ kind: "external", ref: "synthea://enc_abc?resource=Observation/obs_71" }]);
  });
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-TRANSFORM-02:")), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-02 stays silent for valid encounter-bearing vitals_window refs", async () => {
  const scope = await copyFixture();
  await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
    event.transform = phase3Transform("infer", [canonicalVitalsWindowSupport()]);
  });
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-TRANSFORM-02:")), JSON.stringify(r.errors, null, 2));
});

test("V-TRANSFORM-02 stays silent for empty input_refs", async () => {
  const scope = await copyFixture();
  await mutateTimelineEvent(scope, "evt_20260418T0815_01", (event) => {
    event.transform = phase3Transform("infer", []);
  });
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-TRANSFORM-02:")), JSON.stringify(r.errors, null, 2));
});

test("Phase 3 keeps links.supports encounterless vitals valid while transform.input_refs rejects the same URI shape", async () => {
  const scope = await copyFixture();
  const encounterless = encounterlessLegacyVitalsWindowRef();
  await mutateSeedAssessment(scope, (assessment) => {
    assessment.source.kind = "manual_scenario";
    assessment.links.supports = [encounterless];
    assessment.transform = phase3Transform("infer", [encounterless]);
  });
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === `V-TRANSFORM-02: transform.input_refs[0] does not resolve: vitals_window:${encounterless.ref}`), JSON.stringify(r.errors, null, 2));
  assert(!r.errors.some((e) => /links\.supports\[kind=vitals_window\]/.test(e.message)), JSON.stringify(r.errors, null, 2));
  assert(!r.errors.some((e) => /assessment links\.supports/.test(e.message)), JSON.stringify(r.errors, null, 2));
});

test("V-CONTRA-01 rejects contradicts refs outside the patient-local event index", async () => {
  const scope = await copyFixture();
  const badMissing = phase4Event({
    id: "evt_contra_missing",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], contradicts: [{ ref: "evt_nonexistent", basis: "missing" }] },
  });
  const badOtherPatient = phase4Event({
    id: "evt_contra_other_patient",
    recorded_at: "2026-04-18T09:05:00-05:00",
    links: { supports: [], contradicts: [{ ref: "evt_other_patient_01", basis: "other patient" }] },
  });
  await appendTimelineEvents(scope, badMissing, badOtherPatient);
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-CONTRA-01: contradicts.ref out-of-patient or nonexistent: evt_nonexistent."), JSON.stringify(r.errors, null, 2));
  assert(r.errors.some((e) => e.message === "V-CONTRA-01: contradicts.ref out-of-patient or nonexistent: evt_other_patient_01."), JSON.stringify(r.errors, null, 2));
});

test("V-CONTRA-01 stays silent for same-patient contradicts targets", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, phase4Event({
    id: "evt_contra_valid",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], contradicts: [{ ref: "evt_20260418T0815_01", basis: "same patient" }] },
  }));
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-CONTRA-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-CONTRA-02 rejects overlapping contradicts and corrects targets only", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, phase4Event({
    id: "evt_contra_overlap",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: {
      supports: [],
      contradicts: [
        { ref: "evt_20260418T0815_01", basis: "overlap" },
        { ref: "evt_20260418T0820_01", basis: "disjoint" },
      ],
      corrects: ["evt_20260418T0815_01"],
    },
  }));
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-CONTRA-02: contradicts and corrects target same event: evt_20260418T0815_01."), JSON.stringify(r.errors, null, 2));
  assert(!r.errors.some((e) => e.message === "V-CONTRA-02: contradicts and corrects target same event: evt_20260418T0820_01."), JSON.stringify(r.errors, null, 2));
});

test("V-CONTRA-03 enforces strictly earlier recorded_at on contradicts targets", async () => {
  const scope = await copyFixture();
  const earlier = phase4Event({
    id: "evt_contra_earlier_target",
    recorded_at: "2026-04-18T08:40:00-05:00",
  });
  const equal = phase4Event({
    id: "evt_contra_equal_target",
    recorded_at: "2026-04-18T09:00:00-05:00",
  });
  const later = phase4Event({
    id: "evt_contra_later_target",
    recorded_at: "2026-04-18T09:10:00-05:00",
  });
  const source = phase4Event({
    id: "evt_contra_source",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: {
      supports: [],
      contradicts: [
        { ref: "evt_contra_earlier_target", basis: "earlier ok" },
        { ref: "evt_contra_equal_target", basis: "equal bad" },
        { ref: "evt_contra_later_target", basis: "later bad" },
      ],
    },
  });
  await appendTimelineEvents(scope, earlier, equal, later, source);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message === "V-CONTRA-03: contradicts.ref newer than source event: evt_contra_earlier_target."), JSON.stringify(r.errors, null, 2));
  assert(r.errors.some((e) => e.message === "V-CONTRA-03: contradicts.ref newer than source event: evt_contra_equal_target."), JSON.stringify(r.errors, null, 2));
  assert(r.errors.some((e) => e.message === "V-CONTRA-03: contradicts.ref newer than source event: evt_contra_later_target."), JSON.stringify(r.errors, null, 2));
});

test("V-CONTRA-04 warns when a supersessor omits resolves or contradicts back-references", async () => {
  const scope = await copyFixture();
  const contradicted = phase4Event({
    id: "evt_contra_warn_target",
    recorded_at: "2026-04-18T08:40:00-05:00",
  });
  const contradictor = phase4Event({
    id: "evt_contra_warn_source",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], contradicts: [{ ref: "evt_contra_warn_target", basis: "warn chain" }] },
  });
  const superseding = phase4Event({
    id: "evt_contra_warn_supersessor",
    recorded_at: "2026-04-18T09:10:00-05:00",
    links: { supports: [], supersedes: ["evt_contra_warn_target"] },
  });
  await appendTimelineEvents(scope, contradicted, contradictor, superseding);
  const r = await validateChart(scope);
  assert(r.warnings.some((w) => w.message === "V-CONTRA-04: event evt_contra_warn_supersessor supersedes contradicted event evt_contra_warn_target without contradicts or resolves pointing at evt_contra_warn_source."), JSON.stringify(r.warnings, null, 2));
});

test("V-CONTRA-04 stays silent when a supersessor resolves the contradictor", async () => {
  const scope = await copyFixture();
  const contradicted = phase4Event({
    id: "evt_contra_resolve_target",
    recorded_at: "2026-04-18T08:40:00-05:00",
  });
  const contradictor = phase4Event({
    id: "evt_contra_resolve_source",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], contradicts: [{ ref: "evt_contra_resolve_target", basis: "resolved chain" }] },
  });
  const superseding = phase4Event({
    id: "evt_contra_resolve_supersessor",
    recorded_at: "2026-04-18T09:10:00-05:00",
    links: {
      supports: [],
      supersedes: ["evt_contra_resolve_target"],
      resolves: ["evt_contra_resolve_source"],
    },
  });
  await appendTimelineEvents(scope, contradicted, contradictor, superseding);
  const r = await validateChart(scope);
  assert(!r.warnings.some((w) => w.message.startsWith("V-CONTRA-04:")), JSON.stringify(r.warnings, null, 2));
});

test("V-CONTRA-04 stays silent when a supersessor contradicts the contradictor", async () => {
  const scope = await copyFixture();
  const contradicted = phase4Event({
    id: "evt_contra_backref_target",
    recorded_at: "2026-04-18T08:40:00-05:00",
  });
  const contradictor = phase4Event({
    id: "evt_contra_backref_source",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], contradicts: [{ ref: "evt_contra_backref_target", basis: "backref chain" }] },
  });
  const superseding = phase4Event({
    id: "evt_contra_backref_supersessor",
    recorded_at: "2026-04-18T09:10:00-05:00",
    links: {
      supports: [],
      supersedes: ["evt_contra_backref_target"],
      contradicts: [{ ref: "evt_contra_backref_source", basis: "follow-on contradiction" }],
    },
  });
  await appendTimelineEvents(scope, contradicted, contradictor, superseding);
  const r = await validateChart(scope);
  assert(!r.warnings.some((w) => w.message.startsWith("V-CONTRA-04:")), JSON.stringify(r.warnings, null, 2));
});

test("V-CONTRA-04 stays silent when the supersessor predates the contradiction", async () => {
  const scope = await copyFixture();
  const contradicted = phase4Event({
    id: "evt_contra_early_superseded_target",
    recorded_at: "2026-04-18T08:40:00-05:00",
  });
  const superseding = phase4Event({
    id: "evt_contra_early_supersessor",
    recorded_at: "2026-04-18T08:50:00-05:00",
    links: { supports: [], supersedes: ["evt_contra_early_superseded_target"] },
  });
  const contradictor = phase4Event({
    id: "evt_contra_early_source",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], contradicts: [{ ref: "evt_contra_early_superseded_target", basis: "late contradiction" }] },
  });
  await appendTimelineEvents(scope, contradicted, superseding, contradictor);
  const r = await validateChart(scope);
  assert(!r.warnings.some((w) => w.message.startsWith("V-CONTRA-04:")), JSON.stringify(r.warnings, null, 2));
});

test("V-RESOLVES-01 stays silent for a pending intent target", async () => {
  const scope = await copyFixture();
  const intent = phase4Event({
    id: "evt_resolve_pending_intent",
    type: "intent",
    subtype: "care_plan",
    certainty: "planned",
    status: "active",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { goal: "pending", due_by: "2026-04-18T10:00:00-05:00" },
  });
  const resolver = phase4Event({
    id: "evt_resolve_pending",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_pending_intent"] },
  });
  await appendTimelineEvents(scope, intent, resolver);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-RESOLVES-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 stays silent for an overdue intent target", async () => {
  const scope = await copyFixture();
  const intent = phase4Event({
    id: "evt_resolve_overdue_intent",
    type: "intent",
    subtype: "care_plan",
    certainty: "planned",
    status: "active",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    data: { goal: "overdue", due_by: "2026-04-18T08:45:00-05:00" },
  });
  const resolver = phase4Event({
    id: "evt_resolve_overdue",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_overdue_intent"] },
  });
  await appendTimelineEvents(scope, intent, resolver);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-RESOLVES-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 rejects future intents at the resolver anchor", async () => {
  const scope = await copyFixture();
  const intent = phase4Event({
    id: "evt_resolve_future_intent",
    type: "intent",
    subtype: "care_plan",
    certainty: "planned",
    status: "active",
    effective_at: "2026-04-18T09:30:00-05:00",
    recorded_at: "2026-04-18T09:30:00-05:00",
    data: { goal: "future", due_by: "2026-04-18T10:30:00-05:00" },
  });
  const resolver = phase4Event({
    id: "evt_resolve_future",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_future_intent"] },
  });
  await appendTimelineEvents(scope, intent, resolver);
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: evt_resolve_future_intent."), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 rejects in-progress intents", async () => {
  const scope = await copyFixture();
  const intent = phase4Event({
    id: "evt_resolve_in_progress_intent",
    type: "intent",
    subtype: "care_plan",
    certainty: "planned",
    status: "active",
    effective_at: "2026-04-18T08:40:00-05:00",
    recorded_at: "2026-04-18T08:40:00-05:00",
    data: { goal: "in progress", due_by: "2026-04-18T10:00:00-05:00" },
  });
  const activeFulfillment = phase4Event({
    id: "evt_resolve_in_progress_action",
    type: "action",
    subtype: "notification",
    certainty: "performed",
    status: "active",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { action: "follow up" },
    links: { supports: [], fulfills: ["evt_resolve_in_progress_intent"] },
  });
  const resolver = phase4Event({
    id: "evt_resolve_in_progress",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_in_progress_intent"] },
  });
  await appendTimelineEvents(scope, intent, activeFulfillment, resolver);
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: evt_resolve_in_progress_intent."), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 stays silent for failed fulfillments marked by status_detail", async () => {
  const scope = await copyFixture();
  const intent = phase4Event({
    id: "evt_resolve_failed_intent",
    type: "intent",
    subtype: "order",
    certainty: "planned",
    status: "active",
    effective_at: "2026-04-18T08:40:00-05:00",
    recorded_at: "2026-04-18T08:40:00-05:00",
    data: { order: "administer medication", due_by: "2026-04-18T10:00:00-05:00" },
  });
  const failedFulfillment = phase4Event({
    id: "evt_resolve_failed_action",
    type: "action",
    subtype: "administration",
    certainty: "performed",
    status: "final",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { action: "administer medication", status_detail: "failed" },
    links: { supports: [], fulfills: ["evt_resolve_failed_intent"] },
  });
  const resolver = phase4Event({
    id: "evt_resolve_failed",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_failed_intent"] },
  });
  await appendTimelineEvents(scope, intent, failedFulfillment, resolver);
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 ignores backdated fulfillments authored after the resolver anchor", async () => {
  const scope = await copyFixture();
  const intent = phase4Event({
    id: "evt_resolve_backdated_intent",
    type: "intent",
    subtype: "care_plan",
    certainty: "planned",
    status: "active",
    effective_at: "2026-04-18T08:40:00-05:00",
    recorded_at: "2026-04-18T08:40:00-05:00",
    data: { goal: "backdated fulfillment", due_by: "2026-04-18T10:00:00-05:00" },
  });
  const resolver = phase4Event({
    id: "evt_resolve_backdated_resolver",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_backdated_intent"] },
  });
  const activeFulfillment = phase4Event({
    id: "evt_resolve_backdated_action",
    type: "action",
    subtype: "notification",
    certainty: "performed",
    status: "active",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T09:30:00-05:00",
    data: { action: "late authored" },
    links: { supports: [], fulfills: ["evt_resolve_backdated_intent"] },
  });
  await appendTimelineEvents(scope, intent, resolver, activeFulfillment);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-RESOLVES-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 rejects terminally closed intents", async () => {
  for (const detail of ["completed", "cancelled", "failed"] as const) {
    const scope = await copyFixture();
    const intent = phase4Event({
      id: `evt_resolve_${detail}_intent`,
      type: "intent",
      subtype: "care_plan",
      certainty: "planned",
      status: "final",
      effective_at: "2026-04-18T08:40:00-05:00",
      recorded_at: "2026-04-18T08:40:00-05:00",
      data: { goal: detail, due_by: "2026-04-18T10:00:00-05:00", status_detail: detail },
    });
    const resolver = phase4Event({
      id: `evt_resolve_${detail}`,
      recorded_at: "2026-04-18T09:00:00-05:00",
      links: { supports: [], resolves: [`evt_resolve_${detail}_intent`] },
    });
    await appendTimelineEvents(scope, intent, resolver);
    const r = await validateChart(scope);
    assert(r.errors.some((e) => e.message === `V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: evt_resolve_${detail}_intent.`), `${detail}\n${JSON.stringify(r.errors, null, 2)}`);
  }
});

test("V-RESOLVES-01 stays silent for unacknowledged communications", async () => {
  const scope = await copyFixture();
  const target = phase4Event({
    id: "evt_resolve_sent_comm",
    type: "communication",
    subtype: "sbar",
    certainty: "performed",
    status: "final",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { audience: "covering_md", summary: "sent", status_detail: "sent" },
  });
  const resolver = phase4Event({
    id: "evt_resolve_sent_comm_resolver",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_sent_comm"] },
  });
  await appendTimelineEvents(scope, target, resolver);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-RESOLVES-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 stays silent when a communication replacement lands after the resolver anchor", async () => {
  const scope = await copyFixture();
  const target = phase4Event({
    id: "evt_resolve_comm_late_target",
    type: "communication",
    subtype: "sbar",
    certainty: "performed",
    status: "final",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { audience: "covering_md", summary: "sent", status_detail: "sent" },
  });
  const resolver = phase4Event({
    id: "evt_resolve_comm_late_resolver",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_comm_late_target"] },
  });
  const replacement = phase4Event({
    id: "evt_resolve_comm_late_replacement",
    type: "communication",
    subtype: "sbar",
    certainty: "performed",
    status: "final",
    effective_at: "2026-04-18T09:30:00-05:00",
    recorded_at: "2026-04-18T09:30:00-05:00",
    data: { audience: "covering_md", summary: "ack", status_detail: "acknowledged" },
    links: { supports: [], supersedes: ["evt_resolve_comm_late_target"] },
  });
  await appendTimelineEvents(scope, target, resolver, replacement);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-RESOLVES-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 ignores backdated communication replacements authored after the resolver anchor", async () => {
  const scope = await copyFixture();
  const target = phase4Event({
    id: "evt_resolve_comm_backdated_target",
    type: "communication",
    subtype: "sbar",
    certainty: "performed",
    status: "final",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { audience: "covering_md", summary: "sent", status_detail: "sent" },
  });
  const resolver = phase4Event({
    id: "evt_resolve_comm_backdated_resolver",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_comm_backdated_target"] },
  });
  const replacement = phase4Event({
    id: "evt_resolve_comm_backdated_replacement",
    type: "communication",
    subtype: "sbar",
    certainty: "performed",
    status: "final",
    effective_at: "2026-04-18T08:45:00-05:00",
    recorded_at: "2026-04-18T09:30:00-05:00",
    data: { audience: "covering_md", summary: "ack", status_detail: "acknowledged" },
    links: { supports: [], supersedes: ["evt_resolve_comm_backdated_target"] },
  });
  await appendTimelineEvents(scope, target, resolver, replacement);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-RESOLVES-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 rejects communications replaced before the resolver anchor", async () => {
  const scope = await copyFixture();
  const target = phase4Event({
    id: "evt_resolve_comm_early_target",
    type: "communication",
    subtype: "sbar",
    certainty: "performed",
    status: "final",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { audience: "covering_md", summary: "sent", status_detail: "sent" },
  });
  const replacement = phase4Event({
    id: "evt_resolve_comm_early_replacement",
    type: "communication",
    subtype: "sbar",
    certainty: "performed",
    status: "final",
    effective_at: "2026-04-18T08:55:00-05:00",
    recorded_at: "2026-04-18T08:55:00-05:00",
    data: { audience: "covering_md", summary: "ack", status_detail: "acknowledged" },
    links: { supports: [], supersedes: ["evt_resolve_comm_early_target"] },
  });
  const resolver = phase4Event({
    id: "evt_resolve_comm_early_resolver",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_comm_early_target"] },
  });
  await appendTimelineEvents(scope, target, replacement, resolver);
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: evt_resolve_comm_early_target."), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 rejects acknowledged timeout and failed communication targets", async () => {
  for (const detail of ["acknowledged", "timeout", "failed"] as const) {
    const scope = await copyFixture();
    const target = phase4Event({
      id: `evt_resolve_comm_${detail}`,
      type: "communication",
      subtype: "sbar",
      certainty: "performed",
      status: "final",
      effective_at: "2026-04-18T08:50:00-05:00",
      recorded_at: "2026-04-18T08:50:00-05:00",
      data: { audience: "covering_md", summary: detail, status_detail: detail },
    });
    const resolver = phase4Event({
      id: `evt_resolve_comm_${detail}_resolver`,
      recorded_at: "2026-04-18T09:00:00-05:00",
      links: { supports: [], resolves: [`evt_resolve_comm_${detail}`] },
    });
    await appendTimelineEvents(scope, target, resolver);
    const r = await validateChart(scope);
    assert(r.errors.some((e) => e.message === `V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: evt_resolve_comm_${detail}.`), `${detail}\n${JSON.stringify(r.errors, null, 2)}`);
  }
});

test("V-RESOLVES-01 stays silent for the active-alert placeholder shape", async () => {
  const scope = await copyFixture();
  const alert = phase4Event({
    id: "evt_resolve_active_alert",
    type: "observation",
    subtype: "alert",
    certainty: "observed",
    status: "active",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { name: "high_rr_alert", value: "active" },
  });
  const resolver = phase4Event({
    id: "evt_resolve_active_alert_resolver",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_active_alert"] },
  });
  await appendTimelineEvents(scope, alert, resolver);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-RESOLVES-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 stays silent for contradiction-bearing event targets", async () => {
  const scope = await copyFixture();
  const contradicted = phase4Event({
    id: "evt_resolve_contradicted",
    recorded_at: "2026-04-18T08:40:00-05:00",
  });
  const contradiction = phase4Event({
    id: "evt_resolve_contradiction",
    type: "assessment",
    subtype: "problem",
    certainty: "inferred",
    status: "active",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { summary: "contradiction target", status_detail: "active" },
    links: {
      supports: ["evt_20260418T0815_01"],
      contradicts: [{ ref: "evt_resolve_contradicted", basis: "disagreement" }],
    },
  });
  const resolver = phase4Event({
    id: "evt_resolve_contradiction_resolver",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_resolve_contradiction"] },
  });
  await appendTimelineEvents(scope, contradicted, contradiction, resolver);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => e.message.startsWith("V-RESOLVES-01:")), JSON.stringify(r.errors, null, 2));
});

test("V-RESOLVES-01 rejects vanilla observations and assessments without contradictions", async () => {
  const scope = await copyFixture();
  const plainAssessment = phase4Event({
    id: "evt_resolve_plain_assessment",
    type: "assessment",
    subtype: "problem",
    certainty: "inferred",
    status: "active",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { summary: "plain problem", status_detail: "active" },
    links: { supports: ["evt_20260418T0815_01"] },
  });
  const resolver = phase4Event({
    id: "evt_resolve_plain_targets",
    recorded_at: "2026-04-18T09:00:00-05:00",
    links: { supports: [], resolves: ["evt_20260418T0815_01", "evt_resolve_plain_assessment"] },
  });
  await appendTimelineEvents(scope, plainAssessment, resolver);
  const r = await validateChart(scope);
  assert(r.errors.some((e) => e.message === "V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: evt_20260418T0815_01."), JSON.stringify(r.errors, null, 2));
  assert(r.errors.some((e) => e.message === "V-RESOLVES-01: resolves target is neither an open loop nor a contradiction-bearing event: evt_resolve_plain_assessment."), JSON.stringify(r.errors, null, 2));
});

test("invariant 10: links.addresses targeting an assessment/problem stays valid", async () => {
  const scope = await copyFixture();
  const problem = phase4Event({
    id: "evt_addresses_problem",
    type: "assessment",
    subtype: "problem",
    certainty: "inferred",
    status: "active",
    effective_at: "2026-04-18T08:50:00-05:00",
    recorded_at: "2026-04-18T08:50:00-05:00",
    data: { summary: "problem", status_detail: "active" },
    links: { supports: ["evt_20260418T0815_01"] },
  });
  const intent = phase4Event({
    id: "evt_addresses_problem_intent",
    type: "intent",
    subtype: "care_plan",
    certainty: "planned",
    status: "active",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    data: { goal: "treat problem", due_by: "2026-04-18T10:00:00-05:00" },
    links: { supports: [], addresses: ["evt_addresses_problem"] },
  });
  await appendTimelineEvents(scope, problem, intent);
  const r = await validateChart(scope);
  assert(!r.errors.some((e) => /links\.addresses: target/.test(e.message)), JSON.stringify(r.errors, null, 2));
});

test("invariant 10: links.addresses targeting an intent is rejected with tightened wording", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, phase4Event({
    id: "evt_addresses_intent_source",
    type: "intent",
    subtype: "care_plan",
    certainty: "planned",
    status: "active",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    data: { goal: "watch", due_by: "2026-04-18T11:00:00-05:00" },
    links: { supports: [], addresses: ["evt_20260418T0830_02"] },
  }));
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => e.message === "links.addresses: target 'evt_20260418T0830_02' must be an assessment/problem (invariant 10: fulfillment typing)"),
    JSON.stringify(r.errors, null, 2),
  );
  assert(!r.errors.some((e) => /or an intent/.test(e.message)), JSON.stringify(r.errors, null, 2));
});

test("V-STATUS-02 rejects final order with non-terminal status_detail", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badOrder = {
    id: "evt_status_bad",
    type: "intent",
    subtype: "order",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "planned",
    status: "final",
    data: { order: "repeat lactate", status_detail: "active" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badOrder) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-STATUS-02/.test(e.message) && /requires terminal/.test(e.message)));
});

test("V-STATUS-03 rejects backtracking status_detail transitions via supersedes", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const prior = {
    id: "evt_problem_resolved",
    type: "assessment",
    subtype: "problem",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "inferred",
    status: "final",
    data: { summary: "resolved hypoxia", status_detail: "resolved" },
    links: { supports: ["evt_20260418T0815_01"] },
  };
  const backtrack = {
    ...prior,
    id: "evt_problem_backtrack",
    effective_at: "2026-04-18T09:10:00-05:00",
    recorded_at: "2026-04-18T09:10:00-05:00",
    status: "active",
    data: { summary: "problem active again", status_detail: "active" },
    links: { supports: ["evt_20260418T0815_01"], supersedes: ["evt_problem_resolved"] },
  };
  await fs.appendFile(evPath, JSON.stringify(prior) + "\n" + JSON.stringify(backtrack) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-STATUS-03/.test(e.message) && /resolved' -> 'active'/.test(e.message)));
});

test("orphan note without communication event rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  // drop the communication event (line 6 — last)
  await fs.writeFile(evPath, lines.slice(0, -1).join("\n") + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some(
      (e) =>
        /V-NOTES-01/.test(e.message) &&
        /no matching communication event/.test(e.message),
    ),
  );
});

test("V-NOTES-01 rejects communication note_ref with no note body", async () => {
  const scope = await copyFixture();
  await appendRawEvent(
    scope,
    "2026-04-18",
    communicationEvent(
      "evt_20260418T090001_missing_note",
      "note_20260418T090001_missing",
      "rn",
    ),
  );

  const r = await validateChart(scope);
  assert(
    r.errors.some(
      (e) =>
        /V-NOTES-01/.test(e.message) &&
        /unknown note id 'note_20260418T090001_missing'/.test(e.message),
    ),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-NOTES-01 stays silent for paired note and communication", async () => {
  const scope = await copyFixture();
  await appendPairedValidationNote(scope, "02", "rn");

  const r = await validateChart(scope);
  assert.ok(
    !r.errors.some((e) => /V-NOTES-01/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-NOTES-01 accepts duplicate note_ref without claimed-body semantics", async () => {
  const scope = await copyFixture();
  const noteId = await appendPairedValidationNote(scope, "03", "rn");
  await appendRawEvent(
    scope,
    "2026-04-18",
    communicationEvent("evt_20260418T090003_vnotes_dup", noteId, "rn"),
  );

  const r = await validateChart(scope);
  const allMessages = [...r.errors, ...r.warnings].map((entry) => entry.message).join("\n");
  assert.ok(!/duplicate.*note_ref/i.test(allMessages), allMessages);
  assert.ok(!/claimed body|body-resolution/i.test(allMessages), allMessages);
  assert.ok(
    !r.errors.some((e) => /V-NOTES-01/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-NOTES ignores missing empty and non-string note_ref communications", async () => {
  const scope = await copyFixture();
  await appendRawEvent(
    scope,
    "2026-04-18",
    communicationEvent("evt_20260418T090004_no_ref", undefined, "rn"),
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    communicationEvent("evt_20260418T090004_empty_ref", "", "rn"),
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    communicationEvent("evt_20260418T090004_number_ref", 123, "rn"),
  );

  const r = await validateChart(scope);
  const allMessages = [...r.errors, ...r.warnings].map((entry) => entry.message).join("\n");
  assert.ok(!/V-NOTES/.test(allMessages), allMessages);
  assert.ok(!/unknown note id/.test(allMessages), allMessages);
});

test("V-NOTES-02 accepts attested nursing roles without role warnings", async () => {
  const scope = await copyFixture();
  await appendPairedValidationNote(scope, "05", "rn");
  await appendPairedValidationNote(scope, "06", "lpn");
  await appendPairedValidationNote(scope, "07", "student_nurse");

  const r = await validateChart(scope);
  assert.ok(
    !r.warnings.some((w) => /V-NOTES-02/.test(w.message)),
    JSON.stringify(r.warnings, null, 2),
  );
});

test("V-NOTES-02 warns for rn_agent used as clinical nursing role", async () => {
  const scope = await copyFixture();
  await appendPairedValidationNote(scope, "08", "rn_agent", "nurse_charted");

  const r = await validateChart(scope);
  assert.equal(r.ok, true, JSON.stringify(r.errors, null, 2));
  assert.equal(
    r.warnings.filter((w) => /V-NOTES-02/.test(w.message) && /rn_agent/.test(w.message)).length,
    1,
    JSON.stringify(r.warnings, null, 2),
  );
});

test("V-NOTES-02 warns for nurse_practitioner ambiguity without failing validation", async () => {
  const scope = await copyFixture();
  await appendPairedValidationNote(scope, "09", "nurse_practitioner", "clinician_chart_action");

  const r = await validateChart(scope);
  assert.equal(r.ok, true, JSON.stringify(r.errors, null, 2));
  assert.equal(
    r.warnings.filter((w) => /V-NOTES-02/.test(w.message) && /nurse_practitioner/.test(w.message)).length,
    1,
    JSON.stringify(r.warnings, null, 2),
  );
});

test("V-NOTES-02 stays silent for rn_agent in agent-source note context", async () => {
  const scope = await copyFixture();
  await appendPairedValidationNote(scope, "10", "rn_agent", "agent_synthesis");

  const r = await validateChart(scope);
  assert.equal(r.ok, true, JSON.stringify(r.errors, null, 2));
  assert.equal(
    r.warnings.filter((w) => /V-NOTES-02/.test(w.message) && /rn_agent/.test(w.message)).length,
    0,
    JSON.stringify(r.warnings, null, 2),
  );
});

test("V-NOTES-03 warns for missing note frontmatter without hard error", async () => {
  const scope = await copyFixture();
  const notesDir = path.join(patientRoot(scope), "timeline/2026-04-18/notes");
  const notePath = path.join(notesDir, "090010_no_frontmatter.md");
  await fs.writeFile(notePath, "No frontmatter here.\n");

  const r = await validateChart(scope);
  assert.ok(
    r.warnings.some((w) => w.where.endsWith("090010_no_frontmatter.md") && /V-NOTES-03/.test(w.message)),
    JSON.stringify(r.warnings, null, 2),
  );
  assert.ok(
    !r.errors.some((e) => e.where.endsWith("090010_no_frontmatter.md")),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-NOTES-03 warns for malformed YAML frontmatter without hard error", async () => {
  const scope = await copyFixture();
  const notesDir = path.join(patientRoot(scope), "timeline/2026-04-18/notes");
  const notePath = path.join(notesDir, "090011_malformed_yaml.md");
  await fs.writeFile(notePath, "---\n- not\n- a\n- mapping\n---\n\nMalformed.\n");

  const r = await validateChart(scope);
  assert.ok(
    r.warnings.some((w) => w.where.endsWith("090011_malformed_yaml.md") && /V-NOTES-03/.test(w.message)),
    JSON.stringify(r.warnings, null, 2),
  );
  assert.ok(
    !r.errors.some((e) => e.where.endsWith("090011_malformed_yaml.md")),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-NOTES-03 downgrades missing id discoverability errors", async () => {
  const scope = await copyFixture();
  const frontmatter = noteFrontmatter("note_20260418T090012_missing_id", "rn");
  delete frontmatter.id;
  await writeRawNote(
    scope,
    "2026-04-18",
    "090012_missing_id.md",
    frontmatter,
    "Missing id should warn but not hard-error.",
  );

  const r = await validateChart(scope);
  assert.ok(
    r.warnings.some((w) => w.where.endsWith("090012_missing_id.md") && /V-NOTES-03/.test(w.message)),
    JSON.stringify(r.warnings, null, 2),
  );
  assert.ok(
    !r.errors.some((e) => e.where.endsWith("090012_missing_id.md")),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-NOTES-03 downgrades recorded_at discoverability errors but preserves pairing by id", async () => {
  const scope = await copyFixture();
  const noteId = "note_20260418T090013_missing_recorded";
  const frontmatter = noteFrontmatter(noteId, "rn");
  delete frontmatter.recorded_at;
  await writeRawNote(
    scope,
    "2026-04-18",
    "090013_missing_recorded.md",
    frontmatter,
    "Missing recorded_at but id remains pairable.",
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    communicationEvent("evt_20260418T090013_missing_recorded", noteId, "rn"),
  );

  const r = await validateChart(scope);
  assert.ok(
    r.warnings.some((w) => w.where.endsWith("090013_missing_recorded.md") && /V-NOTES-03/.test(w.message)),
    JSON.stringify(r.warnings, null, 2),
  );
  assert.ok(
    !r.errors.some((e) => e.where.endsWith("090013_missing_recorded.md") || /V-NOTES-01/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-NOTES-03 preserves unrelated hard note schema errors", async () => {
  const scope = await copyFixture();
  const noteId = "note_20260418T090014_missing_subject";
  const frontmatter = noteFrontmatter(noteId, "rn");
  delete frontmatter.subject;
  await writeRawNote(
    scope,
    "2026-04-18",
    "090014_missing_subject.md",
    frontmatter,
    "Missing subject remains a hard schema error.",
  );
  await appendRawEvent(
    scope,
    "2026-04-18",
    communicationEvent("evt_20260418T090014_missing_subject", noteId, "rn"),
  );

  const r = await validateChart(scope);
  assert.ok(
    r.errors.some((e) => e.where.endsWith("090014_missing_subject.md") && /subject/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("note references[] with unknown id rejected", async () => {
  const scope = await copyFixture();
  const np = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/notes/0845_nursing-note.md",
  );
  let text = await fs.readFile(np, "utf8");
  text = text.replace(
    "  - evt_20260418T0815_01",
    "  - evt_20260418T0815_01\n  - nonexistent_id_xyz",
  );
  await fs.writeFile(np, text);
  const r = await validateChart(scope);
  assert(
    r.errors.some(
      (e) =>
        /references: unknown id 'nonexistent_id_xyz'/.test(e.message),
    ),
  );
});

test("day-prefix mismatch produces warning (not error)", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const ev = JSON.parse(lines[0]);
  ev.effective_at = "2026-04-19T08:15:00-05:00";
  lines[0] = JSON.stringify(ev);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.warnings.some((w) => /day directory prefix/.test(w.message)));
});

test("encounter day-prefix mismatch produces warning", async () => {
  const scope = await copyFixture();
  const encounterPath = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/encounter_001.md",
  );
  let text = await fs.readFile(encounterPath, "utf8");
  text = text.replace(
    "effective_at: '2026-04-18T06:00:00-05:00'",
    "effective_at: '2026-04-19T06:00:00-05:00'",
  );
  await fs.writeFile(encounterPath, text);
  const r = await validateChart(scope);
  assert(
    r.warnings.some(
      (w) =>
        w.where === "timeline/2026-04-18/encounter_001.md" &&
        /day directory prefix/.test(w.message),
    ),
  );
});

test("note day-prefix mismatch produces warning", async () => {
  const scope = await copyFixture();
  const notePath = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/notes/0845_nursing-note.md",
  );
  let text = await fs.readFile(notePath, "utf8");
  text = text.replace(
    "effective_at: '2026-04-18T08:45:00-05:00'",
    "effective_at: '2026-04-19T08:45:00-05:00'",
  );
  await fs.writeFile(notePath, text);
  const r = await validateChart(scope);
  assert(
    r.warnings.some(
      (w) =>
        w.where === "timeline/2026-04-18/notes/0845_nursing-note.md" &&
        /day directory prefix/.test(w.message),
    ),
  );
});

test("chart.yaml subject drifting from patient directory is an error", async () => {
  // Invariant 6: directory is authoritative; a drifted chart.yaml.subject
  // must not silently become a new identity for the tree.
  const scope = await copyFixture();
  const chartPath = path.join(patientRoot(scope), "chart.yaml");
  const original = await fs.readFile(chartPath, "utf8");
  await fs.writeFile(
    chartPath,
    original.replace(/^subject:.*$/m, "subject: patient_999"),
  );
  const r = await validateChart(scope);
  assert(
    r.errors.some(
      (e) =>
        e.where === "chart.yaml" &&
        /does not match patient directory/.test(e.message),
    ),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-INTERVAL-02 rejects effective_period on point-shaped subtype", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badInterval = {
    id: "evt_interval_bad",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: {
      start: "2026-04-18T09:00:00-05:00",
      end: "2026-04-18T10:00:00-05:00",
    },
    recorded_at: "2026-04-18T09:05:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 92, unit: "%" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badInterval) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-INTERVAL-02/.test(e.message) && /vital_sign/.test(e.message)));
});

test("V-INTERVAL-04 rejects point event superseding an interval to close it", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const openInterval = {
    id: "evt_interval_open",
    type: "action",
    subtype: "administration",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: {
      start: "2026-04-18T09:00:00-05:00",
    },
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "performed",
    status: "active",
    data: { action: "norepinephrine infusion" },
    links: { supports: [] },
  };
  const pointCloser = {
    id: "evt_interval_close_bad",
    type: "action",
    subtype: "administration",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "performed",
    status: "final",
    data: { action: "stop infusion", status_detail: "performed" },
    links: { supports: [], supersedes: ["evt_interval_open"] },
  };
  await fs.appendFile(evPath, JSON.stringify(openInterval) + "\n" + JSON.stringify(pointCloser) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-INTERVAL-04/.test(e.message) && /may not supersede interval/.test(e.message)));
});

test("vitals row missing encounter_id rejected", async () => {
  const scope = await copyFixture();
  const vp = path.join(
    patientRoot(scope),
    "timeline/2026-04-18/vitals.jsonl",
  );
  const lines = (await fs.readFile(vp, "utf8")).trim().split("\n");
  const v = JSON.parse(lines[0]);
  delete v.encounter_id;
  lines[0] = JSON.stringify(v);
  await fs.writeFile(vp, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /encounter_id/.test(e.message)));
});



test("V-VITAL-01 accepts deterministic sample_key and recorded_at ordering", async () => {
  const scope = await makeEmptyPatient();
  const sample = {
    sampled_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:02-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "heart_rate",
    value: 88,
    unit: "beats/min",
    quality: { state: "valid" },
  };
  await appendRawVital(scope, "2026-04-18", { ...sample, sample_key: formatVitalSampleKey(sample) });

  const r = await validateChart(scope);
  assert.ok(!r.errors.some((error) => /V-VITAL-01/.test(error.message)), JSON.stringify(r.errors, null, 2));
  assert.ok(!r.warnings.some((warning) => /V-VITAL-01/.test(warning.message)), JSON.stringify(r.warnings, null, 2));
});

test("V-VITAL-01 rejects mismatched sample_key", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:02-05:00",
    sample_key: "vital_deadbeefdeadbeef",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "heart_rate",
    value: 88,
    unit: "beats/min",
    quality: { state: "valid" },
  });

  const r = await validateChart(scope);
  assert.ok(r.errors.some((error) => /V-VITAL-01/.test(error.message) && /sample_key/.test(error.message)), JSON.stringify(r.errors, null, 2));
});

test("V-VITAL-01 rejects duplicate sample_key and object values", async () => {
  const scope = await makeEmptyPatient();
  const sample = {
    sampled_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:02-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "heart_rate",
    value: 88,
    unit: "beats/min",
    quality: { state: "valid" },
  };
  await appendRawVital(scope, "2026-04-18", { ...sample, sample_key: formatVitalSampleKey(sample) });
  await appendRawVital(scope, "2026-04-18", { ...sample, sample_key: formatVitalSampleKey(sample) });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:05:00-05:00",
    recorded_at: "2026-04-18T08:05:02-05:00",
    sample_key: "vital_3333333333333333",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "heart_rate",
    value: { unsupported: true },
    quality: { state: "valid" },
  });

  const r = await validateChart(scope);
  assert.ok(r.errors.some((error) => /duplicate sample_key/.test(error.message)), JSON.stringify(r.errors, null, 2));
  assert.ok(r.errors.some((error) => /value\/type/.test(error.message) || /deterministic sample_key/.test(error.message)), JSON.stringify(r.errors, null, 2));
});

test("V-VITAL-03 and V-VITAL-06 use oxygen context segments for spo2 context", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "ctx_o2_nc",
    type: "observation",
    subtype: "context_segment",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: { start: "2026-04-18T08:00:00-05:00", end: "2026-04-18T09:00:00-05:00" },
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { segment_type: "o2_delivery", o2_device: "nasal_cannula", o2_flow_lpm: 2 },
    links: { supports: [] },
  });
  const sample = {
    sampled_at: "2026-04-18T08:15:00-05:00",
    recorded_at: "2026-04-18T08:15:02-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "spo2",
    value: 92,
    unit: "%",
    context: { o2_device: "room_air" },
    quality: { state: "valid" },
  };
  await appendRawVital(scope, "2026-04-18", { ...sample, sample_key: formatVitalSampleKey(sample) });

  const r = await validateChart(scope);
  assert.ok(!r.warnings.some((warning) => /V-VITAL-03/.test(warning.message)), JSON.stringify(r.warnings, null, 2));
  assert.ok(r.warnings.some((warning) => /V-VITAL-06/.test(warning.message)), JSON.stringify(r.warnings, null, 2));
});

test("V-VITAL-03 ignores oxygen context segments from other encounters or replaced events", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "ctx_o2_wrong_encounter",
    type: "observation",
    subtype: "context_segment",
    subject: "patient_001",
    encounter_id: "enc_002",
    effective_period: { start: "2026-04-18T08:00:00-05:00", end: "2026-04-18T09:00:00-05:00" },
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { segment_type: "o2_delivery", o2_device: "nasal_cannula" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "ctx_o2_replaced",
    type: "observation",
    subtype: "context_segment",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: { start: "2026-04-18T08:00:00-05:00", end: "2026-04-18T09:00:00-05:00" },
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { segment_type: "o2_delivery", o2_device: "nasal_cannula" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "ctx_o2_replacer",
    type: "observation",
    subtype: "context_segment",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_period: { start: "2026-04-18T09:10:00-05:00" },
    recorded_at: "2026-04-18T09:10:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { segment_type: "o2_delivery", room_air: true },
    links: { supports: [], supersedes: ["ctx_o2_replaced"] },
  });
  const sample = {
    sampled_at: "2026-04-18T08:15:00-05:00",
    recorded_at: "2026-04-18T08:15:02-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension", ref: "pi-sim-monitor" },
    name: "spo2",
    value: 92,
    unit: "%",
    quality: { state: "valid" },
  };
  await appendRawVital(scope, "2026-04-18", { ...sample, sample_key: formatVitalSampleKey(sample) });

  const r = await validateChart(scope);
  assert.ok(r.warnings.some((warning) => /V-VITAL-03/.test(warning.message)), JSON.stringify(r.warnings, null, 2));
});

test("invariant 8: multi-supersessor for one target is rejected", async () => {
  const scope = await copyFixture();
  // Append two events that both claim to supersede the same target.
  const evPath = patientTimelineEvents(scope);
  const existing = JSON.parse((await fs.readFile(evPath, "utf8")).trim().split("\n")[0]);
  const targetId = existing.id;
  const rival1 = {
    ...existing,
    id: "evt_rival_01",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    links: { supports: existing.links?.supports ?? [], supersedes: [targetId] },
  };
  const rival2 = {
    ...existing,
    id: "evt_rival_02",
    effective_at: "2026-04-18T10:01:00-05:00",
    recorded_at: "2026-04-18T10:01:00-05:00",
    links: { supports: existing.links?.supports ?? [], supersedes: [targetId] },
  };
  await fs.appendFile(evPath, JSON.stringify(rival1) + "\n" + JSON.stringify(rival2) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /invariant 8/.test(e.message) && /has 2 supersedes-claims/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("invariant 8: a supersession cycle is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const existing = JSON.parse((await fs.readFile(evPath, "utf8")).trim().split("\n")[0]);
  const aId = existing.id;
  const evB = {
    ...existing,
    id: "evt_cycle_B",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    links: { supports: existing.links?.supports ?? [], supersedes: [aId] },
  };
  // Mutate line 0 to introduce the cycle A→B.
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const mutatedA = { ...existing, links: { ...(existing.links ?? {}), supersedes: ["evt_cycle_B"] } };
  lines[0] = JSON.stringify(mutatedA);
  await fs.writeFile(evPath, lines.join("\n") + "\n" + JSON.stringify(evB) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /cycle detected/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("invariant 10: links.fulfills targeting a non-intent is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  // Line 0 is an observation in the seed; make a new action that "fulfills" it.
  const observationId = JSON.parse(lines[0]).id;
  const badAction = {
    id: "evt_action_bad",
    type: "action",
    subtype: "notification",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "agent_action" },
    certainty: "performed",
    status: "final",
    data: { action: "notify_md" },
    links: { supports: [], fulfills: [observationId] },
  };
  await fs.appendFile(evPath, JSON.stringify(badAction) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /invariant 10/.test(e.message) && /must be 'intent'/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-FULFILL-02 rejects acquisition action without fulfills", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badAcquisition = {
    id: "evt_acq_bad",
    type: "action",
    subtype: "specimen_collection",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "performed",
    status: "final",
    data: { specimen_type: "blood" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badAcquisition) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-FULFILL-02/.test(e.message) && /must carry links\.fulfills/.test(e.message)));
});

test("V-FULFILL-03 rejects result observation without acquisition action support", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badResult = {
    id: "evt_result_bad",
    type: "observation",
    subtype: "lab_result",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:10:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { name: "lactate", value: 3.2, unit: "mmol/L", status_detail: "final" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badResult) + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /V-FULFILL-03/.test(e.message) && /must support an acquisition action/.test(e.message)));
});

test("V-EXAMFIND-01 rejects exam findings that try to fulfill or address loops", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, {
    id: "evt_exam_target_order",
    type: "intent",
    subtype: "monitoring_plan",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "planned",
    status: "active",
    data: { goal: "reassess respiratory status" },
    links: { supports: [] },
  }, {
    id: "evt_exam_target_problem",
    type: "assessment",
    subtype: "problem",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "inferred",
    status: "active",
    data: { summary: "oxygen requirement" },
    links: { supports: [] },
  }, {
    id: "evt_exam_bad_links",
    type: "observation",
    subtype: "exam_finding",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:05:00-05:00",
    recorded_at: "2026-04-18T09:05:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { finding: "work of breathing improved", finding_state: "present" },
    links: {
      supports: ["evt_exam_target_order"],
      fulfills: ["evt_exam_target_order"],
      addresses: ["evt_exam_target_problem"],
    },
  });

  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /V-EXAMFIND-01/.test(e.message) && /must not carry links\.fulfills/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
  assert(
    r.errors.some((e) => /V-EXAMFIND-01/.test(e.message) && /must not carry links\.addresses/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-EXAMFIND-01 rejects unsupported finding_state values", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, {
    id: "evt_exam_bad_state",
    type: "observation",
    subtype: "exam_finding",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:05:00-05:00",
    recorded_at: "2026-04-18T09:05:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { finding: "work of breathing", finding_state: "unknown" },
    links: { supports: [] },
  });

  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /V-EXAMFIND-01/.test(e.message) && /finding_state/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("invariant 10: links.addresses targeting an arbitrary observation is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const observationId = JSON.parse(lines[0]).id;
  const badIntent = {
    id: "evt_intent_bad",
    type: "intent",
    subtype: "care_plan",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "planned",
    status: "active",
    data: { goal: "watch" },
    links: { supports: [], addresses: [observationId] },
  };
  await fs.appendFile(evPath, JSON.stringify(badIntent) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => e.message === `links.addresses: target '${observationId}' must be an assessment/problem (invariant 10: fulfillment typing)`),
    JSON.stringify(r.errors, null, 2),
  );
  assert(!r.errors.some((e) => /or an intent/.test(e.message)), JSON.stringify(r.errors, null, 2));
});

// v0.2 back-compat
test("v0.2 back-compat: links.supports accepts a legacy structured vitals EvidenceRef", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  // Line 2 in the seed is the first assessment — mutate its supports to
  // include a structured vitals ref over a known-good window.
  const assessment = JSON.parse(lines[2]);
  assessment.links.supports = [
    ...assessment.links.supports.filter((s: unknown) => typeof s === "string"),
    {
      kind: "vitals",
      metric: "spo2",
      from: "2026-04-18T08:00:00-05:00",
      to: "2026-04-18T08:45:00-05:00",
      encounterId: "enc_001",
    },
  ];
  lines[2] = JSON.stringify(assessment);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

// v0.2 back-compat
test("v0.2 back-compat: legacy structured vitals without encounterId remain valid", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const assessment = JSON.parse(lines[2]);
  assessment.links.supports = [
    ...assessment.links.supports.filter((s: unknown) => typeof s === "string"),
    {
      kind: "vitals",
      metric: "spo2",
      from: "2026-04-18T08:00:00-05:00",
      to: "2026-04-18T08:45:00-05:00",
    },
  ];
  lines[2] = JSON.stringify(assessment);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("links.supports accepts a canonical vitals_window EvidenceRef", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const assessment = JSON.parse(lines[2]);
  assessment.links.supports = [
    ...assessment.links.supports.filter((s: unknown) => typeof s === "string"),
    {
      kind: "vitals_window",
      ref: "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:45:00-05:00",
      selection: {
        metric: "spo2",
        from: "2026-04-18T08:00:00-05:00",
        to: "2026-04-18T08:45:00-05:00",
        encounterId: "enc_001",
      },
    },
  ];
  lines[2] = JSON.stringify(assessment);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors, null, 2));
});

test("external EvidenceRef is structurally accepted but does not satisfy assessment evidence", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const lines = (await fs.readFile(evPath, "utf8")).trim().split("\n");
  const assessment = JSON.parse(lines[2]);
  assessment.links.supports = [
    {
      kind: "external",
      ref: "synthea://enc_001?resource=Observation/obs_71",
      role: "context",
    },
  ];
  lines[2] = JSON.stringify(assessment);
  await fs.writeFile(evPath, lines.join("\n") + "\n");
  const r = await validateChart(scope);
  assert(r.errors.some((e) => /assessment.*links\.supports/.test(e.message)));
  assert(!r.errors.some((e) => /unknown target id|malformed structured EvidenceRef|unknown kind/.test(e.message)));
});

test("artifact_ref absolute path is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badArtifact = {
    id: "evt_artifact_bad_abs",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: "/tmp/outside.pdf", description: "bad" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badArtifact) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /must be patient-root-relative, not absolute/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("artifact_ref traversal path is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const badArtifact = {
    id: "evt_artifact_bad_escape",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: "artifacts/../../outside.pdf", description: "bad" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(badArtifact) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /escapes the patient artifact tree/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("artifact_ref missing patient-local file is rejected", async () => {
  const scope = await copyFixture();
  const evPath = patientTimelineEvents(scope);
  const missingArtifact = {
    id: "evt_artifact_missing",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T10:00:00-05:00",
    recorded_at: "2026-04-18T10:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: "artifacts/missing.pdf", description: "missing" },
    links: { supports: [] },
  };
  await fs.appendFile(evPath, JSON.stringify(missingArtifact) + "\n");
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /does not exist/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

function adr17ReviewEvent(overrides: Record<string, any> = {}) {
  return phase4Event({
    id: "adr17_review_base",
    type: "action",
    subtype: "claim_review",
    profile: "action.claim_review.v1",
    certainty: "performed",
    status: "final",
    recorded_at: "2026-04-18T09:30:00-05:00",
    effective_at: "2026-04-18T09:30:00-05:00",
    author: { id: "rn_amy", role: "rn" },
    source: { kind: "nurse_charted" },
    ...overrides,
    data: {
      review_decision: "accepted",
      reviewed_refs: ["evt_20260418T0815_01"],
      ...(overrides.data ?? {}),
    },
    links: {
      supports: [{ kind: "event", ref: "evt_20260418T0815_01" }],
      ...(overrides.links ?? {}),
    },
  });
}

function adr17AttestationEvent(overrides: Record<string, any> = {}) {
  return phase4Event({
    id: "adr17_attestation_base",
    type: "communication",
    subtype: "attestation",
    profile: "communication.attestation.v1",
    certainty: "performed",
    status: "final",
    recorded_at: "2026-04-18T09:35:00-05:00",
    effective_at: "2026-04-18T09:35:00-05:00",
    author: { id: "md_lee", role: "md" },
    source: { kind: "clinician_chart_action" },
    ...overrides,
    data: {
      status_detail: "sent",
      attests_to: "evt_20260418T0815_01",
      attestation_role: "cosign",
      ...(overrides.data ?? {}),
    },
    links: {
      supports: [{ kind: "event", ref: "evt_20260418T0815_01" }],
      ...(overrides.links ?? {}),
    },
  });
}

test("V-REVIEW-01: claim_review without reviewed target errors; reviewed_refs/supports/contradicts pass", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17ReviewEvent({ id: "adr17_review_no_target", data: { review_decision: "accepted", reviewed_refs: [] }, links: { supports: [] } }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-REVIEW-01")), JSON.stringify(bad.errors, null, 2));

  for (const [id, data, links] of [
    ["adr17_review_refs_ok", { review_decision: "accepted", reviewed_refs: ["evt_20260418T0815_01"] }, { supports: [] }],
    ["adr17_review_supports_ok", { review_decision: "accepted", reviewed_refs: [] }, { supports: [{ kind: "event", ref: "evt_20260418T0815_01" }] }],
    ["adr17_review_contradicts_ok", { review_decision: "rejected", reviewed_refs: [], rationale: "not consistent" }, { supports: [], contradicts: [{ ref: "evt_20260418T0815_01", basis: "counterexample" }] }],
  ] as const) {
    const scope = await copyFixture();
    await appendTimelineEvents(scope, adr17ReviewEvent({ id, data, links }));
    const r = await validateChart(scope);
    assert(!r.errors.some((e) => e.message.includes("V-REVIEW-01")), `${id}\n${JSON.stringify(r.errors, null, 2)}`);
  }
});

test("V-REVIEW-02: claim_review decision must be allowed", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17ReviewEvent({ id: "adr17_review_bad_decision", data: { review_decision: "rubber_stamp" } }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-REVIEW-02")), JSON.stringify(bad.errors, null, 2));

  const goodScope = await copyFixture();
  await appendTimelineEvents(goodScope, adr17ReviewEvent({ id: "adr17_review_good_decision", data: { review_decision: "needs_revision" } }));
  const good = await validateChart(goodScope);
  assert(!good.errors.some((e) => e.message.includes("V-REVIEW-02")), JSON.stringify(good.errors, null, 2));
});

test("V-REVIEW-03: accountability outcomes by agent reviewer warn, clinician reviewer does not", async () => {
  const agentScope = await copyFixture();
  await appendTimelineEvents(agentScope, adr17ReviewEvent({
    id: "adr17_review_agent_reviewer",
    author: { id: "pi", role: "agent" },
    source: { kind: "agent_review" },
    data: { review_decision: "accepted" },
  }));
  const agent = await validateChart(agentScope);
  assert(agent.warnings.some((w) => w.message.includes("V-REVIEW-03")), JSON.stringify(agent.warnings, null, 2));

  const clinicianScope = await copyFixture();
  await appendTimelineEvents(clinicianScope, adr17ReviewEvent({ id: "adr17_review_human_reviewer", source: { kind: "clinician_chart_action" }, author: { id: "md", role: "md" } }));
  const clinician = await validateChart(clinicianScope);
  assert(!clinician.warnings.some((w) => w.message.includes("V-REVIEW-03")), JSON.stringify(clinician.warnings, null, 2));
});

test("V-REVIEW-04: rejected claim_review requires rationale or contradicts basis", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17ReviewEvent({ id: "adr17_review_rejected_no_rationale", data: { review_decision: "rejected" }, links: { supports: [{ kind: "event", ref: "evt_20260418T0815_01" }] } }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-REVIEW-04")), JSON.stringify(bad.errors, null, 2));

  const goodScope = await copyFixture();
  await appendTimelineEvents(goodScope, adr17ReviewEvent({ id: "adr17_review_rejected_basis", data: { review_decision: "rejected" }, links: { supports: [], contradicts: [{ ref: "evt_20260418T0815_01", basis: "not supported" }] } }));
  const good = await validateChart(goodScope);
  assert(!good.errors.some((e) => e.message.includes("V-REVIEW-04")), JSON.stringify(good.errors, null, 2));
});

test("V-REVIEW-05: verified claim_review requires explicit basis", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17ReviewEvent({ id: "adr17_review_verified_no_basis", data: { review_decision: "verified" } }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-REVIEW-05")), JSON.stringify(bad.errors, null, 2));

  const goodScope = await copyFixture();
  await appendTimelineEvents(goodScope, adr17ReviewEvent({ id: "adr17_review_verified_basis", data: { review_decision: "verified", review: { basis: "checked primary vitals" } } }));
  const good = await validateChart(goodScope);
  assert(!good.errors.some((e) => e.message.includes("V-REVIEW-05")), JSON.stringify(good.errors, null, 2));
});

test("V-REVIEW-06: co_signed claim_review requires target and human reviewer", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17ReviewEvent({
    id: "adr17_review_cosign_agent",
    author: { id: "pi", role: "agent" },
    source: { kind: "agent_review" },
    data: { review_decision: "co_signed" },
  }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-REVIEW-06")), JSON.stringify(bad.errors, null, 2));

  const goodScope = await copyFixture();
  await appendTimelineEvents(goodScope, adr17ReviewEvent({ id: "adr17_review_cosign_human", data: { review_decision: "co_signed" }, source: { kind: "clinician_chart_action" }, author: { id: "md", role: "md" } }));
  const good = await validateChart(goodScope);
  assert(!good.errors.some((e) => e.message.includes("V-REVIEW-06")), JSON.stringify(good.errors, null, 2));
});

test("V-REVIEW-07: claim_review must not use data.status_detail", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17ReviewEvent({ id: "adr17_review_status_detail", data: { review_decision: "accepted", status_detail: "accepted" } }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-REVIEW-07")), JSON.stringify(bad.errors, null, 2));
});

test("V-ATTEST-01: attestation requires attests_to and attestation_role", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17AttestationEvent({ id: "adr17_attest_missing_fields", data: { status_detail: "sent", attests_to: undefined, attestation_role: undefined } }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-ATTEST-01")), JSON.stringify(bad.errors, null, 2));

  const goodScope = await copyFixture();
  await appendTimelineEvents(goodScope, adr17AttestationEvent({ id: "adr17_attest_required_fields" }));
  const good = await validateChart(goodScope);
  assert(!good.errors.some((e) => e.message.includes("V-ATTEST-01")), JSON.stringify(good.errors, null, 2));
});

test("V-ATTEST-02: attestation role must be in the allowed enum", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17AttestationEvent({ id: "adr17_attest_bad_role", data: { attestation_role: "rubber_stamp" } }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-ATTEST-02")), JSON.stringify(bad.errors, null, 2));

  const goodScope = await copyFixture();
  await appendTimelineEvents(goodScope, adr17AttestationEvent({ id: "adr17_attest_witness", data: { attestation_role: "witness" } }));
  const good = await validateChart(goodScope);
  assert(!good.errors.some((e) => e.message.includes("V-ATTEST-02")), JSON.stringify(good.errors, null, 2));
});

test("V-ATTEST-03: verify/cosign/countersign by non-clinician source warns only", async () => {
  const agentScope = await copyFixture();
  await appendTimelineEvents(agentScope, adr17AttestationEvent({
    id: "adr17_attest_agent_verify",
    author: { id: "pi", role: "agent" },
    source: { kind: "agent_review" },
    data: { attestation_role: "verify" },
  }));
  const agent = await validateChart(agentScope);
  assert(!agent.errors.some((e) => e.message.includes("V-ATTEST-03")), JSON.stringify(agent.errors, null, 2));
  assert(agent.warnings.some((w) => w.message.includes("V-ATTEST-03")), JSON.stringify(agent.warnings, null, 2));

  const clinicianScope = await copyFixture();
  await appendTimelineEvents(clinicianScope, adr17AttestationEvent({ id: "adr17_attest_clinician_verify", data: { attestation_role: "verify" }, source: { kind: "clinician_chart_action" }, author: { id: "md", role: "md" } }));
  const clinician = await validateChart(clinicianScope);
  assert(!clinician.warnings.some((w) => w.message.includes("V-ATTEST-03")), JSON.stringify(clinician.warnings, null, 2));
});

test("V-ATTEST-04: scribe attestation requires on_behalf_of", async () => {
  const badScope = await copyFixture();
  await appendTimelineEvents(badScope, adr17AttestationEvent({ id: "adr17_attest_scribe_missing", data: { attestation_role: "scribe" } }));
  const bad = await validateChart(badScope);
  assert(bad.errors.some((e) => e.message.includes("V-ATTEST-04")), JSON.stringify(bad.errors, null, 2));

  const goodScope = await copyFixture();
  await appendTimelineEvents(goodScope, adr17AttestationEvent({ id: "adr17_attest_scribe_valid", data: { attestation_role: "scribe", on_behalf_of: "md_lee" } }));
  const good = await validateChart(goodScope);
  assert(!good.errors.some((e) => e.message.includes("V-ATTEST-04")), JSON.stringify(good.errors, null, 2));
});

test("V-VITALS-01 rejects vital-topic trend with no vital evidence link", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, {
    id: "evt_trend_no_vital_link",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:30:00-05:00",
    recorded_at: "2026-04-18T09:30:00-05:00",
    author: { id: "pi-agent", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: { summary: "SpO2 trending down without supporting evidence link." },
    links: { supports: [] },
  });
  const r = await validateChart(scope);
  assert(
    r.errors.some((e) => /V-VITALS-01/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-VITALS-01 accepts vital-topic trend with vitals_window evidence", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, {
    id: "evt_trend_vitals_window",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:30:00-05:00",
    recorded_at: "2026-04-18T09:30:00-05:00",
    author: { id: "pi-agent", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: { summary: "HR climbing 88 to 108." },
    links: {
      supports: [
        {
          ref: "vitals://enc_001?name=heart_rate&from=2026-04-18T09:00:00-05:00&to=2026-04-18T09:30:00-05:00",
          kind: "vitals_window",
          selection: {
            metric: "heart_rate",
            from: "2026-04-18T09:00:00-05:00",
            to: "2026-04-18T09:30:00-05:00",
            encounterId: "enc_001",
          },
        },
      ],
    },
  });
  const r = await validateChart(scope);
  assert(
    !r.errors.some((e) => /V-VITALS-01/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-VITALS-01 accepts vital-topic trend with event-ref to observation.vital_sign (permissive)", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, {
    id: "evt_trend_eventref_vital_obs",
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "respiratory_rate", value: 22, unit: "bpm" },
    links: { supports: [] },
  }, {
    id: "evt_trend_eventref",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:30:00-05:00",
    recorded_at: "2026-04-18T09:30:00-05:00",
    author: { id: "pi-agent", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: { summary: "RR rising on stable settings." },
    links: { supports: [{ ref: "evt_trend_eventref_vital_obs", kind: "event" }] },
  });
  const r = await validateChart(scope);
  assert(
    !r.errors.some((e) => /V-VITALS-01/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});

test("V-VITALS-01 ignores non-vital-topic trend assessments", async () => {
  const scope = await copyFixture();
  await appendTimelineEvents(scope, {
    id: "evt_trend_nonvital_validator",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:30:00-05:00",
    recorded_at: "2026-04-18T09:30:00-05:00",
    author: { id: "pi-agent", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "final",
    data: { summary: "Wound bed improving with granulation tissue." },
    links: { supports: [] },
  });
  const r = await validateChart(scope);
  assert(
    !r.errors.some((e) => /V-VITALS-01/.test(e.message)),
    JSON.stringify(r.errors, null, 2),
  );
});
