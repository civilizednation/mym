# 무석연합민턴 🏸

무석연합교회 배드민턴 모임 앱 (스마트폰 세로 화면 기준)

## 기능
- **코트비 엔빵**: 날짜 선택 → 코트비(기본 276위안) / 콕 구매(기본 140위안) → 이름 탭으로 참석 체크(2시간 = 1명, 1시간↓ = 0.5명) → 정산
  - 자녀는 보호자에게 합산 청구 — 예) `문명국(본인+아들) 92.4위안`
  - 정산 후 `수정` → 다시 `엔빵 정산`, `결과 복사`로 단톡방 공유
- **모임 기록**: 날짜별 정산 기록, 눌러서 보기 · 수정 · 삭제
- **멤버**: 추가 · 편집 · 삭제, 자녀는 "정산하는 사람(보호자)" 지정

## 개발
```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 빌드 (Vercel: Vite 프리셋 그대로 배포)
```

## 데이터 저장 (Firebase Firestore · cnation-project)
- `mym_meta/members` : 멤버 명단
- `mym_records/{YYYY-MM-DD}` : 날짜별 엔빵 기록
- 링크를 아는 누구나 보기/정산/수정 가능 (A 방식). 보안 규칙은 `firestore.rules` 참고
- 설정값: `src/firebaseConfig.js` (Vercel 환경변수 `VITE_FIREBASE_*` 로 덮어쓰기 가능)
