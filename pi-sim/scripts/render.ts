import type { VitalFrame } from "./types.js";

const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
export const CLEAR = "\x1b[2J\x1b[H";
export const HIDE_CURSOR = "\x1b[?25l";
export const SHOW_CURSOR = "\x1b[?25h";

function fmtSecs(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function alarmed(key: string, alarms: string[]): boolean {
  const up = key.toUpperCase();
  return alarms.some((a) => a === `${up}_LOW` || a === `${up}_HIGH`);
}

function colorize(s: string, on: boolean): string {
  return on ? `${RED}${BOLD}${s}${RESET}` : s;
}

function fmt(v: number | undefined, digits = 0): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

function pad(s: string, w: number): string {
  const visible = s.replace(/\x1b\[[0-9;]*m/g, "");
  return s + " ".repeat(Math.max(0, w - visible.length));
}

export function renderFrame(frame: VitalFrame, bed: string, scenario?: string): string {
  const W = 62;
  const header = `BEDSIDE MONITOR — ${bed}${scenario ? ` — ${scenario}` : ""} `;
  const fill = "─".repeat(Math.max(0, W - 4 - header.length));
  const bar = "─".repeat(W - 2);
  const line = (c: string) => `│ ${pad(c, W - 4)} │`;

  const hr = colorize(`${fmt(frame.hr)} bpm`, alarmed("hr", frame.alarms));
  const bpSys = colorize(fmt(frame.bp_sys), alarmed("bp_sys", frame.alarms));
  const bpDia = colorize(fmt(frame.bp_dia), alarmed("bp_dia", frame.alarms));
  const map = colorize(fmt(frame.map), alarmed("map", frame.alarms));
  const rr = colorize(`${fmt(frame.rr)} /min`, alarmed("rr", frame.alarms));
  const spo2 = colorize(`${fmt(frame.spo2)} %`, alarmed("spo2", frame.alarms));
  const temp = colorize(`${fmt(frame.temp_c, 1)} °C`, alarmed("temp_c", frame.alarms));
  const co = `${fmt(frame.cardiac_output_lpm, 1)} L/min   SV ${fmt(frame.stroke_volume_ml)} mL`;
  const gas = `EtCO₂ ${fmt(frame.etco2_mmHg)}  PaO₂ ${fmt(frame.pao2_mmHg)}  PaCO₂ ${fmt(frame.paco2_mmHg)}`;
  const lactate = colorize(fmt(frame.lactate_mmol_l, 1), alarmed("lactate_mmol_l", frame.alarms));
  const lab = `Lact ${lactate} mmol/L  Hgb ${fmt(frame.hgb_g_dl, 1)}  pH ${fmt(frame.ph, 2)}  Urine ${fmt(frame.urine_ml_hr)} mL/hr`;

  const alarmStr =
    frame.alarms.length === 0
      ? `${DIM}none${RESET}`
      : `${RED}${BOLD}${frame.alarms.join(", ")}${RESET}`;

  return [
    `┌─ ${header}${fill}┐`,
    line(""),
    line(`${BOLD}HR${RESET}    ${hr}`),
    line(`${BOLD}BP${RESET}    ${bpSys}/${bpDia}   MAP ${map}`),
    line(`${BOLD}SpO₂${RESET}  ${spo2}`),
    line(`${BOLD}RR${RESET}    ${rr}`),
    line(`${BOLD}Temp${RESET}  ${temp}`),
    line(`${BOLD}CO${RESET}    ${co}`),
    line(`${BOLD}Gas${RESET}   ${gas}`),
    line(lab),
    line(""),
    line(`${DIM}t = ${fmtSecs(frame.t)}   alarms: ${RESET}${alarmStr}`),
    `└${bar}┘`,
  ].join("\n");
}

export function renderEnded(): string {
  return `\n${DIM}monitor stopped${RESET}\n`;
}
