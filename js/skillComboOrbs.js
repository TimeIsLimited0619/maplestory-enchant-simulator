/**
 * 英雄線鬥氣層數（1100013 → 1110013 → 1120003 + hyper）
 *
 * 進階鬥氣的 prop 是「一次補 2 層」機率，充能機率繼承自鬥氣綜合／集中。
 */
const SkillComboOrbs = (() => {
  const IDS = {
    basic: '1100013',
    mid: '1110013',
    adv: '1120003',
    hyperDam: '1120043',
    hyperProp: '1120044',
    hyperBoss: '1120045',
  };

  /** 這些技能的 damR／prop／w 是每層或機率，不可當永久 flat */
  const COMBO_META_IDS = new Set([
    IDS.basic, IDS.mid, IDS.adv,
    IDS.hyperDam, IDS.hyperProp, IDS.hyperBoss,
  ]);

  let stacks = 0;

  function levelOf(id) {
    if (typeof CharacterSkills === 'undefined') return 0;
    return Math.max(0, Number(CharacterSkills.getLevel?.(id)) || 0);
  }

  function skillOf(id) {
    if (typeof SkillCatalog === 'undefined') return null;
    return SkillCatalog.getSkill?.(id) || null;
  }

  function evalStat(id) {
    const skill = skillOf(id);
    const lv = levelOf(id);
    if (!skill || !(lv > 0) || typeof SkillFormula === 'undefined') return null;
    return SkillFormula.evalStatCommon(skill.common, lv);
  }

  function chargePropFromLower() {
    const mid = evalStat(IDS.mid);
    if (mid) return Number(mid.prop) || 0;
    const basic = evalStat(IDS.basic);
    if (basic) return Number(basic.prop) || 0;
    return 40;
  }

  function defendPropFromMid() {
    const mid = evalStat(IDS.mid);
    return mid ? (Number(mid.subProp) || 0) : 0;
  }

  /** 使用最高已學的鬥氣技能作為規則來源 */
  function getConfig() {
    const adv = evalStat(IDS.adv);
    if (adv) {
      let doubleProp = Number(adv.prop) || 0;
      if (levelOf(IDS.hyperProp) > 0) {
        const hp = evalStat(IDS.hyperProp);
        doubleProp += Number(hp?.prop) || 0;
      }
      let perStackFinal = Number(adv.v) || 0;
      if (levelOf(IDS.hyperDam) > 0) {
        const hd = evalStat(IDS.hyperDam);
        perStackFinal += Number(hd?.damR) || 0;
      }
      let perStackBoss = 0;
      if (levelOf(IDS.hyperBoss) > 0) {
        const hb = evalStat(IDS.hyperBoss);
        perStackBoss += Number(hb?.w) || 0;
      }
      return {
        id: IDS.adv,
        max: Math.max(1, Math.floor(Number(adv.xVal) || 5)),
        chargeProp: chargePropFromLower(),
        doubleProp,
        defendProp: defendPropFromMid(),
        perStackPad: 0,
        perStackFinal,
        perStackBoss,
        mastery: Number(adv.mastery) || 0,
      };
    }
    const mid = evalStat(IDS.mid);
    if (mid) {
      return {
        id: IDS.mid,
        max: Math.max(1, Math.floor(Number(mid.xVal) || 5)),
        chargeProp: Number(mid.prop) || 0,
        doubleProp: 0,
        defendProp: Number(mid.subProp) || 0,
        perStackPad: 0,
        perStackFinal: Number(mid.damR) || 0,
        perStackBoss: 0,
        mastery: 0,
      };
    }
    const basic = evalStat(IDS.basic);
    if (basic) {
      return {
        id: IDS.basic,
        max: Math.max(1, Math.floor(Number(basic.xVal) || 5)),
        chargeProp: Number(basic.prop) || 0,
        doubleProp: 0,
        defendProp: 0,
        perStackPad: Number(basic.y) || 0,
        perStackFinal: 0,
        perStackBoss: 0,
        mastery: 0,
      };
    }
    return null;
  }

  function isEnabled() {
    return !!getConfig();
  }

  function getStacks() {
    const cfg = getConfig();
    if (!cfg) {
      stacks = 0;
      return 0;
    }
    stacks = Math.max(0, Math.min(cfg.max, stacks));
    return stacks;
  }

  function setStacks(n) {
    const cfg = getConfig();
    if (!cfg) {
      stacks = 0;
      return 0;
    }
    stacks = Math.max(0, Math.min(cfg.max, Math.floor(Number(n) || 0)));
    return stacks;
  }

  function rollPercent(p) {
    const n = Number(p) || 0;
    if (!(n > 0)) return false;
    return Math.random() * 100 < n;
  }

  function afterStackChange() {
    if (typeof CharacterCombatPanel !== 'undefined') {
      CharacterCombatPanel.syncToCombatPower?.();
    }
    // 層數變動 → 終傷／攻擊／BOSS 加乘已進 SkillModifiers，刷新角色面板顯示
    if (typeof UiCharacterInfo !== 'undefined') {
      UiCharacterInfo.refresh?.();
    }
    if (typeof IdleHunt !== 'undefined') IdleHunt.syncHuntOverlayBars?.();
    if (typeof IdleBoss !== 'undefined') IdleBoss.syncBossOverlayBars?.();
  }

  /** 攻擊命中後嘗試充能 */
  function onAttackHit() {
    const cfg = getConfig();
    if (!cfg) return { gained: 0, stacks: 0 };
    if (!rollPercent(cfg.chargeProp)) return { gained: 0, stacks: getStacks() };
    let gain = 1;
    if (cfg.doubleProp > 0 && rollPercent(cfg.doubleProp)) gain = 2;
    const before = getStacks();
    setStacks(before + gain);
    afterStackChange();
    return { gained: getStacks() - before, stacks: getStacks() };
  }

  /** 受傷時（subProp） */
  function onPlayerHit() {
    const cfg = getConfig();
    if (!cfg || !(cfg.defendProp > 0)) return { gained: 0, stacks: getStacks() };
    if (!rollPercent(cfg.defendProp)) return { gained: 0, stacks: getStacks() };
    const before = getStacks();
    setStacks(before + 1);
    afterStackChange();
    return { gained: getStacks() - before, stacks: getStacks() };
  }

  /** 消耗全部或指定層（預留） */
  function consume(count) {
    const n = Math.max(0, Math.floor(Number(count) || 0));
    const before = getStacks();
    if (n <= 0) {
      setStacks(0);
      afterStackChange();
      return before;
    }
    const used = Math.min(before, n);
    setStacks(before - used);
    afterStackChange();
    return used;
  }

  function isMaxed() {
    const cfg = getConfig();
    if (!cfg) return false;
    return getStacks() >= cfg.max;
  }

  function getModifierBonus() {
    const empty = typeof SkillModifiers !== 'undefined'
      ? SkillModifiers.emptyTotals()
      : {
        flatPad: 0, damR: 0, bdR: 0, finalDamR: 0, critRate: 0, critDmg: 0, ied: 0,
        flatStr: 0, flatDex: 0, flatInt: 0, flatLuk: 0, flatPdd: 0, mhpR: 0, flatHpPerLevel: 0,
        speedStages: 0, speedModifiers: 0, damAbsorbPct: 0, reflectPct: 0,
      };
    const cfg = getConfig();
    const n = getStacks();
    if (!cfg || !(n > 0)) return empty;
    return {
      ...empty,
      flatPad: n * (cfg.perStackPad || 0),
      finalDamR: n * (cfg.perStackFinal || 0),
      bdR: n * (cfg.perStackBoss || 0),
    };
  }

  /** 從技能 fx 抽出 state/1..N 球圖（略過 0） */
  function extractStateFrames(fx) {
    const stateMap = fx?.state;
    const stateFrames = [];
    if (!stateMap || typeof stateMap !== 'object') return stateFrames;
    Object.keys(stateMap)
      .map((k) => Number(k))
      .filter((k) => Number.isFinite(k) && k > 0)
      .sort((a, b) => a - b)
      .forEach((k) => {
        const frames = stateMap[String(k)];
        if (frames?.[0]?.src) stateFrames.push(frames[0]);
      });
    return stateFrames;
  }

  function getFxPack(id) {
    if (!(levelOf(id) > 0)) return null;
    const skill = skillOf(id);
    const fx = skill?.fx;
    if (!fx) return null;
    const stateFrames = extractStateFrames(fx);
    const special = fx.special || null;
    const orbFrames = stateFrames.length
      ? stateFrames
      : (special?.frames?.length ? [special.frames[0]] : []);
    if (!orbFrames.length && !special?.frames?.length) return null;
    return {
      skillId: id,
      stateFrames: orbFrames,
      special,
      stateStart: fx.stateStart || null,
      relMove: special?.relMove || [0, -40],
      repeatFrom: Math.max(0, Number(special?.repeat) || 0),
    };
  }

  /**
   * 一般（藍）／進階（橘）兩套特效。
   * 藍球：優先 1110013 state，special 用 1100013；
   * 橘球／橘背：1120003。
   */
  function getVisualPalettes() {
    const basic = getFxPack(IDS.basic);
    const mid = getFxPack(IDS.mid);
    const adv = getFxPack(IDS.adv);
    if (!basic && !mid && !adv) return null;

    const blue = {
      stateFrames: (mid?.stateFrames?.length ? mid.stateFrames : null)
        || basic?.stateFrames
        || [],
      special: basic?.special || mid?.special || null,
      relMove: basic?.relMove || mid?.relMove || adv?.relMove || [0, -40],
      repeatFrom: basic?.repeatFrom || mid?.repeatFrom || 0,
    };
    const orange = adv
      ? {
        stateFrames: adv.stateFrames || [],
        special: adv.special || null,
        relMove: adv.relMove || [0, -40],
        repeatFrom: adv.repeatFrom || 0,
      }
      : null;

    return { blue, orange, hasAdvanced: !!adv };
  }

  /**
   * 顯示層數邏輯（畫面最多 5 顆）：
   * 1～5：全藍，顆數 = n
   * 6～10：固定 5 顆，橘 = n-5，藍 = 5-(n-5)；一顆一顆蓋成橘
   * 例：6 → 4藍1橘；8 → 2藍3橘；10 → 0藍5橘
   */
  function getOrbLayout(stacks) {
    const n = Math.max(0, Math.floor(Number(stacks) || 0));
    const pals = getVisualPalettes();
    if (!pals || !(n > 0)) {
      return { total: 0, blue: 0, orange: 0, slots: [] };
    }
    const canOrange = pals.hasAdvanced && pals.orange?.stateFrames?.length;
    if (!canOrange || n <= 5) {
      const total = Math.min(n, 5);
      const slots = Array.from({ length: total }, (_, i) => ({
        tone: 'blue',
        iconIndex: i,
      }));
      return { total, blue: total, orange: 0, slots };
    }
    const orange = Math.min(5, n - 5);
    const blue = 5 - orange;
    const slots = [];
    // 前 orange 顆蓋成橘，其餘維持藍
    for (let i = 0; i < 5; i += 1) {
      slots.push({
        tone: i < orange ? 'orange' : 'blue',
        iconIndex: i,
      });
    }
    return { total: 5, blue, orange, slots };
  }

  /** @deprecated 相容舊呼叫 */
  function getVisualFx() {
    const pals = getVisualPalettes();
    if (!pals) return null;
    const pack = pals.orange || pals.blue;
    return {
      skillId: pals.orange ? IDS.adv : (levelOf(IDS.mid) > 0 ? IDS.mid : IDS.basic),
      stateFrames: pack.stateFrames,
      special: pack.special,
      relMove: pack.relMove,
      repeatFrom: pack.repeatFrom,
    };
  }

  /** @type {number|null} */
  let visualRaf = null;
  /** @type {WeakMap<HTMLElement, object>} */
  const visualState = new WeakMap();

  function stopVisualLoop() {
    if (visualRaf != null) {
      cancelAnimationFrame(visualRaf);
      visualRaf = null;
    }
  }

  function applyImgFrame(img, frame) {
    if (!img || !frame?.src) return;
    const ox = frame.origin?.[0] ?? 0;
    const oy = frame.origin?.[1] ?? 0;
    img.style.setProperty('--ox', `${ox}px`);
    img.style.setProperty('--oy', `${oy}px`);
    if (img.dataset.src !== frame.src) {
      img.dataset.src = frame.src;
      img.src = frame.src;
    }
  }

  function tickVisual(ts) {
    visualRaf = null;
    const players = document.querySelectorAll('.idle-actor--player');
    let any = false;

    players.forEach((playerEl) => {
      const st = visualState.get(playerEl);
      if (!st) return;
      any = true;
      if (!st.lastTs) st.lastTs = ts;
      const dt = Math.max(0, ts - st.lastTs);
      st.lastTs = ts;
      st.angle = (st.angle + dt * st.spinRadPerMs) % (Math.PI * 2);

      let cx = st.fallbackCx;
      let cy = st.fallbackCy;
      if (typeof Paperdoll !== 'undefined' && Paperdoll.getHuntFeetAnchor) {
        const a = Paperdoll.getHuntFeetAnchor(playerEl);
        if (a) {
          cx = a.x + st.relX;
          cy = a.y + st.relY;
        }
      }
      const left = `${Math.round(cx)}px`;
      const top = `${Math.round(cy)}px`;

      // special：人物背後固定一層（不轉圈）
      if (st.specialEl) {
        st.specialEl.style.left = left;
        st.specialEl.style.top = top;
        if (st.specialFrames?.length) {
          st.specialAcc = (Number(st.specialAcc) || 0) + dt;
          let idx = Number(st.specialIdx) || 0;
          const frames = st.specialFrames;
          let guard = 0;
          while (guard < 8 && st.specialAcc >= (Number(frames[idx]?.delay) || 60)) {
            st.specialAcc -= Number(frames[idx]?.delay) || 60;
            idx += 1;
            if (idx >= frames.length) {
              idx = Math.min(Math.max(0, st.repeatFrom), frames.length - 1);
            }
            guard += 1;
          }
          st.specialIdx = idx;
          applyImgFrame(st.specialImg, frames[idx]);
        }
      }

      // 球：正圓公轉（radius 相同，不壓扁）
      if (st.orbitEl) {
        st.orbitEl.style.left = left;
        st.orbitEl.style.top = top;
        const balls = st.orbitEl.querySelectorAll('.idle-combo-orb-ball');
        const n = Math.max(1, balls.length);
        balls.forEach((ball, i) => {
          const base = st.angle + (i * Math.PI * 2) / n;
          const x = Math.cos(base) * st.radius;
          const y = Math.sin(base) * st.radius;
          ball.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
          // 下方球略後、上方球略前，仍維持正圓軌跡
          ball.style.zIndex = y > 0 ? '1' : '3';
        });
      }
    });

    if (any) visualRaf = requestAnimationFrame(tickVisual);
  }

  function ensureVisualLoop() {
    if (visualRaf == null) visualRaf = requestAnimationFrame(tickVisual);
  }

  /**
   * special = 人物背後；球 = 正圓。
   * 1～5 全藍；6～10 固定 5 顆，橘逐顆覆蓋（6=4藍1橘、8=2藍3橘）。
   */
  function syncVisual(playerEl) {
    if (!playerEl) return;
    const n = getStacks();
    const pals = getVisualPalettes();
    const layout = getOrbLayout(n);

    let specialEl = playerEl.querySelector('.idle-combo-special');
    let orbitEl = playerEl.querySelector('.idle-combo-orbit');

    if (!(n > 0) || !pals || !(layout.total > 0)) {
      specialEl?.remove();
      orbitEl?.remove();
      visualState.delete(playerEl);
      if (!document.querySelector('.idle-combo-orbit, .idle-combo-special')) stopVisualLoop();
      return;
    }

    const backPack = (layout.orange > 0 && pals.orange?.special)
      ? pals.orange
      : pals.blue;
    const specialFrames = (backPack?.special?.frames || []).filter((f) => f?.src);
    const relX = Number(backPack?.relMove?.[0] || pals.blue?.relMove?.[0]) || 0;
    const relY = Number(backPack?.relMove?.[1] || pals.blue?.relMove?.[1]) || -40;
    const prev = visualState.get(playerEl);
    const backTone = layout.orange > 0 ? 'orange' : 'blue';
    const toneChanged = !!(prev?.backTone && prev.backTone !== backTone);

    let specialImg = null;
    if (specialFrames.length) {
      if (!specialEl) {
        specialEl = document.createElement('div');
        specialEl.className = 'idle-combo-special';
        specialEl.setAttribute('aria-hidden', 'true');
        specialImg = document.createElement('img');
        specialImg.className = 'idle-combo-special-sprite';
        specialImg.alt = '';
        specialImg.draggable = false;
        specialEl.appendChild(specialImg);
        playerEl.insertBefore(specialEl, playerEl.firstChild);
      } else {
        specialImg = specialEl.querySelector('.idle-combo-special-sprite');
      }
      if (specialImg && (toneChanged || prev?.specialIdx == null)) {
        applyImgFrame(specialImg, specialFrames[0]);
      }
    } else {
      specialEl?.remove();
      specialEl = null;
    }

    const blueIcons = pals.blue?.stateFrames || [];
    const orangeIcons = pals.orange?.stateFrames || [];
    const slotKey = layout.slots.map((s) => s.tone).join('');

    if (layout.total > 0 && (blueIcons.length || orangeIcons.length)) {
      if (!orbitEl) {
        orbitEl = document.createElement('div');
        orbitEl.className = 'idle-combo-orbit';
        orbitEl.setAttribute('aria-hidden', 'true');
        playerEl.appendChild(orbitEl);
      }
      const needRebuild = orbitEl.dataset.slotKey !== slotKey
        || orbitEl.querySelectorAll('.idle-combo-orb-ball').length !== layout.total;
      if (needRebuild) {
        orbitEl.innerHTML = '';
        orbitEl.dataset.slotKey = slotKey;
        layout.slots.forEach((slot) => {
          const ball = document.createElement('div');
          ball.className = `idle-combo-orb-ball is-${slot.tone}`;
          ball.dataset.tone = slot.tone;
          const img = document.createElement('img');
          img.className = 'idle-combo-orb-sprite';
          img.alt = '';
          img.draggable = false;
          img.decoding = 'async';
          const icons = slot.tone === 'orange' ? orangeIcons : blueIcons;
          const frame = icons.length
            ? icons[slot.iconIndex % icons.length]
            : (blueIcons[0] || orangeIcons[0]);
          applyImgFrame(img, frame);
          ball.appendChild(img);
          orbitEl.appendChild(ball);
        });
      }
    } else {
      orbitEl?.remove();
      orbitEl = null;
    }

    visualState.set(playerEl, {
      playerEl,
      relX,
      relY,
      radius: 48,
      spinRadPerMs: (Math.PI * 2) / 2000,
      angle: prev?.angle || 0,
      lastTs: 0,
      specialEl,
      specialImg,
      specialFrames,
      specialIdx: toneChanged ? 0 : (prev?.specialIdx ?? 0),
      specialAcc: toneChanged ? 0 : (prev?.specialAcc ?? 0),
      repeatFrom: Math.max(0, Number(backPack?.repeatFrom) || 0),
      backTone,
      orbitEl,
      fallbackCx: 40,
      fallbackCy: 50,
    });

    ensureVisualLoop();
  }

  function clearVisual(playerEl) {
    playerEl?.querySelector?.('.idle-combo-orbit')?.remove();
    playerEl?.querySelector?.('.idle-combo-special')?.remove();
    if (playerEl) visualState.delete(playerEl);
    if (!document.querySelector('.idle-combo-orbit, .idle-combo-special')) stopVisualLoop();
  }

  function reset() {
    stacks = 0;
    document.querySelectorAll('.idle-combo-orbit, .idle-combo-special').forEach((el) => {
      const p = el.closest('.idle-actor--player');
      if (p) visualState.delete(p);
      el.remove();
    });
    stopVisualLoop();
  }

  return {
    IDS,
    COMBO_META_IDS,
    getConfig,
    isEnabled,
    getStacks,
    setStacks,
    reset,
    onAttackHit,
    onPlayerHit,
    consume,
    isMaxed,
    getModifierBonus,
    getVisualFx,
    getVisualPalettes,
    getOrbLayout,
    syncVisual,
    clearVisual,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillComboOrbs = SkillComboOrbs;
}
