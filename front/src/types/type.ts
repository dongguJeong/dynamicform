export type FieldType =
  | "text"
  | "textarea"
  | "select"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "email"
  | "number"
  | "password"
  | "date"
  | "daterange"
  | "modalselect";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface DateRangeValue {
  startDate: string;
  endDate: string;
}

export interface FieldOptions extends React.CSSProperties {
  // 폼 필드 기본 옵션
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  rows?: number;

  // select, dropdown, checkbox, radio용
  selectOption?: SelectOption[];

  // daterange용
  periodOptions?: ("3months" | "6months" | "12months")[]; // 표시할 기간 버튼들
  showAllCheckbox?: boolean; // "전체" 체크박스 표시 여부

  // HTML 속성
  disabled?: boolean;
  readonly?: boolean;
  pattern?: string;
  step?: number;
  cols?: number;
  format?: string;
  showAllOptions?: boolean; // deprecated: periodOptions와 showAllCheckbox 사용 권장

  // CSS 커스텀 속성 (위의 CSSProperties에서 모든 CSS 속성 포함)
  // 예: color, backgroundColor, fontSize, padding, margin 등

  [key: string]: any;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  helperText?: string;
  options?: FieldOptions;
  value?: string | number | boolean | DateRangeValue;
}

// API 설정: 어느 필드들을 어느 API로 보낼지 정의
export interface ApiConfig {
  // API 엔드포인트
  url: string;
  // 이 API로 보낼 필드 ID들
  fields: string[];
  // 필드 ID를 API body 속성명으로 매핑 (선택사항)
  // 예: { requestTitle: 'title', env: 'environment' }
  fieldMapping?: Record<string, string>;
  // HTTP 메서드
  method?: "POST" | "PUT" | "PATCH";
}

export interface FormConfig {
  title: string;
  description?: string;
  // 단일 API 사용 (기존 방식)
  api?: string;
  // 또는 여러 API 사용 (새로운 방식)
  apis?: ApiConfig[];
  content: FormField[];
}

export interface FormData {
  [key: string]: any;
}

export interface ValidationError {
  [key: string]: string[];
}

// API 요청 시 보낼 데이터
export interface ApiRequestBody {
  [key: string]: any;
}
