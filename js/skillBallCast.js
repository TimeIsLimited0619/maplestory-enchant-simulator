/**
 * 法師 ball 施放管線：effect → launchGate → ball/beam → (special) → hit
 *
 * 座標系：playOnPlayer 的 effect stage 錨在腳底，sprite origin 對齊該點。
 * ball 發射點＝effect 錨點（腳底），不是 feet−origin（那會飛出畫面）。
 */
const SkillBallCast = (() => {
  function scaleRealMs(ms) {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.scaleDelayMs === 'function') {
      return IdleHunt.scaleDelayMs(ms);
    }
    return Math.max(0, Number(ms) || 0);
  }

  function gameSpeedMult() {
    if (typeof IdleHunt !== 'undefined' && typeof IdleHunt.getGameSpeed === 'function') {
      return Math.max(0.01, Number(IdleHunt.getGameSpeed()) || 1);
    }
    return 1;
  }

  function startMover(tick) {
    const mover = {
      done: false,
      tick(dt, ts) {
        if (mover.done) return;
        tick(dt, ts, mover);
      },
      cancel() {
        mover.done = true;
        if (typeof SkillEffectPlayer !== 'undefined') {
          SkillEffectPlayer.unregisterMover?.(mover);
        }
      },
    };
    const start = () => {
      if (typeof SkillEffectPlayer !== 'undefined' && SkillEffectPlayer.registerMover) {
        SkillEffectPlayer.registerMover(mover);
        return;
      }
      let last = 0;
      const step = (ts) => {
        if (mover.done) return;
        if (!last) last = ts;
        const dt = Math.min(50, Math.max(0, ts - last));
        last = ts;
        mover.tick(dt, ts);
        if (!mover.done) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    return { mover, start };
  }

  function framesDurationMs(frames, untilIdx) {
    const list = frames || [];
    const end = untilIdx != null ? Math.min(untilIdx, list.length) : list.length;
    let sum = 0;
    for (let i = 0; i < end; i += 1) {
      sum += Math.max(1, Number(list[i]?.delay) || 60);
    }
    return sum;
  }

  function buildPlan(skill, fx) {
    if (skill?.ballCast) return skill.ballCast;
    if (!fx?.ball) return null;
    if (Number(skill?.infoType) !== 2) return null;
    const layers = fx.ball.layers || [];
    const hasBeam = layers.some((l) => l.name === 'front') && layers.some((l) => l.name === 'rear');
    const timeRaw = Number(skill?.common?.time);
    const areaAttack = !!skill?.areaAttack;
    const hasOrbDuration = Number.isFinite(timeRaw) && timeRaw >= 100;
    if (areaAttack && hasOrbDuration && !hasBeam) {
      const launchFrame = 8;
      let launchMs = framesDurationMs(fx.effect, launchFrame);
      const xRaw = Number(skill?.common?.x);
      return {
        launchFrame,
        launchMs,
        ballMode: 'orb',
        travel: 'horizontal',
        travelDistancePx: Math.max(120, Math.min(420, Math.round((Number.isFinite(xRaw) ? xRaw : 600) / 5))),
        durationMs: Math.round(timeRaw),
        tickMs: (() => {
          const st = Number(skill?.common?.subTime);
          if (!(st > 0)) return 240;
          if (st >= 100) return Math.round(st);
          if (st <= 30) return Math.round(st * 60);
          return Math.round(st);
        })(),
        aoeRadius: Math.max(80, Math.min(200, Math.round((Number.isFinite(xRaw) ? xRaw : 600) / 12))),
        specialOnFirstHit: false,
        aoeOnSpecial: false,
        chain: false,
        speedPxPerMs: 0.55,
      };
    }

    const ballMode = hasBeam ? 'beam' : 'sprite';
    const launchFrame = 8;
    let launchMs = framesDurationMs(fx.effect, launchFrame);
    const ballDelay = Number(skill?.common?.ballDelay);
    if (Number.isFinite(ballDelay) && ballDelay > 0) launchMs = ballDelay;
    const chainAttack = !!skill?.chainAttack;
    if (chainAttack && ballMode === 'beam') {
      return {
        launchFrame,
        launchMs,
        ballMode,
        travel: 'horizontal',
        specialOnFirstHit: false,
        aoeOnSpecial: false,
        aoeRadius: Math.max(40, Number(skill?.common?.x) || 100),
        chain: false,
        instantBeam: true,
        instantTargets: 8,
        instantBeamLengthScale: 2,
        speedPxPerMs: 18 / 30,
      };
    }
    const chain = chainAttack || ballMode === 'beam';
    const rangeRaw = Number(skill?.common?.range);
    const yRaw = Number(skill?.common?.y);
    const chainRangePx = chain
      ? Math.min(560, Math.max(360, Math.round(Math.max(rangeRaw || 420, yRaw || 350) * 1.15)))
      : 0;
    return {
      launchFrame,
      launchMs,
      ballMode,
      travel: 'horizontal',
      specialOnFirstHit: !!(fx.special?.frames?.length),
      aoeOnSpecial: !!(fx.special?.frames?.length) && !(skill?.chainAttack),
      aoeRadius: Math.max(40, Number(skill?.common?.x) || 100),
      chain,
      chainRangePx,
      chainFirstRangePx: chain ? Math.min(640, Math.round(chainRangePx * 1.4)) : 0,
      speedPxPerMs: 18 / 30,
    };
  }

  function isBallCastSkill(skill, fx) {
    const plan = buildPlan(skill, fx);
    if (!plan) return false;
    if (fx?.ball?.frames?.length) return true;
    if (fx?.ball?.layers?.length) return true;
    return false;
  }

  function evalCommonNum(expr, level = 1) {
    if (expr == null || String(expr) === '') return 0;
    if (typeof SkillFormula !== 'undefined' && typeof SkillFormula.evalExpr === 'function') {
      const n = SkillFormula.evalExpr(expr, { x: Math.max(0, Number(level) || 0) });
      return Number.isFinite(n) ? n : 0;
    }
    const n = Number(expr);
    return Number.isFinite(n) ? n : 0;
  }

  /** 散式投擲額外行：主線角度 0，兩側對稱散開 */
  function extraFanAngles(extraCount, stepDeg = 18) {
    const n = Math.max(0, Math.floor(Number(extraCount) || 0));
    if (!n) return [];
    const step = (Number(stepDeg) || 18) * Math.PI / 180;
    const left = Math.ceil(n / 2);
    const right = n - left;
    const out = [];
    for (let i = left; i >= 1; i -= 1) out.push(-i * step);
    for (let i = 1; i <= right; i += 1) out.push(i * step);
    return out;
  }

  /**
   * 雙弩多箭／飛鏢：bulletCount + ballDelay / ballDelay1..N
   * extraCount：超技追加發數（四飛閃-額外攻擊）；超出的 delay 沿用最後一發。
   * 僅 sprite 單飛路徑；chain／beam／orb／aoeOnSpecial 維持單發。
   * @returns {{ count: number, delaysMs: number[] }|null}
   */
  function resolveBulletVolleys(skill, plan, level = 1, extraCount = 0) {
    if (!plan || plan.ballMode !== 'sprite') return null;
    if (plan.chain || plan.instantBeam || plan.aoeOnSpecial) return null;
    const c = skill?.common || {};
    if (c.bulletCount == null || String(c.bulletCount) === '') return null;
    const baseCount = Math.max(1, Math.floor(evalCommonNum(c.bulletCount, level)) || 1);
    const extra = Math.max(0, Math.floor(Number(extraCount) || 0));
    const count = baseCount + extra;
    if (count <= 1) return null;
    const fallback = Math.max(
      60,
      evalCommonNum(c.ballDelay, level) || Number(plan.launchMs) || 150,
    );
    const delaysMs = [];
    for (let i = 0; i < count; i += 1) {
      const key = i === 0 ? 'ballDelay' : `ballDelay${i}`;
      let d = evalCommonNum(c[key], level);
      if (!(d > 0)) {
        d = (i >= baseCount && delaysMs.length) ? delaysMs[delaysMs.length - 1] : fallback;
      }
      delaysMs.push(d);
    }
    return { count, delaysMs };
  }

  function ballSpriteFrames(fx) {
    if (fx?.ball?.frames?.length) return fx.ball.frames;
    const layers = fx?.ball?.layers || [];
    const numeric = layers.find((l) => /^\d+$/.test(String(l.name)));
    return (numeric || layers[0])?.frames || [];
  }

  function beamLayers(fx) {
    const layers = fx?.ball?.layers || [];
    const byName = Object.create(null);
    layers.forEach((l) => { byName[String(l.name)] = l.frames || []; });
    const bodyParts = layers
      .filter((l) => /^\d+$/.test(String(l.name)))
      .sort((a, b) => Number(a.name) - Number(b.name))
      .map((l) => ({ name: l.name, frames: l.frames || [] }));
    return {
      front: byName.front || [],
      bodyParts,
      rear: byName.rear || [],
    };
  }

  function fieldRectPoint(fieldEl, clientX, clientY) {
    const fr = fieldEl.getBoundingClientRect();
    return { x: clientX - fr.left, y: clientY - fr.top };
  }

  /**
   * 箭矢發射點：角色身體中段、朝向側前方一點。
   * fieldPointFromPlayer 的 ox 以朝左為準；朝右時 x = feetX - ox，故 ox 負值＝偏右。
   */
  function launchPointFromEffect(fieldEl, playerEl, facingRight = true, offset) {
    const startOffset = (Array.isArray(offset) && offset.length >= 2)
      ? offset
      : [-58, -24];
    if (typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.fieldPointFromPlayer === 'function') {
      return SkillEffectPlayer.fieldPointFromPlayer(fieldEl, playerEl, startOffset, facingRight);
    }
    return { x: 120, y: 100 };
  }

  function mobPoint(fieldEl, mob) {
    return SkillEffectPlayer?.fieldPointFromMob?.(fieldEl, mob) || null;
  }

  function mobPointOrFallback(fieldEl, mob, fallbackIndex = 0) {
    const mp = mobPoint(fieldEl, mob);
    if (mp) return mp;
    return { x: 120 + fallbackIndex * 40, y: 140 };
  }
  function isMobAliveForChain(mob) {
    return !!(mob && mob.hp > 0);
  }

  /** 非連鎖技能選目標：跳過已被閃電連擊預約的怪 */
  function isMobChainSelectable(mob) {
    if (!isMobAliveForChain(mob)) return false;
    if (typeof SkillCombat !== 'undefined' && SkillCombat.isMobChainReserved?.(mob)) return false;
    return true;
  }

  /** 依佇列順序取前 N 隻存活怪（瞬發光束用） */
  function targetsByQueue(fieldEl, mobs, maxCount) {
    const out = [];
    (mobs || []).forEach((mob, i) => {
      if (!isMobAliveForChain(mob)) return;
      if (out.length >= Math.max(1, maxCount || 1)) return;
      const mp = mobPointOrFallback(fieldEl, mob, i);
      out.push({ mob, x: mp.x, y: mp.y });
    });
    return out;
  }

  /** 依佇列順序取前 N 隻存活怪（魔靈彈等，跳過連鎖預約） */
  function targetsByCount(fieldEl, mobs, maxCount) {
    const out = [];
    (mobs || []).forEach((mob) => {
      if (!isMobChainSelectable(mob)) return;
      if (out.length >= Math.max(1, maxCount || 1)) return;
      const mp = mobPoint(fieldEl, mob);
      out.push({
        mob,
        x: mp?.x ?? (120 + out.length * 40),
        y: mp?.y ?? 140,
      });
    });
    return out;
  }

  /**
   * 連鎖下一跳：從 (cx,cy) 半径內找最近且未命中過的怪。
   * preferQueueFirst=true 時優先佇列前排（仍在範圍內）。
   */
  function pickNextChainTarget(fieldEl, mobs, cx, cy, rangePx, hitUids, preferQueueFirst = false, preferQueueOrder = false) {
    const range = Math.max(80, Number(rangePx) || 320);
    // 連鎖建路徑不看預約：連續第二發仍可鎖定同一批怪；預約只擋普攻／其他技能
    const alive = (mobs || []).filter((m) => isMobAliveForChain(m) && !hitUids.has(String(m.uid)));
    if (!alive.length) return null;

    if (preferQueueFirst) {
      const front = alive[0];
      const mp = mobPointOrFallback(fieldEl, front, 0);
      const d = Math.hypot(mp.x - cx, mp.y - cy);
      if (d <= range) return { mob: front, x: mp.x, y: mp.y, dist: d };
    }

    if (preferQueueOrder) {
      for (let i = 0; i < alive.length; i += 1) {
        const mob = alive[i];
        const mp = mobPointOrFallback(fieldEl, mob, i);
        const d = Math.hypot(mp.x - cx, mp.y - cy);
        if (d <= range) return { mob, x: mp.x, y: mp.y, dist: d };
      }
      return null;
    }

    let best = null;
    alive.forEach((mob, i) => {
      const mp = mobPointOrFallback(fieldEl, mob, i);
      const d = Math.hypot(mp.x - cx, mp.y - cy);
      if (d > range) return;
      if (!best || d < best.dist) best = { mob, x: mp.x, y: mp.y, dist: d };
    });
    return best;
  }

  /** 施放當下鎖定整條連鎖路徑（目標 + 座標），避免連鎖中佇列補位改變落點 */
  function buildChainPath(fieldEl, mobs, maxTargets, chainRangePx, firstRangePx, startX, startY) {
    const chainRange = Math.max(280, Number(chainRangePx) || 420);
    const firstRange = Math.max(chainRange, Number(firstRangePx) || Math.round(chainRange * 1.4));
    const hitUids = new Set();
    const path = [];
    let cx = startX;
    let cy = startY;
    for (let i = 0; i < Math.max(1, maxTargets || 1); i += 1) {
      const range = i === 0 ? firstRange : chainRange;
      const tgt = pickNextChainTarget(
        fieldEl,
        mobs,
        cx,
        cy,
        range,
        hitUids,
        false,
        i === 0,
      );
      if (!tgt) break;
      hitUids.add(String(tgt.mob.uid));
      path.push(tgt);
      cx = tgt.x;
      cy = tgt.y;
    }
    return path;
  }

  function mobsInRadius(fieldEl, cx, cy, radius, mobs, maxCount) {
    const rows = [];
    (mobs || []).forEach((mob) => {
      if (!mob || mob.hp <= 0) return;
      const mp = mobPoint(fieldEl, mob);
      if (!mp) return;
      const dist = Math.hypot(mp.x - cx, mp.y - cy);
      if (dist <= radius) rows.push({ mob, dist });
    });
    rows.sort((a, b) => a.dist - b.dist);
    return rows.slice(0, Math.max(1, maxCount)).map((r) => r.mob);
  }

  /** 朝向方向最近的一隻怪（不嚴格鎖 Y，避免發射點微偏就找不到） */
  function firstMobAhead(fieldEl, spawnX, mobs, facingRight) {
    let best = null;
    (mobs || []).forEach((mob) => {
      if (!mob || mob.hp <= 0) return;
      const mp = mobPoint(fieldEl, mob);
      if (!mp) return;
      if (facingRight && mp.x <= spawnX + 4) return;
      if (!facingRight && mp.x >= spawnX - 4) return;
      if (!best) best = { mob, x: mp.x, y: mp.y };
      else if (facingRight ? mp.x < best.x : mp.x > best.x) best = { mob, x: mp.x, y: mp.y };
    });
    return best;
  }

  function orderTargets(fieldEl, mobs, maxTargets, facingRight) {
    const rows = [];
    (mobs || []).forEach((mob) => {
      if (!mob || mob.hp <= 0) return;
      const mp = mobPoint(fieldEl, mob);
      if (!mp) return;
      rows.push({ mob, x: mp.x, y: mp.y });
    });
    rows.sort((a, b) => (facingRight ? a.x - b.x : b.x - a.x));
    return rows.slice(0, Math.max(1, maxTargets));
  }

  function ensureFxPreload(framesList) {
    const urls = [];
    (framesList || []).forEach((frames) => {
      (frames || []).forEach((f) => { if (f?.src) urls.push(f.src); });
    });
    if (typeof EnchantImagePreload !== 'undefined' && urls.length) {
      return EnchantImagePreload.preloadMany(urls, new Map()).catch(() => {});
    }
    return Promise.resolve();
  }

  function applySpriteFrame(img, frame) {
    if (!frame?.src) return;
    img.style.setProperty('--ox', `${frame.origin?.[0] ?? 0}px`);
    img.style.setProperty('--oy', `${frame.origin?.[1] ?? 0}px`);
    if (img.dataset.src !== frame.src) {
      img.dataset.src = frame.src;
      img.src = frame.src;
    }
    img.hidden = false;
  }

  function createAnimImg(frames, className) {
    const list = (frames || []).filter((f) => f?.src);
    if (!list.length) return null;
    const img = document.createElement('img');
    img.className = className || 'idle-skill-fx-sprite';
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    applySpriteFrame(img, list[0]);
    if (list.length <= 1) {
      return { img, list, stop: () => {} };
    }
    let idx = 0;
    let acc = 0;
    const { mover, start } = startMover((dt) => {
      if (mover.done) return;
      if (!img.isConnected) {
        mover.cancel();
        return;
      }
      acc += dt;
      const frameDelay = scaleRealMs(Math.max(30, Number(list[idx % list.length]?.delay) || 60));
      if (acc >= frameDelay) {
        acc -= frameDelay;
        idx = (idx + 1) % list.length;
        applySpriteFrame(img, list[idx]);
      }
    });
    start();
    return { img, list, stop: () => mover.cancel() };
  }

  function skillFxLayer(fieldEl) {
    if (typeof SkillEffectPlayer !== 'undefined' && SkillEffectPlayer.getSkillFxLayer) {
      return SkillEffectPlayer.getSkillFxLayer(fieldEl);
    }
    return fieldEl;
  }

  function setGpuPos(el, x, y, extra) {
    if (typeof SkillEffectPlayer !== 'undefined' && typeof SkillEffectPlayer.setGpuPos === 'function') {
      SkillEffectPlayer.setGpuPos(el, x, y, extra);
      return;
    }
    if (!el) return;
    const nx = Number(x);
    const ny = Number(y);
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;
    let extraStr = extra === undefined ? (el._gpuExtra || '') : String(extra || '');
    if (extraStr === 'none') extraStr = '';
    extraStr = extraStr.trim();
    el._gpuExtra = extraStr;
    el._gpuX = nx;
    el._gpuY = ny;
    const next = extraStr
      ? `translate3d(${nx}px, ${ny}px, 0) ${extraStr}`
      : `translate3d(${nx}px, ${ny}px, 0)`;
    if (el.style.transform !== next) el.style.transform = next;
  }

  let liveBalls = 0;
  /** @type {Array<{ stage: HTMLElement, stop: () => void }>} */
  const liveBallList = [];
  const MAX_LIVE_BALLS = 64;

  function createSpriteStage(fieldEl, frames, facingRight, opts = {}) {
    const list = (frames || []).filter((f) => f?.src);
    if (!list.length) return null;
    const layer = skillFxLayer(fieldEl);
    if (!layer) return null;
    while (liveBallList.length >= MAX_LIVE_BALLS) {
      const oldest = liveBallList.shift();
      try {
        oldest?.stop?.();
        oldest?.stage?.remove?.();
      } catch (_) { /* ignore */ }
    }
    const stage = document.createElement('div');
    stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--ball';
    const anim = createAnimImg(list, 'idle-skill-fx-sprite');
    if (!anim) return null;
    stage.appendChild(anim.img);
    // 飛向目標時由 travelToPoint 旋轉對準，不先依面向鏡像
    if (!opts.skipFacingFlip) {
      setGpuPos(stage, 0, 0, facingRight ? 'scaleX(-1)' : '');
    }
    layer.appendChild(stage);
    liveBalls += 1;
    let released = false;
    const entry = { stage, stop: null };
    const release = () => {
      if (released) return;
      released = true;
      liveBalls = Math.max(0, liveBalls - 1);
      anim.stop?.();
      const idx = liveBallList.indexOf(entry);
      if (idx >= 0) liveBallList.splice(idx, 1);
    };
    entry.stop = release;
    liveBallList.push(entry);
    return { stage, stop: release };
  }

  /**
   * 閃電連擊：在 from→to 之間拉一條 front／body／rear 光束（可見）。
   * 用寬度＝距離 + rotate，不依賴飛行動畫才「出現」。
   */
  function placeBeamSegment(fieldEl, beam, x0, y0, x1, y1, opts = {}) {
    const lengthScale = Math.max(1, Number(opts.lengthScale) || 1);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.max(24, Math.hypot(dx, dy));
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;

    const stage = document.createElement('div');
    stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--ball-beam';
    stage.style.width = `${len}px`;
    stage.style.height = '0';
    stage.style.transformOrigin = '0 50%';
    setGpuPos(stage, x0, y0, lengthScale !== 1
      ? `rotate(${deg}deg) scaleX(${lengthScale})`
      : `rotate(${deg}deg)`);

    const stoppers = [];
    const addPart = (frames, cls) => {
      const anim = createAnimImg(frames, `idle-skill-fx-sprite idle-skill-fx-sprite--beam ${cls}`);
      if (!anim) return;
      stage.appendChild(anim.img);
      stoppers.push(anim.stop);
    };

    // WZ 命名：front 在施放端、rear 在命中端（與鏈路 from→to 對齊）
    addPart(beam.front, 'idle-skill-fx-sprite--beam-front');
    (beam.bodyParts || []).forEach((p) => {
      addPart(p.frames, 'idle-skill-fx-sprite--beam-body');
    });
    // 單段 body 時用重複填滿；多段 body（閃電連擊 0/1/2）靠 lengthScale 橫向拉伸
    const tileBody = (beam.bodyParts || []).find((p) => (p.frames || []).length)?.frames;
    const fillLen = len * lengthScale;
    if (tileBody?.length && (beam.bodyParts || []).length <= 1) {
      const approxSeg = 48;
      const extras = Math.max(0, Math.floor(fillLen / approxSeg) - 1);
      for (let i = 0; i < extras; i += 1) {
        addPart(tileBody, 'idle-skill-fx-sprite--beam-body');
      }
    }
    addPart(beam.rear, 'idle-skill-fx-sprite--beam-rear');

    if (!stage.childElementCount) {
      // fallback：任意有圖的層
      const any = ballSpriteFrames({ ball: { layers: [
        ...(beam.bodyParts || []).map((p) => ({ name: p.name, frames: p.frames })),
        { name: 'front', frames: beam.front },
        { name: 'rear', frames: beam.rear },
      ] } });
      addPart(any, 'idle-skill-fx-sprite--beam-body');
    }

    if (!stage.childElementCount) return null;
    const layer = skillFxLayer(fieldEl);
    if (!layer) return null;
    layer.appendChild(stage);

    return {
      stage,
      stop: () => {
        stoppers.forEach((s) => s());
        stage.remove();
      },
    };
  }

  function travelHorizontal(opts) {
    const {
      fromX,
      fromY,
      toX,
      speedPxPerMs = 18 / 30,
      facingRight = true,
      stage,
      onReach,
      onStep,
      keepStage = false,
    } = opts;
    if (!stage) {
      if (typeof onReach === 'function') onReach({ x: toX, y: fromY });
      return { start: () => {} };
    }

    let x = fromX;
    const y = fromY;
    setGpuPos(stage, x, y);
    let lastTs = 0;
    let done = false;
    const hitRadius = 28;

    const { mover, start } = startMover((dt) => {
      if (done) return;
      const dir = facingRight ? 1 : -1;
      x += dir * speedPxPerMs * dt;
      setGpuPos(stage, x, y);
      if (typeof onStep === 'function') onStep({ x, y });

      const reached = facingRight ? (x >= toX - hitRadius) : (x <= toX + hitRadius);
      if (reached) {
        done = true;
        mover.cancel();
        if (!keepStage) stage.remove();
        if (typeof onReach === 'function') onReach({ x: keepStage ? x : toX, y });
        return;
      }
      if (facingRight ? x > toX + 800 : x < toX - 800) {
        done = true;
        mover.cancel();
        if (!keepStage) stage.remove();
        if (typeof onReach === 'function') onReach({ x: keepStage ? x : toX, y });
      }
    });

    return { start };
  }

  /**
   * 出矢點 → 目標點直線飛行（參考閃電連擊 from→to）。
   * 依飛行方向旋轉球體，不再固定水平／垂直。
   */
  function travelToPoint(opts) {
    const {
      fromX,
      fromY,
      toX,
      toY,
      speedPxPerMs = 18 / 30,
      stage,
      onReach,
    } = opts;
    const endX = Number(toX);
    const endY = Number(toY);
    if (!stage) {
      if (typeof onReach === 'function') onReach({ x: endX, y: endY });
      return { start: () => {} };
    }

    const dx = endX - fromX;
    const dy = endY - fromY;
    const dist = Math.hypot(dx, dy);
    if (!(dist > 1)) {
      setGpuPos(stage, endX, endY);
      stage.remove();
      if (typeof onReach === 'function') onReach({ x: endX, y: endY });
      return { start: () => {} };
    }

    const ux = dx / dist;
    const uy = dy / dist;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    // 素材預設朝右；旋轉對準目標（同閃電連擊 beam 的 atan2）
    stage.style.transformOrigin = '50% 50%';
    setGpuPos(stage, fromX, fromY, `rotate(${deg}deg)`);

    let traveled = 0;
    let done = false;
    const hitRadius = 28;

    const { mover, start } = startMover((dt) => {
      if (done) return;
      if (!stage.isConnected) {
        done = true;
        mover.cancel();
        return;
      }
      traveled += Math.max(0, speedPxPerMs) * dt;
      if (traveled >= dist - hitRadius) {
        done = true;
        mover.cancel();
        stage.remove();
        if (typeof onReach === 'function') onReach({ x: endX, y: endY });
        return;
      }
      if (traveled > dist + 800) {
        done = true;
        mover.cancel();
        stage.remove();
        if (typeof onReach === 'function') onReach({ x: endX, y: endY });
        return;
      }
      setGpuPos(stage, fromX + ux * traveled, fromY + uy * traveled);
    });

    return { start };
  }

  /**
   * 從場上固定點對多個目標各飛一發 sprite（達克魯的密傳：書本位置出鏢）。
   * shots: [{ mob, delayMs }]
   */
  function playShotsFromPoint(opts = {}) {
    const fieldEl = opts.fieldEl;
    const frames = opts.frames;
    const fromX = Number(opts.fromX);
    const fromY = Number(opts.fromY);
    const shots = Array.isArray(opts.shots) ? opts.shots : [];
    const onHit = opts.onHit;
    const onDone = opts.onDone;
    const getMobs = opts.getMobs;
    const speed = (Number(opts.speedPxPerMs) > 0 ? Number(opts.speedPxPerMs) : 0.7) * gameSpeedMult();
    const finish = () => {
      if (typeof onDone === 'function') onDone();
    };

    if (!(Number.isFinite(fromX) && Number.isFinite(fromY)) || !shots.length) {
      finish();
      return false;
    }

    const resolveLive = (preferred) => {
      if (preferred && Number(preferred.hp) > 0) return preferred;
      const list = typeof getMobs === 'function' ? (getMobs() || []) : [];
      return (list || []).find((m) => m && Number(m.hp) > 0) || null;
    };

    if (typeof document !== 'undefined' && document.hidden) {
      shots.forEach((shot, i) => {
        const mob = resolveLive(shot?.mob);
        if (mob && typeof onHit === 'function') onHit(mob, i);
      });
      finish();
      return true;
    }

    let left = shots.length;
    const mark = () => {
      left -= 1;
      if (left <= 0) finish();
    };

    shots.forEach((shot, shotIndex) => {
      const fire = () => {
        const mob = resolveLive(shot?.mob);
        const dest = mob
          ? mobPointOrFallback(fieldEl, mob, shotIndex)
          : { x: fromX + 180, y: fromY };
        const reach = () => {
          const live = resolveLive(shot?.mob);
          if (live && typeof onHit === 'function') onHit(live, shotIndex);
          mark();
        };
        if (!mob) {
          mark();
          return;
        }
        const mover = createSpriteStage(fieldEl, frames, true, { skipFacingFlip: true });
        if (!mover) {
          reach();
          return;
        }
        const jitterY = (shotIndex % 5) * 4 - 8;
        const spawnY = fromY + jitterY;
        if (opts.home) {
          const livePoint = () => {
            const live = resolveLive(shot?.mob);
            if (!live) return null;
            return mobPoint(fieldEl, live) || dest;
          };
          travelFanThenHome({
            fromX,
            fromY: spawnY,
            angleRad: Math.atan2(dest.y - spawnY, dest.x - fromX),
            outPx: 0,
            speedPxPerMs: speed,
            stage: mover.stage,
            getTarget: livePoint,
            onReach: () => {
              mover.stop?.();
              reach();
            },
          }).start();
          return;
        }
        travelToPoint({
          fromX,
          fromY: spawnY,
          toX: dest.x,
          toY: dest.y,
          speedPxPerMs: speed,
          stage: mover.stage,
          onReach: () => {
            mover.stop?.();
            reach();
          },
        }).start();
      };
      const wait = scaleRealMs(Math.max(0, Number(shot?.delayMs) || 0));
      if (wait > 0) setTimeout(fire, wait);
      else fire();
    });
    return true;
  }

  const FAN_HOME_OUT_PX = 120;

  function applySpriteRot(stage, dx, dy) {
    if (!stage) return;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    stage.style.transformOrigin = '50% 50%';
    const x = Number.isFinite(stage._gpuX) ? stage._gpuX : 0;
    const y = Number.isFinite(stage._gpuY) ? stage._gpuY : 0;
    setGpuPos(stage, x, y, `rotate(${deg}deg)`);
  }

  /**
   * 扇形直線飛出。home !== false 時飛完 outPx 再追蹤（密傳）。
   * home === false：沿角度飛 travelPx 後 onReach，不轉向（散投額外行）。
   */
  function travelFanThenHome(opts) {
    const fromX = Number(opts.fromX);
    const fromY = Number(opts.fromY);
    const home = opts.home !== false;
    const rawOut = Number(opts.outPx);
    const rawTravel = Number(opts.travelPx);
    const outPx = home
      ? (Number.isFinite(rawOut) ? Math.max(0, rawOut) : FAN_HOME_OUT_PX)
      : (Number.isFinite(rawTravel) && rawTravel > 0 ? rawTravel : 360);
    const speed = Math.max(0.05, Number(opts.speedPxPerMs) || 0.55);
    const stage = opts.stage;
    const angleRad = Number(opts.angleRad) || 0;
    const getTarget = opts.getTarget;
    const onReach = opts.onReach;
    const hitRadius = 28;
    const ox = Math.cos(angleRad);
    const oy = Math.sin(angleRad);

    if (!stage) {
      const t = typeof getTarget === 'function' ? getTarget() : null;
      if (typeof onReach === 'function') onReach(t || { x: fromX, y: fromY });
      return { start: () => {} };
    }

    applySpriteRot(stage, ox, oy);
    setGpuPos(stage, fromX, fromY);

    let x = fromX;
    let y = fromY;
    let phase = 'out';
    let outLeft = outPx;
    let done = false;

    const finishAt = (pt) => {
      if (done) return;
      done = true;
      mover.cancel();
      stage.remove();
      if (typeof onReach === 'function') onReach(pt || { x, y });
    };

    const { mover, start } = startMover((dt) => {
      if (done) return;
      if (!stage.isConnected) {
        finishAt({ x, y });
        return;
      }
      const stepPx = speed * dt;

      if (phase === 'out') {
        const move = Math.min(stepPx, outLeft);
        x += ox * move;
        y += oy * move;
        outLeft -= move;
        setGpuPos(stage, x, y);
        if (outLeft <= 0.5) {
          if (!home) {
            finishAt({ x, y });
            return;
          }
          phase = 'home';
        }
        return;
      }

      const t = typeof getTarget === 'function' ? getTarget() : null;
      if (!t || !Number.isFinite(Number(t.x)) || !Number.isFinite(Number(t.y))) {
        finishAt({ x, y });
        return;
      }
      const dx = Number(t.x) - x;
      const dy = Number(t.y) - y;
      const dist = Math.hypot(dx, dy);
      if (!(dist > hitRadius)) {
        finishAt({ x: Number(t.x), y: Number(t.y) });
        return;
      }
      const ux = dx / dist;
      const uy = dy / dist;
      applySpriteRot(stage, ux, uy);
      x += ux * stepPx;
      y += uy * stepPx;
      setGpuPos(stage, x, y);
    });

    return { start };
  }

  function playSpecialAt(fieldEl, frames, pt, facingRight) {
    if (!frames?.length || typeof SkillEffectPlayer === 'undefined') return;
    SkillEffectPlayer.playAtField({
      fieldEl,
      frames,
      x: pt.x,
      y: pt.y,
      className: 'idle-skill-fx-stage idle-skill-fx-stage--ball-special',
      mirrorX: facingRight,
    });
  }

  /** 依落點半徑取最近的存活怪（orb 持續傷害用） */
  function targetsNearPoint(fieldEl, mobs, cx, cy, radiusPx, maxCount) {
    const radius = Math.max(40, Number(radiusPx) || 120);
    const scored = [];
    (mobs || []).forEach((mob, i) => {
      if (!isMobChainSelectable(mob)) return;
      const mp = mobPointOrFallback(fieldEl, mob, i);
      const d = Math.hypot(mp.x - cx, mp.y - cy);
      if (d > radius) return;
      scored.push({ mob, x: mp.x, y: mp.y, dist: d });
    });
    scored.sort((a, b) => a.dist - b.dist);
    return scored.slice(0, Math.max(1, maxCount || 1));
  }

  function runOrbBall(opts) {
    const {
      fieldEl,
      playerEl,
      fx,
      plan,
      mobList,
      maxTargets,
      facingRight,
      onTick,
      visualOnly = false,
      finish,
    } = opts;

    const spriteFrames = ballSpriteFrames(fx);
    const travelDist = Math.max(80, Number(plan.travelDistancePx) || 280);
    const durationMs = scaleRealMs(Math.max(500, Number(plan.durationMs) || 4000));
    const tickMs = scaleRealMs(Math.max(120, Number(plan.tickMs) || 240));
    const aoeRadius = Math.max(60, Number(plan.aoeRadius) || 120);
    const speed = (Number(plan.speedPxPerMs) || 0.55) * gameSpeedMult();
    const launchMs = scaleRealMs(Math.max(0, Number(plan.launchMs) || 0));
    const tickWhileTravel = !!plan.tickWhileTravel;
    const keepStage = !!plan.keepStage;

    ensureFxPreload([spriteFrames]).then(() => {
      setTimeout(() => {
        const spawn = launchPointFromEffect(fieldEl, playerEl, facingRight, plan.startOffset);
        let fromX = spawn.x;
        const fromY = spawn.y;
        const toX = fromX + (facingRight ? travelDist : -travelDist);

        const mover = createSpriteStage(fieldEl, spriteFrames, facingRight);
        if (!mover) {
          finish();
          return;
        }

        let lastTickAt = 0;
        const fireTick = (pt) => {
          if (visualOnly || typeof onTick !== 'function') return;
          const now = performance.now();
          if (lastTickAt && (now - lastTickAt) < tickMs) return;
          lastTickAt = now;
          const victims = targetsNearPoint(
            fieldEl,
            mobList(),
            pt.x,
            pt.y,
            aoeRadius,
            maxTargets,
          ).map((t) => t.mob);
          onTick(victims, pt);
        };

        const startLinger = (pt, stageObj) => {
          const endAt = performance.now() + durationMs;
          const tick = () => {
            if (performance.now() >= endAt) {
              stageObj.stop?.();
              stageObj.stage?.remove();
              finish();
              return;
            }
            fireTick(pt);
            setTimeout(tick, tickMs);
          };
          tick();
        };

        travelHorizontal({
          fromX,
          fromY,
          toX,
          speedPxPerMs: speed,
          facingRight,
          stage: mover.stage,
          keepStage,
          onStep: tickWhileTravel ? fireTick : null,
          onReach: (pt) => {
            if (keepStage) {
              startLinger(pt, mover);
              return;
            }
            mover.stop?.();
            const orbStage = createSpriteStage(fieldEl, spriteFrames, facingRight);
            if (!orbStage) {
              finish();
              return;
            }
            setGpuPos(orbStage.stage, pt.x, pt.y);
            startLinger(pt, orbStage);
          },
        }).start();
      }, launchMs);
    });
  }

  function playBallCast(opts = {}) {
    const {
      fieldEl,
      playerEl,
      fx = {},
      plan,
      skill = null,
      level = 1,
      mobs = [],
      getMobs,
      maxTargets = 1,
      facingRight = true,
      onHit: onHitOpt,
      onDone,
      onChainBegin,
      visualOnly = false,
      omitPlayerEffect = false,
      extraBulletCount = 0,
      fanAngles = null,
      onLaunch = null,
    } = opts;
    // 純動畫：仍飛投射物，但不觸發 onHit 結算
    const onHit = visualOnly ? null : onHitOpt;

    const mobList = () => (typeof getMobs === 'function' ? getMobs() : mobs);

    const finish = () => {
      if (typeof onDone === 'function') onDone();
    };

    if (!fieldEl || !plan || !fx?.ball) {
      finish();
      return false;
    }

    const volleys = resolveBulletVolleys(skill, plan, level, extraBulletCount);
    const fanList = Array.isArray(fanAngles) ? fanAngles.filter((a) => Number.isFinite(Number(a))) : [];

    // 背景：略過飛行／orb 持續，立刻對目前目標結算（避免 setTimeout／rAF 被節流）
    if (typeof document !== 'undefined' && document.hidden && !visualOnly) {
      const list = (typeof getMobs === 'function' ? getMobs() : mobs) || [];
      const victims = list.filter((m) => m && Number(m.hp) > 0).slice(0, Math.max(1, maxTargets));
      const waves = volleys ? volleys.count : (plan.ballMode === 'orb' ? 3 : 1);
      for (let wave = 0; wave < waves; wave += 1) {
        victims.forEach((mob, i) => {
          if (!mob || !(Number(mob.hp) > 0)) return;
          if (typeof onHit === 'function') onHit(mob, i, null, { volleyIndex: wave });
        });
        fanList.forEach((_, fi) => {
          const mob = victims[0];
          if (!mob || typeof onHit !== 'function') return;
          onHit(mob, 0, null, { volleyIndex: wave, fanExtra: true, fanIndex: fi });
        });
      }
      finish();
      return true;
    }

    const effectFrames = omitPlayerEffect ? [] : (fx.effect || []);

    if (plan.ballMode === 'orb') {
      if (effectFrames.length && typeof SkillEffectPlayer !== 'undefined') {
        SkillEffectPlayer.playOnPlayer(effectFrames, { playerEl });
      }
      if (!omitPlayerEffect && fx.effect0?.length && typeof SkillEffectPlayer !== 'undefined') {
        SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl });
      }
      runOrbBall({
        fieldEl,
        playerEl,
        fx,
        plan,
        mobList,
        maxTargets,
        facingRight,
        visualOnly,
        onTick: visualOnly ? null : (victims, pt) => {
          (victims || []).forEach((mob, i) => {
            if (typeof onHit === 'function') onHit(mob, i, pt);
          });
        },
        finish,
      });
      return true;
    }

    const launchMs = omitPlayerEffect
      ? 0
      : scaleRealMs(Math.max(0, Number(plan.launchMs) || 0));
    const speed = (Number(plan.speedPxPerMs) || (18 / 30)) * gameSpeedMult();
    const chainMax = plan.chain ? Math.max(1, maxTargets) : 1;

    if (effectFrames.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnPlayer(effectFrames, { playerEl });
    }
    if (!omitPlayerEffect && fx.effect0?.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl });
    }

    const spriteFrames = ballSpriteFrames(fx);
    const beam = beamLayers(fx);
    const preload = plan.ballMode === 'beam'
      ? [beam.front, beam.rear, ...beam.bodyParts.map((p) => p.frames)]
      : [spriteFrames];

    ensureFxPreload(preload).then(() => {
      const startFlight = () => {
      const spawn = launchPointFromEffect(fieldEl, playerEl, facingRight);
      const perTargetArrows = !!(skill?.multiTargeting || skill?.rectBasedOnTarget);
      const piercingArrows = !!skill?.piercing;
      let launchNoted = false;
      let visualVictims = null;
      const noteLaunch = () => {
        if (launchNoted) return;
        launchNoted = true;
        if (typeof onLaunch === 'function') {
          try { onLaunch(); } catch (_) { /* ignore */ }
        }
      };
      const victimsForVolley = () => {
        if (visualOnly && visualVictims) return visualVictims;
        const next = targetsByCount(fieldEl, mobList(), maxTargets);
        if (visualOnly) visualVictims = next;
        return next;
      };

      const flyOneArrow = (fromX, fromY, victim, volleyIndex, targetIndex, onArrowDone, hitMeta) => {
        const doneArrow = () => {
          if (typeof onArrowDone === 'function') onArrowDone();
        };
        if (!victim?.mob) {
          doneArrow();
          return;
        }
        const meta = { volleyIndex, ...(hitMeta || {}) };
        const mover = createSpriteStage(fieldEl, spriteFrames, facingRight, { skipFacingFlip: true });
        const reach = (hitPt) => {
          mover?.stop?.();
          const pt = hitPt || { x: victim.x, y: victim.y };
          if (plan.specialOnFirstHit && fx.special?.frames?.length && targetIndex === 0) {
            playSpecialAt(fieldEl, fx.special.frames, pt, facingRight);
          }
          if (typeof onHit === 'function') {
            onHit(victim.mob, targetIndex, pt, meta);
          }
          doneArrow();
        };
        if (!mover) {
          reach({ x: victim.x, y: victim.y });
          return;
        }
        if (meta.fanHome && Number.isFinite(Number(meta.fanHome.angleRad))) {
          travelFanThenHome({
            fromX,
            fromY,
            angleRad: Number(meta.fanHome.angleRad),
            home: meta.fanHome.home !== false,
            outPx: Number(meta.fanHome.outPx) || FAN_HOME_OUT_PX,
            travelPx: Number(meta.fanHome.travelPx) || 360,
            getTarget: meta.fanHome.getTarget,
            speedPxPerMs: speed,
            stage: mover.stage,
            onReach: reach,
          }).start();
          return;
        }
        const jitterY = (targetIndex % 3) * 4 - 4;
        travelToPoint({
          fromX,
          fromY: fromY + jitterY,
          toX: victim.x,
          toY: victim.y,
          speedPxPerMs: speed,
          stage: mover.stage,
          onReach: () => reach({ x: victim.x, y: victim.y }),
        }).start();
      };

      /** 急速雙擊等：每一波對「每一隻」目標各射一箭 */
      const runPerTargetVolley = (volleyIndex, onBoltDone) => {
        const victims = victimsForVolley();
        const doneBolt = () => {
          if (typeof onBoltDone === 'function') onBoltDone();
          else finish();
        };
        if (!victims.length) {
          doneBolt();
          return;
        }
        let left = victims.length;
        const mark = () => {
          left -= 1;
          if (left <= 0) doneBolt();
        };
        victims.forEach((v, i) => {
          flyOneArrow(spawn.x, spawn.y, v, volleyIndex, i, mark);
        });
      };

      /** 精準光速神弩：一箭貫穿多隻（依佇列順序飛過去） */
      const runPierceVolley = (volleyIndex, onBoltDone) => {
        const victims = targetsByQueue(fieldEl, mobList(), maxTargets);
        const doneBolt = () => {
          if (typeof onBoltDone === 'function') onBoltDone();
          else finish();
        };
        if (!victims.length) {
          doneBolt();
          return;
        }
        let fromX = spawn.x;
        let fromY = spawn.y;
        const runSeg = (segIdx) => {
          if (segIdx >= victims.length) {
            doneBolt();
            return;
          }
          const v = victims[segIdx];
          const mover = createSpriteStage(fieldEl, spriteFrames, facingRight, { skipFacingFlip: true });
          if (!mover) {
            if (typeof onHit === 'function') {
              onHit(v.mob, segIdx, { x: v.x, y: v.y }, { volleyIndex });
            }
            fromX = v.x;
            fromY = v.y;
            runSeg(segIdx + 1);
            return;
          }
          travelToPoint({
            fromX,
            fromY,
            toX: v.x,
            toY: v.y,
            speedPxPerMs: speed * 1.15,
            stage: mover.stage,
            onReach: () => {
              mover.stop?.();
              if (typeof onHit === 'function') {
                onHit(v.mob, segIdx, { x: v.x, y: v.y }, { volleyIndex });
              }
              fromX = v.x;
              fromY = v.y;
              runSeg(segIdx + 1);
            },
          }).start();
        };
        runSeg(0);
      };

      const launchFanExtras = (volleyIndex, fromX, fromY, victims, onEachDone, baseAng) => {
        if (!fanList.length || !victims?.length) return;
        fanList.forEach((angle, fi) => {
          const fire = () => {
            const aim = victims[(fi + 1) % victims.length] || victims[0];
            flyOneArrow(
              fromX,
              fromY,
              aim,
              volleyIndex,
              80 + fi,
              onEachDone,
              {
                fanExtra: true,
                fanIndex: fi,
                fanHome: {
                  angleRad: baseAng + angle,
                  home: false,
                  travelPx: 360,
                },
              },
            );
          };
          const wait = (fi + 1) * 16;
          if (wait > 0) setTimeout(fire, wait);
          else fire();
        });
      };

      const runEnergyBolt = (volleyIndex = 0, onBoltDone) => {
        noteLaunch();
        if (perTargetArrows) {
          runPerTargetVolley(volleyIndex, onBoltDone);
          return;
        }
        if (piercingArrows) {
          runPierceVolley(volleyIndex, onBoltDone);
          return;
        }
        const victims = victimsForVolley();
        const doneBolt = () => {
          if (typeof onBoltDone === 'function') onBoltDone();
          else finish();
        };
        if (!victims.length) {
          doneBolt();
          return;
        }
        const first = victims[0];
        let pending = 1 + fanList.length;
        const mark = () => {
          pending -= 1;
          if (pending <= 0) doneBolt();
        };
        const baseAng = Math.atan2(first.y - spawn.y, first.x - spawn.x);
        const mover = createSpriteStage(fieldEl, spriteFrames, facingRight, { skipFacingFlip: true });
        const hitMain = (hitPt) => {
          const pt = hitPt || { x: first.x, y: first.y };
          if (plan.specialOnFirstHit && fx.special?.frames?.length) {
            playSpecialAt(fieldEl, fx.special.frames, pt, facingRight);
          }
          victims.forEach((v, i) => {
            if (typeof onHit === 'function') {
              onHit(v.mob, i, pt, { volleyIndex });
            }
          });
          mark();
        };
        if (!mover) {
          hitMain({ x: first.x, y: first.y });
        } else {
          travelToPoint({
            fromX: spawn.x,
            fromY: spawn.y,
            toX: first.x,
            toY: first.y,
            speedPxPerMs: speed,
            stage: mover.stage,
            onReach: () => {
              mover.stop?.();
              hitMain({ x: first.x, y: first.y });
            },
          }).start();
        }
        launchFanExtras(volleyIndex, spawn.x, spawn.y, victims, mark, baseAng);
      };

      const runBulletVolleys = () => {
        let cumulative = 0;
        let remaining = volleys.count;
        const markDone = () => {
          remaining -= 1;
          if (remaining <= 0) finish();
        };
        for (let i = 0; i < volleys.count; i += 1) {
          cumulative += Math.max(0, Number(volleys.delaysMs[i]) || 0);
          const waitMs = scaleRealMs(cumulative);
          const volleyIndex = i;
          const fire = () => {
            runEnergyBolt(volleyIndex, markDone);
          };
          if (waitMs > 0) setTimeout(fire, waitMs);
          else if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fire);
          else fire();
        }
      };

      const runInstantBeam = () => {
        noteLaunch();
        const count = Math.max(1, Number(plan.instantTargets) || maxTargets);
        const victims = targetsByQueue(fieldEl, mobList(), count);
        if (!victims.length) {
          finish();
          return;
        }
        const end = victims.reduce(
          (far, v) => (facingRight ? (v.x > far.x ? v : far) : (v.x < far.x ? v : far)),
          victims[0],
        );
        const lenScale = Math.max(1, Number(plan.instantBeamLengthScale) || 1);
        const beamFx = placeBeamSegment(
          fieldEl,
          beam,
          spawn.x,
          spawn.y,
          end.x,
          end.y,
          { lengthScale: lenScale },
        );
        const holdMs = scaleRealMs(Math.max(120, Number(plan.instantBeamHoldMs) || 180));
        setTimeout(() => {
          victims.forEach((v, i) => {
            if (typeof onHit === 'function') onHit(v.mob, i, { x: v.x, y: v.y });
          });
          beamFx?.stop?.();
          finish();
        }, holdMs);
      };

      const runChain = () => {
        noteLaunch();
        const chainRange = Math.max(280, Number(plan.chainRangePx) || 420);
        const firstRange = Math.max(chainRange, Number(plan.chainFirstRangePx) || Math.round(chainRange * 1.4));
        const path = buildChainPath(
          fieldEl,
          mobList(),
          chainMax,
          chainRange,
          firstRange,
          spawn.x,
          spawn.y,
        );
        if (!path.length) {
          finish();
          return;
        }
        if (typeof onChainBegin === 'function') onChainBegin(path);

        let fromX = spawn.x;
        let fromY = spawn.y;

        const runSeg = (segIdx) => {
          if (segIdx >= path.length) {
            finish();
            return;
          }
          const tgt = path[segIdx];
          const toX = tgt.x;
          const toY = tgt.y;

          if (plan.ballMode === 'beam') {
            const beamFx = placeBeamSegment(fieldEl, beam, fromX, fromY, toX, toY);
            const holdMs = scaleRealMs(120);
            setTimeout(() => {
              beamFx?.stop?.();
              if (typeof onHit === 'function') onHit(tgt.mob, segIdx, { x: toX, y: toY });
              fromX = toX;
              fromY = toY;
              runSeg(segIdx + 1);
            }, holdMs);
            return;
          }

          const mover = createSpriteStage(fieldEl, spriteFrames, facingRight, { skipFacingFlip: true });
          if (!mover) {
            finish();
            return;
          }
          travelToPoint({
            fromX,
            fromY,
            toX,
            toY,
            speedPxPerMs: speed,
            stage: mover.stage,
            onReach: () => {
              mover.stop?.();
              if (typeof onHit === 'function') onHit(tgt.mob, segIdx, { x: toX, y: toY });
              fromX = toX;
              fromY = toY;
              runSeg(segIdx + 1);
            },
          }).start();
        };

        runSeg(0);
      };

      if (volleys) {
        runBulletVolleys();
        return;
      }

      setTimeout(() => {
        if (plan.instantBeam) runInstantBeam();
        else if (plan.aoeOnSpecial && !plan.chain) runEnergyBolt(0);
        else if (plan.chain) runChain();
        else runEnergyBolt(0);
      }, launchMs);
      };
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(startFlight);
      else startFlight();
    });

    return true;
  }

  return {
    buildPlan,
    isBallCastSkill,
    resolveBulletVolleys,
    extraFanAngles,
    playBallCast,
    playShotsFromPoint,
    framesDurationMs,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillBallCast = SkillBallCast;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillBallCast;
}
