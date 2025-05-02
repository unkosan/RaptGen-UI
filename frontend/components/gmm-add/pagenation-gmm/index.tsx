import { Button, Spinner } from "react-bootstrap";
import { useSubmitJob } from "./hooks/use-submit-job";

const PagenationGMM: React.FC = () => {
  const { isLoading, canTrain, handleClickTrain, handleClickBack } =
    useSubmitJob();

  return (
    <div className="d-flex justify-content-between my-3">
      <Button variant="primary" onClick={handleClickBack}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleClickTrain} disabled={!canTrain}>
        {isLoading ? <Spinner animation="border" size="sm" /> : "Train"}
      </Button>
    </div>
  );
};

export default PagenationGMM;
