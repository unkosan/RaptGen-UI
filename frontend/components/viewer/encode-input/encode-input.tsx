import { Button, Card, Form, InputGroup, Spinner } from "react-bootstrap";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useFastaEncoder, useFormEncoder } from "./hooks/use-encoder-input";
import { PlusLg } from "react-bootstrap-icons";

const EncodeInput: React.FC = () => {
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const {
    isLoading: isLoadingFasta,
    isValid: isValidFasta,
    onFileChange,
  } = useFastaEncoder(sessionId);
  const {
    value: formValue,
    isLoading: isLoadingForm,
    isValid: isValidForm,
    onChange: onChangeForm,
    onAdd: onAddForm,
  } = useFormEncoder(sessionId);

  return (
    <Card className="mb-3">
      <Card.Header>Encoder Input</Card.Header>
      <Card.Body>
        <InputGroup hasValidation className="mb-2">
          <Form.Control
            id="newSeqInput"
            onChange={onChangeForm}
            value={formValue}
            isInvalid={!(isValidForm || formValue === "")}
          />
          <Button
            id="addSeqButton"
            disabled={!isValidForm || isLoadingForm}
            onClick={onAddForm}
          >
            {isLoadingForm ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <div className="d-flex align-items-center">
                <PlusLg />
              </div>
            )}
          </Button>
          <Form.Control.Feedback type="invalid">
            Please enter a valid sequence.
          </Form.Control.Feedback>
        </InputGroup>
        <Form.Text>From fasta file</Form.Text>
        <Form.Group>
          {isLoadingFasta ? (
            // <Spinner animation="border" size="sm" />
            <InputGroup>
              <InputGroup.Text className="w-100">
                <div className="d-flex align-items-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading...
                </div>
              </InputGroup.Text>
            </InputGroup>
          ) : (
            <Form.Control
              type="file"
              onChange={onFileChange}
              isInvalid={!isValidFasta}
            />
          )}
          <Form.Control.Feedback type="invalid">
            Invalid FASTA file
          </Form.Control.Feedback>
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default EncodeInput;
