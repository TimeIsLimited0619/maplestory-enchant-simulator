/**
 * UICharacterInfo
 * 依 UI.UICharacterInfo.img.xml：
 *   common/main/backgrnd
 *   local/detail (+ BattleSimulation outlink backgrnd)
 *   local/detailStat + common/detailStat 座標（numPos / origin）
 * 數值：EquipStatPanel.buildSnapshot() 身上裝備加總
 */
const UiCharacterInfo = (() => {
  /**
   * common/detailStat/Stat/* 座標（相對 detailStat）
   * key：對應 EquipStatPanel / 潛能標籤；無來源時顯示 0
   */
  const STAT_SLOTS = [
    // 主屬區
    { id: 0, numPos: [217, 49], key: '最大HP', source: 'main' },
    { id: 1, numPos: [425, 49], key: '最大MP', source: 'main' },
    { id: 2, numPos: [217, 71], key: 'STR', source: 'main' },
    { id: 3, numPos: [425, 71], key: 'DEX', source: 'main' },
    { id: 4, numPos: [217, 93], key: 'INT', source: 'main' },
    { id: 5, numPos: [425, 93], key: 'LUK', source: 'main' },
    // 攻擊區（attackFont）
    { id: 7, numPos: [217, 132], key: '屬性攻擊力', source: 'panelAttack', format: 'power' },
    { id: 6, numPos: [437, 132], key: '傷害', source: 'extraOrEx', percent: true },
    { id: 9, numPos: [217, 154], key: '最終傷害', source: 'finalDamage', percent: true },
    { id: 8, numPos: [437, 154], key: 'BOSS怪物傷害', source: 'extraOrEx', percent: true },
    { id: 12, numPos: [217, 176], key: '無視防禦率', source: 'ied', percent: true },
    { id: 11, numPos: [437, 176], key: '一般怪物傷害', source: 'extraOrEx', percent: true },
    { id: 10, numPos: [217, 198], key: '攻擊力', source: 'main' },
    { id: 18, numPos: [437, 198], key: '爆擊機率', source: 'extraOrEx', percent: true },
    { id: 13, numPos: [217, 220], key: '魔法攻擊力', source: 'main' },
    { id: 21, numPos: [437, 220], key: '爆擊傷害', source: 'extraOrEx', percent: true },
    { id: 14, numPos: [217, 242], key: '冷卻時間減少', source: 'cooldownSec', format: 'sec' },
    { id: 16, numPos: [437, 242], key: 'Buff持續時間', source: 'extraOrEx', percent: true },
    { id: 17, numPos: [217, 264], key: '無視冷卻時間', source: 'extraOrEx', percent: true },
    { id: 15, numPos: [437, 264], key: '無視屬性抗性', source: 'extraOrEx', percent: true },
    { id: 20, numPos: [217, 286], key: '狀態異常追加傷害', source: 'extraOrEx', percent: true },
    { id: 19, numPos: [437, 286], key: '增加召喚獸持續時間', source: 'extraOrEx', percent: true },
    // 實用區（utilityFont）：楓幣／掉落／經驗｜星力／神秘／真實
    { id: 22, numPos: [217, 325], key: '楓幣獲得量', source: 'extraOrEx', percent: true },
    { id: 23, numPos: [437, 325], key: '星力', source: 'starSum' },
    { id: 24, numPos: [217, 347], key: '道具掉落率', source: 'extraOrEx', percent: true },
    { id: 25, numPos: [437, 347], key: '神秘力量', source: 'zero' },
    { id: 26, numPos: [217, 369], key: '獲得追加經驗值', source: 'extraOrEx', percent: true },
    { id: 27, numPos: [437, 369], key: '真實力量', source: 'zero' },
  ];

  const RENDER_SLOTS = STAT_SLOTS;

  let inited = false;
  let open = false;

  function $(id) {
    return document.getElementById(id);
  }

  function formatWithCommas(n) {
    const rounded = Math.round(Number(n) || 0);
    return rounded.toLocaleString('en-US');
  }

  function formatNumber(n, slot) {
    const v = Number(n) || 0;
    if (slot?.format === 'sec') {
      return `${formatWithCommas(Math.abs(v))}秒`;
    }
    if (slot?.format === 'power') {
      if (typeof formatPower !== 'function') return formatWithCommas(v);
      // 屬性攻擊力：億／萬後加空格（例：12億 0170萬 9742）
      return formatPower(v).replace(/億/g, '億 ').replace(/萬/g, '萬 ');
    }
    if (slot?.percent) {
      // 無視防禦乘算後常有小數；其餘多半為整數
      const rounded = Math.round(v * 100) / 100;
      if (Number.isInteger(rounded)) return `${formatWithCommas(rounded)}%`;
      const [intPart, frac] = String(rounded).split('.');
      return `${Number(intPart).toLocaleString('en-US')}.${frac}%`;
    }
    return formatWithCommas(v);
  }

  /** 基礎 × (1 + pct/100)，向下取整（對齊 MapleCombat floorPercentApplied） */
  function applyPercent(base, percent) {
    const b = Number(base) || 0;
    const p = Number(percent) || 0;
    if (typeof CombatPower !== 'undefined' && typeof CombatPower.floorPercentApplied === 'function') {
      return CombatPower.floorPercentApplied(b, p);
    }
    return Math.floor((b * (100 + p)) / 100);
  }

  /**
   * 從 snapshot 加總百分比詞條（潛能／附加／extra／靈魂）
   * key 以 % 結尾，或 pot.suffix/%、extra.isPercent 才計入
   */
  function sumPercentSources(snapshot, keys) {
    if (!snapshot || !keys?.length) return 0;
    let n = 0;
    const extra = snapshot.extraTotals || {};
    const soul = snapshot.soulOptions || {};
    const soulMeta = snapshot.soulOptionMeta || {};
    const potMain = snapshot.potMain || {};
    const potAdd = snapshot.potAdd || {};

    keys.forEach((key) => {
      const row = extra[key];
      if (row && (key.endsWith('%') || row.isPercent)) {
        n += Number(row.total) || 0;
      }
      if (soul[key] != null) {
        const meta = soulMeta[key];
        if (key.endsWith('%') || meta === '%' || meta == null) {
          // 靈魂 % 詞條多半 meta 為 '%'；無 meta 且 key 含 % 也算
          if (key.endsWith('%') || meta === '%') n += Number(soul[key]) || 0;
        }
      }
      [potMain[key], potAdd[key]].forEach((pot) => {
        if (!pot?.value) return;
        if (pot.suffix === '%' || key.endsWith('%')) {
          n += Number(pot.value) || 0;
        }
      });
    });
    return n;
  }

  const STAT_PERCENT_KEYS = {
    STR: ['STR%', 'STR', '力量%', '力量'],
    DEX: ['DEX%', 'DEX', '敏捷%', '敏捷'],
    INT: ['INT%', 'INT', '智力%', '智力'],
    LUK: ['LUK%', 'LUK', '幸運%', '幸運'],
  };

  const ALL_STAT_PERCENT_KEYS = ['全屬性%', '全屬性'];
  const ATK_PERCENT_KEYS = ['攻擊力%', '物理攻擊力%', '攻擊力', '物理攻擊力'];
  const MAD_PERCENT_KEYS = ['攻擊力%', '魔法攻擊力%', '攻擊力', '魔法攻擊力'];

  function allStatFlatFromSet(snapshot) {
    const row = snapshot?.extraTotals?.['全屬性'];
    if (!row || row.isPercent) return 0;
    return Number(row.total) || 0;
  }

  function ensureDom() {
    if ($('uciRoot')) return;

    const root = document.createElement('div');
    root.id = 'uciRoot';
    root.className = 'uci-root';
    root.setAttribute('aria-label', '角色資訊');
    root.innerHTML = `
      <div class="uci-main" id="uciMain">
        <div class="uci-drag-handle" id="uciDragHandle" title="拖曳視窗"></div>
        <button type="button" class="panel-wb-close" id="uciClose" aria-label="關閉角色資訊" title="關閉"><span aria-hidden="true">×</span></button>
      </div>
      <div class="uci-detail" id="uciDetail">
        <div class="uci-layer-stat" aria-hidden="true"></div>
        <div class="uci-detail-stat" id="uciDetailStat">
          <div class="uci-attack-back" aria-hidden="true"></div>
          <div class="uci-main-stat-back" aria-hidden="true"></div>
          <div class="uci-main-stat-font" aria-hidden="true"></div>
          <div class="uci-mp-title" aria-hidden="true"></div>
          <div class="uci-attack-font" aria-hidden="true"></div>
          <div class="uci-utility-back" aria-hidden="true"></div>
          <div class="uci-utility-font" aria-hidden="true"></div>
          <button type="button" class="uci-lvup uci-lvup-hp" tabindex="-1" aria-hidden="true"></button>
          <button type="button" class="uci-lvup uci-lvup-mp" tabindex="-1" aria-hidden="true"></button>
          <button type="button" class="uci-lvup uci-lvup-str" tabindex="-1" aria-hidden="true"></button>
          <button type="button" class="uci-lvup uci-lvup-dex" tabindex="-1" aria-hidden="true"></button>
          <button type="button" class="uci-lvup uci-lvup-int" tabindex="-1" aria-hidden="true"></button>
          <button type="button" class="uci-lvup uci-lvup-luk" tabindex="-1" aria-hidden="true"></button>
          <button type="button" class="uci-ap-btn" tabindex="-1" aria-hidden="true"></button>
          <button type="button" class="uci-btn-hyper" tabindex="-1" aria-hidden="true"></button>
          <button type="button" class="uci-btn-ability" tabindex="-1" aria-hidden="true"></button>
          <div class="uci-attack-power" id="uciAttackPower">—</div>
          <div class="uci-nums" id="uciNums"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const nums = $('uciNums');
    RENDER_SLOTS.forEach((slot) => {
      const el = document.createElement('div');
      el.className = 'uci-num is-empty';
      el.dataset.statId = String(slot.id);
      el.style.left = `${slot.numPos[0]}px`;
      el.style.top = `${slot.numPos[1]}px`;
      el.textContent = '0';
      nums.appendChild(el);
    });
  }

  function syncMenuButton() {
    $('btnViewCharacter')?.classList.toggle('is-active', open);
  }

  function setOpen(next) {
    const wasOpen = open;
    open = !!next;
    const root = $('uciRoot');
    if (root) root.classList.toggle('is-hidden', !open);
    if (open && !wasOpen) refresh();
    if (open && typeof PanelDrag !== 'undefined') {
      PanelDrag.bringFront(root);
    }
    syncMenuButton();
  }

  function displayStatKey(label) {
    if (label === 'HP' || label === '最大HP') return '最大HP';
    return label;
  }

  /**
   * 戰力面板結算值（主／副／攻／傷／B傷／爆傷）
   * 一律取未扣技能.消耗的加總值（panel），與遊戲角色面板一致；
   * 戰鬥力另走 CombatPower 公式（扣技能.消耗）。
   * 回傳 number；不適用則回 null 交給裝備路徑
   */
  function readCombatPanelValue(snapshot, slot, combat) {
    if (!combat?.resolved) return null;
    const { resolved, labels } = combat;
    const key = slot.key;
    const mainKey = displayStatKey(labels.main);
    const subKey = displayStatKey(labels.sub);
    const sub2Key = labels.secondSub ? displayStatKey(labels.secondSub) : '';

    if (key === mainKey) return Number(resolved.main?.panel) || 0;
    if (key === subKey) return Number(resolved.sub?.panel) || 0;
    if (sub2Key && key === sub2Key) return Number(resolved.subtwo?.panel) || 0;

    const useMad = labels.main === 'INT';
    if (key === '攻擊力' && !useMad) return Number(resolved.attack?.panel) || 0;
    if (key === '魔法攻擊力' && useMad) return Number(resolved.attack?.panel) || 0;

    if (key === '傷害') return Number(resolved.damageDetail?.panel) || 0;
    if (key === 'BOSS怪物傷害') return Number(resolved.bossDamageDetail?.panel) || 0;
    if (key === '爆擊傷害') return Number(resolved.critDamageDetail?.panel) || 0;

    return null;
  }

  /** 終傷來源（各自獨立 %）；倍率 = ∏(1 + 終傷_i%/100) */
  function collectFinalDamageSources(snapshot, combat) {
    const sources = [];
    const push = (name, value) => {
      const n = Number(value) || 0;
      if (!n) return;
      sources.push({ name, value: n });
    };
    push('裝備', sumAdditiveStat(snapshot || {}, '最終傷害'));
    push('萌獸', combat?.fields?.famFinal);
    const skillFinal = Number(combat?.fields?.skillFinal) || 0;
    if (combat?.ctx?.genesisFinalChecked) {
      // 輸入的技能終傷已包含創世 10%；拆成兩個獨立倍率，避免面板重複計算。
      const skillWithoutGenesis = ((1 + skillFinal / 100) / 1.1 - 1) * 100;
      push('技能', skillWithoutGenesis);
      push('創世武器', 10);
    } else {
      push('技能', skillFinal);
    }
    push('毀滅盾牌', combat?.fields?.ruinFinal);
    return sources;
  }

  function finalDamageMultiplier(sources) {
    return (sources || []).reduce((acc, row) => {
      const pct = Number(row?.value) || 0;
      return acc * (1 + pct / 100);
    }, 1);
  }

  /** 等效終傷% = (總倍率 − 1) × 100，供面板顯示 */
  function finalDamageEquivalentPercent(snapshot, combat) {
    const mult = finalDamageMultiplier(collectFinalDamageSources(snapshot, combat));
    return (mult - 1) * 100;
  }

  /**
   * 屬性攻擊力（面板上限）
   * 武器係數 × (4×主屬 + 副屬) × 總攻魔/100 × (1+傷害%/100) × ∏(1+終傷_i%/100)
   */
  function calcPanelAttack(snapshot, combat) {
    if (!combat?.resolved) return 0;
    const { resolved, ctx } = combat;
    const jobCat = ctx?.jobCategory || 'normal';
    // 面板顯示用：一律取未扣技能.消耗的加總值
    const mainPanel = Number(resolved.main?.panel) || 0;
    const subPanel = Number(resolved.sub?.panel) || 0;
    const subtwo = Number(resolved.subtwo?.panel) || 0;
    let statPart = 0;
    if (jobCat === 'xenon') {
      // 傑諾：三屬等權
      statPart = mainPanel + subPanel + subtwo;
    } else if (jobCat === 'da') {
      // 惡復：等效主屬（HP 換算）+ 副屬
      const baseHP = Number(combat?.fields?.adjDAHP) || 0;
      const equivalentMain = baseHP / 3.5 + ((mainPanel - baseHP) / 3.5) * 0.8;
      statPart = equivalentMain + subPanel;
    } else {
      statPart = 4 * mainPanel + subPanel + subtwo;
    }

    const atk = Number(resolved.attack?.panel) || 0;
    const dmgPct = Number(resolved.damageDetail?.panel) || 0;
    const fdMult = finalDamageMultiplier(collectFinalDamageSources(snapshot, combat));
    let weaponMult = 1.2;
    if (typeof WeaponTypeMap !== 'undefined'
      && typeof WeaponTypeMap.getEquippedWeaponMultiplier === 'function'
      && typeof UiEquipModule !== 'undefined') {
      weaponMult = WeaponTypeMap.getEquippedWeaponMultiplier(
        (slotId) => UiEquipModule.getWornEntry?.(slotId),
        ctx?.jobName || '',
      );
    } else if (typeof WeaponTypeMap !== 'undefined'
      && typeof WeaponTypeMap.getWeaponMultiplierByJobName === 'function') {
      weaponMult = WeaponTypeMap.getWeaponMultiplierByJobName(ctx?.jobName || '');
    }

    const value = weaponMult * statPart * (atk / 100) * (1 + dmgPct / 100) * fdMult;
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.floor(value);
  }

  /** 裝備冷卻減少為固定秒數（潛能「所有技能冷卻時間 -N秒」）；% 來源尚無 → 不加 */
  function readCooldownSeconds(snapshot) {
    if (!snapshot) return 0;
    let sec = 0;
    const keys = ['冷卻時間減少', '所有技能冷卻時間'];
    const soak = (pot) => {
      if (!pot) return;
      if (pot.value && pot.suffix !== '%') {
        sec += Math.abs(Number(pot.value) || 0);
      }
      (pot.texts || []).forEach((text) => {
        const m = String(text).match(/(-?\d+)\s*秒/);
        if (m) sec += Math.abs(Number(m[1]) || 0);
      });
      // value 為空但 count 來自「-N秒」整句當 key 時，從 key 本身無法取；改掃 texts
    };
    keys.forEach((k) => {
      soak(snapshot.potMain?.[k]);
      soak(snapshot.potAdd?.[k]);
      const extra = snapshot.extraTotals?.[k];
      if (extra && !extra.isPercent) sec += Math.abs(Number(extra.total) || 0);
      if (snapshot.soulOptions?.[k] != null) {
        const meta = snapshot.soulOptionMeta?.[k];
        if (meta !== '%') sec += Math.abs(Number(snapshot.soulOptions[k]) || 0);
      }
    });
    // 潛能整句當 texts／偶發 key 含秒數
    const scanAgg = (agg) => {
      if (!agg) return;
      Object.entries(agg).forEach(([label, pot]) => {
        if (!/冷卻時間/.test(label)) return;
        if (keys.includes(label)) return; // 已處理
        if (pot?.value && pot.suffix !== '%') sec += Math.abs(Number(pot.value) || 0);
        (pot?.texts || []).forEach((text) => {
          const m = String(text).match(/(-?\d+)\s*秒/);
          if (m) sec += Math.abs(Number(m[1]) || 0);
        });
        const m2 = label.match(/(-?\d+)\s*秒/);
        if (m2) sec += Math.abs(Number(m2[1]) || 0);
      });
    };
    scanAgg(snapshot.potMain);
    scanAgg(snapshot.potAdd);
    return sec;
  }

  function readValue(snapshot, slot, combat) {
    if (!snapshot && !combat) return 0;
    const { key, source } = slot;

    if (source === 'cooldownSec') {
      return readCooldownSeconds(snapshot);
    }
    if (source === 'panelAttack') {
      return calcPanelAttack(snapshot || {}, combat);
    }
    if (source === 'finalDamage') {
      return finalDamageEquivalentPercent(snapshot || {}, combat);
    }

    const fromPanel = readCombatPanelValue(snapshot || {}, slot, combat);
    if (fromPanel != null) return fromPanel;

    if (source === 'zero') return 0;
    if (source === 'starSum') return Number(snapshot?.starSum) || 0;
    if (source === 'ied') {
      if (snapshot?.iedTotal != null) return Number(snapshot.iedTotal) || 0;
      if (typeof EquipStatPanel !== 'undefined' && EquipStatPanel.combineIgnoreDefense) {
        return EquipStatPanel.combineIgnoreDefense(snapshot?.iedSources || []);
      }
      return 0;
    }
    if (source === 'main') {
      const row = snapshot?.mainTotals?.[key];
      const base = Number(row?.total) || 0;
      const ex = Number(snapshot?.exceptionalTotals?.[key]) || 0;
      // 攻擊力另加靈魂 flat
      let soul = 0;
      if (key === '攻擊力') soul = Number(snapshot?.soulFlat?.['攻擊力']) || 0;
      if (key === '魔法攻擊力') soul = Number(snapshot?.soulFlat?.['魔法攻擊力']) || 0;
      const flat = base + ex + soul
        + ((key === 'STR' || key === 'DEX' || key === 'INT' || key === 'LUK')
          ? allStatFlatFromSet(snapshot)
          : 0);

      // 四屬：基礎 × (1 + 主屬% + 全屬%)
      if (STAT_PERCENT_KEYS[key]) {
        const statPct = sumPercentSources(snapshot, STAT_PERCENT_KEYS[key]);
        const allPct = sumPercentSources(snapshot, ALL_STAT_PERCENT_KEYS);
        return applyPercent(flat, statPct + allPct);
      }
      // 物／魔攻：基礎 × (1 + 攻擊%)
      if (key === '攻擊力') {
        return applyPercent(flat, sumPercentSources(snapshot, ATK_PERCENT_KEYS));
      }
      if (key === '魔法攻擊力') {
        return applyPercent(flat, sumPercentSources(snapshot, MAD_PERCENT_KEYS));
      }
      if (key === '最大HP') {
        return applyPercent(flat, sumPercentSources(snapshot, ['最大HP%']));
      }
      if (key === '最大MP') {
        return applyPercent(flat, sumPercentSources(snapshot, ['最大MP%']));
      }
      return flat;
    }
    if (source === 'extra') {
      return Number(snapshot?.extraTotals?.[key]?.total) || 0;
    }
    if (source === 'extraOrEx') {
      return sumAdditiveStat(snapshot || {}, key);
    }
    return 0;
  }

  /** 加總：裝備 extra + 卓越 + 潛能 + 靈魂（同名％／數值） */
  function sumAdditiveStat(snapshot, key) {
    const aliases = STAT_KEY_ALIASES[key] || [key];
    let total = 0;
    aliases.forEach((k) => {
      total += Number(snapshot.extraTotals?.[k]?.total) || 0;
      total += Number(snapshot.exceptionalTotals?.[k]) || 0;
      total += Number(snapshot.soulOptions?.[k]) || 0;
      const potM = snapshot.potMain?.[k];
      const potA = snapshot.potAdd?.[k];
      if (potM?.value) total += Number(potM.value) || 0;
      if (potA?.value) total += Number(potA.value) || 0;
    });
    return total;
  }

  /** 顯示用別名（潛能／WZ 標籤差異） */
  const STAT_KEY_ALIASES = {
    傷害: ['傷害', '總傷害'],
    BOSS怪物傷害: ['BOSS怪物傷害', 'Boss怪物傷害', 'BOSS傷害'],
    爆擊機率: ['爆擊機率', '爆擊率'],
    爆擊傷害: ['爆擊傷害'],
    Buff持續時間: ['Buff持續時間', 'BUFF持續時間'],
    冷卻時間減少: ['冷卻時間減少', '所有技能冷卻時間'],
    無視冷卻時間: ['無視冷卻時間'],
    無視屬性抗性: ['無視屬性抗性'],
    狀態異常追加傷害: ['狀態異常追加傷害', '狀態異常傷害'],
    增加召喚獸持續時間: ['增加召喚獸持續時間', '召喚獸持續時間'],
    一般怪物傷害: ['一般怪物傷害'],
    最終傷害: ['最終傷害'],
    楓幣獲得量: ['楓幣獲得量', '楓幣獲得量%'],
    道具掉落率: ['道具掉落率', '道具掉落率%'],
    獲得追加經驗值: ['獲得追加經驗值', '額外獲得經驗值', '經驗值獲得量', '經驗獲得量'],
  };

  function refresh() {
    if (!inited || !open) return;
    let snapshot = null;
    try {
      if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.buildSnapshot === 'function') {
        snapshot = EquipStatPanel.buildSnapshot();
      }
    } catch (err) {
      console.error('[UiCharacterInfo] snapshot', err);
    }

    // 確保戰力面板已寫入 CombatPower
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }

    let combat = null;
    try {
      if (typeof CombatPower !== 'undefined' && typeof CombatPower.resolveCurrentInputs === 'function') {
        combat = CombatPower.resolveCurrentInputs(snapshot);
      }
    } catch (err) {
      console.error('[UiCharacterInfo] combat resolve', err);
    }

    RENDER_SLOTS.forEach((slot) => {
      const el = document.querySelector(`.uci-num[data-stat-id="${slot.id}"]`);
      if (!el) return;
      const value = readValue(snapshot, slot, combat);
      // 缺資料一律顯示 0（% 則 0%；秒則 0秒）
      el.textContent = formatNumber(value, slot);
      el.classList.toggle('is-empty', !value);
    });

    // 戰鬥力：formatPower + CombatPower.calculatePower
    const ap = $('uciAttackPower');
    if (ap) {
      const power = getCombatPower();
      if (typeof formatPower !== 'function' || power == null || !Number.isFinite(Number(power))) {
        ap.textContent = '—';
      } else {
        ap.textContent = formatPower(power);
      }
    }
    if (typeof CombatEfficiencyPanel !== 'undefined') {
      CombatEfficiencyPanel.refresh?.();
    }
  }

  /** 戰鬥力數值來源：CombatPower 公式（角色欄位第 3 點前多為 0） */
  function getCombatPower() {
    if (typeof CombatPower === 'undefined' || typeof CombatPower.calculateCurrentPower !== 'function') {
      return null;
    }
    let snapshot = null;
    try {
      if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.buildSnapshot === 'function') {
        snapshot = EquipStatPanel.buildSnapshot();
      }
    } catch (err) {
      console.error('[UiCharacterInfo] combat snapshot', err);
    }
    const result = CombatPower.calculateCurrentPower(snapshot);
    return CombatPower.powerValue(result);
  }

  function bindDrag() {
    const root = $('uciRoot');
    if (!root || typeof PanelDrag === 'undefined') return;
    PanelDrag.enable(root, {
      handle: '#uciDragHandle',
      storageKey: 'ui.drag.characterInfo',
      title: '拖曳視窗',
    });
  }

  function bind() {
    $('btnViewCharacter')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(!open);
    });
    $('uciClose')?.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
    });
    bindDrag();
  }

  function init() {
    if (inited) return;
    ensureDom();
    inited = true;
    bind();
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.init?.();
      CharacterCombatPanel.syncToCombatPower?.();
    }
    setOpen(false);
    refresh();
    if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.setOpen === 'function') {
      EquipStatPanel.setOpen(false);
    }
  }

  return {
    init,
    refresh,
    setOpen,
    toggle() { setOpen(!open); },
    isOpen: () => !!open,
    getCombatPower,
  };
})();

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    UiCharacterInfo.init();
  });
}
