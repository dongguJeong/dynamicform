# Dynamic Form API Server

Node.js + Express 기반의 API 서버입니다.
- Echo API: 모든 요청을 그대로 응답으로 반환
- 폼 저장/관리: 커스텀 폼을 메모리에 저장하고 조회

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

### 7. 폼 저장
```bash
POST /api/forms/save
Content-Type: application/json

{
  "name": "회원가입 폼",
  "config": "{\"title\":\"회원가입\",\"api\":\"/api/register\",\"content\":[...]}"
}
```

### 8. 폼 목록 조회
```bash
GET /api/forms/list
```

### 9. 특정 폼 조회
```bash
GET /api/forms/FORM-1234567890
```

### 10. 폼 삭제
```bash
DELETE /api/forms/FORM-1234567890
```

### 11. 커스텀 폼 제출
```bash
POST /api/custom-form
Content-Type: application/json

{
  "username": "test",
  "email": "test@example.com"
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
- **폼 관리**: 커스텀 폼을 메모리에 저장/조회/삭제 (재시작 시 초기화)
- **자동 재시작**: `--watch` 플래그로 파일 변경 시 자동 재시작

## 폼 저장소

현재는 메모리(Map)에 저장되므로 서버 재시작 시 데이터가 사라집니다.
실제 운영 환경에서는 데이터베이스(MongoDB, PostgreSQL 등)를 사용하세요.

```javascript
// 서버 메모리에 저장
const savedForms = new Map();
```

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
