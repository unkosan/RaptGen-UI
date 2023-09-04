import React from "react";
import { Form } from "react-bootstrap";

const availableModelTypes = [
  "RaptGen",
  // "RaptGen-freq",
  // "RaptGen-logfreq",
  // "RaptGen2"
];

const ModelTypeSelect: React.FC = () => {
  const [modelType, setModelType] = React.useState(availableModelTypes[0]);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModelType(e.target.value);
  };

  return (
    <Form className="mb-3">
      <Form.Select value={modelType} onChange={onChange}>
        {availableModelTypes.map((modelType) => (
          <option key={modelType}>{modelType}</option>
        ))}
      </Form.Select>
    </Form>
  );
};

export default ModelTypeSelect;
