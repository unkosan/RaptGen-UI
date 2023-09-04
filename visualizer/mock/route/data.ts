import { rest } from "msw";
import * as encodeZod from "../../services/alt-api-client";
import { vaeParams, gmmParams } from "./params";
import { selex } from "./selex";
import { gmm } from "./gmm";
import { measuredData } from "./measured";

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
};

const errorMsg = {
  error: "error",
  msg: "field not valid",
  type: "value_error.invalid_type",
};

export const dataHandlers = [
  // rest.get(mockURL(""), (req, res, ctx) => {
  //   return res(ctx.status(200), ctx.json({ message: "OK" }));
  // }),

  rest.get(mockURL("/data/VAE-model-names"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: "success",
        data: ["RAPT1", "RAPT3"],
      })
    );
  }),

  rest.get(mockURL("/data/GMM-model-names"), (req, res, ctx) => {
    const VAE_model_name = req.url.searchParams.get("VAE_model_name");
    if (VAE_model_name === "RAPT1") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: ["num_comp_15_A"],
        })
      );
    } else if (VAE_model_name === "RAPT3") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: ["num_comp_15_B"],
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
          data: ["none"],
        })
      );
    }
  }),

  rest.get(mockURL("/data/measured-data-names"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: "success",
        data: ["report1.csv", "report3.csv"],
      })
    );
  }),

  rest.get(mockURL("/data/VAE-model-parameters"), (req, res, ctx) => {
    const VAE_model_name = req.url.searchParams.get("VAE_model_name");
    if (VAE_model_name === "RAPT1") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: vaeParams.RAPT1,
        })
      );
    } else if (VAE_model_name === "RAPT3") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: vaeParams.RAPT3,
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
          data: ["none"],
        })
      );
    }
  }),

  rest.get(mockURL("/data/GMM-model-parameters"), (req, res, ctx) => {
    const VAE_model_name = req.url.searchParams.get("VAE_model_name");
    const GMM_model_name = req.url.searchParams.get("GMM_model_name");
    if (VAE_model_name === "RAPT1" && GMM_model_name === "num_comp_15_A") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: gmmParams.num_comp_15_A,
        })
      );
    } else if (
      VAE_model_name === "RAPT3" &&
      GMM_model_name === "num_comp_15_B"
    ) {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: gmmParams.num_comp_15_B,
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
          data: ["none"],
        })
      );
    }
  }),

  rest.get(mockURL("/data/selex-data"), (req, res, ctx) => {
    const VAE_model_name = req.url.searchParams.get("VAE_model_name");
    if (VAE_model_name === "RAPT1") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: selex.RAPT1,
        })
      );
    } else if (VAE_model_name === "RAPT3") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: selex.RAPT3,
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
          data: ["none"],
        })
      );
    }
  }),

  rest.get(mockURL("/data/GMM-model"), (req, res, ctx) => {
    const VAE_model_name = req.url.searchParams.get("VAE_model_name");
    const GMM_model_name = req.url.searchParams.get("GMM_model_name");
    if (VAE_model_name === "RAPT1" && GMM_model_name === "num_comp_15_A") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: gmm.num_comp_15_A,
        })
      );
    } else if (
      VAE_model_name === "RAPT3" &&
      GMM_model_name === "num_comp_15_B"
    ) {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: gmm.num_comp_15_B,
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
          data: ["none"],
        })
      );
    }
  }),

  rest.get(mockURL("/data/measured-data"), (req, res, ctx) => {
    const measured_data_name = req.url.searchParams.get("measured_data_name");
    if (measured_data_name === "report1.csv") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: measuredData.report1,
        })
      );
    } else if (measured_data_name === "report3.csv") {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: measuredData.report3,
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
          data: ["none"],
        })
      );
    }
  }),
];
