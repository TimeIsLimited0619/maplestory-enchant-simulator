/**
 * 武器 itemId 四碼種類 → 武器類型／職業
 * 編碼：8 碼 itemId 去掉開頭 0 後取前 4 碼（例 01215041 → 1215、01302000 → 1302）
 *
 * exclusive: 專屬職業，穿上即可鎖定 CombatJobs 名稱
 * jobGroup: 五大職業（對應 reqJob 位元）；共用武器先建檔、暫不自動選職
 */
const WeaponTypeMap = (() => {
  const JOB_GROUP_REQ = {
    劍士: 1,
    法師: 2,
    弓箭手: 4,
    盜賊: 8,
    海盜: 16,
  };

  /** 專屬：種類碼 → 唯一職業 */
  const EXCLUSIVE_ROWS = [
    ['1212', '閃亮克魯', '夜光'],
    ['1213', '調節器', '阿戴爾'],
    ['1214', '龍息射手', '凱殷'],
    ['1215', '長劍', '蓮'],
    ['1222', '靈魂射手', '天使破壞者'],
    ['1232', '魔劍', '惡魔復仇者'],
    ['1242', '能量劍', '傑諾'],
    ['1252', '記憶長杖', '琳恩'],
    ['1254', '陰陽扇', '陰陽師'],
    ['1262', 'ESP限制器', '凱內西斯'],
    ['1272', '鎖鏈', '卡蒂娜'],
    ['1282', '魔法護腕', '伊利恩'],
    ['1292', '仙扇', '虎影'],
    ['1362', '手杖', '幻影俠盜'],
    ['1403', '武拳', '墨玄'],
    ['1404', '環刃', '卡莉'],
    ['1522', '雙弩槍', '精靈遊俠'],
    ['1532', '加農砲', '重砲指揮官'],
    ['1542', '太刀', '劍豪'],
    ['1562', '琉', '神之子'],
    ['1572', '璃', '神之子'],
    ['1582', '重拳槍', '爆拳槍神'],
    ['1592', '古代之弓', '開拓者'],
  ];

  /** 共用：種類碼 → 五大職業（後續再拆具體職業） */
  const SHARED_ROWS = [
    ['1302', '單手劍', '劍士'],
    ['1312', '單手斧', '劍士'],
    ['1322', '單手棍', '劍士'],
    ['1402', '雙手劍', '劍士'],
    ['1412', '雙手斧', '劍士'],
    ['1422', '雙手棍', '劍士'],
    ['1432', '槍', '劍士'],
    ['1442', '矛', '劍士'],
    ['1452', '弓', '弓箭手'],
    ['1462', '弩', '弓箭手'],
    ['1332', '短劍', '盜賊'],
    ['1472', '拳套', '盜賊'],
    ['1372', '短杖', '法師'],
    ['1382', '長杖', '法師'],
    ['1482', '指虎', '海盜'],
    ['1492', '火槍', '海盜'],
  ];

  /** 武器類型 → 表攻／屬性攻擊力係數（對齊常用楓之谷武器係數表） */
  const WEAPON_MULTIPLIER_BY_TYPE = {
    單手劍: 1.20,
    單手斧: 1.20,
    單手棍: 1.20,
    雙手劍: 1.34,
    雙手斧: 1.34,
    雙手棍: 1.34,
    槍: 1.49,
    矛: 1.49,
    弓: 1.30,
    弩: 1.35,
    短劍: 1.30,
    拳套: 1.75,
    短杖: 1.20,
    長杖: 1.20,
    指虎: 1.70,
    火槍: 1.50,
    手杖: 1.30,
    雙弩槍: 1.30,
    加農砲: 1.50,
    閃亮克魯: 1.20,
    調節器: 1.30,
    龍息射手: 1.30,
    長劍: 1.30,
    靈魂射手: 1.30,
    魔劍: 1.30,
    能量劍: 1.3125,
    記憶長杖: 1.34,
    陰陽扇: 1.35,
    ESP限制器: 1.20,
    鎖鏈: 1.30,
    魔法護腕: 1.20,
    仙扇: 1.30,
    武拳: 1.30,
    環刃: 1.30,
    太刀: 1.25,
    琉: 1.34,
    璃: 1.34,
    重拳槍: 1.70,
    古代之弓: 1.30,
  };

  const DEFAULT_WEAPON_MULTIPLIER = 1.20;

  /**
   * 普攻紙娃娃動作池（依武器類型；每次普攻從池內隨機抽一個有幀的動作）
   * 對齊 MapleStory：單手 swingO1/O2/O3、雙手 swingT1/T2/T3、弓弩 shoot 等
   */
  const BASIC_ATTACK_ACTIONS_BY_TYPE = {
    單手劍: ['swingO1', 'swingO2', 'swingO3', 'swingOF', 'stabO1', 'stabO2'],
    單手斧: ['swingO1', 'swingO2', 'swingO3', 'swingOF'],
    單手棍: ['swingO1', 'swingO2', 'swingO3', 'swingOF'],
    雙手劍: ['swingT1', 'swingT2', 'swingT3', 'swingTF', 'stabT1', 'stabT2'],
    雙手斧: ['swingT1', 'swingT2', 'swingT3', 'swingTF'],
    雙手棍: ['swingT1', 'swingT2', 'swingT3', 'swingTF'],
    槍: ['stabT1', 'stabT2', 'stabTF', 'swingT1'],
    矛: ['stabT1', 'stabT2', 'stabTF', 'swingT1'],
    弓: ['shoot1', 'shootF', 'swingT1'],
    弩: ['shoot2', 'shootF', 'swingT1'],
    短劍: ['stabO1', 'stabO2', 'stabOF', 'swingO1'],
    拳套: ['luckySeven', 'throwingWeapon', 'swingO1', 'swingO2', 'stabO1'],
    短杖: ['swingO1', 'swingO2', 'swingO3'],
    長杖: ['swingO1', 'swingO2', 'swingO3'],
    指虎: ['swingP1', 'swingP2', 'swingPF'],
    火槍: ['shoot1', 'shootF', 'swingT1'],
    手杖: ['swingO1', 'swingO2', 'stabO1'],
    // 雙弩槍正服為 shoot*；目前紙娃娃常缺 shoot 幀，需 swingT1 後備才有普攻動作
    雙弩槍: ['shoot1', 'shootF', 'swingT1', 'swingO1'],
    加農砲: ['shoot1', 'shootF', 'swingT1'],
    閃亮克魯: ['swingO1', 'swingO2'],
    調節器: ['swingO1', 'swingO2'],
    龍息射手: ['shoot1', 'shootF', 'swingT1'],
    長劍: ['swingT1', 'swingT2', 'stabT1'],
    靈魂射手: ['shoot1', 'shootF', 'swingT1'],
    魔劍: ['swingO1', 'swingO2', 'stabO1'],
    能量劍: ['swingO1', 'swingO2', 'stabO1'],
    記憶長杖: ['swingO1', 'swingO2', 'swingO3'],
    陰陽扇: ['swingO1', 'swingO2'],
    ESP限制器: ['swingO1', 'swingO2'],
    鎖鏈: ['swingO1', 'stabO1', 'stabO2'],
    魔法護腕: ['swingO1', 'swingO2'],
    仙扇: ['swingO1', 'swingO2'],
    武拳: ['swingT1', 'swingT2', 'stabT1'],
    環刃: ['swingO1', 'swingO2', 'stabO1'],
    太刀: ['swingT1', 'swingT2', 'stabT1'],
    琉: ['swingT1', 'swingT2'],
    璃: ['swingT1', 'swingT2'],
    重拳槍: ['shoot1', 'shootF', 'swingT1'],
    古代之弓: ['shoot1', 'shootF', 'swingT1'],
  };

  const DEFAULT_BASIC_ATTACK_ACTIONS = ['swingT1', 'swingO1', 'swingT2', 'stabT1'];

  /**
   * WZ `attackSpeed`：數字越「小」越快（約 2～9；6＝普通）。
   * 匯入裝備常缺此欄，依武器類型補預設。
   * 面板階段 Stage = 10 − wzAttackSpeed（數字越「大」越快）。
   */
  const DEFAULT_WZ_ATTACK_SPEED_BY_TYPE = {
    單手劍: 5,
    單手斧: 6,
    單手棍: 5,
    雙手劍: 6,
    雙手斧: 7,
    雙手棍: 6,
    槍: 6,
    矛: 8,
    弓: 6,
    弩: 6,
    短劍: 4,
    拳套: 4,
    短杖: 6,
    長杖: 8,
    指虎: 5,
    火槍: 5,
    手杖: 5,
    雙弩槍: 6,
    加農砲: 8,
    閃亮克魯: 6,
    調節器: 4,
    龍息射手: 6,
    長劍: 5,
    靈魂射手: 5,
    魔劍: 6,
    能量劍: 6,
    記憶長杖: 6,
    陰陽扇: 6,
    ESP限制器: 6,
    鎖鏈: 5,
    魔法護腕: 6,
    仙扇: 6,
    武拳: 5,
    環刃: 4,
    太刀: 5,
    琉: 6,
    璃: 6,
    重拳槍: 6,
    古代之弓: 6,
  };

  /** 無資料時的預設 WZ attackSpeed（普通） */
  const DEFAULT_WZ_ATTACK_SPEED = 6;
  /** 面板階段上下限（Stage 越大越快） */
  const ATTACK_SPEED_STAGE_MIN = 1;
  const ATTACK_SPEED_STAGE_MAX = 8;
  /** 客戶端動作 delay 對齊 30ms 幀 */
  const DELAY_FRAME_MS = 30;
  /**
   * 普通攻擊的技能基礎 delay（未乘攻速係數）。
   * 最終 WZ＝6（面板 4 階／普通）時倍率為 1。
   */
  const BASIC_ATTACK_BASE_DELAY_MS = 360;

  // 舊名相容（值皆為 WZ）
  const DEFAULT_ATTACK_SPEED_BY_TYPE = DEFAULT_WZ_ATTACK_SPEED_BY_TYPE;
  const DEFAULT_ATTACK_SPEED_STAGE = DEFAULT_WZ_ATTACK_SPEED;
  /** @deprecated 舊邏輯把「階段」當 WZ；保留給少數舊呼叫 */
  const ATTACK_SPEED_STAGE_CAP = 2;

  /**
   * 無穿戴武器時：依戰鬥力面板職業取該職典型武器係數。
   * 專屬職用專武；共用職用常見主武器。
   */
  const JOB_DEFAULT_WEAPON_TYPE = {
    英雄: '雙手劍',
    聖騎士: '單手劍',
    黑騎士: '槍',
    '大魔導士（冰、雷）': '長杖',
    '大魔導士（火、毒）': '長杖',
    主教: '長杖',
    箭神: '弓',
    神射手: '弩',
    開拓者: '古代之弓',
    夜使者: '拳套',
    暗影神偷: '短劍',
    影武者: '短劍',
    槍神: '火槍',
    拳霸: '指虎',
    重砲指揮官: '加農砲',
    聖魂劍士: '雙手劍',
    烈焰巫師: '長杖',
    破風使者: '弓',
    暗夜行者: '拳套',
    閃雷悍將: '指虎',
    米哈逸: '單手劍',
    狂狼勇士: '矛',
    龍魔導士: '長杖',
    夜光: '閃亮克魯',
    精靈遊俠: '雙弩槍',
    幻影俠盜: '手杖',
    隱月: '指虎',
    爆拳槍神: '重拳槍',
    煉獄巫師: '長杖',
    狂豹獵人: '弩',
    機甲戰神: '火槍',
    惡魔殺手: '單手斧',
    惡魔復仇者: '魔劍',
    傑諾: '能量劍',
    凱撒: '雙手劍',
    凱殷: '龍息射手',
    卡蒂娜: '鎖鏈',
    天使破壞者: '靈魂射手',
    阿戴爾: '調節器',
    伊利恩: '魔法護腕',
    卡莉: '環刃',
    亞克: '指虎',
    蓮: '長劍',
    菈菈: '長杖',
    虎影: '仙扇',
    凱內西斯: 'ESP限制器',
    神之子: '琉',
    劍豪: '太刀',
    陰陽師: '陰陽扇',
    琳恩: '記憶長杖',
    墨玄: '武拳',
  };

  const byCode = Object.create(null);

  EXCLUSIVE_ROWS.forEach(([code, weaponType, jobName]) => {
    byCode[code] = {
      code,
      weaponType,
      exclusive: true,
      jobName,
      jobGroup: '',
      reqJob: 0,
      weaponMultiplier: WEAPON_MULTIPLIER_BY_TYPE[weaponType] ?? DEFAULT_WEAPON_MULTIPLIER,
    };
  });

  SHARED_ROWS.forEach(([code, weaponType, jobGroup]) => {
    byCode[code] = {
      code,
      weaponType,
      exclusive: false,
      jobName: '',
      jobGroup,
      reqJob: JOB_GROUP_REQ[jobGroup] || 0,
      weaponMultiplier: WEAPON_MULTIPLIER_BY_TYPE[weaponType] ?? DEFAULT_WEAPON_MULTIPLIER,
    };
  });

  function padItemId(itemId) {
    const digits = String(itemId ?? '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.padStart(8, '0').slice(-8);
  }

  /** @returns {string} 四碼種類，無法解析則空字串 */
  function typeCodeFromItemId(itemId) {
    const padded = padItemId(itemId);
    return padded ? padded.slice(1, 5) : '';
  }

  function getByTypeCode(code) {
    if (code == null || code === '') return null;
    return byCode[String(code)] || null;
  }

  function getByItemId(itemId) {
    const four = typeCodeFromItemId(itemId);
    if (!four) return null;
    if (byCode[four]) return byCode[four];
    // 早期武器 id 常為 0130xxxx → 種類碼 1300，對到 1302 那一列
    if (/^1[3-5]/.test(four)) {
      return byCode[`${four.slice(0, 3)}2`] || null;
    }
    return null;
  }

  /** tooltip 用：分類＝武器類型；職業＝專屬職名或五大職業 */
  function getTooltipLabels(itemId) {
    const info = getByItemId(itemId);
    if (!info) return null;
    return {
      category: info.weaponType,
      job: info.exclusive ? info.jobName : (info.jobGroup || ''),
    };
  }

  /**
   * 從裝備欄主武器（11）與神之子副武（37）判定。
   * 專屬優先；共用只回傳種類／五大職業，不帶具體 jobName。
   */
  function resolveFromEquippedSlots(getWornEntry) {
    if (typeof getWornEntry !== 'function') return null;
    let shared = null;
    const slotIds = ['11', '37'];
    for (let i = 0; i < slotIds.length; i++) {
      const entry = getWornEntry(slotIds[i]);
      const info = getByItemId(entry?.itemId);
      if (!info) continue;
      if (info.exclusive) return { ...info, slotId: slotIds[i] };
      if (!shared) shared = { ...info, slotId: slotIds[i] };
    }
    return shared;
  }

  /** 依職業名稱取典型武器係數（無武器時的 fallback） */
  function getWeaponMultiplierByJobName(jobName) {
    if (!jobName) return DEFAULT_WEAPON_MULTIPLIER;
    let resolvedName = jobName;
    if (typeof CombatJobs !== 'undefined' && typeof CombatJobs.getJobByName === 'function') {
      const job = CombatJobs.getJobByName(jobName);
      if (job?.name) resolvedName = job.name;
    }
    const weaponType = JOB_DEFAULT_WEAPON_TYPE[resolvedName];
    if (!weaponType) return DEFAULT_WEAPON_MULTIPLIER;
    return WEAPON_MULTIPLIER_BY_TYPE[weaponType] ?? DEFAULT_WEAPON_MULTIPLIER;
  }

  /**
   * 目前裝備欄武器的表攻係數。
   * 無武器時改依 jobName（戰鬥力面板所選職業）取典型係數；再無則 1.20。
   */
  function getEquippedWeaponMultiplier(getWornEntry, jobName) {
    const info = resolveFromEquippedSlots(getWornEntry);
    if (shouldUseJobDefaultWeapon(info, jobName)) {
      const jobType = JOB_DEFAULT_WEAPON_TYPE[resolveJobNameForWeapon(jobName)];
      return WEAPON_MULTIPLIER_BY_TYPE[jobType] ?? DEFAULT_WEAPON_MULTIPLIER;
    }
    if (info) return Number(info.weaponMultiplier) || DEFAULT_WEAPON_MULTIPLIER;
    return getWeaponMultiplierByJobName(jobName);
  }

  function resolveJobNameForWeapon(jobName) {
    if (!jobName) return '';
    if (typeof CombatJobs !== 'undefined' && typeof CombatJobs.getJobByName === 'function') {
      const job = CombatJobs.getJobByName(jobName);
      if (job?.name) return job.name;
    }
    return String(jobName);
  }

  /** 夜使者／天使破壞者等：穿新手劍時仍走職業預設專屬武器（無低等拳套／靈魂射手素材） */
  function shouldUseJobDefaultWeapon(info, jobName) {
    const resolvedJob = resolveJobNameForWeapon(jobName);
    const jobType = JOB_DEFAULT_WEAPON_TYPE[resolvedJob];
    if (jobType !== '拳套' && jobType !== '靈魂射手') return false;
    return !info || info.weaponType !== jobType;
  }

  /** @deprecated 改走 shouldUseJobDefaultWeapon */
  function shouldUseJobDefaultClaw(info, jobName) {
    return shouldUseJobDefaultWeapon(info, jobName);
  }

  /** 依穿戴武器（或職業預設武器）回傳普攻動作候選 */
  function getBasicAttackActions(getWornEntry, jobName) {
    const info = resolveFromEquippedSlots(getWornEntry);
    const resolvedJob = resolveJobNameForWeapon(jobName);
    const weaponType = (shouldUseJobDefaultWeapon(info, jobName)
      ? JOB_DEFAULT_WEAPON_TYPE[resolvedJob]
      : null)
      || info?.weaponType
      || JOB_DEFAULT_WEAPON_TYPE[resolvedJob]
      || '';
    const list = BASIC_ATTACK_ACTIONS_BY_TYPE[weaponType];
    return Array.isArray(list) && list.length
      ? list.slice()
      : DEFAULT_BASIC_ATTACK_ACTIONS.slice();
  }

  function clampWzAttackSpeed(value) {
    const n = Math.round(Number(value) || 0);
    if (n < 2 || n > 9) return 0;
    return n;
  }

  function clampAttackSpeedStage(value) {
    const n = Math.round(Number(value) || 0);
    if (!Number.isFinite(n)) return ATTACK_SPEED_STAGE_MIN;
    return Math.min(ATTACK_SPEED_STAGE_MAX, Math.max(ATTACK_SPEED_STAGE_MIN, n));
  }

  /**
   * WZ attackSpeed → 面板／顯示用階段。
   * @param {number} baseWzAttackSpeed 武器等基礎 WZ（越小越快）
   * @param {number} [speedModifiers=0] 技能／Buff 對 WZ 的加減（加速為負，例 -2）
   * @returns {number} 面板階段 1～8（越大越快）
   */
  function calculateAttackSpeedStage(baseWzAttackSpeed, speedModifiers = 0) {
    const base = Number(baseWzAttackSpeed);
    const mod = Number(speedModifiers) || 0;
    const finalWzSpeed = (Number.isFinite(base) ? base : DEFAULT_WZ_ATTACK_SPEED) + mod;
    const stage = 10 - finalWzSpeed;
    return clampAttackSpeedStage(stage);
  }

  /** 面板階段 → 對應 WZ（供 delay 公式） */
  function wzAttackSpeedFromStage(stage) {
    return 10 - clampAttackSpeedStage(stage);
  }

  /**
   * 最終 WZ（已套 modifiers，並依面板上下限回推）。
   * delay 公式用此值：base × (10 + finalWz) / 16
   */
  function getFinalWzAttackSpeed(baseWzAttackSpeed, speedModifiers = 0) {
    return wzAttackSpeedFromStage(
      calculateAttackSpeedStage(baseWzAttackSpeed, speedModifiers),
    );
  }

  /**
   * @deprecated 舊 API：把「加速階數」當正數從 WZ 扣。
   * 請改用 calculateAttackSpeedStage(wz, speedModifiers)。
   */
  function getEffectiveAttackSpeedStage(weaponBaseSpeed, speedBuffSum) {
    const buffs = Math.max(0, Math.round(Number(speedBuffSum) || 0));
    return calculateAttackSpeedStage(weaponBaseSpeed, -buffs);
  }

  /**
   * 目前對 WZ attackSpeed 的 modifiers 總和（加速為負）。
   * 來源：SkillModifiers.speedModifiers、戰鬥力面板手動加速。
   */
  function getSpeedModifiers() {
    let n = 0;
    if (typeof CharacterCombatPanel !== 'undefined'
      && typeof CharacterCombatPanel.getAttackSpeedBuffSum === 'function') {
      // 面板若回傳「加速階段數」（正），轉成 WZ modifiers（負）
      const panel = Number(CharacterCombatPanel.getAttackSpeedBuffSum());
      if (Number.isFinite(panel) && panel !== 0) n -= Math.round(Math.abs(panel));
    }
    if (typeof SkillModifiers !== 'undefined' && typeof SkillModifiers.getTotals === 'function') {
      const mods = SkillModifiers.getTotals();
      const fromSkill = Number(mods.speedModifiers != null ? mods.speedModifiers : 0);
      if (Number.isFinite(fromSkill) && fromSkill !== 0) {
        n += Math.round(fromSkill);
      } else {
        // 相容舊 speedStages（正＝加速階數）
        const legacy = Number(mods.speedStages) || 0;
        if (legacy > 0) n -= Math.round(legacy);
      }
    }
    return n;
  }

  /** @deprecated 正數「加速階數」；請改 getSpeedModifiers（負向 WZ） */
  function getSpeedBuffSum() {
    return Math.max(0, -getSpeedModifiers());
  }

  /**
   * 技能／普攻實際動作 delay（ms）。
   * multiplier = (10 + finalWzAttackSpeed) / 16，再 ceil 到 30ms。
   * @param {number} baseDelay
   * @param {number} baseWzAttackSpeed 武器基礎 WZ
   * @param {number} [speedModifiers=0] WZ modifiers（加速為負）
   */
  function calculateActionDelayMs(baseDelay, baseWzAttackSpeed, speedModifiers = 0) {
    const base = Number(baseDelay);
    if (!Number.isFinite(base) || base <= 0) return DELAY_FRAME_MS;
    const finalWz = getFinalWzAttackSpeed(baseWzAttackSpeed, speedModifiers);
    const theoretical = base * ((10 + finalWz) / 16);
    return DELAY_FRAME_MS * Math.ceil(theoretical / DELAY_FRAME_MS);
  }

  function getDefaultWzAttackSpeedForType(weaponType) {
    if (!weaponType) return DEFAULT_WZ_ATTACK_SPEED;
    return DEFAULT_WZ_ATTACK_SPEED_BY_TYPE[weaponType] || DEFAULT_WZ_ATTACK_SPEED;
  }

  function getDefaultAttackSpeedForType(weaponType) {
    return getDefaultWzAttackSpeedForType(weaponType);
  }

  function getDefaultWzAttackSpeedForItemId(itemId) {
    const info = getByItemId(itemId);
    return getDefaultWzAttackSpeedForType(info?.weaponType);
  }

  function getDefaultAttackSpeedForItemId(itemId) {
    return getDefaultWzAttackSpeedForItemId(itemId);
  }

  function getDefaultWzAttackSpeedForJobName(jobName) {
    if (!jobName) return DEFAULT_WZ_ATTACK_SPEED;
    let resolvedName = jobName;
    if (typeof CombatJobs !== 'undefined' && typeof CombatJobs.getJobByName === 'function') {
      const job = CombatJobs.getJobByName(jobName);
      if (job?.name) resolvedName = job.name;
    }
    return getDefaultWzAttackSpeedForType(JOB_DEFAULT_WEAPON_TYPE[resolvedName]);
  }

  function getDefaultAttackSpeedForJobName(jobName) {
    return getDefaultWzAttackSpeedForJobName(jobName);
  }

  /** 讀裝備 WZ attackSpeed；缺則依武器種類補預設並寫回 item.wz */
  function resolveWzAttackSpeed(item) {
    if (!item) return DEFAULT_WZ_ATTACK_SPEED;
    const existing = clampWzAttackSpeed(item.wz?.attackSpeed);
    if (existing) return existing;
    const isWeapon = item.mainType === 'WEAPON'
      || item.islot === 'Wp'
      || item.islot === 'Gw'
      || item.islot === 'Wpsi'
      || item.islot === 'WpSi';
    if (!isWeapon) return 0;
    const wz = getDefaultWzAttackSpeedForItemId(item.itemId || item.id);
    if (item.wz && typeof item.wz === 'object') item.wz.attackSpeed = wz;
    return wz;
  }

  /** @deprecated 名稱易誤解；回傳 WZ，請改 resolveWzAttackSpeed */
  function resolveAttackSpeedStage(item) {
    return resolveWzAttackSpeed(item);
  }

  function getEquippedWzAttackSpeed(getWornEntry, jobName) {
    if (typeof getWornEntry === 'function') {
      const resolved = resolveFromEquippedSlots(getWornEntry);
      if (shouldUseJobDefaultWeapon(resolved, jobName)) {
        const jobType = JOB_DEFAULT_WEAPON_TYPE[resolveJobNameForWeapon(jobName)];
        return getDefaultWzAttackSpeedForType(jobType);
      }
      const slotId = resolved?.slotId || '11';
      const entry = getWornEntry(slotId) || getWornEntry('11') || getWornEntry('37');
      const itemId = entry?.itemId;
      if (itemId && typeof ITEM_DATABASE !== 'undefined') {
        const item = ITEM_DATABASE[itemId];
        if (item) return resolveWzAttackSpeed(item);
      }
      if (itemId) return getDefaultWzAttackSpeedForItemId(itemId);
    }
    return getDefaultWzAttackSpeedForJobName(jobName);
  }

  /** 裝備＋技能後的面板攻速階段（1～8，越大越快） */
  function getEquippedAttackSpeedStage(getWornEntry, jobName, speedModifiers) {
    const wz = getEquippedWzAttackSpeed(getWornEntry, jobName);
    const mod = speedModifiers != null ? speedModifiers : getSpeedModifiers();
    return calculateAttackSpeedStage(wz, mod);
  }

  /** @param {number} stage 面板階段（已換算）。普攻 baseDelay。 */
  function getAttackDelayMs(stage, baseDelay) {
    const base = Number(baseDelay) > 0 ? Number(baseDelay) : BASIC_ATTACK_BASE_DELAY_MS;
    const wz = wzAttackSpeedFromStage(stage);
    return calculateActionDelayMs(base, wz, 0);
  }

  /** 相對普通（WZ6／面板 4 階）的秒傷倍率：階段越大打越快 */
  function getAttackSpeedDpsFactor(stage, baseDelay) {
    const base = Number(baseDelay) > 0 ? Number(baseDelay) : BASIC_ATTACK_BASE_DELAY_MS;
    const refStage = calculateAttackSpeedStage(DEFAULT_WZ_ATTACK_SPEED, 0);
    const ref = getAttackDelayMs(refStage, base);
    return ref / getAttackDelayMs(stage, base);
  }

  const ATTACK_DELAY_MS_BY_STAGE = {};
  for (let s = ATTACK_SPEED_STAGE_MIN; s <= ATTACK_SPEED_STAGE_MAX; s += 1) {
    ATTACK_DELAY_MS_BY_STAGE[s] = getAttackDelayMs(s, BASIC_ATTACK_BASE_DELAY_MS);
  }

  return {
    JOB_GROUP_REQ,
    WEAPON_MULTIPLIER_BY_TYPE,
    JOB_DEFAULT_WEAPON_TYPE,
    DEFAULT_WEAPON_MULTIPLIER,
    DEFAULT_WZ_ATTACK_SPEED_BY_TYPE,
    DEFAULT_WZ_ATTACK_SPEED,
    DEFAULT_ATTACK_SPEED_BY_TYPE,
    DEFAULT_ATTACK_SPEED_STAGE,
    ATTACK_SPEED_STAGE_MIN,
    ATTACK_SPEED_STAGE_MAX,
    ATTACK_SPEED_STAGE_CAP,
    DELAY_FRAME_MS,
    BASIC_ATTACK_BASE_DELAY_MS,
    ATTACK_DELAY_MS_BY_STAGE,
    byCode,
    padItemId,
    typeCodeFromItemId,
    getByTypeCode,
    getByItemId,
    getTooltipLabels,
    resolveFromEquippedSlots,
    getWeaponMultiplierByJobName,
    getEquippedWeaponMultiplier,
    getBasicAttackActions,
    BASIC_ATTACK_ACTIONS_BY_TYPE,
    DEFAULT_BASIC_ATTACK_ACTIONS,
    calculateAttackSpeedStage,
    wzAttackSpeedFromStage,
    getFinalWzAttackSpeed,
    getDefaultWzAttackSpeedForType,
    getDefaultAttackSpeedForType,
    getDefaultWzAttackSpeedForItemId,
    getDefaultAttackSpeedForItemId,
    getDefaultWzAttackSpeedForJobName,
    getDefaultAttackSpeedForJobName,
    resolveWzAttackSpeed,
    resolveAttackSpeedStage,
    getEquippedWzAttackSpeed,
    getEquippedAttackSpeedStage,
    getEffectiveAttackSpeedStage,
    getSpeedModifiers,
    getSpeedBuffSum,
    calculateActionDelayMs,
    getAttackDelayMs,
    getAttackSpeedDpsFactor,
  };
})();

if (typeof window !== 'undefined') {
  window.WeaponTypeMap = WeaponTypeMap;
}
