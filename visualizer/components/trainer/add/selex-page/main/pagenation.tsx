import { Button } from "react-bootstrap";
// icons of left and right page
import { ChevronLeft, ChevronRight } from "react-bootstrap-icons";
import { useDispatch } from "react-redux";

const Pagination: React.FC = () => {
  const dispatch = useDispatch();

  const onClickNext = () => {
    dispatch({
      type: "pageConfig/setPseudoRoute",
      payload: "/train",
    });
  };

  return (
    <div className="d-flex justify-content-between my-3">
      <Button href="/trainer" variant="primary">
        <ChevronLeft />
        Back
      </Button>
      <Button onClick={onClickNext} variant="primary">
        Next
        <ChevronRight />
      </Button>
    </div>
  );
};

export default Pagination;
