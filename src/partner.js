// 협업 문의 화면(Figma "협업 문의화면"·"성공"·"오류"). 백엔드 POST /v1/partnership-inquiries(데모 앱 프록시 경유).
import {
  landingMetadata,
  partnershipUrl,
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
trackLandingEvent('landing_view', { page: 'partner', entry: landingMetadata.utm_source || 'direct' });

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^[0-9+\-\s()]{9,20}$/;

const form = document.querySelector('[data-partner-form]');
const submit = document.querySelector('[data-partner-submit]');
const views = {
  form: document.querySelector('[data-partner-view="form"]'),
  success: document.querySelector('[data-partner-view="success"]'),
  error: document.querySelector('[data-partner-view="error"]'),
};

function show(name) {
  Object.entries(views).forEach(([key, view]) => {
    if (view) view.hidden = key !== name;
  });
  window.scrollTo({ top: 0 });
  if (name !== 'form') views[name]?.focus();
}

function setError(field, message) {
  const error = document.getElementById(`pf-${field}-error`);
  const input = form.querySelector(field === 'consent' ? '[name="consent"]' : `#pf-${field}`);
  if (error) {
    error.textContent = message ?? '';
    error.hidden = !message;
  }
  if (input) {
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      if (error) input.setAttribute('aria-describedby', error.id);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }
}

function readForm() {
  const data = new FormData(form);
  const text = (name) => String(data.get(name) ?? '').trim();
  return {
    role: text('role'),
    name: text('name'),
    affiliation: text('affiliation'),
    jobTitle: text('jobTitle'),
    phone: text('phone'),
    email: text('email'),
    message: text('message'),
    privacyConsent: data.get('consent') === 'on',
  };
}

function validate(values) {
  const errors = {};
  if (!values.name) errors.name = '성함을 입력해주세요.';
  if (!values.affiliation) errors.affiliation = '소속 기관/기업명을 입력해주세요.';
  if (values.phone && !PHONE.test(values.phone)) errors.phone = '올바른 형식으로 입력해주세요.';
  if (!values.email) errors.email = '이메일을 입력해주세요.';
  else if (!EMAIL.test(values.email)) errors.email = '올바른 형식으로 입력해주세요.';
  if (!values.message) errors.message = '문의 내용을 입력해주세요.';
  if (!values.privacyConsent) errors.consent = '개인정보 수집 및 이용에 동의해주세요.';
  return errors;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = readForm();
  const errors = validate(values);
  ['name', 'affiliation', 'job', 'phone', 'email', 'message', 'consent'].forEach((field) => setError(field, errors[field]));
  const first = Object.keys(errors)[0];
  if (first) {
    form.querySelector(first === 'consent' ? '[name="consent"]' : `#pf-${first}`)?.focus();
    return;
  }

  submit.disabled = true;
  try {
    const response = await fetch(partnershipUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    if (response.ok) {
      trackLandingEvent('landing_cta_click', { cta_location: 'partner-submitted' });
      trackGaEvent('cta_click', { cta_location: 'partner-submitted' });
      form.reset();
      show('success');
      return;
    }
    if (response.status === 400) {
      // 서버 검증 실패는 같은 화면에서 고치게 한다.
      const body = await response.json().catch(() => null);
      const detail = body?.failure?.safeDetail || '입력한 내용을 다시 확인해주세요.';
      setError('message', detail);
      return;
    }
    show('error');
  } catch {
    show('error');
  } finally {
    submit.disabled = false;
  }
});

document.querySelector('[data-partner-retry]')?.addEventListener('click', () => show('form'));
