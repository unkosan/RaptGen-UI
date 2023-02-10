
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, InputGroup, ProgressBar, Table } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { RootState, setPseudoRoute } from '../../redux/store';
import { useSelector } from 'react-redux';
import { SelexDataElement, setSelexData, setVaeProgress } from '../../redux/vae';

type UploadDataTableProps = {}

const UploadDataTable: React.FC<UploadDataTableProps> = (props) => {
    const numData = useSelector((state: RootState) => state.vaeData.numbers);
    const seqData = useSelector((state: RootState) => state.vaeData.input);

    const seqs: string[] = seqData.uniqueSeqs
        .filter((seq, i) => seqData.adapterMask[i])
        .map((seq) => seqData.reverseAdapter
            ? seq.slice(seqData.forwardAdapter.length, -seqData.reverseAdapter.length)
            : seq.slice(seqData.forwardAdapter.length));
    const dups: number[] = seqData.duplicates
        .filter((seq, i) => seqData.adapterMask[i]);
    const tuple = seqs.map((seq, i) => {
        return {seq: seq, dup: dups[i]}
    });
    const sortedTuple = tuple.sort((a, b) => b.dup - a.dup);

    return (
        <div>
            <legend>Upload Data Info</legend>
            <Table bordered hover>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    <tr key="all">
                        <td>All entry</td>
                        <td>{numData.allEntries}</td>
                    </tr>
                    <tr key="unique">
                        <td>Uniquified</td>
                        <td>{numData.uniqueEntries}</td>
                    </tr>
                    <tr key="uniqueWithAdapters">
                        <td>Adapters Matched</td>
                        <td>{numData.uniqueEntriesWithAdapters}</td>
                    </tr>
                </tbody>
            </Table>
            <legend>Data List</legend>
            <div style={{height: '200px', overflowY: 'auto'}}>
            <Table bordered hover>
                <thead style={{position: 'sticky'}}>
                    <tr>
                        <th>Trimed Sequences</th>
                        <th>Duplicates</th>
                    </tr>
                </thead>
                <tbody>
                    { sortedTuple.map((item, i) => {
                        return (
                            <tr key={i}>
                                <td>{item.seq}</td>
                                <td>{item.dup}</td>
                            </tr>
                        )
                    }) }
                </tbody>
            </Table>
            </div>
        </div>
    )
}

type ProcessInfoProps = {
    setIsValid: React.Dispatch<React.SetStateAction<boolean>>
}

const ProcessInfo: React.FC<ProcessInfoProps> = (props) => {
    const dispatch = useDispatch();
    const [ finished, setFinished ] = useState(false);
    const [ isResultValid, setIsResultValid ] = useState(false);
    const progressData = useSelector((state: RootState) => state.vaeData.progress)
    const inputData = useSelector((state: RootState) => state.vaeData.input)

    useEffect(() => {
        if (progressData.state === 'SUCCESS') {
            setFinished(true);
            setIsResultValid(true);
            props.setIsValid(true);
        } else if (progressData.state === 'FAILURE') {
            setFinished(true);
            setIsResultValid(false);
        }
    }, [progressData])

    useEffect(() => {
        const interval = setInterval(() => {
            if (!progressData.id) {
                console.log('interval called, progid: ' + progressData.id)
                return;
            }

            axios.get(`/upload/batch-encode`, {
                params: { task_id: progressData.id }
            })
                .then((res) => {
                    const state: string = res.data.state
                    const status: string = res.data.status
                    const result = res.data.result
                    console.log('interval called, state: ' + state + '\n progid: ' + progressData.id)

                    if (state === 'SUCCESS') {
                        console.log(status)
                        const coords: number[][] = result
                        const seqs: string[] = inputData.uniqueSeqs.filter((seq, i) => inputData.adapterMask[i])
                        const dups: number[] = inputData.duplicates.filter((seq, i) => inputData.adapterMask[i])
                        const randomRegions = seqs.map((seq) => {
                            return seq.slice(
                                inputData.forwardAdapter.length,
                                seq.length - inputData.reverseAdapter.length,
                            );
                        });
                        const selexData: SelexDataElement[] = coords.map((coord, i) => {
                            return {
                                sequence: seqs[i],
                                randomRegion: randomRegions[i],
                                duplicates: dups[i],
                                coord_x: coord[0],
                                coord_y: coord[1],
                            }
                        }) 
                        dispatch(setSelexData(selexData));
                        clearInterval(interval);
                    }

                    let value = 0;
                    if (state === 'PROGRESS') {
                        const [current, total] = status.split(',').map((coordStr) => parseFloat(coordStr))
                        value = current / total * 100;
                    }

                    dispatch(setVaeProgress({
                        id: progressData.id,
                        state: state as 'IDLE' | 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE',
                        value: value,
                    }));
                })
                .catch((err) => {
                    console.log(err);
                })
        }, 1000);
        return () => clearInterval(interval);
    }, []); 

    return (
        <div style={{marginTop: '1em'}}>
            <legend>Process Info</legend>
            { finished && isResultValid ? (
                <Alert variant="success">
                    Successfully Encoded
                </Alert>
            ) : finished && !isResultValid ? (
                <Alert variant="danger">
                    Failed to Encode
                </Alert>
            ) : (
                <>
                    <Form.Label>Encoding... {progressData.value} %</Form.Label>
                    <ProgressBar animated now={progressData.value} />
                </>
            )}
        </div>
    )
}

const SidebarVaeEncode: React.FC<{}> = () => {
    const dispatch = useDispatch();
    const [ isEncodeValid, setIsEncodeValid ] = useState<boolean>(false)

    const handleBack = () => {
        dispatch(setPseudoRoute('/vae'))
    }

    const handleNext = () => {
        dispatch(setPseudoRoute('/vae/submit'))
    }

    return (
        <>
            <UploadDataTable />
            <ProcessInfo setIsValid={setIsEncodeValid}/>
            <Button onClick={handleBack}>
                Back
            </Button>
            <Button onClick={handleNext} disabled={!isEncodeValid}>
                Next
            </Button>
        </>
    )
}

export default SidebarVaeEncode