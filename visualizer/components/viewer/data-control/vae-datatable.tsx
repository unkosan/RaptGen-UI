import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import { ResponseVaeModelParameters } from '../../../types/api-interface/data';

type Props = {
    nameVAE: string;
}

const VaeParamsTable: React.FC<Props> = React.memo<Props>((props) => {
    const [ paramsList, setParamsList ] = useState<{[keys: string]: string}>({} as {[keys: string]: string});

    useEffect(() => {
        const fetchParamsList = async () => {
            try {
                if (props.nameVAE === "") {
                    setParamsList({} as {[keys: string]: string});
                    return;
                }
                const res = await axios.get<ResponseVaeModelParameters>('/data/VAE-model-parameters', {
                    params: {VAE_model_name: props.nameVAE }
                });
                const resParamsList = res.data;
                if (resParamsList.status === 'success') {
                    let paramsList = { ...resParamsList.data }
                    for (const key in paramsList) {
                        paramsList[key] = paramsList[key].toString();
                    }
                    setParamsList(paramsList);
                }
            } catch (error) {
                alert(error);
            }
        };
        fetchParamsList();
    }, [props.nameVAE]);

    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
                {Object.keys(paramsList).map((key) => (
                    <tr key={key}>
                        <td>{key}</td>
                        <td>{paramsList[key]}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
});

export default VaeParamsTable;