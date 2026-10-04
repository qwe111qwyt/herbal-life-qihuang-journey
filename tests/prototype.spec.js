import { expect, test } from "@playwright/test";

const herbAnswers = [
  ["温", "甘"],
  ["寒", "苦"],
  ["凉", "辛"],
  ["平", "甘"],
  ["温", "辛甘"],
  ["寒", "甘"],
];

async function holdFor(page, selector, milliseconds = 1250) {
  await page.locator(selector).hover();
  await page.mouse.down();
  await page.waitForTimeout(milliseconds);
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("完整流程从启卷走到体验档案", async ({ page }) => {
  await expect(page.getByTestId("intro-scene")).toBeVisible();
  const start = page.locator("#startBtn");
  await expect(start).toBeEnabled({ timeout: 15_000 });
  await start.click();

  const canvas = page.locator("#dustCanvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  for (let y = 1; y <= 7; y += 1) {
    for (let x = 1; x <= 7; x += 1) {
      const px = box.x + (box.width * x) / 8;
      const py = box.y + (box.height * y) / 8;
      await page.mouse.move(px, py);
      await page.mouse.down();
      await page.mouse.move(px + 2, py + 2);
      await page.mouse.up();
    }
  }
  const hold = page.locator("#holdDrawer");
  await expect(hold).toBeVisible();
  await expect(hold).toHaveText("按住");
  await holdFor(page, "#holdDrawer", 250);
  await expect(page.getByTestId("cabinet-scene")).toBeVisible();
  await holdFor(page, "#holdDrawer");
  await expect(page.getByTestId("spring-scene")).toBeVisible();

  for (const [qi, flavor] of herbAnswers) {
    await page.locator("#fieldHerb").click();
    const sheet = page.locator(".study-sheet");
    await sheet.locator(`[data-kind="qi"][data-value="${qi}"]`).click();
    await sheet.locator(`[data-kind="flavor"][data-value="${flavor}"]`).click();
    await sheet.locator("#confirmHerb").click();
    await expect(page.getByRole("dialog", { name: "再记一遍" })).toBeVisible();
    await expect(page.getByRole("dialog")).toContainText(`${qi}性，${flavor}味`);
    await page.locator("#continueHerb").click();
  }
  await page.locator("#toPharmacy").click();

  for (const ingredient of ["甘草", "甘草", "黄连", "薄荷", "黄芪", "甘草"]) {
    await page.locator(`.ingredient-card[data-name="${ingredient}"]`).click();
  }
  await page.locator("#toProcessing").click();

  for (const method of ["蜜炙", "麸炒", "酒蒸", "姜炙"]) {
    await page.locator(`.method-btn[data-method="${method}"]`).click();
  }
  await page.locator("#toClinic").click();
  await page.locator('.case-choice[data-choice="实热"]').click();
  await page.waitForTimeout(150);
  await page.locator('.case-choice[data-choice="虚寒"]').click();
  await page.waitForTimeout(150);
  await page.locator("#toEcho").click();

  await page.locator("#eraRange").evaluate((input) => {
    input.value = "82";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#toRecord").click();
  await expect(page.getByTestId("record-scene")).toBeVisible();
  await expect(page.locator(".record-entry")).toHaveCount(3);
  await expect(page.locator(".record-document header")).toHaveText("济世堂 · 四时研习录");
  await expect(page.locator(".source-note")).toContainText("不构成医疗建议");
  await expect(page.getByTestId("record-scene")).not.toContainText("药性、配伍、炮制与辨证内容须由中医药顾问逐条复核");
});

test("素材、画布和 9 比 16 舞台可用", async ({ page }) => {
  await expect(page.locator("#startBtn")).toBeEnabled({ timeout: 15_000 });
  const broken = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).length);
  expect(broken).toBe(0);
  const stage = await page.locator("#game").boundingBox();
  expect(stage.width).toBeLessThanOrEqual(476);
  expect(stage.height).toBeGreaterThanOrEqual(800);
  await page.locator("#startBtn").click();
  const pixels = await page.locator("#dustCanvas").evaluate((canvas) => {
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let nonTransparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonTransparent += 1;
    return nonTransparent;
  });
  expect(pixels).toBeGreaterThan(1000);
});

test("启卷单击生效，标题位于画面上方", async ({ page }) => {
  await expect(page.locator("#startBtn")).toBeEnabled({ timeout: 15_000 });
  const introCopy = await page.locator(".intro-copy").boundingBox();
  const stage = await page.locator("#game").boundingBox();
  await expect(page.locator(".intro-copy")).toHaveCSS("text-align", "right");
  expect(introCopy.y).toBeLessThan(stage.y + stage.height / 3);
  await page.locator("#startBtn").click();
  await expect(page.getByTestId("cabinet-scene")).toBeVisible();
});

test("第二至第四章素材位置及说明", async ({ page }) => {
  const saved = (scene, extras = {}) => ({ scene, accuracy: 100, harmony: 100, bond: 70, herbIndex: 6, formulaIndex: 0, formulaStep: 0, processIndex: 0, caseIndex: 0, mistakes: 0, muted: true, reduced: true, completedHerbs: ["01", "02", "03", "04", "05", "06"], discoveredCards: [], ...extras });
  async function resume(scene, extras) {
    await page.evaluate((state) => localStorage.setItem("herbal-life-qihuang-v1", JSON.stringify(state)), saved(scene, extras));
    await page.reload();
    await page.locator("#resumeBtn").click();
  }

  await resume("spring", { herbIndex: 0 });
  await expect(page.locator(".spring-master")).toHaveCSS("filter", /brightness\(1\.22\)/);
  await resume("pharmacy");
  const furnaceTop = await page.locator(".furnace-zone").evaluate((element) => parseFloat(getComputedStyle(element).top));
  expect(furnaceTop).toBeCloseTo((await page.locator("#game").boundingBox()).height * 0.39 + 56.7, 0);
  const furnace = await page.locator(".furnace-zone").boundingBox();
  const rack = await page.locator(".ingredient-rack").boundingBox();
  expect(furnace.y).toBeLessThan(rack.y);
  await resume("processing");
  const benchTop = await page.locator(".processing-bench").evaluate((element) => parseFloat(getComputedStyle(element).top));
  expect(benchTop).toBeCloseTo((await page.locator("#game").boundingBox()).height * 0.34 + 56.7, 0);
  await resume("processing", { processIndex: 4 });
  await expect(page.locator(".processing-scene.chapter-complete .complete-master")).toHaveCSS("opacity", "1");
  expect(await page.locator(".processing-scene.chapter-complete .complete-master").evaluate((element) => getComputedStyle(element).filter)).not.toContain("brightness");
  await resume("clinic");
  await expect(page.locator(".case-disclaimer")).toHaveText("人物为脉案为非现实案例");
  const patient = await page.locator(".patient").boundingBox();
  const clinicStage = await page.locator("#game").boundingBox();
  expect(patient.x).toBeLessThan(clinicStage.x + clinicStage.width / 2);
});

test("全程循环配乐随静音和后台状态暂停与恢复", async ({ page }) => {
  await expect(page.locator("#startBtn")).toBeEnabled({ timeout: 15_000 });
  await page.locator("#startBtn").click();
  const result = await page.evaluate(async () => {
    const { AudioManager } = await import("/src/audio-manager.js");
    const manager = new AudioManager();
    const beforeUnlock = manager.music === null;
    await manager.unlock();
    await new Promise((resolve) => setTimeout(resolve, 900));
    const intro = manager.music.loop && !manager.music.paused
      && manager.music.duration > 150 && manager.music.currentTime > 0;
    const analyser = manager.context.createAnalyser();
    analyser.fftSize = 2048;
    manager.musicGain.connect(analyser);
    const signal = async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const samples = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(samples);
      return Math.max(...samples.map(Math.abs));
    };
    const audibleIntro = manager.context.state === "running" && await signal() > 0.0001;
    const position = manager.music.currentTime;
    manager.setMuted(true);
    const muted = manager.music.paused && manager.muted;
    manager.setMuted(false);
    const unmuted = !manager.music.paused && manager.music.currentTime >= position - 0.1;
    await new Promise((resolve) => setTimeout(resolve, 500));
    const continuous = manager.music.currentTime > position && await signal() > 0.0001;
    manager.setVisibility(true);
    const hidden = manager.music.paused;
    const backgroundPosition = manager.music.currentTime;
    manager.setVisibility(false);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const resumed = !manager.music.paused && manager.music.currentTime >= backgroundPosition;
    manager.stopMusic();
    await manager.context.close();
    return { beforeUnlock, intro, audibleIntro, muted, unmuted, continuous, hidden, resumed };
  });
  expect(result).toEqual({ beforeUnlock: true, intro: true, audibleIntro: true, muted: true, unmuted: true, continuous: true, hidden: true, resumed: true });
});
