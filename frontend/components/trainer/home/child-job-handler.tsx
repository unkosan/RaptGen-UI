import { responseGetItemChild } from "~/services/route/train";
import { responseGetItem } from "~/services/route/train";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { apiClient } from "~/services/api-client";

type ChildItem = z.infer<typeof responseGetItemChild>;
type ParentItem = z.infer<typeof responseGetItem>;

const ApplyViewerButton: React.FC<{
  uuid: string;
  childId?: number;
  disabled: boolean;
  setDisabled: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ uuid, childId, disabled, setDisabled }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <>
      <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Apply to Viewer Dataset</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Enter the name of the experiment to apply to the viewer dataset.
          </p>
          <Form.Control
            type="text"
            placeholder="Experiment Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              apiClient.postPublish({ uuid, multi: childId, name });
              setDisabled(!disabled);
              setIsModalOpen(false);
            }}
            disabled={name === ""}
          >
            Add to Viewer Dataset
          </Button>
        </Modal.Footer>
      </Modal>
      <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
      >
        {disabled ? "Added" : "Add to Viewer Dataset"}
      </Button>
    </>
  );
};

export const ChildJobHandler: React.FC<{
  childItem: ChildItem;
  parentItem: ParentItem;
}> = ({ childItem, parentItem }) => {
  const [published, setPublished] = useState<boolean>(false);
  const router = useRouter();

  return (
    <Form.Group>
      <InputGroup className="mb-3">
        <InputGroup.Text>Target model ID</InputGroup.Text>
        <Form.Control
          as="select"
          onChange={(e) => {
            router.push(
              `?experiment=${parentItem.uuid}&job=${e.currentTarget.value}`,
              undefined,
              {
                scroll: false,
              }
            );
          }}
          value={childItem.id}
        >
          {parentItem.summary.indices.map((index) => {
            return (
              <option key={index} value={index}>
                {index}
              </option>
            );
          })}
        </Form.Control>
        {childItem.status === "success" ? (
          <ApplyViewerButton
            uuid={parentItem.uuid}
            childId={
              isNaN(parseInt(router.query.job as string))
                ? undefined
                : parseInt(router.query.job as string)
            }
            disabled={childItem.is_added_viewer_dataset || published}
            setDisabled={setPublished}
          />
        ) : null}
      </InputGroup>
    </Form.Group>
  );
};
