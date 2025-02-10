import { range } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Alert,
  Button,
  Form,
  InputGroup,
  Modal,
  Spinner,
} from "react-bootstrap";
import { z } from "zod";
import { useIsLoading } from "~/hooks/common";
import { apiClient } from "~/services/api-client";
import { responseGetGMMJobsItems } from "~/services/route/gmm";

export const GmmNumComponentSelector: React.FC<{
  jobItem: z.infer<typeof responseGetGMMJobsItems>;
  uuid: string;
}> = ({ jobItem, uuid }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");

  const router = useRouter();

  const [isLoading, lock, unlock] = useIsLoading();

  const numComponents = range(
    jobItem.params.minimum_n_components,
    jobItem.params.maximum_n_components + 1,
    jobItem.params.step_size
  );

  if (jobItem.status === "failure" || jobItem.status == "pending") {
    return <Alert variant="warning">Detected no available results.</Alert>;
  }

  return (
    <>
      <Modal
        show={isModalOpen}
        onHide={() => {
          setIsModalOpen(false);
          setName("");
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Apply to Viewer Dataset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Please enter the name of the gmm to apply to the viewer dataset.
          </p>
          <Form.Control
            type="text"
            placeholder="GMM Experiment Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setIsModalOpen(false);
              setName("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!name || isLoading}
            onClick={async () => {
              if (jobItem.status !== "success") {
                return;
              }
              lock();
              await apiClient.publishGMMJobs({
                name: name,
                uuid: uuid,
                n_components: jobItem.gmm.current_n_components,
              });
              unlock();
              setIsModalOpen(false);
            }}
          >
            {isLoading ? <Spinner animation="border" size="sm" /> : "OK"}
          </Button>
        </Modal.Footer>
      </Modal>
      <InputGroup className="mb-3">
        <InputGroup.Text>Number of components</InputGroup.Text>
        <Form.Select
          onChange={(e) => {
            const n = parseInt(e.currentTarget.value);
            router.push(`?experiment=${uuid}&n_components=${n}`, undefined, {
              scroll: false,
            });
          }}
        >
          {numComponents.map((n) => (
            <option
              key={n}
              value={n}
              selected={jobItem.gmm.current_n_components === n}
            >
              {n}
              {n === jobItem.gmm.optimal_n_components ? "(optimal)" : null}
            </option>
          ))}
        </Form.Select>
        {jobItem.status === "success" && (
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add to viewer dataset
          </Button>
        )}
      </InputGroup>
    </>
  );
};
