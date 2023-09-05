import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useDispatch } from "react-redux";
import { Button, Form, Image } from "react-bootstrap";
import { InputGroup } from "react-bootstrap";
import { Plus } from "react-bootstrap-icons";
import { useEffect, useState } from "react";
import { altApiClient } from "../../../../services/api-client";

const ResultViewer: React.FC = () => {
  const dispatch = useDispatch();
  const gridPoint = useSelector((state: RootState) => state.decodeData)[0];
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);
  const decodeData = useSelector((state: RootState) => state.decodeData);

  const [showWeblogo, setShowWeblogo] = useState<boolean>(false);
  const [showSecondaryStructure, setShowSecondaryStructure] =
    useState<boolean>(false);

  const [weblogoBase64, setWeblogoBase64] = useState<string>("");
  const [secondaryStructureBase64, setSecondaryStructureBase64] =
    useState<string>("");

  const [lock, setLock] = useState<boolean>(false);
  useEffect(() => {
    if (lock) {
      return;
    }
    setLock(true);
    setTimeout(() => {
      setLock(false);
    }, 200);
  }, [gridPoint]);

  // weblogo image
  useEffect(() => {
    if (lock) {
      return;
    }
    if (!showWeblogo) {
      setWeblogoBase64("");
      return;
    }
    if (sessionConfig.sessionId === 0) {
      return;
    }

    (async () => {
      const res = await altApiClient.getWeblogo(
        {
          session_id: sessionConfig.sessionId,
          coords: [
            {
              coord_x: gridPoint.coordX,
              coord_y: gridPoint.coordY,
            },
          ],
        },
        {
          responseType: "arraybuffer",
        }
      );
      const base64 = Buffer.from(res, "binary").toString("base64");
      setWeblogoBase64(base64);
    })();
  }, [sessionConfig.sessionId, gridPoint, showWeblogo]);

  // secondary structure image
  useEffect(() => {
    if (lock) {
      return;
    }
    if (!showSecondaryStructure) {
      setSecondaryStructureBase64("");
      return;
    }

    (async () => {
      const res = await altApiClient.getSecondaryStructureImage({
        queries: {
          sequence: gridPoint.randomRegion.replace(/\_/g, ""),
        },
        responseType: "arraybuffer",
      });

      const base64 = Buffer.from(res, "binary").toString("base64");
      setSecondaryStructureBase64(base64);
    })();
  }, [gridPoint, showSecondaryStructure]);

  // add button
  const onAdd = async () => {
    const newDecodeData = [...decodeData];
    newDecodeData.push({
      ...decodeData[0],
      key: sessionConfig.manualDecodeCount,
      id: `manual-${sessionConfig.manualDecodeCount}`,
    });
    dispatch({
      type: "decodeData/set",
      payload: newDecodeData,
    });
    dispatch({
      type: "sessionConfig/incrementDecodeCount",
      payload: null,
    });
  };

  return (
    <Form.Group className="mb-3">
      <InputGroup>
        <Form.Control value={gridPoint.randomRegion} readOnly />
        <Button disabled={gridPoint.randomRegion === ""} onClick={onAdd}>
          <Plus size={25} />
        </Button>
      </InputGroup>
      <Form.Switch
        label="Show Weblogo"
        checked={showWeblogo}
        onChange={() => setShowWeblogo(!showWeblogo)}
      />
      <Form.Switch
        label="Show Secondary Structure"
        checked={showSecondaryStructure}
        onChange={() => setShowSecondaryStructure(!showSecondaryStructure)}
      />
      {showWeblogo ? (
        <div>
          <Form.Label>Weblogo</Form.Label>
          <Image src={`data:image/png;base64, ${weblogoBase64}`} fluid />
        </div>
      ) : null}
      {showSecondaryStructure ? (
        <div>
          <Form.Label>Secondary Structure</Form.Label>
          <Image
            src={`data:image/png;base64,${secondaryStructureBase64}`}
            fluid
          />
        </div>
      ) : null}
    </Form.Group>
  );
};

export default ResultViewer;
