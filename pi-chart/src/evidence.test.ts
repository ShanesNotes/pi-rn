import test from "node:test";
import assert from "node:assert/strict";
import { parseEvidenceRef, formatVitalsUri, isVitalsUri } from "./evidence.js";

test("plain id parses as an event ref", () => {
  const r = parseEvidenceRef("evt_20260418T0815_01");
  assert.deepEqual(r, { kind: "event", ref: "evt_20260418T0815_01" });
});

test("note id parses as a note ref", () => {
  const r = parseEvidenceRef("note_20260418T0845_sbar");
  assert.deepEqual(r, { kind: "note", ref: "note_20260418T0845_sbar" });
});

test("vitals URI parses into canonical vitals ref", () => {
  const uri =
    "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00";
  const r = parseEvidenceRef(uri);
  assert(r && r.kind === "vitals_window");
  assert.equal(r.ref, uri);
  assert.deepEqual(r.selection, {
    metric: "spo2",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:40:00-05:00",
    encounterId: "enc_001",
  });
});

test("malformed vitals URI returns null", () => {
  assert.equal(parseEvidenceRef("vitals://?name=spo2"), null);
  assert.equal(parseEvidenceRef("vitals://enc_001?from=x"), null);
  assert.equal(
    parseEvidenceRef(
      "vitals://enc_001?name=spo2&from=junk&to=2026-04-18T08:40:00-05:00",
    ),
    null,
  );
});

test("formatVitalsUri composes a parseable URI (metric param)", () => {
  const uri = formatVitalsUri({
    encounterId: "enc_001",
    metric: "spo2",
    from: new Date("2026-04-18T08:00:00-05:00"),
    to: new Date("2026-04-18T08:40:00-05:00"),
  });
  assert(uri.startsWith("vitals://enc_001"));
  const r = parseEvidenceRef(uri);
  assert(r && r.kind === "vitals_window");
  assert.equal(r.selection?.metric, "spo2");
});

test("formatVitalsUri accepts legacy `name` alias", () => {
  const uri = formatVitalsUri({
    encounterId: "enc_001",
    name: "spo2",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:40:00-05:00",
  });
  const r = parseEvidenceRef(uri);
  assert(r && r.kind === "vitals_window" && r.selection?.metric === "spo2");
});

// v0.2 back-compat
test("v0.2 back-compat: parseEvidenceRef normalizes legacy structured objects into canonical refs", () => {
  const r = parseEvidenceRef({ kind: "artifact", id: "evt_20260418T0900_01" });
  assert.deepEqual(r, { kind: "artifact", ref: "evt_20260418T0900_01" });

  const v = parseEvidenceRef({
    kind: "vitals",
    metric: "heart_rate",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:30:00-05:00",
    encounterId: "enc_001",
  });
  assert(v && v.kind === "vitals_window");
  assert.equal(v.ref, "vitals://enc_001?name=heart_rate&from=2026-04-18T08%3A00%3A00-05%3A00&to=2026-04-18T08%3A30%3A00-05%3A00");
  assert.deepEqual(v.selection, {
    metric: "heart_rate",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:30:00-05:00",
    encounterId: "enc_001",
  });
});

// v0.2 back-compat
test("v0.2 back-compat: legacy structured vitals without encounterId still normalize", () => {
  const v = parseEvidenceRef({
    kind: "vitals",
    metric: "heart_rate",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:30:00-05:00",
  });
  assert(v && v.kind === "vitals_window");
  assert.equal(v.ref, "vitals://window?name=heart_rate&from=2026-04-18T08%3A00%3A00-05%3A00&to=2026-04-18T08%3A30%3A00-05%3A00");
  assert.deepEqual(v.selection, {
    metric: "heart_rate",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:30:00-05:00",
  });
});

test("canonical object refs round-trip without dropping optional fields", () => {
  const r = parseEvidenceRef({
    kind: "external",
    ref: "synthea://enc_abc?resource=Observation/obs_71",
    role: "context",
    basis: "imported source row",
    selection: { dataset: "synthea" },
    derived_from: [
      {
        kind: "artifact",
        ref: "evt_20260418T0900_01",
        role: "primary",
      },
    ],
  });
  assert.deepEqual(r, {
    kind: "external",
    ref: "synthea://enc_abc?resource=Observation/obs_71",
    role: "context",
    basis: "imported source row",
    selection: { dataset: "synthea" },
    derived_from: [
      {
        kind: "artifact",
        ref: "evt_20260418T0900_01",
        role: "primary",
      },
    ],
  });
});

test("isVitalsUri discriminates", () => {
  assert.equal(isVitalsUri("vitals://x?y=z"), true);
  assert.equal(isVitalsUri("evt_20260418T0815_01"), false);
});
