import {
  Button,
  Form,
  InputGroup,
  OverlayTrigger,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";

type Props = {
  valueForward: string;
  isValidForward: boolean;
  setValueForward: React.Dispatch<React.SetStateAction<string>>;
  setIsValidForward: React.Dispatch<React.SetStateAction<boolean>>;
  valueReverse: string;
  isValidReverse: boolean;
  setValueReverse: React.Dispatch<React.SetStateAction<string>>;
  setIsValidReverse: React.Dispatch<React.SetStateAction<boolean>>;
  targetLength: number;
  targetLengthIsValid: boolean;
};

const FormAdapters: React.FC<Props> = (props) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sequences = useSelector(
    (state: RootState) => state.selexData.sequences
  );

  const handleEstimate = () => setIsLoading(true);

  const handleForwardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/T/g, "U");
    props.setIsValidForward(/^[AUGC]*$/.test(value));
    props.setValueForward(value);
  };

  const handleReverseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/T/g, "U");
    props.setIsValidReverse(/^[AUGC]*$/.test(value));
    props.setValueReverse(value);
  };

  useEffect(() => {
    if (isLoading) {
      (async () => {
        const res = await apiClient.estimateAdapters({
          target_length: props.targetLength,
          sequences: sequences,
        });

        if (res.status === "success") {
          props.setValueForward(res.data["forward_adapter"]);
          props.setValueReverse(res.data["reverse_adapter"]);
          props.setIsValidForward(true);
          props.setIsValidReverse(true);
        }
      })().then(() => {
        setIsLoading(false);
      });
    }
  }, [isLoading]);

  return (
    <Form.Group className="mb-3">
      <Form.Label>Adapters</Form.Label>
      <InputGroup>
        <Form.Control
          type="text"
          placeholder="Forward adapter"
          value={props.valueForward}
          onChange={handleForwardChange}
          isInvalid={!props.isValidForward && props.valueForward.length > 0}
        />
        <Form.Control
          type="text"
          placeholder="Reverse adapter"
          value={props.valueReverse}
          onChange={handleReverseChange}
          isInvalid={!props.isValidReverse && props.valueReverse.length > 0}
        />
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id="tooltip-estimate-button">
              You need to fill in the target length first to estimate adapters.
            </Tooltip>
          }
          show={!props.targetLengthIsValid ? undefined : false}
        >
          <span className="d-inline-block">
            <Button
              variant="outline-primary"
              onClick={handleEstimate}
              disabled={
                !props.targetLengthIsValid ||
                isLoading ||
                sequences.length === 0
              }
            >
              {isLoading ? <Spinner size="sm" /> : "Estimate"}
            </Button>
          </span>
        </OverlayTrigger>
      </InputGroup>
    </Form.Group>
  );
};

export default FormAdapters;
