import { render, setTopbar } from '../ui.js';

export function learnView() {
  setTopbar('');
  render(`
    <h1>기법 배우기</h1>
    <p class="muted">기억력 선수들은 타고난 게 아니라 아래 기법을 연습한 사람들이에요. 지능이 오르는 건 아니고, 외우는 기술이 느는 거예요.</p>

    <section class="card">
      <h2 style="margin-top:0">1. 기억의 궁전 (장소법)</h2>
      <p>우리 집처럼 잘 아는 장소에 <b>순서대로 자리</b>를 정해 두고, 외울 것을 그 자리에 하나씩 <b>이상한 장면</b>으로 놓아요.</p>
      <p class="muted">예) 현관에 거대한 <b>펭귄</b>이 신발을 신고 있음 → 신발장 위에서 <b>피자</b>가 녹아내림 → …</p>
      <p>떠올릴 때는 궁전을 다시 걸어가며 자리마다 뭐가 있었는지 보면 돼요.</p>
      <a class="btn secondary" href="#/palace">내 궁전 만들기 →</a>
    </section>

    <section class="card">
      <h2 style="margin-top:0">2. 장면을 강하게 만드는 법</h2>
      <ul>
        <li><b>크게</b> 또는 아주 작게</li>
        <li><b>움직이게</b> (부수고, 터지고, 날아다니고)</li>
        <li><b>감각</b>을 넣기 (냄새, 소리, 촉감)</li>
        <li>자리와 <b>부딪히게</b> 하기 (그냥 옆에 두지 말기)</li>
      </ul>
    </section>

    <section class="card">
      <h2 style="margin-top:0">3. 숫자 → 이미지</h2>
      <p>숫자는 그림이 안 그려져서 어려워요. 그래서 숫자를 자음으로 바꿔요.</p>
      <table>
        <tr><th>숫자</th><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>0</td></tr>
        <tr><th>자음</th><td>ㄱ</td><td>ㄴ</td><td>ㄷ</td><td>ㄹ</td><td>ㅁ</td><td>ㅂ</td><td>ㅅ</td><td>ㅇ</td><td>ㅈ</td><td>ㅊ</td></tr>
      </table>
      <p>두 자리씩 끊어서, 앞 두 글자의 자음이 맞는 단어로 바꿔요.<br/>
      <b>45</b> → ㄹㅁ → <b>라면</b>, <b>12</b> → ㄱㄴ → <b>그네</b></p>
      <p class="muted">"4512"는 궁전 첫 자리에 라면, 둘째 자리에 그네. 00~99를 외워 두면 어떤 숫자든 그림이 돼요.</p>
      <a class="btn secondary" href="#/dictionary">숫자 사전 보기 →</a>
    </section>

    <section class="card">
      <h2 style="margin-top:0">4. 추천 순서 (40일)</h2>
      <ol>
        <li><b>1주차</b>: 궁전 1개(10곳) 만들기 → 단어 10개</li>
        <li><b>2~3주차</b>: 숫자 사전 00~99 익히기 (하루 20개씩) + 숫자 훈련</li>
        <li><b>4주차</b>: 궁전 20곳 이상으로 늘리기, 단어 20~30개</li>
        <li><b>5~6주차</b>: 카드 (카드마다 이미지 정하기), 시간 줄이기</li>
      </ol>
      <p class="muted">하루 30분씩 40일 훈련한 일반인이 단어 기억량을 두 배 넘게 늘린 연구(Dresler 외, 2017)를 참고한 순서예요.</p>
      <a class="btn secondary" href="#/plan">하루 단위 40일 과정 보기 →</a>
    </section>
  `);
}
