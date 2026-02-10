import React, { useState, useCallback, useEffect } from "react";
import { FormFieldComponent } from "./FormFieldComponent";
import { ApprovalFlowModal } from "./ApprovalFlowModal";
import "./DynamicForm.css";
import { FormConfig, ValidationError, FormData as FormDataType, ApprovalFlow } from "../types/type";
import useApiSubmit from "../hook/useApiSubmint";
import { useFormValidation } from "../hook/useFormValidation";

interface DynamicFormProps {
  config: FormConfig;
  onSuccess?: (data: FormDataType, response?: any) => void;
  onError?: (error: string) => void;
  enableApprovalFlow?: boolean; // 승인 플로우 기능 활성화 여부
  employeeApiUrl?: string; // 직원 목록 API URL
  readOnly?: boolean; // 읽기 전용 모드
  unicode?: boolean; // true면 제어 컴포넌트로 동작 (부모에서 상태 관리)
  value?: FormDataType; // unicode: true일 때 부모에서 받는 formData
  onChange?: (data: FormDataType) => void; // unicode: true일 때 부모로 formData 전달
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  onSuccess,
  onError,
  enableApprovalFlow = false,
  employeeApiUrl = "http://localhost:3001/api/employees/list",
  readOnly = false,
  unicode = false,
  value,
  onChange,
}) => {
  const [formData, setFormData] = useState<FormDataType>(() => {
    // unicode: true이고 value가 있으면 부모에서 받은 값 사용
    if (unicode && value) {
      return value;
    }

    // 기본 initialData 생성
    const initialData: FormDataType = {};
    config.content.forEach((field) => {
      if (field.type === "daterange") {
        // 초기값이 없으면 빈 문자열이 아닌 undefined로 설정하여 disabled 방지
        if (field.value) {
          initialData[field.id] = field.value;
        } else {
          initialData[field.id] = { startDate: undefined, endDate: undefined };
        }
      } else if (field.type === "servergroupchange") {
        // 서버 그룹 변경 필드 초기값
        initialData[field.id] = field.value || { changes: [] };
      } else {
        initialData[field.id] = field.value || "";
      }
    });
    return initialData;
  });

  const [errors, setErrors] = useState<ValidationError>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalFlow, setApprovalFlow] = useState<ApprovalFlow | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const { validateForm, validateField } = useFormValidation();
  const { submitForm, axiosInstance } = useApiSubmit();

  // unicode 모드일 때 부모의 value 변경 시 formData 동기화
  useEffect(() => {
    if (unicode && value) {
      setFormData(value);
    }
  }, [unicode, value]);

  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      const newFormData = {
        ...formData,
        [fieldId]: value,
      };

      // unicode 모드일 때: 부모 컴포넌트로 데이터 전달
      if (unicode) {
        if (onChange) {
          onChange(newFormData);
        }
      } else {
        // 일반 모드: 내부 상태 업데이트
        setFormData(newFormData);
      }

      // 터치된 필드는 실시간 검증
      if (touched.has(fieldId)) {
        const field = config.content.find((f) => f.id === fieldId);
        if (field) {
          const fieldErrors = validateField(field, value);
          setErrors((prev) => {
            if (fieldErrors.length === 0) {
              const newErrors = { ...prev };
              delete newErrors[fieldId];
              return newErrors;
            }
            return {
              ...prev,
              [fieldId]: fieldErrors,
            };
          });
        }
      }
    },
    [formData, touched, config.content, validateField, unicode, onChange],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // 모든 필드 검증
      const newErrors = validateForm(formData, config.content);

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        // 1. 폼 제출 데이터를 /api/forms/submissions에 저장
        console.log("📤 폼 제출 시작:", {
          config_title: config.title,
          formData,
          approvalFlow,
        });

        const submissionPayload = {
          formName: config.title || "제목 없음",
          data: formData,
          approvalFlow: enableApprovalFlow && approvalFlow ? approvalFlow : null,
        };

        const submissionResponse = await axiosInstance.post(
          "/api/forms/submissions",
          submissionPayload
        );

        console.log("📥 제출 저장 응답:", submissionResponse.data);

        // 2. 기존 API로도 데이터 전송 (config.api 또는 config.apis가 있는 경우)
        let apiResponse = null;
        if (config.api || (config.apis && config.apis.length > 0)) {
          const submitData = enableApprovalFlow && approvalFlow
            ? { ...formData, approvalFlow }
            : formData;

          apiResponse = await submitForm(config, submitData);
          console.log("📥 API 응답:", apiResponse);
        }

        // 성공 콜백
        if (onSuccess) {
          onSuccess(formData, submissionResponse.data);
        } else {
          alert("폼이 성공적으로 제출되었습니다.");
        }

        // 폼 초기화
        const initialData: FormDataType = {};
        config.content.forEach((field) => {
          if (field.type === "daterange") {
            if (field.value) {
              initialData[field.id] = field.value;
            } else {
              initialData[field.id] = { startDate: undefined, endDate: undefined };
            }
          } else if (field.type === "servergroupchange") {
            initialData[field.id] = field.value || { changes: [] };
          } else {
            initialData[field.id] = field.value || "";
          }
        });
        setFormData(initialData);
        setErrors({});
        setTouched(new Set());
        setApprovalFlow(null);
      } catch (error) {
        console.error("Error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "폼 제출 중 오류가 발생했습니다.";

        if (onError) {
          onError(errorMessage);
        } else {
          alert(errorMessage);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, config, validateForm, submitForm, onSuccess, onError, enableApprovalFlow, approvalFlow],
  );

  const handleSaveApprovalFlow = useCallback((flow: ApprovalFlow) => {
    setApprovalFlow(flow);
    console.log("승인 플로우 저장:", flow);
  }, []);

  return (
    <div className="dynamic-form-wrapper">
      {config.title && <h2 className="form-title">{config.title}</h2>}
      {config.description && (
        <p className="form-description">{config.description}</p>
      )}

      {/* 승인 플로우 설정 버튼 */}
      {enableApprovalFlow && !readOnly && (
        <div className="mb-3 p-3 bg-light rounded">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="mb-1">승인 플로우</h6>
              {approvalFlow && approvalFlow.approvers.length > 0 ? (
                <small className="text-muted">
                  {approvalFlow.approvers.length}명의 승인자가 설정되었습니다
                  {approvalFlow.allowParallel ? " (병렬 승인)" : " (순차 승인)"}
                </small>
              ) : (
                <small className="text-muted">승인자가 설정되지 않았습니다</small>
              )}
            </div>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowApprovalModal(true)}
            >
              {approvalFlow ? "승인자 수정" : "승인자 설정"}
            </button>
          </div>

          {/* 승인자 목록 미리보기 */}
          {approvalFlow && approvalFlow.approvers.length > 0 && (
            <div className="mt-2">
              <small className="text-muted d-block mb-1">승인 순서:</small>
              <div className="d-flex flex-wrap gap-2">
                {approvalFlow.approvers.map((approver) => (
                  <span
                    key={approver.employee.id}
                    className="badge bg-primary"
                    title={`${approver.employee.email} - ${approver.isMandatory ? "필수" : "선택"}`}
                  >
                    {approver.order}. {approver.employee.name}
                    {approver.isMandatory && " *"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="dynamic-form" noValidate>
        {config.content.map((field, index) => (
          <div
            key={field.id}
            className="form-field-wrapper"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <FormFieldComponent
              field={{
                ...field,
                options: {
                  ...field.options,
                  disabled: readOnly,
                  readonly: readOnly,
                }
              }}
              value={formData[field.id]}
              errors={errors}
              onChange={handleFieldChange}
            />
          </div>
        ))}

        {!readOnly && !unicode && (
          <div className="form-button-group">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "제출 중..." : "제출"}
            </button>
            <button type="reset" className="btn btn-secondary">
              초기화
            </button>
          </div>
        )}
      </form>

      {/* 승인 플로우 설정 모달 */}
      {enableApprovalFlow && (
        <ApprovalFlowModal
          show={showApprovalModal}
          onHide={() => setShowApprovalModal(false)}
          onSave={handleSaveApprovalFlow}
          initialFlow={approvalFlow || undefined}
          apiUrl={employeeApiUrl}
        />
      )}
    </div>
  );
};

export default DynamicForm;
