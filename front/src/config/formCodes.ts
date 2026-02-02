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
    optionalFieldIds: [
      "accountId",
      "accountName",
      "requestTitle",
      "requestDescription",
      "priority",
      "department",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "notes",
      "urgency",
    ],
    apiConfigs: [
      {
        url: "/api/account/extension",
        fields: ["accountSelect", "extensionPeriod", "extensionReason"],
        fieldMapping: {
          accountSelect: "accountId",
          extensionPeriod: "period",
          extensionReason: "reason",
        },
        method: "POST",
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
    optionalFieldIds: [
      "accountId",
      "accountName",
      "requestTitle",
      "requestDescription",
      "priority",
      "department",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "notes",
      "urgency",
    ],
    apiConfigs: [
      {
        url: "/api/account/update",
        fields: ["accountSelect", "updateFields", "updateReason"],
        fieldMapping: {
          accountSelect: "accountId",
          updateFields: "fieldsToUpdate",
          updateReason: "reason",
        },
        method: "POST",
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
    optionalFieldIds: [
      "serverName",
      "usagePeriod",
      "requestTitle",
      "requestDescription",
      "priority",
      "department",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "notes",
      "urgency",
    ],
    apiConfigs: [
      {
        url: "/api/server/request",
        fields: ["serverType", "serverEnvironment", "serverSpecs", "serverPurpose"],
        fieldMapping: {
          serverType: "type",
          serverEnvironment: "environment",
          serverSpecs: "specifications",
          serverPurpose: "purpose",
        },
        method: "POST",
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
    optionalFieldIds: [
      "resourceAmount",
      "requestTitle",
      "requestDescription",
      "requestReason",
      "priority",
      "department",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "notes",
      "urgency",
      "environment",
    ],
    apiConfigs: [
      {
        url: "/api/resource/allocation",
        fields: ["resourceType", "allocationPeriod"],
        fieldMapping: {
          resourceType: "type",
          allocationPeriod: "period",
        },
        method: "POST",
      },
    ],
  },
  {
    code: "server-group-change",
    name: "서버 그룹 변경 요청",
    description: "사용자의 서버 그룹 접근 권한을 변경하는 신청서",
    requiredFields: [
      {
        id: "serverGroupChanges",
        type: "servergroupchange",
        label: "서버 그룹 변경 요청",
        required: true,
        helperText: "변경할 사용자와 목표 서버 그룹을 선택하세요",
        options: {},
      },
      {
        id: "changeReason",
        type: "textarea",
        label: "변경 사유",
        required: true,
        helperText: "서버 그룹 변경이 필요한 사유를 상세히 작성하세요",
        options: {
          placeholder: "변경 사유를 입력하세요",
          rows: 4,
          maxLength: 1000,
        },
      },
    ],
    optionalFieldIds: [
      "requestTitle",
      "priority",
      "department",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "notes",
      "urgency",
    ],
    apiConfigs: [
      {
        url: "/api/server-group/change",
        fields: ["serverGroupChanges", "changeReason"],
        fieldMapping: {
          serverGroupChanges: "changes",
          changeReason: "reason",
        },
        method: "POST",
      },
    ],
  },
  {
    code: "account-creation",
    name: "계정 생성 신청",
    description: "새로운 계정 생성을 신청하는 양식",
    requiredFields: [
      {
        id: "serverSelect",
        type: "apiselect",
        label: "서버 선택",
        required: true,
        helperText: "계정을 생성할 서버를 선택하세요",
        options: {
          placeholder: "서버를 선택하세요",
          apiUrl: "/api/servers/list",
          apiLabelKey: "serverName",
          apiValueKey: "serverId",
        },
      },
      {
        id: "accountCreation",
        type: "accountcreate",
        label: "계정 생성",
        required: true,
        helperText: "생성할 계정 정보를 입력하세요",
        options: {
          accountTypes: [
            { label: "관리자", value: "admin" },
            { label: "일반 사용자", value: "user" },
            { label: "읽기 전용", value: "readonly" },
          ],
          accountCreateModalFields: {
            ip: true,
            textarea: true,
            accountSelect: true,
            daterange: true,
          },
          relatedAccountsApiUrl: "/api/accounts/list",
        },
      },
    ],
    optionalFieldIds: [
      "requestTitle",
      "requestDescription",
      "priority",
      "department",
      "requesterName",
      "requesterEmail",
      "requesterPhone",
      "notes",
      "urgency",
    ],
    apiConfigs: [
      {
        url: "/api/account/creation",
        fields: ["serverSelect", "accountCreation"],
        fieldMapping: {
          serverSelect: "serverId",
          accountCreation: "accounts",
        },
        method: "POST",
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

// 여러 폼 코드의 선택적 필드 ID를 병합 (중복 제거)
export const mergeOptionalFieldIds = (formCodes: string[]): string[] => {
  const fieldIdSet = new Set<string>();

  formCodes.forEach((code) => {
    const formCode = getFormCodeByCode(code);
    if (formCode?.optionalFieldIds) {
      formCode.optionalFieldIds.forEach((id) => fieldIdSet.add(id));
    }
  });

  return Array.from(fieldIdSet);
};

// 여러 폼 코드의 API 설정을 병합
export const mergeApiConfigs = (formCodes: string[]) => {
  const apiConfigs: any[] = [];

  formCodes.forEach((code) => {
    const formCode = getFormCodeByCode(code);
    if (formCode?.apiConfigs) {
      apiConfigs.push(...formCode.apiConfigs);
    }
  });

  return apiConfigs;
};
