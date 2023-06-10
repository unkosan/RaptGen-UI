import AddJobButton from "./AddJobButton";
import JobCard from "./JobCard";
import ChildJobCard from "./job-card/child-job-card";
import JobCardAlt from "./job-card/job-card";

const SideBar: React.FC = () => {
  return (
    <>
      <AddJobButton />
      <div style={{ height: "1rem" }} />
      <legend>Running</legend>
      <JobCard
        name={"aloha"}
        status="suspended"
        currentEpoch={341}
        totalEpoch={1000}
        duration={20}
        multiple={{
          currentIndex: 1,
          reiteration: 10,
          totalDuration: 100,
        }}
      />
      <JobCardAlt
        name={"aloha"}
        status="success"
        isSelected={true}
        duration={1500}
        series={[
          {
            id: 0,
            duration: 1000,
            status: "failure",
            epochsCurrent: 492,
            epochsTotal: 1000,
          },
          {
            id: 1,
            duration: 400,
            status: "success",
            epochsCurrent: 192,
            epochsTotal: 1000,
          },
        ]}
      />
    </>
  );
};

export default SideBar;
