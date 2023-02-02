import axios from 'axios';
import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Button, Col, Form, FormGroup, Image, InputGroup, Row } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { ResponseDecode } from '../../../types/api-interface/session';
import { RootState } from '../../store';
import RangeSlider from 'react-bootstrap-range-slider';
import { DecodeDataElement, setDecodeData } from '../redux/decoded';
import { useDispatch } from 'react-redux';

type PointSelectorProps = {
    point: Record<number, number>;
    setPoint: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}

type ResultViewerProps = {
    sessionId: number;
    point: Record<number, number>;
    decodeSeqList: DecodeDataElement[],
    setDecodeSeqList: Dispatch<SetStateAction<DecodeDataElement[]>>;
}

type SequenceRecordProps = {
    sessionId: number,
    decodeSeqList: DecodeDataElement[],
    setDecodeSeqList: Dispatch<SetStateAction<DecodeDataElement[]>>,
    entry: DecodeDataElement,
}

const PointSelector: React.FC<PointSelectorProps> = (props) => {

    const [ pointValueX, setPointValueX ] = useState<number>(props.point[0]);
    const [ pointValueY, setPointValueY ] = useState<number>(props.point[1]);

    const [ pointValidX, setPointValidX ] = useState<boolean>(true);
    const [ pointValidY, setPointValidY ] = useState<boolean>(true);

    const handlePointChangeX = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.currentTarget.value);
        setPointValueX(value);

        if (isNaN(value)) {
            setPointValidX(false);
            return;
        } else {
            setPointValidX(true);
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

    return (
        <>
            <InputGroup hasValidation>
                <InputGroup.Text>X :</InputGroup.Text>
                <InputGroup.Text style={{
                    backgroundColor: 'white',
                }}>
                    <RangeSlider
                        value={pointValueX}
                        onChange={handlePointChangeX}
                        min={-3.5}
                        max={3.5}
                        step={0.1}
                        tooltipPlacement='top'
                    />
                </InputGroup.Text>
                <Form.Control className="w-25" type='number' step={0.1} value={pointValueX} onChange={handlePointChangeX} isInvalid={!pointValidX}/>
                <Form.Control.Feedback type='invalid'>Please input a valid number</Form.Control.Feedback>
            </InputGroup>
            <InputGroup hasValidation>
                <InputGroup.Text>Y :</InputGroup.Text>
                <InputGroup.Text style={{
                    backgroundColor: 'white',
                }}>
                    <RangeSlider
                        value={pointValueY}
                        onChange={handlePointChangeY}
                        min={-3.5}
                        max={3.5}
                        step={0.1}
                    />
                </InputGroup.Text>
                <Form.Control type='number' step={0.1} value={pointValueY} onChange={handlePointChangeY} isInvalid={!pointValidY}/>
                <Form.Control.Feedback type='invalid'>Please input a valid number</Form.Control.Feedback>
            </InputGroup>
        </>
    )
}


const ResultViewer: React.FC<ResultViewerProps> = (props) => {

    const [ showWeblogo, setShowWeblogo ] = useState<boolean>(false);
    const [ showSecondaryStructure, setShowSecondaryStructure ] = useState<boolean>(false);

    const [ weblogoBase64, setWeblogoBase64 ] = useState<string>('');
    const [ secondaryStructureBase64, setSecondaryStructureBase64 ] = useState<string>('');

    // count 0 reserved for "result" sequence
    const [ count, setCount ] = useState<number>(1);

    const [ result, setResult ] = useState<string>('');
    const [ showResult, setShowResult ] = useState<boolean>(false);
    
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
                session_id: props.sessionId,
                coords: [{
                    coord_x: props.point[0],
                    coord_y: props.point[1],
                }]
            }, {
                responseType: "arraybuffer"
            }).then((res) => res.data);

            const base64 = Buffer.from(resWeblogo, 'binary').toString('base64');
            setWeblogoBase64(base64);
        };

        fetchWeblogo();
    }, [ props.sessionId, props.point, showWeblogo ]);

    useEffect(() => {
        if (!showSecondaryStructure || result === '') {
            setSecondaryStructureBase64('');
            return;
        }

        if (lock) {
            return;
        }

        const fetchSecondaryStructure = async () => {
            const resSecondaryStructure = await axios.get('/tool/secondary-structure', {
                params: {
                    sequence: result,
                },
                responseType: 'arraybuffer'
            }).then((res) => res.data);

            const base64 = Buffer.from(resSecondaryStructure, 'binary').toString('base64');
            setSecondaryStructureBase64(base64);
        };

        fetchSecondaryStructure();
    }, [ result, showSecondaryStructure ]);

    useEffect(() => {
        if (lock) {
            return;
        }

        if (props.sessionId === 0) {
            return;
        }

        const fetchResult = async () => {
            const resResult = await axios.post<ResponseDecode>('/session/decode', {
                session_id: props.sessionId,
                coords: [{
                    coord_x: props.point[0],
                    coord_y: props.point[1],
                }]
            }).then((res) => res.data);
            setResult(resResult.data[0]);
        };
        fetchResult();
    }, [ props.sessionId, props.point ]);

    useEffect(() => {
        const newDecodeSeqList = props.decodeSeqList.map((entry) => {
            if (entry.key === '0') {
                return {
                    ...entry,
                    coord_x: props.point[0],
                    coord_y: props.point[1],
                    seq: result,
                    show: showResult,
                }
            }
            return entry;
        });
        props.setDecodeSeqList(newDecodeSeqList);
    }, [props.point, result, showResult])

    const handleAdd = async () => {
        const newDecodeSeqList = props.decodeSeqList.concat([{
            key: String(count),
            id: String(count),
            seq: result,
            coord_x: props.point[0],
            coord_y: props.point[1],
            show: true,
        }])
        setCount(count + 1)
        props.setDecodeSeqList(newDecodeSeqList);
    }

    return (
        <div>
            <InputGroup>
                <InputGroup.Text>
                    <Form.Check label='Show' checked={showResult} onChange={(e) => setShowResult(e.currentTarget.checked)}/>
                </InputGroup.Text>
                <Form.Control value={result} readOnly/>
                <Button
                    disabled={result === ""}
                    onClick={handleAdd}
                >＋</Button>
            </InputGroup>
            <Form.Switch label='Show Weblogo' checked={showWeblogo} onChange={(e) => setShowWeblogo(e.currentTarget.checked)}/>
            <Form.Switch label='Show Secondary Structure' checked={showSecondaryStructure} onChange={(e) => setShowSecondaryStructure(e.currentTarget.checked)}/>
            {
                showWeblogo ? (
                    <div>
                        <Form.Label>Weblogo</Form.Label>
                        <Image src={`data:image/png;charset=utf-8;base64,${weblogoBase64}`} fluid/>
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

const SequenceRecord: React.FC<SequenceRecordProps> = React.memo<SequenceRecordProps>(function _SequenceRecord(props) {

    const [ isEditing, setIsEditing ] = useState<boolean>(false);

    const [ inputXValue, setInputXValue ] = useState<number>(props.entry.coord_x);
    const [ inputYValue, setInputYValue ] = useState<number>(props.entry.coord_y);
    const [ inputXValid, setInputXValid ] = useState<boolean>(true);
    const [ inputYValid, setInputYValid ] = useState<boolean>(true);

    const handleShowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newInputSeqList = props.decodeSeqList.map((entry) => {
            if (entry.key === props.entry.key) {
                entry = {...entry};
                entry.show = e.currentTarget.checked;
            }
            return entry;
        });
        props.setDecodeSeqList(newInputSeqList);
    };

    const handleRemove = () => {
        let newInputSeqList = props.decodeSeqList.filter((entry) => entry.key !== props.entry.key);
        props.setDecodeSeqList(newInputSeqList);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setInputXValue(props.entry.coord_x);
        setInputYValue(props.entry.coord_y);
        setIsEditing(false);
    };

    const handleEditSave = async () => {
        if (inputXValid && inputYValid) {
            const resDecode = await axios.post<ResponseDecode>('/session/decode', {
                session_id: props.sessionId,
                coords: [{
                    coord_x: inputXValue,
                    coord_y: inputYValue,
                }]
            }).then((res) => res.data);
            const decodedSeq = resDecode.data[0];
            let newInputSeqList = props.decodeSeqList.map((entry) => {
                if (entry.key === props.entry.key) {
                    entry = {...entry};
                    entry.seq = decodedSeq;
                    entry.coord_x = inputXValue;
                    entry.coord_y = inputYValue;
                }
                return entry;
            });
            props.setDecodeSeqList(newInputSeqList);
            setIsEditing(false);
        }
    };

    const handleInputXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.currentTarget.value);
        setInputXValue(value)
        if (isNaN(value)) {
            setInputXValid(false);
        } else {
            setInputXValid(true);
        }
    };

    const handleInputYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.currentTarget.value);
        setInputYValue(value)
        if (isNaN(value)) {
            setInputYValid(false);
        } else {
            setInputYValid(true);
        }
    };

    if (isEditing) {
        return (
            <tr key={props.entry.key} >
            <td><Form.Check type="checkbox" checked={props.entry.show} onChange={handleShowChange} /></td>
            <td>
                <Form.Control
                    type="number"
                    value={inputXValue}
                    onChange={handleInputXChange}
                    isInvalid={!inputXValid}
                />
            </td>
            <td>
                <Form.Control
                    type="number"
                    value={inputYValue}
                    onChange={handleInputYChange}
                    isInvalid={!inputYValid}
                />
            </td>
            <td> </td>
            <td>
                <Button variant="outline-secondary" onClick={handleEditSave} disabled={!inputXValid}>Save</Button>
                <Button variant="outline-danger" onClick={handleEditCancel}>Cancel</Button>
            </td>
        </tr>
        )
    } else {
        return (
            <tr key={props.entry.key} >
                <td><Form.Check type="checkbox" checked={props.entry.show} onChange={handleShowChange} /></td>
                <td>{props.entry.coord_x}</td>
                <td>{props.entry.coord_y}</td>
                <td style={{
                    // fontFamily: 'monospace',
                    wordBreak: 'break-all',
                }}>{props.entry.seq}</td>
                <td>
                    <Button variant="outline-primary" onClick={handleEdit}>Edit</Button>
                    <Button variant="outline-danger" onClick={handleRemove}>Remove</Button>
                </td>
            </tr>
        )
    }
});

type TableProps = {
    sessionId: number,
    decodeSeqList: DecodeDataElement[],
    setDecodeSeqList: React.Dispatch<React.SetStateAction<DecodeDataElement[]>>,
}

const SequenceTable: React.FC<TableProps> = React.memo<TableProps>(function _SequenceTable(props) {
    return (
        <table className="table table-striped table-bordered">
            <thead>
                <tr>
                    <th>Show</th>
                    <th>x</th>
                    <th>y</th>
                    <th>Sequence</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {props.decodeSeqList.map((entry) => {
                    if (entry.key === "0") {
                        return null
                    } else {
                        return (
                            <SequenceRecord
                                key={entry.key}
                                decodeSeqList={props.decodeSeqList}
                                setDecodeSeqList={props.setDecodeSeqList}
                                entry={entry}
                                sessionId={props.sessionId}
                            />
                        )
                    }
                })}
            </tbody>
        </table>
    )
});

const DecodePanel: React.FC = () => {
    const dispatch = useDispatch();

    const sessionId = useSelector((state: RootState) => state.selexData.vaeConfig.sessionId);
    const [ point, setPoint ] = useState<Record<number, number>>({0: 0, 1: 0});
    const [ decodeSeqList, setDecodeSeqList ] = useState<DecodeDataElement[]>([{
        key: "0",
        show: false,
        id: "",
        coord_x: 0,
        coord_y: 0,
        seq: "",
    }]);

    useEffect(() => {
        dispatch(setDecodeData(decodeSeqList));
    }, [decodeSeqList]);


    return (
        <Form>
            <Form.Group className='mb-3'>
                <Form.Label>Latent Point</Form.Label>
                <PointSelector point={point} setPoint={setPoint}/>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label>Decoded Sequence</Form.Label>
                <ResultViewer 
                    sessionId={sessionId} 
                    point={point}
                    decodeSeqList={decodeSeqList}
                    setDecodeSeqList={setDecodeSeqList}
                />
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label>Sequence List</Form.Label>
                <SequenceTable
                    sessionId={sessionId} 
                    decodeSeqList={decodeSeqList}
                    setDecodeSeqList={setDecodeSeqList}
                />
            </Form.Group>
        </Form>
    )
};

export default DecodePanel;