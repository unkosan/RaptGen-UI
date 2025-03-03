import React from "react";
import { Button, Spinner } from "react-bootstrap";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { useRegisteredTable } from "./hooks/use-registered-table";
import { useRunBayesOptButton } from "./hooks/use-run-bayesopt-button";

const gridStyle = { minHeight: 400, width: "100%", zIndex: 950 };

type RegisteredTableProps = {
  setActiveTab: React.Dispatch<
    React.SetStateAction<"registered-table" | "query-table">
  >;
};

// Combined RegisteredTable component that includes both the table and the button
const RegisteredTable: React.FC<RegisteredTableProps> = ({ setActiveTab }) => {
  // Table logic
  const {
    dataSource,
    displayColumns,
    onEditComplete,
    onSelectionChange,
    defaultSelected,
  } = useRegisteredTable();

  // Button logic
  const { onClick, isLoading } = useRunBayesOptButton();

  return (
    <>
      <CustomDataGrid
        className="mb-2"
        columns={[
          {
            name: "seq_id",
            header: "ID",
            defaultVisible: true,
            editable: true,
          },
          {
            name: "random_region",
            header: "Random Region",
            defaultFlex: 1,
            editable: false,
          },
          ...displayColumns,
          { name: "coord_X", header: "X", editable: false },
          { name: "coord_Y", header: "Y", editable: false },
        ]}
        idProperty="seq_id"
        dataSource={dataSource}
        style={gridStyle}
        rowStyle={{ fontFamily: "monospace" }}
        checkboxColumn
        pagination
        downloadable
        editable
        onEditComplete={onEditComplete}
        defaultSelected={defaultSelected}
        onSelectionChange={onSelectionChange}
        checkboxOnlyRowSelect
        copiable
      />

      <Button
        variant="primary"
        onClick={() => {
          onClick();
          setActiveTab("query-table");
        }}
        className="mb-3"
        disabled={isLoading}
      >
        {isLoading ? (
          <Spinner animation="border" size="sm" />
        ) : (
          "Run Bayes-Opt with checked data"
        )}
      </Button>
    </>
  );
};

export default RegisteredTable;
