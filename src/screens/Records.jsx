import Header from './Header.jsx';
import { navigate } from '../router.js';
import { shortLabel } from '../date.js';
import { fmt } from '../settle.js';

export default function Records({ records }) {
  const list = Object.values(records).sort((a, b) => b.date.localeCompare(a.date));
  let lastYear = null;

  return (
    <div className="page">
      <Header title="모임 기록" emoji="📒" />
      <main className="content">
        {list.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji">🏸</div>
            <p>아직 모임 기록이 없어요.</p>
            <p className="muted">코트비 엔빵을 하면 여기에 자동으로 쌓여요.</p>
            <button className="btn primary" onClick={() => navigate('/settle')}>코트비 엔빵 하러 가기</button>
          </div>
        ) : (
          <ul className="record-list">
            {list.map((r) => {
              const l = shortLabel(r.date);
              const yearHead = l.y !== lastYear ? l.y : null;
              lastYear = l.y;
              return (
                <li key={r.date}>
                  {yearHead && <div className="year-head">{yearHead}년</div>}
                  <button className="record-card" onClick={() => navigate(`/settle?date=${r.date}`)}>
                    <div className="rc-date">
                      <span className="rc-md">{l.md}</span>
                      <span className={`rc-wd ${l.wd === '일' ? 'sun' : ''}`}>{l.wd}요일</span>
                    </div>
                    <div className="rc-body">
                      <div className="rc-line">참석 <b>{r.result.headcount}명</b> <span className="muted">(환산 {fmt(r.result.units)}명)</span></div>
                      <div className="rc-line muted">
                        총 {fmt(r.result.total)}위안{r.shuttleBought ? ' · 콕 포함' : ''}
                      </div>
                    </div>
                    <div className="rc-amount">
                      <span className="muted small">1인</span>
                      <b>{fmt(r.result.perUnit)}</b>
                      <span className="small">위안</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
