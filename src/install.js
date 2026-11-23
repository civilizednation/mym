// 홈 화면 추가(PWA 설치) 도우미
let deferred = null;
const listeners = new Set();
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  listeners.forEach((f) => f());
});
window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((f) => f()); });

export const onInstallChange = (f) => { listeners.add(f); return () => listeners.delete(f); };
export const canPrompt = () => !!deferred;
export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  return outcome === 'accepted';
}

const ua = navigator.userAgent;
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const inApp = /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\/|MicroMessenger/i.test(ua);
export const isWeChat = /MicroMessenger/i.test(ua);
export const isKakao = /KAKAOTALK/i.test(ua);
