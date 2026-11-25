// 훈련 설정 화면에 들어가는 '궁전 고르기' 부분 (단어·숫자·카드가 같이 씀)
import { esc } from './ui.js';
import { getPalaces, getActivePalace, setActivePalace, markPalaceUsed } from './storage.js';

// 이 시간 안에 다시 쓰면 이전 장면과 섞일 수 있다고 알려 줘요
const RECENT_HOURS = 24;

/** 설정 카드 안에 넣을 HTML */
export function palacePickerHtml() {
  const list = getPalaces();
  if (!list.length) {
    return '<p class="muted" style="margin:0">💡 <a href="#/palace">내 궁전</a>을 만들면 자리 이름이 같이 보여요.</p>';
  }
  const active = getActivePalace();
  return `
    <label for="palace">궁전</label>
    <select id="palace">
      ${list.map((p) => `<option value="${esc(p.id)}" ${p.id === active.id ? 'selected' : ''}>${esc(p.name)} (${p.loci.length}곳)</option>`).join('')}
    </select>
    <div class="muted" id="palace-note"></div>`;
}

/**
 * render() 뒤에 호출. needed() 는 지금 설정으로 필요한 자리 수를 돌려주는 함수.
 * watchIds 의 입력이 바뀌면 안내 문구를 다시 계산해요.
 */
export function bindPalacePicker(needed, watchIds = []) {
  const sel = document.getElementById('palace');
  if (!sel) return;
  const note = document.getElementById('palace-note');

  const update = () => {
    setActivePalace(sel.value);
    const p = getActivePalace();
    const lines = [];
    const n = needed();
    if (p.loci.length < n) {
      lines.push(`자리가 ${n}곳 필요한데 ${p.loci.length}곳이에요. 모자란 자리는 번호로 나와요.`);
    }
    const ago = hoursAgo(p.lastUsed);
    if (ago != null && ago < RECENT_HOURS) {
      const when = agoText(ago);
      lines.push(`⚠️ ${when === '방금' ? when : when + '에'} 쓴 궁전이에요. 이전 장면과 섞일 수 있으니 다른 궁전을 쓰면 더 좋아요.`);
    }
    note.innerHTML = lines.map(esc).join('<br/>');
    note.hidden = !lines.length;
  };

  sel.onchange = update;
  for (const id of watchIds) document.getElementById(id)?.addEventListener('change', update);
  update();
}

/** 외우기를 시작할 때 호출 */
export function usePalace() {
  const p = getActivePalace();
  if (p) markPalaceUsed(p.id);
}

function hoursAgo(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : (Date.now() - t) / 3600000;
}

export function agoText(hours) {
  if (hours < 1 / 60) return '방금';
  if (hours < 1) return `${Math.floor(hours * 60)}분 전`;
  if (hours < 24) return `${Math.floor(hours)}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

/** 궁전 목록 화면에서 쓰는 '마지막 사용' 문구 */
export function lastUsedText(iso) {
  const h = hoursAgo(iso);
  return h == null ? '아직 안 씀' : agoText(h) + ' 사용';
}
