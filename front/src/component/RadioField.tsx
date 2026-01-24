import React from "react";
import { FormField } from "../types/type";

interface RadioFieldProps {
  field: FormField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
}

export const RadioField: React.FC<RadioFieldProps> = ({
  field,
  value,
  onChange,
}) => {
  return (
    <div className="radio-wrapper">
      {field.options?.selectOption?.map((item, idx) => (
        <label key={item.value} className="radio-label">
          <input
            type="radio"
            name={field.id}
            value={item.value}
            id={`${field.id}-${idx}`}
            className="form-check-input"
            required={field.required}
            checked={value === item.value}
            onChange={(e) => onChange(field.id, e.target.value)}
          />
          {item.label}
        </label>
      ))}
    </div>
  );
};
