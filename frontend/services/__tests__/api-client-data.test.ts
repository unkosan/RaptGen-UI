import { apiClient } from "../api-client";
import { setupServer } from "msw/node";
import { handlers } from "~/mock/handlers";
import { uuids } from "~/mock/route/asset/uuids";

const server = setupServer(...handlers);

export const mockURL = (path: string) => {
  return `http://localhost:18042/api${path}`;
};

describe("data service", () => {
  // setup and teardown the mock server
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("hello", async () => {
    const res = await apiClient.hello();
    expect(res.message).toBe("OK");
  });

  it("should return VAE model names", async () => {
    const res = await apiClient.getVAEModelNames();
    expect(res.entries).toEqual([
      { uuid: uuids.vae.rapt1, name: "RAPT1" },
      { uuid: uuids.vae.rapt3, name: "RAPT3" },
    ]);
  });

  it("should return GMM model names", async () => {
    const res = await apiClient.getGMMModelNames({
      queries: {
        vae_uuid: uuids.vae.rapt1,
      },
    });
    expect(res).toEqual({
      entries: [{ uuid: uuids.gmm.rapt1, name: "num_comp_15_A" }],
    });

    const res2 = await apiClient.getGMMModelNames({
      queries: {
        vae_uuid: uuids.vae.rapt3,
      },
    });
    expect(res2).toEqual({
      entries: [{ uuid: uuids.gmm.rapt3, name: "num_comp_15_B" }],
    });
  });

  // not available in the current implementation
  // it("should return measured data names", async () => {
  //   const res = await apiClient.getMeasuredDataNames();
  //   expect(res.status).toBe("success");
  //   if (res.status === "success") {
  //     expect(res.data).toEqual(["report1.csv", "report3.csv"]);
  //   }
  // });

  it("should return VAE model parameters", async () => {
    const res = await apiClient.getVAEModelParameters({
      queries: {
        vae_uuid: uuids.vae.rapt1,
      },
    });
    expect(res.name).toBe("RAPT1");

    const res2 = await apiClient.getVAEModelParameters({
      queries: {
        vae_uuid: uuids.vae.rapt3,
      },
    });
    expect(res2.name).toBe("RAPT3");
  });

  it("should return GMM model parameters", async () => {
    const res = await apiClient.getGMMModelParameters({
      queries: {
        gmm_uuid: uuids.gmm.rapt1,
      },
    });
    expect(res.num_components).toBe(15);
    expect(res.seed).toBe(42);

    const res2 = await apiClient.getGMMModelParameters({
      queries: {
        gmm_uuid: uuids.gmm.rapt3,
      },
    });
    expect(res2.num_components).toBe(15);
    expect(res2.seed).toBe(23);
  });
});
