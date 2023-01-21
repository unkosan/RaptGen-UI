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
} from '../../../types/api-interface/session';
import { ResponseSelexData, ResponseVaeModelParameters } from '../../../types/api-interface/data';
import { SelexConfig, SelexDataElement } from '../redux/selex';

const DataControl: React.FC = () => {
    const [ nameVAE, setNameVAE ] = useState<string>("");
    const [ nameGMM, setNameGMM ] = useState<string>("");
    const [ nameMeasured, setNameMeasured ] = useState<string>("");
    const [ minCount, setMinCount ] = useState<number>(5);
    const [ ShowGMM, setShowGMM ] = useState<boolean>(false);
    const [ showMeasuredData, setShowMeasuredData ] = useState<boolean>(false);
    const [ sessionId, setSessionId ] = useState<number>(0);
    
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
                setSessionId(newSessionId);
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
                    tolerance: rawVaeParams.filtering_tolerance,
                }
                // dispatch(setSelexConfig(selexConfig));
            } catch (error) {
                console.log(error);
            }
        };
        
                
        

    }, [nameVAE])


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