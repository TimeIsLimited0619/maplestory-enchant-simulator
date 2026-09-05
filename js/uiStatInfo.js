/**
 * Addon:statInfo — 顯示單一能力值各來源拆解
 * 座標：UI.UICharacterInfo.img.xml local/detailStat/Addon:statInfo
 */
const UiStatInfo = (() => {
  let inited = false;
  let open = false;
  let activeStatId = null;
  let activeTitle = '';

  function $(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatVal(n, isPercent, opts = {}) {
    const v = Number(n) || 0;
    const rounded = Math.round(v * 100) / 100;
    const body = Number.isInteger(rounded)
      ? rounded.toLocaleString('en-US')
      : rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const sign = !opts.noSign && rounded > 0 ? '+' : '';
    return `${sign}${body}${isPercent ? '%' : ''}`;
  }

  function ensureDom(host) {
    if ($('uciStatInfoRoot')) return;
    const root = document.createElement('div');
    root.id = 'uciStatInfoRoot';
    root.className = 'uci-stat-info is-hidden';
    root.setAttribute('aria-label', '能力值資訊');
    root.innerHTML = `
      <button type="button" class="uci-stat-info-close" id="uciStatInfoClose" aria-label="關閉"></button>
      <div class="uci-stat-info-title" id="uciStatInfoTitle"></div>
      <div class="uci-stat-info-scroll" id="uciStatInfoScroll">
        <div class="uci-stat-info-list" id="uciStatInfoList"></div>
      </div>
    `;
    (host || document.body).appendChild(root);
  }

  function pushRow(rows, kind, label, value, isPercent) {
    const n = Number(value) || 0;
    if (!n && kind !== 'current') return;
    // 列圖已含固定標籤時僅 current／彙總列用；其餘來源列用 is-desc 自訂標籤
    rows.push({ kind, label, value: n, isPercent: !!isPercent });
  }

  /** 依能力值 key 組來源列 */
  function buildRows(statKey, snapshot, combat, totalDisplay, opts = {}) {
    const rows = [];
    const percent = !!opts.percent;
    const key = statKey;

    pushRow(rows, 'current', '現在數值', totalDisplay, percent);

    const main = snapshot?.mainTotals?.[key];
    if (main) {
      pushRow(rows, 'desc', '基礎', main.base, false);
      pushRow(rows, 'desc', '星力', main.star, false);
      pushRow(rows, 'desc', '卷軸', main.scroll, false);
      pushRow(rows, 'desc', '星火', main.bonus, false);
      pushRow(rows, 'desc', '套裝', main.set, false);
    }

    const ex = Number(snapshot?.exceptionalTotals?.[key]) || 0;
    pushRow(rows, 'desc', '卓越', ex, percent);

    if (key === '攻擊力') {
      pushRow(rows, 'desc', '靈魂', snapshot?.soulFlat?.['攻擊力'], false);
    }
    if (key === '魔法攻擊力') {
      pushRow(rows, 'desc', '靈魂', snapshot?.soulFlat?.['魔法攻擊力'], false);
    }

    const DEFAULT_POT_ALIASES = {
      STR: ['STR', 'STR%', '力量', '力量%', '全屬性', '全屬性%'],
      DEX: ['DEX', 'DEX%', '敏捷', '敏捷%', '全屬性', '全屬性%'],
      INT: ['INT', 'INT%', '智力', '智力%', '全屬性', '全屬性%'],
      LUK: ['LUK', 'LUK%', '幸運', '幸運%', '全屬性', '全屬性%'],
      攻擊力: ['攻擊力', '攻擊力%', '物理攻擊力', '物理攻擊力%'],
      魔法攻擊力: ['魔法攻擊力', '魔法攻擊力%', '攻擊力', '攻擊力%'],
      最大HP: ['最大HP', '最大HP%', 'MaxHP', 'MaxHP%', 'HP', 'HP%'],
      最大MP: ['最大MP', '最大MP%', 'MaxMP', 'MaxMP%', 'MP', 'MP%'],
      傷害: ['傷害', '傷害%', '總傷害', '總傷害%'],
      BOSS怪物傷害: ['BOSS怪物傷害', 'BOSS怪物傷害%', 'Boss怪物傷害', 'BOSS傷害'],
      爆擊機率: ['爆擊機率', '爆擊機率%', '爆擊率'],
      爆擊傷害: ['爆擊傷害', '爆擊傷害%'],
      全屬性: ['全屬性', '全屬性%'],
    };
    const potKeys = opts.aliases || DEFAULT_POT_ALIASES[key] || [key, `${key}%`];
    potKeys.forEach((k) => {
      const pm = snapshot?.potMain?.[k];
      const pa = snapshot?.potAdd?.[k];
      const isPct = (pot) => !!(pot && (pot.suffix === '%' || k.endsWith('%')));
      const potLabel = (prefix, pot) => {
        const base = String(k).replace(/%$/, '');
        return isPct(pot) ? `${prefix} · ${base}%` : `${prefix} · ${base}`;
      };
      if (pm?.value) {
        pushRow(rows, 'desc', potLabel('主潛能', pm), pm.value, isPct(pm));
      }
      if (pa?.value) {
        pushRow(rows, 'desc', potLabel('附潛', pa), pa.value, isPct(pa));
      }
    });

    const extraKeys = [key, `${key}%`];
    if (key === 'STR' || key === 'DEX' || key === 'INT' || key === 'LUK') {
      extraKeys.push('全屬性', '全屬性%');
    }
    if (key === '最大HP') extraKeys.push('MaxHP', 'MaxHP%', 'HP', 'HP%');
    if (key === '最大MP') extraKeys.push('MaxMP', 'MaxMP%', 'MP', 'MP%');
    const seenExtra = new Set();
    extraKeys.forEach((ek) => {
      const extra = snapshot?.extraTotals?.[ek];
      if (!extra || seenExtra.has(ek)) return;
      seenExtra.add(ek);
      const isPct = !!extra.isPercent || String(ek).endsWith('%');
      const label = (key === 'STR' || key === 'DEX' || key === 'INT' || key === 'LUK')
        && (ek === '全屬性' || ek === '全屬性%')
        ? (isPct ? '裝備 · 全屬性%' : '裝備 · 全屬性')
        : '裝備額外';
      pushRow(rows, 'desc', label, extra.total, isPct);
    });

    const soulKeys = [key];
    if (key === '最大HP') soulKeys.push('MaxHP', 'HP');
    if (key === '最大MP') soulKeys.push('MaxMP', 'MP');
    if (key === 'STR' || key === 'DEX' || key === 'INT' || key === 'LUK') {
      soulKeys.push('全屬性', '全屬性%');
    }
    const seenSoul = new Set();
    soulKeys.forEach((soulKey) => {
      if (snapshot?.soulOptions?.[soulKey] == null || seenSoul.has(soulKey)) return;
      seenSoul.add(soulKey);
      const soul = snapshot.soulOptions[soulKey];
      const meta = snapshot?.soulOptionMeta?.[soulKey];
      const isPct = meta === '%' || String(soulKey).endsWith('%');
      const label = (soulKey === '全屬性' || soulKey === '全屬性%')
        ? (isPct ? '靈魂 · 全屬性%' : '靈魂 · 全屬性')
        : '靈魂選項';
      pushRow(rows, 'desc', label, soul, isPct);
    });

    if (key === '無視防禦率' && snapshot?.iedSources?.length) {
      snapshot.iedSources.forEach((src) => {
        const label = [src.kind, src.name].filter(Boolean).join(' · ') || '來源';
        pushRow(rows, 'desc', label, src.value, true);
      });
    }

    if (key === '最終傷害' && typeof UiCharacterInfo !== 'undefined'
      && typeof UiCharacterInfo.collectFinalDamageSources === 'function') {
      UiCharacterInfo.collectFinalDamageSources(snapshot, combat).forEach((src) => {
        pushRow(rows, 'desc', src.name, src.value, true);
      });
    }

    if (key === '攻擊速度') {
      if (typeof WeaponTypeMap !== 'undefined') {
        const jobName = typeof CharacterCombatPanel !== 'undefined'
          ? CharacterCombatPanel.getState?.()?.jobName
          : '';
        const getWorn = typeof UiEquipModule !== 'undefined'
          ? (slotId) => UiEquipModule.getWornEntry?.(slotId)
          : null;
        const wzBase = WeaponTypeMap.getEquippedWzAttackSpeed?.(getWorn, jobName)
          || WeaponTypeMap.DEFAULT_WZ_ATTACK_SPEED || 6;
        pushRow(rows, 'desc', '武器 WZ', wzBase, false);
        const mod = Number(WeaponTypeMap.getSpeedModifiers?.()) || 0;
        if (mod !== 0) {
          pushRow(rows, 'desc', '技能 WZ 加減', mod, false);
        }
        const stage = WeaponTypeMap.calculateAttackSpeedStage?.(wzBase, mod)
          ?? Math.min(8, Math.max(1, 10 - (wzBase + mod)));
        pushRow(rows, 'desc', '面板階段', stage, false);
      }
      return rows;
    }

    let mapleFlat = 0;
    if (typeof CharacterProgression !== 'undefined') {
      const bonus = CharacterProgression.getCombatBonus?.() || {};
      const apKey = { STR: 'str', DEX: 'dex', INT: 'int', LUK: 'luk' }[key];
      if (apKey) {
        const ap = CharacterProgression.apStat?.(apKey) || CharacterProgression.AP_BASE_STAT || 0;
        pushRow(rows, 'desc', 'AP／基礎', ap, false);
        const invested = Number(CharacterProgression.getState?.()?.ap?.[apKey]) || 0;
        const maplePct = typeof SkillModifiers !== 'undefined'
          ? Number(SkillModifiers.getPassiveTotals?.()?.basicStatUp) || 0
          : 0;
        if (maplePct > 0 && invested > 0) {
          mapleFlat = Math.floor((invested * maplePct) / 100);
          pushRow(rows, 'desc', `楓葉祝福（AP+${maplePct}%）`, mapleFlat, false);
        }
        const hyperLv = CharacterProgression.getState()?.hyper?.[apKey] || 0;
        pushRow(rows, 'desc', '極限屬性', CharacterProgression.hyperBonusAt?.(apKey, hyperLv), false);
      }
      if (key === '最大HP') {
        const level = Math.max(1, Number(CharacterProgression.getState?.()?.level) || 1);
        const levelBase = typeof CharacterProgression.getLevelBaseHp === 'function'
          ? CharacterProgression.getLevelBaseHp(level)
          : (50 + Math.max(0, level - 1) * 12);
        pushRow(rows, 'desc', '角色基礎', levelBase, false);
        pushRow(rows, 'desc', '角色加成', bonus.hp, false);
        pushRow(rows, 'desc', '角色 HP%', bonus.hpPercent, true);
      }
      if (key === '最大MP') {
        pushRow(rows, 'desc', '角色加成', bonus.mp, false);
        pushRow(rows, 'desc', '角色 MP%', bonus.mpPercent, true);
      }
    }

    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
      const mods = SkillModifiers.getTotals();
      const flatKey = SkillModifiers.flatStatKey?.(key);
      if (flatKey) {
        // getTotals 已含楓葉祝福 flat；上方已單列則扣除避免重複
        const skillFlat = Math.max(0, (Number(mods[flatKey]) || 0) - mapleFlat);
        pushRow(rows, 'desc', '技能', skillFlat, false);
      }
      if (key === '攻擊力' || key === '魔法攻擊力') {
        pushRow(rows, 'desc', '技能攻魔', mods.flatPad, false);
      }
      if (key === '傷害') pushRow(rows, 'desc', '技能傷害', mods.damR, true);
      if (key === 'BOSS怪物傷害') pushRow(rows, 'desc', '技能 B傷', mods.bdR, true);
      if (key === '爆擊機率') pushRow(rows, 'desc', '技能爆擊', mods.critRate, true);
      if (key === '爆擊傷害') pushRow(rows, 'desc', '技能爆傷', mods.critDmg, true);
      if (key === '無視防禦率') pushRow(rows, 'desc', '技能無視', mods.ied, true);
      if (key === '防禦力') {
        pushRow(rows, 'desc', '技能防禦', mods.flatPdd, false);
        pushRow(rows, 'desc', '技能傷害減少', mods.damAbsorbPct, true);
      }
      if (key === '最大HP') {
        const level = Math.max(1, Number(CharacterProgression?.getState?.()?.level) || 1);
        pushRow(rows, 'desc', '技能 HP', (Number(mods.flatHpPerLevel) || 0) * level, false);
        pushRow(rows, 'desc', '技能 HP%', mods.mhpR, true);
      }
    }

    if (rows.length <= 1) {
      pushRow(rows, 'standard', '基本數值', totalDisplay, percent);
    }
    return rows;
  }

  function rowClass(kind) {
    if (kind === 'current') return 'is-current';
    if (kind === 'current1') return 'is-current1';
    if (kind === 'standard') return 'is-standard';
    if (kind === 'percent') return 'is-percent';
    if (kind === 'extra') return 'is-extra';
    return 'is-desc';
  }

  /** 列圖已含標籤的類型：只顯示右側數值 */
  function hasBakedLabel(kind) {
    return kind === 'current' || kind === 'current1'
      || kind === 'standard' || kind === 'percent' || kind === 'extra';
  }

  function render(rows) {
    const list = $('uciStatInfoList');
    const title = $('uciStatInfoTitle');
    if (title) title.textContent = activeTitle || '';
    if (!list) return;
    list.innerHTML = rows.map((row) => {
      const baked = hasBakedLabel(row.kind);
      const val = formatVal(row.value, row.isPercent, { noSign: row.kind === 'current' });
      return `
      <div class="uci-stat-info-row ${rowClass(row.kind)}">
        ${baked ? '' : `<span class="uci-stat-info-k">${esc(row.label)}</span>`}
        <span class="uci-stat-info-v">${esc(val)}</span>
      </div>`;
    }).join('');
    list.style.height = '';
    const scroll = $('uciStatInfoScroll');
    if (scroll) scroll.scrollTop = 0;
  }

  function openFor(stat, snapshot, combat, totalValue) {
    activeStatId = stat?.id ?? null;
    activeTitle = stat?.title || stat?.key || '';
    const rows = buildRows(stat.key, snapshot, combat, totalValue, {
      percent: !!stat.percent,
      aliases: stat.aliases,
    });
    setOpen(true);
    render(rows);
    document.querySelectorAll('.uci-stat-hit').forEach((el) => {
      el.classList.toggle('is-active', Number(el.dataset.statId) === activeStatId);
    });
  }

  function setOpen(next) {
    open = !!next;
    $('uciStatInfoRoot')?.classList.toggle('is-hidden', !open);
    if (!open) {
      activeStatId = null;
      document.querySelectorAll('.uci-stat-hit.is-active').forEach((el) => {
        el.classList.remove('is-active');
      });
    }
  }

  function bind() {
    $('uciStatInfoClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
  }

  function init(host) {
    if (inited) return;
    ensureDom(host);
    inited = true;
    bind();
    setOpen(false);
  }

  return {
    init,
    openFor,
    setOpen,
    toggleClose() { setOpen(false); },
    isOpen: () => open,
    activeStatId: () => activeStatId,
  };
})();

if (typeof window !== 'undefined') window.UiStatInfo = UiStatInfo;
