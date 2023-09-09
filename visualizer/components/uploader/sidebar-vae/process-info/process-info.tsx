import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { Alert, Form, ProgressBar } from "react-bootstrap";
import { apiClient } from "~/services/api-client";

type Props = {
  finished: boolean;
  isValid: boolean;
  setIsFinished: React.Dispatch<React.SetStateAction<boolean>>;
  setIsValid: React.Dispatch<React.SetStateAction<boolean>>;
};

const ProcessInfo: React.FC<Props> = (props) => {
  const dispatch = useDispatch();
  const [progress, setProgress] = useState<number>(NaN);
  const sequenceData = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData
  );
  const uuid = useSelector((state: RootState) => state.vaeConfig.encodeUUID);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!uuid) {
        console.log("interval called, progid: " + uuid);
        return;
      }

      if (props.finished && props.isValid) {
        return;
      }

      (async () => {
        const res = await apiClient.getBatchEncodeStatus({
          queries: {
            task_id: uuid,
          },
        });

        console.log(
          "interval called, state: " + res.state + "\n progid: " + uuid
        );

        if (res.state === "SUCCESS") {
          console.log(res.status);
          const coords: number[][] = res.result;
          const mask = sequenceData.adapterMatched;
          const sequences: string[] = sequenceData.sequences.filter(
            (seq, i) => mask[i]
          );
          const randomRegions: string[] = sequenceData.randomRegions.filter(
            (seq, i) => mask[i]
          );
          const duplicates: number[] = sequenceData.duplicates.filter(
            (seq, i) => mask[i]
          );
          dispatch({
            type: "vaeData/set",
            payload: sequences.map((seq, i) => {
              return {
                key: i,
                sequence: seq,
                randomRegion: randomRegions[i],
                duplicates: duplicates[i],
                coordX: coords[i][0],
                coordY: coords[i][1],
                isSelected: false,
                isShown: true,
              };
            }),
          });
          props.setIsValid(true);
          props.setIsFinished(true);
        } else if (res.state === "PROGRESS") {
          const [current, total] = res.status
            .split(",")
            .map((s: string) => parseInt(s));
          setProgress((current / total) * 100);
          props.setIsValid(true);
          props.setIsFinished(false);
        } else if (res.state === "FAILURE") {
          props.setIsValid(false);
          props.setIsFinished(true);
        } else {
          props.setIsValid(false);
          props.setIsFinished(false);
        }
      })();
    }, 1000);
    return () => clearInterval(interval);
  });

  return (
    <div style={{ marginTop: "1em" }}>
      {props.finished && props.isValid ? (
        <Alert variant="success">Successfully processed sequences</Alert>
      ) : props.finished && !props.isValid ? (
        <Alert variant="danger">Failed to process sequences</Alert>
      ) : (
        <Form.Group className="mb-3">
          <Form.Label>Processing... {progress.toFixed(2)} %</Form.Label>
          <ProgressBar animated now={progress} />
        </Form.Group>
      )}
    </div>
  );
};

export default ProcessInfo;
