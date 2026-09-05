/**
 * 技能面板 mock 資料（第一步 UI 驗證用，非真實職業技能）
 */
const SkillBoardMock = (() => {
  const RANKS = ['10', '30', '60', '100', 'hyper', 'hexa'];
  const TYPES = ['active', 'buff', 'passive'];

  const COLORS = [
    '#3a7bd5', '#2bb0ed', '#5b6cff', '#1e90ff',
    '#4caf88', '#e67e22', '#9b59b6', '#e74c3c',
    '#16a085', '#2980b9', '#8e44ad', '#27ae60',
  ];

  /** @type {Array<{id:string,name:string,rank:string,type:string,maxLevel:number,defaultLevel:number,equipable:boolean,color:string}>} */
  const SKILLS = [
    // Lv.10
    { id: 's10_a1', name: '冰鋒刃', rank: '10', type: 'active', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[0] },
    { id: 's10_a2', name: '寒冰刺', rank: '10', type: 'active', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[1] },
    { id: 's10_b1', name: '冰盾', rank: '10', type: 'buff', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[2] },
    { id: 's10_p1', name: '魔力增幅', rank: '10', type: 'passive', maxLevel: 10, defaultLevel: 5, equipable: false, color: COLORS[3] },
    // Lv.30
    { id: 's30_a1', name: '冰龍吐息', rank: '30', type: 'active', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[4] },
    { id: 's30_a2', name: '碎冰擊', rank: '30', type: 'active', maxLevel: 10, defaultLevel: 3, equipable: true, color: COLORS[5] },
    { id: 's30_a3', name: '極寒突進', rank: '30', type: 'active', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[6] },
    { id: 's30_b1', name: '霜甲術', rank: '30', type: 'buff', maxLevel: 10, defaultLevel: 2, equipable: true, color: COLORS[7] },
    { id: 's30_p1', name: '冰屬精通', rank: '30', type: 'passive', maxLevel: 15, defaultLevel: 8, equipable: false, color: COLORS[8] },
    { id: 's30_p2', name: '魔力流動', rank: '30', type: 'passive', maxLevel: 10, defaultLevel: 10, equipable: false, color: COLORS[9] },
    // Lv.60
    { id: 's60_a1', name: '絕對零度', rank: '60', type: 'active', maxLevel: 20, defaultLevel: 1, equipable: true, color: COLORS[10] },
    { id: 's60_a2', name: '冰河裂縫', rank: '60', type: 'active', maxLevel: 20, defaultLevel: 4, equipable: true, color: COLORS[11] },
    { id: 's60_a3', name: '凍土槍', rank: '60', type: 'active', maxLevel: 15, defaultLevel: 1, equipable: true, color: COLORS[0] },
    { id: 's60_a4', name: '霜雪連斬', rank: '60', type: 'active', maxLevel: 20, defaultLevel: 1, equipable: true, color: COLORS[1] },
    { id: 's60_b1', name: '暴風雪結界', rank: '60', type: 'buff', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[2] },
    { id: 's60_b2', name: '急速冷卻', rank: '60', type: 'buff', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[3] },
    { id: 's60_p1', name: '寒氣循環', rank: '60', type: 'passive', maxLevel: 20, defaultLevel: 12, equipable: false, color: COLORS[4] },
    // Lv.100
    { id: 's100_a1', name: '冰龍降臨', rank: '100', type: 'active', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[5] },
    { id: 's100_a2', name: '永凍領域', rank: '100', type: 'active', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[6] },
    { id: 's100_a3', name: '碎星冰華', rank: '100', type: 'active', maxLevel: 10, defaultLevel: 2, equipable: true, color: COLORS[7] },
    { id: 's100_a4', name: '極冰衝擊', rank: '100', type: 'active', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[8] },
    { id: 's100_a5', name: '龍息連波', rank: '100', type: 'active', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[9] },
    { id: 's100_b1', name: '龍之加護', rank: '100', type: 'buff', maxLevel: 10, defaultLevel: 1, equipable: true, color: COLORS[10] },
    { id: 's100_b2', name: '冰心覺醒', rank: '100', type: 'buff', maxLevel: 5, defaultLevel: 1, equipable: true, color: COLORS[11] },
    { id: 's100_p1', name: '四轉精通', rank: '100', type: 'passive', maxLevel: 10, defaultLevel: 5, equipable: false, color: COLORS[0] },
    { id: 's100_p2', name: '魔力精通', rank: '100', type: 'passive', maxLevel: 10, defaultLevel: 10, equipable: false, color: COLORS[1] },
    { id: 's100_p3', name: '暴擊強化', rank: '100', type: 'passive', maxLevel: 10, defaultLevel: 3, equipable: false, color: COLORS[2] },
  ];

  const byId = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

  function listSkills(rank, type) {
    return SKILLS.filter((s) => s.rank === String(rank) && s.type === type);
  }

  function countByType(rank) {
    const out = { active: 0, buff: 0, passive: 0 };
    SKILLS.forEach((s) => {
      if (s.rank === String(rank) && out[s.type] != null) out[s.type] += 1;
    });
    return out;
  }

  function getSkill(id) {
    return byId[id] || null;
  }

  function initialLevels() {
    const levels = {};
    SKILLS.forEach((s) => {
      levels[s.id] = s.defaultLevel;
    });
    return levels;
  }

  function emptyLoadout() {
    return Array.from({ length: 9 }, () => null);
  }

  function initialEquipped() {
    return {
      1: emptyLoadout(),
      2: emptyLoadout(),
      3: emptyLoadout(),
    };
  }

  return {
    RANKS,
    TYPES,
    SKILLS,
    listSkills,
    countByType,
    getSkill,
    initialLevels,
    initialEquipped,
    emptyLoadout,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillBoardMock = SkillBoardMock;
}
