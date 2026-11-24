// 모바일(767px 이하) 화면. 시안이 없어 데스크톱 시안의 문구·색·그림을 세로 흐름으로 다시 짠 것이다.
// assemble.mjs가 각 구역 안에 <div class="m">로 넣는다. 데스크톱 무대(.art)와 같은 구역을 쓰므로 구역 수와 id는 그대로다.
// 글자 크기는 디자인 시스템 단계(30/24/18/16/14/12)만, 여백은 4의 배수 토큰(--sp-*)만 쓴다.

// 모바일 그림. .m이 display: none이어도 Chromium은 지연 로딩 그림을 부모 구역이 가까워지면 받는다.
// 그래서 768px 이상에서는 <source>가 1x1 빈 GIF(data URI)를 고르게 해 요청 자체를 막는다.
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const img = (src, alt, w, h, cls = '') =>
  `<picture><source media="(min-width: 768px)" srcset="${BLANK}"><img${cls ? ` class="${cls}"` : ''} src="${src}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async"></picture>`;
const chip = (text, tone = 'purple') => `<p class="m-chip m-chip--${tone}">${text}</p>`;
const head = ({ chip: c, tone, title, sub, tag = 'h2' }) =>
  `<div class="m-head">${c ? chip(c, tone) : ''}<${tag} class="m-title">${title}</${tag}>${sub ? `<p class="m-sub">${sub}</p>` : ''}</div>`;
const check = '<svg class="m-check" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10"/><path d="M5.5 10.2l3 3 6-6.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function mobileHeader(logoSrc) {
  return `<div class="m m-bar">
        <a class="m-logo" href="#top" aria-label="Q-Story 홈">${img(logoSrc, 'Q-Story', 112, 40).replace(' loading="lazy"', '')}</a>
        <a class="m-bar-cta" href="#start" data-player-link data-cta-location="header-mobile">무료 체험</a>
        <button type="button" class="m-menu-button" aria-label="메뉴 열기" aria-expanded="false" aria-controls="site-menu" data-menu-button>
          <span aria-hidden="true"></span>
        </button>
      </div>`;
}

export function mobileSections(faqData) {
  const s = {};

  s.top = `<div class="m m-hero">
        ${chip('AI 시대, 우리 아이의 미래', 'glass')}
        <h1 class="m-title m-title--hero">아이의 질문으로 이어지는 동화, 큐스토리</h1>
        <p class="m-sub">읽는 즐거움을 넘어, 생각하고 표현하는 즐거움으로</p>
        <a class="m-btn m-btn--line" href="#start" data-player-link data-cta-location="hero-mobile">무료로 체험하기 →</a>
        ${img('/assets/mobile/hero-tablet.webp', 'Q-Story 동화 화면. 그레텔이 길을 잃지 않으려면 어떻게 하면 좋을지 묻고 있다', 720, 532, 'm-hero-img')}
      </div>`;

  const flow = [
    ['호기심', '이야기에 쏙 빠져들고', 'yellow'],
    ['질문', '어떻게 알 수 있을까?', 'pink'],
    ['응답과 탐색', '다른 방법은 없을까?', 'blue'],
    ['새로운 생각', '나는 이렇게 해볼래!', 'green'],
  ];
  s.about = `<div class="m m-wrap">
        <div class="m-panel m-panel--lavender">
          <h2 class="m-title m-title--purple">AI가 답하는 시대,<br>아이에게 필요한 건 스스로 묻는 힘</h2>
          <p class="m-sub">AI가 답을 척척 내놓을수록, 답을 아는 것보다 ‘무엇을 물을지’ 판단하는 힘이 더 중요해져요.</p>
          <ol class="m-flow">${flow.map(([t, d, c]) => `<li class="m-flow-item m-tone--${c}"><strong>${t}</strong><span>${d}</span></li>`).join('')}</ol>
          <p class="m-source">WEF, Future of Jobs Report (2025)</p>
        </div>
      </div>`;

  const pains = [
    ['/assets/figma/pain/ab552.svg', 117, 97, 'orange', '독후활동 정보는 넘쳐나지만', '결국 대화는 부모가 직접 만들어야 해요'],
    ['/assets/figma/pain/f7a41.svg', 109, 94, 'pink', '아이 반응에 맞춰 이어가기 어려워요', '퇴근 후 지친 저녁, 매번 좋은 질문을 건네기란 쉽지 않아요'],
    ['/assets/figma/pain/af457.svg', 134, 95, 'blue', '질문을 이끄는 AI 독서는 아직 없어요', '인터랙티브 도서는 늘었지만 질문을 이끄는 경험은 부족해요'],
  ];
  s.pain = `<div class="m m-wrap">
        ${head({ title: '책을 읽은 다음,<br>어떤 이야기를 나누면 좋을까요?', sub: '아이가 스스로 생각하고 표현하는 힘을 길러주고 싶지만, 집에서는 무엇을 어떻게 해줘야 할지 막막해요.' })}
        <ul class="m-cards">${pains
          .map(([src, w, h, tone, t, d]) => `<li class="m-card m-card--${tone}">${img(src, '', w, h, 'm-card-icon')}<h3 class="m-card-title">${t}</h3><p class="m-card-body">${d}</p></li>`)
          .join('')}</ul>
      </div>`;

  const worries = [
    ['/assets/figma/worry/a955d.svg', '“부모로서 아이의 질문과 생각을 잘 받아주고 있는 건지, 정말 생각하는 힘과 표현력을 길러주는 건지 모르겠어요.”', '교육 방법에 대한 고민'],
    ['/assets/figma/worry/0403a.svg', '“아이의 질문에 제대로 받아주고 싶다가도, 대화가 계속 이어지지 않고 한 번에 끝나요.”', '대화 방식에 대한 고민'],
  ];
  s.worry = `<div class="m m-wrap">
        ${head({ chip: '부모의 고민', title: '우리 아이의 질문이 이어지지 않아요', sub: '아이의 생각을 키워주고 싶지만, 마음처럼 쉽지는 않아요.' })}
        <ul class="m-cards">${worries
          .map(([src, q, tag]) => `<li class="m-card m-card--lavender m-quote">${img(src, '', 96, 96, 'm-quote-face')}<p class="m-card-body m-card-body--strong">${q}</p><p class="m-tag">${tag}</p></li>`)
          .join('')}</ul>
      </div>`;

  s.reading = `<div class="m m-wrap m-center">
        ${head({ chip: 'Q-Story의 독서', title: '아이의 궁금증이<br>더 큰 생각으로 이어지도록', sub: 'Q-Story는 동화 속에서 생각하고 표현하는 경험을 만들어요.' })}
        <div class="m-mascot">${img('/assets/figma/transition/d73ad.svg', '', 381, 416)}</div>
      </div>`;

  const studies = [
    ['선행연구 01', '더 깊은 이야기 이해', '질문과 피드백을 제공하는 대화형 AI는 이야기 이해와 관련된 발화를 높였어요.', 'Xu et al. (2022). Child Development, 93(2), e149–e167.', 'blue'],
    ['선행연구 02', '성인과 유사한 이해 효과', 'AI의 대화형 질문은 성인 독서 파트너와 비슷한 수준으로 이야기 이해를 도왔어요.', 'Xu et al. (2022). Child Development, 93(2), e149–e167.', 'green'],
  ];
  s.research = `<div class="m m-wrap">
        ${head({ chip: '연구 기반 설계', title: '아이의 질문이 만드는<br>더 깊은 독서 경험' })}
        <ul class="m-cards">${studies
          .map(([b, t, d, c, tone]) => `<li class="m-card m-card--line-${tone}">${chip(b, tone)}<h3 class="m-card-title">${t}</h3><p class="m-card-body">${d}</p><p class="m-source">${c}</p></li>`)
          .join('')}</ul>
        <div class="m-partners">
          <p class="m-partners-title">전문가와 함께 연구 · 개발 중이에요</p>
          <ul><li>연세대학교 발달심리 연구실</li><li>연세대학교 아동가족학회 MESO</li></ul>
        </div>
      </div>`;

  const points = [
    ['자유롭게 멈추고 물어봐요', '궁금한 순간, 이야기를 잠시 멈추고 등장인물에게 직접 질문할 수 있어요.'],
    ['캐릭터가 먼저 말을 걸어요', '캐릭터가 먼저 질문을 건네며 아이가 자연스럽게 생각을 하도록 이끌어요.'],
    ['생생한 삽화와 음성 낭독', '생생한 동화 삽화와 음성을 통해 이야기 속으로 빠져들어요.'],
  ];
  s.how = `<div class="m m-wrap">
        ${head({ chip: 'POINT 1', tone: 'orange', title: '아이와 캐릭터의 활발한 <em class="m-em--orange">상호작용</em>', sub: '동화 속 등장인물이 아이의 친구가 되어 함께 이야기하고, 묻고, 대답해요.' })}
        <div class="m-panel m-panel--orange">
          ${img('/assets/mobile/tablet.webp', 'Q-Story 동화 화면에서 캐릭터가 아이에게 질문하고 아이가 말로 답하는 모습', 720, 522, 'm-shot')}
          <ul class="m-points">${points.map(([t, d]) => `<li class="m-point"><h3 class="m-card-title">${t}</h3><p class="m-card-body">${d}</p></li>`).join('')}</ul>
        </div>
      </div>`;

  s.report = `<div class="m m-wrap">
        ${head({ chip: 'POINT 2', tone: 'blue', title: '아이의 질문을 <em class="m-em--blue">리포트</em>로 확인해요', sub: '원작의 구조 위에서, 아이의 말과 선택에 따라 새로운 장면이 탄생해요.' })}
        <div class="m-panel m-panel--blue">
          <p class="m-panel-lead">동화가 끝난 후에도,<br>아이의 생각은 계속 자라나니까</p>
          <p class="m-panel-card">아이가 남긴 질문과 관심사부터 함께 이야기할 후속 질문까지 하나의 리포트로 만나보세요.</p>
          <ul class="m-pills">${['활동 요약', '대화 기록', '관심과 생각', '후속 질문'].map((t) => `<li>${t}</li>`).join('')}</ul>
          ${img('/assets/mobile/tablet.webp', '아이와 캐릭터의 대화가 담긴 Q-Story 화면', 720, 522, 'm-shot')}
        </div>
      </div>`;

  const changes = [
    ['아이에게', 'yellow', '수동적으로 듣던 독서에서<br>스스로 묻고 말하는 독서로', ['궁금한 순간 멈추고 질문하는 습관', '“나라면?” 생각을 말로 표현하는 경험', '내 선택으로 이야기가 바뀌는 즐거움']],
    ['어른에게', 'purple', '아이의 생각을 알고,<br>그 다음 대화를 이어가는 힘', ['아이가 남긴 말과 관심사를 기록으로', '오늘 밤 함께 나눌 질문 추천', '바쁜 날에도 독서 대화를 이어가는 친구']],
  ];
  s.change = `<div class="m m-wrap">
        ${head({ chip: 'Q-Story가 만드는 변화', title: '아이에게는 <em class="m-em--purple">표현할 기회</em>를,<br>어른에게는 <em class="m-em--purple">새로운 대화의 시작</em>을' })}
        <ul class="m-cards">${changes
          .map(([who, tone, t, items]) => `<li class="m-card m-card--line-${tone}">${chip(who, tone)}<h3 class="m-card-title">${t}</h3><ul class="m-checks m-tone--${tone}">${items.map((x) => `<li>${check}<span>${x}</span></li>`).join('')}</ul></li>`)
          .join('')}</ul>
      </div>`;

  s.start = `<div class="m m-wrap m-cta">
        <h2 class="m-title">우리 아이의 질문<br>Q-Story에서 시작해볼까요?</h2>
        <p class="m-sub">아이의 질문이 대화가 되는 경험, Q-story에서 만나보세요.</p>
        <a class="m-btn m-btn--line" href="#start" data-player-link data-cta-location="start-mobile">무료로 체험하기 →</a>
        <p class="cta-status m-status" data-cta-status aria-live="polite"></p>
        ${img('/assets/mobile/cta-mascot.webp', '', 400, 400, 'm-cta-img')}
      </div>`;

  s.faq = `<div class="m m-wrap">
        ${head({ title: '자주 묻는 질문', sub: 'Q-story를 시작하기 전, 궁금한 점을 확인해보세요.' })}
        <div class="m-faq faq-list">${faqData
          .map(([q, a], i) => `<details class="m-faq-item"${i === 0 ? ' open' : ''}><summary><span class="m-faq-q" aria-hidden="true">Q</span><span>${q}</span></summary><p>${a}</p></details>`)
          .join('')}</div>
      </div>`;

  s.together = `<div class="m m-wrap">
        ${head({ title: '더 많은 아이와 이야기를,<br>함께 만들어가요.', sub: '아이들의 좋은 질문 경험을 확장할 교육기관과 콘텐츠 파트너를 기다립니다.' })}
        <ul class="m-cards">
          <li class="m-card m-card--line-blue"><h3 class="m-card-title">교육기관과 함께</h3><p class="m-card-body">유치원·학원·방과후 수업에서 함께 읽은 동화를 집에서 다시 이어가는 독서 경험을 만들어요.</p></li>
          <li class="m-card m-card--line-orange"><h3 class="m-card-title">출판사 · 창작자와 함께</h3><p class="m-card-body">보유하신 원작을 아이가 캐릭터와 대화하고 질문으로 확장하는 상호작용형 동화로 만들어요.</p></li>
        </ul>
        <a class="m-btn m-btn--purple" href="/partner" data-partner-link data-cta-location="together-mobile">협업 문의하기 →</a>
      </div>`;

  s.footer = `<div class="m m-wrap m-footer">
        <div class="m-foot-group">
          <h2>바로가기</h2>
          <p><a href="#about">Q-story 소개</a><a href="#how">이용방법</a><a href="#together">함께하기</a><a href="#faq">FAQ</a></p>
        </div>
        <div class="m-foot-group">
          <h2>문의하기</h2>
          <p><a href="mailto:qstoryai@gmail.com">qstoryai@gmail.com</a><a href="https://www.instagram.com/qstory.official/" target="_blank" rel="noopener">Instagram @qstory.official</a></p>
        </div>
        <div class="m-foot-group">
          <h2>회사 정보</h2>
          <p><span>대표: 강지명</span><span>전화번호: <a href="tel:010-7543-6779">010-7543-6779</a></span></p>
        </div>
        <p class="m-foot-legal"><button type="button" data-legal="privacy">개인정보처리방침</button><button type="button" data-legal="terms">이용약관</button></p>
        <p class="footer-legal-note m-legal-note" data-legal-note aria-live="polite"></p>
        <p class="m-copy">© <span data-year>2026</span> Q-Story. All rights reserved.</p>
      </div>`;

  return s;
}
