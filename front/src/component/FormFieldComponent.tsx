import React, { useState } from "react";
import { format, addMonths, addYears } from "date-fns";
import { FormField, ValidationError, DateRangeValue } from "../types/type";
import { Dropdown, DropdownButton, Modal, Button } from "react-bootstrap";

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
      cssProps[key] = value;
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

      case "select":
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

      case "dropdown":
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

      case "daterange": {
        const dateRangeValue = value as DateRangeValue | undefined;
        const isAllSelected =
          dateRangeValue?.startDate === "" && dateRangeValue?.endDate === "";

        // date-fns 함수들
        const getTodayFormatted = (): string =>
          format(new Date(), "yyyy-MM-dd");
        const get3MonthsLaterFormatted = (): string =>
          format(addMonths(new Date(), 3), "yyyy-MM-dd");
        const get6MonthsLaterFormatted = (): string =>
          format(addMonths(new Date(), 6), "yyyy-MM-dd");
        const get12MonthsLaterFormatted = (): string =>
          format(addYears(new Date(), 1), "yyyy-MM-dd");

        // 기간 선택 판단 함수들
        const is3MonthsSelected = (): boolean => {
          if (!dateRangeValue?.startDate || !dateRangeValue?.endDate)
            return false;
          return (
            dateRangeValue.startDate === getTodayFormatted() &&
            dateRangeValue.endDate === get3MonthsLaterFormatted()
          );
        };

        const is6MonthsSelected = (): boolean => {
          if (!dateRangeValue?.startDate || !dateRangeValue?.endDate)
            return false;
          return (
            dateRangeValue.startDate === getTodayFormatted() &&
            dateRangeValue.endDate === get6MonthsLaterFormatted()
          );
        };

        const is12MonthsSelected = (): boolean => {
          if (!dateRangeValue?.startDate || !dateRangeValue?.endDate)
            return false;
          return (
            dateRangeValue.startDate === getTodayFormatted() &&
            dateRangeValue.endDate === get12MonthsLaterFormatted()
          );
        };

        const handleAllCheckboxChange = (
          e: React.ChangeEvent<HTMLInputElement>,
        ) => {
          if (e.target.checked) {
            // 전체 선택
            onChange(field.id, {
              startDate: "",
              endDate: "",
            });
          } else {
            // 전체 해제 - 오늘 날짜로 초기화 (또는 undefined)
            onChange(field.id, {
              startDate: getTodayFormatted(),
              endDate: getTodayFormatted(),
            });
          }
        };

        // periodOptions 또는 showAllOptions(deprecated) 사용
        const shouldShowPeriodButton = (period: "3months" | "6months" | "12months"): boolean => {
          // periodOptions가 있으면 그것을 우선 사용
          if (field.options?.periodOptions) {
            return field.options.periodOptions.includes(period);
          }
          // showAllOptions가 true면 모든 버튼 표시 (하위 호환성)
          return field.options?.showAllOptions === true;
        };

        const shouldShowAllCheckbox = (): boolean => {
          // showAllCheckbox가 명시되어 있으면 그것을 사용
          if (field.options?.showAllCheckbox !== undefined) {
            return field.options.showAllCheckbox;
          }
          // showAllOptions가 있으면 그것을 사용 (하위 호환성)
          return field.options?.showAllOptions === true;
        };

        return (
          <div className="daterange-wrapper">
            <div className="daterange-container">
              <div className="daterange-input-group">
                <label
                  htmlFor={`${field.id}-start`}
                  className="daterange-label"
                >
                  사용기간
                </label>
                <input
                  id={`${field.id}-start`}
                  type="date"
                  className={`form-control daterange-input ${hasError ? "is-invalid" : ""}`}
                  value={dateRangeValue?.startDate || ""}
                  disabled={isAllSelected}
                  onChange={(e) => {
                    onChange(field.id, {
                      startDate: e.target.value,
                      endDate: dateRangeValue?.endDate || "",
                    });
                  }}
                />
              </div>

              <div className="daterange-divider">~</div>

              <div className="daterange-input-group">
                <input
                  id={`${field.id}-end`}
                  type="date"
                  className={`form-control daterange-input ${hasError ? "is-invalid" : ""}`}
                  value={dateRangeValue?.endDate || ""}
                  disabled={isAllSelected}
                  onChange={(e) => {
                    onChange(field.id, {
                      startDate: dateRangeValue?.startDate || "",
                      endDate: e.target.value,
                    });
                  }}
                />
              </div>

              {shouldShowAllCheckbox() && (
                <label className="daterange-checkbox">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isAllSelected}
                    onChange={handleAllCheckboxChange}
                  />
                  전체
                </label>
              )}
            </div>

            {(shouldShowPeriodButton("3months") || shouldShowPeriodButton("6months") || shouldShowPeriodButton("12months")) && (
              <div className="daterange-radio-group">
                {shouldShowPeriodButton("3months") && (
                  <label className="daterange-radio">
                    <input
                      type="radio"
                      name={`${field.id}-period`}
                      className="form-check-input"
                      disabled={isAllSelected}
                      checked={is3MonthsSelected()}
                      onChange={() => {
                        onChange(field.id, {
                          startDate: getTodayFormatted(),
                          endDate: get3MonthsLaterFormatted(),
                        });
                      }}
                    />
                    3개월
                  </label>
                )}

                {shouldShowPeriodButton("6months") && (
                  <label className="daterange-radio">
                    <input
                      type="radio"
                      name={`${field.id}-period`}
                      className="form-check-input"
                      disabled={isAllSelected}
                      checked={is6MonthsSelected()}
                      onChange={() => {
                        onChange(field.id, {
                          startDate: getTodayFormatted(),
                          endDate: get6MonthsLaterFormatted(),
                        });
                      }}
                    />
                    6개월
                  </label>
                )}

                {shouldShowPeriodButton("12months") && (
                  <label className="daterange-radio">
                    <input
                      type="radio"
                      name={`${field.id}-period`}
                      className="form-check-input"
                      disabled={isAllSelected}
                      checked={is12MonthsSelected()}
                      onChange={() => {
                        onChange(field.id, {
                          startDate: getTodayFormatted(),
                          endDate: get12MonthsLaterFormatted(),
                        });
                      }}
                    />
                    12개월
                  </label>
                )}
              </div>
            )}
          </div>
        );
      }

      case "checkbox":
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

      case "radio":
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

      case "modalselect": {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [showModal, setShowModal] = useState(false);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [tempSelection, setTempSelection] = useState<(string | number)[]>(
          Array.isArray(value) ? value : [],
        );

        const selectedItems = Array.isArray(value) ? value : [];

        const handleOpenModal = () => {
          setTempSelection(selectedItems);
          setShowModal(true);
        };

        const handleCloseModal = () => {
          setShowModal(false);
        };

        const handleConfirmSelection = () => {
          onChange(field.id, tempSelection);
          setShowModal(false);
        };

        const handleToggleItem = (itemValue: string | number) => {
          if (tempSelection.includes(itemValue)) {
            setTempSelection(tempSelection.filter((v) => v !== itemValue));
          } else {
            setTempSelection([...tempSelection, itemValue]);
          }
        };

        const handleRemoveItem = (itemValue: string | number) => {
          onChange(
            field.id,
            selectedItems.filter((v) => v !== itemValue),
          );
        };

        const getItemLabel = (itemValue: string | number): string => {
          const item = field.options?.selectOption?.find(
            (opt) => opt.value === itemValue,
          );
          return item ? String(item.label) : String(itemValue);
        };

        return (
          <div className="modalselect-wrapper">
            {/* 선택된 아이템 표시 영역 */}
            <div className="modalselect-display">
              {selectedItems.length === 0 ? (
                <div className="modalselect-placeholder">
                  {field.options?.placeholder || "항목을 선택하세요"}
                </div>
              ) : (
                <div className="modalselect-items">
                  {selectedItems.map((itemValue) => (
                    <span key={itemValue} className="badge bg-primary me-2 mb-2">
                      {getItemLabel(itemValue)}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        style={{ fontSize: "0.6rem" }}
                        onClick={() => handleRemoveItem(itemValue)}
                        aria-label="Remove"
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 모달 열기 버튼 */}
            <Button
              variant="outline-primary"
              size="sm"
              className="mt-2"
              onClick={handleOpenModal}
            >
              {field.options?.placeholder || "항목 선택"}
            </Button>

            {/* 모달 */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
              <Modal.Header closeButton>
                <Modal.Title>{field.label} 선택</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="modalselect-options">
                  {field.options?.selectOption?.map((item) => (
                    <div key={item.value} className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`modal-${field.id}-${item.value}`}
                        checked={tempSelection.includes(item.value)}
                        onChange={() => handleToggleItem(item.value)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`modal-${field.id}-${item.value}`}
                      >
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseModal}>
                  취소
                </Button>
                <Button variant="primary" onClick={handleConfirmSelection}>
                  확인
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        );
      }

      default:
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
