/**
 * 讓 GM 面板把地圖／副本資料寫進 JS。
 * 用法：在專案根目錄執行  npm run gm-writer
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZONE_TARGET = path.join(__dirname, '..', 'js', 'idleZonesData.js');
const DUNGEON_TARGET = path.join(__dirname, '..', 'js', 'idleDungeonListData.js');
const ART_CATALOG = path.join(__dirname, '..', 'js', 'idleZoneArtCatalog.js');
const ZONE_DIR = path.join(__dirname, '..', 'images', 'idle-zones');
const PORT = Number(process.env.IDLE_GM_PORT) || 3847;

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function listMapBgs() {
  const items = [];
  if (!fs.existsSync(ZONE_DIR)) return items;
  fs.readdirSync(ZONE_DIR).forEach((name) => {
    const full = path.join(ZONE_DIR, name);
    let st;
    try {
      st = fs.statSync(full);
    } catch (_) {
      return;
    }
    if (st.isFile()) {
      const ext = path.extname(name).toLowerCase();
      if (!IMG_EXT.has(ext)) return;
      const artId = path.basename(name, path.extname(name));
      items.push({ artId, url: `images/idle-zones/${name}` });
    }
  });
  items.sort((a, b) => a.artId.localeCompare(b.artId, 'en'));
  return items;
}

function writeArtCatalog(items) {
  const body = items.map((row) => (
    `  { artId: ${JSON.stringify(row.artId)}, url: ${JSON.stringify(row.url)} }`
  )).join(',\n');
  const source = `/**
 * images/idle-zones 底下的地圖圖檔。
 * 由 npm run gm-writer 掃描更新。
 */
const IDLE_ZONE_ART_CATALOG = [
${body}
];

if (typeof window !== 'undefined') window.IDLE_ZONE_ART_CATALOG = IDLE_ZONE_ART_CATALOG;
`;
  fs.writeFileSync(ART_CATALOG, source, 'utf8');
}

function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }
  if (req.url === '/health' && req.method === 'GET') {
    send(res, 200, { ok: true, file: ZONE_TARGET, dungeonFile: DUNGEON_TARGET });
    return;
  }
  if (req.url === '/map-bgs' && req.method === 'GET') {
    try {
      const items = listMapBgs();
      writeArtCatalog(items);
      send(res, 200, { ok: true, items });
    } catch (err) {
      send(res, 500, { ok: false, error: String(err.message || err) });
    }
    return;
  }
  if (req.url === '/write' && req.method === 'POST') {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        const data = JSON.parse(raw || '{}');
        const source = String(data.source || '');
        const kind = String(data.kind || '').trim();
        const isDungeon = kind === 'dungeon' || source.includes('IDLE_DUNGEON_LIST');
        if (isDungeon) {
          if (!source.includes('IDLE_DUNGEON_LIST')) {
            send(res, 400, { ok: false, error: 'invalid dungeon source' });
            return;
          }
          fs.writeFileSync(DUNGEON_TARGET, source.replace(/\n/g, '\n'), 'utf8');
          console.log('已寫入', DUNGEON_TARGET);
          send(res, 200, { ok: true, file: DUNGEON_TARGET });
          return;
        }
        if (!source.includes('IDLE_ZONE_PATCHES') && !source.includes('IDLE_ZONE_LIST')) {
          send(res, 400, { ok: false, error: 'invalid source' });
          return;
        }
        fs.writeFileSync(ZONE_TARGET, source.replace(/\n/g, '\n'), 'utf8');
        console.log('已寫入', ZONE_TARGET);
        send(res, 200, { ok: true, file: ZONE_TARGET });
      } catch (err) {
        send(res, 500, { ok: false, error: String(err.message || err) });
      }
    });
    return;
  }
  send(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`GM 寫入服務 http://127.0.0.1:${PORT}`);
  console.log('章節目標', ZONE_TARGET);
  console.log('副本目標', DUNGEON_TARGET);
});
