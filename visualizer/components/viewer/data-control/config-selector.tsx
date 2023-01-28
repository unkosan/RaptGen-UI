import React, { useState, useEffect, ChangeEvent } from 'react';
import { Form, Row, Col } from 'react-bootstrap';

type Props = {
    minCount: number;
    showGMM: boolean;
    showMeasuredData: boolean;
    setMinCount: React.Dispatch<React.SetStateAction<number>>;
    setShowGMM: React.Dispatch<React.SetStateAction<boolean>>;
    setShowMeasuredData: React.Dispatch<React.SetStateAction<boolean>>;
}

type MinCountProps = {
    minCount: number;
    setMinCount: React.Dispatch<React.SetStateAction<number>>;
}

const MinCountForm: React.FC<MinCountProps> = (props) => {
    const [ minCount, setMinCount ] = useState<number>(props.minCount);
    const [ minCountValid, setMinCountValid ] = useState<boolean>(true);

    const handleMinCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.currentTarget.value);
        setMinCount(value);

        const minCountValid = !isNaN(value) && value >= 1;
        setMinCountValid(minCountValid);
    }

    useEffect(() => {
        if (minCountValid) {
            props.setMinCount(minCount);
        }
    }, [minCount, minCountValid]);

    return (
        <Form.Group as={Row} className="mb-3">
            <Form.Label column>Minimum count</Form.Label>
            <Col>
                <Form.Control type="number" id="minCount" onChange={handleMinCountChange} value={minCount} isInvalid={!minCountValid}/>
                <Form.Control.Feedback type="invalid">Please enter a positive integer.</Form.Control.Feedback>
            </Col>
        </Form.Group>
    )
};

const ConfigSelector: React.FC<Props> = (props) => {
    return (
        <div>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column>Show GMM</Form.Label>
                <Col>
                    <Form.Switch
                        id="showGMM"
                        onChange={() => props.setShowGMM(!props.showGMM)}
                        checked={props.showGMM}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column>Show measured data</Form.Label>
                <Col>
                    <Form.Check type="switch" id="showMeasuredData" onChange={() => props.setShowMeasuredData(!props.showMeasuredData)} checked={props.showMeasuredData}/>
                </Col>
            </Form.Group>
            <MinCountForm minCount={props.minCount} setMinCount={props.setMinCount}/>
        </div>
    )
};

export default ConfigSelector;