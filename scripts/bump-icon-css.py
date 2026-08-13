# -*- coding: utf-8 -*-
from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
stamp = '20260813iconNative1'
text = re.sub(r'(css/modules/03-main-panel\.css\?v=)[^"]+', rf'\g<1>{stamp}', text)
text = re.sub(r'(css/modules/04-inventory\.css\?v=)[^"]+', rf'\g<1>{stamp}', text)
text = re.sub(r'(css/modules/17-uiequip\.css\?v=)[^"]+', rf'\g<1>{stamp}', text)
path.write_text(text, encoding='utf-8', newline='\n')
print('cache bumped', stamp)
