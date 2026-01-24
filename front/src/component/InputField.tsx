import React from "react";
import { FormField } from "../types/type";

interface InputFieldProps {
  field: FormField;
  value: any;
  hasError: boolean;
  cssStyle: React.CSSProperties;
  onChange: (fieldId: string, value: any) => void;
}

export const InputField: React.FC<InputFieldProps> = ({
  field,
  value,
  hasError,
  cssStyle,
  onChange,
}) => {
  return (
    <input
      type={field.type}
      id={field.id}
      className={`form-control ${hasError ? "is-invalid" : ""}`}
      required={field.required}
      placeholder={field.options?.placeholder}
      minLength={field.options?.minLength}
      maxLength={field.options?.maxLength}
      min={field.options?.min}
      max={field.options?.max}
      value={value || ""}
      onChange={(e) => onChange(field.id, e.target.value)}
      style={cssStyle}
    />
  );
};
