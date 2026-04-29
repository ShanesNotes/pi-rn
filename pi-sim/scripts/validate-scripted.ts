import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadScriptedScenario } from "./runtime/scenario.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCENARIO_DIR = join(ROOT, "vitals", "scenarios");

const scriptedScenarioPaths = readdirSync(SCENARIO_DIR)
  .filter((name) => name.endsWith(".json"))
  .map((name) => join(SCENARIO_DIR, name))
  .filter((path) => {
    try {
      return loadScriptedScenario(path).provider === "scripted";
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/not a scripted/.test(message)) return false;
      throw error;
    }
  });

if (scriptedScenarioPaths.length === 0) throw new Error("no scripted scenarios found");
for (const path of scriptedScenarioPaths) loadScriptedScenario(path);
console.log(`scripted scenario validation passed (${scriptedScenarioPaths.length} scenarios)`);
