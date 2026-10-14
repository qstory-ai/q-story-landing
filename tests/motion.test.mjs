// 등장 효과(src/motion.js) 동작 검사 - jsdom에 실제 index.html을 올리고 관찰자·화면 위치·움직임 줄이기를 흉내 낸다.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param {{ reduce?: boolean, narrow?: boolean, observer?: 'silent' | 'manual', place?: 'below' | 'above' }} options
 */
async function setup({ reduce = false, narrow = false, observer = 'manual', place = 'below' } = {}) {
  const dom = new JSDOM(html.replace(/<script[\s\S]*?<\/script>/g, ''), { pretendToBeVisual: true });
  const { window } = dom;
  const listeners = [];
  window.matchMedia = (query) => ({
    matches: query.includes('reduce') ? reduce : query.includes('max-width') ? narrow : false,
    media: query,
    addEventListener: (_type, fn) => listeners.push({ query, fn }),
  });
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  // 화면 위치: below = 모두 화면 아래(아직 안 보임), above = 이미 화면 위로 지나감(해시 이동·스크롤 복원)
  window.Element.prototype.getBoundingClientRect = function rect() {
    return place === 'below' ? { top: 2000, bottom: 2200 } : { top: -900, bottom: -700 };
  };
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      observers.push(this);
    }
    observe(el) {
      this.targets.push(el);
    }
    disconnect() {
      this.targets = [];
    }
    fire(isIntersecting, rect) {
      if (observer === 'silent') return;
      this.callback(this.targets.map((target) => ({ target, isIntersecting, boundingClientRect: rect ?? { top: 100, bottom: 300 } })));
    }
  };
  for (const key of ['window', 'document', 'IntersectionObserver']) {
    globalThis[key] = key === 'window' ? window : window[key];
  }
  if (!reduce) window.document.documentElement.classList.add('js-motion');
  const motion = await import(`../src/motion.js?${Math.random()}`);
  return { window, document: window.document, motion, observers, listeners };
}

const seqItems = (document) => [...document.querySelectorAll('[data-seq-item]')];

test('관찰자 콜백이 오지 않아도 안전 타이머 뒤 풍선·제목이 모두 보인다', async () => {
  const { document, motion } = await setup({ observer: 'silent' });
  motion.initMotion({ safetyMs: 30 });
  motion.initSequences({ safetyMs: 30 });
  assert.ok(seqItems(document).every((el) => el.classList.contains('seq-hidden')), '처음에는 숨겨 둔다');
  assert.ok(document.querySelectorAll('.reveal').length > 0);
  await sleep(60);
  assert.equal(document.querySelectorAll('.seq-hidden').length, 0);
  assert.equal(document.querySelectorAll('.reveal').length, 0);
});

test('움직임 줄이기면 처음부터 아무것도 숨기지 않고, 도중에 켜도 즉시 모두 보인다', async () => {
  const reduced = await setup({ reduce: true });
  reduced.motion.initMotion();
  reduced.motion.initSequences();
  assert.equal(reduced.document.querySelectorAll('.seq-hidden, .reveal').length, 0);
  assert.equal(reduced.document.documentElement.classList.contains('js-motion'), false);

  const live = await setup();
  live.motion.initMotion();
  live.motion.initSequences();
  assert.ok(live.document.querySelectorAll('.seq-hidden').length > 0);
  live.listeners.filter((l) => l.query.includes('reduce')).forEach((l) => l.fn({ matches: true }));
  assert.equal(live.document.querySelectorAll('.seq-hidden, .reveal, .is-playing').length, 0);
  assert.equal(live.document.documentElement.classList.contains('js-motion'), false);
});

test('해시 이동·스크롤 복원으로 이미 지나간 구역은 숨기지 않고, 숨긴 뒤 지나가도 바로 보인다', async () => {
  const passed = await setup({ place: 'above' });
  passed.motion.initSequences();
  passed.motion.initMotion();
  assert.equal(passed.document.querySelectorAll('.seq-hidden, .reveal').length, 0, '화면 위 구역은 처음부터 보인다');

  const jumped = await setup();
  jumped.motion.initSequences();
  assert.ok(jumped.document.querySelectorAll('.seq-hidden').length > 0);
  // 숨긴 직후 #faq로 건너뛰어 구역이 화면 위로 지나감
  jumped.observers.forEach((o) => o.fire(false, { top: -900, bottom: -700 }));
  assert.equal(jumped.document.querySelectorAll('.seq-hidden').length, 0);
});

test('데스크톱은 첫 풍선이 보일 때 시안 순서대로 320ms 간격, 900px 미만은 풍선마다 각자', async () => {
  const wide = await setup();
  wide.motion.initSequences();
  const story = [...wide.document.querySelectorAll('.story-scene [data-seq-item]')];
  assert.equal(story[0].textContent, '아이의 말에 어떻게 반응하지?');
  const storyObserver = wide.observers.find((o) => o.targets.includes(story[0]));
  assert.ok(storyObserver && storyObserver.targets.length === 1, '데스크톱은 그룹의 첫 풍선 하나만 관찰');
  storyObserver.fire(true);
  assert.deepEqual(story.map((el) => el.style.getPropertyValue('--seq-delay')), ['0ms', '320ms', '640ms']);
  assert.ok(story.every((el) => el.classList.contains('is-playing')));

  const narrow = await setup({ narrow: true });
  narrow.motion.initSequences();
  const items = seqItems(narrow.document);
  assert.equal(narrow.observers.length, items.length, '모바일은 풍선마다 관찰');
  narrow.observers[4].fire(true);
  assert.ok(items[4].classList.contains('is-playing'));
  assert.equal(items[4].style.getPropertyValue('--seq-delay'), '0ms');
  assert.ok(items[5].classList.contains('seq-hidden'), '아직 안 보인 풍선은 그대로');
});

test('끝남 처리는 풍선 자신의 애니메이션(가상 요소 제외)에서 한 번만', async () => {
  const { document, motion, observers } = await setup();
  motion.initSequences();
  const first = seqItems(document)[0];
  observers.find((o) => o.targets.includes(first)).fire(true);
  const end = (props) => {
    const event = new document.defaultView.Event('animationend');
    Object.assign(event, props);
    first.dispatchEvent(event);
  };
  end({ animationName: 'qs-bubble-dot', pseudoElement: '::before' });
  assert.ok(first.classList.contains('is-playing'), '점(::before) 애니메이션 끝은 무시');
  end({ animationName: 'qs-bubble-in', pseudoElement: '' });
  assert.equal(first.classList.contains('is-playing'), false);
  assert.equal(first.style.getPropertyValue('--seq-delay'), '');
});
