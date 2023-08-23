import { altApiClient } from "./alt-api-client";
import { setupServer } from "msw/node";
import { handlers } from "../mock/handlers";

const server = setupServer(...handlers);

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
};

describe("data service", () => {
  // setup and teardown the mock server
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("hello", async () => {
    const res = await altApiClient.hello();
    expect(res.message).toBe("OK");
  });

  it("should return VAE model names", async () => {
    const res = await altApiClient.getVAEModelNames();
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data).toEqual(["RAPT1", "RAPT3"]);
    }
  });

  it("should return GMM model names", async () => {
    const res = await altApiClient.getGMMModelNames({
      queries: {
        VAE_model_name: "RAPT1",
      },
    });
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data).toEqual(["num_comp_15_A"]);
    }

    const res2 = await altApiClient.getGMMModelNames({
      queries: {
        VAE_model_name: "RAPT3",
      },
    });
    expect(res2.status).toBe("success");
    if (res2.status === "success") {
      expect(res2.data).toEqual(["num_comp_15_B"]);
    }
  });

  it("should return measured data names", async () => {
    const res = await altApiClient.getMeasuredDataNames();
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data).toEqual(["report1.csv", "report3.csv"]);
    }
  });

  it("should return VAE model parameters", async () => {
    const res = await altApiClient.getVAEModelParameters({
      queries: {
        VAE_model_name: "RAPT1",
      },
    });
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data.experiment).toBe("RAPT1");
    }

    const res2 = await altApiClient.getVAEModelParameters({
      queries: {
        VAE_model_name: "RAPT3",
      },
    });
    expect(res2.status).toBe("success");
    if (res2.status === "success") {
      expect(res2.data.experiment).toBe("RAPT3");
    }
  });

  it("should return GMM model parameters", async () => {
    const res = await altApiClient.getGMMModelParameters({
      queries: {
        VAE_model_name: "RAPT1",
        GMM_model_name: "num_comp_15_A",
      },
    });
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data.GMM_num_components).toBe(15);
      expect(res.data.GMM_seed).toBe(42);
    }

    const res2 = await altApiClient.getGMMModelParameters({
      queries: {
        VAE_model_name: "RAPT3",
        GMM_model_name: "num_comp_15_B",
      },
    });
    expect(res2.status).toBe("success");
    if (res2.status === "success") {
      expect(res2.data.GMM_num_components).toBe(15);
      expect(res2.data.GMM_seed).toBe(23);
    }
  });
});
