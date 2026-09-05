/**
 * 一般星力：最高星、KMS/TMS 楓幣公式（需求等級向下取整到 10）
 */

function getStarForceCostLevel(reqLevel) {
  return Math.floor(Math.max(0, Number(reqLevel) || 0) / 10) * 10;
}

function getDefaultStarForceMaxStar(reqLevel) {
  const lv = Number(reqLevel) || 0;
  if (lv <= 94) return 5;
  if (lv <= 107) return 8;
  if (lv <= 117) return 10;
  if (lv <= 127) return 15;
  if (lv <= 137) return 20;
  return 30;
}

function getItemStarForceMaxStar(item) {
  if (!item) return 30;
  if (typeof isPinItem === 'function' ? isPinItem(item) : item.islot === 'Ba') return 0;
  if (item.subType === 'android' || item.islot === 'An') return 0;
  if (typeof isSuperiorStarForceItem === 'function' && isSuperiorStarForceItem(item)) {
    return getSuperiorStarForceMaxStar(item);
  }
  return getDefaultStarForceMaxStar(item.reqLevel);
}

function applyStarForceItemRules(item) {
  if (!item) return item;
  if (typeof applySuperiorStarForceFlags === 'function') {
    applySuperiorStarForceFlags(item);
  }
  item.maxStar = getItemStarForceMaxStar(item);
  if ((item.star || 0) > item.maxStar) item.star = item.maxStar;
  return item;
}

function roundStarForceMesoToHundred(n) {
  return Math.round(n / 100) * 100;
}

/** 108–109 / 118–119 / 128–129：超過門檻的星數沿用門檻那一星費用 */
function getStarForceCostStarIndex(reqLevel, currentStar) {
  const lv = Number(reqLevel) || 0;
  const star = Math.max(0, Math.floor(Number(currentStar) || 0));
  if (lv >= 108 && lv <= 109) return Math.min(star, 7);
  if (lv >= 118 && lv <= 119) return Math.min(star, 9);
  if (lv >= 128 && lv <= 129) return Math.min(star, 14);
  return star;
}

function getKmsStarForceDivisor(star) {
  if (star < 10) return 36;
  if (star === 10) return 571;
  if (star === 11) return 314;
  if (star === 12) return 214;
  if (star === 13) return 157;
  if (star === 14) return 107;
  if (star === 15 || star === 16) return 200;
  if (star === 17) return 150;
  if (star === 18) return 70;
  if (star === 19) return 45;
  if (star === 20) return 200;
  if (star === 21) return 125;
  return 200;
}

/** Wiki 單次嘗試費用（未含本專案保護破壞 ×2） */
function computeKmsStarForceMeso(costLevel, currentStar) {
  const L = Math.max(0, costLevel);
  const S = Math.max(0, currentStar);
  const next = S + 1;
  let inner;
  if (S < 10) {
    inner = (L ** 3) * next / 36;
  } else {
    inner = (L ** 3) * (next ** 2.7) / getKmsStarForceDivisor(S);
  }
  return roundStarForceMesoToHundred(1000 + Math.round(inner));
}

function getStarForceAttemptMeso(item, currentStar) {
  if (typeof isSuperiorStarForceItem === 'function' && isSuperiorStarForceItem(item)) {
    return getSuperiorStarForceMesoCost(item);
  }
  const reqLevel = Number(item?.reqLevel) || 0;
  const L = getStarForceCostLevel(reqLevel);
  const star = getStarForceCostStarIndex(reqLevel, currentStar);
  return computeKmsStarForceMeso(L, star);
}
