/**
 * 職業清單與主副屬標籤（抄自 MapleCombat src/data/jobs.ts）
 * https://github.com/centre173/MapleCombat
 */
const CombatJobs = (() => {
  const jobOptions = [
    { name: '英雄', category: 'normal' },
    { name: '聖騎士', category: 'normal' },
    { name: '黑騎士', category: 'normal' },
    { name: '大魔導士（冰、雷）', category: 'normal', aliases: ['冰雷', '大魔導士冰雷'] },
    { name: '大魔導士（火、毒）', category: 'normal', aliases: ['火毒', '大魔導士火毒'] },
    { name: '主教', category: 'normal' },
    { name: '箭神', category: 'normal' },
    { name: '神射手', category: 'normal' },
    { name: '開拓者', category: 'normal' },
    { name: '夜使者', category: 'normal' },
    { name: '暗影神偷', category: 'dual' },
    { name: '影武者', category: 'dual' },
    { name: '槍神', category: 'normal' },
    { name: '拳霸', category: 'normal' },
    { name: '重砲指揮官', category: 'normal' },
    { name: '聖魂劍士', category: 'normal' },
    { name: '烈焰巫師', category: 'normal' },
    { name: '破風使者', category: 'normal' },
    { name: '暗夜行者', category: 'normal' },
    { name: '閃雷悍將', category: 'normal' },
    { name: '米哈逸', category: 'normal' },
    { name: '狂狼勇士', category: 'normal' },
    { name: '龍魔導士', category: 'normal' },
    { name: '夜光', category: 'normal' },
    { name: '精靈遊俠', category: 'normal' },
    { name: '幻影俠盜', category: 'normal' },
    { name: '隱月', category: 'normal' },
    { name: '爆拳槍神', category: 'normal' },
    { name: '煉獄巫師', category: 'normal' },
    { name: '狂豹獵人', category: 'normal' },
    { name: '機甲戰神', category: 'normal' },
    { name: '惡魔殺手', category: 'normal' },
    { name: '惡魔復仇者', category: 'da', aliases: ['DA'] },
    { name: '傑諾', category: 'xenon', aliases: ['Xenon'] },
    { name: '凱撒', category: 'normal' },
    { name: '凱殷', category: 'normal' },
    { name: '卡蒂娜', category: 'dual' },
    { name: '天使破壞者', category: 'normal' },
    { name: '阿戴爾', category: 'normal' },
    { name: '伊利恩', category: 'normal' },
    { name: '卡莉', category: 'normal' },
    { name: '亞克', category: 'normal' },
    { name: '蓮', category: 'normal' },
    { name: '菈菈', category: 'normal', aliases: ['拉拉'] },
    { name: '虎影', category: 'normal' },
    { name: '凱內西斯', category: 'normal' },
    { name: '神之子', category: 'normal' },
    { name: '劍豪', category: 'overseas' },
    { name: '陰陽師', category: 'overseas' },
    { name: '琳恩', category: 'overseas' },
    { name: '墨玄', category: 'overseas' },
  ];

  const jobStatDisplayGroups = [
    {
      names: ['英雄', '聖騎士', '黑騎士', '拳霸', '重砲指揮官', '聖魂劍士', '閃雷悍將', '米哈逸', '狂狼勇士', '隱月', '爆拳槍神', '惡魔殺手', '凱撒', '阿戴爾', '亞克', '蓮', '神之子', '劍豪'],
      main: 'STR', sub: 'DEX',
    },
    {
      names: ['大魔導士（冰、雷）', '大魔導士（火、毒）', '主教', '烈焰巫師', '龍魔導士', '夜光', '煉獄巫師', '伊利恩', '菈菈', '凱內西斯', '陰陽師', '琳恩'],
      main: 'INT', sub: 'LUK',
    },
    {
      names: ['箭神', '神射手', '開拓者', '槍神', '破風使者', '精靈遊俠', '狂豹獵人', '機甲戰神', '凱殷', '天使破壞者', '墨玄'],
      main: 'DEX', sub: 'STR',
    },
    {
      names: ['夜使者', '暗夜行者', '幻影俠盜', '卡莉', '虎影'],
      main: 'LUK', sub: 'DEX',
    },
    {
      names: ['暗影神偷', '影武者', '卡蒂娜'],
      main: 'LUK', sub: 'STR', secondSub: 'DEX',
    },
    { names: ['惡魔復仇者'], main: 'HP', sub: 'STR' },
    { names: ['傑諾'], main: 'STR', sub: 'DEX', secondSub: 'LUK' },
  ];

  const jobStatDisplayMap = {};
  jobStatDisplayGroups.forEach((group) => {
    group.names.forEach((name) => {
      jobStatDisplayMap[name] = {
        main: group.main,
        sub: group.sub,
        secondSub: group.secondSub || '',
      };
    });
  });

  function getJobByName(name) {
    if (!name) return null;
    return jobOptions.find((job) => job.name === name)
      || jobOptions.find((job) => (job.aliases || []).includes(name))
      || null;
  }

  function getDefaultJobByCategory(category) {
    return jobOptions.find((job) => job.category === category) || jobOptions[0];
  }

  function getJobStatLabelsByName(jobName) {
    return jobStatDisplayMap[jobName] || { main: 'STR', sub: 'DEX', secondSub: '' };
  }

  /** 裝備標籤 → 公式用屬性鍵 */
  const EQUIP_STAT_KEY = {
    STR: 'STR',
    DEX: 'DEX',
    INT: 'INT',
    LUK: 'LUK',
    HP: '最大HP',
    最大HP: '最大HP',
  };

  function equipLabelForStat(stat) {
    if (stat === 'HP') return '最大HP';
    return stat;
  }

  return {
    jobOptions,
    getJobByName,
    getDefaultJobByCategory,
    getJobStatLabelsByName,
    equipLabelForStat,
    EQUIP_STAT_KEY,
  };
})();

if (typeof window !== 'undefined') {
  window.CombatJobs = CombatJobs;
}
