import { rest } from "msw";

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
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
];
