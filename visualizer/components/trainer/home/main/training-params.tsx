import { z } from "zod";
import { responseGetItem } from "../../../../services/api-client";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import ClientOnly from "../../../common/client-only";

type ParamsType = z.infer<typeof responseGetItem>["params_training"];

const columns = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "item", header: "Item", defaultFlex: 1 },
  { name: "value", header: "Value" },
];

export const TrainingParams: React.FC<{
  value: ParamsType;
}> = (props) => {
  return (
    <ClientOnly>
      <ReactDataGrid
        idProperty="id"
        columns={columns}
        dataSource={Object.entries(props.value).map(([k, v], index) => ({
          id: index,
          item: k,
          value: String(v),
        }))}
        rowStyle={{ fontFamily: "monospace" }}
      />
    </ClientOnly>
  );
};
