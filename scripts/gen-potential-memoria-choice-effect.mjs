/**
 * 由 bonusStatChoiceEffect.js 模板產生 potentialMemoriaChoiceEffect.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'js', 'bonusStatChoiceEffect.js');
const OUT = path.join(ROOT, 'js', 'potentialMemoriaChoiceEffect.js');

let s = fs.readFileSync(SRC, 'utf8');

const header = `/**
 * 恢復方塊自動重設 — AFTER 卡片 flip 動畫（邏輯比照星火 memorial auto）
 */
`;

s = s.replace(/^\/\*\*[\s\S]*?\*\//, header.trim());

const pairs = [
  ['BsChoiceFlipRenderer', 'PtMemoriaFlipRenderer'],
  ['bs-choice-flip', 'pt-memoria-flip'],
  ['BonusStatChoiceEffectModule', 'PotentialMemoriaChoiceEffectModule'],
  ["afterBoxId: 'bsChoiceAfter'", "afterBoxId: 'ptMemoriaAfter'"],
  ["panelSel: '#bsChoiceOverlay .bs-choice-modal-panel'", "panelSel: '#ptMemoriaOverlay .pt-memoria-modal-panel'"],
  ["document.getElementById('bsChoiceOverlay')", "document.getElementById('ptMemoriaOverlay')"],
  ["document.getElementById('bsChoiceAfter')", "document.getElementById('ptMemoriaAfter')"],
  ["document.getElementById('bsChoiceBefore')", "document.getElementById('ptMemoriaBefore')"],
  ["document.getElementById('bsChoiceBtnConfirm')", "document.getElementById('ptMemoriaBtnReset')"],
  ['is-bs-flip-playing', 'is-pt-flip-playing'],
  ['is-bs-flip-waiting', 'is-pt-flip-waiting'],
  ['BONUS_STAT_CHOICE_EFFECT', 'POTENTIAL_MEMORIA_CHOICE_EFFECT'],
  ['bsChoiceFlipAssetPath', 'ptMemoriaFlipAssetPath'],
  ['isBonusStatEnhanceAnimEnabled', 'isPotentialEnhanceAnimEnabled'],
  ["box.dataset.bsFlipClickBound", "box.dataset.ptFlipClickBound"],
  ['BonusStatChoiceModule', 'PotentialModule'],
  ['AutoEnchantBonusStatModule', 'AutoEnchantPotentialModule'],
  ['.isOpen()', '.isMemoriaOverlayOpen()'],
  ['mod.closing', 'mod.memoriaClosing'],
  ['openAutoSession', 'openMemoriaAutoSession'],
  ['updateAutoSession', 'updateMemoriaAutoSession'],
  ['selectSide', 'selectMemoriaSide'],
  ['onConfirmButtonClick', 'onMemoriaResetButtonClick'],
  ['origClose', 'origCloseMemoria'],
  ['mod.close', 'mod.closeMemoriaOverlay'],
  ['handleBeforeSelect', 'handleMemoriaBeforeSelect'],
  ['BonusStatModule.applyChoiceResult(mod.after)', "mod.applyMemoriaChoice('after')"],
  ['BonusStatModule.applyChoiceResult(mod.before)', "mod.applyMemoriaChoice('before')"],
  ['mod.close()', 'mod.closeMemoriaOverlay()'],
  ['附加能力：已套用 AFTER', '恢復方塊：已套用 AFTER'],
  ['附加能力：已套用 BEFORE', '恢復方塊：已套用 BEFORE'],
  ['restartMemorialAutoFromChoice', 'restartMemorialAutoFromChoice'],
  ['bootstrapChoiceEffect', 'bootstrapPotentialMemoriaChoiceEffect'],
];

pairs.forEach(([from, to]) => {
  s = s.split(from).join(to);
});

// Fix isOpen check - was broken by .isOpen() -> .isMemoriaOverlayOpen() on wrong things
s = s.replace(/PotentialModule\.isMemoriaOverlayOpen\(\)\(\)/g, 'PotentialModule.isMemoriaOverlayOpen()');

fs.writeFileSync(OUT, s, 'utf8');
console.log('Wrote', OUT);
