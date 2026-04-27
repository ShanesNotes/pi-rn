import { SimClock } from "./clock.js";
import { buildVitalFrame } from "./frame.js";
import { PublicTelemetryPublisher } from "./publisher.js";
import { ProviderUnavailableError, isProviderUnavailableError, type PhysiologyProvider, type ProviderAction, type ProviderSnapshot, type RunState } from "./provider.js";
import type { AlarmThresholds, VitalFrame } from "../types.js";

export interface ScheduledProviderAction {
  readonly t: number;
  readonly action: ProviderAction;
}

export interface RuntimeRunnerOptions {
  readonly provider: PhysiologyProvider;
  readonly publisher: PublicTelemetryPublisher;
  readonly thresholds: AlarmThresholds;
  readonly duration_s: number;
  readonly dt_s: number;
  readonly timeScale?: number;
  readonly actions?: readonly ScheduledProviderAction[];
  readonly now?: () => string;
  readonly onFrame?: (frame: VitalFrame) => void;
}

export interface RuntimeRunResult {
  readonly finalFrame: VitalFrame;
  readonly frames: readonly VitalFrame[];
}

export async function runProviderRuntime(options: RuntimeRunnerOptions): Promise<RuntimeRunResult> {
  validateRunOptions(options.duration_s, options.dt_s, options.timeScale ?? 0);

  const clock = new SimClock();
  const frames: VitalFrame[] = [];
  const actions = [...(options.actions ?? [])]
    .filter((entry) => Number.isFinite(entry.t) && entry.t >= 0)
    .sort((a, b) => a.t - b.t);
  let nextActionIdx = 0;
  let snapshot: ProviderSnapshot | undefined;
  const wallStart = Date.now();

  const publish = (runState: RunState, current: ProviderSnapshot): VitalFrame => {
    const frame = buildVitalFrame({
      snapshot: current,
      metadata: options.provider.metadata,
      sequence: clock.snapshot().sequence,
      runState,
      thresholds: options.thresholds,
      wallTime: options.now?.(),
    });
    options.publisher.publish(frame);
    frames.push(frame);
    options.onFrame?.(frame);
    return frame;
  };

  try {
    snapshot = await options.provider.init();
    publish("running", snapshot);

    while (clock.snapshot().simTime_s < options.duration_s) {
      while (nextActionIdx < actions.length && actions[nextActionIdx].t <= clock.snapshot().simTime_s) {
        snapshot = await options.provider.applyAction(actions[nextActionIdx].action);
        nextActionIdx += 1;
      }

      const simTime = clock.snapshot().simTime_s;
      const remaining = options.duration_s - simTime;
      const nextActionTime = actions[nextActionIdx]?.t;
      const timeToNextAction =
        nextActionTime !== undefined && nextActionTime > simTime ? nextActionTime - simTime : Number.POSITIVE_INFINITY;
      const dt = Math.min(options.dt_s, remaining, timeToNextAction);
      const tick = clock.advance(dt);
      snapshot = await options.provider.advance(dt);
      publish(tick.runState, snapshot);

      const timeScale = options.timeScale ?? 0;
      if (timeScale > 0) {
        const wallTarget = wallStart + (clock.snapshot().simTime_s * 1000) / timeScale;
        const slack = wallTarget - Date.now();
        if (slack > 0) await new Promise((resolveSleep) => setTimeout(resolveSleep, slack));
      }
    }

    while (nextActionIdx < actions.length && actions[nextActionIdx].t <= options.duration_s) {
      snapshot = await options.provider.applyAction(actions[nextActionIdx].action);
      nextActionIdx += 1;
    }

    const ended = clock.markEnded();
    const finalFrame = publish(ended.runState, snapshot);
    return { finalFrame, frames };
  } catch (error) {
    const unavailable = toUnavailable(error, options.provider.metadata.source);
    const fallbackSnapshot: ProviderSnapshot = snapshot ?? {
      t: clock.snapshot().simTime_s,
      vitals: {},
      events: ["PROVIDER_UNAVAILABLE"],
    };
    const unavailableSnapshot: ProviderSnapshot = {
      ...fallbackSnapshot,
      events: [...new Set([...fallbackSnapshot.events, "PROVIDER_UNAVAILABLE"])],
    };
    publish("unavailable", unavailableSnapshot);
    throw unavailable;
  }
}

function validateRunOptions(duration_s: number, dt_s: number, timeScale: number): void {
  if (!Number.isFinite(duration_s) || duration_s < 0) throw new Error(`duration_s must be >= 0, got ${duration_s}`);
  if (!Number.isFinite(dt_s) || dt_s <= 0) throw new Error(`dt_s must be positive, got ${dt_s}`);
  if (!Number.isFinite(timeScale) || timeScale < 0) throw new Error(`timeScale must be >= 0, got ${timeScale}`);
}

function toUnavailable(error: unknown, source: string): ProviderUnavailableError {
  if (isProviderUnavailableError(error)) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new ProviderUnavailableError(`${source} unavailable: ${message}`, error);
}
