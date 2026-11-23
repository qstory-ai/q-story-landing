import { CONTACT_EMAIL, landingMetadata, trackLandingEvent, wireCtas, wireMenu, wireZoom } from './tracking.js';

// 768px 이상은 시안을 브라우저 폭의 80% 크기로 맞춘다. 좁으면 줄이고 넓으면 키운다.
// 767px 이하는 시안 무대를 숨기고 모바일 화면(mobile.css)을 보여 주므로 배율을 1로 둔다.
wireZoom({ mobileWidth: 768, maxZoom: Infinity, scale: 0.8 });
wireCtas();
wireMenu();

trackLandingEvent('landing_view', {
  page: 'landing',
  entry: landingMetadata.utm_source || 'direct',
});

document.querySelectorAll('[data-year]').forEach((year) => (year.textContent = String(new Date().getFullYear())));

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * 자동 넘김. ms마다 next()를 부른다. 다음 중 하나면 넘기지 않는다.
 * - 마우스가 올라가 있거나 안에 초점이 있을 때(정지 버튼에 있는 초점은 빼고)
 * - 정지 버튼(data-auto-toggle)을 눌러 멈췄을 때
 * - 탭이 가려졌거나, 모바일이라 무대가 숨겨졌을 때
 * 움직임 줄이기 설정이면 처음부터 돌리지 않고 정지 버튼도 숨긴다.
 */
function autoplay(root, next, ms) {
  const toggle = root.querySelector('[data-auto-toggle]');
  if (reducedMotion) {
    if (toggle) toggle.hidden = true;
    return;
  }
  let hovering = false;
  let focused = false;
  let userPaused = false;
  root.addEventListener('mouseenter', () => (hovering = true));
  root.addEventListener('mouseleave', () => (hovering = false));
  root.addEventListener('focusin', (event) => (focused = event.target !== toggle));
  root.addEventListener('focusout', () => (focused = false));
  toggle?.addEventListener('click', () => {
    userPaused = !userPaused;
    toggle.setAttribute('aria-pressed', String(userPaused));
    toggle.setAttribute('aria-label', userPaused ? '자동 넘김 다시 재생' : '자동 넘김 멈추기');
  });
  setInterval(() => {
    if (userPaused || hovering || focused || document.hidden || root.getClientRects().length === 0) return;
    next();
  }, ms);
}

// 머리글 메뉴: 지금 보는 구역 표시(aria-current).
const sectionLinks = [...document.querySelectorAll('.header-nav a[href^="#"]')];
const sectionTargets = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const setCurrentSection = (id) => {
  sectionLinks.forEach((link) => {
    if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setCurrentSection(visible.target.id);
    },
    { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.2] },
  );
  // 첫 화면도 지켜봐서, 맨 위로 돌아오면 표시를 지운다(메뉴에 #top 링크가 없으니 모두 해제된다).
  [document.querySelector('#top'), ...sectionTargets].filter(Boolean).forEach((section) => observer.observe(section));
}

// 첫 화면: 시안 세 장을 6초마다 넘긴다(autoplay 규칙).
const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const slides = [...carousel.querySelectorAll('[data-slide]')];
  const dots = [...carousel.querySelectorAll('[data-dot]')];
  const HERO_BG = ['#7550d3', '#ff6685', '#7bd9a6'];
  let current = 0;
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      const on = i === current;
      slide.classList.toggle('is-on', on);
      slide.toggleAttribute('inert', !on);
      if (on) slide.removeAttribute('aria-hidden');
      else slide.setAttribute('aria-hidden', 'true');
    });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    carousel.style.setProperty('--hero-bg', HERO_BG[current]);
  };
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)));
  autoplay(carousel.querySelector('.hero-art'), () => show(current + 1), 6000);
}

// POINT 1: 항목을 누르면 그 항목이 펼쳐진 시안 상태로 바꾼다.
// 가만히 두면 5초마다 다음 항목으로 넘긴다(autoplay 규칙).
const acc = document.querySelector('[data-acc]');
if (acc) {
  const states = [...acc.querySelectorAll('[data-acc-state]')];
  let current = 0;
  const show = (index) => {
    current = (index + states.length) % states.length;
    states.forEach((state, i) => (state.hidden = i !== current));
  };
  acc.addEventListener('click', (event) => {
    const button = event.target.closest('[data-acc-item]');
    if (!button) return;
    show(Number(button.dataset.accItem));
    states[current].querySelector(`[data-acc-item="${current}"]`)?.focus();
  });
  autoplay(acc, () => show(current + 1), 5000);
}

// 자주 묻는 질문: 하나를 열면 같은 목록(데스크톱·모바일 각각)의 나머지는 닫는다.
document.querySelectorAll('.faq-list details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    detail.closest('.faq-list').querySelectorAll('details[open]').forEach((other) => {
      if (other !== detail) other.removeAttribute('open');
    });
  });
});

// 개인정보처리방침·이용약관: 공개 주소가 아직 없어 문의 메일로 안내한다.
const legalNotes = [...document.querySelectorAll('[data-legal-note]')];
const LEGAL_LABEL = { privacy: '개인정보처리방침', terms: '이용약관' };
document.querySelectorAll('[data-legal]').forEach((button) => {
  button.addEventListener('click', () => {
    const label = LEGAL_LABEL[button.dataset.legal] ?? '문서';
    legalNotes.forEach((legalNote) => {
      legalNote.innerHTML = '';
      legalNote.append(`${label} 전문은 `);
      const link = document.createElement('a');
      link.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${label} 요청`)}`;
      link.textContent = CONTACT_EMAIL;
      legalNote.append(link, '으로 요청해 주시면 보내 드려요.');
    });
  });
});
