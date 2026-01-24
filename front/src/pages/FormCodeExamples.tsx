import React, { useState } from "react";
import { Card, Button, ButtonGroup } from "react-bootstrap";
import DynamicForm from "../component/DynamicForm";
import { FormConfig, FormData as FormDataType, FormConfigWithCodes } from "../types/type";
import { FORM_CODES, mergeRequiredFields } from "../config/formCodes";

const FormCodeExamples: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>("extension");

  // 예제 1: 계정 기간 연장 신청
  const extensionFormConfig: FormConfigWithCodes = {
    title: "계정 기간 연장 신청",
    description: "계정의 사용 기간을 연장하는 신청서입니다.",
    api: "/api/account-extension",
    formCodes: ["account-extension"],
    content: mergeRequiredFields(["account-extension"]),
  };

  // 예제 2: 계정 정보 수정 신청
  const updateFormConfig: FormConfigWithCodes = {
    title: "계정 정보 수정 신청",
    description: "계정 정보를 수정하는 신청서입니다.",
    api: "/api/account-update",
    formCodes: ["account-update"],
    content: mergeRequiredFields(["account-update"]),
  };

  // 예제 3: 계정 연장 + 수정 통합 신청
  const combinedFormConfig: FormConfigWithCodes = {
    title: "계정 연장 및 정보 수정 통합 신청",
    description:
      "계정 기간 연장과 정보 수정을 동시에 신청할 수 있습니다. 두 폼 코드의 필수 필드가 모두 포함되어 있으며, 계정 선택 필드는 중복 제거되어 하나만 표시됩니다.",
    api: "/api/account-combined",
    formCodes: ["account-extension", "account-update"],
    content: [
      ...mergeRequiredFields(["account-extension", "account-update"]),
      // 추가 커스텀 필드
      {
        id: "urgency",
        type: "radio",
        label: "긴급도",
        required: true,
        options: {
          selectOption: [
            { label: "긴급", value: "urgent" },
            { label: "보통", value: "normal" },
            { label: "여유", value: "low" },
          ],
        },
      },
    ],
  };

  // 예제 4: 서버 신청
  const serverFormConfig: FormConfigWithCodes = {
    title: "서버 리소스 신청",
    description: "새로운 서버 리소스를 신청하는 양식입니다.",
    api: "/api/server-request",
    formCodes: ["server-request"],
    content: mergeRequiredFields(["server-request"]),
  };

  // 예제 5: 리소스 할당 신청
  const resourceFormConfig: FormConfigWithCodes = {
    title: "클라우드 리소스 할당 신청",
    description: "클라우드 리소스 할당을 신청합니다.",
    api: "/api/resource-allocation",
    formCodes: ["resource-allocation"],
    content: [
      ...mergeRequiredFields(["resource-allocation"]),
      {
        id: "justification",
        type: "textarea",
        label: "신청 사유",
        required: true,
        options: {
          placeholder: "리소스 할당이 필요한 사유를 작성하세요",
          rows: 5,
        },
      },
    ],
  };

  const getFormConfig = (): FormConfig => {
    switch (selectedExample) {
      case "extension":
        return extensionFormConfig;
      case "update":
        return updateFormConfig;
      case "combined":
        return combinedFormConfig;
      case "server":
        return serverFormConfig;
      case "resource":
        return resourceFormConfig;
      default:
        return extensionFormConfig;
    }
  };

  const handleFormSuccess = (data: FormData, response?: any) => {
    console.log("Form submitted successfully:", data);
    console.log("Server response:", response);
    alert("폼이 성공적으로 제출되었습니다!");
  };

  const handleFormError = (error: string) => {
    console.error("Form submission error:", error);
    alert(`폼 제출 오류: ${error}`);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">폼 코드 예제</h1>

      <Card className="mb-4">
        <Card.Body>
          <h5>폼 코드 시스템</h5>
          <p className="text-muted">
            폼 코드는 특정 업무 유형에 필요한 필수 필드를 자동으로 추가하는
            시스템입니다. 여러 폼 코드를 조합하여 통합 신청서를 만들 수
            있습니다.
          </p>

          <h6 className="mt-3">사용 가능한 폼 코드:</h6>
          <ul>
            {FORM_CODES.map((fc) => (
              <li key={fc.code}>
                <strong>{fc.name}</strong> ({fc.code}): {fc.description}
                <br />
                <small className="text-muted">
                  필수 필드: {fc.requiredFields.map((f) => f.label).join(", ")}
                </small>
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <h5>예제 선택</h5>
          <ButtonGroup className="mb-3">
            <Button
              variant={selectedExample === "extension" ? "primary" : "outline-primary"}
              onClick={() => setSelectedExample("extension")}
            >
              계정 연장
            </Button>
            <Button
              variant={selectedExample === "update" ? "primary" : "outline-primary"}
              onClick={() => setSelectedExample("update")}
            >
              계정 수정
            </Button>
            <Button
              variant={selectedExample === "combined" ? "primary" : "outline-primary"}
              onClick={() => setSelectedExample("combined")}
            >
              연장+수정 통합
            </Button>
            <Button
              variant={selectedExample === "server" ? "primary" : "outline-primary"}
              onClick={() => setSelectedExample("server")}
            >
              서버 신청
            </Button>
            <Button
              variant={selectedExample === "resource" ? "primary" : "outline-primary"}
              onClick={() => setSelectedExample("resource")}
            >
              리소스 할당
            </Button>
          </ButtonGroup>

          {selectedExample === "combined" && (
            <div className="alert alert-info">
              <strong>중복 제거 예제:</strong> 이 폼은 "계정 기간 연장"과 "계정
              정보 수정" 두 폼 코드를 사용합니다. 두 폼 코드 모두 "계정 선택"
              필드를 요구하지만, 중복 제거 로직에 의해 하나만 표시됩니다.
            </div>
          )}
        </Card.Body>
      </Card>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <DynamicForm
          config={getFormConfig()}
          onSuccess={handleFormSuccess}
          onError={handleFormError}
        />
      </div>

      <Card className="mt-4">
        <Card.Header>
          <h6 className="mb-0">현재 폼 설정 (JSON)</h6>
        </Card.Header>
        <Card.Body>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "1rem",
              borderRadius: "4px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {JSON.stringify(getFormConfig(), null, 2)}
          </pre>
        </Card.Body>
      </Card>
    </div>
  );
};

export default FormCodeExamples;
