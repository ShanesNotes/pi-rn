import type { RunState } from "./provider.js";

export interface SimClockSnapshot {
  readonly simTime_s: number;
  readonly sequence: number;
  readonly runState: RunState;
}

export class SimClock {
  private simTime: number;
  private seq: number;
  private state: RunState;

  constructor(startTime_s = 0) {
    if (!Number.isFinite(startTime_s) || startTime_s < 0) {
      throw new Error(`invalid start time: ${startTime_s}`);
    }
    this.simTime = startTime_s;
    this.seq = 0;
    this.state = "running";
  }

  snapshot(): SimClockSnapshot {
    return { simTime_s: this.simTime, sequence: this.seq, runState: this.state };
  }

  advance(dtSeconds: number): SimClockSnapshot {
    if (this.state === "ended") return this.snapshot();
    assertPositiveFinite(dtSeconds, "dtSeconds");
    this.simTime += dtSeconds;
    this.seq += 1;
    return this.snapshot();
  }

  markEnded(): SimClockSnapshot {
    if (this.state !== "ended") {
      this.state = "ended";
      this.seq += 1;
    }
    return this.snapshot();
  }
}

export function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number, got ${value}`);
  }
}
