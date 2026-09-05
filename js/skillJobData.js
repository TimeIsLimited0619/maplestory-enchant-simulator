/** 由 scripts/import-skill-wz.mjs 產生，請勿手改。 */
const SkillJobData = {
  "books": {
    "100": {
      "jobId": 100,
      "name": "劍士",
      "rank": "10",
      "skillBook": 100,
      "skills": [
        {
          "id": "1000003",
          "name": "自身強化",
          "desc": "將自己的防禦力與最大HP以一定比率增加，並減少被敵人襲擊時受到的傷害。",
          "h": "增加#pddX防禦力，最大HP#mhpR%。被敵人攻擊時，傷害減少#damAbsorbShieldR%。",
          "rank": "10",
          "type": "passive",
          "equipable": false,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "20",
            "damAbsorbShieldR": "u(x/2)",
            "pddX": "10*x",
            "mhpR": "x"
          },
          "icon": "images/skills/100/1000003.png",
          "skillBook": 100
        },
        {
          "id": "1000009",
          "name": "戰鬥技能",
          "desc": "培養戰士的基本素養，增加移動速度與跳躍力、最大HP、最大移動速度，在敵人的攻擊下，有一定的機率不被擊退。",
          "h": "增加移動速度 #psdSpeed、跳躍力#psdJump、最大移動速度 #speedMax、每等級最大HP#lv2mhp、格擋機率#stanceProp%。",
          "rank": "10",
          "type": "passive",
          "equipable": false,
          "maxLevel": 20,
          "infoType": 40,
          "actions": [],
          "common": {
            "maxLevel": "20",
            "stanceProp": "x*2",
            "psdJump": "x/2",
            "psdSpeed": "2+x",
            "lv2mhp": "x",
            "speedMax": "x"
          },
          "icon": "images/skills/100/1000009.png",
          "skillBook": 100
        },
        {
          "id": "1001005",
          "name": "劍氣縱橫",
          "desc": "消耗MP同時攻擊周圍的大多數敵人。",
          "h": " 消耗MP #mpCon，用#damage% 傷害最多攻擊#mobCount位敵人 ",
          "rank": "10",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [
            "slashBlast",
            "slashBlast2"
          ],
          "common": {
            "mpCon": "3+d(x/6)",
            "damage": "175+8*x",
            "mobCount": "6",
            "attackCount": "1",
            "maxLevel": "20",
            "lt": "-285, -145",
            "rb": "10, 30"
          },
          "icon": "images/skills/100/1001005.png",
          "skillBook": 100,
          "fx": {
            "effect": [
              {
                "src": "images/skills/100/1001005/effect/0.png",
                "delay": 60,
                "origin": [
                  39,
                  115
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/1.png",
                "delay": 60,
                "origin": [
                  40,
                  115
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/2.png",
                "delay": 60,
                "origin": [
                  53,
                  115
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/3.png",
                "delay": 60,
                "origin": [
                  52,
                  118
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/4.png",
                "delay": 60,
                "origin": [
                  51,
                  118
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/5.png",
                "delay": 60,
                "origin": [
                  325,
                  170
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/6.png",
                "delay": 60,
                "origin": [
                  340,
                  162
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/7.png",
                "delay": 60,
                "origin": [
                  337,
                  158
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/8.png",
                "delay": 60,
                "origin": [
                  331,
                  154
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/9.png",
                "delay": 60,
                "origin": [
                  327,
                  154
                ]
              },
              {
                "src": "images/skills/100/1001005/effect/10.png",
                "delay": 60,
                "origin": [
                  317,
                  154
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/100/1001005/hit/0.png",
                "delay": 60,
                "origin": [
                  64,
                  70
                ]
              },
              {
                "src": "images/skills/100/1001005/hit/1.png",
                "delay": 60,
                "origin": [
                  69,
                  69
                ]
              },
              {
                "src": "images/skills/100/1001005/hit/2.png",
                "delay": 60,
                "origin": [
                  67,
                  74
                ]
              },
              {
                "src": "images/skills/100/1001005/hit/3.png",
                "delay": 60,
                "origin": [
                  69,
                  76
                ]
              },
              {
                "src": "images/skills/100/1001005/hit/4.png",
                "delay": 60,
                "origin": [
                  71,
                  79
                ]
              },
              {
                "src": "images/skills/100/1001005/hit/5.png",
                "delay": 60,
                "origin": [
                  70,
                  79
                ]
              }
            ]
          }
        },
        {
          "id": "1001010",
          "name": "躍進攻擊",
          "desc": "從空中急速地往地面降落，並襲擊敵人。\\n用下方向時，一定範圍內必須有腳踏處才可使用，和左右方向鍵同時使用時，可從對角線下降。\\n一起按下左右方向鍵/下方向鍵和攻擊鍵可取代技能。",
          "h": "消耗MP #mpCon，最多對#mobCount名的敵人以#damage%的傷害值進行攻擊#attackCount次",
          "rank": "10",
          "type": "active",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 12,
          "areaAttack": true,
          "actions": [
            "LeapAttack",
            "LeapAttack2"
          ],
          "common": {
            "maxLevel": "1",
            "damage": "89+x",
            "attackCount": "2",
            "mobCount": "4",
            "v": "45",
            "range": "400",
            "lt": "-170, -110",
            "rb": "30, 35",
            "mpCon": "5",
            "attackDelay": "510",
            "u": "400",
            "w": "120"
          },
          "icon": "images/skills/100/1001010.png",
          "skillBook": 100,
          "fx": {
            "effect": [
              {
                "src": "images/skills/100/1001010/effect/0.png",
                "delay": 60,
                "origin": [
                  217,
                  109
                ]
              },
              {
                "src": "images/skills/100/1001010/effect/1.png",
                "delay": 60,
                "origin": [
                  228,
                  130
                ]
              },
              {
                "src": "images/skills/100/1001010/effect/2.png",
                "delay": 60,
                "origin": [
                  232,
                  138
                ]
              },
              {
                "src": "images/skills/100/1001010/effect/3.png",
                "delay": 60,
                "origin": [
                  234,
                  142
                ]
              },
              {
                "src": "images/skills/100/1001010/effect/4.png",
                "delay": 60,
                "origin": [
                  232,
                  143
                ]
              },
              {
                "src": "images/skills/100/1001010/effect/5.png",
                "delay": 60,
                "origin": [
                  221,
                  98
                ]
              },
              {
                "src": "images/skills/100/1001010/effect/6.png",
                "delay": 60,
                "origin": [
                  218,
                  98
                ]
              },
              {
                "src": "images/skills/100/1001010/effect/7.png",
                "delay": 60,
                "origin": [
                  156,
                  81
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/100/1001010/effect0/0.png",
                "delay": 60,
                "origin": [
                  94,
                  100
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/1.png",
                "delay": 60,
                "origin": [
                  112,
                  106
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/2.png",
                "delay": 60,
                "origin": [
                  121,
                  108
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/3.png",
                "delay": 60,
                "origin": [
                  128,
                  110
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/4.png",
                "delay": 60,
                "origin": [
                  133,
                  111
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/5.png",
                "delay": 60,
                "origin": [
                  134,
                  106
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/6.png",
                "delay": 60,
                "origin": [
                  135,
                  106
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/7.png",
                "delay": 60,
                "origin": [
                  135,
                  106
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/8.png",
                "delay": 60,
                "origin": [
                  136,
                  106
                ]
              },
              {
                "src": "images/skills/100/1001010/effect0/9.png",
                "delay": 60,
                "origin": [
                  136,
                  105
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/100/1001010/hit/0.png",
                "delay": 60,
                "origin": [
                  49,
                  49
                ]
              },
              {
                "src": "images/skills/100/1001010/hit/1.png",
                "delay": 60,
                "origin": [
                  85,
                  63
                ]
              },
              {
                "src": "images/skills/100/1001010/hit/2.png",
                "delay": 60,
                "origin": [
                  98,
                  73
                ]
              },
              {
                "src": "images/skills/100/1001010/hit/3.png",
                "delay": 60,
                "origin": [
                  102,
                  76
                ]
              },
              {
                "src": "images/skills/100/1001010/hit/4.png",
                "delay": 60,
                "origin": [
                  92,
                  69
                ]
              },
              {
                "src": "images/skills/100/1001010/hit/5.png",
                "delay": 60,
                "origin": [
                  62,
                  63
                ]
              }
            ]
          }
        }
      ]
    },
    "110": {
      "jobId": 110,
      "name": "狂戰士",
      "rank": "30",
      "skillBook": 110,
      "skills": [
        {
          "id": "1100000",
          "name": "武器精通",
          "desc": "增加劍和斧頭的攻擊熟練度，提升最終傷害和爆擊機率。",
          "h": "劍與斧頭熟練度增加#mastery%，攻擊速度增加1階段，最終傷害增加#pdR%，爆擊機率增加#cr%\\n裝備斧頭時傷害增加5%",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "mastery": "10+4*x",
            "x": "24*x",
            "maxLevel": "10",
            "pdR": "x",
            "actionSpeed": "-1",
            "cr": "x+5"
          },
          "icon": "images/skills/110/1100000.png",
          "skillBook": 110
        },
        {
          "id": "1100002",
          "name": "終極攻擊",
          "desc": "使用依一定機率發動直接攻擊的攻擊技能後，發動追加攻擊。追加攻擊將優先攻擊最大HP最高的Boss怪物。但必須手持劍和斧頭時才能發動。",
          "h": "#c[終極攻擊系列技能]# #prop%機率發動可造成#damage%傷害的終極攻擊",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 20,
          "infoType": 53,
          "actions": [],
          "common": {
            "damage": "100+5*d(x/2)",
            "prop": "2*x",
            "maxLevel": "20"
          },
          "icon": "images/skills/110/1100002.png",
          "skillBook": 110,
          "fx": {
            "hit": [
              {
                "src": "images/skills/110/1100002/hit/0.png",
                "delay": 60,
                "origin": [
                  49,
                  78
                ]
              },
              {
                "src": "images/skills/110/1100002/hit/1.png",
                "delay": 60,
                "origin": [
                  64,
                  64
                ]
              },
              {
                "src": "images/skills/110/1100002/hit/2.png",
                "delay": 60,
                "origin": [
                  64,
                  72
                ]
              },
              {
                "src": "images/skills/110/1100002/hit/3.png",
                "delay": 60,
                "origin": [
                  64,
                  74
                ]
              },
              {
                "src": "images/skills/110/1100002/hit/4.png",
                "delay": 60,
                "origin": [
                  57,
                  76
                ]
              }
            ]
          }
        },
        {
          "id": "1100009",
          "name": "體能訓練",
          "desc": "透過鍛鍊身體，永久提升力量與敏捷。",
          "h": "永久增加力量 #strX、敏捷 #dexX ",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 5,
          "infoType": 50,
          "actions": [],
          "common": {
            "strX": "6*x",
            "dexX": "6*x",
            "maxLevel": "5"
          },
          "icon": "images/skills/110/1100009.png",
          "skillBook": 110
        },
        {
          "id": "1100013",
          "name": "鬥氣集中",
          "desc": "啟用後，每次攻擊時會有一定的機率累積鬥氣量，最多可堆疊五個鬥氣量。\\n#c鬥氣量特效開關：滑鼠右鍵#",
          "h": "每次攻擊時，以#prop%的機率累積鬥氣量\\n每一個鬥氣量增加攻擊力#y，最大鬥氣量#x",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 10,
          "actions": [],
          "common": {
            "x": "5",
            "prop": "40",
            "maxLevel": "1",
            "y": "2"
          },
          "icon": "images/skills/110/1100013.png",
          "skillBook": 110,
          "fx": {
            "special": {
              "frames": [
                {
                  "src": "images/skills/110/1100013/special/0.png",
                  "delay": 30,
                  "origin": [
                    72,
                    72
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/1.png",
                  "delay": 30,
                  "origin": [
                    62,
                    69
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/2.png",
                  "delay": 30,
                  "origin": [
                    50,
                    62
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/3.png",
                  "delay": 30,
                  "origin": [
                    43,
                    57
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/4.png",
                  "delay": 60,
                  "origin": [
                    80,
                    95
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/5.png",
                  "delay": 60,
                  "origin": [
                    84,
                    99
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/6.png",
                  "delay": 60,
                  "origin": [
                    85,
                    100
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/7.png",
                  "delay": 60,
                  "origin": [
                    83,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/8.png",
                  "delay": 60,
                  "origin": [
                    84,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/9.png",
                  "delay": 60,
                  "origin": [
                    83,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/10.png",
                  "delay": 60,
                  "origin": [
                    77,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/11.png",
                  "delay": 60,
                  "origin": [
                    78,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/12.png",
                  "delay": 90,
                  "origin": [
                    79,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/13.png",
                  "delay": 90,
                  "origin": [
                    80,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/14.png",
                  "delay": 90,
                  "origin": [
                    82,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/15.png",
                  "delay": 90,
                  "origin": [
                    83,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/16.png",
                  "delay": 90,
                  "origin": [
                    84,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/17.png",
                  "delay": 90,
                  "origin": [
                    83,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/18.png",
                  "delay": 90,
                  "origin": [
                    77,
                    81
                  ]
                },
                {
                  "src": "images/skills/110/1100013/special/19.png",
                  "delay": 90,
                  "origin": [
                    78,
                    81
                  ]
                }
              ],
              "repeat": 12,
              "relMove": [
                0,
                -40
              ]
            },
            "stateStart": [
              {
                "src": "images/skills/110/1100013/state/start/0.png",
                "delay": 30,
                "origin": [
                  22,
                  23
                ]
              },
              {
                "src": "images/skills/110/1100013/state/start/1.png",
                "delay": 30,
                "origin": [
                  27,
                  27
                ]
              },
              {
                "src": "images/skills/110/1100013/state/start/2.png",
                "delay": 30,
                "origin": [
                  29,
                  29
                ]
              },
              {
                "src": "images/skills/110/1100013/state/start/3.png",
                "delay": 30,
                "origin": [
                  31,
                  31
                ]
              },
              {
                "src": "images/skills/110/1100013/state/start/4.png",
                "delay": 30,
                "origin": [
                  31,
                  31
                ]
              },
              {
                "src": "images/skills/110/1100013/state/start/5.png",
                "delay": 30,
                "origin": [
                  29,
                  29
                ]
              }
            ],
            "state": {
              "0": [
                {
                  "src": "images/skills/110/1100013/state/0.png",
                  "delay": 120,
                  "origin": [
                    55,
                    55
                  ]
                }
              ],
              "1": [
                {
                  "src": "images/skills/110/1100013/state/1.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ],
              "2": [
                {
                  "src": "images/skills/110/1100013/state/2.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ],
              "3": [
                {
                  "src": "images/skills/110/1100013/state/3.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ],
              "4": [
                {
                  "src": "images/skills/110/1100013/state/4.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ],
              "5": [
                {
                  "src": "images/skills/110/1100013/state/5.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "1100015",
          "name": "極速武器",
          "desc": "提升攻擊速度和力量。",
          "h": "攻擊速度增加2階段，力量增加#strX",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "strX": "2*x",
            "actionSpeed": "-2"
          },
          "icon": "images/skills/110/1100015.png",
          "skillBook": 110
        },
        {
          "id": "1101006",
          "name": "激勵",
          "desc": "劍與靈魂合而為一，特定時間內增加包含自已在內的隊員攻擊力，增幅反射自己受到的傷害。",
          "h": "消耗MP#mpCon、#time秒內包含自己在內的隊員攻擊力增加#indiePad\\n被擊傷害減少#indiePowerGuard%後增加#y%反射",
          "rank": "30",
          "type": "buff",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [
            "furyNew"
          ],
          "common": {
            "mpCon": "4+8*u(x/10)",
            "indiePad": "10+x",
            "time": "80+6*x",
            "indiePowerGuard": "10+x",
            "y": "100+20*x",
            "lt": "-300, -200",
            "rb": "300, 200",
            "maxLevel": "20"
          },
          "icon": "images/skills/110/1101006.png",
          "skillBook": 110,
          "fx": {
            "effect": [
              {
                "src": "images/skills/110/1101006/effect/0.png",
                "delay": 60,
                "origin": [
                  148,
                  225
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/1.png",
                "delay": 60,
                "origin": [
                  146,
                  221
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/2.png",
                "delay": 60,
                "origin": [
                  143,
                  222
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/3.png",
                "delay": 60,
                "origin": [
                  140,
                  218
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/4.png",
                "delay": 60,
                "origin": [
                  136,
                  212
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/5.png",
                "delay": 60,
                "origin": [
                  137,
                  227
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/6.png",
                "delay": 60,
                "origin": [
                  157,
                  235
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/7.png",
                "delay": 60,
                "origin": [
                  136,
                  246
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/8.png",
                "delay": 60,
                "origin": [
                  152,
                  356
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/9.png",
                "delay": 60,
                "origin": [
                  152,
                  354
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/10.png",
                "delay": 60,
                "origin": [
                  147,
                  350
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/11.png",
                "delay": 60,
                "origin": [
                  128,
                  346
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/12.png",
                "delay": 60,
                "origin": [
                  130,
                  336
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/13.png",
                "delay": 60,
                "origin": [
                  131,
                  332
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/14.png",
                "delay": 60,
                "origin": [
                  132,
                  331
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/15.png",
                "delay": 60,
                "origin": [
                  108,
                  329
                ]
              },
              {
                "src": "images/skills/110/1101006/effect/16.png",
                "delay": 60,
                "origin": [
                  102,
                  324
                ]
              }
            ]
          }
        },
        {
          "id": "1101011",
          "name": "雙連斬",
          "desc": "#c[劍術]#連續兩次攻擊眼前的多名敵人。",
          "h": "消耗MP #mpCon，以 #damage% 傷害，最多對#mobCount位敵人進行#attackCount次攻擊",
          "rank": "30",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "areaAttack": true,
          "actions": [
            "brandishNew2",
            "brandishNew"
          ],
          "common": {
            "mpCon": "10+d(x/3)",
            "damage": "220+3*x",
            "mobCount": "6",
            "attackCount": "2",
            "ballDelay": "0",
            "ballDelay1": "420",
            "lt": "-290, -180",
            "rb": "10, 40",
            "maxLevel": "20",
            "q": "120",
            "q2": "120"
          },
          "icon": "images/skills/110/1101011.png",
          "skillBook": 110,
          "fx": {
            "effect": [
              {
                "src": "images/skills/110/1101011/effect/0.png",
                "delay": 180,
                "origin": [
                  11,
                  65
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/1.png",
                "delay": 60,
                "origin": [
                  311,
                  196
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/2.png",
                "delay": 60,
                "origin": [
                  296,
                  196
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/3.png",
                "delay": 60,
                "origin": [
                  294,
                  194
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/4.png",
                "delay": 60,
                "origin": [
                  295,
                  190
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/5.png",
                "delay": 60,
                "origin": [
                  270,
                  185
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/6.png",
                "delay": 60,
                "origin": [
                  272,
                  177
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/7.png",
                "delay": 60,
                "origin": [
                  274,
                  166
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/8.png",
                "delay": 60,
                "origin": [
                  263,
                  167
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/9.png",
                "delay": 60,
                "origin": [
                  253,
                  147
                ]
              },
              {
                "src": "images/skills/110/1101011/effect/10.png",
                "delay": 60,
                "origin": [
                  221,
                  48
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/110/1101011/hit/0.png",
                "delay": 60,
                "origin": [
                  80,
                  71
                ]
              },
              {
                "src": "images/skills/110/1101011/hit/1.png",
                "delay": 60,
                "origin": [
                  69,
                  70
                ]
              },
              {
                "src": "images/skills/110/1101011/hit/2.png",
                "delay": 60,
                "origin": [
                  74,
                  66
                ]
              },
              {
                "src": "images/skills/110/1101011/hit/3.png",
                "delay": 60,
                "origin": [
                  78,
                  69
                ]
              },
              {
                "src": "images/skills/110/1101011/hit/4.png",
                "delay": 60,
                "origin": [
                  80,
                  69
                ]
              },
              {
                "src": "images/skills/110/1101011/hit/5.png",
                "delay": 60,
                "origin": [
                  80,
                  60
                ]
              },
              {
                "src": "images/skills/110/1101011/hit/6.png",
                "delay": 60,
                "origin": [
                  79,
                  59
                ]
              },
              {
                "src": "images/skills/110/1101011/hit/7.png",
                "delay": 60,
                "origin": [
                  77,
                  59
                ]
              }
            ]
          }
        },
        {
          "id": "1101014",
          "name": "閃光斬",
          "desc": "如閃光般衝刺，斬擊路徑上的敵人。可配合方向鍵向8個方向衝刺。執行施展動作時不會被任何攻擊彈開。",
          "h": "消耗MP#mpCon，向敵人衝刺並對最多#mobCount名敵人造成#damage% 傷害並攻擊#attackCount次\\n閃光斬每#w2秒準備1次，可最多蓄積#w次",
          "rank": "30",
          "type": "active",
          "equipable": true,
          "maxLevel": 9,
          "infoType": 12,
          "areaAttack": true,
          "actions": [
            "flashSlash"
          ],
          "common": {
            "maxLevel": "9",
            "mpCon": "30",
            "damage": "100+5*x",
            "attackCount": "5",
            "mobCount": "6",
            "range": "600",
            "v": "80",
            "updatableTime": "1000",
            "u": "70",
            "y": "0",
            "subTime": "60",
            "w": "2",
            "w2": "4",
            "q": "536",
            "q2": "268",
            "s": "65",
            "s2": "0",
            "s3": "-10",
            "s4": "0",
            "s5": "0",
            "s6": "30",
            "s7": "0",
            "s8": "0"
          },
          "icon": "images/skills/110/1101014.png",
          "skillBook": 110,
          "areaCast": {
            "hitFrame": 8,
            "hitMs": 270,
            "layers": [
              "effect",
              "effect0",
              "special",
              "special0"
            ]
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/110/1101014/effect/0.png",
                "delay": 60,
                "origin": [
                  13,
                  66
                ]
              },
              {
                "src": "images/skills/110/1101014/effect/1.png",
                "delay": 30,
                "origin": [
                  577,
                  178
                ]
              },
              {
                "src": "images/skills/110/1101014/effect/2.png",
                "delay": 30,
                "origin": [
                  595,
                  159
                ]
              },
              {
                "src": "images/skills/110/1101014/effect/3.png",
                "delay": 30,
                "origin": [
                  602,
                  162
                ]
              },
              {
                "src": "images/skills/110/1101014/effect/4.png",
                "delay": 30,
                "origin": [
                  507,
                  167
                ]
              },
              {
                "src": "images/skills/110/1101014/effect/5.png",
                "delay": 30,
                "origin": [
                  487,
                  169
                ]
              },
              {
                "src": "images/skills/110/1101014/effect/6.png",
                "delay": 30,
                "origin": [
                  483,
                  168
                ]
              },
              {
                "src": "images/skills/110/1101014/effect/7.png",
                "delay": 30,
                "origin": [
                  481,
                  165
                ]
              },
              {
                "src": "images/skills/110/1101014/effect/8.png",
                "delay": 30,
                "origin": [
                  472,
                  146
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/110/1101014/hit/0.png",
                "delay": 60,
                "origin": [
                  169,
                  87
                ]
              },
              {
                "src": "images/skills/110/1101014/hit/1.png",
                "delay": 60,
                "origin": [
                  169,
                  86
                ]
              },
              {
                "src": "images/skills/110/1101014/hit/2.png",
                "delay": 60,
                "origin": [
                  106,
                  81
                ]
              },
              {
                "src": "images/skills/110/1101014/hit/3.png",
                "delay": 60,
                "origin": [
                  83,
                  74
                ]
              },
              {
                "src": "images/skills/110/1101014/hit/4.png",
                "delay": 60,
                "origin": [
                  60,
                  74
                ]
              },
              {
                "src": "images/skills/110/1101014/hit/5.png",
                "delay": 60,
                "origin": [
                  39,
                  74
                ]
              }
            ],
            "special": {
              "frames": [
                {
                  "src": "images/skills/110/1101014/special/0.png",
                  "delay": 60,
                  "origin": [
                    13,
                    66
                  ]
                },
                {
                  "src": "images/skills/110/1101014/special/1.png",
                  "delay": 90,
                  "origin": [
                    194,
                    121
                  ]
                },
                {
                  "src": "images/skills/110/1101014/special/2.png",
                  "delay": 90,
                  "origin": [
                    194,
                    123
                  ]
                },
                {
                  "src": "images/skills/110/1101014/special/3.png",
                  "delay": 90,
                  "origin": [
                    192,
                    123
                  ]
                },
                {
                  "src": "images/skills/110/1101014/special/4.png",
                  "delay": 90,
                  "origin": [
                    185,
                    123
                  ]
                },
                {
                  "src": "images/skills/110/1101014/special/5.png",
                  "delay": 90,
                  "origin": [
                    168,
                    112
                  ]
                },
                {
                  "src": "images/skills/110/1101014/special/6.png",
                  "delay": 90,
                  "origin": [
                    150,
                    89
                  ]
                }
              ],
              "repeat": 0,
              "relMove": [
                0,
                0
              ]
            }
          }
        }
      ]
    },
    "111": {
      "jobId": 111,
      "name": "十字軍",
      "rank": "60",
      "skillBook": 111,
      "skills": [
        {
          "id": "1110000",
          "name": "強化恢復",
          "desc": "每一定週期恢復 HP和 MP。戰鬥中也能進行恢復。",
          "h": "每#u秒恢復最大HP的#x%、以及最大MP的#y%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "x": "u(x/4)+1",
            "y": "u(x/4)+1",
            "hcHp": "4000*x",
            "u": "9-d(x/2)"
          },
          "icon": "images/skills/111/1110000.png",
          "skillBook": 111
        },
        {
          "id": "1110009",
          "name": "伺機攻擊",
          "desc": "攻擊變弱的敵人時，可造成更大的傷害。額外永久增加爆擊機率。",
          "h": "攻擊刺傷、無法行動的敵人時，最終傷害增加#x%\\n爆擊機率永久增加#cr%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 51,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "damage": "105+2*x",
            "x": "5+2*x",
            "cr": "2*x"
          },
          "icon": "images/skills/111/1110009.png",
          "skillBook": 111
        },
        {
          "id": "1110011",
          "name": "恢復術",
          "desc": "強化自身的狀態異常抵抗和所有屬性耐性。",
          "h": "增加狀態異常耐性#asrR、所有屬性耐性#terR%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 14,
          "infoType": 51,
          "actions": [],
          "common": {
            "asrR": "16+x",
            "terR": "16+x",
            "maxLevel": "14"
          },
          "icon": "images/skills/111/1110011.png",
          "skillBook": 111
        },
        {
          "id": "1110013",
          "name": "鬥氣綜合",
          "desc": "鬥氣每計數1，即可增加最終傷害，並提升鬥氣計數機率。",
          "h": "每次攻擊時，有#prop%的機率累積鬥氣量。每1個鬥氣量可增加#damR%最終傷害，鬥氣量間可以相加。受到攻擊時，有 #subProp%機率可以補充鬥氣量",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [
            "alert4"
          ],
          "common": {
            "prop": "40+2*x",
            "subProp": "10+x",
            "damR": "u(x/4)",
            "maxLevel": "20",
            "x": "5"
          },
          "icon": "images/skills/111/1110013.png",
          "skillBook": 111,
          "fx": {
            "state": {
              "0": [
                {
                  "src": "images/skills/111/1110013/state/0.png",
                  "delay": 120,
                  "origin": [
                    55,
                    55
                  ]
                }
              ],
              "1": [
                {
                  "src": "images/skills/111/1110013/state/1.png",
                  "delay": 120,
                  "origin": [
                    21,
                    21
                  ]
                }
              ],
              "2": [
                {
                  "src": "images/skills/111/1110013/state/2.png",
                  "delay": 120,
                  "origin": [
                    21,
                    21
                  ]
                }
              ],
              "3": [
                {
                  "src": "images/skills/111/1110013/state/3.png",
                  "delay": 120,
                  "origin": [
                    21,
                    21
                  ]
                }
              ],
              "4": [
                {
                  "src": "images/skills/111/1110013/state/4.png",
                  "delay": 120,
                  "origin": [
                    21,
                    21
                  ]
                }
              ],
              "5": [
                {
                  "src": "images/skills/111/1110013/state/5.png",
                  "delay": 120,
                  "origin": [
                    21,
                    21
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "1111003",
          "name": "傷痕之劍",
          "desc": "增強劍的銳氣，對敵人造成無法清除的疤痕。",
          "h": "消耗MP#mpCon、持續#time秒且過程中擊中敵人時，以#prop%的機率形成刺傷\\n受刺傷的敵人於#v秒內減少命中率#x%、攻擊力減少#w%",
          "rank": "60",
          "type": "buff",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [
            "panic"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "10+d(x/2)",
            "time": "80+6*x",
            "prop": "40+3*x",
            "x": "10+u(x/2)",
            "w": "10+x",
            "v": "20"
          },
          "icon": "images/skills/111/1111003.png",
          "skillBook": 111,
          "fx": {
            "effect": [
              {
                "src": "images/skills/111/1111003/effect/0.png",
                "delay": 90,
                "origin": [
                  91,
                  266
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/1.png",
                "delay": 90,
                "origin": [
                  141,
                  314
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/2.png",
                "delay": 90,
                "origin": [
                  129,
                  317
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/3.png",
                "delay": 90,
                "origin": [
                  141,
                  317
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/4.png",
                "delay": 90,
                "origin": [
                  146,
                  317
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/5.png",
                "delay": 90,
                "origin": [
                  148,
                  317
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/6.png",
                "delay": 90,
                "origin": [
                  148,
                  317
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/7.png",
                "delay": 90,
                "origin": [
                  148,
                  280
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/8.png",
                "delay": 90,
                "origin": [
                  262,
                  327
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/9.png",
                "delay": 90,
                "origin": [
                  214,
                  327
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/10.png",
                "delay": 90,
                "origin": [
                  212,
                  326
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/11.png",
                "delay": 90,
                "origin": [
                  186,
                  315
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/12.png",
                "delay": 90,
                "origin": [
                  189,
                  319
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/13.png",
                "delay": 90,
                "origin": [
                  189,
                  320
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/14.png",
                "delay": 90,
                "origin": [
                  189,
                  315
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/15.png",
                "delay": 90,
                "origin": [
                  118,
                  255
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/16.png",
                "delay": 90,
                "origin": [
                  106,
                  240
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/17.png",
                "delay": 90,
                "origin": [
                  81,
                  196
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/18.png",
                "delay": 90,
                "origin": [
                  78,
                  121
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/19.png",
                "delay": 90,
                "origin": [
                  78,
                  120
                ]
              },
              {
                "src": "images/skills/111/1111003/effect/20.png",
                "delay": 90,
                "origin": [
                  73,
                  102
                ]
              }
            ],
            "mob": {
              "frames": [
                {
                  "src": "images/skills/111/1111003/mob/0.png",
                  "delay": 90,
                  "origin": [
                    67,
                    91
                  ]
                },
                {
                  "src": "images/skills/111/1111003/mob/1.png",
                  "delay": 90,
                  "origin": [
                    70,
                    95
                  ]
                },
                {
                  "src": "images/skills/111/1111003/mob/2.png",
                  "delay": 90,
                  "origin": [
                    71,
                    96
                  ]
                },
                {
                  "src": "images/skills/111/1111003/mob/3.png",
                  "delay": 90,
                  "origin": [
                    71,
                    97
                  ]
                },
                {
                  "src": "images/skills/111/1111003/mob/4.png",
                  "delay": 90,
                  "origin": [
                    71,
                    96
                  ]
                },
                {
                  "src": "images/skills/111/1111003/mob/5.png",
                  "delay": 90,
                  "origin": [
                    70,
                    95
                  ]
                },
                {
                  "src": "images/skills/111/1111003/mob/6.png",
                  "delay": 90,
                  "origin": [
                    70,
                    95
                  ]
                },
                {
                  "src": "images/skills/111/1111003/mob/7.png",
                  "delay": 90,
                  "origin": [
                    70,
                    94
                  ]
                }
              ],
              "repeat": 1,
              "pos": 2
            }
          }
        },
        {
          "id": "1111010",
          "name": "英勇狂斬",
          "desc": "#c[劍術]#對前方的多數敵人連續攻擊三次。",
          "h": "消耗MP #mpCon，以 #damage%傷害，最多對#mobCount位敵人進行#attackCount次攻擊",
          "rank": "60",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "areaAttack": true,
          "actions": [
            "braveslash1",
            "braveslash2",
            "braveslash3",
            "braveslash4"
          ],
          "common": {
            "mpCon": "14+u(x/4)",
            "damage": "198+3*x",
            "attackCount": "3",
            "mobCount": "6",
            "lt": "-320, -190",
            "rb": "10, 60",
            "maxLevel": "20"
          },
          "icon": "images/skills/111/1111010.png",
          "skillBook": 111,
          "fx": {
            "effect": [
              {
                "src": "images/skills/111/1111010/effect/0.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/1.png",
                "delay": 60,
                "origin": [
                  33,
                  45
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/2.png",
                "delay": 60,
                "origin": [
                  425,
                  283
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/3.png",
                "delay": 60,
                "origin": [
                  425,
                  254
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/4.png",
                "delay": 60,
                "origin": [
                  415,
                  246
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/5.png",
                "delay": 60,
                "origin": [
                  410,
                  246
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/6.png",
                "delay": 60,
                "origin": [
                  449,
                  283
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/7.png",
                "delay": 60,
                "origin": [
                  445,
                  291
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/8.png",
                "delay": 60,
                "origin": [
                  413,
                  293
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/9.png",
                "delay": 60,
                "origin": [
                  412,
                  288
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/10.png",
                "delay": 60,
                "origin": [
                  409,
                  282
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/11.png",
                "delay": 60,
                "origin": [
                  388,
                  274
                ]
              },
              {
                "src": "images/skills/111/1111010/effect/12.png",
                "delay": 60,
                "origin": [
                  283,
                  252
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/111/1111010/effect0/0.png",
                "delay": 120,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/1.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/2.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/3.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/4.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/5.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/6.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/7.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/8.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/9.png",
                "delay": 60,
                "origin": [
                  389,
                  248
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/10.png",
                "delay": 60,
                "origin": [
                  386,
                  240
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/11.png",
                "delay": 60,
                "origin": [
                  370,
                  234
                ]
              },
              {
                "src": "images/skills/111/1111010/effect0/12.png",
                "delay": 60,
                "origin": [
                  364,
                  224
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/111/1111010/hit/0.png",
                "delay": 60,
                "origin": [
                  78,
                  77
                ]
              },
              {
                "src": "images/skills/111/1111010/hit/1.png",
                "delay": 60,
                "origin": [
                  123,
                  111
                ]
              },
              {
                "src": "images/skills/111/1111010/hit/2.png",
                "delay": 60,
                "origin": [
                  123,
                  111
                ]
              },
              {
                "src": "images/skills/111/1111010/hit/3.png",
                "delay": 60,
                "origin": [
                  115,
                  111
                ]
              },
              {
                "src": "images/skills/111/1111010/hit/4.png",
                "delay": 60,
                "origin": [
                  112,
                  111
                ]
              },
              {
                "src": "images/skills/111/1111010/hit/5.png",
                "delay": 60,
                "origin": [
                  113,
                  111
                ]
              },
              {
                "src": "images/skills/111/1111010/hit/6.png",
                "delay": 60,
                "origin": [
                  104,
                  108
                ]
              }
            ]
          }
        },
        {
          "id": "1111012",
          "name": "究極突刺",
          "desc": "往前方衝出去後擊退前面的多數敵人。部分怪物是抵抗而不會擊退。",
          "h": "消耗MP#mpCon，以#damage%傷害對最多#mobCount名敵人進行攻擊",
          "rank": "60",
          "type": "active",
          "equipable": true,
          "maxLevel": 10,
          "infoType": 10,
          "areaAttack": true,
          "actions": [
            "rushNew"
          ],
          "common": {
            "maxLevel": "10",
            "mpCon": "8+3*u(x/3)",
            "damage": "245+6*x",
            "attackCount": "1",
            "mobCount": "7+d(x/2)",
            "lt": "-500, -50",
            "rb": "0, 0"
          },
          "icon": "images/skills/111/1111012.png",
          "skillBook": 111,
          "fx": {
            "effect": [
              {
                "src": "images/skills/111/1111012/effect/0.png",
                "delay": 60,
                "origin": [
                  298,
                  131
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/1.png",
                "delay": 60,
                "origin": [
                  286,
                  250
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/2.png",
                "delay": 60,
                "origin": [
                  287,
                  195
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/3.png",
                "delay": 60,
                "origin": [
                  294,
                  190
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/4.png",
                "delay": 60,
                "origin": [
                  320,
                  184
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/5.png",
                "delay": 30,
                "origin": [
                  294,
                  187
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/6.png",
                "delay": 60,
                "origin": [
                  297,
                  190
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/7.png",
                "delay": 30,
                "origin": [
                  299,
                  192
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/8.png",
                "delay": 60,
                "origin": [
                  298,
                  193
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/9.png",
                "delay": 30,
                "origin": [
                  198,
                  190
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/10.png",
                "delay": 30,
                "origin": [
                  198,
                  187
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/11.png",
                "delay": 30,
                "origin": [
                  196,
                  177
                ]
              },
              {
                "src": "images/skills/111/1111012/effect/12.png",
                "delay": 30,
                "origin": [
                  193,
                  52
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/111/1111012/effect0/0.png",
                "delay": 180,
                "origin": [
                  131,
                  142
                ]
              },
              {
                "src": "images/skills/111/1111012/effect0/1.png",
                "delay": 90,
                "origin": [
                  127,
                  142
                ]
              },
              {
                "src": "images/skills/111/1111012/effect0/2.png",
                "delay": 90,
                "origin": [
                  107,
                  159
                ]
              },
              {
                "src": "images/skills/111/1111012/effect0/3.png",
                "delay": 90,
                "origin": [
                  98,
                  165
                ]
              },
              {
                "src": "images/skills/111/1111012/effect0/4.png",
                "delay": 90,
                "origin": [
                  90,
                  167
                ]
              },
              {
                "src": "images/skills/111/1111012/effect0/5.png",
                "delay": 60,
                "origin": [
                  71,
                  159
                ]
              },
              {
                "src": "images/skills/111/1111012/effect0/6.png",
                "delay": 60,
                "origin": [
                  46,
                  165
                ]
              },
              {
                "src": "images/skills/111/1111012/effect0/7.png",
                "delay": 60,
                "origin": [
                  46,
                  167
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/111/1111012/hit/0.png",
                "delay": 60,
                "origin": [
                  89,
                  90
                ]
              },
              {
                "src": "images/skills/111/1111012/hit/1.png",
                "delay": 60,
                "origin": [
                  121,
                  113
                ]
              },
              {
                "src": "images/skills/111/1111012/hit/2.png",
                "delay": 60,
                "origin": [
                  118,
                  111
                ]
              },
              {
                "src": "images/skills/111/1111012/hit/3.png",
                "delay": 60,
                "origin": [
                  113,
                  109
                ]
              },
              {
                "src": "images/skills/111/1111012/hit/4.png",
                "delay": 60,
                "origin": [
                  108,
                  109
                ]
              },
              {
                "src": "images/skills/111/1111012/hit/5.png",
                "delay": 60,
                "origin": [
                  104,
                  107
                ]
              },
              {
                "src": "images/skills/111/1111012/hit/6.png",
                "delay": 60,
                "origin": [
                  101,
                  104
                ]
              },
              {
                "src": "images/skills/111/1111012/hit/7.png",
                "delay": 60,
                "origin": [
                  74,
                  91
                ]
              },
              {
                "src": "images/skills/111/1111012/hit/8.png",
                "delay": 60,
                "origin": [
                  57,
                  91
                ]
              }
            ]
          }
        },
        {
          "id": "1111016",
          "name": "靈氣之刃",
          "desc": "朝任意方向發射能夠撕裂敵人的劍氣。可朝#c八方位#發射，搭配方向鍵使用時即可朝該方向發動技能。",
          "h": "消耗MP#mpCon，以#damage%傷害對最多#mobCount名敵人發射#attackCount次劍氣\\n攻擊靈氣之刃的一般怪物時，傷害增加#u%p\\n冷卻時間：#cooltime秒",
          "rank": "60",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 1,
          "projectile": true,
          "actions": [
            "auraBlade"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "35+x",
            "damage": "100+4*x",
            "mobCount": "8",
            "attackCount": "5",
            "attackDelay": "120",
            "cooltime": "7",
            "u": "100+4*x"
          },
          "icon": "images/skills/111/1111016.png",
          "skillBook": 111,
          "fx": {
            "effect": [
              {
                "src": "images/skills/111/1111016/effect/0.png",
                "delay": 60,
                "origin": [
                  116,
                  79
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/1.png",
                "delay": 60,
                "origin": [
                  113,
                  80
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/2.png",
                "delay": 60,
                "origin": [
                  111,
                  81
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/3.png",
                "delay": 60,
                "origin": [
                  110,
                  81
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/4.png",
                "delay": 60,
                "origin": [
                  108,
                  81
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/5.png",
                "delay": 60,
                "origin": [
                  291,
                  298
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/6.png",
                "delay": 60,
                "origin": [
                  352,
                  300
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/7.png",
                "delay": 60,
                "origin": [
                  385,
                  302
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/8.png",
                "delay": 60,
                "origin": [
                  359,
                  296
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/9.png",
                "delay": 60,
                "origin": [
                  355,
                  283
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/10.png",
                "delay": 60,
                "origin": [
                  339,
                  204
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/11.png",
                "delay": 60,
                "origin": [
                  318,
                  192
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/12.png",
                "delay": 60,
                "origin": [
                  312,
                  173
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/13.png",
                "delay": 60,
                "origin": [
                  307,
                  90
                ]
              },
              {
                "src": "images/skills/111/1111016/effect/14.png",
                "delay": 60,
                "origin": [
                  235,
                  88
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/111/1111016/hit/0.png",
                "delay": 60,
                "origin": [
                  36,
                  47
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/1.png",
                "delay": 60,
                "origin": [
                  73,
                  82
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/2.png",
                "delay": 60,
                "origin": [
                  77,
                  88
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/3.png",
                "delay": 60,
                "origin": [
                  79,
                  90
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/4.png",
                "delay": 60,
                "origin": [
                  84,
                  95
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/5.png",
                "delay": 60,
                "origin": [
                  96,
                  97
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/6.png",
                "delay": 60,
                "origin": [
                  86,
                  99
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/7.png",
                "delay": 60,
                "origin": [
                  86,
                  98
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/8.png",
                "delay": 60,
                "origin": [
                  88,
                  98
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/9.png",
                "delay": 60,
                "origin": [
                  82,
                  95
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/10.png",
                "delay": 60,
                "origin": [
                  81,
                  78
                ]
              },
              {
                "src": "images/skills/111/1111016/hit/11.png",
                "delay": 60,
                "origin": [
                  82,
                  71
                ]
              }
            ],
            "shootobj": {
              "layers": [
                {
                  "name": "b1",
                  "frames": [
                    {
                      "src": "images/skills/111/1111016/shootobj/b1/0.png",
                      "delay": 60,
                      "origin": [
                        191,
                        179
                      ]
                    },
                    {
                      "src": "images/skills/111/1111016/shootobj/b1/1.png",
                      "delay": 60,
                      "origin": [
                        197,
                        181
                      ]
                    },
                    {
                      "src": "images/skills/111/1111016/shootobj/b1/2.png",
                      "delay": 60,
                      "origin": [
                        188,
                        183
                      ]
                    },
                    {
                      "src": "images/skills/111/1111016/shootobj/b1/3.png",
                      "delay": 60,
                      "origin": [
                        188,
                        182
                      ]
                    },
                    {
                      "src": "images/skills/111/1111016/shootobj/b1/4.png",
                      "delay": 60,
                      "origin": [
                        193,
                        183
                      ]
                    },
                    {
                      "src": "images/skills/111/1111016/shootobj/b1/5.png",
                      "delay": 60,
                      "origin": [
                        194,
                        182
                      ]
                    }
                  ]
                }
              ],
              "start": [
                -80,
                -60
              ],
              "bodyWH": [
                300,
                300
              ],
              "startDelayMs": 240,
              "pierce": true,
              "noHitWhenMaxCount": true,
              "moveList": {
                "p1": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      0,
                      560
                    ]
                  }
                ],
                "p2": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -560,
                      0
                    ]
                  }
                ],
                "p3": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      0,
                      -560
                    ]
                  }
                ],
                "p4": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -400,
                      400
                    ]
                  }
                ],
                "p5": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -400,
                      -400
                    ]
                  }
                ]
              }
            }
          }
        }
      ]
    },
    "112": {
      "jobId": 112,
      "name": "英雄",
      "rank": "100",
      "skillBook": 112,
      "skills": [
        {
          "id": "1120003",
          "name": "進階鬥氣",
          "desc": "鬥氣每計數1，即可增加最終傷害和鬥氣計數值，且鬥氣計數將以一定機率每次計為2。額外增加熟練度。",
          "h": "依照每個鬥氣量，最終傷害增加量提升到 #v%，最大鬥氣量#x個，以 #prop% 的機率會補充 2個鬥氣量，武器熟練度增加量提升至 #mastery%",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 30,
          "actions": [],
          "common": {
            "damR": "u(x/6)",
            "x": "5+d(x/6)",
            "v": "5+u(x/6)",
            "prop": "20+2*x",
            "mastery": "55+d(x/2)",
            "maxLevel": "30"
          },
          "icon": "images/skills/112/1120003.png",
          "skillBook": 112,
          "fx": {
            "special": {
              "frames": [
                {
                  "src": "images/skills/112/1120003/special/0.png",
                  "delay": 30,
                  "origin": [
                    72,
                    72
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/1.png",
                  "delay": 30,
                  "origin": [
                    62,
                    69
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/2.png",
                  "delay": 30,
                  "origin": [
                    50,
                    62
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/3.png",
                  "delay": 30,
                  "origin": [
                    43,
                    57
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/4.png",
                  "delay": 60,
                  "origin": [
                    80,
                    95
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/5.png",
                  "delay": 60,
                  "origin": [
                    84,
                    99
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/6.png",
                  "delay": 60,
                  "origin": [
                    85,
                    100
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/7.png",
                  "delay": 60,
                  "origin": [
                    83,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/8.png",
                  "delay": 60,
                  "origin": [
                    84,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/9.png",
                  "delay": 60,
                  "origin": [
                    83,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/10.png",
                  "delay": 60,
                  "origin": [
                    77,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/11.png",
                  "delay": 60,
                  "origin": [
                    77,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/12.png",
                  "delay": 90,
                  "origin": [
                    79,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/13.png",
                  "delay": 90,
                  "origin": [
                    79,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/14.png",
                  "delay": 90,
                  "origin": [
                    82,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/15.png",
                  "delay": 90,
                  "origin": [
                    83,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/16.png",
                  "delay": 90,
                  "origin": [
                    84,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/17.png",
                  "delay": 90,
                  "origin": [
                    83,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/18.png",
                  "delay": 90,
                  "origin": [
                    77,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1120003/special/19.png",
                  "delay": 90,
                  "origin": [
                    77,
                    81
                  ]
                }
              ],
              "repeat": 12,
              "relMove": [
                0,
                -40
              ]
            },
            "stateStart": [
              {
                "src": "images/skills/112/1120003/state/start/0.png",
                "delay": 30,
                "origin": [
                  23,
                  24
                ]
              },
              {
                "src": "images/skills/112/1120003/state/start/1.png",
                "delay": 30,
                "origin": [
                  28,
                  28
                ]
              },
              {
                "src": "images/skills/112/1120003/state/start/2.png",
                "delay": 30,
                "origin": [
                  30,
                  31
                ]
              },
              {
                "src": "images/skills/112/1120003/state/start/3.png",
                "delay": 30,
                "origin": [
                  32,
                  32
                ]
              },
              {
                "src": "images/skills/112/1120003/state/start/4.png",
                "delay": 30,
                "origin": [
                  32,
                  32
                ]
              },
              {
                "src": "images/skills/112/1120003/state/start/5.png",
                "delay": 30,
                "origin": [
                  30,
                  30
                ]
              }
            ],
            "state": {
              "0": [
                {
                  "src": "images/skills/112/1120003/state/0.png",
                  "delay": 120,
                  "origin": [
                    55,
                    55
                  ]
                }
              ],
              "1": [
                {
                  "src": "images/skills/112/1120003/state/1.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ],
              "2": [
                {
                  "src": "images/skills/112/1120003/state/2.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ],
              "3": [
                {
                  "src": "images/skills/112/1120003/state/3.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ],
              "4": [
                {
                  "src": "images/skills/112/1120003/state/4.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ],
              "5": [
                {
                  "src": "images/skills/112/1120003/state/5.png",
                  "delay": 120,
                  "origin": [
                    30,
                    30
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "1120010",
          "name": "鬥氣爆發",
          "desc": "引爆充能的鬥氣計數之力，可對敵人進行強力攻擊。",
          "h": "增加最終傷害#pdR%，爆擊傷害#criticaldamage%\\n",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 10,
          "actions": [],
          "common": {
            "pdR": "10+d(x/2)",
            "mobCount": "3",
            "time": "21000000",
            "maxLevel": "30",
            "criticaldamage": "10+d(x/3)",
            "z": "0",
            "w": "3"
          },
          "icon": "images/skills/112/1120010.png",
          "skillBook": 112,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1120010/effect/0.png",
                "delay": 60,
                "origin": [
                  145,
                  164
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/1.png",
                "delay": 60,
                "origin": [
                  147,
                  173
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/2.png",
                "delay": 60,
                "origin": [
                  166,
                  187
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/3.png",
                "delay": 60,
                "origin": [
                  161,
                  182
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/4.png",
                "delay": 60,
                "origin": [
                  161,
                  312
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/5.png",
                "delay": 60,
                "origin": [
                  159,
                  342
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/6.png",
                "delay": 60,
                "origin": [
                  159,
                  342
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/7.png",
                "delay": 60,
                "origin": [
                  159,
                  343
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/8.png",
                "delay": 60,
                "origin": [
                  164,
                  360
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/9.png",
                "delay": 60,
                "origin": [
                  187,
                  360
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/10.png",
                "delay": 60,
                "origin": [
                  202,
                  360
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/11.png",
                "delay": 60,
                "origin": [
                  218,
                  359
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/12.png",
                "delay": 60,
                "origin": [
                  225,
                  359
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/13.png",
                "delay": 60,
                "origin": [
                  232,
                  359
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/14.png",
                "delay": 60,
                "origin": [
                  238,
                  359
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/15.png",
                "delay": 60,
                "origin": [
                  245,
                  359
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/16.png",
                "delay": 60,
                "origin": [
                  251,
                  356
                ]
              },
              {
                "src": "images/skills/112/1120010/effect/17.png",
                "delay": 60,
                "origin": [
                  187,
                  354
                ]
              }
            ]
          }
        },
        {
          "id": "1120012",
          "name": "戰鬥精通",
          "desc": "攻擊時可部分無視怪物的物理防禦率。",
          "h": "增加無視防禦率#ignoreMobpdpR%",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 50,
          "actions": [],
          "common": {
            "ignoreMobpdpR": "20+x",
            "maxLevel": "30"
          },
          "icon": "images/skills/112/1120012.png",
          "skillBook": 112
        },
        {
          "id": "1120013",
          "name": "進階終極攻擊",
          "desc": "永久增加攻擊力，並大幅增加終極攻擊的發動機率和傷害。",
          "h": "永久增加#padX攻擊力\\n#c[終極攻擊系列技能]# #prop%機率發動可造成#damage%傷害#attackCount次的終極攻擊",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 53,
          "actions": [],
          "common": {
            "damage": "110+2*x",
            "prop": "45+u(x/2)",
            "ar": "u(x/3)",
            "padX": "x",
            "maxLevel": "30",
            "attackCount": "3"
          },
          "icon": "images/skills/112/1120013.png",
          "skillBook": 112,
          "fx": {
            "hit": [
              {
                "src": "images/skills/112/1120013/hit/0.png",
                "delay": 60,
                "origin": [
                  72,
                  89
                ]
              },
              {
                "src": "images/skills/112/1120013/hit/1.png",
                "delay": 60,
                "origin": [
                  72,
                  90
                ]
              },
              {
                "src": "images/skills/112/1120013/hit/2.png",
                "delay": 60,
                "origin": [
                  69,
                  103
                ]
              },
              {
                "src": "images/skills/112/1120013/hit/3.png",
                "delay": 60,
                "origin": [
                  69,
                  112
                ]
              },
              {
                "src": "images/skills/112/1120013/hit/4.png",
                "delay": 60,
                "origin": [
                  81,
                  114
                ]
              },
              {
                "src": "images/skills/112/1120013/hit/5.png",
                "delay": 60,
                "origin": [
                  81,
                  117
                ]
              }
            ]
          }
        },
        {
          "id": "1120014",
          "name": "反抗姿態",
          "desc": "永久遭受敵人攻擊也不會退縮。",
          "h": "格擋機率增加#stanceProp%。",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "30",
            "stanceProp": "2*x"
          },
          "icon": "images/skills/112/1120014.png",
          "skillBook": 112
        },
        {
          "id": "1120017",
          "name": "狂暴攻擊",
          "desc": "連續攻擊前方的敵人。#c最後兩次的攻擊必為爆擊。#",
          "h": "MP消耗#mpCon，對最多#mobCount名敵人以#damage%的傷害攻擊#attackCount次，#c最後兩次攻擊是爆擊#。",
          "rank": "100",
          "type": "active",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "ragingBlowNew",
            "ragingBlowNew2",
            "ragingBlowNew3",
            "ragingBlowNew4"
          ],
          "common": {
            "mpCon": "20+2*u(x/3)",
            "damage": "267+4*x",
            "attackCount": "4",
            "mobCount": "8",
            "lt": "-360, -250",
            "rb": "70, 100",
            "maxLevel": "30"
          },
          "icon": "images/skills/112/1120017.png",
          "skillBook": 112,
          "skipPanel": true,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1120017/effect/0.png",
                "delay": 60,
                "origin": [
                  169,
                  189
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/1.png",
                "delay": 60,
                "origin": [
                  181,
                  171
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/2.png",
                "delay": 60,
                "origin": [
                  181,
                  171
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/3.png",
                "delay": 60,
                "origin": [
                  355,
                  266
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/4.png",
                "delay": 60,
                "origin": [
                  340,
                  313
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/5.png",
                "delay": 60,
                "origin": [
                  306,
                  294
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/6.png",
                "delay": 60,
                "origin": [
                  321,
                  304
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/7.png",
                "delay": 60,
                "origin": [
                  304,
                  267
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/8.png",
                "delay": 60,
                "origin": [
                  375,
                  295
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/9.png",
                "delay": 60,
                "origin": [
                  303,
                  309
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/10.png",
                "delay": 60,
                "origin": [
                  371,
                  307
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/11.png",
                "delay": 60,
                "origin": [
                  367,
                  289
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/12.png",
                "delay": 30,
                "origin": [
                  366,
                  264
                ]
              },
              {
                "src": "images/skills/112/1120017/effect/13.png",
                "delay": 30,
                "origin": [
                  359,
                  240
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/112/1120017/hit/0.png",
                "delay": 90,
                "origin": [
                  88,
                  71
                ]
              },
              {
                "src": "images/skills/112/1120017/hit/1.png",
                "delay": 90,
                "origin": [
                  94,
                  81
                ]
              },
              {
                "src": "images/skills/112/1120017/hit/2.png",
                "delay": 90,
                "origin": [
                  99,
                  87
                ]
              },
              {
                "src": "images/skills/112/1120017/hit/3.png",
                "delay": 90,
                "origin": [
                  99,
                  89
                ]
              },
              {
                "src": "images/skills/112/1120017/hit/4.png",
                "delay": 90,
                "origin": [
                  99,
                  91
                ]
              },
              {
                "src": "images/skills/112/1120017/hit/5.png",
                "delay": 90,
                "origin": [
                  99,
                  90
                ]
              },
              {
                "src": "images/skills/112/1120017/hit/6.png",
                "delay": 90,
                "origin": [
                  99,
                  90
                ]
              },
              {
                "src": "images/skills/112/1120017/hit/7.png",
                "delay": 90,
                "origin": [
                  66,
                  87
                ]
              }
            ]
          }
        },
        {
          "id": "1120043",
          "name": "進階鬥氣-強化傷害",
          "desc": "增加每 1個鬥氣消耗量的最終傷害",
          "h": "增加每 1個鬥氣消耗量的最終傷害#damR% ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 140,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "2"
          },
          "icon": "images/skills/112/1120043.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1120044",
          "name": "進階鬥氣-機率提升",
          "desc": "提升鬥氣量一次可補充2個的機率。",
          "h": "鬥氣量一次會補充兩個的機率增加#prop%",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 150,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "prop": "20"
          },
          "icon": "images/skills/112/1120044.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1120045",
          "name": "進階鬥氣-BOSS傷害",
          "desc": "依鬥氣消耗量個數，增加攻擊BOSS怪物時的傷害 ",
          "h": "依鬥氣消耗量個數，增加攻擊BOSS怪物時的傷害#w%",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 180,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "w": "2"
          },
          "icon": "images/skills/112/1120045.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1120046",
          "name": "進階終極攻擊-強化加農",
          "desc": "增加進階終極攻擊的傷害。",
          "h": "增加傷害值#damR%",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 140,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "10"
          },
          "icon": "images/skills/112/1120046.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1120047",
          "name": "進階終極攻擊-攻擊提升",
          "desc": "增加以進階終極提升的物理物理攻擊力",
          "h": "增加物理物理攻擊力 #padX",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 165,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "padX": "20"
          },
          "icon": "images/skills/112/1120047.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1120048",
          "name": "進階終極攻擊-機率提升",
          "desc": "增加進階終極攻擊的發動機率。",
          "h": "發動機率#prop% 增加",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 180,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "prop": "15"
          },
          "icon": "images/skills/112/1120048.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1120049",
          "name": "狂暴攻擊-傷害強化",
          "desc": "增加狂暴攻擊的傷害。",
          "h": "提高傷害 #damR% ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 150,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "20"
          },
          "icon": "images/skills/112/1120049.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1120050",
          "name": "狂暴攻擊-臨時目標",
          "desc": " 提升狂暴攻擊的最大可攻擊怪物數量。",
          "h": "可攻擊的怪物最大數量增加#targetPlus",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 165,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "targetPlus": "2"
          },
          "icon": "images/skills/112/1120050.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1120051",
          "name": "狂暴攻擊-額外攻擊",
          "desc": "增加狂暴攻擊的攻擊次數。",
          "h": "提高攻擊次數 #attackCount ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 190,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "attackCount": "1"
          },
          "icon": "images/skills/112/1120051.png",
          "skillBook": 112,
          "hyper": 1
        },
        {
          "id": "1121000",
          "name": "楓葉祝福",
          "desc": "受到楓之谷世界的女神的庇護，自己的所有能力值增加一定比例。使用技能時，楓之谷世界的女神將暫時現身。",
          "h": "消耗#mpConMP，使楓之谷世界的女神現身\\n[被動效果：直接投入AP的所有能力值增加#basicStatUp%]",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 10,
          "actions": [],
          "common": {
            "mpCon": "10+10*d(x/5)",
            "maxLevel": "30",
            "basicStatUp": "u(x/2)"
          },
          "icon": "images/skills/112/1121000.png",
          "skillBook": 112,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1121000/effect/0.png",
                "delay": 720,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/1.png",
                "delay": 60,
                "origin": [
                  142,
                  309
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/2.png",
                "delay": 60,
                "origin": [
                  144,
                  302
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/3.png",
                "delay": 60,
                "origin": [
                  144,
                  294
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/4.png",
                "delay": 60,
                "origin": [
                  144,
                  294
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/5.png",
                "delay": 60,
                "origin": [
                  144,
                  292
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/6.png",
                "delay": 60,
                "origin": [
                  144,
                  289
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/7.png",
                "delay": 60,
                "origin": [
                  144,
                  287
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/8.png",
                "delay": 60,
                "origin": [
                  143,
                  294
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/9.png",
                "delay": 60,
                "origin": [
                  149,
                  300
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/10.png",
                "delay": 60,
                "origin": [
                  147,
                  301
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/11.png",
                "delay": 60,
                "origin": [
                  145,
                  303
                ]
              },
              {
                "src": "images/skills/112/1121000/effect/12.png",
                "delay": 60,
                "origin": [
                  135,
                  302
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/112/1121000/effect0/0.png",
                "delay": 60,
                "origin": [
                  63,
                  227
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/1.png",
                "delay": 60,
                "origin": [
                  130,
                  434
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/2.png",
                "delay": 60,
                "origin": [
                  132,
                  434
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/3.png",
                "delay": 60,
                "origin": [
                  132,
                  433
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/4.png",
                "delay": 60,
                "origin": [
                  131,
                  432
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/5.png",
                "delay": 60,
                "origin": [
                  131,
                  431
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/6.png",
                "delay": 60,
                "origin": [
                  136,
                  429
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/7.png",
                "delay": 60,
                "origin": [
                  169,
                  427
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/8.png",
                "delay": 60,
                "origin": [
                  169,
                  424
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/9.png",
                "delay": 60,
                "origin": [
                  177,
                  421
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/10.png",
                "delay": 60,
                "origin": [
                  185,
                  418
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/11.png",
                "delay": 60,
                "origin": [
                  191,
                  414
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/12.png",
                "delay": 60,
                "origin": [
                  143,
                  366
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/13.png",
                "delay": 60,
                "origin": [
                  143,
                  354
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/14.png",
                "delay": 60,
                "origin": [
                  139,
                  342
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/15.png",
                "delay": 60,
                "origin": [
                  134,
                  306
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/16.png",
                "delay": 60,
                "origin": [
                  138,
                  307
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/17.png",
                "delay": 60,
                "origin": [
                  141,
                  309
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/18.png",
                "delay": 60,
                "origin": [
                  143,
                  310
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/19.png",
                "delay": 60,
                "origin": [
                  145,
                  311
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/20.png",
                "delay": 60,
                "origin": [
                  147,
                  312
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/21.png",
                "delay": 60,
                "origin": [
                  147,
                  313
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/22.png",
                "delay": 60,
                "origin": [
                  149,
                  313
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/23.png",
                "delay": 60,
                "origin": [
                  150,
                  312
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/24.png",
                "delay": 60,
                "origin": [
                  151,
                  296
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/25.png",
                "delay": 60,
                "origin": [
                  152,
                  296
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/26.png",
                "delay": 60,
                "origin": [
                  149,
                  297
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/27.png",
                "delay": 60,
                "origin": [
                  101,
                  295
                ]
              },
              {
                "src": "images/skills/112/1121000/effect0/28.png",
                "delay": 60,
                "origin": [
                  99,
                  292
                ]
              }
            ]
          }
        },
        {
          "id": "1121008",
          "name": "狂暴攻擊",
          "desc": "#c[劍術]# 瞬間斬擊前方數名的敵人。最後攻擊一定會套用爆擊。鬥氣最大值時，技能獲得強化。另外，強化靈氣之刃。",
          "h": "消耗MP#mpCon，最多攻擊#mobCount名敵人，以#damage%傷害攻擊#attackCount次。最後一擊必為爆擊\\n#c狂暴攻擊得到強化#:以#x%傷害攻擊#y次，最後兩次攻擊必為爆擊\\n[被動效果:靈氣之刃的傷害增加#damPlus%p]",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 10,
          "areaAttack": true,
          "actions": [
            "ragingBlow1",
            "ragingBlow2",
            "ragingBlow3",
            "ragingBlow4"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "20+2*u(x/3)",
            "damage": "200+4*x",
            "attackCount": "4",
            "mobCount": "8",
            "lt": "-350, -220",
            "rb": "20, 70",
            "x": "267+4*x",
            "y": "4",
            "damPlus": "40+x"
          },
          "icon": "images/skills/112/1121008.png",
          "skillBook": 112,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1121008/effect/0.png",
                "delay": 60,
                "origin": [
                  37,
                  83
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/1.png",
                "delay": 60,
                "origin": [
                  37,
                  83
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/2.png",
                "delay": 60,
                "origin": [
                  37,
                  91
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/3.png",
                "delay": 60,
                "origin": [
                  44,
                  96
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/4.png",
                "delay": 60,
                "origin": [
                  375,
                  293
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/5.png",
                "delay": 60,
                "origin": [
                  373,
                  281
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/6.png",
                "delay": 30,
                "origin": [
                  369,
                  274
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/7.png",
                "delay": 30,
                "origin": [
                  361,
                  258
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/8.png",
                "delay": 60,
                "origin": [
                  428,
                  258
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/9.png",
                "delay": 60,
                "origin": [
                  399,
                  257
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/10.png",
                "delay": 60,
                "origin": [
                  399,
                  257
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/11.png",
                "delay": 60,
                "origin": [
                  379,
                  257
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/12.png",
                "delay": 60,
                "origin": [
                  377,
                  228
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/13.png",
                "delay": 90,
                "origin": [
                  374,
                  223
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/14.png",
                "delay": 30,
                "origin": [
                  373,
                  196
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/15.png",
                "delay": 30,
                "origin": [
                  372,
                  196
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/16.png",
                "delay": 30,
                "origin": [
                  372,
                  196
                ]
              },
              {
                "src": "images/skills/112/1121008/effect/17.png",
                "delay": 30,
                "origin": [
                  351,
                  59
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/112/1121008/hit/0.png",
                "delay": 90,
                "origin": [
                  107,
                  74
                ]
              },
              {
                "src": "images/skills/112/1121008/hit/1.png",
                "delay": 90,
                "origin": [
                  107,
                  84
                ]
              },
              {
                "src": "images/skills/112/1121008/hit/2.png",
                "delay": 90,
                "origin": [
                  82,
                  90
                ]
              },
              {
                "src": "images/skills/112/1121008/hit/3.png",
                "delay": 90,
                "origin": [
                  82,
                  92
                ]
              },
              {
                "src": "images/skills/112/1121008/hit/4.png",
                "delay": 90,
                "origin": [
                  83,
                  94
                ]
              },
              {
                "src": "images/skills/112/1121008/hit/5.png",
                "delay": 90,
                "origin": [
                  83,
                  93
                ]
              },
              {
                "src": "images/skills/112/1121008/hit/6.png",
                "delay": 90,
                "origin": [
                  83,
                  93
                ]
              },
              {
                "src": "images/skills/112/1121008/hit/7.png",
                "delay": 90,
                "origin": [
                  79,
                  90
                ]
              }
            ]
          },
          "enhancedSkillId": "1120017"
        },
        {
          "id": "1121011",
          "name": "楓葉淨化　",
          "desc": "集中精神，以解除狀態異常。使用後，在3秒內對狀態異常免疫。但不適用於部分狀態異常效果，且不適用於戰鬥命令。\\n即使在使用其他技能時，也可使用勇士的意志。",
          "h": "消耗MP #mpCon，再次使用冷卻時間 #cooltime秒",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 5,
          "infoType": 35,
          "actions": [],
          "common": {
            "mpCon": "30",
            "cooltime": "600-60*x",
            "time": "1",
            "maxLevel": "5"
          },
          "icon": "images/skills/112/1121011.png",
          "skillBook": 112,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1121011/effect/0.png",
                "delay": 60,
                "origin": [
                  95,
                  241
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/1.png",
                "delay": 60,
                "origin": [
                  97,
                  237
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/2.png",
                "delay": 60,
                "origin": [
                  101,
                  242
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/3.png",
                "delay": 60,
                "origin": [
                  103,
                  249
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/4.png",
                "delay": 60,
                "origin": [
                  103,
                  248
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/5.png",
                "delay": 60,
                "origin": [
                  104,
                  244
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/6.png",
                "delay": 60,
                "origin": [
                  137,
                  238
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/7.png",
                "delay": 60,
                "origin": [
                  194,
                  246
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/8.png",
                "delay": 60,
                "origin": [
                  131,
                  247
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/9.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/10.png",
                "delay": 60,
                "origin": [
                  132,
                  248
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/11.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/12.png",
                "delay": 60,
                "origin": [
                  133,
                  249
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/13.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/14.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/15.png",
                "delay": 60,
                "origin": [
                  57,
                  246
                ]
              },
              {
                "src": "images/skills/112/1121011/effect/16.png",
                "delay": 60,
                "origin": [
                  55,
                  200
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/112/1121011/effect0/0.png",
                "delay": 360,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/1.png",
                "delay": 60,
                "origin": [
                  145,
                  267
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/2.png",
                "delay": 60,
                "origin": [
                  145,
                  264
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/3.png",
                "delay": 60,
                "origin": [
                  145,
                  256
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/4.png",
                "delay": 60,
                "origin": [
                  145,
                  262
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/5.png",
                "delay": 60,
                "origin": [
                  129,
                  265
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/6.png",
                "delay": 60,
                "origin": [
                  140,
                  265
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/7.png",
                "delay": 60,
                "origin": [
                  141,
                  265
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/8.png",
                "delay": 60,
                "origin": [
                  129,
                  262
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/9.png",
                "delay": 60,
                "origin": [
                  127,
                  258
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/10.png",
                "delay": 60,
                "origin": [
                  114,
                  250
                ]
              },
              {
                "src": "images/skills/112/1121011/effect0/11.png",
                "delay": 60,
                "origin": [
                  101,
                  246
                ]
              }
            ]
          }
        },
        {
          "id": "1121015",
          "name": "烈焰翔斬",
          "desc": "#c[劍術]# 全神貫注，奮力向前方斬擊。使用究極劍術讓烙印在靈魂上的劍看起來像是具象化後攻擊。被攻擊的敵人會受到創傷，在一定時間內承受持續性傷害，且在承受持續性傷害期間所受#c傷害量增加#。",
          "h": "消耗MP#mpCon，對#mobCount名敵人以#damage%的傷害攻擊#attackCount次，攻擊一般怪物時傷害#nbdR%增加\\n被攻擊的敵人以#prop%機率在#dotTime秒內每#dotInterval秒承受#dot%的傷害且#c傷害#x%增加#，隊員攻擊時#u%增加",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 10,
          "areaAttack": true,
          "actions": [
            "incising"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "30+2*d(x/8)",
            "x": "10+u(x/2)",
            "u": "u(x/3)",
            "damage": "310+3*x",
            "mobCount": "8",
            "attackCount": "4",
            "y": "1",
            "dot": "75+3*x",
            "time": "45+d(x/2)",
            "prop": "40+2*x",
            "dotInterval": "2",
            "dotTime": "45+d(x/2)",
            "lt": "-380, -310",
            "rb": "120, 50",
            "nbdR": "50"
          },
          "icon": "images/skills/112/1121015.png",
          "skillBook": 112,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1121015/effect/0.png",
                "delay": 90,
                "origin": [
                  -21,
                  108
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/1.png",
                "delay": 90,
                "origin": [
                  -1,
                  134
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/2.png",
                "delay": 90,
                "origin": [
                  71,
                  205
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/3.png",
                "delay": 90,
                "origin": [
                  81,
                  214
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/4.png",
                "delay": 90,
                "origin": [
                  74,
                  216
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/5.png",
                "delay": 90,
                "origin": [
                  10,
                  144
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/6.png",
                "delay": 90,
                "origin": [
                  -8,
                  106
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/7.png",
                "delay": 90,
                "origin": [
                  -27,
                  87
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/8.png",
                "delay": 90,
                "origin": [
                  138,
                  185
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/9.png",
                "delay": 90,
                "origin": [
                  161,
                  171
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/10.png",
                "delay": 90,
                "origin": [
                  187,
                  119
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/11.png",
                "delay": 90,
                "origin": [
                  197,
                  95
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/12.png",
                "delay": 90,
                "origin": [
                  199,
                  95
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/13.png",
                "delay": 90,
                "origin": [
                  201,
                  24
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/14.png",
                "delay": 90,
                "origin": [
                  199,
                  16
                ]
              },
              {
                "src": "images/skills/112/1121015/effect/15.png",
                "delay": 90,
                "origin": [
                  196,
                  14
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/112/1121015/effect0/0.png",
                "delay": 90,
                "origin": [
                  109,
                  386
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/1.png",
                "delay": 90,
                "origin": [
                  116,
                  512
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/2.png",
                "delay": 90,
                "origin": [
                  140,
                  544
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/3.png",
                "delay": 90,
                "origin": [
                  125,
                  587
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/4.png",
                "delay": 90,
                "origin": [
                  128,
                  631
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/5.png",
                "delay": 90,
                "origin": [
                  129,
                  644
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/6.png",
                "delay": 90,
                "origin": [
                  129,
                  610
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/7.png",
                "delay": 90,
                "origin": [
                  129,
                  523
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/8.png",
                "delay": 90,
                "origin": [
                  627,
                  587
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/9.png",
                "delay": 90,
                "origin": [
                  744,
                  608
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/10.png",
                "delay": 90,
                "origin": [
                  746,
                  603
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/11.png",
                "delay": 90,
                "origin": [
                  742,
                  600
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/12.png",
                "delay": 90,
                "origin": [
                  569,
                  592
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/13.png",
                "delay": 90,
                "origin": [
                  534,
                  592
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/14.png",
                "delay": 90,
                "origin": [
                  529,
                  592
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/15.png",
                "delay": 90,
                "origin": [
                  527,
                  592
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/16.png",
                "delay": 90,
                "origin": [
                  527,
                  584
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/17.png",
                "delay": 90,
                "origin": [
                  525,
                  568
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/18.png",
                "delay": 90,
                "origin": [
                  517,
                  495
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/19.png",
                "delay": 90,
                "origin": [
                  515,
                  387
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/20.png",
                "delay": 90,
                "origin": [
                  407,
                  111
                ]
              },
              {
                "src": "images/skills/112/1121015/effect0/21.png",
                "delay": 90,
                "origin": [
                  406,
                  39
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/112/1121015/hit/0.png",
                "delay": 90,
                "origin": [
                  40,
                  33
                ]
              },
              {
                "src": "images/skills/112/1121015/hit/1.png",
                "delay": 90,
                "origin": [
                  100,
                  83
                ]
              },
              {
                "src": "images/skills/112/1121015/hit/2.png",
                "delay": 90,
                "origin": [
                  103,
                  93
                ]
              },
              {
                "src": "images/skills/112/1121015/hit/3.png",
                "delay": 90,
                "origin": [
                  105,
                  96
                ]
              },
              {
                "src": "images/skills/112/1121015/hit/4.png",
                "delay": 90,
                "origin": [
                  107,
                  96
                ]
              },
              {
                "src": "images/skills/112/1121015/hit/5.png",
                "delay": 90,
                "origin": [
                  107,
                  97
                ]
              },
              {
                "src": "images/skills/112/1121015/hit/6.png",
                "delay": 90,
                "origin": [
                  107,
                  95
                ]
              },
              {
                "src": "images/skills/112/1121015/hit/7.png",
                "delay": 90,
                "origin": [
                  105,
                  96
                ]
              },
              {
                "src": "images/skills/112/1121015/hit/8.png",
                "delay": 90,
                "origin": [
                  104,
                  74
                ]
              }
            ],
            "mob": {
              "frames": [
                {
                  "src": "images/skills/112/1121015/mob/0.png",
                  "delay": 90,
                  "origin": [
                    39,
                    71
                  ]
                },
                {
                  "src": "images/skills/112/1121015/mob/1.png",
                  "delay": 90,
                  "origin": [
                    39,
                    71
                  ]
                },
                {
                  "src": "images/skills/112/1121015/mob/2.png",
                  "delay": 90,
                  "origin": [
                    39,
                    71
                  ]
                },
                {
                  "src": "images/skills/112/1121015/mob/3.png",
                  "delay": 90,
                  "origin": [
                    39,
                    72
                  ]
                },
                {
                  "src": "images/skills/112/1121015/mob/4.png",
                  "delay": 90,
                  "origin": [
                    40,
                    72
                  ]
                },
                {
                  "src": "images/skills/112/1121015/mob/5.png",
                  "delay": 90,
                  "origin": [
                    40,
                    72
                  ]
                },
                {
                  "src": "images/skills/112/1121015/mob/6.png",
                  "delay": 90,
                  "origin": [
                    40,
                    71
                  ]
                },
                {
                  "src": "images/skills/112/1121015/mob/7.png",
                  "delay": 90,
                  "origin": [
                    40,
                    71
                  ]
                }
              ],
              "repeat": 1,
              "pos": 2
            }
          }
        },
        {
          "id": "1121016",
          "name": "魔防消除",
          "desc": "以一定的機率解除周圍敵人身上的#c部分Buff#，並限制其在指定時間內無法套用Buff效果。\\n受到攻擊的敵人會抵抗魔防消除的異常狀態90秒。解除的Buff為攻擊力/魔力增加、防禦力增加、堅硬肌膚。",
          "h": "消耗MP #mpCon，以#prop%的機率 #c解除部分加持#，#time秒內，限制#mobCount名敵人的加持效果 \\n冷卻時間 #cooltime秒",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 10,
          "infoType": 34,
          "actions": [
            "magicCrash"
          ],
          "common": {
            "mpCon": "35-2*x",
            "prop": "20+8*x",
            "time": "6+4*u(x/3)",
            "cooltime": "60",
            "mobCount": "10",
            "lt": "-300, -50",
            "rb": "300, 45",
            "maxLevel": "10"
          },
          "icon": "images/skills/112/1121016.png",
          "skillBook": 112,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1121016/effect/0.png",
                "delay": 60,
                "origin": [
                  123,
                  18
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/1.png",
                "delay": 60,
                "origin": [
                  130,
                  45
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/2.png",
                "delay": 60,
                "origin": [
                  132,
                  68
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/3.png",
                "delay": 60,
                "origin": [
                  134,
                  126
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/4.png",
                "delay": 60,
                "origin": [
                  133,
                  264
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/5.png",
                "delay": 60,
                "origin": [
                  217,
                  263
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/6.png",
                "delay": 60,
                "origin": [
                  229,
                  234
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/7.png",
                "delay": 60,
                "origin": [
                  236,
                  248
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/8.png",
                "delay": 60,
                "origin": [
                  244,
                  262
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/9.png",
                "delay": 60,
                "origin": [
                  137,
                  183
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/10.png",
                "delay": 60,
                "origin": [
                  136,
                  183
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/11.png",
                "delay": 60,
                "origin": [
                  158,
                  186
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/12.png",
                "delay": 60,
                "origin": [
                  168,
                  180
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/13.png",
                "delay": 60,
                "origin": [
                  170,
                  173
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/14.png",
                "delay": 60,
                "origin": [
                  172,
                  180
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/15.png",
                "delay": 60,
                "origin": [
                  171,
                  173
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/16.png",
                "delay": 60,
                "origin": [
                  167,
                  178
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/17.png",
                "delay": 60,
                "origin": [
                  162,
                  178
                ]
              },
              {
                "src": "images/skills/112/1121016/effect/18.png",
                "delay": 60,
                "origin": [
                  159,
                  119
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/112/1121016/effect0/0.png",
                "delay": 60,
                "origin": [
                  148,
                  23
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/1.png",
                "delay": 60,
                "origin": [
                  158,
                  57
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/2.png",
                "delay": 60,
                "origin": [
                  165,
                  81
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/3.png",
                "delay": 60,
                "origin": [
                  168,
                  139
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/4.png",
                "delay": 60,
                "origin": [
                  170,
                  140
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/5.png",
                "delay": 60,
                "origin": [
                  172,
                  141
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/6.png",
                "delay": 60,
                "origin": [
                  170,
                  141
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/7.png",
                "delay": 60,
                "origin": [
                  168,
                  141
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/8.png",
                "delay": 60,
                "origin": [
                  159,
                  141
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/9.png",
                "delay": 60,
                "origin": [
                  155,
                  141
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/10.png",
                "delay": 60,
                "origin": [
                  157,
                  141
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/11.png",
                "delay": 60,
                "origin": [
                  160,
                  228
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/12.png",
                "delay": 60,
                "origin": [
                  160,
                  236
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/13.png",
                "delay": 60,
                "origin": [
                  158,
                  236
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/14.png",
                "delay": 60,
                "origin": [
                  161,
                  236
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/15.png",
                "delay": 60,
                "origin": [
                  163,
                  236
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/16.png",
                "delay": 60,
                "origin": [
                  165,
                  236
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/17.png",
                "delay": 60,
                "origin": [
                  157,
                  233
                ]
              },
              {
                "src": "images/skills/112/1121016/effect0/18.png",
                "delay": 60,
                "origin": [
                  153,
                  225
                ]
              }
            ],
            "mob": {
              "frames": [
                {
                  "src": "images/skills/112/1121016/mob/0.png",
                  "delay": 60,
                  "origin": [
                    42,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1121016/mob/1.png",
                  "delay": 60,
                  "origin": [
                    45,
                    83
                  ]
                },
                {
                  "src": "images/skills/112/1121016/mob/2.png",
                  "delay": 60,
                  "origin": [
                    42,
                    87
                  ]
                },
                {
                  "src": "images/skills/112/1121016/mob/3.png",
                  "delay": 60,
                  "origin": [
                    44,
                    80
                  ]
                },
                {
                  "src": "images/skills/112/1121016/mob/4.png",
                  "delay": 60,
                  "origin": [
                    40,
                    81
                  ]
                },
                {
                  "src": "images/skills/112/1121016/mob/5.png",
                  "delay": 60,
                  "origin": [
                    42,
                    80
                  ]
                }
              ],
              "repeat": 1,
              "pos": 2
            }
          }
        },
        {
          "id": "1121052",
          "name": "憤怒爆發",
          "desc": "具現古代戰士的憤怒，讓前方的敵人陷入火海當中。",
          "h": "消耗MP#mpCon，對#mobCount名的敵人以#damage%傷害值進行攻擊#attackCount次。\\n冷卻時間： #cooltime秒。",
          "rank": "hyper",
          "type": "active",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 1,
          "reqLevel": 160,
          "areaAttack": true,
          "actions": [
            "HY112rageUprising"
          ],
          "common": {
            "maxLevel": "1",
            "mpCon": "200",
            "damage": "560",
            "attackCount": "8",
            "mobCount": "10",
            "cooltime": "10",
            "lt": "-420, -600",
            "rb": "100, 20"
          },
          "icon": "images/skills/112/1121052.png",
          "skillBook": 112,
          "hyper": 2,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1121052/effect/0.png",
                "delay": 90,
                "origin": [
                  40,
                  69
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/1.png",
                "delay": 90,
                "origin": [
                  187,
                  210
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/2.png",
                "delay": 90,
                "origin": [
                  186,
                  255
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/3.png",
                "delay": 90,
                "origin": [
                  184,
                  249
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/4.png",
                "delay": 90,
                "origin": [
                  181,
                  243
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/5.png",
                "delay": 90,
                "origin": [
                  179,
                  213
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/6.png",
                "delay": 90,
                "origin": [
                  175,
                  193
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/7.png",
                "delay": 90,
                "origin": [
                  150,
                  164
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/8.png",
                "delay": 90,
                "origin": [
                  48,
                  148
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/9.png",
                "delay": 90,
                "origin": [
                  190,
                  208
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/10.png",
                "delay": 90,
                "origin": [
                  187,
                  201
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/11.png",
                "delay": 90,
                "origin": [
                  185,
                  196
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/12.png",
                "delay": 90,
                "origin": [
                  182,
                  194
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/13.png",
                "delay": 90,
                "origin": [
                  176,
                  187
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/14.png",
                "delay": 90,
                "origin": [
                  172,
                  140
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/15.png",
                "delay": 90,
                "origin": [
                  158,
                  134
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/16.png",
                "delay": 90,
                "origin": [
                  156,
                  36
                ]
              },
              {
                "src": "images/skills/112/1121052/effect/17.png",
                "delay": 90,
                "origin": [
                  150,
                  21
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/112/1121052/effect0/0.png",
                "delay": 450,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/1.png",
                "delay": 90,
                "origin": [
                  684,
                  612
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/2.png",
                "delay": 90,
                "origin": [
                  766,
                  698
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/3.png",
                "delay": 90,
                "origin": [
                  777,
                  698
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/4.png",
                "delay": 90,
                "origin": [
                  781,
                  698
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/5.png",
                "delay": 90,
                "origin": [
                  784,
                  698
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/6.png",
                "delay": 90,
                "origin": [
                  786,
                  686
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/7.png",
                "delay": 90,
                "origin": [
                  783,
                  690
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/8.png",
                "delay": 90,
                "origin": [
                  779,
                  685
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/9.png",
                "delay": 90,
                "origin": [
                  776,
                  690
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/10.png",
                "delay": 90,
                "origin": [
                  772,
                  685
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/11.png",
                "delay": 90,
                "origin": [
                  726,
                  690
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/12.png",
                "delay": 90,
                "origin": [
                  722,
                  685
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/13.png",
                "delay": 90,
                "origin": [
                  726,
                  690
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/14.png",
                "delay": 90,
                "origin": [
                  731,
                  685
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/15.png",
                "delay": 90,
                "origin": [
                  741,
                  690
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/16.png",
                "delay": 90,
                "origin": [
                  742,
                  685
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/17.png",
                "delay": 90,
                "origin": [
                  714,
                  673
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/18.png",
                "delay": 90,
                "origin": [
                  666,
                  660
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/19.png",
                "delay": 90,
                "origin": [
                  541,
                  600
                ]
              },
              {
                "src": "images/skills/112/1121052/effect0/20.png",
                "delay": 90,
                "origin": [
                  553,
                  591
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/112/1121052/hit/0.png",
                "delay": 90,
                "origin": [
                  95,
                  85
                ]
              },
              {
                "src": "images/skills/112/1121052/hit/1.png",
                "delay": 90,
                "origin": [
                  127,
                  106
                ]
              },
              {
                "src": "images/skills/112/1121052/hit/2.png",
                "delay": 90,
                "origin": [
                  141,
                  115
                ]
              },
              {
                "src": "images/skills/112/1121052/hit/3.png",
                "delay": 90,
                "origin": [
                  148,
                  118
                ]
              },
              {
                "src": "images/skills/112/1121052/hit/4.png",
                "delay": 90,
                "origin": [
                  150,
                  122
                ]
              },
              {
                "src": "images/skills/112/1121052/hit/5.png",
                "delay": 90,
                "origin": [
                  155,
                  125
                ]
              },
              {
                "src": "images/skills/112/1121052/hit/6.png",
                "delay": 90,
                "origin": [
                  157,
                  122
                ]
              },
              {
                "src": "images/skills/112/1121052/hit/7.png",
                "delay": 90,
                "origin": [
                  156,
                  122
                ]
              }
            ]
          }
        },
        {
          "id": "1121053",
          "name": "傳說冒險",
          "desc": "只有遊遍楓之谷世界每個角落的傳說中的冒險家才可使用的加持，可增加傷害。",
          "h": "消耗MP#mpCon，#time秒內傷害增加#indieDamR%。\\n只對隊員中的冒險家職業群產生效果\\n冷卻時間#cooltime秒",
          "rank": "hyper",
          "type": "buff",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 190,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "mpCon": "100",
            "time": "60",
            "cooltime": "120",
            "indieDamR": "10",
            "lt": "-400, -300",
            "rb": "400, 300"
          },
          "icon": "images/skills/112/1121053.png",
          "skillBook": 112,
          "hyper": 2,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1121053/effect/0.png",
                "delay": 360,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/1.png",
                "delay": 60,
                "origin": [
                  198,
                  141
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/2.png",
                "delay": 60,
                "origin": [
                  168,
                  143
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/3.png",
                "delay": 60,
                "origin": [
                  140,
                  204
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/4.png",
                "delay": 60,
                "origin": [
                  168,
                  270
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/5.png",
                "delay": 60,
                "origin": [
                  164,
                  282
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/6.png",
                "delay": 60,
                "origin": [
                  166,
                  302
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/7.png",
                "delay": 60,
                "origin": [
                  170,
                  308
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/8.png",
                "delay": 60,
                "origin": [
                  174,
                  315
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/9.png",
                "delay": 60,
                "origin": [
                  182,
                  315
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/10.png",
                "delay": 60,
                "origin": [
                  179,
                  369
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/11.png",
                "delay": 60,
                "origin": [
                  160,
                  312
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/12.png",
                "delay": 60,
                "origin": [
                  180,
                  312
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/13.png",
                "delay": 60,
                "origin": [
                  207,
                  364
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/14.png",
                "delay": 60,
                "origin": [
                  215,
                  130
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/15.png",
                "delay": 60,
                "origin": [
                  226,
                  119
                ]
              },
              {
                "src": "images/skills/112/1121053/effect/16.png",
                "delay": 60,
                "origin": [
                  172,
                  111
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/112/1121053/effect0/0.png",
                "delay": 60,
                "origin": [
                  185,
                  289
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/1.png",
                "delay": 60,
                "origin": [
                  158,
                  265
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/2.png",
                "delay": 60,
                "origin": [
                  136,
                  250
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/3.png",
                "delay": 60,
                "origin": [
                  111,
                  234
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/4.png",
                "delay": 60,
                "origin": [
                  113,
                  239
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/5.png",
                "delay": 60,
                "origin": [
                  112,
                  258
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/6.png",
                "delay": 60,
                "origin": [
                  122,
                  275
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/7.png",
                "delay": 60,
                "origin": [
                  128,
                  294
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/8.png",
                "delay": 60,
                "origin": [
                  173,
                  368
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/9.png",
                "delay": 60,
                "origin": [
                  332,
                  446
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/10.png",
                "delay": 60,
                "origin": [
                  333,
                  444
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/11.png",
                "delay": 60,
                "origin": [
                  333,
                  437
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/12.png",
                "delay": 60,
                "origin": [
                  329,
                  429
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/13.png",
                "delay": 60,
                "origin": [
                  326,
                  426
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/14.png",
                "delay": 60,
                "origin": [
                  325,
                  415
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/15.png",
                "delay": 60,
                "origin": [
                  322,
                  415
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/16.png",
                "delay": 60,
                "origin": [
                  321,
                  419
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/17.png",
                "delay": 60,
                "origin": [
                  320,
                  419
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/18.png",
                "delay": 60,
                "origin": [
                  319,
                  419
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/19.png",
                "delay": 60,
                "origin": [
                  316,
                  411
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/20.png",
                "delay": 60,
                "origin": [
                  313,
                  420
                ]
              },
              {
                "src": "images/skills/112/1121053/effect0/21.png",
                "delay": 60,
                "origin": [
                  309,
                  365
                ]
              }
            ]
          }
        },
        {
          "id": "1121054",
          "name": "劍士意念",
          "desc": "可發揮蘊含古代戰士意志的強大力量。英雄使用#c劍術#技能時，每一段時間，發生攻擊的位置會留下劍擊殘像對敵人造成額外攻擊。劍擊將優先攻擊最大HP最高的BOSS怪物。共用技能、5轉技能不會產生劍擊。",
          "h": "消耗MP#mpCon、#time秒內不會因敵人的攻擊而被推開，且鬥氣補充至最大值\\nBuff有效時間內，攻擊力增加#indiePad、爆擊機率增加#indieCr%、狀態異常耐性增加#x、所有屬性耐性增加 #y%\\n每隔一段時間形成對最多 #mobCount名的敵人以#damage%的傷害攻擊#attackCount次的劍擊 #w個，劍擊最多發生#u2次，劍擊結束後就不會再出現。\\n冷卻時間#cooltime秒",
          "rank": "hyper",
          "type": "buff",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 140,
          "actions": [
            "HY112valhalla"
          ],
          "common": {
            "maxLevel": "1",
            "mpCon": "300",
            "x": "100",
            "y": "100",
            "time": "30",
            "cooltime": "120",
            "indieCr": "30",
            "z": "167",
            "indiePad": "50",
            "w": "3",
            "damage": "520",
            "mobCount": "6",
            "u2": "12",
            "attackCount": "2"
          },
          "icon": "images/skills/112/1121054.png",
          "skillBook": 112,
          "hyper": 2,
          "fx": {
            "effect": [
              {
                "src": "images/skills/112/1121054/effect/0.png",
                "delay": 90,
                "origin": [
                  275,
                  285
                ]
              },
              {
                "src": "images/skills/112/1121054/effect/1.png",
                "delay": 90,
                "origin": [
                  284,
                  286
                ]
              },
              {
                "src": "images/skills/112/1121054/effect/2.png",
                "delay": 90,
                "origin": [
                  287,
                  307
                ]
              },
              {
                "src": "images/skills/112/1121054/effect/3.png",
                "delay": 90,
                "origin": [
                  285,
                  310
                ]
              },
              {
                "src": "images/skills/112/1121054/effect/4.png",
                "delay": 90,
                "origin": [
                  284,
                  314
                ]
              },
              {
                "src": "images/skills/112/1121054/effect/5.png",
                "delay": 90,
                "origin": [
                  275,
                  315
                ]
              },
              {
                "src": "images/skills/112/1121054/effect/6.png",
                "delay": 90,
                "origin": [
                  243,
                  315
                ]
              },
              {
                "src": "images/skills/112/1121054/effect/7.png",
                "delay": 90,
                "origin": [
                  152,
                  315
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/112/1121054/effect0/0.png",
                "delay": 90,
                "origin": [
                  100,
                  247
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/1.png",
                "delay": 90,
                "origin": [
                  156,
                  384
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/2.png",
                "delay": 90,
                "origin": [
                  164,
                  397
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/3.png",
                "delay": 90,
                "origin": [
                  168,
                  403
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/4.png",
                "delay": 90,
                "origin": [
                  170,
                  403
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/5.png",
                "delay": 90,
                "origin": [
                  171,
                  403
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/6.png",
                "delay": 90,
                "origin": [
                  172,
                  403
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/7.png",
                "delay": 90,
                "origin": [
                  173,
                  403
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/8.png",
                "delay": 90,
                "origin": [
                  299,
                  417
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/9.png",
                "delay": 90,
                "origin": [
                  299,
                  417
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/10.png",
                "delay": 90,
                "origin": [
                  291,
                  418
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/11.png",
                "delay": 90,
                "origin": [
                  267,
                  415
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/12.png",
                "delay": 90,
                "origin": [
                  272,
                  417
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/13.png",
                "delay": 90,
                "origin": [
                  276,
                  405
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/14.png",
                "delay": 90,
                "origin": [
                  278,
                  399
                ]
              },
              {
                "src": "images/skills/112/1121054/effect0/15.png",
                "delay": 90,
                "origin": [
                  277,
                  383
                ]
              }
            ]
          },
          "summonSkillId": "1121055"
        },
        {
          "id": "1121055",
          "name": "劍士意念",
          "desc": "可發揮蘊含古代戰士意志的強大力量。",
          "h": "",
          "rank": "hyper",
          "type": "summon",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 140,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damage": "520",
            "w": "3",
            "subTime": "480",
            "time": "10000",
            "attackDelay": "120",
            "q": "70",
            "q2": "30",
            "x": "1",
            "u": "300"
          },
          "icon": "images/skills/112/1121055.png",
          "skillBook": 112,
          "skipPanel": true,
          "hyper": 2,
          "fx": {
            "summonAttacks": [
              {
                "name": "attack1",
                "frames": [
                  {
                    "src": "images/skills/112/1121055/summon/attack1/0.png",
                    "delay": 60,
                    "origin": [
                      124,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack1/1.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack1/2.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack1/3.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack1/4.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack1/5.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack1/6.png",
                    "delay": 60,
                    "origin": [
                      177,
                      181
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack1/7.png",
                    "delay": 60,
                    "origin": [
                      172,
                      166
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "2"
              },
              {
                "name": "attack2",
                "frames": [
                  {
                    "src": "images/skills/112/1121055/summon/attack2/0.png",
                    "delay": 60,
                    "origin": [
                      124,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack2/1.png",
                    "delay": 60,
                    "origin": [
                      156,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack2/2.png",
                    "delay": 60,
                    "origin": [
                      164,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack2/3.png",
                    "delay": 60,
                    "origin": [
                      164,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack2/4.png",
                    "delay": 60,
                    "origin": [
                      164,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack2/5.png",
                    "delay": 60,
                    "origin": [
                      162,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack2/6.png",
                    "delay": 60,
                    "origin": [
                      163,
                      181
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack2/7.png",
                    "delay": 60,
                    "origin": [
                      127,
                      168
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "2"
              },
              {
                "name": "attack3",
                "frames": [
                  {
                    "src": "images/skills/112/1121055/summon/attack3/0.png",
                    "delay": 60,
                    "origin": [
                      124,
                      181
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack3/1.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack3/2.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack3/3.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack3/4.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack3/5.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack3/6.png",
                    "delay": 60,
                    "origin": [
                      177,
                      181
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack3/7.png",
                    "delay": 60,
                    "origin": [
                      177,
                      166
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "2"
              },
              {
                "name": "attack4",
                "frames": [
                  {
                    "src": "images/skills/112/1121055/summon/attack4/0.png",
                    "delay": 60,
                    "origin": [
                      124,
                      181
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack4/1.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack4/2.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack4/3.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack4/4.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack4/5.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack4/6.png",
                    "delay": 60,
                    "origin": [
                      168,
                      181
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack4/7.png",
                    "delay": 60,
                    "origin": [
                      167,
                      166
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "2"
              },
              {
                "name": "attack5",
                "frames": [
                  {
                    "src": "images/skills/112/1121055/summon/attack5/0.png",
                    "delay": 60,
                    "origin": [
                      124,
                      181
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack5/1.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack5/2.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack5/3.png",
                    "delay": 60,
                    "origin": [
                      177,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack5/4.png",
                    "delay": 60,
                    "origin": [
                      174,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack5/5.png",
                    "delay": 60,
                    "origin": [
                      174,
                      185
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack5/6.png",
                    "delay": 60,
                    "origin": [
                      172,
                      181
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack5/7.png",
                    "delay": 60,
                    "origin": [
                      171,
                      166
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "2"
              },
              {
                "name": "attack6",
                "frames": [
                  {
                    "src": "images/skills/112/1121055/summon/attack6/0.png",
                    "delay": 60,
                    "origin": [
                      124,
                      158
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack6/1.png",
                    "delay": 60,
                    "origin": [
                      160,
                      226
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack6/2.png",
                    "delay": 60,
                    "origin": [
                      161,
                      226
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack6/3.png",
                    "delay": 60,
                    "origin": [
                      161,
                      217
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack6/4.png",
                    "delay": 60,
                    "origin": [
                      156,
                      219
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack6/5.png",
                    "delay": 60,
                    "origin": [
                      134,
                      219
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack6/6.png",
                    "delay": 60,
                    "origin": [
                      134,
                      182
                    ]
                  },
                  {
                    "src": "images/skills/112/1121055/summon/attack6/7.png",
                    "delay": 60,
                    "origin": [
                      127,
                      182
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "2"
              }
            ],
            "summonVisual": {
              "summoned": [
                {
                  "src": "images/skills/112/1121055/summon/summoned/0.png",
                  "delay": 30,
                  "origin": [
                    0,
                    0
                  ]
                }
              ],
              "die": [
                {
                  "src": "images/skills/112/1121055/summon/die/0.png",
                  "delay": 30,
                  "origin": [
                    0,
                    0
                  ]
                }
              ],
              "stand": [
                {
                  "src": "images/skills/112/1121055/summon/stand/0.png",
                  "delay": 30,
                  "origin": [
                    0,
                    0
                  ]
                }
              ]
            }
          }
        }
      ]
    },
    "114": {
      "jobId": 114,
      "name": "英雄 Hexa",
      "rank": "hexa",
      "skillBook": 114,
      "panel": "hexa",
      "skills": [
        {
          "id": "1140005",
          "name": "狂暴劍痕",
          "desc": "劍術已達登峰造極之境，因而留下深邃的#c劍痕#。#c劍痕#將於直接攻擊的技能命中一定次數時生成。劍痕將優先於最大HP最高的Boss怪物身上生成。",
          "h": "自己直接攻擊的技能命中#v次時，將生成#c劍傷#\\n劍士意念、鬥氣本能、魂靈巨劍命中#w次時視為1次攻擊。\\r\\n #c劍傷#在#t秒內可對最多#mobCount名敵人造成#damage%傷害並攻擊 #attackCount 次，攻擊#x次後消失，對單一敵人最多攻擊#u次。\\n最多可生成#y個，在鬥氣本能持續期間可生成至多#z個。",
          "rank": "hexa",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 53,
          "actions": [],
          "common": {
            "maxLevel": "30",
            "damage": "121+4*x",
            "mobCount": "8",
            "attackCount": "3",
            "lt": "-145, -95",
            "rb": "145, 95",
            "v": "5",
            "w": "2",
            "x": "32",
            "u": "4",
            "y": "5",
            "z": "10",
            "subTime": "170",
            "time": "1500",
            "s": "180",
            "s2": "40",
            "t": "1.5"
          },
          "icon": "images/skills/114/1140005.png",
          "skillBook": 114,
          "fx": {
            "hit": [
              {
                "src": "images/skills/114/1140005/hit/0.png",
                "delay": 60,
                "origin": [
                  84,
                  93
                ]
              },
              {
                "src": "images/skills/114/1140005/hit/1.png",
                "delay": 60,
                "origin": [
                  84,
                  102
                ]
              },
              {
                "src": "images/skills/114/1140005/hit/2.png",
                "delay": 60,
                "origin": [
                  109,
                  103
                ]
              },
              {
                "src": "images/skills/114/1140005/hit/3.png",
                "delay": 60,
                "origin": [
                  108,
                  104
                ]
              },
              {
                "src": "images/skills/114/1140005/hit/4.png",
                "delay": 60,
                "origin": [
                  108,
                  91
                ]
              },
              {
                "src": "images/skills/114/1140005/hit/5.png",
                "delay": 60,
                "origin": [
                  108,
                  91
                ]
              },
              {
                "src": "images/skills/114/1140005/hit/6.png",
                "delay": 60,
                "origin": [
                  108,
                  23
                ]
              }
            ]
          }
        },
        {
          "id": "1140009",
          "name": "終極攻擊VI",
          "desc": "使用依一定機率發動直接攻擊的攻擊技能後，發動追加攻擊。追加攻擊將優先攻擊最大HP最高的Boss怪物。",
          "h": "#c[終極攻擊系列技能]# #prop%機率發動可造成#damage%傷害#attackCount次的終極攻擊",
          "rank": "hexa",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 53,
          "actions": [],
          "common": {
            "damage": "186+3*x",
            "prop": "61",
            "ar": "7",
            "maxLevel": "30",
            "attackCount": "3"
          },
          "icon": "images/skills/114/1140009.png",
          "skillBook": 114,
          "fx": {
            "hit": [
              {
                "src": "images/skills/114/1140009/hit/0.png",
                "delay": 60,
                "origin": [
                  100,
                  99
                ]
              },
              {
                "src": "images/skills/114/1140009/hit/1.png",
                "delay": 60,
                "origin": [
                  100,
                  99
                ]
              },
              {
                "src": "images/skills/114/1140009/hit/2.png",
                "delay": 60,
                "origin": [
                  100,
                  106
                ]
              },
              {
                "src": "images/skills/114/1140009/hit/3.png",
                "delay": 60,
                "origin": [
                  95,
                  118
                ]
              },
              {
                "src": "images/skills/114/1140009/hit/4.png",
                "delay": 60,
                "origin": [
                  95,
                  121
                ]
              },
              {
                "src": "images/skills/114/1140009/hit/5.png",
                "delay": 60,
                "origin": [
                  89,
                  124
                ]
              },
              {
                "src": "images/skills/114/1140009/hit/6.png",
                "delay": 60,
                "origin": [
                  83,
                  125
                ]
              },
              {
                "src": "images/skills/114/1140009/hit/7.png",
                "delay": 60,
                "origin": [
                  66,
                  103
                ]
              }
            ]
          }
        },
        {
          "id": "1141000",
          "name": "狂暴攻擊VI",
          "desc": "#c[劍術]# 瞬間斬擊前方數名的敵人。最後攻擊一定會套用爆擊。鬥氣最大值時，技能獲得強化。",
          "h": "消耗MP#mpCon，最多攻擊#mobCount名敵人，以#damage%傷害攻擊#attackCount次。最後一擊必為爆擊，燃燒靈魂之劍一般狀態的攻擊範圍增加\\n#c強化狂暴攻擊#：以#x%的傷害攻擊#y次，最後的兩次攻擊必為爆擊，鬥氣本能與燃燒靈魂之劍一般狀態攻擊範圍增加",
          "rank": "hexa",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 10,
          "areaAttack": true,
          "actions": [
            "6thRagingBlow1",
            "6thRagingBlow2",
            "6thRagingBlow3",
            "6thRagingBlow4"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "45+d(x/5)",
            "damage": "350+6*x",
            "attackCount": "4",
            "mobCount": "8",
            "lt": "-360, -240",
            "rb": "40, 70",
            "x": "421+10*x",
            "y": "4"
          },
          "icon": "images/skills/114/1141000.png",
          "skillBook": 114,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141000/effect/0.png",
                "delay": 60,
                "origin": [
                  47,
                  73
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/1.png",
                "delay": 60,
                "origin": [
                  47,
                  73
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/2.png",
                "delay": 60,
                "origin": [
                  47,
                  75
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/3.png",
                "delay": 60,
                "origin": [
                  48,
                  79
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/4.png",
                "delay": 60,
                "origin": [
                  482,
                  323
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/5.png",
                "delay": 60,
                "origin": [
                  498,
                  341
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/6.png",
                "delay": 60,
                "origin": [
                  451,
                  348
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/7.png",
                "delay": 60,
                "origin": [
                  446,
                  347
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/8.png",
                "delay": 60,
                "origin": [
                  468,
                  352
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/9.png",
                "delay": 60,
                "origin": [
                  485,
                  333
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/10.png",
                "delay": 60,
                "origin": [
                  482,
                  326
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/11.png",
                "delay": 60,
                "origin": [
                  460,
                  325
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/12.png",
                "delay": 60,
                "origin": [
                  460,
                  322
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/13.png",
                "delay": 60,
                "origin": [
                  458,
                  320
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/14.png",
                "delay": 30,
                "origin": [
                  456,
                  244
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/15.png",
                "delay": 30,
                "origin": [
                  455,
                  239
                ]
              },
              {
                "src": "images/skills/114/1141000/effect/16.png",
                "delay": 30,
                "origin": [
                  456,
                  237
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/114/1141000/hit/0.png",
                "delay": 60,
                "origin": [
                  154,
                  86
                ]
              },
              {
                "src": "images/skills/114/1141000/hit/1.png",
                "delay": 60,
                "origin": [
                  146,
                  82
                ]
              },
              {
                "src": "images/skills/114/1141000/hit/2.png",
                "delay": 60,
                "origin": [
                  124,
                  81
                ]
              },
              {
                "src": "images/skills/114/1141000/hit/3.png",
                "delay": 60,
                "origin": [
                  83,
                  85
                ]
              },
              {
                "src": "images/skills/114/1141000/hit/4.png",
                "delay": 60,
                "origin": [
                  86,
                  89
                ]
              },
              {
                "src": "images/skills/114/1141000/hit/5.png",
                "delay": 60,
                "origin": [
                  88,
                  88
                ]
              }
            ]
          }
        },
        {
          "id": "1141001",
          "name": "狂暴攻擊VI",
          "desc": "",
          "h": "",
          "rank": "hexa",
          "type": "active",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "6thEnhanceRagingBlowA1",
            "6thEnhanceRagingBlowA2",
            "6thEnhanceRagingBlowA3",
            "6thEnhanceRagingBlowA4",
            "6thEnhanceRagingBlowB1",
            "6thEnhanceRagingBlowB2",
            "6thEnhanceRagingBlowB3",
            "6thEnhanceRagingBlowB4"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "45+d(x/5)",
            "damage": "421+10*x",
            "attackCount": "4",
            "mobCount": "8",
            "lt": "-425, -250",
            "rb": "70, 100",
            "w": "1000"
          },
          "icon": "images/skills/114/1141001.png",
          "skillBook": 114,
          "skipPanel": true,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141001/effect/0.png",
                "delay": 60,
                "origin": [
                  94,
                  192
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/1.png",
                "delay": 60,
                "origin": [
                  82,
                  172
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/2.png",
                "delay": 60,
                "origin": [
                  67,
                  174
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/3.png",
                "delay": 60,
                "origin": [
                  607,
                  238
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/4.png",
                "delay": 60,
                "origin": [
                  576,
                  231
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/5.png",
                "delay": 60,
                "origin": [
                  569,
                  323
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/6.png",
                "delay": 60,
                "origin": [
                  649,
                  302
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/7.png",
                "delay": 60,
                "origin": [
                  599,
                  300
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/8.png",
                "delay": 60,
                "origin": [
                  608,
                  302
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/9.png",
                "delay": 60,
                "origin": [
                  598,
                  317
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/10.png",
                "delay": 60,
                "origin": [
                  532,
                  363
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/11.png",
                "delay": 60,
                "origin": [
                  527,
                  362
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/12.png",
                "delay": 60,
                "origin": [
                  522,
                  364
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/13.png",
                "delay": 60,
                "origin": [
                  512,
                  357
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/14.png",
                "delay": 60,
                "origin": [
                  517,
                  360
                ]
              },
              {
                "src": "images/skills/114/1141001/effect/15.png",
                "delay": 60,
                "origin": [
                  423,
                  327
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/114/1141001/hit/0.png",
                "delay": 60,
                "origin": [
                  171,
                  88
                ]
              },
              {
                "src": "images/skills/114/1141001/hit/1.png",
                "delay": 60,
                "origin": [
                  163,
                  88
                ]
              },
              {
                "src": "images/skills/114/1141001/hit/2.png",
                "delay": 60,
                "origin": [
                  139,
                  88
                ]
              },
              {
                "src": "images/skills/114/1141001/hit/3.png",
                "delay": 60,
                "origin": [
                  124,
                  92
                ]
              },
              {
                "src": "images/skills/114/1141001/hit/4.png",
                "delay": 60,
                "origin": [
                  127,
                  96
                ]
              },
              {
                "src": "images/skills/114/1141001/hit/5.png",
                "delay": 60,
                "origin": [
                  127,
                  95
                ]
              }
            ]
          }
        },
        {
          "id": "1141002",
          "name": "憤怒爆發VI",
          "desc": "具現古代戰士的憤怒，讓前方的敵人陷入火海當中。",
          "h": "消耗MP #mpCon\\n最多對#mobCount名敵方發動以#damage%的傷害攻擊#attackCount次的斬擊#u次\\n冷卻時間#cooltime秒\\n[被動效果：狂暴攻擊VI的傷害增加#damPlus%p]",
          "rank": "hexa",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "6thRageUprising"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "200+x",
            "damage": "191+5*x",
            "attackCount": "8",
            "mobCount": "10",
            "cooltime": "10",
            "updatableTime": "600",
            "lt": "-460, -600",
            "rb": "110, 140",
            "damPlus": "37+4*x",
            "u": "4"
          },
          "icon": "images/skills/114/1141002.png",
          "skillBook": 114,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141002/effect/0.png",
                "delay": 60,
                "origin": [
                  184,
                  155
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/1.png",
                "delay": 60,
                "origin": [
                  181,
                  223
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/2.png",
                "delay": 60,
                "origin": [
                  178,
                  255
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/3.png",
                "delay": 60,
                "origin": [
                  176,
                  249
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/4.png",
                "delay": 60,
                "origin": [
                  172,
                  243
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/5.png",
                "delay": 60,
                "origin": [
                  188,
                  207
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/6.png",
                "delay": 60,
                "origin": [
                  196,
                  194
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/7.png",
                "delay": 60,
                "origin": [
                  197,
                  187
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/8.png",
                "delay": 60,
                "origin": [
                  196,
                  172
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/9.png",
                "delay": 60,
                "origin": [
                  195,
                  169
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/10.png",
                "delay": 60,
                "origin": [
                  191,
                  146
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/11.png",
                "delay": 60,
                "origin": [
                  187,
                  138
                ]
              },
              {
                "src": "images/skills/114/1141002/effect/12.png",
                "delay": 60,
                "origin": [
                  185,
                  96
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/114/1141002/effect0/0.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/1.png",
                "delay": 60,
                "origin": [
                  681,
                  612
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/2.png",
                "delay": 60,
                "origin": [
                  763,
                  691
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/3.png",
                "delay": 60,
                "origin": [
                  774,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/4.png",
                "delay": 60,
                "origin": [
                  778,
                  687
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/5.png",
                "delay": 60,
                "origin": [
                  781,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/6.png",
                "delay": 60,
                "origin": [
                  783,
                  691
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/7.png",
                "delay": 60,
                "origin": [
                  780,
                  685
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/8.png",
                "delay": 60,
                "origin": [
                  776,
                  690
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/9.png",
                "delay": 60,
                "origin": [
                  773,
                  685
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/10.png",
                "delay": 60,
                "origin": [
                  769,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/11.png",
                "delay": 60,
                "origin": [
                  723,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/12.png",
                "delay": 60,
                "origin": [
                  719,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/13.png",
                "delay": 60,
                "origin": [
                  723,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/14.png",
                "delay": 60,
                "origin": [
                  728,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/15.png",
                "delay": 60,
                "origin": [
                  738,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/16.png",
                "delay": 60,
                "origin": [
                  739,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/17.png",
                "delay": 60,
                "origin": [
                  738,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/18.png",
                "delay": 60,
                "origin": [
                  729,
                  698
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/19.png",
                "delay": 60,
                "origin": [
                  719,
                  691
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/20.png",
                "delay": 60,
                "origin": [
                  687,
                  686
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/21.png",
                "delay": 60,
                "origin": [
                  646,
                  683
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/22.png",
                "delay": 60,
                "origin": [
                  629,
                  683
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/23.png",
                "delay": 60,
                "origin": [
                  615,
                  672
                ]
              },
              {
                "src": "images/skills/114/1141002/effect0/24.png",
                "delay": 60,
                "origin": [
                  612,
                  660
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/114/1141002/hit/0.png",
                "delay": 60,
                "origin": [
                  86,
                  67
                ]
              },
              {
                "src": "images/skills/114/1141002/hit/1.png",
                "delay": 60,
                "origin": [
                  104,
                  87
                ]
              },
              {
                "src": "images/skills/114/1141002/hit/2.png",
                "delay": 60,
                "origin": [
                  106,
                  91
                ]
              },
              {
                "src": "images/skills/114/1141002/hit/3.png",
                "delay": 60,
                "origin": [
                  111,
                  91
                ]
              },
              {
                "src": "images/skills/114/1141002/hit/4.png",
                "delay": 60,
                "origin": [
                  113,
                  95
                ]
              },
              {
                "src": "images/skills/114/1141002/hit/5.png",
                "delay": 60,
                "origin": [
                  117,
                  97
                ]
              },
              {
                "src": "images/skills/114/1141002/hit/6.png",
                "delay": 60,
                "origin": [
                  118,
                  95
                ]
              },
              {
                "src": "images/skills/114/1141002/hit/7.png",
                "delay": 60,
                "origin": [
                  118,
                  95
                ]
              }
            ]
          }
        },
        {
          "id": "1141003",
          "name": "靈氣之刃VI",
          "desc": "朝任意方向發射能夠撕裂敵人的劍氣。可朝#c8個方向#發射，搭配方向鍵使用時即可朝該方向發射。\\n連續使用時，可連接#c終極斬刃#。",
          "h": "消耗#mpCon MP，發射劍氣，並對最多#mobCount名敵人造成#damage%傷害#attackCount次\\n以靈氣之刃VI攻擊一般怪物時，傷害增加#u%p\\n靈氣之刃每#v2秒將累積1個，最多可累積2個\\n#s秒內再次使用時，下次攻擊將轉換為#c終極之刃#\\n#c終極之刃#：對最多#s2名敵人造成#s3%傷害#s4次攻擊",
          "rank": "hexa",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "projectile": true,
          "actions": [
            "6thAuraBlade"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "27+u(x/6)",
            "damage": "328+6*x",
            "mobCount": "8",
            "attackCount": "5",
            "u": "200+3*x",
            "v": "4000",
            "w": "2",
            "x": "2000",
            "v2": "4",
            "s": "2",
            "s2": "8",
            "s3": "522+8*x",
            "s4": "5",
            "cancelableTime": "30"
          },
          "icon": "images/skills/114/1141003.png",
          "skillBook": 114,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141003/effect/0.png",
                "delay": 60,
                "origin": [
                  97,
                  47
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/1.png",
                "delay": 60,
                "origin": [
                  71,
                  63
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/2.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/3.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/4.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/5.png",
                "delay": 60,
                "origin": [
                  328,
                  307
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/6.png",
                "delay": 60,
                "origin": [
                  385,
                  333
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/7.png",
                "delay": 60,
                "origin": [
                  432,
                  337
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/8.png",
                "delay": 60,
                "origin": [
                  390,
                  337
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/9.png",
                "delay": 60,
                "origin": [
                  386,
                  331
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/10.png",
                "delay": 60,
                "origin": [
                  372,
                  325
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/11.png",
                "delay": 60,
                "origin": [
                  369,
                  320
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/12.png",
                "delay": 60,
                "origin": [
                  363,
                  312
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/13.png",
                "delay": 60,
                "origin": [
                  357,
                  302
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/14.png",
                "delay": 60,
                "origin": [
                  313,
                  294
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/15.png",
                "delay": 60,
                "origin": [
                  239,
                  287
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/16.png",
                "delay": 60,
                "origin": [
                  237,
                  277
                ]
              },
              {
                "src": "images/skills/114/1141003/effect/17.png",
                "delay": 60,
                "origin": [
                  206,
                  259
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/114/1141003/effect0/0.png",
                "delay": 300,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/1.png",
                "delay": 60,
                "origin": [
                  136,
                  121
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/2.png",
                "delay": 60,
                "origin": [
                  180,
                  152
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/3.png",
                "delay": 60,
                "origin": [
                  200,
                  165
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/4.png",
                "delay": 60,
                "origin": [
                  211,
                  179
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/5.png",
                "delay": 60,
                "origin": [
                  218,
                  185
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/6.png",
                "delay": 60,
                "origin": [
                  221,
                  187
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/7.png",
                "delay": 60,
                "origin": [
                  219,
                  186
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/8.png",
                "delay": 60,
                "origin": [
                  220,
                  187
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/9.png",
                "delay": 60,
                "origin": [
                  224,
                  193
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/10.png",
                "delay": 60,
                "origin": [
                  230,
                  198
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/11.png",
                "delay": 60,
                "origin": [
                  238,
                  203
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/12.png",
                "delay": 60,
                "origin": [
                  243,
                  212
                ]
              },
              {
                "src": "images/skills/114/1141003/effect0/13.png",
                "delay": 60,
                "origin": [
                  241,
                  219
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/114/1141003/hit/0.png",
                "delay": 60,
                "origin": [
                  81,
                  80
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/1.png",
                "delay": 60,
                "origin": [
                  83,
                  106
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/2.png",
                "delay": 60,
                "origin": [
                  103,
                  127
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/3.png",
                "delay": 60,
                "origin": [
                  103,
                  127
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/4.png",
                "delay": 60,
                "origin": [
                  103,
                  127
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/5.png",
                "delay": 60,
                "origin": [
                  100,
                  123
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/6.png",
                "delay": 60,
                "origin": [
                  100,
                  123
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/7.png",
                "delay": 60,
                "origin": [
                  96,
                  120
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/8.png",
                "delay": 60,
                "origin": [
                  95,
                  119
                ]
              },
              {
                "src": "images/skills/114/1141003/hit/9.png",
                "delay": 60,
                "origin": [
                  80,
                  102
                ]
              }
            ],
            "shootobj": {
              "layers": [
                {
                  "name": "b1",
                  "frames": [
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/0.png",
                      "delay": 60,
                      "origin": [
                        245,
                        193
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/1.png",
                      "delay": 60,
                      "origin": [
                        250,
                        197
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/2.png",
                      "delay": 60,
                      "origin": [
                        240,
                        200
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/3.png",
                      "delay": 60,
                      "origin": [
                        242,
                        203
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/4.png",
                      "delay": 60,
                      "origin": [
                        246,
                        204
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/5.png",
                      "delay": 60,
                      "origin": [
                        247,
                        203
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/6.png",
                      "delay": 60,
                      "origin": [
                        245,
                        193
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/7.png",
                      "delay": 60,
                      "origin": [
                        250,
                        197
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/8.png",
                      "delay": 60,
                      "origin": [
                        240,
                        200
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/9.png",
                      "delay": 60,
                      "origin": [
                        242,
                        203
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/10.png",
                      "delay": 60,
                      "origin": [
                        246,
                        204
                      ]
                    },
                    {
                      "src": "images/skills/114/1141003/shootobj/b1/11.png",
                      "delay": 60,
                      "origin": [
                        247,
                        203
                      ]
                    }
                  ]
                }
              ],
              "start": [
                -80,
                -60
              ],
              "bodyWH": [
                300,
                300
              ],
              "startDelayMs": 240,
              "pierce": true,
              "noHitWhenMaxCount": true,
              "moveList": {
                "p1": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      0,
                      600
                    ]
                  }
                ],
                "p2": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -600,
                      0
                    ]
                  }
                ],
                "p3": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      0,
                      -600
                    ]
                  }
                ],
                "p4": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -425,
                      425
                    ]
                  }
                ],
                "p5": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -425,
                      -425
                    ]
                  }
                ]
              }
            }
          }
        },
        {
          "id": "1141004",
          "name": "終極之刃",
          "desc": "朝任意方向發射能夠撕裂敵人的強勁劍氣。可朝#c8個方向#發射，搭配方向鍵使用時即可朝該方向發動技能。",
          "h": "消耗#mpCon MP，發射劍氣，並對最多#mobCount名敵人造成#damage%傷害#attackCount次",
          "rank": "hexa",
          "type": "active",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 1,
          "projectile": true,
          "actions": [
            "6thAuraBladeNew"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "27+u(x/6)",
            "damage": "522+8*x",
            "mobCount": "8",
            "attackCount": "5",
            "u": "200+3*x"
          },
          "icon": "images/skills/114/1141004.png",
          "skillBook": 114,
          "skipPanel": true,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141004/effect/0.png",
                "delay": 60,
                "origin": [
                  97,
                  47
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/1.png",
                "delay": 60,
                "origin": [
                  71,
                  63
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/2.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/3.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/4.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/5.png",
                "delay": 60,
                "origin": [
                  366,
                  317
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/6.png",
                "delay": 60,
                "origin": [
                  412,
                  371
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/7.png",
                "delay": 60,
                "origin": [
                  465,
                  403
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/8.png",
                "delay": 60,
                "origin": [
                  489,
                  404
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/9.png",
                "delay": 60,
                "origin": [
                  472,
                  407
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/10.png",
                "delay": 60,
                "origin": [
                  479,
                  405
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/11.png",
                "delay": 60,
                "origin": [
                  447,
                  392
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/12.png",
                "delay": 60,
                "origin": [
                  441,
                  393
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/13.png",
                "delay": 60,
                "origin": [
                  441,
                  398
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/14.png",
                "delay": 60,
                "origin": [
                  447,
                  403
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/15.png",
                "delay": 60,
                "origin": [
                  418,
                  409
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/16.png",
                "delay": 60,
                "origin": [
                  458,
                  412
                ]
              },
              {
                "src": "images/skills/114/1141004/effect/17.png",
                "delay": 60,
                "origin": [
                  464,
                  415
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/114/1141004/effect0/0.png",
                "delay": 60,
                "origin": [
                  97,
                  47
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/1.png",
                "delay": 60,
                "origin": [
                  71,
                  63
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/2.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/3.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/4.png",
                "delay": 60,
                "origin": [
                  70,
                  65
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/5.png",
                "delay": 60,
                "origin": [
                  366,
                  317
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/6.png",
                "delay": 60,
                "origin": [
                  412,
                  371
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/7.png",
                "delay": 60,
                "origin": [
                  465,
                  403
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/8.png",
                "delay": 60,
                "origin": [
                  489,
                  404
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/9.png",
                "delay": 60,
                "origin": [
                  472,
                  407
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/10.png",
                "delay": 60,
                "origin": [
                  479,
                  405
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/11.png",
                "delay": 60,
                "origin": [
                  447,
                  392
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/12.png",
                "delay": 60,
                "origin": [
                  441,
                  393
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/13.png",
                "delay": 60,
                "origin": [
                  441,
                  398
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/14.png",
                "delay": 60,
                "origin": [
                  447,
                  403
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/15.png",
                "delay": 60,
                "origin": [
                  418,
                  409
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/16.png",
                "delay": 60,
                "origin": [
                  458,
                  412
                ]
              },
              {
                "src": "images/skills/114/1141004/effect0/17.png",
                "delay": 60,
                "origin": [
                  464,
                  415
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/114/1141004/hit/0.png",
                "delay": 60,
                "origin": [
                  93,
                  92
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/1.png",
                "delay": 60,
                "origin": [
                  103,
                  131
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/2.png",
                "delay": 60,
                "origin": [
                  100,
                  135
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/3.png",
                "delay": 60,
                "origin": [
                  100,
                  136
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/4.png",
                "delay": 60,
                "origin": [
                  101,
                  136
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/5.png",
                "delay": 60,
                "origin": [
                  102,
                  136
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/6.png",
                "delay": 60,
                "origin": [
                  103,
                  137
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/7.png",
                "delay": 60,
                "origin": [
                  101,
                  137
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/8.png",
                "delay": 60,
                "origin": [
                  101,
                  137
                ]
              },
              {
                "src": "images/skills/114/1141004/hit/9.png",
                "delay": 60,
                "origin": [
                  98,
                  136
                ]
              }
            ],
            "shootobj": {
              "layers": [
                {
                  "name": "b1",
                  "frames": [
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/0.png",
                      "delay": 60,
                      "origin": [
                        254,
                        229
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/1.png",
                      "delay": 60,
                      "origin": [
                        260,
                        231
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/2.png",
                      "delay": 60,
                      "origin": [
                        249,
                        236
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/3.png",
                      "delay": 60,
                      "origin": [
                        251,
                        240
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/4.png",
                      "delay": 60,
                      "origin": [
                        256,
                        244
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/5.png",
                      "delay": 60,
                      "origin": [
                        257,
                        242
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/6.png",
                      "delay": 60,
                      "origin": [
                        254,
                        229
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/7.png",
                      "delay": 60,
                      "origin": [
                        260,
                        231
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/8.png",
                      "delay": 60,
                      "origin": [
                        249,
                        236
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/9.png",
                      "delay": 60,
                      "origin": [
                        251,
                        240
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/10.png",
                      "delay": 60,
                      "origin": [
                        256,
                        244
                      ]
                    },
                    {
                      "src": "images/skills/114/1141004/shootobj/b1/11.png",
                      "delay": 60,
                      "origin": [
                        257,
                        242
                      ]
                    }
                  ]
                }
              ],
              "start": [
                -80,
                -60
              ],
              "bodyWH": [
                320,
                340
              ],
              "startDelayMs": 240,
              "pierce": true,
              "noHitWhenMaxCount": true,
              "moveList": {
                "p1": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      0,
                      600
                    ]
                  }
                ],
                "p2": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -600,
                      0
                    ]
                  }
                ],
                "p3": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      0,
                      -600
                    ]
                  }
                ],
                "p4": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -425,
                      425
                    ]
                  }
                ],
                "p5": [
                  {
                    "v": 50,
                    "delay": 0,
                    "pos": [
                      -425,
                      -425
                    ]
                  }
                ]
              }
            }
          }
        },
        {
          "id": "1141006",
          "name": "劍士意念VI",
          "desc": "可發揮蘊含古代戰士意志的強大力量。英雄使用#c劍術#技能時，每一段時間，發生攻擊的位置會留下劍擊殘像對敵人造成額外攻擊。劍擊將優先攻擊最大HP最高的BOSS怪物。共用技能、5轉技能不會產生劍擊。",
          "h": "消耗MP#mpCon，#time秒內不會因敵人的攻擊而被推開，且鬥氣補充至最大值，\\nBuff有效時間內，增加攻擊力#indiePad、爆擊機率#indieCr%、狀態異常耐性#x、所有屬性耐性 #y%，\\n每隔一段時間形成對最多#mobCount名的敵人以#damage%的傷害攻擊#attackCount次的劍擊#w個，劍擊最多發生#u2次，劍擊結束後就不會再出現。\\n冷卻時間#cooltime秒",
          "rank": "hexa",
          "type": "buff",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 50,
          "actions": [
            "6thValhalla"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "300+2*x",
            "x": "100",
            "y": "100",
            "time": "30",
            "cooltime": "120",
            "indieCr": "30",
            "indiePad": "50",
            "w": "3",
            "damage": "224+6*x",
            "mobCount": "6",
            "u2": "12",
            "attackCount": "5"
          },
          "icon": "images/skills/114/1141006.png",
          "skillBook": 114,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141006/effect/0.png",
                "delay": 660,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/1.png",
                "delay": 60,
                "origin": [
                  297,
                  578
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/2.png",
                "delay": 60,
                "origin": [
                  297,
                  588
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/3.png",
                "delay": 60,
                "origin": [
                  296,
                  571
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/4.png",
                "delay": 60,
                "origin": [
                  299,
                  520
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/5.png",
                "delay": 60,
                "origin": [
                  302,
                  423
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/6.png",
                "delay": 60,
                "origin": [
                  304,
                  424
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/7.png",
                "delay": 60,
                "origin": [
                  302,
                  432
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/8.png",
                "delay": 60,
                "origin": [
                  282,
                  438
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/9.png",
                "delay": 60,
                "origin": [
                  269,
                  440
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/10.png",
                "delay": 60,
                "origin": [
                  272,
                  437
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/11.png",
                "delay": 60,
                "origin": [
                  244,
                  415
                ]
              },
              {
                "src": "images/skills/114/1141006/effect/12.png",
                "delay": 60,
                "origin": [
                  243,
                  414
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/114/1141006/effect0/0.png",
                "delay": 60,
                "origin": [
                  234,
                  494
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/1.png",
                "delay": 60,
                "origin": [
                  228,
                  523
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/2.png",
                "delay": 60,
                "origin": [
                  235,
                  542
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/3.png",
                "delay": 60,
                "origin": [
                  234,
                  543
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/4.png",
                "delay": 60,
                "origin": [
                  237,
                  543
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/5.png",
                "delay": 60,
                "origin": [
                  234,
                  543
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/6.png",
                "delay": 60,
                "origin": [
                  243,
                  544
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/7.png",
                "delay": 60,
                "origin": [
                  243,
                  550
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/8.png",
                "delay": 60,
                "origin": [
                  244,
                  560
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/9.png",
                "delay": 60,
                "origin": [
                  265,
                  560
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/10.png",
                "delay": 60,
                "origin": [
                  251,
                  573
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/11.png",
                "delay": 60,
                "origin": [
                  403,
                  563
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/12.png",
                "delay": 60,
                "origin": [
                  315,
                  563
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/13.png",
                "delay": 60,
                "origin": [
                  296,
                  557
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/14.png",
                "delay": 60,
                "origin": [
                  287,
                  555
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/15.png",
                "delay": 60,
                "origin": [
                  285,
                  555
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/16.png",
                "delay": 60,
                "origin": [
                  289,
                  552
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/17.png",
                "delay": 60,
                "origin": [
                  292,
                  545
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/18.png",
                "delay": 60,
                "origin": [
                  299,
                  432
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/19.png",
                "delay": 60,
                "origin": [
                  307,
                  440
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/20.png",
                "delay": 60,
                "origin": [
                  317,
                  442
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/21.png",
                "delay": 60,
                "origin": [
                  319,
                  444
                ]
              },
              {
                "src": "images/skills/114/1141006/effect0/22.png",
                "delay": 60,
                "origin": [
                  323,
                  423
                ]
              }
            ]
          },
          "summonSkillId": "1141007"
        },
        {
          "id": "1141007",
          "name": "劍士意念VI",
          "desc": "可發揮蘊含古代戰士意志的強大力量。",
          "h": "",
          "rank": "hexa",
          "type": "summon",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "30",
            "damage": "224+6*x",
            "w": "3",
            "subTime": "480",
            "time": "10000",
            "attackDelay": "120",
            "q": "70",
            "q2": "30",
            "x": "1",
            "u": "300"
          },
          "icon": "images/skills/114/1141007.png",
          "skillBook": 114,
          "skipPanel": true,
          "fx": {
            "summonAttacks": [
              {
                "name": "attack1",
                "frames": [
                  {
                    "src": "images/skills/114/1141007/summon/attack1/0.png",
                    "delay": 60,
                    "origin": [
                      219,
                      222
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack1/1.png",
                    "delay": 60,
                    "origin": [
                      217,
                      218
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack1/2.png",
                    "delay": 60,
                    "origin": [
                      228,
                      239
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack1/3.png",
                    "delay": 60,
                    "origin": [
                      231,
                      234
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack1/4.png",
                    "delay": 60,
                    "origin": [
                      229,
                      234
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack1/5.png",
                    "delay": 60,
                    "origin": [
                      227,
                      233
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack1/6.png",
                    "delay": 60,
                    "origin": [
                      226,
                      230
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack1/7.png",
                    "delay": 60,
                    "origin": [
                      224,
                      230
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack1/8.png",
                    "delay": 60,
                    "origin": [
                      221,
                      225
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "5"
              },
              {
                "name": "attack2",
                "frames": [
                  {
                    "src": "images/skills/114/1141007/summon/attack2/0.png",
                    "delay": 60,
                    "origin": [
                      239,
                      173
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack2/1.png",
                    "delay": 60,
                    "origin": [
                      240,
                      174
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack2/2.png",
                    "delay": 60,
                    "origin": [
                      252,
                      200
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack2/3.png",
                    "delay": 60,
                    "origin": [
                      236,
                      197
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack2/4.png",
                    "delay": 60,
                    "origin": [
                      243,
                      196
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack2/5.png",
                    "delay": 60,
                    "origin": [
                      246,
                      196
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack2/6.png",
                    "delay": 60,
                    "origin": [
                      242,
                      192
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack2/7.png",
                    "delay": 60,
                    "origin": [
                      244,
                      192
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack2/8.png",
                    "delay": 60,
                    "origin": [
                      246,
                      187
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "5"
              },
              {
                "name": "attack3",
                "frames": [
                  {
                    "src": "images/skills/114/1141007/summon/attack3/0.png",
                    "delay": 60,
                    "origin": [
                      226,
                      189
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack3/1.png",
                    "delay": 60,
                    "origin": [
                      226,
                      184
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack3/2.png",
                    "delay": 60,
                    "origin": [
                      224,
                      201
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack3/3.png",
                    "delay": 60,
                    "origin": [
                      223,
                      198
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack3/4.png",
                    "delay": 60,
                    "origin": [
                      222,
                      197
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack3/5.png",
                    "delay": 60,
                    "origin": [
                      221,
                      197
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack3/6.png",
                    "delay": 60,
                    "origin": [
                      220,
                      193
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack3/7.png",
                    "delay": 60,
                    "origin": [
                      216,
                      193
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack3/8.png",
                    "delay": 60,
                    "origin": [
                      216,
                      188
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "5"
              },
              {
                "name": "attack4",
                "frames": [
                  {
                    "src": "images/skills/114/1141007/summon/attack4/0.png",
                    "delay": 60,
                    "origin": [
                      193,
                      160
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack4/1.png",
                    "delay": 60,
                    "origin": [
                      194,
                      191
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack4/2.png",
                    "delay": 60,
                    "origin": [
                      205,
                      192
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack4/3.png",
                    "delay": 60,
                    "origin": [
                      200,
                      190
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack4/4.png",
                    "delay": 60,
                    "origin": [
                      204,
                      188
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack4/5.png",
                    "delay": 60,
                    "origin": [
                      204,
                      187
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack4/6.png",
                    "delay": 60,
                    "origin": [
                      205,
                      186
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack4/7.png",
                    "delay": 60,
                    "origin": [
                      208,
                      187
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack4/8.png",
                    "delay": 60,
                    "origin": [
                      209,
                      181
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "5"
              },
              {
                "name": "attack5",
                "frames": [
                  {
                    "src": "images/skills/114/1141007/summon/attack5/0.png",
                    "delay": 60,
                    "origin": [
                      208,
                      210
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack5/1.png",
                    "delay": 60,
                    "origin": [
                      207,
                      208
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack5/2.png",
                    "delay": 60,
                    "origin": [
                      218,
                      205
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack5/3.png",
                    "delay": 60,
                    "origin": [
                      225,
                      204
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack5/4.png",
                    "delay": 60,
                    "origin": [
                      226,
                      204
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack5/5.png",
                    "delay": 60,
                    "origin": [
                      221,
                      202
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack5/6.png",
                    "delay": 60,
                    "origin": [
                      216,
                      202
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack5/7.png",
                    "delay": 60,
                    "origin": [
                      214,
                      202
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack5/8.png",
                    "delay": 60,
                    "origin": [
                      211,
                      202
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "5"
              },
              {
                "name": "attack6",
                "frames": [
                  {
                    "src": "images/skills/114/1141007/summon/attack6/0.png",
                    "delay": 60,
                    "origin": [
                      183,
                      247
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack6/1.png",
                    "delay": 60,
                    "origin": [
                      183,
                      233
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack6/2.png",
                    "delay": 60,
                    "origin": [
                      200,
                      241
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack6/3.png",
                    "delay": 60,
                    "origin": [
                      197,
                      258
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack6/4.png",
                    "delay": 60,
                    "origin": [
                      196,
                      277
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack6/5.png",
                    "delay": 60,
                    "origin": [
                      196,
                      279
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack6/6.png",
                    "delay": 60,
                    "origin": [
                      192,
                      272
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack6/7.png",
                    "delay": 60,
                    "origin": [
                      192,
                      243
                    ]
                  },
                  {
                    "src": "images/skills/114/1141007/summon/attack6/8.png",
                    "delay": 60,
                    "origin": [
                      187,
                      245
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "5"
              }
            ],
            "summonVisual": {
              "summoned": [
                {
                  "src": "images/skills/114/1141007/summon/summoned/0.png",
                  "delay": 30,
                  "origin": [
                    0,
                    0
                  ]
                }
              ],
              "die": [
                {
                  "src": "images/skills/114/1141007/summon/die/0.png",
                  "delay": 30,
                  "origin": [
                    0,
                    0
                  ]
                }
              ],
              "stand": [
                {
                  "src": "images/skills/114/1141007/summon/stand/0.png",
                  "delay": 30,
                  "origin": [
                    0,
                    0
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "1141008",
          "name": "烈焰翔斬VI",
          "desc": "#c[劍術]# 全神貫注，奮力向前方斬擊。使用究極劍術讓烙印在靈魂上的劍看起來像是具象化後攻擊。被攻擊的敵人會受到創傷，在一定時間內承受持續性傷害，且在承受持續性傷害期間所受#c傷害量增加#",
          "h": "消耗MP#mpCon，對最多#mobCount名敵人以#damage%的傷害攻擊#attackCount次，攻擊一般怪物時傷害#nbdR%增加\\n被攻擊的敵人以#prop%機率在#dotTime秒內每#dotInterval秒承受#dot%的傷害且#c傷害#x%增加#，隊員攻擊時#u%增加",
          "rank": "hexa",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 10,
          "areaAttack": true,
          "actions": [
            "6thIncising"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "36+d(x/5)",
            "x": "26",
            "u": "11",
            "damage": "430+7*x",
            "mobCount": "8",
            "attackCount": "4",
            "dot": "176+3*x",
            "time": "60",
            "prop": "100",
            "dotInterval": "2",
            "dotTime": "60",
            "lt": "-380, -320",
            "rb": "120, 70",
            "nbdR": "50"
          },
          "icon": "images/skills/114/1141008.png",
          "skillBook": 114,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141008/effect/0.png",
                "delay": 60,
                "origin": [
                  177,
                  651
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/1.png",
                "delay": 60,
                "origin": [
                  274,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/2.png",
                "delay": 60,
                "origin": [
                  263,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/3.png",
                "delay": 60,
                "origin": [
                  238,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/4.png",
                "delay": 60,
                "origin": [
                  240,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/5.png",
                "delay": 60,
                "origin": [
                  247,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/6.png",
                "delay": 60,
                "origin": [
                  254,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/7.png",
                "delay": 60,
                "origin": [
                  260,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/8.png",
                "delay": 60,
                "origin": [
                  271,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/9.png",
                "delay": 60,
                "origin": [
                  906,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/10.png",
                "delay": 60,
                "origin": [
                  906,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/11.png",
                "delay": 60,
                "origin": [
                  906,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/12.png",
                "delay": 60,
                "origin": [
                  871,
                  710
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/13.png",
                "delay": 60,
                "origin": [
                  762,
                  703
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/14.png",
                "delay": 60,
                "origin": [
                  491,
                  659
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/15.png",
                "delay": 60,
                "origin": [
                  493,
                  641
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/16.png",
                "delay": 60,
                "origin": [
                  485,
                  645
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/17.png",
                "delay": 60,
                "origin": [
                  487,
                  625
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/18.png",
                "delay": 60,
                "origin": [
                  490,
                  627
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/19.png",
                "delay": 60,
                "origin": [
                  492,
                  627
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/20.png",
                "delay": 60,
                "origin": [
                  495,
                  626
                ]
              },
              {
                "src": "images/skills/114/1141008/effect/21.png",
                "delay": 60,
                "origin": [
                  359,
                  342
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/114/1141008/effect0/0.png",
                "delay": 60,
                "origin": [
                  128,
                  236
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/1.png",
                "delay": 60,
                "origin": [
                  129,
                  238
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/2.png",
                "delay": 60,
                "origin": [
                  129,
                  238
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/3.png",
                "delay": 60,
                "origin": [
                  126,
                  233
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/4.png",
                "delay": 60,
                "origin": [
                  127,
                  213
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/5.png",
                "delay": 60,
                "origin": [
                  127,
                  214
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/6.png",
                "delay": 60,
                "origin": [
                  127,
                  196
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/7.png",
                "delay": 60,
                "origin": [
                  127,
                  173
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/8.png",
                "delay": 60,
                "origin": [
                  128,
                  141
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/9.png",
                "delay": 60,
                "origin": [
                  128,
                  140
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/10.png",
                "delay": 60,
                "origin": [
                  126,
                  138
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/11.png",
                "delay": 60,
                "origin": [
                  126,
                  100
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/12.png",
                "delay": 60,
                "origin": [
                  121,
                  66
                ]
              },
              {
                "src": "images/skills/114/1141008/effect0/13.png",
                "delay": 60,
                "origin": [
                  118,
                  35
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/114/1141008/hit/0.png",
                "delay": 60,
                "origin": [
                  49,
                  55
                ]
              },
              {
                "src": "images/skills/114/1141008/hit/1.png",
                "delay": 60,
                "origin": [
                  102,
                  91
                ]
              },
              {
                "src": "images/skills/114/1141008/hit/2.png",
                "delay": 60,
                "origin": [
                  97,
                  95
                ]
              },
              {
                "src": "images/skills/114/1141008/hit/3.png",
                "delay": 60,
                "origin": [
                  97,
                  97
                ]
              },
              {
                "src": "images/skills/114/1141008/hit/4.png",
                "delay": 60,
                "origin": [
                  98,
                  99
                ]
              },
              {
                "src": "images/skills/114/1141008/hit/5.png",
                "delay": 60,
                "origin": [
                  98,
                  96
                ]
              },
              {
                "src": "images/skills/114/1141008/hit/6.png",
                "delay": 60,
                "origin": [
                  97,
                  71
                ]
              },
              {
                "src": "images/skills/114/1141008/hit/7.png",
                "delay": 60,
                "origin": [
                  78,
                  54
                ]
              }
            ]
          }
        },
        {
          "id": "1141500",
          "name": "聖劍降臨",
          "desc": "#c[劍術]#劍與靈魂合體斬擊一切。\\n\\n#c10級：無視怪物防禦率提升20%\\n20級：攻擊Boss怪物時傷害增加20%\\n30級：無視怪物防禦率增加30%、攻擊Boss怪物時傷害增加30%#",
          "h": "消耗MP#mpCon，施展時無敵\\n最多鎖定#mobCount名敵方，發動以#damage%的傷害攻擊#attackCount次的斬擊#u次後，發動以#u2%的傷害攻擊#v次的最後一擊#v2次\\n冷卻時間#cooltime秒",
          "rank": "hexa",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "6thSpiritCaliber"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "1200",
            "mobCount": "15",
            "attackCount": "14",
            "cooltime": "360",
            "damage": "232+8*x",
            "lt": "-1200, -800",
            "rb": "1200, 800",
            "updatableTime": "8000",
            "ndTime": "8080",
            "u": "33",
            "ignoreMobpdpR": "log10(x)*20+log30(x)*30",
            "bdR": "log20(x)*20+log30(x)*30",
            "u2": "230+8*x",
            "v": "15",
            "v2": "48"
          },
          "icon": "images/skills/114/1141500.png",
          "skillBook": 114,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141500/effect/0.png",
                "delay": 90,
                "origin": [
                  0,
                  0
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/114/1141500/hit/0.png",
                "delay": 60,
                "origin": [
                  74,
                  128
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/1.png",
                "delay": 60,
                "origin": [
                  90,
                  106
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/2.png",
                "delay": 60,
                "origin": [
                  101,
                  107
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/3.png",
                "delay": 60,
                "origin": [
                  94,
                  109
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/4.png",
                "delay": 60,
                "origin": [
                  84,
                  110
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/5.png",
                "delay": 60,
                "origin": [
                  80,
                  110
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/6.png",
                "delay": 60,
                "origin": [
                  80,
                  110
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/7.png",
                "delay": 60,
                "origin": [
                  80,
                  111
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/8.png",
                "delay": 60,
                "origin": [
                  76,
                  110
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/9.png",
                "delay": 60,
                "origin": [
                  61,
                  107
                ]
              },
              {
                "src": "images/skills/114/1141500/hit/10.png",
                "delay": 60,
                "origin": [
                  58,
                  107
                ]
              }
            ]
          }
        },
        {
          "id": "1141502",
          "name": "無聲斬擊",
          "desc": "達到劍術的極致，連沉默也能斬斷。\\n\\n#c10級：增加無視怪物防禦率10%，增加Boss怪物傷害10%\\n20級：增加無視怪物防禦率10%，增加Boss怪物傷害10%\\n30級：增加無視怪物防禦率20%#",
          "h": "消耗MP#mpCon，施放動作中無敵。\\n對最多#mobCount名敵人以#damage%傷害攻擊#attackCount次的劍氣攻擊#dummyStr次。\\n怪物防禦率額外無視#dummyStr2%，對Boss怪物傷害#dummyStr3%增加，爆擊機率#cr%",
          "rank": "hexa",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "6thSilentCleave"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "1000",
            "mobCount": "15",
            "attackCount": "15",
            "cooltime": "240",
            "damage": "1255+249*x",
            "lt": "-1200, -800",
            "rb": "1200, 800",
            "updatableTime": "5000",
            "ndTime": "3400",
            "6thCount": "3",
            "cr": "100",
            "ignoreMobpdpR": "60+log10(x)*10+log20(x)*10+log30(x)*20",
            "bdR": "40+log10(x)*10+log20(x)*10",
            "dummyStr": "24",
            "dummyStr2": "60",
            "dummyStr3": "40"
          },
          "icon": "images/skills/114/1141502.png",
          "skillBook": 114,
          "fx": {
            "effect": [
              {
                "src": "images/skills/114/1141502/effect/0.png",
                "delay": 60,
                "origin": [
                  112,
                  121
                ]
              },
              {
                "src": "images/skills/114/1141502/effect/1.png",
                "delay": 60,
                "origin": [
                  109,
                  234
                ]
              },
              {
                "src": "images/skills/114/1141502/effect/2.png",
                "delay": 60,
                "origin": [
                  107,
                  245
                ]
              },
              {
                "src": "images/skills/114/1141502/effect/3.png",
                "delay": 60,
                "origin": [
                  108,
                  248
                ]
              },
              {
                "src": "images/skills/114/1141502/effect/4.png",
                "delay": 60,
                "origin": [
                  108,
                  251
                ]
              },
              {
                "src": "images/skills/114/1141502/effect/5.png",
                "delay": 60,
                "origin": [
                  110,
                  255
                ]
              },
              {
                "src": "images/skills/114/1141502/effect/6.png",
                "delay": 60,
                "origin": [
                  112,
                  257
                ]
              },
              {
                "src": "images/skills/114/1141502/effect/7.png",
                "delay": 60,
                "origin": [
                  113,
                  258
                ]
              },
              {
                "src": "images/skills/114/1141502/effect/8.png",
                "delay": 60,
                "origin": [
                  85,
                  236
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/114/1141502/hit/0.png",
                "delay": 60,
                "origin": [
                  120,
                  11
                ]
              },
              {
                "src": "images/skills/114/1141502/hit/1.png",
                "delay": 60,
                "origin": [
                  110,
                  41
                ]
              },
              {
                "src": "images/skills/114/1141502/hit/2.png",
                "delay": 60,
                "origin": [
                  108,
                  41
                ]
              },
              {
                "src": "images/skills/114/1141502/hit/3.png",
                "delay": 60,
                "origin": [
                  102,
                  36
                ]
              },
              {
                "src": "images/skills/114/1141502/hit/4.png",
                "delay": 60,
                "origin": [
                  102,
                  25
                ]
              },
              {
                "src": "images/skills/114/1141502/hit/5.png",
                "delay": 60,
                "origin": [
                  102,
                  24
                ]
              },
              {
                "src": "images/skills/114/1141502/hit/6.png",
                "delay": 60,
                "origin": [
                  102,
                  21
                ]
              },
              {
                "src": "images/skills/114/1141502/hit/7.png",
                "delay": 60,
                "origin": [
                  100,
                  18
                ]
              },
              {
                "src": "images/skills/114/1141502/hit/8.png",
                "delay": 60,
                "origin": [
                  99,
                  16
                ]
              }
            ]
          }
        }
      ]
    },
    "200": {
      "jobId": 200,
      "name": "法師",
      "rank": "10",
      "skillBook": 200,
      "skills": [
        {
          "id": "2000006",
          "name": "魔力增幅",
          "desc": "增加最大MP和攻擊速度，根據等級額外增加MP。",
          "h": "最大MP增加#mmpR%，攻擊速度1階段增加，每個等級MP增加#lv2mmp\\n裝備短杖時，爆擊機率額外增加5%",
          "rank": "10",
          "type": "passive",
          "equipable": false,
          "maxLevel": 20,
          "infoType": 5,
          "actions": [],
          "common": {
            "maxLevel": "20",
            "mmpR": "x",
            "lv2mmp": "20+5*x",
            "actionSpeed": "-1"
          },
          "icon": "images/skills/200/2000006.png",
          "skillBook": 200
        },
        {
          "id": "2000010",
          "name": "魔力之盾",
          "desc": "將魔力凝聚在盔甲上，使防禦力提升。",
          "h": "防禦力#pddX增加",
          "rank": "10",
          "type": "passive",
          "equipable": false,
          "maxLevel": 9,
          "infoType": 5,
          "actions": [],
          "common": {
            "maxLevel": "9",
            "pddX": "10*x"
          },
          "icon": "images/skills/200/2000010.png",
          "skillBook": 200
        },
        {
          "id": "2001008",
          "name": "魔靈彈",
          "desc": "對敵人發射觸碰就會爆炸的能量凝聚體。",
          "h": "消耗MP#mpCon，最多對#mobCount名的敵人以#damage%的傷害值進行攻擊#attackCount次",
          "rank": "10",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 2,
          "actions": [
            "energyBolt"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "16+2*d(x/5)",
            "lt": "-120, -75",
            "rb": "120, 75",
            "range": "340",
            "mobCount": "4",
            "damage": "18+3*x",
            "attackCount": "4",
            "u": "420",
            "x": "100",
            "w": "5"
          },
          "icon": "images/skills/200/2001008.png",
          "skillBook": 200,
          "ballCast": {
            "launchFrame": 8,
            "launchMs": 480,
            "ballMode": "sprite",
            "travel": "horizontal",
            "specialOnFirstHit": true,
            "aoeOnSpecial": true,
            "aoeRadius": 100,
            "chain": false,
            "chainRangePx": 0,
            "chainFirstRangePx": 0,
            "speedPxPerMs": 0.6
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/200/2001008/effect/0.png",
                "delay": 60,
                "origin": [
                  130,
                  127
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/1.png",
                "delay": 60,
                "origin": [
                  150,
                  123
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/2.png",
                "delay": 60,
                "origin": [
                  150,
                  116
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/3.png",
                "delay": 60,
                "origin": [
                  150,
                  109
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/4.png",
                "delay": 60,
                "origin": [
                  150,
                  109
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/5.png",
                "delay": 60,
                "origin": [
                  150,
                  109
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/6.png",
                "delay": 60,
                "origin": [
                  150,
                  109
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/7.png",
                "delay": 60,
                "origin": [
                  146,
                  104
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/8.png",
                "delay": 60,
                "origin": [
                  164,
                  128
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/9.png",
                "delay": 60,
                "origin": [
                  168,
                  131
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/10.png",
                "delay": 60,
                "origin": [
                  168,
                  132
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/11.png",
                "delay": 60,
                "origin": [
                  173,
                  132
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/12.png",
                "delay": 60,
                "origin": [
                  171,
                  133
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/13.png",
                "delay": 60,
                "origin": [
                  161,
                  110
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/14.png",
                "delay": 60,
                "origin": [
                  161,
                  110
                ]
              },
              {
                "src": "images/skills/200/2001008/effect/15.png",
                "delay": 60,
                "origin": [
                  160,
                  110
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/200/2001008/hit/0.png",
                "delay": 90,
                "origin": [
                  35,
                  39
                ]
              },
              {
                "src": "images/skills/200/2001008/hit/1.png",
                "delay": 90,
                "origin": [
                  41,
                  48
                ]
              },
              {
                "src": "images/skills/200/2001008/hit/2.png",
                "delay": 90,
                "origin": [
                  47,
                  49
                ]
              },
              {
                "src": "images/skills/200/2001008/hit/3.png",
                "delay": 90,
                "origin": [
                  46,
                  48
                ]
              },
              {
                "src": "images/skills/200/2001008/hit/4.png",
                "delay": 90,
                "origin": [
                  68,
                  74
                ]
              },
              {
                "src": "images/skills/200/2001008/hit/5.png",
                "delay": 90,
                "origin": [
                  51,
                  52
                ]
              },
              {
                "src": "images/skills/200/2001008/hit/6.png",
                "delay": 90,
                "origin": [
                  40,
                  47
                ]
              },
              {
                "src": "images/skills/200/2001008/hit/7.png",
                "delay": 90,
                "origin": [
                  40,
                  46
                ]
              }
            ],
            "ball": {
              "frames": [
                {
                  "src": "images/skills/200/2001008/ball/0.png",
                  "delay": 90,
                  "origin": [
                    81,
                    81
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/1.png",
                  "delay": 90,
                  "origin": [
                    78,
                    79
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/2.png",
                  "delay": 90,
                  "origin": [
                    74,
                    75
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/3.png",
                  "delay": 90,
                  "origin": [
                    70,
                    71
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/4.png",
                  "delay": 90,
                  "origin": [
                    65,
                    66
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/5.png",
                  "delay": 90,
                  "origin": [
                    62,
                    63
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/6.png",
                  "delay": 90,
                  "origin": [
                    65,
                    66
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/7.png",
                  "delay": 90,
                  "origin": [
                    70,
                    71
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/8.png",
                  "delay": 90,
                  "origin": [
                    74,
                    75
                  ]
                },
                {
                  "src": "images/skills/200/2001008/ball/9.png",
                  "delay": 90,
                  "origin": [
                    78,
                    79
                  ]
                }
              ]
            },
            "special": {
              "frames": [
                {
                  "src": "images/skills/200/2001008/special/0.png",
                  "delay": 90,
                  "origin": [
                    94,
                    90
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/1.png",
                  "delay": 90,
                  "origin": [
                    175,
                    170
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/2.png",
                  "delay": 90,
                  "origin": [
                    178,
                    179
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/3.png",
                  "delay": 90,
                  "origin": [
                    169,
                    170
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/4.png",
                  "delay": 90,
                  "origin": [
                    129,
                    130
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/5.png",
                  "delay": 90,
                  "origin": [
                    126,
                    120
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/6.png",
                  "delay": 90,
                  "origin": [
                    127,
                    120
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/7.png",
                  "delay": 90,
                  "origin": [
                    120,
                    120
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/8.png",
                  "delay": 90,
                  "origin": [
                    119,
                    93
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/9.png",
                  "delay": 90,
                  "origin": [
                    118,
                    93
                  ]
                },
                {
                  "src": "images/skills/200/2001008/special/10.png",
                  "delay": 90,
                  "origin": [
                    117,
                    92
                  ]
                }
              ],
              "repeat": 0,
              "relMove": [
                0,
                0
              ]
            }
          }
        },
        {
          "id": "2001009",
          "name": "瞬間移動",
          "desc": "瞬間移動一定距離。搭配上、下、左、右方向鍵一同使用時，可朝該方向移動。另外，永久增加移動速度、最大移動速度。",
          "h": "消耗#mpConMP，朝左右瞬移#x並朝上下瞬移#y\\n[被動效果：增加#psdSpeed移動速度、#speedMax最大移動速度]",
          "rank": "10",
          "type": "buff",
          "equipable": true,
          "maxLevel": 5,
          "infoType": 41,
          "actions": [],
          "common": {
            "maxLevel": "5",
            "mpCon": "30-2*x",
            "x": "115+15*x",
            "y": "270+5*x",
            "psdSpeed": "2+4*x",
            "speedMax": "4*x",
            "teleportCooltime": "480"
          },
          "icon": "images/skills/200/2001009.png",
          "skillBook": 200
        },
        {
          "id": "2001011",
          "name": "魔力波動",
          "desc": "朝地面噴射魔力能量波，以向上跳躍。同時按住「上」方向鍵和跳躍鍵時即可發動。使用後再次按「跳躍」鍵時，可暫時緩速下降。",
          "h": "消耗MP#mpCon，跳躍一定距離\\n使用技能後再次按「跳躍」鍵時，可消耗#uMP並最多緩速下降#x秒",
          "rank": "10",
          "type": "buff",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 41,
          "actions": [
            "manaWave"
          ],
          "common": {
            "maxLevel": "1",
            "mpCon": "10",
            "y": "1200",
            "x": "5",
            "u": "20"
          },
          "icon": "images/skills/200/2001011.png",
          "skillBook": 200,
          "fx": {
            "effect": [
              {
                "src": "images/skills/200/2001011/effect/0.png",
                "delay": 120,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/200/2001011/effect/1.png",
                "delay": 60,
                "origin": [
                  61,
                  41
                ]
              },
              {
                "src": "images/skills/200/2001011/effect/2.png",
                "delay": 60,
                "origin": [
                  66,
                  48
                ]
              },
              {
                "src": "images/skills/200/2001011/effect/3.png",
                "delay": 60,
                "origin": [
                  80,
                  50
                ]
              },
              {
                "src": "images/skills/200/2001011/effect/4.png",
                "delay": 60,
                "origin": [
                  71,
                  53
                ]
              },
              {
                "src": "images/skills/200/2001011/effect/5.png",
                "delay": 60,
                "origin": [
                  76,
                  54
                ]
              },
              {
                "src": "images/skills/200/2001011/effect/6.png",
                "delay": 60,
                "origin": [
                  78,
                  39
                ]
              },
              {
                "src": "images/skills/200/2001011/effect/7.png",
                "delay": 60,
                "origin": [
                  81,
                  32
                ]
              },
              {
                "src": "images/skills/200/2001011/effect/8.png",
                "delay": 60,
                "origin": [
                  83,
                  33
                ]
              }
            ]
          }
        }
      ]
    },
    "210": {
      "jobId": 210,
      "name": "火毒巫師",
      "rank": "30",
      "skillBook": 210,
      "skills": [
        {
          "id": "2100000",
          "name": "魔力吸收",
          "desc": "魔法攻擊時，以一定機率吸收對方的MP。對Boss怪物時吸收效率會變差，吸收的量更少。",
          "h": "魔法攻擊時，以#prop%機率吸收最大MP的#x%\\nBOSS怪物則是吸收最大MP的#y%",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 9,
          "infoType": 51,
          "actions": [],
          "common": {
            "maxLevel": "9",
            "prop": "3*x+3",
            "x": "d(x/2)+1",
            "y": "d(x/3)"
          },
          "icon": "images/skills/210/2100000.png",
          "skillBook": 210,
          "fx": {
            "effect": [
              {
                "src": "images/skills/210/2100000/effect/0.png",
                "delay": 90,
                "origin": [
                  30,
                  21
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/1.png",
                "delay": 90,
                "origin": [
                  30,
                  45
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/2.png",
                "delay": 90,
                "origin": [
                  30,
                  47
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/3.png",
                "delay": 90,
                "origin": [
                  -7,
                  47
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/4.png",
                "delay": 90,
                "origin": [
                  8,
                  47
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/5.png",
                "delay": 90,
                "origin": [
                  40,
                  46
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/6.png",
                "delay": 90,
                "origin": [
                  45,
                  46
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/7.png",
                "delay": 90,
                "origin": [
                  45,
                  43
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/8.png",
                "delay": 90,
                "origin": [
                  37,
                  36
                ]
              },
              {
                "src": "images/skills/210/2100000/effect/9.png",
                "delay": 90,
                "origin": [
                  4,
                  16
                ]
              }
            ]
          }
        },
        {
          "id": "2100006",
          "name": "咒語精通",
          "desc": "增加魔法熟練度、魔力、爆擊機率。",
          "h": "魔法熟練度增加#mastery%，魔力增加#x，爆擊機率增加#cr%",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "mastery": "10+4*x",
            "x": "x",
            "cr": "u(x/2)"
          },
          "icon": "images/skills/210/2100006.png",
          "skillBook": 210
        },
        {
          "id": "2100007",
          "name": "智慧昇華",
          "desc": "透過精神修養，永久增強智力",
          "h": "永久增強#intX智力",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 5,
          "infoType": 50,
          "actions": [],
          "common": {
            "intX": "8*x",
            "maxLevel": "5"
          },
          "icon": "images/skills/210/2100007.png",
          "skillBook": 210
        },
        {
          "id": "2100011",
          "name": "極速詠唱",
          "desc": "提升攻擊速度和智力。",
          "h": "攻擊速度增加2階段，智力增加#intX",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "intX": "2*x",
            "actionSpeed": "-2"
          },
          "icon": "images/skills/210/2100011.png",
          "skillBook": 210
        },
        {
          "id": "2101001",
          "name": "精神強化",
          "desc": "透過短暫的冥想，開啟內在的專注力，暫時增加所有隊員的魔力。",
          "h": "消耗MP #mpCon，連續#time秒內，隊員的魔力增加#indieMad",
          "rank": "30",
          "type": "buff",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [
            "alert2"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "10+d(x/3)",
            "time": "40+10*x",
            "indieMad": "10+x",
            "lt": "-300, -200",
            "rb": "300, 200"
          },
          "icon": "images/skills/210/2101001.png",
          "skillBook": 210,
          "fx": {
            "effect": [
              {
                "src": "images/skills/210/2101001/effect/0.png",
                "delay": 90,
                "origin": [
                  65,
                  81
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/1.png",
                "delay": 90,
                "origin": [
                  65,
                  81
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/2.png",
                "delay": 90,
                "origin": [
                  64,
                  51
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/3.png",
                "delay": 90,
                "origin": [
                  203,
                  276
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/4.png",
                "delay": 90,
                "origin": [
                  216,
                  246
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/5.png",
                "delay": 90,
                "origin": [
                  216,
                  254
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/6.png",
                "delay": 90,
                "origin": [
                  216,
                  254
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/7.png",
                "delay": 90,
                "origin": [
                  216,
                  254
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/8.png",
                "delay": 90,
                "origin": [
                  216,
                  254
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/9.png",
                "delay": 90,
                "origin": [
                  216,
                  254
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/10.png",
                "delay": 90,
                "origin": [
                  216,
                  254
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/11.png",
                "delay": 90,
                "origin": [
                  216,
                  246
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/12.png",
                "delay": 90,
                "origin": [
                  216,
                  236
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/13.png",
                "delay": 90,
                "origin": [
                  178,
                  224
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/14.png",
                "delay": 90,
                "origin": [
                  175,
                  215
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/15.png",
                "delay": 90,
                "origin": [
                  168,
                  217
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/16.png",
                "delay": 90,
                "origin": [
                  147,
                  218
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/17.png",
                "delay": 90,
                "origin": [
                  134,
                  219
                ]
              },
              {
                "src": "images/skills/210/2101001/effect/18.png",
                "delay": 90,
                "origin": [
                  120,
                  219
                ]
              }
            ]
          }
        },
        {
          "id": "2101004",
          "name": "魔火焰彈",
          "desc": "用魔法之力創造燃燒的魔法球，並對多數的敵人發射。火屬性的攻擊。",
          "h": "消耗MP#mpCon，最多可對#mobCount個敵人造成#damage%傷害的攻擊#attackCount次",
          "rank": "30",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 2,
          "actions": [
            "flameOrb"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "12+2*d(x/4)",
            "damage": "141+8*x",
            "mobCount": "6",
            "attackCount": "2",
            "lt": "-420, -160",
            "rb": "0, 20"
          },
          "icon": "images/skills/210/2101004.png",
          "skillBook": 210,
          "fx": {
            "effect": [
              {
                "src": "images/skills/210/2101004/effect/0.png",
                "delay": 90,
                "origin": [
                  172,
                  168
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/1.png",
                "delay": 90,
                "origin": [
                  191,
                  175
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/2.png",
                "delay": 90,
                "origin": [
                  196,
                  180
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/3.png",
                "delay": 90,
                "origin": [
                  506,
                  211
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/4.png",
                "delay": 90,
                "origin": [
                  511,
                  210
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/5.png",
                "delay": 90,
                "origin": [
                  517,
                  210
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/6.png",
                "delay": 90,
                "origin": [
                  527,
                  209
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/7.png",
                "delay": 90,
                "origin": [
                  537,
                  208
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/8.png",
                "delay": 90,
                "origin": [
                  548,
                  207
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/9.png",
                "delay": 90,
                "origin": [
                  557,
                  207
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/10.png",
                "delay": 90,
                "origin": [
                  565,
                  205
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/11.png",
                "delay": 90,
                "origin": [
                  573,
                  200
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/12.png",
                "delay": 90,
                "origin": [
                  580,
                  175
                ]
              },
              {
                "src": "images/skills/210/2101004/effect/13.png",
                "delay": 90,
                "origin": [
                  583,
                  174
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/210/2101004/hit/0.png",
                "delay": 60,
                "origin": [
                  69,
                  68
                ]
              },
              {
                "src": "images/skills/210/2101004/hit/1.png",
                "delay": 60,
                "origin": [
                  83,
                  82
                ]
              },
              {
                "src": "images/skills/210/2101004/hit/2.png",
                "delay": 60,
                "origin": [
                  86,
                  82
                ]
              },
              {
                "src": "images/skills/210/2101004/hit/3.png",
                "delay": 60,
                "origin": [
                  87,
                  82
                ]
              },
              {
                "src": "images/skills/210/2101004/hit/4.png",
                "delay": 60,
                "origin": [
                  87,
                  79
                ]
              },
              {
                "src": "images/skills/210/2101004/hit/5.png",
                "delay": 60,
                "origin": [
                  86,
                  77
                ]
              },
              {
                "src": "images/skills/210/2101004/hit/6.png",
                "delay": 60,
                "origin": [
                  84,
                  72
                ]
              },
              {
                "src": "images/skills/210/2101004/hit/7.png",
                "delay": 60,
                "origin": [
                  83,
                  61
                ]
              }
            ]
          }
        },
        {
          "id": "2101005",
          "name": "毒霧",
          "desc": "周圍的大氣變更為具備毒性，對敵人造成致命傷害。受攻擊的敵人暫時中毒，並且造成持續傷害。毒屬性攻擊。",
          "h": "消耗MP#mpCon、最多對#mobCount名的敵人以#damage%的傷害攻擊 #attackCount次\\n#dotTime秒內，每#dotInterval秒 #dot%的持續傷害",
          "rank": "30",
          "type": "active",
          "equipable": true,
          "maxLevel": 10,
          "infoType": 2,
          "actions": [
            "poisonBreath"
          ],
          "common": {
            "maxLevel": "10",
            "mpCon": "11+3*d(x/4)",
            "damage": "130+5*x",
            "mobCount": "6",
            "attackCount": "6",
            "dot": "30+3*x",
            "dotInterval": "1",
            "dotTime": "5+d(x/2)",
            "lt": "-200, -200",
            "rb": "200, 120"
          },
          "icon": "images/skills/210/2101005.png",
          "skillBook": 210,
          "fx": {
            "effect": [
              {
                "src": "images/skills/210/2101005/effect/0.png",
                "delay": 90,
                "origin": [
                  118,
                  192
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/1.png",
                "delay": 90,
                "origin": [
                  115,
                  167
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/2.png",
                "delay": 90,
                "origin": [
                  104,
                  159
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/3.png",
                "delay": 90,
                "origin": [
                  104,
                  152
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/4.png",
                "delay": 90,
                "origin": [
                  104,
                  143
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/5.png",
                "delay": 90,
                "origin": [
                  237,
                  243
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/6.png",
                "delay": 90,
                "origin": [
                  238,
                  282
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/7.png",
                "delay": 60,
                "origin": [
                  238,
                  286
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/8.png",
                "delay": 60,
                "origin": [
                  238,
                  287
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/9.png",
                "delay": 60,
                "origin": [
                  239,
                  289
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/10.png",
                "delay": 60,
                "origin": [
                  239,
                  290
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/11.png",
                "delay": 60,
                "origin": [
                  238,
                  244
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/12.png",
                "delay": 60,
                "origin": [
                  238,
                  241
                ]
              },
              {
                "src": "images/skills/210/2101005/effect/13.png",
                "delay": 60,
                "origin": [
                  222,
                  235
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/210/2101005/hit/0.png",
                "delay": 60,
                "origin": [
                  75,
                  92
                ]
              },
              {
                "src": "images/skills/210/2101005/hit/1.png",
                "delay": 60,
                "origin": [
                  108,
                  109
                ]
              },
              {
                "src": "images/skills/210/2101005/hit/2.png",
                "delay": 60,
                "origin": [
                  114,
                  117
                ]
              },
              {
                "src": "images/skills/210/2101005/hit/3.png",
                "delay": 60,
                "origin": [
                  118,
                  117
                ]
              },
              {
                "src": "images/skills/210/2101005/hit/4.png",
                "delay": 60,
                "origin": [
                  121,
                  112
                ]
              },
              {
                "src": "images/skills/210/2101005/hit/5.png",
                "delay": 60,
                "origin": [
                  120,
                  112
                ]
              },
              {
                "src": "images/skills/210/2101005/hit/6.png",
                "delay": 60,
                "origin": [
                  121,
                  90
                ]
              },
              {
                "src": "images/skills/210/2101005/hit/7.png",
                "delay": 60,
                "origin": [
                  94,
                  83
                ]
              }
            ]
          }
        },
        {
          "id": "2101010",
          "name": "燎原之火",
          "desc": "使用火靈結界以外的火焰魔法攻擊敵人時，有一定機率在#c命中位置上生成能燃燒敵人的火之壁。\\n燎原之火就算攻擊，反射攻擊狀態的敵人，也不會受到傷害。\\n使用技能時發動效果，並於再次使用時移除效果的#c開關技能#",
          "h": "施展火焰魔法時，有#prop%的機率#c生成火之壁#。火之壁可維持#x秒，並且每隔一段時間對最多#mobCount名敵人造成#damage%傷害#attackCount次",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 4,
          "areaAttack": true,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "damage": "30+x",
            "subTime": "1500",
            "prop": "10+4*x",
            "mobCount": "8",
            "lt": "-40, -20",
            "rb": "40, 20",
            "areaDotCount": "20",
            "attackCount": "3",
            "x": "4+d(x/4)"
          },
          "icon": "images/skills/210/2101010.png",
          "skillBook": 210
        }
      ]
    },
    "211": {
      "jobId": 211,
      "name": "火毒魔導士",
      "rank": "60",
      "skillBook": 211,
      "skills": [
        {
          "id": "2110001",
          "name": "魔力激發",
          "desc": "消耗更多的MP，但相對的除了火靈結界以外的攻擊魔法的傷害增加威力。",
          "h": "增加消耗MP #costmpR%，增加攻擊魔法的傷害#damR%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "costmpR": "5*x",
            "damR": "5*x"
          },
          "icon": "images/skills/211/2110001.png",
          "skillBook": 211
        },
        {
          "id": "2110009",
          "name": "魔法爆擊",
          "desc": "永久性的增加爆擊機率及爆擊傷害。",
          "h": "增加爆擊機率#cr%、爆擊傷害#criticaldamage%。",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "cr": "10+2*x",
            "criticaldamage": "3+x"
          },
          "icon": "images/skills/211/2110009.png",
          "skillBook": 211
        },
        {
          "id": "2110015",
          "name": "自然力重置",
          "desc": "減少所有自身使用的攻擊魔法屬性耐性。額外永久增加最終傷害。",
          "h": "攻擊耐性減少#u%，最終傷害增加#mdR%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 9,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "9",
            "x": "-x-1",
            "mdR": "4*x+4",
            "u": "x+1"
          },
          "icon": "images/skills/211/2110015.png",
          "skillBook": 211
        },
        {
          "id": "2111002",
          "name": "末日烈焰",
          "desc": "讓自身的周邊引起火焰爆發，並同時攻擊多數的敵人。火屬性的攻擊。",
          "h": "消耗MP#mpCon，最多可對#mobCount個敵人造成#damage%傷害的攻擊#attackCount次",
          "rank": "60",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "explosion"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "40+4*d(x/5)",
            "damage": "245+8*x",
            "attackCount": "2",
            "mobCount": "8",
            "lt": "-250, -160",
            "rb": "250, 140"
          },
          "icon": "images/skills/211/2111002.png",
          "skillBook": 211,
          "fx": {
            "effect": [
              {
                "src": "images/skills/211/2111002/effect/0.png",
                "delay": 90,
                "origin": [
                  162,
                  226
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/1.png",
                "delay": 90,
                "origin": [
                  192,
                  229
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/2.png",
                "delay": 90,
                "origin": [
                  198,
                  229
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/3.png",
                "delay": 90,
                "origin": [
                  200,
                  229
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/4.png",
                "delay": 90,
                "origin": [
                  233,
                  264
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/5.png",
                "delay": 90,
                "origin": [
                  349,
                  282
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/6.png",
                "delay": 90,
                "origin": [
                  357,
                  290
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/7.png",
                "delay": 60,
                "origin": [
                  363,
                  300
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/8.png",
                "delay": 60,
                "origin": [
                  371,
                  304
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/9.png",
                "delay": 60,
                "origin": [
                  381,
                  308
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/10.png",
                "delay": 60,
                "origin": [
                  385,
                  308
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/11.png",
                "delay": 60,
                "origin": [
                  389,
                  309
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/12.png",
                "delay": 60,
                "origin": [
                  389,
                  308
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/13.png",
                "delay": 60,
                "origin": [
                  390,
                  306
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/14.png",
                "delay": 60,
                "origin": [
                  389,
                  256
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/15.png",
                "delay": 60,
                "origin": [
                  387,
                  236
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/16.png",
                "delay": 60,
                "origin": [
                  283,
                  218
                ]
              },
              {
                "src": "images/skills/211/2111002/effect/17.png",
                "delay": 60,
                "origin": [
                  278,
                  198
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/211/2111002/hit/0.png",
                "delay": 60,
                "origin": [
                  123,
                  113
                ]
              },
              {
                "src": "images/skills/211/2111002/hit/1.png",
                "delay": 60,
                "origin": [
                  137,
                  127
                ]
              },
              {
                "src": "images/skills/211/2111002/hit/2.png",
                "delay": 60,
                "origin": [
                  150,
                  140
                ]
              },
              {
                "src": "images/skills/211/2111002/hit/3.png",
                "delay": 60,
                "origin": [
                  154,
                  144
                ]
              },
              {
                "src": "images/skills/211/2111002/hit/4.png",
                "delay": 60,
                "origin": [
                  158,
                  148
                ]
              },
              {
                "src": "images/skills/211/2111002/hit/5.png",
                "delay": 60,
                "origin": [
                  158,
                  148
                ]
              }
            ]
          }
        },
        {
          "id": "2111003",
          "name": "致命毒霧",
          "desc": "一定期間內，自己周圍形成致命毒霧，讓所有敵人中毒，使用毒屬性攻擊。",
          "h": "消耗MP#mpCon，#time秒內產生造成#damage%傷害的毒霧。\\n中毒時，#dotTime秒內造成每#dotInterval秒，#dot%的持續傷害。",
          "rank": "60",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 4,
          "areaAttack": true,
          "actions": [
            "poisonMist"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "30+5*d(x/4)",
            "time": "5+d(x/2)",
            "damage": "190+4*x",
            "dot": "120+6*x",
            "dotInterval": "1",
            "dotTime": "4+d(x/10)",
            "lt": "-250, -200",
            "rb": "250, 200",
            "u": "600",
            "s": "50",
            "s2": "80",
            "v": "60",
            "v2": "90"
          },
          "icon": "images/skills/211/2111003.png",
          "skillBook": 211,
          "fx": {
            "effect": [
              {
                "src": "images/skills/211/2111003/effect/0.png",
                "delay": 60,
                "origin": [
                  111,
                  362
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/1.png",
                "delay": 60,
                "origin": [
                  113,
                  366
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/2.png",
                "delay": 60,
                "origin": [
                  115,
                  366
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/3.png",
                "delay": 60,
                "origin": [
                  115,
                  366
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/4.png",
                "delay": 60,
                "origin": [
                  115,
                  366
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/5.png",
                "delay": 60,
                "origin": [
                  115,
                  366
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/6.png",
                "delay": 60,
                "origin": [
                  115,
                  366
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/7.png",
                "delay": 60,
                "origin": [
                  115,
                  366
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/8.png",
                "delay": 90,
                "origin": [
                  115,
                  319
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/9.png",
                "delay": 90,
                "origin": [
                  232,
                  408
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/10.png",
                "delay": 90,
                "origin": [
                  237,
                  405
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/11.png",
                "delay": 90,
                "origin": [
                  241,
                  412
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/12.png",
                "delay": 90,
                "origin": [
                  237,
                  418
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/13.png",
                "delay": 90,
                "origin": [
                  242,
                  414
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/14.png",
                "delay": 90,
                "origin": [
                  243,
                  401
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/15.png",
                "delay": 90,
                "origin": [
                  249,
                  394
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/16.png",
                "delay": 90,
                "origin": [
                  238,
                  388
                ]
              },
              {
                "src": "images/skills/211/2111003/effect/17.png",
                "delay": 90,
                "origin": [
                  171,
                  343
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/211/2111003/hit/0.png",
                "delay": 60,
                "origin": [
                  81,
                  78
                ]
              },
              {
                "src": "images/skills/211/2111003/hit/1.png",
                "delay": 60,
                "origin": [
                  108,
                  102
                ]
              },
              {
                "src": "images/skills/211/2111003/hit/2.png",
                "delay": 60,
                "origin": [
                  106,
                  97
                ]
              },
              {
                "src": "images/skills/211/2111003/hit/3.png",
                "delay": 60,
                "origin": [
                  102,
                  94
                ]
              },
              {
                "src": "images/skills/211/2111003/hit/4.png",
                "delay": 60,
                "origin": [
                  97,
                  90
                ]
              },
              {
                "src": "images/skills/211/2111003/hit/5.png",
                "delay": 60,
                "origin": [
                  92,
                  89
                ]
              },
              {
                "src": "images/skills/211/2111003/hit/6.png",
                "delay": 60,
                "origin": [
                  82,
                  90
                ]
              },
              {
                "src": "images/skills/211/2111003/hit/7.png",
                "delay": 60,
                "origin": [
                  80,
                  89
                ]
              },
              {
                "src": "images/skills/211/2111003/hit/8.png",
                "delay": 60,
                "origin": [
                  85,
                  88
                ]
              }
            ],
            "tiles": [
              {
                "id": 0,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/0/0.png",
                    "delay": 120,
                    "origin": [
                      53,
                      65
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/0/1.png",
                    "delay": 120,
                    "origin": [
                      55,
                      64
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/0/2.png",
                    "delay": 120,
                    "origin": [
                      58,
                      65
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/0/3.png",
                    "delay": 120,
                    "origin": [
                      59,
                      66
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/0/4.png",
                    "delay": 120,
                    "origin": [
                      62,
                      69
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/0/5.png",
                    "delay": 120,
                    "origin": [
                      63,
                      69
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/0/6.png",
                    "delay": 120,
                    "origin": [
                      65,
                      68
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/0/7.png",
                    "delay": 120,
                    "origin": [
                      65,
                      65
                    ]
                  }
                ]
              },
              {
                "id": 1,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/1/0.png",
                    "delay": 120,
                    "origin": [
                      64,
                      50
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/1/1.png",
                    "delay": 120,
                    "origin": [
                      65,
                      60
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/1/2.png",
                    "delay": 120,
                    "origin": [
                      57,
                      64
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/1/3.png",
                    "delay": 120,
                    "origin": [
                      58,
                      66
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/1/4.png",
                    "delay": 120,
                    "origin": [
                      59,
                      64
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/1/5.png",
                    "delay": 120,
                    "origin": [
                      60,
                      57
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/1/6.png",
                    "delay": 120,
                    "origin": [
                      62,
                      58
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/1/7.png",
                    "delay": 120,
                    "origin": [
                      63,
                      57
                    ]
                  }
                ]
              },
              {
                "id": 2,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/2/0.png",
                    "delay": 120,
                    "origin": [
                      83,
                      76
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/2/1.png",
                    "delay": 120,
                    "origin": [
                      85,
                      68
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/2/2.png",
                    "delay": 120,
                    "origin": [
                      91,
                      77
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/2/3.png",
                    "delay": 120,
                    "origin": [
                      93,
                      81
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/2/4.png",
                    "delay": 120,
                    "origin": [
                      93,
                      83
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/2/5.png",
                    "delay": 120,
                    "origin": [
                      93,
                      81
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/2/6.png",
                    "delay": 120,
                    "origin": [
                      93,
                      76
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/2/7.png",
                    "delay": 120,
                    "origin": [
                      93,
                      77
                    ]
                  }
                ]
              },
              {
                "id": 3,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/3/0.png",
                    "delay": 120,
                    "origin": [
                      91,
                      77
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/3/1.png",
                    "delay": 120,
                    "origin": [
                      82,
                      77
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/3/2.png",
                    "delay": 120,
                    "origin": [
                      82,
                      68
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/3/3.png",
                    "delay": 120,
                    "origin": [
                      88,
                      68
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/3/4.png",
                    "delay": 120,
                    "origin": [
                      91,
                      70
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/3/5.png",
                    "delay": 120,
                    "origin": [
                      91,
                      72
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/3/6.png",
                    "delay": 120,
                    "origin": [
                      91,
                      74
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/3/7.png",
                    "delay": 120,
                    "origin": [
                      91,
                      76
                    ]
                  }
                ]
              },
              {
                "id": 4,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/4/0.png",
                    "delay": 120,
                    "origin": [
                      113,
                      82
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/4/1.png",
                    "delay": 120,
                    "origin": [
                      115,
                      83
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/4/2.png",
                    "delay": 120,
                    "origin": [
                      115,
                      84
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/4/3.png",
                    "delay": 120,
                    "origin": [
                      99,
                      84
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/4/4.png",
                    "delay": 120,
                    "origin": [
                      98,
                      83
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/4/5.png",
                    "delay": 120,
                    "origin": [
                      102,
                      75
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/4/6.png",
                    "delay": 120,
                    "origin": [
                      107,
                      79
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/4/7.png",
                    "delay": 120,
                    "origin": [
                      109,
                      79
                    ]
                  }
                ]
              },
              {
                "id": 5,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/5/0.png",
                    "delay": 120,
                    "origin": [
                      110,
                      86
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/5/1.png",
                    "delay": 120,
                    "origin": [
                      98,
                      85
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/5/2.png",
                    "delay": 120,
                    "origin": [
                      100,
                      85
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/5/3.png",
                    "delay": 120,
                    "origin": [
                      99,
                      79
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/5/4.png",
                    "delay": 120,
                    "origin": [
                      90,
                      81
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/5/5.png",
                    "delay": 120,
                    "origin": [
                      106,
                      83
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/5/6.png",
                    "delay": 120,
                    "origin": [
                      110,
                      85
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/5/7.png",
                    "delay": 120,
                    "origin": [
                      113,
                      86
                    ]
                  }
                ]
              },
              {
                "id": 6,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/6/0.png",
                    "delay": 120,
                    "origin": [
                      117,
                      114
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/6/1.png",
                    "delay": 120,
                    "origin": [
                      117,
                      112
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/6/2.png",
                    "delay": 120,
                    "origin": [
                      118,
                      98
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/6/3.png",
                    "delay": 120,
                    "origin": [
                      120,
                      101
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/6/4.png",
                    "delay": 120,
                    "origin": [
                      123,
                      100
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/6/5.png",
                    "delay": 120,
                    "origin": [
                      125,
                      88
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/6/6.png",
                    "delay": 120,
                    "origin": [
                      126,
                      106
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/6/7.png",
                    "delay": 120,
                    "origin": [
                      116,
                      111
                    ]
                  }
                ]
              },
              {
                "id": 7,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/7/0.png",
                    "delay": 120,
                    "origin": [
                      99,
                      115
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/7/1.png",
                    "delay": 120,
                    "origin": [
                      103,
                      114
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/7/2.png",
                    "delay": 120,
                    "origin": [
                      107,
                      116
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/7/3.png",
                    "delay": 120,
                    "origin": [
                      111,
                      120
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/7/4.png",
                    "delay": 120,
                    "origin": [
                      114,
                      120
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/7/5.png",
                    "delay": 120,
                    "origin": [
                      117,
                      119
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/7/6.png",
                    "delay": 120,
                    "origin": [
                      119,
                      116
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/7/7.png",
                    "delay": 120,
                    "origin": [
                      94,
                      116
                    ]
                  }
                ]
              },
              {
                "id": 8,
                "frames": [
                  {
                    "src": "images/skills/211/2111003/tile/8/0.png",
                    "delay": 120,
                    "origin": [
                      117,
                      121
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/8/1.png",
                    "delay": 120,
                    "origin": [
                      121,
                      123
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/8/2.png",
                    "delay": 120,
                    "origin": [
                      124,
                      123
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/8/3.png",
                    "delay": 120,
                    "origin": [
                      126,
                      123
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/8/4.png",
                    "delay": 120,
                    "origin": [
                      130,
                      123
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/8/5.png",
                    "delay": 120,
                    "origin": [
                      132,
                      123
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/8/6.png",
                    "delay": 120,
                    "origin": [
                      132,
                      112
                    ]
                  },
                  {
                    "src": "images/skills/211/2111003/tile/8/7.png",
                    "delay": 120,
                    "origin": [
                      117,
                      115
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "2111007",
          "name": "瞬間移動精通",
          "desc": "啟用技能後，會額外消耗 MP，對瞬間移動位置的敵人造成傷害，並且能套用暈眩、持續傷害效果。額外永久增加格擋。\\n使用技能時效果會啟用，再次使用時會關閉的#c開關技能#",
          "h": "額外消耗MP#y，最多對 #mobCount名敵人以#damage% 傷害，以#subProp%機率於 #time秒內暈眩，#dotTime秒內每#dotInterval秒#dot%傷害\\n[被動效果:格擋增加#stanceProp%]",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 16,
          "actions": [
            "alert2"
          ],
          "common": {
            "maxLevel": "10",
            "prop": "100",
            "subProp": "30+5*x",
            "y": "2*x",
            "damage": "192+8*x",
            "time": "2+d(x/5)",
            "mobCount": "6",
            "lt": "-120, -100",
            "rb": "120, 10",
            "hcSubProp": "u(x/2)",
            "hcTime": "1",
            "dot": "68+3*x",
            "dotInterval": "2",
            "dotTime": "20",
            "stanceProp": "4*x"
          },
          "icon": "images/skills/211/2111007.png",
          "skillBook": 211,
          "fx": {
            "effect": [
              {
                "src": "images/skills/211/2111007/effect/0.png",
                "delay": 90,
                "origin": [
                  61,
                  67
                ]
              },
              {
                "src": "images/skills/211/2111007/effect/1.png",
                "delay": 90,
                "origin": [
                  74,
                  85
                ]
              },
              {
                "src": "images/skills/211/2111007/effect/2.png",
                "delay": 90,
                "origin": [
                  76,
                  86
                ]
              },
              {
                "src": "images/skills/211/2111007/effect/3.png",
                "delay": 90,
                "origin": [
                  77,
                  87
                ]
              },
              {
                "src": "images/skills/211/2111007/effect/4.png",
                "delay": 90,
                "origin": [
                  78,
                  87
                ]
              },
              {
                "src": "images/skills/211/2111007/effect/5.png",
                "delay": 90,
                "origin": [
                  78,
                  88
                ]
              },
              {
                "src": "images/skills/211/2111007/effect/6.png",
                "delay": 90,
                "origin": [
                  79,
                  88
                ]
              },
              {
                "src": "images/skills/211/2111007/effect/7.png",
                "delay": 90,
                "origin": [
                  80,
                  88
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/211/2111007/effect0/0.png",
                "delay": 90,
                "origin": [
                  102,
                  252
                ]
              },
              {
                "src": "images/skills/211/2111007/effect0/1.png",
                "delay": 90,
                "origin": [
                  111,
                  252
                ]
              },
              {
                "src": "images/skills/211/2111007/effect0/2.png",
                "delay": 90,
                "origin": [
                  112,
                  252
                ]
              },
              {
                "src": "images/skills/211/2111007/effect0/3.png",
                "delay": 90,
                "origin": [
                  108,
                  252
                ]
              },
              {
                "src": "images/skills/211/2111007/effect0/4.png",
                "delay": 90,
                "origin": [
                  107,
                  196
                ]
              },
              {
                "src": "images/skills/211/2111007/effect0/5.png",
                "delay": 90,
                "origin": [
                  100,
                  182
                ]
              },
              {
                "src": "images/skills/211/2111007/effect0/6.png",
                "delay": 90,
                "origin": [
                  95,
                  176
                ]
              },
              {
                "src": "images/skills/211/2111007/effect0/7.png",
                "delay": 90,
                "origin": [
                  83,
                  156
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/211/2111007/hit/0.png",
                "delay": 90,
                "origin": [
                  53,
                  50
                ]
              },
              {
                "src": "images/skills/211/2111007/hit/1.png",
                "delay": 90,
                "origin": [
                  64,
                  59
                ]
              },
              {
                "src": "images/skills/211/2111007/hit/2.png",
                "delay": 90,
                "origin": [
                  72,
                  59
                ]
              },
              {
                "src": "images/skills/211/2111007/hit/3.png",
                "delay": 90,
                "origin": [
                  72,
                  59
                ]
              },
              {
                "src": "images/skills/211/2111007/hit/4.png",
                "delay": 90,
                "origin": [
                  70,
                  57
                ]
              },
              {
                "src": "images/skills/211/2111007/hit/5.png",
                "delay": 90,
                "origin": [
                  67,
                  54
                ]
              }
            ]
          }
        },
        {
          "id": "2111011",
          "name": "元素適應(火、毒)",
          "desc": "利用火與毒的屏障覆蓋自己，防禦致命的狀態異常。防禦後再次形成，成功防禦一定次數以上時，套用冷卻時間。額外永久提升狀態異常耐性與所有屬性耐性。",
          "h": "消耗MP#mpCon啟用元素改造\\n消耗最大MP的#x%，以#prop%機率防禦致命的狀態異常，護盾最多再次形成#y次\\n冷卻時間 #cooltime秒\\n[被動效果:狀態異常與所有屬性耐性增加#asrR%]",
          "rank": "60",
          "type": "buff",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [
            "elementalAdaptingFP"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "20+5*u(x/7)",
            "cooltime": "600-18*x",
            "prop": "100",
            "x": "12-d(x/2)",
            "y": "10",
            "asrR": "x",
            "terR": "x"
          },
          "icon": "images/skills/211/2111011.png",
          "skillBook": 211,
          "areaCast": {
            "hitFrame": 8,
            "hitMs": 720,
            "layers": [
              "effect",
              "effect0",
              "special",
              "special0"
            ]
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/211/2111011/effect/0.png",
                "delay": 90,
                "origin": [
                  63,
                  29
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/1.png",
                "delay": 90,
                "origin": [
                  63,
                  131
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/2.png",
                "delay": 90,
                "origin": [
                  64,
                  233
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/3.png",
                "delay": 90,
                "origin": [
                  64,
                  270
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/4.png",
                "delay": 90,
                "origin": [
                  64,
                  273
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/5.png",
                "delay": 90,
                "origin": [
                  97,
                  277
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/6.png",
                "delay": 90,
                "origin": [
                  107,
                  277
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/7.png",
                "delay": 90,
                "origin": [
                  198,
                  349
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/8.png",
                "delay": 90,
                "origin": [
                  177,
                  351
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/9.png",
                "delay": 90,
                "origin": [
                  186,
                  318
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/10.png",
                "delay": 90,
                "origin": [
                  195,
                  352
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/11.png",
                "delay": 90,
                "origin": [
                  202,
                  356
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/12.png",
                "delay": 90,
                "origin": [
                  208,
                  361
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/13.png",
                "delay": 90,
                "origin": [
                  213,
                  372
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/14.png",
                "delay": 90,
                "origin": [
                  217,
                  362
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/15.png",
                "delay": 90,
                "origin": [
                  220,
                  365
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/16.png",
                "delay": 90,
                "origin": [
                  223,
                  351
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/17.png",
                "delay": 90,
                "origin": [
                  225,
                  332
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/18.png",
                "delay": 90,
                "origin": [
                  227,
                  365
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/19.png",
                "delay": 90,
                "origin": [
                  228,
                  360
                ]
              },
              {
                "src": "images/skills/211/2111011/effect/20.png",
                "delay": 90,
                "origin": [
                  121,
                  234
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/211/2111011/effect0/0.png",
                "delay": 90,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/1.png",
                "delay": 90,
                "origin": [
                  107,
                  25
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/2.png",
                "delay": 90,
                "origin": [
                  111,
                  27
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/3.png",
                "delay": 90,
                "origin": [
                  113,
                  260
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/4.png",
                "delay": 90,
                "origin": [
                  114,
                  265
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/5.png",
                "delay": 90,
                "origin": [
                  115,
                  269
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/6.png",
                "delay": 90,
                "origin": [
                  122,
                  271
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/7.png",
                "delay": 90,
                "origin": [
                  166,
                  299
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/8.png",
                "delay": 90,
                "origin": [
                  174,
                  347
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/9.png",
                "delay": 90,
                "origin": [
                  176,
                  347
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/10.png",
                "delay": 90,
                "origin": [
                  178,
                  329
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/11.png",
                "delay": 90,
                "origin": [
                  179,
                  317
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/12.png",
                "delay": 90,
                "origin": [
                  170,
                  312
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/13.png",
                "delay": 90,
                "origin": [
                  163,
                  309
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/14.png",
                "delay": 90,
                "origin": [
                  163,
                  309
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/15.png",
                "delay": 90,
                "origin": [
                  163,
                  309
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/16.png",
                "delay": 90,
                "origin": [
                  167,
                  309
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/17.png",
                "delay": 90,
                "origin": [
                  161,
                  305
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/18.png",
                "delay": 90,
                "origin": [
                  176,
                  303
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/19.png",
                "delay": 90,
                "origin": [
                  118,
                  182
                ]
              },
              {
                "src": "images/skills/211/2111011/effect0/20.png",
                "delay": 90,
                "origin": [
                  111,
                  181
                ]
              }
            ],
            "special": {
              "frames": [
                {
                  "src": "images/skills/211/2111011/special/0.png",
                  "delay": 90,
                  "origin": [
                    97,
                    275
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/1.png",
                  "delay": 90,
                  "origin": [
                    182,
                    278
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/2.png",
                  "delay": 90,
                  "origin": [
                    156,
                    278
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/3.png",
                  "delay": 90,
                  "origin": [
                    150,
                    277
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/4.png",
                  "delay": 90,
                  "origin": [
                    144,
                    273
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/5.png",
                  "delay": 90,
                  "origin": [
                    140,
                    271
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/6.png",
                  "delay": 90,
                  "origin": [
                    134,
                    269
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/7.png",
                  "delay": 90,
                  "origin": [
                    132,
                    259
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/8.png",
                  "delay": 90,
                  "origin": [
                    129,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/9.png",
                  "delay": 90,
                  "origin": [
                    125,
                    259
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/10.png",
                  "delay": 90,
                  "origin": [
                    122,
                    246
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/11.png",
                  "delay": 90,
                  "origin": [
                    119,
                    235
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/12.png",
                  "delay": 90,
                  "origin": [
                    120,
                    236
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/13.png",
                  "delay": 90,
                  "origin": [
                    120,
                    237
                  ]
                },
                {
                  "src": "images/skills/211/2111011/special/14.png",
                  "delay": 90,
                  "origin": [
                    121,
                    234
                  ]
                }
              ],
              "repeat": 0,
              "relMove": [
                0,
                0
              ]
            },
            "special0": [
              {
                "src": "images/skills/211/2111011/special0/0.png",
                "delay": 90,
                "origin": [
                  103,
                  270
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/1.png",
                "delay": 90,
                "origin": [
                  138,
                  271
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/2.png",
                "delay": 90,
                "origin": [
                  140,
                  271
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/3.png",
                "delay": 90,
                "origin": [
                  140,
                  270
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/4.png",
                "delay": 90,
                "origin": [
                  139,
                  270
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/5.png",
                "delay": 90,
                "origin": [
                  140,
                  270
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/6.png",
                "delay": 90,
                "origin": [
                  142,
                  272
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/7.png",
                "delay": 90,
                "origin": [
                  138,
                  270
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/8.png",
                "delay": 90,
                "origin": [
                  138,
                  270
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/9.png",
                "delay": 90,
                "origin": [
                  138,
                  266
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/10.png",
                "delay": 90,
                "origin": [
                  141,
                  264
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/11.png",
                "delay": 90,
                "origin": [
                  136,
                  260
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/12.png",
                "delay": 90,
                "origin": [
                  149,
                  256
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/13.png",
                "delay": 90,
                "origin": [
                  64,
                  249
                ]
              },
              {
                "src": "images/skills/211/2111011/special0/14.png",
                "delay": 90,
                "origin": [
                  63,
                  238
                ]
              }
            ]
          }
        },
        {
          "id": "2111013",
          "name": "劇毒領域",
          "desc": "在周圍設置將生成劇毒地帶的劇毒魔法陣。魔法陣將持續生成劇毒，並使劇毒地帶緩慢朝左右擴張。劇毒地帶觸碰至踏板邊緣後便不會再繼續擴張。\\n劇毒地帶內的毒素為易燃物，因此經過一段時間後，每當有人在劇毒地帶內使用火焰魔法或被火焰魔法擊中時，將引爆地帶內的毒素。該爆炸亦可引爆周圍的劇毒地帶。毒屬性攻擊。",
          "h": "消耗MP#mpCon，畫下可維持#time秒的毒魔法陣\\n魔法陣每隔一段時間將使周圍變為劇毒地帶，位於劇毒地帶內的敵人每#dotInterval秒將遭受#dot%持續傷害，效果持續#dotTime秒\\n#c劇毒地帶爆炸#：消耗#attackDelayMP，因劇毒地帶爆炸而引發的爆炸不消耗MP。地帶生成1.5秒後可引爆，並對最多#mobCount名敵人造成#damage%傷害#attackCount次。亦可藉由爆炸引發劇毒地帶爆炸\\n當單一敵人#t秒內被爆炸連續命中時，從第二次爆炸開始，爆炸的最終傷害減少#u2%\\n攻擊一般怪物時，傷害增加",
          "rank": "60",
          "type": "buff",
          "equipable": true,
          "maxLevel": 14,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "poisonRegion"
          ],
          "common": {
            "maxLevel": "14",
            "mpCon": "40+x",
            "time": "60",
            "subTime": "900",
            "u": "200",
            "y": "120",
            "z": "180",
            "w": "10",
            "v": "240",
            "lt": "-100, -85",
            "rb": "100, 60",
            "s": "30",
            "w2": "1500",
            "dot": "120+6*x",
            "dotInterval": "1",
            "dotTime": "3+d(x/2)",
            "x": "120",
            "damage": "158+3*x",
            "attackCount": "4",
            "mobCount": "10",
            "t": "0.4",
            "u2": "60",
            "attackDelay": "46+x",
            "nbdR": "50"
          },
          "icon": "images/skills/211/2111013.png",
          "skillBook": 211,
          "fx": {
            "effect": [
              {
                "src": "images/skills/211/2111013/effect/0.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/1.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/2.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/3.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/4.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/5.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/6.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/7.png",
                "delay": 60,
                "origin": [
                  81,
                  138
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/8.png",
                "delay": 90,
                "origin": [
                  115,
                  159
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/9.png",
                "delay": 90,
                "origin": [
                  126,
                  172
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/10.png",
                "delay": 90,
                "origin": [
                  132,
                  178
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/11.png",
                "delay": 90,
                "origin": [
                  135,
                  178
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/12.png",
                "delay": 90,
                "origin": [
                  137,
                  171
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/13.png",
                "delay": 90,
                "origin": [
                  107,
                  165
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/14.png",
                "delay": 90,
                "origin": [
                  75,
                  166
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/15.png",
                "delay": 90,
                "origin": [
                  76,
                  168
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/16.png",
                "delay": 90,
                "origin": [
                  78,
                  168
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/17.png",
                "delay": 90,
                "origin": [
                  77,
                  168
                ]
              },
              {
                "src": "images/skills/211/2111013/effect/18.png",
                "delay": 90,
                "origin": [
                  77,
                  168
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/211/2111013/effect0/0.png",
                "delay": 60,
                "origin": [
                  76,
                  33
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/1.png",
                "delay": 60,
                "origin": [
                  79,
                  33
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/2.png",
                "delay": 60,
                "origin": [
                  80,
                  32
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/3.png",
                "delay": 60,
                "origin": [
                  81,
                  32
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/4.png",
                "delay": 60,
                "origin": [
                  81,
                  31
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/5.png",
                "delay": 60,
                "origin": [
                  81,
                  30
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/6.png",
                "delay": 60,
                "origin": [
                  155,
                  30
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/7.png",
                "delay": 60,
                "origin": [
                  155,
                  35
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/8.png",
                "delay": 90,
                "origin": [
                  144,
                  38
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/9.png",
                "delay": 90,
                "origin": [
                  143,
                  38
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/10.png",
                "delay": 90,
                "origin": [
                  139,
                  38
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/11.png",
                "delay": 90,
                "origin": [
                  126,
                  39
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/12.png",
                "delay": 90,
                "origin": [
                  124,
                  38
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/13.png",
                "delay": 90,
                "origin": [
                  122,
                  38
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/14.png",
                "delay": 90,
                "origin": [
                  120,
                  37
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/15.png",
                "delay": 90,
                "origin": [
                  115,
                  36
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/16.png",
                "delay": 90,
                "origin": [
                  85,
                  34
                ]
              },
              {
                "src": "images/skills/211/2111013/effect0/17.png",
                "delay": 90,
                "origin": [
                  -16,
                  25
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/211/2111013/hit/0.png",
                "delay": 60,
                "origin": [
                  39,
                  39
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/1.png",
                "delay": 60,
                "origin": [
                  59,
                  67
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/2.png",
                "delay": 60,
                "origin": [
                  66,
                  73
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/3.png",
                "delay": 60,
                "origin": [
                  66,
                  74
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/4.png",
                "delay": 60,
                "origin": [
                  66,
                  74
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/5.png",
                "delay": 60,
                "origin": [
                  66,
                  72
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/6.png",
                "delay": 60,
                "origin": [
                  50,
                  52
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/7.png",
                "delay": 60,
                "origin": [
                  43,
                  51
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/8.png",
                "delay": 60,
                "origin": [
                  39,
                  53
                ]
              },
              {
                "src": "images/skills/211/2111013/hit/9.png",
                "delay": 60,
                "origin": [
                  29,
                  54
                ]
              }
            ],
            "summonVisual": {
              "summoned": [
                {
                  "src": "images/skills/211/2111013/summon/summoned/0.png",
                  "delay": 60,
                  "origin": [
                    112,
                    64
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/1.png",
                  "delay": 60,
                  "origin": [
                    113,
                    128
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/2.png",
                  "delay": 60,
                  "origin": [
                    113,
                    110
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/3.png",
                  "delay": 60,
                  "origin": [
                    113,
                    102
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/4.png",
                  "delay": 60,
                  "origin": [
                    139,
                    230
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/5.png",
                  "delay": 60,
                  "origin": [
                    143,
                    236
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/6.png",
                  "delay": 60,
                  "origin": [
                    145,
                    238
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/7.png",
                  "delay": 60,
                  "origin": [
                    156,
                    233
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/8.png",
                  "delay": 90,
                  "origin": [
                    167,
                    244
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/9.png",
                  "delay": 90,
                  "origin": [
                    177,
                    252
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/10.png",
                  "delay": 90,
                  "origin": [
                    180,
                    255
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/11.png",
                  "delay": 90,
                  "origin": [
                    183,
                    258
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/12.png",
                  "delay": 90,
                  "origin": [
                    185,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/13.png",
                  "delay": 90,
                  "origin": [
                    186,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/14.png",
                  "delay": 90,
                  "origin": [
                    186,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/15.png",
                  "delay": 90,
                  "origin": [
                    186,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/16.png",
                  "delay": 90,
                  "origin": [
                    186,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/17.png",
                  "delay": 90,
                  "origin": [
                    186,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/18.png",
                  "delay": 90,
                  "origin": [
                    186,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/19.png",
                  "delay": 90,
                  "origin": [
                    186,
                    259
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/20.png",
                  "delay": 90,
                  "origin": [
                    140,
                    232
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/21.png",
                  "delay": 90,
                  "origin": [
                    143,
                    236
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/22.png",
                  "delay": 90,
                  "origin": [
                    145,
                    238
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/summoned/23.png",
                  "delay": 90,
                  "origin": [
                    149,
                    232
                  ]
                }
              ],
              "stand": [
                {
                  "src": "images/skills/211/2111013/summon/stand/0.png",
                  "delay": 90,
                  "origin": [
                    152,
                    232
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/stand/1.png",
                  "delay": 90,
                  "origin": [
                    158,
                    234
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/stand/2.png",
                  "delay": 90,
                  "origin": [
                    157,
                    221
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/stand/3.png",
                  "delay": 90,
                  "origin": [
                    157,
                    222
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/stand/4.png",
                  "delay": 90,
                  "origin": [
                    140,
                    232
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/stand/5.png",
                  "delay": 90,
                  "origin": [
                    143,
                    236
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/stand/6.png",
                  "delay": 90,
                  "origin": [
                    145,
                    238
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/stand/7.png",
                  "delay": 90,
                  "origin": [
                    149,
                    232
                  ]
                }
              ],
              "die": [
                {
                  "src": "images/skills/211/2111013/summon/die/0.png",
                  "delay": 60,
                  "origin": [
                    152,
                    241
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/1.png",
                  "delay": 60,
                  "origin": [
                    158,
                    244
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/2.png",
                  "delay": 60,
                  "origin": [
                    157,
                    245
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/3.png",
                  "delay": 60,
                  "origin": [
                    157,
                    255
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/4.png",
                  "delay": 60,
                  "origin": [
                    178,
                    261
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/5.png",
                  "delay": 60,
                  "origin": [
                    191,
                    262
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/6.png",
                  "delay": 60,
                  "origin": [
                    200,
                    265
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/7.png",
                  "delay": 60,
                  "origin": [
                    203,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/8.png",
                  "delay": 60,
                  "origin": [
                    207,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/9.png",
                  "delay": 60,
                  "origin": [
                    209,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/10.png",
                  "delay": 60,
                  "origin": [
                    212,
                    263
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/11.png",
                  "delay": 60,
                  "origin": [
                    213,
                    265
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/12.png",
                  "delay": 60,
                  "origin": [
                    214,
                    266
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/13.png",
                  "delay": 60,
                  "origin": [
                    215,
                    269
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/14.png",
                  "delay": 60,
                  "origin": [
                    210,
                    260
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/15.png",
                  "delay": 60,
                  "origin": [
                    204,
                    255
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/16.png",
                  "delay": 60,
                  "origin": [
                    108,
                    235
                  ]
                },
                {
                  "src": "images/skills/211/2111013/summon/die/17.png",
                  "delay": 60,
                  "origin": [
                    108,
                    235
                  ]
                }
              ]
            }
          }
        }
      ]
    },
    "212": {
      "jobId": 212,
      "name": "大魔導士（火、毒）",
      "rank": "100",
      "skillBook": 212,
      "skills": [
        {
          "id": "2120004",
          "name": "魔力無限",
          "desc": "專注精神，引出無限的魔力，恢復HP與MP，並強化魔法威力。",
          "h": "每#x秒恢復#s%基本HP、MP\\n最終傷害增加#mdR%",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "30",
            "mdR": "7+14*d(x/5)",
            "x": "5",
            "s": "10"
          },
          "icon": "images/skills/212/2120004.png",
          "skillBook": 212
        },
        {
          "id": "2120010",
          "name": "神祕狙擊",
          "desc": "攻擊時，可以無視一定程度的怪物防禦率，持續攻擊時所有攻擊的傷害會增加。傷害增加效果會套用機率，最多可以累積5次。",
          "h": "攻擊時無視怪物的防禦率 #ignoreMobpdpR%，召喚獸攻擊除外的攻擊命中時，以#prop%機率每#time秒增加傷害#x%\\n傷害增加效果最多可套用#y次",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "30",
            "prop": "25+5*d(x/2)",
            "x": "2+d(x/5)",
            "y": "5",
            "ignoreMobpdpR": "5+u(x/2)",
            "time": "5"
          },
          "icon": "images/skills/212/2120010.png",
          "skillBook": 212
        },
        {
          "id": "2120012",
          "name": "大師魔法",
          "desc": "魔力增加，自己套用的所有BUFF的持續時間增加，皆為永久性。額外永久增加格擋。",
          "h": "增加魔力#madX、Buff持續時間#bufftimeR%、格擋#stanceProp%",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "madX": "3*x",
            "bufftimeR": "5*x",
            "stanceProp": "6*x"
          },
          "icon": "images/skills/212/2120012.png",
          "skillBook": 212
        },
        {
          "id": "2120043",
          "name": "致命毒霧-強化傷害",
          "desc": "致命毒霧的傷害增加。",
          "h": "提高傷害 #damR% ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "20"
          },
          "icon": "images/skills/212/2120043.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2120044",
          "name": "致命毒霧-持續效果",
          "desc": "致命毒霧的持續性持續時間增加。",
          "h": "持續性持續時間增加#dotTime秒 ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "dotTime": "6"
          },
          "icon": "images/skills/212/2120044.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2120045",
          "name": "致命毒霧-毒性蔓延",
          "desc": "致命毒霧的持續性傷害增加。",
          "h": "增加 #dot% 傷害",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "dot": "20"
          },
          "icon": "images/skills/212/2120045.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2120046",
          "name": "火焰之襲-強化",
          "desc": "增加火焰之襲的傷害。不套用火焰之襲 VI的巨大火焰留下的火種所引起的爆炸。",
          "h": "提高傷害 #damR% ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "10"
          },
          "icon": "images/skills/212/2120046.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2120047",
          "name": "火焰之襲-持續強化",
          "desc": "增加火焰之襲的持續傷害。不套用火焰之襲 VI的巨大火焰留下的火種所引起的爆炸。",
          "h": "增加 #dot% 傷害",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "dot": "20"
          },
          "icon": "images/skills/212/2120047.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2120048",
          "name": "火焰之襲-額外攻擊",
          "desc": "增加火焰之襲的攻擊次數。不套用火焰之襲 VI的巨大火焰留下的火種所引起的爆炸。",
          "h": "提高攻擊次數 #attackCount ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "attackCount": "1"
          },
          "icon": "images/skills/212/2120048.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2120049",
          "name": "地獄爆發-強化加農",
          "desc": "增加地獄爆發的傷害。",
          "h": "增加傷害值#damR%",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "10"
          },
          "icon": "images/skills/212/2120049.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2120050",
          "name": "地獄爆發-無視防禦",
          "desc": "地獄爆發的怪物防禦率無視效果額外增加。",
          "h": "怪物防禦率無視#ignoreMobpdpR% 額外增加",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "ignoreMobpdpR": "20"
          },
          "icon": "images/skills/212/2120050.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2120051",
          "name": "地獄爆發-冷卻減免",
          "desc": "減少地獄爆發的再次使用冷卻時間。",
          "h": "減少冷卻時間#coolTimeR%",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "coolTimeR": "50"
          },
          "icon": "images/skills/212/2120051.png",
          "skillBook": 212,
          "hyper": 1
        },
        {
          "id": "2121000",
          "name": "楓葉祝福",
          "desc": "受到楓之谷世界的女神的庇護，自己的所有能力值增加一定比例。使用技能時，楓之谷世界的女神將暫時現身。",
          "h": "消耗#mpConMP，使楓之谷世界的女神現身\\n[被動效果：直接投入AP的所有能力值增加#basicStatUp%]",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 10,
          "actions": [],
          "common": {
            "mpCon": "10+10*d(x/5)",
            "maxLevel": "30",
            "basicStatUp": "u(x/2)"
          },
          "icon": "images/skills/212/2121000.png",
          "skillBook": 212,
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121000/effect/0.png",
                "delay": 720,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/1.png",
                "delay": 60,
                "origin": [
                  142,
                  309
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/2.png",
                "delay": 60,
                "origin": [
                  144,
                  302
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/3.png",
                "delay": 60,
                "origin": [
                  144,
                  294
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/4.png",
                "delay": 60,
                "origin": [
                  144,
                  294
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/5.png",
                "delay": 60,
                "origin": [
                  144,
                  292
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/6.png",
                "delay": 60,
                "origin": [
                  144,
                  289
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/7.png",
                "delay": 60,
                "origin": [
                  144,
                  287
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/8.png",
                "delay": 60,
                "origin": [
                  143,
                  294
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/9.png",
                "delay": 60,
                "origin": [
                  149,
                  300
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/10.png",
                "delay": 60,
                "origin": [
                  147,
                  301
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/11.png",
                "delay": 60,
                "origin": [
                  145,
                  303
                ]
              },
              {
                "src": "images/skills/212/2121000/effect/12.png",
                "delay": 60,
                "origin": [
                  135,
                  302
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/212/2121000/effect0/0.png",
                "delay": 60,
                "origin": [
                  63,
                  227
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/1.png",
                "delay": 60,
                "origin": [
                  130,
                  434
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/2.png",
                "delay": 60,
                "origin": [
                  132,
                  434
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/3.png",
                "delay": 60,
                "origin": [
                  132,
                  433
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/4.png",
                "delay": 60,
                "origin": [
                  131,
                  432
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/5.png",
                "delay": 60,
                "origin": [
                  131,
                  431
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/6.png",
                "delay": 60,
                "origin": [
                  136,
                  429
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/7.png",
                "delay": 60,
                "origin": [
                  169,
                  427
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/8.png",
                "delay": 60,
                "origin": [
                  169,
                  424
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/9.png",
                "delay": 60,
                "origin": [
                  177,
                  421
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/10.png",
                "delay": 60,
                "origin": [
                  185,
                  418
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/11.png",
                "delay": 60,
                "origin": [
                  191,
                  414
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/12.png",
                "delay": 60,
                "origin": [
                  143,
                  366
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/13.png",
                "delay": 60,
                "origin": [
                  143,
                  354
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/14.png",
                "delay": 60,
                "origin": [
                  139,
                  342
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/15.png",
                "delay": 60,
                "origin": [
                  134,
                  306
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/16.png",
                "delay": 60,
                "origin": [
                  138,
                  307
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/17.png",
                "delay": 60,
                "origin": [
                  141,
                  309
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/18.png",
                "delay": 60,
                "origin": [
                  143,
                  310
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/19.png",
                "delay": 60,
                "origin": [
                  145,
                  311
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/20.png",
                "delay": 60,
                "origin": [
                  147,
                  312
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/21.png",
                "delay": 60,
                "origin": [
                  147,
                  313
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/22.png",
                "delay": 60,
                "origin": [
                  149,
                  313
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/23.png",
                "delay": 60,
                "origin": [
                  150,
                  312
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/24.png",
                "delay": 60,
                "origin": [
                  151,
                  296
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/25.png",
                "delay": 60,
                "origin": [
                  152,
                  296
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/26.png",
                "delay": 60,
                "origin": [
                  149,
                  297
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/27.png",
                "delay": 60,
                "origin": [
                  101,
                  295
                ]
              },
              {
                "src": "images/skills/212/2121000/effect0/28.png",
                "delay": 60,
                "origin": [
                  99,
                  292
                ]
              }
            ]
          }
        },
        {
          "id": "2121003",
          "name": "地獄爆發",
          "desc": "可讓致命毒霧的持續傷害擁有增加，使用技能時，能引爆附近的毒霧，並對敵人造成致命的毒屬性傷害。套用在對象的持續傷害數量越多，越能造成更大的傷害，但無法引爆其他人設置的毒霧。\\n不會受到冷卻時間重置的影響，成功引爆毒霧後，可重置炙焰毒火的冷卻時間。",
          "h": "消耗MP#mpCon，發動#q次對最多#mobCount名敵人造成#damage%傷害#attackCount次的爆炸攻擊，無視怪物防禦力#ignoreMobpdpR%\\n套用在對象的持續傷害數量為2個時，爆炸的最終傷害增加20%，3個增加45%，4個增加80%，5個增加125%\\n最多可同時引爆#y個毒霧\\n冷卻時間 #cooltime秒\\n對套用了5個以上持續傷害的敵人命中地獄爆發時，地獄爆發的冷卻時間減少2秒，因堆疊5個持續傷害而減少的冷卻時間會比其他冷卻時間減少的功能優先套用\\n[被動效果:使致命毒霧的持續傷害擁有增加#x%]",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "projectile": true,
          "actions": [
            "mistEruption"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "40+10*d(x/5)",
            "damage": "95+x",
            "mobCount": "12",
            "attackCount": "10",
            "q": "2",
            "x": "270+x",
            "y": "6",
            "z": "10",
            "cooltime": "10",
            "ignoreMobpdpR": "10+x",
            "lt": "-500, -350",
            "rb": "500, 350",
            "w": "5",
            "s": "5",
            "s2": "2000",
            "updatableTime": "900"
          },
          "icon": "images/skills/212/2121003.png",
          "skillBook": 212,
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121003/effect/0.png",
                "delay": 30,
                "origin": [
                  160,
                  197
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/1.png",
                "delay": 30,
                "origin": [
                  166,
                  204
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/2.png",
                "delay": 30,
                "origin": [
                  172,
                  205
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/3.png",
                "delay": 30,
                "origin": [
                  176,
                  204
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/4.png",
                "delay": 30,
                "origin": [
                  177,
                  204
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/5.png",
                "delay": 30,
                "origin": [
                  177,
                  201
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/6.png",
                "delay": 30,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/7.png",
                "delay": 30,
                "origin": [
                  174,
                  197
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/8.png",
                "delay": 30,
                "origin": [
                  172,
                  193
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/9.png",
                "delay": 30,
                "origin": [
                  168,
                  189
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/10.png",
                "delay": 60,
                "origin": [
                  161,
                  181
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/11.png",
                "delay": 60,
                "origin": [
                  142,
                  158
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/12.png",
                "delay": 60,
                "origin": [
                  177,
                  212
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/13.png",
                "delay": 60,
                "origin": [
                  233,
                  261
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/14.png",
                "delay": 60,
                "origin": [
                  238,
                  277
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/15.png",
                "delay": 60,
                "origin": [
                  244,
                  285
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/16.png",
                "delay": 60,
                "origin": [
                  249,
                  294
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/17.png",
                "delay": 60,
                "origin": [
                  234,
                  302
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/18.png",
                "delay": 60,
                "origin": [
                  242,
                  312
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/19.png",
                "delay": 60,
                "origin": [
                  220,
                  321
                ]
              },
              {
                "src": "images/skills/212/2121003/effect/20.png",
                "delay": 60,
                "origin": [
                  214,
                  330
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/212/2121003/hit/0.png",
                "delay": 90,
                "origin": [
                  46,
                  57
                ]
              },
              {
                "src": "images/skills/212/2121003/hit/1.png",
                "delay": 90,
                "origin": [
                  85,
                  82
                ]
              },
              {
                "src": "images/skills/212/2121003/hit/2.png",
                "delay": 90,
                "origin": [
                  85,
                  93
                ]
              },
              {
                "src": "images/skills/212/2121003/hit/3.png",
                "delay": 90,
                "origin": [
                  90,
                  95
                ]
              },
              {
                "src": "images/skills/212/2121003/hit/4.png",
                "delay": 90,
                "origin": [
                  91,
                  96
                ]
              },
              {
                "src": "images/skills/212/2121003/hit/5.png",
                "delay": 90,
                "origin": [
                  92,
                  96
                ]
              },
              {
                "src": "images/skills/212/2121003/hit/6.png",
                "delay": 90,
                "origin": [
                  93,
                  95
                ]
              },
              {
                "src": "images/skills/212/2121003/hit/7.png",
                "delay": 90,
                "origin": [
                  93,
                  93
                ]
              },
              {
                "src": "images/skills/212/2121003/hit/8.png",
                "delay": 90,
                "origin": [
                  90,
                  90
                ]
              }
            ]
          }
        },
        {
          "id": "2121005",
          "name": "召喚火魔",
          "desc": "一段時間內召喚出火屬性的火魔神。額外永久增加熟練度。火魔神攻擊即使攻擊處於反射攻擊狀態的敵人，也不會受到傷害。",
          "h": "消耗#mpCon MP，召喚火魔神#time秒\\n火魔神將對最多#mobCount名敵人造成#damage%傷害#attackCount次\\n#dotTime秒內，每#dotInterval秒造成一次#dot%持續傷害\\n[被動效果：熟練度增加量永久增加至#mastery%]",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 33,
          "actions": [
            "alert2"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "30+3*x",
            "time": "100+50*d(x/3)",
            "damage": "90+2*x",
            "mastery": "55+u(x/2)",
            "dot": "50+3*x",
            "dotInterval": "1",
            "dotTime": "2",
            "attackCount": "3",
            "mobCount": "3"
          },
          "icon": "images/skills/212/2121005.png",
          "skillBook": 212,
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121005/effect/0.png",
                "delay": 60,
                "origin": [
                  100,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/1.png",
                "delay": 60,
                "origin": [
                  105,
                  254
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/2.png",
                "delay": 60,
                "origin": [
                  108,
                  255
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/3.png",
                "delay": 60,
                "origin": [
                  109,
                  255
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/4.png",
                "delay": 60,
                "origin": [
                  109,
                  254
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/5.png",
                "delay": 60,
                "origin": [
                  109,
                  252
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/6.png",
                "delay": 60,
                "origin": [
                  109,
                  250
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/7.png",
                "delay": 60,
                "origin": [
                  109,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/8.png",
                "delay": 60,
                "origin": [
                  108,
                  246
                ]
              },
              {
                "src": "images/skills/212/2121005/effect/9.png",
                "delay": 60,
                "origin": [
                  107,
                  245
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/212/2121005/effect0/0.png",
                "delay": 60,
                "origin": [
                  58,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/1.png",
                "delay": 60,
                "origin": [
                  160,
                  300
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/2.png",
                "delay": 60,
                "origin": [
                  162,
                  302
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/3.png",
                "delay": 60,
                "origin": [
                  163,
                  303
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/4.png",
                "delay": 60,
                "origin": [
                  163,
                  303
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/5.png",
                "delay": 60,
                "origin": [
                  163,
                  303
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/6.png",
                "delay": 60,
                "origin": [
                  163,
                  303
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/7.png",
                "delay": 60,
                "origin": [
                  163,
                  320
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/8.png",
                "delay": 60,
                "origin": [
                  220,
                  350
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/9.png",
                "delay": 60,
                "origin": [
                  230,
                  350
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/10.png",
                "delay": 60,
                "origin": [
                  233,
                  340
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/11.png",
                "delay": 60,
                "origin": [
                  233,
                  341
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/12.png",
                "delay": 60,
                "origin": [
                  234,
                  342
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/13.png",
                "delay": 60,
                "origin": [
                  236,
                  342
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/14.png",
                "delay": 60,
                "origin": [
                  237,
                  342
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/15.png",
                "delay": 60,
                "origin": [
                  237,
                  341
                ]
              },
              {
                "src": "images/skills/212/2121005/effect0/16.png",
                "delay": 60,
                "origin": [
                  237,
                  340
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/212/2121005/hit/0.png",
                "delay": 90,
                "origin": [
                  74,
                  169
                ]
              },
              {
                "src": "images/skills/212/2121005/hit/1.png",
                "delay": 90,
                "origin": [
                  80,
                  184
                ]
              },
              {
                "src": "images/skills/212/2121005/hit/2.png",
                "delay": 90,
                "origin": [
                  85,
                  193
                ]
              },
              {
                "src": "images/skills/212/2121005/hit/3.png",
                "delay": 90,
                "origin": [
                  86,
                  197
                ]
              },
              {
                "src": "images/skills/212/2121005/hit/4.png",
                "delay": 90,
                "origin": [
                  87,
                  199
                ]
              },
              {
                "src": "images/skills/212/2121005/hit/5.png",
                "delay": 90,
                "origin": [
                  86,
                  200
                ]
              },
              {
                "src": "images/skills/212/2121005/hit/6.png",
                "delay": 90,
                "origin": [
                  84,
                  201
                ]
              },
              {
                "src": "images/skills/212/2121005/hit/7.png",
                "delay": 90,
                "origin": [
                  76,
                  200
                ]
              },
              {
                "src": "images/skills/212/2121005/hit/8.png",
                "delay": 90,
                "origin": [
                  73,
                  198
                ]
              }
            ],
            "summonAttacks": [
              {
                "name": "attack1",
                "frames": [
                  {
                    "src": "images/skills/212/2121005/summon/attack1/0.png",
                    "delay": 90,
                    "origin": [
                      114,
                      220
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/1.png",
                    "delay": 90,
                    "origin": [
                      113,
                      241
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/2.png",
                    "delay": 90,
                    "origin": [
                      112,
                      247
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/3.png",
                    "delay": 90,
                    "origin": [
                      112,
                      258
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/4.png",
                    "delay": 90,
                    "origin": [
                      113,
                      267
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/5.png",
                    "delay": 90,
                    "origin": [
                      119,
                      273
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/6.png",
                    "delay": 90,
                    "origin": [
                      121,
                      271
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/7.png",
                    "delay": 90,
                    "origin": [
                      121,
                      272
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/8.png",
                    "delay": 90,
                    "origin": [
                      118,
                      270
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/9.png",
                    "delay": 90,
                    "origin": [
                      142,
                      206
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/10.png",
                    "delay": 90,
                    "origin": [
                      143,
                      227
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/11.png",
                    "delay": 90,
                    "origin": [
                      143,
                      229
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/12.png",
                    "delay": 90,
                    "origin": [
                      140,
                      229
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/13.png",
                    "delay": 90,
                    "origin": [
                      135,
                      229
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/14.png",
                    "delay": 90,
                    "origin": [
                      133,
                      229
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/15.png",
                    "delay": 90,
                    "origin": [
                      131,
                      229
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/16.png",
                    "delay": 90,
                    "origin": [
                      127,
                      236
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack1/17.png",
                    "delay": 90,
                    "origin": [
                      124,
                      241
                    ]
                  }
                ],
                "mobCount": "3",
                "attackCount": "3"
              },
              {
                "name": "attack2",
                "frames": [
                  {
                    "src": "images/skills/212/2121005/summon/attack2/0.png",
                    "delay": 90,
                    "origin": [
                      114,
                      221
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/1.png",
                    "delay": 90,
                    "origin": [
                      151,
                      222
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/2.png",
                    "delay": 90,
                    "origin": [
                      174,
                      221
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/3.png",
                    "delay": 90,
                    "origin": [
                      206,
                      244
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/4.png",
                    "delay": 90,
                    "origin": [
                      213,
                      306
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/5.png",
                    "delay": 90,
                    "origin": [
                      218,
                      327
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/6.png",
                    "delay": 90,
                    "origin": [
                      208,
                      342
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/7.png",
                    "delay": 90,
                    "origin": [
                      170,
                      378
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/8.png",
                    "delay": 90,
                    "origin": [
                      155,
                      392
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/9.png",
                    "delay": 90,
                    "origin": [
                      167,
                      382
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/10.png",
                    "delay": 90,
                    "origin": [
                      277,
                      505
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/11.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/12.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/13.png",
                    "delay": 90,
                    "origin": [
                      587,
                      843
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/14.png",
                    "delay": 90,
                    "origin": [
                      613,
                      863
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/15.png",
                    "delay": 90,
                    "origin": [
                      621,
                      883
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/16.png",
                    "delay": 90,
                    "origin": [
                      633,
                      886
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/17.png",
                    "delay": 90,
                    "origin": [
                      638,
                      889
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/18.png",
                    "delay": 90,
                    "origin": [
                      642,
                      892
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/19.png",
                    "delay": 90,
                    "origin": [
                      644,
                      899
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/20.png",
                    "delay": 90,
                    "origin": [
                      644,
                      903
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/21.png",
                    "delay": 90,
                    "origin": [
                      642,
                      904
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/22.png",
                    "delay": 90,
                    "origin": [
                      622,
                      905
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/23.png",
                    "delay": 90,
                    "origin": [
                      550,
                      901
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/24.png",
                    "delay": 90,
                    "origin": [
                      550,
                      887
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/25.png",
                    "delay": 90,
                    "origin": [
                      550,
                      856
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/26.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/27.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/28.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/29.png",
                    "delay": 90,
                    "origin": [
                      550,
                      794
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/30.png",
                    "delay": 90,
                    "origin": [
                      550,
                      804
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/31.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/32.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/33.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/34.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/35.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/36.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/37.png",
                    "delay": 90,
                    "origin": [
                      550,
                      779
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/38.png",
                    "delay": 90,
                    "origin": [
                      550,
                      810
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/39.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/40.png",
                    "delay": 90,
                    "origin": [
                      550,
                      835
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/41.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  },
                  {
                    "src": "images/skills/212/2121005/summon/attack2/42.png",
                    "delay": 90,
                    "origin": [
                      550,
                      817
                    ]
                  }
                ],
                "mobCount": "12",
                "attackCount": "6"
              }
            ],
            "summonVisual": {
              "summoned": [
                {
                  "src": "images/skills/212/2121005/summon/summoned/0.png",
                  "delay": 90,
                  "origin": [
                    169,
                    327
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/summoned/1.png",
                  "delay": 90,
                  "origin": [
                    213,
                    323
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/summoned/2.png",
                  "delay": 90,
                  "origin": [
                    215,
                    314
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/summoned/3.png",
                  "delay": 90,
                  "origin": [
                    217,
                    308
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/summoned/4.png",
                  "delay": 90,
                  "origin": [
                    219,
                    300
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/summoned/5.png",
                  "delay": 90,
                  "origin": [
                    220,
                    303
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/summoned/6.png",
                  "delay": 90,
                  "origin": [
                    221,
                    306
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/summoned/7.png",
                  "delay": 90,
                  "origin": [
                    221,
                    308
                  ]
                }
              ],
              "move": [
                {
                  "src": "images/skills/212/2121005/summon/move/0.png",
                  "delay": 90,
                  "origin": [
                    114,
                    220
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/1.png",
                  "delay": 90,
                  "origin": [
                    113,
                    221
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/2.png",
                  "delay": 90,
                  "origin": [
                    112,
                    220
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/3.png",
                  "delay": 90,
                  "origin": [
                    112,
                    228
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/4.png",
                  "delay": 90,
                  "origin": [
                    113,
                    236
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/5.png",
                  "delay": 90,
                  "origin": [
                    119,
                    241
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/6.png",
                  "delay": 90,
                  "origin": [
                    121,
                    238
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/7.png",
                  "delay": 90,
                  "origin": [
                    121,
                    239
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/8.png",
                  "delay": 90,
                  "origin": [
                    118,
                    239
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/9.png",
                  "delay": 90,
                  "origin": [
                    115,
                    239
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/10.png",
                  "delay": 90,
                  "origin": [
                    116,
                    237
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/move/11.png",
                  "delay": 90,
                  "origin": [
                    115,
                    241
                  ]
                }
              ],
              "stand": [
                {
                  "src": "images/skills/212/2121005/summon/stand/0.png",
                  "delay": 90,
                  "origin": [
                    114,
                    221
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/1.png",
                  "delay": 90,
                  "origin": [
                    113,
                    222
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/2.png",
                  "delay": 90,
                  "origin": [
                    112,
                    221
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/3.png",
                  "delay": 90,
                  "origin": [
                    112,
                    229
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/4.png",
                  "delay": 90,
                  "origin": [
                    113,
                    237
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/5.png",
                  "delay": 90,
                  "origin": [
                    119,
                    242
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/6.png",
                  "delay": 90,
                  "origin": [
                    121,
                    239
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/7.png",
                  "delay": 90,
                  "origin": [
                    121,
                    240
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/8.png",
                  "delay": 90,
                  "origin": [
                    118,
                    240
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/9.png",
                  "delay": 90,
                  "origin": [
                    115,
                    240
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/10.png",
                  "delay": 90,
                  "origin": [
                    116,
                    238
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/stand/11.png",
                  "delay": 90,
                  "origin": [
                    115,
                    242
                  ]
                }
              ],
              "die": [
                {
                  "src": "images/skills/212/2121005/summon/die/0.png",
                  "delay": 90,
                  "origin": [
                    169,
                    308
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/die/1.png",
                  "delay": 90,
                  "origin": [
                    213,
                    309
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/die/2.png",
                  "delay": 90,
                  "origin": [
                    215,
                    292
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/die/3.png",
                  "delay": 90,
                  "origin": [
                    217,
                    296
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/die/4.png",
                  "delay": 90,
                  "origin": [
                    219,
                    299
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/die/5.png",
                  "delay": 90,
                  "origin": [
                    220,
                    303
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/die/6.png",
                  "delay": 90,
                  "origin": [
                    221,
                    306
                  ]
                },
                {
                  "src": "images/skills/212/2121005/summon/die/7.png",
                  "delay": 90,
                  "origin": [
                    221,
                    308
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "2121006",
          "name": "火焰之襲",
          "desc": "用強力的火焰掃蕩前方。被火焰掃蕩的敵人會因燒傷而受到持續的傷害。部分怪物會抵抗而不受到燒傷效果。火屬性攻擊。",
          "h": "消耗MP#mpCon，最多對#mobCount名敵人使用#damage%的傷害攻擊#attackCount次\\n倍攻擊的敵人會受到#time的燒傷，每#dotInterval秒受到#dot%的持續傷害",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "paralyze"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "16+6*d(x/7)",
            "damage": "140+2*x",
            "attackCount": "7",
            "x": "0",
            "dot": "120+4*x",
            "dotTime": "5",
            "dotInterval": "1",
            "time": "5",
            "mobCount": "8",
            "prop": "100",
            "lt": "-485, -180",
            "rb": "10, 20",
            "hcTime": "u(x/15)",
            "hcProp": "u(x/6)"
          },
          "icon": "images/skills/212/2121006.png",
          "skillBook": 212,
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121006/effect/0.png",
                "delay": 60,
                "origin": [
                  182,
                  217
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/1.png",
                "delay": 60,
                "origin": [
                  182,
                  222
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/2.png",
                "delay": 60,
                "origin": [
                  156,
                  286
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/3.png",
                "delay": 60,
                "origin": [
                  152,
                  293
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/4.png",
                "delay": 60,
                "origin": [
                  229,
                  293
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/5.png",
                "delay": 60,
                "origin": [
                  367,
                  293
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/6.png",
                "delay": 60,
                "origin": [
                  507,
                  292
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/7.png",
                "delay": 60,
                "origin": [
                  525,
                  290
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/8.png",
                "delay": 60,
                "origin": [
                  539,
                  238
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/9.png",
                "delay": 60,
                "origin": [
                  539,
                  233
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/10.png",
                "delay": 60,
                "origin": [
                  538,
                  225
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/11.png",
                "delay": 60,
                "origin": [
                  537,
                  216
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/12.png",
                "delay": 60,
                "origin": [
                  539,
                  218
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/13.png",
                "delay": 60,
                "origin": [
                  534,
                  220
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/14.png",
                "delay": 60,
                "origin": [
                  520,
                  220
                ]
              },
              {
                "src": "images/skills/212/2121006/effect/15.png",
                "delay": 60,
                "origin": [
                  487,
                  220
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/212/2121006/hit/0.png",
                "delay": 90,
                "origin": [
                  111,
                  91
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/1.png",
                "delay": 90,
                "origin": [
                  101,
                  100
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/2.png",
                "delay": 90,
                "origin": [
                  97,
                  101
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/3.png",
                "delay": 90,
                "origin": [
                  97,
                  102
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/4.png",
                "delay": 90,
                "origin": [
                  97,
                  102
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/5.png",
                "delay": 90,
                "origin": [
                  96,
                  61
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/6.png",
                "delay": 90,
                "origin": [
                  95,
                  61
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/7.png",
                "delay": 90,
                "origin": [
                  60,
                  61
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/8.png",
                "delay": 90,
                "origin": [
                  52,
                  60
                ]
              },
              {
                "src": "images/skills/212/2121006/hit/9.png",
                "delay": 90,
                "origin": [
                  49,
                  42
                ]
              }
            ]
          }
        },
        {
          "id": "2121007",
          "name": "火流星",
          "desc": "從天空召喚隕石，以造成猛烈的火焰攻擊。另外，使用火靈結界以外的技能命中時，有#c一定的機率會對敵人召喚隕石，並對其造成傷害#。此效果為永久性。",
          "h": "消耗#mpCon MP，對最多#mobCount名敵人造成#damage%傷害#attackCount次\\n冷卻時間：#cooltime秒\\n[被動效果：#c[終極攻擊系列技能]#直接攻擊的技能命中時，有#prop%機率召喚將造成#x%傷害的火流星墜落]",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "meteorNew"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "360-x*2",
            "mobCount": "15",
            "damage": "225+3*x",
            "cooltime": "45",
            "attackCount": "12",
            "x": "100+4*x",
            "lt": "-400, -350",
            "rb": "400, 250",
            "hcCooltime": "60-2*d(x/2)",
            "u": "0",
            "prop": "2*x",
            "y": "600"
          },
          "icon": "images/skills/212/2121007.png",
          "skillBook": 212,
          "blizzardCast": {
            "tileFrame": 15,
            "hitFrame": 18,
            "tileMs": 900,
            "hitMs": 1080,
            "maxTileTargets": 15
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121007/effect/0.png",
                "delay": 60,
                "origin": [
                  99,
                  137
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/1.png",
                "delay": 60,
                "origin": [
                  102,
                  120
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/2.png",
                "delay": 60,
                "origin": [
                  103,
                  125
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/3.png",
                "delay": 60,
                "origin": [
                  103,
                  129
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/4.png",
                "delay": 60,
                "origin": [
                  104,
                  136
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/5.png",
                "delay": 60,
                "origin": [
                  106,
                  143
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/6.png",
                "delay": 60,
                "origin": [
                  107,
                  144
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/7.png",
                "delay": 60,
                "origin": [
                  107,
                  157
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/8.png",
                "delay": 60,
                "origin": [
                  106,
                  168
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/9.png",
                "delay": 60,
                "origin": [
                  106,
                  177
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/10.png",
                "delay": 60,
                "origin": [
                  106,
                  185
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/11.png",
                "delay": 60,
                "origin": [
                  106,
                  191
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/12.png",
                "delay": 60,
                "origin": [
                  105,
                  197
                ]
              },
              {
                "src": "images/skills/212/2121007/effect/13.png",
                "delay": 60,
                "origin": [
                  80,
                  201
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/212/2121007/effect0/0.png",
                "delay": 60,
                "origin": [
                  92,
                  61
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/1.png",
                "delay": 60,
                "origin": [
                  123,
                  212
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/2.png",
                "delay": 60,
                "origin": [
                  174,
                  255
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/3.png",
                "delay": 60,
                "origin": [
                  180,
                  300
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/4.png",
                "delay": 60,
                "origin": [
                  177,
                  297
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/5.png",
                "delay": 60,
                "origin": [
                  176,
                  294
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/6.png",
                "delay": 60,
                "origin": [
                  174,
                  292
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/7.png",
                "delay": 60,
                "origin": [
                  171,
                  294
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/8.png",
                "delay": 60,
                "origin": [
                  167,
                  291
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/9.png",
                "delay": 60,
                "origin": [
                  164,
                  286
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/10.png",
                "delay": 60,
                "origin": [
                  161,
                  287
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/11.png",
                "delay": 60,
                "origin": [
                  165,
                  324
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/12.png",
                "delay": 60,
                "origin": [
                  215,
                  397
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/13.png",
                "delay": 60,
                "origin": [
                  222,
                  417
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/14.png",
                "delay": 60,
                "origin": [
                  215,
                  432
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/15.png",
                "delay": 60,
                "origin": [
                  220,
                  462
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/16.png",
                "delay": 60,
                "origin": [
                  222,
                  455
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/17.png",
                "delay": 60,
                "origin": [
                  218,
                  449
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/18.png",
                "delay": 60,
                "origin": [
                  180,
                  425
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/19.png",
                "delay": 60,
                "origin": [
                  179,
                  418
                ]
              },
              {
                "src": "images/skills/212/2121007/effect0/20.png",
                "delay": 60,
                "origin": [
                  157,
                  413
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/212/2121007/hit/0.png",
                "delay": 60,
                "origin": [
                  94,
                  95
                ]
              },
              {
                "src": "images/skills/212/2121007/hit/1.png",
                "delay": 60,
                "origin": [
                  146,
                  144
                ]
              },
              {
                "src": "images/skills/212/2121007/hit/2.png",
                "delay": 60,
                "origin": [
                  140,
                  154
                ]
              },
              {
                "src": "images/skills/212/2121007/hit/3.png",
                "delay": 60,
                "origin": [
                  157,
                  148
                ]
              },
              {
                "src": "images/skills/212/2121007/hit/4.png",
                "delay": 60,
                "origin": [
                  161,
                  152
                ]
              },
              {
                "src": "images/skills/212/2121007/hit/5.png",
                "delay": 60,
                "origin": [
                  148,
                  139
                ]
              }
            ],
            "tiles": [
              {
                "id": 0,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/0/0.png",
                    "delay": 60,
                    "origin": [
                      -19,
                      205
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/1.png",
                    "delay": 60,
                    "origin": [
                      -17,
                      222
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/2.png",
                    "delay": 60,
                    "origin": [
                      3,
                      218
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/3.png",
                    "delay": 60,
                    "origin": [
                      70,
                      369
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/4.png",
                    "delay": 60,
                    "origin": [
                      85,
                      345
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/5.png",
                    "delay": 60,
                    "origin": [
                      75,
                      334
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/6.png",
                    "delay": 60,
                    "origin": [
                      81,
                      336
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/7.png",
                    "delay": 60,
                    "origin": [
                      74,
                      338
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/8.png",
                    "delay": 60,
                    "origin": [
                      69,
                      340
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/9.png",
                    "delay": 60,
                    "origin": [
                      74,
                      344
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/10.png",
                    "delay": 60,
                    "origin": [
                      88,
                      349
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/11.png",
                    "delay": 60,
                    "origin": [
                      85,
                      350
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/12.png",
                    "delay": 60,
                    "origin": [
                      82,
                      342
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/13.png",
                    "delay": 60,
                    "origin": [
                      161,
                      285
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/14.png",
                    "delay": 60,
                    "origin": [
                      190,
                      309
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/15.png",
                    "delay": 60,
                    "origin": [
                      202,
                      326
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/16.png",
                    "delay": 60,
                    "origin": [
                      215,
                      352
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/17.png",
                    "delay": 60,
                    "origin": [
                      236,
                      353
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/18.png",
                    "delay": 60,
                    "origin": [
                      233,
                      363
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/19.png",
                    "delay": 60,
                    "origin": [
                      237,
                      333
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/20.png",
                    "delay": 60,
                    "origin": [
                      187,
                      333
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/21.png",
                    "delay": 60,
                    "origin": [
                      187,
                      329
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/22.png",
                    "delay": 60,
                    "origin": [
                      187,
                      328
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/23.png",
                    "delay": 60,
                    "origin": [
                      182,
                      326
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/24.png",
                    "delay": 60,
                    "origin": [
                      182,
                      327
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/25.png",
                    "delay": 60,
                    "origin": [
                      151,
                      324
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/0/26.png",
                    "delay": 60,
                    "origin": [
                      155,
                      323
                    ]
                  }
                ]
              },
              {
                "id": 1,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/1/0.png",
                    "delay": 60,
                    "origin": [
                      -90,
                      295
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/1.png",
                    "delay": 60,
                    "origin": [
                      -88,
                      312
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/2.png",
                    "delay": 60,
                    "origin": [
                      -68,
                      308
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/3.png",
                    "delay": 60,
                    "origin": [
                      -1,
                      459
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/4.png",
                    "delay": 60,
                    "origin": [
                      14,
                      435
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/5.png",
                    "delay": 60,
                    "origin": [
                      4,
                      424
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/6.png",
                    "delay": 60,
                    "origin": [
                      10,
                      426
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/7.png",
                    "delay": 60,
                    "origin": [
                      3,
                      428
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/8.png",
                    "delay": 60,
                    "origin": [
                      -2,
                      430
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/9.png",
                    "delay": 60,
                    "origin": [
                      3,
                      434
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/10.png",
                    "delay": 60,
                    "origin": [
                      17,
                      439
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/11.png",
                    "delay": 60,
                    "origin": [
                      14,
                      440
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/12.png",
                    "delay": 60,
                    "origin": [
                      11,
                      432
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/13.png",
                    "delay": 60,
                    "origin": [
                      10,
                      375
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/14.png",
                    "delay": 60,
                    "origin": [
                      37,
                      350
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/15.png",
                    "delay": 60,
                    "origin": [
                      161,
                      369
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/16.png",
                    "delay": 60,
                    "origin": [
                      190,
                      355
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/17.png",
                    "delay": 60,
                    "origin": [
                      202,
                      326
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/18.png",
                    "delay": 60,
                    "origin": [
                      205,
                      352
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/19.png",
                    "delay": 60,
                    "origin": [
                      207,
                      353
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/20.png",
                    "delay": 60,
                    "origin": [
                      207,
                      363
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/21.png",
                    "delay": 60,
                    "origin": [
                      207,
                      333
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/22.png",
                    "delay": 60,
                    "origin": [
                      187,
                      333
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/23.png",
                    "delay": 60,
                    "origin": [
                      187,
                      329
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/24.png",
                    "delay": 60,
                    "origin": [
                      187,
                      328
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/25.png",
                    "delay": 60,
                    "origin": [
                      182,
                      326
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/26.png",
                    "delay": 60,
                    "origin": [
                      182,
                      327
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/27.png",
                    "delay": 60,
                    "origin": [
                      151,
                      324
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/1/28.png",
                    "delay": 60,
                    "origin": [
                      155,
                      323
                    ]
                  }
                ]
              },
              {
                "id": 2,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/2/0.png",
                    "delay": 60,
                    "origin": [
                      -146,
                      358
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/1.png",
                    "delay": 60,
                    "origin": [
                      -144,
                      375
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/2.png",
                    "delay": 60,
                    "origin": [
                      -124,
                      371
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/3.png",
                    "delay": 60,
                    "origin": [
                      -57,
                      522
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/4.png",
                    "delay": 60,
                    "origin": [
                      -42,
                      498
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/5.png",
                    "delay": 60,
                    "origin": [
                      -52,
                      487
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/6.png",
                    "delay": 60,
                    "origin": [
                      -46,
                      489
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/7.png",
                    "delay": 60,
                    "origin": [
                      -53,
                      491
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/8.png",
                    "delay": 60,
                    "origin": [
                      -58,
                      493
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/9.png",
                    "delay": 60,
                    "origin": [
                      -53,
                      497
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/10.png",
                    "delay": 60,
                    "origin": [
                      -39,
                      502
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/11.png",
                    "delay": 60,
                    "origin": [
                      -42,
                      503
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/12.png",
                    "delay": 60,
                    "origin": [
                      -45,
                      495
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/13.png",
                    "delay": 60,
                    "origin": [
                      -46,
                      438
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/14.png",
                    "delay": 60,
                    "origin": [
                      -19,
                      413
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/15.png",
                    "delay": 60,
                    "origin": [
                      64,
                      432
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/16.png",
                    "delay": 60,
                    "origin": [
                      161,
                      418
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/17.png",
                    "delay": 60,
                    "origin": [
                      190,
                      380
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/18.png",
                    "delay": 60,
                    "origin": [
                      202,
                      377
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/19.png",
                    "delay": 60,
                    "origin": [
                      205,
                      376
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/20.png",
                    "delay": 60,
                    "origin": [
                      207,
                      377
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/21.png",
                    "delay": 60,
                    "origin": [
                      207,
                      377
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/22.png",
                    "delay": 60,
                    "origin": [
                      207,
                      371
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/23.png",
                    "delay": 60,
                    "origin": [
                      187,
                      372
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/24.png",
                    "delay": 60,
                    "origin": [
                      187,
                      364
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/25.png",
                    "delay": 60,
                    "origin": [
                      187,
                      328
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/26.png",
                    "delay": 60,
                    "origin": [
                      182,
                      326
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/27.png",
                    "delay": 60,
                    "origin": [
                      182,
                      327
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/28.png",
                    "delay": 60,
                    "origin": [
                      151,
                      324
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/2/29.png",
                    "delay": 60,
                    "origin": [
                      155,
                      323
                    ]
                  }
                ]
              },
              {
                "id": 3,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/3/0.png",
                    "delay": 60,
                    "origin": [
                      -33,
                      246
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/1.png",
                    "delay": 60,
                    "origin": [
                      -27,
                      269
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/2.png",
                    "delay": 60,
                    "origin": [
                      -7,
                      263
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/3.png",
                    "delay": 60,
                    "origin": [
                      70,
                      444
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/4.png",
                    "delay": 60,
                    "origin": [
                      88,
                      416
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/5.png",
                    "delay": 60,
                    "origin": [
                      76,
                      403
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/6.png",
                    "delay": 60,
                    "origin": [
                      83,
                      405
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/7.png",
                    "delay": 60,
                    "origin": [
                      75,
                      408
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/8.png",
                    "delay": 60,
                    "origin": [
                      70,
                      409
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/9.png",
                    "delay": 60,
                    "origin": [
                      75,
                      415
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/10.png",
                    "delay": 60,
                    "origin": [
                      92,
                      420
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/11.png",
                    "delay": 60,
                    "origin": [
                      88,
                      422
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/12.png",
                    "delay": 60,
                    "origin": [
                      84,
                      412
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/13.png",
                    "delay": 60,
                    "origin": [
                      184,
                      345
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/14.png",
                    "delay": 60,
                    "origin": [
                      217,
                      353
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/15.png",
                    "delay": 60,
                    "origin": [
                      231,
                      372
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/16.png",
                    "delay": 60,
                    "origin": [
                      239,
                      401
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/17.png",
                    "delay": 60,
                    "origin": [
                      263,
                      403
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/18.png",
                    "delay": 60,
                    "origin": [
                      259,
                      412
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/19.png",
                    "delay": 60,
                    "origin": [
                      250,
                      380
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/20.png",
                    "delay": 60,
                    "origin": [
                      214,
                      380
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/21.png",
                    "delay": 60,
                    "origin": [
                      214,
                      375
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/22.png",
                    "delay": 60,
                    "origin": [
                      214,
                      373
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/23.png",
                    "delay": 60,
                    "origin": [
                      207,
                      372
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/24.png",
                    "delay": 60,
                    "origin": [
                      207,
                      373
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/25.png",
                    "delay": 60,
                    "origin": [
                      173,
                      369
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/3/26.png",
                    "delay": 60,
                    "origin": [
                      177,
                      368
                    ]
                  }
                ]
              },
              {
                "id": 4,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/4/0.png",
                    "delay": 60,
                    "origin": [
                      -130,
                      353
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/1.png",
                    "delay": 60,
                    "origin": [
                      -124,
                      376
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/2.png",
                    "delay": 60,
                    "origin": [
                      -104,
                      370
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/3.png",
                    "delay": 60,
                    "origin": [
                      -27,
                      551
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/4.png",
                    "delay": 60,
                    "origin": [
                      -9,
                      523
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/5.png",
                    "delay": 60,
                    "origin": [
                      -21,
                      510
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/6.png",
                    "delay": 60,
                    "origin": [
                      -14,
                      512
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/7.png",
                    "delay": 60,
                    "origin": [
                      -22,
                      515
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/8.png",
                    "delay": 60,
                    "origin": [
                      -27,
                      516
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/9.png",
                    "delay": 60,
                    "origin": [
                      -22,
                      522
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/10.png",
                    "delay": 60,
                    "origin": [
                      -5,
                      527
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/11.png",
                    "delay": 60,
                    "origin": [
                      -9,
                      529
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/12.png",
                    "delay": 60,
                    "origin": [
                      -13,
                      519
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/13.png",
                    "delay": 60,
                    "origin": [
                      -11,
                      452
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/14.png",
                    "delay": 60,
                    "origin": [
                      38,
                      441
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/15.png",
                    "delay": 60,
                    "origin": [
                      184,
                      442
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/16.png",
                    "delay": 60,
                    "origin": [
                      217,
                      422
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/17.png",
                    "delay": 60,
                    "origin": [
                      231,
                      382
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/18.png",
                    "delay": 60,
                    "origin": [
                      234,
                      401
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/19.png",
                    "delay": 60,
                    "origin": [
                      236,
                      403
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/20.png",
                    "delay": 60,
                    "origin": [
                      236,
                      412
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/21.png",
                    "delay": 60,
                    "origin": [
                      237,
                      380
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/22.png",
                    "delay": 60,
                    "origin": [
                      214,
                      380
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/23.png",
                    "delay": 60,
                    "origin": [
                      214,
                      375
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/24.png",
                    "delay": 60,
                    "origin": [
                      214,
                      373
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/25.png",
                    "delay": 60,
                    "origin": [
                      207,
                      372
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/26.png",
                    "delay": 60,
                    "origin": [
                      207,
                      373
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/27.png",
                    "delay": 60,
                    "origin": [
                      173,
                      369
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/4/28.png",
                    "delay": 60,
                    "origin": [
                      177,
                      368
                    ]
                  }
                ]
              },
              {
                "id": 5,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/5/0.png",
                    "delay": 60,
                    "origin": [
                      -193,
                      425
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/1.png",
                    "delay": 60,
                    "origin": [
                      -187,
                      448
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/2.png",
                    "delay": 60,
                    "origin": [
                      -167,
                      442
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/3.png",
                    "delay": 60,
                    "origin": [
                      -90,
                      623
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/4.png",
                    "delay": 60,
                    "origin": [
                      -72,
                      595
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/5.png",
                    "delay": 60,
                    "origin": [
                      -84,
                      582
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/6.png",
                    "delay": 60,
                    "origin": [
                      -77,
                      584
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/7.png",
                    "delay": 60,
                    "origin": [
                      -85,
                      587
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/8.png",
                    "delay": 60,
                    "origin": [
                      -90,
                      588
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/9.png",
                    "delay": 60,
                    "origin": [
                      -85,
                      594
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/10.png",
                    "delay": 60,
                    "origin": [
                      -68,
                      599
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/11.png",
                    "delay": 60,
                    "origin": [
                      -72,
                      601
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/12.png",
                    "delay": 60,
                    "origin": [
                      -76,
                      591
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/13.png",
                    "delay": 60,
                    "origin": [
                      -74,
                      524
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/14.png",
                    "delay": 60,
                    "origin": [
                      -25,
                      513
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/15.png",
                    "delay": 60,
                    "origin": [
                      52,
                      514
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/16.png",
                    "delay": 60,
                    "origin": [
                      184,
                      494
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/17.png",
                    "delay": 60,
                    "origin": [
                      217,
                      454
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/18.png",
                    "delay": 60,
                    "origin": [
                      231,
                      450
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/19.png",
                    "delay": 60,
                    "origin": [
                      234,
                      446
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/20.png",
                    "delay": 60,
                    "origin": [
                      236,
                      448
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/21.png",
                    "delay": 60,
                    "origin": [
                      236,
                      451
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/22.png",
                    "delay": 60,
                    "origin": [
                      237,
                      443
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/23.png",
                    "delay": 60,
                    "origin": [
                      214,
                      444
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/24.png",
                    "delay": 60,
                    "origin": [
                      214,
                      435
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/25.png",
                    "delay": 60,
                    "origin": [
                      214,
                      373
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/26.png",
                    "delay": 60,
                    "origin": [
                      207,
                      372
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/27.png",
                    "delay": 60,
                    "origin": [
                      207,
                      373
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/28.png",
                    "delay": 60,
                    "origin": [
                      173,
                      369
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/5/29.png",
                    "delay": 60,
                    "origin": [
                      177,
                      368
                    ]
                  }
                ]
              },
              {
                "id": 6,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/6/0.png",
                    "delay": 60,
                    "origin": [
                      -48,
                      383
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/1.png",
                    "delay": 60,
                    "origin": [
                      -13,
                      425
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/2.png",
                    "delay": 60,
                    "origin": [
                      9,
                      415
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/3.png",
                    "delay": 60,
                    "origin": [
                      95,
                      613
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/4.png",
                    "delay": 60,
                    "origin": [
                      116,
                      610
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/5.png",
                    "delay": 60,
                    "origin": [
                      103,
                      613
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/6.png",
                    "delay": 60,
                    "origin": [
                      107,
                      602
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/7.png",
                    "delay": 60,
                    "origin": [
                      101,
                      564
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/8.png",
                    "delay": 60,
                    "origin": [
                      94,
                      613
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/9.png",
                    "delay": 60,
                    "origin": [
                      101,
                      613
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/10.png",
                    "delay": 60,
                    "origin": [
                      125,
                      613
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/11.png",
                    "delay": 60,
                    "origin": [
                      117,
                      587
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/12.png",
                    "delay": 60,
                    "origin": [
                      111,
                      613
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/13.png",
                    "delay": 60,
                    "origin": [
                      230,
                      547
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/14.png",
                    "delay": 60,
                    "origin": [
                      271,
                      531
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/15.png",
                    "delay": 60,
                    "origin": [
                      319,
                      531
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/16.png",
                    "delay": 60,
                    "origin": [
                      329,
                      502
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/17.png",
                    "delay": 60,
                    "origin": [
                      363,
                      504
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/18.png",
                    "delay": 60,
                    "origin": [
                      358,
                      517
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/19.png",
                    "delay": 60,
                    "origin": [
                      387,
                      475
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/20.png",
                    "delay": 60,
                    "origin": [
                      267,
                      475
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/21.png",
                    "delay": 60,
                    "origin": [
                      267,
                      469
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/22.png",
                    "delay": 60,
                    "origin": [
                      267,
                      467
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/23.png",
                    "delay": 60,
                    "origin": [
                      259,
                      465
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/24.png",
                    "delay": 60,
                    "origin": [
                      259,
                      466
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/25.png",
                    "delay": 60,
                    "origin": [
                      216,
                      462
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/6/26.png",
                    "delay": 60,
                    "origin": [
                      221,
                      460
                    ]
                  }
                ]
              },
              {
                "id": 7,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/7/0.png",
                    "delay": 60,
                    "origin": [
                      -114,
                      465
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/1.png",
                    "delay": 60,
                    "origin": [
                      -79,
                      507
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/2.png",
                    "delay": 60,
                    "origin": [
                      -57,
                      497
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/3.png",
                    "delay": 60,
                    "origin": [
                      29,
                      695
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/4.png",
                    "delay": 60,
                    "origin": [
                      54,
                      692
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/5.png",
                    "delay": 60,
                    "origin": [
                      37,
                      695
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/6.png",
                    "delay": 60,
                    "origin": [
                      47,
                      684
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/7.png",
                    "delay": 60,
                    "origin": [
                      35,
                      646
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/8.png",
                    "delay": 60,
                    "origin": [
                      28,
                      695
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/9.png",
                    "delay": 60,
                    "origin": [
                      35,
                      695
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/10.png",
                    "delay": 60,
                    "origin": [
                      59,
                      695
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/11.png",
                    "delay": 60,
                    "origin": [
                      54,
                      669
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/12.png",
                    "delay": 60,
                    "origin": [
                      48,
                      695
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/13.png",
                    "delay": 60,
                    "origin": [
                      103,
                      629
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/14.png",
                    "delay": 60,
                    "origin": [
                      230,
                      613
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/15.png",
                    "delay": 60,
                    "origin": [
                      271,
                      613
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/16.png",
                    "delay": 60,
                    "origin": [
                      288,
                      561
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/17.png",
                    "delay": 60,
                    "origin": [
                      292,
                      516
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/18.png",
                    "delay": 60,
                    "origin": [
                      295,
                      511
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/19.png",
                    "delay": 60,
                    "origin": [
                      295,
                      517
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/20.png",
                    "delay": 60,
                    "origin": [
                      296,
                      507
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/21.png",
                    "delay": 60,
                    "origin": [
                      267,
                      512
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/22.png",
                    "delay": 60,
                    "origin": [
                      267,
                      499
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/23.png",
                    "delay": 60,
                    "origin": [
                      267,
                      501
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/24.png",
                    "delay": 60,
                    "origin": [
                      259,
                      487
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/25.png",
                    "delay": 60,
                    "origin": [
                      259,
                      466
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/26.png",
                    "delay": 60,
                    "origin": [
                      216,
                      462
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/7/27.png",
                    "delay": 60,
                    "origin": [
                      221,
                      460
                    ]
                  }
                ]
              },
              {
                "id": 8,
                "frames": [
                  {
                    "src": "images/skills/212/2121007/tile/8/0.png",
                    "delay": 60,
                    "origin": [
                      -424,
                      838
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/1.png",
                    "delay": 60,
                    "origin": [
                      -389,
                      880
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/2.png",
                    "delay": 60,
                    "origin": [
                      -367,
                      870
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/3.png",
                    "delay": 60,
                    "origin": [
                      -281,
                      1068
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/4.png",
                    "delay": 60,
                    "origin": [
                      -256,
                      1065
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/5.png",
                    "delay": 60,
                    "origin": [
                      -273,
                      1068
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/6.png",
                    "delay": 60,
                    "origin": [
                      -263,
                      1057
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/7.png",
                    "delay": 60,
                    "origin": [
                      -275,
                      1019
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/8.png",
                    "delay": 60,
                    "origin": [
                      -282,
                      1068
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/9.png",
                    "delay": 60,
                    "origin": [
                      -275,
                      1068
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/10.png",
                    "delay": 60,
                    "origin": [
                      -251,
                      1068
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/11.png",
                    "delay": 60,
                    "origin": [
                      -256,
                      1042
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/12.png",
                    "delay": 60,
                    "origin": [
                      -262,
                      1068
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/13.png",
                    "delay": 60,
                    "origin": [
                      -207,
                      1002
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/14.png",
                    "delay": 60,
                    "origin": [
                      -128,
                      986
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/15.png",
                    "delay": 60,
                    "origin": [
                      -57,
                      986
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/16.png",
                    "delay": 60,
                    "origin": [
                      -46,
                      934
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/17.png",
                    "delay": 60,
                    "origin": [
                      230,
                      889
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/18.png",
                    "delay": 60,
                    "origin": [
                      271,
                      884
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/19.png",
                    "delay": 60,
                    "origin": [
                      288,
                      867
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/20.png",
                    "delay": 60,
                    "origin": [
                      292,
                      880
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/21.png",
                    "delay": 60,
                    "origin": [
                      295,
                      885
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/22.png",
                    "delay": 60,
                    "origin": [
                      295,
                      872
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/23.png",
                    "delay": 60,
                    "origin": [
                      296,
                      874
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/24.png",
                    "delay": 60,
                    "origin": [
                      267,
                      860
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/25.png",
                    "delay": 60,
                    "origin": [
                      267,
                      469
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/26.png",
                    "delay": 60,
                    "origin": [
                      267,
                      467
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/27.png",
                    "delay": 60,
                    "origin": [
                      259,
                      465
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/28.png",
                    "delay": 60,
                    "origin": [
                      259,
                      466
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/29.png",
                    "delay": 60,
                    "origin": [
                      216,
                      462
                    ]
                  },
                  {
                    "src": "images/skills/212/2121007/tile/8/30.png",
                    "delay": 60,
                    "origin": [
                      221,
                      460
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "2121008",
          "name": "楓葉淨化　",
          "desc": "集中精神，以解除狀態異常。使用後，在3秒內對狀態異常免疫。但不適用於部分狀態異常效果，且不適用於戰鬥命令。\\n即使在使用其他技能時，也可使用勇士的意志。",
          "h": "消耗MP #mpCon，再次使用冷卻時間 #cooltime秒",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 5,
          "infoType": 35,
          "actions": [],
          "common": {
            "maxLevel": "5",
            "mpCon": "30",
            "cooltime": "600-60*x",
            "time": "1"
          },
          "icon": "images/skills/212/2121008.png",
          "skillBook": 212,
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121008/effect/0.png",
                "delay": 60,
                "origin": [
                  95,
                  241
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/1.png",
                "delay": 60,
                "origin": [
                  97,
                  237
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/2.png",
                "delay": 60,
                "origin": [
                  101,
                  242
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/3.png",
                "delay": 60,
                "origin": [
                  103,
                  249
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/4.png",
                "delay": 60,
                "origin": [
                  103,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/5.png",
                "delay": 60,
                "origin": [
                  104,
                  244
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/6.png",
                "delay": 60,
                "origin": [
                  137,
                  238
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/7.png",
                "delay": 60,
                "origin": [
                  194,
                  246
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/8.png",
                "delay": 60,
                "origin": [
                  131,
                  247
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/9.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/10.png",
                "delay": 60,
                "origin": [
                  132,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/11.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/12.png",
                "delay": 60,
                "origin": [
                  133,
                  249
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/13.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/14.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/15.png",
                "delay": 60,
                "origin": [
                  57,
                  246
                ]
              },
              {
                "src": "images/skills/212/2121008/effect/16.png",
                "delay": 60,
                "origin": [
                  55,
                  200
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/212/2121008/effect0/0.png",
                "delay": 360,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/1.png",
                "delay": 60,
                "origin": [
                  145,
                  267
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/2.png",
                "delay": 60,
                "origin": [
                  145,
                  264
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/3.png",
                "delay": 60,
                "origin": [
                  145,
                  256
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/4.png",
                "delay": 60,
                "origin": [
                  145,
                  262
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/5.png",
                "delay": 60,
                "origin": [
                  129,
                  265
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/6.png",
                "delay": 60,
                "origin": [
                  140,
                  265
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/7.png",
                "delay": 60,
                "origin": [
                  141,
                  265
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/8.png",
                "delay": 60,
                "origin": [
                  129,
                  262
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/9.png",
                "delay": 60,
                "origin": [
                  127,
                  258
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/10.png",
                "delay": 60,
                "origin": [
                  114,
                  250
                ]
              },
              {
                "src": "images/skills/212/2121008/effect0/11.png",
                "delay": 60,
                "origin": [
                  101,
                  246
                ]
              }
            ]
          }
        },
        {
          "id": "2121011",
          "name": "炙焰毒火",
          "desc": "讓敵人被燃燒的#c毒霧包圍，處於無法接觸的狀態#，造成持續傷害並變慢。另外，命中敵人時，在該位置形成致命毒霧，如果沒有命中敵人，則會在自己所在的位置形成致命毒霧。",
          "h": "消耗MP#mpCon，單一敵人以 #damage%傷害攻擊#attackCount次，以#prop%的機率在#dotTime秒內#dot%持續造成傷害，#c在不碰撞的狀態下持續與 #x%減速#，命中敵人時，敵人位置會形成致命毒霧，若是沒有敵人被擊中，自己的位置會形成致命毒霧。\\n再次使用待機時間#cooltime秒",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "projectile": true,
          "actions": [
            "flameHaze"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "25+3*u(x/2)",
            "damage": "112+3*x",
            "prop": "100",
            "dot": "110+3*x",
            "dotTime": "30",
            "time": "30",
            "dotInterval": "1",
            "range": "450",
            "attackCount": "15",
            "x": "-20-x",
            "cooltime": "20-d(x/3)",
            "s": "10",
            "q": "0",
            "u": "180",
            "v": "67",
            "s2": "510"
          },
          "icon": "images/skills/212/2121011.png",
          "skillBook": 212,
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121011/effect/0.png",
                "delay": 60,
                "origin": [
                  177,
                  194
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/1.png",
                "delay": 60,
                "origin": [
                  205,
                  204
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/2.png",
                "delay": 60,
                "origin": [
                  219,
                  208
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/3.png",
                "delay": 60,
                "origin": [
                  222,
                  210
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/4.png",
                "delay": 60,
                "origin": [
                  224,
                  212
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/5.png",
                "delay": 60,
                "origin": [
                  225,
                  214
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/6.png",
                "delay": 60,
                "origin": [
                  226,
                  214
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/7.png",
                "delay": 60,
                "origin": [
                  227,
                  217
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/8.png",
                "delay": 60,
                "origin": [
                  228,
                  212
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/9.png",
                "delay": 60,
                "origin": [
                  404,
                  252
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/10.png",
                "delay": 60,
                "origin": [
                  393,
                  289
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/11.png",
                "delay": 60,
                "origin": [
                  389,
                  322
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/12.png",
                "delay": 60,
                "origin": [
                  381,
                  320
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/13.png",
                "delay": 60,
                "origin": [
                  371,
                  315
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/14.png",
                "delay": 60,
                "origin": [
                  364,
                  318
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/15.png",
                "delay": 60,
                "origin": [
                  351,
                  308
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/16.png",
                "delay": 60,
                "origin": [
                  307,
                  315
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/17.png",
                "delay": 60,
                "origin": [
                  300,
                  317
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/18.png",
                "delay": 60,
                "origin": [
                  293,
                  292
                ]
              },
              {
                "src": "images/skills/212/2121011/effect/19.png",
                "delay": 60,
                "origin": [
                  293,
                  286
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/212/2121011/hit/0.png",
                "delay": 60,
                "origin": [
                  209,
                  179
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/1.png",
                "delay": 60,
                "origin": [
                  207,
                  211
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/2.png",
                "delay": 60,
                "origin": [
                  210,
                  211
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/3.png",
                "delay": 60,
                "origin": [
                  208,
                  211
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/4.png",
                "delay": 60,
                "origin": [
                  203,
                  202
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/5.png",
                "delay": 60,
                "origin": [
                  221,
                  208
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/6.png",
                "delay": 60,
                "origin": [
                  190,
                  189
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/7.png",
                "delay": 60,
                "origin": [
                  220,
                  182
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/8.png",
                "delay": 60,
                "origin": [
                  216,
                  156
                ]
              },
              {
                "src": "images/skills/212/2121011/hit/9.png",
                "delay": 60,
                "origin": [
                  228,
                  156
                ]
              }
            ],
            "ball": {
              "frames": [
                {
                  "src": "images/skills/212/2121011/ball/0.png",
                  "delay": 60,
                  "origin": [
                    237,
                    206
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/1.png",
                  "delay": 60,
                  "origin": [
                    237,
                    206
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/2.png",
                  "delay": 60,
                  "origin": [
                    237,
                    205
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/3.png",
                  "delay": 60,
                  "origin": [
                    237,
                    201
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/4.png",
                  "delay": 60,
                  "origin": [
                    237,
                    198
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/5.png",
                  "delay": 60,
                  "origin": [
                    237,
                    198
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/6.png",
                  "delay": 60,
                  "origin": [
                    237,
                    200
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/7.png",
                  "delay": 60,
                  "origin": [
                    237,
                    206
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/8.png",
                  "delay": 60,
                  "origin": [
                    237,
                    212
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/9.png",
                  "delay": 60,
                  "origin": [
                    237,
                    212
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/10.png",
                  "delay": 60,
                  "origin": [
                    237,
                    208
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/11.png",
                  "delay": 60,
                  "origin": [
                    237,
                    206
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/12.png",
                  "delay": 60,
                  "origin": [
                    237,
                    204
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/13.png",
                  "delay": 60,
                  "origin": [
                    237,
                    205
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/14.png",
                  "delay": 60,
                  "origin": [
                    237,
                    205
                  ]
                },
                {
                  "src": "images/skills/212/2121011/ball/15.png",
                  "delay": 60,
                  "origin": [
                    237,
                    204
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "2121052",
          "name": "藍焰斬",
          "desc": "噴射出能燒掉對方靈魂的藍色火花，並加以消滅。藍色火花會在焚燒敵人後，會再次生成到一定的次數為止。火花會優先追蹤範圍內的BOSS怪物，如果有多個BOSS怪物時，會優先追蹤最大HP數值最高的BOSS怪物。可對無視攻擊和攻擊反射狀態的敵人造成傷害。",
          "h": "消耗#mpCon MP，生成#bulletCount個藍色火花\\n每個火花將造成#damage%傷害#attackCount次，並在命中敵人後分裂，以額外再追加生成#v2個火花。包含最初生成的火花在內，最多可生成#x個火花，當火花達生成數量上限時，即不會再生成火花\\n當單一敵人被火花多次命中時，從第2個火花開始，火花的最終傷害減少#u%\\n被火花燒傷的敵人每#dotInterval秒將遭受#dot%的持續傷害，效果持續#dotTime秒\\n冷卻時間：#cooltime秒",
          "rank": "hyper",
          "type": "active",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "HY212megiddoFlame"
          ],
          "common": {
            "maxLevel": "1",
            "mpCon": "500",
            "damage": "380",
            "attackCount": "4",
            "mobCount": "1",
            "bulletCount": "3",
            "prop": "20",
            "x": "11",
            "dot": "700",
            "dotInterval": "1",
            "dotTime": "30",
            "cooltime": "50",
            "lt": "-400, -400",
            "rb": "400, 200",
            "y": "80",
            "v": "180",
            "v2": "1",
            "u2": "5000",
            "u": "55",
            "w": "1410",
            "w2": "900"
          },
          "icon": "images/skills/212/2121052.png",
          "skillBook": 212,
          "hyper": 2,
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121052/effect/0.png",
                "delay": 60,
                "origin": [
                  112,
                  85
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/1.png",
                "delay": 60,
                "origin": [
                  143,
                  281
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/2.png",
                "delay": 60,
                "origin": [
                  162,
                  311
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/3.png",
                "delay": 60,
                "origin": [
                  165,
                  327
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/4.png",
                "delay": 60,
                "origin": [
                  165,
                  331
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/5.png",
                "delay": 60,
                "origin": [
                  166,
                  335
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/6.png",
                "delay": 60,
                "origin": [
                  167,
                  335
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/7.png",
                "delay": 60,
                "origin": [
                  168,
                  336
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/8.png",
                "delay": 60,
                "origin": [
                  168,
                  336
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/9.png",
                "delay": 60,
                "origin": [
                  169,
                  336
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/10.png",
                "delay": 60,
                "origin": [
                  169,
                  337
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/11.png",
                "delay": 60,
                "origin": [
                  170,
                  337
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/12.png",
                "delay": 60,
                "origin": [
                  169,
                  337
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/13.png",
                "delay": 60,
                "origin": [
                  137,
                  336
                ]
              },
              {
                "src": "images/skills/212/2121052/effect/14.png",
                "delay": 60,
                "origin": [
                  135,
                  336
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/212/2121052/effect0/0.png",
                "delay": 60,
                "origin": [
                  247,
                  403
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/1.png",
                "delay": 60,
                "origin": [
                  254,
                  409
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/2.png",
                "delay": 60,
                "origin": [
                  266,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/3.png",
                "delay": 60,
                "origin": [
                  266,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/4.png",
                "delay": 60,
                "origin": [
                  266,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/5.png",
                "delay": 60,
                "origin": [
                  272,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/6.png",
                "delay": 60,
                "origin": [
                  266,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/7.png",
                "delay": 60,
                "origin": [
                  266,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/8.png",
                "delay": 60,
                "origin": [
                  276,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/9.png",
                "delay": 60,
                "origin": [
                  281,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/10.png",
                "delay": 60,
                "origin": [
                  282,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/11.png",
                "delay": 60,
                "origin": [
                  278,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/12.png",
                "delay": 60,
                "origin": [
                  277,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/13.png",
                "delay": 60,
                "origin": [
                  271,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/14.png",
                "delay": 60,
                "origin": [
                  266,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/15.png",
                "delay": 60,
                "origin": [
                  266,
                  423
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/16.png",
                "delay": 60,
                "origin": [
                  254,
                  409
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/17.png",
                "delay": 60,
                "origin": [
                  246,
                  403
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/18.png",
                "delay": 60,
                "origin": [
                  237,
                  396
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/19.png",
                "delay": 60,
                "origin": [
                  183,
                  354
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/20.png",
                "delay": 60,
                "origin": [
                  146,
                  332
                ]
              },
              {
                "src": "images/skills/212/2121052/effect0/21.png",
                "delay": 60,
                "origin": [
                  125,
                  327
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/212/2121052/hit/0.png",
                "delay": 60,
                "origin": [
                  107,
                  100
                ]
              },
              {
                "src": "images/skills/212/2121052/hit/1.png",
                "delay": 60,
                "origin": [
                  156,
                  154
                ]
              },
              {
                "src": "images/skills/212/2121052/hit/2.png",
                "delay": 60,
                "origin": [
                  164,
                  167
                ]
              },
              {
                "src": "images/skills/212/2121052/hit/3.png",
                "delay": 60,
                "origin": [
                  171,
                  167
                ]
              },
              {
                "src": "images/skills/212/2121052/hit/4.png",
                "delay": 60,
                "origin": [
                  173,
                  165
                ]
              },
              {
                "src": "images/skills/212/2121052/hit/5.png",
                "delay": 60,
                "origin": [
                  175,
                  153
                ]
              },
              {
                "src": "images/skills/212/2121052/hit/6.png",
                "delay": 60,
                "origin": [
                  176,
                  154
                ]
              },
              {
                "src": "images/skills/212/2121052/hit/7.png",
                "delay": 60,
                "origin": [
                  175,
                  137
                ]
              }
            ]
          }
        },
        {
          "id": "2121053",
          "name": "傳說冒險",
          "desc": "只有遊遍楓之谷世界每個角落的傳說中的冒險家才可使用的加持，可增加傷害。",
          "h": "消耗MP#mpCon，#time秒內傷害增加#indieDamR%。\\n只對隊員中的冒險家職業群產生效果\\n冷卻時間#cooltime秒",
          "rank": "hyper",
          "type": "buff",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "mpCon": "100",
            "time": "60",
            "cooltime": "120",
            "indieDamR": "10",
            "lt": "-400, -300",
            "rb": "400, 300"
          },
          "icon": "images/skills/212/2121053.png",
          "skillBook": 212,
          "hyper": 2,
          "fx": {
            "effect": [
              {
                "src": "images/skills/212/2121053/effect/0.png",
                "delay": 360,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/1.png",
                "delay": 60,
                "origin": [
                  198,
                  141
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/2.png",
                "delay": 60,
                "origin": [
                  168,
                  143
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/3.png",
                "delay": 60,
                "origin": [
                  140,
                  204
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/4.png",
                "delay": 60,
                "origin": [
                  168,
                  270
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/5.png",
                "delay": 60,
                "origin": [
                  164,
                  282
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/6.png",
                "delay": 60,
                "origin": [
                  166,
                  302
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/7.png",
                "delay": 60,
                "origin": [
                  170,
                  308
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/8.png",
                "delay": 60,
                "origin": [
                  174,
                  315
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/9.png",
                "delay": 60,
                "origin": [
                  182,
                  315
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/10.png",
                "delay": 60,
                "origin": [
                  179,
                  369
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/11.png",
                "delay": 60,
                "origin": [
                  160,
                  312
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/12.png",
                "delay": 60,
                "origin": [
                  180,
                  312
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/13.png",
                "delay": 60,
                "origin": [
                  207,
                  364
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/14.png",
                "delay": 60,
                "origin": [
                  215,
                  130
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/15.png",
                "delay": 60,
                "origin": [
                  226,
                  119
                ]
              },
              {
                "src": "images/skills/212/2121053/effect/16.png",
                "delay": 60,
                "origin": [
                  172,
                  111
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/212/2121053/effect0/0.png",
                "delay": 60,
                "origin": [
                  182,
                  286
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/1.png",
                "delay": 60,
                "origin": [
                  158,
                  265
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/2.png",
                "delay": 60,
                "origin": [
                  133,
                  247
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/3.png",
                "delay": 60,
                "origin": [
                  111,
                  234
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/4.png",
                "delay": 60,
                "origin": [
                  113,
                  239
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/5.png",
                "delay": 60,
                "origin": [
                  112,
                  258
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/6.png",
                "delay": 60,
                "origin": [
                  122,
                  275
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/7.png",
                "delay": 60,
                "origin": [
                  128,
                  294
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/8.png",
                "delay": 60,
                "origin": [
                  173,
                  368
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/9.png",
                "delay": 60,
                "origin": [
                  332,
                  446
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/10.png",
                "delay": 60,
                "origin": [
                  333,
                  444
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/11.png",
                "delay": 60,
                "origin": [
                  333,
                  437
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/12.png",
                "delay": 60,
                "origin": [
                  329,
                  429
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/13.png",
                "delay": 60,
                "origin": [
                  326,
                  426
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/14.png",
                "delay": 60,
                "origin": [
                  325,
                  415
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/15.png",
                "delay": 60,
                "origin": [
                  322,
                  415
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/16.png",
                "delay": 60,
                "origin": [
                  321,
                  419
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/17.png",
                "delay": 60,
                "origin": [
                  320,
                  419
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/18.png",
                "delay": 60,
                "origin": [
                  319,
                  419
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/19.png",
                "delay": 60,
                "origin": [
                  316,
                  411
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/20.png",
                "delay": 60,
                "origin": [
                  313,
                  420
                ]
              },
              {
                "src": "images/skills/212/2121053/effect0/21.png",
                "delay": 60,
                "origin": [
                  309,
                  365
                ]
              }
            ]
          }
        },
        {
          "id": "2121054",
          "name": "火靈結界",
          "desc": "發動附近燃燒的結界。可無視攻擊以及對反射攻擊狀態的敵人造成傷害。\\n使用技能時啟動效果，再次使用時則關閉效果的#c開關技能#",
          "h": "每秒消耗MP #mpCon，每#x秒向最多#mobCount名敵人以#damage%的傷害，攻擊#attackCount次\\n遭受攻擊的敵人會受到#dotTime秒內，每#dotInterval秒#dot%的持續傷害",
          "rank": "hyper",
          "type": "active",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 15,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "mpCon": "100",
            "damage": "400",
            "attackCount": "2",
            "mobCount": "10",
            "subTime": "3000",
            "lt": "-300, -150",
            "rb": "300, 150",
            "x": "3",
            "dot": "500",
            "dotInterval": "1",
            "dotTime": "30"
          },
          "icon": "images/skills/212/2121054.png",
          "skillBook": 212,
          "hyper": 2,
          "fx": {
            "hit": [
              {
                "src": "images/skills/212/2121054/hit/0.png",
                "delay": 60,
                "origin": [
                  59,
                  58
                ]
              },
              {
                "src": "images/skills/212/2121054/hit/1.png",
                "delay": 60,
                "origin": [
                  91,
                  94
                ]
              },
              {
                "src": "images/skills/212/2121054/hit/2.png",
                "delay": 60,
                "origin": [
                  101,
                  102
                ]
              },
              {
                "src": "images/skills/212/2121054/hit/3.png",
                "delay": 60,
                "origin": [
                  103,
                  102
                ]
              },
              {
                "src": "images/skills/212/2121054/hit/4.png",
                "delay": 60,
                "origin": [
                  102,
                  100
                ]
              },
              {
                "src": "images/skills/212/2121054/hit/5.png",
                "delay": 60,
                "origin": [
                  102,
                  93
                ]
              },
              {
                "src": "images/skills/212/2121054/hit/6.png",
                "delay": 60,
                "origin": [
                  100,
                  94
                ]
              },
              {
                "src": "images/skills/212/2121054/hit/7.png",
                "delay": 60,
                "origin": [
                  98,
                  84
                ]
              }
            ],
            "special": {
              "frames": [
                {
                  "src": "images/skills/212/2121054/special/0.png",
                  "delay": 60,
                  "origin": [
                    359,
                    111
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/1.png",
                  "delay": 60,
                  "origin": [
                    374,
                    173
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/2.png",
                  "delay": 60,
                  "origin": [
                    374,
                    173
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/3.png",
                  "delay": 60,
                  "origin": [
                    373,
                    171
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/4.png",
                  "delay": 60,
                  "origin": [
                    373,
                    171
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/5.png",
                  "delay": 60,
                  "origin": [
                    372,
                    172
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/6.png",
                  "delay": 60,
                  "origin": [
                    369,
                    172
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/7.png",
                  "delay": 60,
                  "origin": [
                    365,
                    171
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/8.png",
                  "delay": 60,
                  "origin": [
                    358,
                    171
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/9.png",
                  "delay": 60,
                  "origin": [
                    322,
                    169
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/10.png",
                  "delay": 60,
                  "origin": [
                    320,
                    167
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/11.png",
                  "delay": 60,
                  "origin": [
                    316,
                    165
                  ]
                },
                {
                  "src": "images/skills/212/2121054/special/12.png",
                  "delay": 60,
                  "origin": [
                    309,
                    90
                  ]
                }
              ],
              "repeat": 0,
              "relMove": [
                0,
                0
              ]
            },
            "special0": [
              {
                "src": "images/skills/212/2121054/special0/0.png",
                "delay": 60,
                "origin": [
                  300,
                  51
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/1.png",
                "delay": 60,
                "origin": [
                  349,
                  214
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/2.png",
                "delay": 60,
                "origin": [
                  399,
                  238
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/3.png",
                "delay": 60,
                "origin": [
                  402,
                  248
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/4.png",
                "delay": 60,
                "origin": [
                  416,
                  252
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/5.png",
                "delay": 60,
                "origin": [
                  422,
                  254
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/6.png",
                "delay": 60,
                "origin": [
                  424,
                  254
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/7.png",
                "delay": 60,
                "origin": [
                  424,
                  252
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/8.png",
                "delay": 60,
                "origin": [
                  424,
                  246
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/9.png",
                "delay": 60,
                "origin": [
                  422,
                  234
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/10.png",
                "delay": 60,
                "origin": [
                  378,
                  224
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/11.png",
                "delay": 60,
                "origin": [
                  365,
                  224
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/12.png",
                "delay": 60,
                "origin": [
                  293,
                  220
                ]
              },
              {
                "src": "images/skills/212/2121054/special0/13.png",
                "delay": 60,
                "origin": [
                  277,
                  187
                ]
              }
            ]
          }
        }
      ]
    },
    "220": {
      "jobId": 220,
      "name": "冰雷巫師",
      "rank": "30",
      "skillBook": 220,
      "skills": [
        {
          "id": "2200000",
          "name": "魔力吸收",
          "desc": "魔法攻擊時，以一定機率吸收對方的MP。對Boss怪物時吸收效率會變差，吸收的量更少。",
          "h": "魔法攻擊時，以#prop%機率吸收最大MP的#x%\\nBOSS怪物則是吸收最大MP的#y%",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 9,
          "infoType": 51,
          "actions": [],
          "common": {
            "maxLevel": "9",
            "prop": "3*x+3",
            "x": "d(x/2)+1",
            "y": "d(x/3)"
          },
          "icon": "images/skills/220/2200000.png",
          "skillBook": 220,
          "fx": {
            "effect": [
              {
                "src": "images/skills/220/2200000/effect/0.png",
                "delay": 90,
                "origin": [
                  30,
                  21
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/1.png",
                "delay": 90,
                "origin": [
                  30,
                  45
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/2.png",
                "delay": 90,
                "origin": [
                  30,
                  47
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/3.png",
                "delay": 90,
                "origin": [
                  -7,
                  47
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/4.png",
                "delay": 90,
                "origin": [
                  8,
                  47
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/5.png",
                "delay": 90,
                "origin": [
                  40,
                  46
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/6.png",
                "delay": 90,
                "origin": [
                  45,
                  46
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/7.png",
                "delay": 90,
                "origin": [
                  45,
                  43
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/8.png",
                "delay": 90,
                "origin": [
                  37,
                  36
                ]
              },
              {
                "src": "images/skills/220/2200000/effect/9.png",
                "delay": 90,
                "origin": [
                  4,
                  16
                ]
              }
            ]
          }
        },
        {
          "id": "2200006",
          "name": "咒語精通",
          "desc": "增加魔法熟練度、魔力、爆擊機率。",
          "h": "魔法熟練度增加#mastery%，魔力增加#x，爆擊機率增加#cr%",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "mastery": "10+4*x",
            "x": "3*x",
            "cr": "u(x/2)"
          },
          "icon": "images/skills/220/2200006.png",
          "skillBook": 220
        },
        {
          "id": "2200007",
          "name": "智慧昇華",
          "desc": "透過精神修養，永久增強智力",
          "h": "永久增強#intX智力",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 5,
          "infoType": 50,
          "actions": [],
          "common": {
            "intX": "8*x",
            "maxLevel": "5"
          },
          "icon": "images/skills/220/2200007.png",
          "skillBook": 220
        },
        {
          "id": "2200012",
          "name": "極速詠唱",
          "desc": "提升攻擊速度和智力。",
          "h": "攻擊速度增加2階段，智力增加#intX",
          "rank": "30",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "intX": "2*x",
            "actionSpeed": "-2"
          },
          "icon": "images/skills/220/2200012.png",
          "skillBook": 220
        },
        {
          "id": "2201001",
          "name": "精神強化",
          "desc": "透過短暫的冥想，開啟內在的專注力，暫時增加所有隊員的魔力。",
          "h": "消耗MP #mpCon，連續#time秒內，隊員的魔力增加#indieMad",
          "rank": "30",
          "type": "buff",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [
            "alert2"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "10+d(x/3)",
            "time": "40+10*x",
            "indieMad": "10+x",
            "lt": "-300, -200",
            "rb": "300, 200"
          },
          "icon": "images/skills/220/2201001.png",
          "skillBook": 220,
          "fx": {
            "effect": [
              {
                "src": "images/skills/220/2201001/effect/0.png",
                "delay": 60,
                "origin": [
                  62,
                  81
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/1.png",
                "delay": 60,
                "origin": [
                  62,
                  81
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/2.png",
                "delay": 60,
                "origin": [
                  61,
                  51
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/3.png",
                "delay": 60,
                "origin": [
                  200,
                  276
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/4.png",
                "delay": 60,
                "origin": [
                  213,
                  246
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/5.png",
                "delay": 60,
                "origin": [
                  213,
                  254
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/6.png",
                "delay": 60,
                "origin": [
                  213,
                  254
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/7.png",
                "delay": 60,
                "origin": [
                  213,
                  254
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/8.png",
                "delay": 60,
                "origin": [
                  213,
                  254
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/9.png",
                "delay": 60,
                "origin": [
                  213,
                  254
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/10.png",
                "delay": 60,
                "origin": [
                  213,
                  254
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/11.png",
                "delay": 60,
                "origin": [
                  213,
                  246
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/12.png",
                "delay": 60,
                "origin": [
                  213,
                  236
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/13.png",
                "delay": 60,
                "origin": [
                  175,
                  224
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/14.png",
                "delay": 60,
                "origin": [
                  172,
                  215
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/15.png",
                "delay": 60,
                "origin": [
                  165,
                  217
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/16.png",
                "delay": 60,
                "origin": [
                  144,
                  218
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/17.png",
                "delay": 60,
                "origin": [
                  131,
                  219
                ]
              },
              {
                "src": "images/skills/220/2201001/effect/18.png",
                "delay": 60,
                "origin": [
                  117,
                  219
                ]
              }
            ]
          }
        },
        {
          "id": "2201005",
          "name": "電閃雷鳴",
          "desc": "在自身的周圍創造出強力的磁器場，對最多6名敵人落下閃電。閃電屬性的攻擊。",
          "h": "消耗MP#mpCon，對最多#mobCount個敵人造成#damage%傷害#attackCount次",
          "rank": "30",
          "type": "active",
          "equipable": true,
          "maxLevel": 10,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "thunderBolt"
          ],
          "common": {
            "maxLevel": "10",
            "mpCon": "20+5*d(x/4)",
            "damage": "130+8*x",
            "attackCount": "3",
            "mobCount": "6",
            "lt": "-250, -50",
            "rb": "250, 50"
          },
          "icon": "images/skills/220/2201005.png",
          "skillBook": 220,
          "fx": {
            "effect": [
              {
                "src": "images/skills/220/2201005/effect/0.png",
                "delay": 60,
                "origin": [
                  90,
                  125
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/1.png",
                "delay": 60,
                "origin": [
                  90,
                  148
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/2.png",
                "delay": 60,
                "origin": [
                  91,
                  166
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/3.png",
                "delay": 60,
                "origin": [
                  89,
                  175
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/4.png",
                "delay": 60,
                "origin": [
                  88,
                  174
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/5.png",
                "delay": 60,
                "origin": [
                  90,
                  178
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/6.png",
                "delay": 60,
                "origin": [
                  213,
                  178
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/7.png",
                "delay": 60,
                "origin": [
                  212,
                  176
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/8.png",
                "delay": 60,
                "origin": [
                  225,
                  175
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/9.png",
                "delay": 60,
                "origin": [
                  205,
                  153
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/10.png",
                "delay": 60,
                "origin": [
                  205,
                  153
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/11.png",
                "delay": 60,
                "origin": [
                  200,
                  153
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/12.png",
                "delay": 60,
                "origin": [
                  197,
                  151
                ]
              },
              {
                "src": "images/skills/220/2201005/effect/13.png",
                "delay": 60,
                "origin": [
                  113,
                  149
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/220/2201005/hit/0.png",
                "delay": 60,
                "origin": [
                  42,
                  275
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/1.png",
                "delay": 60,
                "origin": [
                  83,
                  251
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/2.png",
                "delay": 60,
                "origin": [
                  88,
                  251
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/3.png",
                "delay": 60,
                "origin": [
                  69,
                  251
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/4.png",
                "delay": 60,
                "origin": [
                  69,
                  251
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/5.png",
                "delay": 60,
                "origin": [
                  70,
                  259
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/6.png",
                "delay": 60,
                "origin": [
                  71,
                  251
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/7.png",
                "delay": 60,
                "origin": [
                  71,
                  250
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/8.png",
                "delay": 60,
                "origin": [
                  59,
                  240
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/9.png",
                "delay": 60,
                "origin": [
                  48,
                  174
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/10.png",
                "delay": 60,
                "origin": [
                  44,
                  173
                ]
              },
              {
                "src": "images/skills/220/2201005/hit/11.png",
                "delay": 60,
                "origin": [
                  42,
                  159
                ]
              }
            ]
          }
        },
        {
          "id": "2201008",
          "name": "冰錐劍",
          "desc": "從前方冒出尖銳的冰水晶。被攻擊命中的敵人將陷入冰凍狀態，其移動速度亦將受其影響而下降。此外，該攻擊可對火屬性敵人造成強力傷害。冰屬性的攻擊。",
          "h": "消耗MP#mpCon，對最多#mobCount名敵人以#damage%傷害進行#attackCount次攻擊，冰凍#time秒。",
          "rank": "30",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 1,
          "projectile": true,
          "actions": [
            "coldBeam"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "12+3*d(x/4)",
            "damage": "99+5*x",
            "attackCount": "3",
            "mobCount": "6",
            "s": "-15",
            "v": "-75",
            "time": "8",
            "lt": "-305, -310",
            "rb": "-65, 10"
          },
          "icon": "images/skills/220/2201008.png",
          "skillBook": 220,
          "fx": {
            "effect": [
              {
                "src": "images/skills/220/2201008/effect/0.png",
                "delay": 60,
                "origin": [
                  134,
                  99
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/1.png",
                "delay": 60,
                "origin": [
                  123,
                  100
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/2.png",
                "delay": 60,
                "origin": [
                  114,
                  94
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/3.png",
                "delay": 60,
                "origin": [
                  105,
                  83
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/4.png",
                "delay": 60,
                "origin": [
                  80,
                  65
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/5.png",
                "delay": 60,
                "origin": [
                  73,
                  103
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/6.png",
                "delay": 60,
                "origin": [
                  103,
                  152
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/7.png",
                "delay": 60,
                "origin": [
                  102,
                  151
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/8.png",
                "delay": 60,
                "origin": [
                  102,
                  151
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/9.png",
                "delay": 60,
                "origin": [
                  101,
                  150
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/10.png",
                "delay": 60,
                "origin": [
                  77,
                  124
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/11.png",
                "delay": 60,
                "origin": [
                  79,
                  126
                ]
              },
              {
                "src": "images/skills/220/2201008/effect/12.png",
                "delay": 60,
                "origin": [
                  80,
                  127
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/220/2201008/effect0/0.png",
                "delay": 60,
                "origin": [
                  368,
                  26
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/1.png",
                "delay": 60,
                "origin": [
                  370,
                  28
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/2.png",
                "delay": 60,
                "origin": [
                  368,
                  32
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/3.png",
                "delay": 60,
                "origin": [
                  370,
                  36
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/4.png",
                "delay": 60,
                "origin": [
                  368,
                  40
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/5.png",
                "delay": 60,
                "origin": [
                  370,
                  40
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/6.png",
                "delay": 60,
                "origin": [
                  384,
                  344
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/7.png",
                "delay": 60,
                "origin": [
                  390,
                  347
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/8.png",
                "delay": 60,
                "origin": [
                  391,
                  339
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/9.png",
                "delay": 60,
                "origin": [
                  403,
                  346
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/10.png",
                "delay": 60,
                "origin": [
                  412,
                  357
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/11.png",
                "delay": 60,
                "origin": [
                  414,
                  364
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/12.png",
                "delay": 60,
                "origin": [
                  420,
                  368
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/13.png",
                "delay": 60,
                "origin": [
                  421,
                  374
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/14.png",
                "delay": 60,
                "origin": [
                  403,
                  378
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/15.png",
                "delay": 60,
                "origin": [
                  403,
                  363
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/16.png",
                "delay": 60,
                "origin": [
                  403,
                  369
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/17.png",
                "delay": 60,
                "origin": [
                  402,
                  369
                ]
              },
              {
                "src": "images/skills/220/2201008/effect0/18.png",
                "delay": 60,
                "origin": [
                  402,
                  369
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/220/2201008/hit/0.png",
                "delay": 60,
                "origin": [
                  73,
                  96
                ]
              },
              {
                "src": "images/skills/220/2201008/hit/1.png",
                "delay": 60,
                "origin": [
                  96,
                  109
                ]
              },
              {
                "src": "images/skills/220/2201008/hit/2.png",
                "delay": 60,
                "origin": [
                  99,
                  110
                ]
              },
              {
                "src": "images/skills/220/2201008/hit/3.png",
                "delay": 60,
                "origin": [
                  97,
                  114
                ]
              },
              {
                "src": "images/skills/220/2201008/hit/4.png",
                "delay": 60,
                "origin": [
                  78,
                  114
                ]
              },
              {
                "src": "images/skills/220/2201008/hit/5.png",
                "delay": 60,
                "origin": [
                  78,
                  71
                ]
              }
            ]
          }
        },
        {
          "id": "2201009",
          "name": "冰雪結界",
          "desc": "對隊員施放由不碎寒氣環繞的光團。\\n使用技能時效果會啟用，再次使用時會關閉的#c開關技能#",
          "h": "每秒消耗#mpCon MP，使包含自身在內的周圍隊員狀態異常抗性增加#z、所有屬性抗性增加#w%\\n所受傷害減少#y%\\n每隔一定週期可對最多#mobCount名敵人疊加冰凍狀態",
          "rank": "30",
          "type": "buff",
          "equipable": true,
          "maxLevel": 10,
          "infoType": 15,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "mpCon": "60",
            "y": "2*x",
            "z": "2*x",
            "w": "2*x",
            "lt": "-350, -200",
            "rb": "350, 150",
            "s": "-15",
            "v": "-75",
            "time": "8",
            "mobCount": "15"
          },
          "icon": "images/skills/220/2201009.png",
          "skillBook": 220,
          "fx": {
            "effect": [
              {
                "src": "images/skills/220/2201009/effect/0.png",
                "delay": 60,
                "origin": [
                  80,
                  216
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/1.png",
                "delay": 60,
                "origin": [
                  171,
                  310
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/2.png",
                "delay": 60,
                "origin": [
                  187,
                  310
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/3.png",
                "delay": 60,
                "origin": [
                  188,
                  308
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/4.png",
                "delay": 60,
                "origin": [
                  182,
                  303
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/5.png",
                "delay": 60,
                "origin": [
                  182,
                  301
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/6.png",
                "delay": 60,
                "origin": [
                  180,
                  301
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/7.png",
                "delay": 60,
                "origin": [
                  177,
                  301
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/8.png",
                "delay": 60,
                "origin": [
                  181,
                  302
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/9.png",
                "delay": 60,
                "origin": [
                  181,
                  304
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/10.png",
                "delay": 60,
                "origin": [
                  182,
                  304
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/11.png",
                "delay": 60,
                "origin": [
                  171,
                  306
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/12.png",
                "delay": 60,
                "origin": [
                  171,
                  307
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/13.png",
                "delay": 60,
                "origin": [
                  171,
                  304
                ]
              },
              {
                "src": "images/skills/220/2201009/effect/14.png",
                "delay": 60,
                "origin": [
                  171,
                  302
                ]
              }
            ]
          }
        }
      ]
    },
    "221": {
      "jobId": 221,
      "name": "冰雷魔導士",
      "rank": "60",
      "skillBook": 221,
      "skills": [
        {
          "id": "2210001",
          "name": "魔力激發",
          "desc": "消耗更大量的MP，然而所有攻擊魔法的傷害增加威力。",
          "h": "增加消耗MP #costmpR%，增加攻擊魔法的傷害#damR%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "costmpR": "5*x",
            "damR": "5*x"
          },
          "icon": "images/skills/221/2210001.png",
          "skillBook": 221
        },
        {
          "id": "2210009",
          "name": "魔法爆擊",
          "desc": "永久性的增加爆擊機率及爆擊傷害。",
          "h": "增加爆擊機率#cr%、爆擊傷害#criticaldamage%。",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "cr": "10+2*x",
            "criticaldamage": "5+x"
          },
          "icon": "images/skills/221/2210009.png",
          "skillBook": 221
        },
        {
          "id": "2210013",
          "name": "結凍粉碎",
          "desc": "攻擊結冰狀態的敵人時，以一定機率的一定比例無視敵人的防禦。",
          "h": "攻擊結冰狀態的敵人時，每次重疊結冰有#subProp%的機率無視防禦力#prop%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 4,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "4",
            "prop": "2",
            "subProp": "25*x"
          },
          "icon": "images/skills/221/2210013.png",
          "skillBook": 221
        },
        {
          "id": "2210016",
          "name": "自然力重置",
          "desc": "減少所有自身使用的攻擊魔法屬性耐性。額外永久增加最終傷害。",
          "h": "攻擊耐性減少#u%，最終傷害增加#mdR%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 9,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "9",
            "x": "-x-1",
            "mdR": "4*x+4",
            "u": "x+1"
          },
          "icon": "images/skills/221/2210016.png",
          "skillBook": 221
        },
        {
          "id": "2211002",
          "name": "冰風暴",
          "desc": "對自身周圍引起暴風雪，並同時攻擊多數的敵人。冰屬性的攻擊。",
          "h": "消耗MP #mpCon，對最多 #mobCount個敵人以#damage%傷害攻擊#attackCount次，#time秒內 結冰",
          "rank": "60",
          "type": "active",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "iceStrike"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "50+10*d(x/5)",
            "damage": "175+8*x",
            "mobCount": "8",
            "attackCount": "4",
            "time": "8",
            "s": "-15",
            "v": "-75",
            "lt": "-250, -150",
            "rb": "250, 150"
          },
          "icon": "images/skills/221/2211002.png",
          "skillBook": 221,
          "fx": {
            "effect": [
              {
                "src": "images/skills/221/2211002/effect/0.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/1.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/2.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/3.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/4.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/5.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/6.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/7.png",
                "delay": 60,
                "origin": [
                  378,
                  315
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/8.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/9.png",
                "delay": 60,
                "origin": [
                  379,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/10.png",
                "delay": 60,
                "origin": [
                  387,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/11.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/12.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/13.png",
                "delay": 60,
                "origin": [
                  378,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/14.png",
                "delay": 60,
                "origin": [
                  341,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/15.png",
                "delay": 60,
                "origin": [
                  341,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/16.png",
                "delay": 60,
                "origin": [
                  339,
                  312
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/17.png",
                "delay": 60,
                "origin": [
                  288,
                  285
                ]
              },
              {
                "src": "images/skills/221/2211002/effect/18.png",
                "delay": 60,
                "origin": [
                  275,
                  280
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/221/2211002/effect0/0.png",
                "delay": 60,
                "origin": [
                  202,
                  178
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/1.png",
                "delay": 60,
                "origin": [
                  212,
                  180
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/2.png",
                "delay": 60,
                "origin": [
                  237,
                  208
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/3.png",
                "delay": 60,
                "origin": [
                  231,
                  210
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/4.png",
                "delay": 60,
                "origin": [
                  231,
                  219
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/5.png",
                "delay": 60,
                "origin": [
                  231,
                  213
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/6.png",
                "delay": 60,
                "origin": [
                  231,
                  210
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/7.png",
                "delay": 60,
                "origin": [
                  229,
                  207
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/8.png",
                "delay": 60,
                "origin": [
                  229,
                  207
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/9.png",
                "delay": 60,
                "origin": [
                  230,
                  208
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/10.png",
                "delay": 60,
                "origin": [
                  209,
                  194
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/11.png",
                "delay": 60,
                "origin": [
                  189,
                  178
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/12.png",
                "delay": 60,
                "origin": [
                  110,
                  150
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/13.png",
                "delay": 60,
                "origin": [
                  92,
                  132
                ]
              },
              {
                "src": "images/skills/221/2211002/effect0/14.png",
                "delay": 60,
                "origin": [
                  47,
                  86
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/221/2211002/hit/0.png",
                "delay": 60,
                "origin": [
                  105,
                  101
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/1.png",
                "delay": 60,
                "origin": [
                  124,
                  100
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/2.png",
                "delay": 60,
                "origin": [
                  107,
                  85
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/3.png",
                "delay": 60,
                "origin": [
                  99,
                  82
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/4.png",
                "delay": 60,
                "origin": [
                  101,
                  88
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/5.png",
                "delay": 60,
                "origin": [
                  100,
                  90
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/6.png",
                "delay": 60,
                "origin": [
                  99,
                  91
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/7.png",
                "delay": 60,
                "origin": [
                  98,
                  91
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/8.png",
                "delay": 60,
                "origin": [
                  88,
                  91
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/9.png",
                "delay": 60,
                "origin": [
                  92,
                  51
                ]
              },
              {
                "src": "images/skills/221/2211002/hit/10.png",
                "delay": 60,
                "origin": [
                  56,
                  50
                ]
              }
            ]
          }
        },
        {
          "id": "2211007",
          "name": "瞬間移動精通",
          "desc": "技能啟用時，雖然會額外消耗MP，但能讓瞬間移動地點的敵人們受到傷害並套用暈眩效果。額外永久增加格擋。\\n使用技能時效果會啟用，再次使用時會關閉的#c開關技能#",
          "h": "額外消耗#yMP，最多對#mobCount名敵人造成#damage%傷害，以#subProp%的機率炫#time秒\\n[被動效果:格擋增加#stanceProp%",
          "rank": "60",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 16,
          "actions": [
            "alert2"
          ],
          "common": {
            "maxLevel": "10",
            "prop": "100",
            "subProp": "30+5*x",
            "y": "2*x",
            "damage": "240+10*x",
            "time": "2+d(x/5)",
            "mobCount": "6",
            "lt": "-120, -100",
            "rb": "120, 10",
            "stanceProp": "4*x"
          },
          "icon": "images/skills/221/2211007.png",
          "skillBook": 221,
          "fx": {
            "effect": [
              {
                "src": "images/skills/221/2211007/effect/0.png",
                "delay": 90,
                "origin": [
                  61,
                  71
                ]
              },
              {
                "src": "images/skills/221/2211007/effect/1.png",
                "delay": 90,
                "origin": [
                  74,
                  146
                ]
              },
              {
                "src": "images/skills/221/2211007/effect/2.png",
                "delay": 90,
                "origin": [
                  76,
                  143
                ]
              },
              {
                "src": "images/skills/221/2211007/effect/3.png",
                "delay": 90,
                "origin": [
                  77,
                  131
                ]
              },
              {
                "src": "images/skills/221/2211007/effect/4.png",
                "delay": 90,
                "origin": [
                  90,
                  154
                ]
              },
              {
                "src": "images/skills/221/2211007/effect/5.png",
                "delay": 90,
                "origin": [
                  85,
                  145
                ]
              },
              {
                "src": "images/skills/221/2211007/effect/6.png",
                "delay": 90,
                "origin": [
                  79,
                  148
                ]
              },
              {
                "src": "images/skills/221/2211007/effect/7.png",
                "delay": 90,
                "origin": [
                  83,
                  147
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/221/2211007/effect0/0.png",
                "delay": 90,
                "origin": [
                  102,
                  252
                ]
              },
              {
                "src": "images/skills/221/2211007/effect0/1.png",
                "delay": 90,
                "origin": [
                  111,
                  252
                ]
              },
              {
                "src": "images/skills/221/2211007/effect0/2.png",
                "delay": 90,
                "origin": [
                  112,
                  252
                ]
              },
              {
                "src": "images/skills/221/2211007/effect0/3.png",
                "delay": 90,
                "origin": [
                  108,
                  252
                ]
              },
              {
                "src": "images/skills/221/2211007/effect0/4.png",
                "delay": 90,
                "origin": [
                  107,
                  196
                ]
              },
              {
                "src": "images/skills/221/2211007/effect0/5.png",
                "delay": 90,
                "origin": [
                  100,
                  182
                ]
              },
              {
                "src": "images/skills/221/2211007/effect0/6.png",
                "delay": 90,
                "origin": [
                  95,
                  176
                ]
              },
              {
                "src": "images/skills/221/2211007/effect0/7.png",
                "delay": 90,
                "origin": [
                  83,
                  156
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/221/2211007/hit/0.png",
                "delay": 90,
                "origin": [
                  54,
                  51
                ]
              },
              {
                "src": "images/skills/221/2211007/hit/1.png",
                "delay": 90,
                "origin": [
                  69,
                  55
                ]
              },
              {
                "src": "images/skills/221/2211007/hit/2.png",
                "delay": 90,
                "origin": [
                  58,
                  56
                ]
              },
              {
                "src": "images/skills/221/2211007/hit/3.png",
                "delay": 90,
                "origin": [
                  81,
                  58
                ]
              },
              {
                "src": "images/skills/221/2211007/hit/4.png",
                "delay": 90,
                "origin": [
                  77,
                  58
                ]
              },
              {
                "src": "images/skills/221/2211007/hit/5.png",
                "delay": 90,
                "origin": [
                  75,
                  56
                ]
              }
            ]
          }
        },
        {
          "id": "2211011",
          "name": "閃電球",
          "desc": "召喚由閃電凝聚而成的球體。球體會對周圍的敵人發射高壓電流，並以閃電屬性發動攻擊。和「「下」方向鍵」一起再次使用技能時，可讓球體固定在原處。被固定在原處的球體會在一段時間後，攻擊更大範圍內的敵人。球體的攻擊不會減少凍結的重疊。\\n使用指令時可不輸入方向鍵僅以技能鍵固定球體。\\n球體固定時無法登錄技能連續施放序列。\\n#c指令開關：滑鼠右鍵#",
          "h": "消耗MP#mpCon，召喚出可持續#time的閃電球體，閃電球體最多可對#mobCount名敵人受到#damage%的傷害，並攻擊#attackCount次\\n#c和「下」方向鍵一起再次使用時，可讓球體固定在原處 #y秒，對最多#s名敵人以#w%的傷害攻擊#q次\\n攻擊一般怪物時，傷害增加#u2%p\\n",
          "rank": "60",
          "type": "buff",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 33,
          "actions": [
            "thunderStorm"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "25+3*d(x/2)",
            "damage": "196+5*x",
            "time": "60+3*x",
            "speed": "8",
            "x": "300",
            "u": "0",
            "v": "-155",
            "subTime": "1080",
            "y": "20+2*x",
            "w": "196+5*x",
            "s": "6",
            "q": "3",
            "q2": "30",
            "mobCount": "6",
            "attackCount": "3",
            "u2": "70+5*x"
          },
          "icon": "images/skills/221/2211011.png",
          "skillBook": 221,
          "fx": {
            "effect": [
              {
                "src": "images/skills/221/2211011/effect/0.png",
                "delay": 60,
                "origin": [
                  74,
                  94
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/1.png",
                "delay": 60,
                "origin": [
                  75,
                  97
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/2.png",
                "delay": 60,
                "origin": [
                  76,
                  96
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/3.png",
                "delay": 60,
                "origin": [
                  78,
                  96
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/4.png",
                "delay": 60,
                "origin": [
                  77,
                  94
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/5.png",
                "delay": 60,
                "origin": [
                  74,
                  96
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/6.png",
                "delay": 60,
                "origin": [
                  75,
                  97
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/7.png",
                "delay": 60,
                "origin": [
                  75,
                  96
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/8.png",
                "delay": 60,
                "origin": [
                  73,
                  94
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/9.png",
                "delay": 60,
                "origin": [
                  79,
                  91
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/10.png",
                "delay": 60,
                "origin": [
                  79,
                  90
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/11.png",
                "delay": 60,
                "origin": [
                  94,
                  175
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/12.png",
                "delay": 60,
                "origin": [
                  94,
                  175
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/13.png",
                "delay": 60,
                "origin": [
                  90,
                  171
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/14.png",
                "delay": 60,
                "origin": [
                  87,
                  170
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/15.png",
                "delay": 60,
                "origin": [
                  81,
                  178
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/16.png",
                "delay": 60,
                "origin": [
                  81,
                  182
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/17.png",
                "delay": 60,
                "origin": [
                  82,
                  186
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/18.png",
                "delay": 60,
                "origin": [
                  83,
                  190
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/19.png",
                "delay": 60,
                "origin": [
                  84,
                  194
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/20.png",
                "delay": 60,
                "origin": [
                  84,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211011/effect/21.png",
                "delay": 60,
                "origin": [
                  85,
                  203
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/221/2211011/effect0/0.png",
                "delay": 60,
                "origin": [
                  48,
                  14
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/1.png",
                "delay": 60,
                "origin": [
                  49,
                  15
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/2.png",
                "delay": 60,
                "origin": [
                  49,
                  15
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/3.png",
                "delay": 60,
                "origin": [
                  49,
                  15
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/4.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/5.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/6.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/7.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/8.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/9.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/10.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/11.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/12.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/13.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/14.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/15.png",
                "delay": 60,
                "origin": [
                  50,
                  16
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/16.png",
                "delay": 60,
                "origin": [
                  49,
                  15
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/17.png",
                "delay": 60,
                "origin": [
                  49,
                  15
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/18.png",
                "delay": 60,
                "origin": [
                  46,
                  15
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/19.png",
                "delay": 60,
                "origin": [
                  46,
                  14
                ]
              },
              {
                "src": "images/skills/221/2211011/effect0/20.png",
                "delay": 60,
                "origin": [
                  45,
                  13
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/221/2211011/hit/0.png",
                "delay": 60,
                "origin": [
                  76,
                  71
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/1.png",
                "delay": 60,
                "origin": [
                  117,
                  111
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/2.png",
                "delay": 60,
                "origin": [
                  120,
                  123
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/3.png",
                "delay": 60,
                "origin": [
                  120,
                  121
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/4.png",
                "delay": 60,
                "origin": [
                  118,
                  113
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/5.png",
                "delay": 60,
                "origin": [
                  120,
                  113
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/6.png",
                "delay": 60,
                "origin": [
                  122,
                  113
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/7.png",
                "delay": 60,
                "origin": [
                  96,
                  87
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/8.png",
                "delay": 60,
                "origin": [
                  139,
                  106
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/9.png",
                "delay": 60,
                "origin": [
                  141,
                  109
                ]
              },
              {
                "src": "images/skills/221/2211011/hit/10.png",
                "delay": 60,
                "origin": [
                  150,
                  112
                ]
              }
            ],
            "ball": {
              "layers": [
                {
                  "name": "0",
                  "frames": [
                    {
                      "src": "images/skills/221/2211011/ball/0/0.png",
                      "delay": 60,
                      "origin": [
                        357,
                        73
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/1.png",
                      "delay": 60,
                      "origin": [
                        347,
                        130
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/2.png",
                      "delay": 60,
                      "origin": [
                        346,
                        130
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/3.png",
                      "delay": 60,
                      "origin": [
                        343,
                        116
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/4.png",
                      "delay": 60,
                      "origin": [
                        342,
                        116
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/5.png",
                      "delay": 60,
                      "origin": [
                        337,
                        116
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/6.png",
                      "delay": 60,
                      "origin": [
                        333,
                        116
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/7.png",
                      "delay": 60,
                      "origin": [
                        328,
                        107
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/8.png",
                      "delay": 60,
                      "origin": [
                        325,
                        107
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/9.png",
                      "delay": 60,
                      "origin": [
                        318,
                        101
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/10.png",
                      "delay": 60,
                      "origin": [
                        307,
                        93
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/0/11.png",
                      "delay": 60,
                      "origin": [
                        217,
                        55
                      ]
                    }
                  ]
                },
                {
                  "name": "1",
                  "frames": [
                    {
                      "src": "images/skills/221/2211011/ball/1/0.png",
                      "delay": 60,
                      "origin": [
                        362,
                        33
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/1.png",
                      "delay": 60,
                      "origin": [
                        362,
                        130
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/2.png",
                      "delay": 60,
                      "origin": [
                        362,
                        130
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/3.png",
                      "delay": 60,
                      "origin": [
                        362,
                        117
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/4.png",
                      "delay": 60,
                      "origin": [
                        355,
                        117
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/5.png",
                      "delay": 60,
                      "origin": [
                        347,
                        117
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/6.png",
                      "delay": 60,
                      "origin": [
                        346,
                        117
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/7.png",
                      "delay": 60,
                      "origin": [
                        342,
                        108
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/8.png",
                      "delay": 60,
                      "origin": [
                        336,
                        108
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/9.png",
                      "delay": 60,
                      "origin": [
                        331,
                        102
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/10.png",
                      "delay": 60,
                      "origin": [
                        323,
                        94
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/1/11.png",
                      "delay": 60,
                      "origin": [
                        309,
                        78
                      ]
                    }
                  ]
                },
                {
                  "name": "2",
                  "frames": [
                    {
                      "src": "images/skills/221/2211011/ball/2/0.png",
                      "delay": 60,
                      "origin": [
                        362,
                        73
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/1.png",
                      "delay": 60,
                      "origin": [
                        362,
                        134
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/2.png",
                      "delay": 60,
                      "origin": [
                        362,
                        146
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/3.png",
                      "delay": 60,
                      "origin": [
                        362,
                        136
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/4.png",
                      "delay": 60,
                      "origin": [
                        362,
                        131
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/5.png",
                      "delay": 60,
                      "origin": [
                        362,
                        127
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/6.png",
                      "delay": 60,
                      "origin": [
                        362,
                        118
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/7.png",
                      "delay": 60,
                      "origin": [
                        362,
                        106
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/8.png",
                      "delay": 60,
                      "origin": [
                        362,
                        106
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/9.png",
                      "delay": 60,
                      "origin": [
                        361,
                        100
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/10.png",
                      "delay": 60,
                      "origin": [
                        357,
                        92
                      ]
                    },
                    {
                      "src": "images/skills/221/2211011/ball/2/11.png",
                      "delay": 60,
                      "origin": [
                        352,
                        67
                      ]
                    }
                  ]
                }
              ]
            },
            "summonAttacks": [
              {
                "name": "attack1",
                "frames": [
                  {
                    "src": "images/skills/221/2211011/summon/attack1/0.png",
                    "delay": 60,
                    "origin": [
                      177,
                      285
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/1.png",
                    "delay": 60,
                    "origin": [
                      200,
                      303
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/2.png",
                    "delay": 60,
                    "origin": [
                      197,
                      301
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/3.png",
                    "delay": 60,
                    "origin": [
                      177,
                      297
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/4.png",
                    "delay": 60,
                    "origin": [
                      177,
                      291
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/5.png",
                    "delay": 60,
                    "origin": [
                      177,
                      285
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/6.png",
                    "delay": 60,
                    "origin": [
                      177,
                      281
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/7.png",
                    "delay": 60,
                    "origin": [
                      177,
                      284
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/8.png",
                    "delay": 60,
                    "origin": [
                      177,
                      278
                    ]
                  },
                  {
                    "src": "images/skills/221/2211011/summon/attack1/9.png",
                    "delay": 60,
                    "origin": [
                      177,
                      281
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "3"
              }
            ],
            "summonVisual": {
              "summoned": [
                {
                  "src": "images/skills/221/2211011/summon/summoned/0.png",
                  "delay": 60,
                  "origin": [
                    0,
                    0
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/1.png",
                  "delay": 60,
                  "origin": [
                    0,
                    0
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/2.png",
                  "delay": 60,
                  "origin": [
                    75,
                    185
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/3.png",
                  "delay": 60,
                  "origin": [
                    76,
                    139
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/4.png",
                  "delay": 60,
                  "origin": [
                    113,
                    186
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/5.png",
                  "delay": 60,
                  "origin": [
                    116,
                    186
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/6.png",
                  "delay": 60,
                  "origin": [
                    115,
                    186
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/7.png",
                  "delay": 60,
                  "origin": [
                    114,
                    184
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/8.png",
                  "delay": 60,
                  "origin": [
                    84,
                    151
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/9.png",
                  "delay": 60,
                  "origin": [
                    104,
                    177
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/10.png",
                  "delay": 60,
                  "origin": [
                    100,
                    172
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/11.png",
                  "delay": 60,
                  "origin": [
                    190,
                    340
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/12.png",
                  "delay": 60,
                  "origin": [
                    186,
                    337
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/13.png",
                  "delay": 60,
                  "origin": [
                    204,
                    340
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/14.png",
                  "delay": 60,
                  "origin": [
                    217,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/15.png",
                  "delay": 60,
                  "origin": [
                    223,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/16.png",
                  "delay": 60,
                  "origin": [
                    227,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/17.png",
                  "delay": 60,
                  "origin": [
                    231,
                    359
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/18.png",
                  "delay": 60,
                  "origin": [
                    234,
                    358
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/19.png",
                  "delay": 60,
                  "origin": [
                    236,
                    357
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/20.png",
                  "delay": 60,
                  "origin": [
                    238,
                    357
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/21.png",
                  "delay": 60,
                  "origin": [
                    239,
                    356
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/22.png",
                  "delay": 60,
                  "origin": [
                    177,
                    306
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/summoned/23.png",
                  "delay": 60,
                  "origin": [
                    177,
                    301
                  ]
                }
              ],
              "stand": [
                {
                  "src": "images/skills/221/2211011/summon/stand/0.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/1.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/2.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/3.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/4.png",
                  "delay": 60,
                  "origin": [
                    177,
                    278
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/5.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/6.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/7.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/8.png",
                  "delay": 60,
                  "origin": [
                    177,
                    277
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/9.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/10.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/11.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/12.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/13.png",
                  "delay": 60,
                  "origin": [
                    177,
                    278
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/stand/14.png",
                  "delay": 60,
                  "origin": [
                    177,
                    274
                  ]
                }
              ],
              "move": [
                {
                  "src": "images/skills/221/2211011/summon/move/0.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/1.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/2.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/3.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/4.png",
                  "delay": 60,
                  "origin": [
                    177,
                    278
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/5.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/6.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/7.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/8.png",
                  "delay": 60,
                  "origin": [
                    177,
                    277
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/9.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/10.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/11.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/12.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/13.png",
                  "delay": 60,
                  "origin": [
                    177,
                    278
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/move/14.png",
                  "delay": 60,
                  "origin": [
                    177,
                    274
                  ]
                }
              ],
              "die": [
                {
                  "src": "images/skills/221/2211011/summon/die/0.png",
                  "delay": 60,
                  "origin": [
                    190,
                    340
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/1.png",
                  "delay": 60,
                  "origin": [
                    186,
                    337
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/2.png",
                  "delay": 60,
                  "origin": [
                    181,
                    332
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/3.png",
                  "delay": 60,
                  "origin": [
                    190,
                    326
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/4.png",
                  "delay": 60,
                  "origin": [
                    185,
                    320
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/5.png",
                  "delay": 60,
                  "origin": [
                    204,
                    319
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/6.png",
                  "delay": 60,
                  "origin": [
                    211,
                    340
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/7.png",
                  "delay": 60,
                  "origin": [
                    217,
                    358
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/8.png",
                  "delay": 60,
                  "origin": [
                    223,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/9.png",
                  "delay": 60,
                  "origin": [
                    227,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/10.png",
                  "delay": 60,
                  "origin": [
                    231,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/11.png",
                  "delay": 60,
                  "origin": [
                    234,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/12.png",
                  "delay": 60,
                  "origin": [
                    236,
                    359
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/13.png",
                  "delay": 60,
                  "origin": [
                    238,
                    358
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/14.png",
                  "delay": 60,
                  "origin": [
                    239,
                    357
                  ]
                },
                {
                  "src": "images/skills/221/2211011/summon/die/15.png",
                  "delay": 60,
                  "origin": [
                    29,
                    357
                  ]
                }
              ]
            }
          },
          "summonSkillId": "2211015"
        },
        {
          "id": "2211012",
          "name": "元素適應(雷、冰)",
          "desc": "展開冰和雷的保護網。保護網在防禦致命異常後會再生成，並在成功防禦一定次數後觸發冷卻時間。\\n另外永久增加異常狀態耐性與所有屬性耐性。",
          "h": "消耗MP#mpCon啟用元素改造\\n消耗最大MP的#x%，以#prop%機率防禦致命的狀態異常，保護網最多再次形成#y次\\n冷卻時間 #cooltime秒\\n[被動效果：所有屬性及狀態耐性增加#asrR%]",
          "rank": "60",
          "type": "buff",
          "equipable": true,
          "maxLevel": 20,
          "infoType": 10,
          "actions": [
            "elementalAdapting"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "210-x",
            "cooltime": "600-18*x",
            "prop": "100",
            "x": "12-d(x/2)",
            "y": "7",
            "asrR": "x",
            "terR": "x"
          },
          "icon": "images/skills/221/2211012.png",
          "skillBook": 221,
          "areaCast": {
            "hitFrame": 8,
            "hitMs": 480,
            "layers": [
              "effect",
              "effect0",
              "special",
              "special0"
            ]
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/221/2211012/effect/0.png",
                "delay": 60,
                "origin": [
                  158,
                  186
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/1.png",
                "delay": 60,
                "origin": [
                  164,
                  191
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/2.png",
                "delay": 60,
                "origin": [
                  174,
                  198
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/3.png",
                "delay": 60,
                "origin": [
                  182,
                  210
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/4.png",
                "delay": 60,
                "origin": [
                  194,
                  222
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/5.png",
                "delay": 60,
                "origin": [
                  202,
                  230
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/6.png",
                "delay": 60,
                "origin": [
                  207,
                  235
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/7.png",
                "delay": 60,
                "origin": [
                  209,
                  237
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/8.png",
                "delay": 60,
                "origin": [
                  206,
                  234
                ]
              },
              {
                "src": "images/skills/221/2211012/effect/9.png",
                "delay": 60,
                "origin": [
                  170,
                  191
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/221/2211012/effect0/0.png",
                "delay": 60,
                "origin": [
                  148,
                  155
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/1.png",
                "delay": 60,
                "origin": [
                  101,
                  132
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/2.png",
                "delay": 60,
                "origin": [
                  154,
                  148
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/3.png",
                "delay": 60,
                "origin": [
                  102,
                  126
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/4.png",
                "delay": 60,
                "origin": [
                  153,
                  139
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/5.png",
                "delay": 60,
                "origin": [
                  102,
                  132
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/6.png",
                "delay": 60,
                "origin": [
                  139,
                  132
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/7.png",
                "delay": 60,
                "origin": [
                  102,
                  131
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/8.png",
                "delay": 60,
                "origin": [
                  139,
                  155
                ]
              },
              {
                "src": "images/skills/221/2211012/effect0/9.png",
                "delay": 60,
                "origin": [
                  101,
                  123
                ]
              }
            ],
            "special": {
              "frames": [
                {
                  "src": "images/skills/221/2211012/special/0.png",
                  "delay": 60,
                  "origin": [
                    198,
                    266
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/1.png",
                  "delay": 60,
                  "origin": [
                    198,
                    300
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/2.png",
                  "delay": 60,
                  "origin": [
                    202,
                    300
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/3.png",
                  "delay": 60,
                  "origin": [
                    205,
                    297
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/4.png",
                  "delay": 60,
                  "origin": [
                    209,
                    292
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/5.png",
                  "delay": 60,
                  "origin": [
                    215,
                    289
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/6.png",
                  "delay": 60,
                  "origin": [
                    218,
                    289
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/7.png",
                  "delay": 60,
                  "origin": [
                    219,
                    289
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/8.png",
                  "delay": 60,
                  "origin": [
                    220,
                    288
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/9.png",
                  "delay": 60,
                  "origin": [
                    221,
                    289
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/10.png",
                  "delay": 60,
                  "origin": [
                    198,
                    229
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/11.png",
                  "delay": 60,
                  "origin": [
                    198,
                    229
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/12.png",
                  "delay": 60,
                  "origin": [
                    192,
                    223
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/13.png",
                  "delay": 60,
                  "origin": [
                    192,
                    225
                  ]
                },
                {
                  "src": "images/skills/221/2211012/special/14.png",
                  "delay": 60,
                  "origin": [
                    172,
                    217
                  ]
                }
              ],
              "repeat": 0,
              "relMove": [
                0,
                0
              ]
            },
            "special0": [
              {
                "src": "images/skills/221/2211012/special0/0.png",
                "delay": 60,
                "origin": [
                  176,
                  217
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/1.png",
                "delay": 60,
                "origin": [
                  176,
                  257
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/2.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/3.png",
                "delay": 60,
                "origin": [
                  176,
                  277
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/4.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/5.png",
                "delay": 60,
                "origin": [
                  176,
                  279
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/6.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/7.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/8.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/9.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/10.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/11.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/12.png",
                "delay": 60,
                "origin": [
                  176,
                  199
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/13.png",
                "delay": 60,
                "origin": [
                  172,
                  186
                ]
              },
              {
                "src": "images/skills/221/2211012/special0/14.png",
                "delay": 60,
                "origin": [
                  158,
                  169
                ]
              }
            ]
          }
        },
        {
          "id": "2211014",
          "name": "冰川之牆",
          "desc": "在自身前方生成高聳的冰牆，以彈開敵人並對其發動冰屬性攻擊。被攻擊命中的敵人將陷入冰凍狀態，其移動速度亦將受其影響而下降。此外，該攻擊可對火屬性敵人造成強力傷害。",
          "h": "消耗MP#mpCon，以#damage%傷害對最多#mobCount名敵人發動#attackCount次攻擊",
          "rank": "60",
          "type": "active",
          "equipable": true,
          "maxLevel": 10,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "glacialWall"
          ],
          "common": {
            "maxLevel": "10",
            "mpCon": "50+10*d(x/5)",
            "damage": "175+8*x",
            "mobCount": "8",
            "attackCount": "4",
            "time": "8",
            "s": "-15",
            "v": "-75",
            "lt": "-490, -170",
            "rb": "10, 10",
            "u": "480",
            "w": "370"
          },
          "icon": "images/skills/221/2211014.png",
          "skillBook": 221,
          "areaCast": {
            "hitFrame": 8,
            "hitMs": 480,
            "layers": [
              "effect",
              "effect0",
              "special",
              "special0"
            ]
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/221/2211014/effect/0.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/1.png",
                "delay": 60,
                "origin": [
                  116,
                  111
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/2.png",
                "delay": 60,
                "origin": [
                  113,
                  108
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/3.png",
                "delay": 60,
                "origin": [
                  107,
                  119
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/4.png",
                "delay": 60,
                "origin": [
                  97,
                  143
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/5.png",
                "delay": 60,
                "origin": [
                  100,
                  134
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/6.png",
                "delay": 60,
                "origin": [
                  104,
                  148
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/7.png",
                "delay": 60,
                "origin": [
                  111,
                  154
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/8.png",
                "delay": 60,
                "origin": [
                  112,
                  154
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/9.png",
                "delay": 60,
                "origin": [
                  111,
                  154
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/10.png",
                "delay": 60,
                "origin": [
                  111,
                  154
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/11.png",
                "delay": 60,
                "origin": [
                  105,
                  149
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/12.png",
                "delay": 60,
                "origin": [
                  101,
                  144
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/13.png",
                "delay": 60,
                "origin": [
                  101,
                  144
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/14.png",
                "delay": 60,
                "origin": [
                  99,
                  143
                ]
              },
              {
                "src": "images/skills/221/2211014/effect/15.png",
                "delay": 60,
                "origin": [
                  80,
                  123
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/221/2211014/effect0/0.png",
                "delay": 60,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/221/2211014/effect0/1.png",
                "delay": 60,
                "origin": [
                  101,
                  129
                ]
              },
              {
                "src": "images/skills/221/2211014/effect0/2.png",
                "delay": 60,
                "origin": [
                  102,
                  131
                ]
              },
              {
                "src": "images/skills/221/2211014/effect0/3.png",
                "delay": 60,
                "origin": [
                  102,
                  130
                ]
              },
              {
                "src": "images/skills/221/2211014/effect0/4.png",
                "delay": 60,
                "origin": [
                  101,
                  130
                ]
              },
              {
                "src": "images/skills/221/2211014/effect0/5.png",
                "delay": 60,
                "origin": [
                  101,
                  127
                ]
              },
              {
                "src": "images/skills/221/2211014/effect0/6.png",
                "delay": 60,
                "origin": [
                  102,
                  124
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/221/2211014/hit/0.png",
                "delay": 60,
                "origin": [
                  101,
                  99
                ]
              },
              {
                "src": "images/skills/221/2211014/hit/1.png",
                "delay": 60,
                "origin": [
                  93,
                  100
                ]
              },
              {
                "src": "images/skills/221/2211014/hit/2.png",
                "delay": 60,
                "origin": [
                  98,
                  99
                ]
              },
              {
                "src": "images/skills/221/2211014/hit/3.png",
                "delay": 60,
                "origin": [
                  104,
                  100
                ]
              },
              {
                "src": "images/skills/221/2211014/hit/4.png",
                "delay": 60,
                "origin": [
                  104,
                  100
                ]
              },
              {
                "src": "images/skills/221/2211014/hit/5.png",
                "delay": 60,
                "origin": [
                  105,
                  98
                ]
              },
              {
                "src": "images/skills/221/2211014/hit/6.png",
                "delay": 60,
                "origin": [
                  78,
                  63
                ]
              }
            ],
            "special": {
              "frames": [
                {
                  "src": "images/skills/221/2211014/special/0.png",
                  "delay": 360,
                  "origin": [
                    0,
                    0
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/1.png",
                  "delay": 60,
                  "origin": [
                    177,
                    90
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/2.png",
                  "delay": 60,
                  "origin": [
                    195,
                    149
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/3.png",
                  "delay": 60,
                  "origin": [
                    302,
                    151
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/4.png",
                  "delay": 60,
                  "origin": [
                    442,
                    203
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/5.png",
                  "delay": 60,
                  "origin": [
                    535,
                    226
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/6.png",
                  "delay": 60,
                  "origin": [
                    528,
                    227
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/7.png",
                  "delay": 60,
                  "origin": [
                    522,
                    222
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/8.png",
                  "delay": 60,
                  "origin": [
                    517,
                    220
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/9.png",
                  "delay": 60,
                  "origin": [
                    516,
                    216
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/10.png",
                  "delay": 60,
                  "origin": [
                    514,
                    214
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/11.png",
                  "delay": 90,
                  "origin": [
                    513,
                    211
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/12.png",
                  "delay": 90,
                  "origin": [
                    511,
                    210
                  ]
                },
                {
                  "src": "images/skills/221/2211014/special/13.png",
                  "delay": 90,
                  "origin": [
                    506,
                    209
                  ]
                }
              ],
              "repeat": 0,
              "relMove": [
                0,
                0
              ]
            },
            "special0": [
              {
                "src": "images/skills/221/2211014/special0/0.png",
                "delay": 60,
                "origin": [
                  591,
                  283
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/1.png",
                "delay": 60,
                "origin": [
                  602,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/2.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/3.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/4.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/5.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/6.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/7.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/8.png",
                "delay": 60,
                "origin": [
                  648,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/9.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/10.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/11.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/12.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/13.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/14.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/15.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/16.png",
                "delay": 60,
                "origin": [
                  627,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/17.png",
                "delay": 60,
                "origin": [
                  602,
                  287
                ]
              },
              {
                "src": "images/skills/221/2211014/special0/18.png",
                "delay": 60,
                "origin": [
                  591,
                  285
                ]
              }
            ]
          }
        },
        {
          "id": "2211015",
          "name": "閃電球",
          "desc": "召喚由閃電凝聚而成的球體。",
          "h": "",
          "rank": "60",
          "type": "summon",
          "equipable": false,
          "maxLevel": 20,
          "infoType": 33,
          "actions": [
            "thunderStorm"
          ],
          "common": {
            "maxLevel": "20",
            "mpCon": "25+3*d(x/2)",
            "damage": "196+5*x",
            "time": "20+2*x",
            "subTime": "1080",
            "u2": "70+5*x"
          },
          "icon": "images/skills/221/2211015.png",
          "skillBook": 221,
          "skipPanel": true,
          "fx": {
            "hit": [
              {
                "src": "images/skills/221/2211015/hit/0.png",
                "delay": 60,
                "origin": [
                  76,
                  71
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/1.png",
                "delay": 60,
                "origin": [
                  117,
                  111
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/2.png",
                "delay": 60,
                "origin": [
                  120,
                  123
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/3.png",
                "delay": 60,
                "origin": [
                  120,
                  121
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/4.png",
                "delay": 60,
                "origin": [
                  118,
                  113
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/5.png",
                "delay": 60,
                "origin": [
                  120,
                  113
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/6.png",
                "delay": 60,
                "origin": [
                  122,
                  113
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/7.png",
                "delay": 60,
                "origin": [
                  96,
                  87
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/8.png",
                "delay": 60,
                "origin": [
                  139,
                  106
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/9.png",
                "delay": 60,
                "origin": [
                  141,
                  109
                ]
              },
              {
                "src": "images/skills/221/2211015/hit/10.png",
                "delay": 60,
                "origin": [
                  150,
                  112
                ]
              }
            ],
            "summonAttacks": [
              {
                "name": "attack1",
                "frames": [
                  {
                    "src": "images/skills/221/2211015/summon/attack1/0.png",
                    "delay": 60,
                    "origin": [
                      177,
                      281
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/1.png",
                    "delay": 60,
                    "origin": [
                      200,
                      303
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/2.png",
                    "delay": 60,
                    "origin": [
                      200,
                      303
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/3.png",
                    "delay": 60,
                    "origin": [
                      197,
                      301
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/4.png",
                    "delay": 60,
                    "origin": [
                      177,
                      297
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/5.png",
                    "delay": 60,
                    "origin": [
                      308,
                      456
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/6.png",
                    "delay": 60,
                    "origin": [
                      255,
                      400
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/7.png",
                    "delay": 60,
                    "origin": [
                      300,
                      419
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/8.png",
                    "delay": 60,
                    "origin": [
                      312,
                      408
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/9.png",
                    "delay": 60,
                    "origin": [
                      321,
                      424
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/10.png",
                    "delay": 60,
                    "origin": [
                      323,
                      438
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/11.png",
                    "delay": 60,
                    "origin": [
                      323,
                      451
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/12.png",
                    "delay": 60,
                    "origin": [
                      322,
                      456
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/13.png",
                    "delay": 60,
                    "origin": [
                      314,
                      462
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/14.png",
                    "delay": 60,
                    "origin": [
                      312,
                      467
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/15.png",
                    "delay": 60,
                    "origin": [
                      310,
                      472
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/16.png",
                    "delay": 60,
                    "origin": [
                      315,
                      476
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/17.png",
                    "delay": 60,
                    "origin": [
                      319,
                      481
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/18.png",
                    "delay": 60,
                    "origin": [
                      322,
                      485
                    ]
                  },
                  {
                    "src": "images/skills/221/2211015/summon/attack1/19.png",
                    "delay": 60,
                    "origin": [
                      325,
                      488
                    ]
                  }
                ],
                "mobCount": "6",
                "attackCount": "3"
              }
            ],
            "summonVisual": {
              "summoned": [
                {
                  "src": "images/skills/221/2211015/summon/summoned/0.png",
                  "delay": 60,
                  "origin": [
                    0,
                    0
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/1.png",
                  "delay": 60,
                  "origin": [
                    0,
                    0
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/2.png",
                  "delay": 60,
                  "origin": [
                    75,
                    185
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/3.png",
                  "delay": 60,
                  "origin": [
                    76,
                    139
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/4.png",
                  "delay": 60,
                  "origin": [
                    113,
                    186
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/5.png",
                  "delay": 60,
                  "origin": [
                    116,
                    186
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/6.png",
                  "delay": 60,
                  "origin": [
                    115,
                    186
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/7.png",
                  "delay": 60,
                  "origin": [
                    114,
                    184
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/8.png",
                  "delay": 60,
                  "origin": [
                    84,
                    151
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/9.png",
                  "delay": 60,
                  "origin": [
                    104,
                    177
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/10.png",
                  "delay": 60,
                  "origin": [
                    100,
                    172
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/11.png",
                  "delay": 60,
                  "origin": [
                    190,
                    340
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/12.png",
                  "delay": 60,
                  "origin": [
                    186,
                    337
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/13.png",
                  "delay": 60,
                  "origin": [
                    204,
                    340
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/14.png",
                  "delay": 60,
                  "origin": [
                    217,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/15.png",
                  "delay": 60,
                  "origin": [
                    223,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/16.png",
                  "delay": 60,
                  "origin": [
                    227,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/17.png",
                  "delay": 60,
                  "origin": [
                    231,
                    359
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/18.png",
                  "delay": 60,
                  "origin": [
                    234,
                    358
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/19.png",
                  "delay": 60,
                  "origin": [
                    236,
                    357
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/20.png",
                  "delay": 60,
                  "origin": [
                    238,
                    357
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/21.png",
                  "delay": 60,
                  "origin": [
                    239,
                    356
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/22.png",
                  "delay": 60,
                  "origin": [
                    177,
                    306
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/summoned/23.png",
                  "delay": 60,
                  "origin": [
                    177,
                    301
                  ]
                }
              ],
              "stand": [
                {
                  "src": "images/skills/221/2211015/summon/stand/0.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/1.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/2.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/3.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/4.png",
                  "delay": 60,
                  "origin": [
                    177,
                    278
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/5.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/6.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/7.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/8.png",
                  "delay": 60,
                  "origin": [
                    177,
                    277
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/9.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/10.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/11.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/12.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/13.png",
                  "delay": 60,
                  "origin": [
                    177,
                    278
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/stand/14.png",
                  "delay": 60,
                  "origin": [
                    177,
                    274
                  ]
                }
              ],
              "move": [
                {
                  "src": "images/skills/221/2211015/summon/move/0.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/1.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/2.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/3.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/4.png",
                  "delay": 60,
                  "origin": [
                    177,
                    278
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/5.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/6.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/7.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/8.png",
                  "delay": 60,
                  "origin": [
                    177,
                    277
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/9.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/10.png",
                  "delay": 60,
                  "origin": [
                    177,
                    281
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/11.png",
                  "delay": 60,
                  "origin": [
                    177,
                    285
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/12.png",
                  "delay": 60,
                  "origin": [
                    177,
                    284
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/13.png",
                  "delay": 60,
                  "origin": [
                    177,
                    278
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/move/14.png",
                  "delay": 60,
                  "origin": [
                    177,
                    274
                  ]
                }
              ],
              "die": [
                {
                  "src": "images/skills/221/2211015/summon/die/0.png",
                  "delay": 60,
                  "origin": [
                    190,
                    340
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/1.png",
                  "delay": 60,
                  "origin": [
                    186,
                    337
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/2.png",
                  "delay": 60,
                  "origin": [
                    181,
                    332
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/3.png",
                  "delay": 60,
                  "origin": [
                    190,
                    326
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/4.png",
                  "delay": 60,
                  "origin": [
                    185,
                    320
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/5.png",
                  "delay": 60,
                  "origin": [
                    204,
                    319
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/6.png",
                  "delay": 60,
                  "origin": [
                    211,
                    340
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/7.png",
                  "delay": 60,
                  "origin": [
                    217,
                    358
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/8.png",
                  "delay": 60,
                  "origin": [
                    223,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/9.png",
                  "delay": 60,
                  "origin": [
                    227,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/10.png",
                  "delay": 60,
                  "origin": [
                    231,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/11.png",
                  "delay": 60,
                  "origin": [
                    234,
                    361
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/12.png",
                  "delay": 60,
                  "origin": [
                    236,
                    359
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/13.png",
                  "delay": 60,
                  "origin": [
                    238,
                    358
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/14.png",
                  "delay": 60,
                  "origin": [
                    239,
                    357
                  ]
                },
                {
                  "src": "images/skills/221/2211015/summon/die/15.png",
                  "delay": 60,
                  "origin": [
                    29,
                    357
                  ]
                }
              ]
            }
          }
        }
      ]
    },
    "222": {
      "jobId": 222,
      "name": "大魔導士（冰、雷）",
      "rank": "100",
      "skillBook": 222,
      "skills": [
        {
          "id": "2220004",
          "name": "魔力無限",
          "desc": "專注精神，引出無限的魔力，恢復HP與MP，並強化魔法威力。",
          "h": "每#x秒恢復#s%基本HP、MP\\n最終傷害增加#mdR%",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 10,
          "actions": [],
          "common": {
            "maxLevel": "30",
            "mdR": "7+14*d(x/5)",
            "x": "5",
            "s": "10"
          },
          "icon": "images/skills/222/2220004.png",
          "skillBook": 222
        },
        {
          "id": "2220010",
          "name": "神祕狙擊",
          "desc": "攻擊時，可以無視一定程度的怪物防禦率，持續攻擊時所有攻擊的傷害會增加。傷害增加效果會套用機率，最多可以累積5次。",
          "h": "攻擊時無視怪物的防禦率 #ignoreMobpdpR%，召喚獸攻擊除外的攻擊命中時，以#prop%機率每#time秒增加傷害#x%\\n傷害增加效果最多可套用#y次",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 30,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "30",
            "prop": "25+5*d(x/2)",
            "x": "2+d(x/5)",
            "y": "5",
            "ignoreMobpdpR": "5+u(x/2)",
            "time": "5"
          },
          "icon": "images/skills/222/2220010.png",
          "skillBook": 222
        },
        {
          "id": "2220013",
          "name": "大師魔法",
          "desc": "魔力增加，自己套用的所有Buff的持續時間增加，皆為永久性。額外永久增加格擋。",
          "h": "增加魔力#madX、Buff持續時間#bufftimeR%、格擋#stanceProp%",
          "rank": "100",
          "type": "passive",
          "equipable": false,
          "maxLevel": 10,
          "infoType": 50,
          "actions": [],
          "common": {
            "maxLevel": "10",
            "madX": "3*x",
            "bufftimeR": "5*x",
            "stanceProp": "6*x"
          },
          "icon": "images/skills/222/2220013.png",
          "skillBook": 222
        },
        {
          "id": "2220043",
          "name": "瞬間移動精通-強化傷害",
          "desc": "瞬間移動精通的傷害增加。",
          "h": "提高傷害 #damR% ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 140,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "10"
          },
          "icon": "images/skills/222/2220043.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2220044",
          "name": "瞬間移動精通-臨時目標",
          "desc": "瞬間移動精通的可攻擊的怪物最大數量增加。",
          "h": "可攻擊的怪物最大數量增加#targetPlus",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 150,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "targetPlus": "2"
          },
          "icon": "images/skills/222/2220044.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2220046",
          "name": "閃電連擊-強化傷害",
          "desc": "閃電連擊的傷害增加。",
          "h": "提高傷害 #damR% ",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 140,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "20"
          },
          "icon": "images/skills/222/2220046.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2220047",
          "name": "閃電連擊-臨時目標",
          "desc": "閃電連擊可攻擊的怪物最大數量增加。",
          "h": "可攻擊的怪物最大數量增加#targetPlus",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 165,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "targetPlus": "2"
          },
          "icon": "images/skills/222/2220047.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2220048",
          "name": "閃電連擊-額外攻擊",
          "desc": "閃電連擊的攻擊次數增加。",
          "h": "攻擊次數增加#attackCount &#x9;",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 180,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "attackCount": "1"
          },
          "icon": "images/skills/222/2220048.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2220049",
          "name": "冰鋒刃-強化傷害",
          "desc": "讓鋒刃的傷害力增加。",
          "h": "提高傷害#damR%",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 150,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "damR": "20"
          },
          "icon": "images/skills/222/2220049.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2220050",
          "name": "冰鋒刃-臨時目標",
          "desc": "冰鋒刃的可攻擊的怪物最大數量增加。",
          "h": "可攻擊的怪物最大數量增加#targetPlus",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 165,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "targetPlus": "2"
          },
          "icon": "images/skills/222/2220050.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2220051",
          "name": "冰鋒刃-爆擊提升",
          "desc": "讓冰鋒刃的會心一擊率增加。",
          "h": "爆擊機率增加#cr%",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 190,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "cr": "20"
          },
          "icon": "images/skills/222/2220051.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2221000",
          "name": "楓葉祝福",
          "desc": "受到楓之谷世界的女神的庇護，自己的所有能力值增加一定比例。使用技能時，楓之谷世界的女神將暫時現身。",
          "h": "消耗#mpConMP，使楓之谷世界的女神現身\\n[被動效果：直接投入AP的所有能力值增加#basicStatUp%]",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 10,
          "actions": [],
          "common": {
            "mpCon": "10+10*d(x/5)",
            "maxLevel": "30",
            "basicStatUp": "u(x/2)"
          },
          "icon": "images/skills/222/2221000.png",
          "skillBook": 222,
          "fx": {
            "effect": [
              {
                "src": "images/skills/222/2221000/effect/0.png",
                "delay": 720,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/1.png",
                "delay": 60,
                "origin": [
                  142,
                  309
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/2.png",
                "delay": 60,
                "origin": [
                  144,
                  302
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/3.png",
                "delay": 60,
                "origin": [
                  144,
                  294
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/4.png",
                "delay": 60,
                "origin": [
                  144,
                  294
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/5.png",
                "delay": 60,
                "origin": [
                  144,
                  292
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/6.png",
                "delay": 60,
                "origin": [
                  144,
                  289
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/7.png",
                "delay": 60,
                "origin": [
                  144,
                  287
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/8.png",
                "delay": 60,
                "origin": [
                  143,
                  294
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/9.png",
                "delay": 60,
                "origin": [
                  149,
                  300
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/10.png",
                "delay": 60,
                "origin": [
                  147,
                  301
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/11.png",
                "delay": 60,
                "origin": [
                  145,
                  303
                ]
              },
              {
                "src": "images/skills/222/2221000/effect/12.png",
                "delay": 60,
                "origin": [
                  135,
                  302
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/222/2221000/effect0/0.png",
                "delay": 60,
                "origin": [
                  63,
                  227
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/1.png",
                "delay": 60,
                "origin": [
                  130,
                  434
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/2.png",
                "delay": 60,
                "origin": [
                  132,
                  434
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/3.png",
                "delay": 60,
                "origin": [
                  132,
                  433
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/4.png",
                "delay": 60,
                "origin": [
                  131,
                  432
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/5.png",
                "delay": 60,
                "origin": [
                  131,
                  431
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/6.png",
                "delay": 60,
                "origin": [
                  136,
                  429
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/7.png",
                "delay": 60,
                "origin": [
                  169,
                  427
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/8.png",
                "delay": 60,
                "origin": [
                  169,
                  424
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/9.png",
                "delay": 60,
                "origin": [
                  177,
                  421
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/10.png",
                "delay": 60,
                "origin": [
                  185,
                  418
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/11.png",
                "delay": 60,
                "origin": [
                  191,
                  414
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/12.png",
                "delay": 60,
                "origin": [
                  143,
                  366
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/13.png",
                "delay": 60,
                "origin": [
                  143,
                  354
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/14.png",
                "delay": 60,
                "origin": [
                  139,
                  342
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/15.png",
                "delay": 60,
                "origin": [
                  134,
                  306
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/16.png",
                "delay": 60,
                "origin": [
                  138,
                  307
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/17.png",
                "delay": 60,
                "origin": [
                  141,
                  309
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/18.png",
                "delay": 60,
                "origin": [
                  143,
                  310
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/19.png",
                "delay": 60,
                "origin": [
                  145,
                  311
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/20.png",
                "delay": 60,
                "origin": [
                  147,
                  312
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/21.png",
                "delay": 60,
                "origin": [
                  147,
                  313
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/22.png",
                "delay": 60,
                "origin": [
                  149,
                  313
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/23.png",
                "delay": 60,
                "origin": [
                  150,
                  312
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/24.png",
                "delay": 60,
                "origin": [
                  151,
                  296
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/25.png",
                "delay": 60,
                "origin": [
                  152,
                  296
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/26.png",
                "delay": 60,
                "origin": [
                  149,
                  297
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/27.png",
                "delay": 60,
                "origin": [
                  101,
                  295
                ]
              },
              {
                "src": "images/skills/222/2221000/effect0/28.png",
                "delay": 60,
                "origin": [
                  99,
                  292
                ]
              }
            ]
          }
        },
        {
          "id": "2221005",
          "name": "召喚冰魔",
          "desc": "在一定時間內召喚冰屬性的冰魔神。冰魔神可以同時攻擊多數的敵人，學習召喚冰魔神技能後，會永久增加熟練度。冰魔神就算攻擊，反射攻擊狀態的敵人，也不會受到傷害，並將使敵人陷入凍結狀態。",
          "h": "消耗#mpCon MP，召喚冰魔神#time秒\\n冰魔神將對最多#mobCount名敵人造成#damage%傷害#attackCount次\\n熟練度增加量永久增加至#mastery%",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 33,
          "actions": [
            "alert2"
          ],
          "common": {
            "time": "100+50*d(x/3)",
            "mpCon": "30+3*x",
            "damage": "67+2*x",
            "mastery": "55+u(x/2)",
            "maxLevel": "30",
            "s": "-15",
            "v": "-75",
            "subTime": "8",
            "attackCount": "3",
            "mobCount": "3"
          },
          "icon": "images/skills/222/2221005.png",
          "skillBook": 222,
          "fx": {
            "effect": [
              {
                "src": "images/skills/222/2221005/effect/0.png",
                "delay": 60,
                "origin": [
                  114,
                  237
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/1.png",
                "delay": 60,
                "origin": [
                  163,
                  300
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/2.png",
                "delay": 60,
                "origin": [
                  165,
                  302
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/3.png",
                "delay": 60,
                "origin": [
                  166,
                  303
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/4.png",
                "delay": 60,
                "origin": [
                  166,
                  303
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/5.png",
                "delay": 60,
                "origin": [
                  166,
                  303
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/6.png",
                "delay": 60,
                "origin": [
                  166,
                  303
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/7.png",
                "delay": 60,
                "origin": [
                  248,
                  367
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/8.png",
                "delay": 60,
                "origin": [
                  237,
                  363
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/9.png",
                "delay": 60,
                "origin": [
                  233,
                  364
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/10.png",
                "delay": 60,
                "origin": [
                  236,
                  346
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/11.png",
                "delay": 60,
                "origin": [
                  236,
                  341
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/12.png",
                "delay": 60,
                "origin": [
                  237,
                  342
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/13.png",
                "delay": 60,
                "origin": [
                  239,
                  342
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/14.png",
                "delay": 60,
                "origin": [
                  240,
                  342
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/15.png",
                "delay": 60,
                "origin": [
                  240,
                  341
                ]
              },
              {
                "src": "images/skills/222/2221005/effect/16.png",
                "delay": 60,
                "origin": [
                  240,
                  340
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/222/2221005/hit/0.png",
                "delay": 60,
                "origin": [
                  67,
                  133
                ]
              },
              {
                "src": "images/skills/222/2221005/hit/1.png",
                "delay": 60,
                "origin": [
                  73,
                  148
                ]
              },
              {
                "src": "images/skills/222/2221005/hit/2.png",
                "delay": 60,
                "origin": [
                  78,
                  157
                ]
              },
              {
                "src": "images/skills/222/2221005/hit/3.png",
                "delay": 60,
                "origin": [
                  79,
                  161
                ]
              },
              {
                "src": "images/skills/222/2221005/hit/4.png",
                "delay": 60,
                "origin": [
                  80,
                  163
                ]
              },
              {
                "src": "images/skills/222/2221005/hit/5.png",
                "delay": 60,
                "origin": [
                  79,
                  164
                ]
              },
              {
                "src": "images/skills/222/2221005/hit/6.png",
                "delay": 60,
                "origin": [
                  77,
                  165
                ]
              },
              {
                "src": "images/skills/222/2221005/hit/7.png",
                "delay": 60,
                "origin": [
                  69,
                  164
                ]
              },
              {
                "src": "images/skills/222/2221005/hit/8.png",
                "delay": 60,
                "origin": [
                  66,
                  162
                ]
              }
            ],
            "summonAttacks": [
              {
                "name": "attack1",
                "frames": [
                  {
                    "src": "images/skills/222/2221005/summon/attack1/0.png",
                    "delay": 90,
                    "origin": [
                      131,
                      257
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/1.png",
                    "delay": 90,
                    "origin": [
                      134,
                      282
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/2.png",
                    "delay": 90,
                    "origin": [
                      136,
                      300
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/3.png",
                    "delay": 90,
                    "origin": [
                      144,
                      310
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/4.png",
                    "delay": 90,
                    "origin": [
                      149,
                      308
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/5.png",
                    "delay": 90,
                    "origin": [
                      154,
                      297
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/6.png",
                    "delay": 90,
                    "origin": [
                      157,
                      299
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/7.png",
                    "delay": 90,
                    "origin": [
                      156,
                      307
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/8.png",
                    "delay": 90,
                    "origin": [
                      153,
                      313
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/9.png",
                    "delay": 90,
                    "origin": [
                      155,
                      272
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/10.png",
                    "delay": 90,
                    "origin": [
                      161,
                      264
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/11.png",
                    "delay": 90,
                    "origin": [
                      163,
                      272
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/12.png",
                    "delay": 90,
                    "origin": [
                      166,
                      278
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/13.png",
                    "delay": 90,
                    "origin": [
                      167,
                      274
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/14.png",
                    "delay": 90,
                    "origin": [
                      166,
                      270
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/15.png",
                    "delay": 90,
                    "origin": [
                      143,
                      276
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/16.png",
                    "delay": 90,
                    "origin": [
                      157,
                      272
                    ]
                  },
                  {
                    "src": "images/skills/222/2221005/summon/attack1/17.png",
                    "delay": 90,
                    "origin": [
                      153,
                      272
                    ]
                  }
                ],
                "mobCount": "3",
                "attackCount": "3"
              }
            ],
            "summonVisual": {
              "summoned": [
                {
                  "src": "images/skills/222/2221005/summon/summoned/0.png",
                  "delay": 90,
                  "origin": [
                    191,
                    332
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/summoned/1.png",
                  "delay": 90,
                  "origin": [
                    235,
                    328
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/summoned/2.png",
                  "delay": 90,
                  "origin": [
                    237,
                    319
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/summoned/3.png",
                  "delay": 90,
                  "origin": [
                    239,
                    313
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/summoned/4.png",
                  "delay": 90,
                  "origin": [
                    241,
                    305
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/summoned/5.png",
                  "delay": 90,
                  "origin": [
                    242,
                    308
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/summoned/6.png",
                  "delay": 90,
                  "origin": [
                    243,
                    311
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/summoned/7.png",
                  "delay": 90,
                  "origin": [
                    243,
                    313
                  ]
                }
              ],
              "move": [
                {
                  "src": "images/skills/222/2221005/summon/move/0.png",
                  "delay": 120,
                  "origin": [
                    131,
                    257
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/1.png",
                  "delay": 120,
                  "origin": [
                    134,
                    262
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/2.png",
                  "delay": 120,
                  "origin": [
                    136,
                    270
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/3.png",
                  "delay": 120,
                  "origin": [
                    139,
                    276
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/4.png",
                  "delay": 120,
                  "origin": [
                    145,
                    272
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/5.png",
                  "delay": 120,
                  "origin": [
                    154,
                    266
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/6.png",
                  "delay": 120,
                  "origin": [
                    157,
                    257
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/7.png",
                  "delay": 120,
                  "origin": [
                    155,
                    262
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/8.png",
                  "delay": 120,
                  "origin": [
                    144,
                    270
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/9.png",
                  "delay": 120,
                  "origin": [
                    132,
                    276
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/10.png",
                  "delay": 120,
                  "origin": [
                    132,
                    272
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/move/11.png",
                  "delay": 120,
                  "origin": [
                    132,
                    266
                  ]
                }
              ],
              "stand": [
                {
                  "src": "images/skills/222/2221005/summon/stand/0.png",
                  "delay": 120,
                  "origin": [
                    131,
                    257
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/1.png",
                  "delay": 120,
                  "origin": [
                    134,
                    262
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/2.png",
                  "delay": 120,
                  "origin": [
                    136,
                    270
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/3.png",
                  "delay": 120,
                  "origin": [
                    139,
                    276
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/4.png",
                  "delay": 120,
                  "origin": [
                    145,
                    272
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/5.png",
                  "delay": 120,
                  "origin": [
                    154,
                    266
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/6.png",
                  "delay": 120,
                  "origin": [
                    157,
                    257
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/7.png",
                  "delay": 120,
                  "origin": [
                    155,
                    262
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/8.png",
                  "delay": 120,
                  "origin": [
                    144,
                    270
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/9.png",
                  "delay": 120,
                  "origin": [
                    132,
                    276
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/10.png",
                  "delay": 120,
                  "origin": [
                    132,
                    272
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/stand/11.png",
                  "delay": 120,
                  "origin": [
                    132,
                    266
                  ]
                }
              ],
              "die": [
                {
                  "src": "images/skills/222/2221005/summon/die/0.png",
                  "delay": 90,
                  "origin": [
                    161,
                    325
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/die/1.png",
                  "delay": 90,
                  "origin": [
                    205,
                    321
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/die/2.png",
                  "delay": 90,
                  "origin": [
                    207,
                    312
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/die/3.png",
                  "delay": 90,
                  "origin": [
                    209,
                    306
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/die/4.png",
                  "delay": 90,
                  "origin": [
                    211,
                    298
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/die/5.png",
                  "delay": 90,
                  "origin": [
                    212,
                    301
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/die/6.png",
                  "delay": 90,
                  "origin": [
                    213,
                    304
                  ]
                },
                {
                  "src": "images/skills/222/2221005/summon/die/7.png",
                  "delay": 90,
                  "origin": [
                    213,
                    306
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "2221006",
          "name": "閃電連擊",
          "desc": "發射高壓電流並暈眩對方。閃電連擊會套用額外的爆擊機率，並且可連續對對象周圍的敵人發動攻擊。閃電屬性的攻擊。",
          "h": "消耗MP #mpCon，最多同時將 #mobCount名敵人進行 #damage%的傷害攻擊#attackCount次， #prop%的機率#time秒間暈眩。追加爆擊機率 #cr%",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 2,
          "chainAttack": true,
          "actions": [
            "chainLightningNew"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "24+2*d(x/3)",
            "damage": "130+3*x",
            "attackCount": "10",
            "x": "0",
            "cr": "10+u(x/2)",
            "time": "1+u(x/10)",
            "prop": "30+2*x",
            "mobCount": "6",
            "range": "420",
            "y": "350",
            "hcTime": "1",
            "hcProp": "u(x/6)",
            "u": "230"
          },
          "icon": "images/skills/222/2221006.png",
          "skillBook": 222,
          "ballCast": {
            "launchFrame": 8,
            "launchMs": 480,
            "ballMode": "beam",
            "travel": "horizontal",
            "specialOnFirstHit": false,
            "aoeOnSpecial": false,
            "aoeRadius": 100,
            "chain": false,
            "instantBeam": true,
            "instantTargets": 8,
            "instantBeamLengthScale": 2,
            "speedPxPerMs": 0.6
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/222/2221006/effect/0.png",
                "delay": 60,
                "origin": [
                  24,
                  267
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/1.png",
                "delay": 60,
                "origin": [
                  117,
                  266
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/2.png",
                "delay": 60,
                "origin": [
                  117,
                  259
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/3.png",
                "delay": 60,
                "origin": [
                  117,
                  213
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/4.png",
                "delay": 60,
                "origin": [
                  111,
                  264
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/5.png",
                "delay": 60,
                "origin": [
                  108,
                  217
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/6.png",
                "delay": 60,
                "origin": [
                  72,
                  217
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/7.png",
                "delay": 60,
                "origin": [
                  53,
                  152
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/8.png",
                "delay": 60,
                "origin": [
                  335,
                  364
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/9.png",
                "delay": 60,
                "origin": [
                  254,
                  217
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/10.png",
                "delay": 60,
                "origin": [
                  335,
                  364
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/11.png",
                "delay": 60,
                "origin": [
                  335,
                  364
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/12.png",
                "delay": 60,
                "origin": [
                  335,
                  364
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/13.png",
                "delay": 60,
                "origin": [
                  335,
                  364
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/14.png",
                "delay": 60,
                "origin": [
                  277,
                  246
                ]
              },
              {
                "src": "images/skills/222/2221006/effect/15.png",
                "delay": 60,
                "origin": [
                  220,
                  213
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/222/2221006/hit/0.png",
                "delay": 60,
                "origin": [
                  81,
                  69
                ]
              },
              {
                "src": "images/skills/222/2221006/hit/1.png",
                "delay": 60,
                "origin": [
                  90,
                  81
                ]
              },
              {
                "src": "images/skills/222/2221006/hit/2.png",
                "delay": 60,
                "origin": [
                  90,
                  86
                ]
              },
              {
                "src": "images/skills/222/2221006/hit/3.png",
                "delay": 60,
                "origin": [
                  90,
                  84
                ]
              },
              {
                "src": "images/skills/222/2221006/hit/4.png",
                "delay": 60,
                "origin": [
                  87,
                  79
                ]
              },
              {
                "src": "images/skills/222/2221006/hit/5.png",
                "delay": 60,
                "origin": [
                  90,
                  82
                ]
              },
              {
                "src": "images/skills/222/2221006/hit/6.png",
                "delay": 60,
                "origin": [
                  88,
                  83
                ]
              },
              {
                "src": "images/skills/222/2221006/hit/7.png",
                "delay": 60,
                "origin": [
                  72,
                  77
                ]
              },
              {
                "src": "images/skills/222/2221006/hit/8.png",
                "delay": 60,
                "origin": [
                  71,
                  77
                ]
              }
            ],
            "ball": {
              "layers": [
                {
                  "name": "0",
                  "frames": [
                    {
                      "src": "images/skills/222/2221006/ball/0/0.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/0/1.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/0/2.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    }
                  ]
                },
                {
                  "name": "1",
                  "frames": [
                    {
                      "src": "images/skills/222/2221006/ball/1/0.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/1/1.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/1/2.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    }
                  ]
                },
                {
                  "name": "2",
                  "frames": [
                    {
                      "src": "images/skills/222/2221006/ball/2/0.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/2/1.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/2/2.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    }
                  ]
                },
                {
                  "name": "front",
                  "frames": [
                    {
                      "src": "images/skills/222/2221006/ball/front/0.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/front/1.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/front/2.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    }
                  ]
                },
                {
                  "name": "rear",
                  "frames": [
                    {
                      "src": "images/skills/222/2221006/ball/rear/0.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/rear/1.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    },
                    {
                      "src": "images/skills/222/2221006/ball/rear/2.png",
                      "delay": 60,
                      "origin": [
                        0,
                        0
                      ]
                    }
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "2221007",
          "name": "暴風雪",
          "desc": "從天而降的冰矛對多數敵人進行強烈的冰屬性攻擊，並凍結敵人。另外使用永久性的攻擊時，#c會以一定的機率對單一敵人落下暴風雪#並造成傷害。   ",
          "h": "消耗MP#mpCon，最多對#mobCount名敵人使用#damage%的傷害攻擊#attackCount次, 冷卻時間 #cooltime秒\\n[#c被動效果#:#c[終極攻擊類技能]#使用直接攻擊的技能時，會以#prop%的機率對單一敵人落下能造成#x%傷害攻擊的暴風雪]",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "areaAttack": true,
          "actions": [
            "blizzardNew"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "360-x*2",
            "mobCount": "15",
            "damage": "211+3*x",
            "cooltime": "45",
            "attackCount": "12",
            "prop": "x*2",
            "x": "100+4*x",
            "lt": "-400, -350",
            "rb": "400, 250",
            "s": "-15",
            "v": "-75",
            "time": "8",
            "u": "0",
            "y": "600"
          },
          "icon": "images/skills/222/2221007.png",
          "skillBook": 222,
          "blizzardCast": {
            "tileFrame": 15,
            "hitFrame": 18,
            "tileMs": 900,
            "hitMs": 1080,
            "maxTileTargets": 15
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/222/2221007/effect/0.png",
                "delay": 720,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/1.png",
                "delay": 90,
                "origin": [
                  130,
                  148
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/2.png",
                "delay": 90,
                "origin": [
                  124,
                  148
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/3.png",
                "delay": 90,
                "origin": [
                  126,
                  148
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/4.png",
                "delay": 90,
                "origin": [
                  128,
                  151
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/5.png",
                "delay": 90,
                "origin": [
                  130,
                  154
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/6.png",
                "delay": 90,
                "origin": [
                  131,
                  157
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/7.png",
                "delay": 90,
                "origin": [
                  123,
                  158
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/8.png",
                "delay": 90,
                "origin": [
                  126,
                  142
                ]
              },
              {
                "src": "images/skills/222/2221007/effect/9.png",
                "delay": 90,
                "origin": [
                  118,
                  146
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/222/2221007/effect0/0.png",
                "delay": 60,
                "origin": [
                  75,
                  257
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/1.png",
                "delay": 60,
                "origin": [
                  82,
                  300
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/2.png",
                "delay": 60,
                "origin": [
                  99,
                  303
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/3.png",
                "delay": 60,
                "origin": [
                  97,
                  307
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/4.png",
                "delay": 60,
                "origin": [
                  92,
                  277
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/5.png",
                "delay": 60,
                "origin": [
                  86,
                  251
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/6.png",
                "delay": 60,
                "origin": [
                  99,
                  256
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/7.png",
                "delay": 60,
                "origin": [
                  111,
                  275
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/8.png",
                "delay": 60,
                "origin": [
                  105,
                  281
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/9.png",
                "delay": 60,
                "origin": [
                  94,
                  303
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/10.png",
                "delay": 60,
                "origin": [
                  86,
                  305
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/11.png",
                "delay": 60,
                "origin": [
                  178,
                  318
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/12.png",
                "delay": 60,
                "origin": [
                  220,
                  363
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/13.png",
                "delay": 60,
                "origin": [
                  219,
                  363
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/14.png",
                "delay": 60,
                "origin": [
                  204,
                  354
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/15.png",
                "delay": 60,
                "origin": [
                  219,
                  349
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/16.png",
                "delay": 60,
                "origin": [
                  203,
                  358
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/17.png",
                "delay": 60,
                "origin": [
                  221,
                  359
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/18.png",
                "delay": 60,
                "origin": [
                  208,
                  353
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/19.png",
                "delay": 60,
                "origin": [
                  214,
                  352
                ]
              },
              {
                "src": "images/skills/222/2221007/effect0/20.png",
                "delay": 60,
                "origin": [
                  180,
                  331
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/222/2221007/hit/0.png",
                "delay": 60,
                "origin": [
                  93,
                  92
                ]
              },
              {
                "src": "images/skills/222/2221007/hit/1.png",
                "delay": 60,
                "origin": [
                  145,
                  141
                ]
              },
              {
                "src": "images/skills/222/2221007/hit/2.png",
                "delay": 60,
                "origin": [
                  139,
                  151
                ]
              },
              {
                "src": "images/skills/222/2221007/hit/3.png",
                "delay": 60,
                "origin": [
                  156,
                  145
                ]
              },
              {
                "src": "images/skills/222/2221007/hit/4.png",
                "delay": 60,
                "origin": [
                  160,
                  149
                ]
              },
              {
                "src": "images/skills/222/2221007/hit/5.png",
                "delay": 60,
                "origin": [
                  147,
                  136
                ]
              }
            ],
            "tiles": [
              {
                "id": 0,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/0/0.png",
                    "delay": 60,
                    "origin": [
                      62,
                      182
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/1.png",
                    "delay": 60,
                    "origin": [
                      110,
                      222
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/2.png",
                    "delay": 60,
                    "origin": [
                      123,
                      241
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/3.png",
                    "delay": 60,
                    "origin": [
                      130,
                      244
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/4.png",
                    "delay": 60,
                    "origin": [
                      140,
                      244
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/5.png",
                    "delay": 60,
                    "origin": [
                      147,
                      244
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/6.png",
                    "delay": 60,
                    "origin": [
                      154,
                      244
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/7.png",
                    "delay": 60,
                    "origin": [
                      159,
                      267
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/8.png",
                    "delay": 60,
                    "origin": [
                      164,
                      263
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/9.png",
                    "delay": 60,
                    "origin": [
                      160,
                      239
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/10.png",
                    "delay": 60,
                    "origin": [
                      140,
                      238
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/11.png",
                    "delay": 60,
                    "origin": [
                      134,
                      249
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/12.png",
                    "delay": 60,
                    "origin": [
                      134,
                      232
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/13.png",
                    "delay": 60,
                    "origin": [
                      283,
                      230
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/14.png",
                    "delay": 60,
                    "origin": [
                      275,
                      287
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/15.png",
                    "delay": 60,
                    "origin": [
                      274,
                      301
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/16.png",
                    "delay": 60,
                    "origin": [
                      273,
                      319
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/17.png",
                    "delay": 60,
                    "origin": [
                      274,
                      333
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/18.png",
                    "delay": 60,
                    "origin": [
                      274,
                      343
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/19.png",
                    "delay": 60,
                    "origin": [
                      274,
                      351
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/20.png",
                    "delay": 60,
                    "origin": [
                      208,
                      356
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/0/21.png",
                    "delay": 60,
                    "origin": [
                      195,
                      293
                    ]
                  }
                ]
              },
              {
                "id": 1,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/1/0.png",
                    "delay": 60,
                    "origin": [
                      62,
                      324
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/1.png",
                    "delay": 60,
                    "origin": [
                      110,
                      364
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/2.png",
                    "delay": 60,
                    "origin": [
                      123,
                      383
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/3.png",
                    "delay": 60,
                    "origin": [
                      130,
                      386
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/4.png",
                    "delay": 60,
                    "origin": [
                      140,
                      386
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/5.png",
                    "delay": 60,
                    "origin": [
                      147,
                      386
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/6.png",
                    "delay": 60,
                    "origin": [
                      154,
                      386
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/7.png",
                    "delay": 60,
                    "origin": [
                      159,
                      409
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/8.png",
                    "delay": 60,
                    "origin": [
                      164,
                      405
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/9.png",
                    "delay": 60,
                    "origin": [
                      160,
                      381
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/10.png",
                    "delay": 60,
                    "origin": [
                      140,
                      380
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/11.png",
                    "delay": 60,
                    "origin": [
                      134,
                      391
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/12.png",
                    "delay": 60,
                    "origin": [
                      134,
                      374
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/13.png",
                    "delay": 60,
                    "origin": [
                      129,
                      372
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/14.png",
                    "delay": 60,
                    "origin": [
                      120,
                      366
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/15.png",
                    "delay": 60,
                    "origin": [
                      283,
                      359
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/16.png",
                    "delay": 60,
                    "origin": [
                      275,
                      363
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/17.png",
                    "delay": 60,
                    "origin": [
                      274,
                      368
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/18.png",
                    "delay": 60,
                    "origin": [
                      273,
                      371
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/19.png",
                    "delay": 60,
                    "origin": [
                      274,
                      374
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/20.png",
                    "delay": 60,
                    "origin": [
                      274,
                      374
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/21.png",
                    "delay": 60,
                    "origin": [
                      274,
                      374
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/22.png",
                    "delay": 60,
                    "origin": [
                      208,
                      374
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/1/23.png",
                    "delay": 60,
                    "origin": [
                      195,
                      374
                    ]
                  }
                ]
              },
              {
                "id": 2,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/2/0.png",
                    "delay": 60,
                    "origin": [
                      62,
                      466
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/1.png",
                    "delay": 60,
                    "origin": [
                      110,
                      506
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/2.png",
                    "delay": 60,
                    "origin": [
                      123,
                      525
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/3.png",
                    "delay": 60,
                    "origin": [
                      130,
                      528
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/4.png",
                    "delay": 60,
                    "origin": [
                      140,
                      528
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/5.png",
                    "delay": 60,
                    "origin": [
                      147,
                      528
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/6.png",
                    "delay": 60,
                    "origin": [
                      154,
                      528
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/7.png",
                    "delay": 60,
                    "origin": [
                      159,
                      551
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/8.png",
                    "delay": 60,
                    "origin": [
                      164,
                      547
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/9.png",
                    "delay": 60,
                    "origin": [
                      160,
                      523
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/10.png",
                    "delay": 60,
                    "origin": [
                      140,
                      522
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/11.png",
                    "delay": 60,
                    "origin": [
                      134,
                      533
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/12.png",
                    "delay": 60,
                    "origin": [
                      134,
                      516
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/13.png",
                    "delay": 60,
                    "origin": [
                      129,
                      514
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/14.png",
                    "delay": 60,
                    "origin": [
                      120,
                      508
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/15.png",
                    "delay": 60,
                    "origin": [
                      121,
                      501
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/16.png",
                    "delay": 60,
                    "origin": [
                      283,
                      505
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/17.png",
                    "delay": 60,
                    "origin": [
                      275,
                      510
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/18.png",
                    "delay": 60,
                    "origin": [
                      274,
                      513
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/19.png",
                    "delay": 60,
                    "origin": [
                      273,
                      516
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/20.png",
                    "delay": 60,
                    "origin": [
                      274,
                      516
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/21.png",
                    "delay": 60,
                    "origin": [
                      274,
                      516
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/22.png",
                    "delay": 60,
                    "origin": [
                      274,
                      516
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/23.png",
                    "delay": 60,
                    "origin": [
                      208,
                      516
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/2/24.png",
                    "delay": 60,
                    "origin": [
                      195,
                      500
                    ]
                  }
                ]
              },
              {
                "id": 3,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/3/0.png",
                    "delay": 60,
                    "origin": [
                      83,
                      260
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/1.png",
                    "delay": 60,
                    "origin": [
                      145,
                      312
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/2.png",
                    "delay": 60,
                    "origin": [
                      163,
                      336
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/3.png",
                    "delay": 60,
                    "origin": [
                      171,
                      341
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/4.png",
                    "delay": 60,
                    "origin": [
                      184,
                      341
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/5.png",
                    "delay": 60,
                    "origin": [
                      196,
                      341
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/6.png",
                    "delay": 60,
                    "origin": [
                      203,
                      341
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/7.png",
                    "delay": 60,
                    "origin": [
                      210,
                      366
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/8.png",
                    "delay": 60,
                    "origin": [
                      216,
                      362
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/9.png",
                    "delay": 60,
                    "origin": [
                      211,
                      334
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/10.png",
                    "delay": 60,
                    "origin": [
                      185,
                      332
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/11.png",
                    "delay": 60,
                    "origin": [
                      176,
                      343
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/12.png",
                    "delay": 60,
                    "origin": [
                      176,
                      325
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/13.png",
                    "delay": 60,
                    "origin": [
                      323,
                      322
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/14.png",
                    "delay": 60,
                    "origin": [
                      313,
                      328
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/15.png",
                    "delay": 60,
                    "origin": [
                      313,
                      343
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/16.png",
                    "delay": 60,
                    "origin": [
                      311,
                      364
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/17.png",
                    "delay": 60,
                    "origin": [
                      312,
                      380
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/18.png",
                    "delay": 60,
                    "origin": [
                      312,
                      392
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/19.png",
                    "delay": 60,
                    "origin": [
                      313,
                      401
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/20.png",
                    "delay": 60,
                    "origin": [
                      237,
                      406
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/3/21.png",
                    "delay": 60,
                    "origin": [
                      222,
                      334
                    ]
                  }
                ]
              },
              {
                "id": 4,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/4/0.png",
                    "delay": 60,
                    "origin": [
                      83,
                      424
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/1.png",
                    "delay": 60,
                    "origin": [
                      145,
                      476
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/2.png",
                    "delay": 60,
                    "origin": [
                      163,
                      500
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/3.png",
                    "delay": 60,
                    "origin": [
                      171,
                      505
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/4.png",
                    "delay": 60,
                    "origin": [
                      184,
                      505
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/5.png",
                    "delay": 60,
                    "origin": [
                      196,
                      505
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/6.png",
                    "delay": 60,
                    "origin": [
                      203,
                      505
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/7.png",
                    "delay": 60,
                    "origin": [
                      210,
                      530
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/8.png",
                    "delay": 60,
                    "origin": [
                      216,
                      526
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/9.png",
                    "delay": 60,
                    "origin": [
                      211,
                      498
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/10.png",
                    "delay": 60,
                    "origin": [
                      185,
                      496
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/11.png",
                    "delay": 60,
                    "origin": [
                      176,
                      507
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/12.png",
                    "delay": 60,
                    "origin": [
                      176,
                      489
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/13.png",
                    "delay": 60,
                    "origin": [
                      171,
                      486
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/14.png",
                    "delay": 60,
                    "origin": [
                      159,
                      479
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/15.png",
                    "delay": 60,
                    "origin": [
                      323,
                      470
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/16.png",
                    "delay": 60,
                    "origin": [
                      313,
                      475
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/17.png",
                    "delay": 60,
                    "origin": [
                      313,
                      481
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/18.png",
                    "delay": 60,
                    "origin": [
                      311,
                      485
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/19.png",
                    "delay": 60,
                    "origin": [
                      312,
                      489
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/20.png",
                    "delay": 60,
                    "origin": [
                      312,
                      489
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/21.png",
                    "delay": 60,
                    "origin": [
                      313,
                      489
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/22.png",
                    "delay": 60,
                    "origin": [
                      237,
                      489
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/4/23.png",
                    "delay": 60,
                    "origin": [
                      222,
                      489
                    ]
                  }
                ]
              },
              {
                "id": 5,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/5/0.png",
                    "delay": 60,
                    "origin": [
                      83,
                      601
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/1.png",
                    "delay": 60,
                    "origin": [
                      145,
                      653
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/2.png",
                    "delay": 60,
                    "origin": [
                      163,
                      677
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/3.png",
                    "delay": 60,
                    "origin": [
                      171,
                      682
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/4.png",
                    "delay": 60,
                    "origin": [
                      184,
                      682
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/5.png",
                    "delay": 60,
                    "origin": [
                      196,
                      682
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/6.png",
                    "delay": 60,
                    "origin": [
                      203,
                      682
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/7.png",
                    "delay": 60,
                    "origin": [
                      210,
                      707
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/8.png",
                    "delay": 60,
                    "origin": [
                      216,
                      703
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/9.png",
                    "delay": 60,
                    "origin": [
                      211,
                      675
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/10.png",
                    "delay": 60,
                    "origin": [
                      185,
                      673
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/11.png",
                    "delay": 60,
                    "origin": [
                      176,
                      684
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/12.png",
                    "delay": 60,
                    "origin": [
                      176,
                      666
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/13.png",
                    "delay": 60,
                    "origin": [
                      171,
                      663
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/14.png",
                    "delay": 60,
                    "origin": [
                      159,
                      656
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/15.png",
                    "delay": 60,
                    "origin": [
                      160,
                      647
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/16.png",
                    "delay": 60,
                    "origin": [
                      323,
                      652
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/17.png",
                    "delay": 60,
                    "origin": [
                      313,
                      658
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/18.png",
                    "delay": 60,
                    "origin": [
                      313,
                      662
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/19.png",
                    "delay": 60,
                    "origin": [
                      311,
                      666
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/20.png",
                    "delay": 60,
                    "origin": [
                      312,
                      666
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/21.png",
                    "delay": 60,
                    "origin": [
                      312,
                      666
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/22.png",
                    "delay": 60,
                    "origin": [
                      313,
                      666
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/23.png",
                    "delay": 60,
                    "origin": [
                      237,
                      666
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/5/24.png",
                    "delay": 60,
                    "origin": [
                      222,
                      645
                    ]
                  }
                ]
              },
              {
                "id": 6,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/6/0.png",
                    "delay": 60,
                    "origin": [
                      109,
                      311
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/1.png",
                    "delay": 60,
                    "origin": [
                      188,
                      378
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/2.png",
                    "delay": 60,
                    "origin": [
                      211,
                      409
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/3.png",
                    "delay": 60,
                    "origin": [
                      222,
                      415
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/4.png",
                    "delay": 60,
                    "origin": [
                      238,
                      415
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/5.png",
                    "delay": 60,
                    "origin": [
                      253,
                      415
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/6.png",
                    "delay": 60,
                    "origin": [
                      262,
                      415
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/7.png",
                    "delay": 60,
                    "origin": [
                      271,
                      465
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/8.png",
                    "delay": 60,
                    "origin": [
                      279,
                      460
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/9.png",
                    "delay": 60,
                    "origin": [
                      273,
                      410
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/10.png",
                    "delay": 60,
                    "origin": [
                      239,
                      404
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/11.png",
                    "delay": 60,
                    "origin": [
                      228,
                      435
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/12.png",
                    "delay": 60,
                    "origin": [
                      228,
                      395
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/13.png",
                    "delay": 60,
                    "origin": [
                      402,
                      391
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/14.png",
                    "delay": 60,
                    "origin": [
                      390,
                      410
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/15.png",
                    "delay": 60,
                    "origin": [
                      389,
                      429
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/16.png",
                    "delay": 60,
                    "origin": [
                      387,
                      455
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/17.png",
                    "delay": 60,
                    "origin": [
                      388,
                      475
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/18.png",
                    "delay": 60,
                    "origin": [
                      388,
                      490
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/19.png",
                    "delay": 60,
                    "origin": [
                      389,
                      501
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/20.png",
                    "delay": 60,
                    "origin": [
                      294,
                      508
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/6/21.png",
                    "delay": 60,
                    "origin": [
                      276,
                      417
                    ]
                  }
                ]
              },
              {
                "id": 7,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/7/0.png",
                    "delay": 60,
                    "origin": [
                      109,
                      517
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/1.png",
                    "delay": 60,
                    "origin": [
                      188,
                      584
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/2.png",
                    "delay": 60,
                    "origin": [
                      211,
                      615
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/3.png",
                    "delay": 60,
                    "origin": [
                      222,
                      621
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/4.png",
                    "delay": 60,
                    "origin": [
                      238,
                      621
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/5.png",
                    "delay": 60,
                    "origin": [
                      253,
                      621
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/6.png",
                    "delay": 60,
                    "origin": [
                      262,
                      621
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/7.png",
                    "delay": 60,
                    "origin": [
                      271,
                      671
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/8.png",
                    "delay": 60,
                    "origin": [
                      279,
                      666
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/9.png",
                    "delay": 60,
                    "origin": [
                      273,
                      616
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/10.png",
                    "delay": 60,
                    "origin": [
                      239,
                      610
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/11.png",
                    "delay": 60,
                    "origin": [
                      228,
                      641
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/12.png",
                    "delay": 60,
                    "origin": [
                      228,
                      601
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/13.png",
                    "delay": 60,
                    "origin": [
                      221,
                      597
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/14.png",
                    "delay": 60,
                    "origin": [
                      206,
                      588
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/15.png",
                    "delay": 60,
                    "origin": [
                      402,
                      576
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/16.png",
                    "delay": 60,
                    "origin": [
                      390,
                      583
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/17.png",
                    "delay": 60,
                    "origin": [
                      389,
                      590
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/18.png",
                    "delay": 60,
                    "origin": [
                      387,
                      596
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/19.png",
                    "delay": 60,
                    "origin": [
                      388,
                      601
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/20.png",
                    "delay": 60,
                    "origin": [
                      388,
                      601
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/21.png",
                    "delay": 60,
                    "origin": [
                      389,
                      601
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/22.png",
                    "delay": 60,
                    "origin": [
                      294,
                      601
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/7/23.png",
                    "delay": 60,
                    "origin": [
                      276,
                      601
                    ]
                  }
                ]
              },
              {
                "id": 8,
                "frames": [
                  {
                    "src": "images/skills/222/2221007/tile/8/0.png",
                    "delay": 60,
                    "origin": [
                      109,
                      759
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/1.png",
                    "delay": 60,
                    "origin": [
                      188,
                      826
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/2.png",
                    "delay": 60,
                    "origin": [
                      211,
                      857
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/3.png",
                    "delay": 60,
                    "origin": [
                      222,
                      863
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/4.png",
                    "delay": 60,
                    "origin": [
                      238,
                      863
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/5.png",
                    "delay": 60,
                    "origin": [
                      253,
                      863
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/6.png",
                    "delay": 60,
                    "origin": [
                      262,
                      863
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/7.png",
                    "delay": 60,
                    "origin": [
                      271,
                      913
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/8.png",
                    "delay": 60,
                    "origin": [
                      279,
                      908
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/9.png",
                    "delay": 60,
                    "origin": [
                      273,
                      858
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/10.png",
                    "delay": 60,
                    "origin": [
                      239,
                      852
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/11.png",
                    "delay": 60,
                    "origin": [
                      228,
                      883
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/12.png",
                    "delay": 60,
                    "origin": [
                      228,
                      843
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/13.png",
                    "delay": 60,
                    "origin": [
                      221,
                      839
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/14.png",
                    "delay": 60,
                    "origin": [
                      206,
                      830
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/15.png",
                    "delay": 60,
                    "origin": [
                      207,
                      818
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/16.png",
                    "delay": 60,
                    "origin": [
                      402,
                      825
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/17.png",
                    "delay": 60,
                    "origin": [
                      390,
                      832
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/18.png",
                    "delay": 60,
                    "origin": [
                      389,
                      838
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/19.png",
                    "delay": 60,
                    "origin": [
                      387,
                      843
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/20.png",
                    "delay": 60,
                    "origin": [
                      388,
                      843
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/21.png",
                    "delay": 60,
                    "origin": [
                      388,
                      843
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/22.png",
                    "delay": 60,
                    "origin": [
                      389,
                      843
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/23.png",
                    "delay": 60,
                    "origin": [
                      294,
                      843
                    ]
                  },
                  {
                    "src": "images/skills/222/2221007/tile/8/24.png",
                    "delay": 60,
                    "origin": [
                      291,
                      827
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "id": "2221008",
          "name": "楓葉淨化　",
          "desc": "集中精神，以解除狀態異常。使用後，在3秒內對狀態異常免疫。但不適用於部分狀態異常效果，且不適用於戰鬥命令。\\n即使在使用其他技能時，也可使用勇士的意志。",
          "h": "消耗MP #mpCon，再次使用冷卻時間 #cooltime秒",
          "rank": "100",
          "type": "buff",
          "equipable": true,
          "maxLevel": 5,
          "infoType": 35,
          "actions": [],
          "common": {
            "maxLevel": "5",
            "mpCon": "30",
            "cooltime": "600-60*x",
            "time": "1"
          },
          "icon": "images/skills/222/2221008.png",
          "skillBook": 222,
          "fx": {
            "effect": [
              {
                "src": "images/skills/222/2221008/effect/0.png",
                "delay": 60,
                "origin": [
                  95,
                  241
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/1.png",
                "delay": 60,
                "origin": [
                  97,
                  237
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/2.png",
                "delay": 60,
                "origin": [
                  101,
                  242
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/3.png",
                "delay": 60,
                "origin": [
                  103,
                  249
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/4.png",
                "delay": 60,
                "origin": [
                  103,
                  248
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/5.png",
                "delay": 60,
                "origin": [
                  104,
                  244
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/6.png",
                "delay": 60,
                "origin": [
                  137,
                  238
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/7.png",
                "delay": 60,
                "origin": [
                  194,
                  246
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/8.png",
                "delay": 60,
                "origin": [
                  131,
                  247
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/9.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/10.png",
                "delay": 60,
                "origin": [
                  132,
                  248
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/11.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/12.png",
                "delay": 60,
                "origin": [
                  133,
                  249
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/13.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/14.png",
                "delay": 60,
                "origin": [
                  133,
                  248
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/15.png",
                "delay": 60,
                "origin": [
                  57,
                  246
                ]
              },
              {
                "src": "images/skills/222/2221008/effect/16.png",
                "delay": 60,
                "origin": [
                  55,
                  200
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/222/2221008/effect0/0.png",
                "delay": 360,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/1.png",
                "delay": 60,
                "origin": [
                  145,
                  267
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/2.png",
                "delay": 60,
                "origin": [
                  145,
                  264
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/3.png",
                "delay": 60,
                "origin": [
                  145,
                  256
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/4.png",
                "delay": 60,
                "origin": [
                  145,
                  262
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/5.png",
                "delay": 60,
                "origin": [
                  129,
                  265
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/6.png",
                "delay": 60,
                "origin": [
                  140,
                  265
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/7.png",
                "delay": 60,
                "origin": [
                  141,
                  265
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/8.png",
                "delay": 60,
                "origin": [
                  129,
                  262
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/9.png",
                "delay": 60,
                "origin": [
                  127,
                  258
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/10.png",
                "delay": 60,
                "origin": [
                  114,
                  250
                ]
              },
              {
                "src": "images/skills/222/2221008/effect0/11.png",
                "delay": 60,
                "origin": [
                  101,
                  246
                ]
              }
            ]
          }
        },
        {
          "id": "2221011",
          "name": "冰龍吐息",
          "desc": "利用強烈的冷氣凍結敵人與自己，#c並呈現無法行動的狀態，持續降低敵人的防禦率#。\\n受攻擊的敵人會在90秒內抵抗無法行動異常狀態，而不會受冰龍吐息與其他技能造成的無法行動狀態異常影響。冰屬性的攻擊。",
          "h": "消耗MP#mpCon，自己會成為無敵狀態，最多對 #mobCount名敵人以#damage%的傷害攻擊 #attackCount次後，造成 #time秒內無法行動的狀態，並減少#c魔法防禦率 #w%、物理防禦率#v%# 。\\n依照冰龍吐息對敵人造成的傷害增加無法行動的持續時間，最多增加 100%\\n若沒有對敵人造成無法行動的狀態異常，就不會造成傷害。\\n持續下壓按鍵時，最多可以維持 #q秒。冷卻時間 #cooltime秒",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 1,
          "actions": [
            "armorMelting"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "15+d(x/4)",
            "mobCount": "8",
            "x": "-10-d(x/6)",
            "y": "-20-d(x/3)",
            "time": "10+d(x/10)",
            "q": "7+d(x/10)",
            "cooltime": "120",
            "z": "x",
            "lt": "-530, -190",
            "rb": "20, 40",
            "damage": "50+x",
            "attackCount": "4",
            "v": "10+d(x/6)",
            "w": "20+d(x/3)"
          },
          "icon": "images/skills/222/2221011.png",
          "skillBook": 222,
          "channelCast": {
            "prepareMs": 240,
            "keydownLoopMs": 1440,
            "channelSecKey": "q",
            "tickMsKey": "s",
            "tickMs": 500,
            "sideFx": "keydown0",
            "sideOffset": [
              150,
              -50
            ]
          },
          "fx": {
            "prepare": [
              {
                "src": "images/skills/222/2221011/prepare/0.png",
                "delay": 60,
                "origin": [
                  158,
                  429
                ]
              },
              {
                "src": "images/skills/222/2221011/prepare/1.png",
                "delay": 60,
                "origin": [
                  152,
                  429
                ]
              },
              {
                "src": "images/skills/222/2221011/prepare/2.png",
                "delay": 60,
                "origin": [
                  152,
                  429
                ]
              },
              {
                "src": "images/skills/222/2221011/prepare/3.png",
                "delay": 60,
                "origin": [
                  187,
                  429
                ]
              }
            ],
            "prepareMeta": {
              "timeMs": 240
            },
            "keydown": [
              {
                "src": "images/skills/222/2221011/keydown/0.png",
                "delay": 60,
                "origin": [
                  674,
                  431
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/1.png",
                "delay": 60,
                "origin": [
                  687,
                  430
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/2.png",
                "delay": 60,
                "origin": [
                  700,
                  429
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/3.png",
                "delay": 60,
                "origin": [
                  631,
                  429
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/4.png",
                "delay": 60,
                "origin": [
                  639,
                  499
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/5.png",
                "delay": 60,
                "origin": [
                  663,
                  497
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/6.png",
                "delay": 60,
                "origin": [
                  683,
                  492
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/7.png",
                "delay": 60,
                "origin": [
                  698,
                  489
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/8.png",
                "delay": 60,
                "origin": [
                  634,
                  488
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown/9.png",
                "delay": 60,
                "origin": [
                  653,
                  429
                ]
              }
            ],
            "keydownMeta": {
              "timeMs": 1440
            },
            "keydown0": [
              {
                "src": "images/skills/222/2221011/keydown0/0.png",
                "delay": 120,
                "origin": [
                  178,
                  136
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown0/1.png",
                "delay": 120,
                "origin": [
                  180,
                  136
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown0/2.png",
                "delay": 120,
                "origin": [
                  179,
                  137
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown0/3.png",
                "delay": 120,
                "origin": [
                  178,
                  136
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown0/4.png",
                "delay": 120,
                "origin": [
                  177,
                  134
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown0/5.png",
                "delay": 120,
                "origin": [
                  176,
                  133
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown0/6.png",
                "delay": 120,
                "origin": [
                  177,
                  134
                ]
              },
              {
                "src": "images/skills/222/2221011/keydown0/7.png",
                "delay": 120,
                "origin": [
                  178,
                  136
                ]
              }
            ],
            "keydown0Meta": {
              "timeMs": 960
            },
            "keydownend": [
              {
                "src": "images/skills/222/2221011/keydownend/0.png",
                "delay": 60,
                "origin": [
                  674,
                  431
                ]
              },
              {
                "src": "images/skills/222/2221011/keydownend/1.png",
                "delay": 60,
                "origin": [
                  687,
                  430
                ]
              },
              {
                "src": "images/skills/222/2221011/keydownend/2.png",
                "delay": 60,
                "origin": [
                  677,
                  426
                ]
              },
              {
                "src": "images/skills/222/2221011/keydownend/3.png",
                "delay": 60,
                "origin": [
                  597,
                  423
                ]
              },
              {
                "src": "images/skills/222/2221011/keydownend/4.png",
                "delay": 60,
                "origin": [
                  644,
                  353
                ]
              }
            ],
            "keydownendMeta": {
              "timeMs": 600
            }
          }
        },
        {
          "id": "2221012",
          "name": "冰鋒刃",
          "desc": "撒落冰碎片來生成能對周圍造成冰屬性傷害的冰凍之珠，並投擲到前方。冰珠碰到敵人會使動作明顯變慢。就算攻擊會反射攻勢狀態的敵人也不會受到傷害。",
          "h": "消耗MP#mpCon，生成的冰凍之珠會撒落可對最多#mobCount名的敵人造成#damage%傷害的冰碎片\\n冷卻時間 #cooltime秒",
          "rank": "100",
          "type": "active",
          "equipable": true,
          "maxLevel": 30,
          "infoType": 2,
          "areaAttack": true,
          "actions": [
            "frozenOrb"
          ],
          "common": {
            "maxLevel": "30",
            "mpCon": "40+d(x/3)",
            "damage": "100+4*x",
            "mobCount": "8",
            "attackCount": "1",
            "x": "1800",
            "time": "4000",
            "cooltime": "5",
            "lt": "-260, -220",
            "rb": "130, 150",
            "s": "-15",
            "v": "-75",
            "subTime": "8",
            "attackDelay": "210"
          },
          "icon": "images/skills/222/2221012.png",
          "skillBook": 222,
          "ballCast": {
            "launchFrame": 8,
            "launchMs": 240,
            "ballMode": "orb",
            "travel": "horizontal",
            "travelDistancePx": 360,
            "durationMs": 4000,
            "tickMs": 480,
            "aoeRadius": 150,
            "specialOnFirstHit": false,
            "aoeOnSpecial": false,
            "chain": false,
            "speedPxPerMs": 0.55
          },
          "fx": {
            "effect": [
              {
                "src": "images/skills/222/2221012/effect/0.png",
                "delay": 30,
                "origin": [
                  437,
                  404
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/1.png",
                "delay": 30,
                "origin": [
                  436,
                  409
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/2.png",
                "delay": 30,
                "origin": [
                  437,
                  414
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/3.png",
                "delay": 30,
                "origin": [
                  436,
                  407
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/4.png",
                "delay": 30,
                "origin": [
                  436,
                  409
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/5.png",
                "delay": 30,
                "origin": [
                  437,
                  409
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/6.png",
                "delay": 30,
                "origin": [
                  437,
                  405
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/7.png",
                "delay": 30,
                "origin": [
                  435,
                  385
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/8.png",
                "delay": 60,
                "origin": [
                  366,
                  295
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/9.png",
                "delay": 60,
                "origin": [
                  345,
                  284
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/10.png",
                "delay": 60,
                "origin": [
                  324,
                  265
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/11.png",
                "delay": 60,
                "origin": [
                  324,
                  263
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/12.png",
                "delay": 60,
                "origin": [
                  324,
                  263
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/13.png",
                "delay": 60,
                "origin": [
                  402,
                  259
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/14.png",
                "delay": 60,
                "origin": [
                  389,
                  301
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/15.png",
                "delay": 60,
                "origin": [
                  391,
                  274
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/16.png",
                "delay": 60,
                "origin": [
                  395,
                  247
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/17.png",
                "delay": 60,
                "origin": [
                  392,
                  248
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/18.png",
                "delay": 60,
                "origin": [
                  390,
                  249
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/19.png",
                "delay": 60,
                "origin": [
                  390,
                  247
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/20.png",
                "delay": 60,
                "origin": [
                  391,
                  243
                ]
              },
              {
                "src": "images/skills/222/2221012/effect/21.png",
                "delay": 60,
                "origin": [
                  389,
                  238
                ]
              }
            ],
            "hit": [
              {
                "src": "images/skills/222/2221012/hit/0.png",
                "delay": 60,
                "origin": [
                  57,
                  75
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/1.png",
                "delay": 60,
                "origin": [
                  101,
                  91
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/2.png",
                "delay": 60,
                "origin": [
                  91,
                  91
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/3.png",
                "delay": 60,
                "origin": [
                  91,
                  90
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/4.png",
                "delay": 60,
                "origin": [
                  88,
                  87
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/5.png",
                "delay": 60,
                "origin": [
                  87,
                  86
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/6.png",
                "delay": 60,
                "origin": [
                  86,
                  86
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/7.png",
                "delay": 60,
                "origin": [
                  85,
                  86
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/8.png",
                "delay": 60,
                "origin": [
                  85,
                  86
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/9.png",
                "delay": 60,
                "origin": [
                  84,
                  86
                ]
              },
              {
                "src": "images/skills/222/2221012/hit/10.png",
                "delay": 60,
                "origin": [
                  83,
                  86
                ]
              }
            ],
            "ball": {
              "frames": [
                {
                  "src": "images/skills/222/2221012/ball/0.png",
                  "delay": 60,
                  "origin": [
                    394,
                    314
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/1.png",
                  "delay": 60,
                  "origin": [
                    394,
                    310
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/2.png",
                  "delay": 60,
                  "origin": [
                    394,
                    310
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/3.png",
                  "delay": 60,
                  "origin": [
                    394,
                    310
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/4.png",
                  "delay": 60,
                  "origin": [
                    394,
                    310
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/5.png",
                  "delay": 60,
                  "origin": [
                    419,
                    310
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/6.png",
                  "delay": 60,
                  "origin": [
                    436,
                    310
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/7.png",
                  "delay": 60,
                  "origin": [
                    394,
                    310
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/8.png",
                  "delay": 60,
                  "origin": [
                    394,
                    324
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/9.png",
                  "delay": 60,
                  "origin": [
                    394,
                    332
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/10.png",
                  "delay": 60,
                  "origin": [
                    394,
                    310
                  ]
                },
                {
                  "src": "images/skills/222/2221012/ball/11.png",
                  "delay": 60,
                  "origin": [
                    394,
                    319
                  ]
                }
              ]
            }
          }
        },
        {
          "id": "2221045",
          "name": "瞬間移動精通-提升距離",
          "desc": "大幅增加瞬間移動的移動距離瞬間移動爆發的效果不重複套用。\\n使用技能時效果會啟用，再次使用時會關閉的#c開關技能#",
          "h": "移動距離 #x增加",
          "rank": "hyper",
          "type": "passive",
          "equipable": false,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 180,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "x": "100"
          },
          "icon": "images/skills/222/2221045.png",
          "skillBook": 222,
          "hyper": 1
        },
        {
          "id": "2221052",
          "name": "雷霆萬鈞",
          "desc": "朝前方召喚巨大的電球，並對怪物造成持續傷害。就算對攻擊反射狀態的敵方進行攻擊也不會受到傷害。使用技能期間不會被任何攻擊擊退，且不會陷入致命異常狀態。",
          "h": "長壓技能，每次攻擊消耗MP#mpCon，以固定間隔對最多#mobCount名敵人造成#damage%傷害，攻擊#attackCount次，最多可按住#q秒，釋放按鍵時發動以#x%傷害攻擊#w次的最後一擊\\n長壓期間包括造成最大HP一定比例傷害的攻擊在內，受擊傷害減少#s5%\\n冷卻時間 #cooltime秒",
          "rank": "hyper",
          "type": "active",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 1,
          "reqLevel": 160,
          "actions": [
            "HY222lightningSphere"
          ],
          "common": {
            "maxLevel": "1",
            "mpCon": "30",
            "damage": "135",
            "attackCount": "15",
            "mobCount": "15",
            "x": "702",
            "cooltime": "60",
            "lt": "-450, -350",
            "rb": "50, 50",
            "q": "2",
            "w": "15",
            "s": "2000",
            "s2": "140",
            "s5": "50"
          },
          "icon": "images/skills/222/2221052.png",
          "skillBook": 222,
          "hyper": 2,
          "channelCast": {
            "prepareMs": 780,
            "keydownLoopMs": 960,
            "channelSecKey": "q",
            "tickMsKey": "s",
            "tickMs": 100,
            "sideFx": "special",
            "sideOffset": [
              150,
              -50
            ]
          },
          "fx": {
            "hit": [
              {
                "src": "images/skills/222/2221052/hit/0.png",
                "delay": 60,
                "origin": [
                  66,
                  62
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/1.png",
                "delay": 60,
                "origin": [
                  89,
                  103
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/2.png",
                "delay": 60,
                "origin": [
                  97,
                  102
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/3.png",
                "delay": 60,
                "origin": [
                  101,
                  108
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/4.png",
                "delay": 60,
                "origin": [
                  102,
                  108
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/5.png",
                "delay": 60,
                "origin": [
                  104,
                  108
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/6.png",
                "delay": 60,
                "origin": [
                  104,
                  108
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/7.png",
                "delay": 60,
                "origin": [
                  103,
                  108
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/8.png",
                "delay": 60,
                "origin": [
                  103,
                  108
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/9.png",
                "delay": 60,
                "origin": [
                  103,
                  105
                ]
              },
              {
                "src": "images/skills/222/2221052/hit/10.png",
                "delay": 60,
                "origin": [
                  77,
                  75
                ]
              }
            ],
            "special": {
              "frames": [
                {
                  "src": "images/skills/222/2221052/special/0.png",
                  "delay": 60,
                  "origin": [
                    81,
                    76
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/1.png",
                  "delay": 60,
                  "origin": [
                    111,
                    117
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/2.png",
                  "delay": 60,
                  "origin": [
                    121,
                    132
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/3.png",
                  "delay": 60,
                  "origin": [
                    127,
                    140
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/4.png",
                  "delay": 60,
                  "origin": [
                    128,
                    140
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/5.png",
                  "delay": 60,
                  "origin": [
                    130,
                    140
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/6.png",
                  "delay": 60,
                  "origin": [
                    130,
                    140
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/7.png",
                  "delay": 60,
                  "origin": [
                    129,
                    140
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/8.png",
                  "delay": 60,
                  "origin": [
                    128,
                    140
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/9.png",
                  "delay": 60,
                  "origin": [
                    135,
                    137
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/10.png",
                  "delay": 60,
                  "origin": [
                    141,
                    122
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/11.png",
                  "delay": 60,
                  "origin": [
                    145,
                    116
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/12.png",
                  "delay": 60,
                  "origin": [
                    115,
                    112
                  ]
                },
                {
                  "src": "images/skills/222/2221052/special/13.png",
                  "delay": 60,
                  "origin": [
                    111,
                    101
                  ]
                }
              ],
              "repeat": 0,
              "relMove": [
                0,
                0
              ]
            },
            "prepare": [
              {
                "src": "images/skills/222/2221052/prepare/0.png",
                "delay": 60,
                "origin": [
                  334,
                  305
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/1.png",
                "delay": 60,
                "origin": [
                  358,
                  305
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/2.png",
                "delay": 60,
                "origin": [
                  367,
                  307
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/3.png",
                "delay": 60,
                "origin": [
                  371,
                  312
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/4.png",
                "delay": 60,
                "origin": [
                  492,
                  438
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/5.png",
                "delay": 60,
                "origin": [
                  494,
                  442
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/6.png",
                "delay": 60,
                "origin": [
                  498,
                  442
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/7.png",
                "delay": 60,
                "origin": [
                  498,
                  442
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/8.png",
                "delay": 60,
                "origin": [
                  498,
                  442
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/9.png",
                "delay": 60,
                "origin": [
                  498,
                  442
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/10.png",
                "delay": 60,
                "origin": [
                  498,
                  442
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/11.png",
                "delay": 60,
                "origin": [
                  518,
                  458
                ]
              },
              {
                "src": "images/skills/222/2221052/prepare/12.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              }
            ],
            "prepareMeta": {
              "timeMs": 780
            },
            "keydown": [
              {
                "src": "images/skills/222/2221052/keydown/0.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/1.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/2.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/3.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/4.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/5.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/6.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/7.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/8.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/9.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/10.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/11.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/12.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/13.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/14.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              },
              {
                "src": "images/skills/222/2221052/keydown/15.png",
                "delay": 60,
                "origin": [
                  540,
                  484
                ]
              }
            ],
            "keydownMeta": {
              "timeMs": 960
            },
            "keydownend": [
              {
                "src": "images/skills/222/2221052/keydownend/0.png",
                "delay": 60,
                "origin": [
                  584,
                  508
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/1.png",
                "delay": 60,
                "origin": [
                  780,
                  508
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/2.png",
                "delay": 60,
                "origin": [
                  818,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/3.png",
                "delay": 60,
                "origin": [
                  829,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/4.png",
                "delay": 60,
                "origin": [
                  829,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/5.png",
                "delay": 60,
                "origin": [
                  842,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/6.png",
                "delay": 60,
                "origin": [
                  848,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/7.png",
                "delay": 60,
                "origin": [
                  852,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/8.png",
                "delay": 60,
                "origin": [
                  849,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/9.png",
                "delay": 60,
                "origin": [
                  954,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/10.png",
                "delay": 60,
                "origin": [
                  952,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/11.png",
                "delay": 60,
                "origin": [
                  809,
                  521
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/12.png",
                "delay": 60,
                "origin": [
                  787,
                  493
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/13.png",
                "delay": 60,
                "origin": [
                  779,
                  437
                ]
              },
              {
                "src": "images/skills/222/2221052/keydownend/14.png",
                "delay": 60,
                "origin": [
                  751,
                  435
                ]
              }
            ],
            "keydownendMeta": {
              "timeMs": 900
            }
          }
        },
        {
          "id": "2221053",
          "name": "傳說冒險",
          "desc": "只有遊遍楓之谷世界每個角落的傳說中的冒險家才可使用的加持，可增加傷害。",
          "h": "消耗MP#mpCon，#time秒內傷害增加#indieDamR%。\\n只對隊員中的冒險家職業群產生效果\\n冷卻時間#cooltime秒",
          "rank": "hyper",
          "type": "buff",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 50,
          "reqLevel": 190,
          "actions": [],
          "common": {
            "maxLevel": "1",
            "mpCon": "100",
            "time": "60",
            "cooltime": "120",
            "indieDamR": "10",
            "lt": "-400, -300",
            "rb": "400, 300"
          },
          "icon": "images/skills/222/2221053.png",
          "skillBook": 222,
          "hyper": 2,
          "fx": {
            "effect": [
              {
                "src": "images/skills/222/2221053/effect/0.png",
                "delay": 360,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/1.png",
                "delay": 60,
                "origin": [
                  198,
                  141
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/2.png",
                "delay": 60,
                "origin": [
                  168,
                  143
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/3.png",
                "delay": 60,
                "origin": [
                  140,
                  204
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/4.png",
                "delay": 60,
                "origin": [
                  168,
                  270
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/5.png",
                "delay": 60,
                "origin": [
                  164,
                  282
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/6.png",
                "delay": 60,
                "origin": [
                  166,
                  302
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/7.png",
                "delay": 60,
                "origin": [
                  170,
                  308
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/8.png",
                "delay": 60,
                "origin": [
                  174,
                  315
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/9.png",
                "delay": 60,
                "origin": [
                  182,
                  315
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/10.png",
                "delay": 60,
                "origin": [
                  179,
                  369
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/11.png",
                "delay": 60,
                "origin": [
                  160,
                  312
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/12.png",
                "delay": 60,
                "origin": [
                  180,
                  312
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/13.png",
                "delay": 60,
                "origin": [
                  207,
                  364
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/14.png",
                "delay": 60,
                "origin": [
                  215,
                  130
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/15.png",
                "delay": 60,
                "origin": [
                  226,
                  119
                ]
              },
              {
                "src": "images/skills/222/2221053/effect/16.png",
                "delay": 60,
                "origin": [
                  172,
                  111
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/222/2221053/effect0/0.png",
                "delay": 60,
                "origin": [
                  182,
                  286
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/1.png",
                "delay": 60,
                "origin": [
                  158,
                  265
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/2.png",
                "delay": 60,
                "origin": [
                  133,
                  247
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/3.png",
                "delay": 60,
                "origin": [
                  111,
                  234
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/4.png",
                "delay": 60,
                "origin": [
                  113,
                  239
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/5.png",
                "delay": 60,
                "origin": [
                  112,
                  258
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/6.png",
                "delay": 60,
                "origin": [
                  122,
                  275
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/7.png",
                "delay": 60,
                "origin": [
                  128,
                  294
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/8.png",
                "delay": 60,
                "origin": [
                  173,
                  368
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/9.png",
                "delay": 60,
                "origin": [
                  332,
                  446
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/10.png",
                "delay": 60,
                "origin": [
                  333,
                  444
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/11.png",
                "delay": 60,
                "origin": [
                  333,
                  437
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/12.png",
                "delay": 60,
                "origin": [
                  329,
                  429
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/13.png",
                "delay": 60,
                "origin": [
                  326,
                  426
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/14.png",
                "delay": 60,
                "origin": [
                  325,
                  415
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/15.png",
                "delay": 60,
                "origin": [
                  322,
                  415
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/16.png",
                "delay": 60,
                "origin": [
                  321,
                  419
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/17.png",
                "delay": 60,
                "origin": [
                  320,
                  419
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/18.png",
                "delay": 60,
                "origin": [
                  319,
                  419
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/19.png",
                "delay": 60,
                "origin": [
                  316,
                  411
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/20.png",
                "delay": 60,
                "origin": [
                  313,
                  420
                ]
              },
              {
                "src": "images/skills/222/2221053/effect0/21.png",
                "delay": 60,
                "origin": [
                  309,
                  365
                ]
              }
            ]
          }
        },
        {
          "id": "2221054",
          "name": "冰霜狂怒",
          "desc": "懷抱嚴寒之怒，將寒冰的魔力提升至極限。",
          "h": "消耗#mpCon MP，持續#time秒\\nBuff持續過程中冰凍疊加上限增加至#x，每以冰凍屬性魔法攻擊1次，冰凍疊加數增加至#y\\n冷卻時間#cooltime秒",
          "rank": "hyper",
          "type": "buff",
          "equipable": true,
          "maxLevel": 1,
          "infoType": 0,
          "reqLevel": 140,
          "actions": [
            "glacialFury"
          ],
          "common": {
            "maxLevel": "1",
            "mpCon": "200",
            "time": "20",
            "x": "8",
            "y": "5",
            "cooltime": "60"
          },
          "icon": "images/skills/222/2221054.png",
          "skillBook": 222,
          "hyper": 2,
          "fx": {
            "effect": [
              {
                "src": "images/skills/222/2221054/effect/0.png",
                "delay": 60,
                "origin": [
                  241,
                  290
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/1.png",
                "delay": 60,
                "origin": [
                  203,
                  306
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/2.png",
                "delay": 60,
                "origin": [
                  197,
                  361
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/3.png",
                "delay": 60,
                "origin": [
                  194,
                  378
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/4.png",
                "delay": 60,
                "origin": [
                  190,
                  355
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/5.png",
                "delay": 60,
                "origin": [
                  291,
                  507
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/6.png",
                "delay": 60,
                "origin": [
                  314,
                  520
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/7.png",
                "delay": 60,
                "origin": [
                  318,
                  520
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/8.png",
                "delay": 60,
                "origin": [
                  319,
                  520
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/9.png",
                "delay": 60,
                "origin": [
                  316,
                  517
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/10.png",
                "delay": 60,
                "origin": [
                  316,
                  517
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/11.png",
                "delay": 60,
                "origin": [
                  312,
                  514
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/12.png",
                "delay": 60,
                "origin": [
                  311,
                  512
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/13.png",
                "delay": 60,
                "origin": [
                  299,
                  508
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/14.png",
                "delay": 60,
                "origin": [
                  256,
                  461
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/15.png",
                "delay": 60,
                "origin": [
                  251,
                  460
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/16.png",
                "delay": 60,
                "origin": [
                  218,
                  453
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/17.png",
                "delay": 60,
                "origin": [
                  216,
                  441
                ]
              },
              {
                "src": "images/skills/222/2221054/effect/18.png",
                "delay": 60,
                "origin": [
                  183,
                  385
                ]
              }
            ],
            "effect0": [
              {
                "src": "images/skills/222/2221054/effect0/0.png",
                "delay": 240,
                "origin": [
                  0,
                  0
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/1.png",
                "delay": 60,
                "origin": [
                  173,
                  123
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/2.png",
                "delay": 60,
                "origin": [
                  282,
                  472
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/3.png",
                "delay": 60,
                "origin": [
                  286,
                  491
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/4.png",
                "delay": 60,
                "origin": [
                  286,
                  494
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/5.png",
                "delay": 60,
                "origin": [
                  282,
                  494
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/6.png",
                "delay": 60,
                "origin": [
                  271,
                  492
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/7.png",
                "delay": 60,
                "origin": [
                  279,
                  492
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/8.png",
                "delay": 60,
                "origin": [
                  270,
                  491
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/9.png",
                "delay": 60,
                "origin": [
                  253,
                  491
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/10.png",
                "delay": 60,
                "origin": [
                  317,
                  491
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/11.png",
                "delay": 60,
                "origin": [
                  312,
                  492
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/12.png",
                "delay": 60,
                "origin": [
                  306,
                  491
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/13.png",
                "delay": 60,
                "origin": [
                  308,
                  492
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/14.png",
                "delay": 60,
                "origin": [
                  256,
                  492
                ]
              },
              {
                "src": "images/skills/222/2221054/effect0/15.png",
                "delay": 60,
                "origin": [
                  232,
                  492
                ]
              }
            ]
          }
        }
      ]
    }
  },
  "lines": {
    "warrior": {
      "id": "warrior",
      "name": "英雄線",
      "primaryJobId": 112,
      "books": [
        100,
        110,
        111,
        112
      ]
    },
    "mage": {
      "id": "mage",
      "name": "大魔導士（冰、雷）線",
      "primaryJobId": 222,
      "books": [
        200,
        220,
        221,
        222
      ]
    },
    "magef": {
      "id": "magef",
      "name": "大魔導士（火、毒）線",
      "primaryJobId": 212,
      "books": [
        200,
        210,
        211,
        212
      ]
    }
  }
};

if (typeof window !== 'undefined') {
  window.SkillJobData = SkillJobData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillJobData;
}
