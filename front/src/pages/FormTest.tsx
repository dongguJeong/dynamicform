import React, { useState, useEffect } from "react";
import { Button, Card, ListGroup, Alert } from "react-bootstrap";
import axios from "axios";
import DynamicForm from "../component/DynamicForm";
import { FormConfig, FormData as FormDataType } from "../types/type";

interface SavedForm {
  id: string;
  name: string;
  createdAt: string;
}

const FormTest: React.FC = () => {
  const [savedForms, setSavedForms] = useState<SavedForm[]>([]);
  const [selectedFormConfig, setSelectedFormConfig] =
    useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // 저장된 폼 목록 불러오기
  useEffect(() => {
    loadFormList();
  }, []);

  const loadFormList = async () => {
    try {
      const response = await axios.get("/api/forms/list");
      setSavedForms(response.data.data);
    } catch (error) {
      console.error("Failed to load form list:", error);
      setError("폼 목록을 불러오는데 실패했습니다.");
    }
  };

  // 특정 폼 불러오기
  const loadForm = async (formId: string) => {
    setLoading(true);
    setError("");
    setSelectedFormConfig(null);

    try {
      const response = await axios.get(`/api/forms/${formId}`);
      const configText = response.data.data.config;
      const config = JSON.parse(configText);
      setSelectedFormConfig(config);
    } catch (error) {
      console.error("Failed to load form:", error);
      setError("폼을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 폼 삭제
  const deleteForm = async (formId: string) => {
    if (!confirm("정말 이 폼을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await axios.delete(`/api/forms/${formId}`);
      setSuccessMessage("폼이 삭제되었습니다.");
      setTimeout(() => setSuccessMessage(""), 3000);
      loadFormList();
      if (selectedFormConfig) {
        setSelectedFormConfig(null);
      }
    } catch (error) {
      console.error("Failed to delete form:", error);
      setError("폼 삭제에 실패했습니다.");
    }
  };

  // 폼 제출 성공
  const handleFormSuccess = (data: FormDataType, response?: any) => {
    console.log("Form submitted successfully:", data);
    console.log("Server response:", response);
    setSuccessMessage("폼이 성공적으로 제출되었습니다!");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  // 폼 제출 실패
  const handleFormError = (error: string) => {
    console.error("Form submission error:", error);
    setError(error);
    setTimeout(() => setError(""), 5000);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">폼 테스트</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <div className="row">
        {/* 왼쪽: 폼 목록 */}
        <div className="col-md-4">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">저장된 폼 목록</h5>
                <Button variant="link" size="sm" onClick={loadFormList}>
                  새로고침
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ maxHeight: "600px", overflowY: "auto" }}>
              {savedForms.length === 0 ? (
                <p className="text-muted">저장된 폼이 없습니다.</p>
              ) : (
                <ListGroup>
                  {savedForms.map((form) => (
                    <ListGroup.Item key={form.id}>
                      <div>
                        <strong>{form.name}</strong>
                        <div className="text-muted small">
                          {new Date(form.createdAt).toLocaleString()}
                        </div>
                        <div className="mt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => loadForm(form.id)}
                          >
                            불러오기
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => deleteForm(form.id)}
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
        </div>

        {/* 오른쪽: 폼 미리보기/테스트 */}
        <div className="col-md-8">
          <Card>
            <Card.Header>
              <h5 className="mb-0">폼 미리보기</h5>
            </Card.Header>
            <Card.Body>
              {loading && <p>폼을 불러오는 중...</p>}

              {!loading && !selectedFormConfig && (
                <div className="text-center text-muted py-5">
                  <p>왼쪽 목록에서 폼을 선택하세요.</p>
                </div>
              )}

              {!loading && selectedFormConfig && (
                <DynamicForm
                  config={selectedFormConfig}
                  onSuccess={handleFormSuccess}
                  onError={handleFormError}
                />
              )}
            </Card.Body>
          </Card>

          {selectedFormConfig && (
            <Card className="mt-3">
              <Card.Header>
                <h6 className="mb-0">폼 설정 (JSON)</h6>
              </Card.Header>
              <Card.Body>
                <pre
                  style={{
                    background: "#f5f5f5",
                    padding: "1rem",
                    borderRadius: "4px",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {JSON.stringify(selectedFormConfig, null, 2)}
                </pre>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormTest;
