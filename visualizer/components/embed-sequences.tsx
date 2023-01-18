import axios from 'axios';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Form, Button, Table, InputGroup } from 'react-bootstrap';

axios.defaults.baseURL = 'http://localhost:8000/dev';

type EncodeSequenceEntry = {
    key: string;
    id: string;
    seq: string;
    coord_x: number;
    coord_y: number;
    show: boolean;
    from: 'fasta' | 'manual';
    fasta_file: string | null;
}

type SequenceListProps = {
    setEncodeSeqList: Dispatch<SetStateAction<EncodeSequenceEntry[]>>;
    encodeSeqList: EncodeSequenceEntry[];
}

type SequeceRecordProps = {
    setEncodeSeqList: Dispatch<SetStateAction<EncodeSequenceEntry[]>>;
    encodeSeqList: EncodeSequenceEntry[];
    entry: EncodeSequenceEntry;
}

type EncodeResponse = {
    coord_x: number[];
    coord_y: number[];
}

const SeqenceRecord: React.FC<SequeceRecordProps> = ({ setEncodeSeqList, encodeSeqList, entry }) => {

    const [ isEditing, setIsEditing ] = useState<boolean>(false);
    const [ seqValue, setSeqValue ] = useState<string>(entry.seq);
    const [ seqValid, setSeqValid ] = useState<boolean>(true);
    
    const onShowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEncodeSeqList = [...encodeSeqList];
        const index = newEncodeSeqList.findIndex((elem) => elem.key === entry.key);
        newEncodeSeqList[index].show = e.currentTarget.checked;
        setEncodeSeqList(newEncodeSeqList);
    }
    
    const onRemove = () => {
        const newEncodeSeqList = [...encodeSeqList];
        const index = newEncodeSeqList.findIndex((elem) => elem.key === entry.key);
        newEncodeSeqList.splice(index, 1);
        setEncodeSeqList(newEncodeSeqList);
    }

    const onEdit = () => {
        setIsEditing(true);
    }

    const onEditCancel = () => {
        setSeqValue(entry.seq);
        setIsEditing(false);
    }

    const onEditSave = async () => {
        const newEncodeSeqList = [...encodeSeqList];
        const index = newEncodeSeqList.findIndex((elem) => elem.key === entry.key);

        const coords: EncodeResponse = await axios.post( "/sample/encode", {
            seq: [seqValue], 
            session_ID: 42
        }).then((res) => res.data);
        
        
        newEncodeSeqList[index].seq = seqValue;
        newEncodeSeqList[index].coord_x = coords.coord_x[0];
        newEncodeSeqList[index].coord_y = coords.coord_y[0];

        setEncodeSeqList(newEncodeSeqList);
        setIsEditing(false);
    }

    const validateSeq = (seq: string) => {
        const regex = /^[ACGTUacgtu]+$/;
        return regex.test(seq);
    }

    const onSeqChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // uppercase and T to U
        const seq = e.currentTarget.value.toUpperCase().replace(/T/g, "U");
        setSeqValue(seq);
        setSeqValid(validateSeq(seq));
    }

    if (isEditing) {
        return (
            <tr key={entry.key} >
                <td><Form.Check type="checkbox" checked={entry.show} onChange={onShowChange} /></td>
                <td>{entry.id}</td>
                <td>
                    <Form.Control
                        type="text"
                        value={seqValue}
                        onChange={onSeqChange}
                        isInvalid={!seqValid}
                    />
                    <Form.Control.Feedback type="invalid">Invalid sequence</Form.Control.Feedback>
                </td>
                <td>
                    <Button variant="outline-secondary" onClick={onEditSave} disabled={!seqValid}>Save</Button>
                    <Button variant="outline-danger" onClick={onEditCancel}>Cancel</Button>
                </td>
            </tr>
        )
    } else {
        return (
            <tr key={entry.key} >
                <td><Form.Check type="checkbox" checked={entry.show} onChange={onShowChange} /></td>
                <td>{entry.id}</td>
                <td>{entry.seq}</td>
                <td>
                    <Button variant="outline-secondary" onClick={onEdit}>Edit</Button>
                    <Button variant="outline-danger" onClick={onRemove}>Remove</Button>
                </td>
            </tr>
        )
    }
}

const SequenceTable: React.FC<SequenceListProps> = React.memo<SequenceListProps>(({ setEncodeSeqList, encodeSeqList }) => {
    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Show</th>
                    <th>ID</th>
                    <th>Sequence</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {encodeSeqList.map((entry) => (
                    <SeqenceRecord
                        key={entry.key}
                        setEncodeSeqList={setEncodeSeqList}
                        encodeSeqList={encodeSeqList}
                        entry={entry}
                    />
                ))}
            </tbody>
        </Table>
    )
})

const SingleSequenceForm: React.FC<SequenceListProps> = ({ setEncodeSeqList, encodeSeqList }) => {
    const [ singleSequence, setSingleSequence ] = useState<string>("");
    const [ singleSequenceValid, setSingleSequenceValid ] = useState<boolean>(true);
    const [ singleSequenceId, setSingleSequenceId ] = useState<number>(0);

    const onSingleSequenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value.toUpperCase().replace(/T/g, "U");
        setSingleSequence(value);

        const isValid: boolean = validateSeq(value);
        setSingleSequenceValid(isValid);
    }

    const validateSeq = (seq: string) => {
        const regex = /^[ACGUacgu]+$/;
        return regex.test(seq);
    }

    const onAddClick = async () => {
        try {
            const coords: EncodeResponse = await axios.post( "/sample/encode", {
                seq: [singleSequence], 
                session_ID: 42
            }).then((res) => res.data);
            
            const newEncodeSeqList = [...encodeSeqList];
            newEncodeSeqList.push({
                key: String(singleSequenceId),
                id: `manual_${singleSequenceId}`,
                seq: singleSequence,
                show: true,
                coord_x: coords.coord_x[0],
                coord_y: coords.coord_y[0],
                from: "manual",
                fasta_file: null,
            });
            setEncodeSeqList(newEncodeSeqList);
            setSingleSequence("");
            setSingleSequenceId(singleSequenceId + 1);
        } catch {
            // alert("network error");
            alert(`Error: ${singleSequence} is not a valid sequence.`)
        }
    }

    return (
        <Form.Group className="mb-3">
            <InputGroup hasValidation>
                <Form.Control id="newSeqInput" onChange={onSingleSequenceChange} value={singleSequence} isInvalid={!singleSequenceValid}/>
                <Button
                    id="addSeqButton"
                    disabled={(singleSequence === "") || !singleSequenceValid}
                    onClick={onAddClick}
                >＋</Button>
                <Form.Control.Feedback type="invalid">Please enter a valid sequence.</Form.Control.Feedback>
            </InputGroup>
        </Form.Group>
    )
}

const FastaUploader: React.FC<SequenceListProps> = ({ setEncodeSeqList, encodeSeqList }) => {
    const [ fastaSequences, setFastaSequences ] = useState<EncodeSequenceEntry[]>([]);
    const [ fastaFeedback, setFastaFeedback ] = useState<string>("Please upload a valid fasta file.");
    const [ isFastaValid, setIsFastaValid ] = useState<boolean>(true);

    
    const onFastaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (files === null) {
            setFastaSequences([]);
            setIsFastaValid(true);
            setFastaFeedback("");
            return;
        }

        const file = files[0];
        const filename = file.name;
        if (!filename.endsWith(".fasta")) {
            setFastaSequences([]);
            setIsFastaValid(false);
            setFastaFeedback("Please upload a valid fasta file.");
            return;
        }

        const content = await file.text();
        const fastaRegex = /^>\s*(\S+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        let entries: EncodeSequenceEntry[] = [];
        while (match = fastaRegex.exec(content)) {
            matchCount++;
            const id = match[1];
            const seq = match[2].replace(/[\n\r]/g, "").toUpperCase().replace(/T/g, "U");
            entries.push({
                key: `${filename}_${matchCount}`,
                id: id,
                seq: seq,
                show: true,
                coord_x: 0,
                coord_y: 0,
                from: "fasta",
                fasta_file: filename,
            })
        }

        if (matchCount === 0) {
            setFastaSequences([]);
            setIsFastaValid(false);
            setFastaFeedback("The file is invalid / does not contain any FASTA entries.");
            return;
        }

        // /dev/encode requires array which contains more than 0 entries
        // therefore matchCount (the number of valid FASTA entries) must be more than 0

        const seqs = entries.map((entry) => entry.seq);

        try {
            const coords: EncodeResponse = await axios.post( "/sample/encode", {
                seq: seqs,
                session_ID: 42
            }).then((res) => res.data);

            entries = entries.map((entry, i) => {
                return {
                    ...entry,
                    coord_x: coords.coord_x[i],
                    coord_y: coords.coord_y[i],
                }
            });

            const allCount = content.match(/^>/gm)?.length ?? 0;
            if (matchCount !== allCount) {
                setFastaFeedback(`Looks good. But the file contains ${allCount - matchCount} invalid FASTA entries.`);
            } else {
                setFastaFeedback("");
            }

            setFastaSequences(entries);
            setIsFastaValid(true);
            return;
        } catch {
            setFastaSequences([]);
            setIsFastaValid(false);
            setFastaFeedback("Network error.");
            return;
        }
    };

    useEffect(() => {
        if (fastaSequences.length > 0 && isFastaValid) {
            setEncodeSeqList(encodeSeqList.concat(fastaSequences));
        }
    }, [fastaSequences, isFastaValid]);

    return (
        <Form.Group className="mb-3">
            <Form.Control id="newSeqFile" type="file" onChange={onFastaChange} isInvalid={!isFastaValid} isValid={(isFastaValid) && fastaSequences.length > 0}/>
            <Form.Control.Feedback type="invalid">{fastaFeedback}</Form.Control.Feedback>
            <Form.Control.Feedback type="valid">{fastaFeedback}</Form.Control.Feedback>
        </Form.Group>
    )
};

const EncodePanel: React.FC<SequenceListProps> = React.memo<SequenceListProps>(({ encodeSeqList, setEncodeSeqList }) => {
    return (
        <div className="encode-panel">
            <Form.Label>Encode Sequence</Form.Label>
            <SingleSequenceForm setEncodeSeqList={setEncodeSeqList} encodeSeqList={encodeSeqList}/>
            <Form.Label>Encode Fastafile</Form.Label>
            <FastaUploader setEncodeSeqList={setEncodeSeqList} encodeSeqList={encodeSeqList}/>
            <Form.Label>Sequences</Form.Label>
            <SequenceTable encodeSeqList={encodeSeqList} setEncodeSeqList={setEncodeSeqList}/>
        </div>
    )
});

export default EncodePanel;