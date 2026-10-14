// Google Analytics 4 (gtag.js) - 앱(demo.qstory.ai.kr, 태블릿 앱)과 같은 측정 ID로 랜딩 방문·CTA 클릭을 센다.
// 아동 서비스라 광고 기능은 전부 끄고, 주소는 경로 + utm 쿼리만 보낸다(session_id 같은 나머지 쿼리는 뺀다).
// 브라우저의 GPC·Do Not Track이 켜져 있으면 불러오지 않는다. 자세한 설계는 Q-story-fe의 google-analytics.ts.

export const GA_MEASUREMENT_ID_DEFAULT = 'G-7PH6EEGDR3';
export const GA_LINKER_DOMAINS = ['qstory.ai.kr', 'demo.qstory.ai.kr'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const GA_HIT_HOST = /(^|\.)(google-analytics\.com|analytics\.google\.com)$/;
const KEPT_EVENTS = new Set(['page_view', 'cta_click', 'user_engagement', 'scroll']);

/** 주소 → 경로 + utm 쿼리. */
export function gaPageLocation(href) {
  try {
    const url = new URL(href);
    const kept = new URLSearchParams();
    for (const key of UTM_KEYS) {
      const value = url.searchParams.get(key)?.trim().slice(0, 80);
      if (value) kept.set(key, value);
    }
    const query = kept.toString();
    return `${url.origin}${url.pathname}${query ? `?${query}` : ''}`;
  } catch {
    return '';
  }
}

/** 리퍼러는 출처만. */
export function gaReferrer(referrer) {
  try {
    return referrer ? `${new URL(referrer).origin}/` : undefined;
  } catch {
    return undefined;
  }
}

export function isGaHitUrl(value) {
  try {
    const url = new URL(value);
    return GA_HIT_HOST.test(url.hostname) && url.pathname.endsWith('/collect');
  } catch {
    return false;
  }
}

function keepEvent(params, shared) {
  const eventName = params.get('en');
  if (!eventName) return true;
  // 직접 보낸 page_view에는 qs_surface가 있다 - 없는 것은 gtag가 주소 변경(#이동)으로 따로 보낸 것.
  if (eventName === 'page_view') return params.has('ep.qs_surface') || shared.has('ep.qs_surface');
  return KEPT_EVENTS.has(eventName);
}

function scrubParams(params) {
  const location = params.get('dl');
  if (location) params.set('dl', gaPageLocation(location));
  const referrer = params.get('dr');
  if (referrer) {
    const cleaned = gaReferrer(referrer);
    if (cleaned) params.set('dr', cleaned);
    else params.delete('dr');
  }
}

/** GA 요청 하나를 보내기 직전에 고친다 - 보낼 것이 없으면 null. */
export function scrubGaHit(url, body) {
  const parsed = new URL(url);
  const shared = parsed.searchParams;
  if (!keepEvent(shared, new URLSearchParams())) return null;
  scrubParams(shared);
  let nextBody = body;
  if (body) {
    const lines = body
      .split('\n')
      .filter(Boolean)
      .map((line) => new URLSearchParams(line))
      .filter((line) => keepEvent(line, shared));
    if (lines.length === 0 && !shared.has('en')) return null;
    lines.forEach(scrubParams);
    nextBody = lines.map((line) => line.toString()).join('\n');
  }
  return { url: parsed.toString(), body: nextBody };
}

function installHitScrubber() {
  const originalFetch = window.fetch?.bind(window);
  if (originalFetch) {
    window.fetch = (input, init) => {
      const target = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (!isGaHitUrl(target)) return originalFetch(input, init);
      const body = init?.body ?? null;
      const scrubbed = typeof body === 'string' || body === null ? scrubGaHit(target, body) : null;
      if (!scrubbed) return Promise.resolve(new Response(null, { status: 204 }));
      return originalFetch(scrubbed.url, { ...init, body: scrubbed.body ?? undefined });
    };
  }
  const originalBeacon = navigator.sendBeacon?.bind(navigator);
  if (originalBeacon) {
    navigator.sendBeacon = (target, data) => {
      const href = typeof target === 'string' ? target : target.href;
      if (!isGaHitUrl(href)) return originalBeacon(target, data);
      const body = data ?? null;
      const scrubbed = typeof body === 'string' || body === null ? scrubGaHit(href, body) : null;
      if (!scrubbed) return true;
      return originalBeacon(scrubbed.url, scrubbed.body ?? undefined);
    };
  }
}

function browserOptedOut() {
  return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
}

/**
 * gtag.js를 불러오고 첫 화면을 보낸다. 반환값은 이벤트 함수(불러오지 않았으면 아무것도 하지 않는다).
 * 개발 서버(localhost)는 `?ga_debug=1`일 때만 보낸다.
 */
export function initGoogleAnalytics({ measurementId, trafficType }) {
  const noop = () => {};
  const id = measurementId === 'off' ? null : measurementId || GA_MEASUREMENT_ID_DEFAULT;
  const url = new URL(window.location.href);
  const debug = url.searchParams.get('ga_debug') === '1';
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (!id || browserOptedOut() || (local && !debug)) return noop;

  installHitScrubber();
  window.dataLayer = window.dataLayer || [];
  // gtag.js는 arguments 객체 그대로를 받는다.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  const common = { qs_platform: 'web', qs_surface: 'landing', traffic_type: trafficType };
  const pageLocation = gaPageLocation(window.location.href);
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    personalization_storage: 'denied',
    functionality_storage: 'denied',
    analytics_storage: 'granted',
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('js', new Date());
  window.gtag('config', id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: pageLocation,
    page_referrer: gaReferrer(document.referrer),
    linker: { domains: GA_LINKER_DOMAINS },
    ...(url.protocol === 'https:' ? { cookie_flags: 'SameSite=None;Secure' } : {}),
    user_properties: { qs_platform: 'web', qs_surface: 'landing' },
    ...(debug ? { debug_mode: true } : {}),
  });
  window.gtag('event', 'page_view', { page_location: pageLocation, page_title: document.title, ...common });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);

  return (eventName, params = {}) => {
    window.gtag('event', eventName, { ...params, ...common });
  };
}
