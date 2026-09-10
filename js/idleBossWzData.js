/** 由 scripts/import-boss-wz.mjs 從 wz-xml/boss/ 產生。不要手改。 */
const IDLE_BOSS_WZ = {
  "0": {
    "listId": "0",
    "name": "巴洛古",
    "parts": [
      {
        "role": "body",
        "mobId": "8830000",
        "z": 10,
        "level": 70,
        "maxHP": 4280000,
        "maxMP": 30000,
        "PADamage": 580,
        "MADamage": 583,
        "PDDamage": 200,
        "MDDamage": 320,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 49,
        "eva": 36,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100,
        "mpRecovery": 100,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 5,
            "elemAttr": "",
            "animMs": 3960,
            "dmg": 583
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "F",
            "animMs": 3210,
            "dmg": 583
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 3,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "animMs": 2760,
            "dmg": 580
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "",
            "level": 18,
            "animMs": 2040,
            "dmg": 583
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 133,
            "action": 1,
            "level": 3,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill16": 810,
          "skill1": 2280
        }
      },
      {
        "role": "hand",
        "mobId": "8830001",
        "z": 30,
        "handIndex": 0,
        "level": 70,
        "maxHP": 2640000,
        "maxMP": 3000,
        "PADamage": 589,
        "MADamage": 565,
        "PDDamage": 500,
        "MDDamage": 250,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 49,
        "eva": 36,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100,
        "mpRecovery": 100,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 3,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "animMs": 2520,
            "dmg": 589
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "",
            "animMs": 3480,
            "dmg": 565
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 1,
            "level": 159,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 200,
            "action": 1,
            "level": 160,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 5550
        }
      },
      {
        "role": "hand",
        "mobId": "8830002",
        "z": 31,
        "handIndex": 1,
        "level": 70,
        "maxHP": 3060000,
        "maxMP": 30000,
        "PADamage": 606,
        "MADamage": 607,
        "PDDamage": 250,
        "MDDamage": 150,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 49,
        "eva": 36,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100,
        "mpRecovery": 100,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 3,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "animMs": 2520,
            "dmg": 606
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "",
            "disease": 132,
            "level": 3,
            "animMs": 3600,
            "dmg": 607
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "",
            "animMs": 2280,
            "dmg": 607
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "head",
        "mobId": "8830003",
        "z": 20,
        "level": 70,
        "maxHP": 9980000,
        "maxMP": 0,
        "PADamage": 570,
        "MADamage": 586,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 49,
        "eva": 36,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 0,
        "attacks": [],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 1,
            "level": 161,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2880,
          "skill16": 2760
        }
      }
    ],
    "extraMobs": [
      "8830004",
      "8830005",
      "8830006",
      "8830014"
    ],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "1": {
    "listId": "1",
    "name": "殘暴炎魔",
    "parts": [
      {
        "role": "body",
        "mobId": "9451120",
        "z": 10,
        "level": 150,
        "maxHP": 896500000,
        "maxMP": 45000,
        "PADamage": 13280,
        "MADamage": 5880,
        "PDDamage": 1000,
        "MDDamage": 1100,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 200,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 5000,
        "mpRecovery": 100,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 100,
            "elemAttr": "",
            "animMs": 4190,
            "dmg": 5880
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "L",
            "disease": 120,
            "level": 4,
            "animMs": 3400,
            "dmg": 5880
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 47,
            "type": 3,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "disease": 123,
            "level": 3,
            "animMs": 3200,
            "dmg": 6241
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 140,
            "action": 1,
            "level": 1,
            "effectAfter": 176
          },
          {
            "index": 1,
            "skill": 141,
            "action": 1,
            "level": 1,
            "effectAfter": 176
          },
          {
            "index": 2,
            "skill": 114,
            "action": 2,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 133,
            "action": 1,
            "level": 8,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 134,
            "action": 2,
            "level": 3,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2308,
          "skill2": 2300,
          "skill3": 1504
        }
      },
      {
        "role": "body",
        "mobId": "9451121",
        "z": 10,
        "level": 150,
        "maxHP": 1102000000,
        "maxMP": 52500,
        "PADamage": 14980,
        "MADamage": 6360,
        "PDDamage": 1100,
        "MDDamage": 1300,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 200,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 10000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 100,
            "elemAttr": "",
            "animMs": 2590,
            "dmg": 6360
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "L",
            "disease": 120,
            "level": 4,
            "animMs": 2700,
            "dmg": 6360
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 44,
            "type": 3,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "disease": 123,
            "level": 3,
            "animMs": 2400,
            "dmg": 6591
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 140,
            "action": 1,
            "level": 1,
            "effectAfter": 176
          },
          {
            "index": 1,
            "skill": 141,
            "action": 1,
            "level": 1,
            "effectAfter": 176
          },
          {
            "index": 2,
            "skill": 114,
            "action": 2,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 127,
            "action": 2,
            "level": 16,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 127,
            "action": 2,
            "level": 17,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 133,
            "action": 1,
            "level": 8,
            "effectAfter": 0
          },
          {
            "index": 6,
            "skill": 134,
            "action": 2,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 7,
            "skill": 132,
            "action": 1,
            "level": 9,
            "effectAfter": 0
          },
          {
            "index": 8,
            "skill": 128,
            "action": 1,
            "level": 16,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2308,
          "skill2": 2300,
          "skill3": 1504
        }
      },
      {
        "role": "body",
        "mobId": "9451122",
        "z": 10,
        "level": 150,
        "maxHP": 1527500000,
        "maxMP": 60000,
        "PADamage": 16190,
        "MADamage": 6800,
        "PDDamage": 1200,
        "MDDamage": 1500,
        "PDRate": 60,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 20000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 100,
            "elemAttr": "",
            "animMs": 1790,
            "dmg": 6800
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "L",
            "disease": 120,
            "level": 4,
            "animMs": 1900,
            "dmg": 6800
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 50,
            "type": 3,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "disease": 123,
            "level": 3,
            "animMs": 1600,
            "dmg": 8095
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 140,
            "action": 1,
            "level": 1,
            "effectAfter": 176
          },
          {
            "index": 1,
            "skill": 141,
            "action": 1,
            "level": 1,
            "effectAfter": 176
          },
          {
            "index": 2,
            "skill": 114,
            "action": 2,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 127,
            "action": 2,
            "level": 16,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 127,
            "action": 2,
            "level": 17,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 133,
            "action": 1,
            "level": 8,
            "effectAfter": 0
          },
          {
            "index": 6,
            "skill": 134,
            "action": 2,
            "level": 4,
            "effectAfter": 0
          },
          {
            "index": 7,
            "skill": 132,
            "action": 1,
            "level": 10,
            "effectAfter": 0
          },
          {
            "index": 8,
            "skill": 128,
            "action": 1,
            "level": 16,
            "effectAfter": 0
          },
          {
            "index": 9,
            "skill": 132,
            "action": 1,
            "level": 9,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1508,
          "skill2": 1500,
          "skill3": 1504
        }
      },
      {
        "role": "hand",
        "mobId": "9451123",
        "z": 30,
        "handIndex": 0,
        "level": 150,
        "maxHP": 627000000,
        "maxMP": 27000,
        "PADamage": 3500,
        "MADamage": 3040,
        "PDDamage": 800,
        "MDDamage": 800,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 20000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 4075,
            "dmg": 3040
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 4935,
            "dmg": 3040
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 132,
            "level": 8,
            "animMs": 4075,
            "dmg": 3040
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 127,
            "level": 16,
            "animMs": 4075,
            "dmg": 3040
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "hand",
        "mobId": "9451124",
        "z": 31,
        "handIndex": 1,
        "level": 150,
        "maxHP": 627000000,
        "maxMP": 27000,
        "PADamage": 3500,
        "MADamage": 3040,
        "PDDamage": 800,
        "MDDamage": 800,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 20000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 4075,
            "dmg": 3040
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 4935,
            "dmg": 3040
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 132,
            "level": 9,
            "animMs": 4075,
            "dmg": 3040
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 127,
            "level": 17,
            "animMs": 4075,
            "dmg": 3040
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "hand",
        "mobId": "9451125",
        "z": 32,
        "handIndex": 2,
        "level": 150,
        "maxHP": 418000000,
        "maxMP": 27000,
        "PADamage": 3860,
        "MADamage": 3420,
        "PDDamage": 800,
        "MDDamage": 950,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 20000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "F",
            "animMs": 4710,
            "dmg": 3420
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 131,
            "action": 1,
            "level": 10,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 131,
            "action": 1,
            "level": 11,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2230
        }
      },
      {
        "role": "hand",
        "mobId": "9451126",
        "z": 33,
        "handIndex": 3,
        "level": 150,
        "maxHP": 418000000,
        "maxMP": 27000,
        "PADamage": 3860,
        "MADamage": 3420,
        "PDDamage": 800,
        "MDDamage": 950,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 20000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 3,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 5070,
            "dmg": 3860
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "L",
            "disease": 164,
            "level": 1,
            "animMs": 4810,
            "dmg": 3420
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "L",
            "disease": 135,
            "level": 3,
            "animMs": 4810,
            "dmg": 3420
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "hand",
        "mobId": "9451127",
        "z": 34,
        "handIndex": 4,
        "level": 150,
        "maxHP": 522500000,
        "maxMP": 27000,
        "PADamage": 4120,
        "MADamage": 3840,
        "PDDamage": 1050,
        "MDDamage": 1050,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 20000,
        "mpRecovery": 1000,
        "attacks": [],
        "skills": [
          {
            "index": 0,
            "skill": 120,
            "action": 1,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 121,
            "action": 2,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 124,
            "action": 3,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 122,
            "action": 4,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 128,
            "action": 4,
            "level": 16,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2660,
          "skill2": 2660,
          "skill3": 2660,
          "skill4": 2660
        }
      },
      {
        "role": "hand",
        "mobId": "9451128",
        "z": 35,
        "handIndex": 5,
        "level": 150,
        "maxHP": 570000000,
        "maxMP": 27000,
        "PADamage": 4120,
        "MADamage": 3840,
        "PDDamage": 1050,
        "MDDamage": 1050,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 20000,
        "mpRecovery": 1000,
        "attacks": [],
        "skills": [
          {
            "index": 0,
            "skill": 110,
            "action": 1,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 111,
            "action": 1,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 112,
            "action": 1,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 113,
            "action": 1,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 114,
            "action": 2,
            "level": 37,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2660,
          "skill2": 2660,
          "skill3": 2660,
          "skill4": 2660
        }
      },
      {
        "role": "hand",
        "mobId": "9451129",
        "z": 36,
        "handIndex": 6,
        "level": 140,
        "maxHP": 480700000,
        "maxMP": 27000,
        "PADamage": 3500,
        "MADamage": 3600,
        "PDDamage": 1050,
        "MDDamage": 750,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 30000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 4940,
            "dmg": 3500
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 1,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 5800,
            "dmg": 3500
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "hand",
        "mobId": "9451130",
        "z": 37,
        "handIndex": 7,
        "level": 150,
        "maxHP": 404800000,
        "maxMP": 27000,
        "PADamage": 3500,
        "MADamage": 3600,
        "PDDamage": 1050,
        "MDDamage": 750,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 550,
        "eva": 0,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 30000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 5240,
            "dmg": 3500
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 1,
            "magic": false,
            "conMP": 10,
            "elemAttr": "",
            "disease": 164,
            "level": 1,
            "animMs": 6100,
            "dmg": 3500
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      }
    ],
    "extraMobs": [],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "2": {
    "listId": "2",
    "name": "暗黑龍王",
    "parts": [
      {
        "role": "head",
        "mobId": "8810000",
        "z": 20,
        "level": 160,
        "maxHP": 330000000,
        "maxMP": 43000,
        "PADamage": 14500,
        "MADamage": 5300,
        "PDDamage": 1760,
        "MDDamage": 1840,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "I",
            "animMs": 5880,
            "dmg": 5300
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 3,
            "magic": false,
            "conMP": 1,
            "elemAttr": "I",
            "animMs": 5180,
            "dmg": 14500
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 4,
            "magic": false,
            "conMP": 1,
            "elemAttr": "I",
            "animMs": 5180,
            "dmg": 14500
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 2,
            "level": 58,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 200,
            "action": 2,
            "level": 59,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 200,
            "action": 2,
            "level": 60,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 128,
            "action": 3,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 128,
            "action": 3,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 128,
            "action": 3,
            "level": 3,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 5180,
          "skill2": 5180,
          "skill3": 2380
        }
      },
      {
        "role": "head",
        "mobId": "8810001",
        "z": 20,
        "level": 160,
        "maxHP": 330000000,
        "maxMP": 43000,
        "PADamage": 14500,
        "MADamage": 5300,
        "PDDamage": 1760,
        "MDDamage": 1840,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 5000,
        "mpRecovery": 100,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "L",
            "animMs": 5880,
            "dmg": 5300
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 1,
            "elemAttr": "L",
            "animMs": 5180,
            "dmg": 5300
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "L",
            "animMs": 5180,
            "dmg": 5300
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 2,
            "level": 58,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 200,
            "action": 2,
            "level": 59,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 200,
            "action": 2,
            "level": 60,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 128,
            "action": 3,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 128,
            "action": 3,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 128,
            "action": 3,
            "level": 3,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 5180,
          "skill2": 5180,
          "skill3": 2380
        }
      },
      {
        "role": "body",
        "mobId": "8810002",
        "z": 50,
        "level": 160,
        "maxHP": 330000000,
        "maxMP": 43000,
        "PADamage": 14500,
        "MADamage": 5300,
        "PDDamage": 1760,
        "MDDamage": 1840,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "I",
            "animMs": 3220,
            "dmg": 5300
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 4,
            "magic": false,
            "conMP": 1,
            "elemAttr": "I",
            "animMs": 2040,
            "dmg": 14500
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 37,
            "type": 0,
            "magic": false,
            "conMP": 1,
            "elemAttr": "I",
            "animMs": 2040,
            "dmg": 5365
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 2,
            "level": 53,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 200,
            "action": 2,
            "level": 54,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 200,
            "action": 2,
            "level": 55,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2240,
          "skill2": 1960
        }
      },
      {
        "role": "body",
        "mobId": "8810003",
        "z": 60,
        "level": 160,
        "maxHP": 490000000,
        "maxMP": 49000,
        "PADamage": 2000,
        "MADamage": 1600,
        "PDDamage": 1840,
        "MDDamage": 1920,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "F",
            "animMs": 3640,
            "dmg": 1600
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 3,
            "magic": false,
            "conMP": 1,
            "elemAttr": "F",
            "animMs": 1800,
            "dmg": 2000
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "F",
            "animMs": 2100,
            "dmg": 1600
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 2,
            "level": 53,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 200,
            "action": 2,
            "level": 54,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 200,
            "action": 2,
            "level": 55,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1960,
          "skill2": 1960,
          "skill3": 1820
        }
      },
      {
        "role": "body",
        "mobId": "8810004",
        "z": 50,
        "level": 160,
        "maxHP": 330000000,
        "maxMP": 43000,
        "PADamage": 14500,
        "MADamage": 5300,
        "PDDamage": 1760,
        "MDDamage": 1840,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "L",
            "animMs": 3360,
            "dmg": 5300
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 1,
            "elemAttr": "L",
            "animMs": 2040,
            "dmg": 5300
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 1,
            "elemAttr": "L",
            "animMs": 2040,
            "dmg": 5300
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 2,
            "level": 53,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 200,
            "action": 2,
            "level": 54,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 200,
            "action": 2,
            "level": 55,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2240,
          "skill2": 1960
        }
      },
      {
        "role": "hand",
        "mobId": "8810005",
        "z": 40,
        "handIndex": 0,
        "level": 160,
        "maxHP": 230000000,
        "maxMP": 35000,
        "PADamage": 7300,
        "MADamage": 2200,
        "PDDamage": 1350,
        "MDDamage": 1450,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "animMs": 5040,
            "dmg": 2200
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 112,
            "action": 2,
            "level": 4,
            "effectAfter": 1120
          },
          {
            "index": 1,
            "skill": 128,
            "action": 3,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 128,
            "action": 3,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 128,
            "action": 3,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 128,
            "action": 3,
            "level": 4,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 128,
            "action": 3,
            "level": 5,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2380,
          "skill2": 2240,
          "skill3": 2240
        }
      },
      {
        "role": "hand",
        "mobId": "8810006",
        "z": 40,
        "handIndex": 1,
        "level": 160,
        "maxHP": 230000000,
        "maxMP": 35000,
        "PADamage": 7300,
        "MADamage": 2200,
        "PDDamage": 1350,
        "MDDamage": 1450,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 5,
            "elemAttr": "",
            "animMs": 5040,
            "dmg": 2200
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 120,
            "action": 1,
            "level": 8,
            "effectAfter": 2380
          },
          {
            "index": 1,
            "skill": 121,
            "action": 1,
            "level": 4,
            "effectAfter": 2380
          },
          {
            "index": 2,
            "skill": 113,
            "action": 2,
            "level": 4,
            "effectAfter": 1120
          },
          {
            "index": 3,
            "skill": 128,
            "action": 3,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 128,
            "action": 3,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 128,
            "action": 3,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 6,
            "skill": 128,
            "action": 3,
            "level": 4,
            "effectAfter": 0
          },
          {
            "index": 7,
            "skill": 128,
            "action": 3,
            "level": 5,
            "effectAfter": 0
          },
          {
            "index": 8,
            "skill": 122,
            "action": 1,
            "level": 6,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2380,
          "skill2": 3920,
          "skill3": 2240
        }
      },
      {
        "role": "body",
        "mobId": "8810007",
        "z": 20,
        "level": 160,
        "maxHP": 270000000,
        "maxMP": 400000,
        "PADamage": 7000,
        "MADamage": 2400,
        "PDDamage": 1440,
        "MDDamage": 1640,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 1,
            "level": 56,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 200,
            "action": 1,
            "level": 57,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 114,
            "action": 2,
            "level": 9,
            "effectAfter": 840
          },
          {
            "index": 3,
            "skill": 114,
            "action": 2,
            "level": 10,
            "effectAfter": 840
          },
          {
            "index": 4,
            "skill": 110,
            "action": 3,
            "level": 5,
            "effectAfter": 1260
          },
          {
            "index": 5,
            "skill": 111,
            "action": 3,
            "level": 4,
            "effectAfter": 1260
          }
        ],
        "skillAnimMs": {
          "skill1": 5180,
          "skill2": 4620,
          "skill3": 4620
        }
      },
      {
        "role": "body",
        "mobId": "8810008",
        "z": 30,
        "level": 160,
        "maxHP": 130000000,
        "maxMP": 38000,
        "PADamage": 10700,
        "MADamage": 2500,
        "PDDamage": 1380,
        "MDDamage": 1580,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 70,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 5180,
            "dmg": 7490
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 70,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 123,
            "level": 10,
            "animMs": 2380,
            "dmg": 7490
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 70,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 4820,
            "dmg": 7490
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 70,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 123,
            "level": 10,
            "animMs": 2380,
            "dmg": 7490
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "body",
        "mobId": "8810009",
        "z": 10,
        "level": 160,
        "maxHP": 80000000,
        "maxMP": 26000,
        "PADamage": 24500,
        "MADamage": 2500,
        "PDDamage": 1430,
        "MDDamage": 1630,
        "PDRate": 40,
        "MDRate": 40,
        "acc": 550,
        "eva": 169,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 23,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 5160,
            "dmg": 5635
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 131,
            "action": 1,
            "level": 4,
            "effectAfter": 1820
          }
        ],
        "skillAnimMs": {
          "skill1": 2070
        }
      }
    ],
    "extraMobs": [
      "8810010",
      "8810011",
      "8810012",
      "8810013",
      "8810014",
      "8810015",
      "8810016",
      "8810017",
      "8810018"
    ],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "4": {
    "listId": "4",
    "name": "比艾樂",
    "parts": [
      {
        "role": "body",
        "mobId": "8900000",
        "z": 20,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 108000,
        "PADamage": 35000,
        "MADamage": 35000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 80,
        "MDRate": 80,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 10000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 132,
            "level": 11,
            "animMs": 1050,
            "dmg": 35000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 123,
            "level": 44,
            "animMs": 1500,
            "dmg": 35000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 201,
            "action": 1,
            "level": 40,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 120
        }
      },
      {
        "role": "body",
        "mobId": "8900001",
        "z": 20,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 108000,
        "PADamage": 35000,
        "MADamage": 35000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 80,
        "MDRate": 80,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 10000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 126,
            "level": 20,
            "animMs": 780,
            "dmg": 35000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 1260,
            "dmg": 35000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 170,
            "action": 1,
            "level": 10,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1080
        }
      },
      {
        "role": "body",
        "mobId": "8900002",
        "z": 21,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 108000,
        "PADamage": 35000,
        "MADamage": 35000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 80,
        "MDRate": 80,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 10000,
        "attacks": [],
        "skills": [],
        "skillAnimMs": {}
      }
    ],
    "extraMobs": [
      "8900003"
    ],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "5": {
    "listId": "5",
    "name": "班班",
    "parts": [
      {
        "role": "body",
        "mobId": "8910000",
        "z": 20,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 100000,
        "PADamage": 30000,
        "MADamage": 30000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 100,
        "MDRate": 100,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 10000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 123,
            "level": 43,
            "animMs": 1530,
            "dmg": 30000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 2,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2340,
            "dmg": 30000
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 6,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 1650,
            "dmg": 30000
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 126,
            "level": 20,
            "animMs": 1260,
            "dmg": 30000
          },
          {
            "index": 4,
            "action": 5,
            "actionKey": "attack5",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 126,
            "level": 20,
            "animMs": 600,
            "dmg": 30000
          },
          {
            "index": 5,
            "action": 6,
            "actionKey": "attack6",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 126,
            "level": 20,
            "animMs": 600,
            "dmg": 30000
          },
          {
            "index": 6,
            "action": 7,
            "actionKey": "attack7",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 126,
            "level": 20,
            "animMs": 600,
            "dmg": 30000
          },
          {
            "index": 7,
            "action": 8,
            "actionKey": "attack8",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 126,
            "level": 20,
            "animMs": 720,
            "dmg": 30000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 203,
            "action": 1,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 184,
            "action": 2,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 170,
            "action": 3,
            "level": 11,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 191,
            "action": 4,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 191,
            "action": 5,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 170,
            "action": 6,
            "level": 14,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1440,
          "skill2": 2340,
          "skill3": 600,
          "skill4": 30,
          "skill5": 30,
          "skill6": 600
        }
      },
      {
        "role": "body",
        "mobId": "8910001",
        "z": 22,
        "level": 190,
        "maxHP": 800000000,
        "maxMP": 100000,
        "PADamage": 30000,
        "MADamage": 30000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 100,
        "MDRate": 100,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": false,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 50,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 120,
            "level": 11,
            "animMs": 1530,
            "dmg": 15000
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      }
    ],
    "extraMobs": [],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "6": {
    "listId": "6",
    "name": "血腥女皇",
    "parts": [
      {
        "role": "body",
        "mobId": "8920000",
        "z": 20,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 15000000,
        "PADamage": 20400,
        "MADamage": 20400,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 120,
        "MDRate": 120,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 0,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 120,
            "level": 11,
            "animMs": 2280,
            "dmg": 20400
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 201,
            "action": 1,
            "level": 47,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 201,
            "action": 2,
            "level": 48,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 201,
            "action": 3,
            "level": 52,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 201,
            "action": 4,
            "level": 53,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2880,
          "skill2": 3060,
          "skill3": 120,
          "skill4": 120,
          "skill5": 120
        }
      },
      {
        "role": "body",
        "mobId": "8920001",
        "z": 20,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 15000000,
        "PADamage": 20400,
        "MADamage": 20400,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 120,
        "MDRate": 120,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 0,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 132,
            "level": 11,
            "animMs": 2280,
            "dmg": 20400
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 1800,
            "dmg": 20400
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 720,
            "dmg": 20400
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 600,
            "dmg": 20400
          },
          {
            "index": 4,
            "action": 5,
            "actionKey": "attack5",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 600,
            "dmg": 20400
          },
          {
            "index": 5,
            "action": 6,
            "actionKey": "attack6",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 1440,
            "dmg": 20400
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 186,
            "action": 1,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 201,
            "action": 2,
            "level": 51,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 201,
            "action": 3,
            "level": 53,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2280,
          "skill2": 120,
          "skill3": 120,
          "skill4": 120
        }
      },
      {
        "role": "body",
        "mobId": "8920002",
        "z": 20,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 15000000,
        "PADamage": 20400,
        "MADamage": 20400,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 120,
        "MDRate": 120,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 0,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 136,
            "level": 6,
            "animMs": 2280,
            "dmg": 20400
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 205,
            "level": 1,
            "animMs": 4500,
            "dmg": 20400
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 183,
            "action": 1,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 201,
            "action": 2,
            "level": 51,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 201,
            "action": 3,
            "level": 52,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2190,
          "skill2": 120,
          "skill3": 120,
          "skill4": 120
        }
      }
    ],
    "extraMobs": [
      "8920004",
      "8920005"
    ],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "7": {
    "listId": "7",
    "name": "貝倫",
    "parts": [
      {
        "role": "body",
        "mobId": "8930000",
        "z": 20,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 64500,
        "PADamage": 46000,
        "MADamage": 36000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 200,
        "MDRate": 200,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 4350,
            "dmg": 46000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2490,
            "dmg": 46000
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2280,
            "dmg": 46000
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2190,
            "dmg": 46000
          },
          {
            "index": 4,
            "action": 5,
            "actionKey": "attack5",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2100,
            "dmg": 46000
          },
          {
            "index": 5,
            "action": 6,
            "actionKey": "attack6",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2220,
            "dmg": 46000
          },
          {
            "index": 6,
            "action": 7,
            "actionKey": "attack7",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 123,
            "level": 43,
            "animMs": 3300,
            "dmg": 46000
          },
          {
            "index": 7,
            "action": 8,
            "actionKey": "attack8",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 4290,
            "dmg": 46000
          },
          {
            "index": 8,
            "action": 9,
            "actionKey": "attack9",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 6210,
            "dmg": 46000
          },
          {
            "index": 9,
            "action": 10,
            "actionKey": "attack10",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 1440,
            "dmg": 46000
          },
          {
            "index": 10,
            "action": 11,
            "actionKey": "attack11",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 840,
            "dmg": 46000
          },
          {
            "index": 11,
            "action": 12,
            "actionKey": "attack12",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2220,
            "dmg": 46000
          },
          {
            "index": 12,
            "action": 13,
            "actionKey": "attack13",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 123,
            "level": 43,
            "animMs": 1890,
            "dmg": 46000
          },
          {
            "index": 13,
            "action": 14,
            "actionKey": "attack14",
            "attackRatio": 100,
            "type": 4,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 131,
            "level": 17,
            "animMs": 3180,
            "dmg": 46000
          },
          {
            "index": 14,
            "action": 15,
            "actionKey": "attack15",
            "attackRatio": 100,
            "type": 4,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 131,
            "level": 17,
            "animMs": 3180,
            "dmg": 46000
          },
          {
            "index": 15,
            "action": 16,
            "actionKey": "attack16",
            "attackRatio": 100,
            "type": 4,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 131,
            "level": 17,
            "animMs": 3990,
            "dmg": 46000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 170,
            "action": 1,
            "level": 13,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2000
        }
      },
      {
        "role": "body",
        "mobId": "8930001",
        "z": 22,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 64500,
        "PADamage": 46000,
        "MADamage": 36000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 200,
        "MDRate": 200,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 3960,
            "dmg": 46000
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      }
    ],
    "extraMobs": [],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "10": {
    "listId": "10",
    "name": "梅格耐斯",
    "parts": [
      {
        "role": "body",
        "mobId": "8880000",
        "z": 20,
        "level": 190,
        "maxHP": 2000000000,
        "maxMP": 100000,
        "PADamage": 22000,
        "MADamage": 24000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 120,
        "MDRate": 120,
        "acc": 9999,
        "eva": 750,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 10000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 1560,
            "dmg": 24000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 2040,
            "dmg": 24000
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "animMs": 2760,
            "dmg": 24000
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 7200,
            "dmg": 22000
          },
          {
            "index": 4,
            "action": 5,
            "actionKey": "attack5",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 5730,
            "dmg": 22000
          },
          {
            "index": 5,
            "action": 6,
            "actionKey": "attack6",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "disease": 126,
            "level": 61,
            "animMs": 2070,
            "dmg": 22000
          },
          {
            "index": 6,
            "action": 7,
            "actionKey": "attack7",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "disease": 133,
            "level": 32,
            "animMs": 1920,
            "dmg": 22000
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      }
    ],
    "extraMobs": [],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "11": {
    "listId": "11",
    "name": "粉紅豆豆",
    "parts": [
      {
        "role": "body",
        "mobId": "8820000",
        "z": 20,
        "level": 160,
        "maxHP": 1,
        "maxMP": 1000,
        "PADamage": 6802,
        "MADamage": 7126,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 650,
        "eva": 225,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 500,
        "attacks": [],
        "skills": [
          {
            "index": 0,
            "skill": 114,
            "action": 1,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 100,
            "action": 2,
            "level": 8,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 200,
            "action": 3,
            "level": 102,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 102,
            "action": 4,
            "level": 4,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 103,
            "action": 5,
            "level": 3,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 110,
            "action": 6,
            "level": 7,
            "effectAfter": 0
          },
          {
            "index": 6,
            "skill": 111,
            "action": 7,
            "level": 6,
            "effectAfter": 0
          },
          {
            "index": 7,
            "skill": 112,
            "action": 8,
            "level": 5,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 7050,
          "skill2": 8730,
          "skill3": 10800,
          "skill4": 13350,
          "skill5": 12600,
          "skill6": 12750,
          "skill7": 14760,
          "skill8": 14340
        }
      },
      {
        "role": "body",
        "mobId": "8820001",
        "z": 20,
        "level": 160,
        "maxHP": 2100000000,
        "maxMP": 50000,
        "PADamage": 23100,
        "MADamage": 11500,
        "PDDamage": 1700,
        "MDDamage": 1930,
        "PDRate": 70,
        "MDRate": 70,
        "acc": 650,
        "eva": 625,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 1000000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 5,
            "elemAttr": "",
            "disease": 123,
            "level": 7,
            "animMs": 3240,
            "dmg": 11500
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 52,
            "type": 0,
            "magic": false,
            "conMP": 1,
            "elemAttr": "",
            "disease": 132,
            "level": 1,
            "animMs": 2880,
            "dmg": 12012
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 5,
            "elemAttr": "",
            "disease": 128,
            "level": 7,
            "animMs": 2400,
            "dmg": 11500
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 1,
            "elemAttr": "",
            "disease": 120,
            "level": 10,
            "animMs": 2520,
            "dmg": 23100
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 200,
            "action": 1,
            "level": 101,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 133,
            "action": 3,
            "level": 1,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2280,
          "skill2": 2400,
          "skill3": 2880
        }
      },
      {
        "role": "hand",
        "mobId": "8820002",
        "z": 30,
        "handIndex": 0,
        "level": 160,
        "maxHP": 1580000000,
        "maxMP": 50000,
        "PADamage": 21700,
        "MADamage": 13500,
        "PDDamage": 1700,
        "MDDamage": 1980,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 650,
        "eva": 225,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 5,
            "elemAttr": "",
            "disease": 121,
            "level": 8,
            "animMs": 3960,
            "dmg": 13500
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 5,
            "elemAttr": "",
            "disease": 123,
            "level": 12,
            "animMs": 2760,
            "dmg": 13500
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 133,
            "action": 1,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 114,
            "action": 2,
            "level": 25,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 131,
            "action": 2,
            "level": 4,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 2520,
          "skill2": 2400
        }
      },
      {
        "role": "hand",
        "mobId": "8820003",
        "z": 31,
        "handIndex": 1,
        "level": 160,
        "maxHP": 800000000,
        "maxMP": 50000,
        "PADamage": 16500,
        "MADamage": 4700,
        "PDDamage": 1540,
        "MDDamage": 1810,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 650,
        "eva": 225,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 5,
            "elemAttr": "",
            "disease": 123,
            "level": 7,
            "animMs": 2160,
            "dmg": 16500
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 5,
            "elemAttr": "L",
            "disease": 120,
            "level": 9,
            "animMs": 2400,
            "dmg": 4700
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 39,
            "type": 0,
            "magic": false,
            "conMP": 5,
            "elemAttr": "",
            "disease": 126,
            "level": 2,
            "animMs": 2280,
            "dmg": 6435
          }
        ],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "hand",
        "mobId": "8820004",
        "z": 32,
        "handIndex": 2,
        "level": 160,
        "maxHP": 800000000,
        "maxMP": 50000,
        "PADamage": 17500,
        "MADamage": 4500,
        "PDDamage": 1580,
        "MDDamage": 1830,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 650,
        "eva": 225,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 5,
            "elemAttr": "",
            "disease": 133,
            "level": 1,
            "animMs": 2160,
            "dmg": 4500
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 5,
            "elemAttr": "L",
            "disease": 121,
            "level": 4,
            "animMs": 2400,
            "dmg": 4500
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 43,
            "type": 0,
            "magic": false,
            "conMP": 5,
            "elemAttr": "",
            "disease": 125,
            "level": 9,
            "animMs": 2280,
            "dmg": 7525
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 132,
            "action": 1,
            "level": 2,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1920
        }
      },
      {
        "role": "hand",
        "mobId": "8820005",
        "z": 33,
        "handIndex": 3,
        "level": 160,
        "maxHP": 1185000000,
        "maxMP": 50000,
        "PADamage": 19900,
        "MADamage": 6400,
        "PDDamage": 1600,
        "MDDamage": 1860,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 650,
        "eva": 225,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 5,
            "elemAttr": "F",
            "disease": 126,
            "level": 5,
            "animMs": 1920,
            "dmg": 6400
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 38,
            "type": 3,
            "magic": false,
            "conMP": 5,
            "elemAttr": "",
            "disease": 133,
            "level": 1,
            "animMs": 2760,
            "dmg": 7562
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 120,
            "action": 2,
            "level": 8,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 122,
            "action": 2,
            "level": 6,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1680,
          "skill2": 1920
        }
      },
      {
        "role": "hand",
        "mobId": "8820006",
        "z": 34,
        "handIndex": 4,
        "level": 160,
        "maxHP": 1185000000,
        "maxMP": 50000,
        "PADamage": 20400,
        "MADamage": 7200,
        "PDDamage": 1580,
        "MDDamage": 1880,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 650,
        "eva": 225,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 100000,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 5,
            "elemAttr": "I",
            "disease": 132,
            "level": 1,
            "animMs": 1920,
            "dmg": 7200
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 37,
            "type": 3,
            "magic": false,
            "conMP": 5,
            "elemAttr": "",
            "disease": 123,
            "level": 12,
            "animMs": 2760,
            "dmg": 7548
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 129,
            "action": 1,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 128,
            "action": 2,
            "level": 10,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 122,
            "action": 2,
            "level": 6,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1680,
          "skill2": 1920
        }
      },
      {
        "role": "body",
        "mobId": "8820010",
        "z": 0,
        "level": 1,
        "maxHP": 300000000,
        "maxMP": 0,
        "PADamage": 3,
        "MADamage": 1,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 650,
        "eva": 0,
        "bodyAttack": false,
        "firstAttack": false,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 0,
        "attacks": [],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "body",
        "mobId": "8820011",
        "z": 0,
        "level": 1,
        "maxHP": 600000000,
        "maxMP": 0,
        "PADamage": 3,
        "MADamage": 1,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 650,
        "eva": 0,
        "bodyAttack": false,
        "firstAttack": false,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 0,
        "attacks": [],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "body",
        "mobId": "8820012",
        "z": 0,
        "level": 1,
        "maxHP": 1050000000,
        "maxMP": 0,
        "PADamage": 3,
        "MADamage": 1,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 650,
        "eva": 0,
        "bodyAttack": false,
        "firstAttack": false,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 0,
        "attacks": [],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "body",
        "mobId": "8820013",
        "z": 0,
        "level": 1,
        "maxHP": 1500000000,
        "maxMP": 0,
        "PADamage": 3,
        "MADamage": 1,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 650,
        "eva": 0,
        "bodyAttack": false,
        "firstAttack": false,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 0,
        "attacks": [],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "body",
        "mobId": "8820014",
        "z": 0,
        "level": 1,
        "maxHP": 5550000000,
        "maxMP": 0,
        "PADamage": 3,
        "MADamage": 1,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 650,
        "eva": 0,
        "bodyAttack": false,
        "firstAttack": false,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 0,
        "attacks": [],
        "skills": [],
        "skillAnimMs": {}
      }
    ],
    "extraMobs": [
      "8820008",
      "8820009",
      "8820019",
      "8820020",
      "8820021",
      "8820022",
      "8820023"
    ],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "12": {
    "listId": "12",
    "name": "西格諾斯",
    "parts": [
      {
        "role": "body",
        "mobId": "8850111",
        "z": 20,
        "level": 140,
        "maxHP": 2100000000,
        "maxMP": 90000,
        "PADamage": 20000,
        "MADamage": 25000,
        "PDDamage": 1700,
        "MDDamage": 1930,
        "PDRate": 100,
        "MDRate": 100,
        "acc": 723,
        "eva": 625,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 5280,
            "dmg": 25000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 2,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 2340,
            "dmg": 25000
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 10,
            "elemAttr": "",
            "disease": 131,
            "level": 13,
            "animMs": 2580,
            "dmg": 25000
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 3,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "disease": 173,
            "level": 1,
            "animMs": 4920,
            "dmg": 20000
          },
          {
            "index": 4,
            "action": 5,
            "actionKey": "attack5",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 5280,
            "dmg": 25000
          },
          {
            "index": 5,
            "action": 6,
            "actionKey": "attack6",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 5280,
            "dmg": 25000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 133,
            "action": 3,
            "level": 27,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 129,
            "action": 1,
            "level": 13,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 201,
            "action": 2,
            "level": 159,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 172,
            "action": 4,
            "level": 1,
            "effectAfter": 1260
          },
          {
            "index": 4,
            "skill": 200,
            "action": 5,
            "level": 222,
            "effectAfter": 0
          },
          {
            "index": 5,
            "skill": 171,
            "action": 7,
            "level": 1,
            "effectAfter": 630
          },
          {
            "index": 6,
            "skill": 201,
            "action": 5,
            "level": 158,
            "effectAfter": 0
          },
          {
            "index": 7,
            "skill": 201,
            "action": 2,
            "level": 160,
            "effectAfter": 0
          },
          {
            "index": 8,
            "skill": 114,
            "action": 7,
            "level": 43,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1620,
          "skill2": 3120,
          "skill3": 3360,
          "skill4": 2340,
          "skill5": 3120,
          "skill6": 2640,
          "skill7": 1980
        }
      },
      {
        "role": "hand",
        "mobId": "8850110",
        "z": 25,
        "handIndex": 0,
        "level": 140,
        "maxHP": 400000000,
        "maxMP": 25000,
        "PADamage": 7000,
        "MADamage": 6000,
        "PDDamage": 170,
        "MDDamage": 210,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 723,
        "eva": 205,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 1000,
        "attacks": [],
        "skills": [
          {
            "index": 0,
            "skill": 114,
            "action": 2,
            "level": 42,
            "effectAfter": 480
          },
          {
            "index": 1,
            "skill": 146,
            "action": 1,
            "level": 1,
            "effectAfter": 980
          }
        ],
        "skillAnimMs": {
          "skill1": 1680,
          "skill2": 1800
        }
      },
      {
        "role": "hand",
        "mobId": "8850100",
        "z": 30,
        "handIndex": 1,
        "level": 140,
        "maxHP": 1050000000,
        "maxMP": 72500,
        "PADamage": 21500,
        "MADamage": 14000,
        "PDDamage": 170,
        "MDDamage": 210,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 723,
        "eva": 225,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 2,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 1620,
            "dmg": 21500
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 1560,
            "dmg": 21500
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 35,
            "type": 0,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "disease": 121,
            "level": 15,
            "animMs": 1710,
            "dmg": 7525
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 100,
            "action": 1,
            "level": 25,
            "effectAfter": 480
          }
        ],
        "skillAnimMs": {
          "skill1": 2160
        }
      },
      {
        "role": "hand",
        "mobId": "8850101",
        "z": 30,
        "handIndex": 2,
        "level": 140,
        "maxHP": 1050000000,
        "maxMP": 72500,
        "PADamage": 20000,
        "MADamage": 18000,
        "PDDamage": 170,
        "MDDamage": 210,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 723,
        "eva": 225,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 0,
            "elemAttr": "",
            "disease": 131,
            "level": 13,
            "animMs": 2220,
            "dmg": 18000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 1920,
            "dmg": 18000
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 2790,
            "dmg": 18000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 120,
            "action": 2,
            "level": 19,
            "effectAfter": 480
          },
          {
            "index": 1,
            "skill": 170,
            "action": 1,
            "level": 5,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 201,
            "action": 3,
            "level": 161,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 480,
          "skill2": 2040,
          "skill3": 540
        }
      },
      {
        "role": "hand",
        "mobId": "8850102",
        "z": 30,
        "handIndex": 3,
        "level": 140,
        "maxHP": 1050000000,
        "maxMP": 72500,
        "PADamage": 20000,
        "MADamage": 15000,
        "PDDamage": 170,
        "MDDamage": 210,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 723,
        "eva": 225,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 2,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2040,
            "dmg": 20000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 1620,
            "dmg": 20000
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 1920,
            "dmg": 15000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 146,
            "action": 1,
            "level": 2,
            "effectAfter": 990
          }
        ],
        "skillAnimMs": {
          "skill1": 990
        }
      },
      {
        "role": "hand",
        "mobId": "8850103",
        "z": 30,
        "handIndex": 4,
        "level": 140,
        "maxHP": 1050000000,
        "maxMP": 72500,
        "PADamage": 20500,
        "MADamage": 14500,
        "PDDamage": 170,
        "MDDamage": 210,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 723,
        "eva": 205,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 18,
            "type": 0,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 2250,
            "dmg": 2610
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 2,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 2040,
            "dmg": 20500
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 50,
            "type": 2,
            "magic": false,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 1800,
            "dmg": 10250
          },
          {
            "index": 3,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": true,
            "conMP": 2,
            "elemAttr": "",
            "animMs": 2460,
            "dmg": 14500
          }
        ],
        "skills": [],
        "skillAnimMs": {
          "skill1": 620
        }
      },
      {
        "role": "hand",
        "mobId": "8850104",
        "z": 30,
        "handIndex": 5,
        "level": 140,
        "maxHP": 1050000000,
        "maxMP": 72500,
        "PADamage": 21000,
        "MADamage": 14000,
        "PDDamage": 170,
        "MDDamage": 210,
        "PDRate": 60,
        "MDRate": 60,
        "acc": 723,
        "eva": 500,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 1000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 2,
            "magic": true,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2250,
            "dmg": 14000
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2070,
            "dmg": 21000
          },
          {
            "index": 2,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 2790,
            "dmg": 21000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 100,
            "action": 1,
            "level": 25,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 1710,
          "skill2": 540
        }
      }
    ],
    "extraMobs": [],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "18": {
    "listId": "18",
    "name": "濃姬",
    "parts": [
      {
        "role": "body",
        "mobId": "9450023",
        "z": 20,
        "level": 190,
        "maxHP": 2100000000,
        "maxMP": 100000,
        "PADamage": 52000,
        "MADamage": 52000,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 30,
        "MDRate": 30,
        "acc": 600,
        "eva": 170,
        "bodyAttack": false,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 0,
        "attacks": [
          {
            "index": 0,
            "action": 3,
            "actionKey": "attack3",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 132,
            "level": 19,
            "animMs": 2160,
            "dmg": 52000
          },
          {
            "index": 1,
            "action": 4,
            "actionKey": "attack4",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "disease": 137,
            "level": 4,
            "animMs": 2160,
            "dmg": 52000
          },
          {
            "index": 2,
            "action": 6,
            "actionKey": "attack6",
            "attackRatio": 100,
            "type": 101,
            "magic": false,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 9120,
            "dmg": 52000
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 0,
            "action": 1,
            "level": 0,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 0,
            "action": 2,
            "level": 0,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 0,
            "action": 4,
            "level": 0,
            "effectAfter": 0
          }
        ],
        "skillAnimMs": {
          "skill1": 3120,
          "skill2": 3120,
          "skill4": 2070
        }
      }
    ],
    "extraMobs": [
      "9450022",
      "9450040"
    ],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  },
  "22": {
    "listId": "22",
    "name": "拉圖斯",
    "parts": [
      {
        "role": "body",
        "mobId": "8500000",
        "z": 20,
        "level": 125,
        "maxHP": 539925,
        "maxMP": 12000,
        "PADamage": 1574,
        "MADamage": 1531,
        "PDDamage": 1000,
        "MDDamage": 1100,
        "PDRate": 25,
        "MDRate": 25,
        "acc": 250,
        "eva": 250,
        "bodyAttack": true,
        "firstAttack": false,
        "boss": true,
        "hpRecovery": 5000,
        "mpRecovery": 100,
        "attacks": [],
        "skills": [],
        "skillAnimMs": {}
      },
      {
        "role": "body",
        "mobId": "8500001",
        "z": 20,
        "level": 125,
        "maxHP": 300000000,
        "maxMP": 2000000,
        "PADamage": 3806,
        "MADamage": 3625,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 423,
        "eva": 423,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 10000,
        "mpRecovery": 50000,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 3,
            "magic": true,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 3120,
            "dmg": 3625
          },
          {
            "index": 1,
            "action": 2,
            "actionKey": "attack2",
            "attackRatio": 100,
            "type": 0,
            "magic": false,
            "conMP": 100,
            "elemAttr": "",
            "animMs": 2220,
            "dmg": 3806
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 241,
            "action": 1,
            "level": 1,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 241,
            "action": 1,
            "level": 2,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 201,
            "action": 5,
            "level": 235,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 241,
            "action": 2,
            "level": 7,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 241,
            "action": 3,
            "level": 6,
            "effectAfter": 0,
            "onlyOtherSkill": true
          },
          {
            "index": 5,
            "skill": 241,
            "action": 4,
            "level": 6,
            "effectAfter": 0,
            "onlyOtherSkill": true
          }
        ],
        "skillAnimMs": {
          "skill1": 1800,
          "skill2": 2880,
          "skill3": 3240,
          "skill4": 1440,
          "skill5": 3000
        }
      },
      {
        "role": "body",
        "mobId": "8500002",
        "z": 20,
        "level": 125,
        "maxHP": 100000000,
        "maxMP": 2000000,
        "PADamage": 3924,
        "MADamage": 3878,
        "PDDamage": 0,
        "MDDamage": 0,
        "PDRate": 50,
        "MDRate": 50,
        "acc": 423,
        "eva": 423,
        "bodyAttack": true,
        "firstAttack": true,
        "boss": true,
        "hpRecovery": 0,
        "mpRecovery": 0,
        "attacks": [
          {
            "index": 0,
            "action": 1,
            "actionKey": "attack1",
            "attackRatio": 100,
            "type": 2,
            "magic": true,
            "conMP": 0,
            "elemAttr": "",
            "animMs": 1890,
            "dmg": 3878
          }
        ],
        "skills": [
          {
            "index": 0,
            "skill": 201,
            "action": 1,
            "level": 233,
            "effectAfter": 0
          },
          {
            "index": 1,
            "skill": 105,
            "action": 2,
            "level": 16,
            "effectAfter": 0
          },
          {
            "index": 2,
            "skill": 241,
            "action": 3,
            "level": 4,
            "effectAfter": 0
          },
          {
            "index": 3,
            "skill": 241,
            "action": 4,
            "level": 9,
            "effectAfter": 0
          },
          {
            "index": 4,
            "skill": 241,
            "action": 5,
            "level": 6,
            "effectAfter": 0,
            "onlyOtherSkill": true
          },
          {
            "index": 5,
            "skill": 241,
            "action": 6,
            "level": 6,
            "effectAfter": 0,
            "onlyOtherSkill": true
          }
        ],
        "skillAnimMs": {
          "skill1": 1440,
          "skill2": 1560,
          "skill3": 1350,
          "skill4": 2880,
          "skill5": 3240,
          "skill6": 1440
        }
      }
    ],
    "extraMobs": [],
    "hpMult": 1,
    "dmgMult": 1,
    "cdMult": 1
  }
};

/** 本體受到傷害倍率：雙手都在=0（無敵），一隻手=0.5，雙手都死=1 */
function idleBossBodyIncomingMult(listId, livingHandCount) {
  const row = (typeof IDLE_BOSS_WZ !== 'undefined' ? IDLE_BOSS_WZ : {})[String(listId)];
  const rule = row && row.bodyMitigation;
  if (!rule || rule.type !== 'perLivingHand') return 1;
  const per = Number(rule.perLivingHandDr);
  const p = Number.isFinite(per) ? per : 0.5;
  const n = Math.max(0, Math.floor(Number(livingHandCount) || 0));
  const dr = Math.min(1, n * p);
  return Math.max(0, 1 - dr);
}
function idleBossLivingHandCount(partsState) {
  if (!partsState || typeof partsState !== 'object') return 0;
  return Object.keys(partsState).filter((k) => {
    const p = partsState[k];
    return p && p.role === 'hand' && !p.dead && (Number(p.hp) || 0) > 0;
  }).length;
}
if (typeof window !== 'undefined') {
  window.IDLE_BOSS_WZ = IDLE_BOSS_WZ;
  window.idleBossBodyIncomingMult = idleBossBodyIncomingMult;
  window.idleBossLivingHandCount = idleBossLivingHandCount;
}
