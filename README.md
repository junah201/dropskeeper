# DropsKeeper

**한국어** | [English](README.en.md)

스트리밍 플랫폼 드롭스 보상 코드를 모아 Battle.net에 차례로 등록하는 Chrome 확장 프로그램입니다.
지금은 SOOP·CHZZK 드롭스(오버워치)를 지원합니다.

- [Chrome 웹 스토어에서 설치](https://chromewebstore.google.com/detail/coojibaldchcohkfcpjijepnifdgiema) (Brave 등 Chromium 브라우저에서도 설치할 수 있어요)
- 소개 사이트: [dropskeeper.junah.dev](https://dropskeeper.junah.dev)

| | |
|---|---|
| ![받은 보상을 한 번에 불러와요](apps/site/store/ko/1.png) | ![원하는 보상의 코드만 뽑아요](apps/site/store/ko/2.png) |
| ![Battle.net에 하나씩 대신 등록해요](apps/site/store/ko/3.png) | ![실패한 코드는 이유와 함께 남아요](apps/site/store/ko/4.png) |

## 사용 흐름

1. 드롭스 인벤토리에서 확장을 열고 **보상 목록 불러오기**
   - SOOP: `drops.sooplive.com/inventory`
   - CHZZK: `game.naver.com/profile#drops` (네이버 로그인 필요)
2. 보상을 고르고 **코드 추출**
3. Battle.net 코드 등록 페이지(`kr.checkout.battle.net/shop/ko/checkout/key-claim`)에서 확장을 다시 열고 **등록하기**
4. 실패한 코드는 이유를 확인하고 **다시 시도**

## 개발

```bash
pnpm install
pnpm dev          # 개발 모드 (Chrome이 열리고 변경 시 자동 리로드)
pnpm build        # apps/extension/.output/chrome-mv3 에 빌드
pnpm compile      # 타입 검사
pnpm site:dev     # 소개 사이트 개발 서버
pnpm site:build   # 소개 사이트를 apps/site/dist 에 빌드
```

직접 설치: `chrome://extensions` → 개발자 모드 → **압축해제된 확장 프로그램을 로드합니다** → `apps/extension/.output/chrome-mv3` 선택

## 구조

pnpm 모노레포입니다.

```
apps/
  extension/   확장 프로그램 (WXT)
  site/        소개 사이트 dropskeeper.junah.dev (Astro, GitHub Pages)
packages/
  legal/       개인정보처리방침·이용약관 본문. 확장과 사이트가 같이 씀
  popup-ui/    팝업 화면 부품(색, 버튼, 목록 행). 확장 팝업과 사이트의 동작 데모가 같이 씀
```

확장(`apps/extension`) 안은 이렇습니다. 아래 경로는 모두 `apps/extension` 기준입니다.

```
src/
  entrypoints/
    background.ts          작업 실행기 (추출·등록 큐, 팝업이 닫혀도 계속)
    soop.content.ts        SOOP 페이지에서 드롭스 API 호출
    chzzk.content.ts       네이버 게임 페이지에서 CHZZK 드롭스 API 호출
    battlenet.content.ts   Battle.net 등록 페이지 상태 읽기, 확인 버튼 클릭
    popup/                 Preact + Tailwind 팝업
  lib/
    sources/               드롭스 플랫폼 (SOOP, CHZZK)
    redeem/battlenet/      Battle.net 등록 페이지 처리
    jobs.ts                추출·등록 작업 로직
    storage.ts             chrome.storage.local 래퍼
    messages.ts            확장 내부 메시지 타입
```

## 새 드롭스 플랫폼 추가하기

1. `src/lib/types.ts`의 `SourceId`에 id 추가 (예: `'twitch'`)
2. `src/lib/sources/hosts.ts`의 `sourceMetas`에 인벤토리 주소와 match pattern 추가
3. `src/lib/sources/<id>.ts`에 `DropSource`(`listRewards`, `extractCode`) 구현
4. `src/lib/sources/index.ts` 레지스트리에 등록
5. `src/entrypoints/<id>.content.ts` 생성 (`serveSource(...)` 한 줄)
6. 플랫폼 아이콘을 `packages/popup-ui/src/assets/<id>.png`에 넣고 `packages/popup-ui/src/icons.ts`의 `sourceIcons`에 추가

팝업, 저장소, 등록 로직은 `SourceId` 기준으로 동작하므로 수정할 필요가 없습니다.
host_permissions도 `sourceMetas`에서 자동으로 만들어집니다.

## 아직 검증하지 않은 부분

Battle.net의 확인 화면, 오류 배너, 성공·처리 중 화면은 실제 화면으로 확인했습니다.
"등록할 수 없는 상품" 오류 문구는 아직 확인하지 못해 비어 있습니다. 확인되면 `src/lib/redeem/battlenet/page.ts`의 문구 표에 넣으면 됩니다.

## 스토어 스크린샷과 미리보기 그림

- 스토어 스크린샷(1280×800): `apps/site/store/<언어>/<번호>.png`. 다시 찍기: `node apps/site/store/render.mjs`
- 링크 공유 미리보기(1200×630): `apps/site/public/og/<언어>.png`. 다시 찍기: `node apps/site/og/render.mjs`

둘 다 설치된 Chromium 계열 브라우저(Brave, Chrome, Edge)를 headless로 써서 찍습니다.

## 소개 사이트 배포

`apps/site`, `packages/legal`, `packages/popup-ui`, 확장 문구(`apps/extension/src/locales`)가 바뀐 채로 `main`에 push되면 `.github/workflows/site.yml`이 GitHub Pages에 배포합니다.

처음 한 번만 설정합니다.

1. DNS에 `dropskeeper.junah.dev` → `junah201.github.io` CNAME 레코드 추가
2. 저장소 Settings → Pages → Source를 **GitHub Actions**로 선택
3. 같은 화면의 Custom domain에 `dropskeeper.junah.dev`를 넣고 **Enforce HTTPS** 켜기
