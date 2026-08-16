const session = {
  route: "home",
  bigScreen: false,
  transition: false,
  quiz: {
    level: "入门级",
    type: "单选",
    index: 0,
    selected: [],
    text: "",
    result: null,
    wrong: [],
    orders: {},
    optionOrders: {}
  },
  circuit: {
    mode: "series",
    zoom: 1,
    slots: {},
    slotMeta: {},
    analysis: null,
    slotTarget: "main",
    slotExtras: {},
    equivalents: [],
    nodes: [],
    wires: [],
    selectedTerminal: null,
    selectedCase: "",
    diagnosis: "电团团提示：先添加电池、开关和灯泡，再点击运行演示。",
    exported: false,
    simulatorOpen: false
  },
  course: {
    category: "全部",
    progress: { c1: 35, c2: 0, c3: 0, c4: 0 },
    active: null,
    paused: true
  },
  safetyCategory: "全部",
  experimentLevel: "全部",
  expandedExperiment: null,
  encyclopedia: {
    category: "全部",
    keyword: "",
    active: null
  }
};

let scaledPageResizeObserver = null;

const nav = [
  ["lab", "电路实验室", "⚡"],
  ["quiz", "知识问答", "💡"],
  ["courses", "电力微课", "🔌"],
  ["safety", "安全案例", "🧯"],
  ["experiments", "趣味实验", "🧪"],
  ["encyclopedia", "电气小百科", "📘"]
];

const questions = [
  {
    id: "q1",
    level: "入门级",
    type: "单选",
    knowledge: "插座安全",
    title: "发现插座冒烟时，第一步应该做什么？",
    scene: "电团团举着黄色警示牌，旁边是冒烟的插座卡通图。",
    options: ["用湿毛巾盖住插座", "立即切断电源", "继续观察几分钟", "用手拔掉所有插头"],
    answer: ["立即切断电源"],
    explain: "插座冒烟可能已经短路或过载。第一步要远离危险并切断电源，再请成年人或专业人员处理。"
  },
  {
    id: "q2",
    level: "入门级",
    type: "判断",
    knowledge: "湿手用电",
    title: "手上有水时不应该触碰开关和插座。",
    scene: "电团团拿着毛巾提醒大家先擦干双手。",
    options: ["正确", "错误"],
    answer: ["正确"],
    explain: "水会让触电风险变高，湿手触碰开关和插座很危险。"
  },
  {
    id: "q3",
    level: "进阶级",
    type: "多选",
    knowledge: "线路过载",
    title: "哪些行为容易造成家庭线路过载？",
    scene: "电团团指向连接太多电器的插排。",
    options: ["一个插排同时接多个大功率电器", "定期检查线路", "电线长期发热仍继续使用", "使用合格空气开关"],
    answer: ["一个插排同时接多个大功率电器", "电线长期发热仍继续使用"],
    explain: "过载通常来自过大的电流长时间通过线路，表现为发热、异味、跳闸等。"
  }
];

const components = ["电池", "开关", "灯泡", "LED", "小风扇", "导线", "简易电阻", "蜂鸣器", "电流表", "电压表", "保险丝", "二极管", "电容", "电机", "滑动变阻器"];

const circuitModes = [
  ["series", "串联电路", "一条主路，电流依次经过每个元件。"],
  ["parallel", "并联电路", "两条支路并排连接，支路互不抢位置。"],
  ["mixed", "串并联混合", "主路先串联，再分成两条支路。"]
];

const circuitSlotAreas = {
  series: [
    { id: "main", label: "主路", prefix: "loadExtra", max: 4 }
  ],
  parallel: [
    { id: "main", label: "主路", prefix: "mainExtra", max: 2 },
    { id: "b1", label: "上支路", prefix: "b1extra", max: 4 },
    { id: "b2", label: "下支路", prefix: "b2extra", max: 4 }
  ],
  mixed: [
    { id: "main", label: "主路", prefix: "mainExtra", max: 4 },
    { id: "b1", label: "上支路", prefix: "b1extra", max: 4 },
    { id: "b2", label: "下支路", prefix: "b2extra", max: 4 }
  ]
};

const TOPOLOGY_HEIGHT = 500;
const TOPOLOGY_SLOT_WIDTH = 126;
const TOPOLOGY_SLOT_HEIGHT = 86;
const TOPOLOGY_LEFT_PAD = 104;
const TOPOLOGY_GAP = 206;
const TOPOLOGY_BRANCH_GAP = 214;
const CUSTOM_CIRCUIT_SIMULATOR_URL = "https://mccclu0327-ship-it.github.io/circuitjs1-qd/circuitjs.html";

const circuitCases = [
  { id: "series", name: "串联小灯泡", mode: "series", desc: "电池、开关、灯泡顺序连接，观察唯一电流路径。", extras: { main: 1 }, slots: { source: "电池", control: "开关", load1: "灯泡", loadExtra1: "简易电阻" } },
  { id: "parallel", name: "并联双灯", mode: "parallel", desc: "两条支路各有灯泡，理解家庭照明思路。", slots: { source: "电池", control: "开关", b1load: "灯泡", b2load: "灯泡" } },
  { id: "fan", name: "小风扇启动", mode: "series", desc: "用开关控制小风扇，观察负载变化。", slots: { source: "电池", control: "开关", load1: "小风扇" } },
  { id: "led", name: "LED 正负极", mode: "series", desc: "学习 LED 需要串联保护电阻，接反时不会正常发光。", extras: { main: 1 }, slots: { source: "电池", control: "开关", load1: "简易电阻", loadExtra1: "LED" } },
  { id: "safe", name: "保险丝保护", mode: "series", desc: "理解保险丝在过载时保护电路。", extras: { main: 1 }, slots: { source: "电池", control: "开关", load1: "保险丝", loadExtra1: "灯泡" } },
  { id: "bell", name: "蜂鸣器提醒", mode: "series", desc: "用蜂鸣器制作简单提醒电路。", slots: { source: "电池", control: "开关", load1: "蜂鸣器" } },
  { id: "meter", name: "电流表测量", mode: "series", desc: "认识电流表串联接入的基本方法。", extras: { main: 1 }, slots: { source: "电池", control: "开关", load1: "电流表", loadExtra1: "灯泡" } },
  { id: "voltage", name: "电压表测量", mode: "parallel", desc: "认识电压表并联测量的概念。", slots: { source: "电池", control: "开关", b1load: "灯泡", b2load: "电压表" } },
  { id: "mix", name: "串并联混合", mode: "mixed", desc: "观察一条主路和两条支路的组合。", slots: { source: "电池", control: "开关", mainLoad: "简易电阻", b1load: "灯泡", b2load: "灯泡" } },
  { id: "fault", name: "短路危险演示", mode: "series", desc: "用安全示意认识导线直接连电池的风险。", slots: { source: "电池", load1: "导线" } }
];

const courses = [
  {
    id: "c1",
    category: "新型电力系统",
    title: "新型电力系统“新”在哪",
    minutes: 10,
    desc: "解读新型电力系统背后的深刻能源革命，认识清洁低碳、安全高效的电力未来。",
    points: ["能源革命", "新型电力系统", "双碳目标"],
    bvid: "BV1W3u86SE13",
    bilibiliUrl: "https://www.bilibili.com/video/BV1W3u86SE13/",
    cover: "assets/courses/course-1-cover.jpg"
  },
  {
    id: "c2",
    category: "发电方式",
    title: "【电宝】家族选秀大会",
    minutes: 14,
    desc: "介绍火电、水电、风电、光伏等多种发电方式，揭秘“多能互补”的奥秘。",
    points: ["发电方式", "多能互补", "能源协同"],
    bvid: "BV1Ngu86nEs7",
    bilibiliUrl: "https://www.bilibili.com/video/BV1Ngu86nEs7/",
    cover: "assets/courses/course-2-cover.jpg"
  }
];

const safetyCases = [
  { category: "家庭用电", title: "插排连接太多电器", scene: "客厅插排接满大功率电器。", mistake: "多个大功率电器共用一个插排。", harm: "线路可能发热、老化，严重时引发起火。", prevent: "大功率电器使用独立合格插座，发现发热或异味马上断电。" },
  { category: "校园用电", title: "教室充电线破皮", scene: "课桌旁有破损充电线。", mistake: "继续使用外皮破损的线缆。", harm: "可能漏电、短路，也可能烫伤手。", prevent: "发现破损线缆交给老师处理，不私自使用。"},
  { category: "户外雷雨", title: "雷雨天在树下躲雨", scene: "操场旁大树下有人躲雨。", mistake: "雷雨时靠近高大树木和金属杆。", harm: "雷电可能沿高处或金属物传导。", prevent: "尽快进入室内，远离树木、广告牌和积水区域。"},
  { category: "插座安全", title: "把金属物插进插座", scene: "孩子拿金属夹靠近插孔。", mistake: "用金属物触碰插座孔。", harm: "金属导电，可能造成触电。", prevent: "使用儿童防护插座，看到危险行为马上提醒成年人。"},
  { category: "电器起火", title: "电器冒烟后泼水", scene: "小电器冒烟，旁边有人端水。", mistake: "没有断电就用水处理电器火情。", harm: "水能导电，可能扩大触电危险。", prevent: "先断电，远离现场，呼叫成年人并使用合适灭火方式。"}
];

const experiments = [
  { id: "e1", level: "低年级简易实验", title: "静电吸纸屑", materials: ["塑料尺", "干布", "碎纸屑"], steps: ["用干布快速摩擦塑料尺。", "把尺子慢慢靠近碎纸屑。", "观察纸屑被吸起。"], principle: "摩擦让尺子带上静电，带电物体会吸引轻小物体。" },
  { id: "e2", level: "低年级简易实验", title: "开关控制小灯泡", materials: ["电池盒", "小灯泡", "安全导线", "简易开关"], steps: ["把电池、开关和小灯泡串联。", "闭合开关观察灯泡点亮。", "断开开关观察灯泡熄灭。"], principle: "闭合电路中电流可以流动，断开后电流停止。" },
  { id: "e3", level: "进阶手工实验", title: "水果电池点亮 LED", materials: ["柠檬", "铜片", "锌片", "导线", "低压 LED"], steps: ["把铜片和锌片插入柠檬两侧。", "用导线连接金属片和 LED。", "调整连接方向观察 LED。"], principle: "水果汁帮助形成简单化学电池，铜片和锌片之间产生微小电压。" }
];

const encyclopedia = [
  ["电气元件", "电池", "像一个小能量仓库，可以给小灯泡、风扇提供电。", "遥控器、玩具车、手电筒里常见。", "不要拆开电池，不把新旧电池混用。"],
  ["电气元件", "导线", "让电流通过的“道路”，把元件连接起来。", "实验电路和家用电器内部都有导线。", "不要触碰破皮导线。"],
  ["电气元件", "开关", "像电路的门，闭合时让电通过，断开时让电停下。", "电灯开关、玩具开关都属于它。", "湿手不要按开关。"],
  ["电气元件", "LED", "一种小灯，接对方向后会发亮，很省电。", "台灯、指示灯、彩灯中常见。", "实验时要用低压电池。"],
  ["家用电器", "台灯", "把电能变成光，帮助我们看书写字。", "书桌、床头经常使用。", "睡觉前记得关闭，灯线发热要停止使用。"],
  ["家用电器", "冰箱", "用电让内部保持低温，保存食物。", "厨房和餐厅里常见。", "不要频繁开门，不拉扯电源线。"],
  ["家用电器", "充电器", "把插座里的电变成适合设备使用的电。", "手机、平板、手表都需要充电器。", "使用合格充电器，充满后及时拔下。"],
  ["电力基础名词", "电流", "电荷在电路里流动，就像水在管道里流动。", "灯泡发光、风扇转动都需要电流。", "人体不能成为电流通路。"],
  ["电力基础名词", "电压", "推动电流前进的力量，可以把它想成水压。", "电池上标注的 1.5V、5V 就是电压。", "不要接触高电压设备。"],
  ["电力基础名词", "短路", "电流走了不该走的近路，可能变得很大。", "导线直接连接电池两端就是危险示例。", "短路会发热，实验中要及时断开。"],
  ["安全用电术语", "漏电", "电跑到了不该去的地方，可能让外壳带电。", "老旧电器、潮湿环境中要特别注意。", "发现麻手感要停止使用并告诉成年人。"],
  ["安全用电术语", "地线", "保护用电安全的一条特殊线路。", "三孔插座里的一个孔和地线有关。", "不要破坏插头或私自改线。"]
].map(([category, title, definition, life, safety], index) => ({ id: `term${index}`, category, title, definition, life, safety }));

applyExternalContent();
polishQuestionOptions();

function applyExternalContent() {
  const extra = window.QDX_CONTENT;
  if (!extra) return;
  const mode = extra.mode === "replace" ? "replace" : "append";
  mergeContent(questions, extra.questions, mode);
  mergeContent(courses, extra.courses, mode);
  mergeContent(safetyCases, extra.safetyCases, mode);
  mergeContent(experiments, extra.experiments, mode);
  mergeContent(encyclopedia, extra.encyclopedia, mode);
}

function mergeContent(target, source, mode) {
  if (!Array.isArray(source) || !source.length) return;
  if (mode === "replace") target.splice(0, target.length);
  target.push(...source);
}

const safetyImageFiles = [
  "01_overloaded_power_strip.png",
  "02_wet_hands_unplugging.png",
  "03_wire_under_heavy_object.png",
  "04_kitchen_appliance_near_sink.png",
  "05_phone_charging_under_pillow.png",
  "06_old_worn_outlet.png",
  "07_clothes_near_heater.png",
  "08_improvised_temporary_wiring.png",
  "09_child_touching_outlet.png",
  "10_appliances_on_standby.png",
  "11_damaged_charging_cable.png",
  "12_multiple_devices_one_strip.png",
  "13_outlet_near_water_dispenser.png",
  "14_improper_lab_wiring.png",
  "15_loose_computer_plug.png",
  "16_corridor_wire_tripping_hazard.png",
  "17_equipment_left_on_after_class.png",
  "18_wet_umbrella_near_power_strip.png",
  "19_stage_temporary_wiring.png",
  "20_diy_appliance_repair.png",
  "21_sheltering_under_tree.png",
  "22_near_metal_fence.png",
  "23_umbrella_in_open_area.png",
  "24_puddle_near_streetlight.png",
  "25_sheltering_near_utility_pole.png",
  "26_transformer_onlookers.png",
  "27_photo_near_fallen_wire.png",
  "28_hilltop_watching_lightning.png",
  "29_touching_outdoor_electrical_box.png",
  "30_cycling_through_puddle.png",
  "31_plug_not_fully_inserted.png",
  "32_dusty_outlet.png",
  "33_power_strip_on_wet_floor.png",
  "34_water_cup_near_outlet.png",
  "35_uncertified_power_strip.png",
  "36_cracked_outlet_cover.png",
  "37_pulling_cord_to_unplug.png",
  "38_daisy_chained_power_strips.png",
  "39_sparking_outlet.png",
  "40_missing_child_safety_cover.png",
  "41_smoking_rice_cooker.png",
  "42_overheated_charger.png",
  "43_water_on_burning_power_strip.png",
  "44_heater_igniting_cardboard.png",
  "45_overheating_range_hood_cord.png",
  "46_smoking_e_bike_charging.png",
  "47_burning_smell_power_supply.png",
  "48_dry_boiling_electric_kettle.png",
  "49_burnt_air_conditioner_outlet.png",
  "50_unattended_space_heater.png"
];

function applySafetyImages() {
  safetyCases.forEach((item, index) => {
    const fileName = safetyImageFiles[index];
    if (fileName) item.image = `assets/safety-example/${fileName}`;
  });
}

applySafetyImages();

const experimentImageMap = {
  exp_001: "01_static_electricity_ruler_paper.png",
  exp_002: "02_balloon_static_hair_paper.png",
  exp_003: "03_pencil_lead_conductivity.png",
  exp_004: "04_simple_switch_light_bulb.png",
  exp_005: "05_conductor_insulator_test.png",
  exp_006: "06_salt_water_conductivity.png",
  exp_007: "07_fruit_battery_led.png",
  exp_008: "08_paper_cup_led_lamp.png",
  exp_009: "09_electromagnet_paperclips.png",
  exp_010: "10_dc_motor_fan_circuit.png",
  e1: "01_static_electricity_ruler_paper.png",
  e2: "04_simple_switch_light_bulb.png",
  e3: "07_fruit_battery_led.png"
};

function applyExperimentImages() {
  experiments.forEach(item => {
    const fileName = experimentImageMap[item.id];
    if (fileName) item.image = `assets/experiments/${fileName}`;
  });
}

applyExperimentImages();

const encyclopediaImageMap = {
  "电气元件:电池": "1_battery.jpg",
  "电气元件:导线": "2_wire.jpg.png",
  "电气元件:开关": "3_switch.png",
  "电气元件:灯泡": "4_bulb.jpg",
  "电气元件:LED": "5_led.jpg",
  "电气元件:电阻": "6_resistor.jpg",
  "电气元件:电容": "7_capacitor.jpg",
  "电气元件:二极管": "8_diode.jpg",
  "电气元件:保险丝": "9_fuse.jpg",
  "电气元件:继电器": "10_relay.jpg",
  "电气元件:电机": "11_motor.jpg",
  "电气元件:蜂鸣器": "12_buzzer.jpg",
  "电气元件:电流表": "13_ammeter.jpg",
  "电气元件:电压表": "14_voltmeter.jpg",
  "电气元件:插头": "15_plug.jpg",
  "家用电器:台灯": "16_desk_lamp.jpg",
  "家用电器:冰箱": "17_refrigerator.jpg",
  "家用电器:洗衣机": "18_washing_machine.jpg",
  "家用电器:电饭煲": "19_rice_cooker.jpg",
  "家用电器:电热水壶": "20_electric_kettle.jpg",
  "家用电器:吹风机": "21_hair_dryer.jpg",
  "家用电器:空调": "22_air_conditioner.jpg",
  "家用电器:电视机": "23_television.jpg",
  "家用电器:充电器": "24_charger.png",
  "家用电器:电风扇": "25_electric_fan.jpg",
  "家用电器:微波炉": "26_microwave.jpg",
  "家用电器:电磁炉": "27_induction_cooker.jpg",
  "家用电器:路由器": "28_router.jpg",
  "家用电器:排插": "29_power_strip.jpg",
  "家用电器:电热毯": "30_electric_blanket.jpg",
  "电力基础名词:电流": "31_electric_current.jpg",
  "电力基础名词:电压": "32_voltage.jpg",
  "电力基础名词:电阻": "33_resistance.jpg",
  "电力基础名词:功率": "34_power.jpg",
  "电力基础名词:电能": "35_electric_energy.jpg",
  "电力基础名词:电路": "36_circuit.jpg",
  "电力基础名词:闭合电路": "37_closed_circuit.jpg",
  "电力基础名词:断路": "38_open_circuit.jpg",
  "电力基础名词:短路": "39_short_circuit.jpg",
  "电力基础名词:串联": "40_series_connection.jpg",
  "电力基础名词:并联": "41_parallel_connection.jpg",
  "电力基础名词:导体": "42_conductor.jpg",
  "电力基础名词:绝缘体": "43_insulator.jpg",
  "电力基础名词:交流电": "44_alternating_current.jpg",
  "电力基础名词:直流电": "45_direct_current.jpg",
  "安全用电术语:漏电": "46_electric_leakage.jpg",
  "安全用电术语:接地": "47_grounding.jpg",
  "安全用电术语:地线": "48_ground_wire.jpg",
  "安全用电术语:漏电保护器": "49_leakage_protector.jpg",
  "安全用电术语:空气开关": "50_circuit_breaker.jpg",
  "安全用电术语:过载": "51_overload.jpg",
  "安全用电术语:触电": "52_electric_shock.jpg",
  "安全用电术语:安全电压": "53_safe_voltage.jpg",
  "安全用电术语:高压危险": "54_high_voltage_danger.jpg",
  "安全用电术语:防水等级": "55_waterproof_rating.jpg",
  "安全用电术语:插座保护门": "56_socket_safety_shutter.jpg",
  "安全用电术语:绝缘破损": "57_insulation_damage.jpg",
  "安全用电术语:电气火灾": "58_electrical_fire.jpg",
  "安全用电术语:雷电防护": "59_lightning_protection.jpg",
  "安全用电术语:安全距离": "60_safe_distance.jpg"
};

function applyEncyclopediaImages() {
  encyclopedia.forEach(item => {
    const fileName = encyclopediaImageMap[`${item.category}:${item.title}`];
    if (fileName) item.image = `assets/encyclopedia/${fileName}`;
  });
}

applyEncyclopediaImages();

function polishQuestionOptions() {
  const genericWrongOptions = new Set(["继续观察一会儿", "自己拆开处理", "用水冲洗处理"]);
  questions.forEach(q => {
    if (!Array.isArray(q.options) || !Array.isArray(q.answer) || q.options.length < 4) return;
    const answerSet = new Set(q.answer);
    const indexes = q.options
      .map((option, index) => (!answerSet.has(option) && genericWrongOptions.has(option) ? index : -1))
      .filter(index => index >= 0);
    if (!indexes.length) return;
    const candidates = stableShuffle(contextualWrongOptionPool(q), `${q.id || q.title}-wrong-options`);
    let cursor = 0;
    indexes.forEach(index => {
      while (
        cursor < candidates.length &&
        (answerSet.has(candidates[cursor]) || q.options.includes(candidates[cursor]))
      ) {
        cursor += 1;
      }
      if (cursor < candidates.length) {
        q.options[index] = candidates[cursor];
        cursor += 1;
      }
    });
  });
}

function contextualWrongOptionPool(q) {
  const text = `${q.knowledge || ""}${q.title || ""}${q.scene || ""}${q.explain || ""}`;
  const pool = [];
  const add = items => pool.push(...items);
  if (/湿手|潮湿|积水|水/.test(text)) {
    add(["只把手在衣服上蹭一下就按开关", "一边洗手一边操作电器", "用潮湿毛巾包住插头再拔", "站在积水旁继续插拔电源"]);
  }
  if (/冒烟|焦味|发热|过热|起火|火情|插座/.test(text)) {
    add(["凑近闻一闻确认味道来源", "继续给设备通电测试是否还能用", "把更多电器接到同一个插排上", "先拍照记录再慢慢处理"]);
  }
  if (/破损|破皮|老化|漏电|线缆|电线/.test(text)) {
    add(["用透明胶随手缠一下继续用", "用手摸破损处确认有没有电", "把破损线压到桌脚下继续通电", "拉扯电线让它离自己远一点"]);
  }
  if (/掉落|高压|户外|电线杆|配电箱|变压器/.test(text)) {
    add(["跨过警示线近距离查看", "用树枝把电线挑到路边", "靠近设备看清铭牌内容", "从掉落电线旁边快速跑过"]);
  }
  if (/雷雨|雷电|大树|金属杆|空旷/.test(text)) {
    add(["在大树下继续躲雨", "靠着金属栏杆避雨", "在空旷处高举雨伞赶路", "站到广告牌旁边等雨停"]);
  }
  if (/触电|麻手|电击|救人/.test(text)) {
    add(["直接用手去拉触电者", "用湿拖把拨开电线", "围在旁边等待别人处理", "先触碰设备外壳确认是否带电"]);
  }
  if (/短路|电池|实验|导线/.test(text)) {
    add(["把导线直接接在电池两端看火花", "发现导线发烫仍继续加电池", "用金属片替代开关反复试", "把新旧电池混在一起继续用"]);
  }
  if (/充电|充电器|手机|平板/.test(text)) {
    add(["睡觉时把充电器压在枕头下", "边充电边用湿手拔插头", "使用外壳裂开的充电器", "充满后仍长期插在插座上"]);
  }
  add(["让设备继续通电多试几次", "用金属工具直接接触故障处", "先靠近观察细节再决定", "只要暂时能用就先不处理", "让同学帮忙拆开看看"]);
  return [...new Set(pool)];
}

function stableShuffle(items, seedText) {
  const seeded = [...items];
  let seed = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  for (let i = seeded.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [seeded[i], seeded[j]] = [seeded[j], seeded[i]];
  }
  return seeded;
}

function diantuantuan(mood = "guide", small = false) {
  const iconMap = {
    guide: "01",
    happy: "02",
    warn: "03",
    book: "01",
    wave: "05",
    listen: "06",
    fan: "05",
    think: "04",
    confused: "04",
    shield: "03",
    crawl: "05",
    jump: "02",
    fly: "02"
  };
  const icon = iconMap[mood] || iconMap.guide;
  return `<img class="pika ${small ? "pika-small" : ""} ${mood}" src="./assets/electric-pika/pika-electric-${icon}.png" alt="电团团电气向导">`;
}

function setRoute(route) {
  session.transition = true;
  session.route = route;
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  render();
  setTimeout(() => {
    session.transition = false;
    render();
  }, 520);
}

function render() {
  document.body.classList.toggle("big-screen", session.bigScreen);
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="page-frame">
      <div class="page">
        <header class="top-nav">
          <button class="logo" onclick="setRoute('home')" aria-label="返回首页">
            ${diantuantuan("guide", true)}
            <span><strong>趣电星球</strong><em>电团团电气向导</em></span>
          </button>
          <nav>
            ${nav.map(([id, label, icon]) => `<button class="nav-${id} ${session.route === id ? "active" : ""}" onclick="setRoute('${id}')"><span class="nav-icon">${icon}</span>${label}</button>`).join("")}
          </nav>
          <button class="screen-toggle" onclick="toggleBigScreen()">${session.bigScreen ? "退出大屏" : "大屏宣讲"}</button>
        </header>
        <main>${view()}</main>
      </div>
    </div>
    <button class="floating-pika" onclick="setRoute('home')" title="电团团带你回首页">${diantuantuan("guide", false)}<span>回首页</span></button>
      ${session.transition ? `<div class="transition">${diantuantuan("fly", false)}<strong>电团团正在带路...</strong></div>` : ""}
  `;
  requestAnimationFrame(syncAndObserveScaledPageHeight);
}

function syncAndObserveScaledPageHeight() {
  observeScaledPageHeight();
  syncScaledPageHeight();
}

function observeScaledPageHeight() {
  const page = document.querySelector(".page");
  if (!page || !("ResizeObserver" in window)) return;
  if (scaledPageResizeObserver) scaledPageResizeObserver.disconnect();
  scaledPageResizeObserver = new ResizeObserver(() => requestAnimationFrame(syncScaledPageHeight));
  scaledPageResizeObserver.observe(page);
}

function syncScaledPageHeight() {
  const page = document.querySelector(".page");
  const frame = document.querySelector(".page-frame");
  if (!page || !frame) return;
  frame.style.height = "";
  frame.style.overflow = "";
  if (!window.matchMedia("(min-width: 1200px)").matches) return;
  const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--desktop-app-scale")) || 1;
  if (scale >= 1) return;
  frame.style.height = `${page.offsetHeight * scale}px`;
  frame.style.overflow = "hidden";
}

window.addEventListener("resize", () => requestAnimationFrame(syncAndObserveScaledPageHeight));

function toggleBigScreen() {
  session.bigScreen = !session.bigScreen;
  render();
}

function view() {
  if (session.route === "lab") return labView();
  if (session.route === "quiz") return quizView();
  if (session.route === "courses") return coursesView();
  if (session.route === "safety") return safetyView();
  if (session.route === "experiments") return experimentsView();
  if (session.route === "encyclopedia") return encyclopediaView();
  return homeView();
}

function pageHero(title, desc, mood = "guide") {
  return `<section class="hero">
    <div>
      <p class="eyebrow">电织云梦 · 公益科普</p>
      <h1>${title}</h1>
      <p>${desc}</p>
    </div>
    <div class="pika-bubble">${diantuantuan(mood)}<span>打开即可学习，临时记录仅保存在当前页面中。</span></div>
  </section>`;
}

function homeView() {
  const cards = [
    ["lab", "电路实验室", "拖拽元件、加载案例、运行演示，适合课堂大屏演示。", "🔋", "blue", "crawl"],
    ["quiz", "知识问答", "入门与进阶题库，答题后由电团团讲解知识点。", "💡", "pink", "think"],
    ["courses", "电力微课", "安全用电、基础电路、生活电力短视频课程。", "🔌", "purple", "listen"],
    ["safety", "安全案例", "家庭、校园、户外雷雨等生活化案例。", "🧯", "orange", "warn"],
    ["experiments", "趣味实验", "安全材料、分步教程、一键复制材料清单。", "🧲", "green", "jump"],
    ["encyclopedia", "电气小百科", "搜索电气名词、家用电器、元件和安全术语。", "📘", "yellow", "book"]
  ];
  return `<section class="home-stage">
    <div class="home-orbits"></div>
    <div class="home-left">
      <div class="home-profile">
        ${diantuantuan("guide", true)}
        <span>趣电星球</span>
      </div>
      <div class="home-feature-grid">
        ${cards.map(([route, title, desc, icon, tone, pikaMood]) => `<button class="home-feature ${tone} feature-${route}" onclick="setRoute('${route}')">
          ${diantuantuan(pikaMood, true).replace('class="pika ', `class="pika home-pika-${route} `)}
          <span class="feature-label"><i>${icon}</i>${title}</span>
        </button>`).join("")}
      </div>
    </div>
    <aside class="home-right">
      <div class="resource-tab">电织云梦 · 公益科普</div>
      <div class="home-resource-card">
        <h1>欢迎来到趣电星球</h1>
        <div class="home-tip">
          ${diantuantuan("happy", true)}
          <span>不用登录，打开就能学。刷新页面后临时记录会清空哦！</span>
        </div>
        <div class="home-about">
          <div class="home-about-head">
            <h2>关于我们</h2>
            <div class="team-emblem-block">
              <div class="team-emblems">
                <button class="college-emblem" type="button" onclick="openPublicCard('college')" aria-label="查看东南大学电气工程学院公众号">
                  <img src="./assets/team/college-emblem.png" alt="东南大学电气工程学院院徽">
                </button>
                <button class="team-emblem" type="button" onclick="openPublicCard('team')" aria-label="查看电织云梦实践团公众号">
                  <img src="./assets/team/team-emblem.png" alt="电织云梦实践团队徽">
                </button>
              </div>
              <span>点击此处了解更多</span>
            </div>
          </div>
          <p>“电织云梦”支教团是东南大学电气工程学院发起的公益实践团队，曾斩获东南大学社会实践十佳团队、第七届“云支教”乡村教育奖全国最佳团队。</p>
          <p>团队响应乡村振兴与“双碳”战略号召，赴云南楚雄南华县雨露乡开展暑期支教。我们秉持“环保 + 科技 + 数字 + 公益”的理念，将专业所长融入乡村教育，打造科学实验、科创编程、电气科普、人文美育等多元趣味课程。用知识点亮童心，用陪伴传递温暖，在乡野间践行青年责任与担当。</p>
        </div>
      </div>
    </aside>
    <footer class="home-bottom">
      <button type="button" onclick="setRoute('courses')"><i class="bottom-icon course"></i><span>课程学习</span></button>
      <button type="button" class="active" onclick="setRoute('encyclopedia')"><i class="bottom-icon expand"></i><span>拓展学习</span></button>
      <button type="button" onclick="setRoute('experiments')"><i class="bottom-icon show"></i><span>课外展示</span></button>
    </footer>
  </section>`;
}

function currentQuestions() {
  const filtered = questions.filter(q => q.level === session.quiz.level && q.type === session.quiz.type);
  const key = quizOrderKey();
  const signature = filtered.map(q => q.id).join("|");
  if (!session.quiz.orders[key] || session.quiz.orders[key].signature !== signature) {
    session.quiz.orders[key] = {
      signature,
      ids: shuffleQuestions(filtered).map(q => q.id)
    };
  }
  const byId = new Map(filtered.map(q => [q.id, q]));
  return session.quiz.orders[key].ids.map(id => byId.get(id)).filter(Boolean);
}

function quizOrderKey() {
  return `${session.quiz.level}|${session.quiz.type}`;
}

function shuffleQuestions(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function orderedOptions(q) {
  if (!Array.isArray(q.options) || q.options.length <= 2) return q.options || [];
  if (!session.quiz.optionOrders) session.quiz.optionOrders = {};
  const key = q.id || q.title;
  const signature = q.options.join("|");
  if (!session.quiz.optionOrders[key] || session.quiz.optionOrders[key].signature !== signature) {
    session.quiz.optionOrders[key] = {
      signature,
      options: shuffleQuestions(q.options)
    };
  }
  return session.quiz.optionOrders[key].options;
}

function quizView() {
  let list = currentQuestions();
  if (!list.length) {
    session.quiz.type = questions.find(q => q.level === session.quiz.level).type;
    list = currentQuestions();
  }
  const q = list[session.quiz.index % list.length];
  return `${pageHero("用电知识问答", "切换难度和题型，答题后查看电团团解析，错题会临时保存在本次学习中。", "think")}
    <section class="panel quiz-panel">
      <div class="toolbar">
        ${["入门级", "进阶级"].map(v => `<button class="${session.quiz.level === v ? "active" : ""}" onclick="setQuiz('level','${v}')">${v}</button>`).join("")}
        ${["单选", "多选", "判断"].map(v => `<button class="${session.quiz.type === v ? "active" : ""}" onclick="setQuiz('type','${v}')">${v}</button>`).join("")}
        <button onclick="showWrongPanel()">临时错题 ${session.quiz.wrong.length}</button>
      </div>
      <div class="quiz-board">
        <div class="quiz-board-title">电织云梦知识小问答</div>
        <div class="quiz-board-paper">
          <div class="quiz-main">
            <div class="tag-row"><span>第 ${(session.quiz.index % list.length) + 1} 题</span><span>${q.level}</span><span>${q.type}</span><span>${q.knowledge}</span></div>
            <h2>${q.title}</h2>
            ${answerControls(q)}
            ${session.quiz.result ? quizResult(q) : ""}
            <div class="actions">
              <button class="primary" onclick="submitQuiz('${q.id}')">提交答案</button>
              <button onclick="prevQuestion()">上一题</button>
              <button onclick="nextQuestion()">下一题</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function answerControls(q) {
  const input = q.type === "多选" ? "checkbox" : "radio";
  return `<div class="answers">${orderedOptions(q).map((opt, index) => `<label class="${session.quiz.selected.includes(opt) ? "selected" : ""}">
    <input type="${input}" name="answer" ${session.quiz.selected.includes(opt) ? "checked" : ""} onchange='toggleChoice(${JSON.stringify(opt)}, "${input}")'>
    <b>${String.fromCharCode(65 + index)}</b>
    <span>${opt}</span>
  </label>`).join("")}</div>`;
}

function setQuiz(key, value) {
  session.quiz[key] = value;
  session.quiz.index = 0;
  session.quiz.selected = [];
  session.quiz.text = "";
  session.quiz.result = null;
  delete session.quiz.orders[quizOrderKey()];
  render();
}

function toggleChoice(value, input) {
  if (input === "radio") session.quiz.selected = [value];
  else if (session.quiz.selected.includes(value)) session.quiz.selected = session.quiz.selected.filter(v => v !== value);
  else session.quiz.selected.push(value);
}

function submitQuiz(id) {
  const q = questions.find(item => item.id === id);
  const correct = q.answer.length === session.quiz.selected.length && q.answer.every(ans => session.quiz.selected.includes(ans));
  session.quiz.result = { correct };
  if (!correct && !session.quiz.wrong.includes(id)) session.quiz.wrong.push(id);
  if (correct) session.quiz.wrong = session.quiz.wrong.filter(wrongId => wrongId !== id);
  render();
}

function quizResult(q) {
  const ok = session.quiz.result.correct;
  return `<div class="talk ${ok ? "ok" : "bad"}">
    ${diantuantuan(ok ? "happy" : "warn", true)}
    <div><strong>${ok ? "答对啦，电团团给你放电比心！" : "别急，电团团举提示牌帮你复盘。"}</strong>
    <p>正确答案：${q.answer.join("、")}</p><p>${q.explain}</p></div>
  </div>`;
}

function nextQuestion() {
  const list = currentQuestions();
  session.quiz.index = (session.quiz.index + 1) % list.length;
  session.quiz.selected = [];
  session.quiz.text = "";
  session.quiz.result = null;
  render();
}

function prevQuestion() {
  const list = currentQuestions();
  session.quiz.index = (session.quiz.index - 1 + list.length) % list.length;
  session.quiz.selected = [];
  session.quiz.text = "";
  session.quiz.result = null;
  render();
}

function showWrongPanel() {
  const items = session.quiz.wrong.map(id => questions.find(q => q.id === id)).filter(Boolean);
  openModal("临时错题面板", items.length ? items.map(wrongQuestionCard).join("") : `<div class="empty">${diantuantuan("book", true)}当前没有错题，刷新页面后这里也会清空。</div>`);
}

function wrongQuestionCard(q) {
  return `<article class="mini-card wrong-card">
    <div class="tag-row"><span>${q.level}</span><span>${q.type}</span><span>${q.knowledge}</span></div>
    <strong>${q.title}</strong>
    <p>${q.explain}</p>
    <div class="actions"><button class="primary" onclick="redoWrongQuestion('${q.id}')">重做这题</button></div>
  </article>`;
}

function redoWrongQuestion(id) {
  const q = questions.find(item => item.id === id);
  if (!q) return;
  session.route = "quiz";
  session.quiz.level = q.level;
  session.quiz.type = q.type;
  session.quiz.selected = [];
  session.quiz.text = "";
  session.quiz.result = null;
  const list = currentQuestions();
  const index = list.findIndex(item => item.id === id);
  session.quiz.index = Math.max(0, index);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function labView() {
  ensureCircuitSlots();
  const structured = isStructuredCircuit();
  const modeInfo = circuitModes.find(([id]) => id === session.circuit.mode) || circuitModes[0];
  return `${pageHero("电路实验室", "拖拽元件、观察亮灯转动、电表读数和安全诊断。", "crawl")}
    <section class="lab-layout">
      <aside class="panel">
        <h2>卡通元件库</h2>
        <p class="panel-hint">把元件拖进中间槽位，或点击元件自动放入合适位置。</p>
        <div class="component-list">${components.map(c => `<button draggable="true" ondragstart="dragNewComponent(event,'${c}')" title="电团团讲解：${componentTip(c)}" onclick="addComponent('${c}')">+ ${c}</button>`).join("")}</div>
      </aside>
      <div class="panel">
        <div class="mode-strip">
          ${circuitModes.map(([id, label]) => `<button class="${session.circuit.mode === id ? "active" : ""}" onclick="setCircuitMode('${id}')">${label}</button>`).join("")}
        </div>
        <p class="mode-help"><strong>${modeInfo[1]}：</strong>${modeInfo[2]}</p>
        <div class="toolbar">
          <button class="primary" onclick="runDiagnosis()">运行演示</button>
          <button onclick="clearCanvas()">重置画布</button>
          <button onclick="exportCircuit()">截图导出</button>
          ${structured ? `<button onclick="adjustCircuitZoom(-0.08)">缩小画布</button><button onclick="resetCircuitZoom()">${Math.round((session.circuit.zoom || 1) * 100)}%</button><button onclick="adjustCircuitZoom(0.08)">放大画布</button>` : ""}
        </div>
        ${structured ? slotManageControls() : ""}
        ${structured ? teachingCanvasIntro() : ""}
        ${structured ? structuredCircuitCanvas() : freeCircuitCanvas()}
        ${structured ? teachingStatusPanel() : ""}
        ${circuitJsReferencePanel()}
        <div class="case-strip">${circuitCases.map(item => `<button class="${session.circuit.selectedCase === item.name ? "active" : ""}" onclick="loadCase('${item.id}')">${item.name}</button>`).join("")}</div>
      </div>
      <aside class="panel">
        <h2>电团团诊断气泡</h2>
        <div class="talk">${diantuantuan(session.circuit.diagnosis.includes("危险") ? "warn" : "guide", true)}<p>${session.circuit.diagnosis}</p></div>
        ${session.circuit.exported ? `<p class="notice">已生成截图导出提示：真实部署时可接入 html2canvas。</p>` : ""}
      </aside>
    </section>`;
}

function setCircuitMode(mode) {
  if (!circuitModes.some(([id]) => id === mode)) mode = "series";
  session.circuit.mode = mode;
  session.circuit.selectedCase = "";
  session.circuit.equivalents = [];
  session.circuit.selectedTerminal = null;
  session.circuit.slotTarget = firstSlotArea(mode).id;
  session.circuit.slotExtras = {};
  session.circuit.slotMeta = {};
  session.circuit.analysis = null;
  session.circuit.slots = emptyCircuitSlots(mode);
  session.circuit.diagnosis = `已切换到「${circuitModeLabel(mode)}」，把元件放进标好的槽位就能看出串并联关系。`;
  render();
}

function circuitModeLabel(mode = session.circuit.mode) {
  const found = circuitModes.find(([id]) => id === mode);
  return found ? found[1] : "串联电路";
}

function isStructuredCircuit() {
  return true;
}

function teachingCanvasIntro() {
  return `<div class="teaching-canvas-title">
    <strong>教学演示画布</strong>
    <span>在这里搭建和讲解电路；下方电路模拟器会同步显示真实仿真、动画和读数。</span>
  </div>`;
}

function ensureCircuitSlots() {
  if (!isStructuredCircuit()) return;
  const expected = slotIdsForMode(session.circuit.mode);
  const current = session.circuit.slots || {};
  if (!session.circuit.slotMeta) session.circuit.slotMeta = {};
  const next = {};
  expected.forEach(id => {
    next[id] = current[id] || "";
    if (next[id]) ensureSlotMeta(id, next[id]);
  });
  session.circuit.slots = next;
  Object.keys(session.circuit.slotMeta).forEach(id => {
    if (!Object.prototype.hasOwnProperty.call(next, id)) delete session.circuit.slotMeta[id];
  });
  if (!slotAreaForCurrentTarget()) session.circuit.slotTarget = firstSlotArea(session.circuit.mode).id;
}

function emptyCircuitSlots(mode) {
  return Object.fromEntries(slotIdsForMode(mode).map(id => [id, ""]));
}

function slotIdsForMode(mode) {
  return slotGroupsForMode(mode).flatMap(group => group.slots.map(slot => slot.id));
}

function slotGroupForArea(areaId, mode = session.circuit.mode) {
  return slotGroupsForMode(mode).find(group => group.id === areaId);
}

function slotIdsForArea(areaId, mode = session.circuit.mode) {
  return (slotGroupForArea(areaId, mode)?.slots || []).map(slot => slot.id);
}

function slotAreaBySlot(slotId, mode = session.circuit.mode) {
  return slotGroupsForMode(mode).find(group => group.slots.some(slot => slot.id === slotId));
}

function slotGroupsForMode(mode) {
  const extra = areaId => dynamicSlotsForArea(mode, areaId);
  if (mode === "parallel") {
    return [
      { id: "main", label: "主路", hint: "电池和开关控制两条支路", slots: [slot("source", "电源槽"), slot("control", "控制槽"), ...extra("main")] },
      { id: "b1", label: "支路 1", hint: "第一条并联支路", slots: [slot("b1load", "负载槽"), ...extra("b1")] },
      { id: "b2", label: "支路 2", hint: "第二条并联支路", slots: [slot("b2load", "负载槽"), ...extra("b2")] }
    ];
  }
  if (mode === "mixed") {
    return [
      { id: "main", label: "主路", hint: "先串联，再分支", slots: [slot("source", "电源槽"), slot("control", "控制槽"), slot("mainLoad", "主路负载"), ...extra("main")] },
      { id: "b1", label: "支路 1", hint: "混合电路第一条支路", slots: [slot("b1load", "负载槽"), ...extra("b1")] },
      { id: "b2", label: "支路 2", hint: "混合电路第二条支路", slots: [slot("b2load", "负载槽"), ...extra("b2")] }
    ];
  }
  return [
    { id: "main", label: "主路", hint: "一条电流路径，元件依次连接", slots: [slot("source", "电源槽"), slot("control", "控制槽"), slot("load1", "负载槽"), ...extra("main")] }
  ];
}

function slot(id, label) {
  return { id, label };
}

function slotAreasForMode(mode = session.circuit.mode) {
  return circuitSlotAreas[mode] || circuitSlotAreas.series;
}

function firstSlotArea(mode = session.circuit.mode) {
  return slotAreasForMode(mode)[0];
}

function slotAreaForCurrentTarget() {
  return slotAreasForMode().find(area => area.id === session.circuit.slotTarget);
}

function slotExtraKey(mode = session.circuit.mode, areaId = session.circuit.slotTarget) {
  return `${mode}:${areaId}`;
}

function slotExtraCount(mode, areaId) {
  return session.circuit.slotExtras?.[slotExtraKey(mode, areaId)] || 0;
}

function setSlotExtraCount(mode, areaId, count) {
  if (!session.circuit.slotExtras) session.circuit.slotExtras = {};
  session.circuit.slotExtras[slotExtraKey(mode, areaId)] = Math.max(0, count);
}

function dynamicSlotsForArea(mode, areaId) {
  const area = slotAreasForMode(mode).find(item => item.id === areaId);
  if (!area) return [];
  const baseLoadCount = slotGroupsForModeWithoutExtras(mode)
    .find(group => group.id === areaId)?.slots
    .filter(item => slotKind(item.id) === "load").length || 0;
  return Array.from({ length: slotExtraCount(mode, areaId) }, (_, index) => slot(`${area.prefix}${index + 1}`, `负载槽 ${baseLoadCount + index + 1}`));
}

function slotGroupsForModeWithoutExtras(mode) {
  if (mode === "parallel") {
    return [
      { id: "main", slots: [slot("source", "电源槽"), slot("control", "控制槽")] },
      { id: "b1", slots: [slot("b1load", "负载槽")] },
      { id: "b2", slots: [slot("b2load", "负载槽")] }
    ];
  }
  if (mode === "mixed") {
    return [
      { id: "main", slots: [slot("source", "电源槽"), slot("control", "控制槽"), slot("mainLoad", "主路负载")] },
      { id: "b1", slots: [slot("b1load", "负载槽")] },
      { id: "b2", slots: [slot("b2load", "负载槽")] }
    ];
  }
  return [
    { id: "main", slots: [slot("source", "电源槽"), slot("control", "控制槽"), slot("load1", "负载槽")] }
  ];
}

function structuredCircuitCanvas() {
  ensureCircuitSlots();
  const analysis = session.circuit.analysis || emptyStructuredAnalysis();
  const layout = topologySlotsForMode(session.circuit.mode);
  const zoom = session.circuit.zoom || 1;
  const baseWidth = topologyBaseWidth(session.circuit.mode);
  const stageWidth = Math.round(baseWidth * zoom);
  return `<div class="structure-canvas topology-canvas ${session.circuit.mode}" onwheel="zoomCircuitCanvas(event)" ondragover="allowCircuitDrop(event)">
    <div class="canvas-pika">${diantuantuan(session.circuit.diagnosis.includes("通过") ? "happy" : "guide", true)}</div>
    <div class="circuit-legend">
      <span>${topologyTitle(session.circuit.mode)}</span>
      <span>沿着线拖入元件，电路自动闭合</span>
    </div>
    <div class="topology-scroll">
      <div class="topology-stage" style="--stage-width:${stageWidth}px;--diagram-width:${baseWidth}px;">
        <div class="topology-diagram" style="--canvas-zoom:${zoom};--diagram-width:${baseWidth}px;">
          ${topologyWireSvg(session.circuit.mode)}
          ${layout.map(item => circuitSlotView(item, analysis.slots[item.id])).join("")}
        </div>
      </div>
    </div>
    <div class="topology-zoom-badge">滚轮缩放 · ${Math.round(zoom * 100)}%</div>
  </div>`;
}

function slotManageControls() {
  const areas = slotAreasForMode();
  const selected = slotAreaForCurrentTarget() || firstSlotArea();
  const count = slotExtraCount(session.circuit.mode, selected.id);
  return `<div class="slot-manage">
    <span>当前操作：</span>
    ${areas.map(area => `<button class="${session.circuit.slotTarget === area.id ? "active" : ""}" onclick="setCircuitSlotTarget('${area.id}')">${area.label}</button>`).join("")}
    <button onclick="addLoadSlot()">增加负载槽</button>
    <button onclick="removeEmptyLoadSlot()">删除空槽</button>
    <small>${selected.label} 已额外添加 ${count}/${selected.max} 个</small>
  </div>`;
}

function setCircuitSlotTarget(areaId) {
  if (!slotAreasForMode().some(area => area.id === areaId)) return;
  session.circuit.slotTarget = areaId;
  session.circuit.diagnosis = `已选中「${slotAreaForCurrentTarget().label}」，新增或删除槽位都会作用在这里。`;
  render();
}

function addLoadSlot() {
  const area = slotAreaForCurrentTarget() || firstSlotArea();
  const count = slotExtraCount(session.circuit.mode, area.id);
  if (count >= area.max) {
    session.circuit.diagnosis = `「${area.label}」最多额外添加 ${area.max} 个槽位，避免画布太挤。`;
    render();
    return;
  }
  setSlotExtraCount(session.circuit.mode, area.id, count + 1);
  ensureCircuitSlots();
  session.circuit.analysis = null;
  session.circuit.selectedCase = "";
  session.circuit.diagnosis = `已给「${area.label}」增加一个负载槽。`;
  render();
}

function removeEmptyLoadSlot() {
  const area = slotAreaForCurrentTarget() || firstSlotArea();
  const count = slotExtraCount(session.circuit.mode, area.id);
  if (!count) {
    session.circuit.diagnosis = `「${area.label}」没有可删除的新增槽，基础槽位会保留。`;
    render();
    return;
  }
  const id = `${area.prefix}${count}`;
  if (session.circuit.slots?.[id]) {
    session.circuit.diagnosis = `最后一个新增槽里已有「${session.circuit.slots[id]}」，请先清空再删除。`;
    render();
    return;
  }
  setSlotExtraCount(session.circuit.mode, area.id, count - 1);
  ensureCircuitSlots();
  session.circuit.analysis = null;
  session.circuit.selectedCase = "";
  session.circuit.diagnosis = `已删除「${area.label}」最后一个空槽。`;
  render();
}

function setCircuitZoom(value, rerender = true) {
  const next = Math.max(0.72, Math.min(1.5, Number(value) || 1));
  session.circuit.zoom = Math.round(next * 100) / 100;
  if (rerender) {
    render();
  } else {
    applyCircuitZoomToDom();
  }
}

function adjustCircuitZoom(delta) {
  setCircuitZoom((session.circuit.zoom || 1) + delta);
}

function resetCircuitZoom() {
  setCircuitZoom(1);
}

function zoomCircuitCanvas(event) {
  event.preventDefault();
  setCircuitZoom((session.circuit.zoom || 1) + (event.deltaY > 0 ? -0.06 : 0.06), false);
}

function applyCircuitZoomToDom() {
  const stage = document.querySelector(".topology-stage");
  const diagram = document.querySelector(".topology-diagram");
  const badge = document.querySelector(".topology-zoom-badge");
  const zoom = session.circuit.zoom || 1;
  const baseWidth = topologyBaseWidth(session.circuit.mode);
  if (stage) {
    stage.style.setProperty("--diagram-width", `${baseWidth}px`);
    stage.style.setProperty("--stage-width", `${Math.round(baseWidth * zoom)}px`);
  }
  if (diagram) {
    diagram.style.setProperty("--diagram-width", `${baseWidth}px`);
    diagram.style.setProperty("--canvas-zoom", zoom);
  }
  if (badge) badge.textContent = `滚轮缩放 · ${Math.round((session.circuit.zoom || 1) * 100)}%`;
}

function topologyBaseWidth(mode) {
  const areaIds = area => slotIdsForArea(area, mode);
  if (mode === "series") {
    const total = areaIds("main").length;
    const topCount = Math.ceil(total / 2);
    const bottomCount = total - topCount;
    const columns = Math.max(topCount, bottomCount, 3);
    return Math.max(940, TOPOLOGY_LEFT_PAD * 2 + (columns - 1) * TOPOLOGY_GAP + 170);
  }
  const mainCount = areaIds("main").length;
  const branchCount = Math.max(areaIds("b1").length, areaIds("b2").length);
  const mainSpan = Math.max(0, mainCount - 1) * (mode === "mixed" ? 166 : 158);
  const branchSpan = Math.max(0, branchCount - 1) * TOPOLOGY_BRANCH_GAP;
  return Math.max(940, TOPOLOGY_LEFT_PAD + mainSpan + branchSpan + 480);
}

function topologyTitle(mode) {
  if (mode === "parallel") return "并联：电流分成两条路";
  if (mode === "mixed") return "混合：先经过元件，再分两条路";
  return "串联：电流沿一圈依次经过";
}

function topologySlotsForMode(mode) {
  const areaIds = area => slotGroupsForMode(mode).find(group => group.id === area)?.slots.map(item => item.id) || [];
  const row = (ids, startX, gap, y) => ids.map((id, index) => topologySlot(id, slotLabelForId(mode, id), startX + gap * index, y));
  if (mode === "parallel") {
    const main = areaIds("main");
    const b1 = areaIds("b1");
    const b2 = areaIds("b2");
    const mainGap = 158;
    const splitX = TOPOLOGY_LEFT_PAD + Math.max(0, main.length - 1) * mainGap + TOPOLOGY_SLOT_WIDTH / 2 + 64;
    const branchStart = splitX + 126;
    return [
      ...row(main, TOPOLOGY_LEFT_PAD, mainGap, 260),
      ...row(b1, branchStart, TOPOLOGY_BRANCH_GAP, 150),
      ...row(b2, branchStart, TOPOLOGY_BRANCH_GAP, 355)
    ];
  }
  if (mode === "mixed") {
    const main = areaIds("main");
    const b1 = areaIds("b1");
    const b2 = areaIds("b2");
    const mainGap = 166;
    const splitX = TOPOLOGY_LEFT_PAD + Math.max(0, main.length - 1) * mainGap + TOPOLOGY_SLOT_WIDTH / 2 + 64;
    const branchStart = splitX + 126;
    return [
      ...row(main, TOPOLOGY_LEFT_PAD, mainGap, 285),
      ...row(b1, branchStart, TOPOLOGY_BRANCH_GAP, 150),
      ...row(b2, branchStart, TOPOLOGY_BRANCH_GAP, 355)
    ];
  }
  const ids = areaIds("main");
  const topCount = Math.ceil(ids.length / 2);
  const topIds = ids.slice(0, topCount);
  const bottomIds = ids.slice(topCount);
  const bottomRightX = TOPOLOGY_LEFT_PAD + (Math.max(topIds.length, bottomIds.length, 1) - 1) * TOPOLOGY_GAP;
  return [
    ...row(topIds, TOPOLOGY_LEFT_PAD, TOPOLOGY_GAP, 150),
    ...bottomIds.map((id, index) => topologySlot(id, slotLabelForId(mode, id), bottomRightX - TOPOLOGY_GAP * index, 355))
  ];
}

function topologySlot(id, label, x, y) {
  return { id, label, x, y };
}

function slotLabelForId(mode, id) {
  return slotGroupsForMode(mode).flatMap(group => group.slots).find(item => item.id === id)?.label || "扩展槽";
}

function topologyWireSvg(mode) {
  const slots = Object.fromEntries(topologySlotsForMode(mode).map(item => [item.id, item]));
  const diagramWidth = topologyBaseWidth(mode);
  const halfW = TOPOLOGY_SLOT_WIDTH / 2;
  const left = id => slots[id].x - halfW;
  const right = id => slots[id].x + halfW;
  const y = id => slots[id].y;
  const line = (x1, y1, x2, y2, branch = false) => `<line class="wire-line ${branch ? "branch" : "main"}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  const hSlot = (a, b, branch = false) => slots[b].x >= slots[a].x
    ? line(right(a), y(a), left(b), y(b), branch)
    : line(left(a), y(a), right(b), y(b), branch);
  const connectPath = (ids, branch = false) => ids.slice(0, -1).map((id, index) => hSlot(id, ids[index + 1], branch)).join("");
  const areaIds = area => slotGroupsForMode(mode).find(group => group.id === area)?.slots.map(item => item.id) || [];
  const svg = body => `<svg class="topology-wire topology-svg" viewBox="0 0 ${diagramWidth} ${TOPOLOGY_HEIGHT}" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`;

  if (mode === "parallel") {
    const main = areaIds("main");
    const b1 = areaIds("b1");
    const b2 = areaIds("b2");
    const splitX = right(main[main.length - 1]) + 62;
    const joinX = Math.max(right(b1[b1.length - 1]), right(b2[b2.length - 1])) + 62;
    const returnLeftX = left("source") - 24;
    const returnY = 430;
    return svg(`
      ${connectPath(main)}
      ${line(right(main[main.length - 1]), y(main[main.length - 1]), splitX, y(main[main.length - 1]))}
      ${line(splitX, y(b1[0]), splitX, y(b2[0]))}
      ${line(splitX, y(b1[0]), left(b1[0]), y(b1[0]), true)}
      ${connectPath(b1, true)}
      ${line(right(b1[b1.length - 1]), y(b1[b1.length - 1]), joinX, y(b1[b1.length - 1]), true)}
      ${line(splitX, y(b2[0]), left(b2[0]), y(b2[0]), true)}
      ${connectPath(b2, true)}
      ${line(right(b2[b2.length - 1]), y(b2[b2.length - 1]), joinX, y(b2[b2.length - 1]), true)}
      ${line(joinX, y(b1[b1.length - 1]), joinX, y(b2[b2.length - 1]))}
      ${line(joinX, y(b2[b2.length - 1]), joinX, returnY)}
      ${line(returnLeftX, returnY, joinX, returnY)}
      ${line(returnLeftX, y("source"), returnLeftX, returnY)}
      ${line(returnLeftX, y("source"), left("source"), y("source"))}
    `);
  }
  if (mode === "mixed") {
    const main = areaIds("main");
    const b1 = areaIds("b1");
    const b2 = areaIds("b2");
    const splitX = right(main[main.length - 1]) + 62;
    const joinX = Math.max(right(b1[b1.length - 1]), right(b2[b2.length - 1])) + 62;
    const returnLeftX = left("source") - 24;
    const returnY = 430;
    return svg(`
      ${connectPath(main)}
      ${line(right(main[main.length - 1]), y(main[main.length - 1]), splitX, y(main[main.length - 1]))}
      ${line(splitX, y(b1[0]), splitX, y(b2[0]))}
      ${line(splitX, y(b1[0]), left(b1[0]), y(b1[0]), true)}
      ${connectPath(b1, true)}
      ${line(right(b1[b1.length - 1]), y(b1[b1.length - 1]), joinX, y(b1[b1.length - 1]), true)}
      ${line(splitX, y(b2[0]), left(b2[0]), y(b2[0]), true)}
      ${connectPath(b2, true)}
      ${line(right(b2[b2.length - 1]), y(b2[b2.length - 1]), joinX, y(b2[b2.length - 1]), true)}
      ${line(joinX, y(b1[b1.length - 1]), joinX, y(b2[b2.length - 1]))}
      ${line(joinX, y(b2[b2.length - 1]), joinX, returnY)}
      ${line(returnLeftX, returnY, joinX, returnY)}
      ${line(returnLeftX, y("source"), returnLeftX, returnY)}
      ${line(returnLeftX, y("source"), left("source"), y("source"))}
    `);
  }
  const ids = areaIds("main");
  const topCount = Math.ceil(ids.length / 2);
  const topIds = ids.slice(0, topCount);
  const bottomIds = ids.slice(topCount);
  const returnLeftX = left("source") - 24;
  const rightColumnX = Math.max(...ids.map(id => right(id))) + 24;
  return svg(`
    ${connectPath(topIds)}
    ${line(right(topIds[topIds.length - 1]), y(topIds[topIds.length - 1]), rightColumnX, y(topIds[topIds.length - 1]))}
    ${bottomIds.length ? line(rightColumnX, y(topIds[topIds.length - 1]), rightColumnX, y(bottomIds[0])) : ""}
    ${bottomIds.length ? line(right(bottomIds[0]), y(bottomIds[0]), rightColumnX, y(bottomIds[0])) : ""}
    ${connectPath(bottomIds)}
    ${bottomIds.length ? line(returnLeftX, y(bottomIds[bottomIds.length - 1]), left(bottomIds[bottomIds.length - 1]), y(bottomIds[bottomIds.length - 1])) : ""}
    ${line(returnLeftX, y("source"), returnLeftX, bottomIds.length ? y(bottomIds[bottomIds.length - 1]) : y(topIds[topIds.length - 1]))}
    ${line(returnLeftX, y("source"), left("source"), y("source"))}
  `);
}

function slotGroupView(group) {
  return `<section class="slot-group">
    <div class="slot-group-head"><strong>${group.label}</strong><span>${group.hint}</span></div>
    <div class="slot-row">${group.slots.map(circuitSlotView).join("")}</div>
  </section>`;
}

function circuitSlotView(item, state = null) {
  const name = session.circuit.slots[item.id] || "";
  const pos = Number.isFinite(item.x) ? ` style="--slot-x:${item.x}px;--slot-y:${item.y}px"` : "";
  const area = slotAreaBySlot(item.id);
  const selected = area && area.id === session.circuit.slotTarget ? " selected-area" : "";
  const emptyTitle = slotEmptyTitle(item.id);
  const classes = ["circuit-slot", name ? "filled" : "empty", selected.trim(), name ? componentClass(name) : "", state?.powered ? "is-powered" : "", state?.glow ? "is-glowing" : "", state?.spinning ? "is-spinning" : "", state?.buzzing ? "is-buzzing" : "", state?.blown ? "is-blown" : "", state?.reverse ? "is-reverse" : "", state?.switchClosed === false ? "is-open-switch" : ""].filter(Boolean).join(" ");
  return `<div class="${classes}"${pos} onclick="selectCircuitAreaBySlot('${item.id}')" ondragover="allowCircuitDrop(event)" ondrop="dropOnCircuitSlot(event,'${item.id}')">
    <span class="slot-note">${item.label}</span>
    ${name ? filledCircuitSlotContent(item.id, name, state) : `<strong>${emptyTitle}</strong><small>或点击左侧元件自动放入</small>`}
  </div>`;
}

function filledCircuitSlotContent(slotId, name, state) {
  return `<button class="slot-clear" onclick="event.stopPropagation();clearCircuitSlot('${slotId}')" title="清除这个槽位">×</button>
    ${componentTeachingFace(name, state)}
    <strong>${componentDisplayName(name, state)}</strong>
    <small>${slotStatusText(slotId, name, state)}</small>
    ${switchControl(slotId, name)}
    ${directionControl(slotId, name)}`;
}

function slotEmptyTitle(slotId) {
  if (slotKind(slotId) === "source") return "放入电池";
  if (slotKind(slotId) === "control") return "放入开关";
  return "放入负载";
}

function ensureSlotMeta(slotId, name = session.circuit.slots?.[slotId]) {
  if (!session.circuit.slotMeta) session.circuit.slotMeta = {};
  const meta = session.circuit.slotMeta[slotId] || {};
  if (["LED", "二极管"].includes(name) && !meta.orientation) meta.orientation = "forward";
  if (!["LED", "二极管"].includes(name)) delete meta.orientation;
  if (name === "开关" && typeof meta.closed !== "boolean") meta.closed = true;
  if (name !== "开关") delete meta.closed;
  session.circuit.slotMeta[slotId] = meta;
  return meta;
}

function setSlotComponent(slotId, name) {
  if (!session.circuit.slotMeta) session.circuit.slotMeta = {};
  session.circuit.slots[slotId] = name;
  session.circuit.slotMeta[slotId] = {};
  ensureSlotMeta(slotId, name);
}

function toggleSlotDirection(event, slotId) {
  event.stopPropagation();
  const name = session.circuit.slots?.[slotId];
  if (!["LED", "二极管"].includes(name)) return;
  const meta = ensureSlotMeta(slotId, name);
  meta.orientation = meta.orientation === "reverse" ? "forward" : "reverse";
  if (session.circuit.analysis) analyzeStructuredCircuit();
  session.circuit.selectedCase = "";
  session.circuit.diagnosis = meta.orientation === "reverse"
    ? `已把「${name}」改成反接。电团团提示：反接时它通常不会发光。`
    : `已把「${name}」改成正接。通电后就可以观察它的效果。`;
  render();
}

function toggleSlotSwitch(event, slotId) {
  event.stopPropagation();
  const name = session.circuit.slots?.[slotId];
  if (name !== "开关") return;
  const meta = ensureSlotMeta(slotId, name);
  meta.closed = !meta.closed;
  session.circuit.analysis = analyzeStructuredCircuit();
  session.circuit.selectedCase = "";
  session.circuit.diagnosis = meta.closed
    ? "开关已闭合，电流可以沿着闭合电路流动。"
    : "开关已断开，电路断路，灯泡和电机都会停止。";
  render();
}

function analyzeStructuredCircuit() {
  ensureCircuitSlots();
  const empty = emptyStructuredAnalysis("先放入电池和负载，再运行演示。");
  const slots = session.circuit.slots || {};
  const hasBattery = Object.values(slots).includes("电池");
  const hasSwitch = Object.values(slots).includes("开关");
  const hasOpenSwitch = Object.entries(slots).some(([slotId, name]) => name === "开关" && !switchIsClosed(slotId));
  const voltage = hasBattery ? 6 : 0;
  const analysis = { ...empty, voltage, slots: { ...empty.slots }, warnings: [] };
  if (!hasBattery) {
    analysis.summary = "缺少电池，电路暂时没有能量。";
    session.circuit.analysis = analysis;
    return analysis;
  }
  if (hasOpenSwitch) {
    analysis.summary = "开关处于断开状态，电路没有形成通路。";
    Object.entries(slots).forEach(([slotId, name]) => {
      if (name === "开关" && analysis.slots[slotId]) {
        analysis.slots[slotId].switchClosed = false;
      }
    });
    session.circuit.analysis = analysis;
    return analysis;
  }

  if (session.circuit.mode === "series") solveSeriesCircuit(analysis, slotIdsForArea("main"));
  if (session.circuit.mode === "parallel") solveParallelCircuit(analysis, slotIdsForArea("main"), slotIdsForArea("b1"), slotIdsForArea("b2"));
  if (session.circuit.mode === "mixed") solveParallelCircuit(analysis, slotIdsForArea("main"), slotIdsForArea("b1"), slotIdsForArea("b2"));

  if (!hasSwitch) analysis.warnings.push("没有开关也能演示通路，但课堂实验建议加入开关。");
  const reverseNames = Object.values(analysis.slots).filter(state => state.reverse && ["LED", "二极管"].includes(state.name));
  if (reverseNames.length) analysis.warnings.push("有 LED 或二极管处于反接状态，这一路不会正常发光。");
  if (Object.values(analysis.slots).some(state => state.blown)) analysis.warnings.push("保险丝检测到过大电流，已显示熔断状态。");
  analysis.summary = circuitAnalysisSummary(analysis);
  session.circuit.analysis = analysis;
  return analysis;
}

function emptyStructuredAnalysis(summary = "点击“运行演示”后，电团团会显示亮灯、转动和电表读数。") {
  ensureCircuitSlots();
  const slots = {};
  slotIdsForMode(session.circuit.mode).forEach(id => {
    const name = session.circuit.slots?.[id] || "";
    slots[id] = baseSlotState(id, name);
  });
  return {
    powered: false,
    voltage: Object.values(session.circuit.slots || {}).includes("电池") ? 6 : 0,
    totalCurrent: 0,
    slots,
    warnings: [],
    summary
  };
}

function baseSlotState(slotId, name) {
  const meta = ensureSlotMeta(slotId, name);
  return {
    slotId,
    name,
    current: 0,
    voltage: 0,
    powered: false,
    glow: false,
    spinning: false,
    buzzing: false,
    blown: false,
    reverse: meta.orientation === "reverse",
    switchClosed: name === "开关" ? meta.closed !== false : true
  };
}

function solveSeriesCircuit(analysis, ids) {
  const loadIds = ids.filter(id => slotKind(id) === "load" && session.circuit.slots[id]);
  const resistance = equivalentSeriesResistance(loadIds);
  if (!loadIds.length || !Number.isFinite(resistance) || resistance <= 0) return;
  const current = Math.min(analysis.voltage / resistance, 12);
  analysis.totalCurrent = current;
  loadIds.forEach(id => updateSlotElectricalState(analysis, id, current, slotVoltage(id, current, analysis.voltage, resistance)));
  markSourceAndControlPowered(analysis, current);
}

function solveParallelCircuit(analysis, mainIds, b1Ids, b2Ids) {
  const mainLoadIds = mainIds.filter(id => slotKind(id) === "load" && session.circuit.slots[id]);
  const b1LoadIds = b1Ids.filter(id => slotKind(id) === "load" && session.circuit.slots[id]);
  const b2LoadIds = b2Ids.filter(id => slotKind(id) === "load" && session.circuit.slots[id]);
  const rMain = equivalentSeriesResistance(mainLoadIds);
  const r1 = equivalentSeriesResistance(b1LoadIds);
  const r2 = equivalentSeriesResistance(b2LoadIds);
  if (mainLoadIds.length && !Number.isFinite(rMain)) return;
  const branchRs = [r1, r2].filter(r => Number.isFinite(r) && r > 0);
  if (!branchRs.length) return;
  const rParallel = 1 / branchRs.reduce((sum, r) => sum + 1 / r, 0);
  const totalR = (Number.isFinite(rMain) ? rMain : 0) + rParallel;
  const totalCurrent = Math.min(analysis.voltage / totalR, 12);
  const branchVoltage = Math.max(0, analysis.voltage - totalCurrent * (Number.isFinite(rMain) ? rMain : 0));
  analysis.totalCurrent = totalCurrent;
  mainLoadIds.forEach(id => updateSlotElectricalState(analysis, id, totalCurrent, slotVoltage(id, totalCurrent, analysis.voltage, totalR)));
  applyBranchState(analysis, b1LoadIds, r1, branchVoltage);
  applyBranchState(analysis, b2LoadIds, r2, branchVoltage);
  markSourceAndControlPowered(analysis, totalCurrent);
}

function applyBranchState(analysis, ids, resistance, branchVoltage) {
  if (!ids.length || !Number.isFinite(resistance) || resistance <= 0) return;
  const current = Math.min(branchVoltage / resistance, 12);
  ids.forEach(id => updateSlotElectricalState(analysis, id, current, slotVoltage(id, current, branchVoltage, resistance)));
}

function equivalentSeriesResistance(ids) {
  const values = ids.map(id => componentResistance(session.circuit.slots[id], id));
  if (!values.length) return Infinity;
  if (values.some(value => value === Infinity)) return Infinity;
  return values.reduce((sum, value) => sum + value, 0);
}

function componentResistance(name, slotId) {
  const reverse = session.circuit.slotMeta?.[slotId]?.orientation === "reverse";
  if ((name === "LED" || name === "二极管") && reverse) return Infinity;
  const table = {
    导线: 0.05,
    灯泡: 120,
    LED: 80,
    二极管: 80,
    小风扇: 65,
    电机: 65,
    简易电阻: 100,
    滑动变阻器: 220,
    蜂鸣器: 85,
    保险丝: 0.5,
    电流表: 0.05,
    电压表: 1000000,
    电容: 260
  };
  return table[name] || Infinity;
}

function slotVoltage(slotId, current, fallbackVoltage, totalResistance) {
  const name = session.circuit.slots[slotId];
  if (name === "电压表") return fallbackVoltage;
  const resistance = componentResistance(name, slotId);
  if (!Number.isFinite(resistance)) return 0;
  if (name === "电流表") return 0;
  const voltage = current * resistance;
  return Math.min(fallbackVoltage, Number.isFinite(totalResistance) ? voltage : fallbackVoltage);
}

function updateSlotElectricalState(analysis, slotId, current, voltage) {
  const state = analysis.slots[slotId];
  if (!state || !state.name) return;
  state.current = current;
  state.voltage = voltage;
  state.powered = current > 0.002;
  state.glow = ["灯泡", "LED"].includes(state.name) && state.powered && !state.reverse;
  state.spinning = ["小风扇", "电机"].includes(state.name) && state.powered;
  state.buzzing = state.name === "蜂鸣器" && state.powered;
  state.blown = state.name === "保险丝" && current > 0.25;
  if (state.blown) {
    state.powered = false;
    state.glow = false;
    state.spinning = false;
    state.buzzing = false;
  }
}

function markSourceAndControlPowered(analysis, current) {
  Object.values(analysis.slots).forEach(state => {
    if (["电池", "开关"].includes(state.name)) {
      state.current = current;
      state.voltage = state.name === "电池" ? analysis.voltage : 0;
      state.powered = current > 0.002;
    }
  });
}

function circuitAnalysisSummary(analysis) {
  if (!analysis.totalCurrent) return analysis.warnings[0] || "电路还没有形成清楚的通路。";
  const amps = formatAmp(analysis.totalCurrent);
  const warnings = analysis.warnings.length ? ` ${analysis.warnings.join(" ")}` : "";
  return `教学演示已运行：电池约 ${analysis.voltage}V，总电流约 ${amps}。${warnings}`;
}

function teachingStatusPanel() {
  const analysis = session.circuit.analysis;
  if (!analysis) return "";
  const lit = Object.values(analysis.slots).filter(state => state.glow || state.spinning || state.buzzing || state.blown || (state.name === "电流表" && state.powered) || (state.name === "电压表" && state.voltage));
  if (!lit.length && !analysis.totalCurrent) return "";
  return `<div class="teaching-status">
    <strong>教学演示状态</strong>
    <span>${analysis.summary}</span>
    ${lit.map(state => `<em>${componentFriendlyName(state.name)}：${slotStatusText(state.slotId, state.name, state)}</em>`).join("")}
  </div>`;
}

function componentTeachingFace(name, state = {}) {
  const label = {
    电池: "🔋",
    开关: "⏻",
    灯泡: "💡",
    LED: "LED",
    小风扇: "✽",
    导线: "━",
    简易电阻: "Ω",
    蜂鸣器: "♪",
    电流表: "A",
    电压表: "V",
    保险丝: "F",
    二极管: "▶|",
    电容: "Ⅱ",
    电机: "M",
    滑动变阻器: "Ω↔"
  }[name] || componentIcon(name);
  const waves = state?.buzzing ? `<i></i><i></i><i></i>` : "";
  return `<span class="component-face" aria-hidden="true"><b>${label}</b>${waves}</span>`;
}

function componentDisplayName(name, state = {}) {
  if (name === "LED" && state.reverse) return "LED 反接";
  if (name === "二极管" && state.reverse) return "二极管反接";
  return name;
}

function slotStatusText(slotId, name, state = {}) {
  if (!state || !state.name) return componentTip(name);
  if (name === "开关") return state.switchClosed === false ? "开关已断开，电流过不去" : "开关已闭合，电流可以通过";
  if (name === "电流表") return state.powered ? `读数约 ${formatAmp(state.current)}` : "等待通电后显示电流";
  if (name === "电压表") return state.voltage ? `读数约 ${formatVolt(state.voltage)}` : "等待通电后显示电压";
  if (name === "保险丝" && state.blown) return "电流过大，保险丝已熔断";
  if ((name === "LED" || name === "二极管") && state.reverse) return "当前反接，这一路不导通";
  if (name === "灯泡") return state.glow ? "小灯泡亮起来了" : "有电流后会发光";
  if (name === "LED") return state.glow ? "LED 正接发光" : "正接并通电后发光";
  if (name === "小风扇") return state.spinning ? "小风扇正在转动" : "通电后会转动";
  if (name === "电机") return state.spinning ? "电机正在转动" : "通电后会转动";
  if (name === "蜂鸣器") return state.buzzing ? "蜂鸣器正在提示" : "通电后会发声";
  if (state.powered && slotKind(slotId) === "load") return `通过电流约 ${formatAmp(state.current)}`;
  return componentTip(name);
}

function directionControl(slotId, name) {
  if (!["LED", "二极管"].includes(name)) return "";
  const meta = ensureSlotMeta(slotId, name);
  return `<button class="direction-toggle" onclick="toggleSlotDirection(event,'${slotId}')">${meta.orientation === "reverse" ? "改为正接" : "改为反接"}</button>`;
}

function switchControl(slotId, name) {
  if (name !== "开关") return "";
  const meta = ensureSlotMeta(slotId, name);
  return `<button class="switch-toggle ${meta.closed === false ? "open" : "closed"}" onclick="toggleSlotSwitch(event,'${slotId}')">${meta.closed === false ? "闭合开关" : "断开开关"}</button>`;
}

function switchIsClosed(slotId) {
  return ensureSlotMeta(slotId, "开关").closed !== false;
}

function componentClass(name) {
  const map = {
    电池: "component-battery",
    开关: "component-switch",
    灯泡: "component-bulb",
    LED: "component-led",
    小风扇: "component-fan",
    蜂鸣器: "component-buzzer",
    电流表: "component-ammeter",
    电压表: "component-voltmeter",
    保险丝: "component-fuse",
    二极管: "component-diode",
    电机: "component-motor"
  };
  return map[name] || "component-passive";
}

function formatAmp(value) {
  if (!Number.isFinite(value) || value <= 0) return "0 A";
  if (value < 1) return `${Math.round(value * 1000)} mA`;
  return `${value.toFixed(2)} A`;
}

function formatVolt(value) {
  if (!Number.isFinite(value) || value <= 0) return "0 V";
  return `${value.toFixed(1)} V`;
}

function freeCircuitCanvas() {
  return `<div class="canvas builder-canvas" ondragover="allowCircuitDrop(event)" ondrop="dropOnCircuitCanvas(event)">
    <div class="free-lab-note">可任意摆放和连线，串并联识别请使用上方结构化模式。</div>
    <div class="canvas-pika">${diantuantuan(session.circuit.diagnosis.includes("通过") ? "happy" : "guide", true)}</div>
    ${wireLayer()}
    ${session.circuit.nodes.map(nodeView).join("")}
    ${session.circuit.nodes.length ? "" : `<div class="canvas-empty">把左侧元件拖到这里，再点击元件两侧小圆点连线。</div>`}
  </div>`;
}

function equivalentPanel() {
  const notes = circuitEquivalentNotes();
  if (!notes.length) return "";
  return `<div class="equivalent-list"><strong>电路模拟器说明</strong>${notes.map(note => `<span>${note}</span>`).join("")}</div>`;
}

function circuitJsReferencePanel() {
  return `<details class="circuitjs-reference" ${session.circuit.simulatorOpen ? "open" : ""} ontoggle="setCircuitSimulatorOpen(this.open)">
    <summary>
      <strong data-simulator-toggle-label>${circuitSimulatorToggleLabel()}</strong>
      <span>专业仿真会把灯泡、电机等教学元件换成真实教学元件</span>
    </summary>
    ${equivalentPanel()}
    <h3 class="sim-title">电路模拟器</h3>
    <div class="circuitjs-shell">
      <iframe class="circuitjs-frame" src="${circuitJsUrl()}" title="电路模拟器" loading="lazy"></iframe>
    </div>
  </details>`;
}

function circuitSimulatorToggleLabel(open = session.circuit.simulatorOpen) {
  return open ? "收起电路模拟器" : "查看电路模拟器";
}

function setCircuitSimulatorOpen(open) {
  session.circuit.simulatorOpen = open;
  const label = document.querySelector("[data-simulator-toggle-label]");
  if (label) label.textContent = circuitSimulatorToggleLabel(open);
  requestAnimationFrame(syncScaledPageHeight);
}

function circuitJsUrl(cctText = buildCircuitJsText()) {
  const params = new URLSearchParams({
    hideMenu: "true",
    hideSidebar: "true",
    editable: "true",
    running: "true",
    whiteBackground: "true"
  });
  params.set("cct", cctText);
  return `${CUSTOM_CIRCUIT_SIMULATOR_URL}?${params.toString()}`;
}

function buildCircuitJsText() {
  return buildStructuredCircuitJsText();
}

function buildFreeCircuitJsText(nodes) {
  const names = nodes.length ? nodes.map(n => n.name) : ["电池", "开关", "灯泡"];
  const hasWireOnly = names.includes("导线") && names.length <= 2;
  if (hasWireOnly) {
    return [
      "$ 1 0.000005 10.20027730826997 50 5 50",
      "v 176 288 176 160 0 0 40 5 0 0 0.5",
      "w 176 160 352 160 0",
      "w 352 160 352 288 0",
      "w 352 288 176 288 0"
    ].join("\n");
  }

  const chain = names.filter(name => name !== "导线");
  const sourceIndex = chain.indexOf("电池");
  if (sourceIndex > 0) chain.unshift(chain.splice(sourceIndex, 1)[0]);
  if (!chain.includes("电池")) chain.unshift("电池");
  if (chain.length === 1) chain.push("灯泡");

  const lines = ["$ 1 0.000005 10.20027730826997 50 5 50"];
  const topY = 160;
  const bottomY = 288;
  const startX = 176;
  const step = 96;
  lines.push(`v ${startX} ${bottomY} ${startX} ${topY} 0 0 40 5 0 0 0.5`);

  let x = startX;
  chain.filter(name => name !== "电池").forEach((name, index) => {
    const nextX = x + step;
    lines.push(circuitJsElementLine(name, x, topY, nextX, topY, index));
    x = nextX;
  });

  lines.push(`w ${x} ${topY} ${x} ${bottomY} 0`);
  lines.push(`w ${x} ${bottomY} ${startX} ${bottomY} 0`);
  return lines.join("\n");
}

function buildStructuredCircuitJsText() {
  ensureCircuitSlots();
  if (session.circuit.mode === "parallel") return buildParallelCircuitJsText();
  if (session.circuit.mode === "mixed") return buildMixedCircuitJsText();
  return buildSeriesCircuitJsText();
}

function buildSeriesCircuitJsText() {
  const chain = slotCircuitItems(slotIdsForArea("main").filter(id => id !== "source"));
  return buildCircuitLoop(chain.length ? chain : ["开关", "灯泡"], 160, 160, 320);
}

function buildParallelCircuitJsText() {
  const main = slotCircuitItems(slotIdsForArea("main").filter(id => id !== "source"));
  const branch1 = slotCircuitItems(slotIdsForArea("b1"));
  const branch2 = slotCircuitItems(slotIdsForArea("b2"));
  return buildParallelLines(main.length ? main : ["开关"], branch1.length ? branch1 : ["灯泡"], branch2.length ? branch2 : ["灯泡"]);
}

function buildMixedCircuitJsText() {
  const main = slotCircuitItems(slotIdsForArea("main").filter(id => id !== "source"));
  const branch1 = slotCircuitItems(slotIdsForArea("b1"));
  const branch2 = slotCircuitItems(slotIdsForArea("b2"));
  return buildParallelLines(main.length ? main : ["开关", "简易电阻"], branch1.length ? branch1 : ["灯泡"], branch2.length ? branch2 : ["灯泡"]);
}

function buildCircuitLoop(chain, startX, topY, bottomY) {
  const lines = ["$ 1 0.000005 10.20027730826997 50 5 50"];
  const step = 104;
  lines.push(`v ${startX} ${bottomY} ${startX} ${topY} 0 0 40 5 0 0 0.5`);
  let x = startX;
  chain.filter(item => circuitItemName(item) !== "电池").forEach((item, index) => {
    const nextX = x + step;
    lines.push(circuitJsElementLine(item, x, topY, nextX, topY, index));
    x = nextX;
  });
  lines.push(`w ${x} ${topY} ${x} ${bottomY} 0`);
  lines.push(`w ${x} ${bottomY} ${startX} ${bottomY} 0`);
  return lines.join("\n");
}

function buildParallelLines(main, branch1, branch2) {
  const lines = ["$ 1 0.000005 10.20027730826997 50 5 50"];
  const sourceX = 144;
  const topY = 208;
  const bottomY = 336;
  const splitX = 392;
  const joinX = 704;
  const mainStep = 104;
  lines.push(`v ${sourceX} ${bottomY} ${sourceX} ${topY} 0 0 40 5 0 0 0.5`);
  let x = sourceX;
  main.filter(item => circuitItemName(item) !== "电池").forEach((item, index) => {
    const nextX = x + mainStep;
    lines.push(circuitJsElementLine(item, x, topY, nextX, topY, index));
    x = nextX;
  });
  if (x > splitX - 24) {
    const shift = x - splitX + 72;
    return buildParallelLinesWithWidth(main, branch1, branch2, splitX + shift, joinX + shift);
  }
  lines.push(`w ${x} ${topY} ${splitX} ${topY} 0`);
  lines.push(`w ${splitX} ${topY} ${splitX} ${topY - 72} 0`);
  lines.push(`w ${splitX} ${topY} ${splitX} ${topY + 72} 0`);
  lines.push(...branchCircuitLines(branch1, splitX, topY - 72, joinX, 10));
  lines.push(...branchCircuitLines(branch2, splitX, topY + 72, joinX, 20));
  lines.push(`w ${joinX} ${topY - 72} ${joinX} ${topY} 0`);
  lines.push(`w ${joinX} ${topY} ${joinX} ${topY + 72} 0`);
  lines.push(`w ${joinX} ${topY + 72} ${joinX} ${bottomY} 0`);
  lines.push(`w ${joinX} ${bottomY} ${sourceX} ${bottomY} 0`);
  return lines.join("\n");
}

function buildParallelLinesWithWidth(main, branch1, branch2, splitX, joinX) {
  const lines = ["$ 1 0.000005 10.20027730826997 50 5 50"];
  const sourceX = 144;
  const topY = 208;
  const bottomY = 336;
  const mainStep = 104;
  lines.push(`v ${sourceX} ${bottomY} ${sourceX} ${topY} 0 0 40 5 0 0 0.5`);
  let x = sourceX;
  main.filter(item => circuitItemName(item) !== "电池").forEach((item, index) => {
    const nextX = x + mainStep;
    lines.push(circuitJsElementLine(item, x, topY, nextX, topY, index));
    x = nextX;
  });
  lines.push(`w ${x} ${topY} ${splitX} ${topY} 0`);
  lines.push(`w ${splitX} ${topY} ${splitX} ${topY - 72} 0`);
  lines.push(`w ${splitX} ${topY} ${splitX} ${topY + 72} 0`);
  lines.push(...branchCircuitLines(branch1, splitX, topY - 72, joinX, 10));
  lines.push(...branchCircuitLines(branch2, splitX, topY + 72, joinX, 20));
  lines.push(`w ${joinX} ${topY - 72} ${joinX} ${topY} 0`);
  lines.push(`w ${joinX} ${topY} ${joinX} ${topY + 72} 0`);
  lines.push(`w ${joinX} ${topY + 72} ${joinX} ${bottomY} 0`);
  lines.push(`w ${joinX} ${bottomY} ${sourceX} ${bottomY} 0`);
  return lines.join("\n");
}

function branchCircuitLines(items, x1, y, x2, offset) {
  const filtered = items.filter(item => circuitItemName(item) !== "电池");
  if (!filtered.length || (filtered.length === 1 && circuitItemName(filtered[0]) === "导线")) return [`w ${x1} ${y} ${x2} ${y} 0`];
  const lines = [];
  const step = Math.floor((x2 - x1) / filtered.length);
  let x = x1;
  filtered.forEach((item, index) => {
    const nextX = index === filtered.length - 1 ? x2 : x + step;
    lines.push(circuitJsElementLine(item, x, y, nextX, y, offset + index));
    x = nextX;
  });
  return lines;
}

function circuitJsElementLine(item, x1, y1, x2, y2, index) {
  const name = circuitItemName(item);
  const meta = circuitItemMeta(item, name);
  const reversed = ["LED", "二极管"].includes(name) && meta?.orientation === "reverse";
  const ax1 = reversed ? x2 : x1;
  const ay1 = reversed ? y2 : y1;
  const ax2 = reversed ? x1 : x2;
  const ay2 = reversed ? y1 : y2;
  switch (name) {
    case "导线":
      return `w ${x1} ${y1} ${x2} ${y2} 0`;
    case "开关":
      return `s ${x1} ${y1} ${x2} ${y2} 0 ${meta?.closed === false ? 1 : 0} false`;
    case "灯泡":
      return `900 ${x1} ${y1} ${x2} ${y2} 0 300.0 0.15 3.0 0.4 0.4`;
    case "LED":
      return `901 ${ax1} ${ay1} ${ax2} ${ay2} 0 1.0 0.85 0.05 0.006`;
    case "二极管":
      return `d ${ax1} ${ay1} ${ax2} ${ay2} 2 default`;
    case "电容":
      return `c ${x1} ${y1} ${x2} ${y2} 0 0.000015 0`;
    case "小风扇":
      return `903 ${x1} ${y1} ${x2} ${y2} 0 0.2 8.0 0.15 0.15 0.02 0.05 1.0 0.0`;
    case "电机":
      return `902 ${x1} ${y1} ${x2} ${y2} 0 0.2 8.0 0.15 0.15 0.02 0.05 1.0 0.0`;
    case "电流表":
      return `906 ${x1} ${y1} ${x2} ${y2} 0 0 0`;
    case "电压表":
      return `907 ${x1} ${y1} ${x2} ${y2} 1 0 0`;
    case "保险丝":
      return `905 ${x1} ${y1} ${x2} ${y2} 0 0.0613 0.02 0.0 false`;
    case "蜂鸣器":
      return `904 ${x1} ${y1} ${x2} ${y2} 0 80.0`;
    case "滑动变阻器":
      return `r ${x1} ${y1} ${x2} ${y2} 0 250`;
    case "简易电阻":
      return `r ${x1} ${y1} ${x2} ${y2} 0 100`;
    default:
      return `r ${x1} ${y1} ${x2} ${y2} 0 ${100 + index * 20}`;
  }
}

function componentTip(name) {
  const tips = {
    电池: "给电路提供能量。",
    开关: "控制电路通断。",
    灯泡: "电流通过时会发光，电流越明显灯越亮。",
    LED: "有正负极，实验时要串联保护电阻。",
    小风扇: "把电能转成运动，通电后会转起来。",
    导线: "连接元件的电流道路。",
    简易电阻: "限制电流，保护 LED 等元件。",
    蜂鸣器: "通电后发声，画布会显示声波提示。",
    电流表: "测电流，通常串联接入。",
    电压表: "测电压，通常并联接入。",
    保险丝: "电流异常时保护电路。",
    二极管: "只允许电流主要朝一个方向通过。",
    电容: "可以暂时储存电荷。",
    电机: "把电能转成机械运动，通电后显示 M 转动。",
    滑动变阻器: "可以改变电阻大小。"
  };
  return tips[name] || "低压安全实验元件。";
}

function componentIcon(name) {
  const icons = { 电池: "🔋", 开关: "🔘", 灯泡: "💡", LED: "🔆", 小风扇: "🌀", 导线: "━", 简易电阻: "▭", 蜂鸣器: "🔔", 电流表: "A", 电压表: "V", 保险丝: "🛡", 二极管: "▶", 电容: "Ⅱ", 电机: "⚙", 滑动变阻器: "↔" };
  return icons[name] || "⚡";
}

function addComponent(name) {
  if (isStructuredCircuit()) {
    placeComponentInFirstSlot(name);
    render();
    return;
  }
  const i = session.circuit.nodes.length;
  session.circuit.nodes.push({ id: Date.now() + i, name, x: 42 + (i % 4) * 132, y: 64 + Math.floor(i / 4) * 110 });
  session.circuit.diagnosis = `电团团拍手：已添加「${name}」。${componentTip(name)}`;
  render();
}

function placeComponentInFirstSlot(name) {
  ensureCircuitSlots();
  const target = candidateSlotsFor(name).find(id => Object.prototype.hasOwnProperty.call(session.circuit.slots, id) && !session.circuit.slots[id]);
  if (!target) {
    session.circuit.diagnosis = `这个模式暂时没有适合「${name}」的空槽位。${componentSlotHint(name)}`;
    return;
  }
  setSlotComponent(target, name);
  session.circuit.analysis = null;
  session.circuit.diagnosis = `已把「${name}」放入${slotLabel(target)}。${componentTip(name)}`;
}

function candidateSlotsFor(name) {
  const slots = slotIdsForMode(session.circuit.mode);
  const selected = slotIdsForArea(session.circuit.slotTarget).filter(id => slotAcceptsComponent(id, name));
  const preferred = preferredSlotsFor(name).filter(id => slots.includes(id) && slotAcceptsComponent(id, name));
  const allAllowed = slots.filter(id => slotAcceptsComponent(id, name));
  return [...new Set([...selected, ...preferred, ...allAllowed])];
}

function preferredSlotsFor(name) {
  if (name === "电池") return ["source"];
  if (name === "开关") return ["control"];
  return slotIdsForMode(session.circuit.mode).filter(id => slotKind(id) === "load");
}

function slotKind(slotId) {
  if (slotId === "source") return "source";
  if (slotId === "control") return "control";
  return "load";
}

function componentKind(name) {
  if (name === "电池") return "source";
  if (name === "开关") return "control";
  return "load";
}

function slotAcceptsComponent(slotId, name) {
  return slotKind(slotId) === componentKind(name);
}

function slotRequirementText(slotId) {
  if (slotKind(slotId) === "source") return "电源槽要放电池哦";
  if (slotKind(slotId) === "control") return "控制槽要放开关哦";
  return "负载槽要放灯泡、小风扇、电表或电阻这些用电元件哦";
}

function componentSlotHint(name) {
  const target = componentKind(name) === "source" ? "电源槽" : componentKind(name) === "control" ? "控制槽" : "负载槽";
  return `${componentFriendlyName(name)}可以放在${target}。`;
}

function componentFriendlyName(name) {
  if (name === "灯泡") return "小灯泡";
  return name;
}

function slotLabel(id) {
  const match = slotGroupsForMode(session.circuit.mode).flatMap(group => group.slots).find(item => item.id === id);
  return match ? `「${match.label}」` : "槽位";
}

function selectCircuitAreaBySlot(slotId) {
  const area = slotAreaBySlot(slotId);
  if (!area || area.id === session.circuit.slotTarget) return;
  session.circuit.slotTarget = area.id;
  session.circuit.diagnosis = `已选中「${area.label}」，增加或删除槽位会作用在这一路。`;
  render();
}

function dragNewComponent(event, name) {
  event.dataTransfer.setData("text/plain", JSON.stringify({ type: "new", name }));
}

function dragExistingNode(event, id) {
  event.dataTransfer.setData("text/plain", JSON.stringify({ type: "move", id }));
}

function allowCircuitDrop(event) {
  event.preventDefault();
}

function dropOnCircuitSlot(event, slotId) {
  event.preventDefault();
  const raw = event.dataTransfer.getData("text/plain");
  if (!raw) return;
  const data = JSON.parse(raw);
  if (data.type !== "new") return;
  ensureCircuitSlots();
  if (!slotAcceptsComponent(slotId, data.name)) {
    session.circuit.diagnosis = `${slotRequirementText(slotId)}，${componentSlotHint(data.name)}`;
    render();
    return;
  }
  setSlotComponent(slotId, data.name);
  session.circuit.analysis = null;
  session.circuit.selectedCase = "";
  session.circuit.diagnosis = `已把「${data.name}」放入${slotLabel(slotId)}。${componentTip(data.name)}`;
  render();
}

function clearCircuitSlot(slotId) {
  ensureCircuitSlots();
  session.circuit.slots[slotId] = "";
  if (session.circuit.slotMeta) delete session.circuit.slotMeta[slotId];
  session.circuit.analysis = null;
  session.circuit.selectedCase = "";
  session.circuit.diagnosis = "已清除这个槽位，可以继续搭建。";
  render();
}

function dropOnCircuitCanvas(event) {
  event.preventDefault();
  const raw = event.dataTransfer.getData("text/plain");
  if (!raw) return;
  const data = JSON.parse(raw);
  const rect = event.currentTarget.getBoundingClientRect();
  const x = Math.max(18, Math.min(event.clientX - rect.left - 56, rect.width - 140));
  const y = Math.max(18, Math.min(event.clientY - rect.top - 38, rect.height - 96));

  if (data.type === "new") {
    session.circuit.nodes.push({ id: Date.now(), name: data.name, x, y });
    session.circuit.diagnosis = `已拖入「${data.name}」。点击元件两侧小圆点可以连线。`;
  } else if (data.type === "move") {
    const node = session.circuit.nodes.find(n => String(n.id) === String(data.id));
    if (node) {
      node.x = x;
      node.y = y;
      session.circuit.diagnosis = `已移动「${node.name}」，连线会自动跟随。`;
    }
  }
  render();
}

function nodeView(node) {
  return `<div class="node" draggable="true" ondragstart="dragExistingNode(event,'${node.id}')" style="left:${node.x}px;top:${node.y}px">
    <button class="terminal left ${isTerminalActive(node.id, "left") ? "active" : ""}" onclick="selectTerminal(event,'${node.id}','left')" title="连接左端"></button>
    <strong>${node.name}</strong>
    <small>${componentTip(node.name)}</small>
    <button class="terminal right ${isTerminalActive(node.id, "right") ? "active" : ""}" onclick="selectTerminal(event,'${node.id}','right')" title="连接右端"></button>
  </div>`;
}

function wireLayer() {
  if (!session.circuit.wires.length) return "";
  return session.circuit.wires.map(wire => {
    const n = session.circuit.nodes.find(n => String(n.id) === String(wire.from.id));
    const next = session.circuit.nodes.find(n => String(n.id) === String(wire.to.id));
    if (!n || !next) return "";
    const a = terminalPoint(n, wire.from.side);
    const b = terminalPoint(next, wire.to.side);
    const x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
    const len = Math.hypot(x2 - x1, y2 - y1), deg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return `<span class="wire" style="left:${x1}px;top:${y1}px;width:${len}px;transform:rotate(${deg}deg)"></span>`;
  }).join("");
}

function terminalPoint(node, side) {
  return {
    x: node.x + (side === "left" ? 0 : 112),
    y: node.y + 38
  };
}

function isTerminalActive(id, side) {
  const active = session.circuit.selectedTerminal;
  return active && String(active.id) === String(id) && active.side === side;
}

function selectTerminal(event, id, side) {
  event.stopPropagation();
  const current = { id, side };
  const selected = session.circuit.selectedTerminal;
  if (!selected) {
    session.circuit.selectedTerminal = current;
    session.circuit.diagnosis = "已选中一个接线端，再点另一个元件的小圆点完成连线。";
  } else if (String(selected.id) === String(id) && selected.side === side) {
    session.circuit.selectedTerminal = null;
    session.circuit.diagnosis = "已取消当前接线端选择。";
  } else {
    const exists = session.circuit.wires.some(w =>
      (String(w.from.id) === String(selected.id) && w.from.side === selected.side && String(w.to.id) === String(id) && w.to.side === side) ||
      (String(w.to.id) === String(selected.id) && w.to.side === selected.side && String(w.from.id) === String(id) && w.from.side === side)
    );
    if (!exists) session.circuit.wires.push({ from: selected, to: current });
    session.circuit.selectedTerminal = null;
    session.circuit.diagnosis = exists ? "这两个接线端已经连过啦。" : "连线完成！可以继续连接其它元件。";
  }
  render();
}

function loadCase(id) {
  const item = circuitCases.find(c => c.id === id);
  if (!item) return;
  session.circuit.mode = item.mode;
  session.circuit.selectedCase = item.name;
  session.circuit.slotTarget = firstSlotArea(item.mode).id;
  session.circuit.slotExtras = {};
  Object.entries(item.extras || {}).forEach(([areaId, count]) => setSlotExtraCount(item.mode, areaId, count));
  session.circuit.slotMeta = {};
  session.circuit.analysis = null;
  session.circuit.slots = { ...emptyCircuitSlots(item.mode), ...item.slots };
  Object.entries(session.circuit.slots).forEach(([slotId, name]) => {
    if (name) ensureSlotMeta(slotId, name);
  });
  session.circuit.nodes = [];
  session.circuit.wires = [];
  session.circuit.selectedTerminal = null;
  session.circuit.equivalents = circuitEquivalentNotes();
  session.circuit.diagnosis = `已加载「${item.name}」。${item.desc}`;
  render();
}

function runDiagnosis() {
  session.circuit.equivalents = circuitEquivalentNotes();
  session.circuit.analysis = isStructuredCircuit() ? analyzeStructuredCircuit() : null;
  if (isStructuredCircuit()) session.circuit.diagnosis = structuredDiagnosis();
  else session.circuit.diagnosis = freeDiagnosis();
  render();
}

function activeCircuitNames() {
  if (!isStructuredCircuit()) return session.circuit.nodes.map(n => n.name);
  ensureCircuitSlots();
  return Object.values(session.circuit.slots).filter(Boolean);
}

function slotValues(ids) {
  ensureCircuitSlots();
  return ids.map(id => session.circuit.slots[id]).filter(Boolean);
}

function slotCircuitItems(ids) {
  ensureCircuitSlots();
  return ids.map(id => {
    const name = session.circuit.slots[id];
    return name ? { name, slotId: id, meta: { ...ensureSlotMeta(id, name) } } : null;
  }).filter(Boolean);
}

function circuitItemName(item) {
  return typeof item === "string" ? item : item?.name;
}

function circuitItemMeta(item, name = circuitItemName(item)) {
  if (typeof item === "string") return {};
  if (item?.meta) return item.meta;
  if (item?.slotId) return ensureSlotMeta(item.slotId, name);
  return {};
}

function hasUsefulLoad(names) {
  return names.some(name => !["电池", "开关", "导线"].includes(name));
}

function branchHasLoad(ids) {
  return hasUsefulLoad(slotValues(ids));
}

function structuredDiagnosis() {
  ensureCircuitSlots();
  const analysis = session.circuit.analysis || analyzeStructuredCircuit();
  const names = activeCircuitNames();
  if (!names.length) return "先选择一个模式，再把电池、开关和负载拖进槽位。";
  if (!names.includes("电池")) return "断路提示：缺少电池，电路没有能量来源。";
  if (names.includes("导线") && names.length <= 2) return "危险提示：导线直接连接电池可能造成短路，课堂中只作为安全演示。";
  if (session.circuit.mode === "parallel" && (!branchHasLoad(slotIdsForArea("b1")) || !branchHasLoad(slotIdsForArea("b2")))) {
    return "并联电路需要两条支路都有负载，才能清楚观察并联关系。";
  }
  if (session.circuit.mode === "mixed" && (!branchHasLoad(slotIdsForArea("b1")) || !branchHasLoad(slotIdsForArea("b2")))) {
    return "串并联混合电路需要主路和两条支路都放入元件。";
  }
  if (!hasUsefulLoad(names)) return "还缺少负载：请放入灯泡、LED、小风扇、蜂鸣器、电表或电阻。";
  if (Object.entries(session.circuit.slots).some(([slotId, name]) => name === "开关" && !switchIsClosed(slotId))) {
    return "电团团提醒：开关现在是断开的，点击槽位里的“闭合开关”后再运行演示。";
  }
  if (names.includes("LED") && !names.includes("简易电阻") && !names.includes("滑动变阻器")) return "电团团提醒：LED 实验建议加入简易电阻保护，再运行更安全。";
  if (analysis.warnings.some(text => text.includes("反接"))) return `${analysis.summary} 电团团提醒：可以点 LED 或二极管上的按钮切换正接/反接。`;
  if (analysis.warnings.some(text => text.includes("保险丝"))) return `${analysis.summary} 请先减少负载或加入更合适的限流元件。`;
  if (!names.includes("开关")) return "电团团提醒：加入开关可以更安全地控制电路。";
  if (!analysis.totalCurrent) return "电路还没有形成清楚的通路，请检查是否有反接 LED、空支路或过大的电阻。";
  return `诊断通过：当前是${circuitModeLabel()}，教学画布已经显示亮灯、转动和电表估算读数。`;
}

function freeDiagnosis() {
  const names = session.circuit.nodes.map(n => n.name);
  if (!session.circuit.nodes.length) return "先从左侧拖入电池、开关、灯泡等元件，再运行演示。";
  if (!names.includes("电池")) return "断路提示：缺少电池，电路没有能量来源。";
  if (session.circuit.nodes.length > 1 && !session.circuit.wires.length) return "还没有连线：点击元件两侧小圆点，把电路连起来。";
  if (names.includes("导线") && names.length <= 2) return "危险提示：可能短路，导线直接连接电池会发热。";
  if (names.includes("LED") && !names.includes("简易电阻")) return "电团团提醒：LED 实验建议加入简易电阻保护。";
  if (!names.includes("开关")) return "电团团提醒：加入开关可以更安全地控制电路。";
  return "诊断通过：已生成下方电路模拟器仿真；若要明确讲解串并联，建议切换到结构化模式。";
}

function circuitEquivalentNotes() {
  const notes = [];
  activeCircuitNames().forEach(name => {
    const note = {
      灯泡: "灯泡会使用定制小灯泡元件。",
      LED: "LED 会使用定制 LED 元件，课堂仍按正负极讲解。",
      小风扇: "小风扇会使用定制风扇元件。",
      电机: "电机会使用定制电机元件。",
      蜂鸣器: "蜂鸣器会使用定制蜂鸣器元件。",
      保险丝: "保险丝会使用定制保险丝元件。",
      电流表: "电流表会使用定制电流表元件。",
      电压表: "电压表会使用定制电压表元件。"
    }[name];
    if (note && !notes.includes(note)) notes.push(note);
  });
  return notes;
}

function clearCanvas() {
  if (isStructuredCircuit()) {
    session.circuit.slots = emptyCircuitSlots(session.circuit.mode);
    session.circuit.slotMeta = {};
    session.circuit.analysis = null;
  }
  session.circuit.nodes = [];
  session.circuit.wires = [];
  session.circuit.selectedTerminal = null;
  session.circuit.selectedCase = "";
  session.circuit.equivalents = [];
  session.circuit.diagnosis = "画布已清空，电团团等你重新搭建。";
  render();
}

function exportCircuit() {
  session.circuit.exported = true;
  session.circuit.diagnosis = "截图导出提示已触发：当前页面可作为课堂展示留存参考。";
  render();
}

function coursesView() {
  session.course.category = "全部";
  const list = courses;
  return `${pageHero("电力科普微课", "观看电力科普微课，了解能源转型、发电方式和安全用电知识。", "listen")}
    <section class="panel">
      <div class="toolbar"><button class="active">全部</button></div>
      <div class="card-grid">${list.map(courseCard).join("")}</div>
    </section>
    ${session.course.active ? courseModal() : ""}`;
}

function courseCard(c) {
  return `<article class="content-card purple">
    <div class="video-cover real-cover">${c.cover ? `<img src="${c.cover}" alt="${c.title} 封面">` : diantuantuan("listen", true)}<span>${c.category}</span></div>
    <h2>${c.title}</h2><p>${c.desc}</p>
    <div class="tag-row"><span>${c.minutes} 分钟</span>${c.points.map(p => `<span>${p}</span>`).join("")}</div>
    ${c.bvid ? "" : `<div class="meter" data-course-meter="${c.id}"><span style="width:${session.course.progress[c.id] || 0}%"></span></div>`}
    <button class="primary course-open-button" onclick="openCourse('${c.id}')">打开微课</button>
  </article>`;
}

function openCourse(id) {
  session.course.active = id;
  session.course.paused = true;
  render();
}

function courseModal() {
  const c = courses.find(item => item.id === session.course.active);
  if (!c) return "";
  const progress = session.course.progress[c.id] || 0;
  return `<div class="modal-backdrop" onclick="closeModal(event)">
    <section class="modal wide">
      <button class="close" onclick="session.course.active=null;render()">×</button>
      ${coursePlayerHtml(c)}
      <div class="toolbar ${c.bvid ? "course-player-toolbar" : ""}">
        ${c.bvid ? `<button class="primary course-source-button" onclick="window.open('${c.bilibiliUrl}', '_blank', 'noopener')"><span>↗</span>在 B 站打开</button><span class="course-progress-text">首次打开请稍等，视频正在缓冲。</span>` : `<button class="primary" onclick="toggleCourseVideo('${c.id}')">${session.course.paused ? "播放视频" : "暂停视频"}</button><span class="course-progress-text">当前进度 ${Math.round(progress)}%</span>`}
      </div>
      <div class="mini-card"><strong>配套知识点</strong><p>${c.points.join("、")}。电团团建议看完后去小百科查一查相关词条。</p></div>
    </section>
  </div>`;
}

function coursePlayerHtml(c) {
  if (c.bvid) {
    return `<div class="course-player bilibili-player">
      <iframe class="course-bilibili-frame" src="${bilibiliPlayerUrl(c)}" title="${c.title}" allowfullscreen allow="fullscreen; picture-in-picture"></iframe>
    </div>`;
  }
  return `<div class="course-player">
    <video id="course-video-${c.id}" class="course-video-player" controls preload="metadata" poster="${c.cover || ""}" src="${c.video || ""}" onloadedmetadata="restoreCourseProgress(event,'${c.id}')" onplay="session.course.paused=false;syncCourseButton(event)" onpause="session.course.paused=true;syncCourseButton(event)" ontimeupdate="updateCourseProgress(event,'${c.id}')" onended="finishCourse('${c.id}')"></video>
  </div>`;
}

function bilibiliPlayerUrl(course) {
  const params = new URLSearchParams({
    bvid: course.bvid,
    page: String(course.page || 1),
    autoplay: "0",
    danmaku: "0",
    high_quality: "1"
  });
  return `https://player.bilibili.com/player.html?${params.toString()}`;
}

function watchCourse(id, delta) {
  session.course.paused = false;
  session.course.progress[id] = Math.max(0, Math.min(100, (session.course.progress[id] || 0) + delta));
  render();
}

function toggleCourseVideo(id) {
  const video = document.getElementById(`course-video-${id}`);
  if (!video) return;
  if (video.paused) {
    video.play();
    session.course.paused = false;
  } else {
    video.pause();
    session.course.paused = true;
  }
  const button = video.closest(".modal")?.querySelector(".toolbar .primary");
  if (button) button.textContent = video.paused ? "播放视频" : "暂停视频";
}

function syncCourseButton(event) {
  const video = event.target;
  const button = video.closest(".modal")?.querySelector(".toolbar .primary");
  if (button) button.textContent = video.paused ? "播放视频" : "暂停视频";
}

function restoreCourseProgress(event, id) {
  const video = event.target;
  const progress = session.course.progress[id] || 0;
  if (!video.duration || progress <= 0 || progress >= 99) return;
  video.currentTime = video.duration * progress / 100;
}

function updateCourseProgress(event, id) {
  const video = event.target;
  if (!video.duration) return;
  const percent = Math.max(0, Math.min(100, (video.currentTime / video.duration) * 100));
  session.course.progress[id] = percent;
  const meter = document.querySelector(`[data-course-meter="${id}"] span`);
  if (meter) meter.style.width = `${percent}%`;
  const label = document.querySelector(".course-progress-text");
  if (label) label.textContent = `当前进度 ${Math.round(percent)}%`;
}

function finishCourse(id) {
  session.course.progress[id] = 100;
  session.course.paused = true;
  const meter = document.querySelector(`[data-course-meter="${id}"] span`);
  if (meter) meter.style.width = "100%";
}

function safetyView() {
  const cats = ["全部", "家庭用电", "校园用电", "户外雷雨", "插座安全", "电器起火"];
  const list = safetyCases.filter(c => session.safetyCategory === "全部" || c.category === session.safetyCategory);
  return `${pageHero("安全用电案例", "结合生活场景认识危险行为、危害说明和预防方法。", "warn")}
    <section class="panel">
      <div class="toolbar">${cats.map(c => `<button class="${session.safetyCategory === c ? "active" : ""}" onclick="session.safetyCategory='${c}';render()">${c}</button>`).join("")}</div>
      <div class="safety-list">${list.map(item => `<article class="safety-card">
        <div class="safety-visual">${item.image ? `<img class="safety-image" src="${item.image}" alt="${item.title}">` : diantuantuan("warn")}<span>${item.category}</span></div>
        <div><h2>${item.title}</h2><p><strong>场景：</strong>${item.scene}</p></div>
        <div><p><strong>错误行为：</strong>${item.mistake}</p><p><strong>危害说明：</strong>${item.harm}</p></div>
        <div><p><strong>预防方法：</strong>${item.prevent}</p></div>
      </article>`).join("")}</div>
    </section>`;
}

function experimentsView() {
  const levels = ["全部", "低年级简易实验", "进阶手工实验"];
  const list = experiments.filter(e => session.experimentLevel === "全部" || e.level === session.experimentLevel);
  return `${pageHero("趣味电力实验", "使用低压、安全、易取得的材料开展电力小实验，建议在成年人陪同下完成。", "jump")}
    <section class="panel">
      <div class="toolbar">${levels.map(l => `<button class="${session.experimentLevel === l ? "active" : ""}" onclick="session.experimentLevel='${l}';render()">${l}</button>`).join("")}</div>
      <div class="card-grid">${list.map(expCard).join("")}</div>
    </section>`;
}

function expCard(e) {
  const open = session.expandedExperiment === e.id;
  return `<article class="content-card green">
    <div class="video-cover experiment ${e.image ? "real-cover" : ""}">${e.image ? `<img src="${e.image}" alt="${e.title}配图" loading="lazy">` : diantuantuan("fan", true)}<span>${e.level}</span></div>
    <h2>${e.title}</h2>
    <div class="tag-row">${e.materials.map(m => `<span>${m}</span>`).join("")}</div>
    <p>${e.principle}</p>
    <div class="actions">
      <button class="primary" onclick="session.expandedExperiment='${open ? "" : e.id}';render()">${open ? "收起步骤" : "展开步骤"}</button>
      <button onclick="copyMaterials('${e.id}')">复制材料清单</button>
    </div>
    ${open ? `<ol class="steps">${e.steps.map(s => `<li>${s}</li>`).join("")}</ol>` : ""}
  </article>`;
}

function copyMaterials(id) {
  const e = experiments.find(item => item.id === id);
  const text = `${e.title}材料清单：${e.materials.join("、")}`;
  navigator.clipboard?.writeText(text);
  openModal("材料清单已准备好", `<div class="talk">${diantuantuan("happy", true)}<p>${text}</p></div>`);
}

function encyclopediaView() {
  const cats = ["全部", "电气元件", "家用电器", "电力基础名词", "安全用电术语"];
  const hot = encyclopedia.slice(0, 6);
  return `${pageHero("电气小百科", "搜索电气名词、家用电器和安全术语，用白话认识身边的电。", "book")}
    <section class="ency-layout">
      <aside class="panel side">
        <h2>分类</h2>
        ${cats.map(c => `<button class="${session.encyclopedia.category === c ? "active" : ""}" onclick="setEncyclopediaCategory('${c}')">${c}</button>`).join("")}
        <div class="hot"><strong>热门词条</strong>${hot.map(t => `<button onclick="openTerm('${t.id}')">${t.title}</button>`).join("")}</div>
      </aside>
      <div class="panel">
        <label class="search"><span>⚡</span><input placeholder="输入：电池、短路、台灯、地线..." value="${session.encyclopedia.keyword}" oninput="updateEncyclopediaKeyword(this.value)"></label>
        <div id="ency-results">${encyclopediaResultsHtml()}</div>
      </div>
    </section>
    ${session.encyclopedia.active ? termModal() : ""}`;
}

function setEncyclopediaCategory(category) {
  session.encyclopedia.category = category;
  session.encyclopedia.active = null;
  render();
}

function updateEncyclopediaKeyword(value) {
  session.encyclopedia.keyword = value;
  const results = document.getElementById("ency-results");
  if (results) results.innerHTML = encyclopediaResultsHtml();
  requestAnimationFrame(syncScaledPageHeight);
}

function encyclopediaResultsHtml() {
  const hot = encyclopedia.slice(0, 6);
  const keyword = session.encyclopedia.keyword.trim().toLocaleLowerCase();
  const list = encyclopedia.filter(item => {
    const inCategory = session.encyclopedia.category === "全部" || item.category === session.encyclopedia.category;
    const haystack = `${item.category}${item.title}${item.definition}${item.life}${item.safety}`.toLocaleLowerCase();
    return inCategory && (!keyword || haystack.includes(keyword));
  });
  return list.length
    ? `<div class="card-grid">${list.map(termCard).join("")}</div>`
    : `<div class="empty">${diantuantuan("confused")}<strong>电团团没有找到这个词。</strong><p>可以试试：${hot.map(t => t.title).join("、")}</p></div>`;
}

function termCard(t) {
  return `<button class="term-card" onclick="openTerm('${t.id}')">
    <span class="term-thumb">${termImageHtml(t, t.title)}</span>
    <span class="term-category">${t.category}</span>
    <strong>${t.title}</strong>
    <p>${t.definition}</p>
  </button>`;
}

function termImageHtml(term, alt) {
  return term.image
    ? `<img src="${term.image}" alt="${alt}" loading="lazy">`
    : diantuantuan("book", true);
}

function openTerm(id) {
  session.encyclopedia.active = id;
  render();
}

function termModal() {
  const t = encyclopedia.find(item => item.id === session.encyclopedia.active);
  return `<div class="modal-backdrop" onclick="closeModal(event)">
    <section class="modal term-detail">
      <button class="close" onclick="session.encyclopedia.active=null;render()">×</button>
      <div class="term-detail-visual">
        ${termImageHtml(t, t.title)}
        <p class="bubble">电团团翻开百科全书啦！</p>
      </div>
      <div>
        <span class="pill">${t.category}</span>
        <h2>${t.title}</h2>
        <p><strong>白话解释：</strong>${t.definition}</p>
        <p><strong>生活场景：</strong>${t.life}</p>
        <p><strong>安全提示：</strong>${t.safety}</p>
      </div>
    </section>
  </div>`;
}

function openModal(title, body) {
  const existing = document.querySelector(".modal-backdrop");
  if (existing) existing.remove();
  document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" onclick="closeDetachedModal(event)"><section class="modal"><button class="close" onclick="this.closest('.modal-backdrop').remove()">×</button><h2>${title}</h2>${body}</section></div>`);
}

function openPublicCard(type) {
  const data = {
    college: {
      title: "关注东南大学电气工程学院",
      src: "./assets/team/college-public.jpg",
      alt: "东南大学电气工程学院公众号二维码"
    },
    team: {
      title: "关注电织云梦实践团",
      src: "./assets/team/team-public.jpg",
      alt: "电织云梦实践团公众号二维码"
    }
  }[type];
  if (!data) return;
  openModal(data.title, `<div class="public-card-modal"><img class="public-card-img" src="${data.src}" alt="${data.alt}"><p class="public-card-tip">可扫码关注，了解更多公益科普与支教动态。</p></div>`);
}

function closeModal(event) {
  if (event.target.classList.contains("modal-backdrop")) {
    session.course.active = null;
    session.encyclopedia.active = null;
    render();
  }
}

function closeDetachedModal(event) {
  if (event.target.classList.contains("modal-backdrop")) event.target.remove();
}

render();


