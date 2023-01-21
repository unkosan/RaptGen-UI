import React, { useState, useEffect } from 'react';
import { Form, Row, Col } from 'react-bootstrap';

type Props = {
    minCount: number;
    setMinCount: React.Dispatch<React.SetStateAction<number>>;
    setShowGMM: React.Dispatch<React.SetStateAction<boolean>>;
    setShowMeasuredData: React.Dispatch<React.SetStateAction<boolean>>;
}

type MinCountProps = {
    minCount: number;
    setMinCount: React.Dispatch<React.SetStateAction<number>>;
}

const MinCountForm: React.FC<MinCountProps> = React.memo<MinCountProps>((props) => {
    const [ minCount, setMinCount ] = useState<number>(props.minCount);
    const [ minCountValid, setMinCountValid ] = useState<boolean>(true);

    const handleMinCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.currentTarget.value);

        const minCount = value;
        setMinCount(minCount);

        const minCountValid = !isNaN(value) && value >= 1;
        setMinCountValid(minCountValid);
    }

    useEffect(() => {
        if (minCountValid) {
            props.setMinCount(minCount);
        }
    }
    , [minCount, minCountValid]);

    return (
        <Form.Group as={Row} className="mb-3">
            <Form.Label column>Minimum count</Form.Label>
            <Col>
                <Form.Control type="number" id="minCount" onChange={handleMinCountChange} value={minCount} isInvalid={!minCountValid}/>
                <Form.Control.Feedback type="invalid">Please enter a positive integer.</Form.Control.Feedback>
            </Col>
        </Form.Group>
    )
});

const ConfigSelector: React.FC<Props> = React.memo<Props>((props) => {
    const [ showGMM, setShowGMM ] = useState<boolean>(true);
    const [ showMeasuredData, setShowMeasuredData ] = useState<boolean>(true);
    const [ minCount, setMinCount ] = useState<number>(props.minCount);

    useEffect(() => {
        props.setShowGMM(showGMM);
        props.setShowMeasuredData(showMeasuredData);
        props.setMinCount(minCount);
    }, [showGMM, showMeasuredData, minCount]);

    return (
        <div>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column>Show GMM</Form.Label>
                <Col>
                    <Form.Check type="switch" id="showGMM" onChange={() => setShowGMM(!showGMM)} checked={showGMM}/>
                </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column>Show measured data</Form.Label>
                <Col>
                    <Form.Check type="switch" id="showMeasuredData" onChange={() => setShowMeasuredData(!showMeasuredData)} checked={showMeasuredData}/>
                </Col>
            </Form.Group>
            <MinCountForm minCount={minCount} setMinCount={setMinCount}/>
        </div>
    )
});

export default ConfigSelector;