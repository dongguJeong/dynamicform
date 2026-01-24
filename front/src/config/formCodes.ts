import { FormCode } from "../types/type";

// 폼 코드 정의: 각 폼 유형이 요구하는 필수 필드
export const FORM_CODES: FormCode[] = [
  {
    code: "account-extension",
    name: "계정 기간 연장 신청",
    description: "계정의 사용 기간을 연장하는 신청서",
    requiredFields: [
      {
        id: "accountSelect",
        type: "apiselect",
        label: "계정 선택",
        required: true,
        helperText: "연장할 계정을 선택하세요",
        options: {
          placeholder: "계정을 선택하세요",
          apiUrl: "/api/accounts/list",
          apiLabelKey: "accountName",
          apiValueKey: "accountId",
        },
      },
      {
        id: "extensionPeriod",
        type: "daterange",
        label: "연장 기간",
        required: true,
        helperText: "연장할 기간을 선택하세요",
        options: {
          periodOptions: ["3months", "6months", "12months"],
          showAllCheckbox: false,
        },
      },
      {
        id: "extensionReason",
        type: "textarea",
        label: "연장 사유",
        required: true,
        helperText: "계정 기간 연장이 필요한 사유를 작성하세요",
        options: {
          placeholder: "연장 사유를 입력하세요",
          rows: 4,
          maxLength: 500,
        },
      },
    ],
  },
  {
    code: "account-update",
    name: "계정 정보 수정 신청",
    description: "계정 정보를 수정하는 신청서",
    requiredFields: [
      {
        id: "accountSelect",
        type: "apiselect",
        label: "계정 선택",
        required: true,
        helperText: "수정할 계정을 선택하세요",
        options: {
          placeholder: "계정을 선택하세요",
          apiUrl: "/api/accounts/list",
          apiLabelKey: "accountName",
          apiValueKey: "accountId",
        },
      },
      {
        id: "updateFields",
        type: "checkbox",
        label: "수정할 항목",
        required: true,
        helperText: "수정할 항목을 선택하세요",
        options: {
          selectOption: [
            { label: "이메일 주소", value: "email" },
            { label: "전화번호", value: "phone" },
            { label: "부서", value: "department" },
            { label: "직급", value: "position" },
          ],
        },
      },
      {
        id: "updateReason",
        type: "textarea",
        label: "수정 사유",
        required: true,
        helperText: "정보 수정이 필요한 사유를 작성하세요",
        options: {
          placeholder: "수정 사유를 입력하세요",
          rows: 4,
          maxLength: 500,
        },
      },
    ],
  },
  {
    code: "server-request",
    name: "서버 신청",
    description: "새로운 서버 리소스를 신청하는 양식",
    requiredFields: [
      {
        id: "serverType",
        type: "apiselect",
        label: "서버 유형",
        required: true,
        helperText: "필요한 서버 유형을 선택하세요",
        options: {
          placeholder: "서버 유형 선택",
          apiUrl: "/api/servers/types",
          apiLabelKey: "typeName",
          apiValueKey: "typeId",
        },
      },
      {
        id: "serverEnvironment",
        type: "select",
        label: "환경",
        required: true,
        options: {
          placeholder: "환경 선택",
          selectOption: [
            { label: "개발 (DEV)", value: "dev" },
            { label: "스테이징 (STAGE)", value: "stage" },
            { label: "운영 (PROD)", value: "prod" },
          ],
        },
      },
      {
        id: "serverSpecs",
        type: "modalselect",
        label: "서버 사양",
        required: true,
        helperText: "필요한 서버 사양을 선택하세요",
        options: {
          placeholder: "사양 선택",
          selectOption: [
            { label: "CPU 4코어", value: "cpu_4" },
            { label: "CPU 8코어", value: "cpu_8" },
            { label: "RAM 8GB", value: "ram_8" },
            { label: "RAM 16GB", value: "ram_16" },
            { label: "SSD 100GB", value: "ssd_100" },
            { label: "SSD 500GB", value: "ssd_500" },
          ],
        },
      },
      {
        id: "serverPurpose",
        type: "textarea",
        label: "사용 목적",
        required: true,
        helperText: "서버 사용 목적을 상세히 작성하세요",
        options: {
          placeholder: "서버 사용 목적을 입력하세요",
          rows: 5,
          maxLength: 1000,
        },
      },
    ],
  },
  {
    code: "resource-allocation",
    name: "리소스 할당 신청",
    description: "클라우드 리소스 할당을 신청하는 양식",
    requiredFields: [
      {
        id: "resourceType",
        type: "apiselect",
        label: "리소스 유형",
        required: true,
        options: {
          placeholder: "리소스 유형 선택",
          apiUrl: "/api/resources/types",
          apiLabelKey: "name",
          apiValueKey: "id",
        },
      },
      {
        id: "allocationPeriod",
        type: "daterange",
        label: "할당 기간",
        required: true,
        options: {
          periodOptions: ["3months", "6months", "12months"],
          showAllCheckbox: true,
        },
      },
    ],
  },
];

// 폼 코드로 필드 찾기
export const getFormCodeByCode = (code: string): FormCode | undefined => {
  return FORM_CODES.find((fc) => fc.code === code);
};

// 여러 폼 코드의 필수 필드를 병합 (중복 제거)
export const mergeRequiredFields = (formCodes: string[]) => {
  const fieldMap = new Map();

  formCodes.forEach((code) => {
    const formCode = getFormCodeByCode(code);
    if (formCode) {
      formCode.requiredFields.forEach((field) => {
        // 같은 ID의 필드가 이미 있으면 건너뛰기 (첫 번째 것 우선)
        if (!fieldMap.has(field.id)) {
          fieldMap.set(field.id, field);
        }
      });
    }
  });

  return Array.from(fieldMap.values());
};
