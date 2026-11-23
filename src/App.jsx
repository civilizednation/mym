import { useEffect, useState } from 'react';
import { loadMembers, loadRecords, saveMembers, saveRecords } from './storage.js';
import { useRoute } from './router.js';
import Home from './screens/Home.jsx';
import Members from './screens/Members.jsx';
import Records from './screens/Records.jsx';
import Settle from './screens/Settle.jsx';

export default function App() {
  const route = useRoute();
  const [members, setMembers] = useState(loadMembers);
  const [records, setRecords] = useState(loadRecords);

  useEffect(() => saveMembers(members), [members]);
  useEffect(() => saveRecords(records), [records]);

  const props = { members, setMembers, records, setRecords, query: route.query };

  switch (route.path) {
    case '/members':
      return <Members {...props} />;
    case '/records':
      return <Records {...props} />;
    case '/settle':
      return <Settle key={route.query.date || 'new'} {...props} />;
    default:
      return <Home records={records} />;
  }
}
