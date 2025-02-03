import { apiClient } from "../api-client";
import { setupServer } from "msw/node";
import { handlers } from "~/mock/handlers";
import axios from "axios";
import { uuids } from "~/mock/route/asset/uuids";
import { validate } from "uuid";

const server = setupServer(...handlers);

export const mockURL = (path: string) => {
  return `http://localhost:18042/api${path}`;
};

function isBinaryData(input: string): boolean {
  // Set a threshold for the maximum number of "control characters" allowed
  const maxControlChars = Math.ceil(input.length * 0.1); // Allowing up to 10% control characters

  let controlCharCount = 0;

  // Loop through each character in the input string
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i);

    // Check if the character is a control character
    if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
      controlCharCount++;

      // If the number of control characters exceeds the threshold, consider it binary
      if (controlCharCount > maxControlChars) {
        return true;
      }
    }
  }

  // If control characters are below the threshold, consider it plain text
  return false;
}

describe("session service", () => {
  // setup and teardown the mock server
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => {
    server.close();
  });
  afterEach(async () => {
    await axios.post(mockURL("/session/clear"));
  });

  it("hello", async () => {
    const res = await apiClient.hello();
    expect(res.message).toBe("OK");
  });

  it("should return session id", async () => {
    const res = await apiClient.startSession({
      queries: {
        vae_uuid: uuids.vae.rapt1,
      },
    });
    expect(validate(res.uuid)).toBeTruthy();
  });

  it("should finish session successfully", async () => {
    const resStart = await apiClient.startSession({
      queries: {
        vae_uuid: uuids.vae.rapt1,
      },
    });

    const resFinish = await apiClient.endSession({
      queries: {
        session_uuid: resStart.uuid,
      },
    });

    const resStatus = await apiClient.getSessionStatus();
    expect(resStatus.entries).not.toContain(resStart.uuid);
  });

  xit("should finish session with error", async () => {
    expect(async () => {
      const resStart = await apiClient.startSession({
        queries: {
          vae_uuid: uuids.vae.rapt1,
        },
      });

      const resFinish = await apiClient.endSession({
        queries: {
          session_uuid: resStart.uuid + "1",
        },
      });
    }).toThrowError();
  });

  // xit("should return session status", async () => {
  //   const resStart = await apiClient.startSession({
  //     queries: {
  //       VAE_name: "RAPT1",
  //     },
  //   });
  //   expect(resStart.status).toBe("success");
  //   if (resStart.status === "success") {
  //     expect(resStart.data).toBeGreaterThan(1000000);
  //   } else {
  //     return false;
  //   }

  //   const resStatus = await apiClient.getSessionStatus();
  //   expect(resStatus.status).toBe("success");
  //   if (resStatus.status === "success") {
  //     expect(resStatus.data).toEqual([resStart.data]);
  //   }
  // });

  it("should return encoded codes", async () => {
    const resStart = await apiClient.startSession({
      queries: {
        vae_uuid: uuids.vae.rapt1,
      },
    });

    const resEncode = await apiClient.encode({
      session_uuid: resStart.uuid,
      sequences: ["ATCG", "AAGG", "GGGC"],
    });

    expect(resEncode.coords_x).toBeInstanceOf(Array);
    expect(resEncode.coords_y).toBeInstanceOf(Array);
  });

  xit("should not return encoded codes", async () => {
    expect(async () => {
      const resStart = await apiClient.startSession({
        queries: {
          vae_uuid: uuids.vae.rapt3,
        },
      });

      const resEncode = await apiClient.encode({
        session_uuid: resStart.uuid + "1",
        sequences: ["ATCG", "AAGG", "GGGC"],
      });
    }).toThrowError();
  });

  it("should return decoded sequences", async () => {
    const resStart = await apiClient.startSession({
      queries: {
        vae_uuid: uuids.vae.rapt1,
      },
    });

    const resDecode = await apiClient.decode({
      session_uuid: resStart.uuid,
      coords_x: [0.1, 0.3, 0.5],
      coords_y: [0.2, 0.4, 0.6],
    });
    expect(resDecode.sequences).toBeInstanceOf(Array);
    expect(resDecode.sequences.length).toBe(3);
    expect(typeof resDecode.sequences[0] === "string").toBe(true);
  });

  xit("should not return decoded sequences", async () => {
    expect(async () => {
      const resStart = await apiClient.startSession({
        queries: {
          vae_uuid: uuids.vae.rapt3,
        },
      });

      const resDecode = await apiClient.decode({
        session_uuid: resStart.uuid + "1",
        coords_x: [0.1, 0.3, 0.5],
        coords_y: [0.2, 0.4, 0.6],
      });
    }).toThrowError();
  });

  xit("should return weblogo image", async () => {
    const resStart = await apiClient.startSession({
      queries: {
        vae_uuid: uuids.vae.rapt1,
      },
    });

    const resWeblogo = await apiClient.getWeblogo({
      session_uuid: resStart.uuid,
      coords_x: [0.1],
      coords_y: [0.2],
    });
    expect(isBinaryData(String(resWeblogo))).toBe(true);
  });
});
