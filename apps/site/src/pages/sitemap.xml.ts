// 언어별 페이지 주소를 담는다. 주소 꼴은 Base.astro의 canonical과 같다.
// 언어별 짝(hreflang)은 각 페이지 <head>에 있으니 여기엔 넣지 않는다. 넣으면 XHTML 요소가 섞여 Chrome이 XML 트리로 보여 주지 않는다.
// 언어 없는 주소(/, /privacy)는 옮겨 주기만 하는 noindex 페이지라 넣지 않는다.
import type { APIRoute } from 'astro';
import { href, langs, pages } from '../i18n';

export const GET: APIRoute = ({ site }) => {
  const entries = pages.flatMap((page) =>
    langs.map((lang) => `  <url>\n    <loc>${new URL(href(lang, page), site).href}</loc>\n  </url>`),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
