import { Button, Spinner } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { usePreprocessSelexData } from "./hooks/use-pagenation";

const NavigatorPreprocess: React.FC = () => {
  const { isLoading, onClickNext, onClickBack, canProceed } =
    usePreprocessSelexData();

  return (
    <div className="d-flex justify-content-between my-3">
      <Button onClick={onClickBack} variant="primary">
        <div className="align-items-center d-flex">
          <ChevronLeft />
          &nbsp; Back
        </div>
      </Button>
      <Button
        onClick={onClickNext}
        disabled={!canProceed || isLoading}
        variant="primary"
      >
        {isLoading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          <div className="align-items-center d-flex">
            Next &nbsp;
            <ChevronRight />
          </div>
        )}
      </Button>
    </div>
  );
};

export default NavigatorPreprocess;
