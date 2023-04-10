import { Navbar, Nav, Container } from "react-bootstrap";

const Navigator: React.FC = () => {
  return (
    <Navbar bg="primary" variant="dark">
      <Container>
        <Navbar.Brand>RaptGen Visualizer</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="/viewer">Viewer</Nav.Link>
          <Nav.Link href="/uploader">Uploader</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};