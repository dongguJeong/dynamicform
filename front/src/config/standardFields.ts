import { FieldType } from "../types/type";

/**
 * 표준 필드 정의
 * DB에 저장되는 필드 ID의 일관성을 위해 미리 정의된 필드 목록
 */
export interface StandardField {
  id: string;
  label: string;
  description: string;
  suggestedTypes: FieldType[];
  category: string;
}

export const STANDARD_FIELDS: StandardField[] = [
  // 계정 관련 필드
  {
    id: "accountSelect",
    label: "계정 선택",
    description: "계정을 선택하는 필드",
    suggestedTypes: ["apiselect", "select"],
    category: "account",
  },
  {
    id: "accountId",
    label: "계정 ID",
    description: "계정 ID 입력",
    suggestedTypes: ["text"],
    category: "account",
  },
  {
    id: "accountName",
    label: "계정 이름",
    description: "계정 이름 입력",
    suggestedTypes: ["text"],
    category: "account",
  },
  {
    id: "extensionPeriod",
    label: "연장 기간",
    description: "계정 연장 기간 선택",
    suggestedTypes: ["daterange"],
    category: "account",
  },
  {
    id: "extensionReason",
    label: "연장 사유",
    description: "계정 연장 사유 입력",
    suggestedTypes: ["textarea"],
    category: "account",
  },
  {
    id: "updateFields",
    label: "수정할 항목",
    description: "수정할 필드 선택",
    suggestedTypes: ["checkbox", "modalselect"],
    category: "account",
  },
  {
    id: "updateReason",
    label: "수정 사유",
    description: "정보 수정 사유 입력",
    suggestedTypes: ["textarea"],
    category: "account",
  },

  // 서버 관련 필드
  {
    id: "serverType",
    label: "서버 유형",
    description: "서버 유형 선택",
    suggestedTypes: ["apiselect", "select"],
    category: "server",
  },
  {
    id: "serverEnvironment",
    label: "서버 환경",
    description: "서버 환경 선택 (dev, stage, prod)",
    suggestedTypes: ["select", "radio"],
    category: "server",
  },
  {
    id: "serverSpecs",
    label: "서버 사양",
    description: "서버 사양 선택",
    suggestedTypes: ["modalselect", "checkbox"],
    category: "server",
  },
  {
    id: "serverPurpose",
    label: "서버 사용 목적",
    description: "서버 사용 목적 입력",
    suggestedTypes: ["textarea"],
    category: "server",
  },
  {
    id: "serverName",
    label: "서버 이름",
    description: "서버 이름 입력",
    suggestedTypes: ["text"],
    category: "server",
  },

  // 리소스 관련 필드
  {
    id: "resourceType",
    label: "리소스 유형",
    description: "리소스 유형 선택",
    suggestedTypes: ["apiselect", "select"],
    category: "resource",
  },
  {
    id: "allocationPeriod",
    label: "할당 기간",
    description: "리소스 할당 기간",
    suggestedTypes: ["daterange"],
    category: "resource",
  },
  {
    id: "resourceAmount",
    label: "리소스 양",
    description: "리소스 양 입력",
    suggestedTypes: ["number"],
    category: "resource",
  },

  // 신청 관련 공통 필드
  {
    id: "requestTitle",
    label: "신청 제목",
    description: "신청서 제목 입력",
    suggestedTypes: ["text"],
    category: "common",
  },
  {
    id: "requestDescription",
    label: "신청 내용",
    description: "신청 내용 상세 입력",
    suggestedTypes: ["textarea"],
    category: "common",
  },
  {
    id: "requestReason",
    label: "신청 사유",
    description: "신청 사유 입력",
    suggestedTypes: ["textarea"],
    category: "common",
  },
  {
    id: "requestDate",
    label: "신청 일자",
    description: "신청 일자 선택",
    suggestedTypes: ["date"],
    category: "common",
  },
  {
    id: "usagePeriod",
    label: "사용 기간",
    description: "사용 기간 선택",
    suggestedTypes: ["daterange"],
    category: "common",
  },
  {
    id: "priority",
    label: "우선순위",
    description: "우선순위 선택",
    suggestedTypes: ["select", "radio"],
    category: "common",
  },
  {
    id: "department",
    label: "부서",
    description: "부서 선택 또는 입력",
    suggestedTypes: ["select", "text"],
    category: "common",
  },
  {
    id: "requesterName",
    label: "신청자 이름",
    description: "신청자 이름 입력",
    suggestedTypes: ["text"],
    category: "common",
  },
  {
    id: "requesterEmail",
    label: "신청자 이메일",
    description: "신청자 이메일 입력",
    suggestedTypes: ["email"],
    category: "common",
  },
  {
    id: "requesterPhone",
    label: "신청자 연락처",
    description: "신청자 연락처 입력",
    suggestedTypes: ["text"],
    category: "common",
  },

  // 서버 그룹 관련 필드
  {
    id: "serverGroupChanges",
    label: "서버 그룹 변경",
    description: "사용자의 서버 그룹 변경 요청",
    suggestedTypes: ["servergroupchange"],
    category: "server",
  },
  {
    id: "changeReason",
    label: "변경 사유",
    description: "서버 그룹 변경 사유 입력",
    suggestedTypes: ["textarea"],
    category: "server",
  },
  {
    id: "serverSelect",
    label: "서버 선택",
    description: "서버를 선택하는 필드",
    suggestedTypes: ["apiselect", "select"],
    category: "server",
  },

  // 계정 생성 관련 필드
  {
    id: "accountCreation",
    label: "계정 생성",
    description: "계정 생성 필드 (테이블 + 모달)",
    suggestedTypes: ["accountcreate"],
    category: "account",
  },
  {
    id: "accountCreate:ip",
    label: "계정 생성 - IP 주소 필드",
    description: "계정 생성 모달에 IP 주소 입력 필드 추가",
    suggestedTypes: ["accountcreate"],
    category: "account",
  },
  {
    id: "accountCreate:textarea",
    label: "계정 생성 - 설명 필드",
    description: "계정 생성 모달에 설명 입력 필드 추가",
    suggestedTypes: ["accountcreate"],
    category: "account",
  },
  {
    id: "accountCreate:accountSelect",
    label: "계정 생성 - 연관 계정 선택",
    description: "계정 생성 모달에 연관 계정 선택 필드 추가",
    suggestedTypes: ["accountcreate"],
    category: "account",
  },
  {
    id: "accountCreate:daterange",
    label: "계정 생성 - 사용 기간",
    description: "계정 생성 모달에 사용 기간 선택 필드 추가",
    suggestedTypes: ["accountcreate"],
    category: "account",
  },

  // 기타 필드
  {
    id: "notes",
    label: "비고",
    description: "추가 사항 입력",
    suggestedTypes: ["textarea"],
    category: "common",
  },
  {
    id: "attachments",
    label: "첨부파일",
    description: "파일 첨부",
    suggestedTypes: ["text"],
    category: "common",
  },
  {
    id: "approvalRequired",
    label: "승인 필요 여부",
    description: "승인이 필요한지 선택",
    suggestedTypes: ["checkbox", "radio"],
    category: "common",
  },
  {
    id: "urgency",
    label: "긴급도",
    description: "긴급도 선택",
    suggestedTypes: ["select", "radio"],
    category: "common",
  },
  {
    id: "environment",
    label: "환경",
    description: "환경 선택 (dev, stage, prod 등)",
    suggestedTypes: ["select", "radio"],
    category: "common",
  },
  {
    id: "status",
    label: "상태",
    description: "상태 선택",
    suggestedTypes: ["select", "radio"],
    category: "common",
  },
];

// 카테고리별로 필드 그룹화
export const FIELD_CATEGORIES = [
  { value: "common", label: "공통" },
  { value: "account", label: "계정" },
  { value: "server", label: "서버" },
  { value: "resource", label: "리소스" },
];

// 필드 ID로 표준 필드 찾기
export const getStandardFieldById = (id: string): StandardField | undefined => {
  return STANDARD_FIELDS.find((field) => field.id === id);
};

// 카테고리별 필드 필터링
export const getFieldsByCategory = (category: string): StandardField[] => {
  return STANDARD_FIELDS.filter((field) => field.category === category);
};

// 모든 필드 ID 목록 추출
export const getAllFieldIds = (): string[] => {
  return STANDARD_FIELDS.map((field) => field.id);
};
