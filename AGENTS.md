# AGENTS.md

dropkeeper 저장소에서 작업하는 사람과 AI 에이전트를 위한 안내입니다.

## 프로젝트

스트리밍 플랫폼 드롭스 보상 코드를 모아 Battle.net에 차례로 등록하는 Chrome(MV3) 확장 프로그램입니다.
지금은 SOOP과 CHZZK 드롭스(오버워치)를 지원합니다.

- 스택: WXT, TypeScript, React, Tailwind CSS v4, pnpm
- 백엔드 없음. 상태는 모두 `chrome.storage.local`에 저장
- 사용자의 메인 브라우저는 Brave(Chromium)

```bash
pnpm install
pnpm dev       # 개발 모드
pnpm build     # .output/chrome-mv3
pnpm compile   # 타입 검사
```

## 코드 원칙

- **플랫폼 코드는 `src/lib/sources/<플랫폼>.ts`에만 둔다.** 팝업, 저장소, 작업 실행기는 `SourceId`만 보고 동작해야 한다. 새 플랫폼을 추가하는 순서는 README에 있다.
- 플랫폼 API는 해당 사이트 탭의 content script에서 호출한다. 그래야 로그인 쿠키가 1st-party로 붙는다. 쿠키 값을 직접 읽거나 저장하지 않는다.
- 저장소(`src/lib/storage.ts`) 쓰기는 background에서만 한다. popup은 `sendToBackground`로 요청한다. 쓰기 순서 보장이 실행 환경마다 따로 동작하기 때문이다.
- React와 Tailwind는 팝업에서만 쓴다. content script는 순수 TypeScript로 작성한다.
- 유효기간이 지난 보상은 목록, 대기열, 통계 어디에도 보여 주지 않는다 (`src/lib/expiry.ts`).
- Battle.net 등록 흐름은 `key-claim?keyCode=` → `preload/<base64>`(자동 POST)까지 버튼 없이 리다이렉트로 진행된다. 그다음 오류면 `key-lookup/<base64>` 결과 페이지, 유효한 코드면 `confirm-key-claim/<base64>` 확인 페이지로 간다. 확인 페이지의 "확인" 버튼(`form#submit-key-claim`)은 같은 주소로 csrftoken을 POST한다. 두 페이지 주소 모두 `kc|<조회마다 바뀌는 식별자>|<코드>`가 base64로 들어 있다.
- 오류 배너(`.error-notification-banner-content`, 예: "이미 등록된 코드입니다.")는 실제 화면으로 확인했다. 유효한 코드의 확인 페이지와 "확인" 버튼도 실제 화면으로 확인했다. "확인"을 누른 뒤의 성공 문구 패턴(`src/lib/redeem/battlenet/page.ts`)은 아직 추정값이다.
- CAPTCHA나 봇 탐지는 우회하지 않는다. 감지되면 일시정지하고 사용자에게 맡긴다.

## 커밋 규칙

### 형식

```
<이모지> <타입>(<스코프>): <메시지>
```

- 이모지, 타입, 메시지 사이는 **띄어쓰기 한 칸**이다. 스코프 괄호는 타입에 붙여 쓴다.
- 이모지는 **[gitmoji.dev](https://gitmoji.dev)에 있는 것만** 쓴다. 이모지 문자 그대로 적고 `:sparkles:` 같은 코드는 쓰지 않는다.
- 타입은 이모지와 뜻이 맞는 것을 아래 표에서 고른다.

### 스코프

변경이 **한 플랫폼에만** 해당할 때만 붙인다. 그 밖에는 스코프 없이 `<이모지> <타입>: <메시지>`로 쓴다.

| 스코프 | 대상 |
|---|---|
| `soop` | SOOP 드롭스 연동 |
| `chzzk` | CHZZK 드롭스 연동 |
| `battlenet` | Battle.net 코드 등록 |

`core`, `popup`, `config`, `readme` 같은 스코프는 쓰지 않는다.

### 이모지와 타입

| 이모지 | 타입 | 쓰는 경우 |
|---|---|---|
| 🎉 | `chore` | 프로젝트 시작 |
| ✨ | `feat` | 새 기능 |
| 💄 | `feat` | UI·스타일 추가 및 변경 |
| 🐛 | `fix` | 버그 수정 |
| 🚑️ | `fix` | 급한 수정 |
| ♻️ | `refactor` | 동작 변화 없는 리팩터링 |
| 🎨 | `style` | 코드 포맷·구조 정리 |
| ⚡️ | `perf` | 성능 개선 |
| 🔥 | `chore` | 코드·파일 삭제 |
| 📝 | `docs` | 문서 |
| 🔧 | `chore` | 설정 파일 |
| 🙈 | `chore` | `.gitignore` |
| 🍱 | `chore` | 아이콘·이미지 등 에셋 |
| ➕ | `build` | 의존성 추가 |
| ➖ | `build` | 의존성 제거 |
| ⬆️ | `build` | 의존성 업그레이드 |
| ✅ | `test` | 테스트 |
| 👷 | `ci` | CI |
| 🔖 | `chore` | 릴리스·버전 태그 |
| ⏪️ | `revert` | 되돌리기 |

### 메시지

- 한국어로, "~ 추가", "~ 수정"처럼 짧게 끝내고 마침표는 붙이지 않는다.
- 제목은 50자 안팎으로 쓴다. 설명이 더 필요하면 빈 줄 하나 뒤에 본문을 `- ` 목록으로 적는다.
- 커밋 하나에는 논리적인 변경 하나만 담는다.

### 예시

```
✨ feat(soop): 드롭스 목록 불러오기와 코드 추출
🐛 fix(battlenet): 이미 사용된 코드 문구 판별 수정
✨ feat(chzzk): CHZZK 드롭스 인벤토리 연동
💄 feat: 등록 결과 화면에 실패 이유 표시
♻️ refactor: 작업 실행기 대기 로직 분리
🔧 chore: 확장 manifest 권한 정리
📝 docs: README에 Brave 설치 방법 추가
```
