/** 裝備 icon／Canvas _outlink 共用解析（import-wz-xml、import-paperdoll-wz） */

export function outlinkKey(outlink) {
  const s = String(outlink || '');
  const i = s.indexOf('.img/');
  return i >= 0 ? s.slice(i + 5) : s.replace(/^.*?\.img\//, '');
}

/** 從 _outlink 抽出 Canvas 所屬裝備編號（可能與本檔不同） */
export function outlinkEquipId(outlink) {
  const s = String(outlink || '');
  const m = s.match(/Character\/[^/]+\/_Canvas\/(\d+)\.img\//i)
    || s.match(/\/_Canvas\/(\d+)\.img\//i)
    || s.match(/(?:^|\/)(\d{7,8})\.img\//);
  if (!m) return '';
  const digits = String(m[1]).replace(/\D/g, '');
  return digits ? digits.padStart(8, '0').slice(-8) : '';
}

export function outlinkWzPart(outlink) {
  const m = String(outlink || '').match(/Character\/([^/]+)\/_Canvas\//i);
  return m ? m[1] : '';
}
