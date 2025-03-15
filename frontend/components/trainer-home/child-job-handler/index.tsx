import { useCallback, useState } from "react";
import { useRouter } from "next/router";
import { Button, Form, InputGroup } from "react-bootstrap";
import { z } from "zod";
import { responseGetItemChild, responseGetItem } from "~/services/route/train";
import { apiClient } from "~/services/api-client";
import FormModal from "~/components/common/form-modal";

type ChildItem = z.infer<typeof responseGetItemChild>;
type ParentItem = z.infer<typeof responseGetItem>;

export const ChildJobHandler: React.FC<{
  childItem: ChildItem;
  parentItem: ParentItem;
}> = ({ childItem, parentItem }) => {
  const [published, setPublished] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = useCallback(
    async (name: string) => {
      try {
        const childId = isNaN(parseInt(router.query.job as string))
          ? undefined
          : parseInt(router.query.job as string);

        await apiClient.postPublish({
          uuid: parentItem.uuid,
          multi: childId,
          name,
        });

        setPublished(true);
      } catch (error) {
        console.error(error);
      }
    },
    [router, parentItem.uuid]
  );

  return (
    <>
      <FormModal
        defaultName={parentItem.name}
        title="Apply to Viewer Dataset"
        label="Enter the name of the experiment to apply to the viewer dataset."
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        onSubmit={handleSubmit}
      />

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
            {parentItem.summary.indices.map((index) => (
              <option key={index} value={index}>
                {index}
              </option>
            ))}
          </Form.Control>

          {childItem.status === "success" && (
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              disabled={childItem.is_added_viewer_dataset || published}
            >
              {childItem.is_added_viewer_dataset || published
                ? "Added"
                : "Add to Viewer Dataset"}
            </Button>
          )}
        </InputGroup>
      </Form.Group>
    </>
  );
};
