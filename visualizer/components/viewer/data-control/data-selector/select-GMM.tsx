import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";

const SelectGMM: React.FC = () => {
  const [value, setValue] = useState<string>("");
  const [nameList, setNameList] = useState<string[]>([]);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  // retrieve GMM model names
  useEffect(() => {
    (async () => {
      if (graphConfig.vaeName === "") {
        return;
      }

      const res = await apiClient.getGMMModelNames({
        queries: {
          VAE_model_name: graphConfig.vaeName,
        },
      });
      if (res.status === "success") {
        setValue("");
        setNameList(res.data);
      }
    })();
  }, [graphConfig.vaeName]);

  // when name list is updated, set the first element as default
  useEffect(() => {
    if (nameList.length > 0) {
      setValue(nameList[0]);
    } else {
      setValue("");
    }
  }, [nameList]);

  // dispatch model names to redux store
  useEffect(() => {
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        gmmName: value,
      },
    });
  }, [value, dispatch]);

  // retrieve GMM data and dispatch to redux store
  useEffect(() => {
    (async () => {
      if (sessionId === 0) {
        return;
      }

      if (value === "") {
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
          VAE_model_name: graphConfig.vaeName,
          GMM_model_name: value,
        },
      });

      if (res.status !== "success") {
        return;
      }

      const gmm = res.data;

      const resDecode = await apiClient.decode({
        session_id: sessionId,
        coords: gmm.means.map((value) => {
          return { coord_x: value[0], coord_y: value[1] };
        }),
      });

      if (resDecode.status !== "success") {
        return;
      }

      // const decoded = resDecord.data;
      const decoded = resDecode.data;

      dispatch({
        type: "gmmData/set",
        payload: {
          weights: gmm.weights,
          means: gmm.means,
          covariances: gmm.covariances,
          decodedSequences: decoded,
          isShown: Array(gmm.weights.length).fill(true),
        },
      });
    })();
  }, [value, sessionId, dispatch]);
  // use sessionId instead of graphConfig.vaeName to access the VAE name changed by the user

  return (
    <Form.Select value={value} onChange={(e) => setValue(e.target.value)}>
      {nameList.map((name, index) => (
        <option key={index}>{name}</option>
      ))}
    </Form.Select>
  );
};

export default SelectGMM;
