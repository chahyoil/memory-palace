// 작은 DOM 헬퍼들
import { onNavigate } from './router.js';

export const $app = () => document.getElementById('app');

// 화면이 바뀔 때(주소 이동, 결과 화면, enterNext 호출)만 들어오는 효과를 줘요.
// 같은 화면을 다시 그릴 때(카드 누를 때 등)는 효과 없이 바로 바뀌어요.
let animateNext = true;
onNavigate(() => { animateNext = true; });
export function enterNext() {
  animateNext = true;
}

/** HTML 이스케이프 */
export function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function render(html) {
  const app = $app();
  app.innerHTML = html;
  const animate = animateNext || html.includes('class="score"');
  animateNext = false;
  app.classList.remove('enter');
  if (animate) {
    void app.offsetWidth; // 애니메이션 다시 시작
    app.classList.add('enter');
  }
  window.scrollTo(0, 0);
}

export function setTopbar(text) {
  document.getElementById('topbar-extra').textContent = text || '';
}

export function toast(msg, ms = 1800) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/** Fisher-Yates 셔플 (원본 유지) */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 카운트다운 타이머. 상단바에 남은 시간을 표시하고 끝나면 onEnd 호출.
 * 반환된 객체의 stop()은 경과 초를 돌려줘요.
 */
export function startTimer(totalSec, onEnd) {
  const started = performance.now();
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const elapsed = (performance.now() - started) / 1000;
    const left = Math.max(0, totalSec - elapsed);
    setTopbar('⏱ ' + fmtTime(Math.ceil(left)));
    if (left <= 0) {
      stopped = true;
      setTopbar('');
      onEnd(totalSec);
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return {
    stop() {
      stopped = true;
      setTopbar('');
      return (performance.now() - started) / 1000;
    },
  };
}

/** 문자열 비교용 정규화 (공백 제거, 소문자) */
export function norm(s) {
  return String(s || '').replace(/\s+/g, '').toLowerCase();
}

/** 장소 이름 (궁전이 짧으면 번호로 채움) */
export function locusName(loci, i) {
  return loci[i] || `${i + 1}번 자리`;
}
