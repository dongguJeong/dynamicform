import React, { useState, useCallback } from "react";
import { FormFieldComponent } from "./FormFieldComponent";
import "./DynamicForm.css";
import { FormConfig, ValidationError, FormData as FormDataType } from "../types/type";
import useApiSubmit from "../hook/useApiSubmint";
import { useFormValidation } from "../hook/useFormValidation";

interface DynamicFormProps {
  config: FormConfig;
  onSuccess?: (data: FormDataType, response?: any) => void;
  onError?: (error: string) => void;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  config,
  onSuccess,
  onError,
}) => {
  const [formData, setFormData] = useState<FormDataType>(() => {
    const initialData: FormDataType = {};
    config.content.forEach((field) => {
      if (field.type === "daterange") {
        initialData[field.id] = field.value || { startDate: "", endDate: "" };
      } else {
        initialData[field.id] = field.value || "";
      }
    });
    return initialData;
  });

  const [errors, setErrors] = useState<ValidationError>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { validateForm, validateField } = useFormValidation();
  const { submitForm } = useApiSubmit();

  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [fieldId]: value,
      }));

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
    [touched, config.content, validateField],
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
        // API 제출 (단일 API 또는 여러 API)
        console.log("📤 폼 제출 시작:", {
          config_apis: config.apis,
          config_api: config.api,
          formData,
        });

        const response = await submitForm(config, formData);

        console.log("📥 API 응답:", response);
        console.log("Server response:", response);

        // 성공 콜백
        if (onSuccess) {
          onSuccess(formData, response);
        } else {
          alert("폼이 성공적으로 제출되었습니다.");
        }

        // 폼 초기화
        const initialData: FormDataType = {};
        config.content.forEach((field) => {
          if (field.type === "daterange") {
            initialData[field.id] = field.value || {
              startDate: "",
              endDate: "",
            };
          } else {
            initialData[field.id] = field.value || "";
          }
        });
        setFormData(initialData);
        setErrors({});
        setTouched(new Set());
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
    [formData, config, validateForm, submitForm, onSuccess, onError],
  );

  return (
    <div className="dynamic-form-wrapper">
      {config.title && <h2 className="form-title">{config.title}</h2>}
      {config.description && (
        <p className="form-description">{config.description}</p>
      )}

      <form onSubmit={handleSubmit} className="dynamic-form" noValidate>
        {config.content.map((field, index) => (
          <div
            key={field.id}
            className="form-field-wrapper"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <FormFieldComponent
              field={field}
              value={formData[field.id]}
              errors={errors}
              onChange={handleFieldChange}
            />
          </div>
        ))}

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
      </form>
    </div>
  );
};

export default DynamicForm;
