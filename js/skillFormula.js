/**
 * Maple 技能 common 公式求值（安全解析，不用任意 eval）
 * 支援：x、+ - * /、括號、d(n) 向下取整、u(n) 向上取整
 */
const SkillFormula = (() => {
  function tokenize(input) {
    const s = String(input || '').replace(/\s+/g, '');
    const tokens = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/[0-9.]/.test(ch)) {
        let j = i + 1;
        while (j < s.length && /[0-9.]/.test(s[j])) j += 1;
        const num = Number(s.slice(i, j));
        if (!Number.isFinite(num)) throw new Error(`bad number near ${i}`);
        tokens.push({ type: 'num', value: num });
        i = j;
        continue;
      }
      if (ch === 'x' || ch === 'X') {
        tokens.push({ type: 'x' });
        i += 1;
        continue;
      }
      if (ch === 'd' || ch === 'D' || ch === 'u' || ch === 'U') {
        tokens.push({ type: 'fn', value: ch.toLowerCase() });
        i += 1;
        continue;
      }
      if ('+-*/()'.includes(ch)) {
        tokens.push({ type: 'op', value: ch });
        i += 1;
        continue;
      }
      throw new Error(`bad char ${ch}`);
    }
    return tokens;
  }

  function parseExpr(tokens) {
    let pos = 0;

    function peek() {
      return tokens[pos] || null;
    }

    function take() {
      const t = tokens[pos];
      pos += 1;
      return t;
    }

    function parsePrimary() {
      const t = peek();
      if (!t) throw new Error('unexpected end');
      if (t.type === 'num') {
        take();
        return t.value;
      }
      if (t.type === 'x') {
        take();
        return { x: true };
      }
      if (t.type === 'fn') {
        const fn = take().value;
        const next = peek();
        if (!next || next.type !== 'op' || next.value !== '(') throw new Error(`${fn} needs (`);
        take();
        const inner = parseAdd();
        const close = peek();
        if (!close || close.type !== 'op' || close.value !== ')') throw new Error(`${fn} needs )`);
        take();
        return { fn, arg: inner };
      }
      if (t.type === 'op' && t.value === '(') {
        take();
        const inner = parseAdd();
        const close = peek();
        if (!close || close.type !== 'op' || close.value !== ')') throw new Error('missing )');
        take();
        return inner;
      }
      if (t.type === 'op' && (t.value === '+' || t.value === '-')) {
        take();
        const arg = parsePrimary();
        return t.value === '-' ? { op: 'neg', arg } : arg;
      }
      throw new Error('bad primary');
    }

    function parseMul() {
      let left = parsePrimary();
      while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
        const op = take().value;
        const right = parsePrimary();
        left = { op, left, right };
      }
      return left;
    }

    function parseAdd() {
      let left = parseMul();
      while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
        const op = take().value;
        const right = parseMul();
        left = { op, left, right };
      }
      return left;
    }

    const ast = parseAdd();
    if (pos < tokens.length) throw new Error('trailing tokens');
    return ast;
  }

  function evalAst(ast, x) {
    if (typeof ast === 'number') return ast;
    if (!ast || typeof ast !== 'object') return 0;
    if (ast.x) return Number(x) || 0;
    if (ast.op === 'neg') return -evalAst(ast.arg, x);
    if (ast.fn === 'd') return Math.floor(evalAst(ast.arg, x));
    if (ast.fn === 'u') return Math.ceil(evalAst(ast.arg, x));
    if (ast.op === '+') return evalAst(ast.left, x) + evalAst(ast.right, x);
    if (ast.op === '-') return evalAst(ast.left, x) - evalAst(ast.right, x);
    if (ast.op === '*') return evalAst(ast.left, x) * evalAst(ast.right, x);
    if (ast.op === '/') {
      const r = evalAst(ast.right, x);
      return r === 0 ? 0 : evalAst(ast.left, x) / r;
    }
    return 0;
  }

  function evalExpr(str, vars = {}) {
    if (str == null || str === '') return 0;
    if (typeof str === 'number') return Number.isFinite(str) ? str : 0;
    const raw = String(str).trim();
    if (!raw) return 0;
    if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
    try {
      const ast = parseExpr(tokenize(raw));
      const n = evalAst(ast, vars.x);
      return Number.isFinite(n) ? n : 0;
    } catch (_) {
      return 0;
    }
  }

  function resolveCooltimeSec(common, level) {
    const c = common && typeof common === 'object' ? common : {};
    const x = Math.max(0, Number(level) || 0);
    const fromCooltime = Math.max(0, evalExpr(c.cooltime != null ? c.cooltime : 0, { x }));
    if (fromCooltime > 0) return fromCooltime;

    // 蓄積型技能：WZ 用 w（最大次數）+ w2（準備秒數），本專案不做蓄積，w2 視為 CD
    if (c.w == null || String(c.w).trim() === '' || c.w2 == null || String(c.w2).trim() === '') {
      return 0;
    }
    const maxStack = Math.floor(evalExpr(c.w, { x }));
    const rechargeSec = evalExpr(c.w2, { x });
    if (!(maxStack >= 1 && maxStack <= 10) || !(rechargeSec >= 1 && rechargeSec <= 600)) {
      return 0;
    }
    return Math.max(0, rechargeSec);
  }

  function evalCommon(common, level) {
    const c = common && typeof common === 'object' ? common : {};
    const x = Math.max(0, Number(level) || 0);
    const damagePct = evalExpr(c.damage, { x });
    const attackCount = Math.max(1, Math.floor(evalExpr(c.attackCount != null ? c.attackCount : 1, { x })) || 1);
    const mobCount = Math.max(1, Math.floor(evalExpr(c.mobCount != null ? c.mobCount : 1, { x })) || 1);
    const mpCon = Math.max(0, Math.floor(evalExpr(c.mpCon != null ? c.mpCon : 0, { x })) || 0);
    const cooltimeSec = resolveCooltimeSec(c, x);
    const timeSec = Math.max(0, evalExpr(c.time != null ? c.time : 0, { x }));
    let attackDelayBaseMs = null;
    if (c.attackDelay != null && String(c.attackDelay) !== '') {
      const n = evalExpr(c.attackDelay, { x });
      if (Number.isFinite(n) && n > 0) attackDelayBaseMs = n;
    }
    return {
      damagePct,
      attackCount,
      mobCount,
      mpCon,
      cooltimeSec,
      timeSec,
      attackDelayBaseMs,
    };
  }

  /** 被動／Buff／summon 用的 common 數值 */
  function evalStatCommon(common, level) {
    const c = common && typeof common === 'object' ? common : {};
    const x = Math.max(0, Number(level) || 0);
    const num = (key, fallback = 0) => {
      if (c[key] == null || String(c[key]) === '') return fallback;
      const n = evalExpr(c[key], { x });
      return Number.isFinite(n) ? n : fallback;
    };
    return {
      padX: num('padX'),
      indiePad: num('indiePad'),
      strX: num('strX') + num('indieStr'),
      dexX: num('dexX') + num('indieDex'),
      intX: num('intX') + num('indieInt'),
      lukX: num('lukX') + num('indieLuk'),
      damR: num('damR'),
      bdR: num('bdR'),
      pdR: num('pdR'),
      mdR: num('mdR'),
      madX: num('madX'),
      bufftimeR: num('bufftimeR'),
      stanceProp: num('stanceProp'),
      criticaldamage: num('criticaldamage'),
      ignoreMobpdpR: num('ignoreMobpdpR'),
      pddX: num('pddX'),
      mhpR: (() => {
        const hp = num('mhpR');
        if (hp > 0) return hp;
        // 無 MP 專案：魔力增幅等 mmpR 視為 mhpR
        return num('mmpR');
      })(),
      lv2mhp: (() => {
        const hp = num('lv2mhp');
        if (hp > 0) return hp;
        return num('lv2mmp');
      })(),
      indieCr: num('indieCr'),
      indieMad: num('indieMad'),
      madX: num('madX'),
      cr: num('cr'),
      prop: num('prop'),
      subProp: num('subProp'),
      mastery: num('mastery'),
      costmpR: num('costmpR'),
      timeSec: Math.max(0, num('time')),
      cooltimeSec: Math.max(0, resolveCooltimeSec(c, x)),
      /** DoT／創傷持續秒數（烈焰翔斬等） */
      dotTimeSec: Math.max(0, num('dotTime')),
      /** DoT 傷害％、間隔秒數 */
      dotPct: Math.max(0, num('dot')),
      dotIntervalSec: Math.max(0, num('dotInterval')),
      subTimeMs: (() => {
        const n = num('subTime');
        if (!(n > 0)) return 0;
        // WZ 混用：≤30 當秒、其餘當毫秒（如雷霆 1080ms／冰魔 8 秒）
        return n <= 30 ? Math.round(n * 1000) : Math.round(n);
      })(),
      w: Math.max(0, Math.floor(num('w'))),
      u2: Math.max(0, Math.floor(num('u2'))),
      u: num('u'),
      s: num('s'),
      v: num('v'),
      y: num('y'),
      ballDelayMs: Math.max(0, Math.floor(num('ballDelay')) || 0),
      xVal: num('x'),
      actionSpeed: num('actionSpeed'),
      damAbsorbShieldR: num('damAbsorbShieldR'),
      indiePowerGuard: num('indiePowerGuard'),
      damagePct: num('damage'),
      attackCount: Math.max(1, Math.floor(num('attackCount', 1)) || 1),
      mobCount: Math.max(1, Math.floor(num('mobCount', 1)) || 1),
      targetPlus: Math.max(0, Math.floor(num('targetPlus')) || 0),
      /** 楓葉祝福等：直接投入 AP 的能力值 +X% */
      basicStatUp: Math.max(0, num('basicStatUp')),
      attackDelayBaseMs: (() => {
        const n = num('attackDelay');
        return n > 0 ? n : null;
      })(),
    };
  }

  /**
   * 技能說明占位符求值：#damage、#prop%、#mobCount、#u2…
   * @returns {number|null}
   */
  function evalPlaceholder(common, key, level) {
    const c = common && typeof common === 'object' ? common : {};
    const x = Math.max(0, Number(level) || 0);
    if (String(key).toLowerCase() === 'cooltime') {
      const cd = resolveCooltimeSec(c, x);
      return cd > 0 ? cd : null;
    }
    if (c[key] == null || String(c[key]) === '') return null;
    const n = evalExpr(c[key], { x });
    return Number.isFinite(n) ? n : null;
  }

  function formatPlaceholderNumber(n) {
    if (!Number.isFinite(n)) return '?';
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    const t = Math.round(n * 100) / 100;
    return String(t);
  }

  function formatSkillText(template, common, level) {
    let raw = String(template || '');
    if (!raw) return '';
    // WZ／匯出字串偶發殘留字面 \n
    raw = raw.replace(/\\r\\n|\\n|\\r/g, '\n');
    // 本專案無 MP：說明統一改為消耗 HP
    raw = raw.replace(/消耗\s*MP/gi, '消耗HP');
    raw = raw.replace(/MP\s*#mpCon/gi, 'HP #mpCon');
    raw = raw.replace(/每秒消耗\s*#mpCon\s*MP/gi, '每秒消耗HP #mpCon');
    raw = raw.replace(/增加消耗MP/gi, '額外提高耗血');
    raw = raw.replace(/消耗更多的MP/gi, '消耗更多的HP');
    raw = raw.replace(/消耗更大量的MP/gi, '消耗更多的HP');
    raw = raw.replace(/恢復HP與MP/gi, '恢復HP');
    raw = raw.replace(/基本HP、MP/gi, '最大HP');
    raw = raw.replace(/最大MP/gi, '最大HP');
    raw = raw.replace(/吸收對方的MP/gi, '吸收對方的生命力');
    raw = raw.replace(/吸收最大MP/gi, '吸收最大HP');

    // 先替換 #cr / #costmpR 等占位符，再處理 #c…# 色碼
    // （若先吃色碼，#costmpR%…#damR% 會被誤判成 #c…#）
    raw = raw.replace(/#([a-zA-Z][a-zA-Z0-9]*)(%p|%)?/g, (match, key, suffix) => {
      if (key.toLowerCase() === 'c') return match;
      const val = evalPlaceholder(common, key, level);
      if (val == null) return match;
      return formatPlaceholderNumber(val) + (suffix || '');
    });

    const marks = [];
    raw = raw.replace(/#c([^#]*)#/gi, (_, inner) => {
      const i = marks.length;
      marks.push(inner);
      return `\u0000C${i}\u0001`;
    });

    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let html = escaped.replace(/\u0000C(\d+)\u0001/g, (_, idx) => {
      const inner = String(marks[Number(idx)] || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<span class="skb-tip-em">${inner}</span>`;
    });

    html = html.replace(/\r\n|\n|\r/g, '<br>');
    return html;
  }

  /**
   * 一般怪物傷害加成（common.u）。
   * WZ 的 u 欄位常為範圍／次數等非傷害用途，僅在說明明確引用 #u 為一般怪加傷時才套用。
   */
  function resolveNormalMobBonusPct(skill, level) {
    const common = skill?.common;
    if (!common) return 0;
    const lv = Math.max(0, Number(level) || 0);
    // 明確 nbdR（烈焰翔斬等）
    if (common.nbdR != null && String(common.nbdR).trim() !== '') {
      const n = evalExpr(common.nbdR, { x: lv });
      if (Number.isFinite(n) && n > 0) return n;
    }
    if (common.u == null || String(common.u).trim() === '') return 0;
    const text = `${skill?.h || ''}\n${skill?.desc || ''}`;
    if (!/#u(?:%p|%)?/i.test(text)) return 0;
    if (/#u秒|#u次|#uMP|攻擊耐性減少#u|傷害減少#u|隊員攻擊時#u/i.test(text)) return 0;
    const isBonus = /#u%p/i.test(text)
      || (/(?:一般怪物|普通怪物)/.test(text) && /傷害/.test(text) && /#u%/.test(text));
    if (!isBonus) return 0;
    const n = evalExpr(common.u, { x: lv });
    return Number.isFinite(n) ? n : 0;
  }

  return {
    evalExpr,
    evalCommon,
    evalStatCommon,
    resolveCooltimeSec,
    tokenize,
    evalPlaceholder,
    formatPlaceholderNumber,
    formatSkillText,
    resolveNormalMobBonusPct,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillFormula = SkillFormula;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillFormula;
}
