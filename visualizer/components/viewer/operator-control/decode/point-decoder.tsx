import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { Form, InputGroup } from "react-bootstrap";
import RangeSlider from "react-bootstrap-range-slider";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import { apiClient } from "~/services/api-client";
import { setDecodeGrid } from "../../redux/interaction-data";
import { setGraphConfig } from "../../redux/graph-config2";

const useBlockTime = (millisecond: number): [boolean, () => void] => {
  const [lock, setLock] = useState<boolean>(false);
  const setLockCallback = useCallback(() => {
    setLock(true);
  }, []);
  useEffect(() => {
    if (!lock) {
      return;
    }
    setTimeout(() => {
      setLock(false);
    }, millisecond);
  }, [lock]);
  return [lock, setLockCallback];
};

const PointDecoder: React.FC = () => {
  const [pointX, setPointX] = useState<number>(0);
  const [pointY, setPointY] = useState<number>(0);
  const [isValidX, setIsValidX] = useState<boolean>(true);
  const [isValidY, setIsValidY] = useState<boolean>(true);

  const [sequence, setSequence] = useState<string>("");

  const [lock, setLock] = useBlockTime(200);

  const dispatch = useDispatch();
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig2.sessionId
  );
  const graphConfig2 = useSelector((state: RootState) => state.graphConfig2);

  const onChangeX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setIsValidX(!isNaN(value));
    setPointX(value);
    setLock();
  };
  const onChangeY = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setIsValidY(!isNaN(value));
    setPointY(value);
    setLock();
  };

  useEffect(() => {
    (async () => {
      if (lock || !isValidX || !isValidY || !sessionId) {
        return;
      }
      const resDecode = await apiClient.decode({
        session_uuid: sessionId,
        coords_x: [pointX],
        coords_y: [pointY],
      });

      const sequence: string = resDecode.sequences[0];
      setSequence(sequence);
    })();
  }, [pointX, pointY, isValidX, isValidY, sessionId, lock]);

  useEffect(() => {
    dispatch(
      setDecodeGrid({
        coordX: pointX,
        coordY: pointY,
        randomRegion: sequence,
      })
    );
  }, [sequence, pointX, pointY]);

  const onChangeShowGrid = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      setGraphConfig({
        ...graphConfig2,
        showDecodeGrid: e.target.checked,
      })
    );
  };

  return (
    <>
      <Form.Group className="mb-3">
        {/* {lock.toString()} */}
        <Form.Switch
          label="Show Grid Line"
          checked={graphConfig2.showDecodeGrid}
          onChange={onChangeShowGrid}
        />
        <InputGroup hasValidation>
          <InputGroup.Text>X :</InputGroup.Text>
          <InputGroup.Text
            style={{
              backgroundColor: "white",
            }}
          >
            <RangeSlider
              value={pointX}
              onChange={onChangeX}
              min={-3.5}
              max={3.5}
              step={0.1}
            />
          </InputGroup.Text>
          <Form.Control
            type="number"
            step={0.1}
            value={pointX}
            onChange={onChangeX}
            isInvalid={!isValidX}
          />
          <Form.Control.Feedback type="invalid">
            Invalid X value
          </Form.Control.Feedback>
        </InputGroup>
        <InputGroup hasValidation>
          <InputGroup.Text>Y :</InputGroup.Text>
          <InputGroup.Text
            style={{
              backgroundColor: "white",
            }}
          >
            <RangeSlider
              value={pointY}
              onChange={onChangeY}
              min={-3.5}
              max={3.5}
              step={0.1}
            />
          </InputGroup.Text>
          <Form.Control
            className="w-25"
            type="number"
            step={0.1}
            value={pointY}
            onChange={onChangeY}
            isInvalid={!isValidY}
          />
          <Form.Control.Feedback type="invalid">
            Invalid Y value
          </Form.Control.Feedback>
        </InputGroup>
      </Form.Group>
    </>
  );
};

export default PointDecoder;
