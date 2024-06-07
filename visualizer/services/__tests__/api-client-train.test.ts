import { apiClient } from "../api-client";
import _ from "lodash";
import { setupServer } from "msw/node";
import { handlers } from "~/mock/handlers";

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

const server = setupServer(...handlers);

describe("train service", () => {
  // setup and teardown server
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("hello", async () => {
    const result = await apiClient.hello();
    expect(result.message).toEqual("OK");
  });

  it("getDevices", async () => {
    const devices = await apiClient.getDevices();
    expect(devices[0]).toEqual("cpu");
  });

  it("postSubmitJob", async () => {
    const result = await apiClient.postSubmitJob({
      type: "RaptGen",
      name: "test",
      random_regions: ["AAUGA", "AGAGA", "AUGAG"],
      params_preprocessing: {
        forward: "AAAAA",
        reverse: "TTTTT",
        random_region_length: 5,
        tolerance: 0,
        minimum_count: 1,
      },
      duplicates: [1, 2, 3],
      reiteration: 1,
      params_training: {
        model_length: 20,
        epochs: 1000,
        match_forcing_duration: 50,
        beta_duration: 50,
        early_stopping: 50,
        seed_value: 0,
        match_cost: 4,
        device: "cpu",
      },
    });
    expect(result).toHaveProperty("uuid");
  });

  // wakaran
  it("postSearchJobs", async () => {
    const result = await apiClient.postSearchJobs({
      status: ["progress"],
      search_regex: "test",
      is_multiple: true,
      type: ["RaptGen"],
    });
    expect(result[0].uuid).toEqual(uuids.test1);
  });

  it("getItem", async () => {
    const result = await apiClient.getItem({
      params: {
        parent_uuid: uuids.test1,
      },
    });
    expect(result.uuid).toEqual(uuids.test1);
  });

  it("getChildItem", async () => {
    const result = await apiClient.getChildItem({
      params: {
        parent_uuid: uuids.test1,
        child_id: 0,
      },
    });
    expect(result.uuid).toEqual(uuids.test1);
    expect(result.id).toEqual(0);
  });

  it("deleteItem", async () => {
    const result = await apiClient.deleteItem(undefined, {
      params: {
        parent_uuid: uuids.test1,
      },
    });
    expect(result).toBe(null);
  });

  it("postKill", async () => {
    const result = await apiClient.postKill({
      uuid: uuids.test1,
    });
    expect(result).toBe(null);
  });

  it("postSuspend", async () => {
    const result = await apiClient.postSuspend({
      uuid: uuids.test1,
    });
    expect(result).toBe(null);
  });

  it("postResume", async () => {
    const result = await apiClient.postResume({
      uuid: uuids.test1,
    });
    expect(result).toBe(null);
  });

  it("postPublish", async () => {
    const result = await apiClient.postPublish({
      uuid: uuids.test1,
      multi: 0,
    });
    expect(result).toBe(null);
  });
});
