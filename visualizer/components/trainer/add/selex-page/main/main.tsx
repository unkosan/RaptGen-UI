import React from "react";
import UploadFile from "./upload-file";
import Pagenation from "./pagenation";

const Main: React.FC = () => {
  return (
    <>
      <legend>SELEX sequences</legend>
      <UploadFile />
      <Pagenation />
    </>
  );
};

export default Main;
