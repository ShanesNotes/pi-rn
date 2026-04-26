import { chromium } from "playwright";
import path from "node:path";
import { pathToFileURL } from "node:url";

const prototypePath = path.resolve("docs/prototypes/pi-chart-agent-canvas.html");
const url = pathToFileURL(prototypePath).href;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
const consoleMessages = [];
const pageErrors = [];

page.on("console", (message) => {
  if (message.type() !== "debug") {
    consoleMessages.push({ type: message.type(), text: message.text() });
  }
});
page.on("pageerror", (error) => pageErrors.push(String(error)));

const checks = [];
async function check(name, condition) {
  const ok = Boolean(await condition);
  checks.push({ name, ok });
}
function hasText(text) {
  return page.getByText(text, { exact: false }).count().then((count) => count > 0);
}

await page.goto(url);

await check("overview loads chart-first with artifact pane hidden", page.locator(".artifact-pane").isHidden());
await check("patient banner visible", hasText("Patient 002"));
await check("respiratory watcher visible", hasText("WATCHER"));
await check("worklist due loop visible", hasText("Reassess oxygen response & WoB"));

const navExpectations = [
  ["Care plan / handoff", "Handoff report"],
  ["Vitals / flowsheet", "previous-shift trend"],
  ["Meds / MAR", "Medication administration cannot be auto-charted"],
  ["Notes", "Provider assessment / plan"],
  ["Labs / dx", "Lactate 2.8 mmol/L"],
  ["Radiology / imaging", "CXR report"],
];

for (const [navLabel, expectedText] of navExpectations) {
  await page.getByText(navLabel, { exact: false }).first().click();
  await check(`nav ${navLabel} opens storyboard state`, hasText(expectedText));
}

await page.getByText("Next-shift handoff draft", { exact: false }).first().click();
await check("generated handoff draft opens editable pane", page.locator(".artifact-pane").isVisible());
await check("chartable pane exposes final clinical write", hasText("FINAL CLINICAL WRITE"));
await page.locator("#chart-artifact").click();
await check("Chart closes chartable pane", page.locator(".artifact-pane").isHidden());
await check("worklist item can reflect Charted status", page.locator("[data-artifact='handoff-draft'] .worklist-meta").first().textContent().then((text) => text?.includes("charted")));

await page.getByText("Zosyn due at 12:00", { exact: false }).first().click();
await check("blocked MAR item opens safety pane", page.locator(".artifact-pane").isVisible());
await check("blocked MAR disables Chart action", page.locator("#chart-artifact").isDisabled());
await check("blocked MAR states agent cannot chart med administration", hasText("Agent cannot Chart med admin"));

await page.locator("#close-artifact").click();
await check("blocked MAR pane closes via close button", page.locator(".artifact-pane").isHidden());

await check("agent dock prompt hidden initially", page.locator("#agent-chat").isHidden());
await page.locator("#agent-open").click();
await check("agent dock prompt opens", page.locator("#agent-chat").isVisible());
await check("agent dock toggle advertises expanded state", page.locator("#agent-open").getAttribute("aria-expanded").then((value) => value === "true"));
await check("agent shift organization state visible", hasText("Pi-agent shift organization"));
await page.locator("#agent-prompt").fill("Organize my shift and tell me what I should pay attention to.");
await page.locator("#agent-chat button[type='submit']").click();
await check("agent response remains advisory", hasText("Co-pilot advice only"));

await page.locator('[data-view="overview"]').click();
await check("return to Overview restores cockpit home base", hasText("Problem-oriented timeline"));
await check("expanded dock persists across chart navigation", page.locator("#agent-chat").isVisible());
await page.locator("#agent-open").click();
await check("agent dock can collapse explicitly", page.locator("#agent-chat").isHidden());
await check("blocked MAR remains blocked after return", page.locator("[data-artifact='zosyn-blocked'] .worklist-meta").textContent().then((text) => text?.includes("blocked")));

await check("no console or page errors", Promise.resolve(consoleMessages.length === 0 && pageErrors.length === 0));

await page.screenshot({ path: "/tmp/pi-chart-agent-canvas-e2e-smoke.png", fullPage: true });
await browser.close();

const failed = checks.filter((entry) => !entry.ok);
const result = {
  url,
  checks,
  failed,
  consoleMessages,
  pageErrors,
  screenshot: "/tmp/pi-chart-agent-canvas-e2e-smoke.png",
};

console.log(JSON.stringify(result, null, 2));
if (failed.length > 0) process.exit(1);
