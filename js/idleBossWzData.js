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
            "animMs": 1560,
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
            "animMs": 2590,
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
            "animMs": 1800,
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
            "animMs": 1600,
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
          "skill1": 1508,
          "skill2": 1500,
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
            "animMs": 1790,
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
            "animMs": 1900,
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
            "animMs": 1600,
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
          "skill1": 1508,
          "skill2": 1500,
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
            "animMs": 1495,
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
            "animMs": 2355,
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
            "animMs": 0,
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
            "animMs": 0,
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
            "animMs": 1495,
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
            "animMs": 2355,
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
            "animMs": 0,
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
            "animMs": 0,
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
            "animMs": 2130,
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
          "skill1": 1500
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
            "animMs": 2490,
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
            "animMs": 1500,
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
            "animMs": 1500,
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
            "animMs": 2360,
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
            "animMs": 1500,
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
            "animMs": 2660,
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
            "animMs": 1800,
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
