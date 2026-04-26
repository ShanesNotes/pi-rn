#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);

if (args.length < 1 || args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node .pi/skills/playwright-visual-inspection/scripts/capture.mjs <url-or-file> [output.png] [options]\n\nOptions:\n  --width <px>        viewport width (default 1440)\n  --height <px>       viewport height (default 1000)\n  --wait <selector>   wait for a selector before capture\n  --delay <ms>        wait extra time before capture\n  --clip x,y,w,h      screenshot only a region\n  --no-full-page      capture viewport only\n`);
  process.exit(0);
}

const target = args[0];
const output = args[1] && !args[1].startsWith("--") ? args[1] : "/tmp/playwright-visual-inspection.png";
const optionStart = output === args[1] ? 2 : 1;
const options = args.slice(optionStart);

const width = numberOption(options, "--width", 1440);
const height = numberOption(options, "--height", 1000);
const waitSelector = stringOption(options, "--wait");
const delay = numberOption(options, "--delay", 0);
const fullPage = !options.includes("--no-full-page");
const clip = clipOption(options, "--clip");
const url = toUrl(target);
const outputPath = path.resolve(output);

const events = { console: [], pageErrors: [], requestFailures: [], httpErrors: [] };
let browser;

try {
  const { chromium } = require("playwright");
  browser = await chromium.launch({
    headless: true,
    chromiumSandbox: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });

  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      events.console.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (error) => events.pageErrors.push(String(error.stack || error.message || error)));
  page.on("requestfailed", (request) => {
    events.requestFailures.push({ url: request.url(), failure: request.failure()?.errorText ?? "unknown" });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) events.httpErrors.push({ status: response.status(), url: response.url() });
  });

  await page.goto(url, { waitUntil: "networkidle" });
  if (waitSelector) await page.locator(waitSelector).first().waitFor({ state: "visible", timeout: 10000 });
  if (delay > 0) await page.waitForTimeout(delay);

  await page.screenshot({ path: outputPath, fullPage, ...(clip ? { clip } : {}) });

  const meta = {
    ok: true,
    screenshot: outputPath,
    url: page.url(),
    title: await page.title(),
    viewport: { width, height },
    fullPage,
    clip,
    events,
  };
  console.log(JSON.stringify(meta, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, screenshot: outputPath, error: String(error.stack || error.message || error), events }, null, 2));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => undefined);
}

function toUrl(value) {
  if (/^https?:\/\//i.test(value) || /^file:\/\//i.test(value)) return value;
  const resolved = path.resolve(value);
  if (!existsSync(resolved)) throw new Error(`Target is not a URL and does not exist: ${value}`);
  return pathToFileURL(resolved).href;
}

function numberOption(values, name, fallback) {
  const index = values.indexOf(name);
  if (index < 0) return fallback;
  const value = Number(values[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}

function stringOption(values, name) {
  const index = values.indexOf(name);
  return index >= 0 ? values[index + 1] : undefined;
}

function clipOption(values, name) {
  const raw = stringOption(values, name);
  if (!raw) return undefined;
  const [x, y, width, height] = raw.split(",").map(Number);
  if (![x, y, width, height].every(Number.isFinite)) throw new Error(`Invalid --clip value: ${raw}`);
  return { x, y, width, height };
}
