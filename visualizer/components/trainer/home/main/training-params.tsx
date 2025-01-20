import { z } from "zod";
import { responseGetItem } from "~/services/route/train";
import CustomDataGrid from "~/components/common/custom-datagrid";

type ParamsType = z.infer<typeof responseGetItem>["params_training"];

const columns = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "item", header: "Item", defaultFlex: 1 },
  { name: "value", header: "Value" },
];

const gridStyle = {
  height: 300,
};

export const TrainingParams: React.FC<{
  value: ParamsType;
}> = (props) => {
  return (
    <CustomDataGrid
      idProperty="id"
      className="mb-3"
      columns={columns}
      dataSource={Object.entries(props.value).map(([k, v], index) => ({
        id: index,
        item: k,
        value: String(v),
      }))}
      rowStyle={{ fontFamily: "monospace" }}
      rowHeight={35}
      style={gridStyle}
      downloadable
      copiable
    />
  );
};
