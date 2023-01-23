// Response types of backend api calls
type ResponseVaeModelNames = {
    status: 'success' | 'error';
    data: string[];
}

type ResponseGmmModelNames = {
    status: 'success' | 'error';
    data: string[];
}

type ResponseGmmModel = {
    status: 'success' | 'error';
    data: {
        weights: number[];
        means: number[][];
        covariances: number[][][];
    }
}

type ResponseSelexData = {
    status: 'success' | 'error';
    data: {
        Sequence: string[];
        Duplicates: number[];
        Without_Adapters: string[];
        coord_x: number[];
        coord_y: number[];
    }
}

type ResponseMeasuredDataNames = {
    status: 'success' | 'error';
    data: string[];
}

type ResponseMeasuredData = {
    status: 'success' | 'error';
    data: {
        hue: (string | number)[];
        ID: string[];
        Sequence: string[];
    }
}

type ResponseGmmModelParameters = {
    status: 'success' | 'error';
    data: {
        [key: string]: any;
    }
}

type ResponseVaeModelParameters = {
    status: 'success' | 'error';
    data: {
        [key: string]: any;
    }
}

// send types of backend api calls
type RequestVaeModelNames = {}

type RequestGmmModelNames = {
    VAE_model_name: string;
}

type RequestGmmModel = {
    VAE_model_name: string;
    GMM_model_name: string;
}

type RequestSelexData = {
    VAE_model_name: string;
}

type RequestMeasuredDataNames = {}

type RequestMeasuredData = {
    measured_data_name: string;
}

type RequestGmmModelParameters = {
    VAE_model_name: string;
    GMM_model_name: string;
}

type RequestVaeModelParameters = {
    VAE_model_name: string;
}

export type {
    ResponseVaeModelNames,
    ResponseGmmModelNames,
    ResponseGmmModel,
    ResponseSelexData,
    ResponseMeasuredDataNames,
    ResponseMeasuredData,
    ResponseGmmModelParameters,
    ResponseVaeModelParameters,

    RequestVaeModelNames,
    RequestGmmModelNames,
    RequestGmmModel,
    RequestSelexData,
    RequestMeasuredDataNames,
    RequestMeasuredData,
    RequestGmmModelParameters,
    RequestVaeModelParameters,
}