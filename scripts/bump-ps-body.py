# -*- coding: utf-8 -*-
from pathlib import Path
import re

path = Path('index.html')
text = path.read_text(encoding='utf-8')
stamp = '20260813psBody1'
text = re.sub(r'(js/inventory\.js\?v=)[^"]+', rf'\g<1>{stamp}', text)
text = re.sub(r'(js/uiEquip\.js\?v=)[^"]+', rf'\g<1>{stamp}', text)
path.write_text(text, encoding='utf-8', newline='\n')
print('ok', stamp)
