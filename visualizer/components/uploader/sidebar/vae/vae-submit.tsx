import axios from 'axios';
import { NaN } from 'mathjs';
import React, { useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';

const SidebarVaeSubmit: React.FC = () => {
    const [uploadDate, setUploadDate] = React.useState<string>('');
    const [tolerance, setTolerance] = React.useState<number>(NaN);
    const [minCount, setMinCount] = React.useState<number>(NaN);
    const [epochs, setEpochs] = React.useState<number>(NaN);
    const [betaDuration, setBetaDuration] = React.useState<number>(NaN);
    const [matchForcingDuration, setMatchForcingDuration] = React.useState<number>(NaN);
    const [matchCost, setMatchCost] = React.useState<number>(NaN);
    const [earlyStopDuration, setEarlyStopDuration] = React.useState<number>(NaN);
    const [seedValue, setSeedValue] = React.useState<number>(NaN);
    const [numberWorkers, setNumberWorkers] = React.useState<number>(NaN);
    const [pinned, setPinned] = React.useState<boolean | null>(null);

    const [isValidDate, setIsValidDate] = React.useState<boolean>(true);
    const [isValidTolerance, setIsValidTolerance] = React.useState<boolean>(true);
    const [isValidMinCount, setIsValidMinCount] = React.useState<boolean>(true);
    const [isValidEpochs, setIsValidEpochs] = React.useState<boolean>(true);
    const [isValidBetaDuration, setIsValidBetaDuration] = React.useState<boolean>(true);
    const [isValidMatchForcingDuration, setIsValidMatchForcingDuration] = React.useState<boolean>(true);
    const [isValidMatchCost, setIsValidMatchCost] = React.useState<boolean>(true);
    const [isValidEarlyStopDuration, setIsValidEarlyStopDuration] = React.useState<boolean>(true);
    const [isValidSeedValue, setIsValidSeedValue] = React.useState<boolean>(true);
    const [isValidNumberWorkers, setIsValidNumberWorkers] = React.useState<boolean>(true);

    const [isValidSubmit, setIsValidSubmit] = React.useState<boolean>(false);

    useEffect(() => {
         setIsValidSubmit(
            isValidDate
            && isValidTolerance
            && isValidMinCount
            && isValidEpochs 
            && isValidBetaDuration 
            && isValidMatchForcingDuration 
            && isValidMatchCost 
            && isValidEarlyStopDuration 
            && isValidSeedValue 
            && isValidNumberWorkers
        ) 
    })

    return (
        <>
        <legend>Setup Training Params</legend>
        <p>
            All of the params below is not required for uploading.
        </p>
        <Form>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="upload">Date of Upload</Form.Label>
                <Form.Control
                    type="text"
                    id="upload"
                    placeholder="YYYY-MM-DD"
                    value={uploadDate}
                    onChange={(event) => {
                        setUploadDate(event.target.value);
                        setIsValidDate(
                            event.target.value.length === 0
                            || /^\d{4}-\d{2}-\d{2}$/.test(event.target.value)
                        )
                    }}
                    isInvalid={!isValidDate}
                />
                <Form.Control.Feedback type="invalid">Only "XXXX-XX-XX" is allowed</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="tolerance">Filtering Tolerance</Form.Label>
                <Form.Control
                    type="number"
                    id="tolerance"
                    placeholder="Acceptable margin of length when filtering"
                    value={tolerance}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setTolerance(NaN);
                            setIsValidTolerance(true);
                        } else if (value < 0) {
                            setTolerance(value);
                            setIsValidTolerance(false);
                        } else {
                            setTolerance(value);
                            setIsValidTolerance(true);
                        }
                    }}
                    isInvalid={!isValidTolerance}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="min-count">Minimum Count</Form.Label>
                <Form.Control
                    type="number"
                    id="min-count"
                    placeholder="Allowable minimum count of sequences"
                    value={minCount}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setMinCount(NaN);
                            setIsValidMinCount(true);
                        } else if (value <= 0) {
                            setMinCount(value);
                            setIsValidMinCount(false);
                        } else {
                            setMinCount(value);
                            setIsValidMinCount(true);
                        }
                    }}
                    isInvalid={!isValidMinCount}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="epochs">Epochs</Form.Label>
                <Form.Control
                    type="number"
                    id="epochs"
                    placeholder="Maximum epochs"
                    value={epochs}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setEpochs(NaN);
                            setIsValidEpochs(true);
                        } else if (value <= 0) {
                            setEpochs(value);
                            setIsValidEpochs(false);
                        } else {
                            setEpochs(value);
                            setIsValidEpochs(true);
                        }
                    }}
                    isInvalid={!isValidEpochs}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="beta-duration">Beta Weighting Duration</Form.Label>
                <Form.Control
                    type="number"
                    id="beta-duration"
                    placeholder="Duration of epochs with beta weighting"
                    value={betaDuration}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setBetaDuration(NaN);
                            setIsValidBetaDuration(true);
                        } else if (value <= 0) {
                            setBetaDuration(value);
                            setIsValidBetaDuration(false);
                        } else {
                            setBetaDuration(value);
                            setIsValidBetaDuration(true);
                        }
                    }}
                    isInvalid={!isValidBetaDuration}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="match-forcing-duration">Match Forcing Duration</Form.Label>
                <Form.Control
                    type="number"
                    id="match-forcing-duration"
                    placeholder="Duration of epochs with match-forcing"
                    value={matchForcingDuration}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setMatchForcingDuration(NaN);
                            setIsValidMatchForcingDuration(true);
                        } else if (value <= 0) {
                            setMatchForcingDuration(value);
                            setIsValidMatchForcingDuration(false);
                        } else {
                            setMatchForcingDuration(value);
                            setIsValidMatchForcingDuration(true);
                        }
                    }}
                    isInvalid={!isValidMatchForcingDuration}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="match-forcing-cost">Match Forcing Cost</Form.Label>
                <Form.Control
                    type="number"
                    id="match-forcing-cost"
                    placeholder="Cost (or strength) of match-forcing"
                    value={matchCost}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setMatchCost(NaN);
                            setIsValidMatchCost(true);
                        } else if (value < 0) {
                            setMatchCost(value);
                            setIsValidMatchCost(false);
                        } else {
                            setMatchCost(value);
                            setIsValidMatchCost(true);
                        }
                    }}
                    isInvalid={!isValidMatchCost}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="early-stopping">Early Stopping Patience</Form.Label>
                <Form.Control
                    type="number"
                    id="early-stopping"
                    placeholder="Epochs to wait before early stopping"
                    value={earlyStopDuration}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setEarlyStopDuration(NaN);
                            setIsValidEarlyStopDuration(true);
                        } else if (value <= 0) {
                            setEarlyStopDuration(value);
                            setIsValidEarlyStopDuration(false);
                        } else {
                            setEarlyStopDuration(value);
                            setIsValidEarlyStopDuration(true);
                        }
                    }}
                    isInvalid={!isValidEarlyStopDuration}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="seed-value">Seed Value</Form.Label>
                <Form.Control
                    type="number"
                    id="seed-value"
                    placeholder="Random seed value"
                    value={seedValue}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setSeedValue(NaN);
                            setIsValidSeedValue(true);
                        } else {
                            setSeedValue(value);
                            setIsValidSeedValue(true);
                        }
                    }}
                    isInvalid={!isValidSeedValue}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="worker-number">CUDA Number of Workers</Form.Label>
                <Form.Control
                    type="number"
                    id="worker-number"
                    placeholder="The number of workers to use for pytorch"
                    value={numberWorkers}
                    onChange={(event) => {
                        const value = parseInt(event.target.value);
                        if (isNaN(value)) {
                            setNumberWorkers(NaN);
                            setIsValidNumberWorkers(true);
                        } else if (value <= 0) {
                            setNumberWorkers(value);
                            setIsValidNumberWorkers(false);
                        } else {
                            setNumberWorkers(value);
                            setIsValidNumberWorkers(true);
                        }
                    }}
                    isInvalid={!isValidNumberWorkers}
                />
                <Form.Control.Feedback type="invalid">Invalid</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className='mb-3'>
                <Form.Label htmlFor="flag-pin">CUDA Memory Pinned</Form.Label>
                <Form.Select
                    id="flag-pin"
                    defaultValue=""
                    onChange={(event) => {
                        const value = event.target.value;
                        if (value === "true") {
                            setPinned(true);
                        } else if (value === "false") {
                            setPinned(false);
                        } else {
                            setPinned(null);
                        }
                    }}
                >
                    <option value="">Undefined</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </Form.Select>
            </Form.Group>
        </Form>
        <Button
            disabled={!isValidSubmit}
            onClick={() => {
                if (isValidSubmit) {
    // const [uploadDate, setUploadDate] = React.useState<string>('');
    // const [tolerance, setTolerance] = React.useState<number>(NaN);
    // const [minCount, setMinCount] = React.useState<number>(NaN);
    // const [epochs, setEpochs] = React.useState<number>(NaN);
    // const [betaDuration, setBetaDuration] = React.useState<number>(NaN);
    // const [matchForcingDuration, setMatchForcingDuration] = React.useState<number>(NaN);
    // const [matchCost, setMatchCost] = React.useState<number>(NaN);
    // const [earlyStopDuration, setEarlyStopDuration] = React.useState<number>(NaN);
    // const [seedValue, setSeedValue] = React.useState<number>(NaN);
    // const [numberWorkers, setNumberWorkers] = React.useState<number>(NaN);
    // const [pinned, setPinned] = React.useState<boolean | null>(null);
                    const data = {
                        "date": uploadDate,
                        "tolerance": tolerance,
                        "min_count": minCount,
                        "epochs": epochs,
                        "beta_duration": betaDuration,
                        "match_forcing_duration": matchForcingDuration,
                        "match_cost": matchCost,
                        "early_stop_duration": earlyStopDuration,
                        "seed_value": seedValue,
                        "number_workers": numberWorkers,
                        "pinned": pinned,
                    }
                    console.log(data);
                }
            }}
        >SUBMIT</Button>
        </>
    )
}

export default SidebarVaeSubmit;