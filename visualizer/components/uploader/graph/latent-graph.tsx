import React, { useEffect, useMemo, useState } from "react";
import { Layout, PlotData } from "plotly.js";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import axios from "axios";
 
import { eigs, cos, sin, pi, range, atan2, transpose } from "mathjs";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {}

const LatentGraph: React.FC<Props> = () => {
    const layout: Partial<Layout> = {
        height: 800,
        title: "plot",
        plot_bgcolor: "#EDEDED",
        xaxis: {
            color: '#FFFFFF',
            tickfont: {
                color: '#000000'
            },
            range: [-3.5, 3.5],
            gridcolor: "#FFFFFF",
        },
        yaxis: {
            color: '#FFFFFF',
            tickfont: {
                color: '#000000'
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
                family: "Courier New"
            },
        },
        clickmode: 'event+select',
    }

    return (
        <Plot
            data={[
            ]}
            layout={layout}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
        />
    );
}

export default LatentGraph;