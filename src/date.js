const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function fromISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 오늘 포함 가장 최근 일요일 */
export function lastSunday() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return toISO(d);
}

export function dateLabel(iso) {
  const d = fromISO(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${WEEK[d.getDay()]})`;
}

export function shortLabel(iso) {
  const d = fromISO(iso);
  return { md: `${d.getMonth() + 1}월 ${d.getDate()}일`, wd: WEEK[d.getDay()], y: d.getFullYear() };
}
