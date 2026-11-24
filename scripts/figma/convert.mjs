// Figma get_design_context(React+Tailwind) 출력 -> 노드별 CSS 클래스 + HTML 조각.
// node convert.mjs <figDir> <landingDir> <outDir>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [figDir, landingDir, outDir] = process.argv.slice(2).map((p) => path.resolve(p));
const require = createRequire(path.join(landingDir, 'package.json'));
const { JSDOM } = require('jsdom');

const PREFIX_FOLDER = {
  '2dbfcfaa-ec63-4e6f-a0b2-7b023cc0429a': 'hero1',
  '4b26b9cf-49f6-494b-b237-20254c73ce0c': 'hero2',
  '97cbc65b-525d-4415-8662-f877f729106f': 'hero3',
  'ca0d5e86-1148-4668-9459-9e4e9abff394': 'problem',
  'e03cea7a-0c15-46b3-b5ec-9735928a9899': 'pain',
  'dc52d777-cc34-4741-bac2-6094516cbc6b': 'worry',
  '25b19a9b-2d52-4cd8-8691-bba2fc1ea826': 'transition',
  'fa1748f3-e03b-4cc4-bea8-3860488b1290': 'research',
  'c00c8d3b-2faa-4da1-9498-9e565186fb41': 'point1',
  'e21b0fc0-75c2-4c58-99a0-d86e909f04b5': 'point1b',
  '2a19ba39-c387-4e11-a8b5-e3c3182f0ebb': 'point1c',
  'd4ea8f7a-6c45-435b-bc43-36efc9e10ae7': 'point2',
  'b7a6c9bf-d8e9-4713-b786-06750157aad1': 'solution',
  '1330994f-3bb4-49d4-ad79-e25e8ba203b6': 'cta',
  'c739cfa5-89ec-4cf8-b37a-529370993b97': 'faq',
};
const assetRoot = path.join(landingDir, 'public/assets/figma');
const folders = fs.readdirSync(assetRoot);
const findAsset = (folder, rawFile) => {
  // 비트맵(png·jpg)은 WebP로 바꿔 두었으니 같은 이름의 .webp가 있으면 그걸 쓴다.
  const webp = rawFile.replace(/\.(png|jpe?g)$/i, '.webp');
  const has = (f, name) => fs.existsSync(path.join(assetRoot, f, name));
  const file = webp !== rawFile && (has(folder, webp) || folders.some((f) => has(f, webp))) ? webp : rawFile;
  if (folder && fs.existsSync(path.join(assetRoot, folder, file))) return `/assets/figma/${folder}/${file}`;
  const other = folders.find((f) => fs.existsSync(path.join(assetRoot, f, file)));
  if (!other) throw new Error(`asset missing: ${file}`);
  return `/assets/figma/${other}/${file}`;
};

// var(--x, fallback) -> fallback (중첩 포함)
function resolveVars(v) {
  let i;
  while ((i = v.indexOf('var(')) !== -1) {
    let depth = 0;
    let comma = -1;
    let end = -1;
    for (let j = i + 4; j < v.length; j++) {
      const ch = v[j];
      if (ch === '(') depth++;
      else if (ch === ')') {
        if (depth === 0) {
          end = j;
          break;
        }
        depth--;
      } else if (ch === ',' && depth === 0 && comma === -1) comma = j;
    }
    const fallback = comma === -1 ? '' : v.slice(comma + 1, end).trim();
    v = v.slice(0, i) + fallback + v.slice(end + 1);
  }
  return v;
}

// 굵기는 Figma보다 한 단계씩 올린다(2026-11-23 요청: 나눔스퀘어라운드가 화면에서 얇아 보임).
// Regular 400 -> Bold 700, Bold 700 -> ExtraBold 800. ExtraBold는 이 글꼴의 최대라 800 그대로.
const FONT = {
  'NanumSquareRound:Regular': ["'NanumSquareRound'", 700],
  'NanumSquareRound:Bold': ["'NanumSquareRound'", 800],
  'NanumSquareRound:ExtraBold': ["'NanumSquareRound'", 800],
  'NanumGothic:Bold': ["'Nanum Gothic'", 800],
};

// 디자인시스템(Figma 140:33 > Qstory > Typography 176:1439) 글씨 규격. 시안 크기를 가까운 단계로 옮긴다.
// [크기, 줄 높이, 자간]. 굵기는 손대지 않는다(사용자 요청으로 한 단계 올린 값 유지).
// 정수가 아닌 크기와 12px 미만은 앱 화면 목업 속 글자라 제외한다.
const TYPE_SCALE = {
  60: ['48px', '60px', '-0.01em'], // Display
  45: ['36px', '46px', '-0.01em'], // Heading 1
  40: ['30px', '40px', '-0.01em'], // Heading 2
  35: ['24px', '34px', '0'], // Heading 3
  30: ['24px', '34px', '0'], // Heading 3
  25: ['24px', '30px', '0'], // Heading 4
  24: ['24px', '30px', '0'], // Heading 4
  20: ['18px', '24px', '0'], // Body Large
  15: ['14px', '22px', '0'], // Body Small
  12: ['12px', '18px', '0'], // Caption
};
function applyTypeScale(decl) {
  const m = /^(\d+)px$/.exec(decl['font-size'] ?? '');
  const step = m && TYPE_SCALE[m[1]];
  if (!step) return;
  const [size, lineHeight, spacing] = step;
  decl['font-size'] = size;
  // line-height 0은 줄 높이를 자식 글자에 맡긴 묶음이라 그대로 둔다.
  if (decl['line-height'] !== undefined && decl['line-height'] !== '0') decl['line-height'] = lineHeight;
  decl['letter-spacing'] = spacing;
}
const isLength = (v) => /^-?[\d.]+(px|%|em|rem)?$/.test(v) || v === '0';
const isColor = (v) => /^(#|rgba?\(|hsla?\(|white|black|transparent)/.test(v);

const fixCalc = (v) => v.replace(/calc\(([^()]*)\)/g, (_, inner) => `calc(${inner.replace(/([\d%a-z)])([+-])(?=[\d.(])/g, '$1 $2 ')})`);

function convert(classList) {
  const d = {};
  let tx = null;
  let ty = null;
  let sx = null;
  let sy = null;
  const transforms = [];
  const set = (k, v) => {
    d[k] = typeof v === 'string' ? fixCalc(v) : v;
  };
  for (const raw of classList) {
    const c = raw.replace(/\\\//g, '/');
    const arb = c.match(/^(-?)([a-z0-9-]*?)-?\[(.+)\]$/);
    if (c.startsWith('[') && c.endsWith(']')) {
      const [prop, ...rest] = c.slice(1, -1).split(':');
      set(prop, resolveVars(rest.join(':').replace(/_/g, ' ')));
      continue;
    }
    if (arb) {
      const neg = arb[1] === '-';
      const key = arb[2];
      let v = arb[3];
      if (!v.includes('url(')) v = v.replace(/_/g, ' ');
      if (key === 'font' && v.startsWith('family-name:')) v = v.slice('family-name:'.length);
      v = resolveVars(v);
      if (neg) v = `-${v}`;
      switch (key) {
        case 'left':
        case 'top':
        case 'right':
        case 'bottom':
        case 'inset':
          set(key, v);
          break;
        case 'w':
          set('width', v);
          break;
        case 'h':
          set('height', v);
          break;
        case 'size':
          set('width', v);
          set('height', v);
          break;
        case 'min-w':
          set('min-width', v);
          break;
        case 'max-w':
          set('max-width', v);
          break;
        case 'bg':
          set('background-color', v);
          break;
        case 'text':
          if (v.startsWith('color:')) set('color', v.slice(6));
          else if (v.startsWith('length:')) set('font-size', v.slice(7));
          else if (isLength(v)) set('font-size', v);
          else set('color', v);
          break;
        case 'font': {
          const name = v.replace(/^'|'$/g, '');
          if (FONT[name]) {
            set('font-family', FONT[name][0]);
            set('font-weight', FONT[name][1]);
          } else if (/^\d+$/.test(v)) set('font-weight', v);
          break;
        }
        case 'leading':
          set('line-height', v);
          break;
        case 'tracking':
          set('letter-spacing', v);
          break;
        case 'rounded':
          set('border-radius', v);
          break;
        case 'rounded-tl':
          set('border-top-left-radius', v);
          break;
        case 'rounded-tr':
          set('border-top-right-radius', v);
          break;
        case 'rounded-bl':
          set('border-bottom-left-radius', v);
          break;
        case 'rounded-br':
          set('border-bottom-right-radius', v);
          break;
        case 'border':
          if (isLength(v)) set('border-width', v);
          else set('border-color', v);
          break;
        case 'shadow':
          set('box-shadow', v);
          break;
        case 'drop-shadow':
          set('filter', `drop-shadow(${v})`);
          break;
        case 'gap':
          set('gap', v);
          break;
        case 'p':
          set('padding', v);
          break;
        case 'px':
          set('padding-left', v);
          set('padding-right', v);
          break;
        case 'py':
          set('padding-top', v);
          set('padding-bottom', v);
          break;
        case 'pt':
          set('padding-top', v);
          break;
        case 'pb':
          set('padding-bottom', v);
          break;
        case 'pl':
          set('padding-left', v);
          break;
        case 'pr':
          set('padding-right', v);
          break;
        case 'rotate':
          set('rotate', v);
          break;
        case 'skew-x':
          transforms.push(`skewX(${v})`);
          break;
        case 'flex':
          set('flex', v);
          break;
        case 'opacity':
          set('opacity', v);
          break;
        default:
          throw new Error(`unknown arbitrary class ${raw}`);
      }
      continue;
    }
    switch (c) {
      case 'absolute':
      case 'relative':
        set('position', c);
        break;
      case 'block':
      case 'flex':
      case 'contents':
        set('display', c);
        break;
      case 'size-full':
        set('width', '100%');
        set('height', '100%');
        break;
      case 'w-full':
        set('width', '100%');
        break;
      case 'h-full':
        set('height', '100%');
        break;
      case 'w-0':
        set('width', '0');
        break;
      case 'h-0':
        set('height', '0');
        break;
      case 'inset-0':
        set('inset', '0');
        break;
      case 'top-0':
        set('top', '0');
        break;
      case 'left-0':
        set('left', '0');
        break;
      case 'left-1/2':
        set('left', '50%');
        break;
      case 'top-1/2':
        set('top', '50%');
        break;
      case '-translate-x-1/2':
        tx = '-50%';
        break;
      case '-translate-y-1/2':
        ty = '-50%';
        break;
      case '-scale-y-100':
        sy = '-1';
        break;
      case '-scale-x-100':
        sx = '-1';
        break;
      case 'rotate-90':
        set('rotate', '90deg');
        break;
      case 'rotate-180':
        set('rotate', '180deg');
        break;
      case 'shrink-0':
        set('flex-shrink', '0');
        break;
      case 'flex-none':
        set('flex', 'none');
        break;
      case 'flex-col':
        set('flex-direction', 'column');
        break;
      case 'items-center':
        set('align-items', 'center');
        break;
      case 'items-start':
        set('align-items', 'flex-start');
        break;
      case 'justify-center':
        set('justify-content', 'center');
        break;
      case 'justify-between':
        set('justify-content', 'space-between');
        break;
      case 'content-stretch':
        set('align-content', 'stretch');
        break;
      case 'text-center':
        set('text-align', 'center');
        break;
      case 'text-white':
        set('color', '#fff');
        break;
      case 'text-black':
        set('color', '#1a1c20');
        break;
      case 'bg-white':
        set('background-color', '#fff');
        break;
      case 'whitespace-nowrap':
        set('white-space', 'nowrap');
        break;
      case 'whitespace-pre':
        set('white-space', 'pre');
        break;
      case 'whitespace-pre-wrap':
        set('white-space', 'pre-wrap');
        break;
      case 'overflow-clip':
        set('overflow', 'clip');
        break;
      case 'not-italic':
        set('font-style', 'normal');
        break;
      case 'mb-0':
        set('margin-bottom', '0');
        break;
      case 'max-w-none':
        set('max-width', 'none');
        break;
      case 'min-w-px':
        set('min-width', '1px');
        break;
      case 'pointer-events-none':
        set('pointer-events', 'none');
        break;
      case 'object-cover':
        set('object-fit', 'cover');
        break;
      case 'opacity-30':
        set('opacity', '0.3');
        break;
      case 'border':
        set('border-width', '1px');
        break;
      case 'border-2':
        set('border-width', '2px');
        break;
      case 'border-3':
        set('border-width', '3px');
        break;
      case 'border-t':
        set('border-top-width', '1px');
        break;
      case 'border-solid':
        set('border-style', 'solid');
        break;
      case 'border-white':
        set('border-color', '#fff');
        break;
      default:
        throw new Error(`unknown class ${raw}`);
    }
  }
  if (tx || ty) set('translate', `${tx ?? '0'} ${ty ?? '0'}`);
  if (sx || sy) set('scale', `${sx ?? '1'} ${sy ?? '1'}`);
  if (transforms.length) set('transform', transforms.join(' '));
  return d;
}

const sanitize = (id) => id.replace(/:/g, '-').replace(/;/g, '_');
const css = [];

fs.mkdirSync(outDir, { recursive: true });
for (const file of fs.readdirSync(figDir).filter((f) => f.endsWith('.jsx'))) {
  const src = fs.readFileSync(path.join(figDir, file), 'utf8');
  const prefix = src.match(/assetPathPrefix = "https:\/\/www\.figma\.com\/api\/mcp\/asset\/([\w-]+)"/)?.[1];
  const folder = prefix ? PREFIX_FOLDER[prefix] : null;
  if (prefix && !folder) throw new Error(`unknown prefix ${prefix}`);
  const consts = {};
  for (const m of src.matchAll(/const (\w+) = `\$\{assetPathPrefix\}\/([\w.]+)`;/g)) consts[m[1]] = m[2];
  let body = src.slice(src.indexOf('return (') + 8, src.lastIndexOf(');'));
  body = body
    .replace(/className=/g, 'class=')
    .replace(/src=\{(\w+)\}/g, (_, n) => `src="${findAsset(folder, consts[n])}"`)
    .replace(/style=\{\{ containerType: "size" \}\}/g, 'data-cq="1"')
    .replace(/\baria-hidden(?=[\s>])/g, 'aria-hidden="true"')
    .replace(/\{`([^`]*)`\}/g, (_, t) => t)
    .replace(/\{"([^"]*)"\}/g, (_, t) => t)
    .replace(/<(\w+)((?:[^<>"]|"[^"]*")*?)\s*\/>/g, (_, tag, attrs) => (tag === 'img' ? `<img${attrs}>` : `<${tag}${attrs}></${tag}>`));
  if (/[{}]/.test(body.replace(/"[^"]*"/g, ''))) {
    const left = body.replace(/"[^"]*"/g, '').match(/.{0,60}[{}].{0,60}/);
    throw new Error(`${file}: leftover JSX ${left?.[0]}`);
  }
  const dom = new JSDOM(`<body>${body}</body>`);
  const root = dom.window.document.body.firstElementChild;
  let anon = 0;
  const walk = (el, parentName) => {
    const id = el.getAttribute('data-node-id');
    const name = id ? `n-${sanitize(id)}` : `${parentName}-a${anon++}`;
    const decl = convert((el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean));
    applyTypeScale(decl);
    if (el.hasAttribute('data-cq')) decl['container-type'] = 'size';
    el.removeAttribute('data-cq');
    el.removeAttribute('data-node-id');
    el.removeAttribute('data-name');
    el.setAttribute('class', name);
    if (el.tagName === 'IMG') {
      el.removeAttribute('width');
      el.removeAttribute('height');
    }
    css.push(`.${name}{${Object.entries(decl).map(([k, v]) => `${k}:${v}`).join(';')}}`);
    for (const node of [...el.childNodes]) {
      if (node.nodeType === 3 && node.data.includes('\n')) {
        // JSX 공백 규칙: 줄마다 앞뒤 공백을 지우고 빈 줄은 버린 뒤 한 칸으로 잇는다.
        node.data = node.data.split('\n').map((line) => line.trim()).filter(Boolean).join(' ');
      }
    }
    [...el.children].forEach((child) => walk(child, name));
  };
  walk(root, 'x');
  fs.writeFileSync(path.join(outDir, file.replace('.jsx', '.html')), root.outerHTML);
}
fs.writeFileSync(path.join(outDir, 'figma.css'), `${css.join('\n')}\n`);
console.log('rules', css.length);
