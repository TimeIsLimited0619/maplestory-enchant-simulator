/**
 * 角色戰鬥力數值面板（欄位 id 對齊 MapleCombat constants/fields.ts）
 * 寫入 CombatPower.setCharacterInputs → UiCharacterInfo 戰鬥力
 */
const CharacterCombatPanel = (() => {
  const STORAGE_KEY = 'uci.characterCombat.v1';
  /** 一次性清掉測試填爆的舊存檔（數值過大導致頁面打不開） */
  const RESET_FLAG = 'uci.characterCombat.reset20260814';
  const MAX_ABS_VALUE = 1e12;

  const FIELD_IDS = [
    'baseMain', 'percentMain', 'noApplyMain', 'skillBaseMain', 'skillPercentMain',
    'baseSub', 'percentSub', 'noApplySub', 'skillBaseSub', 'skillPercentSub',
    'baseSubtwo', 'percentSubtwo', 'noApplySubtwo', 'skillBaseSubtwo', 'skillPercentSubtwo',
    'atk', 'percentAtk', 'noApplyAtk', 'skillAtk', 'skillPercentAtk',
    'dmg', 'skillDmg', 'bossDmg', 'skillBossDmg', 'critDmg', 'skillCritDmg',
    'famFinal', 'skillFinal', 'adjXenonStar', 'adjXenonPowerCoefficient',
    'adjDAHP', 'adjDASpStar', 'adjDAPowerCoefficient', 'ruinFinal',
  ];

  let inited = false;
  let open = false;
  const state = {
    jobName: '英雄',
    includeEquipDelta: true,
    genesisFinalCheck: false,
    values: {},
    weaponCorrection: {
      auto: true,
      setKey: 'genesis',
      starCount: 0,
      flameTier: 0,
      scrollAtk: 0,
      currentWeaponAtk: 0,
      isZero: false,
    },
    /** 專屬武器鎖定時不給改下拉；由裝備欄同步，不寫入 localStorage */
    jobLockedByWeapon: false,
    detectedWeaponType: '',
  };

  function $(id) {
    return document.getElementById(id);
  }

  function currentJob() {
    if (typeof CombatJobs === 'undefined') {
      return { name: state.jobName, category: 'normal' };
    }
    return CombatJobs.getJobByName(state.jobName)
      || CombatJobs.getDefaultJobByCategory('normal');
  }

  function labels() {
    if (typeof CombatJobs === 'undefined') {
      return { main: 'STR', sub: 'DEX', secondSub: '' };
    }
    return CombatJobs.getJobStatLabelsByName(state.jobName);
  }

  function sanitizeValues(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    Object.keys(raw).forEach((key) => {
      if (!FIELD_IDS.includes(key)) return;
      const text = String(raw[key] ?? '');
      if (text === '') {
        out[key] = '';
        return;
      }
      const n = Number(text);
      if (!Number.isFinite(n) || Math.abs(n) > MAX_ABS_VALUE) return;
      out[key] = text;
    });
    return out;
  }

  function load() {
    try {
      // 清掉先前測試填太高、導致無法開啟的戰鬥力欄位存檔
      if (!localStorage.getItem(RESET_FLAG)) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(RESET_FLAG, '1');
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.jobName) state.jobName = data.jobName;
      if (typeof data.includeEquipDelta === 'boolean') {
        state.includeEquipDelta = data.includeEquipDelta;
      }
      if (typeof data.genesisFinalCheck === 'boolean') {
        state.genesisFinalCheck = data.genesisFinalCheck;
      }
      if (data.values && typeof data.values === 'object') {
        state.values = sanitizeValues(data.values);
      }
      if (data.weaponCorrection && typeof data.weaponCorrection === 'object') {
        const saved = data.weaponCorrection;
        state.weaponCorrection.auto = saved.auto !== false;
        if (['fortune', 'genesis', 'arcane', 'absolab', 'fafnir'].includes(saved.setKey)) {
          state.weaponCorrection.setKey = saved.setKey;
        }
        ['starCount', 'flameTier', 'scrollAtk', 'currentWeaponAtk'].forEach((key) => {
          const value = Number(saved[key]);
          if (Number.isFinite(value)) state.weaponCorrection[key] = value;
        });
        state.weaponCorrection.isZero = !!saved.isZero;
      }
    } catch (_) {
      try { localStorage.removeItem(STORAGE_KEY); } catch (__) { /* ignore */ }
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        jobName: state.jobName,
        includeEquipDelta: state.includeEquipDelta,
        genesisFinalCheck: state.genesisFinalCheck,
        values: state.values,
        weaponCorrection: state.weaponCorrection,
      }));
    } catch (_) { /* ignore */ }
  }

  function num(id) {
    return Number(state.values[id]) || 0;
  }

  function setVal(id, raw) {
    state.values[id] = String(raw ?? '');
  }

  function buildFields() {
    const fields = {};
    FIELD_IDS.forEach((id) => {
      if (state.values[id] === '' || state.values[id] == null) {
        // 係數欄空字串語意：交由 powerCoefficientFactor 處理（空=1）
        if (id === 'adjXenonPowerCoefficient' || id === 'adjDAPowerCoefficient') {
          fields[id] = 0; // numeric；係數 raw 另傳 context
        } else if (id === 'adjXenonStar' && !('adjXenonStar' in state.values)) {
          fields[id] = 70;
        } else {
          fields[id] = Number(state.values[id]) || 0;
        }
      } else {
        fields[id] = Number(state.values[id]) || 0;
      }
    });
    return fields;
  }

  function getWeaponCorrectionResult() {
    if (typeof WeaponCorrection === 'undefined') return null;
    const job = currentJob();
    if (state.weaponCorrection.auto) {
      return WeaponCorrection.inspectEquipped({
        preferMagic: labels().main === 'INT',
        jobName: job.name,
      });
    }
    const input = {
      setKey: state.weaponCorrection.setKey,
      starCount: state.weaponCorrection.starCount,
      flameTier: state.weaponCorrection.flameTier,
      scrollAtk: state.weaponCorrection.scrollAtk,
      currentWeaponAtk: state.weaponCorrection.currentWeaponAtk,
      isZero: state.weaponCorrection.isZero || job.name === '神之子',
    };
    return { ...input, ...WeaponCorrection.calculate(input), manual: true };
  }

  function syncToCombatPower() {
    if (typeof CombatPower === 'undefined') return;
    const job = currentJob();
    const fields = buildFields();
    const weaponCorrection = getWeaponCorrectionResult();
    fields.adjWeaponAtk = Number(weaponCorrection?.correction) || 0;
    CombatPower.setCharacterInputs(fields, {
      jobCategory: job.category,
      jobName: job.name,
      weaponSet: weaponCorrection?.setKey || '',
      genesisFinalChecked: !!state.genesisFinalCheck,
      useBuff: false,
      xenonPowerCoefficientRaw: state.values.adjXenonPowerCoefficient || '',
      daPowerCoefficientRaw: state.values.adjDAPowerCoefficient || '',
      includeEquipDelta: !!state.includeEquipDelta,
    });
  }

  function notifyRefresh() {
    syncToCombatPower();
    save();
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
  }

  function detectEquippedWeapon() {
    if (typeof WeaponTypeMap === 'undefined' || typeof UiEquipModule === 'undefined') {
      return null;
    }
    return WeaponTypeMap.resolveFromEquippedSlots(
      (slotId) => UiEquipModule.getWornEntry?.(slotId)
    );
  }

  /**
   * 專屬武器：自動寫入職業並鎖下拉。
   * 共用／無武器：解開下拉，職業維持上次選擇。
   */
  function syncFromEquippedWeapon() {
    const detected = detectEquippedWeapon();
    const nextLocked = !!(detected && detected.exclusive && detected.jobName);
    const nextType = nextLocked ? (detected.weaponType || '') : '';
    const nextJob = nextLocked ? detected.jobName : state.jobName;
    const jobChanged = nextJob !== state.jobName;
    const lockChanged = nextLocked !== state.jobLockedByWeapon
      || nextType !== state.detectedWeaponType;

    if (jobChanged) state.jobName = nextJob;
    state.jobLockedByWeapon = nextLocked;
    state.detectedWeaponType = nextType;
    const equippedCorrection = typeof WeaponCorrection !== 'undefined'
      ? WeaponCorrection.inspectEquipped({
        preferMagic: labels().main === 'INT',
        jobName: currentJob().name,
      })
      : null;
    const nextGenesisChecked = equippedCorrection?.setKey === 'genesis';
    const genesisChanged = nextGenesisChecked !== state.genesisFinalCheck;
    state.genesisFinalCheck = nextGenesisChecked;

    if (!inited) return;
    if (jobChanged || genesisChanged) notifyRefresh();
    if (jobChanged || lockChanged || genesisChanged || state.weaponCorrection.auto) render();
  }

  function inputCell(id, placeholder) {
    const v = state.values[id] != null ? state.values[id] : '';
    return `<input type="number" class="ccp-input" data-field="${id}" value="${v}" placeholder="${placeholder || '0'}" step="any">`;
  }

  function renderStatRow(title, baseId, pctId, noId, skillBaseId, skillPctId) {
    return `<tr>
      <th>${title}</th>
      <td>${inputCell(baseId)}</td>
      <td>${inputCell(pctId)}</td>
      <td>${inputCell(noId)}</td>
      <td>${inputCell(skillBaseId)}</td>
      <td>${inputCell(skillPctId)}</td>
    </tr>`;
  }

  function formatSigned(value) {
    const n = Number(value) || 0;
    return n > 0 ? `+${n}` : String(n);
  }

  function renderWeaponCorrection(result) {
    const auto = state.weaponCorrection.auto;
    const setOptions = Object.entries(
      typeof WeaponCorrection !== 'undefined' ? WeaponCorrection.DATABASE : {},
    ).map(([key, row]) => (
      `<option value="${key}" ${state.weaponCorrection.setKey === key ? 'selected' : ''}>${row.name}</option>`
    )).join('');
    let details = '';
    if (auto) {
      if (!result) {
        details = '<div class="ccp-wc-empty">未穿著主武器，校正為 0。</div>';
      } else if (result.error) {
        details = `<div class="ccp-wc-empty">${result.itemName || '目前武器'}：${result.error}，校正為 0。</div>`;
      } else {
        details = `
          <div class="ccp-wc-grid">
            <span>武器</span><strong>${result.itemName}</strong>
            <span>條件</span><strong>${result.setName}／${result.starCount}星／T${result.flameTier}／卷軸攻 ${formatSigned(result.scrollAtk)}</strong>
            <span>目前武器總攻</span><strong>${result.currentWeaponAtk}</strong>
            <span>基準弓總攻</span><strong>${result.targetTotal}</strong>
            <span>戰力攻擊校正</span><strong class="${result.correction >= 0 ? 'is-positive' : 'is-negative'}">${formatSigned(result.correction)}</strong>
          </div>`;
      }
    } else {
      details = `
        <div class="ccp-wc-manual">
          <label>套裝
            <select class="ccp-select" data-wc-field="setKey">${setOptions}</select>
          </label>
          <label>星力
            <input class="ccp-input" type="number" min="0" max="25" step="1"
              data-wc-field="starCount" value="${state.weaponCorrection.starCount}">
          </label>
          <label>星火階級
            <input class="ccp-input" type="number" min="0" max="9" step="1"
              data-wc-field="flameTier" value="${state.weaponCorrection.flameTier}">
          </label>
          <label>卷軸攻
            <input class="ccp-input" type="number" step="any"
              data-wc-field="scrollAtk" value="${state.weaponCorrection.scrollAtk}">
          </label>
          <label>目前武器總攻
            <input class="ccp-input" type="number" min="0" step="any"
              data-wc-field="currentWeaponAtk" value="${state.weaponCorrection.currentWeaponAtk}">
          </label>
          <label class="ccp-check">
            <input type="checkbox" data-wc-field="isZero" ${state.weaponCorrection.isZero ? 'checked' : ''}>
            神之子基準
          </label>
        </div>
        <div class="ccp-wc-result">
          基準弓總攻 <strong>${Number(result?.targetTotal) || 0}</strong>
          ／ 戰力攻擊校正
          <strong class="${(Number(result?.correction) || 0) >= 0 ? 'is-positive' : 'is-negative'}">${formatSigned(result?.correction)}</strong>
        </div>`;
    }
    return `
      <div class="ccp-job-extra ccp-weapon-correction">
        <div class="ccp-extra-title">
          <span>武器攻擊校正</span>
          <label class="ccp-check">
            <input type="checkbox" id="ccpWeaponCorrectionAuto" ${auto ? 'checked' : ''}>
            自動依身上武器
          </label>
        </div>
        ${details}
        <div class="ccp-wc-hint">若發現戰鬥力數值有誤，可先調整「目前武器總攻」+1或-1來修正。</div>
      </div>`;
  }

  function render() {
    const body = $('ccpBody');
    if (!body) return;
    const job = currentJob();
    const lb = labels();
    const showSubtwo = job.category === 'xenon' || job.category === 'dual';
    const showXenon = job.category === 'xenon';
    const showDa = job.category === 'da';
    const showRuin = job.category === 'da' || job.name === '惡魔殺手';
    const weaponCorrection = getWeaponCorrectionResult();

    const jobLocked = !!state.jobLockedByWeapon;
    const jobOpts = (typeof CombatJobs !== 'undefined' ? CombatJobs.jobOptions : [])
      .map((j) => `<option value="${j.name}" ${j.name === state.jobName ? 'selected' : ''}>${j.name}</option>`)
      .join('');
    const jobDetectNote = jobLocked && state.detectedWeaponType
      ? `<span class="ccp-job-detect">${state.detectedWeaponType} · 自動偵測</span>`
      : '';

    body.innerHTML = `
      <div class="ccp-row ccp-row-top">
        <label class="ccp-label">職業
          <select id="ccpJob" class="ccp-select" ${jobLocked ? 'disabled' : ''}>${jobOpts}</select>
        </label>
        ${jobDetectNote}
        <label class="ccp-check">
          <input type="checkbox" id="ccpIncludeEquip" ${state.includeEquipDelta ? 'checked' : ''}>
          套用模擬器裝備
        </label>
        <label class="ccp-check" title="依身上創世武器自動勾選，也可手動調整">
          <input type="checkbox" id="ccpGenesisFinal" ${state.genesisFinalCheck ? 'checked' : ''}>
          創世 10% 終傷
        </label>
      </div>
      <p class="ccp-hint">勾選「套用模擬器裝備」時請填<strong>不包含裝備道具</strong>的數值；取消勾選則視為完整面板（含裝備）。</p>
      <div class="ccp-scroll">
        <table class="ccp-table">
          <thead>
            <tr>
              <th></th>
              <th>基本</th>
              <th>%</th>
              <th>%未套用</th>
              <th>技能.基本</th>
              <th>技能.%</th>
            </tr>
          </thead>
          <tbody>
            ${renderStatRow(lb.main, 'baseMain', 'percentMain', 'noApplyMain', 'skillBaseMain', 'skillPercentMain')}
            ${renderStatRow(lb.sub, 'baseSub', 'percentSub', 'noApplySub', 'skillBaseSub', 'skillPercentSub')}
            ${showSubtwo ? renderStatRow(lb.secondSub || '副屬2', 'baseSubtwo', 'percentSubtwo', 'noApplySubtwo', 'skillBaseSubtwo', 'skillPercentSubtwo') : ''}
            ${renderStatRow(lb.main === 'INT' ? '魔攻' : '攻擊力', 'atk', 'percentAtk', 'noApplyAtk', 'skillAtk', 'skillPercentAtk')}
          </tbody>
        </table>
        <table class="ccp-table ccp-table-special">
          <thead><tr><th></th><th>數值</th><th>技能.消耗</th></tr></thead>
          <tbody>
            <tr><th>傷害</th><td>${inputCell('dmg')}</td><td>${inputCell('skillDmg')}</td></tr>
            <tr><th>Boss傷害</th><td>${inputCell('bossDmg')}</td><td>${inputCell('skillBossDmg')}</td></tr>
            <tr><th>爆擊傷害</th><td>${inputCell('critDmg')}</td><td>${inputCell('skillCritDmg')}</td></tr>
            <tr><th>終傷(萌獸)</th><td colspan="2">${inputCell('famFinal')}</td></tr>
            <tr><th>終傷(技能)</th><td colspan="2">${inputCell('skillFinal')}</td></tr>
          </tbody>
        </table>
        ${renderWeaponCorrection(weaponCorrection)}
        ${showXenon ? `
          <div class="ccp-job-extra">
            <div class="ccp-extra-title">傑諾</div>
            <label>星力轉換屬性 ${inputCell('adjXenonStar', '70')}</label>
            <label>戰鬥力係數 ${inputCell('adjXenonPowerCoefficient', '0.65625')}</label>
          </div>` : ''}
        ${showDa ? `
          <div class="ccp-job-extra">
            <div class="ccp-extra-title">惡魔復仇者</div>
            <label>基本HP ${inputCell('adjDAHP')}</label>
            <label>星力轉換HP ${inputCell('adjDASpStar')}</label>
            <label>戰鬥力係數 ${inputCell('adjDAPowerCoefficient', '0.75')}</label>
          </div>` : ''}
        ${showRuin ? `
          <div class="ccp-job-extra">
            <label>毀滅盾牌終傷
              <select class="ccp-select" data-field="ruinFinal">
                <option value="0" ${num('ruinFinal') === 0 ? 'selected' : ''}>0%</option>
                <option value="10" ${num('ruinFinal') === 10 ? 'selected' : ''}>10%</option>
              </select>
            </label>
          </div>` : ''}
      </div>
      <div class="ccp-footer">
        <button type="button" id="ccpClearValues" class="ccp-clear-btn">清空數值</button>
      </div>
    `;

    bindBodyEvents();
  }

  function clearValues() {
    state.values = {};
    state.weaponCorrection = {
      ...state.weaponCorrection,
      starCount: 0,
      flameTier: 0,
      scrollAtk: 0,
      currentWeaponAtk: 0,
      isZero: false,
    };
    notifyRefresh();
    render();
  }

  function bindBodyEvents() {
    $('ccpJob')?.addEventListener('change', (e) => {
      if (state.jobLockedByWeapon) return;
      state.jobName = e.target.value;
      notifyRefresh();
      render();
    });
    $('ccpIncludeEquip')?.addEventListener('change', (e) => {
      state.includeEquipDelta = !!e.target.checked;
      notifyRefresh();
    });
    $('ccpGenesisFinal')?.addEventListener('change', (e) => {
      state.genesisFinalCheck = !!e.target.checked;
      notifyRefresh();
    });
    $('ccpWeaponCorrectionAuto')?.addEventListener('change', (e) => {
      state.weaponCorrection.auto = !!e.target.checked;
      notifyRefresh();
      render();
    });

    $('ccpBody')?.querySelectorAll('[data-wc-field]').forEach((el) => {
      const key = el.getAttribute('data-wc-field');
      el.addEventListener('change', () => {
        if (key === 'isZero') {
          state.weaponCorrection.isZero = !!el.checked;
        } else if (key === 'setKey') {
          state.weaponCorrection.setKey = el.value;
        } else {
          state.weaponCorrection[key] = Number(el.value) || 0;
        }
        notifyRefresh();
        render();
      });
    });

    const body = $('ccpBody');
    body?.querySelectorAll('[data-field]').forEach((el) => {
      const id = el.getAttribute('data-field');
      const handler = () => {
        setVal(id, el.value);
        notifyRefresh();
      };
      el.addEventListener('change', handler);
      el.addEventListener('input', handler);
    });

    $('ccpClearValues')?.addEventListener('click', (e) => {
      e.preventDefault();
      clearValues();
    });
  }

  function ensureDom() {
    if ($('ccpRoot')) return;
    const root = document.createElement('div');
    root.id = 'ccpRoot';
    root.className = 'ccp-root is-hidden';
    root.innerHTML = `
      <div class="ccp-header">
        <span>戰鬥力數值（角色基底）</span>
        <button type="button" id="ccpClose" class="panel-wb-close panel-wb-close--inline" aria-label="關閉戰力面板" title="關閉"><span aria-hidden="true">×</span></button>
      </div>
      <div id="ccpBody" class="ccp-body"></div>
    `;
    document.body.appendChild(root);
  }

  function syncMenuButton() {
    $('btnViewCombat')?.classList.toggle('is-active', open);
  }

  function setOpen(next) {
    open = !!next;
    const root = $('ccpRoot');
    if (root) root.classList.toggle('is-hidden', !open);
    if (open && typeof PanelDrag !== 'undefined') {
      PanelDrag.bringFront(root);
    }
    syncMenuButton();
  }

  function bind() {
    $('btnViewCombat')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(!open);
    });
    $('ccpClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
  }

  function init() {
    if (inited) return;
    load();
    ensureDom();
    inited = true;
    bind();
    syncFromEquippedWeapon();
    if (!$('ccpBody')?.innerHTML) render();
    syncToCombatPower();
    setOpen(false);
  }

  return {
    init,
    refresh: render,
    setOpen,
    toggle() { setOpen(!open); },
    isOpen: () => !!open,
    syncToCombatPower,
    syncFromEquippedWeapon,
    getState: () => ({
      ...state,
      values: { ...state.values },
      weaponCorrection: { ...state.weaponCorrection },
    }),
  };
})();

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    CharacterCombatPanel.init();
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
  });
}
