import { useCallback, useEffect, useRef, useState } from 'react';
import { db, mode } from './db.js';
import { useRoute } from './router.js';
import Home from './screens/Home.jsx';
import Members from './screens/Members.jsx';
import Records from './screens/Records.jsx';
import Settle from './screens/Settle.jsx';

export default function App() {
  const route = useRoute();
  const [members, setM] = useState(null);
  const [records, setRecords] = useState(null);
  const [error, setError] = useState(null);
  const membersRef = useRef(null);
  membersRef.current = members;

  useEffect(() => db.subscribe(setM, setRecords, (e) => { console.error(e); setError(e); }), []);

  const fail = (e) => { console.error(e); setError(e); alert('저장에 실패했어요. 인터넷 연결을 확인해 주세요.'); };

  const setMembers = useCallback((upd) => {
    const next = typeof upd === 'function' ? upd(membersRef.current) : upd;
    membersRef.current = next;
    setM(next);
    db.saveMembers(next).catch(fail);
  }, []);
  const putRecord = useCallback((rec) => {
    setRecords((rs) => ({ ...rs, [rec.date]: rec }));
    db.putRecord(rec).catch(fail);
  }, []);
  const deleteRecord = useCallback((date) => {
    setRecords((rs) => { const n = { ...rs }; delete n[date]; return n; });
    db.deleteRecord(date).catch(fail);
  }, []);

  if (!members || !records) {
    return (
      <div className="loading">
        <div className="shuttle">🏸</div>
        {error ? <p>데이터를 불러오지 못했어요.<br /><small className="muted">{String(error.code || error.message)}</small></p> : <p className="muted">불러오는 중…</p>}
      </div>
    );
  }

  const props = { members, setMembers, records, putRecord, deleteRecord, query: route.query };

  switch (route.path) {
    case '/members':
      return <Members {...props} />;
    case '/records':
      return <Records {...props} />;
    case '/settle':
      return <Settle key={route.query.date || 'new'} {...props} />;
    default:
      return <Home records={records} mode={mode} error={error} />;
  }
}
