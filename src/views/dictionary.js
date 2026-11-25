import { render, setTopbar, toast, esc } from '../ui.js';
import { getNumberOverrides, setNumberOverrides } from '../storage.js';
import { numberImages, consonantHint, DEFAULT_NUMBER_IMAGES } from '../data/number-images.js';

export function dictionaryView() {
  setTopbar('');
  const overrides = getNumberOverrides();
  const dict = numberImages(overrides);
  const keys = Object.keys(DEFAULT_NUMBER_IMAGES);

  render(`
    <h1>숫자 사전</h1>
    <p class="muted">1=ㄱ 2=ㄴ 3=ㄷ 4=ㄹ 5=ㅁ 6=ㅂ 7=ㅅ 8=ㅇ 9=ㅈ 0=ㅊ<br/>
    마음에 안 드는 단어는 눌러서 내 단어로 바꾸세요. <b>내가 정한 이미지</b>가 제일 잘 기억나요.</p>

    <section class="card stack">
      <label for="num">바꿀 숫자</label>
      <div class="row">
        <select id="num">${keys.map((k) => `<option>${k}</option>`).join('')}</select>
        <input id="word" placeholder="새 단어" />
      </div>
      <div class="muted" id="hint"></div>
      <div class="row">
        <button id="save">바꾸기</button>
        <button id="reset" class="secondary">기본값으로</button>
      </div>
    </section>

    <div class="dict-grid">
      ${keys.map((k) => `<div data-k="${k}"><b>${k}</b>${esc(dict[k])}${overrides[k] ? ' ✏️' : ''}</div>`).join('')}
    </div>
  `);

  const sel = document.getElementById('num');
  const word = document.getElementById('word');
  const hint = document.getElementById('hint');
  const updateHint = () => {
    const k = sel.value;
    hint.textContent = `${k} = ${consonantHint(k)} · 지금: ${dict[k]} (기본: ${DEFAULT_NUMBER_IMAGES[k]})`;
    word.value = '';
  };
  sel.onchange = updateHint;
  updateHint();

  document.querySelectorAll('.dict-grid div').forEach((el) => {
    el.onclick = () => {
      sel.value = el.dataset.k;
      updateHint();
      word.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });

  document.getElementById('save').onclick = () => {
    const w = word.value.trim();
    if (!w) return toast('단어를 입력해 주세요');
    const next = { ...getNumberOverrides(), [sel.value]: w };
    setNumberOverrides(next);
    toast(`${sel.value} → ${w}`);
    dictionaryView();
  };
  document.getElementById('reset').onclick = () => {
    const next = { ...getNumberOverrides() };
    delete next[sel.value];
    setNumberOverrides(next);
    dictionaryView();
  };
}
