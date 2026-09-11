/**
 * 技能覆寫 — WZ 原資料與本專案玩法不一致時使用。
 * - import-skill-wz.mjs 寫入 skillJobData 前會 merge
 * - SkillCatalog 讀取時也會套用（避免漏跑匯入）
 */
const SkillOverrides = (() => {
  /**
   * @type {Record<string, {
   *   h?: string,
   *   desc?: string,
   *   toggle?: boolean,
   *   skipPanel?: boolean,
   *   equipable?: boolean,
   *   addAttackRemove?: boolean,
   *   replacesSkill?: string,
   *   addAttackPrefer?: string[],
   *   common?: Record<string, string>,
   *   commonRemove?: string[]
   * }>}
   */
  const PATCHES = {
    // 烈焰翔斬：不做隊員攻擊加傷；說明與實作對齊（DoT + 所受傷害↑）
    '1121015': {
      h: '消耗MP#mpCon，對#mobCount名敵人以#damage%的傷害攻擊#attackCount次，攻擊一般怪物時傷害#nbdR%增加\\n被攻擊的敵人以#prop%機率在#dotTime秒內每#dotInterval秒承受#dot%的持續傷害，且所受傷害增加#x%',
      commonRemove: ['u'],
    },
    '1141008': {
      h: '消耗MP#mpCon，對最多#mobCount名敵人以#damage%的傷害攻擊#attackCount次，攻擊一般怪物時傷害#nbdR%增加\\n被攻擊的敵人以#prop%機率在#dotTime秒內每#dotInterval秒承受#dot%的持續傷害，且所受傷害增加#x%',
      commonRemove: ['u'],
    },

    // 英雄「激勵」：改常駐被動（攻擊力／減傷／反射）
    '1101006': {
      type: 'passive',
      equipable: false,
      h: '永久：攻擊力增加#indiePad\\n被擊傷害減少#indiePowerGuard%，並反射#y%傷害',
      desc: '劍與靈魂合而為一，永久增加攻擊力，並減少被擊傷害、反射所受傷害。',
      commonRemove: ['time', 'mpCon', 'lt', 'rb'],
    },
    // 英雄「恢復術」：角色每等 +(50×技能等) 防禦、+(100×技能等) HP
    '1110011': {
      h: '角色每等級額外增加防禦力 #lv2pdd、最大HP #lv2mhp',
      desc: '依角色等級與技能等級永久增加防禦力與最大HP。',
      common: {
        lv2pdd: '5*x',
        lv2mhp: '8*x',
      },
      commonRemove: ['asrR', 'terR'],
    },

    // 1轉 魔靈彈：攻擊隻數 6、耗血減半（mpCon 減半）
    '2001008': {
      common: {
        mobCount: '6',
        mpCon: '8+d(x/5)',
      },
      h: '消耗HP#mpCon，最多對#mobCount名的敵人以#damage%的傷害值進行攻擊#attackCount次',
    },

    // —— 法師：本專案無 MP，MP 相關改 HP ——
    // 1轉 魔力增幅：最大 HP% + 每等 HP + 攻速
    '2000006': {
      h: '最大HP增加#mhpR%，攻擊速度提升1階段，角色每等級額外增加HP #lv2mhp\\n裝備短杖時，爆擊機率額外增加5%',
      desc: '強化魔力循環改為強化生命力：提高最大HP與攻擊速度。',
      common: {
        mhpR: 'x',
        lv2mhp: '20+5*x',
      },
      commonRemove: ['mmpR', 'lv2mmp'],
    },
    // 1轉 魔力之盾
    '2000010': {
      h: '防禦力增加#pddX',
      desc: '將魔力凝聚在盔甲上，使防禦力提升。',
    },
    // 2轉 魔力吸收（火毒／冰雷）：命中時吸 HP
    '2100000': {
      h: '使用技能命中敵人時，以#prop%機率恢復自身最大HP的#x%\\n命中BOSS時改為恢復最大HP的#y%',
      desc: '魔法攻擊命中時，有機會吸收敵人體力轉為自身HP。對Boss效果較差。',
    },
    '2200000': {
      h: '使用技能命中敵人時，以#prop%機率恢復自身最大HP的#x%\\n命中BOSS時改為恢復最大HP的#y%',
      desc: '魔法攻擊命中時，有機會吸收敵人體力轉為自身HP。對Boss效果較差。',
    },
    // 2轉 精神強化：indieMad → 魔力（flatMad）
    '2101001': {
      h: '消耗HP #mpCon，#time秒內魔力（魔法攻擊力）增加#indieMad',
      desc: '短暫冥想以提升魔力。',
    },
    '2201001': {
      h: '消耗HP #mpCon，#time秒內魔力（魔法攻擊力）增加#indieMad',
      desc: '短暫冥想以提升魔力。',
    },
    // 2轉 冰雪結界：開關技＋所受傷害減少（勿每 8 秒重放）
    '2201009': {
      toggle: true,
      h: '【開關技能】開啟後持續生效，再次施放可關閉\\n所受傷害減少#y%',
      desc: '以寒氣護罩保護自身。開關技能；開啟期間減少受到的傷害。',
      common: {
        damAbsorbShieldR: '2*x',
        time: '86400',
      },
    },
    // 3轉 魔力激發：耗血% + 傷害（說明由 formatSkillText 把 MP 改成 HP／耗血）
    '2110001': {
      h: '額外提高耗血#costmpR%，增加攻擊魔法的傷害#damR%',
      desc: '消耗更多的HP，但相對的除了火靈結界以外的攻擊魔法的傷害增加威力。',
    },
    '2210001': {
      h: '額外提高耗血#costmpR%，增加攻擊魔法的傷害#damR%',
      desc: '消耗更多的HP，然而所有攻擊魔法的傷害增加威力。',
    },
    // 三轉 終極魔法：對異常／結冰等狀態敵人最終傷害
    '2210000': {
      h: '攻擊持續傷害、昏迷、結冰、暗黑、痲痹狀態的敵人時，最終傷害增加#z%',
      desc: '攻擊處於異常或結冰等狀態的敵人時，提高最終傷害。',
    },
    '2110000': {
      h: '持續傷害時間增加#x%\\n攻擊持續傷害、暈眩、結冰、黑暗、麻痺狀態敵人時最終傷害增加#z%',
      desc: '延長持續傷害，並對異常狀態敵人提高最終傷害。',
    },
    // 瞬移相關：放置無瞬移操作
    '2210017': { skipPanel: true },
    '2221045': { skipPanel: true },
    // 四轉 魔力無限：只回 HP（無 MP）
    '2120004': {
      h: '每#x秒恢復最大HP的#s%\\n最終傷害增加#mdR%',
      desc: '引出無限魔力以恢復生命並強化魔法最終傷害。',
    },
    '2220004': {
      h: '每#x秒恢復最大HP的#s%\\n最終傷害增加#mdR%',
      desc: '引出無限魔力以恢復生命並強化魔法最終傷害。',
    },
    // 劍士自身強化：法師亦可學習
    '1000003': {
      h: '增加#pddX防禦力，最大HP#mhpR%。被敵人攻擊時，傷害減少#damAbsorbShieldR%',
      desc: '強化自身防禦與最大HP，並減少受到的傷害。',
    },

    // —— 法師：隱藏瞬移／魔力波動（瞬間移動精通改回面板，只留永久格擋被動）——
    '2001009': { skipPanel: true }, // 瞬間移動
    '2001011': { skipPanel: true }, // 魔力波動
    '2110016': { skipPanel: true }, // 瞬間移動爆發
    // 2210017 已於上方 skipPanel
    // 火毒／冰雷「瞬間移動精通」：不施放瞬移傷害，只保留永久格擋
    '2111007': {
      type: 'passive',
      equipable: false,
      h: '永久增加格擋機率#stanceProp%',
      desc: '永久增加格擋機率。',
    },
    '2211007': {
      type: 'passive',
      equipable: false,
      h: '永久增加格擋機率#stanceProp%',
      desc: '永久增加格擋機率。',
    },

    // —— 三轉被動說明 ——
    '2110009': {
      h: '增加爆擊機率#cr%、爆擊傷害#criticaldamage%。',
      desc: '永久性的增加爆擊機率及爆擊傷害。',
    },
    '2110015': {
      h: '最終傷害增加#mdR%',
      desc: '永久增加最終傷害。',
    },
    '2210009': {
      h: '增加爆擊機率#cr%、爆擊傷害#criticaldamage%。',
      desc: '永久性的增加爆擊機率及爆擊傷害。',
    },
    '2210013': {
      h: '攻擊結冰狀態敵人時，每層結冰有#subProp%機率無視防禦#prop%',
      desc: '攻擊結冰狀態敵人時，有機會依結冰層數無視防禦。',
    },
    '2200011': {
      h: '攻擊凍結狀態的敵人時，每層凍結使爆擊傷害增加#x%\\n使用閃電屬性攻擊時，每層凍結使最終傷害額外增加#y%，並減少凍結層數\\n（怪物身上顯示結冰特效）',
      desc: '結冰層數特效與對凍結敵人的爆擊／雷屬增傷。',
    },
    '2200012': {
      h: '攻擊速度增加2階段，智力增加#intX',
      desc: '提升攻擊速度和智力。',
    },
    '2220015': {
      h: '攻擊凍結狀態的敵人時，每層凍結使爆擊傷害增加#x%\\n使用閃電屬性攻擊時，每層凍結使最終傷害額外增加#y%，並減少凍結層數',
      desc: '強化結冰特效的爆擊傷害與雷屬最終傷害。',
    },
    '2210016': {
      h: '最終傷害增加#mdR%',
      desc: '永久增加最終傷害。',
    },
    '2211011': {
      h: '消耗HP#mpCon，召喚可持續#time秒的閃電球，對最多#mobCount名敵人以#damage%傷害攻擊#attackCount次\\n球體攻擊不會減少凍結重疊',
      desc: '召喚閃電球體攻擊周圍敵人。球體的攻擊不會減少凍結的重疊。',
    },
    '2221005': {
      h: '消耗HP#mpCon，召喚冰魔神#time秒\\n冰魔神對最多#mobCount名敵人造成#damage%傷害#attackCount次，並使敵人結冰\\n熟練度永久增加至#mastery%',
      desc: '召喚冰屬性冰魔神攻擊敵人並使其結冰，學習後永久提升熟練度。',
    },
    '2221007': {
      h: '消耗HP#mpCon，最多對#mobCount名敵人以#damage%傷害攻擊#attackCount次，冷卻#cooltime秒\\n[被動效果]使用直接攻擊技能時，#prop%機率對命中敵人落下#x%傷害的暴風雪',
      desc: '降下冰矛攻擊並凍結敵人。直接攻擊時有機率追加暴風雪。',
      blizzardCast: {
        tileFrame: 15,
        tileMs: 900,
        delayShowDamage: 960,
        hitMs: 1860,
        maxTileTargets: 15,
      },
    },
    '2221054': {
      h: '消耗HP#mpCon，持續#time秒\\n期間冰凍疊加上限#x，每次冰屬性魔法攻擊增加#y層\\n冷卻#cooltime秒',
      desc: '提升寒冰魔力：提高結冰疊加上限，並使冰屬性攻擊一次疊加更多層數。',
    },

    // —— 精靈遊俠（Mercedes）——
    '23121014': { skipPanel: true }, // 精神迴避（純位移）
    // 1轉 急速雙擊：攻擊隻數 6
    '23001000': {
      common: {
        mobCount: '6',
      },
    },
    // 雙弩槍精通：二轉 → 三轉（與水盾對調）；角色每等級額外 HP（同魔力增幅 lv2mhp，每技能等 +5）
    '23100005': {
      rank: '60',
      skillBook: 2311,
      h: '雙弩槍熟練度#mastery%增加\\n角色每等級額外增加HP #lv2mhp',
      desc: '提升雙弩槍的熟練度，並依角色等級永久增加最大HP。',
      common: {
        lv2mhp: '10*x',
      },
      commonRemove: ['mhpR'],
    },
    // 水盾：三轉 → 二轉；不要無敵主動，只保留被動減傷／格擋／耐性（模擬減傷效果減半）
    '23111005': {
      rank: '30',
      skillBook: 2310,
      type: 'passive',
      equipable: false,
      h: '永久：被擊傷害減少#damAbsorbShieldR%（減半），狀態異常耐性增加#asrR，所有屬性耐性增加#terR%，格擋增加#stanceProp%',
      desc: '借助精靈之力，永久減少被擊傷害，並增加狀態異常耐性、所有屬性耐性及格擋。',
      commonRemove: ['time', 'cooltime', 'mpRCon'],
    },
    // 水盾－強化：顯示值仍為 WZ；戰鬥減傷於 SkillModifiers 對精靈遊俠 ×0.5
    '23120046': {
      h: '被擊傷害減少量增加#damAbsorbShieldR%（減半）',
    },
    // 遠古意志：Buff 數值已接線；永久列只保留格擋（迴避不套用）
    '23121004': {
      h: '消耗MP#mpCon，#time秒內使攻擊力增加#indiePadR%、HP增加#emhp\\n[被動效果:格擋增加#stanceProp%]',
      desc: '一定時間內獲得古代精靈的庇護，增加攻擊力和 HP，並永久增加格擋。',
    },
    // 潛在力量：不顯示／不套用迴避
    '23000001': {
      h: '增加移動速度#psdSpeed、最大移動速度上限增加為#u、傷害增加#damR%',
      desc: '永久啟發潛藏在體內的力量。移動速度、最大移動速度上限及傷害增加。',
      commonRemove: ['er'],
    },
    // 依古尼斯：永久攻擊／終傷保留；連接技疊層見 runtime（迴避不套用）
    '23110004': {
      h: '使用連接技能時，最終傷害增加#x%（最多疊#y層，維持#subTime秒，加總計算），攻擊速度1階段\\n[被動效果：最終傷害#pdR%、攻擊力#padX]',
      desc: '借助火之精靈的力量，使用連接技能時疊加最終傷害與攻擊速度，並永久增加攻擊力與最終傷害。',
    },
    // 落葉旋風／傳說之槍：WZ 有 tiles 但非暴風雪時間軸
    // 落葉旋風：本為騰空技，特效改掛目標頭頂，避免地面朝下空放
    '23111001': { blizzardCast: false, castFxAt: 'targetHead' },
    // 接技後續（不可裝備／連鎖；由昇龍等頭技自動接，仍可學習吃 damPlus）
    '23110006': {
      equipable: false,
      addAttackPrefer: ['23121002', '23121052', '23111001', '23111003'],
    },
    '23111003': { equipable: false },
    '23121002': { blizzardCast: false, equipable: false },
    '23121011': {
      equipable: false,
      addAttackPrefer: ['23121002', '23121052', '23111001', '23111003'],
    },
    '23121052': { equipable: false },
    '23100004': { equipable: false }, // 最終一擊：接技後續
    // 伊修塔爾之環：持續引導；傷害即時結算，投射物純動畫
    '23121000': {
      ballVisualDamage: true,
      channelCast: {
        prepareMs: 240,
        keydownLoopMs: 720,
        sustain: true,
        tickMs: 120,
        sideFx: null,
        sideOffset: [180, -40],
      },
      common: {
        mobCount: '6',
      },
    },
    // 昇龍刺擊：接技頭（→月光翻轉→最終一擊）。給 CD，好了打一套，平時讓飛箭／連鎖當主力
    '23101001': {
      common: {
        cooltime: '10',
      },
      h: '消耗 #mpCon MP，最多對#mobCount個敵人用#damage%擊推突進，並用#w%的傷害攻擊 #y次後擊飛。攻擊被擊飛的敵人時，技能的傷害增加 #x%p。\\n冷卻時間#cooltime秒',
    },
    // 光速雙擊／進階：飛箭改純動畫，傷害依目標數即時結算；不走昇龍接技
    '23111000': { addAttackRemove: true, ballVisualDamage: true },
    '23120013': {
      addAttackRemove: true,
      ballVisualDamage: true,
      replacesSkill: '23111000',
      desc: '強化光速雙擊，進行更強力的攻擊。學會後取代光速雙擊，兩者無法同時使用。',
    },
    /**
     * 精靈接技優先序（攻略常用路線；CD 中自動跳下一檔）
     * 昇龍→月光／騰空／最終；其後優先傳說／憤怒天使（有 CD 好了就放），否則落葉／旋風突進
     * 參考：巴哈終極攻略、Grandis Rising Rush 鏈、Digital Crowns 連招
     */
    '23101007': {
      addAttackPrefer: ['23121011', '23110006', '23100004'],
    },

    // —— 夜使者（Night Lord）——
    // 1轉「迴避」：本模擬不套迴避率，改被擊減傷（滿等 15%）
    '4000012': {
      h: '被擊傷害減少#damAbsorbShieldR%',
      desc: '依技能等級永久減少受到的傷害。',
      common: {
        damAbsorbShieldR: '15*x/10',
      },
      commonRemove: ['er'],
    },
    // 2轉「精準暗器」：角色每等 +(75×技能等) HP
    '4100000': {
      h: '拳套熟練度#mastery%增加，飛鏢數#y增加\\n角色每等級額外增加HP #lv2mhp',
      desc: '增加拳套熟練度與所持飛鏢上限，並依角色等級與技能等級永久增加最大HP。',
      common: {
        lv2mhp: '7.5*x',
      },
    },
    // 4轉「瞬身迴避」：本模擬不套迴避，改被擊減傷（滿等 30%；格擋仍保留）
    '4120002': {
      h: '被擊傷害減少#damAbsorbShieldR%，格擋機率增加#stanceProp%',
      desc: '依技能等級永久減少受到的傷害，並增加格擋機率。',
      common: {
        damAbsorbShieldR: '2.5*x',
      },
      commonRemove: ['prop'],
    },
    // 四飛閃不取代三飛閃（可同時裝備）
    // 三飛閃／四飛閃：手裡劍走 ball volley（bulletCount 發）
    '4111010': {
      ballCast: {
        launchFrame: 1,
        launchMs: 0,
        ballMode: 'sprite',
        travel: 'horizontal',
        speedPxPerMs: 0.7,
      },
      common: {
        ballDelay: '270',
        ballDelay1: '90',
        ballDelay2: '90',
      },
    },
    '4121013': {
      replacesSkillRemove: true,
      ballCast: {
        launchFrame: 1,
        launchMs: 0,
        ballMode: 'sprite',
        travel: 'horizontal',
        speedPxPerMs: 0.7,
      },
      common: {
        ballDelay: '180',
        ballDelay1: '90',
        ballDelay2: '90',
        ballDelay3: '90',
      },
    },
    // 強力投擲：WZ prop＝爆擊率
    '4100001': {
      common: { cr: '20+x' },
    },
    // 刻印：被動觸發，不可裝備；引爆段隱藏
    '4100011': {
      type: 'passive',
      equipable: false,
    },
    '4120018': {
      type: 'passive',
      equipable: false,
    },
    '4100012': { skipPanel: true, equipable: false },
    '4120019': { skipPanel: true, equipable: false },
    // 爆破鏢爆炸段／挑釁追擊
    '4101014': { skipPanel: true, equipable: false },
    '4121020': { skipPanel: true, equipable: false },
    '4121021': { skipPanel: true, equipable: false },
    // 挑釁契約：本體無 CD；追擊飛劍 CD 2 秒（runtime）；停留再追擊
    '4121017': {
      h: '消耗MP#mpCon、#bulletConsume個飛鏢\\n最多對#mobCount名敵人以#damage%傷害攻擊#attackCount次後挑釁\\n被挑釁的敵人#time秒內獲得經驗值及道具掉落率增加#x%。若為BOSS怪物，效果減少一半\\n之後形成手裏劍：以主傷害的#w%攻擊#z次（#u個），追擊冷卻#s2秒\\n一名敵人被多個手裏劍命中時，從第二隻手裏劍開始，最終傷害會減少#u2%，攻擊一般怪物時傷害增加#nbdR%',
      desc: '攻擊並挑釁敵人；符咒爆炸後黑暗手裏劍以主傷害比例追擊。本體無冷卻；追擊有短冷卻。',
      common: {
        s2: '2',
      },
    },
    // 影分身：x＝分身傷害%，不可進通用 xVal
    '4111002': {
      type: 'buff',
      common: {
        shadowPartnerR: '50+x',
      },
      commonRemove: ['x'],
    },
    // 絕殺領域：時效召喚
    '4111007': {
      type: 'buff',
    },
    // 絕對領域：地面光環；滿等怪物攻 -15%、受傷 +20%（依技能等浮動）
    '4121015': {
      type: 'buff',
      blizzardCast: false,
      tileRepeatIdx: 21,
      h: '消耗MP#mpCon，持續#time秒，使所有敵人攻擊力減少#w%、受到的傷害提升#x%\\n[被動效果:攻擊BOSS怪物時傷害增加 #bdR%]',
      desc: '展開結界：期間所有敵人攻擊力下降、受到的傷害提升，並永久增加對 BOSS 的傷害。',
      common: {
        w: '15*x/30',
        x: '20*x/30',
      },
      commonRemove: ['z', 'y'],
    },
    // 絕對領域-強化效果：追加承受傷害
    '4120046': {
      h: '絕對領域使敵人受到的傷害額外提升#v%',
      desc: '強化絕對領域：額外提升敵人受到的傷害。',
      common: {
        v: '10',
      },
      commonRemove: ['x', 'z'],
    },
    // 絕對領域-緩慢：追加攻擊力減少（本模擬不做移速）
    '4120047': {
      h: '絕對領域使敵人攻擊力額外減少#s%',
      desc: '強化絕對領域：額外減少敵人攻擊力。',
      common: {
        s: '5',
      },
      commonRemove: ['y'],
    },
    // 絕對領域-BOSS殺手：WZ common 幾乎空
    '4120048': {
      common: {
        bdR: '20',
      },
      h: '絕對領域對BOSS傷害增加#bdR%',
    },
    // 夜幕印記：2 秒無敵，放置戰鬥不做
    '4121022': { skipPanel: true, equipable: false },
    // 隱身／楓葉淨化：非放置戰鬥
    '4001003': { skipPanel: true, equipable: false },
    '4121009': { skipPanel: true, equipable: false },
  };

  function apply(skill) {
    if (!skill?.id) return skill;
    const patch = PATCHES[String(skill.id)];
    if (!patch) return skill;

    const out = { ...skill };
    Object.keys(patch).forEach((key) => {
      if (key === 'common' || key === 'commonRemove'
        || key === 'addAttackRemove' || key === 'channelCastRemove'
        || key === 'replacesSkillRemove') return;
      out[key] = patch[key];
    });

    if (patch.addAttackRemove) delete out.addAttack;
    if (patch.channelCastRemove) delete out.channelCast;
    if (patch.replacesSkillRemove) delete out.replacesSkill;

    if (patch.common || patch.commonRemove) {
      out.common = { ...(skill.common || {}) };
      if (patch.common) Object.assign(out.common, patch.common);
      (patch.commonRemove || []).forEach((k) => { delete out.common[k]; });
    }

    return out;
  }

  return { apply, PATCHES };
})();

if (typeof window !== 'undefined') {
  window.SkillOverrides = SkillOverrides;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillOverrides;
}
