import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useDispatch } from "react-redux";

import ReactDataGrid from "@inovua/reactdatagrid-community";
import "@inovua/reactdatagrid-community/index.css";
import ClientOnly from "../../common/client-only";
import { altApiClient } from "../../../services/alt-api-client";

const VAEParamsTable: React.FC = () => {
  const [paramsList, setParamsList] = useState<{ [keys: string]: string }>(
    {} as { [keys: string]: string }
  );

  const vaeName = useSelector((state: RootState) => state.graphConfig.vaeName);

  const [forwardAdapter, setForwardAdapter] = useState<string>("");
  const [reverseAdapter, setReverseAdapter] = useState<string>("");

  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      if (vaeName === "") {
        setParamsList({} as { [keys: string]: string });
        return;
      }

      const res = await altApiClient.getVAEModelParameters({
        queries: {
          VAE_model_name: vaeName,
        },
      });

      if (res.status === "success") {
        setParamsList(res.data);
        if (res.data["fwd_adapter"]) {
          setForwardAdapter(res.data["fwd_adapter"]);
        }
        if (res.data["rev_adapter"]) {
          setReverseAdapter(res.data["rev_adapter"]);
        }
      }
    })();
  }, [vaeName]);

  useEffect(() => {
    (async () => {
      dispatch({
        type: "sessionConfig/setAdapters",
        payload: {
          forwardAdapter: forwardAdapter,
          reverseAdapter: reverseAdapter,
        },
      });
    })();
  }, [forwardAdapter, reverseAdapter]);

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

export default VAEParamsTable;
