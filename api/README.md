# Dynamic Form API Server

Node.js + Express 기반의 간단한 Echo API 서버입니다. 모든 API 요청을 받아서 그대로 응답으로 돌려줍니다.

## 시작하기

### API 서버만 실행
```bash
cd api
npm run dev
```

### 프론트엔드 + API 서버 동시 실행 (루트 디렉토리에서)
```bash
npm run dev:all
```

## 서버 정보

- **포트**: 3001
- **URL**: http://localhost:3001
- **헬스 체크**: http://localhost:3001/health

## API 엔드포인트

### 1. 서버 선택 (단일 API)
```bash
POST /api/selectServer
Content-Type: application/json

{
  "requestTitle": "신규 배포 서버 요청",
  "env": "dev"
}
```

### 2. 요청 정보
```bash
POST /api/request
Content-Type: application/json

{
  "title": "배포 요청",
  "requester_email": "user@example.com",
  "description": "상세 내용"
}
```

### 3. 서버 설정
```bash
POST /api/server
Content-Type: application/json

{
  "environment": "dev",
  "type": "web"
}
```

### 4. 기능 설정
```bash
POST /api/features
Content-Type: application/json

{
  "enabled_services": ["ssl", "cdn"]
}
```

### 5. 사용자 생성
```bash
POST /api/user/create
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

### 6. 사용자 설정
```bash
POST /api/user/settings
Content-Type: application/json

{
  "notificationEnabled": true,
  "privacyLevel": "public"
}
```

## 응답 형식

모든 API는 다음 형식의 응답을 반환합니다:

```json
{
  "success": true,
  "timestamp": "2026-01-24T07:00:00.000Z",
  "echo": {
    "method": "POST",
    "path": "/api/selectServer",
    "query": {},
    "body": { ... },
    "headers": { ... }
  },
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "serverId": "SERVER-1234567890",
    ...
  }
}
```

## 기능

- **CORS 지원**: 모든 오리진에서 요청 가능
- **요청 로깅**: 모든 요청의 메서드, 경로, 헤더, 바디를 콘솔에 출력
- **Echo 응답**: 받은 요청 정보를 그대로 응답에 포함
- **자동 재시작**: `--watch` 플래그로 파일 변경 시 자동 재시작

## 개발 모드

`node --watch` 기능을 사용하여 파일 변경 시 자동으로 서버가 재시작됩니다 (Node.js 18.11.0 이상 필요).

만약 이전 버전의 Node.js를 사용한다면 `nodemon`을 설치하여 사용할 수 있습니다:

```bash
npm install -D nodemon
```

그리고 package.json의 dev 스크립트를 수정:
```json
"dev": "nodemon server.js"
```
