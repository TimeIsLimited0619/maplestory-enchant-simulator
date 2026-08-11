/**
 * 楓之谷_輪迴星火附加屬性完整設定與數值對照表.xlsx → js/bonusStatValues.js
 * 九級星火：依 1~7 級最後一階增量 (L7-L6) 線性外推 L8、L9
 *
 * 用法: node scripts/parse-bonus-stat-xlsx.mjs [xlsxPath]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEFAULT_XLSX = path.join('C:', 'Users', 'Time', 'Downloads', '楓之谷_輪迴星火附加屬性完整設定與數值對照表.xlsx');
const OUT_JS = path.join(ROOT, 'js', 'bonusStatValues.js');

const xlsxPath = process.argv[2] || DEFAULT_XLSX;

const py = `
import json, openpyxl, re, sys

path = sys.argv[1]

def parse_pct(s):
    if s is None: return None
    if isinstance(s, (int, float)): return float(s)
    m = re.match(r'^([\\d.]+)%?$', str(s).strip())
    return float(m.group(1)) if m else None

def parse_num(s):
    if s is None: return None
    if isinstance(s, (int, float)): return float(s)
    text = str(s).strip().replace(',', '')
    if text.endswith('%'):
        return parse_pct(text)
    m = re.search(r'-?[\\d.]+', text)
    return float(m.group(0)) if m else None

def extend_levels(vals7, is_percent=False):
    inc = vals7[6] - vals7[5]
    lv8 = vals7[6] + inc
    lv9 = lv8 + inc
    if is_percent:
        def fmt(x):
            s = f"{x:.4f}".rstrip('0').rstrip('.')
            return s + '%'
        return [fmt(v) for v in vals7] + [fmt(lv8), fmt(lv9)]
    if all(isinstance(v, int) or (isinstance(v, float) and v == int(v)) for v in vals7):
        return [int(round(v)) for v in vals7] + [int(round(lv8)), int(round(lv9))]
    return vals7 + [lv8, lv9]

def parse_level_range(label):
    label = str(label).strip()
    if label == '250': return (250, 250)
    m = re.match(r'^(\\d+)\\s*-\\s*(\\d+)$', label)
    if m: return (int(m.group(1)), int(m.group(2)))
    return None

def parse_stat_pool(text):
    if not text: return []
    parts = re.split(r',\\s*', str(text).strip())
    out = []
    for p in parts:
        p = p.strip().replace(' ', '')
        if p: out.append(p)
    return out

def read_table_rows(ws, start_row, end_row, value_cols=7, is_percent=False):
    rows = []
    for r in range(start_row, end_row + 1):
        label = ws.cell(r, 1).value
        if label is None: continue
        lr = parse_level_range(label)
        if not lr: continue
        vals = []
        for c in range(2, 2 + value_cols):
            v = ws.cell(r, c).value
            vals.append(parse_pct(v) if is_percent else parse_num(v))
        if any(v is None for v in vals): continue
        rows.append({'minLevel': lr[0], 'maxLevel': lr[1], 'values': extend_levels(vals, is_percent)})
    return rows

def find_section(ws, marker):
    for r in range(1, ws.max_row + 1):
        v = ws.cell(r, 1).value
        if v and marker in str(v) and str(v).startswith('【'):
            return r
    return None

def find_sections_with_ranges(ws):
    sections = []
    r = 1
    while r <= ws.max_row:
        label = ws.cell(r, 1).value
        if label and re.match(r'^\\d', str(label).strip()):
            rows = []
            while r <= ws.max_row:
                lr = parse_level_range(ws.cell(r, 1).value)
                if not lr: break
                rows.append(r)
                r += 1
            if rows:
                sections.append(rows)
            continue
        r += 1
    return sections

def read_percent_sections(ws):
    sections = find_sections_with_ranges(ws)
    names = ['watkPctGeneral', 'watkPctBoss', 'matkPctGeneral', 'matkPctBoss']
    out = {}
    for i, row_nums in enumerate(sections[:4]):
        key = names[i] if i < len(names) else f'section{i}'
        rows = []
        for rn in row_nums:
            lr = parse_level_range(ws.cell(rn, 1).value)
            vals = [parse_pct(ws.cell(rn, c).value) for c in range(2, 9)]
            if any(v is None for v in vals): continue
            rows.append({'minLevel': lr[0], 'maxLevel': lr[1], 'values': extend_levels(vals, True)})
        out[key] = rows
    return out

def read_fixed_stats(ws):
    fixed = {}
    for r in range(1, ws.max_row + 1):
        name = ws.cell(r, 1).value
        if not name: continue
        name = str(name).strip()
        vals_raw = [ws.cell(r, c).value for c in range(3, 10)]
        if not vals_raw or all(v is None for v in vals_raw): continue
        is_pct = any(isinstance(v, str) and '%' in v for v in vals_raw)
        vals = [parse_pct(v) if is_pct else parse_num(v) for v in vals_raw]
        if any(v is None for v in vals): continue
        ext = extend_levels(vals, False)
        col2 = str(ws.cell(r, 2).value or '')
        if is_pct and ('屬性' in name or name.endswith('%')) and 'BOSS' not in name.upper() and '傷害' not in name:
            fixed['allStatPct'] = [int(round(v)) for v in ext]
        elif is_pct and 'BOSS' in name.upper():
            fixed['bossDmgPct'] = [int(round(v)) for v in ext]
        elif is_pct and '傷害' in name:
            fixed['dmgPct'] = [int(round(v)) for v in ext]
        elif '防具攻擊' in name or ('攻擊' in name and '防具' in col2):
            fixed['armorAtkFlat'] = [int(round(v)) for v in ext]
        elif '移動' in name:
            fixed['speed'] = [int(round(v)) for v in ext]
        elif '跳躍' in name:
            fixed['jump'] = [int(round(v)) for v in ext]
        elif '穿戴' in name and '減' in name:
            fixed['levelReduce'] = [int(round(v)) for v in ext]
    return fixed

wb = openpyxl.load_workbook(path, data_only=True)
sheets = wb.sheetnames
s1, s2, s3 = wb[sheets[0]], wb[sheets[1]], wb[sheets[2]]

star_level_prob = {}
line_count_prob = {}
weapon_stats = []
armor_stats = []

for r in range(1, s1.max_row + 1):
    row = [s1.cell(r, c).value for c in range(1, 6)]
    label = row[0]
    if not label: continue
    label = str(label).strip()
    if label in ('強力的輪迴星火', '永遠的輪迴星火', '覺醒的輪迴星火 (一般裝備)', '覺醒的暗黑輪迴星火 (一般裝備)'):
        key = {
            '強力的輪迴星火': 'enhanced',
            '永遠的輪迴星火': 'eternal',
            '覺醒的輪迴星火 (一般裝備)': 'awakened',
            '覺醒的暗黑輪迴星火 (一般裝備)': 'blackAwakened',
        }[label]
        star_level_prob[key] = {
            2: parse_pct(row[1]) or 0,
            3: parse_pct(row[2]) or 0,
            4: parse_pct(row[3]) or 0,
            5: parse_pct(row[4]) or 0,
        }
    if label in ('一般裝備', 'Boss裝備'):
        key = 'general' if label == '一般裝備' else 'boss'
        line_count_prob[key] = [
            parse_pct(row[1]) or 0,
            parse_pct(row[2]) or 0,
            parse_pct(row[3]) or 0,
            parse_pct(row[4]) or 0,
        ]
    if label == '武器':
        weapon_stats = parse_stat_pool(row[1])
    if label.startswith('其他裝備'):
        armor_stats = parse_stat_pool(row[1])

single_main = read_table_rows(s2, 5, 17)
dual_main_start = find_section(s2, '【雙條主屬性') or 20
dual_main = read_table_rows(s2, dual_main_start + 2, dual_main_start + 8)
def_start = find_section(s2, '【防禦力】') or 31
def_table = read_table_rows(s2, def_start + 2, def_start + 14)
hp_start = find_section(s2, '【HP上限') or 48
hpmp = read_table_rows(s2, hp_start + 2, s2.max_row)

pct_sections = read_percent_sections(s3)
fixed = read_fixed_stats(s3)

out = {
    'source': path.split('\\\\')[-1],
    'starLevelProb': star_level_prob,
    'lineCountProb': line_count_prob,
    'statPools': {'weapon': weapon_stats, 'armor': armor_stats},
    'valueTables': {
        'singleMain': single_main,
        'dualMain': dual_main,
        'def': def_table,
        'hpMp': hpmp,
        'watkPctGeneral': pct_sections.get('watkPctGeneral', []),
        'watkPctBoss': pct_sections.get('watkPctBoss', []),
        'matkPctGeneral': pct_sections.get('matkPctGeneral', pct_sections.get('watkPctGeneral', [])),
        'matkPctBoss': pct_sections.get('matkPctBoss', pct_sections.get('watkPctBoss', [])),
        'fixed': fixed,
    },
    'starLineTiers': 9,
    'extrapolationNote': '星火8、9級 = 星火7 + (星火7-星火6) × n，n=1,2',
}

print(json.dumps(out, ensure_ascii=False))
`;

const result = spawnSync('python', ['-X', 'utf8', '-c', py, xlsxPath], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(1);
}

const data = JSON.parse(result.stdout);

const js = `/**
 * 輪迴星火附加屬性數值表（自動產生）
 * 來源：${data.source}
 * ${data.extrapolationNote}
 * 產生：scripts/parse-bonus-stat-xlsx.mjs
 */

const BONUS_STAT_STAR_LEVEL_PROB = ${JSON.stringify(data.starLevelProb, null, 2)};

const BONUS_STAT_LINE_COUNT_PROB = ${JSON.stringify(data.lineCountProb, null, 2)};

const BONUS_STAT_STAT_POOL = ${JSON.stringify(data.statPools, null, 2)};

const BONUS_STAT_VALUE_TABLES = ${JSON.stringify(data.valueTables, null, 2)};

const BONUS_STAT_STAR_LINE_TIERS = ${data.starLineTiers};

/** 星火 stat 名稱 → 內部 key */
const BONUS_STAT_NAME_TO_KEY = {
  'STR': { key: 'str', table: 'singleMain' },
  'DEX': { key: 'dex', table: 'singleMain' },
  'INT': { key: 'int', table: 'singleMain' },
  'LUK': { key: 'luk', table: 'singleMain' },
  'STR+DEX': { key: 'strDex', table: 'dualMain', dual: ['str', 'dex'] },
  'STR+INT': { key: 'strInt', table: 'dualMain', dual: ['str', 'int'] },
  'STR+LUK': { key: 'strLuk', table: 'dualMain', dual: ['str', 'luk'] },
  'DEX+INT': { key: 'dexInt', table: 'dualMain', dual: ['dex', 'int'] },
  'DEX+LUK': { key: 'dexLuk', table: 'dualMain', dual: ['dex', 'luk'] },
  'INT+LUK': { key: 'intLuk', table: 'dualMain', dual: ['int', 'luk'] },
  '最大HP': { key: 'maxHp', table: 'hpMp', isPercent: false },
  '最大MP': { key: 'maxMp', table: 'hpMp', isPercent: false },
  '防禦力': { key: 'def', table: 'def' },
  '攻擊力': { key: 'watk', weaponPct: 'watkPct', armorFixedKey: 'armorAtkFlat' },
  '魔力': { key: 'matk', weaponPct: 'matkPct', armorFixedKey: 'armorAtkFlat' },
  '物理攻擊力': { key: 'watk', weaponPct: 'watkPct', armorFixedKey: 'armorAtkFlat' },
  '魔法攻擊力': { key: 'matk', weaponPct: 'matkPct', armorFixedKey: 'armorAtkFlat' },
  '物理攻擊力%': { key: 'watkPct', weaponPct: 'watkPct' },
  '魔法攻擊力%': { key: 'matkPct', weaponPct: 'matkPct' },
  '全屬性%': { key: 'allStat', table: 'fixed', fixedKey: 'allStatPct', isPercent: true },
  '攻擊BOSS怪物時傷害%': { key: 'bossDmg', table: 'fixed', fixedKey: 'bossDmgPct', isPercent: true },
  '傷害%': { key: 'dmg', table: 'fixed', fixedKey: 'dmgPct', isPercent: true },
  '移動速度': { key: 'speed', table: 'fixed', fixedKey: 'speed' },
  '跳躍力': { key: 'jump', table: 'fixed', fixedKey: 'jump' },
  '穿戴等級減少': { key: 'levelReduce', table: 'fixed', fixedKey: 'levelReduce' },
};

function bsParsePercentString(s) {
  if (typeof s === 'number') return s;
  const m = String(s).match(/^([\\d.]+)%?$/);
  return m ? parseFloat(m[1]) : 0;
}

function bsFindLevelRow(table, reqLevel) {
  if (!table?.length) return null;
  const lv = Math.max(0, Math.floor(Number(reqLevel) || 0));
  return table.find((row) => lv >= row.minLevel && lv <= row.maxLevel)
    || table[table.length - 1];
}

function bsGetTableValue(tableName, reqLevel, starTier, item, options = {}) {
  const tier = Math.max(1, Math.min(BONUS_STAT_STAR_LINE_TIERS, Math.floor(Number(starTier) || 1)));
  const idx = tier - 1;

  if (tableName === 'fixed') {
    const fk = options.fixedKey;
    const arr = BONUS_STAT_VALUE_TABLES.fixed?.[fk];
    return arr ? arr[idx] : 0;
  }

  if (tableName === 'watkPct' || tableName === 'matkPct') {
    const isBoss = options.isBossGear;
    const sub = tableName === 'watkPct'
      ? (isBoss ? 'watkPctBoss' : 'watkPctGeneral')
      : (isBoss ? 'matkPctBoss' : 'matkPctGeneral');
    const row = bsFindLevelRow(BONUS_STAT_VALUE_TABLES[sub], reqLevel);
    return row ? bsParsePercentString(row.values[idx]) : 0;
  }

  const row = bsFindLevelRow(BONUS_STAT_VALUE_TABLES[tableName], reqLevel);
  if (!row) return 0;
  const raw = row.values[idx];
  return typeof raw === 'string' ? bsParsePercentString(raw) : Number(raw) || 0;
}

function bsRollWeighted(entries) {
  const total = entries.reduce((s, e) => s + e.weight, 0);
  if (total <= 0) return entries[0]?.value;
  let r = Math.random() * total;
  for (const e of entries) {
    r -= e.weight;
    if (r <= 0) return e.value;
  }
  return entries[entries.length - 1]?.value;
}

function bsRollStarFireLevel(starFireType = 'enhanced') {
  const prob = BONUS_STAT_STAR_LEVEL_PROB[starFireType]
    || BONUS_STAT_STAR_LEVEL_PROB.enhanced;
  return bsRollWeighted([
    { value: 2, weight: prob[2] || 0 },
    { value: 3, weight: prob[3] || 0 },
    { value: 4, weight: prob[4] || 0 },
    { value: 5, weight: prob[5] || 0 },
  ]);
}

function bsRollLineCount(isBossGear) {
  const prob = isBossGear
    ? BONUS_STAT_LINE_COUNT_PROB.boss
    : BONUS_STAT_LINE_COUNT_PROB.general;
  return bsRollWeighted([
    { value: 1, weight: prob[0] || 0 },
    { value: 2, weight: prob[1] || 0 },
    { value: 3, weight: prob[2] || 0 },
    { value: 4, weight: prob[3] || 0 },
  ]);
}

/** 每條附加屬性詞條的星火 tier（1~9） */
function bsRollLineStarTier(starFireLevel, item, starFireType = 'enhanced') {
  let effective = starFireLevel;
  if (bsIsBossGearItem(item) && (starFireType === 'awakened' || starFireType === 'blackAwakened')) {
    effective += 2 + Math.floor(Math.random() * 3);
  }
  const maxTier = Math.min(BONUS_STAT_STAR_LINE_TIERS, Math.max(1, (effective - 1) * 2));
  return 1 + Math.floor(Math.random() * maxTier);
}

function bsIsBossGearItem(item) {
  return Boolean(item?.isBossGear);
}

function bsIsWeaponItem(item) {
  return item?.mainType === 'WEAPON' || item?.subType === 'weapon';
}

function bsGetStatPool(item) {
  return bsIsWeaponItem(item)
    ? BONUS_STAT_STAT_POOL.weapon
    : BONUS_STAT_STAT_POOL.armor;
}

function bsCanRollStat(statName, item) {
  const req = item?.reqLevel || 200;
  const isWeapon = bsIsWeaponItem(item);
  if (statName === '攻擊BOSS怪物時傷害%' && req < 90) return false;
  if ((statName === '攻擊力' || statName === '魔力') && !isWeapon && req < 60) return false;
  if (statName === '全屬性%' && req < 70) return false;
  return true;
}

function bsResolveStatLine(statName, starTier, item) {
  const meta = BONUS_STAT_NAME_TO_KEY[statName];
  if (!meta) return null;
  const reqLevel = item?.reqLevel || 200;
  const isBoss = bsIsBossGearItem(item);
  const isWeapon = bsIsWeaponItem(item);

  if (meta.dual) {
    const v = bsGetTableValue(meta.table, reqLevel, starTier, item);
    return {
      statId: meta.key,
      dual: meta.dual,
      value: v,
      isPercent: false,
      label: statName,
      starTier,
    };
  }

  if (meta.weaponPct && (statName === '攻擊力' || statName === '魔力' || meta.weaponPct)) {
    if (isWeapon) {
      const pctTable = meta.weaponPct;
      const v = bsGetTableValue(pctTable, reqLevel, starTier, item, { isBossGear: isBoss });
      return {
        statId: meta.key,
        value: v,
        isPercent: true,
        label: statName === '魔力' ? '魔法攻擊力' : '物理攻擊力',
        starTier,
      };
    }
    const v = bsGetTableValue('fixed', reqLevel, starTier, item, { fixedKey: meta.armorFixedKey || 'armorAtkFlat' });
    return {
      statId: meta.key,
      value: v,
      isPercent: false,
      label: statName === '魔力' ? '魔法攻擊力' : '物理攻擊力',
      starTier,
    };
  }

  if (meta.table === 'fixed') {
    const v = bsGetTableValue('fixed', reqLevel, starTier, item, { fixedKey: meta.fixedKey });
    return {
      statId: meta.key,
      value: v,
      isPercent: Boolean(meta.isPercent),
      label: statName.replace(/%$/, ''),
      starTier,
    };
  }

  if (meta.table === 'watkPct' || meta.table === 'matkPct') {
    const v = bsGetTableValue(meta.table, reqLevel, starTier, item, { isBossGear: isBoss });
    return { statId: meta.key, value: v, isPercent: true, label: statName.replace(/%$/, ''), starTier };
  }

  const v = bsGetTableValue(meta.table, reqLevel, starTier, item);
  const isPercent = meta.isPercent || statName.includes('%');
  return {
    statId: meta.key,
    value: v,
    isPercent,
    label: statName.replace(/%$/, ''),
    starTier,
  };
}

function bsExpandDualLine(line) {
  if (!line?.dual) return [line];
  return line.dual.map((statId) => ({
    statId,
    value: line.value,
    isPercent: false,
    label: statId.toUpperCase(),
  }));
}

function bsPickStatFromPool(pool, usedLabels, item) {
  const available = pool.filter(
    (name) => !usedLabels.has(name) && bsCanRollStat(name, item)
  );
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function bsRollBonusStatLines(item, starFireType = 'enhanced', starFireLevel = null) {
  const sfLevel = starFireLevel ?? bsRollStarFireLevel(starFireType);
  const lineCount = bsRollLineCount(bsIsBossGearItem(item));
  const pool = bsGetStatPool(item);
  const used = new Set();
  const lines = [];

  for (let i = 0; i < lineCount; i += 1) {
    const statName = bsPickStatFromPool(pool, used, item);
    if (!statName) break;
    used.add(statName);
    const tier = bsRollLineStarTier(sfLevel, item, starFireType);
    const rolled = bsResolveStatLine(statName, tier, item);
    if (!rolled) continue;
    bsExpandDualLine(rolled).forEach((ln) => lines.push({ ...ln, starTier: tier }));
  }
  return { starFireLevel: sfLevel, starFireType, lines };
}
`;

fs.writeFileSync(OUT_JS, js, 'utf8');
console.log('Wrote', OUT_JS);
console.log('Star tiers:', data.starLineTiers, '| Tables:', Object.keys(data.valueTables));
