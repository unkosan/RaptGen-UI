import axios, { AxiosResponse } from 'axios';
import React, { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { 
    RequestVaeModelNames, 
    RequestGmmModelNames,
    RequestMeasuredDataNames,
    ResponseVaeModelNames,
    ResponseGmmModelNames,
    ResponseMeasuredDataNames,
} from '../../../types/api-interface/data';

axios.defaults.baseURL = 'http://localhost:8000/api';

type Props = {
    setNameVAE: React.Dispatch<React.SetStateAction<string>>;
    setNameGMM: React.Dispatch<React.SetStateAction<string>>;
    setNameMeasured: React.Dispatch<React.SetStateAction<string>>;
}

const DataSelector: React.FC<Props> = React.memo<Props>((props) => {
    const [ nameVAE, setNameVAE ] = useState<string>("");
    const [ nameGMM, setNameGMM ] = useState<string>("");
    const [ nameMeasured, setNameMeasured ] = useState<string>("");

    const [ nameListVAE, setNameListVAE ] = useState<string[]>([""]);
    const [ nameListGMM, setNameListGMM ] = useState<string[]>([""]);
    const [ nameListMeasured, setNameListMeasured ] = useState<string[]>([""]);

    useEffect(() => {
        const fetchNameListVAE = async () => {
            try {
                const res = await axios.get<ResponseVaeModelNames>('/data/VAE-model-names');
                const resNameListVAE = res.data;
                if (resNameListVAE.status === 'success') {
                    setNameListVAE(resNameListVAE.data);
                    if (resNameListVAE.data.length > 0) {
                        setNameVAE(resNameListVAE.data[0]);
                    } else {
                        setNameVAE("");
                    }
                }
            } catch (error) {
                alert(error);
            }
        };
        const fetchNameListMeasured = async () => {
            try {
                const res = await axios.get<ResponseMeasuredDataNames>('/data/measured-data-names');
                const resNameListMeasured = res.data;
                if (resNameListMeasured.status === 'success') {
                    setNameListMeasured(resNameListMeasured.data);
                    if (resNameListMeasured.data.length > 0) {
                        setNameMeasured(resNameListMeasured.data[0]);
                    } else {
                        setNameMeasured("");
                    }
                }
            } catch (error) {
                alert(error);
            }
        }
        fetchNameListVAE()
        fetchNameListMeasured()
    }, []);

    useEffect(() => {
        const fetchNameListGMM = async () => {
            try {
                const res = await axios.get<ResponseGmmModelNames>('/data/GMM-model-names', {
                    params: {
                        VAE_model_name: nameVAE,
                    }
                });
                const resNameListGMM = res.data;
                if (resNameListGMM.status === 'success') {
                    setNameListGMM(resNameListGMM.data);
                    if (resNameListGMM.data.length > 0) {
                        setNameGMM(resNameListGMM.data[0]);
                    } else {
                        setNameGMM("");
                    }
                }
            } catch (error) {
                alert(error);
            }
        }
        fetchNameListGMM();
    }, [nameVAE]);

    useEffect(() => {
        props.setNameVAE(nameVAE);
    }, [nameVAE]);

    useEffect(() => {
        props.setNameGMM(nameGMM);
    }, [nameGMM]);

    useEffect(() => {
        props.setNameMeasured(nameMeasured);
    }, [nameMeasured]);

    return (
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
    )
});

export default DataSelector;