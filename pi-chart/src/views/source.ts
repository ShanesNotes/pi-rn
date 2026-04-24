export function formatSource(src: unknown): string {
  if (src && typeof src === "object" && !Array.isArray(src)) {
    const record = src as Record<string, unknown>;
    const ref = record.ref;
    const kind = record.kind;
    if (typeof ref === "string" && ref.length) return ref;
    if (typeof kind === "string" && kind.length) return kind;
  }
  if (typeof src === "string") return src;
  return "unknown";
}
