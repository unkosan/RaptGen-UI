import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import {
  setGmmId,
  setSessionConfigByVaeIdName,
} from "../../redux/session-config";
import { useState } from "react";

/**
 * Picks a VAE model and sets the session config.
 * @returns {
 *  modelId: string,
 *  setModelId: (uuid: string, name: string) => void,
 *  sessionId: string,
 * }
 */
export const usePickVAE = () => {
  const dispatch = useDispatch<AppDispatch>();
  const modelId = useSelector((state: RootState) => state.sessionConfig.vaeId);
  const [sessionId, setSessionId] = useState<string>("");

  const setModelId = (uuid: string, name: string) => {
    (async () => {
      try {
        const res = await dispatch(
          setSessionConfigByVaeIdName({
            vaeId: uuid,
            vaeName: name,
          })
        );
        const sessionId: string = (res.payload as any).sessionId;
        setSessionId(sessionId);
      } catch (error) {
        console.error(error);
      }
    })();
  };

  return { modelId, setModelId, sessionId };
};

/**
 * Picks a GMM model and sets redux state.
 * @returns {
 *  modelId: string,
 *  setModelId: (uuid: string) => void,
 * }
 */
export const usePickGMM = () => {
  const dispatch = useDispatch<AppDispatch>();

  const modelId = useSelector((state: RootState) => state.sessionConfig.gmmId);
  const setModelId = (uuid: string) => {
    try {
      dispatch(setGmmId(uuid));
    } catch (error) {
      console.error(error);
    }
  };

  return { modelId, setModelId };
};
