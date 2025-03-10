import { range } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import { Alert, Button, Form, InputGroup } from "react-bootstrap";
import { z } from "zod";
import { apiClient } from "~/services/api-client";
import { responseGetGMMJobsItems } from "~/services/route/gmm";
import { FormModal } from "./modal";

export const GmmNumComponentSelector: React.FC<{
  jobItem: z.infer<typeof responseGetGMMJobsItems>;
  uuid: string;
}> = ({ jobItem, uuid }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const router = useRouter();

  const numComponents = range(
    jobItem.params.minimum_n_components,
    jobItem.params.maximum_n_components + 1,
    jobItem.params.step_size
  );

  const onSubmit = async (name: string) => {
    if (jobItem.status !== "success") {
      return;
    }
    await apiClient.publishGMMJobs({
      name: name,
      uuid: uuid,
      n_components: jobItem.gmm.current_n_components,
    });
  };

  if (jobItem.status === "failure" || jobItem.status == "pending") {
    return <Alert variant="warning">Detected no available results.</Alert>;
  }

  return (
    <>
      <FormModal
        defaultName={jobItem.name}
        title="Apply to Viewer Dataset"
        label={
          "Please enter the name of the gmm to apply to the viewer dataset."
        }
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        onSubmit={onSubmit}
      />

      <InputGroup className="mb-3">
        <InputGroup.Text>Number of components</InputGroup.Text>
        <Form.Select
          onChange={(e) => {
            const n = parseInt(e.currentTarget.value);
            router.push(`?experiment=${uuid}&n_components=${n}`, undefined, {
              scroll: false,
            });
          }}
          value={jobItem.gmm.current_n_components}
        >
          {numComponents.map((n) => (
            <option key={n} value={n}>
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
