import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const partnerHtml = await readFile(new URL('partner.html', root), 'utf8');
const main = await readFile(new URL('src/main.js', root), 'utf8');
const tracking = await readFile(new URL('src/tracking.js', root), 'utf8');
const partnerJs = await readFile(new URL('src/partner.js', root), 'utf8');
const landingCss = await readFile(new URL('src/landing.css', root), 'utf8');
const mobileCss = await readFile(new URL('src/mobile.css', root), 'utf8');
const exampleEnv = await readFile(new URL('.env.example', root), 'utf8');
const viteConfig = await readFile(new URL('vite.config.js', root), 'utf8');
const script = `${main}\n${tracking}`;

test('Figma 시안 순서대로 첫 화면부터 바닥글까지 구역을 둔다', () => {
  const ids = ['top', 'about', 'how', 'start', 'faq', 'together'];
  const positions = ids.map((id) => html.indexOf(`id="${id}"`));
  positions.forEach((position, index) => assert.ok(position > 0, `${ids[index]} 구역이 있어야 한다`));
  positions.slice(1).forEach((position, index) => assert.ok(position > positions[index], '시안 순서'));
  assert.match(html, /<footer class="site-footer sec--purple">/);
  assert.equal((html.match(/<section /g) ?? []).length, 12, 'Figma 941:304의 구역 12개');
  [/아이의 질문으로/, /AI가 답하는 시대,/, /책을 읽은 다음,/, /우리 아이의 질문이 이어지지 않아요/, /아이의 궁금증이/,
    /아이의 질문이 만드는/, /상호작용/, /리포트/, /표현할 기회/, /시작해볼까요\?/,/자주 묻는 질문/,
    /더 많은 아이와 이야기를, 함께 만들어가요\./].forEach((copy) => assert.match(html, copy));
});

test('무료 체험 CTA는 환경변수 기반 플레이어 주소로, 세션·유입 정보를 붙여 연결된다', () => {
  const ctaCount = (html.match(/data-player-link/g) ?? []).length;
  assert.ok(ctaCount >= 4, '머리글·메뉴·첫 화면·시작 구역마다 체험 CTA가 있어야 한다');
  const located = html.match(/data-player-link(?:="")? data-cta-location=/g) ?? [];
  assert.equal(located.length, ctaCount);
  assert.match(script, /import\.meta\.env\.VITE_PLAYER_URL/);
  assert.match(script, /new URL\(value\)/);
  assert.match(script, /VITE_ANALYTICS_URL/);
  assert.match(script, /session_id/);
  assert.match(script, /landing_view/);
  assert.match(script, /landing_cta_click/);
  assert.match(script, /traffic_type/);
  assert.match(script, /VITE_LANDING_RELEASE/);
  assert.match(script, /utm_medium/);
  assert.match(script, /utm_campaign/);
  assert.match(script, /utm_content/);
  assert.match(script, /url\.searchParams\.set\('traffic_type'/);
  assert.match(exampleEnv, /VITE_PLAYER_URL=https:\/\/play\.qstory\.ai\.kr(?:\r?\n|$)/);
});

test('로그인/회원가입은 웹앱 /login, 협업하기는 /partner 문의 화면으로 간다', () => {
  assert.match(html, /data-app-login[^>]*href="https:\/\/demo\.qstory\.ai\.kr\/login"/);
  assert.match(tracking, /\$\{appUrl\}\/login/);
  assert.match(html, /href="\/partner" data-partner-link/);
  assert.match(viteConfig, /partner: 'partner\.html'/);
  assert.match(exampleEnv, /VITE_APP_URL=https:\/\/demo\.qstory\.ai\.kr/);
});

test('협업 문의 폼은 시안 항목을 받고 데모 프록시의 partnership-inquiries로 보낸다', () => {
  ['name="role"', 'value="ORGANIZATION"', 'value="PUBLISHER"', 'value="OTHER"', 'name="name"', 'name="affiliation"',
    'name="jobTitle"', 'name="phone"', 'name="email"', 'name="message"', 'name="consent"'].forEach((field) =>
    assert.ok(partnerHtml.includes(field), field));
  assert.match(partnerHtml, /협업 문의가 접수되었어요\./);
  assert.match(partnerHtml, /문의 전송 중 문제가 발생했어요\./);
  assert.match(partnerHtml, /수집일로부터 1년/);
  assert.match(tracking, /\/api\/qstory\/v1\/partnership-inquiries/);
  assert.match(partnerJs, /privacyConsent/);
  assert.match(partnerJs, /method: 'POST'/);
});

test('바닥글 문의 메일은 mailto 링크로 보인다', () => {
  assert.match(html, /<a[^>]*href="mailto:qstoryai@gmail\.com"[^>]*data-email[^>]*>qstoryai@gmail\.com<\/a>/);
});

test('대표 QR 주소를 랜딩 홈으로 임시 리다이렉트한다', async () => {
  const vercelConfig = JSON.parse(await readFile(new URL('vercel.json', root), 'utf8'));
  assert.deepEqual(vercelConfig.redirects, [
    {
      source: '/qr',
      destination: '/?utm_source=qr&utm_medium=offline&utm_campaign=qr-main',
      permanent: false,
    },
  ]);
});

test('시안 에셋은 모두 로컬 파일이고 글꼴은 나눔스퀘어라운드·나눔고딕이다', async () => {
  assert.doesNotMatch(html, /figma\.com\/api\/mcp\/asset/);
  const srcs = [...new Set([...html.matchAll(/src="(\/assets\/figma\/[^"]+)"/g)].map((m) => m[1]))];
  assert.ok(srcs.length > 40, '시안 에셋을 쓴다');
  for (const src of srcs) {
    const info = await stat(new URL(`public${src}`, root));
    assert.ok(info.size > 0, `${src}가 비어 있지 않아야 한다`);
  }
  for (const weight of ['400', '700', '800']) assert.match(landingCss, new RegExp(`font-weight: ${weight};`));
  assert.match(landingCss, /NanumSquareRoundEB\.woff2/);
  assert.match(html, /family=Nanum\+Gothic:wght@800/);
  assert.doesNotMatch(html, /pretendard/i);
});

test('옛 문구(음성 90일 보관·아이 이름으로 초대·1차 베타 범위)를 쓰지 않는다', () => {
  assert.doesNotMatch(html, /음성[^<]{0,40}90일|90일간 보관/);
  assert.doesNotMatch(html, /아이 이름으로 초대/);
  assert.doesNotMatch(html, /동화의 다음 장면이 달라져요/);
  assert.doesNotMatch(html, /privacy\.html/);
});

test('개인정보처리방침·이용약관은 공개 주소 대신 문의 메일로 안내한다', () => {
  assert.match(html, /data-legal="privacy"/);
  assert.match(main, /으로 요청해 주시면 보내 드려요/);
});

test('접근성 기본 구조를 제공한다', () => {
  for (const page of [html, partnerHtml]) {
    assert.match(page, /lang="ko"/);
    assert.match(page, /class="skip-link"/);
    assert.match(page, /aria-live="polite"/);
    assert.doesNotMatch(page, /<img(?![^>]*\balt=)[^>]*>/);
  }
  assert.match(main, /aria-current/);
  // 데스크톱 무대와 모바일 화면에 하나씩 있고, 보이는 쪽만 남는다(나머지는 display: none).
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 2, '제목(h1)은 화면마다 하나');
  assert.equal((html.match(/<h1 class="m-title/g) ?? []).length, 1);
  assert.match(html, /<button[^>]*aria-controls="site-menu"[^>]*data-menu-button/);
});

test('Google Analytics는 광고 기능을 끄고 경로·utm만 보낸다', async () => {
  const ga = await readFile(new URL('src/ga.js', root), 'utf8');
  assert.match(ga, /G-7PH6EEGDR3/);
  assert.match(ga, /allow_google_signals: false/);
  assert.match(ga, /allow_ad_personalization_signals: false/);
  assert.match(ga, /ad_storage: 'denied'/);
  assert.match(ga, /send_page_view: false/);
  assert.match(ga, /'qstory\.ai\.kr', 'demo\.qstory\.ai\.kr'/);
  assert.match(tracking, /initGoogleAnalytics/);
  assert.match(tracking, /trackGaEvent\('cta_click'/);

  const { gaPageLocation, gaReferrer, scrubGaHit } = await import(new URL('src/ga.js', root).href);
  assert.equal(
    gaPageLocation('https://qstory.ai.kr/?utm_source=qr&utm_medium=offline&utm_campaign=qr-main&session_id=abc'),
    'https://qstory.ai.kr/?utm_source=qr&utm_medium=offline&utm_campaign=qr-main',
  );
  assert.equal(gaReferrer('https://search.example/q?x=secret'), 'https://search.example/');
  const collect = 'https://region1.google-analytics.com/g/collect?v=2';
  assert.equal(scrubGaHit(`${collect}&en=page_view&dl=https%3A%2F%2Fqstory.ai.kr%2F%23faq`, null), null);
  assert.equal(scrubGaHit(`${collect}&en=click`, null), null);
  const kept = scrubGaHit(`${collect}&en=page_view&ep.qs_surface=landing&dl=${encodeURIComponent('https://qstory.ai.kr/?session_id=abc&utm_source=qr')}`, null);
  assert.equal(new URL(kept.url).searchParams.get('dl'), 'https://qstory.ai.kr/?utm_source=qr');
});

test('자체 통계는 살아 있는 데모 프록시로 보내고 예전 Edge Function 주소는 쓰지 않는다', () => {
  assert.match(tracking, /https:\/\/demo\.qstory\.ai\.kr\/api\/qstory\/v1\/beta-events/);
  assert.match(tracking, /LEGACY_ANALYTICS_PATH/);
  assert.match(exampleEnv, /VITE_ANALYTICS_URL=https:\/\/demo\.qstory\.ai\.kr\/api\/qstory\/v1\/beta-events/);
});

test('첫 화면은 시안 세 장을 점으로 넘기고, 움직임 줄이기면 자동 넘김을 끈다', () => {
  assert.equal((html.match(/data-slide/g) ?? []).length, 3);
  assert.equal((html.match(/data-dot/g) ?? []).length, 3);
  assert.match(html, /data-carousel/);
  assert.match(main, /setInterval/);
  assert.match(main, /prefers-reduced-motion: reduce/);
  assert.match(main, /toggleAttribute\('inert'/);
  assert.match(landingCss, /prefers-reduced-motion: reduce/);
});

test('POINT 1 항목은 버튼으로 시안의 세 상태를 오가고, 자주 묻는 질문은 하나만 열린다', () => {
  assert.equal((html.match(/data-acc-state=/g) ?? []).length, 3);
  assert.equal((html.match(/data-acc-state="\d" hidden/g) ?? []).length, 2, '처음엔 첫 상태만 보인다');
  assert.match(html, /<button[^>]*data-acc-item="0"[^>]*aria-expanded="true"/);
  assert.equal((html.match(/<details class="faq-item/g) ?? []).length, 8);
  assert.equal((html.match(/<details class="m-faq-item/g) ?? []).length, 8, '모바일 목록도 같은 8개');
  assert.equal((html.match(/<details[^>]* open>/g) ?? []).length, 2, '데스크톱·모바일 목록마다 하나만 열린다');
  assert.match(main, /details\[open\]/);
  assert.equal((main.match(/setInterval/g) ?? []).length, 1, '자동 넘김은 autoplay 하나로 돈다');
  assert.equal((main.match(/autoplay\(/g) ?? []).length, 3, '정의 하나와 첫 화면·POINT 1 호출');
});

test('자동 넘김에는 정지/재생 버튼이 있고, 누르면 aria-pressed로 상태를 알린다', () => {
  assert.equal((html.match(/<button[^>]*data-auto-toggle[^>]*aria-pressed="false"[^>]*aria-label="자동 넘김 멈추기"/g) ?? []).length, 2);
  assert.match(main, /setAttribute\('aria-pressed', String\(userPaused\)\)/);
  assert.match(main, /if \(userPaused \|\|/);
  assert.match(main, /toggle\.hidden = true/, '움직임 줄이기면 버튼도 숨긴다');
});

test('모바일(767px 이하)은 데스크톱 무대를 숨기고 세로 흐름 화면을 보여 준다', () => {
  assert.match(mobileCss, /@media \(max-width: 767px\) {\s*\.art,\s*\.header-bar {\s*display: none;/);
  assert.match(mobileCss, /@media \(min-width: 768px\) {\s*\.m {\s*display: none !important;/);
  const blocks = html.match(/<div class="m[ "]/g) ?? [];
  assert.equal(blocks.length, 14, '머리글 + 구역 12개 + 바닥글');
  assert.match(html, /<button type="button" class="m-menu-button"[^>]*aria-controls="site-menu"[^>]*data-menu-button/);
  assert.match(tracking, /querySelectorAll\('\[data-menu-button\]'\)/);
  const spacing = [...mobileCss.matchAll(/--sp-\d+:\s*(\d+)px/g)].map((m) => Number(m[1]));
  assert.ok(spacing.length >= 8 && spacing.every((v) => v % 4 === 0), '여백 토큰은 4의 배수');
  // 여백은 토큰으로만 준다. 0, auto, 아이콘을 줄 가운데에 맞추는 1px은 예외.
  const raw = [...mobileCss.matchAll(/^\s*(?:margin|padding|gap|row-gap|column-gap)[a-z-]*:\s*([^;]+);/gm)]
    .map((m) => m[1])
    .filter((v) => !/var\(--(sp|m)-|^0$|auto|^1px$/.test(v));
  assert.deepEqual(raw, [], '토큰 밖 여백 값');
});

test('그림은 WebP와 지연 로딩으로 받는다', async () => {
  assert.doesNotMatch(html, /\/assets\/(figma|mobile)\/[^"]*\.(png|jpe?g)"/i, 'png·jpg 대신 webp');
  const body = html.slice(html.indexOf('<main'));
  const imgs = body.match(/<img[^>]*>/g) ?? [];
  assert.ok(imgs.length > 40);
  imgs.forEach((tag) => assert.match(tag, /loading="lazy" decoding="async"/, tag.slice(0, 80)));
  imgs.forEach((tag) => assert.equal((tag.match(/\sloading=/g) ?? []).length, 1, tag.slice(0, 80)));
  // 모바일 그림은 768px 이상에서 빈 GIF를 고르게 해 데스크톱에서 받지 않는다.
  const mobileImgs = body.match(/<img[^>]*src="\/assets\/mobile\/[^>]*>/g) ?? [];
  assert.equal(mobileImgs.length, 4);
  assert.equal((body.match(/<picture><source media="\(min-width: 768px\)" srcset="data:image\/gif;base64,/g) ?? []).length, (body.match(/<picture>/g) ?? []).length);
  assert.match(html, /rel="preload" href="\/assets\/figma\/hero1\/e1737\.webp"[^>]*media="\(min-width: 768px\)"/);
  assert.match(html, /rel="preload" href="\/assets\/mobile\/hero-tablet\.webp"[^>]*media="\(max-width: 767px\)"/);
  for (const name of ['hero-tablet', 'tablet', 'cta-mascot']) {
    assert.ok((await stat(new URL(`public/assets/mobile/${name}.webp`, root))).size > 0);
  }
});

test('글씨는 디자인시스템 단계(48·36·30·24·18·16·14·12px)만 쓴다', async () => {
  const figmaCss = await readFile(new URL('src/figma.css', root), 'utf8');
  const allowed = new Set(['48', '36', '30', '24', '18', '16', '14', '12', '0']);
  const sizes = [...`${figmaCss}
${landingCss}
${mobileCss}`.matchAll(/font-size:\s*(\d+)px/g)].map((m) => m[1]);
  assert.ok(sizes.length > 100);
  sizes.forEach((size) => assert.ok(allowed.has(size), `${size}px는 디자인시스템 단계가 아니다`));
});

test('구역은 1440px 무대를 화면 폭에 맞춰 zoom으로 맞추고, 무대 밖 도형은 잘라 낸다', () => {
  assert.match(landingCss, /width: 1440px;/);
  assert.match(landingCss, /zoom: var\(--z\);/);
  assert.match(landingCss, /overflow-y: clip;/);
  assert.match(landingCss, /html {[^}]*overflow-x: clip;/);
  assert.match(main, /wireZoom\(\{ mobileWidth: 768, maxZoom: Infinity, scale: 0\.8 \}\)/);
  assert.match(tracking, /Math\.min\(maxZoom, \(width \* scale\) \/ 1440\)/);
  assert.match(tracking, /document\.documentElement\.clientWidth/);
});
