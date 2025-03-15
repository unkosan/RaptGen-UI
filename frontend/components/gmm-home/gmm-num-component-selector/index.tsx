import { useState } from "react";
import { Alert, Button, Form, InputGroup } from "react-bootstrap";
import FormModal from "~/components/common/form-modal";
import { useNumComponents, Job } from "./hooks/use-num-components";

export const GmmNumComponentSelector: React.FC<{
  jobItem: Job;
}> = ({ jobItem }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { value, optimalValue, range, handleSelect, handleSubmit } =
    useNumComponents(jobItem);

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
        onSubmit={handleSubmit}
      />

      <InputGroup className="mb-3">
        <InputGroup.Text>Number of components</InputGroup.Text>
        <Form.Select onChange={handleSelect} value={value}>
          {range.map((n) => (
            <option key={n} value={n}>
              {n}
              {n === optimalValue ? "(optimal)" : null}
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
