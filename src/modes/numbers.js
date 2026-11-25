// 숫자 종목: 무작위 숫자를 외우고 자리별로 적기
// 한 자리(locus)에 4자리 숫자(= 이미지 2개)를 놓는 대회식 방법을 기본으로 해요.
import { render, setTopbar, startTimer, esc, locusName, fmtTime, enterNext } from '../ui.js';
import { saveResult, rewardHtml } from '../game.js';
import { getLoci, getSettings, setSettings, bestScore, getNumberOverrides } from '../storage.js';
import { onLeave } from '../router.js';
import { numberImages } from '../data/number-images.js';
import { palacePickerHtml, bindPalacePicker, usePalace } from '../palace-picker.js';

const MODE = 'numbers';
const DEFAULTS = { digits: 20, seconds: 120, hints: true };
const PER_LOCUS = 4;

export function numbersMode() {
  setup();
}

function setup() {
  setTopbar('');
  const s = getSettings(MODE, DEFAULTS);
  const best = bestScore(MODE);

  render(`
    <h1>🔢 숫자</h1>
    <p class="muted">두 자리씩 끊어 숫자 사전의 이미지로 바꾸고, 궁전 한 자리에 이미지 2개(숫자 4개)를 함께 놓아요.</p>
    <section class="card stack">
      ${palacePickerHtml()}
      <label for="digits">숫자 개수</label>
      <select id="digits">${[8, 12, 20, 40, 80].map((n) => `<option ${n === s.digits ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label for="seconds">외우는 시간</label>
      <select id="seconds">${[60, 120, 180, 300].map((n) => `<option value="${n}" ${n === s.seconds ? 'selected' : ''}>${fmtTime(n)}</option>`).join('')}</select>
      <label><input type="checkbox" id="hints" style="width:auto" ${s.hints ? 'checked' : ''}/> 이미지 힌트 보이기 (익숙해지면 끄세요)</label>
      <button id="start">시작</button>
      ${best ? `<p class="muted center" style="margin:0">최고 기록 ${best.score}/${best.total}</p>` : ''}
    </section>
  `);

  bindPalacePicker(() => Math.ceil(+document.getElementById('digits').value / PER_LOCUS), ['digits']);

  document.getElementById('start').onclick = () => {
    const settings = {
      digits: +document.getElementById('digits').value,
      seconds: +document.getElementById('seconds').value,
      hints: document.getElementById('hints').checked,
    };
    setSettings(MODE, settings);
    memorize(settings);
  };
}

function randomDigits(n) {
  let s = '';
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  for (const b of buf) s += String(b % 10);
  return s;
}

function chunk(str, size) {
  const out = [];
  for (let i = 0; i < str.length; i += size) out.push(str.slice(i, i + size));
  return out;
}

/** 단계 도전 등에서 설정 화면 없이 바로 시작 */
export function start(settings) {
  memorize(settings);
}

function memorize(settings) {
  enterNext();
  const digits = randomDigits(settings.digits);
  const groups = chunk(digits, PER_LOCUS);
  usePalace();
  const loci = getLoci();
  const dict = numberImages(getNumberOverrides());

  const timer = startTimer(settings.seconds, () => recall(groups, settings, settings.seconds));
  onLeave(() => timer.stop());

  render(`
    <p class="muted center">한 줄 = 궁전 한 자리</p>
    <section class="stack">
      ${groups.map((g, i) => `
        <div class="card" style="margin:0;padding:10px 12px">
          <span class="locus-tag">${esc(locusName(loci, i))}</span>
          <div class="digits" style="justify-content:flex-start;margin-top:8px">
            ${chunk(g, 2).map((p) => `
              <div class="pair">${p}${settings.hints && p.length === 2 ? `<small>${esc(dict[p])}</small>` : ''}</div>`).join('')}
          </div>
        </div>`).join('')}
    </section>
    <p></p>
    <button id="done" style="width:100%">다 외웠어요</button>
  `);

  document.getElementById('done').onclick = () => recall(groups, settings, timer.stop());
}

function recall(groups, settings, usedSeconds) {
  enterNext();
  onLeave(null);
  setTopbar('떠올리기');
  const loci = getLoci();

  render(`
    <h1>떠올리기</h1>
    <p class="muted">자리마다 숫자 ${PER_LOCUS}개씩 적으세요.</p>
    <form id="f" class="stack">
      ${groups.map((g, i) => `
        <label for="g${i}">${i + 1}. ${esc(locusName(loci, i))}</label>
        <input id="g${i}" inputmode="numeric" pattern="[0-9]*" maxlength="${g.length}" autocomplete="off" />`).join('')}
      <button type="submit">채점</button>
    </form>
  `);

  // 다 입력하면 다음 칸으로 자동 이동
  groups.forEach((g, i) => {
    const el = document.getElementById('g' + i);
    el.addEventListener('input', () => {
      el.value = el.value.replace(/\D/g, '');
      if (el.value.length === g.length) document.getElementById('g' + (i + 1))?.focus();
    });
  });
  document.getElementById('g0')?.focus();

  document.getElementById('f').onsubmit = (e) => {
    e.preventDefault();
    const answers = groups.map((_, i) => document.getElementById('g' + i).value);
    result(groups, answers, settings, usedSeconds);
  };
}

function result(groups, answers, settings, usedSeconds) {
  setTopbar('');
  const total = groups.join('').length;
  let score = 0;
  const rows = groups.map((g, i) => {
    const a = answers[i] || '';
    let marked = '';
    for (let k = 0; k < g.length; k++) {
      const right = a[k] === g[k];
      if (right) score += 1;
      marked += right ? g[k] : `<span style="color:var(--bad);text-decoration:underline">${g[k]}</span>`;
    }
    return { g, a, marked, ok: a === g };
  });
  const rec = saveResult({ mode: MODE, score, total, seconds: Math.round(usedSeconds), settings });

  render(`
    <div class="score">${score} / ${total}</div>
    ${rewardHtml(rec)}
    <p class="center muted">외운 시간 ${fmtTime(usedSeconds)} · 자리 기준 채점 (위치가 맞는 숫자 수)</p>
    <section class="card">
      <ul class="result-list">
        ${rows.map((r, i) => `
          <li class="${r.ok ? 'ok' : 'bad'}">
            <span>${i + 1}. <b style="font-variant-numeric:tabular-nums">${r.marked}</b></span>
            <span class="answer">${r.ok ? '✓' : esc(r.a || '(빈칸)')}</span>
          </li>`).join('')}
      </ul>
    </section>
    <div class="row">
      <button id="again">다시 하기</button>
      <a class="btn secondary" href="#/">홈</a>
    </div>
  `);
  document.getElementById('again').onclick = () => memorize(settings);
}
