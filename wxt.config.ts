import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { sourceHostPermissions } from './src/lib/sources/hosts';
import { BATTLENET_HOST_PERMISSIONS } from './src/lib/redeem/battlenet/constants';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'DropsKeeper',
    description: '스트리밍 드롭스 보상 코드를 모아 Battle.net에 차례로 등록합니다.',
    permissions: ['storage'],
    host_permissions: [...sourceHostPermissions, ...BATTLENET_HOST_PERMISSIONS],
  },
});
