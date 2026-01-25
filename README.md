# Dynamic Form

React + TypeScript + Bootstrap 기반의 동적 폼 애플리케이션과 Node.js API 서버

드래그 앤 드롭으로 커스텀 폼을 만들고, 서버에 저장하여 실제로 사용할 수 있는 폼 빌더 시스템입니다.

## 주요 기능

### 1. DynamicForm 컴포넌트
- **14가지 필드 타입 지원**
  - 기본: text, textarea, email, number, password, date
  - 선택: select, dropdown, radio, checkbox
  - 고급: daterange, modalselect, apiselect, servergroupchange
- **단일/다중 API 전송**
- **실시간 유효성 검증**
- **읽기 전용 모드**: 제출된 데이터를 폼 형태로 표시

### 2. 폼 빌더
- **드래그 앤 드롭**: 필드 순서 조정
- **필드 관리**: 추가/수정/삭제
- **폼 코드 시스템**: 템플릿 기반 필수/선택적 필드 관리
- **승인 플로우 설정**: 폼별 승인자 지정
- **서버 저장**: JSON 형태로 저장

### 3. 폼 제출 관리
- **제출 목록**: 페이지네이션, 필터링 지원
- **제출 상세**:
  - 폼 보기 모드: DynamicForm으로 데이터 렌더링
  - 데이터 보기 모드: 테이블 형태로 원시 데이터 표시
- **상태 관리**: pending, processing, approved, rejected, completed
- **승인 진행 표시**: 승인자별 처리 상태 및 진행도 표시
- **승인 플로우 상세**: 승인자 목록, 상태, 처리 일시, 코멘트 확인

### 4. 승인 플로우 (Approval Flow)
- **승인자 지정**: 직원 검색 및 선택
- **순서 설정**: 드래그 앤 드롭으로 승인 순서 조정
- **승인 방식**: 순차 승인 / 병렬 승인
- **필수/선택**: 각 승인자별 필수 여부 설정
- **폼 빌더 통합**: 폼 생성 시 승인 플로우 미리 설정

### 5. 승인 관리 (My Approvals)
- **내 승인 목록**: 대기중 / 처리완료 탭으로 구분
- **승인/거부 처리**:
  - 승인: 코멘트 선택사항
  - 거부: 사유 필수 입력
- **실시간 진행 상태**: 순차/병렬 승인 진행 상황 확인
- **제출 상세 연동**: 승인 항목에서 바로 제출 상세로 이동
- **권한 검증**: 본인 차례에만 승인/거부 가능 (순차 승인 시)

### 6. 서버 그룹 변경 요청
- **다대다 매핑**: 여러 사용자를 각기 다른 서버 그룹에 배정
- **현재 그룹 표시**: 사용자 선택 시 현재 서버 그룹 자동 표시
- **다중 선택**: 한 사용자를 여러 서버 그룹에 배정 가능
- **시각적 관리**: 테이블 형태로 변경 요청 관리

## 기술 스택

### 프론트엔드
- **React** 18.2
- **TypeScript** 5.3
- **Vite** (빌드 도구)
- **Bootstrap** 5.3 (UI 프레임워크)
- **React Router** (라우팅)
- **axios** (HTTP 클라이언트)
- **date-fns** (날짜 처리)

### 백엔드 (API)
- **Node.js**
- **Express** 4.18
- **CORS** (Cross-Origin Resource Sharing)
- **메모리 저장소** (Map 객체 - 개발용)

## 시작하기

### 1. 의존성 설치

```bash
# 프론트엔드 패키지 설치
cd front
npm install

# API 서버 패키지 설치
cd ../api
npm install
```

### 2. 개발 서버 실행

#### 프론트엔드와 API 서버를 각각 실행

터미널 1 - API 서버:
```bash
cd api
npm run dev
# 실행: http://localhost:3001
```

터미널 2 - 프론트엔드:
```bash
cd front
npm run dev
# 실행: http://localhost:5173
```

### 3. 브라우저 접속

프론트엔드: http://localhost:5173

주요 페이지:
- 예제: http://localhost:5173/
- 폼 코드 예제: http://localhost:5173/form-codes
- 폼 빌더: http://localhost:5173/form-builder
- 폼 테스트: http://localhost:5173/form-test
- **제출 현황: http://localhost:5173/submissions**
- **내 승인: http://localhost:5173/my-approvals**

API 서버: http://localhost:3001/health

## 프로젝트 구조

```
dynamicform/
├── front/                     # 프론트엔드
│   ├── src/
│   │   ├── component/         # 컴포넌트
│   │   │   ├── DynamicForm.tsx
│   │   │   ├── FormFieldComponent.tsx
│   │   │   ├── DateRangeField.tsx
│   │   │   ├── ServerGroupChangeField.tsx  # NEW
│   │   │   └── ApprovalFlowModal.tsx
│   │   ├── pages/             # 페이지
│   │   │   ├── FormBuilder.tsx
│   │   │   ├── FormTest.tsx
│   │   │   ├── SubmissionList.tsx          # 제출 목록
│   │   │   ├── SubmissionDetail.tsx        # 제출 상세
│   │   │   └── MyApprovals.tsx             # 내 승인 관리
│   │   ├── config/            # 설정
│   │   │   ├── formCodes.ts
│   │   │   └── standardFields.ts
│   │   ├── types/             # 타입 정의
│   │   │   └── type.ts
│   │   └── hook/              # 커스텀 훅
│   │       ├── useApiSubmit.ts
│   │       └── useFormValidation.ts
│   └── package.json
├── api/                       # 백엔드
│   ├── server.js
│   └── package.json
├── DATABASE_API_GUIDE.md      # DB/API 가이드
└── README.md
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

## 필드 타입

### 기본 입력 필드
- **text**: 텍스트 입력
- **textarea**: 여러 줄 텍스트
- **email**: 이메일 입력
- **number**: 숫자 입력
- **password**: 비밀번호 입력
- **date**: 날짜 선택

### 선택 필드
- **select**: 드롭다운 선택
- **dropdown**: 드롭다운 버튼
- **radio**: 라디오 버튼 (단일 선택)
- **checkbox**: 체크박스 (다중 선택)

### 고급 필드
- **daterange**: 날짜 범위 선택
  - 빠른 선택 버튼 (3/6/12개월)
  - 직접 입력 옵션
  - 전체 체크박스 옵션
- **modalselect**: 모달을 통한 다중 선택
- **apiselect**: API에서 옵션을 동적으로 가져오는 선택 필드
- **servergroupchange**: 서버 그룹 변경 요청 (복합 필드)

## 폼 코드 (Form Code) 시스템

### 사용 가능한 폼 코드

1. **account-extension**: 계정 기간 연장 신청
   - 필수: 계정 선택, 연장 기간, 연장 사유
   - 선택: 제목, 우선순위, 부서, 신청자 정보

2. **account-update**: 계정 정보 수정 신청
   - 필수: 계정 선택, 수정 항목, 수정 사유
   - 선택: 제목, 우선순위, 부서, 신청자 정보

3. **server-request**: 서버 신청
   - 필수: 서버 유형, 환경, 사양, 사용 목적
   - 선택: 서버 이름, 사용 기간, 우선순위

4. **resource-allocation**: 리소스 할당 신청
   - 필수: 리소스 유형, 할당 기간
   - 선택: 리소스 양, 신청 사유, 우선순위

5. **server-group-change**: 서버 그룹 변경 요청
   - 필수: 서버 그룹 변경 요청, 변경 사유
   - 선택: 제목, 우선순위, 부서, 신청자 정보

### 폼 빌더 사용법

1. **폼 기본 정보 입력**
   - 폼 제목, 설명, API 엔드포인트

2. **승인 플로우 설정** (선택)
   - "승인자 설정" 버튼 클릭
   - 승인자 추가 및 순서 조정
   - 승인 옵션 설정

3. **폼 코드 선택**
   - 필요한 폼 코드 체크
   - 필수 필드 자동 추가

4. **선택적 필드 추가**
   - "필드 추가" 버튼 클릭
   - 허용된 필드 중 선택

5. **필드 순서 조정**
   - 드래그 앤 드롭으로 순서 변경

6. **폼 저장**
   - "폼 저장" 버튼 클릭
   - 서버에 JSON 형태로 저장

## 폼 제출 관리

### 제출 목록 페이지

**URL**: http://localhost:5173/submissions

**기능**:
- 제출된 모든 폼 조회
- 상태별 필터링 (전체, 대기중, 승인됨, 거부됨, 처리중, 완료)
- 페이지네이션 (20개씩)
- 제출 ID, 폼 이름, 상태, 제출자, 제출 일시 표시
- 행 클릭으로 상세 페이지 이동

### 제출 상세 페이지

**URL**: http://localhost:5173/submissions/:id

**기능**:
- **보기 모드 전환**
  - 폼 보기: DynamicForm으로 데이터 렌더링 (읽기 전용)
  - 데이터 보기: 테이블 형태로 원시 데이터 표시
- **제출 정보**
  - 제출 ID, 폼 이름, 상태
  - 제출자, 제출 일시, 처리 일시
- **승인 플로우 정보**
  - 승인자 목록 (순서, 이름, 이메일, 부서, 직급, 필수 여부)
  - 승인 옵션 (모든 승인 필요, 병렬 승인)
- **상태 변경**
  - 상태 업데이트 모달
  - 상태 메시지 입력
- **JSON 원본 보기**
  - details 태그로 접기/펴기

## 서버 그룹 변경 요청

### 개념

사용자는 여러 서버 그룹에 속할 수 있으며, 각 서버 그룹은 특정 서버에 대한 접근 권한을 부여합니다.

### 데이터 구조

**서버 그룹**:
```json
{
  "id": "SG001",
  "name": "Web Servers",
  "description": "웹 서버 그룹",
  "servers": ["web-01", "web-02", "web-03"]
}
```

**사용자**:
```json
{
  "id": "USR001",
  "name": "김철수",
  "email": "kim@company.com",
  "serverGroups": ["SG001", "SG003", "SG007"]
}
```

### 사용 방법

1. **폼 코드 예제 페이지**에서 "서버 그룹 변경" 선택
2. **사용자 추가** 버튼 클릭
3. **사용자 선택** (드롭다운)
4. **현재 서버 그룹** 자동 표시
5. **목표 서버 그룹** 선택 (다중 선택 가능)
6. **추가** 버튼으로 변경 요청 추가
7. 필요하면 **여러 사용자 추가** 가능
8. **변경 사유** 입력
9. **제출**

### 지원 시나리오

- ✅ 여러 사용자를 각기 다른 서버 그룹에 배정
- ✅ 한 사용자를 여러 서버 그룹에 배정
- ✅ 현재 그룹과 목표 그룹 비교 표시
- ✅ 테이블 형태로 모든 변경 요청 관리

## 승인 플로우

### 폼 빌더에서 설정

1. **승인 플로우 설정 섹션**
2. **"승인자 설정" 버튼** 클릭
3. **직원 검색 및 선택**
4. **승인 순서 조정** (화살표 버튼)
5. **옵션 설정**
   - 모든 승인자의 승인 필요
   - 병렬 승인 허용
   - 각 승인자별 필수 여부
6. **저장**
7. **폼 저장** 시 승인 플로우 포함

### DynamicForm에서 설정

```tsx
<DynamicForm
  config={formConfig}
  enableApprovalFlow={true}
  employeeApiUrl="/api/employees/list"
  onSuccess={(data, response) => {
    console.log("폼 제출 성공:", response);
  }}
/>
```

### 제출 데이터 구조

```json
{
  "formName": "계정 기간 연장 신청",
  "data": {
    "accountSelect": "ACC001",
    "extensionPeriod": {
      "startDate": "2026-01-25",
      "endDate": "2026-07-25"
    },
    "extensionReason": "프로젝트 연장"
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
      }
    ]
  }
}
```

## 승인 관리 (My Approvals)

### 승인자 페이지

1. **"내 승인" 메뉴** 클릭 (`/my-approvals`)
2. **탭 선택**:
   - **대기중**: 처리해야 할 승인 건 목록
   - **처리완료**: 이미 승인/거부한 건 목록
3. **승인 건 정보 확인**:
   - 폼 이름, 제출자, 제출 일시
   - 승인 순서 (예: 1/3)
   - 필수/선택 여부
   - 승인 상태, 전체 진행 상태
4. **승인/거부 처리**:
   - **승인 버튼**: 코멘트 입력 (선택사항) → 승인
   - **거부 버튼**: 거부 사유 입력 (필수) → 거부
   - **상세 버튼**: 제출 상세 페이지로 이동

### 승인 규칙

- **순차 승인**: 현재 차례인 승인자만 처리 가능
- **병렬 승인**: 모든 승인자가 동시에 처리 가능
- **필수 승인**: 반드시 승인해야 다음 단계 진행
- **선택 승인**: 건너뛸 수 있음 (requireAll=false인 경우)

### 승인 진행 추적

**제출 목록 페이지**:
- "승인 진행" 컬럼에서 전체 진행 상황 확인
- 예: "진행중 (1/3)" = 3명 중 1명 승인 완료

**제출 상세 페이지**:
- 승인 플로우 섹션에서 각 승인자별 상태 확인:
  - 대기/승인/거부 상태 배지
  - 처리 일시
  - 승인/거부 코멘트

## API 엔드포인트

### 폼 관리
- `POST /api/forms/save` - 폼 저장
- `GET /api/forms/list` - 폼 목록
- `GET /api/forms/:formId` - 특정 폼 조회
- `DELETE /api/forms/:formId` - 폼 삭제

### 폼 제출 관리
- `POST /api/forms/submissions` - 폼 제출 (승인 플로우 포함)
- `GET /api/forms/submissions` - 제출 목록 (필터링, 페이지네이션)
- `GET /api/forms/submissions/:id` - 제출 상세
- `PATCH /api/forms/submissions/:id/status` - 상태 변경
- `DELETE /api/forms/submissions/:id` - 제출 삭제

### 승인 관리
- `GET /api/approvals/my-approvals?employeeId={id}` - 내 승인 목록 (대기중 + 완료)
- `POST /api/approvals/:approverId/approve` - 승인 처리
  - Body: `{ employeeId, comment? }`
- `POST /api/approvals/:approverId/reject` - 거부 처리
  - Body: `{ employeeId, comment }` (comment 필수)

### 데이터 조회
- `GET /api/employees/list` - 직원 목록
- `GET /api/accounts/list` - 계정 목록
- `GET /api/servers/types` - 서버 타입 목록
- `GET /api/resources/types` - 리소스 타입 목록
- `GET /api/server-groups/list` - 서버 그룹 목록
- `GET /api/users/list` - 사용자 목록 (서버 그룹 포함)
- `GET /api/users/:userId/server-groups` - 사용자 서버 그룹 조회

### 유틸리티
- `GET /health` - 헬스 체크

## 빌드

```bash
cd front
npm run build
```

빌드된 파일은 `front/dist/` 디렉토리에 생성됩니다.

## 개발 팁

1. **Hot Module Replacement (HMR)**: Vite는 파일 변경 시 자동으로 브라우저를 새로고침합니다.
2. **API 서버 자동 재시작**: `node --watch` 플래그로 API 서버 파일 변경 시 자동 재시작됩니다.
3. **TypeScript 타입 체크**: VSCode에서 자동으로 타입 체크가 수행됩니다.
4. **Bootstrap 컴포넌트**: [Bootstrap 공식 문서](https://getbootstrap.com/docs/5.3/components/)를 참고하세요.

### 승인 관리 테스트

1. **승인자 설정**: 폼 빌더에서 승인 플로우 설정
2. **폼 제출**: enableApprovalFlow=true로 폼 제출
3. **승인 확인**: 제출 현황에서 승인 진행 상태 확인
4. **승인 처리**: 내 승인 페이지 (`/my-approvals`)에서 승인/거부
   - 현재 구현은 employeeId를 하드코딩 (`EMP001`)
   - 실제 환경에서는 인증 토큰에서 사용자 ID 추출 필요
5. **결과 확인**: 제출 상세 페이지에서 승인 결과 및 코멘트 확인

## 데이터 저장

**현재 구현**: 메모리 저장소 (Map 객체)
- 폼 설정: `savedForms` Map
- 제출 데이터: `formSubmissions` Map (승인 플로우 포함)
- 서버 재시작 시 **모든 데이터 초기화**
- 개발 및 테스트 전용

**저장되는 데이터**:
- 폼 스키마 (FormConfig)
- 폼 제출 데이터
- 승인 플로우 설정
- 승인자 정보 및 승인/거부 상태
- 승인 코멘트 및 처리 일시

**운영 환경**: 데이터베이스 연동 필요
- MongoDB, PostgreSQL, MySQL 등
- 자세한 내용은 [DATABASE_API_GUIDE.md](./DATABASE_API_GUIDE.md) 참조

## 문제 해결

### 포트가 이미 사용 중인 경우

프론트엔드 (5173 포트):
```bash
lsof -ti:5173 | xargs kill -9
```

API 서버 (3001 포트):
```bash
lsof -ti:3001 | xargs kill -9
```

### API 요청이 실패하는 경우

1. API 서버 상태 확인: http://localhost:3001/health
2. 브라우저 콘솔에서 네트워크 탭 확인
3. API 서버 콘솔에서 요청 로그 확인
4. 프록시 설정 확인 (vite.config.ts)

### CORS 오류

API 서버에서 CORS가 활성화되어 있는지 확인:
```javascript
// server.js
app.use(cors());
```

## 참고 문서

- **데이터베이스 스키마 및 API 가이드**: [DATABASE_API_GUIDE.md](./DATABASE_API_GUIDE.md)
- **API 서버 README**: [api/README.md](./api/README.md)

## 라이선스

이 프로젝트는 학습 및 개발 목적으로 만들어졌습니다.
