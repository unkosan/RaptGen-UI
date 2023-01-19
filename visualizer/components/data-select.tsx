import React, { useEffect } from 'react';
import axios from 'axios';
import { useState } from 'react';
import { Form } from 'react-bootstrap';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';

import { VaeConfig, SelexConfig, SelexDataElement, setVaeConfig } from './store-redux/selex-data';
import { GmmConfig } from './store-redux/gmm-data';
import { MeasuredDataElement } from './store-redux/measured-data';

import { setSelexData } from './store-redux/selex-data';
import { setMeasuredData } from './store-redux/measured-data';
import { setSelexConfig } from './store-redux/selex-data';

axios.defaults.baseURL = 'http://localhost:8000/dev';

type Props = {};

type NameList = {
    entries: string[];
}

type ResponseMeasuredData = {
    hue: string;
    data: {
        ID: string[];
        Sequence: string[];
    }
}

const DataSelect: React.FC<Props> = React.memo<Props>(() => {
    const [ nameVAE, setNameVAE ] = useState<string>("");
    const [ nameGMM, setNameGMM ] = useState<string>("");
    const [ nameMeasured, setNameMeasured ] = useState<string>("");

    const [ nameListVAE, setNameListVAE ] = useState<string[]>([""]);
    const [ nameListGMM, setNameListGMM ] = useState<string[]>([""]);
    const [ nameListMeasured, setNameListMeasured ] = useState<string[]>([""]);

    const [ isError, setIsError ] = useState<boolean>(false);

    const dispatch = useDispatch();

    useEffect(() => {
        const fetchNameListVAE = async () => {
            try {
                const res = await axios.get('/sample/VAEmodels');
                const nameListVAE: NameList = res.data;
                setNameListVAE(nameListVAE.entries);
                if (nameListVAE.entries.length > 0) {
                    setNameVAE(nameListVAE.entries[0])
                } else {
                    setNameVAE("");
                }
            } catch (error) {
                console.log(error);
                setIsError(true);
            }
        };
        const fetchNameListMeasured = async () => {
            try {
                const res = await axios.get('sample/measuredData');
                const nameListMeasured: NameList = res.data;
                setNameListMeasured(nameListMeasured.entries);
                if (nameListMeasured.entries.length > 0) {
                    setNameMeasured(nameListMeasured.entries[0]);
                } else {
                    setNameMeasured("");
                }
            } catch (error) {
                console.log(error);
                setIsError(true);
            }
        };
        fetchNameListVAE();
        fetchNameListMeasured();
    }, []);

    useEffect(() => {
        if (nameVAE === "") {
            setNameListGMM([""]);
            return;
        }
        const fetchNameListGMM = async () => {
            try {
                const res = await axios.get('sample/GMMmodels', {
                    params: { VAE_name: nameVAE } 
                });
                const nameListGMM: NameList = res.data;
                setNameListGMM(nameListGMM.entries);
                if (nameListGMM.entries.length > 0) {
                    setNameGMM(nameListGMM.entries[0]);
                } else {
                    setNameGMM("");
                }
            } catch (error) {
                console.log(error);
                setIsError(true);
            }
        }
        fetchNameListGMM();
    }, [nameVAE]);

    const currentSessionId: number = useSelector((state: RootState) => state.selexData.vaeConfig.sessionId);

    useEffect(() => {
        const fetchSelexData = async () => {
            try {
                const rawSelexData = await axios.get('sample/selex').then((res) => res.data);
                const selexData: SelexDataElement[] = rawSelexData.Sequence.map((element: string, index: number) => {
                    return {
                        sequence: element,
                        randomRegion: rawSelexData.Random_Region[index],
                        duplicates: rawSelexData.Duplicates[index],
                        coord_x: rawSelexData.coord_x[index],
                        coord_y: rawSelexData.coord_y[index],
                    }
                });
                dispatch(setSelexData(selexData));
                const rawSelexConfig = await axios.get('sample/selex-config').then((res) => res.data);
                const selexConfig: SelexConfig = {
                    forwardAdapter: rawSelexConfig.forward_adapter,
                    reverseAdapter: rawSelexConfig.reverse_adapter,
                    minCount: rawSelexConfig.min_count,
                    randomRegionLength: rawSelexConfig.random_region_length,
                    tolerance: rawSelexConfig.tolerance,
                }
                dispatch(setSelexConfig(selexConfig));
            } catch (error) {
                console.log(error);
            }
        };
        const getSessionId = async () => {
            try {
                if (currentSessionId !== 0) {
                    await axios.post('sample/sessionId/kill', { sessionId: currentSessionId });
                }
                const sessionId: number = await axios.get('sample/sessionId').then((res) => res.data);
                const vaeConfig: VaeConfig = {
                    vaeName: nameVAE,
                    sessionId: sessionId,
                };
                dispatch(setVaeConfig(vaeConfig));
            } catch (error) {
                console.log(error);
            }
        };
        fetchSelexData();
        getSessionId();
    }, [nameVAE]);

    useEffect(() => {
        // setNameGMM(nameGMM);
    }, [nameGMM]);

    const forwardAdapter = useSelector((state: RootState) => state.selexData.selexConfig.forwardAdapter);
    const reverseAdapter = useSelector((state: RootState) => state.selexData.selexConfig.reverseAdapter);
    const sessionId = useSelector((state: RootState) => state.selexData.vaeConfig.sessionId);

    useEffect(() => {
        console.log('hello')
        // setNameMeasured(nameMeasured);
        const fetchMeasuredData = async () => {

            try{
                const rawMeasuredData: ResponseMeasuredData[] = await axios.get('sample/measured').then((res) => res.data);
                const measuredData: MeasuredDataElement[][] = await Promise.all(rawMeasuredData.map(async (element, index: number) => {
                    const hue = element.hue;
                    const mask = element.data.Sequence.map((seq: string) => 
                        seq.startsWith(forwardAdapter) 
                        && seq.endsWith(reverseAdapter)
                        && seq.length >= forwardAdapter.length + reverseAdapter.length + 1
                    );
                    const sequences = element.data.Sequence.filter((seq: string, index: number) => mask[index]);
                    const randomRegions = sequences.map((seq: string) => {
                        return reverseAdapter.length===0 ? seq.slice(forwardAdapter.length) : seq.slice(forwardAdapter.length, -reverseAdapter.length);
                    });
                    const ID = element.data.ID.filter((id, index) => mask[index]);
                    if (sequences.length === 0) {
                        return [];
                    }
                    const coord = await axios.post('sample/encode', {
                        seq: randomRegions,
                        session_ID: sessionId,
                    }).then((res) => res.data);
                    return sequences.map((seq: string, index: number) => {
                        return {
                            sequence: seq,
                            randomRegion: randomRegions[index],
                            ID: ID[index],
                            coord_x: coord.coord_x[index],
                            coord_y: coord.coord_y[index],
                            hue: hue,
                        };
                    });
                }));
                const measuredDataFlat: MeasuredDataElement[] = measuredData.flat();
                dispatch(setMeasuredData(measuredDataFlat));
            } catch (error) {
                console.log(error);
                alert("Error: No measured data found.")
            }
        }
        fetchMeasuredData();
    }, [nameMeasured]);

    return (
       <>
        <Form>
            <Form.Group className="mb-3">
                <Form.Label htmlFor="modelNameVAE">Selected VAE Model</Form.Label>
                <Form.Select id="modelNameVAE" value={nameVAE} onChange={(e) => setNameVAE(e.currentTarget.value)}>
                    {nameListVAE.map((name) => <option>{name}</option>)}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label htmlFor="modelNameGMM">Selected GMM Model</Form.Label>
                <Form.Select id="modelNameGMM" value={nameGMM} onChange={(e) => setNameGMM(e.currentTarget.value)}>
                    {nameListGMM.map((name) => <option>{name}</option>)}
                </Form.Select>
                {/* <Form.Check type="switch" id="plotSwitchGMM" defaultChecked={false} label="draw GMM circles" /> */}
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label htmlFor="measuredDataName">Selected measured value data</Form.Label>
                <Form.Select id="measuredDataName" value={nameMeasured} onChange={(e) => setNameMeasured(e.currentTarget.value)}>
                    {nameListMeasured.map((name) => <option>{name}</option>)}
                </Form.Select>
            </Form.Group>
        </Form>
       </> 
    )
})

export default DataSelect;