/**
 * 副本：側欄展開（分類 → 關卡 → 入場），戰鬥仍走放置狩獵場。
 * BOSS 類暫不從這裡進入。
 */
const IdleDungeon = (() => {
  const WRITER_URL = 'http://127.0.0.1:3847';
  let inited = false;
  let gmBound = false;
  let open = false;
  let entering = false;
  let lastHudKey = '';
  /** @type {ReturnType<typeof IdleUiTimer.create>|null} */
  let dungeonTimer = null;
  let pickerView = 'cats';
  let pickerCat = 'gold';
  let selectedId = '';
  let selectedDiffId = '';
  let resultText = '';
  let gmRewardKind = 'etc';
  let artItems = [];
  let writerOk = false;
  let writeTimer = null;

  function $(id) {
    return document.getElementById(id);
  }

  function typeLabel(type) {
    if (type === 'timed') return '計時副本';
    if (type === 'normal') return '地下城';
    if (type === 'damage') return '傷害副本';
    if (type === 'boss') return 'BOSS';
    return type || '';
  }

  function formatN(n) {
    return Math.floor(Number(n) || 0).toLocaleString('zh-TW');
  }

  function ticketCount(ticketId) {
    return typeof InventoryModule !== 'undefined' && InventoryModule.countEtc
      ? InventoryModule.countEtc(ticketId)
      : 0;
  }

  function takeTicket(ticketId) {
    return !!(typeof InventoryModule !== 'undefined' && InventoryModule.takeEtc?.(ticketId, 1));
  }

  function run() {
    return typeof IdleHunt !== 'undefined' ? IdleHunt.getDungeon?.() : null;
  }

  function ensureDungeonTimerHost() {
    const field = $('idleHuntField');
    if (!field || field.querySelector('#idleDungeonTimerHost')) return;
    field.insertAdjacentHTML('beforeend', `
      <div class="idle-dungeon-timer-host" id="idleDungeonTimerHost" aria-hidden="true"></div>
    `);
  }

  function ensureDungeonTimer() {
    if (typeof IdleUiTimer === 'undefined') return null;
    ensureDungeonTimerHost();
    const host = $('idleDungeonTimerHost');
    if (!host) return null;
    if (!dungeonTimer) {
      dungeonTimer = IdleUiTimer.create({
        host,
        id: 'idleDungeonTimer',
        label: '副本剩餘時間',
        onExpire: () => {
          const cur = run();
          if (cur?.status === 'running' && (cur.durationSec || 0) > 0) settle('timeout');
        },
      });
    } else {
      dungeonTimer.mount(host);
    }
    return dungeonTimer;
  }

  function startDungeonTimer(cur) {
    const sec = Math.floor(Number(cur?.durationSec) || 0);
    const t = ensureDungeonTimer();
    if (!t) return;
    if (sec <= 0) {
      stopDungeonTimer();
      return;
    }
    t.reset(sec);
    t.start();
    t.setVisible(true);
  }

  function stopDungeonTimer() {
    if (!dungeonTimer) return;
    dungeonTimer.stop();
    dungeonTimer.setVisible(false);
  }

  function tickDungeonTimer(dt) {
    const cur = run();
    if (!cur || cur.status !== 'running' || !(cur.durationSec > 0)) return false;
    const t = ensureDungeonTimer();
    if (!t) return false;
    if (!t.isRunning() && !t.isExpired() && t.getLeftMs() > 0) t.start();
    return t.tick(dt);
  }

  function bestDamageTier(dungeon, damage) {
    const reached = reachedDamageTiers(dungeon, damage);
    return reached.length ? reached[reached.length - 1] : null;
  }

  /** 已達成的門檻（依 minDamage 由低到高；獎勵採累積） */
  function reachedDamageTiers(dungeon, damage) {
    const dmg = Math.max(0, Number(damage) || 0);
    return (dungeon?.damageTiers || [])
      .filter((tier) => dmg >= (tier.minDamage || 0))
      .slice()
      .sort((a, b) => (a.minDamage || 0) - (b.minDamage || 0));
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function rewardDisplayName(row) {
    return String(row?.name || row?.itemId || row?.catalogId || row?.scrollId || '道具').trim() || '道具';
  }

  function rewardAmount(row) {
    return Math.max(1, Math.floor(Number(row?.amount) || 1));
  }

  function rewardPreviewIcon(row) {
    if (typeof ItemDropController !== 'undefined' && ItemDropController.resolveDropIcon) {
      return ItemDropController.resolveDropIcon(row) || '';
    }
    const id = String(row?.itemId || '').trim();
    if (row?.kind === 'equip' && id) return `images/equipRaw/${id}.png`;
    if (typeof IdleEtcStore !== 'undefined') return IdleEtcStore.get(id)?.icon || '';
    return '';
  }

  function rewardPreviewName(row) {
    if (typeof ItemDropController !== 'undefined' && ItemDropController.dropBaseName) {
      return ItemDropController.dropBaseName(row);
    }
    return rewardDisplayName(row);
  }

  function rewardUniqueKey(row) {
    if (!row) return '';
    const id = String(row.itemId || row.catalogId || row.cubeId || row.scrollId || row.id || '').trim();
    if (!id) return '';
    return `${row.kind || ''}:${id}`;
  }

  /** 同 ID 物品只保留一筆（預覽用，不顯示機率／數量） */
  function uniqueRewardPreviewRows(rows) {
    const seen = new Set();
    const out = [];
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const key = rewardUniqueKey(row);
      if (!key || seen.has(key)) return;
      seen.add(key);
      out.push(row);
    });
    return out;
  }

  function formatRewardIconRows(rows) {
    const list = uniqueRewardPreviewRows(rows);
    if (!list.length) return '';
    return list.map((r) => {
      const icon = rewardPreviewIcon(r);
      const name = rewardPreviewName(r);
      return `<div class="idle-dungeon-reward-item">
        <img src="${icon}" alt="" draggable="false" onerror="this.style.visibility='hidden'">
        <span class="idle-dungeon-reward-name">${escapeHtml(name)}</span>
      </div>`;
    }).join('');
  }

  function mesoPreviewIcon(amount) {
    if (typeof ItemDropController !== 'undefined' && ItemDropController.resolveDropIcon) {
      return ItemDropController.resolveDropIcon({ kind: 'meso', amount: amount || 1 }) || '';
    }
    return 'images/meso/09000001__iconRaw__0.png';
  }

  function formatMesoPreviewLine(label, amount) {
    const gold = Math.max(0, Math.floor(Number(amount) || 0));
    const icon = mesoPreviewIcon(Math.max(1, gold));
    return `<div class="idle-dungeon-reward-item">
      <img src="${icon}" alt="" draggable="false" onerror="this.style.visibility='hidden'">
      <span class="idle-dungeon-reward-name">${escapeHtml(label)} ${formatN(gold)} 楓幣</span>
    </div>`;
  }

  function formatDamageTierPreview(tiers) {
    const list = Array.isArray(tiers) ? tiers : [];
    if (!list.length) return '<div>尚未設定傷害門檻</div>';
    return list.map((t) => {
      const items = (t.rewards || []).map((r) => {
        const icon = rewardPreviewIcon(r);
        return `<div class="idle-dungeon-reward-item">
          <img src="${icon}" alt="" draggable="false" onerror="this.style.visibility='hidden'">
          <span class="idle-dungeon-reward-name">${escapeHtml(rewardDisplayName(r))} x ${formatN(rewardAmount(r))}</span>
        </div>`;
      }).join('');
      return `<div class="idle-dungeon-tier-block">
        <div class="idle-dungeon-tier-title">${escapeHtml(t.name || '門檻')}: ${formatN(t.gold || 0)}楓幣</div>
        <div class="idle-dungeon-reward-list">${items}</div>
      </div>`;
    }).join('');
  }

  function formatItemTotalsLines(totals) {
    if (!totals) return [];
    const entries = totals instanceof Map
      ? [...totals.entries()]
      : Object.entries(totals);
    return entries
      .filter(([, amount]) => Math.floor(Number(amount) || 0) > 0)
      .map(([name, amount]) => `${name} X ${formatN(amount)}`);
  }

  function formatTimedSettleText(cur, gold, reason) {
    const lines = [];
    if (reason === 'death') lines.push('角色倒下。');
    lines.push(`結算。擊殺 ${cur.kills}。`);
    const gained = [];
    if (gold > 0) gained.push(`楓幣 X ${formatN(gold)}`);
    gained.push(...formatItemTotalsLines(cur.lootTotals));
    if (gained.length) {
      lines.push('獲得:');
      lines.push(...gained);
    }
    return lines.join('\n');
  }

  /** 累計副本內實際入手的道具（小怪掉落拾取＋通關發放） */
  function recordLoot(name, amount) {
    const cur = run();
    if (!cur) return;
    if (!cur.lootTotals || typeof cur.lootTotals !== 'object') cur.lootTotals = Object.create(null);
    const key = String(name || '').trim() || '道具';
    const amt = Math.max(1, Math.floor(Number(amount) || 1));
    cur.lootTotals[key] = (cur.lootTotals[key] || 0) + amt;
  }

  function collectPendingFieldDrops() {
    if (typeof ItemDropController !== 'undefined' && ItemDropController.clear) {
      ItemDropController.clear({ grantPending: true });
    }
  }

  function formatDamageSettleText(damage, tierCount, gold, itemTotals, reason) {
    const lines = [
      `傷害${formatN(damage)}  獎勵階段${tierCount}`,
    ];
    if (reason === 'death') lines.unshift('角色倒下。');
    const gained = [];
    if (gold > 0) gained.push(`楓幣 X ${formatN(gold)}`);
    gained.push(...formatItemTotalsLines(itemTotals));
    if (gained.length) {
      lines.push('獲得:');
      lines.push(...gained);
    }
    return lines.join('\n');
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

  /** 傷害副本用關卡 reqLevel；其餘用目前難度 reqLevel。0＝不限制 */
  function entryReqLevel(dungeon, diff) {
    if (!dungeon) return 0;
    if (dungeon.type === 'damage') {
      return Math.max(0, Math.floor(Number(dungeon.reqLevel) || 0));
    }
    return Math.max(0, Math.floor(Number(diff?.reqLevel) || 0));
  }

  function meetsEntryLevel(dungeon, diff) {
    const need = entryReqLevel(dungeon, diff);
    if (need <= 0) return true;
    return playerLevel() >= need;
  }

  function formatReqLevelLine(dungeon, diff) {
    const need = entryReqLevel(dungeon, diff);
    if (need <= 0) return '';
    const ok = meetsEntryLevel(dungeon, diff);
    return ok
      ? `入場等級: ${need}`
      : `入場等級: ${need}（目前 ${playerLevel()}）`;
  }

  function syncEnterStartBtn(dungeon, diff) {
    const startBtn = $('idleDungeonStart');
    if (!startBtn) return;
    const busy = !!run();
    const levelBlocked = !busy && dungeon && !meetsEntryLevel(dungeon, diff);
    startBtn.disabled = busy || levelBlocked;
    startBtn.classList.toggle('is-locked', levelBlocked);
    startBtn.title = levelBlocked
      ? `等級不足，需達 Lv.${entryReqLevel(dungeon, diff)} 才能進入`
      : '';
  }

  function updateEnterReqLevel(dungeon, diff) {
    const el = $('idleDungeonReqLevel');
    if (!el) return;
    const text = formatReqLevelLine(dungeon, diff);
    el.hidden = !text;
    el.classList.toggle('is-unmet', !!text && !meetsEntryLevel(dungeon, diff));
    el.textContent = text;
    syncEnterStartBtn(dungeon, diff);
  }

  function categories() {
    return typeof IdleDungeonStore !== 'undefined' ? (IdleDungeonStore.CATEGORIES || []) : [];
  }

  function catLabel(id) {
    return typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.categoryLabel(id) : id;
  }

  function stagesInCat(catId) {
    return typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.byCategory(catId) : [];
  }

  function gmList() {
    return typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.editableList() : [];
  }

  function ensureDom() {
    if ($('idleDungeonRoot')) return;
    const html = `<div id="idleDungeonRoot" class="idle-hunt-picker idle-dungeon-picker" role="dialog" aria-modal="false" aria-labelledby="idleDungeonTitle" aria-hidden="true">
      <div class="idle-hunt-picker-head">
        <button type="button" id="idleDungeonBack" class="idle-hunt-picker-nav" hidden>← 分類</button>
        <span id="idleDungeonTitle">選擇副本</span>
        <button type="button" id="idleDungeonClose" class="idle-hunt-picker-nav">關閉</button>
      </div>
      <div id="idleDungeonBody" class="idle-hunt-picker-body"></div>
    </div>`;
    const nav = $('appNavSidebar');
    if (nav) nav.insertAdjacentHTML('afterend', html);
    else document.body.insertAdjacentHTML('beforeend', html);
  }

  function syncPickerChrome() {
    const picker = $('idleDungeonRoot');
    if (!picker) return;
    picker.classList.toggle('is-open', open);
    picker.setAttribute('aria-hidden', open ? 'false' : 'true');
    $('idleHuntDungeon')?.classList.toggle('is-active', open);
  }

  function renderPicker() {
    ensureDom();
    syncPickerChrome();
    const wrap = $('idleDungeonBody');
    const title = $('idleDungeonTitle');
    const backBtn = $('idleDungeonBack');
    if (!wrap) return;
    if (!open) return;
    if (backBtn) {
      backBtn.hidden = pickerView === 'cats';
      backBtn.textContent = pickerView === 'enter' ? '← 關卡' : '← 分類';
    }
    if (pickerView === 'cats') {
      if (title) title.textContent = '選擇副本';
      wrap.innerHTML = categories().map((cat) => {
        const n = stagesInCat(cat.id).length;
        const on = pickerCat === cat.id;
        return `<button type="button" class="idle-hunt-band${on ? ' is-active' : ''}" data-dungeon-cat="${cat.id}">
          <span class="idle-hunt-band-name">${cat.name}</span>
          <span class="idle-hunt-band-meta">${n} 個關卡</span>
        </button>`;
      }).join('');
      return;
    }
    if (pickerView === 'stages') {
      if (title) title.textContent = catLabel(pickerCat);
      const rows = stagesInCat(pickerCat);
      const cur = run();
      wrap.innerHTML = rows.map((d) => {
        const n = ticketCount(d.ticketId);
        const on = d.id === selectedId;
        const busy = cur && cur.id === d.id;
        return `<button type="button" class="idle-hunt-zone${on ? ' is-active' : ''}${busy ? ' is-busy' : ''}" data-dungeon="${d.id}">
          <span class="idle-hunt-zone-region">${typeLabel(d.type)}</span>
          <span class="idle-hunt-zone-name">${d.name}</span>
          <span class="idle-hunt-zone-lv">${d.ticketName} × ${n}</span>
        </button>`;
      }).join('') || '<div class="idle-dungeon-empty">此分類尚無關卡</div>';
      return;
    }
    const d = typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.get(selectedId) : null;
    if (title) title.textContent = d?.name || '關卡';
    if (!d) {
      wrap.innerHTML = '<div class="idle-dungeon-empty">請先選擇關卡</div>';
      return;
    }
    const n = ticketCount(d.ticketId);
    const isDamage = d.type === 'damage';
    const isNormal = d.type === 'normal';
    const tierLines = formatDamageTierPreview(d.damageTiers);
    const leadHint = isDamage
      ? '在時間內造成的傷害越高，獎勵越高，王的傷害也會越來越高。'
      : (isNormal
        ? '達成擊殺數後召喚頭目，擊敗頭目才可獲得通關獎勵。'
        : '限定時間內擊殺的怪物越多，獲得的楓幣越多。');
    wrap.innerHTML = isDamage
      ? `<p class="idle-dungeon-lead">${typeLabel(d.type)} · ${d.ticketName} × ${n}<br>${leadHint}</p>
        <p id="idleDungeonReqLevel" class="idle-dungeon-req-level" hidden></p>
        <div class="idle-dungeon-tier-preview">${tierLines}</div>
        <div class="idle-dungeon-enter">
          <button type="button" id="idleDungeonStart" class="idle-hunt-btn idle-hunt-btn--boss">進入</button>
          <button type="button" id="idleDungeonLeave" class="idle-hunt-btn idle-hunt-btn--ghost">離開／結算</button>
        </div>
        <p id="idleDungeonResult" class="idle-dungeon-result">${resultText ? escapeHtml(resultText).replace(/\n/g, '<br>') : ''}</p>`
      : `<p class="idle-dungeon-lead">${typeLabel(d.type)} · ${d.ticketName} × ${n}<br>${leadHint}</p>
        <div class="idle-dungeon-enter">
          <label>難度
            <select id="idleDungeonDiff"></select>
          </label>
          <button type="button" id="idleDungeonStart" class="idle-hunt-btn idle-hunt-btn--boss">進入</button>
          <button type="button" id="idleDungeonLeave" class="idle-hunt-btn idle-hunt-btn--ghost">離開／結算</button>
        </div>
        <p id="idleDungeonReqLevel" class="idle-dungeon-req-level" hidden></p>
        <div id="idleDungeonRewardPreview" class="idle-dungeon-tier-preview"></div>
        <p id="idleDungeonResult" class="idle-dungeon-result">${resultText ? escapeHtml(resultText).replace(/\n/g, '<br>') : ''}</p>`;
    if (!isDamage) {
      renderDiffs();
      updateEnterRewardPreview();
      $('idleDungeonDiff')?.addEventListener('change', () => {
        selectedDiffId = $('idleDungeonDiff').value;
        updateEnterRewardPreview();
        const diff = IdleDungeonStore.getDiff(d, selectedDiffId);
        updateEnterReqLevel(d, diff);
      });
    }
    const leave = $('idleDungeonLeave');
    if (leave) leave.disabled = !run();
    const enterDiff = isDamage
      ? null
      : (typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.getDiff(d, selectedDiffId) : null);
    updateEnterReqLevel(d, enterDiff);
  }

  function renderDiffs() {
    const sel = $('idleDungeonDiff');
    if (!sel || typeof IdleDungeonStore === 'undefined') return;
    const d = IdleDungeonStore.get(selectedId);
    const diffs = d?.diffs || [];
    if (!diffs.some((x) => x.id === selectedDiffId)) selectedDiffId = diffs[0]?.id || '';
    sel.innerHTML = diffs.map((x) => {
      const mult = `血量 ×${x.hpMult}／傷害 ×${x.dmgMult || 1}`;
      let extra = '';
      if (d.type === 'timed') extra = `（${mult}）`;
      else if (d.type === 'normal') extra = `（擊殺 ${x.killNeed} · ${mult}）`;
      else if (d.type === 'boss') extra = `（${mult}）`;
      else extra = `（${mult}）`;
      const lv = Number(x.reqLevel) > 0 ? ` · 需 Lv.${x.reqLevel}` : '';
      const n = (x.rewards || []).length;
      const rewardMark = n ? ` · 專屬獎勵 ${n}` : '';
      return `<option value="${x.id}"${x.id === selectedDiffId ? ' selected' : ''}>${x.name}${extra}${lv}${rewardMark}</option>`;
    }).join('');
  }

  function updateEnterRewardPreview() {
    const box = $('idleDungeonRewardPreview');
    if (!box || typeof IdleDungeonStore === 'undefined') return;
    const d = IdleDungeonStore.get(selectedId);
    if (!d) {
      box.innerHTML = '';
      return;
    }
    const diff = IdleDungeonStore.getDiff(d, $('idleDungeonDiff')?.value || selectedDiffId);
    const blocks = [];
    if (d.type === 'timed' && (diff?.settleGoldPerKill || 0) > 0) {
      blocks.push(`<div class="idle-dungeon-tier-block">
        <div class="idle-dungeon-tier-title">楓幣</div>
        <div class="idle-dungeon-reward-list">${formatMesoPreviewLine('每殺', diff.settleGoldPerKill)}</div>
      </div>`);
    } else if (d.type === 'normal' && (diff?.clearGold || 0) > 0) {
      blocks.push(`<div class="idle-dungeon-tier-block">
        <div class="idle-dungeon-tier-title">楓幣</div>
        <div class="idle-dungeon-reward-list">${formatMesoPreviewLine('', diff.clearGold)}</div>
      </div>`);
    }
    const mobHtml = formatRewardIconRows(d.mobDrops);
    if (mobHtml) {
      blocks.push(`<div class="idle-dungeon-tier-block">
        <div class="idle-dungeon-tier-title">小怪掉落</div>
        <div class="idle-dungeon-reward-list">${mobHtml}</div>
      </div>`);
    }
    const sharedHtml = formatRewardIconRows(d.rewards);
    if (sharedHtml) {
      blocks.push(`<div class="idle-dungeon-tier-block">
        <div class="idle-dungeon-tier-title">共用獎勵</div>
        <div class="idle-dungeon-reward-list">${sharedHtml}</div>
      </div>`);
    }
    const diffHtml = formatRewardIconRows(diff?.rewards);
    if (diffHtml) {
      blocks.push(`<div class="idle-dungeon-tier-block">
        <div class="idle-dungeon-tier-title">${escapeHtml(diff?.name || '難度')} 專屬</div>
        <div class="idle-dungeon-reward-list">${diffHtml}</div>
      </div>`);
    }
    box.innerHTML = blocks.join('');
  }

  function renderHud(force) {
    const cur = run();
    const field = $('idleHuntField');
    let bar = $('idleDungeonHud');
    if (!field) return;
    if (!cur) {
      bar?.remove();
      lastHudKey = '';
      stopDungeonTimer();
      return;
    }
    if (!bar) {
      field.insertAdjacentHTML('afterbegin', '<div id="idleDungeonHud" class="idle-dungeon-hud"></div>');
      bar = $('idleDungeonHud');
    }
    const hasTimer = (cur.durationSec || 0) > 0;
    bar.classList.toggle('has-timer', hasTimer);
    const d = typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.get(cur.id) : null;
    let text = '';
    if (cur.type === 'damage') {
      const ramp = typeof IdleDungeonStore !== 'undefined' && IdleDungeonStore.damageRampMult
        ? IdleDungeonStore.damageRampMult(cur, cur.damage)
        : 1;
      const reached = reachedDamageTiers(d, cur.damage).length;
      text = [
        cur.name || d?.name || '副本',
        `累積傷害 ${formatN(cur.damage)}`,
        `已達到 ${reached} 階傷害獎勵`,
        `boss傷害 x${ramp.toFixed(2)}`,
      ].join(' | ');
    } else {
      const parts = [`${cur.name || d?.name || '副本'}${cur.diffName ? ` · ${cur.diffName}` : ''}`];
      if (cur.type === 'timed') {
        parts.push(`擊殺 ${cur.kills}`);
        parts.push(`結算 ${formatN(cur.kills * (cur.settleGoldPerKill || 0))} 楓幣`);
      } else if (cur.type === 'normal') {
        const hunt = typeof IdleHunt !== 'undefined' ? IdleHunt.getState?.() : null;
        if (cur.bossSummoned || hunt?.huntMode === 'boss') {
          parts.push('BOSS 戰中 · 擊敗頭目才可通關');
        } else {
          parts.push(`擊殺 ${cur.kills}/${cur.killNeed || 0}`);
          if ((cur.kills || 0) >= (cur.killNeed || 0)) parts.push('即將召喚 BOSS');
        }
      } else {
        parts.push('擊敗 BOSS 才有獎勵');
      }
      text = parts.join(' ｜ ');
    }
    if (!force && text === lastHudKey) return;
    lastHudKey = text;
    bar.textContent = text;
  }

  function render() {
    renderPicker();
    renderHud();
  }

  async function enter() {
    if (entering) return;
    if (typeof IdleDungeonStore === 'undefined' || typeof IdleHunt === 'undefined') return;
    const d = IdleDungeonStore.get(selectedId);
    if (!d) {
      resultText = '請先選擇副本。';
      render();
      return;
    }
    const isDamage = d.type === 'damage';
    const diff = isDamage
      ? { id: 'trial', name: '試煉', hpMult: 1, dmgMult: 1, rewards: [] }
      : IdleDungeonStore.getDiff(d, $('idleDungeonDiff')?.value || selectedDiffId);
    if (!isDamage && !diff) {
      resultText = '請先選擇副本與難度。';
      render();
      return;
    }
    if (run()) {
      resultText = '已在副本中。';
      render();
      return;
    }
    if (IdleHunt.isFieldTransitionActive?.()) {
      resultText = '過圖中，請稍候再進場。';
      render();
      return;
    }
    if (ticketCount(d.ticketId) < 1) {
      resultText = `需要【${d.ticketName}】，請先在野外地圖刷。`;
      render();
      return;
    }
    if (!meetsEntryLevel(d, diff)) {
      const need = entryReqLevel(d, diff);
      resultText = `等級不足，需達 Lv.${need}（目前 ${playerLevel()}）才能進入。`;
      render();
      return;
    }
    if (!IdleHunt.canFight?.()) {
      resultText = '屬性攻擊力需大於 0 才能入場。';
      render();
      return;
    }
    entering = true;
    selectedDiffId = diff.id;
    const durationSec = (d.type === 'timed' || d.type === 'damage') ? (d.durationSec || 0) : 0;
    setOpen(false);
    try {
      const ok = await IdleHunt.beginDungeon({
        id: d.id,
        type: d.type,
        name: d.name,
        diffId: diff.id,
        diffName: isDamage ? '' : diff.name,
        durationSec,
        endsAt: durationSec > 0 ? Date.now() + durationSec * 1000 : 0,
        killNeed: diff.killNeed || 0,
        settleGoldPerKill: diff.settleGoldPerKill || 0,
        clearGold: diff.clearGold || 0,
        hpMult: isDamage ? 1 : diff.hpMult,
        dmgMult: isDamage ? 1 : (diff.dmgMult || 1),
        dropAmountMult: isDamage ? 1 : (Number(diff.dropAmountMult) > 0 ? Number(diff.dropAmountMult) : 1),
        dropRateMult: isDamage ? 1 : (Number(diff.dropRateMult) > 0 ? Number(diff.dropRateMult) : 1),
        dmgRampRef: d.dmgRampRef,
        dmgRampPower: d.dmgRampPower,
        mobLevel: d.mobLevel,
        useFieldDrops: !!d.useFieldDrops,
        useFieldGold: !!d.useFieldGold,
        mobDrops: d.mobDrops || [],
        map: d.map || {},
        rewards: d.rewards || [],
        diffRewards: diff.rewards || [],
        kills: 0,
        damage: 0,
        bossSummoned: false,
        lootTotals: Object.create(null),
        status: 'running',
      });
      if (ok === false) {
        if (run()) await IdleHunt.endDungeon?.({ skipFade: true });
        resultText = '進場失敗，請再試一次。';
        setOpen(true, { keepView: true });
        render();
        return;
      }
      if (!takeTicket(d.ticketId)) {
        await IdleHunt.endDungeon?.({ skipFade: true });
        resultText = '扣除入場券失敗。';
        setOpen(true, { keepView: true });
        render();
        return;
      }
      resultText = isDamage
        ? `已消耗【${d.ticketName}】，開始【${d.name}】傷害試煉。`
        : `已消耗【${d.ticketName}】，開始【${d.name}／${diff.name}】。`;
      startDungeonTimer(run());
      renderHud(true);
      if (d.type === 'normal' && (diff.killNeed || 0) <= 0) {
        IdleHunt.startDungeonBossFight?.();
      }
    } finally {
      entering = false;
    }
  }

  async function finishSettleUi(cur, d, line) {
    stopDungeonTimer();
    await IdleHunt.endDungeon?.();
    resultText = line;
    selectedId = cur.id;
    if (d?.category && d.category !== 'boss') pickerCat = d.category;
    pickerView = 'enter';
    setOpen(true, { keepView: true });
  }

  async function settle(reason) {
    const cur = run();
    if (!cur || cur.status !== 'running') return;
    // 計時副本：先收起場上未撿掉落，才能完整記入結算清單
    if (cur.type === 'timed') collectPendingFieldDrops();
    cur.status = 'done';
    const d = typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.get(cur.id) : null;
    let gold = 0;
    let line = '';
    if (cur.type === 'timed') {
      gold = Math.floor(cur.kills * (cur.settleGoldPerKill || 0));
      IdleHunt.addGold?.(gold);
      grantItemRewards(d, cur, reason);
      line = formatTimedSettleText(cur, gold, reason);
      await finishSettleUi(cur, d, line);
      return;
    }
    if (cur.type === 'normal') {
      const ok = reason === 'win';
      gold = ok ? (cur.clearGold || 0) : 0;
      line = ok
        ? `通關。擊敗頭目，獲得 ${formatN(gold)} 楓幣。`
        : `未擊敗頭目（擊殺 ${cur.kills}／${cur.killNeed}），沒有通關獎勵。`;
    } else if (cur.type === 'damage') {
      const tiers = reachedDamageTiers(d, cur.damage);
      gold = tiers.reduce((sum, t) => sum + (t.gold || 0), 0);
      IdleHunt.addGold?.(gold);
      const itemTotals = grantItemRewards(d, cur, reason);
      line = formatDamageSettleText(cur.damage, tiers.length, gold, itemTotals, reason);
      await finishSettleUi(cur, d, line);
      return;
    } else {
      const ok = reason === 'win';
      gold = ok ? (cur.clearGold || 0) : 0;
      line = ok ? `擊敗 BOSS，獲得 ${formatN(gold)} 楓幣。` : 'BOSS 未擊敗，沒有獎勵。';
    }
    IdleHunt.addGold?.(gold);
    const itemTotals = grantItemRewards(d, cur, reason);
    const gained = formatItemTotalsLines(itemTotals);
    if (gold > 0) {
      line += `\n獲得:\n楓幣 X ${formatN(gold)}`;
      if (gained.length) line += `\n${gained.join('\n')}`;
    } else if (gained.length) {
      line += `\n獲得:\n${gained.join('\n')}`;
    }
    await finishSettleUi(cur, d, line);
  }

  function onHuntKill(dead) {
    const cur = run();
    if (!cur || cur.status !== 'running') return;
    if (cur.type === 'damage') return;
    cur.kills = (cur.kills || 0) + 1;
    if (cur.type === 'normal') {
      if (dead?.isBoss) {
        settle('win');
        return;
      }
      if (!cur.bossSummoned && cur.kills >= (cur.killNeed || 0)) {
        IdleHunt.startDungeonBossFight?.();
      }
      renderHud();
      return;
    }
    if (cur.type === 'boss' && dead?.isBoss) {
      settle('win');
      return;
    }
    renderHud();
  }

  function onHuntDamage(amount) {
    const cur = run();
    if (!cur || cur.status !== 'running') return;
    cur.damage = (cur.damage || 0) + Math.max(0, Math.floor(Number(amount) || 0));
    if (cur.type === 'damage') renderHud();
  }

  function onHuntTick(dt) {
    const cur = run();
    if (!cur || cur.status !== 'running') return;
    if (cur.durationSec > 0) {
      if (tickDungeonTimer(dt)) return;
      // IdleUiTimer 不可用時退回 endsAt
      if (!dungeonTimer && Date.now() >= cur.endsAt) {
        settle('timeout');
        return;
      }
    }
    renderHud();
  }

  function onHuntDeath() {
    const cur = run();
    if (!cur || cur.status !== 'running') return;
    settle(cur.type === 'timed' || cur.type === 'damage' ? 'death' : 'fail');
  }

  function atkGridHtml(who) {
    const title = who === 'Mob' ? '小怪攻擊' : 'BOSS 攻擊';
    const slots = [
      ['Atk1', '攻擊1'], ['Atk2', '攻擊2'], ['Atk3', '攻擊3'],
      ['Skill1', 'Skill1'], ['Skill2', 'Skill2'], ['Skill3', 'Skill3'],
    ];
    const fields = slots.map(([id, lab]) => `
      <label>${lab} 傷害
        <input id="idleDg${who}${id}Dmg" type="number" min="0" step="1" title="0 為不使用">
      </label>
      <label>${lab} CD
        <input id="idleDg${who}${id}Cd" type="number" min="0" step="0.1" title="秒">
      </label>
    `).join('');
    return `<div class="idle-gm-section-title">${title}（優先 skill1→2→3，再攻擊1～3）</div>
      <div class="idle-gm-rewards idle-gm-rewards--atk4">${fields}</div>`;
  }

  function gmFormHtml() {
    const catOpts = categories().map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    return `
      <label class="idle-gm-field">
        <span>編輯副本</span>
        <select id="idleDungeonGmSelect"></select>
      </label>
      <div class="idle-gm-rewards idle-gm-rewards--wide">
        <label>名稱 <input id="idleDgName" type="text"></label>
        <label>大分類
          <select id="idleDgCategory">${catOpts}</select>
        </label>
        <label>戰鬥種類
          <select id="idleDgType">
            <option value="timed">計時</option>
            <option value="normal">地下城</option>
            <option value="damage">傷害門檻</option>
          </select>
        </label>
        <label>入場券 ID <input id="idleDgTicketId" type="text"></label>
        <label>入場券名稱 <input id="idleDgTicketName" type="text"></label>
        <label id="idleDgDurationLabel">時限（秒，0＝不限） <input id="idleDgDuration" type="number" min="0" step="1"></label>
        <label>怪物等級（命中／減傷） <input id="idleDgMobLevel" type="number" min="1" max="300" step="1" title="副本怪固定用此等級，與章節地圖無關"></label>
        <label>入場等級（傷害副本用，0＝不限） <input id="idleDgReqLevel" type="number" min="0" max="300" step="1" title="傷害副本入場等級；計時／地下城請在各難度設定"></label>
        <label class="idle-gm-check"><input id="idleDgFieldDrops" type="checkbox"> 小怪掉落（野外表）</label>
        <label class="idle-gm-check"><input id="idleDgFieldGold" type="checkbox"> 小怪金幣（野外表）</label>
      </div>
      <div class="idle-gm-section-title">副本小怪掉落表</div>
      <p class="idle-gm-hint">計時／地下城專用。未勾選「野外表」時，擊殺小怪會依此表掉落。獎勵預覽只顯示 icon＋名稱（同 ID 合併）。</p>
      <textarea id="idleDgMobDrops" rows="4" spellcheck="false"></textarea>
      <div class="idle-gm-section-title">副本專用地圖</div>
      <p class="idle-gm-hint">進入副本會切到這張圖。血量倍數、傷害倍數分別乘在基礎血量與怪物攻擊傷害上。小怪外觀可多種，戰鬥數值共用。</p>
      <div class="idle-gm-rewards idle-gm-rewards--wide">
        <label>地圖名稱 <input id="idleDgMapName" type="text"></label>
        <label>背景 artId <input id="idleDgMapArt" type="text" placeholder="victoria-10101"></label>
      </div>
      <div class="idle-gm-section-title">小怪外觀池（共用血量／攻擊／CD，出場隨機抽）</div>
      <div class="idle-gm-actions idle-gm-actions--tight">
        <button type="button" id="idleDgAddMob" class="idle-gm-btn">新增小怪</button>
        <button type="button" id="idleDgRemoveMob" class="idle-gm-btn">移除小怪</button>
      </div>
      <div id="idleDgMobRows" class="idle-dg-mob-rows"></div>
      <div class="idle-gm-rewards idle-gm-rewards--wide">
        <label>小怪基礎血量 <input id="idleDgMobHp" type="number" min="1" step="1"></label>
        <label>BOSS 名稱 <input id="idleDgBossName" type="text"></label>
        <label>BOSS icon <input id="idleDgBossIcon" type="text" placeholder="0210100"></label>
        <label>BOSS 基礎血量 <input id="idleDgBossHp" type="number" min="1" step="1"></label>
      </div>
      ${atkGridHtml('Mob')}
      ${atkGridHtml('Boss')}
      <img id="idleDgMapPreview" class="idle-dungeon-map-preview" alt="副本地圖背景">
      <div id="idleDgArtList" class="idle-dungeon-art-list"></div>
      <div class="idle-gm-section-title">通關道具獎勵</div>
      <p class="idle-gm-hint">共用獎勵＝所有難度都會拿。難度專屬＝只該難度拿。小怪掉落＝戰鬥中掉。目錄點一下會加入下方「加入目標」。chance 0～100。</p>
      <label class="idle-gm-field">加入目標
        <select id="idleDgRewardTarget">
          <option value="shared">共用（所有難度）</option>
          <option value="mobDrops">小怪掉落</option>
        </select>
      </label>
      <div class="idle-dungeon-filters" id="idleDgRewardKinds">
        <button type="button" class="idle-hunt-btn idle-hunt-btn--ghost is-on" data-reward-kind="etc">其他</button>
        <button type="button" class="idle-hunt-btn idle-hunt-btn--ghost" data-reward-kind="consume">消耗</button>
        <button type="button" class="idle-hunt-btn idle-hunt-btn--ghost" data-reward-kind="equip">裝備</button>
      </div>
      <input id="idleDgRewardSearch" type="search" placeholder="搜尋名稱或 ID 後點一下加入">
      <div id="idleDgRewardCatalog" class="idle-dungeon-reward-catalog"></div>
      <div class="idle-gm-section-title">共用獎勵 JSON</div>
      <textarea id="idleDgRewards" rows="4" spellcheck="false"></textarea>
      <div id="idleDgRampSection" class="is-hidden">
        <div class="idle-gm-section-title">傷害試煉反傷成長</div>
        <p class="idle-gm-hint">不分難度；入場直接打不死 BOSS。反傷倍率 = 1 + (累計傷害 ÷ 基準)^次方。建議次方 0.5（平方根）：前期溫和、後期變強但不爆炸。</p>
        <div class="idle-gm-rewards idle-gm-rewards--wide">
          <label>成長基準傷害
            <input id="idleDgRampRef" type="number" min="1" step="1000" title="達到此傷害時額外 +1× 反傷（次方=0.5）">
          </label>
          <label>成長次方
            <input id="idleDgRampPower" type="number" min="0.1" max="2" step="0.05" title="0.5＝平方根；越大後期越兇">
          </label>
        </div>
      </div>
      <div id="idleDgDiffSection">
      <div class="idle-gm-section-title">難度（血量／傷害倍數＋專屬獎勵）</div>
      <div id="idleDgDiffRows" class="idle-dg-diff-rows"></div>
      <div class="idle-gm-actions idle-gm-actions--tight">
        <button type="button" id="idleDgAddDiff" class="idle-gm-btn">新增難度</button>
      </div>
      </div>
      <div class="idle-gm-section-title">傷害門檻 JSON（僅傷害類）</div>
      <textarea id="idleDgTiers" rows="5" spellcheck="false"></textarea>
      <p class="idle-gm-hint">計時／地下城：各難度可設入場等級、掉落物倍數、掉落率倍率（後兩項不顯示在玩家難度選單）。傷害副本：用上方「入場等級」。計時結算＝擊殺數 × 每殺金。地下城＝達擊殺數召喚 BOSS，擊敗才通關。傷害＝達成的門檻 gold／道具皆累積（達 2 也領 1）。</p>
      <div class="idle-gm-actions">
        <button type="button" id="idleDgSave" class="idle-gm-btn">儲存此副本</button>
        <button type="button" id="idleDgWriteJs" class="idle-gm-btn">寫入 JS 檔</button>
        <button type="button" id="idleDgAdd" class="idle-gm-btn">新增副本</button>
        <button type="button" id="idleDgDel" class="idle-gm-btn">刪除此副本</button>
        <button type="button" id="idleDgReset" class="idle-gm-btn">還原預設</button>
        <button type="button" id="idleDgAddDrop" class="idle-gm-btn">入場券加入目前地圖小怪掉落</button>
      </div>
      <p id="idleDgWriterHint" class="idle-gm-hint">寫入檔案請先在專案目錄執行 npm run gm-writer</p>
      <p id="idleDgStatus" class="idle-gm-hint"></p>
    `;
  }

  function collectAtkFromForm(prefix) {
    const cap = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const out = {};
    const slots = typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.ATK_SLOTS : ['Atk1', 'Atk2', 'Atk3', 'Skill1', 'Skill2', 'Skill3'];
    slots.forEach((slot) => {
      out[`${prefix}${slot}Dmg`] = $(`idleDg${cap}${slot}Dmg`)?.value;
      out[`${prefix}${slot}Cd`] = $(`idleDg${cap}${slot}Cd`)?.value;
    });
    return out;
  }

  function fillAtkForm(map, prefix) {
    const cap = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const slots = typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.ATK_SLOTS : ['Atk1', 'Atk2', 'Atk3', 'Skill1', 'Skill2', 'Skill3'];
    slots.forEach((slot) => {
      const dmgEl = $(`idleDg${cap}${slot}Dmg`);
      const cdEl = $(`idleDg${cap}${slot}Cd`);
      if (dmgEl) dmgEl.value = String(map[`${prefix}${slot}Dmg`] ?? 0);
      if (cdEl) cdEl.value = String(map[`${prefix}${slot}Cd`] ?? 0);
    });
  }

  function gmType() {
    return $('idleDgType')?.value || 'normal';
  }

  function renderMobRows(mobs) {
    const box = $('idleDgMobRows');
    if (!box) return;
    const rows = Array.isArray(mobs) && mobs.length
      ? mobs
      : [{ name: '副本怪物', icon: '' }];
    box.innerHTML = rows.map((m, i) => {
      const n = i + 1;
      const name = String(m?.name || '').replace(/"/g, '&quot;');
      const icon = String(m?.icon || m?.mobIcon || '').replace(/"/g, '&quot;');
      return `<div class="idle-dg-mob-row" data-mob-index="${i}">
        <label>小怪${n}名稱 <input data-k="name" type="text" value="${name}"></label>
        <label>小怪${n} ICON <input data-k="icon" type="text" placeholder="0210100" value="${icon}"></label>
      </div>`;
    }).join('');
  }

  function readMobRows() {
    const box = $('idleDgMobRows');
    if (!box) return [{ name: '副本怪物', icon: '' }];
    const rows = [...box.querySelectorAll('.idle-dg-mob-row')].map((row, i) => ({
      name: String(row.querySelector('[data-k="name"]')?.value || `副本怪物${i + 1}`).trim(),
      icon: String(row.querySelector('[data-k="icon"]')?.value || '').trim(),
    }));
    return rows.length ? rows : [{ name: '副本怪物', icon: '' }];
  }

  function snapshotMobRows() {
    return readMobRows();
  }

  function renderDiffRows(diffs) {
    const box = $('idleDgDiffRows');
    if (!box) return;
    const type = gmType();
    const rows = Array.isArray(diffs) && diffs.length ? diffs : [{ id: '1', name: '難度 1', hpMult: 1, dmgMult: 1, rewards: [] }];
    box.innerHTML = rows.map((x, i) => {
      const extra = type === 'timed'
        ? `<label>每殺金 <input data-k="settleGoldPerKill" type="number" min="0" step="1" value="${x.settleGoldPerKill || 0}"></label>`
        : (type === 'normal'
          ? `<label>擊殺數 <input data-k="killNeed" type="number" min="0" step="1" value="${x.killNeed || 0}"></label>
             <label>通關金 <input data-k="clearGold" type="number" min="0" step="1" value="${x.clearGold || 0}"></label>`
          : '');
      const rewardsText = escapeHtml(JSON.stringify(Array.isArray(x.rewards) ? x.rewards : [], null, 2));
      return `<div class="idle-dg-diff-row" data-diff-index="${i}">
        <input type="hidden" data-k="id" value="${String(x.id || i + 1).replace(/"/g, '')}">
        <label>名稱 <input data-k="name" type="text" value="${String(x.name || `難度 ${i + 1}`).replace(/"/g, '&quot;')}"></label>
        <label>入場等級 <input data-k="reqLevel" type="number" min="0" max="300" step="1" value="${x.reqLevel || 0}" title="0＝不限制"></label>
        <label>血量倍數 <input data-k="hpMult" type="number" min="0.1" step="0.1" value="${x.hpMult || 1}"></label>
        <label>傷害倍數 <input data-k="dmgMult" type="number" min="0.1" step="0.1" value="${x.dmgMult || 1}"></label>
        <label>掉落物倍數 <input data-k="dropAmountMult" type="number" min="0" step="0.1" value="${x.dropAmountMult ?? 1}" title="小怪掉落／通關道具數量 ×此值"></label>
        <label>掉落率倍率 <input data-k="dropRateMult" type="number" min="0" step="0.1" value="${x.dropRateMult ?? 1}" title="掉落機率 ×此值（最高 100%）"></label>
        ${extra}
        <button type="button" class="idle-gm-btn" data-diff-del="${i}">刪</button>
        <label class="idle-dg-diff-rewards">此難度專屬獎勵 JSON
          <textarea data-k="rewards" rows="3" spellcheck="false">${rewardsText}</textarea>
        </label>
      </div>`;
    }).join('');
    syncRewardTargetOptions();
  }

  function parseRewardsField(text) {
    try {
      const v = JSON.parse(String(text || '[]'));
      return Array.isArray(v) ? v : [];
    } catch (_) {
      return null;
    }
  }

  function readDiffRows() {
    const box = $('idleDgDiffRows');
    if (!box) return [];
    return [...box.querySelectorAll('.idle-dg-diff-row')].map((row, i) => {
      const val = (k) => row.querySelector(`[data-k="${k}"]`)?.value;
      const rewards = parseRewardsField(val('rewards'));
      return {
        id: String(val('id') || i + 1),
        name: String(val('name') || `難度 ${i + 1}`),
        reqLevel: val('reqLevel'),
        hpMult: val('hpMult'),
        dmgMult: val('dmgMult'),
        dropAmountMult: val('dropAmountMult'),
        dropRateMult: val('dropRateMult'),
        killNeed: val('killNeed'),
        settleGoldPerKill: val('settleGoldPerKill'),
        clearGold: val('clearGold'),
        rewards: rewards == null ? [] : rewards,
      };
    });
  }

  function syncRewardTargetOptions() {
    const sel = $('idleDgRewardTarget');
    if (!sel) return;
    const prev = sel.value || 'shared';
    const diffs = [...( $('idleDgDiffRows')?.querySelectorAll('.idle-dg-diff-row') || [])].map((row, i) => ({
      i,
      name: String(row.querySelector('[data-k="name"]')?.value || `難度 ${i + 1}`),
    }));
    sel.innerHTML = [
      '<option value="shared">共用（所有難度）</option>',
      '<option value="mobDrops">小怪掉落</option>',
      ...diffs.map((d) => `<option value="diff-${d.i}">${escapeHtml(d.name)} 專屬</option>`),
    ].join('');
    if ([...sel.options].some((o) => o.value === prev)) sel.value = prev;
    else sel.value = 'shared';
  }

  function snapshotDiffRows() {
    return readDiffRows();
  }

  function gmStatus(text) {
    const el = $('idleDgStatus');
    if (el) el.textContent = text || '';
  }

  async function pingWriter() {
    try {
      const res = await fetch(`${WRITER_URL}/health`);
      writerOk = res.ok;
    } catch (_) {
      writerOk = false;
    }
    const hint = $('idleDgWriterHint');
    if (hint) {
      hint.textContent = writerOk
        ? '寫入服務已連線，儲存／寫入會覆寫 js/idleDungeonListData.js'
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
    if (typeof IdleDungeonStore === 'undefined' || typeof IdleDungeonStore.serializeDataFile !== 'function') {
      return false;
    }
    const source = IdleDungeonStore.serializeDataFile();
    try {
      const res = await fetch(`${WRITER_URL}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'dungeon', source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      IdleDungeonStore.syncRuntimeData?.();
      writerOk = true;
      gmStatus('已寫入 js/idleDungeonListData.js');
      pingWriter();
      return true;
    } catch (err) {
      writerOk = false;
      gmStatus(`寫入 JS 失敗：${err.message || err}（請先 npm run gm-writer）`);
      pingWriter();
      return false;
    }
  }

  function syncTypeDependentGmUi() {
    const type = gmType();
    const isDamage = type === 'damage';
    const isNormal = type === 'normal';
    $('idleDgDiffSection')?.classList.toggle('is-hidden', isDamage);
    $('idleDgRampSection')?.classList.toggle('is-hidden', !isDamage);
    const durLabel = $('idleDgDurationLabel');
    durLabel?.classList.toggle('is-hidden', isNormal);
    if (isNormal && $('idleDgDuration')) $('idleDgDuration').value = '0';
  }

  function fillGmForm() {
    const sel = $('idleDungeonGmSelect');
    if (!sel || typeof IdleDungeonStore === 'undefined') return;
    const list = gmList();
    if (!list.some((d) => d.id === selectedId)) selectedId = list[0]?.id || '';
    sel.innerHTML = list.map((d) => (
      `<option value="${d.id}"${d.id === selectedId ? ' selected' : ''}>${d.name}（${catLabel(d.category)}／${typeLabel(d.type)}）</option>`
    )).join('');
    const d = IdleDungeonStore.get(selectedId);
    if (!d) return;
    if ($('idleDgName')) $('idleDgName').value = d.name;
    if ($('idleDgCategory')) $('idleDgCategory').value = categories().some((c) => c.id === d.category) ? d.category : 'material';
    if ($('idleDgType')) $('idleDgType').value = d.type === 'boss' ? 'normal' : d.type;
    if ($('idleDgTicketId')) $('idleDgTicketId').value = d.ticketId;
    if ($('idleDgTicketName')) $('idleDgTicketName').value = d.ticketName;
    if ($('idleDgDuration')) $('idleDgDuration').value = String(d.durationSec || 0);
    if ($('idleDgMobLevel')) $('idleDgMobLevel').value = String(d.mobLevel || 100);
    if ($('idleDgReqLevel')) $('idleDgReqLevel').value = String(d.reqLevel || 0);
    if ($('idleDgFieldDrops')) $('idleDgFieldDrops').checked = !!d.useFieldDrops;
    if ($('idleDgFieldGold')) $('idleDgFieldGold').checked = !!d.useFieldGold;
    if ($('idleDgRampRef')) $('idleDgRampRef').value = String(d.dmgRampRef || 100000);
    if ($('idleDgRampPower')) $('idleDgRampPower').value = String(d.dmgRampPower ?? 0.5);
    const map = d.map || {};
    if ($('idleDgMapName')) $('idleDgMapName').value = map.name || '';
    if ($('idleDgMapArt')) $('idleDgMapArt').value = map.artId || '';
    renderMobRows(map.mobs?.length
      ? map.mobs
      : [{ name: map.mobName || '副本怪物', icon: map.mobIcon || '' }]);
    if ($('idleDgMobHp')) $('idleDgMobHp').value = String(map.baseMobHp || 100);
    if ($('idleDgBossName')) $('idleDgBossName').value = map.bossName || '';
    if ($('idleDgBossIcon')) $('idleDgBossIcon').value = map.bossIcon || '';
    if ($('idleDgBossHp')) $('idleDgBossHp').value = String(map.baseBossHp || 1800);
    fillAtkForm(map, 'mob');
    fillAtkForm(map, 'boss');
    if ($('idleDgRewards')) $('idleDgRewards').value = JSON.stringify(d.rewards || [], null, 2);
    if ($('idleDgMobDrops')) $('idleDgMobDrops').value = JSON.stringify(d.mobDrops || [], null, 2);
    renderDiffRows(d.diffs);
    if ($('idleDgTiers')) $('idleDgTiers').value = JSON.stringify(d.damageTiers || [], null, 2);
    syncTypeDependentGmUi();
    updateMapPreview();
    renderRewardCatalog();
    loadArtList();
  }

  function parseJson(text, fallback) {
    try {
      const v = JSON.parse(String(text || 'null'));
      return v == null ? fallback : v;
    } catch (_) {
      return null;
    }
  }

  function successSettle(cur, reason) {
    // 計時本：擊殺楓幣另算；通關道具僅時限結束才發
    if (cur.type === 'timed') return reason === 'timeout';
    if (cur.type === 'normal') return reason === 'win';
    if (cur.type === 'damage') {
      const d = typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.get(cur.id) : null;
      return !!bestDamageTier(d, cur.damage);
    }
    return reason === 'win';
  }

  function grantItemRewards(dungeon, cur, reason) {
    const totals = new Map();
    if (!successSettle(cur, reason) || typeof InventoryModule === 'undefined') return totals;
    const diff = dungeon ? IdleDungeonStore.getDiff(dungeon, cur.diffId) : null;
    const tiers = dungeon && cur.type === 'damage' ? reachedDamageTiers(dungeon, cur.damage) : [];
    const tierRewards = tiers.flatMap((t) => t.rewards || []);
    const amountMult = Math.max(0, Number(cur.dropAmountMult ?? diff?.dropAmountMult) || 1);
    const rateMult = Math.max(0, Number(cur.dropRateMult ?? diff?.dropRateMult) || 1);
    const rows = [
      ...(dungeon?.rewards || []),
      ...(diff?.rewards || []),
      ...tierRewards,
    ];
    rows.forEach((row) => {
      const chance = Number(row.chance);
      const baseRoll = Number.isFinite(chance) ? chance : 100;
      const roll = Math.min(100, baseRoll * rateMult);
      if (Math.random() * 100 >= roll) return;
      const baseAmt = rewardAmount(row);
      const amt = Math.max(1, Math.floor(baseAmt * amountMult));
      const drop = row.kind === 'consume'
        ? { ...row, kind: 'consume', amount: amt }
        : { ...row, amount: amt };
      const result = InventoryModule.applyIdleDrop(drop, { logTag: '副本', silent: true });
      if (!result?.ok) return;
      const name = result.name || rewardDisplayName(row);
      const got = Number(result.amount) > 0
        ? Math.floor(Number(result.amount))
        : amt;
      totals.set(name, (totals.get(name) || 0) + got);
      recordLoot(name, got);
    });
    return totals;
  }

  function updateMapPreview() {
    const img = $('idleDgMapPreview');
    const artId = String($('idleDgMapArt')?.value || '').trim();
    if (!img) return;
    if (!artId || typeof IdleZones === 'undefined' || !IdleZones.artUrl) {
      img.removeAttribute('src');
      img.hidden = true;
      return;
    }
    img.hidden = false;
    img.src = IdleZones.artUrl(artId);
  }

  function loadArtList() {
    const box = $('idleDgArtList');
    if (!box || typeof IdleZones === 'undefined' || typeof IdleZones.scanArtCatalog !== 'function') return;
    IdleZones.scanArtCatalog().then((list) => {
      artItems = Array.isArray(list) ? list : [];
      const current = String($('idleDgMapArt')?.value || '').trim();
      box.innerHTML = artItems.slice(0, 80).map((item) => (
        `<button type="button" class="idle-dungeon-art${item.artId === current ? ' is-on' : ''}" data-art-id="${item.artId}" title="${item.artId}">
          <img src="${item.url || IdleZones.artUrl(item.artId)}" alt="">
          <span>${item.artId}</span>
        </button>`
      )).join('');
    }).catch(() => {
      box.innerHTML = '<span class="idle-dungeon-hint">無法載入背景清單</span>';
    });
  }

  function readRewardsJson() {
    const parsed = parseJson($('idleDgRewards')?.value, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeRewardsJson(rows) {
    if ($('idleDgRewards')) $('idleDgRewards').value = JSON.stringify(rows, null, 2);
  }

  function readMobDropsJson() {
    const parsed = parseJson($('idleDgMobDrops')?.value, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeMobDropsJson(rows) {
    if ($('idleDgMobDrops')) $('idleDgMobDrops').value = JSON.stringify(rows, null, 2);
  }

  function addReward(row) {
    const target = String($('idleDgRewardTarget')?.value || 'shared');
    if (target === 'mobDrops') {
      const next = readMobDropsJson();
      next.push(row);
      writeMobDropsJson(next);
      gmStatus(`已加入【${row.name || row.itemId || row.catalogId}】→ 小怪掉落`);
      return;
    }
    if (target.startsWith('diff-')) {
      const idx = Number(target.slice(5));
      const rows = snapshotDiffRows();
      if (!rows[idx]) {
        gmStatus('找不到目標難度，請先新增難度。');
        return;
      }
      const next = Array.isArray(rows[idx].rewards) ? rows[idx].rewards.slice() : [];
      next.push(row);
      rows[idx].rewards = next;
      renderDiffRows(rows);
      if ($('idleDgRewardTarget')) $('idleDgRewardTarget').value = `diff-${idx}`;
      gmStatus(`已加入【${row.name || row.itemId || row.catalogId}】→ ${rows[idx].name} 專屬`);
      return;
    }
    const next = readRewardsJson();
    next.push(row);
    writeRewardsJson(next);
    gmStatus(`已加入【${row.name || row.itemId || row.catalogId}】→ 共用獎勵`);
  }

  function renderRewardCatalog() {
    const grid = $('idleDgRewardCatalog');
    if (!grid) return;
    const q = String($('idleDgRewardSearch')?.value || '').trim().toLowerCase();
    $('idleDgRewardKinds')?.querySelectorAll('[data-reward-kind]').forEach((btn) => {
      btn.classList.toggle('is-on', btn.getAttribute('data-reward-kind') === gmRewardKind);
    });
    if (gmRewardKind === 'etc') {
      const rows = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.search(q) : [];
      grid.innerHTML = rows.map((item) => (
        `<button type="button" class="idle-dungeon-reward" data-reward-etc="${item.id}">
          <img src="${item.icon}" alt="" onerror="this.style.visibility='hidden'">
          <span>${item.name}</span>
        </button>`
      )).join('') || '<div class="idle-dungeon-empty">沒有其他道具</div>';
      return;
    }
    if (gmRewardKind === 'consume') {
      const rows = typeof IdleConsumeStore !== 'undefined' ? IdleConsumeStore.search(q) : [];
      grid.innerHTML = rows.map((item) => (
        `<button type="button" class="idle-dungeon-reward" data-reward-consume="${item.id}">
          <img src="${item.icon}" alt="" onerror="this.style.visibility='hidden'">
          <span>${item.name}</span>
        </button>`
      )).join('') || '<div class="idle-dungeon-empty">沒有消耗品</div>';
      return;
    }
    if (typeof ITEM_DATABASE === 'undefined') {
      grid.innerHTML = '<div class="idle-dungeon-empty">沒有裝備資料</div>';
      return;
    }
    const rows = Object.keys(ITEM_DATABASE).map((id) => ITEM_DATABASE[id]).filter((item) => {
      if (!item) return false;
      if (!q) return true;
      return String(item.name || '').toLowerCase().includes(q)
        || String(item.itemId || item.id || '').toLowerCase().includes(q);
    }).slice(0, 40);
    grid.innerHTML = rows.map((item) => {
      const id = item.itemId || item.id;
      return `<button type="button" class="idle-dungeon-reward" data-reward-equip="${id}">
        <img src="images/equip/${id}.png" alt="" onerror="this.style.visibility='hidden'">
        <span>${item.name}</span>
      </button>`;
    }).join('') || '<div class="idle-dungeon-empty">沒有符合的裝備</div>';
  }

  function saveGm() {
    const type = $('idleDgType').value;
    const isDamage = type === 'damage';
    const diffs = isDamage ? [] : readDiffRows();
    if (!isDamage && !diffs.length) {
      gmStatus('請至少保留一個難度。');
      return;
    }
    if (!isDamage) {
      const bad = [...($('idleDgDiffRows')?.querySelectorAll('[data-k="rewards"]') || [])]
        .find((ta) => parseRewardsField(ta.value) == null);
      if (bad) {
        gmStatus('某個難度的專屬獎勵 JSON 無效。');
        return;
      }
    }
    const tiers = parseJson($('idleDgTiers')?.value, []);
    if (tiers == null) {
      gmStatus('傷害門檻 JSON 無效。');
      return;
    }
    const rewards = parseJson($('idleDgRewards')?.value, []);
    if (!Array.isArray(rewards)) {
      gmStatus('共用道具獎勵 JSON 必須是陣列。');
      return;
    }
    const mobDrops = parseJson($('idleDgMobDrops')?.value, []);
    if (!Array.isArray(mobDrops)) {
      gmStatus('小怪掉落 JSON 必須是陣列。');
      return;
    }
    IdleDungeonStore.upsert({
      id: selectedId,
      name: $('idleDgName').value,
      type,
      category: $('idleDgCategory')?.value || 'material',
      ticketId: $('idleDgTicketId').value,
      ticketName: $('idleDgTicketName').value,
      durationSec: $('idleDgDuration').value,
      mobLevel: $('idleDgMobLevel')?.value,
      reqLevel: $('idleDgReqLevel')?.value,
      useFieldDrops: $('idleDgFieldDrops').checked,
      useFieldGold: $('idleDgFieldGold').checked,
      dmgRampRef: $('idleDgRampRef')?.value,
      dmgRampPower: $('idleDgRampPower')?.value,
      map: {
        name: $('idleDgMapName')?.value,
        artId: $('idleDgMapArt')?.value,
        mobs: readMobRows(),
        bossName: $('idleDgBossName')?.value,
        bossIcon: $('idleDgBossIcon')?.value,
        baseMobHp: $('idleDgMobHp')?.value,
        baseBossHp: $('idleDgBossHp')?.value,
        ...collectAtkFromForm('mob'),
        ...collectAtkFromForm('boss'),
      },
      mobDrops,
      rewards,
      diffs,
      damageTiers: Array.isArray(tiers) ? tiers : [],
      enabled: true,
    });
    gmStatus('已儲存。');
    scheduleWriteJs();
    fillGmForm();
    render();
  }

  function addTicketDropToCurrentMap() {
    const d = IdleDungeonStore.get(selectedId);
    if (!d || typeof IdleZoneDropStore === 'undefined' || typeof IdleHunt === 'undefined') {
      gmStatus('無法寫入地圖掉落。');
      return;
    }
    const zoneId = IdleHunt.getZoneId?.();
    if (!zoneId) {
      gmStatus('沒有目前地圖。');
      return;
    }
    const cfg = typeof IdleZones !== 'undefined' ? IdleZones.configFor(IdleZones.get(zoneId)) : {};
    const mobDrops = Array.isArray(cfg.mobDrops) ? cfg.mobDrops.map((row) => ({ ...row })) : [];
    if (mobDrops.some((row) => row.kind === 'etc' && row.itemId === d.ticketId)) {
      gmStatus('此圖小怪掉落已有這張入場券。');
      return;
    }
    mobDrops.push({
      kind: 'etc',
      itemId: d.ticketId,
      name: d.ticketName,
      chance: 8,
      amount: 1,
    });
    IdleZoneDropStore.patch(zoneId, { mobDrops });
    gmStatus(`已把【${d.ticketName}】加入目前地圖小怪掉落（8%）。`);
  }

  function mountGm(host) {
    if (!host) return;
    if (
      !host.querySelector('#idleDgRampSection')
      || !host.querySelector('#idleDgMobRows')
      || !host.querySelector('#idleDgWriteJs')
      || !host.querySelector('#idleDgMobLevel')
      || !host.querySelector('#idleDgRewardTarget')
      || !host.querySelector('#idleDgMobDrops')
      || !host.querySelector('#idleDgReqLevel')
    ) {
      host.innerHTML = gmFormHtml();
      host.dataset.gmMounted = '1';
      gmBound = false;
    }
    bindGm();
    fillGmForm();
    pingWriter();
  }

  function bindGm() {
    if (gmBound) return;
    if (!$('idleDungeonGmSelect')) return;
    gmBound = true;
    $('idleDungeonGmSelect')?.addEventListener('change', () => {
      selectedId = $('idleDungeonGmSelect').value;
      fillGmForm();
    });
    $('idleDgType')?.addEventListener('change', () => {
      renderDiffRows(snapshotDiffRows());
      syncTypeDependentGmUi();
    });
    $('idleDgAddMob')?.addEventListener('click', (e) => {
      e.preventDefault();
      const rows = snapshotMobRows();
      const n = rows.length + 1;
      rows.push({ name: `副本怪物${n}`, icon: '' });
      renderMobRows(rows);
    });
    $('idleDgRemoveMob')?.addEventListener('click', (e) => {
      e.preventDefault();
      const rows = snapshotMobRows();
      if (rows.length <= 1) {
        gmStatus('至少保留一隻小怪。');
        return;
      }
      rows.pop();
      renderMobRows(rows);
    });
    $('idleDgAddDiff')?.addEventListener('click', (e) => {
      e.preventDefault();
      const rows = snapshotDiffRows();
      rows.push({
        id: String(rows.length + 1),
        name: `難度 ${rows.length + 1}`,
        reqLevel: 0,
        hpMult: 1,
        dmgMult: 1,
        dropAmountMult: 1,
        dropRateMult: 1,
        killNeed: 20,
        clearGold: 1000,
        settleGoldPerKill: 0,
        rewards: [],
      });
      renderDiffRows(rows);
    });
    $('idleDgDiffRows')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-diff-del]');
      if (!btn) return;
      const idx = Number(btn.getAttribute('data-diff-del'));
      const rows = snapshotDiffRows().filter((_, i) => i !== idx);
      renderDiffRows(rows.length ? rows : [{ id: '1', name: '難度 1', hpMult: 1, dmgMult: 1, rewards: [] }]);
    });
    $('idleDgDiffRows')?.addEventListener('input', (e) => {
      if (e.target?.matches?.('[data-k="name"]')) syncRewardTargetOptions();
    });
    $('idleDgSave')?.addEventListener('click', (e) => {
      e.preventDefault();
      saveGm();
    });
    $('idleDgWriteJs')?.addEventListener('click', (e) => {
      e.preventDefault();
      writeJsFile();
    });
    $('idleDgAdd')?.addEventListener('click', (e) => {
      e.preventDefault();
      const id = `dungeon-${Date.now()}`;
      IdleDungeonStore.upsert({
        id,
        name: '新副本',
        type: 'normal',
        category: $('idleDgCategory')?.value || pickerCat || 'material',
        ticketId: `idle-ticket-${id}`,
        ticketName: '新副本入場券',
        mobLevel: 100,
        diffs: [{ id: '1', name: '難度 1', killNeed: 20, clearGold: 1000, hpMult: 1, dmgMult: 1 }],
      });
      selectedId = id;
      fillGmForm();
      render();
      gmStatus('已新增副本。');
      scheduleWriteJs();
    });
    $('idleDgDel')?.addEventListener('click', (e) => {
      e.preventDefault();
      IdleDungeonStore.remove(selectedId);
      selectedId = gmList()[0]?.id || '';
      fillGmForm();
      render();
      gmStatus('已刪除。');
      scheduleWriteJs();
    });
    $('idleDgReset')?.addEventListener('click', (e) => {
      e.preventDefault();
      IdleDungeonStore.resetDefaults();
      selectedId = gmList()[0]?.id || '';
      fillGmForm();
      render();
      gmStatus('已還原預設副本（BOSS 類仍保留資料，但此頁不編輯）。');
      scheduleWriteJs();
    });
    $('idleDgAddDrop')?.addEventListener('click', (e) => {
      e.preventDefault();
      addTicketDropToCurrentMap();
    });
    $('idleDgMapArt')?.addEventListener('input', () => updateMapPreview());
    $('idleDgArtList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-art-id]');
      if (!btn) return;
      if ($('idleDgMapArt')) $('idleDgMapArt').value = btn.getAttribute('data-art-id') || '';
      updateMapPreview();
      loadArtList();
    });
    $('idleDgRewardKinds')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-reward-kind]');
      if (!btn) return;
      gmRewardKind = btn.getAttribute('data-reward-kind') || 'etc';
      renderRewardCatalog();
    });
    $('idleDgRewardSearch')?.addEventListener('input', () => renderRewardCatalog());
    $('idleDgRewardCatalog')?.addEventListener('click', (e) => {
      const etcBtn = e.target.closest('[data-reward-etc]');
      if (etcBtn) {
        const item = typeof IdleEtcStore !== 'undefined' ? IdleEtcStore.get(etcBtn.getAttribute('data-reward-etc')) : null;
        if (item) addReward({ kind: 'etc', itemId: item.id, name: item.name, amount: 1, chance: 100 });
        return;
      }
      const consumeBtn = e.target.closest('[data-reward-consume]');
      if (consumeBtn) {
        const item = typeof IdleConsumeStore !== 'undefined' ? IdleConsumeStore.get(consumeBtn.getAttribute('data-reward-consume')) : null;
        if (item) {
          addReward({
            kind: 'consume',
            catalogId: item.id,
            consumeType: item.consumeType,
            scrollId: item.scrollId || '',
            cubeId: item.cubeId || '',
            hammerId: item.hammerId || '',
            soulId: item.soulId || '',
            itemId: item.itemId || '',
            name: item.name,
            amount: 1,
            chance: 100,
          });
        }
        return;
      }
      const equipBtn = e.target.closest('[data-reward-equip]');
      if (equipBtn) {
        const id = equipBtn.getAttribute('data-reward-equip');
        const item = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[id] : null;
        addReward({ kind: 'equip', itemId: id, name: item?.name || id, amount: 1, chance: 100 });
      }
    });
  }

  function setOpen(next, opts = {}) {
    open = !!next;
    ensureDom();
    init();
    if (open) {
      if (!opts.keepView) {
        const cur = run();
        if (cur) {
          selectedId = cur.id;
          const d = typeof IdleDungeonStore !== 'undefined' ? IdleDungeonStore.get(cur.id) : null;
          if (d?.category && d.category !== 'boss') pickerCat = d.category;
          pickerView = 'enter';
        } else {
          pickerView = 'cats';
        }
      }
      if (typeof IdleHunt !== 'undefined') IdleHunt.setPickerOpen?.(false);
      if (typeof IdleBoss !== 'undefined') IdleBoss.closeAll?.();
      if (typeof EquipCraftPanel !== 'undefined') EquipCraftPanel.setOpen?.(false);
      if (typeof DisassemblePanel !== 'undefined') DisassemblePanel.setOpen?.(false);
      render();
    } else {
      syncPickerChrome();
    }
  }

  function goBack() {
    if (pickerView === 'enter') pickerView = 'stages';
    else pickerView = 'cats';
    renderPicker();
  }

  function init() {
    if (inited) return;
    ensureDom();
    inited = true;
    const root = $('idleDungeonRoot');
    root?.addEventListener('click', (e) => {
      if (e.target.closest('#idleDungeonClose')) {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.target.closest('#idleDungeonBack')) {
        e.preventDefault();
        goBack();
        return;
      }
      const catBtn = e.target.closest('[data-dungeon-cat]');
      if (catBtn) {
        e.preventDefault();
        pickerCat = catBtn.getAttribute('data-dungeon-cat') || 'gold';
        pickerView = 'stages';
        renderPicker();
        return;
      }
      const stageBtn = e.target.closest('[data-dungeon]');
      if (stageBtn) {
        e.preventDefault();
        selectedId = stageBtn.getAttribute('data-dungeon') || '';
        pickerView = 'enter';
        resultText = '';
        renderPicker();
        return;
      }
      if (e.target.closest('#idleDungeonStart')) {
        e.preventDefault();
        enter();
        return;
      }
      if (e.target.closest('#idleDungeonLeave')) {
        e.preventDefault();
        if (run()) settle('leave');
      }
    });
    root?.addEventListener('change', (e) => {
      if (e.target?.id === 'idleDungeonDiff') selectedDiffId = e.target.value;
    });
  }

  return {
    init,
    setOpen,
    toggle() {
      init();
      setOpen(!open);
    },
    isOpen: () => open,
    mountGm,
    fillGmForm,
    renderHud,
    onHuntKill,
    onHuntDamage,
    onHuntTick,
    onHuntDeath,
    recordLoot,
    closeAll() {
      setOpen(false);
    },
  };
})();

if (typeof window !== 'undefined') {
  window.IdleDungeon = IdleDungeon;
  IdleDungeon.closeAll = IdleDungeon.closeAll;
}
