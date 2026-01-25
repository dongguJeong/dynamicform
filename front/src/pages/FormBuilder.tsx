import React, { useState, useEffect } from "react";
import { Button, Form, Card, ListGroup, Modal, Alert } from "react-bootstrap";
import axios from "axios";
import { FormField, SelectOption, FieldType, ApprovalFlow } from "../types/type";
import { FORM_CODES, mergeRequiredFields } from "../config/formCodes";
import { STANDARD_FIELDS, FIELD_CATEGORIES, getStandardFieldById } from "../config/standardFields";
import { ApprovalFlowModal } from "../component/ApprovalFlowModal";

const FormBuilder: React.FC = () => {
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formApi, setFormApi] = useState("/api/custom-form");
  const [formCodes, setFormCodes] = useState<string[]>([]); // 선택된 폼 코드들
  const [fields, setFields] = useState<FormField[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null,
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [approvalFlow, setApprovalFlow] = useState<ApprovalFlow | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // 새 필드 초기값
  const [newField, setNewField] = useState<FormField>({
    id: "",
    type: "text",
    label: "",
    required: false,
    helperText: "",
    options: {},
  });

  // 필드 타입 템플릿
  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: "text", label: "텍스트" },
    { value: "textarea", label: "텍스트 영역" },
    { value: "email", label: "이메일" },
    { value: "number", label: "숫자" },
    { value: "password", label: "비밀번호" },
    { value: "date", label: "날짜" },
    { value: "daterange", label: "날짜 범위" },
    { value: "select", label: "선택 (드롭다운)" },
    { value: "dropdown", label: "드롭다운 버튼" },
    { value: "radio", label: "라디오 버튼" },
    { value: "checkbox", label: "체크박스" },
    { value: "modalselect", label: "모달 선택" },
    { value: "apiselect", label: "API 선택 (동적)" },
  ];

  // 폼 코드 변경 시 필수 필드 자동 추가/제거
  useEffect(() => {
    if (formCodes.length === 0) {
      // 폼 코드가 하나도 선택되지 않은 경우, 모든 필드에서 필수 필드만 제거
      // 이전에 선택했던 폼 코드의 필수 필드 ID를 추적해야 함
      setFields(prevFields => {
        // 모든 폼 코드의 필수 필드 ID 수집
        const allRequiredFieldIds = new Set<string>();
        FORM_CODES.forEach(formCode => {
          formCode.requiredFields.forEach(field => {
            allRequiredFieldIds.add(field.id);
          });
        });

        // 필수 필드가 아닌 커스텀 필드만 유지
        return prevFields.filter(f => !allRequiredFieldIds.has(f.id));
      });
      return;
    }

    const requiredFields = mergeRequiredFields(formCodes);

    setFields(prevFields => {
      // 모든 폼 코드의 필수 필드 ID 수집 (선택되지 않은 것도 포함)
      const allRequiredFieldIds = new Set<string>();
      FORM_CODES.forEach(formCode => {
        formCode.requiredFields.forEach(field => {
          allRequiredFieldIds.add(field.id);
        });
      });

      // 기존 필드에서 필수 필드가 아닌 것들만 유지 (커스텀 필드만)
      const customFields = prevFields.filter(f => !allRequiredFieldIds.has(f.id));

      // 현재 선택된 폼 코드의 필수 필드 + 커스텀 필드 병합
      return [...requiredFields, ...customFields];
    });
  }, [formCodes]);

  // 폼 코드 토글
  const handleToggleFormCode = (code: string) => {
    setFormCodes(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  // 필드가 필수 필드인지 확인 (폼 코드에서 온 필드)
  const isRequiredField = (fieldId: string): boolean => {
    const allRequiredFieldIds = new Set<string>();
    FORM_CODES.forEach(formCode => {
      formCode.requiredFields.forEach(field => {
        allRequiredFieldIds.add(field.id);
      });
    });
    return allRequiredFieldIds.has(fieldId);
  };

  // 선택된 폼 코드에 따라 추가 가능한 필드 ID 목록 가져오기
  const getAvailableFieldIds = (): string[] => {
    if (formCodes.length === 0) {
      return []; // 폼 코드가 선택되지 않았으면 추가 불가
    }

    // 모든 선택된 폼 코드의 optionalFieldIds 합치기
    const availableIds = new Set<string>();
    formCodes.forEach(code => {
      const formCode = FORM_CODES.find(fc => fc.code === code);
      if (formCode?.optionalFieldIds) {
        formCode.optionalFieldIds.forEach(id => availableIds.add(id));
      }
    });

    // 이미 추가된 필드 ID 제외
    const existingFieldIds = new Set(fields.map(f => f.id));
    return Array.from(availableIds).filter(id => !existingFieldIds.has(id));
  };

  // 필드 추가/수정 모달 열기
  const handleOpenFieldModal = (index: number | null = null) => {
    if (index !== null) {
      setEditingFieldIndex(index);
      setNewField({ ...fields[index] });
    } else {
      setEditingFieldIndex(null);
      setNewField({
        id: "",
        type: "text",
        label: "",
        required: false,
        helperText: "",
        options: {},
      });
    }
    setShowFieldModal(true);
  };

  // 필드 ID 변경 핸들러
  const handleFieldIdChange = (selectedId: string) => {
    const standardField = getStandardFieldById(selectedId);

    if (standardField) {
      // 표준 필드를 선택한 경우, 라벨과 권장 타입 자동 설정
      setNewField({
        ...newField,
        id: selectedId,
        label: standardField.label,
        type: standardField.suggestedTypes[0] || "text",
      });
    } else {
      setNewField({
        ...newField,
        id: selectedId,
      });
    }
  };

  // 필드 저장
  const handleSaveField = () => {
    if (!newField.id || !newField.label) {
      alert("필드 ID와 라벨은 필수입니다.");
      return;
    }

    // 중복 ID 체크 (수정 시 자기 자신 제외)
    const isDuplicate = fields.some((field, idx) =>
      field.id === newField.id && idx !== editingFieldIndex
    );

    if (isDuplicate) {
      alert("이미 사용 중인 필드 ID입니다. 다른 ID를 선택해주세요.");
      return;
    }

    if (editingFieldIndex !== null) {
      // 수정
      const updatedFields = [...fields];
      updatedFields[editingFieldIndex] = newField;
      setFields(updatedFields);
    } else {
      // 추가
      setFields([...fields, newField]);
    }
    setShowFieldModal(false);
  };

  // 필드 삭제
  const handleDeleteField = (index: number) => {
    const field = fields[index];

    // 필수 필드는 삭제 불가
    if (isRequiredField(field.id)) {
      alert("이 필드는 선택된 폼 코드의 필수 필드이므로 삭제할 수 없습니다. 폼 코드 선택을 해제하세요.");
      return;
    }

    setFields(fields.filter((_, i) => i !== index));
  };

  // 드래그 앤 드롭
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFields = [...fields];
    const draggedField = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedField);

    setFields(newFields);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // 옵션 추가 (select, radio, checkbox 등)
  const handleAddOption = () => {
    const currentOptions = newField.options?.selectOption || [];
    const newOption: SelectOption = {
      label: `옵션 ${currentOptions.length + 1}`,
      value: `option${currentOptions.length + 1}`,
    };
    setNewField({
      ...newField,
      options: {
        ...newField.options,
        selectOption: [...currentOptions, newOption],
      },
    });
  };

  const handleUpdateOption = (
    index: number,
    field: "label" | "value",
    value: string,
  ) => {
    const currentOptions = newField.options?.selectOption || [];
    const updatedOptions = [...currentOptions];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setNewField({
      ...newField,
      options: {
        ...newField.options,
        selectOption: updatedOptions,
      },
    });
  };

  const handleDeleteOption = (index: number) => {
    const currentOptions = newField.options?.selectOption || [];
    setNewField({
      ...newField,
      options: {
        ...newField.options,
        selectOption: currentOptions.filter((_, i) => i !== index),
      },
    });
  };

  // 폼 저장 (서버에 전송)
  const handleSaveForm = async () => {
    if (!formTitle) {
      alert("폼 제목을 입력하세요.");
      return;
    }

    const formConfig = {
      title: formTitle,
      description: formDescription,
      api: formApi,
      formCodes: formCodes, // 선택된 폼 코드들
      content: fields,
      approvalFlow: approvalFlow, // 승인 플로우 추가
    };

    try {
      const response = await axios.post("/api/forms/save", {
        name: formTitle,
        config: JSON.stringify(formConfig, null, 2),
      });
      setSaveMessage(`폼이 저장되었습니다! ID: ${response.data.data.formId}`);
      setTimeout(() => setSaveMessage(""), 5000);
    } catch (error) {
      console.error("Form save error:", error);
      alert("폼 저장에 실패했습니다.");
    }
  };

  // 옵션이 필요한 필드 타입인지 확인
  const needsOptions = (type: FieldType): boolean => {
    return ["select", "dropdown", "radio", "checkbox", "modalselect"].includes(
      type,
    );
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">폼 빌더</h1>

      {saveMessage && <Alert variant="success">{saveMessage}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <h5>폼 기본 정보</h5>
          <Form.Group className="mb-3">
            <Form.Label>폼 제목</Form.Label>
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

          <Form.Group className="mb-3">
            <Form.Label>API 엔드포인트</Form.Label>
            <Form.Control
              type="text"
              value={formApi}
              onChange={(e) => setFormApi(e.target.value)}
              placeholder="/api/custom-form"
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>승인 플로우 설정</h5>
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
              승인 플로우가 설정되지 않았습니다. "승인자 설정" 버튼을 클릭하여 승인자를 지정할 수 있습니다.
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">폼 코드 선택</h5>
          <p className="text-muted small">
            폼 코드를 선택하면 해당 코드에 필요한 필수 필드가 자동으로 추가됩니다.
            여러 개를 선택할 수 있습니다.
          </p>

          {FORM_CODES.map((formCode) => (
            <div key={formCode.code} className="mb-2">
              <Form.Check
                type="checkbox"
                id={`formCode-${formCode.code}`}
                checked={formCodes.includes(formCode.code)}
                onChange={() => handleToggleFormCode(formCode.code)}
                label={
                  <div>
                    <strong>{formCode.name}</strong>
                    {formCode.description && (
                      <div className="text-muted small">
                        {formCode.description}
                      </div>
                    )}
                    <div className="text-muted small">
                      필수 필드: {formCode.requiredFields.map(f => f.label).join(", ")}
                    </div>
                  </div>
                }
              />
            </div>
          ))}

          {formCodes.length > 0 && (
            <Alert variant="info" className="mt-3">
              선택된 폼 코드: {formCodes.map(code =>
                FORM_CODES.find(fc => fc.code === code)?.name
              ).join(", ")}
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>필드 목록</h5>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (formCodes.length === 0) {
                  alert("필드를 추가하려면 먼저 폼 코드를 선택하세요.");
                  return;
                }
                handleOpenFieldModal();
              }}
            >
              + 필드 추가
            </Button>
          </div>

          <Alert variant="info" className="mb-3">
            <small>
              <strong>필드 추가 안내:</strong>
              <ul className="mb-0 mt-1">
                <li>폼 코드를 먼저 선택하면 해당 코드의 필수 필드가 자동으로 추가됩니다.</li>
                <li>필수 필드 외에 추가할 수 있는 선택적 필드는 폼 코드마다 정해져 있습니다.</li>
                <li>폼 코드에서 자동으로 추가된 필수 필드는 수정 및 삭제가 불가능합니다.</li>
                <li>필드를 드래그하여 순서를 변경할 수 있습니다.</li>
              </ul>
            </small>
          </Alert>

          {fields.length === 0 ? (
            <p className="text-muted">
              필드를 추가하여 폼을 구성하세요. 드래그하여 순서를 변경할 수
              있습니다.
            </p>
          ) : (
            <ListGroup>
              {fields.map((field, index) => (
                <ListGroup.Item
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{ cursor: "move" }}
                  className={draggedIndex === index ? "bg-light" : ""}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{field.label}</strong>
                      <span className="badge bg-secondary ms-2">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="badge bg-danger ms-1">필수</span>
                      )}
                      {isRequiredField(field.id) && (
                        <span className="badge bg-warning text-dark ms-1">
                          <i className="bi bi-lock-fill"></i> 폼 코드 필수 필드
                        </span>
                      )}
                      <div className="text-muted small">ID: {field.id}</div>
                    </div>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => handleOpenFieldModal(index)}
                      >
                        {isRequiredField(field.id) ? "보기" : "수정"}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteField(index)}
                        disabled={isRequiredField(field.id)}
                        title={isRequiredField(field.id) ? "폼 코드의 필수 필드는 삭제할 수 없습니다" : ""}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>

      <div className="mb-4">
        <Button variant="success" size="lg" onClick={handleSaveForm}>
          폼 저장
        </Button>
      </div>

      {/* 필드 추가/수정 모달 */}
      <Modal
        show={showFieldModal}
        onHide={() => setShowFieldModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingFieldIndex !== null ? "필드 수정" : "필드 추가"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingFieldIndex !== null && isRequiredField(newField.id) && (
            <Alert variant="warning" className="mb-3">
              <i className="bi bi-info-circle-fill"></i> 이 필드는 선택된 폼 코드의 필수 필드입니다.
              필드 ID, 타입, 라벨, 필수 여부는 변경할 수 없으며, 옵션과 도움말만 수정 가능합니다.
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label>필드 ID</Form.Label>
            {editingFieldIndex !== null && isRequiredField(newField.id) ? (
              <>
                <Form.Control
                  type="text"
                  value={newField.id}
                  disabled
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  <i className="bi bi-lock-fill"></i> 이 필드는 폼 코드의 필수 필드로, ID를 변경할 수 없습니다.
                </Form.Text>
              </>
            ) : editingFieldIndex === null ? (
              <>
                <Form.Select
                  value={newField.id}
                  onChange={(e) => handleFieldIdChange(e.target.value)}
                >
                  <option value="">필드 ID를 선택하세요</option>
                  {FIELD_CATEGORIES.map((category) => {
                    const availableFieldIds = getAvailableFieldIds();
                    const categoryFields = STANDARD_FIELDS.filter(
                      (f) => f.category === category.value && availableFieldIds.includes(f.id)
                    );

                    if (categoryFields.length === 0) return null;

                    return (
                      <optgroup key={category.value} label={category.label}>
                        {categoryFields.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.id} - {field.label}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </Form.Select>
                <Form.Text className="text-muted">
                  선택된 폼 코드에서 추가 가능한 필드만 표시됩니다.
                  {newField.id && getStandardFieldById(newField.id) && (
                    <div className="mt-1 text-info">
                      <small>
                        💡 {getStandardFieldById(newField.id)?.description}
                      </small>
                    </div>
                  )}
                </Form.Text>
              </>
            ) : (
              <>
                <Form.Control
                  type="text"
                  value={newField.id}
                  disabled
                  className="bg-light"
                />
                <Form.Text className="text-muted">
                  필드 수정 시에는 ID를 변경할 수 없습니다.
                </Form.Text>
              </>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>필드 타입</Form.Label>
            <Form.Select
              value={newField.type}
              onChange={(e) =>
                setNewField({ ...newField, type: e.target.value as FieldType })
              }
              disabled={editingFieldIndex !== null && isRequiredField(newField.id)}
            >
              {fieldTypes.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </Form.Select>
            {newField.id && getStandardFieldById(newField.id) && (
              <Form.Text className="text-muted">
                권장 타입: {getStandardFieldById(newField.id)?.suggestedTypes.join(", ")}
              </Form.Text>
            )}
            {editingFieldIndex !== null && isRequiredField(newField.id) && (
              <Form.Text className="text-muted d-block">
                <i className="bi bi-lock-fill"></i> 필수 필드는 타입을 변경할 수 없습니다.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>라벨</Form.Label>
            <Form.Control
              type="text"
              value={newField.label}
              onChange={(e) =>
                setNewField({ ...newField, label: e.target.value })
              }
              placeholder="예: 사용자 이름"
              disabled={editingFieldIndex !== null && isRequiredField(newField.id)}
            />
            {editingFieldIndex !== null && isRequiredField(newField.id) && (
              <Form.Text className="text-muted">
                <i className="bi bi-lock-fill"></i> 필수 필드는 라벨을 변경할 수 없습니다.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="필수 입력"
              checked={newField.required}
              onChange={(e) =>
                setNewField({ ...newField, required: e.target.checked })
              }
              disabled={editingFieldIndex !== null && isRequiredField(newField.id)}
            />
            {editingFieldIndex !== null && isRequiredField(newField.id) && (
              <Form.Text className="text-muted">
                <i className="bi bi-lock-fill"></i> 필수 필드의 필수 입력 여부를 변경할 수 없습니다.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>도움말 텍스트</Form.Label>
            <Form.Control
              type="text"
              value={newField.helperText || ""}
              onChange={(e) =>
                setNewField({ ...newField, helperText: e.target.value })
              }
              placeholder="예: 2-20자 사이로 입력하세요"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>플레이스홀더</Form.Label>
            <Form.Control
              type="text"
              value={newField.options?.placeholder || ""}
              onChange={(e) =>
                setNewField({
                  ...newField,
                  options: { ...newField.options, placeholder: e.target.value },
                })
              }
              placeholder="예: 이름을 입력하세요"
            />
          </Form.Group>

          {/* select, radio, checkbox 등의 옵션 설정 */}
          {needsOptions(newField.type) && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label>옵션 목록</Form.Label>
                <Button variant="outline-primary" size="sm" onClick={handleAddOption}>
                  + 옵션 추가
                </Button>
              </div>
              {newField.options?.selectOption?.map((option, idx) => (
                <div key={idx} className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    value={option.label}
                    onChange={(e) =>
                      handleUpdateOption(idx, "label", e.target.value)
                    }
                    placeholder="라벨"
                  />
                  <Form.Control
                    type="text"
                    value={String(option.value)}
                    onChange={(e) =>
                      handleUpdateOption(idx, "value", e.target.value)
                    }
                    placeholder="값"
                  />
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteOption(idx)}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* daterange 옵션 */}
          {newField.type === "daterange" && (
            <div className="mb-3">
              <Form.Label>날짜 범위 옵션</Form.Label>
              <Form.Check
                type="checkbox"
                label="전체 체크박스 표시"
                checked={newField.options?.showAllCheckbox || false}
                onChange={(e) =>
                  setNewField({
                    ...newField,
                    options: {
                      ...newField.options,
                      showAllCheckbox: e.target.checked,
                    },
                  })
                }
              />
              <div className="mt-2">
                <Form.Label>기간 버튼</Form.Label>
                <Form.Check
                  type="checkbox"
                  label="3개월"
                  checked={
                    newField.options?.periodOptions?.includes("3months") || false
                  }
                  onChange={(e) => {
                    const current = newField.options?.periodOptions || [];
                    const updated = e.target.checked
                      ? ([...current, "3months"] as ("3months" | "6months" | "12months")[])
                      : current.filter((p) => p !== "3months");
                    setNewField({
                      ...newField,
                      options: { ...newField.options, periodOptions: updated },
                    });
                  }}
                />
                <Form.Check
                  type="checkbox"
                  label="6개월"
                  checked={
                    newField.options?.periodOptions?.includes("6months") || false
                  }
                  onChange={(e) => {
                    const current = newField.options?.periodOptions || [];
                    const updated = e.target.checked
                      ? ([...current, "6months"] as ("3months" | "6months" | "12months")[])
                      : current.filter((p) => p !== "6months");
                    setNewField({
                      ...newField,
                      options: { ...newField.options, periodOptions: updated },
                    });
                  }}
                />
                <Form.Check
                  type="checkbox"
                  label="12개월"
                  checked={
                    newField.options?.periodOptions?.includes("12months") ||
                    false
                  }
                  onChange={(e) => {
                    const current = newField.options?.periodOptions || [];
                    const updated = e.target.checked
                      ? ([...current, "12months"] as ("3months" | "6months" | "12months")[])
                      : current.filter((p) => p !== "12months");
                    setNewField({
                      ...newField,
                      options: { ...newField.options, periodOptions: updated },
                    });
                  }}
                />
              </div>
            </div>
          )}

          {/* apiselect 옵션 */}
          {newField.type === "apiselect" && (
            <div className="mb-3">
              <Form.Label>API 설정</Form.Label>
              <Form.Group className="mb-2">
                <Form.Label>API URL</Form.Label>
                <Form.Control
                  type="text"
                  value={newField.options?.apiUrl || ""}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      options: { ...newField.options, apiUrl: e.target.value },
                    })
                  }
                  placeholder="/api/accounts/list"
                />
                <Form.Text className="text-muted">
                  옵션을 가져올 API 엔드포인트
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Label 키</Form.Label>
                <Form.Control
                  type="text"
                  value={newField.options?.apiLabelKey || ""}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      options: { ...newField.options, apiLabelKey: e.target.value },
                    })
                  }
                  placeholder="label (기본값)"
                />
                <Form.Text className="text-muted">
                  응답 데이터에서 라벨로 사용할 속성명
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Value 키</Form.Label>
                <Form.Control
                  type="text"
                  value={newField.options?.apiValueKey || ""}
                  onChange={(e) =>
                    setNewField({
                      ...newField,
                      options: { ...newField.options, apiValueKey: e.target.value },
                    })
                  }
                  placeholder="value (기본값)"
                />
                <Form.Text className="text-muted">
                  응답 데이터에서 값으로 사용할 속성명
                </Form.Text>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowFieldModal(false)}>
            취소
          </Button>
          <Button variant="primary" onClick={handleSaveField}>
            저장
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
