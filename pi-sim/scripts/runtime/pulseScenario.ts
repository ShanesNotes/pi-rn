import { readFileSync } from "node:fs";
import type { Scenario } from "../types.js";
import { parseScenarioJson, validatePulseScenario } from "./scenarioValidation.js";

export interface PulseScenario extends Scenario {
  readonly provider?: "pulse";
  readonly purpose?: "stable-observation" | "compatibility-reference";
}

export function loadPulseScenario(path: string): PulseScenario {
  return validatePulseScenario(parseScenarioJson(readFileSync(path, "utf8"), path), path);
}
