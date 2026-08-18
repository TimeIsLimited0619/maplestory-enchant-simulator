/**
 * 戰鬥力武器攻擊校正（移植自 MapleCombat MIT）
 * 所有武器依同套裝、星力、星火與卷軸條件校正成基準弓攻擊。
 * 星火由原版 T0–T7 延伸至模擬器可用的 T0–T9。
 */
const WeaponCorrection = (() => {
  const DATABASE = {
    fortune: {
      name: '命運',
      base: 349,
      stars16_24: [16, 16, 17, 17, 18, 19, 20, 36, 37],
      flames: [0, 25, 49, 74, 108, 148, 196, 251, 288, 323],
    },
    genesis: {
      name: '創世',
      base: 318,
      stars16_24: [13, 13, 14, 14, 15, 16, 17, 34, 35],
      flames: [0, 20, 39, 58, 84, 116, 153, 196, 225, 253],
    },
    arcane: {
      name: '神祕',
      base: 276,
      stars16_24: [13, 13, 14, 14, 15, 16, 17, 34, 35],
      flames: [0, 17, 34, 50, 73, 101, 133, 170, 195, 219],
    },
    absolab: {
      name: '航海',
      base: 192,
      stars16_24: [9, 9, 10, 11, 12, 13, 14, 32, 33],
      flames: [0, 10, 20, 29, 43, 59, 77, 99, 113, 127],
    },
    fafnir: {
      name: '深淵',
      base: 160,
      stars16_24: [8, 9, 9, 10, 11, 12, 13, 31, 32],
      flames: [0, 7, 13, 20, 29, 39, 52, 66, 76, 85],
    },
  };

  const ZERO_DATABASE = {
    fortune: {
      ...DATABASE.fortune,
      stars16_24: [16, 16, 17, 17, 18, 19, 20, 36, 37],
      flames: [0, 25, 54, 89, 131, 179, 215, 251, 288, 323],
    },
    genesis: {
      ...DATABASE.genesis,
      stars16_24: [13, 13, 14, 14, 15, 16, 17, 34, 35],
      flames: [0, 20, 42, 70, 102, 140, 168, 196, 225, 253],
    },
    arcane: {
      ...DATABASE.arcane,
      stars16_24: [13, 13, 14, 14, 15, 16, 17, 34, 35],
      flames: [0, 17, 37, 61, 89, 122, 146, 170, 195, 219],
    },
    absolab: {
      ...DATABASE.absolab,
      stars16_24: [9, 9, 10, 11, 12, 13, 14, 32, 33],
      flames: [0, 10, 22, 35, 52, 71, 85, 99, 113, 127],
    },
    fafnir: {
      ...DATABASE.fafnir,
      stars16_24: [8, 9, 9, 10, 11, 12, 13, 31, 32],
      flames: [0, 7, 15, 24, 35, 47, 57, 66, 76, 85],
    },
  };

  function clampInt(value, min, max) {
    return Math.max(min, Math.min(max, Math.floor(Number(value) || 0)));
  }

  function getDatabase(isZero) {
    return isZero ? ZERO_DATABASE : DATABASE;
  }

  function detectSetKey(item) {
    const explicit = String(item?.weaponSet || item?.wz?.weaponSet || '').toLowerCase();
    if (DATABASE[explicit]) return explicit;
    const name = String(item?.name || '');
    if (/命運|destiny/i.test(name)) return 'fortune';
    if (/創世|genesis/i.test(name)) return 'genesis';
    if (/神祕冥界|神秘冥界|神祕|神秘|arcane/i.test(name)) return 'arcane';
    if (/航海師|航海|absolab/i.test(name)) return 'absolab';
    if (/法弗納|深淵|fafnir/i.test(name)) return 'fafnir';
    return '';
  }

  /** 同強化條件下的基準弓總攻。星力 25 依 MapleCombat 沿用 24→25 固定值。 */
  function calculateTargetTotal(setKey, input) {
    const data = getDatabase(!!input?.isZero)[setKey];
    if (!data) return 0;
    const flameTier = clampInt(input?.flameTier, 0, 9);
    const starCount = clampInt(input?.starCount, 0, 25);
    const flameAtk = Number(data.flames[flameTier]) || 0;
    const scrollAtk = Number(input?.scrollAtk) || 0;
    let currentAtk = (Number(data.base) || 0) + scrollAtk + flameAtk;

    for (let star = 1; star <= starCount; star += 1) {
      let gain = 0;
      if (star <= 15) {
        const starBase = currentAtk - flameAtk;
        gain = Math.floor(starBase / 50) + 1;
      } else {
        gain = Number(data.stars16_24[Math.min(star - 16, 8)]) || 0;
      }
      currentAtk += gain;
    }
    return currentAtk;
  }

  function calculate(input) {
    const setKey = String(input?.setKey || '');
    const targetTotal = calculateTargetTotal(setKey, input);
    const currentWeaponAtk = Number(input?.currentWeaponAtk) || 0;
    return {
      setKey,
      setName: getDatabase(!!input?.isZero)[setKey]?.name || '',
      targetTotal,
      currentWeaponAtk,
      correction: targetTotal && currentWeaponAtk ? targetTotal - currentWeaponAtk : 0,
    };
  }

  function resolveWornWeapon() {
    if (typeof UiEquipModule === 'undefined' || typeof EquipTooltipModule === 'undefined') {
      return null;
    }
    const mainEntry = UiEquipModule.getWornEntry?.('11');
    const zeroEntry = UiEquipModule.getWornEntry?.('37');
    const slotId = mainEntry?.itemId ? '11' : zeroEntry?.itemId ? '37' : '';
    const entry = slotId === '11' ? mainEntry : zeroEntry;
    if (!slotId || !entry?.itemId) return null;
    const item = EquipTooltipModule.resolveItemState(
      entry.itemId,
      `body:${slotId}`,
      entry.state,
    );
    return item ? { slotId, entry, item } : null;
  }

  function inspectEquipped(options) {
    const worn = resolveWornWeapon();
    if (!worn) return null;
    const { item, slotId } = worn;
    const setKey = detectSetKey(item);
    if (!setKey) {
      return { item, slotId, setKey: '', error: '無法辨識武器套裝' };
    }

    const preferMagic = !!options?.preferMagic;
    const baseAtk = Number(item.baseStats?.atk) || 0;
    const baseMatk = Number(item.baseStats?.matk) || 0;
    const useMagic = preferMagic && baseMatk > 0;
    const statLabel = useMagic ? '魔法攻擊力' : '攻擊力';
    const flameStatId = useMagic ? 'matk' : 'watk';
    const segments = EquipTooltipModule.buildStatSegments?.(item) || [];
    const segment = segments.find((row) => row.label === statLabel);
    const currentWeaponAtk = Number(segment?.total) || 0;
    const lines = item.bonusStat?.lines || [];
    const flameLines = lines.filter((line) => (
      line?.statId === flameStatId && line?.isPercent !== false
    ));
    const flameTier = flameLines.length
      ? Math.max(...flameLines.map((line) => clampInt(line.starTier, 1, 9)))
      : 0;
    const scrollAtk = useMagic
      ? Number(item.scrollMatk) || 0
      : Number(item.scrollAtk) || 0;
    const starCount = clampInt(item.star, 0, 25);
    const isZero = item.islot === 'Wpsi' || options?.jobName === '神之子';
    const input = {
      setKey,
      starCount,
      flameTier,
      scrollAtk,
      currentWeaponAtk,
      isZero,
    };
    return {
      ...input,
      ...calculate(input),
      item,
      slotId,
      itemName: item.name || item.itemId,
      statLabel,
      flameAttack: Number(segment?.bonus) || 0,
      starAttack: Number(segment?.star) || 0,
    };
  }

  return {
    DATABASE,
    ZERO_DATABASE,
    detectSetKey,
    calculateTargetTotal,
    calculate,
    inspectEquipped,
  };
})();

if (typeof window !== 'undefined') {
  window.WeaponCorrection = WeaponCorrection;
}
