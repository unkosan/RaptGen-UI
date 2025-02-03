import { rest } from "msw";
import { uuids } from "./asset/uuids";

export const mockURL = (path: string) => {
  return `http://localhost:18042/api${path}`;
};

const errorMsg = {
  error: "error",
  msg: "field not valid",
  type: "value_error.invalid_type",
};

const experimentState = {
  experiment_name: "",
  VAE_uuid: "",
  VAE_name: "",
  plot_config: {
    minimum_count: 2,
    show_training_data: true,
    show_bo_contour: true,
  },
  optimization_config: {
    method_name: "qEI",
    target_column_name: "value2",
    query_budget: 3,
  },
  distribution_config: {
    xlim_min: -3.5,
    xlim_max: 3.5,
    ylim_min: -3.5,
    ylim_max: 3.5,
  },
  registered_values_table: {
    ids: ["no.1", "no.2", "no.3"],
    sequences: ["AAUG", "GGUC", "CCGA"],
    target_column_names: ["value", "value2"],
    target_values: [
      [1, 2],
      [3, 4],
      [5, 6],
    ],
  },
  query_table: {
    sequences: ["AAUG", "GGUC", "CCGA"],
    coords_x_original: [1, 0, -1],
    coords_y_original: [1, 0, -1],
  },
  acquisition_mesh: {
    coords_x: [-3.5, -3.5, -3.5, 0, 0, 0, 3.5, 3.5, 3.5],
    coords_y: [-3.5, 0, 3.5, -3.5, 0, 3.5, -3.5, 0, 3.5],
    values: [1, 0, 1, 0, 1, 0, 1, 0, 1],
  },
};

export const bayesoptHandlers = [
  rest.post(mockURL("/bayesopt/run"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        acquisition_data: {
          coords_x: [-3.5, -3.5, -3.5, 0, 0, 0, 3.5, 3.5, 3.5],
          coords_y: [-3.5, 0, 3.5, -3.5, 0, 3.5, -3.5, 0, 3.5],
          values: [3.5, 0, 3.5, 0, 3.5, 0, 3.5, 0, 3.5],
        },
        query_data: {
          coords_x: [-0.1, 0.0, 0.1],
          coords_y: [-0.1, 0.0, 0.1],
        },
      })
    );
  }),

  rest.get(mockURL("/bayesopt/items"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          uuid: uuids.bo.rapt1,
          name: "RAPT1",
          last_modified: 1720137600,
        },
        {
          uuid: uuids.bo.rapt3,
          name: "RAPT3",
          last_modified: 1720137600,
        },
      ])
    );
  }),

  rest.get(mockURL("/bayesopt/items/:uuid"), (req, res, ctx) => {
    let uuid = req.params.uuid;

    switch (uuid) {
      case uuids.bo.rapt1:
        return res(
          ctx.status(200),
          ctx.json({
            ...experimentState,
            experiment_name: "Exp: RAPT1",
            VAE_name: "RAPT1",
            VAE_uuid: uuids.vae.rapt1,
          })
        );
      case uuids.bo.rapt3:
        return res(
          ctx.status(200),
          ctx.json({
            ...experimentState,
            experiment_name: "Exp: RAPT3",
            VAE_name: "RAPT3",
            VAE_uuid: uuids.vae.rapt3,
          })
        );
      default:
        return res(ctx.status(404), ctx.json(errorMsg));
    }
  }),

  rest.put(mockURL("/bayesopt/items/:uuid"), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.patch(mockURL("/bayesopt/items/:uuid"), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.delete(mockURL("/bayesopt/items/:uuid"), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.post(mockURL("/bayesopt/submit"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        uuid: "f57f8e2d-3ca2-45b5-8874-d27306db54c2",
      })
    );
  }),
];
