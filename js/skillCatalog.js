/**
 * 技能書／技能查詢（讀 SkillJobData）
 * 支援職業線 lines：同一線多本 skill book 合併到面板（依 rank 分頁）
 */
const SkillCatalog = (() => {
  /**
   * 職業線額外共用技能（例：法師可學劍士「自身強化」）
   * @type {Record<string, string[]>}
   */
  const LINE_EXTRA_SKILL_IDS = {
    mage: ['1000003'],
    magef: ['1000003'],
  };

  /** 舊存檔／誤記 ID → 正式 ID（目前無需對應） */
  const SKILL_ID_ALIASES = {};

  function resolveSkillId(skillId) {
    const id = String(skillId || '');
    if (!id) return id;
    return SKILL_ID_ALIASES[id] || id;
  }

  function books() {
    return (typeof SkillJobData !== 'undefined' && SkillJobData.books) || {};
  }

  function lines() {
    return (typeof SkillJobData !== 'undefined' && SkillJobData.lines) || {};
  }

  function getJobBook(jobId) {
    const id = String(jobId);
    return books()[id] || null;
  }

  /** 找到包含此 jobId／skillBook 的職業線；沒有則 null */
  function getJobLine(jobId) {
    const id = String(jobId);
    const all = lines();
    for (const key of Object.keys(all)) {
      const line = all[key];
      if (!line) continue;
      if (String(line.primaryJobId) === id) return line;
      if ((line.books || []).some((b) => String(b) === id)) return line;
    }
    return null;
  }

  /** 面板應合併的技能書（職業線全部，或單本） */
  function booksForJob(jobId) {
    const line = getJobLine(jobId);
    if (line && Array.isArray(line.books) && line.books.length) {
      return line.books
        .map((b) => books()[String(b)])
        .filter(Boolean);
    }
    const one = getJobBook(jobId);
    return one ? [one] : [];
  }

  function withOverrides(skill) {
    if (!skill) return null;
    if (typeof SkillOverrides !== 'undefined' && typeof SkillOverrides.apply === 'function') {
      return SkillOverrides.apply(skill);
    }
    return skill;
  }

  function getSkill(skillId) {
    const id = resolveSkillId(skillId);
    const all = books();
    for (const key of Object.keys(all)) {
      const found = (all[key].skills || []).find((s) => String(s.id) === id);
      if (found) return withOverrides(found);
    }
    return null;
  }

  /** 職業線額外掛入的技能（去重） */
  function appendLineExtraSkills(jobId, out, opts = {}) {
    const line = getJobLine(jobId);
    const extras = LINE_EXTRA_SKILL_IDS[String(line?.id || '')] || [];
    if (!extras.length) return;
    const rank = opts.rank != null ? String(opts.rank) : null;
    const type = opts.type != null ? String(opts.type) : null;
    const includeHidden = !!opts.includeHidden;
    const seen = new Set((out || []).map((s) => String(s.id)));
    extras.forEach((sid) => {
      const id = String(sid);
      if (seen.has(id)) return;
      const raw = getSkill(id);
      if (!raw) return;
      if (!includeHidden && raw.skipPanel) return;
      if (rank != null && String(raw.rank) !== rank) return;
      if (type != null && String(raw.type) !== type) return;
      seen.add(id);
      out.push({
        ...raw,
        sharedSkill: true,
        sharedFromJob: raw.skillBook,
      });
    });
  }

  function listSkills(jobId, opts = {}) {
    const bookList = booksForJob(jobId);
    if (!bookList.length) return [];
    const rank = opts.rank != null ? String(opts.rank) : null;
    const type = opts.type != null ? String(opts.type) : null;
    const includeHidden = !!opts.includeHidden;
    const out = [];
    bookList.forEach((book) => {
      (book.skills || []).forEach((s) => {
        if (!includeHidden && s.skipPanel) return;
        if (rank != null && String(s.rank) !== rank) return;
        if (type != null && String(s.type) !== type) return;
        out.push(withOverrides(s));
      });
    });
    appendLineExtraSkills(jobId, out, opts);
    return out;
  }

  function countByType(jobId, rank) {
    const out = { active: 0, buff: 0, passive: 0 };
    listSkills(jobId, { rank }).forEach((s) => {
      if (out[s.type] != null) out[s.type] += 1;
    });
    return out;
  }

  function iconUrl(skill) {
    if (!skill) return '';
    if (typeof skill === 'string') {
      const s = getSkill(skill);
      return s?.icon ? `${s.icon}?v=20260829icon2` : '';
    }
    return skill.icon ? `${skill.icon}?v=20260829icon2` : '';
  }

  function panelRanksForJob(jobId) {
    const bookList = booksForJob(jobId);
    const order = ['10', '30', '60', '100', 'hyper', 'hexa'];
    const seen = new Set();
    bookList.forEach((book) => {
      (book.skills || []).forEach((s) => {
        if (s?.rank != null) seen.add(String(s.rank));
      });
      if (book?.rank != null) seen.add(String(book.rank));
    });
    return order.filter((r) => seen.has(r));
  }

  /** 職業線 canonical id（四轉）；單本或舊存檔 1 轉 id 會對應到線上 primaryJobId */
  function normalizeJobId(jobId) {
    const id = Number(jobId) || 0;
    if (!(id > 0)) return id;
    const line = getJobLine(id);
    if (line?.primaryJobId != null) return Number(line.primaryJobId) || id;
    return id;
  }

  function jobLabel(jobId) {
    const line = getJobLine(jobId);
    if (line?.name) return line.name;
    return getJobBook(jobId)?.name || '';
  }

  /**
   * 自動接技鏈後續技（不可裝備／連鎖）。
   * 只從 isAuto／type=1 頭技往下收；僅展開 skipPanel 隱藏橋接，
   * 不走 type0 選配接技圖（否則會把昇龍等頭技誤標成後續）。
   */
  let addAttackFollowupIds = null;

  function isAddAttackChainHead(skill) {
    const aa = skill?.addAttack;
    if (!aa?.skill) return false;
    return !!(aa.isAuto || Number(aa.type) === 1);
  }

  function collectAddAttackFollowupIds() {
    if (addAttackFollowupIds) return addAttackFollowupIds;
    const set = new Set();
    const queue = [];
    const enqueue = (rawId) => {
      const id = String(rawId || '');
      if (!id || set.has(id)) return;
      set.add(id);
      queue.push(id);
    };
    const all = books();
    Object.keys(all).forEach((key) => {
      (all[key].skills || []).forEach((raw) => {
        const skill = withOverrides(raw);
        if (!isAddAttackChainHead(skill)) return;
        const aa = skill.addAttack;
        enqueue(aa.skill);
        (Array.isArray(aa.skillPlus) ? aa.skillPlus : []).forEach(enqueue);
      });
    });
    while (queue.length) {
      const skill = getSkill(queue.shift());
      // 隱藏橋接（如 23101007）才繼續展開；一般後續技停在此層
      if (!skill?.skipPanel) continue;
      const aa = skill.addAttack;
      if (!aa?.skill) continue;
      enqueue(aa.skill);
      (Array.isArray(aa.skillPlus) ? aa.skillPlus : []).forEach(enqueue);
    }
    addAttackFollowupIds = set;
    return set;
  }

  function isAddAttackFollowup(skillId) {
    return collectAddAttackFollowupIds().has(resolveSkillId(skillId));
  }

  /** baseId → 強化替換技 id（例：光速雙擊 → 進階光速雙擊） */
  let skillReplacerByBase = null;

  function collectSkillReplacerMap() {
    if (skillReplacerByBase) return skillReplacerByBase;
    const map = Object.create(null);
    const all = books();
    Object.keys(all).forEach((key) => {
      (all[key].skills || []).forEach((raw) => {
        const skill = withOverrides(raw);
        const base = skill?.replacesSkill != null ? String(skill.replacesSkill) : '';
        if (!base || !skill?.id) return;
        map[base] = String(skill.id);
      });
    });
    skillReplacerByBase = map;
    return map;
  }

  /** 若 base 已被強化技取代，回傳強化技 id；否則 null */
  function getSkillReplacer(baseSkillId) {
    return collectSkillReplacerMap()[resolveSkillId(baseSkillId)] || null;
  }

  /** 此技是否為某技的強化替換版 */
  function getReplacedSkillId(advancedSkillId) {
    const skill = getSkill(advancedSkillId);
    return skill?.replacesSkill != null ? String(skill.replacesSkill) : null;
  }

  return {
    getJobBook,
    getJobLine,
    booksForJob,
    getSkill,
    listSkills,
    countByType,
    iconUrl,
    panelRanksForJob,
    jobLabel,
    normalizeJobId,
    resolveSkillId,
    books,
    lines,
    isAddAttackFollowup,
    getSkillReplacer,
    getReplacedSkillId,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillCatalog = SkillCatalog;
}
