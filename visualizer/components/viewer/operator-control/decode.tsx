import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Button, Form, Image, InputGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { ResponseDecode } from '../../../types/api-interface/session';
import { RootState } from '../../store';

type PointSelectorProps = {
    point: Record<number, number>;
    setPoint: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}

const PointSelector: React.FC<PointSelectorProps> = (props) => {

    const [ pointValueX, setPointValueX ] = useState<number>(props.point[0]);
    const [ pointValueY, setPointValueY ] = useState<number>(props.point[1]);

    const [ pointValidX, setPointValidX ] = useState<boolean>(true);
    const [ pointValidY, setPointValidY ] = useState<boolean>(true);

    const [ inputMode, setInputMode ] = useState<'range' | 'number'>('range');

    const handlePointChangeX = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.currentTarget.value);
        if (isNaN(value)) {
            setPointValidX(false);
            return;
        } else {
            setPointValidX(true);
            setPointValueX(value);
        }
    };

    const handlePointChangeY = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.currentTarget.value);
        if (isNaN(value)) {
            setPointValidY(false);
            return;
        } else {
            setPointValidY(true);
            setPointValueY(value);
        }
    };

    useEffect(() => {
        if (pointValidX && pointValidY) {
            props.setPoint({0: pointValueX, 1: pointValueY});
        }
    }, [pointValueX, pointValueY, pointValidX, pointValidY])

    if (inputMode === 'range') {
        return (
            <div>
                <Form.Label>Latent Point</Form.Label>
                <InputGroup>
                    <Form.Label>X</Form.Label>
                    <Form.Range min={-3.5} max={3.5} value={pointValueX} onChange={handlePointChangeX} />
                </InputGroup>
                <InputGroup>
                    <Form.Label>Y</Form.Label>
                    <Form.Range min={-3.5} max={3.5} value={pointValueY} onChange={handlePointChangeY} />
                </InputGroup>
                <Button variant='primary' onClick={() => setInputMode('number')}>Change to Form Selector</Button>
            </div>
        )
    } else {
        return (
            <div>
                <Form.Label>Latent Point</Form.Label>
                <InputGroup hasValidation>
                    <Form.Label>X</Form.Label>
                    <Form.Control type='number' step={0.1} value={pointValueX} onChange={handlePointChangeX} isInvalid={!pointValidX}/>
                    <Form.Control.Feedback type='invalid'>Please input a valid number</Form.Control.Feedback>
                </InputGroup>
                <InputGroup hasValidation>
                    <Form.Label>Y</Form.Label>
                    <Form.Control type='number' step={0.1} value={pointValueY} onChange={handlePointChangeY} isInvalid={!pointValidY}/>
                    <Form.Control.Feedback type='invalid'>Please input a valid number</Form.Control.Feedback>
                </InputGroup>
                <Button variant='primary' onClick={() => setInputMode('range')}>Change to Range Selector</Button>
            </div>
        )
    }
}

type ResultViewerProps = {
    session_id: number;
    point: Record<number, number>;
}

const ResultViewer: React.FC<ResultViewerProps> = (props) => {

    const [ showWeblogo, setShowWeblogo ] = useState<boolean>(false);
    const [ showSecondaryStructure, setShowSecondaryStructure ] = useState<boolean>(false);

    const [ weblogoBase64, setWeblogoBase64 ] = useState<string>('');
    const [ secondaryStructureBase64, setSecondaryStructureBase64 ] = useState<string>('');

    const [ result, setResult ] = useState<string>('');
    
    // set lock with useState to avoid too many requests of decoding
    const [ lock, setLock ] = useState<boolean>(false);

    useEffect(() => {
        if (lock) {
            return;
        }
        
        setLock(true);
        // 200 ms delay and then unlock
        setTimeout(() => {
            setLock(false);
        }, 200);
    }, [ props.point, showWeblogo, showSecondaryStructure ])

    useEffect(() => {
        if (!showWeblogo) {
            setWeblogoBase64('');
            return;
        }

        if (lock) {
            return;
        }

        const fetchWeblogo = async () => {
            const resWeblogo = await axios.post('/session/decode/weblogo', {
                params: {
                    session_id: props.session_id,
                    coords: [{
                        coord_x: props.point[0],
                        coord_y: props.point[1],
                    }]
                }
            }).then((res) => res.data);

            const base64 = btoa(String.fromCharCode(...new Uint8Array(resWeblogo)));
            setWeblogoBase64(base64);
        };

        fetchWeblogo();
    }, [ props.session_id, props.point, showWeblogo ]);

    useEffect(() => {
        if (!showSecondaryStructure || result === '') {
            setSecondaryStructureBase64('');
            return;
        }

        if (lock) {
            return;
        }

        const fetchSecondaryStructure = async () => {
            const resSecondaryStructure = await axios.get('/session/decode/secondary_structure', {
                params: {
                    sequence: result,
                }
            }).then((res) => res.data);

            const base64 = btoa(String.fromCharCode(...new Uint8Array(resSecondaryStructure)));
            setSecondaryStructureBase64(base64);
        };

        fetchSecondaryStructure();
    }, [ result, showSecondaryStructure ]);

    useEffect(() => {
        if (lock) {
            return;
        }

        if (result === '' || props.session_id === 0) {
            return;
        }

        const fetchResult = async () => {
            const resResult = await axios.post<ResponseDecode>('/session/decode', {
                params: {
                    session_id: props.session_id,
                    coords: [{
                        coord_x: props.point[0],
                        coord_y: props.point[1],
                    }]
                }
            }).then((res) => res.data);
            setResult(resResult.data[0]);
        };
        fetchResult();
    }, [ props.session_id, props.point ]);

    return (
        <div>
            <Form.Label>Decoded Sequence</Form.Label>
            <Form.Control as='textarea' value={result} readOnly/>
            <Form.Check type='checkbox' label='Show Weblogo' checked={showWeblogo} onChange={(e) => setShowWeblogo(e.currentTarget.checked)}/>
            <Form.Check type='checkbox' label='Show Secondary Structure' checked={showSecondaryStructure} onChange={(e) => setShowSecondaryStructure(e.currentTarget.checked)}/>
            {
                showWeblogo ? (
                    <div>
                        <Form.Label>Weblogo</Form.Label>
                        <Image src={`data:image/png;base64,${weblogoBase64}`} fluid/>
                    </div>
                ) : null
            }
            {
                showSecondaryStructure ? (
                    <div>
                        <Form.Label>Secondary Structure</Form.Label>
                        <Image src={`data:image/png;base64,${secondaryStructureBase64}`} fluid/>
                    </div>
                ): null
            }
        </div>
    )
};

const DecodePanel: React.FC = () => {

    const sessionId = useSelector((state: RootState) => state.selexData.vaeConfig.sessionId);
    const [ point, setPoint ] = useState<Record<number, number>>({0: 0, 1: 0});

    return (
        <div>
            <PointSelector point={point} setPoint={setPoint}/>
            <ResultViewer session_id={sessionId} point={point}/>
        </div>
    )
};

export default DecodePanel;