import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { RootState, setPseudoRoute } from '../../redux/store';
import { useSelector } from 'react-redux';
import { setVaeInput, setVaeNumbers, setVaeProgress } from '../../redux/vae';

type FileUploaderProps = {
    selexFile: File | null,
    vaeFile: File | null,
    setSelexFile: React.Dispatch<React.SetStateAction<File | null>>,
    setVaeFile: React.Dispatch<React.SetStateAction<File | null>>,
    setSelexSequences: React.Dispatch<React.SetStateAction<string[]>>,
    setSelexDuplicates: React.Dispatch<React.SetStateAction<number[]>>,
    setValid: React.Dispatch<React.SetStateAction<boolean>>,
}

const FileUploader: React.FC<FileUploaderProps> = (props) => {
    const [ isSelexValid, setIsSelexValid ] = useState<boolean>(false);
    const [ selexFeedback, setSelexFeedback ] = useState<string>('');

    const [ isVaeValid, setIsVaeValid ] = useState<boolean>(false);
    const [ vaeFeedback, setVaeFeedback ] = useState<string>('');

    useEffect(() => {
        props.setValid( isSelexValid && isVaeValid )
    }, [isSelexValid, isVaeValid]);

    const parse = (text: string, type: 'fasta' | 'fastq') => {
        let regex;
        let allCount = 0;
        if (type === 'fasta') {
            regex = /^>\s*\S+[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
            allCount = text.match(/^>/gm)?.length ?? 0;
        } else {
            regex = /^@\s*\S+[\n\r]+([ACGTUacgtu\n\r]+)/gm;
            allCount = text.match(/^@/gm)?.length ?? 0;
        }
        let match: RegExpExecArray | null;
        let matchCount = 0;
        let sequences = [];
        while (match = regex.exec(text)) {
            matchCount += 1;
            const seq = match[1].replace(/[\n\r]/g, "").toUpperCase().replace(/T/g, "U");
            sequences.push(seq);
        }
        return {
            sequences: sequences,
            count: matchCount,
            invalidCount: allCount - matchCount,
        }
    }

    const uniquify = (sequences: string[]) => {
        const unique = [...new Set(sequences)];
        const duplicates = unique.map((seq) => sequences.filter((s) => s === seq).length);
        return {
            unique: unique,
            duplicates: duplicates,
        }
    }

    // todo: make this faster
    const parseSelex = async (file: File) => {
        const fileType = file.name.split('.').pop() as string
        const fileData = await file.text()
        
        if (fileType !== 'fasta' && fileType !== 'fastq') {
            setSelexFeedback('File must be in FASTA or FASTQ format.')
            setIsSelexValid(false);
            return;
        }

        const parsed = parse(fileData, fileType);

        if (parsed.count === 0) {
            setSelexFeedback('File contains no valid sequences.')
            setIsSelexValid(false);
            return;
        }

        if (parsed.invalidCount > 0) {
            setSelexFeedback(`File contains ${parsed.invalidCount} invalid sequences.`)
        } else {
            setSelexFeedback('')
        }

        const uniquified = uniquify(parsed.sequences);
        props.setSelexSequences(uniquified.unique);
        props.setSelexDuplicates(uniquified.duplicates);
        setIsSelexValid(true);
    }

    const handleSelexFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files === null) {
            return;
        }
        const file = e.target.files[0];
        props.setSelexFile(file);
        parseSelex(file);
    }

    const checkVae = async (file: File) => {
        let formData = new FormData();
        formData.append('state_dict', file)
        const resValid = await axios.post('/upload/validate-pHMM-model', formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });
        const { status, message } = resValid.data;
        if (status === "success") {
            setIsVaeValid(true);
        } else {
            setVaeFeedback(message ?? 'Invalid file');
            setIsVaeValid(false);
            return;
        }
        props.setVaeFile(file);
        return;
    }

    const handleVaeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files === null) {
            return;
        }
        const file = e.target.files[0];
        props.setVaeFile(file);
        checkVae(file);
    }

    return (
        <>
        <legend>Upload File</legend>
        <Form>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="selex-file">SELEX File</Form.Label>
                <Form.Control 
                    type="file" 
                    id="selex-file" 
                    onChange={handleSelexFile} 
                    name={props.selexFile?.name} 
                    isValid={isSelexValid} 
                    isInvalid={!isSelexValid && props.selexFile !== null}
                />
                <Form.Control.Feedback type="valid">{selexFeedback}</Form.Control.Feedback>
                <Form.Control.Feedback type="invalid">{selexFeedback}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="vae-file">VAE File</Form.Label>
                <Form.Control 
                    type="file" 
                    id="vae-file" 
                    onChange={handleVaeFile} 
                    name={props.vaeFile?.name} 
                    isValid={isVaeValid} 
                    isInvalid={!isVaeValid && props.vaeFile !== null}
                />
                <Form.Control.Feedback type="invalid">{vaeFeedback}</Form.Control.Feedback>
            </Form.Group>
        </Form>
        </>
    )
}

type ParamSelectorProps = {
    selexSequences: string[], // use this for auto estimate

    modelName: string,
    setModelName: React.Dispatch<React.SetStateAction<string>>,
    targetLength: number,
    setTargetLength: React.Dispatch<React.SetStateAction<number>>,
    forwardAdapter: string,
    setForwardAdapter: React.Dispatch<React.SetStateAction<string>>,
    reverseAdapter: string,
    setReverseAdapter: React.Dispatch<React.SetStateAction<string>>,

    setValid: React.Dispatch<React.SetStateAction<boolean>>,
}

const ParamSelector: React.FC<ParamSelectorProps> = (props) => {
    const [ isModelNameValid, setIsModelNameValid ] = useState(false);
    const [ isTargetLengthValid, setIsTargetLengthValid ] = useState(false);
    const [ isForwardAdapterValid, setIsForwardAdapterValid ] = useState(false);
    const [ isReverseAdapterValid, setIsReverseAdapterValid ] = useState(false);

    useEffect(() => {
        props.setValid(
            isModelNameValid 
            && isTargetLengthValid
            && isForwardAdapterValid
            && isReverseAdapterValid
        )
    })

    // when come back from another page, check if valid
    useEffect(() => {
        setIsModelNameValid(props.modelName.length > 0)
        setIsTargetLengthValid(props.targetLength > 0)
        setIsForwardAdapterValid(validateSeq(props.forwardAdapter))
        setIsReverseAdapterValid(validateSeq(props.reverseAdapter))
    })

    const handleModelNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        props.setModelName(value)
        if (value.length === 0) {
            setIsModelNameValid(false);
        } else {
            setIsModelNameValid(true);
        }
    }

    const handleTargetLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        props.setTargetLength(value)
        if (isNaN(value) || value < 0) {
            setIsTargetLengthValid(false);
        } else {
            setIsTargetLengthValid(true);
        }
    }

    const validateSeq = (seq: string) => {
        const regex = /^[ACGTUacgtu]+$/;
        return regex.test(seq);
    };

    const handleForwardAdapterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value.toUpperCase().replace(/T/g, "U");
        props.setForwardAdapter(value);
        setIsForwardAdapterValid(validateSeq(value));
    }

    const handleReverseAdapterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.currentTarget.value.toUpperCase().replace(/T/g, "U");
        props.setReverseAdapter(value);
        setIsReverseAdapterValid(validateSeq(value));
    }

    const estimateTargetLength = () => {
        (async () => {
            const res = await axios.post('/upload/estimate-target-length', {
                sequences: props.selexSequences
            });
            const { status, data } = res.data;
            if (status === "success") {
                const targetLength: number = data["target_length"]
                props.setTargetLength(targetLength);
                setIsTargetLengthValid(true);
            }
        })();
    }

    const estimateForwardAdapters = () => {
        (async () => {
            const res = await axios.post('/upload/estimate-adapters', {
                target_length: props.targetLength,
                sequences: props.selexSequences
            });
            const { status, data } = res.data;
            if (status === "success") {
                const forwardAdapter: string = data["forward_adapter"];
                const reverseAdapter: string = data["reverse_adapter"]
                props.setForwardAdapter(forwardAdapter);
                props.setReverseAdapter(reverseAdapter);
                setIsForwardAdapterValid(true);
                setIsReverseAdapterValid(true);
            }
        })();
    }

    return (
        <>
        <legend>Setup Selex Params</legend>
        <Form>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor='model-name'>Model name</Form.Label>
                <Form.Control type="text" id="model-name" 
                    onChange={handleModelNameChange} 
                    value={props.modelName} 
                    isInvalid={!isModelNameValid}
                />
                <Form.Control.Feedback type="invalid">Invalid name</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor='target-length'>Target length</Form.Label>
                <InputGroup hasValidation>
                    <Form.Control type="number" id="target-length" 
                        onChange={handleTargetLengthChange} 
                        value={props.targetLength} 
                        isInvalid={!isTargetLengthValid}
                    />
                    <Button 
                        onClick={estimateTargetLength}
                        variant="outline-secondary"
                    >Auto</Button>
                    <Form.Control.Feedback type="invalid">Invalid value</Form.Control.Feedback>
                </InputGroup>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor='forward-adapter'>Forward adapter</Form.Label>
                <InputGroup hasValidation>
                    <Form.Control type="text" id="forward-adapter" 
                        onChange={handleForwardAdapterChange} 
                        value={props.forwardAdapter} 
                        isInvalid={!isForwardAdapterValid}
                    />
                    <Button 
                        onClick={estimateForwardAdapters}
                        variant="outline-secondary"
                    >Auto</Button>
                    <Form.Control.Feedback type="invalid">Invalid adapter</Form.Control.Feedback>
                </InputGroup>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor='reverse-adapter'>Reverse adapter</Form.Label>
                <InputGroup hasValidation>
                    <Form.Control type="text" id="reverse-adapter" 
                        onChange={handleReverseAdapterChange} 
                        value={props.reverseAdapter} 
                        isInvalid={!isReverseAdapterValid}
                    />
                    <Button 
                        onClick={estimateForwardAdapters}
                        variant="outline-secondary"
                    >Auto</Button>
                    <Form.Control.Feedback type="invalid">Invalid adapter</Form.Control.Feedback>
                </InputGroup>
            </Form.Group>
        </Form>
        </>
    )
}


const SidebarVaeHome: React.FC = () => {
    const vaeInput = useSelector((state: RootState) => state.vaeData.input);

    const [ vaeFile, setVaeFile ] = useState<File | null>(null);
    const [ selexFile, setSelexFile ] = useState<File | null>(null);

    const [ uniqueSeqs, setUniqueSeqs ] = useState<string[]>(vaeInput.uniqueSeqs);
    const [ duplicates, setDuplicates ] = useState<number[]>(vaeInput.duplicates);

    const [ modelName, setModelName ] = useState(vaeInput.modelName);
    const [ targetLength, setTargetLength ] = useState(vaeInput.targetLength);
    const [ forwardAdapter, setForwardAdapter ] = useState(vaeInput.forwardAdapter);
    const [ reverseAdapter, setReverseAdapter ] = useState(vaeInput.reverseAdapter);

    const [ isFileValid, setIsFileValid ] = useState(Boolean(vaeInput.uniqueSeqs.length));
    const [ isParamValid, setIsParamValid ] = useState(Boolean(vaeInput.modelName));

    const dispatch = useDispatch();

    const handleBack: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        dispatch(setPseudoRoute('/'));
    }

    const setProgressId = async (sequences: string[], vae: File) => {
        const formData = new FormData();
        formData.append('state_dict', vae);
        formData.append('seqs', sequences.join(','));
        const res = await axios.post('/upload/batch-encode', formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            }
        });
        const { status, data } = res.data;
        if (status === "success") {
            console.log(sequences)
            console.log(status)
            console.log(data)
            const id: string = data.task_id;
            dispatch(setVaeProgress({
                id: id,
                state: 'IDLE',
                value: 0,
            }));
        }
    }

    const handleEncode: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        const isModified = (
            vaeInput.modelName !== modelName
            || vaeInput.targetLength !== targetLength
            || vaeInput.forwardAdapter !== forwardAdapter
            || vaeInput.reverseAdapter !== reverseAdapter
        )
        if (isModified) {
            const mask = uniqueSeqs.map((seq) => {
                return seq.startsWith(forwardAdapter) 
                    && seq.endsWith(reverseAdapter)
                    && seq.length > forwardAdapter.length + reverseAdapter.length;
            })
            dispatch(setVaeInput({
                modelName: modelName,
                targetLength: targetLength,
                forwardAdapter: forwardAdapter,
                reverseAdapter: reverseAdapter,
                uniqueSeqs: uniqueSeqs,
                duplicates: duplicates,
                adapterMask: mask,
            }))
            dispatch(setVaeNumbers({
                allEntries: duplicates.reduce((a, b) => a + b, 0),
                uniqueEntries: duplicates.length,
                uniqueEntriesWithAdapters: mask.reduce((a, b) => Number(a) + Number(b), 0)
            }))
            const randomRegions = uniqueSeqs.filter((seq, i) => mask[i]).map((seq) => {
                return seq.slice(
                    forwardAdapter.length, 
                    seq.length - reverseAdapter.length
                );
            });
            await setProgressId(randomRegions, vaeFile!);
        }
        dispatch(setPseudoRoute('/vae/encode'));
    }

    return (
        <>
            <FileUploader
                selexFile={selexFile}
                vaeFile={vaeFile}
                setSelexFile={setSelexFile}
                setVaeFile={setVaeFile}
                setSelexSequences={setUniqueSeqs}
                setSelexDuplicates={setDuplicates}
                setValid={setIsFileValid}
            />
            <ParamSelector
                selexSequences={uniqueSeqs}
                modelName={modelName}
                setModelName={setModelName}
                targetLength={targetLength}
                setTargetLength={setTargetLength}
                forwardAdapter={forwardAdapter}
                setForwardAdapter={setForwardAdapter}
                reverseAdapter={reverseAdapter}
                setReverseAdapter={setReverseAdapter}
                setValid={setIsParamValid}
            />
            <Button onClick={handleBack}>Back</Button>
            <Button onClick={handleEncode} disabled={!(isParamValid && isFileValid)}>Encode</Button>
        </>
    )
}

export default SidebarVaeHome