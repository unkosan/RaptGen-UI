import { altApiClient } from "../alt-api-client";
import { setupServer } from "msw/node";
import { handlers } from "../../mock/handlers";
import axios from "axios";

const server = setupServer(...handlers);

export const mockURL = (path: string) => {
  return `http://localhost:8000/api${path}`;
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
    const res = await altApiClient.hello();
    expect(res.message).toBe("OK");
  });

  it("should return session id", async () => {
    const res = await altApiClient.startSession({
      queries: {
        VAE_name: "RAPT1",
      },
    });
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data).toBeGreaterThan(1000000);
    }
  });

  it("should finish session successfully", async () => {
    const resStart = await altApiClient.startSession({
      queries: {
        VAE_name: "RAPT1",
      },
    });
    expect(resStart.status).toBe("success");
    if (resStart.status === "success") {
      expect(resStart.data).toBeGreaterThan(1000000);
    } else {
      throw new Error("Failed to start session");
    }

    const resFinish = await altApiClient.endSession({
      queries: {
        session_id: resStart.data,
      },
    });
    expect(resFinish.status).toBe("success");
  });

  it("should finish session with error", async () => {
    const resStart = await altApiClient.startSession({
      queries: {
        VAE_name: "RAPT1",
      },
    });
    if (resStart.status === "success") {
      expect(resStart.data).toBeGreaterThan(1000000);
    } else {
      throw new Error("Failed to start session");
    }

    const resFinish = await altApiClient.endSession({
      queries: {
        session_id: resStart.data + 1,
      },
    });
    expect(resFinish.status).toBe("error");
  });

  // it("should return session status", async () => {
  //   const resStart = await altApiClient.startSession({
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

  //   const resStatus = await altApiClient.getSessionStatus();
  //   expect(resStatus.status).toBe("success");
  //   if (resStatus.status === "success") {
  //     expect(resStatus.data).toEqual([resStart.data]);
  //   }
  // });

  it("should return encoded codes", async () => {
    const resStart = await altApiClient.startSession({
      queries: {
        VAE_name: "RAPT1",
      },
    });
    expect(resStart.status).toBe("success");
    if (resStart.status === "success") {
      expect(resStart.data).toBeGreaterThan(1000000);
    } else {
      throw new Error("Failed to start session");
    }

    const resEncode = await altApiClient.encode({
      session_id: resStart.data,
      sequences: ["ATCG", "AAGG", "GGGC"],
    });
    expect(resEncode.status).toBe("success");
  });

  it("should not return encoded codes", async () => {
    const resStart = await altApiClient.startSession({
      queries: {
        VAE_name: "RAPT3",
      },
    });
    expect(resStart.status).toBe("success");
    if (resStart.status === "success") {
      expect(resStart.data).toBeGreaterThan(1000000);
    } else {
      throw new Error("Failed to start session");
    }

    const resEncode = await altApiClient.encode({
      session_id: resStart.data + 1,
      sequences: ["ATCG", "AAGG", "GGGC"],
    });
    expect(resEncode.status).toBe("error");
  });

  it("should return decoded sequences", async () => {
    const resStart = await altApiClient.startSession({
      queries: {
        VAE_name: "RAPT1",
      },
    });
    expect(resStart.status).toBe("success");
    if (resStart.status === "success") {
      expect(resStart.data).toBeGreaterThan(1000000);
    } else {
      throw new Error("Failed to start session");
    }

    const resDecode = await altApiClient.decode({
      session_id: resStart.data,
      coords: [
        {
          coord_x: 0.1,
          coord_y: 0.2,
        },
        {
          coord_x: 0.3,
          coord_y: 0.4,
        },
        {
          coord_x: 0.5,
          coord_y: 0.6,
        },
      ],
    });
    expect(resDecode.status).toBe("success");
    if (resDecode.status === "success") {
      expect(resDecode.data).toBeInstanceOf(Array);
      expect(resDecode.data.length).toBe(3);
      expect(typeof resDecode.data[0] === "string").toBe(true);
    }
  });

  it("should not return decoded sequences", async () => {
    const resStart = await altApiClient.startSession({
      queries: {
        VAE_name: "RAPT3",
      },
    });
    expect(resStart.status).toBe("success");
    if (resStart.status === "success") {
      expect(resStart.data).toBeGreaterThan(1000000);
    } else {
      throw new Error("Failed to start session");
    }

    const resDecode = await altApiClient.decode({
      session_id: resStart.data + 1,
      coords: [
        {
          coord_x: 0.1,
          coord_y: 0.2,
        },
        {
          coord_x: 0.3,
          coord_y: 0.4,
        },
        {
          coord_x: 0.5,
          coord_y: 0.6,
        },
      ],
    });
    expect(resDecode.status).toBe("error");
  });

  it("should return weblogo image", async () => {
    const resStart = await altApiClient.startSession({
      queries: {
        VAE_name: "RAPT1",
      },
    });
    expect(resStart.status).toBe("success");
    if (resStart.status === "success") {
      expect(resStart.data).toBeGreaterThan(1000000);
    } else {
      throw new Error("Failed to start session");
    }

    const resWeblogo = await altApiClient.getWeblogo({
      session_id: resStart.data,
      coords: [
        {
          coord_x: 0.1,
          coord_y: 0.2,
        },
      ],
    });
    expect(isBinaryData(String(resWeblogo))).toBe(true);
  });
});
