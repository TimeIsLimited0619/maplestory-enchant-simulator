/**
 * 戰鬥力顯示格式（對齊 MapleCombat src/core/format.ts formatPower）
 * 例：2114327596 →「21億1432萬7596」；去掉群組前導 0 段
 */
function formatPower(num) {
  const n = Number(num);
  if (n <= 0 || Number.isNaN(n) || !Number.isFinite(n)) return '0';

  const yi = Math.floor(n / 100000000);
  const wan = Math.floor((n % 100000000) / 10000);
  const remaining = Math.floor(n % 10000);

  let result = '';
  if (yi > 0) result += `${yi}億`;
  if (wan > 0) result += `${wan}萬`;
  if (remaining > 0 || (yi === 0 && wan === 0)) {
    result += String(remaining);
  }
  return result;
}

if (typeof window !== 'undefined') {
  window.formatPower = formatPower;
}
