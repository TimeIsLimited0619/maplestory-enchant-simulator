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
        hpMult: 10,
        dmgMult: 5,
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
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
          { kind: 'etc', itemId: 'meowcoin', amount: 5 },
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
        hpMult: 50,
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
    name: '粉紅豆豆',
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
        hpMult: 30,
        dmgMult: 15,
        reqLevel: 180,
        timeLimitSec: 1800,
        rewards: [
          { kind: 'consume', itemId: 'Reindeer-milk', amount: 5 },
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
        hpMult: 1,
        dmgMult: 1,
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
          { kind: 'etc', itemId: '140armor_pcs', amount: 1, chance: 50 },
          { kind: 'etc', itemId: '140weapon_pcs', amount: 1, chance: 30 },
        ],
      },
      {
        id: 'hard',
        hpMult: 6,
        dmgMult: 3,
        reqLevel: 190,
        timeLimitSec: 1800,
        rewards: [
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
