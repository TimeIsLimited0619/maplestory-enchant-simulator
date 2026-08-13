from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / 'index.html'
t = p.read_text(encoding='utf-8')
for pat, rep in [
    (r'js/scrollData\.js\?v=[^"]+', 'js/scrollData.js?v=20260813chaos5'),
    (r'js/scroll\.js\?v=[^"]+', 'js/scroll.js?v=20260813chaos5'),
]:
    t, n = re.subn(pat, rep, t, count=1)
    print(rep, n)
p.write_text(t, encoding='utf-8')
