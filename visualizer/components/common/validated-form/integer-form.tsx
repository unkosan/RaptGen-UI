import React from "react";
import { Form } from "react-bootstrap";

type Props = {
  predicate: (value: number) => boolean;
  setValue: (value: number) => void;
  setIsValid: (value: boolean) => void;
  value: number;
  isValid: boolean;
  label?: string;
  placeholder?: string;
  required: boolean;
  for?: string;
};

const IntegerForm: React.FC<Props> = (props) => {
  const [value, setValue] = React.useState<number>(props.value);
  const [isValid, setIsValid] = React.useState<boolean>(props.isValid);
  return (
    <Form.Control
      value={value}
      onChange={(e) => {
        const rawValue = e.target.value;
        if (rawValue) {
          const value = parseInt(e.target.value);
          setIsValid(!isNaN(value) && props.predicate(value));
          setValue(value);
        } else {
          const value = NaN;
          setIsValid(true);
          setValue(value);
        }
      }}
      type="number"
      placeholder={props.placeholder}
      isInvalid={!isValid}
      required={props.required}
      //   htmlfor={props.for}
    />
  );
};
