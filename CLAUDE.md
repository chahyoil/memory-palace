# 프로젝트 안내 (AI 코딩 도우미용)

- 개인용 안드로이드 PWA. 빌드 도구/프레임워크 없이 순수 JS(ES 모듈) + CSS. 의존성 추가는 꼭 필요할 때만.
- UI 문구는 모두 한국어, 쉬운 말. 모바일 세로 화면 기준 (최대 폭 560px).
- 화면 = `render(html)` 로 `#app` 을 통째로 다시 그리는 방식. 사용자 입력 문자열은 반드시 `esc()` 로 감싸기.
- 라우팅: `src/app.js` 의 `route()`. 타이머를 쓰는 화면은 `onLeave()` 로 정리 함수 등록.
- 저장: `src/storage.js` 만 통해서. 키 접두사 `mp:`.
- 새 JS 파일을 만들면 `sw.js` 의 `ASSETS` 에 추가하고, 배포 전 `CACHE_VERSION` 올리기.
- 검사: `npm run check`. 실행: `npm run dev` → http://localhost:5173
- 기획/할 일: `docs/PLAN.md`, `docs/ROADMAP.md`. 기법 설명: `docs/TECHNIQUES.md`.
- "지능이 오른다", "치매 예방" 같은 효과 주장은 쓰지 않기 (`docs/RESEARCH.md`).
