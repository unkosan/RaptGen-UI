import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { AppDispatch, RootState } from "../../redux/store";
import { setIsDirty } from "../../redux/is-dirty";
import { setSessionConfigByVaeIdName } from "../../redux/session-config";
import { setRegisteredValues } from "../../redux/registered-values";
import { setQueriedValues } from "../../redux/queried-values";
import { setAcquisitionValues } from "../../redux/acquisition-values";

export const useVaeSelector = () => {
  const [models, setModels] = useState<
    {
      name: string;
      uuid: string;
    }[]
  >([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const sessionConfig = useSelector((state: RootState) => state.sessionConfig);
  const registeredValues = useSelector(
    (state: RootState) => state.registeredValues
  );

  // retrieve VAE model names
  useEffect(() => {
    (async () => {
      const res = await apiClient.getVAEModelNames();
      setModels(res.entries);
    })();
  }, []);

  // if redux store is changed, update local state
  useEffect(() => {
    setSelectedModel(sessionConfig.vaeId);
  }, [sessionConfig.vaeId]);

  const setDirty = () => {
    dispatch(setIsDirty(true));
  };

  const handleModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uuid = e.target.value;
    const name = models.find((model) => model.uuid === uuid)?.name;
    if (!uuid || !name) return;

    setDirty();
    setSelectedModel(uuid);

    try {
      setIsLoading(true);
      const res = await dispatch(
        setSessionConfigByVaeIdName({
          vaeId: uuid,
          vaeName: name,
        })
      );

      // get session Id
      const sessionId: string = (res.payload as any).sessionId;

      // update registered table with re-encoded data
      if (registeredValues.randomRegion.length !== 0) {
        const resRegistered = await apiClient.encode({
          session_uuid: sessionId,
          sequences: registeredValues.randomRegion,
        });
        dispatch(
          setRegisteredValues({
            ...registeredValues,
            coordX: resRegistered.coords_x,
            coordY: resRegistered.coords_y,
          })
        );
      }

      // reset queried values and acquisition values
      dispatch(
        setQueriedValues({
          masterboxChecked: false,
          randomRegion: [],
          coordX: [],
          coordY: [],
          coordOriginalX: [],
          coordOriginalY: [],
          staged: [],
        })
      );
      dispatch(
        setAcquisitionValues({
          acquisitionValues: [],
          coordX: [],
          coordY: [],
        })
      );

      setIsLoading(false);
    } catch (e) {
      console.error(e);
      return;
    }
  };

  return {
    isLoading,
    models,
    selectedModel,
    handleModelChange,
  };
};
