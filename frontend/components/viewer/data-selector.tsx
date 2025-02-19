import { useState } from "react";
import {
  Card,
  Form,
  ListGroup,
  Modal,
  Stack,
  Button,
  Spinner,
  Tabs,
  Tab,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./redux/store";
import { apiClient } from "~/services/api-client";
import { useRouter } from "next/router";
import { Pencil, XLg } from "react-bootstrap-icons";
import { setSessionConfigByVaeIdName, setGmmId } from "./redux/session-config";
import { useAsyncMemo, useIsLoading } from "~/hooks/common";
import CustomDataGrid from "../common/custom-datagrid";

const ParamsTable: React.FC<{
  params: { [keys: string]: string };
}> = ({ params }) => {
  const gridStyle = {
    minHeight: 300,
    width: "100%",
    zIndex: 1000,
  };

  return (
    <CustomDataGrid
      idProperty="id"
      className="mb-3"
      columns={[
        {
          name: "parameter",
          header: "Parameter",
          defaultFlex: 1,
        },
        {
          name: "value",
          header: "Value",
          defaultFlex: 1,
        },
      ]}
      dataSource={Object.keys(params).map((key) => ({
        id: key,
        parameter: key,
        value: params[key],
      }))}
      rowStyle={{ fontFamily: "monospace" }}
      rowHeight={35}
      style={gridStyle}
    />
  );
};

const VAEPicker: React.FC<{
  entries: {
    uuid: string;
    name: string;
  }[];
  uuid: string;
  refreshFunc: () => void;
}> = ({ entries, uuid, refreshFunc }) => {
  const router = useRouter();
  const [isRenameModelOpen, setIsRenameModelOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [isLoading, lock, unlock] = useIsLoading();

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
            active={model.uuid === uuid}
            onClick={(e) => {
              // default behavior of the button is to submit the form
              e.preventDefault();
              router.push(`?uuid=${model.uuid}`, undefined, {
                shallow: true,
              });
            }}
          >
            <Stack direction="horizontal" gap={3}>
              <span className="fs-5 me-2">{model.name}</span>
              <span className="ms-auto"></span>
              <Pencil
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedId(model.uuid);
                  setNewName(model.name);
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
                  setSelectedId(model.uuid);
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

      <Modal
        show={isRenameModelOpen}
        onHide={() => setIsRenameModelOpen(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Rename VAE model</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please enter a new name for the VAE model.</p>
          <Form.Control
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setIsRenameModelOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              lock();
              await apiClient.patchVaeItems(
                {
                  target: "name",
                  value: newName,
                },
                {
                  params: {
                    vae_uuid: selectedId,
                  },
                }
              );
              refreshFunc();
              unlock();
              setIsRenameModelOpen(false);
            }}
            disabled={!newName || isLoading}
          >
            {isLoading ? <Spinner animation="border" size="sm" /> : "OK"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isDeleteModalOpen}
        onHide={() => setIsDeleteModalOpen(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete VAE model</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to delete the VAE model{" "}
            <span className="fw-bold">
              {entries.find((model) => model.uuid === selectedId)?.name}
            </span>
            ?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setIsDeleteModalOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              lock();
              await apiClient.deleteVaeItems(undefined, {
                params: {
                  vae_uuid: selectedId,
                },
              });
              refreshFunc();
              unlock();
              setIsDeleteModalOpen(false);
              if (selectedId === uuid) {
                router.push(``, undefined, {
                  shallow: true,
                });
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? <Spinner animation="border" size="sm" /> : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const DataSelector: React.FC = () => {
  const router = useRouter();
  const uuid = router.query.uuid;
  const vaeId = useSelector((state: RootState) => state.sessionConfig.vaeId);
  const gmmId = useSelector((state: RootState) => state.sessionConfig.gmmId);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const vaeEntries = useAsyncMemo(
    async () => {
      if (!router.isReady) {
        return [];
      }

      const res = await apiClient.getVAEModelNames();
      const name = res.entries.find((entry) => entry.uuid === uuid)?.name;
      if (uuid && name) {
        dispatch(
          setSessionConfigByVaeIdName({
            vaeId: uuid.toString(),
            vaeName: name,
          })
        );
      } else if (res.entries.length) {
        router.push(`?uuid=${res.entries[0].uuid}`, undefined, {
          shallow: true,
        });
      } else {
        dispatch(
          setSessionConfigByVaeIdName({
            vaeId: "",
            vaeName: "",
          })
        );
      }
      return res.entries;
    },
    [router.isReady, uuid, refreshFlag],
    []
  );

  const gmmEntries = useAsyncMemo(
    async () => {
      if (!vaeId) {
        return [];
      }
      const res = await apiClient.getGMMModelNames({
        queries: {
          vae_uuid: vaeId,
        },
      });
      dispatch(setGmmId(res.entries.length ? res.entries[0].uuid : ""));
      return res.entries;
    },
    [vaeId],
    []
  );

  const vaeParams = useAsyncMemo(
    async () => {
      if (!vaeId) {
        return {};
      }
      const records: Object = await apiClient.getVAEModelParameters({
        queries: {
          vae_uuid: vaeId,
        },
      });
      return Object.fromEntries(
        Object.entries(records).map(([key, value]) => [key, String(value)])
      );
    },
    [vaeId],
    {}
  );

  const gmmParams = useAsyncMemo(
    async () => {
      if (!gmmId) {
        return {};
      }
      const records = await apiClient.getGMMModelParameters({
        queries: {
          gmm_uuid: gmmId,
        },
      });
      return Object.fromEntries(
        Object.entries(records).map(([key, value]) => [key, String(value)])
      );
    },
    [gmmId],
    {}
  );

  const onChangeGMM = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setGmmId(e.target.value));
  };

  return (
    <Tabs defaultActiveKey="dataSelector" id="dataControl">
      <Tab eventKey="dataSelector" title="Data">
        <Card className="mb-3">
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Selected VAE Model</Form.Label>
              <VAEPicker
                entries={vaeEntries}
                uuid={vaeId}
                refreshFunc={() => {
                  setRefreshFlag(!refreshFlag);
                }}
              />
            </Form.Group>
            <Form.Group className="">
              <Form.Label>Selected GMM Model</Form.Label>
              <Form.Select value={gmmId} onChange={onChangeGMM}>
                {gmmEntries.map((model, index) => (
                  <option key={index} value={model.uuid}>
                    {model.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Card.Body>
        </Card>
      </Tab>
      <Tab eventKey="vaeParamsTable" title="VAE parameters">
        <ParamsTable params={vaeParams} />
      </Tab>
      <Tab eventKey="gmmParamsTable" title="GMM parameters">
        <ParamsTable params={gmmParams} />
      </Tab>
    </Tabs>
  );
};

export default DataSelector;
