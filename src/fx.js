// 화면 효과: 꽃가루, 3-2-1 카운트다운. '동작 줄이기' 설정이면 꽃가루는 생략해요.
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const COLORS = ['#e0603f', '#1f9d8b', '#7c4dcc', '#d98a1c', '#2f6fe0', '#c43c83', '#f4c542'];

/** 화면 위에서 꽃가루가 떨어져요 (약 1.8초) */
export function confetti(amount = 110) {
  if (reduced()) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const parts = Array.from({ length: amount }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.3,
    y: H * 0.35,
    vx: (Math.random() - 0.5) * 9,
    vy: -6 - Math.random() * 8,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 6,
    h: 4 + Math.random() * 4,
    c: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  const start = performance.now();
  const tick = (now) => {
    const t = now - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 1800);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (t < 1800) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

/**
 * 3-2-1 카운트다운 화면을 띄우고 끝나면 onDone. 반환값 cancel() 로 중간에 멈춰요.
 */
export function countdown(onDone, label = '') {
  const el = document.createElement('div');
  el.className = 'fx-countdown';
  el.innerHTML = `<div class="fx-label"></div><div class="fx-num"></div>`;
  el.querySelector('.fx-label').textContent = label;
  document.body.appendChild(el);
  const num = el.querySelector('.fx-num');
  let n = 3;
  let timer = null;
  const show = () => {
    num.textContent = n;
    num.classList.remove('pop');
    void num.offsetWidth; // 애니메이션 다시 시작
    num.classList.add('pop');
  };
  const step = () => {
    n -= 1;
    if (n <= 0) {
      el.remove();
      onDone();
      return;
    }
    show();
    timer = setTimeout(step, 650);
  };
  show();
  timer = setTimeout(step, 650);
  return () => {
    clearTimeout(timer);
    el.remove();
  };
}
