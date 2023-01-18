import React, { useEffect } from 'react';
import axios from 'axios';
import { useState } from 'react';
import { Form } from 'react-bootstrap';

axios.defaults.baseURL = 'http://localhost:8000/dev';

type Props = {
    setNameVAE: React.Dispatch<React.SetStateAction<string>>;
    setNameGMM: React.Dispatch<React.SetStateAction<string>>;
    setNameMeasured: React.Dispatch<React.SetStateAction<string>>;
};

type NameList = {
    entries: string[];
}

// setState identity is stable, so I can use it in memo without worry
const DataSelect: React.FC<Props> = React.memo<Props>(({ setNameVAE, setNameGMM, setNameMeasured }) => {
    const [ internalNameVAE, setInternalNameVAE ] = useState<string>("");
    const [ internalNameGMM, setInternalNameGMM ] = useState<string>("");
    const [ internalNameMeasured, setInternalNameMeasured ] = useState<string>("");

    const [ nameListVAE, setNameListVAE ] = useState<string[]>([""]);
    const [ nameListGMM, setNameListGMM ] = useState<string[]>([""]);
    const [ nameListMeasured, setNameListMeasured ] = useState<string[]>([""]);

    const [ isError, setIsError ] = useState<boolean>(false);

    useEffect(() => {
        const fetchNameListVAE = async () => {
            try {
                const res = await axios.get('/sample/VAEmodels');
                const nameListVAE: NameList = res.data;
                setNameListVAE(nameListVAE.entries);
                if (nameListVAE.entries.length > 0) {
                    setInternalNameVAE(nameListVAE.entries[0])
                } else {
                    setInternalNameVAE("");
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
                    setInternalNameMeasured(nameListMeasured.entries[0]);
                } else {
                    setInternalNameMeasured("");
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
        if (internalNameVAE === "") {
            setNameListGMM([""]);
            return;
        }
        const fetchNameListGMM = async () => {
            try {
                const res = await axios.get('sample/GMMmodels', {
                    params: { VAE_name: internalNameVAE } 
                });
                const nameListGMM: NameList = res.data;
                setNameListGMM(nameListGMM.entries);
                if (nameListGMM.entries.length > 0) {
                    setInternalNameGMM(nameListGMM.entries[0]);
                } else {
                    setInternalNameGMM("");
                }
            } catch (error) {
                console.log(error);
                setIsError(true);
            }
        }
        fetchNameListGMM();
    }, [internalNameVAE]);

    useEffect(() => {
        setNameVAE(internalNameVAE);
    }, [internalNameVAE]);

    useEffect(() => {
        setNameGMM(internalNameGMM);
    }, [internalNameGMM]);

    useEffect(() => {
        setNameMeasured(internalNameMeasured);
    }, [internalNameMeasured]);

    return (
       <>
        <Form>
            <Form.Group className="mb-3">
                <Form.Label htmlFor="modelNameVAE">Selected VAE Model</Form.Label>
                <Form.Select id="modelNameVAE" value={internalNameVAE} onChange={(e) => setInternalNameVAE(e.currentTarget.value)}>
                    {nameListVAE.map((name) => <option>{name}</option>)}
                </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label htmlFor="modelNameGMM">Selected GMM Model</Form.Label>
                <Form.Select id="modelNameGMM" value={internalNameGMM} onChange={(e) => setInternalNameGMM(e.currentTarget.value)}>
                    {nameListGMM.map((name) => <option>{name}</option>)}
                </Form.Select>
                {/* <Form.Check type="switch" id="plotSwitchGMM" defaultChecked={false} label="draw GMM circles" /> */}
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label htmlFor="measuredDataName">Selected measured value data</Form.Label>
                <Form.Select id="measuredDataName" value={internalNameMeasured} onChange={(e) => setInternalNameMeasured(e.currentTarget.value)}>
                    {nameListMeasured.map((name) => <option>{name}</option>)}
                </Form.Select>
            </Form.Group>
        </Form>
       </> 
    )
})

export default DataSelect;