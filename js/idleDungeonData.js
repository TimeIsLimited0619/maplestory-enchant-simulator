/**
 * 副本設定（本機可改）。入場券在野外地圖掉落。
 * BOSS 類之後另做；此處只編輯／進入金幣、素材、地下城。
 */
const IdleDungeonStore = {
  KEY: 'idle.dungeon.v1',
  list: [],
  CATEGORIES: [
    { id: 'gold', name: '計時副本' },
    { id: 'material', name: '傷害副本' },
    { id: 'dungeon', name: '地下城' },
  ],
  ATK_SLOTS: ['Atk1', 'Atk2', 'Atk3', 'Skill1', 'Skill2', 'Skill3'],
  ATK_DEFAULTS: {
    mobAtk1Dmg: 5,
    mobAtk1Cd: 0.6,
    mobSkill1Cd: 8,
    bossAtk1Dmg: 15,
    bossAtk1Cd: 2,
    bossSkill1Cd: 10,
  },

  defaultList() {
    const src = (typeof window !== 'undefined' && Array.isArray(window.IDLE_DUNGEON_LIST) && window.IDLE_DUNGEON_LIST.length)
      ? window.IDLE_DUNGEON_LIST
      : ((typeof IDLE_DUNGEON_LIST !== 'undefined' && Array.isArray(IDLE_DUNGEON_LIST) && IDLE_DUNGEON_LIST.length)
        ? IDLE_DUNGEON_LIST
        : []);
    if (!src.length) return [];
    try {
      return JSON.parse(JSON.stringify(src));
    } catch (_) {
      return src.map((row) => ({ ...row }));
    }
  },

  load() {
    const fromFile = this.defaultList().map((row) => this.normalize(row)).filter(Boolean);
    if (fromFile.length) {
      // 以 idleDungeonListData.js 為準（與章節 GM 寫檔一致），避免舊 localStorage 蓋掉已寫入內容
      this.list = fromFile;
      this.save();
      return;
    }
    try {
      const raw = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      if (Array.isArray(raw) && raw.length) {
        this.list = raw.map((row) => this.normalize(row)).filter(Boolean);
        return;
      }
    } catch (_) { /* ignore */ }
    this.list = [];
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.list));
    } catch (_) { /* ignore */ }
  },

  normalizeDiff(row, index) {
    const d = row && typeof row === 'object' ? row : {};
    return {
      id: String(d.id || index + 1),
      name: String(d.name || `難度 ${index + 1}`),
      reqLevel: Math.max(0, Math.floor(Number(d.reqLevel) || 0)),
      killNeed: Math.max(0, Math.floor(Number(d.killNeed) || 0)),
      settleGoldPerKill: Math.max(0, Math.floor(Number(d.settleGoldPerKill) || 0)),
      clearGold: Math.max(0, Math.floor(Number(d.clearGold) || 0)),
      hpMult: Math.max(0.1, Number(d.hpMult) || 1),
      dmgMult: Math.max(0.1, Number(d.dmgMult) || 1),
      dropAmountMult: Math.max(0, Number(d.dropAmountMult) || 1),
      dropRateMult: Math.max(0, Number(d.dropRateMult) || 1),
      rewards: this.normalizeRewards(d.rewards),
    };
  },

  normalizeTier(row, index) {
    const t = row && typeof row === 'object' ? row : {};
    return {
      minDamage: Math.max(0, Math.floor(Number(t.minDamage) || 0)),
      gold: Math.max(0, Math.floor(Number(t.gold) || 0)),
      name: String(t.name || `門檻 ${index + 1}`),
      rewards: this.normalizeRewards(t.rewards),
    };
  },

  normalizeReward(row) {
    if (!row || typeof row !== 'object') return null;
    const kind = ['equip', 'consume', 'etc'].includes(row.kind) ? row.kind : '';
    if (!kind) return null;
    const amount = Math.max(1, Math.floor(Number(row.amount) || 1));
    const chance = Math.max(0, Math.min(100, Number(row.chance)));
    const shownChance = Number.isFinite(chance) ? chance : 100;
    if (kind === 'equip') {
      const itemId = String(row.itemId || row.id || '').trim();
      if (!itemId) return null;
      return { kind, itemId, name: String(row.name || ''), amount, chance: shownChance };
    }
    if (kind === 'etc') {
      const itemId = String(row.itemId || row.id || '').trim();
      if (!itemId) return null;
      return { kind, itemId, name: String(row.name || ''), amount, chance: shownChance };
    }
    let consumeType = String(row.consumeType || '').trim();
    let scrollId = String(row.scrollId || '').trim();
    let cubeId = String(row.cubeId || '').trim();
    let hammerId = String(row.hammerId || '').trim();
    let soulId = String(row.soulId || '').trim();
    let itemId = String(row.itemId || '').trim();
    let catalogId = String(row.catalogId || row.id || '').trim();
    let name = String(row.name || '').trim();
    // 從消耗品目錄補齊（舊資料常缺 hammerId／soulId 等）
    if (catalogId && typeof IdleConsumeStore !== 'undefined' && IdleConsumeStore.get) {
      const cat = IdleConsumeStore.get(catalogId);
      if (cat) {
        if (!consumeType) consumeType = String(cat.consumeType || '');
        if (!scrollId) scrollId = String(cat.scrollId || '');
        if (!cubeId) cubeId = String(cat.cubeId || '');
        if (!hammerId) hammerId = String(cat.hammerId || '');
        if (!soulId) soulId = String(cat.soulId || '');
        if (!itemId) itemId = String(cat.itemId || '');
        if (!name) name = String(cat.name || '');
      }
    }
    if (!hammerId && consumeType === 'hammer' && catalogId.startsWith('consume-hammer-')) {
      hammerId = catalogId.slice('consume-hammer-'.length);
    }
    if (!hammerId && consumeType === 'exceptional_hammer' && catalogId.startsWith('consume-ex-hammer-')) {
      hammerId = catalogId.slice('consume-ex-hammer-'.length);
    }
    return {
      kind: 'consume',
      consumeType,
      scrollId,
      cubeId,
      hammerId,
      soulId,
      itemId,
      catalogId,
      name,
      amount,
      chance: shownChance,
    };
  },

  normalizeRewards(list) {
    return (Array.isArray(list) ? list : []).map((row) => this.normalizeReward(row)).filter(Boolean);
  },

  atkKey(prefix, slot, kind) {
    return `${prefix}${slot}${kind}`;
  },

  readAtkNum(src, key, fallback) {
    const n = Number(src?.[key]);
    if (Number.isFinite(n) && n >= 0) return n;
    const d = Number(fallback);
    return Number.isFinite(d) && d >= 0 ? d : 0;
  },

  collectAtkFields(src) {
    const m = src && typeof src === 'object' ? src : {};
    const out = {};
    ['mob', 'boss'].forEach((prefix) => {
      (this.ATK_SLOTS || []).forEach((slot) => {
        const dmgKey = this.atkKey(prefix, slot, 'Dmg');
        const cdKey = this.atkKey(prefix, slot, 'Cd');
        const dmgFallback = this.ATK_DEFAULTS[dmgKey] || 0;
        const cdFallback = this.ATK_DEFAULTS[cdKey] || 0;
        out[dmgKey] = Math.max(0, Math.floor(this.readAtkNum(m, dmgKey, dmgFallback)));
        out[cdKey] = Math.max(0, this.readAtkNum(m, cdKey, cdFallback));
      });
    });
    return out;
  },

  inferCategory(row) {
    const raw = String(row?.category || '').trim();
    if (raw === 'boss' || ['gold', 'material', 'dungeon'].includes(raw)) return raw;
    if (row?.type === 'timed') return 'gold';
    if (row?.type === 'damage') return 'material';
    if (row?.type === 'normal') return 'dungeon';
    if (row?.type === 'boss') return 'boss';
    return 'material';
  },

  isBossDungeon(row) {
    return row?.type === 'boss' || row?.category === 'boss';
  },

  categoryLabel(id) {
    return (this.CATEGORIES || []).find((c) => c.id === id)?.name || id;
  },

  playableList() {
    return this.enabledList().filter((d) => !this.isBossDungeon(d));
  },

  editableList() {
    return this.list.filter((d) => !this.isBossDungeon(d));
  },

  byCategory(categoryId) {
    const id = String(categoryId || '');
    return this.playableList().filter((d) => d.category === id);
  },

  normalizeMob(row, index) {
    const m = row && typeof row === 'object' ? row : {};
    const name = String(m.name || m.mobName || `副本怪物${index + 1}`).trim();
    return {
      name: name || `副本怪物${index + 1}`,
      icon: String(m.icon || m.mobIcon || '').trim(),
    };
  },

  normalizeMobs(map) {
    const m = map && typeof map === 'object' ? map : {};
    if (Array.isArray(m.mobs) && m.mobs.length) {
      return m.mobs.map((row, i) => this.normalizeMob(row, i));
    }
    return [this.normalizeMob({ name: m.mobName, icon: m.mobIcon }, 0)];
  },

  pickRandomMob(map) {
    const mobs = this.normalizeMobs(map || {});
    return mobs[Math.floor(Math.random() * mobs.length)] || mobs[0] || { name: '副本怪物', icon: '' };
  },

  normalizeMap(row) {
    const m = row && typeof row === 'object' ? row : {};
    const mobs = this.normalizeMobs(m);
    return {
      name: String(m.name || '副本地圖'),
      artId: String(m.artId || m.mapArtId || '').trim(),
      mobs,
      mobName: mobs[0].name,
      mobIcon: mobs[0].icon,
      bossName: String(m.bossName || '副本 BOSS'),
      bossIcon: String(m.bossIcon || ''),
      baseMobHp: Math.max(1, Math.floor(Number(m.baseMobHp) || Number(m.monsterHp) || 100)),
      baseBossHp: Math.max(1, Math.floor(Number(m.baseBossHp) || Number(m.bossHp) || 1800)),
      ...this.collectAtkFields(m),
    };
  },

  normalize(row) {
    if (!row || typeof row !== 'object') return null;
    const type = ['timed', 'normal', 'damage', 'boss'].includes(row.type) ? row.type : 'normal';
    const diffs = Array.isArray(row.diffs) && row.diffs.length
      ? row.diffs.map((d, i) => this.normalizeDiff(d, i))
      : (type === 'damage' ? [] : [this.normalizeDiff({}, 0)]);
    const rampRef = Math.max(1, Math.floor(Number(row.dmgRampRef) || 100000));
    let rampPower = Number(row.dmgRampPower);
    if (!Number.isFinite(rampPower)) rampPower = 0.5;
    rampPower = Math.max(0.1, Math.min(2, rampPower));
    return {
      id: String(row.id || `dungeon-${Date.now()}`),
      name: String(row.name || '未命名副本'),
      type,
      category: this.inferCategory({ ...row, type }),
      enabled: row.enabled !== false,
      ticketId: String(row.ticketId || `idle-ticket-${row.id || Date.now()}`),
      ticketName: String(row.ticketName || `${row.name || '副本'}入場券`),
      durationSec: Math.max(0, Math.floor(Number(row.durationSec) || 0)),
      mobLevel: Math.max(1, Math.floor(Number(row.mobLevel) || 100)),
      reqLevel: Math.max(0, Math.floor(Number(row.reqLevel) || 0)),
      useFieldDrops: !!row.useFieldDrops,
      useFieldGold: !!row.useFieldGold,
      dmgRampRef: rampRef,
      dmgRampPower: rampPower,
      map: this.normalizeMap(row.map || row),
      mobDrops: this.normalizeRewards(row.mobDrops),
      rewards: this.normalizeRewards(row.rewards),
      diffs,
      /** >0 時：結算楓幣 = floor(總傷害 × goldPerDamage)；不走傷害門檻 */
      goldPerDamage: Math.max(0, Number(row.goldPerDamage) || 0),
      damageTiers: Array.isArray(row.damageTiers)
        ? row.damageTiers.map((t, i) => this.normalizeTier(t, i))
        : [],
    };
  },

  /** 傷害試煉：BOSS 反傷倍率 = 基礎 × (1 + (累計傷害 / 基準)^次方) */
  damageRampMult(dungeonOrRun, dealtDamage) {
    const ref = Math.max(1, Number(dungeonOrRun?.dmgRampRef) || 100000);
    let power = Number(dungeonOrRun?.dmgRampPower);
    if (!Number.isFinite(power)) power = 0.5;
    power = Math.max(0.1, Math.min(2, power));
    const dealt = Math.max(0, Number(dealtDamage) || 0);
    return 1 + Math.pow(dealt / ref, power);
  },

  enabledList() {
    return this.list.filter((d) => d.enabled);
  },

  get(id) {
    return this.list.find((d) => d.id === String(id || '')) || null;
  },

  getDiff(dungeon, diffId) {
    const list = dungeon?.diffs || [];
    return list.find((d) => d.id === String(diffId || '')) || list[0] || null;
  },

  tickets() {
    const map = new Map();
    this.list.forEach((d) => {
      if (!d.ticketId) return;
      map.set(d.ticketId, { itemId: d.ticketId, name: d.ticketName || d.name, dungeonId: d.id });
    });
    return [...map.values()];
  },

  ticketById(itemId) {
    return this.tickets().find((t) => t.itemId === String(itemId || '')) || null;
  },

  setList(next) {
    this.list = (Array.isArray(next) ? next : []).map((row) => this.normalize(row)).filter(Boolean);
    this.save();
  },

  upsert(row) {
    const next = this.normalize(row);
    if (!next) return null;
    const i = this.list.findIndex((d) => d.id === next.id);
    if (i >= 0) this.list[i] = next;
    else this.list.push(next);
    this.save();
    return next;
  },

  remove(id) {
    this.list = this.list.filter((d) => d.id !== String(id || ''));
    this.save();
  },

  resetDefaults() {
    this.list = this.defaultList().map((row) => this.normalize(row)).filter(Boolean);
    this.save();
  },

  syncRuntimeData() {
    const list = this.list.map((row) => this.normalize(row)).filter(Boolean);
    this.list = list;
    if (typeof window !== 'undefined') window.IDLE_DUNGEON_LIST = list;
    this.save();
  },

  serializeDataFile() {
    const list = this.list.map((row) => this.normalize(row)).filter(Boolean);
    const body = JSON.stringify(list, null, 2);
    return `/**
 * 副本列表（GM 可寫入）。寫入此檔請先執行 npm run gm-writer。
 */
const IDLE_DUNGEON_LIST = ${body};

if (typeof window !== 'undefined') window.IDLE_DUNGEON_LIST = IDLE_DUNGEON_LIST;
`;
  },
};

IdleDungeonStore.load();

if (typeof window !== 'undefined') window.IdleDungeonStore = IdleDungeonStore;
