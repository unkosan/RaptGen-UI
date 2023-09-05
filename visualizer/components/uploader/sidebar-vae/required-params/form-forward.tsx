import axios from "axios";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useEffect, useState } from "react";
import { altApiClient } from "../../../../services/api-client";

type Props = {
  value: string;
  isValid: boolean;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
  targetLength: number;
  targetLengthIsValid: boolean;
};

const FormForward: React.FC<Props> = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sequences = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData.sequences
  );
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/T/g, "U");
    props.setIsValid(/^[AUGC]*$/.test(value));
    props.setValue(value);
  };

  const handleEstimate = () => setIsLoading(true);

  useEffect(() => {
    if (isLoading) {
      (async () => {
        const res = await altApiClient.estimateAdapters({
          target_length: props.targetLength,
          sequences: sequences,
        });
        console.log(res);

        if (res.status === "success") {
          const value: string = res.data.forward_adapter;
          props.setValue(value);
          props.setIsValid(true);
        }
      })().then(() => {
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  return (
    <Form.Group className="mb-3">
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="A, U, C, G only"
          value={props.value}
          onChange={handleChange}
        />
        <Button
          variant="outline-primary"
          onClick={handleEstimate}
          disabled={!props.targetLengthIsValid || isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : "Estimate"}
        </Button>
      </InputGroup>
    </Form.Group>
  );
};

export default FormForward;
