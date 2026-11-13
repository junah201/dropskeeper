import { sourceMetas } from '@/lib/sources/hosts';
import { chzzkSource } from '@/lib/sources/chzzk';
import { serveSource } from '@/lib/sources/serve';
import { watchInventory } from '@/lib/sources/inventoryCard';

export default defineContentScript({
  matches: sourceMetas.chzzk.matches,
  main(ctx) {
    serveSource(chzzkSource);
    watchInventory('chzzk', ctx);
  },
});
