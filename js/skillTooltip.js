/**
 * 技能面板 Tooltip — 外框沿用 EQUIP_TOOLTIP_ASSETS（eq-tooltip）
 */
const SkillTooltip = (() => {
  const ROOT_ID = 'skbSkillTooltip';
  let token = 0;
  let hideTimer = null;
  let currentAnchor = null;

  function $(id) {
    return document.getElementById(id);
  }

  function ensureRoot() {
    let el = $(ROOT_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = ROOT_ID;
    el.className = 'eq-tooltip skb-skill-tooltip hidden';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    return el;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function formatText(template, common, level) {
    if (typeof SkillFormula !== 'undefined' && typeof SkillFormula.formatSkillText === 'function') {
      return SkillFormula.formatSkillText(template, common, level);
    }
    return escapeHtml(template).replace(/\r\n|\n|\r/g, '<br>');
  }

  function typeLabel(type) {
    const map = { active: '主動', buff: '增益', passive: '被動', summon: '召喚' };
    return map[String(type || '')] || String(type || '');
  }

  function cooltimeSec(common, level) {
    if (typeof SkillFormula === 'undefined') return 0;
    return Math.max(0, SkillFormula.resolveCooltimeSec?.(common, level) || 0);
  }

  function panelCommon(skill, level) {
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.resolvePanelCommon === 'function') {
      return SkillModifiers.resolvePanelCommon(skill, level);
    }
    return skill?.common || {};
  }

  function buildHtml(skill, level) {
    const assets = (typeof EQUIP_TOOLTIP_ASSETS !== 'undefined' && EQUIP_TOOLTIP_ASSETS) || {};
    const frame = assets.equipFrame || {};
    const itemIcon = assets.itemIcon || {};
    const line = frame.line || (assets.frame && assets.frame.dotline) || '';
    const topBg = frame.top ? ` style="background-image:url('${frame.top}')"` : '';
    const midBg = frame.mid ? ` style="background-image:url('${frame.mid}')"` : '';
    const btmBg = frame.btm ? ` style="background-image:url('${frame.btm}')"` : '';
    const lineStyle = line ? ` style="background-image:url('${line}')"` : '';
    const baseSrc = itemIcon.base || '';
    const shadeSrc = itemIcon.shade || '';

    const name = escapeHtml(skill.name || '技能');
    const iconRaw = skill.icon || (typeof SkillCatalog !== 'undefined' ? SkillCatalog.iconUrl?.(skill) : '') || '';
    const iconSrc = String(iconRaw).replace(/"/g, '&quot;');
    const maxLv = Math.max(1, Number(skill.maxLevel) || 1);
    const lv = Math.max(0, Math.min(maxLv, Math.floor(Number(level) || 0)));
    const previewLv = Math.max(1, lv || 1);

    const descHtml = formatText(skill.desc || '（尚無技能說明）', panelCommon(skill, previewLv), previewLv);

    let effectBlocks = '';
    if (lv <= 0) {
      effectBlocks += `
        <div class="skb-tip-lv-label">尚未學習</div>
        <div class="skb-tip-lv-label">下一等級 [1]</div>
        <div class="skb-tip-effect">${formatText(skill.h || '', panelCommon(skill, 1), 1)}</div>
      `;
    } else {
      effectBlocks += `
        <div class="skb-tip-lv-label">目前等級 [${lv}]</div>
        <div class="skb-tip-effect">${formatText(skill.h || '', panelCommon(skill, lv), lv)}</div>
      `;
      if (lv < maxLv) {
        effectBlocks += `
          <div class="skb-tip-lv-label">下一等級 [${lv + 1}]</div>
          <div class="skb-tip-effect">${formatText(skill.h || '', panelCommon(skill, lv + 1), lv + 1)}</div>
        `;
      }
    }

    const meta = [];
    if (skill.type) meta.push(typeLabel(skill.type));
    const cd = (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.resolveCastCommon === 'function')
      ? (SkillModifiers.resolveCastCommon(skill, previewLv)?.cooltimeSec || 0)
      : cooltimeSec(skill.common || {}, previewLv);
    if (cd > 0) meta.push(`冷卻 ${formatNum(cd)}秒`);
    if (skill.equipable) meta.push('可裝備');
    if (Number(skill.hyper) === 1) meta.push('超技能強化');
    if (Number(skill.hyper) === 2) meta.push('超技能');

    return `
      <div class="eq-tooltip-frame skb-tip-frame">
        <div class="eq-tooltip-frame-top"${topBg}></div>
        <div class="eq-tooltip-mid-wrap">
          <div class="eq-tooltip-frame-mid"${midBg}></div>
          <div class="eq-tooltip-body">
            <div class="eq-tooltip-content">
              <div class="eq-tip-name-row">
                <div class="eq-tip-name">${name}</div>
              </div>
              <div class="eq-tip-dotline"${lineStyle}></div>
              <div class="skb-tip-main">
                <div class="eq-tip-icon-wrap">
                  ${baseSrc ? `<img class="eq-tip-icon-base" src="${baseSrc}" alt="">` : ''}
                  ${shadeSrc ? `<img class="eq-tip-icon-shade" src="${shadeSrc}" alt="">` : ''}
                  ${iconSrc ? `<img class="eq-tip-icon skb-tip-icon" src="${iconSrc}" alt="">` : ''}
                </div>
                <div class="skb-tip-desc">${descHtml}</div>
              </div>
              <div class="eq-tip-dotline"${lineStyle}></div>
              <div class="skb-tip-effects">${effectBlocks}</div>
              ${meta.length ? `<div class="skb-tip-meta">${escapeHtml(meta.join(' · '))}</div>` : ''}
            </div>
          </div>
        </div>
        <div class="eq-tooltip-frame-btm"${btmBg}></div>
      </div>
    `;
  }

  function formatNum(n) {
    if (typeof SkillFormula !== 'undefined' && SkillFormula.formatPlaceholderNumber) {
      return SkillFormula.formatPlaceholderNumber(n);
    }
    return String(n);
  }

  function place(anchorEl) {
    const tip = $(ROOT_ID);
    if (!tip || !anchorEl?.isConnected) return;
    const rect = anchorEl.getBoundingClientRect();
    const tipW = tip.offsetWidth || 280;
    const tipH = tip.offsetHeight || 160;
    let left = rect.right + 8;
    let top = rect.top;
    if (left + tipW > window.innerWidth - 8) left = Math.max(8, rect.left - tipW - 8);
    if (top + tipH > window.innerHeight - 8) top = Math.max(8, window.innerHeight - tipH - 8);
    if (top < 8) top = 8;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function clearHideTimer() {
    if (hideTimer != null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function hide() {
    if (typeof HoverTooltipGuard !== 'undefined') HoverTooltipGuard.unwatch('skill');
    clearHideTimer();
    currentAnchor = null;
    token += 1;
    const tip = $(ROOT_ID);
    if (!tip) return;
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
    tip.innerHTML = '';
  }

  function hideSoon(delayMs = 80) {
    clearHideTimer();
    hideTimer = window.setTimeout(() => {
      hideTimer = null;
      hide();
    }, delayMs);
  }

  function show(anchorEl, skillId) {
    clearHideTimer();
    if (!anchorEl || skillId == null) return;
    if (typeof SkillCatalog === 'undefined') return;
    const skill = SkillCatalog.getSkill(skillId);
    if (!skill) return;

    const level = (typeof CharacterSkills !== 'undefined')
      ? (CharacterSkills.getLevel?.(skillId) || 0)
      : 0;

    const tip = ensureRoot();
    token += 1;
    const myToken = token;
    currentAnchor = anchorEl;
    if (typeof HoverTooltipGuard !== 'undefined') {
      HoverTooltipGuard.watch('skill', anchorEl, { hide });
    }
    tip.innerHTML = buildHtml(skill, level);
    tip.classList.remove('hidden');
    tip.setAttribute('aria-hidden', 'false');
    place(anchorEl);

    const iconEl = tip.querySelector('.skb-tip-icon');
    if (iconEl) {
      const applyScale = () => {
        if (myToken !== token) return;
        if (!iconEl.naturalWidth) return;
        iconEl.style.width = `${Math.round(iconEl.naturalWidth * 2)}px`;
        iconEl.style.height = `${Math.round(iconEl.naturalHeight * 2)}px`;
        place(anchorEl);
      };
      if (iconEl.complete) applyScale();
      else iconEl.addEventListener('load', applyScale, { once: true });
    }
  }

  function isShowingFor(anchorEl) {
    return !!currentAnchor && currentAnchor === anchorEl;
  }

  return {
    show,
    hide,
    hideSoon,
    isShowingFor,
    buildHtml,
    formatText,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillTooltip = SkillTooltip;
}
