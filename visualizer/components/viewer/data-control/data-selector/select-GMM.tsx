import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setGmmId } from "../../redux/session-config2";

const SelectGMM: React.FC = () => {
  const [models, setModels] = useState<
    {
      uuid: string;
      name: string;
    }[]
  >([]);
  const [id, setId] = useState<string>("");

  const dispatch = useDispatch();
  const sessionConfig2 = useSelector(
    (state: RootState) => state.sessionConfig2
  );

  useEffect(() => {
    (async () => {
      if (!sessionConfig2.vaeId || !sessionConfig2.vaeId) {
        return;
      }

      const res = await apiClient.getGMMModelNames({
        queries: {
          vae_uuid: sessionConfig2.vaeId,
        },
      });
      setModels(res.entries);

      if (res.entries.length > 0) {
        setId(res.entries[0].uuid);
        dispatch(setGmmId(res.entries[0].uuid));
      } else {
        setId("");
        dispatch(setGmmId(""));
      }
    })();
  }, [sessionConfig2.vaeId]);

  const onChangeGMM = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setId(e.target.value);
    dispatch(setGmmId(e.target.value));
  };

  return (
    <>
      <Form.Select value={id} onChange={onChangeGMM}>
        {models.map((model, index) => (
          <option key={index} value={model.uuid}>
            {model.name}
          </option>
        ))}
      </Form.Select>
    </>
  );
};

export default SelectGMM;
