#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const [, , input = "docs/prototypes/pi-chart-agent-canvas.html", output = "/tmp/pi-chart-prototype.png", ...args] = process.argv;
const width = num("--width", 1480), height = num("--height", 1200), wait = str("--wait");
const target = toUrl(input), out = path.resolve(output); rmSync(out, { force: true });
let browser;
try {
  const { chromium } = require("playwright");
  browser = await chromium.launch({ headless: true, chromiumSandbox: false, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const events = { console: [], pageErrors: [], requestFailures: [], httpErrors: [] };
  page.on("console", m => { if (["error", "warning"].includes(m.type())) events.console.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", e => events.pageErrors.push(String(e.stack ?? e.message ?? e)));
  page.on("requestfailed", r => events.requestFailures.push(`${r.url()} ${r.failure()?.errorText ?? "failed"}`));
  page.on("response", r => { if (r.status() >= 400) events.httpErrors.push(`${r.status()} ${r.url()}`); });
  await page.goto(target, { waitUntil: "networkidle" });
  if (wait) await page.locator(wait).first().waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: out, fullPage: true });
  console.log(JSON.stringify({ title: await page.title(), url: page.url(), viewport: { width, height }, events }, null, 2));
  console.log(`wrote ${out}`);
} catch (error) {
  const chrome = findChrome();
  if (!chrome) { console.error(error instanceof Error ? error.stack : String(error)); process.exitCode = 1; }
  else {
    const r = spawnSync(chrome, ["--headless=new", "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", `--screenshot=${out}`, `--window-size=${width},${height}`, target], { encoding: "utf8" });
    if (r.status === 0 && existsSync(out)) console.log(`wrote ${out}`); else { console.error(r.stderr || r.stdout || `chromium exited ${r.status}`); process.exitCode = 1; }
  }
} finally { if (browser) await browser.close().catch(() => undefined); }
function num(name, fallback) { const i = args.indexOf(name); const v = i >= 0 ? Number(args[i + 1]) : NaN; return Number.isFinite(v) ? v : fallback; }
function str(name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }
function toUrl(value) { if (/^https?:\/\//i.test(value) || /^file:\/\//i.test(value)) return value; const [f, h = ""] = value.split("#"); const p = path.resolve(f); if (!existsSync(p)) throw new Error(`missing input: ${value}`); return pathToFileURL(p).href + (h ? `#${h}` : ""); }
function findChrome(){ const base="/home/ark/.cache/ms-playwright"; if(!existsSync(base)) return ""; return readdirSync(base).filter(n=>n.startsWith("chromium-")).sort().reverse().map(n=>path.join(base,n,"chrome-linux64","chrome")).find(existsSync) ?? ""; }
