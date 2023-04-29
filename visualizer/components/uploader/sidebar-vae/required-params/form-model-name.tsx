import React, { useState } from "react";
import { Form } from "react-bootstrap";

type Props = {
  value: string;
  isValid: boolean;
  setValue: React.Dispatch<React.SetStateAction<string>>;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const FormModelName: React.FC<Props> = (props) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.setValue(e.target.value);
    props.setIsValid(e.target.value !== "");
  };
  return (
    <Form.Group className="mb-3">
      <Form.Control
        type="text"
        placeholder="Please enter the model name"
        onChange={handleChange}
        isInvalid={!props.isValid}
      />
    </Form.Group>
  );
};

export default FormModelName;
