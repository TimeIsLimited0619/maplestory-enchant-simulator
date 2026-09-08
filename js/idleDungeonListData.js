/**
 * 副本列表（GM 可寫入）。寫入此檔請先執行 npm run gm-writer。
 */
const IDLE_DUNGEON_LIST = [
  {
    "id": "normal-dungeon",
    "name": "影武者蒙面素材地下城",
    "type": "normal",
    "category": "dungeon",
    "enabled": true,
    "ticketId": "idle-ticket-normal",
    "ticketName": "地下城入場券",
    "durationSec": 0,
    "mobLevel": 1000,
    "reqLevel": 0,
    "useFieldDrops": false,
    "useFieldGold": false,
    "dmgRampRef": 100000,
    "dmgRampPower": 0.5,
    "map": {
      "name": "影武者蒙面素材地下城",
      "artId": "TreasureVault",
      "mobs": [
        {
          "name": "幸運銀幣",
          "icon": "9010147"
        },
        {
          "name": "幸運金幣",
          "icon": "9010148"
        },
        {
          "name": "幸運銅幣",
          "icon": "9410435"
        }
      ],
      "mobName": "幸運銀幣",
      "mobIcon": "9010147",
      "bossName": "幸運大王",
      "bossIcon": "9010148",
      "baseMobHp": 20000,
      "baseBossHp": 500000,
      "mobAtk1Dmg": 500,
      "mobAtk1Cd": 1,
      "mobAtk2Dmg": 0,
      "mobAtk2Cd": 0,
      "mobAtk3Dmg": 0,
      "mobAtk3Cd": 0,
      "mobSkill1Dmg": 0,
      "mobSkill1Cd": 8,
      "mobSkill2Dmg": 0,
      "mobSkill2Cd": 0,
      "mobSkill3Dmg": 0,
      "mobSkill3Cd": 0,
      "bossAtk1Dmg": 1000,
      "bossAtk1Cd": 1.2,
      "bossAtk2Dmg": 0,
      "bossAtk2Cd": 0,
      "bossAtk3Dmg": 0,
      "bossAtk3Cd": 0,
      "bossSkill1Dmg": 0,
      "bossSkill1Cd": 10,
      "bossSkill2Dmg": 0,
      "bossSkill2Cd": 0,
      "bossSkill3Dmg": 0,
      "bossSkill3Cd": 0
    },
    "mobDrops": [
      {
        "kind": "etc",
        "itemId": "spell_trace",
        "name": "咒文的痕跡",
        "amount": 1,
        "chance": 25
      },
      {
        "kind": "etc",
        "itemId": "meowcoin",
        "name": "喵喵幣",
        "amount": 1,
        "chance": 15
      }
    ],
    "rewards": [
      {
        "kind": "etc",
        "itemId": "meowcoin",
        "name": "喵喵幣",
        "amount": 10,
        "chance": 100
      }
    ],
    "diffs": [
      {
        "id": "1",
        "name": "難度 1",
        "reqLevel": 30,
        "killNeed": 30,
        "settleGoldPerKill": 0,
        "clearGold": 10000,
        "hpMult": 1,
        "dmgMult": 1,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": [
          {
            "kind": "etc",
            "itemId": "yellow_pendant",
            "name": "黃色吊墜",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "id": "2",
        "name": "難度 2",
        "reqLevel": 55,
        "killNeed": 50,
        "settleGoldPerKill": 0,
        "clearGold": 150000,
        "hpMult": 10,
        "dmgMult": 7,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": [
          {
            "kind": "etc",
            "itemId": "green_pendant",
            "name": "綠色吊墜",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "id": "3",
        "name": "難度 3",
        "reqLevel": 69,
        "killNeed": 70,
        "settleGoldPerKill": 0,
        "clearGold": 300000,
        "hpMult": 50,
        "dmgMult": 20,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": [
          {
            "kind": "etc",
            "itemId": "blue_pendant",
            "name": "藍色吊墜",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "id": "4",
        "name": "難度 4",
        "reqLevel": 100,
        "killNeed": 100,
        "settleGoldPerKill": 0,
        "clearGold": 1000000,
        "hpMult": 100,
        "dmgMult": 50,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": [
          {
            "kind": "etc",
            "itemId": "purple_pendant",
            "name": "紫色吊墜",
            "amount": 1,
            "chance": 100
          }
        ]
      }
    ],
    "damageTiers": []
  },
  {
    "id": "timed-gold",
    "name": "金幣副本",
    "type": "timed",
    "category": "gold",
    "enabled": true,
    "ticketId": "idle-ticket-timed",
    "ticketName": "計時副本入場券",
    "durationSec": 100,
    "mobLevel": 100,
    "reqLevel": 0,
    "useFieldDrops": false,
    "useFieldGold": false,
    "dmgRampRef": 100000,
    "dmgRampPower": 0.5,
    "map": {
      "name": "金幣副本",
      "artId": "TreasureVault",
      "mobs": [
        {
          "name": "幸運銀幣",
          "icon": "9010147"
        },
        {
          "name": "幸運金幣",
          "icon": "9010148"
        },
        {
          "name": "幸運銅幣",
          "icon": "9410435"
        }
      ],
      "mobName": "幸運銀幣",
      "mobIcon": "9010147",
      "bossName": "副本 BOSS",
      "bossIcon": "",
      "baseMobHp": 200000,
      "baseBossHp": 1800,
      "mobAtk1Dmg": 2000,
      "mobAtk1Cd": 1,
      "mobAtk2Dmg": 0,
      "mobAtk2Cd": 0,
      "mobAtk3Dmg": 0,
      "mobAtk3Cd": 0,
      "mobSkill1Dmg": 0,
      "mobSkill1Cd": 8,
      "mobSkill2Dmg": 0,
      "mobSkill2Cd": 0,
      "mobSkill3Dmg": 0,
      "mobSkill3Cd": 0,
      "bossAtk1Dmg": 0,
      "bossAtk1Cd": 0,
      "bossAtk2Dmg": 0,
      "bossAtk2Cd": 0,
      "bossAtk3Dmg": 0,
      "bossAtk3Cd": 0,
      "bossSkill1Dmg": 0,
      "bossSkill1Cd": 0,
      "bossSkill2Dmg": 0,
      "bossSkill2Cd": 0,
      "bossSkill3Dmg": 0,
      "bossSkill3Cd": 0
    },
    "mobDrops": [],
    "rewards": [],
    "diffs": [
      {
        "id": "1",
        "name": "難度 1",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 1000,
        "clearGold": 0,
        "hpMult": 1,
        "dmgMult": 1,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "2",
        "name": "難度 2",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 2000,
        "clearGold": 0,
        "hpMult": 3,
        "dmgMult": 1.5,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "3",
        "name": "難度 3",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 4000,
        "clearGold": 0,
        "hpMult": 5,
        "dmgMult": 2,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "4",
        "name": "難度 4",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 8000,
        "clearGold": 0,
        "hpMult": 10,
        "dmgMult": 3,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "5",
        "name": "難度 5",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 16000,
        "clearGold": 0,
        "hpMult": 20,
        "dmgMult": 5,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "6",
        "name": "難度 6",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 32000,
        "clearGold": 0,
        "hpMult": 40,
        "dmgMult": 7,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "7",
        "name": "難度 7",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 64000,
        "clearGold": 0,
        "hpMult": 80,
        "dmgMult": 10,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "8",
        "name": "難度 8",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 128000,
        "clearGold": 0,
        "hpMult": 160,
        "dmgMult": 15,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "9",
        "name": "難度 9",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 256000,
        "clearGold": 0,
        "hpMult": 320,
        "dmgMult": 20,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "10",
        "name": "難度 10",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 512000,
        "clearGold": 0,
        "hpMult": 640,
        "dmgMult": 30,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      }
    ],
    "damageTiers": []
  },
  {
    "id": "damage-trial",
    "name": "方塊拳擊機",
    "type": "damage",
    "category": "material",
    "enabled": true,
    "ticketId": "idle-ticket-damage",
    "ticketName": "計時副本入場券",
    "durationSec": 90,
    "mobLevel": 300,
    "reqLevel": 60,
    "useFieldDrops": false,
    "useFieldGold": false,
    "dmgRampRef": 100000,
    "dmgRampPower": 0.5,
    "map": {
      "name": "拳擊王場地",
      "artId": "Boxingring",
      "mobs": [
        {
          "name": "副本怪物1",
          "icon": ""
        }
      ],
      "mobName": "副本怪物1",
      "mobIcon": "",
      "bossName": "拳擊機",
      "bossIcon": "9833910",
      "baseMobHp": 100,
      "baseBossHp": 1000000000000000000,
      "mobAtk1Dmg": 5,
      "mobAtk1Cd": 0.6,
      "mobAtk2Dmg": 0,
      "mobAtk2Cd": 0,
      "mobAtk3Dmg": 0,
      "mobAtk3Cd": 0,
      "mobSkill1Dmg": 0,
      "mobSkill1Cd": 8,
      "mobSkill2Dmg": 0,
      "mobSkill2Cd": 0,
      "mobSkill3Dmg": 0,
      "mobSkill3Cd": 0,
      "bossAtk1Dmg": 500,
      "bossAtk1Cd": 1,
      "bossAtk2Dmg": 0,
      "bossAtk2Cd": 0,
      "bossAtk3Dmg": 0,
      "bossAtk3Cd": 0,
      "bossSkill1Dmg": 0,
      "bossSkill1Cd": 10,
      "bossSkill2Dmg": 0,
      "bossSkill2Cd": 0,
      "bossSkill3Dmg": 0,
      "bossSkill3Cd": 0
    },
    "mobDrops": [],
    "rewards": [],
    "diffs": [],
    "damageTiers": [
      {
        "minDamage": 10000000,
        "gold": 100000,
        "name": "1 千萬",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 50000000,
        "gold": 500000,
        "name": "5 千萬",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 2,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 100000000,
        "gold": 1000000,
        "name": "1 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 3,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 200000000,
        "gold": 2000000,
        "name": "2 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 4,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 500000000,
        "gold": 5000000,
        "name": "5 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 5,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "shiningMirror",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-shiningMirror",
            "name": "閃耀鏡射方塊",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 1000000000,
        "gold": 10000000,
        "name": "10 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 10,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "shiningMirror",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-shiningMirror",
            "name": "閃耀鏡射方塊",
            "amount": 2,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 2000000000,
        "gold": 20000000,
        "name": "20 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 15,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "shiningMirror",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-shiningMirror",
            "name": "閃耀鏡射方塊",
            "amount": 3,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "dazzling",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-dazzling",
            "name": "閃炫方塊",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 5000000000,
        "gold": 50000000,
        "name": "50 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 20,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "shiningMirror",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-shiningMirror",
            "name": "閃耀鏡射方塊",
            "amount": 4,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "dazzling",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-dazzling",
            "name": "閃炫方塊",
            "amount": 2,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 10000000000,
        "gold": 100000000,
        "name": "100 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "restore",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-restore",
            "name": "恢復方塊",
            "amount": 30,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "shiningMirror",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-shiningMirror",
            "name": "閃耀鏡射方塊",
            "amount": 5,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "dazzling",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-dazzling",
            "name": "閃炫方塊",
            "amount": 3,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "equal",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-equal",
            "name": "新對等方塊",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 20000000000,
        "gold": 200000000,
        "name": "200 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "shiningMirror",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-shiningMirror",
            "name": "閃耀鏡射方塊",
            "amount": 6,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "dazzling",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-dazzling",
            "name": "閃炫方塊",
            "amount": 4,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "equal",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-equal",
            "name": "新對等方塊",
            "amount": 2,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 50000000000,
        "gold": 500000000,
        "name": "500 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "shiningMirror",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-shiningMirror",
            "name": "閃耀鏡射方塊",
            "amount": 8,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "dazzling",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-dazzling",
            "name": "閃炫方塊",
            "amount": 5,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "equal",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-equal",
            "name": "新對等方塊",
            "amount": 3,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 100000000000,
        "gold": 1000000000,
        "name": "1000 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "shiningMirror",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-shiningMirror",
            "name": "閃耀鏡射方塊",
            "amount": 10,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "dazzling",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-dazzling",
            "name": "閃炫方塊",
            "amount": 10,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "cube",
            "scrollId": "",
            "cubeId": "equal",
            "hammerId": "",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-cube-equal",
            "name": "新對等方塊",
            "amount": 5,
            "chance": 100
          }
        ]
      }
    ]
  },
  {
    "id": "boss-raid",
    "name": "BOSS 討伐",
    "type": "boss",
    "category": "boss",
    "enabled": true,
    "ticketId": "idle-ticket-boss",
    "ticketName": "BOSS 副本入場券",
    "durationSec": 0,
    "mobLevel": 100,
    "reqLevel": 0,
    "useFieldDrops": false,
    "useFieldGold": false,
    "dmgRampRef": 100000,
    "dmgRampPower": 0.5,
    "map": {
      "name": "BOSS 討伐",
      "artId": "",
      "mobs": [
        {
          "name": "副本怪物",
          "icon": ""
        }
      ],
      "mobName": "副本怪物",
      "mobIcon": "",
      "bossName": "副本 BOSS",
      "bossIcon": "",
      "baseMobHp": 100,
      "baseBossHp": 1800,
      "mobAtk1Dmg": 5,
      "mobAtk1Cd": 0.6,
      "mobAtk2Dmg": 0,
      "mobAtk2Cd": 0,
      "mobAtk3Dmg": 0,
      "mobAtk3Cd": 0,
      "mobSkill1Dmg": 0,
      "mobSkill1Cd": 8,
      "mobSkill2Dmg": 0,
      "mobSkill2Cd": 0,
      "mobSkill3Dmg": 0,
      "mobSkill3Cd": 0,
      "bossAtk1Dmg": 15,
      "bossAtk1Cd": 2,
      "bossAtk2Dmg": 0,
      "bossAtk2Cd": 0,
      "bossAtk3Dmg": 0,
      "bossAtk3Cd": 0,
      "bossSkill1Dmg": 0,
      "bossSkill1Cd": 10,
      "bossSkill2Dmg": 0,
      "bossSkill2Cd": 0,
      "bossSkill3Dmg": 0,
      "bossSkill3Cd": 0
    },
    "mobDrops": [],
    "rewards": [],
    "diffs": [
      {
        "id": "1",
        "name": "難度 1",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 0,
        "clearGold": 15000,
        "hpMult": 5,
        "dmgMult": 1,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "2",
        "name": "難度 2",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 0,
        "clearGold": 40000,
        "hpMult": 12,
        "dmgMult": 1,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "3",
        "name": "難度 3",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 0,
        "clearGold": 100000,
        "hpMult": 25,
        "dmgMult": 1,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      }
    ],
    "damageTiers": []
  },
  {
    "id": "dungeon-1788558107888",
    "name": "咒文副本",
    "type": "timed",
    "category": "gold",
    "enabled": true,
    "ticketId": "idle-ticket-timed",
    "ticketName": "計時副本入場券",
    "durationSec": 120,
    "mobLevel": 100,
    "reqLevel": 0,
    "useFieldDrops": false,
    "useFieldGold": false,
    "dmgRampRef": 100000,
    "dmgRampPower": 0.5,
    "map": {
      "name": "新副本",
      "artId": "library",
      "mobs": [
        {
          "name": "下級魔法書",
          "icon": "3501004"
        },
        {
          "name": "上級魔法書",
          "icon": "3501005"
        }
      ],
      "mobName": "下級魔法書",
      "mobIcon": "3501004",
      "bossName": "副本 BOSS",
      "bossIcon": "",
      "baseMobHp": 50000,
      "baseBossHp": 1800,
      "mobAtk1Dmg": 1000,
      "mobAtk1Cd": 1,
      "mobAtk2Dmg": 0,
      "mobAtk2Cd": 0,
      "mobAtk3Dmg": 0,
      "mobAtk3Cd": 0,
      "mobSkill1Dmg": 0,
      "mobSkill1Cd": 8,
      "mobSkill2Dmg": 0,
      "mobSkill2Cd": 0,
      "mobSkill3Dmg": 0,
      "mobSkill3Cd": 0,
      "bossAtk1Dmg": 15,
      "bossAtk1Cd": 2,
      "bossAtk2Dmg": 0,
      "bossAtk2Cd": 0,
      "bossAtk3Dmg": 0,
      "bossAtk3Cd": 0,
      "bossSkill1Dmg": 0,
      "bossSkill1Cd": 10,
      "bossSkill2Dmg": 0,
      "bossSkill2Cd": 0,
      "bossSkill3Dmg": 0,
      "bossSkill3Cd": 0
    },
    "mobDrops": [
      {
        "kind": "etc",
        "itemId": "spell_trace",
        "name": "咒文的痕跡",
        "amount": 1,
        "chance": 100
      }
    ],
    "rewards": [],
    "diffs": [
      {
        "id": "1",
        "name": "難度 1",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 0,
        "clearGold": 0,
        "hpMult": 1,
        "dmgMult": 1,
        "dropAmountMult": 1,
        "dropRateMult": 1,
        "rewards": []
      },
      {
        "id": "2",
        "name": "難度 2",
        "reqLevel": 0,
        "killNeed": 0,
        "settleGoldPerKill": 0,
        "clearGold": 0,
        "hpMult": 5,
        "dmgMult": 3,
        "dropAmountMult": 2,
        "dropRateMult": 1,
        "rewards": []
      }
    ],
    "damageTiers": []
  },
  {
    "id": "dungeon-1788560331269",
    "name": "鐵鎚拳擊機",
    "type": "damage",
    "category": "material",
    "enabled": true,
    "ticketId": "idle-ticket-damage",
    "ticketName": "計時副本入場券",
    "durationSec": 90,
    "mobLevel": 300,
    "reqLevel": 60,
    "useFieldDrops": false,
    "useFieldGold": false,
    "dmgRampRef": 100000,
    "dmgRampPower": 0.5,
    "map": {
      "name": "鐵鎚場地",
      "artId": "Boxingring",
      "mobs": [
        {
          "name": "副本怪物1",
          "icon": ""
        }
      ],
      "mobName": "副本怪物1",
      "mobIcon": "",
      "bossName": "鐵鎚拳擊機",
      "bossIcon": "9833910",
      "baseMobHp": 100,
      "baseBossHp": 1859999999,
      "mobAtk1Dmg": 5,
      "mobAtk1Cd": 0.6,
      "mobAtk2Dmg": 0,
      "mobAtk2Cd": 0,
      "mobAtk3Dmg": 0,
      "mobAtk3Cd": 0,
      "mobSkill1Dmg": 0,
      "mobSkill1Cd": 8,
      "mobSkill2Dmg": 0,
      "mobSkill2Cd": 0,
      "mobSkill3Dmg": 0,
      "mobSkill3Cd": 0,
      "bossAtk1Dmg": 500,
      "bossAtk1Cd": 2,
      "bossAtk2Dmg": 0,
      "bossAtk2Cd": 0,
      "bossAtk3Dmg": 0,
      "bossAtk3Cd": 0,
      "bossSkill1Dmg": 0,
      "bossSkill1Cd": 10,
      "bossSkill2Dmg": 0,
      "bossSkill2Cd": 0,
      "bossSkill3Dmg": 0,
      "bossSkill3Cd": 0
    },
    "mobDrops": [],
    "rewards": [],
    "diffs": [],
    "damageTiers": [
      {
        "minDamage": 10000000,
        "gold": 10000,
        "name": "1 千萬",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "hammer",
            "scrollId": "",
            "cubeId": "",
            "hammerId": "platinum",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-hammer-platinum",
            "name": "白金鐵鎚",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 100000000,
        "gold": 50000,
        "name": "1 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "hammer",
            "scrollId": "",
            "cubeId": "",
            "hammerId": "platinum",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-hammer-platinum",
            "name": "白金鐵鎚",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 500000000,
        "gold": 100000,
        "name": "5 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "hammer",
            "scrollId": "",
            "cubeId": "",
            "hammerId": "platinum",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-hammer-platinum",
            "name": "白金鐵鎚",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 2000000000,
        "gold": 200000,
        "name": "20 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "hammer",
            "scrollId": "",
            "cubeId": "",
            "hammerId": "platinum",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-hammer-platinum",
            "name": "白金鐵鎚",
            "amount": 2,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 5000000000,
        "gold": 500000,
        "name": "50 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "hammer",
            "scrollId": "",
            "cubeId": "",
            "hammerId": "platinum",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-hammer-platinum",
            "name": "白金鐵鎚",
            "amount": 2,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 10000000000,
        "gold": 1000000,
        "name": "100 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "hammer",
            "scrollId": "",
            "cubeId": "",
            "hammerId": "platinum",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-hammer-platinum",
            "name": "白金鐵鎚",
            "amount": 3,
            "chance": 100
          },
          {
            "kind": "consume",
            "consumeType": "hammer",
            "scrollId": "",
            "cubeId": "",
            "hammerId": "golden",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-hammer-golden",
            "name": "黃金鐵鎚",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 20000000000,
        "gold": 2000000,
        "name": "200 億",
        "rewards": [
          {
            "kind": "consume",
            "consumeType": "hammer",
            "scrollId": "",
            "cubeId": "",
            "hammerId": "golden",
            "soulId": "",
            "itemId": "",
            "catalogId": "consume-hammer-golden",
            "name": "黃金鐵鎚",
            "amount": 2,
            "chance": 100
          }
        ]
      }
    ]
  },
  {
    "id": "dungeon-1788388853627",
    "name": "滅龍進階材料",
    "type": "damage",
    "category": "material",
    "enabled": true,
    "ticketId": "idle-ticket-damage",
    "ticketName": "傷害副本入場券",
    "durationSec": 120,
    "mobLevel": 120,
    "reqLevel": 100,
    "useFieldDrops": false,
    "useFieldGold": false,
    "dmgRampRef": 1000000,
    "dmgRampPower": 0.5,
    "map": {
      "name": "暗黑龍王的巢穴",
      "artId": "dragonnest-10001",
      "mobs": [
        {
          "name": "副本怪物1",
          "icon": ""
        }
      ],
      "mobName": "副本怪物1",
      "mobIcon": "",
      "bossName": "暗黑龍王的左側頭顱",
      "bossIcon": "8810000",
      "baseMobHp": 100,
      "baseBossHp": 100000000000000000000,
      "mobAtk1Dmg": 5,
      "mobAtk1Cd": 0.6,
      "mobAtk2Dmg": 0,
      "mobAtk2Cd": 0,
      "mobAtk3Dmg": 0,
      "mobAtk3Cd": 0,
      "mobSkill1Dmg": 0,
      "mobSkill1Cd": 8,
      "mobSkill2Dmg": 0,
      "mobSkill2Cd": 0,
      "mobSkill3Dmg": 0,
      "mobSkill3Cd": 0,
      "bossAtk1Dmg": 1500,
      "bossAtk1Cd": 0,
      "bossAtk2Dmg": 1500,
      "bossAtk2Cd": 3,
      "bossAtk3Dmg": 0,
      "bossAtk3Cd": 0,
      "bossSkill1Dmg": 1500,
      "bossSkill1Cd": 5,
      "bossSkill2Dmg": 1500,
      "bossSkill2Cd": 5,
      "bossSkill3Dmg": 0,
      "bossSkill3Cd": 0
    },
    "mobDrops": [],
    "rewards": [
      {
        "kind": "etc",
        "itemId": "spell_trace",
        "name": "咒文的痕跡",
        "amount": 1,
        "chance": 100
      }
    ],
    "diffs": [],
    "damageTiers": [
      {
        "minDamage": 1000000000,
        "gold": 1000000,
        "name": "10 億",
        "rewards": [
          {
            "kind": "etc",
            "itemId": "black_dragon_iron",
            "name": "黑龍鐵塊",
            "amount": 1,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 5000000000,
        "gold": 5000000,
        "name": "50 億",
        "rewards": [
          {
            "kind": "etc",
            "itemId": "black_dragon_iron",
            "name": "黑龍鐵塊",
            "amount": 2,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 10000000000,
        "gold": 10000000,
        "name": "100 億",
        "rewards": [
          {
            "kind": "etc",
            "itemId": "black_dragon_iron",
            "name": "黑龍鐵塊",
            "amount": 4,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 20000000000,
        "gold": 20000000,
        "name": "200 億",
        "rewards": [
          {
            "kind": "etc",
            "itemId": "black_dragon_iron",
            "name": "黑龍鐵塊",
            "amount": 8,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 50000000000,
        "gold": 50000000,
        "name": "500 億",
        "rewards": [
          {
            "kind": "etc",
            "itemId": "black_dragon_iron",
            "name": "黑龍鐵塊",
            "amount": 16,
            "chance": 100
          }
        ]
      },
      {
        "minDamage": 100000000000,
        "gold": 100000000,
        "name": "1000 億",
        "rewards": [
          {
            "kind": "etc",
            "itemId": "black_dragon_iron",
            "name": "黑龍鐵塊",
            "amount": 32,
            "chance": 100
          }
        ]
      }
    ]
  }
];

if (typeof window !== 'undefined') window.IDLE_DUNGEON_LIST = IDLE_DUNGEON_LIST;
