import { Button, Spinner } from "react-bootstrap";
import { ChevronLeft } from "react-bootstrap-icons";
import { useSubmitJob } from "./hooks/use-submit-job";

const NavigatorTrain: React.FC = () => {
  const { isLoading, canTrain, onClickTrain, onClickBack } = useSubmitJob();

  return (
    <div className="d-flex justify-content-between my-3">
      <Button onClick={onClickBack} variant="primary">
        <div className="align-items-center d-flex">
          <ChevronLeft />
          &nbsp; Back
        </div>
      </Button>
      <Button
        onClick={onClickTrain}
        variant="primary"
        disabled={!canTrain || isLoading}
      >
        {isLoading ? <Spinner animation="border" size="sm" /> : "Train"}
      </Button>
    </div>
  );
};

export default NavigatorTrain;
