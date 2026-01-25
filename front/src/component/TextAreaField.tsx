import React from "react";
import { FormField } from "../types/type";

interface TextAreaFieldProps {
  field: FormField;
  value: any;
  hasError: boolean;
  cssStyle: React.CSSProperties;
  onChange: (fieldId: string, value: any) => void;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  field,
  value,
  hasError,
  cssStyle,
  onChange,
}) => {
  return (
    <textarea
      id={field.id}
      className={`form-control ${hasError ? "is-invalid" : ""}`}
      required={field.required}
      placeholder={field.options?.placeholder}
      rows={field.options?.rows || 4}
      maxLength={field.options?.maxLength}
      value={value || ""}
      onChange={(e) => onChange(field.id, e.target.value)}
      style={cssStyle}
    />
  );
};
