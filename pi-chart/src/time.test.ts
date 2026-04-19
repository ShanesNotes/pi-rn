import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import {
  __setTimeNowForTests,
  chartWriteTimeZone,
  SimClock,
  WallClock,
  chartClock,
  formatIsoSecondsInTimeZone,
  latestEffectiveAt,
  nowIsoForChart,
} from "./time.js";

const FIXTURE_PATIENT_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "patients",
  "patient_001",
);

test.afterEach(() => {
  __setTimeNowForTests(null);
});

test("latestEffectiveAt returns max across events + vitals", async () => {
  const t = await latestEffectiveAt(FIXTURE_PATIENT_ROOT);
  assert(t);
  assert.equal(
    t!.toISOString(),
    new Date("2026-04-18T08:45:00-05:00").toISOString(),
  );
});

test("SimClock.now matches latestEffectiveAt", async () => {
  const sim = new SimClock(FIXTURE_PATIENT_ROOT);
  const t = await sim.now();
  const ref = await latestEffectiveAt(FIXTURE_PATIENT_ROOT);
  assert.equal(t.toISOString(), ref!.toISOString());
});

test("WallClock.now is recent", async () => {
  const t = await new WallClock().now();
  assert(Math.abs(t.getTime() - Date.now()) < 1000);
});

test("chartClock selects SimClock by default and WallClock when configured", async () => {
  const sim = await chartClock(FIXTURE_PATIENT_ROOT);
  assert(sim instanceof SimClock);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-clock-"));
  await fs.writeFile(
    path.join(dir, "chart.yaml"),
    "subject: patient_001\nclock: wall_time\n",
  );
  const wall = await chartClock(dir);
  assert(wall instanceof WallClock);
});

test("formatIsoSecondsInTimeZone renders stable wall-clock ISO strings", () => {
  const fixed = new Date("2026-04-19T04:30:45.000Z");
  assert.equal(
    formatIsoSecondsInTimeZone(fixed, "America/Chicago"),
    "2026-04-18T23:30:45-05:00",
  );
  assert.equal(
    formatIsoSecondsInTimeZone(fixed, "UTC"),
    "2026-04-19T04:30:45+00:00",
  );
});

test("nowIsoForChart uses chart timezone and falls back to UTC", async () => {
  __setTimeNowForTests(() => new Date("2026-04-19T04:30:45.000Z"));
  assert.equal(await chartWriteTimeZone(FIXTURE_PATIENT_ROOT), "America/Chicago");
  assert.equal(
    await nowIsoForChart(FIXTURE_PATIENT_ROOT),
    "2026-04-18T23:30:45-05:00",
  );

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-timezone-"));
  await fs.writeFile(path.join(dir, "chart.yaml"), "subject: patient_001\nclock: sim_time\n");
  assert.equal(await chartWriteTimeZone(dir), "UTC");
  assert.equal(await nowIsoForChart(dir), "2026-04-19T04:30:45+00:00");
});
