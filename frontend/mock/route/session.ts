import { rest } from "msw";
import { v4 as uuidv4 } from "uuid";
// import weblogo from "./asset/weblogo.png";
import {
  requestPostDecode,
  requestPostEncode,
  // requestPostWeblogo,
} from "../../services/route/session";
import { z } from "zod";
import { uuids } from "./asset/uuids";

function randomNormal() {
  const u = 1 - Math.random(); // Subtraction to flip [0, 1) to (0, 1].
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z;
}

export const mockURL = (path: string) => {
  return `http://localhost:18042/api${path}`;
};

const errorMsg = {
  error: "error",
  msg: "field not valid",
  type: "value_error.invalid_type",
};

let sessions = new Set<string>();

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
    const vae_uuid = req.url.searchParams.get("vae_uuid");
    if (vae_uuid === uuids.vae.rapt1 || vae_uuid === uuids.vae.rapt3) {
      const session_uuid = uuidv4();
      sessions.add(session_uuid);
      return res(
        ctx.status(200),
        ctx.json({
          uuid: session_uuid,
        })
      );
    } else {
      return res(
        ctx.status(404),
        ctx.json({
          status: "error",
        })
      );
    }
  }),

  rest.get(mockURL("/session/end"), (req, res, ctx) => {
    const session_uuid = req.url.searchParams.get("session_uuid");
    if (sessions.has(session_uuid as string)) {
      sessions.delete(session_uuid as string);
      return res(ctx.status(200), ctx.json(null));
    } else {
      return res(ctx.status(404), ctx.json(null));
    }
  }),

  rest.get(mockURL("/session/status"), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        entries: Array.from(sessions),
      })
    );
  }),

  rest.post(mockURL("/session/encode"), (req, res, ctx) => {
    const resBody = req.body as z.infer<typeof requestPostEncode>;
    const length = resBody.sequences.length;

    if (!sessions.has(resBody.session_uuid)) {
      return res(
        ctx.status(400),
        ctx.json({
          error: "session error",
        })
      );
    }

    if (length === 0) {
      return res(
        ctx.status(400),
        ctx.json({
          error: "input error",
        })
      );
    }

    // generate random codes
    return res(
      ctx.status(200),
      ctx.json({
        coords_x: Array.from({ length }, () => randomNormal()),
        coords_y: Array.from({ length }, () => randomNormal()),
      })
    );
  }),

  rest.post(mockURL("/session/decode"), (req, res, ctx) => {
    const resBody = req.body as z.infer<typeof requestPostDecode>;
    const length = resBody.coords_x.length;

    if (!sessions.has(resBody.session_uuid)) {
      return res(
        ctx.status(400),
        ctx.json({
          error: "session error",
        })
      );
    }

    if (length === 0) {
      return res(
        ctx.status(400),
        ctx.json({
          error: "input error",
        })
      );
    }

    // generate random sequences
    const sequences = Array.from({ length }, () => {
      let seq = "";
      for (let j = 0; j < 10; j++) {
        const char = "ATCG".charAt(Math.floor(Math.random() * 4));
        seq += char;
      }
      return seq;
    });

    return res(
      ctx.status(200),
      ctx.json({
        sequences: sequences,
      })
    );
  }),

  // cannot mock image data
  // rest.post(mockURL("/session/decode/weblogo"), (req, res, ctx) => {
  //   const resBody = req.body as z.infer<typeof requestPostWeblogo>;
  //   const length = resBody.coords.length;

  //   // return weblogo image
  //   if (length === 1) {
  //     // const weblogo = fs.readFileSync("./mock/route/asset/weblogo.png");
  //     return res(ctx.status(200), ctx.json(String(weblogo)));
  //   } else {
  //     return res(
  //       ctx.status(200),
  //       ctx.json({
  //         status: "error",
  //       })
  //     );
  //   }
  // }),
];
