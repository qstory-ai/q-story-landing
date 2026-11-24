// 은은한 움직임. 구역이 화면에 들어오면 안의 요소가 위에서부터 차례로 떠오른다.
// - 움직임 줄이기 설정이거나 IntersectionObserver·Web Animations가 없으면 아무것도 하지 않는다.
// - 숨기는 일(.rv)은 이 스크립트가 직접 한다. 스크립트가 못 돌면 처음부터 다 보인다.
// - 움직임은 element.animate로 한 번만 돌고 끝나면 흔적을 남기지 않는다.
//   그래서 시안의 translate·rotate나 버튼 hover와 부딪히지 않는다.

const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const supported = 'IntersectionObserver' in window && typeof Element.prototype.animate === 'function';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const STEP = 90; // 같은 때 들어온 요소끼리 벌리는 간격(ms)
const MAX_DELAY = 560;

// 무늬에 따라 움직임을 조금씩 다르게 준다.
const KEYFRAMES = {
  rise: [
    { opacity: 0, transform: 'translateY(24px)' },
    { opacity: 1, transform: 'none' },
  ],
  pop: [
    { opacity: 0, transform: 'scale(0.92)' },
    { opacity: 1, transform: 'none' },
  ],
  fade: [{ opacity: 0 }, { opacity: 1 }],
};
const DURATION = { rise: 700, pop: 650, fade: 900 };

// 원 그림 묶음(호기심·질문… / 독서 단계)은 살짝 커지며 나타난다.
const POP = ['.n-939-1777', '.n-939-1776', '.n-939-1798'];
// 무료 체험 구역의 마스코트(데스크톱 묶음, 모바일 그림). 천천히 떠다니고, 나타날 때는 흐리게만 들어온다.
// 떠다니기가 transform을 쓰기 때문이다.
const MASCOT = ['.n-929-764', '.m-cta-img'];

/** display: contents인 묶음은 상자가 없어 움직일 수 없으니 그 아래 자식으로 내려간다. */
function boxes(el) {
  if (getComputedStyle(el).display !== 'contents') return [el];
  return [...el.children].flatMap(boxes);
}

/** 시안 무대의 맨 윗단 자식 중 움직일 것만 고른다. 바탕판(무대만큼 큰 것)은 그대로 둔다. */
function stageTargets(root) {
  const out = [];
  const visit = (el) => {
    if (getComputedStyle(el).display === 'contents') {
      [...el.children].forEach(visit);
      return;
    }
    if (el.offsetWidth >= 1200 || el.offsetHeight >= 600) return;
    // 시안이 직접 기울인 요소는 건드리지 않는다. 떠다니는 마스코트는 떠다니기 때문에 transform이 있다.
    if (!el.matches('.float') && getComputedStyle(el).transform !== 'none') return;
    out.push(el);
  };
  [...root.children].forEach(visit);
  return out;
}

/** 모바일 블록(.m)은 머리말, 카드 하나하나, 버튼, 그림 단위로 움직인다. */
function mobileTargets(block) {
  const out = [];
  for (const child of block.children) {
    if (child.matches('ul, .m-faq, .m-points')) out.push(...child.children);
    else out.push(child);
  }
  return out;
}

function collect() {
  const targets = new Set();
  document.querySelectorAll('main > section').forEach((section) => {
    // POINT 1은 스스로 넘어가는 움직임이 있어 더하지 않는다.
    if (section.querySelector('[data-acc]')) return;
    section.querySelectorAll('.art').forEach((art) => {
      // 첫 화면은 처음 보이는 슬라이드만. 나머지 슬라이드는 넘길 때의 흐려짐으로 충분하다.
      // 첫 화면은 그림이 겹겹이 겹쳐 있어 반투명하게 들어오면 뒤가 비친다. 그래서 글과 버튼만 움직인다.
      const slide = art.querySelector('.slide.is-on');
      const stage = slide ?? art;
      const root = stage.firstElementChild?.matches('[class^="n-"]') ? stage.firstElementChild : null;
      if (root) {
        stageTargets(root)
          .filter((el) => !slide || (!el.matches('img, svg') && !el.querySelector('img, svg')))
          .forEach((el) => targets.add(el));
      }
      art.querySelectorAll('.faq-list > .faq-item').forEach((el) => targets.add(el));
    });
    section.querySelectorAll('.m').forEach((block) => mobileTargets(block).forEach((el) => targets.add(el)));
  });
  return [...targets];
}

function kindOf(el) {
  if (POP.some((sel) => el.matches(sel))) return 'pop';
  if (el.matches('.float')) return 'fade';
  return 'rise';
}

function reveal(entries, observer) {
  const shown = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
  // 카드 바탕 위에 얹힌 글·그림은 따로 줄 세우지 않고 그 카드보다 조금 늦게 함께 들어온다.
  // 그래야 빈 카드가 먼저 떠 있는 순간이 생기지 않는다.
  const placed = [];
  let order = 0;
  shown.forEach((entry) => {
    const el = entry.target;
    observer.unobserve(el);
    const r = entry.boundingClientRect;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const host = placed.find((p) => p.r.width > r.width && cx > p.r.left && cx < p.r.right && cy > p.r.top && cy < p.r.bottom);
    const delay = host ? host.delay + 120 : Math.min(order++ * STEP, MAX_DELAY);
    placed.push({ r, delay });
    const kind = kindOf(el);
    el.animate(KEYFRAMES[kind], {
      duration: DURATION[kind],
      delay,
      easing: EASE,
      fill: 'backwards',
    });
    el.classList.remove('rv');
  });
}

export function wireMotion() {
  if (reduced || !supported) return;
  document.documentElement.classList.add('js-motion');
  // 떠다니는 마스코트는 화면 밖에서는 멈춘다.
  const floatObserver = new IntersectionObserver((entries) =>
    entries.forEach((entry) => entry.target.classList.toggle('is-paused', !entry.isIntersecting)),
  );
  MASCOT.flatMap((sel) => [...document.querySelectorAll(sel)].flatMap(boxes)).forEach((el) => {
    el.classList.add('float');
    floatObserver.observe(el);
  });

  const observer = new IntersectionObserver(reveal, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  collect().forEach((el) => {
    el.classList.add('rv');
    observer.observe(el);
  });
}
