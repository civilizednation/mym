import { navigate } from '../router.js';
import { dateLabel } from '../date.js';
import { fmt } from '../settle.js';

const MENU = [
  { to: '/settle', emoji: '💰', title: '코트비 엔빵', sub: '참석 체크하고 바로 정산', tone: 'mint' },
  { to: '/records', emoji: '📒', title: '모임 기록', sub: '날짜별 엔빵 내역', tone: 'sun' },
  { to: '/members', emoji: '👥', title: '멤버', sub: '추가 · 편집 · 삭제', tone: 'peach' },
];

export default function Home({ records }) {
  const latest = Object.values(records).sort((a, b) => b.date.localeCompare(a.date))[0];
  return (
    <div className="home">
      <div className="hero">
        <div className="shuttle" aria-hidden="true">🏸</div>
        <h1 className="title">무석연합민턴</h1>
        <p className="subtitle">매주 일요일 오후, 함께 치는 배드민턴</p>
      </div>

      <nav className="menu">
        {MENU.map((m) => (
          <button key={m.to} className={`menu-card tone-${m.tone}`} onClick={() => navigate(m.to)}>
            <span className="menu-emoji">{m.emoji}</span>
            <span className="menu-text">
              <span className="menu-title">{m.title}</span>
              <span className="menu-sub">{m.sub}</span>
            </span>
            <span className="chev" aria-hidden="true">›</span>
          </button>
        ))}
      </nav>

      {latest && (
        <button className="latest" onClick={() => navigate(`/settle?date=${latest.date}`)}>
          최근 모임 · {dateLabel(latest.date)} · 1인 <b>{fmt(latest.result.perUnit)}위안</b>
        </button>
      )}
    </div>
  );
}
