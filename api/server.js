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
