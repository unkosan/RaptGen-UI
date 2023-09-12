import { rest } from "msw";
// import ssFig from "./asset/secondary-structure.png";

export const mockURL = (path: string) => {
  return `http://localhost:3000/api${path}`;
};

const errorMsg = {
  error: "error",
  msg: "field not valid",
  type: "value_error.invalid_type",
};

// cannot mock image data
export const toolsHandlers = [
  //   rest.get(mockURL("/tool/secondary-structure"), async (req, res, ctx) => {
  //     const sequence = req.url.searchParams.get("sequence");
  //     if (sequence) {
  //       return res(
  //         ctx.status(200),
  //         ctx.set("Content-Type", "image/png"),
  //         ctx.json(String(ssFig))
  //       );
  //     } else {
  //       return res(
  //         ctx.status(200),
  //         ctx.json({
  //           status: "error",
  //         })
  //       );
  //     }
  //   }),
];
