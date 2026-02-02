import React from "react";
import { FormField, ValidationError } from "../types/type";
import { TextAreaField } from "./TextAreaField";
import { SelectField } from "./SelectField";
import { ApiSelectField } from "./ApiSelectField";
import { DropdownField } from "./DropdownField";
import { DateRangeField } from "./DateRangeField";
import { CheckboxField } from "./CheckboxField";
import { RadioField } from "./RadioField";
import { ModalSelectField } from "./ModalSelectField";
import { InputField } from "./InputField";
import { ServerGroupChangeField } from "./ServerGroupChangeField";
import { AccountCreateField } from "./AccountCreateField";

interface FormFieldComponentProps {
  field: FormField;
  value: any;
  errors: ValidationError;
  onChange: (fieldId: string, value: any) => void;
}

// CSS 속성 확인 함수
const isCSSProperty = (key: string): key is keyof React.CSSProperties => {
  return key in document.createElement("div").style;
};

// FieldOptions에서 CSS 속성만 추출
const extractCSSProperties = (options?: any): React.CSSProperties => {
  if (!options) return {};

  const cssProps: React.CSSProperties = {};

  Object.entries(options).forEach(([key, value]) => {
    if (isCSSProperty(key)) {
      (cssProps as any)[key] = value;
    }
  });

  return cssProps;
};

export const FormFieldComponent: React.FC<FormFieldComponentProps> = ({
  field,
  value,
  errors,
  onChange,
}) => {
  const hasError = errors[field.id] && errors[field.id].length > 0;
  const cssStyle = extractCSSProperties(field.options);

  const renderField = () => {
    switch (field.type) {
      case "textarea":
        return (
          <TextAreaField
            field={field}
            value={value}
            hasError={hasError}
            cssStyle={cssStyle}
            onChange={onChange}
          />
        );

      case "select":
        return (
          <SelectField
            field={field}
            value={value}
            hasError={hasError}
            cssStyle={cssStyle}
            onChange={onChange}
          />
        );

      case "apiselect":
        return (
          <ApiSelectField
            field={field}
            value={value}
            hasError={hasError}
            cssStyle={cssStyle}
            onChange={onChange}
          />
        );

      case "dropdown":
        return (
          <DropdownField
            field={field}
            value={value}
            hasError={hasError}
            onChange={onChange}
          />
        );

      case "daterange":
        return (
          <DateRangeField
            field={field}
            value={value}
            hasError={hasError}
            onChange={onChange}
          />
        );

      case "checkbox":
        return (
          <CheckboxField
            field={field}
            value={value}
            onChange={onChange}
          />
        );

      case "radio":
        return (
          <RadioField
            field={field}
            value={value}
            onChange={onChange}
          />
        );

      case "modalselect":
        return (
          <ModalSelectField
            field={field}
            value={value}
            onChange={onChange}
          />
        );

      case "servergroupchange":
        return (
          <ServerGroupChangeField
            field={field}
            value={value}
            hasError={hasError}
            onChange={onChange}
          />
        );

      case "accountcreate":
        return (
          <AccountCreateField
            field={field}
            value={value}
            hasError={hasError}
            onChange={onChange}
          />
        );

      default:
        return (
          <InputField
            field={field}
            value={value}
            hasError={hasError}
            cssStyle={cssStyle}
            onChange={onChange}
          />
        );
    }
  };

  return (
    <div className={`form-group ${hasError ? "has-error" : ""}`}>
      <label htmlFor={field.id} className="form-label">
        {field.label}
        {field.required && <span className="required">*</span>}
      </label>

      <div className="input-wrapper">{renderField()}</div>

      {field.helperText && (
        <small className="form-helper-text">{field.helperText}</small>
      )}

      {hasError && (
        <div className="form-error-container">
          {errors[field.id].map((error, idx) => (
            <div key={idx} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
