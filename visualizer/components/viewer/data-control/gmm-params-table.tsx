import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { apiClient } from "~/services/api-client";
import CustomDataGrid from "~/components/common/custom-datagrid";

const GMMParamsTable: React.FC = () => {
  const [paramsList, setParamsList] = useState<{ [keys: string]: string }>(
    {} as { [keys: string]: string }
  );

  const gmmId = useSelector((state: RootState) => state.sessionConfig.gmmId);

  useEffect(() => {
    (async () => {
      if (gmmId === "") {
        setParamsList({} as { [keys: string]: string });
        return;
      }

      const res = await apiClient.getGMMModelParameters({
        queries: {
          gmm_uuid: gmmId,
        },
      });

      setParamsList(res);
    })();
  }, [gmmId]);

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

export default GMMParamsTable;
