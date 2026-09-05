把 HaRepacker / WzComparer 匯出的 XML 丟進來（加密 .wz 本體不要放）。

名稱表（必放一份）：
  wz-xml/string/String.Eqp.img.xml
  或  wz-xml/string/Eqp.img.xml

紙娃娃疊圖順序（建議）：
  wz-xml/base/Base.zmap.img.xml
  wz-xml/base/Base.smap.img.xml

裝備（依部位丟進對應資料夾）：
  wz-xml/character/weapon/     Character.Weapon.01302000.img.xml
  wz-xml/character/cap/        Character.Cap.01002000.img.xml
  wz-xml/character/coat/       上衣
  wz-xml/character/longcoat/   套服
  wz-xml/character/pants/      褲
  wz-xml/character/shoes/      鞋
  wz-xml/character/glove/      手套
  wz-xml/character/cape/       披風
  wz-xml/character/shield/     盾／副武外觀
  wz-xml/character/accessory/  臉、眼、耳環等
  wz-xml/character/ring/
  wz-xml/character/belt/
  wz-xml/character/shoulder/
  wz-xml/character/pocket/
  wz-xml/character/totem/
  wz-xml/character/medal/
  wz-xml/character/badge/
  wz-xml/character/emblem/
  wz-xml/character/heart/      機器心臟
  wz-xml/character/android/
  wz-xml/character/hair/       髮型（紙娃娃）
  wz-xml/character/face/       臉型（紙娃娃）
  wz-xml/character/skin/       膚色／身體、頭（紙娃娃）

檔名可以是 Character.Weapon.01302000.img.xml 或 01302000.img.xml。

背包圖示若在主檔只有 _outlink，請把 Canvas 一併放入同一資料夾：
  wz-xml/character/weapon/Character.Weapon._Canvas.01302000.img.xml
  或  wz-xml/character/weapon/_canvas/

怪物動畫：
  wz-xml/mob/Mob.0100100.img.xml
  wz-xml/mob/Mob._Canvas.0100100.img.xml
  （主檔有 origin／delay／_outlink；像素在 _Canvas。巢狀 attack／skill／effect 會一併匯入）

執行（分開跑，避免互相重匯）：
  npm run import:wz          裝備目錄＋背包圖示
  npm run import:paperdoll   紙娃娃圖層
  npm run import:gear        上面兩項連續跑（不含怪物）
  npm run import:mob         章節怪物動畫
  npm run import:boss        BOSS 動畫

XML 本體已加入 gitignore，不會被提交。
