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
    mage: [
      '1000003',
      '400021002', '400021030', '400021094', '400021067',
      '400021000', '400001021', '400001042',
      '400004191', '400004192', '400004193', '400004194', '400004195',
      '400004196', '400004197', '400004198', '400004199', '400004200',
    ],
    magef: [
      '1000003',
      '400021001', '400021028', '400021101', '400021066',
      '400021000', '400001021', '400001042',
      '400004177', '400004178', '400004179', '400004180', '400004181',
      '400004182', '400004183', '400004184', '400004185', '400004186',
      '400004187', '400004188', '400004189', '400004190',
    ],
    warrior: [
      '400011001', '400011027', '400011073', '400011124',
      '400011000', '400011066', '400001010', '400001042',
      '400004000', '400004001', '400004002', '400004003', '400004004',
      '400004005', '400004006', '400004007', '400004008', '400004009',
      '400004010',
    ],
    mercedes: [
      '400031007', '400031017', '400031044', '400031024',
      '400031023', '400001024', '400001042',
      '400004346', '400004347', '400004348', '400004349', '400004350',
      '400004351', '400004352', '400004353', '400004354', '400004355',
      '400004356', '400004357', '400004358', '400004359', '400004360',
      '400004361',
    ],
    nightlord: [
      '400041061', '400041038', '400041020', '400041001',
      '400041000', '400041032', '400001023', '400001042',
      '400004650', '400004652', '400004653', '400004654', '400004655',
      '400004656', '400004657', '400004658', '400004659', '400004660',
    ],
    angelicbuster: [
      '400051046', '400051011', '400051018', '400051072',
      '400051000', '400051033', '400001047', '400001014', '400001042',
      '400004859', '400004860', '400004861', '400004862', '400004863',
      '400004864', '400004865', '400004867', '400004868', '400004869',
    ],
  };

  /** 全職業五轉通用核（200 頁；位移／降臨本體／神聖之泉等不進面板） */
  const ALL_JOB_V_COMMON_IDS = [
    '400001002', '400001003', '400001004',
    '400000005', '400000006',
    '400001020',
    '400001039',
    '400001064',
  ];

  /** 職業線隱藏（仍匯入資料；夜使者不含短劍／位移） */
  const LINE_HIDDEN_SKILL_IDS = {
    nightlord: [
      '4001334', // 劈空斬（短劍）
      '4001013', // 狂刃刺擊（影武）
      '4001003', // 隱身術
      '4101015', // 暗影衝刺
      '4101016', // 暗影之躍
      '4101018', // 暗影閃爍
      '4100012', // 刻印引爆
      '4120019',
      '4101014', // 爆破鏢爆炸段
      '4121020', // 挑釁追擊（與本體同名，勿進 hyper 綁定）
      '4121021',
      '4121022',
      '4121009',
      '400041000',
      '400041062',
      '400041079',
    ],
    angelicbuster: [
      '65111007', // 探求者 companion
      '65121012', // 共鳴 companion
      '400051019',
      '400051020',
      '400051027',
      '400051097',
    ],
    mage: [
      '400021031',
      '400021040',
      '400021060',
    ],
    magef: [
      '400021060',
    ],
    mercedes: [
      '400031008',
      '400031009',
      '400031011',
      '400031000',
      '400031018',
      '400031045',
      '400001025',
      '400001026',
      '400001027',
      '400001028',
      '400001029',
      '400001030',
    ],
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
    const extras = [
      ...ALL_JOB_V_COMMON_IDS,
      ...(LINE_EXTRA_SKILL_IDS[String(line?.id || '')] || []),
    ];
    if (!extras.length) return;
    const rankRaw = opts.rank != null ? String(opts.rank) : null;
    const rank = rankRaw === 'hexa' ? '200' : rankRaw;
    const type = opts.type != null ? String(opts.type) : null;
    const includeHidden = !!opts.includeHidden;
    const seen = new Set((out || []).map((s) => String(s.id)));
    extras.forEach((sid) => {
      const id = String(sid);
      if (seen.has(id)) return;
      const raw = getSkill(id);
      if (!raw) return;
      if (Number(raw.infoType) === 50) {
        const psd = raw.psdSkill || raw.wz?.psdSkill || [];
        const targets = Array.isArray(psd) ? psd.map((tid) => String(tid || '')) : [];
        if (targets.length && !targets.some((tid) => seen.has(tid)
          || out.some((s) => String(s.id) === tid))) {
          const bookList = booksForJob(jobId);
          const hasTarget = targets.some((tid) => bookList.some((book) => (
            (book.skills || []).some((s) => String(s.id) === tid)
          )));
          if (!hasTarget) return;
        }
      }
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
    const rankRaw = opts.rank != null ? String(opts.rank) : null;
    const rank = rankRaw === 'hexa' ? '200' : rankRaw;
    const type = opts.type != null ? String(opts.type) : null;
    const includeHidden = !!opts.includeHidden;
    const hiddenIds = new Set(LINE_HIDDEN_SKILL_IDS[String(getJobLine(jobId)?.id || '')] || []);
    const out = [];
    bookList.forEach((book) => {
      (book.skills || []).forEach((raw) => {
        // 必須先套用 overrides（rank／type／skipPanel 可能被改），再過濾
        const s = withOverrides(raw);
        if (!s) return;
        if (!includeHidden && (s.skipPanel || hiddenIds.has(String(s.id)))) return;
        if (includeHidden && hiddenIds.has(String(s.id))) return;
        if (rank != null && String(s.rank) !== rank) return;
        if (type != null && String(s.type) !== type) return;
        out.push(s);
      });
    });
    appendLineExtraSkills(jobId, out, { ...opts, rank });
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
      return s?.icon ? `${s.icon}?v=20260917icon3` : '';
    }
    return skill.icon ? `${skill.icon}?v=20260917icon3` : '';
  }

  function panelRanksForJob(jobId) {
    const bookList = booksForJob(jobId);
    const order = ['10', '30', '60', '100', 'hyper', '200', 'hexa'];
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

  /** 精靈遊俠等：明示為接技後續、不可裝備（仍可學習，由頭技／優先序自動接） */
  const FORCE_ADD_ATTACK_FOLLOWUP_IDS = new Set([
    '23110006', // 騰空踢擊
    '23111003', // 旋風突進
    '23121002', // 傳說之槍
    '23121011', // 旋風月光翻轉
    '23121052', // 憤怒天使
  ]);

  function isAddAttackChainHead(skill) {
    const aa = skill?.addAttack;
    if (!aa?.skill) return false;
    return !!(aa.isAuto || Number(aa.type) === 1);
  }

  function collectAddAttackFollowupIds() {
    if (addAttackFollowupIds) return addAttackFollowupIds;
    const set = new Set(FORCE_ADD_ATTACK_FOLLOWUP_IDS);
    const queue = [];
    const enqueue = (rawId) => {
      const id = String(rawId || '');
      if (!id || set.has(id)) return;
      set.add(id);
      queue.push(id);
    };
    // 強制接技後續也要進 queue，以便展開其隱藏橋接（若有）
    FORCE_ADD_ATTACK_FOLLOWUP_IDS.forEach((id) => queue.push(id));
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
