import AddJobButton from "./AddJobButton";
import JobCard from "./JobCard";
import ChildJobCard from "./job-card/child-job-card";

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
      <ChildJobCard
        name={"aloha"}
        status="progress"
        currentEpoch={341}
        totalEpoch={1000}
        duration={400}
      />
    </>
  );
};

export default SideBar;
