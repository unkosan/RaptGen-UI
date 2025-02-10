import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import {
  Accordion,
  Button,
  Card,
  Form,
  InputGroup,
  Image,
} from "react-bootstrap";
import RangeSlider from "react-bootstrap-range-slider";
import { apiClient } from "~/services/api-client";
import { setDecodeGrid, setDecoded } from "./redux/interaction-data";
import { setGraphConfig } from "./redux/graph-config";
import { Plus } from "react-bootstrap-icons";

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
    (state: RootState) => state.sessionConfig.sessionId
  );
  const graphConfig2 = useSelector((state: RootState) => state.graphConfig);

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
    <Card className="mb-3">
      <Card.Header>Point Decoder Input</Card.Header>
      <Card.Body>
        <Form.Switch
          label="Show Grid Line"
          checked={graphConfig2.showDecodeGrid}
          onChange={onChangeShowGrid}
          className="mb-2"
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
      </Card.Body>
    </Card>
  );
};

const ResultViewer: React.FC = () => {
  const dispatch = useDispatch();
  const gridPoint = useSelector(
    (state: RootState) => state.interactionData.decodeGrid
  );
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );
  const vaeId = useSelector((state: RootState) => state.sessionConfig.vaeId);
  const decodeData = useSelector(
    (state: RootState) => state.interactionData.decoded
  );

  const [showWeblogo, setShowWeblogo] = useState<boolean>(false);
  const [showSecondaryStructure, setShowSecondaryStructure] =
    useState<boolean>(false);

  const [weblogoBase64, setWeblogoBase64] = useState<string>("");
  const [secondaryStructureBase64, setSecondaryStructureBase64] =
    useState<string>("");

  const [forward, setForward] = useState<string>("");
  const [reverse, setReverse] = useState<string>("");

  const [lock, setLock] = useBlockTime(400);

  useEffect(() => {
    (async () => {
      if (!vaeId) {
        return;
      }

      const res = await apiClient.getVAEModelParameters({
        queries: {
          vae_uuid: vaeId,
        },
      });

      console.log(res);
      setForward(res.forward_adapter || "");
      setReverse(res.reverse_adapter || "");
    })();
  }, [vaeId]);

  useEffect(() => {
    setLock();
  }, [gridPoint]);

  // weblogo image
  useEffect(() => {
    (async () => {
      if (lock || !showWeblogo || !sessionId) {
        return;
      }
      const res = await apiClient.getWeblogo(
        {
          session_uuid: sessionId,
          coords_x: [gridPoint.coordX],
          coords_y: [gridPoint.coordY],
        },
        {
          responseType: "arraybuffer",
        }
      );

      const base64 = Buffer.from(res, "binary").toString("base64");
      setWeblogoBase64(base64);
    })();
  }, [sessionId, gridPoint, showWeblogo, lock]);

  // secondary structure image
  useEffect(() => {
    (async () => {
      if (lock || !showSecondaryStructure) {
        return;
      }
      const res = await apiClient.getSecondaryStructureImage({
        queries: {
          sequence:
            forward + gridPoint.randomRegion.replace(/\_/g, "") + reverse,
        },
        responseType: "arraybuffer",
      });

      const base64 = Buffer.from(res, "binary").toString("base64");
      setSecondaryStructureBase64(base64);
    })();
  }, [gridPoint, showSecondaryStructure, lock]);

  // add button
  const onAdd = async () => {
    dispatch(
      setDecoded({
        ids: decodeData.ids.concat(`manual-${decodeData.ids.length}`),
        coordsX: decodeData.coordsX.concat(gridPoint.coordX),
        coordsY: decodeData.coordsY.concat(gridPoint.coordY),
        randomRegions: decodeData.randomRegions.concat(gridPoint.randomRegion),
        shown: decodeData.shown.concat(true),
      })
    );
  };

  return (
    <Card className="mb-3">
      <Card.Header>Point Decoder Output</Card.Header>
      <Card.Body>
        <InputGroup className="mb-3">
          <Form.Control value={gridPoint.randomRegion} readOnly />
          <Button disabled={gridPoint.randomRegion === ""} onClick={onAdd}>
            <Plus size={25} />
          </Button>
        </InputGroup>
        <Accordion>
          <Accordion.Item eventKey="0">
            <Accordion.Header onClick={() => setShowWeblogo(!showWeblogo)}>
              Weblogo
            </Accordion.Header>
            <Accordion.Body>
              <Image src={`data:image/png;base64, ${weblogoBase64}`} fluid />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        <Accordion>
          <Accordion.Item eventKey="0">
            <Accordion.Header
              onClick={() => setShowSecondaryStructure(!showSecondaryStructure)}
            >
              Secondary Structure
            </Accordion.Header>
            <Accordion.Body>
              <Image
                src={`data:image/png;base64, ${secondaryStructureBase64}`}
                fluid
              />
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );
};

const Decode: React.FC = () => {
  return (
    <Form>
      <Form.Group className="mb-3">
        <PointDecoder />
        <ResultViewer />
      </Form.Group>
    </Form>
  );
};

export default Decode;
