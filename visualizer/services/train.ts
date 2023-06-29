import axios, { AxiosError } from "axios";

axios.defaults.baseURL = "http://localhost:8000/api";

// todo: validate request types with zod

// all API call wrapper functions receive a Param* and a Request* as input and return a ResponseCall<Response*>

// common return type for all wrapper functions for API calls
type ResponseCall<T> =
  | {
      success: true;
      data: T;
      errMsg: string;
    }
  | {
      success: false;
      data: null;
      errMsg: string;
    };

// API GET /train/device/process
type ParamGetDevices = void;
type RequestGetDevices = void;
type ResponseGetDevices = string[];

async function getDevices(): Promise<ResponseCall<ResponseGetDevices>> {
  let response: ResponseCall<ResponseGetDevices> =
    {} as ResponseCall<ResponseGetDevices>;
  await axios
    .get<ResponseGetDevices>("/train/device/process")
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });

  return response;
}

// API POST /train/jobs/submit
type ParamPostSubmit = void;
type RequestPostSubmit = {
  type: "RaptGen" | "RaptGen-freq" | "RaptGen-logfreq";
  name: string;
  params_preprocessing: {
    forward: string;
    reverse: string;
    random_region_length: number;
    tolerance: number;
    minimum_count: number;
  };
  random_regions: string[];
  duplicates: number[];
  reiteration: number;
  params_training: {
    [key: string]: string;
  };
};
type ResponsePostSubmit = void;

async function postSubmit(
  data: RequestPostSubmit
): Promise<ResponseCall<ResponsePostSubmit>> {
  let response: ResponseCall<ResponsePostSubmit> =
    {} as ResponseCall<ResponsePostSubmit>;
  await axios
    .post("/train/jobs/submit", data)
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// API GET /train/jobs/search
type ParamGetSearch = void;
type RequestGetSearch = {
  status?: ("success" | "failure" | "progress" | "pending" | "suspend")[];
  search_regex?: string;
  is_multiple?: boolean;
  type?: ("RaptGen" | "RaptGen-freq" | "RaptGen-logfreq")[];
};
type ResponseGetSearch = [
  {
    uuid: string;
    name: string;
    status: "success" | "failure" | "progress" | "pending" | "suspend";
    start: number;
    duration: number;
    reiteration: number;
    series: [
      {
        item_id: number;
        item_start: number;
        item_duration: number;
        item_status: "success" | "failure" | "progress" | "pending" | "suspend";
        item_epochs_total: number;
        item_epochs_current: number;
      }
    ];
  }
];

async function getSearch(
  data: RequestGetSearch
): Promise<ResponseCall<ResponseGetSearch>> {
  let response: ResponseCall<ResponseGetSearch> =
    {} as ResponseCall<ResponseGetSearch>;
  await axios
    .get<ResponseGetSearch>("/train/jobs/search", { params: data })
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// API GET /train/jobs/items/{uuid}?number={}
type ParamGetItem = {
  uuid: string;
  number: number | null;
};
type RequestGetItem = void;
type ResponseGetItem = {
  uuid: string;
  parent_name: string;
  parent_status: "success" | "failure" | "progress" | "pending" | "suspend";
  parent_start: number;
  parent_duration: number;
  parent_reiteration: number;
  params_training: {
    [key: string]: string;
  };

  item_id: number;
  item_start: number;
  item_duration: number;
  item_status: "success" | "failure" | "progress" | "pending" | "suspend";

  latent?: {
    random_regions: string[];
    coords_x: number[];
    oords_y: number[];
    duplicates: number[];
  };
  losses?: {
    train_loss: number[];
    test_loss: number[];
    test_recon: number[];
    test_kld: number[];
  };

  error_msg?: string;

  summary: {
    indices: number[];
    statuses: ("success" | "failure" | "progress" | "pending" | "suspend")[];
    epochs_finished: number[];
    minimum_neglog_ELBOs: number[];
  };
};

async function getItem(
  query: ParamGetItem
): Promise<ResponseCall<ResponseGetItem>> {
  let response: ResponseCall<ResponseGetItem> =
    {} as ResponseCall<ResponseGetItem>;
  if (query.uuid === "") {
    response = {
      success: false,
      data: null,
      errMsg: "uuid is not specified",
    };
    return response;
  }
  await axios
    .get<ResponseGetItem>(
      query.number === null
        ? `/train/jobs/items/${query.uuid}`
        : `/train/jobs/items/${query.uuid}?number=${query.number}`
    )
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      console.log(err);
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// API PATCH /train/jobs/items/{uuid}
type ParamPatchItem = {
  uuid: string;
};
type RequestPatchItem = [
  {
    target: "name";
    value: string;
  }
];
type ResponsePatchItem = void;

async function patchItem(
  query: ParamPatchItem,
  data: RequestPatchItem
): Promise<ResponseCall<ResponsePatchItem>> {
  let response: ResponseCall<ResponsePatchItem> =
    {} as ResponseCall<ResponsePatchItem>;
  await axios
    .patch<ResponsePatchItem>(`/train/jobs/items/${query.uuid}`, data)
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// API DELETE /train/jobs/items/{uuid}
type ParamDeleteItem = {
  uuid: string;
};
type RequestDeleteItem = void;
type ResponseDeleteItem = void;

async function deleteItem(
  query: ParamDeleteItem
): Promise<ResponseCall<ResponseDeleteItem>> {
  let response: ResponseCall<ResponseDeleteItem> =
    {} as ResponseCall<ResponseDeleteItem>;
  await axios
    .delete<ResponseDeleteItem>(`/train/jobs/items/${query.uuid}`)
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// API POST /train/jobs/kill
type ParamPostKill = void;
type RequestPostKill = {
  uuid: string;
};
type ResponsePostKill = void;

async function postKill(
  data: RequestPostKill
): Promise<ResponseCall<ResponsePostKill>> {
  let response: ResponseCall<ResponsePostKill> =
    {} as ResponseCall<ResponsePostKill>;
  await axios
    .post("/train/jobs/kill", data)
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// API POST /train/jobs/suspend
type ParamPostSuspend = void;
type RequestPostSuspend = {
  uuid: string;
};
type ResponsePostSuspend = void;

async function postSuspend(
  data: RequestPostSuspend
): Promise<ResponseCall<ResponsePostSuspend>> {
  let response: ResponseCall<ResponsePostSuspend> =
    {} as ResponseCall<ResponsePostSuspend>;
  await axios
    .post("/train/jobs/suspend", data)
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// API POST /train/jobs/resume
type ParamPostResume = void;
type RequestPostResume = {
  uuid: string;
};
type ResponsePostResume = void;

async function postResume(
  data: RequestPostResume
): Promise<ResponseCall<ResponsePostResume>> {
  let response: ResponseCall<ResponsePostResume> =
    {} as ResponseCall<ResponsePostResume>;
  await axios
    .post("/train/jobs/resume", data)
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// API POST /train/jobs/publish
type ParamPostPublish = void;
type RequestPostPublish = {
  uuid: string;
};
type ResponsePostPublish = void;

async function postPublish(
  data: RequestPostPublish
): Promise<ResponseCall<ResponsePostPublish>> {
  let response: ResponseCall<ResponsePostPublish> =
    {} as ResponseCall<ResponsePostPublish>;
  await axios
    .post("/train/jobs/publish", data)
    .then((res) => {
      response = {
        success: true,
        data: res.data,
        errMsg: "",
      };
    })
    .catch((err: AxiosError) => {
      response = {
        success: false,
        data: null,
        errMsg: err.message,
      };
    });
  return response;
}

// export all functions
export {
  getDevices,
  postSubmit,
  getSearch,
  getItem,
  patchItem,
  deleteItem,
  postKill,
  postSuspend,
  postResume,
  postPublish,
};

// export all request types
export type {
  ParamGetDevices,
  ParamPostSubmit,
  ParamGetSearch,
  ParamGetItem,
  ParamPatchItem,
  ParamDeleteItem,
  ParamPostKill,
  ParamPostSuspend,
  ParamPostResume,
  ParamPostPublish,
  RequestGetDevices,
  RequestPostSubmit,
  RequestGetSearch,
  RequestGetItem,
  RequestPatchItem,
  RequestDeleteItem,
  RequestPostKill,
  RequestPostSuspend,
  RequestPostResume,
  RequestPostPublish,
};
