/**
 * 放置狩獵：戰力決定秒傷；擊殺後依 IdleHuntDropData 掉進背包。
 * 場上：左自身、右小怪排隊（多隻可超出場地寬度，由場地 overflow 裁切）。
 */
const IdleHunt = (() => {
  const STORAGE_KEY = 'idle.hunt.v1';
  const UI_VER = 20;
  const GAME_SPEED_KEY = 'idle.hunt.gameSpeed.v1';
  const GM_GOD_MODE_KEY = 'idle.hunt.gmGodMode.v1';
  const GM_ONE_HIT_KEY = 'idle.hunt.gmOneHitKill.v1';
  const GAME_SPEED_MIN = 0.25;
  const GAME_SPEED_MAX = 20;
  const UI = 'images/Uiidelhunt/';
  const UI_SIZE = {
    panel: [860, 820],
    field: [800, 500],
    title: [191, 56],
    titlePos: [27, 8],
    mapbarPos: [62, 72],
    mapbarGap: 6,
    currentMapPos: [20, 30],
    hpBg: [786, 36],
    hpFill: [729, 34],
    hpFillInset: [29, 1],
    hpGap: 4,
    btnGap: 2,
    expBg: [800, 25],
    expFill: [800, 22],
    expFillInset: [0, 1],
    btn: {
      map: [84, 35],
      shop: [83, 35],
      dungeon: [86, 35],
      gm: [90, 35],
      green: [161, 35],
      blue: [161, 35],
      red: [161, 35],
    },
    stat: {
      atp: [186, 31],
      kill: [86, 31],
      coin: [186, 31],
    },
  };
  const TICK_MS = 100;
  const DEFAULT_MONSTER_HP = 12;
  /** 戰鬥佇列長度（技能／普攻可打到的怪物數） */
  const QUEUE_LEN = 30;
  /** 畫面上同時顯示的怪物數 */
  const VISIBLE_QUEUE_LEN = 10;
  /** 同時死亡動畫上限；超過仍發獎，只省略屍體動畫（高速秒殺減尖峰） */
  const MAX_DYING_VISUAL = 8;
  /** 活怪堆疊：同批前高後低；新批整體高於舊批（均在 stage z=1，低於 skill-fx 層 z=100） */
  const MOB_Z_LIVE_FLOOR = 10;
  const MOB_Z_DYING = 5;
  /** 每補一批怪遞增；同批內 1→10 遞減 */
  let mobBatchSeq = 0;
  const DEATH_KILL_PENALTY_RATE = 0.3; // 死亡扣當前進度 30%
  /** 章節小怪地圖死亡經驗懲罰：1–49 → 3%，50–99 → 7%，100+ → 10%（副本／BOSS 不扣） */
  function deathExpPenaltyRate(level) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    if (lv >= 100) return 0.10;
    if (lv >= 50) return 0.07;
    return 0.03;
  }

  let inited = false;
  let jobLinePickerOpen = false;
  let open = false;
  let timer = null;
  let spriteTimer = null;
  /** @type {Worker|null} */
  let huntWorker = null;
  let huntWorkerBlobUrl = null;
  /** 上次模擬牆鐘（performance.now）；用於背景補 tick */
  let lastSimAt = 0;
  let catchUpRaf = 0;
  let visibilityBound = false;
  /** 單次補算上限（牆鐘 ms），避免切回分頁時卡死 */
  const MAX_CATCH_UP_MS = 120000;
  /** 背景／補算每波最多跑幾步 */
  const CATCH_UP_BURST = 40;
  /** 掛機自動釋放戰鬥視覺／圖片快取間隔 */
  const MEM_RELEASE_MS = 30000;
  /** 解碼圖快取軟上限（張） */
  const IMAGE_CACHE_SOFT_MAX = 360;
  let lastMemReleaseAt = 0;
  /** @type {ReturnType<typeof setInterval>|null} */
  let memReleaseTimer = null;
  let saveTimer = 0;
  let spawnSeq = 0;
  let mobWalkSeq = 0;
  let mobDamageSeq = 0;
  let gameSpeed = 1;
  let gmGodMode = false;
  let gmOneHitKill = false;
  /** 受擊無敵幀結束時間（Date.now） */
  let playerHurtIframeUntil = 0;
  /** 受擊後基礎無敵時間（ms；會套用遊戲倍速） */
  const PLAYER_HURT_IFRAME_MS = 500;
  /** 補位時每格錯開多久，營造一隻一隻往前走的節奏 */
  const MOB_STEP_STAGGER_MS = 100;
  /** 隊列補位／進場移動速度倍率（2 = 快一倍） */
  const MOB_QUEUE_MOVE_SPEED = 3;
  let lastZoneRenderKey = '';
  let pickerOpen = false;
  let pickerView = 'bands';
  let pickerBandKey = '';
  let resumeAfterPanelClose = false;
  let transitionSeq = 0;
  let fieldTransition = null;
  /** @type {ReturnType<typeof setTimeout>|null} */
  let afkStepTimer = null;
  const MAP_FADE_MS = 500;
  const BOSS_WARNING_MS = 2000;
  /** 章節 BOSS 挑戰時限（秒） */
  const CHAPTER_BOSS_LIMIT_SEC = 60;

  /** @type {ReturnType<typeof IdleUiTimer.create>|null} */
  let chapterBossTimer = null;
  /** 死亡演示播放中（結束後才跑 stop／復活流程） */
  let deathFxPending = false;
  /** 章節死亡彈窗 */
  /** 暫停後再開始：保留怪攻 CD，避免連點暫停無傷 */
  let combatPaused = false;
  let lastStartPauseAt = 0;
  const START_PAUSE_CD_MS = 800;
  let deathModalOpen = false;
  let deathModalMsg = '';
  /** 防止復活流程重入 */
  let deathReviveBusy = false;
  /** @type {{ start: Function, stop: Function, leftSec: Function }|null} */
  let deathAutoReviveCtrl = null;
  let deathAutoReviveLeft = 0;

  const state = {
    running: false,
    power: 0,
    kills: 0,
    gold: 0,
    queue: [],
    lastDrop: '',
    nextLetter: 0,
    zoneId: 'mapleisland-1',
    huntMode: 'mob',
    mapKills: {},
    bossCleared: {},
    replayKills: {},
    atkAcc: 0,
    preferSkillFirst: false,
    preferSkillFirstWait: 0,
    dying: [],
    deferredKills: [],
    spriteAcc: 0,
    hp: null,
    maxHp: 0,
    mobHitAcc: 0,
    mobSkill1Acc: 0,
    mobSkill2Acc: 0,
    mobSkill3Acc: 0,
    mobAtk2Acc: 0,
    mobAtk3Acc: 0,
    mobFrontUid: 0,
    lastMobCastAction: '',
    afk: true,
    afkMode: 'push', // off | push（自動推圖）| farm（掛機刷王）
    afkHoldAdvance: false,
    dungeon: null,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function isFieldTransitionActive() {
    return !!fieldTransition;
  }

  function cancelFieldTransition() {
    transitionSeq += 1;
    fieldTransition = null;
    const fade = $('idleHuntFieldFade');
    const warn = $('idleHuntFieldWarning');
    if (fade) {
      fade.style.transition = '';
      fade.style.opacity = '0';
    }
    if (warn) {
      warn.classList.remove('is-playing');
      warn.hidden = true;
    }
    $('idleHuntField')?.querySelectorAll('.idle-actor--mob[data-intro-lock="1"]').forEach((el) => {
      el.removeAttribute('data-intro-lock');
      el.removeAttribute('data-intro-action');
    });
  }

  /** 推圖連跳過圖可被暫停／改託管模式中斷 */
  function isPushTransitionCancellable() {
    return !!(fieldTransition
      && fieldTransition.resumeAfter
      && (fieldTransition.kind === 'map' || fieldTransition.kind === 'bossIntro'));
  }

  function pausePushOrCombat() {
    const cancellable = isPushTransitionCancellable();
    if (cancellable) {
      if (fieldTransition) fieldTransition.resumeAfter = false;
      cancelFieldTransition();
    }
    if (afkStepTimer != null) {
      window.clearTimeout(afkStepTimer);
      afkStepTimer = null;
    }
    if (state.afkMode === 'push') state.afkHoldAdvance = true;
    stop(true);
  }

  function scheduleAfkStep(delayMs = 0) {
    if (afkStepTimer != null) {
      window.clearTimeout(afkStepTimer);
      afkStepTimer = null;
    }
    const wait = Math.max(0, Number(delayMs) || 0);
    afkStepTimer = window.setTimeout(() => {
      afkStepTimer = null;
      if (!state.running || !open) return;
      tryAfkStep();
    }, wait);
  }

  function waitMs(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, scaleDelayMs(ms));
    });
  }

  function clampGameSpeed(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return 1;
    return Math.max(GAME_SPEED_MIN, Math.min(GAME_SPEED_MAX, n));
  }

  function loadGameSpeed() {
    try {
      const raw = localStorage.getItem(GAME_SPEED_KEY);
      if (raw == null || raw === '') return;
      gameSpeed = clampGameSpeed(raw);
    } catch (_) { /* ignore */ }
  }

  function saveGameSpeed() {
    try {
      localStorage.setItem(GAME_SPEED_KEY, String(gameSpeed));
    } catch (_) { /* ignore */ }
  }

  function getGameSpeed() {
    return gameSpeed;
  }

  function scaleDtSec(dt) {
    return (Number(dt) || 0) * gameSpeed;
  }

  /** 真實時間延遲（ms）：倍速越高，等待越短 */
  function scaleDelayMs(ms) {
    const base = Math.max(0, Number(ms) || 0);
    if (!(gameSpeed > 0) || gameSpeed === 1) return base;
    return base / gameSpeed;
  }

  function loadGmFlags() {
    try {
      const god = localStorage.getItem(GM_GOD_MODE_KEY);
      if (god != null) gmGodMode = god === '1' || god === 'true';
      const ohk = localStorage.getItem(GM_ONE_HIT_KEY);
      if (ohk != null) gmOneHitKill = ohk === '1' || ohk === 'true';
    } catch (_) { /* ignore */ }
  }

  function saveGmFlag(key, on) {
    try {
      localStorage.setItem(key, on ? '1' : '0');
    } catch (_) { /* ignore */ }
  }

  function isGodMode() {
    return !!gmGodMode;
  }

  function setGodMode(next, opts = {}) {
    gmGodMode = !!next;
    if (opts.persist !== false) saveGmFlag(GM_GOD_MODE_KEY, gmGodMode);
    return gmGodMode;
  }

  function isOneHitKill() {
    return !!gmOneHitKill;
  }

  function setOneHitKill(next, opts = {}) {
    gmOneHitKill = !!next;
    if (opts.persist !== false) saveGmFlag(GM_ONE_HIT_KEY, gmOneHitKill);
    return gmOneHitKill;
  }

  /**
   * 最終套用傷害：GM OHK → BOSS 血線 cap。
   * 怪物防禦（IED×PDRate）暫不套用——面板／技能無視尚未完善。
   * opts.skillIed 保留參數以相容呼叫端，目前忽略。
   */
  function resolveMobHitDamage(mob, dmg, opts = {}) {
    let base = Math.max(0, Math.floor(Number(dmg) || 0));
    // 暫關：UiCharacterInfo.applyMobDefense（等 IED 來源／合併完整再開）
    void opts;
    if (gmOneHitKill && mob) {
      const hp = Math.max(1, Math.floor(Number(mob.hp) || 0));
      base = Math.max(base, hp);
    }
    if (typeof IdleBossFight !== 'undefined' && IdleBossFight.capIncomingDamage
      && typeof IdleBoss !== 'undefined' && IdleBoss.isRunning?.()) {
      base = IdleBossFight.capIncomingDamage(mob, base);
    }
    return Math.max(0, Math.floor(base));
  }

  /**
   * 統一：先算出 finalDmg，再顯示、再扣血（顯示＝實扣）。
   * 回傳 finalDmg。
   * 副本累積傷害一律在此記入（技能／接技／最終攻擊等只要走這條就不會漏）。
   */
  function applyPlayerHitToMob(mob, rawDmg, opts = {}) {
    if (!mob) return 0;
    const finalDmg = resolveMobHitDamage(mob, rawDmg, {
      skillIed: opts.skillIed,
    });
    if (typeof opts.showMobDamage === 'function') {
      opts.showMobDamage(mob, finalDmg, !!opts.isCritical, opts.dmgOpts || {});
    }
    if (typeof opts.onDamage === 'function') opts.onDamage(finalDmg);
    if (opts.reportDungeonDamage !== false
      && finalDmg > 0
      && state.dungeon
      && typeof IdleDungeon !== 'undefined') {
      IdleDungeon.onHuntDamage?.(finalDmg);
    }
    mob.hp = (Number(mob.hp) || 0) - finalDmg;
    if (typeof IdleBossFight !== 'undefined'
      && typeof IdleBossFight.afterAppliedDamage === 'function') {
      IdleBossFight.afterAppliedDamage(mob, finalDmg);
    }
    return finalDmg;
  }

  function syncGameSpeedInput() {
    const input = $('idleGmGameSpeed');
    if (!input || document.activeElement === input) return;
    input.value = String(gameSpeed);
  }

  function setGameSpeed(raw, opts = {}) {
    const next = clampGameSpeed(raw);
    if (next === gameSpeed && !opts.force) {
      syncGameSpeedInput();
      return gameSpeed;
    }
    gameSpeed = next;
    if (opts.persist !== false) saveGameSpeed();
    syncGameSpeedInput();
    if (typeof IdlePotionPanel !== 'undefined' && typeof IdlePotionPanel.onGameSpeedChanged === 'function') {
      IdlePotionPanel.onGameSpeedChanged();
    }
    return gameSpeed;
  }

  function ensureFieldFx() {
    const field = $('idleHuntField');
    if (!field) return;
    if (!field.querySelector('.idle-hunt-field-fx')) {
      field.insertAdjacentHTML('beforeend', `
      <div class="idle-hunt-field-fx" id="idleHuntFieldFx" aria-hidden="true">
        <div class="idle-hunt-field-fx__fade" id="idleHuntFieldFade"></div>
        <img class="idle-hunt-field-fx__warning" id="idleHuntFieldWarning" src="${UI}warning.png" width="800" height="500" alt="" draggable="false" hidden>
      </div>
    `);
    }
    ensureDeathModal();
    if (!field.querySelector('.idle-hunt-skill-fx-behind')) {
      const stage = field.querySelector('.idle-hunt-stage');
      const behind = document.createElement('div');
      behind.className = 'idle-hunt-skill-fx-behind';
      behind.setAttribute('aria-hidden', 'true');
      if (stage) stage.insertAdjacentElement('beforebegin', behind);
      else field.appendChild(behind);
    }
    if (!field.querySelector('.idle-hunt-skill-fx')) {
      const stage = field.querySelector('.idle-hunt-stage');
      const layer = document.createElement('div');
      layer.className = 'idle-hunt-skill-fx';
      layer.setAttribute('aria-hidden', 'true');
      if (stage) stage.insertAdjacentElement('afterend', layer);
      else field.appendChild(layer);
    }
    if (!field.querySelector('.idle-hunt-damage-fx')) {
      const skillFx = field.querySelector('.idle-hunt-skill-fx');
      const dmgLayer = document.createElement('div');
      dmgLayer.className = 'idle-hunt-damage-fx';
      dmgLayer.setAttribute('aria-hidden', 'true');
      if (skillFx) skillFx.insertAdjacentElement('afterend', dmgLayer);
      else {
        const stage = field.querySelector('.idle-hunt-stage');
        if (stage) stage.insertAdjacentElement('afterend', dmgLayer);
        else field.appendChild(dmgLayer);
      }
    }
    ensureBuffBar();
    ensureCdBar();
    ensureChapterBossTimerHost();
  }

  function ensureChapterBossTimerHost() {
    const field = $('idleHuntField');
    if (!field || field.querySelector('#idleHuntBossTimerHost')) return;
    field.insertAdjacentHTML('beforeend', `
      <div class="idle-hunt-boss-timer-host" id="idleHuntBossTimerHost" aria-hidden="true"></div>
    `);
  }

  function ensureChapterBossTimer() {
    if (typeof IdleUiTimer === 'undefined') return null;
    ensureChapterBossTimerHost();
    const host = $('idleHuntBossTimerHost');
    if (!host) return null;
    if (!chapterBossTimer) {
      chapterBossTimer = IdleUiTimer.create({
        host,
        id: 'idleHuntBossTimer',
        label: '章節 BOSS 剩餘時間',
      });
    } else {
      chapterBossTimer.mount(host);
    }
    return chapterBossTimer;
  }

  function startChapterBossTimer() {
    const t = ensureChapterBossTimer();
    if (!t) return;
    t.reset(CHAPTER_BOSS_LIMIT_SEC);
    t.start();
    t.setVisible(true);
  }

  function stopChapterBossTimer() {
    if (!chapterBossTimer) return;
    chapterBossTimer.stop();
    chapterBossTimer.setVisible(false);
  }

  function tickChapterBossTimer(dt) {
    if (state.dungeon || state.huntMode !== 'boss' || fieldTransition) return false;
    const t = ensureChapterBossTimer();
    if (!t) return false;
    if (!t.isRunning() && !t.isExpired() && t.getLeftMs() > 0) t.start();
    return t.tick(dt);
  }

  function onChapterBossTimeUp() {
    if (state.dungeon || state.huntMode !== 'boss') return;
    state.lastDrop = '時間到，BOSS 挑戰失敗';
    failBossFight();
    if (open) render();
  }

  function ensureBuffBar() {
    const field = $('idleHuntField');
    if (!field || field.querySelector('#idleHuntBuffs')) return;
    field.insertAdjacentHTML('beforeend', `
      <div class="idle-hunt-buffs" id="idleHuntBuffs" aria-label="作用中的增益"></div>
    `);
  }

  function ensureCdBar() {
    const field = $('idleHuntField');
    if (!field || field.querySelector('#idleHuntCds')) return;
    field.insertAdjacentHTML('beforeend', `
      <div class="idle-hunt-cds" id="idleHuntCds" aria-label="技能冷卻"></div>
    `);
  }

  function formatBuffRemain(ms) {
    const sec = Math.max(0, Math.ceil(Number(ms) / 1000));
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${String(s).padStart(2, '0')}`;
    }
    return String(sec);
  }

  function syncBuffBarUi() {
    ensureBuffBar();
    const host = $('idleHuntBuffs');
    if (!host) return;
    const list = (typeof SkillModifiers !== 'undefined' && SkillModifiers.listActiveBuffs)
      ? SkillModifiers.listActiveBuffs()
      : [];
    const showStacks = typeof SkillModifiers === 'undefined'
      || SkillModifiers.getShowStackBuffCounts?.() !== false;
    const live = new Set(list.map((b) => String(b.id)));
    host.querySelectorAll('.idle-hunt-buff[data-buff-id]').forEach((el) => {
      if (!live.has(el.getAttribute('data-buff-id'))) el.remove();
    });
    // 右→左：DOM 先施放→後施放，配合 row-reverse 讓最新在最右
    list.forEach((buff) => {
      const id = String(buff.id);
      let el = [...host.querySelectorAll('.idle-hunt-buff')].find(
        (n) => n.getAttribute('data-buff-id') === id,
      ) || null;
      if (!el) {
        el = document.createElement('div');
        el.className = 'idle-hunt-buff';
        el.setAttribute('data-buff-id', id);
        host.appendChild(el);
      }
      const stacks = Math.max(0, Math.floor(Number(buff.stacks) || 0));
      const showStackBadge = showStacks && !!buff.isStackBuff && stacks > 0;
      const hideTimer = !!buff.hideTimer;
      el.title = showStackBadge
        ? `${buff.name || id} ×${stacks}`
        : (buff.name || id);
      el.classList.toggle('is-stack-buff', !!buff.isStackBuff);
      let icon = el.querySelector('.idle-hunt-buff__icon');
      if (!icon) {
        icon = document.createElement('img');
        icon.className = 'idle-hunt-buff__icon';
        icon.alt = '';
        icon.draggable = false;
        el.appendChild(icon);
      }
      const skillId = id.replace(/^combo:/, '');
      const iconSrc = buff.icon
        || (typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(skillId)?.icon : '')
        || '';
      if (iconSrc && icon.getAttribute('src') !== iconSrc) icon.setAttribute('src', iconSrc);

      let stackEl = el.querySelector('.idle-hunt-buff__stacks');
      if (!stackEl) {
        stackEl = document.createElement('span');
        stackEl.className = 'idle-hunt-buff__stacks';
        el.appendChild(stackEl);
      }
      let cd = el.querySelector('.idle-hunt-buff__cd');
      if (!cd) {
        cd = document.createElement('span');
        cd.className = 'idle-hunt-buff__cd';
        el.appendChild(cd);
      }

      // 無持續時間的堆疊（鬥氣）：層數放底部計時位置，較明顯
      if (hideTimer && showStackBadge) {
        stackEl.hidden = true;
        cd.hidden = false;
        cd.removeAttribute('hidden');
        cd.textContent = String(stacks);
        cd.classList.add('idle-hunt-buff__cd--stacks');
      } else {
        cd.classList.remove('idle-hunt-buff__cd--stacks');
        if (showStackBadge) {
          stackEl.hidden = false;
          stackEl.removeAttribute('hidden');
          stackEl.textContent = String(stacks);
        } else {
          stackEl.hidden = true;
        }
        if (hideTimer || !(Number(buff.remainMs) > 0)) {
          cd.hidden = true;
        } else {
          cd.hidden = false;
          cd.removeAttribute('hidden');
          cd.textContent = formatBuffRemain(buff.remainMs);
        }
      }
    });
    host.hidden = list.length === 0;
  }

  function syncCdBarUi() {
    ensureCdBar();
    const host = $('idleHuntCds');
    if (!host) return;
    const list = (typeof SkillCombat !== 'undefined' && SkillCombat.listActiveCooldowns)
      ? SkillCombat.listActiveCooldowns()
      : [];
    const live = new Set(list.map((b) => String(b.id)));
    host.querySelectorAll('.idle-hunt-cd[data-skill-id]').forEach((el) => {
      if (!live.has(el.getAttribute('data-skill-id'))) el.remove();
    });
    list.forEach((entry) => {
      const id = String(entry.id);
      let el = [...host.querySelectorAll('.idle-hunt-cd')].find((n) => n.dataset.skillId === id) || null;
      if (!el) {
        el = document.createElement('div');
        el.className = 'idle-hunt-cd';
        el.dataset.skillId = id;
        el.title = entry.name || id;
        const icon = entry.icon
          || (typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(id)?.icon : '')
          || '';
        el.innerHTML = `
          <img class="idle-hunt-cd__icon" alt="" draggable="false"${icon ? ` src="${icon}"` : ''}>
          <span class="idle-hunt-cd__timer">0</span>
        `;
        host.appendChild(el);
      }
      const timer = el.querySelector('.idle-hunt-cd__timer');
      if (timer) timer.textContent = formatBuffRemain(entry.remainMs);
    });
    host.hidden = list.length === 0;
  }

  function syncHuntOverlayBars() {
    syncBuffBarUi();
    syncCdBarUi();
  }

  function fadeField(opacity, ms = MAP_FADE_MS) {
    ensureFieldFx();
    const fade = $('idleHuntFieldFade');
    if (!fade) return waitMs(ms);
    fade.style.transition = `opacity ${ms}ms ease`;
    fade.style.opacity = String(Math.max(0, Math.min(1, Number(opacity) || 0)));
    return waitMs(ms);
  }

  async function flashBossWarning(durationMs = BOSS_WARNING_MS) {
    ensureFieldFx();
    const warn = $('idleHuntFieldWarning');
    if (!warn) {
      await waitMs(durationMs);
      return;
    }
    warn.hidden = false;
    warn.classList.remove('is-playing');
    void warn.offsetWidth;
    warn.classList.add('is-playing');
    await waitMs(durationMs);
    warn.classList.remove('is-playing');
    warn.hidden = true;
  }

  function preloadImageUrl(url) {
    if (!url) return Promise.resolve();
    if (typeof EnchantImagePreload !== 'undefined' && EnchantImagePreload.preload) {
      return EnchantImagePreload.preload(url);
    }
    return new Promise((resolve) => {
      const img = new Image();
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      img.src = url;
    });
  }

  function collectZoneMobIconIds(zone) {
    const ids = new Set();
    if (typeof IdleZones === 'undefined') return ids;
    const cfg = IdleZones.configFor(zone);
    const pool = Array.isArray(cfg?.mobPool) ? cfg.mobPool : [];
    pool.forEach((row) => {
      const id = row?.icon || row?.mobIcon;
      if (id) ids.add(String(id));
    });
    if (cfg?.mobIcon) ids.add(String(cfg.mobIcon));
    if (cfg?.bossIcon) ids.add(String(cfg.bossIcon));
    return ids;
  }

  function preloadMobIconActions(iconId) {
    if (!iconId || typeof IdleMobAnim === 'undefined') return Promise.resolve();
    const actions = ['stand', 'move', 'regen', 'hit1', 'die1'];
    return Promise.all(actions.map((action) => {
      const p = IdleMobAnim.preloadAction?.(iconId, action);
      return p && typeof p.then === 'function' ? p : Promise.resolve();
    }));
  }

  /** BOSS 入場：預載全部動作幀（含 attack／skill），避免開戰換幀卡住 */
  function preloadMobAllActions(iconId) {
    if (!iconId || typeof IdleMobAnim === 'undefined') return Promise.resolve();
    if (typeof IdleMobAnim.preloadMob === 'function') {
      return IdleMobAnim.preloadMob(iconId);
    }
    return preloadMobIconActions(iconId);
  }

  function preloadZoneAssets(zone) {
    const tasks = [];
    if (typeof IdleZones !== 'undefined') {
      tasks.push(preloadImageUrl(IdleZones.mapUrl(zone)));
      collectZoneMobIconIds(zone).forEach((iconId) => {
        tasks.push(preloadMobIconActions(iconId));
      });
    }
    return Promise.all(tasks);
  }

  /** 轉場淡出前：立刻綁定可見怪並等到本體圖就緒 */
  function ensureVisibleMobSpritesReady() {
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    if (!stage || typeof IdleMobAnim === 'undefined') return Promise.resolve();
    const waits = [];
    state.queue.slice(0, VISIBLE_QUEUE_LEN).forEach((mob) => {
      const el = stage.querySelector(`.idle-actor--mob[data-uid="${mob.uid}"]`);
      if (!el || el.classList.contains('is-dying')) return;
      bindMobSprite(el, mob, el.classList.contains('is-moving') ? 'move' : 'stand');
      const img = el.querySelector('.idle-actor-sprite:not(.idle-actor-sprite--effect)');
      if (!img) return;
      if (img.complete && img.naturalWidth) return;
      const url = img.dataset.src || img.getAttribute('src') || '';
      if (url && typeof EnchantImagePreload !== 'undefined' && EnchantImagePreload.preload) {
        waits.push(EnchantImagePreload.preload(url).then(() => {
          if (!img.isConnected) return;
          if (img.dataset.src === url && (!img.complete || !img.naturalWidth)) {
            img.src = url;
          }
        }));
        return;
      }
      waits.push(new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        window.setTimeout(done, 600);
      }));
    });
    return Promise.all(waits);
  }

  async function waitMobIntroAnim(el, mob, kind) {
    const img = el?.querySelector('.idle-actor-sprite:not(.idle-actor-sprite--effect)');
    const iconId = mob?.iconId || img?.dataset?.iconId;
    if (!el || !img || !iconId || typeof IdleMobAnim === 'undefined') {
      await waitMs(320);
      return;
    }
    el.dataset.introAction = kind;
    bindMobSprite(el, mob, kind);
    img.dataset.frameAcc = '0';
    img.dataset.bodyDone = '0';
    const timeout = (IdleMobAnim.actionDurationMs?.(iconId, kind, kind) || 1200) + 200;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      advanceAllSprites(TICK_MS / 1000);
      if (img.dataset.bodyDone === '1') break;
      await waitMs(TICK_MS);
    }
    delete el.dataset.introAction;
    bindMobSprite(el, mob, 'stand');
  }

  async function playBossEntrance(boss) {
    const zone = currentZone();
    const spawn = typeof IdleZones !== 'undefined'
      ? IdleZones.spawn(zone, VISIBLE_QUEUE_LEN + 1)
      : { mobs: [{ x: 360, y: 390 }] };
    const target = spawn.mobs[0] || { x: 360, y: 390 };
    renderField();
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    const el = stage?.querySelector(`.idle-actor--mob[data-uid="${boss.uid}"]`);
    if (!el) return;

    const iconId = boss.iconId;
    const hasRegen = typeof IdleMobAnim !== 'undefined'
      && !!IdleMobAnim.hasAction?.(iconId, 'regen');

    el.dataset.introLock = '1';
    applyMobStackZ(el, boss, 0, false);
    if (hasRegen) {
      setActorPoint(el, target, false);
      startSpriteTimer();
      await waitMobIntroAnim(el, boss, 'regen');
      delete el.dataset.introLock;
      return;
    }

    const startX = UI_SIZE.field[0] + 100;
    el.classList.remove('is-moving');
    el.style.transition = 'none';
    setActorPoint(el, { x: startX, y: target.y }, false);
    bindMobSprite(el, boss, 'move');
    await waitMs(16);
    el.style.transition = '';
    const moveMs = typeof IdleMobAnim !== 'undefined' ? IdleMobAnim.MOVE_MS : 320;
    el.classList.add('is-moving');
    el.dataset.moveUntil = String(Date.now() + moveMs);
    setActorPoint(el, target, true);
    startSpriteTimer();
    await waitMs(moveMs);
    el.classList.remove('is-moving');
    el.dataset.moveUntil = '0';
    bindMobSprite(el, boss, 'stand');
    delete el.dataset.introLock;
  }

  async function runMapTransition(nextId, fromUser, opts = {}) {
    if (fieldTransition) return false;
    const seq = ++transitionSeq;
    const wasRunning = state.running;
    const startAfter = opts.forceStart === true ? true : wasRunning;
    fieldTransition = { kind: 'map', seq, resumeAfter: startAfter };
    if (wasRunning) stop(false);
    ensureFieldFx();
    const nextZone = IdleZones?.get?.(nextId);
    // 過圖黑幕期間並行預載下一張地圖＋怪物幀
    const preloadP = preloadZoneAssets(nextZone);
    await fadeField(1, MAP_FADE_MS);
    if (seq !== transitionSeq) return false;

    if (fromUser) state.afkHoldAdvance = false;
    state.zoneId = nextId;
    stopChapterBossTimer();
    state.huntMode = 'mob';
    state.atkAcc = 0;
    resetMobAtk();
    combatPaused = false;
    state.dying = [];
    state.queue = [];
    clearFieldDrops(true);
    await preloadP;
    if (seq !== transitionSeq) return false;

    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    stage?.querySelectorAll('.idle-actor--mob').forEach((node) => node.remove());
    fillQueue();
    save();
    render();
    if (typeof UiIdleGmDrops !== 'undefined') UiIdleGmDrops.syncHuntZone?.(nextId);
    await ensureVisibleMobSpritesReady();
    if (seq !== transitionSeq) return false;

    await fadeField(0, MAP_FADE_MS);
    if (seq !== transitionSeq) return false;

    const shouldResume = !!(fieldTransition && fieldTransition.resumeAfter);
    fieldTransition = null;
    if (shouldResume) start();
    else render();
    return true;
  }

  function isBlockingPanelOpen() {
    const shop = $('npcShopRoot');
    if (shop && !shop.classList.contains('hidden')) return true;
    const hammer = $('toadsHammerRoot');
    if (hammer && !hammer.classList.contains('hidden')) return true;
    return false;
  }

  function syncBlockingPanelPause() {
    if (!open) {
      resumeAfterPanelClose = false;
      return;
    }
    if (isBlockingPanelOpen()) {
      if (state.running) {
        resumeAfterPanelClose = true;
        stop(true);
      }
      return;
    }
    if (resumeAfterPanelClose && !isPlayerDead() && canFight()) {
      resumeAfterPanelClose = false;
      start();
      return;
    }
    resumeAfterPanelClose = false;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (Number.isFinite(saved.kills) && saved.kills >= 0) state.kills = Math.floor(saved.kills);
      if (Number.isFinite(saved.gold) && saved.gold >= 0) state.gold = Math.floor(saved.gold);
      if (Number.isInteger(saved.nextLetter) && saved.nextLetter >= 0) {
        state.nextLetter = saved.nextLetter;
      }
      if (saved.zoneId) state.zoneId = String(saved.zoneId);
      if (saved.huntMode === 'boss' || saved.huntMode === 'mob') state.huntMode = saved.huntMode;
      if (saved.mapKills && typeof saved.mapKills === 'object') state.mapKills = saved.mapKills;
      if (saved.bossCleared && typeof saved.bossCleared === 'object') state.bossCleared = saved.bossCleared;
      if (saved.replayKills && typeof saved.replayKills === 'object') state.replayKills = saved.replayKills;
      if (Number.isFinite(saved.hp) && saved.hp >= 0) state.hp = Math.floor(saved.hp);
      if (Number.isFinite(saved.maxHp) && saved.maxHp > 0) state.maxHp = Math.floor(saved.maxHp);
      if (saved.afkMode === 'off' || saved.afkMode === 'push' || saved.afkMode === 'farm') {
        state.afkMode = saved.afkMode;
      } else {
        state.afkMode = saved.afk === false ? 'off' : 'push';
      }
      state.afk = state.afkMode !== 'off';
      state.afkHoldAdvance = !!saved.afkHoldAdvance;
    } catch (_) { /* ignore */ }
    if (state.zoneId === 'mapleisland-10000') state.zoneId = 'mapleisland-1';
    if (typeof IdleZones !== 'undefined') {
      state.zoneId = IdleZones.clampId(state.zoneId);
    }
  }

  function save(opts = {}) {
    if (opts.flush) {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = 0;
      }
      writeSave();
      return;
    }
    if (saveTimer) return;
    saveTimer = window.setTimeout(() => {
      saveTimer = 0;
      writeSave();
    }, 400);
  }

  function writeSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        kills: state.kills,
        gold: state.gold,
        nextLetter: state.nextLetter,
        zoneId: state.zoneId,
        huntMode: state.huntMode,
        mapKills: state.mapKills,
        bossCleared: state.bossCleared,
        replayKills: state.replayKills,
        hp: state.hp,
        maxHp: state.maxHp,
        afk: state.afk,
        afkMode: state.afkMode,
        afkHoldAdvance: state.afkHoldAdvance,
      }));
    } catch (_) { /* ignore */ }
  }

  function getSavePayload() {
    save({ flush: true });
    return {
      kills: state.kills,
      gold: state.gold,
      nextLetter: state.nextLetter,
      zoneId: state.zoneId,
      huntMode: state.huntMode,
      mapKills: state.mapKills && typeof state.mapKills === 'object' ? { ...state.mapKills } : {},
      bossCleared: state.bossCleared && typeof state.bossCleared === 'object' ? { ...state.bossCleared } : {},
      replayKills: state.replayKills && typeof state.replayKills === 'object' ? { ...state.replayKills } : {},
      hp: state.hp,
      maxHp: state.maxHp,
      afk: state.afk,
      afkMode: state.afkMode,
      afkHoldAdvance: state.afkHoldAdvance,
    };
  }

  function applySavePayload(saved) {
    if (!saved || typeof saved !== 'object') return false;
    try {
      if (Number.isFinite(saved.kills) && saved.kills >= 0) state.kills = Math.floor(saved.kills);
      if (Number.isFinite(saved.gold) && saved.gold >= 0) state.gold = Math.floor(saved.gold);
      if (Number.isInteger(saved.nextLetter) && saved.nextLetter >= 0) {
        state.nextLetter = saved.nextLetter;
      }
      if (saved.zoneId) state.zoneId = String(saved.zoneId);
      if (saved.huntMode === 'boss' || saved.huntMode === 'mob') state.huntMode = saved.huntMode;
      if (saved.mapKills && typeof saved.mapKills === 'object') state.mapKills = { ...saved.mapKills };
      if (saved.bossCleared && typeof saved.bossCleared === 'object') state.bossCleared = { ...saved.bossCleared };
      if (saved.replayKills && typeof saved.replayKills === 'object') state.replayKills = { ...saved.replayKills };
      if (Number.isFinite(saved.hp) && saved.hp >= 0) state.hp = Math.floor(saved.hp);
      if (Number.isFinite(saved.maxHp) && saved.maxHp > 0) state.maxHp = Math.floor(saved.maxHp);
      if (saved.afkMode === 'off' || saved.afkMode === 'push' || saved.afkMode === 'farm') {
        state.afkMode = saved.afkMode;
      } else if (saved.afk != null) {
        state.afkMode = saved.afk === false ? 'off' : 'push';
      }
      state.afk = state.afkMode !== 'off';
      state.afkHoldAdvance = !!saved.afkHoldAdvance;
    } catch (_) { /* ignore */ }
    if (state.zoneId === 'mapleisland-10000') state.zoneId = 'mapleisland-1';
    if (typeof IdleZones !== 'undefined') {
      state.zoneId = IdleZones.clampId(state.zoneId);
    }
    writeSave();
    syncInventoryMesoDisplay();
    try { fillQueue(); } catch (_) { /* ignore */ }
    if (open) {
      try { render(); } catch (_) { /* ignore */ }
    }
    return true;
  }

  function smallKillNeed(zoneId) {
    if (typeof IdleZones === 'undefined') return 100;
    const z = IdleZones.get(zoneId || state.zoneId);
    const n = Number(IdleZones.configFor(z).smallKills);
    if (!Number.isFinite(n) || n < 0) return IdleZones.SMALL_KILLS || 100;
    return Math.floor(n);
  }

  function mapKillCount(zoneId) {
    return Math.max(0, Math.floor(Number(state.mapKills[zoneId || state.zoneId]) || 0));
  }

  function replayNeed(zoneId) {
    if (typeof IdleZones === 'undefined') return 10;
    const z = IdleZones.get(zoneId || state.zoneId);
    const n = Number(IdleZones.configFor(z).replayBossKills);
    if (!Number.isFinite(n) || n < 0) return IdleZones.REPLAY_BOSS_KILLS || 10;
    return Math.floor(n);
  }

  function replayKillCount(zoneId) {
    return Math.max(0, Math.floor(Number(state.replayKills[zoneId || state.zoneId]) || 0));
  }

  function deathKillPenaltyAmount(before) {
    const n = Math.max(0, Math.floor(Number(before) || 0));
    if (n <= 0) return 0;
    return Math.min(n, Math.max(1, Math.ceil(n * DEATH_KILL_PENALTY_RATE)));
  }

  function applyDeathKillPenalty(zoneId) {
    if (state.dungeon) return 0;
    const zid = zoneId || state.zoneId;
    if (isBossCleared(zid)) {
      const before = replayKillCount(zid);
      const penalty = deathKillPenaltyAmount(before);
      if (penalty <= 0) return 0;
      const after = Math.max(0, before - penalty);
      state.replayKills[zid] = after;
      return before - after;
    }
    const before = mapKillCount(zid);
    const penalty = deathKillPenaltyAmount(before);
    if (penalty <= 0) return 0;
    const after = Math.max(0, before - penalty);
    state.mapKills[zid] = after;
    return before - after;
  }

  function applyDeathExpPenalty() {
    // 僅章節小怪地圖；副本與 BOSS 挑戰不扣經驗
    if (state.dungeon || state.huntMode === 'boss') return { lost: 0, rate: 0 };
    if (typeof CharacterProgression === 'undefined'
      || typeof CharacterProgression.loseExpPercent !== 'function') {
      return { lost: 0, rate: 0 };
    }
    const level = Math.max(1, Math.floor(Number(CharacterProgression.getState?.()?.level) || 1));
    const rate = deathExpPenaltyRate(level);
    return CharacterProgression.loseExpPercent(rate) || { lost: 0, rate };
  }

  function deathPenaltyText(killDeducted, expLost) {
    const parts = [];
    if (killDeducted > 0) parts.push(`擊殺進度 -${killDeducted}`);
    if (expLost > 0) {
      const n = typeof formatCount === 'function' ? formatCount(expLost) : String(Math.floor(expLost));
      parts.push(`經驗 -${n}`);
    }
    return parts.length ? `，${parts.join('，')}` : '';
  }

  /** 彈窗用懲罰文案（無前導逗號） */
  function deathPenaltyModalMsg(killDeducted, expLost) {
    return deathPenaltyText(killDeducted, expLost).replace(/^，/, '');
  }

  /** 章節（非副本）死亡用彈窗 */
  function shouldShowChapterDeathModal() {
    return !state.dungeon;
  }

  /** 託管／掛機才 5 秒自動復活；自動推圖改手動按復活 */
  function shouldDeathAutoRevive() {
    if (typeof IdlePlayerDeathFlow !== 'undefined' && IdlePlayerDeathFlow.shouldAutoRevive) {
      return IdlePlayerDeathFlow.shouldAutoRevive({
        dungeon: !!state.dungeon,
        afkMode: state.afkMode,
      });
    }
    return shouldShowChapterDeathModal()
      && (state.afkMode === 'off' || state.afkMode === 'farm');
  }

  function isDeathUiLocked() {
    return shouldShowChapterDeathModal() && (deathModalOpen || isPlayerDead() || deathFxPending);
  }

  function clearDeathAutoRevive() {
    deathAutoReviveCtrl?.stop?.();
    deathAutoReviveCtrl = null;
    deathAutoReviveLeft = 0;
  }

  function ensureDeathModal() {
    const field = $('idleHuntField');
    if (!field) return;
    if (!$('idleHuntDeathModal')) {
      field.insertAdjacentHTML('beforeend', `
        <div id="idleHuntDeathModal" class="idle-boss-start-modal idle-hunt-death-modal" hidden>
          <div class="idle-boss-start-modal__card" role="dialog" aria-modal="true" aria-labelledby="idleHuntDeathTitle">
            <div id="idleHuntDeathTitle" class="idle-boss-start-modal__title">你已死亡</div>
            <p id="idleHuntDeathMsg" class="idle-boss-start-modal__msg"></p>
            <p id="idleHuntDeathAuto" class="idle-hunt-death-auto" hidden></p>
            <button type="button" id="idleHuntDeathRevive" class="idle-boss-start-btn">復活</button>
          </div>
        </div>
      `);
      $('idleHuntDeathRevive')?.addEventListener('click', (event) => {
        event.preventDefault();
        onDeathModalRevive();
      });
      return;
    }
    if (!$('idleHuntDeathAuto')) {
      $('idleHuntDeathRevive')?.insertAdjacentHTML(
        'beforebegin',
        '<p id="idleHuntDeathAuto" class="idle-hunt-death-auto" hidden></p>',
      );
    }
  }

  function syncDeathModal() {
    ensureDeathModal();
    if (!isPlayerDead() || state.dungeon) {
      clearDeathAutoRevive();
      deathModalOpen = false;
      deathModalMsg = '';
    }
    const modal = $('idleHuntDeathModal');
    if (!modal) return;
    const show = open && deathModalOpen && isPlayerDead() && !state.dungeon;
    modal.hidden = !show;
    modal.setAttribute('aria-hidden', show ? 'false' : 'true');
    const msg = $('idleHuntDeathMsg');
    if (msg) {
      const text = deathModalMsg || '';
      msg.textContent = text;
      msg.hidden = !text;
    }
    const autoEl = $('idleHuntDeathAuto');
    if (autoEl) {
      if (show && deathAutoReviveLeft > 0) {
        autoEl.hidden = false;
        autoEl.textContent = `${deathAutoReviveLeft} 秒後自動復活`;
      } else {
        autoEl.hidden = true;
        autoEl.textContent = '';
      }
    }
  }

  function startDeathAutoRevive() {
    clearDeathAutoRevive();
    if (!shouldDeathAutoRevive()) return;
    const sec = (typeof IdlePlayerDeathFlow !== 'undefined'
      && IdlePlayerDeathFlow.AUTO_REVIVE_SEC)
      ? IdlePlayerDeathFlow.AUTO_REVIVE_SEC
      : 5;
    if (typeof IdlePlayerDeathFlow !== 'undefined'
      && IdlePlayerDeathFlow.createAutoReviveCountdown) {
      deathAutoReviveCtrl = IdlePlayerDeathFlow.createAutoReviveCountdown({
        seconds: sec,
        shouldContinue: () => deathModalOpen && isPlayerDead() && open && !state.dungeon,
        onTick: (left) => {
          deathAutoReviveLeft = left;
          syncDeathModal();
        },
        onDone: () => {
          deathAutoReviveLeft = 0;
          syncDeathModal();
          onDeathModalRevive();
        },
      });
      deathAutoReviveCtrl.start();
      return;
    }
    deathAutoReviveLeft = sec;
    syncDeathModal();
  }

  function showChapterDeathModal(penaltyMsg) {
    deathModalOpen = true;
    deathModalMsg = String(penaltyMsg || '');
    startDeathAutoRevive();
    syncDeathModal();
  }

  function hideChapterDeathModal(opts = {}) {
    clearDeathAutoRevive();
    deathModalOpen = false;
    if (!opts.keepMsg) deathModalMsg = '';
    if (opts.keepFx !== true && typeof IdlePlayerDeathFx !== 'undefined') {
      IdlePlayerDeathFx.cancel?.();
    }
    syncDeathModal();
  }

  /**
   * @returns {Promise<boolean>} true=已交由換圖流程負責 start
   */
  async function applyChapterDeathReviveAftermath() {
    if (state.dungeon) {
      if (isPlayerDead()) revivePlayer();
      return false;
    }
    if (!isAfkActive()) {
      if (state.huntMode === 'boss') failBossFight();
      if (isPlayerDead()) revivePlayer();
      return false;
    }
    if (state.afkMode === 'farm') {
      if (state.huntMode === 'boss') failBossFight();
      if (isPlayerDead()) revivePlayer();
      return false;
    }
    // 自動推圖：退回上一關，並改成掛機；等過圖結束再开战
    state.afkMode = 'farm';
    syncAfkFlag();
    state.afkHoldAdvance = false;
    if (isPlayerDead()) revivePlayer();
    const prev = prevZone();
    if (prev && typeof IdleZones !== 'undefined') {
      const ok = await runMapTransition(IdleZones.id(prev), false, { forceStart: true });
      return !!ok;
    }
    if (state.huntMode === 'boss') failBossFight();
    return false;
  }

  async function onDeathModalRevive() {
    if (deathReviveBusy) return;
    if (!deathModalOpen && !isPlayerDead()) return;
    deathReviveBusy = true;
    clearDeathAutoRevive();
    deathModalOpen = false;
    deathModalMsg = '';
    if (typeof IdlePlayerDeathFx !== 'undefined') IdlePlayerDeathFx.cancel?.();
    try {
      const mapHandledStart = await applyChapterDeathReviveAftermath();
      syncDeathModal();
      if (mapHandledStart) {
        save();
        return;
      }
      if (!state.dungeon && open) {
        start();
        save();
      } else {
        render();
      }
    } finally {
      deathReviveBusy = false;
    }
  }

  function isBossCleared(zoneId) {
    return !!state.bossCleared[zoneId || state.zoneId];
  }

  function canFightBoss() {
    if (state.huntMode === 'boss') return false;
    if (!isBossCleared()) return mapKillCount() >= smallKillNeed();
    const need = replayNeed();
    return need > 0 && replayKillCount() >= need;
  }

  function isAfkActive() {
    return state.afkMode === 'push' || state.afkMode === 'farm';
  }

  function syncAfkFlag() {
    state.afk = isAfkActive();
  }

  function afkModeLabel() {
    if (state.afkMode === 'push') return '自動推圖';
    if (state.afkMode === 'farm') return '掛機';
    return '託管';
  }

  function tryAfkStep() {
    if (state.dungeon) return;
    if (!isAfkActive() || !open || pickerOpen) return;
    if (!state.running || isPlayerDead() || !canFight()) return;
    if (state.huntMode === 'boss') return;
    if (canFightBoss()) {
      startBossFight();
      return;
    }
    // 掛機：只在當地圖刷王，不進下一關
    if (state.afkMode === 'farm') return;
    if (state.afkHoldAdvance) return;
    const nxt = nextZone();
    if (!nxt || typeof IdleZones === 'undefined') return;
    if (!isBossCleared() || !IdleZones.isUnlocked(nxt)) return;
    selectZone(IdleZones.id(nxt), false);
  }

  function handleAfkDeath() {
    // 章節死亡已改走彈窗／自動復活；此處僅處理副本結算
    if (!state.dungeon) return;
    if (typeof IdleDungeon !== 'undefined') IdleDungeon.onHuntDeath?.();
  }

  function cycleAfkMode() {
    if (state.afkMode === 'off') state.afkMode = 'push';
    else if (state.afkMode === 'push') state.afkMode = 'farm';
    else state.afkMode = 'off';
    syncAfkFlag();
    if (state.afkMode !== 'push') {
      state.afkHoldAdvance = false;
      // 過圖途中改掉推圖：本趟淡入後不要自動開打／連跳
      if (fieldTransition?.resumeAfter) fieldTransition.resumeAfter = false;
      if (afkStepTimer != null) {
        window.clearTimeout(afkStepTimer);
        afkStepTimer = null;
      }
    }
    save();
    render();
    if (isAfkActive() && state.running) scheduleAfkStep(0);
  }

  /**
   * 外部（副本／BOSS 自動挑戰結束）切換託管模式。
   * @param {'off'|'push'|'farm'} mode
   * @param {{ resume?: boolean }} [opts] resume≠false 時確保開著狩獵並開打
   */
  function setAfkMode(mode, opts = {}) {
    const next = (mode === 'push' || mode === 'farm' || mode === 'off') ? mode : 'off';
    state.afkMode = next;
    syncAfkFlag();
    state.afkHoldAdvance = false;
    if (next !== 'push') {
      if (fieldTransition?.resumeAfter) fieldTransition.resumeAfter = false;
    }
    if (afkStepTimer != null) {
      window.clearTimeout(afkStepTimer);
      afkStepTimer = null;
    }
    save();
    if (opts.resume !== false) {
      if (!open) setOpen(true);
      if (!state.running && !isPlayerDead() && canFight() && !jobLinePickerOpen && !isBlockingPanelOpen()) {
        start();
      }
      if (isAfkActive() && state.running) scheduleAfkStep(80);
    }
    if (open) render();
  }

  function toggleAfk() {
    cycleAfkMode();
  }

  function prevZone() {
    if (typeof IdleZones === 'undefined') return null;
    const cur = IdleZones.get(state.zoneId);
    if (typeof IdleZones.prevBefore === 'function') {
      return IdleZones.prevBefore(cur);
    }
    const all = typeof IdleZones.orderedMaps === 'function' ? IdleZones.orderedMaps() : IdleZones.list;
    const i = (all || []).findIndex((z) => IdleZones.id(z) === IdleZones.id(cur));
    return i > 0 ? all[i - 1] : null;
  }

  function nextZone() {
    if (typeof IdleZones === 'undefined') return null;
    const cur = IdleZones.get(state.zoneId);
    if (typeof IdleZones.nextAfter === 'function') {
      return IdleZones.nextAfter(cur);
    }
    const all = typeof IdleZones.orderedMaps === 'function' ? IdleZones.orderedMaps() : IdleZones.list;
    const i = (all || []).findIndex((z) => IdleZones.id(z) === IdleZones.id(cur));
    return i >= 0 && i < all.length - 1 ? all[i + 1] : null;
  }

  function readHitDamage(isBoss) {
    if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.getHuntHitDamage === 'function') {
      const n = Number(UiCharacterInfo.getHuntHitDamage(!!isBoss));
      return Number.isFinite(n) && n > 0 ? n : 0;
    }
    return 0;
  }

  function rollHitDamage(isBoss) {
    if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.rollHuntHit === 'function') {
      return UiCharacterInfo.rollHuntHit(!!isBoss);
    }
    return { dmg: readHitDamage(isBoss), isCritical: false };
  }

  function attackDelaySec() {
    if (typeof WeaponTypeMap !== 'undefined' && typeof WeaponTypeMap.calculateActionDelayMs === 'function') {
      const base = Number(WeaponTypeMap.BASIC_ATTACK_BASE_DELAY_MS) || 360;
      const ms = Number(WeaponTypeMap.calculateActionDelayMs(
        base,
        currentWzAttackSpeed(),
        WeaponTypeMap.getSpeedModifiers?.() || 0
      )) || 360;
      return Math.max(0.03, ms / 1000);
    }
    return 0.36;
  }

  function canFight() {
    return readHitDamage(state.huntMode === 'boss') > 0;
  }

  function readPower() {
    if (typeof UiCharacterInfo === 'undefined' || typeof UiCharacterInfo.getCombatPower !== 'function') {
      return 0;
    }
    const n = Number(UiCharacterInfo.getCombatPower());
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function currentMonsterHp(isBoss) {
    const dungeon = state.dungeon;
    if (dungeon?.type === 'damage' && isBoss) {
      // 傷害試煉：血量設成實務上打不死
      return 1e15;
    }
    if (dungeon) {
      const map = dungeon.map || {};
      const base = isBoss
        ? (Number(map.baseBossHp) || Number(map.baseMobHp) * 18 || DEFAULT_MONSTER_HP * 18)
        : (Number(map.baseMobHp) || DEFAULT_MONSTER_HP);
      const mult = Number(dungeon.hpMult);
      const hp = Number.isFinite(base) && base > 0 ? base : DEFAULT_MONSTER_HP;
      return Math.max(1, Math.floor(hp * (Number.isFinite(mult) && mult > 0 ? mult : 1)));
    }
    if (typeof IdleZones === 'undefined' || typeof IdleZones.rewardsFor !== 'function') {
      return isBoss ? DEFAULT_MONSTER_HP * 18 : DEFAULT_MONSTER_HP;
    }
    const hp = Number(IdleZones.rewardsFor(IdleZones.get(state.zoneId), !!isBoss).monsterHp);
    return Number.isFinite(hp) && hp > 0 ? hp : DEFAULT_MONSTER_HP;
  }

  function zoneActors(isBoss) {
    if (state.dungeon?.map) {
      const map = state.dungeon.map;
      if (isBoss) return { name: map.bossName || '副本 BOSS', iconId: map.bossIcon || '' };
      const pick = typeof IdleDungeonStore !== 'undefined' && IdleDungeonStore.pickRandomMob
        ? IdleDungeonStore.pickRandomMob(map)
        : (() => {
          const pool = Array.isArray(map.mobs) && map.mobs.length
            ? map.mobs
            : [{ name: map.mobName, icon: map.mobIcon }];
          return pool[Math.floor(Math.random() * pool.length)] || pool[0];
        })();
      return {
        name: pick?.name || map.mobName || '副本怪物',
        iconId: pick?.icon || pick?.mobIcon || map.mobIcon || '',
      };
    }
    if (typeof IdleZones === 'undefined') {
      return { name: isBoss ? 'BOSS' : '怪物', iconId: '' };
    }
    const cfg = IdleZones.configFor(IdleZones.get(state.zoneId));
    if (isBoss) return { name: cfg.bossName, iconId: cfg.bossIcon };
    const pick = typeof IdleZones.pickRandomMob === 'function'
      ? IdleZones.pickRandomMob(cfg)
      : null;
    return {
      name: pick?.name || cfg.mobName,
      iconId: pick?.icon || pick?.mobIcon || cfg.mobIcon,
    };
  }

  function currentWzAttackSpeed() {
    if (typeof WeaponTypeMap === 'undefined'
      || typeof WeaponTypeMap.getEquippedWzAttackSpeed !== 'function') {
      return WeaponTypeMap?.DEFAULT_WZ_ATTACK_SPEED || 6;
    }
    const jobName = typeof CharacterCombatPanel !== 'undefined'
      ? CharacterCombatPanel.getState?.()?.jobName
      : '';
    const getWorn = typeof UiEquipModule !== 'undefined'
      ? (slotId) => UiEquipModule.getWornEntry?.(slotId)
      : null;
    return WeaponTypeMap.getEquippedWzAttackSpeed(getWorn, jobName);
  }

  /** @deprecated 名稱易誤解；延遲請用 currentWzAttackSpeed */
  function currentAttackSpeedStage() {
    return currentWzAttackSpeed();
  }

  function spawnMonster(isBoss) {
    const boss = !!isBoss || state.huntMode === 'boss';
    spawnSeq += 1;
    const hp = currentMonsterHp(boss);
    const actor = zoneActors(boss);
    let scaleSprite = false;
    let scaleHud = false;
    if (boss && typeof IdleZones !== 'undefined') {
      const cfg = state.dungeon?.map
        ? null
        : IdleZones.configFor(IdleZones.get(state.zoneId));
      // 副本 map 也可帶同名字段；沒有就 false
      const src = state.dungeon?.map || cfg;
      scaleSprite = !!src?.bossScaleSprite;
      scaleHud = !!src?.bossScaleHud;
    }
    return {
      uid: spawnSeq,
      hp,
      maxHp: hp,
      isBoss: boss,
      name: actor.name,
      iconId: actor.iconId,
      bossScaleSprite: scaleSprite,
      bossScaleHud: scaleHud,
      zBatch: 0,
    };
  }

  function assignMobBatch(mobs) {
    if (!mobs?.length) return;
    mobBatchSeq += 1;
    const batch = mobBatchSeq;
    mobs.forEach((m) => { m.zBatch = batch; });
  }

  /** 同批：隊列第 1 隻最高、第 10 隻最低；新批整體 > 舊批與技能投擲物 */
  function mobStackZ(mob, queueIndex) {
    const batch = Math.max(1, Number(mob?.zBatch) || 1);
    const i = Math.max(0, Math.min(VISIBLE_QUEUE_LEN - 1, Number(queueIndex) || 0));
    const rank = VISIBLE_QUEUE_LEN - i;
    return MOB_Z_LIVE_FLOOR + batch * (VISIBLE_QUEUE_LEN + 1) + rank;
  }

  function mobQueueIndex(mob) {
    const uid = mob?.uid != null ? String(mob.uid) : '';
    if (!uid) return -1;
    return state.queue.findIndex((m) => m && String(m.uid) === uid);
  }

  /** 可見 10 格用 spawn 座標；第 11+ 隻沿隊列方向延伸到畫面外（供傷害判定） */
  function queueMobSpacing(zone) {
    const z = zone || (typeof IdleZones !== 'undefined' ? currentZone() : null);
    const visible = typeof IdleZones !== 'undefined'
      ? IdleZones.spawn(z, VISIBLE_QUEUE_LEN)
      : { mobs: [{ x: 360, y: 390 }] };
    const m0 = visible.mobs[0] || { x: 360, y: 390 };
    const mLast = visible.mobs[VISIBLE_QUEUE_LEN - 1] || m0;
    const spacing = VISIBLE_QUEUE_LEN <= 1
      ? 44
      : (Number(mLast.x) - Number(m0.x)) / (VISIBLE_QUEUE_LEN - 1);
    return {
      spacing: Number.isFinite(spacing) && spacing > 0 ? spacing : 44,
      y: Number(mLast.y) || Number(m0.y) || 390,
      m0,
      mLast,
      visible: visible.mobs || [],
    };
  }

  function queueMobPoint(queueIndex) {
    const idx = Math.max(0, Number(queueIndex) || 0);
    const { spacing, y, m0, mLast, visible } = queueMobSpacing(currentZone());
    if (idx < VISIBLE_QUEUE_LEN && visible[idx]) {
      return { x: Number(visible[idx].x) || 0, y: Number(visible[idx].y) || y };
    }
    const anchor = mLast || m0;
    const ax = Number(anchor.x) || 360;
    return {
      x: ax + (idx - (VISIBLE_QUEUE_LEN - 1)) * spacing,
      y: Number(anchor.y) || y,
    };
  }

  /** IdleZones 隊列最右側出生點（第 11 格／場外進場） */
  function queueEntryPoint(zone, spawnPack) {
    const spawn = spawnPack || (typeof IdleZones !== 'undefined'
      ? IdleZones.spawn(zone || currentZone(), VISIBLE_QUEUE_LEN + 1)
      : { mobs: [{ x: 360, y: 390 }] });
    const mobs = spawn.mobs || [];
    const last = mobs[mobs.length - 1];
    if (last) {
      return { x: Number(last.x) || 360, y: Number(last.y) || 390 };
    }
    return { x: 360, y: 390 };
  }

  function queueStepCount(fromPoint, toPoint) {
    const spacing = queueMobSpacing(currentZone()).spacing;
    const dx = Math.abs((Number(toPoint?.x) || 0) - (Number(fromPoint?.x) || 0));
    return Math.max(1, Math.round(dx / spacing) || 1);
  }

  /** 取消補位 walk 並凍結在目前畫面位置（含進行中的 CSS transition） */
  function stopMobMovement(el) {
    if (!el) return;
    el.dataset.walkToken = String(++mobWalkSeq);
    const moving = el.classList.contains('is-moving');
    el.classList.remove('is-moving');
    el.dataset.moveUntil = '0';
    el.style.transition = 'none';
    if (!moving) return;
    const cs = window.getComputedStyle(el);
    const left = parseFloat(cs.left);
    const top = parseFloat(cs.top);
    if (Number.isFinite(left) && Number.isFinite(top)) {
      el.style.left = `${Math.round(left)}px`;
      el.style.top = `${Math.round(top)}px`;
      return;
    }
    const stage = el.closest('.idle-hunt-stage');
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const ar = el.getBoundingClientRect();
    el.style.left = `${Math.round(ar.left - sr.left)}px`;
    el.style.top = `${Math.round(ar.top - sr.top)}px`;
  }

  /** 固定速度走到目標格（步數 × MOVE_MS）；可錯開 delay 做隊列節奏 */
  function runMobWalkTo(el, mob, targetPoint, opts = {}) {
    if (!el || !targetPoint || el.dataset.introLock || el.classList.contains('is-dying')) return;
    const steps = Math.max(1, Number(opts.steps) || 1);
    const delayMs = scaleDelayMs(Math.max(0, Number(opts.delayMs) || 0));
    const baseMs = typeof IdleMobAnim !== 'undefined' ? IdleMobAnim.MOVE_MS : 320;
    const speed = Math.max(0.25, Number(MOB_QUEUE_MOVE_SPEED) || 1);
    const ms = Math.round(scaleDelayMs((baseMs * steps) / speed));

    const run = () => {
      if (!el.isConnected || el.dataset.introLock || el.classList.contains('is-dying')) return;
      const tx = Math.round(Number(targetPoint.x) || 0);
      const ty = Math.round(Number(targetPoint.y) || 0);
      const prevX = parsePx(el.style.left);
      if (prevX != null && Math.abs(prevX - tx) <= 2) return;

      bindMobSprite(el, mob, 'move');
      el.classList.add('is-moving');
      el.dataset.moveUntil = String(Date.now() + ms);
      el.style.transition = `left ${ms}ms linear, top ${ms}ms linear`;
      el.style.top = `${ty}px`;
      el.style.left = `${tx}px`;
    };

    if (delayMs > 0) {
      const token = String(++mobWalkSeq);
      el.dataset.walkToken = token;
      window.setTimeout(() => {
        if (!el?.isConnected || el.dataset.walkToken !== token) return;
        run();
      }, delayMs);
    } else {
      run();
    }
  }

  /** 新怪：先站在隊列最右側，再依步數／錯開時間走進目標格 */
  function runMobEnterFromRight(el, mob, targetPoint, entryPoint, opts = {}) {
    if (!el || !targetPoint || el.dataset.introLock || el.classList.contains('is-dying')) return;
    const entry = entryPoint || queueEntryPoint();
    const steps = queueStepCount(entry, targetPoint);
    el.classList.remove('is-moving');
    el.dataset.moveUntil = '0';
    el.style.transition = 'none';
    el.style.left = `${Math.round(Number(entry.x) || 0)}px`;
    el.style.top = `${Math.round(Number(entry.y) || 0)}px`;
    bindMobSprite(el, mob, 'move');
    requestAnimationFrame(() => {
      if (!el?.isConnected || el.dataset.introLock || el.classList.contains('is-dying')) return;
      runMobWalkTo(el, mob, targetPoint, { steps, delayMs: opts.delayMs || 0 });
    });
  }

  function mobFieldPoint(mob) {
    const idx = mobQueueIndex(mob);
    if (idx < 0) return null;
    return queueMobPoint(idx);
  }

  function isMobVisibleInField(mob) {
    const idx = mobQueueIndex(mob);
    if (idx >= 0 && idx < VISIBLE_QUEUE_LEN) return true;
    // 已移出佇列但 DOM 仍在（死亡動畫中）也視為可見
    const uid = mob?.uid != null ? String(mob.uid) : '';
    if (!uid) return false;
    return !!$('idleHuntField')?.querySelector(`.idle-actor--mob[data-uid="${uid}"]`);
  }

  function mobActorEl(uid) {
    const id = uid != null ? String(uid) : '';
    if (!id) return null;
    return $('idleHuntField')?.querySelector(`.idle-actor--mob[data-uid="${id}"]`) || null;
  }

  function applyMobStackZ(el, mob, queueIndex, isDying) {
    if (!el) return;
    el.style.zIndex = isDying
      ? String(MOB_Z_DYING)
      : String(mobStackZ(mob, queueIndex));
  }

  function respawnMobs() {
    state.queue = [];
    state.dying = [];
    resetMobAtk();
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    stage?.querySelectorAll('.idle-actor--mob').forEach((el) => el.remove());
    fillQueue();
    if (open) render();
  }

  function fillQueue() {
    if (fieldTransition?.kind === 'bossIntro' && fieldTransition.phase === 'warning') {
      return;
    }
    // 靜默丟掉已死占槽者（獎勵應已在 applySkillMobStateSync／applyKill 發過）
    state.queue = (state.queue || []).filter((m) => (
      m && (Number(m.hp) > 0 || keepDamageTrialBossAlive(m))
    ));
    if (state.huntMode === 'boss') {
      state.queue = state.queue.filter((mob) => mob.isBoss);
      if (!state.queue.length) {
        const boss = spawnMonster(true);
        assignMobBatch([boss]);
        state.queue.push(boss);
      }
      return;
    }
    const created = [];
    while (state.queue.length < QUEUE_LEN) {
      const mob = spawnMonster(false);
      created.push(mob);
      state.queue.push(mob);
    }
    if (created.length) assignMobBatch(created);
  }

  function formatCount(n) {
    return Math.floor(Number(n) || 0).toLocaleString('zh-TW');
  }

  function formatGoldText(n) {
    const amount = Math.floor(Number(n) || 0);
    if (typeof formatPower === 'function') return formatPower(amount);
    if (typeof formatMesoParts === 'function') return formatMesoParts(amount);
    return formatCount(amount);
  }

  function syncInventoryMesoDisplay() {
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.updateMesoDisplay?.();
    }
    if (typeof TrunkModule !== 'undefined' && TrunkModule.isOpen?.()) {
      TrunkModule.updateMesoDisplay?.();
    }
  }

  function playerMaxHp() {
    if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.getHuntMaxHp === 'function') {
      const n = Math.floor(Number(UiCharacterInfo.getHuntMaxHp()) || 0);
      if (n > 0) return n;
    }
    let level = 1;
    let bonusHp = 0;
    let hpPct = 0;
    if (typeof CharacterProgression !== 'undefined') {
      const st = CharacterProgression.getState?.() || {};
      level = Math.max(1, Number(st.level) || 1);
      const bonus = CharacterProgression.getCombatBonus?.() || {};
      bonusHp = Number(bonus.hp) || 0;
      hpPct = Number(bonus.hpPercent) || 0;
    }
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
      const mods = SkillModifiers.getTotals();
      bonusHp += (Number(mods.flatHpPerLevel) || 0) * level;
      hpPct += Number(mods.mhpR) || 0;
    }
    const base = typeof CharacterProgression !== 'undefined'
      && typeof CharacterProgression.getLevelBaseHp === 'function'
      ? CharacterProgression.getLevelBaseHp(level)
      : (50 + Math.max(0, level - 1) * 12);
    return Math.max(1, Math.floor((base + bonusHp) * (1 + hpPct / 100)));
  }

  function syncPlayerHp(opts) {
    const max = playerMaxHp();
    const prevMax = Number(state.maxHp) || 0;
    const wasDead = (Number(state.hp) || 0) <= 0 && state.hp != null;
    if (opts?.fill || state.hp == null || !(Number(state.hp) >= 0)) {
      state.hp = max;
    } else if (!wasDead && max > prevMax && prevMax > 0) {
      // 死亡中不因換裝加血而「假復活」，避免死亡 UI 卡死
      state.hp += max - prevMax;
    }
    state.maxHp = max;
    if (state.hp > max) state.hp = max;
    if (state.hp < 0) state.hp = 0;
    return { hp: state.hp, maxHp: state.maxHp };
  }

  function isPlayerDead() {
    return (Number(state.hp) || 0) <= 0;
  }

  function revivePlayer() {
    playerHurtIframeUntil = 0;
    syncPlayerHp({ fill: true });
    save();
  }

  function isPlayerHurtIframe() {
    return Date.now() < playerHurtIframeUntil;
  }

  function grantPlayerHurtIframe() {
    playerHurtIframeUntil = Date.now() + scaleDelayMs(PLAYER_HURT_IFRAME_MS);
  }

  function failBossFight() {
    if (state.huntMode !== 'boss' || state.dungeon) return;
    stopChapterBossTimer();
    state.huntMode = 'mob';
    state.atkAcc = 0;
    resetMobAtk();
    state.dying = [];
    state.queue = [];
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    stage?.querySelectorAll('.idle-actor--mob').forEach((el) => el.remove());
    fillQueue();
    save();
  }

  function resetMobAtkAccums() {
    state.mobHitAcc = 0;
    state.mobAtk2Acc = 0;
    state.mobAtk3Acc = 0;
    state.mobSkill1Acc = 0;
    state.mobSkill2Acc = 0;
    state.mobSkill3Acc = 0;
    state.lastMobCastAction = '';
  }

  function resetMobAtk() {
    resetMobAtkAccums();
    state.mobFrontUid = 0;
  }

  function readPlayerDefense() {
    if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.getHuntDefense === 'function') {
      const d = UiCharacterInfo.getHuntDefense() || {};
      return {
        def: Math.max(0, Number(d.def) || 0),
        mdef: Math.max(0, Number(d.mdef) || 0),
      };
    }
    return { def: 0, mdef: 0 };
  }

  /** 官方物理減傷公式（物理／魔法統一，見 MapleExpTable.mobHitTakenDamage） */
  function mitigateMobDamage(raw, _isSkill, mobLevel) {
    const atk = Math.max(0, Number(raw) || 0);
    if (!(atk > 0)) return 0;
    const pl = typeof CharacterProgression !== 'undefined'
      ? Math.max(1, Math.floor(Number(CharacterProgression.getState?.()?.level) || 1))
      : 1;
    const ml = Number.isFinite(Number(mobLevel))
      ? Math.max(1, Math.floor(Number(mobLevel)))
      : currentMobLevel(false);
    let mit = null;
    if (typeof UiCharacterInfo !== 'undefined' && typeof UiCharacterInfo.getHuntDamageMitigation === 'function') {
      mit = UiCharacterInfo.getHuntDamageMitigation();
    }
    if (!mit) {
      const { def } = readPlayerDefense();
      mit = { def, str: 0, dex: 0, int: 0, luk: 0, isWarrior: true, baselineKind: 'warrior' };
    }
    if (typeof MapleExpTable !== 'undefined' && typeof MapleExpTable.mobHitTakenDamage === 'function') {
      return MapleExpTable.mobHitTakenDamage(atk, mit.def, ml, pl, mit);
    }
    return Math.max(1, Math.floor(atk - mit.def * 0.5));
  }

  function mobAtkCfg(isBoss) {
    const cfg = state.dungeon?.map
      ? state.dungeon.map
      : (typeof IdleZones !== 'undefined'
        ? IdleZones.configFor(IdleZones.get(state.zoneId))
        : {});
    const num = (v, d = 0) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : d;
    };
    if (isBoss) {
      const atk1Dmg = cfg.bossAtk1Dmg != null ? cfg.bossAtk1Dmg : cfg.bossHitDmg;
      const atk1Cd = cfg.bossAtk1Cd != null ? cfg.bossAtk1Cd : cfg.bossHitCd;
      const skill1Dmg = cfg.bossSkill1Dmg != null ? cfg.bossSkill1Dmg : cfg.bossSkillDmg;
      const skill1Cd = cfg.bossSkill1Cd != null ? cfg.bossSkill1Cd : cfg.bossSkillCd;
      return scaleDungeonAtkDmg({
        atk1Dmg: Math.max(0, Math.floor(num(atk1Dmg, 0))),
        atk1Cd: Math.max(0, num(atk1Cd, 0)),
        atk2Dmg: Math.max(0, Math.floor(num(cfg.bossAtk2Dmg, 0))),
        atk2Cd: Math.max(0, num(cfg.bossAtk2Cd, 0)),
        atk3Dmg: Math.max(0, Math.floor(num(cfg.bossAtk3Dmg, 0))),
        atk3Cd: Math.max(0, num(cfg.bossAtk3Cd, 0)),
        skill1Dmg: Math.max(0, Math.floor(num(skill1Dmg, 0))),
        skill1Cd: Math.max(0, num(skill1Cd, 0)),
        skill2Dmg: Math.max(0, Math.floor(num(cfg.bossSkill2Dmg, 0))),
        skill2Cd: Math.max(0, num(cfg.bossSkill2Cd, 0)),
        skill3Dmg: Math.max(0, Math.floor(num(cfg.bossSkill3Dmg, 0))),
        skill3Cd: Math.max(0, num(cfg.bossSkill3Cd, 0)),
      });
    }
    const atk1Dmg = cfg.mobAtk1Dmg != null ? cfg.mobAtk1Dmg : cfg.mobHitDmg;
    const atk1Cd = cfg.mobAtk1Cd != null ? cfg.mobAtk1Cd : cfg.mobHitCd;
    const skill1Dmg = cfg.mobSkill1Dmg != null ? cfg.mobSkill1Dmg : cfg.mobSkillDmg;
    const skill1Cd = cfg.mobSkill1Cd != null ? cfg.mobSkill1Cd : cfg.mobSkillCd;
    return scaleDungeonAtkDmg({
      atk1Dmg: Math.max(0, Math.floor(num(atk1Dmg, 0))),
      atk1Cd: Math.max(0, num(atk1Cd, 0)),
      atk2Dmg: Math.max(0, Math.floor(num(cfg.mobAtk2Dmg, 0))),
      atk2Cd: Math.max(0, num(cfg.mobAtk2Cd, 0)),
      atk3Dmg: Math.max(0, Math.floor(num(cfg.mobAtk3Dmg, 0))),
      atk3Cd: Math.max(0, num(cfg.mobAtk3Cd, 0)),
      skill1Dmg: Math.max(0, Math.floor(num(skill1Dmg, 0))),
      skill1Cd: Math.max(0, num(skill1Cd, 0)),
      skill2Dmg: Math.max(0, Math.floor(num(cfg.mobSkill2Dmg, 0))),
      skill2Cd: Math.max(0, num(cfg.mobSkill2Cd, 0)),
      skill3Dmg: Math.max(0, Math.floor(num(cfg.mobSkill3Dmg, 0))),
      skill3Cd: Math.max(0, num(cfg.mobSkill3Cd, 0)),
    });
  }

  function scaleDungeonAtkDmg(atk) {
    if (!state.dungeon || !atk) return atk;
    let m = Number(state.dungeon.dmgMult);
    if (!Number.isFinite(m) || m <= 0) m = 1;
    if (state.dungeon.type === 'damage') {
      const ramp = typeof IdleDungeonStore !== 'undefined' && IdleDungeonStore.damageRampMult
        ? IdleDungeonStore.damageRampMult(state.dungeon, state.dungeon.damage)
        : (1 + Math.pow(Math.max(0, Number(state.dungeon.damage) || 0) / 100000, 0.5));
      m *= ramp;
    }
    if (m === 1) return atk;
    const next = { ...atk };
    ['atk1Dmg', 'atk2Dmg', 'atk3Dmg', 'skill1Dmg', 'skill2Dmg', 'skill3Dmg'].forEach((k) => {
      next[k] = Math.max(0, Math.floor((Number(next[k]) || 0) * m));
    });
    return next;
  }

  function keepDamageTrialBossAlive(mob) {
    if (!mob?.isBoss || state.dungeon?.type !== 'damage') return false;
    const max = Math.max(1, Number(mob.maxHp) || currentMonsterHp(true));
    mob.maxHp = max;
    mob.hp = max;
    return true;
  }

  function flashPlayerHurt() {
    const wrap = $('idleHuntHpBar');
    if (!wrap) return;
    wrap.classList.remove('is-hurt');
    void wrap.offsetWidth;
    wrap.classList.add('is-hurt');
  }

  function isMobCasting(el) {
    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.isActorCasting) {
      return IdleMobAnim.isActorCasting(el);
    }
    if (!el || el.classList.contains('is-dying')) return false;
    const skillUntil = Number(el.dataset.skillUntil) || 0;
    if (skillUntil > Date.now()) return true;
    const attackUntil = Number(el.dataset.attackUntil) || 0;
    return attackUntil > Date.now();
  }

  /** @param {string} actionName attack1|attack2|attack3|skill1 */
  function flashMobAttack(uid, actionName) {
    const el = $('idleHuntField')?.querySelector(`.idle-actor--mob[data-uid="${uid}"]`);
    if (!el || el.classList.contains('is-dying')) return false;
    if (typeof IdleMobAnim === 'undefined') return false;
    const img = el.querySelector('.idle-actor-sprite:not(.idle-actor-sprite--effect)');
    const iconId = img?.dataset.iconId || '';
    const ok = IdleMobAnim.flashActorAttack
      ? IdleMobAnim.flashActorAttack(el, actionName, { iconId, scaleDelayMs })
      : false;
    if (!ok) return false;
    const resolved = el.dataset.attackAction
      || img?.dataset?.kindAction
      || IdleMobAnim.actionForKind(actionName || 'attack1');
    const player = $('idleHuntField')?.querySelector('.idle-hunt-stage [data-sprite-slot="player"]');
    if (player && typeof IdleMobAnim.playPlayerHit === 'function'
      && resolved && !IdleMobAnim.hasAreaWarningAttack?.(iconId, resolved)) {
      IdleMobAnim.playPlayerHit(player, iconId, resolved);
    }
    return true;
  }

  function showPlayerDamage(dmg) {
    if (typeof DamageNumber === 'undefined') return;
    DamageNumber.spawnOnPlayer(dmg);
  }

  function showPlayerStatusLabel(label) {
    if (typeof DamageNumber === 'undefined') return;
    DamageNumber.spawnPlayerStatusLabel?.(label);
  }

  function currentMobLevel(isBoss) {
    if (state.dungeon) {
      const explicit = Number(state.dungeon.mobLevel);
      if (Number.isFinite(explicit) && explicit > 0) {
        return Math.max(1, Math.floor(explicit));
      }
      return 100;
    }
    if (typeof IdleZones === 'undefined') return 1;
    return IdleZones.mobLevelFor(IdleZones.get(state.zoneId));
  }

  function applyPowerGuardReflect(mob, incoming, reflectPct) {
    if (!mob || !(Number(mob.hp) > 0)) return;
    const pct = Math.max(0, Number(reflectPct) || 0);
    const raw = Math.max(0, Math.floor(Number(incoming) || 0));
    if (!(pct > 0 && raw > 0)) return;
    const reflected = Math.max(1, Math.floor(raw * pct / 100));
    const finalDmg = resolveMobHitDamage(mob, reflected);
    if (!(finalDmg > 0)) return;
    showMobDamage(mob, finalDmg, false);
    if (state.dungeon && typeof IdleDungeon !== 'undefined') {
      IdleDungeon.onHuntDamage?.(finalDmg);
    }
    mob.hp -= finalDmg;
    if (keepDamageTrialBossAlive(mob)) {
      flashHit(mob.uid);
      return;
    }
    if (mob.hp <= 0) applySkillMobStateSync([mob]);
    else flashHit(mob.uid);
  }

  function hurtPlayer(amount, opts = {}) {
    if (gmGodMode) return;
    if (!opts.ignoreHurtIframe && isPlayerHurtIframe()) return;
    let dmg = Math.max(0, Math.floor(Number(amount) || 0));
    if (!(dmg > 0) || isPlayerDead()) return;

    const ignoreMitigation = !!(opts.ignoreMitigation || opts.trueDamage);
    const mobLevel = Number.isFinite(Number(opts.mobLevel))
      ? Number(opts.mobLevel)
      : currentMobLevel(!!opts.isBoss);
    // 格擋：只依機率觸發「加強減傷」，不再全檔、不跳 guard
    let blocked = false;
    if (!ignoreMitigation) {
      if (typeof UiCharacterInfo !== 'undefined'
        && typeof UiCharacterInfo.rollMobHitOutcome === 'function') {
        const outcome = UiCharacterInfo.rollMobHitOutcome(mobLevel);
        // BOSS 傷害不套用命中／迴避：不會 Miss（格擋仍生效）
        if (outcome === 'miss' && !opts.isBoss) {
          showPlayerStatusLabel('Miss');
          return;
        }
        if (outcome === 'block') blocked = true;
      } else if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
        const block = Number(SkillModifiers.getTotals().blockPct) || 0;
        if (block > 0 && Math.random() * 100 < block) blocked = true;
      }

      // 減傷；格擋觸發：減傷 + 減傷×格擋率（例 40+40×50%=60%），上限 80%，不會無敵
      if (typeof UiCharacterInfo !== 'undefined'
        && typeof UiCharacterInfo.applyIncomingDamageReduction === 'function') {
        dmg = UiCharacterInfo.applyIncomingDamageReduction(dmg, {
          blocked,
          blockPct: blocked ? (Number(UiCharacterInfo.getHuntBlockPct?.()) || 0) : 0,
        });
      } else if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
        const totals = SkillModifiers.getTotals();
        const absorb = Math.min(80, Math.max(0, Number(totals.damAbsorbPct) || 0));
        const blockPct = blocked ? Math.min(100, Number(totals.blockPct) || 0) : 0;
        let reducePct = absorb;
        if (blockPct > 0) reducePct = absorb + absorb * (blockPct / 100);
        reducePct = Math.min(80, Math.max(0, reducePct));
        dmg = Math.max(0, Math.floor(dmg * (1 - reducePct / 100)));
      }

      // 技能／格擋之後再套防禦力（官方物防公式）
      if (dmg > 0) {
        dmg = mitigateMobDamage(dmg, false, mobLevel);
      }
    }

    if (!(dmg > 0)) {
      if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
        const reflectPct = Number(SkillModifiers.getTotals().reflectPct) || 0;
        if (reflectPct > 0 && opts.mob) {
          applyPowerGuardReflect(opts.mob, amount, reflectPct);
        }
      }
      return;
    }

    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
      const reflectPct = Number(SkillModifiers.getTotals().reflectPct) || 0;
      if (reflectPct > 0 && opts.mob) {
        applyPowerGuardReflect(opts.mob, amount, reflectPct);
      }
    }
    showPlayerDamage(dmg);
    syncPlayerHp();
    state.hp = Math.max(0, (Number(state.hp) || 0) - dmg);
    flashPlayerHurt();
    grantPlayerHurtIframe();
    if (typeof SkillComboOrbs !== 'undefined') {
      SkillComboOrbs.onPlayerHit?.();
      syncComboOrbsUi();
    }
    if (state.hp > 0 && typeof IdlePotionPanel !== 'undefined') {
      IdlePotionPanel.tryAutoDrink?.();
    }
    if (state.hp <= 0) {
      state.hp = 0;
      // 立刻打斷伊修塔爾等持續引導／非同步施放（勿等死亡演示結束才停）
      try { SkillCombat.invalidateAsyncCasts?.(); } catch (_) { /* ignore */ }
      try { Paperdoll.stopHuntSwingLoop?.(); } catch (_) { /* ignore */ }
      // IdleBoss 場地：只扣血，死亡演示／結算由 IdleBoss 處理（避免 FX 播在隱藏的狩獵場）
      if (typeof IdleBoss !== 'undefined' && IdleBoss.isArenaOpen?.()) {
        if (state.running) {
          state.running = false;
          stopTimer();
        }
        return;
      }
      if (deathFxPending) return;
      deathFxPending = true;
      const chapterBossFail = state.huntMode === 'boss' && !state.dungeon;
      // 先停戰；懲罰改在演示結束後結算，避免取消演示時已扣進度
      state.running = false;
      stopTimer();
      const finishDeath = () => {
        deathFxPending = false;
        if (!isPlayerDead()) return;
        const killPenalty = applyDeathKillPenalty();
        const expPenalty = applyDeathExpPenalty();
        const penaltyText = deathPenaltyText(killPenalty, expPenalty.lost || 0);
        const modalMsg = deathPenaltyModalMsg(killPenalty, expPenalty.lost || 0);
        if (state.dungeon) {
          if (chapterBossFail) {
            state.lastDrop = `BOSS 挑戰失敗${penaltyText}`;
          } else {
            state.lastDrop = `角色已倒下${penaltyText}`;
          }
          stop(true);
          if (typeof IdlePlayerDeathFx !== 'undefined') IdlePlayerDeathFx.cancel?.();
          handleAfkDeath();
          return;
        }
        if (chapterBossFail) {
          state.lastDrop = `BOSS 挑戰失敗${penaltyText}`;
        } else {
          state.lastDrop = `角色已倒下${penaltyText}`;
        }
        stop(true);
        showChapterDeathModal(modalMsg);
      };
      if (typeof IdlePlayerDeathFx !== 'undefined' && IdlePlayerDeathFx.play) {
        IdlePlayerDeathFx.play('field', {
          host: $('idleHuntField'),
          persist: !state.dungeon,
        }).then((ok) => {
          if (ok === false) {
            deathFxPending = false;
            // 演示被取消時：仍死亡則照常結算（副本也要，避免卡死需手動離開）
            if (isPlayerDead() && (state.dungeon || open)) finishDeath();
            return;
          }
          finishDeath();
        }, () => {
          deathFxPending = false;
          if (isPlayerDead() && (state.dungeon || open)) finishDeath();
        });
        return;
      }
      finishDeath();
    }
  }

  function syncComboOrbsUi() {
    const player = $('idleHuntField')?.querySelector('.idle-actor--player');
    if (!player) return;
    if (typeof SkillComboOrbs !== 'undefined' && typeof SkillComboOrbs.syncVisual === 'function') {
      SkillComboOrbs.syncVisual(player);
      return;
    }
    player.querySelector('.idle-combo-orbs')?.remove();
    player.querySelector('.idle-combo-orbit')?.remove();
  }

  function hasActiveLoadoutSkills() {
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined') {
      return false;
    }
    const loadout = CharacterSkills.currentLoadout?.() || [];
    return loadout.some((id) => {
      if (!id) return false;
      const skill = SkillCatalog.getSkill(id);
      if (!skill || !skill.equipable) return false;
      if (skill.type !== 'active' && skill.type !== 'buff') return false;
      return (CharacterSkills.getLevel(id) || 0) > 0;
    });
  }

  /**
   * 傷害後同步佇列（與 IdleBossFight.afterExternalHits 同一語意）：
   * 傳入的是「本次碰過／需檢查的 mob」，不是必殺名單；是否擊殺只看實際 hp。
   * （伊修塔爾等持續引導會每 tick 帶入未死目標做同步，不可因在清單內就秒殺。）
   *
   * 同一次呼叫堆疊／同一影格內多次 sync 會合併成一次結算，
   * 避免高速秒殺時 fillQueue／死亡動畫／存檔重複尖峰（獎勵不變）。
   */
  let mobStateSyncQueued = false;
  function applySkillMobStateSync(_touched) {
    if (mobStateSyncQueued) return;
    mobStateSyncQueued = true;
    const run = () => {
      mobStateSyncQueued = false;
      flushSkillMobStateSync();
    };
    if (typeof queueMicrotask === 'function') queueMicrotask(run);
    else Promise.resolve().then(run);
  }

  function flushSkillMobStateSync() {
    const remain = [];
    const toKill = [];
    state.queue.forEach((m) => {
      if (!m) return;
      if (keepDamageTrialBossAlive(m)) {
        remain.push(m);
        return;
      }
      if (m.hp <= 0) toKill.push(m);
      else remain.push(m);
    });
    // 先移出佇列再 applyKill，避免 applyKill→fillQueue 補怪後又被 remain 蓋掉
    state.queue = remain;
    toKill.forEach((m) => applyKill(m, { skipFillQueue: true, skipSave: true }));
    const front = state.queue[0];
    if (front && state.mobFrontUid !== front.uid) {
      state.mobFrontUid = front.uid;
      resetMobAtkAccums();
    }
    fillQueue();
    if (toKill.length) save();
    syncComboOrbsUi();
    // 掉落另延 ~28ms，與死亡／場刷錯開
    scheduleHuntRender();
    // 大波秒殺後立刻修剪傷害字／狀態，避免越刷越卡
    if (toKill.length >= 6) {
      try {
        DamageNumber.trimTo?.(120);
        DamageNumber.pruneStaleStacks?.(3000);
        SkillMobStatus.prune?.();
      } catch (_) { /* ignore */ }
    }
  }

  let huntRenderRaf = 0;
  function scheduleHuntRender() {
    if (!open) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (huntRenderRaf) return;
    huntRenderRaf = requestAnimationFrame(() => {
      huntRenderRaf = 0;
      if (open && !(typeof document !== 'undefined' && document.hidden)) render();
    });
  }

  function applyProjectileKills(kills) {
    applySkillMobStateSync(kills);
  }

  /** 連鎖中：先移出佇列讓後排補位，結算留到 flushDeferredKills */
  function deferMobKill(mob) {
    if (!mob) return;
    const deadEl = $('idleHuntField')?.querySelector(`.idle-actor--mob[data-uid="${mob.uid}"]`);
    const virtualPt = mobFieldPoint(mob);
    const at = virtualPt || { x: 360, y: 390 };
    const fallX = parsePx(deadEl?.style.left);
    const fallY = parsePx(deadEl?.style.top);
    const origin = {
      x: fallX != null ? fallX : at.x,
      y: fallY != null ? fallY : at.y,
    };
    if (!(state.deferredKills || []).some((d) => d.mob === mob)) {
      state.deferredKills.push({ mob, origin });
    }
    // 先播死亡動畫，避免 render 清掉 DOM
    if (!(state.dying || []).some((d) => String(d.uid) === String(mob.uid))) {
      state.dying.push({
        uid: mob.uid,
        name: mob.name,
        iconId: mob.iconId,
        isBoss: !!mob.isBoss,
        bossScaleSprite: !!mob.bossScaleSprite,
        bossScaleHud: !!mob.bossScaleHud,
        x: origin.x,
        y: origin.y,
        elapsed: 0,
        deferred: true,
      });
    }
    beginMobDeathVisual(mob, origin);
    state.queue = state.queue.filter((m) => m !== mob);
    const front = state.queue[0];
    if (front && state.mobFrontUid !== front.uid) {
      state.mobFrontUid = front.uid;
      resetMobAtkAccums();
    }
    fillQueue();
    scheduleHuntRender();
  }

  function flushDeferredKills() {
    const list = (state.deferredKills || []).slice();
    state.deferredKills = [];
    list.forEach(({ mob, origin }) => {
      if (mob) applyKill(mob, { origin, skipFillQueue: true, skipSave: true });
    });
    if (list.length) {
      fillQueue();
      save();
      syncComboOrbsUi();
      scheduleHuntRender();
    }
  }

  function huntCombatCtx(extra = {}) {
    const quiet = !!extra.quietFx
      || (typeof document !== 'undefined' && document.hidden);
    const noop = () => {};
    const rest = { ...extra };
    delete rest.quietFx;
    return {
      mobs: state.queue.slice(),
      getMobs: () => state.queue.slice(),
      playerEl: $('idleHuntField')?.querySelector('.idle-actor--player'),
      fieldEl: $('idleHuntField'),
      showMobDamage: quiet ? noop : showMobDamage,
      // 副本傷害改由 applyPlayerHitToMob 統一記入，避免接技／非同步路徑漏算或重複
      onDamage: noop,
      flashHit: quiet ? noop : flashHit,
      flashDie: quiet ? noop : flashDie,
      onProjectileResolve: applySkillMobStateSync,
      onMobStateSync: applySkillMobStateSync,
      onDeferMobKill: deferMobKill,
      onFlushDeferredKills: flushDeferredKills,
      ...rest,
      quietFx: quiet,
    };
  }

  function scheduleMobDamage(delayMs, fn) {
    const seq = ++mobDamageSeq;
    const run = () => {
      if (seq !== mobDamageSeq || !open || !state.running) return;
      fn();
    };
    const ms = scaleDelayMs(Math.max(0, Number(delayMs) || 0));
    if (ms > 0) window.setTimeout(run, ms);
    else run();
  }

  function mobDamageDelayMs(iconId, bodyAction) {
    if (typeof IdleMobAnim === 'undefined') return 0;
    return Math.max(0, Number(IdleMobAnim.mobDamageDelayMs?.(iconId, bodyAction)) || 0);
  }

  function applyMobAttackDamage(dmg, opts = {}) {
    if (isPlayerDead()) return;
    hurtPlayer(dmg, opts);
  }

  function tickMobAttacks(dt) {
    const front = state.queue[0];
    if (!front || isPlayerDead()) return;
    if (state.mobFrontUid !== front.uid) {
      state.mobFrontUid = front.uid;
      resetMobAtkAccums();
    }
    const atk = mobAtkCfg(!!front.isBoss);
    const iconId = front.iconId;
    const canAnim = (action) => {
      if (typeof IdleMobAnim === 'undefined') return true;
      const resolved = IdleMobAnim.resolveAction(iconId, action);
      return !!(resolved && resolved !== 'stand');
    };

    // 優先 skill1 > skill2 > skill3，再攻擊1～3（有傷害／CD／動畫才會放）
    // 多個同時就緒時略過「上一段」同槽，避免 skill1／skill2 同 CD 時永遠只放 skill1
    const slots = [
      { acc: 'mobSkill1Acc', dmg: atk.skill1Dmg, cd: atk.skill1Cd, action: 'skill1', isSkill: true },
      { acc: 'mobSkill2Acc', dmg: atk.skill2Dmg, cd: atk.skill2Cd, action: 'skill2', isSkill: true },
      { acc: 'mobSkill3Acc', dmg: atk.skill3Dmg, cd: atk.skill3Cd, action: 'skill3', isSkill: true },
      { acc: 'mobHitAcc', dmg: atk.atk1Dmg, cd: atk.atk1Cd, action: 'attack1', isSkill: false },
      { acc: 'mobAtk2Acc', dmg: atk.atk2Dmg, cd: atk.atk2Cd, action: 'attack2', isSkill: false },
      { acc: 'mobAtk3Acc', dmg: atk.atk3Dmg, cd: atk.atk3Cd, action: 'attack3', isSkill: false },
    ];
    slots.forEach((s) => {
      if (s.dmg > 0 && s.cd > 0) state[s.acc] = (Number(state[s.acc]) || 0) + dt;
    });

    const el = $('idleHuntField')?.querySelector(`.idle-actor--mob[data-uid="${front.uid}"]`);
    const playerEl = $('idleHuntField')?.querySelector('.idle-actor--player');
    if (isMobCasting(el)) return;
    if (playerEl && typeof IdleMobAnim !== 'undefined' && IdleMobAnim.isAreaWarningActive?.(playerEl)) return;

    const ready = slots.filter((s) => {
      if (!(s.dmg > 0 && s.cd > 0)) return false;
      if ((Number(state[s.acc]) || 0) < s.cd) return false;
      // attack2/3／skill1～3 需有對應動作；attack1 沒動畫也照數值打
      if (s.action !== 'attack1' && !canAnim(s.action)) return false;
      return true;
    });
    if (!ready.length) return;
    const last = String(state.lastMobCastAction || '');
    const rotated = ready.filter((s) => s.action !== last);
    const ordered = rotated.length ? rotated : ready;

    for (const s of ordered) {
      const isAreaWarn = typeof IdleMobAnim !== 'undefined'
        && IdleMobAnim.hasAreaWarningAttack?.(iconId, s.action);
      if (!flashMobAttack(front.uid, s.action)) continue;
      state[s.acc] = 0;
      state.lastMobCastAction = s.action;
      const mobLevel = currentMobLevel(!!front.isBoss);
      if (isAreaWarn && playerEl && typeof IdleMobAnim.playAreaWarning === 'function') {
        const bodyAction = s.action;
        let rawDmg = s.dmg;
        if (typeof SkillMobStatus !== 'undefined'
          && typeof SkillMobStatus.applyIncomingMobDamageMods === 'function') {
          rawDmg = SkillMobStatus.applyIncomingMobDamageMods(front, rawDmg);
        }
        // 防禦力改由 hurtPlayer 在技能／格擋之後統一套用，此處傳毛傷
        const hurtOpts = {
          mobLevel,
          isBoss: !!front.isBoss,
          mob: front,
        };
        IdleMobAnim.playAreaWarning(playerEl, iconId, bodyAction, {
          onDamage: () => {
            applyMobAttackDamage(rawDmg, hurtOpts);
            if (typeof IdleMobAnim.playPlayerHit === 'function') {
              IdleMobAnim.playPlayerHit(playerEl, iconId, bodyAction, { immediate: true });
            }
          },
        });
      } else {
        const bodyAction = s.action;
        let rawDmg = s.dmg;
        if (typeof SkillMobStatus !== 'undefined'
          && typeof SkillMobStatus.applyIncomingMobDamageMods === 'function') {
          rawDmg = SkillMobStatus.applyIncomingMobDamageMods(front, rawDmg);
        }
        const hurtOpts = {
          mobLevel,
          isBoss: !!front.isBoss,
          mob: front,
        };
        scheduleMobDamage(mobDamageDelayMs(iconId, bodyAction), () => {
          applyMobAttackDamage(rawDmg, hurtOpts);
        });
      }
      return;
    }
  }

  function renderPlayerHp() {
    syncPlayerHp();
    const fill = $('idleHuntHpFill');
    const text = $('idleHuntHpText');
    const wrap = $('idleHuntHpBar');
    const max = Math.max(1, Number(state.maxHp) || 1);
    const hp = Math.max(0, Number(state.hp) || 0);
    const pct = Math.max(0, Math.min(100, (hp / max) * 100));
    if (fill) {
      fill.style.setProperty('--hp-track-w', `${UI_SIZE.hpFill[0]}px`);
      fill.style.width = `${pct}%`;
    }
    if (text) text.textContent = `${Math.floor(hp)} / ${Math.floor(max)}`;
    wrap?.classList.toggle('is-empty', hp <= 0);
  }

  function healToFull() {
    syncPlayerHp({ fill: true });
    save();
    renderPlayerHp();
  }

  function healPlayer(amount) {
    const heal = Math.max(0, Math.floor(Number(amount) || 0));
    if (!heal || isPlayerDead()) return 0;
    syncPlayerHp();
    const max = Math.max(1, Number(state.maxHp) || playerMaxHp());
    const before = Math.max(0, Number(state.hp) || 0);
    state.hp = Math.min(max, before + heal);
    save();
    renderPlayerHp();
    return state.hp - before;
  }

  /** 依最大 HP 百分比回血（魔力吸收等） */
  function healPlayerFromMaxHpPct(pct) {
    const p = Math.max(0, Number(pct) || 0);
    if (!(p > 0) || isPlayerDead()) return 0;
    syncPlayerHp();
    const max = Math.max(1, Number(state.maxHp) || playerMaxHp());
    return healPlayer(Math.max(1, Math.floor(max * p / 100)));
  }

  /**
   * 技能耗血（mpCon→HP；魔力激發加碼）。keepAlive 時至少留 1 HP。
   * @returns {number} 實際扣除量
   */
  function spendHuntHp(amount, opts = {}) {
    const cost = Math.max(0, Math.floor(Number(amount) || 0));
    if (!cost || isPlayerDead()) return 0;
    if (gmGodMode) return 0;
    syncPlayerHp();
    const before = Math.max(0, Number(state.hp) || 0);
    const floorHp = opts.keepAlive === false ? 0 : 1;
    state.hp = Math.max(floorHp, before - cost);
    renderPlayerHp();
    syncHuntOverlayBars?.();
    if (state.hp > 0 && typeof IdlePotionPanel !== 'undefined') {
      IdlePotionPanel.tryAutoDrink?.();
    }
    return before - state.hp;
  }

  function formatPowerText(power) {
    if (!(power > 0)) return '—';
    if (typeof formatPower === 'function') return formatPower(power);
    return formatCount(power);
  }

  /** 掉落生成比死亡動畫／場刷晚一點，並在多殺時錯開，避免同幀尖峰 */
  const DROP_SPAWN_DELAY_MS = 28;
  const DROP_SPAWN_STAGGER_MS = 12;
  /** @type {Array<{ origin: { x: number, y: number }, rows: object[] }>} */
  const pendingDropSpawns = [];
  /** @type {ReturnType<typeof setTimeout>|null} */
  let dropSpawnTimer = null;

  function formatDropRowsLabel(rows) {
    return (rows || []).map((r) => {
      if (r.kind === 'meso') return `楓幣 ×${Math.floor(Number(r.amount) || 0)}`;
      const amt = Math.max(1, Math.floor(Number(r.amount) || 1));
      let name = r.name || r.itemId || '掉落';
      if (r.kind === 'equip' && typeof ITEM_DATABASE !== 'undefined') {
        name = ITEM_DATABASE[r.itemId]?.name || r.itemId;
      }
      return amt > 1 ? `${name} ×${amt}` : name;
    }).join('、') || '無';
  }

  function buildDropRows(isBoss, extraRows = [], opts = {}) {
    const allowItems = opts.allowItems !== false;
    if (typeof IdleHuntDropData === 'undefined' && !(extraRows && extraRows.length)) {
      return null;
    }
    const zone = typeof IdleZones !== 'undefined' ? IdleZones.get(state.zoneId) : null;
    const rolled = allowItems && typeof IdleHuntDropData !== 'undefined'
      ? IdleHuntDropData.roll(zone, !!isBoss)
      : [];
    return [...(Array.isArray(extraRows) ? extraRows : []), ...rolled];
  }

  function spawnDropRowsVisual(origin, rows) {
    if (!rows?.length || typeof ItemDropController === 'undefined') return;
    ensureDropController();
    const ox = Number(origin?.x);
    const oy = Number(origin?.y);
    ItemDropController.spawnBatch({
      origin: {
        x: Number.isFinite(ox) ? ox : 360,
        y: Number.isFinite(oy) ? oy : 390,
      },
      groundY: Number.isFinite(oy) ? oy : 390,
      rows,
    });
  }

  function grantDropRowsFallback(rows) {
    const parts = [];
    let gainedMeso = false;
    rows.forEach((row) => {
      if (row.kind === 'meso') {
        const amt = Math.max(0, Math.floor(Number(row.amount) || 0));
        if (amt > 0) {
          state.gold += amt;
          gainedMeso = true;
          parts.push(`楓幣 ×${amt}`);
        }
        return;
      }
      if (typeof InventoryModule === 'undefined') return;
      const result = InventoryModule.applyIdleDrop(row, { logTag: '放置', silent: true });
      if (result?.ok) {
        const bag = result.bag === 'equip' ? '裝備欄' : (result.bag === 'etc' ? '其他欄' : '消耗欄');
        parts.push(`${result.name} → ${bag}`);
        if (state.dungeon && typeof IdleDungeon !== 'undefined') {
          const amt = Number(result.amount) > 0
            ? Math.floor(Number(result.amount))
            : Math.max(1, Math.floor(Number(row.amount) || 1));
          IdleDungeon.recordLoot?.(result.name, amt);
        }
      } else if (result?.name) {
        parts.push(`${result.name}（背包已滿）`);
      }
    });
    if (gainedMeso) {
      save();
      syncInventoryMesoDisplay();
    }
    state.lastDrop = parts.join('、') || '無';
  }

  function clearPendingDropSpawns({ grant = false } = {}) {
    if (dropSpawnTimer != null) {
      clearTimeout(dropSpawnTimer);
      dropSpawnTimer = null;
    }
    const jobs = pendingDropSpawns.splice(0, pendingDropSpawns.length);
    if (!grant || !jobs.length) return;
    jobs.forEach((job) => {
      if (typeof ItemDropController !== 'undefined') {
        spawnDropRowsVisual(job.origin, job.rows);
      } else {
        grantDropRowsFallback(job.rows);
      }
    });
  }

  function pumpPendingDropSpawns() {
    dropSpawnTimer = null;
    const job = pendingDropSpawns.shift();
    if (!job) return;
    spawnDropRowsVisual(job.origin, job.rows);
    if (pendingDropSpawns.length) {
      dropSpawnTimer = window.setTimeout(pumpPendingDropSpawns, DROP_SPAWN_STAGGER_MS);
    }
  }

  function scheduleDropSpawn(origin, rows) {
    if (!rows?.length) return;
    const ox = Number(origin?.x);
    const oy = Number(origin?.y);
    const point = {
      x: Number.isFinite(ox) ? ox : 360,
      y: Number.isFinite(oy) ? oy : 390,
    };
    // 背景分頁不需錯開，直接生成以免切回時堆積
    if (typeof document !== 'undefined' && document.hidden) {
      spawnDropRowsVisual(point, rows);
      return;
    }
    // 高速連殺：純楓幣併入上一包，減少場上掉落實體
    const onlyMeso = rows.length === 1 && rows[0]?.kind === 'meso';
    if (onlyMeso && pendingDropSpawns.length) {
      const last = pendingDropSpawns[pendingDropSpawns.length - 1];
      const meso = (last.rows || []).find((r) => r && r.kind === 'meso');
      const add = Math.max(0, Math.floor(Number(rows[0].amount) || 0));
      if (meso && add > 0) {
        meso.amount = Math.max(0, Math.floor(Number(meso.amount) || 0)) + add;
        return;
      }
      if (add > 0) {
        last.rows = [{ kind: 'meso', amount: add }, ...(last.rows || [])];
        return;
      }
    }
    pendingDropSpawns.push({ origin: point, rows });
    if (dropSpawnTimer != null) return;
    dropSpawnTimer = window.setTimeout(pumpPendingDropSpawns, DROP_SPAWN_DELAY_MS);
  }

  function grantDrop(isBoss, origin, extraRows = [], opts = {}) {
    const rows = buildDropRows(isBoss, extraRows, opts);
    if (rows == null) {
      state.lastDrop = '（無掉落表）';
      return;
    }
    if (!rows.length) {
      state.lastDrop = '無';
      return;
    }
    state.lastDrop = formatDropRowsLabel(rows);
    if (typeof ItemDropController === 'undefined') {
      grantDropRowsFallback(rows);
      return;
    }
    if (opts.immediate) {
      spawnDropRowsVisual(origin, rows);
      return;
    }
    scheduleDropSpawn(origin, rows);
  }

  function ensureDamageNumber() {
    if (typeof DamageNumber === 'undefined') return;
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    if (!stage) return;
    DamageNumber.init(stage);
  }

  function showMobDamage(mob, dmg, isCritical, opts) {
    if (typeof DamageNumber === 'undefined') return;
    DamageNumber.spawnOnMob(mob, dmg, isCritical, opts || {});
  }

  function ensureDropController() {
    if (typeof ItemDropController === 'undefined') return;
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    if (!stage) return;
    ItemDropController.init(stage, {
      onDropText: (text) => {
        if (text) state.lastDrop = text;
      },
      onGrantMeso: (amount) => {
        const v = Math.max(0, Math.floor(Number(amount) || 0));
        if (v > 0) {
          state.gold += v;
          save();
          if (open) renderHud();
          syncInventoryMesoDisplay();
        }
      },
      onGrantItem: (info) => {
        if (!state.dungeon || typeof IdleDungeon === 'undefined') return;
        IdleDungeon.recordLoot?.(info?.name, info?.amount);
      },
    });
  }

  function clearFieldDrops(grantPending) {
    releaseCombatVisuals({ soft: false, grantPending: !!grantPending });
  }

  /**
   * 釋放戰鬥相關視覺與解碼圖快取。
   * soft：掛機中可呼叫——清傷害數字／暫態特效／修剪圖片，不中斷模擬、保留召喚 loop。
   * hard：轉場／離場——等同原 clearFieldDrops。
   */
  function releaseCombatVisuals(opts = {}) {
    const soft = opts.soft === true;
    const grantPending = !!opts.grantPending;

    if (typeof DamageNumber !== 'undefined') {
      if (soft) {
        DamageNumber.clear?.();
        DamageNumber.pruneStaleStacks?.(5000);
      } else {
        DamageNumber.clear?.();
      }
    }
    if (typeof LevelUpEffect !== 'undefined') {
      LevelUpEffect.stopAll?.();
    }
    if (typeof SkillEffectPlayer !== 'undefined') {
      if (soft) {
        SkillEffectPlayer.stopTransientFx?.({ settleHits: true });
      } else {
        SkillEffectPlayer.stopAll?.();
      }
      SkillEffectPlayer.clearLocalPreloadCache?.();
    }
    if (!soft && typeof ItemDropController !== 'undefined') {
      // 轉場／離場：待生成掉落先吐出再 clear，避免漏發或重複尖峰
      clearPendingDropSpawns({ grant: grantPending });
      ItemDropController.clear({ grantPending });
    } else if (!soft) {
      clearPendingDropSpawns({ grant: grantPending });
    }
    if (typeof SkillMobStatus !== 'undefined') {
      SkillMobStatus.prune?.();
    }
    if (typeof EnchantImagePreload !== 'undefined') {
      const pin = typeof DamageSkinCatalog !== 'undefined'
        ? DamageSkinCatalog.pinnedUrls?.()
        : null;
      if (soft) {
        EnchantImagePreload.softTrim?.(IMAGE_CACHE_SOFT_MAX, pin);
      } else {
        // 轉場：較積極修剪，但不整庫清空（避免換圖後全白等回暖）
        EnchantImagePreload.softTrim?.(Math.min(220, IMAGE_CACHE_SOFT_MAX), pin);
      }
      // 傷害字圖若被踢掉就補載（100% 暴擊副本特別容易踩到）
      try { DamageSkinCatalog?.warmUpAll?.(); } catch (_) { /* ignore */ }
    }

    if (!soft) {
      const player = $('idleHuntField')?.querySelector('.idle-actor--player');
      if (player && typeof IdleMobAnim !== 'undefined') {
        IdleMobAnim.clearAreaWarning?.(player);
        IdleMobAnim.clearPlayerHit?.(player);
      }
    }

    // 回暖常用資源，降低 GC 後首波抽搐
    try {
      if (state.zoneId) preloadZoneAssets(state.zoneId);
    } catch (_) { /* ignore */ }
    try {
      SkillEffectPlayer.warmUpCombatLoadout?.();
    } catch (_) { /* ignore */ }

    lastMemReleaseAt = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  function maybeAutoReleaseMemory(force) {
    if (!force && !state.running) return;
    const now = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
    if (!force && lastMemReleaseAt > 0 && (now - lastMemReleaseAt) < MEM_RELEASE_MS) return;

    // 輕量例行：修剪圖快取／狀態鍵，不整清傷害數字（避免畫面閃一下）
    try {
      const pin = typeof DamageSkinCatalog !== 'undefined'
        ? DamageSkinCatalog.pinnedUrls?.()
        : null;
      EnchantImagePreload.softTrim?.(IMAGE_CACHE_SOFT_MAX, pin);
      SkillEffectPlayer.clearLocalPreloadCache?.();
      SkillMobStatus.prune?.();
      DamageNumber.pruneStaleStacks?.(8000);
    } catch (_) { /* ignore */ }

    const fxN = typeof SkillEffectPlayer !== 'undefined'
      ? (Number(SkillEffectPlayer.activeInstanceCount?.()) || 0)
      : 0;
    const dmgN = typeof DamageNumber !== 'undefined'
      ? (Number(DamageNumber.activeCount?.()) || 0)
      : 0;
    // 特效／數字明顯堆積才做 soft release
    if (!force && typeof document !== 'undefined' && !document.hidden) {
      if (fxN < 36 && dmgN < 120) {
        lastMemReleaseAt = now;
        return;
      }
    }
    releaseCombatVisuals({ soft: true });
  }

  function startMemReleaseTimer() {
    if (memReleaseTimer != null) return;
    memReleaseTimer = window.setInterval(() => {
      maybeAutoReleaseMemory(false);
    }, MEM_RELEASE_MS);
  }

  function stopMemReleaseTimer() {
    if (memReleaseTimer == null) return;
    window.clearInterval(memReleaseTimer);
    memReleaseTimer = null;
  }

  function actorMarkup(kind, monster, index, point) {
    const x = Math.round(Number(point?.x) || 0);
    const y = Math.round(Number(point?.y) || 0);
    const pos = `style="left:${x}px;top:${y}px"`;
    if (kind === 'player') {
      const playerName = (typeof AppNavSidebar !== 'undefined' && typeof AppNavSidebar.readName === 'function'
        ? AppNavSidebar.readName()
        : '') || '時閒人';
      const safeName = String(playerName).replace(/[<>]/g, '');
      return `
        <div class="idle-actor idle-actor--player" data-sprite-slot="player" ${pos}>
          <img class="idle-actor-sprite" src="images/idle-mobs/player.png" alt="自身">
          <div class="idle-actor-name">${safeName}</div>
        </div>`;
    }
    const hpPct = monster ? Math.max(0, Math.min(100, (monster.hp / monster.maxHp) * 100)) : 0;
    const isFront = index === 0;
    const isBoss = !!monster?.isBoss;
    const isDying = !!monster?.dying;
    const name = String(monster?.name || (isBoss ? 'BOSS' : '怪物')).replace(/[<>]/g, '');
    const uid = monster?.uid != null ? String(monster.uid) : '';
    const scaleSprite = isBoss && !!monster?.bossScaleSprite;
    const scaleHud = isBoss && !!monster?.bossScaleHud;
    const scaleCls = `${scaleSprite ? ' is-boss-scale-sprite' : ''}${scaleHud ? ' is-boss-scale-hud' : ''}`;
    return `
      <div class="idle-actor idle-actor--mob ${isFront ? 'is-front' : 'is-wait'}${isBoss ? ' is-boss' : ''}${isDying ? ' is-dying' : ''}${scaleCls}"
        data-sprite-slot="mob-${uid}" data-uid="${uid}" ${pos}>
        <div class="idle-actor-hud">
          <div class="idle-actor-hp"${isDying ? ' hidden' : ''}><span style="width:${hpPct}%"></span></div>
        </div>
        <div class="idle-actor-name">${name}</div>
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="${name}">
        </div>
      </div>`;
  }

  function parsePx(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }

  function setActorPoint(el, point, animate) {
    if (!el || !point) return;
    if (el.classList.contains('is-dying')) return;
    const hitUntil = Number(el.dataset.hitUntil) || 0;
    const x = Math.round(Number(point.x) || 0);
    const y = Math.round(Number(point.y) || 0);
    const prevX = parsePx(el.style.left);
    const shouldMove = animate && prevX != null && Math.abs(prevX - x) > 2 && hitUntil <= Date.now();
    el.style.top = `${y}px`;
    if (shouldMove) {
      const ms = typeof IdleMobAnim !== 'undefined' ? IdleMobAnim.MOVE_MS : 320;
      el.classList.add('is-moving');
      el.dataset.moveUntil = String(Date.now() + ms);
      el.style.left = `${x}px`;
      return;
    }
    if (el.classList.contains('is-moving')) return;
    el.style.left = `${x}px`;
  }

  function spriteKind(el) {
    if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.spriteKind) {
      return IdleMobAnim.spriteKind(el);
    }
    if (el.classList.contains('is-dying')) return 'die';
    if (el.dataset.introAction) return el.dataset.introAction;
    return 'stand';
  }

  function bindMobSprite(el, monster, action) {
    if (!el || typeof IdleMobAnim === 'undefined') return;
    if (IdleMobAnim.bindActorSprite) {
      IdleMobAnim.bindActorSprite(el, monster.iconId, action || 'stand');
      return;
    }
    const img = el.querySelector('.idle-actor-sprite:not(.idle-actor-sprite--effect)');
    if (!img) return;
    const kind = action || 'stand';
    img.dataset.kindAction = kind;
    IdleMobAnim.bind(img, monster.iconId, IdleMobAnim.actionForKind(kind), 0);
  }

  /** 畫面內受擊：播 hit，補位移動中不凍結；攻擊／技能動畫中不覆蓋 */
  function flashHit(uid) {
    const el = mobActorEl(uid);
    if (!el || el.classList.contains('is-dying')) return;
    if (isMobCasting(el)) return;
    const ms = typeof IdleMobAnim !== 'undefined' ? IdleMobAnim.HIT_MS : 280;
    el.dataset.hitUntil = String(Date.now() + ms);
    const img = el.querySelector('.idle-actor-sprite:not(.idle-actor-sprite--effect)');
    const iconId = img?.dataset.iconId;
    if (img && iconId && typeof IdleMobAnim !== 'undefined') {
      img.dataset.kindAction = 'hit';
      img.dataset.frameAcc = '0';
      img.dataset.bodyDone = '0';
      IdleMobAnim.bind(img, iconId, 'hit1', 0);
    }
  }

  /** 擊殺當下立刻播 die（不需等 applyKill／下一幀 render） */
  function flashDie(uid, mob) {
    const el = mobActorEl(uid);
    if (!el && !mob) return;
    if (el) stopMobMovement(el);
    const origin = (() => {
      if (!el) return null;
      const x = parsePx(el.style.left);
      const y = parsePx(el.style.top);
      if (x == null || y == null) return null;
      return { x, y };
    })();
    const mobRef = mob || { uid, iconId: el?.querySelector('.idle-actor-sprite')?.dataset?.iconId };
    beginMobDeathVisual(mobRef, origin);
    // 先掛上 dying 清單，避免多箭延遲 applyKill 期間屍體不在 dying、又占佇列時無法被 prune
    const id = mobRef?.uid != null ? String(mobRef.uid) : String(uid || '');
    if (id && !(state.dying || []).some((d) => String(d.uid) === id)) {
      state.dying.push({
        uid: id,
        name: mobRef.name,
        iconId: mobRef.iconId,
        isBoss: !!mobRef.isBoss,
        bossScaleSprite: !!mobRef.bossScaleSprite,
        bossScaleHud: !!mobRef.bossScaleHud,
        x: origin?.x ?? 0,
        y: origin?.y ?? 0,
        elapsed: 0,
      });
    }
  }

  /** 畫面上的怪立刻播死亡動畫（不需等下一幀 render） */
  function beginMobDeathVisual(mob, origin) {
    if (!mob) return null;
    const uid = mob.uid != null ? String(mob.uid) : '';
    if (!uid) return null;
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    let el = stage?.querySelector(`.idle-actor--mob[data-uid="${uid}"]`);
    // 只對「場上已有 actor」或明確可見座標補 DOM；避免螢幕外怪憑空長出死亡殼
    if (!el && stage && origin && Number.isFinite(Number(origin.x))) {
      const stillVisible = isMobVisibleInField(mob)
        || (mobQueueIndex(mob) >= 0 && mobQueueIndex(mob) < VISIBLE_QUEUE_LEN);
      if (stillVisible) {
        stage.insertAdjacentHTML(
          'beforeend',
          actorMarkup('mob', { ...mob, dying: true, hp: 0, maxHp: 1 }, 0, origin),
        );
        el = stage.querySelector(`.idle-actor--mob[data-uid="${uid}"]`);
        if (el) setActorPoint(el, origin, false);
      }
    }
    if (!el) return null;
    stopMobMovement(el);
    if (!el.classList.contains('is-dying')) {
      el.classList.remove('is-front', 'is-wait');
      const hpWrap = el.querySelector('.idle-actor-hp');
      if (hpWrap) hpWrap.hidden = true;
      const iconId = mob.iconId || el.querySelector('.idle-actor-sprite')?.dataset?.iconId;
      if (typeof IdleMobAnim !== 'undefined' && IdleMobAnim.beginActorDie) {
        IdleMobAnim.beginActorDie(el, iconId);
      } else {
        el.classList.add('is-dying');
        el.dataset.dieDone = '0';
        bindMobSprite(el, mob, 'die');
      }
    }
    applyMobStackZ(el, mob, 0, true);
    return el;
  }

  function advanceAllSprites(dt) {
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    if (!stage || typeof IdleMobAnim === 'undefined') return;
    if (IdleMobAnim.advanceActorsIn) {
      IdleMobAnim.advanceActorsIn(stage, dt);
    } else {
      stage.querySelectorAll('.idle-actor--mob').forEach((el) => {
        IdleMobAnim.advanceActor?.(el, dt);
      });
    }
    const player = stage.querySelector('[data-sprite-slot="player"]');
    if (player && typeof IdleMobAnim.tickPlayerHit === 'function') {
      IdleMobAnim.tickPlayerHit(player, dt);
    }
  }

  function pruneDying() {
    const minMs = typeof IdleMobAnim !== 'undefined' ? IdleMobAnim.DIE_MIN_MS : 800;
    const maxMs = typeof IdleMobAnim !== 'undefined' ? IdleMobAnim.DIE_MAX_MS : 1600;
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    const byUid = new Map();
    if (stage) {
      stage.querySelectorAll('.idle-actor--mob').forEach((el) => {
        const uid = el.getAttribute('data-uid');
        if (uid) byUid.set(String(uid), el);
      });
    }
    const keep = [];
    state.dying.forEach((row) => {
      row.elapsed = (Number(row.elapsed) || 0) + TICK_MS;
      const el = byUid.get(String(row.uid));
      const done = el?.dataset.dieDone === '1';
      if ((done && row.elapsed >= minMs) || row.elapsed >= maxMs) {
        el?.remove();
        return;
      }
      keep.push(row);
    });
    state.dying = keep;
  }

  function renderField() {
    const field = $('idleHuntField');
    if (!field) return;
    fillQueue();
    if (!field.querySelector('.idle-hunt-stage')) {
      field.innerHTML = `
        <img class="idle-hunt-map" alt="" aria-hidden="true" width="${UI_SIZE.field[0]}" height="${UI_SIZE.field[1]}">
        <div class="idle-hunt-stage"></div>
      `;
      bindArtFallback(field);
      ensureFieldFx();
    }
    const zone = typeof IdleZones !== 'undefined' ? currentZone() : null;
    const spawn = typeof IdleZones !== 'undefined' ? IdleZones.spawn(zone, VISIBLE_QUEUE_LEN + 1) : { player: { x: 200, y: 400 }, mobs: [] };
    const stage = field.querySelector('.idle-hunt-stage');
    if (!stage) return;
    ensureDropController();
    ensureDamageNumber();
    if (!stage.dataset.motionBound) {
      stage.dataset.motionBound = '1';
      stage.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'left') return;
        const el = e.target.closest?.('.idle-actor--mob');
        if (!el) return;
        el.classList.remove('is-moving');
        el.dataset.moveUntil = '0';
      });
    }

    let player = stage.querySelector('[data-sprite-slot="player"]');
    if (!player) {
      stage.insertAdjacentHTML('afterbegin', actorMarkup('player', null, 0, spawn.player));
      player = stage.querySelector('[data-sprite-slot="player"]');
    } else {
      setActorPoint(player, spawn.player, false);
    }
    if (typeof Paperdoll !== 'undefined' && typeof Paperdoll.initHunt === 'function') {
      Paperdoll.initHunt(player);
    }

    const live = new Set(state.dying.map((d) => String(d.uid)));
    const entryPoint = queueEntryPoint(zone, spawn);
    const actorsByUid = new Map();
    stage.querySelectorAll('.idle-actor--mob').forEach((node) => {
      const uid = node.getAttribute('data-uid');
      if (uid) actorsByUid.set(String(uid), node);
    });
    state.queue.slice(0, VISIBLE_QUEUE_LEN).forEach((mob, i) => {
      live.add(String(mob.uid));
      let el = actorsByUid.get(String(mob.uid));
      const point = spawn.mobs[i] || spawn.mobs[spawn.mobs.length - 1];
      const stagger = i * MOB_STEP_STAGGER_MS;
      if (!el) {
        stage.insertAdjacentHTML('beforeend', actorMarkup('mob', mob, i, entryPoint));
        el = stage.querySelector(`.idle-actor--mob[data-uid="${mob.uid}"]`);
        actorsByUid.set(String(mob.uid), el);
        applyMobStackZ(el, mob, i, false);
        el.dataset.queueSlot = String(i);
        bindMobSprite(el, mob, 'stand');
        requestAnimationFrame(() => {
          if (!el?.isConnected || el.dataset.introLock) return;
          runMobEnterFromRight(el, mob, point, entryPoint, { delayMs: stagger });
        });
      } else {
        el.classList.toggle('is-front', i === 0);
        el.classList.toggle('is-wait', i !== 0);
        el.classList.toggle('is-boss', !!mob.isBoss);
        el.classList.toggle('is-boss-scale-sprite', !!mob.isBoss && !!mob.bossScaleSprite);
        el.classList.toggle('is-boss-scale-hud', !!mob.isBoss && !!mob.bossScaleHud);
        applyMobStackZ(el, mob, i, false);
        const hpPct = Math.max(0, Math.min(100, (mob.hp / mob.maxHp) * 100));
        const bar = el.querySelector('.idle-actor-hp span');
        if (bar) bar.style.width = `${hpPct}%`;
        const hpWrap = el.querySelector('.idle-actor-hp');
        if (hpWrap) hpWrap.hidden = false;
        const oldSlot = el.dataset.queueSlot != null ? Number(el.dataset.queueSlot) : NaN;
        const slotChanged = Number.isFinite(oldSlot) && oldSlot !== i;
        if (!el.dataset.introLock && !el.classList.contains('is-dying')) {
          if (slotChanged && oldSlot > i) {
            // 已在場上的怪：只往前挪格（固定一格距離＋固定速度），依序錯開
            const steps = oldSlot - i;
            runMobWalkTo(el, mob, point, { steps, delayMs: stagger });
          } else if (!Number.isFinite(oldSlot)) {
            const prevX = parsePx(el.style.left);
            const tx = Math.round(Number(point.x) || 0);
            if (prevX == null || Math.abs(prevX - tx) > 2) {
              runMobWalkTo(el, mob, point, { steps: 1, delayMs: stagger });
            }
          }
        }
        el.dataset.queueSlot = String(i);
      }
    });
    state.dying.forEach((row) => {
      let el = actorsByUid.get(String(row.uid));
      if (!el) {
        stage.insertAdjacentHTML('beforeend', actorMarkup('mob', { ...row, dying: true, hp: 0, maxHp: 1 }, 0, row));
        el = stage.querySelector(`.idle-actor--mob[data-uid="${row.uid}"]`);
        actorsByUid.set(String(row.uid), el);
        setActorPoint(el, row, false);
        bindMobSprite(el, row, 'die');
      } else if (!el.classList.contains('is-dying')) {
        stopMobMovement(el);
        el.classList.add('is-dying');
        el.classList.remove('is-front', 'is-wait');
        el.dataset.hitUntil = '0';
        el.dataset.skillUntil = '0';
        el.dataset.attackUntil = '0';
        el.dataset.attackAction = '';
        el.dataset.moveUntil = '0';
        delete el.dataset.introAction;
        delete el.dataset.introLock;
        const hpWrap = el.querySelector('.idle-actor-hp');
        if (hpWrap) hpWrap.hidden = true;
        el.dataset.dieDone = '0';
        const img = el.querySelector('.idle-actor-sprite:not(.idle-actor-sprite--effect)');
        if (img) {
          img.dataset.frameAcc = '0';
          img.dataset.bodyDone = '0';
          img.dataset.kindAction = 'die';
        }
        bindMobSprite(el, row, 'die');
      }
      applyMobStackZ(el, row, 0, true);
    });
    stage.querySelectorAll('.idle-actor--mob').forEach((el) => {
      const uid = el.getAttribute('data-uid');
      if (!live.has(String(uid))) el.remove();
    });
    applyFieldArt();
    $('idleHuntField')?.querySelector('#idleHuntPlayerHp')?.remove();
    syncComboOrbsUi();
    syncHuntOverlayBars();
  }

  function bindArtFallback(field) {
    const img = field.querySelector('.idle-hunt-map');
    img?.addEventListener('error', () => {
      img.removeAttribute('src');
      img.hidden = true;
    });
  }

  function applyFieldArt() {
    const field = $('idleHuntField');
    if (!field || typeof IdleZones === 'undefined') return;
    const dungeonArt = state.dungeon?.map?.artId;
    const url = dungeonArt && typeof IdleZones.artUrl === 'function'
      ? IdleZones.artUrl(dungeonArt)
      : IdleZones.mapUrl(currentZone());
    setArtSrc(field.querySelector('.idle-hunt-map'), url);
  }

  function setArtSrc(img, url) {
    if (!img || !url) return;
    if (img.dataset.src === url) return;
    img.dataset.src = url;
    img.hidden = false;
    img.src = url;
  }

  function setActLabel(btn, text) {
    if (!btn) return;
    const label = btn.querySelector('.idle-hunt-actbtn__label');
    if (label) label.textContent = text;
    else btn.textContent = text;
  }

  function renderHud() {
    const power = state.running ? state.power : readPower();
    if (!state.running) state.power = power;
    const powerEl = $('idleHuntPower');
    const goldEl = $('idleHuntGold');
    const lvEl = $('idleHuntLevel');
    const expEl = $('idleHuntExpPct');
    const expFill = $('idleHuntExpFill');
    const startBtn = $('idleHuntStart');
    const prevBtn = $('idleHuntPrevMap');
    const fightReady = canFight();
    const mobNeed = smallKillNeed();
    const mobHave = Math.min(mobNeed, mapKillCount());
    const replayNeedN = replayNeed();
    const replayHave = Math.min(replayNeedN || 0, replayKillCount());
    const mobKillsEl = $('idleHuntMobKills');
    const fightBtn = $('idleHuntFightBoss');
    const nextBtn = $('idleHuntNextMap');
    const transitioning = isFieldTransitionActive();
    if (powerEl) powerEl.textContent = formatPowerText(power);
    if (mobKillsEl) {
      mobKillsEl.textContent = isBossCleared() && replayNeedN > 0
        ? `${replayHave}/${replayNeedN}`
        : `${mobHave}/${mobNeed}`;
    }
    if (goldEl) goldEl.textContent = formatGoldText(state.gold);
    if (typeof CharacterProgression !== 'undefined') {
      const prog = CharacterProgression.getState();
      const pct = prog.level >= 300 ? 100 : (prog.expProgress || 0) * 100;
      if (lvEl) lvEl.textContent = String(prog.level);
      if (expEl) {
        if (prog.level >= 300) {
          expEl.textContent = `${formatCount(prog.exp)}（滿等）`;
        } else {
          expEl.textContent = `${formatCount(prog.exp)} / ${formatCount(prog.expToNext)}（${pct.toFixed(1)}%）`;
        }
      }
      if (expFill) {
        expFill.style.setProperty('--exp-track-w', `${UI_SIZE.expFill[0]}px`);
        expFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      }
    }
    const zone = currentZone();
    const deathLocked = isDeathUiLocked();
    const canPauseTransition = isPushTransitionCancellable();
    if (startBtn) {
      const showAsPause = state.running || canPauseTransition;
      // 推圖連跳過圖時允許按暫停；一般過圖中不可按「開始」
      startBtn.disabled = deathLocked
        || (!showAsPause && (transitioning || !fightReady));
      setActLabel(startBtn, showAsPause ? '暫停' : '開始');
    }
    const afkBtn = $('idleHuntAfk');
    if (afkBtn) {
      const on = isAfkActive();
      // 託管模式切換在過圖中也要可按，才能中斷推圖連跳
      afkBtn.disabled = deathLocked;
      afkBtn.classList.toggle('is-on', on);
      afkBtn.classList.toggle('is-afk-push', state.afkMode === 'push');
      afkBtn.classList.toggle('is-afk-farm', state.afkMode === 'farm');
      setActLabel(afkBtn, afkModeLabel());
      afkBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      afkBtn.title = state.afkMode === 'push'
        ? (state.afkHoldAdvance
          ? '自動推圖（已暫停連跳）：按開始後會繼續推圖；或再點切換掛機／關閉'
          : '自動推圖：打王並自動進下一關；過圖中可按暫停中斷連跳')
        : (state.afkMode === 'farm'
          ? '掛機：當地圖自動刷王；死亡可手動復活或 5 秒後自動復活'
          : '點一下開啟自動推圖；死亡可手動復活或 5 秒後自動復活');
    }
    if (fightBtn) {
      fightBtn.disabled = transitioning || deathLocked || !fightReady || state.huntMode === 'boss' || !canFightBoss();
      if (state.huntMode === 'boss') setActLabel(fightBtn, 'BOSS 戰中');
      else if (!isBossCleared()) setActLabel(fightBtn, '挑戰 BOSS');
      else if (canFightBoss()) setActLabel(fightBtn, '再次挑戰 BOSS');
      else {
        const need = replayNeed();
        setActLabel(fightBtn, need > 0 ? `再打 ${need - replayKillCount()} 隻` : 'BOSS 已擊敗');
      }
    }
    let nxt = null;
    let prev = null;
    try { nxt = nextZone(); } catch (_) { nxt = null; }
    try { prev = prevZone(); } catch (_) { prev = null; }
    const nextReady = !!(nxt && isBossCleared() && typeof IdleZones !== 'undefined' && IdleZones.isUnlocked(nxt));
    const prevExists = !!prev;
    if (nextBtn) nextBtn.disabled = transitioning || deathLocked || !nextReady || !!state.dungeon;
    if (prevBtn) prevBtn.disabled = transitioning || deathLocked || !prevExists || !!state.dungeon;
    if (fightBtn && state.dungeon) fightBtn.disabled = true;
    const pickBtn = $('idleHuntPickMap');
    if (pickBtn) pickBtn.disabled = transitioning || deathLocked || !!state.dungeon;
    const dungeonBtn = $('idleHuntDungeon');
    if (dungeonBtn) dungeonBtn.disabled = transitioning || deathLocked;
    const bossBtn = $('idleHuntBoss');
    if (bossBtn) bossBtn.disabled = transitioning || deathLocked;
    const shopBtn = $('idleHuntNpcShop');
    if (shopBtn) shopBtn.disabled = transitioning || deathLocked;
    const currentMap = $('idleHuntCurrentMap');
    if (currentMap) {
      if (state.dungeon) {
        currentMap.textContent = `副本 · ${state.dungeon.map?.name || state.dungeon.name || '素材副本'}`;
      } else if (zone && typeof IdleZones !== 'undefined') {
        currentMap.textContent = IdleZones.label(zone);
      }
    }
    renderPlayerHp();
    syncDeathModal();
    renderPicker();
  }

  function currentZone() {
    if (typeof IdleZones === 'undefined') return null;
    state.zoneId = IdleZones.clampId(state.zoneId);
    return IdleZones.get(state.zoneId);
  }

  function zoneOrderIndex(zone) {
    if (typeof IdleZones === 'undefined' || !zone) return -1;
    const all = typeof IdleZones.orderedMaps === 'function' ? IdleZones.orderedMaps() : IdleZones.list || [];
    const id = IdleZones.id(zone);
    return all.findIndex((z) => IdleZones.id(z) === id);
  }

  function canEnterZone(zone) {
    if (!zone || typeof IdleZones === 'undefined') return false;
    if (IdleZones.isUnlocked(zone)) return true;
    const cur = IdleZones.get(state.zoneId);
    return zoneOrderIndex(zone) >= 0 && zoneOrderIndex(zone) < zoneOrderIndex(cur);
  }

  function selectZone(id, fromUser) {
    if (state.dungeon) return;
    if (typeof IdleZones === 'undefined') return;
    const zone = IdleZones.get(id);
    if (!canEnterZone(zone)) return;
    const nextId = IdleZones.id(zone);
    if (state.zoneId === nextId) {
      setPickerOpen(false);
      render();
      return;
    }
    setPickerOpen(false);
    return runMapTransition(nextId, fromUser);
  }

  function setPickerOpen(next) {
    pickerOpen = !!next;
    if (pickerOpen) {
      pickerView = 'bands';
      const zone = currentZone();
      pickerBandKey = typeof IdleZones !== 'undefined' ? IdleZones.bandOf(zone).key : '';
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.setOpen?.(false);
      if (typeof IdleBoss !== 'undefined') IdleBoss.closeAll?.();
    }
    lastZoneRenderKey = '';
    renderPicker();
  }

  function syncPickerChrome() {
    const picker = $('idleHuntPicker');
    if (!picker) return;
    picker.classList.toggle('is-open', pickerOpen);
    picker.setAttribute('aria-hidden', pickerOpen ? 'false' : 'true');
    $('idleHuntPickMap')?.classList.toggle('is-active', pickerOpen);
  }

  function renderPicker() {
    ensurePickerUi();
    const picker = $('idleHuntPicker');
    const wrap = $('idleHuntPickerBody');
    const title = $('idleHuntPickerTitle');
    const backBtn = $('idleHuntPickerBack');
    if (!picker || !wrap || typeof IdleZones === 'undefined') return;
    syncPickerChrome();
    if (!pickerOpen) {
      lastZoneRenderKey = '';
      return;
    }
    const selected = IdleZones.id(currentZone());
    const nameKey = IdleZones.list.map((z) => {
      const cfg = IdleZones.configFor(z);
      const band = IdleZones.bandOf(z);
      return `${band.key}:${band.min}-${band.max}:${band.name}|${cfg.name || ''}`;
    }).join('~');
    const key = `${pickerView}|${pickerBandKey}|${selected}|${JSON.stringify(state.bossCleared)}|${JSON.stringify(state.replayKills)}|${nameKey}`;
    if (key === lastZoneRenderKey && wrap.childElementCount) return;
    lastZoneRenderKey = key;
    if (backBtn) backBtn.hidden = pickerView !== 'maps';
    if (pickerView === 'maps') {
      const band = IdleZones.bandByKey(pickerBandKey);
      if (title) title.textContent = band ? IdleZones.bandLabel(band) : '地圖';
      wrap.innerHTML = (band?.maps || []).map((zone) => {
        const unlocked = IdleZones.isUnlocked(zone);
        const zid = IdleZones.id(zone);
        const active = zid === selected;
        const kills = mapKillCount(zid);
        const cleared = isBossCleared(zid);
        const replayN = replayNeed(zid);
        const need = smallKillNeed(zid);
        const status = !unlocked
          ? '擊敗上一張 BOSS 解鎖'
          : (!cleared
            ? `小怪 ${Math.min(need, kills)}/${need}`
            : (replayN > 0
              ? `通關 · 再戰 ${Math.min(replayN, replayKillCount(zid))}/${replayN}`
              : '已通關'));
        return `<button type="button" class="idle-hunt-zone${active ? ' is-active' : ''}${unlocked ? '' : ' is-locked'}"
          data-zone="${zid}" ${unlocked ? '' : 'disabled'}>
          <span class="idle-hunt-zone-region">${IdleZones.configFor(zone).regionName || zone.regionName}</span>
          <span class="idle-hunt-zone-name">${IdleZones.configFor(zone).name || zone.name}</span>
          <span class="idle-hunt-zone-lv">${status}</span>
        </button>`;
      }).join('');
      return;
    }
    if (title) title.textContent = '選擇地區';
    wrap.innerHTML = IdleZones.bands().map((band) => {
      const unlocked = IdleZones.isBandUnlocked(band);
      const current = IdleZones.bandOf(currentZone()).key === band.key;
      const cleared = (band.maps || []).filter((z) => isBossCleared(IdleZones.id(z))).length;
      return `<button type="button" class="idle-hunt-band${current ? ' is-active' : ''}${unlocked ? '' : ' is-locked'}"
        data-band="${band.key}" ${unlocked ? '' : 'disabled'}>
        <span class="idle-hunt-band-name">${IdleZones.bandLabel(band)}</span>
        <span class="idle-hunt-band-meta">${unlocked ? `${cleared}/${band.maps.length} 通關 · Lv.${band.min}～${band.max} · ${band.maps.length} 張` : `角色 ${band.min} 等解鎖`}</span>
      </button>`;
    }).join('');
  }

  function render() {
    renderField();
    renderHud();
    layoutHpBar();
    layoutActionsBar();
    applyHeaderLayout();
  }

  function applyKill(dead, opts = {}) {
    if (!dead) return;
    if (keepDamageTrialBossAlive(dead)) {
      if (!state.queue.includes(dead)) state.queue.unshift(dead);
      return;
    }
    if (typeof SkillMobStatus !== 'undefined') SkillMobStatus.clearMob?.(dead);
    const idx = mobQueueIndex(dead);
    const originOverride = opts.origin;
    const deadEl = mobActorEl(dead.uid);
    const visibleInQueue = idx >= 0 && idx < VISIBLE_QUEUE_LEN;
    const showDeath = (visibleInQueue || !!deadEl)
      && !(typeof document !== 'undefined' && document.hidden);
    const virtualPt = idx >= 0 ? queueMobPoint(idx) : null;
    const at = virtualPt || { x: 360, y: 390 };
    const fallX = originOverride?.x ?? parsePx(deadEl?.style.left);
    const fallY = originOverride?.y ?? parsePx(deadEl?.style.top);
    const origin = {
      x: fallX != null ? fallX : at.x,
      y: fallY != null ? fallY : at.y,
    };
    if (showDeath) {
      const dyingCount = (state.dying || []).length;
      if (dyingCount >= MAX_DYING_VISUAL) {
        // 高速擊殺尖峰：獎勵照發，直接移除 actor，不追加死亡動畫
        deadEl?.remove();
      } else {
        if (!(state.dying || []).some((d) => String(d.uid) === String(dead.uid))) {
          state.dying.push({
            uid: dead.uid,
            name: dead.name,
            iconId: dead.iconId,
            isBoss: !!dead.isBoss,
            bossScaleSprite: !!dead.bossScaleSprite,
            bossScaleHud: !!dead.bossScaleHud,
            x: origin.x,
            y: origin.y,
            elapsed: 0,
          });
        }
        beginMobDeathVisual(dead, origin);
      }
    }
    state.kills += 1;
    const zone = typeof IdleZones !== 'undefined' ? IdleZones.get(state.zoneId) : null;
    const rewardsFn = IdleZones.rewardsFor || IdleZones.rewardsFor;
    const rewards = typeof IdleZones !== 'undefined' && rewardsFn
      ? rewardsFn.call(IdleZones, zone, !!dead?.isBoss)
      : { killExp: 0, killGold: 1 };
    const extraRows = [];
    if (!(state.dungeon && state.dungeon.useFieldGold === false)) {
      const gold = Math.max(0, Math.floor(Number(rewards.killGold) || 0));
      if (gold > 0) extraRows.push({ kind: 'meso', amount: gold });
    }
    if (state.dungeon && !state.dungeon.useFieldDrops && !dead?.isBoss) {
      const dungeonDrops = Array.isArray(state.dungeon.mobDrops) ? state.dungeon.mobDrops : [];
      if (dungeonDrops.length && typeof IdleHuntDropData !== 'undefined') {
        const rateMult = Math.max(0, Number(state.dungeon.dropRateMult) || 1);
        const amountMult = Math.max(0, Number(state.dungeon.dropAmountMult) || 1);
        dungeonDrops.forEach((row) => {
          if (!row || !row.kind) return;
          const chance = Math.min(100, IdleHuntDropData.chancePercent(row) * rateMult);
          if (Math.random() * 100 >= chance) return;
          const baseAmt = IdleHuntDropData.amount(row);
          const amt = Math.max(1, Math.floor(baseAmt * amountMult));
          extraRows.push({ ...row, amount: amt });
        });
      }
    }
    if (!(state.dungeon && !state.dungeon.useFieldDrops) || extraRows.length) {
      if (state.dungeon && !state.dungeon.useFieldDrops) {
        if (extraRows.length) grantDrop(!!dead?.isBoss, origin, extraRows, { allowItems: false });
      } else {
        grantDrop(!!dead?.isBoss, origin, extraRows);
      }
    }
    if (!state.dungeon && typeof CharacterProgression !== 'undefined') {
      CharacterProgression.addHuntExp?.(rewards.killExp, rewards.mobLevel);
    }
    if (state.dungeon) {
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.onHuntKill?.(dead);
      if (!opts.skipFillQueue && state.dungeon?.status === 'running') fillQueue();
      if (!opts.skipSave) save();
      return;
    }
    if (dead?.isBoss) {
      const rematch = isBossCleared();
      const loot = state.lastDrop && state.lastDrop !== '無' ? `，${state.lastDrop}` : '';
      stopChapterBossTimer();
      state.bossCleared[state.zoneId] = true;
      state.replayKills[state.zoneId] = 0;
      state.huntMode = 'mob';
      state.queue = [];
      state.atkAcc = 0;
      state.lastDrop = rematch
        ? `${dead.name || 'BOSS'} 已再次擊敗${loot}`
        : `${dead.name || 'BOSS'} 已擊敗，下一張地圖已解鎖${loot}`;
      healToFull();
    } else if (isBossCleared()) {
      const need = replayNeed();
      if (need > 0) {
        const have = replayKillCount() + 1;
        state.replayKills[state.zoneId] = have;
        if (have >= need) {
          state.lastDrop = `已再擊殺 ${need} 隻小怪，可再次挑戰 BOSS`;
        }
      }
    } else {
      const need = smallKillNeed();
      const have = Math.min(need, mapKillCount() + 1);
      state.mapKills[state.zoneId] = have;
      if (have >= need) {
        state.lastDrop = `小怪已達 ${need} 隻，可挑戰 BOSS`;
      }
    }
    if (!opts.skipFillQueue) fillQueue();
    if (!opts.skipSave) save();
  }

  /** 被動週期回 HP（強化恢復／魔力無限等）；只實作 HP，不回 MP */
  const PASSIVE_HP_REGEN = [
    {
      id: '1110000', // 英雄三轉：強化恢復 — 每 u 秒回最大 HP 的 x%
      intervalSec: (st) => Math.max(1, Number(st.u) || 1),
      recoverPct: (st) => Math.max(0, Number(st.xVal) || 0),
    },
    {
      id: '2120004', // 火毒四轉：魔力無限 — 每 x 秒回 s% HP
      intervalSec: (st) => Math.max(1, Number(st.xVal) || 5),
      recoverPct: (st) => Math.max(0, Number(st.s) || 0),
    },
    {
      id: '2220004', // 冰雷四轉：魔力無限 — 每 x 秒回 s%
      intervalSec: (st) => Math.max(1, Number(st.xVal) || 5),
      recoverPct: (st) => Math.max(0, Number(st.s) || 0),
    },
  ];

  function tickPassiveRegen(dt) {
    if (typeof CharacterSkills === 'undefined' || typeof SkillCatalog === 'undefined'
      || typeof SkillFormula === 'undefined') return;
    if (isPlayerDead()) return;
    if (!state.passiveRegenAccById || typeof state.passiveRegenAccById !== 'object') {
      state.passiveRegenAccById = Object.create(null);
    }
    const accMap = state.passiveRegenAccById;
    const maxHp = playerMaxHp();
    PASSIVE_HP_REGEN.forEach((src) => {
      const level = CharacterSkills.getLevel?.(src.id) || 0;
      if (!(level > 0)) return;
      const skill = SkillCatalog.getSkill?.(src.id);
      if (!skill?.common) return;
      const st = SkillFormula.evalStatCommon(skill.common, level);
      const intervalSec = src.intervalSec(st);
      const recoverPct = src.recoverPct(st);
      if (!(recoverPct > 0) || !(intervalSec > 0)) return;
      accMap[src.id] = (Number(accMap[src.id]) || 0) + dt;
      while (accMap[src.id] >= intervalSec) {
        accMap[src.id] -= intervalSec;
        const heal = Math.max(1, Math.floor(maxHp * recoverPct / 100));
        state.hp = Math.min(maxHp, (Number(state.hp) || 0) + heal);
      }
    });
  }

  function tick(opts = {}) {
    const skipVisual = !!opts.skipVisual
      || (typeof document !== 'undefined' && document.hidden);
    if (isBlockingPanelOpen()) {
      if (state.running) {
        resumeAfterPanelClose = true;
        stop(false);
      }
      return;
    }
    const dt = scaleDtSec(TICK_MS / 1000);
    if (fieldTransition) {
      if (!skipVisual) {
        pruneDying();
        advanceAllSprites(dt);
        if (open) render();
      }
      return;
    }
    if (!canFight()) {
      stop(false);
      if (!skipVisual) render();
      return;
    }
    if (tickChapterBossTimer(dt)) {
      onChapterBossTimeUp();
      if (!skipVisual && open) render();
      return;
    }
    state.power = readPower();
    fillQueue();
    const combatCtx = skipVisual ? huntCombatCtx({ quietFx: true }) : huntCombatCtx();
    if (typeof SkillBuffRuntime !== 'undefined') {
      SkillBuffRuntime.tick?.(undefined, combatCtx);
    }
    if (typeof SkillMobStatus !== 'undefined') {
      SkillMobStatus.tick?.(undefined, combatCtx, dt);
    }
    tickPassiveRegen(dt);
    state.atkAcc += dt;
    const delay = attackDelaySec();
    let hits = 0;
    while (state.atkAcc >= delay && hits < 20) {
      if (isPlayerDead()) break;

      // 先選招：持續引導（伊修塔爾）期間仍可挑有 CD 的昇龍等打斷，不可在 isCastLocked 時直接 break
      const picked = typeof SkillCombat !== 'undefined'
        ? SkillCombat.pickNextCast?.({ wzAttackSpeed: currentWzAttackSpeed() })
        : null;

      if (picked) {
        hits += 1;
        state.preferSkillFirst = false;
        state.preferSkillFirstWait = 0;
        const result = SkillCombat.cast(picked, huntCombatCtx({
          wzAttackSpeed: currentWzAttackSpeed(),
          attackSpeedStage: currentWzAttackSpeed(),
          // 背景：略過傷害數字／受擊閃光，保留結算
          quietFx: skipVisual,
        }));
        // 與 BOSS tickPlayer：result.cast 後 afterExternalHits 同一套——依實際 hp 清隊
        if (result?.cast) applySkillMobStateSync(result.kills || []);
        if (!skipVisual) syncComboOrbsUi();
        // 有 CD：特效／傷害背景結算，不佔普攻節拍、不中斷連打
        if (picked.hasCd) continue;
        state.atkAcc = 0;
        break;
      }

      // 施放鎖／持續引導中：不可改打普攻（引導無 CD 可打斷時維持通道）
      if (typeof SkillCombat !== 'undefined'
        && (SkillCombat.isCastLocked?.() || SkillCombat.hasActiveSustain?.())) {
        break;
      }

      // 開場優先技能：本 tick 已無技能可放就立刻普攻，勿空等造成超高速空揮
      if (state.preferSkillFirst) {
        state.preferSkillFirst = false;
        state.preferSkillFirstWait = 0;
      }

      const available = typeof SkillCombat !== 'undefined' && SkillCombat.filterChainAvailableMobs
        ? SkillCombat.filterChainAvailableMobs(state.queue)
        : state.queue;
      const front = (available || []).find((m) => m && Number(m.hp) > 0) || null;
      if (!front) break;
      state.atkAcc -= delay;
      hits += 1;
      if (!skipVisual && typeof Paperdoll !== 'undefined' && typeof Paperdoll.playHuntSwing === 'function') {
        Paperdoll.playHuntSwing(delay * 1000);
      }
      const hit = rollHitDamage(!!front.isBoss);
      let rolled = hit.dmg;
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.applyOutgoingDamageMods === 'function') {
        rolled = SkillMobStatus.applyOutgoingDamageMods(front, rolled, {
          isCritical: !!hit.isCritical,
          skillId: null,
        });
      }
      const dmg = resolveMobHitDamage(front, rolled);
      if (!(dmg > 0)) break;
      if (!skipVisual) showMobDamage(front, dmg, hit.isCritical);
      if (state.dungeon && typeof IdleDungeon !== 'undefined') IdleDungeon.onHuntDamage?.(dmg);
      front.hp -= dmg;
      if (typeof SkillMobStatus !== 'undefined'
        && typeof SkillMobStatus.afterPlayerDamagedMob === 'function') {
        SkillMobStatus.afterPlayerDamagedMob(front, true, { skillId: null });
      }
      if (typeof SkillComboOrbs !== 'undefined') {
        SkillComboOrbs.onAttackHit?.();
        if (!skipVisual) syncComboOrbsUi();
      }
      if (keepDamageTrialBossAlive(front)) {
        if (!skipVisual) flashHit(front.uid);
        continue;
      }
      if (front.hp <= 0) {
        applyKill(state.queue.shift());
        continue;
      }
      if (!skipVisual) flashHit(front.uid);
    }
    tickMobAttacks(dt);
    if (state.dungeon && typeof IdleDungeon !== 'undefined') IdleDungeon.onHuntTick?.(dt);
    if (isPlayerDead()) {
      if (!skipVisual) {
        pruneDying();
        advanceAllSprites(dt);
        if (open) render();
      }
      return;
    }
    if (!skipVisual) {
      pruneDying();
      const huntPlayer = $('idleHuntField')?.querySelector('.idle-actor--player');
      if (huntPlayer && typeof IdleMobAnim !== 'undefined' && typeof IdleMobAnim.tickAreaWarning === 'function') {
        IdleMobAnim.tickAreaWarning(huntPlayer, dt);
      }
      advanceAllSprites(dt);
    }
    tryAfkStep();
    if (!skipVisual) {
      syncHuntOverlayBars();
      if (open) scheduleHuntRender();
    }
  }

  function startSpriteTimer() {
    if (spriteTimer != null) return;
    spriteTimer = window.setInterval(() => {
      if (!open || state.running || deathFxPending || isDeathUiLocked()) return;
      pruneDying();
      const huntPlayer = $('idleHuntField')?.querySelector('.idle-actor--player');
      if (huntPlayer && typeof IdleMobAnim !== 'undefined' && typeof IdleMobAnim.tickAreaWarning === 'function') {
        IdleMobAnim.tickAreaWarning(huntPlayer, scaleDtSec(0.09));
      }
      advanceAllSprites(scaleDtSec(0.09));
      syncHuntOverlayBars();
    }, 90);
  }

  function stopSpriteTimer() {
    if (spriteTimer == null) return;
    window.clearInterval(spriteTimer);
    spriteTimer = null;
  }

  function startTimer() {
    bindVisibilityCatchUp();
    startMemReleaseTimer();
    lastSimAt = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
    if (ensureHuntWorker()) {
      if (timer != null) {
        window.clearInterval(timer);
        timer = null;
      }
      try {
        huntWorker.postMessage({ type: 'start', ms: TICK_MS });
        timer = 'worker';
      } catch (_) {
        timer = window.setInterval(() => onHuntHeartbeat(), TICK_MS);
      }
      return;
    }
    if (timer != null) return;
    timer = window.setInterval(() => onHuntHeartbeat(), TICK_MS);
  }

  function stopTimer() {
    if (catchUpRaf) {
      cancelAnimationFrame(catchUpRaf);
      catchUpRaf = 0;
    }
    stopMemReleaseTimer();
    if (huntWorker) {
      try { huntWorker.postMessage({ type: 'stop' }); } catch (_) { /* ignore */ }
    }
    if (timer === 'worker') {
      timer = null;
      return;
    }
    if (timer == null) return;
    window.clearInterval(timer);
    timer = null;
  }

  function ensureHuntWorker() {
    if (huntWorker) return huntWorker;
    if (typeof Worker === 'undefined' || typeof Blob === 'undefined') return null;
    try {
      const src = [
        'let id=null;',
        'onmessage=function(e){',
        '  var d=e.data||{};',
        '  if(d.type==="start"){',
        '    if(id)clearInterval(id);',
        '    var ms=Math.max(16,Number(d.ms)||100);',
        '    id=setInterval(function(){postMessage({type:"tick",t:Date.now()});},ms);',
        '  }else if(d.type==="stop"){',
        '    if(id)clearInterval(id);id=null;',
        '  }',
        '};',
      ].join('');
      huntWorkerBlobUrl = URL.createObjectURL(new Blob([src], { type: 'application/javascript' }));
      huntWorker = new Worker(huntWorkerBlobUrl);
      huntWorker.onmessage = (e) => {
        if (e?.data?.type === 'tick') onHuntHeartbeat();
      };
      huntWorker.onerror = () => {
        try { huntWorker?.terminate(); } catch (_) { /* ignore */ }
        huntWorker = null;
        if (timer === 'worker' && state.running) {
          timer = window.setInterval(() => onHuntHeartbeat(), TICK_MS);
        }
      };
      return huntWorker;
    } catch (_) {
      huntWorker = null;
      return null;
    }
  }

  function onHuntHeartbeat() {
    if (!state.running) return;
    const now = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
    if (!(lastSimAt > 0)) lastSimAt = now - TICK_MS;
    let lag = now - lastSimAt;
    const hidden = typeof document !== 'undefined' && document.hidden;
    const burst = hidden ? CATCH_UP_BURST : 8;
    let n = 0;
    while (lag >= TICK_MS * 0.85 && n < burst) {
      tick({ skipVisual: hidden || n > 0 });
      lastSimAt += TICK_MS;
      lag = now - lastSimAt;
      n += 1;
      if (!state.running) break;
    }
    // 長時間被節流：保留一段欠債給後續 heartbeat／回前景補算，避免一次爆量
    if (lag > MAX_CATCH_UP_MS) {
      lastSimAt = now - MAX_CATCH_UP_MS;
    }
  }

  function scheduleCatchUp() {
    if (!state.running) return;
    if (catchUpRaf) return;
    const step = () => {
      catchUpRaf = 0;
      if (!state.running) return;
      const now = (typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now();
      if (!(lastSimAt > 0)) {
        lastSimAt = now;
        if (open) render();
        return;
      }
      let lag = Math.min(MAX_CATCH_UP_MS, now - lastSimAt);
      let n = 0;
      while (lag >= TICK_MS && n < CATCH_UP_BURST) {
        tick({ skipVisual: true });
        lastSimAt += TICK_MS;
        lag -= TICK_MS;
        n += 1;
        if (!state.running) break;
      }
      if (state.running && lag >= TICK_MS) {
        catchUpRaf = requestAnimationFrame(step);
        return;
      }
      if (open && !(typeof document !== 'undefined' && document.hidden)) render();
    };
    catchUpRaf = requestAnimationFrame(step);
  }

  function bindVisibilityCatchUp() {
    if (visibilityBound || typeof document === 'undefined') return;
    visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (state.running) scheduleCatchUp();
      } else if (state.running) {
        // 進背景立刻存一次進度（sessionPersistence 也會存）
        try { save({ flush: true }); } catch (_) { /* ignore */ }
        try { CharacterProgression.flushSave?.(); } catch (_) { /* ignore */ }
        // 背景看不到畫面：立刻軟釋放視覺／解碼圖，降低長掛記憶體
        maybeAutoReleaseMemory(true);
      }
    });
  }

  async function startBossFight() {
    if (state.dungeon || fieldTransition) return;
    if (!canFightBoss() || !canFight()) {
      render();
      return;
    }
    await runBossIntro();
  }

  /** 地下城：達擊殺數後召喚頭目（可在副本中呼叫） */
  async function startDungeonBossFight() {
    if (!state.dungeon || state.dungeon.type !== 'normal') return;
    if (state.huntMode === 'boss' || fieldTransition) return;
    await runBossIntro({ dungeon: true });
  }

  async function runBossIntro(opts = {}) {
    const forDungeon = !!opts.dungeon;
    if (!forDungeon && (state.dungeon || fieldTransition)) return;
    if (forDungeon && (!state.dungeon || fieldTransition)) return;
    const seq = ++transitionSeq;
    const wasRunning = state.running;
    fieldTransition = { kind: 'bossIntro', seq, phase: 'warning', resumeAfter: wasRunning || isAfkActive() };
    if (wasRunning) stop(false);
    startSpriteTimer();

    healToFull();
    state.dying = [];
    state.queue = [];
    state.atkAcc = 0;
    resetMobAtk();
    clearFieldDrops(true);
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    stage?.querySelectorAll('.idle-actor--mob').forEach((el) => el.remove());
    render();

    try {
      await flashBossWarning(BOSS_WARNING_MS);
      if (seq !== transitionSeq) return;

      fieldTransition.phase = 'entrance';
      state.huntMode = 'boss';
      if (forDungeon && state.dungeon) state.dungeon.bossSummoned = true;
      state.queue = [];
      fillQueue();
      save();

      const boss = state.queue[0];
      if (boss?.iconId) await preloadMobAllActions(boss.iconId);
      if (seq !== transitionSeq) return;
      if (boss) await playBossEntrance(boss);
      if (seq !== transitionSeq) return;
    } catch (err) {
      console.error('[IdleHunt] BOSS intro failed:', err);
      if (seq === transitionSeq) {
        state.huntMode = 'boss';
        if (forDungeon && state.dungeon) state.dungeon.bossSummoned = true;
        state.queue = [];
        fillQueue();
        save();
      }
    } finally {
      if (seq === transitionSeq) {
        const shouldResume = !!(fieldTransition && fieldTransition.resumeAfter);
        fieldTransition = null;
        if (state.huntMode === 'boss' && !state.dungeon) {
          startChapterBossTimer();
        }
        if (shouldResume && !state.running) start();
        else render();
        if (state.dungeon && typeof IdleDungeon !== 'undefined') IdleDungeon.renderHud?.();
      }
    }
  }

  function start() {
    if (jobLinePickerOpen) {
      render();
      return;
    }
    if (isDeathUiLocked() && isPlayerDead()) {
      render();
      return;
    }
    if (isBlockingPanelOpen()) {
      if (state.running) {
        resumeAfterPanelClose = true;
        stop(true);
      } else {
        resumeAfterPanelClose = true;
      }
      render();
      return;
    }
    state.power = readPower();
    if (!canFight()) {
      render();
      return;
    }
    if (isPlayerDead()) {
      if (state.huntMode === 'boss' && !state.dungeon) {
        failBossFight();
      }
      revivePlayer();
      combatPaused = false;
    }
    hideChapterDeathModal();
    const resume = combatPaused;
    combatPaused = false;
    if (!resume) {
      // 全新開始才重置怪攻節奏；暫停恢復則保留累計，避免連點無傷
      resetMobAtk();
      state.atkAcc = attackDelaySec();
      state.preferSkillFirst = true;
      state.preferSkillFirstWait = 0;
      state.deferredKills = [];
      if (typeof SkillCombat !== 'undefined') {
        SkillCombat.reset?.({ keepBuffs: true, keepCombo: true, keepCooldowns: true });
      }
    }
    fillQueue();
    state.running = true;
    // 手動開始／恢復時解除推圖連跳鎖
    state.afkHoldAdvance = false;
    startTimer();
    render();
    if (typeof Paperdoll !== 'undefined') Paperdoll.refresh?.();
    // github.io：戰鬥開始先暖機技能欄／連鎖圖，減少邊播邊載抽搐
    try { SkillEffectPlayer.warmUpCombatLoadout?.(); } catch (_) { /* ignore */ }
    // 略延遲再推圖，讓暫停／託管在連續過圖之間有機會接住
    scheduleAfkStep(220);
  }

  function stop(doSave) {
    if (state.running) combatPaused = true;
    state.running = false;
    // 取消尚未結算的延遲怪傷（暫停中不應續打）
    mobDamageSeq += 1;
    if (afkStepTimer != null) {
      window.clearTimeout(afkStepTimer);
      afkStepTimer = null;
    }
    stopTimer();
    try { SkillCombat.invalidateAsyncCasts?.(); } catch (_) { /* ignore */ }
    if (doSave !== false) save({ flush: true });
    try { CharacterProgression.flushSave?.(); } catch (_) { /* ignore */ }
    render();
    if (typeof Paperdoll !== 'undefined') Paperdoll.refresh?.();
  }

  function uiImg(file, w, h, className = '') {
    const cls = className ? ` class="${className}"` : '';
    return `<img${cls} src="${UI}${file}" width="${w}" height="${h}" alt="" draggable="false">`;
  }

  function imgBtn(id, file, w, h, label) {
    return `<button type="button" id="${id}" class="idle-hunt-imgbtn" title="${label}">${uiImg(file, w, h)}</button>`;
  }

  function actBtn(id, color, w, h, label, extraClass = '', opts = {}) {
    const file = color === 'blue' ? 'btn_action_blue.png'
      : color === 'red' ? 'btn_action_red.png' : 'btn_action_green.png';
    const pressed = opts.pressed ? ' aria-pressed="true"' : ' aria-pressed="false"';
    const disabled = opts.disabled ? ' disabled' : '';
    return `<button type="button" id="${id}" class="idle-hunt-actbtn idle-hunt-actbtn--${color} ${extraClass}"${pressed}${disabled}>
      ${uiImg(file, w, h, 'idle-hunt-actbtn__img')}
      <span class="idle-hunt-actbtn__label">${label}</span>
    </button>`;
  }

  function bgMarkup() {
    const [pw, ph] = UI_SIZE.panel;
    return uiImg('idelhunt_backgrnd.png', pw, ph, 'idle-hunt-shell__bg');
  }

  function applyHeaderLayout() {
    const header = $('idleHuntRoot')?.querySelector('.idle-hunt-header');
    const title = header?.querySelector('.idle-hunt-header__title');
    const currentMap = header?.querySelector('.idle-hunt-current-map');
    if (!title) return;
    const [tl, tt] = UI_SIZE.titlePos;
    title.style.left = `${tl}px`;
    title.style.top = `${tt}px`;
    if (currentMap) {
      const [mr, mtop] = UI_SIZE.currentMapPos;
      currentMap.style.right = `${mr}px`;
      currentMap.style.top = `${mtop}px`;
      currentMap.style.left = 'auto';
    }
  }

  function mapbarMarkup() {
    return '';
  }

  function headerMarkup() {
    const [tw, th] = UI_SIZE.title;
    return `<div class="idle-hunt-header">
      ${uiImg('title.png', tw, th, 'idle-hunt-header__title')}
      <span id="idleHuntCurrentMap" class="idle-hunt-current-map">—</span>
    </div>`;
  }

  function expMarkup() {
    const [bw, bh] = UI_SIZE.expBg;
    const [fw, fh] = UI_SIZE.expFill;
    const [il, it] = UI_SIZE.expFillInset;
    return `<div class="idle-hunt-exp">
      <div class="idle-hunt-exp-bar" id="idleHuntExpBar" style="--exp-fill-w:${fw}px;--exp-fill-h:${fh}px;--exp-fill-l:${il}px;--exp-fill-t:${it}px">
        ${uiImg('bar_exp_bg.png', bw, bh, 'idle-hunt-exp-bar__bg')}
        <div class="idle-hunt-exp-bar__fill-clip" id="idleHuntExpFillClip">
          <div class="idle-hunt-exp-bar__fill" id="idleHuntExpFill"></div>
        </div>
        <span class="idle-hunt-exp-bar__text" id="idleHuntExpPct">0 / 0（0.0%）</span>
      </div>
    </div>`;
  }

  function actionsMarkup() {
    const b = UI_SIZE.btn;
    return `<div class="idle-hunt-actions">
      ${actBtn('idleHuntAfk', 'green', b.green[0], b.green[1], '自動推圖', 'idle-hunt-actbtn--afk is-on is-afk-push', { pressed: true })}
      ${actBtn('idleHuntStart', 'green', b.green[0], b.green[1], '開始')}
      ${actBtn('idleHuntPrevMap', 'blue', b.blue[0], b.blue[1], '上一張地圖', '', { disabled: true })}
      ${actBtn('idleHuntFightBoss', 'red', b.red[0], b.red[1], '挑戰 BOSS', 'idle-hunt-actbtn--boss', { disabled: true })}
      ${actBtn('idleHuntNextMap', 'blue', b.blue[0], b.blue[1], '下一張地圖', '', { disabled: true })}
    </div>`;
  }

  function pickerMarkup() {
    return `<div id="idleHuntPicker" class="idle-hunt-picker" role="dialog" aria-modal="false" aria-labelledby="idleHuntPickerTitle" aria-hidden="true">
        <div class="idle-hunt-picker-head">
          <button type="button" id="idleHuntPickerBack" class="idle-hunt-picker-nav" hidden>← 區間</button>
          <span id="idleHuntPickerTitle">選擇地區</span>
          <button type="button" id="idleHuntPickerClose" class="idle-hunt-picker-nav">關閉</button>
        </div>
        <div id="idleHuntPickerBody" class="idle-hunt-picker-body"></div>
      </div>`;
  }

  function ensurePickerUi() {
    let picker = $('idleHuntPicker');
    const nav = $('appNavSidebar');
    if (!picker) {
      if (nav) nav.insertAdjacentHTML('afterend', pickerMarkup());
      else document.body.insertAdjacentHTML('beforeend', pickerMarkup());
      picker = $('idleHuntPicker');
    } else {
      const inField = picker.closest('.idle-hunt-field-wrap');
      if (inField || (nav && picker.previousElementSibling !== nav)) {
        picker.remove();
        if (nav) nav.insertAdjacentElement('afterend', picker);
        else document.body.appendChild(picker);
      }
    }
    syncPickerChrome();
    return picker;
  }

  function fieldBlockMarkup() {
    return `<div class="idle-hunt-field-wrap">
      <div id="idleHuntField" class="idle-hunt-field"></div>
    </div>`;
  }

  function mainPanelMarkup() {
    return `<div class="idle-hunt-main">
      ${fieldBlockMarkup()}
      ${hudMarkup()}
      ${expMarkup()}
    </div>`;
  }

  function ensureDom() {
    if ($('idleHuntRoot')) return;
    const root = document.createElement('div');
    root.id = 'idleHuntRoot';
    root.className = 'idle-hunt-root is-hidden';
    root.setAttribute('aria-label', '放置狩獵');
    root.dataset.uiVer = String(UI_VER);
    const [pw, ph] = UI_SIZE.panel;
    root.innerHTML = `
      <div class="idle-hunt-shell" style="width:${pw}px;height:${ph}px">
        ${bgMarkup()}
        ${headerMarkup()}
        ${mainPanelMarkup()}
        ${hpBarMarkup()}
        ${actionsMarkup()}
      </div>
    `;
    document.body.appendChild(root);
    ensurePickerUi();
  }

  function statSlotMarkup(file, size, valueId, initial = '0') {
    const [w, h] = size;
    return `<div class="idle-hunt-stat__slot">
      ${uiImg(file, w, h, 'idle-hunt-stat__slot-bg')}
      <strong class="idle-hunt-stat__slot-value" id="${valueId}">${initial}</strong>
    </div>`;
  }

  function hudMarkup() {
    const s = UI_SIZE.stat;
    return `
        <div class="idle-hunt-hud">
          <div class="idle-hunt-stat idle-hunt-stat--power">
            ${statSlotMarkup('icon_atp.png', s.atp, 'idleHuntPower', '—')}
          </div>
          <div class="idle-hunt-stat idle-hunt-stat--mobs">
            ${statSlotMarkup('bar_kill.png', s.kill, 'idleHuntMobKills', '0/100')}
          </div>
          <div class="idle-hunt-stat idle-hunt-stat--gold">
            ${statSlotMarkup('bar_coin.png', s.coin, 'idleHuntGold', '0')}
          </div>
          <div class="idle-hunt-stat idle-hunt-stat--level">
            <span class="idle-hunt-stat__label">等級</span>
            <strong class="idle-hunt-stat__value" id="idleHuntLevel">1</strong>
          </div>
        </div>`;
  }

  function hpBarMarkup() {
    const [bw, bh] = UI_SIZE.hpBg;
    const [fw, fh] = UI_SIZE.hpFill;
    const [il, it] = UI_SIZE.hpFillInset;
    return `
        <div class="idle-hunt-hp-wrap">
          <div class="idle-hunt-hp-bar" id="idleHuntHpBar" aria-label="HP" style="width:${bw}px;height:${bh}px;--hp-fill-w:${fw}px;--hp-fill-h:${fh}px;--hp-fill-l:${il}px;--hp-fill-t:${it}px">
            ${uiImg('bar_hp_bg.png', bw, bh, 'idle-hunt-hp-bar__bg')}
            <div class="idle-hunt-hp-bar__fill-clip" id="idleHuntHpFillClip">
              <div class="idle-hunt-hp-bar__fill" id="idleHuntHpFill"></div>
            </div>
            <span class="idle-hunt-hp-bar__text" id="idleHuntHpText">0 / 0</span>
          </div>
        </div>`;
  }

  function preserveText(id) {
    const el = $(id);
    return el ? el.textContent : '';
  }

  function hudUiCurrent() {
    const hud = $('idleHuntRoot')?.querySelector('.idle-hunt-hud');
    if (!hud) return false;
    const powerStat = hud.querySelector('.idle-hunt-stat--power');
    const mobStat = hud.querySelector('.idle-hunt-stat--mobs');
    const powerBg = powerStat?.querySelector('.idle-hunt-stat__slot-bg');
    const killBg = mobStat?.querySelector('.idle-hunt-stat__slot-bg');
    const goldValue = $('idleHuntGold');
    return !!(
      powerStat?.querySelector('.idle-hunt-stat__slot')
      && killBg
      && goldValue?.classList.contains('idle-hunt-stat__slot-value')
      && !powerStat.querySelector('.idle-hunt-stat__label')
      && !mobStat?.querySelector('.idle-hunt-stat__label')
      && !hud.querySelector('.idle-hunt-stat__coin')
      && Number(powerBg?.getAttribute('width')) === UI_SIZE.stat.atp[0]
      && Number(killBg.getAttribute('width')) === UI_SIZE.stat.kill[0]
    );
  }

  function ensureHudUi(force) {
    if (!force && hudUiCurrent()) return;
    const hud = $('idleHuntRoot')?.querySelector('.idle-hunt-hud');
    if (!hud) return;
    const saved = {
      power: preserveText('idleHuntPower'),
      mobs: preserveText('idleHuntMobKills'),
      gold: preserveText('idleHuntGold'),
      level: preserveText('idleHuntLevel'),
    };
    hud.outerHTML = hudMarkup();
    if (saved.power) $('idleHuntPower').textContent = saved.power;
    if (saved.mobs) $('idleHuntMobKills').textContent = saved.mobs;
    if (saved.gold) $('idleHuntGold').textContent = saved.gold;
    if (saved.level) $('idleHuntLevel').textContent = saved.level;
  }

  function hpBarAnchor() {
    return $('idleHuntRoot')?.querySelector('.idle-hunt-shell > .idle-hunt-actions') || null;
  }

  function layoutActionsBar() {
    const shell = $('idleHuntRoot')?.querySelector('.idle-hunt-shell');
    const main = shell?.querySelector('.idle-hunt-main');
    const actions = shell?.querySelector('.idle-hunt-actions');
    if (!shell || !main || !actions) return;
    const gap = UI_SIZE.btnGap;
    const btnIds = [
      'idleHuntAfk',
      'idleHuntStart',
      'idleHuntPrevMap',
      'idleHuntFightBoss',
      'idleHuntNextMap',
    ];
    actions.style.left = `${main.offsetLeft}px`;
    actions.style.width = `${main.offsetWidth}px`;
    let x = 0;
    btnIds.forEach((id) => {
      const btn = $(id);
      if (!btn) return;
      const w = btn.querySelector('img')?.getAttribute('width');
      const width = Number(w) || btn.offsetWidth || 0;
      btn.style.left = `${x}px`;
      btn.style.top = '0';
      x += width + gap;
    });
  }

  function layoutHpBar() {
    const shell = $('idleHuntRoot')?.querySelector('.idle-hunt-shell');
    const main = shell?.querySelector('.idle-hunt-main');
    const hpWrap = shell?.querySelector('.idle-hunt-hp-wrap');
    if (!shell || !main || !hpWrap) return;
    const hpWidth = UI_SIZE.hpBg[0];
    const left = main.offsetLeft + Math.round((main.offsetWidth - hpWidth) / 2);
    const top = main.offsetTop + main.offsetHeight + UI_SIZE.hpGap;
    hpWrap.style.left = `${left}px`;
    hpWrap.style.top = `${top}px`;
    hpWrap.style.bottom = 'auto';
  }

  function ensureHpAnchorUi() {
    const shell = $('idleHuntRoot')?.querySelector('.idle-hunt-shell');
    if (!shell) return;
    let hpWrap = shell.querySelector('.idle-hunt-hp-wrap');
    const main = shell.querySelector('.idle-hunt-main');
    if (!hpWrap) {
      const anchor = hpBarAnchor();
      if (anchor) anchor.insertAdjacentHTML('beforebegin', hpBarMarkup());
      else shell.insertAdjacentHTML('beforeend', hpBarMarkup());
      hpWrap = shell.querySelector('.idle-hunt-hp-wrap');
    } else if (main?.contains(hpWrap) || hpWrap.parentElement !== shell) {
      const anchor = hpBarAnchor();
      if (anchor) shell.insertBefore(hpWrap, anchor);
      else shell.appendChild(hpWrap);
    }
    if (!hpWrap) return;
    layoutHpBar();
  }

  function ensureMainPanelUi(force) {
    const shell = $('idleHuntRoot')?.querySelector('.idle-hunt-shell');
    if (!shell) return;
    let main = shell.querySelector('.idle-hunt-main');
    const fieldWrap = shell.querySelector('.idle-hunt-field-wrap');
    const hud = shell.querySelector('.idle-hunt-hud');
    const exp = shell.querySelector('.idle-hunt-exp');
    const hpWrap = shell.querySelector('.idle-hunt-hp-wrap');
    if (!fieldWrap || !hud || !exp) return;
    if (!force
      && main?.contains(fieldWrap)
      && main.contains(hud)
      && main.contains(exp)
      && !main.contains(hpWrap)) return;
    if (!main) {
      main = document.createElement('div');
      main.className = 'idle-hunt-main';
      const anchor = hpBarAnchor() || shell.querySelector('.idle-hunt-actions');
      shell.insertBefore(main, anchor);
    }
    main.append(fieldWrap, hud, exp);
    if (hpWrap && main.contains(hpWrap)) {
      const anchor = hpBarAnchor();
      if (anchor) shell.insertBefore(hpWrap, anchor);
      else shell.appendChild(hpWrap);
    }
  }

  function ensureHeaderUi(force) {
    const root = $('idleHuntRoot');
    const shell = root?.querySelector('.idle-hunt-shell');
    const header = shell?.querySelector('.idle-hunt-header');
    if (!shell || !header) return;
    const titleImg = header.querySelector('.idle-hunt-header__title');
    const headerOk = titleImg && Number(titleImg.getAttribute('width')) === UI_SIZE.title[0];
    const mapInHeader = header?.querySelector(':scope > .idle-hunt-current-map');
    if (!force && headerOk && mapInHeader) return;
    const curMap = preserveText('idleHuntCurrentMap') || '—';
    header.querySelector('.idle-hunt-mapbar')?.remove();
    header.outerHTML = headerMarkup();
    $('idleHuntCurrentMap').textContent = curMap;
    applyHeaderLayout();
  }

  function chromeComplete(root) {
    if (!root) return false;
    const shell = root.querySelector('.idle-hunt-shell');
    const hpBg = $('idleHuntHpBar')?.querySelector('.idle-hunt-hp-bar__bg');
    const shellBg = shell?.querySelector('.idle-hunt-shell__bg');
    const [pw, ph] = UI_SIZE.panel;
    return !!(
      shell
      && Number(shell.style.width?.replace('px', '') || UI_SIZE.panel[0]) === pw
      && Number(shell.style.height?.replace('px', '') || 0) === ph
      && shellBg && Number(shellBg.getAttribute('width')) === pw
      && !shell.querySelector('.idle-hunt-frame')
      && !shell.querySelector('.idle-hunt-shell__top-bg')
      && root.querySelector('.idle-hunt-header__title')
      && root.querySelector('.idle-hunt-header .idle-hunt-current-map')
      && root.querySelector('.idle-hunt-actbtn')
      && hudUiCurrent()
      && !root.querySelector('.idle-hunt-exp-label')
      && root.querySelector('.idle-hunt-exp-bar__text')
      && $('idleHuntExpFillClip')
      && $('idleHuntHpFillClip')
      && hpBg && Number(hpBg.getAttribute('width')) === UI_SIZE.hpBg[0]
      && root.querySelector('.idle-hunt-shell > .idle-hunt-main')
      && root.querySelector('.idle-hunt-shell > .idle-hunt-hp-wrap')
      && !root.querySelector('.idle-hunt-main .idle-hunt-hp-wrap')
      && root.querySelector('.idle-hunt-shell > .idle-hunt-actions')
    );
  }

  function ensureShellAnchors() {
    const root = $('idleHuntRoot');
    const shell = root?.querySelector('.idle-hunt-shell');
    if (!shell) return;

    const actions = shell.querySelector('.idle-hunt-actions');

    if (actions && actions.parentElement !== shell) shell.appendChild(actions);

    if (!shell.querySelector('.idle-hunt-actions')) {
      shell.insertAdjacentHTML('beforeend', actionsMarkup());
    }
    shell.querySelector('.idle-hunt-hint')?.remove();
    ensureMainPanelUi(false);
    ensureHpAnchorUi();
    layoutActionsBar();
  }

  function ensureHpBarUi(force) {
    $('idleHuntField')?.querySelector('#idleHuntPlayerHp')?.remove();
    const bg = $('idleHuntHpBar')?.querySelector('.idle-hunt-hp-bar__bg');
    if (!force && bg && Number(bg.getAttribute('width')) === UI_SIZE.hpBg[0]) {
      ensureHpAnchorUi();
      return;
    }
    const shell = $('idleHuntRoot')?.querySelector('.idle-hunt-shell');
    if (!shell) return;
    const savedHp = preserveText('idleHuntHpText');
    const oldWrap = shell.querySelector('.idle-hunt-hp-wrap');
    const oldReset = $('idleHuntReset');
    const oldConfirm = $('idleHuntResetConfirm');
    if (oldReset?.closest('.idle-hunt-hp-wrap')) oldReset.remove();
    if (oldConfirm?.closest('.idle-hunt-hp-wrap')) oldConfirm.remove();
    if (oldWrap) oldWrap.remove();
    const anchor = hpBarAnchor();
    if (anchor) anchor.insertAdjacentHTML('beforebegin', hpBarMarkup());
    else shell.insertAdjacentHTML('beforeend', hpBarMarkup());
    if (savedHp) $('idleHuntHpText').textContent = savedHp;
    ensureHpAnchorUi();
  }

  function ensureChromeUi() {
    const root = $('idleHuntRoot');
    if (!root || (Number(root.dataset.uiVer) >= UI_VER && chromeComplete(root))) return;

    let shell = root.querySelector('.idle-hunt-shell');
    if (!shell) {
      const header = root.querySelector('.idle-hunt-header');
      const main = root.querySelector('.idle-hunt-main');
      if (!main && !header) return;
      const [pw, ph] = UI_SIZE.panel;
      shell = document.createElement('div');
      shell.className = 'idle-hunt-shell';
      shell.style.width = `${pw}px`;
      shell.style.height = `${ph}px`;
      shell.innerHTML = bgMarkup();
      if (header) shell.appendChild(header);
      if (main) shell.appendChild(main);
      root.replaceChildren(shell);
    } else {
      const [pw, ph] = UI_SIZE.panel;
      shell.style.width = `${pw}px`;
      shell.style.height = `${ph}px`;
      shell.querySelector('.idle-hunt-frame')?.remove();
      shell.querySelector('.idle-hunt-shell__top-bg')?.remove();
      const shellBg = shell.querySelector('.idle-hunt-shell__bg');
      if (!shellBg || Number(shellBg.getAttribute('width')) !== pw) {
        shellBg?.remove();
        shell.insertAdjacentHTML('afterbegin', bgMarkup());
      }
    }

    ensureHeaderUi(true);
    applyHeaderLayout();
    ensurePickerUi();
    ensureMainPanelUi(true);
    ensureHpAnchorUi();
    root.querySelector('.idle-hunt-drop')?.closest('.idle-hunt-body')?.remove();
    root.querySelector('.idle-hunt-drop')?.remove();
    root.querySelector('.idle-hunt-hint')?.remove();

    const mapbar = root.querySelector('.idle-hunt-header .idle-hunt-mapbar');
    if (mapbar) mapbar.remove();

    const exp = root.querySelector('.idle-hunt-exp');
    const expBg = exp?.querySelector('.idle-hunt-exp-bar__bg');
    if (exp && (!$('idleHuntExpFillClip')
      || exp.querySelector('.idle-hunt-exp-label')
      || exp.querySelector('.idle-hunt-exp__icon')
      || Number(expBg?.getAttribute('width')) !== UI_SIZE.expBg[0])) {
      const pct = preserveText('idleHuntExpPct');
      exp.outerHTML = expMarkup();
      if (pct) $('idleHuntExpPct').textContent = pct;
    }

    const actions = root.querySelector('.idle-hunt-shell > .idle-hunt-actions')
      || root.querySelector('.idle-hunt-actions');
    const actImg = actions?.querySelector('.idle-hunt-actbtn__img');
    if (actions && (!actions.querySelector('.idle-hunt-actbtn')
      || Number(actImg?.getAttribute('width')) !== UI_SIZE.btn.green[0])) {
      actions.outerHTML = actionsMarkup();
    } else if (!root.querySelector('.idle-hunt-shell > .idle-hunt-actions')
      && !actions?.querySelector('.idle-hunt-actbtn')) {
      root.querySelector('.idle-hunt-shell')?.insertAdjacentHTML('beforeend', actionsMarkup());
    }

    ensureHudUi(true);
    ensureHpBarUi(true);
    ensureShellAnchors();
    layoutActionsBar();
    root.dataset.uiVer = String(UI_VER);
  }

  function ensureResetUi() {
    if ($('idleHuntReset') && $('idleHuntResetConfirm')) return;
    const wrap = $('appNavSidebar')?.querySelector('.app-nav-footer');
    if (!wrap) return;
    if (!$('idleHuntReset')) {
      wrap.insertAdjacentHTML('afterbegin',
        `<button type="button" class="app-nav-item app-nav-item--danger" id="idleHuntReset" data-icon-dir="idlehuntreset" title="重置遊戲數據">
          <img class="app-nav-item-icon" src="images/menubtn/idlehuntreset/normal/0.png" alt="" draggable="false" aria-hidden="true">
          <span class="app-nav-item-label">重置遊戲數據</span>
        </button>`);
    }
    if (!$('idleHuntResetConfirm')) {
      wrap.insertAdjacentHTML('beforeend', `
        <div id="idleHuntResetConfirm" class="app-nav-reset-confirm is-hidden">
          <span>確定清除放置模式全部資料？（模擬器不受影響）</span>
          <div class="app-nav-reset-confirm-actions">
            <button type="button" id="idleHuntResetYes" class="idle-hunt-btn idle-hunt-btn--reset">確定重置</button>
            <button type="button" id="idleHuntResetNo" class="idle-hunt-btn idle-hunt-btn--ghost">取消</button>
          </div>
        </div>`);
    }
  }

  function ensureAfkButton() {
    if ($('idleHuntAfk')) return;
    const shell = $('idleHuntRoot')?.querySelector('.idle-hunt-shell');
    const actions = shell?.querySelector('.idle-hunt-actions');
    if (!actions) return;
    const b = UI_SIZE.btn;
    actions.insertAdjacentHTML('afterbegin',
      actBtn('idleHuntAfk', 'green', b.green[0], b.green[1], '託管', 'idle-hunt-actbtn--afk', { pressed: false }));
  }

  function ensureDungeonButton() {
    if ($('idleHuntDungeon')) return;
  }

  function ensureNpcShopButton() {
    if ($('idleHuntNpcShop')) return;
  }

  function setOpen(next) {
    open = !!next;
    const root = $('idleHuntRoot');
    root?.classList.toggle('is-hidden', !open);
    if (open) {
      fillQueue();
      startSpriteTimer();
      syncBlockingPanelPause();
      if (typeof LevelUpEffect !== 'undefined') LevelUpEffect.warmUp?.();
      if (typeof DamageNumber !== 'undefined') DamageNumber.warmUp?.();
      try { SkillEffectPlayer.warmUpCombatLoadout?.(); } catch (_) { /* ignore */ }
      try { Paperdoll.preloadCurrentLook?.(['stand1']); } catch (_) { /* ignore */ }
      try { preloadZoneAssets(currentZone()); } catch (_) { /* ignore */ }
      maybeShowJobLinePicker();
      // 關閉面板時若正在死亡，重開時補回復活彈窗
      if (isPlayerDead() && !state.dungeon && !deathFxPending && !deathModalOpen) {
        showChapterDeathModal(deathModalMsg || '');
      }
      render();
      if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront(root);
    } else {
      resumeAfterPanelClose = false;
      combatPaused = false;
      cancelFieldTransition();
      // 保留懲罰文案，重開面板時可還原復活彈窗
      hideChapterDeathModal({ keepMsg: true });
      stop();
      // leaveIdle／關面板：下次開始視為全新戰鬥
      combatPaused = false;
      stopSpriteTimer();
      clearFieldDrops(true);
    }
  }

  /** BOSS 等外部場景：暫停並關閉放置視窗，結束後可還原 */
  let externalSuspend = null;

  function suspendForExternal() {
    if (externalSuspend) return;
    externalSuspend = {
      open: !!open,
      running: !!state.running,
    };
    if (state.running) stop(false);
    if (!open) return;
    open = false;
    const root = $('idleHuntRoot');
    root?.classList.add('is-hidden');
    cancelFieldTransition();
    stopSpriteTimer();
    clearFieldDrops(true);
    if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.syncVisible?.();
  }

  function resumeAfterExternal() {
    if (!externalSuspend) return;
    const want = externalSuspend;
    externalSuspend = null;
    if (!want.open) return;
    setOpen(true);
    if (want.running && !isPlayerDead() && canFight() && !jobLinePickerOpen) {
      start();
    }
    if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.syncVisible?.();
  }

  function firstZoneId() {
    if (typeof IdleZones === 'undefined') return 'mapleisland-1';
    const ordered = typeof IdleZones.orderedMaps === 'function' ? IdleZones.orderedMaps() : [];
    const z = ordered[0] || IdleZones.list?.[0];
    const id = z && typeof IdleZones.id === 'function' ? IdleZones.id(z) : '';
    return id || 'mapleisland-1';
  }

  function isJobLinePickerOpen() {
    return jobLinePickerOpen;
  }

  function jobLinePickerMarkup() {
    return `
      <div id="idleHuntJobLinePicker" class="idle-hunt-jobline-picker is-hidden" role="dialog" aria-modal="true" aria-labelledby="idleHuntJobLinePickerTitle">
        <div class="idle-hunt-jobline-picker__box">
          <p id="idleHuntJobLinePickerTitle" class="idle-hunt-jobline-picker__title">選擇職業路線</p>
          <p class="idle-hunt-jobline-picker__hint">選完後才會開始放置冒險</p>
          <p class="idle-hunt-jobline-picker__notice">建議先玩英雄，整體流程較為完善。低等法師裝尚未加入，可能造成嚴重卡關。</p>
          <div id="idleHuntJobLineList" class="idle-hunt-jobline-picker__list"></div>
        </div>
      </div>`;
  }

  function renderJobLinePickerList() {
    const list = $('idleHuntJobLineList');
    if (!list) return;
    const lines = typeof CharacterSkills !== 'undefined' && CharacterSkills.listJobLines
      ? CharacterSkills.listJobLines()
      : [];
    list.innerHTML = lines.map((line) => (
      `<button type="button" class="idle-hunt-jobline-picker__btn" data-job-line="${line.key}">${line.name}</button>`
    )).join('');
  }

  function setJobLinePickerOpen(next) {
    jobLinePickerOpen = !!next;
    const picker = $('idleHuntJobLinePicker');
    const shell = $('idleHuntRoot')?.querySelector('.idle-hunt-shell');
    picker?.classList.toggle('is-hidden', !jobLinePickerOpen);
    shell?.classList.toggle('idle-hunt-shell--jobline-pending', jobLinePickerOpen);
    if (jobLinePickerOpen) {
      renderJobLinePickerList();
      if (state.running) stop(true);
    }
  }

  function finishJobLinePick(lineKey) {
    if (typeof CharacterSkills === 'undefined' || !CharacterSkills.applyJobLine?.(lineKey)) return;
    setJobLinePickerOpen(false);
    if (typeof SessionPersistenceModule !== 'undefined') {
      SessionPersistenceModule.grantIdleStarterIfNeeded?.();
    }
    render();
  }

  function maybeShowJobLinePicker() {
    if (typeof CharacterSkills === 'undefined' || !CharacterSkills.needsJobLinePick?.()) {
      setJobLinePickerOpen(false);
      return false;
    }
    ensureJobLinePickerUi();
    setJobLinePickerOpen(true);
    return true;
  }

  function ensureJobLinePickerUi() {
    if ($('idleHuntJobLinePicker')) return;
    const shell = $('idleHuntRoot')?.querySelector('.idle-hunt-shell');
    if (!shell) return;
    shell.insertAdjacentHTML('beforeend', jobLinePickerMarkup());
    $('idleHuntJobLineList')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-job-line]');
      if (!btn) return;
      event.preventDefault();
      finishJobLinePick(btn.getAttribute('data-job-line'));
    });
  }

  function setResetConfirmOpen(next) {
    $('idleHuntResetConfirm')?.classList.toggle('is-hidden', !next);
    $('idleHuntReset')?.classList.toggle('is-hidden', !!next);
  }

  function resetIdleData() {
    try { stop(false); } catch (_) { state.running = false; }
    try { SkillCombat.reset?.(); } catch (_) { /* full reset buffs */ }
    stopChapterBossTimer();
    state.kills = 0;
    state.gold = 0;
    state.queue = [];
    state.dying = [];
    state.hp = null;
    state.maxHp = 0;
    syncPlayerHp({ fill: true });
    state.lastDrop = '';
    clearFieldDrops(false);
    state.nextLetter = 0;
    state.zoneId = firstZoneId();
    state.huntMode = 'mob';
    state.mapKills = {};
    state.bossCleared = {};
    state.replayKills = {};
    lastZoneRenderKey = '';
    state.afkHoldAdvance = false;
    state.afkMode = 'off';
    state.afk = false;
    spawnSeq = 0;
    mobBatchSeq = 0;
    try { fillQueue(); } catch (_) { /* ignore */ }
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
    save();
    syncInventoryMesoDisplay();
    try { CharacterProgression.resetDefault?.(); } catch (err) { console.warn('[IdleHunt] 重置等級失敗', err); }
    try { CharacterCombatPanel.resetDefault?.(); } catch (err) { console.warn('[IdleHunt] 重置戰鬥面板失敗', err); }
    try { CharacterSkills.resetDefault?.(); } catch (err) { console.warn('[IdleHunt] 重置技能失敗', err); }
    try { IdlePotionPanel.resetDefault?.(); } catch (err) { console.warn('[IdleHunt] 重置喝藥設定失敗', err); }
    try { SessionPersistenceModule.resetIdleWorld?.(); } catch (err) { console.warn('[IdleHunt] 重置背包失敗', err); }
    try { UiNpcShop.clearRepurchase?.(); } catch (err) { console.warn('[IdleHunt] 清空商店再次購買失敗', err); }
    setResetConfirmOpen(false);
    maybeShowJobLinePicker();
    if (!jobLinePickerOpen) {
      try { SessionPersistenceModule.grantIdleStarterIfNeeded?.(); } catch (err) {
        console.warn('[IdleHunt] 發放新手武器失敗', err);
      }
    }
    try { render(); } catch (err) { console.warn('[IdleHunt] 重置後畫面失敗', err); }
  }

  function init() {
    if (inited) return;
    load();
    loadGameSpeed();
    loadGmFlags();
    ensureDom();
    ensurePickerUi();
    ensureChromeUi();
    ensureShellAnchors();
    ensureResetUi();
    ensureJobLinePickerUi();
    ensureAfkButton();
    ensureDungeonButton();
    ensureNpcShopButton();
    fillQueue();
    inited = true;
    if (typeof IdleDungeon !== 'undefined') IdleDungeon.init?.();
    if (typeof IdleBoss !== 'undefined') IdleBoss.init?.();
    if (typeof UiNpcShop !== 'undefined') UiNpcShop.init?.();
    $('idleHuntNpcShop')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      if (typeof UiNpcShop !== 'undefined') UiNpcShop.toggle();
    });
    $('idleHuntBoss')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      if (typeof IdleBoss !== 'undefined') IdleBoss.toggle?.();
    });
    $('idleHuntAfk')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      toggleAfk();
    });
    $('idleHuntStart')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      const now = Date.now();
      if (now - lastStartPauseAt < START_PAUSE_CD_MS) return;
      lastStartPauseAt = now;
      if (state.running || isPushTransitionCancellable()) pausePushOrCombat();
      else start();
    });
    $('idleHuntFightBoss')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      startBossFight();
    });
    $('idleHuntPrevMap')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      const prev = prevZone();
      if (prev && typeof IdleZones !== 'undefined') selectZone(IdleZones.id(prev), true);
    });
    $('idleHuntNextMap')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      const nxt = nextZone();
      if (nxt && typeof IdleZones !== 'undefined') selectZone(IdleZones.id(nxt), true);
    });
    $('idleHuntPickMap')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      if (state.dungeon) return;
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(false);
      if (typeof JobChangePanel !== 'undefined') JobChangePanel.setOpen?.(false);
      setPickerOpen(!pickerOpen);
    });
    $('idleHuntDungeon')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (isDeathUiLocked()) return;
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.toggle?.();
    });
    $('idleHuntPickerClose')?.addEventListener('click', (event) => {
      event.preventDefault();
      setPickerOpen(false);
    });
    $('idleHuntPickerBack')?.addEventListener('click', (event) => {
      event.preventDefault();
      pickerView = 'bands';
      lastZoneRenderKey = '';
      renderPicker();
    });
    $('idleHuntPicker')?.addEventListener('click', (event) => {
      const bandBtn = event.target.closest('[data-band]');
      if (bandBtn && !bandBtn.disabled) {
        event.preventDefault();
        pickerBandKey = bandBtn.getAttribute('data-band') || '';
        pickerView = 'maps';
        lastZoneRenderKey = '';
        renderPicker();
        return;
      }
      const zoneBtn = event.target.closest('[data-zone]');
      if (!zoneBtn || zoneBtn.disabled) return;
      event.preventDefault();
      selectZone(zoneBtn.getAttribute('data-zone'), true);
    });
    $('idleHuntReset')?.addEventListener('click', (event) => {
      event.preventDefault();
      setResetConfirmOpen(true);
    });
    $('idleHuntResetYes')?.addEventListener('click', (event) => {
      event.preventDefault();
      resetIdleData();
    });
    $('idleHuntResetNo')?.addEventListener('click', (event) => {
      event.preventDefault();
      setResetConfirmOpen(false);
    });
    if (typeof PanelDrag !== 'undefined') {
      PanelDrag.enable($('idleHuntRoot'), {
        handle: '.idle-hunt-header',
        ignoreSelector: 'button',
        storageKey: 'ui.drag.idleHunt',
        title: '拖曳放置狩獵',
      });
    }
    render();
  }

  function beginDungeonSync(run) {
    state.dungeon = run;
    state.huntMode = (run.type === 'boss' || run.type === 'damage') ? 'boss' : 'mob';
    healToFull();
    state.atkAcc = 0;
    resetMobAtk();
    state.dying = [];
    state.queue = [];
    clearFieldDrops(true);
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    stage?.querySelectorAll('.idle-actor--mob').forEach((el) => el.remove());
    fillQueue();
    applyFieldArt();
    render();
    if (typeof IdleDungeon !== 'undefined') IdleDungeon.renderHud?.();
  }

  function endDungeonSync() {
    state.dungeon = null;
    state.huntMode = 'mob';
    stop(true);
    state.queue = [];
    state.dying = [];
    resetMobAtk();
    clearFieldDrops(true);
    const stage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
    stage?.querySelectorAll('.idle-actor--mob').forEach((el) => el.remove());
    // 副本內死亡退出後自動復活（通關／結算離開同樣補滿）
    revivePlayer();
    fillQueue();
    applyFieldArt();
    if (typeof IdleDungeon !== 'undefined') IdleDungeon.renderHud?.();
    render();
  }

  async function beginDungeon(run) {
    if (!run || !canFight()) return false;
    if (fieldTransition) return false;
    const seq = ++transitionSeq;
    fieldTransition = { kind: 'dungeonEnter', seq };
    if (state.running) stop(false);
    ensureFieldFx();
    const preloadP = (() => {
      const map = run?.map || {};
      const ids = new Set();
      if (map.mobIcon) ids.add(String(map.mobIcon));
      if (map.bossIcon) ids.add(String(map.bossIcon));
      (Array.isArray(map.mobs) ? map.mobs : []).forEach((row) => {
        const id = row?.icon || row?.mobIcon;
        if (id) ids.add(String(id));
      });
      const tasks = [...ids].map((id) => {
        const isBoss = map.bossIcon && String(id) === String(map.bossIcon);
        return isBoss ? preloadMobAllActions(id) : preloadMobIconActions(id);
      });
      if (map.fieldArt || map.mapUrl) tasks.push(preloadImageUrl(map.fieldArt || map.mapUrl));
      return Promise.all(tasks);
    })();
    await fadeField(1, MAP_FADE_MS);
    if (seq !== transitionSeq) return false;

    beginDungeonSync(run);
    await preloadP;
    if (seq !== transitionSeq) {
      if (state.dungeon === run) endDungeonSync();
      return false;
    }
    await ensureVisibleMobSpritesReady();
    if (seq !== transitionSeq) {
      if (state.dungeon === run) endDungeonSync();
      return false;
    }

    await fadeField(0, MAP_FADE_MS);
    if (seq !== transitionSeq) {
      if (state.dungeon === run) endDungeonSync();
      return false;
    }
    fieldTransition = null;
    if (Number(run.durationSec) > 0) {
      run.endsAt = Date.now() + Math.floor(Number(run.durationSec) || 0) * 1000;
    }
    start();
    return true;
  }

  async function endDungeon(opts = {}) {
    if (!state.dungeon) {
      endDungeonSync();
      return;
    }
    if (opts.skipFade) {
      if (fieldTransition?.kind === 'dungeonEnter' || fieldTransition?.kind === 'dungeonExit') {
        cancelFieldTransition();
      }
      endDungeonSync();
      return;
    }
    if (fieldTransition) {
      cancelFieldTransition();
    }
    const seq = ++transitionSeq;
    fieldTransition = { kind: 'dungeonExit', seq };
    if (state.running) stop(false);
    ensureFieldFx();
    await fadeField(1, MAP_FADE_MS);
    if (seq !== transitionSeq) return;

    endDungeonSync();

    await fadeField(0, MAP_FADE_MS);
    if (seq !== transitionSeq) return;
    fieldTransition = null;
    // 轉場結束後重繪，否則「開始」會一直維持 disabled
    render();
  }

  return {
    init,
    refreshDisplay() {
      if (inited && open) render();
    },
    syncBlockingPanelPause,
    enterIdleMode() {
      init();
      setOpen(true);
      if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.syncVisible?.();
      if (maybeShowJobLinePicker()) return;
      if (typeof SessionPersistenceModule !== 'undefined') {
        SessionPersistenceModule.grantIdleStarterIfNeeded?.();
      }
    },
    leaveIdleMode() {
      if (state.dungeon) endDungeon({ skipFade: true });
      setOpen(false);
      if (typeof IdlePotionPanel !== 'undefined') IdlePotionPanel.syncVisible?.();
      if (typeof UiIdleGmDrops !== 'undefined') UiIdleGmDrops.setOpen?.(false);
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.closeAll?.();
    },
    setOpen,
    isOpen: () => open,
    isRunning: () => state.running,
    syncHuntOverlayBars,
    suspendForExternal,
    resumeAfterExternal,
    isFieldTransitionActive,
    getZoneId: () => state.zoneId,
    getZoneId: () => state.zoneId,
    canFight,
    getDungeon: () => state.dungeon,
    getDungeon: () => state.dungeon,
    beginDungeon,
    endDungeon,
    startDungeonBossFight,
    addGold(n) {
      const v = Math.max(0, Math.floor(Number(n) || 0));
      if (!v) return;
      state.gold += v;
      save();
      if (open) render();
      syncInventoryMesoDisplay();
    },
    getGold() {
      return Math.max(0, Math.floor(Number(state.gold) || 0));
    },
    getZoneId() {
      return state.zoneId;
    },
    getState() {
      return { ...state, queue: state.queue.slice() };
    },
    getSavePayload,
    applySavePayload,
    getQueueLen: () => QUEUE_LEN,
    getVisibleQueueLen: () => VISIBLE_QUEUE_LEN,
    mobQueueIndex,
    mobFieldPoint,
    queueMobPoint,
    isMobVisibleInField,
    canAffordGold(n) {
      const v = Math.max(0, Math.floor(Number(n) || 0));
      return this.getGold() >= v;
    },
    spendGold(n) {
      const v = Math.max(0, Math.floor(Number(n) || 0));
      if (!v) return true;
      if (state.gold < v) return false;
      state.gold -= v;
      save();
      if (open) render();
      syncInventoryMesoDisplay();
      return true;
    },
    isBossCleared,
    respawnMobs,
    releaseCombatVisuals,
    getPlayerHp: () => ({ hp: Number(state.hp) || 0, maxHp: Number(state.maxHp) || 0 }),
    isPlayerDead,
    isDeathUiLocked,
    revivePlayer,
    healToFull,
    healPlayer,
    healPlayerFromMaxHpPct,
    spendHuntHp,
    applyPlayerDamage: hurtPlayer,
    getAttackDelaySec: attackDelaySec,
    getWzAttackSpeed: currentWzAttackSpeed,
    getGameSpeed,
    setGameSpeed,
    scaleDelayMs,
    scaleDtSec,
    isGodMode,
    setGodMode,
    isOneHitKill,
    setOneHitKill,
    resolveMobHitDamage,
    applyPlayerHitToMob,
    setPickerOpen,
    setAfkMode,
    getAfkMode: () => state.afkMode,
    getZoneId: () => state.zoneId,
  };
})();

if (typeof window !== 'undefined') {
  window.IdleHunt = IdleHunt;
  window.addEventListener('DOMContentLoaded', () => IdleHunt.init());
}
