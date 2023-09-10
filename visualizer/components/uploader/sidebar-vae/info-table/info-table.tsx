import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import React from "react";
import ReactDataGrid from "@inovua/reactdatagrid-community";
import ClientOnly from "~/components/common/client-only";

const gridStyle = { minHeight: 163, width: "100%", zIndex: 1000 };

const columns = [
  { name: "id", type: "number", header: "ID", defaultVisible: false },
  { name: "item", header: "Item", defaultFlex: 1 },
  { name: "value", header: "Value" },
];

const InfoTable: React.FC = () => {
  const sequenceData = useSelector(
    (state: RootState) => state.vaeConfig.sequenceData
  );
  const data = [
    { id: 0, item: "Total Entry Count", value: sequenceData.totalLength },
    { id: 1, item: "Uniquified Entry Count", value: sequenceData.uniqueLength },
    { id: 2, item: "Adapters Matched", value: sequenceData.matchedLength },
    {
      id: 3,
      item: "Unique Ratio",
      value: sequenceData.uniqueLength / sequenceData.totalLength,
    },
  ];

  return (
    <ClientOnly>
      <ReactDataGrid
        idProperty="id"
        columns={columns}
        dataSource={data}
        style={gridStyle}
        rowHeight={30}
        rowStyle={{
          fontFamily: "monospace",
        }}
      />
    </ClientOnly>
  );
};

export default InfoTable;
