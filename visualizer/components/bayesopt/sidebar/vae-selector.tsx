import { useEffect, useState } from "react";
import { Form, Tab, Tabs } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { RootState } from "../redux/store";
import { useRouter } from "next/router";

const VaeSelector: React.FC = () => {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [minimumCount, setMinimumCount] = useState<number>(5);
  const [showSelex, setShowSelex] = useState<boolean>(true);
  const router = useRouter();
  const uuid = router.query.uuid;

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  // when loaded with uuid, sessionConfig is updated on the RestoreExperimentComponent
  useEffect(() => {
    setSelectedModel(sessionConfig.vaeName);
  }, [sessionConfig.vaeName]);

  // retrieve VAE model names
  useEffect(() => {
    (async () => {
      const res = await apiClient.getVAEModelNames();
      if (res.status === "error") return;
      setModels(res.data);

      if (uuid) return;

      if (res.data.length > 0) {
        setSelectedModel(res.data[0]);
      }
    })();
  }, []);

  // dispatch model names to redux store
  useEffect(() => {
    if (selectedModel === "") return;
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        vaeName: selectedModel,
        minCount: minimumCount,
        showSelex: showSelex,
      },
    });
  }, [selectedModel, minimumCount, showSelex]);

  // start session
  useEffect(() => {
    (async () => {
      if (sessionConfig.sessionId !== 0) {
        await apiClient.endSession({
          queries: {
            session_id: sessionConfig.sessionId,
          },
        });
        console.log("session ended");
      }

      if (selectedModel === "") return;

      const resStart = await apiClient.startSession({
        queries: {
          VAE_name: selectedModel,
        },
      });

      if (resStart.status === "success") {
        const sessionId: number = resStart.data;
        dispatch({
          type: "sessionConfig/set",
          payload: {
            sessionId,
            vaeName: selectedModel,
          },
        });
      }
    })();
  }, [selectedModel]);

  // if selectedModel is changed, upload the associated data to redux store
  useEffect(() => {
    console.log("selectedModel", selectedModel);
    if (!selectedModel) return;
    (async () => {
      const res = await apiClient.getSelexData({
        queries: {
          VAE_model_name: selectedModel,
        },
      });

      if (res.status === "error") return;

      const rawData = res.data;
      const vaeData = rawData.Sequence.map((seq, index) => {
        return {
          key: index,
          sequence: seq,
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
    })();
  }, [selectedModel]);

  return (
    <>
      <legend>VAE model</legend>
      <Tabs defaultActiveKey="modelSelector" className="mb-3">
        <Tab eventKey="modelSelector" title="Select">
          <Form.Group className="mb-3">
            <Form.Label>Selected VAE model</Form.Label>
            <Form.Control
              as="select"
              value={selectedModel}
              onChange={(e) => {
                dispatch({
                  type: "isDirty/set",
                  payload: true,
                });
                setSelectedModel(e.target.value);
              }}
            >
              {models.map((model, i) => (
                <option key={i}>{model}</option>
              ))}
            </Form.Control>
          </Form.Group>
        </Tab>
        <Tab eventKey="modelConfig" title="Config">
          <Form.Group className="mb-3">
            <Form.Label>Minimum count</Form.Label>
            <Form.Control
              type="number"
              value={minimumCount}
              onChange={(e) => {
                dispatch({
                  type: "isDirty/set",
                  payload: true,
                });
                setMinimumCount(parseInt(e.currentTarget.value));
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Switch
              label="show SELEX dataset"
              checked={showSelex}
              onChange={(e) => {
                dispatch({
                  type: "isDirty/set",
                  payload: true,
                });
                setShowSelex(e.currentTarget.checked);
              }}
            />
          </Form.Group>
        </Tab>
      </Tabs>
    </>
  );
};

export default VaeSelector;
