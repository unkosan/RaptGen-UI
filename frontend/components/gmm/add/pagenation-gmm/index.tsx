import { Button, Spinner } from "react-bootstrap";
import { useSubmitJob } from "./hooks/use-submit-job";

const PagenationGMM: React.FC = () => {
  const { isLoading, canTrain, onClickTrain, onClickBack } = useSubmitJob();

  return (
    <div className="d-flex justify-content-between my-3">
      <Button variant="primary" onClick={onClickBack}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onClickTrain} disabled={!canTrain}>
        {isLoading ? <Spinner animation="border" size="sm" /> : "Train"}
      </Button>
    </div>
  );
};

export default PagenationGMM;
