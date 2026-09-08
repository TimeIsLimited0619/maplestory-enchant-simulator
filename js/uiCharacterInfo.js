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
   * page：底部實用／防禦區翻頁（1=utility 2=defense）；無 page 則常駐
   * click：clickRangeLT/RB
   */
  const STAT_SLOTS = [
    // 主屬區
    { id: 0, numPos: [217, 49], key: '最大HP', title: '最大HP', source: 'main', click: [7, 48, 222, 64], aliases: ['最大HP', '最大HP%', 'MaxHP', 'MaxHP%'] },
    { id: 1, numPos: [425, 49], key: '最大MP', title: '最大MP', source: 'main', click: [227, 48, 442, 64], aliases: ['最大MP', '最大MP%', 'MaxMP', 'MaxMP%'] },
    { id: 2, numPos: [217, 71], key: 'STR', title: 'STR', source: 'main', click: [7, 70, 222, 86] },
    { id: 3, numPos: [425, 71], key: 'DEX', title: 'DEX', source: 'main', click: [227, 70, 442, 86] },
    { id: 4, numPos: [217, 93], key: 'INT', title: 'INT', source: 'main', click: [7, 92, 222, 108] },
    { id: 5, numPos: [425, 93], key: 'LUK', title: 'LUK', source: 'main', click: [227, 92, 442, 108] },
    // 攻擊區（attackFont）
    { id: 7, numPos: [217, 132], key: '屬性攻擊力', title: '屬性攻擊力', source: 'panelAttack', format: 'power', click: [5, 131, 220, 147] },
    { id: 6, numPos: [437, 132], key: '傷害', title: '傷害', source: 'extraOrEx', percent: true, click: [227, 131, 442, 147] },
    { id: 9, numPos: [217, 154], key: '最終傷害', title: '最終傷害', source: 'finalDamage', percent: true, click: [5, 153, 220, 169] },
    { id: 8, numPos: [437, 154], key: 'BOSS怪物傷害', title: 'BOSS怪物傷害', source: 'extraOrEx', percent: true, click: [227, 153, 442, 169] },
    { id: 12, numPos: [217, 176], key: '無視防禦率', title: '無視防禦率', source: 'ied', percent: true, click: [5, 175, 220, 191] },
    { id: 11, numPos: [437, 176], key: '一般怪物傷害', title: '一般怪物傷害', source: 'extraOrEx', percent: true, click: [227, 175, 442, 191] },
    { id: 10, numPos: [217, 198], key: '攻擊力', title: '攻擊力', source: 'main', click: [5, 197, 220, 213] },
    { id: 18, numPos: [437, 198], key: '爆擊機率', title: '爆擊機率', source: 'extraOrEx', percent: true, click: [227, 197, 442, 213] },
    { id: 13, numPos: [217, 220], key: '魔法攻擊力', title: '魔法攻擊力', source: 'main', click: [5, 219, 220, 235] },
    { id: 21, numPos: [437, 220], key: '爆擊傷害', title: '爆擊傷害', source: 'extraOrEx', percent: true, click: [227, 219, 442, 235] },
    { id: 14, numPos: [217, 242], key: '冷卻時間減少', title: '冷卻時間減少', source: 'cooldownSec', format: 'sec', click: [5, 241, 220, 257] },
    { id: 16, numPos: [437, 242], key: 'Buff持續時間', title: 'Buff持續時間', source: 'extraOrEx', percent: true, click: [227, 241, 442, 257] },
    { id: 17, numPos: [217, 264], key: '無視冷卻時間', title: '無視冷卻時間', source: 'extraOrEx', percent: true, click: [5, 263, 220, 279] },
    { id: 15, numPos: [437, 264], key: '無視屬性抗性', title: '無視屬性抗性', source: 'extraOrEx', percent: true, click: [227, 263, 442, 279] },
    { id: 20, numPos: [217, 286], key: '狀態異常追加傷害', title: '狀態異常追加傷害', source: 'extraOrEx', percent: true, click: [5, 285, 220, 301] },
    { id: 19, numPos: [437, 286], key: '增加召喚獸持續時間', title: '增加召喚獸持續時間', source: 'extraOrEx', percent: true, click: [227, 285, 442, 301] },
    // 實用區 page1（utilityFont）
    { id: 22, numPos: [217, 325], key: '楓幣獲得量', title: '楓幣獲得量', source: 'extraOrEx', percent: true, page: 1, click: [5, 324, 220, 340] },
    { id: 23, numPos: [437, 325], key: '星力', title: '星力', source: 'starSum', page: 1, click: [227, 324, 442, 340] },
    { id: 24, numPos: [217, 347], key: '道具掉落率', title: '道具掉落率', source: 'extraOrEx', percent: true, page: 1, click: [5, 346, 220, 362] },
    { id: 25, numPos: [437, 347], key: '神秘力量', title: '神秘力量', source: 'zero', page: 1, click: [227, 346, 442, 362] },
    { id: 26, numPos: [217, 369], key: '獲得追加經驗值', title: '獲得追加經驗值', source: 'extraOrEx', percent: true, page: 1, click: [5, 368, 220, 384] },
    { id: 27, numPos: [437, 369], key: '真實力量', title: '真實力量', source: 'zero', page: 1, click: [227, 368, 442, 384] },
    // 防禦區 page2（defenseFont）
    { id: 28, numPos: [217, 325], key: '防禦力', title: '防禦力', source: 'defense', page: 2, click: [5, 324, 220, 340] },
    { id: 29, numPos: [437, 325], key: '狀態異常耐性', title: '狀態異常耐性', source: 'extraOrEx', page: 2, click: [227, 324, 442, 340] },
    { id: 30, numPos: [217, 347], key: '移動速度', title: '移動速度', source: 'extraOrEx', percent: true, page: 2, click: [5, 346, 220, 362] },
    { id: 31, numPos: [437, 347], key: '跳躍力', title: '跳躍力', source: 'extraOrEx', percent: true, page: 2, click: [227, 346, 442, 362] },
    { id: 32, numPos: [217, 369], key: '格擋', title: '格擋', source: 'extraOrEx', percent: true, page: 2, click: [5, 368, 220, 384] },
    { id: 33, numPos: [437, 369], key: '攻擊速度', title: '攻擊速度', source: 'attackSpeed', format: 'speed', page: 2, click: [227, 368, 442, 384] },
  ];

  const RENDER_SLOTS = STAT_SLOTS;

  let inited = false;
  let open = false;
  let bottomPage = 1;

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
    if (slot?.format === 'speed') {
      const min = (typeof WeaponTypeMap !== 'undefined' && WeaponTypeMap.ATTACK_SPEED_STAGE_MIN) || 1;
      const max = (typeof WeaponTypeMap !== 'undefined' && WeaponTypeMap.ATTACK_SPEED_STAGE_MAX) || 8;
      const stage = Math.max(min, Math.min(max, Math.round(v) || 4));
      return `第${stage}階段`;
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
   * 面板攻速階段（1～8，越大越快）＝ 10 − (武器 WZ + 技能 modifiers)。
   */
  function readAttackSpeedStage() {
    if (typeof WeaponTypeMap === 'undefined') return 4;
    const jobName = typeof CharacterCombatPanel !== 'undefined'
      ? CharacterCombatPanel.getState?.()?.jobName
      : '';
    const getWorn = typeof UiEquipModule !== 'undefined'
      ? (slotId) => UiEquipModule.getWornEntry?.(slotId)
      : null;
    if (typeof WeaponTypeMap.getEquippedAttackSpeedStage === 'function') {
      return WeaponTypeMap.getEquippedAttackSpeedStage(getWorn, jobName);
    }
    const wz = WeaponTypeMap.getEquippedWzAttackSpeed?.(getWorn, jobName)
      || WeaponTypeMap.DEFAULT_WZ_ATTACK_SPEED || 6;
    const mod = WeaponTypeMap.getSpeedModifiers?.() || 0;
    return WeaponTypeMap.calculateAttackSpeedStage?.(wz, mod) ?? Math.min(8, Math.max(1, 10 - (wz + mod)));
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
    STR: ['STR%', 'STR', '力量%', '力量', '全屬性%', '全屬性'],
    DEX: ['DEX%', 'DEX', '敏捷%', '敏捷', '全屬性%', '全屬性'],
    INT: ['INT%', 'INT', '智力%', '智力', '全屬性%', '全屬性'],
    LUK: ['LUK%', 'LUK', '幸運%', '幸運', '全屬性%', '全屬性'],
  };

  const ATK_PERCENT_KEYS = ['攻擊力%', '物理攻擊力%', '攻擊力', '物理攻擊力'];
  const MAD_PERCENT_KEYS = ['攻擊力%', '魔法攻擊力%', '攻擊力', '魔法攻擊力'];

  function allStatFlatFromSet(snapshot) {
    let n = 0;
    const row = snapshot?.extraTotals?.['全屬性'];
    if (row && !row.isPercent) n += Number(row.total) || 0;
    // 潛能全屬性固定值
    ['全屬性'].forEach((key) => {
      [snapshot?.potMain?.[key], snapshot?.potAdd?.[key]].forEach((pot) => {
        if (!pot?.value || pot.suffix === '%') return;
        n += Number(pot.value) || 0;
      });
    });
    return n;
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
        <div class="uci-detail-stat" id="uciDetailStat" data-page="1">
          <div class="uci-attack-back" aria-hidden="true"></div>
          <div class="uci-main-stat-back" aria-hidden="true"></div>
          <div class="uci-main-stat-font" aria-hidden="true"></div>
          <div class="uci-mp-title" aria-hidden="true"></div>
          <div class="uci-attack-font" aria-hidden="true"></div>
          <div class="uci-utility-back" aria-hidden="true"></div>
          <div class="uci-utility-font" aria-hidden="true"></div>
          <div class="uci-defense-font" aria-hidden="true"></div>
          <button type="button" class="uci-lvup uci-lvup-hp uci-lvup-live" data-ap-stat="hp" aria-label="分配 HP"></button>
          <button type="button" class="uci-lvup uci-lvup-mp uci-lvup-live" data-ap-stat="mp" aria-label="分配 MP"></button>
          <button type="button" class="uci-lvup uci-lvup-str uci-lvup-live" data-ap-stat="str" aria-label="分配 STR"></button>
          <button type="button" class="uci-lvup uci-lvup-dex uci-lvup-live" data-ap-stat="dex" aria-label="分配 DEX"></button>
          <button type="button" class="uci-lvup uci-lvup-int uci-lvup-live" data-ap-stat="int" aria-label="分配 INT"></button>
          <button type="button" class="uci-lvup uci-lvup-luk uci-lvup-live" data-ap-stat="luk" aria-label="分配 LUK"></button>
          <button type="button" class="uci-ap-btn" id="uciApBtn" aria-label="開關 AP 分配"></button>
          <button type="button" class="uci-btn-hyper" id="uciBtnHyper" aria-label="極限屬性"></button>
          <button type="button" class="uci-btn-ability" tabindex="-1" aria-hidden="true"></button>
          <div class="uci-attack-power" id="uciAttackPower">—</div>
          <div class="uci-nums" id="uciNums"></div>
          <div class="uci-hits" id="uciHits"></div>
          <div class="uci-wheel-zone" id="uciWheelZone" title="滾輪切換能力值頁面"></div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    if (typeof UiHyperStat !== 'undefined') UiHyperStat.init(root);
    if (typeof UiApDistribution !== 'undefined') UiApDistribution.init($('uciDetailStat'));
    if (typeof UiStatInfo !== 'undefined') UiStatInfo.init(root);

    const nums = $('uciNums');
    const hits = $('uciHits');
    RENDER_SLOTS.forEach((slot) => {
      const el = document.createElement('div');
      el.className = 'uci-num is-empty';
      el.dataset.statId = String(slot.id);
      if (slot.page) el.dataset.page = String(slot.page);
      el.style.left = `${slot.numPos[0]}px`;
      el.style.top = `${slot.numPos[1]}px`;
      el.textContent = '0';
      nums.appendChild(el);

      if (slot.click && hits) {
        const [l, t, r, b] = slot.click;
        const hit = document.createElement('button');
        hit.type = 'button';
        hit.className = 'uci-stat-hit';
        hit.dataset.statId = String(slot.id);
        if (slot.page) hit.dataset.page = String(slot.page);
        hit.style.left = `${l}px`;
        hit.style.top = `${t}px`;
        hit.style.width = `${r - l}px`;
        hit.style.height = `${b - t}px`;
        hit.setAttribute('aria-label', slot.title || slot.key);
        hits.appendChild(hit);
      }
    });
    syncBottomPage();
  }

  function syncBottomPage() {
    const detail = $('uciDetailStat');
    if (detail) detail.dataset.page = String(bottomPage);
    // 頁點已嵌在 utilityFont／defenseFont，不另畫 CSS dots
    detail?.querySelectorAll('.uci-stat-hit[data-page]').forEach((hit) => {
      const show = Number(hit.dataset.page) === bottomPage;
      hit.style.display = show ? 'block' : 'none';
    });
  }

  function setBottomPage(page) {
    const next = page === 2 ? 2 : 1;
    if (bottomPage === next) return;
    bottomPage = next;
    syncBottomPage();
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
    if (!open) {
      UiHyperStat?.setOpen?.(false);
      UiApDistribution?.setOpen?.(false);
      UiStatInfo?.setOpen?.(false);
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

    // 最大 HP/MP 走裝備＋角色公式，不套戰力面板主屬（惡復 main=HP 會誤用 adjDAHP）
    if (key === '最大HP' || key === '最大MP') return null;

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
    // 鬥氣層數終傷：獨立倍率（不進 skillFinal，避免與被動終傷混算）
    if (typeof SkillComboOrbs !== 'undefined' && typeof SkillComboOrbs.getModifierBonus === 'function') {
      push('鬥氣', SkillComboOrbs.getModifierBonus().finalDamR);
    }
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
   * 屬性攻擊力
   * 武器係數 × (4×主屬 + 副屬) × 總攻魔/100 × (1+(傷害%+額外傷害%)/100) × ∏(1+終傷_i%/100)
   * target: panel＝只算傷害%（角色視窗）；normal＝傷害%+一般怪物傷害%；boss＝傷害%+BOSS傷害%
   */
  function calcAttributeAttack(snapshot, combat, target) {
    if (!combat?.resolved) return 0;
    const { resolved, ctx } = combat;
    const jobCat = ctx?.jobCategory || 'normal';
    const mainPanel = Number(resolved.main?.panel) || 0;
    const subPanel = Number(resolved.sub?.panel) || 0;
    const subtwo = Number(resolved.subtwo?.panel) || 0;
    let statPart = 0;
    if (jobCat === 'xenon') {
      statPart = mainPanel + subPanel + subtwo;
    } else if (jobCat === 'da') {
      const baseHP = Number(combat?.fields?.adjDAHP) || 0;
      const equivalentMain = baseHP / 3.5 + ((mainPanel - baseHP) / 3.5) * 0.8;
      statPart = equivalentMain + subPanel;
    } else {
      statPart = 4 * mainPanel + subPanel + subtwo;
    }

    const atk = Number(resolved.attack?.panel) || 0;
    const dmgPct = Number(resolved.damageDetail?.panel) || 0;
    let extraPct = 0;
    if (target === 'boss') {
      extraPct = (Number(resolved.bossDamageDetail?.panel) || 0)
        + (Number(resolved.bossDamageDetail?.skill) || 0);
    } else if (target === 'normal') {
      extraPct = Number(readValue(snapshot || {}, {
        key: '一般怪物傷害',
        source: 'extraOrEx',
        percent: true,
      }, combat)) || 0;
    }
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

    const value = weaponMult * statPart * (atk / 100) * (1 + (dmgPct + extraPct) / 100) * fdMult;
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.floor(value);
  }

  function calcPanelAttack(snapshot, combat) {
    return calcAttributeAttack(snapshot, combat, 'panel');
  }

  /** 狩獵傷害快取：連鎖／多段同幀會打上百次，不可每次 rebuild snapshot + sync */
  let huntCombatCache = null;
  const HUNT_COMBAT_CACHE_TTL_MS = 48;

  function invalidateHuntCombatCache() {
    huntCombatCache = null;
  }

  function nowPerfMs() {
    return (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();
  }

  /**
   * @param {{ force?: boolean, sync?: boolean, ttlMs?: number }} [opts]
   * sync 預設 true（快取未命中時刷新 CombatPower 欄位）；熱路徑靠短 TTL 合併
   */
  function resolveHuntCombat(opts = {}) {
    const force = !!opts.force;
    const ttl = opts.ttlMs != null ? Number(opts.ttlMs) : HUNT_COMBAT_CACHE_TTL_MS;
    const t = nowPerfMs();
    if (!force && huntCombatCache && (t - huntCombatCache.at) <= ttl) {
      return huntCombatCache.pack;
    }

    let snapshot = null;
    try {
      if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.buildSnapshot === 'function') {
        snapshot = EquipStatPanel.buildSnapshot();
      }
    } catch (_) { /* ignore */ }
    // 只在重建快取時 sync；不要在每一次 rollHuntHit 重寫面板
    if (opts.sync !== false && typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
    let combat = null;
    try {
      if (typeof CombatPower !== 'undefined' && typeof CombatPower.resolveCurrentInputs === 'function') {
        combat = CombatPower.resolveCurrentInputs(snapshot);
      }
    } catch (_) { /* ignore */ }
    const pack = { snapshot, combat };
    huntCombatCache = { at: t, pack };
    return pack;
  }

  /** 狩獵單下傷害：屬性攻擊力公式，傷害% 再加一般或 BOSS 傷害% */
  function getHuntHitDamage(isBoss) {
    const { snapshot, combat } = resolveHuntCombat();
    return calcAttributeAttack(snapshot, combat, isBoss ? 'boss' : 'normal');
  }

  function readHuntCritRateFromPack(pack, extraPct = 0) {
    const snapshot = pack?.snapshot || {};
    const combat = pack?.combat || null;
    let rate = Number(readValue(snapshot, {
      key: '爆擊機率',
      source: 'extraOrEx',
      percent: true,
    }, combat)) || 0;
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
      rate += Number(SkillModifiers.getTotals().critRate) || 0;
    }
    rate += Number(extraPct) || 0;
    return Math.max(0, Math.min(100, rate)) / 100;
  }

  function readHuntCritRate(extraPct = 0) {
    return readHuntCritRateFromPack(resolveHuntCombat(), extraPct);
  }

  /** 狩獵命中：擲爆擊後套用 1.35 + 爆擊傷害%；opts.damagePct 為技能傷害% */
  function rollHuntHit(isBoss, opts = {}) {
    const pack = resolveHuntCombat();
    const base = calcAttributeAttack(
      pack.snapshot,
      pack.combat,
      isBoss ? 'boss' : 'normal',
    );
    const pct = Number(opts?.damagePct);
    let scaled = Number.isFinite(pct) && pct > 0
      ? Math.max(0, Math.floor(base * pct / 100))
      : base;
    // 武器／魔法熟練度：傷害落在 [mastery%, 100%]（無熟練度時維持固定值）
    if (scaled > 0 && typeof SkillModifiers !== 'undefined'
      && typeof SkillModifiers.getTotals === 'function') {
      const masteryPct = Math.max(0, Math.min(95, Number(SkillModifiers.getTotals().mastery) || 0));
      if (masteryPct > 0) {
        const floor = masteryPct / 100;
        const factor = floor + Math.random() * (1 - floor);
        scaled = Math.max(1, Math.floor(scaled * factor));
      }
    }
    const critMult = Number(pack.combat?.resolved?.rawCritSum) || 1.35;
    const isCritical = scaled > 0 && (
      !!opts.forceCritical || Math.random() < readHuntCritRateFromPack(pack, opts.critRateBonus)
    );
    const dmg = isCritical ? Math.floor(scaled * critMult) : scaled;
    return { dmg, isCritical: !!isCritical };
  }

  function extraFlatStat(snapshot, key) {
    if (!snapshot) return 0;
    let n = 0;
    const extra = snapshot.extraTotals?.[key];
    if (extra && !extra.isPercent) n += Number(extra.total) || 0;
    if (snapshot.soulOptions?.[key] != null) {
      const meta = snapshot.soulOptionMeta?.[key];
      if (meta !== '%') n += Number(snapshot.soulOptions[key]) || 0;
    }
    const potM = snapshot.potMain?.[key];
    const potA = snapshot.potAdd?.[key];
    if (potM && potM.suffix !== '%') n += Number(potM.value) || 0;
    if (potA && potA.suffix !== '%') n += Number(potA.value) || 0;
    return n;
  }

  function extraFlatStatAliases(snapshot, keys) {
    return (keys || []).reduce((sum, key) => sum + extraFlatStat(snapshot, key), 0);
  }

  const HP_FLAT_KEYS = ['最大HP', 'MaxHP', 'HP'];
  const HP_PERCENT_KEYS = ['最大HP%', '最大HP', 'MaxHP%', 'MaxHP', 'HP%', 'HP'];
  const MP_FLAT_KEYS = ['最大MP', 'MaxMP', 'MP'];
  const MP_PERCENT_KEYS = ['最大MP%', '最大MP', 'MaxMP%', 'MaxMP', 'MP%', 'MP'];

  function computeCharacterMaxHp(snapshot) {
    const level = Math.max(1, Number(CharacterProgression?.getState?.()?.level) || 1);
    const levelBase = typeof CharacterProgression !== 'undefined'
      && typeof CharacterProgression.getLevelBaseHp === 'function'
      ? CharacterProgression.getLevelBaseHp(level)
      : (50 + Math.max(0, level - 1) * 12);
    const row = snapshot?.mainTotals?.['最大HP'];
    const equipFlat = Number(row?.total) || 0;
    const ex = Number(snapshot?.exceptionalTotals?.['最大HP']) || 0;
    const extraFlat = extraFlatStatAliases(snapshot, HP_FLAT_KEYS);
    const bonus = typeof CharacterProgression !== 'undefined'
      ? (CharacterProgression.getCombatBonus?.() || {})
      : {};
    let skillFlat = 0;
    let skillPct = 0;
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
      const mods = SkillModifiers.getTotals();
      skillFlat = (Number(mods.flatHpPerLevel) || 0) * level
        + (Number(mods.flatHp) || 0);
      skillPct = Number(mods.mhpR) || 0;
    }
    const pct = sumPercentSources(snapshot, HP_PERCENT_KEYS)
      + (Number(bonus.hpPercent) || 0)
      + skillPct;
    return Math.max(1, applyPercent(
      levelBase + equipFlat + ex + extraFlat + (Number(bonus.hp) || 0) + skillFlat,
      pct,
    ));
  }

  /** 狩獵／藥水用最大 HP（含裝備、AP、技能） */
  function getHuntMaxHp() {
    let snapshot = null;
    try {
      if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.buildSnapshot === 'function') {
        snapshot = EquipStatPanel.buildSnapshot();
      }
    } catch (_) { snapshot = null; }
    return computeCharacterMaxHp(snapshot);
  }

  /** 狩獵被擊減傷用：物防、四圍、職業係數 */
  function getHuntDamageMitigation() {
    const { snapshot, combat } = resolveHuntCombat();
    const str = Number(readValue(snapshot, { key: 'STR', source: 'main' }, combat)) || 0;
    const dex = Number(readValue(snapshot, { key: 'DEX', source: 'main' }, combat)) || 0;
    const int = Number(readValue(snapshot, { key: 'INT', source: 'main' }, combat)) || 0;
    const luk = Number(readValue(snapshot, { key: 'LUK', source: 'main' }, combat)) || 0;
    const jobName = (typeof CharacterCombatPanel !== 'undefined'
      ? CharacterCombatPanel.getState?.()?.jobName
      : null) || '劍士';
    const job = (typeof CombatJobs !== 'undefined' && typeof CombatJobs.getJobByName === 'function')
      ? CombatJobs.getJobByName(jobName)
      : null;
    const skillLine = job?.skillLine || 'warrior';
    const { def } = getHuntDefense();
    return {
      def,
      str,
      dex,
      int,
      luk,
      isWarrior: skillLine === 'warrior',
      baselineKind: skillLine === 'wizard' ? 'mage' : 'warrior',
    };
  }

  /** 狩獵用玩家防禦力（正式服已無獨立魔法防禦） */
  function getHuntDefense() {
    let snapshot = null;
    try {
      if (typeof EquipStatPanel !== 'undefined' && typeof EquipStatPanel.buildSnapshot === 'function') {
        snapshot = EquipStatPanel.buildSnapshot();
      }
    } catch (_) { snapshot = null; }
    let def = (Number(readValue(snapshot, { key: '防禦力', source: 'main' }, null)) || 0)
      + extraFlatStat(snapshot, '防禦力')
      + extraFlatStat(snapshot, '物理防禦力')
      + extraFlatStat(snapshot, '魔法防禦力');
    if (!snapshot && typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
      def += Number(SkillModifiers.getTotals().flatPdd) || 0;
    }
    const value = Math.max(0, def);
    return {
      def: value,
      mdef: value,
    };
  }

  /**
   * 迴避率：本模擬一律不套用（含 DEX/LUK／裝備 EVA／技能 er），
   * 避免精靈遊俠等職業生存過強。
   */
  function getHuntAvoidability() {
    return 0;
  }

  function getHuntBlockPct() {
    const { snapshot, combat } = resolveHuntCombat();
    const n = Number(readValue(snapshot, {
      key: '格擋',
      source: 'extraOrEx',
      percent: true,
    }, combat)) || 0;
    return Math.max(0, Math.min(100, n));
  }

  function mobAccuracyForLevel(mobLevel) {
    const lv = Math.max(1, Math.floor(Number(mobLevel) || 1));
    return lv * 10;
  }

  /** 怪物命中玩家：不判定 Miss（迴避關閉），僅 guard（格擋）／命中 */
  function rollMobHitOutcome(mobLevel) {
    void mobLevel;
    const block = getHuntBlockPct();
    if (block > 0 && Math.random() * 100 < block) return 'block';
    return 'hit';
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
    if (source === 'defense') {
      return getHuntDefense().def;
    }
    if (source === 'attackSpeed') {
      return readAttackSpeedStage();
    }

    const fromPanel = readCombatPanelValue(snapshot || {}, slot, combat);
    if (fromPanel != null) return fromPanel;

    let n = 0;
    if (source === 'ied') {
      if (snapshot?.iedTotal != null) n = Number(snapshot.iedTotal) || 0;
      else if (typeof EquipStatPanel !== 'undefined' && EquipStatPanel.combineIgnoreDefense) {
        n = EquipStatPanel.combineIgnoreDefense(snapshot?.iedSources || []);
      }
    } else if (source === 'zero') {
      n = 0;
    } else if (source === 'starSum') {
      n = Number(snapshot?.starSum) || 0;
    } else if (source === 'main') {
      const row = snapshot?.mainTotals?.[key];
      const base = Number(row?.total) || 0;
      const ex = Number(snapshot?.exceptionalTotals?.[key]) || 0;
      let soul = 0;
      if (key === '攻擊力') soul = Number(snapshot?.soulFlat?.['攻擊力']) || 0;
      if (key === '魔法攻擊力') soul = Number(snapshot?.soulFlat?.['魔法攻擊力']) || 0;
      const potFlatKeys = {
        STR: ['STR', '力量'],
        DEX: ['DEX', '敏捷'],
        INT: ['INT', '智力'],
        LUK: ['LUK', '幸運'],
        攻擊力: ['攻擊力', '物理攻擊力'],
        魔法攻擊力: ['魔法攻擊力', '攻擊力'],
        最大HP: HP_FLAT_KEYS,
        最大MP: MP_FLAT_KEYS,
        防禦力: ['防禦力', '物理防禦力', '魔法防禦力'],
      }[key] || [key];
      let flat = base + ex + soul
        + ((key === 'STR' || key === 'DEX' || key === 'INT' || key === 'LUK')
          ? allStatFlatFromSet(snapshot)
          : 0)
        + extraFlatStatAliases(snapshot, potFlatKeys);

      // AP／技能 flat：吃％；極限屬性：不吃％（主／副屬若走戰力 panel 則此段不執行）
      let apFlat = 0;
      let hyperFlat = 0;
      let skillFlat = 0;
      if (typeof CharacterProgression !== 'undefined') {
        const apKey = { STR: 'str', DEX: 'dex', INT: 'int', LUK: 'luk' }[key];
        if (apKey) {
          apFlat = CharacterProgression.apStat?.(apKey) || CharacterProgression.AP_BASE_STAT || 0;
          const hyperLv = CharacterProgression.getState()?.hyper?.[apKey] || 0;
          hyperFlat = CharacterProgression.hyperBonusAt?.(apKey, hyperLv) || 0;
        }
      }
      if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
        const mods = SkillModifiers.getTotals();
        const flatKey = SkillModifiers.flatStatKey?.(key);
        if (flatKey) skillFlat = Number(mods[flatKey]) || 0;
      }

      const eatsPercent = !!(STAT_PERCENT_KEYS[key]
        || key === '攻擊力' || key === '魔法攻擊力'
        || key === '最大HP' || key === '最大MP');
      if (eatsPercent && (key === 'STR' || key === 'DEX' || key === 'INT' || key === 'LUK')) {
        flat += apFlat + skillFlat;
      }

      if (STAT_PERCENT_KEYS[key]) {
        const statPct = sumPercentSources(snapshot, STAT_PERCENT_KEYS[key]);
        n = applyPercent(flat, statPct) + hyperFlat;
      } else if (key === '攻擊力') {
        n = applyPercent(flat, sumPercentSources(snapshot, ATK_PERCENT_KEYS));
      } else if (key === '魔法攻擊力') {
        n = applyPercent(flat, sumPercentSources(snapshot, MAD_PERCENT_KEYS));
      } else if (key === '最大HP') {
        n = computeCharacterMaxHp(snapshot);
      } else if (key === '最大MP') {
        const bonus = typeof CharacterProgression !== 'undefined'
          ? CharacterProgression.getCombatBonus()
          : {};
        n = applyPercent(
          flat + (bonus.mp || 0),
          sumPercentSources(snapshot, MP_PERCENT_KEYS) + (bonus.mpPercent || 0),
        );
      } else {
        n = flat + apFlat + skillFlat + hyperFlat;
      }
    } else if (source === 'extra') {
      n = Number(snapshot?.extraTotals?.[key]?.total) || 0;
    } else if (source === 'extraOrEx') {
      n = sumAdditiveStat(snapshot || {}, key);
    }

    // 主四維 AP／極限／技能 flat 已在上方依吃％規則處理；此處只補其餘欄位
    if (typeof CharacterProgression !== 'undefined') {
      const bonus = CharacterProgression.getCombatBonus();
      const apKey = { STR: 'str', DEX: 'dex', INT: 'int', LUK: 'luk' }[key];
      if (!apKey) {
        if (key === '爆擊機率') n += bonus.critRate || 0;
        if (key === '無視防禦率') n += bonus.ied || 0;
        if (key === '一般怪物傷害') n += bonus.normalDmg || 0;
        if (key === '獲得追加經驗值') n += bonus.expPercent || 0;
        if (key === '神秘力量') n += bonus.arcane || 0;
      } else if (source !== 'main') {
        // 非 main 來源的四維（理論上少見）：維持舊加總
        n += CharacterProgression.apStat?.(apKey) || CharacterProgression.AP_BASE_STAT || 0;
        const hyperLv = CharacterProgression.getState()?.hyper?.[apKey] || 0;
        n += CharacterProgression.hyperBonusAt?.(apKey, hyperLv) || 0;
      }
    }
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
      const mods = SkillModifiers.getTotals();
      const flatKey = SkillModifiers.flatStatKey?.(key);
      // 主四維技能 flat 已併入吃％；其餘欄位在此加
      if (flatKey && !(source === 'main' && (key === 'STR' || key === 'DEX' || key === 'INT' || key === 'LUK'))) {
        n += Number(mods[flatKey]) || 0;
      }
      if (key === '攻擊力' || key === '魔法攻擊力') n += Number(mods.flatPad) || 0;
      if (key === '魔法攻擊力') n += Number(mods.flatMad) || 0;
      if (key === '傷害' || key === '總傷害') n += Number(mods.damR) || 0;
      if (key === 'BOSS怪物傷害' || key === 'Boss怪物傷害' || key === 'BOSS傷害') {
        n += Number(mods.bdR) || 0;
      }
      if (key === '爆擊機率') n += Number(mods.critRate) || 0;
      if (key === '爆擊傷害') n += Number(mods.critDmg) || 0;
      if (key === '最終傷害') n += Number(mods.finalDamR) || 0;
      if (key === '無視防禦率') n += Number(mods.ied) || 0;
      if (key === '防禦力' || key === '物理防禦力' || key === '魔法防禦力') n += Number(mods.flatPdd) || 0;
      if (key === '格擋') n += Number(mods.blockPct) || 0;
    }
    // 格擋實戰過強：面板／狩獵統一減半
    if (key === '格擋') n *= 0.5;
    return n;
  }

  /** 加總：裝備 extra + 卓越 + 潛能 + 靈魂（同名％／數值） */
  function sumAdditiveStat(snapshot, key) {
    const aliases = STAT_KEY_ALIASES[key] || [key];
    let total = 0;
    aliases.forEach((k) => {
      const extra = snapshot.extraTotals?.[k];
      if (extra) total += Number(extra.total) || 0;
      total += Number(snapshot.exceptionalTotals?.[k]) || 0;
      total += Number(snapshot.soulOptions?.[k]) || 0;
      const potM = snapshot.potMain?.[k];
      const potA = snapshot.potAdd?.[k];
      // 百分比欄位：只加 % 潛能；固定欄位：只加非 % 潛能
      // 多數戰鬥欄（傷害／爆擊等）本身是 %，別名含 xxx% 時兩者都收
      const wantPercent = k.endsWith('%') || key.endsWith('%')
        || key === '傷害' || key === 'BOSS怪物傷害' || key === '爆擊機率'
        || key === '爆擊傷害' || key === '一般怪物傷害' || key === '最終傷害'
        || key === '楓幣獲得量' || key === '道具掉落率' || key === '獲得追加經驗值'
        || key === 'Buff持續時間' || key === '無視冷卻時間' || key === '無視屬性抗性'
        || key === '狀態異常追加傷害' || key === '增加召喚獸持續時間' || key === '移動速度'
        || key === '跳躍力' || key === '格擋';
      [potM, potA].forEach((pot) => {
        if (!pot?.value) return;
        const isPct = pot.suffix === '%' || k.endsWith('%');
        if (wantPercent ? isPct || !pot.suffix : !isPct) {
          total += Number(pot.value) || 0;
        }
      });
    });
    return total;
  }

  /** 顯示用別名（潛能／WZ 標籤差異） */
  const STAT_KEY_ALIASES = {
    傷害: ['傷害', '傷害%', '總傷害', '總傷害%'],
    BOSS怪物傷害: [
      'BOSS怪物傷害', 'BOSS怪物傷害%', 'Boss怪物傷害', 'BOSS傷害', 'BOSS傷害%',
      '攻擊Boss怪物時傷害', '攻擊Boss怪物時傷害%',
      '攻擊BOSS怪物時傷害增加', '攻擊BOSS怪物時傷害增加%',
      'BOSS怪物攻擊時傷害', 'BOSS怪物攻擊時傷害%',
    ],
    爆擊機率: ['爆擊機率', '爆擊機率%', '爆擊率', '爆擊率%'],
    爆擊傷害: ['爆擊傷害', '爆擊傷害%'],
    Buff持續時間: ['Buff持續時間', 'Buff持續時間%', 'BUFF持續時間'],
    冷卻時間減少: ['冷卻時間減少', '所有技能冷卻時間'],
    無視冷卻時間: ['無視冷卻時間', '無視冷卻時間%'],
    無視屬性抗性: ['無視屬性抗性', '無視屬性抗性%'],
    狀態異常追加傷害: ['狀態異常追加傷害', '狀態異常追加傷害%', '狀態異常傷害'],
    增加召喚獸持續時間: ['增加召喚獸持續時間', '增加召喚獸持續時間%', '召喚獸持續時間'],
    一般怪物傷害: ['一般怪物傷害', '一般怪物傷害%'],
    最終傷害: ['最終傷害', '最終傷害%'],
    楓幣獲得量: ['楓幣獲得量', '楓幣獲得量%'],
    道具掉落率: ['道具掉落率', '道具掉落率%'],
    獲得追加經驗值: ['獲得追加經驗值', '獲得追加經驗值%', '額外獲得經驗值', '經驗值獲得量', '經驗獲得量'],
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
    if (typeof IdleHunt !== 'undefined') {
      IdleHunt.refreshDisplay?.();
    }
    if (typeof UiHyperStat !== 'undefined') UiHyperStat.refresh?.();
    if (typeof UiApDistribution !== 'undefined') UiApDistribution.refresh?.();
    if (typeof UiStatInfo !== 'undefined' && UiStatInfo.isOpen?.()) {
      const activeId = UiStatInfo.activeStatId?.();
      const slot = RENDER_SLOTS.find((s) => s.id === activeId);
      if (slot) {
        const value = readValue(snapshot, slot, combat);
        UiStatInfo.openFor(slot, snapshot, combat, value);
      }
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
    $('uciBtnHyper')?.addEventListener('click', (e) => {
      e.preventDefault();
      UiHyperStat?.toggle?.();
    });
    $('uciApBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      UiApDistribution?.toggle?.();
    });
    $('uciRoot')?.querySelectorAll('[data-ap-stat]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        CharacterProgression?.addAp?.(btn.getAttribute('data-ap-stat'), 1);
      });
    });
    $('uciDetailStat')?.addEventListener('wheel', (e) => {
      const detail = $('uciDetailStat');
      if (!detail) return;
      const rect = detail.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // vector:wheelLT/RB (1,315)–(446,404)
      if (x < 1 || x > 446 || y < 315 || y > 404) return;
      e.preventDefault();
      if (e.deltaY > 0) setBottomPage(2);
      else if (e.deltaY < 0) setBottomPage(1);
    }, { passive: false });

    $('uciHits')?.addEventListener('click', (e) => {
      const hit = e.target.closest?.('.uci-stat-hit');
      if (!hit) return;
      e.preventDefault();
      const id = Number(hit.dataset.statId);
      const slot = RENDER_SLOTS.find((s) => s.id === id);
      if (!slot || typeof UiStatInfo === 'undefined') return;
      if (UiStatInfo.isOpen?.() && UiStatInfo.activeStatId?.() === id) {
        UiStatInfo.setOpen(false);
        return;
      }
      let snapshot = null;
      let combat = null;
      try {
        if (typeof EquipStatPanel !== 'undefined') snapshot = EquipStatPanel.buildSnapshot();
      } catch (_) { /* ignore */ }
      try {
        if (typeof CharacterCombatPanel !== 'undefined') CharacterCombatPanel.syncToCombatPower?.();
        if (typeof CombatPower !== 'undefined') combat = CombatPower.resolveCurrentInputs(snapshot);
      } catch (_) { /* ignore */ }
      const value = readValue(snapshot, slot, combat);
      UiStatInfo.openFor(slot, snapshot, combat, value);
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
    getHuntHitDamage,
    rollHuntHit,
    invalidateHuntCombatCache,
    getHuntDefense,
    getHuntDamageMitigation,
    getHuntAvoidability,
    getHuntBlockPct,
    rollMobHitOutcome,
    getHuntMaxHp,
    collectFinalDamageSources,
    setBottomPage,
    getBottomPage: () => bottomPage,
  };
})();

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    UiCharacterInfo.init();
  });
}
