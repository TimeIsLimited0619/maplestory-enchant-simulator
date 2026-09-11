/**
 * 手裡劍（Consume 0207）資料與 bullet 幀。由 scripts/import-throwing-star.mjs 產生。
 */
const ThrowingStarBullet = (() => {
  const DEFAULT_ID = '02070000';
  const ITEMS = {
  "02070000": {
    "id": "02070000",
    "name": "亞坤飛鏢",
    "icon": "images/items/consume/0207/02070000/icon.png",
    "iconRaw": "images/items/consume/0207/02070000/iconRaw.png",
    "incPAD": 15,
    "reqLevel": 10,
    "price": 250,
    "frames": [
      {
        "src": "images/items/consume/0207/02070000/bullet/0.png",
        "delay": 30,
        "origin": [
          9,
          9
        ]
      },
      {
        "src": "images/items/consume/0207/02070000/bullet/1.png",
        "delay": 30,
        "origin": [
          8,
          8
        ]
      }
    ]
  },
  "02070001": {
    "id": "02070001",
    "name": "半月飛鏢",
    "icon": "images/items/consume/0207/02070001/icon.png",
    "iconRaw": "images/items/consume/0207/02070001/iconRaw.png",
    "incPAD": 17,
    "reqLevel": 10,
    "price": 500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070001/bullet/0.png",
        "delay": 30,
        "origin": [
          9,
          9
        ]
      },
      {
        "src": "images/items/consume/0207/02070001/bullet/1.png",
        "delay": 30,
        "origin": [
          9,
          10
        ]
      }
    ]
  },
  "02070002": {
    "id": "02070002",
    "name": "三角形飛鏢",
    "icon": "images/items/consume/0207/02070002/icon.png",
    "iconRaw": "images/items/consume/0207/02070002/iconRaw.png",
    "incPAD": 19,
    "reqLevel": 10,
    "price": 1000,
    "frames": [
      {
        "src": "images/items/consume/0207/02070002/bullet/0.png",
        "delay": 30,
        "origin": [
          10,
          10
        ]
      },
      {
        "src": "images/items/consume/0207/02070002/bullet/1.png",
        "delay": 30,
        "origin": [
          11,
          11
        ]
      }
    ]
  },
  "02070003": {
    "id": "02070003",
    "name": "黃金飛鏢",
    "icon": "images/items/consume/0207/02070003/icon.png",
    "iconRaw": "images/items/consume/0207/02070003/iconRaw.png",
    "incPAD": 21,
    "reqLevel": 10,
    "price": 1500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070003/bullet/0.png",
        "delay": 30,
        "origin": [
          10,
          10
        ]
      },
      {
        "src": "images/items/consume/0207/02070003/bullet/1.png",
        "delay": 30,
        "origin": [
          8,
          9
        ]
      }
    ]
  },
  "02070004": {
    "id": "02070004",
    "name": "海星飛鏢",
    "icon": "images/items/consume/0207/02070004/icon.png",
    "iconRaw": "images/items/consume/0207/02070004/iconRaw.png",
    "incPAD": 23,
    "reqLevel": 10,
    "price": 2500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070004/bullet/0.png",
        "delay": 30,
        "origin": [
          9,
          9
        ]
      },
      {
        "src": "images/items/consume/0207/02070004/bullet/1.png",
        "delay": 30,
        "origin": [
          11,
          11
        ]
      }
    ]
  },
  "02070005": {
    "id": "02070005",
    "name": "雪球",
    "icon": "images/items/consume/0207/02070005/icon.png",
    "iconRaw": "images/items/consume/0207/02070005/iconRaw.png",
    "incPAD": 25,
    "reqLevel": 10,
    "price": 10000,
    "frames": [
      {
        "src": "images/items/consume/0207/02070005/bullet/0.png",
        "delay": 30,
        "origin": [
          24,
          4
        ]
      },
      {
        "src": "images/items/consume/0207/02070005/bullet/1.png",
        "delay": 30,
        "origin": [
          24,
          4
        ]
      }
    ]
  },
  "02070006": {
    "id": "02070006",
    "name": "木製陀螺",
    "icon": "images/items/consume/0207/02070006/icon.png",
    "iconRaw": "images/items/consume/0207/02070006/iconRaw.png",
    "incPAD": 27,
    "reqLevel": 10,
    "price": 20000,
    "frames": [
      {
        "src": "images/items/consume/0207/02070006/bullet/0.png",
        "delay": 30,
        "origin": [
          13,
          13
        ]
      },
      {
        "src": "images/items/consume/0207/02070006/bullet/1.png",
        "delay": 30,
        "origin": [
          13,
          13
        ]
      }
    ]
  },
  "02070007": {
    "id": "02070007",
    "name": "冰錐",
    "icon": "images/items/consume/0207/02070007/icon.png",
    "iconRaw": "images/items/consume/0207/02070007/iconRaw.png",
    "incPAD": 27,
    "reqLevel": 70,
    "price": 25000,
    "frames": [
      {
        "src": "images/items/consume/0207/02070007/bullet/0.png",
        "delay": 30,
        "origin": [
          9,
          9
        ]
      },
      {
        "src": "images/items/consume/0207/02070007/bullet/1.png",
        "delay": 30,
        "origin": [
          9,
          10
        ]
      }
    ]
  },
  "02070008": {
    "id": "02070008",
    "name": "楓葉飛鏢",
    "icon": "images/items/consume/0207/02070008/icon.png",
    "iconRaw": "images/items/consume/0207/02070008/iconRaw.png",
    "incPAD": 17,
    "reqLevel": 10,
    "price": 500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070008/bullet/0.png",
        "delay": 30,
        "origin": [
          18,
          11
        ]
      },
      {
        "src": "images/items/consume/0207/02070008/bullet/1.png",
        "delay": 30,
        "origin": [
          17,
          11
        ]
      },
      {
        "src": "images/items/consume/0207/02070008/bullet/2.png",
        "delay": 30,
        "origin": [
          18,
          11
        ]
      }
    ]
  },
  "02070009": {
    "id": "02070009",
    "name": "齒輪飛鏢",
    "icon": "images/items/consume/0207/02070009/icon.png",
    "iconRaw": "images/items/consume/0207/02070009/iconRaw.png",
    "incPAD": 19,
    "reqLevel": 10,
    "price": 500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070009/bullet/0.png",
        "delay": 30,
        "origin": [
          12,
          11
        ]
      },
      {
        "src": "images/items/consume/0207/02070009/bullet/1.png",
        "delay": 30,
        "origin": [
          13,
          11
        ]
      },
      {
        "src": "images/items/consume/0207/02070009/bullet/2.png",
        "delay": 30,
        "origin": [
          13,
          11
        ]
      }
    ]
  },
  "02070010": {
    "id": "02070010",
    "name": "鋼鐵飛鏢",
    "icon": "images/items/consume/0207/02070010/icon.png",
    "iconRaw": "images/items/consume/0207/02070010/iconRaw.png",
    "incPAD": 21,
    "reqLevel": 10,
    "price": 500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070010/bullet/0.png",
        "delay": 30,
        "origin": [
          17,
          7
        ]
      },
      {
        "src": "images/items/consume/0207/02070010/bullet/1.png",
        "delay": 30,
        "origin": [
          17,
          7
        ]
      },
      {
        "src": "images/items/consume/0207/02070010/bullet/2.png",
        "delay": 30,
        "origin": [
          17,
          6
        ]
      }
    ]
  },
  "02070011": {
    "id": "02070011",
    "name": "骨頭飛鏢",
    "icon": "images/items/consume/0207/02070011/icon.png",
    "iconRaw": "images/items/consume/0207/02070011/iconRaw.png",
    "incPAD": 21,
    "reqLevel": 10,
    "price": 500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070011/bullet/0.png",
        "delay": 30,
        "origin": [
          18,
          10
        ]
      },
      {
        "src": "images/items/consume/0207/02070011/bullet/1.png",
        "delay": 30,
        "origin": [
          18,
          8
        ]
      },
      {
        "src": "images/items/consume/0207/02070011/bullet/2.png",
        "delay": 30,
        "origin": [
          18,
          6
        ]
      }
    ]
  },
  "02070012": {
    "id": "02070012",
    "name": "平衡之怒",
    "icon": "images/items/consume/0207/02070012/icon.png",
    "iconRaw": "images/items/consume/0207/02070012/iconRaw.png",
    "incPAD": 20,
    "reqLevel": 0,
    "price": 2500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070012/bullet/0.png",
        "delay": 30,
        "origin": [
          16,
          7
        ]
      },
      {
        "src": "images/items/consume/0207/02070012/bullet/1.png",
        "delay": 30,
        "origin": [
          16,
          8
        ]
      },
      {
        "src": "images/items/consume/0207/02070012/bullet/2.png",
        "delay": 30,
        "origin": [
          16,
          7
        ]
      }
    ]
  },
  "02070013": {
    "id": "02070013",
    "name": "雲霧飛鏢",
    "icon": "images/items/consume/0207/02070013/icon.png",
    "iconRaw": "images/items/consume/0207/02070013/iconRaw.png",
    "incPAD": 20,
    "reqLevel": 0,
    "price": 2500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070013/bullet/0.png",
        "delay": 30,
        "origin": [
          8,
          6
        ]
      },
      {
        "src": "images/items/consume/0207/02070013/bullet/1.png",
        "delay": 30,
        "origin": [
          9,
          7
        ]
      },
      {
        "src": "images/items/consume/0207/02070013/bullet/2.png",
        "delay": 30,
        "origin": [
          10,
          7
        ]
      }
    ]
  },
  "02070015": {
    "id": "02070015",
    "name": "紙飛機",
    "icon": "images/items/consume/0207/02070015/icon.png",
    "iconRaw": "images/items/consume/0207/02070015/iconRaw.png",
    "incPAD": 15,
    "reqLevel": 10,
    "price": 1,
    "frames": [
      {
        "src": "images/items/consume/0207/02070015/bullet/0.png",
        "delay": 30,
        "origin": [
          9,
          9
        ]
      },
      {
        "src": "images/items/consume/0207/02070015/bullet/1.png",
        "delay": 30,
        "origin": [
          8,
          8
        ]
      }
    ]
  },
  "02070023": {
    "id": "02070023",
    "name": "火焰飛鏢",
    "icon": "images/items/consume/0207/02070023/icon.png",
    "iconRaw": "images/items/consume/0207/02070023/iconRaw.png",
    "incPAD": 29,
    "reqLevel": 130,
    "price": 30000,
    "frames": [
      {
        "src": "images/items/consume/0207/02070023/bullet/0.png",
        "delay": 30,
        "origin": [
          15,
          15
        ]
      },
      {
        "src": "images/items/consume/0207/02070023/bullet/1.png",
        "delay": 30,
        "origin": [
          13,
          13
        ]
      }
    ]
  },
  "02070024": {
    "id": "02070024",
    "name": "水晶飛鏢",
    "icon": "images/items/consume/0207/02070024/icon.png",
    "iconRaw": "images/items/consume/0207/02070024/iconRaw.png",
    "incPAD": 27,
    "reqLevel": 10,
    "price": 20000,
    "frames": [
      {
        "src": "images/items/consume/0207/02070024/bullet/0.png",
        "delay": 30,
        "origin": [
          31,
          6
        ]
      },
      {
        "src": "images/items/consume/0207/02070024/bullet/1.png",
        "delay": 30,
        "origin": [
          31,
          6
        ]
      }
    ]
  },
  "02070025": {
    "id": "02070025",
    "name": "飛鏢",
    "icon": "images/items/consume/0207/02070025/icon.png",
    "iconRaw": "images/items/consume/0207/02070025/iconRaw.png",
    "incPAD": 0,
    "reqLevel": 0,
    "price": 0,
    "frames": [
      {
        "src": "images/items/consume/0207/02070025/bullet/0.png",
        "delay": 30,
        "origin": [
          18,
          18
        ]
      },
      {
        "src": "images/items/consume/0207/02070025/bullet/1.png",
        "delay": 30,
        "origin": [
          17,
          17
        ]
      }
    ]
  },
  "02070026": {
    "id": "02070026",
    "name": "閃亮星星",
    "icon": "images/items/consume/0207/02070026/icon.png",
    "iconRaw": "images/items/consume/0207/02070026/iconRaw.png",
    "incPAD": 28,
    "reqLevel": 100,
    "price": 0,
    "frames": [
      {
        "src": "images/items/consume/0207/02070026/bullet/0.png",
        "delay": 30,
        "origin": [
          18,
          18
        ]
      },
      {
        "src": "images/items/consume/0207/02070026/bullet/1.png",
        "delay": 30,
        "origin": [
          17,
          17
        ]
      }
    ]
  },
  "02070019": {
    "id": "02070019",
    "name": "新手飛鏢",
    "icon": "images/items/consume/0207/02070019/icon.png",
    "iconRaw": "images/items/consume/0207/02070019/iconRaw.png",
    "incPAD": 30,
    "reqLevel": 50,
    "price": 1,
    "frames": [
      {
        "src": "images/items/consume/0207/02070019/bullet/0.png",
        "delay": 30,
        "origin": [
          34,
          29
        ]
      },
      {
        "src": "images/items/consume/0207/02070019/bullet/1.png",
        "delay": 30,
        "origin": [
          27,
          29
        ]
      },
      {
        "src": "images/items/consume/0207/02070019/bullet/2.png",
        "delay": 30,
        "origin": [
          33,
          34
        ]
      },
      {
        "src": "images/items/consume/0207/02070019/bullet/3.png",
        "delay": 30,
        "origin": [
          27,
          30
        ]
      }
    ]
  },
  "02070020": {
    "id": "02070020",
    "name": "飛鏢",
    "icon": "images/items/consume/0207/02070020/icon.png",
    "iconRaw": "images/items/consume/0207/02070020/iconRaw.png",
    "incPAD": 17,
    "reqLevel": 10,
    "price": 1,
    "frames": [
      {
        "src": "images/items/consume/0207/02070020/bullet/0.png",
        "delay": 30,
        "origin": [
          46,
          9
        ]
      },
      {
        "src": "images/items/consume/0207/02070020/bullet/1.png",
        "delay": 30,
        "origin": [
          53,
          9
        ]
      },
      {
        "src": "images/items/consume/0207/02070020/bullet/2.png",
        "delay": 30,
        "origin": [
          58,
          8
        ]
      },
      {
        "src": "images/items/consume/0207/02070020/bullet/3.png",
        "delay": 30,
        "origin": [
          53,
          9
        ]
      }
    ]
  },
  "02070021": {
    "id": "02070021",
    "name": "飛鏢",
    "icon": "images/items/consume/0207/02070021/icon.png",
    "iconRaw": "images/items/consume/0207/02070021/iconRaw.png",
    "incPAD": 20,
    "reqLevel": 8,
    "price": 500,
    "frames": [
      {
        "src": "images/items/consume/0207/02070021/bullet/0.png",
        "delay": 30,
        "origin": [
          13,
          12
        ]
      },
      {
        "src": "images/items/consume/0207/02070021/bullet/1.png",
        "delay": 30,
        "origin": [
          14,
          13
        ]
      },
      {
        "src": "images/items/consume/0207/02070021/bullet/2.png",
        "delay": 30,
        "origin": [
          12,
          14
        ]
      }
    ]
  },
  "02070022": {
    "id": "02070022",
    "name": "飛鏢",
    "icon": "images/items/consume/0207/02070022/icon.png",
    "iconRaw": "images/items/consume/0207/02070022/iconRaw.png",
    "incPAD": 15,
    "reqLevel": 10,
    "price": 1,
    "frames": [
      {
        "src": "images/items/consume/0207/02070022/bullet/0.png",
        "delay": 30,
        "origin": [
          45,
          16
        ]
      },
      {
        "src": "images/items/consume/0207/02070022/bullet/1.png",
        "delay": 30,
        "origin": [
          45,
          17
        ]
      }
    ]
  },
  "02070018": {
    "id": "02070018",
    "name": "初級飛鏢",
    "icon": "images/items/consume/0207/02070018/icon.png",
    "iconRaw": "images/items/consume/0207/02070018/iconRaw.png",
    "incPAD": 30,
    "reqLevel": 70,
    "price": 0,
    "frames": [
      {
        "src": "images/items/consume/0207/02070018/bullet/0.png",
        "delay": 30,
        "origin": [
          16,
          18
        ]
      },
      {
        "src": "images/items/consume/0207/02070018/bullet/1.png",
        "delay": 30,
        "origin": [
          18,
          16
        ]
      },
      {
        "src": "images/items/consume/0207/02070018/bullet/2.png",
        "delay": 30,
        "origin": [
          16,
          18
        ]
      },
      {
        "src": "images/items/consume/0207/02070018/bullet/3.png",
        "delay": 30,
        "origin": [
          18,
          16
        ]
      }
    ]
  },
  "02070029": {
    "id": "02070029",
    "name": "惡魔之眼",
    "icon": "images/items/consume/0207/02070029/icon.png",
    "iconRaw": "images/items/consume/0207/02070029/iconRaw.png",
    "incPAD": 30,
    "reqLevel": 50,
    "price": 1,
    "frames": [
      {
        "src": "images/items/consume/0207/02070029/bullet/0.png",
        "delay": 30,
        "origin": [
          34,
          29
        ]
      },
      {
        "src": "images/items/consume/0207/02070029/bullet/1.png",
        "delay": 30,
        "origin": [
          27,
          29
        ]
      },
      {
        "src": "images/items/consume/0207/02070029/bullet/2.png",
        "delay": 30,
        "origin": [
          33,
          34
        ]
      },
      {
        "src": "images/items/consume/0207/02070029/bullet/3.png",
        "delay": 30,
        "origin": [
          27,
          30
        ]
      }
    ]
  }
};

  function padId(itemId) {
    const s = String(itemId == null ? '' : itemId).replace(/\D/g, '');
    if (!s) return '';
    return s.padStart(8, '0');
  }

  function get(itemId) {
    const id = padId(itemId);
    return id ? (ITEMS[id] || null) : null;
  }

  function list() {
    return Object.keys(ITEMS).sort().map((id) => ITEMS[id]);
  }

  function framesFor(itemId) {
    const rec = get(itemId) || ITEMS[DEFAULT_ID];
    return rec?.frames ? rec.frames.slice() : [];
  }

  function attachToFx(fx, itemId) {
    const frames = framesFor(itemId);
    if (!frames.length) return fx || {};
    return { ...(fx || {}), ball: { frames } };
  }

  return { DEFAULT_ID, ITEMS, padId, get, list, framesFor, attachToFx };
})();

if (typeof window !== 'undefined') {
  window.ThrowingStarBullet = ThrowingStarBullet;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThrowingStarBullet;
}
