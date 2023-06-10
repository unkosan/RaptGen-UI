import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import JobCard from "./JobCard";

describe("JobCard", () => {
  it("renders success component", () => {
    render(<JobCard name={"test"} status={"success"} />);
    expect(screen.getByText("success")).toBeInTheDocument();
    expect(screen.queryByText("/epoch/")).not.toBeInTheDocument();
  });

  it("renders failure component", () => {
    render(<JobCard name={"test"} status={"failure"} />);
    expect(screen.getByText("failure")).toBeInTheDocument();
    expect(screen.queryByText("/epoch/")).not.toBeInTheDocument();
  });

  it("renders pending component", () => {
    render(<JobCard name={"test"} status={"pending"} />);
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.queryByText(/epoch/)).not.toBeInTheDocument();
  });

  it("renders progress component (single)", () => {
    render(
      <JobCard
        name={"test"}
        status={"progress"}
        currentEpoch={1}
        totalEpoch={100}
        duration={10}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("epoch 1 / 100")).toBeInTheDocument();
    expect(screen.getByText(/Running for */)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders progress component (multiple)", () => {
    render(
      <JobCard
        name={"test"}
        status={"progress"}
        currentEpoch={1}
        totalEpoch={100}
        duration={10}
        multiple={{
          currentIndex: 1,
          reiteration: 10,
          totalDuration: 100,
        }}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("epoch 1 / 100")).toBeInTheDocument();
    expect(screen.queryAllByRole("progressbar")).toHaveLength(2);
    expect(screen.getByText(/Running for */)).toBeInTheDocument();
  });
});
