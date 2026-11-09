import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { uiLang, type UiLang } from '@/lib/i18n';
import '@/assets/legal.css';

/** 약관 문서 한 언어분 */
export interface LegalDoc {
  title: string;
  effective: string;
  lead: ReactNode;
  body: ReactNode;
  /** 맨 아래 다른 문서로 가는 링크 */
  other: { href: string; label: string };
}

function LegalPage({ doc }: { doc: LegalDoc }) {
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

/**
 * 약관 페이지를 화면 언어로 그린다. 본문은 문장이 길고 표·목록이 섞여 있어 locales 대신 언어별 JSX로 둔다.
 */
export function mountLegalPage(docs: Record<UiLang, LegalDoc>) {
  const lang = uiLang();
  const doc = docs[lang];
  document.documentElement.lang = lang;
  document.title = `${doc.title} · DropsKeeper`;
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LegalPage doc={doc} />
    </StrictMode>,
  );
}
