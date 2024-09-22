import { z } from "zod";
import CustomDataGrid from "~/components/common/custom-datagrid";
import { responseGetGMMJobsItems } from "~/services/route/gmm";

type JobItem = z.infer<typeof responseGetGMMJobsItems>;

const ParamsTable: React.FC<{ params: JobItem["params"] }> = ({ params }) => {
  return (
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
      dataSource={[
        {
          item: "Minimum number of components",
          value: params.minimum_n_components,
        },
        {
          item: "Maximum number of components",
          value: params.maximum_n_components,
        },
        { item: "Step size", value: params.step_size },
        { item: "Number of trials", value: params.n_trials },
      ]}
      downloadable
      style={{ minHeight: 255 }}
    />
  );
};

export default ParamsTable;
