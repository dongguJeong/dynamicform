import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Modal, Alert, Row, Col } from "react-bootstrap";
import axios from "axios";
import {
  FormField,
  AccountCreateItem,
  AccountCreateValue,
  DateRangeValue,
  SelectOption,
} from "../types/type";

interface AccountCreateFieldProps {
  field: FormField;
  value: any;
  hasError: boolean;
  onChange: (fieldId: string, value: any) => void;
}

export const AccountCreateField: React.FC<AccountCreateFieldProps> = ({
  field,
  value,
  hasError,
  onChange,
}) => {
  const accountValue = (value as AccountCreateValue) || { accounts: [] };
  const modalFields = field.options?.accountCreateModalFields || {};
  const accountTypes = field.options?.accountTypes || [];
  const relatedAccountsApiUrl = field.options?.relatedAccountsApiUrl || "/api/accounts/list";

  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // 모달 상태
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("");
  const [ip, setIp] = useState("");
  const [description, setDescription] = useState("");
  const [relatedAccounts, setRelatedAccounts] = useState<string[]>([]);
  const [usagePeriod, setUsagePeriod] = useState<DateRangeValue>({
    startDate: undefined,
    endDate: undefined,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  // 연관 계정 목록 (API에서 로드)
  const [availableAccounts, setAvailableAccounts] = useState<SelectOption[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // 연관 계정 목록 로드
  useEffect(() => {
    if (modalFields.accountSelect && relatedAccountsApiUrl) {
      const fetchAccounts = async () => {
        try {
          setLoadingAccounts(true);
          const response = await axios.get(relatedAccountsApiUrl);
          if (response.data.success && Array.isArray(response.data.data)) {
            const accounts = response.data.data.map((item: any) => ({
              label: item.accountName || item.name || item.label,
              value: item.accountId || item.id || item.value,
            }));
            setAvailableAccounts(accounts);
          }
        } catch (error) {
          console.error("계정 목록 로드 오류:", error);
        } finally {
          setLoadingAccounts(false);
        }
      };

      fetchAccounts();
    }
  }, [modalFields.accountSelect, relatedAccountsApiUrl]);

  // 추가 버튼 클릭
  const handleAddClick = () => {
    resetModalState();
    setEditingIndex(null);
    setShowModal(true);
  };

  // 수정 버튼 클릭
  const handleEditClick = (index: number) => {
    const account = accountValue.accounts[index];
    setAccountName(account.accountName);
    setAccountType(account.accountType || "");
    setIp(account.ip || "");
    setDescription(account.description || "");
    setRelatedAccounts(account.relatedAccounts || []);
    setUsagePeriod(account.usagePeriod || { startDate: undefined, endDate: undefined });
    setEditingIndex(index);
    setShowModal(true);
  };

  // 모달 상태 초기화
  const resetModalState = () => {
    setAccountName("");
    setAccountType("");
    setIp("");
    setDescription("");
    setRelatedAccounts([]);
    setUsagePeriod({ startDate: undefined, endDate: undefined });
    setSelectedPeriod("");
  };

  // 계정 추가/수정
  const handleSaveAccount = () => {
    if (!accountName.trim()) {
      alert("계정명을 입력하세요.");
      return;
    }

    const newAccount: AccountCreateItem = {
      id: editingIndex !== null ? accountValue.accounts[editingIndex].id : `account-${Date.now()}`,
      accountName: accountName.trim(),
      ...(accountType && { accountType }),
      ...(modalFields.ip && ip && { ip }),
      ...(modalFields.textarea && description && { description }),
      ...(modalFields.accountSelect && relatedAccounts.length > 0 && { relatedAccounts }),
      ...(modalFields.daterange && (usagePeriod.startDate || usagePeriod.endDate) && { usagePeriod }),
    };

    let newAccounts: AccountCreateItem[];

    if (editingIndex !== null) {
      // 수정
      newAccounts = [...accountValue.accounts];
      newAccounts[editingIndex] = newAccount;
    } else {
      // 추가
      newAccounts = [...accountValue.accounts, newAccount];
    }

    onChange(field.id, { accounts: newAccounts });

    // 모달 닫기 및 초기화
    setShowModal(false);
    resetModalState();
    setEditingIndex(null);
  };

  // 계정 삭제
  const handleRemoveAccount = (index: number) => {
    const newAccounts = accountValue.accounts.filter((_, i) => i !== index);
    onChange(field.id, { accounts: newAccounts });
  };

  // 기간 옵션 선택
  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    let endDate = new Date(today);

    switch (period) {
      case "3months":
        endDate.setMonth(today.getMonth() + 3);
        break;
      case "6months":
        endDate.setMonth(today.getMonth() + 6);
        break;
      case "12months":
        endDate.setFullYear(today.getFullYear() + 1);
        break;
      default:
        return;
    }

    setUsagePeriod({
      startDate: today.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  };

  // 연관 계정 선택 토글
  const handleRelatedAccountToggle = (accountId: string) => {
    setRelatedAccounts((prev) => {
      if (prev.includes(accountId)) {
        return prev.filter((id) => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  // 계정명 가져오기 (연관 계정용)
  const getAccountLabel = (accountId: string): string => {
    const account = availableAccounts.find((a) => a.value === accountId);
    return account ? account.label : accountId;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">
          생성할 계정을 추가하세요.
        </small>
        <Button variant="primary" size="sm" onClick={handleAddClick}>
          + 계정 추가
        </Button>
      </div>

      {accountValue.accounts.length === 0 ? (
        <Alert variant="info">
          생성할 계정을 추가하세요. "계정 추가" 버튼을 클릭하여 시작합니다.
        </Alert>
      ) : (
        <Table bordered hover size="sm">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>계정명</th>
              {accountTypes.length > 0 && <th style={{ width: "15%" }}>유형</th>}
              {modalFields.ip && <th style={{ width: "15%" }}>IP 주소</th>}
              {modalFields.textarea && <th style={{ width: "25%" }}>설명</th>}
              {modalFields.accountSelect && <th style={{ width: "20%" }}>연관 계정</th>}
              {modalFields.daterange && <th style={{ width: "15%" }}>사용 기간</th>}
              <th style={{ width: "10%" }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {accountValue.accounts.map((account, index) => (
              <tr key={account.id}>
                <td>
                  <strong>{account.accountName}</strong>
                </td>
                {accountTypes.length > 0 && (
                  <td>
                    {account.accountType
                      ? accountTypes.find((t) => t.value === account.accountType)?.label ||
                        account.accountType
                      : "-"}
                  </td>
                )}
                {modalFields.ip && <td>{account.ip || "-"}</td>}
                {modalFields.textarea && (
                  <td>
                    <small>{account.description || "-"}</small>
                  </td>
                )}
                {modalFields.accountSelect && (
                  <td>
                    {account.relatedAccounts && account.relatedAccounts.length > 0 ? (
                      account.relatedAccounts.map((accId) => (
                        <Badge key={accId} bg="secondary" className="me-1">
                          {getAccountLabel(accId)}
                        </Badge>
                      ))
                    ) : (
                      "-"
                    )}
                  </td>
                )}
                {modalFields.daterange && (
                  <td>
                    {account.usagePeriod?.startDate && account.usagePeriod?.endDate ? (
                      <small>
                        {account.usagePeriod.startDate} ~ {account.usagePeriod.endDate}
                      </small>
                    ) : (
                      "-"
                    )}
                  </td>
                )}
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-1"
                    onClick={() => handleEditClick(index)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveAccount(index)}
                  >
                    삭제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* 계정 추가/수정 모달 */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingIndex !== null ? "계정 수정" : "계정 추가"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={accountTypes.length > 0 ? 6 : 12}>
              <Form.Group className="mb-3">
                <Form.Label>
                  계정명 <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="계정명을 입력하세요"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                />
              </Form.Group>
            </Col>
            {accountTypes.length > 0 && (
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>계정 유형</Form.Label>
                  <Form.Select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                  >
                    <option value="">유형 선택</option>
                    {accountTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
          </Row>

          {modalFields.ip && (
            <Form.Group className="mb-3">
              <Form.Label>IP 주소</Form.Label>
              <Form.Control
                type="text"
                placeholder="예: 192.168.1.100"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
              />
            </Form.Group>
          )}

          {modalFields.textarea && (
            <Form.Group className="mb-3">
              <Form.Label>설명</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="계정에 대한 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
          )}

          {modalFields.accountSelect && (
            <Form.Group className="mb-3">
              <Form.Label>연관 계정 선택 (다중 선택 가능)</Form.Label>
              {loadingAccounts ? (
                <div>로딩 중...</div>
              ) : (
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    padding: "10px",
                  }}
                >
                  {availableAccounts.length === 0 ? (
                    <div className="text-muted">연관 계정이 없습니다.</div>
                  ) : (
                    availableAccounts.map((account) => (
                      <Form.Check
                        key={account.value}
                        type="checkbox"
                        id={`account-${account.value}`}
                        label={account.label}
                        checked={relatedAccounts.includes(String(account.value))}
                        onChange={() => handleRelatedAccountToggle(String(account.value))}
                        className="mb-2"
                      />
                    ))
                  )}
                </div>
              )}
            </Form.Group>
          )}

          {modalFields.daterange && (
            <Form.Group className="mb-3">
              <Form.Label>사용 기간</Form.Label>
              <div className="mb-2">
                <Button
                  variant={selectedPeriod === "3months" ? "primary" : "outline-primary"}
                  size="sm"
                  className="me-2"
                  onClick={() => handlePeriodSelect("3months")}
                >
                  3개월
                </Button>
                <Button
                  variant={selectedPeriod === "6months" ? "primary" : "outline-primary"}
                  size="sm"
                  className="me-2"
                  onClick={() => handlePeriodSelect("6months")}
                >
                  6개월
                </Button>
                <Button
                  variant={selectedPeriod === "12months" ? "primary" : "outline-primary"}
                  size="sm"
                  onClick={() => handlePeriodSelect("12months")}
                >
                  12개월
                </Button>
              </div>
              <Row>
                <Col md={6}>
                  <Form.Label>시작일</Form.Label>
                  <Form.Control
                    type="date"
                    value={usagePeriod.startDate || ""}
                    onChange={(e) =>
                      setUsagePeriod((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </Col>
                <Col md={6}>
                  <Form.Label>종료일</Form.Label>
                  <Form.Control
                    type="date"
                    value={usagePeriod.endDate || ""}
                    onChange={(e) =>
                      setUsagePeriod((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </Col>
              </Row>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveAccount}
            disabled={!accountName.trim()}
          >
            {editingIndex !== null ? "수정" : "추가"}
          </Button>
        </Modal.Footer>
      </Modal>

      {hasError && (
        <div className="text-danger mt-2">
          <small>계정을 추가하세요.</small>
        </div>
      )}
    </div>
  );
};

export default AccountCreateField;
