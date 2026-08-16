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
    return getByTypeCode(typeCodeFromItemId(itemId));
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
    if (info) return Number(info.weaponMultiplier) || DEFAULT_WEAPON_MULTIPLIER;
    return getWeaponMultiplierByJobName(jobName);
  }

  return {
    JOB_GROUP_REQ,
    WEAPON_MULTIPLIER_BY_TYPE,
    JOB_DEFAULT_WEAPON_TYPE,
    DEFAULT_WEAPON_MULTIPLIER,
    byCode,
    padItemId,
    typeCodeFromItemId,
    getByTypeCode,
    getByItemId,
    getTooltipLabels,
    resolveFromEquippedSlots,
    getWeaponMultiplierByJobName,
    getEquippedWeaponMultiplier,
  };
})();

if (typeof window !== 'undefined') {
  window.WeaponTypeMap = WeaponTypeMap;
}
