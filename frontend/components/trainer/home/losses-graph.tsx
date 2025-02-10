import { Layout, PlotData } from "plotly.js";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Badge, Card } from "react-bootstrap";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export const returnLayout = (title: string): Partial<Layout> => {
  return {
    title: title,
    plot_bgcolor: "#EDEDED",
    xaxis: {
      color: "#FFFFFF",
      tickfont: {
        color: "#000000",
      },
      gridcolor: "#FFFFFF",
    },
    yaxis: {
      color: "#FFFFFF",
      tickfont: {
        color: "#000000",
      },
      gridcolor: "#FFFFFF",
    },
    hoverlabel: {
      font: {
        family: "monospace",
      },
    },
    showlegend: true,
    legend: {
      xanchor: "right",
      x: 1,
      yanchor: "top",
      y: 1,
    },
    clickmode: "event+select",
    margin: {
      l: 30,
      r: 30,
      b: 30,
      t: 30,
      pad: 5,
    },
  };
};

type Props = {
  title: string;
  lossData: {
    epochs: number[];
    trainLosses: number[];
    testLosses: number[];
    testRecons: number[];
    testKlds: number[];
  };
};

export const LossesGraph: React.FC<Props> = ({ title, lossData }) => {
  const lossDataPlot: Partial<PlotData>[] = useMemo(() => {
    const { epochs, trainLosses, testLosses, testRecons, testKlds } = lossData;
    const traceTrainLosses: Partial<PlotData> = {
      x: epochs,
      y: trainLosses,
      type: "scatter",
      mode: "lines",
      name: "Train loss",
      line: {
        color: "#000000",
      },
      hovertemplate:
        "Epoch: %{x}<br>" + "NLL (ELBO): %{y}<br>" + "<extra></extra>",
    };
    const traceTestLosses: Partial<PlotData> = {
      x: epochs,
      y: testLosses,
      type: "scatter",
      mode: "lines",
      name: "Test loss",
      line: {
        color: "#FF0000",
      },
      hovertemplate:
        "Epoch: %{x}<br>" + "NLL (ELBO): %{y}<br>" + "<extra></extra>",
    };
    const traceTestRecons: Partial<PlotData> = {
      x: epochs,
      y: testRecons,
      type: "scatter",
      mode: "lines",
      name: "Test reconstruction loss",
      line: {
        color: "#00FF00",
      },
      hovertemplate:
        "Epoch: %{x}<br>" + "NLL (ELBO): %{y}<br>" + "<extra></extra>",
    };
    const traceTestKlds: Partial<PlotData> = {
      x: epochs,
      y: testKlds,
      type: "scatter",
      mode: "lines",
      name: "Test KL divergence loss",
      line: {
        color: "#0000FF",
      },
      hovertemplate:
        "Epoch: %{x}<br>" + "NLL (ELBO): %{y}<br>" + "<extra></extra>",
    };
    return [traceTrainLosses, traceTestLosses, traceTestRecons, traceTestKlds];
  }, [lossData]);

  const onClickSave = () => {
    const csvHeader = "epoch, train_loss, test_loss, test_recon, test_kld";
    let csvData = "";
    for (let i = 0; i < lossData.trainLosses.length; i++) {
      csvData +=
        i +
        "," +
        lossData.trainLosses[i] +
        "," +
        lossData.testLosses[i] +
        "," +
        lossData.testRecons[i] +
        "," +
        lossData.testKlds[i] +
        "\n";
    }
    // download csv file
    const blob = new Blob([csvHeader + "\n" + csvData], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "losses.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Card className="mb-3">
      <Card.Header className="d-flex justify-content-between">
        <span>Loss Transition</span>
        <span>
          <Badge
            pill
            bg="success"
            className="mx-1"
            onClick={onClickSave}
            style={{ cursor: "pointer" }}
          >
            Download Loss Transitions
          </Badge>
        </span>
      </Card.Header>
      <Card.Body>
        <div style={{ aspectRatio: "2 / 1" }}>
          <Plot
            data={lossDataPlot}
            useResizeHandler={true}
            layout={returnLayout(title)}
            config={{ responsive: true }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </Card.Body>
    </Card>
  );
};
