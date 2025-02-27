import { Card, Form, InputGroup } from "react-bootstrap";
import RangeSlider from "react-bootstrap-range-slider";
import { useCoords, useGridConfig } from "./hooks/use-decoder-input";

const DecoderInput: React.FC = () => {
  const { pointX, pointY, isValidX, isValidY, onChangeX, onChangeY } =
    useCoords();
  const { showGrid, onChangeShowGrid } = useGridConfig();

  return (
    <Card className="mb-3">
      <Card.Header>Point Decoder Input</Card.Header>
      <Card.Body>
        <Form.Switch
          label="Show Grid Line"
          checked={showGrid}
          onChange={onChangeShowGrid}
          className="mb-2"
        />
        <InputGroup hasValidation>
          <InputGroup.Text>X :</InputGroup.Text>
          <InputGroup.Text
            style={{
              backgroundColor: "white",
            }}
          >
            <RangeSlider
              value={pointX}
              onChange={onChangeX}
              min={-3.5}
              max={3.5}
              step={0.1}
            />
          </InputGroup.Text>
          <Form.Control
            type="number"
            step={0.1}
            value={pointX}
            onChange={onChangeX}
            isInvalid={!isValidX}
          />
          <Form.Control.Feedback type="invalid">
            Invalid X value
          </Form.Control.Feedback>
        </InputGroup>
        <InputGroup hasValidation>
          <InputGroup.Text>Y :</InputGroup.Text>
          <InputGroup.Text
            style={{
              backgroundColor: "white",
            }}
          >
            <RangeSlider
              value={pointY}
              onChange={onChangeY}
              min={-3.5}
              max={3.5}
              step={0.1}
            />
          </InputGroup.Text>
          <Form.Control
            className="w-25"
            type="number"
            step={0.1}
            value={pointY}
            onChange={onChangeY}
            isInvalid={!isValidY}
          />
          <Form.Control.Feedback type="invalid">
            Invalid Y value
          </Form.Control.Feedback>
        </InputGroup>
      </Card.Body>
    </Card>
  );
};

export default DecoderInput;
