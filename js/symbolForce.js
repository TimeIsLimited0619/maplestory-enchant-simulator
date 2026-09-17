/**
 * 神秘／真實符文成長、主屬、地圖 Force 倍率。
 * WZ 只有 Lv.1 incARC／incAUT；經驗、楓幣、主屬表依官方公式／Wiki。
 */
const SymbolForce = (() => {
  const ARC_IDS = [
    '01712001', '01712002', '01712003', '01712004', '01712005', '01712006',
  ];
  const AUT_IDS = [
    '01713000', '01713001', '01713002', '01713003', '01713004', '01713005',
  ];
  const GRAND_IDS = [
    '01714000', '01714001', '01714002',
  ];

  const SLOT_BY_ID = Object.create(null);
  ARC_IDS.forEach((id, i) => { SLOT_BY_ID[id] = `arc-${i}`; });
  AUT_IDS.forEach((id, i) => { SLOT_BY_ID[id] = `aut-${i}`; });
  GRAND_IDS.forEach((id, i) => { SLOT_BY_ID[id] = `grand-${i}`; });

  const ARC_MAX = 20;
  const AUT_MAX = 11;

  /** DigitalTQ／Destiny 後神秘徽章楓幣（index 0 = Lv.1→2） */
  const ARC_MESO = [
    [970000, 1230000, 1660000, 2260000, 3060000, 4040000, 5220000, 6600000, 8180000, 9990000, 12010000, 14260000, 16740000, 19450000, 22420000, 25630000, 29100000, 32830000, 36820000],
    [1210000, 1530000, 2060000, 2800000, 3780000, 4980000, 6420000, 8100000, 10020000, 12210000, 14650000, 17360000, 20340000, 23590000, 27140000, 30970000, 35100000, 39530000, 44260000],
    [1450000, 1830000, 2460000, 3340000, 4500000, 5920000, 7620000, 9600000, 11860000, 14430000, 17290000, 20460000, 23940000, 27730000, 31860000, 36310000, 41100000, 46230000, 51700000],
    [1690000, 2130000, 2860000, 3880000, 5220000, 6860000, 8820000, 11100000, 13700000, 16650000, 19930000, 23560000, 27540000, 31870000, 36580000, 41650000, 47100000, 52930000, 59140000],
    [1930000, 2430000, 3260000, 4420000, 5940000, 7800000, 10020000, 12600000, 15540000, 18870000, 22570000, 26660000, 31140000, 36010000, 41300000, 46990000, 53100000, 59630000, 66580000],
    [2170000, 2730000, 3660000, 4960000, 6660000, 8740000, 11220000, 14100000, 17380000, 21090000, 25210000, 29760000, 34740000, 40150000, 46020000, 52330000, 59100000, 66330000, 74020000],
  ];

  /** 豪華真實：塔拉哈特表（兩顆共用） */
  const GRAND_MESO = [
    113600000, 293300000, 535800000, 837700000, 1196000000,
    1607200000, 2068300000, 2576000000, 3126900000, 3718000000,
  ];

  function padId(itemId) {
    const n = numericEquipId(itemId);
    if (!n) return '';
    return String(n).padStart(8, '0');
  }

  function numericEquipId(itemId) {
    if (typeof window !== 'undefined' && typeof window.numericEquipId === 'function') {
      return window.numericEquipId(itemId);
    }
    const n = Number(String(itemId || '').replace(/^0+/, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function kindOf(itemId, item) {
    const fromItem = item?.subType;
    if (fromItem === 'arcaneSymbol' || fromItem === 'authenticSymbol' || fromItem === 'grandSymbol') {
      return fromItem;
    }
    if (typeof resolveSymbolKind === 'function') {
      return resolveSymbolKind(itemId, item) || '';
    }
    const n = numericEquipId(itemId);
    if (n >= 1714000 && n <= 1714999) return 'grandSymbol';
    if (n >= 1713000 && n <= 1713999) return 'authenticSymbol';
    if (n >= 1712000 && n <= 1712999) return 'arcaneSymbol';
    return '';
  }

  function forceKind(kind) {
    return kind === 'arcaneSymbol' ? 'arc' : (kind ? 'aut' : '');
  }

  function maxLevel(kind) {
    return kind === 'arcaneSymbol' ? ARC_MAX : AUT_MAX;
  }

  function slotForItemId(itemId) {
    const id = padId(itemId);
    return SLOT_BY_ID[id] || '';
  }

  function itemIdForSlot(slotId) {
    const key = String(slotId || '');
    const found = Object.keys(SLOT_BY_ID).find((id) => SLOT_BY_ID[id] === key);
    return found || '';
  }

  function regionIndex(itemId, kind) {
    const n = numericEquipId(itemId);
    if (kind === 'arcaneSymbol') return Math.max(0, Math.min(5, n - 1712001));
    if (kind === 'authenticSymbol') return Math.max(0, Math.min(5, n - 1713000));
    if (kind === 'grandSymbol') return Math.max(0, Math.min(2, n - 1714000));
    return 0;
  }

  function expToNext(kind, level) {
    const lv = Math.floor(Number(level) || 0);
    if (kind === 'arcaneSymbol') {
      if (lv < 1 || lv >= ARC_MAX) return 0;
      return (lv * lv) + 11;
    }
    if (lv < 1 || lv >= AUT_MAX) return 0;
    return (9 * lv * lv) + (20 * lv);
  }

  function mesoToNext(itemId, kind, level) {
    const lv = Math.floor(Number(level) || 0);
    if (kind === 'arcaneSymbol') {
      if (lv < 1 || lv >= ARC_MAX) return 0;
      const row = ARC_MESO[regionIndex(itemId, kind)] || ARC_MESO[0];
      return Number(row[lv - 1]) || 0;
    }
    if (kind === 'grandSymbol') {
      if (lv < 1 || lv >= AUT_MAX) return 0;
      return Number(GRAND_MESO[lv - 1]) || 0;
    }
    if (kind === 'authenticSymbol') {
      if (lv < 1 || lv >= AUT_MAX) return 0;
      const need = expToNext(kind, lv);
      const a = 13.2 + (1.8 * regionIndex(itemId, kind));
      return 100000 * Math.floor(need * (a - (0.6 * lv)));
    }
    return 0;
  }

  function clampLevel(kind, level) {
    const max = maxLevel(kind);
    const lv = Math.floor(Number(level) || 1);
    if (lv < 1) return 1;
    if (lv > max) return max;
    return lv;
  }

  function normalizeState(itemId, state, item) {
    const kind = kindOf(itemId, item);
    const src = state && typeof state === 'object' ? state : {};
    const level = kind ? clampLevel(kind, src.symbolLevel || 1) : 1;
    const exp = Math.max(0, Math.floor(Number(src.symbolExp) || 0));
    return { ...src, symbolLevel: level, symbolExp: exp };
  }

  function jobProfile() {
    const jobName = (typeof CharacterSkills !== 'undefined'
      && typeof CharacterSkills.getCombatJobNameForCurrentLine === 'function')
      ? (CharacterSkills.getCombatJobNameForCurrentLine() || '')
      : (typeof CharacterCombatPanel !== 'undefined'
        ? (CharacterCombatPanel.getState?.()?.jobName || '')
        : '');
    if (jobName === '傑諾') return { mode: 'xenon', labels: ['STR', 'DEX', 'LUK'] };
    if (jobName === '惡魔復仇者') return { mode: 'da', labels: ['最大HP'] };
    let labels = { main: 'STR' };
    if (typeof CombatJobs !== 'undefined' && typeof CombatJobs.getJobStatLabelsByName === 'function') {
      labels = CombatJobs.getJobStatLabelsByName(jobName) || labels;
    }
    const main = labels.main === 'HP' ? '最大HP' : (labels.main || 'STR');
    return { mode: 'main', labels: [main] };
  }

  function statsAtLevel(kind, level) {
    const lv = clampLevel(kind, level);
    if (kind === 'arcaneSymbol') {
      return {
        arc: 30 + ((lv - 1) * 10),
        aut: 0,
        main: 300 + ((lv - 1) * 100),
        xenon: 144 + ((lv - 1) * 48),
        daHp: 6300 + ((lv - 1) * 2100),
      };
    }
    if (kind === 'authenticSymbol') {
      return {
        arc: 0,
        aut: 10 + ((lv - 1) * 10),
        main: 500 + ((lv - 1) * 200),
        xenon: 240 + ((lv - 1) * 96),
        daHp: 10500 + ((lv - 1) * 4200),
      };
    }
    if (kind === 'grandSymbol') {
      return {
        arc: 0,
        aut: 10 + ((lv - 1) * 10),
        main: 0,
        xenon: 0,
        daHp: 0,
      };
    }
    return { arc: 0, aut: 0, main: 0, xenon: 0, daHp: 0 };
  }

  function mainStatMap(kind, level, profile) {
    const st = statsAtLevel(kind, level);
    const out = { STR: 0, DEX: 0, INT: 0, LUK: 0, 最大HP: 0 };
    if (!kind || kind === 'grandSymbol') return out;
    const job = profile || jobProfile();
    if (job.mode === 'xenon') {
      out.STR = st.xenon;
      out.DEX = st.xenon;
      out.LUK = st.xenon;
      return out;
    }
    if (job.mode === 'da') {
      out.最大HP = st.daHp;
      return out;
    }
    const key = job.labels[0] || 'STR';
    if (key === '最大HP') out.最大HP = st.daHp;
    else if (out[key] != null) out[key] = st.main;
    else out.STR = st.main;
    return out;
  }

  function inspect(itemId, state, item) {
    const kind = kindOf(itemId, item);
    const norm = normalizeState(itemId, state, item);
    const level = kind ? norm.symbolLevel : 0;
    const exp = kind ? norm.symbolExp : 0;
    const need = kind ? expToNext(kind, level) : 0;
    const st = statsAtLevel(kind, level);
    const job = jobProfile();
    const mains = mainStatMap(kind, level, job);
    const max = kind ? maxLevel(kind) : 0;
    const atMax = !!(kind && level >= max);
    return {
      kind,
      forceKind: forceKind(kind),
      slotId: slotForItemId(itemId),
      level,
      exp,
      need,
      maxLevel: max,
      atMax,
      canEnhance: !!(kind && !atMax && need > 0 && exp >= need),
      meso: mesoToNext(itemId, kind, level),
      arc: st.arc,
      aut: st.aut,
      mains,
      job,
      displayMain: job.mode === 'xenon'
        ? st.xenon
        : (job.mode === 'da' ? st.daHp : (kind === 'grandSymbol' ? 0 : st.main)),
    };
  }

  function expValue(itemId, state, item) {
    const kind = kindOf(itemId, item);
    if (!kind) return 0;
    const norm = normalizeState(itemId, state, item);
    let n = 1 + norm.symbolExp;
    for (let lv = 1; lv < norm.symbolLevel; lv += 1) n += expToNext(kind, lv);
    return n;
  }

  function wornEntries() {
    if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.getSymbolWearEntries === 'function') {
      return UiEquipModule.getSymbolWearEntries() || [];
    }
    return [];
  }

  function totals(entries) {
    const list = Array.isArray(entries) ? entries : wornEntries();
    const job = jobProfile();
    const out = {
      arc: 0,
      aut: 0,
      mains: { STR: 0, DEX: 0, INT: 0, LUK: 0, 最大HP: 0 },
      displayMain: 0,
      job,
    };
    list.forEach((entry) => {
      if (!entry?.itemId) return;
      const info = inspect(entry.itemId, entry.state);
      out.arc += info.arc;
      out.aut += info.aut;
      Object.keys(out.mains).forEach((k) => {
        out.mains[k] += Number(info.mains[k]) || 0;
      });
    });
    if (job.mode === 'xenon') out.displayMain = out.mains.STR;
    else if (job.mode === 'da') out.displayMain = out.mains.最大HP;
    else out.displayMain = out.mains[job.labels[0]] || 0;
    return out;
  }

  function hyperArc() {
    if (typeof CharacterProgression === 'undefined' || typeof CharacterProgression.getCombatBonus !== 'function') {
      return 0;
    }
    return Math.max(0, Number(CharacterProgression.getCombatBonus().arcane) || 0);
  }

  function totalArc(entries) {
    return totals(entries).arc + hyperArc();
  }

  function totalAut(entries) {
    return totals(entries).aut;
  }

  /** TMS v217＋：自身 ARC／地圖需求，比例無條件捨去。150%＋受擊為 0（強制扣 1）。 */
  function arcDealtPct(ratioFloor) {
    const r = Math.max(0, Math.floor(Number(ratioFloor) || 0));
    if (r < 10) return 10;
    if (r < 30) return 30;
    if (r < 50) return 60;
    if (r < 70) return 70;
    if (r < 100) return 80;
    if (r < 110) return 100;
    if (r < 130) return 110;
    if (r < 150) return 130;
    return 150;
  }

  function arcTakenMult(ratioFloor) {
    const r = Math.max(0, Math.floor(Number(ratioFloor) || 0));
    if (r < 10) return 2.8;
    if (r < 30) return 2.4;
    if (r < 50) return 1.8;
    if (r < 70) return 1.6;
    if (r < 100) return 1.4;
    if (r < 110) return 1;
    if (r < 130) return 0.8;
    if (r < 150) return 0.4;
    return 0;
  }

  function autDealtPct(diff) {
    const d = Math.floor(Number(diff) || 0);
    if (d <= -95) return 5;
    if (d < 0) return Math.max(5, 100 + d);
    const bonus = Math.min(25, Math.floor(d / 2));
    return 100 + bonus;
  }

  function autTakenMult(diff) {
    const d = Math.floor(Number(diff) || 0);
    if (d <= -51) return 2;
    if (d < 0) return 1.5;
    return 1;
  }

  function readZoneReq(zone) {
    if (!zone) return { reqArc: 0, reqAut: 0 };
    if (typeof IdleZones !== 'undefined' && typeof IdleZones.forceReq === 'function') {
      return IdleZones.forceReq(zone);
    }
    return {
      reqArc: Math.max(0, Math.floor(Number(zone.reqArc) || 0)),
      reqAut: Math.max(0, Math.floor(Number(zone.reqAut) || 0)),
    };
  }

  function currentReq(opts = {}) {
    if (typeof IdleBoss !== 'undefined' && IdleBoss.isRunning?.() && typeof IdleBoss.getForceReq === 'function') {
      const req = IdleBoss.getForceReq() || {};
      return {
        reqArc: Math.max(0, Math.floor(Number(req.reqArc) || 0)),
        reqAut: Math.max(0, Math.floor(Number(req.reqAut) || 0)),
        isBoss: true,
      };
    }
    let zone = opts.zone || null;
    if (!zone && typeof IdleHunt !== 'undefined' && typeof IdleHunt.getZoneId === 'function'
      && typeof IdleZones !== 'undefined') {
      zone = IdleZones.get(IdleHunt.getZoneId());
    }
    const req = readZoneReq(zone);
    const huntBoss = opts.isBoss
      || (typeof IdleHunt !== 'undefined' && IdleHunt.getHuntMode?.() === 'boss');
    return { ...req, isBoss: !!huntBoss };
  }

  function mapMult(opts = {}) {
    const req = currentReq(opts);
    const needArc = req.reqArc;
    const needAut = req.reqAut;
    if (!(needArc > 0) && !(needAut > 0)) {
      return { dealt: 1, taken: 1, reqArc: 0, reqAut: 0, isBoss: !!req.isBoss };
    }
    let dealtPct = 100;
    let taken = 1;
    if (needArc > 0) {
      const have = totalArc();
      const ratio = Math.floor((have * 100) / needArc);
      dealtPct = arcDealtPct(ratio);
      taken = arcTakenMult(ratio);
    } else if (needAut > 0) {
      const diff = totalAut() - needAut;
      dealtPct = autDealtPct(diff);
      taken = autTakenMult(diff);
    }
    if (req.isBoss && taken < 1) taken = 1;
    return {
      dealt: dealtPct / 100,
      taken,
      reqArc: needArc,
      reqAut: needAut,
      isBoss: !!req.isBoss,
    };
  }

  /** 狩獵場左上角：自身／地圖 ARC 或 AUT，以及實際套用的出傷／受擊。 */
  function hudInfo(opts = {}) {
    const req = currentReq(opts);
    const mult = mapMult(opts);
    let kind = '';
    let have = 0;
    let need = 0;
    if (req.reqArc > 0) {
      kind = 'arc';
      have = totalArc();
      need = req.reqArc;
    } else if (req.reqAut > 0) {
      kind = 'aut';
      have = totalAut();
      need = req.reqAut;
    }
    return {
      kind,
      have,
      need,
      dealt: mult.dealt,
      taken: mult.taken,
      isBoss: !!mult.isBoss,
      short: !!kind && have < need,
    };
  }

  /** 地圖有需求且身上不足時回傳 Arcbarrier／Autbarrier，否則空字串。 */
  function barrierKind(opts = {}) {
    const req = currentReq(opts);
    if (req.reqArc > 0 && totalArc() < req.reqArc) return 'Arcbarrier';
    if (req.reqAut > 0 && totalAut() < req.reqAut) return 'Autbarrier';
    return '';
  }

  return {
    ARC_IDS,
    AUT_IDS,
    GRAND_IDS,
    slotForItemId,
    itemIdForSlot,
    kindOf,
    forceKind,
    maxLevel,
    expToNext,
    mesoToNext,
    normalizeState,
    inspect,
    expValue,
    statsAtLevel,
    mainStatMap,
    jobProfile,
    totals,
    totalArc,
    totalAut,
    hyperArc,
    mapMult,
    hudInfo,
    currentReq,
    barrierKind,
  };
})();

if (typeof window !== 'undefined') window.SymbolForce = SymbolForce;
