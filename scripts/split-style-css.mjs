/**
 * 依 /* ========== 區塊註解自動拆分 css/style.css
 * 用法: node scripts/split-style-css.mjs [--write]
 * 預設 dry-run；加 --write 才寫檔並改 index.html
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'css', 'style.css');
const OUT_DIR = path.join(ROOT, 'css', 'modules');
const BACKUP = path.join(ROOT, 'css', 'style.monolith.css');
const BARREL = path.join(ROOT, 'css', 'style.css');
const INDEX = path.join(ROOT, 'index.html');
const WRITE = process.argv.includes('--write');

/** 區塊標題 → 檔名（未命中則自動 slug） */
const TITLE_TO_FILE = [
  [/全局與基礎佈局/, '01-base'],
  [/左側邊欄|Sidebar/, '02-sidebar'],
  [/中間主面板|Main Content/, '03-main-panel'],
  [/右側背包|Inventory/, '04-inventory'],
  [/通用表單|Log\s*\/\s*Modal|Modal 彈窗/, '05-forms-modal'],
  [/追加：星力|Stats Diff/, '06-starforce-extras'],
  [/星力強化面板/, '07-starforce'],
  [/更換各中控台的底圖|專屬的主要強化按鈕/, '08-control-shared'],
  [/強化次數增加|Hammer/, '09-hammer'],
  [/靈魂武器|Soul Weapon/, '10-soul-weapon'],
  [/卓越強化|Exceptional/, '11-exceptional'],
  [/卷軸強化|Scroll UI/, '12-scroll'],
  [/潛在能力面板|Potential UI/, '13-potential'],
  [/潛能詞條查詢/, '14-potential-inspect'],
  [/裝備 Hover Tooltip|UIToolTip/, '15-equip-tooltip'],
  [/附加能力|bonusStat/, '16-bonus-stat'],
];

const SECTION_RE = /^\/\* ={5,}[\s\S]*?={5,} \*\//gm;

function slugify(title) {
  const mapped = TITLE_TO_FILE.find(([re]) => re.test(title));
  if (mapped) return mapped[1];
  const base = title
    .replace(/^\d+\.\s*/, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .trim()
    .replace(/[^\w\u4e00-\u9fff\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'section';
  return `xx-${base}`;
}

function extractTitle(headerBlock) {
  const lines = headerBlock
    .replace(/^\/\*\s*/, '')
    .replace(/\s*\*\/$/, '')
    .split(/\n/)
    .map((l) => l.replace(/^\s*=+\s*$/, '').trim())
    .filter((l) => l && !/^=+$/.test(l));
  return lines.join(' · ') || 'untitled';
}

function rewriteUrlsForModules(css) {
  // css/style.css → ../images
  // css/modules/*.css → ../../images
  return css
    .replace(/url\(\s*(['"]?)\.\.\/images\//g, 'url($1../../images/')
    .replace(/url\(\s*(['"]?)\.\.\/\.\.\/images\//g, 'url($1../../images/');
}

function splitCss(text) {
  const headers = [];
  let m;
  const re = new RegExp(SECTION_RE.source, 'gm');
  while ((m = re.exec(text)) !== null) {
    headers.push({ index: m.index, header: m[0], end: m.index + m[0].length });
  }

  if (!headers.length) {
    throw new Error('找不到 /* ===== 區塊註解，無法拆分');
  }

  // 檔首若在第一個區塊之前有內容，併入第一塊
  const chunks = [];
  for (let i = 0; i < headers.length; i += 1) {
    const start = headers[i].index;
    const next = i + 1 < headers.length ? headers[i + 1].index : text.length;
    const body = text.slice(start, next);
    const title = extractTitle(headers[i].header);
    chunks.push({ title, body, startLineHint: start });
  }

  if (headers[0].index > 0) {
    const preface = text.slice(0, headers[0].index).trim();
    if (preface) {
      chunks[0].body = `${preface}\n\n${chunks[0].body}`;
      chunks[0].title = `${chunks[0].title} (+preface)`;
    }
  }

  // 合併連續小區塊到同一檔名（例如 08-control-shared 的兩段）
  const files = new Map();
  chunks.forEach((chunk, idx) => {
    const fileBase = slugify(chunk.title);
    const key = fileBase;
    if (!files.has(key)) {
      files.set(key, { fileBase, title: chunk.title, parts: [] });
    } else {
      files.get(key).title += ` / ${chunk.title}`;
    }
    files.get(key).parts.push(chunk.body.trimEnd());
  });

  // 穩定排序依檔名
  return [...files.values()]
    .sort((a, b) => a.fileBase.localeCompare(b.fileBase, 'en'))
    .map((entry, i) => ({
      ...entry,
      filename: `${entry.fileBase}.css`,
      css: `${entry.parts.join('\n\n')}\n`,
      order: i,
    }));
}

function buildBarrelImports(modules) {
  const lines = [
    '/* Auto-generated barrel — optional entry; index.html links modules directly */',
    '/* Source backup: css/style.monolith.css */',
    '/* Regenerate: node scripts/split-style-css.mjs --write */',
    '',
  ];
  modules.forEach((mod) => {
    lines.push(`@import url('./modules/${mod.filename}');`);
  });
  lines.push('');
  return lines.join('\n');
}

function buildLinkTags(modules, stamp) {
  return modules
    .map((mod) => `  <link rel="stylesheet" href="css/modules/${mod.filename}?v=${stamp}">`)
    .join('\n');
}

function updateIndexHtml(modules) {
  if (!fs.existsSync(INDEX)) return false;
  let html = fs.readFileSync(INDEX, 'utf8');
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '') + 'cssSplit1';

  // 替換單一 style.css，或已存在的 modules 區塊（含 ?v= query）
  const blockRe =
    /(?:[ \t]*<!-- 自訂 CSS[^>]*-->\s*)?(?:[ \t]*<link\s+rel="stylesheet"\s+href="css\/(?:style\.css|modules\/[^"?]+)(?:\?[^"]*)?"[^>]*>\s*)+/;

  if (!blockRe.test(html)) {
    console.warn('index.html 找不到 css/style.css / modules link，略過更新');
    return false;
  }

  // file:// 下 @import 不穩，改多條 <link>（平行載入、預載掃描也較準）
  const links = buildLinkTags(modules, stamp);
  const block = `  <!-- 自訂 CSS（modules；file:// 勿用 @import） -->\n${links}\n`;
  html = html.replace(blockRe, block);
  if (WRITE) fs.writeFileSync(INDEX, html, 'utf8');
  return true;
}

function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`找不到 ${SRC}`);
  }

  const original = fs.readFileSync(SRC, 'utf8');
  // 若已是 barrel，從 backup 重切
  const sourceText = original.includes('Auto-generated barrel') && fs.existsSync(BACKUP)
    ? fs.readFileSync(BACKUP, 'utf8')
    : original;

  const modules = splitCss(sourceText);

  console.log(`Sections → ${modules.length} files:`);
  let total = 0;
  modules.forEach((mod) => {
    const lines = mod.css.split(/\n/).length;
    total += lines;
    console.log(`  ${mod.filename.padEnd(28)} ${String(lines).padStart(5)} lines  — ${mod.title}`);
  });
  console.log(`Total lines ≈ ${total}`);

  if (!WRITE) {
    console.log('\nDry-run only. Re-run with --write to apply.');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 備份 monolith（只在尚未是 barrel 時覆寫 backup）
  if (!original.includes('Auto-generated barrel')) {
    fs.writeFileSync(BACKUP, sourceText, 'utf8');
    console.log('Backup →', path.relative(ROOT, BACKUP));
  }

  // 清掉舊 modules（同一次拆分產物）
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (name.endsWith('.css')) fs.unlinkSync(path.join(OUT_DIR, name));
  }

  modules.forEach((mod) => {
    const out = rewriteUrlsForModules(mod.css);
    fs.writeFileSync(path.join(OUT_DIR, mod.filename), out, 'utf8');
  });

  fs.writeFileSync(BARREL, buildBarrelImports(modules), 'utf8');
  updateIndexHtml(modules);

  console.log(`\nWrote ${modules.length} modules → css/modules/`);
  console.log('Barrel → css/style.css');
  console.log('Done.');
}

main();
