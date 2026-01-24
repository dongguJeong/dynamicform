# Dynamic Form - 프론트엔드

React + TypeScript + Bootstrap 기반의 동적 폼 애플리케이션

## 주요 기능

### 1. DynamicForm 컴포넌트
- 다양한 필드 타입 지원
  - 기본: text, textarea, email, number, password, date
  - 선택: select, dropdown, radio, checkbox
  - 고급: daterange, modalselect, **apiselect (NEW)**
- API 전송 지원 (단일/다중 API)
- 유효성 검증

### 1-1. API Select (apiselect)
API에서 동적으로 옵션을 가져오는 select 필드
- API URL 지정
- 응답 데이터의 label/value 키 커스터마이징
- 로딩 상태 표시
- 예: 계정 목록, 서버 타입 목록 등

### 2. 폼 코드 시스템 (NEW)
특정 업무 유형에 필요한 필수 필드를 자동으로 추가하는 시스템

**주요 기능:**
- 폼 코드 선택 시 필수 필드 자동 추가
- 여러 폼 코드 조합 가능
- 중복 필드 자동 제거
- 커스텀 필드 추가 가능

**사전 정의된 폼 코드:**
- `account-extension`: 계정 기간 연장 신청
- `account-update`: 계정 정보 수정 신청
- `server-request`: 서버 신청
- `resource-allocation`: 리소스 할당 신청

**예시:**
"계정 기간 연장"과 "계정 정보 수정" 폼 코드를 동시 선택하면:
- 계정 선택 필드 (중복 제거되어 1개만 표시)
- 연장 기간 필드
- 연장 사유 필드
- 수정할 항목 필드
- 수정 사유 필드
→ 총 5개 필드가 자동 생성됨

### 3. 폼 빌더 (Form Builder)
- **폼 코드 선택** (NEW)
- 드래그 앤 드롭으로 필드 순서 조정
- 필드 추가/수정/삭제
- 실시간 폼 구성
- 서버에 JSON 형태로 저장

### 4. 폼 테스트 (Form Test)
- 저장된 폼 목록 조회
- 폼 불러오기 및 미리보기
- 실제 폼 제출 테스트
- JSON 설정 확인

## 페이지 구성

### `/` - 예제 페이지
다양한 DynamicForm 예제 확인
- 단일 API 예제
- 여러 API 예제
- Modal Select 예제

### `/form-codes` - 폼 코드 예제 (NEW)
폼 코드 시스템 데모 페이지
- 계정 기간 연장 신청
- 계정 정보 수정 신청
- 연장+수정 통합 신청 (중복 제거 예제)
- 서버 신청
- 리소스 할당 신청

### `/form-builder` - 폼 빌더
커스텀 폼 생성 페이지
1. 폼 기본 정보 입력 (제목, 설명, API)
2. 필드 추가 버튼 클릭
3. 필드 타입 선택 및 설정
4. 드래그로 순서 조정
5. 폼 저장 버튼 클릭

### `/form-test` - 폼 테스트
저장된 폼 테스트 페이지
1. 왼쪽 목록에서 폼 선택
2. 불러오기 클릭
3. 오른쪽에 폼 렌더링
4. 실제 데이터 입력 및 제출 테스트

## 필드 타입

### 기본 입력
- `text`: 텍스트 입력
- `textarea`: 여러 줄 텍스트
- `email`: 이메일 입력
- `number`: 숫자 입력
- `password`: 비밀번호 입력
- `date`: 날짜 선택

### 선택 입력
- `select`: 드롭다운 선택
- `dropdown`: 부트스트랩 드롭다운 버튼
- `radio`: 라디오 버튼
- `checkbox`: 체크박스 (다중 선택)
- `modalselect`: 모달 팝업 선택 (다중 선택)
- `apiselect`: **API 동적 선택 (NEW)** - API에서 옵션을 가져옴

### 고급 입력
- `daterange`: 날짜 범위 선택
  - 시작일/종료일 직접 입력
  - 빠른 선택 (3/6/12개월)
  - 전체 기간 체크박스

## 폼 설정 형식 (JSON)

### 기본 폼 설정
```json
{
  "title": "폼 제목",
  "description": "폼 설명",
  "api": "/api/endpoint",
  "content": [
    {
      "id": "fieldId",
      "type": "text",
      "label": "필드 라벨",
      "required": true,
      "helperText": "도움말",
      "options": {
        "placeholder": "입력하세요"
      }
    }
  ]
}
```

### API Select 필드 예제 (NEW)
```json
{
  "id": "accountSelect",
  "type": "apiselect",
  "label": "계정 선택",
  "required": true,
  "options": {
    "placeholder": "계정을 선택하세요",
    "apiUrl": "/api/accounts/list",
    "apiLabelKey": "accountName",
    "apiValueKey": "accountId"
  }
}
```

### 폼 코드 사용 예제 (NEW)
```json
{
  "title": "계정 연장 및 수정 통합 신청",
  "api": "/api/account-combined",
  "formCodes": ["account-extension", "account-update"],
  "content": [
    // mergeRequiredFields()로 자동 생성된 필드들
    // + 추가 커스텀 필드
  ]
}
```

## 사용 라이브러리

- **React** 18.2: UI 라이브러리
- **React Router DOM** 6: 라우팅
- **Bootstrap** 5.3: UI 프레임워크
- **React Bootstrap**: Bootstrap React 컴포넌트
- **axios**: HTTP 클라이언트
- **date-fns**: 날짜 처리

## 개발 서버 실행

```bash
# 프론트엔드만
npm run dev

# 프론트엔드 + API 서버
npm run dev:all
```

## 빌드

```bash
npm run build
```

## 폼 빌더 사용 예제

1. 폼 빌더 페이지 접속
2. 폼 제목: "회원가입"
3. API: "/api/user/register"
4. "필드 추가" 클릭
5. 필드 설정:
   - ID: username
   - 타입: text
   - 라벨: 사용자명
   - 필수: 체크
6. 추가 필드 반복
7. 드래그로 순서 조정
8. "폼 저장" 클릭
9. 폼 테스트 페이지에서 확인

## API 연동

저장된 폼은 서버에 JSON 문자열로 저장되며, 불러올 때 파싱하여 DynamicForm으로 렌더링됩니다.

```typescript
// 폼 저장
POST /api/forms/save
{
  "name": "폼 이름",
  "config": "{ JSON 문자열 }"
}

// 폼 목록
GET /api/forms/list

// 특정 폼 조회
GET /api/forms/:formId

// 폼 삭제
DELETE /api/forms/:formId
```
