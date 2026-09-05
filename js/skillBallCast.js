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
   * effect 錨點＝腳底（cast stage 位置）。優先讀正在播的 effect DOM。
   */
  function launchPointFromEffect(fieldEl, playerEl) {
    // 連續施放時 DOM 上可能有多個 cast stage，固定用玩家腳底較穩
    if (typeof SkillEffectPlayer !== 'undefined'
      && typeof SkillEffectPlayer.fieldPointFromPlayer === 'function') {
      return SkillEffectPlayer.fieldPointFromPlayer(fieldEl, playerEl, [0, 0], true);
    }
    return { x: 120, y: 140 };
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
    img.decoding = 'sync';
    applySpriteFrame(img, list[0]);
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % list.length;
      applySpriteFrame(img, list[idx]);
    }, scaleRealMs(Math.max(30, Number(list[0]?.delay) || 60)));
    return { img, list, stop: () => clearInterval(timer) };
  }

  function skillFxLayer(fieldEl) {
    if (typeof SkillEffectPlayer !== 'undefined' && SkillEffectPlayer.getSkillFxLayer) {
      return SkillEffectPlayer.getSkillFxLayer(fieldEl);
    }
    return fieldEl;
  }

  function createSpriteStage(fieldEl, frames, facingRight) {
    const list = (frames || []).filter((f) => f?.src);
    if (!list.length) return null;
    const layer = skillFxLayer(fieldEl);
    if (!layer) return null;
    const stage = document.createElement('div');
    stage.className = 'idle-skill-fx-stage idle-skill-fx-stage--ball';
    const anim = createAnimImg(list, 'idle-skill-fx-sprite');
    if (!anim) return null;
    stage.appendChild(anim.img);
    stage.style.transform = facingRight ? 'scaleX(-1)' : 'none';
    layer.appendChild(stage);
    return { stage, stop: anim.stop };
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
    stage.style.left = `${x0}px`;
    stage.style.top = `${y0}px`;
    stage.style.width = `${len}px`;
    stage.style.height = '0';
    stage.style.transformOrigin = '0 50%';
    stage.style.transform = lengthScale !== 1
      ? `rotate(${deg}deg) scaleX(${lengthScale})`
      : `rotate(${deg}deg)`;

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
    } = opts;
    if (!stage) {
      if (typeof onReach === 'function') onReach({ x: toX, y: fromY });
      return { start: () => {} };
    }

    let x = fromX;
    const y = fromY;
    stage.style.left = `${x}px`;
    stage.style.top = `${y}px`;
    let lastTs = 0;
    let done = false;
    const hitRadius = 28;

    const step = (ts) => {
      if (done) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min(50, Math.max(0, ts - lastTs));
      lastTs = ts;

      const dir = facingRight ? 1 : -1;
      x += dir * speedPxPerMs * dt;
      stage.style.left = `${x}px`;
      stage.style.top = `${y}px`;

      const reached = facingRight ? (x >= toX - hitRadius) : (x <= toX + hitRadius);
      if (reached) {
        done = true;
        stage.remove();
        if (typeof onReach === 'function') onReach({ x: toX, y });
        return;
      }
      if (facingRight ? x > toX + 800 : x < toX - 800) {
        done = true;
        stage.remove();
        if (typeof onReach === 'function') onReach({ x: toX, y });
        return;
      }
      requestAnimationFrame(step);
    };

    return { start: () => requestAnimationFrame(step) };
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

    ensureFxPreload([spriteFrames]).then(() => {
      setTimeout(() => {
        const spawn = launchPointFromEffect(fieldEl, playerEl);
        let fromX = spawn.x;
        const fromY = spawn.y;
        const toX = fromX + (facingRight ? travelDist : -travelDist);

        const mover = createSpriteStage(fieldEl, spriteFrames, facingRight);
        if (!mover) {
          finish();
          return;
        }

        travelHorizontal({
          fromX,
          fromY,
          toX,
          speedPxPerMs: speed,
          facingRight,
          stage: mover.stage,
          onReach: (pt) => {
            mover.stop?.();
            const orbStage = createSpriteStage(fieldEl, spriteFrames, facingRight);
            if (!orbStage) {
              finish();
              return;
            }
            orbStage.stage.style.left = `${pt.x}px`;
            orbStage.stage.style.top = `${pt.y}px`;

            const endAt = performance.now() + durationMs;
            const tick = () => {
              if (performance.now() >= endAt) {
                orbStage.stop?.();
                orbStage.stage.remove();
                finish();
                return;
              }
              if (!visualOnly && typeof onTick === 'function') {
                const victims = targetsNearPoint(
                  fieldEl,
                  mobList(),
                  pt.x,
                  pt.y,
                  aoeRadius,
                  maxTargets,
                ).map((t) => t.mob);
                onTick(victims, pt);
              }
              setTimeout(tick, tickMs);
            };
            tick();
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
      mobs = [],
      getMobs,
      maxTargets = 1,
      facingRight = true,
      onHit,
      onDone,
      onChainBegin,
      visualOnly = false,
    } = opts;

    const mobList = () => (typeof getMobs === 'function' ? getMobs() : mobs);

    const finish = () => {
      if (typeof onDone === 'function') onDone();
    };

    if (!fieldEl || !plan || !fx?.ball) {
      finish();
      return false;
    }

    const effectFrames = fx.effect || [];

    if (plan.ballMode === 'orb') {
      if (effectFrames.length && typeof SkillEffectPlayer !== 'undefined') {
        SkillEffectPlayer.playOnPlayer(effectFrames, { playerEl });
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

    const launchMs = scaleRealMs(Math.max(0, Number(plan.launchMs) || 0));
    const speed = (Number(plan.speedPxPerMs) || (18 / 30)) * gameSpeedMult();
    const aoeRadius = Math.max(40, Number(plan.aoeRadius) || 100);
    const chainMax = plan.chain ? Math.max(1, maxTargets) : 1;

    if (effectFrames.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnPlayer(effectFrames, { playerEl });
    }
    if (fx.effect0?.length && typeof SkillEffectPlayer !== 'undefined') {
      SkillEffectPlayer.playOnPlayer(fx.effect0, { playerEl });
    }

    const spriteFrames = ballSpriteFrames(fx);
    const beam = beamLayers(fx);
    const preload = plan.ballMode === 'beam'
      ? [beam.front, beam.rear, ...beam.bodyParts.map((p) => p.frames)]
      : [spriteFrames];

    ensureFxPreload(preload).then(() => {
      setTimeout(() => {
        const spawn = launchPointFromEffect(fieldEl, playerEl);
        let fromX = spawn.x;
        let fromY = spawn.y;

        const runEnergyBolt = () => {
          const victims = targetsByCount(fieldEl, mobList(), maxTargets);
          if (!victims.length) {
            finish();
            return;
          }
          const first = victims[0];
          const flyY = fromY;
          const mover = createSpriteStage(fieldEl, spriteFrames, facingRight);
          if (!mover) {
            victims.forEach((v, i) => {
              if (typeof onHit === 'function') onHit(v.mob, i, { x: v.x, y: v.y });
            });
            finish();
            return;
          }
          travelHorizontal({
            fromX,
            fromY: flyY,
            toX: first.x,
            speedPxPerMs: speed,
            facingRight,
            stage: mover.stage,
            onReach: () => {
              mover.stop?.();
              const hitPt = { x: first.x, y: first.y };
              if (plan.specialOnFirstHit && fx.special?.frames?.length) {
                playSpecialAt(fieldEl, fx.special.frames, hitPt, facingRight);
              }
              victims.forEach((v, i) => {
                if (typeof onHit === 'function') onHit(v.mob, i, hitPt);
              });
              finish();
            },
          }).start();
        };

        const runInstantBeam = () => {
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
          const chainRange = Math.max(280, Number(plan.chainRangePx) || 420);
          const firstRange = Math.max(chainRange, Number(plan.chainFirstRangePx) || Math.round(chainRange * 1.4));
          // 前搖結束再鎖路徑：連續第二發時第一發可能仍佔前排，延後選目標較準
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

            const mover = createSpriteStage(fieldEl, spriteFrames, facingRight);
            if (!mover) {
              finish();
              return;
            }
            travelHorizontal({
              fromX,
              fromY,
              toX,
              speedPxPerMs: speed,
              facingRight,
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

        if (plan.instantBeam) runInstantBeam();
        else if (plan.aoeOnSpecial && !plan.chain) runEnergyBolt();
        else if (plan.chain) runChain();
        else runEnergyBolt();
      }, launchMs);
    });

    return true;
  }

  return {
    buildPlan,
    isBallCastSkill,
    playBallCast,
    framesDurationMs,
  };
})();

if (typeof window !== 'undefined') {
  window.SkillBallCast = SkillBallCast;
}
