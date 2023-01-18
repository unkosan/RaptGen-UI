import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";

type Props = {
    setMinCount: React.Dispatch<React.SetStateAction<number>>;
}

const MinCountForm: React.FC<Props> = ({ setMinCount }) => {

    const [ internalMinCount, setInternalMinCount ] = React.useState<number>(5);
    const [ minCountValid, setMinCountValid ] = React.useState<boolean>(true);

    const handleMinCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.currentTarget.value);

        const minCount = value;
        setInternalMinCount(minCount);

        const minCountValid = !isNaN(value) && value >= 1;
        setMinCountValid(minCountValid);
    }

    useEffect(() => {
        if (minCountValid) {
            setMinCount(internalMinCount);
        }
    }, [internalMinCount, minCountValid]);
    
    return (
        <Form.Group as={Row} className="mb-3">
            <Form.Label column>Minimum count</Form.Label>
            <Col>
                <Form.Control type="number" id="minCount" onChange={handleMinCountChange} value={internalMinCount} isInvalid={!minCountValid}/>
                <Form.Control.Feedback type="invalid">Please enter a positive integer.</Form.Control.Feedback>
            </Col>
        </Form.Group>
    )
}

export default MinCountForm;