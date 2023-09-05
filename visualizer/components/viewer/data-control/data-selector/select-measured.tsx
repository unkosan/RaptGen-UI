import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { MeasuredDataEntry } from "../../redux/measured-data";
import { altApiClient } from "../../../../services/api-client";

const SelectMeasured: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [nameList, setNameList] = useState<string[]>([""]);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  useEffect(() => {
    (async () => {
      if (graphConfig.vaeName === "") {
        return;
      }
      const res = await altApiClient.getMeasuredDataNames();
      if (res.status === "success") {
        setNameList(res.data);
        if (res.data.length > 0) {
          setValue(res.data[0]);
        } else {
          setValue("");
        }
      }
    })();
  }, [graphConfig.vaeName]);

  useEffect(() => {
    (async () => {
      if (!value) {
        dispatch({
          type: "measuredData/set",
          payload: [],
        });
        return;
      }
      const res = await altApiClient.getMeasuredData({
        queries: {
          measured_data_name: value,
        },
      });
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

      const resCoords = await altApiClient.encode({
        session_id: sessionConfig.sessionId,
        sequences: randomRegions,
      });

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
  }, [value, sessionConfig, dispatch]);

  useEffect(() => {
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        measuredName: value,
      },
    });
  }, [value, dispatch]);

  return (
    <Form.Select value={value} onChange={(e) => setValue(e.target.value)}>
      {nameList.map((name, index) => (
        <option key={index}>{name}</option>
      ))}
    </Form.Select>
  );
};

export default SelectMeasured;
