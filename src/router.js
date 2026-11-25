// 해시 기반 라우터 (#/words, #/numbers ...)
const routes = new Map();
let cleanup = null;

export function route(path, handler) {
  routes.set(path, handler);
}

export function go(path) {
  if (location.hash === '#' + path) handle();
  else location.hash = path;
}

export function onLeave(fn) {
  cleanup = fn;
}

// 화면(주소)이 바뀔 때마다 늘 불리는 함수들 (예: 단계 도전 상태 정리)
const navListeners = [];
export function onNavigate(fn) {
  navListeners.push(fn);
}

function handle() {
  if (cleanup) {
    try { cleanup(); } catch { /* noop */ }
    cleanup = null;
  }
  for (const fn of navListeners) {
    try { fn(); } catch { /* noop */ }
  }
  const path = location.hash.replace(/^#/, '') || '/';
  const handler = routes.get(path) || routes.get('/');
  handler();
}

export function startRouter() {
  window.addEventListener('hashchange', handle);
  handle();
}
