/**
 * GM：從裝備清單為每張地圖設定掉落與機率（存 localStorage，可複製 JSON）。
 */
const UiIdleGmDrops = (() => {
  const CATALOG_LIMIT = 80;
  const DEFAULT_CHANCE = 5;
  const WRITER_URL = 'http://127.0.0.1:3847';

  let inited = false;
  let open = false;
  let zoneId = '';
  let query = '';
  let lvMin = '';
  let lvMax = '';
  let filterId = 'all';
  let catalogKind = 'equip';
  let dropScope = 'global-mob';
  const DROP_SCOPES = [
    { id: 'global-mob', label: '全域 · 小怪' },
    { id: 'global-boss', label: '全域 · BOSS' },
    { id: 'map-mob', label: '此地圖 · 小怪' },
    { id: 'map-boss', label: '此地圖 · BOSS' },
    { id: 'band-mob', label: '此區塊 · 小怪' },
    { id: 'band-boss', label: '此區塊 · BOSS' },
  ];
  let writerOk = false;
  let writeTimer = null;
  let gmPage = 'chapter';

  function $(id) {
    return document.getElementById(id);
  }

  function currentZone() {
    if (typeof IdleZones === 'undefined') return null;
    if (!zoneId) zoneId = IdleZones.id(IdleZones.list[0]);
    return IdleZones.get(zoneId);
  }

  function itemName(itemId) {
    const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[itemId] : null;
    return item?.name || itemId;
  }

  function consumeName(row) {
    if (row.consumeType === 'cube' && typeof getPotentialCubeById === 'function') {
      return getPotentialCubeById(row.cubeId)?.name || row.cubeId;
    }
    if (row.consumeType === 'starforce_scroll' && typeof getStarForceScrollById === 'function') {
      return getStarForceScrollById(row.scrollId)?.name || row.scrollId;
    }
    if (row.consumeType === 'potential_scroll' && typeof getPotentialScrollById === 'function') {
      return getPotentialScrollById(row.scrollId)?.name || row.scrollId;
    }
    if (row.consumeType === 'bonus_stat' && typeof getBonusStatItemById === 'function') {
      return getBonusStatItemById(row.itemId)?.name || row.itemId;
    }
    if (row.consumeType === 'exceptional_hammer' && typeof getExceptionalHammerById === 'function') {
      return getExceptionalHammerById(row.hammerId)?.name || row.hammerId;
    }
    if (row.consumeType === 'soul' && typeof getSoulMaterialById === 'function') {
      return getSoulMaterialById(row.soulId)?.name || row.soulId;
    }
    if (row.consumeType === 'potion' && typeof IdlePotionStore !== 'undefined') {
      return IdlePotionStore.get(row.itemId)?.name || row.itemId;
    }
    if (typeof IdleConsumeStore !== 'undefined') {
      const hit = IdleConsumeStore.list().find((item) => (
        (row.consumeType === 'cube' && item.cubeId === row.cubeId)
        || (row.scrollId && item.scrollId === row.scrollId)
      ));
      if (hit) return hit.name;
    }
    return row.scrollId || row.cubeId || '消耗品';
  }

  function etcMeta(itemId) {
    return typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(itemId) : null;
  }

  function consumeMeta(row) {
    if (typeof IdleConsumeStore === 'undefined') return null;
    if (row.catalogId) return IdleConsumeStore.get(row.catalogId);
    return IdleConsumeStore.list().find((item) => (
      (row.consumeType === 'cube' && item.cubeId === row.cubeId)
      || (row.consumeType === 'potion' && item.itemId === row.itemId)
      || (row.scrollId && item.scrollId === row.scrollId)
    )) || null;
  }

  function dropKey(kind) {
    return kind === 'boss' ? 'bossDrops' : 'mobDrops';
  }

  function dropQty(row) {
    const n = Math.floor(Number(row?.amount));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  function parseScope(scope) {
    const id = String(scope || dropScope);
    const kind = id.endsWith('boss') ? 'boss' : 'mob';
    let layer = 'map';
    if (id.startsWith('global-')) layer = 'global';
    else if (id.startsWith('band-')) layer = 'band';
    return { layer, kind, isBoss: kind === 'boss' };
  }

  function scopeLabel(scope) {
    return DROP_SCOPES.find((s) => s.id === scope)?.label || scope;
  }

  function currentBandKey() {
    if (typeof IdleZones === 'undefined') return '';
    return IdleZones.bandOf(currentZone()).key || '';
  }

  function bandDef() {
    if (typeof IdleZones === 'undefined') return null;
    return IdleZones.bandDefByKey(currentBandKey());
  }

  function rows(scope) {
    const { layer, kind } = parseScope(scope);
    const key = dropKey(kind);
    if (layer === 'global') {
      const cfg = typeof IdleZones !== 'undefined' && IdleZones.globalDropsCfg
        ? IdleZones.globalDropsCfg()
        : (typeof IdleZoneDropStore !== 'undefined' ? IdleZoneDropStore.getGlobal() : null);
      const list = cfg?.[key];
      return Array.isArray(list) ? list.map((row) => ({ ...row })) : [];
    }
    if (layer === 'band') {
      const def = bandDef();
      if (!def) return [];
      const list = def[key];
      return Array.isArray(list) ? list.map((row) => ({ ...row })) : [];
    }
    if (typeof IdleZones === 'undefined') return [];
    const cfg = IdleZones.configFor(currentZone());
    const list = cfg[key];
    return Array.isArray(list) ? list.map((row) => ({ ...row })) : [];
  }

  function writeRows(next, scope) {
    const { layer, kind } = parseScope(scope);
    const key = dropKey(kind);
    const list = Array.isArray(next) ? next.map((row) => ({ ...row })) : [];
    if (typeof IdleZoneDropStore === 'undefined') return;
    if (layer === 'global') {
      IdleZoneDropStore.patchGlobal({ [key]: list });
    } else if (layer === 'band') {
      const bandKey = currentBandKey();
      if (!bandKey || bandKey === 'unassigned') {
        setStatus('此地圖尚未歸屬等級區間，無法設定區塊掉落');
        return;
      }
      IdleZoneDropStore.patchBand(bandKey, { [key]: list });
    } else {
      IdleZoneDropStore.patch(zoneId, { [key]: list });
    }
    scheduleWriteJs();
  }

  async function pingWriter() {
    try {
      const res = await fetch(`${WRITER_URL}/health`);
      writerOk = res.ok;
    } catch (_) {
      writerOk = false;
    }
    const hint = $('idleGmWriterHint');
    if (hint) {
      hint.textContent = writerOk
        ? '寫入服務已連線，修改會存進 js/idleZonesData.js（覆寫）'
        : '寫入檔案請先在專案目錄執行 npm run gm-writer';
    }
    return writerOk;
  }

  function scheduleWriteJs() {
    if (writeTimer) window.clearTimeout(writeTimer);
    writeTimer = window.setTimeout(() => {
      writeJsFile();
    }, 400);
  }

  async function writeJsFile() {
    if (typeof IdleZones === 'undefined') return false;
    const source = IdleZones.serializeDataFile();
    try {
      const res = await fetch(`${WRITER_URL}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      IdleZones.syncRuntimeData?.();
      IdleZones.applyMergedList(IdleZones.mergedList());
      if (typeof IdleZoneDropStore !== 'undefined') IdleZoneDropStore.clearAll();
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      writerOk = true;
      setStatus('已寫入 js/idleZonesData.js');
      const hint = $('idleGmWriterHint');
      if (hint) hint.textContent = '寫入服務已連線，修改會存進 js/idleZonesData.js';
      renderMaps();
      renderDrops();
      return true;
    } catch (err) {
      writerOk = false;
      setStatus(`無法寫入 JS（${err.message}）。請先執行 npm run gm-writer`);
      const hint = $('idleGmWriterHint');
      if (hint) hint.textContent = '寫入檔案請先在專案目錄執行 npm run gm-writer';
      return false;
    }
  }

  function renderRewards() {
    const expEl = $('idleGmKillExp');
    const goldEl = $('idleGmKillGold');
    const hpEl = $('idleGmMonsterHp');
    const bossExpEl = $('idleGmBossKillExp');
    const bossGoldEl = $('idleGmBossKillGold');
    const bossHpEl = $('idleGmBossHp');
    const mobNameEl = $('idleGmMobName');
    const mobIconEl = $('idleGmMobIcon');
    const bossNameEl = $('idleGmBossName');
    const bossIconEl = $('idleGmBossIcon');
    if (!expEl || !goldEl || !hpEl || typeof IdleZones === 'undefined') return;
    const z = currentZone();
    const r = IdleZones.configFor(z);
    expEl.value = String(r.killExp);
    goldEl.value = String(r.killGold);
    hpEl.value = String(r.monsterHp);
    if (bossExpEl) bossExpEl.value = String(r.bossKillExp);
    if (bossGoldEl) bossGoldEl.value = String(r.bossKillGold);
    if (bossHpEl) bossHpEl.value = String(r.bossHp);
    const replayEl = $('idleGmReplayBossKills');
    if (replayEl) replayEl.value = String(r.replayBossKills);
    const smallKillsEl = $('idleGmSmallKills');
    if (smallKillsEl) smallKillsEl.value = String(r.smallKills);
    const setNum = (id, v) => {
      const el = $(id);
      if (el) el.value = String(v);
    };
    setNum('idleGmMobAtk1Dmg', r.mobAtk1Dmg);
    setNum('idleGmMobAtk1Cd', r.mobAtk1Cd);
    setNum('idleGmMobAtk2Dmg', r.mobAtk2Dmg);
    setNum('idleGmMobAtk2Cd', r.mobAtk2Cd);
    setNum('idleGmMobAtk3Dmg', r.mobAtk3Dmg);
    setNum('idleGmMobAtk3Cd', r.mobAtk3Cd);
    setNum('idleGmMobSkill1Dmg', r.mobSkill1Dmg != null ? r.mobSkill1Dmg : r.mobSkillDmg);
    setNum('idleGmMobSkill1Cd', r.mobSkill1Cd != null ? r.mobSkill1Cd : r.mobSkillCd);
    setNum('idleGmMobSkill2Dmg', r.mobSkill2Dmg);
    setNum('idleGmMobSkill2Cd', r.mobSkill2Cd);
    setNum('idleGmMobSkill3Dmg', r.mobSkill3Dmg);
    setNum('idleGmMobSkill3Cd', r.mobSkill3Cd);
    setNum('idleGmBossAtk1Dmg', r.bossAtk1Dmg);
    setNum('idleGmBossAtk1Cd', r.bossAtk1Cd);
    setNum('idleGmBossAtk2Dmg', r.bossAtk2Dmg);
    setNum('idleGmBossAtk2Cd', r.bossAtk2Cd);
    setNum('idleGmBossAtk3Dmg', r.bossAtk3Dmg);
    setNum('idleGmBossAtk3Cd', r.bossAtk3Cd);
    setNum('idleGmBossSkill1Dmg', r.bossSkill1Dmg != null ? r.bossSkill1Dmg : r.bossSkillDmg);
    setNum('idleGmBossSkill1Cd', r.bossSkill1Cd != null ? r.bossSkill1Cd : r.bossSkillCd);
    setNum('idleGmBossSkill2Dmg', r.bossSkill2Dmg);
    setNum('idleGmBossSkill2Cd', r.bossSkill2Cd);
    setNum('idleGmBossSkill3Dmg', r.bossSkill3Dmg);
    setNum('idleGmBossSkill3Cd', r.bossSkill3Cd);
    if (mobNameEl) mobNameEl.value = r.mobName || '';
    if (mobIconEl) mobIconEl.value = r.mobIcon || '';
    if (bossNameEl) bossNameEl.value = r.bossName || '';
    if (bossIconEl) bossIconEl.value = r.bossIcon || '';
    const bossScaleSpriteEl = $('idleGmBossScaleSprite');
    const bossScaleHudEl = $('idleGmBossScaleHud');
    if (bossScaleSpriteEl) bossScaleSpriteEl.checked = !!r.bossScaleSprite;
    if (bossScaleHudEl) bossScaleHudEl.checked = !!r.bossScaleHud;
    const mapNameEl = $('idleGmMapName');
    if (mapNameEl) mapNameEl.value = r.name || z.name || '';
    const bandNameEl = $('idleGmBandName');
    if (bandNameEl) {
      const band = IdleZones.bandOf(z);
      bandNameEl.value = band.name || r.bandName || r.regionName || z.regionName || '';
    }
    const bandMinEl = $('idleGmBandMin');
    const bandMaxEl = $('idleGmBandMax');
    if (bandMinEl || bandMaxEl) {
      const band = IdleZones.bandOf(z);
      if (bandMinEl) bandMinEl.value = String(band.min);
      if (bandMaxEl) bandMaxEl.value = String(band.max);
    }
    const bandSel = $('idleGmMapBand');
    if (bandSel) {
      const cur = IdleZones.bandOf(z);
      bandSel.innerHTML = IdleZones.bandDefList().map((d) => {
        const on = d.id === cur.id ? ' selected' : '';
        return `<option value="${d.id}"${on}>${d.name || d.id}（Lv.${d.min}～${d.max}）</option>`;
      }).join('');
    }
    const countEl = $('idleGmBandMapCount');
    if (countEl) {
      const band = IdleZones.bandByKey(IdleZones.bandOf(z).id);
      countEl.textContent = `此區塊目前 ${band?.maps?.length || 0} 張地圖`;
    }
    syncMapBgArtId();
  }

  function syncMapBgArtId() {
    const artEl = $('idleGmArtId');
    if (!artEl || typeof IdleZones === 'undefined') return;
    const r = IdleZones.configFor(currentZone());
    artEl.value = String(r.artId || '').trim();
  }

  function setMapBg(artId) {
    const id = String(artId || '').trim();
    if (typeof IdleZoneDropStore === 'undefined') return;
    IdleZoneDropStore.patch(zoneId, { artId: id });
    setStatus(id ? `已設定地圖背景：${id}` : '已清地圖背景（用預設資料夾）');
    if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
    scheduleWriteJs();
    syncMapBgArtId();
  }

  function isOriginalEquip(item) {
    if (typeof GeneratedEquipLoader !== 'undefined' && typeof GeneratedEquipLoader.isCatalogEquip === 'function') {
      return GeneratedEquipLoader.isCatalogEquip(item);
    }
    const id = item?.itemId || item?.id;
    if (!id) return false;
    if (typeof ORIGINAL_EQUIP_IDS !== 'undefined' && Array.isArray(ORIGINAL_EQUIP_IDS)) {
      return ORIGINAL_EQUIP_IDS.includes(id);
    }
    return !item.fromGenerated;
  }

  function matchFilter(item) {
    if (!item || item.wz?.cash) return false;
    if (!isOriginalEquip(item)) return false;
    if (typeof EQUIP_TYPE === 'undefined') return true;
    if (filterId === 'weapon') return item.mainType === EQUIP_TYPE.WEAPON;
    if (filterId === 'offHand') return item.mainType === EQUIP_TYPE.offHandWeapon;
    if (filterId === 'armor') return item.mainType === EQUIP_TYPE.ARMOR;
    if (filterId === 'accessory') {
      return item.mainType === EQUIP_TYPE.ACCESSORY || item.mainType === EQUIP_TYPE.Emblem;
    }
    return true;
  }

  function catalog() {
    const q = query.trim().toLowerCase();
    if (catalogKind === 'etc') {
      const rows = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.search(query) : [];
      return rows.slice(0, CATALOG_LIMIT);
    }
    if (catalogKind === 'consume') {
      if (typeof IdleConsumeStore !== 'undefined') IdleConsumeStore.refresh();
      const rows = typeof IdleConsumeStore !== 'undefined' ? IdleConsumeStore.search(query) : [];
      return rows.slice(0, CATALOG_LIMIT);
    }
    if (typeof ITEM_DATABASE === 'undefined') return [];
    const min = lvMin === '' ? null : Number(lvMin);
    const max = lvMax === '' ? null : Number(lvMax);
    return Object.keys(ITEM_DATABASE)
      .map((id) => ITEM_DATABASE[id])
      .filter((item) => {
        if (!matchFilter(item)) return false;
        const req = Number(item.reqLevel) || 0;
        if (min != null && Number.isFinite(min) && req < min) return false;
        if (max != null && Number.isFinite(max) && req > max) return false;
        if (!q) return true;
        const id = String(item.itemId || item.id || '').toLowerCase();
        const name = String(item.name || '').toLowerCase();
        return name.includes(q) || id.includes(q);
      })
      .sort((a, b) => (Number(a.reqLevel) || 0) - (Number(b.reqLevel) || 0)
        || String(a.name || '').localeCompare(String(b.name || ''), 'zh-TW'))
      .slice(0, CATALOG_LIMIT);
  }

  function gmToolsMarkup() {
    return `
        <div id="idleGmToolsSection">
          <div class="idle-gm-section-title">GM 功能</div>
          <p class="idle-gm-hint">測試用；設定存本機，不寫入資料檔。</p>
          <div class="idle-gm-tools-row">
            <label>遊戲倍速
              <input id="idleGmGameSpeed" type="number" min="0.25" max="20" step="0.25" value="1"
                title="戰鬥、動畫與出傷計時加速">
            </label>
            <label>角色等級
              <input id="idleGmCharLevel" type="number" min="1" max="300" step="1" value="1"
                title="直接設定角色等級（升級會補 AP／極限屬性點）">
            </label>
          </div>
          <div class="idle-gm-actions idle-gm-actions--tight idle-gm-tools-actions">
            <button type="button" id="idleGmGodMode" class="idle-gm-btn idle-gm-toggle">God Mode</button>
            <button type="button" id="idleGmOneHitKill" class="idle-gm-btn idle-gm-toggle">一擊必殺</button>
          </div>
        </div>`;
  }

  function bindGmCharLevel() {
    const el = $('idleGmCharLevel');
    if (!el || el.dataset.bound === '1') return;
    el.dataset.bound = '1';
    el.addEventListener('change', (e) => {
      applyGmCharLevel(e.target.value);
    });
    el.addEventListener('blur', (e) => {
      applyGmCharLevel(e.target.value);
    });
  }

  function migrateGmToolsSection() {
    const section = $('idleGmToolsSection');
    if (!section || $('idleGmCharLevel')) return;
    const row = section.querySelector('.idle-gm-tools-row')
      || section.querySelector('.idle-gm-rewards--wide');
    if (!row) return;
    row.classList.remove('idle-gm-rewards', 'idle-gm-rewards--wide');
    row.classList.add('idle-gm-tools-row');
    row.insertAdjacentHTML('beforeend', `
            <label>角色等級
              <input id="idleGmCharLevel" type="number" min="1" max="300" step="1" value="1"
                title="直接設定角色等級（升級會補 AP／極限屬性點）">
            </label>`);
    bindGmCharLevel();
  }

  function ensureGmToolsSection() {
    const body = $('idleGmDropsRoot')?.querySelector('.idle-gm-body');
    if (!body) return;
    if (!$('idleGmToolsSection')) {
      body.insertAdjacentHTML('afterbegin', gmToolsMarkup());
      return;
    }
    migrateGmToolsSection();
  }

  function applyGmCharLevel(raw) {
    if (typeof CharacterProgression === 'undefined' || typeof CharacterProgression.setLevel !== 'function') {
      setStatus('CharacterProgression 未載入');
      return;
    }
    const n = Math.max(1, Math.min(300, Math.floor(Number(raw) || 1)));
    CharacterProgression.setLevel(n);
    syncGmToolsUi();
    setStatus(`角色等級已設為 Lv.${n}`);
    if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
  }

  function syncGmToolsUi() {
    if (typeof IdleHunt !== 'undefined') {
      const speed = $('idleGmGameSpeed');
      if (speed && document.activeElement !== speed && typeof IdleHunt.getGameSpeed === 'function') {
        speed.value = String(IdleHunt.getGameSpeed());
      }
      $('idleGmGodMode')?.classList.toggle('is-on', !!IdleHunt.isGodMode?.());
      $('idleGmOneHitKill')?.classList.toggle('is-on', !!IdleHunt.isOneHitKill?.());
    }
    const lv = $('idleGmCharLevel');
    if (lv && document.activeElement !== lv && typeof CharacterProgression !== 'undefined') {
      const level = Number(CharacterProgression.getState?.()?.level) || 1;
      lv.value = String(level);
    }
  }

  function bindGmTools() {
    $('idleGmGameSpeed')?.addEventListener('change', (e) => {
      if (typeof IdleHunt !== 'undefined') IdleHunt.setGameSpeed?.(e.target.value);
      syncGmToolsUi();
    });
    $('idleGmGameSpeed')?.addEventListener('blur', (e) => {
      if (typeof IdleHunt !== 'undefined') IdleHunt.setGameSpeed?.(e.target.value);
      syncGmToolsUi();
    });
    bindGmCharLevel();
    $('idleGmGodMode')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof IdleHunt === 'undefined') return;
      IdleHunt.setGodMode?.(!IdleHunt.isGodMode?.());
      syncGmToolsUi();
      setStatus(IdleHunt.isGodMode?.() ? 'God Mode 已開啟（無敵）' : 'God Mode 已關閉');
    });
    $('idleGmOneHitKill')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof IdleHunt === 'undefined') return;
      IdleHunt.setOneHitKill?.(!IdleHunt.isOneHitKill?.());
      syncGmToolsUi();
      setStatus(IdleHunt.isOneHitKill?.() ? '一擊必殺已開啟' : '一擊必殺已關閉');
    });
    syncGmToolsUi();
  }

  function ensureDom() {
    if ($('idleGmDropsRoot')) return;
    const root = document.createElement('div');
    root.id = 'idleGmDropsRoot';
    root.className = 'idle-gm-root is-hidden';
    root.innerHTML = `
      <div class="idle-gm-header">
        <div class="idle-gm-tabs">
          <button type="button" class="idle-gm-tab is-on" id="idleGmTabChapter" data-gm-page="chapter">章節</button>
          <button type="button" class="idle-gm-tab" id="idleGmTabDungeon" data-gm-page="dungeon">副本</button>
        </div>
        <button type="button" id="idleGmDropsClose" class="idle-gm-icon-btn">關閉</button>
      </div>
      <div class="idle-gm-body">
        <div id="idleGmToolsSection">
          <div class="idle-gm-section-title">GM 功能</div>
          <p class="idle-gm-hint">測試用；設定存本機，不寫入資料檔。</p>
          <div class="idle-gm-tools-row">
            <label>遊戲倍速
              <input id="idleGmGameSpeed" type="number" min="0.25" max="20" step="0.25" value="1"
                title="戰鬥、動畫與出傷計時加速">
            </label>
            <label>角色等級
              <input id="idleGmCharLevel" type="number" min="1" max="300" step="1" value="1"
                title="直接設定角色等級（升級會補 AP／極限屬性點）">
            </label>
          </div>
          <div class="idle-gm-actions idle-gm-actions--tight idle-gm-tools-actions">
            <button type="button" id="idleGmGodMode" class="idle-gm-btn idle-gm-toggle">God Mode</button>
            <button type="button" id="idleGmOneHitKill" class="idle-gm-btn idle-gm-toggle">一擊必殺</button>
          </div>
        </div>
        <div id="idleGmPageChapter">
        <p class="idle-gm-hint">未指定區塊的自動範本地圖（約 120 張）已自動隱藏，不會出現在選單與「未分類」。</p>
        <div class="idle-gm-actions idle-gm-actions--tight">
          <button type="button" id="idleGmPurgeTemplates" class="idle-gm-btn">清除未分類範本的本機覆寫</button>
        </div>
        <label class="idle-gm-field">
          <span>地圖</span>
          <select id="idleGmMapSelect"></select>
        </label>
        <label class="idle-gm-field">
          <span>大區塊名稱（此圖所在區間）</span>
          <input id="idleGmBandName" type="text" placeholder="楓葉島">
        </label>
        <div class="idle-gm-section-title">此區塊角色等級（不決定地圖張數）</div>
        <p class="idle-gm-hint">例如 1～10 等可以只有 4 張圖，10～20 等可以有 15 張。改區間不會自動搬地圖。</p>
        <div class="idle-gm-rewards idle-gm-rewards--wide">
          <label>最低等
            <input id="idleGmBandMin" type="number" min="1" max="300" step="1">
          </label>
          <label>最高等
            <input id="idleGmBandMax" type="number" min="1" max="300" step="1">
          </label>
        </div>
        <div class="idle-gm-actions idle-gm-actions--tight">
          <button type="button" id="idleGmApplyBandRange" class="idle-gm-btn">套用此區塊區間</button>
        </div>
        <div class="idle-gm-section-title">新增等級區間</div>
        <div class="idle-gm-rewards idle-gm-rewards--wide">
          <label>新區塊名稱
            <input id="idleGmNewBandName" type="text" placeholder="新區塊">
          </label>
          <label>最低等
            <input id="idleGmNewBandMin" type="number" min="1" max="300" step="1" value="1">
          </label>
          <label>最高等
            <input id="idleGmNewBandMax" type="number" min="1" max="300" step="1" value="10">
          </label>
        </div>
        <div class="idle-gm-actions idle-gm-actions--tight">
          <button type="button" id="idleGmAddBand" class="idle-gm-btn">新增空區間</button>
        </div>
        <label class="idle-gm-field">
          <span>此圖所屬區塊</span>
          <select id="idleGmMapBand"></select>
        </label>
        <div class="idle-gm-actions idle-gm-actions--tight">
          <button type="button" id="idleGmAddMap" class="idle-gm-btn">在此區塊新增地圖</button>
        </div>
        <p id="idleGmBandMapCount" class="idle-gm-hint"></p>
        <label class="idle-gm-field">
          <span>地圖名稱</span>
          <input id="idleGmMapName" type="text" placeholder="第 1 狩獵場">
        </label>
        <div class="idle-gm-section-title">戰鬥／擊殺</div>
        <div class="idle-gm-rewards">
          <label>小怪經驗
            <input id="idleGmKillExp" type="number" min="0" step="1">
          </label>
          <label>小怪金幣
            <input id="idleGmKillGold" type="number" min="0" step="1">
          </label>
          <label>小怪血量
            <input id="idleGmMonsterHp" type="number" min="1" step="1">
          </label>
          <label>BOSS 經驗
            <input id="idleGmBossKillExp" type="number" min="0" step="1">
          </label>
          <label>BOSS 金幣
            <input id="idleGmBossKillGold" type="number" min="0" step="1">
          </label>
          <label>BOSS 血量
            <input id="idleGmBossHp" type="number" min="1" step="1">
          </label>
          <label>首次挑戰（隻）
            <input id="idleGmSmallKills" type="number" min="0" step="1" title="首次挑戰 BOSS 前要擊殺的小怪數，預設 100">
          </label>
          <label>通關後再戰（隻）
            <input id="idleGmReplayBossKills" type="number" min="0" step="1" title="已通關後每打幾隻小怪可再挑戰 BOSS，0 為關閉">
          </label>
        </div>
        <div class="idle-gm-section-title">小怪攻擊（優先 skill1→2→3，再攻擊1～3）</div>
        <div class="idle-gm-rewards idle-gm-rewards--atk4">
          <label>攻擊1 傷害
            <input id="idleGmMobAtk1Dmg" type="number" min="0" step="1" title="attack1，0 為不使用">
          </label>
          <label>攻擊1 CD
            <input id="idleGmMobAtk1Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>攻擊2 傷害
            <input id="idleGmMobAtk2Dmg" type="number" min="0" step="1" title="attack2，需有動畫">
          </label>
          <label>攻擊2 CD
            <input id="idleGmMobAtk2Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>攻擊3 傷害
            <input id="idleGmMobAtk3Dmg" type="number" min="0" step="1" title="attack3，需有動畫">
          </label>
          <label>攻擊3 CD
            <input id="idleGmMobAtk3Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>Skill1 傷害
            <input id="idleGmMobSkill1Dmg" type="number" min="0" step="1" title="skill1，0 為不放">
          </label>
          <label>Skill1 CD
            <input id="idleGmMobSkill1Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>Skill2 傷害
            <input id="idleGmMobSkill2Dmg" type="number" min="0" step="1" title="skill2，需有動畫">
          </label>
          <label>Skill2 CD
            <input id="idleGmMobSkill2Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>Skill3 傷害
            <input id="idleGmMobSkill3Dmg" type="number" min="0" step="1" title="skill3，需有動畫">
          </label>
          <label>Skill3 CD
            <input id="idleGmMobSkill3Cd" type="number" min="0" step="0.1" title="秒">
          </label>
        </div>
        <div class="idle-gm-section-title">BOSS 攻擊（優先 skill1→2→3，再攻擊1～3）</div>
        <div class="idle-gm-rewards idle-gm-rewards--atk4">
          <label>攻擊1 傷害
            <input id="idleGmBossAtk1Dmg" type="number" min="0" step="1">
          </label>
          <label>攻擊1 CD
            <input id="idleGmBossAtk1Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>攻擊2 傷害
            <input id="idleGmBossAtk2Dmg" type="number" min="0" step="1">
          </label>
          <label>攻擊2 CD
            <input id="idleGmBossAtk2Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>攻擊3 傷害
            <input id="idleGmBossAtk3Dmg" type="number" min="0" step="1">
          </label>
          <label>攻擊3 CD
            <input id="idleGmBossAtk3Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>Skill1 傷害
            <input id="idleGmBossSkill1Dmg" type="number" min="0" step="1">
          </label>
          <label>Skill1 CD
            <input id="idleGmBossSkill1Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>Skill2 傷害
            <input id="idleGmBossSkill2Dmg" type="number" min="0" step="1">
          </label>
          <label>Skill2 CD
            <input id="idleGmBossSkill2Cd" type="number" min="0" step="0.1" title="秒">
          </label>
          <label>Skill3 傷害
            <input id="idleGmBossSkill3Dmg" type="number" min="0" step="1">
          </label>
          <label>Skill3 CD
            <input id="idleGmBossSkill3Cd" type="number" min="0" step="0.1" title="秒">
          </label>
        </div>
        <div class="idle-gm-section-title">怪物名稱／icon 編號</div>
        <div class="idle-gm-rewards idle-gm-rewards--wide">
          <label>小怪名稱
            <input id="idleGmMobName" type="text">
          </label>
          <label>小怪 icon
            <input id="idleGmMobIcon" type="text" placeholder="0100100">
          </label>
          <label>BOSS 名稱
            <input id="idleGmBossName" type="text">
          </label>
          <label>BOSS icon
            <input id="idleGmBossIcon" type="text" placeholder="2220000">
          </label>
          <label class="idle-gm-check">
            <input id="idleGmBossScaleSprite" type="checkbox">
            貼圖放大 2 倍
          </label>
          <label class="idle-gm-check">
            <input id="idleGmBossScaleHud" type="checkbox">
            血條／名稱放大 2 倍
          </label>
        </div>
        <div class="idle-gm-section-title">地圖背景</div>
        <div class="idle-gm-mapbg">
          <label>檔名（images/idle-zones/{檔名}.png）
            <input id="idleGmArtId" type="text" placeholder="mapleisland-10000">
          </label>
        </div>
        <div class="idle-gm-drop-panel">
          <div class="idle-gm-section-title">掉落設定</div>
          <p id="idleGmDropBandHint" class="idle-gm-hint"></p>
          <div class="idle-gm-drop-block">
            <div class="idle-gm-drop-block__title">全域 · 小怪掉落</div>
            <div id="idleGmGlobalMobDropList" class="idle-gm-drop-list idle-gm-drop-list--compact" data-drop-scope="global-mob"></div>
          </div>
          <div class="idle-gm-drop-block">
            <div class="idle-gm-drop-block__title">全域 · BOSS 掉落</div>
            <div id="idleGmGlobalBossDropList" class="idle-gm-drop-list idle-gm-drop-list--compact" data-drop-scope="global-boss"></div>
          </div>
          <div class="idle-gm-drop-block">
            <div class="idle-gm-drop-block__title">此地圖 · 小怪掉落</div>
            <div id="idleGmMapMobDropList" class="idle-gm-drop-list idle-gm-drop-list--compact" data-drop-scope="map-mob"></div>
          </div>
          <div class="idle-gm-drop-block">
            <div class="idle-gm-drop-block__title">此地圖 · BOSS 掉落</div>
            <div id="idleGmMapBossDropList" class="idle-gm-drop-list idle-gm-drop-list--compact" data-drop-scope="map-boss"></div>
          </div>
          <div class="idle-gm-drop-block">
            <div class="idle-gm-drop-block__title">此區塊 · 小怪掉落</div>
            <div id="idleGmBandMobDropList" class="idle-gm-drop-list idle-gm-drop-list--compact" data-drop-scope="band-mob"></div>
          </div>
          <div class="idle-gm-drop-block">
            <div class="idle-gm-drop-block__title">此區塊 · BOSS 掉落</div>
            <div id="idleGmBandBossDropList" class="idle-gm-drop-list idle-gm-drop-list--compact" data-drop-scope="band-boss"></div>
          </div>
          <div class="idle-gm-actions idle-gm-actions--tight">
            <button type="button" id="idleGmResetGlobalDrops" class="idle-gm-btn">清空全域掉落表</button>
            <button type="button" id="idleGmResetMapDrops" class="idle-gm-btn">清空此地圖掉落表</button>
            <button type="button" id="idleGmResetBandDrops" class="idle-gm-btn">清空此區塊掉落表</button>
          </div>
          <div class="idle-gm-section-title idle-gm-section-title--sub">從清單加入至</div>
          <div class="idle-gm-filters" id="idleGmDropScope">
            ${DROP_SCOPES.map((s, i) => (
              `<button type="button" class="idle-gm-chip${i === 0 ? ' is-on' : ''}" data-drop-scope="${s.id}">${s.label}</button>`
            )).join('')}
          </div>
          <div id="idleGmTickets" class="idle-gm-filters"></div>
          <div id="idleGmCatalogKinds" class="idle-gm-filters"></div>
          <div class="idle-gm-search">
            <input id="idleGmSearch" type="search" placeholder="名稱或 ID">
            <input id="idleGmLvMin" type="number" min="0" max="300" placeholder="等min">
            <input id="idleGmLvMax" type="number" min="0" max="300" placeholder="等max">
          </div>
          <div id="idleGmFilters" class="idle-gm-filters"></div>
          <div id="idleGmCatalog" class="idle-gm-catalog"></div>
        </div>
        <div class="idle-gm-actions">
          <button type="button" id="idleGmWriteJs" class="idle-gm-btn">寫入 JS 檔</button>
          <button type="button" id="idleGmResetMap" class="idle-gm-btn">還原此圖（清本機覆寫）</button>
          <button type="button" id="idleGmCopyJson" class="idle-gm-btn">複製 JSON</button>
        </div>
        <p id="idleGmWriterHint" class="idle-gm-hint">寫入檔案請先在專案目錄執行 npm run gm-writer</p>
        <p id="idleGmStatus" class="idle-gm-status"></p>
        </div>
        <div id="idleGmPageDungeon" class="is-hidden"></div>
      </div>
    `;
    document.body.appendChild(root);
    if (typeof IdleDungeon !== 'undefined') IdleDungeon.mountGm?.($('idleGmPageDungeon'));
  }

  function renderMaps() {
    const sel = $('idleGmMapSelect');
    if (!sel || typeof IdleZones === 'undefined') return;
    sel.innerHTML = IdleZones.list.map((z) => {
      const id = IdleZones.id(z);
      const edited = typeof IdleZoneDropStore !== 'undefined' && IdleZoneDropStore.has(id) ? ' *' : '';
      const band = IdleZones.bandOf(z);
      const bandDrop = typeof IdleZones.bandHasDrops === 'function' && IdleZones.bandHasDrops(band.key) ? ' †' : '';
      const name = IdleZones.configFor(z).name || z.name;
      const region = IdleZones.configFor(z).regionName || z.regionName;
      return `<option value="${id}"${id === zoneId ? ' selected' : ''}>${region} · ${name}${edited}${bandDrop}</option>`;
    }).join('');
  }

  function renderDropTable(box, scope) {
    if (!box) return;
    const list = rows(scope);
    const { layer, kind } = parseScope(scope);
    const layerLabel = layer === 'global' ? '全域' : (layer === 'band' ? '此區塊' : '此地圖');
    const kindLabel = kind === 'boss' ? 'BOSS' : '小怪';
    if (!list.length) {
      box.innerHTML = `<div class="idle-gm-empty">尚無${layerLabel}${kindLabel}掉落。下方選清單加入。</div>`;
      return;
    }
    box.innerHTML = list.map((row, i) => {
      const isEquip = row.kind === 'equip';
      const isEtc = row.kind === 'etc';
      const legacyPotion = isEtc && typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(row.itemId)
        ? IdlePotionStore.get(row.itemId)
        : null;
      const etc = isEtc && !legacyPotion ? etcMeta(row.itemId) : null;
      const consume = !isEquip && !isEtc ? consumeMeta(row) : null;
      const id = isEquip ? row.itemId : (isEtc ? row.itemId : (row.scrollId || row.cubeId || row.itemId || ''));
      const name = isEquip
        ? itemName(row.itemId)
        : (isEtc
          ? (legacyPotion?.name || etc?.name || row.name || row.itemId)
          : (consume?.name || consumeName(row)));
      const icon = isEquip
        ? `images/equip/${row.itemId}.png`
        : (legacyPotion
          ? IdlePotionStore.resolveIcon(legacyPotion.icon)
          : (etc?.icon || consume?.icon || ''));
      const kindTag = legacyPotion ? '消耗' : (isEtc ? '其他' : '消耗');
      const chance = Number(row.chance);
      const shown = Number.isFinite(chance) && chance > 0 ? chance : 0;
      const qty = dropQty(row);
      const thumb = icon
        ? `<img src="${icon}" alt="" onerror="this.style.visibility='hidden'">`
        : `<span class="idle-gm-drop-kind">${kindTag}</span>`;
      return `<div class="idle-gm-drop-row" data-idx="${i}" data-drop-scope="${scope}">
        ${thumb}
        <div class="idle-gm-drop-meta">
          <strong>${name}</strong>
          <span>${id}</span>
        </div>
        <label class="idle-gm-chance">
          <input type="number" min="0" max="100" step="0.01" value="${shown}" data-chance-idx="${i}" data-drop-scope="${scope}">
          <span>%</span>
        </label>
        <label class="idle-gm-chance idle-gm-qty">
          <input type="number" min="1" max="9999" step="1" value="${qty}" data-amount-idx="${i}" data-drop-scope="${scope}">
          <span>個</span>
        </label>
        <button type="button" class="idle-gm-icon-btn" data-remove-idx="${i}" data-drop-scope="${scope}">刪</button>
      </div>`;
    }).join('');
  }

  function renderDropBandHint() {
    const el = $('idleGmDropBandHint');
    if (!el || typeof IdleZones === 'undefined') return;
    const band = IdleZones.bandOf(currentZone());
    if (!band || band.key === 'unassigned') {
      el.textContent = '實際掉落 = 全域表 + 區塊表 + 地圖表（各自獨立機率判定）。此地圖尚未歸屬等級區間時，區塊掉落不會生效。同一物品可加入多次，各自獨立判定機率與數量。';
      return;
    }
    const count = IdleZones.bandByKey(band.key)?.maps?.length || 0;
    el.textContent = `實際掉落 = 全域（全章節）＋ 區塊「${band.name || band.key}」（Lv.${band.min}～${band.max}，${count} 張）＋ 此地圖。三層各自獨立判定機率；同一物品可加入多次。`;
  }

  function dropListId(scopeId) {
    if (scopeId === 'global-mob') return 'idleGmGlobalMobDropList';
    if (scopeId === 'global-boss') return 'idleGmGlobalBossDropList';
    if (scopeId === 'map-mob') return 'idleGmMapMobDropList';
    if (scopeId === 'map-boss') return 'idleGmMapBossDropList';
    if (scopeId === 'band-mob') return 'idleGmBandMobDropList';
    return 'idleGmBandBossDropList';
  }

  function renderDrops() {
    DROP_SCOPES.forEach((s) => {
      renderDropTable($(dropListId(s.id)), s.id);
    });
    renderDropBandHint();
    const wrap = $('idleGmDropScope');
    if (wrap) {
      wrap.querySelectorAll('[data-drop-scope]').forEach((btn) => {
        btn.classList.toggle('is-on', btn.getAttribute('data-drop-scope') === dropScope);
      });
    }
  }

  function renderFilters() {
    const kindsWrap = $('idleGmCatalogKinds');
    if (kindsWrap) {
      const kinds = [
        { id: 'equip', label: '裝備' },
        { id: 'etc', label: '其他' },
        { id: 'consume', label: '消耗' },
      ];
      kindsWrap.innerHTML = kinds.map((k) => (
        `<button type="button" class="idle-gm-chip${catalogKind === k.id ? ' is-on' : ''}" data-catalog-kind="${k.id}">${k.label}</button>`
      )).join('');
    }
    const wrap = $('idleGmFilters');
    if (!wrap) return;
    if (catalogKind !== 'equip') {
      wrap.innerHTML = '';
      return;
    }
    const filters = [
      { id: 'all', label: '全部' },
      { id: 'weapon', label: '武器' },
      { id: 'armor', label: '防具' },
      { id: 'accessory', label: '飾品' },
      { id: 'offHand', label: '副武' },
    ];
    wrap.innerHTML = filters.map((f) => (
      `<button type="button" class="idle-gm-chip${filterId === f.id ? ' is-on' : ''}" data-filter="${f.id}">${f.label}</button>`
    )).join('');
  }

  function renderCatalog() {
    const grid = $('idleGmCatalog');
    if (!grid) return;
    const items = catalog();
    if (catalogKind === 'etc') {
      grid.innerHTML = items.map((item) => (
        `<button type="button" class="idle-gm-cat" data-add-kind="etc" data-add-id="${item.id}" title="${item.desc || item.name}">
          <img src="${item.icon}" alt="" onerror="this.style.visibility='hidden'">
          <span class="idle-gm-cat-name">${item.name}</span>
          <span class="idle-gm-cat-lv">其他</span>
        </button>`
      )).join('') || '<div class="idle-gm-empty">沒有符合的其他道具（請編輯 js/idleEtcData.js）</div>';
      return;
    }
    if (catalogKind === 'consume') {
      grid.innerHTML = items.map((item) => (
        `<button type="button" class="idle-gm-cat" data-add-kind="consume" data-add-id="${item.id}" title="${item.boost || item.name}">
          <img src="${item.icon}" alt="" onerror="this.style.visibility='hidden'">
          <span class="idle-gm-cat-name">${item.name}</span>
          <span class="idle-gm-cat-lv">${item.rate}% ／ ${item.boost || '—'}</span>
        </button>`
      )).join('') || '<div class="idle-gm-empty">沒有符合的消耗品（請編輯 js/idleConsumeData.js）</div>';
      return;
    }
    grid.innerHTML = items.map((item) => {
      const id = item.itemId || item.id;
      return `<button type="button" class="idle-gm-cat" data-add-kind="equip" data-add-id="${id}" title="${item.name} (${id})">
        <img src="images/equip/${id}.png" alt="" onerror="this.style.visibility='hidden'">
        <span class="idle-gm-cat-name">${item.name}</span>
        <span class="idle-gm-cat-lv">Lv.${Number(item.reqLevel) || 0}</span>
      </button>`;
    }).join('') || '<div class="idle-gm-empty">沒有符合的裝備</div>';
  }

  function render() {
    ensureGmToolsSection();
    syncGmToolsUi();
    renderMaps();
    renderRewards();
    renderDrops();
    renderTickets();
    renderFilters();
    renderCatalog();
  }

  function renderTickets() {
    const wrap = $('idleGmTickets');
    if (!wrap) return;
    const tickets = typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.tickets() : [];
    wrap.innerHTML = tickets.map((t) => (
      `<button type="button" class="idle-gm-chip" data-add-ticket="${t.itemId}">${t.name}</button>`
    )).join('') || '<span class="idle-gm-hint">尚未設定副本入場券</span>';
  }

  function addTicket(ticketId) {
    const t = typeof IdleDungeonStore !== 'undefined'
      ? IdleDungeonStore.ticketById(ticketId)
      : (typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.ticketById(ticketId) : null);
    if (!t) return;
    const next = rows(dropScope);
    next.push({ kind: 'etc', itemId: t.itemId, name: t.name, chance: 8, amount: 1 });
    writeRows(next, dropScope);
    setStatus(`已加入【${t.name}】至${scopeLabel(dropScope)}（8% ×1）`);
    render();
  }

  function addEquip(itemId) {
    const id = String(itemId || '');
    if (!id) return;
    const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[id] : null;
    if (!isOriginalEquip(item || { itemId: id })) return;
    const next = rows(dropScope);
    next.push({ kind: 'equip', itemId: id, chance: DEFAULT_CHANCE, amount: 1 });
    writeRows(next, dropScope);
    setStatus(`已加入 ${itemName(id)} 至${scopeLabel(dropScope)}（${DEFAULT_CHANCE}% ×1）`);
    render();
  }

  function addEtc(itemId) {
    if (typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(itemId)) {
      addConsume(`consume-potion-${itemId}`);
      return;
    }
    const item = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(itemId) : null;
    if (!item) return;
    const next = rows(dropScope);
    next.push({ kind: 'etc', itemId: item.id, name: item.name, chance: DEFAULT_CHANCE, amount: 1 });
    writeRows(next, dropScope);
    setStatus(`已加入【${item.name}】至${scopeLabel(dropScope)}（${DEFAULT_CHANCE}% ×1）`);
    render();
  }

  function addConsume(itemId) {
    const item = typeof IdleConsumeStore !== 'undefined' ? IdleConsumeStore.get(itemId) : null;
    if (!item) return;
    const next = rows(dropScope);
    next.push({
      kind: 'consume',
      consumeType: item.consumeType,
      scrollId: item.scrollId || '',
      cubeId: item.cubeId || '',
      itemId: item.itemId || '',
      hammerId: item.hammerId || '',
      soulId: item.soulId || '',
      catalogId: item.id,
      name: item.name,
      chance: DEFAULT_CHANCE,
      amount: 1,
    });
    writeRows(next, dropScope);
    setStatus(`已加入【${item.name}】至${scopeLabel(dropScope)}（${DEFAULT_CHANCE}% ×1）`);
    render();
  }

  function setStatus(text) {
    const el = $('idleGmStatus');
    if (el) el.textContent = text || '';
  }

  function copyJson() {
    const payload = {
      globalDrops: typeof IdleZones !== 'undefined' ? IdleZones.globalDropsCfg() : { mobDrops: [], bossDrops: [] },
      bands: typeof IdleZones !== 'undefined' ? IdleZones.bandDefList() : [],
      maps: {},
    };
    if (typeof IdleZones !== 'undefined') {
      IdleZones.list.forEach((z) => {
        payload.maps[IdleZones.id(z)] = IdleZones.configFor(z);
      });
    }
    const text = JSON.stringify(payload, null, 2);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => setStatus('已複製全部地圖設定 JSON')).catch(() => setStatus('複製失敗'));
      return;
    }
    setStatus('無法複製，請開主控台查看');
    console.log(text);
  }

  function setPage(page) {
    gmPage = page === 'dungeon' ? 'dungeon' : 'chapter';
    $('idleGmPageChapter')?.classList.toggle('is-hidden', gmPage !== 'chapter');
    $('idleGmPageDungeon')?.classList.toggle('is-hidden', gmPage !== 'dungeon');
    $('idleGmTabChapter')?.classList.toggle('is-on', gmPage === 'chapter');
    $('idleGmTabDungeon')?.classList.toggle('is-on', gmPage === 'dungeon');
    $('idleGmDropsRoot')?.classList.toggle('is-dungeon-page', gmPage === 'dungeon');
    if (gmPage === 'dungeon' && typeof IdleDungeon !== 'undefined') {
      IdleDungeon.mountGm?.($('idleGmPageDungeon'));
    }
  }

  function setOpen(next) {
    open = !!next;
    if (open && (!$('idleGmMapMobDropList') || !$('idleGmGlobalMobDropList'))) {
      $('idleGmDropsRoot')?.remove();
      inited = false;
    }
    init();
    const root = $('idleGmDropsRoot');
    root?.classList.toggle('is-hidden', !open);
    if (open) {
      if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.getZoneId === 'function') {
        zoneId = IdleHunt.getZoneId() || zoneId;
      }
      if (typeof IdleZones !== 'undefined' && !zoneId) zoneId = IdleZones.id(IdleZones.list[0]);
      pingWriter();
      render();
      setPage(gmPage);
      if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront(root);
    }
  }

  function bind() {
    ensureGmToolsSection();
    bindGmTools();
    $('idleGmDropsClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
    $('idleGmTabChapter')?.addEventListener('click', (e) => {
      e.preventDefault();
      setPage('chapter');
    });
    $('idleGmTabDungeon')?.addEventListener('click', (e) => {
      e.preventDefault();
      setPage('dungeon');
    });
    $('idleGmMapSelect')?.addEventListener('change', (e) => {
      zoneId = e.target.value;
      render();
    });
    $('idleGmBandName')?.addEventListener('change', (e) => {
      const name = String(e.target.value || '').trim();
      if (!name) {
        setStatus('大區塊名稱不可空白');
        renderRewards();
        return;
      }
      const z = currentZone();
      IdleZones.renameBand(IdleZones.bandOf(z).key, name);
      setStatus(`已重新命名大區塊：${name}`);
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      scheduleWriteJs();
      renderMaps();
    });
    $('idleGmApplyBandRange')?.addEventListener('click', (e) => {
      e.preventDefault();
      const z = currentZone();
      const band = IdleZones.bandOf(z);
      IdleZones.applyBandRange(band.key, $('idleGmBandMin')?.value, $('idleGmBandMax')?.value);
      setStatus(`已更新區間為 Lv.${IdleZones.bandOf(currentZone()).min}～${IdleZones.bandOf(currentZone()).max}`);
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      scheduleWriteJs();
      render();
    });
    $('idleGmAddBand')?.addEventListener('click', (e) => {
      e.preventDefault();
      const band = IdleZones.addBand(
        $('idleGmNewBandMin')?.value,
        $('idleGmNewBandMax')?.value,
        $('idleGmNewBandName')?.value,
      );
      setStatus(`已新增空區間 ${band.name}（Lv.${band.min}～${band.max}），可用「新增地圖」放入`);
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      scheduleWriteJs();
      render();
    });
    $('idleGmMapBand')?.addEventListener('change', (e) => {
      IdleZones.assignMapToBand(zoneId, e.target.value);
      setStatus('已將此地圖移到選定區塊');
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      scheduleWriteJs();
      render();
    });
    $('idleGmAddMap')?.addEventListener('click', (e) => {
      e.preventDefault();
      const z = currentZone();
      const band = IdleZones.bandOf(z);
      const created = IdleZones.addMapToBand(band.id);
      if (created) zoneId = IdleZones.id(created);
      setStatus(created ? `已在「${band.name || band.id}」新增地圖` : '無法新增地圖');
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      scheduleWriteJs();
      render();
    });
    $('idleGmMapName')?.addEventListener('change', (e) => {
      const name = String(e.target.value || '').trim();
      if (!name) {
        setStatus('地圖名稱不可空白');
        renderRewards();
        return;
      }
      IdleZoneDropStore.patch(zoneId, { name });
      if (typeof IdleZones !== 'undefined') IdleZones.applyMergedList(IdleZones.mergedList());
      setStatus(`已重新命名：${name}`);
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      scheduleWriteJs();
      renderMaps();
    });
    $('idleGmKillExp')?.addEventListener('change', (e) => {
      const n = Number(e.target.value);
      IdleZoneDropStore.patch(zoneId, { killExp: Number.isFinite(n) ? Math.max(0, n) : 0 });
      setStatus('已更新怪物經驗');
      scheduleWriteJs();
    });
    $('idleGmKillGold')?.addEventListener('change', (e) => {
      const n = Number(e.target.value);
      IdleZoneDropStore.patch(zoneId, { killGold: Number.isFinite(n) ? Math.max(0, n) : 0 });
      setStatus('已更新金幣掉落');
      scheduleWriteJs();
    });
    $('idleGmMonsterHp')?.addEventListener('change', (e) => {
      const n = Number(e.target.value);
      IdleZoneDropStore.patch(zoneId, { monsterHp: Number.isFinite(n) && n > 0 ? n : 1 });
      setStatus('已更新小怪血量');
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      scheduleWriteJs();
    });
    $('idleGmBossKillExp')?.addEventListener('change', (e) => {
      const n = Number(e.target.value);
      IdleZoneDropStore.patch(zoneId, { bossKillExp: Number.isFinite(n) ? Math.max(0, n) : 0 });
      setStatus('已更新 BOSS 經驗');
      scheduleWriteJs();
    });
    $('idleGmBossKillGold')?.addEventListener('change', (e) => {
      const n = Number(e.target.value);
      IdleZoneDropStore.patch(zoneId, { bossKillGold: Number.isFinite(n) ? Math.max(0, n) : 0 });
      setStatus('已更新 BOSS 金幣');
      scheduleWriteJs();
    });
    $('idleGmBossHp')?.addEventListener('change', (e) => {
      const n = Number(e.target.value);
      IdleZoneDropStore.patch(zoneId, { bossHp: Number.isFinite(n) && n > 0 ? n : 1 });
      setStatus('已更新 BOSS 血量');
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      scheduleWriteJs();
    });
    $('idleGmSmallKills')?.addEventListener('change', (e) => {
      const n = Number(e.target.value);
      IdleZoneDropStore.patch(zoneId, {
        smallKills: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 100,
      });
      setStatus(`首次挑戰 BOSS 需擊殺 ${Number.isFinite(n) && n >= 0 ? Math.floor(n) : 100} 隻小怪`);
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      scheduleWriteJs();
    });
    $('idleGmReplayBossKills')?.addEventListener('change', (e) => {
      const n = Number(e.target.value);
      IdleZoneDropStore.patch(zoneId, {
        replayBossKills: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 10,
      });
      setStatus(n > 0 ? `通關後每 ${Math.floor(n)} 隻小怪可再挑戰 BOSS` : '已關閉通關後再挑戰');
      if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
      scheduleWriteJs();
    });
    const bindAtk = (id, key, label, asInt, aliasKey) => {
      $(id)?.addEventListener('change', (e) => {
        const n = Number(e.target.value);
        const v = Number.isFinite(n) && n >= 0 ? (asInt ? Math.floor(n) : n) : 0;
        const patch = { [key]: v };
        if (aliasKey) patch[aliasKey] = v;
        IdleZoneDropStore.patch(zoneId, patch);
        setStatus(`已更新${label}`);
        if (typeof IdleHunt !== 'undefined') IdleHunt.refreshDisplay?.();
        scheduleWriteJs();
      });
    };
    bindAtk('idleGmMobAtk1Dmg', 'mobAtk1Dmg', '小怪 攻擊1 傷害', true);
    bindAtk('idleGmMobAtk1Cd', 'mobAtk1Cd', '小怪 攻擊1 CD', false);
    bindAtk('idleGmMobAtk2Dmg', 'mobAtk2Dmg', '小怪 攻擊2 傷害', true);
    bindAtk('idleGmMobAtk2Cd', 'mobAtk2Cd', '小怪 攻擊2 CD', false);
    bindAtk('idleGmMobAtk3Dmg', 'mobAtk3Dmg', '小怪 攻擊3 傷害', true);
    bindAtk('idleGmMobAtk3Cd', 'mobAtk3Cd', '小怪 攻擊3 CD', false);
    bindAtk('idleGmMobSkill1Dmg', 'mobSkill1Dmg', '小怪 Skill1 傷害', true, 'mobSkillDmg');
    bindAtk('idleGmMobSkill1Cd', 'mobSkill1Cd', '小怪 Skill1 CD', false, 'mobSkillCd');
    bindAtk('idleGmMobSkill2Dmg', 'mobSkill2Dmg', '小怪 Skill2 傷害', true);
    bindAtk('idleGmMobSkill2Cd', 'mobSkill2Cd', '小怪 Skill2 CD', false);
    bindAtk('idleGmMobSkill3Dmg', 'mobSkill3Dmg', '小怪 Skill3 傷害', true);
    bindAtk('idleGmMobSkill3Cd', 'mobSkill3Cd', '小怪 Skill3 CD', false);
    bindAtk('idleGmBossAtk1Dmg', 'bossAtk1Dmg', 'BOSS 攻擊1 傷害', true);
    bindAtk('idleGmBossAtk1Cd', 'bossAtk1Cd', 'BOSS 攻擊1 CD', false);
    bindAtk('idleGmBossAtk2Dmg', 'bossAtk2Dmg', 'BOSS 攻擊2 傷害', true);
    bindAtk('idleGmBossAtk2Cd', 'bossAtk2Cd', 'BOSS 攻擊2 CD', false);
    bindAtk('idleGmBossAtk3Dmg', 'bossAtk3Dmg', 'BOSS 攻擊3 傷害', true);
    bindAtk('idleGmBossAtk3Cd', 'bossAtk3Cd', 'BOSS 攻擊3 CD', false);
    bindAtk('idleGmBossSkill1Dmg', 'bossSkill1Dmg', 'BOSS Skill1 傷害', true, 'bossSkillDmg');
    bindAtk('idleGmBossSkill1Cd', 'bossSkill1Cd', 'BOSS Skill1 CD', false, 'bossSkillCd');
    bindAtk('idleGmBossSkill2Dmg', 'bossSkill2Dmg', 'BOSS Skill2 傷害', true);
    bindAtk('idleGmBossSkill2Cd', 'bossSkill2Cd', 'BOSS Skill2 CD', false);
    bindAtk('idleGmBossSkill3Dmg', 'bossSkill3Dmg', 'BOSS Skill3 傷害', true);
    bindAtk('idleGmBossSkill3Cd', 'bossSkill3Cd', 'BOSS Skill3 CD', false);
    $('idleGmMobName')?.addEventListener('change', (e) => {
      IdleZoneDropStore.patch(zoneId, { mobName: String(e.target.value || '').trim() });
      setStatus('已更新小怪名稱');
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      scheduleWriteJs();
    });
    $('idleGmMobIcon')?.addEventListener('change', (e) => {
      const id = String(e.target.value || '').replace(/\D/g, '').padStart(7, '0').slice(-7);
      IdleZoneDropStore.patch(zoneId, { mobIcon: id });
      setStatus('已更新小怪 icon');
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      scheduleWriteJs();
    });
    $('idleGmBossName')?.addEventListener('change', (e) => {
      IdleZoneDropStore.patch(zoneId, { bossName: String(e.target.value || '').trim() });
      setStatus('已更新 BOSS 名稱');
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      scheduleWriteJs();
    });
    $('idleGmBossIcon')?.addEventListener('change', (e) => {
      const id = String(e.target.value || '').replace(/\D/g, '').padStart(7, '0').slice(-7);
      IdleZoneDropStore.patch(zoneId, { bossIcon: id });
      setStatus('已更新 BOSS icon');
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      scheduleWriteJs();
    });
    $('idleGmBossScaleSprite')?.addEventListener('change', (e) => {
      IdleZoneDropStore.patch(zoneId, { bossScaleSprite: !!e.target.checked });
      setStatus(e.target.checked ? 'BOSS 貼圖放大 2 倍' : '已關閉 BOSS 貼圖放大');
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      scheduleWriteJs();
    });
    $('idleGmBossScaleHud')?.addEventListener('change', (e) => {
      IdleZoneDropStore.patch(zoneId, { bossScaleHud: !!e.target.checked });
      setStatus(e.target.checked ? 'BOSS 血條／名稱放大 2 倍' : '已關閉 BOSS 血條／名稱放大');
      if (typeof IdleHunt !== 'undefined') IdleHunt.respawnMobs?.();
      scheduleWriteJs();
    });
    $('idleGmArtId')?.addEventListener('change', (e) => {
      setMapBg(e.target.value);
    });
    const onDropList = (e) => {
      const btn = e.target.closest('[data-remove-idx]');
      if (btn) {
        const scope = btn.getAttribute('data-drop-scope') || dropScope;
        const idx = Number(btn.getAttribute('data-remove-idx'));
        writeRows(rows(scope).filter((_, i) => i !== idx), scope);
        render();
        return;
      }
    };
    const onDropField = (e) => {
      const chanceInput = e.target.closest('[data-chance-idx]');
      const amountInput = e.target.closest('[data-amount-idx]');
      const input = chanceInput || amountInput;
      if (!input) return;
      const scope = input.getAttribute('data-drop-scope') || dropScope;
      const idx = Number(input.getAttribute(chanceInput ? 'data-chance-idx' : 'data-amount-idx'));
      const next = rows(scope);
      if (!next[idx]) return;
      if (chanceInput) {
        const n = Number(chanceInput.value);
        next[idx] = { ...next[idx], chance: Number.isFinite(n) ? n : 0 };
      } else {
        const n = Math.floor(Number(amountInput.value));
        const amount = Number.isFinite(n) && n > 0 ? n : 1;
        const row = { ...next[idx], amount };
        delete row.amountMin;
        delete row.amountMax;
        next[idx] = row;
        if (amountInput.value !== String(amount)) amountInput.value = String(amount);
      }
      writeRows(next, scope);
    };
    const dropPanel = document.querySelector('.idle-gm-drop-panel');
    dropPanel?.addEventListener('click', onDropList);
    dropPanel?.addEventListener('change', onDropField);
    $('idleGmResetGlobalDrops')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof IdleZoneDropStore === 'undefined') return;
      IdleZoneDropStore.patchGlobal({ mobDrops: [], bossDrops: [] });
      setStatus('已清空全域小怪／BOSS 掉落表');
      render();
      scheduleWriteJs();
    });
    $('idleGmResetBandDrops')?.addEventListener('click', (e) => {
      e.preventDefault();
      const key = currentBandKey();
      if (!key || key === 'unassigned') {
        setStatus('此地圖尚未歸屬等級區間');
        return;
      }
      IdleZones.patchBand(key, { mobDrops: [], bossDrops: [] });
      setStatus('已清空此區塊的小怪／BOSS 掉落表');
      render();
      scheduleWriteJs();
    });
    $('idleGmResetMapDrops')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof IdleZoneDropStore === 'undefined') return;
      IdleZoneDropStore.patch(zoneId, { mobDrops: [], bossDrops: [] });
      setStatus('已清空此地圖的小怪／BOSS 掉落表');
      render();
      scheduleWriteJs();
    });
    $('idleGmDropScope')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-drop-scope]');
      if (!btn || btn.closest('#idleGmDropScope') !== $('idleGmDropScope')) return;
      dropScope = btn.getAttribute('data-drop-scope') || 'global-mob';
      renderDrops();
    });
    $('idleGmResetMap')?.addEventListener('click', (e) => {
      e.preventDefault();
      IdleZoneDropStore.remove(zoneId);
      setStatus('已還原為此圖資料檔預設');
      render();
      scheduleWriteJs();
    });
    $('idleGmPurgeTemplates')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof IdleZones?.purgeUnassignedGeneratedPatches !== 'function') return;
      const n = IdleZones.purgeUnassignedGeneratedPatches();
      setStatus(n > 0 ? `已清除 ${n} 張未分類範本的本機覆寫` : '沒有需要清除的本機覆寫');
      render();
      scheduleWriteJs();
    });
    $('idleGmWriteJs')?.addEventListener('click', (e) => {
      e.preventDefault();
      writeJsFile();
    });
    $('idleGmCopyJson')?.addEventListener('click', (e) => {
      e.preventDefault();
      copyJson();
    });
    $('idleGmSearch')?.addEventListener('input', (e) => {
      query = e.target.value || '';
      renderCatalog();
    });
    $('idleGmLvMin')?.addEventListener('input', (e) => {
      lvMin = e.target.value;
      renderCatalog();
    });
    $('idleGmLvMax')?.addEventListener('input', (e) => {
      lvMax = e.target.value;
      renderCatalog();
    });
    $('idleGmCatalogKinds')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-catalog-kind]');
      if (!btn) return;
      catalogKind = btn.getAttribute('data-catalog-kind') || 'equip';
      renderFilters();
      renderCatalog();
    });
    $('idleGmFilters')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      filterId = btn.getAttribute('data-filter') || 'all';
      renderFilters();
      renderCatalog();
    });
    $('idleGmCatalog')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-id]');
      if (!btn) return;
      const kind = btn.getAttribute('data-add-kind') || catalogKind;
      const id = btn.getAttribute('data-add-id');
      if (kind === 'etc') addEtc(id);
      else if (kind === 'consume') addConsume(id);
      else addEquip(id);
    });
    $('idleGmTickets')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add-ticket]');
      if (!btn) return;
      addTicket(btn.getAttribute('data-add-ticket'));
    });
    if (typeof PanelDrag !== 'undefined') {
      PanelDrag.enable($('idleGmDropsRoot'), {
        handle: '.idle-gm-header',
        ignoreSelector: 'button, input, select',
        storageKey: 'ui.drag.idleGmDrops',
        title: '拖曳 GM 掉落',
      });
    }
  }

  function init() {
    if (inited) return;
    ensureDom();
    bind();
    inited = true;
  }

  return {
    init,
    setOpen,
    setPage,
    toggle() {
      init();
      setOpen(!open);
    },
    syncHuntZone(id) {
      if (id) zoneId = id;
      if (open) render();
    },
    isOpen: () => open,
  };
})();

if (typeof window !== 'undefined') {
  window.UiIdleGmDrops = UiIdleGmDrops;
  window.addEventListener('DOMContentLoaded', () => UiIdleGmDrops.init());
}
