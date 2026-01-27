import React from "react";
import { DynamicForm } from "../component/DynamicForm";
import { FormConfig } from "../types/type";

/**
 * 승인 플로우 기능이 포함된 폼 예시 페이지
 */
export const FormWithApprovalExample: React.FC = () => {
  // 폼 설정 예시 - apis 형태로 변경 (다중 API 지원)
  const formConfig: FormConfig = {
    title: "계정 기간 연장 신청",
    description: "계정 사용 기간을 연장하려면 아래 양식을 작성하고 승인자를 지정해주세요.",
    // 단일 API 방식 (기존)
    // api: "http://localhost:3001/api/selectServer",

    // 다중 API 방식 (새로운 방식)
    apis: [
      {
        url: "http://localhost:3001/api/account/extend",
        fields: ["requestTitle", "accountId", "usagePeriod"],
        method: "POST",
      },
      {
        url: "http://localhost:3001/api/environment/config",
        fields: ["env", "reason"],
        method: "POST",
      },
    ],
    content: [
      {
        id: "requestTitle",
        type: "text",
        label: "신청 제목",
        required: true,
        helperText: "신청 제목을 간단히 입력하세요",
        options: {
          placeholder: "예: 개발 서버 계정 연장",
          maxLength: 100,
        },
      },
      {
        id: "accountId",
        type: "apiselect",
        label: "계정 선택",
        required: true,
        options: {
          apiUrl: "http://localhost:3001/api/accounts/list",
          apiLabelKey: "accountName",
          apiValueKey: "accountId",
          placeholder: "계정을 선택하세요",
        },
      },
      {
        id: "env",
        type: "select",
        label: "환경",
        required: true,
        options: {
          placeholder: "환경을 선택하세요",
          selectOption: [
            { label: "개발", value: "development" },
            { label: "스테이징", value: "staging" },
            { label: "프로덕션", value: "production" },
          ],
        },
      },
      {
        id: "usagePeriod",
        type: "daterange",
        label: "사용 기간",
        required: true,
        helperText: "계정을 사용할 기간을 선택하세요",
        options: {
          periodOptions: ["3months", "6months", "12months"],
          showAllCheckbox: true,
        },
      },
      {
        id: "reason",
        type: "textarea",
        label: "연장 사유",
        required: true,
        options: {
          placeholder: "계정 연장이 필요한 사유를 상세히 작성해주세요",
          rows: 5,
          maxLength: 500,
        },
      },
    ],
  };

  const handleSuccess = (data: any, response: any) => {
    console.log("폼 제출 성공:", data, response);
    alert(
      `폼이 성공적으로 제출되었습니다!\n제출 ID: ${response.data?.id || "N/A"}\n승인 플로우가 시작되었습니다.`
    );
  };

  const handleError = (error: string) => {
    console.error("폼 제출 실패:", error);
    alert(`폼 제출 실패: ${error}`);
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card shadow">
            <div className="card-body p-4">
              <DynamicForm
                config={formConfig}
                onSuccess={handleSuccess}
                onError={handleError}
                enableApprovalFlow={true}
                employeeApiUrl="http://localhost:3001/api/employees/list"
              />
            </div>
          </div>

          {/* 사용 안내 */}
          <div className="mt-4">
            <div className="alert alert-info">
              <h5 className="alert-heading">
                <i className="bi bi-info-circle"></i> 승인 플로우 사용 방법
              </h5>
              <hr />
              <ol className="mb-0">
                <li className="mb-2">
                  <strong>승인자 설정:</strong> 상단의 "승인자 설정" 버튼을
                  클릭하여 승인 플로우를 구성합니다.
                </li>
                <li className="mb-2">
                  <strong>직원 선택:</strong> 모달에서 직원 목록을 검색하고
                  승인자를 추가합니다.
                </li>
                <li className="mb-2">
                  <strong>순서 지정:</strong> 화살표 버튼으로 승인 순서를
                  조정하거나 "병렬 승인"을 활성화합니다.
                </li>
                <li className="mb-2">
                  <strong>필수 여부:</strong> 각 승인자의 "필수" 체크박스로
                  필수 승인 여부를 설정합니다.
                </li>
                <li className="mb-2">
                  <strong>폼 제출:</strong> 폼 데이터를 입력하고 제출하면 승인
                  플로우가 자동으로 시작됩니다.
                </li>
              </ol>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-3">
            <div className="card">
              <div className="card-header">
                <strong>승인 플로우 옵션 설명</strong>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <strong>모든 승인자의 승인 필요:</strong> 체크 시 모든
                    승인자가 승인해야 최종 승인됩니다.
                  </li>
                  <li className="mb-2">
                    <strong>병렬 승인 허용:</strong> 체크 시 승인자들이 순서에
                    관계없이 동시에 승인할 수 있습니다. 해제 시 지정된 순서대로
                    순차적으로 승인합니다.
                  </li>
                  <li className="mb-0">
                    <strong>필수 승인:</strong> 각 승인자별로 필수 승인 여부를
                    설정할 수 있습니다. 필수 승인자는 반드시 승인해야 합니다.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormWithApprovalExample;
