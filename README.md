# Q-Story 1차 베타 랜딩

6~9세 아이와 보호자가 「헨젤과 그레텔」 한 편을 바로 체험하도록 안내하는 정적 랜딩페이지다. 제품·콘텐츠 표현은 워크스페이스 루트의 `Q-STORY_MASTER_SPEC.md`, 시각 기준은 `03_브랜드디자인/BRAND_GUIDE.md`를 따른다.

로고의 기준 원본은 `public/assets/q-story-logo-source-checker-preview.svg`에 보존했다. 원본에 벡터 도형으로 포함된 회색 체커 무늬는 투명 배경 미리보기용이므로, 실사용 메인 로고 `public/assets/q-story-logo.svg`는 같은 질문책 벡터 형상에서 체커 무늬만 제거한 투명 SVG다.

## 로컬 실행

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_PLAYER_URL`을 실제 헨젤과 그레텔 서비스 주소로 바꾼다. 값이 없거나 올바른 `http(s)` 주소가 아니면 체험 버튼은 이동하지 않고 준비 중 안내를 보여 준다.

## 검사와 빌드

```bash
npm test
npm run build
```

## Vercel

- Root Directory: `.`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: `.env.example` 참고

랜딩과 플레이어를 별도 Vercel 프로젝트로 운영하며 공개 주소는 `qstory.ai.kr`과 `play.qstory.ai.kr`이다. 최종 주소 이전 시 랜딩 CTA·플레이어 마이크 권한·same-origin API proxy를 함께 재검증한다.

개발자 인수인계와 Vercel 재연결 절차는 `docs/DEVELOPER_HANDOFF.md`를 따른다.
