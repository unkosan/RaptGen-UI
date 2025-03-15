import { Spinner } from "react-bootstrap";

const LoadingPane: React.FC<{
  label: string;
}> = ({ label }) => {
  return (
    <div className="d-flex justify-content-center h-100 w-100">
      <div className="mx-auto d-flex align-items-center">
        <Spinner
          animation="border"
          variant="primary"
          role="status"
          className="mx-auto"
        />
        <div className="ms-2 fs-3">{label}</div>
      </div>
    </div>
  );
};

export default LoadingPane;
