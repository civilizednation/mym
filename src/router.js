import { useEffect, useState } from 'react';

function parse() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = h.split('?');
  return { path, query: Object.fromEntries(new URLSearchParams(qs)) };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('popstate', on);
    window.addEventListener('hashchange', on);
    return () => {
      window.removeEventListener('popstate', on);
      window.removeEventListener('hashchange', on);
    };
  }, []);
  return route;
}

export function navigate(to, { replace = false } = {}) {
  const depth = (history.state?.depth ?? 0) + (replace ? 0 : 1);
  history[replace ? 'replaceState' : 'pushState']({ depth }, '', '#' + to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

/** 앱 안에서 들어왔으면 뒤로, 아니면(주소 직접 입력 등) 상위 화면으로 */
export function goBack(fallback = '/') {
  if ((history.state?.depth ?? 0) > 0) history.back();
  else navigate(fallback, { replace: true });
}
