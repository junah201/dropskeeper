import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import preact from '@preact/preset-vite';
import { sourceHostPermissions } from './src/lib/sources/hosts';
import { BATTLENET_HOST_PERMISSIONS } from './src/lib/redeem/battlenet/constants';

// public/icon/의 PNG. 원본은 public/icon.svg
const ICONS = {
  16: 'icon/16.png',
  32: 'icon/32.png',
  48: 'icon/48.png',
  128: 'icon/128.png',
};

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/i18n/module'],
  vite: () => ({
    plugins: [preact(), tailwindcss()],
    // preact는 선택적 peer(preact-render-to-string) 때문에 워크스페이스마다 다른 사본으로 설치될 수 있다.
    // 두 벌이 번들에 들어가면 훅이 깨지므로 하나로 모은다.
    resolve: { dedupe: ['preact'] },
  }),
  manifest: {
    // 문구는 src/locales/*.yml. 브라우저 언어가 ko도 en도 아니면 default_locale(en)을 쓴다.
    default_locale: 'en',
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    icons: ICONS,
    action: { default_icon: ICONS },
    permissions: ['storage'],
    host_permissions: [...sourceHostPermissions, ...BATTLENET_HOST_PERMISSIONS],
  },
});
