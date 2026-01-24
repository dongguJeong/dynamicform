import React from "react";
import useApiSubmit from "./hook/useApiSubmint";
import { FormConfig } from "./types/type";
import DynamicForm from "./component/DynamicForm";

const App: React.FC = () => {
  // ===== Axios 설정 예제 =====
  // baseURL을 설정하면 모든 API 요청이 이 URL을 기본으로 함
  const { submitForm } = useApiSubmit(
    "https://api.example.com", // baseURL
    10000,
  ); // timeout (10초)
  // ===== 예제 1: 단일 API 사용 (기존 방식) =====
  const singleApiFormConfig: FormConfig = {
    title: "서버 선택 - 단일 API",
    description: "모든 필드를 하나의 API로 전송합니다.",
    api: "/api/selectServer",
    content: [
      {
        id: "requestTitle",
        type: "text",
        label: "요청 제목",
        required: true,
        helperText: "간단한 제목을 입력하세요",
        options: {
          placeholder: "신규 배포 서버 요청",
          minLength: 3,
          maxLength: 40,
        },
      },
      {
        id: "env",
        type: "select",
        label: "환경",
        required: true,
        options: {
          placeholder: "선택",
          selectOption: [
            { label: "DEV", value: "dev" },
            { label: "STAGE", value: "stage" },
            { label: "PROD", value: "prod" },
          ],
        },
      },
    ],
  };

  // ===== 예제 2: 여러 API 사용 (새로운 방식) =====
  // 요청 정보는 /api/request로
  // 서버 설정은 /api/server로 각각 전송
  const multiApiFormConfig: FormConfig = {
    title: "배포 요청 - 여러 API",
    description: "필드 그룹별로 다른 API로 전송됩니다.",
    apis: [
      {
        url: "/api/request",
        fields: ["requestTitle", "requestEmail", "memo"],
        fieldMapping: {
          requestTitle: "title",
          requestEmail: "requester_email",
          memo: "description",
        },
        method: "POST",
      },
      {
        url: "/api/server",
        fields: ["env", "serverType"],
        fieldMapping: {
          env: "environment",
          serverType: "type",
        },
        method: "POST",
      },
      {
        url: "/api/features",
        fields: ["features"],
        fieldMapping: {
          features: "enabled_services",
        },
        method: "POST",
      },
    ],
    content: [
      // === 요청 정보 섹션 ===
      {
        id: "requestTitle",
        type: "text",
        label: "요청 제목",
        required: true,
        helperText: "간단한 제목을 입력하세요",
        options: {
          placeholder: "신규 배포 서버 요청",
          minLength: 3,
          maxLength: 40,
        },
      },
      {
        id: "requestEmail",
        type: "email",
        label: "요청자 이메일",
        required: true,
        helperText: "유효한 이메일 주소를 입력하세요",
        options: {
          placeholder: "example@domain.com",
        },
      },
      {
        id: "memo",
        type: "textarea",
        label: "상세 내용",
        required: false,
        helperText: "배포 내용이나 특별한 요청사항을 작성해주세요",
        options: {
          placeholder: "상세 내용을 적어주세요",
          rows: 4,
          maxLength: 500,
        },
      },
      // === 서버 설정 섹션 ===
      {
        id: "env",
        type: "select",
        label: "배포 환경",
        required: true,
        options: {
          placeholder: "환경을 선택하세요",
          selectOption: [
            { label: "개발 (DEV)", value: "dev" },
            { label: "스테이징 (STAGE)", value: "stage" },
            { label: "운영 (PROD)", value: "prod" },
          ],
        },
      },
      {
        id: "serverType",
        type: "radio",
        label: "서버 타입",
        required: true,
        options: {
          selectOption: [
            { label: "웹 서버", value: "web" },
            { label: "API 서버", value: "api" },
            { label: "데이터베이스", value: "db" },
          ],
        },
      },
      // === 추가 기능 섹션 ===
      {
        id: "features",
        type: "checkbox",
        label: "추가 요청사항",
        required: false,
        options: {
          selectOption: [
            { label: "SSL 인증서 설치", value: "ssl" },
            { label: "CDN 설정", value: "cdn" },
            { label: "모니터링 설정", value: "monitoring" },
          ],
        },
      },
    ],
  };

  // ===== 예제 3: API별 필드 분류 (fieldMapping 없이) =====
  // 필드명이 그대로 API body 속성이 됨
  const simpleMultiApiFormConfig: FormConfig = {
    title: "회원가입 - 여러 API",
    description: "사용자 정보와 설정을 분리하여 전송합니다.",
    apis: [
      {
        url: "/api/user/create",
        fields: ["username", "email", "password"],
      },
      {
        url: "/api/user/settings",
        fields: ["notificationEnabled", "privacyLevel"],
      },
    ],
    content: [
      {
        id: "username",
        type: "text",
        label: "사용자명",
        required: true,
        options: { minLength: 3, maxLength: 20 },
      },
      {
        id: "email",
        type: "email",
        label: "이메일",
        required: true,
      },
      {
        id: "password",
        type: "password",
        label: "비밀번호",
        required: true,
        options: { minLength: 8 },
      },
      {
        id: "notificationEnabled",
        type: "checkbox",
        label: "알림 설정",
        required: false,
        options: {
          selectOption: [{ label: "알림 받기", value: "true" }],
        },
      },
      {
        id: "privacyLevel",
        type: "select",
        label: "프라이버시 레벨",
        required: true,
        options: {
          selectOption: [
            { label: "공개", value: "public" },
            { label: "친구만", value: "friends" },
            { label: "비공개", value: "private" },
          ],
        },
      },
    ],
  };

  // ===== 예제 4: DateRange 테스트 (모든 옵션) =====
  // daterange 필드 타입 테스트
  const dateRangeTestConfig: FormConfig = {
    title: "날짜 범위 선택 테스트 - 모든 옵션",
    description: "daterange 필드의 다양한 기능을 테스트합니다.",
    api: "/api/daterange/test",
    content: [
      {
        id: "projectName",
        type: "text",
        label: "프로젝트명",
        required: true,
        helperText: "프로젝트 이름을 입력하세요",
        options: {
          placeholder: "프로젝트 이름",
        },
      },
      {
        id: "usagePeriod",
        type: "daterange",
        label: "사용 기간 (모든 옵션 표시)",
        required: true,
        helperText: "전체 체크박스와 3/6/12개월 버튼 모두 사용 가능",
        options: {
          periodOptions: ["3months", "6months", "12months"],
          showAllCheckbox: true,
        },
      },
      {
        id: "serviceType",
        type: "select",
        label: "서비스 타입",
        required: true,
        options: {
          placeholder: "선택하세요",
          selectOption: [
            { label: "웹 서비스", value: "web" },
            { label: "모바일 앱", value: "mobile" },
            { label: "API 서비스", value: "api" },
          ],
        },
      },
      {
        id: "description",
        type: "textarea",
        label: "상세 설명",
        required: false,
        helperText: "추가 정보를 입력하세요",
        options: {
          placeholder: "상세 설명을 입력하세요",
          rows: 3,
        },
      },
    ],
  };

  // ===== 예제 5: DateRange (기본 - 옵션 없음) =====
  // 기본 daterange - 전체 체크박스와 빠른 선택 버튼 없음
  const simpleDateRangeConfig: FormConfig = {
    title: "간단한 날짜 범위 선택",
    description: "기본 daterange 필드 (빠른 선택 옵션 없음)",
    api: "/api/daterange/simple",
    content: [
      {
        id: "eventName",
        type: "text",
        label: "이벤트명",
        required: true,
      },
      {
        id: "eventPeriod",
        type: "daterange",
        label: "이벤트 기간 (옵션 없음)",
        required: true,
        helperText: "시작일과 종료일을 직접 입력하세요",
        options: {
          // 아무 옵션도 설정하지 않으면 기본 daterange만 표시
        },
      },
      {
        id: "targetAudience",
        type: "checkbox",
        label: "대상 고객",
        required: false,
        options: {
          selectOption: [
            { label: "신규 고객", value: "new" },
            { label: "기존 고객", value: "existing" },
            { label: "VIP 고객", value: "vip" },
          ],
        },
      },
    ],
  };

  // ===== 예제 6: DateRange (3개월 버튼만) =====
  const dateRange3MonthsOnlyConfig: FormConfig = {
    title: "날짜 범위 - 3개월 버튼만",
    description: "3개월 빠른 선택 버튼만 표시",
    api: "/api/daterange/simple",
    content: [
      {
        id: "contractPeriod",
        type: "daterange",
        label: "계약 기간 (3개월 옵션만)",
        required: true,
        helperText: "3개월 버튼을 클릭하거나 직접 입력하세요",
        options: {
          periodOptions: ["3months"],
          showAllCheckbox: false,
        },
      },
    ],
  };

  // ===== 예제 7: DateRange (전체 체크박스만) =====
  const dateRangeAllCheckboxOnlyConfig: FormConfig = {
    title: "날짜 범위 - 전체 체크박스만",
    description: "전체 체크박스만 표시 (토글 가능)",
    api: "/api/daterange/simple",
    content: [
      {
        id: "reportPeriod",
        type: "daterange",
        label: "보고서 기간 (전체 선택 가능)",
        required: true,
        helperText: "전체를 선택하거나 특정 기간을 입력하세요",
        options: {
          periodOptions: [], // 기간 버튼 없음
          showAllCheckbox: true, // 전체 체크박스만
        },
      },
    ],
  };

  // ===== 예제 8: DateRange (6/12개월만) =====
  const dateRange6And12MonthsConfig: FormConfig = {
    title: "날짜 범위 - 6/12개월 옵션",
    description: "6개월과 12개월 버튼만 표시",
    api: "/api/daterange/simple",
    content: [
      {
        id: "subscriptionPeriod",
        type: "daterange",
        label: "구독 기간 (6/12개월)",
        required: true,
        helperText: "6개월 또는 12개월 중 선택하세요",
        options: {
          periodOptions: ["6months", "12months"],
          showAllCheckbox: true,
        },
      },
    ],
  };

  // ===== 예제 9: Modal Select 테스트 =====
  const modalSelectTestConfig: FormConfig = {
    title: "모달 선택 테스트",
    description: "모달을 통해 여러 항목을 선택할 수 있습니다.",
    api: "/api/modalselect/test",
    content: [
      {
        id: "projectName",
        type: "text",
        label: "프로젝트명",
        required: true,
        options: {
          placeholder: "프로젝트 이름",
        },
      },
      {
        id: "technologies",
        type: "modalselect",
        label: "사용 기술",
        required: true,
        helperText: "모달 버튼을 클릭하여 기술 스택을 선택하세요",
        options: {
          placeholder: "기술 선택",
          selectOption: [
            { label: "React", value: "react" },
            { label: "Vue.js", value: "vue" },
            { label: "Angular", value: "angular" },
            { label: "Node.js", value: "nodejs" },
            { label: "Express", value: "express" },
            { label: "NestJS", value: "nestjs" },
            { label: "TypeScript", value: "typescript" },
            { label: "JavaScript", value: "javascript" },
            { label: "Python", value: "python" },
            { label: "Java", value: "java" },
            { label: "Spring Boot", value: "springboot" },
            { label: "MongoDB", value: "mongodb" },
            { label: "PostgreSQL", value: "postgresql" },
            { label: "MySQL", value: "mysql" },
            { label: "Redis", value: "redis" },
          ],
        },
      },
      {
        id: "teamMembers",
        type: "modalselect",
        label: "팀 멤버",
        required: false,
        helperText: "팀 멤버를 선택하세요",
        options: {
          placeholder: "멤버 선택",
          selectOption: [
            { label: "김철수", value: "kim" },
            { label: "이영희", value: "lee" },
            { label: "박민수", value: "park" },
            { label: "정지훈", value: "jung" },
            { label: "최유리", value: "choi" },
            { label: "강민지", value: "kang" },
          ],
        },
      },
      {
        id: "priority",
        type: "select",
        label: "우선순위",
        required: true,
        options: {
          placeholder: "선택",
          selectOption: [
            { label: "높음", value: "high" },
            { label: "보통", value: "medium" },
            { label: "낮음", value: "low" },
          ],
        },
      },
    ],
  };

  const handleFormSuccess = (data: FormData, response?: any) => {
    console.log("Form submitted successfully:", data);
    console.log("Server responses:", response);
  };

  const handleFormError = (error: string) => {
    console.error("Form submission error:", error);
  };

  // 표시할 폼 선택
  // 사용 가능한 옵션:
  // - singleApiFormConfig: 단일 API
  // - multiApiFormConfig: 여러 API
  // - simpleMultiApiFormConfig: 회원가입
  // - dateRangeTestConfig: DateRange 모든 옵션 (3/6/12개월 + 전체)
  // - simpleDateRangeConfig: DateRange 기본 (옵션 없음)
  // - dateRange3MonthsOnlyConfig: DateRange 3개월 버튼만
  // - dateRangeAllCheckboxOnlyConfig: DateRange 전체 체크박스만
  // - dateRange6And12MonthsConfig: DateRange 6/12개월 버튼
  // - modalSelectTestConfig: Modal Select (모달 선택)
  const selectedFormConfig = modalSelectTestConfig; // 원하는 예제로 변경

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px" }}>
      <DynamicForm
        config={selectedFormConfig}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
      />
    </div>
  );
};

export default App;
