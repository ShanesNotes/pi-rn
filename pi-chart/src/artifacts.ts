import path from "node:path";

const ARTIFACTS_PREFIX = "artifacts/";
const WINDOWS_DRIVE_RE = /^[A-Za-z]:\//;

function normalizeSeparators(input: string): string {
  return input.replace(/\\/g, "/");
}

export function normalizeArtifactStoredPath(input: string): string {
  const candidate = normalizeSeparators(input).trim();
  if (!candidate) {
    throw new Error("artifact_ref.data.path must be a non-empty string");
  }
  if (path.posix.isAbsolute(candidate) || WINDOWS_DRIVE_RE.test(candidate)) {
    throw new Error(
      `artifact_ref.data.path '${input}' must be patient-root-relative, not absolute`,
    );
  }
  const normalized = path.posix.normalize(candidate);
  if (
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../")
  ) {
    throw new Error(
      `artifact_ref.data.path '${input}' escapes the patient artifact tree`,
    );
  }
  if (!normalized.startsWith(ARTIFACTS_PREFIX)) {
    throw new Error(
      `artifact_ref.data.path '${input}' must stay under artifacts/`,
    );
  }
  return normalized;
}

export function resolveArtifactPath(
  patientDir: string,
  storedPath: string,
): { storedPath: string; absolutePath: string } {
  const normalized = normalizeArtifactStoredPath(storedPath);
  const absolutePath = path.resolve(patientDir, normalized);
  const artifactsRoot = path.resolve(patientDir, "artifacts");
  const rel = path.relative(artifactsRoot, absolutePath);
  if (
    rel === "" ||
    rel === "." ||
    rel === ".." ||
    rel.startsWith(`..${path.sep}`) ||
    path.isAbsolute(rel)
  ) {
    throw new Error(
      `artifact_ref.data.path '${storedPath}' escapes the patient artifact tree`,
    );
  }
  return { storedPath: normalized, absolutePath };
}
