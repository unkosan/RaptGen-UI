import { rest } from "msw";
import { vaeParams, gmmParams } from "./asset/params";
import { selex } from "./asset/rapt-selex";
import { gmm } from "./asset/gmm-values";
import { uuids } from "./asset/uuids";

export const mockURL = (path: string) => {
  return `http://localhost:18042/api${path}`;
};

const errorMsg = {
  error: "error",
  msg: "field not valid",
  type: "value_error.invalid_type",
};

export const dataHandlers = [
  rest.get(mockURL(""), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: "OK" }));
  }),

  rest.get(mockURL("/data/VAE-model-names"), (req, res, ctx) => {
    return res(
      ctx.json({
        entries: [
          { uuid: uuids.vae.rapt1, name: "RAPT1" },
          { uuid: uuids.vae.rapt3, name: "RAPT3" },
        ],
      })
    );
  }),

  rest.get(mockURL("/data/GMM-model-names"), (req, res, ctx) => {
    const vae_uuid = req.url.searchParams.get("vae_uuid");
    switch (vae_uuid) {
      case uuids.vae.rapt1:
        return res(
          ctx.status(200),
          ctx.json({
            entries: [{ uuid: uuids.gmm.rapt1, name: "num_comp_15_A" }],
          })
        );
      case uuids.vae.rapt3:
        return res(
          ctx.status(200),
          ctx.json({
            entries: [{ uuid: uuids.gmm.rapt3, name: "num_comp_15_B" }],
          })
        );
      default:
        return res(
          ctx.status(404),
          ctx.json({
            error: "error",
          })
        );
    }
  }),

  // not available in the current implementation
  // rest.get(mockURL("/data/measured-data-names"), (req, res, ctx) => {
  //   return res(
  //     ctx.status(200),
  //     ctx.json({
  //       status: "success",
  //       data: ["report1.csv", "report3.csv"],
  //     })
  //   );
  // }),

  rest.get(mockURL("/data/VAE-model-parameters"), (req, res, ctx) => {
    const vae_uuid = req.url.searchParams.get("vae_uuid");
    switch (vae_uuid) {
      case uuids.vae.rapt1:
        return res(ctx.status(200), ctx.json(vaeParams.rapt1));
      case uuids.vae.rapt3:
        return res(ctx.status(200), ctx.json(vaeParams.rapt3));
      default:
        return res(
          ctx.status(404),
          ctx.json({
            error: "error",
          })
        );
    }
  }),

  rest.get(mockURL("/data/GMM-model-parameters"), (req, res, ctx) => {
    const gmm_uuid = req.url.searchParams.get("gmm_uuid");
    switch (gmm_uuid) {
      case uuids.gmm.rapt1:
        return res(ctx.status(200), ctx.json(gmmParams.num_comp_15_A));
      case uuids.gmm.rapt3:
        return res(ctx.status(200), ctx.json(gmmParams.num_comp_15_B));
      default:
        return res(
          ctx.status(404),
          ctx.json({
            error: "error",
          })
        );
    }
  }),

  rest.get(mockURL("/data/selex-data"), (req, res, ctx) => {
    const vae_uuid = req.url.searchParams.get("vae_uuid");
    switch (vae_uuid) {
      case uuids.vae.rapt1:
        return res(
          ctx.status(200),
          ctx.json({
            random_regions: selex.RAPT1.Without_Adapters,
            duplicates: selex.RAPT1.Duplicates,
            coord_x: selex.RAPT1.coord_x,
            coord_y: selex.RAPT1.coord_y,
          })
        );
      case uuids.vae.rapt3:
        return res(
          ctx.status(200),
          ctx.json({
            random_regions: selex.RAPT3.Without_Adapters,
            duplicates: selex.RAPT3.Duplicates,
            coord_x: selex.RAPT3.coord_x,
            coord_y: selex.RAPT3.coord_y,
          })
        );
      default:
        return res(
          ctx.status(404),
          ctx.json({
            error: "error",
          })
        );
    }
  }),

  rest.get(mockURL("/data/GMM-model"), (req, res, ctx) => {
    const gmm_uuid = req.url.searchParams.get("gmm_uuid");
    switch (gmm_uuid) {
      case uuids.gmm.rapt1:
        return res(
          ctx.status(200),
          ctx.json({
            means: gmm.num_comp_15_A.means,
            covariances: gmm.num_comp_15_A.covariances,
          })
        );
      case uuids.gmm.rapt3:
        return res(
          ctx.status(200),
          ctx.json({
            means: gmm.num_comp_15_B.means,
            covariances: gmm.num_comp_15_B.covariances,
          })
        );
      default:
        return res(
          ctx.status(404),
          ctx.json({
            error: "error",
          })
        );
    }
  }),

  // not available in the current implementation
  // rest.get(mockURL("/data/measured-data"), (req, res, ctx) => {
  //   const measured_data_name = req.url.searchParams.get("measured_data_name");
  //   if (measured_data_name === "report1.csv") {
  //     return res(
  //       ctx.status(200),
  //       ctx.json({
  //         status: "success",
  //         data: measuredData.report1,
  //       })
  //     );
  //   } else if (measured_data_name === "report3.csv") {
  //     return res(
  //       ctx.status(200),
  //       ctx.json({
  //         status: "success",
  //         data: measuredData.report3,
  //       })
  //     );
  //   } else {
  //     return res(
  //       ctx.status(200),
  //       ctx.json({
  //         status: "error",
  //         data: ["none"],
  //       })
  //     );
  //   }
  // }),

  rest.delete(mockURL("/data/items/:vae_uuid"), (req, res, ctx) => {
    const vae_uuid = req.params.vae_uuid;
    switch (vae_uuid) {
      case uuids.vae.rapt1:
        return res(ctx.status(200), ctx.json(null));
      case uuids.vae.rapt3:
        return res(ctx.status(200), ctx.json(null));
      default:
        return res(ctx.status(404), ctx.json(errorMsg));
    }
  }),

  rest.patch(mockURL("/data/items/:vae_uuid"), (req, res, ctx) => {
    const vae_uuid = req.params.vae_uuid;
    switch (vae_uuid) {
      case uuids.vae.rapt1:
        return res(ctx.status(200), ctx.json(null));
      case uuids.vae.rapt3:
        return res(ctx.status(200), ctx.json(null));
      default:
        return res(ctx.status(404), ctx.json(errorMsg));
    }
  }),
];
