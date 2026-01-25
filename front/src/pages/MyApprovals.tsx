import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Table,
  Badge,
  Button,
  Spinner,
  Alert,
  Tabs,
  Tab,
  Modal,
  Form,
} from "react-bootstrap";
import axios from "axios";

interface ApprovalItem {
  id: string;
  submissionId: string;
  formName: string;
  submittedByName: string;
  submittedAt: string;
  order: number;
  isMandatory: boolean;
  status: string;
  actionAt: string | null;
  actionComment: string | null;
  flowStatus: string;
  currentStep: number;
  totalSteps: number;
}

export const MyApprovals: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [completedApprovals, setCompletedApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [actionComment, setActionComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 현재 사용자 정보 (실제로는 인증 시스템에서 가져와야 함)
  const currentUserId = "EMP001"; // 임시 하드코딩

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`/api/approvals/my-approvals?employeeId=${currentUserId}`);

      if (response.data.success) {
        const allApprovals = response.data.data;

        // 대기중인 승인과 완료된 승인 분리
        const pending = allApprovals.filter((a: ApprovalItem) => a.status === "pending");
        const completed = allApprovals.filter((a: ApprovalItem) =>
          a.status === "approved" || a.status === "rejected"
        );

        setPendingApprovals(pending);
        setCompletedApprovals(completed);
      } else {
        setError("승인 목록을 불러올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("승인 목록 조회 오류:", err);
      setError(err.response?.data?.message || "승인 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (approval: ApprovalItem, type: "approve" | "reject") => {
    setSelectedApproval(approval);
    setActionType(type);
    setActionComment("");
    setShowActionModal(true);
  };

  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setSelectedApproval(null);
    setActionComment("");
  };

  const handleSubmitAction = async () => {
    if (!selectedApproval) return;

    try {
      setActionLoading(true);

      const endpoint = actionType === "approve"
        ? `/api/approvals/${selectedApproval.id}/approve`
        : `/api/approvals/${selectedApproval.id}/reject`;

      const response = await axios.post(endpoint, {
        employeeId: currentUserId,
        comment: actionComment || null,
      });

      if (response.data.success) {
        alert(response.data.message || `${actionType === "approve" ? "승인" : "거부"}이 완료되었습니다.`);
        handleCloseActionModal();
        fetchApprovals(); // 목록 새로고침
      }
    } catch (err: any) {
      console.error("승인 처리 오류:", err);
      alert(err.response?.data?.message || "승인 처리 중 오류가 발생했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string; label: string }> = {
      pending: { variant: "warning", label: "대기중" },
      approved: { variant: "success", label: "승인됨" },
      rejected: { variant: "danger", label: "거부됨" },
    };

    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge bg={config.variant}>{config.label}</Badge>;
  };

  const getFlowStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string; label: string }> = {
      pending: { variant: "warning", label: "대기중" },
      in_progress: { variant: "info", label: "진행중" },
      approved: { variant: "success", label: "최종승인" },
      rejected: { variant: "danger", label: "거부됨" },
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
    });
  };

  const renderApprovalTable = (approvals: ApprovalItem[], isPending: boolean) => {
    if (approvals.length === 0) {
      return (
        <Alert variant="info">
          {isPending ? "처리할 승인 건이 없습니다." : "처리한 승인 내역이 없습니다."}
        </Alert>
      );
    }

    return (
      <Table hover responsive>
        <thead>
          <tr>
            <th style={{ width: "20%" }}>폼 이름</th>
            <th style={{ width: "12%" }}>제출자</th>
            <th style={{ width: "15%" }}>제출 일시</th>
            <th style={{ width: "8%" }}>순서</th>
            <th style={{ width: "8%" }}>필수</th>
            <th style={{ width: "10%" }}>승인 상태</th>
            <th style={{ width: "10%" }}>전체 상태</th>
            {!isPending && <th style={{ width: "15%" }}>처리 일시</th>}
            <th style={{ width: isPending ? "17%" : "12%" }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {approvals.map((approval) => (
            <tr key={approval.id}>
              <td>{approval.formName}</td>
              <td>{approval.submittedByName}</td>
              <td>{formatDate(approval.submittedAt)}</td>
              <td>
                {approval.order} / {approval.totalSteps}
              </td>
              <td>
                {approval.isMandatory ? (
                  <Badge bg="danger">필수</Badge>
                ) : (
                  <Badge bg="secondary">선택</Badge>
                )}
              </td>
              <td>{getStatusBadge(approval.status)}</td>
              <td>{getFlowStatusBadge(approval.flowStatus)}</td>
              {!isPending && <td>{formatDate(approval.actionAt)}</td>}
              <td>
                {isPending ? (
                  <div className="d-flex gap-1">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleOpenActionModal(approval, "approve")}
                    >
                      승인
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleOpenActionModal(approval, "reject")}
                    >
                      거부
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => navigate(`/submissions/${approval.submissionId}`)}
                    >
                      상세
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => navigate(`/submissions/${approval.submissionId}`)}
                  >
                    상세보기
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    );
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

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">내 승인 관리</h4>
          <Button variant="outline-primary" size="sm" onClick={() => navigate("/")}>
            홈으로
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="mb-3">
            <p className="text-muted mb-2">
              대기중: <strong>{pendingApprovals.length}</strong>건 |
              처리완료: <strong>{completedApprovals.length}</strong>건
            </p>
          </div>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || "pending")} className="mb-3">
            <Tab eventKey="pending" title={`대기중 (${pendingApprovals.length})`}>
              {renderApprovalTable(pendingApprovals, true)}
            </Tab>
            <Tab eventKey="completed" title={`처리완료 (${completedApprovals.length})`}>
              {renderApprovalTable(completedApprovals, false)}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* 승인/거부 모달 */}
      <Modal show={showActionModal} onHide={handleCloseActionModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === "approve" ? "승인" : "거부"} 처리
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedApproval && (
            <>
              <div className="mb-3">
                <strong>폼 이름:</strong> {selectedApproval.formName}
                <br />
                <strong>제출자:</strong> {selectedApproval.submittedByName}
                <br />
                <strong>승인 순서:</strong> {selectedApproval.order} / {selectedApproval.totalSteps}
              </div>

              <Form.Group className="mb-3">
                <Form.Label>코멘트 {actionType === "reject" && "(필수)"}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "승인 코멘트를 입력하세요 (선택사항)"
                      : "거부 사유를 입력하세요"
                  }
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseActionModal}>
            취소
          </Button>
          <Button
            variant={actionType === "approve" ? "success" : "danger"}
            onClick={handleSubmitAction}
            disabled={actionLoading || (actionType === "reject" && !actionComment.trim())}
          >
            {actionLoading ? "처리중..." : actionType === "approve" ? "승인" : "거부"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MyApprovals;
