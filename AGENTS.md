# AGENTS.md

DropsKeeper 저장소에서 작업하는 사람과 AI 에이전트를 위한 안내입니다.

## 프로젝트

스트리밍 플랫폼 드롭스 보상 코드를 모아 Battle.net에 차례로 등록하는 Chrome(MV3) 확장 프로그램입니다.
지금은 SOOP과 CHZZK 드롭스(오버워치)를 지원합니다.

- 스택: WXT, TypeScript, React, Tailwind CSS v4, pnpm 워크스페이스. 소개 사이트는 Astro
- 백엔드 없음. 상태는 모두 `chrome.storage.local`에 저장
- 사용자의 메인 브라우저는 Brave(Chromium)

pnpm 모노레포다.

| 경로 | 패키지 | 내용 |
|---|---|---|
| `apps/extension` | `@dropskeeper/extension` | 확장 프로그램 (WXT) |
| `apps/site` | `@dropskeeper/site` | 소개 사이트 `dropskeeper.junah.dev` (Astro, GitHub Pages) |
| `packages/legal` | `@dropskeeper/legal` | 개인정보처리방침·이용약관 본문과 스타일. 확장과 사이트가 같이 쓴다 |
| `packages/popup-ui` | `@dropskeeper/popup-ui` | 팝업 화면 부품(색·글꼴 theme.css, 버튼, 목록 행, 진행 머리말 등). 확장 팝업과 사이트의 동작 데모가 같이 쓴다 |

아래 코드 원칙의 `src/...` 경로는 따로 말이 없으면 `apps/extension/src/...`다.

```bash
pnpm install
pnpm dev          # 확장 개발 모드
pnpm build        # 확장 빌드 → apps/extension/.output/chrome-mv3
pnpm compile      # 전체 타입 검사
pnpm site:dev     # 소개 사이트 개발 서버
pnpm site:build   # 소개 사이트 빌드 → apps/site/dist
```

## 코드 원칙

- **플랫폼 코드는 `src/lib/sources/<플랫폼>.ts`에만 둔다.** 팝업, 저장소, 작업 실행기는 `SourceId`만 보고 동작해야 한다. 새 플랫폼을 추가하는 순서는 README에 있다.
- 플랫폼 API는 해당 사이트 탭의 content script에서 호출한다. 그래야 로그인 쿠키가 1st-party로 붙는다. 쿠키 값을 직접 읽거나 저장하지 않는다.
- 저장소(`src/lib/storage.ts`) 쓰기는 background에서만 한다. popup은 `sendToBackground`로 요청한다. 쓰기 순서 보장이 실행 환경마다 따로 동작하기 때문이다.
- 확장에서 React는 확장 페이지(팝업, 개인정보처리방침·이용약관)에서만, Tailwind는 팝업에서만 쓴다. content script는 순수 TypeScript로 작성한다.
- 팝업의 생김새는 `packages/popup-ui/src/`에 둔다. 부품은 문구와 동작을 props로만 받고 확장 API(`browser`, `#i18n`)와 확장 상태를 쓰지 않는다. 확장은 `src/entrypoints/popup/ui.tsx`에서 번역과 설정을 채워 감싸고, `views/*.tsx`는 데이터와 동작만 맡는다. 팝업 화면을 바꾸면 사이트 데모(`apps/site/src/components/demo/DemoPopup.tsx`)도 같은 구성으로 맞춘다.
- 플랫폼 아이콘은 `packages/popup-ui/src/assets/<플랫폼>.png`에 두고 `sourceIcons`로 내보낸다.
- 개인정보처리방침·이용약관 본문은 `packages/legal/src/`에 언어별 JSX로 둔다. 한국어와 영어 본문은 같은 내용을 담아야 하므로 한쪽을 고치면 다른 쪽도 고친다. 확장과 사이트 모두 두 문서를 같은 폴더의 `privacy.html`, `terms.html`로 내보내므로 본문 안 링크는 `./terms.html`처럼 상대 경로로 쓴다. 이 패키지는 확장 API(`browser`, `#i18n`)를 쓰지 않는다.
- 소개 사이트(`apps/site`)는 Astro로 빌드 때 정적 HTML을 만든다. React 컴포넌트는 `client:` 지시어 없이 서버에서만 그리고, 스타일은 Tailwind를 쓴다. 예외는 소개 페이지의 단계별 동작 데모(`src/components/demo/StepDemo.tsx`) 하나로, `client:visible`로 화면에 보일 때만 불러온다. 데모 팝업 문구는 사이트에 옮겨 적지 않고 빌드 때 확장의 `src/locales/*.yml`에서 읽는다(`src/popupText.ts`). 모든 페이지는 `/ko/...`, `/en/...` 아래(`src/pages/[lang]/`)에 두고, 언어 없는 주소(`/`, `/privacy`, `/terms`)는 브라우저 언어를 보고 옮겨 주는 페이지(`src/layouts/Redirect.astro`, JS가 꺼져 있으면 `ko`)로 둔다. 새 페이지를 만들면 언어 없는 주소도 같이 만든다. 문구는 `apps/site/src/i18n.ts`에 같은 키로 둔다. `main`에 push되면 `.github/workflows/site.yml`이 GitHub Pages에 배포한다.
- 유효기간이 지난 보상은 목록, 대기열, 통계 어디에도 보여 주지 않는다 (`src/lib/expiry.ts`).
- 화면 문구는 코드에 직접 쓰지 않고 `src/locales/en.yml`(기본 언어, 키 타입의 기준)과 `ko.yml`에 같은 키로 넣은 뒤 `i18n.t()`로 읽는다. 언어는 브라우저 언어를 따른다.
- background·content script가 만든 문구(오류, 일시정지 이유)는 번역하지 않고 `msg()`로 만든 `LocalText`(키 + 치환 값)로 넘기고 저장한다. popup이 `tx()`로 번역해 보여 준다 (`src/lib/i18n.ts`). 사이트가 보낸 원문은 문자열 그대로 둔다.
- Battle.net 주소는 `https://<지역>.checkout.battle.net/shop/<언어>/checkout/...`이다. 지역은 kr, us, eu, tw만 받는다(cn은 외부 접속 불가). 등록은 작업을 시작한 탭의 지역·언어로 하며, 결과를 화면 문구로 읽으므로 `page.ts`에 문구 표가 있는 언어(`ko`, `en`)에서만 시작할 수 있다.
- Battle.net 등록 흐름은 `key-claim?keyCode=` → `preload/<base64>`(자동 POST)까지 버튼 없이 리다이렉트로 진행된다. 그다음 오류면 `key-lookup/<base64>` 결과 페이지, 유효한 코드면 `confirm-key-claim/<base64>` 확인 페이지로 간다. 확인 페이지의 "확인" 버튼(`form#submit-key-claim`)은 같은 주소로 csrftoken을 POST한다. 두 페이지 주소 모두 `kc|<조회마다 바뀌는 식별자>|<코드>`가 base64로 들어 있다.
- 오류 배너(`.error-notification-banner-content`, 예: "이미 등록된 코드입니다.")는 실제 화면으로 확인했다. 유효한 코드의 확인 페이지와 "확인" 버튼도 실제 화면으로 확인했다. English(`en`) 페이지는 "You’ve already claimed this code."(이미 등록된 코드)와 "You already have access to this product."(이미 보유한 상품), "The code you entered cannot be claimed."(등록할 수 없는 코드), 처리 중("We are processing your claim now.")과 성공("Code successfully redeemed!") 화면을 확인했다. 등록할 수 없는 상품 문구는 아직 비어 있다. 성공·처리 중 화면은 언어와 상관없는 표시(`data-bnet-shop="payment.success…keyclaim…heading…"`, `.payment-pending-state-title`)로도 판별한다.
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
