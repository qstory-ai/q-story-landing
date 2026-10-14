// 소개 구역의 발견·표현·탐색 원: 끌면 따라오고, 놓으면 감쇠 스프링으로 제자리(떠다니는 위치)로 돌아간다.
// transform 계열(translate·scale)만 바꾸고, 화면 밖이면 멈춘다. prefers-reduced-motion이면 떠다니기·튕김 없이 즉시 복귀.

const FLOAT_PX = 4;
const STIFFNESS = 170; // 1/s²
const DAMPING = 13; // 1/s
const DRAG_TRACK_PX = 6;
const TRACKED_KEY = 'qstory.intro-circle-drag.v1';

function trackedCircles() {
  try {
    return new Set(JSON.parse(globalThis.sessionStorage?.getItem(TRACKED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function rememberTracked(set) {
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

/** @param {{ onFirstDrag?: (circle: string) => void }} [options] */
export function initIntroCircles({ onFirstDrag } = {}) {
  const elements = [...document.querySelectorAll('.bubble[data-circle]')];
  if (elements.length === 0) return;
  const section = elements[0].closest('section');
  const link = document.querySelector('[data-circle-link]');
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tracked = trackedCircles();

  const circles = elements.map((el, index) => ({
    el,
    name: el.dataset.circle,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    phase: index * 2.1,
    dragging: false,
    startX: 0,
    startY: 0,
    grabX: 0,
    grabY: 0,
    moved: false,
  }));

  const floatAt = (circle, time) =>
    reduceQuery.matches
      ? { x: 0, y: 0 }
      : {
          x: Math.sin(time / 2.7 + circle.phase) * FLOAT_PX,
          y: Math.cos(time / 3.3 + circle.phase * 1.3) * FLOAT_PX,
        };

  const render = () => {
    circles.forEach((circle) => {
      circle.el.style.translate = `${circle.x.toFixed(2)}px ${circle.y.toFixed(2)}px`;
    });
    if (link && circles.length === 3) {
      // 연결선(시안 Vector 1)은 위 원에서 시작해 오른쪽 원 뒤를 지나 아래 원으로 - 끝점·조절점이 각 원을 따라간다.
      const [a, b, c] = circles;
      link.setAttribute(
        'd',
        `M${2 + a.x} ${2 + a.y} C ${150 + b.x} ${70 + b.y}, ${150 + b.x} ${210 + b.y}, ${2 + c.x} ${279 + c.y}`,
      );
    }
  };

  let visible = false;
  let frame = 0;
  let last = 0;
  const step = (now) => {
    frame = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    const time = now / 1000;
    let busy = false;
    circles.forEach((circle) => {
      if (circle.dragging) {
        busy = true;
        return;
      }
      const target = floatAt(circle, time);
      if (reduceQuery.matches) {
        circle.x = 0;
        circle.y = 0;
        circle.vx = 0;
        circle.vy = 0;
        return;
      }
      const ax = -STIFFNESS * (circle.x - target.x) - DAMPING * circle.vx;
      const ay = -STIFFNESS * (circle.y - target.y) - DAMPING * circle.vy;
      circle.vx += ax * dt;
      circle.vy += ay * dt;
      circle.x += circle.vx * dt;
      circle.y += circle.vy * dt;
      busy = true;
    });
    render();
    if (busy && visible) frame = requestAnimationFrame(step);
  };
  const start = () => {
    if (!frame && visible) {
      last = 0;
      frame = requestAnimationFrame(step);
    }
  };

  circles.forEach((circle) => {
    const { el } = circle;
    el.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      circle.dragging = true;
      circle.moved = false;
      circle.startX = event.clientX;
      circle.startY = event.clientY;
      circle.grabX = circle.x;
      circle.grabY = circle.y;
      circle.vx = 0;
      circle.vy = 0;
      el.setPointerCapture(event.pointerId);
      el.classList.add('is-dragging');
    });
    el.addEventListener('pointermove', (event) => {
      if (!circle.dragging) return;
      const zoom = zoomFactor();
      const dx = (event.clientX - circle.startX) / zoom;
      const dy = (event.clientY - circle.startY) / zoom;
      circle.x = circle.grabX + dx;
      circle.y = circle.grabY + dy;
      if (!circle.moved && Math.hypot(dx, dy) > DRAG_TRACK_PX) {
        circle.moved = true;
        if (!tracked.has(circle.name)) {
          tracked.add(circle.name);
          rememberTracked(tracked);
          onFirstDrag?.(circle.name);
        }
      }
      render();
    });
    const release = () => {
      if (!circle.dragging) return;
      circle.dragging = false;
      el.classList.remove('is-dragging');
      if (reduceQuery.matches) {
        circle.x = 0;
        circle.y = 0;
        render();
      }
      start();
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
  });

  if ('IntersectionObserver' in window && section) {
    new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) start();
    }).observe(section);
  } else {
    visible = true;
    start();
  }
  reduceQuery.addEventListener?.('change', start);
}
