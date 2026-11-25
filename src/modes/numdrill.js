// 숫자 사전 훈련: 00~99 ↔ 이미지를 빨리 떠올리는 반사 훈련 (4지선다)
import { render, setTopbar, shuffle, sample, esc, toast, saveResult, resultBadge } from '../ui.js';
import { getSettings, setSettings, bestScore, getNumberOverrides } from '../storage.js';
import { onLeave } from '../router.js';
import { numberImages, consonantHint } from '../data/number-images.js';

const MODE = 'numdrill';
const DEFAULTS = { count: 20, range: 'all', direction: 'mixed' };

const RANGES = {
  all: ['전체 00~99', 0, 99],
  r0: ['00~19', 0, 19],
  r1: ['20~39', 20, 39],
  r2: ['40~59', 40, 59],
  r3: ['60~79', 60, 79],
  r4: ['80~99', 80, 99],
};

export function numDrillMode() {
  setup();
}

function setup() {
  setTopbar('');
  const s = getSettings(MODE, DEFAULTS);
  const best = bestScore(MODE);

  render(`
    <h1>⚡ 숫자 사전 훈련</h1>
    <p class="muted">숫자를 보면 이미지가 바로 떠올라야 숫자 종목이 빨라져요. 하루 20개 범위씩 익혀 보세요.</p>
    <section class="card stack">
      <label for="range">범위</label>
      <select id="range">${Object.entries(RANGES).map(([k, [label]]) => `<option value="${k}" ${k === s.range ? 'selected' : ''}>${label}</option>`).join('')}</select>
      <label for="direction">방향</label>
      <select id="direction">
        <option value="mixed" ${s.direction === 'mixed' ? 'selected' : ''}>섞어서</option>
        <option value="n2w" ${s.direction === 'n2w' ? 'selected' : ''}>숫자 → 이미지</option>
        <option value="w2n" ${s.direction === 'w2n' ? 'selected' : ''}>이미지 → 숫자</option>
      </select>
      <label for="count">문제 수</label>
      <select id="count">${[10, 20, 40].map((n) => `<option ${n === s.count ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button id="start">시작</button>
      ${best ? `<p class="muted center" style="margin:0">최고 기록 ${best.score}/${best.total}</p>` : ''}
    </section>
  `);

  document.getElementById('start').onclick = () => {
    const settings = {
      range: document.getElementById('range').value,
      direction: document.getElementById('direction').value,
      count: +document.getElementById('count').value,
    };
    setSettings(MODE, settings);
    play(settings);
  };
}

function play(settings) {
  const dict = numberImages(getNumberOverrides());
  const [, lo, hi] = RANGES[settings.range];
  const pool = [];
  for (let n = lo; n <= hi; n++) pool.push(String(n).padStart(2, '0'));
  const allKeys = Object.keys(dict);

  // 범위가 문제 수보다 작으면 반복해서 채움
  let qs = [];
  while (qs.length < settings.count) qs = qs.concat(shuffle(pool));
  qs = qs.slice(0, settings.count);

  let idx = 0;
  let score = 0;
  const misses = [];
  const started = performance.now();
  let locked = false;
  let pending = null; // 답을 누른 뒤 다음 문제로 넘어가는 타이머
  onLeave(() => {
    clearTimeout(pending);
    setTopbar('');
  });

  const ask = () => {
    if (idx >= qs.length) return finish();
    locked = false;
    const key = qs[idx];
    const dir = settings.direction === 'mixed' ? (Math.random() < 0.5 ? 'n2w' : 'w2n') : settings.direction;
    const wrongKeys = sample(allKeys.filter((k) => k !== key && dict[k] !== dict[key]), 3);
    const options = shuffle([key, ...wrongKeys]);
    setTopbar(`${idx + 1}/${qs.length}`);

    render(`
      <div class="progress"><div style="width:${(idx / qs.length) * 100}%"></div></div>
      <div class="card big-item">${dir === 'n2w' ? key : esc(dict[key])}</div>
      <p class="center muted">${dir === 'n2w' ? `힌트: ${consonantHint(key)}` : '몇 번일까요?'}</p>
      <div class="choices">
        ${options.map((k) => `<button data-k="${k}">${dir === 'n2w' ? esc(dict[k]) : k}</button>`).join('')}
      </div>
    `);

    document.querySelectorAll('.choices button').forEach((b) => {
      b.onclick = () => {
        if (locked) return;
        locked = true;
        const right = b.dataset.k === key;
        b.classList.add(right ? 'correct' : 'wrong');
        if (right) score += 1;
        else {
          misses.push(key);
          document.querySelector(`.choices button[data-k="${key}"]`).classList.add('correct');
        }
        pending = setTimeout(() => { idx += 1; ask(); }, right ? 350 : 1100);
      };
    });
  };

  const finish = () => {
    setTopbar('');
    const seconds = (performance.now() - started) / 1000;
    const rec = saveResult({ mode: MODE, score, total: qs.length, seconds: Math.round(seconds), settings });
    const uniqMiss = [...new Set(misses)];
    render(`
      <div class="score">${score} / ${qs.length}</div>
      ${resultBadge(rec)}
      <p class="center muted">평균 ${(seconds / qs.length).toFixed(1)}초/문제 · 목표는 1초 이내</p>
      ${uniqMiss.length ? `
        <section class="card">
          <h2 style="margin-top:0">헷갈린 숫자</h2>
          <div class="dict-grid">${uniqMiss.map((k) => `<div><b>${k}</b>${esc(dict[k])}</div>`).join('')}</div>
          <p class="muted">잘 안 떠오르는 단어는 <a href="#/dictionary">숫자 사전</a>에서 내 단어로 바꿔 보세요.</p>
        </section>` : ''}
      <div class="row">
        <button id="again">다시 하기</button>
        <a class="btn secondary" href="#/">홈</a>
      </div>
    `);
    document.getElementById('again').onclick = () => play(settings);
    if (score === qs.length) toast('전부 맞혔어요! 🎉');
  };

  ask();
}
