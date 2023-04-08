import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { ResponseSelexData, ResponseVaeModelNames } from '../../../types/api-interface/data';
import { ResponseSessionStart } from '../../../types/api-interface/session';
import { setGmmInput, setGmmSelexData } from '../redux/gmm';
import { setMeasuredConfigInput, setMeasuredConfigSelexData, setMeasuredConfigVaeData } from '../redux/measured';
import { PseudoRoutes, RootState, setPseudoRoute, setUploadType } from '../redux/store';
import { SelexDataElement } from '../redux/vae';
import SidebarVaeSubmit from './vae/vae-submit';
import SidebarVaeEncode from './vae/vae-encode';
import SidebarVaeHome from './vae/vae-home';

const SidebarHome: React.FC = () => {
    const dispatch = useDispatch();
    const uploadType = useSelector((state: RootState) => state.uploadType);

    const gmmConfigInput = useSelector((state: RootState) => state.gmmData.input);
    const gmmBoundVaeName = gmmConfigInput.vaeFileName;

    const measuredConfigInput = useSelector((state: RootState) => state.measuredData.vaeData);
    const measuredBoundVaeName = measuredConfigInput.vaeName;

    const [ vaeName, setVaeName ] = useState<string>("");
    const [ vaeNameList, setVaeNameList ] = useState<string[]>([]);

    // set VaeNameList
    useEffect(() => {
        const fetchVaeNameList = async () => {
            const res = await axios.get<ResponseVaeModelNames>('/data/VAE-model-names')
            const vaeNameList: string[] = res.data.data;
            setVaeNameList(vaeNameList);
            if (vaeNameList.length > 0) {
                setVaeName(vaeNameList[0]);
            }
        };
        fetchVaeNameList();
    }, []);

    // set initial VaeName
    useEffect(() => {
        if (vaeNameList.length === 0) {
            return;
        }
        switch (uploadType) {
            case 'vae':
            case 'gmm':
                if (gmmBoundVaeName !== "") {
                    setVaeName(gmmBoundVaeName);
                } else {
                    setVaeName(vaeNameList[0]);
                }
            case 'measured':
                if (measuredBoundVaeName !== "") {
                    setVaeName(measuredBoundVaeName);
                } else {
                    setVaeName(vaeNameList[0]);
                }
        }
    }, [uploadType, gmmBoundVaeName, measuredBoundVaeName, vaeNameList])

    // dispatch uploadType and vaeName to redux
    const handleClickVae = () => {
        dispatch(setUploadType('vae'));
        dispatch(setPseudoRoute('/vae'));
    }

    const handleClickGmm = () => {
        dispatch(setUploadType('gmm'));
        async function dispatchData() {
            // to avoid infinite loop
            if (gmmBoundVaeName === vaeName) {
                return;
            }

            dispatch(setGmmInput({
                ...gmmConfigInput,
                vaeFileName: vaeName,
            }))

            const resGmmSelex = await axios.get<ResponseSelexData>('/data/selex-data', { params: {
                VAE_model_name: vaeName,
            }});

            const gmmSelexData = resGmmSelex.data.data;
            let gmmSelexDataList: SelexDataElement[] = [];
            for (let i = 0; i < gmmSelexData.Sequence.length; i++) {
                gmmSelexDataList.push({
                    sequence: gmmSelexData.Sequence[i],
                    randomRegion: gmmSelexData.Without_Adapters[i],
                    duplicates: gmmSelexData.Duplicates[i],
                    coord_x: gmmSelexData.coord_x[i],
                    coord_y: gmmSelexData.coord_y[i],
                });
            }

            dispatch(setGmmSelexData(gmmSelexDataList));
            return;
        }
        dispatchData();
        dispatch(setPseudoRoute('/gmm'));
    }

    const handleClickMeasured = () => {
        dispatch(setUploadType('measured'))
        async function dispatchData() {
            if (measuredBoundVaeName === vaeName) {
                return;
            }

            if (measuredConfigInput.sessionId !== 0) {
                await axios.get('/session/end', { params: {
                    session_id: measuredConfigInput.sessionId,
                }})
            }
            
            const res = await axios.get<ResponseSessionStart>('/session/start', { params: {
                VAE_model_name: vaeName,
            }})
            const sessionId = res.data.data;

            dispatch(setMeasuredConfigVaeData({
                vaeName: vaeName,
                sessionId: sessionId,
            }));

            const resMeasuredSelex = await axios.get<ResponseSelexData>('/data/selex-data', { params: {
                VAE_model_name: vaeName,
            }});

            const measuredSelexData = resMeasuredSelex.data.data;
            let measuredSelexDataList: SelexDataElement[] = [];
            for (let i = 0; i < measuredSelexData.Sequence.length; i++) {
                measuredSelexDataList.push({
                    sequence: measuredSelexData.Sequence[i],
                    randomRegion: measuredSelexData.Without_Adapters[i],
                    duplicates: measuredSelexData.Duplicates[i],
                    coord_x: measuredSelexData.coord_x[i],
                    coord_y: measuredSelexData.coord_y[i],
                });
            }

            dispatch(setMeasuredConfigSelexData(measuredSelexDataList));
            return;
        }
        dispatchData();
        dispatch(setPseudoRoute('/measured-values'));
    }

    return (
        <>
            <legend>Upload type</legend>
            <Form>
                <Form.Group className='mb-3'>
                    <Form.Select value={uploadType} onChange={(e) => {
                        dispatch(setUploadType(e.currentTarget.value as 'vae' | 'gmm' | 'measured'))
                    }}>
                        <option key='vae' value='vae'>VAE</option>
                        <option key='gmm' value='gmm'>GMM</option>
                        <option key='measured' value='measured'>Measured List</option>
                    </Form.Select>
                </Form.Group>
            </Form>

            { uploadType === 'vae' ? <></> : <>
                <legend>Select VAE</legend>
                <Form>
                    <Form.Group className='mb-3'>
                        <Form.Select value={vaeName} onChange={(e) => {
                            setVaeName(e.currentTarget.value);
                        }}>
                            {vaeNameList.map((name) => {
                                return <option key={name} value={name}>{name}</option>
                            })}
                        </Form.Select>
                    </Form.Group>
                </Form>
            </> }

            <Button onClick={ 
                uploadType === 'vae' ? handleClickVae 
                : uploadType === 'gmm' ? handleClickGmm
                : handleClickMeasured }>Next</Button> 
        </>
    )
}

const SidebarHome2: React.FC = () => {
    const dispatch = useDispatch();
    const uploadType = useSelector((state: RootState) => state.uploadType);

    const gmmConfigInput = useSelector((state: RootState) => state.gmmData.input);
    const gmmBoundVaeName = gmmConfigInput.vaeFileName;

    const measuredConfigInput = useSelector((state: RootState) => state.measuredData.vaeData);
    const measuredBoundVaeName = measuredConfigInput.vaeName;

    const [ vaeName, setVaeName ] = useState<string>("");
    const [ vaeNameList, setVaeNameList ] = useState<string[]>([]);

    // set VaeNameList
    useEffect(() => {
        const fetchVaeNameList = async () => {
            const res = await axios.get<ResponseVaeModelNames>('/data/VAE-model-names')
            const vaeNameList: string[] = res.data.data;
            setVaeNameList(vaeNameList);
            if (vaeNameList.length > 0) {
                setVaeName(vaeNameList[0]);
            }
        };
        fetchVaeNameList();
    }, []);

    // set initial VaeName
    useEffect(() => {
        if (vaeNameList.length === 0) {
            return;
        }
        switch (uploadType) {
            case 'vae':
            case 'gmm':
                if (gmmBoundVaeName !== "") {
                    setVaeName(gmmBoundVaeName);
                } else {
                    setVaeName(vaeNameList[0]);
                }
            case 'measured':
                if (measuredBoundVaeName !== "") {
                    setVaeName(measuredBoundVaeName);
                } else {
                    setVaeName(vaeNameList[0]);
                }
        }
    }, [uploadType, gmmBoundVaeName, measuredBoundVaeName, vaeNameList])

    // when VaeName changed, dispatch it to redux
    useEffect(() => {
        async function fetchVaeData() {
            if (vaeName === "") {
                return;
            }
            switch (uploadType) {
                case 'vae':
                    return;
                case 'gmm':
                    // to avoid infinite loop
                    if (gmmBoundVaeName === vaeName) {
                        return;
                    }

                    dispatch(setGmmInput({
                        ...gmmConfigInput,
                        vaeFileName: vaeName,
                    }))

                    const resGmmSelex = await axios.get<ResponseSelexData>('/data/selex-data', { params: {
                        VAE_model_name: vaeName,
                    }});

                    const gmmSelexData = resGmmSelex.data.data;
                    let gmmSelexDataList: SelexDataElement[] = [];
                    for (let i = 0; i < gmmSelexData.Sequence.length; i++) {
                        gmmSelexDataList.push({
                            sequence: gmmSelexData.Sequence[i],
                            randomRegion: gmmSelexData.Without_Adapters[i],
                            duplicates: gmmSelexData.Duplicates[i],
                            coord_x: gmmSelexData.coord_x[i],
                            coord_y: gmmSelexData.coord_y[i],
                        });
                    }

                    dispatch(setGmmSelexData(gmmSelexDataList));
                    return;

                case 'measured':
                    // to avoid infinite loop
                    if (measuredBoundVaeName === vaeName) {
                        return;
                    }

                    if (measuredConfigInput.sessionId !== 0) {
                        await axios.get('/session/end', { params: {
                            session_id: measuredConfigInput.sessionId,
                        }})
                    }
                    
                    const res = await axios.get<ResponseSessionStart>('/session/start', { params: {
                        VAE_model_name: vaeName,
                    }})
                    const sessionId = res.data.data;

                    dispatch(setMeasuredConfigVaeData({
                        vaeName: vaeName,
                        sessionId: sessionId,
                    }));

                    const resMeasuredSelex = await axios.get<ResponseSelexData>('/data/selex-data', { params: {
                        VAE_model_name: vaeName,
                    }});

                    const measuredSelexData = resMeasuredSelex.data.data;
                    let measuredSelexDataList: SelexDataElement[] = [];
                    for (let i = 0; i < measuredSelexData.Sequence.length; i++) {
                        measuredSelexDataList.push({
                            sequence: measuredSelexData.Sequence[i],
                            randomRegion: measuredSelexData.Without_Adapters[i],
                            duplicates: measuredSelexData.Duplicates[i],
                            coord_x: measuredSelexData.coord_x[i],
                            coord_y: measuredSelexData.coord_y[i],
                        });
                    }

                    dispatch(setMeasuredConfigSelexData(measuredSelexDataList));
                    return;
            }
        }
        fetchVaeData();
    }, [vaeName, uploadType])

    return (
        <>
            <legend>Upload type</legend>
            <Form>
                <Form.Group className='mb-3'>
                    <Form.Select value={uploadType} onChange={(e) => {
                        dispatch(setUploadType(e.currentTarget.value as 'vae' | 'gmm' | 'measured'))
                    }}>
                        <option key='vae' value='vae'>VAE</option>
                        <option key='gmm' value='gmm'>GMM</option>
                        <option key='measured' value='measured'>Measured List</option>
                    </Form.Select>
                </Form.Group>
            </Form>

            { uploadType === 'vae' ? <></> : <>
                <legend>Select VAE</legend>
                <Form>
                    <Form.Group className='mb-3'>
                        <Form.Select value={vaeName} onChange={(e) => {
                            setVaeName(e.currentTarget.value);
                        }}>
                            {vaeNameList.map((name) => {
                                return <option key={name} value={name}>{name}</option>
                            })}
                        </Form.Select>
                    </Form.Group>
                </Form>
            </> }
        </>
    )
}

const Sidebar: React.FC = () => {
    // const [ pseudoRoute, setPseudoRoute ] = useState<PseudoRoutes>('/');
    const pseudoRoute = useSelector((state: RootState) => state.pseudoRoutes);

    // file is not serializable. so we need to store it here.
    const [ vaeFile, setVaeFile ] = useState<File | null>(null);
    const [ selexFile, setSelexFile ] = useState<File | null>(null);
    const [ gmmFile, setGmmFile ] = useState<File | null>(null);
    const [ measuredFile, setMeasuredFile ] = useState<File | null>(null);

    return (
        <div className='sidebar'>
            { pseudoRoute === '/' 
                ? <SidebarHome /> : <></> }
            { pseudoRoute === '/vae' 
                ? <SidebarVaeHome 
                    vaeFile={vaeFile} 
                    setVaeFile={setVaeFile} 
                    selexFile={selexFile}
                    setSelexFile={setSelexFile}
                /> : <></> }
            { pseudoRoute === '/vae/encode' 
                ? <SidebarVaeEncode /> : <></> }
            { pseudoRoute === '/vae/submit'
                ? <SidebarVaeSubmit
                    vaeFile={vaeFile}
                /> : <></> }
        </div>
    ) 
}

export default Sidebar;