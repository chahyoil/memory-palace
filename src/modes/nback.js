// 듀얼 N백: 작업 기억 훈련.
// 칸 위치(눈)와 글자 소리(귀)를 동시에 기억했다가, N번 전과 같으면 누르기.
// 단계 조정 규칙은 듀얼 N백 연구(Jaeggi 외 2008)에서 쓴 방식을 따랐어요:
//   한 판(20+N번)에서 위치·소리 각각 틀린 게 3개 미만 → N+1, 어느 쪽이든 6개 이상 → N-1
import { render, setTopbar, toast, shuffle } from '../ui.js';
import { getSettings, setSettings, addHistory, getHistory } from '../storage.js';
import { onLeave } from '../router.js';

const MODE = 'nback';
const DEFAULTS = { n: 2, auto: true, speed: 3000, sound: 'voice' };
const LETTERS = ['가', '나', '다', '라', '마', '바', '사', '아'];
const BASE_TRIALS = 20; // 한 판 = 20 + N번
const TARGETS = 6; // 위치 정답 6번, 소리 정답 6번
const BOTH = 2; // 그중 2번은 둘 다 정답
const SHOW_MS = 500; // 칸이 켜져 있는 시간
const MAX_N = 9;

const canSpeak = 'speechSynthesis' in window;
let koVoice = null;
function loadVoice() {
  if (!canSpeak) return;
  koVoice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith('ko')) || null;
}
if (canSpeak) {
  loadVoice();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoice);
}

function speak(text) {
  if (!canSpeak) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 1.1;
  if (koVoice) u.voice = koVoice;
  speechSynthesis.speak(u);
}

/** 지금까지 가장 높았던 단계 (홈 화면용) */
export function nbackBest() {
  const levels = getHistory().filter((h) => h.mode === MODE).map((h) => +h.n || 0);
  return levels.length ? Math.max(...levels) : null;
}

export function nbackMode() {
  setup();
}

function setup() {
  setTopbar('');
  const s = getSettings(MODE, DEFAULTS);
  if (!canSpeak) s.sound = 'text';
  const best = nbackBest();

  render(`
    <h1>🧠 듀얼 N백</h1>
    <p class="muted">칸 하나가 켜지면서 글자 하나가 들려요. 지금 것이 <b>N번 전</b>과 같으면 눌러요.</p>
    <ul class="muted" style="margin-top:0">
      <li>칸 위치가 같으면 <b>📍 위치 같음</b></li>
      <li>들린 글자가 같으면 <b>🔊 소리 같음</b></li>
      <li>둘 다 같으면 둘 다, 아니면 아무것도 안 눌러요.</li>
    </ul>
    <section class="card stack">
      <label for="n">단계 (N)</label>
      <select id="n">${Array.from({ length: MAX_N }, (_, i) => i + 1).map((n) => `<option value="${n}" ${n === s.n ? 'selected' : ''}>${n}백${n === 1 ? ' (바로 전과 비교)' : ''}</option>`).join('')}</select>
      <label><input type="checkbox" id="auto" style="width:auto" ${s.auto ? 'checked' : ''}/> 잘하면 올리고 못하면 내리기 (자동)</label>
      <label for="speed">속도</label>
      <select id="speed">
        ${[[3500, '천천히 (3.5초)'], [3000, '보통 (3초)'], [2500, '빠르게 (2.5초)']].map(([v, l]) => `<option value="${v}" ${v === s.speed ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <label for="sound">글자</label>
      <select id="sound">
        <option value="voice" ${s.sound === 'voice' ? 'selected' : ''} ${canSpeak ? '' : 'disabled'}>소리로 듣기 (이어폰 추천)</option>
        <option value="text" ${s.sound === 'text' ? 'selected' : ''}>가운데에 글자로 보기 (소리를 못 낼 때)</option>
      </select>
      <div class="row">
        <button id="test" class="secondary" ${canSpeak ? '' : 'disabled'}>🔊 소리 확인</button>
        <button id="start">시작</button>
      </div>
      ${best ? `<p class="muted center" style="margin:0">지금까지 최고 ${best}백</p>` : ''}
    </section>
    <p class="muted">📌 기억의 궁전과는 다른 <b>작업 기억</b>(잠깐 붙잡아 두는 기억) 연습이에요. 하면 할수록 이 과제는 잘하게 되지만, 지능이 오른다는 근거는 약해요. 한 판에 1분 남짓, 하루 몇 판이면 충분해요.</p>
  `);

  document.getElementById('test').onclick = () => speak('가, 나, 다');
  document.getElementById('start').onclick = () => {
    const settings = {
      n: +document.getElementById('n').value,
      auto: document.getElementById('auto').checked,
      speed: +document.getElementById('speed').value,
      sound: document.getElementById('sound').value,
    };
    setSettings(MODE, settings);
    if (settings.sound === 'voice') speak(' '); // 첫 소리가 막히지 않게 버튼 누른 순간에 한 번 깨우기
    play(settings);
  };
}

const randInt = (max) => Math.floor(Math.random() * max);
function randomExcept(max, not) {
  let v;
  do v = randInt(max); while (v === not);
  return v;
}

/** 위치·소리 순서 만들기. 정답 위치를 먼저 정하고, 나머지는 N번 전과 다르게 */
function makeSequence(n) {
  const T = BASE_TRIALS + n;
  const idx = shuffle(Array.from({ length: T - n }, (_, i) => i + n));
  const both = idx.slice(0, BOTH);
  const posT = new Set([...both, ...idx.slice(BOTH, TARGETS)]);
  const sndT = new Set([...both, ...idx.slice(TARGETS, TARGETS * 2 - BOTH)]);
  const pos = [];
  const snd = [];
  for (let i = 0; i < T; i++) {
    if (i < n) {
      pos.push(randInt(8));
      snd.push(randInt(LETTERS.length));
    } else {
      pos.push(posT.has(i) ? pos[i - n] : randomExcept(8, pos[i - n]));
      snd.push(sndT.has(i) ? snd[i - n] : randomExcept(LETTERS.length, snd[i - n]));
    }
  }
  return { T, pos, snd, posT, sndT };
}

function play(settings) {
  const { n } = settings;
  const seq = makeSequence(n);
  const resp = Array.from({ length: seq.T }, () => ({ pos: false, snd: false }));
  let i = -1;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); fn(); }, ms);
    timers.add(t);
  };

  // 3×3 칸에서 가운데를 뺀 8칸이 위치. 가운데는 '글자로 보기'일 때 글자 자리
  render(`
    <div class="progress"><div id="prog" style="width:0"></div></div>
    <p class="center muted" style="margin:4px 0">${n}번 전과 같으면 눌러요</p>
    <div class="nback-grid">
      ${Array.from({ length: 9 }, (_, k) => (k === 4 ? '<div class="nb-center" id="letter">+</div>' : '<div class="nb-cell"></div>')).join('')}
    </div>
    <div class="row nback-buttons">
      <button id="bpos" class="secondary">📍 위치 같음<small>A</small></button>
      <button id="bsnd" class="secondary">🔊 소리 같음<small>L</small></button>
    </div>
    <p></p>
    <button id="stop" class="secondary" style="width:100%">그만하기</button>
  `);

  const cells = [...document.querySelectorAll('.nb-cell')];
  const letterEl = document.getElementById('letter');
  const prog = document.getElementById('prog');
  const btn = { pos: document.getElementById('bpos'), snd: document.getElementById('bsnd') };
  const targets = { pos: seq.posT, snd: seq.sndT };

  const press = (kind) => {
    if (i < 0 || i >= seq.T || resp[i][kind]) return;
    resp[i][kind] = true;
    btn[kind].classList.add(targets[kind].has(i) ? 'correct' : 'wrong');
  };

  const step = () => {
    // 바로 전 판에서 놓친 정답이 있으면 잠깐 표시
    for (const kind of ['pos', 'snd']) {
      btn[kind].classList.remove('correct', 'wrong', 'missed');
      if (i >= 0 && targets[kind].has(i) && !resp[i][kind]) {
        btn[kind].classList.add('missed');
        later(() => btn[kind].classList.remove('missed'), 600);
      }
    }
    i += 1;
    if (i >= seq.T) return finish();

    setTopbar(`${i + 1}/${seq.T}`);
    prog.style.width = `${((i + 1) / seq.T) * 100}%`;
    const cell = cells[seq.pos[i]];
    cell.classList.add('on');
    const letter = LETTERS[seq.snd[i]];
    if (settings.sound === 'voice') speak(letter);
    else letterEl.textContent = letter;
    later(() => {
      cell.classList.remove('on');
      if (settings.sound !== 'voice') letterEl.textContent = '+';
    }, SHOW_MS);
    later(step, settings.speed);
  };

  const onKey = (e) => {
    if (e.code === 'KeyA') press('pos');
    else if (e.code === 'KeyL') press('snd');
  };
  btn.pos.onclick = () => press('pos');
  btn.snd.onclick = () => press('snd');
  document.addEventListener('keydown', onKey);

  const stopAll = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    document.removeEventListener('keydown', onKey);
    if (canSpeak) speechSynthesis.cancel();
    setTopbar('');
  };
  onLeave(stopAll);
  document.getElementById('stop').onclick = () => {
    stopAll();
    onLeave(null);
    toast('중간에 그만둔 판은 기록하지 않아요');
    setup();
  };

  const finish = () => {
    stopAll();
    onLeave(null);
    const stat = (kind) => {
      let hit = 0; let miss = 0; let fa = 0;
      for (let t = 0; t < seq.T; t++) {
        const isT = targets[kind].has(t);
        if (isT && resp[t][kind]) hit += 1;
        else if (isT) miss += 1;
        else if (resp[t][kind]) fa += 1;
      }
      return { hit, miss, fa, err: miss + fa };
    };
    const P = stat('pos');
    const S = stat('snd');
    const pct = Math.round((100 * (P.hit + S.hit)) / (P.hit + S.hit + P.err + S.err));

    let next = n;
    if (P.err < 3 && S.err < 3) next = Math.min(MAX_N, n + 1);
    else if (P.err > 5 || S.err > 5) next = Math.max(1, n - 1);
    const nextSettings = settings.auto ? { ...settings, n: next } : settings;
    setSettings(MODE, nextSettings);

    const prevBest = nbackBest();
    addHistory({ mode: MODE, score: pct, total: 100, n, seconds: Math.round((seq.T * settings.speed) / 1000), settings });

    const move = !settings.auto || next === n
      ? `다음에도 ${n}백`
      : next > n ? `⬆️ 잘했어요! 다음엔 ${next}백` : `⬇️ 다음엔 ${next}백으로 쉬어 가요`;
    const row = (name, s) => `<tr><th>${name}</th><td>${s.hit}/${TARGETS}</td><td>${s.miss}</td><td>${s.fa}</td></tr>`;

    render(`
      <div class="score">${pct}%</div>
      <p class="center muted" style="margin:0">${n}백 · 맞힌 비율</p>
      ${prevBest != null && n > prevBest ? `<p class="center best-badge">🏆 처음으로 ${n}백까지 왔어요!</p>` : ''}
      <p class="center"><b>${move}</b></p>
      <section class="card">
        <table>
          <thead><tr><th></th><th>맞힘</th><th>놓침</th><th>잘못 누름</th></tr></thead>
          <tbody>${row('📍 위치', P)}${row('🔊 소리', S)}</tbody>
        </table>
        <p class="muted" style="margin-bottom:0">위치·소리 각각 틀린 게(놓침+잘못 누름) 3개 미만이면 한 단계 올라가고, 6개 이상이면 내려가요.</p>
      </section>
      <div class="row">
        <button id="again">${settings.auto ? `${nextSettings.n}백 ` : ''}다시 하기</button>
        <a class="btn secondary" href="#/">홈</a>
      </div>
    `);
    document.getElementById('again').onclick = () => {
      if (nextSettings.sound === 'voice') speak(' ');
      play(nextSettings);
    };
  };

  setTopbar('준비');
  later(step, 1200);
}
