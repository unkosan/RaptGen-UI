import { z } from "zod";
import axios, { AxiosError } from "axios";

axios.defaults.baseURL = "http://localhost:8000/api";

// camelCase for zod schema
// CamelCase for TypeScript type

// common return type for all wrapper functions for API calls
// success means the client got a OK response from the server
// valid means the client sent a valid request to the server and the server responded with a valid response
type ResponseCall<T> =
  | {
      success: true;
      valid: boolean;
      data: T;
    }
  | {
      success: false;
      valid: true;
      errMsg: string;
    }
  | {
      success: false;
      valid: false;
    };

// wrapper function for API calls
async function getResult<Param, Request, Response>(
  url: string,
  param: Param,
  request: Request,
  paramZod: z.ZodType<Param>,
  requestZod: z.ZodType<Request>,
  responseZod: z.ZodType<Response>
): Promise<ResponseCall<Response>> {
  let result: ResponseCall<Response> = {
    success: false,
    valid: false,
  };

  if (
    !requestZod.safeParse(request).success ||
    !paramZod.safeParse(param).success
  ) {
    result = {
      success: false,
      valid: false,
    };
    return result;
  }
  await axios
    .get<Response>(url, { params: request })
    .then((res) => {
      result = {
        success: true,
        valid: responseZod.safeParse(res.data).success,
        data: res.data,
      };
    })
    .catch((err) => {
      result = {
        success: false,
        valid: !!err.isAxiosError,
        errMsg: err.message,
      };
    });
  return result;
}

async function postResult<Param, Request, Response>(
  url: string,
  param: Param,
  request: Request,
  paramZod: z.ZodType<Param>,
  requestZod: z.ZodType<Request>,
  responseZod: z.ZodType<Response>
): Promise<ResponseCall<Response>> {
  let result: ResponseCall<Response> = {
    success: false,
    valid: false,
  };
  if (
    !requestZod.safeParse(request).success ||
    !paramZod.safeParse(param).success
  ) {
    result = {
      success: false,
      valid: false,
    };
    return result;
  }
  await axios
    .post<Response>(url, request)
    .then((res) => {
      result = {
        success: true,
        valid: responseZod.safeParse(res.data).success,
        data: res.data,
      };
    })
    .catch((err) => {
      result = {
        success: false,
        valid: !!err.isAxiosError,
        errMsg: err.message,
      };
    });
  return result;
}

async function deleteResult<Param, Request, Response>(
  url: string,
  param: Param,
  request: Request,
  paramZod: z.ZodType<Param>,
  requestZod: z.ZodType<Request>,
  responseZod: z.ZodType<Response>
): Promise<ResponseCall<Response>> {
  let result: ResponseCall<Response> = {
    success: false,
    valid: false,
  };
  if (
    !requestZod.safeParse(request).success ||
    !paramZod.safeParse(param).success
  ) {
    result = {
      success: false,
      valid: false,
    };
    return result;
  }
  await axios
    .delete<Response>(url, { params: request })
    .then((res) => {
      result = {
        success: true,
        valid: responseZod.safeParse(res.data).success,
        data: res.data,
      };
    })
    .catch((err) => {
      result = {
        success: false,
        valid: !!err.isAxiosError,
        errMsg: err.message,
      };
    });
  return result;
}

// API GET /train/device/process
const paramGetDevices = z.void();
const requestGetDevices = z.void();
const responseGetDevices = z.array(z.string());
type ParamGetDevices = z.infer<typeof paramGetDevices>;
type RequestGetDevices = z.infer<typeof requestGetDevices>;
type ResponseGetDevices = z.infer<typeof responseGetDevices>;

export async function getDevices(): Promise<ResponseCall<ResponseGetDevices>> {
  return await getResult<
    ParamGetDevices,
    RequestGetDevices,
    ResponseGetDevices
  >(
    "/train/device/process",
    undefined,
    undefined,
    paramGetDevices,
    requestGetDevices,
    responseGetDevices
  );
}

// API POST /train/jobs/submit
const paramSubmitJob = z.void();
const requestSubmitJob = z.object({
  type: z.enum(["RaptGen", "RaptGen-freq", "RaptGen-logfreq"]),
  name: z.string(),
  params_preprocessing: z.object({
    // forward has to be a valid RNA or DNA sequence
    forward: z.string().regex(/^[ACGUT]*$/),
    reverse: z.string().regex(/^[ACGUT]*$/),
    random_region_length: z.number().int().min(1),
    tolerance: z.number().int().min(0),
    minimum_count: z.number().int().min(1),
  }),
  random_regions: z.array(z.string().regex(/^[ACGUT]*$/)),
  duplicates: z.array(z.number().int().min(1)),
  reiteration: z.number().int().min(1),
  params_training: z.record(z.string(), z.any()),
});
// return type needs to be null rather than void
const responseSubmitJob = z.null();
type ParamSubmitJob = z.infer<typeof paramSubmitJob>;
type RequestSubmitJob = z.infer<typeof requestSubmitJob>;
type ResponseSubmitJob = z.infer<typeof responseSubmitJob>;

export async function postSubmitJob(
  data: RequestSubmitJob
): Promise<ResponseCall<ResponseSubmitJob>> {
  return await postResult<ParamSubmitJob, RequestSubmitJob, ResponseSubmitJob>(
    "/train/jobs/submit",
    undefined,
    data,
    paramSubmitJob,
    requestSubmitJob,
    responseSubmitJob
  );
}

// API GET /train/jobs/search
const paramGetSearch = z.void();
const requestGetSearch = z.object({
  status: z.optional(
    z.array(z.enum(["success", "failure", "progress", "pending", "suspend"]))
  ),
  search_regex: z.optional(z.string()),
  is_multiple: z.optional(z.boolean()),
  type: z.optional(
    z.array(z.enum(["RaptGen", "RaptGen-freq", "RaptGen-logfreq"]))
  ),
});
const responseGetSearch = z.array(
  z.object({
    uuid: z.string().uuid(),
    name: z.string().nonempty(),
    status: z.enum(["success", "failure", "progress", "pending", "suspend"]),
    start: z.number().int().min(0),
    duration: z.number().int().min(0),
    reiteration: z.number().int().min(1),
    series: z.array(
      z.object({
        item_id: z.number().int().min(0),
        item_start: z.number().int().min(0),
        item_duration: z.number().int().min(0),
        item_status: z.enum([
          "success",
          "failure",
          "progress",
          "pending",
          "suspend",
        ]),
        item_epochs_total: z.number().int().min(0),
        item_epochs_current: z.number().int().min(0),
      })
    ),
  })
);
type ParamGetSearch = z.infer<typeof paramGetSearch>;
type RequestGetSearch = z.infer<typeof requestGetSearch>;
type ResponseGetSearch = z.infer<typeof responseGetSearch>;

export async function getSearchJobs(
  data: RequestGetSearch
): Promise<ResponseCall<ResponseGetSearch>> {
  return await getResult<ParamGetSearch, RequestGetSearch, ResponseGetSearch>(
    "/train/jobs/search",
    undefined,
    data,
    paramGetSearch,
    requestGetSearch,
    responseGetSearch
  );
}

// API
