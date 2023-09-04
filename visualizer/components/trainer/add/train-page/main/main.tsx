import React from "react";
import Tables from "./tables";
import Pagenation from "./pagenation";

const Main: React.FC = () => {
  return (
    <div>
      <legend>SELEX sequences</legend>
      <Tables />
      <Pagenation />
    </div>
  );
};

export default Main;
