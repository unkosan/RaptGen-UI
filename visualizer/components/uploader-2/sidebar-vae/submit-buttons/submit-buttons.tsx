import { ButtonToolbar } from "react-bootstrap";
import { Button } from "react-bootstrap";
import { useDispatch } from "react-redux";

type Props = {
  submitDisabled: boolean;
};

// TODO: implement submit button
const SubmitButtons: React.FC<Props> = (props) => {
  const dispatch = useDispatch();

  const handleBack = () => {
    dispatch({
      type: "uploadConfig/setRoute",
      payload: "/vae/encode",
    });
  };

  return (
    <>
      <ButtonToolbar className="justify-content-between">
        <Button className="col-3" onClick={handleBack}>
          Back
        </Button>
        <Button className="col-3">Submit</Button>
      </ButtonToolbar>
    </>
  );
};

export default SubmitButtons;
