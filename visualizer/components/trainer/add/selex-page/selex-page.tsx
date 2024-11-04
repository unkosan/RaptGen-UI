import React from "react";
import { Col, Row } from "react-bootstrap";
import SideBar from "./sidebar";
import Main from "./main/main";

const SelexPage: React.FC = () => {
  return (
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
  );
};

export default SelexPage;
