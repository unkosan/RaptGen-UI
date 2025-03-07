import React from "react";
import { CustomDataGrid } from "~/components/common/custom-datagrid";
import { ParamsType, useTrainingParams } from "./hooks/use-training-params";

export const TrainingParams: React.FC<{
  value: ParamsType;
}> = (props) => {
  const { dataSource, columns, gridStyle } = useTrainingParams(props.value);

  return (
    <CustomDataGrid
      idProperty="id"
      className="mb-3"
      columns={columns}
      dataSource={dataSource}
      rowStyle={{ fontFamily: "monospace" }}
      rowHeight={35}
      style={gridStyle}
      downloadable
      copiable
    />
  );
};
