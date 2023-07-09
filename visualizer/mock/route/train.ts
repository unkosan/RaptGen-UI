import { rest } from "msw";
import { selex } from "./selex";
import { loss } from "./loss";
import { z } from "zod";
import * as trainZod from "../../services/api-client";

export const mockURL = (path: string) => {
  return `http://localhost:3000/api${path}`;
};

const uuids = {
  test1: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
  test2: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4bee5d",
  test3: "1951e0e0-5b1e-4b1e-8b1e-0a88a4b1e8b1",
  test4: "18b1e0e0-5b1e-4b1e-8b1e-1111e4b1e8b1",
  test5: "682052e0-44b2-4b1e-8b1e-0e5b1e4b1e8b",
  test6: "2526e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
  test7: "4728e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
  test8: "11f8dde2-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
  test9: "528511dd-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
  test10: "5b1ff0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
};

const latent = {
  random_regions: selex.map((d) => d.sequence),
  coords_x: selex.map((d) => d.x),
  coords_y: selex.map((d) => d.y),
  duplicates: selex.map((d) => d.duplicate),
};

const params = {
  epochs: 1000,
  beta_epochs: 100,
  early_stopping: 100,
  force_matching_epochs: 100,
};

const errorMsg = {
  loc: [],
  msg: "field not valid",
  type: "value_error.invalid_type",
};

export const trainHandlers = [
  rest.get(mockURL(""), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: "hello" }));
  }),

  rest.get(mockURL("/train/device/process"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(["cpu", "cuda:0", "cuda:1", "cuda:2", "cuda:3"])
    );
  }),

  rest.post(mockURL("/train/jobs/submit"), async (req, res, ctx) => {
    if (trainZod.requestPostSubmitJob.safeParse(await req.json())) {
      return res(ctx.status(200), ctx.json(null));
    } else {
      return res(ctx.status(422), ctx.json(errorMsg));
    }
  }),

  rest.post(mockURL("/train/jobs/search"), async (req, res, ctx) => {
    const q = await req.json();
    if (!trainZod.requestPostSearchJobs.safeParse(q)) {
      return await res(ctx.status(422), ctx.json(errorMsg));
    }

    let data = [
      {
        uuid: uuids.test1,
        name: "test1",
        type: "RaptGen",
        status: "progress",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 12000,
            item_status: "failure",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
          {
            item_id: 1,
            item_start: 1620012000,
            item_duration: 12000,
            item_status: "success",
            item_epochs_total: 1000,
            item_epochs_current: 526,
          },
          {
            item_id: 2,
            item_start: 1620024000,
            item_duration: 12000,
            item_status: "progress",
            item_epochs_total: 1000,
            item_epochs_current: 400,
          },
        ],
      },
      {
        uuid: uuids.test2,
        name: "test2",
        type: "RaptGen",
        status: "progress",
        // start and duration are in unix timestamp
        start: 1620000500,
        duration: 36000,
        reiteration: 1,
        series: [
          {
            item_id: 0,
            item_start: 1620000500,
            item_duration: 12000,
            item_status: "progress",
            item_epochs_total: 1000,
            item_epochs_current: 700,
          },
        ],
      },
      {
        uuid: uuids.test3,
        name: "test3",
        type: "RaptGen",
        status: "pending",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 12000,
            item_status: "pending",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
          {
            item_id: 1,
            item_start: 1620012000,
            item_duration: 12000,
            item_status: "pending",
            item_epochs_total: 1000,
            item_epochs_current: 526,
          },
          {
            item_id: 2,
            item_start: 1620024000,
            item_duration: 12000,
            item_status: "pending",
            item_epochs_total: 1000,
            item_epochs_current: 400,
          },
        ],
      },
      {
        uuid: uuids.test4,
        name: "test4",
        type: "RaptGen",
        status: "pending",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 1000,
        reiteration: 1,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 1000,
            item_status: "pending",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
        ],
      },
      {
        uuid: uuids.test5,
        name: "test5",
        type: "RaptGen",
        status: "success",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 12000,
            item_status: "failure",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
          {
            item_id: 1,
            item_start: 1620012000,
            item_duration: 12000,
            item_status: "success",
            item_epochs_total: 1000,
            item_epochs_current: 526,
          },
          {
            item_id: 2,
            item_start: 1620024000,
            item_duration: 12000,
            item_status: "failure",
            item_epochs_total: 1000,
            item_epochs_current: 400,
          },
        ],
      },
      {
        uuid: uuids.test6,
        name: "test6",
        type: "RaptGen",
        status: "success",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 1000,
        reiteration: 1,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 1000,
            item_status: "success",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
        ],
      },
      {
        uuid: uuids.test7,
        name: "test7",
        type: "RaptGen",
        status: "failure",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 12000,
            item_status: "failure",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
          {
            item_id: 1,
            item_start: 1620012000,
            item_duration: 12000,
            item_status: "failure",
            item_epochs_total: 1000,
            item_epochs_current: 526,
          },
          {
            item_id: 2,
            item_start: 1620024000,
            item_duration: 12000,
            item_status: "failure",
            item_epochs_total: 1000,
            item_epochs_current: 400,
          },
        ],
      },
      {
        uuid: uuids.test8,
        name: "test8",
        type: "RaptGen",
        status: "failure",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 1000,
        reiteration: 1,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 1000,
            item_status: "failure",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
        ],
      },
      {
        uuid: uuids.test9,
        name: "test9",
        type: "RaptGen",
        status: "suspend",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 12000,
            item_status: "success",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
          {
            item_id: 1,
            item_start: 1620012000,
            item_duration: 12000,
            item_status: "failure",
            item_epochs_total: 1000,
            item_epochs_current: 526,
          },
          {
            item_id: 2,
            item_start: 1620024000,
            item_duration: 12000,
            item_status: "suspend",
            item_epochs_total: 1000,
            item_epochs_current: 400,
          },
        ],
      },
      {
        uuid: uuids.test10,
        name: "test10",
        type: "RaptGen",
        status: "suspend",
        // start and duration are in unix timestamp
        start: 1620000000,
        duration: 1000,
        reiteration: 1,
        series: [
          {
            item_id: 0,
            item_start: 1620000000,
            item_duration: 1000,
            item_status: "suspend",
            item_epochs_total: 1000,
            item_epochs_current: 100,
          },
        ],
      },
    ] as z.infer<typeof trainZod.responsePostSearchJobs>;

    const { status, search_regex, is_multiple, type } = q as z.infer<
      typeof trainZod.requestPostSearchJobs
    >;

    if (status) {
      data = data.filter((d) => status.includes(d.status));
    }
    if (search_regex) {
      data = data.filter((d) => RegExp(search_regex).test(d.name));
    }
    if (is_multiple) {
      data = data.filter((d) => d.reiteration > 1);
    }
    if (type) {
      data = data.filter((d) => type.includes(d.type));
    }

    return await res(ctx.status(200), ctx.json(data));
  }),

  rest.get(mockURL("/train/jobs/items/:parent_uuid"), (req, res, ctx) => {
    const { parent_uuid } = req.params;
    const params = {
      parent_uuid: parent_uuid,
    };
    const zod = z.object({
      parent_uuid: z.string().uuid(),
    });
    if (!zod.safeParse(params)) {
      return res(ctx.status(422), ctx.json(errorMsg));
    }

    let data = [
      {
        uuid: uuids.test1,
        name: "test1",
        type: "RaptGen",
        status: "progress",
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        params_training: params,
        summary: {
          indices: [0, 1, 2],
          statuses: ["success", "failure", "progress"],
          epochs_finished: [100, 526, 400],
          minimum_NLLs: [0.3, 0.2, 0.1],
        },
      },
      {
        uuid: uuids.test2,
        name: "test2",
        type: "RaptGen",
        status: "progress",
        start: 1620000500,
        duration: 36000,
        reiteration: 1,
        params_training: params,
        summary: {
          indices: [0],
          statuses: ["progress"],
          epochs_finished: [700],
          minimum_NLLs: [0.3],
        },
      },
      {
        uuid: uuids.test3,
        name: "test3",
        type: "RaptGen",
        status: "pending",
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        params_training: params,
        summary: {
          indices: [0, 1, 2],
          statuses: ["pending", "pending", "pending"],
          epochs_finished: [100, 526, 400],
          minimum_NLLs: [NaN, NaN, NaN],
        },
      },
      {
        uuid: uuids.test4,
        name: "test4",
        type: "RaptGen",
        status: "pending",
        start: 1620000000,
        duration: 1000,
        reiteration: 1,
        params_training: params,
        summary: {
          indices: [0],
          statuses: ["pending"],
          epochs_finished: [100],
          minimum_NLLs: [NaN],
        },
      },
      {
        uuid: uuids.test5,
        name: "test5",
        type: "RaptGen",
        status: "success",
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        params_training: params,
        summary: {
          indices: [0, 1, 2],
          statuses: ["failure", "success", "failure"],
          epochs_finished: [100, 526, 400],
          minimum_NLLs: [0.3, 0.2, 0.1],
        },
      },
      {
        uuid: uuids.test6,
        name: "test6",
        type: "RaptGen",
        status: "success",
        start: 1620000000,
        duration: 1000,
        reiteration: 1,
        params_training: params,
        summary: {
          indices: [0],
          statuses: ["success"],
          epochs_finished: [100],
          minimum_NLLs: [0.3],
        },
      },
      {
        uuid: uuids.test7,
        name: "test7",
        type: "RaptGen",
        status: "failure",
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        params_training: params,
        summary: {
          indices: [0, 1, 2],
          statuses: ["failure", "failure", "failure"],
          epochs_finished: [100, 526, 400],
          minimum_NLLs: [0.3, 0.2, 0.1],
        },
      },
      {
        uuid: uuids.test8,
        name: "test8",
        type: "RaptGen",
        status: "failure",
        start: 1620000000,
        duration: 1000,
        reiteration: 1,
        params_training: params,
        summary: {
          indices: [0],
          statuses: ["failure"],
          epochs_finished: [100],
          minimum_NLLs: [0.3],
        },
      },
      {
        uuid: uuids.test9,
        name: "test9",
        type: "RaptGen",
        status: "suspend",
        start: 1620000000,
        duration: 36000,
        reiteration: 3,
        params_training: params,
        summary: {
          indices: [0, 1, 2],
          statuses: ["success", "failure", "suspend"],
          epochs_finished: [100, 526, 400],
          minimum_NLLs: [0.3, 0.2, 0.1],
        },
      },
      {
        uuid: uuids.test10,
        name: "test10",
        type: "RaptGen",
        status: "suspend",
        start: 1620000000,
        duration: 1000,
        reiteration: 1,
        params_training: params,
        summary: {
          indices: [0],
          statuses: ["suspend"],
          epochs_finished: [100],
          minimum_NLLs: [0.3],
        },
      },
    ] as z.infer<typeof trainZod.responseGetItem>[];

    data = data.filter((d) => d.uuid === parent_uuid);
    if (data.length === 0) {
      return res(ctx.status(404), ctx.json(errorMsg));
    } else {
      return res(ctx.status(200), ctx.json(data[0]));
    }
  }),

  rest.get(
    mockURL("/train/jobs/items/:parent_uuid/:child_id"),
    (req, res, ctx) => {
      const { parent_uuid, child_id } = req.params;
      const params = {
        parent_uuid: parent_uuid,
        child_id: child_id,
      };
      const zod = z.object({
        parent_uuid: z.string().uuid(),
        child_id: z.number().int().min(0),
      });
      if (!zod.safeParse(params)) {
        return res(ctx.status(422), ctx.json(errorMsg));
      }

      let data = [
        {
          uuid: uuids.test1,
          id: 0,
          status: "failure",
          start: 1620000000,
          duration: 12000,
          error_msg: "error message",
        },
        {
          uuid: uuids.test1,
          id: 1,
          status: "success",
          start: 1620012000,
          duration: 12000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test1,
          id: 2,
          status: "progress",
          start: 1620024000,
          duration: 12000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test2,
          id: 0,
          status: "progress",
          start: 1620000500,
          duration: 12000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test3,
          id: 0,
          status: "pending",
          start: 1620000000,
          duration: 12000,
        },
        {
          uuid: uuids.test3,
          id: 1,
          status: "pending",
          start: 1620012000,
          duration: 12000,
        },
        {
          uuid: uuids.test3,
          id: 2,
          status: "pending",
          start: 1620024000,
          duration: 12000,
        },
        {
          uuid: uuids.test4,
          id: 0,
          status: "pending",
          start: 1620000000,
          duration: 1000,
        },
        {
          uuid: uuids.test5,
          id: 0,
          status: "failure",
          start: 1620000000,
          duration: 12000,
          error_msg: "error message",
        },
        {
          uuid: uuids.test5,
          id: 1,
          status: "success",
          start: 1620012000,
          duration: 12000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test5,
          id: 2,
          status: "failure",
          start: 1620024000,
          duration: 12000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test6,
          id: 0,
          status: "success",
          start: 1620000000,
          duration: 1000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test7,
          id: 0,
          status: "failure",
          start: 1620000000,
          duration: 12000,
          error_msg: "error message",
        },
        {
          uuid: uuids.test7,
          id: 1,
          status: "failure",
          start: 1620012000,
          duration: 12000,
          error_msg: "error message",
        },
        {
          uuid: uuids.test7,
          id: 2,
          status: "failure",
          start: 1620024000,
          duration: 12000,
          error_msg: "error message",
        },
        {
          uuid: uuids.test8,
          id: 0,
          status: "failure",
          start: 1620000000,
          duration: 1000,
          error_msg: "error message",
        },
        {
          uuid: uuids.test9,
          id: 0,
          status: "success",
          start: 1620000000,
          duration: 12000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test9,
          id: 1,
          status: "failure",
          start: 1620012000,
          duration: 12000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test9,
          id: 2,
          status: "suspend",
          start: 1620024000,
          duration: 12000,
          latent: latent,
          losses: loss,
        },
        {
          uuid: uuids.test10,
          id: 0,
          status: "suspend",
          start: 1620000000,
          duration: 1000,
          latent: latent,
          losses: loss,
        },
      ] as z.infer<typeof trainZod.responseGetItemChild>[];

      data = data.filter(
        (d) => d.uuid === parent_uuid && d.id === parseInt(child_id as string)
      );

      if (data.length === 0) {
        return res(ctx.status(404), ctx.json(errorMsg));
      } else {
        return res(ctx.status(200), ctx.json(data[0]));
      }
    }
  ),

  rest.delete(
    mockURL("/train/jobs/items/:parent_uuid"),
    async (req, res, ctx) => {
      const { parent_uuid } = req.params;
      const params = {
        parent_uuid: parent_uuid,
      };
      const zod = z.object({
        parent_uuid: z.string().uuid(),
      });
      if (!zod.safeParse(params)) {
        return res(ctx.status(422), ctx.json(errorMsg));
      }

      return res(ctx.status(200), ctx.json(null));
    }
  ),

  rest.post(mockURL("/train/jobs/kill"), async (req, res, ctx) => {
    if (trainZod.requestPostKill.safeParse(await req.json())) {
      return res(ctx.status(200), ctx.json(null));
    } else {
      return res(ctx.status(422), ctx.json(errorMsg));
    }
  }),

  rest.post(mockURL("/train/jobs/suspend"), async (req, res, ctx) => {
    if (trainZod.requestPostSuspend.safeParse(await req.json())) {
      return res(ctx.status(200), ctx.json(null));
    } else {
      return res(ctx.status(422), ctx.json(errorMsg));
    }
  }),

  rest.post(mockURL("/train/jobs/resume"), async (req, res, ctx) => {
    if (trainZod.requestPostResume.safeParse(await req.json())) {
      return res(ctx.status(200), ctx.json(null));
    } else {
      return res(ctx.status(422), ctx.json(errorMsg));
    }
  }),

  rest.post(mockURL("/train/jobs/publish"), async (req, res, ctx) => {
    if (trainZod.requestPostPublish.safeParse(await req.json())) {
      return res(ctx.status(200), ctx.json(null));
    } else {
      return res(ctx.status(422), ctx.json(errorMsg));
    }
  }),
];
