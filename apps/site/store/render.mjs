// Chrome 웹 스토어 스크린샷(1280×800)을 찍어 store/<언어>/<번호>.png로 저장한다. 실행: node apps/site/store/render.mjs
// 개발 서버를 잠깐 띄워 src/pages/store/[lang]/[n].astro를 설치된 Chromium 계열 브라우저의 headless 모드로 찍는다.
// 다른 브라우저 경로면 CHROME_PATH로 넘긴다.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const PORT = 4329;
const SHOTS = 4;

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];
const browser = candidates.find((p) => p && existsSync(p));
if (!browser) throw new Error('Chromium 계열 브라우저를 찾지 못했어요. CHROME_PATH를 지정하세요.');

const server = spawn(`pnpm exec astro dev --port ${PORT}`, { cwd: site, shell: true, stdio: 'ignore' });
const stop = () => {
  // shell로 띄웠으므로 Windows에서는 프로세스 묶음째 끝낸다
  if (process.platform === 'win32') execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  else server.kill();
};

try {
  const base = `http://localhost:${PORT}`;
  for (let i = 0; ; i++) {
    if (i > 120) throw new Error('개발 서버가 뜨지 않았어요.');
    try {
      if ((await fetch(`${base}/store/ko/1`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  for (const lang of ['ko', 'en']) {
    mkdirSync(join(here, lang), { recursive: true });
    for (let n = 1; n <= SHOTS; n++) {
      const out = join(here, lang, `${n}.png`);
      execFileSync(browser, [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--force-device-scale-factor=1',
        '--window-size=1280,800',
        // 글꼴·그림과 등장 효과가 끝난 뒤 찍는다
        '--virtual-time-budget=8000',
        `--screenshot=${out}`,
        `${base}/store/${lang}/${n}`,
      ], { stdio: 'ignore' });
      console.log(out);
    }
  }
} finally {
  stop();
}
