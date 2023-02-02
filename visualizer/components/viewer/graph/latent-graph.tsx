import React, { useEffect, useMemo, useState } from "react";
import { Layout, PlotData } from "plotly.js";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { MeasuredDataElement } from "../redux/measured";
import axios from "axios";
import { ResponseDecode } from "../../../types/api-interface/session";
 
import { eigs, cos, sin, pi, range, atan2, transpose } from "mathjs";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type Props = {}

const LatentGraph: React.FC<Props> = () => {
    const selexData = useSelector((state: RootState) => state.selexData.selexData);
    const measuredData = useSelector((state: RootState) => state.measuredData);
    const inputData = useSelector((state: RootState) => state.inputData);
    const selexConfig = useSelector((state: RootState) => state.selexData.selexConfig);
    const vaeConfig = useSelector((state: RootState) => state.selexData.vaeConfig);
    const gmmConfig = useSelector((state: RootState) => state.gmmData);
    const decodeData = useSelector((state: RootState) => state.decodeData);

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
        const showData = inputData.filter((d) => d.show);
        
        const inputPlotData: Partial<PlotData> = {
            name: 'Input Data',
            showlegend: true,
            type: "scatter",
            x: showData.map((d) => d.coord_x),
            y: showData.map((d) => d.coord_y),
            mode: "markers",
            marker: {
                size: 5,
                color: "#90ee90",
            },
            customdata: showData.map((d) => d.seq),
            hovertemplate:
                "<b>Input Data</b><br>"
                + "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>"
                + "<b>Seq:</b> %{customdata}",
        };
        return inputPlotData;
    }, [inputData, vaeConfig]);

    const decodePlotData = useMemo(() => {
        const showData = decodeData.filter((d) => d.show);

        const decodePlotData: Partial<PlotData> = {
            name: 'Decoded Data',
            showlegend: true,
            type: "scatter",
            x: showData.map((d) => d.coord_x),
            y: showData.map((d) => d.coord_y),
            mode: "markers",
            marker: {
                size: 5,
                color: "#14c714",
            },
            customdata: showData.map((d) => d.seq),
            hovertemplate:
                "<b>Decoded Data</b><br>"
                + "<b>Coord:</b> (%{x:.4f}, %{y:.4f})<br>"
                + "<b>Seq:</b> %{customdata}",
        };

        const decodeLineX: Partial<PlotData> = {
            name: 'Decode Line X',
            showlegend: false,
            type: "scatter",
            x: [decodeData[0]?.coord_x, decodeData[0]?.coord_x],
            y: [-4, 4],
            mode: "lines",
            line: {
                color: "#14c714",
                width: 1,
            },
        }

        const decodeLineY: Partial<PlotData> = {
            name: 'Decode Line Y',
            showlegend: false,
            type: "scatter",
            x: [-4, 4],
            y: [decodeData[0]?.coord_y, decodeData[0]?.coord_y],
            mode: "lines",
            line: {
                color: "#14c714",
                width: 1,
            },
        }
        if (decodeData[0]?.show) {
            return [decodePlotData, decodeLineX, decodeLineY];
        } else {
            return [decodePlotData];
        }
    }, [decodeData]);

    const [ gmmPlotData, setGmmPlotData ] = useState<Partial<PlotData>[]>([]);
    useEffect(() => {
        const setData = async () => {
            const mus = gmmConfig.means;
            const sigmas = gmmConfig.covariances;
            const weights = gmmConfig.weights;
            
            let gmmPlotData: Partial<PlotData>[][] = await Promise.all(weights.map(async (weight, index) => {
                const mu = mus[index];
                let sigma = [...sigmas[index]];

                const resSequences = await axios.post<ResponseDecode>("/session/decode", {
                    session_id: vaeConfig.sessionId,
                    coords: [{
                        coord_x: mu[0],
                        coord_y: mu[1],
                    }]
                }).then((res) => res.data);
                const seq = resSequences.data[0];

                for (let i = 0; i < 2; i++) {
                    sigma[i] = [...sigma[i]]
                }

                const eig = eigs(sigma);
                let [lambda1, lambda2] = eig.values as number[];
                let [v1, v2] = transpose(eig.vectors) as number[][];

                if (lambda1 < lambda2) {
                    [lambda1, lambda2] = [lambda2, lambda1];
                    [v1, v2] = [v2, v1];
                }
                
                const [ v1x, v1y ] = v1;
                const theta = atan2(v1y, v1x);
                const width = 2 * Math.sqrt(lambda1);
                const height = 2 * Math.sqrt(lambda2);

                const trace = range(0, 2 * pi, 0.01, true).map((t) => {
                    const x = mu[0] 
                        + width * cos(t) * cos(theta)
                        - height * sin(t) * sin(theta);
                    const y = mu[1]
                        + width * cos(t) * sin(theta)
                        + height * sin(t) * cos(theta);
                    return [x, y];
                }).toArray() as number[][];

                const covalStr = "[" + sigma.map((row) => row.map((d) => d.toFixed(4)).join(", ")).join("\],\n\[") + "]";
                const meanStr = "[" + mu.map((d) => d.toFixed(4)).join(", ") + "]";
                const weightStr = weight.toFixed(4);

                const gmmPlotData: Partial<PlotData> = {
                    name: `MoG No.${index}`,
                    showlegend: false,
                    type: "scatter",
                    x: trace.map((d) => d[0]),
                    y: trace.map((d) => d[1]),
                    mode: "lines",
                    line: {
                        color: "#000000",
                    },
                    hovertemplate:
                        `<b>MoG No.${index}</b><br>`
                        + `<b>Weight:</b> ${weightStr}<br>`
                        + `<b>Mean:</b> ${meanStr}<br>`
                        + `<b>Coval:</b> ${covalStr}<br>`
                        + `<b>Sequence:</b> ${seq}<br>`
                }
                const gmmPlotLabel: Partial<PlotData> = {
                    name: `MoG No.${index}`,
                    showlegend: false,
                    type: "scatter",
                    x: [mu[0]],
                    y: [mu[1]],
                    mode: "text",
                    text: [`<b>${index}</b>`],
                    textposition: "inside",
                    hovertemplate:
                        `<b>MoG No.${index}</b><br>`
                        + `<b>Weight:</b> ${weightStr}<br>`
                        + `<b>Mean:</b> ${meanStr}<br>`
                        + `<b>Coval:</b> ${covalStr}<br>`
                        + `<b>Sequence:</b> ${seq}<br>`
                }
                return [gmmPlotData, gmmPlotLabel];
            }));

            setGmmPlotData(gmmPlotData.flat());
        };
        if (gmmConfig.show && gmmConfig.weights.length > 0 && vaeConfig.sessionId !== 0) {
            setData();
        } else {
            setGmmPlotData([]);
        }
    }, [gmmConfig, vaeConfig])

    
    return (
        <Plot
            data={[
                selexPlotData,
                ...measuredPlotData,
                inputPlotData,
                ...decodePlotData,
                ...gmmPlotData,
            ]}
            layout={layout}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
        />
    );
}

export default LatentGraph;