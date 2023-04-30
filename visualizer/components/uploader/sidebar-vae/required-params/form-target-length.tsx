import { useEffect, useState } from "react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sequences = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData.sequences
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    props.setIsValid(!isNaN(value) && value > 0);
    props.setValue(value);
  };

  const handleEstimate = () => setIsLoading(true);

  useEffect(() => {
    if (isLoading) {
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
      })().then(() => {
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  return (
    <InputGroup>
      <Form.Control
        value={props.value}
        onChange={handleChange}
        type="number"
        placeholder="Please enter the target length"
        isInvalid={!props.isValid}
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
