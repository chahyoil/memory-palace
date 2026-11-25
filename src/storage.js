// localStorage 래퍼. 모든 데이터는 폰(브라우저) 안에만 저장돼요.
const PREFIX = 'mp:';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 공간이 없거나 막힌 경우: 조용히 무시
  }
}

/** 다른 모듈용 일반 읽기/쓰기 (게임 진행: 별, 경험치, 업적 등) */
export function getData(key, fallback) {
  return read(key, fallback);
}
export function setData(key, value) {
  write(key, value);
}

function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // noop
  }
}

/**
 * 궁전 목록: [{ id, name, loci: string[], lastUsed: ISO 문자열 | null }]
 * v0.1 은 궁전 하나(mp:loci)만 있었어요. 처음 읽을 때 첫 궁전으로 옮겨요.
 */
export function getPalaces() {
  let list = read('palaces', null);
  if (!Array.isArray(list)) {
    const old = read('loci', []);
    list = old.length ? [{ id: newId(), name: '내 궁전', loci: old, lastUsed: null }] : [];
    write('palaces', list);
    remove('loci');
  }
  return list;
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** 궁전 저장 (id 가 없으면 새로 만듦). 저장한 궁전을 돌려줘요. */
export function savePalace({ id, name, loci }) {
  const list = getPalaces();
  const found = list.find((p) => p.id === id);
  if (found) {
    found.name = name;
    found.loci = loci;
    write('palaces', list);
    return found;
  }
  const created = { id: newId(), name, loci, lastUsed: null };
  list.push(created);
  write('palaces', list);
  return created;
}

export function deletePalace(id) {
  write('palaces', getPalaces().filter((p) => p.id !== id));
  if (read('activePalace', null) === id) remove('activePalace');
}

/** 훈련에 쓸 궁전 (고른 게 없으면 첫 번째). 궁전이 없으면 null */
export function getActivePalace() {
  const list = getPalaces();
  const id = read('activePalace', null);
  return list.find((p) => p.id === id) || list[0] || null;
}
export function setActivePalace(id) {
  write('activePalace', id);
}

/** 훈련을 시작할 때 호출: 궁전을 마지막으로 쓴 시각 기록 */
export function markPalaceUsed(id) {
  const list = getPalaces();
  const found = list.find((p) => p.id === id);
  if (!found) return;
  found.lastUsed = new Date().toISOString();
  write('palaces', list);
}

/** 지금 훈련에 쓰는 궁전의 장소 목록 (문자열 배열) */
export function getLoci() {
  return getActivePalace()?.loci || [];
}

/** 숫자-이미지 사전: 사용자가 바꾼 항목만 저장 { "07": "청소기" } */
export function getNumberOverrides() {
  return read('numOverrides', {});
}
export function setNumberOverrides(obj) {
  write('numOverrides', obj);
}

/** 기록: { mode, score, total, seconds, settings, at } */
export function getHistory() {
  return read('history', []);
}
export function addHistory(entry) {
  const list = getHistory();
  const now = new Date();
  list.push({ ...entry, at: now.toISOString(), day: localDateKey(now) });
  write('history', list.slice(-500));
}
export function bestScore(mode) {
  const list = getHistory().filter((h) => h.mode === mode);
  if (!list.length) return null;
  return list.reduce((a, b) => (b.score > a.score ? b : a));
}

/** 모드별 마지막 설정 */
export function getSettings(mode, defaults) {
  return { ...defaults, ...read('settings:' + mode, {}) };
}
export function setSettings(mode, value) {
  write('settings:' + mode, value);
}

/** 현지 시간 기준 날짜 키 (YYYY-MM-DD) */
export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 훈련한 날 수와 연속 훈련일 (오늘 아직 안 했으면 어제까지 이어진 연속일) */
export function trainingDays() {
  const days = new Set(getHistory().map((h) => h.day || localDateKey(new Date(h.at))));
  const d = new Date();
  if (!days.has(localDateKey(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(localDateKey(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return { total: days.size, streak, today: days.has(localDateKey()) };
}

/**
 * 40일 과정에서 오늘이 며칠째인지 (훈련한 날 수 기준, 오늘 아직 안 했으면 +1)
 * planStart: '처음부터 다시' 를 눌렀을 때의 훈련한 날 수
 */
export function planDay() {
  const days = trainingDays();
  const start = read('planStart', 0);
  return Math.max(1, days.total - start + (days.today ? 0 : 1));
}
export function restartPlan() {
  const days = trainingDays();
  // 오늘 이미 훈련했으면 오늘이 1일차, 아니면 다음 훈련하는 날이 1일차
  write('planStart', days.today ? days.total - 1 : days.total);
}

/** 오늘 이 종목을 한 번이라도 했는지 */
export function didToday(mode) {
  const today = localDateKey();
  return getHistory().some((h) => h.mode === mode && h.day === today);
}

/** 백업용 전체 내보내기/가져오기 */
export function exportAll() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(PREFIX)) out[k] = localStorage.getItem(k);
  }
  return JSON.stringify(out, null, 2);
}
export function importAll(json) {
  const data = JSON.parse(json);
  if (!data || typeof data !== 'object') throw new Error('형식 오류');
  // v0.1 백업(mp:loci 만 있음)이면, 다음에 읽을 때 궁전 목록으로 다시 옮기도록 비워 둬요
  if (PREFIX + 'loci' in data && !(PREFIX + 'palaces' in data)) remove('palaces');
  for (const [k, v] of Object.entries(data)) {
    if (k.startsWith(PREFIX) && typeof v === 'string') localStorage.setItem(k, v);
  }
}
