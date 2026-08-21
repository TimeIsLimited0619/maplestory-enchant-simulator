/**
 * 裝備／設定分享碼（gzip + base64url，前綴 MSS1-）
 */
const SHARE_CODE_PREFIX = 'MSS1-';
const SHARE_CODE_VERSION = 1;

function shareCodeBase64UrlEncode(bytes) {
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function shareCodeBase64UrlDecode(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function shareCodeCompress(text) {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([new TextEncoder().encode(text)]).stream()
    .pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function shareCodeDecompress(bytes) {
  if (typeof DecompressionStream === 'undefined') return null;
  const stream = new Blob([bytes]).stream()
    .pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

async function encodeShareCode(payload) {
  const json = JSON.stringify(payload);
  const compressed = await shareCodeCompress(json);
  if (compressed) {
    return `${SHARE_CODE_PREFIX}${shareCodeBase64UrlEncode(compressed)}`;
  }
  return `${SHARE_CODE_PREFIX}${shareCodeBase64UrlEncode(new TextEncoder().encode(json))}`;
}

async function decodeShareCode(code) {
  const raw = String(code || '').trim();
  if (!raw.startsWith(SHARE_CODE_PREFIX)) {
    throw new Error('分享碼格式不正確（需以 MSS1- 開頭）');
  }
  const body = raw.slice(SHARE_CODE_PREFIX.length);
  const bytes = shareCodeBase64UrlDecode(body);
  let json = await shareCodeDecompress(bytes);
  if (!json) {
    json = new TextDecoder().decode(bytes);
  }
  const data = JSON.parse(json);
  if (!data || typeof data !== 'object') throw new Error('分享碼內容無效');
  if (data.v !== SHARE_CODE_VERSION && data.version !== SHARE_CODE_VERSION) {
    throw new Error('不支援的分享碼版本');
  }
  return data;
}

function shareCodeCollectAutoSettings() {
  const cat = document.getElementById('actionCategory')?.value || 'star';
  const auto = { category: cat };

  if (cat === 'potential' && typeof AutoEnchantPotentialModule !== 'undefined') {
    auto.potential = {
      groupTargets: JSON.parse(JSON.stringify(AutoEnchantPotentialModule.groupTargets || [])),
      overspeedMode: !!AutoEnchantPotentialModule.overspeedMode,
      cubeId: PotentialModule?.selectedCubeId || null,
    };
  } else if (cat === 'additionalPotential' && typeof AutoEnchantAddPotentialModule !== 'undefined') {
    auto.additionalPotential = {
      groupTargets: JSON.parse(JSON.stringify(AutoEnchantAddPotentialModule.groupTargets || [])),
      overspeedMode: !!AutoEnchantAddPotentialModule.overspeedMode,
      cubeId: AddPotentialModule?.selectedCubeId || null,
    };
  } else if (cat === 'bonusStat' && typeof AutoEnchantBonusStatModule !== 'undefined') {
    auto.bonusStat = {
      groupTargets: JSON.parse(JSON.stringify(AutoEnchantBonusStatModule.groupTargets || [])),
      tierSelectMode: !!AutoEnchantBonusStatModule.tierSelectMode,
      overspeedMode: !!AutoEnchantBonusStatModule.overspeedMode,
    };
  } else if (cat === 'star' && typeof AutoEnchantStarForceModule !== 'undefined') {
    auto.starForce = {
      targetStar: AutoEnchantStarForceModule.targetStar || 0,
      protectDestroy: { ...AutoEnchantStarForceModule.protectDestroy },
    };
  }
  return auto;
}

function shareCodeApplyAutoSettings(auto) {
  if (!auto || typeof auto !== 'object') return;

  if (auto.potential && typeof AutoEnchantPotentialModule !== 'undefined') {
    AutoEnchantPotentialModule.groupTargets = JSON.parse(JSON.stringify(auto.potential.groupTargets || []));
    AutoEnchantPotentialModule.overspeedMode = !!auto.potential.overspeedMode;
    if (auto.potential.cubeId && typeof PotentialModule !== 'undefined') {
      PotentialModule.selectCube?.(auto.potential.cubeId);
    }
    AutoEnchantPotentialModule.render?.();
  }

  if (auto.additionalPotential && typeof AutoEnchantAddPotentialModule !== 'undefined') {
    AutoEnchantAddPotentialModule.groupTargets = JSON.parse(JSON.stringify(auto.additionalPotential.groupTargets || []));
    AutoEnchantAddPotentialModule.overspeedMode = !!auto.additionalPotential.overspeedMode;
    if (auto.additionalPotential.cubeId && typeof AddPotentialModule !== 'undefined') {
      AddPotentialModule.selectCube?.(auto.additionalPotential.cubeId);
    }
    AutoEnchantAddPotentialModule.render?.();
  }

  if (auto.bonusStat && typeof AutoEnchantBonusStatModule !== 'undefined') {
    AutoEnchantBonusStatModule.groupTargets = JSON.parse(JSON.stringify(auto.bonusStat.groupTargets || []));
    AutoEnchantBonusStatModule.tierSelectMode = auto.bonusStat.tierSelectMode !== false;
    AutoEnchantBonusStatModule.overspeedMode = !!auto.bonusStat.overspeedMode;
    AutoEnchantBonusStatModule.render?.();
  }

  if (auto.starForce && typeof AutoEnchantStarForceModule !== 'undefined') {
    AutoEnchantStarForceModule.targetStar = Number(auto.starForce.targetStar) || AutoEnchantStarForceModule.targetStar;
    AutoEnchantStarForceModule.protectDestroy = {
      ...AutoEnchantStarForceModule.protectDestroy,
      ...(auto.starForce.protectDestroy || {}),
    };
    AutoEnchantStarForceModule.render?.();
  }

  const cat = auto.category;
  if (cat && document.getElementById('actionCategory')) {
    document.getElementById('actionCategory').value = cat;
    document.getElementById('actionCategory').dispatchEvent(new Event('change'));
  }
}

function buildEquipSharePayload(options = {}) {
  if (typeof currentEnchantItem === 'undefined' || !currentEnchantItem) return null;

  const itemId = currentEnchantItem.itemId || currentEnchantItem.id;
  const state = typeof cloneEnchantState === 'function'
    ? cloneEnchantState(currentEnchantItem)
    : JSON.parse(JSON.stringify(currentEnchantItem));
  delete state.slotIndex;

  const payload = {
    v: SHARE_CODE_VERSION,
    itemId,
    itemName: currentEnchantItem.name || itemId,
    state,
  };

  if (options.includeAuto !== false) {
    payload.auto = shareCodeCollectAutoSettings();
  }
  if (options.includePrices && typeof CostTrackerModule !== 'undefined') {
    payload.prices = { ...CostTrackerModule.prices };
    payload.priceUnitMode = CostTrackerModule.priceUnitMode;
  }
  return payload;
}

async function importSharePayload(data, options = {}) {
  if (!data?.itemId || !data?.state) {
    throw new Error('分享碼缺少裝備資料');
  }
  if (typeof loadEnchantItemHeld !== 'function') {
    throw new Error('無法載入裝備');
  }

  const ok = loadEnchantItemHeld(data.itemId, data.state);
  if (!ok) throw new Error(`找不到裝備：${data.itemId}`);

  if (data.prices && typeof CostTrackerModule !== 'undefined') {
    Object.assign(CostTrackerModule.prices, data.prices);
    if (data.priceUnitMode) CostTrackerModule.priceUnitMode = data.priceUnitMode;
    CostTrackerModule.syncLegacyPriceInputs?.();
    CostTrackerModule.refreshCostDisplay?.();
  }

  if (options.applyAuto !== false && data.auto) {
    shareCodeApplyAutoSettings(data.auto);
  }

  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave?.();
  }
  if (typeof updateStatusPanel === 'function') updateStatusPanel();
  if (typeof calculateCost === 'function') calculateCost();

  return {
    itemId: data.itemId,
    itemName: data.itemName || data.itemId,
  };
}

async function importShareCode(code, options = {}) {
  const data = await decodeShareCode(code);
  return importSharePayload(data, options);
}
