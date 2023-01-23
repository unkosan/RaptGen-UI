import React, { useState, useEffect } from 'react';
import { Nav } from 'react-bootstrap';
import axios from 'axios';
import { RootState } from '../redux/store';

import EncodePanel from './encode';
import DecodePanel from './decode';

import { VaeConfig } from '../redux/selex';
import { useSelector } from 'react-redux';

const OperatorControl: React.FC = () => {
    return (
        <div>
            <Nav variant="tabs" defaultActiveKey="encode-panel">
                <Nav.Item>
                    <Nav.Link eventKey="encode-panel">Encode</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="decode-panel">Decode</Nav.Link>
                </Nav.Item>
            </Nav>
            <Nav.Item>
                <Nav.Link eventKey="encode-panel">
                    <EncodePanel />
                </Nav.Link>
                <Nav.Link eventKey="decode-panel">
                    <DecodePanel />
                </Nav.Link>
            </Nav.Item>
        </div>
    );
}