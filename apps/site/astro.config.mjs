// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://dropskeeper.junah.dev',
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
    // preact는 선택적 peer(preact-render-to-string) 때문에 패키지마다 다른 사본으로 설치될 수 있다(lucide-preact 등).
    // 두 벌이 번들에 들어가면 훅이 깨지므로 하나로 모은다.
    resolve: { dedupe: ['preact'] },
  },
  // 모든 페이지는 /ko/..., /en/... 아래에 있다. 언어 없는 주소(/privacy)는 브라우저 언어를 보고 옮겨 주는 페이지다(src/pages/*.astro).
  i18n: {
    locales: ['ko', 'en'],
    defaultLocale: 'ko',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  build: {
    // privacy.astro → privacy.html. 약관 본문의 ./terms.html 같은 링크가 확장과 사이트에서 똑같이 동작한다.
    format: 'preserve',
  },
});
