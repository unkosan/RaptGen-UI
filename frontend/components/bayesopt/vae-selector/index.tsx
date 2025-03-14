import { Form } from "react-bootstrap";
import { useVaeSelector } from "./hooks/use-vae-selector";

const VaeSelector: React.FC = () => {
  const { models, selectedModel, handleModelChange } = useVaeSelector();

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Select value={selectedModel} onChange={handleModelChange}>
          {models.map((model, i) => (
            <option key={i} value={model.uuid}>
              {model.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </>
  );
};

export default VaeSelector;
