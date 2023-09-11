import React, { useState } from "react";
import { Form } from "react-bootstrap";
import { apiClient } from "~/services/api-client";

const SelectGMM: React.FC = () => {
  const [isValidGmm, setIsValidGmm] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string>("");

  const handleGmmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      (async () => {
        const res = await apiClient.validateGMMModel({
          gmm_data: file,
        });
        if (res.status === "success") {
          setIsValidGmm(true);
        } else {
          setIsValidGmm(false);
        }
      })();
    } else {
      setIsValidGmm(false);
    }
    return;
  };
  return (
    <Form.Control
      type="file"
      // accept=".pkl"
      onChange={handleGmmFileChange}
    />
  );
};

export default SelectGMM;
