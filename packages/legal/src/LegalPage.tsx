import type { ReactNode } from 'react';

/** 약관 본문 언어. 확장 화면 언어(UiLang)와 같다. */
export type LegalLang = 'ko' | 'en';

/** 약관 문서 한 언어분 */
export interface LegalDoc {
  title: string;
  effective: string;
  lead: ReactNode;
  body: ReactNode;
  /** 맨 아래 다른 문서로 가는 링크. 확장과 사이트 모두 같은 폴더에 privacy.html, terms.html을 둔다. */
  other: { href: string; label: string };
}

/**
 * 약관 페이지 본문. 확장은 브라우저 언어로 골라 그리고, 사이트는 빌드할 때 언어별 HTML로 만든다.
 * 스타일은 `@dropskeeper/legal/legal.css`, 글꼴은 `@dropskeeper/legal/fonts.css`(popup-ui theme.css를 쓰지 않을 때).
 */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <main>
      <h1>{doc.title}</h1>
      <p className="meta">{doc.effective}</p>
      <p className="lead">{doc.lead}</p>
      {doc.body}
      <nav>
        <a href={doc.other.href}>{doc.other.label}</a>
      </nav>
    </main>
  );
}
