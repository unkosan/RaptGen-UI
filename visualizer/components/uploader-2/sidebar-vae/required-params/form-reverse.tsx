import axios from "axios";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

type Props = {
  value: string;
  isValid: boolean;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
  targetLength: number;
  targetLengthIsValid: boolean;
};

const FormReverse: React.FC<Props> = (props) => {
  const sequences = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData.sequences
  );
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/T/g, "U");
    props.setIsValid(/^[AUGC]*$/.test(value));
    props.setValue(value);
  };

  const handleEstimate = () => {
    (async () => {
      const res = await axios
        .post("/upload/estimate-adapters", {
          target_length: props.targetLength,
          sequences: sequences,
        })
        .then((res) => res.data);

      if (res.status === "success") {
        const value: string = res.data["reverse_adapter"];
        props.setValue(value);
        props.setIsValid(true);
      }
    })();
  };

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
          disabled={!props.targetLengthIsValid}
        >
          Estimate
        </Button>
      </InputGroup>
    </Form.Group>
  );
};

export default FormReverse;
