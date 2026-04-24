import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import {
  makeEmptyPatient,
  appendRawEvent,
  appendRawVital,
  writeRawNote,
  patientDir,
} from "../test-helpers/fixture.js";
import { evidenceChain } from "./evidenceChain.js";

function obs(id: string, at: string, extras: Record<string, unknown> = {}) {
  return {
    id,
    type: "observation",
    subtype: "vital_sign",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: at,
    recorded_at: at,
    author: { id: "x", role: "rn" },
    source: { kind: "monitor_extension" },
    certainty: "observed",
    status: "final",
    data: { name: "spo2", value: 91, unit: "%" },
    links: { supports: [] },
    ...extras,
  };
}

test("role-carrying event supports preserve role on emitted child nodes", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_obs_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:15:00-05:00",
    recorded_at: "2026-04-18T08:15:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "hypoxia" },
    links: {
      supports: [{ kind: "event", ref: "evt_obs_01", role: "primary" }],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  assert.equal(node.kind, "event");
  if (node.kind !== "event") throw new Error();
  assert.equal(node.supports.length, 1);
  const support = node.supports[0] as (typeof node.supports)[number] & {
    role?: string;
  };
  assert.equal(support.kind, "event");
  assert.equal(support.role, "primary");
});

test("event ref: chain recurses to supporting observation", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_obs_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:15:00-05:00",
    recorded_at: "2026-04-18T08:15:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "hypoxia" },
    links: { supports: ["evt_obs_01"] },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  assert.equal(node.kind, "event");
  if (node.kind !== "event") throw new Error();
  assert.equal(node.supports.length, 1);
  assert.equal(node.supports[0].kind, "event");
});

test("contradicts edges produce a dedicated evidence-chain fork", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_obs_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", obs("evt_obs_02", "2026-04-18T08:05:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:20:00-05:00",
    recorded_at: "2026-04-18T08:20:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "hypoxia resolving" },
    links: {
      supports: [{ kind: "event", ref: "evt_obs_01", role: "context" }],
      contradicts: [{ ref: "evt_obs_02", basis: "repeat sample disagrees" }],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  const root = node as typeof node & { contradicts?: typeof node.supports };
  assert.equal(node.supports.length, 1);
  assert.equal(node.supports[0].kind, "event");
  assert.equal(root.contradicts?.length, 1);
  const contradicted = root.contradicts?.[0];
  assert.equal(contradicted?.kind, "event");
  if (!contradicted || contradicted.kind !== "event") throw new Error();
  assert.equal(contradicted.event.id, "evt_obs_02");
});

test("vitals_window ref: chain resolves to trend points", async () => {
  const scope = await makeEmptyPatient();
  for (let i = 0; i < 3; i++) {
    await appendRawVital(scope, "2026-04-18", {
      sampled_at: `2026-04-18T08:${String(i * 5).padStart(2, "0")}:00-05:00`,
      subject: "patient_001",
      encounter_id: "enc_001",
      source: { kind: "monitor_extension" },
      name: "spo2",
      value: 94 - i,
    });
  }
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:20:00-05:00",
    recorded_at: "2026-04-18T08:20:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "drop" },
    links: {
      supports: [
        {
          kind: "vitals_window",
          ref: "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:15:00-05:00",
          selection: {
            metric: "spo2",
            from: "2026-04-18T08:00:00-05:00",
            to: "2026-04-18T08:15:00-05:00",
            encounterId: "enc_001",
          },
        },
      ],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  assert.equal(node.supports.length, 1);
  const ref = node.supports[0];
  assert.equal(ref.kind, "vitals");
  if (ref.kind !== "vitals") throw new Error();
  assert.equal(ref.metric, "spo2");
  assert(ref.points.length >= 2);
});

// v0.2 back-compat
test("v0.2 back-compat: legacy and canonical vitals refs preserve the existing EvidenceNode output shape", async () => {
  const scope = await makeEmptyPatient();
  for (let i = 0; i < 3; i++) {
    await appendRawVital(scope, "2026-04-18", {
      sampled_at: `2026-04-18T08:${String(i * 5).padStart(2, "0")}:00-05:00`,
      subject: "patient_001",
      encounter_id: "enc_001",
      source: { kind: "monitor_extension" },
      name: "spo2",
      value: 94 - i,
    });
  }

  const legacyId = "evt_ass_legacy";
  const canonicalId = "evt_ass_canonical";
  const baseAssessment = {
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:20:00-05:00",
    recorded_at: "2026-04-18T08:20:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "drop" },
  };

  await appendRawEvent(scope, "2026-04-18", {
    id: legacyId,
    ...baseAssessment,
    links: {
      supports: [
        {
          kind: "vitals",
          metric: "spo2",
          from: "2026-04-18T08:00:00-05:00",
          to: "2026-04-18T08:15:00-05:00",
          encounterId: "enc_001",
        },
      ],
    },
  });

  await appendRawEvent(scope, "2026-04-18", {
    id: canonicalId,
    ...baseAssessment,
    links: {
      supports: [
        {
          kind: "vitals_window",
          ref: "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:15:00-05:00",
          selection: {
            metric: "spo2",
            from: "2026-04-18T08:00:00-05:00",
            to: "2026-04-18T08:15:00-05:00",
            encounterId: "enc_001",
          },
        },
      ],
    },
  });

  const legacy = await evidenceChain({ scope, eventId: legacyId });
  const canonical = await evidenceChain({ scope, eventId: canonicalId });
  if (legacy.kind !== "event" || canonical.kind !== "event") throw new Error();
  assert.deepEqual(canonical.supports, legacy.supports);
});

test("vitals_window ref preserves encounter scoping across evidenceChain -> trend", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:00:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 94,
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:05:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_002",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 80,
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:20:00-05:00",
    recorded_at: "2026-04-18T08:20:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "drop" },
    links: {
      supports: [
        {
          kind: "vitals_window",
          ref: "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:10:00-05:00",
          selection: {
            metric: "spo2",
            from: "2026-04-18T08:00:00-05:00",
            to: "2026-04-18T08:10:00-05:00",
            encounterId: "enc_001",
          },
        },
      ],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  const ref = node.supports[0];
  assert.equal(ref.kind, "vitals");
  if (ref.kind !== "vitals") throw new Error();
  assert.deepEqual(ref.points.map((point) => point.value), [94]);
});

test("derived_from cycles on supports stay bounded while the main support still resolves", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_obs_01", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "bounded recursion check" },
    links: {
      supports: [
        {
          kind: "event",
          ref: "evt_obs_01",
          role: "context",
          derived_from: [
            {
              kind: "external",
              ref: "urn:test:a",
              derived_from: [
                {
                  kind: "external",
                  ref: "urn:test:b",
                  derived_from: [{ kind: "external", ref: "urn:test:a" }],
                },
              ],
            },
          ],
        },
      ],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  assert.equal(node.supports.length, 1);
  assert.equal(node.supports[0].kind, "event");
});

test("external supports remain structurally valid but emit no evidence node", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "import corroborated externally" },
    links: {
      supports: [
        {
          kind: "external",
          ref: "synthea://enc_abc?resource=Observation/obs_71",
          role: "context",
        },
      ],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  assert.deepEqual(node.supports, []);
});

test("artifact ref: chain drops escaped paths even if the file exists outside artifacts", async () => {
  const scope = await makeEmptyPatient();
  const pdir = patientDir(scope);
  await fs.mkdir(path.join(pdir, "artifacts"), { recursive: true });
  await fs.writeFile(path.join(pdir, "outside.pdf"), "pdf-bytes");
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_art_01",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: "artifacts/../outside.pdf", description: "report" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "consistent with report" },
    links: { supports: [{ kind: "artifact", ref: "evt_art_01" }] },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  assert.equal(node.supports.length, 0);
});

test("note ref: chain resolves to NarrativeEntry", async () => {
  const scope = await makeEmptyPatient();
  await writeRawNote(
    scope,
    "2026-04-18",
    "0845_sbar.md",
    {
      id: "note_20260418T0845_sbar",
      type: "communication",
      subtype: "sbar",
      subject: "patient_001",
      encounter_id: "enc_001",
      effective_at: "2026-04-18T08:45:00-05:00",
      recorded_at: "2026-04-18T08:45:10-05:00",
      author: { id: "x", role: "rn" },
      source: { kind: "agent_synthesis" },
      references: [],
      status: "final",
    },
    "SBAR body",
  );
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T09:00:00-05:00",
    recorded_at: "2026-04-18T09:00:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "stable per handoff" },
    links: {
      supports: [{ kind: "note", ref: "note_20260418T0845_sbar" }],
    },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  const ref = node.supports[0];
  assert.equal(ref.kind, "note");
  if (ref.kind !== "note") throw new Error();
  assert.equal(ref.note.id, "note_20260418T0845_sbar");
  assert(ref.note.body.includes("SBAR body"));
});

test("artifact ref: chain resolves to ArtifactPointer when file exists", async () => {
  const scope = await makeEmptyPatient();
  const pdir = patientDir(scope);
  await fs.mkdir(path.join(pdir, "artifacts"), { recursive: true });
  const artifactPath = "artifacts/x.pdf";
  await fs.writeFile(path.join(pdir, artifactPath), "pdf-bytes");
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_art_01",
    type: "artifact_ref",
    subtype: "pdf",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:00:00-05:00",
    recorded_at: "2026-04-18T08:00:00-05:00",
    author: { id: "x", role: "rn" },
    source: { kind: "manual_scenario" },
    certainty: "observed",
    status: "final",
    data: { kind: "pdf", path: artifactPath, description: "report" },
    links: { supports: [] },
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:30:00-05:00",
    recorded_at: "2026-04-18T08:30:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "consistent with report" },
    links: { supports: [{ kind: "artifact", ref: "evt_art_01" }] },
  });
  const node = await evidenceChain({ scope, eventId: "evt_ass_01" });
  if (node.kind !== "event") throw new Error();
  const ref = node.supports[0];
  assert.equal(ref.kind, "artifact");
  if (ref.kind !== "artifact") throw new Error();
  assert.equal(ref.artifact.path, artifactPath);
});

test("evidenceChain asOf excludes future supports and future roots", async () => {
  const scope = await makeEmptyPatient();
  await appendRawEvent(scope, "2026-04-18", obs("evt_obs_early", "2026-04-18T08:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", obs("evt_obs_future", "2026-04-18T09:00:00-05:00"));
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "impression",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:15:00-05:00",
    recorded_at: "2026-04-18T08:15:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "hypoxia" },
    links: { supports: ["evt_obs_early", "evt_obs_future"] },
  });
  const node = await evidenceChain({
    scope,
    eventId: "evt_ass_01",
    asOf: "2026-04-18T08:30:00-05:00",
  });
  if (node.kind !== "event") throw new Error();
  assert.deepEqual(
    node.supports.filter((support) => support.kind === "event").map((support) => support.event.id),
    ["evt_obs_early"],
  );
  await assert.rejects(
    evidenceChain({ scope, eventId: "evt_obs_future", asOf: "2026-04-18T08:30:00-05:00" }),
    /unknown event id/,
  );
});

test("evidenceChain asOf clamps vitals windows", async () => {
  const scope = await makeEmptyPatient();
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:05:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 93,
  });
  await appendRawVital(scope, "2026-04-18", {
    sampled_at: "2026-04-18T08:15:00-05:00",
    subject: "patient_001",
    encounter_id: "enc_001",
    source: { kind: "monitor_extension" },
    name: "spo2",
    value: 88,
  });
  await appendRawEvent(scope, "2026-04-18", {
    id: "evt_ass_01",
    type: "assessment",
    subtype: "trend",
    subject: "patient_001",
    encounter_id: "enc_001",
    effective_at: "2026-04-18T08:10:00-05:00",
    recorded_at: "2026-04-18T08:10:00-05:00",
    author: { id: "x", role: "rn_agent" },
    source: { kind: "agent_inference" },
    certainty: "inferred",
    status: "active",
    data: { summary: "drop" },
    links: {
      supports: [
        {
          kind: "vitals_window",
          ref: "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:15:00-05:00",
          selection: {
            metric: "spo2",
            from: "2026-04-18T08:00:00-05:00",
            to: "2026-04-18T08:15:00-05:00",
            encounterId: "enc_001",
          },
        },
      ],
    },
  });
  const node = await evidenceChain({
    scope,
    eventId: "evt_ass_01",
    asOf: "2026-04-18T08:10:30-05:00",
  });
  if (node.kind !== "event") throw new Error();
  const vitals = node.supports.find((support) => support.kind === "vitals");
  assert(vitals && vitals.kind === "vitals");
  assert.deepEqual(vitals.points.map((point) => point.sampled_at), ["2026-04-18T08:05:00-05:00"]);
});
