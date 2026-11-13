import { sourceMetas } from '@/lib/sources/hosts';
import { soopSource } from '@/lib/sources/soop';
import { serveSource } from '@/lib/sources/serve';
import { watchInventory } from '@/lib/sources/inventoryCard';

export default defineContentScript({
  matches: sourceMetas.soop.matches,
  main(ctx) {
    serveSource(soopSource);
    watchInventory('soop', ctx);
  },
});
