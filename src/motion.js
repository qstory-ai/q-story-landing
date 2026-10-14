// 은은한 등장 효과(한 번만). opacity·translate만 쓰고, prefers-reduced-motion이면 아무것도 하지 않는다.
// 숨김은 JS가 붙인 클래스로만 걸어서 JS가 없거나 실패해도 내용은 그대로 보인다.

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

const STAGGER_MS = 60;

export function initMotion() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    document.documentElement.classList.remove('js-motion');
    return;
  }

  // 1) 구역 제목·본문: 화면에 들어올 때 한 번만 떠오르며 나타나기. 이미 보이는 것은 건드리지 않는다.
  const targets = [...document.querySelectorAll(REVEAL_SELECTOR)].filter(
    (el) => el.getBoundingClientRect().top > window.innerHeight,
  );
  const siblingsSeen = new Map();
  targets.forEach((el) => {
    const group = el.closest('.stage') ?? el.parentElement;
    const order = siblingsSeen.get(group) ?? 0;
    siblingsSeen.set(group, order + 1);
    el.style.setProperty('--reveal-delay', `${Math.min(order, 4) * STAGGER_MS}ms`);
    el.classList.add('reveal');
  });
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-in');
        observer.unobserve(el);
        // 다 나타나면 reveal 클래스를 떼어 원래 transition(CTA hover·눌림 등)으로 돌려놓는다.
        let done = false;
        const settle = () => {
          if (done) return;
          done = true;
          el.classList.remove('reveal', 'is-in');
          el.style.removeProperty('--reveal-delay');
        };
        el.addEventListener('transitionend', (event) => { if (event.target === el) settle(); });
        setTimeout(settle, 1200);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );
  targets.forEach((el) => observer.observe(el));
}

/** 이용방법 탭을 바꿀 때 새 패널을 짧게 크로스페이드하고, 02 말풍선은 처음 볼 때 차례로 나타나게. */
export function animatePanel(panel) {
  if (!document.documentElement.classList.contains('js-motion')) return;
  panel.classList.remove('is-entering');
  // 다시 그려야 애니메이션이 처음부터 돈다.
  void panel.offsetWidth;
  panel.classList.add('is-entering');
  panel.addEventListener('animationend', (event) => { if (event.target === panel) panel.classList.remove('is-entering'); }, { once: true });
  if (panel.querySelector('.chat') && !panel.dataset.chatShown) {
    panel.dataset.chatShown = '1';
    panel.classList.add('chat-pop');
    // 마지막 말풍선까지 나오면 클래스를 떼어 탭을 다시 열 때 또 재생되지 않게 한다.
    const lastChat = [...panel.querySelectorAll('.chat')].pop();
    const finish = () => panel.classList.remove('chat-pop');
    lastChat?.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 1500);
  }
}

const SEQUENCE_GAP_MS = 320;

/**
 * 생각풍선 구역(보고 듣는 이야기)과 대화 단계 풍선(작은 '왜?')을 화면에 들어올 때 한 번, 시안 순서대로 하나씩.
 * 풍선 자체는 opacity·translate만 쓰고(모바일 배치의 transform과 겹치지 않게), "톡" 생기는 작은 점은 ::before가 맡는다.
 * 처음부터 화면에 보이는 구역은 건드리지 않는다(깜빡임 방지). 공통 reveal 대상에는 넣지 않는다.
 */
export function initSequences() {
  if (!document.documentElement.classList.contains('js-motion') || !('IntersectionObserver' in window)) return;
  document.querySelectorAll('[data-sequence]').forEach((group) => {
    const items = [...group.querySelectorAll('[data-seq-item]')];
    if (items.length === 0) return;
    const first = items[0];
    if (first.getBoundingClientRect().top < window.innerHeight) return;
    items.forEach((item, index) => item.style.setProperty('--seq-delay', `${index * SEQUENCE_GAP_MS}ms`));
    group.classList.add('seq-pending');
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        group.classList.add('seq-play');
        group.classList.remove('seq-pending');
        const finish = () => {
          group.classList.remove('seq-play');
          items.forEach((item) => item.style.removeProperty('--seq-delay'));
        };
        items[items.length - 1].addEventListener('animationend', (event) => {
          if (event.target === items[items.length - 1]) finish();
        });
        setTimeout(finish, SEQUENCE_GAP_MS * items.length + 1200);
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0.2 },
    );
    observer.observe(first);
  });
}
