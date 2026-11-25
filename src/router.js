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

function handle() {
  if (cleanup) {
    try { cleanup(); } catch { /* noop */ }
    cleanup = null;
  }
  const path = location.hash.replace(/^#/, '') || '/';
  const handler = routes.get(path) || routes.get('/');
  handler();
}

export function startRouter() {
  window.addEventListener('hashchange', handle);
  handle();
}
