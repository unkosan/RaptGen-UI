import { apiClient } from "../api-client";
import fs from "fs";
// import { setupServer } from "msw/node";
// import { handlers } from "~/mock/handlers";
// import axios from "axios";

// const server = setupServer(...handlers);

describe("upload service", () => {
  // MSW does not work with axios. causes "Error: Write after end"
  // instead, use the backend server directly
  // this test needs jsdom environment to work successfully

  xit("hello", async () => {
    const res = await apiClient.hello();
    expect(res.message).toBe("OK");
  });

  xit("should validate VAE model", async () => {
    const buf = fs.readFileSync("./services/tests/VAE_model.pkl");
    const vaeModel = new File([buf], "VAE_model.pkl");

    const res = await apiClient.validatepHMMModel({
      state_dict: vaeModel,
    });

    expect(res.status).toBe("success");
  });

  xit("should validate GMM model", async () => {
    const buf = fs.readFileSync("./services/tests/GMM_model.pkl");
    const gmmModel = new File([buf], "GMM_model.pkl");

    const res = await apiClient.validateGMMModel({
      gmm_data: gmmModel,
    });

    expect(res.status).toBe("success");
  });

  xit("should upload VAE model", async () => {
    const buf = fs.readFileSync("./services/tests/VAE_model.pkl");
    const vaeModel = new File([buf], "VAE_model.pkl");

    const res = await apiClient.uploadVAE({
      model: vaeModel,
      model_name: "test",
      forward_adapter: "A",
      reverse_adapter: "G",
      target_length: 4,
      sequences: ["AAUG", "AGGG"],
      coord_x: [0.1, 0.2],
      coord_y: [0.3, 0.4],
      duplicates: [1, 2],
    });

    expect(res.status).toBe("success");
  });

  xit("should upload GMM model", async () => {
    const buf = fs.readFileSync("./services/tests/GMM_model.pkl");
    const gmmModel = new File([buf], "GMM_model.pkl");

    const res = await apiClient.uploadGMM({
      model: gmmModel,
      VAE_model_name: "vae",
      GMM_model_name: "gmm",
    });

    expect(res.status).toBe("success");
  });

  xit("should request batch-encoding successfully", async () => {
    const buf = fs.readFileSync("./services/tests/VAE_model.pkl");
    const vaeModel = new File([buf], "VAE_model.pkl");

    const res = await apiClient.batchEncode({
      state_dict: vaeModel,
      seqs: ["AAUG", "AGGG"],
    });

    expect(res.status).toBe("success");
  });

  xit("should get correct status on batch-encoding", async () => {
    const buf = fs.readFileSync("./services/tests/VAE_model.pkl");
    const vaeModel = new File([buf], "VAE_model.pkl");

    const resPost = await apiClient.batchEncode({
      state_dict: vaeModel,
      seqs: ["AAUG", "AGGG"],
    });
    expect(resPost.status).toBe("success");

    if (resPost.status !== "success") {
      throw new Error("batch-encoding failed");
    }

    const resGet = await apiClient.getBatchEncodeStatus({
      queries: {
        task_id: resPost.data.task_id,
      },
    });
    expect(resGet.state).toBe("PENDING");

    // // wait for 30 second
    // await new Promise((resolve) => setTimeout(resolve, 30000));

    // const resGet2 = await apiClient.getBatchEncodeStatus({
    //   queries: {
    //     task_id: resPost.data.task_id,
    //   },
    // });
    // expect(resGet2.state).toBe("SUCCESS");
  }, 40000);

  xit("should kill batch-encoding task", async () => {
    const buf = fs.readFileSync("./services/tests/VAE_model.pkl");
    const vaeModel = new File([buf], "VAE_model.pkl");

    const resPost = await apiClient.batchEncode({
      state_dict: vaeModel,
      seqs: ["AAUG", "AGGG"],
    });
    expect(resPost.status).toBe("success");

    if (resPost.status !== "success") {
      throw new Error("batch-encoding failed");
    }

    const resKill = await apiClient.batchEncodeKill(undefined, {
      queries: {
        task_id: resPost.data.task_id,
      },
    });
    expect(resKill.state).toBe("success");
  });
});
