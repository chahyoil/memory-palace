import { render, setTopbar, toast, esc, fmtTime } from '../ui.js';
import { getHistory, exportAll, importAll, trainingDays } from '../storage.js';

const NAMES = { words: '단어', numbers: '숫자', cards: '카드', images: '이미지', numdrill: '숫자 사전', nback: '듀얼 N백' };
const ICONS = { words: '📝', numbers: '🔢', cards: '🃏', images: '🖼️', numdrill: '⚡', nback: '🧠' };
const UNITS = { words: '개', numbers: '자리', cards: '장', images: '개', numdrill: '문제', nback: '%' };

// 그래프에 그릴 값. 듀얼 N백은 점수(%)보다 단계(N)가 오르는 게 중요해서 단계를 그려요.
const VALUE = { nback: (h) => +h.n || 0 };
const value = (mode, h) => (VALUE[mode] ? VALUE[mode](h) : +h.score || 0);
const bestText = (mode, list) => {
  const max = Math.max(...list.map((h) => value(mode, h)));
  return mode === 'nback' ? `최고 ${max}백` : `최고 ${max}${UNITS[mode]}`;
};
const CHART_POINTS = 30; // 그래프에 보여 줄 최근 기록 수

export function statsView() {
  setTopbar('');
  const all = getHistory();
  const hist = all.slice().reverse();
  const days = trainingDays();

  const byMode = Object.keys(NAMES)
    .map((mode) => ({ mode, list: all.filter((h) => h.mode === mode).slice(-CHART_POINTS) }))
    .filter((m) => m.list.length);

  const rows = hist.slice(0, 50).map((h) => `
    <tr>
      <td>${esc(h.day || String(h.at).slice(0, 10))}</td>
      <td>${esc(NAMES[h.mode] || h.mode)}</td>
      <td>${h.mode === 'nback' ? `<b>${esc(h.n)}백</b> ${esc(h.score)}%` : `<b>${esc(h.score)}</b>/${esc(h.total)}`}</td>
      <td>${h.seconds != null ? fmtTime(h.seconds) : '-'}</td>
    </tr>`).join('');

  render(`
    <h1>기록</h1>
    <p class="muted">총 ${days.total}일 훈련 · 연속 ${days.streak}일 · 기록 ${hist.length}개</p>

    ${byMode.length ? `
      <h2>점수 추이</h2>
      <p class="muted" style="margin-top:0">맞힌 개수(듀얼 N백은 단계), 최근 ${CHART_POINTS}번까지. 그래프를 누르면 그때 기록이 보여요.</p>
      ${byMode.map((m) => `
        <section class="card chart-card">
          <div class="row" style="align-items:baseline">
            <h3>${ICONS[m.mode]} ${NAMES[m.mode]}</h3>
            <span class="muted chart-best">${bestText(m.mode, m.list)}</span>
          </div>
          <div class="chart-readout muted" id="ro-${m.mode}"></div>
          <div class="chart" id="ch-${m.mode}"></div>
        </section>`).join('')}` : ''}

    <h2>전체 기록</h2>
    <section class="card">
      ${hist.length ? `
        <table>
          <thead><tr><th>날짜</th><th>종목</th><th>점수</th><th>외운 시간</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>` : '<p class="muted">아직 기록이 없어요.</p>'}
    </section>

    <h2>백업</h2>
    <p class="muted">기록은 이 폰의 브라우저 안에만 있어요. 앱을 지우거나 브라우저 데이터를 지우면 사라지니 가끔 백업하세요.</p>
    <section class="card stack">
      <button id="export" class="secondary">백업 내용 복사</button>
      <textarea id="backup" placeholder="여기에 백업 내용을 붙여넣고 '복원'을 누르세요" style="min-height:100px"></textarea>
      <button id="import" class="secondary">복원</button>
    </section>
  `);

  for (const m of byMode) {
    drawTrend(document.getElementById('ch-' + m.mode), document.getElementById('ro-' + m.mode), m.list, m.mode);
  }

  document.getElementById('export').onclick = async () => {
    const data = exportAll();
    try {
      await navigator.clipboard.writeText(data);
      toast('복사했어요. 메모 앱 등에 붙여넣어 두세요');
    } catch {
      document.getElementById('backup').value = data;
      toast('아래 칸의 내용을 직접 복사해 주세요');
    }
  };
  document.getElementById('import').onclick = () => {
    try {
      importAll(document.getElementById('backup').value);
      toast('복원했어요');
      statsView();
    } catch {
      toast('백업 형식이 올바르지 않아요');
    }
  };
}

/** 깔끔한 눈금 최댓값 (5, 10, 20, 50, 100 …) */
function niceMax(v) {
  const steps = [5, 10, 20, 30, 40, 50, 80, 100, 150, 200];
  return steps.find((s) => s >= v) || Math.ceil(v / 100) * 100;
}

/**
 * 한 종목의 점수 추이 선 그래프 (SVG, 실제 픽셀 크기로 그림).
 * 누르거나 손가락으로 훑으면 가장 가까운 기록을 위 글자로 보여 줘요.
 */
function drawTrend(box, readout, list, mode) {
  const unit = UNITS[mode];
  const W = box.clientWidth || 300;
  const H = 132;
  const pad = { l: 30, r: 10, t: 10, b: 20 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = mode === 'nback' ? Math.max(4, ...list.map((h) => value(mode, h))) : niceMax(Math.max(...list.map((h) => value(mode, h)), 1));
  const n = list.length;

  const x = (i) => pad.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v) => pad.t + ih - (v / max) * ih;
  const pts = list.map((h, i) => [x(i), y(value(mode, h))]);

  const ticks = mode === 'nback' ? [1, Math.round((1 + max) / 2), max] : [0, max / 2, max];
  const grid = ticks.map((v) => `
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/>
    <text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end" class="axis">${v}</text>`).join('');

  const [lx, ly] = pts[n - 1];
  box.innerHTML = `
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="최근 ${n}번 점수 추이">
      ${grid}
      <text x="${pad.l}" y="${H - 4}" class="axis">${n > 1 ? `처음` : ''}</text>
      <text x="${W - pad.r}" y="${H - 4}" text-anchor="end" class="axis">최근</text>
      ${n > 1 ? `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" class="line"/>` : ''}
      <line class="cross" y1="${pad.t}" y2="${pad.t + ih}" visibility="hidden"/>
      <circle class="dot" cx="${lx}" cy="${ly}" r="4"/>
      <rect x="0" y="0" width="${W}" height="${H}" fill="transparent"/>
    </svg>`;

  const svg = box.querySelector('svg');
  const cross = svg.querySelector('.cross');
  const dot = svg.querySelector('.dot');

  const show = (i, active) => {
    const h = list[i];
    const [px, py] = pts[i];
    dot.setAttribute('cx', px);
    dot.setAttribute('cy', py);
    cross.setAttribute('x1', px);
    cross.setAttribute('x2', px);
    cross.setAttribute('visibility', active ? 'visible' : 'hidden');
    const when = esc(h.day || String(h.at).slice(0, 10));
    const time = h.seconds != null ? ` · ${fmtTime(h.seconds)}` : '';
    const val = mode === 'nback'
      ? `<b>${esc(h.n)}백</b> · 맞힌 비율 ${esc(h.score)}%`
      : `<b>${esc(h.score)}</b>/${esc(h.total)}${unit}`;
    readout.innerHTML = `${active ? when : '최근'} ${val}${time}`;
  };
  const pick = (e) => {
    const r = svg.getBoundingClientRect();
    const px = e.clientX - r.left;
    const i = n === 1 ? 0 : Math.round(((px - pad.l) / iw) * (n - 1));
    show(Math.max(0, Math.min(n - 1, i)), true);
  };
  svg.addEventListener('pointerdown', pick);
  svg.addEventListener('pointermove', pick);
  svg.addEventListener('pointerleave', () => show(n - 1, false));
  show(n - 1, false);
}
