import { initializeApp } from 'firebase/app';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, onSnapshot, setDoc, getDocs, deleteDoc,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig.js';

const app = initializeApp(firebaseConfig);

// 오프라인 캐시: 코트에서 인터넷이 약해도 입력 가능, 연결되면 자동 업로드
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: true, // 회사·공용 와이파이 등 제한된 네트워크 대비
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export { doc, collection, onSnapshot, setDoc, getDocs, deleteDoc };
