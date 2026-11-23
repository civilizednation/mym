// 저장소 선택: Firebase 설정이 있으면 Firestore(모두가 같은 데이터), 없으면 이 기기(localStorage)
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig.js';
import { loadMembers, loadRecords, saveMembers as saveLocalMembers, saveRecords as saveLocalRecords } from './storage.js';

export const mode = isFirebaseConfigured ? 'cloud' : 'local';

/* ---------------- 로컬 ---------------- */
function localDb() {
  let records = loadRecords();
  let onRecords = () => {};
  return {
    subscribe(onM, onR) {
      onRecords = onR;
      onM(loadMembers());
      onR(records);
      return () => {};
    },
    async saveMembers(list) { saveLocalMembers(list); },
    async putRecord(rec) { records = { ...records, [rec.date]: rec }; saveLocalRecords(records); onRecords(records); },
    async deleteRecord(date) { records = { ...records }; delete records[date]; saveLocalRecords(records); onRecords(records); },
  };
}

/* ---------------- Firestore ----------------
   mym_meta/members        { list: [{ id, name, parentId }], updatedAt }
   mym_records/{YYYY-MM-DD} { date, courtFee, shuttleBought, shuttlePrice, attendees, result, updatedAt }
*/
function cloudDb() {
  const fs = import('./firebase.js');
  return {
    subscribe(onM, onR, onError) {
      let unsubs = [];
      let cancelled = false;
      fs.then(({ db, doc, collection, onSnapshot, setDoc, getDocs }) => {
        if (cancelled) return;
        const membersRef = doc(db, 'mym_meta', 'members');
        const recordsCol = collection(db, 'mym_records');
        let migrating = false;

        unsubs.push(onSnapshot(membersRef, async (snap) => {
          if (snap.exists()) { onM(snap.data().list || []); return; }
          if (snap.metadata.fromCache || migrating) return; // 서버 응답을 기다림
          // 처음 연결: 이 기기의 멤버/기록(없으면 기본 20명)을 올림
          migrating = true;
          try {
            const remote = await getDocs(recordsCol);
            const have = new Set(remote.docs.map((d) => d.id));
            const local = loadRecords();
            await Promise.all(Object.values(local).filter((r) => !have.has(r.date)).map((r) => setDoc(doc(recordsCol, r.date), r)));
            await setDoc(membersRef, { list: loadMembers(), updatedAt: Date.now() });
          } catch (e) { onError(e); }
        }, onError));

        unsubs.push(onSnapshot(recordsCol, (snap) => {
          const out = {};
          snap.forEach((d) => { out[d.id] = d.data(); });
          onR(out);
        }, onError));
      }).catch(onError);
      return () => { cancelled = true; unsubs.forEach((u) => u()); };
    },
    async saveMembers(list) {
      const { db, doc, setDoc } = await fs;
      await setDoc(doc(db, 'mym_meta', 'members'), { list, updatedAt: Date.now() });
    },
    async putRecord(rec) {
      const { db, doc, setDoc } = await fs;
      await setDoc(doc(db, 'mym_records', rec.date), rec);
    },
    async deleteRecord(date) {
      const { db, doc, deleteDoc } = await fs;
      await deleteDoc(doc(db, 'mym_records', date));
    },
  };
}

export const db = isFirebaseConfigured ? cloudDb() : localDb();
export { firebaseConfig };
