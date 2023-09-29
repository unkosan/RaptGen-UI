import React from "react";
import { Col, Row } from "react-bootstrap";
import Main from "./main/main";
import SideBar from "./sidebar";

const TrainPage: React.FC = () => {
  return (
    <div>
      <div>
        <Row>
          <Col md={4}>
            <SideBar />
          </Col>
          <Col>
            <Main />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TrainPage;
