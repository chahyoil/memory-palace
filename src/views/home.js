import { render, setTopbar } from '../ui.js';
import { go } from '../router.js';
import { bestScore, getPalaces, trainingDays, getSettings, setSettings } from '../storage.js';
import { todayCardHtml, bindTodayCard } from './plan.js';
import { nbackBest } from '../modes/nback.js';

const MODES = [
  { path: '/words', icon: '📝', title: '단어', desc: '단어 순서대로 외우기' },
  { path: '/numbers', icon: '🔢', title: '숫자', desc: '무작위 숫자 외우기' },
  { path: '/cards', icon: '🃏', title: '카드', desc: '섞인 카드 순서 외우기' },
  { path: '/images', icon: '🖼️', title: '이미지 순서', desc: '그림 5개씩 순서 외우기' },
  { path: '/numdrill', icon: '⚡', title: '숫자 사전 훈련', desc: '00~99 이미지 빨리 떠올리기' },
  {
    path: '/nback', icon: '🧠', title: '듀얼 N백', desc: '위치+소리 작업 기억 훈련',
    best: () => { const n = nbackBest(); return n ? `최고 ${n}백` : null; },
  },
];

// 1분 도전: 외우는 시간을 1분으로 고정한 짧은 시합 (온라인 기억력 대전 방식). 초보용 분량.
const CHALLENGES = [
  { mode: 'words', icon: '📝', label: '단어 20개', settings: { count: 20, seconds: 60, kind: 'concrete' } },
  { mode: 'numbers', icon: '🔢', label: '숫자 40자리', settings: { digits: 40, seconds: 60, hints: false } },
  { mode: 'images', icon: '🖼️', label: '이미지 20개', settings: { count: 20, seconds: 60 } },
  { mode: 'cards', icon: '🃏', label: '카드 20장', settings: { count: 20, seconds: 60 } },
];

export function homeView() {
  setTopbar('');
  const days = trainingDays();
  const palaces = getPalaces();

  const modeCards = MODES.map((m) => {
    let bestText;
    if (m.best) bestText = m.best();
    else {
      const best = bestScore(m.path.slice(1));
      bestText = best ? `최고 ${best.score}/${best.total}` : null;
    }
    bestText = bestText || '아직 기록 없음';
    return `
      <a href="#${m.path}">
        <span class="icon">${m.icon}</span>
        <span class="title">${m.title}</span>
        <span class="muted">${m.desc}</span>
        <span class="best">${bestText}</span>
      </a>`;
  }).join('');

  const palaceHint = palaces.length
    ? `궁전 ${palaces.length}개 · 장소 ${palaces.reduce((n, p) => n + p.loci.length, 0)}곳`
    : '아직 궁전이 없어요. 먼저 만들어 두면 훈련할 때 장소가 같이 보여요.';

  render(`
    <section class="card">
      <div class="row" style="align-items:center">
        <div>
          <div class="muted">연속 훈련</div>
          <div style="font-size:1.8rem;font-weight:900">🔥 ${days.streak}일</div>
        </div>
        <div>
          <div class="muted">총 훈련한 날</div>
          <div style="font-size:1.8rem;font-weight:900">${days.total}일</div>
        </div>
      </div>
      <p class="muted" style="margin:8px 0 0">${days.today ? '오늘 훈련 완료! 👍' : '하루 10~30분이면 충분해요.'}</p>
    </section>

    ${todayCardHtml()}

    <h2>훈련</h2>
    <nav class="menu">${modeCards}</nav>

    <h2>⏱️ 1분 도전</h2>
    <p class="muted" style="margin-top:0">외우는 시간은 딱 1분. 끝나면 내 최고 기록과 비교해요.</p>
    <div class="challenge-grid">
      ${CHALLENGES.map((c, i) => {
        const best = bestScore(c.mode);
        return `<button data-i="${i}">
          <span>${c.icon} ${c.label}</span>
          <small>${best ? `최고 ${best.score}/${best.total}` : '도전!'}</small>
        </button>`;
      }).join('')}
    </div>

    <h2>준비</h2>
    <nav class="menu">
      <a href="#/palace">
        <span class="icon">🏛️</span>
        <span class="title">내 궁전</span>
        <span class="muted">${palaceHint}</span>
      </a>
      <a href="#/dictionary">
        <span class="icon">📖</span>
        <span class="title">숫자 사전</span>
        <span class="muted">00~99 이미지 보기·수정</span>
      </a>
      <a href="#/learn">
        <span class="icon">🎓</span>
        <span class="title">기법 배우기</span>
        <span class="muted">처음이면 여기부터</span>
      </a>
      <a href="#/stats">
        <span class="icon">📈</span>
        <span class="title">기록</span>
        <span class="muted">점수 추이·백업</span>
      </a>
    </nav>
  `);
  bindTodayCard();

  document.querySelectorAll('.challenge-grid button').forEach((b) => {
    b.onclick = () => {
      const c = CHALLENGES[+b.dataset.i];
      setSettings(c.mode, { ...getSettings(c.mode, {}), ...c.settings });
      go('/' + c.mode);
    };
  });
}
