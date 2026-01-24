import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { FormField } from "../types/type";

interface ModalSelectFieldProps {
  field: FormField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
}

export const ModalSelectField: React.FC<ModalSelectFieldProps> = ({
  field,
  value,
  onChange,
}) => {
  const [showModal, setShowModal] = useState(false);
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

      <Button
        variant="outline-primary"
        size="sm"
        className="mt-2"
        onClick={handleOpenModal}
      >
        {field.options?.placeholder || "항목 선택"}
      </Button>

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
};
