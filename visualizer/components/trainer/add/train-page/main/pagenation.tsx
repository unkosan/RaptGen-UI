import React from "react";
import { Button, Spinner } from "react-bootstrap";
import { ChevronLeft } from "react-bootstrap-icons";
import { useDispatch } from "react-redux";

const Pagenation: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const dispatch = useDispatch();
  const onClickBack = () => {
    dispatch({
      type: "pageConfig/setPseudoRoute",
      payload: "/selex",
    });
  };

  const onClickTrain = () => {
    setIsLoading(true);
  };

  return (
    <div className="d-flex justify-content-between my-3">
      <Button onClick={onClickBack} variant="primary">
        <ChevronLeft />
        Back
      </Button>
      <Button onClick={onClickTrain} variant="primary">
        {isLoading ? <Spinner animation="border" size="sm" /> : "Train"}
      </Button>
    </div>
  );
};

export default Pagenation;
