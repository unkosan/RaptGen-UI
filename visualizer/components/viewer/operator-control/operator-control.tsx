import React, { useState, useEffect } from 'react';
import { Nav, Tab, Tabs } from 'react-bootstrap';
import axios from 'axios';
import { RootState } from '../redux/store';

import EncodePanel from './encode';
import DecodePanel from './decode';

import { VaeConfig } from '../redux/selex';
import { useSelector } from 'react-redux';

const OperatorControl: React.FC = () => {
    return (
        <Tabs
            defaultActiveKey="encodePanel"
            id="operatorControl"
            className="mb-3"
        >
            <Tab eventKey="encodePanel" title="Encode">
                <EncodePanel />
            </Tab>
            <Tab eventKey="decodePanel" title="Decode">
                <DecodePanel />
            </Tab>
        </Tabs>
    );
}

export default OperatorControl;