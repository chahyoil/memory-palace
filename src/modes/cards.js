// 카드 종목: 섞인 트럼프 카드의 순서를 외우고, 같은 순서로 골라내기
import { render, setTopbar, startTimer, shuffle, esc, locusName, fmtTime, enterNext } from '../ui.js';
import { saveResult, rewardHtml } from '../game.js';
import { getLoci, getSettings, setSettings, bestScore } from '../storage.js';
import { onLeave } from '../router.js';
import { palacePickerHtml, bindPalacePicker, usePalace } from '../palace-picker.js';

const MODE = 'cards';
const DEFAULTS = { count: 10, seconds: 180 };

const SUITS = [
  { s: '♠', name: '스페이드', red: false },
  { s: '♥', name: '하트', red: true },
  { s: '♦', name: '다이아', red: true },
  { s: '♣', name: '클로버', red: false },
];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const DECK = SUITS.flatMap((suit) => RANKS.map((r) => ({ id: suit.s + r, label: r + suit.s, red: suit.red })));
const byId = Object.fromEntries(DECK.map((c) => [c.id, c]));

export function cardsMode() {
  setup();
}

function setup() {
  setTopbar('');
  const s = getSettings(MODE, DEFAULTS);
  const best = bestScore(MODE);

  render(`
    <h1>🃏 카드</h1>
    <p class="muted">카드마다 고정된 이미지를 정해 두면 빨라져요. (예: ♥K = 산타, ♠A = 저승사자) 처음엔 카드 모양 그대로 장면을 만들어도 괜찮아요.</p>
    <section class="card stack">
      ${palacePickerHtml()}
      <label for="count">카드 장 수</label>
      <select id="count">${[5, 10, 20, 26, 52].map((n) => `<option ${n === s.count ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label for="seconds">외우는 시간</label>
      <select id="seconds">${[60, 120, 180, 300, 600].map((n) => `<option value="${n}" ${n === s.seconds ? 'selected' : ''}>${fmtTime(n)}</option>`).join('')}</select>
      <button id="start">시작</button>
      ${best ? `<p class="muted center" style="margin:0">최고 기록 ${best.score}/${best.total}</p>` : ''}
    </section>
  `);

  bindPalacePicker(() => +document.getElementById('count').value, ['count']);

  document.getElementById('start').onclick = () => {
    const settings = {
      count: +document.getElementById('count').value,
      seconds: +document.getElementById('seconds').value,
    };
    setSettings(MODE, settings);
    memorize(settings);
  };
}

/** 단계 도전 등에서 설정 화면 없이 바로 시작 */
export function start(settings) {
  memorize(settings);
}

function memorize(settings) {
  enterNext();
  const cards = shuffle(DECK).slice(0, settings.count);
  usePalace();
  const loci = getLoci();
  let i = 0;

  const timer = startTimer(settings.seconds, () => recall(cards, settings, settings.seconds));
  onLeave(() => timer.stop());

  const draw = () => {
    const c = cards[i];
    render(`
      <div class="progress"><div style="width:${((i + 1) / cards.length) * 100}%"></div></div>
      <p class="center"><span class="locus-tag">${esc(locusName(loci, i))}</span></p>
      <div class="playing-card ${c.red ? 'red' : ''}">${c.label}</div>
      <p class="center muted">${i + 1} / ${cards.length}</p>
      <div class="row">
        <button id="prev" class="secondary" ${i === 0 ? 'disabled' : ''}>◀ 이전</button>
        <button id="next" class="secondary" ${i === cards.length - 1 ? 'disabled' : ''}>다음 ▶</button>
      </div>
      <p></p>
      <button id="done" style="width:100%">다 외웠어요</button>
    `);
    document.getElementById('prev').onclick = () => { i -= 1; draw(); };
    document.getElementById('next').onclick = () => { i += 1; draw(); };
    document.getElementById('done').onclick = () => recall(cards, settings, timer.stop());
  };
  draw();
}

function recall(cards, settings, usedSeconds) {
  enterNext();
  onLeave(null);
  setTopbar('떠올리기');
  const loci = getLoci();
  const picked = [];

  const draw = () => {
    const n = picked.length;
    render(`
      <h1>떠올리기</h1>
      <p class="muted">순서대로 카드를 눌러요. ${n < cards.length ? `다음: <b>${esc(locusName(loci, n))}</b>` : '다 골랐어요!'}</p>
      <div class="recall-slots">
        ${picked.map((id) => `<span class="${byId[id].red ? 'red' : ''}">${byId[id].label}</span>`).join('')}
        ${n < cards.length ? `<span>${n + 1}</span>` : ''}
      </div>
      <div class="card-grid">
        ${DECK.map((c) => `<button data-id="${c.id}" class="${c.red ? 'red' : ''} ${picked.includes(c.id) ? 'used' : ''}" ${picked.includes(c.id) || n >= cards.length ? 'disabled' : ''}>${c.label}</button>`).join('')}
      </div>
      <p></p>
      <div class="row">
        <button id="undo" class="secondary" ${n === 0 ? 'disabled' : ''}>되돌리기</button>
        <button id="submit">채점 (${n}/${cards.length})</button>
      </div>
    `);
    document.querySelectorAll('.card-grid button').forEach((b) => {
      b.onclick = () => { picked.push(b.dataset.id); draw(); };
    });
    document.getElementById('undo').onclick = () => { picked.pop(); draw(); };
    document.getElementById('submit').onclick = () => result(cards, picked, settings, usedSeconds);
  };
  draw();
}

function result(cards, picked, settings, usedSeconds) {
  setTopbar('');
  const ok = cards.map((c, i) => picked[i] === c.id);
  const score = ok.filter(Boolean).length;
  const rec = saveResult({ mode: MODE, score, total: cards.length, seconds: Math.round(usedSeconds), settings });

  render(`
    <div class="score">${score} / ${cards.length}</div>
    ${rewardHtml(rec)}
    <p class="center muted">외운 시간 ${fmtTime(usedSeconds)}</p>
    <section class="card">
      <ul class="result-list">
        ${cards.map((c, i) => `
          <li class="${ok[i] ? 'ok' : 'bad'}">
            <span>${i + 1}. <b style="color:${c.red ? '#c81e1e' : 'inherit'}">${c.label}</b></span>
            <span class="answer">${ok[i] ? '✓' : picked[i] ? byId[picked[i]].label : '(빈칸)'}</span>
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
