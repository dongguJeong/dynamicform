import React, { useState, useEffect } from "react";
import axios from "axios";
import { FormField, SelectOption } from "../types/type";

interface ApiSelectFieldProps {
  field: FormField;
  value: any;
  hasError: boolean;
  cssStyle: React.CSSProperties;
  onChange: (fieldId: string, value: any) => void;
}

export const ApiSelectField: React.FC<ApiSelectFieldProps> = ({
  field,
  value,
  hasError,
  cssStyle,
  onChange,
}) => {
  const [apiOptions, setApiOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchOptions = async () => {
      if (!field.options?.apiUrl) {
        setError("API URL이 설정되지 않았습니다.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await axios.get(field.options.apiUrl);
        const data = response.data.data || response.data;

        const labelKey = field.options.apiLabelKey || "label";
        const valueKey = field.options.apiValueKey || "value";

        const options: SelectOption[] = Array.isArray(data)
          ? data.map((item: any) => ({
              label: String(item[labelKey]),
              value: item[valueKey],
            }))
          : [];

        setApiOptions(options);
      } catch (err) {
        console.error("Failed to fetch API options:", err);
        setError("옵션을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [field.options?.apiUrl]);

  return (
    <div>
      <select
        id={field.id}
        className={`form-control ${hasError ? "is-invalid" : ""}`}
        required={field.required}
        value={value || ""}
        onChange={(e) => onChange(field.id, e.target.value)}
        disabled={loading}
        style={cssStyle}
      >
        {field.options?.placeholder && (
          <option value="" disabled>
            {loading ? "로딩 중..." : field.options.placeholder}
          </option>
        )}
        {apiOptions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {error && <small className="text-danger">{error}</small>}
    </div>
  );
};
