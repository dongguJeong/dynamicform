# Dynamic Form - 데이터베이스 스키마 및 API 통신 가이드

## 목차
1. [개요](#개요)
2. [데이터베이스 스키마 설계](#데이터베이스-스키마-설계)
3. [API 엔드포인트 설계](#api-엔드포인트-설계)
4. [데이터 흐름](#데이터-흐름)
5. [구현 예시](#구현-예시)
6. [보안 고려사항](#보안-고려사항)

---

## 개요

이 문서는 Dynamic Form 시스템을 실제 데이터베이스와 연동하기 위한 스키마 설계 및 API 통신 방법을 설명합니다.

### 현재 구현 상태

**메모리 저장소 (개발 버전)**
- 현재 구현은 Map 객체를 사용한 메모리 저장소 기반
- 서버 재시작 시 모든 데이터 초기화
- 승인 관리 API 포함 (`/api/approvals/*`)
- 개발 및 테스트 목적

**데이터베이스 버전 (이 문서)**
- 운영 환경을 위한 이론적 설계
- MySQL/PostgreSQL 스키마 제공
- 트랜잭션, 외래키, 인덱스 최적화 포함
- 실제 구현 시 참고용

### 주요 개념

1. **Form Schema (폼 스키마)**: 폼의 구조와 필드 정의를 저장
2. **Form Submission (폼 제출 데이터)**: 사용자가 입력한 실제 데이터를 저장
3. **Form Templates (폼 템플릿)**: 재사용 가능한 폼 구조
4. **Standard Fields (표준 필드)**: 일관성 있는 필드 ID 사용을 위한 사전 정의 필드 목록
5. **Approval Flow (승인 플로우)**: 폼 제출 시 지정 가능한 승인자 체인

### 지원되는 필드 타입 (14가지)

시스템에서 지원하는 모든 필드 타입:

1. **text**: 기본 텍스트 입력
2. **email**: 이메일 입력
3. **password**: 비밀번호 입력
4. **number**: 숫자 입력
5. **textarea**: 여러 줄 텍스트 입력
6. **select**: 드롭다운 선택
7. **radio**: 라디오 버튼 선택
8. **checkbox**: 체크박스 (단일 또는 다중 선택)
9. **date**: 날짜 선택
10. **daterange**: 기간 선택 (시작일-종료일, 전체 선택, 라디오 버튼 프리셋)
11. **apiselect**: API에서 옵션을 가져오는 드롭다운
12. **modalselect**: 모달 UI를 통한 다중 선택
13. **file**: 파일 업로드 (추후 구현)
14. **servergroupchange**: 서버 그룹 변경 요청 (사용자별 그룹 할당 관리)

---

## 데이터베이스 스키마 설계

### 1. 폼 스키마 테이블 (form_schemas)

폼의 구조와 설정 정보를 저장하는 마스터 테이블

```sql
CREATE TABLE form_schemas (
  -- 기본 정보
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT '폼 이름',
  code VARCHAR(100) UNIQUE COMMENT '폼 코드 (예: account-extension)',
  description TEXT COMMENT '폼 설명',

  -- 폼 설정 (JSON)
  config JSON NOT NULL COMMENT 'FormConfig 전체 구조 (title, description, api, apis, content)',

  -- 메타데이터
  version INT DEFAULT 1 COMMENT '버전 번호',
  is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 상태',
  category VARCHAR(100) COMMENT '폼 카테고리 (계정, 서버, 사용자 등)',

  -- 권한 및 접근 제어
  allowed_roles JSON COMMENT '접근 가능한 역할 목록 ["admin", "user"]',
  created_by VARCHAR(100) COMMENT '생성자 ID',

  -- 시간 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL COMMENT '소프트 삭제',

  -- 인덱스
  INDEX idx_code (code),
  INDEX idx_category (category),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### config JSON 구조 예시

```json
{
  "title": "계정 기간 연장 신청",
  "description": "계정 사용 기간을 연장합니다",
  "api": "http://localhost:3001/api/selectServer",
  "content": [
    {
      "id": "requestTitle",
      "type": "text",
      "label": "신청 제목",
      "required": true,
      "helperText": "신청 제목을 입력하세요",
      "options": {
        "placeholder": "예: 개발 계정 연장",
        "maxLength": 100
      }
    },
    {
      "id": "accountId",
      "type": "apiselect",
      "label": "계정 선택",
      "required": true,
      "options": {
        "apiUrl": "http://localhost:3001/api/accounts/list",
        "apiLabelKey": "accountName",
        "apiValueKey": "accountId",
        "placeholder": "계정을 선택하세요"
      }
    }
  ]
}
```

### 2. 폼 제출 데이터 테이블 (form_submissions)

사용자가 제출한 폼 데이터를 저장

```sql
CREATE TABLE form_submissions (
  -- 기본 정보
  id VARCHAR(50) PRIMARY KEY,
  form_schema_id VARCHAR(50) NOT NULL COMMENT '폼 스키마 ID',

  -- 제출 데이터 (JSON)
  data JSON NOT NULL COMMENT '사용자가 입력한 폼 데이터',

  -- 제출자 정보
  submitted_by VARCHAR(100) COMMENT '제출자 ID',
  submitted_by_name VARCHAR(255) COMMENT '제출자 이름',
  submitted_by_email VARCHAR(255) COMMENT '제출자 이메일',

  -- 상태 관리
  status ENUM('pending', 'approved', 'rejected', 'processing', 'completed') DEFAULT 'pending',
  status_message TEXT COMMENT '상태 메시지',

  -- API 응답 저장
  api_responses JSON COMMENT 'API 호출 결과 저장',

  -- IP 및 추적 정보
  ip_address VARCHAR(45) COMMENT '제출자 IP 주소',
  user_agent TEXT COMMENT '사용자 브라우저 정보',

  -- 시간 정보
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL COMMENT '처리 완료 시간',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 외래키
  FOREIGN KEY (form_schema_id) REFERENCES form_schemas(id) ON DELETE RESTRICT,

  -- 인덱스
  INDEX idx_form_schema_id (form_schema_id),
  INDEX idx_submitted_by (submitted_by),
  INDEX idx_status (status),
  INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### data JSON 구조 예시

```json
{
  "requestTitle": "개발 서버 계정 연장",
  "accountId": "ACC001",
  "env": "production",
  "usagePeriod": {
    "startDate": "2024-01-01",
    "endDate": "2024-06-30"
  },
  "reason": "프로젝트 지속으로 인한 연장 필요"
}
```

#### 특수 필드 타입별 데이터 구조

**DateRange 필드 (daterange)**
```json
{
  "usagePeriod": {
    "startDate": "2024-01-01",
    "endDate": "2024-06-30"
  }
}
```

**서버 그룹 변경 필드 (servergroupchange)**
```json
{
  "serverGroupChanges": {
    "changes": [
      {
        "userId": "USER001",
        "userName": "홍길동",
        "userEmail": "hong@company.com",
        "currentGroups": ["web-dev", "database-read"],
        "targetGroups": ["web-prod", "database-write", "monitoring"]
      },
      {
        "userId": "USER002",
        "userName": "김철수",
        "userEmail": "kim@company.com",
        "currentGroups": ["web-dev"],
        "targetGroups": ["web-prod", "database-read"]
      }
    ]
  }
}
```

**Checkbox 필드**
```json
{
  "updateFields": ["email", "department", "phone"]
}
```

**API Select 필드**
```json
{
  "accountId": "ACC001",
  "serverId": "SERVER-12345"
}
```

### 3. 폼 필드 정의 테이블 (form_field_definitions) - 선택사항

재사용 가능한 필드 정의를 저장 (옵션)

```sql
CREATE TABLE form_field_definitions (
  id VARCHAR(50) PRIMARY KEY,
  field_code VARCHAR(100) UNIQUE COMMENT '필드 코드 (예: account_select)',
  field_name VARCHAR(255) COMMENT '필드 이름',
  field_config JSON NOT NULL COMMENT 'FormField 구조',
  category VARCHAR(100) COMMENT '필드 카테고리',
  is_reusable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_field_code (field_code),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. 폼 승인 플로우 테이블 (form_approval_flows)

폼 제출 시 지정된 승인 플로우 저장

```sql
CREATE TABLE form_approval_flows (
  id VARCHAR(50) PRIMARY KEY,
  submission_id VARCHAR(50) NOT NULL,

  -- 승인 플로우 설정
  require_all BOOLEAN DEFAULT TRUE COMMENT '모든 승인자의 승인 필요 여부',
  allow_parallel BOOLEAN DEFAULT FALSE COMMENT '병렬 승인 허용 여부',

  -- 현재 승인 단계
  current_step INT DEFAULT 1 COMMENT '현재 승인 단계 (순차 승인인 경우)',
  total_steps INT COMMENT '전체 승인 단계 수',

  -- 상태
  status ENUM('pending', 'in_progress', 'approved', 'rejected') DEFAULT 'pending',
  completed_at TIMESTAMP NULL,

  -- 시간 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 외래키
  FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,

  -- 인덱스
  INDEX idx_submission_id (submission_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5. 승인자 테이블 (form_approvers)

각 승인 플로우의 승인자 정보 저장

```sql
CREATE TABLE form_approvers (
  id VARCHAR(50) PRIMARY KEY,
  flow_id VARCHAR(50) NOT NULL COMMENT '승인 플로우 ID',

  -- 승인자 정보
  employee_id VARCHAR(50) NOT NULL COMMENT '직원 ID',
  employee_name VARCHAR(255) NOT NULL,
  employee_email VARCHAR(255) NOT NULL,
  employee_department VARCHAR(100),
  employee_position VARCHAR(100),

  -- 승인 순서 및 설정
  approval_order INT NOT NULL COMMENT '승인 순서 (1부터 시작)',
  is_mandatory BOOLEAN DEFAULT TRUE COMMENT '필수 승인 여부',

  -- 승인 상태
  status ENUM('pending', 'approved', 'rejected', 'skipped') DEFAULT 'pending',
  action_comment TEXT COMMENT '승인/거절 코멘트',
  action_at TIMESTAMP NULL COMMENT '승인/거절 시간',

  -- 시간 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 외래키
  FOREIGN KEY (flow_id) REFERENCES form_approval_flows(id) ON DELETE CASCADE,

  -- 인덱스
  INDEX idx_flow_id (flow_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_approval_order (approval_order),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6. 폼 승인 이력 테이블 (form_approval_history)

폼 승인/거절 이력 관리 (감사 로그용)

```sql
CREATE TABLE form_approval_history (
  id VARCHAR(50) PRIMARY KEY,
  submission_id VARCHAR(50) NOT NULL,
  approver_id VARCHAR(50) COMMENT 'form_approvers 테이블의 ID',

  -- 승인자 정보
  employee_id VARCHAR(100) NOT NULL,
  employee_name VARCHAR(255),

  -- 승인/거절 정보
  action ENUM('approved', 'rejected', 'requested_changes') NOT NULL,
  comment TEXT COMMENT '승인/거절 사유',

  -- 시간 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 외래키
  FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES form_approvers(id) ON DELETE SET NULL,

  -- 인덱스
  INDEX idx_submission_id (submission_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 7. 직원 테이블 (employees)

시스템 직원 정보 관리

```sql
CREATE TABLE employees (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100),
  position VARCHAR(100),
  avatar VARCHAR(500) COMMENT '프로필 사진 URL',

  -- 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 시간 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_email (email),
  INDEX idx_department (department),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8. 서버 그룹 테이블 (server_groups)

서버 그룹 정보 관리 (서버 접근 권한 그룹)

```sql
CREATE TABLE server_groups (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- 그룹 설정
  is_active BOOLEAN DEFAULT TRUE,

  -- 시간 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. 사용자 테이블 (users)

시스템 사용자 정보 및 서버 그룹 관계

```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  department VARCHAR(100),

  -- 상태
  is_active BOOLEAN DEFAULT TRUE,

  -- 시간 정보
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 인덱스
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 10. 사용자-서버 그룹 관계 테이블 (user_server_groups)

사용자와 서버 그룹 간의 다대다(N:M) 관계 관리

```sql
CREATE TABLE user_server_groups (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  server_group_id VARCHAR(50) NOT NULL,

  -- 할당 정보
  assigned_by VARCHAR(100) COMMENT '할당한 관리자 ID',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL COMMENT '만료 일시 (NULL이면 무제한)',

  -- 외래키
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (server_group_id) REFERENCES server_groups(id) ON DELETE CASCADE,

  -- 중복 방지
  UNIQUE KEY unique_user_group (user_id, server_group_id),

  -- 인덱스
  INDEX idx_user_id (user_id),
  INDEX idx_server_group_id (server_group_id),
  INDEX idx_assigned_at (assigned_at),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 11. 첨부파일 테이블 (form_attachments) - 선택사항

폼에 첨부된 파일 관리

```sql
CREATE TABLE form_attachments (
  id VARCHAR(50) PRIMARY KEY,
  submission_id VARCHAR(50) NOT NULL,

  -- 파일 정보
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT COMMENT '파일 크기 (bytes)',
  file_type VARCHAR(100) COMMENT 'MIME 타입',

  -- 메타데이터
  uploaded_by VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 외래키
  FOREIGN KEY (submission_id) REFERENCES form_submissions(id) ON DELETE CASCADE,

  -- 인덱스
  INDEX idx_submission_id (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## API 엔드포인트 설계

### 1. 폼 스키마 관리 API

#### 1.1 폼 스키마 생성

```http
POST /api/forms/schemas
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "계정 기간 연장 신청",
  "code": "account-extension",
  "description": "계정 사용 기간을 연장합니다",
  "category": "account",
  "config": {
    "title": "계정 기간 연장 신청",
    "description": "계정 사용 기간을 연장합니다",
    "api": "http://localhost:3001/api/selectServer",
    "content": [...]
  },
  "allowedRoles": ["admin", "user"]
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "form_schema_12345",
    "name": "계정 기간 연장 신청",
    "code": "account-extension",
    "version": 1,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 1.2 폼 스키마 목록 조회

```http
GET /api/forms/schemas?category=account&isActive=true&page=1&limit=20
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "form_schema_12345",
      "name": "계정 기간 연장 신청",
      "code": "account-extension",
      "category": "account",
      "version": 1,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 1.3 특정 폼 스키마 조회

```http
GET /api/forms/schemas/:id
GET /api/forms/schemas/by-code/:code
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "form_schema_12345",
    "name": "계정 기간 연장 신청",
    "code": "account-extension",
    "config": {
      "title": "계정 기간 연장 신청",
      "content": [...]
    },
    "version": 1,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 1.4 폼 스키마 수정

```http
PUT /api/forms/schemas/:id
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "계정 기간 연장 신청 v2",
  "config": {...},
  "version": 2
}
```

#### 1.5 폼 스키마 삭제 (소프트 삭제)

```http
DELETE /api/forms/schemas/:id
Authorization: Bearer {token}
```

### 2. 폼 제출 데이터 관리 API

#### 2.1 폼 데이터 제출 (승인 플로우 포함)

```http
POST /api/forms/submissions
Content-Type: application/json
Authorization: Bearer {token}

{
  "formSchemaId": "form_schema_12345",
  "data": {
    "requestTitle": "개발 서버 계정 연장",
    "accountId": "ACC001",
    "env": "production",
    "usagePeriod": {
      "startDate": "2024-01-01",
      "endDate": "2024-06-30"
    }
  },
  "approvalFlow": {
    "requireAll": true,
    "allowParallel": false,
    "approvers": [
      {
        "employee": {
          "id": "EMP001",
          "name": "김철수",
          "email": "kim@company.com",
          "department": "IT",
          "position": "팀장"
        },
        "order": 1,
        "isMandatory": true
      },
      {
        "employee": {
          "id": "EMP007",
          "name": "윤서준",
          "email": "yoon@company.com",
          "department": "Management",
          "position": "이사"
        },
        "order": 2,
        "isMandatory": true
      }
    ]
  }
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "submission_67890",
    "formSchemaId": "form_schema_12345",
    "status": "pending",
    "submittedAt": "2024-01-15T11:00:00Z",
    "approvalFlow": {
      "id": "flow_11111",
      "status": "pending",
      "currentStep": 1,
      "totalSteps": 2,
      "approvers": [
        {
          "id": "approver_22222",
          "employeeName": "김철수",
          "order": 1,
          "status": "pending"
        },
        {
          "id": "approver_33333",
          "employeeName": "윤서준",
          "order": 2,
          "status": "pending"
        }
      ]
    },
    "apiResponses": {
      "http://localhost:3001/api/selectServer": {
        "success": true,
        "serverId": "SERVER-1234567890"
      }
    }
  },
  "message": "폼이 성공적으로 제출되었습니다"
}
```

#### 2.2 제출 데이터 목록 조회

```http
GET /api/forms/submissions?formSchemaId=form_schema_12345&status=pending&page=1&limit=20
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "submission_67890",
      "formSchemaId": "form_schema_12345",
      "formSchemaName": "계정 기간 연장 신청",
      "status": "pending",
      "submittedBy": "user123",
      "submittedByName": "홍길동",
      "submittedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### 2.3 특정 제출 데이터 조회

```http
GET /api/forms/submissions/:id
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "submission_67890",
    "formSchemaId": "form_schema_12345",
    "formSchemaName": "계정 기간 연장 신청",
    "data": {
      "requestTitle": "개발 서버 계정 연장",
      "accountId": "ACC001",
      "env": "production"
    },
    "status": "approved",
    "submittedBy": "user123",
    "submittedByName": "홍길동",
    "submittedAt": "2024-01-15T11:00:00Z",
    "processedAt": "2024-01-15T14:30:00Z",
    "apiResponses": {...},
    "approvalHistory": [
      {
        "approverName": "관리자",
        "action": "approved",
        "comment": "승인합니다",
        "createdAt": "2024-01-15T14:30:00Z"
      }
    ]
  }
}
```

#### 2.4 제출 데이터 상태 변경

```http
PATCH /api/forms/submissions/:id/status
Content-Type: application/json
Authorization: Bearer {token}

{
  "status": "approved",
  "statusMessage": "승인 완료",
  "comment": "검토 완료하였습니다"
}
```

### 3. 직원 목록 조회 API

#### 3.1 직원 목록 조회

```http
GET /api/employees/list
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "EMP001",
      "name": "김철수",
      "email": "kim@company.com",
      "department": "IT",
      "position": "팀장",
      "avatar": null
    },
    {
      "id": "EMP002",
      "name": "이영희",
      "email": "lee@company.com",
      "department": "HR",
      "position": "부장",
      "avatar": null
    }
  ],
  "count": 10
}
```

### 3A. 서버 그룹 및 사용자 관리 API

#### 3A.1 서버 그룹 목록 조회

```http
GET /api/server-groups/list
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "SG001",
      "name": "web-dev",
      "description": "웹 개발 서버 그룹"
    },
    {
      "id": "SG002",
      "name": "web-prod",
      "description": "웹 운영 서버 그룹"
    },
    {
      "id": "SG003",
      "name": "database-read",
      "description": "데이터베이스 읽기 권한 그룹"
    },
    {
      "id": "SG004",
      "name": "database-write",
      "description": "데이터베이스 쓰기 권한 그룹"
    }
  ],
  "count": 4
}
```

#### 3A.2 사용자 목록 조회 (서버 그룹 포함)

```http
GET /api/users/list
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "USER001",
      "username": "hong.gildong",
      "email": "hong@company.com",
      "fullName": "홍길동",
      "department": "Development",
      "serverGroups": ["web-dev", "database-read"]
    },
    {
      "id": "USER002",
      "username": "kim.chulsoo",
      "email": "kim@company.com",
      "fullName": "김철수",
      "department": "Operations",
      "serverGroups": ["web-prod", "database-write", "monitoring"]
    }
  ],
  "count": 2
}
```

#### 3A.3 특정 사용자의 서버 그룹 조회

```http
GET /api/users/:userId/server-groups
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "userId": "USER001",
    "userName": "홍길동",
    "userEmail": "hong@company.com",
    "serverGroups": [
      {
        "id": "SG001",
        "name": "web-dev",
        "description": "웹 개발 서버 그룹",
        "assignedAt": "2024-01-01T00:00:00Z",
        "expiresAt": null
      },
      {
        "id": "SG003",
        "name": "database-read",
        "description": "데이터베이스 읽기 권한 그룹",
        "assignedAt": "2024-01-15T00:00:00Z",
        "expiresAt": "2024-12-31T23:59:59Z"
      }
    ]
  }
}
```

#### 3A.4 사용자 서버 그룹 변경 (servergroupchange 필드 제출 시)

서버 그룹 변경 요청은 form_submissions의 data 필드에 저장되며, 별도의 처리 로직이 필요합니다.

**처리 예시 (제출 후 승인 완료 시)**
```javascript
// 승인 완료 후 실제 서버 그룹 변경 처리
async function processServerGroupChanges(submissionId) {
  const submission = await getSubmission(submissionId);
  const changes = submission.data.serverGroupChanges?.changes || [];

  for (const change of changes) {
    // 기존 그룹 제거
    await removeUserFromGroups(change.userId, change.currentGroups);

    // 새 그룹 할당
    await addUserToGroups(change.userId, change.targetGroups);
  }
}
```

### 4. 폼 승인/거절 API (메모리 저장소 구현 포함)

> **참고**: 이 섹션은 현재 구현된 메모리 저장소 버전 API를 포함합니다. 데이터베이스 버전 구현 시 구조 참고용으로 활용하세요.

#### 4.1 승인자별 승인 처리

**현재 구현 (메모리 저장소 버전)**

```http
POST /api/approvals/:approverId/approve
Content-Type: application/json
Authorization: Bearer {token}

{
  "employeeId": "EMP001",
  "comment": "승인합니다"
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "approverId": "SUB-123-EMP001-1",
    "status": "approved",
    "actionAt": "2024-01-15T14:30:00Z",
    "flowStatus": "in_progress",
    "submissionStatus": "pending"
  },
  "message": "승인이 완료되었습니다"
}
```

**참고**:
- `approverId` 형식: `{submissionId}-{employeeId}-{order}`
- `employeeId`는 요청 본문에 포함 필수
- `comment`는 선택사항
- 순차 승인 시 현재 차례가 아니면 400 에러 반환
- 모든 승인 완료 시 `flowStatus`와 `submissionStatus`가 `"approved"`로 변경

#### 4.2 승인자별 거절 처리

**현재 구현 (메모리 저장소 버전)**

```http
POST /api/approvals/:approverId/reject
Content-Type: application/json
Authorization: Bearer {token}

{
  "employeeId": "EMP001",
  "comment": "추가 정보가 필요합니다"
}
```

**응답**
```json
{
  "success": true,
  "data": {
    "approverId": "SUB-123-EMP001-1",
    "status": "rejected",
    "actionAt": "2024-01-15T14:30:00Z",
    "flowStatus": "rejected",
    "submissionStatus": "rejected"
  },
  "message": "거부가 완료되었습니다"
}
```

**참고**:
- `employeeId`는 요청 본문에 포함 필수
- `comment`는 **필수** (거부 사유)
- 거부 시 즉시 전체 승인 플로우가 `"rejected"` 상태로 변경
- `submissionStatus`도 `"rejected"`로 변경되어 더 이상 승인 불가

#### 4.3 내 승인 목록 조회 (대기중 + 완료)

**현재 구현 (메모리 저장소 버전)**

```http
GET /api/approvals/my-approvals?employeeId={employeeId}
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": [
    {
      "id": "SUB-123-EMP001-1",
      "submissionId": "SUB-123",
      "formName": "계정 기간 연장 신청",
      "submittedByName": "홍길동",
      "submittedAt": "2024-01-15T11:00:00Z",
      "order": 1,
      "isMandatory": true,
      "status": "pending",
      "actionAt": null,
      "actionComment": null,
      "flowStatus": "pending",
      "currentStep": 1,
      "totalSteps": 2,
      "isMyTurn": true
    },
    {
      "id": "SUB-124-EMP001-2",
      "submissionId": "SUB-124",
      "formName": "서버 신청",
      "submittedByName": "김철수",
      "submittedAt": "2024-01-14T10:00:00Z",
      "order": 2,
      "isMandatory": true,
      "status": "approved",
      "actionAt": "2024-01-14T15:30:00Z",
      "actionComment": "승인합니다",
      "flowStatus": "approved",
      "currentStep": 2,
      "totalSteps": 2,
      "isMyTurn": false
    }
  ],
  "count": 2
}
```

**참고**:
- 대기중(`status: "pending"`)과 완료(`status: "approved"` 또는 `"rejected"`) 모두 포함
- 프론트엔드에서 탭으로 구분하여 표시
- `isMyTurn`: 순차 승인에서 현재 승인 차례인지 여부

#### 4.4 승인 플로우 상태 조회

```http
GET /api/forms/submissions/:id/approval-flow
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "id": "flow_11111",
    "submissionId": "submission_67890",
    "status": "in_progress",
    "requireAll": true,
    "allowParallel": false,
    "currentStep": 2,
    "totalSteps": 2,
    "approvers": [
      {
        "id": "approver_22222",
        "employeeName": "김철수",
        "employeeEmail": "kim@company.com",
        "order": 1,
        "isMandatory": true,
        "status": "approved",
        "actionComment": "승인합니다",
        "actionAt": "2024-01-15T14:30:00Z"
      },
      {
        "id": "approver_33333",
        "employeeName": "윤서준",
        "employeeEmail": "yoon@company.com",
        "order": 2,
        "isMandatory": true,
        "status": "pending",
        "actionComment": null,
        "actionAt": null
      }
    ],
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

### 5. 통계 및 분석 API

#### 4.1 폼 제출 통계

```http
GET /api/forms/statistics?formSchemaId=form_schema_12345&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer {token}
```

**응답**
```json
{
  "success": true,
  "data": {
    "totalSubmissions": 150,
    "statusBreakdown": {
      "pending": 30,
      "approved": 100,
      "rejected": 15,
      "processing": 5
    },
    "submissionsByDate": [
      {
        "date": "2024-01-15",
        "count": 12
      }
    ]
  }
}
```

---

## 데이터 흐름

### 1. 폼 스키마 생성 및 관리 흐름

```
관리자 → [POST /api/forms/schemas] → DB (form_schemas 테이블)
                ↓
           폼 스키마 저장
                ↓
           응답: 폼 스키마 ID
```

### 2. 사용자 폼 제출 흐름 (승인 플로우 포함)

```
1. 사용자가 폼 코드로 폼 스키마 조회
   GET /api/forms/schemas/by-code/account-extension

2. 프론트엔드에서 폼 렌더링 (DynamicForm 컴포넌트)

3. (선택사항) 사용자가 승인 플로우 설정
   - ApprovalFlowModal 컴포넌트 열기
   - GET /api/employees/list로 직원 목록 조회
   - 승인자 선택 및 순서 지정
   - 승인 옵션 설정 (모든 승인 필요, 병렬 승인 등)

4. 사용자가 데이터 입력 및 제출
   POST /api/forms/submissions
   (approvalFlow 정보 포함)

5. 백엔드에서 처리:
   a. 폼 데이터 검증
   b. form_submissions 테이블에 저장
   c. 승인 플로우가 있는 경우:
      - form_approval_flows 테이블에 플로우 생성
      - form_approvers 테이블에 각 승인자 정보 저장
      - 첫 번째 승인자에게 알림 발송
   d. 설정된 API 호출 (config.api 또는 config.apis)
   e. API 응답을 api_responses에 저장
   f. 상태를 'pending'으로 설정

6. 응답 반환 (승인 플로우 정보 포함)
```

### 3. 승인 처리 흐름

```
1. 승인자가 자신의 승인 대기 목록 조회
   GET /api/forms/approvals/my-pending

2. 특정 제출 상세 조회 (승인 플로우 포함)
   GET /api/forms/submissions/:id
   GET /api/forms/submissions/:id/approval-flow

3. 승인 또는 거절
   POST /api/forms/approvals/:approverId/approve
   또는
   POST /api/forms/approvals/:approverId/reject

4. 백엔드에서 처리:
   a. form_approvers 테이블의 해당 승인자 상태 업데이트
   b. form_approval_history에 이력 기록
   c. 순차 승인인 경우:
      - 현재 순서의 승인자가 승인하면 다음 승인자에게 알림
      - 모든 승인이 완료되면 form_approval_flows.status = 'approved'
      - form_submissions.status = 'approved' 업데이트
   d. 병렬 승인인 경우:
      - 모든 필수 승인자가 승인하면 완료 처리
   e. 거절인 경우:
      - form_approval_flows.status = 'rejected'
      - form_submissions.status = 'rejected'
      - 제출자에게 알림 발송
   f. 다음 단계 승인자 또는 제출자에게 알림 발송

5. 상태 업데이트 완료 및 응답 반환
```

### 4. 제출 데이터 조회 및 읽기 전용 폼 렌더링

```
1. 사용자가 제출 목록 조회
   GET /api/forms/submissions

2. 특정 제출 상세 조회
   GET /api/forms/submissions/:id

3. 프론트엔드에서 제출 데이터를 폼 형태로 렌더링:
   a. submission.data에서 필드 자동 타입 추론:
      - Array → checkbox 필드
      - {startDate, endDate} 객체 → daterange 필드
      - {changes: [...]} 객체 → servergroupchange 필드
      - boolean → checkbox 필드
      - number → number 필드
      - 기타 → text 필드

   b. FormConfig 재구성:
      - 각 필드에 대해 id, type, label, value, options 생성
      - readOnly 모드로 DynamicForm 컴포넌트에 전달

   c. DynamicForm이 읽기 전용 모드로 렌더링:
      - 모든 입력 필드 비활성화
      - 제출 버튼 숨김
      - 승인 플로우 설정 버튼 숨김

4. 폼 보기 / 데이터 보기 토글:
   - "폼 보기": DynamicForm 컴포넌트로 원본 폼 형태 표시
   - "데이터 보기": 테이블 형태로 필드 ID와 값 표시
```

---

## 표준 필드 정의 (Standard Fields)

시스템에서는 일관성 있는 필드 ID 사용을 위해 표준 필드를 사전 정의합니다. 이를 통해 동일한 목적의 필드가 폼마다 다른 ID로 저장되는 것을 방지합니다.

### 표준 필드 구조

```typescript
interface StandardField {
  id: string;                  // 필드 ID (DB 저장 시 사용)
  label: string;               // 필드 레이블
  description: string;         // 필드 설명
  suggestedTypes: FieldType[]; // 권장 필드 타입
  category: string;            // 카테고리 (account, server, resource, common)
}
```

### 주요 표준 필드 예시

**계정 관련 필드 (account)**
- `accountSelect`: 계정 선택
- `accountId`: 계정 ID
- `accountName`: 계정 이름
- `extensionPeriod`: 연장 기간
- `extensionReason`: 연장 사유
- `updateFields`: 수정할 항목
- `updateReason`: 수정 사유

**서버 관련 필드 (server)**
- `serverType`: 서버 유형
- `serverEnvironment`: 서버 환경
- `serverSpecs`: 서버 사양
- `serverPurpose`: 서버 사용 목적
- `serverName`: 서버 이름
- `serverGroupChanges`: 서버 그룹 변경 (servergroupchange 타입)
- `changeReason`: 변경 사유

**공통 필드 (common)**
- `requestTitle`: 신청 제목
- `requestDescription`: 신청 내용
- `requestReason`: 신청 사유
- `requestDate`: 신청 일자
- `usagePeriod`: 사용 기간
- `priority`: 우선순위
- `department`: 부서
- `requesterName`: 신청자 이름
- `requesterEmail`: 신청자 이메일
- `requesterPhone`: 신청자 연락처
- `notes`: 비고
- `urgency`: 긴급도
- `environment`: 환경
- `status`: 상태

### 폼 코드별 사용 가능한 필드

각 폼 코드(Form Code)는 필수 필드와 선택 가능한 옵션 필드를 정의합니다.

```typescript
interface FormCode {
  code: string;                  // 폼 코드 (예: account-extension)
  name: string;                  // 폼 이름
  description?: string;          // 폼 설명
  requiredFields: FormField[];   // 필수 필드 목록
  optionalFieldIds?: string[];   // 추가 가능한 표준 필드 ID 목록
}
```

**예시: 계정 기간 연장 신청**
```typescript
{
  code: "account-extension",
  name: "계정 기간 연장 신청",
  requiredFields: [
    { id: "accountSelect", type: "apiselect", ... },
    { id: "extensionPeriod", type: "daterange", ... },
    { id: "extensionReason", type: "textarea", ... }
  ],
  optionalFieldIds: [
    "accountId", "accountName", "requestTitle", "priority",
    "department", "requesterName", "requesterEmail", "notes"
  ]
}
```

이렇게 하면 폼 빌더에서 필드를 추가할 때 해당 폼 코드에서 허용된 표준 필드만 선택할 수 있습니다.

---

## 구현 예시

### 1. Node.js + Express + MySQL 백엔드 예시

#### 폼 스키마 생성 API

```javascript
// controllers/formSchemaController.js
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

exports.createFormSchema = async (req, res) => {
  try {
    const { name, code, description, category, config, allowedRoles } = req.body;
    const userId = req.user.id; // 인증 미들웨어에서 추출

    // 유효성 검증
    if (!name || !config) {
      return res.status(400).json({
        success: false,
        message: 'name과 config는 필수입니다'
      });
    }

    // 폼 스키마 ID 생성
    const formSchemaId = `form_${uuidv4()}`;

    // DB에 저장
    const query = `
      INSERT INTO form_schemas
      (id, name, code, description, category, config, allowed_roles, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [
      formSchemaId,
      name,
      code,
      description,
      category,
      JSON.stringify(config),
      JSON.stringify(allowedRoles),
      userId
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: formSchemaId,
        name,
        code,
        version: 1,
        createdAt: new Date().toISOString()
      },
      message: '폼 스키마가 생성되었습니다'
    });

  } catch (error) {
    console.error('Form schema creation error:', error);
    res.status(500).json({
      success: false,
      message: '폼 스키마 생성 중 오류가 발생했습니다'
    });
  }
};

exports.getFormSchemaByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const query = `
      SELECT * FROM form_schemas
      WHERE code = ? AND is_active = TRUE AND deleted_at IS NULL
    `;

    const [rows] = await db.execute(query, [code]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '폼 스키마를 찾을 수 없습니다'
      });
    }

    const formSchema = rows[0];

    res.json({
      success: true,
      data: {
        id: formSchema.id,
        name: formSchema.name,
        code: formSchema.code,
        description: formSchema.description,
        config: JSON.parse(formSchema.config),
        version: formSchema.version,
        isActive: formSchema.is_active,
        createdAt: formSchema.created_at
      }
    });

  } catch (error) {
    console.error('Form schema retrieval error:', error);
    res.status(500).json({
      success: false,
      message: '폼 스키마 조회 중 오류가 발생했습니다'
    });
  }
};
```

#### 폼 데이터 제출 API

```javascript
// controllers/formSubmissionController.js
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const db = require('../config/database');

exports.submitForm = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { formSchemaId, data, approvalFlow } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    // 폼 스키마 조회
    const [schemaRows] = await connection.execute(
      'SELECT * FROM form_schemas WHERE id = ? AND is_active = TRUE',
      [formSchemaId]
    );

    if (schemaRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '폼 스키마를 찾을 수 없습니다'
      });
    }

    const formSchema = schemaRows[0];
    const config = JSON.parse(formSchema.config);

    // 제출 ID 생성
    const submissionId = `sub_${uuidv4()}`;

    // API 호출 (config에 정의된 API들)
    let apiResponses = {};

    try {
      if (config.api) {
        // 단일 API 호출
        const response = await axios.post(config.api, data);
        apiResponses[config.api] = response.data;
      } else if (config.apis && Array.isArray(config.apis)) {
        // 다중 API 호출
        for (const apiConfig of config.apis) {
          const apiData = {};

          // 해당 API에 필요한 필드만 추출
          apiConfig.fields.forEach(fieldId => {
            if (fieldId in data) {
              const apiKey = apiConfig.fieldMapping?.[fieldId] || fieldId;
              apiData[apiKey] = data[fieldId];
            }
          });

          const method = (apiConfig.method || 'POST').toLowerCase();
          const response = await axios[method](apiConfig.url, apiData);
          apiResponses[apiConfig.url] = response.data;
        }
      }
    } catch (apiError) {
      console.error('API call error:', apiError);
      // API 호출 실패해도 제출은 저장하되, 상태를 failed로 설정
      apiResponses.error = {
        message: apiError.message,
        response: apiError.response?.data
      };
    }

    // DB에 제출 데이터 저장
    const insertQuery = `
      INSERT INTO form_submissions
      (id, form_schema_id, data, submitted_by, submitted_by_name,
       submitted_by_email, status, api_responses, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      submissionId,
      formSchemaId,
      JSON.stringify(data),
      userId,
      userName,
      userEmail,
      apiResponses.error ? 'failed' : 'pending',
      JSON.stringify(apiResponses),
      ipAddress,
      userAgent
    ]);

    // 승인 플로우 저장 (있는 경우)
    let approvalFlowData = null;
    if (approvalFlow && approvalFlow.approvers && approvalFlow.approvers.length > 0) {
      const flowId = `flow_${uuidv4()}`;

      // 승인 플로우 생성
      await connection.execute(
        `INSERT INTO form_approval_flows
         (id, submission_id, require_all, allow_parallel, total_steps, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          flowId,
          submissionId,
          approvalFlow.requireAll,
          approvalFlow.allowParallel,
          approvalFlow.approvers.length,
          'pending'
        ]
      );

      // 각 승인자 정보 저장
      const approverIds = [];
      for (const approver of approvalFlow.approvers) {
        const approverId = `approver_${uuidv4()}`;
        approverIds.push(approverId);

        await connection.execute(
          `INSERT INTO form_approvers
           (id, flow_id, employee_id, employee_name, employee_email,
            employee_department, employee_position, approval_order, is_mandatory, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            approverId,
            flowId,
            approver.employee.id,
            approver.employee.name,
            approver.employee.email,
            approver.employee.department || null,
            approver.employee.position || null,
            approver.order,
            approver.isMandatory,
            'pending'
          ]
        );
      }

      approvalFlowData = {
        id: flowId,
        status: 'pending',
        currentStep: 1,
        totalSteps: approvalFlow.approvers.length,
        approvers: approvalFlow.approvers.map((a, idx) => ({
          id: approverIds[idx],
          employeeName: a.employee.name,
          order: a.order,
          status: 'pending'
        }))
      };

      // 첫 번째 승인자에게 알림 발송 (TODO: 실제 알림 서비스 구현)
      // await sendApprovalNotification(approvalFlow.approvers[0].employee.email, submissionId);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        id: submissionId,
        formSchemaId,
        status: apiResponses.error ? 'failed' : 'pending',
        submittedAt: new Date().toISOString(),
        approvalFlow: approvalFlowData,
        apiResponses
      },
      message: '폼이 성공적으로 제출되었습니다'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      message: '폼 제출 중 오류가 발생했습니다'
    });
  } finally {
    connection.release();
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = `
      SELECT
        s.*,
        fs.name as form_schema_name,
        fs.code as form_schema_code
      FROM form_submissions s
      JOIN form_schemas fs ON s.form_schema_id = fs.id
      WHERE s.id = ?
    `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '제출 데이터를 찾을 수 없습니다'
      });
    }

    const submission = rows[0];

    // 권한 확인 (본인 또는 관리자만 조회 가능)
    if (submission.submitted_by !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다'
      });
    }

    // 승인 이력 조회
    const [historyRows] = await db.execute(
      'SELECT * FROM form_approval_history WHERE submission_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        id: submission.id,
        formSchemaId: submission.form_schema_id,
        formSchemaName: submission.form_schema_name,
        formSchemaCode: submission.form_schema_code,
        data: JSON.parse(submission.data),
        status: submission.status,
        statusMessage: submission.status_message,
        submittedBy: submission.submitted_by,
        submittedByName: submission.submitted_by_name,
        submittedByEmail: submission.submitted_by_email,
        submittedAt: submission.submitted_at,
        processedAt: submission.processed_at,
        apiResponses: JSON.parse(submission.api_responses || '{}'),
        approvalHistory: historyRows.map(h => ({
          approverName: h.approver_name,
          action: h.action,
          comment: h.comment,
          createdAt: h.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Submission retrieval error:', error);
    res.status(500).json({
      success: false,
      message: '제출 데이터 조회 중 오류가 발생했습니다'
    });
  }
};
```

#### 승인 처리 API

```javascript
// controllers/approvalController.js
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

exports.approveForm = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { approverId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    // 승인자 정보 조회
    const [approverRows] = await connection.execute(
      `SELECT a.*, f.submission_id, f.require_all, f.allow_parallel, f.current_step, f.total_steps
       FROM form_approvers a
       JOIN form_approval_flows f ON a.flow_id = f.id
       WHERE a.id = ? AND a.employee_id = ?`,
      [approverId, userId]
    );

    if (approverRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '승인 권한이 없습니다'
      });
    }

    const approver = approverRows[0];

    // 이미 처리된 승인인지 확인
    if (approver.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '이미 처리된 승인입니다'
      });
    }

    // 순차 승인인 경우, 현재 순서인지 확인
    if (!approver.allow_parallel && approver.approval_order !== approver.current_step) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: '현재 승인 순서가 아닙니다'
      });
    }

    // 승인자 상태 업데이트
    await connection.execute(
      `UPDATE form_approvers
       SET status = 'approved', action_comment = ?, action_at = NOW()
       WHERE id = ?`,
      [comment, approverId]
    );

    // 승인 이력 저장
    const historyId = `hist_${uuidv4()}`;
    await connection.execute(
      `INSERT INTO form_approval_history
       (id, submission_id, approver_id, employee_id, employee_name, action, comment)
       VALUES (?, ?, ?, ?, ?, 'approved', ?)`,
      [historyId, approver.submission_id, approverId, userId, userName, comment]
    );

    // 다음 단계 확인
    let flowStatus = 'in_progress';
    let nextApprover = null;

    if (approver.allow_parallel) {
      // 병렬 승인: 모든 필수 승인자가 승인했는지 확인
      const [pendingRows] = await connection.execute(
        `SELECT COUNT(*) as count FROM form_approvers
         WHERE flow_id = ? AND is_mandatory = TRUE AND status = 'pending'`,
        [approver.flow_id]
      );

      if (pendingRows[0].count === 0) {
        flowStatus = 'approved';
      }
    } else {
      // 순차 승인: 다음 승인자로 이동
      const nextStep = approver.current_step + 1;

      if (nextStep <= approver.total_steps) {
        // 다음 승인자 조회
        const [nextRows] = await connection.execute(
          `SELECT * FROM form_approvers
           WHERE flow_id = ? AND approval_order = ?`,
          [approver.flow_id, nextStep]
        );

        if (nextRows.length > 0) {
          nextApprover = {
            id: nextRows[0].id,
            employeeName: nextRows[0].employee_name,
            order: nextRows[0].approval_order
          };

          // 현재 단계 업데이트
          await connection.execute(
            `UPDATE form_approval_flows SET current_step = ? WHERE id = ?`,
            [nextStep, approver.flow_id]
          );

          // 다음 승인자에게 알림 발송
          // await sendApprovalNotification(nextRows[0].employee_email, approver.submission_id);
        }
      } else {
        // 모든 승인 완료
        flowStatus = 'approved';
      }
    }

    // 플로우 상태 업데이트
    if (flowStatus === 'approved') {
      await connection.execute(
        `UPDATE form_approval_flows
         SET status = 'approved', completed_at = NOW()
         WHERE id = ?`,
        [approver.flow_id]
      );

      // 제출 상태 업데이트
      await connection.execute(
        `UPDATE form_submissions
         SET status = 'approved', processed_at = NOW()
         WHERE id = ?`,
        [approver.submission_id]
      );

      // 제출자에게 최종 승인 알림 발송
      // await sendCompletionNotification(approver.submission_id);
    }

    await connection.commit();

    res.json({
      success: true,
      data: {
        approverId,
        status: 'approved',
        actionAt: new Date().toISOString(),
        flowStatus,
        nextApprover
      },
      message: '승인이 완료되었습니다'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Approval error:', error);
    res.status(500).json({
      success: false,
      message: '승인 처리 중 오류가 발생했습니다'
    });
  } finally {
    connection.release();
  }
};

exports.rejectForm = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { approverId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    // 승인자 정보 조회
    const [approverRows] = await connection.execute(
      `SELECT a.*, f.submission_id FROM form_approvers a
       JOIN form_approval_flows f ON a.flow_id = f.id
       WHERE a.id = ? AND a.employee_id = ?`,
      [approverId, userId]
    );

    if (approverRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: '승인 권한이 없습니다'
      });
    }

    const approver = approverRows[0];

    // 승인자 상태 업데이트
    await connection.execute(
      `UPDATE form_approvers
       SET status = 'rejected', action_comment = ?, action_at = NOW()
       WHERE id = ?`,
      [comment, approverId]
    );

    // 승인 이력 저장
    const historyId = `hist_${uuidv4()}`;
    await connection.execute(
      `INSERT INTO form_approval_history
       (id, submission_id, approver_id, employee_id, employee_name, action, comment)
       VALUES (?, ?, ?, ?, ?, 'rejected', ?)`,
      [historyId, approver.submission_id, approverId, userId, userName, comment]
    );

    // 플로우 및 제출 상태 업데이트 (거절)
    await connection.execute(
      `UPDATE form_approval_flows
       SET status = 'rejected', completed_at = NOW()
       WHERE id = ?`,
      [approver.flow_id]
    );

    await connection.execute(
      `UPDATE form_submissions
       SET status = 'rejected', status_message = ?, processed_at = NOW()
       WHERE id = ?`,
      [comment, approver.submission_id]
    );

    // 제출자에게 거절 알림 발송
    // await sendRejectionNotification(approver.submission_id, comment);

    await connection.commit();

    res.json({
      success: true,
      data: {
        approverId,
        status: 'rejected',
        actionAt: new Date().toISOString(),
        flowStatus: 'rejected',
        submissionStatus: 'rejected'
      },
      message: '거절이 완료되었습니다'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Rejection error:', error);
    res.status(500).json({
      success: false,
      message: '거절 처리 중 오류가 발생했습니다'
    });
  } finally {
    connection.release();
  }
};

exports.getMyPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT
        a.id as approver_id,
        a.flow_id,
        s.id as submission_id,
        fs.name as form_schema_name,
        s.submitted_by_name,
        s.submitted_at,
        a.approval_order,
        a.is_mandatory,
        f.current_step,
        f.total_steps,
        f.allow_parallel
      FROM form_approvers a
      JOIN form_approval_flows f ON a.flow_id = f.id
      JOIN form_submissions s ON f.submission_id = s.id
      JOIN form_schemas fs ON s.form_schema_id = fs.id
      WHERE a.employee_id = ?
        AND a.status = 'pending'
        AND (f.allow_parallel = TRUE OR a.approval_order = f.current_step)
      ORDER BY s.submitted_at DESC
    `;

    const [rows] = await db.execute(query, [userId]);

    res.json({
      success: true,
      data: rows.map(row => ({
        approverId: row.approver_id,
        submissionId: row.submission_id,
        formSchemaName: row.form_schema_name,
        submittedBy: row.submitted_by_name,
        submittedAt: row.submitted_at,
        order: row.approval_order,
        isMandatory: row.is_mandatory,
        currentStep: row.current_step,
        totalSteps: row.total_steps
      })),
      count: rows.length
    });

  } catch (error) {
    console.error('Pending approvals retrieval error:', error);
    res.status(500).json({
      success: false,
      message: '승인 대기 목록 조회 중 오류가 발생했습니다'
    });
  }
};
```

### 2. 프론트엔드 연동 예시

#### 폼 스키마 로드 및 렌더링

```typescript
// pages/DynamicFormPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { DynamicForm } from '../component/DynamicForm';
import { FormConfig } from '../types/type';

export const DynamicFormPage: React.FC = () => {
  const { formCode } = useParams<{ formCode: string }>();
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadFormSchema = async () => {
      try {
        setLoading(true);

        // 백엔드에서 폼 스키마 조회
        const response = await axios.get(
          `http://localhost:3001/api/forms/schemas/by-code/${formCode}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data.success) {
          setFormConfig(response.data.data.config);
        } else {
          setError('폼을 불러올 수 없습니다');
        }
      } catch (err) {
        console.error('Form schema load error:', err);
        setError('폼을 불러오는 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    if (formCode) {
      loadFormSchema();
    }
  }, [formCode]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!formConfig) {
    return <div>폼 설정을 찾을 수 없습니다</div>;
  }

  return (
    <div className="container mt-4">
      <DynamicForm
        config={formConfig}
        enableApprovalFlow={true}
        employeeApiUrl="http://localhost:3001/api/employees/list"
      />
    </div>
  );
};
```

#### 폼 데이터 제출 처리 수정

```typescript
// component/DynamicForm.tsx의 handleSubmit 수정
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const errors = validateForm(formData, config.content);
  setValidationErrors(errors);

  if (Object.keys(errors).length > 0) {
    setSubmitStatus("error");
    setSubmitMessage("입력 항목을 확인해주세요.");
    return;
  }

  setIsSubmitting(true);
  setSubmitStatus("submitting");

  try {
    // 백엔드의 제출 API 호출
    const response = await axios.post(
      'http://localhost:3001/api/forms/submissions',
      {
        formSchemaId: config.schemaId, // 폼 스키마 ID 필요
        data: formData
      },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      setSubmitStatus("success");
      setSubmitMessage("폼이 성공적으로 제출되었습니다!");

      // 제출 ID 저장 (나중에 조회용)
      const submissionId = response.data.data.id;
      console.log('Submission ID:', submissionId);

      // 폼 초기화
      setTimeout(() => {
        setFormData({});
        setSubmitStatus("idle");
      }, 2000);
    } else {
      throw new Error(response.data.message || '제출 실패');
    }
  } catch (error: any) {
    console.error("Form submission error:", error);
    setSubmitStatus("error");
    setSubmitMessage(
      error.response?.data?.message ||
      error.message ||
      "폼 제출 중 오류가 발생했습니다"
    );
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 보안 고려사항

### 1. 인증 및 권한

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다'
    });
  }
};

exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다'
      });
    }
    next();
  };
};
```

### 2. 입력 검증

```javascript
// middleware/validation.js
const { body, validationResult } = require('express-validator');

exports.validateFormSchema = [
  body('name').notEmpty().withMessage('폼 이름은 필수입니다'),
  body('code').notEmpty().withMessage('폼 코드는 필수입니다')
    .matches(/^[a-z0-9-]+$/).withMessage('폼 코드는 소문자, 숫자, 하이픈만 가능합니다'),
  body('config').isObject().withMessage('config는 객체여야 합니다'),
  body('config.title').notEmpty().withMessage('폼 제목은 필수입니다'),
  body('config.content').isArray().withMessage('content는 배열이어야 합니다'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
```

### 3. SQL Injection 방지

- **준비된 구문(Prepared Statements)** 사용
- ORM 사용 권장 (Sequelize, TypeORM 등)

### 4. XSS 방지

```javascript
// 사용자 입력 데이터 sanitize
const sanitizeHtml = require('sanitize-html');

exports.sanitizeFormData = (data) => {
  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {}
      });
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
```

### 5. Rate Limiting

```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

exports.formSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // 최대 10개 요청
  message: {
    success: false,
    message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'
  }
});
```

### 6. CORS 설정

```javascript
// config/cors.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
```

---

## 추가 고려사항

### 1. 폼 버전 관리

폼 스키마가 변경될 때마다 새로운 버전을 생성하여 이전 제출 데이터와의 호환성 유지

```sql
-- 폼 스키마 버전 테이블
CREATE TABLE form_schema_versions (
  id VARCHAR(50) PRIMARY KEY,
  form_schema_id VARCHAR(50) NOT NULL,
  version INT NOT NULL,
  config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),

  FOREIGN KEY (form_schema_id) REFERENCES form_schemas(id),
  UNIQUE KEY unique_schema_version (form_schema_id, version)
);
```

### 2. 감사 로그(Audit Log)

모든 중요한 작업을 기록

```sql
CREATE TABLE audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  entity_type VARCHAR(100) COMMENT 'form_schema, form_submission',
  entity_id VARCHAR(50),
  action VARCHAR(50) COMMENT 'create, update, delete, approve, reject',
  user_id VARCHAR(100),
  changes JSON COMMENT '변경 내용',
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

### 3. 알림 시스템

폼 제출, 승인, 거절 시 알림 발송

```javascript
// services/notificationService.js
const nodemailer = require('nodemailer');

exports.sendSubmissionNotification = async (submission) => {
  // 이메일 발송
  const transporter = nodemailer.createTransport({...});

  await transporter.sendMail({
    from: 'noreply@company.com',
    to: submission.submittedByEmail,
    subject: '폼 제출 완료',
    html: `
      <h2>폼이 성공적으로 제출되었습니다</h2>
      <p>제출 ID: ${submission.id}</p>
      <p>상태: ${submission.status}</p>
    `
  });
};
```

### 4. 백업 및 복구

정기적인 데이터베이스 백업 및 복구 전략 수립

```bash
# MySQL 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mysql"
DB_NAME="dynamic_form_db"

mysqldump -u root -p$DB_PASSWORD $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# 7일 이상 된 백업 파일 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

---

## 요약

### 핵심 테이블

1. **form_schemas**: 폼 구조 정의 저장 (FormConfig JSON 포함)
2. **form_submissions**: 사용자 제출 데이터 저장 (data JSON, approvalFlow 포함)
3. **form_approval_flows**: 승인 플로우 정보 저장
4. **form_approvers**: 각 승인자 정보 및 상태 저장
5. **form_approval_history**: 승인/거절 이력 관리 (감사 로그)
6. **employees**: 직원 정보 (승인자 마스터)
7. **server_groups**: 서버 그룹 정보
8. **users**: 사용자 정보
9. **user_server_groups**: 사용자-서버 그룹 다대다 관계

### 주요 기능

1. **14가지 필드 타입 지원**: text, email, password, number, textarea, select, radio, checkbox, date, daterange, apiselect, modalselect, file, servergroupchange
2. **표준 필드 시스템**: 일관성 있는 필드 ID 사용 (standardFields.ts)
3. **폼 코드 시스템**: 재사용 가능한 폼 템플릿 (필수 필드 + 옵션 필드)
4. **승인 플로우**: 순차/병렬 승인, 필수/선택 승인자 지정, 폼 빌더 통합
5. **승인 관리**: 승인자 전용 페이지, 대기중/완료 탭, 승인/거부 처리, 권한 검증
6. **서버 그룹 변경 요청**: 다중 사용자의 다중 그룹 할당 관리
7. **제출 데이터 관리**: 목록 조회, 상세 조회, 상태 변경, 승인 진행 표시
8. **읽기 전용 폼 렌더링**: 제출 데이터를 폼 형태로 표시
9. **자동 타입 추론**: 제출 데이터로부터 필드 타입 자동 감지 및 폼 재구성

### API 엔드포인트

**폼 스키마 관리**
- POST /api/forms/schemas
- GET /api/forms/schemas
- GET /api/forms/schemas/:id
- GET /api/forms/schemas/by-code/:code
- PUT /api/forms/schemas/:id
- DELETE /api/forms/schemas/:id

**폼 제출 관리**
- POST /api/forms/submissions
- GET /api/forms/submissions
- GET /api/forms/submissions/:id
- PATCH /api/forms/submissions/:id/status
- DELETE /api/forms/submissions/:id

**승인 관리 (현재 구현)**
- GET /api/approvals/my-approvals?employeeId={id} - 내 승인 목록 (대기중 + 완료)
- POST /api/approvals/:approverId/approve - 승인 처리
- POST /api/approvals/:approverId/reject - 거부 처리

**승인 관리 (DB 버전 - 이론적 설계)**
- GET /api/forms/approvals/my-pending - 대기중인 승인 목록
- GET /api/forms/submissions/:id/approval-flow - 승인 플로우 상태 조회

**직원 및 서버 그룹**
- GET /api/employees/list
- GET /api/server-groups/list
- GET /api/users/list
- GET /api/users/:userId/server-groups

### 보안 고려사항

1. **인증 및 권한**: JWT 기반 인증, 역할 기반 접근 제어
2. **입력 검증**: express-validator를 통한 요청 검증
3. **SQL Injection 방지**: Prepared Statements 사용
4. **XSS 방지**: sanitize-html을 통한 입력 데이터 정제
5. **Rate Limiting**: 폼 제출 횟수 제한
6. **CORS 설정**: 허용된 도메인만 접근 가능

### 확장성 고려사항

1. **폼 버전 관리**: form_schema_versions 테이블로 이전 버전 유지
2. **감사 로그**: audit_logs 테이블로 모든 중요 작업 기록
3. **알림 시스템**: 제출, 승인, 거절 시 이메일/슬랙 알림
4. **백업 및 복구**: 정기 백업 스크립트 실행
5. **파일 첨부**: form_attachments 테이블로 파일 관리

이 가이드를 참고하여 실제 프로덕션 환경에서 Dynamic Form 시스템을 구축할 수 있습니다.
