import React, { useState, useEffect } from 'react';
import { Nav } from 'react-bootstrap';
import axios from 'axios';

import DataSelector from './data-selector';
import ConfigSelector from './config-selector';
import VaeParamsTable from './vae-datatable';
import GmmParamsTable from './gmm-datatable';

import { 
    ResponseSessionStart,
    ResponseSessionEnd,
    ResponseEncode,
} from '../../../types/api-interface/session';
import { ResponseGmmModel, ResponseMeasuredData, ResponseSelexData, ResponseVaeModelParameters } from '../../../types/api-interface/data';
import { SelexConfig, SelexDataElement, VaeConfig } from '../redux/selex';
import { GmmConfig, setGmmConfig } from '../redux/gmm';
import { MeasuredDataConfig, MeasuredDataElement, setMeasuredDataConfig } from '../redux/measured';

const DataControl: React.FC = () => {
    const [ nameVAE, setNameVAE ] = useState<string>("");
    const [ nameGMM, setNameGMM ] = useState<string>("");
    const [ nameMeasured, setNameMeasured ] = useState<string>("");
    const [ minCount, setMinCount ] = useState<number>(5);
    const [ ShowGMM, setShowGMM ] = useState<boolean>(false);
    const [ showMeasuredData, setShowMeasuredData ] = useState<boolean>(false);
    const [ sessionId, setSessionId ] = useState<number>(0);
    
    const [ forwardAdapter, setForwardAdapter ] = useState<string>("");
    const [ reverseAdapter, setReverseAdapter ] = useState<string>("");
    
    useEffect(() => {
        setNameGMM("");
        setMinCount(5);
        setShowGMM(false);
        setShowMeasuredData(false);
    }, [nameVAE]);

    useEffect(() => {
        if (nameVAE === "") {
            return;
        }
        const fetchSessionId = async () => {
            try {
                const res = await axios.get<ResponseSessionStart>("/session/start", {
                    params: { VAE_name: nameVAE }
                }).then(res => res.data);
                const newSessionId: number = res.data
                const resEnd = await axios.get<ResponseSessionEnd>("/session/end", {
                    params: { session_id: sessionId }
                }).then(res => res.data);
                const vaeConfig: VaeConfig = {
                    vaeName: nameVAE,
                    sessionId: newSessionId,
                }
                setSessionId(newSessionId);
                // dispatch(setVaeConfig(vaeConfig));
            } catch (error) {
                console.log(error);
            }
        };
        const fetchSelexData = async () => {
            try {
                const resSelexData = await axios.get<ResponseSelexData>('data/selex-data').then((res) => res.data);
                const rawSelexData = resSelexData.data;
                const selexData: SelexDataElement[] = rawSelexData.Sequence.map((element: string, index: number) => {
                    return {
                        sequence: element,
                        randomRegion: rawSelexData.Without_Adapters[index],
                        duplicates: rawSelexData.Duplicates[index],
                        coord_x: rawSelexData.coord_x[index],
                        coord_y: rawSelexData.coord_y[index],
                    }
                });
                // dispatch(setSelexData(selexData));
                const resVaeParams = await axios.get<ResponseVaeModelParameters>('data/VAE-model-parameters', {
                    params: { VAE_name: nameVAE }
                }).then((res) => res.data);
                const rawVaeParams = resVaeParams.data;
                const selexConfig: SelexConfig = {
                    forwardAdapter: rawVaeParams.fwd_adapter,
                    reverseAdapter: rawVaeParams.rev_adapter,
                    minCount: minCount,
                    randomRegionLength: rawVaeParams.filterling_standard_length,
                    tolerance: 0,
                }
                setForwardAdapter(rawVaeParams.fwd_adapter);
                setReverseAdapter(rawVaeParams.rev_adapter);
                // dispatch(setSelexConfig(selexConfig));
            } catch (error) {
                console.log(error);
            }
        };
        fetchSessionId();
        fetchSelexData();
    }, [nameVAE])

    useEffect(() => {
        if (nameGMM === "" || nameVAE === "") {
            return;
        }
        const fetchGmmModel = async () => {
            try {
                const resGmm = await axios.get<ResponseGmmModel>('data/GMM-model', {
                    params: { 
                        VAE_name: nameVAE,
                        GMM_name: nameGMM
                    }
                }).then((res) => res.data);
                const gmm = resGmm.data;
                const { weights, means, covariances } = gmm;
                const newGmmConfig: GmmConfig = {
                    gmmName: nameGMM,
                    show: ShowGMM,
                    weights: weights,
                    means: means,
                    covariances: covariances,
                }
                // setGmmConfig(newGmmConfig);
            } catch (error) {
                // console.log(error);
                alert("GMM model not found");
            }
        };
        fetchGmmModel();
    }, [nameGMM, ShowGMM])

    useEffect(() => {
        if (nameMeasured === "") {
            return;
        }
        const fetchMeasuredData = async () => {
            try {
                const resMeasuredData = await axios.get<ResponseMeasuredData>('data/measured-data', {
                    params: { measured_data_name: nameMeasured }
                }).then((res) => res.data);
                const rawMeasuredData = resMeasuredData.data;

                const mask = rawMeasuredData.Sequence.map((seq: string) =>
                    seq.startsWith(forwardAdapter)
                    && seq.endsWith(reverseAdapter)
                    && seq.length >= forwardAdapter.length + reverseAdapter.length + 1
                );
                const filteredSequence = rawMeasuredData.Sequence.filter((seq: string, index: number) => mask[index]);
                const filteredHue = rawMeasuredData.hue.filter((hue: string | number, index: number) => mask[index]);
                const filteredId = rawMeasuredData.ID.filter((id: string, index: number) => mask[index]);

                const resCoords = await axios.get<ResponseEncode>('/session/encode', {
                    params: {
                        session_id: sessionId,
                        sequences: filteredSequence,
                    }
                }).then((res) => res.data);
                const coords = resCoords.data;
                const newMeasuredData: MeasuredDataElement[] = coords.map(({ coord_x, coord_y }, index: number) => {
                    return {
                        ID: filteredId[index],
                        hue: filteredHue[index],
                        sequence: filteredSequence[index],
                        randomRegion: reverseAdapter.length === 0 ? filteredSequence[index].slice(forwardAdapter.length) : filteredSequence[index].slice(forwardAdapter.length, -reverseAdapter.length),
                        coord_x: coord_x,
                        coord_y: coord_y,
                    }
                });
                // dispatch(setMeasuredData(newMeasuredData));
            } catch (error) {
                alert(error);
            }
        };
        fetchMeasuredData();
    }, [nameMeasured, reverseAdapter])

    useEffect(() => {
        const newMeasuredDataConfig: MeasuredDataConfig = {
            show: showMeasuredData,
        }
        // dispatch(setMeasuredDataConfig(newMeasuredDataConfig));
    }, [showMeasuredData])

    // choose DataSelector, ConfigSelector, VaeParamsTable, GmmParamsTable with
    // Nav.Item and Nav.Link
    return (
        <div>
            <Nav variant="tabs" defaultActiveKey="data-selector">
                <Nav.Item>
                    <Nav.Link eventKey="data-selector">Data Selector</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="config-selector">Config Selector</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="vae-params-table">VAE Params Table</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="gmm-params-table">GMM Params Table</Nav.Link>
                </Nav.Item>
            </Nav>
            <Nav.Item>
                <Nav.Link eventKey="data-selector">
                    <DataSelector
                        setNameVAE={setNameVAE}
                        setNameGMM={setNameGMM}
                        setNameMeasured={setNameMeasured}
                    />
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="config-selector">
                    <ConfigSelector
                        minCount={minCount}
                        setMinCount={setMinCount}
                        setShowGMM={setShowGMM}
                        setShowMeasuredData={setShowMeasuredData}
                    />
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="vae-params-table">
                    <VaeParamsTable
                        nameVAE={nameVAE}
                    />
                </Nav.Link>
            </Nav.Item>
            <Nav.Item>
                <Nav.Link eventKey="gmm-params-table">
                    <GmmParamsTable
                        nameGMM={nameGMM}
                        nameVAE={nameVAE}
                    />
                </Nav.Link>
            </Nav.Item>
        </div>
    )
};