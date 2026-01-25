import React from "react";
import { format, addMonths, addYears } from "date-fns";
import { FormField, DateRangeValue } from "../types/type";

interface DateRangeFieldProps {
  field: FormField;
  value: any;
  hasError: boolean;
  onChange: (fieldId: string, value: any) => void;
}

export const DateRangeField: React.FC<DateRangeFieldProps> = ({
  field,
  value,
  hasError,
  onChange,
}) => {
  const dateRangeValue = value as DateRangeValue | undefined;
  // "전체" 체크박스가 체크된 경우만 true (명시적으로 빈 문자열로 설정된 경우)
  // undefined는 초기 상태로 간주하여 disabled하지 않음
  const isAllSelected =
    dateRangeValue?.startDate === "" &&
    dateRangeValue?.endDate === "" &&
    dateRangeValue.startDate !== undefined;

  const getTodayFormatted = (): string =>
    format(new Date(), "yyyy-MM-dd");
  const get3MonthsLaterFormatted = (): string =>
    format(addMonths(new Date(), 3), "yyyy-MM-dd");
  const get6MonthsLaterFormatted = (): string =>
    format(addMonths(new Date(), 6), "yyyy-MM-dd");
  const get12MonthsLaterFormatted = (): string =>
    format(addYears(new Date(), 1), "yyyy-MM-dd");

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

  // 사용자가 직접 날짜를 입력했는지 확인 (라디오 버튼 옵션과 일치하지 않는 경우)
  const isCustomDate = (): boolean => {
    if (!dateRangeValue?.startDate || !dateRangeValue?.endDate)
      return false;
    return !is3MonthsSelected() && !is6MonthsSelected() && !is12MonthsSelected();
  };

  const handleAllCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.checked) {
      onChange(field.id, {
        startDate: "",
        endDate: "",
      });
    } else {
      onChange(field.id, {
        startDate: getTodayFormatted(),
        endDate: getTodayFormatted(),
      });
    }
  };

  const shouldShowPeriodButton = (period: "3months" | "6months" | "12months"): boolean => {
    if (field.options?.periodOptions) {
      return field.options.periodOptions.includes(period);
    }
    return field.options?.showAllOptions === true;
  };

  const shouldShowAllCheckbox = (): boolean => {
    if (field.options?.showAllCheckbox !== undefined) {
      return field.options.showAllCheckbox;
    }
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
            value={dateRangeValue?.startDate ?? ""}
            disabled={isAllSelected}
            onChange={(e) => {
              onChange(field.id, {
                startDate: e.target.value,
                endDate: dateRangeValue?.endDate ?? "",
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
            value={dateRangeValue?.endDate ?? ""}
            disabled={isAllSelected}
            onChange={(e) => {
              onChange(field.id, {
                startDate: dateRangeValue?.startDate ?? "",
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

          <label className="daterange-radio">
            <input
              type="radio"
              name={`${field.id}-period`}
              className="form-check-input"
              disabled={isAllSelected}
              checked={isCustomDate()}
              onChange={() => {
                // 커스텀 라디오 버튼을 클릭하면 오늘 날짜로 초기화
                onChange(field.id, {
                  startDate: getTodayFormatted(),
                  endDate: getTodayFormatted(),
                });
              }}
            />
            직접 입력
          </label>
        </div>
      )}
    </div>
  );
};
