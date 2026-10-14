import { initIntroCircles } from './intro-circles.js';
import { animatePanel, initMotion } from './motion.js';
import {
  CONTACT_EMAIL,
  landingMetadata,
  trackGaEvent,
  trackLandingEvent,
  wireCtas,
  wireEmailCopy,
  wireMenu,
  wireZoom,
} from './tracking.js';

wireZoom();
wireCtas();
wireMenu();
wireEmailCopy();
initMotion();
// 소개 원 끌기 - 원 이름만, 세션당 원별 1회.
initIntroCircles({
  onFirstDrag: (circle) => {
    trackLandingEvent('intro_circle_drag', { circle });
    trackGaEvent('intro_circle_drag', { circle });
  },
});

trackLandingEvent('landing_view', {
  page: 'landing',
  entry: landingMetadata.utm_source || 'direct',
});

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());

// 머리글 메뉴: 지금 보는 구역 표시(aria-current).
const sectionLinks = [...document.querySelectorAll('.header-nav a[href^="#"]')];
const sectionTargets = sectionLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
const setCurrentSection = (id) => {
  sectionLinks.forEach((link) => {
    if (link.getAttribute('href') === `#${id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};
setCurrentSection('about');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target.id) setCurrentSection(visible.target.id);
    },
    { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.2] },
  );
  sectionTargets.forEach((section) => observer.observe(section));
}

// 이용방법 탭(01·02·03).
const tabs = [...document.querySelectorAll('.how-tab')];
const selectTab = (tab, focus = false) => {
  tabs.forEach((other) => {
    const selected = other === tab;
    other.setAttribute('aria-selected', String(selected));
    other.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(other.getAttribute('aria-controls'));
    if (panel) {
      panel.hidden = !selected;
      if (selected) animatePanel(panel);
    }
  });
  if (focus) tab.focus();
};
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (event) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    selectTab(tabs[(index + step + tabs.length) % tabs.length], true);
  });
});

// 자주 묻는 질문: 하나를 열면 나머지는 닫는다.
document.querySelectorAll('.faq-list details').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    document.querySelectorAll('.faq-list details[open]').forEach((other) => {
      if (other !== detail) other.removeAttribute('open');
    });
  });
});

// 개인정보처리방침·이용약관: 공개 주소가 아직 없어 문의 메일로 안내한다.
const legalNote = document.querySelector('[data-legal-note]');
const LEGAL_LABEL = { privacy: '개인정보처리방침', terms: '이용약관' };
document.querySelectorAll('[data-legal]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!legalNote) return;
    const label = LEGAL_LABEL[button.dataset.legal] ?? '문서';
    legalNote.innerHTML = '';
    legalNote.append(`${label} 전문은 `);
    const link = document.createElement('a');
    link.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${label} 요청`)}`;
    link.textContent = CONTACT_EMAIL;
    legalNote.append(link, '으로 요청해 주시면 보내 드려요.');
  });
});
