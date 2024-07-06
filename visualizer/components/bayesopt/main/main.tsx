import dynamic from "next/dynamic";
import { Layout } from "plotly.js";
import { Badge, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import CustomDataGrid from "~/components/common/custom-datagrid";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const returnLayout = (title: string): Partial<Layout> => {
  return {
    height: 800,
    title: title,
    plot_bgcolor: "#EDEDED",
    xaxis: {
      color: "#FFFFFF",
      tickfont: {
        color: "#000000",
      },
      range: [-3.5, 3.5],
      gridcolor: "#FFFFFF",
    },
    yaxis: {
      color: "#FFFFFF",
      tickfont: {
        color: "#000000",
      },
      range: [-3.5, 3.5],
      gridcolor: "#FFFFFF",
    },
    legend: {
      yanchor: "top",
      y: 1,
      x: 0,
      bgcolor: "rgba(255,255,255,0.8)",
    },
    hoverlabel: {
      font: {
        family: "Courier New",
      },
    },
    clickmode: "event+select",
  };
};

const LatentGraph: React.FC = () => {
  return (
    <Plot
      data={[]}
      layout={returnLayout("Latent Space")}
      config={{ responsive: true }}
      style={{ width: "100%" }}
    />
  );
};

const gridStyle = { minHeight: 400, width: "100%", zIndex: 950 };

const Main: React.FC = () => {
  return (
    <div>
      <LatentGraph />

      <legend>Registered values</legend>
      <CustomDataGrid
        columns={[
          { name: "hue", header: "Hue", defaultVisible: false },
          { name: "id", header: "ID", defaultVisible: false },
          { name: "randomRegion", header: "Random Region", defaultFlex: 1 },
          { name: "coordX", header: "X" },
          { name: "coordY", header: "Y" },
        ]}
        dataSource={[]}
        style={gridStyle}
        rowStyle={{ fontFamily: "monospace" }}
        checkboxColumn
        pagination
        downloadable
        copiable
      />
      <Button variant="primary" style={{ marginBottom: 10 }}>
        Run Bayes-Opt with checked data
      </Button>

      <legend>Query points by Bayesian Optimization</legend>
      <CustomDataGrid
        columns={[
          { name: "hue", header: "Hue", defaultVisible: false },
          { name: "id", header: "ID", defaultVisible: false },
          { name: "randomRegion", header: "Random Region", defaultFlex: 1 },
          { name: "coordX", header: "X" },
          { name: "coordY", header: "Y" },
          {
            name: "originalCoordX",
            header: () => (
              <>
                Original X
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      <div style={{ textAlign: "left" }}>
                        <span className="font-monospace">Original X</span>
                        means the raw value of the X coordinate returned by the
                        Bayesian optimization. This value is reembedded through
                        the decoder and encoder of the VAE model to keep the
                        consistency of the latent space.
                      </div>
                    </Tooltip>
                  }
                >
                  <span className="ms-1">
                    <Badge pill bg="secondary">
                      ?
                    </Badge>
                  </span>
                </OverlayTrigger>
              </>
            ),
            defaultVisible: false,
          },
          {
            name: "originalCoordY",
            header: () => (
              <>
                Original Y
                <OverlayTrigger
                  overlay={
                    <Tooltip>
                      <div style={{ textAlign: "left" }}>
                        <span className="font-monospace">Original Y</span>
                        means the raw value of the Y coordinate returned by the
                        Bayesian optimization. This value is reembedded through
                        the decoder and encoder of the VAE model to keep the
                        consistency of the latent space.
                      </div>
                    </Tooltip>
                  }
                >
                  <span className="ms-1">
                    <Badge pill bg="secondary">
                      ?
                    </Badge>
                  </span>
                </OverlayTrigger>
              </>
            ),
            defaultVisible: false,
          },
        ]}
        dataSource={[]}
        style={gridStyle}
        rowStyle={{ fontFamily: "monospace" }}
        checkboxColumn
        pagination
        downloadable
        copiable
      />
      <Button variant="primary" style={{ marginBottom: 10 }}>
        Add to the Register values table
      </Button>
    </div>
  );
};

export default Main;
