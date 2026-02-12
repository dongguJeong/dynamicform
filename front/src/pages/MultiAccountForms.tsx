import React, { useState } from "react";
import { Container, Card, Form, Button, Table, Badge, Row, Col } from "react-bootstrap";
import { BULK_FORM_CONFIGS, BulkFormConfigItem } from "../config/bulkFormConfigs";
import DynamicFormModal from "../component/DynamicFormModal";
import { FormData as FormDataType, FormField, DateRangeValue, ServerGroupChangeValue, AccountCreateValue } from "../types/type";
import axios from "axios";

interface FormSubmissionItem {
  id: string;
  data: FormDataType;
  timestamp: string;
}

interface TableData {
  [formConfigKey: string]: FormSubmissionItem[];
}

interface FormConfigSelection {
  enabled: boolean;
  useUniscope: boolean;
  optionFieldIds: string[];
}

const MultiAccountForms: React.FC = () => {
  const [formSelections, setFormSelections] = useState<Map<string, FormConfigSelection>>(new Map());
  const [tableData, setTableData] = useState<TableData>({});
  const [showModal, setShowModal] = useState(false);
  const [currentFormConfig, setCurrentFormConfig] = useState<BulkFormConfigItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FormConfig 선택/해제
  const handleToggleFormConfig = (key: string) => {
    setFormSelections((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(key)) {
        newMap.delete(key);
      } else {
        newMap.set(key, {
          enabled: true,
          useUniscope: false,
          optionFieldIds: [],
        });
      }
      return newMap;
    });
  };

  // Uniscope 옵션 변경
  const handleUniscopeChange = (key: string, useUniscope: boolean) => {
    setFormSelections((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(key);
      if (current) {
        newMap.set(key, { ...current, useUniscope });
      }
      return newMap;
    });
  };

  // Option Field 토글
  const handleToggleOptionField = (key: string, fieldId: string) => {
    setFormSelections((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(key);
      if (current) {
        const optionFieldIds = current.optionFieldIds.includes(fieldId)
          ? current.optionFieldIds.filter((id) => id !== fieldId)
          : [...current.optionFieldIds, fieldId];
        newMap.set(key, { ...current, optionFieldIds });
      }
      return newMap;
    });
  };

  // 모달 열기
  const handleOpenModal = (formConfigItem: BulkFormConfigItem) => {
    setCurrentFormConfig(formConfigItem);
    setShowModal(true);
  };

  // 모달에서 폼 제출 시 (테이블에 추가)
  const handleModalSubmit = (data: FormDataType) => {
    if (!currentFormConfig) return;

    const newItem: FormSubmissionItem = {
      id: Date.now().toString(),
      data,
      timestamp: new Date().toISOString(),
    };

    setTableData((prev) => ({
      ...prev,
      [currentFormConfig.key]: [...(prev[currentFormConfig.key] || []), newItem],
    }));
  };

  // 테이블에서 항목 삭제
  const handleDeleteItem = (formKey: string, itemId: string) => {
    setTableData((prev) => ({
      ...prev,
      [formKey]: (prev[formKey] || []).filter((item) => item.id !== itemId),
    }));
  };

  // 헬퍼 함수: 중첩 객체를 평탄화
  const flattenObject = (obj: any, prefix = ""): string[] => {
    const result: string[] = [];

    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];

      if (val && typeof val === "object" && !Array.isArray(val)) {
        // 중첩 객체는 재귀적으로 처리
        result.push(...flattenObject(val, newKey));
      } else if (Array.isArray(val)) {
        // 배열은 개수만 표시
        result.push(`${newKey}: [${val.length}개]`);
      } else {
        // 기본 값
        result.push(`${newKey}: ${val}`);
      }
    }

    return result;
  };

  // 필드 값 포맷팅
  const formatFieldValue = (field: FormField, value: any): string => {
    if (value === undefined || value === null || value === "") {
      return "-";
    }

    switch (field.type) {
      case "daterange":
        const dateRange = value as DateRangeValue;
        return `${dateRange.startDate || ""} ~ ${dateRange.endDate || ""}`;

      case "checkbox":
        if (Array.isArray(value)) {
          return value.map(v => {
            const option = field.options?.selectOption?.find(opt => opt.value === v);
            return option?.label || v;
          }).join(", ");
        }
        return String(value);

      case "select":
      case "dropdown":
      case "radio":
      case "apiselect":
        const option = field.options?.selectOption?.find(opt => opt.value === value);
        return option?.label || String(value);

      case "servergroupchange":
        const sgChange = value as ServerGroupChangeValue;
        if (sgChange.changes && sgChange.changes.length > 0) {
          return `${sgChange.changes.length}건의 변경`;
        }
        return "-";

      case "accountcreate":
        const acCreate = value as AccountCreateValue;
        if (acCreate.accounts && acCreate.accounts.length > 0) {
          return `${acCreate.accounts.length}개 계정`;
        }
        return "-";

      case "textarea":
        const textValue = String(value);
        return textValue.length > 50 ? textValue.substring(0, 50) + "..." : textValue;

      default:
        // 중첩 객체인 경우 재귀적으로 평탄화
        if (typeof value === "object" && !Array.isArray(value)) {
          const flattened = flattenObject(value);
          const text = flattened.join(", ");
          return text.length > 50 ? text.substring(0, 50) + "..." : text;
        }
        return String(value);
    }
  };

  // 전체 제출
  const handleBulkSubmit = async () => {
    // 데이터가 있는지 확인
    const hasData = Object.keys(tableData).some(
      (key) => tableData[key] && tableData[key].length > 0
    );

    if (!hasData) {
      alert("제출할 데이터가 없습니다.");
      return;
    }

    // 제출 데이터 구조화
    const submissionData = Object.entries(tableData)
      .filter(([key, items]) => items && items.length > 0)
      .map(([key, items]) => {
        const formConfigItem = BULK_FORM_CONFIGS.find((fc) => fc.key === key);
        const selection = formSelections.get(key);
        return {
          formKey: key,
          formName: formConfigItem?.name || key,
          useUniscope: selection?.useUniscope || false,
          optionFieldIds: selection?.optionFieldIds || [],
          submissions: items.map((item) => item.data),
        };
      });

    console.log("📤 일괄 제출 데이터:", submissionData);

    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/forms/bulk-submissions", {
        submissions: submissionData,
        submittedAt: new Date().toISOString(),
      });

      console.log("📥 제출 성공:", response.data);
      alert(`총 ${submissionData.reduce((acc, cur) => acc + cur.submissions.length, 0)}건의 신청이 제출되었습니다.`);

      // 모든 테이블 초기화
      setTableData({});
      setFormSelections(new Map());
    } catch (error) {
      console.error("제출 오류:", error);
      alert("제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 선택된 FormConfig들
  const selectedFormConfigs = BULK_FORM_CONFIGS.filter((fc) =>
    formSelections.has(fc.key)
  );

  // 총 항목 수
  const totalItems = Object.values(tableData).reduce(
    (acc, items) => acc + (items?.length || 0),
    0
  );

  return (
    <Container className="mt-4">
      <h1 className="mb-4">다중 계정 폼 신청</h1>

      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">신청 양식 선택</h5>
          <p className="text-muted">
            신청하실 양식을 선택하세요. 선택한 양식마다 여러 건의 신청을 추가할 수 있습니다.
          </p>

          <div className="d-flex flex-column gap-3">
            {BULK_FORM_CONFIGS.map((formConfigItem) => {
              const selection = formSelections.get(formConfigItem.key);
              const isSelected = !!selection;
              const availableFields = formConfigItem.config.content;

              return (
                <Card key={formConfigItem.key} className={isSelected ? "border-primary" : ""}>
                  <Card.Body>
                    <Row>
                      <Col md={12} className="mb-3">
                        <Form.Check
                          type="checkbox"
                          id={`form-${formConfigItem.key}`}
                          label={<strong>{formConfigItem.name}</strong>}
                          checked={isSelected}
                          onChange={() => handleToggleFormConfig(formConfigItem.key)}
                        />
                      </Col>

                      {isSelected && (
                        <>
                          <Col md={12} className="mb-3">
                            <Form.Check
                              type="checkbox"
                              id={`uniscope-${formConfigItem.key}`}
                              label="Uniscope 사용"
                              checked={selection.useUniscope}
                              onChange={(e) =>
                                handleUniscopeChange(formConfigItem.key, e.target.checked)
                              }
                            />
                          </Col>

                          <Col md={12}>
                            <Form.Group>
                              <Form.Label className="mb-2 small text-muted">
                                옵션 필드 선택 (optionFieldIds)
                              </Form.Label>
                              <div className="border rounded p-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                                {availableFields.length === 0 ? (
                                  <div className="text-muted small">사용 가능한 필드가 없습니다</div>
                                ) : (
                                  <div className="d-flex flex-column gap-2">
                                    {availableFields.map((field) => (
                                      <Form.Check
                                        key={field.id}
                                        type="checkbox"
                                        id={`field-${formConfigItem.key}-${field.id}`}
                                        label={
                                          <span>
                                            <code className="text-primary">{field.id}</code>
                                            {" - "}
                                            {field.label}
                                            {field.required && (
                                              <Badge bg="danger" className="ms-2">필수</Badge>
                                            )}
                                          </span>
                                        }
                                        checked={selection.optionFieldIds.includes(field.id)}
                                        onChange={() =>
                                          handleToggleOptionField(formConfigItem.key, field.id)
                                        }
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              {selection.optionFieldIds.length > 0 && (
                                <div className="mt-2 small text-muted">
                                  선택된 필드: {selection.optionFieldIds.length}개
                                </div>
                              )}
                            </Form.Group>
                          </Col>
                        </>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {selectedFormConfigs.length === 0 ? (
        <Card>
          <Card.Body className="text-center text-muted py-5">
            신청 양식을 선택해주세요
          </Card.Body>
        </Card>
      ) : (
        <>
          {selectedFormConfigs.map((formConfigItem) => {
            const items = tableData[formConfigItem.key] || [];
            const config = formConfigItem.config;

            return (
              <Card key={formConfigItem.key} className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{formConfigItem.name}</h5>
                    <small className="text-muted">{config.description}</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="info">{items.length}건</Badge>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenModal(formConfigItem)}
                    >
                      + 추가
                    </Button>
                  </div>
                </Card.Header>

                <Card.Body>
                  {items.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      추가된 신청이 없습니다
                    </div>
                  ) : (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>#</th>
                          {config.content.map((field) => (
                            <th key={field.id}>{field.label}</th>
                          ))}
                          <th style={{ width: "100px" }}>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id}>
                            <td>{index + 1}</td>
                            {config.content.map((field) => (
                              <td key={field.id}>
                                {formatFieldValue(field, item.data[field.id])}
                              </td>
                            ))}
                            <td>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() =>
                                  handleDeleteItem(formConfigItem.key, item.id)
                                }
                              >
                                삭제
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            );
          })}

          {/* 전체 제출 버튼 */}
          <div className="d-flex justify-content-end align-items-center gap-3 mb-4">
            <div className="text-muted">
              총 <strong>{totalItems}건</strong>의 신청
            </div>
            <Button
              variant="success"
              size="lg"
              onClick={handleBulkSubmit}
              disabled={isSubmitting || totalItems === 0}
            >
              {isSubmitting ? "제출 중..." : "전체 제출"}
            </Button>
          </div>
        </>
      )}

      {/* DynamicForm 모달 */}
      {currentFormConfig && (
        <DynamicFormModal
          show={showModal}
          onHide={() => setShowModal(false)}
          config={currentFormConfig.config}
          onSubmit={handleModalSubmit}
          optionFieldIds={formSelections.get(currentFormConfig.key)?.optionFieldIds}
        />
      )}
    </Container>
  );
};

export default MultiAccountForms;
