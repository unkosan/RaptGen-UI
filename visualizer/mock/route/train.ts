import { rest } from "msw";
import { selex } from "./selex";
import { loss } from "./loss";

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
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
  // 20 points
  random_regions: selex.map((d) => d.sequence),
  coords_x: selex.map((d) => d.x),
  coords_y: selex.map((d) => d.y),
  duplicates: selex.map((d) => d.duplicate),
};

const losses = {
  train_loss: loss.map((d) => d.train_loss),
  test_loss: loss.map((d) => d.test_loss),
  test_recon: loss.map((d) => d.test_recon),
  test_kld: loss.map((d) => d.test_kld),
};

const params = {
  epochs: 1000,
  beta_epochs: 100,
  early_stopping: 100,
  force_matching_epochs: 100,
};

export const trainHandlers = [
  rest.get(mockURL("/train/device/process"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(["cpu", "cuda:0", "cuda:1", "cuda:2", "cuda:3"])
    );
  }),
  rest.post(mockURL("/train/jobs/submit"), (req, res, ctx) => {
    console.log(req.body);
    return res(ctx.status(200), ctx.json(null));
  }),
  rest.get(mockURL("train/jobs/search"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          uuid: uuids.test1,
          name: "test",
          status: "progress",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 36000,
          reiteration: 3,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 12000,
              item_status: "failure",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
            {
              item_id: 1,
              item_start: 1620012000,
              item_duraion: 12000,
              item_status: "success",
              item_epochs_total: 1000,
              item_epochs_current: 526,
            },
            {
              item_id: 2,
              item_start: 1620024000,
              item_duraion: 12000,
              item_status: "progress",
              item_epochs_total: 1000,
              item_epochs_current: 400,
            },
          ],
        },
        {
          uuid: uuids.test2,
          name: "test2",
          status: "progress",
          // start and duration are in unix timestamp
          start: 1620000500,
          duration: 36000,
          reiteration: 1,
          series: [
            {
              item_id: 0,
              item_start: 1620000500,
              item_duraion: 12000,
              item_status: "progress",
              item_epochs_total: 1000,
              item_epochs_current: 700,
            },
          ],
        },
        {
          uuid: uuids.test3,
          name: "test3",
          status: "pending",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 36000,
          reiteration: 3,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 12000,
              item_status: "pending",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
            {
              item_id: 1,
              item_start: 1620012000,
              item_duraion: 12000,
              item_status: "pending",
              item_epochs_total: 1000,
              item_epochs_current: 526,
            },
            {
              item_id: 2,
              item_start: 1620024000,
              item_duraion: 12000,
              item_status: "pending",
              item_epochs_total: 1000,
              item_epochs_current: 400,
            },
          ],
        },
        {
          uuid: uuids.test4,
          name: "test4",
          status: "pending",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 1000,
          reiteration: 1,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 1000,
              item_status: "pending",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
          ],
        },
        {
          uuid: uuids.test5,
          name: "test5",
          status: "success",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 36000,
          reiteration: 3,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 12000,
              item_status: "failure",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
            {
              item_id: 1,
              item_start: 1620012000,
              item_duraion: 12000,
              item_status: "success",
              item_epochs_total: 1000,
              item_epochs_current: 526,
            },
            {
              item_id: 2,
              item_start: 1620024000,
              item_duraion: 12000,
              item_status: "failure",
              item_epochs_total: 1000,
              item_epochs_current: 400,
            },
          ],
        },
        {
          uuid: uuids.test6,
          name: "test6",
          status: "success",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 1000,
          reiteration: 1,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 1000,
              item_status: "success",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
          ],
        },
        {
          uuid: uuids.test7,
          name: "test7",
          status: "failure",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 36000,
          reiteration: 3,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 12000,
              item_status: "failure",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
            {
              item_id: 1,
              item_start: 1620012000,
              item_duraion: 12000,
              item_status: "failure",
              item_epochs_total: 1000,
              item_epochs_current: 526,
            },
            {
              item_id: 2,
              item_start: 1620024000,
              item_duraion: 12000,
              item_status: "failure",
              item_epochs_total: 1000,
              item_epochs_current: 400,
            },
          ],
        },
        {
          uuid: uuids.test8,
          name: "test8",
          status: "failure",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 1000,
          reiteration: 1,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 1000,
              item_status: "failure",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
          ],
        },
        {
          uuid: uuids.test9,
          name: "test9",
          status: "suspend",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 36000,
          reiteration: 3,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 12000,
              item_status: "success",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
            {
              item_id: 1,
              item_start: 1620012000,
              item_duraion: 12000,
              item_status: "failure",
              item_epochs_total: 1000,
              item_epochs_current: 526,
            },
            {
              item_id: 2,
              item_start: 1620024000,
              item_duraion: 12000,
              item_status: "suspend",
              item_epochs_total: 1000,
              item_epochs_current: 400,
            },
          ],
        },
        {
          uuid: uuids.test10,
          name: "test10",
          status: "suspend",
          // start and duration are in unix timestamp
          start: 1620000000,
          duration: 1000,
          reiteration: 1,
          series: [
            {
              item_id: 0,
              item_start: 1620000000,
              item_duraion: 1000,
              item_status: "suspend",
              item_epochs_total: 1000,
              item_epochs_current: 100,
            },
          ],
        },
      ])
    );
  }),

  rest.get(mockURL("/train/jobs/items/:uuid"), (req, res, ctx) => {
    // if uuid path param is uuids.test1
    const itemId = req.url.searchParams.get("uuid");
    const iterId = req.url.searchParams.get("number");
    if (itemId === null) {
      return res(
        ctx.status(400),
        ctx.json({ message: "uuid is not specified" })
      );
    }
    switch (itemId) {
      case uuids.test1:
        const parent1 = {
          uuid: uuids.test1,
          parent_name: "test",
          parent_status: "progress",
          parent_start: 1620000000,
          parent_duration: 36000,
          parent_reiteration: 3,
          params_training: params,
        };
        const summary1 = {
          indeces: [0, 1, 2],
          statuses: ["success", "failure", "progress"],
          epochs_finished: [100, 526, 400],
          minimum_neglog_ELBOs: [0.3, 0.2, 0.1],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent1,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "progress",
                item_reiteration: 3,
                latent: latent,
                losses: losses,
                summary: summary1,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent1,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 12000,
                item_status: "failure",
                item_reiteration: 3,
                error_msg: "error message",
                summary: summary1,
              })
            );

          case "1":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent1,
                item_id: 1,
                item_start: 1620012000,
                item_duraion: 12000,
                item_status: "success",
                item_reiteration: 3,
                latent: latent,
                losses: losses,
                summary: summary1,
              })
            );

          case "2":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent1,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "progress",
                item_reiteration: 3,
                latent: latent,
                losses: losses,
                summary: summary1,
              })
            );

          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test2:
        const parent2 = {
          uuid: uuids.test2,
          parent_name: "test2",
          parent_status: "progress",
          parent_start: 1620000500,
          parent_duration: 36000,
          parent_reiteration: 1,
          params_training: params,
        };
        const summary2 = {
          indeces: [0],
          statuses: ["progress"],
          epochs_finished: [700],
          minimum_neglog_ELBOs: [0.3],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent2,
                item_id: 0,
                item_start: 1620000500,
                item_duraion: 12000,
                item_status: "progress",
                item_reiteration: 1,
                latent: latent,
                losses: losses,
                summary: summary2,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent2,
                item_id: 0,
                item_start: 1620000500,
                item_duraion: 12000,
                item_status: "progress",
                item_reiteration: 1,
                latent: latent,
                losses: losses,
                summary: summary2,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test3:
        const parent3 = {
          uuid: uuids.test3,
          parent_name: "test3",
          parent_status: "pending",
          parent_start: 1620000000,
          parent_duration: 36000,
          parent_reiteration: 3,
          params_training: params,
        };
        const summary3 = {
          indeces: [0, 1, 2],
          statuses: ["pending", "pending", "pending"],
          epoochs_finished: [100, 526, 400],
          minimum_neglog_ELBOs: [NaN, NaN, NaN],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent3,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "pending",
                item_reiteration: 3,
                summary: summary3,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent3,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 12000,
                item_status: "pending",
                item_reiteration: 3,
                summary: summary3,
              })
            );
          case "1":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent3,
                item_id: 1,
                item_start: 1620012000,
                item_duraion: 12000,
                item_status: "pending",
                item_reiteration: 3,
                summary: summary3,
              })
            );
          case "2":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent3,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "pending",
                item_reiteration: 3,
                summary: summary3,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test4:
        const parent4 = {
          uuid: uuids.test4,
          parent_name: "test4",
          parent_status: "pending",
          parent_start: 1620000000,
          parent_duration: 1000,
          parent_reiteration: 1,
          params_training: params,
        };
        const summary4 = {
          indeces: [0],
          statuses: ["pending"],
          epoochs_finished: [100],
          minimum_neglog_ELBOs: [NaN],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent4,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 1000,
                item_status: "pending",
                item_reiteration: 1,
                summary: summary4,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent4,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 1000,
                item_status: "pending",
                item_reiteration: 1,
                summary: summary4,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test5:
        const parent5 = {
          uuid: uuids.test5,
          parent_name: "test5",
          parent_status: "success",
          parent_start: 1620000000,
          parent_duration: 36000,
          parent_reiteration: 3,
          params_training: params,
        };
        const summary5 = {
          indeces: [0, 1, 2],
          statuses: ["failure", "success", "failure"],
          epoochs_finished: [100, 526, 400],
          minimum_neglog_ELBOs: [0.3, 0.2, 0.1],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent5,
                item_id: 1,
                item_start: 1620012000,
                item_duraion: 12000,
                item_status: "success",
                item_reiteration: 3,
                latent: latent,
                losses: losses,
                summary: summary5,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent5,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 12000,
                item_status: "failure",
                item_reiteration: 3,
                error_msg: "error message",
                summary: summary5,
              })
            );
          case "1":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent5,
                item_id: 1,
                item_start: 1620012000,
                item_duraion: 12000,
                item_status: "success",
                item_reiteration: 3,
                latent: latent,
                losses: losses,
                summary: summary5,
              })
            );
          case "2":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent5,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "failure",
                item_reiteration: 3,
                error_msg: "error message",
                summary: summary5,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test6:
        const parent6 = {
          uuid: uuids.test6,
          parent_name: "test6",
          parent_status: "success",
          parent_start: 1620000000,
          parent_duration: 1000,
          parent_reiteration: 1,
          params_training: params,
        };
        const summary6 = {
          indeces: [0],
          statuses: ["success"],
          epoochs_finished: [100],
          minimum_neglog_ELBOs: [0.3],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent6,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 1000,
                item_status: "success",
                item_reiteration: 1,
                latent: latent,
                losses: losses,
                summary: summary6,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent6,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 1000,
                item_status: "success",
                item_reiteration: 1,
                latent: latent,
                losses: losses,
                summary: summary6,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test7:
        const parent7 = {
          uuid: uuids.test7,
          parent_name: "test7",
          parent_status: "failure",
          parent_start: 1620000000,
          parent_duration: 36000,
          parent_reiteration: 3,
          params_training: params,
        };
        const summary7 = {
          indeces: [0, 1, 2],
          statuses: ["failure", "failure", "failure"],
          epoochs_finished: [100, 526, 400],
          minimum_neglog_ELBOs: [0.3, 0.2, 0.1],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent7,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "failure",
                item_reiteration: 3,
                error_msg: "error message",
                summary: summary7,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent7,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 12000,
                item_status: "failure",
                item_reiteration: 3,
                error_msg: "error message",
                summary: summary7,
              })
            );
          case "1":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent7,
                item_id: 1,
                item_start: 1620012000,
                item_duraion: 12000,
                item_status: "failure",
                item_reiteration: 3,
                error_msg: "error message",
                summary: summary7,
              })
            );
          case "2":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent7,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "failure",
                item_reiteration: 3,
                error_msg: "error message",
                summary: summary7,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test8:
        const parent8 = {
          uuid: uuids.test8,
          parent_name: "test8",
          parent_status: "failure",
          parent_start: 1620000000,
          parent_duration: 1000,
          parent_reiteration: 1,
          params_training: params,
        };
        const summary8 = {
          indeces: [0],
          statuses: ["failure"],
          epoochs_finished: [100],
          minimum_neglog_ELBOs: [0.3],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent8,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 1000,
                item_status: "failure",
                item_reiteration: 1,
                error_msg: "error message",
                summary: summary8,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent8,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 1000,
                item_status: "failure",
                item_reiteration: 1,
                error_msg: "error message",
                summary: summary8,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test9:
        const parent9 = {
          uuid: uuids.test9,
          parent_name: "test9",
          parent_status: "suspend",
          parent_start: 1620000000,
          parent_duration: 36000,
          parent_reiteration: 3,
          params_training: params,
        };
        const summary9 = {
          indeces: [0, 1, 2],
          statuses: ["success", "failure", "suspend"],
          epoochs_finished: [100, 526, 400],
          minimum_neglog_ELBOs: [0.3, 0.2, 0.1],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent9,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "suspend",
                item_reiteration: 3,
                summary: summary9,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent9,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 12000,
                item_status: "success",
                item_reiteration: 3,
                latent: latent,
                losses: losses,
                summary: summary9,
              })
            );
          case "1":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent9,
                item_id: 1,
                item_start: 1620012000,
                item_duraion: 12000,
                item_status: "failure",
                item_reiteration: 3,
                error_msg: "error message",
                summary: summary9,
              })
            );
          case "2":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent9,
                item_id: 2,
                item_start: 1620024000,
                item_duraion: 12000,
                item_status: "suspend",
                item_reiteration: 3,
                summary: summary9,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      case uuids.test10:
        const parent10 = {
          uuid: uuids.test10,
          parent_name: "test10",
          parent_status: "suspend",
          parent_start: 1620000000,
          parent_duration: 1000,
          parent_reiteration: 1,
          params_training: params,
        };
        const summary10 = {
          indeces: [0],
          statuses: ["suspend"],
          epoochs_finished: [100],
          minimum_neglog_ELBOs: [0.3],
        };
        switch (iterId) {
          case null:
            return res(
              ctx.status(200),
              ctx.json({
                ...parent10,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 1000,
                item_status: "suspend",
                item_reiteration: 1,
                summary: summary10,
              })
            );
          case "0":
            return res(
              ctx.status(200),
              ctx.json({
                ...parent10,
                item_id: 0,
                item_start: 1620000000,
                item_duraion: 1000,
                item_status: "suspend",
                item_reiteration: 1,
                summary: summary10,
              })
            );
          default:
            return res(
              ctx.status(400),
              ctx.json({ message: "number is not valid" })
            );
        }

      default:
        return res(ctx.status(400), ctx.json({ message: "uuid is not valid" }));
    }
  }),

  rest.patch(mockURL("/train/jobs/items/:uuid"), (req, res, ctx) => {
    const itemId = req.url.searchParams.get("uuid");
    console.log(req.body);
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.delete(mockURL("/train/jobs/items/:uuid"), (req, res, ctx) => {
    const itemId = req.url.searchParams.get("uuid");
    console.log(req.body);
    return res(ctx.status(200), ctx.json(null));
  }),

  rest.post(mockURL("/train/jobs/kill"), (req, res, ctx) => {
    // get payload "uuid" from request body
    const body = req.body as { uuid: string };
    if (body?.uuid === null) {
      return res(
        ctx.status(400),
        ctx.json({ message: "uuid is not specified" })
      );
    }

    return res(ctx.status(200), ctx.json(null));
  }),

  rest.post(mockURL("/train/jobs/resume"), (req, res, ctx) => {
    // get payload "uuid" from request body
    const body = req.body as { uuid: string };
    if (body?.uuid === null) {
      return res(
        ctx.status(400),
        ctx.json({ message: "uuid is not specified" })
      );
    }

    return res(ctx.status(200), ctx.json(null));
  }),

  rest.post(mockURL("/train/jobs/publish"), (req, res, ctx) => {
    // get payload "uuid" from request body
    const body = req.body as { uuid: string; multi?: number };
    if (body?.uuid === null) {
      return res(
        ctx.status(400),
        ctx.json({ message: "uuid is not specified" })
      );
    }

    return res(ctx.status(200), ctx.json(null));
  }),
];
