import { rest } from "msw";
import { selex } from "./asset/random-selex";

export const mockURL = (path: string) => {
  return `http://localhost:18042/api${path}`;
};

const errorMsg = {
  error: "error",
  msg: "field not valid",
  type: "value_error.invalid_type",
};

const uuids = {
  test1: "ef9aa8c6-7892-11ef-a40f-325096b39f47",
  test2: "46adadc0-7893-11ef-ac99-325096b39f47",
  test3: "5202262e-7893-11ef-9ee6-325096b39f47",
  test4: "58581c5e-7893-11ef-9efc-325096b39f47",
  test5: "60a20334-7893-11ef-afba-325096b39f47",
};

const latent = {
  random_regions: selex.map((d) => d.sequence),
  coords_x: selex.map((d) => d.x),
  coords_y: selex.map((d) => d.y),
  duplicates: selex.map((d) => d.duplicate),
};

const params = {
  minimum_n_components: 1,
  maximum_n_components: 5,
  step_size: 2,
  n_trials_per_component: 5,
};

const bics = {
  n_components: [1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 5, 5, 5, 5, 5],
  bics: [
    0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5,
  ],
};

const gmm1 = {
  current_n_components: 1,
  optimal_n_components: 3,
  means: [[0, 0]],
  covs: [
    [
      [1, 0],
      [0, 1],
    ],
  ],
};
const gmm3 = {
  current_n_components: 3,
  optimal_n_components: 3,
  means: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  covs: [
    [
      [1, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [0, 1],
    ],
  ],
};

const gmm5 = {
  current_n_components: 5,
  optimal_n_components: 3,
  means: [
    [-1, 1],
    [1, -1],
    [0, 0],
    [1, 1],
    [-1, -1],
  ],
  covs: [
    [
      [1, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [0, 1],
    ],
    [
      [1, 0],
      [0, 1],
    ],
  ],
};

// const gmm5 =

export const gmmHandlers = [
  rest.post(mockURL("/gmm/jobs/submit"), (req, res, ctx) => {
    // return res(ctx.status(200), ctx.json({ uuid: uuids.test1 }));
    return res(
      ctx.status(200),
      ctx.json({
        uuid: uuids.test1,
      })
    );
  }),

  rest.post(mockURL("/gmm/jobs/search"), (req, res, ctx) => {
    // return res(ctx.status(200), ctx.json({ uuid: uuids.test1 }));
    return res(
      ctx.status(200),
      ctx.json([
        {
          uuid: uuids.test1,
          name: "test1",
          status: "pending",
          start: Math.floor(Date.now() / 1000) - 100,
          duration: 100,
          trials_total: 15,
          trials_current: -1,
        },
        {
          uuid: uuids.test2,
          name: "test2",
          status: "progress",
          start: Math.floor(Date.now() / 1000) - 100,
          duration: 100,
          trials_total: 15,
          trials_current: Math.floor(Math.random() * 15),
        },
        {
          uuid: uuids.test3,
          name: "test3",
          status: "suspend",
          start: Math.floor(Date.now() / 1000) - 100,
          duration: 100,
          trials_total: 15,
          trials_current: Math.floor(Math.random() * 15),
        },
        {
          uuid: uuids.test4,
          name: "test4",
          status: "failure",
          start: Math.floor(Date.now() / 1000) - 100,
          duration: 100,
          trials_total: 15,
          trials_current: -1,
        },
        {
          uuid: uuids.test5,
          name: "test5",
          status: "success",
          start: Math.floor(Date.now() / 1000) - 100,
          duration: 100,
          trials_total: 15,
          trials_current: -1,
        },
      ])
    );
  }),

  rest.get(mockURL("/gmm/jobs/items/:uuid"), (req, res, ctx) => {
    let gmm;
    // query params
    switch (req.url.searchParams.get("n_components")) {
      case "1":
        gmm = gmm1;
        break;
      case "3":
        gmm = gmm3;
        break;
      case "5":
        gmm = gmm5;
        break;
      default:
        gmm = gmm3;
    }

    // path params
    switch (req.params.uuid) {
      case uuids.test1:
        return res(
          ctx.status(200),
          ctx.json({
            uuid: uuids.test1,
            name: "test1",
            status: "pending",
            start: Math.floor(Date.now() / 1000) - 100,
            duration: 100,
            target: "test1",
            params: params,
          })
        );
      case uuids.test2:
        return res(
          ctx.status(200),
          ctx.json({
            uuid: uuids.test2,
            name: "test2",
            status: "progress",
            start: Math.floor(Date.now() / 1000) - 100,
            duration: 100,
            target: "test2",
            params: params,
            current_states: {
              n_components: [1, 3, 5][Math.floor(Math.random() * 3)],
              trial: Math.floor(Math.random() * 5),
            },
            gmm: gmm,
            latent: latent,
            bic: bics,
          })
        );
      case uuids.test3:
        return res(
          ctx.status(200),
          ctx.json({
            uuid: uuids.test3,
            name: "test3",
            status: "suspend",
            start: Math.floor(Date.now() / 1000) - 100,
            duration: 100,
            target: "test3",
            params: params,
            current_states: {
              n_components: [1, 3, 5][Math.floor(Math.random() * 3)],
              trial: Math.floor(Math.random() * 5),
            },
            gmm: gmm,
            latent: latent,
            bic: bics,
          })
        );
      case uuids.test4:
        return res(
          ctx.status(200),
          ctx.json({
            uuid: uuids.test4,
            name: "test4",
            status: "failure",
            start: Math.floor(Date.now() / 1000) - 100,
            duration: 100,
            target: "test4",
            params: params,
            error_msg: "error message",
          })
        );
      case uuids.test5:
        return res(
          ctx.status(200),
          ctx.json({
            uuid: uuids.test5,
            name: "test5",
            status: "success",
            start: Math.floor(Date.now() / 1000) - 100,
            duration: 100,
            target: "test5",
            params: params,
            gmm: gmm,
            latent: latent,
            bic: bics,
          })
        );
      default:
        return res(ctx.status(404), ctx.json(errorMsg));
    }
  }),

  rest.patch(mockURL("/gmm/jobs/items/:uuid"), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.delete(mockURL("/gmm/jobs/items/:uuid"), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.post(mockURL("/gmm/jobs/suspend"), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.post(mockURL("/gmm/jobs/resume"), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.post(mockURL("/gmm/jobs/publish"), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),
];
