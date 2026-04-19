#!/usr/bin/env tsx
// Rebuild _derived/ for one or more patients.
//
// Default: walk every patient present on disk under `patients/`; per
// DESIGN §2.2 the directory listing is canonical, not pi-chart.yaml.
// Pass --patient <id> to scope.

import path from "node:path";
import { listPatientIds, rebuildDerived } from "../src/index.js";

function parseArgs(argv: string[]): { chartRoot: string; patientId?: string } {
  let chartRoot = ".";
  let patientId: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--patient") {
      patientId = argv[++i];
      continue;
    }
    if (a.startsWith("--patient=")) {
      patientId = a.slice("--patient=".length);
      continue;
    }
    if (!a.startsWith("-")) chartRoot = a;
  }
  return { chartRoot: path.resolve(chartRoot), patientId };
}

const { chartRoot, patientId } = parseArgs(process.argv.slice(2));

let patientIds: string[];
if (patientId) {
  patientIds = [patientId];
} else {
  patientIds = await listPatientIds(chartRoot);
}

for (const pid of patientIds) {
  await rebuildDerived({ chartRoot, patientId: pid });
  console.log(`rebuilt _derived/ for ${pid} in ${chartRoot}`);
}
