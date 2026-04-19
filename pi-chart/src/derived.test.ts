import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import { rebuildDerived } from "./derived.js";
import { patientRoot } from "./types.js";
import type { PatientScope } from "./types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

async function copyFixture(): Promise<PatientScope> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-derived-"));
  await fs.cp(REPO_ROOT, dir, {
    recursive: true,
    filter: (src) => !/node_modules|_derived\/.+\.md/.test(src),
  });
  return { chartRoot: dir, patientId: "patient_001" };
}

test("rebuild is deterministic against unchanged content", async () => {
  const scope = await copyFixture();
  await rebuildDerived(scope);
  const derivedPath = path.join(patientRoot(scope), "_derived/current.md");
  const before = await fs.readFile(derivedPath, "utf8");
  // Sleep one ms to ensure wall clock advances; deterministic version must
  // not include any wall-clock timestamp.
  await new Promise((r) => setTimeout(r, 5));
  await rebuildDerived(scope);
  const after = await fs.readFile(derivedPath, "utf8");
  assert.equal(before, after);
});

test("current.md 'as of' uses chart timestamp, not wall clock", async () => {
  const scope = await copyFixture();
  await rebuildDerived(scope);
  const text = await fs.readFile(
    path.join(patientRoot(scope), "_derived/current.md"),
    "utf8",
  );
  assert(text.includes("as of latest chart event: 2026-04-18T08:45"));
});

test("latest-vitals.md orders clinically (heart_rate before bp_systolic before spo2)", async () => {
  const scope = await copyFixture();
  await rebuildDerived(scope);
  const text = await fs.readFile(
    path.join(patientRoot(scope), "_derived/latest-vitals.md"),
    "utf8",
  );
  const hr = text.indexOf("heart_rate");
  const sys = text.indexOf("bp_systolic");
  const spo2 = text.indexOf("spo2");
  assert(hr > -1 && sys > -1 && spo2 > -1);
  assert(hr < sys, "heart_rate should appear before bp_systolic");
  assert(sys < spo2, "bp_systolic should appear before spo2");
});

test("active-constraints.md does not double the # Constraints heading", async () => {
  const scope = await copyFixture();
  await rebuildDerived(scope);
  const text = await fs.readFile(
    path.join(patientRoot(scope), "_derived/active-constraints.md"),
    "utf8",
  );
  // Top H1 is "Active constraints" — body should not contain another `# Constraints`.
  const h1Count = text.split("\n").filter((l) => l.startsWith("# ")).length;
  assert.equal(h1Count, 1);
});
