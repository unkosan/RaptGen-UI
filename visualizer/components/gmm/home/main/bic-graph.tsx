import dynamic from "next/dynamic";
import { Layout, PlotData } from "plotly.js";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type BicProps = {
  n_components: number[];
  values: number[];
};

const BicGraph: React.FC<BicProps> = (props) => {
  const hues = new Set(props.n_components);
  const bicData: Partial<PlotData> = {
    type: "violin",
    x: props.values,
    y: props.n_components,
    line: {
      color: "black",
    },
    opacity: 0.5,
    colorscale: [
      [0, "rgb(255,255,255)"],
      [1, "rgb(255,0,0)"],
    ],
    side: "positive",
    orientation: "h",
  };

  const layout: Partial<Layout> = {
    xaxis: {
      zeroline: false,
      title: "BIC value",
    },
    yaxis: {
      title: "Number of components",
      range: [
        Math.min(...props.n_components) - 1,
        Math.max(...props.n_components) + 1,
      ],
    },
    violinmode: "overlay",
    height: hues.size * 100,
    margin: {
      l: 100,
      r: 100,
      b: 50,
      t: 50,
    },
  };
  return (
    <Plot
      data={[bicData]}
      useResizeHandler={true}
      layout={layout}
      config={{ responsive: true }}
      style={{ width: "100%" }}
    />
  );
};

export default BicGraph;
