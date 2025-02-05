import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useDispatch } from "react-redux";
import { Accordion, Button, Card, Form, Image } from "react-bootstrap";
import { InputGroup } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "~/services/api-client";
import { setDecoded } from "../redux/interaction-data";

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

export default ResultViewer;
