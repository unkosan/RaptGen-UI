import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { Github, House, JournalText } from "react-bootstrap-icons";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-secondary">
      <div className="container d-flex flex-wrap justify-content-between align-items-center py-3">
        <div className="col-md-4 d-flex align-items-center text-white">
          <span>© 2025 Hamada Lab. Released under the MIT License.</span>
        </div>
        <ul className="nav col-md-4 justify-content-end list-unstyled d-flex">
          <li className="ms-3">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id="tooltip-home">Go to the top page</Tooltip>}
            >
              <a href="/">
                <House size={24} color="white" />
              </a>
            </OverlayTrigger>
          </li>
          <li className="ms-3">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id="tooltip-github">GitHub repository</Tooltip>}
            >
              <a href="https://github.com/unkosan/RaptGen-UI">
                <Github size={24} color="white" />
              </a>
            </OverlayTrigger>
          </li>
          <li className="ms-3">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id="tooltip-biorxiv">Preprint</Tooltip>}
            >
              <a href="https://www.biorxiv.org/">
                <JournalText size={24} color="white" />
              </a>
            </OverlayTrigger>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
