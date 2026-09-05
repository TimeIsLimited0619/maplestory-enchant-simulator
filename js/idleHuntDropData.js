/**
 * 放置掉落／擊殺獎勵本機覆寫。舊存檔若是陣列，視為只有 drops。
 */
const IdleZoneDropStore = {
  KEY: 'idle.gm.drops.v2',
  OLD_KEY: 'idle.gm.drops.v1',
  BANDS_KEY: 'idle.gm.bands.v1',
  CUSTOM_KEY: 'idle.gm.customMaps.v1',
  GLOBAL_KEY: 'idle.gm.globalDrops.v1',
  data: {},
  bands: null,
  customMaps: null,
  globalDrops: null,

  migrateChance(n) {
    const v = Number(n);
    if (!Number.isFinite(v) || v <= 0) return 0;
    if (v <= 1) return v * 100;
    return v;
  },

  migrateDropRows(rows) {
    if (!Array.isArray(rows)) return rows;
    return rows.map((row) => (
      row && typeof row === 'object'
        ? { ...row, chance: this.migrateChance(row.chance) }
        : row
    ));
  },

  migrateZoneCfg(cfg) {
    if (Array.isArray(cfg)) return this.migrateDropRows(cfg);
    if (!cfg || typeof cfg !== 'object') return cfg;
    const next = { ...cfg };
    if (Array.isArray(next.drops)) next.drops = this.migrateDropRows(next.drops);
    if (Array.isArray(next.mobDrops)) next.mobDrops = this.migrateDropRows(next.mobDrops);
    if (Array.isArray(next.bossDrops)) next.bossDrops = this.migrateDropRows(next.bossDrops);
    return next;
  },

  load() {
    try {
      let raw = JSON.parse(localStorage.getItem(this.KEY) || 'null');
      let fromOld = false;
      if (!raw || typeof raw !== 'object') {
        raw = JSON.parse(localStorage.getItem(this.OLD_KEY) || '{}');
        fromOld = true;
      }
      this.data = raw && typeof raw === 'object' ? raw : {};
      if (fromOld) {
        Object.keys(this.data).forEach((id) => {
          this.data[id] = this.migrateZoneCfg(this.data[id]);
        });
        this.save();
        try { localStorage.removeItem(this.OLD_KEY); } catch (_) { /* ignore */ }
      }
    } catch (_) {
      this.data = {};
    }
    try {
      const raw = JSON.parse(localStorage.getItem(this.BANDS_KEY) || 'null');
      this.bands = Array.isArray(raw) ? raw : null;
    } catch (_) {
      this.bands = null;
    }
    try {
      const raw = JSON.parse(localStorage.getItem(this.CUSTOM_KEY) || 'null');
      this.customMaps = Array.isArray(raw) ? raw : null;
    } catch (_) {
      this.customMaps = null;
    }
    try {
      const raw = JSON.parse(localStorage.getItem(this.GLOBAL_KEY) || 'null');
      this.globalDrops = raw && typeof raw === 'object' ? this.normalizeGlobal(raw) : null;
    } catch (_) {
      this.globalDrops = null;
    }
    this.pruneImportedEquips();
  },

  normalizeGlobal(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    // 機率以 % 原值儲存（0.5 = 0.5%），不可套用舊版分數→百分比 migrateChance
    const cloneRows = (list) => (
      Array.isArray(list) ? list.map((row) => (row && typeof row === 'object' ? { ...row } : row)) : []
    );
    return {
      mobDrops: cloneRows(src.mobDrops),
      bossDrops: cloneRows(src.bossDrops),
    };
  },

  defaultGlobalFromFile() {
    const runtime = typeof window !== 'undefined' && window.IDLE_ZONE_GLOBAL_DROPS
      ? window.IDLE_ZONE_GLOBAL_DROPS
      : null;
    const file = typeof IDLE_ZONE_GLOBAL_DROPS !== 'undefined' ? IDLE_ZONE_GLOBAL_DROPS : null;
    return this.normalizeGlobal(runtime || file || {});
  },

  getGlobal() {
    if (this.globalDrops) return this.normalizeGlobal(this.globalDrops);
    return this.defaultGlobalFromFile();
  },

  saveGlobal() {
    try {
      if (this.globalDrops == null) localStorage.removeItem(this.GLOBAL_KEY);
      else localStorage.setItem(this.GLOBAL_KEY, JSON.stringify(this.globalDrops));
    } catch (_) { /* ignore */ }
  },

  setGlobal(cfg) {
    this.globalDrops = this.normalizeGlobal(cfg);
    this.saveGlobal();
    if (typeof window !== 'undefined') window.IDLE_ZONE_GLOBAL_DROPS = this.normalizeGlobal(this.globalDrops);
    return this.globalDrops;
  },

  patchGlobal(partial) {
    const cur = this.getGlobal();
    const patch = partial && typeof partial === 'object' ? partial : {};
    return this.setGlobal({ ...cur, ...patch });
  },

  clearGlobal() {
    this.globalDrops = null;
    this.saveGlobal();
  },

  pruneImportedEquips() {
    const orig = new Set();
    if (typeof ORIGINAL_EQUIP_IDS !== 'undefined' && Array.isArray(ORIGINAL_EQUIP_IDS)) {
      ORIGINAL_EQUIP_IDS.forEach((id) => orig.add(String(id)));
    }
    if (typeof WZ_IMPORTED_EQUIP_IDS !== 'undefined' && Array.isArray(WZ_IMPORTED_EQUIP_IDS)) {
      WZ_IMPORTED_EQUIP_IDS.forEach((id) => orig.add(String(id)));
    }
    if (!orig.size) return;
    const keep = (row) => {
      if (!row || row.kind !== 'equip') return true;
      return orig.has(String(row.itemId || ''));
    };
    const pruneBand = (band) => {
      if (!band || typeof band !== 'object') return band;
      const next = { ...band };
      ['mobDrops', 'bossDrops'].forEach((key) => {
        if (!Array.isArray(next[key])) return;
        next[key] = next[key].filter(keep);
      });
      return next;
    };
    let changed = false;
    if (Array.isArray(this.bands)) {
      const nextBands = this.bands.map(pruneBand);
      if (JSON.stringify(nextBands) !== JSON.stringify(this.bands)) {
        this.bands = nextBands;
        changed = true;
      }
    }
    if (this.globalDrops) {
      const nextGlobal = pruneBand(this.globalDrops);
      if (JSON.stringify(nextGlobal) !== JSON.stringify(this.globalDrops)) {
        this.globalDrops = nextGlobal;
        changed = true;
      }
    }
    Object.keys(this.data).forEach((id) => {
      const cfg = this.data[id];
      if (Array.isArray(cfg)) {
        const next = cfg.filter(keep);
        if (next.length !== cfg.length) {
          this.data[id] = next;
          changed = true;
        }
        return;
      }
      if (!cfg || typeof cfg !== 'object') return;
      ['drops', 'mobDrops', 'bossDrops'].forEach((key) => {
        if (!Array.isArray(cfg[key])) return;
        const next = cfg[key].filter(keep);
        if (next.length !== cfg[key].length) {
          cfg[key] = next;
          changed = true;
        }
      });
    });
    if (changed) {
      this.save();
      if (this.globalDrops) this.saveGlobal();
      if (Array.isArray(this.bands)) this.saveBands();
    }
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (_) { /* ignore */ }
  },

  saveBands() {
    try {
      if (this.bands == null) localStorage.removeItem(this.BANDS_KEY);
      else localStorage.setItem(this.BANDS_KEY, JSON.stringify(this.bands));
    } catch (_) { /* ignore */ }
  },

  setBands(list) {
    this.bands = Array.isArray(list)
      ? list.map((band) => {
        if (!band || typeof band !== 'object') return band;
        const next = { ...band };
        if (Array.isArray(next.mobDrops)) {
          next.mobDrops = next.mobDrops.map((row) => ({ ...row }));
        }
        if (Array.isArray(next.bossDrops)) {
          next.bossDrops = next.bossDrops.map((row) => ({ ...row }));
        }
        return next;
      })
      : null;
    this.saveBands();
  },

  /** 與 patch(zoneId) 相同：合併區塊掉落，機率以 % 原值儲存（0.5 = 0.5%）。 */
  patchBand(bandKey, partial) {
    if (typeof IdleZones === 'undefined') return null;
    const key = String(bandKey || '');
    if (!key || key === 'unassigned') return null;
    const patch = partial && typeof partial === 'object' ? partial : {};
    const list = IdleZones.bandDefList().map((d) => (
      d.id === key ? { ...d, ...patch } : d
    ));
    const next = list.map((row, i) => IdleZones.normalizeBand(row, `band-${i + 1}`));
    this.setBands(next);
    if (typeof window !== 'undefined') window.IDLE_ZONE_BAND_DEFS = next;
    return next.find((d) => d.id === key) || null;
  },

  clearBands() {
    this.bands = null;
    this.saveBands();
  },

  saveCustomMaps() {
    try {
      if (this.customMaps == null) localStorage.removeItem(this.CUSTOM_KEY);
      else localStorage.setItem(this.CUSTOM_KEY, JSON.stringify(this.customMaps));
    } catch (_) { /* ignore */ }
  },

  setCustomMaps(list) {
    this.customMaps = Array.isArray(list) ? list.map((row) => ({ ...row })) : null;
    this.saveCustomMaps();
  },

  clearCustomMaps() {
    this.customMaps = null;
    this.saveCustomMaps();
  },

  wrap(raw) {
    if (Array.isArray(raw)) {
      const rows = raw.map((row) => ({ ...row }));
      return { drops: rows, mobDrops: rows.map((row) => ({ ...row })), bossDrops: [] };
    }
    if (!raw || typeof raw !== 'object') return { drops: [], mobDrops: [], bossDrops: [] };
    const legacy = Array.isArray(raw.drops) ? raw.drops.map((row) => ({ ...row })) : [];
    const mobDrops = Array.isArray(raw.mobDrops) ? raw.mobDrops.map((row) => ({ ...row })) : legacy;
    const bossDrops = Array.isArray(raw.bossDrops) ? raw.bossDrops.map((row) => ({ ...row })) : [];
    return {
      drops: legacy,
      mobDrops,
      bossDrops,
      killExp: raw.killExp,
      killGold: raw.killGold,
      monsterHp: raw.monsterHp,
      bossHp: raw.bossHp,
      bossKillExp: raw.bossKillExp,
      bossKillGold: raw.bossKillGold,
      mobName: raw.mobName,
      mobIcon: raw.mobIcon,
      bossName: raw.bossName,
      bossIcon: raw.bossIcon,
      bossScaleSprite: raw.bossScaleSprite,
      bossScaleHud: raw.bossScaleHud,
      artId: raw.artId,
      name: raw.name,
      regionName: raw.regionName,
      bandName: raw.bandName,
      bandKey: raw.bandKey,
      bandMin: raw.bandMin,
      bandMax: raw.bandMax,
      replayBossKills: raw.replayBossKills,
      smallKills: raw.smallKills,
      mobAtk1Dmg: raw.mobAtk1Dmg != null ? raw.mobAtk1Dmg : raw.mobHitDmg,
      mobAtk1Cd: raw.mobAtk1Cd != null ? raw.mobAtk1Cd : raw.mobHitCd,
      mobAtk2Dmg: raw.mobAtk2Dmg,
      mobAtk2Cd: raw.mobAtk2Cd,
      mobAtk3Dmg: raw.mobAtk3Dmg,
      mobAtk3Cd: raw.mobAtk3Cd,
      mobSkill1Dmg: raw.mobSkill1Dmg != null ? raw.mobSkill1Dmg : raw.mobSkillDmg,
      mobSkill1Cd: raw.mobSkill1Cd != null ? raw.mobSkill1Cd : raw.mobSkillCd,
      mobSkill2Dmg: raw.mobSkill2Dmg,
      mobSkill2Cd: raw.mobSkill2Cd,
      mobSkill3Dmg: raw.mobSkill3Dmg,
      mobSkill3Cd: raw.mobSkill3Cd,
      mobSkillDmg: raw.mobSkill1Dmg != null ? raw.mobSkill1Dmg : raw.mobSkillDmg,
      mobSkillCd: raw.mobSkill1Cd != null ? raw.mobSkill1Cd : raw.mobSkillCd,
      bossAtk1Dmg: raw.bossAtk1Dmg != null ? raw.bossAtk1Dmg : raw.bossHitDmg,
      bossAtk1Cd: raw.bossAtk1Cd != null ? raw.bossAtk1Cd : raw.bossHitCd,
      bossAtk2Dmg: raw.bossAtk2Dmg,
      bossAtk2Cd: raw.bossAtk2Cd,
      bossAtk3Dmg: raw.bossAtk3Dmg,
      bossAtk3Cd: raw.bossAtk3Cd,
      bossSkill1Dmg: raw.bossSkill1Dmg != null ? raw.bossSkill1Dmg : raw.bossSkillDmg,
      bossSkill1Cd: raw.bossSkill1Cd != null ? raw.bossSkill1Cd : raw.bossSkillCd,
      bossSkill2Dmg: raw.bossSkill2Dmg,
      bossSkill2Cd: raw.bossSkill2Cd,
      bossSkill3Dmg: raw.bossSkill3Dmg,
      bossSkill3Cd: raw.bossSkill3Cd,
      bossSkillDmg: raw.bossSkill1Dmg != null ? raw.bossSkill1Dmg : raw.bossSkillDmg,
      bossSkillCd: raw.bossSkill1Cd != null ? raw.bossSkill1Cd : raw.bossSkillCd,
    };
  },

  has(zoneId) {
    return Object.prototype.hasOwnProperty.call(this.data, String(zoneId || ''));
  },

  config(zoneId) {
    return this.wrap(this.data[String(zoneId || '')]);
  },

  get(zoneId) {
    return this.config(zoneId).drops;
  },

  set(zoneId, cfg) {
    this.data[String(zoneId)] = this.wrap(cfg);
    this.save();
  },

  patch(zoneId, partial) {
    const cur = typeof IdleZones !== 'undefined'
      ? IdleZones.configFor(IdleZones.get(zoneId))
      : this.config(zoneId);
    this.set(zoneId, { ...cur, ...partial });
  },

  remove(zoneId) {
    delete this.data[String(zoneId)];
    this.save();
  },

  clearAll() {
    this.data = {};
    this.save();
    this.clearBands();
    this.clearCustomMaps();
    this.clearGlobal();
  },
};

IdleZoneDropStore.load();
if (typeof IdleZones !== 'undefined') IdleZones.rebuildList();

const IdleHuntDropData = {
  chancePercent(row) {
    const n = Number(row?.chance);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(100, n);
  },

  amount(row) {
    const min = Number(row?.amountMin);
    const max = Number(row?.amountMax);
    if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
      return min + Math.floor(Math.random() * (max - min + 1));
    }
    const n = Number(row?.amount);
    return Number.isFinite(n) && n > 0 ? n : 1;
  },

  rowsFor(zone, isBoss) {
    if (typeof IdleZones !== 'undefined' && typeof IdleZones.dropsFor === 'function') {
      return IdleZones.dropsFor(zone, isBoss);
    }
    if (isBoss) return Array.isArray(zone?.bossDrops) ? zone.bossDrops : [];
    if (Array.isArray(zone?.mobDrops) && zone.mobDrops.length) return zone.mobDrops;
    return Array.isArray(zone?.drops) ? zone.drops : [];
  },

  roll(zone, isBoss) {
    const hits = [];
    this.rowsFor(zone, isBoss).forEach((row) => {
      if (!row || !row.kind) return;
      if (Math.random() * 100 >= this.chancePercent(row)) return;
      hits.push({ ...row, amount: this.amount(row) });
    });
    return hits;
  },
};

if (typeof window !== 'undefined') {
  window.IdleZoneDropStore = IdleZoneDropStore;
  window.IdleHuntDropData = IdleHuntDropData;
}
