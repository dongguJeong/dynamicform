import React from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { FormField } from "../types/type";

interface DropdownFieldProps {
  field: FormField;
  value: any;
  hasError: boolean;
  onChange: (fieldId: string, value: any) => void;
}

export const DropdownField: React.FC<DropdownFieldProps> = ({
  field,
  value,
  hasError,
  onChange,
}) => {
  return (
    <DropdownButton
      id={field.id}
      title={
        value
          ? field.options?.selectOption?.find((i) => i.value === value)
              ?.label
          : field.options?.placeholder || "선택"
      }
      className={`w-100 ${hasError ? "is-invalid" : ""}`}
      onSelect={(eventKey) => {
        onChange(field.id, eventKey);
      }}
    >
      {field.options?.selectOption?.map((item) => (
        <Dropdown.Item key={item.value} eventKey={item.value}>
          {item.label}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
};
