import * as train from "./train";
import _ from "lodash";
import { setupServer } from "msw/node";
import { handlers } from "../mock/handlers";

const server = setupServer(...handlers);

describe("train service", () => {
  // setup and teardown server
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("getDevices: should return success", async () => {
    const result = await train.getDevices();
    expect(result.success).toBeTruthy();
  });

  it("postSubmit: should return success", async () => {
    const result = await train.postSubmit({
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
  });

  it("getSearch: should return success", async () => {
    const result = await train.getSearch({
      status: ["success", "failure"],
      search_regex: "test",
      is_multiple: false,
      type: ["RaptGen"],
    });
    expect(result.success).toBeTruthy();
  });

  it("getItem: should return success", async () => {
    const result = await train.getItem({
      uuid: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
      number: 1,
    });
    expect(result.success).toBeTruthy();
  });

  it("patchItem: should return success", async () => {
    const result = await train.patchItem(
      {
        uuid: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
      },
      [
        {
          target: "name",
          value: "test",
        },
      ]
    );
    expect(result.success).toBeTruthy();
  });

  it("deleteItem: should return success", async () => {
    const result = await train.deleteItem({
      uuid: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
    });
    expect(result.success).toBeTruthy();
  });

  it("postKill: should return success", async () => {
    const result = await train.postKill({
      uuid: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
    });
    expect(result.success).toBeTruthy();
  });

  it("postSuspend: should return success", async () => {
    const result = await train.postSuspend({
      uuid: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
    });
    expect(result.success).toBeTruthy();
  });

  it("postResume: should return success", async () => {
    const result = await train.postResume({
      uuid: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
    });
    expect(result.success).toBeTruthy();
  });

  it("postPublish: should return success", async () => {
    const result = await train.postPublish({
      uuid: "18b1e0e0-5b1e-4b1e-8b1e-0e5b1e4b1e8b",
    });
    expect(result.success).toBeTruthy();
  });
});
