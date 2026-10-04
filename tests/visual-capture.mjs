import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = new URL("../test-results/visual/", import.meta.url);
await mkdir(output, { recursive: true });
const screenshotPath = (name) => fileURLToPath(new URL(name, output));
const browser = await chromium.launch();
const errors = [];
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const page = await context.newPage();
const holdFor = async (target) => {
  await target.hover();
  await page.mouse.down();
  await page.waitForTimeout(1250);
  await page.mouse.up();
};
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
await page.goto("http://127.0.0.1:4178/");
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.locator("#startBtn").waitFor({ state: "visible" });
await page.waitForFunction(() => !document.querySelector("#startBtn").disabled);
await page.screenshot({ path: screenshotPath("01-intro-mobile.png") });
await page.locator("#startBtn").click();
await page.screenshot({ path: screenshotPath("02-cabinet-mobile.png") });

const canvas = page.locator("#dustCanvas");
const box = await canvas.boundingBox();
for (let y = 1; y <= 7; y += 1) for (let x = 1; x <= 7; x += 1) {
  const px = box.x + (box.width * x) / 8;
  const py = box.y + (box.height * y) / 8;
  await page.mouse.move(px, py);
  await page.mouse.down();
  await page.mouse.move(px + 2, py + 2);
  await page.mouse.up();
}
await holdFor(page.locator("#holdDrawer"));
await page.screenshot({ path: screenshotPath("03-spring-mobile.png") });
await page.locator("#fieldHerb").click();
await page.screenshot({ path: screenshotPath("04-herb-study-mobile.png") });
await page.locator('[data-kind="qi"][data-value="温"]').click();
await page.locator('[data-kind="flavor"][data-value="甘"]').click();
await page.locator("#confirmHerb").click();
await page.screenshot({ path: screenshotPath("04b-herb-review-mobile.png") });

await page.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "pharmacy", accuracy: 100, harmony: 0, bond: 62, herbIndex: 6, formulaIndex: 0, formulaStep: 0, processIndex: 0, caseIndex: 0, mistakes: 0, muted: true, reduced: true, completedHerbs: ["01","02","03","04","05","06"], discoveredCards: [] })));
await page.reload();
await page.locator("#resumeBtn").click();
await page.screenshot({ path: screenshotPath("05-pharmacy-mobile.png") });

await page.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "pharmacy", accuracy: 100, harmony: 100, bond: 70, herbIndex: 6, formulaIndex: 3, formulaStep: 0, processIndex: 0, caseIndex: 0, mistakes: 0, muted: true, reduced: true, completedHerbs: ["01","02","03","04","05","06"], discoveredCards: [] })));
await page.reload();
await page.locator("#resumeBtn").click();
await page.screenshot({ path: screenshotPath("05b-pharmacy-complete-mobile.png") });

await page.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "processing", accuracy: 100, harmony: 100, bond: 70, herbIndex: 6, formulaIndex: 3, formulaStep: 0, processIndex: 0, caseIndex: 0, mistakes: 0, muted: true, reduced: true, completedHerbs: ["01","02","03","04","05","06"], discoveredCards: [] })));
await page.reload();
await page.locator("#resumeBtn").click();
await page.screenshot({ path: screenshotPath("06-processing-mobile.png") });

await page.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "processing", accuracy: 100, harmony: 100, bond: 70, herbIndex: 6, formulaIndex: 3, formulaStep: 0, processIndex: 4, caseIndex: 0, mistakes: 0, muted: true, reduced: true, completedHerbs: ["01","02","03","04","05","06"], discoveredCards: [] })));
await page.reload();
await page.locator("#resumeBtn").click();
await page.screenshot({ path: screenshotPath("06b-processing-complete-mobile.png") });

await page.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "clinic", accuracy: 100, harmony: 100, bond: 78, herbIndex: 6, formulaIndex: 3, formulaStep: 0, processIndex: 4, caseIndex: 0, mistakes: 0, muted: true, reduced: true, completedHerbs: ["01","02","03","04","05","06"], discoveredCards: [] })));
await page.reload();
await page.locator("#resumeBtn").click();
await page.screenshot({ path: screenshotPath("07-clinic-mobile.png") });

await page.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "echo", accuracy: 100, harmony: 100, bond: 84, herbIndex: 6, formulaIndex: 3, formulaStep: 0, processIndex: 4, caseIndex: 2, mistakes: 0, muted: true, reduced: true, completedHerbs: ["01","02","03","04","05","06"], discoveredCards: [] })));
await page.reload();
await page.locator("#resumeBtn").click();
await page.screenshot({ path: screenshotPath("08-echo-mobile.png") });
await page.locator("#eraRange").evaluate((input) => { input.value = "82"; input.dispatchEvent(new Event("input", { bubbles: true })); });
await page.locator("#toRecord").click();
await page.screenshot({ path: screenshotPath("09-record-mobile.png"), fullPage: true });

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await desktop.goto("http://127.0.0.1:4178/");
await desktop.waitForFunction(() => !document.querySelector("#startBtn").disabled);
await desktop.screenshot({ path: screenshotPath("10-intro-desktop.png") });
await desktop.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "processing", processIndex: 0, muted: true, reduced: true })));
await desktop.reload();
await desktop.locator("#resumeBtn").click();
await desktop.screenshot({ path: screenshotPath("11-processing-desktop.png") });
await desktop.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "pharmacy", formulaIndex: 0, formulaStep: 0, muted: true, reduced: true })));
await desktop.reload();
await desktop.locator("#resumeBtn").click();
await desktop.screenshot({ path: screenshotPath("12-pharmacy-desktop.png") });
await desktop.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "processing", processIndex: 4, muted: true, reduced: true })));
await desktop.reload();
await desktop.locator("#resumeBtn").click();
await desktop.screenshot({ path: screenshotPath("13-processing-complete-desktop.png") });
await desktop.evaluate(() => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify({ scene: "clinic", caseIndex: 0, muted: true, reduced: true })));
await desktop.reload();
await desktop.locator("#resumeBtn").click();
await desktop.screenshot({ path: screenshotPath("14-clinic-desktop.png") });
await desktop.close();
await context.close();
await browser.close();

console.log(JSON.stringify({ errors, output: fileURLToPath(output) }, null, 2));
if (errors.length) process.exitCode = 1;
