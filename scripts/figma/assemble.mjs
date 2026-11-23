// out/*.html 조각을 묶어 landing/index.html 을 만든다.
// node assemble.mjs <outDir> <landingDir>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { mobileHeader, mobileSections } from './mobile.mjs';

const [outDir, landingDir] = process.argv.slice(2).map((p) => path.resolve(p));
const require = createRequire(path.join(landingDir, 'package.json'));
const { JSDOM } = require('jsdom');
const { document } = new JSDOM('<body></body>').window;

const load = (id) => {
  const holder = document.createElement('div');
  holder.innerHTML = fs.readFileSync(path.join(outDir, `${id}.html`), 'utf8');
  return holder.firstElementChild;
};
const node = (root, id) => {
  const el = root.querySelector(`.n-${id.replace(/:/g, '-')}`);
  if (!el) throw new Error(`node ${id} missing`);
  return el;
};
const retag = (el, tag, attrs = {}) => {
  const next = document.createElement(tag);
  for (const a of el.attributes) next.setAttribute(a.name, a.value);
  for (const [k, v] of Object.entries(attrs)) next.setAttribute(k, v);
  while (el.firstChild) next.appendChild(el.firstChild);
  el.replaceWith(next);
  return next;
};
const art = (root, height, extra = '') => `<div class="art fig${extra}" style="--h:${height}px">${root.outerHTML}</div>`;

// 자주 묻는 질문 내용. 데스크톱 목록과 모바일 목록이 함께 쓴다.
const faqData = [
  ['무료로 체험할 수 있나요? 어떤 동화가 있나요?', '현재 공개 체험은 무료예요. 앱 설치나 회원가입 없이 「헨젤과 그레텔」 한 편을 시작할 수 있어요.'],
  ['몇 살 아이와 함께 보면 좋을까요?', '유아와 초등학교 저학년의 질문·표현 경험을 중심으로 기획하고 있어요. 처음에는 보호자나 선생님이 함께 보면서 줄거리와 조작이 아이에게 맞는지 확인해주세요. 적합한 난이도는 아이의 이해와 말하기 방식에 따라 다를 수 있어요.'],
  ['동화 영상이나 오디오북과 무엇이 다른가요?', '같은 이야기를 보면서 등장인물에게 질문하고, 아이의 느낌이나 생각을 들려줄 수 있어요. 캐릭터가 그 말에 반응하고, 일부 준비된 장면에서는 아이의 제안이 다른 전개로 이어져요. 질문과 대화는 체험 뒤 다시 돌아볼 수 있어요.'],
  ['부모나 선생님이 계속 읽어줘야 하나요?', '낭독은 Q-Story가 제공해요. 처음에는 곁에서 조작을 도와주고, 아이가 어떤 장면에 관심을 보이는지 함께 봐주세요. 모든 질문에 답을 준비할 필요는 없어요. 아이가 말하면 먼저 듣고, 궁금한 순간에는 잠시 멈춰 함께 이야기해보세요.'],
  ['AI 캐릭터의 답을 그대로 믿어도 되나요?', 'AI가 아이의 말을 잘못 이해하거나 부정확하게 답할 수 있어요. 캐릭터의 답은 동화 속 대화로 받아들이고, 실제 사실 확인이 필요한 내용은 어른과 함께 살펴봐주세요. 이상한 반응이나 오류가 있다면 팀에 알려주세요.'],
  ['어떤 기기에서 이용하나요? 글을 몰라도 괜찮나요?', '유치원 및 기관에서는 웹 브라우저에서 그림과 낭독을 보며 체험해요. 가정에서는 아이패드 이용을 권장해요. 읽기에 익숙하지 않아도 성인과 함께 이야기 흐름을 따라갈 수 있어요. 말로 대화할 때는 마이크 권한이 필요하고, 음성이 잘 인식되지 않으면 어른이 글 입력을 도와줄 수 있어요.'],
  ['읽은 뒤 부모나 선생님은 무엇을 볼 수 있나요?', '읽은 이야기와 아이가 남긴 질문·대화를 리포트에서 돌아볼 수 있어요. 무엇에 관심을 보였는지 실제 발화를 함께 살펴보는 기록이에요. 아이의 성격이나 발달 수준을 진단하는 검사는 아니며, 표시되는 항목은 이용 방식에 따라 달라질 수 있어요.'],
  ['아이의 질문과 사용 기록은 어떻게 처리되나요?', '아이의 질문은 음성을 글로 바꾸고 확인을 거친 뒤 캐릭터의 답을 만드는 데 쓰여요. 질문 문장과 대화 기록은 서비스 개선을 위해 1년 보관하고, 전화번호·이메일 같은 연락처는 자동으로 가려서 저장해요. 대화 내용은 보호자·선생님 리포트에 그대로 보여요. 음성 원본은 보호자가 따로 동의한 경우에만 1년 보관하고, 화면 이용 기록은 1년 보관하며 언제든 끌 수 있어요. 답을 만들기 위해 질문 문장이 해외(미국) AI 서비스로 전송돼요. 개인정보 처리방침 전문은 곧 공개하며, 지금은 qstoryai@gmail.com으로 요청할 수 있어요.'],
];
const M = mobileSections(faqData);

// ---- 머리글: 첫 화면 시안의 메뉴 막대(872:157)를 그대로 고정 머리글로 쓴다.
const hero1 = load('911-1593');
const nav = node(hero1, '872:157');
nav.remove();
const logo = retag(node(nav, '872:159'), 'a', { href: '#top', 'aria-label': 'Q-Story 홈' });
logo.querySelector('img').setAttribute('alt', 'Q-Story');
const menu = retag(node(nav, '872:171'), 'nav', { 'aria-label': '주요 메뉴' });
menu.classList.add('header-nav');
[['872:172', '#about'], ['872:173', '#how'], ['872:174', '#together'], ['872:175', '#faq']].forEach(([id, href]) =>
  retag(node(menu, id), 'a', { href }),
);
retag(node(nav, '872:177'), 'a', { href: '#start', 'data-player-link': '', 'data-cta-location': 'header' });
retag(node(nav, '872:178'), 'button', {
  type: 'button',
  'aria-label': '메뉴 열기',
  'aria-expanded': 'false',
  'aria-controls': 'site-menu',
  'data-menu-button': '',
});

const header = `<header class="site-header" data-header>
      <div class="header-bar">${art(nav, 84)}</div>
      ${mobileHeader(logo.querySelector('img').getAttribute('src'))}
      <div class="site-menu" id="site-menu" hidden data-menu>
        <nav aria-label="전체 메뉴">
          <a href="#about">Q-Story 소개</a>
          <a href="#how">이용방법</a>
          <a href="#together">함께하기</a>
          <a href="#faq">자주 묻는 질문</a>
          <a href="/partner" data-partner-link data-cta-location="menu-partner">협업 문의하기</a>
        </nav>
        <div class="site-menu-actions">
          <a class="menu-login" data-app-login data-cta-location="menu-login" href="https://demo.qstory.ai.kr/login">로그인/회원가입</a>
          <a class="menu-start" data-player-link data-cta-location="menu" href="#start">무료로 체험하기</a>
        </div>
      </div>
    </header>`;

// 자동 넘김 정지/재생 버튼. 누르면 aria-pressed가 true가 되고 main.js가 자동 넘김을 멈춘다.
const autoToggle = (name) =>
  `<button type="button" class="auto-toggle auto-toggle--${name}" data-auto-toggle aria-pressed="false" aria-label="자동 넘김 멈추기"><span class="auto-toggle-icon" aria-hidden="true"></span></button>`;

// ---- 첫 화면: 시안 세 장을 겹쳐 두고 차례로 넘긴다.
const heroDefs = [
  { root: hero1, nav: null, cta: '911:1616', title: '911:1742', label: 'AI 시대, 우리 아이의 미래' },
  { root: load('911-1743'), nav: '911:1753', cta: '911:1748', title: '911:1778', label: '동화 속 친구에게 직접 질문해보세요' },
  { root: load('921-2015'), nav: '921:2020', cta: '921:2019', title: '921:2046', label: '정답을 찾는 아이보다 질문을 만드는 아이로' },
];
const slides = heroDefs
  .map((h, i) => {
    if (h.nav) node(h.root, h.nav).remove();
    retag(node(h.root, h.cta), 'a', { href: '#start', 'data-player-link': '', 'data-cta-location': `hero-${i + 1}` });
    retag(node(h.root, h.title), i === 0 ? 'h1' : 'h2');
    const on = i === 0;
    return `<div class="slide${on ? ' is-on' : ''}" data-slide="${i}" role="group" aria-roledescription="슬라이드" aria-label="${i + 1} / 3: ${h.label}"${on ? '' : ' aria-hidden="true" inert'}>${h.root.outerHTML}</div>`;
  })
  .join('');
const dots = heroDefs
  .map((h, i) => `<button type="button" class="hero-dot" data-dot="${i}" aria-label="${i + 1}번 슬라이드 보기"${i === 0 ? ' aria-current="true"' : ''}></button>`)
  .join('');
const hero = `<section class="sec" id="top" aria-roledescription="캐러셀" aria-label="Q-Story 소개" data-carousel>
        <div class="art fig hero-art" style="--h:900px">${slides}<div class="hero-dots">${dots}${autoToggle('hero')}</div></div>
        ${M.top}
      </section>`;

// ---- 일반 구역
const plain = (id, h, { secId, heading, label, mobile } = {}) => {
  const root = load(id);
  if (heading) retag(node(root, heading), 'h2');
  const attrs = secId ? ` id="${secId}"` : '';
  return `<section class="sec"${attrs}${label ? ` aria-label="${label}"` : ''}>
        ${art(root, h)}
        ${M[mobile]}
      </section>`;
};

// ---- POINT 1: 세 상태 화면을 겹쳐 두고, 항목을 누르면 그 상태로 바꾼다.
const accItems = ['자유롭게 멈추고 물어봐요', '캐릭터가 먼저 말을 걸어요', '생생한 삽화와 음성 낭독'];
const accStates = [
  { id: '929-486', boxes: [[125, 363.23, 1], [125, 571.59, 0], [125, 676.92, 0]] },
  { id: '937-1050', boxes: [[125.74, 360.9, 0], [125.74, 467.39, 1], [125, 676.92, 0]] },
  { id: '937-1117', boxes: [[120.71, 360.9, 0], [120.71, 467.18, 0], [120.71, 573.47, 1]] },
];
const accHtml = accStates
  .map((s, i) => {
    const root = load(s.id);
    const title = [...root.querySelectorAll('p')].find((p) => p.textContent.trim() === '아이와 캐릭터의 활발한 상호작용');
    retag(title, 'h2');
    const buttons = s.boxes
      .map(([x, y, open], k) => {
        const [w, h] = open ? [494.29, 184.03] : [490, 81];
        return `<button type="button" class="acc-hit" data-acc-item="${k}" aria-expanded="${open ? 'true' : 'false'}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${accItems[k]}</button>`;
      })
      .join('');
    return `<div class="acc-state" data-acc-state="${i}"${i === 0 ? '' : ' hidden'}>${root.outerHTML}${buttons}</div>`;
  })
  .join('');
const point1 = `<section class="sec" id="how" aria-label="POINT 1 아이와 캐릭터의 활발한 상호작용">
        <div class="art fig" style="--h:900px" data-acc>${accHtml}${autoToggle('acc')}</div>
        ${M.how}
      </section>`;

// ---- 시작하기(CTA)
const cta = load('929-757');
retag(node(cta, '929:760'), 'h2');
retag(node(cta, '929:763'), 'a', { href: '#start', 'data-player-link': '', 'data-cta-location': 'start' });
const ctaSec = `<section class="sec sec--purple" id="start" aria-label="무료 체험 시작">
        <div class="art fig" style="--h:505px">${cta.outerHTML}<p class="cta-status" data-cta-status aria-live="polite"></p></div>
        ${M.start}
      </section>`;

// ---- 자주 묻는 질문: 머리말은 시안 그대로, 목록은 열고 닫을 수 있게 흐름 배치로 다시 짠다.
const faqRoot = load('929-782');
const faqHead = [node(faqRoot, '929:783'), node(faqRoot, '929:785')];
faqHead[0] = retag(faqHead[0], 'h2');
const chevron = '<span class="faq-chev" aria-hidden="true"><img alt="" src="/assets/figma/faq/ef171.svg"></span>';
const faqList = faqData
  .map(
    ([q, a], i) => `<details class="faq-item${i >= 5 ? ' faq-item--box' : ''}"${i === 0 ? ' open' : ''}>
            <summary><span class="faq-q">Q</span><span class="faq-text">${q}</span>${chevron}</summary>
            <p class="faq-a">${a}</p>
          </details>`,
  )
  .join('\n          ');
const faqSec = `<section class="sec" id="faq" aria-label="자주 묻는 질문">
        <div class="art fig faq-art">
          <div class="n-929-782">${faqHead.map((e) => e.outerHTML).join('')}</div>
          <div class="faq-list">
          ${faqList}
          </div>
        </div>
        ${M.faq}
      </section>`;

// ---- 함께하기
const collab = load('929-822');
retag(node(collab, '929:823'), 'h2');
retag(node(collab, '929:841'), 'a', { href: '/partner', 'data-partner-link': '', 'data-cta-location': 'together' });
const collabSec = `<section class="sec" id="together" aria-label="함께하기">
        ${art(collab, 726)}
        ${M.together}
      </section>`;

// ---- 바닥글
const foot = load('929-860');
const links = node(foot, '929:862');
links.innerHTML =
  '<a href="#about">Q-story 소개</a>   <a href="#how">이용방법</a>   <a href="#together">함께하기</a>   <a href="#faq">FAQ</a>';
const contact = node(foot, '929:865');
contact.innerHTML =
  '<a href="mailto:qstoryai@gmail.com" data-email>qstoryai@gmail.com</a>          <a href="https://www.instagram.com/qstory.official/" target="_blank" rel="noopener">Instagram @qstory.official</a>';
node(foot, '929:881').innerHTML = '전화번호: <a href="tel:010-7543-6779">010-7543-6779</a> ';
retag(node(foot, '929:928'), 'button', { type: 'button', 'data-legal': 'privacy' });
retag(node(foot, '929:929'), 'button', { type: 'button', 'data-legal': 'terms' });
node(foot, '929:912').innerHTML = '© <span data-year>2026</span> Q-Story. All rights reserved.';
for (const id of ['929:861', '929:864', '929:879']) retag(node(foot, id), 'h2');
const legalNote = document.createElement('p');
legalNote.className = 'footer-legal-note';
legalNote.setAttribute('data-legal-note', '');
legalNote.setAttribute('aria-live', 'polite');
foot.appendChild(legalNote);
const footer = `<footer class="site-footer sec--purple">
      ${art(foot, 378.21)}
      ${M.footer}
    </footer>`;

const sections = [
  hero,
  plain('872-212', 900, { secId: 'about', label: '문제 정의', mobile: 'about' }),
  plain('922-297', 900, { label: '부모의 어려움', mobile: 'pain' }),
  plain('922-245', 900, { heading: '939:1696', label: '부모의 고민', mobile: 'worry' }),
  plain('922-338', 900, { label: 'Q-Story의 독서', mobile: 'reading' }),
  plain('929-440', 900, { secId: 'research', label: '연구 기반 설계', mobile: 'research' }),
  point1,
  plain('929-514', 900, { heading: '929:518', label: 'POINT 2 리포트', mobile: 'report' }),
  plain('929-714', 896, { label: 'Q-Story가 만드는 변화', mobile: 'change' }),
  ctaSec,
  faqSec,
  collabSec,
].join('\n\n      ');

// 머리글(로고) 밖의 그림은 모두 지연 로딩한다. 화면에 보이는 그림은 배치가 끝나는 즉시 받고, 아래쪽 그림은 스크롤해 다가올 때 받는다.
// 모바일에서 숨긴 데스크톱 무대(display:none)의 그림도 지연 로딩이라 받지 않는다. 데스크톱에서 숨긴 모바일 그림도 마찬가지다.
const lazy = (markup) =>
  markup.replace(/<img\b[^>]*>/g, (tag) => (/\sloading=/.test(tag) ? tag : tag.replace('<img', '<img loading="lazy" decoding="async"')));

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#7550d3" />
    <meta
      name="description"
      content="아이의 질문으로 이어지는 동화, 큐스토리. 동화 속 친구에게 직접 질문하고 생각을 표현하는 상호작용형 동화 Q-Story를 무료로 체험해 보세요."
    />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:title" content="Q-Story | 아이의 질문으로 이어지는 동화" />
    <meta property="og:description" content="읽는 즐거움을 넘어, 생각하고 표현하는 즐거움으로" />
    <title>Q-Story | 아이의 질문으로 이어지는 동화</title>
    <link rel="icon" href="/assets/qstory-icon.png" type="image/png" />
    <link rel="preload" href="/assets/figma/hero1/e1737.webp" as="image" type="image/webp" media="(min-width: 768px)" fetchpriority="high" />
    <link rel="preload" href="/assets/mobile/hero-tablet.webp" as="image" type="image/webp" media="(max-width: 767px)" fetchpriority="high" />
    <link rel="preconnect" href="https://hangeul.pstatic.net" crossorigin />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@800&display=swap" />
    <link rel="stylesheet" href="/src/landing.css" />
    <link rel="stylesheet" href="/src/mobile.css" />
    <script>
      // 시안(1440px)을 화면 폭에 맞춰 줄인다. 첫 화면이 튀지 않게 그리기 전에 정한다.
      document.documentElement.style.setProperty('--z', String(Math.min(1, window.innerWidth / 1440)));
    </script>
    <script type="module" src="/src/main.js"></script>
  </head>
  <body>
    <a class="skip-link" href="#main">본문으로 건너뛰기</a>

    ${header}

    <main id="main">
      ${lazy(sections)}
    </main>

    ${lazy(footer)}
  </body>
</html>
`;
fs.writeFileSync(path.join(landingDir, 'index.html'), html);
fs.copyFileSync(path.join(outDir, 'figma.css'), path.join(landingDir, 'src/figma.css'));
console.log('index.html', html.length);
