# 약모고 웹 (Yakmogo Web)

약모고 웹은 가족의 약 복용자, 보호자와 복약 일정을 관리하는 React 관리자 화면입니다. 운영 배포에서는 독립 웹 서버로 실행하지 않고 빌드 결과를 Spring Boot image에 포함해 API와 같은 주소에서 제공합니다.

## 로컬 실행

Node.js와 npm을 준비한 뒤 실행합니다.

```bash
npm install
npm run dev
```

Vite 개발 서버는 기본적으로 `5173` 포트를 사용합니다. 실제 서버에 약모고 전체 시스템을 설치하는 방법은 백엔드 저장소의 README와 `deploy/portable/README.md`를 참고하세요. 새 운영 서버에는 이 웹 저장소나 Node.js를 별도로 설치할 필요가 없습니다.

## 개발 배경과 방식

약모고 초기 버전은 개발자가 직접 설계하고 구현했습니다. 실제 가족이 사용하면서 Telegram 푸시만으로는 복약 알림을 명확하게 인지하기 어렵다는 한계를 확인했고, 향후 Kotlin Android 앱으로 알림 경험을 확장할 수 있도록 백엔드 구조와 함께 관리자 웹도 고도화했습니다. 중복 발송 방지와 복약 상태 처리의 일관성 같은 신뢰성 항목은 이 고도화 과정에서 해결할 기술 과제로 다뤘습니다.

고도화 버전은 AI 코딩 도구를 적극 활용하는 **바이브 코딩(vibe coding)** 방식으로 개발했습니다. 화면과 코드를 자동 생성한 뒤 그대로 사용하는 방식이 아니라, 개발자가 사용자 흐름과 설계 방향을 결정하고 React component test, lint, production build와 실제 통합 화면 검증을 거쳐 반영했습니다.

## 주요 고도화 내용

- 약품 일정 생성·수정·삭제 흐름과 화면 상태 개선
- DAILY, WEEKLY, INTERVAL 일정 입력과 검증 메시지 정리
- 인증 만료와 API 오류 응답 처리 개선
- 접근 가능한 이름과 역할을 기준으로 한 사용자 상호작용 테스트 추가
- Vitest, React Testing Library, ESLint와 production build를 CI에서 자동 검증
- 빌드된 정적 파일을 Spring Boot·ARM64 Docker image에 통합

Android 앱, Device, Pairing과 FCM 기능은 현재 웹 프로젝트에 포함되어 있지 않습니다. Android는 약모고 2차 개발 로드맵에서 별도로 진행합니다.

## 기술 구성

- React 19
- TypeScript
- Vite
- React Router
- Axios
- Vitest와 React Testing Library
- ESLint

## 품질 검사

화면을 변경한 뒤 다음 검사를 모두 실행합니다.

```bash
npm run lint
npm test
npm run build
```

테스트는 CSS 모양보다 사용자가 인식하는 이름·역할과 실제 상호작용을 기준으로 작성합니다. Windows PowerShell에서 `npm.ps1` 실행이 차단되면 `npm.cmd`로 같은 명령을 실행할 수 있습니다.

## 백엔드 통합

```bash
npm run build
```

생성된 `dist`는 백엔드의 release image 빌드 입력으로 사용됩니다. 현재 표준 배포 흐름에서는 파일을 백엔드 소스 디렉터리에 수동으로 복사하지 않고 release script와 CI가 image에 통합합니다.

약모고 전체 구조, Docker 설치, DB 백업과 운영 방법은 백엔드 저장소의 README에서 관리하고 이 README에는 프런트엔드 개발에 필요한 내용만 둡니다.
