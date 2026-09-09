/**
 * BOSS 列表（對應 images/Boss/BossList/{id}）。
 * artId 疊圖：
 *   images/bossIdlezone/{artId}/back.png
 *   images/bossIdlezone/{artId}/obj.png
 * （缺 back 時退回 images/bossIdlezone/{artId}.png）
 * 層序：back → 怪物 → obj → 玩家
 * playerPos / bossPos：1366×768 場地像素（左上為原點）。
 * 暗黑龍王（id 2）分圖座標改在 idleBossPhaseData.js 的 stages[]。
 */
const IDLE_BOSS_LIST = [
  { id: '0', name: '巴洛古', artId: '0', playerPos: { x: 300, y: 620 }, bossPos: { x: 620, y: 605 } },
  { id: '1', name: '殘暴炎魔', artId: '1', playerPos: { x: 280, y: 589 }, bossPos: { x: 640, y: 580 } },
  { id: '22', name: '拉圖斯', artId: '22', playerPos: { x: 450, y: 585 }, bossPos: { x: 672, y: 702 } },
  { id: '2', name: '暗黑龍王', artId: '2/1', playerPos: { x: 300, y: 520 }, bossPos: { x: 650, y: 720 } },
  { id: '10', name: '梅格耐斯', artId: '10', playerPos: { x: 500, y: 663 }, bossPos: { x: 780, y: 653 } },
  { id: '11', name: '粉豆', artId: '11', playerPos: { x: 420, y: 620 }, bossPos: { x: 680, y: 610 } },
  { id: '12', name: '西格諾斯', artId: '12', playerPos: { x: 450, y: 580 }, bossPos: { x: 720, y: 580 } },
  { id: '18', artId: '18' },
  { id: '4', artId: '4' },
  { id: '5', artId: '5' },
  { id: '6', artId: '6' },
  { id: '7', artId: '7' },
  { id: '13', artId: '13' },
  { id: '15', artId: '15' },
  { id: '19', artId: '19' },
  { id: '23', artId: '23' },
  { id: '24', artId: '24' },
  { id: '25', artId: '25' },
  { id: '26', artId: '26' },
  { id: '27', artId: '27' },
  { id: '28', artId: '28' },
  { id: '29', artId: '29' },
  { id: '30', artId: '30' },
  { id: '31', artId: '31' },
  { id: '37', artId: '37' },
  { id: '33', artId: '33' },
  { id: '34', artId: '34' },
  { id: '35', artId: '35' },
  { id: '36', artId: '36' },
  { id: '110', artId: '110', playerPos: { x: 260, y: 660 }, bossPos: { x: 1050, y: 500 } },

];

if (typeof window !== 'undefined') {
  window.IDLE_BOSS_LIST = IDLE_BOSS_LIST;
}
