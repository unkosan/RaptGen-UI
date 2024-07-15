import BayesOptConfig from "./bayes-opt-config";
import InitialDataset from "./initial-dataset";
import VaeSelector from "./vae-selector";
import Versions from "./versions";

const SideBar: React.FC = () => {
  return (
    <div>
      <Versions />
      <hr />
      <VaeSelector />
      <InitialDataset />
      <BayesOptConfig />
    </div>
  );
};

export default SideBar;
