import test from "node:test";
import assert from "node:assert/strict";
import { parseEvidenceRef, formatVitalsUri, isVitalsUri } from "./evidence.js";

test("plain id round-trips as event ref", () => {
  const r = parseEvidenceRef("evt_20260418T0815_01");
  assert.deepEqual(r, { kind: "event", id: "evt_20260418T0815_01" });
});

test("vitals URI parses encounter, name, window", () => {
  const uri = "vitals://enc_001?name=spo2&from=2026-04-18T08:00:00-05:00&to=2026-04-18T08:40:00-05:00";
  const r = parseEvidenceRef(uri);
  assert(r && r.kind === "vitals_interval");
  assert.equal(r.encounterId, "enc_001");
  assert.equal(r.name, "spo2");
  assert.equal(r.from.toISOString(), new Date("2026-04-18T08:00:00-05:00").toISOString());
  assert.equal(r.to.toISOString(), new Date("2026-04-18T08:40:00-05:00").toISOString());
});

test("malformed vitals URI returns null", () => {
  assert.equal(parseEvidenceRef("vitals://?name=spo2"), null);
  assert.equal(parseEvidenceRef("vitals://enc_001?from=x"), null);
  assert.equal(parseEvidenceRef("vitals://enc_001?name=spo2&from=junk&to=2026-04-18T08:40:00-05:00"), null);
});

test("formatVitalsUri composes a parseable URI", () => {
  const uri = formatVitalsUri({
    encounterId: "enc_001",
    name: "spo2",
    from: new Date("2026-04-18T08:00:00-05:00"),
    to: new Date("2026-04-18T08:40:00-05:00"),
  });
  assert(uri.startsWith("vitals://enc_001"));
  const r = parseEvidenceRef(uri);
  assert(r && r.kind === "vitals_interval");
  assert.equal(r.encounterId, "enc_001");
  assert.equal(r.name, "spo2");
});

test("isVitalsUri discriminates", () => {
  assert.equal(isVitalsUri("vitals://x?y=z"), true);
  assert.equal(isVitalsUri("evt_20260418T0815_01"), false);
});
