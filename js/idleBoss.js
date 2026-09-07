/**
 * BOSS：側欄列表 → mob.png → Arena（1366×768）分體疊圖。
 * 數值／動畫來自 import:boss（IDLE_BOSS_WZ / IDLE_BOSS_MOB_DATA）。
 */
const IdleBoss = (() => {
  const BASE = 'images/Boss/BossList';
  const ZONE_DIR = 'images/bossIdlezone';
  const FIELD_W = 1366;
  const FIELD_H = 768;
  const DEFAULT_PLAYER = { x: 320, y: 620 };
  const DEFAULT_BOSS = { x: 980, y: 560 };
  const SPRITE_TICK_MS = 50;

  let inited = false;
  let open = false;
  let arenaOpen = false;
  let selectedId = '';
  let selectedDiffId = 'easy';
  let arenaBossId = '';
  let arenaDiffId = 'easy';
  /** 場地目前地圖 artId（龍王等會換圖；null 則用列表預設） */
  let arenaArtId = null;
  /** 當前圖的角色／怪錨點（龍王分圖覆寫） */
  let arenaPlayerPos = null;
  let arenaBossPos = null;
  let arenaPlayerFlipX = false;
  let arenaMapOffset = { x: 0, y: 0 };
  /** @type {Record<string, { role: string, hp: number, maxHp: number, dead: boolean, z: number }>|null} */
  let arenaParts = null;
  let spriteTimer = null;
  let combatTimer = null;
  let arenaRunning = false;
  /** 開始戰鬥後鎖側欄「挑戰」，直到倒數結束／失敗／關閉場地 */
  let challengeLocked = false;
  let playerAtkAcc = 0;
  /** @type {Record<string, Record<string, number>>} */
  let partAtkAcc = Object.create(null);
  const ARENA_UI_VER = '13';
  let exitConfirmPending = false;
  /** 死亡失敗彈窗（你已死亡／挑戰失敗） */
  let failModalOpen = false;
  /** 死亡演示播放中（結束後才開失敗彈窗） */
  let deathFxPlaying = false;
  const COMBAT_TICK_MS = 100;
  const MAP_FADE_MS = 500;
  /** BOSS 挑戰消耗的入場券（其他欄） */
  const BOSS_TICKET_ID = 'idle-ticket-boss';
  const BOSS_TICKET_NAME_FALLBACK = 'BOSS 副本入場券';
  /** @type {ReturnType<typeof IdleUiTimer.create>|null} */
  let challengeTimer = null;
  /** 通關後離場倒數（共用 IdleUiTimer） */
  let exitCountdownActive = false;

  function $(id) {
    return document.getElementById(id);
  }

  function bossTicketMeta() {
    const fromStore = (typeof IdleDungeonStore !== 'undefined' && IdleDungeonStore.ticketById)
      ? IdleDungeonStore.ticketById(BOSS_TICKET_ID)
      : null;
    const fromEtc = (typeof IdleEtcStore !== 'undefined' && IdleEtcStore.get)
      ? IdleEtcStore.get(BOSS_TICKET_ID)
      : null;
    return {
      id: BOSS_TICKET_ID,
      name: fromStore?.name || fromEtc?.name || BOSS_TICKET_NAME_FALLBACK,
    };
  }

  function ticketCount() {
    if (typeof InventoryModule === 'undefined' || typeof InventoryModule.countEtc !== 'function') {
      return 0;
    }
    return Math.max(0, Math.floor(Number(InventoryModule.countEtc(BOSS_TICKET_ID)) || 0));
  }

  function hasTicket() {
    return ticketCount() >= 1;
  }

  function takeTicket() {
    return !!(typeof InventoryModule !== 'undefined' && InventoryModule.takeEtc?.(BOSS_TICKET_ID, 1));
  }

  function list() {
    return typeof IDLE_BOSS_LIST !== 'undefined' ? IDLE_BOSS_LIST : [];
  }

  function wzRow(listId) {
    const root = typeof IDLE_BOSS_WZ !== 'undefined' ? IDLE_BOSS_WZ : null;
    return root?.[String(listId)] || null;
  }

  function normalizeBoss(row) {
    const id = String(row?.id ?? '');
    const wz = wzRow(id);
    const playerPos = { ...DEFAULT_PLAYER, ...(row?.playerPos || {}) };
    const bossPos = { ...DEFAULT_BOSS, ...(row?.bossPos || {}) };
    return {
      id,
      name: String(row?.name || wz?.name || '').trim() || `BOSS ${id}`,
      artId: String(row?.artId != null ? row.artId : id).trim() || id,
      playerPos: {
        x: Math.round(Number(playerPos.x) || DEFAULT_PLAYER.x),
        y: Math.round(Number(playerPos.y) || DEFAULT_PLAYER.y),
      },
      bossPos: {
        x: Math.round(Number(bossPos.x) || DEFAULT_BOSS.x),
        y: Math.round(Number(bossPos.y) || DEFAULT_BOSS.y),
      },
    };
  }

  function getBoss(id) {
    const raw = list().find((b) => String(b.id) === String(id)) || { id };
    return normalizeBoss(raw);
  }

  function btUrl(id, state) {
    return `${BASE}/${id}/btBoss/${state}/0.png`;
  }

  function mobUrl(id) {
    return `${BASE}/${id}/mob.png`;
  }

  function artFlatUrl(artId) {
    return `${ZONE_DIR}/${artId}.png`;
  }

  /** 疊圖：images/bossIdlezone/{artId}/back.png | obj.png */
  function artLayerUrl(artId, layer) {
    return `${ZONE_DIR}/${artId}/${layer}.png`;
  }

  function artUrl(artId) {
    return artFlatUrl(artId);
  }

  function bossIconUrl(id) {
    return `${BASE}/${id}/Icon/normal/0.png`;
  }

  function playerDisplayName() {
    if (typeof AppNavSidebar !== 'undefined' && AppNavSidebar.readName) {
      return AppNavSidebar.readName() || '玩家';
    }
    return '玩家';
  }

  function usesPhaseFight(listId) {
    return typeof IdleBossFight !== 'undefined' && IdleBossFight.hasScript?.(listId || arenaBossId);
  }

  function ensureBossDrops() {
    if (typeof ItemDropController === 'undefined') return;
    const field = $('idleBossField');
    if (!field) return;
    ItemDropController.init(field, {
      lootDelaySec: 2.5,
      onGrantMeso: (amount) => {
        const v = Math.max(0, Math.floor(Number(amount) || 0));
        if (v > 0 && typeof IdleHunt !== 'undefined') IdleHunt.addGold?.(v);
      },
    });
  }

  function clearBossDrops(grantPending) {
    if (typeof ItemDropController !== 'undefined') {
      ItemDropController.clear({ grantPending: !!grantPending });
    }
  }

  function fadeBossField(opacity, ms = MAP_FADE_MS) {
    const fade = $('idleBossFieldFade');
    const dur = Math.max(0, Math.floor(Number(ms) || MAP_FADE_MS));
    if (!fade) {
      return new Promise((resolve) => window.setTimeout(resolve, dur));
    }
    fade.hidden = false;
    fade.style.transition = `opacity ${dur}ms ease`;
    // 強制套用當前 opacity 再開新 transition
    void fade.offsetWidth;
    fade.style.opacity = String(Math.max(0, Math.min(1, Number(opacity) || 0)));
    return new Promise((resolve) => window.setTimeout(resolve, dur));
  }

  function resetBossFieldFade() {
    const fade = $('idleBossFieldFade');
    if (!fade) return;
    fade.style.transition = '';
    fade.style.opacity = '0';
  }

  function diffsFor(listId) {
    if (typeof IdleBossDiff !== 'undefined' && IdleBossDiff.listFor) {
      return IdleBossDiff.listFor(listId);
    }
    return [{ id: 'easy', hpMult: 1, dmgMult: 1, rewards: [] }];
  }

  function currentDiff(listId) {
    const id = listId || selectedId;
    if (typeof IdleBossDiff !== 'undefined' && IdleBossDiff.get) {
      return IdleBossDiff.get(id, selectedDiffId);
    }
    return diffsFor(id)[0] || { id: 'easy', hpMult: 1, dmgMult: 1, rewards: [] };
  }

  function ensureDiffForBoss(listId) {
    const rows = diffsFor(listId);
    if (!rows.some((d) => d.id === selectedDiffId)) {
      selectedDiffId = rows[0]?.id || 'easy';
    }
    return currentDiff(listId);
  }

  function getBossPlayerEl() {
    const field = $('idleBossField');
    return field?.querySelector('.idle-actor--player')
      || $('idleBossStagePlayer')?.querySelector('.idle-actor--player')
      || null;
  }

  function applyArenaPlayerLayout() {
    const el = getBossPlayerEl();
    if (!el) return;
    const p = arenaPlayerPos || getBoss(arenaBossId || selectedId).playerPos;
    if (p) {
      el.style.left = `${Math.round(Number(p.x) || 0)}px`;
      el.style.top = `${Math.round(Number(p.y) || 0)}px`;
    }
    el.classList.toggle('is-flip-x', !!arenaPlayerFlipX);
  }

  function applyArenaMapOffset() {
    const ox = Math.round(Number(arenaMapOffset?.x) || 0);
    const oy = Math.round(Number(arenaMapOffset?.y) || 0);
    const t = (ox || oy) ? `translate(${ox}px, ${oy}px)` : '';
    ['idleBossMapBack', 'idleBossMap', 'idleBossMapObj'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.style.transform = t;
    });
  }

  function setArenaStageLayout(layout = {}) {
    const boss = getBoss(arenaBossId || selectedId);
    if (layout.playerPos) {
      arenaPlayerPos = {
        x: Math.round(Number(layout.playerPos.x) || boss.playerPos.x),
        y: Math.round(Number(layout.playerPos.y) || boss.playerPos.y),
      };
    }
    if (layout.bossPos) {
      arenaBossPos = {
        x: Math.round(Number(layout.bossPos.x) || boss.bossPos.x),
        y: Math.round(Number(layout.bossPos.y) || boss.bossPos.y),
      };
    }
    if (layout.playerFlipX != null) {
      arenaPlayerFlipX = !!layout.playerFlipX;
    }
    if (layout.mapOffset || layout.mapOffset === null) {
      arenaMapOffset = {
        x: Math.round(Number(layout.mapOffset?.x) || 0),
        y: Math.round(Number(layout.mapOffset?.y) || 0),
      };
      applyArenaMapOffset();
    }
    applyArenaPlayerLayout();
  }

  function horntailStage0Layout(boss) {
    const script = (typeof IDLE_BOSS_PHASE !== 'undefined' ? IDLE_BOSS_PHASE : {})[String(boss?.id || '')];
    if (!(script && (script.kind === 'horntail' || Array.isArray(script.stages)))) return null;
    return script.stages?.[0] || null;
  }

  function fightHooks() {
    return {
      getStage: () => $('idleBossStage'),
      getBossPos: () => arenaBossPos || getBoss(arenaBossId).bossPos,
      syncHud: () => syncBossHpHud(getBoss(arenaBossId)),
      syncPlayerHp: () => syncPlayerHpHud(),
      ensureDrops: () => ensureBossDrops(),
      fadeField: (opacity, ms) => fadeBossField(opacity, ms),
      setMapArt: (artId) => {
        if (artId == null || artId === '') return;
        arenaArtId = String(artId);
        const boss = getBoss(arenaBossId);
        if (!boss) return;
        applyMapLayers({ ...boss, artId: arenaArtId });
      },
      setStageLayout: (layout) => setArenaStageLayout(layout || {}),
      onPhase: (p) => {
        const title = $('idleBossArenaTitle');
        const boss = getBoss(arenaBossId);
        if (title && boss) {
          const diffName = (typeof IdleBossDiff !== 'undefined' && IdleBossDiff.meta)
            ? IdleBossDiff.meta(arenaDiffId).name
            : '';
          const tag = diffName ? `${diffName}｜` : '';
          if (p === 'clear') title.textContent = `${boss.name}｜${tag}清場`;
          else title.textContent = `${boss.name}｜${tag}階段 ${p}`;
        }
      },
      onTitle: (msg) => {
        const title = $('idleBossArenaTitle');
        const boss = getBoss(arenaBossId);
        if (title) {
          const diffName = (typeof IdleBossDiff !== 'undefined' && IdleBossDiff.meta)
            ? IdleBossDiff.meta(arenaDiffId).name
            : '';
          const tag = diffName ? `${diffName}｜` : '';
          title.textContent = boss ? `${boss.name}｜${tag}${msg}` : String(msg || '');
        }
      },
      onExitStart: (sec) => {
        const hint = $('idleBossExitHint');
        if (hint) {
          hint.hidden = true;
          hint.textContent = '';
        }
        const t = ensureChallengeTimer();
        if (!t) return;
        exitCountdownActive = true;
        t.reset(Math.max(1, Math.floor(Number(sec) || 30)));
        t.setVisible(true);
        t.start();
        syncArenaCloseBtn();
        syncNavLock();
      },
      onExitStop: () => {
        if (!exitCountdownActive) return;
        exitCountdownActive = false;
        challengeTimer?.stop();
        syncArenaCloseBtn();
        syncNavLock();
      },
      onExitTick: () => {
        // 已改用 IdleUiTimer；保留空實作以免舊呼叫報錯
      },
      onFightEnd: (result) => {
        if (result === 'timeout') {
          exitCountdownActive = false;
          onCombatEnd('win');
          setArenaOpen(false);
          return;
        }
        if (result === 'lose') {
          playBossDeathThen(() => onCombatEnd('lose', { death: true }));
          return;
        }
        onCombatEnd(result);
      },
      syncOverlay: () => syncBossOverlayBars(),
    };
  }

  function initArenaParts(listId) {
    const wz = wzRow(listId);
    const diff = ensureDiffForBoss(listId);
    arenaDiffId = diff?.id || 'easy';
    const hpMult = (Number(wz?.hpMult) > 0 ? Number(wz.hpMult) : 1)
      * (Number(diff?.hpMult) > 0 ? Number(diff.hpMult) : 1);
    arenaParts = Object.create(null);
    (wz?.parts || []).forEach((p) => {
      const maxHp = Math.max(1, Math.floor((Number(p.maxHP) || 0) * hpMult));
      arenaParts[p.mobId] = {
        role: p.role,
        hp: maxHp,
        maxHp,
        dead: false,
        z: p.z || 0,
      };
    });
    if (usesPhaseFight(listId)) {
      IdleBossFight.reset(listId, fightHooks(), arenaDiffId);
    }
  }

  function ensureDom() {
    if ($('idleBossRoot')) return;
    const html = `<div id="idleBossRoot" class="idle-boss-root" aria-hidden="true">
      <div class="idle-boss-list-panel" role="dialog" aria-modal="false" aria-labelledby="idleBossTitle">
        <div class="idle-boss-list-head">
          <span id="idleBossTitle">選擇 BOSS</span>
          <button type="button" id="idleBossClose" class="idle-hunt-picker-nav">關閉</button>
        </div>
        <div id="idleBossListBody" class="idle-boss-list-body"></div>
      </div>
      <div id="idleBossMobPanel" class="idle-boss-mob-panel" aria-hidden="true">
        <img id="idleBossMobImg" class="idle-boss-mob-img" alt="" draggable="false">
        <div id="idleBossRewardPreview" class="idle-boss-reward-preview" aria-label="獎勵預覽"></div>
        <div id="idleBossReqLevel" class="idle-boss-req-level" aria-live="polite"></div>
        <div class="idle-boss-challenge-foot">
          <div id="idleBossDiffRow" class="idle-boss-diff-row" role="group" aria-label="難度"></div>
          <button type="button" id="idleBossEnter" class="idle-boss-enter">挑戰</button>
        </div>
      </div>
    </div>`;
    const nav = $('appNavSidebar');
    if (nav) nav.insertAdjacentHTML('afterend', html);
    else document.body.insertAdjacentHTML('beforeend', html);
  }

  function bindArenaEvents() {
    const arena = $('idleBossArena');
    if (!arena || arena.dataset.eventsBound === '1') return;
    arena.dataset.eventsBound = '1';
    arena.addEventListener('click', (e) => {
      if (e.target.closest('#idleBossArenaClose')) {
        e.preventDefault();
        requestCloseArena();
        return;
      }
      if (e.target.closest('#idleBossStart')) {
        e.preventDefault();
        if (arenaRunning || failModalOpen) return;
        setArenaRunning(true);
        return;
      }
      if (e.target.closest('#idleBossFailExit')) {
        e.preventDefault();
        failModalOpen = false;
        // 退出前補滿 HP，避免回到放置場時卡在死亡且無復活彈窗
        if (typeof IdleHunt !== 'undefined') IdleHunt.healToFull?.();
        setArenaOpen(false);
      }
    });
  }

  function ensureArenaDom() {
    const existing = $('idleBossArena');
    if (existing && existing.dataset.uiVer === ARENA_UI_VER) {
      bindArenaEvents();
      return;
    }
    existing?.remove();
    const html = `<div id="idleBossArena" class="idle-boss-arena" data-ui-ver="${ARENA_UI_VER}" aria-hidden="true">
      <div class="idle-boss-arena-shell" role="dialog" aria-modal="true" aria-labelledby="idleBossArenaTitle">
        <div class="idle-boss-arena-head">
          <span id="idleBossArenaTitle">BOSS</span>
          <button type="button" id="idleBossArenaClose" class="idle-hunt-picker-nav">關閉</button>
        </div>
        <div class="idle-boss-arena-body">
          <div id="idleBossField" class="idle-boss-field" style="width:${FIELD_W}px;height:${FIELD_H}px">
            <img id="idleBossMapBack" class="idle-boss-map idle-boss-map--back" alt="" draggable="false" width="${FIELD_W}" height="${FIELD_H}">
            <div id="idleBossStage" class="idle-boss-stage idle-boss-stage--mobs" aria-hidden="true"></div>
            <img id="idleBossMapObj" class="idle-boss-map idle-boss-map--obj" alt="" draggable="false" width="${FIELD_W}" height="${FIELD_H}" hidden>
            <div id="idleBossStagePlayer" class="idle-boss-stage idle-boss-stage--player" aria-hidden="true"></div>
            <div class="idle-hunt-skill-fx" aria-hidden="true"></div>
            <div class="idle-hunt-damage-fx" aria-hidden="true"></div>
            <div class="idle-boss-hud-top">
              <div class="idle-boss-hud-top-row">
                <img id="idleBossIcon" class="idle-boss-icon" alt="" draggable="false">
                <div class="idle-boss-hp" id="idleBossHpBar" aria-label="BOSS HP">
                  <div class="idle-boss-hp__fill" id="idleBossHpFill"></div>
                  <div class="idle-boss-hp__text">
                    <span id="idleBossHpName">BOSS</span>
                    <span id="idleBossHpText">0 / 0</span>
                  </div>
                </div>
              </div>
              <div id="idleBossTimerHost" class="idle-boss-timer-host"></div>
              <div class="idle-hunt-buffs" id="idleBossBuffs" aria-label="作用中的增益" hidden></div>
            </div>
            <div class="idle-boss-hud-bottom">
              <div class="idle-boss-player-hp" id="idleBossPlayerHpBar" aria-label="玩家 HP">
                <div class="idle-boss-player-hp__fill" id="idleBossPlayerHpFill"></div>
                <span class="idle-boss-player-hp__text" id="idleBossPlayerHpText">0 / 0</span>
              </div>
            </div>
            <div id="idleBossStartModal" class="idle-boss-start-modal" hidden>
              <div class="idle-boss-start-modal__card" role="dialog" aria-modal="true" aria-labelledby="idleBossStartTitle">
                <div id="idleBossStartTitle" class="idle-boss-start-modal__title">準備挑戰</div>
                <p class="idle-boss-start-modal__msg">確認後開始戰鬥</p>
                <button type="button" id="idleBossStart" class="idle-boss-start-btn">開始</button>
              </div>
            </div>
            <div id="idleBossFailModal" class="idle-boss-start-modal idle-boss-fail-modal" hidden>
              <div class="idle-boss-start-modal__card" role="dialog" aria-modal="true" aria-labelledby="idleBossFailTitle">
                <div id="idleBossFailTitle" class="idle-boss-start-modal__title">你已死亡</div>
                <p class="idle-boss-start-modal__msg">挑戰失敗</p>
                <button type="button" id="idleBossFailExit" class="idle-boss-start-btn">退出</button>
              </div>
            </div>
            <div id="idleBossExitHint" class="idle-boss-exit-hint" hidden></div>
            <div class="idle-hunt-cds" id="idleBossCds" aria-label="技能冷卻" hidden></div>
            <div id="idleBossFieldFade" class="idle-boss-field-fade" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    bindArenaEvents();
  }

  function syncChrome() {
    const root = $('idleBossRoot');
    if (!root) return;
    const listVisible = open && !arenaOpen;
    root.classList.toggle('is-open', listVisible);
    root.setAttribute('aria-hidden', listVisible ? 'false' : 'true');
    $('idleHuntBoss')?.classList.toggle('is-active', open || arenaOpen);

    const mob = $('idleBossMobPanel');
    const showMob = listVisible && !!selectedId;
    mob?.classList.toggle('is-open', showMob);
    mob?.setAttribute('aria-hidden', showMob ? 'false' : 'true');
  }

  function syncArenaChrome() {
    const arena = $('idleBossArena');
    if (!arena) return;
    arena.classList.toggle('is-open', arenaOpen);
    arena.setAttribute('aria-hidden', arenaOpen ? 'false' : 'true');
    syncArenaCloseBtn();
    syncNavLock();
  }

  /** 開戰後（含通關離場倒數）視為 BOSS 戰進行中 */
  function isBossFightSession() {
    return !!(arenaRunning || challengeLocked || exitCountdownActive);
  }

  function syncArenaCloseBtn() {
    const btn = $('idleBossArenaClose');
    if (!btn) return;
    btn.textContent = isBossFightSession() ? '退出' : '關閉';
  }

  function syncNavLock() {
    if (typeof AppNavSidebar !== 'undefined' && typeof AppNavSidebar.setButtonsLocked === 'function') {
      AppNavSidebar.setButtonsLocked(arenaOpen && isBossFightSession());
    }
  }

  async function requestCloseArena() {
    if (!arenaOpen) return;
    if (!isBossFightSession()) {
      setArenaOpen(false);
      return;
    }
    if (exitConfirmPending) return;
    exitConfirmPending = true;
    let ok = false;
    try {
      if (typeof showAppConfirm === 'function') {
        ok = await showAppConfirm({
          title: '退出挑戰',
          message: '戰鬥進行中，確定要退出嗎？未通關進度將不會保留。',
          confirmText: '退出',
          cancelText: '取消',
        });
      } else {
        ok = window.confirm('戰鬥進行中，確定要退出嗎？');
      }
    } finally {
      exitConfirmPending = false;
    }
    if (ok) setArenaOpen(false);
  }

  function bindBtStates(btn) {
    if (!btn || btn.dataset.btBound === '1') return;
    btn.dataset.btBound = '1';
    const img = btn.querySelector('.idle-boss-bt-img');
    const id = btn.getAttribute('data-boss-id');
    if (!img || !id) return;
    const apply = (state) => {
      img.src = btUrl(id, state);
    };
    btn.addEventListener('mouseenter', () => {
      if (btn.classList.contains('is-active')) return;
      apply('mouseOver');
    });
    btn.addEventListener('mouseleave', () => {
      apply(btn.classList.contains('is-active') ? 'checked' : 'normal');
    });
  }

  function renderList() {
    const wrap = $('idleBossListBody');
    if (!wrap) return;
    wrap.innerHTML = list().map((boss) => {
      const id = boss.id;
      const on = id === selectedId;
      const state = on ? 'checked' : 'normal';
      const row = normalizeBoss(boss);
      return `<button type="button" class="idle-boss-bt${on ? ' is-active' : ''}" data-boss-id="${id}" title="${row.name}">
        <img class="idle-boss-bt-img" src="${btUrl(id, state)}" alt="" draggable="false">
      </button>`;
    }).join('');
    wrap.querySelectorAll('.idle-boss-bt').forEach(bindBtStates);
  }

  function rewardPreviewIcon(row) {
    if (typeof ItemDropController !== 'undefined' && ItemDropController.resolveDropIcon) {
      return ItemDropController.resolveDropIcon(row) || '';
    }
    const id = String(row?.itemId || '').trim();
    if (row?.kind === 'equip' && id) return `images/equipRaw/${id}.png`;
    if (typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(id)) {
      const p = IdlePotionStore.get(id);
      return p ? IdlePotionStore.resolveIcon(p.icon) : '';
    }
    if (typeof IdleEtcStore !== 'undefined') return IdleEtcStore.get(id)?.icon || '';
    return '';
  }

  function rewardPreviewName(row) {
    if (typeof ItemDropController !== 'undefined' && ItemDropController.dropBaseName) {
      return ItemDropController.dropBaseName(row);
    }
    const id = String(row?.itemId || '').trim();
    if (row?.kind === 'equip' && typeof ITEM_DATABASE !== 'undefined') {
      return ITEM_DATABASE[id]?.name || id;
    }
    if (typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(id)) {
      return IdlePotionStore.get(id)?.name || id;
    }
    if (typeof IdleEtcStore !== 'undefined') return IdleEtcStore.get(id)?.name || row?.name || id;
    return row?.name || id || '掉落物';
  }

  function uniqueRewardPreviewRows(rows) {
    const seen = new Set();
    const out = [];
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (!row) return;
      const key = `${row.kind || ''}:${row.itemId || row.id || ''}`;
      if (!String(row.itemId || row.id || '').trim() || seen.has(key)) return;
      seen.add(key);
      out.push(row);
    });
    return out;
  }

  function hideRewardTips() {
    if (typeof EquipTooltipModule !== 'undefined') EquipTooltipModule.hide?.();
    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.hideEtcTooltip?.();
      InventoryModule.hideConsumeTooltip?.();
    }
  }

  function rewardTipKind(row) {
    const kind = String(row?.kind || '').trim();
    const id = String(row?.itemId || row?.id || '').trim();
    if (kind === 'equip') return 'equip';
    if (kind === 'etc') return 'etc';
    if (kind === 'consume' || kind === 'potion') {
      if (typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(id)) return 'potion';
      return 'consume';
    }
    if (typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[id]) return 'equip';
    if (typeof IdlePotionStore !== 'undefined' && IdlePotionStore.isPotionId?.(id)) return 'potion';
    if (typeof IdleEtcStore !== 'undefined' && IdleEtcStore.get?.(id)) return 'etc';
    return '';
  }

  function showRewardTip(anchorEl, kind, itemId) {
    const id = String(itemId || '').trim();
    if (!anchorEl || !kind || !id) return;
    if (typeof EquipTooltipModule !== 'undefined'
      && (EquipTooltipModule.pinned || EquipTooltipModule.dragging)) return;

    hideRewardTips();

    if (kind === 'equip') {
      if (typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[id]) return;
      EquipTooltipModule?.show?.(anchorEl, id, -1);
      return;
    }
    if (kind === 'etc' && typeof InventoryModule !== 'undefined') {
      const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(id) : null;
      InventoryModule.showEtcTooltip?.(
        anchorEl,
        catalog?.name || id,
        catalog?.desc || '',
        catalog?.icon || '',
      );
      return;
    }
    if ((kind === 'potion' || kind === 'consume') && typeof InventoryModule !== 'undefined') {
      const potion = typeof IdlePotionStore !== 'undefined' ? IdlePotionStore.get(id) : null;
      if (potion) {
        InventoryModule.showPotionTooltip?.(anchorEl, potion);
        return;
      }
      const catalog = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(id) : null;
      InventoryModule.showEtcTooltip?.(
        anchorEl,
        catalog?.name || id,
        catalog?.desc || '',
        catalog?.icon || '',
      );
    }
  }

  function bindRewardTooltips() {
    const box = $('idleBossRewardPreview');
    if (!box || box.dataset.bossTipReady) return;
    box.addEventListener('mouseover', (event) => {
      const tipEl = event.target.closest?.('[data-boss-tip][data-item-id]');
      if (!tipEl || !box.contains(tipEl)) return;
      if (box._bossTipEl === tipEl) return;
      box._bossTipEl = tipEl;
      showRewardTip(
        tipEl,
        tipEl.getAttribute('data-boss-tip') || '',
        tipEl.getAttribute('data-item-id') || '',
      );
    });
    box.addEventListener('mouseout', (event) => {
      const tipEl = event.target.closest?.('[data-boss-tip][data-item-id]');
      if (!tipEl || box._bossTipEl !== tipEl) return;
      const related = event.relatedTarget;
      if (related instanceof Node && tipEl.contains(related)) return;
      box._bossTipEl = null;
      hideRewardTips();
    });
    box.dataset.bossTipReady = '1';
  }

  function renderRewardPreview() {
    const box = $('idleBossRewardPreview');
    if (!box) return;
    hideRewardTips();
    box._bossTipEl = null;
    if (!selectedId) {
      box.innerHTML = '';
      renderReqLevel();
      return;
    }
    const diff = currentDiff(selectedId);
    const rows = uniqueRewardPreviewRows(diff?.rewards);
    if (!rows.length) {
      box.innerHTML = '<div class="idle-boss-reward-empty">無獎勵</div>';
    } else {
      box.innerHTML = rows.map((row) => {
        const icon = rewardPreviewIcon(row);
        const name = rewardPreviewName(row);
        const safeName = String(name || '').replace(/[<>]/g, '');
        const id = String(row?.itemId || row?.id || '').trim();
        const tipKind = rewardTipKind(row);
        const tipAttr = tipKind && id
          ? ` data-boss-tip="${tipKind}" data-item-id="${id}"`
          : '';
        return `<div class="idle-boss-reward-item"${tipAttr}>
          <img src="${icon}" alt="" draggable="false" onerror="this.style.visibility='hidden'">
          <span class="idle-boss-reward-name">${safeName}</span>
        </div>`;
      }).join('');
    }
    renderReqLevel();
  }

  function playerLevel() {
    if (typeof IdleZones !== 'undefined' && typeof IdleZones.playerLevel === 'function') {
      return Math.max(1, Math.floor(Number(IdleZones.playerLevel()) || 1));
    }
    if (typeof CharacterProgression !== 'undefined') {
      return Math.max(1, Math.floor(Number(CharacterProgression.getState?.()?.level) || 1));
    }
    return 1;
  }

  function reqLevelOf(listId) {
    return Math.max(0, Math.floor(Number(currentDiff(listId)?.reqLevel) || 0));
  }

  function meetsEntryLevel(listId) {
    const need = reqLevelOf(listId);
    if (need <= 0) return true;
    return playerLevel() >= need;
  }

  function renderReqLevel() {
    const el = $('idleBossReqLevel');
    if (!el) return;
    if (!selectedId) {
      el.textContent = '';
      el.hidden = true;
      el.classList.remove('is-unmet');
      return;
    }
    const need = reqLevelOf(selectedId);
    const levelOk = meetsEntryLevel(selectedId);
    if (need <= 0) {
      el.textContent = '';
      el.hidden = true;
      el.classList.remove('is-unmet');
      return;
    }
    el.hidden = false;
    el.classList.toggle('is-unmet', !levelOk);
    el.textContent = levelOk
      ? `入場等級: ${need}`
      : `入場等級: ${need}（目前 ${playerLevel()}）`;
  }

  function canEnterChallenge(listId) {
    return !!listId && meetsEntryLevel(listId) && hasTicket() && !challengeLocked;
  }

  function renderDiffRow() {
    const row = $('idleBossDiffRow');
    if (!row) return;
    if (!selectedId) {
      row.innerHTML = '';
      return;
    }
    ensureDiffForBoss(selectedId);
    const diffs = diffsFor(selectedId);
    row.innerHTML = diffs.map((d) => {
      const meta = typeof IdleBossDiff !== 'undefined' ? IdleBossDiff.meta(d.id) : { label: d.id, name: d.id };
      const on = d.id === selectedDiffId;
      return `<button type="button" class="idle-boss-diff-btn idle-boss-diff-btn--${d.id}${on ? ' is-selected' : ''}"
        data-boss-diff="${d.id}" title="${meta.name}" ${challengeLocked ? 'disabled' : ''}>${meta.label}</button>`;
    }).join('');
  }

  function renderMob() {
    const img = $('idleBossMobImg');
    if (!img) return;
    if (selectedId) {
      img.src = mobUrl(selectedId);
      img.alt = getBoss(selectedId).name;
      ensureDiffForBoss(selectedId);
    } else {
      img.removeAttribute('src');
      img.alt = '';
    }
    renderDiffRow();
    renderRewardPreview();
    syncChallengeBtn();
  }

  function formatHp(hp, maxHp) {
    const h = Math.max(0, Math.floor(Number(hp) || 0));
    const m = Math.max(0, Math.floor(Number(maxHp) || 0));
    return `${h.toLocaleString('zh-TW')} / ${m.toLocaleString('zh-TW')}`;
  }

  function syncPlayerHpHud() {
    const fill = $('idleBossPlayerHpFill');
    const text = $('idleBossPlayerHpText');
    if (!fill || !text) return;
    let hp = 0;
    let maxHp = 0;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.getPlayerHp) {
      const st = IdleHunt.getPlayerHp();
      hp = Number(st?.hp) || 0;
      maxHp = Number(st?.maxHp) || 0;
    }
    if (maxHp <= 0) {
      maxHp = 100;
      hp = 100;
    }
    const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    fill.style.width = `${pct}%`;
    text.textContent = formatHp(hp, maxHp);
  }

  function bodyPartState() {
    if (!arenaParts) return null;
    return Object.values(arenaParts).find((p) => p.role === 'body') || null;
  }

  function syncBossHpHud(boss) {
    const fill = $('idleBossHpFill');
    const text = $('idleBossHpText');
    const name = $('idleBossHpName');
    const icon = $('idleBossIcon');
    if (name) name.textContent = boss?.name || 'BOSS';
    if (icon && boss?.id) {
      icon.src = bossIconUrl(boss.id);
      icon.alt = boss.name || '';
      icon.onerror = () => { icon.style.visibility = 'hidden'; };
      icon.style.visibility = 'visible';
    }
    if (usesPhaseFight(boss?.id || arenaBossId) && typeof IdleBossFight !== 'undefined') {
      const body = IdleBossFight.getBodyHp?.();
      if (body) {
        const pct = Math.max(0, Math.min(100, (body.hp / Math.max(1, body.maxHp)) * 100));
        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = formatHp(body.hp, body.maxHp);
        return;
      }
    }
    const body = bodyPartState();
    if (body) {
      const pct = Math.max(0, Math.min(100, (body.hp / Math.max(1, body.maxHp)) * 100));
      if (fill) fill.style.width = `${pct}%`;
      if (text) text.textContent = formatHp(body.hp, body.maxHp);
    } else {
      if (fill) fill.style.width = '100%';
      if (text) text.textContent = '—';
    }
  }

  function timeLimitSecOf(listId, diffId) {
    const diff = typeof IdleBossDiff !== 'undefined'
      ? IdleBossDiff.get(listId, diffId || selectedDiffId)
      : null;
    const n = Math.floor(Number(diff?.timeLimitSec) || 0);
    return n > 0 ? n : 1800;
  }

  function ensureChallengeTimer() {
    if (typeof IdleUiTimer === 'undefined') return null;
    const host = $('idleBossTimerHost');
    if (!host) return null;
    if (!challengeTimer) {
      challengeTimer = IdleUiTimer.create({
        host,
        id: 'idleBossTimer',
      });
    } else {
      challengeTimer.mount(host);
    }
    return challengeTimer;
  }

  function resetChallengeTimer(listId) {
    const t = ensureChallengeTimer();
    if (!t) return;
    t.reset(timeLimitSecOf(listId || arenaBossId, arenaDiffId || selectedDiffId));
    t.stop();
    t.setVisible(!!arenaOpen);
  }

  function syncChallengeTimer() {
    const t = ensureChallengeTimer();
    if (!t) return;
    t.setVisible(!!arenaOpen);
    t.sync();
  }

  function tickChallengeTimer(dtSec) {
    if (!arenaRunning) return false;
    const t = ensureChallengeTimer();
    if (!t) return false;

    // 通關後離場：同一組計時器倒數 exitSec
    if (exitCountdownActive) {
      if (!t.isRunning() && !t.isExpired() && t.getLeftMs() > 0) t.start();
      return t.tick(dtSec);
    }

    // 清場打箱期間暫停挑戰時限
    if (usesPhaseFight(arenaBossId) && typeof IdleBossFight !== 'undefined') {
      const mode = IdleBossFight.getMode?.();
      if (mode === 'clear' || mode === 'done') {
        t.pause();
        return false;
      }
    }
    if (!t.isRunning() && !t.isExpired() && t.getLeftMs() > 0) t.start();
    return t.tick(dtSec);
  }

  function onExitTimeUp() {
    if (!exitCountdownActive) return;
    exitCountdownActive = false;
    challengeTimer?.stop();
    onCombatEnd('win');
    setArenaOpen(false);
  }

  function onChallengeTimeUp() {
    if (!arenaRunning || exitCountdownActive) return;
    const title = $('idleBossArenaTitle');
    const boss = getBoss(arenaBossId);
    if (title && boss) {
      const diffName = (typeof IdleBossDiff !== 'undefined' && IdleBossDiff.meta)
        ? IdleBossDiff.meta(arenaDiffId).name
        : '';
      const tag = diffName ? `${diffName}｜` : '';
      title.textContent = `${boss.name}｜${tag}時間到`;
    }
    onCombatEnd('lose', { keepTitle: true });
  }

  function syncFailModal() {
    const modal = $('idleBossFailModal');
    if (!modal) return;
    const show = arenaOpen && failModalOpen;
    modal.hidden = !show;
    modal.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function playBossDeathThen(done) {
    if (deathFxPlaying) return;
    deathFxPlaying = true;
    challengeTimer?.stop();
    const finish = (ok) => {
      deathFxPlaying = false;
      if (ok === false) return;
      try {
        done?.();
      } catch (_) { /* ignore */ }
    };
    if (typeof IdlePlayerDeathFx !== 'undefined' && IdlePlayerDeathFx.play) {
      IdlePlayerDeathFx.play('boss', {
        host: $('idleBossField'),
        persist: true,
        force: true,
      }).then(finish, () => finish(false));
      return;
    }
    finish(true);
  }

  function syncStartBtn() {
    const modal = $('idleBossStartModal');
    const btn = $('idleBossStart');
    // 開始後隱藏；通關倒數／死亡演示／死亡彈窗期間也不顯示
    const show = arenaOpen && !arenaRunning && !challengeLocked && !failModalOpen && !deathFxPlaying;
    if (modal) {
      modal.hidden = !show;
      modal.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
    if (btn) {
      btn.disabled = !show;
      btn.textContent = '開始';
      btn.classList.remove('is-running');
    }
    syncFailModal();
  }

  function syncChallengeBtn() {
    const btn = $('idleBossEnter');
    if (!btn) return;
    const levelBlocked = !!selectedId && !meetsEntryLevel(selectedId);
    const ticketBlocked = !!selectedId && !hasTicket();
    const blocked = !!challengeLocked || levelBlocked || ticketBlocked || !selectedId;
    btn.disabled = blocked;
    btn.classList.toggle('is-locked', blocked);
    btn.setAttribute('aria-disabled', blocked ? 'true' : 'false');
    const ticket = bossTicketMeta();
    if (challengeLocked) {
      btn.title = '副本進行中，請待結束後再挑戰';
    } else if (levelBlocked) {
      btn.title = `等級不足，需達 Lv.${reqLevelOf(selectedId)} 才能挑戰`;
    } else if (ticketBlocked) {
      btn.title = `需要【${ticket.name}】才能挑戰`;
    } else {
      btn.title = `消耗 1 張【${ticket.name}】進入挑戰`;
    }
  }

  function setChallengeLocked(next) {
    challengeLocked = !!next;
    syncChallengeBtn();
    renderDiffRow();
    syncArenaCloseBtn();
    syncNavLock();
  }

  function partZ(part) {
    if (part.role === 'body') return 10;
    if (part.role === 'head') return 20;
    if (part.role === 'hand') return 30 + (Number(part.handIndex) || 0);
    return Number(part.z) || 10;
  }

  function wzParts(listId) {
    return wzRow(listId)?.parts || [];
  }

  function pickAttackTarget() {
    if (!arenaParts) return null;
    const defs = wzParts(arenaBossId);
    const hands = defs
      .filter((d) => d.role === 'hand')
      .map((d) => ({ def: d, st: arenaParts[d.mobId] }))
      .filter((x) => x.st && !x.st.dead && x.st.hp > 0)
      .sort((a, b) => (a.def.handIndex || 0) - (b.def.handIndex || 0));
    if (hands.length) return hands[0];
    const body = defs.find((d) => d.role === 'body');
    if (body && arenaParts[body.mobId] && !arenaParts[body.mobId].dead && arenaParts[body.mobId].hp > 0) {
      return { def: body, st: arenaParts[body.mobId] };
    }
    const head = defs.find((d) => d.role === 'head');
    if (head && arenaParts[head.mobId] && !arenaParts[head.mobId].dead && arenaParts[head.mobId].hp > 0) {
      return { def: head, st: arenaParts[head.mobId] };
    }
    return null;
  }

  function isBossCleared() {
    const body = Object.values(arenaParts || {}).find((p) => p.role === 'body');
    return !!(body && (body.dead || body.hp <= 0));
  }

  function ensureBossDamageFx() {
    const field = $('idleBossField');
    if (field) {
      if (!field.querySelector('.idle-hunt-skill-fx')) {
        field.insertAdjacentHTML('beforeend', '<div class="idle-hunt-skill-fx" aria-hidden="true"></div>');
      }
      if (!field.querySelector('.idle-hunt-damage-fx')) {
        field.insertAdjacentHTML('beforeend', '<div class="idle-hunt-damage-fx" aria-hidden="true"></div>');
      }
    }
    if (typeof DamageNumber === 'undefined') return;
    const stage = $('idleBossStage') || $('idleBossStagePlayer');
    if (stage) {
      DamageNumber.clear?.();
      DamageNumber.init(stage);
    }
  }

  function showPartDamage(mobId, dmg, isCritical) {
    if (typeof DamageNumber === 'undefined') return;
    DamageNumber.spawnOnMob({ uid: mobId, isBoss: true }, dmg, !!isCritical);
  }

  function attackDelaySec() {
    if (typeof IdleHunt !== 'undefined' && IdleHunt.getAttackDelaySec) {
      return Math.max(0.03, Number(IdleHunt.getAttackDelaySec()) || 0.36);
    }
    return 0.36;
  }

  function scaleDt(sec) {
    if (typeof IdleHunt !== 'undefined' && IdleHunt.scaleDtSec) {
      return IdleHunt.scaleDtSec(sec);
    }
    return sec;
  }

  function rollPlayerHit() {
    if (typeof UiCharacterInfo !== 'undefined' && UiCharacterInfo.rollHuntHit) {
      return UiCharacterInfo.rollHuntHit(true);
    }
    return { dmg: 0, isCritical: false };
  }

  function flashPartAttack(mobId, action) {
    const el = $('idleBossStage')?.querySelector(`.idle-boss-part[data-mob-id="${mobId}"]`);
    const img = el?.querySelector('.idle-actor-sprite');
    if (!img || typeof IdleMobAnim === 'undefined') return false;
    const resolved = IdleMobAnim.resolveAction(mobId, action);
    if (!resolved || resolved === 'stand') {
      if (action === 'attack1') {
        IdleMobAnim.bind(img, mobId, 'stand', 0);
        return true;
      }
      return false;
    }
    IdleMobAnim.bind(img, mobId, resolved, 0);
    el.dataset.castAction = resolved;
    el.dataset.castUntil = String(Date.now() + (IdleMobAnim.actionDurationMs?.(mobId, resolved) || 600));
    return true;
  }

  function advancePartSprites() {
    const stage = $('idleBossStage');
    if (!stage || typeof IdleMobAnim === 'undefined') return;
    const dt = scaleDt(SPRITE_TICK_MS / 1000);
    if (IdleMobAnim.advanceActorsIn) {
      IdleMobAnim.advanceActorsIn(stage, dt);
      return;
    }
    stage.querySelectorAll('.idle-boss-part').forEach((el) => {
      IdleMobAnim.advanceActor?.(el, dt);
    });
  }

  function syncPartDeadClass() {
    const stage = $('idleBossStage');
    if (!stage || !arenaParts) return;
    stage.querySelectorAll('.idle-boss-part').forEach((el) => {
      const id = el.getAttribute('data-mob-id');
      const st = arenaParts[id];
      el.classList.toggle('is-dead', !!(st && (st.dead || st.hp <= 0)));
    });
  }

  function applyDamageToTarget(target, rawDmg, isCritical) {
    if (!target?.st || !(rawDmg > 0)) return;
    let dmg = Math.floor(rawDmg);
    if (target.st.role === 'body') {
      const mult = bodyIncomingMult(arenaBossId);
      dmg = Math.floor(dmg * mult);
    }
    if (!(dmg > 0)) {
      showPartDamage(target.def.mobId, 0, false);
      return;
    }
    target.st.hp = Math.max(0, target.st.hp - dmg);
    showPartDamage(target.def.mobId, dmg, isCritical);
    if (target.st.hp <= 0) {
      target.st.hp = 0;
      target.st.dead = true;
      const img = $('idleBossStage')?.querySelector(`.idle-boss-part[data-mob-id="${target.def.mobId}"] .idle-actor-sprite`);
      if (img && typeof IdleMobAnim !== 'undefined' && IdleMobAnim.hasAction?.(target.def.mobId, 'die1')) {
        IdleMobAnim.bind(img, target.def.mobId, 'die1', 0);
      }
    }
    syncPartDeadClass();
    syncBossHpHud(getBoss(arenaBossId));
  }

  function tickPlayerAttacks(dt) {
    playerAtkAcc += dt;
    const delay = attackDelaySec();
    let hits = 0;
    while (playerAtkAcc >= delay && hits < 12) {
      const target = pickAttackTarget();
      if (!target) break;
      playerAtkAcc -= delay;
      hits += 1;
      if (typeof Paperdoll !== 'undefined') {
        Paperdoll.playHuntSwing?.(delay * 1000);
      }
      const hit = rollPlayerHit();
      let dmg = Number(hit.dmg) || 0;
      if (typeof IdleHunt !== 'undefined' && IdleHunt.isOneHitKill?.()) {
        dmg = Math.max(dmg, target.st.hp);
      }
      if (!(dmg > 0)) break;
      applyDamageToTarget(target, dmg, !!hit.isCritical);
      if (isBossCleared()) break;
    }
  }

  function tickBossAttacks(dt) {
    if (!arenaParts) return;
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.()) return;
    const wz = wzRow(arenaBossId);
    const diff = typeof IdleBossDiff !== 'undefined'
      ? IdleBossDiff.get(arenaBossId, arenaDiffId)
      : null;
    const dmgMult = (Number(wz?.dmgMult) > 0 ? Number(wz.dmgMult) : 1)
      * (Number(diff?.dmgMult) > 0 ? Number(diff.dmgMult) : 1);
    const cdMult = Number(wz?.cdMult) > 0 ? Number(wz.cdMult) : 1;

    (wz?.parts || []).forEach((def) => {
      const st = arenaParts[def.mobId];
      if (!st || st.dead || st.hp <= 0) return;
      if (!partAtkAcc[def.mobId]) partAtkAcc[def.mobId] = Object.create(null);
      const accMap = partAtkAcc[def.mobId];
      const attacks = Array.isArray(def.attacks) ? def.attacks : [];
      for (let i = 0; i < attacks.length; i += 1) {
        const atk = attacks[i];
        const key = atk.actionKey || `attack${atk.action}`;
        const cdSec = Math.max(0.4, ((Number(atk.animMs) || 1200) / 1000) * cdMult);
        accMap[key] = (Number(accMap[key]) || 0) + dt;
        if (accMap[key] < cdSec) continue;
        const dmg = Math.max(0, Math.floor((Number(atk.dmg) || 0) * dmgMult));
        if (!(dmg > 0)) continue;
        accMap[key] = 0;
        flashPartAttack(def.mobId, key);
        if (typeof IdleHunt !== 'undefined' && IdleHunt.applyPlayerDamage) {
          IdleHunt.applyPlayerDamage(dmg, {
            mobLevel: Number(def.level) || 70,
            isBoss: true,
            mob: { uid: def.mobId, isBoss: true, name: def.role },
          });
        }
        syncPlayerHpHud();
        break;
      }
    });
  }

  function stopCombatLoop() {
    if (combatTimer != null) {
      window.clearInterval(combatTimer);
      combatTimer = null;
    }
  }

  function onCombatEnd(result, opts) {
    if (result === 'lose' && opts?.death) {
      failModalOpen = true;
    }
    setArenaRunning(false);
    const title = $('idleBossArenaTitle');
    const boss = getBoss(arenaBossId);
    if (title && boss && !opts?.keepTitle) {
      const diffName = (typeof IdleBossDiff !== 'undefined' && IdleBossDiff.meta)
        ? IdleBossDiff.meta(arenaDiffId).name
        : '';
      const tag = diffName ? `${diffName}｜` : '';
      if (result === 'win') title.textContent = `${boss.name}｜${tag}通關`;
      else if (result === 'lose') title.textContent = `${boss.name}｜${tag}失敗`;
    }
    // 通關（無離場倒數）立刻解鎖；死亡失敗維持鎖定直到退出／關場
    if (result === 'win' && !usesPhaseFight(arenaBossId)) {
      setChallengeLocked(false);
    } else if (result === 'lose' && !opts?.death) {
      setChallengeLocked(false);
    }
    syncStartBtn();
  }

  function tickCombat() {
    if (!arenaOpen || !arenaRunning || deathFxPlaying) return;
    const dt = scaleDt(COMBAT_TICK_MS / 1000);
    if (tickChallengeTimer(dt)) {
      if (exitCountdownActive) {
        onExitTimeUp();
        return;
      }
      onChallengeTimeUp();
      return;
    }
    if (usesPhaseFight(arenaBossId)) {
      IdleBossFight.tick(dt);
      syncBossHpHud(getBoss(arenaBossId));
      syncPlayerHpHud();
      syncBossOverlayBars();
      return;
    }
    tickPlayerAttacks(dt);
    if (isBossCleared()) {
      onCombatEnd('win');
      return;
    }
    tickBossAttacks(dt);
    if (typeof IdleHunt !== 'undefined' && IdleHunt.isPlayerDead?.()) {
      playBossDeathThen(() => onCombatEnd('lose', { death: true }));
      return;
    }
    if (typeof IdlePotionPanel !== 'undefined') {
      IdlePotionPanel.tryAutoDrink?.();
    }
    syncPlayerHpHud();
  }

  function startCombatLoop() {
    stopCombatLoop();
    ensureBossDamageFx();
    combatTimer = window.setInterval(tickCombat, COMBAT_TICK_MS);
  }

  function setArenaRunning(next) {
    const want = !!next;
    if (want === arenaRunning) {
      syncStartBtn();
      return;
    }
    if (want) {
      if (!arenaOpen || !arenaBossId) return;
      initArenaParts(arenaBossId);
      partAtkAcc = Object.create(null);
      playerAtkAcc = 0;
      clearBossDrops(false);
      ensureBossDrops();
      resetBossFieldFade();
      resetChallengeTimer(arenaBossId);
      exitCountdownActive = false;
      if (typeof IdleHunt !== 'undefined') {
        IdleHunt.healToFull?.();
        IdleHunt.setPickerOpen?.(false);
        // 挑戰時已 suspend；此處再呼叫為冪等保險
        IdleHunt.suspendForExternal?.();
      }
      const hint = $('idleBossExitHint');
      if (hint) {
        hint.hidden = true;
        hint.textContent = '';
      }
      if (usesPhaseFight(arenaBossId)) {
        IdleBossFight.start(arenaBossPos || getBoss(arenaBossId).bossPos, { playIntro: true });
      } else {
        syncPartDeadClass();
        renderAnchors(getBoss(arenaBossId));
      }
      syncBossHpHud(getBoss(arenaBossId));
      syncPlayerHpHud();
      arenaRunning = true;
      setChallengeLocked(true);
      ensureChallengeTimer()?.start();
      syncStartBtn();
      syncArenaCloseBtn();
      syncNavLock();
      startCombatLoop();
      return;
    }
    arenaRunning = false;
    challengeTimer?.stop();
    exitCountdownActive = false;
    stopCombatLoop();
    if (usesPhaseFight(arenaBossId)) IdleBossFight.stop();
    syncStartBtn();
    syncArenaCloseBtn();
    syncNavLock();
  }

  function stopArenaSprites() {
    if (spriteTimer != null) {
      window.clearInterval(spriteTimer);
      spriteTimer = null;
    }
  }

  function startArenaSprites() {
    stopArenaSprites();
    spriteTimer = window.setInterval(() => {
      if (!arenaOpen || deathFxPlaying) return;
      if (usesPhaseFight(arenaBossId) && arenaRunning) return;
      advancePartSprites();
    }, SPRITE_TICK_MS);
  }

  function bindBossParts() {
    const stage = $('idleBossStage');
    if (!stage || typeof IdleMobAnim === 'undefined') return;
    stage.querySelectorAll('.idle-boss-part').forEach((el) => {
      const mobId = el.getAttribute('data-mob-id');
      if (!mobId) return;
      if (IdleMobAnim.bindActorSprite) {
        IdleMobAnim.bindActorSprite(el, mobId, 'stand');
        const img = IdleMobAnim.actorBodyImg?.(el);
        if (img) img.dataset.frameAcc = '0';
        return;
      }
      const img = el.querySelector('.idle-actor-sprite');
      if (!img) return;
      IdleMobAnim.bind(img, mobId, 'stand', 0);
    });
  }

  function renderAnchors(boss) {
    const mobStage = $('idleBossStage');
    const playerStage = $('idleBossStagePlayer') || mobStage;
    if (!mobStage || !boss) return;
    const stage0 = horntailStage0Layout(boss);
    const p = (arenaPlayerPos
      || (stage0?.playerPos ? {
        x: Math.round(Number(stage0.playerPos.x) || boss.playerPos.x),
        y: Math.round(Number(stage0.playerPos.y) || boss.playerPos.y),
      } : null)
      || boss.playerPos);
    const flipX = arenaPlayerFlipX || !!(stage0 && stage0.playerFlipX);
    const startBossPos = arenaBossPos
      || (stage0?.bossPos ? {
        x: Math.round(Number(stage0.bossPos.x) || boss.bossPos.x),
        y: Math.round(Number(stage0.bossPos.y) || boss.bossPos.y),
      } : null)
      || boss.bossPos;
    if (!arenaPlayerPos && stage0?.playerPos) {
      arenaPlayerPos = { ...p };
      arenaBossPos = { ...startBossPos };
      arenaPlayerFlipX = !!stage0.playerFlipX;
    }
    if (playerStage !== mobStage) mobStage.innerHTML = '';
    playerStage.innerHTML = `
      <div class="idle-actor idle-actor--player${flipX ? ' is-flip-x' : ''}" data-sprite-slot="player" style="left:${p.x}px;top:${p.y}px;z-index:1">
        <img class="idle-actor-sprite" src="images/idle-mobs/player.png" alt="自身" draggable="false">
        <div class="idle-actor-name">${playerDisplayName()}</div>
      </div>`;
    if (typeof Paperdoll !== 'undefined') {
      Paperdoll.initHunt(playerStage);
    }
    if (usesPhaseFight(boss.id)) {
      IdleBossFight.reset(boss.id, fightHooks());
      IdleBossFight.start(startBossPos);
      IdleBossFight.stop();
      ensureBossDamageFx();
      return;
    }
    const b = boss.bossPos;
    const wz = wzRow(boss.id);
    const parts = (wz?.parts || []).slice().sort((a, c) => partZ(a) - partZ(c));
    const partsHtml = parts.map((part) => {
      const st = arenaParts?.[part.mobId];
      const dead = !!st?.dead;
      const z = partZ(part);
      return `<div class="idle-actor idle-actor--mob idle-boss-part${dead ? ' is-dead' : ''}"
        data-part-role="${part.role}" data-mob-id="${part.mobId}" data-uid="${part.mobId}"
        style="left:${b.x}px;top:${b.y}px;z-index:${z}">
        <div class="idle-actor-sprite-stage">
          <img class="idle-actor-sprite" alt="" draggable="false">
        </div>
      </div>`;
    }).join('');
    mobStage.insertAdjacentHTML('beforeend', partsHtml);
    bindBossParts();
    ensureBossDamageFx();
  }

  function applyMapLayers(boss) {
    const back = $('idleBossMapBack') || $('idleBossMap');
    const obj = $('idleBossMapObj');
    if (!back || !boss) return;
    const artId = (arenaArtId != null && arenaArtId !== '') ? arenaArtId : boss.artId;
    back.alt = boss.name || '';
    back.style.background = '#161A23';
    const flat = artFlatUrl(artId);
    const backLayer = artLayerUrl(artId, 'back');
    let usedFlat = false;
    back.onerror = () => {
      if (!usedFlat) {
        usedFlat = true;
        back.src = flat;
        return;
      }
      back.removeAttribute('src');
    };
    back.src = backLayer;

    if (obj) {
      obj.hidden = false;
      obj.onerror = () => {
        obj.hidden = true;
        obj.removeAttribute('src');
      };
      obj.src = artLayerUrl(artId, 'obj');
    }
  }

  function formatBuffRemain(ms) {
    const sec = Math.max(0, Math.ceil(Number(ms) / 1000));
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const r = sec % 60;
      return `${m}:${String(r).padStart(2, '0')}`;
    }
    return String(sec);
  }

  function syncBossOverlayBars() {
    const buffHost = $('idleBossBuffs');
    if (buffHost) {
      const list = (typeof SkillModifiers !== 'undefined' && SkillModifiers.listActiveBuffs)
        ? SkillModifiers.listActiveBuffs()
        : [];
      const live = new Set(list.map((b) => String(b.id)));
      buffHost.querySelectorAll('.idle-hunt-buff[data-buff-id]').forEach((el) => {
        if (!live.has(el.getAttribute('data-buff-id'))) el.remove();
      });
      list.forEach((buff) => {
        const id = String(buff.id);
        let el = [...buffHost.querySelectorAll('.idle-hunt-buff')].find((n) => n.dataset.buffId === id) || null;
        if (!el) {
          el = document.createElement('div');
          el.className = 'idle-hunt-buff';
          el.dataset.buffId = id;
          el.title = buff.name || id;
          const icon = buff.icon
            || (typeof SkillCatalog !== 'undefined' ? SkillCatalog.getSkill?.(id)?.icon : '')
            || '';
          el.innerHTML = `
            <img class="idle-hunt-buff__icon" alt="" draggable="false"${icon ? ` src="${icon}"` : ''}>
            <span class="idle-hunt-buff__cd">0</span>
          `;
          buffHost.appendChild(el);
        }
        const cd = el.querySelector('.idle-hunt-buff__cd');
        if (cd) cd.textContent = formatBuffRemain(buff.remainMs);
      });
      buffHost.hidden = list.length === 0;
    }

    const cdHost = $('idleBossCds');
    if (cdHost) {
      const list = (typeof SkillCombat !== 'undefined' && SkillCombat.listActiveCooldowns)
        ? SkillCombat.listActiveCooldowns()
        : [];
      const live = new Set(list.map((b) => String(b.id)));
      cdHost.querySelectorAll('.idle-hunt-cd[data-skill-id]').forEach((el) => {
        if (!live.has(el.getAttribute('data-skill-id'))) el.remove();
      });
      list.forEach((entry) => {
        const id = String(entry.id);
        let el = [...cdHost.querySelectorAll('.idle-hunt-cd')].find((n) => n.dataset.skillId === id) || null;
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
          cdHost.appendChild(el);
        }
        const timer = el.querySelector('.idle-hunt-cd__timer');
        if (timer) timer.textContent = formatBuffRemain(entry.remainMs);
      });
      cdHost.hidden = list.length === 0;
    }
  }

  function renderArena() {
    ensureArenaDom();
    syncArenaChrome();
    if (!arenaOpen) return;
    const boss = getBoss(arenaBossId || selectedId);
    const title = $('idleBossArenaTitle');
    if (title) {
      const diffName = (typeof IdleBossDiff !== 'undefined' && IdleBossDiff.meta)
        ? IdleBossDiff.meta(arenaDiffId).name
        : '';
      title.textContent = diffName ? `${boss.name}｜${diffName}` : boss.name;
    }
    applyMapLayers(boss);
    syncBossOverlayBars();
    syncBossHpHud(boss);
    syncPlayerHpHud();
    syncChallengeTimer();
    syncStartBtn();
    renderAnchors(boss);
    startArenaSprites();
  }

  function mountHudHosts(active) {
    if (typeof IdlePotionPanel !== 'undefined' && IdlePotionPanel.setFieldHost) {
      IdlePotionPanel.setFieldHost(active ? 'idleBossField' : 'idleHuntField');
    } else if (typeof IdlePotionPanel !== 'undefined') {
      IdlePotionPanel.syncVisible?.();
    }
    // DamageNumber 進出 Arena 必須重綁 stage，否則怪傷會繼續畫在隱藏的 Boss 場
    if (typeof DamageNumber !== 'undefined') {
      DamageNumber.clear?.();
      if (active) {
        const bossStage = $('idleBossStage') || $('idleBossStagePlayer');
        if (bossStage) DamageNumber.init(bossStage);
      } else {
        const huntStage = $('idleHuntField')?.querySelector('.idle-hunt-stage');
        if (huntStage) DamageNumber.init(huntStage);
      }
    }
  }

  function render() {
    ensureDom();
    syncChrome();
    if (open && !arenaOpen) {
      renderList();
      renderMob();
    }
    if (arenaOpen) renderArena();
  }

  function selectBoss(id) {
    selectedId = String(id || '');
    ensureDiffForBoss(selectedId);
    render();
  }

  function setArenaOpen(next, bossId) {
    ensureArenaDom();
    init();
    const want = !!next;
    if (want) {
      if (challengeLocked) return;
      arenaBossId = String(bossId || selectedId || '');
      if (!arenaBossId) return;
      if (!meetsEntryLevel(arenaBossId)) {
        syncChallengeBtn();
        renderReqLevel();
        return;
      }
      if (!hasTicket()) {
        syncChallengeBtn();
        renderReqLevel();
        if (typeof addLog === 'function') {
          addLog(`需要【${bossTicketMeta().name}】才能挑戰。`, 'log-fail');
        }
        return;
      }
      if (!takeTicket()) {
        syncChallengeBtn();
        renderReqLevel();
        if (typeof addLog === 'function') {
          addLog('扣除入場券失敗。', 'log-fail');
        }
        return;
      }
      const bossName = getBoss(arenaBossId)?.name || 'BOSS';
      if (typeof addLog === 'function') {
        addLog(`已消耗【${bossTicketMeta().name}】，進入【${bossName}】挑戰。`, 'log-info');
      }
      arenaOpen = true;
      open = true;
      arenaRunning = false;
      failModalOpen = false;
      deathFxPlaying = false;
      arenaArtId = getBoss(arenaBossId).artId || null;
      {
        const b0 = getBoss(arenaBossId);
        const s0 = horntailStage0Layout(b0);
        arenaPlayerPos = s0?.playerPos
          ? {
            x: Math.round(Number(s0.playerPos.x) || b0.playerPos.x),
            y: Math.round(Number(s0.playerPos.y) || b0.playerPos.y),
          }
          : { ...b0.playerPos };
        arenaBossPos = s0?.bossPos
          ? {
            x: Math.round(Number(s0.bossPos.x) || b0.bossPos.x),
            y: Math.round(Number(s0.bossPos.y) || b0.bossPos.y),
          }
          : { ...b0.bossPos };
        arenaPlayerFlipX = !!s0?.playerFlipX;
        arenaMapOffset = {
          x: Math.round(Number(s0?.mapOffset?.x) || 0),
          y: Math.round(Number(s0?.mapOffset?.y) || 0),
        };
        applyArenaMapOffset();
      }
      if (typeof IdlePlayerDeathFx !== 'undefined') IdlePlayerDeathFx.cancel?.();
      clearBossDrops(false);
      initArenaParts(arenaBossId);
      resetBossFieldFade();
      resetChallengeTimer(arenaBossId);
      if (typeof IdleHunt !== 'undefined') {
        IdleHunt.setPickerOpen?.(false);
        // 按下「挑戰」當下就暫停章節狩獵
        IdleHunt.suspendForExternal?.();
      }
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.setOpen?.(false);
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(false);
      mountHudHosts(true);
      render();
      syncStartBtn();
      return;
    }
    arenaOpen = false;
    arenaBossId = '';
    arenaArtId = null;
    arenaPlayerPos = null;
    arenaBossPos = null;
    arenaPlayerFlipX = false;
    arenaMapOffset = { x: 0, y: 0 };
    applyArenaMapOffset();
    arenaParts = null;
    arenaRunning = false;
    failModalOpen = false;
    deathFxPlaying = false;
    if (typeof IdlePlayerDeathFx !== 'undefined') IdlePlayerDeathFx.cancel?.();
    challengeTimer?.stop();
    challengeTimer?.setVisible(false);
    exitCountdownActive = false;
    stopCombatLoop();
    if (typeof IdleBossFight !== 'undefined') IdleBossFight.stop();
    clearBossDrops(true);
    stopArenaSprites();
    mountHudHosts(false);
    // 手動關閉場地／倒數結束也解鎖，並還原放置視窗
    setChallengeLocked(false);
    syncFailModal();
    syncArenaChrome();
    syncChrome();
    syncNavLock();
    // 關閉 Arena 時若仍死亡，先復活再還原放置（否則會鎖面板且無彈窗）
    if (typeof IdleHunt !== 'undefined') {
      if (IdleHunt.isPlayerDead?.()) IdleHunt.healToFull?.();
      IdleHunt.resumeAfterExternal?.();
    }
    if (open) render();
  }

  function setOpen(next) {
    open = !!next;
    ensureDom();
    init();
    if (open) {
      if (arenaOpen) setArenaOpen(false);
      if (typeof IdleHunt !== 'undefined') IdleHunt.setPickerOpen?.(false);
      if (typeof IdleDungeon !== 'undefined') IdleDungeon.setOpen?.(false);
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(false);
      render();
    } else {
      hideRewardTips();
      if (arenaOpen) setArenaOpen(false);
      syncChrome();
    }
  }

  function init() {
    if (inited) return;
    ensureDom();
    ensureArenaDom();
    inited = true;
    bindRewardTooltips();
    const root = $('idleBossRoot');
    root?.addEventListener('click', (e) => {
      if (e.target.closest('#idleBossClose')) {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.target.closest('#idleBossEnter')) {
        e.preventDefault();
        if (challengeLocked) return;
        if (!selectedId || !canEnterChallenge(selectedId)) {
          syncChallengeBtn();
          renderReqLevel();
          return;
        }
        setArenaOpen(true, selectedId);
        return;
      }
      const diffBtn = e.target.closest('[data-boss-diff]');
      if (diffBtn) {
        e.preventDefault();
        if (challengeLocked) return;
        selectedDiffId = diffBtn.getAttribute('data-boss-diff') || 'easy';
        ensureDiffForBoss(selectedId);
        renderDiffRow();
        renderRewardPreview();
        syncChallengeBtn();
        return;
      }
      const bt = e.target.closest('[data-boss-id]');
      if (bt) {
        e.preventDefault();
        selectBoss(bt.getAttribute('data-boss-id') || '');
      }
    });
    bindArenaEvents();
  }

  return {
    init,
    setOpen,
    setArenaOpen,
    toggle() {
      init();
      if (arenaOpen) {
        if (isBossFightSession()) {
          requestCloseArena();
          return;
        }
        setArenaOpen(false);
        setOpen(false);
        return;
      }
      setOpen(!open);
    },
    isOpen: () => open && !arenaOpen,
    isArenaOpen: () => arenaOpen,
    isRunning: () => arenaRunning,
    setRunning: setArenaRunning,
    closeAll() {
      exitConfirmPending = false;
      setArenaOpen(false);
      setOpen(false);
    },
    getBoss,
    getArenaParts: () => (arenaParts ? { ...arenaParts } : null),
    getPhase: () => (typeof IdleBossFight !== 'undefined' ? IdleBossFight.getPhase?.() : 0),
    FIELD: { w: FIELD_W, h: FIELD_H },
  };
})();

if (typeof window !== 'undefined') {
  window.IdleBoss = IdleBoss;
}
