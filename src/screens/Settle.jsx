import { useMemo, useRef, useState } from 'react';
import Header from './Header.jsx';
import { navigate, goBack } from '../router.js';
import { dateLabel, lastSunday, shortLabel } from '../date.js';

const shortDate = (iso) => { const l = shortLabel(iso); return `${l.md} (${l.wd})`; };
import { computeSettlement, DEFAULT_COURT_FEE, DEFAULT_SHUTTLE_PRICE, fmt, resultToText, UNIT } from '../settle.js';

export default function Settle({ members, records, putRecord, deleteRecord, query }) {
  const date = query.date || lastSunday();
  const record = records[date];

  const [courtFee, setCourtFee] = useState(String(record?.courtFee ?? DEFAULT_COURT_FEE));
  const [shuttleBought, setShuttleBought] = useState(record?.shuttleBought ?? false);
  const [shuttlePrice, setShuttlePrice] = useState(String(record?.shuttlePrice ?? DEFAULT_SHUTTLE_PRICE));
  const [att, setAtt] = useState(() => Object.fromEntries((record?.attendees ?? []).map((a) => [a.id, a.type])));
  const [locked, setLocked] = useState(!!record);
  const [toast, setToast] = useState('');
  const resultRef = useRef(null);

  // 현재 멤버 + (기록에는 있지만 지금은 삭제된 멤버)
  const rows = useMemo(() => {
    const ids = new Set(members.map((m) => m.id));
    const ghosts = (record?.attendees ?? []).filter((a) => !ids.has(a.id)).map((a) => ({ ...a, ghost: true }));
    return [...members, ...ghosts];
  }, [members, record]);
  const byId = Object.fromEntries(rows.map((m) => [m.id, m]));

  const chosen = rows.filter((m) => att[m.id]);
  const units = chosen.reduce((s, m) => s + UNIT[att[m.id]], 0);
  const total = (Number(courtFee) || 0) + (shuttleBought ? Number(shuttlePrice) || 0 : 0);

  const showToast = (t) => {
    setToast(t);
    setTimeout(() => setToast(''), 1800);
  };

  // 탭할 때마다: 없음 → 2시간 → 1시간↓ → 없음
  const cycle = (id) => {
    if (locked) return;
    setAtt((a) => {
      const next = { ...a };
      if (!next[id]) next[id] = 'full';
      else if (next[id] === 'full') next[id] = 'partial';
      else delete next[id];
      return next;
    });
  };

  const changeDate = (d) => {
    if (!d || d === date) return;
    navigate(`/settle?date=${d}`, { replace: true });
  };

  const settle = () => {
    if (chosen.length === 0) {
      showToast('참석한 멤버를 체크해 주세요');
      return;
    }
    const attendees = chosen.map((m) => {
      const parent = m.parentId ? byId[m.parentId] : null;
      return {
        id: m.id,
        name: m.name,
        parentId: m.ghost ? m.parentId : parent ? m.parentId : null,
        payerName: parent ? parent.name : m.payerName ?? null,
        type: att[m.id],
      };
    });
    const input = {
      courtFee: Number(courtFee) || 0,
      shuttleBought,
      shuttlePrice: Number(shuttlePrice) || 0,
      attendees,
    };
    const rec = { date, ...input, result: computeSettlement(input), updatedAt: Date.now() };
    putRecord(rec);
    setLocked(true);
    showToast(record ? '정산을 다시 했어요 ✨' : '정산 완료! 모임 기록에 저장했어요 ✨');
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const removeRecord = () => {
    if (!confirm(`${dateLabel(date)} 모임 기록을 삭제할까요?`)) return;
    deleteRecord(date);
    goBack('/records');
  };

  const copy = async () => {
    const text = resultToText(dateLabel(date), record);
    try {
      await navigator.clipboard.writeText(text);
      showToast('복사했어요! 단톡방에 붙여넣기 하세요');
    } catch {
      prompt('아래 내용을 복사하세요', text);
    }
  };

  return (
    <div className="page settle">
      <Header
        title="코트비 엔빵"
        emoji="💰"
        back={query.date ? '/records' : '/'}
        right={record && <span className={`s-badge ${locked ? '' : 'edit'}`}>{locked ? '✅ 정산완료' : '✏️ 수정 중'}</span>}
      />

      <main className="content s-content">
        {/* 날짜 + 비용 (한 줄) */}
        <section className="card s-top">
          <span className="date-wrap">
            <span className="date-text">📅 {shortDate(date)}</span>
            <input type="date" value={date} onChange={(e) => changeDate(e.target.value)} aria-label="날짜 선택" />
          </span>
          <label className="s-money">
            <span>코트</span>
            <input inputMode="decimal" value={courtFee} disabled={locked} onChange={(e) => setCourtFee(e.target.value.replace(/[^0-9.]/g, ''))} />
          </label>
          <span className={`s-money ${shuttleBought ? '' : 'off'}`}>
            <button
              type="button"
              className={`check ${shuttleBought ? 'on' : ''}`}
              disabled={locked}
              onClick={() => setShuttleBought((v) => !v)}
              aria-pressed={shuttleBought}
            >
              <span className="box">{shuttleBought ? '✓' : ''}</span>콕
            </button>
            <input inputMode="decimal" value={shuttlePrice} disabled={locked || !shuttleBought} onChange={(e) => setShuttlePrice(e.target.value.replace(/[^0-9.]/g, ''))} />
          </span>
        </section>
        <p className="s-unit">단위: 위안 · 코트 69위안 × 2시간 × 2면 = 276</p>

        {/* 참석 체크 */}
        <section className="card s-att">
          <div className="s-att-head">
            <span className="legend">
              <span><i className="dot full" />2시간 = 1명</span>
              <span><i className="dot partial" />1시간↓ = 0.5명</span>
            </span>
            {!locked && chosen.length > 0 && <button className="link-btn" onClick={() => setAtt({})}>모두 해제</button>}
          </div>
          {!locked && <p className="s-tip">이름 탭 → 2시간 → 1시간↓ → 해제</p>}
          <div className={`chip-grid ${locked ? 'mini' : ''}`}>
            {rows.map((m) => {
              const t = att[m.id];
              if (locked && !t) return null;
              return (
                <button
                  key={m.id}
                  className={`p-chip ${t || ''} ${m.parentId ? 'kid' : ''} ${m.ghost ? 'ghost' : ''}`}
                  disabled={locked}
                  onClick={() => cycle(m.id)}
                >
                  <span className="p-name">{m.name}</span>
                  {t && <span className="p-tag">{t === 'full' ? '2h' : '½'}</span>}
                </button>
              );
            })}
          </div>
        </section>

        {/* 결과 */}
        {record && (
          <section ref={resultRef} className={`card result ${locked ? '' : 'stale'}`}>
            <div className="s-res-head">
              <span>총 <b>{fmt(record.result.total)}</b>{record.shuttleBought ? '(콕 포함)' : ''} ÷ <b>{fmt(record.result.units)}</b>명</span>
              <span className="per">1인 <b>{fmt(record.result.perUnit)}</b> 위안</span>
            </div>
            <ul className="pay-grid">
              {record.result.lines.map((l) => (
                <li key={l.payerId}>
                  <span className="pay-name">{l.label}{l.note && <small>{l.note}</small>}</span>
                  <b className="pay-amt">{fmt(l.amount)}</b>
                </li>
              ))}
            </ul>
            {locked && (
              <div className="s-res-actions">
                <button className="link-btn danger" onClick={removeRecord}>기록 삭제</button>
                <button className="chip-btn" onClick={copy}>📋 결과 복사</button>
              </div>
            )}
          </section>
        )}
      </main>

      <div className="bottom-bar">
        {!locked && <div className="live-sum">
          참석 <b>{chosen.length}</b>명 · 환산 <b>{fmt(units)}</b>명 · 총 <b>{fmt(total)}</b>
          {units > 0 && <> · 1인 <b className="accent-text">{fmt(total / units)}</b></>}
        </div>}
        <div className="btn-row">
          <button className="btn secondary" disabled={!locked} onClick={() => setLocked(false)}>✏️ 수정</button>
          <button className="btn primary grow" disabled={locked} onClick={settle}>🏸 엔빵 정산</button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
