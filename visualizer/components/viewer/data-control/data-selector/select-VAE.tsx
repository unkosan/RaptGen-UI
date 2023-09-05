import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { altApiClient } from "../../../../services/api-client";

const SelectVAE: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [nameList, setNameList] = useState<string[]>([""]);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  // retrieve VAE model names
  useEffect(() => {
    (async () => {
      const res = await altApiClient.getVAEModelNames();
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

  // dispatch model names to redux store
  useEffect(() => {
    if (value === "") {
      return;
    }
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        vaeName: value,
        gmmName: "",
      },
    });
  }, [value, dispatch]);

  // start session
  useEffect(() => {
    (async () => {
      if (value === "") {
        return;
      }

      const res = await altApiClient.startSession({
        queries: {
          VAE_name: value,
        },
      });

      if (res.status === "success") {
        const sessionId: number = res.data;
        dispatch({
          type: "sessionConfig/setSessionId",
          payload: sessionId,
        });
      }
    })();
  }, [value, dispatch]);

  // retrieve VAE data
  useEffect(() => {
    (async () => {
      if (value === "") {
        return;
      }

      const res = await altApiClient.getSelexData({
        queries: {
          VAE_model_name: value,
        },
      });

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
  }, [value, dispatch]);

  return (
    <Form.Select value={value} onChange={(e) => setValue(e.target.value)}>
      {nameList.map((name, index) => (
        <option key={index}>{name}</option>
      ))}
    </Form.Select>
  );
};

export default SelectVAE;
