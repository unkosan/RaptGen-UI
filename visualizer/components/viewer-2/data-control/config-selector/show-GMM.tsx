import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import { Form } from "react-bootstrap";

const ShowGMM: React.FC = () => {
  const [value, setValue] = useState<boolean>(true);

  const dispatch = useDispatch();
  const graphConfig = useSelector((state: RootState) => state.graphConfig);

  useEffect(() => {
    dispatch({
      type: "graphConfig/set",
      payload: {
        ...graphConfig,
        showGmm: value,
      },
    });
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
