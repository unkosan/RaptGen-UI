import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";

const SelectGMM: React.FC = () => {
  const [models, setModels] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);
  const [id, setId] = useState<string>("");

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);

  // retrieve GMM model names
  useEffect(() => {
    (async () => {
      if (sessionConfig.sessionId === "") {
        return;
      }

      try {
        const res = await apiClient.getGMMModelNames({
          queries: {
            vae_uuid: sessionConfig.vaeId,
          },
        });

        console.log(res);

        setModels(res.entries);
        if (res.entries.length > 0) {
          setId(res.entries[0].uuid);
        } else {
          setId("");
        }
      } catch (e) {
        console.error(e);
        return;
      }
    })();
  }, [sessionConfig.sessionId]);

  // dispatch model names to redux store
  useEffect(() => {
    if (id === "") {
      return;
    }
    dispatch({
      type: "sessionConfig/set",
      payload: {
        ...sessionConfig,
        gmmId: id,
      },
    });
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        gmmName: models.find((model) => model.uuid === id)?.name,
      },
    });
  }, [id]);

  // retrieve GMM data and dispatch to redux store
  useEffect(() => {
    (async () => {
      if (id === "") {
        dispatch({
          type: "gmmData/set",
          payload: {
            weights: [],
            means: [],
            covariances: [],
            decodedSequences: [],
            isShown: [],
          },
        });
        return;
      }

      const res = await apiClient.getGMMModel({
        queries: {
          gmm_uuid: id,
        },
      });

      const resCoords = await apiClient.decode({
        session_uuid: sessionConfig.sessionId,
        coords_x: res.means.map((value) => value[0]),
        coords_y: res.means.map((value) => value[1]),
      });

      dispatch({
        type: "gmmData/set",
        payload: {
          means: res.means,
          covariances: res.covariances,
          decodedSequences: resCoords.sequences,
          isShown: Array(res.means.length).fill(true),
        },
      });
    })();
  }, [id, sessionConfig.sessionId, dispatch]);
  // use sessionId instead of graphConfig.vaeName to access the VAE name changed by the user

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

export default SelectGMM;
