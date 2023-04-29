import { Form } from "react-bootstrap";

type Props = {
  predicate: (value: string) => boolean;
  setValue: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
  value: string | undefined;
  isValid: boolean;
  label: string;
  placeholder: string;
};

// if empty, value equals undefined
const TextForm: React.FC<Props> = (props) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue) {
      props.setValue(rawValue);
      props.setIsValid(props.predicate(rawValue));
    } else {
      props.setValue(undefined);
      props.setIsValid(true);
    }
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{props.label}</Form.Label>
      <Form.Control
        value={props.value ?? ""}
        onChange={handleChange}
        type="text"
        placeholder={props.placeholder}
        isInvalid={!props.isValid}
      />
      <Form.Control.Feedback type="invalid">
        Please enter a valid string.
      </Form.Control.Feedback>
    </Form.Group>
  );
};

export default TextForm;
