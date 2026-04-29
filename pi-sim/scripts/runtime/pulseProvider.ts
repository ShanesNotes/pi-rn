import { ProviderUnavailableError, type PhysiologyProvider, type ProviderAction, type ProviderMetadata, type ProviderSnapshot, type VitalScalars } from "./provider.js";
import type { RawVitals } from "../client.js";

export interface PulseTransport {
  init(stateFile: string, logFile?: string): Promise<RawVitals>;
  advance(dtSeconds: number): Promise<RawVitals>;
  action(type: string, params: Record<string, unknown>): Promise<{ ok: boolean; t: number; type: string }>;
}

export interface PulseProviderOptions {
  readonly stateFile: string;
  readonly logFile?: string;
  readonly transport: PulseTransport;
}

const VITAL_KEYS = [
  "hr",
  "map",
  "bp_sys",
  "bp_dia",
  "rr",
  "spo2",
  "temp_c",
  "cardiac_output_lpm",
  "stroke_volume_ml",
  "etco2_mmHg",
  "pao2_mmHg",
  "paco2_mmHg",
  "urine_ml_hr",
  "ph",
  "lactate_mmol_l",
  "hgb_g_dl",
] as const satisfies readonly (keyof VitalScalars)[];

export class PulseProvider implements PhysiologyProvider {
  readonly metadata: ProviderMetadata = {
    name: "Pulse physiology shim provider",
    source: "pi-sim-pulse",
    fidelity: "physiology-provider",
  };

  private readonly stateFile: string;
  private readonly logFile?: string;
  private readonly transport: PulseTransport;
  private last?: ProviderSnapshot;
  private providerEvents: string[] = [];

  constructor(options: PulseProviderOptions) {
    this.stateFile = options.stateFile;
    this.logFile = options.logFile;
    this.transport = options.transport;
  }

  async init(): Promise<ProviderSnapshot> {
    this.providerEvents = [];
    const raw = await this.callShim(() => this.transport.init(this.stateFile, this.logFile), "init");
    this.last = snapshotFromRaw(raw, this.providerEvents);
    return this.last;
  }

  async advance(dtSeconds: number): Promise<ProviderSnapshot> {
    const raw = await this.callShim(() => this.transport.advance(dtSeconds), "advance");
    this.last = snapshotFromRaw(raw, this.providerEvents);
    return this.last;
  }

  async applyAction(action: ProviderAction): Promise<ProviderSnapshot> {
    await this.callShim(() => this.transport.action(action.type, action.params ?? {}), `action ${action.type}`);
    this.providerEvents = [...this.providerEvents, `ACTION_${action.type.toUpperCase()}`];
    return this.snapshot();
  }

  snapshot(): ProviderSnapshot {
    if (!this.last) throw new ProviderUnavailableError("Pulse provider has no initialized snapshot");
    return { ...this.last, events: [...this.providerEvents] };
  }

  waveformWindow(): undefined {
    return undefined;
  }

  private async callShim<T>(operation: () => Promise<T>, label: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ProviderUnavailableError(`Pulse shim ${label} failed: ${message}`, error);
    }
  }
}

export function snapshotFromRaw(raw: RawVitals, events: readonly string[] = []): ProviderSnapshot {
  const vitals: VitalScalars = {};
  for (const key of VITAL_KEYS) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value)) vitals[key] = value;
  }
  return {
    t: typeof raw.t === "number" && Number.isFinite(raw.t) ? raw.t : 0,
    vitals,
    events: [...events],
  };
}
