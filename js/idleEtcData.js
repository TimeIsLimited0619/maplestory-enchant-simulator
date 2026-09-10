/**
 * 其他欄資料庫（名稱／ICON／物品描述）。之後可直接改這份清單。
 */
const IDLE_ETC_DATABASE = [
  {
    id: 'idle-ticket-timed',
    name: '計時副本入場券',
    icon: 'images/ETCicon/04001904.png',
    desc: '進入【計時副本】所需的入場券。擊殺野外首領後有機會掉落。',
  },
  {
    id: 'idle-ticket-normal',
    name: '地下城入場券',
    icon: 'images/ETCicon/01000002.png',
    desc: '進入【地下城】所需的入場券。擊殺野外首領後有機會掉落。',
  },
  {
    id: 'idle-ticket-damage',
    name: '傷害副本入場券',
    icon: 'images/ETCicon/01000003.png',
    desc: '進入【傷害副本】所需的入場券。擊殺野外首領後有機會掉落。',
  },
  {
    id: 'idle-ticket-boss',
    name: 'BOSS 副本入場券',
    icon: 'images/ETCicon/01000001.png',
    desc: '進入【BOSS 副本】所需的入場券。擊殺野外首領後有機會掉落。',
  },
  {
    id: 'job_change_ticket',
    name: '自由轉職硬幣',
    icon: 'images/ETCicon/04310086.png',
    desc: '進行【自由轉職】時所需的道具。可於XXXXXX途徑獲得。',
  },
  {
    id: 'idle-etc-sample-mushroom',
    name: '橘色菇菇孢子（範例）',
    icon: 'images/ETCicon/01000001.png',
    desc: '這是其他欄 tooltip 範例。之後可改名稱、ICON 路徑與這段描述文字。',
  },
  { id: 'snow', name: '永恆的雪花', icon: 'images/ETCicon/04031875.png', desc: '貓谷強化素材。' },
  { id: 'taichu', name: '太初之力', icon: 'images/ETCicon/04021022.png', desc: '貓谷強化／勳章／潛能素材。' },
  { id: 'saint', name: '被封印的聖者之石', icon: 'images/ETCicon/04020012.png', desc: '貓谷強化素材。' },
  { id: 'meowcoin', name: '喵喵幣', icon: 'images/ETCicon/04310444.png', desc: '貓谷強化素材。' },
  { id: 'nekopow', name: '喵喵之力', icon: 'images/ETCicon/04036897.png', desc: '貓谷強化素材。' },
  { id: 'doom', name: '去除厄運的符咒', icon: 'images/ETCicon/04032225.png', desc: '貓谷副手強化素材。' },
  { id: 'sun', name: '太陽火花', icon: 'images/ETCicon/04033176.png', desc: '貓谷米特拉強化素材。' },
  { id: 'darkpcs', name: '漆黑粉塵', icon: 'images/ETCicon/04034746.png', desc: '漆黑裝強化素材，可通過分解漆黑裝備獲取。' },
  { id: 'Nohimepcs', name: '濃姬粉塵', icon: 'images/ETCicon/04034749.png', desc: '濃姬副武強化素材，可通過分解濃姬裝備獲取。' },
  { id: 'eternalpcs', name: '永恆粉塵', icon: 'images/ETCicon/04034747.png', desc: '永恆裝備強化素材，可通過分解永恆裝備獲取。' },
  { id: 'arcanepcs', name: '神祕粉塵', icon: 'images/ETCicon/04034748.png', desc: '神祕裝備強化素材，可通過分解神祕裝備獲取。' },
  { id: 'awakened', name: '覺醒碎片', icon: 'images/bonusStat/awakedata/awake.png', desc: '高階裝備星火強化的素材。' },
  { id: 'arcanecoin', name: '神秘強化幣', icon: 'images/ETCicon/04310218.png', desc: '神秘裝備強化素材。' },
  { id: 'maple_heart_warrior', name: '勇氣之心', icon: 'images/ETCicon/04001226.png', desc: '楓葉之心(劍士用)進階材料，可通過擊敗巴洛谷副本獲取。' },
  { id: 'maple_heart_magician', name: '智慧之心', icon: 'images/ETCicon/04001227.png', desc: '楓葉之心(法師用)進階材料，可通過擊敗巴洛谷副本獲取。' },
  { id: 'green_pendant', name: '綠色吊墜', icon: 'images/ETCicon/04000657.png', desc: '影武者蒙面進階材料，可通過地下城副本獲取。' },
  { id: 'blue_pendant', name: '藍色吊墜', icon: 'images/ETCicon/04000656.png', desc: '影武者蒙面進階材料，可通過地下城副本獲取。' },
  { id: 'red_pendant', name: '紅色吊墜', icon: 'images/ETCicon/04000655.png', desc: '影武者蒙面進階材料，可通過地下城副本獲取。' },
  { id: 'yellow_pendant', name: '黃色吊墜', icon: 'images/ETCicon/04000658.png', desc: '影武者蒙面進階材料，可通過地下城副本獲取。' },
  { id: 'purple_pendant', name: '紫色吊墜', icon: 'images/ETCicon/04000654.png', desc: '影武者蒙面進階材料，可通過地下城副本獲取。' },
  { id: 'black_dragon_iron', name: '黑龍鐵塊', icon: 'images/ETCicon/02432488.png', desc: '滅龍騎士進階材料，可通過材料副本獲取。' },
  { id: 'black_dragon_soul', name: '暗黑龍王的靈魂', icon: 'images/ETCicon/02435366.png', desc: '滅龍騎士進階材料，可通過擊敗暗黑龍王獲取。' },
  { id: 'cyclops_eye', name: '精密機械材料', icon: 'images/ETCicon/04310407.png', desc: '獨眼巨人進階材料，可通過擊敗殘暴炎魔獲取。' },
  { id: 'spell_trace', name: '咒文的痕跡', icon: 'images/ETCicon/04001832.png', desc: '卷軸強化所需材料，可通過狩獵怪物或分解卷軸獲得。' },
  { id: 'Fearless_pcs', name: '蓋世無雙碎片', icon: 'images/ETCicon/04020013.png', desc: '蓋世無雙進階材料，可通過分解中心獲取。' },
  { id: 'tyrants_coin', name: '暴君硬幣', icon: 'images/ETCicon/04310059.png', desc: '暴君裝備材料，可通過分解中心或擊敗梅格耐斯獲取。' },
  { id: 'tinkerer_chest', name: '意志盒', icon: 'images/ETCicon/04033667.png', desc: '楓之谷堅韌意志進階材料，可通過分解中心或擊敗拉圖斯獲取。' },
  { id: '140armor_pcs', name: '黑色守護的碎片', icon: 'images/ETCicon/02434589.png', desc: '附著西格諾斯守護騎士團力量的碎片。收集5個可以製作Lv. 140女皇裝備' },
  { id: '140weapon_pcs', name: '黑色破壞的碎片', icon: 'images/ETCicon/02434588.png', desc: '附著西格諾斯守護騎士團力量的碎片。收集15個可以製作Lv. 140女皇武器' },
  { id: 'Captivating_Fragment', name: '魅惑的碎片', icon: 'images/ETCicon/02630594.png', desc: '濃姬副手製作材料，可通過擊敗濃姬獲取。' },
  { id: '02434585', name: '嘲弄的碎片', icon: 'images/ETCicon/02434585.png', desc: '嘲弄的碎片，可通過擊敗比艾樂和班班以及分解深淵衣褲獲取。' },
  { id: '02434586', name: '吶喊的碎片', icon: 'images/ETCicon/02434586.png', desc: '懷疑的碎片，可通過擊敗比血腥女皇以及分解深淵帽子獲取。' },
  { id: '02434587', name: '破滅的碎片', icon: 'images/ETCicon/02434587.png', desc: '懷疑的碎片，可通過擊敗貝倫以及分解深淵武器獲取。' },
];

const IdleEtcStore = {
  list() {
    return IDLE_ETC_DATABASE.slice();
  },

  get(id) {
    const key = String(id || '');
    return IDLE_ETC_DATABASE.find((row) => row.id === key) || null;
  },

  search(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return this.list();
    return this.list().filter((row) => (
      row.name.toLowerCase().includes(q) || row.id.toLowerCase().includes(q)
    ));
  },
};

if (typeof window !== 'undefined') {
  window.IDLE_ETC_DATABASE = IDLE_ETC_DATABASE;
  window.IdleEtcStore = IdleEtcStore;
  window.IdleEtcStore = IdleEtcStore;
}
