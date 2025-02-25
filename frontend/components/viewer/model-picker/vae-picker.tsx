import { useRouter } from "next/router";
import { useState } from "react";
import { ListGroup, Stack } from "react-bootstrap";
import { Pencil, XLg } from "react-bootstrap-icons";
import { apiClient } from "~/services/api-client";
import { DeleteModal, RenameModal } from "./modals";
import { usePickVAE } from "./hooks/dispatchers";

/**
 * VAE model picker. Renders a list of VAE models.
 * @param param0 {
 *  entries: {
 *    uuid: string,
 *    name: string,
 *  }[],
 *  selectedId: string,
 *  refreshFunc: () => void,
 * }
 * @returns
 */
const VAEPicker: React.FC<{
  entries: {
    uuid: string;
    name: string;
  }[];
  selectedId: string;
  refreshFunc: () => void;
}> = ({ entries, selectedId, refreshFunc }) => {
  const router = useRouter();
  const [isRenameModelOpen, setIsRenameModelOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pickedId, setPickedId] = useState<string>("");
  const [pickedName, setPickedName] = useState<string>("");

  // const { modelId, setModelId } = usePickVAE();

  return (
    <div
      style={{
        height: "230px",
        overflowY: "scroll",
        border: "2px solid #e5e5e5",
      }}
    >
      <ListGroup variant="flush">
        {entries.map((model, index) => (
          <ListGroup.Item
            action
            key={index}
            active={model.uuid === selectedId}
            onClick={(e) => {
              // default behavior of the button is to submit the form
              e.preventDefault();
              router.push(`?uuid=${model.uuid}`, undefined, {
                shallow: true,
              });
              // setModelId(model.uuid, model.name);
            }}
          >
            <Stack direction="horizontal" gap={3}>
              <span className="fs-5 me-2">{model.name}</span>
              <span className="ms-auto"></span>
              <Pencil
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPickedId(model.uuid);
                  setPickedName(model.name);
                  setIsRenameModelOpen(true);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "lightgreen";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "inherit";
                }}
              />
              <XLg
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPickedId(model.uuid);
                  setPickedName(model.name);
                  setIsDeleteModalOpen(true);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "red";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "inherit";
                }}
              />
            </Stack>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <RenameModal
        defaultName={pickedId}
        title="Rename VAE model"
        label="Please enter a new name for the VAE model."
        isOpen={isRenameModelOpen}
        setIsOpen={setIsRenameModelOpen}
        onSubmit={async (name) => {
          await apiClient.patchVaeItems(
            {
              target: "name",
              value: name,
            },
            {
              params: {
                vae_uuid: pickedId,
              },
            }
          );
          refreshFunc();
        }}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        title="Delete VAE model"
        label={
          <p>
            Are you sure you want to delete the VAE model{" "}
            <span className="fw-bold">{pickedName}</span>
          </p>
        }
        onSubmit={async () => {
          await apiClient.deleteVaeItems(undefined, {
            params: {
              vae_uuid: pickedId,
            },
          });
          refreshFunc();
          if (pickedId === selectedId) {
            router.push(``, undefined, {
              shallow: true,
            });
          }
        }}
      />
    </div>
  );
};

export default VAEPicker;
