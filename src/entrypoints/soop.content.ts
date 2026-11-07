import { sourceMetas } from '@/lib/sources/hosts';
import { soopSource } from '@/lib/sources/soop';
import { serveSource } from '@/lib/sources/serve';

export default defineContentScript({
  matches: sourceMetas.soop.matches,
  main() {
    serveSource(soopSource);
  },
});
