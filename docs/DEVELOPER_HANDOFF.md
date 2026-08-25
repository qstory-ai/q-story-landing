# Q-Story 랜딩 개발·배포 인수인계

## 1. 저장소의 역할

이 저장소는 `https://qstory.ai.kr` 랜딩페이지의 소스다. Vite 기반의 정적 사이트이며, 랜딩 CTA에서 가명 `session_id`와 `traffic_type`을 붙여 별도 플레이어로 이동한다. 랜딩 노출과 CTA 클릭 이벤트는 Supabase Edge Function으로 전송한다.

- 엔트리: `index.html`, `src/main.js`, `src/styles.css`
- 정적 자산: `public/assets/`
- 동작 검사: `tests/landing.test.mjs`
- Vercel 설정: `vercel.json`
- 제품 계약 정본: 메인 플레이어 저장소의 `Q-STORY_MASTER_SPEC.md`

## 2. Vercel 프로젝트 설정

GitHub에서 이 저장소를 Import한 뒤 다음처럼 설정한다.

| 항목 | 값 |
|---|---|
| Framework Preset | Vite |
| Root Directory | `.` |
| Install Command | `npm install` 기본값 |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Production Branch | `main` |

## 3. 환경변수

다음 세 개를 Vercel의 Production·Preview·Development 환경에 등록한다. 이 값들은 Vite 브라우저 번들에 노출되는 공개 설정이며 비밀 API 키가 아니다.

```dotenv
VITE_PLAYER_URL=https://play.qstory.ai.kr
VITE_ANALYTICS_URL=https://iruxvajkmtzkxzjckixn.supabase.co/functions/v1/beta-events
VITE_LANDING_RELEASE=tracking-v2-20260811
```

`VITE_PLAYER_URL` 뒤에는 랜딩 코드가 `session_id`와 `traffic_type`을 자동으로 붙인다. 현재 운영 플레이어의 `/stories/hansel-gretel` 경로는 공개 배포에서 404이므로, 해당 라우트를 플레이어에 먼저 배포·검증하기 전에는 루트 주소를 유지한다.

## 4. QR 고정 규칙

이미 인쇄된 대표 QR에 저장된 주소는 다음과 같다.

```text
https://qstory.ai.kr/qr
```

- QR 이미지는 재생성하지 않는다.
- `qstory.ai.kr` 도메인과 `/qr` 경로를 계속 보존한다.
- `vercel.json`의 `/qr` → `/` 임시 리다이렉트(307) 규칙을 삭제하지 않는다.
- 나중에 QR의 도착지를 바꾸려면 QR을 다시 인쇄하지 말고 `/qr` 리다이렉트의 `destination`만 수정한다.
- `/qr?utm_source=...` 형태의 유입 정보가 있을 때는 Vercel 리다이렉트가 쿼리를 보존하는지 Preview에서 확인한다.

## 5. 배포 절차

1. 새 공용 Vercel 프로젝트에 이 GitHub 저장소를 Import한다.
2. 위 환경변수 세 개를 등록한다.
3. Preview를 배포한 뒤 랜딩 홈, CTA, 이벤트 전송, `/qr` 307을 확인한다.
4. 기존 개인 Vercel 프로젝트에서 도메인 연결을 해제한 뒤 새 프로젝트에 다음 도메인을 연결한다.
   - `qstory.ai.kr`
   - `www.qstory.ai.kr`
   - `beta.qstory.ai.kr`
   - `start.qstory.ai.kr`
5. Production 배포 후 아래 검증을 통과한다.

## 6. 이전 후 필수 검증

```bash
npm install
npm test
npm run build
```

- `https://qstory.ai.kr` HTTP 200과 랜딩 화면
- `https://qstory.ai.kr/qr` HTTP 307 → `/` → 200
- 네 곳의 무료 체험 CTA가 `https://play.qstory.ai.kr/?session_id=...&traffic_type=beta`로 이동
- 랜딩 이벤트 전송 실패가 체험 이동을 막지 않음
- 모바일 360px와 데스크톱 1440px에서 주요 문구·CTA 겹침 없음

## 7. 롤백

이전이 완료될 때까지 기존 Vercel 프로젝트 `qstory-beta-landing`은 삭제하지 않는다. 새 배포에 문제가 있으면 도메인을 기존 정상 배포로 다시 연결한다. 도메인 등록업체의 DNS 레코드나 네임서버는 이 Vercel 프로젝트 이전 작업에서 삭제·변경하지 않는다.
