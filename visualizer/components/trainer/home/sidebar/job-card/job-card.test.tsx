import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import JobCard from "./job-card";

describe("JobCard for running entries", () => {
  it("renders progress component (single)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={false}
        status={"progress"}
        series={[
          {
            id: 0,
            duration: 990,
            status: "progress",
            epochsCurrent: 492,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("492 / 1000"));
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(0);
  });

  it("renders progress component (multiple, not selected)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={false}
        status={"progress"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "success",
            epochsCurrent: 292,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 1000,
            status: "progress",
            epochsCurrent: 492,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(1);
    expect(screen.queryAllByTestId("child-job-card")[0]).toHaveTextContent(
      "492 / 1000"
    );
  });

  it("renders progress component (multiple, selected)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={true}
        status={"progress"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "success",
            epochsCurrent: 292,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 1000,
            status: "progress",
            epochsCurrent: 492,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(2);
    expect(screen.queryAllByTestId("child-job-card")[0]).toHaveTextContent(
      "success"
    );
    expect(screen.queryAllByTestId("child-job-card")[1]).toHaveTextContent(
      "492 / 1000"
    );
  });

  it("renders pending component (single)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={false}
        status={"pending"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "pending",
            epochsCurrent: 0,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(0);
  });

  it("renders pending component (multiple, not selected)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={false}
        status={"pending"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "pending",
            epochsCurrent: 292,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 1000,
            status: "pending",
            epochsCurrent: 0,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(0);
  });

  it("renders pending component (multiple, selected)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={true}
        status={"pending"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "pending",
            epochsCurrent: 292,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 1000,
            status: "pending",
            epochsCurrent: 0,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.queryAllByText("pending")).toHaveLength(3);
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(2);
    expect(screen.queryAllByTestId("child-job-card")[0]).toHaveTextContent(
      "pending"
    );
    expect(screen.queryAllByTestId("child-job-card")[1]).toHaveTextContent(
      "pending"
    );
  });

  it("renders suspend component (single)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={false}
        status={"suspend"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "suspend",
            epochsCurrent: 0,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("suspend")).toBeInTheDocument();
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(0);
  });

  it("renders suspend component (multiple, not selected)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={false}
        status={"suspend"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "success",
            epochsCurrent: 292,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 1000,
            status: "suspend",
            epochsCurrent: 0,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.queryAllByText("suspend")).toHaveLength(2);
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(1);
    expect(screen.queryAllByTestId("child-job-card")[0]).toHaveTextContent(
      "suspend"
    );
  });

  it("renders suspend component (multiple, selected)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={true}
        status={"suspend"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "success",
            epochsCurrent: 292,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 1000,
            status: "suspend",
            epochsCurrent: 0,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.queryAllByText("suspend")).toHaveLength(2);
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(2);
    expect(screen.queryAllByTestId("child-job-card")[0]).toHaveTextContent(
      "success"
    );
    expect(screen.queryAllByTestId("child-job-card")[1]).toHaveTextContent(
      "suspend"
    );
  });
});

describe("JobCard for finished entries", () => {
  it("renders success component (single)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={false}
        status={"success"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "success",
            epochsCurrent: 492,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(0);
  });

  it("renders success component (multiple, not selected)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={false}
        status={"success"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "success",
            epochsCurrent: 292,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 1000,
            status: "success",
            epochsCurrent: 492,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("success"));
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(0);
  });

  it("renders success component (multiple, selected)", () => {
    render(
      <JobCard
        name={"test"}
        isSelected={true}
        status={"success"}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "success",
            epochsCurrent: 292,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 1000,
            status: "success",
            epochsCurrent: 492,
            epochsTotal: 1000,
          },
        ]}
      />
    );
    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.queryAllByTestId("child-job-card")).toHaveLength(2);
    expect(screen.queryAllByTestId("child-job-card")[0]).toHaveTextContent(
      "success"
    );
    expect(screen.queryAllByTestId("child-job-card")[1]).toHaveTextContent(
      "success"
    );
  });
});
