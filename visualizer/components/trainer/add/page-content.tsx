import React, { useState } from "react";
import SplitPane from "~/components/common/split-pane";
import TrainConfigLeft from "./train-config/train-config-left";
import TrainConfigRight from "./train-config/train-config-right";
import PreprocessConfigLeft from "./preprocess-config/preprocess-config-left";
import PreprocessConfigRight from "./preprocess-config/preprocess-config-right";

const PageContent: React.FC = () => {
  const [route, setRoute] = useState<"/preprocess-config" | "/train-config">(
    "/preprocess-config"
  );

  return (
    <div id="page-content">
      <div
        id="subpage-preprocess-config"
        style={{ display: route === "/preprocess-config" ? "block" : "none" }}
      >
        <SplitPane
          left={<PreprocessConfigLeft setRoute={setRoute} />}
          right={<PreprocessConfigRight />}
        />
      </div>
      <div
        id="subpage-train-config"
        style={{ display: route === "/train-config" ? "block" : "none" }}
      >
        <SplitPane
          left={<TrainConfigLeft />}
          right={<TrainConfigRight setRoute={setRoute} />}
        />
      </div>
    </div>
  );
};

export default PageContent;
