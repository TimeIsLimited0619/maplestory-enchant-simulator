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
};

if (typeof window !== 'undefined') {
  window.IDLE_BOSS_DIFF_META = IDLE_BOSS_DIFF_META;
  window.IDLE_BOSS_DIFF_ORDER = IDLE_BOSS_DIFF_ORDER;
  window.IdleBossDiff = IdleBossDiff;
  window.IDLE_BOSS_PHASE = IDLE_BOSS_PHASE;
}
