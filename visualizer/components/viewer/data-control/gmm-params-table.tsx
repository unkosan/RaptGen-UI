import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import ClientOnly from "../../common/client-only";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import { altApiClient } from "../../../services/alt-api-client";

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

      const res = await altApiClient.getGMMModelParameters({
        queries: {
          VAE_model_name: vaeName,
          GMM_model_name: gmmName,
        },
      });

      if (res.status === "success") {
        setParamsList(res.data);
      }
    })();
  }, [vaeName, gmmName]);

  const gridStyle = {
    minHeight: 250,
    width: "100%",
    zIndex: 1000,
  };

  return (
    <ClientOnly>
      <ReactDataGrid
        idProperty="id"
        columns={[
          {
            name: "parameter",
            header: "Parameter",
            defaultFlex: 1,
          },
          {
            name: "value",
            header: "Value",
            defaultFlex: 1,
          },
        ]}
        dataSource={Object.keys(paramsList).map((key) => ({
          id: key,
          parameter: key,
          value: paramsList[key],
        }))}
        rowStyle={{ fontFamily: "monospace" }}
        rowHeight={35}
        style={gridStyle}
      />
    </ClientOnly>
  );
};

export default GMMParamsTable;
