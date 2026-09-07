/**
 * 地圖列：預設每地區數張（非一等一張），GM 可改等級區間與區塊內地圖。
 *
 * 圖檔：images/idle-zones/{artId 或 regionId-mapId}.png
 * 怪物：一律 npm run import:mob（wz-xml/mob → images/idle-mobs/ + js/idleMobData.js）
 *
 * 推進：角色等級達到區塊下限即解鎖該區域；區塊內關卡仍須一關一關打過 BOSS。
 */
const IdleZones = {
  ASSET_VER: '5',
  ASSET_DIR: 'images/idle-zones',
  MOB_DIR: 'images/idle-mobs',
  MAP_W: 800,
  MAP_H: 500,
  BAND_SIZE: 10,
  SMALL_KILLS: 100,
  REPLAY_BOSS_KILLS: 10,
  DEFAULT_PLAYER: { x: 200, y: 400 },
  MOB_QUEUE: 10,
  /** 戰鬥佇列上限（畫面仍只顯示 MOB_QUEUE 隻） */
  MOB_COMBAT_QUEUE: 30,
  MOB_FIRST_X: 360,
  /** 原 5 隻 × 間距 110 的隊列總長；10 隻時均分擠進同長度 */
  MOB_LINE_SPAN: (5 - 1) * 110,
  MOB_Y: 390,

  list: [],

  isGenerated(zone) {
    if (!zone || typeof IdleHuntProgressMaps === 'undefined') return false;
    if (zone.custom) return false;
    const seq = this.mapIndex(zone);
    const gen = IdleHuntProgressMaps.makeMap(seq);
    return !!(gen && `${gen.regionId}-${gen.mapId}` === this.id(zone));
  },

  /** 自動範本地圖若未指定區塊，不列入清單（避免「未分類」塞滿 120 張） */
  shouldListMap(zone) {
    const z = zone?.mapId ? zone : this.get(zone);
    if (!z) return false;
    if (z.custom) return true;
    if (!this.isGenerated(z)) return true;
    return this.bandOf(z).id !== 'unassigned';
  },

  rebuildList() {
    const built = (typeof IdleHuntProgressMaps !== 'undefined' && IdleHuntProgressMaps.build)
      ? IdleHuntProgressMaps.build()
      : [];
    const extras = this.customMapList();
    const byId = new Map();
    built.forEach((z) => byId.set(`${z.regionId}-${z.mapId}`, { ...z }));
    extras.forEach((z) => {
      const id = `${z.regionId}-${z.mapId}`;
      byId.set(id, { ...(byId.get(id) || {}), ...z, custom: true });
    });
    const patches = (typeof window !== 'undefined' && window.IDLE_ZONE_PATCHES && typeof window.IDLE_ZONE_PATCHES === 'object')
      ? window.IDLE_ZONE_PATCHES
      : ((typeof IDLE_ZONE_PATCHES !== 'undefined' && IDLE_ZONE_PATCHES)
        ? IDLE_ZONE_PATCHES
        : {});
    const merged = [...byId.values()]
      .map((z) => {
        const id = `${z.regionId}-${z.mapId}`;
        const p = patches[id];
        return p && typeof p === 'object' ? { ...z, ...p } : z;
      })
      .filter((z) => this.shouldListMap(z))
      .sort((a, b) => this.mapIndex(a) - this.mapIndex(b));
    this.list = merged;
    if (typeof window !== 'undefined') window.IDLE_ZONE_LIST = merged;
    return merged;
  },

  id(zone) {
    const z = zone && (zone.regionId != null && zone.regionId !== '' || zone.mapId != null && zone.mapId !== '')
      ? zone
      : this.get(zone);
    if (!z) return '';
    return `${z.regionId}-${z.mapId}`;
  },

  mapIndex(zone) {
    const z = zone && (zone.regionId || zone.mapId) ? zone : this.get(zone);
    const n = Number(z?.mapIndex || z?.mapId || z?.unlockLevel);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  },

  playerLevel() {
    if (typeof CharacterProgression !== 'undefined') {
      return CharacterProgression.getState().level || 1;
    }
    return 1;
  },

  get(id) {
    const key = String(id || '');
    return this.list.find((z) => this.id(z) === key) || this.list[0];
  },

  byIndex(index) {
    const n = Math.max(1, Math.floor(Number(index) || 1));
    return this.list.find((z) => this.mapIndex(z) === n) || null;
  },

  isUnlocked(zone) {
    const z = zone?.mapId ? zone : this.get(zone);
    const meta = this.bandOf(z);
    if (!z || meta.id === 'unassigned') return false;
    if (!this.isBandUnlocked(meta)) return false;
    const band = this.bandByKey(meta.key) || this.bands().find((b) => b.id === meta.id);
    const maps = this.sortedMaps(band);
    const i = maps.findIndex((row) => this.id(row) === this.id(z));
    if (i < 0) return false;
    if (i === 0) return true;
    const prev = maps[i - 1];
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.isBossCleared === 'function') {
      return IdleHunt.isBossCleared(this.id(prev));
    }
    return false;
  },

  levelCap() {
    if (typeof IdleHuntProgressMaps !== 'undefined' && IdleHuntProgressMaps.LEVEL_CAP) {
      return IdleHuntProgressMaps.LEVEL_CAP;
    }
    return 300;
  },

  clampLevel(value, fallback) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.max(1, Math.min(this.levelCap(), n));
  },

  normalizeBand(raw, fallbackId) {
    let min = this.clampLevel(raw?.min, 1);
    let max = this.clampLevel(raw?.max, min);
    if (max < min) {
      const t = min;
      min = max;
      max = t;
    }
    const id = String(raw?.id || raw?.key || fallbackId || `${min}-${max}`);
    return {
      id,
      min,
      max,
      name: String(raw?.name || '').trim(),
      mobDrops: Array.isArray(raw?.mobDrops) ? raw.mobDrops.map((row) => ({ ...row })) : [],
      bossDrops: Array.isArray(raw?.bossDrops) ? raw.bossDrops.map((row) => ({ ...row })) : [],
    };
  },

  defaultBandDefs() {
    if (typeof IdleHuntProgressMaps !== 'undefined' && IdleHuntProgressMaps.defaultBands) {
      return IdleHuntProgressMaps.defaultBands().map((row, i) => this.normalizeBand(row, `band-${i + 1}`));
    }
    return [];
  },

  bandDefList() {
    if (typeof IdleZoneDropStore !== 'undefined' && Array.isArray(IdleZoneDropStore.bands) && IdleZoneDropStore.bands.length) {
      return IdleZoneDropStore.bands.map((row, i) => this.normalizeBand(row, `band-${i + 1}`));
    }
    const runtime = typeof window !== 'undefined' && Array.isArray(window.IDLE_ZONE_BAND_DEFS)
      ? window.IDLE_ZONE_BAND_DEFS
      : null;
    const file = typeof IDLE_ZONE_BAND_DEFS !== 'undefined' && Array.isArray(IDLE_ZONE_BAND_DEFS)
      ? IDLE_ZONE_BAND_DEFS
      : null;
    const src = runtime?.length ? runtime : file;
    if (src?.length) {
      return src.map((row, i) => this.normalizeBand(row, `band-${i + 1}`));
    }
    return this.defaultBandDefs();
  },

  setBandDefs(list) {
    const next = (list || []).map((row, i) => this.normalizeBand(row, `band-${i + 1}`));
    if (typeof IdleZoneDropStore !== 'undefined') IdleZoneDropStore.setBands(next);
    if (typeof window !== 'undefined') window.IDLE_ZONE_BAND_DEFS = next;
    return next;
  },

  bandOf(zone) {
    const z = zone?.mapId ? zone : this.get(zone);
    const cfg = this.configFor(z);
    const defs = this.bandDefList();
    const key = String(cfg.bandKey || z.bandKey || '');
    const byKey = defs.find((d) => d.id === key);
    if (byKey) return { ...byKey, key: byKey.id };
    return {
      id: 'unassigned',
      key: 'unassigned',
      min: 1,
      max: this.levelCap(),
      name: '未分類',
    };
  },

  bands() {
    const groups = new Map();
    this.bandDefList().forEach((d) => {
      groups.set(d.id, { ...d, key: d.id, maps: [] });
    });
    this.list.forEach((z) => {
      const b = this.bandOf(z);
      if (!groups.has(b.key)) groups.set(b.key, { ...b, maps: [] });
      groups.get(b.key).maps.push(z);
    });
    return [...groups.values()].sort((a, b) => {
      if (a.id === 'unassigned') return 1;
      if (b.id === 'unassigned') return -1;
      return a.min - b.min || String(a.id).localeCompare(String(b.id));
    });
  },

  bandByKey(key) {
    return this.bands().find((b) => b.key === String(key || '') || b.id === String(key || '')) || null;
  },

  sortedMaps(band) {
    return [...(band?.maps || [])].sort((a, b) => this.mapIndex(a) - this.mapIndex(b)
      || this.id(a).localeCompare(this.id(b)));
  },

  orderedMaps() {
    const out = [];
    this.bands().forEach((band) => {
      if (band.id === 'unassigned') return;
      this.sortedMaps(band).forEach((z) => out.push(z));
    });
    const loose = this.bands().find((b) => b.id === 'unassigned');
    if (loose) this.sortedMaps(loose).forEach((z) => out.push(z));
    return out;
  },

  nextAfter(zone) {
    const all = this.orderedMaps();
    const id = this.id(zone);
    const i = all.findIndex((z) => this.id(z) === id);
    return i >= 0 ? (all[i + 1] || null) : null;
  },

  prevBefore(zone) {
    const all = this.orderedMaps();
    const id = this.id(zone);
    const i = all.findIndex((z) => this.id(z) === id);
    return i > 0 ? all[i - 1] : null;
  },

  isBandUnlocked(band) {
    if (!band) return false;
    return this.playerLevel() >= (Number(band.min) || 1);
  },

  clampId(id) {
    const found = this.get(id);
    const foundId = found ? this.id(found) : '';
    if (found && foundId && this.isUnlocked(found) && foundId === String(id || '')) return foundId;
    // 地圖仍存在但暫時未解鎖時保留原 ID（避免切模式讀到模擬器等級被 clamp 成「第 4 狩獵場」）
    if (found && foundId) return foundId;
    let pick = this.list[0] || this.orderedMaps?.()[0];
    this.list.forEach((z) => {
      if (this.isUnlocked(z)) pick = z;
    });
    return pick ? this.id(pick) : String(id || 'mapleisland-1');
  },

  label(zone) {
    const z = zone?.mapId ? zone : this.get(zone);
    const cfg = this.configFor(z);
    const name = cfg.name || z.name;
    const region = cfg.regionName || z.regionName;
    return `${region} · ${name}`;
  },

  bandLabel(band) {
    if (band?.name) return band.name;
    const z = band?.maps?.[0];
    if (z) {
      const cfg = this.configFor(z);
      if (cfg.bandName || cfg.regionName || z.regionName) {
        return cfg.bandName || cfg.regionName || z.regionName;
      }
    }
    if (band?.min && band?.max) return `Lv.${band.min}～${band.max}`;
    return band?.key || '';
  },

  applyBandRange(bandId, min, max) {
    const id = String(bandId || '');
    const defs = this.bandDefList();
    const next = defs.map((d) => (
      d.id === id ? this.normalizeBand({ ...d, min, max }) : d
    ));
    this.setBandDefs(next);
    this.applyMergedList(this.mergedList());
    return this.bandByKey(id);
  },

  addBand(min, max, name) {
    const band = this.normalizeBand({
      id: `band-${Date.now()}`,
      min,
      max,
      name: String(name || '').trim(),
    });
    if (!band.name) band.name = `Lv.${band.min}～${band.max}`;
    this.setBandDefs([...this.bandDefList(), band]);
    this.applyMergedList(this.mergedList());
    return band;
  },

  assignMapToBand(zoneId, bandId) {
    const band = this.bandByKey(bandId) || this.bandDefList().find((d) => d.id === String(bandId));
    if (!band || typeof IdleZoneDropStore === 'undefined') return null;
    IdleZoneDropStore.patch(zoneId, {
      bandKey: band.id,
      bandMin: band.min,
      bandMax: band.max,
      regionName: band.name || undefined,
      bandName: band.name || undefined,
    });
    this.applyMergedList(this.mergedList());
    return this.get(zoneId);
  },

  customMapList() {
    if (typeof IdleZoneDropStore !== 'undefined' && Array.isArray(IdleZoneDropStore.customMaps) && IdleZoneDropStore.customMaps.length) {
      return IdleZoneDropStore.customMaps;
    }
    const runtime = typeof window !== 'undefined' && Array.isArray(window.IDLE_ZONE_CUSTOM_MAPS)
      ? window.IDLE_ZONE_CUSTOM_MAPS
      : null;
    const file = typeof IDLE_ZONE_CUSTOM_MAPS !== 'undefined' && Array.isArray(IDLE_ZONE_CUSTOM_MAPS)
      ? IDLE_ZONE_CUSTOM_MAPS
      : null;
    return runtime?.length ? runtime : (file || []);
  },

  setCustomMaps(list) {
    const next = Array.isArray(list) ? list.map((row) => ({ ...row, custom: true })) : [];
    if (typeof IdleZoneDropStore !== 'undefined') IdleZoneDropStore.setCustomMaps(next);
    if (typeof window !== 'undefined') window.IDLE_ZONE_CUSTOM_MAPS = next;
    return next;
  },

  /** 清掉 localStorage 裡「未分類自動範本」的覆寫（列表已自動隱藏它們） */
  purgeUnassignedGeneratedPatches() {
    if (typeof IdleHuntProgressMaps === 'undefined' || typeof IdleZoneDropStore === 'undefined') return 0;
    const patches = (typeof IDLE_ZONE_PATCHES !== 'undefined' && IDLE_ZONE_PATCHES) ? IDLE_ZONE_PATCHES : {};
    let removed = 0;
    IdleHuntProgressMaps.build().forEach((z) => {
      const id = `${z.regionId}-${z.mapId}`;
      const p = patches[id];
      const merged = p && typeof p === 'object' ? { ...z, ...p } : { ...z };
      if (!this.isGenerated(merged)) return;
      if (this.bandOf(merged).id !== 'unassigned') return;
      if (!IdleZoneDropStore.has(id)) return;
      IdleZoneDropStore.remove(id);
      removed += 1;
    });
    this.rebuildList();
    return removed;
  },

  addMapToBand(bandId) {
    const band = this.bandByKey(bandId) || this.bandDefList().find((d) => d.id === String(bandId));
    if (!band) return null;
    const seq = this.list.reduce((m, z) => Math.max(m, this.mapIndex(z)), 0) + 1;
    const regionId = /^[a-zA-Z][\w-]*$/.test(band.id) ? band.id : 'custom';
    const seed = typeof IdleHuntProgressMaps !== 'undefined'
      ? IdleHuntProgressMaps.makeMap({
        seq,
        slot: this.sortedMaps(band).length,
        min: band.min,
        max: band.max,
        regionId,
        regionName: band.name || '自訂',
        bandKey: band.id,
        name: `新狩獵場`,
      })
      : null;
    const z = {
      ...(seed || {}),
      regionId,
      regionName: band.name || '自訂',
      name: `新狩獵場`,
      mapId: `c${seq}`,
      mapIndex: seq,
      bandKey: band.id,
      custom: true,
    };
    const extras = [...this.customMapList(), z];
    this.setCustomMaps(extras);
    this.list.push(z);
    if (typeof IdleZoneDropStore !== 'undefined') {
      IdleZoneDropStore.patch(this.id(z), {
        bandKey: band.id,
        name: z.name,
        regionName: z.regionName,
        bandName: band.name,
      });
    }
    this.applyMergedList(this.mergedList());
    return z;
  },

  patchBand(bandKey, partial) {
    const key = String(bandKey || '');
    if (!key || key === 'unassigned') return null;
    if (typeof IdleZoneDropStore !== 'undefined' && typeof IdleZoneDropStore.patchBand === 'function') {
      return IdleZoneDropStore.patchBand(key, partial);
    }
    const patch = partial && typeof partial === 'object' ? partial : {};
    const next = this.bandDefList().map((d) => (
      d.id === key ? { ...d, ...patch } : d
    ));
    this.setBandDefs(next);
    return this.bandDefByKey(key);
  },

  bandHasDrops(bandKey) {
    const def = this.bandDefByKey(bandKey);
    if (!def) return false;
    return (Array.isArray(def.mobDrops) && def.mobDrops.length > 0)
      || (Array.isArray(def.bossDrops) && def.bossDrops.length > 0);
  },

  renameBand(bandId, name) {
    const label = String(name || '').trim();
    if (!label) return null;
    const id = String(bandId || '');
    this.setBandDefs(this.bandDefList().map((d) => (
      d.id === id ? { ...d, name: label } : d
    )));
    const band = this.bandByKey(id);
    (band?.maps || []).forEach((row) => {
      if (typeof IdleZoneDropStore !== 'undefined') {
        IdleZoneDropStore.patch(this.id(row), { bandName: label, regionName: label });
      }
    });
    this.applyMergedList(this.mergedList());
    return band;
  },

  artFile(artId) {
    const raw = String(artId || '').trim().replace(/\\/g, '/').split('/').pop() || '';
    if (!raw) return '';
    if (/\.(png|jpe?g|webp|gif)$/i.test(raw)) return raw;
    return `${raw}.png`;
  },

  artIdFromFile(filename) {
    const raw = String(filename || '').trim().replace(/\\/g, '/').split('/').pop() || '';
    return raw.replace(/\.(png|jpe?g|webp|gif)$/i, '');
  },

  folder(zone) {
    const z = zone?.mapId ? zone : this.get(zone);
    const art = String(this.configFor(z).artId || z.artId || '').trim();
    return `${this.ASSET_DIR}/${this.artFile(art || this.id(z))}`;
  },

  mapUrl(zone) {
    const z = zone?.mapId ? zone : this.get(zone);
    if (!z?.mapId) return '';
    return `${this.folder(z)}?v=${this.ASSET_VER}`;
  },

  artUrl(artId) {
    const file = this.artFile(artId);
    if (!file) return '';
    const dir = this.ASSET_DIR || this.ASSET_DIR || 'images/idle-zones';
    const ver = this.ASSET_VER || this.ASSET_VER || '5';
    return `${dir}/${file}?v=${ver}`;
  },

  mobIconUrl(iconId) {
    if (typeof IdleMobAnim !== 'undefined' && typeof IdleMobAnim.previewUrl === 'function') {
      return IdleMobAnim.previewUrl(iconId);
    }
    return '';
  },

  point(raw, fallback) {
    const x = Number(raw?.x);
    const y = Number(raw?.y);
    return {
      x: Number.isFinite(x) ? x : fallback.x,
      y: Number.isFinite(y) ? y : fallback.y,
    };
  },

  spawn(zone, mobCount) {
    const z = zone?.mapId ? zone : this.get(zone);
    const player = this.point(z?.player, this.DEFAULT_PLAYER);
    const n = Math.max(1, Math.floor(Number(mobCount) || this.MOB_QUEUE));
    const y = this.MOB_Y;
    const span = Number(this.MOB_LINE_SPAN) || ((5 - 1) * 110);
    const spacing = n <= 1 ? 0 : span / (n - 1);
    const mobs = [];
    for (let i = 0; i < n; i += 1) {
      const fallback = {
        x: this.MOB_FIRST_X + i * spacing,
        y,
      };
      mobs.push(this.point(z?.mobs?.[i], fallback));
    }
    return { player, mobs };
  },

  cloneDropRows(raw) {
    return Array.isArray(raw) ? raw.map((row) => ({ ...row })) : [];
  },

  bandDefByKey(bandKey) {
    const key = String(bandKey || '');
    return this.bandDefList().find((d) => d.id === key) || null;
  },

  bandDropsFor(bandKey, isBoss) {
    const def = this.bandDefByKey(bandKey);
    if (!def) return [];
    return this.cloneDropRows(isBoss ? def.bossDrops : def.mobDrops);
  },

  globalDropsCfg() {
    if (typeof IdleZoneDropStore !== 'undefined' && typeof IdleZoneDropStore.getGlobal === 'function') {
      return IdleZoneDropStore.getGlobal();
    }
    const runtime = typeof window !== 'undefined' ? window.IDLE_ZONE_GLOBAL_DROPS : null;
    const file = typeof IDLE_ZONE_GLOBAL_DROPS !== 'undefined' ? IDLE_ZONE_GLOBAL_DROPS : null;
    const src = runtime || file || {};
    return {
      mobDrops: Array.isArray(src.mobDrops) ? src.mobDrops.map((row) => ({ ...row })) : [],
      bossDrops: Array.isArray(src.bossDrops) ? src.bossDrops.map((row) => ({ ...row })) : [],
    };
  },

  globalDropsFor(isBoss) {
    const cfg = this.globalDropsCfg();
    return this.cloneDropRows(isBoss ? cfg.bossDrops : cfg.mobDrops);
  },

  patchGlobal(partial) {
    if (typeof IdleZoneDropStore === 'undefined') return null;
    return IdleZoneDropStore.patchGlobal(partial);
  },

  dropsFor(zone, isBoss) {
    const cfg = this.configFor(zone);
    const band = this.bandOf(zone);
    const globalRows = this.globalDropsFor(isBoss);
    const bandRows = this.bandDropsFor(band.key, isBoss);
    const mapRows = this.cloneDropRows(isBoss ? cfg.bossDrops : cfg.mobDrops);
    return [...globalRows, ...bandRows, ...mapRows];
  },

  /** 區域等級區間中位數＝怪物等級（例：1~5→3、6~10→8） */
  mobLevelFor(zone) {
    const z = zone?.mapId ? zone : this.get(zone);
    const cfg = this.configFor(z);
    const band = this.bandOf(z);
    const min = this.clampLevel(cfg.bandMin ?? band.min, 1);
    const max = this.clampLevel(cfg.bandMax ?? band.max, min);
    if (typeof MapleExpTable !== 'undefined' && typeof MapleExpTable.bandMedianLevel === 'function') {
      return MapleExpTable.bandMedianLevel(min, max);
    }
    return Math.floor((min + max) / 2);
  },

  rewardsFor(zone, isBoss) {
    const cfg = this.configFor(zone);
    const mobLevel = this.mobLevelFor(zone);
    if (isBoss) {
      return {
        killExp: cfg.bossKillExp,
        killGold: cfg.bossKillGold,
        monsterHp: cfg.bossHp,
        mobLevel,
      };
    }
    return {
      killExp: cfg.killExp,
      killGold: cfg.killGold,
      monsterHp: cfg.monsterHp,
      mobLevel,
    };
  },

  configFor(zone) {
    const z = zone?.mapId ? zone : this.get(zone);
    const id = this.id(z);
    const baseExp = Number(z.killExp);
    const baseGold = Number(z.killGold);
    const baseHp = Number(z.monsterHp);
    const baseBossHp = Number(z.bossHp);
    const fallback = {
      drops: Array.isArray(z.drops) ? z.drops.map((row) => ({ ...row })) : [],
      mobDrops: Array.isArray(z.mobDrops) && z.mobDrops.length
        ? z.mobDrops.map((row) => ({ ...row }))
        : (Array.isArray(z.drops) ? z.drops.map((row) => ({ ...row })) : []),
      bossDrops: Array.isArray(z.bossDrops) ? z.bossDrops.map((row) => ({ ...row })) : [],
      killExp: Number.isFinite(baseExp) ? baseExp : Math.max(1, this.mapIndex(z)),
      killGold: Number.isFinite(baseGold) ? baseGold : 1,
      monsterHp: Number.isFinite(baseHp) && baseHp > 0 ? baseHp : 12,
      bossHp: Number.isFinite(baseBossHp) && baseBossHp > 0
        ? baseBossHp
        : Math.max(12, (Number.isFinite(baseHp) && baseHp > 0 ? baseHp : 12) * 18),
      bossKillExp: Number.isFinite(Number(z.bossKillExp)) ? Number(z.bossKillExp) : this.mapIndex(z) * 20,
      bossKillGold: Number.isFinite(Number(z.bossKillGold)) ? Number(z.bossKillGold) : this.mapIndex(z) * 4,
      mobName: z.mobName || '怪物',
      mobIcon: z.mobIcon || '',
      bossName: z.bossName || 'BOSS',
      bossIcon: z.bossIcon || '',
      bossScaleSprite: !!z.bossScaleSprite,
      bossScaleHud: !!z.bossScaleHud,
      artId: z.artId || '',
      name: z.name || '',
      regionName: z.regionName || '',
      bandName: z.bandName || '',
      bandKey: z.bandKey || '',
      bandMin: z.bandMin,
      bandMax: z.bandMax,
      replayBossKills: Number.isFinite(Number(z.replayBossKills)) && Number(z.replayBossKills) >= 0
        ? Math.floor(Number(z.replayBossKills))
        : this.REPLAY_BOSS_KILLS,
      smallKills: Number.isFinite(Number(z.smallKills)) && Number(z.smallKills) >= 0
        ? Math.floor(Number(z.smallKills))
        : this.SMALL_KILLS,
      mobAtk1Dmg: this.atkNum(z.mobAtk1Dmg != null ? z.mobAtk1Dmg : z.mobHitDmg, 5),
      mobAtk1Cd: this.atkNum(z.mobAtk1Cd != null ? z.mobAtk1Cd : z.mobHitCd, 0.6),
      mobAtk2Dmg: this.atkNum(z.mobAtk2Dmg, 0),
      mobAtk2Cd: this.atkNum(z.mobAtk2Cd, 0),
      mobAtk3Dmg: this.atkNum(z.mobAtk3Dmg, 0),
      mobAtk3Cd: this.atkNum(z.mobAtk3Cd, 0),
      mobSkill1Dmg: this.atkNum(z.mobSkill1Dmg != null ? z.mobSkill1Dmg : z.mobSkillDmg, 0),
      mobSkill1Cd: this.atkNum(z.mobSkill1Cd != null ? z.mobSkill1Cd : z.mobSkillCd, 8),
      mobSkill2Dmg: this.atkNum(z.mobSkill2Dmg, 0),
      mobSkill2Cd: this.atkNum(z.mobSkill2Cd, 0),
      mobSkill3Dmg: this.atkNum(z.mobSkill3Dmg, 0),
      mobSkill3Cd: this.atkNum(z.mobSkill3Cd, 0),
      // 舊欄位別名（= skill1）
      mobSkillDmg: this.atkNum(z.mobSkill1Dmg != null ? z.mobSkill1Dmg : z.mobSkillDmg, 0),
      mobSkillCd: this.atkNum(z.mobSkill1Cd != null ? z.mobSkill1Cd : z.mobSkillCd, 8),
      bossAtk1Dmg: this.atkNum(z.bossAtk1Dmg != null ? z.bossAtk1Dmg : z.bossHitDmg, 15),
      bossAtk1Cd: this.atkNum(z.bossAtk1Cd != null ? z.bossAtk1Cd : z.bossHitCd, 2),
      bossAtk2Dmg: this.atkNum(z.bossAtk2Dmg, 0),
      bossAtk2Cd: this.atkNum(z.bossAtk2Cd, 0),
      bossAtk3Dmg: this.atkNum(z.bossAtk3Dmg, 0),
      bossAtk3Cd: this.atkNum(z.bossAtk3Cd, 0),
      bossSkill1Dmg: this.atkNum(z.bossSkill1Dmg != null ? z.bossSkill1Dmg : z.bossSkillDmg, 0),
      bossSkill1Cd: this.atkNum(z.bossSkill1Cd != null ? z.bossSkill1Cd : z.bossSkillCd, 10),
      bossSkill2Dmg: this.atkNum(z.bossSkill2Dmg, 0),
      bossSkill2Cd: this.atkNum(z.bossSkill2Cd, 0),
      bossSkill3Dmg: this.atkNum(z.bossSkill3Dmg, 0),
      bossSkill3Cd: this.atkNum(z.bossSkill3Cd, 0),
      bossSkillDmg: this.atkNum(z.bossSkill1Dmg != null ? z.bossSkill1Dmg : z.bossSkillDmg, 0),
      bossSkillCd: this.atkNum(z.bossSkill1Cd != null ? z.bossSkill1Cd : z.bossSkillCd, 10),
    };
    if (typeof IdleZoneDropStore === 'undefined' || !IdleZoneDropStore.has(id)) return fallback;
    const over = IdleZoneDropStore.config(id);
    const overHp = Number(over.monsterHp);
    const overBossHp = Number(over.bossHp);
    return {
      drops: Array.isArray(over.drops) ? over.drops.map((row) => ({ ...row })) : fallback.drops,
      mobDrops: Array.isArray(over.mobDrops)
        ? over.mobDrops.map((row) => ({ ...row }))
        : fallback.mobDrops,
      bossDrops: Array.isArray(over.bossDrops)
        ? over.bossDrops.map((row) => ({ ...row }))
        : fallback.bossDrops,
      killExp: Number.isFinite(Number(over.killExp)) ? Number(over.killExp) : fallback.killExp,
      killGold: Number.isFinite(Number(over.killGold)) ? Number(over.killGold) : fallback.killGold,
      monsterHp: Number.isFinite(overHp) && overHp > 0 ? overHp : fallback.monsterHp,
      bossHp: Number.isFinite(overBossHp) && overBossHp > 0 ? overBossHp : fallback.bossHp,
      bossKillExp: Number.isFinite(Number(over.bossKillExp)) ? Number(over.bossKillExp) : fallback.bossKillExp,
      bossKillGold: Number.isFinite(Number(over.bossKillGold)) ? Number(over.bossKillGold) : fallback.bossKillGold,
      mobName: over.mobName != null && String(over.mobName) !== '' ? String(over.mobName) : fallback.mobName,
      mobIcon: over.mobIcon != null && String(over.mobIcon) !== '' ? String(over.mobIcon) : fallback.mobIcon,
      bossName: over.bossName != null && String(over.bossName) !== '' ? String(over.bossName) : fallback.bossName,
      bossIcon: over.bossIcon != null && String(over.bossIcon) !== '' ? String(over.bossIcon) : fallback.bossIcon,
      bossScaleSprite: over.bossScaleSprite != null ? !!over.bossScaleSprite : fallback.bossScaleSprite,
      bossScaleHud: over.bossScaleHud != null ? !!over.bossScaleHud : fallback.bossScaleHud,
      artId: over.artId != null && String(over.artId) !== '' ? String(over.artId).trim() : fallback.artId,
      name: over.name != null && String(over.name).trim() !== '' ? String(over.name).trim() : fallback.name,
      regionName: over.regionName != null && String(over.regionName).trim() !== ''
        ? String(over.regionName).trim()
        : fallback.regionName,
      bandName: over.bandName != null && String(over.bandName).trim() !== ''
        ? String(over.bandName).trim()
        : fallback.bandName,
      bandKey: over.bandKey != null && String(over.bandKey).trim() !== ''
        ? String(over.bandKey).trim()
        : fallback.bandKey,
      bandMin: Number.isFinite(Number(over.bandMin)) ? Number(over.bandMin) : fallback.bandMin,
      bandMax: Number.isFinite(Number(over.bandMax)) ? Number(over.bandMax) : fallback.bandMax,
      replayBossKills: Number.isFinite(Number(over.replayBossKills)) && Number(over.replayBossKills) >= 0
        ? Math.floor(Number(over.replayBossKills))
        : fallback.replayBossKills,
      smallKills: Number.isFinite(Number(over.smallKills)) && Number(over.smallKills) >= 0
        ? Math.floor(Number(over.smallKills))
        : fallback.smallKills,
      mobAtk1Dmg: this.atkOver(
        over.mobAtk1Dmg != null ? over.mobAtk1Dmg : over.mobHitDmg,
        fallback.mobAtk1Dmg,
      ),
      mobAtk1Cd: this.atkOver(
        over.mobAtk1Cd != null ? over.mobAtk1Cd : over.mobHitCd,
        fallback.mobAtk1Cd,
      ),
      mobAtk2Dmg: this.atkOver(over.mobAtk2Dmg, fallback.mobAtk2Dmg),
      mobAtk2Cd: this.atkOver(over.mobAtk2Cd, fallback.mobAtk2Cd),
      mobAtk3Dmg: this.atkOver(over.mobAtk3Dmg, fallback.mobAtk3Dmg),
      mobAtk3Cd: this.atkOver(over.mobAtk3Cd, fallback.mobAtk3Cd),
      mobSkill1Dmg: this.atkOver(
        over.mobSkill1Dmg != null ? over.mobSkill1Dmg : over.mobSkillDmg,
        fallback.mobSkill1Dmg,
      ),
      mobSkill1Cd: this.atkOver(
        over.mobSkill1Cd != null ? over.mobSkill1Cd : over.mobSkillCd,
        fallback.mobSkill1Cd,
      ),
      mobSkill2Dmg: this.atkOver(over.mobSkill2Dmg, fallback.mobSkill2Dmg),
      mobSkill2Cd: this.atkOver(over.mobSkill2Cd, fallback.mobSkill2Cd),
      mobSkill3Dmg: this.atkOver(over.mobSkill3Dmg, fallback.mobSkill3Dmg),
      mobSkill3Cd: this.atkOver(over.mobSkill3Cd, fallback.mobSkill3Cd),
      mobSkillDmg: this.atkOver(
        over.mobSkill1Dmg != null ? over.mobSkill1Dmg : over.mobSkillDmg,
        fallback.mobSkillDmg,
      ),
      mobSkillCd: this.atkOver(
        over.mobSkill1Cd != null ? over.mobSkill1Cd : over.mobSkillCd,
        fallback.mobSkillCd,
      ),
      bossAtk1Dmg: this.atkOver(
        over.bossAtk1Dmg != null ? over.bossAtk1Dmg : over.bossHitDmg,
        fallback.bossAtk1Dmg,
      ),
      bossAtk1Cd: this.atkOver(
        over.bossAtk1Cd != null ? over.bossAtk1Cd : over.bossHitCd,
        fallback.bossAtk1Cd,
      ),
      bossAtk2Dmg: this.atkOver(over.bossAtk2Dmg, fallback.bossAtk2Dmg),
      bossAtk2Cd: this.atkOver(over.bossAtk2Cd, fallback.bossAtk2Cd),
      bossAtk3Dmg: this.atkOver(over.bossAtk3Dmg, fallback.bossAtk3Dmg),
      bossAtk3Cd: this.atkOver(over.bossAtk3Cd, fallback.bossAtk3Cd),
      bossSkill1Dmg: this.atkOver(
        over.bossSkill1Dmg != null ? over.bossSkill1Dmg : over.bossSkillDmg,
        fallback.bossSkill1Dmg,
      ),
      bossSkill1Cd: this.atkOver(
        over.bossSkill1Cd != null ? over.bossSkill1Cd : over.bossSkillCd,
        fallback.bossSkill1Cd,
      ),
      bossSkill2Dmg: this.atkOver(over.bossSkill2Dmg, fallback.bossSkill2Dmg),
      bossSkill2Cd: this.atkOver(over.bossSkill2Cd, fallback.bossSkill2Cd),
      bossSkill3Dmg: this.atkOver(over.bossSkill3Dmg, fallback.bossSkill3Dmg),
      bossSkill3Cd: this.atkOver(over.bossSkill3Cd, fallback.bossSkill3Cd),
      bossSkillDmg: this.atkOver(
        over.bossSkill1Dmg != null ? over.bossSkill1Dmg : over.bossSkillDmg,
        fallback.bossSkillDmg,
      ),
      bossSkillCd: this.atkOver(
        over.bossSkill1Cd != null ? over.bossSkill1Cd : over.bossSkillCd,
        fallback.bossSkillCd,
      ),
    };
  },

  atkNum(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  },

  atkOver(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  },

  mergedList() {
    return this.list.map((z) => {
      const cfg = this.configFor(z);
      return { ...z, ...cfg };
    });
  },

  collectDataOverrides() {
    const patches = {};
    const custom = [];
    this.mergedList().forEach((z) => {
      const id = this.id(z);
      const generated = typeof IdleHuntProgressMaps !== 'undefined'
        ? IdleHuntProgressMaps.makeMap(this.mapIndex(z))
        : null;
      const genOk = generated && `${generated.regionId}-${generated.mapId}` === id && !z.custom;
      if (!genOk) {
        custom.push({ ...z, custom: true });
        return;
      }
      const keep = {};
      const keys = [
        'drops', 'mobDrops', 'bossDrops', 'killExp', 'killGold', 'monsterHp', 'bossHp',
        'bossKillExp', 'bossKillGold', 'mobName', 'mobIcon', 'bossName', 'bossIcon',
        'bossScaleSprite', 'bossScaleHud', 'artId',
        'name', 'regionName', 'bandName', 'bandKey', 'bandMin', 'bandMax', 'replayBossKills', 'smallKills',
        'mobAtk1Dmg', 'mobAtk1Cd', 'mobAtk2Dmg', 'mobAtk2Cd', 'mobAtk3Dmg', 'mobAtk3Cd',
        'mobSkill1Dmg', 'mobSkill1Cd', 'mobSkill2Dmg', 'mobSkill2Cd', 'mobSkill3Dmg', 'mobSkill3Cd',
        'mobSkillDmg', 'mobSkillCd',
        'bossAtk1Dmg', 'bossAtk1Cd', 'bossAtk2Dmg', 'bossAtk2Cd', 'bossAtk3Dmg', 'bossAtk3Cd',
        'bossSkill1Dmg', 'bossSkill1Cd', 'bossSkill2Dmg', 'bossSkill2Cd', 'bossSkill3Dmg', 'bossSkill3Cd',
        'bossSkillDmg', 'bossSkillCd',
      ];
      const atkDefaults = {
        mobAtk1Dmg: 5, mobAtk1Cd: 0.6, mobAtk2Dmg: 0, mobAtk2Cd: 0, mobAtk3Dmg: 0, mobAtk3Cd: 0,
        mobSkill1Dmg: 0, mobSkill1Cd: 8, mobSkill2Dmg: 0, mobSkill2Cd: 0, mobSkill3Dmg: 0, mobSkill3Cd: 0,
        mobSkillDmg: 0, mobSkillCd: 8,
        bossAtk1Dmg: 15, bossAtk1Cd: 2, bossAtk2Dmg: 0, bossAtk2Cd: 0, bossAtk3Dmg: 0, bossAtk3Cd: 0,
        bossSkill1Dmg: 0, bossSkill1Cd: 10, bossSkill2Dmg: 0, bossSkill2Cd: 0, bossSkill3Dmg: 0, bossSkill3Cd: 0,
        bossSkillDmg: 0, bossSkillCd: 10,
      };
      keys.forEach((key) => {
        const cur = z[key];
        const base = genOk ? generated[key] : undefined;
        if (key === 'drops') return;
        if (key === 'mobDrops' || key === 'bossDrops') {
          if (Array.isArray(cur) && cur.length) keep[key] = cur;
          return;
        }
        if (key === 'bossScaleSprite' || key === 'bossScaleHud') {
          if (!!cur) keep[key] = true;
          return;
        }
        if (key === 'replayBossKills') {
          const def = this.REPLAY_BOSS_KILLS;
          if (Number(cur) !== Number(base ?? def)) keep[key] = Number(cur);
          return;
        }
        if (key === 'smallKills') {
          const def = this.SMALL_KILLS;
          if (Number(cur) !== Number(base ?? def)) keep[key] = Number(cur);
          return;
        }
        if (Object.prototype.hasOwnProperty.call(atkDefaults, key)) {
          if (Number(cur) !== Number(base ?? atkDefaults[key])) keep[key] = Number(cur);
          return;
        }
        if (cur != null && String(cur) !== String(base ?? '')) keep[key] = cur;
      });
      if (Object.keys(keep).length) patches[id] = keep;
    });
    return {
      patches,
      custom,
      bands: this.bandDefList(),
      globalDrops: this.globalDropsCfg(),
    };
  },

  syncRuntimeData() {
    if (typeof window === 'undefined') return;
    const data = this.collectDataOverrides();
    window.IDLE_ZONE_GLOBAL_DROPS = data.globalDrops;
    window.IDLE_ZONE_BAND_DEFS = data.bands;
    window.IDLE_ZONE_CUSTOM_MAPS = data.custom;
    window.IDLE_ZONE_PATCHES = data.patches;
  },

  serializeDataFile() {
    const { patches, custom, bands, globalDrops } = this.collectDataOverrides();
    const body = JSON.stringify(patches, null, 2);
    const bandsJson = JSON.stringify(bands, null, 2);
    const extra = JSON.stringify(custom, null, 2);
    const globalJson = JSON.stringify(globalDrops || { mobDrops: [], bossDrops: [] }, null, 2);
    return `/**
 * 放置地圖 GM 覆寫。區塊＝角色等級區間，區塊內地圖張數可自由增減。
 * 寫入此檔請先執行 npm run gm-writer。
 */
const IDLE_ZONE_GLOBAL_DROPS = ${globalJson};

const IDLE_ZONE_BAND_DEFS = ${bandsJson};

const IDLE_ZONE_CUSTOM_MAPS = ${extra};

const IDLE_ZONE_PATCHES = ${body};

if (typeof window !== 'undefined') {
  window.IDLE_ZONE_GLOBAL_DROPS = IDLE_ZONE_GLOBAL_DROPS;
  window.IDLE_ZONE_BAND_DEFS = IDLE_ZONE_BAND_DEFS;
  window.IDLE_ZONE_CUSTOM_MAPS = IDLE_ZONE_CUSTOM_MAPS;
  window.IDLE_ZONE_PATCHES = IDLE_ZONE_PATCHES;
}
`;
  },

  applyMergedList(list) {
    if (!Array.isArray(list) || !list.length) return;
    this.list.splice(0, this.list.length, ...list);
    if (typeof window !== 'undefined') window.IDLE_ZONE_LIST = this.list;
  },

  parseDirImages(html) {
    const files = [];
    const re = /href\s*=\s*["']([^"']+)["']/gi;
    let match;
    while ((match = re.exec(String(html || '')))) {
      let href = match[1].split('?')[0].split('#')[0];
      try { href = decodeURIComponent(href); } catch (_) { /* keep */ }
      href = href.replace(/\\/g, '/');
      if (!href || href.endsWith('..')) continue;
      const last = href.split('/').filter(Boolean).pop() || '';
      if (!last || last.startsWith('.')) continue;
      if (!/\.(png|jpe?g|webp|gif)$/i.test(last)) continue;
      files.push(last);
    }
    return [...new Set(files)];
  },

  artItem(artId) {
    const id = this.artIdFromFile(artId);
    if (!id) return null;
    return { artId: id, url: `${this.ASSET_DIR}/${this.artFile(artId)}` };
  },

  probeArtUrl(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = `${url}${url.includes('?') ? '&' : '?'}v=${this.ASSET_VER}`;
    });
  },

  async scanArtCatalog() {
    const found = new Map();
    const add = (artId, url) => {
      const item = url ? { artId: String(artId || '').trim(), url } : this.artItem(artId);
      if (!item?.artId) return;
      found.set(item.artId, item);
    };
    if (typeof IDLE_ZONE_ART_CATALOG !== 'undefined') {
      IDLE_ZONE_ART_CATALOG.forEach((row) => add(row.artId, row.url));
    }
    try {
      const res = await fetch(`${this.ASSET_DIR}/?t=${Date.now()}`);
      if (res.ok) {
        const text = await res.text();
        this.parseDirImages(text).forEach((file) => add(this.artIdFromFile(file), `${this.ASSET_DIR}/${file}`));
      }
    } catch (_) { /* 靜態伺服器可能不列目錄 */ }
    const checked = await Promise.all([...found.values()].map(async (item) => (
      (await this.probeArtUrl(item.url)) ? item : null
    )));
    return checked.filter(Boolean).sort((a, b) => a.artId.localeCompare(b.artId, 'en'));
  },
};

IdleZones.rebuildList();

if (typeof window !== 'undefined') window.IdleZones = IdleZones;
