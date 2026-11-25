// 단계 도전: 종목마다 '세계' 하나, 세계마다 10단계.
// 단계 설정은 설정 화면을 거치지 않고 바로 훈련에 들어가요. (선택지에 없는 값도 됨)
//
// 별: 맞힌 비율이 thresholds[0] 이상이면 ★, [1] 이상 ★★, [2] 이상 ★★★
// 별을 1개라도 받으면 다음 단계가 열려요.

const W = (count, seconds, kind = 'concrete') => ({ count, seconds, kind });
const N = (digits, seconds, hints = false) => ({ digits, seconds, hints });
const C = (count, seconds) => ({ count, seconds });
const I = (count, seconds) => ({ count, seconds });
const D = (range, direction, count, limit = 0) => ({ range, direction, count, limit });
const B = (n, speed) => ({ n, speed, auto: false });

export const WORLDS = [
  {
    id: 'words',
    mode: 'words',
    name: '단어의 서재',
    icon: '📝',
    color: '#e0603f',
    story: '책장 사이에 흩어진 단어를 궁전 자리에 하나씩 놓아요.',
    thresholds: [0.6, 0.8, 1],
    stages: [
      W(5, 120), W(8, 120), W(10, 150), W(10, 90), W(15, 150),
      W(20, 180), W(20, 120, 'mixed'), W(25, 180, 'mixed'), W(30, 180, 'mixed'), W(40, 240, 'mixed'),
    ],
  },
  {
    id: 'numbers',
    mode: 'numbers',
    name: '숫자의 탑',
    icon: '🔢',
    color: '#1f9d8b',
    story: '층마다 숫자가 늘어나요. 두 자리씩 그림으로 바꿔 올라가요.',
    thresholds: [0.6, 0.8, 1],
    stages: [
      N(8, 120, true), N(12, 120, true), N(12, 90), N(16, 120), N(20, 120),
      N(24, 120), N(32, 150), N(40, 180), N(48, 180), N(80, 300),
    ],
  },
  {
    id: 'cards',
    mode: 'cards',
    name: '카드의 정원',
    icon: '🃏',
    color: '#7c4dcc',
    story: '정원 길을 따라 놓인 카드의 순서를 기억해요. 마지막엔 한 벌 전부!',
    thresholds: [0.6, 0.8, 1],
    stages: [
      C(4, 90), C(6, 90), C(8, 120), C(10, 120), C(13, 150),
      C(16, 180), C(20, 180), C(26, 300), C(39, 420), C(52, 600),
    ],
  },
  {
    id: 'images',
    mode: 'images',
    name: '그림의 회랑',
    icon: '🖼️',
    color: '#d98a1c',
    story: '회랑에 걸린 그림들. 다섯 개씩 이야기로 엮어 순서를 지켜요.',
    thresholds: [0.6, 0.8, 1],
    stages: [
      I(5, 60), I(10, 90), I(10, 60), I(15, 90), I(20, 120),
      I(20, 90), I(25, 120), I(30, 120), I(40, 150), I(50, 180),
    ],
  },
  {
    id: 'numdrill',
    mode: 'numdrill',
    name: '번개 사전',
    icon: '⚡',
    color: '#2f6fe0',
    story: '숫자를 보면 그림이 번개처럼! 높은 단계는 문제마다 제한 시간이 있어요.',
    thresholds: [0.7, 0.85, 1],
    stages: [
      D('r0', 'n2w', 10), D('r0', 'mixed', 20, 5), D('r1', 'mixed', 20, 5), D('r2', 'mixed', 20, 4), D('r3', 'mixed', 20, 4),
      D('r4', 'mixed', 20, 4), D('all', 'mixed', 20, 3), D('all', 'w2n', 30, 3), D('all', 'mixed', 40, 2.5), D('all', 'mixed', 40, 2),
    ],
  },
  {
    id: 'nback',
    mode: 'nback',
    name: '거울의 방',
    icon: '🧠',
    color: '#c43c83',
    story: '거울 속 N번 전의 나와 비교해요. 단계가 오를수록 더 멀리 기억해야 해요.',
    thresholds: [0.7, 0.85, 0.95],
    stages: [
      B(1, 3000), B(2, 3500), B(2, 3000), B(3, 3500), B(3, 3000),
      B(3, 2500), B(4, 3000), B(4, 2500), B(5, 3000), B(6, 3000),
    ],
  },
];

export const STAGES_PER_WORLD = 10;
export const MAX_STARS = WORLDS.length * STAGES_PER_WORLD * 3;

export function worldById(id) {
  return WORLDS.find((w) => w.id === id);
}

const RANGE_LABEL = { all: '00~99', r0: '00~19', r1: '20~39', r2: '40~59', r3: '60~79', r4: '80~99' };
const DIR_LABEL = { n2w: '숫자→그림', w2n: '그림→숫자', mixed: '섞어서' };
const fmt = (sec) => (sec % 60 ? `${Math.floor(sec / 60)}분 ${sec % 60}초` : `${sec / 60}분`).replace(/^0분 /, '');

/** 단계 설명 한 줄 (예: "단어 10개 · 1분 30초") */
export function stageText(world, s) {
  switch (world.mode) {
    case 'words': return `단어 ${s.count}개 · ${fmt(s.seconds)}${s.kind === 'mixed' ? ' · 추상어 섞임' : ''}`;
    case 'numbers': return `숫자 ${s.digits}자리 · ${fmt(s.seconds)}${s.hints ? ' · 그림 힌트' : ''}`;
    case 'cards': return `카드 ${s.count}장 · ${fmt(s.seconds)}`;
    case 'images': return `그림 ${s.count}개 · ${fmt(s.seconds)}`;
    case 'numdrill': return `${RANGE_LABEL[s.range]} · ${DIR_LABEL[s.direction]} · ${s.count}문제${s.limit ? ` · 문제당 ${s.limit}초` : ''}`;
    case 'nback': return `${s.n}백 · ${s.speed / 1000}초 간격`;
    default: return '';
  }
}
