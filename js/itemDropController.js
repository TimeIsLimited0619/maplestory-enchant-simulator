/**
 * ItemDropController — 掛機場上掉落：拋物線彈跳 → 漂浮 → 週期拾取飛向玩家
 * 以 requestAnimationFrame 驅動，不跟隨狩獵 start/stop。
 */
const ItemDropController = (() => {
  const STATE = { SPAWNING: 'SPAWNING', FLOATING: 'FLOATING', LOOTING: 'LOOTING' };

  const GRAVITY = 1800;
  const BOUNCE_RESTITUTION = 0.42;
  const BOUNCE_COUNT = 2;
  const VY0 = -595; // 約為原 -420 的 √2 倍 → 飛起高度約 2×
  const VX_MIN = 90;
  const VX_STEP = 55;
  const LAND_SPACING = 40;
  const FIRST_LAND_SPACING = 24; // 首落地稍密，再往外彈到 LAND_SPACING
  const LAND_MARGIN = 28;
  const FLOAT_AMP = 4;
  const FLOAT_PERIOD = 1.4;
  const LOOT_INTERVAL = 1;
  const DESPAWN_AGE = 240;
  const LOOT_DUR = 0.55;
  const MAX_ON_FIELD = 80;
  const SETTLE_VY = 40;
  const MESO_FRAME_SEC = 0.1;
  const MESO_FRAME_COUNT = {
    '09000000': 4,
    '09000001': 4,
    '09000002': 3,
    '09000003': 4,
  };

  let stageEl = null;
  let layerEl = null;
  let items = [];
  let nextId = 1;
  let lootAccum = 0;
  let lastDropText = '';
  let onDropText = null;
  let onGrantMeso = null;
  let onGrantItem = null;
  let lootDelaySec = 0;
  let rafId = null;
  let lastTs = 0;
  let cachedPlayerPoint = null;
  let cachedPlayerPointAt = 0;

  function mesoIdForAmount(amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n >= 10000) return '09000003';
    if (n >= 1000) return '09000002';
    if (n >= 100) return '09000001';
    return '09000000';
  }

  function mesoFrameUrls(mesoId) {
    const count = MESO_FRAME_COUNT[mesoId] || 4;
    const urls = [];
    for (let i = 0; i < count; i += 1) {
      urls.push(`images/meso/${mesoId}__iconRaw__${i}.png`);
    }
    return urls;
  }

  function ensureLayer() {
    if (!stageEl) return null;
    if (layerEl && layerEl.isConnected && stageEl.contains(layerEl)) return layerEl;
    layerEl = null;
    layerEl = stageEl.querySelector('.idle-drop-layer');
    if (!layerEl) {
      layerEl = document.createElement('div');
      layerEl.className = 'idle-drop-layer';
      stageEl.appendChild(layerEl);
    }
    return layerEl;
  }

  function fieldRoot() {
    if (!stageEl) return null;
    return stageEl.closest?.('#idleBossField')
      || stageEl.closest?.('#idleHuntField')
      || stageEl;
  }

  function playerPoint() {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (cachedPlayerPoint && (now - cachedPlayerPointAt) < 80) return cachedPlayerPoint;
    const root = fieldRoot();
    const player = root?.querySelector?.('[data-sprite-slot="player"]')
      || stageEl?.querySelector?.('[data-sprite-slot="player"]');
    if (!player) {
      cachedPlayerPoint = { x: 200, y: 360 };
      cachedPlayerPointAt = now;
      return cachedPlayerPoint;
    }
    const x = parseFloat(player.style.left) || 200;
    const y = parseFloat(player.style.top) || 400;
    cachedPlayerPoint = { x, y: y - 40 };
    cachedPlayerPointAt = now;
    return cachedPlayerPoint;
  }

  function toIconRawPath(url) {
    const s = String(url || '');
    if (!s) return '';
    if (/\.iconRaw\./i.test(s) || /iconRaw\.png$/i.test(s)) return s;
    if (/\.info\.icon\./i.test(s)) return s.replace(/\.info\.icon\./i, '.info.iconRaw.');
    if (/\/icon\.png$/i.test(s)) return s.replace(/\/icon\.png$/i, '/iconRaw.png');
    if (/\.icon\.png$/i.test(s)) return s.replace(/\.icon\.png$/i, '.iconRaw.png');
    return s;
  }

  function resolveDropIcon(row) {
    if (!row) return '';
    if (row.kind === 'meso') {
      const id = mesoIdForAmount(row.amount);
      return `images/meso/${id}__iconRaw__0.png`;
    }
    if (row.iconRaw) return String(row.iconRaw);
    const id = String(row.itemId || row.id || '').trim();
    const db = typeof ITEM_DATABASE !== 'undefined' && id ? ITEM_DATABASE[id] : null;
    // 機器人無 equipRaw／一般 icon，裝備欄用 D 圖
    if (db && (typeof isAndroidItem === 'function' ? isAndroidItem(db) : db.subType === 'android')) {
      return (typeof getEquipDisplayIcon === 'function'
        ? getEquipDisplayIcon(db)
        : (db.equipIcon || `images/equip/${id}D.png`)) || '';
    }
    if (db?.iconRaw) return String(db.iconRaw);

    let icon = '';
    if (row.kind === 'equip') {
      // 掉落優先無陰影圖
      return id ? `images/equipRaw/${id}.png` : '';
    }
    // 藥水：kind=consume 或 etc 誤標、或未帶 consumeType 時仍依 itemId 查
    const potionId = (row.consumeType === 'potion' || row.kind === 'consume' || row.kind === 'etc' || row.bag === 'etc')
      ? id
      : '';
    if (potionId && typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(potionId)) {
      const potion = IdlePotionStore.get(potionId);
      icon = potion ? IdlePotionStore.resolveIcon(potion.icon) : '';
      if (icon) {
        const raw = toIconRawPath(icon);
        return raw || icon;
      }
    }
    if (row.kind === 'etc' || row.bag === 'etc') {
      const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(id) : null;
      icon = catalog?.icon || row.icon || '';
    } else {
      icon = row.icon || db?.icon || '';
      if (!icon && row.consumeType === 'starforce_scroll' && typeof getStarForceScrollById === 'function') {
        icon = getStarForceScrollById(row.scrollId)?.icon || '';
      } else if (!icon && row.consumeType === 'potential_scroll' && typeof getPotentialScrollById === 'function') {
        icon = getPotentialScrollById(row.scrollId)?.icon || '';
      } else if (!icon && row.consumeType === 'cube' && typeof getPotentialCubeById === 'function') {
        icon = getPotentialCubeById(row.cubeId)?.icon || '';
      } else if (!icon && row.consumeType === 'add_cube' && typeof getAddPotCubeById === 'function') {
        icon = getAddPotCubeById(row.cubeId)?.icon || '';
      } else if (!icon && row.consumeType === 'hammer' && typeof HAMMER_TYPES !== 'undefined') {
        icon = HAMMER_TYPES[row.hammerId]?.icon || '';
      } else if (!icon && row.consumeType === 'glory_scroll' && typeof getScrollById === 'function') {
        icon = getScrollById(row.scrollId)?.icon || '';
      } else if (!icon && row.consumeType === 'bonus_stat' && typeof getBonusStatItemById === 'function') {
        icon = getBonusStatItemById(row.itemId)?.icon || '';
      } else if (!icon && row.consumeType === 'exceptional_hammer' && typeof getExceptionalHammerById === 'function') {
        icon = getExceptionalHammerById(row.hammerId)?.icon || '';
      } else if (!icon && row.consumeType === 'soul' && typeof getSoulMaterialById === 'function') {
        icon = getSoulMaterialById(row.soulId)?.icon || '';
      }
    }

    const raw = toIconRawPath(icon);
    return raw || icon || '';
  }

  function dropQty(row) {
    const n = Math.floor(Number(row?.amount));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  function dropBaseName(row) {
    if (!row) return '';
    if (row.kind === 'meso') {
      const amt = Math.max(0, Math.floor(Number(row.amount) || 0));
      return `楓幣 ×${amt}`;
    }
    const id = String(row.itemId || row.id || '').trim();
    if (row.kind === 'equip' && typeof ITEM_DATABASE !== 'undefined') {
      return ITEM_DATABASE[id]?.name || id;
    }
    if (typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(id)
      && (row.consumeType === 'potion' || row.kind === 'consume' || row.kind === 'etc' || row.bag === 'etc')) {
      return IdlePotionStore.get(id)?.name || row.name || id || '藥水';
    }
    if (row.kind === 'etc' || row.bag === 'etc') {
      const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(id) : null;
      return catalog?.name || row.name || id;
    }
    return row.name || id || '掉落物';
  }

  function dropName(row) {
    const name = dropBaseName(row);
    if (!row || row.kind === 'meso' || row.kind === 'equip') return name;
    const amt = dropQty(row);
    return amt > 1 ? `${name} ×${amt}` : name;
  }

  function setLastDrop(text) {
    lastDropText = text || '';
    if (typeof onDropText === 'function') onDropText(lastDropText);
  }

  function syncDom(item) {
    if (!item?.el) return;
    item.el.style.left = `${Math.round(item.x)}px`;
    item.el.style.top = `${Math.round(item.y)}px`;
    item.el.style.opacity = String(item.opacity);
  }

  function tickMesoAnim(item, dt) {
    if (!item?.mesoFrames?.length || !item.img) return;
    item.animT = (item.animT || 0) + dt;
    const idx = Math.floor(item.animT / MESO_FRAME_SEC) % item.mesoFrames.length;
    if (idx !== item.animFrame) {
      item.animFrame = idx;
      item.img.src = item.mesoFrames[idx];
    }
  }

  function destroyItem(item) {
    if (!item) return;
    item.el?.remove();
    const idx = items.indexOf(item);
    if (idx >= 0) items.splice(idx, 1);
    if (!items.length) stopLoop();
  }

  function trimOldestIfNeeded(need) {
    while (items.length + need > MAX_ON_FIELD) {
      const oldest = items.find((it) => it.state !== STATE.LOOTING);
      if (!oldest) break;
      // 超過場上上限：強制撿取入包，不再直接刪除
      finishLoot(oldest);
    }
  }

  function resolveLandXs(originX, count, spacing = LAND_SPACING) {
    const n = Math.max(1, Math.floor(Number(count) || 1));
    const stageW = Math.max(120, Number(stageEl?.clientWidth) || 720);
    const margin = LAND_MARGIN;
    const maxSpan = Math.max(0, stageW - margin * 2);
    let gap = Math.max(1, Number(spacing) || LAND_SPACING);
    if (n > 1 && (n - 1) * gap > maxSpan) {
      gap = maxSpan / (n - 1);
    }
    const half = ((n - 1) / 2) * gap;
    let center = Number.isFinite(originX) ? originX : stageW / 2;
    center = Math.min(Math.max(center, margin + half), stageW - margin - half);
    if (!(center >= margin && center <= stageW - margin)) {
      center = stageW / 2;
    }
    const xs = [];
    for (let i = 0; i < n; i += 1) {
      xs.push(center + (i - (n - 1) / 2) * gap);
    }
    return xs;
  }

  function flightTimeToGround(originY, groundY, vY0) {
    const dy = (Number.isFinite(groundY) ? groundY : 390) - (Number.isFinite(originY) ? originY : 350);
    const a = 0.5 * GRAVITY;
    const b = Number(vY0) || VY0;
    const c = -Math.max(1, dy);
    const disc = b * b - 4 * a * c;
    if (!(disc >= 0)) return 0.7;
    const t = (-b + Math.sqrt(disc)) / (2 * a);
    return Math.max(0.2, t);
  }

  function bounceAirTime(vY) {
    return Math.max(0.1, (2 * Math.abs(Number(vY) || 0)) / GRAVITY);
  }

  function steerVxToward(item, targetX) {
    if (!Number.isFinite(targetX)) return;
    const airT = bounceAirTime(item.vY);
    item.vX = (targetX - item.x) / airT;
  }

  function createEntity(row, origin, groundY, index, count, landX, nearX) {
    const layer = ensureLayer();
    if (!layer) return null;

    // 先飛向較密的首落點，彈跳時再往外到最終等距
    const ox = Number(origin?.x) || 360;
    const oy = Number(origin?.y) || 300;
    const gy = Number.isFinite(groundY) ? groundY : (Number(origin?.y) || 390);
    const finalX = Number.isFinite(landX) ? landX : ox;
    const firstX = Number.isFinite(nearX) ? nearX : (ox + (finalX - ox) * 0.6);
    const t0 = flightTimeToGround(oy, gy, VY0);
    const vX = (firstX - ox) / t0;
    const vY = VY0;

    const el = document.createElement('div');
    el.className = 'idle-drop-item';
    if (row.kind === 'meso') el.classList.add('is-meso');
    el.dataset.dropId = String(nextId);
    const img = document.createElement('img');
    img.alt = dropName(row);
    img.draggable = false;

    let mesoFrames = null;
    if (row.kind === 'meso') {
      const mid = mesoIdForAmount(row.amount);
      mesoFrames = mesoFrameUrls(mid);
      img.src = mesoFrames[0];
    } else {
      img.src = resolveDropIcon(row);
      img.addEventListener('error', () => {
        const id = String(row.itemId || row.id || '').trim();
        const fallback = row.icon
          || (row.kind === 'equip' && id ? `images/equip/${id}.png` : '')
          || '';
        if (fallback && img.getAttribute('src') !== fallback) img.src = fallback;
      }, { once: true });
    }
    el.appendChild(img);
    const qty = dropQty(row);
    if (row.kind !== 'meso' && row.kind !== 'equip' && qty > 1) {
      const badge = document.createElement('span');
      badge.className = 'idle-drop-qty';
      badge.textContent = String(qty);
      el.appendChild(badge);
    }

    const item = {
      id: nextId++,
      row: { ...row },
      el,
      img,
      state: STATE.SPAWNING,
      x: ox,
      y: oy,
      vX,
      vY,
      nearX: firstX,
      landX: finalX,
      groundY: gy,
      bounceLeft: BOUNCE_COUNT,
      floatT: Math.random() * FLOAT_PERIOD,
      floatBaseY: 0,
      spawnAge: 0,
      lootAfter: Math.max(0, Number(lootDelaySec) || 0),
      opacity: 1,
      lootT: 0,
      lootDur: LOOT_DUR,
      lootFrom: null,
      lootTo: null,
      lootCtrl: null,
      mesoFrames,
      animT: Math.random() * MESO_FRAME_SEC,
      animFrame: 0,
    };
    syncDom(item);
    return item;
  }

  function beginLoot(item) {
    const from = { x: item.x, y: item.y };
    const to = playerPoint();
    const midX = (from.x + to.x) / 2;
    const midY = Math.min(from.y, to.y) - 80 - Math.random() * 40;
    item.state = STATE.LOOTING;
    item.lootT = 0;
    item.lootFrom = from;
    item.lootTo = to;
    item.lootCtrl = { x: midX, y: midY };
    item.opacity = 1;
  }

  function bez2(a, b, c, t) {
    const u = 1 - t;
    return u * u * a + 2 * u * t * b + t * t * c;
  }

  function notifyGrantItem(row, result) {
    if (!result?.ok || result.bag === 'meso') return;
    if (typeof onGrantItem !== 'function') return;
    const amt = Number(result.amount) > 0
      ? Math.floor(Number(result.amount))
      : dropQty(row);
    onGrantItem({
      name: result.name || dropBaseName(row),
      amount: Math.max(1, amt),
      bag: result.bag || '',
      row,
    });
  }

  function grantRow(row) {
    if (row?.kind === 'meso') {
      const amt = Math.max(0, Math.floor(Number(row.amount) || 0));
      if (amt > 0 && typeof onGrantMeso === 'function') onGrantMeso(amt);
      return { ok: amt > 0, name: dropName(row), bag: 'meso', amount: amt };
    }
    if (typeof InventoryModule !== 'undefined' && InventoryModule.applyIdleDrop) {
      const result = InventoryModule.applyIdleDrop(row, { logTag: '放置', silent: true }) || { ok: false, name: dropName(row) };
      notifyGrantItem(row, result);
      return result;
    }
    return { ok: false, name: dropName(row) };
  }

  function finishLoot(item) {
    const row = item.row;
    const result = grantRow(row);
    const name = result.name || dropName(row);
    if (result.ok) {
      if (result.bag === 'meso') {
        setLastDrop(`${name}`);
      } else {
        const bag = result.bag === 'equip' ? '裝備欄' : (result.bag === 'etc' ? '其他欄' : '消耗欄');
        setLastDrop(`${name} → ${bag}`);
      }
    } else {
      setLastDrop(`${name}（無法放入）`);
    }
    destroyItem(item);
  }

  function tickSpawning(item, dt) {
    item.vY += GRAVITY * dt;
    item.x += item.vX * dt;
    item.y += item.vY * dt;
    if (item.y >= item.groundY) {
      item.y = item.groundY;
      if (item.bounceLeft > 0) {
        item.bounceLeft -= 1;
        item.vY = -Math.abs(item.vY) * BOUNCE_RESTITUTION;
        // 彈起時往最終等距位置外推（不再 vX*=0.7 造成過頭再被拉回）
        steerVxToward(item, item.landX);
        if (Math.abs(item.vY) < SETTLE_VY) item.bounceLeft = 0;
      }
      if (item.bounceLeft <= 0) {
        item.vX = 0;
        item.vY = 0;
        if (Number.isFinite(item.landX)) item.x = item.landX;
        item.y = item.groundY;
        item.floatBaseY = item.groundY;
        item.state = STATE.FLOATING;
      }
    }
  }

  function tickFloating(item, dt) {
    item.floatT += dt;
    const w = (Math.PI * 2) / FLOAT_PERIOD;
    item.y = item.floatBaseY + FLOAT_AMP * Math.sin(item.floatT * w);
  }

  function tickLooting(item, dt) {
    item.lootT += dt;
    const t = Math.min(1, item.lootT / item.lootDur);
    const ease = t * t * (3 - 2 * t);
    const f = item.lootFrom;
    const c = item.lootCtrl;
    const to = item.lootTo;
    item.x = bez2(f.x, c.x, to.x, ease);
    item.y = bez2(f.y, c.y, to.y, ease);
    item.opacity = 1 - ease;
    if (t >= 1) finishLoot(item);
  }

  function canAcceptRow(row) {
    if (row?.kind === 'meso') return true;
    if (typeof InventoryModule !== 'undefined' && InventoryModule.canAcceptIdleDrop) {
      return InventoryModule.canAcceptIdleDrop(row);
    }
    return true;
  }

  function tryStartLootPass() {
    const delay = Math.max(0, Number(lootDelaySec) || 0);
    const floating = items.filter((it) => (
      it.state === STATE.FLOATING
      && Number(it.spawnAge) >= delay
      && Number(it.spawnAge) >= Math.max(0, Number(it.lootAfter) || 0)
    ));
    if (!floating.length) return;

    const sim = { equipTaken: 0, etcTaken: 0, consumeTaken: 0 };
    const countEmpty = (arr) => {
      if (!arr) return 0;
      let n = 0;
      for (let i = 0; i < arr.length; i += 1) {
        if (!arr[i]) n += 1;
      }
      return n;
    };
    const freeEquip = countEmpty(typeof playerInventoryEquip !== 'undefined' ? playerInventoryEquip : null);
    const freeEtc = countEmpty(typeof playerInventoryEtc !== 'undefined' ? playerInventoryEtc : null);
    const freeConsume = countEmpty(typeof playerInventoryConsume !== 'undefined' ? playerInventoryConsume : null);

    const acceptSim = (row) => {
      if (!canAcceptRow(row)) return false;
      if (row.kind === 'meso') return true;
      if (row.kind === 'equip') {
        if (sim.equipTaken >= freeEquip) return false;
        sim.equipTaken += 1;
        return true;
      }
      if (row.kind === 'etc' || row.bag === 'etc') {
        const id = String(row.itemId || '');
        const hasStack = typeof playerInventoryEtc !== 'undefined'
          && playerInventoryEtc.some((e) => e && String(e.itemId) === id);
        if (hasStack) return true;
        if (freeEtc - sim.etcTaken <= 0) return false;
        sim.etcTaken += 1;
        return true;
      }
      if (typeof InventoryModule !== 'undefined' && InventoryModule.consumeDropNeedsNewSlot?.(row)) {
        if (freeConsume - sim.consumeTaken <= 0) return false;
        sim.consumeTaken += 1;
      }
      return true;
    };

    floating.forEach((it) => {
      if (acceptSim(it.row)) beginLoot(it);
    });
  }

  function update(dt) {
    const step = Math.max(0, Number(dt) || 0);
    if (!(step > 0)) return;
    if (!items.length) {
      lootAccum = 0;
      return;
    }

    lootAccum += step;
    if (lootAccum >= LOOT_INTERVAL) {
      lootAccum = 0;
      tryStartLootPass();
    }

    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i];
      item.spawnAge += step;
      if (item.state !== STATE.LOOTING && item.spawnAge >= DESPAWN_AGE) {
        destroyItem(item);
        continue;
      }
      if (item.mesoFrames) tickMesoAnim(item, step);
      if (item.state === STATE.SPAWNING) tickSpawning(item, step);
      else if (item.state === STATE.FLOATING) tickFloating(item, step);
      else if (item.state === STATE.LOOTING) tickLooting(item, step);
      if (item.el?.isConnected) syncDom(item);
    }
  }

  function loop(ts) {
    rafId = window.requestAnimationFrame(loop);
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, Math.max(0, (ts - lastTs) / 1000));
    lastTs = ts;
    update(dt);
  }

  function startLoop() {
    if (rafId != null) return;
    lastTs = 0;
    rafId = window.requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId != null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTs = 0;
  }

  function init(stage, opts = {}) {
    if (stageEl !== stage) {
      layerEl = null;
      cachedPlayerPoint = null;
    }
    stageEl = stage || null;
    onDropText = typeof opts.onDropText === 'function' ? opts.onDropText : null;
    onGrantMeso = typeof opts.onGrantMeso === 'function' ? opts.onGrantMeso : null;
    onGrantItem = typeof opts.onGrantItem === 'function' ? opts.onGrantItem : null;
    lootDelaySec = Math.max(0, Number(opts.lootDelaySec) || 0);
    ensureLayer();
    startLoop();
  }

  function expandSpawnRows(rows) {
    const out = [];
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (!row) return;
      if (row.kind === 'equip') {
        const n = dropQty(row);
        for (let i = 0; i < n; i += 1) {
          out.push({ ...row, amount: 1 });
        }
        return;
      }
      out.push({ ...row });
    });
    return out;
  }

  function spawnBatch({ origin, rows, groundY, lootDelaySec: batchDelay } = {}) {
    const list = expandSpawnRows(rows);
    if (!list.length) return;
    ensureLayer();
    trimOldestIfNeeded(list.length);
    const cx = Number(origin?.x);
    const cy = Number(origin?.y);
    const gy = Number.isFinite(groundY)
      ? groundY
      : (Number.isFinite(cy) ? cy : 390);
    // origin = 怪物死亡位置（散開中心）；生成點略抬高做拋物線
    const ox = {
      x: Number.isFinite(cx) ? cx : 360,
      y: (Number.isFinite(cy) ? cy : gy) - 40,
    };
    if (ox.y > gy - 20) ox.y = gy - 20;
    const delayOverride = batchDelay != null
      ? Math.max(0, Number(batchDelay) || 0)
      : null;
    const landXs = resolveLandXs(ox.x, list.length, LAND_SPACING);
    const nearXs = resolveLandXs(ox.x, list.length, FIRST_LAND_SPACING);
    const layer = ensureLayer();
    const frag = document.createDocumentFragment();
    list.forEach((row, i) => {
      const ent = createEntity(row, ox, gy, i, list.length, landXs[i], nearXs[i]);
      if (ent) {
        if (delayOverride != null) ent.lootAfter = delayOverride;
        if (ent.el) frag.appendChild(ent.el);
        items.push(ent);
      }
    });
    if (layer && frag.childNodes.length) layer.appendChild(frag);
    startLoop();
  }

  function clear({ grantPending = false } = {}) {
    const pending = [...items];
    items = [];
    lootAccum = 0;
    stopLoop();
    const parts = [];
    pending.forEach((item) => {
      if (grantPending) {
        if (item.row?.kind === 'meso' || canAcceptRow(item.row)) {
          const result = grantRow(item.row);
          if (result?.ok) {
            if (result.bag === 'meso') parts.push(result.name);
            else {
              const bag = result.bag === 'equip' ? '裝備欄' : (result.bag === 'etc' ? '其他欄' : '消耗欄');
              parts.push(`${result.name} → ${bag}`);
            }
          }
        }
      }
      item.el?.remove();
    });
    if (parts.length) setLastDrop(parts.join('、'));
    layerEl?.replaceChildren?.();
  }

  function getLastDropText() {
    return lastDropText;
  }

  return {
    init,
    spawnBatch,
    update,
    clear,
    getLastDropText,
    resolveDropIcon,
    dropName,
    dropBaseName,
    mesoIdForAmount,
    STATE,
  };
})();

if (typeof window !== 'undefined') {
  window.ItemDropController = ItemDropController;
}
