import type { LegalLang } from '@dropskeeper/legal';

export type Lang = LegalLang;

export const langs: readonly Lang[] = ['ko', 'en'];

/** 언어 없는 주소로 들어왔고 브라우저 언어도 알 수 없을 때 쓰는 언어 */
export const fallbackLang: Lang = 'ko';

/** 언어별 주소. path는 '' 또는 'privacy' 같은 페이지 이름 */
export const href = (lang: Lang, path = '') => `/${lang}/${path}`;

/** 언어별로 있는 페이지 이름. 사이트맵이 이 목록을 쓰므로 새 페이지를 만들면 여기에도 넣는다. */
export const pages = ['', 'privacy', 'terms'] as const;

/** [lang] 페이지의 getStaticPaths */
export const langPaths = () => langs.map((lang) => ({ params: { lang } }));
/** 확장 설치 주소(Chrome 웹 스토어, 항목 ID로 연다). 비우면 설치 버튼을 그리지 않는다. */
export const installUrl: string | null = 'https://chromewebstore.google.com/detail/dropskeeper/coojibaldchcohkfcpjijepnifdgiema';

/** 세부 순서 한 칸 (동작 데모 옆 목록) */
export interface Stage {
  label: string;
  desc: string;
}

const ko = {
  /** 소개 페이지 <title>. 링크 공유 미리보기 제목으로도 쓴다 */
  title: 'DropsKeeper · 드롭스 보상 코드, 한 번에 등록',
  description: '방송을 보며 받은 드롭스 보상 코드를 모아 게임 계정에 대신 등록해 주는 브라우저 확장 프로그램이에요. 코드를 하나씩 복사해 붙여 넣지 않아도 돼요.',
  headline: ['드롭스 보상 코드,', '한 번에 등록하세요'],
  lead: 'SOOP·CHZZK에서 받은 오버워치 드롭스 코드를 모아 Battle.net에 차례로 등록해요. 코드를 하나씩 복사해 붙여 넣지 않아도 돼요.',
  install: 'Chrome에 추가',
  stepChips: ['코드 추출', '등록'],
  /** Chrome 웹 스토어 스크린샷 머리글 (store/ 페이지, 배포 빌드에는 없다) */
  storeShots: [
    { title: '받은 보상을 한 번에 불러와요', desc: 'SOOP·CHZZK 드롭스 인벤토리에서 팝업을 열면 유효기간이 남은 보상만 보여 줘요.' },
    { title: '원하는 보상의 코드만 뽑아요', desc: '고른 보상의 코드를 받아 등록 대기열에 쌓아 둬요.' },
    { title: 'Battle.net에 하나씩 대신 등록해요', desc: '등록하기를 한 번 누르면 같은 탭에서 차례로 등록해요. 팝업을 닫아도 계속돼요.' },
    { title: '실패한 코드는 이유와 함께 남아요', desc: '이미 등록된 코드처럼 등록하지 못한 이유를 코드마다 알려 줘요.' },
  ],
  privacy: '개인정보처리방침',
  terms: '서비스 이용약관',
  otherLang: 'English',
  notFound: {
    title: '페이지를 찾을 수 없어요',
    desc: '주소가 바뀌었거나 없는 페이지예요.',
    home: '소개 페이지로 가기',
  },
  extract: {
    kicker: 'STEP 1',
    title: '드롭스 인벤토리에서 코드 추출',
    desc: 'SOOP이나 CHZZK의 드롭스 인벤토리 탭에서 확장 팝업을 여세요.',
    stages: [
      { label: '보상 목록 불러오기', desc: '로그인된 계정의 보상을 한 번에 가져와요' },
      { label: '추출할 보상 고르기', desc: '유효기간이 남은 오버워치 코드형 보상만 나와요' },
      { label: '코드 추출', desc: '고른 보상의 코드만 받아 등록 대기열에 쌓아요' },
    ],
  },
  redeem: {
    kicker: 'STEP 2',
    title: 'Battle.net에 차례로 등록',
    desc: 'Battle.net 코드 등록 페이지에서 확장 팝업을 여세요. 팝업을 닫아도 등록은 계속돼요.',
    stages: [
      { label: '등록하기 누르기', desc: '등록할 코드를 고르고 한 번만 눌러요' },
      { label: '하나씩 등록', desc: '같은 탭에서 0.5~1초 간격으로 차례로 넣어요' },
      { label: '결과 확인', desc: '실패한 코드는 이유와 함께 남아 다시 시도할 수 있어요' },
    ],
  },
  facts: [
    { title: '서버가 없어요', desc: '보상 목록과 코드는 이 브라우저에만 저장돼요. 어디로도 보내지 않아요.' },
    { title: '로그인 정보를 건드리지 않아요', desc: '각 사이트 탭 안에서 요청해서 지금 로그인된 상태를 그대로 써요. 쿠키나 비밀번호는 읽거나 저장하지 않아요.' },
    { title: '봇 확인이 뜨면 멈춰요', desc: 'CAPTCHA를 우회하지 않아요. 작업을 일시정지하니 직접 푼 뒤 재개하세요.' },
    { title: '기간이 지난 보상은 빼요', desc: '유효기간이 지난 보상은 목록, 대기열, 통계 어디에도 나오지 않아요.' },
  ],
  notices: [
    'DropsKeeper는 비공식 확장 프로그램으로, 네이버 주식회사, 주식회사 숲, Blizzard Entertainment, Inc.와 제휴하거나 승인받지 않았습니다.',
    'CHZZK·치지직은 네이버 주식회사의 등록 상표, SOOP·숲은 주식회사 숲의 상표, Battle.net·오버워치는 Blizzard Entertainment, Inc.의 상표 또는 등록 상표입니다.',
    '보상 이미지의 권리는 각 권리자에게 있습니다.',
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
  },
};

export type Copy = typeof ko;

const en: Copy = {
  title: 'DropsKeeper · Redeem all your drop codes in one go',
  description: 'A browser extension that collects the drop reward codes you earn watching streams and redeems them to your game account for you. No more copying and pasting each code.',
  headline: ['Drop reward codes,', 'redeemed in one go'],
  lead: 'Collect the Overwatch drop codes you earned on SOOP and CHZZK, and redeem them on Battle.net one by one. No more copying and pasting each code.',
  install: 'Add to Chrome',
  stepChips: ['Extract', 'Redeem'],
  storeShots: [
    { title: 'Load all your rewards at once', desc: 'Open the popup on your SOOP or CHZZK drops inventory to see every reward that hasn’t expired.' },
    { title: 'Extract codes for the rewards you pick', desc: 'Codes for the rewards you choose go straight into the redeem queue.' },
    { title: 'Redeemed on Battle.net, one by one', desc: 'Press Redeem once and codes go in on the same tab. It keeps going even if you close the popup.' },
    { title: 'Failed codes stay, with the reason', desc: 'See why each code didn’t go through, such as one that was already claimed.' },
  ],
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  otherLang: '한국어',
  notFound: {
    title: 'Page not found',
    desc: 'The address may have changed, or the page does not exist.',
    home: 'Go to the home page',
  },
  extract: {
    kicker: 'STEP 1',
    title: 'Extract codes from your drops inventory',
    desc: 'Open the extension popup on your SOOP or CHZZK drops inventory tab.',
    stages: [
      { label: 'Load rewards', desc: 'Fetches every reward on your signed-in account' },
      { label: 'Pick rewards to extract', desc: 'Only Overwatch code rewards that have not expired are listed' },
      { label: 'Extract codes', desc: 'Only the rewards you pick get codes, added to the redeem queue' },
    ],
  },
  redeem: {
    kicker: 'STEP 2',
    title: 'Redeem them on Battle.net one by one',
    desc: 'Open the extension popup on the Battle.net code redemption page. Redeeming keeps going even if you close it.',
    stages: [
      { label: 'Press Redeem', desc: 'Pick the codes and press it once' },
      { label: 'One code at a time', desc: 'Codes go in on the same tab, 0.5–1 seconds apart' },
      { label: 'Check the results', desc: 'Failed codes stay with their reason so you can retry' },
    ],
  },
  facts: [
    { title: 'No server', desc: 'Rewards and codes are stored only in this browser. Nothing is sent anywhere.' },
    { title: 'Your login stays untouched', desc: 'Requests run inside each site’s tab with the session you already have. Cookies and passwords are never read or stored.' },
    { title: 'Stops at bot checks', desc: 'CAPTCHAs are never bypassed. The job pauses so you can solve it and resume.' },
    { title: 'Skips expired rewards', desc: 'Expired rewards never show up in the list, the queue, or the stats.' },
  ],
  notices: [
    'DropsKeeper is an unofficial extension, not affiliated with or endorsed by NAVER Corp., SOOP Co., Ltd., or Blizzard Entertainment, Inc.',
    'CHZZK and 치지직 are registered trademarks of NAVER Corp. SOOP and 숲 are trademarks of SOOP Co., Ltd. Battle.net and Overwatch are trademarks or registered trademarks of Blizzard Entertainment, Inc.',
    'Reward images belong to their respective owners.',
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
  },
};

/** 소개 페이지 문구. 한국어와 영어는 같은 내용을 담는다. */
export const copy: Record<Lang, Copy> = { ko, en };
