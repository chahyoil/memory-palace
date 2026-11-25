import { render, setTopbar, esc } from '../ui.js';
import { go } from '../router.js';
import { bestScore, getPalaces, trainingDays, getSettings, setSettings } from '../storage.js';
import { todayCardHtml, bindTodayCard } from './plan.js';
import { nbackBest } from '../modes/nback.js';
import { playerInfo, totalStars, nextStage, openStage, worldStars } from '../game.js';
import { worldById, stageText, MAX_STARS } from '../data/stages.js';

const MODES = [
  { id: 'words', title: '단어', desc: '단어 순서대로 외우기' },
  { id: 'numbers', title: '숫자', desc: '무작위 숫자 외우기' },
  { id: 'cards', title: '카드', desc: '섞인 카드 순서 외우기' },
  { id: 'images', title: '이미지 순서', desc: '그림 5개씩 순서 외우기' },
  { id: 'numdrill', title: '숫자 사전 훈련', desc: '00~99 그림 빨리 떠올리기' },
  {
    id: 'nback', title: '듀얼 N백', desc: '위치+소리 작업 기억 훈련',
    best: () => { const n = nbackBest(); return n ? `최고 ${n}백` : null; },
  },
];

// 1분 도전: 외우는 시간을 1분으로 고정한 짧은 시합 (온라인 기억력 대전 방식). 초보용 분량.
const CHALLENGES = [
  { mode: 'words', label: '단어 20개', settings: { count: 20, seconds: 60, kind: 'concrete' } },
  { mode: 'numbers', label: '숫자 40자리', settings: { digits: 40, seconds: 60, hints: false } },
  { mode: 'images', label: '이미지 20개', settings: { count: 20, seconds: 60 } },
  { mode: 'cards', label: '카드 20장', settings: { count: 20, seconds: 60 } },
];

/** 홈 위쪽 그림: 밤하늘 아래 궁전 */
function palaceArt() {
  const stars = [[22, 18, 1.4], [58, 34, 1], [96, 14, 1.2], [140, 26, 0.9], [262, 16, 1.3], [292, 40, 1], [236, 44, 0.8], [196, 12, 1]];
  return `
  <svg viewBox="0 0 320 130" class="palace-art" aria-hidden="true">
    ${stars.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" class="twinkle" style="animation-delay:${i * 0.4}s"/>`).join('')}
    <mask id="moon-cut"><rect width="320" height="130" fill="#fff"/><circle cx="277" cy="25" r="11" fill="#000"/></mask>
    <circle cx="270" cy="30" r="13" fill="#fff3c4" mask="url(#moon-cut)"/>
    <g fill="#fff" fill-opacity="0.92">
      <path d="M160 18 l3 8 h-6z" fill="#f4c542" fill-opacity="1"/>
      <path d="M130 58 a30 30 0 0 1 60 0z"/>
      <rect x="126" y="58" width="68" height="6" rx="2"/>
      <path d="M96 76 L160 62 L224 76z"/>
      <rect x="100" y="76" width="120" height="5" rx="1"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${106 + i * 20}" y="83" width="8" height="30" rx="2"/>`).join('')}
      <rect x="96" y="113" width="128" height="5" rx="1"/>
      <rect x="88" y="118" width="144" height="6" rx="1"/>
      <rect x="80" y="124" width="160" height="6" rx="1"/>
      <rect x="152" y="94" width="16" height="19" rx="8" fill="#f4c542" fill-opacity="0.95"/>
    </g>
  </svg>`;
}

export function homeView() {
  setTopbar('');
  const days = trainingDays();
  const palaces = getPalaces();
  const p = playerInfo();
  const stars = totalStars();
  const next = nextStage();

  const modeCards = MODES.map((m) => {
    const w = worldById(m.id);
    let bestText;
    if (m.best) bestText = m.best();
    else {
      const best = bestScore(m.id);
      bestText = best ? `최고 ${best.score}/${best.total}` : null;
    }
    return `
      <a href="#/${m.id}" style="--wc:${w.color}">
        <span class="icon">${w.icon}</span>
        <span class="title">${m.title}</span>
        <span class="muted">${m.desc}</span>
        <span class="best">${bestText || '아직 기록 없음'}<span class="tile-stars">★${worldStars(m.id)}</span></span>
      </a>`;
  }).join('');

  const palaceHint = palaces.length
    ? `궁전 ${palaces.length}개 · 장소 ${palaces.reduce((n, x) => n + x.loci.length, 0)}곳`
    : '아직 궁전이 없어요. 먼저 만들어 두면 훈련할 때 장소가 같이 보여요.';

  render(`
    <section class="hero">
      ${palaceArt()}
      <div class="hero-body">
        <a href="#/profile" class="hero-player">
          <span class="lv-badge">Lv.${p.level}</span>
          <span class="hero-who"><b>${esc(p.title)}</b><small>다음 레벨까지 ${p.need - p.into} XP</small></span>
          <span class="hero-arrow">›</span>
        </a>
        <div class="xp-bar light"><div style="width:${(p.into / p.need) * 100}%"></div></div>
        <div class="hero-stats">
          <span>🔥 <b>${days.streak}</b>일 연속</span>
          <span>⭐ <b>${stars}</b>/${MAX_STARS}</span>
          <span>${days.today ? '✅ 오늘 완료' : '⏳ 오늘 아직'}</span>
        </div>
      </div>
    </section>

    ${next ? `
      <button class="cta" id="cta" style="--wc:${next.world.color}">
        <span class="cta-icon">${next.world.icon}</span>
        <span class="cta-body">
          <small>🗺️ 단계 도전 · 이어서</small>
          <b>${esc(next.world.name)} ${next.level}단계</b>
          <small>${esc(stageText(next.world, next.world.stages[next.level - 1]))}</small>
        </span>
        <span class="cta-go">▶</span>
      </button>` : `
      <a class="cta" href="#/stages" style="--wc:#d98a1c">
        <span class="cta-icon">👑</span>
        <span class="cta-body"><b>모든 단계를 깼어요!</b><small>별 3개를 노려 보세요</small></span>
        <span class="cta-go">▶</span>
      </a>`}
    <a href="#/stages" class="muted" style="display:block;text-align:right;margin:6px 2px 0">세계 지도 전체 보기 →</a>

    ${todayCardHtml()}

    <h2>자유 훈련</h2>
    <nav class="menu">${modeCards}</nav>

    <h2>⏱️ 1분 도전</h2>
    <p class="muted" style="margin-top:0">외우는 시간은 딱 1분. 끝나면 내 최고 기록과 비교해요.</p>
    <div class="challenge-grid">
      ${CHALLENGES.map((c, i) => {
        const best = bestScore(c.mode);
        const w = worldById(c.mode);
        return `<button data-i="${i}" style="--wc:${w.color}">
          <span>${w.icon} ${c.label}</span>
          <small>${best ? `최고 ${best.score}/${best.total}` : '도전!'}</small>
        </button>`;
      }).join('')}
    </div>

    <h2>준비</h2>
    <nav class="menu small">
      <a href="#/palace" style="--wc:#b07d2b">
        <span class="icon">🏛️</span>
        <span class="title">내 궁전</span>
        <span class="muted">${palaceHint}</span>
      </a>
      <a href="#/dictionary" style="--wc:#1f9d8b">
        <span class="icon">📖</span>
        <span class="title">숫자 사전</span>
        <span class="muted">00~99 그림 보기·수정</span>
      </a>
      <a href="#/learn" style="--wc:#2f6fe0">
        <span class="icon">🎓</span>
        <span class="title">기법 배우기</span>
        <span class="muted">처음이면 여기부터</span>
      </a>
      <a href="#/profile" style="--wc:#c43c83">
        <span class="icon">🏅</span>
        <span class="title">레벨·업적</span>
        <span class="muted">칭호와 배지 모음</span>
      </a>
      <a href="#/stats" style="--wc:#7c4dcc">
        <span class="icon">📈</span>
        <span class="title">기록</span>
        <span class="muted">점수 추이·백업</span>
      </a>
      <a href="#/plan" style="--wc:#e0603f">
        <span class="icon">🗓️</span>
        <span class="title">40일 과정</span>
        <span class="muted">하루 단위 일정</span>
      </a>
    </nav>
  `);
  bindTodayCard();

  document.getElementById('cta')?.addEventListener('click', () => openStage(next.world.id, next.level));
  document.querySelectorAll('.challenge-grid button').forEach((b) => {
    b.onclick = () => {
      const c = CHALLENGES[+b.dataset.i];
      setSettings(c.mode, { ...getSettings(c.mode, {}), ...c.settings });
      go('/' + c.mode);
    };
  });
}
