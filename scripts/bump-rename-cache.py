from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / 'index.html'
t = p.read_text(encoding='utf-8')
repls = [
    (r'js/item\.js\?v=[^"]+', 'js/item.js?v=20260813rename1'),
    (r'js/uiEquip\.js\?v=[^"]+', 'js/uiEquip.js?v=20260813rename1'),
    (r'js/equipTooltipData\.js\?v=[^"]+', 'js/equipTooltipData.js?v=20260813rename1'),
    (r'js/potentialCube\.js\?v=[^"]+', 'js/potentialCube.js?v=20260813rename1'),
    (r'js/inventory\.js\?v=[^"]+', 'js/inventory.js?v=20260813rename1'),
    (r'js/exceptionalData\.js\?v=[^"]+', 'js/exceptionalData.js?v=20260813rename1'),
    (r'js/energyBadgePotentialValues\.js(?:\?v=[^"]+)?', 'js/energyBadgePotentialValues.js?v=20260813rename1'),
]
for pat, rep in repls:
    t, n = re.subn(pat, rep, t, count=1)
    print(rep, n)
p.write_text(t, encoding='utf-8')
