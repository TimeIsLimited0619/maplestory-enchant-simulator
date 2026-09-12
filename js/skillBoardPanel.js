/**
 * 技能面板 UI — 接 CharacterSkills / SkillCatalog（劍士一轉起）
 */
const SkillBoardPanel = (() => {
  const RANKS = ['10', '30', '60', '100', 'hyper', 'hexa'];
  const TYPES = ['active', 'buff', 'passive'];
  const LOCKED_RANKS = new Set(['hexa']);

  let inited = false;
  let open = false;

  const ui = {
    activeRank: '10',
    activeType: 'active',
  };

  function $(id) {
    return document.getElementById(id);
  }

  function ensureState() {
    if (typeof CharacterSkills !== 'undefined') {
      CharacterSkills.ensureHydrated?.();
    }
  }

  function iconHtml(skill, kind) {
    if (!skill) return '';
    const raw = skill.icon || (typeof SkillCatalog !== 'undefined' ? SkillCatalog.iconUrl(skill) : '');
    const url = raw
      ? (raw.includes('?') ? raw : `${raw}?v=20260829icon2`)
      : '';
    if (url) {
      const cls = kind === 'equip' ? 'skb-equip-icon' : 'skb-skill-icon';
      return `<img class="${cls}" src="${url}" alt="" draggable="false" decoding="async">`;
    }
    const fallback = kind === 'equip' ? 'skb-equip-icon-fallback' : 'skb-skill-icon-fallback';
    const glyph = String(skill.name || '?').charAt(0);
    return `<span class="${fallback}" style="background:#5a6a88">${glyph}</span>`;
  }

  function ensureDom() {
    if ($('skbRoot')) return;

    const root = document.createElement('div');
    root.id = 'skbRoot';
    root.className = 'skb-root is-hidden';
    root.setAttribute('aria-label', '技能');
    root.innerHTML = `
      <div class="skb-frame" id="skbFrame">
        <div class="skb-drag-handle" id="skbDragHandle" title="拖曳視窗"></div>
        <button type="button" class="panel-wb-close" id="skbClose" aria-label="關閉技能" title="關閉"><span aria-hidden="true">×</span></button>
        <div class="skb-job-label" id="skbJobLabel">職業：劍士</div>

        <div class="skb-rank-tabs" id="skbRankTabs" role="tablist" aria-label="技能階段"></div>

        <div class="skb-equip-panel">
          <div class="skb-presets" id="skbPresets">
            <div class="skb-presets-group">
              <button type="button" class="skb-preset-btn" data-preset="1" aria-label="技能預設 1"></button>
              <button type="button" class="skb-preset-btn" data-preset="2" aria-label="技能預設 2"></button>
              <button type="button" class="skb-preset-btn" data-preset="3" aria-label="技能預設 3"></button>
            </div>
            <button type="button" class="skb-preset-set" id="skbPresetSet" aria-label="技能設定" title="技能設定"></button>
            <div class="skb-settings-pop" id="skbSettingsPop" hidden>
              <label class="skb-settings-row">
                <input type="checkbox" id="skbShowStackBuffs" checked>
                <span>堆疊 Buff 顯示層數</span>
              </label>
            </div>
          </div>
          <div class="skb-equip-grid" id="skbEquipGrid"></div>
          <div class="skb-skill-link" id="skbSkillLink" aria-label="技能連鎖">
            <img class="skb-skill-link__bg" src="images/UIskillboard/slot_skill_link.png" alt="" draggable="false" decoding="async">
            <div class="skb-skill-link__slots" id="skbSkillLinkSlots"></div>
          </div>
        </div>

        <div class="skb-sp-label" aria-hidden="true"></div>
        <div class="skb-sp-value" id="skbSpValue">0</div>
        <button type="button" class="skb-sp-reset" id="skbSpReset" aria-label="重置目前階段技能點" title="重置目前階段技能點"></button>

        <div class="skb-list-panel">
          <div class="skb-type-tabs" id="skbTypeTabs" role="tablist" aria-label="技能類型"></div>
          <div class="skb-skill-list" id="skbSkillList"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const rankTabs = $('skbRankTabs');
    RANKS.forEach((rank) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skb-rank-tab';
      btn.dataset.rank = rank;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `技能階段 ${rank}`);
      btn.innerHTML = '<span class="skb-rank-lock" aria-hidden="true"></span>';
      rankTabs.appendChild(btn);
    });

    const typeTabs = $('skbTypeTabs');
    const typeLabels = { active: '主動', buff: 'Buff', passive: '被動' };
    TYPES.forEach((type) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'skb-type-tab';
      btn.dataset.type = type;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', typeLabels[type] || type);
      btn.innerHTML = `
        <span class="skb-type-tab-label" aria-hidden="true"></span>
        <span class="skb-type-count" data-type-count="${type}">0</span>
      `;
      typeTabs.appendChild(btn);
    });

    const grid = $('skbEquipGrid');
    for (let i = 0; i < 9; i += 1) {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'skb-equip-slot';
      slot.dataset.slot = String(i);
      slot.setAttribute('aria-label', `裝備格 ${i + 1}`);
      grid.appendChild(slot);
    }

    const linkSlots = $('skbSkillLinkSlots');
    for (let i = 0; i < 4; i += 1) {
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'skb-link-slot';
      slot.dataset.linkSlot = String(i);
      slot.setAttribute('aria-label', `技能連鎖 ${i + 1}`);
      slot.title = i === 0
        ? '連鎖 1：主導動作與延遲（僅無 CD 主動）；可秒殺時依攻擊隻數錯開目標'
        : `連鎖 ${i + 1}：無後搖／無角色動作，只播特效；可秒殺時接續下一批，否則集中同一目標`;
      linkSlots.appendChild(slot);
    }
  }

  function syncMenuButton() {
    $('btnViewSkill')?.classList.toggle('is-active', open);
  }

  function fitScale() {
    const root = $('skbRoot');
    if (!root) return;
    const BASE = 0.7;
    const margin = 24;
    const avail = Math.max(320, window.innerWidth - margin * 2);
    const scale = Math.min(BASE, avail / 1278);
    root.style.setProperty('--skb-scale', String(Math.round(scale * 1000) / 1000));
  }

  function setOpen(next) {
    open = !!next;
    ensureDom();
    ensureState();
    const root = $('skbRoot');
    if (root) root.classList.toggle('is-hidden', !open);
    syncMenuButton();
    if (open) {
      fitScale();
      if (typeof PanelDrag !== 'undefined') PanelDrag.bringFront?.(root);
      render();
    } else if (typeof SkillTooltip !== 'undefined') {
      SkillTooltip.hide?.();
    }
  }

  function renderJobLabel() {
    const el = $('skbJobLabel');
    if (!el) return;
    const name = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getJobLabel()
      : '劍士';
    el.textContent = `職業：${name}`;
  }

  function renderRankTabs() {
    const lv = typeof CharacterProgression !== 'undefined'
      ? (CharacterProgression.getState?.().level || 1)
      : 1;
    $('skbRankTabs')?.querySelectorAll('.skb-rank-tab').forEach((btn) => {
      const rank = btn.dataset.rank;
      const hardLocked = LOCKED_RANKS.has(rank);
      const rankLocked = hardLocked
        || (typeof CharacterSkills !== 'undefined' && !CharacterSkills.isRankUnlocked?.(rank));
      btn.classList.toggle('is-active', rank === ui.activeRank);
      btn.classList.toggle('is-locked', rankLocked);
      btn.setAttribute('aria-selected', rank === ui.activeRank ? 'true' : 'false');
      const need = typeof SkillPoints !== 'undefined'
        ? SkillPoints.rankRequiredLevel(rank)
        : 0;
      btn.title = rankLocked && !hardLocked && need < 999
        ? `${need} 等解鎖`
        : '';
    });
    if (typeof CharacterSkills !== 'undefined' && typeof SkillPoints !== 'undefined') {
      if (!CharacterSkills.isRankUnlocked(ui.activeRank)) {
        const best = SkillPoints.highestUnlockedRank(lv);
        if (best) ui.activeRank = best;
      }
    }
  }

  function renderPresets() {
    const active = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getActivePreset()
      : 1;
    $('skbPresets')?.querySelectorAll('.skb-preset-btn').forEach((btn) => {
      const p = Number(btn.dataset.preset);
      btn.classList.toggle('is-active', p === active);
    });
  }

  function renderEquipGrid() {
    const loadout = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.currentLoadout()
      : [];
    $('skbEquipGrid')?.querySelectorAll('.skb-equip-slot').forEach((slot) => {
      const idx = Number(slot.dataset.slot);
      const skillId = loadout[idx];
      const skill = skillId && typeof SkillCatalog !== 'undefined'
        ? SkillCatalog.getSkill(skillId)
        : null;
      slot.classList.toggle('is-filled', !!skill);
      slot.innerHTML = skill ? iconHtml(skill, 'equip') : '';
      if (skill) {
        slot.dataset.skillId = String(skill.id);
        slot.title = `${skill.name}（點擊卸下）`;
      } else {
        delete slot.dataset.skillId;
        slot.title = '空裝備格';
      }
    });
  }

  function renderSkillLink() {
    const link = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.currentSkillLink()
      : [];
    const lockImg = 'images/UIskillboard/skill_slot_lock.png';
    $('skbSkillLinkSlots')?.querySelectorAll('.skb-link-slot').forEach((slot) => {
      const idx = Number(slot.dataset.linkSlot);
      const unlocked = typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.isSkillLinkSlotUnlocked(idx)
        : true;
      const need = typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.skillLinkSlotRequiredLevel(idx)
        : 10;
      slot.classList.toggle('is-locked', !unlocked);
      slot.classList.toggle('is-drop-target', false);

      if (!unlocked) {
        slot.classList.remove('is-filled');
        delete slot.dataset.skillId;
        slot.innerHTML = `<img class="skb-link-slot-lock" src="${lockImg}" alt="" draggable="false" decoding="async">`;
        slot.title = `${need} 等解鎖`;
        return;
      }

      const skillId = link[idx];
      const skill = skillId && typeof SkillCatalog !== 'undefined'
        ? SkillCatalog.getSkill(skillId)
        : null;
      slot.classList.toggle('is-filled', !!skill);
      slot.innerHTML = skill ? iconHtml(skill, 'equip') : '';
      if (skill) {
        slot.dataset.skillId = String(skill.id);
        const hint = idx === 0 ? '主導延遲' : '無後搖';
        slot.title = `${skill.name}（${hint}｜點擊卸下）`;
      } else {
        delete slot.dataset.skillId;
        slot.title = idx === 0
          ? '連鎖 1：主導動作與延遲（拖曳無 CD 主動技）；可秒殺時依攻擊隻數錯開目標'
          : `連鎖 ${idx + 1}：無後搖（拖曳無 CD 主動技）；可秒殺時接續下一批，否則集中同一怪`;
      }
    });
  }

  function renderTypeTabs() {
    const jobId = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.currentJobId()
      : 100;
    const counts = typeof SkillCatalog !== 'undefined'
      ? SkillCatalog.countByType(jobId, ui.activeRank)
      : { active: 0, buff: 0, passive: 0 };
    $('skbTypeTabs')?.querySelectorAll('.skb-type-tab').forEach((btn) => {
      const type = btn.dataset.type;
      btn.classList.toggle('is-active', type === ui.activeType);
      btn.setAttribute('aria-selected', type === ui.activeType ? 'true' : 'false');
      const badge = btn.querySelector('[data-type-count]');
      if (badge) badge.textContent = String(counts[type] || 0);
    });
  }

  function renderSp() {
    const el = $('skbSpValue');
    if (!el) return;
    const rank = ui.activeRank;
    const remain = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getSpRemaining(rank)
      : 0;
    const total = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getSpTotal(rank)
      : 0;
    el.textContent = String(Math.max(0, remain | 0));
    el.title = total > 0
      ? `${rank} 階：剩餘 ${remain} / 累計 ${total}`
      : '10 等起依等級區間獲得對應階段技能點';
  }

  function renderSkillList() {
    const list = $('skbSkillList');
    if (!list) return;
    const skills = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getPanelSkills(ui.activeRank, ui.activeType)
      : [];
    if (!skills.length) {
      const lv = typeof CharacterProgression !== 'undefined'
        ? (CharacterProgression.getState?.().level || 1)
        : 1;
      const rankLocked = typeof CharacterSkills !== 'undefined'
        && !CharacterSkills.isRankUnlocked?.(ui.activeRank);
      if (rankLocked) {
        const need = typeof SkillPoints !== 'undefined'
          ? SkillPoints.rankRequiredLevel(ui.activeRank)
          : 10;
        list.innerHTML = `<div class="skb-skill-empty">${need} 等解鎖此階段技能</div>`;
        return;
      }
      if (lv < 10) {
        list.innerHTML = '<div class="skb-skill-empty">10 等起獲得技能點並學習技能</div>';
        return;
      }
      list.innerHTML = '<div class="skb-skill-empty">此分類尚無技能</div>';
      return;
    }

    const rankSp = typeof CharacterSkills !== 'undefined'
      ? CharacterSkills.getSpRemaining(ui.activeRank)
      : 0;

    list.innerHTML = skills.map((skill) => {
      const lv = Math.max(0, Number(skill.level) || 0);
      const unlocked = skill.unlocked !== false;
      const maxed = lv >= skill.maxLevel;
      const equipped = typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.isEquipped(skill.id)
        : false;
      const linked = typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.isInSkillLink?.(skill.id)
        : false;
      const canLink = typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.canPlaceInSkillLink?.(skill.id)
        : false;
      const noCdAtk = typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.isNoCdActiveAttackSkill?.(skill.id)
        : false;
      const isFollowup = typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.isAddAttackFollowup?.(skill.id)
        : false;
      const isSuperseded = typeof CharacterSkills !== 'undefined'
        ? CharacterSkills.isSkillSuperseded?.(skill.id)
        : false;
      const showEquip = skill.equipable === true && !isFollowup && !isSuperseded;
      const req = typeof SkillPoints !== 'undefined'
        ? SkillPoints.skillReqLevel(skill)
        : 0;
      const lockHint = !unlocked && req > 0 ? `Lv.${req} 解鎖` : '';
      const noSp = unlocked && !maxed && rankSp <= 0;
      const equipLabel = noCdAtk
        ? (equipped ? '自技能連鎖卸下' : '裝備至技能連鎖')
        : (equipped ? '卸下' : '裝備');
      const followHint = isFollowup ? '接技後續：由頭技自動施放，不可裝備／連鎖' : '';
      const replacedHint = isSuperseded ? '已被強化技取代，不可同時使用' : '';
      return `
        <div class="skb-skill-row${unlocked ? '' : ' is-skill-locked'}" data-skill-id="${skill.id}">
          <div class="skb-skill-icon-frame${canLink ? ' is-draggable' : ''}"
            ${canLink ? `draggable="true" data-drag-skill="${skill.id}" title="拖曳至技能連鎖"` : ''}>
            ${iconHtml(skill, 'skill')}
          </div>
          <div class="skb-skill-name">${skill.name}${lockHint ? `<span class="skb-skill-req">${lockHint}</span>` : ''}${followHint ? `<span class="skb-skill-req" title="${followHint}">接技</span>` : ''}${replacedHint ? `<span class="skb-skill-req" title="${replacedHint}">已取代</span>` : ''}</div>
          <div class="skb-skill-lv">${lv}</div>
          <div class="skb-skill-max">${skill.maxLevel}</div>
          ${equipped ? '<div class="skb-skill-equipped" aria-label="裝備中"></div>' : ''}
          ${linked ? '<div class="skb-skill-linked" aria-label="連鎖中" title="技能連鎖中"></div>' : ''}
          <div class="skb-skill-actions">
            ${showEquip ? `<button type="button" class="skb-btn-equip" data-action="equip" data-skill-id="${skill.id}" aria-label="${equipLabel} ${skill.name}" title="${equipLabel}" ${!unlocked || lv <= 0 ? 'disabled' : ''}></button>` : ''}
            <button type="button" class="skb-btn-levelup ${maxed ? 'is-max' : ''}" data-action="levelup" data-skill-id="${skill.id}" aria-label="升級 ${skill.name}" ${maxed || !unlocked || noSp ? 'disabled' : ''}></button>
          </div>
        </div>
      `;
    }).join('');
  }

  function render() {
    ensureState();
    if (typeof SkillTooltip !== 'undefined') SkillTooltip.hide?.();
    renderJobLabel();
    renderRankTabs();
    renderPresets();
    renderEquipGrid();
    renderSkillLink();
    renderTypeTabs();
    renderSp();
    renderSkillList();
  }

  function bindDrag() {
    const root = $('skbRoot');
    if (!root || typeof PanelDrag === 'undefined') return;
    PanelDrag.enable(root, {
      handle: '#skbDragHandle',
      storageKey: 'ui.drag.skillBoard',
      title: '拖曳視窗',
    });
  }

  function bind() {
    $('btnViewSkill')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(!open);
    });
    $('skbClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });

    $('skbRankTabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.skb-rank-tab');
      if (!btn) return;
      const rank = btn.dataset.rank;
      if (LOCKED_RANKS.has(rank)) return;
      if (typeof CharacterSkills !== 'undefined' && !CharacterSkills.isRankUnlocked?.(rank)) return;
      ui.activeRank = rank;
      render();
    });

    $('skbPresets')?.addEventListener('click', (e) => {
      const setBtn = e.target.closest('#skbPresetSet');
      if (setBtn) {
        e.stopPropagation();
        const pop = $('skbSettingsPop');
        if (!pop) return;
        const nextHidden = !pop.hidden;
        pop.hidden = nextHidden;
        if (!nextHidden) {
          const cb = $('skbShowStackBuffs');
          if (cb && typeof SkillModifiers !== 'undefined') {
            cb.checked = SkillModifiers.getShowStackBuffCounts?.() !== false;
          }
        }
        return;
      }
      const btn = e.target.closest('.skb-preset-btn');
      if (!btn) return;
      CharacterSkills.setActivePreset(Number(btn.dataset.preset) || 1);
      render();
    });

    $('skbShowStackBuffs')?.addEventListener('change', (e) => {
      if (typeof SkillModifiers === 'undefined') return;
      SkillModifiers.setShowStackBuffCounts?.(!!e.target.checked);
      if (typeof IdleHunt !== 'undefined') IdleHunt.syncHuntOverlayBars?.();
      if (typeof IdleBoss !== 'undefined') IdleBoss.syncBossOverlayBars?.();
    });

    document.addEventListener('click', (e) => {
      const pop = $('skbSettingsPop');
      if (!pop || pop.hidden) return;
      if (e.target.closest('#skbSettingsPop') || e.target.closest('#skbPresetSet')) return;
      pop.hidden = true;
    });

    $('skbTypeTabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.skb-type-tab');
      if (!btn) return;
      ui.activeType = btn.dataset.type || 'active';
      render();
    });

    $('skbEquipGrid')?.addEventListener('click', (e) => {
      const slot = e.target.closest('.skb-equip-slot');
      if (!slot) return;
      CharacterSkills.unequipSlot(Number(slot.dataset.slot));
      render();
    });

    $('skbSkillLinkSlots')?.addEventListener('click', (e) => {
      const slot = e.target.closest('.skb-link-slot');
      if (!slot || slot.classList.contains('is-locked') || !slot.classList.contains('is-filled')) return;
      CharacterSkills.clearSkillLinkSlot(Number(slot.dataset.linkSlot));
      render();
    });

    // 右欄 icon → 技能連鎖拖曳
    $('skbSkillList')?.addEventListener('dragstart', (e) => {
      const handle = e.target.closest('[data-drag-skill]');
      if (!handle) {
        e.preventDefault();
        return;
      }
      const id = handle.dataset.dragSkill;
      if (!id || !CharacterSkills.canPlaceInSkillLink?.(id)) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.setData('application/x-skb-skill-link', id);
      e.dataTransfer.effectAllowed = 'copy';
      handle.classList.add('is-dragging');
      $('skbSkillLink')?.classList.add('is-drag-over-host');
    });
    $('skbSkillList')?.addEventListener('dragend', (e) => {
      e.target.closest('[data-drag-skill]')?.classList.remove('is-dragging');
      $('skbSkillLink')?.classList.remove('is-drag-over-host');
      $('skbSkillLinkSlots')?.querySelectorAll('.skb-link-slot.is-drop-target')
        .forEach((el) => el.classList.remove('is-drop-target'));
    });

    const linkHost = $('skbSkillLink');
    linkHost?.addEventListener('dragover', (e) => {
      const slot = e.target.closest('.skb-link-slot');
      if (!slot || slot.classList.contains('is-locked')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      $('skbSkillLinkSlots')?.querySelectorAll('.skb-link-slot')
        .forEach((el) => el.classList.toggle('is-drop-target', el === slot));
    });
    linkHost?.addEventListener('dragleave', (e) => {
      const related = e.relatedTarget;
      if (related && linkHost.contains(related)) return;
      $('skbSkillLinkSlots')?.querySelectorAll('.skb-link-slot.is-drop-target')
        .forEach((el) => el.classList.remove('is-drop-target'));
    });
    linkHost?.addEventListener('drop', (e) => {
      e.preventDefault();
      const slot = e.target.closest('.skb-link-slot');
      $('skbSkillLink')?.classList.remove('is-drag-over-host');
      $('skbSkillLinkSlots')?.querySelectorAll('.skb-link-slot.is-drop-target')
        .forEach((el) => el.classList.remove('is-drop-target'));
      if (!slot || slot.classList.contains('is-locked')) return;
      const id = e.dataTransfer.getData('application/x-skb-skill-link')
        || e.dataTransfer.getData('text/plain');
      if (!id) return;
      if (!CharacterSkills.setSkillLinkSlot(Number(slot.dataset.linkSlot), id)) {
        slot.classList.add('is-reject');
        window.setTimeout(() => slot.classList.remove('is-reject'), 320);
        return;
      }
      render();
    });

    $('skbSkillList')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const skillId = btn.dataset.skillId;
      if (btn.dataset.action === 'equip') CharacterSkills.toggleEquip(skillId);
      if (btn.dataset.action === 'levelup') CharacterSkills.levelUp(skillId);
      render();
    });

    $('skbSkillList')?.addEventListener('mouseover', (e) => {
      const row = e.target.closest('.skb-skill-row');
      if (!row || !$('skbSkillList')?.contains(row)) return;
      if (typeof SkillTooltip === 'undefined') return;
      const id = row.dataset.skillId;
      if (!id) return;
      if (SkillTooltip.isShowingFor?.(row)) return;
      SkillTooltip.show(row, id);
    });
    $('skbSkillList')?.addEventListener('mouseout', (e) => {
      const row = e.target.closest('.skb-skill-row');
      if (!row) return;
      const related = e.relatedTarget;
      if (related && row.contains(related)) return;
      if (typeof SkillTooltip !== 'undefined') SkillTooltip.hideSoon?.(60);
    });

    $('skbEquipGrid')?.addEventListener('mouseover', (e) => {
      const slot = e.target.closest('.skb-equip-slot');
      if (!slot || !$('skbEquipGrid')?.contains(slot)) return;
      const id = slot.dataset.skillId;
      if (!id || typeof SkillTooltip === 'undefined') return;
      if (SkillTooltip.isShowingFor?.(slot)) return;
      SkillTooltip.show(slot, id);
    });
    $('skbEquipGrid')?.addEventListener('mouseout', (e) => {
      const slot = e.target.closest('.skb-equip-slot');
      if (!slot) return;
      const related = e.relatedTarget;
      if (related && slot.contains(related)) return;
      if (typeof SkillTooltip !== 'undefined') SkillTooltip.hideSoon?.(60);
    });

    $('skbSkillLinkSlots')?.addEventListener('mouseover', (e) => {
      const slot = e.target.closest('.skb-link-slot');
      if (!slot || !$('skbSkillLinkSlots')?.contains(slot)) return;
      const id = slot.dataset.skillId;
      if (!id || typeof SkillTooltip === 'undefined') return;
      if (SkillTooltip.isShowingFor?.(slot)) return;
      SkillTooltip.show(slot, id);
    });
    $('skbSkillLinkSlots')?.addEventListener('mouseout', (e) => {
      const slot = e.target.closest('.skb-link-slot');
      if (!slot) return;
      const related = e.relatedTarget;
      if (related && slot.contains(related)) return;
      if (typeof SkillTooltip !== 'undefined') SkillTooltip.hideSoon?.(60);
    });

    $('skbSpReset')?.addEventListener('click', (e) => {
      e.preventDefault();
      CharacterSkills.resetSkillPoints(ui.activeRank);
      render();
    });

    window.addEventListener('resize', () => {
      if (open) fitScale();
    });

    bindDrag();
  }

  function init() {
    if (inited) return;
    if (typeof SkillCatalog === 'undefined' || typeof CharacterSkills === 'undefined') {
      console.warn('[SkillBoardPanel] SkillCatalog / CharacterSkills missing');
      return;
    }
    ensureDom();
    ensureState();
    inited = true;
    bind();
    setOpen(false);
  }

  return {
    init,
    setOpen,
    toggle() { setOpen(!open); },
    isOpen() { return open; },
    refresh: render,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillBoardPanel = SkillBoardPanel;
  document.addEventListener('DOMContentLoaded', () => {
    SkillBoardPanel.init();
  });
}
