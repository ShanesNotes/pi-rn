import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import {
  appendEvent,
  nextEventId,
  nextNoteId,
  writeCommunicationNote,
  writeNote,
} from "./write.js";

async function tmpChart(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-test-"));
  await fs.writeFile(
    path.join(dir, "chart.yaml"),
    "subject: patient_001\nclock: sim_time\n",
  );
  return dir;
}

test("appendEvent rejects missing base envelope fields", async () => {
  const root = await tmpChart();
  await assert.rejects(
    () => appendEvent({ type: "observation", subject: "patient_001" } as any, { chartRoot: root }),
    /missing required envelope fields/,
  );
});

test("appendEvent rejects clinical event missing encounter_id", async () => {
  const root = await tmpChart();
  await assert.rejects(
    () => appendEvent(
      {
        type: "observation",
        subject: "patient_001",
        effective_at: "2026-04-18T08:00:00-05:00",
        author: { id: "x", role: "rn" },
        source: { kind: "k" },
        status: "final",
      } as any,
      { chartRoot: root },
    ),
    /clinical event \(observation\) missing required fields/,
  );
});

test("appendEvent fills id + recorded_at", async () => {
  const root = await tmpChart();
  const id = await appendEvent(
    {
      type: "observation",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:00:00-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "k" },
      certainty: "observed",
      status: "final",
      data: { name: "n", value: 1 },
      links: { supports: [] },
    },
    { chartRoot: root },
  );
  assert.match(id, /^evt_20260418T0800_\d{2}$/);
  const text = await fs.readFile(
    path.join(root, "timeline/2026-04-18/events.ndjson"),
    "utf8",
  );
  const ev = JSON.parse(text.trim());
  assert.equal(ev.id, id);
  assert(ev.recorded_at);
});

test("appendEvent does not mutate caller's input", async () => {
  const root = await tmpChart();
  const input = {
    type: "observation" as const,
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "k" },
    certainty: "observed" as const,
    status: "final" as const,
    data: { name: "n", value: 1 },
    links: { supports: [] },
  };
  const snapshot = JSON.stringify(input);
  await appendEvent(input as any, { chartRoot: root });
  assert.equal(JSON.stringify(input), snapshot);
});

test("nextEventId probes existing day file and increments", async () => {
  const root = await tmpChart();
  const opts = { chartRoot: root };
  const ev = {
    type: "observation" as const,
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "k" },
    certainty: "observed" as const,
    status: "final" as const,
    data: { name: "n", value: 1 },
    links: { supports: [] },
  };
  const id1 = await appendEvent(ev as any, opts);
  const id2 = await appendEvent(ev as any, opts);
  const id3 = await nextEventId({ chartRoot: root, effectiveAt: "2026-04-18T08:00:00-05:00" });
  assert.equal(id1, "evt_20260418T0800_01");
  assert.equal(id2, "evt_20260418T0800_02");
  assert.equal(id3, "evt_20260418T0800_03");
});

test("writeNote refuses overwrite", async () => {
  const root = await tmpChart();
  const fm = {
    type: "communication" as const,
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:45:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "k" },
    status: "final" as const,
  };
  await writeNote({ frontmatter: fm, body: "hello", chartRoot: root, slug: "test" });
  await assert.rejects(
    () => writeNote({ frontmatter: fm, body: "again", chartRoot: root, slug: "test" }),
    /already exists/,
  );
});

test("writeCommunicationNote produces note + matching comm event", async () => {
  const root = await tmpChart();
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
    chartRoot: root,
    slug: "sbar",
  });
  assert(notePath.endsWith("0845_sbar.md"));
  const evText = await fs.readFile(
    path.join(root, "timeline/2026-04-18/events.ndjson"),
    "utf8",
  );
  const ev = JSON.parse(evText.trim());
  assert.equal(ev.id, eventId);
  assert.equal(ev.type, "communication");
  assert(typeof ev.data?.note_ref === "string");
  assert(ev.data.note_ref.startsWith("note_20260418T0845"));
  assert.equal(ev.data.audience, "covering_md");
});

test("nextNoteId is pure (no file probe)", () => {
  const id = nextNoteId({ effectiveAt: "2026-04-18T08:45:00-05:00", slug: "sbar" });
  assert.equal(id, "note_20260418T0845_sbar");
});
