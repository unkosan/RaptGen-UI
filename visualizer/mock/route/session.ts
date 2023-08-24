import { rest } from "msw";
import { randomInt } from "mathjs";
import fs from "fs";
import {
  requestPostDecode,
  requestPostEncode,
  requestPostWeblogo,
} from "../../services/alt-api-client";
import { z } from "zod";

function randomNormal() {
  const u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z;
}

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
};

const errorMsg = {
  error: "error",
  msg: "field not valid",
  type: "value_error.invalid_type",
};

let sessions = new Set<number>();

export const sessionHandlers = [
  rest.get(mockURL(""), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: "OK" }));
  }),

  // temporal route for reinitializing the session
  rest.post(mockURL("/session/clear"), (req, res, ctx) => {
    sessions.clear();
    return res(ctx.status(200));
  }),

  rest.get(mockURL("/session/start"), (req, res, ctx) => {
    const VAE_model_name = req.url.searchParams.get("VAE_name");
    if (VAE_model_name === "RAPT1" || VAE_model_name === "RAPT3") {
      const sessionId = randomInt(1000000, 9999999);
      sessions.add(sessionId);
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: sessionId,
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
        })
      );
    }
  }),

  rest.get(mockURL("/session/end"), (req, res, ctx) => {
    const session_id = req.url.searchParams.get("session_id");
    if (sessions.has(Number(session_id))) {
      sessions.delete(Number(session_id));
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
        })
      );
    }
  }),

  rest.get(mockURL("/session/status"), (req, res, ctx) => {
    if (sessions.size !== 0) {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: Array.from(sessions),
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
        })
      );
    }
  }),

  rest.post(mockURL("/session/encode"), (req, res, ctx) => {
    const resBody = req.body as z.infer<typeof requestPostEncode>;
    const length = resBody.sequences.length;

    if (length === 0) {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
        })
      );
    }

    // generate random codes
    let codes = [];
    for (let i = 0; i < length; i++) {
      codes.push({
        coord_x: randomNormal(),
        coord_y: randomNormal(),
      });
    }

    if (sessions.has(resBody.session_id)) {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: codes,
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
        })
      );
    }
  }),

  rest.post(mockURL("/session/decode"), (req, res, ctx) => {
    const resBody = req.body as z.infer<typeof requestPostDecode>;
    const length = resBody.coords.length;

    if (length === 0) {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
        })
      );
    }

    // generate random sequences
    let sequences = [];
    for (let i = 0; i < length; i++) {
      let seq = "";
      for (let j = 0; j < 10; j++) {
        const char = "ATCG".charAt(Math.floor(Math.random() * 4));
        seq += char;
      }
      sequences.push(seq);
    }

    if (sessions.has(resBody.session_id)) {
      return res(
        ctx.status(200),
        ctx.json({
          status: "success",
          data: sequences,
        })
      );
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
        })
      );
    }
  }),

  rest.post(mockURL("/session/decode/weblogo"), (req, res, ctx) => {
    const resBody = req.body as z.infer<typeof requestPostWeblogo>;
    const length = resBody.coords.length;

    // return weblogo image
    if (length === 1) {
      const weblogo = fs.readFileSync("./mock/route/weblogo.png");
      return res(ctx.status(200), ctx.json(String(weblogo)));
    } else {
      return res(
        ctx.status(200),
        ctx.json({
          status: "error",
        })
      );
    }
  }),
];
