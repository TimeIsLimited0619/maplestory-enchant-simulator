/**
 * 裝備潛能強化方塊
 * 官方來源：https://maplestory-event.beanfun.com/eventad/eventad?eventadid=8421
 * 自動解析日期：2026-08-07
 * 請勿手動編輯；重新執行 scripts/parse-cube-rates.mjs 更新
 */
const CUBE_RATES_8421 = {
  "meta": {
    "eventId": 8421,
    "slug": "potential-main",
    "title": "裝備潛能強化方塊",
    "sourceUrl": "https://maplestory-event.beanfun.com/eventad/eventad?eventadid=8421",
    "cubeColumns": [
      "restore",
      "shiningMirror",
      "dazzling",
      "equal",
      "union"
    ],
    "cubeNames": [
      "恢復方塊",
      "閃耀鏡射方塊",
      "閃炫方塊",
      "新對等方塊",
      "結合方塊"
    ],
    "parsedAt": "2026-08-07"
  },
  "rankUp": {
    "restore": {
      "name": "恢復方塊",
      "rates": {
        "fromSpecial": {
          "special": 0,
          "rare": 0.977,
          "unique": 0.02,
          "legendary": 0.003
        },
        "fromRare": {
          "rare": 0.914,
          "unique": 0.08,
          "legendary": 0.006
        },
        "fromUnique": {
          "unique": 0.9790000000000001,
          "legendary": 0.021
        }
      }
    },
    "shiningMirror": {
      "name": "閃耀鏡射方塊",
      "rates": {
        "fromSpecial": {
          "special": 0.03,
          "rare": 0.97,
          "unique": null,
          "legendary": null
        },
        "fromRare": {
          "rare": 0.9775,
          "unique": 0.0225,
          "legendary": null
        },
        "fromUnique": {
          "unique": 0.9901000000000001,
          "legendary": 0.009899999999999999
        }
      }
    },
    "dazzling": {
      "name": "閃炫方塊",
      "rates": {
        "fromSpecial": {
          "special": 0.03,
          "rare": 0.97,
          "unique": null,
          "legendary": null
        },
        "fromRare": {
          "rare": 0.97,
          "unique": 0.03,
          "legendary": null
        },
        "fromUnique": {
          "unique": 0.9865,
          "legendary": 0.013500000000000002
        }
      }
    },
    "equal": {
      "name": "新對等方塊",
      "rates": {
        "fromSpecial": {
          "special": 0.03,
          "rare": 0.97,
          "unique": null,
          "legendary": null
        },
        "fromRare": {
          "rare": 0.97,
          "unique": 0.03,
          "legendary": null
        },
        "fromUnique": {
          "unique": 0.9865,
          "legendary": 0.013500000000000002
        }
      }
    },
    "union": {
      "name": "結合方塊",
      "rates": {
        "fromSpecial": {
          "special": 1,
          "rare": 0,
          "unique": null,
          "legendary": null
        },
        "fromRare": {
          "rare": 1,
          "unique": 0,
          "legendary": null
        },
        "fromUnique": {
          "unique": 1,
          "legendary": 0
        }
      }
    }
  },
  "lineRules": {
    "restore": {
      "lines": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Special": {
          "same": 1,
          "lower": 0
        },
        "line3Special": {
          "same": 1,
          "lower": 0
        },
        "line2Rare": {
          "same": 0.2,
          "lower": 0.8
        },
        "line3Rare": {
          "same": 0.15,
          "lower": 0.85
        }
      },
      "linesUniqueLegendary": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Unique": {
          "same": 0.2,
          "lower": 0.8
        },
        "line3Unique": {
          "same": 0.1,
          "lower": 0.9
        },
        "line2Legendary": {
          "same": 0.2,
          "lower": 0.8
        },
        "line3Legendary": {
          "same": 0.05,
          "lower": 0.95
        }
      }
    },
    "shiningMirror": {
      "lines": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Special": {
          "same": 1,
          "lower": 0
        },
        "line3Special": {
          "same": 1,
          "lower": 0
        },
        "line2Rare": {
          "same": 0.2,
          "lower": 0.8
        },
        "line3Rare": {
          "same": 0.15,
          "lower": 0.85
        }
      },
      "linesUniqueLegendary": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Unique": {
          "same": 0.2,
          "lower": 0.8
        },
        "line3Unique": {
          "same": 0.1,
          "lower": 0.9
        },
        "line2Legendary": {
          "same": 0.2,
          "lower": 0.8
        },
        "line3Legendary": {
          "same": 0.05,
          "lower": 0.95
        }
      }
    },
    "equal": {
      "lines": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Special": {
          "same": 1,
          "lower": 0
        },
        "line3Special": {
          "same": 1,
          "lower": 0
        },
        "line2Rare": {
          "same": 1,
          "lower": 0
        },
        "line3Rare": {
          "same": 1,
          "lower": 0
        }
      },
      "linesUniqueLegendary": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Unique": {
          "same": 1,
          "lower": 0
        },
        "line3Unique": {
          "same": 1,
          "lower": 0
        },
        "line2Legendary": {
          "same": 1,
          "lower": 0
        },
        "line3Legendary": {
          "same": 1,
          "lower": 0
        }
      }
    }
  },
  "specialLineRules": {
    "dazzling": [
      {
        "slot": "第一個",
        "same": 1,
        "lower": 0,
        "setRate": null
      },
      {
        "slot": "第二個",
        "same": 0.2,
        "lower": 0.8,
        "setRate": null
      },
      {
        "slot": "第三個",
        "same": 0.15,
        "lower": 0.85,
        "setRate": null
      },
      {
        "slot": "第四個",
        "same": 1,
        "lower": 0,
        "setRate": null
      },
      {
        "slot": "第五個",
        "same": 0.2,
        "lower": 0.8,
        "setRate": null
      },
      {
        "slot": "第六個",
        "same": 0.15,
        "lower": 0.85,
        "setRate": null
      }
    ],
    "union": [
      {
        "slot": "第一個",
        "same": 0.15,
        "lower": 0.85,
        "setRate": 0.3333
      },
      {
        "slot": "第二個",
        "same": 0.15,
        "lower": 0.85,
        "setRate": 0.3333
      },
      {
        "slot": "第三個",
        "same": 0.15,
        "lower": 0.85,
        "setRate": 0.3333
      }
    ]
  },
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
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "restore": 0.1,
              "shiningMirror": 0.1,
              "dazzling": 0.1,
              "equal": 0.1,
              "union": 0.0926
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "restore": 0.1,
              "shiningMirror": 0.1,
              "dazzling": 0.1,
              "equal": 0.1,
              "union": 0.0926
            }
          },
          {
            "stat": "防禦力",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.08,
              "shiningMirror": 0.08,
              "dazzling": 0.08,
              "equal": 0.08,
              "union": 0.0926
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.08,
              "shiningMirror": 0.08,
              "dazzling": 0.08,
              "equal": 0.08,
              "union": 0.0833
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.0833
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
              "restore": 0.037000000000000005,
              "shiningMirror": 0.037000000000000005,
              "dazzling": 0.037000000000000005,
              "equal": 0.037000000000000005,
              "union": 0.0803
            }
          },
          {
            "stat": "跳躍力",
            "scope": "鞋子專用",
            "rates": {
              "restore": 0.037000000000000005,
              "shiningMirror": 0.037000000000000005,
              "dazzling": 0.037000000000000005,
              "equal": 0.037000000000000005,
              "union": 0.0803
            }
          },
          {
            "stat": "STR",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.073
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.073
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.073
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.073
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "restore": 0.0925,
              "shiningMirror": 0.0925,
              "dazzling": 0.0925,
              "equal": 0.0925,
              "union": 0.073
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "restore": 0.0925,
              "shiningMirror": 0.0925,
              "dazzling": 0.0925,
              "equal": 0.0925,
              "union": 0.073
            }
          },
          {
            "stat": "防禦力",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.07400000000000001,
              "shiningMirror": 0.07400000000000001,
              "dazzling": 0.07400000000000001,
              "equal": 0.07400000000000001,
              "union": 0.073
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0219
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0219
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0219
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0219
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0219
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.073
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.07400000000000001,
              "shiningMirror": 0.07400000000000001,
              "dazzling": 0.07400000000000001,
              "equal": 0.07400000000000001,
              "union": 0.073
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "restore": 0.037000000000000005,
              "shiningMirror": 0.037000000000000005,
              "dazzling": 0.037000000000000005,
              "equal": 0.037000000000000005,
              "union": 0.073
            }
          }
        ]
      },
      "飾品::墜飾,戒指,臉部裝飾,眼睛裝飾,耳環": {
        "major": "飾品",
        "minor": "墜飾,戒指,臉部裝飾,眼睛裝飾,耳環",
        "entries": [
          {
            "stat": "STR",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "restore": 0.1,
              "shiningMirror": 0.1,
              "dazzling": 0.1,
              "equal": 0.1,
              "union": 0.0926
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "restore": 0.1,
              "shiningMirror": 0.1,
              "dazzling": 0.1,
              "equal": 0.1,
              "union": 0.0926
            }
          },
          {
            "stat": "防禦力",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.08,
              "shiningMirror": 0.08,
              "dazzling": 0.08,
              "equal": 0.08,
              "union": 0.0926
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0278
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.06,
              "shiningMirror": 0.06,
              "dazzling": 0.06,
              "equal": 0.06,
              "union": 0.0833
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.08,
              "shiningMirror": 0.08,
              "dazzling": 0.08,
              "equal": 0.08,
              "union": 0.0833
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.0833
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
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0741
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0741
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0741
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0741
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "restore": 0.11109999999999999,
              "shiningMirror": 0.11109999999999999,
              "dazzling": 0.11109999999999999,
              "equal": 0.11109999999999999,
              "union": 0.0741
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "restore": 0.11109999999999999,
              "shiningMirror": 0.11109999999999999,
              "dazzling": 0.11109999999999999,
              "equal": 0.11109999999999999,
              "union": 0.0741
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "武器專用",
            "rates": {
              "restore": 0.037000000000000005,
              "shiningMirror": 0.037000000000000005,
              "dazzling": 0.037000000000000005,
              "equal": 0.037000000000000005,
              "union": 0.037000000000000005
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "武器專用",
            "rates": {
              "restore": 0.037000000000000005,
              "shiningMirror": 0.037000000000000005,
              "dazzling": 0.037000000000000005,
              "equal": 0.037000000000000005,
              "union": 0.037000000000000005
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0556
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0556
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0556
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0556,
              "shiningMirror": 0.0556,
              "dazzling": 0.0556,
              "equal": 0.0556,
              "union": 0.0556
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "restore": 0.037000000000000005,
              "shiningMirror": 0.037000000000000005,
              "dazzling": 0.037000000000000005,
              "equal": 0.037000000000000005,
              "union": 0.037000000000000005
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "攻擊時有一定的機率發動中毒效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "攻擊時有一定的機率發動昏迷效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "攻擊時有一定的機率發動緩慢效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "攻擊時有一定的機率發動闇黑效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "攻擊時有一定的機率發動冰結效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "攻擊時有一定的機率發動封印效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.018500000000000003,
              "shiningMirror": 0.018500000000000003,
              "dazzling": 0.018500000000000003,
              "equal": 0.018500000000000003,
              "union": 0.018500000000000003
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
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.08
            }
          },
          {
            "stat": "DEX",
            "scope": "共用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.08
            }
          },
          {
            "stat": "INT",
            "scope": "共用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.08
            }
          },
          {
            "stat": "LUK",
            "scope": "共用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.08
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "restore": 0.125,
              "shiningMirror": 0.125,
              "dazzling": 0.125,
              "equal": 0.125,
              "union": 0.08
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0417,
              "shiningMirror": 0.0417,
              "dazzling": 0.0417,
              "equal": 0.0417,
              "union": 0.04
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0417,
              "shiningMirror": 0.0417,
              "dazzling": 0.0417,
              "equal": 0.0417,
              "union": 0.04
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.06
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.06
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.06
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.06
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "全屬性",
            "scope": "共用",
            "rates": {
              "restore": 0.0417,
              "shiningMirror": 0.0417,
              "dazzling": 0.0417,
              "equal": 0.0417,
              "union": 0.04
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "攻擊時有一定的機率發動中毒效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "攻擊時有一定的機率發動昏迷效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "攻擊時有一定的機率發動緩慢效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "攻擊時有一定的機率發動闇黑效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "攻擊時有一定的機率發動冰結效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "攻擊時有一定的機率發動封印效果",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0208,
              "shiningMirror": 0.0208,
              "dazzling": 0.0208,
              "equal": 0.0208,
              "union": 0.02
            }
          }
        ]
      }
    },
    "rare": {
      "防具::帽子,下衣,披風,腰帶,肩膀,機器心臟,胸章": {
        "major": "防具",
        "minor": "帽子,下衣,披風,腰帶,肩膀,機器心臟,胸章",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.1408
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.1408
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.1408
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.1408
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "restore": 0.16670000000000001,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.16670000000000001,
              "equal": 0.16670000000000001,
              "union": 0.1408
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "restore": 0.16670000000000001,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.16670000000000001,
              "equal": 0.16670000000000001,
              "union": 0.1408
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1429,
              "shiningMirror": 0.1429,
              "dazzling": 0.1429,
              "equal": 0.1429,
              "union": 0.1408
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.047599999999999996,
              "shiningMirror": 0.047599999999999996,
              "dazzling": 0.047599999999999996,
              "equal": 0.047599999999999996,
              "union": 0.0141
            }
          }
        ]
      },
      "防具::上衣,套服": {
        "major": "防具",
        "minor": "上衣,套服",
        "entries": [
          {
            "stat": "被擊中後無敵時間增加",
            "scope": "上衣專用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.027999999999999997
            }
          },
          {
            "stat": "被擊中後無敵時間增加",
            "scope": "上衣專用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.027999999999999997
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.1042,
              "shiningMirror": 0.1042,
              "dazzling": 0.1042,
              "equal": 0.1042,
              "union": 0.1308
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.1042,
              "shiningMirror": 0.1042,
              "dazzling": 0.1042,
              "equal": 0.1042,
              "union": 0.1308
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.1042,
              "shiningMirror": 0.1042,
              "dazzling": 0.1042,
              "equal": 0.1042,
              "union": 0.1308
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.1042,
              "shiningMirror": 0.1042,
              "dazzling": 0.1042,
              "equal": 0.1042,
              "union": 0.1308
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "restore": 0.1458,
              "shiningMirror": 0.1458,
              "dazzling": 0.1458,
              "equal": 0.1458,
              "union": 0.1308
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "restore": 0.1458,
              "shiningMirror": 0.1458,
              "dazzling": 0.1458,
              "equal": 0.1458,
              "union": 0.1402
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.125,
              "shiningMirror": 0.125,
              "dazzling": 0.125,
              "equal": 0.125,
              "union": 0.1402
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0417,
              "shiningMirror": 0.0417,
              "dazzling": 0.0417,
              "equal": 0.0417,
              "union": 0.009300000000000001
            }
          }
        ]
      },
      "防具::手套": {
        "major": "防具",
        "minor": "手套",
        "entries": [
          {
            "stat": "擊殺怪物有一定機率恢復HP",
            "scope": "手套專用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.027999999999999997
            }
          },
          {
            "stat": "擊殺怪物有一定機率恢復MP",
            "scope": "手套專用",
            "rates": {
              "restore": 0.0625,
              "shiningMirror": 0.0625,
              "dazzling": 0.0625,
              "equal": 0.0625,
              "union": 0.027999999999999997
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.1042,
              "shiningMirror": 0.1042,
              "dazzling": 0.1042,
              "equal": 0.1042,
              "union": 0.1308
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.1042,
              "shiningMirror": 0.1042,
              "dazzling": 0.1042,
              "equal": 0.1042,
              "union": 0.1308
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.1042,
              "shiningMirror": 0.1042,
              "dazzling": 0.1042,
              "equal": 0.1042,
              "union": 0.1308
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.1042,
              "shiningMirror": 0.1042,
              "dazzling": 0.1042,
              "equal": 0.1042,
              "union": 0.1308
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "restore": 0.1458,
              "shiningMirror": 0.1458,
              "dazzling": 0.1458,
              "equal": 0.1458,
              "union": 0.1308
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "restore": 0.1458,
              "shiningMirror": 0.1458,
              "dazzling": 0.1458,
              "equal": 0.1458,
              "union": 0.1402
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.125,
              "shiningMirror": 0.125,
              "dazzling": 0.125,
              "equal": 0.125,
              "union": 0.1402
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0417,
              "shiningMirror": 0.0417,
              "dazzling": 0.0417,
              "equal": 0.0417,
              "union": 0.009300000000000001
            }
          }
        ]
      },
      "防具::鞋子": {
        "major": "防具",
        "minor": "鞋子",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "restore": 0.16670000000000001,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.16670000000000001,
              "equal": 0.16670000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "restore": 0.16670000000000001,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.16670000000000001,
              "equal": 0.16670000000000001,
              "union": 0.1507
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1429,
              "shiningMirror": 0.1429,
              "dazzling": 0.1429,
              "equal": 0.1429,
              "union": 0.1507
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.047599999999999996,
              "shiningMirror": 0.047599999999999996,
              "dazzling": 0.047599999999999996,
              "equal": 0.047599999999999996,
              "union": 0.0137
            }
          }
        ]
      },
      "飾品::墜飾,戒指,臉部裝飾,眼睛裝飾,耳環": {
        "major": "飾品",
        "minor": "墜飾,戒指,臉部裝飾,眼睛裝飾,耳環",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.11900000000000001,
              "shiningMirror": 0.11900000000000001,
              "dazzling": 0.11900000000000001,
              "equal": 0.11900000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "restore": 0.16670000000000001,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.16670000000000001,
              "equal": 0.16670000000000001,
              "union": 0.13699999999999998
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "restore": 0.16670000000000001,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.16670000000000001,
              "equal": 0.16670000000000001,
              "union": 0.1507
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1429,
              "shiningMirror": 0.1429,
              "dazzling": 0.1429,
              "equal": 0.1429,
              "union": 0.1507
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.047599999999999996,
              "shiningMirror": 0.047599999999999996,
              "dazzling": 0.047599999999999996,
              "equal": 0.047599999999999996,
              "union": 0.0137
            }
          }
        ]
      },
      "武器::武器, 徽章, 輔助武器(力量之盾, 靈魂之環除外)": {
        "major": "武器",
        "minor": "武器, 徽章, 輔助武器(力量之盾, 靈魂之環除外)",
        "entries": [
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.041100000000000005
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.041100000000000005
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.041100000000000005
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.041100000000000005
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.041100000000000005
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.06849999999999999
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.06849999999999999
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.1,
              "shiningMirror": 0.1,
              "dazzling": 0.1,
              "equal": 0.1,
              "union": 0.0959
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.1,
              "shiningMirror": 0.1,
              "dazzling": 0.1,
              "equal": 0.1,
              "union": 0.0959
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.1,
              "shiningMirror": 0.1,
              "dazzling": 0.1,
              "equal": 0.1,
              "union": 0.0959
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.1,
              "shiningMirror": 0.1,
              "dazzling": 0.1,
              "equal": 0.1,
              "union": 0.0959
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "restore": 0.14,
              "shiningMirror": 0.14,
              "dazzling": 0.14,
              "equal": 0.14,
              "union": 0.0959
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "restore": 0.14,
              "shiningMirror": 0.14,
              "dazzling": 0.14,
              "equal": 0.14,
              "union": 0.0959
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.04,
              "shiningMirror": 0.04,
              "dazzling": 0.04,
              "equal": 0.04,
              "union": 0.08220000000000001
            }
          }
        ]
      },
      "武器::輔助武器(力量之盾, 靈魂之環)": {
        "major": "武器",
        "minor": "輔助武器(力量之盾, 靈魂之環)",
        "entries": [
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.04650000000000001,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.0455
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.04650000000000001,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.0455
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.04650000000000001,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.0455
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.04650000000000001,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.0455
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.04650000000000001,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.0455
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.04650000000000001,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.0758
            }
          },
          {
            "stat": "無視怪物防禦力+15%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.04650000000000001,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.0758
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.11630000000000001,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.1061
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.11630000000000001,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.1061
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.11630000000000001,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.1061
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.11630000000000001,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.1061
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "restore": 0.1628,
              "shiningMirror": 0.1628,
              "dazzling": 0.1628,
              "equal": 0.1628,
              "union": 0.1061
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.04650000000000001,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.0909
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
              "restore": 0.0755,
              "shiningMirror": 0.1143,
              "dazzling": 0.0755,
              "equal": 0.0755,
              "union": 0.1311
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.0571,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.06559999999999999
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.0571,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.06559999999999999
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.0571,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.06559999999999999
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.0571,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.06559999999999999
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.11320000000000001,
              "shiningMirror": 0.0571,
              "dazzling": 0.11320000000000001,
              "equal": 0.11320000000000001,
              "union": 0.06559999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.11320000000000001,
              "shiningMirror": 0.1714,
              "dazzling": 0.11320000000000001,
              "equal": 0.11320000000000001,
              "union": 0.1311
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0755,
              "shiningMirror": 0.0571,
              "dazzling": 0.0755,
              "equal": 0.0755,
              "union": 0.016399999999999998
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0755,
              "shiningMirror": 0.1143,
              "dazzling": 0.0755,
              "equal": 0.0755,
              "union": 0.1311
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0755,
              "shiningMirror": 0.1143,
              "dazzling": 0.0755,
              "equal": 0.0755,
              "union": 0.1311
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.1429,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.1311
            }
          }
        ]
      },
      "防具::上衣,套服": {
        "major": "防具",
        "minor": "上衣,套服",
        "entries": [
          {
            "stat": "被擊中後無敵時間增加",
            "scope": "上衣專用",
            "rates": {
              "restore": 0.0635,
              "shiningMirror": 0.0889,
              "dazzling": 0.0635,
              "equal": 0.0635,
              "union": 0.0889
            }
          },
          {
            "stat": "被擊中時有一定機率在時間內無敵",
            "scope": "上衣專用",
            "rates": {
              "restore": 0.0635,
              "shiningMirror": 0.0889,
              "dazzling": 0.0635,
              "equal": 0.0635,
              "union": 0.0889
            }
          },
          {
            "stat": "有一定機率反射所受的傷害",
            "scope": "上衣專用",
            "rates": {
              "restore": 0.0635,
              "shiningMirror": 0.0889,
              "dazzling": 0.0635,
              "equal": 0.0635,
              "union": 0.1
            }
          },
          {
            "stat": "有一定機率反射所受的傷害",
            "scope": "上衣專用",
            "rates": {
              "restore": 0.0317,
              "shiningMirror": 0.0444,
              "dazzling": 0.0317,
              "equal": 0.0317,
              "union": 0.1
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0794,
              "shiningMirror": 0.0444,
              "dazzling": 0.0794,
              "equal": 0.0794,
              "union": 0.0444
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0794,
              "shiningMirror": 0.0444,
              "dazzling": 0.0794,
              "equal": 0.0794,
              "union": 0.0444
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0794,
              "shiningMirror": 0.0444,
              "dazzling": 0.0794,
              "equal": 0.0794,
              "union": 0.0444
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0794,
              "shiningMirror": 0.0444,
              "dazzling": 0.0794,
              "equal": 0.0794,
              "union": 0.0444
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.0444,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.0444
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.1333,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.0889
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0635,
              "shiningMirror": 0.0444,
              "dazzling": 0.0635,
              "equal": 0.0635,
              "union": 0.0111
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0635,
              "shiningMirror": 0.0889,
              "dazzling": 0.0635,
              "equal": 0.0635,
              "union": 0.1
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0635,
              "shiningMirror": 0.0889,
              "dazzling": 0.0635,
              "equal": 0.0635,
              "union": 0.1
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.0794,
              "shiningMirror": 0.11109999999999999,
              "dazzling": 0.0794,
              "equal": 0.0794,
              "union": 0.1
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
              "restore": 0.0727,
              "shiningMirror": 0.1081,
              "dazzling": 0.0727,
              "equal": 0.0727,
              "union": 0.125
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0909,
              "shiningMirror": 0.0541,
              "dazzling": 0.0909,
              "equal": 0.0909,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0909,
              "shiningMirror": 0.0541,
              "dazzling": 0.0909,
              "equal": 0.0909,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0909,
              "shiningMirror": 0.0541,
              "dazzling": 0.0909,
              "equal": 0.0909,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0909,
              "shiningMirror": 0.0541,
              "dazzling": 0.0909,
              "equal": 0.0909,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1091,
              "shiningMirror": 0.0541,
              "dazzling": 0.1091,
              "equal": 0.1091,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1091,
              "shiningMirror": 0.16219999999999998,
              "dazzling": 0.1091,
              "equal": 0.1091,
              "union": 0.125
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0727,
              "shiningMirror": 0.0541,
              "dazzling": 0.0727,
              "equal": 0.0727,
              "union": 0.0179
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0909,
              "shiningMirror": 0.1351,
              "dazzling": 0.0909,
              "equal": 0.0909,
              "union": 0.125
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0909,
              "shiningMirror": 0.1351,
              "dazzling": 0.0909,
              "equal": 0.0909,
              "union": 0.125
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.0909,
              "shiningMirror": 0.1351,
              "dazzling": 0.0909,
              "equal": 0.0909,
              "union": 0.125
            }
          }
        ]
      },
      "防具::手套": {
        "major": "防具",
        "minor": "手套",
        "entries": [
          {
            "stat": "STR",
            "scope": "手套專用",
            "rates": {
              "restore": 0.0175,
              "shiningMirror": 0.0256,
              "dazzling": 0.0175,
              "equal": 0.0175,
              "union": 0.0575
            }
          },
          {
            "stat": "DEX",
            "scope": "手套專用",
            "rates": {
              "restore": 0.0175,
              "shiningMirror": 0.0256,
              "dazzling": 0.0175,
              "equal": 0.0175,
              "union": 0.0575
            }
          },
          {
            "stat": "INT",
            "scope": "手套專用",
            "rates": {
              "restore": 0.0175,
              "shiningMirror": 0.0256,
              "dazzling": 0.0175,
              "equal": 0.0175,
              "union": 0.0575
            }
          },
          {
            "stat": "LUK",
            "scope": "手套專用",
            "rates": {
              "restore": 0.0175,
              "shiningMirror": 0.0256,
              "dazzling": 0.0175,
              "equal": 0.0175,
              "union": 0.0575
            }
          },
          {
            "stat": "可以使用<實用的會心之眼> 技能",
            "scope": "手套專用",
            "rates": {
              "restore": 0.0702,
              "shiningMirror": 0.1026,
              "dazzling": 0.0702,
              "equal": 0.0702,
              "union": 0.092
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0877,
              "shiningMirror": 0.0513,
              "dazzling": 0.0877,
              "equal": 0.0877,
              "union": 0.0575
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0877,
              "shiningMirror": 0.0513,
              "dazzling": 0.0877,
              "equal": 0.0877,
              "union": 0.0575
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0877,
              "shiningMirror": 0.0513,
              "dazzling": 0.0877,
              "equal": 0.0877,
              "union": 0.0575
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0877,
              "shiningMirror": 0.0513,
              "dazzling": 0.0877,
              "equal": 0.0877,
              "union": 0.0575
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.0513,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.0575
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.15380000000000002,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.092
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0702,
              "shiningMirror": 0.0513,
              "dazzling": 0.0702,
              "equal": 0.0702,
              "union": 0.0115
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0702,
              "shiningMirror": 0.1026,
              "dazzling": 0.0702,
              "equal": 0.0702,
              "union": 0.092
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0702,
              "shiningMirror": 0.1026,
              "dazzling": 0.0702,
              "equal": 0.0702,
              "union": 0.092
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.0877,
              "shiningMirror": 0.1282,
              "dazzling": 0.0877,
              "equal": 0.0877,
              "union": 0.10339999999999999
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
              "restore": 0.0755,
              "shiningMirror": 0.1143,
              "dazzling": 0.0755,
              "equal": 0.0755,
              "union": 0.1
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.0571,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.0571,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.0571,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.0571,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.11320000000000001,
              "shiningMirror": 0.0571,
              "dazzling": 0.11320000000000001,
              "equal": 0.11320000000000001,
              "union": 0.07139999999999999
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.11320000000000001,
              "shiningMirror": 0.1714,
              "dazzling": 0.11320000000000001,
              "equal": 0.11320000000000001,
              "union": 0.1286
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0755,
              "shiningMirror": 0.0571,
              "dazzling": 0.0755,
              "equal": 0.0755,
              "union": 0.0143
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0755,
              "shiningMirror": 0.1143,
              "dazzling": 0.0755,
              "equal": 0.0755,
              "union": 0.1286
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0755,
              "shiningMirror": 0.1143,
              "dazzling": 0.0755,
              "equal": 0.0755,
              "union": 0.1286
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.0943,
              "shiningMirror": 0.1429,
              "dazzling": 0.0943,
              "equal": 0.0943,
              "union": 0.1429
            }
          }
        ]
      },
      "防具::披風,腰帶,肩膀,機器心臟,胸章": {
        "major": "防具",
        "minor": "披風,腰帶,肩膀,機器心臟,胸章",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.102,
              "shiningMirror": 0.0645,
              "dazzling": 0.102,
              "equal": 0.102,
              "union": 0.0877
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.102,
              "shiningMirror": 0.0645,
              "dazzling": 0.102,
              "equal": 0.102,
              "union": 0.0877
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.102,
              "shiningMirror": 0.0645,
              "dazzling": 0.102,
              "equal": 0.102,
              "union": 0.0877
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.102,
              "shiningMirror": 0.0645,
              "dazzling": 0.102,
              "equal": 0.102,
              "union": 0.0877
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.12240000000000001,
              "shiningMirror": 0.0645,
              "dazzling": 0.12240000000000001,
              "equal": 0.12240000000000001,
              "union": 0.0877
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.12240000000000001,
              "shiningMirror": 0.1935,
              "dazzling": 0.12240000000000001,
              "equal": 0.12240000000000001,
              "union": 0.12279999999999999
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0816,
              "shiningMirror": 0.0645,
              "dazzling": 0.0816,
              "equal": 0.0816,
              "union": 0.0175
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0816,
              "shiningMirror": 0.129,
              "dazzling": 0.0816,
              "equal": 0.0816,
              "union": 0.1404
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.0816,
              "shiningMirror": 0.129,
              "dazzling": 0.0816,
              "equal": 0.0816,
              "union": 0.1404
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.102,
              "shiningMirror": 0.1613,
              "dazzling": 0.102,
              "equal": 0.102,
              "union": 0.1404
            }
          }
        ]
      },
      "飾品::墜飾,戒指,臉部裝飾,眼睛裝飾,耳環": {
        "major": "飾品",
        "minor": "墜飾,戒指,臉部裝飾,眼睛裝飾,耳環",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.122,
              "shiningMirror": 0.087,
              "dazzling": 0.122,
              "equal": 0.122,
              "union": 0.1351
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.122,
              "shiningMirror": 0.087,
              "dazzling": 0.122,
              "equal": 0.122,
              "union": 0.1351
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.122,
              "shiningMirror": 0.087,
              "dazzling": 0.122,
              "equal": 0.122,
              "union": 0.1351
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.122,
              "shiningMirror": 0.087,
              "dazzling": 0.122,
              "equal": 0.122,
              "union": 0.1351
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1463,
              "shiningMirror": 0.087,
              "dazzling": 0.1463,
              "equal": 0.1463,
              "union": 0.1351
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1463,
              "shiningMirror": 0.2609,
              "dazzling": 0.1463,
              "equal": 0.1463,
              "union": 0.1351
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.087,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.027000000000000003
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.122,
              "shiningMirror": 0.21739999999999998,
              "dazzling": 0.122,
              "equal": 0.122,
              "union": 0.16219999999999998
            }
          }
        ]
      },
      "武器::武器,輔助武器(包含力量之盾, 靈魂之環)": {
        "major": "武器",
        "minor": "武器,輔助武器(包含力量之盾, 靈魂之環)",
        "entries": [
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0652,
              "shiningMirror": 0.027000000000000003,
              "dazzling": 0.0652,
              "equal": 0.0652,
              "union": 0.08220000000000001
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0652,
              "shiningMirror": 0.027000000000000003,
              "dazzling": 0.0652,
              "equal": 0.0652,
              "union": 0.08220000000000001
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0652,
              "shiningMirror": 0.027000000000000003,
              "dazzling": 0.0652,
              "equal": 0.0652,
              "union": 0.16440000000000002
            }
          },
          {
            "stat": "無視怪物防禦力+30%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.087,
              "shiningMirror": 0.0541,
              "dazzling": 0.087,
              "equal": 0.087,
              "union": 0.20550000000000002
            }
          },
          {
            "stat": "攻擊BOSS怪物時傷害增加+30%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0652,
              "shiningMirror": 0.0541,
              "dazzling": 0.0652,
              "equal": 0.0652,
              "union": 0.0548
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.10869999999999999,
              "shiningMirror": 0.1351,
              "dazzling": 0.10869999999999999,
              "equal": 0.10869999999999999,
              "union": 0.27399999999999997
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.10869999999999999,
              "shiningMirror": 0.1351,
              "dazzling": 0.10869999999999999,
              "equal": 0.10869999999999999,
              "union": 0.0274
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.10869999999999999,
              "shiningMirror": 0.1351,
              "dazzling": 0.10869999999999999,
              "equal": 0.10869999999999999,
              "union": 0.0274
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.10869999999999999,
              "shiningMirror": 0.1351,
              "dazzling": 0.10869999999999999,
              "equal": 0.10869999999999999,
              "union": 0.0274
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.10869999999999999,
              "shiningMirror": 0.1351,
              "dazzling": 0.10869999999999999,
              "equal": 0.10869999999999999,
              "union": 0.0274
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.10869999999999999,
              "shiningMirror": 0.1351,
              "dazzling": 0.10869999999999999,
              "equal": 0.10869999999999999,
              "union": 0.0274
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
              "restore": 0.0698,
              "shiningMirror": 0.0286,
              "dazzling": 0.0698,
              "equal": 0.0698,
              "union": 0.087
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0698,
              "shiningMirror": 0.0286,
              "dazzling": 0.0698,
              "equal": 0.0698,
              "union": 0.087
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0698,
              "shiningMirror": 0.0286,
              "dazzling": 0.0698,
              "equal": 0.0698,
              "union": 0.1739
            }
          },
          {
            "stat": "無視怪物防禦力+30%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.0571,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.21739999999999998
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.1429,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.2899
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.1429,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.028999999999999998
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.1429,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.028999999999999998
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.1429,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.028999999999999998
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.1429,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.028999999999999998
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.11630000000000001,
              "shiningMirror": 0.1429,
              "dazzling": 0.11630000000000001,
              "equal": 0.11630000000000001,
              "union": 0.028999999999999998
            }
          }
        ]
      }
    },
    "legendary": {
      "防具::帽子": {
        "major": "防具",
        "minor": "帽子",
        "entries": [
          {
            "stat": "減少所有技能冷卻時間(10秒以下會減少5%，不會減少到未滿5秒)",
            "scope": "帽子專用",
            "rates": {
              "restore": 0.0698,
              "shiningMirror": 0.09380000000000001,
              "dazzling": 0.0698,
              "equal": 0.0698,
              "union": 0.11109999999999999
            }
          },
          {
            "stat": "減少所有技能冷卻時間(10秒以下會減少5%，不會減少到未滿5秒)",
            "scope": "帽子專用",
            "rates": {
              "restore": 0.04650000000000001,
              "shiningMirror": 0.0625,
              "dazzling": 0.04650000000000001,
              "equal": 0.04650000000000001,
              "union": 0.11109999999999999
            }
          },
          {
            "stat": "可以使用<實用的進階祝福> 技能",
            "scope": "帽子專用",
            "rates": {
              "restore": 0.0698,
              "shiningMirror": 0.09380000000000001,
              "dazzling": 0.0698,
              "equal": 0.0698,
              "union": 0.125
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.0625,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.0556
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.0625,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.0556
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.0625,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.0556
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.0625,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.0556
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.0625,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.0556
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.125,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.11109999999999999
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0698,
              "shiningMirror": 0.0625,
              "dazzling": 0.0698,
              "equal": 0.0698,
              "union": 0.0139
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.125,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.125
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.09300000000000001,
              "shiningMirror": 0.125,
              "dazzling": 0.09300000000000001,
              "equal": 0.09300000000000001,
              "union": 0.125
            }
          }
        ]
      },
      "防具::上衣,套服": {
        "major": "防具",
        "minor": "上衣,套服",
        "entries": [
          {
            "stat": "被擊中後無敵時間增加",
            "scope": "上衣專用",
            "rates": {
              "restore": 0.0732,
              "shiningMirror": 0.1,
              "dazzling": 0.0732,
              "equal": 0.0732,
              "union": 0.1379
            }
          },
          {
            "stat": "被擊中時有一定機率在時間內無敵",
            "scope": "上衣專用",
            "rates": {
              "restore": 0.0732,
              "shiningMirror": 0.1,
              "dazzling": 0.0732,
              "equal": 0.0732,
              "union": 0.1379
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.069
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.069
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.069
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.069
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.069
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.1333,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.1207
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0732,
              "shiningMirror": 0.0667,
              "dazzling": 0.0732,
              "equal": 0.0732,
              "union": 0.0172
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.1333,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.1207
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.1333,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.1207
            }
          }
        ]
      },
      "防具::下衣": {
        "major": "防具",
        "minor": "下衣",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.15380000000000002
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0857,
              "shiningMirror": 0.0833,
              "dazzling": 0.0857,
              "equal": 0.0857,
              "union": 0.0256
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.15380000000000002
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.15380000000000002
            }
          }
        ]
      },
      "防具::手套": {
        "major": "防具",
        "minor": "手套",
        "entries": [
          {
            "stat": "爆擊傷害%",
            "scope": "手套專用",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.129,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.0339
            }
          },
          {
            "stat": "可以使用<實用的最終極速> 技能",
            "scope": "手套專用",
            "rates": {
              "restore": 0.07139999999999999,
              "shiningMirror": 0.0968,
              "dazzling": 0.07139999999999999,
              "equal": 0.07139999999999999,
              "union": 0.1356
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.0645,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.0678
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.0645,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.0678
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.0645,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.0678
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.0645,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.0678
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.0645,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.0678
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.129,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.16949999999999998
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.07139999999999999,
              "shiningMirror": 0.0645,
              "dazzling": 0.07139999999999999,
              "equal": 0.07139999999999999,
              "union": 0.0169
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.129,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.1525
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.09519999999999999,
              "shiningMirror": 0.129,
              "dazzling": 0.09519999999999999,
              "equal": 0.09519999999999999,
              "union": 0.1525
            }
          }
        ]
      },
      "防具::鞋子": {
        "major": "防具",
        "minor": "鞋子",
        "entries": [
          {
            "stat": "可以使用<實用的戰鬥命令> 技能",
            "scope": "鞋子專用",
            "rates": {
              "restore": 0.0789,
              "shiningMirror": 0.11109999999999999,
              "dazzling": 0.0789,
              "equal": 0.0789,
              "union": 0.125
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.0741,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.0833
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.0741,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.0833
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.0741,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.0833
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.0741,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.0833
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.0741,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.0833
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.1481,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.1458
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0789,
              "shiningMirror": 0.0741,
              "dazzling": 0.0789,
              "equal": 0.0789,
              "union": 0.0208
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.1481,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.1458
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.10529999999999999,
              "shiningMirror": 0.1481,
              "dazzling": 0.10529999999999999,
              "equal": 0.10529999999999999,
              "union": 0.1458
            }
          }
        ]
      },
      "防具::披風,腰帶,肩膀,機器心臟,胸章": {
        "major": "防具",
        "minor": "披風,腰帶,肩膀,機器心臟,胸章",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.0833,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1026
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.15380000000000002
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0857,
              "shiningMirror": 0.0833,
              "dazzling": 0.0857,
              "equal": 0.0857,
              "union": 0.07690000000000001
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1282
            }
          },
          {
            "stat": "被擊中時有一定機率無視傷害",
            "scope": "防具專用",
            "rates": {
              "restore": 0.1143,
              "shiningMirror": 0.16670000000000001,
              "dazzling": 0.1143,
              "equal": 0.1143,
              "union": 0.1282
            }
          }
        ]
      },
      "飾品::墜飾,戒指,臉部裝飾,眼睛裝飾,耳環": {
        "major": "飾品",
        "minor": "墜飾,戒指,臉部裝飾,眼睛裝飾,耳環",
        "entries": [
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.0702
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.0702
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.0702
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.0702
            }
          },
          {
            "stat": "最大HP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.0667,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.0702
            }
          },
          {
            "stat": "最大MP%",
            "scope": "只有武器不可",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.1333,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.1404
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0732,
              "shiningMirror": 0.0667,
              "dazzling": 0.0732,
              "equal": 0.0732,
              "union": 0.0175
            }
          },
          {
            "stat": "所有技能的MP消耗%",
            "scope": "飾品專用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.1333,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.1404
            }
          },
          {
            "stat": "所有技能的MP消耗%",
            "scope": "飾品專用",
            "rates": {
              "restore": 0.09759999999999999,
              "shiningMirror": 0.1333,
              "dazzling": 0.09759999999999999,
              "equal": 0.09759999999999999,
              "union": 0.1404
            }
          },
          {
            "stat": "楓幣獲得量%",
            "scope": "飾品專用",
            "rates": {
              "restore": 0.0732,
              "shiningMirror": 0.1,
              "dazzling": 0.0732,
              "equal": 0.0732,
              "union": 0.10529999999999999
            }
          },
          {
            "stat": "道具掉落率%",
            "scope": "飾品專用",
            "rates": {
              "restore": 0.0732,
              "shiningMirror": 0.1,
              "dazzling": 0.0732,
              "equal": 0.0732,
              "union": 0.10529999999999999
            }
          }
        ]
      },
      "武器::武器,輔助武器(包含力量之盾, 靈魂之環)": {
        "major": "武器",
        "minor": "武器,輔助武器(包含力量之盾, 靈魂之環)",
        "entries": [
          {
            "stat": "物理攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0444,
              "shiningMirror": 0.0278,
              "dazzling": 0.0444,
              "equal": 0.0444,
              "union": 0.032400000000000005
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0444,
              "shiningMirror": 0.0278,
              "dazzling": 0.0444,
              "equal": 0.0444,
              "union": 0.032400000000000005
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0444,
              "shiningMirror": 0.0278,
              "dazzling": 0.0444,
              "equal": 0.0444,
              "union": 0.1618
            }
          },
          {
            "stat": "無視怪物防禦力+35%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0667,
              "shiningMirror": 0.0556,
              "dazzling": 0.0667,
              "equal": 0.0667,
              "union": 0.2589
            }
          },
          {
            "stat": "無視怪物防禦力+40%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0667,
              "shiningMirror": 0.0556,
              "dazzling": 0.0667,
              "equal": 0.0667,
              "union": 0.1618
            }
          },
          {
            "stat": "攻擊BOSS怪物時傷害增加+35%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0889,
              "shiningMirror": 0.0556,
              "dazzling": 0.0889,
              "equal": 0.0889,
              "union": 0.0518
            }
          },
          {
            "stat": "攻擊BOSS怪物時傷害增加+40%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0444,
              "shiningMirror": 0.0278,
              "dazzling": 0.0444,
              "equal": 0.0444,
              "union": 0.0113
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0444,
              "shiningMirror": 0.0278,
              "dazzling": 0.0444,
              "equal": 0.0444,
              "union": 0.2104
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0667,
              "shiningMirror": 0.0833,
              "dazzling": 0.0667,
              "equal": 0.0667,
              "union": 0.0113
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0667,
              "shiningMirror": 0.0833,
              "dazzling": 0.0667,
              "equal": 0.0667,
              "union": 0.0113
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.0889,
              "shiningMirror": 0.11109999999999999,
              "dazzling": 0.0889,
              "equal": 0.0889,
              "union": 0.0113
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.0889,
              "shiningMirror": 0.11109999999999999,
              "dazzling": 0.0889,
              "equal": 0.0889,
              "union": 0.0113
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.0889,
              "shiningMirror": 0.11109999999999999,
              "dazzling": 0.0889,
              "equal": 0.0889,
              "union": 0.0113
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.0889,
              "shiningMirror": 0.11109999999999999,
              "dazzling": 0.0889,
              "equal": 0.0889,
              "union": 0.0113
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.0667,
              "shiningMirror": 0.0833,
              "dazzling": 0.0667,
              "equal": 0.0667,
              "union": 0.0113
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
              "restore": 0.0513,
              "shiningMirror": 0.030299999999999997,
              "dazzling": 0.0513,
              "equal": 0.0513,
              "union": 0.0345
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0513,
              "shiningMirror": 0.030299999999999997,
              "dazzling": 0.0513,
              "equal": 0.0513,
              "union": 0.0345
            }
          },
          {
            "stat": "總傷害%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0513,
              "shiningMirror": 0.030299999999999997,
              "dazzling": 0.0513,
              "equal": 0.0513,
              "union": 0.1727
            }
          },
          {
            "stat": "無視怪物防禦力+35%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.07690000000000001,
              "shiningMirror": 0.060599999999999994,
              "dazzling": 0.07690000000000001,
              "equal": 0.07690000000000001,
              "union": 0.2763
            }
          },
          {
            "stat": "無視怪物防禦力+40%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.07690000000000001,
              "shiningMirror": 0.060599999999999994,
              "dazzling": 0.07690000000000001,
              "equal": 0.07690000000000001,
              "union": 0.1727
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "武器專用",
            "rates": {
              "restore": 0.0513,
              "shiningMirror": 0.030299999999999997,
              "dazzling": 0.0513,
              "equal": 0.0513,
              "union": 0.2245
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "武器專用",
            "rates": {
              "restore": 0.07690000000000001,
              "shiningMirror": 0.0909,
              "dazzling": 0.07690000000000001,
              "equal": 0.07690000000000001,
              "union": 0.0121
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "武器專用",
            "rates": {
              "restore": 0.07690000000000001,
              "shiningMirror": 0.0909,
              "dazzling": 0.07690000000000001,
              "equal": 0.07690000000000001,
              "union": 0.0121
            }
          },
          {
            "stat": "STR%",
            "scope": "共用",
            "rates": {
              "restore": 0.1026,
              "shiningMirror": 0.12119999999999999,
              "dazzling": 0.1026,
              "equal": 0.1026,
              "union": 0.0121
            }
          },
          {
            "stat": "DEX%",
            "scope": "共用",
            "rates": {
              "restore": 0.1026,
              "shiningMirror": 0.12119999999999999,
              "dazzling": 0.1026,
              "equal": 0.1026,
              "union": 0.0121
            }
          },
          {
            "stat": "INT%",
            "scope": "共用",
            "rates": {
              "restore": 0.1026,
              "shiningMirror": 0.12119999999999999,
              "dazzling": 0.1026,
              "equal": 0.1026,
              "union": 0.0121
            }
          },
          {
            "stat": "LUK%",
            "scope": "共用",
            "rates": {
              "restore": 0.1026,
              "shiningMirror": 0.12119999999999999,
              "dazzling": 0.1026,
              "equal": 0.1026,
              "union": 0.0121
            }
          },
          {
            "stat": "全屬性%",
            "scope": "共用",
            "rates": {
              "restore": 0.07690000000000001,
              "shiningMirror": 0.0909,
              "dazzling": 0.07690000000000001,
              "equal": 0.07690000000000001,
              "union": 0.0121
            }
          }
        ]
      }
    }
  },
  "notes": [
    "*閃耀鏡射方塊 第二排潛能以20%機率複製第一排",
    "*閃炫方塊 裝備潛能等級套用規則",
    "*結合方塊 裝備潛能等級套用規則",
    "*結合方塊",
    "*經由方塊道具獲得的潛在能力屬性的數值，可能會根據裝備的等級進行變更",
    "*下方潛在能力屬性只能最多設定一個",
    "*下方潛在能力屬性只能最多設定兩個(閃耀鏡射方塊不在此限制內)",
    "*下方潛在能力屬性只能最多設定兩個(",
    "*恢復方塊由<特殊潛能直接跳升至罕見或傳說>和<稀有跳升至傳說>的機率，不會套用跳框加倍效果(包含幸運紅包-小豬)。(2025/7/9 11:42更新)",
    "*攻擊Boss怪物時傷害、無視怪物防禦率、爆擊機率會於命運武器上有更優越的素質，詳細可參考公告或遊戲中確認。"
  ]
};

if (typeof window !== 'undefined') {
  window.CUBE_RATES_8421 = CUBE_RATES_8421;
}
