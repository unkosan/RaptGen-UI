import { useEffect, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import axios from "axios";

type Props = {
  value: number;
  isValid: boolean;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const FormTargetLength: React.FC<Props> = (props) => {
  const sequences = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData.sequences
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    props.setIsValid(!isNaN(value) && value > 0);
    props.setValue(value);
  };

  const handleEstimate = () => {
    (async () => {
      const res = await axios
        .post("/upload/estimate-target-length", {
          sequences: sequences,
        })
        .then((res) => res.data);

      if (res.status === "success") {
        const value: number = res.data["target_length"];
        props.setValue(value);
        props.setIsValid(true);
      }
    })();
  };

  return (
    <InputGroup>
      <Form.Control
        value={props.value}
        onChange={handleChange}
        type="number"
        placeholder="Please enter the target length"
        isInvalid={!props.isValid}
      />
      <Button variant="outline-primary" onClick={handleEstimate}>
        Estimate
      </Button>
    </InputGroup>
  );
};

export default FormTargetLength;
