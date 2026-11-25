// 이미지 순서 종목: 한 줄에 그림 5개. 순서를 외우고, 섞인 줄에서 원래 순서대로 누르기.
// (온라인 기억력 대전의 '이미지' 종목을 초보용으로 단순하게 만든 것)
import { render, setTopbar, startTimer, shuffle, sample, fmtTime, saveResult, resultBadge } from '../ui.js';
import { getSettings, setSettings, bestScore } from '../storage.js';
import { onLeave } from '../router.js';
import { IMAGE_POOL } from '../data/images.js';

const MODE = 'images';
const DEFAULTS = { count: 10, seconds: 120 };
const PER_ROW = 5;

export function imagesMode() {
  setup();
}

function setup() {
  setTopbar('');
  const s = getSettings(MODE, DEFAULTS);
  const best = bestScore(MODE);

  render(`
    <h1>🖼️ 이미지 순서</h1>
    <p class="muted">그림이 한 줄에 5개씩 나와요. 그림들을 이어서 <b>이야기</b>로 만들거나 궁전 자리에 하나씩 놓아 순서를 외워요. 떠올릴 때는 섞인 줄에서 원래 순서대로 눌러요.</p>
    <section class="card stack">
      <label for="count">그림 수</label>
      <select id="count">${[10, 20, 30, 50].map((n) => `<option ${n === s.count ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label for="seconds">외우는 시간</label>
      <select id="seconds">${[60, 120, 180, 300].map((n) => `<option value="${n}" ${n === s.seconds ? 'selected' : ''}>${fmtTime(n)}</option>`).join('')}</select>
      <button id="start">시작</button>
      ${best ? `<p class="muted center" style="margin:0">최고 기록 ${best.score}/${best.total}</p>` : ''}
    </section>
    <p class="muted">💡 예: 🐸 🔑 🍕 ⛄ 🚀 → 개구리가 열쇠로 피자를 열었더니 눈사람이 튀어나와 로켓을 탔다.</p>
  `);

  document.getElementById('start').onclick = () => {
    const settings = {
      count: +document.getElementById('count').value,
      seconds: +document.getElementById('seconds').value,
    };
    setSettings(MODE, settings);
    memorize(settings);
  };
}

function toRows(list) {
  const rows = [];
  for (let i = 0; i < list.length; i += PER_ROW) rows.push(list.slice(i, i + PER_ROW));
  return rows;
}

function memorize(settings) {
  const rows = toRows(sample(IMAGE_POOL, settings.count));
  const timer = startTimer(settings.seconds, () => recall(rows, settings, settings.seconds));
  onLeave(() => timer.stop());

  render(`
    <p class="muted center">왼쪽부터 순서대로 외워요</p>
    <section class="stack">
      ${rows.map((r, i) => `
        <div class="img-row">
          <span class="img-row-no">${i + 1}</span>
          ${r.map((e) => `<span class="img-cell">${e}</span>`).join('')}
        </div>`).join('')}
    </section>
    <p></p>
    <button id="done" style="width:100%">다 외웠어요</button>
  `);
  document.getElementById('done').onclick = () => recall(rows, settings, timer.stop());
}

function recall(rows, settings, usedSeconds) {
  onLeave(null);
  setTopbar('떠올리기');
  // 줄마다 섞어서 보여 주고, 누른 순서를 기록
  const mixed = rows.map((r) => shuffle(r));
  const picked = rows.map(() => []); // picked[row] = 누른 그림 순서

  const draw = () => {
    const filled = picked.reduce((n, p) => n + p.length, 0);
    render(`
      <h1>떠올리기</h1>
      <p class="muted">줄마다 원래 순서대로 그림을 눌러요. 잘못 눌렀으면 그 줄의 '다시'를 눌러요.</p>
      <section class="stack">
        ${mixed.map((r, i) => `
          <div class="img-row">
            <span class="img-row-no">${i + 1}</span>
            ${r.map((e) => {
              const order = picked[i].indexOf(e);
              return `<button class="img-cell" data-row="${i}" data-e="${e}">${e}${order >= 0 ? `<small>${order + 1}</small>` : ''}</button>`;
            }).join('')}
            <button class="img-reset secondary" data-row="${i}" ${picked[i].length ? '' : 'disabled'}>다시</button>
          </div>`).join('')}
      </section>
      <p></p>
      <button id="submit" style="width:100%">채점 (${filled}/${settings.count})</button>
    `);
    document.querySelectorAll('button.img-cell').forEach((b) => {
      b.onclick = () => {
        const row = picked[+b.dataset.row];
        if (row.includes(b.dataset.e)) return;
        row.push(b.dataset.e);
        redraw();
      };
    });
    document.querySelectorAll('.img-reset').forEach((b) => {
      b.onclick = () => { picked[+b.dataset.row] = []; redraw(); };
    });
    document.getElementById('submit').onclick = () => result(rows, picked, settings, usedSeconds);
  };
  // 다시 그려도 스크롤 위치는 그대로 (줄이 많을 때 누를 때마다 맨 위로 가지 않게)
  const redraw = () => {
    const y = window.scrollY;
    draw();
    window.scrollTo(0, y);
  };
  draw();
}

function result(rows, picked, settings, usedSeconds) {
  setTopbar('');
  let score = 0;
  const marks = rows.map((r, i) => r.map((e, k) => {
    const ok = picked[i][k] === e;
    if (ok) score += 1;
    return ok;
  }));
  const rec = saveResult({ mode: MODE, score, total: settings.count, seconds: Math.round(usedSeconds), settings });

  render(`
    <div class="score">${score} / ${settings.count}</div>
    ${resultBadge(rec)}
    <p class="center muted">외운 시간 ${fmtTime(usedSeconds)} · 위치가 맞은 그림 수</p>
    <section class="card stack">
      ${rows.map((r, i) => `
        <div>
          <div class="img-row small">
            <span class="img-row-no">${i + 1}</span>
            ${r.map((e, k) => `<span class="img-cell ${marks[i][k] ? 'ok' : 'bad'}">${e}</span>`).join('')}
          </div>
          ${marks[i].every(Boolean) ? '' : `
            <div class="img-row small muted-row">
              <span class="img-row-no">내 답</span>
              ${r.map((_, k) => `<span class="img-cell">${picked[i][k] || '·'}</span>`).join('')}
            </div>`}
        </div>`).join('')}
    </section>
    <div class="row">
      <button id="again">다시 하기</button>
      <a class="btn secondary" href="#/">홈</a>
    </div>
  `);
  document.getElementById('again').onclick = () => memorize(settings);
}
