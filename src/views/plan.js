// 40일 과정: 오늘의 훈련 추천 + 전체 일정
import { render, setTopbar, toast, esc, fmtTime } from '../ui.js';
import { go } from '../router.js';
import { getSettings, setSettings, getPalaces, planDay, restartPlan, didToday } from '../storage.js';
import { DAYS, WEEKS, weekOf } from '../data/curriculum.js';

const RANGE_LABEL = { all: '00~99', r0: '00~19', r1: '20~39', r2: '40~59', r3: '60~79', r4: '80~99' };
const DIR_LABEL = { n2w: '숫자→이미지', w2n: '이미지→숫자', mixed: '섞어서' };
const KIND_LABEL = { concrete: '', mixed: ' · 추상어 섞기', abstract: ' · 추상어' };

export const TOTAL_DAYS = DAYS.length;

function taskText(t) {
  if (t.palace) return `🏛️ 궁전에 장소 ${t.palace}곳 이상 만들기`;
  const s = t.settings;
  switch (t.mode) {
    case 'words': return `📝 단어 ${s.count}개 · ${fmtTime(s.seconds)}${KIND_LABEL[s.kind] || ''}`;
    case 'numbers': return `🔢 숫자 ${s.digits}자리 · ${fmtTime(s.seconds)} · 힌트 ${s.hints ? '켬' : '끔'}`;
    case 'cards': return `🃏 카드 ${s.count}장 · ${fmtTime(s.seconds)}`;
    case 'numdrill': return `⚡ 숫자 사전 ${RANGE_LABEL[s.range]} · ${DIR_LABEL[s.direction]} · ${s.count}문제`;
    default: return '';
  }
}

function taskDone(t) {
  if (t.palace) return getPalaces().some((p) => p.loci.length >= t.palace);
  return didToday(t.mode);
}

/** 할 일 버튼 목록. withDone: 오늘 한 건 ✓ 표시 */
function tasksHtml(day, withDone) {
  return `<div class="task-list">
    ${DAYS[day - 1].map((t, i) => {
      const done = withDone && taskDone(t);
      return `<button class="${done ? 'done' : ''}" data-day="${day}" data-i="${i}">
        <span>${esc(taskText(t))}</span><span>${done ? '✓' : '›'}</span>
      </button>`;
    }).join('')}
  </div>`;
}

/** render() 뒤에 호출: 할 일 버튼을 누르면 그 설정으로 훈련 화면 열기 */
function bindTasks() {
  document.querySelectorAll('.task-list button').forEach((b) => {
    b.onclick = () => {
      const t = DAYS[+b.dataset.day - 1][+b.dataset.i];
      if (t.palace) return go('/palace');
      setSettings(t.mode, { ...getSettings(t.mode, {}), ...t.settings });
      go('/' + t.mode);
    };
  });
}

/** 홈 화면 맨 위에 들어가는 '오늘의 훈련' 카드 */
export function todayCardHtml() {
  const day = planDay();
  if (day > TOTAL_DAYS) {
    return `
      <section class="card">
        <h2 style="margin-top:0">🎉 40일 과정을 마쳤어요</h2>
        <p class="muted">이제 기록 화면에서 약한 종목을 찾아 자유롭게 훈련하세요.</p>
        <a class="btn secondary" href="#/plan" style="width:100%">과정 다시 보기</a>
      </section>`;
  }
  const week = weekOf(day);
  return `
    <section class="card">
      <div class="row" style="align-items:baseline">
        <h2 style="margin:0">오늘의 훈련</h2>
        <span class="muted" style="flex:0 0 auto">${day}일차 / ${TOTAL_DAYS}</span>
      </div>
      <p class="muted" style="margin:4px 0 10px">${esc(week.title)}</p>
      ${tasksHtml(day, true)}
      <a href="#/plan" class="muted" style="display:block;margin-top:10px">전체 과정 보기 →</a>
    </section>`;
}
export const bindTodayCard = bindTasks;

/** #/plan 화면. selected: 펼쳐 볼 날 */
export function planView(selected) {
  setTopbar('');
  const today = planDay();
  const open = selected || Math.min(today, TOTAL_DAYS);

  render(`
    <h1>40일 과정</h1>
    <p class="muted">하루 10~30분. 훈련한 날에만 다음 날로 넘어가요. 하루 쉬어도 건너뛰지 않아요. 지금 <b>${today > TOTAL_DAYS ? '완주' : today + '일차'}</b>예요.</p>

    ${WEEKS.map((w) => `
      <section class="card">
        <h2 style="margin-top:0">${esc(w.title)}</h2>
        <p class="muted" style="margin-top:0">${esc(w.tip)}</p>
        <div class="day-grid">
          ${range(w.from, w.to).map((d) => `
            <button data-d="${d}" class="${d === open ? 'open' : ''} ${d < today ? 'past' : ''} ${d === today ? 'today' : ''}">${d}</button>`).join('')}
        </div>
        ${open >= w.from && open <= w.to ? `
          <p style="margin:12px 0 6px"><b>${open}일차</b>${open === today ? ' (오늘)' : ''}</p>
          ${tasksHtml(open, open === today)}` : ''}
      </section>`).join('')}

    <section class="card stack">
      <p class="muted" style="margin:0">예전에 훈련한 기록이 있어서 날짜가 안 맞으면, 1일차부터 다시 시작할 수 있어요. 기록은 지워지지 않아요.</p>
      <button id="restart" class="secondary">1일차부터 다시 시작</button>
    </section>
  `);

  document.querySelectorAll('.day-grid button').forEach((b) => {
    b.onclick = () => planView(+b.dataset.d);
  });
  bindTasks();

  const btn = document.getElementById('restart');
  let armed = false;
  btn.onclick = () => {
    if (!armed) {
      armed = true;
      btn.textContent = '한 번 더 누르면 1일차로 돌아가요';
      return;
    }
    restartPlan();
    toast('1일차부터 다시 시작해요');
    planView();
  };
}

function range(a, b) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}
