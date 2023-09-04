import { useEffect, useState } from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import axios from "axios";
import { altApiClient } from "../../../../services/alt-api-client";

type Props = {
  value: number;
  isValid: boolean;
  setValue: React.Dispatch<React.SetStateAction<number>>;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const FormTargetLength: React.FC<Props> = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // raw input value, this may be string or number
  const [value, setValue] = useState<string>("");

  const sequences = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData.sequences
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    const numValue = parseInt(e.target.value);
    props.setValue(numValue);
    props.setIsValid(!isNaN(numValue) && numValue > 0);
  };

  const handleEstimate = () => setIsLoading(true);

  useEffect(() => {
    if (isLoading) {
      (async () => {
        const res = await altApiClient.estimateTargetLength({
          sequences: sequences,
        });

        if (res.status === "success") {
          const value: number = res.data;
          setValue(value.toString());
          props.setValue(value);
          props.setIsValid(true);
        }
      })().then(() => {
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  return (
    <InputGroup>
      <Form.Control
        value={value}
        onChange={handleChange}
        type="number"
        placeholder="Please enter the target length"
        isInvalid={!props.isValid && value !== ""}
      />
      <Button
        variant="outline-primary"
        disabled={isLoading}
        onClick={handleEstimate}
      >
        {isLoading ? <Spinner size="sm" /> : "Estimate"}
      </Button>
    </InputGroup>
  );
};

export default FormTargetLength;
