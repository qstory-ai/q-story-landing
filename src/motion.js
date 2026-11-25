// 은은한 등장 효과(모두 한 번만). opacity·translate만 쓴다.
// 숨김은 JS가 붙인 클래스(html.js-motion, .reveal, .seq-hidden)로만 걸어서, JS가 없거나 실패하면 내용은 그대로 보인다.
// 움직임 줄이기는 JS가 처리한다: 켜져 있으면 처음부터 아무것도 숨기지 않고, 도중에 켜면 즉시 모두 보이게 한다.

const STAGGER_MS = 60;
const SEQUENCE_GAP_MS = 320;
/** 관찰자 콜백이 한 번도 오지 않으면(관찰자 고장·백그라운드 탭 등) 이 시간 뒤 강제로 보인다. */
export const SAFETY_MS = 4000;
const NARROW = '(max-width: 899px)';
const REDUCE = '(prefers-reduced-motion: reduce)';

const REVEAL_SELECTOR = [
  '.about-copy',
  '.about-note',
  '.story-title',
  '.story-lead',
  '.story-note',
  '.dialog-title',
  '.moments-stage > .h1',
  '.moments-lead',
  '.moment-card',
  '.how-stage > .h1',
  '.how-tabs',
  '.start-stage > .h1',
  '.start-lead',
  '.start-cta',
  '.faq-title',
  '.together-stage > .h1',
  '.together-lead',
  '.together-card',
  '.together-cta',
].join(',');

const root = () => document.documentElement;

/** 등장 효과를 써도 되는지 - JS가 붙인 js-motion이 있고, 움직임 줄이기가 아니고, 관찰자를 쓸 수 있을 때. */
export function motionEnabled() {
  return (
    root().classList.contains('js-motion') &&
    !window.matchMedia(REDUCE).matches &&
    'IntersectionObserver' in window
  );
}

/** 숨겨 둔 것을 전부 바로 보이게 하고 효과를 끈다(움직임 줄이기로 바뀌었을 때 등). */
export function revealEverything() {
  root().classList.remove('js-motion');
  document.querySelectorAll('.reveal, .seq-hidden, .is-playing').forEach((el) => {
    el.classList.remove('reveal', 'is-in', 'seq-hidden', 'is-playing');
    el.style.removeProperty('--reveal-delay');
    el.style.removeProperty('--seq-delay');
  });
}

let watching = false;
function watchReducedMotion() {
  if (watching) return;
  watching = true;
  window.matchMedia(REDUCE).addEventListener?.('change', (event) => {
    if (event.matches) revealEverything();
  });
}

/**
 * el이 화면에 들어오면 onEnter를 한 번 부른다. 이미 화면 위로 지나간 경우(해시 이동·스크롤 복원)엔 onPassed를 바로 부른다.
 * 관찰자 콜백이 safetyMs 안에 한 번도 오지 않으면 onPassed로 보이게 한다.
 */
export function observeOnce(el, { onEnter, onPassed = onEnter, safetyMs = SAFETY_MS, rootMargin = '0px' } = {}) {
  let done = false;
  let heard = false;
  const finish = (fn) => {
    if (done) return;
    done = true;
    observer.disconnect();
    clearTimeout(timer);
    fn();
  };
  const observer = new IntersectionObserver(
    (entries) => {
      heard = true;
      entries.forEach((entry) => {
        if (entry.isIntersecting) finish(onEnter);
        else if (entry.boundingClientRect.bottom < 0) finish(onPassed);
      });
    },
    { rootMargin, threshold: 0 },
  );
  observer.observe(el);
  const timer = setTimeout(() => {
    if (!heard) finish(onPassed);
  }, safetyMs);
  return () => finish(() => {});
}

/**
 * el 자체(가상 요소 말고)의 animationend·transitionend가 오거나 ms가 지나면 onDone을 한 번 부른다.
 * @param {{ animationName?: string, property?: string, ms: number, onDone: () => void }} options
 */
export function settle(el, { animationName, property, ms, onDone }) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    el.removeEventListener('animationend', onEnd);
    el.removeEventListener('transitionend', onEnd);
    clearTimeout(timer);
    onDone();
  };
  const onEnd = (event) => {
    if (event.target !== el || (event.pseudoElement ?? '') !== '') return;
    if (animationName && event.type === 'animationend' && event.animationName !== animationName) return;
    if (property && event.type === 'transitionend' && event.propertyName !== property) return;
    run();
  };
  if (animationName) el.addEventListener('animationend', onEnd);
  if (property) el.addEventListener('transitionend', onEnd);
  const timer = setTimeout(run, ms);
}

const isBelowFold = (el) => el.getBoundingClientRect().top > window.innerHeight;

/** 구역 제목·본문: 화면에 들어올 때 한 번만 떠오르며 나타나기(형제 60ms 차례). 처음부터 보이는 것은 건드리지 않는다. */
export function initMotion({ safetyMs = SAFETY_MS } = {}) {
  watchReducedMotion();
  if (!motionEnabled()) {
    revealEverything();
    return;
  }
  const order = new Map();
  [...document.querySelectorAll(REVEAL_SELECTOR)].filter(isBelowFold).forEach((el) => {
    const group = el.closest('.stage') ?? el.parentElement;
    const index = order.get(group) ?? 0;
    order.set(group, index + 1);
    el.style.setProperty('--reveal-delay', `${Math.min(index, 4) * STAGGER_MS}ms`);
    el.classList.add('reveal');
    const clear = () => {
      el.classList.remove('reveal', 'is-in');
      el.style.removeProperty('--reveal-delay');
    };
    observeOnce(el, {
      safetyMs,
      rootMargin: '0px 0px -5% 0px',
      onEnter: () => {
        el.classList.add('is-in');
        // 다 나타나면 reveal 클래스를 떼어 원래 transition(CTA hover·눌림 등)으로 돌려놓는다.
        settle(el, { property: 'translate', ms: 1200, onDone: clear });
      },
      onPassed: clear,
    });
  });
}

/** 이용방법 탭을 바꿀 때 새 패널을 짧게 크로스페이드하고, 02 말풍선은 처음 볼 때 한 번 차례로 나타나게. */
export function animatePanel(panel) {
  if (!motionEnabled()) return;
  panel.classList.remove('is-entering');
  void panel.offsetWidth; // 다시 그려야 애니메이션이 처음부터 돈다.
  panel.classList.add('is-entering');
  settle(panel, { animationName: 'qs-fade', ms: 600, onDone: () => panel.classList.remove('is-entering') });
  if (panel.querySelector('.chat') && !panel.dataset.chatShown) {
    panel.dataset.chatShown = '1';
    panel.classList.add('chat-pop');
    const lastChat = [...panel.querySelectorAll('.chat')].pop();
    if (lastChat) settle(lastChat, { animationName: 'qs-pop', ms: 1500, onDone: () => panel.classList.remove('chat-pop') });
  }
}

/**
 * 생각풍선 구역(보고 듣는 이야기)과 대화 단계 풍선(작은 '왜?'): 시안 순서대로 하나씩, 한 번만.
 * 데스크톱은 첫 풍선이 보일 때 320ms 간격 차례로, 900px 미만은 풍선이 그림 사이에 끼어 있어 풍선마다 각자 보일 때 나타난다.
 * 풍선은 opacity·translate만(모바일 배치의 transform과 겹치지 않게), "톡" 생기는 작은 점은 ::before가 맡는다.
 */
export function initSequences({ safetyMs = SAFETY_MS } = {}) {
  if (!motionEnabled()) return;
  const narrow = window.matchMedia(NARROW).matches;
  document.querySelectorAll('[data-sequence]').forEach((group) => {
    const items = [...group.querySelectorAll('[data-seq-item]')].filter(isBelowFold);
    if (items.length === 0) return;
    const show = (item) => {
      item.classList.remove('seq-hidden', 'is-playing');
      item.style.removeProperty('--seq-delay');
    };
    const play = (item, delayMs) => {
      item.style.setProperty('--seq-delay', `${delayMs}ms`);
      item.classList.add('is-playing');
      item.classList.remove('seq-hidden');
      settle(item, { animationName: 'qs-bubble-in', ms: delayMs + 1500, onDone: () => show(item) });
    };
    items.forEach((item) => item.classList.add('seq-hidden'));
    if (narrow) {
      items.forEach((item) => observeOnce(item, { safetyMs, onEnter: () => play(item, 0), onPassed: () => show(item) }));
      return;
    }
    observeOnce(items[0], {
      safetyMs,
      onEnter: () => items.forEach((item, index) => play(item, index * SEQUENCE_GAP_MS)),
      onPassed: () => items.forEach(show),
    });
  });
}
