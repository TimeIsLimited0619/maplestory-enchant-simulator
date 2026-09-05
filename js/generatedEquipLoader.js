/**
 * 把 MapleStory.io／wz-xml 匯入的裝備註冊進 ITEM_DATABASE（不覆蓋手維護的 item.js）。
 */
const GeneratedEquipLoader = (() => {
  let registered = false;

  function register() {
    if (typeof ITEM_DATABASE === 'undefined' || typeof buildEquipFromWzInfo !== 'function') {
      return 0;
    }
    registered = true;
    let added = 0;
    const wzRows = (typeof WZ_IMPORTED_EQUIP_RECORDS !== 'undefined' && Array.isArray(WZ_IMPORTED_EQUIP_RECORDS))
      ? WZ_IMPORTED_EQUIP_RECORDS
      : [];
    wzRows.forEach((row) => {
      if (!row?.id || ITEM_DATABASE[row.id]) return;
      ITEM_DATABASE[row.id] = buildEquipFromWzInfo(row.id, row.name || row.id, row.info || {});
      added += 1;
    });
    const dollRows = (typeof PAPERDOLL_EQUIP_RECORDS !== 'undefined' && Array.isArray(PAPERDOLL_EQUIP_RECORDS))
      ? PAPERDOLL_EQUIP_RECORDS
      : [];
    dollRows.forEach((row) => {
      if (!row?.id || ITEM_DATABASE[row.id]) return;
      ITEM_DATABASE[row.id] = buildEquipFromWzInfo(row.id, row.name || row.id, row.info || {});
      added += 1;
    });
    const rows = (typeof GENERATED_EQUIP_RECORDS !== 'undefined' && Array.isArray(GENERATED_EQUIP_RECORDS))
      ? GENERATED_EQUIP_RECORDS
      : [];
    rows.forEach((row) => {
      if (!row?.id || ITEM_DATABASE[row.id]) return;
      const built = buildEquipFromWzInfo(row.id, row.name || row.id, row.info || {});
      built.fromGenerated = true;
      ITEM_DATABASE[row.id] = built;
      added += 1;
    });
    return added;
  }

  function listWearable() {
    register();
    if (typeof ITEM_DATABASE === 'undefined') return [];
    return Object.keys(ITEM_DATABASE)
      .map((id) => ITEM_DATABASE[id])
      .filter((item) => item && !item.wz?.cash && Number(item.reqLevel) >= 0);
  }

  function idsNearLevel(level, span = 15) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    return idsInLevelRange(Math.max(1, lv - span), lv + 5);
  }

  function idsInLevelRange(min, max) {
    const lo = Math.max(0, Math.floor(Number(min) || 0));
    const hi = Math.max(lo, Math.floor(Number(max) || lo));
    return listWearable()
      .filter((item) => {
        const req = Number(item.reqLevel) || 0;
        return req >= lo && req <= hi;
      })
      .map((item) => item.itemId || item.id);
  }

  function isCatalogEquip(item) {
    const id = item?.itemId || item?.id;
    if (!id || item?.fromGenerated) return false;
    if (typeof WZ_IMPORTED_EQUIP_IDS !== 'undefined' && Array.isArray(WZ_IMPORTED_EQUIP_IDS) && WZ_IMPORTED_EQUIP_IDS.includes(id)) {
      return true;
    }
    if (typeof ORIGINAL_EQUIP_IDS !== 'undefined' && Array.isArray(ORIGINAL_EQUIP_IDS)) {
      return ORIGINAL_EQUIP_IDS.includes(id);
    }
    return true;
  }

  return { register, listWearable, idsNearLevel, idsInLevelRange, isCatalogEquip };
})();

if (typeof window !== 'undefined') window.GeneratedEquipLoader = GeneratedEquipLoader;

if (typeof ITEM_DATABASE !== 'undefined') GeneratedEquipLoader.register();
