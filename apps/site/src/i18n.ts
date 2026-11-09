import type { LegalLang } from '@dropskeeper/legal';

export type Lang = LegalLang;

export const langs: readonly Lang[] = ['ko', 'en'];

/** 언어 없는 주소로 들어왔고 브라우저 언어도 알 수 없을 때 쓰는 언어 */
export const fallbackLang: Lang = 'ko';

/** 언어별 주소. path는 '' 또는 'privacy' 같은 페이지 이름 */
export const href = (lang: Lang, path = '') => `/${lang}/${path}`;

/** [lang] 페이지의 getStaticPaths */
export const langPaths = () => langs.map((lang) => ({ params: { lang } }));
/**
 * 확장 설치 주소. 스토어에 올리기 전이라 비워 두고, 비어 있으면 설치 버튼을 그리지 않는다.
 * 예: 'https://chromewebstore.google.com/detail/...'
 */
export const installUrl: string | null = null;

/** 세부 순서 한 칸 (동작 데모 옆 목록) */
export interface Stage {
  label: string;
  desc: string;
}

const ko = {
  description: '스트리밍 플랫폼 드롭스 보상 코드를 모아 Battle.net에 차례로 등록하는 브라우저 확장 프로그램',
  headline: ['드롭스 보상 코드,', '한 번에 등록하세요'],
  lead: 'SOOP·CHZZK 드롭스 인벤토리에서 코드를 모으고, Battle.net 코드 등록 페이지에서 등록하기 한 번만 누르세요.',
  install: 'Chrome에 추가',
  stepChips: ['1 코드 추출', '2 등록'],
  privacy: '개인정보처리방침',
  terms: '서비스 이용약관',
  otherLang: 'English',
  extract: {
    kicker: 'STEP 1',
    title: '드롭스 인벤토리에서 코드 추출',
    desc: 'SOOP이나 CHZZK 인벤토리 탭에서 팝업을 열면, 로그인된 계정의 보상 목록을 불러와요. 고른 보상만 코드를 받아요.',
    stages: [
      { label: '보상 목록 불러오기', desc: '인벤토리 탭에서 팝업을 열고 한 번 눌러요' },
      { label: '추출할 보상 고르기', desc: '유효기간이 남은 오버워치 코드형 보상만 나와요' },
      { label: '코드 추출', desc: '고른 보상의 코드를 받아 등록 대기열에 쌓아요' },
    ],
  },
  redeem: {
    kicker: 'STEP 2',
    title: 'Battle.net에 차례로 등록',
    desc: 'Battle.net 코드 등록 페이지에서 팝업을 열고 등록하기를 누르세요. 팝업을 닫아도 계속 진행돼요.',
    stages: [
      { label: '등록하기 누르기', desc: 'Battle.net 코드 등록 페이지에서 팝업을 열어요' },
      { label: '하나씩 등록', desc: '이 탭에서 코드 사이 0.5~1초 간격으로 넣어요' },
      { label: '결과 확인', desc: '실패한 코드는 이유를 남기고 다시 시도할 수 있어요' },
    ],
  },
  facts: [
    { title: '서버가 없어요', desc: '보상 목록과 코드는 이 브라우저의 확장 저장소에만 남아요. 어디로도 보내지 않아요.' },
    { title: '쿠키를 읽지 않아요', desc: '각 사이트 탭 안에서 요청을 보내서, 이미 로그인된 상태 그대로 동작해요.' },
    { title: 'CAPTCHA가 뜨면 멈춰요', desc: '봇 확인을 우회하지 않아요. 일시정지하고 직접 풀도록 맡겨요.' },
    { title: '지난 보상은 숨겨요', desc: '유효기간이 지난 보상은 목록, 대기열, 통계 어디에도 보이지 않아요.' },
  ],
  notices: [
    "DropsKeeper는 네이버 주식회사가 운영하는 서비스가 아닙니다. 'CHZZK' 및 '치지직'은 네이버 주식회사의 등록 상표입니다.",
    "DropsKeeper는 주식회사 숲이 운영하는 서비스가 아닙니다. 'SOOP' 및 '숲'은 주식회사 숲의 상표입니다.",
    "DropsKeeper는 Blizzard Entertainment, Inc.가 운영하는 서비스가 아닙니다. 'Battle.net' 및 '오버워치'는 Blizzard Entertainment, Inc.의 상표 또는 등록 상표입니다.",
    '페이지에 나오는 보상 이미지의 권리는 각 권리자에게 있습니다.',
  ],
  /** 동작 데모 안에 그리는 다른 사이트 화면 문구 */
  demo: {
    soopName: '드롭스',
    soopTitle: ['방송을 보면서', '드롭스 <보상>을 모아 보세요'],
    soopWhat: '드롭스란? ›',
    soopTabs: ['시청 미션', '보관함', '이벤트'],
    soopSettings: '설정',
    soopAll: '전체',
    soopClaimable: '획득가능',
    soopClaimed: '획득완료',
    soopRange: '* 최근 1년 조회 가능',
    soopClaimedOverlay: '획득 완료',
    soopExpires: '유효기간 : {date}',
    soopDaysLeft: '{days}일 남음',
    soopClaim: '획득하기',
    soopInfo: '정보 확인',
    bnAccount: '계정',
    bnTitle: '코드 등록',
    bnDesc: '게임 키, 게임 시간 코드, 게임 아이템 코드 등을 등록하세요.',
    bnLabel: '코드 입력',
    bnSubmit: '코드 등록',
    bnCancel: '취소',
    bnGuide: '코드 등록 안내',
    bnChecking: '확인하는 중',
    bnConfirmTitle: '코드 확인',
    bnConfirmDesc: '아래 상품을 계정에 추가합니다.',
    bnConfirm: '확인',
    bnGame: '오버워치',
    bnSuccess: '코드 등록 완료!',
    bnUsed: '이미 등록된 코드입니다.',
    bnUsedDesc: '코드는 한 번만 등록할 수 있습니다.',
    sample: '예시 화면 · 코드는 가짜 값이에요',
  },
};

export type Copy = typeof ko;

const en: Copy = {
  description: 'A browser extension that collects drop reward codes from streaming platforms and redeems them on Battle.net one by one',
  headline: ['Drop reward codes,', 'redeemed in one go'],
  lead: 'Collect codes from your SOOP and CHZZK drops inventory, then press Redeem once on the Battle.net code redemption page.',
  install: 'Add to Chrome',
  stepChips: ['1 Extract', '2 Redeem'],
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  otherLang: '한국어',
  extract: {
    kicker: 'STEP 1',
    title: 'Extract codes from your drops inventory',
    desc: 'Open the popup on the SOOP or CHZZK inventory tab to load the rewards of the signed-in account. Only the rewards you pick get their codes extracted.',
    stages: [
      { label: 'Load rewards', desc: 'Open the popup on the inventory tab and press once' },
      { label: 'Pick rewards to extract', desc: 'Only Overwatch code rewards that have not expired are listed' },
      { label: 'Extract codes', desc: 'Codes of the picked rewards go into the redeem queue' },
    ],
  },
  redeem: {
    kicker: 'STEP 2',
    title: 'Redeem them on Battle.net one by one',
    desc: 'Open the popup on the Battle.net code redemption page and press Redeem. It keeps going even if you close the popup.',
    stages: [
      { label: 'Press Redeem', desc: 'Open the popup on the Battle.net code redemption page' },
      { label: 'One code at a time', desc: 'Codes go in on this tab, 0.5–1 seconds apart' },
      { label: 'Check the results', desc: 'Failed codes keep their reason and can be retried' },
    ],
  },
  facts: [
    { title: 'No server', desc: 'Rewards and codes stay in this browser’s extension storage. Nothing is sent anywhere.' },
    { title: 'No cookie reading', desc: 'Requests are sent from inside each site’s tab, using the session you are already signed in with.' },
    { title: 'Stops on CAPTCHA', desc: 'Bot checks are never bypassed. It pauses and leaves them to you.' },
    { title: 'Expired rewards hidden', desc: 'Expired rewards never show up in the list, the queue, or the stats.' },
  ],
  notices: [
    "DropsKeeper is not operated by NAVER Corp. 'CHZZK' and '치지직' are registered trademarks of NAVER Corp.",
    "DropsKeeper is not operated by SOOP Co., Ltd. 'SOOP' and '숲' are trademarks of SOOP Co., Ltd.",
    "DropsKeeper is not operated by Blizzard Entertainment, Inc. 'Battle.net' and 'Overwatch' are trademarks or registered trademarks of Blizzard Entertainment, Inc.",
    'Reward images shown on this page belong to their respective owners.',
  ],
  demo: {
    soopName: 'Drops',
    soopTitle: ['Watch streams and', 'collect drop <rewards>'],
    soopWhat: 'What are drops? ›',
    soopTabs: ['Missions', 'Inventory', 'Events'],
    soopSettings: 'Settings',
    soopAll: 'All',
    soopClaimable: 'Claimable',
    soopClaimed: 'Claimed',
    soopRange: '* Last 12 months',
    soopClaimedOverlay: 'Claimed',
    soopExpires: 'Expires: {date}',
    soopDaysLeft: '{days} days left',
    soopClaim: 'Claim',
    soopInfo: 'Details',
    bnAccount: 'Account',
    bnTitle: 'Redeem a Code',
    bnDesc: 'Redeem game keys, game time, in-game items and more.',
    bnLabel: 'Enter code',
    bnSubmit: 'Redeem',
    bnCancel: 'Cancel',
    bnGuide: 'How to redeem a code',
    bnChecking: 'Checking',
    bnConfirmTitle: 'Confirm code',
    bnConfirmDesc: 'The item below will be added to your account.',
    bnConfirm: 'Confirm',
    bnGame: 'Overwatch',
    bnSuccess: 'Code successfully redeemed!',
    bnUsed: 'You’ve already claimed this code.',
    bnUsedDesc: 'A code can only be redeemed once.',
    sample: 'Sample screens · codes are not real',
  },
};

/** 소개 페이지 문구. 한국어와 영어는 같은 내용을 담는다. */
export const copy: Record<Lang, Copy> = { ko, en };
