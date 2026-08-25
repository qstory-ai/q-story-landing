import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

const [
  buildDirArg = 'dist',
  outputArg = '../../output/passhacker/qstory-landing.html',
  compatibleAssetsDirArg = '../../output/passhacker/assets',
] = process.argv.slice(2);

const buildDir = resolve(buildDirArg);
const outputPath = resolve(outputArg);
const indexPath = resolve(buildDir, 'index.html');
const compatibleAssetsDir = resolve(compatibleAssetsDirArg);

const compatibleAssetOverrides = {
  '/assets/hansel-gretel-hero.webp': resolve(compatibleAssetsDir, 'hansel-gretel-hero.jpg'),
  '/assets/hansel-gretel-parent-talk.webp': resolve(
    compatibleAssetsDir,
    'hansel-gretel-parent-talk.jpg'
  ),
  '/assets/q-story-hero-composite.jpg': resolve(
    compatibleAssetsDir,
    'q-story-hero-composite.jpg'
  ),
  '/assets/q-story-logo.svg': resolve(compatibleAssetsDir, 'q-story-logo-framed.png'),
  '/assets/q-story-question-sky.webp': resolve(compatibleAssetsDir, 'q-story-question-sky.jpg'),
};

const iconGlyphs = {
  'i-check': '✓',
  'i-arrow': '→',
  'i-mic': '●',
  'i-pencil': '✎',
  'i-book': '▤',
  'i-sparkles': '✦',
  'i-shield': '✓',
  'i-question': '?',
  'i-play': '▶',
  'i-retry': '↻',
  'i-report': '▤',
  'i-users': '●●',
  'i-clock': '◷',
  'i-history': '↶',
  'i-route': '↝',
  'i-search-check': '⌕',
  'i-user': '●',
  'i-voice': '◖',
  'i-consent': '☑',
};

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function assetPath(url) {
  if (!url.startsWith('/assets/')) {
    throw new Error(`Unexpected local asset URL: ${url}`);
  }
  return resolve(buildDir, url.slice(1));
}

async function asDataUrl(url) {
  const path = compatibleAssetOverrides[url] ?? assetPath(url);
  const mimeType = mimeTypes[extname(path).toLowerCase()];
  if (!mimeType) throw new Error(`Unsupported image type: ${path}`);
  const data = await readFile(path);
  return `data:${mimeType};base64,${data.toString('base64')}`;
}

let html = await readFile(indexPath, 'utf8');

// PassHacker flattens an anchor and all of its descendants into one Button
// component. In the brand lockup that makes the icon, wordmark and slogan
// share the same origin. Use a neutral container for the import artifact so
// the three descendants remain independently positioned layers.
html = html.replace(
  /<a class="brand" href="#top" aria-label="Q-Story 홈">([\s\S]*?)<\/a>/,
  '<div class="brand" aria-label="Q-Story 홈">$1</div>'
);
html = html.replace(
  /<a class="brand brand--dark" href="#top" aria-label="Q-Story 홈">([\s\S]*?)<\/a>/,
  '<div class="brand brand--dark" aria-label="Q-Story 홈">$1</div>'
);

// The importer turns every desktop navigation link into a separate mobile
// layer at the same coordinates. The compact header CTA remains available,
// while section navigation is intentionally removed from this artifact.
html = html.replace(/\s*<nav class="desktop-nav"[\s\S]*?<\/nav>/, '');
html = html.replace(/\s*<nav class="mobile-section-nav"[\s\S]*?<\/nav>/, '');

// Flatten the multi-layer hero mockup into one image. This prevents the
// speech bubble, caption and change badge from colliding on mobile.
html = html.replace(
  /<div class="hero-visual"[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
  `<div class="hero-visual hero-visual--composite" aria-label="&#50500;&#51060;&#51032; &#47568;&#47196; &#45804;&#46972;&#51648;&#45716; &#54760;&#51236;&#44284; &#44536;&#47112;&#53588; &#52404;&#54744; &#50696;&#49884;">
    <img src="/assets/q-story-hero-composite.jpg" alt="&#52285;&#47928;&#48512;&#53552; &#49332;&#54196;&#48372;&#51088;&#46972;&#45716; &#50500;&#51060;&#51032; &#49440;&#53469;&#51060; &#46041;&#54868; &#51473;&#44036; &#51109;&#47732;&#51012; &#48148;&#44984;&#45716; &#51109;&#47732;" width="1240" height="760" />
  </div>
  </div>
  </section>`
);

// PassHacker does not preserve SVG <use> icons. Replace them with plain-text
// glyphs so the imported page keeps the visual cues instead of empty boxes.
html = html.replace(/\s*<svg class="svg-defs"[\s\S]*?<\/svg>/, '');
html = html.replace(
  /<svg\b[^>]*class="[^"]*\bicon\b[^"]*"[^>]*>\s*<use\s+href="#([^"]+)"\s*\/>\s*<\/svg>/g,
  (_, symbolId) =>
    `<span class="icon icon-glyph icon-glyph--${symbolId}" aria-hidden="true">${iconGlyphs[symbolId] ?? '•'}&nbsp;</span>`
);

// The importer drops several nested inline labels. Promote those labels to
// simple block text elements that the visual builder reliably keeps.
html = html.replace(
  /<li><span>(0[1-3])<\/span><strong>([^<]+)<\/strong><p>([^<]+)<\/p><\/li>/g,
  '<li><p class="proof-number">$1</p><h3 class="proof-title">$2</h3><p>$3</p></li>'
);
html = html.replace(
  /<span class="step-number">([^<]+)<\/span>/g,
  '<p class="step-number">$1</p>'
);
html = html.replace(
  /<li>(<span class="icon icon-glyph[^<]+<\/span>)<span><strong>([^<]+)<\/strong>([^<]+)<\/span><\/li>/g,
  '<li>$1<div class="beta-fact-copy"><h3>$2</h3><p>$3</p></div></li>'
);

// The copyright year is normally inserted by JavaScript, which the import
// preview may not execute.
html = html.replace('<span data-year></span>', '2026');

// The visual builder turns the keyboard-only skip link into a visible CTA.
// Remove it from the import artifact; the source landing keeps it unchanged.
html = html.replace(/\s*<a class="skip-link"[^>]*>.*?<\/a>/s, '');

// This decorative image is intentionally omitted. It is hidden on smaller
// screens and the importer flattens it into an unwanted editable image layer.
html = html.replace(/\s*<img\s+class="hero-copy-art"[\s\S]*?\/>/, '');

// PassHacker's import preview may sandbox or remove JavaScript. Keep every
// experience CTA useful even when the runtime script cannot append a session ID.
html = html.replace(
  /(<a\b[^>]*\bdata-player-link\b[^>]*\bhref=")[^"]*(")/g,
  '$1https://play.qstory.ai.kr$2'
);

const stylesheetMatches = [
  ...html.matchAll(/<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g),
];
for (const match of stylesheetMatches) {
  const css = await readFile(assetPath(match[1]), 'utf8');
  html = html.replace(
    match[0],
    `<style>${css}\n
/* PassHacker import compatibility */
.site-header{position:relative!important;top:auto!important;right:auto!important;left:auto!important;background:#1b0d33!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
.hero{padding-top:0!important}
.reveal{opacity:1!important;transform:none!important}
.brand{position:relative!important;display:block!important;width:187px!important;height:42px!important}
.logo-frame--paper{position:absolute!important;left:0!important;top:0!important;width:42px!important;height:42px!important;padding:0!important;background:transparent!important;box-shadow:none!important}
.brand-lockup{position:absolute!important;left:54px!important;top:0!important;display:block!important;width:133px!important;height:42px!important}
.wordmark{display:block!important;line-height:1.05!important}
.brand-slogan{display:block!important;margin-top:2px!important;line-height:1.05!important}
.hero-visual--composite{padding:0!important}
.hero-visual--composite img{display:block!important;width:100%!important;height:auto!important}
.icon-glyph{display:inline-flex!important;align-items:center!important;justify-content:center!important;font-family:Arial,sans-serif!important;font-style:normal!important;line-height:1!important;text-decoration:none!important}
.icon-glyph--i-mic{font-size:.62em!important;border:2px solid currentColor!important;border-radius:999px!important}
.icon-glyph--i-users{font-size:.58em!important;letter-spacing:-.18em!important}
.proof-points .proof-number{grid-row:1 / 3;margin:0;color:#8a78aa;font-size:.78rem;font-weight:800;letter-spacing:.08em}
.proof-points .proof-title{margin:0;font-size:1.02rem;line-height:1.45}
.beta-fact-copy h3{margin:0 0 1px;color:var(--ink);font-size:.96rem;line-height:1.5}
.beta-fact-copy p{margin:0;color:var(--muted);font-size:.84rem;line-height:1.55}
@media(max-width:720px){.brand{width:170px!important;height:38px!important}.logo-frame--paper{width:38px!important;height:38px!important}.brand-lockup{left:46px!important;width:124px!important;height:38px!important}}
</style>`
  );
}

const scriptMatches = [
  ...html.matchAll(/<script type="module" crossorigin src="(\/assets\/[^"]+\.js)"><\/script>/g),
];
for (const match of scriptMatches) {
  const javascript = await readFile(assetPath(match[1]), 'utf8');
  html = html.replace(match[0], `<script type="module">${javascript}</script>`);
}

html = html.replace(
  /\s*<link rel="preload" href="\/assets\/[^"]+" as="image" type="[^"]+" \/>/g,
  ''
);

const imageUrls = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]))];
for (const url of imageUrls) {
  html = html.replaceAll(url, await asDataUrl(url));
}

if (/\/assets\//.test(html)) {
  throw new Error('The generated HTML still contains local /assets/ references.');
}

const byteLength = Buffer.byteLength(html);
const maxBytes = 2 * 1024 * 1024;
if (byteLength > maxBytes) {
  throw new Error(`Generated HTML is ${(byteLength / 1024 / 1024).toFixed(2)}MB; PassHacker allows 2MB.`);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, html);

console.log(`${outputPath} (${(byteLength / 1024).toFixed(1)}KB)`);
