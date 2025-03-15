import { Button, Spinner } from "react-bootstrap";
import { ChevronLeft } from "react-bootstrap-icons";
import { useSubmitJob } from "./hooks/use-submit-job";

const NavigatorTrain: React.FC = () => {
  const { isLoading, canTrain, handleClickTrain, handleClickBack } =
    useSubmitJob();

  return (
    <div className="d-flex justify-content-between my-3">
      <Button onClick={handleClickBack} variant="primary">
        <div className="align-items-center d-flex">
          <ChevronLeft />
          &nbsp; Back
        </div>
      </Button>
      <Button
        onClick={handleClickTrain}
        variant="primary"
        disabled={!canTrain || isLoading}
      >
        {isLoading ? <Spinner animation="border" size="sm" /> : "Train"}
      </Button>
    </div>
  );
};

export default NavigatorTrain;
