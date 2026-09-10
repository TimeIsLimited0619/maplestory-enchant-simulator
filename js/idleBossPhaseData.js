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
        hpMult: 400,
        dmgMult: 20,
        reqLevel: 155,
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
        ],
      },
      {
        id: 'hard',
        hpMult: 1225,
        dmgMult: 100,
        reqLevel: 190,
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
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
          { kind: 'etc', itemId: 'nekopow', amount: 5 },
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
          { kind: 'etc', itemId: '140armor_pcs', amount: 1, chance: 50 },
          { kind: 'etc', itemId: '140weapon_pcs', amount: 1, chance: 30 },
        ],
      },
      {
        id: 'hard',
        hpMult: 60,
        dmgMult: 15,
        reqLevel: 190,
        timeLimitSec: 1800,
        rewards: [
        ],
      },
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
          { kind: 'equip', itemId: '01042254', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01042255', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01042256', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01042257', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01042258', amount: 1, chance: 10 },
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
          { kind: 'equip', itemId: '01062165', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01062166', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01062167', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01062168', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01062169', amount: 1, chance: 10 },
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
          { kind: 'equip', itemId: '01003797', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003798', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003799', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003800', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01003801', amount: 1, chance: 10 },
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
        attack1: 15,
        attack2: 35,
        attack7: 9,
        attack8: 35,
        attack9: 25,
        attack13: 15,
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
          { kind: 'equip', itemId: '01402196', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01522094', amount: 1, chance: 10 },
          { kind: 'equip', itemId: '01372177', amount: 1, chance: 10 },
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
};

if (typeof window !== 'undefined') {
  window.IDLE_BOSS_DIFF_META = IDLE_BOSS_DIFF_META;
  window.IDLE_BOSS_DIFF_ORDER = IDLE_BOSS_DIFF_ORDER;
  window.IdleBossDiff = IdleBossDiff;
  window.IDLE_BOSS_PHASE = IDLE_BOSS_PHASE;
}
