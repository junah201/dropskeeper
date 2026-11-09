// og.html을 언어별로 찍어 public/og/<언어>.png로 저장한다. 실행: node apps/site/og/render.mjs
// 설치된 Chromium 계열 브라우저의 headless 모드를 쓴다. 다른 경로면 CHROME_PATH로 넘긴다.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '../public/og');

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

mkdirSync(outDir, { recursive: true });
for (const lang of ['ko', 'en']) {
  const url = `${pathToFileURL(join(here, 'og.html')).href}?lang=${lang}`;
  const out = join(outDir, `${lang}.png`);
  execFileSync(browser, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    // 글꼴과 그림을 다 불러온 뒤 찍는다
    '--virtual-time-budget=3000',
    `--screenshot=${out}`,
    url,
  ], { stdio: 'ignore' });
  console.log(out);
}
