import { Button } from "react-bootstrap";
// icons of left and right page
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";

const Pagination: React.FC = () => {
  return (
    <div className="d-flex justify-content-between my-3">
      <Button variant="primary">
        <ChevronLeft />
        Back
      </Button>
      <Button variant="primary">
        Next
        <ChevronRight />
      </Button>
    </div>
  );
};

export default Pagination;
