type ResponseSessionStart = {
    status: 'success' | 'error';
    data: number;
}

type ResponseSessionEnd = {
    status: 'success' | 'error';
}

type ResponseEncode = {
    status: 'success' | 'error';
    data: [{
        coord_x: number;
        coord_y: number;
    }]
}

type ResponseDecode = {
    status: 'success' | 'error';
    data: string[];
}

type ResponseSessionStatus = {
    status: 'success' | 'error';
    data: number[];
}

type RequestSessionStart = {
    VAE_name: string;
}

type RequestSessionEnd = {
    session_id: number;
}

type RequestEncode = {
    session_id: number;
    sequences: string[];
}

type RequestDecode = {
    session_id: number;
    coords: [{
        coord_x: number;
        coord_y: number;
    }]
}

type RequestWeblogo = {
    session_id: number;
    coords: [{
        coord_x: number;
        coord_y: number;
    }]
}

type RequestSessionStatus = {}

export type {
    ResponseSessionStart,
    ResponseSessionEnd,
    ResponseEncode,
    ResponseDecode,
    ResponseSessionStatus,

    RequestSessionStart,
    RequestSessionEnd,
    RequestEncode,
    RequestDecode,
    RequestSessionStatus,

    RequestWeblogo,
}