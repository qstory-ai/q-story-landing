// 소개 구역의 발견·표현·탐색 원: 끌면 따라오고, 놓으면 감쇠 스프링으로 제자리로 돌아간다.
// - 평소 떠다니기는 CSS @keyframes(translate, styles.css)라 JS는 매 프레임 돌지 않는다.
// - rAF는 끄는 동안과 놓은 뒤 스프링이 멈출 때까지만. 끈 거리는 transform(translate·scale)으로만 준다.
// - 터치는 세로 스크롤을 막지 않는다(touch-action: pan-y). 가로로 먼저 움직였을 때만 끌기로 잡는다.
// - prefers-reduced-motion이면 떠다니기·튕김 없이 놓는 즉시 제자리.

const STIFFNESS = 170; // 1/s²
const DAMPING = 13; // 1/s
const TOUCH_SLOP_PX = 8;
const DRAG_TRACK_PX = 6;
const TRACKED_KEY = 'qstory.intro-circle-drag.v1';

function readTracked() {
  try {
    return new Set(JSON.parse(globalThis.sessionStorage?.getItem(TRACKED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function writeTracked(set) {
  try {
    globalThis.sessionStorage?.setItem(TRACKED_KEY, JSON.stringify([...set]));
  } catch {
    // 기록 못 해도 동작에는 상관없다.
  }
}

function zoomFactor() {
  const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z'));
  return window.innerWidth >= 900 && value > 0 ? value : 1;
}

/**
 * @param {{ onFirstDrag?: (circle: string) => Promise<boolean> | boolean | void }} [options]
 *   원마다 처음 끌었을 때 한 번 부른다. true(전송 성공)를 돌려주면 이 탭(sessionStorage)에서 다시 부르지 않는다.
 */
export function initIntroCircles({ onFirstDrag } = {}) {
  const elements = [...document.querySelectorAll('.bubble[data-circle]')];
  if (elements.length === 0) return;
  const section = elements[0].closest('section');
  const link = document.querySelector('[data-circle-link]');
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tracked = readTracked();
  const pending = new Set();

  const circles = elements.map((el) => ({
    el,
    name: el.dataset.circle,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    pointerId: null,
    pointerType: '',
    state: 'idle', // idle | pending(터치가 방향을 정하기 전) | dragging | spring
    startX: 0,
    startY: 0,
    grabX: 0,
    grabY: 0,
    zoom: 1,
    moved: false,
  }));

  const linkVisible = () => Boolean(link && link.getClientRects().length > 0);

  const render = (circle) => {
    const scale = circle.state === 'dragging' ? 1.05 : 1;
    circle.el.style.transform =
      circle.state === 'idle' ? '' : `translate(${circle.x.toFixed(2)}px, ${circle.y.toFixed(2)}px) scale(${scale})`;
  };

  const renderLink = () => {
    if (!linkVisible() || circles.length !== 3) return;
    // 연결선(시안 Vector 1)은 위 원에서 시작해 오른쪽 원 뒤를 지나 아래 원으로 - 끝점·조절점이 끈 거리를 따라간다.
    const [a, b, c] = circles;
    link.setAttribute(
      'd',
      `M${2 + a.x} ${2 + a.y} C ${150 + b.x} ${70 + b.y}, ${150 + b.x} ${210 + b.y}, ${2 + c.x} ${279 + c.y}`,
    );
  };

  let frame = 0;
  let last = 0;
  const step = (now) => {
    frame = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    let active = false;
    circles.forEach((circle) => {
      if (circle.state === 'dragging') {
        active = true;
        render(circle);
        return;
      }
      if (circle.state !== 'spring') return;
      circle.vx += (-STIFFNESS * circle.x - DAMPING * circle.vx) * dt;
      circle.vy += (-STIFFNESS * circle.y - DAMPING * circle.vy) * dt;
      circle.x += circle.vx * dt;
      circle.y += circle.vy * dt;
      if (Math.hypot(circle.x, circle.y) < 0.2 && Math.hypot(circle.vx, circle.vy) < 2) {
        circle.x = 0;
        circle.y = 0;
        circle.vx = 0;
        circle.vy = 0;
        circle.state = 'idle';
        circle.el.classList.remove('is-moving');
      } else {
        active = true;
      }
      render(circle);
    });
    renderLink();
    if (active) frame = requestAnimationFrame(step);
    else last = 0;
  };
  const kick = () => {
    if (!frame) frame = requestAnimationFrame(step);
  };

  const reportFirstDrag = async (name) => {
    if (tracked.has(name) || pending.has(name) || !onFirstDrag) return;
    pending.add(name);
    try {
      // 전송이 성공했을 때만 기록 - 실패하면 다음에 다시 끌 때 한 번 더 보낸다.
      if ((await onFirstDrag(name)) === true) {
        tracked.add(name);
        writeTracked(tracked);
      }
    } finally {
      pending.delete(name);
    }
  };

  const beginDrag = (circle) => {
    circle.state = 'dragging';
    circle.el.classList.add('is-dragging', 'is-moving');
    kick();
  };

  circles.forEach((circle) => {
    const { el } = circle;
    el.addEventListener('pointerdown', (event) => {
      if (circle.pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      circle.pointerId = event.pointerId;
      circle.pointerType = event.pointerType;
      circle.startX = event.clientX;
      circle.startY = event.clientY;
      circle.grabX = circle.x;
      circle.grabY = circle.y;
      circle.vx = 0;
      circle.vy = 0;
      circle.moved = false;
      circle.zoom = zoomFactor();
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        el.setPointerCapture(event.pointerId);
        beginDrag(circle);
      } else {
        // 터치: 방향이 정해질 때까지 기다린다. 세로면 브라우저 스크롤(pan-y)에 맡기고 끝낸다.
        circle.state = circle.state === 'spring' ? 'spring' : 'idle';
        circle.pendingTouch = true;
      }
    });
    el.addEventListener('pointermove', (event) => {
      if (event.pointerId !== circle.pointerId) return;
      const dx = event.clientX - circle.startX;
      const dy = event.clientY - circle.startY;
      if (circle.pendingTouch) {
        if (Math.hypot(dx, dy) < TOUCH_SLOP_PX) return;
        circle.pendingTouch = false;
        if (Math.abs(dx) <= Math.abs(dy)) {
          circle.pointerId = null; // 세로 쓸기 - 스크롤로 둔다.
          return;
        }
        el.setPointerCapture(event.pointerId);
        beginDrag(circle);
      }
      if (circle.state !== 'dragging') return;
      circle.x = circle.grabX + dx / circle.zoom;
      circle.y = circle.grabY + dy / circle.zoom;
      if (!circle.moved && Math.hypot(dx, dy) > DRAG_TRACK_PX) {
        circle.moved = true;
        void reportFirstDrag(circle.name);
      }
    });
    const end = (event) => {
      if (event.pointerId !== circle.pointerId) return;
      circle.pointerId = null;
      circle.pendingTouch = false;
      if (circle.state !== 'dragging') return;
      el.classList.remove('is-dragging');
      if (reduceQuery.matches) {
        circle.x = 0;
        circle.y = 0;
        circle.state = 'idle';
        el.classList.remove('is-moving');
        render(circle);
        renderLink();
        return;
      }
      circle.state = 'spring';
      kick();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
  });

  // 화면 밖이면 떠다니기(CSS)도 멈춘다.
  if ('IntersectionObserver' in window && section) {
    new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      section.classList.toggle('is-offscreen', !visible);
    }).observe(section);
  }
}
