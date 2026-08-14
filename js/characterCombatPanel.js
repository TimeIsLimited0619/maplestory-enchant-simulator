/**
 * 角色戰鬥力數值面板（欄位 id 對齊 MapleCombat constants/fields.ts）
 * 寫入 CombatPower.setCharacterInputs → UiCharacterInfo 戰鬥力
 */
const CharacterCombatPanel = (() => {
  const STORAGE_KEY = 'uci.characterCombat.v1';

  const FIELD_IDS = [
    'baseMain', 'percentMain', 'noApplyMain', 'skillBaseMain', 'skillPercentMain',
    'baseSub', 'percentSub', 'noApplySub', 'skillBaseSub', 'skillPercentSub',
    'baseSubtwo', 'percentSubtwo', 'noApplySubtwo', 'skillBaseSubtwo', 'skillPercentSubtwo',
    'atk', 'percentAtk', 'noApplyAtk', 'skillAtk', 'skillPercentAtk',
    'dmg', 'skillDmg', 'bossDmg', 'skillBossDmg', 'critDmg', 'skillCritDmg',
    'famFinal', 'adjXenonStar', 'adjXenonPowerCoefficient',
    'adjDAHP', 'adjDASpStar', 'adjDAPowerCoefficient', 'ruinFinal',
  ];

  let inited = false;
  let open = false;
  const state = {
    jobName: '英雄',
    includeEquipDelta: true,
    genesisFinalCheck: false,
    values: {},
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

  function load() {
    try {
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
        state.values = { ...data.values };
      }
    } catch (_) { /* ignore */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        jobName: state.jobName,
        includeEquipDelta: state.includeEquipDelta,
        genesisFinalCheck: state.genesisFinalCheck,
        values: state.values,
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

  function syncToCombatPower() {
    if (typeof CombatPower === 'undefined') return;
    const job = currentJob();
    CombatPower.setCharacterInputs(buildFields(), {
      jobCategory: job.category,
      jobName: job.name,
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

    if (!inited) return;
    if (jobChanged) notifyRefresh();
    if (jobChanged || lockChanged) render();
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

  function render() {
    const body = $('ccpBody');
    if (!body) return;
    const job = currentJob();
    const lb = labels();
    const showSubtwo = job.category === 'xenon' || job.category === 'dual';
    const showXenon = job.category === 'xenon';
    const showDa = job.category === 'da';
    const showRuin = job.category === 'da' || job.name === '惡魔殺手';

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
          自動加總身上裝備
        </label>
        <label class="ccp-check">
          <input type="checkbox" id="ccpGenesis" ${state.genesisFinalCheck ? 'checked' : ''}>
          創世 10% 終傷
        </label>
      </div>
      <p class="ccp-hint">欄位對齊 MapleCombat。勾選「自動加總」時請填<strong>不含目前身上裝備</strong>的數值；取消勾選則視為完整面板（含裝備）。</p>
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
            <tr><th>B傷</th><td>${inputCell('bossDmg')}</td><td>${inputCell('skillBossDmg')}</td></tr>
            <tr><th>爆傷</th><td>${inputCell('critDmg')}</td><td>${inputCell('skillCritDmg')}</td></tr>
            <tr><th>萌獸終傷</th><td colspan="2">${inputCell('famFinal')}</td></tr>
          </tbody>
        </table>
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
    `;

    bindBodyEvents();
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
    $('ccpGenesis')?.addEventListener('change', (e) => {
      state.genesisFinalCheck = !!e.target.checked;
      notifyRefresh();
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
    getState: () => ({ ...state, values: { ...state.values } }),
  };
})();

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    CharacterCombatPanel.init();
    if (typeof UiCharacterInfo !== 'undefined') UiCharacterInfo.refresh?.();
  });
}
