/**
 * 技能書／技能查詢（讀 SkillJobData）
 * 支援職業線 lines：同一線多本 skill book 合併到面板（依 rank 分頁）
 */
const SkillCatalog = (() => {
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
    const id = String(skillId);
    const all = books();
    for (const key of Object.keys(all)) {
      const found = (all[key].skills || []).find((s) => String(s.id) === id);
      if (found) return withOverrides(found);
    }
    return null;
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
    books,
    lines,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillCatalog = SkillCatalog;
}
