/**
 * GMS 1~300 升等所需經驗（該等升到下一等）。
 * 來源：https://maplestorywiki.net/w/Experience/Leveling_Tables （GMS）
 * index = 等級；300 等為 0。
 */
const MapleExpTable = (() => {
  const EXP_TO_NEXT = JSON.parse('[0,15,34,57,92,135,372,560,840,1242,1242,1242,1242,1242,1242,1490,1788,2145,2574,3088,3705,4446,5335,6402,7682,9218,11061,13273,15927,19112,19112,19112,19112,19112,19112,22934,27520,33024,39628,47553,51357,55465,59902,64694,69869,75458,81494,88013,95054,102658,110870,119739,129318,139663,150836,162902,175934,190008,205208,221624,221624,221624,221624,221624,221624,238245,256113,275321,295970,318167,342029,367681,395257,424901,456768,488741,522952,559558,598727,640637,685481,733464,784806,839742,898523,961419,1028718,1100728,1177778,1260222,1342136,1429374,1522283,1621231,1726611,1838840,1958364,2085657,2221224,2365603,2365603,2365603,2365603,2365603,2365603,2519367,2683125,2857528,3043267,3241079,3451749,3676112,3915059,4169537,4440556,4729192,5036589,5363967,5712624,6083944,6479400,6900561,7349097,7826788,8335529,8877338,9454364,10068897,10723375,11420394,12162719,12953295,13795259,14691950,15646926,16663976,17747134,18900697,20129242,21437642,22777494,24201087,25713654,27320757,29028304,30842573,32770233,34818372,36994520,39306677,41763344,44373553,47146900,50093581,53224429,56550955,60085389,63840725,67830770,72070193,76574580,81360491,86445521,91848366,97588888,103688193,110168705,117054249,124370139,132143272,138750435,145687956,152972353,160620970,168652018,177084618,185938848,195235790,204997579,215247457,226009829,237310320,249175836,261634627,274716358,288452175,302874783,318018522,333919448,350615420,368146191,386553500,405881175,426175233,447483994,469858193,493351102,518018657,543919589,571115568,2207026470,2471869646,2768494003,3100713283,3472798876,3889534741,4356278909,4879032378,5464516263,6120258214,7956335678,8831532602,9803001188,10881331318,12078277762,15701761090,17114919588,18655262350,20334235961,22164317197,28813612356,30830565220,32988704785,35297914119,37768768107,49099398539,52536356436,56213901386,60148874483,64359295696,83667084404,86177096936,88762409844,91425282139,94168040603,122418452783,126091006366,129873736556,133769948652,137783047111,179117961244,184491500081,190026245083,195727032435,201598843408,262078496430,269940851322,278039076861,286380249166,294971656640,442457484960,455731209508,469403145793,483485240166,497989797370,512929491291,528317376029,544166897309,560491904228,577306661354,1731919984062,1749239183902,1766731575741,1784398891498,1802242880412,2342915744535,2366344901980,2390008350999,2413908434508,2438047518853,5412465491853,5466590146771,5521256048238,5576468608720,5632233294807,11377111255510,12514822381061,13766304619167,15142935081083,16657228589191,33647601750165,37012361925181,40713598117699,44784957929468,49263453722414,99512176519276,109463394171203,120409733588323,132450706947155,145695777641870,294305470836577,323736017920234,356109619712257,391720581683483,430892639851831,870403132500699,957443445750769,1053187790325845,1158506569358425,1737759854037637,0]');

  function expToNext(level) {
    const lv = Math.max(1, Math.min(300, Math.floor(Number(level) || 1)));
    return EXP_TO_NEXT[lv] || 0;
  }

  function killExpRate(level) {
    const lv = Math.max(1, Math.min(300, Math.floor(Number(level) || 1)));
    if (lv <= 100) return 0.05;
    if (lv <= 200) return 0.01;
    if (lv <= 250) return 0.001;
    if (lv <= 270) return 0.0005;
    if (lv <= 280) return 0.00025;
    if (lv <= 290) return 0.00005;
    return 0.00001;
  }

  /** 區間等級中位數（例：1~5→3、6~10→8） */
  function bandMedianLevel(minLevel, maxLevel) {
    const min = Math.max(1, Math.floor(Number(minLevel) || 1));
    const max = Math.max(min, Math.floor(Number(maxLevel) || min));
    return Math.floor((min + max) / 2);
  }

  /**
   * 角色 vs 怪物等差最終倍率（MapleStory Wiki Experience）
   * diff = 角色等級 − 怪物等級（正＝角色較高）
   */
  function levelDiffExpMultiplier(playerLevel, mobLevel) {
    const pl = Math.max(1, Math.min(300, Math.floor(Number(playerLevel) || 1)));
    const ml = Math.max(1, Math.min(300, Math.floor(Number(mobLevel) || 1)));
    const diff = pl - ml;
    const ad = Math.abs(diff);

    if (ad <= 1) return 1.2;
    if (ad <= 4) return 1.1;
    if (ad <= 9) return 1.05;
    if (ad === 10) return 1.0;

    if (diff >= 11 && diff <= 20) {
      return 0.8 - (diff - 11) * (0.04 / 9);
    }
    if (diff >= 21 && diff <= 40) {
      return 0.7 - (diff - 21) * (0.19 / 19);
    }
    if (diff <= -11 && diff >= -20) {
      return 0.8 - (-diff - 11) * (0.09 / 9);
    }
    if (diff <= -21 && diff >= -40) {
      return 0.70 - (-diff - 21) * (0.60 / 19);
    }
    if (diff > 40) return 0.70;
    if (diff < -40) return 0.10;
    return 1.0;
  }

  /** 劍士基準防禦（等級 → 基準值） */
  const WARRIOR_BASELINE_DEF = {
    10: 54, 12: 57, 15: 83, 20: 106, 22: 109, 25: 129, 30: 154, 35: 179, 40: 203,
    47: 208, 50: 261, 55: 267, 60: 305, 65: 308, 70: 359, 75: 356, 80: 382, 85: 388,
    90: 440, 95: 446, 100: 494,
  };

  /** 法師基準防禦（等級 → 基準值） */
  const MAGE_BASELINE_DEF = {
    8: 25, 10: 31, 13: 40, 15: 49, 18: 54, 20: 56, 25: 60, 28: 64, 30: 75, 33: 91,
    35: 98, 40: 99, 48: 107, 50: 131, 55: 134, 58: 142, 60: 159, 65: 162, 68: 170,
    70: 184, 75: 190, 78: 198, 80: 212, 85: 218, 88: 226, 90: 240, 95: 246, 98: 254,
    100: 266,
  };

  function interpBaselineDef(table, level) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
    if (lv <= keys[0]) return table[keys[0]];
    if (lv >= keys[keys.length - 1]) return table[keys[keys.length - 1]];
    for (let i = 0; i < keys.length - 1; i++) {
      const lo = keys[i];
      const hi = keys[i + 1];
      if (lv >= lo && lv <= hi) {
        const t = (lv - lo) / (hi - lo);
        return Math.round(table[lo] * (1 - t) + table[hi] * t);
      }
    }
    return table[keys[keys.length - 1]];
  }

  function baselineDefenseFor(level, baselineKind) {
    const table = baselineKind === 'mage' ? MAGE_BASELINE_DEF : WARRIOR_BASELINE_DEF;
    return interpBaselineDef(table, level);
  }

  function physCorrection(stats, isWarrior) {
    const str = Math.max(0, Number(stats?.str) || 0);
    const dex = Math.max(0, Number(stats?.dex) || 0);
    const int = Math.max(0, Number(stats?.int) || 0);
    const luk = Math.max(0, Number(stats?.luk) || 0);
    if (isWarrior) {
      return str / 2800 + dex / 3200 + int / 7200 + luk / 3200;
    }
    return str / 2000 + dex / 2800 + int / 7200 + luk / 2800;
  }

  /**
   * 官方公式的屬性修正在「現代高四圍」會線性暴衝（STR 4000 → corr≈1.4）。
   * 該公式對應年代四圍遠低於此；放置地圖又直接用 flat 基礎傷害而非 物攻²。
   * 將修正值硬上限，避免防禦減傷遠超預期。
   */
  const PHYS_CORR_CAP = 0.4;
  /** 物防相對基礎傷害的減傷上限（技能 % 減傷另算） */
  const DEF_MITIGATION_CAP = 0.72;

  function cappedPhysCorrection(stats, isWarrior) {
    return Math.min(PHYS_CORR_CAP, physCorrection(stats, isWarrior));
  }

  /**
   * 怪物打玩家：官方物理減傷公式（物理／魔法統一），並針對放置 flat 傷害校正。
   * baseDmg = 地圖設定的基礎傷害（非物攻²）
   * 物防 ≥ 基準：base − 物防×A − (物防−基準)×B
   * 物防 < 基準：base − 物防×A（不套用負減傷懲罰，避免地圖基礎傷害被放大）
   * opts: { str, dex, int, luk, isWarrior, baselineKind: 'warrior'|'mage' }
   */
  function mobHitTakenDamage(baseDmg, defense, mobLevel, playerLevel, opts) {
    const base = Math.max(0, Math.floor(Number(baseDmg) || 0));
    if (!(base > 0)) return 0;
    const pdd = Math.max(0, Math.floor(Number(defense) || 0));
    const pl = Math.max(1, Math.min(300, Math.floor(Number(playerLevel) || 1)));
    const ctx = (opts && typeof opts === 'object') ? opts : {};
    const isWarrior = !!ctx.isWarrior;
    const baselineKind = ctx.baselineKind === 'mage' ? 'mage' : 'warrior';
    const baseline = baselineDefenseFor(pl, baselineKind);
    const corr = cappedPhysCorrection(ctx, isWarrior);
    const A = corr + 0.28;
    let reduction = pdd * A;
    if (pdd >= baseline) {
      const B = corr * 28 / 45 + pl * 7 / 13000 + 0.196;
      reduction += (pdd - baseline) * B;
    }
    // 地圖基礎傷害模式：減傷不低於 0，且不超過基礎傷害的一定比例
    reduction = Math.max(0, reduction);
    reduction = Math.min(reduction, base * DEF_MITIGATION_CAP);
    return Math.max(1, Math.floor(base - reduction));
  }

  return {
    EXP_TO_NEXT,
    expToNext,
    killExpRate,
    bandMedianLevel,
    levelDiffExpMultiplier,
    WARRIOR_BASELINE_DEF,
    MAGE_BASELINE_DEF,
    baselineDefenseFor,
    physCorrection,
    cappedPhysCorrection,
    PHYS_CORR_CAP,
    DEF_MITIGATION_CAP,
    mobHitTakenDamage,
  };
})();

if (typeof window !== 'undefined') window.MapleExpTable = MapleExpTable;
