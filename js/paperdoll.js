/**
 * MapleStory 紙娃娃：依 zmap 疊圖，navel/neck/brow/hand 對齊。
 * 暫停 stand1、攻擊 swingT1（沒有則 swingO1）。
 */
const Paperdoll = (() => {
  const MAP_KEYS = ['navel', 'neck', 'brow', 'hand'];
  const hosts = new Set();
  /** 各舞台獨立幀時脈，避免狩獵 swing 帶快跑裝備／商店 stand */
  const hostAnim = new WeakMap();
  let raf = 0;
  /** 強制揮砍截止（performance.now），技能施放時對齊 actionDelay */
  let forceSwingUntil = 0;
  /** 揮砍一輪目標時長（ms，已含攻速）；0 = 用普攻武器 delay */
  let swingTargetOverrideMs = 0;
  /** 強制播放的動作名（技能 action／後備揮砍） */
  let forceActionName = '';
  /** 本次／上一段普攻已抽中的動作（避免每幀重抽） */
  let basicAttackPick = '';
  /**
   * 技能 instruction 播放狀態（來源 Character.00002000）
   * @type {null | { name: string, steps: object[], index: number, stepStarted: number, until: number }}
   */
  let instructionPlay = null;
  /** 接技連段中：instruction 結束不清除 move，避免空中位移被瞬間拉回 */
  let comboMoveHold = false;

  function animOf(host) {
    let s = hostAnim.get(host);
    if (!s) {
      s = { frameIndex: 0, frameStarted: 0, lastDelay: 180, action: '' };
      hostAnim.set(host, s);
    }
    return s;
  }

  function data() {
    return (typeof PAPERDOLL_DATA !== 'undefined') ? PAPERDOLL_DATA : null;
  }

  function zIndexFor(z) {
    const zmap = data()?.zmap || [];
    const i = zmap.indexOf(z);
    if (i < 0) return 50;
    return zmap.length - i;
  }

  function itemRecord(id) {
    return data()?.items?.[id] || null;
  }

  /** 技能 WZ action → 紙娃娃可用動作候選（WZ 無專屬幀時往後備） */
  const SKILL_ACTION_FALLBACKS = {
    slashBlast: ['slashBlast', 'swingT2', 'swingT1', 'swingO1'],
    slashBlast2: ['slashBlast2', 'slashBlast', 'swingT3', 'swingT2', 'swingT1'],
    LeapAttack: ['LeapAttack', 'stabT1', 'jump', 'swingT3', 'swingT1'],
    LeapAttack2: ['LeapAttack2', 'LeapAttack', 'stabT2', 'jump', 'swingT2', 'swingT1'],
  };

  /** 雙手 ↔ 單手 同幀系對應（instruction 用 swingT* 時單手武改播 swingO*） */
  const ACTION_HAND_PAIR = {
    swingT1: 'swingO1',
    swingT2: 'swingO2',
    swingT3: 'swingO3',
    swingTF: 'swingOF',
    swingO1: 'swingT1',
    swingO2: 'swingT2',
    swingO3: 'swingT3',
    swingOF: 'swingTF',
    stabT1: 'stabO1',
    stabT2: 'stabO2',
    stabTF: 'stabOF',
    stabO1: 'stabT1',
    stabO2: 'stabT2',
    stabOF: 'stabTF',
    stand2: 'stand1',
    stand1: 'stand2',
    walk2: 'walk1',
    walk1: 'walk2',
  };

  const ATTACK_ACTION_RE = /^(swing|stab|slash|Leap|shoot|alert|heal|jump)/i;

  /** 技能 instruction 以 blink 隱藏角色本體（騰空踢擊／憤怒天使等） */
  const HIDE_BODY_ACTIONS = new Set(['blink', 'hide', 'hideBody']);

  function isAttackActionName(action) {
    return ATTACK_ACTION_RE.test(String(action || ''));
  }

  function isHideBodyAction(action) {
    return HIDE_BODY_ACTIONS.has(String(action || ''));
  }

  function setHuntBodyHidden(host, hidden) {
    if (!host || host.getAttribute('data-paperdoll') !== 'hunt') return;
    host.classList.toggle('is-paperdoll-body-hidden', !!hidden);
  }

  function wornWeaponId(itemIds) {
    const ids = itemIds || wornItemIds();
    return ids.find((id) => {
      const slot = itemRecord(id)?.info?.islot
        || (typeof getItemData === 'function' ? getItemData(id)?.islot : '');
      return String(slot).startsWith('Wp');
    }) || '';
  }

  function weaponHandKind(weaponId) {
    const acts = itemRecord(weaponId)?.actions || {};
    const two = !!(acts.swingT1 || acts.swingT2 || acts.swingT3 || acts.swingTF);
    const one = !!(acts.swingO1 || acts.swingO2 || acts.swingO3 || acts.swingOF);
    if (two && !one) return 'two';
    if (one && !two) return 'one';
    if (two) return 'two';
    if (one) return 'one';
    return 'unknown';
  }

  /**
   * 依裝備武器單／雙手，挑選技能 actions[0] 或 actions[1]
   *（slashBlast=雙手系、slashBlast2=單手系，對齊 MapleSalon2 handType）
   */
  function resolveSkillActionName(actions) {
    const list = (Array.isArray(actions) ? actions : [])
      .map((a) => String(a || '').trim())
      .filter(Boolean);
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    const hand = weaponHandKind(wornWeaponId());
    if (hand === 'one') return list[1] || list[0];
    return list[0];
  }

  function combatContext() {
    const jobName = typeof CharacterCombatPanel !== 'undefined'
      ? CharacterCombatPanel.getState?.()?.jobName
      : '';
    const getWorn = typeof UiEquipModule !== 'undefined'
      ? (slotId) => UiEquipModule.getWornEntry?.(slotId)
      : null;
    return { jobName, getWorn };
  }

  function basicAttackActionCandidates(itemIds) {
    const hand = weaponHandKind(wornWeaponId(itemIds));
    let list = [];
    if (typeof WeaponTypeMap !== 'undefined' && typeof WeaponTypeMap.getBasicAttackActions === 'function') {
      const { getWorn, jobName } = combatContext();
      list = WeaponTypeMap.getBasicAttackActions(getWorn, jobName);
    }
    if (!list.length) {
      list = hand === 'one'
        ? ['swingO1', 'swingO2', 'stabO1', 'stabO2']
        : hand === 'two'
          ? ['swingT1', 'swingT2', 'stabT1', 'stabT2']
          : (WeaponTypeMap?.DEFAULT_BASIC_ATTACK_ACTIONS || ['swingT1', 'swingO1', 'swingT2', 'stabT1']).slice();
    }
    if (hand === 'one') {
      const preferred = list.filter((a) => /^(swingO|stabO|shoot|swingP)/i.test(String(a)));
      const rest = list.filter((a) => !preferred.includes(a));
      list = preferred.length ? preferred.concat(rest) : list;
    } else if (hand === 'two') {
      const preferred = list.filter((a) => /^(swingT|stabT|shoot|swingP)/i.test(String(a)));
      const rest = list.filter((a) => !preferred.includes(a));
      list = preferred.length ? preferred.concat(rest) : list;
    }
    return list;
  }

  function availableBasicAttackActions(itemIds) {
    return basicAttackActionCandidates(itemIds).filter((name) => lookHasAction(itemIds, name));
  }

  /**
   * 從武器普攻池隨機抽一個（對齊 MS：單手劍 swingO1/O2/O3 等，非固定 swingO1）
   */
  function pickBasicAttackAction(itemIds) {
    let available = availableBasicAttackActions(itemIds);
    // 武器池標了 shoot* 但紙娃娃缺幀時，退回常見 swing，避免卡 stand1
    if (!available.length) {
      const fallback = ['swingT1', 'swingO1', 'swingT2', 'swingO2', 'stabT1', 'stabO1']
        .filter((name) => lookHasAction(itemIds, name));
      available = fallback;
    }
    if (!available.length) {
      basicAttackPick = '';
      return 'stand1';
    }
    if (available.length === 1) {
      basicAttackPick = available[0];
      return basicAttackPick;
    }
    let pick = available[Math.floor(Math.random() * available.length)];
    let guard = 0;
    while (pick === basicAttackPick && guard < 8) {
      pick = available[Math.floor(Math.random() * available.length)];
      guard += 1;
    }
    basicAttackPick = pick;
    return basicAttackPick;
  }

  /** 回傳目前已抽中的普攻動作；必要時才重抽 */
  function resolveBasicAttackAction(itemIds) {
    if (basicAttackPick && lookHasAction(itemIds, basicAttackPick)) return basicAttackPick;
    return pickBasicAttackAction(itemIds);
  }

  function lookHasAction(itemIds, action) {
    if (!action) return false;
    const skinId = data()?.defaults?.skin;
    if (itemRecord(skinId)?.actions?.[action]?.frames?.length) return true;
    return (itemIds || []).some((id) => itemRecord(id)?.actions?.[action]?.frames?.length);
  }

  /** 依技能指定動作與裝備／皮膚實際有的幀，挑出紙娃娃要播的 action 名 */
  function resolveHuntAction(itemIds, preferredAction) {
    const preferred = String(preferredAction || '').trim();
    const candidates = [];
    if (preferred) {
      const mapped = SKILL_ACTION_FALLBACKS[preferred] || [preferred];
      mapped.forEach((a) => {
        if (a && !candidates.includes(a)) candidates.push(a);
      });
    } else {
      basicAttackActionCandidates(itemIds).forEach((a) => {
        if (a && !candidates.includes(a)) candidates.push(a);
      });
    }
    for (const name of candidates) {
      if (lookHasAction(itemIds, name)) return name;
    }
    return pickAction(itemIds, true);
  }

  function pickAction(itemIds, preferSwing) {
    if (!preferSwing) return 'stand1';
    return resolveHuntAction(itemIds, '');
  }

  function actionFrames(id, action) {
    const rec = itemRecord(id);
    if (!rec?.actions) return null;
    if (rec.actions[action]?.frames?.length) return rec.actions[action];

    // 單／雙手同系對應（避免 swingT2 身體 + stand1 武器）
    const pair = ACTION_HAND_PAIR[action];
    if (pair && rec.actions[pair]?.frames?.length) return rec.actions[pair];

    // 缺專屬幀時：同系揮砍 → stand（避免完全空白）
    const fallbacks = SKILL_ACTION_FALLBACKS[action]
      || (String(action).startsWith('swingT') ? ['swingT1', 'swingO2', 'swingO1'] : null)
      || (String(action).startsWith('swingO') ? ['swingO1', 'swingT2', 'swingT1'] : null)
      || (String(action).startsWith('stabT') ? ['stabT1', 'stabO1', 'swingT1', 'swingO1'] : null)
      || (String(action).startsWith('stabO') ? ['stabO1', 'stabT1', 'swingO1', 'swingT1'] : null)
      || ['swingT1', 'swingO1'];
    for (const fb of fallbacks) {
      if (fb !== action && rec.actions[fb]?.frames?.length) return rec.actions[fb];
    }
    return rec.actions.stand1
      || rec.actions.default
      || rec.actions.front
      || null;
  }

  function wornItemIds() {
    const ids = [];
    if (typeof UiEquipModule !== 'undefined' && typeof UiEquipModule.getActiveWearEntries === 'function') {
      UiEquipModule.getActiveWearEntries().forEach((row) => {
        if (row?.itemId) ids.push(row.itemId);
      });
    }
    return ids;
  }

  function itemInfo(id) {
    if (typeof getItemData === 'function') {
      const it = getItemData(id);
      if (it) return it;
    }
    return itemRecord(id)?.info || null;
  }

  /** 對應 Journey／maplestory-wasm CharEquips::getcaptype() 的多段髮型覆蓋標記 */
  const CAP_HALF_COVER_MARKERS = ['H1', 'H2', 'H3', 'H4', 'H6', 'Hd', 'Hf', 'Hs', 'Hb', 'Hc', 'Hx'];

  /**
   * 帽子類型（決定哪些髮層可見）
   * - headband：僅 H5（髮帶／頭箍），保留全部髮層，帽在髮下
   * - halfcover：CpH1H5 等一般帽，隱藏 hairOverHead；帽 z 低於 hair 時另藏前髮
   * - fullcover：含 Ay／As 的全罩帽，隱藏 hairOverHead 與前髮 hair
   */
  function getCapType(vslot) {
    const s = String(vslot || '');
    if (!s) return 'none';
    const coversHairSections = CAP_HALF_COVER_MARKERS.some((m) => s.includes(m));
    const hasH5 = s.includes('H5');
    const fullFaceCover = s.includes('Ay') || s.includes('As');
    if (coversHairSections) {
      return fullFaceCover ? 'fullcover' : 'halfcover';
    }
    if (hasH5) return 'headband';
    return 'halfcover';
  }

  function wornCapId(wornIds) {
    for (const id of wornIds) {
      const it = itemInfo(id);
      if (it?.islot === 'Cp') return id;
    }
    return null;
  }

  /** 正面帽圖層（不含 backCap）；僅這些低於 hair 時才需藏前髮 */
  const FRONT_CAP_Z_LAYERS = new Set([
    'cap',
    'capOverHair',
    'capBelowAccessory',
    'capAccessory',
    'capAccessoryBelowAccFace',
    'capAccessoryBelowBody',
  ]);

  /**
   * 正面帽圖層是否畫在前髮之下（如殘暴炎魔頭盔的 capBelowAccessory）。
   * zmap 下 hair 優先於 capBelowAccessory，若不藏前髮會蓋住帽子。
   * Journey 把未知 cap z 歸入 CAP 層並畫在 Hair::DEFAULT 之後，效果等同蓋住前髮。
   * 勿把 backCap 算進來，否則一般帽也會被誤判。
   */
  function capDrawsBelowFrontHair(capId, action, frameNo) {
    if (!capId) return false;
    const hairPri = zIndexFor('hair');
    const belowHair = (parts) => (parts || []).some((p) => {
      if (!p?.z || !FRONT_CAP_Z_LAYERS.has(p.z)) return false;
      return zIndexFor(p.z) < hairPri;
    });

    const pack = actionFrames(capId, action);
    if (pack?.frames?.length) {
      const frame = pack.frames[frameNo % pack.frames.length];
      if (belowHair(frame?.parts)) return true;
    }

    const acts = itemRecord(capId)?.actions || {};
    for (const a of Object.values(acts)) {
      for (const fr of (a.frames || [])) {
        if (belowHair(fr?.parts)) return true;
      }
    }
    return false;
  }

  /**
   * CharLook：halfcover／fullcover 不畫 hairOverHead；
   * fullcover 另不畫前髮 hair；
   * halfcover 且帽 z 低於 hair（capBelowAccessory）時也隱藏前髮。
   */
  function shouldHideHairLayer(z, capType, hideFrontHair) {
    if (!capType || capType === 'none' || capType === 'headband') return false;
    if (z === 'hairOverHead') return true;
    if (z === 'hair' && (capType === 'fullcover' || hideFrontHair)) return true;
    return false;
  }

  function lookIds() {
    const d = data()?.defaults || {};
    const worn = wornItemIds();
    const coat = worn.map((id) => (typeof getItemData === 'function' ? getItemData(id) : null))
      .find((it) => it?.islot === 'MaPn');
    const filtered = worn.filter((id) => {
      const it = typeof getItemData === 'function' ? getItemData(id) : itemRecord(id)?.info;
      if (!it) return true;
      if (coat && (it.islot === 'Pn' || it.vslot === 'Pn')) return false;
      return true;
    });
    return {
      skin: d.skin,
      head: d.head,
      hair: d.hair,
      face: d.face,
      worn: filtered,
    };
  }

  function collectPieces(action, frameNo) {
    const look = lookIds();
    const capId = wornCapId(look.worn);
    const capInfo = capId ? itemInfo(capId) : null;
    const capType = capInfo ? getCapType(capInfo.vslot) : 'none';
    const hideFrontHair = (capType === 'halfcover' || capType === 'fullcover')
      && capDrawsBelowFrontHair(capId, action, frameNo);
    const ids = [look.skin, look.head, look.hair, look.face].concat(look.worn);
    const pieces = [];
    ids.forEach((id) => {
      const pack = actionFrames(id, action);
      if (!pack?.frames?.length) return;
      const frame = pack.frames[frameNo % pack.frames.length];
      (frame?.parts || []).forEach((part) => {
        if (shouldHideHairLayer(part.z, capType, hideFrontHair)) return;
        pieces.push(part);
      });
    });
    return pieces;
  }

  function frameCount(action) {
    const look = lookIds();
    const pack = actionFrames(look.skin, action);
    return pack?.frames?.length || 1;
  }

  function weaponWzAttackSpeed() {
    if (typeof WeaponTypeMap === 'undefined'
      || typeof WeaponTypeMap.getEquippedWzAttackSpeed !== 'function') {
      return WeaponTypeMap?.DEFAULT_WZ_ATTACK_SPEED || 6;
    }
    const { getWorn, jobName } = combatContext();
    return WeaponTypeMap.getEquippedWzAttackSpeed(getWorn, jobName);
  }

  function attackActionDelayMs(baseDelay) {
    if (typeof WeaponTypeMap === 'undefined' || typeof WeaponTypeMap.calculateActionDelayMs !== 'function') {
      return Number(baseDelay) || 360;
    }
    const base = Number(baseDelay) > 0
      ? Number(baseDelay)
      : (Number(WeaponTypeMap.BASIC_ATTACK_BASE_DELAY_MS) || 360);
    return WeaponTypeMap.calculateActionDelayMs(
      base,
      weaponWzAttackSpeed(),
      WeaponTypeMap.getSpeedModifiers?.() || 0
    );
  }

  function wzCycleMs(action) {
    const look = lookIds();
    const frames = actionFrames(look.skin, action)?.frames || [];
    if (!frames.length) return 180;
    return frames.reduce((sum, f) => sum + (Number(f.delay) || 180), 0);
  }

  function frameDelay(action, frameNo) {
    const look = lookIds();
    const pack = actionFrames(look.skin, action);
    const frames = pack?.frames || [];
    const raw = Number(frames[frameNo % (frames.length || 1)]?.delay) || 180;
    if (!isAttackActionName(action)) return raw;
    const cycle = wzCycleMs(action) || 1;
    const now = performance.now();
    if (swingTargetOverrideMs > 0 && now >= forceSwingUntil) {
      swingTargetOverrideMs = 0;
    }
    const target = swingTargetOverrideMs > 0
      ? swingTargetOverrideMs
      : attackActionDelayMs();
    // 等比縮放到攻速視窗；勿強制 ≥30ms（否則短動作會被壓成連打空揮）
    return Math.max(1, Math.round(raw * (target / cycle)));
  }

  /**
   * 以身體 origin（腳底 stance）為固定錨點，navel／neck 等由 origin + map 推得。
   * 固定 navel 會讓 stand1 各幀腳底左右飄；固定 origin 才是原地晃動。
   */
  function layout(pieces, cx, cy) {
    const anchors = Object.create(null);
    const body = pieces.find((p) => p.z === 'body' || p.name === 'body');
    if (body?.map) {
      MAP_KEYS.forEach((k) => {
        if (!body.map[k]) return;
        anchors[k] = [cx + body.map[k][0], cy + body.map[k][1]];
      });
    }
    if (!anchors.navel) anchors.navel = [cx, cy];

    pieces.forEach((p) => {
      if (p === body) return;
      if (p.map?.hand && p.map?.navel && anchors.navel && !anchors.hand) {
        anchors.hand = [
          anchors.navel[0] - p.map.navel[0] + p.map.hand[0],
          anchors.navel[1] - p.map.navel[1] + p.map.hand[1],
        ];
      }
      if (p.map?.brow && anchors.neck && !anchors.brow && p.map.neck) {
        anchors.brow = [
          anchors.neck[0] - p.map.neck[0] + p.map.brow[0],
          anchors.neck[1] - p.map.neck[1] + p.map.brow[1],
        ];
      }
    });

    const placed = pieces.map((p) => {
      const ox = p.origin || [0, 0];
      if (p === body || (p.name === 'body' && p.z === 'body')) {
        return {
          src: p.src,
          z: p.z,
          left: Math.round(cx - ox[0]),
          top: Math.round(cy - ox[1]),
        };
      }
      let world = anchors.navel;
      let key = 'navel';
      for (const k of MAP_KEYS) {
        if (p.map?.[k] && anchors[k]) {
          world = anchors[k];
          key = k;
          break;
        }
      }
      const mx = p.map?.[key] || [0, 0];
      return {
        src: p.src,
        z: p.z,
        left: Math.round(world[0] - mx[0] - ox[0]),
        top: Math.round(world[1] - mx[1] - ox[1]),
      };
    }).sort((a, b) => zIndexFor(a.z) - zIndexFor(b.z));

    return {
      placed,
      navel: [Math.round(anchors.navel[0]), Math.round(anchors.navel[1])],
      feet: [cx, cy],
    };
  }

  function preferSwingNow() {
    // 僅在實際出招視窗內揮砍；勿因 isRunning 就持續播普攻（否則開場／空等會超高速空揮）
    return forceSwingUntil > 0 && performance.now() < forceSwingUntil;
  }

  function instructionMap() {
    return (typeof PAPERDOLL_ACTION_INSTRUCTIONS !== 'undefined'
      && PAPERDOLL_ACTION_INSTRUCTIONS
      && typeof PAPERDOLL_ACTION_INSTRUCTIONS === 'object')
      ? PAPERDOLL_ACTION_INSTRUCTIONS
      : null;
  }

  function getInstructions(actionName) {
    const name = String(actionName || '').trim();
    if (!name) return null;
    const map = instructionMap();
    const list = map?.[name];
    return Array.isArray(list) && list.length ? list : null;
  }

  function getInstructionDurationMs(actionName) {
    const list = getInstructions(actionName);
    if (!list) return 0;
    return list.reduce((sum, step) => sum + (Number(step?.delay) || 100), 0);
  }

  function applyInstructionMove(host, move, flip) {
    const layer = host?.querySelector?.(':scope > [data-paperdoll-layers]');
    if (!layer) return;
    const mx = Number(move?.[0]) || 0;
    const my = Number(move?.[1]) || 0;
    // 掛在紙娃娃本地座標：跟著 scaleX(-1) 轉向，move 方向與 WZ 一致
    let t = (mx || my) ? `translate(${mx}px, ${my}px)` : '';
    if (flip === 1) t = `${t} scaleX(-1)`.trim();
    layer.style.transform = t || '';
  }

  /** 無 move 欄位時沿用上一幀位移（接技空中銜接）；明確 [0,0] 才歸位 */
  function applyInstructionStepMove(host, step) {
    const layer = host?.querySelector?.(':scope > [data-paperdoll-layers]');
    if (!layer || !step) return;
    if (!Object.prototype.hasOwnProperty.call(step, 'move') || step.move == null) {
      if (step.flip === 1) {
        const cur = layer.style.transform || '';
        if (!/\bscaleX\(-1\)/.test(cur)) {
          layer.style.transform = `${cur} scaleX(-1)`.trim();
        }
      }
      return;
    }
    applyInstructionMove(host, step.move, step.flip);
  }

  function clearInstructionMove(host) {
    const layer = host?.querySelector?.(':scope > [data-paperdoll-layers]');
    if (layer) layer.style.transform = '';
  }

  function setComboMoveHold(on) {
    comboMoveHold = !!on;
    if (!comboMoveHold) {
      hosts.forEach((host) => {
        if (host.getAttribute('data-paperdoll') !== 'hunt') return;
        if (!instructionPlay) {
          clearInstructionMove(host);
          setHuntBodyHidden(host, false);
        }
      });
    }
  }

  function applyInstructionStepToHost(host, step, now) {
    if (!host || !step) return;
    const s = animOf(host);
    s.action = step.action;
    s.frameIndex = Math.max(0, Number(step.frame) || 0);
    s.frameStarted = now;
    s.lastDelay = Math.max(1, Number(step.delay) || 100);
    s.instructionLock = true;
    renderHost(host, { instruction: true });
    applyInstructionStepMove(host, step);
  }

  function endInstructionPlay(now) {
    const lastStep = instructionPlay?.steps?.[instructionPlay.steps.length - 1];
    const keepHide = !!(comboMoveHold && lastStep && isHideBodyAction(lastStep.action));
    instructionPlay = null;
    forceActionName = '';
    hosts.forEach((host) => {
      if (host.getAttribute('data-paperdoll') !== 'hunt') return;
      const s = animOf(host);
      s.instructionLock = false;
      // 接技連段中保留最後 move，等整段結束再歸位
      if (!comboMoveHold) {
        clearInstructionMove(host);
        setHuntBodyHidden(host, false);
      } else if (!keepHide) {
        setHuntBodyHidden(host, false);
      }
      // 回到狩獵揮砍／站立（隱身保持時仍鎖 action，避免露出身體）
      if (keepHide) {
        s.action = 'blink';
        s.frameIndex = 0;
        s.frameStarted = now || performance.now();
        s.lastDelay = 9999;
        setHuntBodyHidden(host, true);
        return;
      }
      const action = resolveAction(host);
      s.action = action;
      s.frameIndex = 0;
      s.frameStarted = now || performance.now();
      s.lastDelay = frameDelay(action, 0);
      renderHost(host);
    });
  }

  function startInstructionPlay(rawSteps, preferredName, targetDurationMs, opts = {}) {
    const preferred = String(preferredName || '');
    const loop = !!opts.loop;
    // 昇龍二段 elfrush2：WZ 有騰空 move（擊飛怪用），角色本身應貼地
    const flattenAerial = preferred === 'elfrush2';
    let steps = rawSteps.map((i) => {
      const step = {
        action: String(i.action || 'stand1'),
        frame: Math.max(0, Number(i.frame) || 0),
        delay: Math.max(1, Number(i.delay) || 100),
        flip: i.flip === 1 ? 1 : 0,
      };
      if (Object.prototype.hasOwnProperty.call(i, 'move') && i.move != null) {
        const raw = Array.isArray(i.move) ? i.move : [0, 0];
        step.move = flattenAerial
          ? [Number(raw[0]) || 0, 0]
          : raw;
      }
      return step;
    });
    const natural = steps.reduce((sum, st) => sum + st.delay, 0);
    const target = Number(targetDurationMs);
    // 循環動作維持自然幀速，勿把整段拉長成引導時長
    if (!loop && Number.isFinite(target) && target > 0 && natural > 0) {
      const scale = target / natural;
      steps = steps.map((st) => ({
        ...st,
        delay: Math.max(1, Math.round(st.delay * scale)),
      }));
    }
    const total = steps.reduce((sum, st) => sum + st.delay, 0);
    const now = performance.now();
    instructionPlay = {
      name: String(preferredName || ''),
      steps,
      index: 0,
      stepStarted: now,
      until: loop ? now + 3.6e6 : now + total,
      loop,
    };
    forceSwingUntil = Math.max(forceSwingUntil, instructionPlay.until);
    forceActionName = steps[0].action;
    swingTargetOverrideMs = 0;
    hosts.forEach((host) => {
      if (host.getAttribute('data-paperdoll') !== 'hunt') return;
      applyInstructionStepToHost(host, steps[0], now);
    });
  }

  /**
   * 狩獵施放／普攻：重啟一輪攻擊動作。
   * @param {number} [durationMs] 對齊攻速後的一輪時長（有 instruction 時會等比縮放）
   * @param {string} [preferredAction] 技能 WZ action（如 slashBlast）
   */
  function playHuntSwing(durationMs, preferredAction) {
    const preferred = preferredAction ? String(preferredAction) : '';
    const instructions = getInstructions(preferred);
    if (instructions) {
      startInstructionPlay(instructions, preferred, durationMs);
      return;
    }

    instructionPlay = null;
    const ms = Number(durationMs);
    const now = performance.now();
    if (Number.isFinite(ms) && ms > 0) {
      forceSwingUntil = Math.max(forceSwingUntil, now + ms);
      swingTargetOverrideMs = ms;
    } else {
      forceSwingUntil = Math.max(forceSwingUntil, now + 360);
      swingTargetOverrideMs = 0;
    }
    forceActionName = preferred;
    hosts.forEach((host) => {
      if (host.getAttribute('data-paperdoll') !== 'hunt') return;
      const d = data();
      if (!d) return;
      const s = animOf(host);
      s.instructionLock = false;
      if (!comboMoveHold) clearInstructionMove(host);
      const lookIdsList = [d.defaults.skin].concat(wornItemIds());
      const action = preferred
        ? resolveHuntAction(lookIdsList, forceActionName)
        : pickBasicAttackAction(lookIdsList);
      forceActionName = action;
      s.action = action;
      s.frameIndex = 0;
      s.frameStarted = now;
      s.lastDelay = frameDelay(action, 0);
      renderHost(host);
    });
  }

  /** 持續引導（伊修塔爾等）：自然幀速循環 dualVulcanLoop，直到 stopHuntSwingLoop */
  function playHuntSwingLoop(preferredAction) {
    const preferred = preferredAction ? String(preferredAction) : '';
    const instructions = getInstructions(preferred);
    if (instructions) {
      startInstructionPlay(instructions, preferred, 0, { loop: true });
      return;
    }
    playHuntSwing(3.6e6, preferred);
  }

  function stopHuntSwingLoop() {
    if (instructionPlay?.loop) {
      endInstructionPlay(performance.now());
      return;
    }
    const now = performance.now();
    if (forceSwingUntil > now + 60000) {
      forceSwingUntil = 0;
      forceActionName = '';
      basicAttackPick = '';
    }
  }

  function resolveAction(host) {
    const d = data();
    if (!d || !host) return 'stand1';
    const mode = host.getAttribute('data-paperdoll') || '';
    // 裝備欄／商店預覽固定 stand；僅狩獵場跟著攻擊動作
    const forceStand = mode === 'shop' || mode === 'equip' || mode === 'nav';
    if (forceStand) return 'stand1';
    const s = animOf(host);
    if (s.instructionLock && instructionPlay) {
      const step = instructionPlay.steps[instructionPlay.index];
      if (step?.action) return step.action;
    }
    const lookIdsList = [d.defaults.skin].concat(wornItemIds());
    const now = performance.now();
    if (forceSwingUntil > 0 && now < forceSwingUntil && forceActionName) {
      return resolveHuntAction(lookIdsList, forceActionName);
    }
    if (forceSwingUntil > 0 && now >= forceSwingUntil) {
      forceActionName = '';
      basicAttackPick = '';
    }
    if (preferSwingNow()) {
      return forceActionName
        ? resolveHuntAction(lookIdsList, forceActionName)
        : resolveBasicAttackAction(lookIdsList);
    }
    return 'stand1';
  }

  function huntStandLookKey() {
    const look = lookIds();
    return [look.skin, look.head, look.hair, look.face].concat(look.worn || []).join('|');
  }

  /** 狩獵 hit／受傷數字錨點：固定 stand1 第 0 幀肚臍，不跟 swing 晃動 */
  function syncStandHitAnchor(host) {
    if (!host || host.getAttribute('data-paperdoll') !== 'hunt') return;
    const w = host.clientWidth || 160;
    const h = host.clientHeight || 200;
    const cx = Math.round(w * 0.5);
    const cy = Math.round(h * 0.78);
    const laid = layout(collectPieces('stand1', 0), cx, cy);
    const nx = laid.navel?.[0] ?? cx;
    const ny = laid.navel?.[1] ?? Math.round(h * 0.48);
    host.dataset.standHitOx = String(nx);
    host.dataset.standHitOy = String(ny);
    host.dataset.standHitLookKey = huntStandLookKey();
    syncHitMarker(host, nx, ny);
  }

  function renderHost(host, opts = {}) {
    const d = data();
    if (!d || !host) return;
    const mode = host.getAttribute('data-paperdoll') || '';
    const s = animOf(host);
    const instructionMode = !!(opts.instruction || s.instructionLock);
    let action;
    let fi;
    if (instructionMode) {
      action = s.action || resolveAction(host);
      const count = Math.max(1, frameCount(action));
      fi = Math.max(0, Number(s.frameIndex) || 0) % count;
    } else {
      action = resolveAction(host);
      if (s.action !== action) {
        s.action = action;
        s.frameIndex = 0;
      }
      const count = Math.max(1, frameCount(action));
      fi = s.frameIndex % count;
      s.lastDelay = frameDelay(action, fi);
    }

    // blink 等：隱藏本體，只留技能特效（勿 fallback 成 swing）
    if (mode === 'hunt' && isHideBodyAction(action)) {
      setHuntBodyHidden(host, true);
      let layer = host.querySelector(':scope > [data-paperdoll-layers]');
      const prevTransform = layer?.style?.transform || '';
      if (!layer) {
        layer = document.createElement('div');
        layer.setAttribute('data-paperdoll-layers', '');
        layer.className = 'paperdoll-layers';
        host.insertBefore(layer, host.firstChild);
      }
      syncLayerImages(layer, []);
      if (instructionMode && prevTransform) layer.style.transform = prevTransform;
      ensureHostReady(host, []);
      return;
    }
    if (mode === 'hunt') setHuntBodyHidden(host, false);

    const w = host.clientWidth || 160;
    const h = host.clientHeight || 200;
    // cx/cy = 身體 origin（腳底）；商店預覽腳底貼齊 clip 底邊
    const cx = Math.round(w * 0.5);
    const cy = mode === 'shop' ? h : Math.round(h * 0.78);
    host.dataset.bodyOx = String(cx);
    host.dataset.bodyOy = String(cy);
    const laid = layout(collectPieces(action, fi), cx, cy);
    if (mode === 'hunt') {
      const lookKey = huntStandLookKey();
      if (host.dataset.standHitLookKey !== lookKey) syncStandHitAnchor(host);
    } else {
      const nx = laid.navel?.[0] ?? cx;
      const ny = laid.navel?.[1] ?? Math.round(h * 0.48);
      host.dataset.hitOx = String(nx);
      host.dataset.hitOy = String(ny);
      syncHitMarker(host, nx, ny);
    }
    syncFeetMarker(host, cx, cy);

    let layer = host.querySelector(':scope > [data-paperdoll-layers]');
    const prevTransform = layer?.style?.transform || '';
    if (!layer) {
      layer = document.createElement('div');
      layer.setAttribute('data-paperdoll-layers', '');
      layer.className = 'paperdoll-layers';
      host.insertBefore(layer, host.firstChild);
    }
    syncLayerImages(layer, laid.placed);
    if (instructionMode && prevTransform) {
      layer.style.transform = prevTransform;
    } else if (!instructionMode) {
      layer.style.transform = '';
    }
    ensureHostReady(host, laid.placed);
  }

  /** 重用同 z 層 img，避免每幀 replaceChildren 造成裝備閃爍／重複請求 */
  function syncLayerImages(layer, placed) {
    if (!layer) return;
    const wanted = Array.isArray(placed) ? placed : [];
    const byZ = new Map();
    Array.from(layer.children).forEach((node) => {
      if (!(node instanceof HTMLImageElement)) return;
      const z = node.dataset.z || '';
      if (z) byZ.set(z, node);
    });
    const keep = new Set();
    wanted.forEach((p, i) => {
      const z = String(p.z || '');
      keep.add(z);
      let img = byZ.get(z);
      if (!img) {
        img = document.createElement('img');
        img.alt = '';
        img.draggable = false;
        img.dataset.z = z;
        byZ.set(z, img);
      }
      const left = `${p.left}px`;
      const top = `${p.top}px`;
      const zi = String(zIndexFor(p.z));
      if (img.style.left !== left) img.style.left = left;
      if (img.style.top !== top) img.style.top = top;
      if (img.style.zIndex !== zi) img.style.zIndex = zi;
      const src = p.src || '';
      if (img.dataset.src !== src) {
        img.dataset.src = src;
        if (src) img.src = src;
        else img.removeAttribute('src');
      }
      const at = layer.children[i];
      if (at !== img) layer.insertBefore(img, at || null);
    });
    byZ.forEach((img, z) => {
      if (!keep.has(z)) img.remove();
    });
  }

  function ensureHostReady(host, placed) {
    if (!host || host.dataset.paperdollReady === '1') return;
    const urls = (placed || []).map((p) => p.src).filter(Boolean);
    host.classList.add('is-paperdoll-loading');
    const finish = () => {
      host.classList.remove('is-paperdoll-loading');
      host.dataset.paperdollReady = '1';
    };
    if (!urls.length) {
      finish();
      return;
    }
    if (typeof EnchantImagePreload !== 'undefined' && EnchantImagePreload.preloadMany) {
      EnchantImagePreload.preloadMany(urls).then(finish).catch(finish);
      return;
    }
    Promise.all(urls.map((url) => new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve();
      probe.onerror = () => resolve();
      probe.src = url;
    }))).then(finish).catch(finish);
  }

  /** 預熱目前外觀動作幀（進放置模式／換裝前） */
  function preloadCurrentLook(actions) {
    const list = (Array.isArray(actions) && actions.length) ? actions : ['stand1'];
    const urls = [];
    list.forEach((action) => {
      const count = Math.max(1, frameCount(action));
      for (let fi = 0; fi < count; fi += 1) {
        collectPieces(action, fi).forEach((p) => {
          if (p?.src) urls.push(p.src);
        });
      }
    });
    if (typeof EnchantImagePreload !== 'undefined' && EnchantImagePreload.preloadMany) {
      return EnchantImagePreload.preloadMany(urls);
    }
    return Promise.resolve(urls);
  }

  /** 紙娃娃內不可見標記；經 transform 後用 getBoundingClientRect 取螢幕座標 */
  function syncAnchorMarker(host, x, y, attr) {
    if (!host) return null;
    const key = attr || 'data-hit-anchor';
    let marker = host.querySelector(`:scope > [${key}]`);
    if (!marker) {
      marker = document.createElement('div');
      marker.setAttribute(key, '');
      marker.className = key === 'data-feet-anchor'
        ? 'paperdoll-feet-anchor'
        : 'paperdoll-hit-anchor';
      host.appendChild(marker);
    }
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    return marker;
  }

  function syncHitMarker(host, x, y) {
    return syncAnchorMarker(host, x, y, 'data-hit-anchor');
  }

  function syncFeetMarker(host, x, y) {
    return syncAnchorMarker(host, x, y, 'data-feet-anchor');
  }

  /**
   * mob info/hit 錨點：stand1 第 0 幀肚臍在玩家座標中的位置（不跟攻擊 swing 晃動）。
   */
  function getHuntHitAnchor(playerEl) {
    const host = playerEl?.querySelector?.('[data-paperdoll="hunt"]')
      || document.querySelector('[data-paperdoll="hunt"]');
    if (!host || !playerEl) return null;
    if (host.getAttribute('data-paperdoll') === 'hunt') {
      const lookKey = huntStandLookKey();
      if (host.dataset.standHitLookKey !== lookKey) syncStandHitAnchor(host);
    }
    const w = host.clientWidth || 120;
    const h = host.clientHeight || 160;
    let nx = Number(host.dataset.standHitOx);
    let ny = Number(host.dataset.standHitOy);
    if (!Number.isFinite(nx)) nx = Number(host.dataset.hitOx);
    if (!Number.isFinite(ny)) ny = Number(host.dataset.hitOy);
    if (!Number.isFinite(nx)) nx = Math.round(w * 0.5);
    if (!Number.isFinite(ny)) ny = Math.round(h * 0.48);
    const pr = playerEl.getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    return {
      host,
      player: playerEl,
      x: Math.round(hr.left - pr.left + nx),
      y: Math.round(hr.top - pr.top + ny),
    };
  }

  /**
   * 紙娃娃腳底錨點（升級特效等）；stage 掛在 player 上，不受 scaleX 鏡像影響。
   */
  function getHuntFeetAnchor(playerEl) {
    const host = playerEl?.querySelector?.('[data-paperdoll="hunt"]')
      || document.querySelector('[data-paperdoll="hunt"]');
    if (!host || !playerEl) return null;
    const w = host.clientWidth || 120;
    const h = host.clientHeight || 160;
    const fx = Number(host.dataset.bodyOx);
    const fy = Number(host.dataset.bodyOy);
    const x = Number.isFinite(fx) ? fx : Math.round(w * 0.5);
    const y = Number.isFinite(fy) ? fy : Math.round(h * 0.78);
    const marker = syncFeetMarker(host, x, y);
    const pr = playerEl.getBoundingClientRect();
    const mr = marker.getBoundingClientRect();
    return {
      host,
      player: playerEl,
      x: Math.round(mr.left - pr.left),
      y: Math.round(mr.top - pr.top),
    };
  }

  /** @deprecated 改用 getHuntHitAnchor */
  function getHuntBodyOrigin(playerEl) {
    return getHuntHitAnchor(playerEl);
  }

  function tick(now) {
    // 技能 instruction：依腳本逐步換成指定身體 action+frame
    if (instructionPlay) {
      const step = instructionPlay.steps[instructionPlay.index];
      if (step && now - instructionPlay.stepStarted >= step.delay) {
        instructionPlay.index += 1;
        if (instructionPlay.index >= instructionPlay.steps.length) {
          if (instructionPlay.loop && instructionPlay.steps.length) {
            instructionPlay.index = 0;
            instructionPlay.stepStarted = now;
            instructionPlay.until = Math.max(instructionPlay.until, now + 3.6e6);
            forceSwingUntil = Math.max(forceSwingUntil, instructionPlay.until);
            const next = instructionPlay.steps[0];
            forceActionName = next.action;
            hosts.forEach((host) => {
              if (host.getAttribute('data-paperdoll') !== 'hunt') return;
              applyInstructionStepToHost(host, next, now);
            });
          } else {
            endInstructionPlay(now);
          }
        } else {
          instructionPlay.stepStarted = now;
          const next = instructionPlay.steps[instructionPlay.index];
          forceActionName = next.action;
          hosts.forEach((host) => {
            if (host.getAttribute('data-paperdoll') !== 'hunt') return;
            applyInstructionStepToHost(host, next, now);
          });
        }
      }
      raf = requestAnimationFrame(tick);
      return;
    }

    hosts.forEach((host) => {
      const s = animOf(host);
      if (s.instructionLock) return;
      const action = resolveAction(host);
      // 動作切換（stand↔swing）立刻重繪並重置幀
      if (s.action !== action) {
        s.action = action;
        s.frameIndex = 0;
        s.frameStarted = now;
        s.lastDelay = frameDelay(action, 0);
        renderHost(host);
        return;
      }
      if (!s.frameStarted) s.frameStarted = now;
      if (now - s.frameStarted >= s.lastDelay) {
        s.frameStarted = now;
        const count = Math.max(1, frameCount(s.action));
        // 出招視窗內播完一輪就停在末幀，避免被壓短後反覆空揮
        if (forceSwingUntil > now && isAttackActionName(s.action) && s.frameIndex >= count - 1) {
          s.frameIndex = count - 1;
        } else {
          s.frameIndex += 1;
        }
        renderHost(host);
      }
    });
    raf = requestAnimationFrame(tick);
  }

  function mount(host) {
    if (!host) return;
    const first = !hosts.has(host);
    host.classList.add('paperdoll-stage');
    hosts.add(host);
    const s = animOf(host);
    s.action = resolveAction(host);
    s.lastDelay = frameDelay(s.action, 0);
    if (first) {
      // 首次掛載：先預熱再顯示，避免半透明空層
      delete host.dataset.paperdollReady;
      host.classList.add('is-paperdoll-loading');
      const action = s.action || 'stand1';
      preloadCurrentLook([action, 'stand1']).finally(() => {
        if (!hosts.has(host)) return;
        renderHost(host);
      });
    } else {
      renderHost(host);
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function refresh() {
    hosts.forEach((host) => {
      if (host.getAttribute('data-paperdoll') === 'hunt') syncStandHitAnchor(host);
      renderHost(host);
    });
    if (typeof AppNavSidebar !== 'undefined') AppNavSidebar.refreshProfile?.();
  }

  function initEquip() {
    const canvas = document.querySelector('#uiEquipPanel .uiequip-canvas');
    if (!canvas) return;
    let stage = canvas.querySelector('[data-paperdoll="equip"]');
    if (!stage) {
      stage = document.createElement('div');
      stage.setAttribute('data-paperdoll', 'equip');
      stage.className = 'paperdoll-stage paperdoll-stage--equip';
      canvas.appendChild(stage);
    }
    mount(stage);
  }

  function initHunt(root) {
    const slot = root?.querySelector?.('[data-sprite-slot="player"]')
      || document.querySelector('[data-sprite-slot="player"]');
    if (!slot) return;
    const img = slot.querySelector('img.idle-actor-sprite');
    let stage = slot.querySelector('[data-paperdoll="hunt"]');
    if (!stage) {
      stage = document.createElement('div');
      stage.setAttribute('data-paperdoll', 'hunt');
      stage.className = 'paperdoll-stage paperdoll-stage--hunt idle-actor-sprite';
      if (img) img.replaceWith(stage);
      else slot.appendChild(stage);
    }
    mount(stage);
    syncStandHitAnchor(stage);
  }

  /** NPC 商店右側預覽：固定 stand，腳底對齊 avatarPreview */
  function initShop(root) {
    const panel = root?.querySelector?.('#npcShopRight') || document.getElementById('npcShopRight');
    if (!panel) return null;
    let stage = panel.querySelector('[data-paperdoll="shop"]') || panel.querySelector('#npcShopAvatar');
    if (!stage) {
      stage = document.createElement('div');
      stage.id = 'npcShopAvatar';
      panel.appendChild(stage);
    }
    stage.setAttribute('data-paperdoll', 'shop');
    stage.classList.add('paperdoll-stage', 'paperdoll-stage--shop');
    mount(stage);
    return stage;
  }

  function initNav() {
    let stage = document.getElementById('appNavAvatar');
    if (!stage) return null;
    stage.setAttribute('data-paperdoll', 'nav');
    stage.classList.add('paperdoll-stage', 'paperdoll-stage--nav');
    mount(stage);
    return stage;
  }

  return {
    initEquip,
    initHunt,
    initShop,
    initNav,
    mount,
    refresh,
    preloadCurrentLook,
    playHuntSwing,
    playHuntAction: playHuntSwing,
    playHuntSwingLoop,
    stopHuntSwingLoop,
    setComboMoveHold,
    resolveHuntAction,
    resolveBasicAttackAction,
    pickBasicAttackAction,
    availableBasicAttackActions,
    resolveSkillActionName,
    getInstructions,
    getInstructionDurationMs,
    getHuntHitAnchor,
    getHuntFeetAnchor,
    getHuntBodyOrigin,
  };
})();

if (typeof window !== 'undefined') window.Paperdoll = Paperdoll;
