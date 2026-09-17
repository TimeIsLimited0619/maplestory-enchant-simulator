/**
 * 五轉技能點數消耗品：雙擊使用 → 一次消耗全部，每顆 +1 五轉 SP。
 */
const V_SKILL_POINT_ITEM = {
  id: 'v_skill_point',
  name: 'V技能核心',
  icon: 'images/potion/02436324.png',
  desc: '雙擊使用後一次消耗全部，每顆獲得 1 點五轉技能點數。',
  price: 10000,
};

const DEFAULT_V_SKILL_POINT_COUNT = 0;
let playerVSkillPointCount = DEFAULT_V_SKILL_POINT_COUNT;

function getPlayerVSkillPointCount() {
  return Math.max(0, Math.floor(Number(playerVSkillPointCount) || 0));
}

function ensureVSkillPointConsumeInventory() {
  if (typeof InventoryModule === 'undefined' || typeof InventoryModule.ensureConsumeSlot !== 'function') {
    return;
  }
  if (typeof CONSUME_ITEM_TYPE === 'undefined') return;
  if (getPlayerVSkillPointCount() <= 0) return;
  InventoryModule.ensureConsumeSlot(
    (entry) => entry && (
      entry.type === CONSUME_ITEM_TYPE.V_SKILL_POINT
      || entry.type === 'v_skill_point'
    ),
    () => ({
      type: CONSUME_ITEM_TYPE.V_SKILL_POINT,
      itemId: V_SKILL_POINT_ITEM.id,
    }),
  );
}

function grantVSkillPointItem(amount = 1) {
  const add = Math.floor(Number(amount) || 0);
  if (add <= 0) return 0;
  playerVSkillPointCount = getPlayerVSkillPointCount() + add;
  ensureVSkillPointConsumeInventory();
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave?.();
  }
  if (typeof InventoryModule !== 'undefined') {
    InventoryModule.render?.();
    InventoryModule.updateSlotCount?.();
  }
  return add;
}

function consumeVSkillPointItem(amount = 1) {
  const need = Math.max(1, Math.floor(Number(amount) || 1));
  const have = getPlayerVSkillPointCount();
  if (have < need) return false;
  playerVSkillPointCount = have - need;
  if (typeof InventoryModule !== 'undefined') {
    InventoryModule.render?.();
    InventoryModule.updateSlotCount?.();
  }
  if (typeof SessionPersistenceModule !== 'undefined') {
    SessionPersistenceModule.scheduleSave?.();
  }
  return true;
}

/** 一次消耗全部：每顆 +1 五轉技能點 */
function useVSkillPointItem() {
  if (typeof CharacterSkills === 'undefined'
    || typeof CharacterSkills.grantVSkillPoints !== 'function') {
    return { ok: false, reason: 'no_api' };
  }
  if (typeof CharacterSkills.isRankUnlocked === 'function'
    && !CharacterSkills.isRankUnlocked('200')
    && !CharacterSkills.isRankUnlocked('hexa')) {
    if (typeof addLog === 'function') {
      addLog('[背包] 需達到 200 等才能使用 V技能核心。', 'log-fail');
    }
    return { ok: false, reason: 'locked' };
  }
  const have = getPlayerVSkillPointCount();
  if (have <= 0) {
    if (typeof addLog === 'function') {
      addLog('[背包] 沒有 V技能核心可使用。', 'log-fail');
    }
    return { ok: false, reason: 'empty' };
  }
  if (!consumeVSkillPointItem(have)) {
    return { ok: false, reason: 'empty' };
  }
  const gained = CharacterSkills.grantVSkillPoints(have);
  if (!(gained > 0)) {
    grantVSkillPointItem(have);
    return { ok: false, reason: 'grant_fail' };
  }
  if (typeof addLog === 'function') {
    addLog(`[背包] 使用 V技能核心 ×${have}，五轉技能點 +${gained}。`, 'log-success');
  }
  if (typeof SkillBoardPanel !== 'undefined') SkillBoardPanel.refresh?.();
  return { ok: true, gained, used: have };
}

if (typeof window !== 'undefined') {
  window.V_SKILL_POINT_ITEM = V_SKILL_POINT_ITEM;
  window.getPlayerVSkillPointCount = getPlayerVSkillPointCount;
  window.grantVSkillPointItem = grantVSkillPointItem;
  window.consumeVSkillPointItem = consumeVSkillPointItem;
  window.useVSkillPointItem = useVSkillPointItem;
  window.ensureVSkillPointConsumeInventory = ensureVSkillPointConsumeInventory;
}
