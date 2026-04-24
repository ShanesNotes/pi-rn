import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { patientRoot, assertValidPatientId } from "./types.js";

test("patientRoot confines patient ids to one patients/ child directory", () => {
  const root = "/tmp/pi-chart";
  assert.equal(
    patientRoot({ chartRoot: root, patientId: "patient_001" }),
    path.join(root, "patients", "patient_001"),
  );
  for (const patientId of ["", ".", "..", "../escape", "a/b", "a\\b"]) {
    assert.throws(
      () => patientRoot({ chartRoot: root, patientId }),
      /invalid patientId/,
      patientId,
    );
  }
});

test("assertValidPatientId accepts simple stable directory names", () => {
  assert.doesNotThrow(() => assertValidPatientId("patient_mimic_10000032"));
  assert.doesNotThrow(() => assertValidPatientId("patient-001.v3"));
});
