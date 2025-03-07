import React from "react";
import { CustomDataGrid } from "~/components/common/custom-datagrid";
import { SummaryType, useSummary } from "./hooks/use-summary";

export const Summary: React.FC<{
  value: SummaryType;
}> = (props) => {
  const { columns, dataSource, gridStyle } = useSummary(props.value);

  return (
    <CustomDataGrid
      idProperty="id"
      className="mb-3"
      columns={columns}
      dataSource={dataSource}
      rowStyle={{ fontFamily: "monospace" }}
      defaultLimit={20}
      rowHeight={35}
      style={gridStyle}
      downloadable
      copiable
    />
  );
};
