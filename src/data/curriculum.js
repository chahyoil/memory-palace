// 40일 커리큘럼 (docs/TECHNIQUES.md, '기법 배우기' 화면의 추천 순서를 하루 단위로 나눈 것)
//
// 하루 = 할 일 1~3개. 할 일 종류:
//   { mode: 'words' | 'numbers' | 'cards' | 'numdrill', settings }  → 그 설정으로 훈련 화면 열기
//   { palace: n }                                                   → 궁전에 n곳 이상 만들기
// settings 값은 각 훈련 화면의 선택지 안에 있는 값만 써야 해요.

const W = (count, seconds, kind = 'concrete') => ({ mode: 'words', settings: { count, seconds, kind } });
const N = (digits, seconds, hints = true) => ({ mode: 'numbers', settings: { digits, seconds, hints } });
const C = (count, seconds) => ({ mode: 'cards', settings: { count, seconds } });
const D = (range, direction = 'mixed', count = 20) => ({ mode: 'numdrill', settings: { range, direction, count } });
const P = (n) => ({ palace: n });

export const WEEKS = [
  { from: 1, to: 7, title: '1주차: 궁전과 단어', tip: '궁전 1개(10곳)를 만들고 단어를 장면으로 놓는 데 익숙해져요.' },
  { from: 8, to: 21, title: '2~3주차: 숫자 사전', tip: '하루 20개씩 00~99 이미지를 익히고, 숫자 훈련으로 써 봐요.' },
  { from: 22, to: 28, title: '4주차: 궁전 늘리기', tip: '궁전을 20곳 이상으로 늘리고 단어 20~30개, 추상어도 섞어 봐요.' },
  { from: 29, to: 40, title: '5~6주차: 카드와 속도', tip: '카드마다 이미지를 정하고, 외우는 시간을 줄여 가요.' },
];

// index 0 = 1일차
export const DAYS = [
  /* 1 */ [P(10), W(5, 180)],
  /* 2 */ [W(10, 300)],
  /* 3 */ [W(10, 180)],
  /* 4 */ [W(10, 180)],
  /* 5 */ [W(10, 120)],
  /* 6 */ [W(15, 180)],
  /* 7 */ [W(15, 120)],
  /* 8 */ [D('r0', 'n2w'), N(8, 120)],
  /* 9 */ [D('r0'), N(8, 120)],
  /* 10 */ [D('r1', 'n2w'), N(8, 120)],
  /* 11 */ [D('r1'), N(12, 180)],
  /* 12 */ [D('r2', 'n2w'), N(12, 180)],
  /* 13 */ [D('r2'), N(12, 120)],
  /* 14 */ [D('r3', 'n2w'), W(15, 120)],
  /* 15 */ [D('r3'), N(12, 120)],
  /* 16 */ [D('r4', 'n2w'), N(20, 180)],
  /* 17 */ [D('r4'), N(20, 180)],
  /* 18 */ [D('all', 'mixed', 40), N(20, 180, false)],
  /* 19 */ [D('all', 'w2n', 40), N(20, 120, false)],
  /* 20 */ [D('all', 'mixed', 40), N(20, 120, false)],
  /* 21 */ [D('all', 'mixed', 40), N(40, 300, false)],
  /* 22 */ [P(20), W(20, 300)],
  /* 23 */ [W(20, 300)],
  /* 24 */ [W(20, 180), D('all', 'mixed', 20)],
  /* 25 */ [W(20, 300, 'mixed')],
  /* 26 */ [W(30, 600), D('all', 'mixed', 20)],
  /* 27 */ [W(30, 300, 'mixed'), N(40, 300, false)],
  /* 28 */ [W(30, 300), N(40, 180, false)],
  /* 29 */ [C(5, 180)],
  /* 30 */ [C(10, 300)],
  /* 31 */ [C(10, 180)],
  /* 32 */ [C(10, 120), D('all', 'mixed', 20)],
  /* 33 */ [C(20, 300)],
  /* 34 */ [C(20, 300), N(40, 180, false)],
  /* 35 */ [C(20, 180)],
  /* 36 */ [C(26, 600)],
  /* 37 */ [C(26, 300), W(30, 180, 'mixed')],
  /* 38 */ [C(26, 300)],
  /* 39 */ [C(52, 600)],
  /* 40 */ [W(30, 180, 'mixed'), N(40, 180, false), C(52, 600)],
];

export function weekOf(day) {
  return WEEKS.find((w) => day >= w.from && day <= w.to) || WEEKS[WEEKS.length - 1];
}
