import { z } from "zod";
import { responseGetItem } from "~/services/route/train";

export type ParamsType = z.infer<typeof responseGetItem>["params_training"];

export const useTrainingParams = (value: ParamsType) => {
  const dataSource = Object.entries(value).map(([k, v], index) => ({
    id: index,
    item: k,
    value: String(v),
  }));

  const columns = [
    { name: "id", type: "number", header: "ID", defaultVisible: false },
    { name: "item", header: "Item", defaultFlex: 1 },
    { name: "value", header: "Value" },
  ];

  const gridStyle = {
    height: 300,
  };

  return {
    dataSource,
    columns,
    gridStyle,
  };
};
