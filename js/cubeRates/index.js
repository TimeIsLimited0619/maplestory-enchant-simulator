/**
 * 方塊機率資料索引
 * 資料來自楓之谷官方機率公告
 */
const CUBE_RATE_EVENTS = {
  8421: typeof CUBE_RATES_8421 !== 'undefined' ? CUBE_RATES_8421 : null,
  8422: typeof CUBE_RATES_8422 !== 'undefined' ? CUBE_RATES_8422 : null,
  8630: typeof CUBE_RATES_8630 !== 'undefined' ? CUBE_RATES_8630 : null,
  8420: typeof CUBE_RATES_8420 !== 'undefined' ? CUBE_RATES_8420 : null
};

const CUBE_RATE_PAGES = [
  { id: 8421, slug: 'potential-main', title: '裝備潛能強化方塊' },
  { id: 8422, slug: 'potential-additional', title: '裝備附加潛能強化方塊' },
  { id: 8630, slug: 'potential-other', title: '裝備潛能強化方塊(其他)' },
  { id: 8420, slug: 'familiar', title: '萌獸方塊' }
];

function getCubeRateEvent(eventId) {
  return CUBE_RATE_EVENTS[eventId] || null;
}

function parseCubePercent(text) {
  if (text == null || text === '') return null;
  if (typeof text === 'number') return text;
  const m = String(text).match(/([\d.]+)\s*%/);
  return m ? Number(m[1]) / 100 : null;
}

if (typeof window !== 'undefined') {
  window.CUBE_RATE_EVENTS = CUBE_RATE_EVENTS;
  window.CUBE_RATE_PAGES = CUBE_RATE_PAGES;
  window.getCubeRateEvent = getCubeRateEvent;
  window.parseCubePercent = parseCubePercent;
}
