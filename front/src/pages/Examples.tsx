import React from "react";
import { FormConfig, FormData as FormDataType } from "../types/type";
import DynamicForm from "../component/DynamicForm";

const Examples: React.FC = () => {
  // ===== 예제 1: 단일 API 사용 (기존 방식) =====
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const handleFormSuccess = (data: FormDataType, response?: any) => {
    console.log("Form submitted successfully:", data);
    console.log("Server responses:", response);
  };

  const handleFormError = (error: string) => {
    console.error("Form submission error:", error);
  };

  // 표시할 폼 선택
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

export default Examples;
