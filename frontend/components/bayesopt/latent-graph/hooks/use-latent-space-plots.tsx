// This file contains hooks related to the latent graph visualization for bayesopt
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { PlotData } from "plotly.js";
import { zip } from "lodash";
import { RootState } from "../../redux/store";
import { apiClient } from "~/services/api-client";

// Hook for VAE data plot
export const useVaePlotData = (
  showVAE: boolean,
  vaeId: string,
  minCount: number
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selexData, setSelexData] = useState<{
    duplicates: number[];
    coord_x: number[];
    coord_y: number[];
    random_regions: string[];
  }>({
    duplicates: [],
    coord_x: [],
    coord_y: [],
    random_regions: [],
  });

  // Fetch SELEX data from API
  useEffect(() => {
    const fetchSelexData = async () => {
      if (vaeId === "") {
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiClient.getSelexData({
          queries: {
            vae_uuid: vaeId,
          },
        });
        setSelexData(res);
      } catch (error) {
        console.error("Error fetching SELEX data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSelexData();
  }, [vaeId]);

  // Process VAE data for plotting
  const vaeDataPlot: Partial<PlotData> = useMemo(() => {
    if (!showVAE) {
      return {};
    }

    const mcMask = selexData.duplicates.map((value) => value >= minCount);
    const coordsX = selexData.coord_x.filter((_, index) => mcMask[index]);
    const coordsY = selexData.coord_y.filter((_, index) => mcMask[index]);
    const duplicates = selexData.duplicates.filter((_, index) => mcMask[index]);
    const randomRegions = selexData.random_regions.filter(
      (_, index) => mcMask[index]
    );

    return {
      name: "SELEX",
      showlegend: false,
      type: "scatter",
      x: coordsX,
      y: coordsY,
      mode: "markers",
      marker: {
        size: duplicates.map((d) => Math.max(2, Math.sqrt(d))),
        color: "silver",
        line: {
          color: "silver",
        },
      },
      customdata: zip(
        randomRegions,
        duplicates.map((d) => d.toString())
      ) as unknown as string[],
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[0]}<br>" +
        "<b>Duplicates</b>: %{customdata[1]}",
    };
  }, [selexData, minCount, showVAE]);

  return {
    vaeDataPlot,
    isLoading,
  };
};

// Hook for registered data plots
export const useRegisteredDataPlots = () => {
  const registeredData = useSelector(
    (state: RootState) => state.registeredValues
  );

  // Process registered data for plotting
  const registeredDataPlot: Partial<PlotData> = useMemo(() => {
    return {
      name: "Registered",
      showlegend: true,
      type: "scatter",
      x: registeredData.coordX.filter((_, i) => registeredData.staged[i]),
      y: registeredData.coordY.filter((_, i) => registeredData.staged[i]),
      mode: "markers",
      marker: {
        size: 8,
        color: "red",
        opacity: 0.5,
        line: {
          color: "red",
        },
      },
      customdata: zip(
        registeredData.id.filter((_, i) => registeredData.staged[i]),
        registeredData.randomRegion.filter((_, i) => registeredData.staged[i])
      ) as unknown as string[][],
      hovertemplate:
        "<b>Registered</b><br>" +
        "<b>ID</b>: %{customdata[0]}<br>" +
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[1]}",
    };
  }, [registeredData]);

  // Process unregistered data for plotting
  const unregisteredDataPlot: Partial<PlotData> = useMemo(() => {
    return {
      name: "Unregistered",
      showlegend: true,
      type: "scatter",
      x: registeredData.coordX.filter((_, i) => !registeredData.staged[i]),
      y: registeredData.coordY.filter((_, i) => !registeredData.staged[i]),
      mode: "markers",
      marker: {
        size: 8,
        color: "blue",
        opacity: 0.3,
        line: {
          color: "blue",
        },
      },
      customdata: zip(
        registeredData.id.filter((_, i) => !registeredData.staged[i]),
        registeredData.randomRegion.filter((_, i) => !registeredData.staged[i])
      ) as unknown as string[][],
      hovertemplate:
        "<b>Not Registered</b><br>" +
        "<b>ID</b>: %{customdata[0]}<br>" +
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[1]}",
    };
  }, [registeredData]);

  return {
    registeredDataPlot,
    unregisteredDataPlot,
  };
};

// Hook for query data plot
export const useQueryDataPlot = () => {
  const queryData = useSelector((state: RootState) => state.queriedValues);

  // Process query data for plotting
  const queryDataPlot: Partial<PlotData> = useMemo(() => {
    return {
      name: "Query",
      showlegend: true,
      type: "scatter",
      x: queryData.coordX,
      y: queryData.coordY,
      mode: "markers",
      marker: {
        size: 8,
        color: "green",
        line: {
          color: "green",
        },
      },
      customdata: queryData.randomRegion.map((d) => [d]),
      hovertemplate:
        "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>" +
        "<b>Seq</b>: %{customdata[0]}",
    };
  }, [queryData]);

  return {
    queryDataPlot,
  };
};

// Hook for acquisition data plot
export const useAcquisitionDataPlot = (showAcquisition: boolean) => {
  const acquisitionData = useSelector(
    (state: RootState) => state.acquisitionValues
  );

  // Process acquisition data for plotting
  const acquisitionDataPlot: Partial<PlotData> = useMemo(() => {
    if (!showAcquisition) {
      return {};
    }

    return {
      name: "Acquisition",
      showlegend: false,
      type: "contour",
      colorscale: "Viridis",

      x: acquisitionData.coordX,
      y: acquisitionData.coordY,
      z: acquisitionData.acquisitionValues,
      hoverinfo: "skip",
      line: {
        width: 2,
      },
      contours: {
        coloring: "lines",
        showlabels: true,
      },
      colorbar: {
        title: "Acq. Value",
      },
    };
  }, [acquisitionData, showAcquisition]);

  return {
    acquisitionDataPlot,
  };
};
