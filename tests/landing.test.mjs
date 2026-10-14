import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const script = await readFile(new URL('src/main.js', root), 'utf8');
const styles = await readFile(new URL('src/styles.css', root), 'utf8');
const exampleEnv = await readFile(new URL('.env.example', root), 'utf8');

test('hero부터 footer까지 핵심 랜딩 섹션을 제공한다', () => {
  const requiredIds = ['top', 'experience', 'difference', 'trust', 'beta', 'faq'];
  requiredIds.forEach((id) => assert.match(html, new RegExp(`id="${id}"`)));
  assert.match(html, /<footer class="site-footer">/);

  const orderedSections = requiredIds.map((id) => html.indexOf(`id="${id}"`));
  orderedSections.slice(1).forEach((position, index) => {
    assert.ok(position > orderedSections[index], '섹션은 베타 의사결정 흐름 순서로 배치되어야 한다');
  });
});

test('모든 서비스 CTA는 환경변수 기반 링크로 연결된다', () => {
  const ctaCount = (html.match(/data-player-link/g) ?? []).length;
  assert.ok(ctaCount >= 4, '주요 진입 구간마다 체험 CTA가 있어야 한다');
  assert.match(script, /import\.meta\.env\.VITE_PLAYER_URL/);
  assert.match(script, /new URL\(value\)/);
  assert.equal((html.match(/data-cta-location=/g) ?? []).length, ctaCount);
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
  assert.match(
    exampleEnv,
    /VITE_PLAYER_URL=https:\/\/play\.qstory\.ai\.kr(?:\r?\n|$)/,
  );
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

test('공식 SVG 로고와 실제 헨젤과 그레텔 삽화가 포함된다', async () => {
  const logo = await stat(new URL('public/assets/q-story-logo.svg', root));
  const hero = await stat(new URL('public/assets/hansel-gretel-hero.webp', root));
  const parentTalk = await stat(new URL('public/assets/hansel-gretel-parent-talk.webp', root));
  const questionSky = await stat(new URL('public/assets/q-story-question-sky.webp', root));
  const heroQuestionBook = await stat(new URL('public/assets/q-story-hero-question-book.webp', root));
  assert.ok(logo.size > 10_000, '공식 SVG 로고가 비어 있지 않아야 한다');
  assert.ok(hero.size > 10_000, '히어로 삽화가 비어 있지 않아야 한다');
  assert.ok(parentTalk.size > 10_000, '부모 리포트 미리보기 삽화가 비어 있지 않아야 한다');
  assert.ok(questionSky.size > 10_000, '최종 CTA 일러스트가 비어 있지 않아야 한다');
  assert.ok(heroQuestionBook.size > 10_000, '히어로 보조 일러스트가 비어 있지 않아야 한다');
  assert.match(html, /src="\/assets\/q-story-logo\.svg"/);
  assert.match(html, /src="\/assets\/hansel-gretel-hero\.webp"/);
});

test('Pretendard 통일과 모바일 탐색·부모 리포트 미리보기를 제공한다', () => {
  assert.ok((html.match(/AI 시대, 스스로 묻는 아이로 자라게/g) ?? []).length >= 3);
  assert.match(html, /class="mobile-section-nav"/);
  assert.match(html, /Q-Story란/);
  assert.match(html, /장면 변화/);
  assert.match(html, /안심 설계/);
  assert.match(html, /베타 안내/);
  assert.match(html, /class="report-preview"/);
  assert.match(html, /여러분의 1분 후기가 다음 동화와 체험 방식을 결정/);
  assert.match(html, /q-story-question-sky\.webp/);
  assert.match(html, /q-story-hero-question-book\.webp/);
  assert.match(styles, /Pretendard Variable/);
  assert.doesNotMatch(html, /Gowun\+Batang/);
  assert.doesNotMatch(styles, /Gowun Batang/);
  assert.doesNotMatch(html, /class="hero-ribbon"/);
});

test('1차 베타의 장면 변화 범위를 정확하게 약속한다', () => {
  assert.match(html, /아이의 질문과 선택으로/);
  assert.match(html, /동화의 중간 장면이 달라져요/);
  assert.match(html, /중요한 사건과 결말은 안전하게 이어져요/);
  assert.doesNotMatch(html, /동화의 다음 장면이 달라져요/);
  assert.doesNotMatch(html, /한 편을 움직여 보세요/);
});

test('접근성 기본 구조를 제공한다', () => {
  assert.match(html, /lang="ko"/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(script, /aria-current/);
  assert.doesNotMatch(html, /<img(?![^>]*\balt=)[^>]*>/);
});

test('체험 시간과 선택동의 음성 보관 안내가 현재 구현과 일치한다', () => {
  assert.doesNotMatch(html, /8[\u2013~\-]10/);
  assert.match(html, /data-duration-disclosure="variable"/);
  assert.match(html, /data-beta-voice-storage="optional-consent"/);
  assert.match(html, /보호자가 체크한 경우에만/);
  assert.match(html, /90일간 보관/);
  assert.match(html, /동의하지 않아도 체험할 수/);
  assert.doesNotMatch(html, /원음 연구 저장 안 함|원음 저장 기능을 운영하지 않습니다/);
});

test('개인정보나 실명 연락처를 랜딩에 노출하지 않는다', () => {
  assert.doesNotMatch(html, /privacy\.html|개인정보처리방침/);
  assert.doesNotMatch(html, /tel:|010[-\s]?\d{4}[-\s]?\d{4}/);
});

test('Google Analytics는 광고 기능을 끄고 경로·utm만 보낸다', async () => {
  const ga = await readFile(new URL('src/ga.js', root), 'utf8');
  assert.match(ga, /G-79Z59DXLN3/);
  assert.match(ga, /allow_google_signals: false/);
  assert.match(ga, /allow_ad_personalization_signals: false/);
  assert.match(ga, /ad_storage: 'denied'/);
  assert.match(ga, /send_page_view: false/);
  assert.match(ga, /'qstory\.ai\.kr', 'demo\.qstory\.ai\.kr'/);
  assert.match(script, /initGoogleAnalytics/);
  assert.match(script, /trackGaEvent\('cta_click'/);

  const { gaPageLocation, gaReferrer, scrubGaHit } = await import(new URL('src/ga.js', root).href);
  assert.equal(
    gaPageLocation('https://qstory.ai.kr/?utm_source=qr&utm_medium=offline&utm_campaign=qr-main&session_id=abc'),
    'https://qstory.ai.kr/?utm_source=qr&utm_medium=offline&utm_campaign=qr-main',
  );
  assert.equal(gaReferrer('https://search.example/q?x=secret'), 'https://search.example/');
  const collect = 'https://region1.google-analytics.com/g/collect?v=2';
  assert.equal(scrubGaHit(`${collect}&en=page_view&dl=https%3A%2F%2Fqstory.ai.kr%2F%23beta`, null), null);
  assert.equal(scrubGaHit(`${collect}&en=click`, null), null);
  const kept = scrubGaHit(`${collect}&en=page_view&ep.qs_surface=landing&dl=${encodeURIComponent('https://qstory.ai.kr/?session_id=abc&utm_source=qr')}`, null);
  assert.equal(new URL(kept.url).searchParams.get('dl'), 'https://qstory.ai.kr/?utm_source=qr');
});

test('자체 통계는 살아 있는 데모 프록시로 보내고 예전 Edge Function 주소는 쓰지 않는다', () => {
  assert.match(script, /https:\/\/demo\.qstory\.ai\.kr\/api\/qstory\/v1\/beta-events/);
  assert.match(script, /LEGACY_ANALYTICS_PATH/);
  assert.match(exampleEnv, /VITE_ANALYTICS_URL=https:\/\/demo\.qstory\.ai\.kr\/api\/qstory\/v1\/beta-events/);
});
