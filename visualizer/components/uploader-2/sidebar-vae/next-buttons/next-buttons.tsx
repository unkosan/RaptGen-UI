import { ButtonToolbar } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useDispatch } from "react-redux";

type Props = {
  nextDisabled: boolean;
};

const NextButtons: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  const handleBack = () => {
    dispatch({
      type: "uploadConfig/setRoute",
      payload: "/vae/home",
    });
  };

  const handleNext = () => {
    dispatch({
      type: "uploadConfig/setRoute",
      payload: "/vae/submit",
    });
  };

  return (
    <>
      <ButtonToolbar className="justify-content-between">
        <Button className="col-3" onClick={handleBack}>
          Back
        </Button>
        <Button
          disabled={props.nextDisabled}
          className="col-3"
          onClick={handleNext}
        >
          Next
        </Button>
      </ButtonToolbar>
    </>
  );
};

export default NextButtons;
