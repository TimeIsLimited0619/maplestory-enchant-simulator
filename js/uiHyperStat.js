/**
 * 極限屬性視窗 + Level Up popup
 * 座標：UI.UICharacterInfo.img.xml local/detailStat/HyperStat
 */
const UiHyperStat = (() => {
  const IMG_STAT = 'images/UICharacterInfo/common/detailStat/HyperStat/Window/statList';
  const Y0 = 40;
  const Y_STEP = 22;
  const POINT_POS = [101, 453];
  const HYPER_MAX = () => CharacterProgression.HYPER_MAX_LEVEL || 100;

  const HYPER_META = {
    str: { desc: '會增加力量。', effect: (n) => `提高力量 ${n}` },
    dex: { desc: '會增加敏捷。', effect: (n) => `提高敏捷 ${n}` },
    int: { desc: '會增加智力。', effect: (n) => `提高智力 ${n}` },
    luk: { desc: '會增加幸運。', effect: (n) => `提高幸運 ${n}` },
    hp: { desc: '會增加最大 HP。', effect: (n) => `提高最大 HP ${n}%` },
    mp: { desc: '會增加最大 MP。', effect: (n) => `提高最大 MP ${n}%` },
    df: { desc: '會增加惡魔力量／精氣。', effect: (n) => `提高 DF / TF ${n}` },
    critRate: { desc: '會增加爆擊機率。', effect: (n) => `提高爆擊機率 ${n}%` },
    critDmg: { desc: '會增加爆擊傷害。', effect: (n) => `提高爆擊傷害 ${n}%` },
    ied: { desc: '會增加無視防禦率。', effect: (n) => `提高無視防禦率 ${n}%` },
    dmg: { desc: '會增加傷害。', effect: (n) => `提高傷害 ${n}%` },
    boss: { desc: '會增加對 Boss 怪物的傷害。', effect: (n) => `提高 Boss 傷害 ${n}%` },
    normal: { desc: '會增加對一般怪物的傷害。', effect: (n) => `提高一般怪物傷害 ${n}%` },
    status: { desc: '會增加狀態異常耐性。', effect: (n) => `提高狀態異常耐性 ${n}` },
    atk: { desc: '會增加攻擊力與魔法攻擊力。', effect: (n) => `提高攻擊力/魔法攻擊力 ${n}` },
    exp: { desc: '會增加獲得經驗值。', effect: (n) => `提高獲得經驗值 ${n}%` },
    arcane: { desc: '會增加神秘力量。', effect: (n) => `提高神秘力量 ${n}` },
  };

  let inited = false;
  let open = false;
  let tipKey = '';
  const popup = {
    open: false,
    key: '',
    current: 0,
    dest: 0,
    max: 100,
  };

  function $(id) {
    return document.getElementById(id);
  }

  function rowByKey(key) {
    return CharacterProgression.HYPER_ROWS.find((row) => row.key === key) || null;
  }

  function requiredCost() {
    return CharacterProgression.hyperCostBetween(popup.current, popup.dest);
  }

  function formatEffect(key, level) {
    const meta = HYPER_META[key];
    if (!meta) return '';
    const n = CharacterProgression.hyperBonusAt(key, level);
    const shown = Number.isInteger(n) ? n : Math.round(n * 10) / 10;
    return meta.effect(shown);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function ensureDom(host) {
    if ($('uciHyperRoot')) return;
    const root = document.createElement('div');
    root.id = 'uciHyperRoot';
    root.className = 'uci-hyper is-hidden';
    root.setAttribute('aria-label', '極限屬性');
    const rows = CharacterProgression.HYPER_ROWS.map((row, index) => {
      const y = Y0 + index * Y_STEP;
      return `
        <div class="uci-hyper-row" data-hyper-row="${row.key}" style="top:${y}px">
          <img class="uci-hyper-row-img" data-hyper-key="${row.key}" alt=""
            src="${IMG_STAT}/${row.skillId}.png">
          <button type="button" class="uci-hyper-lvup" data-hyper-up="${row.key}"
            aria-label="提升 ${row.label}"></button>
          <div class="uci-hyper-lv" data-hyper-lv="${row.key}">0</div>
        </div>
      `;
    }).join('');
    root.innerHTML = `
      <button type="button" class="uci-hyper-close" id="uciHyperClose" aria-label="關閉極限屬性"></button>
      ${rows}
      <div class="uci-hyper-preset-sel" id="uciHyperPresetSel" style="left:69px;top:419px"></div>
      <button type="button" class="uci-hyper-preset" data-hyper-preset="0" style="left:70px;top:420px">1</button>
      <button type="button" class="uci-hyper-preset" data-hyper-preset="1" style="left:90px;top:420px">2</button>
      <button type="button" class="uci-hyper-preset" data-hyper-preset="2" style="left:110px;top:420px">3</button>
      <button type="button" class="uci-hyper-apply" id="uciHyperApply" aria-label="套用"></button>
      <button type="button" class="uci-hyper-reset" id="uciHyperReset" aria-label="重設"></button>
      <div class="uci-hyper-points" id="uciHyperPoints" style="left:${POINT_POS[0]}px;top:${POINT_POS[1]}px">0</div>
    `;

    const pop = document.createElement('div');
    pop.id = 'uciHyperPopup';
    pop.className = 'uci-hyper-popup is-hidden';
    pop.setAttribute('aria-label', 'HYPER STAT LEVEL UP');
    pop.innerHTML = `
      <button type="button" class="uci-hyper-popup-close" id="uciHyperPopupClose" aria-label="關閉"></button>
      <div class="uci-hyper-popup-name" id="uciHyperPopupName">STR</div>
      <div class="uci-hyper-popup-cur" id="uciHyperPopupCur">0</div>
      <div class="uci-hyper-popup-dest" id="uciHyperPopupDest">1</div>
      <button type="button" class="uci-hyper-pop-minus" id="uciHyperPopMinus" aria-label="減少等級"></button>
      <button type="button" class="uci-hyper-pop-plus" id="uciHyperPopPlus" aria-label="增加等級"></button>
      <button type="button" class="uci-hyper-pop-max" id="uciHyperPopMax" aria-label="MAX"></button>
      <div class="uci-hyper-popup-remain" id="uciHyperPopupRemain">0</div>
      <div class="uci-hyper-popup-need" id="uciHyperPopupNeed">0</div>
      <button type="button" class="uci-hyper-pop-up" id="uciHyperPopUp" aria-label="升級"></button>
    `;

    const tip = document.createElement('div');
    tip.id = 'uciHyperTip';
    tip.className = 'eq-tooltip uci-hyper-tip hidden';
    tip.setAttribute('aria-hidden', 'true');

    const wrap = host || document.body;
    wrap.appendChild(pop);
    wrap.appendChild(root);
    document.body.appendChild(tip);
  }

  function hideTip() {
    tipKey = '';
    const tip = $('uciHyperTip');
    if (!tip) return;
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
    tip.innerHTML = '';
  }

  function buildTipHtml(key) {
    const row = rowByKey(key);
    if (!row) return '';
    const assets = (typeof EQUIP_TOOLTIP_ASSETS !== 'undefined' && EQUIP_TOOLTIP_ASSETS) || {};
    const frame = assets.equipFrame || {};
    const line = frame.line || (assets.frame && assets.frame.dotline) || '';
    const topBg = frame.top ? ` style="background-image:url('${frame.top}')"` : '';
    const midBg = frame.mid ? ` style="background-image:url('${frame.mid}')"` : '';
    const btmBg = frame.btm ? ` style="background-image:url('${frame.btm}')"` : '';
    const lineStyle = line ? ` style="background-image:url('${line}')"` : '';

    const meta = HYPER_META[key] || { desc: '', effect: () => '' };
    const cur = CharacterProgression.getState().hyper[key] || 0;
    const max = row.max || HYPER_MAX();
    const name = escapeHtml(row.label);
    const desc = escapeHtml(meta.desc);

    let levelBlocks = '';
    if (cur > 0) {
      levelBlocks += `
        <div class="uci-hyper-tip-lv">[現在等級 ${cur}]</div>
        <div class="uci-hyper-tip-fx">${escapeHtml(formatEffect(key, cur))}</div>
      `;
    }
    if (cur < max) {
      levelBlocks += `
        <div class="uci-hyper-tip-lv">[下次等級 ${cur + 1}]</div>
        <div class="uci-hyper-tip-fx">${escapeHtml(formatEffect(key, cur + 1))}</div>
      `;
    }

    return `
      <div class="eq-tooltip-frame uci-hyper-tip-frame">
        <div class="eq-tooltip-frame-top"${topBg}></div>
        <div class="eq-tooltip-mid-wrap">
          <div class="eq-tooltip-frame-mid"${midBg}></div>
          <div class="eq-tooltip-body">
            <div class="eq-tooltip-content">
              <div class="uci-hyper-tip-title">${name}</div>
              <div class="uci-hyper-tip-max">[最大等級: ${max}]</div>
              <div class="uci-hyper-tip-desc">${desc}</div>
              <div class="eq-tip-dotline"${lineStyle}></div>
              <div class="uci-hyper-tip-levels">${levelBlocks}</div>
            </div>
          </div>
        </div>
        <div class="eq-tooltip-frame-btm"${btmBg}></div>
      </div>
    `;
  }

  function placeTip(anchorEl) {
    const tip = $('uciHyperTip');
    if (!tip || !anchorEl?.isConnected) return;
    const tipW = tip.offsetWidth || 220;
    const tipH = tip.offsetHeight || 120;
    const root = $('uciHyperRoot');
    const rootRect = root?.getBoundingClientRect?.();
    const ar = anchorEl.getBoundingClientRect();
    let left = rootRect
      ? rootRect.left - tipW - 8
      : ar.left - tipW - 8;
    let top = rootRect
      ? rootRect.top + (ar.top - rootRect.top) + (ar.height / 2) - (tipH / 2)
      : ar.top + (ar.height / 2) - (tipH / 2);
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    if (top + tipH > window.innerHeight - 8) top = window.innerHeight - tipH - 8;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function showTip(key, anchorEl) {
    const tip = $('uciHyperTip');
    if (!tip || !anchorEl || !rowByKey(key)) return;
    tip.innerHTML = buildTipHtml(key);
    tip.classList.remove('hidden');
    tip.setAttribute('aria-hidden', 'false');
    tipKey = key;
    requestAnimationFrame(() => placeTip(anchorEl));
  }

  function syncRowHover() {
    document.querySelectorAll('[data-hyper-row]').forEach((el) => {
      const on = popup.open && el.getAttribute('data-hyper-row') === popup.key;
      el.classList.toggle('is-selected', on);
    });
  }

  function setPopupOpen(next) {
    popup.open = !!next;
    $('uciHyperPopup')?.classList.toggle('is-hidden', !popup.open);
    if (popup.open) {
      hideTip();
      renderPopup();
    }
    syncRowHover();
  }

  function openPopup(key) {
    const row = rowByKey(key);
    if (!row) return;
    const cur = CharacterProgression.getState().hyper[key] || 0;
    if (cur >= row.max) return;
    popup.key = key;
    popup.current = cur;
    popup.max = row.max;
    const affordable = CharacterProgression.maxAffordableHyper(key);
    popup.dest = Math.max(cur + 1, Math.min(cur + 1, affordable || cur + 1));
    if (popup.dest > row.max) popup.dest = row.max;
    if (popup.dest <= cur) popup.dest = Math.min(row.max, cur + 1);
    setPopupOpen(true);
  }

  function renderPopup() {
    const row = rowByKey(popup.key);
    if (!row) return;
    const remain = CharacterProgression.remainHyper();
    const need = requiredCost();
    const affordable = CharacterProgression.maxAffordableHyper(popup.key);
    $('uciHyperPopupName').textContent = row.label;
    $('uciHyperPopupCur').textContent = String(popup.current);
    $('uciHyperPopupDest').textContent = String(popup.dest);
    $('uciHyperPopupRemain').textContent = String(remain);
    $('uciHyperPopupNeed').textContent = String(need);

    const minus = $('uciHyperPopMinus');
    const plus = $('uciHyperPopPlus');
    const maxBtn = $('uciHyperPopMax');
    const up = $('uciHyperPopUp');
    minus.disabled = popup.dest <= popup.current + 1;
    plus.disabled = popup.dest >= popup.max
      || CharacterProgression.hyperCostBetween(popup.current, popup.dest + 1) > remain;
    maxBtn.disabled = affordable <= popup.dest;
    up.disabled = popup.dest <= popup.current || need <= 0 || need > remain;
    minus.classList.toggle('is-disabled', minus.disabled);
    plus.classList.toggle('is-disabled', plus.disabled);
    maxBtn.classList.toggle('is-disabled', maxBtn.disabled);
    up.classList.toggle('is-disabled', up.disabled);
  }

  function refresh() {
    if (!inited) return;
    const prog = CharacterProgression.getState();
    CharacterProgression.HYPER_ROWS.forEach((row) => {
      const rowEl = document.querySelector(`[data-hyper-row="${row.key}"]`);
      const el = rowEl?.querySelector('[data-hyper-lv]');
      if (el) el.textContent = String(prog.hyper[row.key] || 0);
      const btn = rowEl?.querySelector('[data-hyper-up]');
      const atMax = (prog.hyper[row.key] || 0) >= row.max;
      btn?.classList.toggle('is-disabled', atMax);
      if (btn) btn.disabled = atMax;
    });
    document.querySelectorAll('[data-hyper-preset]').forEach((btn) => {
      const n = Number(btn.getAttribute('data-hyper-preset'));
      btn.classList.toggle('is-checked', n === prog.hyperPreset);
    });
    const sel = $('uciHyperPresetSel');
    if (sel) sel.style.left = `${69 + prog.hyperPreset * 20}px`;
    const pts = $('uciHyperPoints');
    if (pts) {
      pts.textContent = String(CharacterProgression.remainHyper());
      pts.style.left = `${POINT_POS[0]}px`;
      pts.style.top = `${POINT_POS[1]}px`;
    }
    if (popup.open) {
      popup.current = prog.hyper[popup.key] || 0;
      if (popup.dest < popup.current + 1) popup.dest = Math.min(popup.max, popup.current + 1);
      renderPopup();
    }
    if (tipKey) {
      const rowEl = document.querySelector(`[data-hyper-row="${tipKey}"]`);
      if (rowEl) showTip(tipKey, rowEl);
      else hideTip();
    }
  }

  function setOpen(next) {
    open = !!next;
    $('uciHyperRoot')?.classList.toggle('is-hidden', !open);
    $('uciBtnHyper')?.classList.toggle('is-active', open);
    if (!open) {
      setPopupOpen(false);
      hideTip();
    }
    if (open) refresh();
  }

  function bind() {
    $('uciHyperClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
    $('uciHyperReset')?.addEventListener('click', (e) => {
      e.preventDefault();
      CharacterProgression.resetActiveHyper();
    });
    $('uciHyperApply')?.addEventListener('click', (e) => {
      e.preventDefault();
      CharacterProgression.setHyperPreset(CharacterProgression.getState().hyperPreset);
    });
    document.querySelectorAll('[data-hyper-up]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openPopup(btn.getAttribute('data-hyper-up'));
      });
    });
    document.querySelectorAll('[data-hyper-row]').forEach((rowEl) => {
      rowEl.addEventListener('mouseenter', () => {
        if (popup.open) return;
        const key = rowEl.getAttribute('data-hyper-row');
        if (key) showTip(key, rowEl);
      });
      rowEl.addEventListener('mouseleave', () => {
        hideTip();
      });
    });
    document.querySelectorAll('[data-hyper-preset]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        CharacterProgression.setHyperPreset(Number(btn.getAttribute('data-hyper-preset')));
      });
    });
    $('uciHyperPopupClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setPopupOpen(false);
    });
    $('uciHyperPopMinus')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (popup.dest > popup.current + 1) {
        popup.dest -= 1;
        renderPopup();
      }
    });
    $('uciHyperPopPlus')?.addEventListener('click', (e) => {
      e.preventDefault();
      const remain = CharacterProgression.remainHyper();
      const next = popup.dest + 1;
      if (next <= popup.max && CharacterProgression.hyperCostBetween(popup.current, next) <= remain) {
        popup.dest = next;
        renderPopup();
      }
    });
    $('uciHyperPopMax')?.addEventListener('click', (e) => {
      e.preventDefault();
      const cap = CharacterProgression.maxAffordableHyper(popup.key);
      popup.dest = Math.max(popup.current + 1, cap);
      renderPopup();
    });
    $('uciHyperPopUp')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (CharacterProgression.setHyperLevel(popup.key, popup.dest)) {
        setPopupOpen(false);
      }
    });
  }

  function init(host) {
    if (inited) return;
    ensureDom(host);
    inited = true;
    bind();
    refresh();
    setOpen(false);
  }

  return { init, refresh, setOpen, toggle() { setOpen(!open); }, isOpen: () => open };
})();

if (typeof window !== 'undefined') window.UiHyperStat = UiHyperStat;
