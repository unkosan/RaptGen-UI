import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

import "@inovua/reactdatagrid-community/index.css";
import { apiClient } from "~/services/api-client";
import CustomDataGrid from "~/components/common/custom-datagrid";

const VAEParamsTable: React.FC = () => {
  const [paramsList, setParamsList] = useState<{ [keys: string]: string }>(
    {} as { [keys: string]: string }
  );

  const vaeId = useSelector((state: RootState) => state.sessionConfig.vaeId);

  useEffect(() => {
    (async () => {
      if (vaeId === "") {
        setParamsList({} as { [keys: string]: string });
        return;
      }

      try {
        const res = await apiClient.getVAEModelParameters({
          queries: {
            vae_uuid: vaeId,
          },
        });

        setParamsList(res);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [vaeId]);

  const gridStyle = {
    minHeight: 300,
    width: "100%",
    zIndex: 1000,
  };

  return (
    <CustomDataGrid
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
  );
};

export default VAEParamsTable;
