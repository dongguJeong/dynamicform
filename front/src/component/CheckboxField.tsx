import React from "react";
import { FormField } from "../types/type";

interface CheckboxFieldProps {
  field: FormField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  field,
  value,
  onChange,
}) => {
  return (
    <div className="checkbox-wrapper">
      {field.options?.selectOption?.map((item, idx) => (
        <label key={item.value} className="checkbox-label">
          <input
            type="checkbox"
            value={item.value}
            id={`${field.id}-${idx}`}
            className="form-check-input"
            checked={Array.isArray(value) && value.includes(item.value)}
            onChange={(e) => {
              const newValue = Array.isArray(value) ? value : [];
              if (e.target.checked) {
                onChange(field.id, [...newValue, item.value]);
              } else {
                onChange(
                  field.id,
                  newValue.filter((v) => v !== item.value),
                );
              }
            }}
          />
          {item.label}
        </label>
      ))}
    </div>
  );
};
