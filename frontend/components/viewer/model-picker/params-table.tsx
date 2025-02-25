import CustomDataGrid from "~/components/common/custom-datagrid";

/**
 * This component is used to display the parameters of a model.
 * Used to display the parameters of a VAE or a GMM model.
 * @param param0 {
 *  params: {
 *    [keys: string]: string,
 *  }
 * }
 * @returns
 */
const ParamsTable: React.FC<{
  params: { [keys: string]: string };
}> = ({ params }) => {
  const columns = [
    {
      name: "parameter",
      header: "Parameter",
      defaultFlex: 1,
    },
    {
      name: "value",
      header: "Value",
      defaultFlex: 1,
    },
  ];

  const dataSource = Object.keys(params).map((key) => ({
    id: key,
    parameter: key,
    value: params[key],
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
      rowHeight={35}
      style={gridStyle}
    />
  );
};

export default ParamsTable;
