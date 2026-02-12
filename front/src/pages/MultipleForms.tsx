import React, { useState } from "react";
import { FormConfig, FormData as FormDataType } from "../types/type";
import DynamicForm from "../component/DynamicForm";
import { Container, Button, Card, Alert } from "react-bootstrap";
import axios from "axios";

const MultipleForms: React.FC = () => {
  // 각 폼의 데이터를 부모 컴포넌트에서 관리
  const [basicInfoData, setBasicInfoData] = useState<FormDataType>({
    requestTitle: "",
    requestEmail: "",
    requesterName: "",
  });

  const [serverInfoData, setServerInfoData] = useState<FormDataType>({
    env: "",
    serverType: "",
    serverCount: "",
  });

  const [additionalInfoData, setAdditionalInfoData] = useState<FormDataType>({
    features: [],
    memo: "",
    urgency: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // 기본 정보 폼 설정
  const basicInfoConfig: FormConfig = {
    title: "1. 기본 정보",
    description: "신청자의 기본 정보를 입력해주세요.",
    content: [
      {
        id: "requestTitle",
        type: "text",
        label: "요청 제목",
        required: true,
        helperText: "신청 내용을 간단히 요약해주세요",
        options: {
          placeholder: "예: 신규 개발 서버 신청",
          minLength: 3,
          maxLength: 50,
        },
      },
      {
        id: "requesterName",
        type: "text",
        label: "신청자 이름",
        required: true,
        helperText: "신청자의 이름을 입력하세요",
        options: {
          placeholder: "홍길동",
        },
      },
      {
        id: "requestEmail",
        type: "email",
        label: "이메일 주소",
        required: true,
        helperText: "연락 가능한 이메일 주소를 입력하세요",
        options: {
          placeholder: "example@company.com",
        },
      },
    ],
  };

  // 서버 정보 폼 설정
  const serverInfoConfig: FormConfig = {
    title: "2. 서버 정보",
    description: "필요한 서버의 상세 정보를 입력해주세요.",
    content: [
      {
        id: "env",
        type: "select",
        label: "배포 환경",
        required: true,
        helperText: "서버를 배포할 환경을 선택하세요",
        options: {
          placeholder: "환경 선택",
          selectOption: [
            { label: "개발 환경 (DEV)", value: "dev" },
            { label: "스테이징 (STAGE)", value: "stage" },
            { label: "운영 환경 (PROD)", value: "prod" },
          ],
        },
      },
      {
        id: "serverType",
        type: "radio",
        label: "서버 타입",
        required: true,
        helperText: "필요한 서버의 종류를 선택하세요",
        options: {
          selectOption: [
            { label: "웹 서버 (Nginx/Apache)", value: "web" },
            { label: "API 서버 (Node/Spring)", value: "api" },
            { label: "데이터베이스 (MySQL/PostgreSQL)", value: "db" },
            { label: "캐시 서버 (Redis/Memcached)", value: "cache" },
          ],
        },
      },
      {
        id: "serverCount",
        type: "number",
        label: "서버 수량",
        required: true,
        helperText: "필요한 서버의 개수를 입력하세요",
        options: {
          placeholder: "1",
          min: 1,
          max: 10,
        },
      },
    ],
  };

  // 추가 정보 폼 설정
  const additionalInfoConfig: FormConfig = {
    title: "3. 추가 요청사항",
    description: "추가로 필요한 설정이나 요청사항을 입력해주세요.",
    content: [
      {
        id: "features",
        type: "checkbox",
        label: "추가 설정",
        required: false,
        helperText: "필요한 추가 설정을 모두 선택하세요",
        options: {
          selectOption: [
            { label: "SSL 인증서 설치", value: "ssl" },
            { label: "CDN 설정", value: "cdn" },
            { label: "백업 설정", value: "backup" },
            { label: "모니터링 설정", value: "monitoring" },
            { label: "로드밸런서 설정", value: "loadbalancer" },
          ],
        },
      },
      {
        id: "urgency",
        type: "dropdown",
        label: "긴급도",
        required: true,
        helperText: "작업의 긴급도를 선택하세요",
        options: {
          placeholder: "긴급도 선택",
          selectOption: [
            { label: "긴급 (24시간 이내)", value: "urgent" },
            { label: "높음 (3일 이내)", value: "high" },
            { label: "보통 (1주일 이내)", value: "normal" },
            { label: "낮음 (2주일 이내)", value: "low" },
          ],
        },
      },
      {
        id: "memo",
        type: "textarea",
        label: "상세 내용",
        required: false,
        helperText: "추가 요청사항이나 특이사항을 작성해주세요",
        options: {
          placeholder: "추가로 전달할 내용을 작성하세요",
          rows: 5,
          maxLength: 1000,
        },
      },
    ],
  };

  // 전체 폼 제출 핸들러
  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      // 모든 폼의 데이터를 합치기
      const combinedData = {
        basicInfo: basicInfoData,
        serverInfo: serverInfoData,
        additionalInfo: additionalInfoData,
        submittedAt: new Date().toISOString(),
      };

      console.log("📤 통합 폼 제출:", combinedData);

      // API로 데이터 전송
      const response = await axios.post(
        "http://localhost:3001/api/forms/submissions",
        {
          formName: "통합 신청 폼 (다중 폼)",
          data: combinedData,
          approvalFlow: null,
        }
      );

      console.log("📥 제출 응답:", response.data);

      setSubmitResult({
        type: "success",
        message: "모든 정보가 성공적으로 제출되었습니다!",
      });

      // 폼 초기화
      setBasicInfoData({
        requestTitle: "",
        requestEmail: "",
        requesterName: "",
      });
      setServerInfoData({
        env: "",
        serverType: "",
        serverCount: "",
      });
      setAdditionalInfoData({
        features: [],
        memo: "",
        urgency: "",
      });
    } catch (error) {
      console.error("❌ 제출 오류:", error);
      setSubmitResult({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "폼 제출 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 기본 유효성 검사
  const validateAllForms = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 기본 정보 검증
    if (!basicInfoData.requestTitle || basicInfoData.requestTitle.length < 3) {
      errors.push("요청 제목은 3자 이상 입력해야 합니다.");
    }
    if (!basicInfoData.requesterName) {
      errors.push("신청자 이름을 입력해야 합니다.");
    }
    if (!basicInfoData.requestEmail || !basicInfoData.requestEmail.includes("@")) {
      errors.push("유효한 이메일 주소를 입력해야 합니다.");
    }

    // 서버 정보 검증
    if (!serverInfoData.env) {
      errors.push("배포 환경을 선택해야 합니다.");
    }
    if (!serverInfoData.serverType) {
      errors.push("서버 타입을 선택해야 합니다.");
    }
    if (!serverInfoData.serverCount || serverInfoData.serverCount < 1) {
      errors.push("서버 수량은 1 이상이어야 합니다.");
    }

    // 추가 정보 검증
    if (!additionalInfoData.urgency) {
      errors.push("긴급도를 선택해야 합니다.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmitWithValidation = () => {
    const validation = validateAllForms();

    if (!validation.isValid) {
      setSubmitResult({
        type: "error",
        message: `다음 항목을 확인해주세요:\n${validation.errors.join("\n")}`,
      });
      return;
    }

    handleSubmitAll();
  };

  return (
    <Container className="py-4" style={{ maxWidth: "900px" }}>
      <div className="mb-4">
        <h1 className="mb-2">통합 신청 폼</h1>
        <p className="text-muted">
          여러 개의 폼을 하나의 페이지에서 관리하며, 모든 데이터는 부모
          컴포넌트에서 통합 관리됩니다.
        </p>
      </div>

      {/* 제출 결과 표시 */}
      {submitResult && (
        <Alert
          variant={submitResult.type === "success" ? "success" : "danger"}
          dismissible
          onClose={() => setSubmitResult(null)}
          className="mb-4"
        >
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {submitResult.message}
          </pre>
        </Alert>
      )}

      {/* 폼 1: 기본 정보 */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <DynamicForm
            config={basicInfoConfig}
            unicode={true}
            value={basicInfoData}
            onChange={setBasicInfoData}
          />
        </Card.Body>
      </Card>

      {/* 폼 2: 서버 정보 */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <DynamicForm
            config={serverInfoConfig}
            unicode={true}
            value={serverInfoData}
            onChange={setServerInfoData}
          />
        </Card.Body>
      </Card>

      {/* 폼 3: 추가 요청사항 */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <DynamicForm
            config={additionalInfoConfig}
            unicode={true}
            value={additionalInfoData}
            onChange={setAdditionalInfoData}
          />
        </Card.Body>
      </Card>

      {/* 통합 제출 버튼 */}
      <div className="d-flex gap-3 justify-content-center mt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmitWithValidation}
          disabled={isSubmitting}
          style={{ minWidth: "200px" }}
        >
          {isSubmitting ? "제출 중..." : "전체 제출"}
        </Button>
        <Button
          variant="outline-secondary"
          size="lg"
          onClick={() => {
            setBasicInfoData({
              requestTitle: "",
              requestEmail: "",
              requesterName: "",
            });
            setServerInfoData({
              env: "",
              serverType: "",
              serverCount: "",
            });
            setAdditionalInfoData({
              features: [],
              memo: "",
              urgency: "",
            });
            setSubmitResult(null);
          }}
          disabled={isSubmitting}
          style={{ minWidth: "200px" }}
        >
          전체 초기화
        </Button>
      </div>

      {/* 현재 입력된 데이터 미리보기 */}
      <Card className="mt-4 bg-light">
        <Card.Body>
          <h5 className="mb-3">현재 입력된 데이터 (디버깅용)</h5>
          <div style={{ fontSize: "0.875rem" }}>
            <details>
              <summary className="cursor-pointer text-primary mb-2">
                기본 정보 데이터
              </summary>
              <pre className="bg-white p-3 rounded border">
                {JSON.stringify(basicInfoData, null, 2)}
              </pre>
            </details>
            <details>
              <summary className="cursor-pointer text-primary mb-2">
                서버 정보 데이터
              </summary>
              <pre className="bg-white p-3 rounded border">
                {JSON.stringify(serverInfoData, null, 2)}
              </pre>
            </details>
            <details>
              <summary className="cursor-pointer text-primary mb-2">
                추가 정보 데이터
              </summary>
              <pre className="bg-white p-3 rounded border">
                {JSON.stringify(additionalInfoData, null, 2)}
              </pre>
            </details>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MultipleForms;
