import React from "react";
import { LatentGraph } from "./latent-graph";
import { RegisteredTable } from "./registered-table";
import { QueryTable } from "./query-table";

const Main: React.FC = () => {
  return (
    <div>
      <LatentGraph />

      <RegisteredTable />

      <QueryTable />
    </div>
  );
};

export default Main;
