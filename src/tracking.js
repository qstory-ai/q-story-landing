// 랜딩 공통: 체험 주소·자체 통계(beta-events)·GA4·머리글·메일 복사. index.html과 partner.html이 함께 쓴다.
import { initGoogleAnalytics } from './ga.js';

const configuredPlayerUrl = import.meta.env.VITE_PLAYER_URL?.trim() ?? '';
const configuredAnalyticsUrl = import.meta.env.VITE_ANALYTICS_URL?.trim() ?? '';
const configuredGaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';
const configuredLandingRelease = import.meta.env.VITE_LANDING_RELEASE?.trim() ?? '';
const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim() ?? '';
const SESSION_STORAGE_KEY = 'qstory.beta.session.v1';
const LANDING_RELEASE = configuredLandingRelease || 'figma-renewal-20261015';
const TRAFFIC_TYPES = new Set(['beta', 'qa', 'dev']);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const CONTACT_EMAIL = 'qstoryai@gmail.com';

function getPlayerUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

// 자체 통계는 데모 앱의 프록시(/api/qstory/v1/beta-events, 랜딩 출처 CORS 허용)로 보낸다. 예전 Supabase Edge Function
// 주소(/functions/v1/beta-events)는 없어졌으므로(405) 그 값이 환경변수에 남아 있어도 기본 주소를 쓴다.
const DEFAULT_ANALYTICS_URL = 'https://demo.qstory.ai.kr/api/qstory/v1/beta-events';
const LEGACY_ANALYTICS_PATH = /\/functions\/v1\/beta-events\/?$/;

function getAnalyticsUrl(value) {
  const configured = getPlayerUrl(value);
  if (!configured || LEGACY_ANALYTICS_PATH.test(new URL(configured).pathname)) return DEFAULT_ANALYTICS_URL;
  return configured;
}

// 웹앱(로그인·가입). /login은 앱 첫 화면의 로그인 단계로 넘어가고 거기서 회원가입도 고를 수 있다(Q-story-fe App.tsx).
const DEFAULT_APP_URL = 'https://demo.qstory.ai.kr';
export const appUrl = (getPlayerUrl(configuredAppUrl) ?? DEFAULT_APP_URL).replace(/\/+$/, '');
export const loginUrl = `${appUrl}/login`;
// 협업 문의도 같은 프록시(랜딩 출처 CORS 허용)로 백엔드 POST /v1/partnership-inquiries에 보낸다.
export const partnershipUrl = `${appUrl}/api/qstory/v1/partnership-inquiries`;

const playerUrl = getPlayerUrl(configuredPlayerUrl);
const analyticsUrl = getAnalyticsUrl(configuredAnalyticsUrl);

function trafficTypeForUrl(value) {
  const url = new URL(value);
  const requested = url.searchParams.get('traffic_type');
  if (requested && TRAFFIC_TYPES.has(requested)) return requested;
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return 'dev';
  if (url.hostname.endsWith('.vercel.app')) return 'qa';
  return 'beta';
}

function acquisitionMetadata(value) {
  const params = new URL(value).searchParams;
  return [
    ['utm_source', 'utm_source'],
    ['utm_medium', 'utm_medium'],
    ['utm_campaign', 'utm_campaign'],
    ['utm_content', 'utm_content'],
  ].reduce((metadata, [parameter, key]) => {
    const entry = params.get(parameter)?.trim().slice(0, 80);
    if (entry) metadata[key] = entry;
    return metadata;
  }, {});
}

const trafficType = trafficTypeForUrl(window.location.href);
export const landingMetadata = {
  traffic_type: trafficType,
  landing_release: LANDING_RELEASE,
  ...acquisitionMetadata(window.location.href),
};

function createSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getSessionId() {
  const fromUrl = new URL(window.location.href).searchParams.get('session_id');
  if (fromUrl && UUID_PATTERN.test(fromUrl)) {
    try {
      globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, fromUrl);
    } catch {
      // 분석 식별자가 체험 진입을 막아서는 안 된다.
    }
    return fromUrl;
  }

  try {
    const stored = globalThis.localStorage?.getItem(SESSION_STORAGE_KEY);
    if (stored && UUID_PATTERN.test(stored)) return stored;
  } catch {
    // 저장소 접근이 제한된 환경에서는 새 세션으로 계속한다.
  }

  const created = createSessionId();
  try {
    globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, created);
  } catch {
    // 저장 실패는 비차단 조건이다.
  }
  return created;
}

const sessionId = getSessionId();
export const trackGaEvent = initGoogleAnalytics({ measurementId: configuredGaMeasurementId, trafficType });

/** 자체 통계 한 건. 전송 성공(2xx)이면 true - 실패해도 체험 흐름은 막지 않는다. */
export function trackLandingEvent(eventName, metadata = {}) {
  if (!analyticsUrl) return Promise.resolve(false);
  return fetch(analyticsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_id: createSessionId(),
      session_id: sessionId,
      event_name: eventName,
      source: 'landing',
      occurred_at: new Date().toISOString(),
      metadata: { ...landingMetadata, ...metadata },
      schema_version: 1,
    }),
    keepalive: true,
  })
    .then((response) => response.ok)
    .catch(() => false);
}

function playerUrlForSession(value) {
  if (!value) return null;
  const url = new URL(value);
  url.searchParams.set('session_id', sessionId);
  url.searchParams.set('traffic_type', trafficType);
  return url.toString();
}

const sessionPlayerUrl = playerUrlForSession(playerUrl);

function trackCta(location) {
  void trackLandingEvent('landing_cta_click', { cta_location: location });
  trackGaEvent('cta_click', { cta_location: location });
}

/** CTA 3종: 무료 체험(플레이어), 로그인/회원가입(웹앱), 협업하기(/partner). */
export function wireCtas() {
  const status = document.querySelector('[data-cta-status]');
  document.querySelectorAll('[data-player-link]').forEach((link) => {
    link.addEventListener('click', () => trackCta(link.dataset.ctaLocation ?? 'unknown'));

    if (sessionPlayerUrl) {
      link.href = sessionPlayerUrl;
      link.removeAttribute('aria-disabled');
      return;
    }

    link.href = '#start';
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (status) status.textContent = '체험 주소를 연결하는 중이에요. 잠시 후 다시 확인해 주세요.';
    });
  });

  document.querySelectorAll('[data-app-login]').forEach((link) => {
    link.href = loginUrl;
    link.addEventListener('click', () => trackCta(link.dataset.ctaLocation ?? 'login'));
  });

  document.querySelectorAll('[data-partner-link]').forEach((link) => {
    link.addEventListener('click', () => trackCta(link.dataset.ctaLocation ?? 'partner'));
  });
}

/** 데스크톱 시안(1440px)을 화면 폭에 맞춘 배율. 900px 미만은 세로 흐름이라 1. */
export function wireZoom() {
  const apply = () => {
    const width = window.innerWidth;
    const zoom = width < 900 ? 1 : Math.min(1, width / 1440);
    document.documentElement.style.setProperty('--z', String(zoom));
  };
  apply();
  window.addEventListener('resize', apply, { passive: true });
}

export function wireMenu() {
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-menu]');
  if (!button || !menu) return;
  const close = () => {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '메뉴 열기');
  };
  button.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      close();
      button.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !event.target.closest('[data-menu]') && !event.target.closest('[data-menu-button]')) close();
  });
}

/** 문의 메일 복사(선택 가능한 글자 + 복사 버튼). */
export function wireEmailCopy() {
  const toast = document.querySelector('[data-copy-toast]');
  let timer;
  const show = (text) => {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove('is-on'), 1800);
  };
  document.querySelectorAll('[data-copy-email]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
        show('메일 주소를 복사했어요.');
      } catch {
        const range = document.createRange();
        const target = button.parentElement?.querySelector('[data-email]');
        if (target) {
          range.selectNodeContents(target);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        show(`${CONTACT_EMAIL} - 선택된 주소를 복사해 주세요.`);
      }
    });
  });
}
