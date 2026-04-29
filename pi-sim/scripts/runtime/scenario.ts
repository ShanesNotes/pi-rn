import { readFileSync } from "node:fs";
import type { ScriptedScenario } from "./scriptedProvider.js";
import { parseScenarioJson, validateScriptedScenario } from "./scenarioValidation.js";

export function loadScriptedScenario(path: string): ScriptedScenario {
  return validateScriptedScenario(parseScenarioJson(readFileSync(path, "utf8"), path), path);
}
