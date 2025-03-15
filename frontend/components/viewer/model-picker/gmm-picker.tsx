import { Form } from "react-bootstrap";
import { usePickGMM } from "./hooks/use-dispatchers";

/**
 * GMM model picker. Renders a dropdown menu of GMM models.
 * @param param0 {
 *  entries: {
 *    uuid: string,
 *    name: string,
 *  }[],
 * }
 * @returns
 */
const GMMPicker: React.FC<{
  entries: {
    uuid: string;
    name: string;
  }[];
}> = ({ entries }) => {
  const { modelId, setModelId } = usePickGMM();

  return (
    <Form.Select
      value={modelId}
      onChange={(e) => {
        setModelId(e.target.value);
      }}
    >
      {entries.map((model, index) => (
        <option key={index} value={model.uuid}>
          {model.name}
        </option>
      ))}
    </Form.Select>
  );
};

export default GMMPicker;
