// AJV setup: 2020-12 draft + format checking via ajv-formats.
//
// Validators are cached by schema $id so multiple charts pointing at the
// same schema text share a single compiled validator. AJV refuses to
// register two schemas under the same $id, so we must consult the cache
// before compiling.

import Ajv2020Import from "ajv/dist/2020.js";
import type { ValidateFunction, ErrorObject } from "ajv";
import addFormatsImport from "ajv-formats";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ReportEntry } from "./types.js";

const Ajv2020 = (Ajv2020Import as any).default ?? Ajv2020Import;
const addFormats = (addFormatsImport as any).default ?? addFormatsImport;

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

/**
 * js-yaml parses ISO 8601 strings into Date objects automatically. AJV
 * expects strings for `format: date-time`, so normalize nested Dates back
 * to ISO strings before validating frontmatter or write candidates.
 */
export function normalizeForSchema(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  if (Array.isArray(value)) return value.map(normalizeForSchema);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      out[key] = normalizeForSchema(inner);
    }
    return out;
  }
  return value;
}
