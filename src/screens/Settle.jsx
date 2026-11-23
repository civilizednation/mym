import { useMemo, useRef, useState } from 'react';
import Header from './Header.jsx';
import { navigate, goBack } from '../router.js';
import { dateLabel, lastSunday } from '../date.js';
import { computeSettlement, DEFAULT_COURT_FEE, DEFAULT_SHUTTLE_PRICE, fmt, resultToText, UNIT } from '../settle.js';

export default function Settle({ members, records, setRecords, query }) {
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

  const toggle = (id, type) => {
    if (locked) return;
    setAtt((a) => {
      const next = { ...a };
      if (next[id] === type) delete next[id];
      else next[id] = type;
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
    setRecords((rs) => ({ ...rs, [date]: rec }));
    setLocked(true);
    showToast(record ? '정산을 다시 했어요 ✨' : '정산 완료! 모임 기록에 저장했어요 ✨');
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const removeRecord = () => {
    if (!confirm(`${dateLabel(date)} 모임 기록을 삭제할까요?`)) return;
    setRecords((rs) => {
      const next = { ...rs };
      delete next[date];
      return next;
    });
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
    <div className="page">
      <Header title="코트비 엔빵" emoji="💰" back={query.date ? '/records' : '/'} />

      <main className="content with-bottom-lg">
        {/* 날짜 */}
        <section className="card">
          <label className="row-field">
            <span className="rf-label">📅 날짜</span>
            <span className="date-wrap">
              <span className="date-text">{dateLabel(date)}</span>
              <input type="date" value={date} onChange={(e) => changeDate(e.target.value)} aria-label="날짜 선택" />
            </span>
          </label>
          {record && <div className="saved-badge">{locked ? '✅ 정산 완료된 날짜예요' : '✏️ 수정 중 — 다시 정산하면 기록이 바뀌어요'}</div>}
        </section>

        {/* 비용 */}
        <section className="card">
          <label className="row-field">
            <span className="rf-label">🏟️ 코트비</span>
            <span className="money-input">
              <input inputMode="decimal" value={courtFee} disabled={locked} onChange={(e) => setCourtFee(e.target.value.replace(/[^0-9.]/g, ''))} />
              <span>위안</span>
            </span>
          </label>
          <p className="hint">1시간 69위안 × 2시간 × 코트 2개 = 276위안</p>

          <div className="divider" />

          <div className="row-field">
            <button
              type="button"
              className={`check ${shuttleBought ? 'on' : ''}`}
              disabled={locked}
              onClick={() => setShuttleBought((v) => !v)}
              aria-pressed={shuttleBought}
            >
              <span className="box">{shuttleBought ? '✓' : ''}</span>
              배드민턴콕 구매
            </button>
            <span className={`money-input ${shuttleBought ? '' : 'off'}`}>
              <input inputMode="decimal" value={shuttlePrice} disabled={locked || !shuttleBought} onChange={(e) => setShuttlePrice(e.target.value.replace(/[^0-9.]/g, ''))} />
              <span>위안</span>
            </span>
          </div>
        </section>

        {/* 참석 체크 */}
        <section className="card">
          <div className="card-head">
            <h2>🙋 참석 체크</h2>
            {!locked && chosen.length > 0 && (
              <button className="link-btn" onClick={() => setAtt({})}>모두 해제</button>
            )}
          </div>
          <div className="legend">
            <span><i className="dot full" />2시간 = 1명</span>
            <span><i className="dot partial" />1시간↓ = 0.5명</span>
          </div>
          <ul className="att-list">
            {rows.map((m) => {
              const t = att[m.id];
              if (locked && !t) return null;
              const parent = m.parentId ? byId[m.parentId] : null;
              return (
                <li key={m.id} className={`att-row ${t ? 'picked' : ''} ${m.parentId ? 'kid' : ''}`}>
                  <span className="att-name">
                    {m.name}
                    {(parent || m.payerName) && m.parentId && <span className="m-sub">↳ {parent?.name ?? m.payerName} 정산</span>}
                    {m.ghost && <span className="m-sub">삭제된 멤버</span>}
                  </span>
                  <span className="seg">
                    <button className={`seg-btn full ${t === 'full' ? 'on' : ''}`} disabled={locked} onClick={() => toggle(m.id, 'full')}>2시간</button>
                    <button className={`seg-btn partial ${t === 'partial' ? 'on' : ''}`} disabled={locked} onClick={() => toggle(m.id, 'partial')}>1시간↓</button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 결과 */}
        {record && (
          <section ref={resultRef} className={`card result ${locked ? '' : 'stale'}`}>
            <div className="card-head">
              <h2>🧾 엔빵 결과</h2>
              {locked && <button className="chip-btn" onClick={copy}>결과 복사</button>}
            </div>
            <div className="sum-grid">
              <div><span>총액</span><b>{fmt(record.result.total)}</b><small>위안</small></div>
              <div><span>환산 인원</span><b>{fmt(record.result.units)}</b><small>명</small></div>
              <div className="accent"><span>1인당</span><b>{fmt(record.result.perUnit)}</b><small>위안</small></div>
            </div>
            <p className="hint center">
              코트비 {fmt(record.courtFee)}위안{record.shuttleBought ? ` + 콕 ${fmt(record.shuttlePrice)}위안` : ''} ÷ {fmt(record.result.units)}명
            </p>
            <ul className="pay-list">
              {record.result.lines.map((l) => (
                <li key={l.payerId}>
                  <span className="pay-name">
                    {l.label}
                    {l.note && <span className="m-sub">{l.note}</span>}
                  </span>
                  <span className="pay-amt"><b>{fmt(l.amount)}</b> 위안</span>
                </li>
              ))}
            </ul>
            {locked && (
              <button className="link-btn danger center-block" onClick={removeRecord}>이 날 기록 삭제</button>
            )}
          </section>
        )}
      </main>

      <div className="bottom-bar">
        <div className="live-sum">
          참석 <b>{chosen.length}</b>명 · 환산 <b>{fmt(units)}</b>명 · 총 <b>{fmt(total)}</b>위안
          {units > 0 && <> · 1인 <b className="accent-text">{fmt(total / units)}</b>위안</>}
        </div>
        <div className="btn-row">
          <button className="btn secondary" disabled={!locked} onClick={() => setLocked(false)}>✏️ 수정</button>
          <button className="btn primary grow" disabled={locked} onClick={settle}>🏸 엔빵 정산</button>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
