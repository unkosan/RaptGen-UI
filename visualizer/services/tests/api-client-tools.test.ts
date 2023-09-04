import { altApiClient } from "../alt-api-client";
import { setupServer } from "msw/node";
import { handlers } from "../../mock/handlers";

const server = setupServer(...handlers);

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

describe("upload service", () => {
  // setup and teardown the mock server
  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("hello", async () => {
    const res = await altApiClient.hello();
    expect(res.message).toBe("OK");
  });

  it("should get secondary structure image", async () => {
    const res = await altApiClient.getSecondaryStructureImage({
      queries: {
        sequence: "AAUG",
      },
    });

    expect(isBinaryData(String(res))).toBe(true);
  });
});
