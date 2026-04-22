// Thin HTTP client for the Pulse shim running in Docker.
// Boundary: this module is the ONLY place in the TS harness that knows about
// the Pulse sidecar. Everything else works with VitalFrame records.

const SHIM = process.env.PULSE_SHIM ?? "http://localhost:8765";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${SHIM}${path}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type RawVitals = Record<string, number> & { t: number };

export const shim = {
  init(stateFile: string, logFile?: string): Promise<RawVitals> {
    return req<RawVitals>("POST", "/init", { state_file: stateFile, log_file: logFile });
  },
  advance(dtSeconds: number): Promise<RawVitals> {
    return req<RawVitals>("POST", "/advance", { dt_seconds: dtSeconds });
  },
  action(type: string, params: Record<string, unknown>): Promise<{ ok: boolean; t: number; type: string }> {
    return req("POST", "/action", { type, params });
  },
  vitals(): Promise<RawVitals> {
    return req<RawVitals>("GET", "/vitals");
  },
  health(): Promise<{ engine_ready: boolean; t_sim: number; scenario: string; requests: string[] }> {
    return req("GET", "/health");
  },
  stateSave(path: string): Promise<{ ok: boolean; path: string }> {
    return req("POST", "/state/save", { path });
  },
};

export async function waitForShim(timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      await shim.health();
      return;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`pulse shim not reachable at ${SHIM} within ${timeoutMs}ms: ${lastErr}`);
}
