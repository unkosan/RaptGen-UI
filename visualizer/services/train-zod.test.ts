import * as train from "./train-zod";
import _ from "lodash";
import { setupServer } from "msw/node";
import { handlers } from "../mock/handlers";

const server = setupServer(...handlers);

describe("train service", () => {
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("getDevices: should return success", async () => {
    const result = await train.getDevices();
    expect(result.success).toBeTruthy();
    expect(result.valid).toBeTruthy();
    if (result.success) {
      expect(result.data).toEqual([
        "cpu",
        "cuda:0",
        "cuda:1",
        "cuda:2",
        "cuda:3",
      ]);
    }
  });

  it("postSubmit: should return success", async () => {
    const result = await train.postSubmitJob({
      type: "RaptGen",
      name: "test",
      params_preprocessing: {
        forward: "AUUGA",
        reverse: "UCAUU",
        random_region_length: 20,
        tolerance: 0,
        minimum_count: 1,
      },
      random_regions: _.times(20, () => "AAAUGAUGAAUGUAUGAGAA"),
      reiteration: 2,
      duplicates: _.times(20, () => 1),
      params_training: {
        epochs: "1",
      },
    });

    expect(result.success).toBeTruthy();
    expect(result.valid).toBeTruthy();
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("getSearchJobs: should return success", async () => {
    const result = await train.getSearchJobs({
      status: ["success", "failure"],
      search_regex: "test",
      is_multiple: false,
      type: ["RaptGen"],
    });
    expect(result.success).toBeTruthy();
    // expect(result.valid).toBeTruthy();
    if (result.success) {
      console.log(result.data);
    }
  });
});
