# 💊 약손 (Yakmogo) - Frontend

가족들의 투약 관리를 위해 만들어진 '약손' 프로젝트의 프론트엔드(SPA) 레포지토리입니다.

## 📌 개요

* **목적:** 직관적인 투약 스케줄 관리 및 관리자 UI 제공
* **구조:** React + Vite 기반의 Single Page Application (SPA)
* **배포 방식:** 본 프론트엔드 프로젝트는 독립적으로 배포되지 않으며, 빌드 결과물(`dist`)이 백엔드(Spring Boot)의 정적 리소스 폴더로 이관되어 하나의 통합된(Fat JAR) 형태로 서빙됩니다.

## ⚙️ 기술 스택

* **Framework:** React
* **Build Tool:** Vite
* **Routing:** React Router (SPA 라우팅)

## 🚀 로컬 개발 (Development)

로컬 개발 시에는 Vite 개발 서버를 구동하여 작업합니다. (기본 포트: 5173)

```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm run dev
```

## 📦 빌드 및 통합 (Build & Integration)

본 프로젝트는 백엔드와 통합하여 배포해야 합니다.

1. **프론트엔드 프로젝트를 빌드합니다.**
```bash
npm run build
```

2. **생성된 `dist` 폴더 내부의 모든 파일과 폴더를 복사합니다.**

3. **백엔드 프로젝트의 `src/main/resources/static/` 경로에 붙여넣기 합니다.** (기존 파일이 있다면 덮어쓰기)
    * *주의: 백엔드의 `.gitignore`에 해당 경로가 추가되어 있어야 불필요한 빌드 파일 커밋을 막을 수 있습니다.*

---
*백엔드 서버 설정 및 전체 배포 가이드는 백엔드 레포지토리의 README를 참고해주세요.*
