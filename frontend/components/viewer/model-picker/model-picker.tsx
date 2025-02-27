import { Card, Form, Tab, Tabs } from "react-bootstrap";
import VAEPicker from "./vae-picker";
import GMMPicker from "./gmm-picker";
import ParamsTable from "./params-table";
import {
  useEntriesGMM,
  useEntriesVAE,
  useParamsGMM,
  useParamsVAE,
} from "./hooks/use-fetchers";
import { usePickGMM, usePickVAE } from "./hooks/use-dispatchers";

const ModelPicker: React.FC = () => {
  const { modelId: vaeId } = usePickVAE();
  const { modelId: gmmId } = usePickGMM();

  const { entries: vaeEntries, refresh } = useEntriesVAE();
  const { entries: gmmEntries } = useEntriesGMM(vaeId);
  const { records: vaeParams } = useParamsVAE(vaeId);
  const { records: gmmParams } = useParamsGMM(gmmId);

  return (
    <Tabs defaultActiveKey="dataSelector" id="dataControl">
      <Tab eventKey="dataSelector" title="Data">
        <Card className="mb-3">
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Selected VAE Model</Form.Label>
              <VAEPicker
                entries={vaeEntries}
                selectedId={vaeId}
                refreshFunc={() => {
                  refresh();
                }}
              />
            </Form.Group>
            <Form.Group className="">
              <Form.Label>Selected GMM Model</Form.Label>
              <GMMPicker entries={gmmEntries} />
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

export default ModelPicker;
