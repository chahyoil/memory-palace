# 🏛️ 기억의 궁전 (memory-palace)

세계 기억력 대회 선수들이 쓰는 기법(**기억의 궁전**, **숫자→이미지 변환**)을 안드로이드 폰에서 혼자 연습하려고 만든 개인용 훈련 앱이에요.

- 빌드 도구 없이 **HTML + CSS + 순수 JavaScript(ES 모듈)** 로만 되어 있어요.
- **PWA**라서 폰 홈 화면에 설치하면 앱처럼 열리고, 한 번 열고 나면 오프라인에서도 돼요.
- 기록은 전부 폰 브라우저(localStorage)에만 저장돼요. 서버 없음.

> 이 훈련은 **지능을 올려 주는 게 아니라 외우는 기술을 늘려 줘요.** 자세한 배경은 [docs/RESEARCH.md](docs/RESEARCH.md)를 보세요.

## 지금 들어 있는 기능 (v0.2)

| 화면 | 내용 |
|---|---|
| 🗓️ 오늘의 훈련 | 40일 과정에서 오늘 할 훈련 추천 (누르면 설정이 채워진 채로 열림) |
| 📝 단어 | 무작위 단어 N개를 하나씩 보며 외우고, 같은 순서로 적기 (구체어 / 섞어서 / 추상어) |
| 🔢 숫자 | 무작위 숫자를 궁전 한 자리에 4개씩 외우고 적기 (이미지 힌트 켜고 끄기) |
| 🃏 카드 | 섞인 트럼프 카드 순서 외우고 52장 중에서 순서대로 고르기 |
| 🖼️ 이미지 순서 | 그림 5개씩 한 줄, 순서 외우고 섞인 줄에서 원래 순서대로 누르기 |
| ⚡ 숫자 사전 훈련 | 00~99 ↔ 이미지 4지선다 반사 훈련 |
| 🧠 듀얼 N백 | 칸 위치 + 글자 소리를 N번 전과 비교하는 작업 기억 훈련 (단계 자동 조정) |
| ⏱️ 1분 도전 | 외우는 시간 1분 고정 시합, 끝나면 내 최고 기록과 비교 |
| 🏛️ 내 궁전 | 궁전 여러 개. 훈련마다 고르기, 최근 24시간 안에 쓴 궁전이면 경고 |
| 📖 숫자 사전 | 기본 00~99 이미지 보기, 내 단어로 바꾸기 |
| 📈 기록 | 종목별 점수 추이 그래프, 연속 훈련일, 백업/복원 (복사·붙여넣기) |

## 실행하기 (PC, VS Code)

Node.js만 있으면 돼요. 설치할 패키지는 없어요.

```bash
npm run dev        # http://localhost:5173
npm run check      # JS 문법 검사 + sw.js 캐시 목록 확인
```

또는 VS Code 추천 확장 **Live Server**로 `index.html`을 열어도 돼요.

> `index.html`을 더블클릭해서(file://) 열면 ES 모듈이 막혀서 안 떠요. 꼭 로컬 서버로 여세요.

### 폰에서 바로 확인하기 (같은 와이파이)

```bash
npm run dev:lan
```

PC의 IP(예: `192.168.0.10`)를 확인해서 폰 크롬에서 `http://192.168.0.10:5173` 으로 열어요.
이 방식은 http라서 **오프라인 기능과 '앱 설치'는 안 되고**, 화면 확인용이에요.

## 안드로이드에 설치하기

### 방법 A. GitHub Pages + PWA 설치 (추천, 가장 간단)

1. GitHub에 비공개/공개 저장소를 만들어 이 폴더를 올려요.
2. 저장소 **Settings → Pages → Branch: main / (root)** 로 켜요.
3. 폰 크롬에서 `https://<아이디>.github.io/memory-palace/` 를 열고
   메뉴(⋮) → **홈 화면에 추가 / 앱 설치**.
4. 이후엔 홈 화면 아이콘으로 열면 오프라인에서도 동작해요.

> 코드를 고친 뒤 폰에 반영하려면 `sw.js`의 `CACHE_VERSION`을 올려 주세요 (`mp-v1` → `mp-v2`). 안 올리면 폰이 예전 캐시를 계속 보여줘요.

### 방법 B. Capacitor로 APK 만들기 (선택)

진짜 APK가 필요할 때만. Android Studio가 있어야 해요.

```bash
npm i -D @capacitor/cli @capacitor/core @capacitor/android
npx cap init "기억의 궁전" com.example.memorypalace --web-dir .
npx cap add android
npx cap sync android
npx cap open android      # Android Studio에서 ▶ 실행 또는 APK 빌드
```

> `--web-dir .` 은 프로젝트 루트 전체를 앱에 넣어요. 깔끔하게 하려면 나중에 웹 파일을 `www/` 로 옮기고 `--web-dir www` 로 바꾸세요.

## 폴더 구조

```
memory-palace/
├─ index.html              # 진입점
├─ styles.css              # 전체 스타일 (다크 모드 자동)
├─ manifest.webmanifest    # PWA 설정 (이름, 아이콘)
├─ sw.js                   # 오프라인 캐시 (파일 추가하면 ASSETS에도 추가!)
├─ icons/                  # 앱 아이콘
├─ src/
│  ├─ app.js               # 라우트 등록, 서비스 워커 등록
│  ├─ router.js            # 해시 라우터 (#/words 등)
│  ├─ storage.js           # localStorage (궁전, 기록, 설정, 백업)
│  ├─ ui.js                # DOM 헬퍼, 타이머, 셔플, 결과 저장(최고 기록 비교)
│  ├─ palace-picker.js     # 훈련 설정 화면의 궁전 고르기
│  ├─ views/               # 홈, 40일 과정, 기법 배우기, 궁전, 숫자 사전, 기록
│  ├─ modes/               # 훈련 종목: words, numbers, cards, images, numdrill, nback
│  └─ data/                # 단어 목록, 숫자-이미지 사전, 이미지(이모지), 40일 과정
├─ docs/
│  ├─ PLAN.md              # 기획 (목표, 핵심 루프, 종목 설계)
│  ├─ TECHNIQUES.md        # 기법 정리 (장소법, 숫자 자음 시스템, 카드)
│  ├─ ROADMAP.md           # 다음에 할 일
│  └─ RESEARCH.md          # 조사 내용과 출처
└─ scripts/check.mjs       # npm run check
```

## 새 훈련 종목 추가하는 법

결과는 `saveResult()` 로 저장하면 최고 기록 비교가 같이 돼요. 궁전을 쓰는 종목이면 `palace-picker.js` 를 붙여요.

1. `src/modes/새종목.js` 를 만들고 `export function 새종목Mode()` 를 내보내요. (`words.js` 를 복사해서 시작하면 편해요: 설정 → 외우기 → 떠올리기 → 결과)
2. `src/app.js` 에 `route('/새종목', 새종목Mode)` 추가.
3. `src/views/home.js` 의 `MODES` 배열에 메뉴 추가.
4. `sw.js` 의 `ASSETS` 에 파일 경로 추가 → `npm run check` 로 확인.

## 숫자-이미지 규칙 (요약)

`1=ㄱ 2=ㄴ 3=ㄷ 4=ㄹ 5=ㅁ 6=ㅂ 7=ㅅ 8=ㅇ 9=ㅈ 0=ㅊ`
두 자리 숫자 → 앞 두 글자의 첫 자음이 맞는 단어. 예: 45 → ㄹㅁ → **라면**.
전체 목록은 `src/data/number-images.js`, 앱의 '숫자 사전'에서 내 단어로 바꿀 수 있어요.

## VS Code 설정

`_vscode/` 폴더 이름을 `.vscode/` 로 바꾸면 추천 확장(Live Server 등), 에디터 설정, Chrome 디버그 실행 설정이 적용돼요.
