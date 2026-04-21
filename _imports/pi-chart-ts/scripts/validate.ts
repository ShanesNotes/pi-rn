#!/usr/bin/env tsx
import path from "node:path";
import { validateChart } from "../src/index.js";

const root = path.resolve(process.argv[2] ?? ".");
console.log(`validating ${root}`);
const report = await validateChart(root);
for (const w of report.warnings) console.log(`WARN   ${w.where}: ${w.message}`);
for (const e of report.errors) console.log(`ERROR  ${e.where}: ${e.message}`);
console.log();
console.log(
  `${report.errors.length} error(s), ${report.warnings.length} warning(s)`,
);
process.exit(report.ok ? 0 : 1);
