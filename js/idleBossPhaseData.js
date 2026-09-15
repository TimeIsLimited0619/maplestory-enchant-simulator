/**
 * BOSS 階段腳本（手維護）。數值／動畫仍來自 IDLE_BOSS_WZ / IDLE_BOSS_MOB_DATA。
 * 難度：每王 1～4 檔；倍率之後依基礎數值再調。玩家只選難度，不顯示係數。
 */
const IDLE_BOSS_DIFF_META = {
  easy: { id: 'easy', name: '簡單', label: 'Easy' },
  normal: { id: 'normal', name: '普通', label: 'Normal' },
  hard: { id: 'hard', name: '困難', label: 'HARD' },
  extreme: { id: 'extreme', name: '極限', label: 'Extreme' },
};

const IDLE_BOSS_DIFF_ORDER = ['easy', 'normal', 'hard', 'extreme'];

const IdleBossDiff = (() => {
  function scriptOf(listId) {
    return (typeof IDLE_BOSS_PHASE !== 'undefined' ? IDLE_BOSS_PHASE : {})[String(listId)] || null;
  }

  function listFor(listId) {
    const script = scriptOf(listId);
    const raw = Array.isArray(script?.difficulties) ? script.difficulties : [];
    const seen = new Set();
    const out = [];
    raw.forEach((row) => {
      const id = String(row?.id || '').trim();
      if (!IDLE_BOSS_DIFF_META[id] || seen.has(id)) return;
      seen.add(id);
      out.push({
        id,
        hpMult: Number(row.hpMult) > 0 ? Number(row.hpMult) : 1,
        dmgMult: Number(row.dmgMult) > 0 ? Number(row.dmgMult) : 1,
        // 依 mobId 覆寫該態血量倍率（未列則用 hpMult）
        formHpMult: (row.formHpMult && typeof row.formHpMult === 'object')
          ? { ...row.formHpMult }
          : null,
        // 史烏等：pattern／shield CD＝基準秒 × 此倍率（Hard＝1 方便之後微調）
        patternCdMult: Number(row.patternCdMult) > 0 ? Number(row.patternCdMult) : 1,
        reqLevel: Math.max(0, Math.floor(Number(row.reqLevel) || 0)),
        timeLimitSec: Math.max(1, Math.floor(Number(row.timeLimitSec) || Number(script?.timeLimitSec) || 1800)),
        rewards: Array.isArray(row.rewards) ? row.rewards : [],
      });
    });
    out.sort((a, b) => IDLE_BOSS_DIFF_ORDER.indexOf(a.id) - IDLE_BOSS_DIFF_ORDER.indexOf(b.id));
    if (out.length) return out.slice(0, 4);
    return [{
      id: 'easy',
      hpMult: 1,
      dmgMult: 1,
      reqLevel: Math.max(0, Math.floor(Number(script?.reqLevel) || 0)),
      timeLimitSec: Math.max(1, Math.floor(Number(script?.timeLimitSec) || 1800)),
      rewards: Array.isArray(script?.rewards) ? script.rewards : [],
    }];
  }

  function get(listId, diffId) {
    const rows = listFor(listId);
    return rows.find((d) => d.id === String(diffId)) || rows[0] || null;
  }

  function meta(diffId) {
    return IDLE_BOSS_DIFF_META[String(diffId)] || IDLE_BOSS_DIFF_META.easy;
  }

  return { listFor, get, meta };
})();

const IDLE_BOSS_PHASE = {
  '0': {
    name: '巴洛古',
    bodyStatMob: '8830000',
    headVisualMob: '8830003',
    handL: {
      sealed: '8830006',
      active: '8830001',
      deadSealed: '8830004',
      statMob: '8830001',
    },
    handR: {
      sealed: null,
      active: '8830002',
      deadSealed: '8830005',
      statMob: '8830002',
    },
    chestMob: '8830014',
    /** 1→2：本體剩餘 HP 比例 */
    phase2BodyHpRatio: 0.75,
    /** 2→3：雙手剩餘總血 ≤ 總上限一半，或本體 ≤ 一半 */
    phase3HandsHpRatio: 0.5,
    phase3BodyHpRatio: 0.5,
    exitSec: 30,
    /** 簡單＝基準（血量 10 倍、傷害 5 倍）；普通血量 50 倍、傷害 10 倍
     *  timeLimitSec 挑戰時限（秒），倒數歸零＝失敗。省略＝1800（30 分）
     *  rewards 每列獨立擲骰：
     *    chance  0～100，省略＝100（必掉）
     *    amount  該列過關時的數量
     *  同道具可寫多列（不同機率／數量）。預覽只顯示會掉什麼，不顯示機率與數量。
     *  例：{ kind: 'etc', itemId: 'meowcoin', amount: 1, chance: 30 }
     */
    difficulties: [
      {
        id: 'easy',
        hpMult: 2,
        dmgMult: 4,
        reqLevel: 50,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01382068', amount: 1, chance: 30},
          { kind: 'equip', itemId: '01402062', amount: 1, chance: 30},
          { kind: 'equip', itemId: '01522076', amount: 1, chance: 30 },
          { kind: 'equip', itemId: '01472086', amount: 1, chance: 30 },
          { kind: 'equip', itemId: '01222029', amount: 1, chance: 30 },
          { kind: 'consume', itemId: 'grilled-eel', amount: 20 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
        ],
      },
      {
        id: 'normal',
        hpMult: 20,
        dmgMult: 10,
        reqLevel: 70,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01382068', amount: 1, chance: 50},
          { kind: 'equip', itemId: '01402062', amount: 1, chance: 50},
          { kind: 'equip', itemId: '01522076', amount: 1, chance: 50 },
          { kind: 'equip', itemId: '01472086', amount: 1, chance: 50 },
          { kind: 'equip', itemId: '01222029', amount: 1, chance: 50 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },          
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'maple_heart_warrior', amount: 1,chance: 20 },
          { kind: 'etc', itemId: 'maple_heart_magician', amount: 1,chance: 20 },
        ],
      },
    ],
  },
  /**
   * 殘暴炎魔（官服精簡）
   * phase1：八臂可打、本體無敵
   * phase2–4：本體三態 9451120→9451121→9451122（各有獨立 HP）
   * 無寶箱：本體最終態死亡後直接掉落。
   * 血量：WZ maxHP × manifest.hpMult × difficulty.hpMult
   */
  '1': {
    name: '殘暴炎魔',
    kind: 'zakum',
    bodyForms: [
      { statMob: '9451120', visualMob: '9451120' },
      { statMob: '9451121', visualMob: '9451121' },
      { statMob: '9451122', visualMob: '9451122' },
    ],
    arms: [
      { key: 'arm0', active: '9451123', statMob: '9451123', z: 1 },
      { key: 'arm1', active: '9451124', statMob: '9451124', z: 2 },
      { key: 'arm2', active: '9451125', statMob: '9451125', z: 3 },
      { key: 'arm3', active: '9451126', statMob: '9451126', z: 4 },
      { key: 'arm4', active: '9451127', statMob: '9451127', z: 5 },
      { key: 'arm5', active: '9451128', statMob: '9451128', z: 6, flipX: true },
      { key: 'arm6', active: '9451129', statMob: '9451129', z: 7 },
      { key: 'arm7', active: '9451130', statMob: '9451130', z: 8 },
    ],
    bodyZ: 20,
    chestMob: null,
    exitSec: 30,
    difficulties: [
      {
        id: 'easy',
        hpMult: 0.005,
        dmgMult: 0.2,
        reqLevel: 50,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01002357', amount: 1, chance: 30 },
          { kind: 'consume', itemId: 'grilled-eel', amount: 20 },
          { kind: 'etc', itemId: 'cyclops_eye', amount: 1, chance: 50 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
        ],
      },
      {
        id: 'normal',
        hpMult: 0.05,
        dmgMult: 0.2,
        reqLevel: 75,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01004119', amount: 1, chance: 30 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'etc', itemId: 'cyclops_eye', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
        ],
      },
      {
        id: 'hard',
        hpMult: 1,
        dmgMult: 1,
        reqLevel: 100,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01003112', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01082447', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01402233', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01372204', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01522121', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01472244', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01222092', amount: 1, chance: 10 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'etc', itemId: 'cyclops_eye', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
        ],
      },
    ],
  },
  /**
   * 暗黑龍王（三圖階段）
   * stage1：左頭 8810000（地圖 2/1）
   * stage2：右頭 8810001（地圖 2/2）；playerFlipX 面向左
   * stage3：本體八部位 8810002–09；死後換成佔位 8810010–17（地圖 2/3）；playerFlipX 面向左
   * 各 stage 的 playerPos / bossPos 獨立調整（1366×768）
   * 全滅後清除部位，播 8810018 die1，再掉落
   * 血量：WZ maxHP × manifest.hpMult × difficulty.hpMult
   */
  '2': {
    name: '暗黑龍王',
    kind: 'horntail',
    stages: [
      {
        key: 'headL',
        mapArt: '2/1',
        playerPos: { x: 700, y: 303 },
        bossPos: { x:1100, y: 560 },
        playerFlipX: false,
        parts: [
          { key: 'headL', active: '8810000', statMob: '8810000', z: 20 },
        ],
      },
      {
        key: 'headR',
        mapArt: '2/2',
        /** 圖層相對場地偏移（負 y = 整張地圖上移） */
        playerPos: { x: 700, y: 303 },
        bossPos: { x: 250, y: 560 },
        playerFlipX: true,
        parts: [
          { key: 'headR', active: '8810001', statMob: '8810001', z: 20 },
        ],
      },
      {
        key: 'body',
        mapArt: '2/3',
        playerPos: { x: 1150, y: 480 },
        bossPos: { x: 650, y: 720 },
        playerFlipX: true,
        parts: [
          { key: 'htHeadA', active: '8810002', deadSealed: '8810010', statMob: '8810002', z: 50 },
          { key: 'htHeadB', active: '8810003', deadSealed: '8810011', statMob: '8810003', z: 60 },
          { key: 'htHeadC', active: '8810004', deadSealed: '8810012', statMob: '8810004', z: 50 },
          { key: 'htHandL', active: '8810005', deadSealed: '8810013', statMob: '8810005', z: 40 },
          { key: 'htHandR', active: '8810006', deadSealed: '8810014', statMob: '8810006', z: 40 },
          { key: 'htWing', active: '8810007', deadSealed: '8810015', statMob: '8810007', z: 20 },
          { key: 'htLegs', active: '8810008', deadSealed: '8810016', statMob: '8810008', z: 30 },
          { key: 'htTail', active: '8810009', deadSealed: '8810017', statMob: '8810009', z: 10 },
        ],
      },
    ],
    chestMob: null,
    clearDieMob: '8810018',
    exitSec: 30,
    difficulties: [
      {
        id: 'normal',
        hpMult: 1,
        dmgMult: 1,
        reqLevel: 110,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01052719', amount: 1, chance: 20 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
        ],
      },
      {
        id: 'hard',
        hpMult: 50,
        dmgMult: 20,
        reqLevel: 160,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'black_dragon_soul', amount: 1,chance: 20 },
        ],
      },
    ],
  },
  /**
   * 拉圖斯（單圖、三態）
   * 8500000 時鐘 → 8500001 本體 → 8500002 二型（revive 鏈）
   * skill2／skill4：裂縫判定；失敗回血並施放鬧鐘引導（skill3 或 skill5→6）
   * 血量：WZ maxHP × manifest.hpMult × difficulty.hpMult
   */
  '22': {
    name: '拉圖斯',
    kind: 'papulatus',
    bodyForms: [
      { statMob: '8500000', visualMob: '8500000' },
      { statMob: '8500001', visualMob: '8500001' },
      // 第三型（8500002）可單獨調 bossPos／playerPos（1366×768）
      {
        statMob: '8500002',
        visualMob: '8500002',
        bossPos: { x: 672, y: 552 },
      },
    ],
    // 休眠挑戰 → 失敗回血並施放鬧鐘引導
    // 本體 skill2；三型 skill4（無 sleep 動畫則 stand 等待）
    sleepSkills: {
      '8500001': {
        actionKey: 'skill2',
        cdSec: 60,
        windowSec: 10,
        breakHpRatio: 0.05,
        failHealRatio: 0.1,
        failChannelKey: 'skill3',
      },
      '8500002': {
        actionKey: 'skill4',
        cdSec: 20,
        windowSec: 5,
        breakHpRatio: 0.1,
        failHealRatio: 0.1,
        failChannelKey: 'skill5',
      },
    },
    chestMob: null,
    exitSec: 30,
    difficulties: [
      {
        id: 'easy',
        hpMult: 5,
        dmgMult: 7,
        reqLevel: 100,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01152120', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01152121', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152122', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01152123', amount: 1, chance: 2 },
          { kind: 'equip', itemId: '01152124', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01132211', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01132212', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01132213', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132214', amount: 1, chance: 2 },
          { kind: 'equip', itemId: '01132215', amount: 1, chance: 1 },
          { kind: 'etc', itemId: 'tinkerer_chest', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'tinkerer_chest', amount: 1, chance: 5 },
          { kind: 'etc', itemId: 'tinkerer_chest', amount: 1, chance: 2 },
          { kind: 'etc', itemId: 'tinkerer_chest', amount: 1, chance: 1 },
          { kind: 'consume', itemId: 'grilled-eel', amount: 20 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
        ],
      },
      {
        id: 'normal',
        hpMult: 350,
        dmgMult: 20,
        reqLevel: 140,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01662306', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01662308', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01672073', amount: 1, chance: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
        ],
      },
      {
        id: 'hard',
        hpMult: 1225,
        dmgMult: 100,
        reqLevel: 160,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01190544', amount: 1, chance: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },  
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
        ],
      },
    ],
  },

  /**
   * 梅格耐斯（單本體）
   * 8880000：stand／attack1–7／die1，無分階段
   */
  '10': {
    name: '梅格耐斯',
    kind: 'simple',
    bodyStatMob: '8880000',
    chestMob: null,
    exitSec: 30,
    difficulties: [
      {
        id: 'easy',
        hpMult: 0.5,
        dmgMult: 1,
        reqLevel: 80,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'equip', itemId: '01102475', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102474', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102473', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102472', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102471', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072732', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072733', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072734', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072735', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072736', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132164', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132165', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132166', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132167', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132168', amount: 1, chance: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 50 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 50 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 50 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 50 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 50 },
        ],
      },
      {
        id: 'normal',
        hpMult: 2,
        dmgMult: 1.5,
        reqLevel: 110,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'meowcoin', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'equip', itemId: '01102476', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102477', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102478', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102479', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102480', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072737', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072738', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072739', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072740', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072741', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132169', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132170', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132171', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132172', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132173', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102475', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01102474', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01102473', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01102472', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01102471', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01072732', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01072733', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01072734', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01072735', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01072736', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01132164', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01132165', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01132166', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01132167', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01132168', amount: 1, chance: 15 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'nekopow', amount: 2 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
        ],
      },
      {
        id: 'hard',
        hpMult: 100,
        dmgMult: 6,
        reqLevel: 150,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'equip', itemId: '01102481', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102482', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102483', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102484', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01102485', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072743', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072744', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072745', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01072746', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132174', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132175', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132176', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132177', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01132178', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01082543', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01082544', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01082545', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01082546', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01082547', amount: 1, chance: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 25 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'tyrants_coin', amount: 1, chance: 10 },
        ],
      },
    ],
  },

  /**
   * 粉紅豆豆
   * 過場 8820008（die1）→ 王座 8820000（無敵可施法）
   * 雕像殼 8820010–14 漸進解鎖 → 本體 8820001
   * 血量：WZ maxHP × difficulty.hpMult
   */
  '11': {
    name: '粉豆',
    kind: 'pinkbean',
    intro: { fromMob: '8820008', viaMob: '8820009', throneMob: '8820000' },
    statues: [
      { key: 'solomon', mob: '8820003', z: 31, offset: { x: 0, y: 0 } },
      { key: 'hugin', mob: '8820005', z: 32, offset: { x: 0, y: 0 } },
      { key: 'ariel', mob: '8820002', z: 33, offset: { x: 0, y: 0 } },
      { key: 'munin', mob: '8820006', z: 32, offset: { x: 0, y: 0 } },
      { key: 'rex', mob: '8820004', z: 31, offset: { x: 0, y: 0 } },
    ],
    // 場景常駐裝飾（不可打）：聖所背景／未啟用雕像底座等
    scenery: [
      { key: 'scenery19', mob: '8820019', z: 8, offset: { x: 0, y: 0 } },
      { key: 'scenery20', mob: '8820020', z: 6, offset: { x: 0, y: 0 } },
      { key: 'scenery21', mob: '8820021', z: 6, offset: { x: 0, y: 0 } },
      { key: 'scenery22', mob: '8820022', z: 7, offset: { x: 0, y: 0 } },
      { key: 'scenery23', mob: '8820023', z: 7, offset: { x: 0, y: 0 } },
    ],
    statuePhases: [
      { shell: '8820010', unlock: ['solomon'] },
      { shell: '8820011', unlock: ['solomon', 'rex'] },
      { shell: '8820012', unlock: ['solomon', 'rex', 'hugin'] },
      { shell: '8820013', unlock: ['solomon', 'rex', 'hugin', 'munin'] },
      { shell: '8820014', unlock: ['solomon', 'rex', 'hugin', 'munin', 'ariel'] },
    ],
    bodyForms: [
      { statMob: '8820001', visualMob: '8820001' },
    ],
    bodyZ: 20,
    chestMob: null,
    exitSec: 30,
    difficulties: [
      {
        id: 'normal',
        hpMult: 1,
        dmgMult: 1,
        reqLevel: 120,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01003285', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003286', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003287', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003288', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003289', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082333', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082334', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082335', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082336', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082337', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052379', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052380', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052381', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052382', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052383', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072549', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072550', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072551', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072552', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072553', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01122148', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01032358', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01113236', amount: 1, chance: 8 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
        ],
      },
      {
        id: 'hard',
        hpMult: 300,
        dmgMult: 15,
        reqLevel: 140,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01003285', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01003286', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01003287', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01003288', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01003289', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01082333', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01082334', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01082335', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01082336', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01082337', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01052379', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01052380', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01052381', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01052382', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01052383', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01072549', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01072550', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01072551', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01072552', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01072553', amount: 1, chance: 20 },
          { kind: 'equip', itemId: '01122148', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01032358', amount: 1, chance: 15 },
          { kind: 'equip', itemId: '01113236', amount: 1, chance: 20 },
          { kind: 'etc', itemId: 'meowcoin', amount: 15 },
          { kind: 'etc', itemId: 'meowcoin', amount: 15 },
          { kind: 'etc', itemId: 'meowcoin', amount: 15 },
          { kind: 'etc', itemId: 'nekopow', amount: 15 },
          { kind: 'etc', itemId: 'nekopow', amount: 15 },
          { kind: 'etc', itemId: 'nekopow', amount: 15 },
       ],
      },
    ],
  },

  /**
   * 西格諾斯
   * 本體 8850111 + 開場守護獸 8850110
   * 每 15% 鎖血共 5 次：skill6 → 召喚護衛 → skill5 → sleep → 護衛死後 wakeup
   * attack5／6 與 attack1 同圖，輪轉排除
   */
  '12': {
    name: '西格諾斯',
    kind: 'cygnus',
    bodyStatMob: '8850111',
    guardian: { mob: '8850110', z: 25, offset: { x: -140, y: 20 } },
    escorts: [
      { mob: '8850100', z: 30, offset: { x: -140, y: -13 } },
      { mob: '8850101', z: 30, offset: { x: -140, y: -13 } },
      { mob: '8850102', z: 30, offset: { x: -140, y: -13 } },
      { mob: '8850103', z: 30, offset: { x: -140, y: -13 } },
      { mob: '8850104', z: 30, offset: { x: -140, y: -13 } },
    ],
    // 85%→70%→55%→40%→25% 共五次
    lockHpRatios: [0.85, 0.70, 0.55, 0.40, 0.25],
    lockSkill6: 'skill6',
    lockSkill5: 'skill5',
    excludeActions: ['attack5', 'attack6', 'skill5', 'skill6'],
    bodyZ: 20,
    chestMob: null,
    exitSec: 30,
    difficulties: [
      {
        id: 'normal',
        hpMult: 10,
        dmgMult: 5,
        reqLevel: 140,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01003172', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003173', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003174', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003175', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003176', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102275', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102276', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102277', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102278', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102279', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082295', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082296', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082297', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082298', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082299', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052314', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052315', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052316', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052317', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01052318', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072485', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072486', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072487', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072488', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01072489', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152108', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152110', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152111', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152112', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152113', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01402095', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01372084', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01522018', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01472122', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01222014', amount: 1, chance: 5 },
          { kind: 'etc', itemId: '140armor_pcs', amount: 1, chance: 50 },
          { kind: 'etc', itemId: '140weapon_pcs', amount: 1, chance: 30 },
        ],
      }
    ],
  },

  /**
   * 濃姬（單態）
   * 合成王 9450023（9450040 攻＋9450022 技）；森蘭丸已移除。
   * 血量：difficulty.formHpMult[mobId]；未列則用 hpMult
   */
  '18': {
    name: '濃姬',
    kind: 'forms',
    bodyForms: [
      { statMob: '9450023', visualMob: '9450023' },
    ],
    nohimeKit: {
      bodyMob: '9450023',
      // 合成王已只含要用的招；此處再保險排除＋機制覆寫
      excludeActions: ['attack6'], // 門檻技不進一般輪轉
      castTicks: {
        skill1: { fromFrame: 16, tickMs: 250, tickDmgRatio: 0.6 },
        // skill2：依指定幀出傷（0–43）；有 damageFrames 時忽略 fromFrame／tickMs
        skill2: {
          damageFrames: [16, 22, 24, 28, 29, 31, 32, 33, 34],
          tickDmgRatio: 0.5,
        },
      },
      skillChain: {
        skill4: { afterKey: 'skillAfter4', damageFrame: 11, dmgRatio: 1 },
      },
      thresholdAttack: {
        actionKey: 'attack6',
        hpRatio: 0.5,
        breakHpRatio: 0.07,
        failPlayerHpRatio: 1,
        screenCenter: true,
      },
    },
    chestMob: null,
    exitSec: 30,
    difficulties: [
      {
        id: 'normal',
        hpMult: 1,
        formHpMult: {
          '9450023': 250,
        },
        dmgMult: 7,
        reqLevel: 150,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'etc', itemId: 'Captivating_Fragment', amount: 1 },
          { kind: 'etc', itemId: 'Captivating_Fragment', amount: 1, chance: 20 },
          { kind: 'etc', itemId: 'Captivating_Fragment', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01352246', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01352009', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01352216', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01352296', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01352606', amount: 1, chance: 3 },
          { kind: 'etc', itemId: 'doom', amount:1 , chance: 30},
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'meowcoin', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
          { kind: 'etc', itemId: 'nekopow', amount: 1 },
        ],
      },
      {
        id: 'hard',
        hpMult: 1,
        formHpMult: {
          '9450023': 750,
        },
        dmgMult: 10.5,
        reqLevel: 180,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'etc', itemId: 'Captivating_Fragment', amount: 1 },
          { kind: 'etc', itemId: 'Captivating_Fragment', amount: 1, chance: 50 },
          { kind: 'etc', itemId: 'Captivating_Fragment', amount: 1, chance: 30 },
          { kind: 'equip', itemId: '01352246', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01352009', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01352216', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01352296', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01352606', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'doom', amount:1 },
          { kind: 'etc', itemId: 'doom', amount:1 , chance: 30},
          { kind: 'etc', itemId: 'doom', amount:1 , chance: 20},
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
        ],
      },
    ],
  },

  /**
   * 比艾樂：8900000 打到 50% → 分裂 8900001＋8900002 共血、分開攻擊。
   * 0002 無出手動畫：move 在玩家身邊巡邏，接觸出傷。帽子互換／互救／飛帽 v1 不做。
   */
  '4': {
    name: '比艾樂',
    kind: 'pierre',
    bodyStatMob: '8900000',
    splitHpRatio: 0.5,
    split: {
      hat: { visualMob: '8900001', offset: { x: -140, y: 0 } },
      chase: { visualMob: '8900002', offset: { x: 160, y: 0 } },
    },
    chase: {
      speedPx: 100,
      orbitPx: 90,
      contactPx: 88,
      contactDamR: 0.8,
      contactCdSec: 0.5,
    },
    pierreKits: {
      '8900000': {
        excludeActions: ['skill1'],
        // WZ conDamR 50／70
        attackHpRatio: { attack1: 1, attack2: 1.2 },
        attackCdSec: { attack2: 5 },
      },
      '8900001': {
        excludeActions: ['skill1', 'skillAfter1'],
        // WZ conDamR 50／50
        attackHpRatio: { attack1: 1, attack2: 1.2 },
      },
    },
    chestMob: '8900003',
    exitSec: 30,
    difficulties: [
      {
        id: 'normal',
        hpMult: 150,
        dmgMult: 8,
        reqLevel: 150,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01042254', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01042255', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01042256', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01042257', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01042258', amount: 1, chance: 3 },
          { kind: 'etc', itemId: '04310225', amount: 1, },
          { kind: 'etc', itemId: '02434585', amount: 1, },
          { kind: 'etc', itemId: '02434585', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
        ],
      },
      {
        id: 'hard',
        hpMult: 600,
        dmgMult: 12,
        reqLevel: 180,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01042254', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01042255', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01042256', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01042257', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01042258', amount: 1, chance: 7 },
          { kind: 'etc', itemId: '04310225', amount: 1, },
          { kind: 'etc', itemId: '04310225', amount: 1, chance: 10 },
          { kind: 'etc', itemId: '04310225', amount: 1, chance: 30 },
          { kind: 'etc', itemId: '02434585', amount: 1, chance: 10 },
          { kind: 'etc', itemId: '02434585', amount: 1, chance: 30 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
        ],
      },
    ],
  },

  /**
   * 班班：skill1 召喚香蕉 → skillAfter1 窗 60s；
   * 擊殺全小怪→skillFail 弱化 30s（受傷×1.5）；逾時→skillUse 強化 30s（出傷×1.2＋小怪同打）。
   * v1 不做 skill2 暈／skill3・6 瞬移；skill4／5 空殼排除。
   */
  '5': {
    name: '班班',
    kind: 'banban',
    bodyStatMob: '8910000',
    chestMob: null,
    banbanKit: {
      bodyMob: '8910000',
      minionMob: '8910001',
      summonCount: 2,
      maxMinions: 2,
      windowSec: 60,
      buffSec: 15,
      weakenSec: 15,
      buffOutMult: 1.4,
      weakenInMult: 1.5,
      skillCdSec: 20,
      minionOffsets: [
        { x: -150, y: 0 },
        { x: 150, y: 0 },
      ],
      excludeActions: [
        'skill2', 'skill3', 'skill4', 'skill5', 'skill6',
        'skillAfter3', 'skillAfter6',
        'attack5', 'attack6', 'attack7', 'attack8',
      ],
      // 出傷 = WZ基傷(PA×attackRatio) × 對maxHP傷 × dmgMult
      attackHpRatio: {
        attack1: 1.5,
        attack2: 1.0,
        attack3: 1.0,
      },
      attackCdSec: {
        attack1: 3,
        attack2: 6,
        attack3: 15,
        attack4: 18,
        skill1: 20,
      },
      damageChain: {
        opener: 'attack4',
        chain: ['attack4', 'attack5', 'attack6', 'attack7', 'attack8'],
        segmentHpRatio: 1,
      },
    },
    minionKit: {
      attackHpRatio: { attack1: 1.5 },
      attackCdSec: { attack1: 3 },
    },
    exitSec: 30,
    difficulties: [
      {
        id: 'normal',
        hpMult: 150,
        // 香蕉小怪血量倍率（未列則跟 hpMult）
        formHpMult: {
          '8910001': 40,
        },
        dmgMult: 8,
        reqLevel: 150,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01062165', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01062166', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01062167', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01062168', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01062169', amount: 1, chance: 3 },
          { kind: 'etc', itemId: '04310225', amount: 1, },
          { kind: 'etc', itemId: '02434585', amount: 1, },
          { kind: 'etc', itemId: '02434585', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 }, 
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
        ],
      },
      {
        id: 'hard',
        hpMult: 600,
        formHpMult: {
          '8910001': 160,
        },
        dmgMult: 12,
        reqLevel: 180,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01062165', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01062166', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01062167', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01062168', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01062169', amount: 1, chance: 7 },
          { kind: 'etc', itemId: '04310225', amount: 1, },
          { kind: 'etc', itemId: '04310225', amount: 1, chance: 10 },
          { kind: 'etc', itemId: '04310225', amount: 1, chance: 30 },
          { kind: 'etc', itemId: '02434585', amount: 1, },
          { kind: 'etc', itemId: '02434585', amount: 1, chance: 10 },
          { kind: 'etc', itemId: '02434585', amount: 1, chance: 30 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
        ],
      },
    ],
  },

  /**
   * 血腥女皇：三臉共血輪替。
   * 0000 skill1→愛心彈；skill2 回血；0001 skill1 封技能／attack2–6 每段傷；0002 skill1 壓至 1% HP。
   */
  '6': {
    name: '血腥女皇',
    kind: 'bloodyQueen',
    bodyForms: [
      { statMob: '8920000', visualMob: '8920000' },
      { statMob: '8920001', visualMob: '8920001' },
      { statMob: '8920002', visualMob: '8920002' },
    ],
    faceSwitch: {
      cdSec: 25,
    },
    faceKits: {
      '8920000': {
        excludeActions: ['skill3', 'skill4', 'skill5'],
        // WZ conDamR → 對maxHP傷倍率（× WZ基傷 × dmgMult）
        attackHpRatio: {
          attack1: 2.2,
        },
        skills: {
          skill1: {
            bombAfter: {
              bombMob: '8920004',
              bombCount: 1,
              bombDamR: 0.8,
              bombBaseDmg: 30000,
            },
          },
          skill2: {
            healSelfRatio: 0.10,
            cdSec: 10,
          },
        },
      },
      '8920001': {
        excludeActions: ['skill2', 'skill3', 'skill4', 'attack3', 'attack4', 'attack5', 'attack6'],
        attackHpRatio: {
          attack1: 2.2,
          attack2: 1.8,
          attack3: 1.8,
          attack4: 1.8,
          attack5: 1.8,
          attack6: 1.8,
        },
        skills: {
          skill1: {
            sealSkillsMs: 3000,
            cdSec: 10,
          },
        },
        damageChain: {
          opener: 'attack2',
          chain: ['attack2', 'attack3', 'attack4', 'attack5', 'attack6'],
          segmentHpRatio: 1.0,
        },
      },
      '8920002': {
        excludeActions: ['skill2', 'skill3', 'skill4'],
        skills: {
          skill1: {
            // 將玩家壓到最大 HP 的 1%（不致死）
            dropToHpRatio: 0.01,
            cdSec: 5,
          },
        },
        attackHpRatio: {
          attack1: 2.2,
          attack2: 2.35,
        },
      },
    },
    chestMob: '8920005',
    exitSec: 30,
    difficulties: [
      {
        id: 'normal',
        hpMult: 200,
        dmgMult: 8,
        reqLevel: 150,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01003797', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01003798', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01003799', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01003800', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01003801', amount: 1, chance: 3 },
          { kind: 'etc', itemId: '04310225', amount: 1, },
          { kind: 'etc', itemId: '02434586', amount: 1, },
          { kind: 'etc', itemId: '02434586', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
        ],
      },
      {
        id: 'hard',
        hpMult: 600,
        dmgMult: 12,
        reqLevel: 180,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01003797', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01003798', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01003799', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01003800', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01003801', amount: 1, chance: 7 },
          { kind: 'etc', itemId: '04310225', amount: 1, },
          { kind: 'etc', itemId: '04310225', amount: 1, chance: 10 },
          { kind: 'etc', itemId: '04310225', amount: 1, chance: 30 },
          { kind: 'etc', itemId: '02434586', amount: 1, },
          { kind: 'etc', itemId: '02434586', amount: 1, chance: 10 },
          { kind: 'etc', itemId: '02434586', amount: 1, chance: 30 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
        ],
      },
    ],
  },

  /**
   * 貝倫：本體 8930000＋尾巴 8930001 共血。
   * 尾巴每 7s 完整播 attack1；出傷（竄出≈2.1s）起可打，播完收回。
   * v1 不做 skill1 隱身、disease、callSkill 彈體。
   */
  '7': {
    name: '貝倫',
    kind: 'vellum',
    bodyStatMob: '8930000',
    chestMob: null,
    vellumKit: {
      bodyMob: '8930000',
      tailMob: '8930001',
      tailCdSec: 7,
      tailOrbitPx: 140,
      // WZ attackAfter≈2070：出傷／可打起始（竄出）
      tailAttackLeadMs: 2100,
      excludeActions: [
        'skill1', 'skillAfter1',
        'attack3', 'attack4', 'attack5', 'attack6',
        'attack10', 'attack11', 'attack12',
        'attack14', 'attack15', 'attack16',
      ],
      // WZ conDamR → 對maxHP傷
      attackHpRatio: {
        attack1: 1,
        attack2: 1,
        attack3: 1,
        attack4: 1,
        attack5: 1,
        attack6: 1,
        attack7: 0.8,
        attack8: 1,
        attack9: 1,
        attack10: 1,
        attack11: 1,
        attack12: 1,
        attack13: 0.8,
        attack14: 1.2,
        attack15: 1.2,
        attack16: 1.2,
      },
      attackCdSec: {
        attack1: 10,
        attack2: 25,
        attack7: 7,
        attack8: 25,
        attack9: 15,
        attack13: 10,
      },
      damageChains: [
        { opener: 'attack2', chain: ['attack2', 'attack5', 'attack3', 'attack4', 'attack6'] },
        { opener: 'attack9', chain: ['attack9', 'attack10', 'attack11', 'attack12'] },
        { opener: 'attack13', chain: ['attack13', 'attack14', 'attack15', 'attack16'] },
      ],
      tailAttackHpRatio: 1,
    },
    exitSec: 30,
    difficulties: [
      {
        id: 'normal',
        hpMult: 250,
        dmgMult: 8,
        reqLevel: 150,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01402196', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01522094', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01372177', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01472214', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01222058', amount: 1, chance: 3 },
          { kind: 'etc', itemId: '04310225', amount: 1, },
          { kind: 'etc', itemId: '02434587', amount: 1, },
          { kind: 'etc', itemId: '02434587', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
        ],
      },
      {
        id: 'hard',
        hpMult: 750,
        dmgMult: 12,
        reqLevel: 180,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01402196', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01522094', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01372177', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01472214', amount: 1, chance: 7 },
          { kind: 'equip', itemId: '01222058', amount: 1, chance: 7 },
          { kind: 'etc', itemId: '04310225', amount: 1, },
          { kind: 'etc', itemId: '04310225', amount: 1, chance: 10 },
          { kind: 'etc', itemId: '04310225', amount: 1, chance: 30 },
          { kind: 'etc', itemId: '02434587', amount: 1, },
          { kind: 'etc', itemId: '02434587', amount: 1, chance: 30 },
          { kind: 'etc', itemId: '02434587', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
        ],
      },
    ],
  },

  /**
   * 史烏 Remaster：三階分血（原地）；BossPattern 精選子集＋簡化過熱／護盾。
   * Normal 目標血：5000億／5000億／7500億（WZ 20億 × formHpMult 250／250／375）。
   * Hard／極限：formHpMult 已內建 ×20／×1000（現有 hpMult 對 formHpMult 是覆寫不是相乘）。
   * 出傷＝深淵四王公式（PA×ratio×dmgMult）；dmgMult 依基準機體校準：
   *   Normal 17萬／減傷80%／防 6萬 → ×15
   *   Hard   20萬／減傷80%／防 7萬 → ×18
   *   Extreme 30萬／減傷80%／防 10萬 → ×27
   * （ratio＝1 約吃機體 18～19% 血；已含技能減傷＋物防公式）
   */
  '13': {
    name: '史烏',
    kind: 'suu',
    bodyForms: [
      { statMob: '8881100', visualMob: '8881100', mapArt: '13/1' },
      { statMob: '8881101', visualMob: '8881101', mapArt: '13/2' },
      { statMob: '8881102', visualMob: '8881102', mapArt: '13/3' },
    ],
    chestMob: '8881103',
    // 清場獎勵箱地圖（黑頻後切換）
    chestMapArt: '13/4',
    exitSec: 30,
    suuKit: {
      // P1 核心（鋸刃 pre）：地圖下方正中央；之後可微調像素
      corePos: { x: 680, y: 625 },
      // 過熱：被打升溫；對王累積傷害降溫
      gauge: {
        max: 100,
        heatOnHit: 8,
        // 每造成 maxHp 的 1% → 降 coolPerMaxHpPct 點
        coolPerMaxHpPct: 2,
        // destruction＝滿表過熱模式；結束後 overloadSec 短暫不加過熱
        purgeSec: 18,
        overloadSec: 5,
        p3Start: 55,
      },
      shield: {
        cdSec: 40,
        durationSec: 20,
        // 護盾池＝當階 maxHp × hpRatio（5%）
        hpRatio: 0.01,
        // 護盾存在期間：進傷先 ×(1−damageReduce) 再扣護盾／溢傷進本體
        damageReduce: 0.9,
        // 逾時回血上限（依剩餘護盾比例縮放）
        healRatioOnExpire: 0.04,
      },
      // 無施法動作：招式動畫可同時在場；開招之間全域間隔（秒）
      patternCastGapSec: 1,
      // 二階掉落物（1002/004）：由 8881101 skill5 召喚（非常駐 ambient）
      debrisRain: {
        phases: [2],
        assetKey: '1002/004',
        styles: [0, 1, 2],
        // skill5 一發丟幾顆；間隔錯開
        burstCount: 4,
        burstGapMs: 420,
        // fallMs 省略＝跟 WZ loop 總 delay；fallAirPx＝相對腳底高度
        fallAirPx: 520,
        landYBias: -85,
        hitRadiusPx: 150,
        attackHpRatio: 1.0,
        heatOnHit: 7,
        maxAlive: 6,
      },
      // 各階本體 skill：盡量播正服動畫（effect／areaWarning／hit）
      phaseKits: {
        '8881100': {
          // 一階無本體 skill，只靠 pattern
          excludeActions: ['skill1', 'skill2', 'skill3', 'skill4', 'skill5', 'skill6', 'skill7'],
          attackHpRatio: {},
        },
        '8881101': {
          excludeActions: ['skillAfter4', 'move'],
          // skill4＝傳送消失 → skillAfter4＝出現（出現時出傷）
          skillChain: {
            skill4: { afterKey: 'skillAfter4', damageFrame: 0, dmgRatio: 1 },
          },
          // skill5＝掉落物、skill6＝頭頂無人機、skill7＝爆炸瓶（本體動畫召喚，非獨立 pattern）
          summonPatternByAction: {
            skill5: 'debrisRain',
            skill6: 'bombard',
            skill7: 'slowWall',
          },
          attackHpRatio: {
            skill1: 1.15,
            skill2: 1.0,
            skill3: 1.2,
            skill4: 1.05,
            // 5／6／7 傷在召喚物上，本體招不另算
            skill5: 0,
            skill6: 0,
            skill7: 0,
          },
          attackCdSec: {
            skill1: 8,
            skill2: 10,
            skill3: 12,
            skill4: 14,
            // Hard 基準秒（× difficulty.patternCdMult）；對齊原 pattern／ambient
            skill5: 8,
            skill6: 25,
            skill7: 10,
          },
          heatOnHit: {
            skill1: 6,
            skill2: 7,
            skill3: 8,
            skill4: 6,
            skill5: 0,
            skill6: 0,
            skill7: 0,
          },
        },
        '8881102': {
          excludeActions: ['flip', 'skillAfter7', 'move'],
          // skill7＝傳送消失 → skillAfter7＝出現（出現時出傷）
          skillChain: {
            skill7: { afterKey: 'skillAfter7', damageFrame: 0, dmgRatio: 1 },
          },
          // skill3＝벙커、skill4＝중력구속、skill6＝발판、skill9＝함포
          summonPatternByAction: {
            skill3: 'bunker',
            skill4: 'gravityBind',
            skill6: 'platformShot',
            skill9: 'cannons',
          },
          attackHpRatio: {
            skill1: 1.15,
            skill2: 1.05,
            skill3: 0,
            skill4: 0,
            skill5: 1.2,
            skill6: 0,
            skill7: 1.3,
            skill8: 1.25,
            skill9: 0,
          },
          attackCdSec: {
            skill1: 8,
            skill2: 10,
            // Hard 基準＝pattern cdSec（× patternCdMult）
            skill3: 20,
            skill4: 40,
            skill5: 13,
            skill6: 45,
            skill7: 15,
            skill8: 14,
            skill9: 60,
          },
          heatOnHit: {
            skill1: 6,
            skill2: 7,
            skill3: 0,
            skill4: 0,
            skill5: 8,
            skill6: 0,
            skill7: 9,
            skill8: 9,
            skill9: 0,
          },
        },
      },
      // pattern：深淵公式；節奏／分層依 나무위키＋正服（scripts/_suu-pattern-fx-notes.mjs）
      // CD：下列 cdSec／cdSecByPhase＝Hard 基準秒；實際＝基準 × difficulty.patternCdMult
      // 略：Teleport／真移動／破平台本體／mobHit 降溫；1002/000·001·003 空殼
      // 1000/005→8881108 自爆無人機；1000/007→8881107 地雷（召喚時播一次 effect）
      patterns: [
        // —— 共通：소형 기계팔 —— pre/pre2 瞄準；end 隨機角插下；special當hit
        // Extreme：소형10 → 大臂（ball2頭＋ball3×N身體＋ball）→ 소형2
        {
          id: 'arm',
          phases: [1, 2, 3],
          cdSec: 25,
          cdSecByPhase: { 1: 25, 2: 32, 3: 22 },
          attackHpRatio: 0.45,
          heatOnHit: 4,
          castMode: 'armSlam',
          aimMs: 540,
          hitCount: 6,
          hitGapMs: 800,
          hitGapMsByPhase: { 3: 600 },
          armMaxTiltRad: 0.7,
          largeArmExtreme: true,
          largeArmAfterSmall: 10,
          largeArmThenSmall: 2,
          largeAimMs: 1140,
          largeAttackHpRatio: 0.8,
          largeHeatOnHit: 12,
          hitCountExtreme: 13,
          // largeArmBodyCount 省略＝依場高自動堆 ball3
          assetKeyByPhase: { 1: '1001/001', 2: '1003/001', 3: '1005/002' },
        },
        // —— 共通：추적 레이저 —— 追蹤→鎖定 1s→開火；左上／右上（P3＋正上）
        {
          id: 'laser',
          phases: [1, 2, 3],
          cdSec: 12,
          cdSecByPhase: { 1: 12, 2: 12, 3: 10 },
          attackHpRatio: 1.1,
          heatOnHit: 10,
          castMode: 'trackingLaser',
          lockMs: 1000,
          trackMsByPhase: { 1: 1000, 2: 1000, 3: 1420 },
          beamCountByPhase: { 1: 2, 2: 2, 3: 3 },
          assetKeyByPhase: { 1: '1001/000', 2: '1003/000', 3: '1005/000' },
        },
        // —— 一階：칼날 톱니 —— pre 核心 → 1.32s 後左右錯開升起；升起後再出傷
        {
          id: 'saw',
          phases: [1],
          cdSec: 10,
          attackHpRatio: 0.7,
          heatOnHit: 5,
          castMode: 'sawRise',
          warningMs: 1320,
          riseMs: 480,
          // 左右多顆僅視覺；傷害只算玩家身上那顆
          visualCount: 5,
          spreadPx: 250,
          assetKey: '1000/000',
        },
        {
          id: 'sawAlt',
          phases: [1],
          cdSec: 10,
          attackHpRatio: 0.7,
          heatOnHit: 5,
          castMode: 'sawRise',
          warningMs: 1320,
          riseMs: 480,
          visualCount: 5,
          spreadPx: 160,
          assetKey: '1000/001',
        },
        {
          id: 'sawSide',
          phases: [1],
          cdSec: 10,
          attackHpRatio: 0.85,
          heatOnHit: 6,
          castMode: 'sawRise',
          warningMs: 1320,
          riseMs: 360,
          visualCount: 5,
          spreadPx: 140,
          assetKey: '1000/002',
        },
        // —— 一階：에너지 압축 —— pre 在王；釋放 effect 在王周圍；hit 在玩家
        {
          id: 'energyCompress',
          phases: [1],
          cdSec: 25,
          attackHpRatio: 1.4,
          heatOnHit: 9,
          warningMs: 1380,
          assetKey: '1000/003',
          fxWarnLayers: [{ action: 'pre', anchor: 'boss' }],
          fxHitLayers: [
            { action: 'effect', anchor: 'boss' },
            { action: 'hit', anchor: 'feet' },
          ],
        },
        {
          id: 'energyCompressDown',
          phases: [1],
          cdSec: 25,
          attackHpRatio: 1.4,
          heatOnHit: 9,
          warningMs: 1380,
          assetKey: '1000/004',
          fxWarnLayers: [{ action: 'pre', anchor: 'boss' }],
          fxHitLayers: [
            { action: 'effect', anchor: 'boss' },
            { action: 'hit', anchor: 'feet' },
          ],
        },
        // —— 一階：자폭 지뢰 —— 8881107；召喚時播一次 1000/007 effect
        // 出傷顆數 N/H/E＝2/3/5；畫面顆數 4/6/8
        {
          id: 'mine',
          phases: [1],
          cdSec: 12,
          attackHpRatio: 1.0,
          heatOnHit: 6,
          castMode: 'suicideMine',
          summonMob: '8881107',
          warnFxKey: '1000/007',
          warningMs: 720,
          fuseMs: 2800,
          // 實際出傷／畫面顯示（依難度）；同高度並排（Y＝corePos／鋸刃）
          hitCountByDiff: { normal: 2, hard: 3, extreme: 5 },
          visualCountByDiff: { normal: 4, hard: 6, extreme: 8 },
          spreadPx: 160,
        },
        // —— 共通：제압용 로봇 —— 8881108；隨機點飛向玩家；N/H/E＝4/6/8
        {
          id: 'suicideRobot',
          phases: [1, 2, 3],
          cdSec: 25,
          cdSecByPhase: { 1: 28, 2: 25, 3: 22 },
          attackHpRatio: 1.2,
          heatOnHit: 8,
          castMode: 'suicideRobot',
          summonMob: '8881108',
          countByDiff: { normal: 4, hard: 6, extreme: 8 },
          spawnGapMs: 180,
          flyMs: 1600,
          prepareMs: 500,
        },
        // —— 一階：폭발물 낙하 —— regen空中→stand落下→pre(repeatIdx6)→end
        {
          id: 'scrap',
          phases: [1],
          cdSec: 30,
          attackHpRatio: 1.6,
          heatOnHit: 8,
          castMode: 'dropExplode',
          fuseMs: 3000,
          fallMs: 420,
          fallAirPx: 280,
          preRepeatIdx: 6,
          // 左右多顆僅視覺；傷害只算玩家身上那顆
          visualCount: 5,
          spreadPx: 350,
          assetKey: '1007/000',
        },
        // —— 一階：전류 방출 —— 寬幅預警 1.74s → 單發放電
        {
          id: 'floorCurrent',
          phases: [1],
          cdSec: 45,
          attackHpRatio: 1.5,
          heatOnHit: 12,
          castMode: 'floorCurrent',
          warningMs: 1740,
          // WZ pre 無 repeatIdx；自設從 0 循環避免凍幀
          preRepeatIdx: 0,
          // special3 橫向鋪地板（不用 special／2 避免重疊）
          specialStepPx: 150,
          specialActions: ['special3'],
          assetKey: '1007/001',
        },
        // —— 二階：위치 제어 프로토콜 —— 王周圍圓波 → 3s 後玩家頭上黑洞二段
        {
          id: 'positionCtrl',
          phases: [2],
          cdSec: 12,
          attackHpRatio: 0.55,
          heatOnHit: 5,
          warningMs: 1140,
          hit2Ms: 3000,
          hit2Ratio: 1.2,
          assetKey: '1002/002',
          fxWarnLayers: [
            { action: 'special', anchor: 'boss' },
            { action: 'loop', anchor: 'boss', loop: true },
          ],
          fxHitLayers: [
            { action: 'hit', anchor: 'boss' },
            { action: 'end', anchor: 'boss' },
          ],
          fxHit2Layers: [
            { action: 'special2', anchor: 'feet' },
            { action: 'loop2', anchor: 'feet' },
            { action: 'end2', anchor: 'feet' },
            { action: 'hit', anchor: 'feet' },
          ],
        },
        // —— 二階：포격 프로토콜 —— 8881101 skill6 召喚（bodySummonOnly）
        {
          id: 'bombard',
          phases: [2],
          bodySummonOnly: true,
          cdSec: 25,
          attackHpRatio: 1.1,
          heatOnHit: 6,
          castMode: 'headDrone',
          // regen→stand→attack（第9幀從無人機中心出 ball）→hit×N→die
          hitCount: 4,
          hitGapMs: 1280,
          ballTravelMs: 480,
          ballLaunchFrame: 9,
          headYBias: -150,
          assetKey: '1002/005',
        },
        // —— 二階：슬로우 방벽／爆炸罐 —— 8881101 skill7 召喚（bodySummonOnly）
        {
          id: 'slowWall',
          phases: [2],
          bodySummonOnly: true,
          cdSec: 10,
          attackHpRatio: 1.15,
          heatOnHit: 7,
          castMode: 'jarBomb',
          // loop／warning 各 0／1 疊加；warning 播完立刻 end＋hit
          assetKey: '1002/006',
        },
        // —— 三階：유도탄 —— 1005/001；左右場外飛向玩家（可靠近王引爆）
        {
          id: 'rocket',
          phases: [3],
          cdSec: 15,
          attackHpRatio: 0.7,
          heatOnHit: 4,
          castMode: 'sideRocket',
          // pre 鎖定 → ball 場外多角度直線飛入 → end 爆炸（不用 hit／mobHit）
          warningMs: 720,
          hitCount: 3,
          hitGapMs: 420,
          // 固定飛行速度（px/s）；短距不再變慢
          ballSpeedPx: 1000,
          edgePadPx: 80,
          spawnDirCount: 8,
          // 玩家距王中心小於此距離則飛向王（正服可引）
          lureBossPx: 140,
          assetKey: '1005/001',
        },
        // —— 三階：제압용 벙커 —— 8881102 skill3 召喚；effect 長動畫；兩段 hit 隔 0.99s
        {
          id: 'bunker',
          phases: [3],
          bodySummonOnly: true,
          cdSec: 20,
          attackHpRatio: 1.3,
          heatOnHit: 9,
          warningMs: 1260,
          hitCount: 2,
          hitGapMs: 990,
          assetKey: '1004/002',
          fxWarnLayers: [{ action: 'effect', anchor: 'boss' }],
          fxHitLayers: [{ action: 'hit', anchor: 'feet' }],
        },
        // —— 三階：전 방향 중력구속 —— 8881102 skill4；鐵線＋地板雷射
        {
          id: 'gravityBind',
          phases: [3],
          bodySummonOnly: true,
          cdSec: 40,
          attackHpRatio: 1.0,
          heatOnHit: 8,
          castMode: 'gravityBind',
          // regen 竄出 → loop 綁住 warningMs → hit → end 放開；hit2＝暗闇簡化
          warningMs: 1320,
          hit2Ms: 1800,
          hit2Ratio: 2.0,
          assetKey: '1004/003',
        },
        // —— 三階：발판 파괴 —— 8881102 skill6；destroyed→lockOn→ball×3 斜插＋special＋hit
        {
          id: 'platformShot',
          phases: [3],
          bodySummonOnly: true,
          cdSec: 45,
          attackHpRatio: 1.15,
          heatOnHit: 7,
          castMode: 'platformBreak',
          // destroyed 破地板（不用 destroyed2）；三塊＝ball／ball2／ball3
          hitCount: 3,
          hitGapMs: 280,
          lockMs: 1080,
          armMaxTiltRad: 0.55,
          assetKey: '1004/005',
        },
        // —— 三階：함포 —— 8881102 skill9；召喚砲→預警→發射→砲彈落地
        {
          id: 'cannons',
          phases: [3],
          bodySummonOnly: true,
          cdSec: 60,
          attackHpRatio: 1.4,
          heatOnHit: 8,
          castMode: 'skyCannons',
          // summon→stand（場頂外只露砲管）；areaWarning→attack→ball→summonSpecial（落點可抬高）
          // masking 用途未明，暫略
          warningMs: 720,
          hitCount: 3,
          hitGapMs: 900,
          ballTravelMs: 520,
          cannonMapY: -150,
          // summonSpecial 相對腳底往上（負＝抬高）
          summonSpecialYBias: -80,
          assetKey: '1004/008',
        },
        // —— 三階：무차별 폭격 —— 核心預警條 → 1.5s 後激光爆炸；4.5s×3
        {
          id: 'mapBarrage',
          phases: [3],
          cdSec: 60,
          // 나무 CD 60／60／45（覆寫 patternCdMult）
          cdMultByDiff: { normal: 1, hard: 1, extreme: 0.75 },
          // 對應 20%／25%／25% 相對強度
          attackHpRatio: 1.25,
          attackHpRatioByDiff: { normal: 1.0, hard: 1.25, extreme: 1.25 },
          heatOnHit: 8,
          castMode: 'mapBarrage',
          // pre＝紅警告（難度 6／8／9 格寬）→ effect 激光爆炸＋hit
          warningMs: 1500,
          hitCount: 3,
          hitGapMs: 4500,
          warnGridByDiff: { normal: 6, hard: 8, extreme: 9 },
          gridPx: 90,
          assetKey: '1004/009',
        },
        // —— destruction：상단 포격 —— 每次重新鎖點
        {
          id: 'downLaser',
          phases: [2, 3],
          cdSec: 12,
          cdSecByPhase: { 2: 12, 3: 20 },
          attackHpRatio: 1.6,
          heatOnHit: 12,
          castMode: 'pinpointVolley',
          requiresPurge: true,
          warningMs: 1000,
          hitCountByPhase: { 2: 3, 3: 4 },
          hitGapMs: 1700,
          assetKeyByPhase: { 2: '1008/003', 3: '1009/003' },
        },
        // —— destruction：전기장 드론 —— 0追蹤／1電場／hit tick
        {
          id: 'drone',
          phases: [1, 2, 3],
          cdSec: 25,
          cdSecByPhase: { 1: 25, 2: 35, 3: 30 },
          attackHpRatio: 0.55,
          heatOnHit: 4,
          castMode: 'fieldDrone',
          requiresPurge: true,
          chaseMs: 3000,
          fieldMs: 3500,
          hitGapMs: 360,
          assetKeyByPhase: { 1: '1006/002', 2: '1008/002', 3: '1009/002' },
        },
        // —— destruction：가로 포격 —— 僅 P2／P3；0發射器／1光波
        {
          id: 'purgeRoutine',
          phases: [2, 3],
          cdSec: 15,
          attackHpRatio: 1.3,
          heatOnHit: 16,
          castMode: 'horizontalBarrage',
          requiresPurge: true,
          warningMs: 1500,
          fireMs: 3000,
          tickMs: 500,
          gunAttackRepeatIdx: 13,
          waveSpecialRepeatIdx: 4,
          // 高度＝corePos；發射器靠地圖右／左緣
          edgePadPx: 36,
          assetKeyByPhase: { 2: '1008/000', 3: '1009/000' },
        },
      ],
    },
    difficulties: [
      {
        id: 'normal',
        hpMult: 1,
        formHpMult: {
          '8881100': 250,
          '8881101': 250,
          '8881102': 375,
        },
        dmgMult: 25,
        // 相對 Hard：CD 稍長（全模式再 ×0.75）
        patternCdMult: 0.8625,
        reqLevel: 160,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01004422', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01004423', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01004424', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01004425', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01004426', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01102775', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01102794', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01102795', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01102796', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01102797', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01082636', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01082637', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01082638', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01082639', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01082640', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01073030', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01073032', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01073033', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01073034', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01073035', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01152174', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01152176', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01152177', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01152178', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01152179', amount: 1, chance: 1 },
          { kind: 'etc', itemId: '04310156', amount: 1 },
          { kind: 'etc', itemId: '02630291', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
        ],
      },
      {
        id: 'hard',
        hpMult: 1,
        formHpMult: {
          '8881100': 5000,
          '8881101': 5000,
          '8881102': 7500,
        },
        dmgMult: 40,
        patternCdMult: 0.75,
        reqLevel: 190,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01004422', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01004423', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01004424', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01004425', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01004426', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01102775', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01102794', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01102795', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01102796', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01102797', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01082636', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01082637', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01082638', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01082639', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01082640', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01073030', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01073032', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01073033', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01073034', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01073035', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01152174', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01152176', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01152177', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01152178', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01152179', amount: 1, chance: 3 },
          { kind: 'equip', itemId: '01372222', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01402251', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01522138', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01472261', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01222109', amount: 1, chance: 1 },
          { kind: 'equip', itemId: '01012632', amount: 1, chance: 0.1 },
          { kind: 'consume', consumeType: 'starforce_scroll', scrollId: 'scroll_set20', amount: 1, chance: 4 },
          { kind: 'etc', itemId: '04310156', amount: 1 },
          { kind: 'etc', itemId: '04310156', amount: 1 , chance: 10},
          { kind: 'etc', itemId: '04310156', amount: 1 , chance: 30},
          { kind: 'etc', itemId: '02630291', amount: 1, chance: 30 },
          { kind: 'etc', itemId: '02630292', amount: 1, chance: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'meowcoin', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
          { kind: 'etc', itemId: 'nekopow', amount: 10 },
        ],
      },
      {
        id: 'extreme',
        hpMult: 1,
        formHpMult: {
          '8881100': 250000,
          '8881101': 250000,
          '8881102': 375000,
        },
        dmgMult: 60,
        // 相對 Hard：CD 稍短（全模式再 ×0.75）
        patternCdMult: 0.6,
        reqLevel: 250,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'equip', itemId: '01004422', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01004423', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01004424', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01004425', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01004426', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102775', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102794', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102795', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102796', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01102797', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082636', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082637', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082638', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082639', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01082640', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01073030', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01073032', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01073033', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01073034', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01073035', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152174', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152176', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152177', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152178', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01152179', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01372222', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01402251', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01522138', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01472261', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01222109', amount: 1, chance: 5 },
          { kind: 'equip', itemId: '01012632', amount: 1, chance: 5 },
          { kind: 'consume', consumeType: 'starforce_scroll', scrollId: 'scroll_set20', amount: 1, chance: 10 },
          { kind: 'consume', consumeType: 'starforce_scroll', scrollId: 'scroll_under23_30', amount: 1, chance: 5 },        
          { kind: 'etc', itemId: '01102832', amount: 1, chance: 0.1 },
          { kind: 'etc', itemId: '04310156', amount: 1 },
          { kind: 'etc', itemId: '04310156', amount: 1 , chance: 10},
          { kind: 'etc', itemId: '04310156', amount: 1 , chance: 30},
          { kind: 'etc', itemId: '04310156', amount: 1 , chance: 30},
          { kind: 'etc', itemId: '04310156', amount: 1 , chance: 30},
          { kind: 'etc', itemId: '02630291', amount: 1 },
          { kind: 'etc', itemId: '02630292', amount: 1 , chance: 30 },
          { kind: 'etc', itemId: 'meowcoin', amount: 20 },
          { kind: 'etc', itemId: 'meowcoin', amount: 20 },
          { kind: 'etc', itemId: 'meowcoin', amount: 20 },
          { kind: 'etc', itemId: 'nekopow', amount: 20 },
          { kind: 'etc', itemId: 'nekopow', amount: 20 },
          { kind: 'etc', itemId: 'nekopow', amount: 20 },
        ],
      },
    ],
  },
};

if (typeof window !== 'undefined') {
  window.IDLE_BOSS_DIFF_META = IDLE_BOSS_DIFF_META;
  window.IDLE_BOSS_DIFF_ORDER = IDLE_BOSS_DIFF_ORDER;
  window.IdleBossDiff = IdleBossDiff;
  window.IDLE_BOSS_PHASE = IDLE_BOSS_PHASE;
}
