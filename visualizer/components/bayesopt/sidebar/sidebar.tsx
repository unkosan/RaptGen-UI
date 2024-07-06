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
import BayesOptConfig from "./bayes-opt-config";
import InitialDataset from "./initial-dataset";
import VaeSelector from "./vae-selector";
import Versions from "./versions";

const SideBar: React.FC = () => {
  return (
    <div>
      <Versions />
      <hr />
      <VaeSelector />
      <InitialDataset />
      <BayesOptConfig />
    </div>
  );
};

export default SideBar;
