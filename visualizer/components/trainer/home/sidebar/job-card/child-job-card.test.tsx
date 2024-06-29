import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import ChildJobCard from "./child-job-card";

describe("ChildJobCard", () => {
  it("renders progress component 100 sec", () => {
    render(
      <ChildJobCard
        name={"test"}
        status={"progress"}
        totalEpoch={1000}
        currentEpoch={442}
        duration={100 * 1000}
      />
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("442 / 1000"));
    expect(screen.getByText("Running for 1 minute 40 seconds"));
    expect(screen.queryByText("progress")).not.toBeInTheDocument();
  });
  it("renders progress component 10000 sec", () => {
    render(
      <ChildJobCard
        name={"test"}
        status={"progress"}
        totalEpoch={1000}
        currentEpoch={442}
        duration={10000 * 1000}
      />
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("442 / 1000"));
    expect(screen.getByText("Running for 2 hours 46 minutes 40 seconds"));
  });

  it("renders failure component", () => {
    render(<ChildJobCard name={"test"} status={"failure"} />);
    expect(screen.getByText("failure")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders success component", () => {
    render(<ChildJobCard name={"test"} status={"success"} />);
    expect(screen.getByText("success")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders pending component", () => {
    render(<ChildJobCard name={"test"} status={"pending"} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders suspend component", () => {
    render(
      <ChildJobCard
        name={"test"}
        status={"suspend"}
        totalEpoch={1000}
        currentEpoch={442}
        duration={10000}
      />
    );
    expect(screen.getByText("suspend")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("442 / 1000"));
  });
});
