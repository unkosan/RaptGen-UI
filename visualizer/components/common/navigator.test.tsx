import React from "react";
import { render, screen } from "@testing-library/react";

import Navigator from "./navigator";

describe("Navigator", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Navigator currentPage="viewer" />);
    expect(baseElement).toBeTruthy();
  });
});
