import React from "react";
import { FormField } from "../types/type";

interface SelectFieldProps {
  field: FormField;
  value: any;
  hasError: boolean;
  cssStyle: React.CSSProperties;
  onChange: (fieldId: string, value: any) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  field,
  value,
  hasError,
  cssStyle,
  onChange,
}) => {
  return (
    <select
      id={field.id}
      className={`form-control ${hasError ? "is-invalid" : ""}`}
      required={field.required}
      value={value || ""}
      onChange={(e) => onChange(field.id, e.target.value)}
      style={cssStyle}
    >
      {field.options?.placeholder && (
        <option value="" disabled>
          {field.options.placeholder}
        </option>
      )}
      {field.options?.selectOption?.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
};
