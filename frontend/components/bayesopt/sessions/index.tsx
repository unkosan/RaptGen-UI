import React, { useState } from "react";
import { Button, ListGroup, Stack } from "react-bootstrap";
import { PlusLg, Pencil, XLg } from "react-bootstrap-icons";
import { useRouter } from "next/router";
import { useSessions } from "./hooks/use-sessions";
import FormModal from "~/components/common/form-modal";
import ConfirmModal from "~/components/common/confirm-modal";

/**
 * Sessions component
 * Manages experiment sessions for Bayesian optimization
 * Uses the useSessions hook for all the logic
 */
const Sessions: React.FC = () => {
  const router = useRouter();
  // Modal states
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    // State
    sessionEntries,
    currentSessionId,
    currentSessionName,
    isDirty,

    // Selected experiment
    targetEntryName,

    // Actions
    handleSave,
    handleSaveAs,
    handleNew,
    handleRename,
    handleDelete,
    setTargetEntry,
  } = useSessions();

  return (
    <>
      <div
        style={{
          height: "230px",
          overflowY: "scroll",
          border: "2px solid #e5e5e5",
        }}
      >
        <ListGroup variant="flush">
          {sessionEntries.map(({ uuid, name, last_modified }, i) => (
            <ListGroup.Item
              action
              key={i}
              active={currentSessionId === uuid}
              onClick={(e) => {
                e.preventDefault();
                if (currentSessionId === uuid) {
                  router.reload();
                } else {
                  router.push(`?uuid=${uuid}`);
                }
              }}
            >
              <Stack direction="horizontal" gap={3}>
                <span className="fs-5 me-2">{name}</span>
                <span className="fs-6 fw-light ms-auto">
                  last modified:{" "}
                  {new Date(last_modified * 1000).toLocaleDateString()}
                </span>
                <Pencil
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTargetEntry(uuid, name);
                    setIsRenameModalOpen(true);
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
                    setTargetEntry(uuid, name);
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
      </div>
      <Stack direction="horizontal" className="mt-2" gap={3}>
        <Button variant="outline-primary" onClick={handleNew}>
          <div className="d-flex align-items-center">
            <PlusLg />
            &nbsp; New
          </div>
        </Button>
        <Button
          variant="outline-primary"
          className="ms-auto"
          onClick={handleSave}
          disabled={!isDirty}
        >
          Save
        </Button>
        <Button
          variant="outline-primary"
          onClick={() => setIsSaveAsModalOpen(true)}
        >
          Save as...
        </Button>
      </Stack>

      {/* Modals */}
      <FormModal
        defaultName={`New ${currentSessionName}`}
        title="Save Experiment"
        label="Please enter the name for the experiment."
        isOpen={isSaveAsModalOpen}
        setIsOpen={setIsSaveAsModalOpen}
        onSubmit={handleSaveAs}
      />

      <FormModal
        defaultName={targetEntryName}
        title="Rename Experiment"
        isOpen={isRenameModalOpen}
        setIsOpen={setIsRenameModalOpen}
        onSubmit={handleRename}
        label="Please enter the new name for the experiment."
      />

      <ConfirmModal
        title="Delete Experiment"
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        onSubmit={handleDelete}
        label={
          <p>
            Are you sure you want to delete the experiment{" "}
            <span className="fw-bold">{targetEntryName}</span>?
          </p>
        }
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default Sessions;
