// 게임 요소: 단계 별, 경험치·레벨·칭호, 업적.
// 모든 훈련 결과는 saveResult() 로 저장해요 → 기록 + 별 + 경험치 + 업적이 한 번에 처리돼요.
import { esc } from './ui.js';
import { go, onNavigate } from './router.js';
import {
  getData, setData, getHistory, addHistory, bestScore, trainingDays, getPalaces,
} from './storage.js';
import { WORLDS, worldById, MAX_STARS, STAGES_PER_WORLD } from './data/stages.js';
import { confetti } from './fx.js';

/* ───────── 단계 도전 상태 ───────── */

let active = null; // { world: 'words', level: 3 } — 단계 도전 중일 때만
onNavigate(() => { active = null; }); // 다른 화면으로 가면 단계 도전 끝

export function setActiveStage(world, level) {
  active = { world, level };
}
export function getActiveStage() {
  return active;
}

let launcher = null; // views/map.js 가 등록: (worldId, level) => void
export function setStageLauncher(fn) {
  launcher = fn;
}

/* ───────── 별 ───────── */

/** { words: [3, 2, 0, ...], ... } index = 단계-1 */
export function getStars() {
  return getData('stars', {});
}
export function stageStars(worldId, level) {
  return (getStars()[worldId] || [])[level - 1] || 0;
}
export function worldStars(worldId) {
  return (getStars()[worldId] || []).reduce((a, b) => a + (b || 0), 0);
}
export function totalStars() {
  return WORLDS.reduce((n, w) => n + worldStars(w.id), 0);
}
/** 이 세계에서 도전할 수 있는 가장 높은 단계 (앞 단계를 별 1개 이상으로 깨야 열림) */
export function unlockedLevel(worldId) {
  const s = getStars()[worldId] || [];
  let lv = 1;
  while (lv < STAGES_PER_WORLD && (s[lv - 1] || 0) > 0) lv += 1;
  return lv;
}
export function clearedCount(worldId) {
  return (getStars()[worldId] || []).filter((x) => x > 0).length;
}
function starsFor(world, ratio) {
  const [a, b, c] = world.thresholds;
  if (ratio >= c) return 3;
  if (ratio >= b) return 2;
  if (ratio >= a) return 1;
  return 0;
}

/** 다음에 할 단계 추천: 아직 안 깬 단계가 있는 세계 중 진행이 가장 앞선 곳 */
export function nextStage() {
  let best = null;
  for (const w of WORLDS) {
    const cleared = clearedCount(w.id);
    if (cleared >= STAGES_PER_WORLD) continue;
    if (!best || cleared > best.cleared) best = { world: w, level: unlockedLevel(w.id), cleared };
  }
  return best;
}

/* ───────── 경험치 · 레벨 ───────── */

const ratioOf = (h) => {
  const r = h.mode === 'nback' ? h.score / 100 : h.total ? h.score / h.total : 0;
  return Math.max(0, Math.min(1, +r || 0));
};

/** 경험치. 처음 열면 지금까지의 기록으로 채워 줘요 (예전 기록도 헛되지 않게) */
export function getXp() {
  let xp = getData('xp', null);
  if (xp == null) {
    xp = getHistory().reduce((n, h) => n + 10 + Math.round(20 * ratioOf(h)), 0);
    setData('xp', xp);
  }
  return xp;
}
/** 레벨 L 이 되는 데 필요한 누적 경험치: 0, 100, 300, 600, 1000 … */
export function xpAt(level) {
  return 50 * level * (level - 1);
}
export function levelFromXp(xp) {
  let level = 1;
  while (xp >= xpAt(level + 1)) level += 1;
  return level;
}

export const TITLES = [
  [1, '기억 새싹'],
  [3, '기억 견습생'],
  [5, '장소 탐험가'],
  [8, '궁전 건축가'],
  [12, '이미지 장인'],
  [16, '기억 기사'],
  [20, '기억 마법사'],
  [25, '궁전의 주인'],
  [30, '전설의 기억술사'],
];
export function titleFor(level) {
  let t = TITLES[0][1];
  for (const [lv, name] of TITLES) if (level >= lv) t = name;
  return t;
}

export function playerInfo() {
  const xp = getXp();
  const level = levelFromXp(xp);
  const from = xpAt(level);
  const to = xpAt(level + 1);
  return { xp, level, title: titleFor(level), into: xp - from, need: to - from };
}

/** 상단바 오른쪽 레벨 표시 갱신 */
export function updateLevelChip() {
  const el = document.getElementById('topbar-level');
  if (!el) return;
  const p = playerInfo();
  el.textContent = `Lv.${p.level}`;
  el.title = `${p.title} · 경험치 ${p.xp}`;
}

/* ───────── 업적 ───────── */

const perfect = (hist, mode, minTotal) => hist.some((h) => h.mode === mode && h.total >= minTotal && h.score === h.total);

export const ACHIEVEMENTS = [
  { id: 'first', icon: '🌱', name: '첫걸음', desc: '첫 훈련을 마쳤어요', test: (c) => c.hist.length >= 1 },
  { id: 'streak3', icon: '🔥', name: '사흘 연속', desc: '3일 연속 훈련', test: (c) => c.days.streak >= 3 },
  { id: 'streak7', icon: '🔥', name: '일주일 연속', desc: '7일 연속 훈련', test: (c) => c.days.streak >= 7 },
  { id: 'streak30', icon: '🌋', name: '한 달 연속', desc: '30일 연속 훈련', test: (c) => c.days.streak >= 30 },
  { id: 'days40', icon: '🎓', name: '40일 완주', desc: '훈련한 날 40일', test: (c) => c.days.total >= 40 },
  { id: 'allModes', icon: '🎯', name: '모든 종목', desc: '여섯 종목을 다 해 봤어요', test: (c) => new Set(c.hist.map((h) => h.mode)).size >= 6 },
  { id: 'palace3', icon: '🏛️', name: '궁전 셋', desc: '궁전을 3개 만들었어요', test: (c) => c.palaces.length >= 3 },
  { id: 'words10', icon: '📝', name: '단어 10개 완벽', desc: '단어 10개 이상을 전부 맞힘', test: (c) => perfect(c.hist, 'words', 10) },
  { id: 'words30', icon: '📚', name: '단어 30개 완벽', desc: '단어 30개 이상을 전부 맞힘', test: (c) => perfect(c.hist, 'words', 30) },
  { id: 'num40', icon: '🔢', name: '숫자 40자리 완벽', desc: '숫자 40자리 이상을 전부 맞힘', test: (c) => perfect(c.hist, 'numbers', 40) },
  { id: 'num80', icon: '🏯', name: '숫자 80자리 완벽', desc: '숫자 80자리를 전부 맞힘', test: (c) => perfect(c.hist, 'numbers', 80) },
  { id: 'cards26', icon: '🃏', name: '카드 반 벌', desc: '카드 26장 이상을 전부 맞힘', test: (c) => perfect(c.hist, 'cards', 26) },
  { id: 'cards52', icon: '👑', name: '카드 한 벌', desc: '카드 52장을 전부 맞힘', test: (c) => perfect(c.hist, 'cards', 52) },
  { id: 'img30', icon: '🖼️', name: '그림 30개 완벽', desc: '그림 30개 이상 순서를 전부 맞힘', test: (c) => perfect(c.hist, 'images', 30) },
  {
    id: 'flash', icon: '⚡', name: '번개 사전', desc: '숫자 사전 20문제 이상, 다 맞히고 문제당 1.5초 이내',
    test: (c) => c.hist.some((h) => h.mode === 'numdrill' && h.total >= 20 && h.score === h.total && h.seconds / h.total <= 1.5),
  },
  { id: 'nback3', icon: '🧠', name: '3백 통과', desc: '듀얼 N백 3백에서 80% 이상', test: (c) => c.hist.some((h) => h.mode === 'nback' && h.n >= 3 && h.score >= 80) },
  { id: 'nback5', icon: '🌀', name: '5백 통과', desc: '듀얼 N백 5백에서 80% 이상', test: (c) => c.hist.some((h) => h.mode === 'nback' && h.n >= 5 && h.score >= 80) },
  {
    id: 'oneMin', icon: '⏱️', name: '1분 승부사', desc: '외우는 시간 1분인 판에서 10개 이상 맞힘',
    test: (c) => c.hist.some((h) => h.settings?.seconds === 60 && h.mode !== 'numdrill' && h.score >= 10),
  },
  { id: 'world', icon: '🗺️', name: '세계 정복', desc: '한 세계의 10단계를 모두 깸', test: (c) => WORLDS.some((w) => clearedCount(w.id) >= STAGES_PER_WORLD) },
  { id: 'stars30', icon: '⭐', name: '별 30개', desc: '단계 도전에서 별 30개', test: (c) => c.stars >= 30 },
  { id: 'stars90', icon: '🌟', name: '별 90개', desc: '단계 도전에서 별 90개', test: (c) => c.stars >= 90 },
  { id: 'starsAll', icon: '💫', name: '모든 별', desc: `별 ${MAX_STARS}개를 전부 모음`, test: (c) => c.stars >= MAX_STARS },
  { id: 'level10', icon: '🎖️', name: '레벨 10', desc: '레벨 10 달성', test: (c) => c.level >= 10 },
];

/** { id: '받은 날 ISO' } */
export function getUnlocked() {
  return getData('achievements', {});
}

/** 새로 받은 업적 목록을 돌려주고 저장 */
export function checkAchievements() {
  const got = getUnlocked();
  const ctx = {
    hist: getHistory(),
    days: trainingDays(),
    palaces: getPalaces(),
    stars: totalStars(),
    level: levelFromXp(getXp()),
  };
  const fresh = ACHIEVEMENTS.filter((a) => !got[a.id] && a.test(ctx));
  if (fresh.length) {
    const now = new Date().toISOString();
    for (const a of fresh) got[a.id] = now;
    setData('achievements', got);
  }
  return fresh;
}

/* ───────── 결과 저장 ───────── */

/**
 * 훈련 결과 저장. 결과 화면에서 rewardHtml(반환값) 을 보여 줘요.
 * entry: { mode, score, total, seconds, settings, ...추가 }
 */
export function saveResult(entry) {
  const prev = entry.mode === 'nback' ? null : bestScore(entry.mode);
  const firstToday = !trainingDays().today;
  const before = playerInfo();
  addHistory(entry);

  const ratio = ratioOf(entry);
  const isBest = !!prev && entry.score > prev.score;

  // 단계 도전 중이면 별 계산
  let stage = null;
  const w = active && worldById(active.world);
  if (w && w.mode === entry.mode) {
    const stars = starsFor(w, ratio);
    const all = getStars();
    const arr = all[w.id] || [];
    const had = arr[active.level - 1] || 0;
    if (stars > had) {
      arr[active.level - 1] = stars;
      all[w.id] = arr;
      setData('stars', all);
    }
    stage = {
      world: w,
      level: active.level,
      stars,
      had,
      cleared: stars > 0,
      firstClear: had === 0 && stars > 0,
      hasNext: active.level < w.stages.length,
    };
  }

  // 경험치
  const parts = [['훈련', 10 + Math.round(20 * ratio)]];
  if (firstToday) parts.push(['오늘 첫 훈련', 20]);
  if (isBest) parts.push(['최고 기록', 15]);
  if (stage && stage.stars > stage.had) parts.push([`새 별 ${stage.stars - stage.had}개`, 15 * (stage.stars - stage.had)]);
  if (stage?.firstClear) parts.push([`${stage.level}단계 첫 통과`, 10 + 5 * stage.level]);
  const xpGain = parts.reduce((n, [, v]) => n + v, 0);
  setData('xp', before.xp + xpGain);
  const after = playerInfo();

  const fresh = checkAchievements();
  updateLevelChip();

  const rec = {
    prev, isBest, stage, xpGain, parts, before, after,
    levelUp: after.level > before.level, fresh,
  };
  if (rec.levelUp || (stage && stage.stars > stage.had) || isBest || fresh.length) {
    setTimeout(() => confetti(), 150);
  }
  return rec;
}

export function starsHtml(n, max = 3, cls = '') {
  return `<span class="stars ${cls}">${Array.from({ length: max }, (_, i) =>
    `<span class="star ${i < n ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.18}s">★</span>`).join('')}</span>`;
}

/** 결과 화면 맨 위 보상 묶음 (별, 경험치, 레벨업, 업적, 단계 버튼) */
export function rewardHtml(rec) {
  const { stage, after } = rec;
  const best = rec.isBest
    ? `<p class="center best-badge">🏆 최고 기록 갱신! (이전 ${rec.prev.score}/${rec.prev.total})</p>`
    : rec.prev ? `<p class="center muted" style="margin:0">최고 기록 ${rec.prev.score}/${rec.prev.total}</p>` : '';

  const stageBlock = stage ? `
    <div class="reward-stage">
      ${starsHtml(stage.stars, 3, 'big')}
      <div><b>${esc(stage.world.name)} ${stage.level}단계</b> ${stage.cleared ? (stage.firstClear ? '첫 통과! 🎉' : '통과!') : '아쉬워요'}</div>
      ${stage.cleared ? '' : `<div class="muted">${Math.round(stage.world.thresholds[0] * 100)}% 이상 맞히면 별을 받아요. 다시 도전!</div>`}
      ${stage.firstClear && stage.hasNext ? `<div class="muted">🔓 ${stage.level + 1}단계가 열렸어요</div>` : ''}
    </div>` : '';

  const pct = Math.round((after.into / after.need) * 100);
  return `
    <section class="reward">
      ${stageBlock}
      ${best}
      <div class="xp-line">
        <span class="xp-gain">+${rec.xpGain} XP</span>
        <span class="muted">${rec.parts.map(([k, v]) => `${esc(k)} +${v}`).join(' · ')}</span>
      </div>
      <div class="xp-bar" aria-label="레벨 진행"><div style="width:${pct}%"></div></div>
      <div class="xp-meta"><span>Lv.${after.level} ${esc(after.title)}</span><span>${after.into}/${after.need}</span></div>
      ${rec.levelUp ? `<div class="levelup">🎉 레벨 업! <b>Lv.${after.level}</b>${after.title !== rec.before.title ? ` · 새 칭호 <b>${esc(after.title)}</b>` : ''}</div>` : ''}
      ${rec.fresh.length ? `
        <div class="ach-new">
          ${rec.fresh.map((a) => `<span class="ach-chip"><span>${a.icon}</span>${esc(a.name)}</span>`).join('')}
          <div class="muted">새 업적!</div>
        </div>` : ''}
      ${stage ? `
        <div class="row" style="margin-top:10px">
          ${stage.cleared && stage.hasNext ? `<button data-stage-go="next">다음 단계 ▶</button>` : ''}
          <button class="secondary" data-stage-go="map">🗺️ 지도</button>
        </div>` : ''}
    </section>`;
}

// 보상 묶음의 단계 버튼 (결과 화면이 매번 새로 그려져서 위임으로 처리)
document.addEventListener('click', (e) => {
  const b = e.target.closest?.('[data-stage-go]');
  if (!b) return;
  if (b.dataset.stageGo === 'map') {
    const w = active?.world;
    go('/stages');
    if (w) setTimeout(() => launcher?.('show', w), 0);
  } else if (b.dataset.stageGo === 'next' && active && launcher) {
    launcher('intro', active.world, active.level + 1);
  }
});

/** 다른 화면(홈 등)에서 단계 소개 화면으로 바로 가기 */
export function openStage(worldId, level) {
  go('/stages');
  setTimeout(() => launcher?.('intro', worldId, level), 0);
}
