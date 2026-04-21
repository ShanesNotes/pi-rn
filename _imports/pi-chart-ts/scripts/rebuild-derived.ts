#!/usr/bin/env tsx
import path from "node:path";
import { rebuildDerived } from "../src/index.js";

const root = path.resolve(process.argv[2] ?? ".");
await rebuildDerived(root);
console.log(`rebuilt _derived/ in ${root}`);
