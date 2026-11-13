import type { LegalDoc, LegalLang } from './LegalPage';

// 한국어와 영어 본문은 같은 내용을 담는다. 한쪽을 고치면 다른 쪽도 같이 고친다.
export const privacy: Record<LegalLang, LegalDoc> = {
  ko: {
    title: '개인정보처리방침',
    effective: '시행일: 2026년 11월 14일',
    lead: (
      <>
        DropsKeeper(이하 "확장 프로그램")는 스트리밍 플랫폼 드롭스 보상 코드를 모아 Battle.net에 등록하도록 돕는 브라우저 확장 프로그램입니다.
        확장 프로그램은 별도의 서버를 운영하지 않으며, 이용자의 정보를 개발자에게 전송하거나 수집하지 않습니다. 필요한 정보는 모두 이용자의 브라우저
        안에만 저장됩니다.
      </>
    ),
    body: (
      <>
        <h2>1. 수집하는 개인정보</h2>
        <p>
          개발자는 어떠한 개인정보도 수집하지 않습니다. 확장 프로그램에는 회원가입, 로그인, 이용 통계, 광고, 오류 보고 기능이 없으며 외부 분석 도구도
          사용하지 않습니다.
        </p>

        <h2>2. 브라우저에 저장하는 정보</h2>
        <p>
          확장 프로그램이 동작하려면 아래 정보가 필요합니다. 이 정보는 브라우저의 확장 프로그램 저장소(<code>chrome.storage.local</code>)에만 저장되며
          기기 밖으로 나가지 않습니다.
        </p>
        <table>
          <tbody>
            <tr>
              <th>항목</th>
              <th>내용</th>
            </tr>
            <tr>
              <td>보상 정보</td>
              <td>드롭스 보상의 이름, 캠페인 이름, 이미지 주소, 획득일과 유효기간, 플랫폼 안에서 쓰는 보상 번호, 수령 여부</td>
            </tr>
            <tr>
              <td>보상 코드</td>
              <td>드롭스 인벤토리에서 추출한 Battle.net 등록 코드</td>
            </tr>
            <tr>
              <td>등록 결과</td>
              <td>코드별 등록 성공·실패 여부, 실패 이유, Battle.net 화면에 표시된 안내 문구, 처리 시각</td>
            </tr>
            <tr>
              <td>작업 상태</td>
              <td>진행 중인 추출·등록 작업의 대기열과 진행 위치, 등록에 쓰는 Battle.net 지역과 언어, 목록을 마지막으로 불러온 시각</td>
            </tr>
            <tr>
              <td>설정</td>
              <td>코드 가리기, 페이지 안내 표시 같은 화면 설정</td>
            </tr>
          </tbody>
        </table>
        <p>
          확장 프로그램은 SOOP, 네이버(CHZZK), Battle.net의 아이디·비밀번호·쿠키 값을 읽거나 저장하지 않습니다. 각 사이트의 로그인은 이용자가
          브라우저에서 직접 하며, 확장 프로그램은 이미 로그인된 탭 안에서 그 사이트의 기능을 호출할 뿐입니다.
        </p>

        <h2>3. 확장 프로그램이 접속하는 곳</h2>
        <p>확장 프로그램은 이용자가 연 아래 사이트의 탭 안에서만 동작하며, 그 사이트의 기능을 이용하기 위해 해당 사이트에 직접 요청을 보냅니다.</p>
        <ul>
          <li>
            <strong>SOOP</strong> (<code>drops.sooplive.com</code>): 드롭스 보상 목록 조회와 코드 받기
          </li>
          <li>
            <strong>CHZZK</strong> (<code>game.naver.com</code>, <code>api.chzzk.naver.com</code>): 드롭스 보상 목록 조회와 코드 받기
          </li>
          <li>
            <strong>Battle.net</strong> (<code>kr·us·eu·tw.checkout.battle.net</code>, <code>account.battle.net</code>): 코드 등록과 결과 확인
          </li>
        </ul>
        <p>
          SOOP·CHZZK 드롭스 인벤토리 페이지를 열거나 그 페이지에서 팝업을 열면, 추출할 코드가 있는지 알려 드리기 위해 보상 목록을 자동으로
          조회합니다. 최근 10분 안에 조회한 적이 있으면 다시 조회하지 않습니다. 코드 추출과 등록은 이용자가 버튼을 누를 때만 시작합니다. 설정에서
          "페이지에 안내 띄우기"를 끄면 인벤토리 페이지를 열어도 보상 목록을 자동으로 조회하지 않습니다.
        </p>
        <p>
          또한 팝업에 보상 이미지를 표시하기 위해 각 플랫폼이 제공한 이미지 주소를 불러옵니다. 이 과정에서 각 사이트가 받는 정보는 이용자가 그 사이트를
          직접 방문할 때와 같으며, 각 사이트의 개인정보처리방침이 적용됩니다. 위 사이트 외의 다른 곳으로는 어떠한 정보도 보내지 않습니다.
        </p>

        <h2>4. 제3자 제공과 처리 위탁</h2>
        <p>개발자는 정보를 수집하지 않으므로 제3자에게 제공하거나 처리를 위탁하는 정보도 없습니다.</p>

        <h2>5. 권한을 요청하는 이유</h2>
        <ul>
          <li>
            <strong>저장소(storage)</strong>: 위 2항의 정보를 브라우저에 보관하기 위해 사용합니다.
          </li>
          <li>
            <strong>사이트 접근 권한</strong>: 위 3항의 사이트에서만 보상 목록을 읽고, 코드를 받고, 등록 화면을 처리하기 위해 사용합니다.
          </li>
        </ul>

        <h2>6. 보관 기간과 삭제</h2>
        <ul>
          <li>저장된 정보는 이용자가 지우기 전까지 브라우저에 남습니다.</li>
          <li>확장 프로그램을 삭제하면 저장된 정보도 브라우저가 함께 삭제합니다.</li>
          <li>
            목록에서 보상을 삭제하면 화면에서 사라집니다. 다만 목록을 다시 불러왔을 때 되살아나지 않도록 해당 보상에 "삭제함" 표시는 브라우저에 남겨
            둡니다.
          </li>
          <li>유효기간이 지난 보상은 목록, 대기열, 통계에 표시하지 않습니다.</li>
        </ul>

        <h2>7. 이용자의 권리</h2>
        <p>
          모든 정보가 이용자의 브라우저에만 있으므로 이용자는 언제든지 확장 프로그램을 삭제하거나 브라우저의 확장 프로그램 데이터를 지워 정보를 직접
          삭제할 수 있습니다. 개발자는 이용자의 정보를 보유하지 않아 별도로 열람·정정·삭제를 처리할 정보가 없습니다.
        </p>

        <h2>8. 아동의 개인정보</h2>
        <p>확장 프로그램은 누구의 개인정보도 수집하지 않으며, 만 14세 미만 아동의 정보 역시 수집하지 않습니다.</p>

        <h2>9. 방침의 변경</h2>
        <p>
          이 방침은 법령이나 확장 프로그램의 기능이 바뀔 때 수정될 수 있습니다. 정보를 다루는 방식이 바뀌는 경우 새 버전을 배포하기 전에 이 페이지에
          먼저 알리고, 시행일을 함께 고칩니다.
        </p>

        <h2>10. 문의</h2>
        <p>개인정보 처리에 관한 문의는 Chrome 웹 스토어의 DropsKeeper 지원 페이지로 보내 주세요.</p>
      </>
    ),
    other: { href: './terms.html', label: '서비스 이용약관 보기' },
  },

  en: {
    title: 'Privacy Policy',
    effective: 'Effective date: November 14, 2026',
    lead: (
      <>
        DropsKeeper (the "Extension") is a browser extension that helps you collect drop reward codes from streaming platforms and redeem them on
        Battle.net. The Extension does not run its own servers and does not send any of your information to, or collect it for, the developer. Everything
        it needs is stored only in your browser.
      </>
    ),
    body: (
      <>
        <h2>1. Personal information we collect</h2>
        <p>
          The developer does not collect any personal information. The Extension has no sign-up, sign-in, usage statistics, advertising, or error
          reporting, and it does not use any third-party analytics tools.
        </p>

        <h2>2. Information stored in your browser</h2>
        <p>
          The Extension needs the information below to work. It is stored only in the browser's extension storage (<code>chrome.storage.local</code>) and
          never leaves your device.
        </p>
        <table>
          <tbody>
            <tr>
              <th>Item</th>
              <th>Details</th>
            </tr>
            <tr>
              <td>Rewards</td>
              <td>Reward name, campaign name, image URL, date received and expiry date, the reward ID used by the platform, and whether it was claimed</td>
            </tr>
            <tr>
              <td>Reward codes</td>
              <td>Battle.net codes extracted from your drops inventory</td>
            </tr>
            <tr>
              <td>Redeem results</td>
              <td>Whether each code was redeemed or failed, the reason for a failure, the message shown on Battle.net, and when it was processed</td>
            </tr>
            <tr>
              <td>Job status</td>
              <td>
                The queue and progress of running extract and redeem jobs, the Battle.net region and language used for redeeming, and when the list was last
                loaded
              </td>
            </tr>
            <tr>
              <td>Settings</td>
              <td>Display settings such as hiding codes and showing on-page prompts</td>
            </tr>
          </tbody>
        </table>
        <p>
          The Extension does not read or store your SOOP, NAVER (CHZZK), or Battle.net usernames, passwords, or cookie values. You sign in to each site
          yourself in your browser; the Extension only uses that site's features inside a tab where you are already signed in.
        </p>

        <h2>3. Sites the Extension connects to</h2>
        <p>The Extension works only inside tabs you open on the sites below, and sends requests directly to those sites to use their features.</p>
        <ul>
          <li>
            <strong>SOOP</strong> (<code>drops.sooplive.com</code>): loading your drop rewards and getting codes
          </li>
          <li>
            <strong>CHZZK</strong> (<code>game.naver.com</code>, <code>api.chzzk.naver.com</code>): loading your drop rewards and getting codes
          </li>
          <li>
            <strong>Battle.net</strong> (<code>kr/us/eu/tw.checkout.battle.net</code>, <code>account.battle.net</code>): redeeming codes and checking the
            results
          </li>
        </ul>
        <p>
          When you open a SOOP or CHZZK drops inventory page, or open the popup on one, the Extension automatically loads your reward list so it can tell
          you whether there are codes to extract. It does not load the list again if it did so within the last 10 minutes. Extracting and redeeming codes
          only start when you press a button. If you turn off "Show on-page prompts" in the settings, the list is not loaded automatically when you open an
          inventory page.
        </p>
        <p>
          The Extension also loads the reward image URLs provided by each platform to show them in the popup. Each site receives the same information as when
          you visit it yourself, and that site's privacy policy applies. No information is sent anywhere other than the sites above.
        </p>

        <h2>4. Sharing with third parties</h2>
        <p>Because the developer collects no information, there is nothing to share with or entrust to third parties.</p>

        <h2>5. Why we request permissions</h2>
        <ul>
          <li>
            <strong>Storage</strong>: to keep the information in section 2 in your browser.
          </li>
          <li>
            <strong>Site access</strong>: to read reward lists, get codes, and handle the redeem pages, only on the sites in section 3.
          </li>
        </ul>

        <h2>6. Retention and deletion</h2>
        <ul>
          <li>Stored information stays in your browser until you delete it.</li>
          <li>When you remove the Extension, your browser deletes its stored information as well.</li>
          <li>
            When you remove a reward from the list, it disappears from the screen. A "removed" mark is kept in your browser so the reward doesn't come back
            when the list is reloaded.
          </li>
          <li>Expired rewards are not shown in lists, queues, or statistics.</li>
        </ul>

        <h2>7. Your rights</h2>
        <p>
          All information lives only in your browser, so you can delete it at any time by removing the Extension or clearing its data in your browser. The
          developer holds none of your information, so there is nothing for the developer to show, correct, or delete on request.
        </p>

        <h2>8. Children's privacy</h2>
        <p>The Extension does not collect anyone's personal information, including that of children under 14.</p>

        <h2>9. Changes to this policy</h2>
        <p>
          This policy may change when laws or the Extension's features change. If the way information is handled changes, this page will be updated, along
          with the effective date, before the new version is released.
        </p>

        <h2>10. Contact</h2>
        <p>For questions about privacy, please use the DropsKeeper support page on the Chrome Web Store.</p>
        <p>This is a translation of the Korean policy. If the two versions differ, the Korean version prevails.</p>
      </>
    ),
    other: { href: './terms.html', label: 'View Terms of Service' },
  },
};
