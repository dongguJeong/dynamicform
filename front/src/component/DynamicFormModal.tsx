import React, { useState, useEffect } from "react";
import { Modal, Button, Alert } from "react-bootstrap";
import DynamicForm from "./DynamicForm";
import { FormConfig, FormData as FormDataType } from "../types/type";
import { useFormValidation } from "../hook/useFormValidation";

interface DynamicFormModalProps {
  show: boolean;
  onHide: () => void;
  config: FormConfig;
  onSubmit: (data: FormDataType) => void;
  optionFieldIds?: string[]; // 표시할 필드 ID 목록 (없으면 전체 표시)
}

export const DynamicFormModal: React.FC<DynamicFormModalProps> = ({
  show,
  onHide,
  config,
  onSubmit,
  optionFieldIds,
}) => {
  // optionFieldIds가 있으면 해당 필드만 필터링, 없으면 전체 표시
  const filteredConfig = React.useMemo(() => {
    if (!optionFieldIds || optionFieldIds.length === 0) {
      return config;
    }
    return {
      ...config,
      content: config.content.filter((field) => optionFieldIds.includes(field.id)),
    };
  }, [config, optionFieldIds]);

  const [formData, setFormData] = useState<FormDataType>(() => {
    // 초기값 설정
    const initialData: FormDataType = {};
    filteredConfig.content.forEach((field) => {
      if (field.type === "daterange") {
        if (field.value) {
          initialData[field.id] = field.value;
        } else {
          initialData[field.id] = { startDate: undefined, endDate: undefined };
        }
      } else if (field.type === "servergroupchange") {
        initialData[field.id] = field.value || { changes: [] };
      } else {
        initialData[field.id] = field.value || "";
      }
    });
    return initialData;
  });

  const [error, setError] = useState<string>("");
  const { validateForm } = useFormValidation();

  // 모달이 열릴 때마다 formData 초기화
  useEffect(() => {
    if (show) {
      const initialData: FormDataType = {};
      filteredConfig.content.forEach((field) => {
        if (field.type === "daterange") {
          if (field.value) {
            initialData[field.id] = field.value;
          } else {
            initialData[field.id] = { startDate: undefined, endDate: undefined };
          }
        } else if (field.type === "servergroupchange") {
          initialData[field.id] = field.value || { changes: [] };
        } else {
          initialData[field.id] = field.value || "";
        }
      });
      setFormData(initialData);
      setError("");
    }
  }, [show, filteredConfig]);

  const handleFormChange = (data: FormDataType) => {
    setFormData(data);
  };

  const handleConfirm = () => {
    // 유효성 검사
    const errors = validateForm(formData, filteredConfig.content);

    if (Object.keys(errors).length > 0) {
      // 첫 번째 에러 메시지 표시
      const firstError = Object.values(errors)[0];
      setError(Array.isArray(firstError) ? firstError[0] : firstError);
      return;
    }

    // 유효성 검사 통과 시 부모로 데이터 전달
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({});
    setError("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{filteredConfig.title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

        <DynamicForm
          config={filteredConfig}
          unicode={true}
          value={formData}
          onChange={handleFormChange}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          취소
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          확인
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DynamicFormModal;
