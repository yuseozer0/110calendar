# 110 캘린더 Firebase 연결 마무리

## Vercel 환경변수
다음 6개를 Production / Preview에 등록합니다.

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID


## 앱 푸시 알림 설정

알림 기능에는 아래 3개 환경변수가 추가로 필요합니다.

- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `NEXT_PUBLIC_APP_URL` = `https://110calendar.vercel.app`

### 1. 웹 푸시 키 만들기

1. Firebase Console → 프로젝트 설정 → Cloud Messaging
2. 웹 푸시 인증서에서 키 쌍 생성
3. 표시된 공개 키를 `NEXT_PUBLIC_FIREBASE_VAPID_KEY`에 등록

### 2. 서버용 서비스 계정 등록

1. Firebase Console → 프로젝트 설정 → 서비스 계정
2. 새 비공개 키 생성을 눌러 JSON 파일 다운로드
3. JSON 전체를 한 줄로 만든 뒤 Vercel의 `FIREBASE_SERVICE_ACCOUNT_KEY` 값으로 등록

`FIREBASE_SERVICE_ACCOUNT_KEY`에는 관리자 비밀키가 포함됩니다. 절대로 `NEXT_PUBLIC_` 접두사를 붙이거나 GitHub에 업로드하지 마세요.

환경변수를 저장한 뒤 Vercel에서 한 번 다시 배포해야 알림 버튼이 활성화됩니다.

## 친구들이 앱을 설치하는 방법

- 아이폰: Safari 공유 버튼 → 홈 화면에 추가 → 설치된 앱에서 알림 받기
- 안드로이드: Chrome 메뉴 또는 화면의 앱 설치 버튼 → 설치 → 알림 받기
- 알림 권한은 각 기기에서 한 번씩 허용해야 합니다.

## Firebase Authentication

로그인하지 않아도 학급 일정과 급식은 볼 수 있습니다. 개인 일정을 여러 기기에서 보려는 사용자만 Google 로그인을 사용합니다.

### Google 로그인 활성화

1. Firebase Console → Authentication → 로그인 방법
2. `Google`을 선택하고 사용 설정
3. 프로젝트 지원 이메일을 선택하고 저장
4. Authentication → 설정 → 승인된 도메인에 `110calendar.vercel.app`이 없으면 추가

### 관리자 로그인 유지

1. Authentication → 로그인 방법에서 이메일/비밀번호 활성화
2. 사용자 메뉴에서 관리자 계정 생성

관리자는 기존 이메일/비밀번호로 로그인하며, 학급 공개 일정과 개인 일정을 모두 사용할 수 있습니다. 일반 사용자는 Google 로그인 후 자신의 개인 일정만 추가·수정·삭제할 수 있습니다.

## 관리자 권한
Firestore에 아래 문서를 만듭니다.

- 컬렉션: `admins`
- 문서 ID: 관리자 계정 UID
- 필드: `role` (string) = `admin`

## Firestore 보안 규칙
프로젝트 루트의 `firestore.rules` 내용을 Firebase Console > Firestore Database > 규칙에 붙여 넣고 게시합니다.

개인 일정은 `users/{사용자 UID}/personalSchedules`에 저장됩니다. 새 보안 규칙을 게시해야 본인만 자신의 개인 일정을 읽고 수정할 수 있습니다. 규칙 게시 전에는 개인 일정 화면에 보안 규칙 오류가 표시될 수 있습니다.

## 개인 일정 사용 방법

1. 화면의 `개인 일정 로그인`을 누르고 Google 계정으로 로그인
2. `+` 버튼으로 일정 추가
3. 공개 범위에서 `나만 보기` 선택
4. 같은 Google 계정으로 로그인한 휴대폰·태블릿·컴퓨터에서 동기화 확인

개인 일정은 학급 친구와 관리자에게 공개되지 않습니다. 현재 푸시 알림은 학급 공개 일정에만 전송되며 개인 일정 리마인드 알림은 포함하지 않습니다.

`개인 일정` 보기에서는 사용자마다 개인 카테고리를 최대 12개까지 만들고 이름을 변경하거나 삭제할 수 있습니다. 카테고리 설정은 `users/{uid}/personalCategories`에 저장되어 같은 계정으로 로그인한 기기에서 동기화됩니다.

## 배포 후 테스트
1. 로그아웃 상태에서 학급 일정과 급식이 정상적으로 보이는지 확인
2. Google 로그인 후 `나만 보기` 개인 일정 등록
3. 새로고침 후 개인 일정 유지 확인
4. 같은 Google 계정으로 다른 기기에서 개인 일정 동기화 확인
5. 다른 Google 계정에서는 해당 개인 일정이 보이지 않는지 확인
6. 일반 사용자가 학급 공개 일정을 추가·수정·삭제할 수 없는지 확인
7. 관리자 이메일/비밀번호 로그인 후 학급 공개 일정 등록
8. 친구 기기에서 앱 설치 후 `알림 받기` 선택
9. 관리자가 테스트 학급 일정을 등록했을 때 친구 기기에 알림이 도착하는지 확인
