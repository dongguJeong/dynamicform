import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  Table,
  Modal,
  Form,
  ButtonGroup,
} from "react-bootstrap";
import axios from "axios";
import { DynamicForm } from "../component/DynamicForm";
import { FormConfig } from "../types/type";

interface Submission {
  id: string;
  formId: string | null;
  formName: string;
  data: Record<string, any>;
  approvalFlow: any;
  status: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  processedAt: string | null;
  statusMessage?: string;
}

export const SubmissionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<"form" | "data">("form"); // 폼 보기 / 데이터 보기

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`/api/forms/submissions/${id}`);

      if (response.data.success) {
        setSubmission(response.data.data);
      } else {
        setError("제출 데이터를 불러올 수 없습니다.");
      }
    } catch (err) {
      console.error("제출 데이터 조회 오류:", err);
      setError("제출 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      alert("상태를 선택하세요.");
      return;
    }

    try {
      setUpdating(true);

      const response = await axios.patch(`/api/forms/submissions/${id}/status`, {
        status: newStatus,
        statusMessage: statusMessage || null,
      });

      if (response.data.success) {
        setSubmission(response.data.data);
        setShowStatusModal(false);
        setNewStatus("");
        setStatusMessage("");
        alert("상태가 업데이트되었습니다.");
      }
    } catch (err) {
      console.error("상태 업데이트 오류:", err);
      alert("상태 업데이트 중 오류가 발생했습니다.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string; label: string }> = {
      pending: { variant: "warning", label: "대기중" },
      approved: { variant: "success", label: "승인됨" },
      rejected: { variant: "danger", label: "거부됨" },
      processing: { variant: "info", label: "처리중" },
      completed: { variant: "success", label: "완료" },
    };

    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge bg={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      // DateRange 처리
      if (value.startDate !== undefined && value.endDate !== undefined) {
        if (value.startDate === "" && value.endDate === "") {
          return "전체";
        }
        return `${value.startDate || "-"} ~ ${value.endDate || "-"}`;
      }
      return JSON.stringify(value, null, 2);
    }

    if (typeof value === "boolean") {
      return value ? "예" : "아니오";
    }

    return String(value);
  };

  // FormConfig 재구성 함수
  const buildFormConfig = (): FormConfig | null => {
    if (!submission) return null;

    // 저장된 폼에서 스키마를 가져올 수 있다면 좋지만,
    // 없는 경우 데이터로부터 기본 필드를 생성
    const fields = Object.entries(submission.data).map(([key, value]) => {
      // 필드 타입 추론
      let fieldType: any = "text";

      if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          fieldType = "checkbox";
        } else if (value.startDate !== undefined && value.endDate !== undefined) {
          fieldType = "daterange";
        } else if (value.changes !== undefined) {
          fieldType = "servergroupchange";
        } else {
          fieldType = "text";
        }
      } else if (typeof value === "boolean") {
        fieldType = "checkbox";
      } else if (typeof value === "number") {
        fieldType = "number";
      }

      return {
        id: key,
        type: fieldType,
        label: key,
        required: false,
        value: value,
        options: {}
      };
    });

    return {
      title: submission.formName,
      description: `제출 ID: ${submission.id}`,
      content: fields
    };
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">로딩중...</span>
        </Spinner>
      </Container>
    );
  }

  if (error || !submission) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error || "제출 데이터를 찾을 수 없습니다."}
        </Alert>
        <Button variant="primary" onClick={() => navigate("/submissions")}>
          목록으로 돌아가기
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">제출 상세 정보</h4>
            <div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="me-2"
                onClick={() => navigate("/submissions")}
              >
                목록으로
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowStatusModal(true)}
              >
                상태 변경
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {/* 기본 정보 */}
          <Row className="mb-4">
            <Col md={6}>
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <th style={{ width: "30%" }}>제출 ID</th>
                    <td>
                      <code>{submission.id}</code>
                    </td>
                  </tr>
                  <tr>
                    <th>폼 이름</th>
                    <td>{submission.formName}</td>
                  </tr>
                  <tr>
                    <th>상태</th>
                    <td>{getStatusBadge(submission.status)}</td>
                  </tr>
                  {submission.statusMessage && (
                    <tr>
                      <th>상태 메시지</th>
                      <td>{submission.statusMessage}</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Col>
            <Col md={6}>
              <Table bordered size="sm">
                <tbody>
                  <tr>
                    <th style={{ width: "30%" }}>제출자</th>
                    <td>{submission.submittedByName}</td>
                  </tr>
                  <tr>
                    <th>제출 일시</th>
                    <td>{formatDate(submission.submittedAt)}</td>
                  </tr>
                  <tr>
                    <th>처리 일시</th>
                    <td>{formatDate(submission.processedAt)}</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>

          {/* 보기 모드 선택 */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">제출 데이터</h5>
            <ButtonGroup size="sm">
              <Button
                variant={viewMode === "form" ? "primary" : "outline-primary"}
                onClick={() => setViewMode("form")}
              >
                폼 보기
              </Button>
              <Button
                variant={viewMode === "data" ? "primary" : "outline-primary"}
                onClick={() => setViewMode("data")}
              >
                데이터 보기
              </Button>
            </ButtonGroup>
          </div>

          {viewMode === "form" ? (
            // 폼 보기 모드
            <Card className="mb-4">
              <Card.Body>
                {buildFormConfig() ? (
                  <DynamicForm
                    config={buildFormConfig()!}
                    onSuccess={() => {}}
                    onError={() => {}}
                    readOnly={true}
                  />
                ) : (
                  <Alert variant="warning">폼을 표시할 수 없습니다.</Alert>
                )}
              </Card.Body>
            </Card>
          ) : (
            // 데이터 보기 모드
            <Card className="mb-4">
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th style={{ width: "30%" }}>필드 ID</th>
                      <th>값</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(submission.data).map(([key, value]) => (
                      <tr key={key}>
                        <td>
                          <code>{key}</code>
                        </td>
                        <td>
                          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                            {renderValue(value)}
                          </pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* 승인 플로우 */}
          {submission.approvalFlow && (
            <>
              <h5 className="mb-3">승인 플로우</h5>
              <Card className="mb-4">
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={4}>
                      <strong>모든 승인 필요:</strong>{" "}
                      {submission.approvalFlow.requireAll ? "예" : "아니오"}
                    </Col>
                    <Col md={4}>
                      <strong>병렬 승인:</strong>{" "}
                      {submission.approvalFlow.allowParallel ? "예" : "아니오"}
                    </Col>
                    <Col md={4}>
                      <strong>현재 단계:</strong>{" "}
                      {submission.approvalFlow.currentStep || 1} /{" "}
                      {submission.approvalFlow.approvers.length}
                    </Col>
                  </Row>

                  {submission.approvalFlow.approvers &&
                    submission.approvalFlow.approvers.length > 0 && (
                      <Table striped bordered>
                        <thead>
                          <tr>
                            <th style={{ width: "6%" }}>순서</th>
                            <th style={{ width: "12%" }}>이름</th>
                            <th style={{ width: "15%" }}>이메일</th>
                            <th style={{ width: "10%" }}>부서</th>
                            <th style={{ width: "8%" }}>직급</th>
                            <th style={{ width: "8%" }}>필수</th>
                            <th style={{ width: "8%" }}>상태</th>
                            <th style={{ width: "13%" }}>처리 일시</th>
                            <th style={{ width: "20%" }}>코멘트</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submission.approvalFlow.approvers.map((approver: any) => {
                            const approverStatus = approver.status || "pending";
                            const getApproverStatusBadge = (status: string) => {
                              switch (status) {
                                case "approved":
                                  return <Badge bg="success">승인</Badge>;
                                case "rejected":
                                  return <Badge bg="danger">거부</Badge>;
                                default:
                                  return <Badge bg="warning">대기</Badge>;
                              }
                            };

                            return (
                              <tr key={approver.employee.id}>
                                <td>{approver.order}</td>
                                <td>{approver.employee.name}</td>
                                <td>{approver.employee.email}</td>
                                <td>{approver.employee.department || "-"}</td>
                                <td>{approver.employee.position || "-"}</td>
                                <td>
                                  {approver.isMandatory ? (
                                    <Badge bg="danger">필수</Badge>
                                  ) : (
                                    <Badge bg="secondary">선택</Badge>
                                  )}
                                </td>
                                <td>{getApproverStatusBadge(approverStatus)}</td>
                                <td>
                                  {approver.actionAt ? (
                                    <small>{formatDate(approver.actionAt)}</small>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td>
                                  {approver.actionComment ? (
                                    <small className="text-muted">{approver.actionComment}</small>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    )}
                </Card.Body>
              </Card>
            </>
          )}

          {/* JSON 원본 */}
          <details className="mb-3">
            <summary style={{ cursor: "pointer" }}>
              <strong>JSON 원본 보기</strong>
            </summary>
            <pre className="mt-2 p-3 bg-light border rounded">
              {JSON.stringify(submission, null, 2)}
            </pre>
          </details>
        </Card.Body>
      </Card>

      {/* 상태 변경 모달 */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>상태 변경</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>새 상태</Form.Label>
              <Form.Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">선택하세요</option>
                <option value="pending">대기중</option>
                <option value="processing">처리중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거부됨</option>
                <option value="completed">완료</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>상태 메시지 (선택)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="상태 변경 사유나 메시지를 입력하세요"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusUpdate}
            disabled={updating || !newStatus}
          >
            {updating ? "업데이트 중..." : "변경"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SubmissionDetail;
