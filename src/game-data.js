const asset = (name) => `./assets/${name}.webp`;

export const assets = {
  poster: asset("poster_key_visual"),
  cabinet: asset("bg_00_cabinet"),
  spring: asset("bg_01_spring_mountain"),
  pharmacy: asset("bg_02_pharmacy"),
  processing: asset("bg_03_processing"),
  clinic: asset("bg_04_clinic"),
  modern: asset("bg_05_modern"),
  apprentice: asset("hero_apprentice_turnaround"),
  master: asset("hero_master_idle"),
  walks: [1, 2, 3].map((i) => asset(`hero_apprentice_walk_0${i}`)),
  basket: asset("herb_basket"),
  furnace: asset("medicine_furnace"),
  mortar: asset("medicine_pot"),
  drawer: asset("cabinet_drawer"),
  patients: [asset("patient_01"), asset("patient_02")],
};

export const herbs = [
  {
    id: "01",
    name: "黄芪",
    latin: "Astragalus membranaceus",
    qi: "温",
    flavor: "甘",
    effect: "补气固表",
    note: "根入药。辨识时先看羽状复叶与淡黄色蝶形花，再看根材纤维与菊花心纹理。",
  },
  {
    id: "02",
    name: "黄连",
    latin: "Coptis chinensis",
    qi: "寒",
    flavor: "苦",
    effect: "清热燥湿",
    note: "根茎入药。叶片掌状分裂，根茎多分枝、形似鸡爪，断面呈鲜明金黄色。",
  },
  {
    id: "03",
    name: "薄荷",
    latin: "Mentha canadensis",
    qi: "凉",
    flavor: "辛",
    effect: "疏散风热",
    note: "茎叶入药。茎方形、叶对生且边缘有锯齿，揉触后具有清凉芳香。",
  },
  {
    id: "04",
    name: "甘草",
    latin: "Glycyrrhiza uralensis",
    qi: "平",
    flavor: "甘",
    effect: "调和诸药",
    note: "根及根茎入药。羽状复叶与紫色蝶形花可辨，切片断面淡黄并有放射纹。",
  },
  {
    id: "05",
    name: "当归",
    latin: "Angelica sinensis",
    qi: "温",
    flavor: "辛甘",
    effect: "补血活血",
    note: "根入药。复伞形花序与多回羽状分裂叶明显，干根油润且香气浓郁。",
  },
  {
    id: "06",
    name: "金银花",
    latin: "Lonicera japonica",
    qi: "寒",
    flavor: "甘",
    effect: "清热解毒",
    note: "花蕾入药。藤本、叶对生，花初白后黄；干材以细长未开放花蕾为主。",
  },
].map((herb) => ({
  ...herb,
  fresh: asset(`herb_${herb.id}`),
  dried: asset(`herb_${herb.id}_dried`),
}));

export const formulas = [
  {
    title: "补气基础方化裁",
    emperor: "黄芪",
    questions: [
      { role: "臣药", correct: "甘草", options: ["甘草", "黄连", "薄荷"] },
      { role: "佐使", correct: "甘草", options: ["甘草", "金银花"] },
    ],
  },
  {
    title: "清热方化裁",
    emperor: "金银花",
    questions: [
      { role: "臣药", correct: "黄连", options: ["黄连", "当归"] },
      { role: "佐使", correct: "薄荷", options: ["薄荷", "黄芪"] },
    ],
  },
  {
    title: "气血双补方化裁",
    emperor: "当归",
    questions: [
      { role: "臣药", correct: "黄芪", options: ["黄芪", "金银花"] },
      { role: "佐使", correct: "甘草", options: ["甘草", "黄连"] },
    ],
  },
];

export const processingTasks = [
  { herb: "甘草", correct: "蜜炙", options: ["蜜炙", "麸炒", "煅烧", "蒸晒"], note: "蜜炙是以炼蜜拌炒的炮制方式。本体验只展示传统知识，不提供用药建议。" },
  { herb: "黄芪", correct: "麸炒", options: ["麸炒", "蜜炙", "煅烧", "蒸晒"], note: "方案采用麸炒作为知识演示项，具体内容须由中医药顾问复核。" },
  { herb: "当归", correct: "酒蒸", options: ["酒蒸", "蜜炙", "麸炒", "煅烧"], note: "炮制会改变药材形态与应用侧重，不能据此自行诊疗。" },
  { herb: "黄连", correct: "姜炙", options: ["姜炙", "麸炒", "煅烧", "蒸晒"], note: "同一味本草经不同炮制后，性状和应用会发生变化。" },
];

export const cases = [
  {
    label: "脉案一",
    copy: "面色潮红，口干舌燥，喜冷饮，小便短赤。请选择八纲辨证中的知识方向。",
    correct: "实热",
    options: ["实热", "虚寒", "表证", "阴证"],
    response: "从寒热与虚实两个维度看，这组描述指向实热。此处仅作辨证思维演示，不构成诊断。",
  },
  {
    label: "脉案二",
    copy: "畏寒肢冷，面色苍白，神疲乏力，喜热饮。请选择八纲辨证中的知识方向。",
    correct: "虚寒",
    options: ["虚寒", "实热", "里热", "阳证"],
    response: "这组描述在方案中指向虚寒。辨证必须结合完整信息，本体验不提供医疗建议。",
  },
];

export const sceneOrder = ["intro", "cabinet", "spring", "pharmacy", "processing", "clinic", "echo", "record"];

export function createInitialState() {
  return {
    scene: "intro",
    accuracy: 0,
    harmony: 0,
    bond: 50,
    herbIndex: 0,
    formulaIndex: 0,
    formulaStep: 0,
    processIndex: 0,
    caseIndex: 0,
    mistakes: 0,
    muted: false,
    reduced: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    completedHerbs: [],
    discoveredCards: [],
  };
}

export function buildRecord(state) {
  const hardest = herbs[Math.min(state.mistakes, herbs.length - 1)]?.name ?? "黄芪";
  return [
    `你辨识了 ${state.completedHerbs.length} 株本草。最难忘的是${hardest}：辨药先辨形，再辨四气五味。`,
    `你完成了三组配伍与四次炮制判断，开始理解“君臣佐使”并不是药材多少，而是各尽其性。`,
    `师徒之间留下的不是分数，而是一套谨慎观察、整体判断、反复求证的方法。`,
  ];
}
