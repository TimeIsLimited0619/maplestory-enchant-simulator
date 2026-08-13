# -*- coding: utf-8 -*-
from pathlib import Path
import re
p = Path('index.html')
t = p.read_text(encoding='utf-8')
t = re.sub(r'(css/modules/17-uiequip\.css\?v=)[^"]+', r'\g<1>20260813slotNameKeep1', t)
p.write_text(t, encoding='utf-8', newline='\n')
print('ok')
