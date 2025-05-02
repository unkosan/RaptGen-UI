import React from "react";
import { Button, Form, InputGroup } from "react-bootstrap";

type Props = {
  predicate: (value: number) => boolean;
  setValue: React.Dispatch<React.SetStateAction<number | undefined>>;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
  value: number | undefined;
  isValid: boolean;
  label?: string;
  placeholder: string;
};

// if not-integer value or empty value is entered, value is undefined and isValid is forced to be true
const IntegerForm: React.FC<Props> = (props) => {
  // handleChange is called with valid string value or empty string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue) {
      const value = parseInt(e.target.value);
      props.setIsValid(!isNaN(value) && props.predicate(value));
      props.setValue(value);
    } else {
      const value = undefined;
      props.setIsValid(true);
      props.setValue(value);
    }
  };

  return (
    <Form.Group className="mb-3">
      {props.label && <Form.Label>{props.label}</Form.Label>}
      <Form.Control
        value={props.value ?? ""}
        onChange={handleChange}
        type="number"
        placeholder={props.placeholder}
        isInvalid={!props.isValid}
      />
      <Form.Control.Feedback type="invalid">
        Please enter a valid integer.
      </Form.Control.Feedback>
    </Form.Group>
  );
};

const SeedValueForm: React.FC<Omit<Props, "predicate">> = (props) => {
  // handleChange is called with valid string value or empty string
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue) {
      const value = parseInt(e.target.value);
      props.setIsValid(!isNaN(value) && value >= 0);
      props.setValue(value);
    } else {
      const value = undefined;
      props.setIsValid(true);
      props.setValue(value);
    }
  };

  return (
    <Form.Group className="mb-3">
      {props.label && <Form.Label>{props.label}</Form.Label>}
      <InputGroup>
        <Form.Control
          value={props.value ?? ""}
          onChange={handleChange}
          type="number"
          placeholder={props.placeholder}
          isInvalid={!props.isValid}
        />
        <Button
          variant="outline-primary"
          onClick={() => props.setValue(Math.floor(Math.random() * 1000000))}
        >
          Random
        </Button>
        <Form.Control.Feedback type="invalid">
          Please enter a valid integer.
        </Form.Control.Feedback>
      </InputGroup>
    </Form.Group>
  );
};

export default IntegerForm;
export { SeedValueForm };
