import { Card } from "react-bootstrap";
import { z } from "zod";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { responseGetGMMJobsItems } from "~/services/route/gmm";

type JobItem = z.infer<typeof responseGetGMMJobsItems>;

const ParamsTable: React.FC<{ params: JobItem["params"] }> = ({ params }) => {
  const dataSource = Object.entries(params).map(([key, value]) => ({
    id: key,
    item: key,
    value: value,
  }));

  return (
    <Card className="mb-3">
      <Card.Header>Parameters</Card.Header>
      <CustomDataGrid
        idProperty="id"
        columns={[
          {
            name: "id",
            type: "number",
            header: "ID",
            defaultVisible: false,
          },
          {
            name: "item",
            type: "string",
            header: "Item",
            flex: 1,
          },
          {
            name: "value",
            type: "string",
            header: "Value",
          },
        ]}
        dataSource={dataSource}
        downloadable
        style={{ minHeight: 251 }}
      />
    </Card>
  );
};

export default ParamsTable;
