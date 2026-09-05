/**
 * 放置地圖：各等級區間張數由 GM 決定，不再一等一張。
 * 預設每個地區 4 張，角色等級區間見 REGIONS。
 * 怪物圖：npm run import:mob（IDLE_MOB_DATA），icon 為 7 碼。
 */
const IdleHuntProgressMaps = (() => {
  const SMALL_KILLS = 100;
  const MAPS_PER_BAND = 4;
  const LEVEL_CAP = 300;

  const REGIONS = [
    [1, 10, 'mapleisland', '楓葉島'],
    [11, 20, 'henesys', '弓箭手村'],
    [21, 30, 'perion', '勇士之村'],
    [31, 40, 'ellinia', '魔法森林'],
    [41, 50, 'kerning', '墮落城市'],
    [51, 60, 'sleepywood', '林中之城'],
    [61, 70, 'elnath', '冰原雪域'],
    [71, 80, 'aqua', '水世界'],
    [81, 90, 'orbis', '天空之城'],
    [91, 100, 'ludibrium', '玩具城'],
    [101, 110, 'omega', '地球防禦本部'],
    [111, 120, 'leafre', '神木村'],
    [121, 130, 'muLung', '武陵'],
    [131, 140, 'ariant', '納希沙漠'],
    [141, 150, 'magatia', '瑪迦提亞城'],
    [151, 160, 'ellin', '艾靈森林'],
    [161, 170, 'temple', '時間神殿'],
    [171, 180, 'koreanFolk', '童話村'],
    [181, 190, 'goldTemple', '黃金寺廟'],
    [191, 200, 'helisium', '赫里希安'],
    [201, 210, 'gateToFuture', '未來之門'],
    [211, 220, 'pantheon', '萬神殿'],
    [221, 230, 'arcana', '阿爾卡那'],
    [231, 240, 'morass', '魔菈斯'],
    [241, 250, 'esfera', '艾斯佩拉'],
    [251, 260, 'moonBridge', '月之橋'],
    [261, 270, 'labyrinth', '苦痛迷宮'],
    [271, 280, 'limen', '利曼'],
    [281, 290, 'cernium', '塞爾尼溫'],
    [291, 300, 'hotelArcus', '阿爾克斯'],
  ];

  const ART_ALIAS = {
    1: 'mapleisland-10000',
    2: 'mapleisland-10001',
    3: 'victoria-10101',
    4: 'victoria-10102',
    5: 'victoria-102020000',
    6: 'victoria-103030000',
    7: 'victoria-120010000',
    8: 'victoria-105030000',
    9: 'victoria-105100100',
  };

  /** [名稱, iconId] 依等級大致由低到高，超過長度會循環並加世代後綴 */
  const MOBS = [
    ['嫩寶', '0100100'],
    ['藍寶', '0100101'],
    ['紅寶', '0130101'],
    ['蘑菇仔', '0120100'],
    ['木妖', '0110100'],
    ['綠水靈', '0210100'],
    ['綠菇菇', '1110100'],
    ['刺蘑菇', '2110100'],
    ['藍菇菇', '2220100'],
    ['殭屍蘑菇', '2230100'],
    ['斧木妖', '1140100'],
    ['三眼木妖', '1130100'],
    ['豬', '1210100'],
    ['緞帶豬', '1210101'],
    ['野豬', '3210100'],
    ['火野豬', '3230100'],
    ['石球', '4230100'],
    ['小石人', '5120000'],
    ['木馬', '5130100'],
    ['白狼', '5140000'],
    ['猴子', '5100000'],
    ['小幽靈', '3230200'],
    ['銅甲石人', '4130100'],
    ['鐵甲石人', '4230101'],
    ['蝙蝠魔', '2230102'],
    ['小雪吉拉', '8130100'],
    ['白雪人', '8140000'],
    ['雪吉拉', '8150000'],
    ['企鵝王手下', '8210000'],
    ['海賊', '8190000'],
    ['克雷塞爾', '7130000'],
    ['火焰野豬', '7120100'],
    ['狼人', '5100004'],
    ['殭屍', '5130103'],
    ['骷髏士兵', '5150001'],
    ['骷髏警衛兵', '5150000'],
    ['小石龍', '8144000'],
    ['龍族雜兵', '8190003'],
    ['玩具黃鴨', '3230300'],
    ['發條老鼠', '3230302'],
    ['機器人A', '4230106'],
    ['機器人B', '4230107'],
    ['外星雞', '9400000'],
    ['外星章魚', '9400002'],
    ['半人馬', '9400543'],
    ['黑暗半人馬', '9400544'],
    ['骷髏犬', '8190004'],
    ['火焰骷髏', '7130010'],
    ['冰石人', '8210001'],
    ['沙漠土龍', '2100103'],
    ['木乃伊', '2100108'],
    ['眼鏡蛇', '2100105'],
    ['砂鼠', '2100100'],
    ['進化精靈', '8200000'],
    ['時間之眼', '8200004'],
    ['神木哈士奇', '8140500'],
    ['龍族戰士', '8150200'],
    ['骷髏法師', '5150002'],
    ['黑暗石人', '7120106'],
    ['精英綠水靈', '0210101'],
  ];

  const BOSSES = [
    ['菇菇王', '02220000'],
    ['藍蘑菇王', '02220001'],
    ['史萊姆王', '05220000'],
    ['樹妖王', '03220000'],
    ['殭屍蘑菇王', '06300005'],
    ['浮士德', '05220002'],
    ['巴洛古', '06130101'],
    ['拉圖斯', '08500001'],
    ['殘暴炎魔', '08800002'],
    ['闇黑龍王', '08810018'],
    ['皮卡啾', '08820001'],
    ['西格諾斯', '08850011'],
    ['凡雷恩', '08840000'],
    ['希拉', '08870000'],
    ['麥格納斯', '08880000'],
    ['史烏', '08880100'],
    ['露希妲', '08880141'],
    ['威爾', '08880301'],
    ['戴斯克', '08880405'],
    ['真希拉', '08880503'],
    ['黑魔法師', '08880600'],
    ['賽蓮', '08644650'],
    ['卡洛斯', '08881000'],
    ['卡林', '08880900'],
    ['守護天使綠水靈', '08880020'],
    ['頓凱爾', '08644600'],
    ['受選者', '08880700'],
    ['覺醒希拉', '08880510'],
    ['至暗魔晶', '08880620'],
    ['監視者', '08880800'],
  ];

  function padIcon(id) {
    const digits = String(id || '').replace(/\D/g, '');
    return digits.padStart(7, '0').slice(-7);
  }

  function regionOf(level) {
    return REGIONS.find(([a, b]) => level >= a && level <= b)
      || REGIONS[REGIONS.length - 1];
  }

  function pick(list, n) {
    const i = (Math.max(1, n) - 1) % list.length;
    const gen = Math.floor((Math.max(1, n) - 1) / list.length);
    const [name, icon] = list[i];
    return {
      name: gen === 0 ? name : `${name}·${gen + 1}`,
      iconId: padIcon(icon),
    };
  }

  function makeMap(seqOrOpts) {
    if (seqOrOpts && typeof seqOrOpts === 'object') {
      return buildOne(seqOrOpts);
    }
    const seq = Math.floor(Number(seqOrOpts) || 0);
    if (seq < 1) return null;
    const regionIdx = Math.floor((seq - 1) / MAPS_PER_BAND);
    const slot = (seq - 1) % MAPS_PER_BAND;
    const region = REGIONS[regionIdx];
    if (!region) return null;
    const [min, max, regionId, regionName] = region;
    return buildOne({ seq, slot, min, max, regionId, regionName });
  }

  function buildOne({ seq, slot, min, max, regionId, regionName, bandKey, name }) {
    const span = Math.max(1, MAPS_PER_BAND - 1);
    const t = Number(slot) || 0;
    const scale = Math.max(1, Math.round(min + ((max - min) * t) / span));
    const mob = pick(MOBS, seq);
    const boss = pick(BOSSES, seq);
    const monsterHp = Math.max(12, Math.round(12 * (1.085 ** (scale - 1))));
    const bossHp = Math.max(monsterHp * 18, Math.round(monsterHp * (18 + scale * 0.15)));
    return {
      regionId,
      regionName,
      name: name || `第 ${t + 1} 狩獵場`,
      mapId: String(seq),
      mapIndex: seq,
      unlockLevel: min,
      dropMin: min,
      dropMax: max,
      artId: ART_ALIAS[seq] || '',
      bandKey: bandKey || regionId,
      mobName: mob.name,
      mobIcon: mob.iconId,
      bossName: boss.name,
      bossIcon: boss.iconId,
      monsterHp,
      bossHp,
      killExp: scale,
      killGold: Math.max(1, Math.floor(scale / 2)),
      bossKillExp: scale * 20,
      bossKillGold: Math.max(5, scale * 4),
      mobDrops: [],
      bossDrops: [],
      drops: [],
    };
  }

  function defaultBands() {
    return REGIONS.map(([min, max, id, name]) => ({ id, min, max, name }));
  }

  function build() {
    const maps = [];
    let seq = 1;
    REGIONS.forEach(([min, max, regionId, regionName]) => {
      for (let slot = 0; slot < MAPS_PER_BAND; slot += 1) {
        maps.push(makeMap({ seq, slot, min, max, regionId, regionName, bandKey: regionId }));
        seq += 1;
      }
    });
    return maps;
  }

  return {
    SMALL_KILLS,
    MAPS_PER_BAND,
    LEVEL_CAP,
    MAP_COUNT: REGIONS.length * MAPS_PER_BAND,
    REGIONS,
    MOBS,
    BOSSES,
    padIcon,
    makeMap,
    defaultBands,
    build,
    artFolders() {
      return [...new Set(Object.values(ART_ALIAS).filter(Boolean))];
    },
  };
})();

if (typeof window !== 'undefined') window.IdleHuntProgressMaps = IdleHuntProgressMaps;
