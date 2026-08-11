/**
 * 裝備潛能強化方塊(其他)
 * 官方來源：https://maplestory-event.beanfun.com/eventad/eventad?eventadid=8630
 * 自動解析日期：2026-08-07
 * 請勿手動編輯；重新執行 scripts/parse-cube-rates.mjs 更新
 */
const CUBE_RATES_8630 = {
  "meta": {
    "eventId": 8630,
    "slug": "potential-other",
    "title": "裝備潛能強化方塊(其他)",
    "sourceUrl": "https://maplestory-event.beanfun.com/eventad/eventad?eventadid=8630",
    "cubeColumns": [
      "artisan",
      "masterArtisan"
    ],
    "cubeNames": [
      "工匠方塊",
      "名匠方塊"
    ],
    "parsedAt": "2026-08-07"
  },
  "rankUp": {
    "artisan": {
      "name": "工匠方塊",
      "rates": {
        "fromSpecial": {
          "special": 0.9523999999999999,
          "rare": 0.047599999999999996,
          "unique": 0,
          "legendary": 0
        },
        "fromRare": {
          "rare": 0.9881,
          "unique": 0.011899999999999999,
          "legendary": 0
        },
        "fromUnique": {
          "unique": 1,
          "legendary": 0
        }
      }
    },
    "masterArtisan": {
      "name": "名匠方塊",
      "rates": {
        "fromSpecial": {
          "special": 0.92,
          "rare": 0.08,
          "unique": 0,
          "legendary": 0
        },
        "fromRare": {
          "rare": 0.983,
          "unique": 0.017,
          "legendary": 0
        },
        "fromUnique": {
          "unique": 0.998,
          "legendary": 0.002
        }
      }
    }
  },
  "lineRules": {
    "artisan": {
      "lines": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Special": {
          "same": 0.16670000000000001,
          "lower": 0.8332999999999999
        },
        "line3Special": {
          "same": 0.16670000000000001,
          "lower": 0.8332999999999999
        },
        "line2Rare": {
          "same": 0.047599999999999996,
          "lower": 0.9523999999999999
        },
        "line3Rare": {
          "same": 0.047599999999999996,
          "lower": 0.9523999999999999
        }
      },
      "linesUniqueLegendary": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Unique": {
          "same": 0.011899999999999999,
          "lower": 0.9881
        },
        "line3Unique": {
          "same": 0.011899999999999999,
          "lower": 0.9881
        },
        "line2Legendary": {
          "same": null,
          "lower": null
        },
        "line3Legendary": {
          "same": null,
          "lower": null
        }
      }
    },
    "masterArtisan": {
      "lines": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Special": {
          "same": 0.16670000000000001,
          "lower": 0.9333
        },
        "line3Special": {
          "same": 0.16670000000000001,
          "lower": 0.9333
        },
        "line2Rare": {
          "same": 0.08,
          "lower": 0.92
        },
        "line3Rare": {
          "same": 0.08,
          "lower": 0.92
        }
      },
      "linesUniqueLegendary": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Unique": {
          "same": 0.017,
          "lower": 0.983
        },
        "line3Unique": {
          "same": 0.017,
          "lower": 0.983
        },
        "line2Legendary": {
          "same": 0.002,
          "lower": 0.998
        },
        "line3Legendary": {
          "same": 0.002,
          "lower": 0.998
        }
      }
    }
  },
  "specialLineRules": {},
  "statRates": {
    "special": {
      "防具::帽子,上衣,套服,下衣,手套,披風,腰帶,肩膀,機器心臟,胸章": {
        "major": "防具",
        "minor": "帽子,上衣,套服,下衣,手套,披風,腰帶,肩膀,機器心臟,胸章",
        "entries": [
          {
            "stat": "STR",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "防禦力",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          }
        ]
      },
      "防具::鞋子": {
        "major": "防具",
        "minor": "鞋子",
        "entries": [
          {
            "stat": "移動速度",
            "scope": "鞋子專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "跳躍力",
            "scope": "鞋子專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "STR",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "防禦力",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          }
        ]
      },
      "飾品::墜飾, 戒指, 臉部裝飾, 眼睛裝飾, 耳環": {
        "major": "飾品",
        "minor": "墜飾, 戒指, 臉部裝飾, 眼睛裝飾, 耳環",
        "entries": [
          {
            "stat": "STR",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "防禦力",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "每4秒恢復一定的HP",
            "scope": "飾品專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "每4秒恢復一定的MP",
            "scope": "飾品專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          }
        ]
      },
      "武器::武器, 徽章, 輔助武器(力量之盾, 靈魂戒指除外)": {
        "major": "武器",
        "minor": "武器, 徽章, 輔助武器(力量之盾, 靈魂戒指除外)",
        "entries": [
          {
            "stat": "STR",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0175,
              "masterArtisan": 0.0175
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0175,
              "masterArtisan": 0.0175
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0175,
              "masterArtisan": 0.0175
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0175,
              "masterArtisan": 0.0175
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "artisan": 0.0351,
              "masterArtisan": 0.0351
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "攻擊時有一定的機率發動中毒效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "攻擊時有一定的機率發動昏迷效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "攻擊時有一定的機率發動緩慢效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "攻擊時有一定的機率發動闇黑效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "攻擊時有一定的機率發動冰結效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "攻擊時有一定的機率發動封印效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0526,
              "masterArtisan": 0.0526
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0175,
              "masterArtisan": 0.0175
            }
          }
        ]
      },
      "武器::輔助武器(力量之盾, 靈魂戒指)": {
        "major": "武器",
        "minor": "輔助武器(力量之盾, 靈魂戒指)",
        "entries": [
          {
            "stat": "STR",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "artisan": 0.0588,
              "masterArtisan": 0.0588
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0196,
              "masterArtisan": 0.0196
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0196,
              "masterArtisan": 0.0196
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0196,
              "masterArtisan": 0.0196
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0196,
              "masterArtisan": 0.0196
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "artisan": 0.0392,
              "masterArtisan": 0.0392
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0588,
              "masterArtisan": 0.0588
            }
          },
          {
            "stat": "攻擊時有一定的機率發動中毒效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0588,
              "masterArtisan": 0.0588
            }
          },
          {
            "stat": "攻擊時有一定的機率發動昏迷效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0588,
              "masterArtisan": 0.0588
            }
          },
          {
            "stat": "攻擊時有一定的機率發動緩慢效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0588,
              "masterArtisan": 0.0588
            }
          },
          {
            "stat": "攻擊時有一定的機率發動闇黑效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0588,
              "masterArtisan": 0.0588
            }
          },
          {
            "stat": "攻擊時有一定的機率發動冰結效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0588,
              "masterArtisan": 0.0588
            }
          },
          {
            "stat": "攻擊時有一定的機率發動封印效果",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0588,
              "masterArtisan": 0.0588
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0196,
              "masterArtisan": 0.0196
            }
          }
        ]
      }
    },
    "rare": {
      "飾品::墜飾,戒指,臉部裝飾,眼睛裝飾,耳環": {
        "major": "飾品",
        "minor": "墜飾,戒指,臉部裝飾,眼睛裝飾,耳環",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          }
        ]
      },
      "武器::武器, 徽章(力量之盾, 靈魂之環除外)": {
        "major": "武器",
        "minor": "武器, 徽章(力量之盾, 靈魂之環除外)",
        "entries": [
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          }
        ]
      },
      "武器::輔助武器(力量盾牌, 靈魂之環除外)": {
        "major": "武器",
        "minor": "輔助武器(力量盾牌, 靈魂之環除外)",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0571,
              "masterArtisan": 0.0571
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0571,
              "masterArtisan": 0.0571
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0571,
              "masterArtisan": 0.0571
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0571,
              "masterArtisan": 0.0571
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0857,
              "masterArtisan": 0.0857
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0857,
              "masterArtisan": 0.0857
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0286,
              "masterArtisan": 0.0286
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0286,
              "masterArtisan": 0.0286
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0286,
              "masterArtisan": 0.0286
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0286,
              "masterArtisan": 0.0286
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0286,
              "masterArtisan": 0.0286
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0857,
              "masterArtisan": 0.0857
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0857,
              "masterArtisan": 0.0857
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0286,
              "masterArtisan": 0.0286
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.0857,
              "masterArtisan": 0.0857
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.0857,
              "masterArtisan": 0.0857
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.0857,
              "masterArtisan": 0.0857
            }
          }
        ]
      },
      "武器::輔助武器(力量之盾, 靈魂之環)": {
        "major": "武器",
        "minor": "輔助武器(力量之盾, 靈魂之環)",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.069,
              "masterArtisan": 0.069
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.069,
              "masterArtisan": 0.069
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.069,
              "masterArtisan": 0.069
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.069,
              "masterArtisan": 0.069
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.10339999999999999,
              "masterArtisan": 0.10339999999999999
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0345,
              "masterArtisan": 0.0345
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0345,
              "masterArtisan": 0.0345
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0345,
              "masterArtisan": 0.0345
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0345,
              "masterArtisan": 0.0345
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0345,
              "masterArtisan": 0.0345
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.10339999999999999,
              "masterArtisan": 0.10339999999999999
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0345,
              "masterArtisan": 0.0345
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.10339999999999999,
              "masterArtisan": 0.10339999999999999
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.10339999999999999,
              "masterArtisan": 0.10339999999999999
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.10339999999999999,
              "masterArtisan": 0.10339999999999999
            }
          }
        ]
      },
      "其他::胸章": {
        "major": "其他",
        "minor": "胸章",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          }
        ]
      }
    },
    "unique": {
      "防具::帽子": {
        "major": "防具",
        "minor": "帽子",
        "entries": [
          {
            "stat": "可以使用<實用的時空門> 技能",
            "scope": "帽子專用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          }
        ]
      },
      "防具::上衣, 套服": {
        "major": "防具",
        "minor": "上衣, 套服",
        "entries": [
          {
            "stat": "被擊中後無敵時間增加",
            "scope": "上衣專用",
            "rates": {
              "artisan": 0.1,
              "masterArtisan": 0.1
            }
          },
          {
            "stat": "被擊中時有一定機率在時間內無敵",
            "scope": "上衣專用",
            "rates": {
              "artisan": 0.1,
              "masterArtisan": 0.1
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.1,
              "masterArtisan": 0.1
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.1,
              "masterArtisan": 0.1
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0333,
              "masterArtisan": 0.0333
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.1,
              "masterArtisan": 0.1
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.1,
              "masterArtisan": 0.1
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.1,
              "masterArtisan": 0.1
            }
          }
        ]
      },
      "防具::下衣": {
        "major": "防具",
        "minor": "下衣",
        "entries": [
          {
            "stat": "可以使用<實用的神聖之火> 技能",
            "scope": "下衣專用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          }
        ]
      },
      "防具::手套": {
        "major": "防具",
        "minor": "手套",
        "entries": [
          {
            "stat": "可以使用<實用的會心之眼> 技能",
            "scope": "手套專用",
            "rates": {
              "artisan": 0.0625,
              "masterArtisan": 0.0625
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0625,
              "masterArtisan": 0.0625
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0625,
              "masterArtisan": 0.0625
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0625,
              "masterArtisan": 0.0625
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0625,
              "masterArtisan": 0.0625
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.09380000000000001,
              "masterArtisan": 0.09380000000000001
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.09380000000000001,
              "masterArtisan": 0.09380000000000001
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0313,
              "masterArtisan": 0.0313
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.09380000000000001,
              "masterArtisan": 0.09380000000000001
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.09380000000000001,
              "masterArtisan": 0.09380000000000001
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.09380000000000001,
              "masterArtisan": 0.09380000000000001
            }
          },
          {
            "stat": "攻擊時有一定機率發動自動竊取",
            "scope": "手套專用",
            "rates": {
              "artisan": 0.09380000000000001,
              "masterArtisan": 0.09380000000000001
            }
          },
          {
            "stat": "攻擊時有一定機率發動自動竊取",
            "scope": "手套專用",
            "rates": {
              "artisan": 0.09380000000000001,
              "masterArtisan": 0.09380000000000001
            }
          }
        ]
      },
      "防具::鞋子": {
        "major": "防具",
        "minor": "鞋子",
        "entries": [
          {
            "stat": "可以使用<實用的速度激發> 技能",
            "scope": "鞋子專用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07690000000000001,
              "masterArtisan": 0.07690000000000001
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0385,
              "masterArtisan": 0.0385
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.11539999999999999,
              "masterArtisan": 0.11539999999999999
            }
          }
        ]
      },
      "防具::披風,腰帶,肩膀,機器心臟": {
        "major": "防具",
        "minor": "披風,腰帶,肩膀,機器心臟",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0833,
              "masterArtisan": 0.0833
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.125,
              "masterArtisan": 0.125
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.125,
              "masterArtisan": 0.125
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0417,
              "masterArtisan": 0.0417
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.125,
              "masterArtisan": 0.125
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.125,
              "masterArtisan": 0.125
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.125,
              "masterArtisan": 0.125
            }
          }
        ]
      },
      "飾品::墜飾, 戒指, 臉部裝飾, 眼睛裝飾, 耳環": {
        "major": "飾品",
        "minor": "墜飾, 戒指, 臉部裝飾, 眼睛裝飾, 耳環",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          }
        ]
      },
      "武器::武器": {
        "major": "武器",
        "minor": "武器",
        "entries": [
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "無視怪物防禦力+30%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.1333,
              "masterArtisan": 0.1333
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.1333,
              "masterArtisan": 0.1333
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.1333,
              "masterArtisan": 0.1333
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.1333,
              "masterArtisan": 0.1333
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          },
          {
            "stat": "攻擊BOSS怪物時傷害增加+30%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.0667,
              "masterArtisan": 0.0667
            }
          }
        ]
      },
      "武器::輔助武器(包含力量之盾, 靈魂之環)": {
        "major": "武器",
        "minor": "輔助武器(包含力量之盾, 靈魂之環)",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.09519999999999999,
              "masterArtisan": 0.09519999999999999
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.09519999999999999,
              "masterArtisan": 0.09519999999999999
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.09519999999999999,
              "masterArtisan": 0.09519999999999999
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.09519999999999999,
              "masterArtisan": 0.09519999999999999
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "無視怪物防禦力+30%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.1429,
              "masterArtisan": 0.1429
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "artisan": 0.1429,
              "masterArtisan": 0.1429
            }
          },
          {
            "stat": "攻擊BOSS怪物時傷害增加+30%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.047599999999999996,
              "masterArtisan": 0.047599999999999996
            }
          }
        ]
      },
      "武器::徽章": {
        "major": "武器",
        "minor": "徽章",
        "entries": [
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "無視怪物防禦力+30%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.1429,
              "masterArtisan": 0.1429
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.1429,
              "masterArtisan": 0.1429
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.1429,
              "masterArtisan": 0.1429
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.1429,
              "masterArtisan": 0.1429
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.07139999999999999,
              "masterArtisan": 0.07139999999999999
            }
          }
        ]
      },
      "其他::胸章": {
        "major": "其他",
        "minor": "胸章",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "artisan": 0.11109999999999999,
              "masterArtisan": 0.11109999999999999
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "artisan": 0.0556,
              "masterArtisan": 0.0556
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "artisan": 0.16670000000000001,
              "masterArtisan": 0.16670000000000001
            }
          }
        ]
      }
    },
    "legendary": {}
  },
  "notes": [
    "*經由方塊道具獲得的潛在能力屬性的數值，可能會根據裝備的等級進行變更",
    "*下方潛在能力屬性只能最多設定一個",
    "*下方潛在能力屬性只能最多設定兩個(閃耀鏡射方塊不在此限制內)",
    "*下方潛在能力屬性只能最多設定兩個(",
    "*攻擊Boss怪物時傷害、無視怪物防禦率、爆擊機率會於命運武器上有更優越的素質，詳細可參考公告或遊戲中確認。"
  ]
};

if (typeof window !== 'undefined') {
  window.CUBE_RATES_8630 = CUBE_RATES_8630;
}
