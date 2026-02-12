import { FormConfigWithCodes } from "../types/type";
import { getFormCodeByCode } from "./formCodes";

export interface BulkFormConfigItem {
  key: string;
  name: string;
  config: FormConfigWithCodes;
}

// 예제 1: 계정 기간 연장 신청
export const extensionFormConfig: FormConfigWithCodes = {
  title: "계정 기간 연장 신청",
  description: "계정의 사용 기간을 연장하는 신청서입니다.",
  // 단일 API 방식
  // api: "/api/account-extension",
  // 다중 API 방식
  apis: [
    {
      url: "/api/account/info",
      fields: ["accountSelect", "extensionPeriod"],
      method: "POST",
    },
    {
      url: "/api/account/extension",
      fields: ["extensionReason"],
      method: "POST",
    },
  ],
  formCodes: ["account-extension"],
  content: getFormCodeByCode("account-extension")?.requiredFields || [],
};

// 예제 2: 계정 정보 수정 신청
export const updateFormConfig: FormConfigWithCodes = {
  title: "계정 정보 수정 신청",
  description: "계정 정보를 수정하는 신청서입니다.",
  // 단일 API 방식
  // api: "/api/account-update",
  // 다중 API 방식
  apis: [
    {
      url: "/api/account/update",
      fields: ["accountSelect", "updateFields", "updateReason"],
      method: "POST",
    },
  ],
  formCodes: ["account-update"],
  content: getFormCodeByCode("account-update")?.requiredFields || [],
};

// 예제 3: 계정 연장 + 수정 통합 신청
export const combinedFormConfig: FormConfigWithCodes = {
  title: "계정 연장 및 정보 수정 통합 신청",
  description:
    "계정 기간 연장과 정보 수정을 동시에 신청할 수 있습니다. 각 폼 코드의 필수 필드가 모두 포함됩니다.",
  // 단일 API 방식
  // api: "/api/account-combined",
  // 다중 API 방식
  apis: [
    {
      url: "/api/account/extension",
      fields: ["accountSelect", "extensionPeriod", "extensionReason"],
      method: "POST",
    },
    {
      url: "/api/account/update",
      fields: ["accountSelect", "updateFields", "updateReason"],
      method: "POST",
    },
    {
      url: "/api/priority/set",
      fields: ["urgency"],
      method: "POST",
    },
  ],
  formCodes: ["account-extension", "account-update"],
  content: [
    // 계정 연장 필수 필드
    ...(getFormCodeByCode("account-extension")?.requiredFields || []),
    // 계정 수정 필수 필드
    ...(getFormCodeByCode("account-update")?.requiredFields || []),
    // 추가 커스텀 필드
    {
      id: "urgency",
      type: "radio",
      label: "긴급도",
      required: true,
      options: {
        selectOption: [
          { label: "긴급", value: "urgent" },
          { label: "보통", value: "normal" },
          { label: "여유", value: "low" },
        ],
      },
    },
  ],
};

// 예제 4: 서버 신청
export const serverFormConfig: FormConfigWithCodes = {
  title: "서버 리소스 신청",
  description: "새로운 서버 리소스를 신청하는 양식입니다.",
  // 단일 API 방식
  // api: "/api/server-request",
  // 다중 API 방식
  apis: [
    {
      url: "/api/server/request",
      fields: ["serverType", "serverEnvironment", "serverSpecs", "serverPurpose"],
      method: "POST",
    },
  ],
  formCodes: ["server-request"],
  content: getFormCodeByCode("server-request")?.requiredFields || [],
};

// 예제 5: 리소스 할당 신청
export const resourceFormConfig: FormConfigWithCodes = {
  title: "클라우드 리소스 할당 신청",
  description: "클라우드 리소스 할당을 신청합니다.",
  // 단일 API 방식
  // api: "/api/resource-allocation",
  // 다중 API 방식
  apis: [
    {
      url: "/api/resource/allocate",
      fields: ["resourceType", "allocationPeriod"],
      method: "POST",
    },
    {
      url: "/api/justification/submit",
      fields: ["justification"],
      method: "POST",
    },
  ],
  formCodes: ["resource-allocation"],
  content: [
    ...(getFormCodeByCode("resource-allocation")?.requiredFields || []),
    {
      id: "justification",
      type: "textarea",
      label: "신청 사유",
      required: true,
      options: {
        placeholder: "리소스 할당이 필요한 사유를 작성하세요",
        rows: 5,
      },
    },
  ],
};

// 예제 6: 서버 그룹 변경 요청
export const serverGroupChangeConfig: FormConfigWithCodes = {
  title: "서버 그룹 변경 요청",
  description: "사용자의 서버 그룹 접근 권한을 변경하는 신청서입니다.",
  // 단일 API 방식
  // api: "/api/server-group-change",
  // 다중 API 방식
  apis: [
    {
      url: "/api/server-group/change",
      fields: ["serverGroupChanges", "changeReason"],
      method: "POST",
    },
  ],
  formCodes: ["server-group-change"],
  content: getFormCodeByCode("server-group-change")?.requiredFields || [],
};

// 모든 폼 설정을 배열로 export
export const BULK_FORM_CONFIGS: BulkFormConfigItem[] = [
  { key: "extension", name: "계정 기간 연장", config: extensionFormConfig },
  { key: "update", name: "계정 정보 수정", config: updateFormConfig },
  { key: "combined", name: "연장+수정 통합", config: combinedFormConfig },
  { key: "server", name: "서버 신청", config: serverFormConfig },
  { key: "resource", name: "리소스 할당", config: resourceFormConfig },
  { key: "serverGroupChange", name: "서버 그룹 변경", config: serverGroupChangeConfig },
];
