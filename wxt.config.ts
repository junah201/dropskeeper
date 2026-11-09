import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { sourceHostPermissions } from './src/lib/sources/hosts';
import { BATTLENET_HOST_PERMISSIONS } from './src/lib/redeem/battlenet/constants';

// public/icon/ 의 PNG. 원본은 public/icon.svg
const ICONS = {
  16: 'icon/16.png',
  32: 'icon/32.png',
  48: 'icon/48.png',
  128: 'icon/128.png',
};

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'DropsKeeper',
    description: '스트리밍 드롭스 보상 코드를 모아 Battle.net에 차례로 등록합니다.',
    icons: ICONS,
    action: { default_icon: ICONS },
    permissions: ['storage'],
    host_permissions: [...sourceHostPermissions, ...BATTLENET_HOST_PERMISSIONS],
  },
});
