// 단계 도전: 세계 목록 → 세계 지도(10단계 길) → 단계 소개 → 3-2-1 → 훈련
import { render, setTopbar, esc, enterNext } from '../ui.js';
import { onLeave } from '../router.js';
import { WORLDS, worldById, stageText, MAX_STARS, STAGES_PER_WORLD } from '../data/stages.js';
import {
  setActiveStage, setStageLauncher, worldStars, totalStars, unlockedLevel, stageStars, clearedCount, starsHtml,
} from '../game.js';
import { countdown } from '../fx.js';
import { start as words } from '../modes/words.js';
import { start as numbers } from '../modes/numbers.js';
import { start as cards } from '../modes/cards.js';
import { start as images } from '../modes/images.js';
import { start as numdrill } from '../modes/numdrill.js';
import { start as nback } from '../modes/nback.js';

const RUNNERS = { words, numbers, cards, images, numdrill, nback };

const TIPS = {
  words: '단어마다 궁전 자리에 크고 이상한 장면으로 놓아요.',
  numbers: '두 자리씩 숫자 사전 그림으로 바꾸고, 한 자리에 그림 2개.',
  cards: '카드마다 정해 둔 그림을 떠올려 자리에 놓아요.',
  images: '다섯 개씩 짧은 이야기로 엮으면 순서가 안 섞여요.',
  numdrill: '보자마자 누르기! 고민하면 늦어요.',
  nback: '위치와 글자를 속으로 묶어 말해 보세요. "왼쪽 위-가"',
};

const ROW = 96; // 지도에서 단계 한 칸 높이(px)
const XS = [50, 76, 50, 24]; // 지그재그 가로 위치(%)

setStageLauncher((action, worldId, level) => {
  if (action === 'show') worldView(worldId);
  else if (action === 'intro') stageIntro(worldId, level);
});

/** #/stages: 세계 목록 */
export function stagesView() {
  setTopbar('');
  const total = totalStars();
  render(`
    <section class="hero hero-compact">
      <div class="hero-body">
        <h1 style="margin:0">🗺️ 단계 도전</h1>
        <p style="margin:4px 0 10px">세계마다 10단계. 별을 받으면 다음 단계가 열려요.</p>
        <div class="xp-bar light"><div style="width:${(total / MAX_STARS) * 100}%"></div></div>
        <div class="xp-meta light"><span>모은 별</span><span>⭐ ${total} / ${MAX_STARS}</span></div>
      </div>
    </section>
    <div class="world-list">
      ${WORLDS.map((w) => {
        const cleared = clearedCount(w.id);
        return `
        <button class="world-card" data-w="${w.id}" style="--wc:${w.color}">
          <span class="world-icon">${w.icon}</span>
          <span class="world-body">
            <b>${esc(w.name)}</b>
            <span class="muted">${esc(w.story)}</span>
            <span class="world-progress"><span style="width:${(cleared / STAGES_PER_WORLD) * 100}%"></span></span>
            <span class="world-meta"><span>${cleared === STAGES_PER_WORLD ? '👑 정복!' : `${cleared}/${STAGES_PER_WORLD} 단계`}</span><span>★ ${worldStars(w.id)}/${STAGES_PER_WORLD * 3}</span></span>
          </span>
        </button>`;
      }).join('')}
    </div>
  `);
  document.querySelectorAll('.world-card').forEach((b) => {
    b.onclick = () => worldView(b.dataset.w);
  });
}

function worldView(id) {
  enterNext();
  setTopbar('');
  const w = worldById(id);
  const open = unlockedLevel(id);
  const n = w.stages.length;
  const pts = w.stages.map((_, i) => [XS[i % XS.length], i * ROW + ROW / 2]);
  // 점들을 부드러운 곡선으로 잇기
  const d = pts.map(([x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = pts[i - 1];
    return `C${px} ${py + ROW / 2} ${x} ${y - ROW / 2} ${x} ${y}`;
  }).join(' ');
  const doneY = pts[Math.max(0, Math.min(open, n) - 1)][1];

  render(`
    <section class="world-banner" style="--wc:${w.color}">
      <button class="back-btn" id="back">‹ 세계 목록</button>
      <div class="world-banner-icon">${w.icon}</div>
      <h1>${esc(w.name)}</h1>
      <p>${esc(w.story)}</p>
      <div class="world-meta light"><span>${clearedCount(id)}/${n} 단계</span><span>★ ${worldStars(id)}/${n * 3}</span></div>
    </section>

    <div class="path" style="--wc:${w.color};height:${n * ROW}px">
      <svg class="path-line" viewBox="0 0 100 ${n * ROW}" preserveAspectRatio="none" aria-hidden="true">
        <path d="${d}" class="path-bg"/>
        <path d="${d}" class="path-done" style="clip-path:inset(0 0 ${n * ROW - doneY}px 0)"/>
      </svg>
      ${pts.map(([x, y], i) => {
        const lv = i + 1;
        const stars = stageStars(id, lv);
        const locked = lv > open;
        const current = lv === open && !stars;
        return `
          <button class="node ${locked ? 'locked' : ''} ${current ? 'current' : ''} ${stars ? 'done' : ''}"
            data-lv="${lv}" style="left:${x}%;top:${y}px" ${locked ? 'aria-disabled="true"' : ''} aria-label="${lv}단계">
            <span class="node-num">${locked ? '🔒' : lv === n ? '👑' : lv}</span>
            ${starsHtml(stars, 3, 'mini')}
          </button>`;
      }).join('')}
    </div>
    <p class="muted center">별 기준: ★ ${pctText(w, 0)} · ★★ ${pctText(w, 1)} · ★★★ ${pctText(w, 2)}</p>
  `);

  document.getElementById('back').onclick = () => stagesView();
  document.querySelectorAll('.node').forEach((b) => {
    b.onclick = () => {
      if (b.classList.contains('locked')) {
        b.classList.remove('shake');
        void b.offsetWidth;
        b.classList.add('shake');
        return;
      }
      stageIntro(id, +b.dataset.lv);
    };
  });
  // 지금 할 단계가 보이도록 스크롤
  const cur = document.querySelector('.node.current') || document.querySelector(`.node[data-lv="${open}"]`);
  cur?.scrollIntoView({ block: 'center' });
}

const pctText = (w, i) => (w.thresholds[i] >= 1 ? '전부' : `${Math.round(w.thresholds[i] * 100)}%`);

function stageIntro(id, level) {
  enterNext();
  setTopbar('');
  const w = worldById(id);
  const settings = w.stages[level - 1];
  const best = stageStars(id, level);

  render(`
    <section class="stage-intro" style="--wc:${w.color}">
      <div class="world-banner-icon">${w.icon}</div>
      <div class="muted">${esc(w.name)}</div>
      <h1>${level}단계${level === w.stages.length ? ' 👑' : ''}</h1>
      <div class="stage-goal">${esc(stageText(w, settings))}</div>
      <div style="margin:10px 0">${starsHtml(best, 3, 'big static')}</div>
      <div class="muted">${best ? '내 최고 별' : '아직 별이 없어요'}</div>
    </section>
    <section class="card">
      <div class="star-rule"><span>★</span> ${pctText(w, 0)} 이상 맞히기 <small>→ 다음 단계 열림</small></div>
      <div class="star-rule"><span>★★</span> ${pctText(w, 1)} 이상</div>
      <div class="star-rule"><span>★★★</span> ${pctText(w, 2)} 맞히기</div>
      <p class="muted" style="margin-bottom:0">💡 ${esc(TIPS[w.mode])}</p>
    </section>
    <button id="go" class="big-go" style="--wc:${w.color}">시작 ▶</button>
    <p></p>
    <button id="back" class="secondary" style="width:100%">‹ ${esc(w.name)}</button>
  `);

  document.getElementById('back').onclick = () => worldView(id);
  document.getElementById('go').onclick = () => {
    setActiveStage(id, level);
    const cancel = countdown(() => {
      onLeave(null);
      RUNNERS[w.mode]({ ...settings });
    }, `${w.name} ${level}단계`);
    onLeave(cancel);
  };
}
