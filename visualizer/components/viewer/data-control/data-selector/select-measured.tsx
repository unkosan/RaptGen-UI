import axios from "axios";
import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { ResponseMeasuredData } from "../../../../types/api-interface/data";
import { ResponseEncode } from "../../../../types/api-interface/session";
import { MeasuredDataEntry } from "../../redux/measured-data";

const SelectMeasured: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [nameList, setNameList] = useState<string[]>([""]);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

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
    (async () => {
      if (!value) {
        dispatch({
          type: "measuredData/set",
          payload: [],
        });
        return;
      }
      const res = await axios
        .get<ResponseMeasuredData>("/data/measured-data", {
          params: { measured_data_name: value },
        })
        .then((res) => res.data);
      if (res.status === "error") {
        dispatch({
          type: "measuredData/set",
          payload: [],
        });
        return;
      }

      const data = res.data;
      const mask = data.Sequence.map(
        (seq: string) =>
          seq.startsWith(sessionConfig.forwardAdapter) &&
          seq.endsWith(sessionConfig.reverseAdapter) &&
          seq.length >
            sessionConfig.forwardAdapter.length +
              sessionConfig.reverseAdapter.length
      );

      const sequences = data.Sequence.filter((_, index) => mask[index]);
      const randomRegions = sequences.map((seq: string) =>
        seq.slice(
          sessionConfig.forwardAdapter.length,
          seq.length - sessionConfig.reverseAdapter.length
        )
      );
      const hues = data.hue.filter((_, index) => mask[index]);
      const IDs = data.ID.filter((_, index) => mask[index]);

      if (sequences.length === 0) {
        dispatch({
          type: "measuredData/set",
          payload: [],
        });
        return;
      }

      const resCoords = await axios
        .post<ResponseEncode>("/session/encode", {
          session_id: sessionConfig.sessionId,
          sequences: randomRegions,
        })
        .then((res) => res.data);

      if (resCoords.status === "error") {
        dispatch({
          type: "measuredData/set",
          payload: [],
        });
        return;
      }

      const coords = resCoords.data;
      const measuredData: MeasuredDataEntry[] = coords.map(
        ({ coord_x, coord_y }, index) => {
          return {
            key: index,
            id: IDs[index],
            sequence: sequences[index],
            randomRegion: randomRegions[index],
            coordX: coord_x,
            coordY: coord_y,
            bindValue: NaN,
            isSelected: false,
            isShown: true,
            seriesName: hues[index].toString(),
          };
        }
      );

      dispatch({
        type: "measuredData/set",
        payload: measuredData,
      });
    })();
  }, [value, sessionConfig]);

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
