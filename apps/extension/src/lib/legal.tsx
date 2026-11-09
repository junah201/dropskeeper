import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LegalPage, type LegalDoc } from '@dropskeeper/legal';
import { uiLang, type UiLang } from '@/lib/i18n';
import '@dropskeeper/legal/legal.css';

/**
 * 약관 페이지를 화면 언어로 그린다. 본문은 packages/legal에 언어별 JSX로 있다.
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
