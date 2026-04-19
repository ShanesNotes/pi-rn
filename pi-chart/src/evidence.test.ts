import test from "node:test";
import assert from "node:assert/strict";
import { parseEvidenceRef, formatVitalsUri, isVitalsUri } from "./evidence.js";

test("plain id parses as an event ref", () => {
  const r = parseEvidenceRef("evt_20260418T0815_01");
  assert.deepEqual(r, { kind: "event", id: "evt_20260418T0815_01" });
});

test("note id parses as a note ref", () => {
  const r = parseEvidenceRef("note_20260418T0845_sbar");
  assert.deepEqual(r, { kind: "note", id: "note_20260418T0845_sbar" });
});

test("vitals URI parses into canonical vitals ref", () => {
  const uri =
    "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00";
  const r = parseEvidenceRef(uri);
  assert(r && r.kind === "vitals");
  assert.equal(r.metric, "spo2");
  assert.equal(r.encounterId, "enc_001");
  assert.equal(r.from, "2026-04-18T08:00:00-05:00");
  assert.equal(r.to, "2026-04-18T08:40:00-05:00");
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
  assert(r && r.kind === "vitals");
  assert.equal(r.metric, "spo2");
});

test("formatVitalsUri accepts legacy `name` alias", () => {
  const uri = formatVitalsUri({
    encounterId: "enc_001",
    name: "spo2",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:40:00-05:00",
  });
  const r = parseEvidenceRef(uri);
  assert(r && r.kind === "vitals" && r.metric === "spo2");
});

test("parseEvidenceRef normalizes structured objects in place", () => {
  const r = parseEvidenceRef({ kind: "artifact", id: "evt_20260418T0900_01" });
  assert.deepEqual(r, { kind: "artifact", id: "evt_20260418T0900_01" });

  const v = parseEvidenceRef({
    kind: "vitals",
    metric: "heart_rate",
    from: "2026-04-18T08:00:00-05:00",
    to: "2026-04-18T08:30:00-05:00",
    encounterId: "enc_001",
  });
  assert(v && v.kind === "vitals" && v.metric === "heart_rate");
});

test("isVitalsUri discriminates", () => {
  assert.equal(isVitalsUri("vitals://x?y=z"), true);
  assert.equal(isVitalsUri("evt_20260418T0815_01"), false);
});
