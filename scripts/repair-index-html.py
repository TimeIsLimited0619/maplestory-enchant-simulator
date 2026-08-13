# -*- coding: utf-8 -*-
from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')

css_block = """  <!-- 自訂 CSS（modules；file:// 勿用 @import） -->
  <link rel=\"stylesheet\" href=\"css/modules/01-base.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/02-sidebar.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/03-main-panel.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/04-inventory.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/05-forms-modal.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/06-starforce-extras.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/07-starforce.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/08-control-shared.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/09-hammer.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/10-soul-weapon.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/11-exceptional.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/12-scroll.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/13-potential.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/14-potential-inspect.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/15-equip-tooltip.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/16-bonus-stat.css?v=20260813wear3\">
  <link rel=\"stylesheet\" href=\"css/modules/17-uiequip.css?v=20260813wear3\">
"""

old_css = """  <!-- 自訂 CSS -->
  <link rel=\"stylesheet\" href=\"css/style.css?v=20260812ps1\">
"""
if old_css not in text:
    raise SystemExit('css block not found')
text = text.replace(old_css, css_block)

old_page = """  <div id=\"pageEnhance\">
    <div class=\"ms-container-3col\">
"""
new_page = """  <div id=\"pageEnhance\">
    <!-- 陽春視圖切換（之後改正式 menu） -->
    <div class=\"view-mode-bar\" role=\"tablist\" aria-label=\"介面切換\">
      <button type=\"button\" class=\"view-mode-btn is-active\" id=\"btnViewEnchant\">強化</button>
      <button type=\"button\" class=\"view-mode-btn\" id=\"btnViewEquip\">裝備欄</button>
    </div>

    <div class=\"ms-container-3col\">
"""
if old_page not in text:
    raise SystemExit('pageEnhance block not found')
text = text.replace(old_page, new_page)

old_main = """      <!-- 2. 中間強化主面板 -->
      <div class=\"ms-main-content\" id=\"mainContentPanel\">
"""
new_main = """      <!-- 2a. 裝備欄（UIEquip 殼；與強化主面板互斥顯示） -->
      <div id=\"uiEquipPanel\" class=\"uiequip-panel hidden\" aria-label=\"裝備欄\">
        <button type=\"button\" class=\"uiequip-tab uiequip-tab-equip\" tabindex=\"-1\" aria-hidden=\"true\" title=\"裝備\"></button>
        <button type=\"button\" class=\"uiequip-tab uiequip-tab-cash\" tabindex=\"-1\" aria-hidden=\"true\" title=\"裝扮\"></button>
        <div class=\"uiequip-canvas\" aria-hidden=\"true\"></div>
        <div id=\"uiEquipSlots\" class=\"uiequip-slots\"></div>
        <div id=\"uiEquipPresetSelected\" class=\"uiequip-preset-selected\" aria-hidden=\"true\"></div>
        <button type=\"button\" class=\"uiequip-preset-btn uiequip-preset-1\" id=\"uiEquipPreset1\" title=\"裝備預設 1\"></button>
        <button type=\"button\" class=\"uiequip-preset-btn uiequip-preset-2\" id=\"uiEquipPreset2\" title=\"裝備預設 2\"></button>
        <button type=\"button\" class=\"uiequip-preset-btn uiequip-preset-3\" id=\"uiEquipPreset3\" title=\"裝備預設 3\"></button>
        <button type=\"button\" class=\"uiequip-preset-apply\" id=\"uiEquipPresetApply\" title=\"套用預設\"></button>
      </div>

      <!-- 2. 中間強化主面板 -->
      <div class=\"ms-main-content\" id=\"mainContentPanel\">
"""
if old_main not in text:
    raise SystemExit('mainContent block not found')
text = text.replace(old_main, new_main)

text = text.replace('js/inventory.js?v=20260812nopot1', 'js/inventory.js?v=20260813wear3')
text = text.replace('js/sessionPersistence.js?v=20260812nopot1', 'js/sessionPersistence.js?v=20260813wear3')
text = re.sub(r'js/equipTooltip\.js\?v=[^\"]+', 'js/equipTooltip.js?v=20260813wear3', text)
text = re.sub(r'js/main\.js\?v=[^\"]+', 'js/main.js?v=20260813wear3', text)

if 'js/uiEquip.js' not in text:
    text = text.replace(
        '<script src="js/inventory.js?v=20260813wear3"></script>',
        '<script src="js/inventory.js?v=20260813wear3"></script>\n  <script src="js/uiEquip.js?v=20260813wear3"></script>',
    )

path.write_text(text, encoding='utf-8', newline='\n')
t = path.read_text(encoding='utf-8')
assert '楓之谷做裝模擬器' in t
assert 'uiEquipPanel' in t
assert 'js/uiEquip.js' in t
assert t.count('css/modules') >= 17
print('patched ok')
