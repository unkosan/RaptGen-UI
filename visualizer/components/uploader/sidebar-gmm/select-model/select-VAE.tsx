import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";

const SelectVAE: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [nameList, setNameList] = useState<string[]>([""]);

  const dispatch = useDispatch();

  // retrieve VAE model names
  useEffect(() => {
    (async () => {
      const res = await apiClient.getVAEModelNames();
      if (res.status === "success") {
        setNameList(res.data);
        if (res.data.length > 0) {
          setValue(res.data[0]);
        } else {
          setValue("");
        }
      }
    })();
  }, []);

  // retrieve VAE data
  useEffect(() => {
    async () => {
      if (value === "") {
        return;
      }

      const res = await apiClient.getSelexData({
        queries: {
          VAE_model_name: value,
        },
      });

      if (res.status === "success") {
        console.log("res", res);
      }
    };
  }, [value]);

  return (
    <Form.Select
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
    >
      {nameList.map((name) => (
        <option key={name}>{name}</option>
      ))}
    </Form.Select>
  );
};

export default SelectVAE;
