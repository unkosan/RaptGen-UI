import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { PlotData } from "plotly.js";
import { apiClient } from "~/services/api-client";

/**
 * Hook for managing latent space plot data
 * Fetches and processes VAE data for visualization
 */
export const useLatentSpacePlot = (minCount: number) => {
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

  const params = useSelector((state: RootState) => state.params);

  // Fetch SELEX data from API
  useEffect(() => {
    const fetchSelexData = async () => {
      if (params.vaeId === "") {
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiClient.getSelexData({
          queries: { vae_uuid: params.vaeId },
        });
        setSelexData(res);
      } catch (error) {
        console.error("Error fetching SELEX data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSelexData();
  }, [params.vaeId]);

  // Process VAE data for plotting
  const vaeDataPlot = useMemo(() => {
    const mask = selexData.duplicates.map((value) => value >= minCount);

    return {
      x: selexData.coord_x.filter((_, index) => mask[index]),
      y: selexData.coord_y.filter((_, index) => mask[index]),
      type: "scattergl",
      mode: "markers",
      marker: {
        size: selexData.duplicates
          .filter((_, index) => mask[index])
          .map((d) => Math.max(2, Math.sqrt(d))),
        color: "silver",
        line: {
          color: "silver",
        },
      },
      customdata: selexData.random_regions.filter((_, index) => mask[index]),
      hovertemplate:
        "<b>X</b>: %{x}<br>" +
        "<b>Y</b>: %{y}<br>" +
        "<b>Random Region</b>: %{customdata}",
    } as Partial<PlotData>;
  }, [selexData, minCount]);

  return {
    vaeDataPlot,
    selexData,
    isLoading,
  };
};
