import { rest } from "msw";
import fs from "fs";

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
};

const errorMsg = {
  error: "error",
  msg: "field not valid",
  type: "value_error.invalid_type",
};

export const toolsHandlers = [
  rest.get(mockURL("/tool/secondary-structure"), (req, res, ctx) => {
    const sequence = req.url.searchParams.get("sequence");
    if (sequence) {
      const image = fs.readFileSync("./mock/route/ss.png");
      return res(ctx.status(200), ctx.json(String(image)));
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
