// AJV setup: 2020-12 draft + format checking via ajv-formats.
//
// Validators are cached by schema $id so multiple charts pointing at the
// same schema text share a single compiled validator. AJV refuses to
// register two schemas under the same $id, so we must consult the cache
// before compiling.

import Ajv2020 from "ajv/dist/2020.js";
import type { ValidateFunction, ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ReportEntry } from "./types.js";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const cache = new Map<string, ValidateFunction>();

export async function loadValidator(
  chartRoot: string,
  schemaName: string,
): Promise<ValidateFunction> {
  const filePath = path.join(chartRoot, "schemas", schemaName);
  const text = await fs.readFile(filePath, "utf8");
  const schema = JSON.parse(text);

  const id: string | undefined = schema.$id;
  const cacheKey = id ?? filePath;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // AJV stores by $id internally; if a prior compile already registered it,
  // reuse instead of throwing on duplicate registration.
  if (id) {
    const existing = ajv.getSchema(id);
    if (existing) {
      cache.set(cacheKey, existing);
      return existing;
    }
  }

  const fn = ajv.compile(schema);
  cache.set(cacheKey, fn);
  return fn;
}

/** AJV errors → ReportEntry list scoped to `where`. */
export function ajvErrorsTo(
  where: string,
  errs: ErrorObject[] | null | undefined,
): ReportEntry[] {
  if (!errs) return [];
  return errs.map((e) => ({
    where,
    message: `${e.instancePath || "(root)"}: ${e.message ?? "validation error"}`,
  }));
}
