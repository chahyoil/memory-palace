// #/profile: 레벨, 칭호, 업적
import { render, setTopbar, esc } from '../ui.js';
import { trainingDays, getHistory } from '../storage.js';
import { playerInfo, totalStars, getUnlocked, ACHIEVEMENTS, TITLES } from '../game.js';
import { MAX_STARS } from '../data/stages.js';

function levelRing(p) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const done = c * (p.into / p.need);
  return `
    <svg class="lv-ring" viewBox="0 0 110 110" aria-hidden="true">
      <circle cx="55" cy="55" r="${r}" class="ring-bg"/>
      <circle cx="55" cy="55" r="${r}" class="ring-fg" stroke-dasharray="${done} ${c}" transform="rotate(-90 55 55)"/>
      <text x="55" y="50" text-anchor="middle" class="ring-small">Lv</text>
      <text x="55" y="76" text-anchor="middle" class="ring-big">${p.level}</text>
    </svg>`;
}

export function profileView() {
  setTopbar('');
  const p = playerInfo();
  const got = getUnlocked();
  const days = trainingDays();
  const gotCount = ACHIEVEMENTS.filter((a) => got[a.id]).length;

  render(`
    <section class="hero hero-profile">
      ${levelRing(p)}
      <div class="hero-body">
        <div class="hero-title">${esc(p.title)}</div>
        <div>경험치 ${p.xp} · 다음 레벨까지 ${p.need - p.into}</div>
        <div class="xp-bar light" style="margin-top:8px"><div style="width:${(p.into / p.need) * 100}%"></div></div>
      </div>
    </section>

    <div class="stat-tiles">
      <div><b>⭐ ${totalStars()}</b><small>별 / ${MAX_STARS}</small></div>
      <div><b>🔥 ${days.streak}</b><small>연속 훈련일</small></div>
      <div><b>📅 ${days.total}</b><small>훈련한 날</small></div>
      <div><b>🏅 ${gotCount}</b><small>업적 / ${ACHIEVEMENTS.length}</small></div>
    </div>

    <h2>업적</h2>
    <div class="ach-grid">
      ${ACHIEVEMENTS.map((a) => `
        <div class="ach ${got[a.id] ? 'on' : ''}">
          <span class="ach-icon">${got[a.id] ? a.icon : '🔒'}</span>
          <b>${esc(a.name)}</b>
          <small>${esc(a.desc)}</small>
        </div>`).join('')}
    </div>

    <h2>칭호</h2>
    <section class="card title-list">
      ${TITLES.map(([lv, name], i) => {
        const next = TITLES[i + 1]?.[0] ?? Infinity;
        const cur = p.level >= lv && p.level < next;
        return `<div class="${cur ? 'cur' : p.level >= lv ? 'got' : ''}"><span>Lv.${lv}</span><b>${esc(name)}</b>${cur ? '<span class="locus-tag">지금</span>' : ''}</div>`;
      }).join('')}
    </section>

    <p class="muted">경험치는 훈련할 때마다 쌓여요. 오늘 첫 훈련, 최고 기록, 새 별, 단계 첫 통과에는 보너스가 붙어요. 기록 ${getHistory().length}개.</p>
  `);
}
