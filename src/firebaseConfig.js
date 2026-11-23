// Firebase 콘솔 → 프로젝트 설정 → 내 앱(웹) → SDK 설정 및 구성 의 firebaseConfig 값을 넣으세요.
// (웹앱용 공개 값이라 저장소에 올려도 됩니다.)
// cnation-project (Vercel 환경변수 VITE_FIREBASE_* 가 있으면 그 값이 우선)
const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCTwOAC_LrrKH8CKepUOTf0pyd9qRv4y_8',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'cnation-project.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'cnation-project',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'cnation-project.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1004154104261',
  appId: env.VITE_FIREBASE_APP_ID || '1:1004154104261:web:0eac4c7ded38262ae5c3ac',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
