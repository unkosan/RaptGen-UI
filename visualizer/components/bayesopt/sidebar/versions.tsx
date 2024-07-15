import { useEffect, useState } from "react";
import { Button, ListGroup, Stack } from "react-bootstrap";
import { PlusLg } from "react-bootstrap-icons";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseExperimentList } from "~/services/route/bayesopt";
import { RootState } from "../redux/store";

const Versions: React.FC = () => {
  const [list, setList] = useState<z.infer<typeof responseExperimentList>>([]);

  // retrieve experiment data
  useEffect(() => {
    (async () => {
      const res = await apiClient.listExperiments();
      setList(res);
    })();
  }, []);

  return (
    <>
      <legend>Bayes-Opt experiments</legend>
      <div
        style={{
          height: "230px",
          overflowY: "scroll",
          border: "2px solid #e5e5e5",
        }}
      >
        <ListGroup variant="flush">
          {list.map((experiment, i) => (
            <ListGroup.Item action href={`?uuid=${experiment.uuid}`} key={i}>
              <Stack direction="horizontal" gap={3}>
                <span className="fs-5 me-2">{experiment.name}</span>
                <span className="fs-6 fw-light ms-auto">
                  last modified:{" "}
                  {new Date(
                    experiment.last_modified * 1000
                  ).toLocaleDateString()}
                </span>
              </Stack>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
      <Stack direction="horizontal" className="mt-2" gap={3}>
        <Button variant="outline-primary">
          <PlusLg /> New
        </Button>
        <Button variant="outline-primary" className="ms-auto">
          save
        </Button>
        <Button variant="outline-primary">save as...</Button>
      </Stack>
    </>
  );
};

export default Versions;
