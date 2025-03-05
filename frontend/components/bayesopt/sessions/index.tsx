import React from "react";
import { Button, ListGroup, Stack } from "react-bootstrap";
import { PlusLg, Pencil, XLg } from "react-bootstrap-icons";
import { useRouter } from "next/router";
import { useSessions } from "./hooks/use-sessions";
import { SaveAsModal, RenameModal, DeleteModal } from "./modals";

/**
 * Sessions component
 * Manages experiment sessions for Bayesian optimization
 * Uses the useSessions hook for all the logic
 */
const Sessions: React.FC = () => {
  const router = useRouter();
  const {
    // State
    list,
    currentUUID,
    isDirty,
    isLoading,

    // Modal states
    isSaveAsModalOpen,
    setIsSaveAsModalOpen,
    isRenameModalOpen,
    setIsRenameModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,

    // Selected experiment
    selectedExperimentName,

    // Actions
    onSave,
    onSaveAs,
    onNew,
    onRename,
    onDelete,
    handleRenameClick,
    handleDeleteClick,
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
          {list.map((experiment, i) => (
            <ListGroup.Item
              action
              key={i}
              active={currentUUID === experiment.uuid}
              disabled={currentUUID === experiment.uuid}
              onClick={(e) => {
                e.preventDefault();
                router.push(`?uuid=${experiment.uuid}`);
              }}
            >
              <Stack direction="horizontal" gap={3}>
                <span className="fs-5 me-2">{experiment.name}</span>
                <span className="fs-6 fw-light ms-auto">
                  last modified:{" "}
                  {new Date(
                    experiment.last_modified * 1000
                  ).toLocaleDateString()}
                </span>
                <Pencil
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRenameClick(experiment.uuid, experiment.name);
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
                    handleDeleteClick(experiment.uuid, experiment.name);
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
        <Button variant="outline-primary" onClick={onNew}>
          <div className="d-flex align-items-center">
            <PlusLg />
            &nbsp; New
          </div>
        </Button>
        <Button
          variant="outline-primary"
          className="ms-auto"
          onClick={onSave}
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
      <SaveAsModal
        isOpen={isSaveAsModalOpen}
        setIsOpen={setIsSaveAsModalOpen}
        onSubmit={onSaveAs}
        isLoading={isLoading}
      />

      <RenameModal
        defaultName={selectedExperimentName}
        isOpen={isRenameModalOpen}
        setIsOpen={setIsRenameModalOpen}
        onSubmit={onRename}
        isLoading={isLoading}
      />

      <DeleteModal
        experimentName={selectedExperimentName}
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        onSubmit={onDelete}
        isLoading={isLoading}
      />
    </>
  );
};

export default Sessions;
