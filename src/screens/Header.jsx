import { goBack } from '../router.js';

export default function Header({ title, emoji, back = '/', right = null }) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={() => goBack(back)} aria-label="뒤로">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <h1>{emoji && <span className="h-emoji">{emoji}</span>}{title}</h1>
      <div className="topbar-right">{right}</div>
    </header>
  );
}
