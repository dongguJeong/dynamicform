import React, { useState, useEffect } from "react";
import { Table, Badge, Button, Container, Card, Spinner, Alert, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Submission {
  id: string;
  formId: string | null;
  formName: string;
  status: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  approvalFlow?: {
    requireAll: boolean;
    allowParallel: boolean;
    currentStep?: number;
    approvers: Array<{
      employee: { id: string; name: string; email: string };
      order: number;
      isMandatory: boolean;
      status?: string;
    }>;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const SubmissionList: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string>("");

  const fetchSubmissions = async (page: number = 1, status: string = "") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (status) {
        params.append("status", status);
      }

      const response = await axios.get(`/api/forms/submissions?${params}`);

      if (response.data.success) {
        setSubmissions(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError("제출 목록을 불러올 수 없습니다.");
      }
    } catch (err) {
      console.error("제출 목록 조회 오류:", err);
      setError("제출 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(1, filterStatus);
  }, [filterStatus]);

  const handleRowClick = (submissionId: string) => {
    navigate(`/submissions/${submissionId}`);
  };

  const handlePageChange = (newPage: number) => {
    fetchSubmissions(newPage, filterStatus);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getApprovalProgress = (submission: Submission) => {
    if (!submission.approvalFlow || !submission.approvalFlow.approvers) {
      return <span className="text-muted">-</span>;
    }

    const approvers = submission.approvalFlow.approvers;
    const approvedCount = approvers.filter(a => a.status === "approved").length;
    const rejectedCount = approvers.filter(a => a.status === "rejected").length;
    const totalCount = approvers.length;

    if (rejectedCount > 0) {
      return (
        <span className="text-danger">
          거부됨 ({approvedCount}/{totalCount})
        </span>
      );
    }

    if (approvedCount === totalCount) {
      return (
        <span className="text-success">
          완료 ({approvedCount}/{totalCount})
        </span>
      );
    }

    return (
      <span className="text-info">
        진행중 ({approvedCount}/{totalCount})
      </span>
    );
  };

  if (loading && submissions.length === 0) {
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
          <h4 className="mb-0">폼 제출 현황</h4>
          <Button variant="outline-primary" size="sm" onClick={() => navigate("/")}>
            홈으로
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {/* 필터 */}
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>상태 필터</Form.Label>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="pending">대기중</option>
                  <option value="approved">승인됨</option>
                  <option value="rejected">거부됨</option>
                  <option value="processing">처리중</option>
                  <option value="completed">완료</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8} className="d-flex align-items-end justify-content-end">
              <div className="text-muted">
                총 {pagination.total}건 (페이지 {pagination.page}/{pagination.totalPages})
              </div>
            </Col>
          </Row>

          {submissions.length === 0 ? (
            <Alert variant="info">제출된 폼이 없습니다.</Alert>
          ) : (
            <>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th style={{ width: "12%" }}>제출 ID</th>
                    <th style={{ width: "20%" }}>폼 이름</th>
                    <th style={{ width: "10%" }}>상태</th>
                    <th style={{ width: "13%" }}>승인 진행</th>
                    <th style={{ width: "12%" }}>제출자</th>
                    <th style={{ width: "18%" }}>제출 일시</th>
                    <th style={{ width: "15%" }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr
                      key={submission.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleRowClick(submission.id)}
                    >
                      <td>
                        <code>{submission.id}</code>
                      </td>
                      <td>{submission.formName}</td>
                      <td>{getStatusBadge(submission.status)}</td>
                      <td>{getApprovalProgress(submission)}</td>
                      <td>{submission.submittedByName}</td>
                      <td>{formatDate(submission.submittedAt)}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(submission.id);
                          }}
                        >
                          상세보기
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="me-2"
                  >
                    이전
                  </Button>
                  <span className="align-self-center mx-3">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SubmissionList;
