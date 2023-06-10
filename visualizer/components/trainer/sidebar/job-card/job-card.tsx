import React from "react";
import ChildJobCard from "./child-job-card";
import { Badge } from "react-bootstrap";

const JobCardAlt: React.FC = () => {
  let title = (
    <div className="d-flex justify-content-between align-self-center">
      <span className="d-flex flex-column font-monospace">Aloha</span>
      <div className="d-flex">
        <Badge pill bg="success" className="align-self-center">
          success
        </Badge>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "lightgray",
        borderRadius: "0.3rem",
        border: "1px solid gray",
        paddingBlock: "0.7rem",
        paddingInline: "1rem",
        cursor: "pointer",
      }}
    >
      {title}
      <ChildJobCard
        name={"No.1"}
        status="success"
        onClick={() => {
          console.log("clicked");
        }}
      />
      <ChildJobCard
        name={"No.2"}
        status="progress"
        onClick={() => {
          console.log("clicked");
        }}
        currentEpoch={341}
        totalEpoch={1000}
        duration={400}
      />
    </div>
  );
};

export default JobCardAlt;
