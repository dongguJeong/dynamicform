import React, { useState, useEffect } from "react";
import { Table, Button, Form, Badge, Modal, Alert } from "react-bootstrap";
import axios from "axios";
import { FormField, ServerGroupChange, ServerGroupChangeValue } from "../types/type";

interface ServerGroupChangeFieldProps {
  field: FormField;
  value: any;
  hasError: boolean;
  onChange: (fieldId: string, value: any) => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  serverGroups: string[];
}

interface ServerGroup {
  id: string;
  name: string;
  description: string;
  servers: string[];
}

export const ServerGroupChangeField: React.FC<ServerGroupChangeFieldProps> = ({
  field,
  value,
  hasError,
  onChange,
}) => {
  const changeValue = (value as ServerGroupChangeValue) || { changes: [] };
  const [users, setUsers] = useState<User[]>([]);
  const [serverGroups, setServerGroups] = useState<ServerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // 모달 상태
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [selectedTargetGroups, setSelectedTargetGroups] = useState<string[]>([]);

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, groupsRes] = await Promise.all([
          axios.get("/api/users/list"),
          axios.get("/api/server-groups/list"),
        ]);

        if (usersRes.data.success) {
          setUsers(usersRes.data.data);
        }
        if (groupsRes.data.success) {
          setServerGroups(groupsRes.data.data);
        }
      } catch (error) {
        console.error("데이터 로드 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 사용자 선택 시
  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    const user = users.find((u) => u.id === userId);
    setSelectedUserData(user || null);
    setSelectedTargetGroups([]);
  };

  // 목표 그룹 선택 토글
  const handleTargetGroupToggle = (groupId: string) => {
    setSelectedTargetGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  // 변경 요청 추가
  const handleAddChange = () => {
    if (!selectedUserData) {
      alert("사용자를 선택하세요.");
      return;
    }

    if (selectedTargetGroups.length === 0) {
      alert("목표 서버 그룹을 선택하세요.");
      return;
    }

    // 이미 추가된 사용자인지 확인
    const existingIndex = changeValue.changes.findIndex(
      (c) => c.userId === selectedUserData.id
    );

    let newChanges: ServerGroupChange[];

    if (existingIndex >= 0) {
      // 기존 사용자 업데이트
      newChanges = [...changeValue.changes];
      newChanges[existingIndex] = {
        ...newChanges[existingIndex],
        targetGroups: selectedTargetGroups,
      };
    } else {
      // 새 사용자 추가
      const newChange: ServerGroupChange = {
        userId: selectedUserData.id,
        userName: selectedUserData.name,
        userEmail: selectedUserData.email,
        currentGroups: selectedUserData.serverGroups,
        targetGroups: selectedTargetGroups,
      };
      newChanges = [...changeValue.changes, newChange];
    }

    onChange(field.id, { changes: newChanges });

    // 모달 닫기 및 초기화
    setShowModal(false);
    setSelectedUser("");
    setSelectedUserData(null);
    setSelectedTargetGroups([]);
  };

  // 변경 요청 삭제
  const handleRemoveChange = (userId: string) => {
    const newChanges = changeValue.changes.filter((c) => c.userId !== userId);
    onChange(field.id, { changes: newChanges });
  };

  // 서버 그룹 이름 가져오기
  const getServerGroupName = (groupId: string): string => {
    const group = serverGroups.find((g) => g.id === groupId);
    return group ? group.name : groupId;
  };

  // 서버 그룹 뱃지 렌더링
  const renderGroupBadges = (groupIds: string[]) => {
    return groupIds.map((groupId) => (
      <Badge key={groupId} bg="secondary" className="me-1">
        {getServerGroupName(groupId)}
      </Badge>
    ));
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <small className="text-muted">
          사용자를 선택하여 서버 그룹을 변경할 수 있습니다.
        </small>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
          + 사용자 추가
        </Button>
      </div>

      {changeValue.changes.length === 0 ? (
        <Alert variant="info">
          변경할 사용자를 추가하세요. "사용자 추가" 버튼을 클릭하여 시작합니다.
        </Alert>
      ) : (
        <Table bordered hover size="sm">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>사용자</th>
              <th style={{ width: "35%" }}>현재 서버 그룹</th>
              <th style={{ width: "35%" }}>목표 서버 그룹</th>
              <th style={{ width: "10%" }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {changeValue.changes.map((change) => (
              <tr key={change.userId}>
                <td>
                  <div>
                    <strong>{change.userName}</strong>
                  </div>
                  <small className="text-muted">{change.userEmail}</small>
                </td>
                <td>{renderGroupBadges(change.currentGroups)}</td>
                <td>{renderGroupBadges(change.targetGroups)}</td>
                <td>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveChange(change.userId)}
                  >
                    삭제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* 사용자 추가 모달 */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>서버 그룹 변경 요청 추가</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>사용자 선택</Form.Label>
            <Form.Select
              value={selectedUser}
              onChange={(e) => handleUserSelect(e.target.value)}
            >
              <option value="">사용자를 선택하세요</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.department}/{user.position}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedUserData && (
            <>
              <Alert variant="info">
                <strong>현재 서버 그룹:</strong>
                <div className="mt-2">
                  {selectedUserData.serverGroups.length > 0 ? (
                    renderGroupBadges(selectedUserData.serverGroups)
                  ) : (
                    <span className="text-muted">할당된 그룹 없음</span>
                  )}
                </div>
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>목표 서버 그룹 (다중 선택 가능)</Form.Label>
                <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
                  {serverGroups.map((group) => (
                    <Form.Check
                      key={group.id}
                      type="checkbox"
                      id={`group-${group.id}`}
                      label={
                        <div>
                          <strong>{group.name}</strong>
                          <div>
                            <small className="text-muted">
                              {group.description} ({group.servers.length}개 서버)
                            </small>
                          </div>
                        </div>
                      }
                      checked={selectedTargetGroups.includes(group.id)}
                      onChange={() => handleTargetGroupToggle(group.id)}
                      className="mb-2"
                    />
                  ))}
                </div>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleAddChange}
            disabled={!selectedUserData || selectedTargetGroups.length === 0}
          >
            추가
          </Button>
        </Modal.Footer>
      </Modal>

      {hasError && (
        <div className="text-danger mt-2">
          <small>서버 그룹 변경 요청을 추가하세요.</small>
        </div>
      )}
    </div>
  );
};

export default ServerGroupChangeField;
