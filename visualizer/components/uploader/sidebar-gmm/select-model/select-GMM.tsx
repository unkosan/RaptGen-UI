import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";

type Props = {
  setGmmFile: React.Dispatch<React.SetStateAction<File | null>>;
  setFileIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const SelectGMM: React.FC<Props> = (props) => {
  const [gmmFile, setGmmFile] = useState<File | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    props.setFileIsValid(isValid);
  }, [isValid]);

  useEffect(() => {
    props.setGmmFile(gmmFile);
  }, [gmmFile]);

  const dispatch = useDispatch();

  const handleGmmFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      (async () => {
        const res = await apiClient.validateGMMModel({
          gmm_data: file,
        });
        if (res.status === "success") {
          const data = res.data;
          dispatch({
            type: "gmmConfig/setData",
            payload: {
              weights: data.weights,
              means: data.means,
              covariances: data.covariances,
            },
          });
          setIsValid(true);
          setGmmFile(file);
        } else {
          setFeedback(res.message);
          setIsValid(false);
          setGmmFile(null);
        }
      })();
    } else {
      setFeedback("");
      setIsValid(false);
      setGmmFile(null);
    }
    return;
  };
  return (
    <>
      <Form.Control
        type="file"
        onChange={handleGmmFileChange}
        isInvalid={isValid === false && gmmFile !== null}
      />
      <Form.Control.Feedback type="invalid">{feedback}</Form.Control.Feedback>
    </>
  );
};

export default SelectGMM;
