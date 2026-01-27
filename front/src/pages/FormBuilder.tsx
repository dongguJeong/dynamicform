import React, { useState, useEffect } from "react";
import { Button, Form, Card, ListGroup, Modal, Alert, Badge, Accordion } from "react-bootstrap";
import axios from "axios";
import { FormField, ApprovalFlow, FormConfig } from "../types/type";
import { FORM_CODES, getFormCodeByCode, mergeApiConfigs } from "../config/formCodes";
import { STANDARD_FIELDS, FIELD_CATEGORIES, getStandardFieldById } from "../config/standardFields";
import { ApprovalFlowModal } from "../component/ApprovalFlowModal";
import DynamicForm from "../component/DynamicForm";

// 폼 코드별 선택된 필드 관리
interface FormCodeFields {
  code: string;
  requiredFields: FormField[]; // 필수 필드 (자동 추가)
  optionalFields: FormField[]; // 선택적으로 추가된 필드
}

const FormBuilder: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: 기본 정보
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedFormCodes, setSelectedFormCodes] = useState<string[]>([]);

  // Step 2: 폼 코드별 필드
  const [formCodeFieldsMap, setFormCodeFieldsMap] = useState<Map<string, FormCodeFields>>(new Map());
  const [showOptionalFieldModal, setShowOptionalFieldModal] = useState(false);
  const [currentFormCodeForOptional, setCurrentFormCodeForOptional] = useState<string>("");
  const [selectedOptionalFieldIds, setSelectedOptionalFieldIds] = useState<string[]>([]);

  // Step 3: 승인 플로우
  const [approvalFlow, setApprovalFlow] = useState<ApprovalFlow | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Step 4: 미리보기 및 저장
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // 폼 코드 선택 시 필수 필드 자동 추가
  useEffect(() => {
    const newMap = new Map<string, FormCodeFields>();

    selectedFormCodes.forEach(code => {
      const formCode = getFormCodeByCode(code);
      if (formCode) {
        const existing = formCodeFieldsMap.get(code);
        newMap.set(code, {
          code: code,
          requiredFields: formCode.requiredFields,
          optionalFields: existing?.optionalFields || [],
        });
      }
    });

    setFormCodeFieldsMap(newMap);
  }, [selectedFormCodes]);

  // 폼 코드 토글
  const handleToggleFormCode = (code: string) => {
    setSelectedFormCodes(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  // 옵션 필드 추가 모달 열기
  const handleOpenOptionalFieldModal = (formCodeId: string) => {
    const formCode = getFormCodeByCode(formCodeId);
    if (!formCode) return;

    setCurrentFormCodeForOptional(formCodeId);
    setSelectedOptionalFieldIds([]);
    setShowOptionalFieldModal(true);
  };

  // 옵션 필드 저장
  const handleSaveOptionalFields = () => {
    const formCode = getFormCodeByCode(currentFormCodeForOptional);
    if (!formCode) return;

    const newOptionalFields: FormField[] = [];

    selectedOptionalFieldIds.forEach(fieldId => {
      const standardField = getStandardFieldById(fieldId);
      if (standardField) {
        newOptionalFields.push({
          id: fieldId,
          type: standardField.suggestedTypes[0] || "text",
          label: standardField.label,
          required: false,
          helperText: standardField.description,
          options: {
            placeholder: `${standardField.label}을(를) 입력하세요`,
          },
        });
      }
    });

    setFormCodeFieldsMap(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentFormCodeForOptional);
      if (existing) {
        newMap.set(currentFormCodeForOptional, {
          ...existing,
          optionalFields: [...existing.optionalFields, ...newOptionalFields],
        });
      }
      return newMap;
    });

    setShowOptionalFieldModal(false);
  };

  // 옵션 필드 삭제
  const handleRemoveOptionalField = (formCodeId: string, fieldId: string) => {
    setFormCodeFieldsMap(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(formCodeId);
      if (existing) {
        newMap.set(formCodeId, {
          ...existing,
          optionalFields: existing.optionalFields.filter(f => f.id !== fieldId),
        });
      }
      return newMap;
    });
  };

  // 모든 필드를 하나의 배열로 병합
  const getAllFields = (): FormField[] => {
    const allFields: FormField[] = [];
    formCodeFieldsMap.forEach(codeFields => {
      allFields.push(...codeFields.requiredFields);
      allFields.push(...codeFields.optionalFields);
    });
    return allFields;
  };

  // 최종 폼 설정 생성
  const buildFinalFormConfig = (): FormConfig => {
    // 선택된 폼 코드들의 API 설정을 자동으로 병합
    const apiConfigs = mergeApiConfigs(selectedFormCodes);

    const config: any = {
      title: formTitle,
      description: formDescription,
      content: getAllFields(),
      formCodes: selectedFormCodes,
      approvalFlow: approvalFlow,
      apis: apiConfigs, // 폼 코드에서 자동으로 병합된 API 설정
    };

    return config;
  };

  // 폼 저장
  const handleSaveForm = async () => {
    if (!formTitle) {
      alert("폼 제목을 입력하세요.");
      return;
    }

    if (selectedFormCodes.length === 0) {
      alert("최소 1개의 폼 코드를 선택하세요.");
      return;
    }

    const formConfig = buildFinalFormConfig();

    try {
      setIsSaving(true);
      const response = await axios.post("/api/forms/save", {
        name: formTitle,
        config: JSON.stringify(formConfig, null, 2),
      });
      setSaveMessage(`폼이 저장되었습니다! ID: ${response.data.data.formId}`);

      // 3초 후 메시지 제거 및 초기화
      setTimeout(() => {
        setSaveMessage("");
        // 폼 초기화
        setCurrentStep(1);
        setFormTitle("");
        setFormDescription("");
        setSelectedFormCodes([]);
        setFormCodeFieldsMap(new Map());
        setApprovalFlow(null);
      }, 3000);
    } catch (error) {
      console.error("Form save error:", error);
      alert("폼 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 단계별 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // Step 1: 기본 정보 및 폼 코드 선택
  const renderStep1 = () => (
    <>
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">1단계: 폼 기본 정보</h5>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>폼 제목 *</Form.Label>
            <Form.Control
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="예: 회원가입 폼"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>폼 설명</Form.Label>
            <Form.Control
              type="text"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="예: 신규 회원 가입을 위한 폼입니다."
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">폼 코드 선택 *</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted small mb-3">
            폼 코드를 선택하면 해당 코드에 필요한 필수 필드가 자동으로 추가됩니다.
            여러 개를 선택할 수 있습니다.
          </p>

          {FORM_CODES.map((formCode) => (
            <div key={formCode.code} className="mb-3 p-3 border rounded">
              <Form.Check
                type="checkbox"
                id={`formCode-${formCode.code}`}
                checked={selectedFormCodes.includes(formCode.code)}
                onChange={() => handleToggleFormCode(formCode.code)}
                label={
                  <div>
                    <strong>{formCode.name}</strong>
                    {formCode.description && (
                      <div className="text-muted small mt-1">
                        {formCode.description}
                      </div>
                    )}
                    <div className="text-muted small mt-1">
                      <strong>필수 필드 ({formCode.requiredFields.length}개):</strong>{" "}
                      {formCode.requiredFields.map(f => f.label).join(", ")}
                    </div>
                  </div>
                }
              />
            </div>
          ))}

          {selectedFormCodes.length > 0 && (
            <Alert variant="success" className="mt-3">
              <strong>선택된 폼 코드 ({selectedFormCodes.length}개):</strong>
              <div className="mt-2">
                {selectedFormCodes.map(code => {
                  const fc = FORM_CODES.find(f => f.code === code);
                  return (
                    <Badge key={code} bg="primary" className="me-2">
                      {fc?.name}
                    </Badge>
                  );
                })}
              </div>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </>
  );

  // Step 2: 폼 코드별 필드 관리
  const renderStep2 = () => (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">2단계: 필드 구성</h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info" className="mb-3">
          <strong>안내:</strong>
          <ul className="mb-0 mt-1">
            <li>각 폼 코드의 필수 필드는 자동으로 포함됩니다.</li>
            <li>"옵션 추가" 버튼을 클릭하여 추가 필드를 선택할 수 있습니다.</li>
            <li>옵션 필드는 각 폼 코드별로 독립적으로 관리됩니다.</li>
          </ul>
        </Alert>

        {selectedFormCodes.length === 0 ? (
          <Alert variant="warning">
            1단계에서 폼 코드를 선택하세요.
          </Alert>
        ) : (
          <Accordion defaultActiveKey="0">
            {selectedFormCodes.map((code, index) => {
              const formCode = getFormCodeByCode(code);
              const codeFields = formCodeFieldsMap.get(code);
              if (!formCode) return null;

              return (
                <Accordion.Item key={code} eventKey={String(index)}>
                  <Accordion.Header>
                    <strong>{formCode.name}</strong>
                    <Badge bg="secondary" className="ms-2">
                      필수 {formCode.requiredFields.length}개
                    </Badge>
                    <Badge bg="info" className="ms-1">
                      옵션 {codeFields?.optionalFields.length || 0}개
                    </Badge>
                  </Accordion.Header>
                  <Accordion.Body>
                    {/* 필수 필드 */}
                    <h6 className="mb-2">필수 필드 (자동 포함)</h6>
                    <ListGroup className="mb-3">
                      {formCode.requiredFields.map(field => (
                        <ListGroup.Item key={field.id}>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <strong>{field.label}</strong>
                              <Badge bg="secondary" className="ms-2">{field.type}</Badge>
                              <Badge bg="danger" className="ms-1">필수</Badge>
                              <div className="text-muted small">ID: {field.id}</div>
                              {field.helperText && (
                                <div className="text-muted small">{field.helperText}</div>
                              )}
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>

                    {/* 옵션 필드 */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">옵션 필드</h6>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleOpenOptionalFieldModal(code)}
                      >
                        + 옵션 추가
                      </Button>
                    </div>

                    {codeFields?.optionalFields.length === 0 ? (
                      <Alert variant="secondary">
                        추가된 옵션 필드가 없습니다.
                      </Alert>
                    ) : (
                      <ListGroup>
                        {codeFields?.optionalFields.map(field => (
                          <ListGroup.Item key={field.id}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{field.label}</strong>
                                <Badge bg="secondary" className="ms-2">{field.type}</Badge>
                                <Badge bg="info" className="ms-1">옵션</Badge>
                                <div className="text-muted small">ID: {field.id}</div>
                              </div>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveOptionalField(code, field.id)}
                              >
                                삭제
                              </Button>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              );
            })}
          </Accordion>
        )}
      </Card.Body>
    </Card>
  );

  // Step 3: 승인 플로우 설정
  const renderStep3 = () => (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">3단계: 승인 플로우 설정 (선택사항)</h5>
      </Card.Header>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <p className="mb-1">폼 제출 시 승인 플로우를 설정할 수 있습니다.</p>
            <small className="text-muted">승인 플로우를 설정하지 않으면 즉시 처리됩니다.</small>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setShowApprovalModal(true)}
          >
            {approvalFlow ? "승인자 수정" : "승인자 설정"}
          </Button>
        </div>

        {approvalFlow && approvalFlow.approvers.length > 0 ? (
          <Alert variant="success">
            <strong>승인자 {approvalFlow.approvers.length}명 설정됨</strong>
            <div className="mt-2">
              {approvalFlow.approvers.map((approver, index) => (
                <div key={approver.employee.id}>
                  {index + 1}. {approver.employee.name} ({approver.employee.email})
                  {approver.isMandatory && <span className="text-danger"> *필수</span>}
                </div>
              ))}
            </div>
            <div className="mt-2 small text-muted">
              모든 승인 필요: {approvalFlow.requireAll ? "예" : "아니오"} |
              병렬 승인: {approvalFlow.allowParallel ? "예" : "아니오"}
            </div>
          </Alert>
        ) : (
          <Alert variant="info">
            승인 플로우가 설정되지 않았습니다.
          </Alert>
        )}
      </Card.Body>
    </Card>
  );

  // Step 4: 미리보기
  const renderStep4 = () => {
    const formConfig = buildFinalFormConfig();
    const apiConfigs = mergeApiConfigs(selectedFormCodes);

    return (
      <>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">4단계: 미리보기 및 저장</h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="info">
              아래에서 폼의 최종 모습을 확인하세요. 문제가 없으면 "폼 저장" 버튼을 클릭하여 저장합니다.
            </Alert>

            <h6>API 설정 (자동 구성)</h6>
            {apiConfigs.length === 0 ? (
              <Alert variant="warning">선택된 폼 코드에 API 설정이 없습니다.</Alert>
            ) : (
              <ListGroup className="mb-3">
                {apiConfigs.map((api, index) => (
                  <ListGroup.Item key={index}>
                    <div>
                      <strong className="text-primary">{api.url}</strong>
                      <Badge bg="secondary" className="ms-2">{api.method || "POST"}</Badge>
                      <div className="text-muted small mt-1">
                        전송 필드: {api.fields.join(", ")}
                      </div>
                      {api.fieldMapping && Object.keys(api.fieldMapping).length > 0 && (
                        <div className="text-muted small mt-1">
                          필드 매핑: {Object.entries(api.fieldMapping).map(([key, value]) => `${key} → ${value}`).join(", ")}
                        </div>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}

            <h6>폼 미리보기</h6>
            <div className="border rounded p-3 bg-light">
              <DynamicForm
                config={formConfig}
                onSuccess={() => {}}
                onError={() => {}}
                readOnly={false}
              />
            </div>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>
            <h6 className="mb-0">폼 설정 (JSON)</h6>
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
              {JSON.stringify(formConfig, null, 2)}
            </pre>
          </Card.Body>
        </Card>
      </>
    );
  };

  // 다음 단계로
  const handleNext = () => {
    if (currentStep === 1) {
      if (!formTitle) {
        alert("폼 제목을 입력하세요.");
        return;
      }
      if (selectedFormCodes.length === 0) {
        alert("최소 1개의 폼 코드를 선택하세요.");
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  // 이전 단계로
  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">폼 빌더</h1>

      {saveMessage && <Alert variant="success">{saveMessage}</Alert>}

      {/* 단계 표시 */}
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`text-center ${currentStep === step ? "text-primary fw-bold" : currentStep > step ? "text-success" : "text-muted"}`}
                style={{ flex: 1 }}
              >
                <div
                  className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-2`}
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: currentStep === step ? "#0d6efd" : currentStep > step ? "#198754" : "#e9ecef",
                    color: currentStep >= step ? "white" : "#6c757d",
                  }}
                >
                  {step}
                </div>
                <div className="small">
                  {step === 1 && "기본정보"}
                  {step === 2 && "필드구성"}
                  {step === 3 && "승인플로우"}
                  {step === 4 && "미리보기"}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* 단계별 내용 */}
      {renderStepContent()}

      {/* 네비게이션 버튼 */}
      <div className="d-flex justify-content-between mb-4">
        <Button
          variant="secondary"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          이전
        </Button>

        {currentStep < 4 ? (
          <Button variant="primary" onClick={handleNext}>
            다음
          </Button>
        ) : (
          <Button
            variant="success"
            size="lg"
            onClick={handleSaveForm}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : "폼 저장"}
          </Button>
        )}
      </div>

      {/* 옵션 필드 추가 모달 */}
      <Modal
        show={showOptionalFieldModal}
        onHide={() => setShowOptionalFieldModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>옵션 필드 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentFormCodeForOptional && (() => {
            const formCode = getFormCodeByCode(currentFormCodeForOptional);
            if (!formCode || !formCode.optionalFieldIds) return null;

            const codeFields = formCodeFieldsMap.get(currentFormCodeForOptional);
            const existingIds = new Set([
              ...formCode.requiredFields.map(f => f.id),
              ...(codeFields?.optionalFields.map(f => f.id) || []),
            ]);

            const availableFields = STANDARD_FIELDS.filter(
              field => formCode.optionalFieldIds?.includes(field.id) && !existingIds.has(field.id)
            );

            if (availableFields.length === 0) {
              return <Alert variant="info">추가 가능한 옵션 필드가 없습니다.</Alert>;
            }

            return (
              <>
                <p className="text-muted">추가할 필드를 선택하세요. (여러 개 선택 가능)</p>
                {FIELD_CATEGORIES.map(category => {
                  const categoryFields = availableFields.filter(f => f.category === category.value);
                  if (categoryFields.length === 0) return null;

                  return (
                    <div key={category.value} className="mb-3">
                      <h6>{category.label}</h6>
                      {categoryFields.map(field => (
                        <Form.Check
                          key={field.id}
                          type="checkbox"
                          id={`optional-${field.id}`}
                          label={
                            <div>
                              <strong>{field.label}</strong> ({field.id})
                              <div className="text-muted small">{field.description}</div>
                              <div className="text-muted small">
                                권장 타입: {field.suggestedTypes.join(", ")}
                              </div>
                            </div>
                          }
                          checked={selectedOptionalFieldIds.includes(field.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOptionalFieldIds(prev => [...prev, field.id]);
                            } else {
                              setSelectedOptionalFieldIds(prev => prev.filter(id => id !== field.id));
                            }
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOptionalFieldModal(false)}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveOptionalFields}
            disabled={selectedOptionalFieldIds.length === 0}
          >
            추가 ({selectedOptionalFieldIds.length}개)
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 승인 플로우 모달 */}
      <ApprovalFlowModal
        show={showApprovalModal}
        onHide={() => setShowApprovalModal(false)}
        onSave={(flow) => {
          setApprovalFlow(flow);
          setShowApprovalModal(false);
        }}
        initialFlow={approvalFlow || undefined}
        apiUrl="/api/employees/list"
      />
    </div>
  );
};

export default FormBuilder;
