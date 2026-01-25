import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import FormBuilder from "./pages/FormBuilder";
import FormTest from "./pages/FormTest";
import Examples from "./pages/Examples";
import FormCodeExamples from "./pages/FormCodeExamples";
import SubmissionList from "./pages/SubmissionList";
import SubmissionDetail from "./pages/SubmissionDetail";

const App: React.FC = () => {
  return (
    <Router>
      <div>
        {/* 네비게이션 바 */}
        <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Navbar.Brand as={Link} to="/">
              Dynamic Form
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">
                  예제
                </Nav.Link>
                <Nav.Link as={Link} to="/form-codes">
                  폼 코드 예제
                </Nav.Link>
                <Nav.Link as={Link} to="/form-builder">
                  폼 빌더
                </Nav.Link>
                <Nav.Link as={Link} to="/form-test">
                  폼 테스트
                </Nav.Link>
                <Nav.Link as={Link} to="/submissions">
                  제출 현황
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* 라우트 */}
        <Routes>
          <Route path="/" element={<Examples />} />
          <Route path="/form-codes" element={<FormCodeExamples />} />
          <Route path="/form-builder" element={<FormBuilder />} />
          <Route path="/form-test" element={<FormTest />} />
          <Route path="/submissions" element={<SubmissionList />} />
          <Route path="/submissions/:id" element={<SubmissionDetail />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
