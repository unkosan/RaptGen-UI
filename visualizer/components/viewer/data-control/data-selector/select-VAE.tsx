import axios from "axios";
import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { ResponseSelexData } from "../../../../types/api-interface/data";

const SelectVAE: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [nameList, setNameList] = useState<string[]>([""]);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  // retrieve VAE model names
  useEffect(() => {
    (async () => {
      const res = await axios
        .get("/data/VAE-model-names")
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

  // dispatch model names to redux store
  useEffect(() => {
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        vaeName: value,
        gmmName: "",
      },
    });
  }, [value]);

  // start session
  useEffect(() => {
    (async () => {
      if (value === "") {
        return;
      }

      const res = await axios
        .get("/session/start", {
          params: {
            VAE_name: value,
          },
        })
        .then((res) => res.data);

      if (res.status === "success") {
        const sessionId: number = res.data;
        dispatch({
          type: "sessionConfig/setSessionId",
          payload: sessionId,
        });
      }
    })();
  }, [value]);

  // retrieve VAE data
  useEffect(() => {
    (async () => {
      if (value === "") {
        return;
      }

      const res = await axios
        .get<ResponseSelexData>("/data/selex-data", {
          params: {
            VAE_model_name: value,
          },
        })
        .then((res) => res.data);

      if (res.status === "success") {
        const rawData = res.data;
        const vaeData = rawData.Sequence.map((value, index) => {
          return {
            key: index,
            sequence: value,
            randomRegion: rawData.Without_Adapters[index],
            duplicates: rawData.Duplicates[index],
            coordX: rawData.coord_x[index],
            coordY: rawData.coord_y[index],
            isSelected: false,
            isShown: true,
          };
        });

        dispatch({
          type: "vaeData/set",
          payload: vaeData,
        });
      }
    })();
  }, [value]);

  return (
    <Form.Select value={value} onChange={(e) => setValue(e.target.value)}>
      {nameList.map((name, index) => (
        <option key={index}>{name}</option>
      ))}
    </Form.Select>
  );
};

export default SelectVAE;
