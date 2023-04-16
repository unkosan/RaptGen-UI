import { Form } from "react-bootstrap";

type Props = {
  value: boolean | undefined;
  setValue: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  label: string;
};

// if empty, value equals undefined
const BooleanForm: React.FC<Props> = (props) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawValue = e.target.value;
    if (rawValue) {
      const value = e.target.value === "true";
      props.setValue(value);
    } else {
      const value = undefined;
      props.setValue(value);
    }
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{props.label}</Form.Label>
      <Form.Select
        value={props.value?.toString() ?? ""}
        defaultValue=""
        onChange={handleChange}
      >
        <option value="">Not Seleted</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </Form.Select>
    </Form.Group>
  );
};

export default BooleanForm;
