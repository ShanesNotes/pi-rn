import { assertPositiveFinite } from "./clock.js";
import type {
  PhysiologyProvider,
  ProviderAction,
  ProviderMetadata,
  ProviderSnapshot,
  ProviderWaveformWindow,
  VitalScalars,
  WaveformWindow,
} from "./provider.js";

const ECG_RATE_HZ = 125;
const PLETH_RATE_HZ = 50;
const ABP_RATE_HZ = 50;
const RESP_RATE_HZ = 25;
const WINDOW_SECONDS = 0.5;

export interface DemoWaveformProviderOptions {
  readonly duration_s?: number;
}

export class DemoWaveformProvider implements PhysiologyProvider {
  readonly metadata: ProviderMetadata = {
    name: "deterministic demo ECG + pleth waveform provider",
    source: "pi-sim-demo-waveform",
    fidelity: "scripted-demo",
  };

  private readonly duration_s: number;
  private t = 0;
  private actionEvents: string[] = [];

  constructor(options: DemoWaveformProviderOptions = {}) {
    const duration = options.duration_s ?? 300;
    if (!Number.isFinite(duration) || duration < 0) {
      throw new Error(`invalid demo waveform duration: ${duration}`);
    }
    this.duration_s = duration;
  }

  init(): ProviderSnapshot {
    this.t = 0;
    this.actionEvents = [];
    return this.snapshot();
  }

  advance(dtSeconds: number): ProviderSnapshot {
    assertPositiveFinite(dtSeconds, "dtSeconds");
    this.t = Math.min(this.duration_s, this.t + dtSeconds);
    return this.snapshot();
  }

  applyAction(action: ProviderAction): ProviderSnapshot {
    this.actionEvents = [...this.actionEvents, `ACTION_${action.type.toUpperCase()}`];
    return this.snapshot();
  }

  snapshot(): ProviderSnapshot {
    return {
      t: round(this.t, 3),
      phase: "live-demo-baseline",
      vitals: demoVitalsAt(this.t),
      events: [...this.actionEvents],
    };
  }

  waveformWindow(): ProviderWaveformWindow {
    const vitals = demoVitalsAt(this.t);
    return {
      sourceKind: "demo",
      fidelity: "demo",
      synthetic: true,
      windows: {
        ECG_LeadII: buildWindow(this.t, ECG_RATE_HZ, "mV", (sampleTime) => {
          const sampleVitals = demoVitalsAt(sampleTime);
          return ecgLeadIi(sampleTime, sampleVitals.hr ?? vitals.hr ?? 78);
        }),
        ArterialPressure: buildWindow(this.t, ABP_RATE_HZ, "mmHg", (sampleTime) => {
          const sampleVitals = demoVitalsAt(sampleTime);
          return arterialPressure(sampleTime, sampleVitals.hr ?? vitals.hr ?? 78, sampleVitals.bp_sys ?? vitals.bp_sys ?? 118, sampleVitals.bp_dia ?? vitals.bp_dia ?? 70);
        }),
        Pleth: buildWindow(this.t, PLETH_RATE_HZ, "unitless", (sampleTime) => {
          const sampleVitals = demoVitalsAt(sampleTime);
          return pleth(sampleTime, sampleVitals.hr ?? vitals.hr ?? 78, sampleVitals.spo2 ?? vitals.spo2 ?? 97);
        }),
        Respiration: buildWindow(this.t, RESP_RATE_HZ, "unitless", (sampleTime) => {
          const sampleVitals = demoVitalsAt(sampleTime);
          return respirationWaveform(sampleTime, sampleVitals.rr ?? vitals.rr ?? 16);
        }),
      },
    };
  }
}

export function demoVitalsAt(t: number): VitalScalars {
  const breathing = Math.sin((2 * Math.PI * t) / 7.5);
  const slow = Math.sin((2 * Math.PI * t) / 45);
  const verySlow = Math.sin((2 * Math.PI * t) / 90);
  const hr = 78 + 4 * slow + 1.5 * Math.sin((2 * Math.PI * t) / 13);
  const rr = 16 + 1.2 * breathing + 0.5 * verySlow;
  const spo2 = 97.4 + 0.35 * slow - 0.2 * breathing;
  const sys = 118 + 5 * verySlow + 2 * breathing;
  const dia = 70 + 3 * verySlow + breathing;
  const map = dia + (sys - dia) / 3;
  return {
    hr: round(hr, 1),
    map: round(map, 1),
    bp_sys: round(sys, 1),
    bp_dia: round(dia, 1),
    rr: round(rr, 1),
    spo2: round(spo2, 1),
    temp_c: round(37.0 + 0.08 * verySlow, 2),
    etco2_mmHg: round(38 + 1.2 * breathing, 1),
  };
}

function buildWindow(t: number, sampleRate_Hz: number, unit: string, sample: (sampleTime: number) => number): WaveformWindow {
  const latestIndex = Math.max(0, Math.floor(t * sampleRate_Hz + 1e-9));
  const earliestTime = Math.max(0, t - WINDOW_SECONDS);
  const earliestIndex = Math.max(0, Math.ceil(earliestTime * sampleRate_Hz - 1e-9));
  const count = Math.max(1, latestIndex - earliestIndex + 1);
  const values = Array.from({ length: count }, (_, idx) => {
    const sampleIndex = earliestIndex + idx;
    return round(sample(sampleIndex / sampleRate_Hz), 4);
  });
  return { unit, sampleRate_Hz, t0_s: round(earliestIndex / sampleRate_Hz, 6), values };
}

function ecgLeadIi(t: number, hr: number): number {
  const period = cardiacPeriod(t, hr);
  const phase = positiveModulo(t, period) / period;
  const wander = 0.035 * Math.sin(2 * Math.PI * t / 5.2) + 0.012 * Math.sin(2 * Math.PI * t / 2.1);
  const electrodeNoise = 0.006 * deterministicNoise(t * 44.1) + 0.004 * Math.sin(2 * Math.PI * t * 33);
  const motion = motionArtifact(t);
  return (
    wander +
    motion +
    electrodeNoise +
    gaussian(phase, 0.165, 0.030, 0.10) +
    gaussian(phase, 0.285, 0.010, -0.16) +
    gaussian(phase, 0.305, 0.008, 1.15) +
    gaussian(phase, 0.326, 0.011, -0.34) +
    gaussian(phase, 0.555, 0.070, 0.32)
  );
}

function arterialPressure(t: number, hr: number, systolicMmHg: number, diastolicMmHg: number): number {
  const period = cardiacPeriod(t, hr);
  const phase = positiveModulo(t, period) / period;
  const pulsePressure = Math.max(18, systolicMmHg - diastolicMmHg);
  const respiratorySwing = 1.8 * Math.sin((2 * Math.PI * t) / 7.5);
  let pressure: number;
  if (phase < 0.11) {
    pressure = diastolicMmHg + pulsePressure * smoothstep(phase / 0.11);
  } else if (phase < 0.22) {
    pressure = systolicMmHg - pulsePressure * 0.18 * ((phase - 0.11) / 0.11);
  } else {
    pressure = diastolicMmHg + pulsePressure * 0.78 * Math.exp(-(phase - 0.22) / 0.34);
  }
  const notch = -0.11 * pulsePressure * gaussian(phase, 0.34, 0.018, 1);
  const rebound = 0.055 * pulsePressure * gaussian(phase, 0.39, 0.030, 1);
  const lineNoise = 0.35 * Math.sin(2 * Math.PI * t * 6.2) + 0.18 * deterministicNoise(t * 18.7);
  return pressure + notch + rebound + respiratorySwing + lineNoise;
}

function pleth(t: number, hr: number, spo2Percent: number): number {
  const period = cardiacPeriod(t - 0.22, hr);
  const phase = positiveModulo(t - 0.22, period) / period;
  const upstroke = phase < 0.18 ? smoothstep(phase / 0.18) : Math.exp(-(phase - 0.18) / 0.34);
  const notch = -0.08 * gaussian(phase, 0.46, 0.032, 1);
  const reflected = 0.08 * gaussian(phase, 0.56, 0.065, 1);
  const respiratoryEnvelope = 0.82 + 0.11 * Math.sin((2 * Math.PI * t) / 7.5 + 0.45);
  const saturationScale = clamp(spo2Percent / 98, 0.72, 1.06);
  const noise = 0.006 * deterministicNoise(t * 31.3) + 0.006 * Math.sin(2 * Math.PI * t * 8.5);
  return clamp(0.10 + respiratoryEnvelope * saturationScale * (0.78 * upstroke + notch + reflected) + noise, 0.02, 1.05);
}

function respirationWaveform(t: number, rr: number): number {
  const period = 60 / Math.max(4, rr);
  const phase = positiveModulo(t, period) / period;
  const inspiration = phase < 0.42 ? smoothstep(phase / 0.42) : 1 - smoothstep((phase - 0.42) / 0.58);
  const baselineWander = 0.08 * Math.sin((2 * Math.PI * t) / 18);
  const impedanceNoise = 0.015 * deterministicNoise(t * 12.7) + 0.01 * Math.sin(2 * Math.PI * t * 2.2);
  return clamp(-0.85 + 1.7 * inspiration + baselineWander + impedanceNoise, -1.05, 1.05);
}

function cardiacPeriod(t: number, hr: number): number {
  const sinusArrhythmia = 2.1 * Math.sin((2 * Math.PI * t) / 7.5);
  const slowDrift = 0.9 * Math.sin((2 * Math.PI * t) / 31);
  return 60 / clamp(hr + sinusArrhythmia + slowDrift, 35, 150);
}

function motionArtifact(t: number): number {
  const burst = Math.max(0, Math.sin((2 * Math.PI * (t - 18)) / 37));
  return 0.018 * burst * Math.sin(2 * Math.PI * t * 3.1);
}

function deterministicNoise(x: number): number {
  const raw = Math.sin(x * 12.9898 + 78.233) * 43758.5453;
  return 2 * (raw - Math.floor(raw)) - 1;
}

function smoothstep(x: number): number {
  const clamped = clamp(x, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function gaussian(x: number, mean: number, sigma: number, amplitude: number): number {
  return amplitude * Math.exp(-0.5 * Math.pow((x - mean) / sigma, 2));
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function round(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}
