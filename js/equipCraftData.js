/**
 * 裝備製作配方（直接編輯此檔即可）
 *
 * ── 裝備進階 EQUIP_CRAFT_ADVANCE_LINES ──
 *   iconItemId  進階線圖示（填該線最終裝備 itemId）
 *   recipes[]   線內配方（由低到高排列較直覺）
 *     output      產出裝備 itemId（在原欄位轉換，並繼承基底強化）
 *     baseEquip   需消耗的裝備 itemId（優先選強化進度較高者）
 *     baseCount   消耗件數（預設 1；多件時其餘不繼承）
 *     materials   ETC 材料：{ etcId: 數量, ... }
 *     meso        楓幣
 *   ※ 進階會繼承星力／卷軸／潛能等（同蟾蜍鐵鎚欄位，潛能不降等）
 *
 * ── 裝備製作 EQUIP_CRAFT_MAKE_LIST ──
 *   A) 大分類（共用材料，多職業變體）：
 *     name / iconItemId
 *     categories[]
 *       name / iconItemId
 *       materials / meso   ← 該部位共用
 *       variants[]         ← 各職業產出
 *         label / output
 *
 *   B) 單筆配方（無大分類）：
 *     label / output / materials / meso
 */

const EQUIP_CRAFT_ADVANCE_LINES = [

  // 楓葉之心

  {
    id: 'maple_heart',
    name: '楓葉之心',
    iconItemId: '01122123',
    recipes: [
      {
        id: 'adv_maple_heart_1',
        label: '封印的楓葉之心(物攻) Lv.11',
        output: '01122024',
        baseEquip: '01122020',
        baseCount: 1,
        materials: { nekopow: 10, meowcoin: 10 },
        meso: 30000,
      },
      {
        id: 'adv_maple_heart_2',
        label: '封印的楓葉之心(魔攻) Lv.11',
        output: '01122025',
        baseEquip: '01122020',
        baseCount: 1,
        materials: { nekopow: 10, meowcoin: 10 },
        meso: 30000,
      },
      {
        id: 'adv_maple_heart_3',
        label: '甦醒的楓葉之心(物攻) Lv.31',
        output: '01122029',
        baseEquip: '01122024',
        baseCount: 1,
        materials: { nekopow: 20, meowcoin: 20 },
        meso: 100000,
      },
      {
        id: 'adv_maple_heart_4',
        label: '甦醒的楓葉之心(魔攻) Lv.31',
        output: '01122030',
        baseEquip: '01122025',
        baseCount: 1,
        materials: { nekopow: 20, meowcoin: 20 },
        meso: 100000,
      },
      {
        id: 'adv_maple_heart_5',
        label: '覺醒的楓葉之心(物攻) Lv.71',
        output: '01122034',
        baseEquip: '01122029',
        baseCount: 1,
        materials: { nekopow: 50, meowcoin: 50 },
        meso: 250000,
      },
      {
        id: 'adv_maple_heart_6',
        label: '覺醒的楓葉之心(魔攻) Lv.71',
        output: '01122035',
        baseEquip: '01122029',
        baseCount: 1,
        materials: { nekopow: 50, meowcoin: 50 },
        meso: 250000,
      },
      {
        id: 'adv_maple_heart_7',
        label: '真. 楓葉之心(物攻) Lv.71',
        output: '01122122',
        baseEquip: '01122034',
        baseCount: 1,
        materials: { maple_heart_warrior: 1, nekopow: 100, meowcoin: 100 },
        meso: 500000,
      },
      {
        id: 'adv_maple_heart_8',
        label: '真. 楓葉之心(魔攻) Lv.71',
        output: '01122123',
        baseEquip: '01122035',
        baseCount: 1,
        materials: { maple_heart_magician: 1, nekopow: 100, meowcoin: 100 },
        meso: 500000,
      },
    ],
  },

  // 影武者蒙面

  {
    id: 'Kage Mask',
    name: '影武者蒙面',
    iconItemId: '01012191',
    recipes: [
      {
        id: 'kage_mask_1',
        label: '綠色蒙面 Lv.30',
        output: '01012188',
        baseEquip: '01012187',
        baseCount: 1,
        materials: { yellow_pendant: 1, },
        meso: 200000,
      },
      {
        id: 'kage_mask_2',
        label: '藍色蒙面 Lv.55',
        output: '01012189',
        baseEquip: '01012188',
        baseCount: 1,
        materials: { green_pendant: 3, },
        meso: 1000000,
      },
      {
        id: 'kage_mask_3',
        label: '紫色蒙面 Lv.70',
        output: '01012190',
        baseEquip: '01012189',
        baseCount: 1,
        materials: { blue_pendant: 5, },
        meso: 5000000,
      },
      {
        id: 'kage_mask_4',
        label: '影武者蒙面 Lv.100',
        output: '01012191',
        baseEquip: '01012190',
        baseCount: 1,
        materials: { purple_pendant: 10, },
        meso: 20000000,
      },
    ],
  },

  //神話耳環
  {
    id: 'mythic_earring',
    name: '被遺忘的神話耳環',
    iconItemId: '01032219',
    recipes: [
      {
        id: 'mythic_earring_1',
        label: '神話耳環復原第1階段 Lv.30',
        output: '01032206',
        baseEquip: '01032205',
        baseCount: 1,
        meso: 1000000,
      },
      {
        id: 'mythic_earring_2',
        label: '神話耳環復原第2階段 Lv.50',
        output: '01032207',
        baseEquip: '01032206',
        baseCount: 1,
        meso: 5000000,
      },
      {
        id: 'mythic_earring_3',
        label: '神話耳環復原第3階段 Lv.70',
        output: '01032208',
        baseEquip: '01032207',
        baseCount: 1,
        meso: 20000000,
      },
      {
        id: 'mythic_earring_4',
        label: '神話耳環復原第4階段 Lv.90',
        output: '01032209',
        baseEquip: '01032208',
        baseCount: 1,
        meso: 50000000,
      },
      {
        id: 'mythic_earring_5',
        label: '被遺忘的神話耳環 Lv.100',
        output: '01032219',
        baseEquip: '01032209',
        baseCount: 1,
        meso: 100000000,
      },
    ],
  },

  //獨眼巨人

  {
    id: 'cyclops',
    name: '真獨眼巨人眼',
    iconItemId: '01022215',
    recipes: [
      {
        id: 'cyclops_1',
        label: '獨眼巨人進化:I Lv.50',
        output: '01022190',
        baseEquip: '01022189',
        baseCount: 1,
        materials: { cyclops_eye: 1 },
        meso: 5000000,
      },
      {
        id: 'cyclops_2',
        label: '獨眼巨人進化:II Lv.50',
        output: '01022191',
        baseEquip: '01022190',
        baseCount: 1,
        materials: { cyclops_eye: 2 },
        meso: 10000000,
      },
      {
        id: 'cyclops_3',
        label: '獨眼巨人進化:III Lv.50',
        output: '01022192',
        baseEquip: '01022191',
        baseCount: 1,
        materials: { cyclops_eye: 3 },
        meso: 15000000,
      },
      {
        id: 'cyclops_4',
        label: '覺醒的獨眼巨人眼 Lv.50',
        output: '01022193',
        baseEquip: '01022192',
        baseCount: 1,
        materials: { cyclops_eye: 4 },
        meso: 20000000,
      },
      {
        id: 'cyclops_5',
        label: '真獨眼巨人眼 Lv.80',
        output: '01022215',
        baseEquip: '01022193',
        baseCount: 1,
        materials: { cyclops_eye: 5 },
        meso: 25000000,
      },
    ],
  },

  //意志裝
  {
    id: 'tinkerer_shoulder_accessory',
    name: '意志肩飾',
    iconItemId: '01152124',
    recipes: [
      {
        id: 'tinkerer_shoulder_accessory_1',
        label: '楓之谷強韌意志綠色肩膀裝飾',
        output: '01152121',
        baseEquip: '01152120',
        baseCount: 1,
        materials: { tinkerer_chest: 5 },
        meso: 5000000,
      },
      {
        id: 'tinkerer_shoulder_accessory_2',
        label: '楓之谷強韌意志藍色肩膀裝飾',
        output: '01152122',
        baseEquip: '01152121',
        baseCount: 1,
        materials: { tinkerer_chest: 10 },
        meso: 10000000,
      },
      {
        id: 'tinkerer_shoulder_accessory_3',
        label: '楓之谷強韌意志紅色肩膀裝飾',
        output: '01152123',
        baseEquip: '01152122',
        baseCount: 1,
        materials: { tinkerer_chest: 15 },
        meso: 15000000,
      },
      {
        id: 'tinkerer_shoulder_accessory_4',
        label: '楓之谷強韌意志黑色肩膀裝飾',
        output: '01152124',
        baseEquip: '01152123',
        baseCount: 1,
        materials: { tinkerer_chest: 20 },
        meso: 20000000,
      }
    ],
  },

  {
    id: 'tinkerer_belt_accessory',
    name: '意志腰帶',
    iconItemId: '01132215',
    recipes: [
      {
        id: 'tinkerer_belt_accessory_1',
        label: '楓之谷強韌意志綠色腰帶',
        output: '01132212',
        baseEquip: '01132211',
        baseCount: 1,
        materials: { tinkerer_chest: 5 },
        meso: 5000000,
      },
      {
        id: 'tinkerer_belt_accessory_2',
        label: '楓之谷強韌意志藍色腰帶',
        output: '01132213',
        baseEquip: '01132212',
        baseCount: 1,
        materials: { tinkerer_chest: 10 },
        meso: 10000000,
      },
      {
        id: 'tinkerer_belt_accessory_3',
        label: '楓之谷強韌意志紅色腰帶',
        output: '01132214',
        baseEquip: '01132213',
        baseCount: 1,
        materials: { tinkerer_chest: 15 },
        meso: 15000000,
      },
      {
        id: 'tinkerer_belt_accessory_4',
        label: '楓之谷強韌意志黑色腰帶',
        output: '01132215',
        baseEquip: '01132214',
        baseCount: 1,
        materials: { tinkerer_chest: 20 },
        meso: 20000000,
      }
    ],
  },
  //滅龍騎士
  {
    id: 'dragon_knight',
    name: '滅龍騎士',
    iconItemId: '01052723',
    recipes: [
      {
        id: 'dragon_knight_1',
        label: '正式鬥劍士盔甲',
        output: '01052720',
        baseEquip: '01052719',
        baseCount: 1,
        materials: { black_dragon_iron: 10 },
        meso: 5000000,
      },
      {
        id: 'dragon_knight_2',
        label: '上級鬥劍士盔甲',
        output: '01052721',
        baseEquip: '01052720',
        baseCount: 1,
        materials: { black_dragon_iron: 30 },
        meso: 10000000,
      },
      {
        id: 'dragon_knight_3',
        label: '首領鬥劍士盔甲',
        output: '01052722',
        baseEquip: '01052721',
        baseCount: 1,
        materials: { black_dragon_iron: 50 },
        meso: 20000000,
      },
      {
        id: 'dragon_knight_4',
        label: '滅龍騎士盔甲',
        output: '01052723',
        baseEquip: '01052722',
        baseCount: 1,
        materials: { black_dragon_iron: 100, black_dragon_soul: 1 },
        meso: 50000000,
      },
    ],
  },

];

const EQUIP_CRAFT_MAKE_LIST = [

  //蓋世無雙

  {
  id: 'Fearless',
  name: '蓋世無雙',
  iconItemId: '01003285',
  categories: [
    {
      id: 'Fearless_weapon',
      name: '蓋世無雙武器',
      iconItemId: '01402112',
      materials: { Fearless_pcs: 50 , meowcoin: 500, nekopow: 500 },
      meso: 5000000,
      variants: [
        { id: 'twohanded_sword', label: '雙手劍', output: '01402112' },
        { id: 'short_wand', label: '短杖', output: '01372101' },
        { id: 'dual_crossbow', label: '雙弩槍', output: '01522021' },
      ],
    },
    {
      id: 'Fearless_cap',
      name: '蓋世無雙帽子',
      iconItemId: '01003285',
      materials: { Fearless_pcs: 20 , meowcoin: 500, nekopow: 500 },
      meso: 5000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01003285' },
        { id: 'mage', label: '法師', output: '01003286' },
        { id: 'bowman', label: '弓箭手', output: '01003287' },
        { id: 'thief', label: '盜賊', output: '01003288' },
        { id: 'pirate', label: '海盜', output: '01003289' },
      ],
    },
    {
      id: 'Fearless_longcoat',
      name: '蓋世無雙長袍',
      iconItemId: '01052379',
      materials: { Fearless_pcs: 20 , meowcoin: 500, nekopow: 500 },
      meso: 5000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01052379' },
        { id: 'mage', label: '法師', output: '01052380' },
        { id: 'bowman', label: '弓箭手', output: '01052381' },
        { id: 'thief', label: '盜賊', output: '01052382' },
        { id: 'pirate', label: '海盜', output: '01052383' },
      ],
    },
    {
      id: 'Fearless_gloves',
      name: '蓋世無雙手套',
      iconItemId: '01082333',
      materials: { Fearless_pcs: 20 , meowcoin: 500, nekopow: 500 },
      meso: 5000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01082333' },
        { id: 'mage', label: '法師', output: '01082334' },
        { id: 'bowman', label: '弓箭手', output: '01082335' },
        { id: 'thief', label: '盜賊', output: '01082336' },
        { id: 'pirate', label: '海盜', output: '01082337' },
      ],
    },
    {
      id: 'Fearless_boots',
      name: '蓋世無雙靴子',
      iconItemId: '01072549',
      materials: { Fearless_pcs: 20 , meowcoin: 500, nekopow: 500 },
      meso: 5000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01072549' },
        { id: 'mage', label: '法師', output: '01072550' },
        { id: 'bowman', label: '弓箭手', output: '01072551' },
        { id: 'thief', label: '盜賊', output: '01072552' },
        { id: 'pirate', label: '海盜', output: '01072553' },
      ],
    },
  ],
  },

 
{ //赫力席母精銳
  id: 'tyrants_equip',
  name: '暴君裝備',
  iconItemId: '01102485',
  categories: [
    {
      id: 'tyrants_Elite_Heliseum_cape',
      name: '赫力席母精銳披風',
      iconItemId: '01102471',
      materials: { tyrants_coin: 10 , meowcoin: 100, nekopow: 100 },
      meso: 20000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01102471' },
        { id: 'mage', label: '法師', output: '01102472' },
        { id: 'bowman', label: '弓箭手', output: '01102473' },
        { id: 'thief', label: '盜賊', output: '01102474' },
        { id: 'pirate', label: '海盜', output: '01102475' },
      ],
    },
    {
      id: 'tyrants_Elite_Heliseum_shose',
      name: '赫力席母精銳鞋子',
      iconItemId: '01072732',
      materials: { tyrants_coin: 10 , meowcoin: 100, nekopow: 100 },
      meso: 20000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01072732' },
        { id: 'mage', label: '法師', output: '01072733' },
        { id: 'bowman', label: '弓箭手', output: '01072734' },
        { id: 'thief', label: '盜賊', output: '01072735' },
        { id: 'pirate', label: '海盜', output: '01072736' },
      ],
    },
    {
      id: 'tyrants_Elite_Heliseum_belt',
      name: '赫力席母精銳腰帶',
      iconItemId: '01132164',
      materials: { tyrants_coin: 10 , meowcoin: 100, nekopow: 100 },
      meso: 20000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01132164' },
        { id: 'mage', label: '法師', output: '01132165' },
        { id: 'bowman', label: '弓箭手', output: '01132166' },
        { id: 'thief', label: '盜賊', output: '01132167' },
        { id: 'pirate', label: '海盜', output: '01132168' },
      ],
    },    
    {
      id: 'tyrants_nova_cape',
      name: '超新星披風',
      iconItemId: '01102476',
      materials: { tyrants_coin: 50 , meowcoin: 500, nekopow: 500 },
      meso: 100000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01102476' },
        { id: 'mage', label: '法師', output: '01102477' },
        { id: 'bowman', label: '弓箭手', output: '01102478' },
        { id: 'thief', label: '盜賊', output: '01102479' },
        { id: 'pirate', label: '海盜', output: '01102480' },
      ],
    },
    {
      id: 'tyrants_nova_shose',
      name: '超新星鞋子', 
      iconItemId: '01072737',
      materials: { tyrants_coin: 50 , meowcoin: 500, nekopow: 500 },
      meso: 100000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01072737' },
        { id: 'mage', label: '法師', output: '01072738' },
        { id: 'bowman', label: '弓箭手', output: '01072739' },
        { id: 'thief', label: '盜賊', output: '01072740' },
        { id: 'pirate', label: '海盜', output: '01072741' },
      ],
    },
    {
      id: 'tyrants_nova_belt',
      name: '超新星腰帶',
      iconItemId: '01132169',
      materials: { tyrants_coin: 50 , meowcoin: 500, nekopow: 500 },
      meso: 100000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01132169' },
        { id: 'mage', label: '法師', output: '01132170' },
        { id: 'bowman', label: '弓箭手', output: '01132171' },
        { id: 'thief', label: '盜賊', output: '01132172' },
        { id: 'pirate', label: '海盜', output: '01132173' },
      ],
    },
    {
      id: 'tyrants_cape',
      name: '塔蘭特披風',
      iconItemId: '01102481',
      materials: { tyrants_coin: 100 , meowcoin: 1000, nekopow: 1000 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01102481' },
        { id: 'mage', label: '法師', output: '01102482' },
        { id: 'bowman', label: '弓箭手', output: '01102483' },
        { id: 'thief', label: '盜賊', output: '01102484' },
        { id: 'pirate', label: '海盜', output: '01102485' },
      ],  
    },
    {
      id: 'tyrants_shose',
      name: '塔蘭特鞋子',
      iconItemId: '01072743',
      materials: { tyrants_coin: 100 , meowcoin: 1000, nekopow: 1000 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01072743' },
        { id: 'mage', label: '法師', output: '01072744' },
        { id: 'bowman', label: '弓箭手', output: '01072745' },
        { id: 'thief', label: '盜賊', output: '01072746' },
        { id: 'pirate', label: '海盜', output: '01072747' },
      ],
    },
    {
      id: 'tyrants_belt',
      name: '塔蘭特腰帶',
      iconItemId: '01132174',
      materials: { tyrants_coin: 100 , meowcoin: 1000, nekopow: 1000 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01132174' },
        { id: 'mage', label: '法師', output: '01132175' },
        { id: 'bowman', label: '弓箭手', output: '01132176' },
        { id: 'thief', label: '盜賊', output: '01132177' },
        { id: 'pirate', label: '海盜', output: '01132178' },
      ],
    },
    {
      id: 'tyrants_gloves',
      name: '塔蘭特手套',
      iconItemId: '01082543',
      materials: { tyrants_coin: 100 , meowcoin: 1000, nekopow: 1000 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01082543' },
        { id: 'mage', label: '法師', output: '01082544' },
        { id: 'bowman', label: '弓箭手', output: '01082545' },
        { id: 'thief', label: '盜賊', output: '01082546' },
        { id: 'pirate', label: '海盜', output: '01082547' },
      ],
    },
  ],
},

{  //女皇裝備
  id: 'queen_equip',
  name: '女皇裝備',
  iconItemId: '01003172',
  categories: [
    {
      id: 'queen_weapon',
      name: '女皇武器',
      iconItemId: '01402095',
      materials: { '140weapon_pcs': 15 },
      meso: 1000000000,
      variants: [
        { id: 'twohanded_sword', label: '雙手劍', output: '01402095' },
        { id: 'short_wand', label: '短杖', output: '01372084' },
        { id: 'dual_crossbow', label: '雙弩槍', output: '01522018' },
      ],
    },
    {
      id: 'queen_cap',
      name: '女皇帽子',
      iconItemId: '01003172',
      materials: { '140armor_pcs': 5 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01003172' },
        { id: 'mage', label: '法師', output: '01003173' },
        { id: 'bowman', label: '弓箭手', output: '01003174' },
        { id: 'thief', label: '盜賊', output: '01003175' },
        { id: 'pirate', label: '海盜', output: '01003176' },
      ],
    },
    {
      id: 'queen_longcoat',
      name: '女皇套服',
      iconItemId: '01052314',
      materials: { '140armor_pcs': 5 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01052314' },
        { id: 'mage', label: '法師', output: '01052315' },
        { id: 'bowman', label: '弓箭手', output: '01052316' },
        { id: 'thief', label: '盜賊', output: '01052317' },
        { id: 'pirate', label: '海盜', output: '01052318' },
      ],
    },
    {
      id: 'queen_gloves',
      name: '女皇手套',
      iconItemId: '01082295',
      materials: { '140armor_pcs': 5 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01082295' },
        { id: 'mage', label: '法師', output: '01082296' },
        { id: 'bowman', label: '弓箭手', output: '01082297' },
        { id: 'thief', label: '盜賊', output: '01082298' },
        { id: 'pirate', label: '海盜', output: '01082299' },
      ],
    },
    {
      id: 'queen_shose',
      name: '女皇鞋子',
      iconItemId: '01072485',
      materials: { '140armor_pcs': 5 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01072485' },
        { id: 'mage', label: '法師', output: '01072486' },
        { id: 'bowman', label: '弓箭手', output: '01072487' },
        { id: 'thief', label: '盜賊', output: '01072488' },
        { id: 'pirate', label: '海盜', output: '01072489' },
      ],
    },
    {
      id: 'queen_cape',
      name: '女皇斗篷',
      iconItemId: '01102275',
      materials: { '140armor_pcs': 5 },
      meso: 500000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01102275' },
        { id: 'mage', label: '法師', output: '01102276' },
        { id: 'bowman', label: '弓箭手', output: '01102277' },
        { id: 'thief', label: '盜賊', output: '01102278' },
        { id: 'pirate', label: '海盜', output: '01102279' },
      ],
    },
    {
      id: 'queen_shoulder',
      name: '女皇護肩',
      iconItemId: '01152108',
      materials: { '140armor_pcs': 10 },
      meso: 1000000000,
      variants: [
        { id: 'warrior', label: '劍士', output: '01152108' },
        { id: 'mage', label: '法師', output: '01152110' },
        { id: 'bowman', label: '弓箭手', output: '01152111' },
        { id: 'thief', label: '盜賊', output: '01152112' },
        { id: 'pirate', label: '海盜', output: '01152113' },
      ],
    },
  ],
},
  // 舊永恆
  {
    id: 'old_eternal',
    name: '舊永恆',
    iconItemId: '01005980',
    categories: [
      {
        id: 'eternal_cap',
        name: '永恆帽子',
        iconItemId: '01005980',
        materials: { snow: 30, eternalpcs: 30, nekopow: 1200 },
        meso: 500000,
        variants: [
          { id: 'warrior', label: '劍士', output: '01005980' },
          { id: 'mage', label: '法師', output: '01005981' },
          { id: 'bowman', label: '弓箭手', output: '01005982' },
          { id: 'thief', label: '盜賊', output: '01005983' },
          { id: 'pirate', label: '海盜', output: '01005984' },
        ],
      },
      {
        id: 'eternal_coat',
        name: '永恆上衣',
        iconItemId: '01042433',
        materials: { snow: 30, eternalpcs: 30, nekopow: 1200 },
        meso: 500000,
        variants: [
          { id: 'warrior', label: '劍士', output: '01042433' },
          { id: 'mage', label: '法師', output: '01042434' },
          { id: 'bowman', label: '弓箭手', output: '01042435' },
          { id: 'thief', label: '盜賊', output: '01042436' },
          { id: 'pirate', label: '海盜', output: '01042437' },
        ],
      },
    ],
  },

  //新永恆
];

const EquipCraftStore = (() => {
  function equipName(itemId) {
    const id = String(itemId || '');
    if (!id) return '—';
    return (typeof ITEM_DATABASE !== 'undefined' && ITEM_DATABASE[id]?.name) || id;
  }

  function equipIcon(itemId) {
    const id = String(itemId || '');
    if (!id) return '';
    const fromDb = typeof ITEM_DATABASE !== 'undefined' ? ITEM_DATABASE[id]?.icon : '';
    return fromDb || `images/equip/${id}.png`;
  }

  function etcRow(itemId) {
    if (typeof IdleEtcStore !== 'undefined') return IdleEtcStore.get(itemId);
    return null;
  }

  function etcName(itemId) {
    return etcRow(itemId)?.name || String(itemId || '');
  }

  function etcIcon(itemId) {
    return etcRow(itemId)?.icon || 'images/ETCicon/01000001.png';
  }

  function materialsMap(recipe) {
    const raw = recipe?.materials || {};
    const out = {};
    Object.entries(raw).forEach(([id, amt]) => {
      const n = Math.max(0, Math.floor(Number(amt) || 0));
      if (n > 0) out[String(id)] = n;
    });
    return out;
  }

  function isMakeSeries(row) {
    return !!(row && Array.isArray(row.categories));
  }

  function isMakeFlat(row) {
    return !!(row && row.output && !row.categories);
  }

  function isBagEquipLocked(slotIndex) {
    return typeof InventoryModule !== 'undefined'
      && typeof InventoryModule.isEquipItemLocked === 'function'
      && InventoryModule.isEquipItemLocked(slotIndex);
  }

  function countEquipInBag(itemId, { includeLocked = true } = {}) {
    const id = String(itemId || '');
    if (!id || typeof playerInventoryEquip === 'undefined') return 0;
    return playerInventoryEquip.reduce((sum, entry, index) => {
      if (entry !== id) return sum;
      if (!includeLocked && isBagEquipLocked(index)) return sum;
      return sum + 1;
    }, 0);
  }

  function takeEquipFromBag(itemId, amount = 1) {
    const id = String(itemId || '');
    let need = Math.max(1, Math.floor(Number(amount) || 1));
    if (!id || countEquipInBag(id, { includeLocked: false }) < need) return false;
    for (let i = 0; i < playerInventoryEquip.length && need > 0; i++) {
      if (playerInventoryEquip[i] !== id) continue;
      if (isBagEquipLocked(i)) continue;
      playerInventoryEquip[i] = null;
      if (typeof playerInventoryState !== 'undefined') playerInventoryState[i] = null;
      need -= 1;
    }
    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)) {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
    return true;
  }

  /** 強化進度分數：優先有星力／卷軸／潛能等的基底；同分取較前槽 */
  function advanceProgressScore(state) {
    if (!state) return 0;
    let score = 0;
    score += (Number(state.star) || 0) * 1e6;
    score += (Number(state.scrollUsed) || 0) * 1e4;
    score += (Number(state.goldenHammerUsed) || 0) * 100;
    score += (Number(state.platinumHammerUsed) || 0) * 100;
    score += (Number(state.catValleyLevel) || 0) * 100;
    score += (Number(state.medalEnhanceLevel) || 0) * 100;
    score += (Number(state.exceptional?.level) || 0) * 50;
    const potLines = state.potential?.lines || state.potential?.options;
    if (Array.isArray(potLines) && potLines.some((l) => l && (l.id || l.stat || l.value))) score += 1000;
    const addLines = state.additionalPotential?.lines || state.additionalPotential?.options;
    if (Array.isArray(addLines) && addLines.some((l) => l && (l.id || l.stat || l.value))) score += 500;
    if (state.bonusStat && Object.keys(state.bonusStat).length) score += 200;
    if (state.soul?.option || state.soulOption) score += 100;
    return score;
  }

  function findBestAdvanceBaseSlot(baseEquip) {
    const id = String(baseEquip || '');
    if (!id || typeof playerInventoryEquip === 'undefined') return -1;
    let bestSlot = -1;
    let bestScore = -1;
    for (let i = 0; i < playerInventoryEquip.length; i++) {
      if (playerInventoryEquip[i] !== id) continue;
      if (isBagEquipLocked(i)) continue;
      const saved = typeof playerInventoryState !== 'undefined' ? playerInventoryState[i] : null;
      const state = saved && saved.itemId === id
        ? saved
        : (typeof loadEnchantStateForSlot === 'function' ? loadEnchantStateForSlot(id, i) : null);
      const score = advanceProgressScore(state);
      if (score > bestScore) {
        bestScore = score;
        bestSlot = i;
      }
    }
    return bestSlot;
  }

  function syncEquipMirror() {
    if (typeof playerInventory !== 'undefined' && Array.isArray(playerInventory)
      && typeof playerInventoryEquip !== 'undefined') {
      playerInventory.splice(0, playerInventory.length, ...playerInventoryEquip);
    }
  }

  function canAffordMaterials(materials) {
    if (typeof idleCanAffordEtcMap === 'function') {
      return idleCanAffordEtcMap(materials);
    }
    if (typeof InventoryModule === 'undefined') return false;
    return Object.entries(materials).every(([id, amt]) => (
      InventoryModule.countEtc(id) >= Math.max(0, Math.floor(Number(amt) || 0))
    ));
  }

  function spendMaterials(materials) {
    if (typeof idleSpendEtcMap === 'function') {
      return idleSpendEtcMap(materials);
    }
    if (!canAffordMaterials(materials)) return false;
    Object.entries(materials).forEach(([id, amt]) => {
      const n = Math.max(0, Math.floor(Number(amt) || 0));
      if (n > 0) InventoryModule.takeEtc(id, n);
    });
    return true;
  }

  function heldMeso() {
    if (typeof getIdleHeldMeso === 'function') return getIdleHeldMeso();
    return 0;
  }

  function canAffordMeso(meso) {
    const cost = Math.max(0, Math.floor(Number(meso) || 0));
    if (!cost) return true;
    if (typeof isIdlePlayMode === 'function' && !isIdlePlayMode()) return true;
    return heldMeso() >= cost;
  }

  function spendMeso(meso) {
    const cost = Math.max(0, Math.floor(Number(meso) || 0));
    if (!cost) return true;
    if (typeof trySpendIdleMeso === 'function') return trySpendIdleMeso(cost, { silent: true });
    return false;
  }

  function canCraftAdvance(recipe) {
    if (!recipe?.output || !recipe?.baseEquip) return false;
    const baseCount = Math.max(1, Math.floor(Number(recipe.baseCount) || 1));
    if (countEquipInBag(recipe.baseEquip, { includeLocked: false }) < baseCount) return false;
    if (!canAffordMaterials(materialsMap(recipe))) return false;
    if (!canAffordMeso(recipe.meso)) return false;
    if (typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[recipe.output]) return false;
    if (findBestAdvanceBaseSlot(recipe.baseEquip) < 0) return false;
    if (typeof UiToadsHammer === 'undefined'
      || typeof UiToadsHammer.buildAdvanceInheritedState !== 'function') {
      return false;
    }
    if (typeof createEnchantState !== 'function') return false;
    return true;
  }

  function canCraftMake(recipe) {
    if (!recipe?.output) return false;
    if (!canAffordMaterials(materialsMap(recipe))) return false;
    if (!canAffordMeso(recipe.meso)) return false;
    if (typeof InventoryModule === 'undefined') return false;
    if (typeof ITEM_DATABASE === 'undefined' || !ITEM_DATABASE[recipe.output]) return false;
    if (InventoryModule.findEmptyEquipSlot?.() < 0) return false;
    return true;
  }

  function craftAdvance(recipe) {
    if (!canCraftAdvance(recipe)) return false;

    const baseCount = Math.max(1, Math.floor(Number(recipe.baseCount) || 1));
    const slot = findBestAdvanceBaseSlot(recipe.baseEquip);
    if (slot < 0) return false;

    const srcItemId = playerInventoryEquip[slot];
    if (srcItemId !== recipe.baseEquip) return false;

    let srcState = typeof loadEnchantStateForSlot === 'function'
      ? loadEnchantStateForSlot(srcItemId, slot)
      : (playerInventoryState?.[slot] || null);

    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem?.slotIndex === slot
      && typeof saveInventoryItemState === 'function') {
      saveInventoryItemState(slot, currentEnchantItem);
      srcState = typeof loadEnchantStateForSlot === 'function'
        ? loadEnchantStateForSlot(srcItemId, slot)
        : currentEnchantItem;
    }
    if (!srcState) return false;

    const nextState = UiToadsHammer.buildAdvanceInheritedState(srcState, recipe.output, slot);
    if (!nextState) return false;

    // 多件基底：先清掉多餘件（不含繼承槽），再扣材料
    if (baseCount > 1) {
      let extra = baseCount - 1;
      for (let i = 0; i < playerInventoryEquip.length && extra > 0; i++) {
        if (i === slot) continue;
        if (playerInventoryEquip[i] !== recipe.baseEquip) continue;
        if (isBagEquipLocked(i)) continue;
        playerInventoryEquip[i] = null;
        if (typeof playerInventoryState !== 'undefined') playerInventoryState[i] = null;
        extra -= 1;
      }
      if (extra > 0) return false;
      syncEquipMirror();
    }

    if (!spendMaterials(materialsMap(recipe))) return false;
    if (!spendMeso(recipe.meso)) return false;

    playerInventoryEquip[slot] = recipe.output;
    nextState.itemId = recipe.output;
    nextState.id = recipe.output;
    nextState.slotIndex = slot;
    if (typeof saveInventoryItemState === 'function') {
      saveInventoryItemState(slot, nextState);
    } else {
      playerInventoryState[slot] = nextState;
    }
    syncEquipMirror();

    if (typeof currentEnchantItem !== 'undefined' && currentEnchantItem?.slotIndex === slot) {
      const reloaded = typeof loadEnchantStateForSlot === 'function'
        ? loadEnchantStateForSlot(recipe.output, slot)
        : nextState;
      if (reloaded) Object.assign(currentEnchantItem, reloaded);
      if (typeof updateUI === 'function') updateUI();
      if (typeof updateStatusPanel === 'function') updateStatusPanel();
    }

    if (typeof InventoryModule !== 'undefined') {
      InventoryModule.render?.();
      InventoryModule.updateSlotCount?.();
      InventoryModule.updateMesoDisplay?.();
    }
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave?.();

    const outName = equipName(recipe.output);
    if (typeof addLog === 'function') {
      addLog(`[裝備進階] 已將強化繼承至【${outName}】。`, 'log-success');
    }
    return true;
  }

  function craftMake(recipe) {
    if (!canCraftMake(recipe)) return false;
    if (!spendMaterials(materialsMap(recipe))) return false;
    if (!spendMeso(recipe.meso)) return false;
    const ok = InventoryModule.addEquipFromCatalog(recipe.output, null, {
      silent: false,
      logTag: '裝備製作',
      switchTab: false,
    });
    if (!ok) return false;
    if (typeof SessionPersistenceModule !== 'undefined') SessionPersistenceModule.scheduleSave?.();
    if (typeof InventoryModule !== 'undefined') InventoryModule.updateMesoDisplay?.();
    return true;
  }

  function listAdvanceLines() {
    return EQUIP_CRAFT_ADVANCE_LINES.slice();
  }

  function listMakeEntries() {
    return EQUIP_CRAFT_MAKE_LIST.slice();
  }

  /** @deprecated 相容舊呼叫：扁平化後的單筆配方 */
  function listMakeRecipes() {
    return EQUIP_CRAFT_MAKE_LIST.filter(isMakeFlat);
  }

  function getAdvanceLine(lineId) {
    return EQUIP_CRAFT_ADVANCE_LINES.find((row) => row.id === lineId) || null;
  }

  function findAdvanceRecipe(lineId, recipeId) {
    const line = getAdvanceLine(lineId);
    if (!line) return null;
    return line.recipes.find((row) => row.id === recipeId) || null;
  }

  function getMakeSeries(seriesId) {
    return EQUIP_CRAFT_MAKE_LIST.find((row) => isMakeSeries(row) && row.id === seriesId) || null;
  }

  function getMakeCategory(seriesId, categoryId) {
    const series = getMakeSeries(seriesId);
    if (!series) return null;
    return (series.categories || []).find((row) => row.id === categoryId) || null;
  }

  function findMakeFlatRecipe(recipeId) {
    return EQUIP_CRAFT_MAKE_LIST.find((row) => isMakeFlat(row) && row.id === recipeId) || null;
  }

  /** 解析變體配方：材料／楓幣繼承自大分類 */
  function resolveMakeVariant(seriesId, categoryId, variantId) {
    const category = getMakeCategory(seriesId, categoryId);
    if (!category) return null;
    const variant = (category.variants || []).find((row) => row.id === variantId) || null;
    if (!variant?.output) return null;
    return {
      id: variant.id,
      label: variant.label || equipName(variant.output),
      output: variant.output,
      materials: { ...(category.materials || {}) },
      meso: category.meso || 0,
      seriesId,
      categoryId,
    };
  }

  function findMakeRecipe(recipeId) {
    return findMakeFlatRecipe(recipeId);
  }

  return {
    listAdvanceLines,
    listMakeEntries,
    listMakeRecipes,
    getAdvanceLine,
    findAdvanceRecipe,
    getMakeSeries,
    getMakeCategory,
    resolveMakeVariant,
    findMakeFlatRecipe,
    findMakeRecipe,
    isMakeSeries,
    isMakeFlat,
    equipName,
    equipIcon,
    etcName,
    etcIcon,
    materialsMap,
    countEquipInBag,
    findBestAdvanceBaseSlot,
    canCraftAdvance,
    canCraftMake,
    craftAdvance,
    craftMake,
    heldMeso,
    canAffordMeso,
    canAffordMaterials,
  };
})();

if (typeof window !== 'undefined') {
  window.EQUIP_CRAFT_ADVANCE_LINES = EQUIP_CRAFT_ADVANCE_LINES;
  window.EQUIP_CRAFT_MAKE_LIST = EQUIP_CRAFT_MAKE_LIST;
  window.EquipCraftStore = EquipCraftStore;
}
