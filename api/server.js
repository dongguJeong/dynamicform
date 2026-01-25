import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3001;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('---');
  next();
});

// Echo 응답을 생성하는 헬퍼 함수
const createEchoResponse = (req) => {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    echo: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent']
      }
    },
    message: `요청이 성공적으로 처리되었습니다. (Echo from ${req.path})`
  };
};

// ===== 단일 API 엔드포인트 =====
app.post('/api/selectServer', (req, res) => {
  const response = createEchoResponse(req);
  response.data = {
    serverId: `SERVER-${Date.now()}`,
    ...req.body
  };
  res.json(response);
});

// ===== 여러 API 엔드포인트 - 요청 정보 =====
app.post('/api/request', (req, res) => {
  const response = createEchoResponse(req);
  response.data = {
    requestId: `REQ-${Date.now()}`,
    status: 'pending',
    ...req.body
  };
  res.json(response);
});

// ===== 여러 API 엔드포인트 - 서버 설정 =====
app.post('/api/server', (req, res) => {
  const response = createEchoResponse(req);
  response.data = {
    serverId: `SRV-${Date.now()}`,
    status: 'provisioning',
    ...req.body
  };
  res.json(response);
});

// ===== 여러 API 엔드포인트 - 기능 설정 =====
app.post('/api/features', (req, res) => {
  const response = createEchoResponse(req);
  response.data = {
    featureId: `FEAT-${Date.now()}`,
    enabled: true,
    ...req.body
  };
  res.json(response);
});

// ===== 사용자 생성 =====
app.post('/api/user/create', (req, res) => {
  const response = createEchoResponse(req);
  response.data = {
    userId: `USER-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...req.body
  };
  res.json(response);
});

// ===== 사용자 설정 =====
app.post('/api/user/settings', (req, res) => {
  const response = createEchoResponse(req);
  response.data = {
    settingsId: `SETTINGS-${Date.now()}`,
    updatedAt: new Date().toISOString(),
    ...req.body
  };
  res.json(response);
});

// ===== DateRange 테스트 (전체 옵션 포함) =====
app.post('/api/daterange/test', (req, res) => {
  const response = createEchoResponse(req);
  const { usagePeriod } = req.body;

  // 날짜 범위 분석
  let periodInfo = {};
  if (usagePeriod && usagePeriod.startDate && usagePeriod.endDate) {
    const start = new Date(usagePeriod.startDate);
    const end = new Date(usagePeriod.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    periodInfo = {
      startDate: usagePeriod.startDate,
      endDate: usagePeriod.endDate,
      durationDays: diffDays,
      isValid: start <= end,
    };
  } else if (usagePeriod && usagePeriod.startDate === '' && usagePeriod.endDate === '') {
    periodInfo = {
      type: 'all',
      message: '전체 기간 선택됨',
    };
  }

  response.data = {
    testId: `DATERANGE-${Date.now()}`,
    periodInfo,
    ...req.body
  };
  res.json(response);
});

// ===== DateRange 간단한 테스트 (빠른 선택 없음) =====
app.post('/api/daterange/simple', (req, res) => {
  const response = createEchoResponse(req);
  const { eventPeriod } = req.body;

  // 날짜 범위 검증
  let validation = { valid: true, message: 'OK' };
  if (eventPeriod && eventPeriod.startDate && eventPeriod.endDate) {
    const start = new Date(eventPeriod.startDate);
    const end = new Date(eventPeriod.endDate);

    if (start > end) {
      validation = { valid: false, message: '시작일이 종료일보다 늦습니다.' };
    }
  }

  response.data = {
    eventId: `EVENT-${Date.now()}`,
    validation,
    ...req.body
  };
  res.json(response);
});

// ===== Modal Select 테스트 =====
app.post('/api/modalselect/test', (req, res) => {
  const response = createEchoResponse(req);
  const { technologies, teamMembers } = req.body;

  // 선택된 항목 분석
  let analysis = {};
  if (Array.isArray(technologies)) {
    analysis.technologiesCount = technologies.length;
    analysis.selectedTechnologies = technologies;
  }
  if (Array.isArray(teamMembers)) {
    analysis.teamSize = teamMembers.length;
    analysis.selectedMembers = teamMembers;
  }

  response.data = {
    projectId: `PROJ-${Date.now()}`,
    analysis,
    ...req.body
  };
  res.json(response);
});

// ===== 폼 저장/불러오기 =====
// 메모리에 저장 (실제로는 DB 사용 권장)
const savedForms = new Map();
const formSubmissions = new Map();

// 폼 저장
app.post('/api/forms/save', (req, res) => {
  const response = createEchoResponse(req);
  const { name, config } = req.body;

  if (!name || !config) {
    return res.status(400).json({
      success: false,
      message: 'name과 config는 필수입니다.'
    });
  }

  const formId = `FORM-${Date.now()}`;
  savedForms.set(formId, {
    id: formId,
    name,
    config,
    createdAt: new Date().toISOString()
  });

  response.data = {
    formId,
    name,
    message: '폼이 성공적으로 저장되었습니다.'
  };
  res.json(response);
});

// 폼 목록 조회
app.get('/api/forms/list', (req, res) => {
  const formList = Array.from(savedForms.values()).map(form => ({
    id: form.id,
    name: form.name,
    createdAt: form.createdAt
  }));

  res.json({
    success: true,
    data: formList,
    count: formList.length
  });
});

// ===== 폼 제출 관리 (먼저 정의하여 :formId보다 우선 매칭) =====

// 폼 제출
app.post('/api/forms/submissions', (req, res) => {
  const { formId, formName, data, approvalFlow } = req.body;

  if (!data) {
    return res.status(400).json({
      success: false,
      message: 'data는 필수입니다.'
    });
  }

  const submissionId = `SUB-${Date.now()}`;
  const submission = {
    id: submissionId,
    formId: formId || null,
    formName: formName || '제목 없음',
    data,
    approvalFlow: approvalFlow || null,
    status: 'pending',
    submittedBy: 'user@company.com', // 실제로는 인증된 사용자 정보 사용
    submittedByName: '홍길동',
    submittedAt: new Date().toISOString(),
    processedAt: null
  };

  formSubmissions.set(submissionId, submission);

  res.status(201).json({
    success: true,
    data: {
      id: submissionId,
      formId: submission.formId,
      formName: submission.formName,
      status: submission.status,
      submittedAt: submission.submittedAt
    },
    message: '폼이 성공적으로 제출되었습니다.'
  });
});

// 제출 목록 조회
app.get('/api/forms/submissions', (req, res) => {
  const { status, formId, page = 1, limit = 20 } = req.query;

  let submissions = Array.from(formSubmissions.values());

  // 필터링
  if (status) {
    submissions = submissions.filter(s => s.status === status);
  }
  if (formId) {
    submissions = submissions.filter(s => s.formId === formId);
  }

  // 최신순 정렬
  submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  // 페이지네이션
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedSubmissions = submissions.slice(startIndex, endIndex);

  const submissionList = paginatedSubmissions.map(s => ({
    id: s.id,
    formId: s.formId,
    formName: s.formName,
    status: s.status,
    submittedBy: s.submittedBy,
    submittedByName: s.submittedByName,
    submittedAt: s.submittedAt
  }));

  res.json({
    success: true,
    data: submissionList,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: submissions.length,
      totalPages: Math.ceil(submissions.length / limitNum)
    }
  });
});

// 특정 제출 조회
app.get('/api/forms/submissions/:id', (req, res) => {
  const { id } = req.params;
  const submission = formSubmissions.get(id);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: '제출 데이터를 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    data: submission
  });
});

// 제출 상태 변경
app.patch('/api/forms/submissions/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, statusMessage } = req.body;

  const submission = formSubmissions.get(id);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: '제출 데이터를 찾을 수 없습니다.'
    });
  }

  submission.status = status;
  submission.statusMessage = statusMessage || null;

  if (status === 'approved' || status === 'rejected' || status === 'completed') {
    submission.processedAt = new Date().toISOString();
  }

  formSubmissions.set(id, submission);

  res.json({
    success: true,
    data: submission,
    message: '상태가 업데이트되었습니다.'
  });
});

// 제출 삭제
app.delete('/api/forms/submissions/:id', (req, res) => {
  const { id } = req.params;
  const deleted = formSubmissions.delete(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: '제출 데이터를 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    message: '제출 데이터가 삭제되었습니다.'
  });
});

// 특정 폼 조회
app.get('/api/forms/:formId', (req, res) => {
  const { formId } = req.params;
  const form = savedForms.get(formId);

  if (!form) {
    return res.status(404).json({
      success: false,
      message: '폼을 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    data: form
  });
});

// 폼 삭제
app.delete('/api/forms/:formId', (req, res) => {
  const { formId } = req.params;
  const deleted = savedForms.delete(formId);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: '폼을 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    message: '폼이 삭제되었습니다.'
  });
});

// 커스텀 폼 제출 (저장된 폼 데이터 처리)
app.post('/api/custom-form', (req, res) => {
  const response = createEchoResponse(req);
  response.data = {
    submissionId: `SUB-${Date.now()}`,
    message: '커스텀 폼 데이터가 성공적으로 제출되었습니다.',
    ...req.body
  };
  res.json(response);
});

// ===== API Select용 데이터 엔드포인트 =====

// 서버 그룹 목록
app.get('/api/server-groups/list', (req, res) => {
  const serverGroups = [
    {
      id: 'SG001',
      name: 'Web Servers',
      description: '웹 서버 그룹',
      servers: ['web-01', 'web-02', 'web-03']
    },
    {
      id: 'SG002',
      name: 'Database Servers',
      description: '데이터베이스 서버 그룹',
      servers: ['db-master', 'db-slave-01', 'db-slave-02']
    },
    {
      id: 'SG003',
      name: 'Application Servers',
      description: '애플리케이션 서버 그룹',
      servers: ['app-01', 'app-02', 'app-03', 'app-04']
    },
    {
      id: 'SG004',
      name: 'Cache Servers',
      description: '캐시 서버 그룹',
      servers: ['redis-01', 'redis-02', 'memcached-01']
    },
    {
      id: 'SG005',
      name: 'Development Servers',
      description: '개발 서버 그룹',
      servers: ['dev-01', 'dev-02', 'dev-03']
    },
    {
      id: 'SG006',
      name: 'Staging Servers',
      description: '스테이징 서버 그룹',
      servers: ['stage-01', 'stage-02']
    },
    {
      id: 'SG007',
      name: 'Production Servers',
      description: '운영 서버 그룹',
      servers: ['prod-01', 'prod-02', 'prod-03', 'prod-04', 'prod-05']
    },
    {
      id: 'SG008',
      name: 'Monitoring Servers',
      description: '모니터링 서버 그룹',
      servers: ['monitor-01', 'grafana-01', 'prometheus-01']
    }
  ];

  res.json({
    success: true,
    data: serverGroups,
    count: serverGroups.length
  });
});

// 사용자 목록 (서버 그룹 정보 포함)
app.get('/api/users/list', (req, res) => {
  const users = [
    {
      id: 'USR001',
      name: '김철수',
      email: 'kim@company.com',
      department: 'IT',
      position: '팀장',
      serverGroups: ['SG001', 'SG003', 'SG007', 'SG008']
    },
    {
      id: 'USR002',
      name: '이영희',
      email: 'lee@company.com',
      department: 'Development',
      position: '개발자',
      serverGroups: ['SG001', 'SG003', 'SG005']
    },
    {
      id: 'USR003',
      name: '박민수',
      email: 'park@company.com',
      department: 'Development',
      position: '개발자',
      serverGroups: ['SG002', 'SG003', 'SG005']
    },
    {
      id: 'USR004',
      name: '최지은',
      email: 'choi@company.com',
      department: 'DevOps',
      position: '엔지니어',
      serverGroups: ['SG001', 'SG002', 'SG003', 'SG004', 'SG006', 'SG007', 'SG008']
    },
    {
      id: 'USR005',
      name: '정승호',
      email: 'jung@company.com',
      department: 'Development',
      position: '시니어 개발자',
      serverGroups: ['SG003', 'SG005', 'SG006']
    },
    {
      id: 'USR006',
      name: '강미영',
      email: 'kang@company.com',
      department: 'QA',
      position: '테스터',
      serverGroups: ['SG005', 'SG006']
    },
    {
      id: 'USR007',
      name: '윤서준',
      email: 'yoon@company.com',
      department: 'Development',
      position: '주니어 개발자',
      serverGroups: ['SG005']
    },
    {
      id: 'USR008',
      name: '한지민',
      email: 'han@company.com',
      department: 'IT',
      position: '시스템 관리자',
      serverGroups: ['SG001', 'SG002', 'SG007', 'SG008']
    }
  ];

  res.json({
    success: true,
    data: users,
    count: users.length
  });
});

// 특정 사용자의 서버 그룹 조회
app.get('/api/users/:userId/server-groups', (req, res) => {
  const { userId } = req.params;

  // 실제로는 DB에서 조회
  const users = [
    { id: 'USR001', serverGroups: ['SG001', 'SG003', 'SG007', 'SG008'] },
    { id: 'USR002', serverGroups: ['SG001', 'SG003', 'SG005'] },
    { id: 'USR003', serverGroups: ['SG002', 'SG003', 'SG005'] },
    { id: 'USR004', serverGroups: ['SG001', 'SG002', 'SG003', 'SG004', 'SG006', 'SG007', 'SG008'] },
    { id: 'USR005', serverGroups: ['SG003', 'SG005', 'SG006'] },
    { id: 'USR006', serverGroups: ['SG005', 'SG006'] },
    { id: 'USR007', serverGroups: ['SG005'] },
    { id: 'USR008', serverGroups: ['SG001', 'SG002', 'SG007', 'SG008'] }
  ];

  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: '사용자를 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    data: {
      userId: user.id,
      serverGroups: user.serverGroups
    }
  });
});

// 직원 목록 (승인 플로우용)
app.get('/api/employees/list', (req, res) => {
  const employees = [
    { id: 'EMP001', name: '김철수', email: 'kim@company.com', department: 'IT', position: '팀장', avatar: null },
    { id: 'EMP002', name: '이영희', email: 'lee@company.com', department: 'HR', position: '부장', avatar: null },
    { id: 'EMP003', name: '박민수', email: 'park@company.com', department: 'Sales', position: '과장', avatar: null },
    { id: 'EMP004', name: '최지은', email: 'choi@company.com', department: 'Marketing', position: '대리', avatar: null },
    { id: 'EMP005', name: '정승호', email: 'jung@company.com', department: 'Finance', position: '차장', avatar: null },
    { id: 'EMP006', name: '강미영', email: 'kang@company.com', department: 'Development', position: '팀장', avatar: null },
    { id: 'EMP007', name: '윤서준', email: 'yoon@company.com', department: 'Management', position: '이사', avatar: null },
    { id: 'EMP008', name: '한지민', email: 'han@company.com', department: 'IT', position: '사원', avatar: null },
    { id: 'EMP009', name: '오준석', email: 'oh@company.com', department: 'Development', position: '선임', avatar: null },
    { id: 'EMP010', name: '신혜원', email: 'shin@company.com', department: 'HR', position: '팀장', avatar: null },
  ];

  res.json({
    success: true,
    data: employees,
    count: employees.length
  });
});

// ===== 승인 관리 API =====

// 내 승인 목록 조회 (대기중 + 완료)
app.get('/api/approvals/my-approvals', (req, res) => {
  const { employeeId } = req.query;

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: 'employeeId는 필수입니다.'
    });
  }

  const approvals = [];

  // 모든 제출 데이터를 순회하며 승인 플로우 확인
  formSubmissions.forEach((submission) => {
    if (submission.approvalFlow && submission.approvalFlow.approvers) {
      submission.approvalFlow.approvers.forEach((approver) => {
        if (approver.employee.id === employeeId) {
          // 승인자 ID 생성 (실제로는 DB에 저장되어야 함)
          const approverId = `${submission.id}-${approver.employee.id}-${approver.order}`;

          // 현재 단계 확인 (병렬이 아닌 경우)
          const isMyTurn = submission.approvalFlow.allowParallel ||
                          (submission.approvalFlow.currentStep === approver.order);

          // 플로우 상태 결정
          let flowStatus = 'pending';
          if (submission.status === 'approved') {
            flowStatus = 'approved';
          } else if (submission.status === 'rejected') {
            flowStatus = 'rejected';
          } else if (approver.status === 'approved' || approver.status === 'rejected') {
            flowStatus = 'in_progress';
          }

          approvals.push({
            id: approverId,
            submissionId: submission.id,
            formName: submission.formName,
            submittedByName: submission.submittedByName,
            submittedAt: submission.submittedAt,
            order: approver.order,
            isMandatory: approver.isMandatory,
            status: approver.status || 'pending',
            actionAt: approver.actionAt || null,
            actionComment: approver.actionComment || null,
            flowStatus: flowStatus,
            currentStep: submission.approvalFlow.currentStep || 1,
            totalSteps: submission.approvalFlow.approvers.length,
            isMyTurn: isMyTurn
          });
        }
      });
    }
  });

  res.json({
    success: true,
    data: approvals,
    count: approvals.length
  });
});

// 승인 처리
app.post('/api/approvals/:approverId/approve', (req, res) => {
  const { approverId } = req.params;
  const { employeeId, comment } = req.body;

  // approverId 파싱: submissionId-employeeId-order
  const parts = approverId.split('-');
  if (parts.length < 3) {
    return res.status(400).json({
      success: false,
      message: '잘못된 승인자 ID입니다.'
    });
  }

  const submissionId = parts.slice(0, -2).join('-');
  const order = parseInt(parts[parts.length - 1]);
  const submission = formSubmissions.get(submissionId);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: '제출 데이터를 찾을 수 없습니다.'
    });
  }

  if (!submission.approvalFlow || !submission.approvalFlow.approvers) {
    return res.status(400).json({
      success: false,
      message: '승인 플로우가 설정되지 않았습니다.'
    });
  }

  // 해당 승인자 찾기
  const approver = submission.approvalFlow.approvers.find(
    a => a.employee.id === employeeId && a.order === order
  );

  if (!approver) {
    return res.status(404).json({
      success: false,
      message: '승인 권한이 없습니다.'
    });
  }

  // 이미 처리된 경우
  if (approver.status === 'approved' || approver.status === 'rejected') {
    return res.status(400).json({
      success: false,
      message: '이미 처리된 승인 건입니다.'
    });
  }

  // 순차 승인인 경우 현재 순서 확인
  if (!submission.approvalFlow.allowParallel) {
    const currentStep = submission.approvalFlow.currentStep || 1;
    if (approver.order !== currentStep) {
      return res.status(400).json({
        success: false,
        message: '현재 승인 순서가 아닙니다.'
      });
    }
  }

  // 승인 처리
  approver.status = 'approved';
  approver.actionAt = new Date().toISOString();
  approver.actionComment = comment || null;

  // 다음 단계 확인
  let allApproved = true;
  let nextStep = submission.approvalFlow.currentStep || 1;

  if (submission.approvalFlow.allowParallel) {
    // 병렬 승인: 모든 필수 승인자가 승인했는지 확인
    for (const app of submission.approvalFlow.approvers) {
      if (app.isMandatory && app.status !== 'approved') {
        allApproved = false;
        break;
      }
    }
  } else {
    // 순차 승인: 다음 단계로 이동
    nextStep = approver.order + 1;
    submission.approvalFlow.currentStep = nextStep;

    // 다음 승인자가 있는지 확인
    if (nextStep > submission.approvalFlow.approvers.length) {
      allApproved = true;
    } else {
      allApproved = false;
    }
  }

  // 모든 승인이 완료된 경우
  if (allApproved) {
    submission.status = 'approved';
    submission.processedAt = new Date().toISOString();
  }

  // 업데이트된 제출 데이터 저장
  formSubmissions.set(submissionId, submission);

  res.json({
    success: true,
    data: {
      approverId,
      status: 'approved',
      actionAt: approver.actionAt,
      flowStatus: allApproved ? 'approved' : 'in_progress',
      submissionStatus: submission.status
    },
    message: '승인이 완료되었습니다.'
  });
});

// 거부 처리
app.post('/api/approvals/:approverId/reject', (req, res) => {
  const { approverId } = req.params;
  const { employeeId, comment } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({
      success: false,
      message: '거부 사유는 필수입니다.'
    });
  }

  // approverId 파싱
  const parts = approverId.split('-');
  if (parts.length < 3) {
    return res.status(400).json({
      success: false,
      message: '잘못된 승인자 ID입니다.'
    });
  }

  const submissionId = parts.slice(0, -2).join('-');
  const order = parseInt(parts[parts.length - 1]);
  const submission = formSubmissions.get(submissionId);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: '제출 데이터를 찾을 수 없습니다.'
    });
  }

  if (!submission.approvalFlow || !submission.approvalFlow.approvers) {
    return res.status(400).json({
      success: false,
      message: '승인 플로우가 설정되지 않았습니다.'
    });
  }

  // 해당 승인자 찾기
  const approver = submission.approvalFlow.approvers.find(
    a => a.employee.id === employeeId && a.order === order
  );

  if (!approver) {
    return res.status(404).json({
      success: false,
      message: '승인 권한이 없습니다.'
    });
  }

  // 이미 처리된 경우
  if (approver.status === 'approved' || approver.status === 'rejected') {
    return res.status(400).json({
      success: false,
      message: '이미 처리된 승인 건입니다.'
    });
  }

  // 거부 처리
  approver.status = 'rejected';
  approver.actionAt = new Date().toISOString();
  approver.actionComment = comment;

  // 제출 상태를 거부로 변경
  submission.status = 'rejected';
  submission.processedAt = new Date().toISOString();
  submission.statusMessage = comment;

  // 업데이트된 제출 데이터 저장
  formSubmissions.set(submissionId, submission);

  res.json({
    success: true,
    data: {
      approverId,
      status: 'rejected',
      actionAt: approver.actionAt,
      flowStatus: 'rejected',
      submissionStatus: 'rejected'
    },
    message: '거부가 완료되었습니다.'
  });
});

// 계정 목록
app.get('/api/accounts/list', (req, res) => {
  const accounts = [
    { accountId: 'ACC001', accountName: 'admin@company.com', department: 'IT', status: 'active' },
    { accountId: 'ACC002', accountName: 'user1@company.com', department: 'Sales', status: 'active' },
    { accountId: 'ACC003', accountName: 'user2@company.com', department: 'Marketing', status: 'active' },
    { accountId: 'ACC004', accountName: 'user3@company.com', department: 'HR', status: 'inactive' },
    { accountId: 'ACC005', accountName: 'user4@company.com', department: 'Finance', status: 'active' },
    { accountId: 'ACC006', accountName: 'dev1@company.com', department: 'Development', status: 'active' },
    { accountId: 'ACC007', accountName: 'dev2@company.com', department: 'Development', status: 'active' },
    { accountId: 'ACC008', accountName: 'manager@company.com', department: 'Management', status: 'active' },
  ];

  res.json({
    success: true,
    data: accounts,
    count: accounts.length
  });
});

// 서버 타입 목록
app.get('/api/servers/types', (req, res) => {
  const serverTypes = [
    { typeId: 'WEB01', typeName: 'Apache Web Server', category: 'web', specs: '4 CPU, 8GB RAM' },
    { typeId: 'WEB02', typeName: 'Nginx Web Server', category: 'web', specs: '4 CPU, 8GB RAM' },
    { typeId: 'APP01', typeName: 'Node.js Application Server', category: 'app', specs: '8 CPU, 16GB RAM' },
    { typeId: 'APP02', typeName: 'Java Application Server', category: 'app', specs: '8 CPU, 16GB RAM' },
    { typeId: 'DB01', typeName: 'MySQL Database', category: 'database', specs: '16 CPU, 32GB RAM' },
    { typeId: 'DB02', typeName: 'PostgreSQL Database', category: 'database', specs: '16 CPU, 32GB RAM' },
    { typeId: 'DB03', typeName: 'MongoDB Database', category: 'database', specs: '8 CPU, 16GB RAM' },
    { typeId: 'CACHE01', typeName: 'Redis Cache', category: 'cache', specs: '4 CPU, 16GB RAM' },
  ];

  res.json({
    success: true,
    data: serverTypes,
    count: serverTypes.length
  });
});

// 리소스 타입 목록
app.get('/api/resources/types', (req, res) => {
  const resourceTypes = [
    { id: 'CPU', name: 'CPU 코어', unit: 'cores', maxAllocation: 32 },
    { id: 'RAM', name: 'RAM 메모리', unit: 'GB', maxAllocation: 128 },
    { id: 'DISK', name: '디스크 저장소', unit: 'TB', maxAllocation: 10 },
    { id: 'GPU', name: 'GPU', unit: 'units', maxAllocation: 4 },
    { id: 'BANDWIDTH', name: '네트워크 대역폭', unit: 'Gbps', maxAllocation: 10 },
  ];

  res.json({
    success: true,
    data: resourceTypes,
    count: resourceTypes.length
  });
});

// ===== 범용 Echo 엔드포인트 (모든 경로) =====
app.all('/api/*', (req, res) => {
  const response = createEchoResponse(req);
  response.message = `정의되지 않은 엔드포인트입니다. Echo 응답을 반환합니다.`;
  res.json(response);
});

// ===== 헬스 체크 =====
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===== 루트 경로 =====
app.get('/', (req, res) => {
  res.json({
    message: 'Dynamic Form API Server',
    version: '1.0.0',
    endpoints: [
      'POST /api/selectServer',
      'POST /api/request',
      'POST /api/server',
      'POST /api/features',
      'POST /api/user/create',
      'POST /api/user/settings',
      'POST /api/daterange/test',
      'POST /api/daterange/simple',
      'POST /api/modalselect/test',
      'POST /api/forms/save',
      'GET /api/forms/list',
      'GET /api/forms/:formId',
      'DELETE /api/forms/:formId',
      'POST /api/custom-form',
      'GET /api/employees/list',
      'GET /api/accounts/list',
      'GET /api/servers/types',
      'GET /api/resources/types',
      'GET /health'
    ],
    savedFormsCount: savedForms.size
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: '서버 오류가 발생했습니다.',
    error: err.message
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 API Server is running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API endpoints: http://localhost:${PORT}/`);
  console.log('=================================');
});
