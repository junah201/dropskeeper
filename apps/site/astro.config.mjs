// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://dropskeeper.junah.dev',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
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
