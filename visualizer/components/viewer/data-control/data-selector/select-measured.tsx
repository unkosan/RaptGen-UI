import axios from "axios";
import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";

const SelectMeasured: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [nameList, setNameList] = useState<string[]>([""]);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  useEffect(() => {
    (async () => {
      const res = await axios
        .get("/data/measured-data-names")
        .then((res) => res.data);
      const nameList: string[] = res.data;
      if (res.status === "success") {
        setNameList(nameList);
        if (nameList.length > 0) {
          setValue(nameList[0]);
        } else {
          setValue("");
        }
      }
    })();
  }, []);

  useEffect(() => {
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        measuredName: value,
      },
    });
  }, [value]);

  return (
    <Form.Select value={value} onChange={(e) => setValue(e.target.value)}>
      {nameList.map((name, index) => (
        <option key={index}>{name}</option>
      ))}
    </Form.Select>
  );
};

export default SelectMeasured;
