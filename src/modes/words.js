// 단어 종목: 무작위 단어를 순서대로 외우고, 같은 순서로 적기
import { render, setTopbar, startTimer, sample, esc, norm, locusName, fmtTime, saveResult, resultBadge } from '../ui.js';
import { getLoci, getSettings, setSettings, bestScore } from '../storage.js';
import { onLeave } from '../router.js';
import { wordPool } from '../data/words-ko.js';
import { palacePickerHtml, bindPalacePicker, usePalace } from '../palace-picker.js';

const MODE = 'words';
const DEFAULTS = { count: 10, seconds: 120, kind: 'concrete' };
const KINDS = { concrete: '구체어 (그림이 바로 떠오름)', mixed: '섞어서', abstract: '추상어 (어려움)' };

export function wordsMode() {
  setup();
}

function setup() {
  setTopbar('');
  const s = getSettings(MODE, DEFAULTS);
  const best = bestScore(MODE);

  render(`
    <h1>📝 단어</h1>
    <p class="muted">단어가 하나씩 나와요. 궁전의 자리마다 단어를 이상한 장면으로 놓으세요. 시간이 끝나면 순서대로 적어요.</p>
    <section class="card stack">
      ${palacePickerHtml()}
      <label for="count">단어 수</label>
      <select id="count">${[5, 10, 15, 20, 30, 50].map((n) => `<option ${n === s.count ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label for="kind">단어 종류</label>
      <select id="kind">${Object.entries(KINDS).map(([k, label]) => `<option value="${k}" ${k === s.kind ? 'selected' : ''}>${label}</option>`).join('')}</select>
      <label for="seconds">외우는 시간</label>
      <select id="seconds">${[60, 120, 180, 300, 600].map((n) => `<option value="${n}" ${n === s.seconds ? 'selected' : ''}>${fmtTime(n)}</option>`).join('')}</select>
      <button id="start">시작</button>
      ${best ? `<p class="muted center" style="margin:0">최고 기록 ${best.score}/${best.total}</p>` : ''}
    </section>
    <p class="muted">💡 추상어는 떠오르는 장면으로 바꿔서 놓아요. 자유 → 새장에서 날아가는 새, 시간 → 녹아내리는 시계.</p>
  `);

  bindPalacePicker(() => +document.getElementById('count').value, ['count']);

  document.getElementById('start').onclick = () => {
    const settings = {
      count: +document.getElementById('count').value,
      seconds: +document.getElementById('seconds').value,
      kind: document.getElementById('kind').value,
    };
    setSettings(MODE, settings);
    memorize(settings);
  };
}

function memorize(settings) {
  const words = sample(wordPool(settings.kind), settings.count);
  usePalace();
  const loci = getLoci();
  let i = 0;

  const timer = startTimer(settings.seconds, () => recall(words, settings, settings.seconds));
  onLeave(() => timer.stop());

  const draw = () => {
    render(`
      <div class="progress"><div style="width:${((i + 1) / words.length) * 100}%"></div></div>
      <p class="center"><span class="locus-tag">${esc(locusName(loci, i))}</span></p>
      <div class="card big-item">${esc(words[i])}</div>
      <p class="center muted">${i + 1} / ${words.length}</p>
      <div class="row">
        <button id="prev" class="secondary" ${i === 0 ? 'disabled' : ''}>◀ 이전</button>
        <button id="next" class="secondary" ${i === words.length - 1 ? 'disabled' : ''}>다음 ▶</button>
      </div>
      <p></p>
      <button id="done" style="width:100%">다 외웠어요</button>
    `);
    document.getElementById('prev').onclick = () => { i -= 1; draw(); };
    document.getElementById('next').onclick = () => { i += 1; draw(); };
    document.getElementById('done').onclick = () => {
      const used = timer.stop();
      recall(words, settings, used);
    };
  };
  draw();
}

function recall(words, settings, usedSeconds) {
  onLeave(null);
  setTopbar('떠올리기');
  const loci = getLoci();

  render(`
    <h1>떠올리기</h1>
    <p class="muted">궁전을 다시 걸어가면서 자리마다 놓은 단어를 적으세요. 모르면 비워 두세요.</p>
    <form id="f" class="stack">
      ${words.map((_, i) => `
        <label for="w${i}">${i + 1}. ${esc(locusName(loci, i))}</label>
        <input id="w${i}" autocomplete="off" autocapitalize="off" />`).join('')}
      <button type="submit">채점</button>
    </form>
  `);

  document.getElementById('w0')?.focus();
  document.getElementById('f').onsubmit = (e) => {
    e.preventDefault();
    const answers = words.map((_, i) => document.getElementById('w' + i).value);
    result(words, answers, settings, usedSeconds);
  };
}

function result(words, answers, settings, usedSeconds) {
  setTopbar('');
  const ok = words.map((w, i) => norm(w) === norm(answers[i]));
  const score = ok.filter(Boolean).length;
  const rec = saveResult({ mode: MODE, score, total: words.length, seconds: Math.round(usedSeconds), settings });

  render(`
    <div class="score">${score} / ${words.length}</div>
    ${resultBadge(rec)}
    <p class="center muted">외운 시간 ${fmtTime(usedSeconds)}</p>
    <section class="card">
      <ul class="result-list">
        ${words.map((w, i) => `
          <li class="${ok[i] ? 'ok' : 'bad'}">
            <span>${i + 1}. <b>${esc(w)}</b></span>
            <span class="answer">${ok[i] ? '✓' : esc(answers[i] || '(빈칸)')}</span>
          </li>`).join('')}
      </ul>
    </section>
    <p class="muted">틀린 자리는 장면이 약했던 곳이에요. 더 크게, 더 이상하게 만들어 보세요.</p>
    <div class="row">
      <button id="again">다시 하기</button>
      <a class="btn secondary" href="#/">홈</a>
    </div>
  `);
  document.getElementById('again').onclick = () => memorize(settings);
}
