# 110 캘린더 Firebase 연결 마무리

## Vercel 환경변수
다음 6개를 Production / Preview에 등록합니다.

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

기존 v0에서 소문자 키(`apiKey`, `authDomain` 등)로 넣은 경우에도 현재 코드는 호환됩니다.

## Firebase Authentication
1. Authentication > 로그인 방법에서 이메일/비밀번호 활성화
2. 사용자 메뉴에서 관리자 계정 생성

## 관리자 권한
Firestore에 아래 문서를 만듭니다.

- 컬렉션: `admins`
- 문서 ID: 관리자 계정 UID
- 필드: `role` (string) = `admin`

## Firestore 보안 규칙
프로젝트 루트의 `firestore.rules` 내용을 Firebase Console > Firestore Database > 규칙에 붙여 넣고 게시합니다.

## 배포 후 테스트
1. 관리자 로그인
2. 일정 등록
3. 새로고침 후 일정 유지 확인
4. 다른 기기에서 동일 일정 확인
5. 로그아웃 후 추가/수정/삭제 버튼이 사라지는지 확인
