// 빌드가 끝난 HTML마다, 본문 글자를 그리는 데 필요한 Pretendard 조각을 <link rel="preload">로 단다.
// Pretendard는 글자 범위(unicode-range)별 조각 92개로 나뉘어 있어서, 브라우저는 CSS를 받고 화면을 그려 본 뒤에야
// 어떤 조각이 필요한지 안다. 그 사이 시스템 글꼴로 그렸다가 바뀌는 것을 줄이려고 조각을 미리 받게 한다.
// 데모처럼 나중에 바뀌는 문구의 조각은 지금처럼 그때 받는다.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FAMILY = 'Pretendard Variable';

/** 'U+AC00-AC0F,U+1F??' → [[시작, 끝], ...] */
function parseRange(value) {
  return value.split(',').map((part) => {
    const p = part.trim().replace(/^U\+/i, '');
    if (p.includes('-')) {
      const [a, b] = p.split('-');
      return [parseInt(a, 16), parseInt(b, 16)];
    }
    return [parseInt(p.replace(/\?/g, '0'), 16), parseInt(p.replace(/\?/g, 'F'), 16)];
  });
}

/** CSS 안의 Pretendard 조각: 파일 주소와 담당 글자 범위 */
function fontFaces(css) {
  const faces = [];
  for (const [, body] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    if (!body.includes(FAMILY)) continue;
    const url = body.match(/url\(["']?([^"')]+\.woff2)["']?\)/)?.[1];
    const range = body.match(/unicode-range:([^;}]+)/)?.[1];
    if (url && range) faces.push({ url, ranges: parseRange(range) });
  }
  return faces;
}

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** <body> 안에서 화면에 보이는 글자. 스크립트·스타일과 태그 속성은 뺀다. */
function visibleText(html) {
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] ?? '';
  return body
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
      e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (entities[e] ?? m),
    );
}

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

/** @returns {import('astro').AstroIntegration} */
export default function preloadFonts() {
  return {
    name: 'preload-fonts',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const cssCache = new Map();
        const loadCss = async (href) => {
          if (!cssCache.has(href)) cssCache.set(href, fontFaces(await readFile(join(root, href), 'utf8')));
          return cssCache.get(href);
        };

        for (const file of await htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const sheets = [...html.matchAll(/<link rel="stylesheet" href="(\/[^"]+\.css)"/g)].map((m) => m[1]);
          if (!sheets.length) continue;
          const faces = (await Promise.all(sheets.map(loadCss))).flat();
          const codes = new Set([...visibleText(html)].filter((c) => c.trim()).map((c) => c.codePointAt(0)));
          const urls = [...new Set(faces.filter((f) => [...codes].some((c) => f.ranges.some(([a, b]) => a <= c && c <= b))).map((f) => f.url))];
          if (!urls.length) continue;
          // CSS보다 먼저 받기 시작하도록 첫 스타일시트 앞에 둔다. 글꼴 preload는 crossorigin이 있어야 다시 받지 않는다.
          const links = urls.map((u) => `<link rel="preload" href="${u}" as="font" type="font/woff2" crossorigin>`).join('');
          const at = html.indexOf('<link rel="stylesheet"');
          await writeFile(file, html.slice(0, at) + links + html.slice(at));
          logger.info(`${file.slice(root.length)}: ${urls.length}개`);
        }
      },
    },
  };
}
