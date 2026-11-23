import { useState } from 'react';
import Header from './Header.jsx';
import { guessParentId, newId, parseName } from '../storage.js';

export default function Members({ members, setMembers }) {
  const [editing, setEditing] = useState(null); // { id?, name, parentId }
  const byId = Object.fromEntries(members.map((m) => [m.id, m]));

  const save = ({ id, name, parentId }) => {
    name = name.trim();
    if (!name) return;
    if (id) {
      setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, name, parentId } : m)));
    } else {
      const m = { id: newId(), name, parentId };
      setMembers((ms) => {
        // 자녀면 보호자(와 기존 자녀들) 바로 뒤에 넣어 줌
        if (!parentId) return [...ms, m];
        let at = ms.findIndex((x) => x.id === parentId);
        while (at + 1 < ms.length && ms[at + 1].parentId === parentId) at++;
        return [...ms.slice(0, at + 1), m, ...ms.slice(at + 1)];
      });
    }
    setEditing(null);
  };

  const remove = (m) => {
    const kids = members.filter((x) => x.parentId === m.id);
    const msg = kids.length
      ? `'${m.name}' 님을 삭제할까요?\n연결된 자녀(${kids.map((k) => k.name).join(', ')})는 개별 정산으로 바뀝니다.`
      : `'${m.name}' 님을 삭제할까요?\n(지난 모임 기록은 그대로 남아요)`;
    if (!confirm(msg)) return;
    setMembers((ms) => ms.filter((x) => x.id !== m.id).map((x) => (x.parentId === m.id ? { ...x, parentId: null } : x)));
    setEditing(null);
  };

  return (
    <div className="page">
      <Header
        title="멤버"
        emoji="👥"
        right={<span className="count-pill">{members.length}명</span>}
      />
      <main className="content with-bottom">
        <ul className="member-list">
          {members.map((m, i) => (
            <li key={m.id} className={`member-row ${m.parentId ? 'kid' : ''}`}>
              <span className="avatar" data-c={i % 6}>{m.parentId ? '🐣' : parseName(m.name).base.slice(-2)}</span>
              <span className="m-name">
                {m.name}
                {m.parentId && byId[m.parentId] && <span className="m-sub">↳ {byId[m.parentId].name} 님이 정산</span>}
              </span>
              <button className="chip-btn" onClick={() => setEditing({ ...m })}>편집</button>
            </li>
          ))}
        </ul>
      </main>

      <div className="bottom-bar">
        <button className="btn primary block" onClick={() => setEditing({ name: '', parentId: null })}>
          ＋ 멤버 추가
        </button>
      </div>

      {editing && (
        <MemberSheet
          initial={editing}
          members={members}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={editing.id ? () => remove(byId[editing.id]) : null}
        />
      )}
    </div>
  );
}

function MemberSheet({ initial, members, onClose, onSave, onDelete }) {
  const [name, setName] = useState(initial.name);
  const [parentId, setParentId] = useState(initial.parentId || '');
  const [parentTouched, setParentTouched] = useState(!!initial.id);
  const hasKids = initial.id && members.some((m) => m.parentId === initial.id);
  const parentOptions = members.filter((m) => !m.parentId && m.id !== initial.id);

  const onName = (v) => {
    setName(v);
    if (!parentTouched) setParentId(guessParentId(v, members, initial.id) || '');
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: initial.id, name, parentId: parentId || null });
        }}
      >
        <div className="sheet-handle" />
        <h2>{initial.id ? '멤버 편집' : '멤버 추가'}</h2>

        <label className="field">
          <span>이름</span>
          <input autoFocus value={name} onChange={(e) => onName(e.target.value)} placeholder="예) 홍길동, 홍길동(아들)" maxLength={20} />
        </label>

        <label className="field">
          <span>정산하는 사람 <em className="muted">(자녀인 경우 보호자 선택)</em></span>
          <select
            value={parentId}
            disabled={hasKids}
            onChange={(e) => { setParentId(e.target.value); setParentTouched(true); }}
          >
            <option value="">본인이 직접 정산</option>
            {parentOptions.map((m) => (
              <option key={m.id} value={m.id}>{m.name} 님이 정산</option>
            ))}
          </select>
          {hasKids && <small className="muted">자녀가 연결된 멤버는 보호자로만 지정돼요.</small>}
        </label>

        <div className="sheet-actions">
          {onDelete && <button type="button" className="btn danger-ghost" onClick={onDelete}>삭제</button>}
          <button type="button" className="btn ghost" onClick={onClose}>취소</button>
          <button type="submit" className="btn primary" disabled={!name.trim()}>저장</button>
        </div>
      </form>
    </div>
  );
}
