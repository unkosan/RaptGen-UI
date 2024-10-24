import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { Form } from "react-bootstrap";
import { setGraphConfig } from "../../redux/graph-config2";

const ShowGMM: React.FC = () => {
  const [value, setValue] = useState<boolean>(true);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);
  const graphConfig2 = useSelector((state: RootState) => state.graphConfig2);

  useEffect(() => {
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        showGmm: value,
      },
    });
    dispatch(
      setGraphConfig({
        ...graphConfig2,
        showGMM: value,
      })
    );
  }, [value]);

  return (
    <Form.Switch
      label="Show GMM"
      checked={value}
      onChange={(e) => setValue(e.target.checked)}
    />
  );
};

export default ShowGMM;
