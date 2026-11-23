import { parseName } from './storage.js';

export const DEFAULT_COURT_FEE = 276; // 69위안 × 2시간 × 코트 2개
export const DEFAULT_SHUTTLE_PRICE = 140;
export const UNIT = { full: 1, partial: 0.5 };

/** 소수 첫째 자리까지 반올림 */
export const round1 = (n) => Math.round(n * 10) / 10;
export const fmt = (n) => {
  const r = round1(n);
  return Number.isInteger(r) ? r.toLocaleString('ko-KR') : r.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

/**
 * attendees: [{ id, name, parentId, payerName, type: 'full' | 'partial' }]
 * 자녀(parentId 있음)는 보호자에게 합산해서 청구.
 */
export function computeSettlement({ courtFee, shuttleBought, shuttlePrice, attendees }) {
  const total = (Number(courtFee) || 0) + (shuttleBought ? Number(shuttlePrice) || 0 : 0);
  const units = attendees.reduce((s, a) => s + UNIT[a.type], 0);
  const perUnit = units > 0 ? total / units : 0;

  const groups = new Map();
  for (const a of attendees) {
    const payerId = a.parentId || a.id;
    if (!groups.has(payerId)) {
      groups.set(payerId, { payerId, payerName: a.parentId ? a.payerName : a.name, self: null, kids: [], units: 0 });
    }
    const g = groups.get(payerId);
    if (a.parentId) g.kids.push(a); else g.self = a;
    g.units += UNIT[a.type];
  }

  const lines = [...groups.values()].map((g) => {
    let label = g.payerName;
    if (g.kids.length) {
      const kidTags = g.kids.map((k) => parseName(k.name).tag || k.name);
      label = `${g.payerName}(${[...(g.self ? ['본인'] : []), ...kidTags].join('+')})`;
    }
    const detail = [
      ...(g.self ? [g.self] : []),
      ...g.kids,
    ].map((a) => (a.type === 'partial' ? `${a.parentId ? parseName(a.name).tag || a.name : '본인'} 1시간↓` : null)).filter(Boolean);
    return {
      payerId: g.payerId,
      label,
      units: g.units,
      amount: round1(perUnit * g.units),
      note: detail.join(', '),
      payerAbsent: !g.self,
    };
  });

  return {
    total,
    units,
    perUnit: round1(perUnit),
    headcount: attendees.length,
    lines,
  };
}

export function resultToText(dateLabel, rec) {
  const r = rec.result;
  const out = [
    `🏸 무석연합민턴 ${dateLabel} 엔빵`,
    `코트비 ${fmt(rec.courtFee)}위안${rec.shuttleBought ? ` + 콕 ${fmt(rec.shuttlePrice)}위안` : ''} = ${fmt(r.total)}위안`,
    `참석 ${r.headcount}명 (환산 ${fmt(r.units)}명) · 1인 ${fmt(r.perUnit)}위안`,
    '',
    ...r.lines.map((l) => `· ${l.label} ${fmt(l.amount)}위안${l.note ? ` (${l.note})` : ''}`),
  ];
  return out.join('\n');
}
