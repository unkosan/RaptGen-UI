import { useEffect, useState } from "react";
import { Badge, InputGroup, Tooltip } from "react-bootstrap";
import {
  Button,
  Form,
  ListGroup,
  OverlayTrigger,
  Stack,
  Tab,
  Tabs,
} from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseExperimentList } from "~/services/route/bayesopt";
import { RootState } from "../redux/store";

const BayesOptConfig: React.FC = () => {
  return (
    <>
      <legend>Bayes-Opt Configuration</legend>
      <Form.Group className="mb-3">
        <Form.Label>Optimization method</Form.Label>
        <Form.Control as="select">
          <option>qEI (multiple query)</option>
        </Form.Control>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>The name of the value to optimize</Form.Label>
        <Form.Control as="select">
          <option>value-1</option>
        </Form.Control>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Query budget (The number of proposal values)</Form.Label>
        <Form.Control type="number" />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Switch label="show contour plot" />
      </Form.Group>
    </>
  );
};

export default BayesOptConfig;
