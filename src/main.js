import { gsap } from "gsap";
import {
  Accessibility,
  ArrowRight,
  BookOpen,
  Check,
  Hand,
  Leaf,
  RotateCcw,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  createIcons,
} from "lucide";
import { AudioManager } from "./audio-manager.js";
import {
  assets,
  buildRecord,
  cases,
  createInitialState,
  formulas,
  herbs,
  processingTasks,
  sceneOrder,
} from "./game-data.js";
import "./style.css";

const SAVE_KEY = "herbal-life-qihuang-v1";
const iconSet = {
  Accessibility,
  ArrowRight,
  BookOpen,
  Check,
  Hand,
  Leaf,
  RotateCcw,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
};
const app = document.querySelector("#app");
const audio = new AudioManager();
const clamp = gsap.utils.clamp(0, 100);
let state = createInitialState();
let sceneController = null;
let sceneCleanup = [];
let toastTimeline = null;
let preloadReady = false;

const chapterNames = {
  intro: "引",
  cabinet: "序",
  spring: "春",
  pharmacy: "夏",
  processing: "秋",
  clinic: "冬",
  echo: "今",
  record: "档",
};

app.innerHTML = `
  <main class="game-shell" id="game" aria-label="本草浮生岐黄问道沉浸式互动作品">
    <header class="utility-bar" aria-label="体验状态与设置">
      <div class="chapter-track" aria-label="章节进度"></div>
      <div class="utility-actions">
        <button class="icon-btn" id="soundBtn" type="button" title="切换声音" aria-label="切换声音"><i data-lucide="volume-2"></i></button>
        <button class="icon-btn" id="settingsBtn" type="button" title="体验设置" aria-label="打开体验设置"><i data-lucide="settings-2"></i></button>
      </div>
    </header>
    <div class="scene-host" id="sceneHost"></div>
    <aside class="settings-panel" id="settingsPanel" hidden aria-label="体验设置">
      <div class="settings-head"><h2>体验设置</h2><button class="icon-btn" id="closeSettings" type="button" aria-label="关闭设置"><i data-lucide="x"></i></button></div>
      <label><span><strong>静音</strong><small>所有关键信息仍以文字呈现</small></span><input id="muteToggle" type="checkbox" /></label>
      <label><span><strong>低动态模式</strong><small>减少移动、缩放与循环动效</small></span><input id="motionToggle" type="checkbox" /></label>
      <button class="settings-command" id="restartBtn" type="button"><i data-lucide="rotate-ccw"></i><span>重新开始体验</span></button>
    </aside>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <div class="hidden-accessible" id="liveRegion" aria-live="polite"></div>
  </main>
`;

const game = document.querySelector("#game");
const sceneHost = document.querySelector("#sceneHost");
const settingsPanel = document.querySelector("#settingsPanel");
const toast = document.querySelector("#toast");
const liveRegion = document.querySelector("#liveRegion");
const soundBtn = document.querySelector("#soundBtn");

function hydrateIcons() {
  createIcons({ icons: iconSet });
}

function listen(target, event, handler, options = {}) {
  target?.addEventListener(event, handler, { ...options, signal: sceneController?.signal });
}

function addCleanup(fn) {
  sceneCleanup.push(fn);
}

function cleanupScene() {
  sceneController?.abort();
  sceneController = new AbortController();
  sceneCleanup.forEach((fn) => fn());
  sceneCleanup = [];
  gsap.killTweensOf(sceneHost.querySelectorAll("*"));
}

function duration(value) {
  return state.reduced ? 0 : value;
}

function announce(message) {
  liveRegion.textContent = "";
  window.requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

function notify(message, tone = "neutral") {
  toastTimeline?.kill();
  toast.textContent = message;
  toast.dataset.tone = tone;
  toastTimeline = gsap.timeline({ defaults: { overwrite: "auto" } })
    .fromTo(toast, { y: -10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: duration(0.22), ease: "power2.out" })
    .to(toast, { y: -6, autoAlpha: 0, duration: duration(0.25), ease: "power1.in" }, "+=2.2");
  announce(message);
}

function saveState() {
  const safe = { ...state };
  localStorage.setItem(SAVE_KEY, JSON.stringify(safe));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || !sceneOrder.includes(saved.scene)) return null;
    return { ...createInitialState(), ...saved };
  } catch {
    return null;
  }
}

function setScene(name, setup, markup) {
  cleanupScene();
  state.scene = name;
  if (name !== "intro") saveState();
  updateChrome();
  sceneHost.innerHTML = markup;
  hydrateIcons(sceneHost);
  const scene = sceneHost.firstElementChild;
  gsap.fromTo(
    scene,
    { autoAlpha: 0, scale: state.reduced ? 1 : 1.015 },
    { autoAlpha: 1, scale: 1, duration: duration(0.65), ease: "power2.out", clearProps: "transform" },
  );
  setup?.(scene);
}

function updateChrome() {
  const index = sceneOrder.indexOf(state.scene);
  const track = document.querySelector(".chapter-track");
  track.innerHTML = sceneOrder.map((scene, i) => `<span class="${i <= index ? "passed" : ""} ${i === index ? "current" : ""}" title="${chapterNames[scene]}">${chapterNames[scene]}</span>`).join("");
  soundBtn.innerHTML = `<i data-lucide="${state.muted ? "volume-x" : "volume-2"}"></i>`;
  soundBtn.setAttribute("aria-label", state.muted ? "开启声音" : "静音");
  game.classList.toggle("reduced-motion", state.reduced);
  hydrateIcons(document.querySelector(".utility-bar"));
}

function imageMarkup(src, alt, className = "", id = "") {
  return `<img ${id ? `id="${id}"` : ""} class="${className}" src="${src}" alt="${alt}" draggable="false" />`;
}

function sceneHeader(kicker, title, copy = "") {
  return `<div class="narrative"><p class="kicker">${kicker}</p><h1>${title}</h1>${copy ? `<p>${copy}</p>` : ""}</div>`;
}

function primaryButton(id, label) {
  return `<button class="primary-btn" id="${id}" type="button"><span>${label}</span><i data-lucide="arrow-right"></i></button>`;
}

function bindHold(button, onComplete) {
  let timer = null;
  let frame = null;
  let started = 0;
  let active = false;
  let completed = false;
  const cancel = () => {
    active = false;
    window.clearTimeout(timer);
    window.cancelAnimationFrame(frame);
    button.style.setProperty("--hold", "0deg");
  };
  const tick = () => {
    if (!active) return;
    button.style.setProperty("--hold", `${Math.min(360, (performance.now() - started) * 0.3)}deg`);
    frame = window.requestAnimationFrame(tick);
  };
  const begin = (event) => {
    if (button.disabled || active || completed || (event.type === "pointerdown" && event.button !== 0)) return;
    event.preventDefault();
    void audio.unlock();
    active = true;
    started = performance.now();
    timer = window.setTimeout(() => {
      if (!active || document.hidden) return;
      completed = true;
      cancel();
      onComplete();
    }, 1200);
    if (!state.reduced) frame = window.requestAnimationFrame(tick);
  };
  listen(button, "pointerdown", begin);
  for (const event of ["pointerup", "pointercancel", "pointerleave"]) listen(button, event, cancel);
  listen(button, "keydown", (event) => {
    if (event.key === " " || event.key === "Enter") begin(event);
  });
  listen(button, "keyup", (event) => {
    if (event.key === " " || event.key === "Enter") cancel();
  });
  listen(button, "click", (event) => event.preventDefault());
  listen(window, "blur", cancel);
  listen(document, "visibilitychange", () => { if (document.hidden) cancel(); });
  addCleanup(cancel);
}

function renderIntro() {
  const saved = loadState();
  setScene("intro", () => {
    const startBtn = document.querySelector("#startBtn");
    const resumeBtn = document.querySelector("#resumeBtn");
    startBtn.disabled = !preloadReady;
    startBtn.querySelector("span").textContent = preloadReady ? "启卷入山" : "本草装帧中";
    resumeBtn.hidden = !saved || saved.scene === "intro";
    listen(startBtn, "click", async () => {
      if (!preloadReady) return;
      startBtn.disabled = true;
      await audio.unlock();
      state = createInitialState();
      state.muted = document.querySelector("#muteToggle").checked;
      audio.setMuted(state.muted);
      audio.tone(420, 0.2, "sine");
      renderCabinet();
    });
    listen(resumeBtn, "click", async () => {
      await audio.unlock();
      state = saved;
      audio.setMuted(state.muted);
      routeScene(state.scene);
    });
    const introTimeline = gsap.timeline({ defaults: { ease: "power2.out" } });
    introTimeline
      .from(".archive-code", { y: 18, autoAlpha: 0, duration: duration(0.55) })
      .from(".intro-copy > *", { y: 16, autoAlpha: 0, stagger: duration(0.08), duration: duration(0.5) }, "-=0.2")
      .from(".intro-actions", { y: 16, autoAlpha: 0, duration: duration(0.5) }, "-=0.3");
    addCleanup(() => introTimeline.kill());
  }, `
    <section class="scene intro-scene" data-testid="intro-scene" aria-labelledby="gameTitle">
      ${imageMarkup(assets.poster, "学徒在山野中辨识本草", "scene-bg intro-bg")}
      <div class="scene-shade"></div>
      <p class="archive-code">移动端沉浸式本草文化互动体验</p>
      <div class="intro-copy">
        <h1 id="gameTitle">本草浮生<br /><span>岐黄问道</span></h1>
        <p class="intro-lead">随师入山辨草木，于四时药香中体会配伍、炮制与辨证。</p>
        <p class="intro-note">单次体验约 8–12 分钟 · 建议开启声音</p>
      </div>
      <div class="intro-actions">
        <button class="primary-btn" id="startBtn" type="button" disabled><span>本草装帧中</span><i data-lucide="leaf"></i></button>
        <button class="text-btn" id="resumeBtn" type="button" hidden>继续上次体验</button>
      </div>
    </section>
  `);
}

function renderCabinet() {
  setScene("cabinet", () => {
    const canvas = document.querySelector("#dustCanvas");
    const drawer = document.querySelector("#holdDrawer");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const erased = new Set();
    const grid = 18;
    let drawing = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "rgba(96, 87, 70, .82)";
      context.fillRect(0, 0, rect.width, rect.height);
      context.fillStyle = "rgba(225, 213, 184, .14)";
      for (let i = 0; i < 900; i += 1) {
        context.fillRect(Math.random() * rect.width, Math.random() * rect.height, 1.2, 1.2);
      }
    };
    resize();
    window.addEventListener("resize", resize, { signal: sceneController.signal });

    const erase = (event) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      context.globalCompositeOperation = "destination-out";
      context.beginPath();
      context.arc(x, y, Math.max(28, rect.width * 0.085), 0, Math.PI * 2);
      context.fill();
      const gx = Math.floor((x / rect.width) * grid);
      const gy = Math.floor((y / rect.height) * grid);
      for (let oy = -1; oy <= 1; oy += 1) for (let ox = -1; ox <= 1; ox += 1) erased.add(`${gx + ox}:${gy + oy}`);
      const ratio = erased.size / (grid * grid);
      document.querySelector("#scratchProgress").style.width = `${Math.min(100, ratio * 220)}%`;
      if (ratio >= 0.45 && drawer.hidden) {
        drawer.hidden = false;
        document.querySelector(".cabinet-title").classList.add("revealed");
        notify("药屉已显，请按住启卷", "success");
        audio.success();
        gsap.from(drawer, { y: 16, autoAlpha: 0, duration: duration(0.45), ease: "power2.out" });
      }
    };
    listen(canvas, "pointerdown", (event) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      erase(event);
    });
    listen(canvas, "pointermove", erase);
    listen(canvas, "pointerup", () => { drawing = false; });
    listen(canvas, "pointercancel", () => { drawing = false; });

    bindHold(drawer, () => {
      audio.success();
      state.bond = clamp(state.bond + 2);
      renderSpring();
    });
  }, `
    <section class="scene cabinet-scene" data-testid="cabinet-scene" aria-label="序章 药香启卷">
      ${imageMarkup(assets.cabinet, "济世堂老药柜", "scene-bg")}
      <div class="scene-shade cabinet-shade"></div>
      ${sceneHeader("序章 · 药香启卷", "擦去药柜上的岁月", "指尖拂尘，先从一只旧药屉认识本草。")}
      <div class="scratch-frame">
        ${imageMarkup(assets.drawer, "装有本草标本的药屉", "drawer-detail")}
        <canvas id="dustCanvas" aria-label="在画面上擦去药柜灰尘"></canvas>
        <div class="scratch-meter"><span id="scratchProgress"></span></div>
      </div>
      <div class="cabinet-title"><small>药香传几世</small><strong>本草浮生 · 岐黄问道</strong></div>
      <button class="hold-entry" id="holdDrawer" type="button" hidden><span class="hold-ring"></span><span>按住</span></button>
      <p class="task-hint"><i data-lucide="hand"></i> 擦开约一半灰尘</p>
    </section>
  `);
}

function renderSpring() {
  const herb = herbs[state.herbIndex] ?? null;
  if (!herb) {
    renderSpringComplete();
    return;
  }
  setScene("spring", () => {
    const herbButton = document.querySelector("#fieldHerb");
    const walk = document.querySelector("#walkingApprentice");
    let frame = 0;
    const walkTimer = window.setInterval(() => {
      if (state.reduced) return;
      frame = (frame + 1) % assets.walks.length;
      walk.src = assets.walks[frame];
    }, 190);
    addCleanup(() => window.clearInterval(walkTimer));
    gsap.to(herbButton, { y: -7, duration: duration(1.4), repeat: state.reduced ? 0 : -1, yoyo: true, ease: "sine.inOut" });
    listen(herbButton, "click", () => openHerbStudy(herb));
  }, `
    <section class="scene spring-scene" data-testid="spring-scene" aria-label="第一章 春山采药">
      ${imageMarkup(assets.spring, "春日青岩山药谷", "scene-bg spring-bg")}
      <div class="scene-shade spring-shade"></div>
      ${sceneHeader("第一章 · 春山采药", `循香辨草 · ${state.herbIndex + 1}/6`, "点击发光本草，再擦拭辨认鲜株与药材状态。")}
      ${imageMarkup(assets.master, "师父在山路旁指点本草", "master spring-master")}
      ${imageMarkup(assets.walks[0], "学徒走入药谷", "apprentice-walk", "walkingApprentice")}
      <button class="field-herb herb-pos-${state.herbIndex + 1}" id="fieldHerb" type="button" aria-label="采摘${herb.name}">
        ${imageMarkup(herb.fresh, herb.name)}<span>${herb.name}</span>
      </button>
      <div class="basket-progress">${imageMarkup(assets.basket, "药篓")}<span>${state.completedHerbs.length}/6</span></div>
      <p class="task-hint"><i data-lucide="sparkles"></i> 点击发光的${herb.name}</p>
    </section>
  `);
}

function openHerbStudy(herb) {
  const scene = sceneHost.firstElementChild;
  const sheet = document.createElement("aside");
  sheet.className = "study-sheet";
  sheet.setAttribute("aria-label", `${herb.name}辨识卡`);
  sheet.innerHTML = `
    <p class="sheet-label">本草辨识 · ${state.herbIndex + 1}/6</p>
    <h2>${herb.name}<small>${herb.latin}</small></h2>
    <div class="herb-compare" id="herbCompare">
      ${imageMarkup(herb.dried, `${herb.name}干材`, "dried")}
      <div class="fresh-layer">${imageMarkup(herb.fresh, `${herb.name}鲜株`, "fresh")}</div>
      <span class="compare-line"></span>
    </div>
    <label class="wipe-control"><span>鲜株</span><input id="wipeRange" type="range" min="0" max="100" value="100" aria-label="擦拭辨识鲜株与干材" /><span>干材</span></label>
    <p class="herb-note">${herb.note}</p>
    <div class="property-picks">
      <fieldset><legend>四气</legend>${["寒", "热", "温", "凉", "平"].map((value) => `<button type="button" data-kind="qi" data-value="${value}">${value}</button>`).join("")}</fieldset>
      <fieldset><legend>五味</legend>${["辛", "甘", "酸", "苦", "咸", "辛甘"].map((value) => `<button type="button" data-kind="flavor" data-value="${value}">${value}</button>`).join("")}</fieldset>
    </div>
    <button class="primary-btn compact" id="confirmHerb" type="button" disabled><span>确认辨识</span><i data-lucide="check"></i></button>
  `;
  scene.append(sheet);
  hydrateIcons(sheet);
  gsap.from(sheet, { yPercent: 12, autoAlpha: 0, duration: duration(0.45), ease: "power2.out" });
  const selected = { qi: null, flavor: null };
  const range = sheet.querySelector("#wipeRange");
  const freshLayer = sheet.querySelector(".fresh-layer");
  listen(range, "input", () => {
    const value = Number(range.value);
    freshLayer.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
    sheet.querySelector(".compare-line").style.left = `${value}%`;
  });
  sheet.querySelectorAll("[data-kind]").forEach((button) => {
    listen(button, "click", () => {
      const kind = button.dataset.kind;
      selected[kind] = button.dataset.value;
      sheet.querySelectorAll(`[data-kind="${kind}"]`).forEach((item) => item.classList.toggle("selected", item === button));
      sheet.querySelector("#confirmHerb").disabled = !selected.qi || !selected.flavor;
    });
  });
  listen(sheet.querySelector("#confirmHerb"), "click", () => {
    const correct = selected.qi === herb.qi && selected.flavor === herb.flavor;
    sheet.querySelector("#confirmHerb").disabled = true;
    if (correct) {
      state.accuracy = clamp(state.accuracy + 16);
      state.bond = clamp(state.bond + 2);
      audio.success();
    } else {
      state.mistakes += 1;
      audio.softError();
    }
    const overlay = document.createElement("div");
    overlay.className = "herb-review-overlay";
    overlay.innerHTML = `<div class="herb-review" role="dialog" aria-modal="true" aria-labelledby="reviewTitle" aria-describedby="reviewBody">
      <h2 id="reviewTitle">再记一遍</h2>
      <p id="reviewBody">${herb.name}为${herb.qi}性，${herb.flavor}味。${correct ? "辨药先辨性。" : "记住这味本草，再继续采药。"}</p>
      <button class="primary-btn" id="continueHerb" type="button"><span>${state.herbIndex === herbs.length - 1 ? "查看春章小结" : "继续采药"}</span><i data-lucide="arrow-right"></i></button>
    </div>`;
    scene.append(overlay);
    hydrateIcons(overlay);
    sheet.inert = true;
    overlay.querySelector("#continueHerb").focus();
    listen(overlay.querySelector("#continueHerb"), "click", () => {
      if (!state.completedHerbs.includes(herb.id)) state.completedHerbs.push(herb.id);
      state.discoveredCards.push(herb.name);
      state.herbIndex += 1;
      saveState();
      renderSpring();
    });
  });
}

function renderSpringComplete() {
  setScene("spring", () => {
    listen(document.querySelector("#toPharmacy"), "click", renderPharmacy);
  }, `
    <section class="scene spring-scene chapter-complete" aria-label="春山采药完成">
      ${imageMarkup(assets.spring, "春日青岩山药谷", "scene-bg spring-bg")}
      <div class="scene-shade"></div>
      ${imageMarkup(assets.master, "师父", "master complete-master")}
      <div class="chapter-dialogue">
        <p class="kicker">师父</p><blockquote>“辨药先辨性，四气五味，是本草之纲。”</blockquote>
        <p>六株本草已入篓。什么时候采什么，老天有安排。</p>
        ${primaryButton("toPharmacy", "入济世堂")}
      </div>
    </section>
  `);
}

function renderPharmacy() {
  const formula = formulas[state.formulaIndex] ?? null;
  if (!formula) {
    renderPharmacyComplete();
    return;
  }
  const question = formula.questions[state.formulaStep];
  const ingredientHerb = (name) => herbs.find((item) => item.name === name);
  setScene("pharmacy", () => {
    const furnace = document.querySelector("#dropFurnace");
    document.querySelectorAll(".ingredient-card").forEach((card) => makeIngredientDraggable(card, furnace, (name) => checkFormulaChoice(name, question)));
  }, `
    <section class="scene pharmacy-scene" data-testid="pharmacy-scene" aria-label="第二章 夏日配伍">
      ${imageMarkup(assets.pharmacy, "夏日济世堂药房", "scene-bg")}
      <div class="scene-shade pharmacy-shade"></div>
      ${sceneHeader("第二章 · 夏日配伍", formula.title, `君药为${formula.emperor}。请选择${question.role}并拖入药炉。`)}
      <div class="formula-strip"><span>君</span><strong>${formula.emperor}</strong><i></i><span>${question.role.slice(0, 1)}</span><strong>待定</strong></div>
      <div class="ingredient-rack">
        ${question.options.map((name) => {
          const herb = ingredientHerb(name);
          return `<button class="ingredient-card" type="button" data-name="${name}" aria-label="将${name}放入药炉">${imageMarkup(herb.dried, `${name}干材`)}<span>${name}</span></button>`;
        }).join("")}
      </div>
      <div class="furnace-zone" id="dropFurnace">${imageMarkup(assets.furnace, "药炉")}<span>拖入${question.role}</span></div>
      <div class="round-progress">配伍 ${state.formulaIndex + 1}/3 · ${state.formulaStep + 1}/2</div>
    </section>
  `);
}

function makeIngredientDraggable(card, target, choose) {
  let startX = 0;
  let startY = 0;
  let moved = false;
  const xTo = gsap.quickTo(card, "x", { duration: duration(0.18), ease: "power2.out" });
  const yTo = gsap.quickTo(card, "y", { duration: duration(0.18), ease: "power2.out" });
  const reset = () => gsap.to(card, { x: 0, y: 0, scale: 1, duration: duration(0.3), ease: "power2.out" });
  listen(card, "pointerdown", (event) => {
    startX = event.clientX;
    startY = event.clientY;
    moved = false;
    card.setPointerCapture(event.pointerId);
    gsap.to(card, { scale: 1.06, duration: duration(0.16) });
  });
  listen(card, "pointermove", (event) => {
    if (!card.hasPointerCapture(event.pointerId)) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    moved ||= Math.abs(dx) + Math.abs(dy) > 8;
    xTo(dx);
    yTo(dy);
  });
  listen(card, "pointerup", (event) => {
    const a = card.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const hit = a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    if (hit || !moved) choose(card.dataset.name);
    reset();
  });
  listen(card, "pointercancel", reset);
}

function checkFormulaChoice(name, question) {
  if (name !== question.correct) {
    state.mistakes += 1;
    audio.softError();
    notify(`${name}在这里不作${question.role}。再看它的药性与方中职责。`, "gentle");
    gsap.fromTo("#dropFurnace", { x: -5 }, { x: 5, repeat: 3, yoyo: true, duration: duration(0.07), clearProps: "transform" });
    return;
  }
  audio.success();
  state.harmony = clamp(state.harmony + 17);
  state.bond = clamp(state.bond + 2);
  notify(`${name}入炉，${question.role}位置相合。`, "success");
  gsap.timeline({ onComplete: () => {
    state.formulaStep += 1;
    if (state.formulaStep >= formulas[state.formulaIndex].questions.length) {
      state.formulaStep = 0;
      state.formulaIndex += 1;
    }
    saveState();
    renderPharmacy();
  } })
    .to("#dropFurnace", { scale: 1.08, filter: "drop-shadow(0 0 24px rgba(227,175,88,.9))", duration: duration(0.32), ease: "power2.out" })
    .to("#dropFurnace", { scale: 1, duration: duration(0.28), ease: "power1.inOut" });
}

function renderPharmacyComplete() {
  setScene("pharmacy", () => listen(document.querySelector("#toProcessing"), "click", renderProcessing), `
    <section class="scene pharmacy-scene chapter-complete" aria-label="夏日配伍完成">
      ${imageMarkup(assets.pharmacy, "济世堂药房", "scene-bg")}
      <div class="scene-shade"></div>
      ${imageMarkup(assets.master, "师父", "master complete-master")}
      <div class="chapter-dialogue"><p class="kicker">师父</p><blockquote>“配伍之道，不在药多，在各尽其性。”</blockquote><p>三炉药香渐稳，君臣佐使各安其位。</p>${primaryButton("toProcessing", "往炮制房")}</div>
    </section>
  `);
}

function renderProcessing() {
  const task = processingTasks[state.processIndex] ?? null;
  if (!task) {
    renderProcessingComplete();
    return;
  }
  setScene("processing", () => {
    document.querySelectorAll(".method-btn").forEach((button) => listen(button, "click", () => checkProcessing(button, task)));
  }, `
    <section class="scene processing-scene" data-testid="processing-scene" aria-label="第三章 秋深炮制">
      ${imageMarkup(assets.processing, "秋日炮制房", "scene-bg")}
      <div class="scene-shade processing-shade"></div>
      ${sceneHeader("第三章 · 秋深炮制", `${task.herb} · 炮制 ${state.processIndex + 1}/4`, "选择方案中的炮制方式，观察本草性状变化。")}
      <div class="processing-bench">
        ${imageMarkup(assets.mortar, "药臼与杵", "mortar", "mortar")}
        ${imageMarkup(assets.furnace, "药炉", "small-furnace")}
      </div>
      <div class="method-grid">${task.options.map((method) => `<button class="method-btn" type="button" data-method="${method}">${method}</button>`).join("")}</div>
      <p class="compliance-note">知识演示，不提供用药或诊疗建议</p>
    </section>
  `);
}

function checkProcessing(button, task) {
  const correct = button.dataset.method === task.correct;
  document.querySelectorAll(".method-btn").forEach((item) => { item.disabled = true; });
  if (!correct) {
    state.mistakes += 1;
    audio.softError();
    button.classList.add("not-selected");
    document.querySelector(`[data-method="${task.correct}"]`).classList.add("correct");
    notify(`这一步采用${task.correct}。${task.note}`, "gentle");
  } else {
    button.classList.add("correct");
    state.accuracy = clamp(state.accuracy + 4);
    state.bond = clamp(state.bond + 2);
    audio.success();
    notify(task.note, "success");
  }
  const timeline = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    onComplete: () => {
      state.processIndex += 1;
      saveState();
      renderProcessing();
    },
  });
  timeline
    .to(".mortar", { rotation: -7, x: -4, duration: duration(0.22) })
    .to(".mortar", { rotation: 6, x: 4, duration: duration(0.22), repeat: state.reduced ? 0 : 3, yoyo: true })
    .to(".small-furnace", { filter: "drop-shadow(0 0 25px rgba(220,140,56,.8))", scale: 1.07, duration: duration(0.35) })
    .to({}, { duration: duration(1.6) });
}

function renderProcessingComplete() {
  setScene("processing", () => listen(document.querySelector("#toClinic"), "click", renderClinic), `
    <section class="scene processing-scene chapter-complete" aria-label="秋深炮制完成">
      ${imageMarkup(assets.processing, "秋日炮制房", "scene-bg")}
      <div class="scene-shade"></div>
      ${imageMarkup(assets.master, "师父", "master complete-master")}
      <div class="chapter-dialogue"><p class="kicker">师父</p><blockquote>“炮制不同，药性亦变。手上有火，心中要有分寸。”</blockquote><p>秋光渐尽，济世堂的冬夜已经点灯。</p>${primaryButton("toClinic", "入冬夜医馆")}</div>
    </section>
  `);
}

function renderClinic() {
  const item = cases[state.caseIndex] ?? null;
  if (!item) {
    renderClinicComplete();
    return;
  }
  setScene("clinic", () => {
    document.querySelectorAll(".case-choice").forEach((button) => listen(button, "click", () => checkCase(button, item)));
  }, `
    <section class="scene clinic-scene" data-testid="clinic-scene" aria-label="第四章 冬夜辨证">
      ${imageMarkup(assets.clinic, "冬夜济世堂医馆", "scene-bg")}
      <div class="scene-shade clinic-shade"></div>
      ${sceneHeader("第四章 · 冬夜辨证", item.label, "阅读描述，选择八纲辨证中的知识方向。")}
      ${imageMarkup(assets.patients[state.caseIndex], `患者${state.caseIndex + 1}背影`, "patient")}
      <article class="case-sheet">
        <p class="case-copy">${item.copy}</p>
        <div class="case-options">${item.options.map((option) => `<button class="case-choice" type="button" data-choice="${option}">${option}</button>`).join("")}</div>
        <p class="case-disclaimer">人物为脉案为非现实案例</p>
      </article>
    </section>
  `);
}

function checkCase(button, item) {
  const correct = button.dataset.choice === item.correct;
  document.querySelectorAll(".case-choice").forEach((choice) => { choice.disabled = true; });
  if (correct) {
    button.classList.add("correct");
    state.accuracy = clamp(state.accuracy + 10);
    state.bond = clamp(state.bond + 3);
    audio.success();
  } else {
    state.mistakes += 1;
    button.classList.add("not-selected");
    document.querySelector(`[data-choice="${item.correct}"]`).classList.add("correct");
    audio.softError();
  }
  notify(item.response, correct ? "success" : "gentle");
  const caseTimer = window.setTimeout(() => {
    state.caseIndex += 1;
    saveState();
    renderClinic();
  }, state.reduced ? 100 : 2500);
  addCleanup(() => window.clearTimeout(caseTimer));
}

function renderClinicComplete() {
  setScene("clinic", () => listen(document.querySelector("#toEcho"), "click", renderEcho), `
    <section class="scene clinic-scene chapter-complete" aria-label="冬夜辨证完成">
      ${imageMarkup(assets.clinic, "冬夜医馆", "scene-bg")}
      <div class="scene-shade"></div>
      ${imageMarkup(assets.master, "师父", "master complete-master")}
      <div class="chapter-dialogue"><p class="kicker">师父</p><blockquote>“辨证论治，是中医之魂。贵在识证，不在抢答。”</blockquote><p>四时将合，旧药铺的灯火正照向今天。</p>${primaryButton("toEcho", "看今昔药铺")}</div>
    </section>
  `);
}

function renderEcho() {
  setScene("echo", () => {
    const range = document.querySelector("#eraRange");
    const historic = document.querySelector("#historicLayer");
    const continueButton = document.querySelector("#toRecord");
    listen(range, "input", () => {
      const value = Number(range.value);
      historic.style.clipPath = `inset(0 ${value}% 0 0)`;
      document.querySelector("#eraValue").textContent = value < 50 ? "清代济世堂" : "当代中药铺";
      if (value >= 72) continueButton.disabled = false;
    });
    listen(continueButton, "click", renderRecord);
  }, `
    <section class="scene echo-scene" data-testid="echo-scene" aria-label="终章 岐黄传承">
      ${imageMarkup(assets.modern, "当代中药铺", "scene-bg modern-bg")}
      <div class="historic-layer" id="historicLayer">${imageMarkup(assets.pharmacy, "清代济世堂药房", "scene-bg")}</div>
      <div class="scene-shade echo-shade"></div>
      ${sceneHeader("终章 · 岐黄传承", "草木有灵，传承有脉", "拖动滑杆，让清代药铺回到今天。")}
      <div class="era-control">
        <div><span>康熙年间</span><strong id="eraValue">清代济世堂</strong><span>当代</span></div>
        <input id="eraRange" type="range" min="0" max="100" value="0" aria-label="拖动查看清代与当代中药铺对照" />
      </div>
      <button class="primary-btn echo-next" id="toRecord" type="button" disabled><span>生成学徒体验档案</span><i data-lucide="book-open"></i></button>
    </section>
  `);
}

function renderRecord() {
  const paragraphs = buildRecord(state);
  setScene("record", () => {
    listen(document.querySelector("#recordRestart"), "click", restartExperience);
  }, `
    <section class="scene record-scene" data-testid="record-scene" aria-label="岐黄学徒体验档案">
      ${imageMarkup(assets.modern, "当代中药铺", "scene-bg record-bg")}
      <div class="scene-shade record-shade"></div>
      <article class="record-document">
        <header><span>济世堂 · 四时研习录</span></header>
        <p class="record-kicker">岐黄学徒体验档案</p>
        <h1>本草浮生<br />寸心知古今</h1>
        ${paragraphs.map((paragraph, index) => `<p class="record-entry"><span>0${index + 1}</span>${paragraph}</p>`).join("")}
        <blockquote>“愿你将这份寸心，带回今天。”</blockquote>
        <p class="source-note">本体验仅作本草文化知识演示，不构成医疗建议。</p>
        <button class="settings-command dark" id="recordRestart" type="button"><i data-lucide="rotate-ccw"></i><span>重新启卷</span></button>
      </article>
    </section>
  `);
}

function restartExperience() {
  localStorage.removeItem(SAVE_KEY);
  state = createInitialState();
  state.muted = audio.muted;
  renderIntro();
}

function routeScene(scene) {
  const routes = {
    intro: renderIntro,
    cabinet: renderCabinet,
    spring: renderSpring,
    pharmacy: renderPharmacy,
    processing: renderProcessing,
    clinic: renderClinic,
    echo: renderEcho,
    record: renderRecord,
  };
  (routes[scene] ?? renderIntro)();
}

async function preloadAssets() {
  const values = Object.values(assets).flat().concat(herbs.flatMap((herb) => [herb.fresh, herb.dried]));
  await Promise.all([...new Set(values)].map((src) => new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = src;
  })));
  preloadReady = true;
  const startBtn = document.querySelector("#startBtn");
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.querySelector("span").textContent = "启卷入山";
  }
}

soundBtn.addEventListener("click", async () => {
  await audio.unlock();
  state.muted = !state.muted;
  audio.setMuted(state.muted);
  document.querySelector("#muteToggle").checked = state.muted;
  saveState();
  updateChrome();
});

document.querySelector("#settingsBtn").addEventListener("click", () => {
  settingsPanel.hidden = false;
  document.querySelector("#muteToggle").checked = state.muted;
  document.querySelector("#motionToggle").checked = state.reduced;
  gsap.from(settingsPanel, { x: 16, autoAlpha: 0, duration: duration(0.25), ease: "power2.out" });
});
document.querySelector("#closeSettings").addEventListener("click", () => { settingsPanel.hidden = true; });
document.querySelector("#muteToggle").addEventListener("change", (event) => {
  state.muted = event.target.checked;
  audio.setMuted(state.muted);
  saveState();
  updateChrome();
});
document.querySelector("#motionToggle").addEventListener("change", (event) => {
  state.reduced = event.target.checked;
  saveState();
  settingsPanel.hidden = true;
  routeScene(state.scene);
});
document.querySelector("#restartBtn").addEventListener("click", () => {
  settingsPanel.hidden = true;
  restartExperience();
});

document.addEventListener("visibilitychange", () => {
  audio.setVisibility(document.hidden);
  if (document.hidden) gsap.globalTimeline.pause();
  else gsap.globalTimeline.resume();
});

const media = gsap.matchMedia();
media.add("(prefers-reduced-motion: reduce)", () => {
  game.classList.add("system-reduced-motion");
  return () => game.classList.remove("system-reduced-motion");
});

hydrateIcons();
updateChrome();
renderIntro();
preloadAssets();
game.addEventListener("pointerdown", () => { void audio.unlock(); }, { once: true });
game.addEventListener("keydown", () => { void audio.unlock(); }, { once: true });
