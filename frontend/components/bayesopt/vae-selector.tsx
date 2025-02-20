import { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { AppDispatch, RootState } from "./redux/store";
import { setIsDirty } from "./redux/is-dirty";
import { setIsLoading } from "./redux/is-loading";
import { setSessionConfigByVaeIdName } from "./redux/session-config";
import { setVaeData } from "./redux/vae-data";
import { setRegisteredValues } from "./redux/registered-values";
import { setQueriedValues } from "./redux/queried-values";
import { setAcquisitionValues } from "./redux/acquisition-values";

const VaeSelector: React.FC = () => {
  const [models, setModels] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const dispatch = useDispatch<AppDispatch>();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
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
  }, [sessionConfig, graphConfig]);

  const setDirty = () => {
    dispatch(setIsDirty(true));
  };

  const onModelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uuid = e.target.value;
    const name = models.find((model) => model.uuid === uuid)?.name;
    if (!uuid || !name) return;

    setDirty();
    setSelectedModel(uuid);

    try {
      dispatch(setIsLoading(true));
      const res = await dispatch(
        setSessionConfigByVaeIdName({
          vaeId: uuid,
          vaeName: name,
        })
      );

      // get session Id
      const sessionId: string = (res.payload as any).sessionId;

      // retrieve SELEX data
      const resSelex = await apiClient.getSelexData({
        queries: {
          vae_uuid: uuid,
        },
      });
      dispatch(
        setVaeData(
          Array.from({ length: resSelex.coord_x.length }, (_, i) => ({
            key: i,
            randomRegion: resSelex.random_regions[i],
            coordX: resSelex.coord_x[i],
            coordY: resSelex.coord_y[i],
            duplicates: resSelex.duplicates[i],
            isSelected: false,
            isShown: false,
          }))
        )
      );

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
          wholeSelected: false,
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

      dispatch(setIsLoading(false));
    } catch (e) {
      console.error(e);
      return;
    }
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Select value={selectedModel} onChange={onModelChange}>
          {models.map((model, i) => (
            <option key={i} value={model.uuid}>
              {model.name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
    </>
  );
};

export default VaeSelector;
