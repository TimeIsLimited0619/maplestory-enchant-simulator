/**
 * 戰鬥力／屬性攻擊力顯示格式
 * 例：1201709742 →「12億0170萬9742」
 * 較高單位存在時，萬／個位補滿四位；整段為 0 的前導單位不顯示
 */
function formatPower(num) {
  const n = Number(num);
  if (n <= 0 || Number.isNaN(n) || !Number.isFinite(n)) return '0';

  const yi = Math.floor(n / 100000000);
  const wan = Math.floor((n % 100000000) / 10000);
  const remaining = Math.floor(n % 10000);

  let result = '';
  if (yi > 0) {
    result += `${yi}億`;
    result += `${String(wan).padStart(4, '0')}萬`;
    result += String(remaining).padStart(4, '0');
    return result;
  }
  if (wan > 0) {
    result += `${wan}萬`;
    result += String(remaining).padStart(4, '0');
    return result;
  }
  return String(remaining);
}

if (typeof window !== 'undefined') {
  window.formatPower = formatPower;
}
