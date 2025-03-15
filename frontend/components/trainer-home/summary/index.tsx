import React from "react";
import { Badge } from "react-bootstrap";
import { z } from "zod";
import { CustomDataGrid } from "~/components/common/custom-datagrid";
import { responseGetItem } from "~/services/route/train";

export type SummaryType = z.infer<typeof responseGetItem>["summary"];

export type CellProps = {
  data: {
    id: number;
    status: string;
    total_epochs: number;
    nlls: number;
  };
};

export const Summary: React.FC<{
  value: SummaryType;
}> = ({ value }) => {
  const columns = [
    { name: "id", type: "number", header: "ID", width: 60 },
    {
      name: "status",
      header: "Status",
      width: 90,
      render: (props: CellProps) => {
        return (
          <center>
            {((status: string) => {
              switch (status) {
                case "success":
                  return (
                    <Badge pill bg="success">
                      {status}
                    </Badge>
                  );
                case "progress":
                  return (
                    <Badge pill bg="primary">
                      {status}
                    </Badge>
                  );
                case "failure":
                  return (
                    <Badge pill bg="danger">
                      {status}
                    </Badge>
                  );
                default:
                  return (
                    <Badge pill bg="warning">
                      {status}
                    </Badge>
                  );
              }
            })(props.data.status)}
          </center>
        );
      },
    },
    { name: "total_epochs", header: "Total Epochs", defaultFlex: 1 },
    { name: "nlls", header: "log ELBO", defaultFlex: 1 },
  ];

  const { indices, statuses, epochs_finished, minimum_NLLs } = value;

  const dataSource = indices.map((idx, i) => ({
    id: idx,
    status: statuses[i],
    total_epochs: epochs_finished[i],
    nlls: minimum_NLLs[i],
  }));

  const gridStyle = {
    minHeight: 300,
    width: "100%",
    zIndex: 1000,
  };

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
