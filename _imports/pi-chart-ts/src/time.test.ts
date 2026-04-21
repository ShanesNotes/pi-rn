import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import os from "node:os";
import {
  SimClock,
  WallClock,
  chartClock,
  latestEffectiveAt,
} from "./time.js";

const FIXTURE = path.resolve(import.meta.dirname, "..");

test("latestEffectiveAt returns max across events + vitals", async () => {
  const t = await latestEffectiveAt(FIXTURE);
  assert(t);
  assert.equal(
    t!.toISOString(),
    new Date("2026-04-18T08:45:00-05:00").toISOString(),
  );
});

test("SimClock.now matches latestEffectiveAt", async () => {
  const sim = new SimClock(FIXTURE);
  const t = await sim.now();
  const ref = await latestEffectiveAt(FIXTURE);
  assert.equal(t.toISOString(), ref!.toISOString());
});

test("WallClock.now is recent", async () => {
  const t = await new WallClock().now();
  assert(Math.abs(t.getTime() - Date.now()) < 1000);
});

test("chartClock selects SimClock by default and WallClock when configured", async () => {
  const sim = await chartClock(FIXTURE);
  assert(sim instanceof SimClock);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pi-chart-clock-"));
  await fs.writeFile(
    path.join(dir, "chart.yaml"),
    "subject: patient_001\nclock: wall_time\n",
  );
  const wall = await chartClock(dir);
  assert(wall instanceof WallClock);
});
