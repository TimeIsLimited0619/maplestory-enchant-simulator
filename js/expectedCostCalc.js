/**
 * 期望次數／期望成本試算
 * - 星力：依成功率幾何分布（本模擬器失敗／破壞皆維持星數）
 * - 潛能／附加潛能：以官方機率表實際骰樣估算單次命中率
 * - 星火：以實際洗鍊函式 i.i.d. 抽樣估算
 */
const ExpectedCostCalc = {
  CUBE_SIMS: 6000,
  CUBE_SIMS_FAST: 2500,
  BONUS_SIMS: 8000,
  UNION_LINE_SIMS: 4000,

  formatMeso(amount) {
    return typeof formatMesoAmount === 'function'
      ? formatMesoAmount(amount)
      : `${Math.round(Number(amount) || 0).toLocaleString()} 楓幣`;
  },

  formatCost(amount) {
    const n = Number(amount) || 0;
    if (typeof formatMesoParts === 'function' && n >= 10000) {
      return `${formatMesoParts(n)}（約）`;
    }
    return `${n.toLocaleString()}（約）`;
  },

  clonePotential(potential) {
    if (!potential) return { rank: 'rare', lines: [], atkPow: 300000000 };
    return {
      rank: potential.rank || 'rare',
      atkPow: potential.atkPow,
      lines: (potential.lines || []).map((line) => ({ ...line })),
    };
  },

  getStarOutcomeRates(star, opts = {}) {
    const raw = (typeof starRates !== 'undefined' && starRates[star])
      ? starRates[star]
      : { success: 30, fail: 70, destroy: 0 };
    let success = Math.max(0, Number(raw.success) || 0) / 100;
    let fail = Math.max(0, Number(raw.fail ?? raw.keep) || 0) / 100;
    let destroy = Math.max(0, Number(raw.destroy ?? raw.drop) || 0) / 100;

    if (opts.protectDestroy) {
      fail += destroy;
      destroy = 0;
    }

    const total = success + fail + destroy;
    if (total <= 0) return { success: 0.3, fail: 0.7, destroy: 0 };

    if (Math.abs(total - 1) > 0.001) {
      success /= total;
      fail /= total;
      destroy /= total;
    }

    return { success, fail, destroy };
  },

  /** 星力：每星幾何分布（失敗／破壞皆維持星數重試） */
  calcStarForce(item, fromStar, toStar) {
    if (!item || toStar <= fromStar) {
      return { ok: false, reason: '目標星力需大於目前星力' };
    }

    const maxStar = item.maxStar || 30;
    const target = Math.min(toStar, maxStar);
    const protectDestroy = typeof StarForceModule !== 'undefined'
      ? StarForceModule.isProtectDestroyEnabled?.()
      : false;
    const rateOpts = { protectDestroy };

    let totalAttempts = 0;
    let totalMeso = 0;
    let expectedDestroyHits = 0;
    const steps = [];

    for (let star = fromStar; star < target; star += 1) {
      const rates = this.getStarOutcomeRates(star, rateOpts);
      const p = Math.max(rates.success, 0.0001);
      const attempts = 1 / p;
      const mesoPerTry = typeof StarForceModule !== 'undefined'
        ? StarForceModule.getMesoCost(star)
        : 0;
      const destroyPerTry = protectDestroy ? 0 : rates.destroy;

      totalAttempts += attempts;
      totalMeso += attempts * mesoPerTry;
      expectedDestroyHits += attempts * destroyPerTry;
      steps.push({
        star,
        successPct: (rates.success * 100).toFixed(2),
        destroyPct: (rates.destroy * 100).toFixed(2),
        expectedAttempts: attempts,
        mesoPerTry,
      });
    }

    const cubePrice = typeof CostTrackerModule !== 'undefined'
      ? parseFloat(CostTrackerModule.prices?.starNormal) || 0
      : 0;

    return {
      ok: true,
      module: 'starForce',
      fromStar,
      toStar: target,
      expectedAttempts: totalAttempts,
      expectedMeso: totalMeso,
      expectedItemCost: totalAttempts * cubePrice,
      expectedDestroyHits,
      protectDestroy,
      steps,
      method: 'analytic',
      note: protectDestroy
        ? '依目前「防止破壞」勾選：破壞率併入失敗、楓幣為全額。失敗／破壞皆維持星數。'
        : '未勾防止破壞時楓幣為半價；破壞仍維持星數（與本模擬器一致）。若日後改為降星／毀裝，需另行建模。',
    };
  },

  countPotentialTargetLines(groups) {
    if (!Array.isArray(groups)) return 0;
    let n = 0;
    groups.forEach((group) => {
      if (!Array.isArray(group)) return;
      group.forEach((line) => {
        if (line) n += 1;
      });
    });
    return n;
  },

  getCubeEventId(moduleKey) {
    if (moduleKey === 'additionalPotential') {
      return typeof ADDPOT_CUBE_EVENT_ID !== 'undefined' ? ADDPOT_CUBE_EVENT_ID : 8422;
    }
    return typeof POTENTIAL_CUBE_EVENT_ID !== 'undefined' ? POTENTIAL_CUBE_EVENT_ID : 8421;
  },

  getPotentialMatcher(moduleKey, cube) {
    const isAdd = moduleKey === 'additionalPotential';
    const mod = isAdd
      ? (typeof AutoEnchantAddPotentialModule !== 'undefined' ? AutoEnchantAddPotentialModule : null)
      : (typeof AutoEnchantPotentialModule !== 'undefined' ? AutoEnchantPotentialModule : null);

    if (mod?.groupMatches) {
      return (potential, groups) => mod.groupMatches(potential, groups);
    }

    if (typeof aePotIsUnionCube === 'function' && aePotIsUnionCube(cube)) {
      return (potential, groups) => groups.some((g) => aePotLineIndexGroupMatches(potential, g));
    }
    if (typeof aePotIsHexaCube === 'function' && aePotIsHexaCube(cube)) {
      return (potential, groups) => groups.some((g) => aePotHexaGroupMatches(potential, g));
    }
    return (potential, groups) => groups.some((g) => aePotGroupMatches(potential, g));
  },

  /**
   * 抽樣單次使用方塊的命中率，再以幾何分布推期望次數。
   * （已達傳說時近似 i.i.d.；尚未滿階時含升階機率，略偏樂觀／悲觀視目標而定）
   */
  estimateCubeHitProb(moduleKey, item, cube, groups, potential) {
    const eventId = this.getCubeEventId(moduleKey);
    const rateKey = cube.rateKey || (cube.hexaPick ? (moduleKey === 'additionalPotential' ? 'restoreAdd' : 'dazzling') : null);
    const startPot = this.clonePotential(potential);
    const match = this.getPotentialMatcher(moduleKey, cube);
    const isHexa = typeof aePotIsHexaCube === 'function' && aePotIsHexaCube(cube);
    const isUnion = typeof aePotIsUnionCube === 'function' && aePotIsUnionCube(cube);
    const isMemoria = Boolean(cube.memoriaPick);

    let sims = isHexa || isUnion ? this.CUBE_SIMS_FAST : this.CUBE_SIMS;
    let hits = 0;
    let valid = 0;

    if (isMemoria) {
      // 紀念：視為一次重骰 AFTER；命中判定與一般方塊相同
      if (typeof rerollPotentialWithCube !== 'function') {
        return { ok: false, reason: '缺少潛能骰表函式' };
      }
      for (let i = 0; i < sims; i += 1) {
        const rolled = rerollPotentialWithCube(cube, item, startPot, eventId);
        if (!rolled) continue;
        valid += 1;
        if (match(rolled, groups)) hits += 1;
      }
    } else if (isHexa) {
      if (typeof rollDazzlingHexaChoices !== 'function'
        || typeof aePotHexaSessionHasTargetMatch !== 'function') {
        return { ok: false, reason: '缺少閃炫六選試算函式' };
      }
      for (let i = 0; i < sims; i += 1) {
        const session = rollDazzlingHexaChoices(item, startPot, rateKey, eventId);
        if (!session) continue;
        valid += 1;
        if (aePotHexaSessionHasTargetMatch(session, groups)) hits += 1;
      }
    } else if (isUnion) {
      if (typeof rollUnionLine !== 'function'
        || typeof aePotApplyUnionLineRoll !== 'function') {
        // fallback：直接改一排
        if (typeof rollUnionLine !== 'function') {
          return { ok: false, reason: '缺少結合方塊試算函式' };
        }
      }
      for (let i = 0; i < this.UNION_LINE_SIMS; i += 1) {
        const pot = this.clonePotential(startPot);
        const lineIndex = typeof pickRandomUnionLineIndex === 'function'
          ? pickRandomUnionLineIndex()
          : Math.floor(Math.random() * 3);
        if (typeof aePotApplyUnionLineRoll === 'function') {
          const next = aePotApplyUnionLineRoll(item, pot, lineIndex, rateKey, eventId);
          if (!next) continue;
          valid += 1;
          if (match(next, groups)) hits += 1;
        } else {
          const rolled = rollUnionLine(item, pot, lineIndex, rateKey, eventId);
          if (!rolled) continue;
          const lines = (pot.lines || []).map((line, idx) => (
            idx === lineIndex ? { ...rolled } : { ...line }
          ));
          const trial = { ...pot, lines, rank: pot.rank };
          valid += 1;
          if (match(trial, groups)) hits += 1;
        }
      }
      sims = this.UNION_LINE_SIMS;
    } else {
      if (typeof rerollPotentialWithCube !== 'function') {
        return { ok: false, reason: '缺少潛能骰表函式' };
      }
      for (let i = 0; i < sims; i += 1) {
        const rolled = rerollPotentialWithCube(cube, item, startPot, eventId);
        if (!rolled) continue;
        valid += 1;
        if (match(rolled, groups)) hits += 1;
      }
    }

    if (valid < 100) {
      return { ok: false, reason: '試算抽樣失敗（機率表或裝備分類可能不支援）' };
    }

    // 零命中時給上界：p < 1/valid → 期望 > valid
    const p = hits > 0 ? hits / valid : 1 / (valid + 1);
    const pLow = hits > 0
      ? Math.max(1e-12, (hits - 1.96 * Math.sqrt(Math.max(hits * (1 - p), 0))) / valid)
      : 0;
    const pHigh = hits > 0
      ? Math.min(1, (hits + 1.96 * Math.sqrt(Math.max(hits * (1 - p), 0))) / valid)
      : 3 / valid;

    return {
      ok: true,
      hitProb: p,
      hitProbLow: Math.max(pLow, 1e-12),
      hitProbHigh: Math.max(pHigh, p),
      sims: valid,
      hits,
      isHexa,
      isUnion,
      isMemoria,
      zeroHits: hits === 0,
    };
  },

  calcCubeAuto(moduleKey, item, cube, groups, potential) {
    if (!item || !cube) {
      return { ok: false, reason: '請先放置裝備並選擇方塊' };
    }

    const lineTargets = this.countPotentialTargetLines(groups);
    if (lineTargets <= 0) {
      return { ok: false, reason: '請設定自動重設目標詞條' };
    }

    const pot = potential || (moduleKey === 'additionalPotential'
      ? item.additionalPotential
      : item.potential);

    const estimate = this.estimateCubeHitProb(moduleKey, item, cube, groups, pot);
    if (!estimate.ok) return estimate;

    const expectedRolls = 1 / estimate.hitProb;
    const expectedRollsLow = 1 / estimate.hitProbHigh;
    const expectedRollsHigh = 1 / estimate.hitProbLow;

    const priceId = moduleKey === 'additionalPotential'
      ? `addCube:${cube.id}`
      : `cube:${cube.id}`;
    const unitPrice = typeof CostTrackerModule !== 'undefined'
      ? parseFloat(CostTrackerModule.prices?.[priceId]) || 0
      : 0;
    const mesoPerRoll = Number(cube.mesoCost) || 0;

    let note = `以官方機率表抽樣 ${estimate.sims.toLocaleString()} 次估算單次命中率，再推期望次數。`;
    if (estimate.isHexa) {
      note += ' 閃炫：計算「六選中存在可達成目標的三選組合」機率（與自動重設停手條件一致）。';
    } else if (estimate.isUnion) {
      note += ' 結合方塊：每次使用重骰隨機一排。';
    } else if (estimate.isMemoria) {
      note += ' 紀念方塊：以一次 AFTER 重骰近似。';
    }
    if (estimate.zeroHits) {
      note += ' 抽樣期間未命中，期望為下界估計，實際可能更高。';
    } else {
      note += ' 升階會改變後續機率，此為由目前潛能狀態出發的近似。';
    }

    return {
      ok: true,
      module: moduleKey,
      cubeName: cube.name || cube.id,
      lineTargets,
      hitProbPct: (estimate.hitProb * 100).toFixed(4),
      hitProbPctRange: [
        (estimate.hitProbLow * 100).toFixed(4),
        (estimate.hitProbHigh * 100).toFixed(4),
      ],
      expectedRolls,
      expectedRollsLow,
      expectedRollsHigh,
      expectedItemCost: expectedRolls * unitPrice,
      expectedMeso: expectedRolls * mesoPerRoll,
      sims: estimate.sims,
      method: 'monteCarlo',
      note,
    };
  },

  estimateBonusHitProb(item, groups, tierMode, starFireType) {
    if (typeof bsRollBonusStatLines !== 'function'
      || typeof bonusStatMatchesTargets !== 'function') {
      return { ok: false, reason: '缺少星火試算函式' };
    }

    const mode = tierMode ? 'tier' : 'value';
    const sims = this.BONUS_SIMS;
    let hits = 0;

    for (let i = 0; i < sims; i += 1) {
      const rolled = bsRollBonusStatLines(item, starFireType);
      if (!rolled) continue;
      if (bonusStatMatchesTargets(rolled, groups, item, mode)) hits += 1;
    }

    const p = hits > 0 ? hits / sims : 1 / (sims + 1);
    return {
      ok: true,
      hitProb: p,
      sims,
      hits,
      zeroHits: hits === 0,
      starFireType,
    };
  },

  calcBonusStat(item, groups, tierMode) {
    if (!item?.bonusStat) {
      return { ok: false, reason: '裝備尚無附加能力資料' };
    }

    const activeGroups = (groups || []).filter((g) => {
      if (!g?.statId) return false;
      if (tierMode) return (Number(g.minTier) || 0) > 0;
      return (Number(g.minValue) || 0) > 0;
    });
    if (!activeGroups.length) {
      return { ok: false, reason: '請設定星火自動重設目標' };
    }

    const selectedItem = typeof BonusStatModule !== 'undefined'
      ? BonusStatModule.getSelectedItem?.()
      : null;
    const starFireType = typeof getBonusStatRollStarFireType === 'function'
      ? getBonusStatRollStarFireType(
        BonusStatModule?.costTab,
        selectedItem,
        item.bonusStat,
      )
      : 'enhanced';

    const estimate = this.estimateBonusHitProb(item, groups, tierMode, starFireType);
    if (!estimate.ok) return estimate;

    const expectedRolls = 1 / estimate.hitProb;
    let expectedItemCost = 0;
    let expectedMeso = 0;

    if (selectedItem && typeof CostTrackerModule !== 'undefined') {
      const priceId = `bonusStatItem:${selectedItem.id}`;
      const unitPrice = parseFloat(CostTrackerModule.prices?.[priceId]) || 0;
      expectedItemCost = expectedRolls * unitPrice;
    }
    if (typeof getBonusStatMesoCost === 'function' && BonusStatModule?.costTab === 'meso') {
      expectedMeso = getBonusStatMesoCost(item.bonusStat.level) * expectedRolls;
    }

    let note = `以實際星火洗鍊抽樣 ${estimate.sims.toLocaleString()} 次（類型：${estimate.starFireType}），每次洗鍊獨立，幾何分布期望準確。`;
    if (estimate.zeroHits) {
      note += ' 抽樣期間未命中，顯示為下界估計。';
    }
    if (tierMode) note += ' 目標模式：詞條階級。';
    else note += ' 目標模式：屬性數值總和。';

    return {
      ok: true,
      module: 'bonusStat',
      hitProbPct: (estimate.hitProb * 100).toFixed(4),
      expectedRolls,
      expectedItemCost,
      expectedMeso,
      sims: estimate.sims,
      starFireType: estimate.starFireType,
      method: 'monteCarlo',
      note,
    };
  },

  calcForCurrentContext() {
    const cat = document.getElementById('actionCategory')?.value || 'star';

    if (cat === 'star') {
      const item = StarForceModule?.itemData;
      const from = StarForceModule?.currentStars ?? 0;
      const to = AutoEnchantStarForceModule?.targetStar ?? from + 1;
      return this.calcStarForce(item, from, to);
    }

    if (cat === 'potential') {
      return this.calcCubeAuto(
        'potential',
        PotentialModule?.itemData,
        PotentialModule?.getSelectedCube?.(),
        AutoEnchantPotentialModule?.groupTargets,
        PotentialModule?.itemData?.potential,
      );
    }

    if (cat === 'additionalPotential') {
      return this.calcCubeAuto(
        'additionalPotential',
        AddPotentialModule?.itemData,
        AddPotentialModule?.getSelectedCube?.(),
        AutoEnchantAddPotentialModule?.groupTargets,
        AddPotentialModule?.itemData?.additionalPotential,
      );
    }

    if (cat === 'bonusStat') {
      return this.calcBonusStat(
        BonusStatModule?.itemData,
        AutoEnchantBonusStatModule?.groupTargets,
        AutoEnchantBonusStatModule?.tierSelectMode !== false,
      );
    }

    return { ok: false, reason: '目前分頁不支援期望試算（請切到星力／潛能／附加潛能／星火）' };
  },

  renderResultHtml(result) {
    if (!result?.ok) {
      return `<p class="etp-muted">${result?.reason || '無法試算'}</p>`;
    }

    const rows = [];
    if (result.cubeName) {
      rows.push(['方塊', result.cubeName]);
    }
    if (result.starFireType) {
      rows.push(['星火類型', result.starFireType]);
    }
    if (result.fromStar != null && result.toStar != null) {
      rows.push(['星力區間', `★${result.fromStar} → ★${result.toStar}`]);
    }
    if (result.hitProbPct != null) {
      const range = result.hitProbPctRange
        ? `（約 ${result.hitProbPctRange[0]}% ~ ${result.hitProbPctRange[1]}%）`
        : '';
      rows.push(['單次命中機率', `${result.hitProbPct}%${range}`]);
    }
    if (result.expectedRolls != null) {
      let text = `約 ${Math.ceil(result.expectedRolls).toLocaleString()} 次`;
      if (result.expectedRollsLow != null && result.expectedRollsHigh != null) {
        text += `（約 ${Math.ceil(result.expectedRollsLow).toLocaleString()} ~ ${Math.ceil(result.expectedRollsHigh).toLocaleString()}）`;
      }
      rows.push(['期望洗鍊次數', text]);
    }
    if (result.expectedAttempts != null) {
      rows.push(['期望強化次數', `約 ${Math.ceil(result.expectedAttempts).toLocaleString()} 次`]);
    }
    if (result.expectedDestroyHits > 0) {
      rows.push(['期望觸發破壞', `約 ${result.expectedDestroyHits.toFixed(1)} 次`]);
    }
    if (result.protectDestroy != null) {
      rows.push(['防止破壞', result.protectDestroy ? '開啟（全額楓幣）' : '關閉（半價楓幣）']);
    }
    if (result.expectedMeso > 0) {
      rows.push(['期望楓幣', this.formatMeso(result.expectedMeso)]);
    }
    if (result.expectedItemCost > 0) {
      rows.push(['期望道具成本', this.formatCost(result.expectedItemCost)]);
    }
    if (result.sims) {
      rows.push(['抽樣次數', result.sims.toLocaleString()]);
    }
    if (result.method) {
      rows.push(['算法', result.method === 'monteCarlo' ? '機率表抽樣 + 幾何分布' : '解析幾何分布']);
    }

    const table = rows.map(([k, v]) => (
      `<tr><th>${k}</th><td>${v}</td></tr>`
    )).join('');

    let stepsHtml = '';
    if (Array.isArray(result.steps) && result.steps.length) {
      const stepRows = result.steps.map((s) => (
        `<tr>
          <td>★${s.star}→${s.star + 1}</td>
          <td>${s.successPct}%</td>
          <td>${s.destroyPct || '0'}%</td>
          <td>${s.expectedAttempts.toFixed(2)}</td>
          <td>${this.formatMeso(s.mesoPerTry)}</td>
        </tr>`
      )).join('');
      stepsHtml = `
        <table class="etp-table etp-table--steps">
          <thead><tr><th>星數</th><th>成功</th><th>破壞</th><th>期望次數</th><th>單次楓幣</th></tr></thead>
          <tbody>${stepRows}</tbody>
        </table>
      `;
    }

    return `
      <table class="etp-table">${table}</table>
      ${stepsHtml}
      <p class="etp-note">${result.note || ''}</p>
    `;
  },
};
