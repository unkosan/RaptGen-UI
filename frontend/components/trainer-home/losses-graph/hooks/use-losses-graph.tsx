import { Layout, PlotData } from "plotly.js";
import { useCallback, useMemo } from "react";
import { downloadFileFromText } from "~/components/viewer/downloader/hooks/utils";

export type LossData = {
  epochs: number[];
  trainLosses: number[];
  testLosses: number[];
  testRecons: number[];
  testKlds: number[];
};

export const useLossDataPlot = (lossData: LossData) => {
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

  return lossDataPlot;
};

export const useDownloadCsv = (lossData: LossData) => {
  const handleClickSave = useCallback(() => {
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
    downloadFileFromText(csvHeader + "\n" + csvData, "losses.csv");
  }, [lossData]);

  return { handleClickSave };
};
