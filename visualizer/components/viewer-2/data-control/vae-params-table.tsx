import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { Table } from "react-bootstrap";

const VAEParamsTable: React.FC = () => {
  const [paramsList, setParamsList] = useState<{ [keys: string]: string }>(
    {} as { [keys: string]: string }
  );

  const vaeName = useSelector((state: RootState) => state.graphConfig.vaeName);

  useEffect(() => {
    (async () => {
      if (vaeName === "") {
        setParamsList({} as { [keys: string]: string });
        return;
      }

      const res = await axios
        .get("/data/VAE-model-parameters", {
          params: {
            VAE_model_name: vaeName,
          },
        })
        .then((res) => res.data);

      if (res.status === "success") {
        setParamsList(res.data);
      }
    })();
  }, [vaeName]);

  return (
    <Table striped bordered hover size="sm">
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
            <td className="font-monospace text-break">{paramsList[key]}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default VAEParamsTable;
