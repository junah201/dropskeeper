// 언어별 페이지 주소와 서로의 다른 언어 주소(hreflang)를 담는다. 주소 꼴은 Base.astro의 canonical과 같다.
// 언어 없는 주소(/, /privacy)는 옮겨 주기만 하는 noindex 페이지라 넣지 않는다.
import type { APIRoute } from 'astro';
import { fallbackLang, href, langs, pages, type Lang } from '../i18n';

export const GET: APIRoute = ({ site }) => {
  const url = (lang: Lang, page: string) => new URL(href(lang, page), site).href;
  const entries = pages.flatMap((page) => {
    const alternates = [
      ...langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${url(l, page)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(fallbackLang, page)}"/>`,
    ].join('\n');
    return langs.map((lang) => `  <url>\n    <loc>${url(lang, page)}</loc>\n${alternates}\n  </url>`);
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
