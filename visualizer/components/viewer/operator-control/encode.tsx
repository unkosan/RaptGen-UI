import axios from "axios";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { ResponseEncode } from "../../../types/api-interface/session";
import { RootState } from "../../store";

import { setInputData } from "../redux/input";
import { InputDataElement } from "../redux/input";

type Props = {
    sessionId: number,
    inputSeqList: InputDataElement[],
    setInputSeqList: Dispatch<SetStateAction<InputDataElement[]>>,
}

type SequenceRecordProps = {
    sessionId: number,
    inputSeqList: InputDataElement[],
    setInputSeqList: Dispatch<SetStateAction<InputDataElement[]>>,
    entry: InputDataElement,
}

const SequenceRecord: React.FC<SequenceRecordProps> = React.memo<SequenceRecordProps>((props) => {

    const [ isEditing, setIsEditing ] = useState<boolean>(false);
    const [ inputValue, setInputValue ] = useState<string>(props.entry.seq);
    const [ inputValid, setInputValid ] = useState<boolean>(true);

    const handleShowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newInputSeqList = props.inputSeqList.map((entry) => {
            if (entry.key === props.entry.key) {
                entry = {...entry};
                entry.show = e.currentTarget.checked;
            }
            return entry;
        });
        props.setInputSeqList(newInputSeqList);
    };

    const handleRemove = () => {
        let newInputSeqList = props.inputSeqList.filter((entry) => entry.key !== props.entry.key);
        props.setInputSeqList(newInputSeqList);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setInputValue(props.entry.seq);
        setIsEditing(false);
    };

    const handleEditSave = async () => {
        if (inputValid) {
            const resEncode = await axios.post<ResponseEncode>('/session/encode', {
                session_id: props.sessionId,
                sequences: [inputValue],
            }).then((res) => res.data);
            const { coord_x, coord_y } = resEncode.data[0];
            let newInputSeqList = props.inputSeqList.map((entry) => {
                if (entry.key === props.entry.key) {
                    entry = {...entry};
                    entry.seq = inputValue;
                    entry.coord_x = coord_x;
                    entry.coord_y = coord_y;
                }
                return entry;
            });
            props.setInputSeqList(newInputSeqList);
            setIsEditing(false);
        }
    };

    const validateSeq = (seq: string) => {
        const regex = /^[ACGTUacgtu]+$/;
        return regex.test(seq);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // uppercase and T to U
        const value = e.currentTarget.value.toUpperCase().replace(/T/g, "U");
        setInputValue(value);
        setInputValid(validateSeq(value));
    };

    if (isEditing) {
        return (
            <tr key={props.entry.key} >
            <td><Form.Check type="checkbox" checked={props.entry.show} onChange={handleShowChange} /></td>
            <td>{props.entry.id}</td>
            <td>
                <Form.Control
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    isInvalid={!inputValid}
                />
                <Form.Control.Feedback type="invalid">Invalid sequence</Form.Control.Feedback>
            </td>
            <td>
                <Button variant="outline-secondary" onClick={handleEditSave} disabled={!inputValid}>Save</Button>
                <Button variant="outline-danger" onClick={handleEditCancel}>Cancel</Button>
            </td>
        </tr>
        )
    } else {
        return (
            <tr key={props.entry.key} >
                <td><Form.Check type="checkbox" checked={props.entry.show} onChange={handleShowChange} /></td>
                <td>{props.entry.id}</td>
                <td>{props.entry.seq}</td>
                <td>
                    <Button variant="outline-primary" onClick={handleEdit}>Edit</Button>
                    <Button variant="outline-danger" onClick={handleRemove}>Remove</Button>
                </td>
            </tr>
        )
    }
});

const SequenceTable: React.FC<Props> = React.memo<Props>((props) => {
    return (
        <table className="table table-striped table-bordered">
            <thead>
                <tr>
                    <th>Show</th>
                    <th>ID</th>
                    <th>Sequence</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {props.inputSeqList.map((entry) => {
                    return (
                        <SequenceRecord
                            key={entry.key}
                            inputSeqList={props.inputSeqList}
                            setInputSeqList={props.setInputSeqList}
                            entry={entry}
                            sessionId={props.sessionId}
                        />
                    )
                })}
            </tbody>
        </table>
    )
});

const SingleSequenceForm: React.FC<Props> = React.memo<Props>((props) => {

    const [ inputCount, setInputCount ] = useState<number>(0);
    const [ inputValue, setInputValue ] = useState<string>("");
    const [ inputValid, setInputValid ] = useState<boolean>(true);

    const validateSeq = (seq: string) => {
        const regex = /^[ACGTUacgtu]+$/;
        return regex.test(seq);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // uppercase and T to U
        const value = e.currentTarget.value.toUpperCase().replace(/T/g, "U");
        setInputValue(value);
        setInputValid(validateSeq(value));
    };

    const handleAdd = async () => {
        if (inputValid) {
            const resEncode = await axios.post<ResponseEncode>('/session/encode', {
                session_id: props.sessionId,
                sequences: [inputValue],
            }).then((res) => res.data);
            const { coord_x, coord_y } = resEncode.data[0];
            let newInputSeqList = props.inputSeqList.concat([{
                key: String(inputCount),
                id: `Sequence ${inputCount}`,
                seq: inputValue,
                show: true,
                coord_x: coord_x,
                coord_y: coord_y,
                from: "manual",
                fasta_file: null,
            }]);
            props.setInputSeqList(newInputSeqList);
            setInputCount(inputCount + 1);
            setInputValue("");
        }
    };

    return (
        <Form.Group className="mb-3">
            <InputGroup hasValidation>
                <Form.Control id="newSeqInput" onChange={handleInputChange} value={inputValue} isInvalid={!inputValid}/>
                <Button
                    id="addSeqButton"
                    disabled={(inputValue === "") || !inputValid}
                    onClick={handleAdd}
                >＋</Button>
                <Form.Control.Feedback type="invalid">Please enter a valid sequence.</Form.Control.Feedback>
            </InputGroup>
        </Form.Group>
    )
});

const FastaUploader = React.memo((props: Props) => {

    const [ fastaSequences, setFastaSequences ] = useState<InputDataElement[]>([]);
    const [ fastaFeedback, setFastaFeedback ] = useState<string>("");
    const [ isFastaValid, setIsFastaValid ] = useState<boolean>(true);

    type FastaParserResult = {
        fasta: {
            ids: string[],
            seqs: string[],
        } | null,
        invalidCount: number,
    }

    const fastaParser = (text: string): FastaParserResult => {
        const allCount = text.match(/^>/gm)?.length ?? 0;
        const fastaRegex = /^>\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
        let match: RegExpExecArray | null;
        let matchCount = 0;
        let entriesId = [];
        let entriesSeq = [];
        while (match = fastaRegex.exec(text)) {
            matchCount += 1;
            const id = match[1]
            const seq = match[2].replace(/[\n\r]/g, "").toUpperCase().replace(/T/g, "U");
            entriesId.push(id);
            entriesSeq.push(seq);
        }
        if (matchCount === 0) {
            return {
                fasta: null,
                invalidCount: 0,
            }
        } else {
            return {
                fasta: {
                    ids: entriesId,
                    seqs: entriesSeq,
                },
                invalidCount: allCount - matchCount,
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.item(0);
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const { fasta, invalidCount } = fastaParser(text);
                if (fasta) {
                    const resEncode = await axios.post<ResponseEncode>('/session/encode', {
                        session_id: props.sessionId,
                        sequences: fasta.seqs,
                    }).then((res) => res.data);
                    const coords = resEncode.data;
                    const fastaData: InputDataElement[] = coords.map(({ coord_x, coord_y }, index) => {
                        return {
                            key: String(index),
                            id: fasta.ids[index],
                            seq: fasta.seqs[index],
                            show: true,
                            coord_x: coord_x,
                            coord_y: coord_y,
                            from: "fasta",
                            fasta_file: file.name,
                        }
                    })
                    setFastaSequences(fastaData);
                    if (invalidCount > 0) {
                        setFastaFeedback(`Fasta file is valid. ${invalidCount} invalid sequences were ignored.`);
                    } else {
                        setFastaFeedback("Fasta file is valid.");
                    }
                    setIsFastaValid(true);
                } else {
                    setFastaSequences([]);
                    setFastaFeedback("Please upload a valid fasta file.");
                    setIsFastaValid(false);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <Form.Group className="mb-3">
            <Form.Control id="newSeqFile" type="file" onChange={handleFileChange} isInvalid={!isFastaValid} isValid={(isFastaValid) && fastaSequences.length > 0}/>
            <Form.Control.Feedback type="invalid">{fastaFeedback}</Form.Control.Feedback>
            <Form.Control.Feedback type="valid">{fastaFeedback}</Form.Control.Feedback>
        </Form.Group>
    )
});

const EncodePanel: React.FC = () => {
    const dispatch = useDispatch();

    const sessionId = useSelector((state: RootState) => state.selexData.vaeConfig.sessionId);
    const [ inputSeqList, setInputSeqList ] = useState<InputDataElement[]>([]);

    useEffect(() => {
        if (sessionId === 0 || inputSeqList.length === 0) {
            return;
        }
        const fetchData = async () => {
            const resEncode = await axios.post<ResponseEncode>('/session/encode', {
                session_id: sessionId,
                sequences: inputSeqList.map((seq) => seq.seq),
            }).then((res) => res.data);
            const coords = resEncode.data;
            const newInputSeqList = inputSeqList.map((seq, index) => {
                return {
                    ...seq,
                    coord_x: coords[index].coord_x,
                    coord_y: coords[index].coord_y,
                }
            });
            setInputSeqList(newInputSeqList);
        };
        fetchData();
    }, [sessionId]);

    useEffect(() => {
        dispatch(setInputData(inputSeqList))
    }, [inputSeqList]);

    return (
        <div className="encode-panel">
            <Form.Label>Encode Sequence</Form.Label>
            <SingleSequenceForm sessionId={sessionId} inputSeqList={inputSeqList} setInputSeqList={setInputSeqList}/>
            <Form.Label>Encode Fastafile</Form.Label>
            <FastaUploader sessionId={sessionId} inputSeqList={inputSeqList} setInputSeqList={setInputSeqList}/>
            <Form.Label>Sequence List</Form.Label>
            <SequenceTable sessionId={sessionId} inputSeqList={inputSeqList} setInputSeqList={setInputSeqList}/>
        </div>
    )
}

export default EncodePanel;