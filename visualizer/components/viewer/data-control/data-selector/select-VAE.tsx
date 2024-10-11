import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";

const SelectVAE: React.FC = () => {
  const [id, setId] = useState<string>("");
  const [models, setModels] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  // retrieve VAE model names
  useEffect(() => {
    (async () => {
      const res = await apiClient.getVAEModelNames();

      setModels(res.entries);
      if (res.entries.length > 0) {
        setId(res.entries[0].uuid);
      } else {
        setId("");
      }
    })();
  }, []);

  // dispatch model names to redux store
  useEffect(() => {
    if (id === "") {
      return;
    }
    const vaeName = models.find((model) => model.uuid === id)?.name;
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        vaeName: vaeName,
        gmmName: "",
      },
    });
  }, [id, dispatch]);

  // start session
  useEffect(() => {
    (async () => {
      if (id === "") {
        return;
      }

      try {
        const resStart = await apiClient.startSession({
          queries: {
            vae_uuid: id,
          },
        });

        if (sessionConfig.sessionId !== "") {
          const resEnd = await apiClient.endSession({
            queries: {
              session_uuid: sessionConfig.sessionId,
            },
          });
        }

        dispatch({
          type: "sessionConfig/set",
          payload: {
            ...sessionConfig,
            sessionId: resStart.uuid,
            vaeId: id,
            gmmId: "",
            forwardAdapter: "",
            reverseAdapter: "",
          },
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id, dispatch]);

  // retrieve VAE data
  useEffect(() => {
    (async () => {
      if (id === "") {
        return;
      }

      try {
        const res = await apiClient.getSelexData({
          queries: {
            vae_uuid: id,
          },
        });
        const vaeData = res.random_regions.map((value, index) => {
          return {
            key: index,
            sequence: value,
            randomRegion: value,
            duplicates: res.duplicates[index],
            coordX: res.coord_x[index],
            coordY: res.coord_y[index],
            isSelected: false,
            isShown: true,
          };
        });

        dispatch({
          type: "vaeData/set",
          payload: vaeData,
        });
      } catch (e) {
        console.error(e);
        return;
      }
    })();
  }, [id, dispatch]);

  return (
    <Form.Select value={id} onChange={(e) => setId(e.target.value)}>
      {models.map((model, index) => (
        <option key={index} value={model.uuid}>
          {model.name}
        </option>
      ))}
    </Form.Select>
  );
};

export default SelectVAE;
