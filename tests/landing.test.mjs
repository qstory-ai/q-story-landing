import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const partnerHtml = await readFile(new URL('partner.html', root), 'utf8');
const main = await readFile(new URL('src/main.js', root), 'utf8');
const tracking = await readFile(new URL('src/tracking.js', root), 'utf8');
const partnerJs = await readFile(new URL('src/partner.js', root), 'utf8');
const styles = await readFile(new URL('src/styles.css', root), 'utf8');
const exampleEnv = await readFile(new URL('.env.example', root), 'utf8');
const viteConfig = await readFile(new URL('vite.config.js', root), 'utf8');
const script = `${main}\n${tracking}`;

test('Figma 시안 순서대로 첫 화면부터 바닥글까지 구역을 둔다', () => {
  const ids = ['top', 'about', 'how', 'start', 'faq', 'together'];
  const positions = ids.map((id) => html.indexOf(`id="${id}"`));
  positions.forEach((position, index) => assert.ok(position > 0, `${ids[index]} 구역이 있어야 한다`));
  positions.slice(1).forEach((position, index) => assert.ok(position > positions[index], '시안 순서'));
  assert.match(html, /<footer class="site-footer">/);
  assert.match(html, /AI 시대, 스스로 묻는 아이로 자라게/);
  assert.match(html, /답을 찾는 것보다,/);
  assert.match(html, /읽고, 묻고, 이야기를 이어가요/);
  assert.match(html, /더 많은 이야기와 질문을,/);
});

test('무료 체험 CTA는 환경변수 기반 플레이어 주소로, 세션·유입 정보를 붙여 연결된다', () => {
  const ctaCount = (html.match(/data-player-link/g) ?? []).length;
  assert.ok(ctaCount >= 4, '머리글·메뉴·첫 화면·시작 구역마다 체험 CTA가 있어야 한다');
  const located = html.match(/data-player-link data-cta-location=/g) ?? [];
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

test('문의 메일은 선택 가능한 글자와 복사 버튼으로 보인다', () => {
  assert.match(html, /<a href="mailto:qstoryai@gmail\.com" data-email>qstoryai@gmail\.com<\/a>/);
  assert.match(html, /data-copy-email/);
  assert.match(tracking, /navigator\.clipboard\.writeText/);
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

test('시안 에셋(로고·삽화)이 들어 있고 Pretendard를 쓴다', async () => {
  for (const asset of ['qstory-logo.png', 'hero-tablet.webp', 's3-kid.webp', 's3-mom.webp', 's4-hansel.webp', 's5-child.webp', 's6-house.webp']) {
    const info = await stat(new URL(`public/assets/${asset}`, root));
    assert.ok(info.size > 5_000, `${asset}가 비어 있지 않아야 한다`);
  }
  assert.match(html, /src="\/assets\/qstory-logo\.png"/);
  assert.match(html, /pretendard@v1\.3\.9/);
  assert.match(styles, /Pretendard Variable/);
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
  assert.match(html, /role="tablist"/);
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

test('소개 원은 끌 수 있고 놓으면 스프링으로 돌아오며, 움직임 줄이기·화면 밖을 지킨다', async () => {
  const circles = await readFile(new URL('src/intro-circles.js', root), 'utf8');
  const motion = await readFile(new URL('src/motion.js', root), 'utf8');
  ['discover', 'express', 'explore'].forEach((name) => assert.match(html, new RegExp(`data-circle="${name}"`)));
  assert.match(circles, /pointerdown/);
  assert.match(circles, /setPointerCapture/);
  assert.match(circles, /prefers-reduced-motion: reduce/);
  assert.match(circles, /IntersectionObserver/);
  assert.match(circles, /requestAnimationFrame/);
  assert.match(circles, /sessionStorage/);
  assert.match(main, /intro_circle_drag/);
  assert.match(styles, /\.bubble\[data-circle\] \{\s*touch-action: none;/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
  // 숨김은 JS가 붙인 클래스 아래에서만 - JS가 없으면 내용이 그대로 보인다.
  assert.match(styles, /\.js-motion \.reveal:not\(\.is-in\)/);
  assert.doesNotMatch(styles.replace(/\.js-motion[^{]*\{[^}]*\}/g, ''), /\.reveal:not\(\.is-in\)/);
});
