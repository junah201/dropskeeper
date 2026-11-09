import type { LegalDoc, LegalLang } from './LegalPage';

// 한국어와 영어 본문은 같은 내용을 담는다. 한쪽을 고치면 다른 쪽도 같이 고친다.
export const terms: Record<LegalLang, LegalDoc> = {
  ko: {
    title: '서비스 이용약관',
    effective: '시행일: 2026년 11월 9일',
    lead: (
      <>
        이 약관은 브라우저 확장 프로그램 DropsKeeper(이하 "확장 프로그램")를 이용하는 조건을 정합니다. 확장 프로그램을 설치하거나 이용하면 이 약관에
        동의한 것으로 봅니다.
      </>
    ),
    body: (
      <>
        <h2>제1조 (제공하는 기능)</h2>
        <p>확장 프로그램은 다음 기능을 무료로 제공합니다.</p>
        <ul>
          <li>SOOP, CHZZK 드롭스 인벤토리에서 이용자가 받은 보상 목록과 보상 코드를 불러오는 기능</li>
          <li>불러온 코드를 Battle.net 코드 등록 페이지에서 차례로 등록하는 기능</li>
          <li>등록 결과와 실패 이유를 보여 주는 기능</li>
        </ul>

        <h2>제2조 (비공식 도구)</h2>
        <p>
          확장 프로그램은 개인이 만든 비공식 도구이며 SOOP, 네이버(CHZZK), Blizzard Entertainment(Battle.net, 오버워치)와 제휴하거나 그 승인을 받지
          않았습니다. 각 서비스의 이름과 상표는 해당 회사에 속합니다.
        </p>

        <h2>제3조 (이용자의 의무)</h2>
        <ul>
          <li>이용자는 본인의 계정으로, 본인이 정당하게 받은 보상에 대해서만 확장 프로그램을 이용해야 합니다.</li>
          <li>
            이용자는 SOOP, 네이버, Battle.net 등 각 서비스의 이용약관과 운영정책을 지켜야 하며, 그 준수 여부에 대한 책임은 이용자에게 있습니다.
          </li>
          <li>
            다른 사람의 계정이나 보상 코드를 허락 없이 이용하거나, 확장 프로그램을 고쳐 각 서비스에 과도한 요청을 보내는 등 서비스 운영을 방해하는
            용도로 이용해서는 안 됩니다.
          </li>
        </ul>

        <h2>제4조 (보안 확인과 자동화의 한계)</h2>
        <p>
          확장 프로그램은 CAPTCHA 등 각 서비스의 보안 확인이나 봇 탐지를 우회하지 않습니다. 이런 확인이 나타나면 작업을 멈추고 이용자에게 맡깁니다.
          서비스에 부담을 주지 않도록 요청 사이에 간격을 둡니다.
        </p>

        <h2>제5조 (정보의 저장)</h2>
        <p>
          확장 프로그램이 다루는 정보는 이용자의 브라우저에만 저장되며 개발자에게 전송되지 않습니다. 자세한 내용은{' '}
          <a href="./privacy.html">개인정보처리방침</a>을 따릅니다. 보상 코드는 이용자의 브라우저에만 보관되므로, 확장 프로그램을 삭제하거나 브라우저
          데이터를 지우면 되살릴 수 없습니다. 중요한 코드는 이용자가 따로 보관하시기 바랍니다.
        </p>

        <h2>제6조 (서비스의 변경과 중단)</h2>
        <p>
          확장 프로그램은 각 플랫폼의 화면과 기능을 이용해 동작하므로, 해당 서비스가 바뀌면 일부 또는 전체 기능이 예고 없이 동작하지 않을 수 있습니다.
          개발자는 확장 프로그램의 기능을 바꾸거나 제공을 중단할 수 있습니다.
        </p>

        <h2>제7조 (보증의 부인)</h2>
        <p>
          확장 프로그램은 "있는 그대로" 제공됩니다. 개발자는 확장 프로그램이 오류 없이 동작하거나, 모든 코드를 빠짐없이 불러오거나, 등록 결과를 정확히
          판별한다고 보증하지 않습니다. 등록 결과는 이용자가 Battle.net 계정에서 직접 확인하시기 바랍니다.
        </p>

        <h2>제8조 (책임의 제한)</h2>
        <p>개발자는 고의나 중대한 과실이 없는 한, 확장 프로그램 이용과 관련해 생긴 다음 손해에 대해 책임지지 않습니다.</p>
        <ul>
          <li>코드의 분실, 등록 실패, 유효기간 경과로 생긴 손해</li>
          <li>각 서비스의 변경, 장애, 이용 제한 또는 계정 제재로 생긴 손해</li>
          <li>이용자가 제3조를 지키지 않아 생긴 손해</li>
        </ul>
        <p>다만 관련 법령이 이러한 책임의 제한을 허용하지 않는 경우에는 그 법령을 따릅니다.</p>

        <h2>제9조 (약관의 변경)</h2>
        <p>
          개발자는 필요한 경우 이 약관을 변경할 수 있으며, 변경 내용은 시행일과 함께 이 페이지에 게시합니다. 변경 후에도 확장 프로그램을 계속 이용하면
          바뀐 약관에 동의한 것으로 봅니다. 동의하지 않으면 확장 프로그램을 삭제해 이용을 중단할 수 있습니다.
        </p>

        <h2>제10조 (준거법)</h2>
        <p>이 약관은 대한민국 법률에 따라 해석되며, 분쟁이 생기면 민사소송법에 따른 관할 법원에서 해결합니다.</p>

        <h2>문의</h2>
        <p>약관에 관한 문의는 Chrome 웹 스토어의 DropsKeeper 지원 페이지로 보내 주세요.</p>
      </>
    ),
    other: { href: './privacy.html', label: '개인정보처리방침 보기' },
  },

  en: {
    title: 'Terms of Service',
    effective: 'Effective date: November 9, 2026',
    lead: (
      <>
        These terms set out the conditions for using the browser extension DropsKeeper (the "Extension"). By installing or using the Extension, you agree
        to these terms.
      </>
    ),
    body: (
      <>
        <h2>Article 1 (Features)</h2>
        <p>The Extension provides the following features free of charge.</p>
        <ul>
          <li>Loading the rewards and reward codes you received from your SOOP and CHZZK drops inventories</li>
          <li>Redeeming the loaded codes one by one on the Battle.net redeem page</li>
          <li>Showing redeem results and the reasons for failures</li>
        </ul>

        <h2>Article 2 (Unofficial tool)</h2>
        <p>
          The Extension is an unofficial tool made by an individual. It is not affiliated with or endorsed by SOOP, NAVER (CHZZK), or Blizzard
          Entertainment (Battle.net, Overwatch). All service names and trademarks belong to their respective owners.
        </p>

        <h2>Article 3 (Your obligations)</h2>
        <ul>
          <li>Use the Extension only with your own accounts, and only for rewards you legitimately received.</li>
          <li>
            You must follow the terms of service and policies of each service, including SOOP, NAVER, and Battle.net, and you are responsible for doing so.
          </li>
          <li>
            Do not use the Extension to disrupt any service, for example by using other people's accounts or reward codes without permission, or by
            modifying the Extension to send excessive requests.
          </li>
        </ul>

        <h2>Article 4 (Security checks and limits of automation)</h2>
        <p>
          The Extension does not bypass CAPTCHAs, other security checks, or bot detection. When such a check appears, the Extension stops and leaves it to
          you. It also waits between requests so as not to put a load on the services.
        </p>

        <h2>Article 5 (Storage of information)</h2>
        <p>
          Information handled by the Extension is stored only in your browser and is never sent to the developer. See the{' '}
          <a href="./privacy.html">Privacy Policy</a> for details. Because reward codes are kept only in your browser, they cannot be recovered after you
          remove the Extension or clear your browser data. Please keep important codes somewhere else as well.
        </p>

        <h2>Article 6 (Changes and discontinuation)</h2>
        <p>
          The Extension works by using each platform's pages and features, so some or all of its features may stop working without notice when those
          services change. The developer may change the Extension's features or stop providing it.
        </p>

        <h2>Article 7 (Disclaimer of warranties)</h2>
        <p>
          The Extension is provided "as is". The developer does not guarantee that it will work without errors, load every code, or correctly determine
          redeem results. Please check your redeem results in your Battle.net account yourself.
        </p>

        <h2>Article 8 (Limitation of liability)</h2>
        <p>
          Except in cases of intent or gross negligence, the developer is not liable for the following losses related to using the Extension.
        </p>
        <ul>
          <li>Losses from lost codes, failed redeems, or expired codes</li>
          <li>Losses from changes, outages, or usage restrictions of any service, or from account sanctions</li>
          <li>Losses caused by your failure to follow Article 3</li>
        </ul>
        <p>Where applicable law does not allow such limitations of liability, that law applies.</p>

        <h2>Article 9 (Changes to these terms)</h2>
        <p>
          The developer may change these terms when necessary and will post the changes on this page along with the effective date. If you keep using the
          Extension after a change, you are considered to have agreed to the new terms. If you do not agree, you can stop using the Extension by removing
          it.
        </p>

        <h2>Article 10 (Governing law)</h2>
        <p>
          These terms are governed by the laws of the Republic of Korea. Any disputes will be resolved by the competent court under the Korean Civil
          Procedure Act.
        </p>

        <h2>Contact</h2>
        <p>For questions about these terms, please use the DropsKeeper support page on the Chrome Web Store.</p>
        <p>This is a translation of the Korean terms. If the two versions differ, the Korean version prevails.</p>
      </>
    ),
    other: { href: './privacy.html', label: 'View Privacy Policy' },
  },
};
