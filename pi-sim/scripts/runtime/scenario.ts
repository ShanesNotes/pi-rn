import { readFileSync } from "node:fs";
import type { ScriptedScenario } from "./scriptedProvider.js";

export function loadScriptedScenario(path: string): ScriptedScenario {
  const parsed = JSON.parse(readFileSync(path, "utf8")) as ScriptedScenario;
  if (parsed.provider !== "scripted") {
    throw new Error(`scenario ${path} is not a scripted M1 scenario`);
  }
  return parsed;
}
