# Dynamic Form

React + TypeScript + Bootstrap 기반의 동적 폼 애플리케이션과 Node.js Echo API 서버

## 기술 스택

### 프론트엔드
- **React** 18.2
- **TypeScript** 5.3
- **Vite** (빌드 도구)
- **Bootstrap** 5.3 (UI 프레임워크)
- **axios** (HTTP 클라이언트)
- **date-fns** (날짜 처리)

### 백엔드 (API)
- **Node.js**
- **Express** 4.18
- **CORS** (Cross-Origin Resource Sharing)

## 시작하기

### 1. 의존성 설치

```bash
# 루트 디렉토리에서 프론트엔드 패키지 설치
npm install

# API 서버 패키지 설치
cd api
npm install
cd ..
```

### 2. 개발 서버 실행

#### 프론트엔드와 API 서버를 동시에 실행
```bash
npm run dev:all
```

이 명령어는 다음 두 서버를 동시에 실행합니다:
- 프론트엔드: http://localhost:5173
- API 서버: http://localhost:3001

#### 개별 실행

프론트엔드만 실행:
```bash
npm run dev
```

API 서버만 실행:
```bash
npm run dev:api
# 또는
cd api && npm run dev
```

## 프로젝트 구조

```
dynamicform/
├── src/                    # 프론트엔드 소스
│   ├── main.tsx           # 앱 진입점 (Bootstrap CSS import 포함)
│   ├── App.tsx            # 메인 컴포넌트
│   ├── index.css          # 글로벌 스타일
│   └── vite-env.d.ts      # Vite 타입 정의
├── api/                    # API 서버
│   ├── server.js          # Express 서버
│   ├── package.json       # API 의존성
│   └── README.md          # API 서버 문서
├── index.html             # HTML 템플릿
├── package.json           # 프론트엔드 의존성
├── tsconfig.json          # TypeScript 설정
├── vite.config.ts         # Vite 설정 (API 프록시 포함)
└── README.md              # 프로젝트 문서
```

## Vite 프록시 설정

프론트엔드에서 `/api/*` 경로로 요청하면 자동으로 `http://localhost:3001`로 프록시됩니다.

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
```

프론트엔드에서 API 호출 예제:
```typescript
import axios from 'axios';

// /api가 자동으로 http://localhost:3001/api로 프록시됨
const response = await axios.post('/api/selectServer', {
  requestTitle: '테스트',
  env: 'dev'
});
```

## 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## API 서버

API 서버는 모든 요청을 echo하는 간단한 서버입니다. 자세한 내용은 [api/README.md](api/README.md)를 참고하세요.

주요 엔드포인트:
- `POST /api/selectServer`
- `POST /api/request`
- `POST /api/server`
- `POST /api/features`
- `POST /api/user/create`
- `POST /api/user/settings`
- `GET /health`

## 개발 팁

1. **Hot Module Replacement (HMR)**: Vite는 파일 변경 시 자동으로 브라우저를 새로고침합니다.
2. **API 서버 자동 재시작**: `node --watch` 플래그로 API 서버 파일 변경 시 자동 재시작됩니다.
3. **TypeScript 타입 체크**: VSCode나 다른 IDE에서 자동으로 타입 체크가 수행됩니다.
4. **Bootstrap 컴포넌트**: [Bootstrap 공식 문서](https://getbootstrap.com/docs/5.3/components/)를 참고하세요.

## 문제 해결

### 포트가 이미 사용 중인 경우

프론트엔드 (5173 포트):
```bash
# 프로세스 종료 후 재시도
lsof -ti:5173 | xargs kill -9
npm run dev
```

API 서버 (3001 포트):
```bash
# 프로세스 종료 후 재시도
lsof -ti:3001 | xargs kill -9
npm run dev:api
```

### API 요청이 실패하는 경우

1. API 서버가 실행 중인지 확인: http://localhost:3001/health
2. 브라우저 콘솔에서 네트워크 탭 확인
3. API 서버 콘솔에서 요청 로그 확인
