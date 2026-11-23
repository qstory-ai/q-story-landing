// 시안 구역 안의 그림 묶음만 남기고 나머지를 숨겨 투명 배경 PNG로 찍는다.
// node cutout.mjs '[{"sec":0,"keep":["img[src*=e1737]","img[src*=\"9440c\"]"],"maxW":760,"out":"x.png"}]'
import { chromium } from 'playwright-core';
const jobs = JSON.parse(process.argv[2]);
const b = await chromium.launch({ channel: 'msedge' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.emulateMedia({ reducedMotion: 'reduce' });
await p.goto('http://localhost:5180/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
for (const j of jobs) {
  await p.reload({ waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const clip = await p.evaluate(({ sec, keep, maxW }) => {
    const s = document.querySelectorAll('main > section')[sec];
    const st = s.querySelector('[data-acc-state]:not([hidden])') || s.querySelector('.slide.is-on') || s;
    const union = (el) => { const rs = [el, ...el.querySelectorAll('*')].map((e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
      return rs.reduce((a, r) => ({ l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.right), b: Math.max(a.b, r.bottom) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 }); };
    const groups = keep.map((sel) => { let el = st.querySelector(sel), best = el; while (el && el !== st) { const u = union(el); if (u.r - u.l <= maxW) best = el; el = el.parentElement; } return best; });
    document.body.style.background = 'transparent';
    for (const e of [document.documentElement, document.body, ...document.querySelectorAll('*')]) e.style.setProperty('background', 'transparent', 'important');
    document.querySelector('header').style.display = 'none';
    st.style.visibility = 'hidden';
    s.querySelectorAll('*').forEach((e) => (e.style.visibility = 'hidden'));
    groups.forEach((g) => [g, ...g.querySelectorAll('*')].forEach((e) => { e.style.visibility = 'visible'; e.style.removeProperty('background'); }));
    const us = groups.map(union);
    const u = us.reduce((a, r) => ({ l: Math.min(a.l, r.l), t: Math.min(a.t, r.t), r: Math.max(a.r, r.r), b: Math.max(a.b, r.b) }));
    return { x: u.l + scrollX, y: u.t + scrollY, width: u.r - u.l, height: u.b - u.t };
  }, j);
  // 그림 안쪽 배경은 되살려야 하므로 inline background 지운 걸 그대로 두고 찍는다
  await p.screenshot({ fullPage: true, omitBackground: true, path: j.out, clip });
  console.log(j.out, Math.round(clip.width), Math.round(clip.height));
}
await b.close();
