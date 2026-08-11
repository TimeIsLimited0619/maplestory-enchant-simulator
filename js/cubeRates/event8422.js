/**
 * 裝備附加潛能強化方塊
 * 官方來源：https://maplestory-event.beanfun.com/eventad/eventad?eventadid=8422
 * 自動解析日期：2026-08-07
 * 請勿手動編輯；重新執行 scripts/parse-cube-rates.mjs 更新
 */
const CUBE_RATES_8422 = {
  "meta": {
    "eventId": 8422,
    "slug": "potential-additional",
    "title": "裝備附加潛能強化方塊",
    "sourceUrl": "https://maplestory-event.beanfun.com/eventad/eventad?eventadid=8422",
    "cubeColumns": [
      "precious",
      "restoreAdd",
      "absoluteAdd",
      "unionAdd"
    ],
    "cubeNames": [
      "珍貴附加方塊",
      "恢復附加方塊",
      "絕對附加方塊",
      "結合附加方塊"
    ],
    "parsedAt": "2026-08-07"
  },
  "rankUp": {
    "precious": {
      "name": "珍貴附加方塊",
      "rates": {
        "fromSpecial": {
          "special": 0.9523999999999999,
          "rare": 0.047599999999999996,
          "unique": null,
          "legendary": null
        },
        "fromRare": {
          "rare": 0.9804,
          "unique": 0.0196,
          "legendary": null
        },
        "fromUnique": {
          "unique": 0.995,
          "legendary": 0.005
        }
      }
    },
    "restoreAdd": {
      "name": "恢復附加方塊",
      "rates": {
        "fromSpecial": {
          "special": 0.9523999999999999,
          "rare": 0.047599999999999996,
          "unique": null,
          "legendary": null
        },
        "fromRare": {
          "rare": 0.9804,
          "unique": 0.0196,
          "legendary": null
        },
        "fromUnique": {
          "unique": 0.995,
          "legendary": 0.005
        }
      }
    },
    "absoluteAdd": {
      "name": "絕對附加方塊",
      "rates": {
        "fromSpecial": {
          "special": null,
          "rare": null,
          "unique": null,
          "legendary": null
        },
        "fromRare": {
          "rare": null,
          "unique": null,
          "legendary": null
        },
        "fromUnique": {
          "unique": null,
          "legendary": null
        }
      }
    },
    "unionAdd": {
      "name": "結合附加方塊",
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
    "precious": {
      "lines": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Special": {
          "same": 0.0196,
          "lower": 0.9804
        },
        "line3Special": {
          "same": 0.0196,
          "lower": 0.9804
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
          "same": 0.0196,
          "lower": 0.9804
        },
        "line3Unique": {
          "same": 0.0196,
          "lower": 0.9804
        },
        "line2Legendary": {
          "same": 0.005,
          "lower": 0.995
        },
        "line3Legendary": {
          "same": 0.005,
          "lower": 0.995
        }
      }
    },
    "restoreAdd": {
      "lines": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Special": {
          "same": 0.0196,
          "lower": 0.9804
        },
        "line3Special": {
          "same": 0.0196,
          "lower": 0.9804
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
          "same": 0.0196,
          "lower": 0.9804
        },
        "line3Unique": {
          "same": 0.0196,
          "lower": 0.9804
        },
        "line2Legendary": {
          "same": 0.005,
          "lower": 0.995
        },
        "line3Legendary": {
          "same": 0.005,
          "lower": 0.995
        }
      }
    },
    "absoluteAdd": {
      "lines": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Special": {
          "same": null,
          "lower": null
        },
        "line3Special": {
          "same": null,
          "lower": null
        },
        "line2Rare": {
          "same": null,
          "lower": null
        },
        "line3Rare": {
          "same": null,
          "lower": null
        }
      },
      "linesUniqueLegendary": {
        "line1": {
          "same": 1,
          "lower": 0
        },
        "line2Unique": {
          "same": null,
          "lower": null
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
          "same": 0,
          "lower": 0
        }
      }
    },
    "unionAdd": {
      "lines": {
        "line1": {
          "same": 0.005,
          "lower": 0.995
        },
        "line2Special": {
          "same": 0.005,
          "lower": 0.995
        },
        "line3Special": {
          "same": 0.005,
          "lower": 0.995
        },
        "line2Rare": {
          "same": 0.005,
          "lower": 0.995
        },
        "line3Rare": {
          "same": 0.005,
          "lower": 0.995
        }
      },
      "linesUniqueLegendary": {
        "line1": {
          "same": 0.005,
          "lower": 0.995
        },
        "line2Unique": {
          "same": 0.005,
          "lower": 0.995
        },
        "line3Unique": {
          "same": 0.005,
          "lower": 0.995
        },
        "line2Legendary": {
          "same": 0.005,
          "lower": 0.995
        },
        "line3Legendary": {
          "same": 0.005,
          "lower": 0.995
        }
      }
    }
  },
  "specialLineRules": {
    "unionAdd": [
      {
        "slot": "第一個",
        "same": 0.005,
        "lower": 0.995,
        "setRate": 0.3333333333333333
      },
      {
        "slot": "第二個",
        "same": 0.005,
        "lower": 0.995,
        "setRate": 0.3333333333333333
      },
      {
        "slot": "第三個",
        "same": 0.005,
        "lower": 0.995,
        "setRate": 0.3333333333333333
      }
    ]
  },
  "statRates": {
    "special": {
      "防具、其他::帽子, 上衣, 下衣, 套服, 手套, 鞋子, 披風, 腰帶, 肩膀裝飾, 機器心臟, 胸章": {
        "major": "防具、其他",
        "minor": "帽子, 上衣, 下衣, 套服, 手套, 鞋子, 披風, 腰帶, 肩膀裝飾, 機器心臟, 胸章",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "移動速度",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "跳躍力",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "防禦力",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "全屬性",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          }
        ]
      },
      "飾品::耳環, 眼睛裝飾, 戒指, 臉部裝飾, 墜飾": {
        "major": "飾品",
        "minor": "耳環, 眼睛裝飾, 戒指, 臉部裝飾, 墜飾",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "移動速度",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "跳躍力",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "防禦力",
            "scope": "共用",
            "rates": {
              "precious": 0.0638,
              "restoreAdd": 0.0638,
              "absoluteAdd": null,
              "unionAdd": 0.0638
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          },
          {
            "stat": "全屬性",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0426,
              "restoreAdd": 0.0426,
              "absoluteAdd": null,
              "unionAdd": 0.0426
            }
          }
        ]
      },
      "武器::武器,輔助武器,徽章": {
        "major": "武器",
        "minor": "武器,輔助武器,徽章",
        "entries": [
          {
            "stat": "最大HP",
            "scope": "共用",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "最大MP",
            "scope": "共用",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "移動速度",
            "scope": "共用",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "跳躍力",
            "scope": "共用",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "防禦力",
            "scope": "共用",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "STR",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0196,
              "restoreAdd": 0.0196,
              "absoluteAdd": null,
              "unionAdd": 0.0196
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0196,
              "restoreAdd": 0.0196,
              "absoluteAdd": null,
              "unionAdd": 0.0196
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0392,
              "restoreAdd": 0.0392,
              "absoluteAdd": null,
              "unionAdd": 0.0392
            }
          },
          {
            "stat": "總傷害",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0196,
              "restoreAdd": 0.0196,
              "absoluteAdd": null,
              "unionAdd": 0.0196
            }
          },
          {
            "stat": "全屬性",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          }
        ]
      }
    },
    "rare": {
      "防具、其他::帽子, 上衣, 下衣, 套服, 手套, 鞋子, 披風, 腰帶, 肩膀裝飾, 機器心臟, 胸章": {
        "major": "防具、其他",
        "minor": "帽子, 上衣, 下衣, 套服, 手套, 鞋子, 披風, 腰帶, 肩膀裝飾, 機器心臟, 胸章",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "移動速度",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "跳躍力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "防禦力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          }
        ]
      },
      "飾品::耳環, 眼睛裝飾, 戒指, 臉部裝飾, 墜飾": {
        "major": "飾品",
        "minor": "耳環, 眼睛裝飾, 戒指, 臉部裝飾, 墜飾",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "移動速度",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "跳躍力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "防禦力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "防禦力%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.06,
              "restoreAdd": 0.06,
              "absoluteAdd": null,
              "unionAdd": 0.06
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.04,
              "restoreAdd": 0.04,
              "absoluteAdd": null,
              "unionAdd": 0.04
            }
          }
        ]
      },
      "武器::武器,輔助武器,徽章": {
        "major": "武器",
        "minor": "武器,輔助武器,徽章",
        "entries": [
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0882,
              "restoreAdd": 0.0882,
              "absoluteAdd": null,
              "unionAdd": 0.0882
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0882,
              "restoreAdd": 0.0882,
              "absoluteAdd": null,
              "unionAdd": 0.0882
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0294,
              "restoreAdd": 0.0294,
              "absoluteAdd": null,
              "unionAdd": 0.0294
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0882,
              "restoreAdd": 0.0882,
              "absoluteAdd": null,
              "unionAdd": 0.0882
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0882,
              "restoreAdd": 0.0882,
              "absoluteAdd": null,
              "unionAdd": 0.0882
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0882,
              "restoreAdd": 0.0882,
              "absoluteAdd": null,
              "unionAdd": 0.0882
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0882,
              "restoreAdd": 0.0882,
              "absoluteAdd": null,
              "unionAdd": 0.0882
            }
          },
          {
            "stat": "總傷害",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0294,
              "restoreAdd": 0.0294,
              "absoluteAdd": null,
              "unionAdd": 0.0294
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0882,
              "restoreAdd": 0.0882,
              "absoluteAdd": null,
              "unionAdd": 0.0882
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0882,
              "restoreAdd": 0.0882,
              "absoluteAdd": null,
              "unionAdd": 0.0882
            }
          },
          {
            "stat": "無視怪物防禦力+3%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0588,
              "restoreAdd": 0.0588,
              "absoluteAdd": null,
              "unionAdd": 0.0588
            }
          }
        ]
      }
    },
    "unique": {
      "防具、其他::帽子, 上衣, 下衣, 套服, 手套, 鞋子, 披風, 腰帶, 肩膀裝飾, 機器心臟, 胸章": {
        "major": "防具、其他",
        "minor": "帽子, 上衣, 下衣, 套服, 手套, 鞋子, 披風, 腰帶, 肩膀裝飾, 機器心臟, 胸章",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0315,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0315,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0315,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0315,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0472,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.2518,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0316
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0316
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0031,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.2833,
              "unionAdd": 0.0316
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.2833,
              "unionAdd": 0.0633
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0633
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0633
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0633
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0633
            }
          }
        ]
      },
      "飾品::耳環, 眼睛裝飾, 戒指, 臉部裝飾, 墜飾": {
        "major": "飾品",
        "minor": "耳環, 眼睛裝飾, 戒指, 臉部裝飾, 墜飾",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0315,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0315,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0315,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0315,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0472,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.2518,
              "unionAdd": 0.0791
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0316
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0316
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.0031,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.2833,
              "unionAdd": 0.0316
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.019
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.061200000000000004,
              "restoreAdd": 0.061200000000000004,
              "absoluteAdd": 0.2833,
              "unionAdd": 0.0633
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0633
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0633
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0633
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0408,
              "restoreAdd": 0.0408,
              "absoluteAdd": 0.0006,
              "unionAdd": 0.0633
            }
          }
        ]
      },
      "武器::武器,輔助武器": {
        "major": "武器",
        "minor": "武器,輔助武器",
        "entries": [
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0698,
              "restoreAdd": 0.0698,
              "absoluteAdd": 0.0033,
              "unionAdd": 0.0246
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0698,
              "restoreAdd": 0.0698,
              "absoluteAdd": 0.297,
              "unionAdd": 0.0493
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.04650000000000001,
              "restoreAdd": 0.04650000000000001,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.0123
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.04650000000000001,
              "restoreAdd": 0.04650000000000001,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.0123
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.04650000000000001,
              "restoreAdd": 0.04650000000000001,
              "absoluteAdd": 0.033,
              "unionAdd": 0.0493
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0698,
              "restoreAdd": 0.0698,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.0246
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0698,
              "restoreAdd": 0.0698,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.0246
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0698,
              "restoreAdd": 0.0698,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.0246
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0698,
              "restoreAdd": 0.0698,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.0246
            }
          },
          {
            "stat": "總傷害",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0233,
              "restoreAdd": 0.0233,
              "absoluteAdd": 0.0017000000000000001,
              "unionAdd": 0.0197
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.04650000000000001,
              "restoreAdd": 0.04650000000000001,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.0246
            }
          },
          {
            "stat": "無視怪物防禦力+4%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0233,
              "restoreAdd": 0.0233,
              "absoluteAdd": 0.0495,
              "unionAdd": 0.09849999999999999
            }
          },
          {
            "stat": "攻擊BOSS怪物時傷害增加+12%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0233,
              "restoreAdd": 0.0233,
              "absoluteAdd": 0.0017000000000000001,
              "unionAdd": 0.0197
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0698,
              "restoreAdd": 0.0698,
              "absoluteAdd": 0.264,
              "unionAdd": 0.09849999999999999
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0698,
              "restoreAdd": 0.0698,
              "absoluteAdd": 0.264,
              "unionAdd": 0.09849999999999999
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.04650000000000001,
              "restoreAdd": 0.04650000000000001,
              "absoluteAdd": 0.0007000000000000001,
              "unionAdd": 0.09849999999999999
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.04650000000000001,
              "restoreAdd": 0.04650000000000001,
              "absoluteAdd": 0.0007000000000000001,
              "unionAdd": 0.09849999999999999
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.04650000000000001,
              "restoreAdd": 0.04650000000000001,
              "absoluteAdd": 0.0007000000000000001,
              "unionAdd": 0.09849999999999999
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.04650000000000001,
              "restoreAdd": 0.04650000000000001,
              "absoluteAdd": 0.0007000000000000001,
              "unionAdd": 0.09849999999999999
            }
          }
        ]
      },
      "武器::徽章": {
        "major": "武器",
        "minor": "徽章",
        "entries": [
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.07139999999999999,
              "restoreAdd": 0.07139999999999999,
              "absoluteAdd": 0.0033,
              "unionAdd": 0.025099999999999997
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.07139999999999999,
              "restoreAdd": 0.07139999999999999,
              "absoluteAdd": 0.2975,
              "unionAdd": 0.050300000000000004
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.047599999999999996,
              "restoreAdd": 0.047599999999999996,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.0126
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.047599999999999996,
              "restoreAdd": 0.047599999999999996,
              "absoluteAdd": 0.0003,
              "unionAdd": 0.0126
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.047599999999999996,
              "restoreAdd": 0.047599999999999996,
              "absoluteAdd": 0.0331,
              "unionAdd": 0.050300000000000004
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07139999999999999,
              "restoreAdd": 0.07139999999999999,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.025099999999999997
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07139999999999999,
              "restoreAdd": 0.07139999999999999,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.025099999999999997
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07139999999999999,
              "restoreAdd": 0.07139999999999999,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.025099999999999997
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07139999999999999,
              "restoreAdd": 0.07139999999999999,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.025099999999999997
            }
          },
          {
            "stat": "總傷害",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.023799999999999998,
              "restoreAdd": 0.023799999999999998,
              "absoluteAdd": 0.0017000000000000001,
              "unionAdd": 0.020099999999999996
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.047599999999999996,
              "restoreAdd": 0.047599999999999996,
              "absoluteAdd": 0.0165,
              "unionAdd": 0.025099999999999997
            }
          },
          {
            "stat": "無視怪物防禦力+4%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.023799999999999998,
              "restoreAdd": 0.023799999999999998,
              "absoluteAdd": 0.0496,
              "unionAdd": 0.1005
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復HP",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07139999999999999,
              "restoreAdd": 0.07139999999999999,
              "absoluteAdd": 0.2645,
              "unionAdd": 0.1005
            }
          },
          {
            "stat": "攻擊時有一定的機率恢復MP",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07139999999999999,
              "restoreAdd": 0.07139999999999999,
              "absoluteAdd": 0.2645,
              "unionAdd": 0.1005
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.047599999999999996,
              "restoreAdd": 0.047599999999999996,
              "absoluteAdd": 0.0007000000000000001,
              "unionAdd": 0.1005
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.047599999999999996,
              "restoreAdd": 0.047599999999999996,
              "absoluteAdd": 0.0007000000000000001,
              "unionAdd": 0.1005
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.047599999999999996,
              "restoreAdd": 0.047599999999999996,
              "absoluteAdd": 0.0007000000000000001,
              "unionAdd": 0.1005
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.047599999999999996,
              "restoreAdd": 0.047599999999999996,
              "absoluteAdd": 0.0007000000000000001,
              "unionAdd": 0.1005
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
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.0434,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.0434,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.0434,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.0434,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.0434,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.06509999999999999,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0347,
              "unionAdd": 0.026000000000000002
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0347,
              "unionAdd": 0.026000000000000002
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.0369,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.06509999999999999,
              "unionAdd": 0.026000000000000002
            }
          },
          {
            "stat": "爆擊傷害%",
            "scope": "防具專用",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0217,
              "unionAdd": 0.026000000000000002
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0347,
              "unionAdd": 0.0519
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0347,
              "unionAdd": 0.0519
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0347,
              "unionAdd": 0.0519
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0333,
              "restoreAdd": 0.0333,
              "absoluteAdd": 0.0347,
              "unionAdd": 0.0519
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.0695,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "減少所有技能冷卻時間(10秒以下會減少5%，不會減少到未滿5秒)",
            "scope": "帽子專用",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.0174,
              "unionAdd": 0.0104
            }
          },
          {
            "stat": "楓幣獲得量%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.06509999999999999,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "道具掉落率%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.05,
              "restoreAdd": 0.05,
              "absoluteAdd": 0.06509999999999999,
              "unionAdd": 0.0649
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
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0432,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0432,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0432,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0432,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0432,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0649,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0346,
              "unionAdd": 0.026000000000000002
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0346,
              "unionAdd": 0.026000000000000002
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0335,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0335,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0335,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0335,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0368,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0649,
              "unionAdd": 0.026000000000000002
            }
          },
          {
            "stat": "爆擊傷害%",
            "scope": "手套專用",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0216,
              "unionAdd": 0.0104
            }
          },
          {
            "stat": "爆擊傷害%",
            "scope": "防具專用",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0216,
              "unionAdd": 0.026000000000000002
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0335,
              "unionAdd": 0.015600000000000001
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0346,
              "unionAdd": 0.0519
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0346,
              "unionAdd": 0.0519
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0346,
              "unionAdd": 0.0519
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0339,
              "restoreAdd": 0.0339,
              "absoluteAdd": 0.0346,
              "unionAdd": 0.0519
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0692,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "楓幣獲得量%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0649,
              "unionAdd": 0.0649
            }
          },
          {
            "stat": "道具掉落率%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0508,
              "restoreAdd": 0.0508,
              "absoluteAdd": 0.0649,
              "unionAdd": 0.0649
            }
          }
        ]
      },
      "防具::上衣, 下衣, 套服, 披風, 腰帶, 鞋子, 肩膀裝飾": {
        "major": "防具",
        "minor": "上衣, 下衣, 套服, 披風, 腰帶, 鞋子, 肩膀裝飾",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.044199999999999996,
              "unionAdd": 0.06559999999999999
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.044199999999999996,
              "unionAdd": 0.06559999999999999
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.044199999999999996,
              "unionAdd": 0.06559999999999999
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.044199999999999996,
              "unionAdd": 0.06559999999999999
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.044199999999999996,
              "unionAdd": 0.06559999999999999
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0663,
              "unionAdd": 0.06559999999999999
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.0354,
              "unionAdd": 0.0262
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.0354,
              "unionAdd": 0.0262
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.034300000000000004,
              "unionAdd": 0.015700000000000002
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.034300000000000004,
              "unionAdd": 0.015700000000000002
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.034300000000000004,
              "unionAdd": 0.015700000000000002
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.034300000000000004,
              "unionAdd": 0.015700000000000002
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.037599999999999995,
              "unionAdd": 0.015700000000000002
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0663,
              "unionAdd": 0.0262
            }
          },
          {
            "stat": "爆擊傷害%",
            "scope": "防具專用",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.022099999999999998,
              "unionAdd": 0.0262
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.034300000000000004,
              "unionAdd": 0.015700000000000002
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.0354,
              "unionAdd": 0.0525
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.0354,
              "unionAdd": 0.0525
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.0354,
              "unionAdd": 0.0525
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0351,
              "restoreAdd": 0.0351,
              "absoluteAdd": 0.0354,
              "unionAdd": 0.0525
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0707,
              "unionAdd": 0.06559999999999999
            }
          },
          {
            "stat": "楓幣獲得量%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0663,
              "unionAdd": 0.06559999999999999
            }
          },
          {
            "stat": "道具掉落率%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0663,
              "unionAdd": 0.06559999999999999
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
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0421,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0421,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0421,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0421,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0421,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0632,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0327,
              "unionAdd": 0.0152
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0327,
              "unionAdd": 0.0152
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0327,
              "unionAdd": 0.0152
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0327,
              "unionAdd": 0.0152
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0358,
              "unionAdd": 0.0152
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0632,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0327,
              "unionAdd": 0.0152
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.050499999999999996
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.050499999999999996
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.050499999999999996
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0345,
              "restoreAdd": 0.0345,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.050499999999999996
            }
          },
          {
            "stat": "所有技能的MP消耗%",
            "scope": "飾品專用",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0674,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0674,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "楓幣獲得量%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0632,
              "unionAdd": 0.06309999999999999
            }
          },
          {
            "stat": "道具掉落率%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.051699999999999996,
              "restoreAdd": 0.051699999999999996,
              "absoluteAdd": 0.0632,
              "unionAdd": 0.06309999999999999
            }
          }
        ]
      },
      "武器::武器": {
        "major": "武器",
        "minor": "武器",
        "entries": [
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.07690000000000001,
              "restoreAdd": 0.07690000000000001,
              "absoluteAdd": 0.07150000000000001,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.07690000000000001,
              "restoreAdd": 0.07690000000000001,
              "absoluteAdd": 0.1263,
              "unionAdd": 0.050499999999999996
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0513,
              "restoreAdd": 0.0513,
              "absoluteAdd": 0.026099999999999998,
              "unionAdd": 0.0126
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0513,
              "restoreAdd": 0.0513,
              "absoluteAdd": 0.026099999999999998,
              "unionAdd": 0.0126
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0513,
              "restoreAdd": 0.0513,
              "absoluteAdd": 0.0471,
              "unionAdd": 0.050499999999999996
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07690000000000001,
              "restoreAdd": 0.07690000000000001,
              "absoluteAdd": 0.0471,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07690000000000001,
              "restoreAdd": 0.07690000000000001,
              "absoluteAdd": 0.0471,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07690000000000001,
              "restoreAdd": 0.07690000000000001,
              "absoluteAdd": 0.0471,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.07690000000000001,
              "restoreAdd": 0.07690000000000001,
              "absoluteAdd": 0.0471,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "總傷害",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0256,
              "restoreAdd": 0.0256,
              "absoluteAdd": 0.0463,
              "unionAdd": 0.0202
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0513,
              "restoreAdd": 0.0513,
              "absoluteAdd": 0.0471,
              "unionAdd": 0.0253
            }
          },
          {
            "stat": "無視怪物防禦力+5%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0256,
              "restoreAdd": 0.0256,
              "absoluteAdd": 0.0547,
              "unionAdd": 0.1263
            }
          },
          {
            "stat": "攻擊BOSS怪物時傷害增加+18%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0256,
              "restoreAdd": 0.0256,
              "absoluteAdd": 0.029500000000000002,
              "unionAdd": 0.0202
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0513,
              "restoreAdd": 0.0513,
              "absoluteAdd": 0.0673,
              "unionAdd": 0.10099999999999999
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0513,
              "restoreAdd": 0.0513,
              "absoluteAdd": 0.0673,
              "unionAdd": 0.10099999999999999
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0513,
              "restoreAdd": 0.0513,
              "absoluteAdd": 0.0673,
              "unionAdd": 0.10099999999999999
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0513,
              "restoreAdd": 0.0513,
              "absoluteAdd": 0.0673,
              "unionAdd": 0.10099999999999999
            }
          },
          {
            "stat": "攻擊力",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0256,
              "restoreAdd": 0.0256,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.0758
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0256,
              "restoreAdd": 0.0256,
              "absoluteAdd": 0.0337,
              "unionAdd": 0.0758
            }
          }
        ]
      },
      "武器::輔助武器": {
        "major": "武器",
        "minor": "輔助武器",
        "entries": [
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0732,
              "restoreAdd": 0.0732,
              "absoluteAdd": 0.0687,
              "unionAdd": 0.024
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0732,
              "restoreAdd": 0.0732,
              "absoluteAdd": 0.12119999999999999,
              "unionAdd": 0.0481
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.025,
              "unionAdd": 0.012
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.025,
              "unionAdd": 0.012
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0481
            }
          },
          {
            "stat": "爆擊傷害%",
            "scope": "防具專用",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.0404,
              "unionAdd": 0.0481
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0732,
              "restoreAdd": 0.0732,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.024
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0732,
              "restoreAdd": 0.0732,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.024
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0732,
              "restoreAdd": 0.0732,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.024
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0732,
              "restoreAdd": 0.0732,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.024
            }
          },
          {
            "stat": "總傷害",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.024399999999999998,
              "restoreAdd": 0.024399999999999998,
              "absoluteAdd": 0.0444,
              "unionAdd": 0.0192
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.024
            }
          },
          {
            "stat": "無視怪物防禦力+5%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.024399999999999998,
              "restoreAdd": 0.024399999999999998,
              "absoluteAdd": 0.0525,
              "unionAdd": 0.1202
            }
          },
          {
            "stat": "攻擊BOSS怪物時傷害增加+18%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.024399999999999998,
              "restoreAdd": 0.024399999999999998,
              "absoluteAdd": 0.028300000000000002,
              "unionAdd": 0.0192
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.0646,
              "unionAdd": 0.0962
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.0646,
              "unionAdd": 0.0962
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.0646,
              "unionAdd": 0.0962
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.048799999999999996,
              "restoreAdd": 0.048799999999999996,
              "absoluteAdd": 0.0646,
              "unionAdd": 0.0962
            }
          },
          {
            "stat": "攻擊力",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.024399999999999998,
              "restoreAdd": 0.024399999999999998,
              "absoluteAdd": 0.0323,
              "unionAdd": 0.0721
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.024399999999999998,
              "restoreAdd": 0.024399999999999998,
              "absoluteAdd": 0.0323,
              "unionAdd": 0.0721
            }
          }
        ]
      },
      "武器::徽章": {
        "major": "武器",
        "minor": "徽章",
        "entries": [
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0789,
              "restoreAdd": 0.0789,
              "absoluteAdd": 0.0737,
              "unionAdd": 0.0258
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0789,
              "restoreAdd": 0.0789,
              "absoluteAdd": 0.1301,
              "unionAdd": 0.051500000000000004
            }
          },
          {
            "stat": "物理攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0269,
              "unionAdd": 0.0129
            }
          },
          {
            "stat": "魔法攻擊力%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0269,
              "unionAdd": 0.0129
            }
          },
          {
            "stat": "爆擊機率%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.048600000000000004,
              "unionAdd": 0.051500000000000004
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0789,
              "restoreAdd": 0.0789,
              "absoluteAdd": 0.048600000000000004,
              "unionAdd": 0.0258
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0789,
              "restoreAdd": 0.0789,
              "absoluteAdd": 0.048600000000000004,
              "unionAdd": 0.0258
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0789,
              "restoreAdd": 0.0789,
              "absoluteAdd": 0.048600000000000004,
              "unionAdd": 0.0258
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0789,
              "restoreAdd": 0.0789,
              "absoluteAdd": 0.048600000000000004,
              "unionAdd": 0.0258
            }
          },
          {
            "stat": "總傷害",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0263,
              "restoreAdd": 0.0263,
              "absoluteAdd": 0.04769999999999999,
              "unionAdd": 0.0206
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.048600000000000004,
              "unionAdd": 0.0258
            }
          },
          {
            "stat": "無視怪物防禦力+5%",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0263,
              "restoreAdd": 0.0263,
              "absoluteAdd": 0.0564,
              "unionAdd": 0.12890000000000001
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0694,
              "unionAdd": 0.10310000000000001
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0694,
              "unionAdd": 0.10310000000000001
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0694,
              "unionAdd": 0.10310000000000001
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0526,
              "restoreAdd": 0.0526,
              "absoluteAdd": 0.0694,
              "unionAdd": 0.10310000000000001
            }
          },
          {
            "stat": "攻擊力",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0263,
              "restoreAdd": 0.0263,
              "absoluteAdd": 0.0347,
              "unionAdd": 0.07730000000000001
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器可以",
            "rates": {
              "precious": 0.0263,
              "restoreAdd": 0.0263,
              "absoluteAdd": 0.0347,
              "unionAdd": 0.07730000000000001
            }
          }
        ]
      },
      "其他::機器心臟": {
        "major": "其他",
        "minor": "機器心臟",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0678,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.027000000000000003
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.027000000000000003
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0384,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0678,
              "unionAdd": 0.027000000000000003
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.053899999999999997
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.053899999999999997
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.053899999999999997
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.053899999999999997
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0723,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "楓幣獲得量%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0678,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "道具掉落率%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0678,
              "unionAdd": 0.0674
            }
          }
        ]
      },
      "其他::胸章": {
        "major": "其他",
        "minor": "胸章",
        "entries": [
          {
            "stat": "STR",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "DEX",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "INT",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "LUK",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "最大HP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0452,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "最大MP",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0678,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "物理攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.027000000000000003
            }
          },
          {
            "stat": "魔法攻擊力",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.027000000000000003
            }
          },
          {
            "stat": "STR%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "DEX%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "INT%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "LUK%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "最大HP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0384,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "最大MP%",
            "scope": "共用",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0678,
              "unionAdd": 0.027000000000000003
            }
          },
          {
            "stat": "全屬性%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.035,
              "unionAdd": 0.016200000000000003
            }
          },
          {
            "stat": "以角色等級為準每9級增加力量",
            "scope": "共用",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.053899999999999997
            }
          },
          {
            "stat": "以角色等級為準每9級增加敏捷",
            "scope": "共用",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.053899999999999997
            }
          },
          {
            "stat": "以角色等級為準每9級增加智力",
            "scope": "共用",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.053899999999999997
            }
          },
          {
            "stat": "以角色等級為準每9級增加幸運",
            "scope": "共用",
            "rates": {
              "precious": 0.0364,
              "restoreAdd": 0.0364,
              "absoluteAdd": 0.0362,
              "unionAdd": 0.053899999999999997
            }
          },
          {
            "stat": "HP恢復道具及恢復技能效果增加",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0723,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "楓幣獲得量%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0678,
              "unionAdd": 0.0674
            }
          },
          {
            "stat": "道具掉落率%",
            "scope": "只有武器不可",
            "rates": {
              "precious": 0.0545,
              "restoreAdd": 0.0545,
              "absoluteAdd": 0.0678,
              "unionAdd": 0.0674
            }
          }
        ]
      }
    }
  },
  "notes": [
    "*閃亮附加方塊",
    "*結合附加方塊",
    "*經由方塊道具獲得的潛在能力屬性的數值，可能會根據裝備的等級進行變更",
    "*下方潛在能力屬性只能最多設定一個",
    "*下方潛在能力屬性只能最多設定兩個",
    "*攻擊Boss怪物時傷害、無視怪物防禦率、爆擊機率會於命運武器上有更優越的素質，詳細可參考公告或遊戲中確認。"
  ]
};

if (typeof window !== 'undefined') {
  window.CUBE_RATES_8422 = CUBE_RATES_8422;
}
