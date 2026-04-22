import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import { parseFrontmatter } from "./fs-util.js";
import { __setTimeNowForTests } from "./time.js";
import { patientRoot } from "./types.js";
import type { PatientScope } from "./types.js";
import {
  __setWriteCommunicationNoteTestHooksForTests,
  appendEvent,
  nextEventId,
  nextNoteId,
  writeArtifactRef,
  writeCommunicationNote,
  writeNote,
} from "./write.js";

async function tmpChart(opts?: {
  subject?: string;
  timezone?: string;
  patientId?: string;
}): Promise<PatientScope> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-test-"));
  const patientId = opts?.patientId ?? "patient_001";
  const subject = opts?.subject ?? patientId;
  await fs.writeFile(
    path.join(dir, "pi-chart.yaml"),
    `system_version: 0.2.0\nschema_version: 0.2.0\npatients:\n  - id: ${patientId}\n    directory: patients/${patientId}\n`,
  );
  const patientDir = path.join(dir, "patients", patientId);
  await fs.mkdir(patientDir, { recursive: true });
  const lines = [`subject: ${subject}`, "clock: sim_time"];
  if (opts?.timezone) lines.push(`timezone: ${opts.timezone}`);
  await fs.writeFile(path.join(patientDir, "chart.yaml"), `${lines.join("\n")}\n`);
  await fs.cp(
    path.resolve(import.meta.dirname, "..", "schemas"),
    path.join(dir, "schemas"),
    { recursive: true },
  );
  return { chartRoot: dir, patientId };
}

async function readEvents(scope: PatientScope): Promise<any[]> {
  const root = patientRoot(scope);
  const timelineDir = path.join(root, "timeline");
  try {
    const days = (await fs.readdir(timelineDir)).sort();
    const events: any[] = [];
    for (const day of days) {
      const eventsPath = path.join(timelineDir, day, "events.ndjson");
      try {
        const text = await fs.readFile(eventsPath, "utf8");
        events.push(
          ...text
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line)),
        );
      } catch (error: any) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
    return events;
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function listNoteFiles(scope: PatientScope, day = "2026-04-18"): Promise<string[]> {
  try {
    return (await fs.readdir(path.join(patientRoot(scope), "timeline", day, "notes"))).sort();
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

test.afterEach(() => {
  __setWriteCommunicationNoteTestHooksForTests(null);
  __setTimeNowForTests(null);
});

test("appendEvent rejects missing base envelope fields", async () => {
  const scope = await tmpChart();
  await assert.rejects(
    () => appendEvent({ type: "observation", subject: "patient_001" } as any, scope),
    /missing required envelope fields/,
  );
});

test("appendEvent rejects clinical event missing encounter_id", async () => {
  const scope = await tmpChart();
  await assert.rejects(
    () => appendEvent(
      {
        type: "observation",
        subject: "patient_001",
        effective_at: "2026-04-18T08:00:00-05:00",
        author: { id: "x", role: "rn" },
        source: { kind: "manual_scenario" },
        status: "final",
      } as any,
      scope,
    ),
    /clinical event \(observation\) missing required fields/,
  );
});

test("appendEvent fills id + recorded_at", async () => {
  const scope = await tmpChart();
  const id = await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "observed",
      status: "final",
      data: { name: "n", value: 1 },
      links: { supports: [] },
    },
    scope,
  );
  assert.match(id, /^evt_20260418T0800_\d{2}$/);
  const [event] = await readEvents(scope);
  assert.equal(event.id, id);
  assert(event.recorded_at);
});

test("appendEvent does not mutate caller's input", async () => {
  const scope = await tmpChart();
  const input = {
    type: "observation" as const,
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed" as const,
    status: "final" as const,
    data: { name: "n", value: 1 },
    links: { supports: [] },
  };
  const snapshot = JSON.stringify(input);
  await appendEvent(input as any, scope);
  assert.equal(JSON.stringify(input), snapshot);
});

test("nextEventId probes existing day file and increments", async () => {
  const scope = await tmpChart();
  const ev = {
    type: "observation" as const,
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed" as const,
    status: "final" as const,
    data: { name: "n", value: 1 },
    links: { supports: [] },
  };
  const id1 = await appendEvent(ev as any, scope);
  const id2 = await appendEvent(ev as any, scope);
  const id3 = await nextEventId({
    scope,
    effectiveStart: "2026-04-18T08:00:00-05:00",
  });
  assert.equal(id1, "evt_20260418T0800_01");
  assert.equal(id2, "evt_20260418T0800_02");
  assert.equal(id3, "evt_20260418T0800_03");
});

test("appendEvent rejects schema-invalid payload before persistence", async () => {
  const scope = await tmpChart();
  await assert.rejects(
    () =>
      appendEvent(
        {
          type: "observation",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:00:00-05:00",
          author: { id: "x", role: "rn" },
          source: { kind: "manual_scenario" },
          certainty: "observed",
          status: "final",
          data: "bad" as any,
          links: { supports: [] },
        },
        scope,
      ),
    /event failed schema validation/,
  );
  assert.equal((await readEvents(scope)).length, 0);
});

test("writeNote is deprecated for sanctioned authoring", async () => {
  const scope = await tmpChart();
  await assert.rejects(
    () =>
      writeNote({
        frontmatter: {} as any,
        body: "hello",
        scope,
      }),
    /deprecated/,
  );
  assert.deepEqual(await listNoteFiles(scope), []);
});

test("write paths reject event subject that does not match patient directory", async () => {
  const scope = await tmpChart();
  await assert.rejects(
    () =>
      appendEvent(
        {
          type: "observation",
          subject: "patient_999",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:00:00-05:00",
          author: { id: "x", role: "rn" },
          source: { kind: "manual_scenario" },
          certainty: "observed",
          status: "final",
          data: { name: "n", value: 1 },
          links: { supports: [] },
        },
        scope,
      ),
    /does not match patient directory/,
  );
  await assert.rejects(
    () =>
      writeNote({
        frontmatter: {
          type: "communication",
          subject: "patient_999",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:45:00-05:00",
          author: { id: "x", role: "rn_agent" },
          source: { kind: "manual_scenario" },
          status: "final",
        },
        body: "hello",
        scope,
        slug: "test",
      }),
    /deprecated/,
  );
  assert.equal((await readEvents(scope)).length, 0);
  assert.deepEqual(await listNoteFiles(scope), []);
});

test("write paths reject even a subject-matching event when chart.yaml is stale", async () => {
  // Invariant 6: directory is truth. A chart.yaml whose subject drifted
  // must not quietly allow writes that happen to match the drifted value.
  const scope = await tmpChart({ subject: "patient_999" });
  await assert.rejects(
    () =>
      appendEvent(
        {
          type: "observation",
          subject: "patient_999",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:00:00-05:00",
          author: { id: "x", role: "rn" },
          source: { kind: "manual_scenario" },
          certainty: "observed",
          status: "final",
          data: { name: "n", value: 1 },
          links: { supports: [] },
        },
        scope,
      ),
    /does not match patient directory/,
  );
  assert.equal((await readEvents(scope)).length, 0);
});

test("appendEvent rejects explicit ID collision against existing event", async () => {
  const scope = await tmpChart();
  const id = await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "observed",
      status: "final",
      data: { name: "n", value: 1 },
      links: { supports: [] },
    },
    scope,
  );
  await assert.rejects(
    () =>
      appendEvent(
        {
          id,
          type: "observation",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:05:00-05:00",
          author: { id: "x", role: "rn" },
          source: { kind: "manual_scenario" },
          certainty: "observed",
          status: "final",
          data: { name: "n", value: 2 },
          links: { supports: [] },
        },
        scope,
      ),
    /duplicate id/,
  );
  assert.equal((await readEvents(scope)).length, 1);
});

test("appendEvent rejects explicit ID collision against structural markdown", async () => {
  const scope = await tmpChart();
  await fs.writeFile(
    path.join(patientRoot(scope), "patient.md"),
    "---\nid: patient_001\ntype: subject\nsubject: patient_001\neffective_at: '2026-04-18T06:00:00-05:00'\nrecorded_at: '2026-04-18T06:00:00-05:00'\nauthor: {id: x, role: rn}\nsource: {kind: admission_intake}\nstatus: active\n---\n",
  );
  await assert.rejects(
    () =>
      appendEvent(
        {
          id: "patient_001",
          type: "observation",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:00:00-05:00",
          author: { id: "x", role: "rn" },
          source: { kind: "manual_scenario" },
          certainty: "observed",
          status: "final",
          data: { name: "n", value: 1 },
          links: { supports: [] },
        },
        scope,
      ),
    /duplicate id 'patient_001'/,
  );
});

test("writeCommunicationNote rejects explicit note ID collision even with different filename", async () => {
  const scope = await tmpChart();
  const { notePath: existingPath } = await writeCommunicationNote({
    frontmatter: {
      type: "communication",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:45:00-05:00",
      author: { id: "x", role: "rn_agent" },
      source: { kind: "manual_scenario" },
      status: "final",
    },
    body: "hello",
    scope,
    slug: "sbar",
  });
  const [existingFrontmatter] = parseFrontmatter(
    await fs.readFile(existingPath, "utf8"),
  );
  await assert.rejects(
    () =>
      writeCommunicationNote({
        frontmatter: {
          ...(existingFrontmatter as any),
          recorded_at: "2026-04-18T08:46:00-05:00",
        },
        body: "again",
        scope,
        slug: "different",
      }),
    /duplicate id/,
  );
  assert.deepEqual(await listNoteFiles(scope), ["0845_sbar.md"]);
});

test("writeNote refuses overwrite", async () => {
  const scope = await tmpChart();
  const fm = {
    type: "communication" as const,
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:45:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "manual_scenario" },
    status: "final" as const,
  };
  await writeCommunicationNote({ frontmatter: fm, body: "hello", scope, slug: "test" });
  await assert.rejects(
    () => writeCommunicationNote({ frontmatter: fm, body: "again", scope, slug: "test" }),
    /already exists/,
  );
});

test("writeCommunicationNote produces note + matching comm event", async () => {
  const scope = await tmpChart();
  const { notePath, eventId } = await writeCommunicationNote({
    frontmatter: {
      type: "communication",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:45:00-05:00",
      author: { id: "x", role: "rn_agent" },
      source: { kind: "agent_synthesis" },
      status: "final",
      subtype: "sbar",
    },
    body: "SBAR body",
    communicationData: { audience: "covering_md", summary: "trend" },
    scope,
    slug: "sbar",
  });
  assert(notePath.endsWith("0845_sbar.md"));
  const [ev] = await readEvents(scope);
  assert.equal(ev.id, eventId);
  assert.equal(ev.type, "communication");
  assert(typeof ev.data?.note_ref === "string");
  assert(ev.data.note_ref.startsWith("note_20260418T0845"));
  assert.equal(ev.data.audience, "covering_md");
});

test("appendEvent rejects standalone communication events", async () => {
  const scope = await tmpChart();
  await assert.rejects(
    () =>
      appendEvent(
        {
          type: "communication",
          subtype: "sbar",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:45:00-05:00",
          author: { id: "x", role: "rn_agent" },
          source: { kind: "agent_synthesis" },
          certainty: "performed",
          status: "final",
          data: { note_ref: "note_20260418T0845_sbar" },
          links: { supports: [] },
        },
        scope,
      ),
    /writeCommunicationNote/,
  );
  assert.equal((await readEvents(scope)).length, 0);
});

test("writeCommunicationNote rolls back note when event persistence fails", async () => {
  const scope = await tmpChart();
  __setWriteCommunicationNoteTestHooksForTests({
    afterNotePersisted: () => {
      throw new Error("injected event failure");
    },
  });
  await assert.rejects(
    () =>
      writeCommunicationNote({
        frontmatter: {
          type: "communication",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:45:00-05:00",
          author: { id: "x", role: "rn_agent" },
          source: { kind: "agent_synthesis" },
          status: "final",
        },
        body: "SBAR body",
        scope,
        slug: "sbar",
      }),
    /injected event failure/,
  );
  assert.deepEqual(await listNoteFiles(scope), []);
  assert.equal((await readEvents(scope)).length, 0);
});

test("writeCommunicationNote rejects unknown note references before persistence", async () => {
  const scope = await tmpChart();
  await assert.rejects(
    () =>
      writeCommunicationNote({
        frontmatter: {
          type: "communication",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:45:00-05:00",
          author: { id: "x", role: "rn_agent" },
          source: { kind: "agent_synthesis" },
          status: "final",
          references: ["evt_missing"],
        },
        body: "SBAR body",
        scope,
        slug: "sbar",
      }),
    /references: unknown target id 'evt_missing'/,
  );
  assert.deepEqual(await listNoteFiles(scope), []);
  assert.equal((await readEvents(scope)).length, 0);
});

test("writeCommunicationNote reports both persistence and rollback failures", async () => {
  const scope = await tmpChart();
  __setWriteCommunicationNoteTestHooksForTests({
    afterNotePersisted: () => {
      throw new Error("injected event failure");
    },
    removeNoteFile: async () => {
      throw new Error("injected rollback failure");
    },
  });
  await assert.rejects(
    () =>
      writeCommunicationNote({
        frontmatter: {
          type: "communication",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:45:00-05:00",
          author: { id: "x", role: "rn_agent" },
          source: { kind: "agent_synthesis" },
          status: "final",
        },
        body: "SBAR body",
        scope,
        slug: "sbar",
      }),
    /writeCommunicationNote failed: Error: injected event failure; rollback failed: Error: injected rollback failure/,
  );
});

test("generated write timestamps use chart timezone and preserve caller-supplied timestamps", async () => {
  const scope = await tmpChart({ timezone: "America/Chicago" });
  __setTimeNowForTests(() => new Date("2026-04-19T04:30:45.000Z"));

  const autoId = await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "observed",
      status: "final",
      data: { name: "n", value: 1 },
      links: { supports: [] },
    },
    scope,
  );
  assert.equal(autoId, "evt_20260418T0800_01");
  const [event] = await readEvents(scope);
  assert.equal(event.recorded_at, "2026-04-18T23:30:45-05:00");

  const artifactId = await writeArtifactRef({
    artifactPath: "artifacts/x.pdf",
    kind: "pdf",
    description: "x",
    encounterId: "enc_001",
    subject: "patient_001",
    source: { kind: "manual_scenario" },
    scope,
  });
  const events = await readEvents(scope);
  assert.equal(artifactId, "evt_20260418T2330_01");
  assert.equal(events[1].effective_at, "2026-04-18T23:30:45-05:00");

  const { notePath } = await writeCommunicationNote({
    frontmatter: {
      type: "communication",
      subject: "patient_001",
      encounter_id: "enc_001",
      author: { id: "x", role: "rn_agent" },
      source: { kind: "manual_scenario" },
      status: "final",
    } as any,
    body: "night note",
    scope,
    slug: "night",
  });
  assert.match(notePath, /timeline\/2026-04-18\/notes\/2330_night\.md$/);
  const [noteFrontmatter] = parseFrontmatter(await fs.readFile(notePath, "utf8"));
  assert.equal(noteFrontmatter?.effective_at, "2026-04-18T23:30:45-05:00");
  assert.equal(noteFrontmatter?.recorded_at, "2026-04-18T23:30:45-05:00");

  const { notePath: explicitPath } = await writeCommunicationNote({
    frontmatter: {
      type: "communication",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T10:00:00-05:00",
      recorded_at: "2026-04-18T10:00:30-05:00",
      author: { id: "x", role: "rn_agent" },
      source: { kind: "manual_scenario" },
      status: "final",
    },
    body: "explicit",
    scope,
    slug: "explicit",
  });
  const [explicitFrontmatter] = parseFrontmatter(
    await fs.readFile(explicitPath, "utf8"),
  );
  assert.equal(explicitFrontmatter?.effective_at, "2026-04-18T10:00:00-05:00");
  assert.equal(explicitFrontmatter?.recorded_at, "2026-04-18T10:00:30-05:00");
});

test("generated write timestamps fall back to UTC when chart timezone is absent", async () => {
  const scope = await tmpChart();
  __setTimeNowForTests(() => new Date("2026-04-19T04:30:45.000Z"));
  const artifactId = await writeArtifactRef({
    artifactPath: "artifacts/x.pdf",
    kind: "pdf",
    description: "x",
    encounterId: "enc_001",
    subject: "patient_001",
    source: { kind: "manual_scenario" },
    scope,
  });
  assert.equal(artifactId, "evt_20260419T0430_01");
  const [event] = await readEvents(scope);
  assert.equal(event.effective_at, "2026-04-19T04:30:45+00:00");
});

test("nextNoteId is pure for supplied timestamps", () => {
  const id = nextNoteId({ effectiveAt: "2026-04-18T08:45:00-05:00", slug: "sbar" });
  assert.equal(id, "note_20260418T0845_sbar");
});

test("session autofill fills author when the caller omits it", async () => {
  const scope = await tmpChart();
  await fs.mkdir(path.join(scope.chartRoot, "sessions"), { recursive: true });
  await fs.writeFile(
    path.join(scope.chartRoot, "sessions", "current.yaml"),
    "author:\n  id: rn_shane\n  role: rn\n",
  );
  const id = await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      source: { kind: "monitor_extension" },
      certainty: "observed",
      status: "final",
      data: { name: "spo2", value: 95, unit: "%" },
      links: { supports: [] },
    } as any,
    scope,
  );
  const [event] = await readEvents(scope);
  assert.equal(event.id, id);
  assert.deepEqual(event.author, { id: "rn_shane", role: "rn" });
});

test("session autofill never overrides an explicit author", async () => {
  const scope = await tmpChart();
  await fs.mkdir(path.join(scope.chartRoot, "sessions"), { recursive: true });
  await fs.writeFile(
    path.join(scope.chartRoot, "sessions", "current.yaml"),
    "author:\n  id: rn_shane\n  role: rn\n",
  );
  await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      author: { id: "pi-agent", role: "rn_agent", run_id: "abc" },
      source: { kind: "agent_inference" },
      certainty: "inferred",
      status: "final",
      data: { name: "deterioration_index", value: 0.7 },
      links: { supports: [] },
    },
    scope,
  );
  const [event] = await readEvents(scope);
  assert.equal(event.author.id, "pi-agent");
  assert.equal(event.author.run_id, "abc");
});

test("missing sessions/current.yaml is a no-op (caller still must supply author)", async () => {
  const scope = await tmpChart();
  // No session file written. Omitting author should now surface the schema
  // requirement, not a confusing session-loader error.
  await assert.rejects(
    () =>
      appendEvent(
        {
          type: "observation",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:00:00-05:00",
          source: { kind: "monitor_extension" },
          certainty: "observed",
          status: "final",
          data: { name: "spo2", value: 95 },
          links: { supports: [] },
        } as any,
        scope,
      ),
    /missing required envelope fields/,
  );
});

test("appendEvent rejects unknown supersedes targets before persistence", async () => {
  const scope = await tmpChart();
  await assert.rejects(
    () =>
      appendEvent(
        {
          type: "observation",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:00:00-05:00",
          author: { id: "x", role: "rn" },
          source: { kind: "manual_scenario" },
          certainty: "observed",
          status: "final",
          data: { name: "spo2", value: 95 },
          links: { supports: [], supersedes: ["evt_from_another_patient"] },
        },
        scope,
      ),
    /links\.supersedes: unknown target id 'evt_from_another_patient'/,
  );
  assert.equal((await readEvents(scope)).length, 0);
});

test("appendEvent rejects fulfills targets that are not intents", async () => {
  const scope = await tmpChart();
  const targetId = await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "observed",
      status: "final",
      data: { name: "spo2", value: 95 },
      links: { supports: [] },
    },
    scope,
  );
  await assert.rejects(
    () =>
      appendEvent(
        {
          type: "action",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:05:00-05:00",
          author: { id: "x", role: "rn" },
          source: { kind: "manual_scenario" },
          certainty: "performed",
          status: "final",
          data: { action: "notify" },
          links: { supports: [], fulfills: [targetId] },
        },
        scope,
      ),
    /links\.fulfills: target '.*' must be an intent/,
  );
});

test("appendEvent rejects addresses targets that are not problems or intents", async () => {
  const scope = await tmpChart();
  const targetId = await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "manual_scenario" },
      certainty: "observed",
      status: "final",
      data: { name: "spo2", value: 95 },
      links: { supports: [] },
    },
    scope,
  );
  await assert.rejects(
    () =>
      appendEvent(
        {
          type: "intent",
          subject: "patient_001",
          encounter_id: "enc_001",
          effective_at: "2026-04-18T08:05:00-05:00",
          author: { id: "x", role: "rn_agent" },
          source: { kind: "manual_scenario" },
          certainty: "planned",
          status: "active",
          data: { goal: "watch" },
          links: { supports: [], addresses: [targetId] },
        },
        scope,
      ),
    /links\.addresses: target '.*' must be an assessment\/problem or intent/,
  );
});

test("writeArtifactRef normalizes in-scope paths and rejects escapes", async () => {
  const scope = await tmpChart();
  const normalizedId = await writeArtifactRef({
    artifactPath: "artifacts/../artifacts/imaging/cxr.pdf",
    kind: "pdf",
    description: "report",
    encounterId: "enc_001",
    subject: "patient_001",
    source: { kind: "manual_scenario" },
    scope,
  });
  const [event] = await readEvents(scope);
  assert.equal(normalizedId, event.id);
  assert.equal(event.data.path, "artifacts/imaging/cxr.pdf");

  await assert.rejects(
    () =>
      writeArtifactRef({
        artifactPath: "../outside.pdf",
        kind: "pdf",
        description: "report",
        encounterId: "enc_001",
        subject: "patient_001",
        source: { kind: "manual_scenario" },
        scope,
      }),
    /escapes the patient artifact tree|must stay under artifacts\//,
  );
});
