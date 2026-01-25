import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Badge, Alert } from "react-bootstrap";
import axios from "axios";
import { Employee, Approver, ApprovalFlow } from "../types/type";

interface ApprovalFlowModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (approvalFlow: ApprovalFlow) => void;
  initialFlow?: ApprovalFlow;
  apiUrl?: string; // 직원 목록을 가져올 API URL
}

export const ApprovalFlowModal: React.FC<ApprovalFlowModalProps> = ({
  show,
  onHide,
  onSave,
  initialFlow,
  apiUrl = "http://localhost:3001/api/employees/list",
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<Approver[]>([]);
  const [requireAll, setRequireAll] = useState(true);
  const [allowParallel, setAllowParallel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // 초기 데이터 로드
  useEffect(() => {
    if (show) {
      loadEmployees();
      if (initialFlow) {
        setSelectedApprovers(initialFlow.approvers);
        setRequireAll(initialFlow.requireAll);
        setAllowParallel(initialFlow.allowParallel);
      }
    }
  }, [show, initialFlow]);

  // 직원 목록 로드
  const loadEmployees = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(apiUrl);
      const data = response.data.data || response.data;

      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        setError("직원 목록을 불러올 수 없습니다");
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
      setError("직원 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 직원 추가
  const handleAddApprover = (employee: Employee) => {
    // 이미 추가된 직원인지 확인
    const isAlreadyAdded = selectedApprovers.some(
      (approver) => approver.employee.id === employee.id
    );

    if (isAlreadyAdded) {
      alert("이미 추가된 승인자입니다");
      return;
    }

    const newApprover: Approver = {
      employee,
      order: selectedApprovers.length + 1,
      isMandatory: true,
    };

    setSelectedApprovers([...selectedApprovers, newApprover]);
  };

  // 승인자 제거
  const handleRemoveApprover = (employeeId: string) => {
    const filtered = selectedApprovers.filter(
      (approver) => approver.employee.id !== employeeId
    );

    // 순서 재정렬
    const reordered = filtered.map((approver, index) => ({
      ...approver,
      order: index + 1,
    }));

    setSelectedApprovers(reordered);
  };

  // 순서 변경 (위로)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newApprovers = [...selectedApprovers];
    [newApprovers[index - 1], newApprovers[index]] = [
      newApprovers[index],
      newApprovers[index - 1],
    ];

    // 순서 재정렬
    const reordered = newApprovers.map((approver, idx) => ({
      ...approver,
      order: idx + 1,
    }));

    setSelectedApprovers(reordered);
  };

  // 순서 변경 (아래로)
  const handleMoveDown = (index: number) => {
    if (index === selectedApprovers.length - 1) return;

    const newApprovers = [...selectedApprovers];
    [newApprovers[index], newApprovers[index + 1]] = [
      newApprovers[index + 1],
      newApprovers[index],
    ];

    // 순서 재정렬
    const reordered = newApprovers.map((approver, idx) => ({
      ...approver,
      order: idx + 1,
    }));

    setSelectedApprovers(reordered);
  };

  // 필수 승인 여부 토글
  const handleToggleMandatory = (employeeId: string) => {
    setSelectedApprovers(
      selectedApprovers.map((approver) =>
        approver.employee.id === employeeId
          ? { ...approver, isMandatory: !approver.isMandatory }
          : approver
      )
    );
  };

  // 저장
  const handleSave = () => {
    if (selectedApprovers.length === 0) {
      alert("최소 1명 이상의 승인자를 선택해야 합니다");
      return;
    }

    const approvalFlow: ApprovalFlow = {
      approvers: selectedApprovers,
      requireAll,
      allowParallel,
    };

    onSave(approvalFlow);
    handleClose();
  };

  // 모달 닫기
  const handleClose = () => {
    setSelectedApprovers([]);
    setRequireAll(true);
    setAllowParallel(false);
    setSearchTerm("");
    setError("");
    onHide();
  };

  // 직원 필터링
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>승인 플로우 설정</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {/* 승인 플로우 옵션 */}
        <div className="mb-4 p-3 bg-light rounded">
          <h6 className="mb-3">승인 옵션</h6>

          <Form.Check
            type="checkbox"
            id="requireAll"
            label="모든 승인자의 승인 필요"
            checked={requireAll}
            onChange={(e) => setRequireAll(e.target.checked)}
            className="mb-2"
          />

          <Form.Check
            type="checkbox"
            id="allowParallel"
            label="병렬 승인 허용 (순서 무관)"
            checked={allowParallel}
            onChange={(e) => setAllowParallel(e.target.checked)}
            disabled={!requireAll}
          />

          <small className="text-muted d-block mt-2">
            {allowParallel
              ? "승인자들이 동시에 승인할 수 있습니다 (순서 무관)"
              : "승인자들이 순차적으로 승인해야 합니다"}
          </small>
        </div>

        {/* 선택된 승인자 목록 */}
        <div className="mb-4">
          <h6 className="mb-3">
            선택된 승인자 ({selectedApprovers.length}명)
          </h6>

          {selectedApprovers.length === 0 ? (
            <div className="text-center text-muted py-4">
              승인자를 선택해주세요
            </div>
          ) : (
            <div className="approval-list">
              {selectedApprovers.map((approver, index) => (
                <div
                  key={approver.employee.id}
                  className="approval-item d-flex align-items-center p-3 mb-2 border rounded"
                >
                  <div className="approval-order me-3">
                    <Badge bg="primary">{approver.order}</Badge>
                  </div>

                  <div className="flex-grow-1">
                    <div className="fw-bold">{approver.employee.name}</div>
                    <small className="text-muted">
                      {approver.employee.email}
                      {approver.employee.department &&
                        ` - ${approver.employee.department}`}
                    </small>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <Form.Check
                      type="checkbox"
                      id={`mandatory-${approver.employee.id}`}
                      label="필수"
                      checked={approver.isMandatory}
                      onChange={() =>
                        handleToggleMandatory(approver.employee.id)
                      }
                      className="me-2"
                    />

                    <div className="btn-group">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || allowParallel}
                        title="위로"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={
                          index === selectedApprovers.length - 1 ||
                          allowParallel
                        }
                        title="아래로"
                      >
                        ↓
                      </Button>
                    </div>

                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveApprover(approver.employee.id)}
                      className="ms-2"
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 직원 목록 */}
        <div>
          <h6 className="mb-3">직원 목록</h6>

          <Form.Control
            type="text"
            placeholder="이름, 이메일, 부서로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3"
          />

          {loading ? (
            <div className="text-center py-4">로딩 중...</div>
          ) : (
            <div
              className="employee-list"
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              {filteredEmployees.length === 0 ? (
                <div className="text-center text-muted py-4">
                  {searchTerm
                    ? "검색 결과가 없습니다"
                    : "직원 목록이 없습니다"}
                </div>
              ) : (
                filteredEmployees.map((employee) => {
                  const isSelected = selectedApprovers.some(
                    (approver) => approver.employee.id === employee.id
                  );

                  return (
                    <div
                      key={employee.id}
                      className={`employee-item d-flex align-items-center p-2 mb-2 border rounded ${
                        isSelected ? "bg-light" : ""
                      }`}
                      style={{ cursor: isSelected ? "default" : "pointer" }}
                      onClick={() =>
                        !isSelected && handleAddApprover(employee)
                      }
                    >
                      {employee.avatar && (
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="rounded-circle me-2"
                          style={{ width: "32px", height: "32px" }}
                        />
                      )}

                      <div className="flex-grow-1">
                        <div className="fw-bold">
                          {employee.name}
                          {isSelected && (
                            <Badge bg="success" className="ms-2">
                              선택됨
                            </Badge>
                          )}
                        </div>
                        <small className="text-muted">
                          {employee.email}
                          {employee.department &&
                            ` - ${employee.department}`}
                          {employee.position && ` (${employee.position})`}
                        </small>
                      </div>

                      {!isSelected && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddApprover(employee);
                          }}
                        >
                          추가
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          취소
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={selectedApprovers.length === 0}
        >
          저장 ({selectedApprovers.length}명 선택)
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
