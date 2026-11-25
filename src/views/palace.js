import { render, setTopbar, toast, esc } from '../ui.js';
import { getPalaces, getActivePalace, savePalace, deletePalace, setActivePalace } from '../storage.js';
import { lastUsedText } from '../palace-picker.js';

const EXAMPLE = [
  '현관문', '신발장', '거실 소파', 'TV', '베란다 창문',
  '부엌 냉장고', '가스레인지', '식탁', '화장실 문', '세면대',
];

/** editId: 고칠 궁전 id. 'new' 면 새 궁전, 없으면 지금 쓰는 궁전 */
export function palaceView(editId) {
  setTopbar('');
  const palaces = getPalaces();
  const active = getActivePalace();
  const current = editId === 'new' ? null : palaces.find((p) => p.id === editId) || active;
  const isNew = !current;

  render(`
    <h1>내 궁전</h1>
    <p class="muted">잘 아는 장소를 <b>걸어가는 순서대로</b> 한 줄에 하나씩 적어요. 같은 방에서는 시계 방향처럼 규칙을 정해 두면 좋아요.</p>

    ${palaces.length ? `
      <section class="card">
        <div class="palace-list">
          ${palaces.map((p) => `
            <button data-id="${esc(p.id)}" class="${current && p.id === current.id ? 'selected' : ''}">
              <span><b>${esc(p.name)}</b> · ${p.loci.length}곳${active && p.id === active.id ? ' <span class="locus-tag">훈련에 씀</span>' : ''}</span>
              <span class="muted">${esc(lastUsedText(p.lastUsed))}</span>
            </button>`).join('')}
        </div>
        ${isNew ? '' : '<button id="new" class="secondary" style="width:100%;margin-top:10px">＋ 새 궁전 만들기</button>'}
      </section>` : ''}

    <section class="card stack">
      <h2 style="margin:0">${isNew ? '새 궁전' : '궁전 고치기'}</h2>
      <label for="name">이름</label>
      <input id="name" placeholder="예: 우리 집, 회사, 출근길" value="${esc(current?.name || '')}" />
      <label for="loci">장소 목록 (한 줄 = 한 자리)</label>
      <textarea id="loci" placeholder="${esc(EXAMPLE.join('\n'))}">${esc((current?.loci || []).join('\n'))}</textarea>
      <div class="muted" id="count"></div>
      <div class="row">
        <button id="save">저장</button>
        <button id="example" class="secondary">예시 채우기</button>
      </div>
      ${isNew ? (palaces.length ? '<button id="cancel" class="secondary">취소</button>' : '') : '<button id="delete" class="secondary">이 궁전 지우기</button>'}
    </section>

    <section class="card">
      <h2 style="margin-top:0">팁</h2>
      <ul>
        <li>처음엔 10곳이면 충분해요. 단어 10개를 넣을 수 있어요.</li>
        <li>자리끼리 너무 비슷하면(의자1, 의자2) 헷갈려요.</li>
        <li>집, 학교, 회사, 자주 가는 길… <b>궁전을 여러 개</b> 만들어 돌려 쓰면 이전 장면과 섞이지 않아요.</li>
      </ul>
    </section>
  `);

  const name = document.getElementById('name');
  const ta = document.getElementById('loci');
  const count = document.getElementById('count');
  const parse = () => ta.value.split('\n').map((s) => s.trim()).filter(Boolean);
  const update = () => { count.textContent = `${parse().length}곳`; };
  ta.addEventListener('input', update);
  update();

  document.querySelectorAll('.palace-list button').forEach((b) => {
    b.onclick = () => palaceView(b.dataset.id);
  });
  document.getElementById('new')?.addEventListener('click', () => palaceView('new'));
  document.getElementById('cancel')?.addEventListener('click', () => palaceView());

  document.getElementById('save').onclick = () => {
    const loci = parse();
    if (!loci.length) return toast('장소를 한 곳 이상 적어 주세요');
    const saved = savePalace({
      id: current?.id,
      name: name.value.trim() || current?.name || `궁전 ${palaces.length + 1}`,
      loci,
    });
    if (isNew) setActivePalace(saved.id);
    toast(`'${saved.name}' 장소 ${loci.length}곳 저장했어요`);
    palaceView(saved.id);
  };

  document.getElementById('example').onclick = () => {
    // 적어 둔 내용을 실수로 덮어쓰지 않도록, 비어 있을 때만 채워요
    if (ta.value.trim()) return toast('지금 내용을 지운 뒤 다시 눌러 주세요');
    ta.value = EXAMPLE.join('\n');
    if (!name.value.trim()) name.value = '우리 집';
    update();
  };

  // 지우기는 두 번 눌러야 돼요 (실수 방지)
  const del = document.getElementById('delete');
  if (del) {
    let armed = false;
    del.onclick = () => {
      if (!armed) {
        armed = true;
        del.textContent = '한 번 더 누르면 지워져요';
        del.style.color = 'var(--bad)';
        return;
      }
      deletePalace(current.id);
      toast(`'${current.name}' 궁전을 지웠어요`);
      palaceView();
    };
  }
}
