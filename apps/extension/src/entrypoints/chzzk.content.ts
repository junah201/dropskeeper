import { sourceMetas } from '@/lib/sources/hosts';
import { chzzkSource } from '@/lib/sources/chzzk';
import { serveSource } from '@/lib/sources/serve';

export default defineContentScript({
  matches: sourceMetas.chzzk.matches,
  main() {
    serveSource(chzzkSource);
  },
});
