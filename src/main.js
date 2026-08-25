const configuredPlayerUrl = import.meta.env.VITE_PLAYER_URL?.trim() ?? '';
const configuredAnalyticsUrl = import.meta.env.VITE_ANALYTICS_URL?.trim() ?? '';
const configuredLandingRelease = import.meta.env.VITE_LANDING_RELEASE?.trim() ?? '';
const SESSION_STORAGE_KEY = 'qstory.beta.session.v1';
const LANDING_RELEASE = configuredLandingRelease || 'tracking-v2-20260811';
const TRAFFIC_TYPES = new Set(['beta', 'qa', 'dev']);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

const playerUrl = getPlayerUrl(configuredPlayerUrl);
const analyticsUrl = getPlayerUrl(configuredAnalyticsUrl);
const status = document.querySelector('[data-cta-status]');

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
const landingMetadata = {
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

function trackLandingEvent(eventName, metadata = {}) {
  if (!analyticsUrl) return;
  void fetch(analyticsUrl, {
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
  }).catch(() => {
    // 분석 실패 때문에 가족의 체험 흐름을 막지 않는다.
  });
}

function playerUrlForSession(value) {
  if (!value) return null;
  const url = new URL(value);
  url.searchParams.set('session_id', sessionId);
  url.searchParams.set('traffic_type', trafficType);
  return url.toString();
}

const sessionPlayerUrl = playerUrlForSession(playerUrl);

document.querySelectorAll('[data-player-link]').forEach((link) => {
  link.addEventListener('click', () => {
    trackLandingEvent('landing_cta_click', {
      cta_location: link.dataset.ctaLocation ?? 'unknown',
    });
  });

  if (sessionPlayerUrl) {
    link.href = sessionPlayerUrl;
    link.removeAttribute('aria-disabled');
    return;
  }

  link.href = '#beta';
  link.setAttribute('aria-disabled', 'true');
  link.addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelector('#beta')?.scrollIntoView({ behavior: 'smooth' });
    if (status) {
      status.textContent = '체험 주소를 연결하는 중이에요. 잠시 후 다시 확인해 주세요.';
    }
  });
});

trackLandingEvent('landing_view', {
  page: 'landing',
  entry: landingMetadata.utm_source || 'direct',
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();

const header = document.querySelector('[data-header]');
const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 20);
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

const sectionLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-section-nav a[href^="#"]')];
const sectionTargets = [...new Set(sectionLinks.map((link) => link.getAttribute('href')))]
  .map((hash) => document.querySelector(hash))
  .filter(Boolean);

const setCurrentSection = (id) => {
  sectionLinks.forEach((link) => {
    if (link.getAttribute('href') === `#${id}`) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setCurrentSection(visible.target.id);
    },
    { rootMargin: '-24% 0px -58% 0px', threshold: [0, 0.1, 0.35] }
  );
  sectionTargets.forEach((section) => sectionObserver.observe(section));
}

document.querySelectorAll('details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('details[open]').forEach((openDetail) => {
      if (openDetail !== detail) openDetail.removeAttribute('open');
    });
  });
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealTargets = document.querySelectorAll('.reveal');

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
} else {
  const siblingDelays = new Map();
  revealTargets.forEach((el) => {
    const parent = el.parentElement;
    const order = siblingDelays.get(parent) ?? 0;
    el.style.setProperty('--reveal-delay', `${Math.min(order * 50, 150)}ms`);
    siblingDelays.set(parent, order + 1);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  revealTargets.forEach((el) => observer.observe(el));
}
