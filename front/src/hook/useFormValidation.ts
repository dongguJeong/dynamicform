import { useCallback } from "react";
import { FormField, ValidationError, FormData as FormDataType } from "../types/type";

export const useFormValidation = () => {
  const validateField = useCallback(
    (field: FormField, value: any): string[] => {
      const errors: string[] = [];

      // 필수 검증
      if (field.required) {
        if (typeof value === "string") {
          if (value.trim().length === 0) {
            errors.push(`${field.label}은(는) 필수 입력 항목입니다.`);
          }
        } else if (value === null || value === undefined) {
          errors.push(`${field.label}은(는) 필수 입력 항목입니다.`);
        }
      }

      // 필드 타입별 검증
      if (value && typeof value === "string") {
        // 최소 길이
        if (
          field.options?.minLength &&
          value.trim().length < field.options.minLength
        ) {
          errors.push(
            `${field.label}은(는) 최소 ${field.options.minLength}자 이상이어야 합니다.`,
          );
        }

        // 최대 길이
        if (
          field.options?.maxLength &&
          value.trim().length > field.options.maxLength
        ) {
          errors.push(
            `${field.label}은(는) 최대 ${field.options.maxLength}자 이하여야 합니다.`,
          );
        }

        // 이메일 검증
        if (field.type === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field.label}은(는) 유효한 이메일 주소가 아닙니다.`);
          }
        }
      }

      // 숫자 범위 검증
      if (field.type === "number" && value !== "") {
        const num = Number(value);
        if (field.options?.min !== undefined && num < field.options.min) {
          errors.push(
            `${field.label}은(는) ${field.options.min} 이상이어야 합니다.`,
          );
        }
        if (field.options?.max !== undefined && num > field.options.max) {
          errors.push(
            `${field.label}은(는) ${field.options.max} 이하여야 합니다.`,
          );
        }
      }

      return errors;
    },
    [],
  );

  const validateForm = useCallback(
    (formData: FormDataType, fields: FormField[]): ValidationError => {
      const errors: ValidationError = {};

      fields.forEach((field) => {
        const fieldErrors = validateField(field, formData[field.id]);
        if (fieldErrors.length > 0) {
          errors[field.id] = fieldErrors;
        }
      });

      return errors;
    },
    [validateField],
  );

  return { validateField, validateForm };
};
