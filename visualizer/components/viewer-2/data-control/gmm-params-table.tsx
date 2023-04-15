import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Table } from "react-bootstrap";

const GMMParamsTable: React.FC = () => {
  const [paramsList, setParamsList] = useState<{ [keys: string]: string }>(
    {} as { [keys: string]: string }
  );

  const vaeName = useSelector((state: RootState) => state.graphConfig.vaeName);
  const gmmName = useSelector((state: RootState) => state.graphConfig.gmmName);

  useEffect(() => {
    (async () => {
      if (vaeName === "") {
        setParamsList({} as { [keys: string]: string });
        return;
      }

      if (gmmName === "") {
        setParamsList({} as { [keys: string]: string });
        return;
      }

      const res = await axios
        .get("/data/GMM-model-parameters", {
          params: {
            VAE_model_name: vaeName,
            GMM_model_name: gmmName,
          },
        })
        .then((res) => res.data);

      if (res.status === "success") {
        setParamsList(res.data);
      }
    })();
  }, [vaeName, gmmName]);

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(paramsList).map((key) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{paramsList[key]}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default GMMParamsTable;
