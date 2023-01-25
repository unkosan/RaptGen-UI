import React, { useMemo } from "react";
import { Layout, PlotData } from "plotly.js";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { MeasuredDataElement } from "../redux/measured";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

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

type Props = {}

const LatentGraph: React.FC<Props> = () => {
    const selexData = useSelector((state: RootState) => state.selexData.selexData);
    const measuredData = useSelector((state: RootState) => state.measuredData);
    const inputData = useSelector((state: RootState) => state.inputData);
    const selexConfig = useSelector((state: RootState) => state.selexData.selexConfig);
    const vaeConfig = useSelector((state: RootState) => state.selexData.vaeConfig);
    const gmmConfig = useSelector((state: RootState) => state.gmmData);

    const selexPlotData = useMemo(() => {
        const filteredSelexData = selexData.filter((d) => d.duplicates >= selexConfig.minCount);
        const selexPlotData: Partial<PlotData> = {
            name: 'SELEX',
            showlegend: false,
            type: "scatter",
            x: filteredSelexData.map((d) => d.coord_x),
            y: filteredSelexData.map((d) => d.coord_y),
            mode: "markers",
            marker: {
                size: filteredSelexData.map((d) => Math.max(2, Math.sqrt(d.duplicates))),
                color: 'silver',
                line: {
                    color: 'silver',
                }
            },
            customdata: filteredSelexData.map((d) => [
                d.randomRegion,
                d.duplicates,
            ]),
            hovertemplate: 
                "<b>Coord</b>: (%{x:.4f}, %{y:.4f})<br>"
                + "<b>Seq</b>: %{customdata[0]}<br>"
                + "<b>Duplicates</b>: %{customdata[1]}",
        }
        return selexPlotData;
    }, [selexData, selexConfig, vaeConfig]);

    const measuredPlotData = useMemo(() => {
        if (!measuredData.config.show) {
            return [];
        }

        let groups: {
            [keys: string]: MeasuredDataElement[]
        } = {}
        for (let element of measuredData.data) {
            if (groups[element.hue] === undefined) {
                groups = { ...groups, [element.hue]: [] }
            } else {
                groups[element.hue].push(element);
            }
        }
        const measuredPlotData: Partial<PlotData>[] = Object.keys(groups).map((key, index) => {
            const group = groups[key];
            return {
                name: key,
                showlegend: true,
                type: "scatter",
                x: group.map((d) => d.coord_x),
                y: group.map((d) => d.coord_y),
                mode: "markers",
                marker: {
                    size: 5,
                    color: [
                        "#6495ed", 
                        "#ffa500", 
                        "#ffff00", 
                        "#800080", 
                        "#ff0000"
                    ][index % 5],
                },
                customdata: group.map((d) => [
                    d.ID,
                    d.randomRegion,
                ])
            }
        });
        return measuredPlotData;
    }, [measuredData, vaeConfig]);

    const inputPlotData = useMemo(() => {
        const inputPlotData: Partial<PlotData> = {
            name: 'Input Data',
            showlegend: true,
            type: "scatter",
            x: inputData.map((d) => d.coord_x),
            y: inputData.map((d) => d.coord_y),
            mode: "markers",
            marker: {
                size: 5,
                color: "#90ee90",
            },
            customdata: inputData.map((d) => d.seq),
            hovertemplate:
                "<b>Input Data</b><br>"
                + "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>"
                + "<b>Seq:</b> %{customdata}",
        };
        return inputPlotData;
    }, [inputData, vaeConfig]);

    // const gmmPlotData = useMemo(() => {
        
    // })
    
    return (
        <Plot
            data={[
                selexPlotData,
                ...measuredPlotData,
                inputPlotData,
            ]}
            layout={layout}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
        />
    );
}

export default LatentGraph;