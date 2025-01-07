import { Github, House, JournalText } from "react-bootstrap-icons";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-secondary">
      <div className="container d-flex flex-wrap justify-content-between align-items-center py-3">
        <div className="col-md-4 d-flex align-items-center text-white">
          <span>
            {/* R. Nakano et al., Hamada Lab., 2025, Rights under MIT License. */}
            © 2025 Hamada Lab. Released under the MIT License.
          </span>
        </div>
        <ul className="nav col-md-4 justify-content-end list-unstyled d-flex">
          <li className="ms-3">
            <a href="/">
              <House size={24} color="white" />
            </a>
          </li>
          <li className="ms-3">
            <a href="https://github.com/unkosan/RaptGen-UI">
              <Github size={24} color="white" />
            </a>
          </li>
          <li className="ms-3">
            <a href="https://www.biorxiv.org/">
              <JournalText size={24} color="white" />
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
