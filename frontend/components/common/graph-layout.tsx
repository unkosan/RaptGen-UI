import { Layout } from "plotly.js";

export const latentGraphLayout = (title: string): Partial<Layout> => {
  return {
    title: {
      text: title,
    },
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
        family: "monospace",
      },
    },
    clickmode: "event+select",
    margin: {
      l: 40,
      r: 40,
      b: 40,
      t: 40,
      pad: 5,
    },
  };
};
