#!/usr/bin/env tsx
// Validate one or more patients in a pi-chart repo.
//
// Default: walk every patient present on disk under `patients/`; per
// DESIGN §2.2 the directory listing is canonical, not pi-chart.yaml.
// Exits non-zero on any error. Pass --patient <id> to scope.

import path from "node:path";
import { listPatientIds, validateChart } from "../src/index.js";
import type { ValidationReport } from "../src/index.js";

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

function printReport(label: string, report: ValidationReport): void {
  for (const w of report.warnings) console.log(`WARN   ${label} ${w.where}: ${w.message}`);
  for (const e of report.errors) console.log(`ERROR  ${label} ${e.where}: ${e.message}`);
}

const { chartRoot, patientId } = parseArgs(process.argv.slice(2));
console.log(`validating ${chartRoot}${patientId ? ` (patient ${patientId})` : ""}`);

let patientIds: string[];
if (patientId) {
  patientIds = [patientId];
} else {
  patientIds = await listPatientIds(chartRoot);
  if (patientIds.length === 0) {
    console.log("no patients on disk under patients/");
    process.exit(0);
  }
}

let totalErrors = 0;
let totalWarnings = 0;
for (const pid of patientIds) {
  const report = await validateChart({ chartRoot, patientId: pid });
  printReport(`[${pid}]`, report);
  totalErrors += report.errors.length;
  totalWarnings += report.warnings.length;
}
console.log();
console.log(
  `${totalErrors} error(s), ${totalWarnings} warning(s) across ${patientIds.length} patient(s)`,
);
process.exit(totalErrors === 0 ? 0 : 1);
