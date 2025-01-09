import { Navbar, Nav, Container } from "react-bootstrap";

type Props = {
  currentPage:
    | ""
    | "viewer"
    | "uploader"
    | "vae-trainer"
    | "gmm-trainer"
    | "bayesopt";
};

const Navigator: React.FC<Props> = ({ currentPage }) => {
  return (
    <Navbar bg="primary" variant="dark">
      <Container>
        <Navbar.Brand href="/">RaptGen-UI</Navbar.Brand>
        <Nav className="ms-auto">
          <Nav.Link
            href="/viewer"
            className={currentPage === "viewer" ? "text-white" : ""}
          >
            Viewer
          </Nav.Link>
          {/* <Nav.Link
            href="/uploader"
            className={currentPage === "uploader" ? "text-white" : ""}
          >
            Uploader
          </Nav.Link> */}
          <Nav.Link
            href="/trainer"
            className={currentPage === "vae-trainer" ? "text-white" : ""}
          >
            VAE Trainer
          </Nav.Link>
          <Nav.Link
            href="/gmm"
            className={currentPage === "gmm-trainer" ? "text-white" : ""}
          >
            GMM Trainer
          </Nav.Link>
          <Nav.Link
            href="/bayesopt"
            className={currentPage === "bayesopt" ? "text-white" : ""}
          >
            Bayesian Optimization
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Navigator;
